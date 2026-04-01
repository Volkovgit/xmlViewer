/**
 * Unit tests for ViewUpdate data structures
 */

import { describe, it, expect } from 'vitest';
import {
  ViewType,
  ChangeType,
  TextPosition,
  TreeSelection,
  GridSelection,
  ViewUpdate,
  createViewUpdate,
} from '../ViewUpdate';

describe('ViewUpdate Data Structures', () => {
  describe('createViewUpdate', () => {
    it('should create view update with minimal params', () => {
      const update = createViewUpdate(ViewType.TEXT, '<root>content</root>');

      expect(update.sourceView).toBe(ViewType.TEXT);
      expect(update.changeType).toBe(ChangeType.CONTENT);
      expect(update.content).toBe('<root>content</root>');
      expect(update.timestamp).toBeTypeOf('number');
      expect(update.updateId).toBeTypeOf('string');
      expect(update.position).toBeUndefined();
    });

    it('should create view update with position', () => {
      const textPosition: TextPosition = {
        lineNumber: 5,
        column: 10,
      };

      const update = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.SELECTION,
        textPosition
      );

      expect(update.sourceView).toBe(ViewType.TEXT);
      expect(update.changeType).toBe(ChangeType.SELECTION);
      expect(update.content).toBe('<root>content</root>');
      expect(update.position).toEqual(textPosition);
      expect(update.timestamp).toBeTypeOf('number');
      expect(update.updateId).toBeTypeOf('string');
    });

    it('should create full document update', () => {
      const update = createViewUpdate(
        ViewType.GRID,
        '<root>content</root>',
        ChangeType.FULL
      );

      expect(update.sourceView).toBe(ViewType.GRID);
      expect(update.changeType).toBe(ChangeType.FULL);
      expect(update.content).toBe('<root>content</root>');
      expect(update.timestamp).toBeTypeOf('number');
      expect(update.updateId).toBeTypeOf('string');
      expect(update.position).toBeUndefined();
    });

    it('should generate unique update IDs', () => {
      const update1 = createViewUpdate(ViewType.TEXT, 'content1');
      const update2 = createViewUpdate(ViewType.TEXT, 'content2');
      const update3 = createViewUpdate(ViewType.TREE, 'content3');

      expect(update1.updateId).not.toBe(update2.updateId);
      expect(update2.updateId).not.toBe(update3.updateId);
      expect(update3.updateId).not.toBe(update1.updateId);

      // Verify ID format: sourceView-timestamp-random
      expect(update1.updateId).toMatch(/^TEXT-\d+-[a-z0-9]+$/);
      expect(update2.updateId).toMatch(/^TEXT-\d+-[a-z0-9]+$/);
      expect(update3.updateId).toMatch(/^TREE-\d+-[a-z0-9]+$/);
    });
  });

  describe('TreeSelection', () => {
    it('should create tree selection with nodeId', () => {
      const selection = new TreeSelection('node-123');

      expect(selection.nodeId).toBe('node-123');
      expect(selection.expandedNodes).toBeUndefined();
    });

    it('should create tree selection with expanded nodes', () => {
      const expandedNodes = new Set(['node-1', 'node-2', 'node-3']);
      const selection = new TreeSelection('node-123', expandedNodes);

      expect(selection.nodeId).toBe('node-123');
      expect(selection.expandedNodes).toEqual(expandedNodes);
    });
  });

  describe('GridSelection', () => {
    it('should create grid selection with rowId and field', () => {
      const selection = new GridSelection('row-456', 'firstName');

      expect(selection.rowId).toBe('row-456');
      expect(selection.field).toBe('firstName');
    });
  });
});
