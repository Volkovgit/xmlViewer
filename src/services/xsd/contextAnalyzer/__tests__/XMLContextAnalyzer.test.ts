/**
 * XMLContextAnalyzer Tests
 *
 * Tests the XMLContextAnalyzer implementation for determining cursor position context.
 * This is a critical component for schema-aware autocompletion.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { XMLContextAnalyzer, ContextPosition, type ITextModel } from '../XMLContextAnalyzer';
import type { IPosition } from '../ContextStack';

// Mock text model
const createMockModel = (content: string): ITextModel => {
  return {
    getValue: () => content,
    getOffsetAt: (pos: IPosition) => {
      const lines = content.split('\n');
      let offset = 0;
      for (let i = 0; i < pos.lineNumber - 1; i++) {
        offset += lines[i].length + 1; // +1 for newline
      }
      return offset + pos.column - 1;
    },
  };
};

describe('XMLContextAnalyzer', () => {
  let analyzer: XMLContextAnalyzer;

  beforeEach(() => {
    analyzer = new XMLContextAnalyzer();
  });

  describe('detecting cursor position context', () => {
    it('should detect inside opening tag', () => {
      const model = createMockModel('<root>\n  <child>\n</root>');
      const position = { lineNumber: 2, column: 8 };

      const context = analyzer.getContext(model, position);

      expect(context.position).toBe(ContextPosition.INSIDE_OPENING_TAG);
      expect(context.currentElement).toBe('child');
      expect(context.elementPath).toContain('child');
    });

    it('should detect inside content', () => {
      const model = createMockModel('<root>\n  text\n</root>');
      const position = { lineNumber: 2, column: 6 };

      const context = analyzer.getContext(model, position);

      expect(context.position).toBe(ContextPosition.INSIDE_CONTENT);
    });

    it('should detect inside closing tag', () => {
      const model = createMockModel('<root>\n  content\n  </root>');
      const position = { lineNumber: 3, column: 5 };

      const context = analyzer.getContext(model, position);

      expect(context.position).toBe(ContextPosition.INSIDE_CLOSING_TAG);
    });

    it('should extract element path correctly', () => {
      const model = createMockModel('<root>\n  <child>\n  </child>\n</root>');
      const position = { lineNumber: 2, column: 8 };

      const context = analyzer.getContext(model, position);

      expect(context.elementPath).toEqual(['child']);
      expect(context.currentElement).toBe('child');
    });

    it('should handle empty document gracefully', () => {
      const model = createMockModel('');
      const position = { lineNumber: 1, column: 1 };

      const context = analyzer.getContext(model, position);

      expect(context.currentElement).toBeNull();
      expect(context.elementPath).toEqual([]);
    });

    it('should handle document with no tags', () => {
      const model = createMockModel('just some text content');
      const position = { lineNumber: 1, column: 10 };

      const context = analyzer.getContext(model, position);

      expect(context.currentElement).toBeNull();
      expect(context.elementPath).toEqual([]);
      expect(context.position).toBe(ContextPosition.INSIDE_CONTENT);
    });
  });

  describe('caching context results', () => {
    it('should cache context results', () => {
      const model = createMockModel('<root></root>');
      const position = { lineNumber: 1, column: 7 };

      const context1 = analyzer.getContext(model, position);
      const context2 = analyzer.getContext(model, position);

      expect(context1).toBe(context2); // Same reference from cache
    });

    it('should cache different positions separately', () => {
      const model = createMockModel('<root>\n</root>');
      const position1 = { lineNumber: 1, column: 7 };
      const position2 = { lineNumber: 2, column: 1 };

      const context1 = analyzer.getContext(model, position1);
      const context2 = analyzer.getContext(model, position2);

      expect(context1).not.toBe(context2); // Different references
    });
  });

  describe('invalidating cache', () => {
    it('should invalidate cache', () => {
      const model = createMockModel('<root></root>');
      const position = { lineNumber: 1, column: 7 };

      const context1 = analyzer.getContext(model, position);
      analyzer.invalidateCache();
      const context2 = analyzer.getContext(model, position);

      expect(context1).not.toBe(context2); // Different references after clear
    });

    it('should return new context after cache invalidation', () => {
      const model = createMockModel('<root>\n  <child/>\n</root>');
      const position = { lineNumber: 2, column: 8 };

      analyzer.getContext(model, position);
      analyzer.invalidateCache();
      const context2 = analyzer.getContext(model, position);

      expect(context2.currentElement).toBe('child');
      expect(context2.position).toBe(ContextPosition.INSIDE_OPENING_TAG);
    });
  });

  describe('context with attributes', () => {
    it('should detect position inside opening tag with attributes', () => {
      const model = createMockModel('<root id="123">\n</root>');
      const position = { lineNumber: 1, column: 10 };

      const context = analyzer.getContext(model, position);

      expect(context.position).toBe(ContextPosition.INSIDE_OPENING_TAG);
      expect(context.currentElement).toBe('root');
    });
  });

  describe('nested elements', () => {
    it('should handle deeply nested elements', () => {
      const model = createMockModel('<root>\n  <level1>\n    <level2/>\n  </level1>\n</root>');
      const position = { lineNumber: 3, column: 10 };

      const context = analyzer.getContext(model, position);

      expect(context.currentElement).toBe('level2');
      expect(context.position).toBe(ContextPosition.INSIDE_OPENING_TAG);
    });
  });
});
