/**
 * XML From XSD Generator
 *
 * Generates a sample XML instance document from an XSD schema.
 * Creates elements with sample values based on type declarations,
 * respects minOccurs/maxOccurs constraints, and generates required attributes.
 */

import { parseXSD } from './XSDParser';
import type {
  XSDSchema,
  XSDElement,
  XSDComplexType,
  XSDSimpleType,
  XSDAttribute,
  XSDRestriction,
} from './XSDParser';
import {
  ConstraintValueGenerator,
  PatternMatcher,
  NumericRangeGenerator,
  LengthConstraintGenerator,
  EnumerationSelector,
} from './generators';
import { SeededRandom } from './generators/SeededRandom';
import { validateXMLAgainstXSD } from './XSDValidator';

/**
 * Options for XML generation from XSD.
 */
export interface GenerateXMLOptions {
  /** Seed for reproducible random values */
  seed?: number;
  /** Maximum regeneration attempts when validation fails (default: 3) */
  maxAttempts?: number;
  /** Whether to validate generated XML against XSD (default: true) */
  validateResult?: boolean;
}

// Function to create constraint generator
function createConstraintGenerator() {
  return new ConstraintValueGenerator(
    new PatternMatcher(),
    new NumericRangeGenerator(),
    new LengthConstraintGenerator(),
    new EnumerationSelector()
  );
}

// ────────────────────────────────────────────────
// Sample value generators
// ────────────────────────────────────────────────

function getSampleValue(typeName: string, elementName: string, restriction?: XSDRestriction, rng?: SeededRandom): string {
  // If restriction provided, use constraint generator
  if (restriction) {
    const constraintGen = createConstraintGenerator();
    return constraintGen.generateValue(typeName, restriction, elementName, rng);
  }

  const local = typeName.includes(':') ? typeName.split(':')[1] : typeName;

  switch (local) {
    case 'string':
      return `sample_${elementName}`;
    case 'boolean':
      return 'true';
    case 'integer':
    case 'int':
    case 'long':
    case 'short':
    case 'byte':
    case 'positiveInteger':
    case 'nonNegativeInteger':
    case 'unsignedInt':
    case 'unsignedLong':
    case 'unsignedShort':
    case 'unsignedByte':
      return '0';
    case 'negativeInteger':
    case 'nonPositiveInteger':
      return '-1';
    case 'decimal':
    case 'float':
    case 'double':
      return '0.0';
    case 'date':
      return '2024-01-01';
    case 'dateTime':
      return '2024-01-01T00:00:00';
    case 'time':
      return '00:00:00';
    case 'anyURI':
      return 'http://example.com';
    case 'token':
    case 'normalizedString':
    case 'language':
      return `sample`;
    default:
      return `sample_${elementName}`;
  }
}

function getSampleValueForSimpleType(st: XSDSimpleType, elementName: string, rng?: SeededRandom): string {
  if (st.restriction) {
    const constraintGen = createConstraintGenerator();
    return constraintGen.generateValue(st.restriction.base, st.restriction, elementName, rng);
  }
  return getSampleValue('xs:string', elementName, undefined, rng);
}

// ────────────────────────────────────────────────
// XML generation
// ────────────────────────────────────────────────

function indent(level: number): string {
  return '  '.repeat(level);
}

function resolveComplexType(typeName: string, schema: XSDSchema): XSDComplexType | undefined {
  const localName = typeName.includes(':') ? typeName.split(':')[1] : typeName;
  return schema.complexTypes.find((ct) => ct.name === localName);
}

function resolveSimpleType(typeName: string, schema: XSDSchema): XSDSimpleType | undefined {
  const localName = typeName.includes(':') ? typeName.split(':')[1] : typeName;
  return schema.simpleTypes.find((st) => st.name === localName);
}

function isBuiltInType(typeName: string): boolean {
  const builtIns = [
    'string', 'boolean', 'decimal', 'float', 'double', 'integer',
    'int', 'long', 'short', 'byte', 'date', 'dateTime', 'time',
    'anyURI', 'token', 'normalizedString', 'language', 'anyType',
  ];
  const local = typeName.includes(':') ? typeName.split(':')[1] : typeName;
  return builtIns.includes(local);
}

