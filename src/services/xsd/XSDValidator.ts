/**
 * XSD Validator
 *
 * Validates XML documents against a parsed XSD schema model.
 * Performs structural validation: checks element names, required attributes,
 * child element presence, and simple type constraints.
 */

import { parseXSD } from './XSDParser';
import type {
  XSDSchema,
  XSDElement,
  XSDComplexType,
  XSDSimpleType,
  XSDAttribute,
} from './XSDParser';
import type { ValidationError } from '@/types';

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

/** Resolve a type name to a complexType from the schema */
function resolveComplexType(
  typeName: string,
  schema: XSDSchema
): XSDComplexType | undefined {
  // Strip namespace prefix
  const localName = typeName.includes(':') ? typeName.split(':')[1] : typeName;
  return schema.complexTypes.find((ct) => ct.name === localName);
}

/** Resolve a type name to a simpleType from the schema */
function resolveSimpleType(
  typeName: string,
  schema: XSDSchema
): XSDSimpleType | undefined {
  const localName = typeName.includes(':') ? typeName.split(':')[1] : typeName;
  return schema.simpleTypes.find((st) => st.name === localName);
}

/** Find an element declaration in a list by name */
function findElementDecl(
  name: string,
  elements: XSDElement[]
): XSDElement | undefined {
  return elements.find((e) => e.name === name);
}

/** Check if a type is a built-in XSD type */
function isBuiltInType(typeName: string): boolean {
  const builtIns = [
    'string', 'boolean', 'decimal', 'float', 'double', 'integer',
    'int', 'long', 'short', 'byte', 'positiveInteger', 'negativeInteger',
    'nonPositiveInteger', 'nonNegativeInteger', 'unsignedLong', 'unsignedInt',
    'unsignedShort', 'unsignedByte', 'date', 'dateTime', 'time', 'duration',
    'gYear', 'gMonth', 'gDay', 'gYearMonth', 'gMonthDay',
    'hexBinary', 'base64Binary', 'anyURI', 'QName', 'NOTATION',
    'normalizedString', 'token', 'language', 'NMTOKEN', 'NMTOKENS',
    'Name', 'NCName', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES',
    'anyType', 'anySimpleType',
  ];
  const local = typeName.includes(':') ? typeName.split(':')[1] : typeName;
  return builtIns.includes(local);
}

/** Get line number for a DOM node (approximate via counting preceding text) */
function getLineNumber(node: Node, xmlString: string): number {
  // Use the node's textContent position as a rough approximation
  const nodeName =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element).tagName : '';
  if (!nodeName) return 1;

  const tagPattern = `<${nodeName}`;
  const index = xmlString.indexOf(tagPattern);
  if (index === -1) return 1;

  const upToHere = xmlString.substring(0, index);
  return upToHere.split('\n').length;
}

// ────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────

function validateElement(
  xmlEl: Element,
  schemaEl: XSDElement,
  schema: XSDSchema,
  xmlString: string,
  errors: ValidationError[]
): void {
  const line = getLineNumber(xmlEl, xmlString);

  // Determine the complex/simple type to validate against
  let complexType: XSDComplexType | undefined;
  let simpleType: XSDSimpleType | undefined;

  if (schemaEl.complexType) {
    complexType = schemaEl.complexType;
  } else if (schemaEl.simpleType) {
    simpleType = schemaEl.simpleType;
  } else if (schemaEl.type && !isBuiltInType(schemaEl.type)) {
    complexType = resolveComplexType(schemaEl.type, schema);
    if (!complexType) {
      simpleType = resolveSimpleType(schemaEl.type, schema);
    }
  }

  // Validate attributes
  if (complexType) {
    validateAttributes(xmlEl, complexType.attributes, line, errors);
    validateChildElements(xmlEl, complexType.elements, schema, xmlString, errors);
  }

  // Validate text content against simple type
  if (simpleType && simpleType.restriction) {
    const textContent = xmlEl.textContent || '';
    validateSimpleValue(textContent, simpleType, line, xmlEl.tagName, errors);
  }
}

