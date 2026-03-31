/**
 * XSD Schema Parser
 *
 * Parses XSD (XML Schema Definition) content into a structured in-memory model.
 * Uses DOMParser to read the XSD XML, then extracts elements, attributes,
 * complex types, and simple types into typed interfaces.
 */

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

/** Cardinality for elements / attributes */
export interface XSDOccurrence {
  minOccurs: number;
  maxOccurs: number | 'unbounded';
}

/** A restriction on a simple type (enumeration, pattern, length, etc.) */
export interface XSDRestriction {
  base: string;
  enumerations?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minInclusive?: number;
  maxInclusive?: number;
  minExclusive?: number;
  maxExclusive?: number;
}

/** Attribute definition */
export interface XSDAttribute {
  name: string;
  type: string;
  use: 'required' | 'optional' | 'prohibited';
  defaultValue?: string;
  fixedValue?: string;
}

/** Simple type (restriction / list / union) */
export interface XSDSimpleType {
  name: string;
  restriction?: XSDRestriction;
}

/** Complex type: may contain a sequence/choice/all of child elements + attributes */
export interface XSDComplexType {
  name: string;
  /** Child elements in declaration order */
  elements: XSDElement[];
  /** Attributes declared on this type */
  attributes: XSDAttribute[];
  /** Whether content is mixed (text + elements) */
  mixed: boolean;
  /** Simple content extension base type, if any */
  simpleContentBase?: string;
}

/** Top-level or nested element declaration */
export interface XSDElement {
  name: string;
  /** Built-in or named type (e.g. "xs:string", "AddressType") */
  type: string;
  /** Inline complex type (anonymous) */
  complexType?: XSDComplexType;
  /** Inline simple type (anonymous) */
  simpleType?: XSDSimpleType;
  /** Occurrence constraints */
  occurrence: XSDOccurrence;
}

/** Root schema model returned by the parser */
export interface XSDSchema {
  targetNamespace?: string;
  elements: XSDElement[];
  complexTypes: XSDComplexType[];
  simpleTypes: XSDSimpleType[];
  /** Raw XSD content for reference */
  raw: string;
}

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────

const XS_NS = 'http://www.w3.org/2001/XMLSchema';

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function childrenByTagNS(parent: Element, localName: string): Element[] {
  const result: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (child.localName === localName && child.namespaceURI === XS_NS) {
      result.push(child);
    }
  }
  return result;
}

function firstChildByTagNS(parent: Element, localName: string): Element | null {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (child.localName === localName && child.namespaceURI === XS_NS) {
      return child;
    }
  }
  return null;
}

function parseOccurrence(el: Element): XSDOccurrence {
  const minStr = el.getAttribute('minOccurs');
  const maxStr = el.getAttribute('maxOccurs');
  return {
    minOccurs: minStr !== null ? parseInt(minStr, 10) : 1,
    maxOccurs:
      maxStr === 'unbounded' ? 'unbounded' : maxStr !== null ? parseInt(maxStr, 10) : 1,
  };
}

// ────────────────────────────────────────────────
// Parser
// ────────────────────────────────────────────────

/**
 * Parse an XSD restriction element into an XSDRestriction.
 */
function parseRestriction(restrictionEl: Element): XSDRestriction {
  const base = restrictionEl.getAttribute('base') || 'xs:string';

  const enumerations: string[] = [];
  childrenByTagNS(restrictionEl, 'enumeration').forEach((e) => {
    const val = e.getAttribute('value');
    if (val !== null) enumerations.push(val);
  });

  const patternEl = firstChildByTagNS(restrictionEl, 'pattern');
  const minLenEl = firstChildByTagNS(restrictionEl, 'minLength');
  const maxLenEl = firstChildByTagNS(restrictionEl, 'maxLength');
  const minIncEl = firstChildByTagNS(restrictionEl, 'minInclusive');
  const maxIncEl = firstChildByTagNS(restrictionEl, 'maxInclusive');
  const minExcEl = firstChildByTagNS(restrictionEl, 'minExclusive');
  const maxExcEl = firstChildByTagNS(restrictionEl, 'maxExclusive');

  const restriction: XSDRestriction = { base };
  if (enumerations.length > 0) restriction.enumerations = enumerations;
  if (patternEl) restriction.pattern = patternEl.getAttribute('value') || undefined;
  if (minLenEl) restriction.minLength = parseInt(minLenEl.getAttribute('value') || '0', 10);
  if (maxLenEl) restriction.maxLength = parseInt(maxLenEl.getAttribute('value') || '0', 10);
  if (minIncEl) restriction.minInclusive = parseFloat(minIncEl.getAttribute('value') || '0');
  if (maxIncEl) restriction.maxInclusive = parseFloat(maxIncEl.getAttribute('value') || '0');
  if (minExcEl) restriction.minExclusive = parseFloat(minExcEl.getAttribute('value') || '0');
  if (maxExcEl) restriction.maxExclusive = parseFloat(maxExcEl.getAttribute('value') || '0');

  return restriction;
}

/**
 * Parse an xs:attribute element.
 */
