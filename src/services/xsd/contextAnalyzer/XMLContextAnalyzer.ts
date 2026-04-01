/**
 * XMLContextAnalyzer
 *
 * Analyzes XML cursor position to determine context.
 * Uses caching for performance via ContextStack.
 */

import { ContextStack, type IPosition } from './ContextStack';

/**
 * Context position types
 */
export enum ContextPosition {
  /** Cursor inside opening tag <book|> */
  INSIDE_OPENING_TAG,
  /** Cursor inside closing tag </book|> */
  INSIDE_CLOSING_TAG,
  /** Cursor inside element content <book>|content|</book> */
  INSIDE_CONTENT,
  /** Cursor between attributes <book id="|" attr=""> */
  INSIDE_ATTRIBUTES,
  /** Cursor inside attribute value <book id="|"|> */
  INSIDE_ATTRIBUTE_VALUE,
}

/**
 * XML context at cursor position
 */
export interface XMLContext {
  /** Full path from root to current position */
  elementPath: string[];
  /** Current element (where cursor is) */
  currentElement: string | null;
  /** Position type within element */
  position: ContextPosition;
  /** Current attribute name (if inside attribute value) */
  currentAttribute?: string;
}

/**
 * XMLContextAnalyzer
 *
 * Analyzes XML cursor position to determine context.
 * Uses caching for performance.
 */
export class XMLContextAnalyzer {
  private stack: ContextStack;

  constructor() {
    this.stack = new ContextStack();
  }

  /**
   * Get context for cursor position
   */
  getContext(model: ITextModel, position: IPosition): XMLContext {
    // Check cache first
    const cached = this.stack.get(position);
    if (cached) {
      return cached;
    }

    // Parse context anew
    const context = this.parseContext(model, position);
    this.stack.set(position, context);
    return context;
  }

  /**
   * Invalidate context cache
   */
  invalidateCache(): void {
    this.stack.clear();
  }

  /**
   * Parse XML context at position
   */
  private parseContext(model: ITextModel, position: IPosition): XMLContext {
    const content = model.getValue();
    const offset = model.getOffsetAt(position);

    const elementPath: string[] = [];
    let currentElement: string | null = null;
    let pos = ContextPosition.INSIDE_CONTENT;

    // Simple heuristic: find element containing cursor
    // TODO: Implement proper tree traversal
    const lines = content.split('\n');
    const currentLine = lines[position.lineNumber - 1] || '';

    // Determine position type
    if (currentLine.includes('<') && currentLine.indexOf('<') < offset) {
      if (currentLine.includes('</') && currentLine.indexOf('</') < offset) {
        pos = ContextPosition.INSIDE_CLOSING_TAG;
      } else {
        pos = ContextPosition.INSIDE_OPENING_TAG;
      }
    }

    // Extract current element from line
    const tagMatch = currentLine.match(/<(\w+)/);
    if (tagMatch) {
      currentElement = tagMatch[1];
      elementPath.push(currentElement);
    }

    return {
      elementPath,
      currentElement,
      position: pos,
    };
  }
}

/**
 * Simple text model interface for compatibility
 */
export interface ITextModel {
  getValue(): string;
  getOffsetAt(position: IPosition): number;
}
