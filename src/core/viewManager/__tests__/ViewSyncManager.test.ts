/**
 * Unit tests for ViewSyncManager
 *
 * Tests debouncing behavior, update prioritization, and cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ViewSyncManager } from '../ViewSyncManager';
import { ViewUpdate, ChangeType, ViewType, createViewUpdate } from '../ViewUpdate';

describe('ViewSyncManager', () => {
  let mockCallback: ReturnType<typeof vi.fn>;
  let manager: ViewSyncManager;

  beforeEach(() => {
    // Use fake timers for debouncing tests
    vi.useFakeTimers();
    // Create mock callback
    mockCallback = vi.fn();
  });

  afterEach(() => {
    // Clean up any pending timers
    if (manager) {
      manager.destroy();
    }
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('First update processing', () => {
    it('should process first update immediately', () => {
      manager = new ViewSyncManager(mockCallback);

      const update: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.CONTENT
      );

      manager.scheduleUpdate(update);

      // First update should be processed immediately
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(update);
    });

    it('should process first update immediately for full updates', () => {
      manager = new ViewSyncManager(mockCallback);

      const update: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.FULL
      );

      manager.scheduleUpdate(update);

      // Full updates should also be processed immediately
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(update);
    });
  });

  describe('Debouncing behavior', () => {
    it('should debounce rapid updates (3 updates within 300ms → 2 calls)', () => {
      manager = new ViewSyncManager(mockCallback, { debounceDelay: 300 });

      const update1: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>v1</root>',
        ChangeType.CONTENT
      );
      const update2: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>v2</root>',
        ChangeType.CONTENT
      );
      const update3: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>v3</root>',
        ChangeType.CONTENT
      );

      // First update - processed immediately
      manager.scheduleUpdate(update1);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenLastCalledWith(update1);

      // Second update after 100ms - debounced
      vi.advanceTimersByTime(100);
      manager.scheduleUpdate(update2);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1

      // Third update after another 100ms - debounced
      vi.advanceTimersByTime(100);
      manager.scheduleUpdate(update3);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1

      // After debounce period completes, last pending update is processed
      vi.advanceTimersByTime(300);
      expect(mockCallback).toHaveBeenCalledTimes(2); // Now 2 (first + last)
      expect(mockCallback).toHaveBeenLastCalledWith(update3);
    });

    it('should process debounced update after custom delay', () => {
      manager = new ViewSyncManager(mockCallback, { debounceDelay: 500 });

      const update1: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>v1</root>',
        ChangeType.CONTENT
      );
      const update2: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>v2</root>',
        ChangeType.CONTENT
      );

      // First update
      manager.scheduleUpdate(update1);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Second update
      manager.scheduleUpdate(update2);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Advance to 400ms - still within debounce period
      vi.advanceTimersByTime(400);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Advance to 500ms - debounce period completes
      vi.advanceTimersByTime(100);
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenLastCalledWith(update2);
    });
  });

  describe('Full update prioritization', () => {
    it('should cancel pending content updates when full update arrives', () => {
      manager = new ViewSyncManager(mockCallback, { debounceDelay: 300 });

      const contentUpdate: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.CONTENT
      );
      const fullUpdate: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>full</root>',
        ChangeType.FULL
      );

      // First content update
      manager.scheduleUpdate(contentUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Second content update (pending)
      manager.scheduleUpdate(contentUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Full update arrives - should cancel pending and process immediately
      manager.scheduleUpdate(fullUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenLastCalledWith(fullUpdate);

      // Advance timers - no more updates should process
      vi.advanceTimersByTime(500);
      expect(mockCallback).toHaveBeenCalledTimes(2); // Still 2
    });

    it('should process structure updates immediately like full updates', () => {
      manager = new ViewSyncManager(mockCallback, { debounceDelay: 300 });

      const contentUpdate: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.CONTENT
      );
      const structureUpdate: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root><child/></root>',
        ChangeType.STRUCTURE
      );

      // First content update
      manager.scheduleUpdate(contentUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Structure update - should be processed immediately
      manager.scheduleUpdate(structureUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenLastCalledWith(structureUpdate);
    });
  });

  describe('Multiple view handling', () => {
    it('should handle updates from different views independently', () => {
      manager = new ViewSyncManager(mockCallback, { debounceDelay: 300 });

      const textUpdate: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>text</root>',
        ChangeType.CONTENT
      );
      const treeUpdate: ViewUpdate = createViewUpdate(
        ViewType.TREE,
        '<root>tree</root>',
        ChangeType.SELECTION
      );
      const gridUpdate: ViewUpdate = createViewUpdate(
        ViewType.GRID,
        '<root>grid</root>',
        ChangeType.CONTENT
      );

      // Text update
      manager.scheduleUpdate(textUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenLastCalledWith(textUpdate);

      // Tree update (selection) - should process immediately
      manager.scheduleUpdate(treeUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenLastCalledWith(treeUpdate);

      // Grid update - debounced
      manager.scheduleUpdate(gridUpdate);
      expect(mockCallback).toHaveBeenCalledTimes(2);

      // Complete debounce
      vi.advanceTimersByTime(300);
      expect(mockCallback).toHaveBeenCalledTimes(3);
      expect(mockCallback).toHaveBeenLastCalledWith(gridUpdate);
    });

    it('should maintain update order from same view', () => {
      manager = new ViewSyncManager(mockCallback, { debounceDelay: 200 });

      const updates: ViewUpdate[] = [
        createViewUpdate(ViewType.TEXT, '<root>v1</root>', ChangeType.CONTENT),
        createViewUpdate(ViewType.TEXT, '<root>v2</root>', ChangeType.CONTENT),
        createViewUpdate(ViewType.TEXT, '<root>v3</root>', ChangeType.CONTENT),
      ];

      manager.scheduleUpdate(updates[0]);
      manager.scheduleUpdate(updates[1]);
      manager.scheduleUpdate(updates[2]);

      // First processed immediately
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenLastCalledWith(updates[0]);

      // Complete debounce - last update should be processed
      vi.advanceTimersByTime(200);
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenLastCalledWith(updates[2]);
    });
  });

  describe('Cleanup and destroy', () => {
    it('should cleanup timers on destroy', () => {
      manager = new ViewSyncManager(mockCallback, { debounceDelay: 300 });

      const update: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.CONTENT
      );

      // Schedule update
      manager.scheduleUpdate(update);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Schedule second update (pending)
      manager.scheduleUpdate(update);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Destroy manager
      manager.destroy();

      // Advance timers - no updates should process
      vi.advanceTimersByTime(500);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should allow multiple destroy calls without error', () => {
      manager = new ViewSyncManager(mockCallback);

      const update: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.CONTENT
      );

      manager.scheduleUpdate(update);
      manager.destroy();
      manager.destroy(); // Should not throw

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not process updates after destroy', () => {
      manager = new ViewSyncManager(mockCallback);

      const update: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>content</root>',
        ChangeType.CONTENT
      );

      manager.destroy();

      // Try to schedule update after destroy
      manager.scheduleUpdate(update);

      // Should not process
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Default configuration', () => {
    it('should use default debounce delay of 300ms', () => {
      manager = new ViewSyncManager(mockCallback);

      const update1: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>v1</root>',
        ChangeType.CONTENT
      );
      const update2: ViewUpdate = createViewUpdate(
        ViewType.TEXT,
        '<root>v2</root>',
        ChangeType.CONTENT
      );

      manager.scheduleUpdate(update1);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      manager.scheduleUpdate(update2);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Advance to 299ms - still within default debounce period
      vi.advanceTimersByTime(299);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Advance to 300ms - debounce completes
      vi.advanceTimersByTime(1);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });
});
