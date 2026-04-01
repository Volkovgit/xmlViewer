/**
 * Unit tests for ViewCoordinator
 *
 * Tests the Observer pattern implementation that broadcasts view updates
 * to all registered listeners except the source view.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewCoordinator } from '../ViewCoordinator';
import { ViewType, ChangeType, createViewUpdate } from '../ViewUpdate';

describe('ViewCoordinator', () => {
  let coordinator: ViewCoordinator;

  beforeEach(() => {
    coordinator = new ViewCoordinator();
  });

  describe('registerViewListener', () => {
    it('should register a text view listener', () => {
      const listener = vi.fn();
      const unregister = coordinator.registerViewListener(ViewType.TEXT, listener);

      expect(typeof unregister).toBe('function');
      expect(coordinator.getListenerCount()).toBe(1);
    });

    it('should register a grid view listener', () => {
      const listener = vi.fn();
      const unregister = coordinator.registerViewListener(ViewType.GRID, listener);

      expect(typeof unregister).toBe('function');
      expect(coordinator.getListenerCount()).toBe(1);
    });

    it('should register a tree view listener', () => {
      const listener = vi.fn();
      const unregister = coordinator.registerViewListener(ViewType.TREE, listener);

      expect(typeof unregister).toBe('function');
      expect(coordinator.getListenerCount()).toBe(1);
    });

    it('should register multiple listeners for different views', () => {
      const textListener = vi.fn();
      const gridListener = vi.fn();
      const treeListener = vi.fn();

      coordinator.registerViewListener(ViewType.TEXT, textListener);
      coordinator.registerViewListener(ViewType.GRID, gridListener);
      coordinator.registerViewListener(ViewType.TREE, treeListener);

      expect(coordinator.getListenerCount()).toBe(3);
    });

    it('should allow unregistering a listener', () => {
      const listener = vi.fn();
      const unregister = coordinator.registerViewListener(ViewType.TEXT, listener);

      expect(coordinator.getListenerCount()).toBe(1);

      unregister();

      expect(coordinator.getListenerCount()).toBe(0);
    });

    it('should replace existing listener when registering same view type', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      coordinator.registerViewListener(ViewType.TEXT, listener1);
      coordinator.registerViewListener(ViewType.TEXT, listener2);

      expect(coordinator.getListenerCount()).toBe(1);

      const update = createViewUpdate(ViewType.GRID, '<root>test</root>', ChangeType.CONTENT);
      coordinator.broadcastUpdate(update);

      // Only listener2 should be called (listener1 was replaced)
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('broadcastUpdate', () => {
    it('should broadcast text update to grid and tree views', () => {
      const textListener = vi.fn();
      const gridListener = vi.fn();
      const treeListener = vi.fn();

      coordinator.registerViewListener(ViewType.TEXT, textListener);
      coordinator.registerViewListener(ViewType.GRID, gridListener);
      coordinator.registerViewListener(ViewType.TREE, treeListener);

      const update = createViewUpdate(ViewType.TEXT, '<root>updated</root>', ChangeType.CONTENT);
      coordinator.broadcastUpdate(update);

      // Text view (source) should not receive update
      expect(textListener).not.toHaveBeenCalled();

      // Grid and tree views should receive update
      expect(gridListener).toHaveBeenCalledWith(update);
      expect(treeListener).toHaveBeenCalledWith(update);
    });

    it('should broadcast grid update to text and tree views', () => {
      const textListener = vi.fn();
      const gridListener = vi.fn();
      const treeListener = vi.fn();

      coordinator.registerViewListener(ViewType.TEXT, textListener);
      coordinator.registerViewListener(ViewType.GRID, gridListener);
      coordinator.registerViewListener(ViewType.TREE, treeListener);

      const update = createViewUpdate(ViewType.GRID, '<root>grid-edit</root>', ChangeType.CONTENT);
      coordinator.broadcastUpdate(update);

      // Grid view (source) should not receive update
      expect(gridListener).not.toHaveBeenCalled();

      // Text and tree views should receive update
      expect(textListener).toHaveBeenCalledWith(update);
      expect(treeListener).toHaveBeenCalledWith(update);
    });

    it('should broadcast tree update to text and grid views', () => {
      const textListener = vi.fn();
      const gridListener = vi.fn();
      const treeListener = vi.fn();

      coordinator.registerViewListener(ViewType.TEXT, textListener);
      coordinator.registerViewListener(ViewType.GRID, gridListener);
      coordinator.registerViewListener(ViewType.TREE, treeListener);

      const update = createViewUpdate(ViewType.TREE, '<root>tree-edit</root>', ChangeType.STRUCTURE);
      coordinator.broadcastUpdate(update);

      // Tree view (source) should not receive update
      expect(treeListener).not.toHaveBeenCalled();

      // Text and grid views should receive update
      expect(textListener).toHaveBeenCalledWith(update);
      expect(gridListener).toHaveBeenCalledWith(update);
    });

    it('should not broadcast updates when no listeners registered', () => {
      const update = createViewUpdate(ViewType.TEXT, '<root>test</root>', ChangeType.CONTENT);

      // Should not throw error
      expect(() => coordinator.broadcastUpdate(update)).not.toThrow();
    });

    it('should not broadcast updates when only source view is registered', () => {
      const textListener = vi.fn();

      coordinator.registerViewListener(ViewType.TEXT, textListener);

      const update = createViewUpdate(ViewType.TEXT, '<root>test</root>', ChangeType.CONTENT);
      coordinator.broadcastUpdate(update);

      // Source view should not receive its own update
      expect(textListener).not.toHaveBeenCalled();
    });

    it('should broadcast update with all change types', () => {
      const gridListener = vi.fn();
      coordinator.registerViewListener(ViewType.GRID, gridListener);

      const contentChange = createViewUpdate(ViewType.TEXT, '<root>a</root>', ChangeType.CONTENT);
      const structureChange = createViewUpdate(ViewType.TEXT, '<root>b</root>', ChangeType.STRUCTURE);
      const selectionChange = createViewUpdate(ViewType.TEXT, '<root>c</root>', ChangeType.SELECTION);
      const fullChange = createViewUpdate(ViewType.TEXT, '<root>d</root>', ChangeType.FULL);

      coordinator.broadcastUpdate(contentChange);
      coordinator.broadcastUpdate(structureChange);
      coordinator.broadcastUpdate(selectionChange);
      coordinator.broadcastUpdate(fullChange);

      expect(gridListener).toHaveBeenCalledTimes(4);
      expect(gridListener).toHaveBeenCalledWith(contentChange);
      expect(gridListener).toHaveBeenCalledWith(structureChange);
      expect(gridListener).toHaveBeenCalledWith(selectionChange);
      expect(gridListener).toHaveBeenCalledWith(fullChange);
    });
  });

  describe('getListenerCount', () => {
    it('should return 0 for new coordinator', () => {
      expect(coordinator.getListenerCount()).toBe(0);
    });

    it('should return correct count after registering listeners', () => {
      coordinator.registerViewListener(ViewType.TEXT, vi.fn());
      expect(coordinator.getListenerCount()).toBe(1);

      coordinator.registerViewListener(ViewType.GRID, vi.fn());
      expect(coordinator.getListenerCount()).toBe(2);

      coordinator.registerViewListener(ViewType.TREE, vi.fn());
      expect(coordinator.getListenerCount()).toBe(3);
    });

    it('should return correct count after unregistering listeners', () => {
      const unregister1 = coordinator.registerViewListener(ViewType.TEXT, vi.fn());
      const unregister2 = coordinator.registerViewListener(ViewType.GRID, vi.fn());

      expect(coordinator.getListenerCount()).toBe(2);

      unregister1();
      expect(coordinator.getListenerCount()).toBe(1);

      unregister2();
      expect(coordinator.getListenerCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all registered listeners', () => {
      coordinator.registerViewListener(ViewType.TEXT, vi.fn());
      coordinator.registerViewListener(ViewType.GRID, vi.fn());
      coordinator.registerViewListener(ViewType.TREE, vi.fn());

      expect(coordinator.getListenerCount()).toBe(3);

      coordinator.clear();

      expect(coordinator.getListenerCount()).toBe(0);
    });

    it('should prevent broadcasting after clear', () => {
      const textListener = vi.fn();
      const gridListener = vi.fn();

      coordinator.registerViewListener(ViewType.TEXT, textListener);
      coordinator.registerViewListener(ViewType.GRID, gridListener);

      coordinator.clear();

      const update = createViewUpdate(ViewType.TEXT, '<root>test</root>', ChangeType.CONTENT);
      coordinator.broadcastUpdate(update);

      expect(textListener).not.toHaveBeenCalled();
      expect(gridListener).not.toHaveBeenCalled();
    });
  });
});