function validateAttributes(
  xmlEl: Element,
  declaredAttrs: XSDAttribute[],
  line: number,
  errors: ValidationError[]
): void {
  // Check required attributes are present
  for (const attrDecl of declaredAttrs) {
    if (attrDecl.use === 'required') {
      if (!xmlEl.hasAttribute(attrDecl.name)) {
        errors.push({
          line,
          column: 1,
          message: `Missing required attribute "${attrDecl.name}" on element <${xmlEl.tagName}>`,
          severity: 'error',
        });
      }
    }
    if (attrDecl.use === 'prohibited') {
      if (xmlEl.hasAttribute(attrDecl.name)) {
        errors.push({
          line,
          column: 1,
          message: `Prohibited attribute "${attrDecl.name}" found on element <${xmlEl.tagName}>`,
          severity: 'error',
        });
      }
    }
  }

  // Check for undeclared attributes (warning, not error)
  const declaredNames = new Set(declaredAttrs.map((a) => a.name));
  for (let i = 0; i < xmlEl.attributes.length; i++) {
    const attr = xmlEl.attributes[i];
    // Skip namespace declarations
    if (attr.name.startsWith('xmlns')) continue;
    if (!declaredNames.has(attr.name)) {
      errors.push({
        line,
        column: 1,
        message: `Unexpected attribute "${attr.name}" on element <${xmlEl.tagName}>`,
        severity: 'warning',
      });
    }
  }
}

function validateChildElements(
  xmlEl: Element,
  declaredElements: XSDElement[],
  schema: XSDSchema,
  xmlString: string,
  errors: ValidationError[]
): void {
  const line = getLineNumber(xmlEl, xmlString);

  // Count occurrences of each child element
  const childCounts = new Map<string, number>();
  const childElements: Element[] = [];

  for (let i = 0; i < xmlEl.children.length; i++) {
    const child = xmlEl.children[i];
    childElements.push(child);
    const name = child.localName;
    childCounts.set(name, (childCounts.get(name) || 0) + 1);
  }

  // Check declared elements constraints
  for (const decl of declaredElements) {
    const count = childCounts.get(decl.name) || 0;

    // Check minOccurs
    if (count < decl.occurrence.minOccurs) {
      errors.push({
        line,
        column: 1,
        message: `Element <${xmlEl.tagName}> requires at least ${decl.occurrence.minOccurs} <${decl.name}> child element(s), found ${count}`,
        severity: 'error',
      });
    }

    // Check maxOccurs
    if (
      decl.occurrence.maxOccurs !== 'unbounded' &&
      count > decl.occurrence.maxOccurs
    ) {
      errors.push({
        line,
        column: 1,
        message: `Element <${xmlEl.tagName}> allows at most ${decl.occurrence.maxOccurs} <${decl.name}> child element(s), found ${count}`,
        severity: 'error',
      });
    }
  }

  // Check for undeclared child elements
  const declaredNames = new Set(declaredElements.map((e) => e.name));
  for (const child of childElements) {
    if (!declaredNames.has(child.localName)) {
      const childLine = getLineNumber(child, xmlString);
      errors.push({
        line: childLine,
        column: 1,
        message: `Unexpected element <${child.localName}> inside <${xmlEl.tagName}>`,
        severity: 'error',
      });
    } else {
      // Recursively validate
      const childDecl = findElementDecl(child.localName, declaredElements);
      if (childDecl) {
        validateElement(child, childDecl, schema, xmlString, errors);
      }
    }
  }
}

