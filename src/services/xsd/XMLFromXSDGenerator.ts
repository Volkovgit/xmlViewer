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
} from './XSDParser';

// ────────────────────────────────────────────────
// Sample value generators
// ────────────────────────────────────────────────

function getSampleValue(typeName: string, elementName: string): string {
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

function getSampleValueForSimpleType(st: XSDSimpleType, elementName: string): string {
  if (st.restriction) {
    // Use first enumeration if available
    if (st.restriction.enumerations && st.restriction.enumerations.length > 0) {
      return st.restriction.enumerations[0];
    }
    // Use base type
    return getSampleValue(st.restriction.base, elementName);
  }
  return getSampleValue('xs:string', elementName);
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

function generateAttributes(attributes: XSDAttribute[]): string {
  if (attributes.length === 0) return '';
  const parts: string[] = [];
  for (const attr of attributes) {
    if (attr.use === 'prohibited') continue;
    const value = attr.fixedValue || attr.defaultValue || getSampleValue(attr.type, attr.name);
    // Include required and optional attributes
    parts.push(`${attr.name}="${value}"`);
  }
  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function generateElementXML(
  element: XSDElement,
  schema: XSDSchema,
  level: number
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
      const attrStr = generateAttributes(complexType.attributes);

      if (complexType.elements.length === 0 && complexType.simpleContentBase) {
        // Simple content with attributes
        const value = getSampleValue(complexType.simpleContentBase, element.name);
        lines.push(`${indent(level)}<${element.name}${attrStr}>${value}</${element.name}>`);
      } else if (complexType.elements.length === 0) {
        lines.push(`${indent(level)}<${element.name}${attrStr}/>`);
      } else {
        lines.push(`${indent(level)}<${element.name}${attrStr}>`);
        for (const child of complexType.elements) {
          lines.push(generateElementXML(child, schema, level + 1));
        }
        lines.push(`${indent(level)}</${element.name}>`);
      }
    } else if (simpleType) {
      const value = getSampleValueForSimpleType(simpleType, element.name);
      lines.push(`${indent(level)}<${element.name}>${value}</${element.name}>`);
    } else {
      // Built-in type or unresolved
      const value = getSampleValue(element.type, element.name);
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
 * with sample values for each type.
 *
 * @param xsdContent - XSD schema string
 * @returns XML instance string, or null if XSD is not valid
 */
export function generateXMLFromXSD(xsdContent: string): string | null {
  const schema = parseXSD(xsdContent);
  if (!schema || schema.elements.length === 0) return null;

  // Use the first root element
  const rootElement = schema.elements[0];

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    generateElementXML(rootElement, schema, 0),
    '',
  ];

  return lines.join('\n');
}
