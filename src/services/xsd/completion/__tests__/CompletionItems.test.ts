import { describe, it, expect } from 'vitest';
import { generateElementSuggestion, generateAttributeSuggestion, generateEnumerationSuggestions } from '../CompletionItems';
import type { XSDElement } from '@/services/xsd/XSDParser';

// Monaco CompletionItemKind constants
const CompletionItemKind = {
  Method: 0,
  Function: 1,
  Constructor: 2,
  Field: 3,
  Variable: 4,
  Class: 5,
  Struct: 6,
  Interface: 7,
  Module: 8,
  Property: 9,
  Event: 10,
  Operator: 11,
  Unit: 12,
  Value: 13,
  Constant: 14,
  Enum: 15,
  EnumMember: 16,
  Keyword: 17,
  Text: 18,
  Color: 19,
  File: 20,
  Reference: 21,
  Customcolor: 22,
  Folder: 23,
  TypeParameter: 24,
  User: 25,
  Issue: 26,
  Snippet: 27
};

describe('CompletionItems', () => {
  const mockElement: XSDElement = {
    name: 'book',
    type: 'string',
    occurrence: { minOccurs: 1, maxOccurs: 'unbounded' },
    complexType: {
      name: 'bookType',
      elements: [],
      attributes: [
        { name: 'id', type: 'string', use: 'required' },
        { name: 'title', type: 'string', use: 'optional' }
      ],
      mixed: false
    }
  };

  it('should generate element suggestion with required attributes', () => {
    const suggestion = generateElementSuggestion(mockElement);

    expect(suggestion.label).toBe('book');
    expect(suggestion.kind).toBe(CompletionItemKind.Function);
    expect(suggestion.insertText).toContain('id=');
    expect(suggestion.insertText).toContain('${1:'); // Snippet tab stop syntax
  });

  it('should generate attribute suggestion for required attribute', () => {
    const attr = mockElement.complexType!.attributes[0];
    const suggestion = generateAttributeSuggestion(attr, mockElement);

    expect(suggestion.label).toBe('id');
    expect(suggestion.detail).toContain('required');
    expect(suggestion.sortText).toBe('0'); // Required first
  });

  it('should generate attribute suggestion for optional attribute', () => {
    const attr = mockElement.complexType!.attributes[1];
    const suggestion = generateAttributeSuggestion(attr, mockElement);

    expect(suggestion.label).toBe('title');
    expect(suggestion.detail).toContain('optional');
    expect(suggestion.sortText).toBe('1'); // Optional after required
  });

  it('should generate enumeration suggestions', () => {
    const values = ['small', 'medium', 'large'];
    const suggestions = generateEnumerationSuggestions(values);

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].label).toBe('small');
    expect(suggestions[0].kind).toBe(CompletionItemKind.Enum);
    expect(suggestions[0].insertText).toBe('small');
  });

  it('should generate element suggestion with self-closing tag when no children', () => {
    const emptyElement: XSDElement = {
      name: 'empty',
      type: 'string',
      occurrence: { minOccurs: 1, maxOccurs: 1 }
    };

    const suggestion = generateElementSuggestion(emptyElement);

    expect(suggestion.label).toBe('empty');
    expect(suggestion.insertText).toBe('<empty />$0');
  });

  it('should generate element suggestion with opening/closing tags when has children', () => {
    const elementWithChildren: XSDElement = {
      name: 'parent',
      type: 'string',
      occurrence: { minOccurs: 1, maxOccurs: 1 },
      complexType: {
        name: 'parentType',
        elements: [
          { name: 'child', type: 'string', occurrence: { minOccurs: 1, maxOccurs: 1 } }
        ],
        attributes: [],
        mixed: false
      }
    };

    const suggestion = generateElementSuggestion(elementWithChildren);

    expect(suggestion.label).toBe('parent');
    expect(suggestion.insertText).toContain('<parent>');
    expect(suggestion.insertText).toContain('</parent>');
    expect(suggestion.insertText).toContain('$0');
  });
});
