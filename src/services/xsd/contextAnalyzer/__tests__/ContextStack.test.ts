/**
 * ContextStack Tests
 *
 * Tests the ContextStack cache implementation for storing and retrieving XML context.
 * This is a performance optimization component for schema-aware editing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextStack } from '../ContextStack';
import type { XMLContext } from '../XMLContextAnalyzer';
import type { Position } from 'monaco-editor';

describe('ContextStack', () => {
  let contextStack: ContextStack;

  beforeEach(() => {
    contextStack = new ContextStack();
  });

  describe('storing and retrieving context', () => {
    it('should store and retrieve context for a given position', () => {
      const position: Position = { lineNumber: 1, column: 5 };
      const context: XMLContext = {
        currentElement: 'book',
        parentElement: 'library',
        namespace: null,
        availableAttributes: ['id', 'title', 'author'],
        availableChildElements: ['chapter', 'appendix'],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 2,
      };

      contextStack.set(position, context);
      const retrieved = contextStack.get(position);

      expect(retrieved).toBeDefined();
      expect(retrieved).toEqual(context);
    });

    it('should store multiple contexts at different positions', () => {
      const position1: Position = { lineNumber: 1, column: 5 };
      const position2: Position = { lineNumber: 3, column: 10 };
      const context1: XMLContext = {
        currentElement: 'book',
        parentElement: 'library',
        namespace: null,
        availableAttributes: ['id', 'title'],
        availableChildElements: ['chapter'],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 2,
      };
      const context2: XMLContext = {
        currentElement: 'chapter',
        parentElement: 'book',
        namespace: null,
        availableAttributes: ['number'],
        availableChildElements: ['paragraph'],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 3,
      };

      contextStack.set(position1, context1);
      contextStack.set(position2, context2);

      expect(contextStack.get(position1)).toEqual(context1);
      expect(contextStack.get(position2)).toEqual(context2);
    });

    it('should overwrite context at the same position', () => {
      const position: Position = { lineNumber: 1, column: 5 };
      const context1: XMLContext = {
        currentElement: 'book',
        parentElement: 'library',
        namespace: null,
        availableAttributes: ['id'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 2,
      };
      const context2: XMLContext = {
        currentElement: 'chapter',
        parentElement: 'book',
        namespace: null,
        availableAttributes: ['number'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 3,
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
      const position: Position = { lineNumber: 10, column: 20 };
      const retrieved = contextStack.get(position);

      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for different position with same line number', () => {
      const position1: Position = { lineNumber: 5, column: 10 };
      const position2: Position = { lineNumber: 5, column: 15 };
      const context: XMLContext = {
        currentElement: 'book',
        parentElement: 'library',
        namespace: null,
        availableAttributes: ['id'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 2,
      };

      contextStack.set(position1, context);
      expect(contextStack.get(position1)).toEqual(context);
      expect(contextStack.get(position2)).toBeUndefined();
    });

    it('should return undefined after clearing', () => {
      const position: Position = { lineNumber: 1, column: 5 };
      const context: XMLContext = {
        currentElement: 'book',
        parentElement: 'library',
        namespace: null,
        availableAttributes: ['id'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 2,
      };

      contextStack.set(position, context);
      expect(contextStack.get(position)).toEqual(context);

      contextStack.clear();
      expect(contextStack.get(position)).toBeUndefined();
    });
  });

  describe('clearing all contexts', () => {
    it('should clear all stored contexts', () => {
      const position1: Position = { lineNumber: 1, column: 5 };
      const position2: Position = { lineNumber: 3, column: 10 };
      const position3: Position = { lineNumber: 5, column: 15 };
      const context1: XMLContext = {
        currentElement: 'book',
        parentElement: 'library',
        namespace: null,
        availableAttributes: ['id'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 2,
      };
      const context2: XMLContext = {
        currentElement: 'chapter',
        parentElement: 'book',
        namespace: null,
        availableAttributes: ['number'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 3,
      };
      const context3: XMLContext = {
        currentElement: 'paragraph',
        parentElement: 'chapter',
        namespace: null,
        availableAttributes: [],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 4,
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
      const position: Position = { lineNumber: 1, column: 5 };
      const context: XMLContext = {
        currentElement: 'book',
        parentElement: 'library',
        namespace: null,
        availableAttributes: ['id'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 2,
      };

      contextStack.set(position, context);
      expect(contextStack.get(position)).toEqual(context);

      contextStack.clear();
      expect(contextStack.get(position)).toBeUndefined();

      const newContext: XMLContext = {
        currentElement: 'chapter',
        parentElement: 'book',
        namespace: null,
        availableAttributes: ['number'],
        availableChildElements: [],
        schemaType: 'complexType',
        isInAttribute: false,
        isInElementContent: true,
        currentAttribute: null,
        depth: 3,
      };

      contextStack.set(position, newContext);
      expect(contextStack.get(position)).toEqual(newContext);
    });
  });
});