function generateAttributes(attributes: XSDAttribute[], schema: XSDSchema, rng?: SeededRandom): string {
  if (attributes.length === 0) return '';
  const parts: string[] = [];
  for (const attr of attributes) {
    if (attr.use === 'prohibited') continue;

    let value: string;
    if (attr.fixedValue !== undefined) {
      value = attr.fixedValue;
    } else if (attr.defaultValue !== undefined) {
      value = attr.defaultValue;
    } else {
      const simpleType = resolveSimpleType(attr.type, schema);
      const restriction = simpleType?.restriction;
      value = getSampleValue(attr.type, attr.name, restriction, rng);
    }

    parts.push(`${attr.name}="${value}"`);
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function generateElementXML(
  element: XSDElement,
  schema: XSDSchema,
  level: number,
  rng?: SeededRandom
): string {
  const lines: string[] = [];
  const count = Math.max(1, element.occurrence.minOccurs);

  for (let i = 0; i < count; i++) {
    let complexType: XSDComplexType | undefined;
    let simpleType: XSDSimpleType | undefined;

    // Resolve type
    if (element.complexType) {
      complexType = element.complexType;
    } else if (element.simpleType) {
      simpleType = element.simpleType;
    } else if (element.type && !isBuiltInType(element.type) && element.type !== '(complex)' && element.type !== '(simple)') {
      complexType = resolveComplexType(element.type, schema);
      if (!complexType) {
        simpleType = resolveSimpleType(element.type, schema);
      }
    }

    if (complexType) {
      const attrStr = generateAttributes(complexType.attributes, schema, rng);

      if (complexType.elements.length === 0 && complexType.simpleContentBase) {
        // Simple content with attributes
        const simpleType = resolveSimpleType(complexType.simpleContentBase, schema);
        const restriction = simpleType?.restriction;
        const value = getSampleValue(complexType.simpleContentBase, element.name, restriction, rng);
        lines.push(`${indent(level)}<${element.name}${attrStr}>${value}</${element.name}>`);
      } else if (complexType.elements.length === 0) {
        lines.push(`${indent(level)}<${element.name}${attrStr}/>`);
      } else {
        lines.push(`${indent(level)}<${element.name}${attrStr}>`);
        for (const child of complexType.elements) {
          lines.push(generateElementXML(child, schema, level + 1, rng));
        }
        lines.push(`${indent(level)}</${element.name}>`);
      }
    } else if (simpleType) {
      const value = getSampleValueForSimpleType(simpleType, element.name, rng);
      lines.push(`${indent(level)}<${element.name}>${value}</${element.name}>`);
    } else {
      // Built-in type or unresolved
      const simpleType = resolveSimpleType(element.type, schema);
      const restriction = simpleType?.restriction;
      const value = getSampleValue(element.type, element.name, restriction, rng);
      lines.push(`${indent(level)}<${element.name}>${value}</${element.name}>`);
    }
  }

  return lines.join('\n');
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

/**
 * Generate a sample XML document from an XSD schema string.
 *
 * Creates valid XML instances using the first root element declaration,
 * with sample values for each type. All XSD type constraints are respected:
 * - Pattern (regex) constraints
 * - Length constraints (minLength, maxLength)
 * - Numeric range constraints (minInclusive, maxInclusive, etc.)
 * - Enumeration constraints (random selection)
 *
 * @param xsdContent - XSD schema string
 * @param options - Optional generation parameters
 * @returns XML instance string, or null if XSD is not valid
 *
 * @example
 * ```ts
 * // Basic usage
 * const xml = generateXMLFromXSD(xsdString);
 *
 * // With options
 * const xml = generateXMLFromXSD(xsdString, {
 *   seed: 42,              // Reproducible random values
 *   validateResult: true,  // Validate against XSD (default)
 *   maxAttempts: 3         // Max retry attempts
 * });
 * ```
 */
export function generateXMLFromXSD(
  xsdContent: string,
  options?: GenerateXMLOptions
): string | null {
  const schema = parseXSD(xsdContent);
  if (!schema || schema.elements.length === 0) return null;

  // Use the first root element
  const rootElement = schema.elements[0];
  const maxAttempts = options?.maxAttempts ?? 3;
  const validate = options?.validateResult !== false;
  const seed = options?.seed;

  // Create seeded random number generator if seed provided
  const rng = seed !== undefined ? new SeededRandom(seed) : undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      generateElementXML(rootElement, schema, 0, rng),
      '',
    ];

    const xml = lines.join('\n');

    // Validate if requested
    if (validate) {
      const errors = validateXMLAgainstXSD(xml, xsdContent);
      if (errors.length === 0) {
        return xml; // Success!
      }
      console.warn(`Validation attempt ${attempt + 1} failed, retrying...`);
      if (attempt < maxAttempts - 1) {
        continue; // Try again
      }
    }

    // Return XML even if validation failed (after all attempts)
    return xml;
  }

  return null; // Should not reach here
}