function parseAttribute(attrEl: Element): XSDAttribute {
  return {
    name: attrEl.getAttribute('name') || '',
    type: attrEl.getAttribute('type') || 'xs:string',
    use: (attrEl.getAttribute('use') as XSDAttribute['use']) || 'optional',
    defaultValue: attrEl.getAttribute('default') || undefined,
    fixedValue: attrEl.getAttribute('fixed') || undefined,
  };
}

/**
 * Parse element children inside a sequence / choice / all compositor.
 */
function parseElementChildren(container: Element): XSDElement[] {
  const elements: XSDElement[] = [];

  // Look for direct xs:element children
  childrenByTagNS(container, 'element').forEach((el) => {
    elements.push(parseElement(el));
  });

  // Recurse into sequence / choice / all
  ['sequence', 'choice', 'all'].forEach((compositor) => {
    childrenByTagNS(container, compositor).forEach((comp) => {
      elements.push(...parseElementChildren(comp));
    });
  });

  return elements;
}

/**
 * Parse an xs:complexType element.
 */
function parseComplexType(ctEl: Element, name?: string): XSDComplexType {
  const ct: XSDComplexType = {
    name: name || ctEl.getAttribute('name') || '(anonymous)',
    elements: [],
    attributes: [],
    mixed: ctEl.getAttribute('mixed') === 'true',
  };

  // Parse child elements from sequence/choice/all
  ct.elements = parseElementChildren(ctEl);

  // Parse attributes
  childrenByTagNS(ctEl, 'attribute').forEach((a) => {
    ct.attributes.push(parseAttribute(a));
  });

  // Simple content
  const simpleContent = firstChildByTagNS(ctEl, 'simpleContent');
  if (simpleContent) {
    const extension = firstChildByTagNS(simpleContent, 'extension');
    if (extension) {
      ct.simpleContentBase = extension.getAttribute('base') || undefined;
      childrenByTagNS(extension, 'attribute').forEach((a) => {
        ct.attributes.push(parseAttribute(a));
      });
    }
  }

  // Complex content
  const complexContent = firstChildByTagNS(ctEl, 'complexContent');
  if (complexContent) {
    const extension = firstChildByTagNS(complexContent, 'extension');
    if (extension) {
      ct.elements.push(...parseElementChildren(extension));
      childrenByTagNS(extension, 'attribute').forEach((a) => {
        ct.attributes.push(parseAttribute(a));
      });
    }
  }

  return ct;
}

/**
 * Parse an xs:simpleType element.
 */
function parseSimpleType(stEl: Element, name?: string): XSDSimpleType {
  const st: XSDSimpleType = {
    name: name || stEl.getAttribute('name') || '(anonymous)',
  };

  const restrictionEl = firstChildByTagNS(stEl, 'restriction');
  if (restrictionEl) {
    st.restriction = parseRestriction(restrictionEl);
  }

  return st;
}

/**
 * Parse an xs:element declaration.
 */
function parseElement(elNode: Element): XSDElement {
  const element: XSDElement = {
    name: elNode.getAttribute('name') || '',
    type: elNode.getAttribute('type') || '',
    occurrence: parseOccurrence(elNode),
  };

  // Inline complex type
  const inlineCT = firstChildByTagNS(elNode, 'complexType');
  if (inlineCT) {
    element.complexType = parseComplexType(inlineCT, `${element.name}Type`);
    if (!element.type) element.type = '(complex)';
  }

  // Inline simple type
  const inlineST = firstChildByTagNS(elNode, 'simpleType');
  if (inlineST) {
    element.simpleType = parseSimpleType(inlineST, `${element.name}Type`);
    if (!element.type) element.type = '(simple)';
  }

  // Default type
  if (!element.type) {
    element.type = 'xs:string';
  }

  return element;
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

/**
 * Parse XSD content string into a structured XSDSchema model.
 *
 * @param xsdContent — raw XSD XML string
 * @returns XSDSchema or null if the input is not valid XML
 *
 * @example
 * ```ts
 * const schema = parseXSD(xsdString);
 * if (schema) {
 *   console.log(schema.elements);
 * }
 * ```
 */
export function parseXSD(xsdContent: string): XSDSchema | null {
  if (!xsdContent || xsdContent.trim().length === 0) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xsdContent, 'application/xml');

  // Check for parse errors
  if (doc.querySelector('parsererror')) return null;

  const root = doc.documentElement;
  if (root.localName !== 'schema') return null;

  const schema: XSDSchema = {
    targetNamespace: root.getAttribute('targetNamespace') || undefined,
    elements: [],
    complexTypes: [],
    simpleTypes: [],
    raw: xsdContent,
  };

  // Parse top-level elements
  childrenByTagNS(root, 'element').forEach((el) => {
    schema.elements.push(parseElement(el));
  });

  // Parse named complex types
  childrenByTagNS(root, 'complexType').forEach((ct) => {
    schema.complexTypes.push(parseComplexType(ct));
  });

  // Parse named simple types
  childrenByTagNS(root, 'simpleType').forEach((st) => {
    schema.simpleTypes.push(parseSimpleType(st));
  });

  return schema;
}
