/**
 * XSD Generator
 *
 * Generates an XSD schema from an XML document by analyzing its structure.
 * Infers element types from content, detects repeated/optional elements,
 * and produces a valid XSD string.
 */

// ────────────────────────────────────────────────
// Type inference helpers
// ────────────────────────────────────────────────

function inferXSDType(value: string): string {
  if (!value || value.trim().length === 0) return 'xs:string';

  const trimmed = value.trim();

  // Boolean
  if (trimmed === 'true' || trimmed === 'false') return 'xs:boolean';

  // Integer
  if (/^-?\d+$/.test(trimmed)) return 'xs:integer';

  // Decimal
  if (/^-?\d+\.\d+$/.test(trimmed)) return 'xs:decimal';

  // Date (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return 'xs:date';

  // DateTime
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) return 'xs:dateTime';

  // Time (HH:MM:SS)
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return 'xs:time';

  return 'xs:string';
}

// ────────────────────────────────────────────────
// Element analysis
// ────────────────────────────────────────────────

interface ElementInfo {
  name: string;
  /** Maps child element name → ElementInfo */
  children: Map<string, ElementInfo>;
  /** Attribute names seen on this element */
  attributes: Set<string>;
  /** Number of times this element appears as a sibling */
  occurrences: number;
  /** Whether this element has text content only (leaf) */
  isLeaf: boolean;
  /** Inferred XSD type for leaf elements */
  inferredType: string;
  /** Whether children are optional (not present in all instances) */
  childOccurrences: Map<string, { min: number; max: number }>;
  /** Total instances analyzed */
  instanceCount: number;
}

function createElementInfo(name: string): ElementInfo {
  return {
    name,
    children: new Map(),
    attributes: new Set(),
    occurrences: 1,
    isLeaf: true,
    inferredType: 'xs:string',
    childOccurrences: new Map(),
    instanceCount: 0,
  };
}

function analyzeElement(el: Element, info: ElementInfo): void {
  info.instanceCount++;

  // Collect attributes
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (!attr.name.startsWith('xmlns')) {
      info.attributes.add(attr.name);
    }
  }

  // Check children
  const childNames = new Map<string, number>();
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    const childName = child.localName;
    childNames.set(childName, (childNames.get(childName) || 0) + 1);

    if (!info.children.has(childName)) {
      info.children.set(childName, createElementInfo(childName));
    }

    analyzeElement(child, info.children.get(childName)!);
  }

  if (el.children.length > 0) {
    info.isLeaf = false;
  } else {
    // Leaf — infer type from text
    const text = el.textContent || '';
    info.inferredType = inferXSDType(text);
  }

  // Track child occurrence counts for this instance
  for (const [childName, count] of childNames) {
    const existing = info.childOccurrences.get(childName);
    if (existing) {
      existing.min = Math.min(existing.min, count);
      existing.max = Math.max(existing.max, count);
    } else {
      info.childOccurrences.set(childName, { min: count, max: count });
    }
  }

  // Children not seen in this instance get min=0
  for (const [childName, occ] of info.childOccurrences) {
    if (!childNames.has(childName)) {
      occ.min = 0;
    }
  }
}

// ────────────────────────────────────────────────
// XSD string generation
// ────────────────────────────────────────────────

function indent(level: number): string {
  return '  '.repeat(level);
}

function generateElementXSD(info: ElementInfo, level: number): string {
  const lines: string[] = [];

  if (info.isLeaf && info.attributes.size === 0) {
    // Simple element
    lines.push(`${indent(level)}<xs:element name="${info.name}" type="${info.inferredType}"/>`);
  } else {
    // Complex element
    lines.push(`${indent(level)}<xs:element name="${info.name}">`);
    lines.push(`${indent(level + 1)}<xs:complexType>`);

    if (!info.isLeaf) {
      lines.push(`${indent(level + 2)}<xs:sequence>`);

      for (const [childName, childInfo] of info.children) {
        const occ = info.childOccurrences.get(childName);
        const minOccurs = occ?.min ?? 1;
        const maxOccurs = occ?.max ?? 1;

        if (childInfo.isLeaf && childInfo.attributes.size === 0) {
          // Inline simple child
          let attrs = `name="${childName}" type="${childInfo.inferredType}"`;
          if (minOccurs === 0) attrs += ` minOccurs="0"`;
          if (maxOccurs > 1) attrs += ` maxOccurs="unbounded"`;
          lines.push(`${indent(level + 3)}<xs:element ${attrs}/>`);
        } else {
          // Complex child — recurse
          const childXSD = generateElementXSD(childInfo, level + 3);
          // Add occurrence attributes to the opening tag
          if (minOccurs === 0 || maxOccurs > 1) {
            const occAttrs: string[] = [];
            if (minOccurs === 0) occAttrs.push(`minOccurs="0"`);
            if (maxOccurs > 1) occAttrs.push(`maxOccurs="unbounded"`);
            // Replace the first <xs:element to include occurrence
            const replaced = childXSD.replace(
              `<xs:element name="${childName}"`,
              `<xs:element name="${childName}" ${occAttrs.join(' ')}`
            );
            lines.push(replaced);
          } else {
            lines.push(childXSD);
          }
        }
      }

      lines.push(`${indent(level + 2)}</xs:sequence>`);
    }

    // Attributes
    for (const attrName of info.attributes) {
      lines.push(
        `${indent(level + 2)}<xs:attribute name="${attrName}" type="xs:string" use="optional"/>`
      );
    }

    lines.push(`${indent(level + 1)}</xs:complexType>`);
    lines.push(`${indent(level)}</xs:element>`);
  }

  return lines.join('\n');
}

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

/**
 * Generate an XSD schema from XML content.
 *
 * Analyzes the XML structure and produces a best-effort XSD schema
 * by inferring types, detecting repeated elements, and collecting attributes.
 *
 * @param xmlContent - XML document string
 * @returns XSD schema string, or null if XML is not parseable
 */
export function generateXSDFromXML(xmlContent: string): string | null {
  if (!xmlContent || xmlContent.trim().length === 0) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  if (doc.querySelector('parsererror')) return null;

  const root = doc.documentElement;
  const rootInfo = createElementInfo(root.localName);
  analyzeElement(root, rootInfo);

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">',
    '',
    generateElementXSD(rootInfo, 1),
    '',
    '</xs:schema>',
    '',
  ];

  return lines.join('\n');
}
