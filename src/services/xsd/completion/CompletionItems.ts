/**
 * CompletionItems Generator
 *
 * Generates Monaco Editor completion suggestions from XSD schema definitions.
 * Creates properly formatted CompletionItem objects for elements, attributes,
 * and enumeration values.
 */

import type { XSDElement, XSDAttribute } from '@/services/xsd/XSDParser';

// ────────────────────────────────────────────────
// Monaco Editor Constants
// ────────────────────────────────────────────────

// From monaco-editor/languages
enum CompletionItemKind {
  Method = 0,
  Function = 1,
  Constructor = 2,
  Field = 3,
  Variable = 4,
  Class = 5,
  Struct = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Event = 10,
  Operator = 11,
  Unit = 12,
  Value = 13,
  Constant = 14,
  Enum = 15,
  EnumMember = 16,
  Keyword = 17,
  Text = 18,
  Color = 19,
  File = 20,
  Reference = 21,
  Customcolor = 22,
  Folder = 23,
  TypeParameter = 24,
  User = 25,
  Issue = 26,
  Snippet = 27
}

enum CompletionItemInsertTextRule {
  None = 0,
  InsertAsSnippet = 4
}

// ────────────────────────────────────────────────
// Element Suggestions
// ────────────────────────────────────────────────

/**
 * Generate a Monaco CompletionItem for an XSD element.
 *
 * Creates a code snippet with required attributes pre-filled. Uses self-closing
 * tag format for empty elements, opening/closing tags with cursor position
 * placeholder for elements with children.
 *
 * @param element - XSD element definition
 * @returns Monaco CompletionItem for the element
 *
 * @example
 * ```ts
 * const element = { name: 'book', complexType: { attributes: [{ name: 'id', use: 'required' }] } };
 * const suggestion = generateElementSuggestion(element);
 * // suggestion.insertText = '<book id="$1" />$0'
 * ```
 */
export function generateElementSuggestion(element: XSDElement): import('monaco-editor').languages.CompletionItem {
  const hasChildren = element.complexType && element.complexType.elements.length > 0;
  const attributes = element.complexType?.attributes || [];
  const requiredAttrs = attributes.filter((attr) => attr.use === 'required');

  // Build attribute string for required attributes
  const attrStrings = requiredAttrs.map((attr, index) => {
    const placeholder = index + 1; // Tab stop index
    return ` ${attr.name}="$\{${placeholder}:${attr.defaultValue || ''}}"`;
  });

  // Build insert text based on content model
  let insertText: string;
  if (hasChildren) {
    // Element has children: opening and closing tags with cursor inside
    const nextTabStop = requiredAttrs.length + 1;
    const attrs = attrStrings.join('');
    insertText = `<${element.name}${attrs}>$\{${nextTabStop}}</${element.name}>$0`;
  } else {
    // Empty element: self-closing tag
    const attrs = attrStrings.join('');
    insertText = `<${element.name}${attrs} />$0`;
  }

  // Build documentation
  const detailParts = [`Element: ${element.name}`];
  if (element.type) {
    detailParts.push(`Type: ${element.type}`);
  }
  if (requiredAttrs.length > 0) {
    detailParts.push(`Required: ${requiredAttrs.map((a) => a.name).join(', ')}`);
  }

  return {
    label: element.name,
    kind: CompletionItemKind.Function,
    insertText,
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    detail: detailParts.join(' | '),
    documentation: `Insert <${element.name}> element${requiredAttrs.length > 0 ? ' with required attributes' : ''}`,
    sortText: '0' // Elements appear first
  } as unknown as import('monaco-editor').languages.CompletionItem;
}

// ────────────────────────────────────────────────
// Attribute Suggestions
// ────────────────────────────────────────────────

/**
 * Generate a Monaco CompletionItem for an XSD attribute.
 *
 * Creates an attribute suggestion with proper sort order based on usage
 * (required attributes appear before optional).
 *
 * @param attribute - XSD attribute definition
 * @param element - Parent element (for context)
 * @returns Monaco CompletionItem for the attribute
 *
 * @example
 * ```ts
 * const attr = { name: 'id', type: 'xs:string', use: 'required' };
 * const suggestion = generateAttributeSuggestion(attr, element);
 * // suggestion.sortText = '0' (required)
 * // suggestion.insertText = 'id="$1"'
 * ```
 */
export function generateAttributeSuggestion(
  attribute: XSDAttribute,
  element: XSDElement
): import('monaco-editor').languages.CompletionItem {
  const isRequired = attribute.use === 'required';

  // Build documentation
  const detailParts: string[] = [`${attribute.type}`];
  if (isRequired) {
    detailParts.push('required');
  } else {
    detailParts.push('optional');
  }

  if (attribute.defaultValue !== undefined) {
    detailParts.push(`default: ${attribute.defaultValue}`);
  }

  if (attribute.fixedValue !== undefined) {
    detailParts.push(`fixed: ${attribute.fixedValue}`);
  }

  return {
    label: attribute.name,
    kind: CompletionItemKind.Field,
    insertText: `${attribute.name}="$1"`,
    insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
    detail: detailParts.join(' | '),
    documentation: `Attribute of <${element.name}> element`,
    sortText: isRequired ? '0' : '1' // Required attributes first
  } as unknown as import('monaco-editor').languages.CompletionItem;
}

// ────────────────────────────────────────────────
// Enumeration Suggestions
// ────────────────────────────────────────────────

/**
 * Generate Monaco CompletionItems for enumeration values.
 *
 * Creates suggestions for all allowed values in an XSD restriction.
 *
 * @param values - Array of allowed enumeration values
 * @returns Array of Monaco CompletionItems for each value
 *
 * @example
 * ```ts
 * const values = ['small', 'medium', 'large'];
 * const suggestions = generateEnumerationSuggestions(values);
 * // Returns 3 CompletionItems with Enum kind
 * ```
 */
export function generateEnumerationSuggestions(
  values: string[]
): import('monaco-editor').languages.CompletionItem[] {
  return values.map((value) => ({
    label: value,
    kind: CompletionItemKind.Enum,
    insertText: value,
    detail: `enumeration value`,
    sortText: '0'
  } as unknown as import('monaco-editor').languages.CompletionItem));
}

// ────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────

/**
 * Check if an element is empty (has no child elements).
 *
 * @param element - XSD element to check
 * @returns true if element has no child elements
 */
export function isEmptyElement(element: XSDElement): boolean {
  const childElements = element.complexType?.elements || [];
  return childElements.length === 0;
}

/**
 * Get required attributes from an element definition.
 *
 * @param element - XSD element to extract attributes from
 * @returns Array of required attributes
 */
export function getRequiredAttributes(element: XSDElement): XSDAttribute[] {
  const attributes = element.complexType?.attributes || [];
  return attributes.filter((attr) => attr.use === 'required');
}

/**
 * Get optional attributes from an element definition.
 *
 * @param element - XSD element to extract attributes from
 * @returns Array of optional attributes
 */
export function getOptionalAttributes(element: XSDElement): XSDAttribute[] {
  const attributes = element.complexType?.attributes || [];
  return attributes.filter((attr) => attr.use === 'optional' || attr.use === 'prohibited');
}