function validateSimpleValue(
  value: string,
  simpleType: XSDSimpleType,
  line: number,
  elementName: string,
  errors: ValidationError[]
): void {
  const r = simpleType.restriction;
  if (!r) return;

  // Enumeration check
  if (r.enumerations && r.enumerations.length > 0) {
    if (!r.enumerations.includes(value)) {
      errors.push({
        line,
        column: 1,
        message: `Value "${value}" for <${elementName}> is not in allowed values: [${r.enumerations.join(', ')}]`,
        severity: 'error',
      });
    }
  }

  // Pattern check
  if (r.pattern) {
    try {
      const regex = new RegExp(`^${r.pattern}$`);
      if (!regex.test(value)) {
        errors.push({
          line,
          column: 1,
          message: `Value "${value}" for <${elementName}> does not match pattern "${r.pattern}"`,
          severity: 'error',
        });
      }
    } catch {
      // Invalid regex pattern in XSD — skip
    }
  }

  // Length checks
  if (r.minLength !== undefined && value.length < r.minLength) {
    errors.push({
      line,
      column: 1,
      message: `Value for <${elementName}> is too short (min length: ${r.minLength})`,
      severity: 'error',
    });
  }
  if (r.maxLength !== undefined && value.length > r.maxLength) {
    errors.push({
      line,
      column: 1,
      message: `Value for <${elementName}> is too long (max length: ${r.maxLength})`,
      severity: 'error',
    });
  }

  // Numeric range checks
  const numVal = parseFloat(value);
  if (!isNaN(numVal)) {
    if (r.minInclusive !== undefined && numVal < r.minInclusive) {
      errors.push({
        line,
        column: 1,
        message: `Value ${numVal} for <${elementName}> is below minimum ${r.minInclusive}`,
        severity: 'error',
      });
    }
    if (r.maxInclusive !== undefined && numVal > r.maxInclusive) {
      errors.push({
        line,
        column: 1,
        message: `Value ${numVal} for <${elementName}> exceeds maximum ${r.maxInclusive}`,
        severity: 'error',
      });
    }
    if (r.minExclusive !== undefined && numVal <= r.minExclusive) {
      errors.push({
        line,
        column: 1,
        message: `Value ${numVal} for <${elementName}> must be greater than ${r.minExclusive}`,
        severity: 'error',
      });
    }
    if (r.maxExclusive !== undefined && numVal >= r.maxExclusive) {
      errors.push({
        line,
        column: 1,
        message: `Value ${numVal} for <${elementName}> must be less than ${r.maxExclusive}`,
        severity: 'error',
      });
    }
  }
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

/**
 * Validate XML content against an XSD schema.
 *
 * @param xmlContent - XML document string
 * @param xsdContent - XSD schema string
 * @returns Array of validation errors
 */
export function validateXMLAgainstXSD(
  xmlContent: string,
  xsdContent: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Parse the XSD
  const schema = parseXSD(xsdContent);
  if (!schema) {
    errors.push({
      line: 1,
      column: 1,
      message: 'Failed to parse XSD schema',
      severity: 'error',
    });
    return errors;
  }

  return validateXMLAgainstSchema(xmlContent, schema);
}

/**
 * Validate XML content against a pre-parsed XSD schema model.
 *
 * @param xmlContent - XML document string
 * @param schema - Parsed XSDSchema object
 * @returns Array of validation errors
 */
export function validateXMLAgainstSchema(
  xmlContent: string,
  schema: XSDSchema
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Parse XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    errors.push({
      line: 1,
      column: 1,
      message: 'XML is not well-formed: ' + (parseError.textContent || ''),
      severity: 'error',
    });
    return errors;
  }

  const rootEl = xmlDoc.documentElement;
  const rootName = rootEl.localName;

  // Find matching root element declaration
  const rootDecl = findElementDecl(rootName, schema.elements);
  if (!rootDecl) {
    errors.push({
      line: 1,
      column: 1,
      message: `Root element <${rootName}> is not declared in the schema. Expected one of: ${schema.elements.map((e) => e.name).join(', ')}`,
      severity: 'error',
    });
    return errors;
  }

  // Validate recursively
  validateElement(rootEl, rootDecl, schema, xmlContent, errors);

  return errors;
}
