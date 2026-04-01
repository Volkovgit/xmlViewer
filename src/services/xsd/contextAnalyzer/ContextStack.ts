/**
 * ContextStack
 *
 * Cache implementation for storing and retrieving XML context at specific positions.
 * This is a performance optimization component for schema-aware editing.
 *
 * The cache stores XMLContext objects keyed by Position (lineNumber:column).
 * This avoids re-parsing the XML document to determine context when the cursor
 * hasn't moved significantly.
 *
 * @example
 * ```ts
 * const contextStack = new ContextStack();
 * const position = { lineNumber: 1, column: 5 };
 * const context = analyzeXMLContext(document, position);
 * contextStack.set(position, context);
 *
 * // Later...
 * const cached = contextStack.get(position);
 * if (cached) {
 *   // Use cached context instead of re-analyzing
 * }
 * ```
 */

import type { XMLContext } from './XMLContextAnalyzer';

/**
 * Simple position interface for compatibility
 */
export interface IPosition {
  lineNumber: number;
  column: number;
}

/**
 * ContextStack Cache
 *
 * Simple Map-based cache for storing XML context at specific positions.
 * Uses string keys in format "lineNumber:column" for efficient lookup.
 */
export class ContextStack {
  /**
   * Internal cache storage
   * Key format: "lineNumber:column"
   * Value: XMLContext object
   */
  private cache: Map<string, XMLContext>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Store context at a specific position
   *
   * @param position - Position (lineNumber, column)
   * @param context - XMLContext to cache
   *
   * @example
   * ```ts
   * const position = { lineNumber: 1, column: 5 };
   * const context = analyzeXMLContext(document, position);
   * contextStack.set(position, context);
   * ```
   */
  set(position: IPosition, context: XMLContext): void {
    const key = this.generateKey(position);
    this.cache.set(key, context);
  }

  /**
   * Retrieve context for a specific position
   *
   * @param position - Position (lineNumber, column)
   * @returns XMLContext if found, undefined otherwise
   *
   * @example
   * ```ts
   * const position = { lineNumber: 1, column: 5 };
   * const context = contextStack.get(position);
   * if (context) {
   *   console.log('Current element:', context.currentElement);
   * }
   * ```
   */
  get(position: IPosition): XMLContext | undefined {
    const key = this.generateKey(position);
    return this.cache.get(key);
  }

  /**
   * Clear all cached contexts
   *
   * Call this when the document changes significantly
   * (e.g., large edits, format changes) to invalidate the cache.
   *
   * @example
   * ```ts
   * // After a major document change
   * contextStack.clear();
   * ```
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key from Position
   *
   * @param position - Position (lineNumber, column)
   * @returns Cache key in format "lineNumber:column"
   *
   * @example
   * ```ts
   * const position = { lineNumber: 1, column: 5 };
   * const key = contextStack.generateKey(position);
   * // Returns: "1:5"
   * ```
   */
  private generateKey(position: IPosition): string {
    return `${position.lineNumber}:${position.column}`;
  }
}
