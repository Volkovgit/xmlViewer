/**
 * SchemaCompletionProvider
 *
 * Monaco Editor completion provider for schema-aware XML editing.
 * Generates context-aware autocomplete suggestions based on XSD schema.
 */

import { XMLContextAnalyzer, type XMLContext, ContextPosition } from '@/services/xsd/contextAnalyzer/XMLContextAnalyzer';
import { generateElementSuggestion, generateAttributeSuggestion } from './CompletionItems';
import type { XSDSchema, XSDElement, XSDAttribute } from '@/services/xsd/XSDParser';
import type * as Monaco from 'monaco-editor';

/**
 * SchemaCompletionProvider
 *
 * Implements Monaco.languages.CompletionItemProvider to provide
 * XSD-based autocomplete suggestions for XML documents.
 */
export class SchemaCompletionProvider implements Monaco.languages.CompletionItemProvider {
  private contextAnalyzer: XMLContextAnalyzer;
  private currentDocument: XSDSchema | null;

  constructor() {
    this.contextAnalyzer = new XMLContextAnalyzer();
    this.currentDocument = null;
  }

  /**
   * Attach an XSD schema to this provider
   *
   * @param document - Parsed XSD schema
   */
  attachToDocument(document: XSDSchema): void {
    this.currentDocument = document;
    this.contextAnalyzer.invalidateCache();
  }

  /**
   * Detach current document and clear cache
   */
  detach(): void {
    this.currentDocument = null;
    this.contextAnalyzer.invalidateCache();
  }

  /**
   * Provide completion items for cursor position
   *
   * Monaco Editor API entry point. Returns suggestions based on
   * cursor context and attached XSD schema.
   *
   * @param model - Monaco text model
   * @param position - Cursor position
   * @param context - Completion trigger context
   * @param token - Cancellation token
   * @returns Completion list or null if no schema attached
   */
  provideCompletionItems(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position,
    context: Monaco.languages.CompletionContext,
    token: Monaco.CancellationToken
  ): Monaco.languages.CompletionList | Monaco.languages.CompletionItem[] | null {
    // Return null if no schema attached
    if (!this.currentDocument) {
      return null;
    }

    // Analyze context at cursor position
    const xmlContext = this.contextAnalyzer.getContext(model, position);

    // Generate suggestions based on context
    const suggestions = this.generateSuggestions(xmlContext);

    return {
      suggestions: suggestions as Monaco.languages.CompletionItem[]
    };
  }

  /**
   * Generate suggestions based on XML context
   *
   * Dispatches to appropriate suggestion method based on context position.
   *
   * @param context - XML context at cursor
   * @returns Array of completion items
   */
  private generateSuggestions(context: XMLContext): Monaco.languages.CompletionItem[] {
    switch (context.position) {
      case ContextPosition.INSIDE_ATTRIBUTES:
        // Inside opening tag: suggest attributes
        return this.getAttributeSuggestions(context);

      case ContextPosition.INSIDE_CONTENT:
        // Inside element content: suggest child elements
        return this.getElementSuggestions(context);

      case ContextPosition.INSIDE_OPENING_TAG:
        // Just after tag name: suggest attributes
        return this.getAttributeSuggestions(context);

      case ContextPosition.INSIDE_CLOSING_TAG:
      case ContextPosition.INSIDE_ATTRIBUTE_VALUE:
        // No suggestions in closing tags or attribute values
        return [];

      default:
        return [];
    }
  }

  /**
   * Get attribute suggestions for current element
   *
   * @param context - XML context at cursor
   * @returns Array of attribute completion items
   */
  private getAttributeSuggestions(context: XMLContext): Monaco.languages.CompletionItem[] {
    if (!context.currentElement || !this.currentDocument) {
      return [];
    }

    // Find element definition in schema
    const element = this.findElementInSchema(context.currentElement);
    if (!element?.complexType) {
      return [];
    }

    // Generate suggestions for each attribute
    const attributes = element.complexType.attributes || [];
    return attributes.map((attr) =>
      generateAttributeSuggestion(attr, element)
    ) as unknown as Monaco.languages.CompletionItem[];
  }

  /**
   * Get element suggestions for current position
   *
   * @param context - XML context at cursor
   * @returns Array of element completion items
   */
  private getElementSuggestions(context: XMLContext): Monaco.languages.CompletionItem[] {
    if (!context.currentElement || !this.currentDocument) {
      // If no current element, suggest root elements
      return this.getRootElementSuggestions();
    }

    // Find parent element in schema
    const parentElement = this.findElementInSchema(context.currentElement);
    if (!parentElement?.complexType) {
      return [];
    }

    // Generate suggestions for child elements
    const childElements = parentElement.complexType.elements || [];
    return childElements.map((element) =>
      generateElementSuggestion(element)
    ) as unknown as Monaco.languages.CompletionItem[];
  }

  /**
   * Get suggestions for root-level elements
   *
   * @returns Array of root element completion items
   */
  private getRootElementSuggestions(): Monaco.languages.CompletionItem[] {
    if (!this.currentDocument) {
      return [];
    }

    const rootElements = this.currentDocument.elements || [];
    return rootElements.map((element) =>
      generateElementSuggestion(element)
    ) as unknown as Monaco.languages.CompletionItem[];
  }

  /**
   * Find element definition in schema by name
   *
   * @param elementName - Element name to find
   * @returns Element definition or null if not found
   */
  private findElementInSchema(elementName: string): XSDElement | null {
    if (!this.currentDocument) {
      return null;
    }

    // Search in top-level elements
    const topLevelElements = this.currentDocument.elements || [];
    const found = topLevelElements.find((el) => el.name === elementName);
    if (found) {
      return found;
    }

    // Search in complex types (for nested elements)
    const complexTypes = this.currentDocument.complexTypes || [];
    for (const ct of complexTypes) {
      const nestedElement = ct.elements.find((el) => el.name === elementName);
      if (nestedElement) {
        return nestedElement;
      }
    }

    return null;
  }
}
