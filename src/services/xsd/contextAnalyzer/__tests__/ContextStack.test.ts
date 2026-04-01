/**
 * ContextStack Tests
 *
 * Tests the ContextStack cache implementation for storing and retrieving XML context.
 * This is a performance optimization component for schema-aware editing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextStack } from '../ContextStack';
import type { XMLContext } from '../XMLContextAnalyzer';

describe('ContextStack', () => {
  let contextStack: ContextStack;

  beforeEach(() => {
    contextStack = new ContextStack();
  });

  const mockContext: XMLContext = {
    elementPath: ['root', 'child'],
    currentElement: 'child',
    position: 0, // ContextPosition.INSIDE_CONTENT
  };

  describe('storing and retrieving context', () => {
    it('should store and retrieve context for a given position', () => {
      const position = { lineNumber: 1, column: 5 };

      contextStack.set(position, mockContext);
      const retrieved = contextStack.get(position);

      expect(retrieved).toBeDefined();
      expect(retrieved).toEqual(mockContext);
    });

    it('should store multiple contexts at different positions', () => {
      const position1 = { lineNumber: 1, column: 5 };
      const position2 = { lineNumber: 3, column: 10 };
      const context1: XMLContext = {
        elementPath: ['root', 'book'],
        currentElement: 'book',
        position: 0,
      };
      const context2: XMLContext = {
        elementPath: ['root', 'book', 'chapter'],
        currentElement: 'chapter',
        position: 1,
      };

      contextStack.set(position1, context1);
      contextStack.set(position2, context2);

      expect(contextStack.get(position1)).toEqual(context1);
      expect(contextStack.get(position2)).toEqual(context2);
    });

    it('should overwrite context at the same position', () => {
      const position = { lineNumber: 1, column: 5 };
      const context1: XMLContext = {
        elementPath: ['root', 'book'],
        currentElement: 'book',
        position: 0,
      };
      const context2: XMLContext = {
        elementPath: ['root', 'chapter'],
        currentElement: 'chapter',
        position: 1,
      };

      contextStack.set(position, context1);
      contextStack.set(position, context2);

      const retrieved = contextStack.get(position);
      expect(retrieved).toEqual(context2);
      expect(retrieved).not.toEqual(context1);
    });
  });

  describe('returning undefined for non-existent position', () => {
    it('should return undefined for position that was not stored', () => {
      const position = { lineNumber: 10, column: 20 };
      const retrieved = contextStack.get(position);

      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for different position with same line number', () => {
      const position1 = { lineNumber: 5, column: 10 };
      const position2 = { lineNumber: 5, column: 15 };

      contextStack.set(position1, mockContext);
      expect(contextStack.get(position1)).toEqual(mockContext);
      expect(contextStack.get(position2)).toBeUndefined();
    });

    it('should return undefined after clearing', () => {
      const position = { lineNumber: 1, column: 5 };

      contextStack.set(position, mockContext);
      expect(contextStack.get(position)).toEqual(mockContext);

      contextStack.clear();
      expect(contextStack.get(position)).toBeUndefined();
    });
  });

  describe('clearing all contexts', () => {
    it('should clear all stored contexts', () => {
      const position1 = { lineNumber: 1, column: 5 };
      const position2 = { lineNumber: 3, column: 10 };
      const position3 = { lineNumber: 5, column: 15 };
      const context1: XMLContext = {
        elementPath: ['root', 'book'],
        currentElement: 'book',
        position: 0,
      };
      const context2: XMLContext = {
        elementPath: ['root', 'book', 'chapter'],
        currentElement: 'chapter',
        position: 1,
      };
      const context3: XMLContext = {
        elementPath: ['root', 'book', 'chapter', 'paragraph'],
        currentElement: 'paragraph',
        position: 0,
      };

      contextStack.set(position1, context1);
      contextStack.set(position2, context2);
      contextStack.set(position3, context3);

      expect(contextStack.get(position1)).toEqual(context1);
      expect(contextStack.get(position2)).toEqual(context2);
      expect(contextStack.get(position3)).toEqual(context3);

      contextStack.clear();

      expect(contextStack.get(position1)).toBeUndefined();
      expect(contextStack.get(position2)).toBeUndefined();
      expect(contextStack.get(position3)).toBeUndefined();
    });

    it('should allow adding new contexts after clearing', () => {
      const position = { lineNumber: 1, column: 5 };
      const context1: XMLContext = {
        elementPath: ['root', 'book'],
        currentElement: 'book',
        position: 0,
      };

      contextStack.set(position, context1);
      expect(contextStack.get(position)).toEqual(context1);

      contextStack.clear();
      expect(contextStack.get(position)).toBeUndefined();

      const context2: XMLContext = {
        elementPath: ['root', 'chapter'],
        currentElement: 'chapter',
        position: 1,
      };

      contextStack.set(position, context2);
      expect(contextStack.get(position)).toEqual(context2);
    });
  });
});
