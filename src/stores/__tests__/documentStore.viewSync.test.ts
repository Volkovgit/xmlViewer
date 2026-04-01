import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../documentStore';

/**
 * View Synchronization Tests for DocumentStore
 *
 * Tests the view state tracking functionality that prevents update loops
 * in multi-view synchronization (text, tree, grid views).
 */
describe('DocumentStore - View Synchronization', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDocumentStore.setState({
      documents: new Map(),
      activeDocumentId: null,
      recentDocuments: [],
      documentViewModes: new Map(),
      viewUpdateTimestamps: new Map(),
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty view modes map', () => {
      const state = useDocumentStore.getState();

      expect(state.documentViewModes).toBeInstanceOf(Map);
      expect(state.documentViewModes.size).toBe(0);
    });

    it('should initialize with empty update timestamps map', () => {
      const state = useDocumentStore.getState();

      expect(state.viewUpdateTimestamps).toBeInstanceOf(Map);
      expect(state.viewUpdateTimestamps.size).toBe(0);
    });
  });

  describe('setDocumentViewMode', () => {
    it('should set view mode for a document', () => {
      const { setDocumentViewMode, getDocumentViewMode } = useDocumentStore.getState();

      setDocumentViewMode('doc-1', 'tree');

      expect(getDocumentViewMode('doc-1')).toBe('tree');
    });

    it('should allow changing view mode for a document', () => {
      const { setDocumentViewMode, getDocumentViewMode } = useDocumentStore.getState();

      setDocumentViewMode('doc-1', 'text');
      expect(getDocumentViewMode('doc-1')).toBe('text');

      setDocumentViewMode('doc-1', 'grid');
      expect(getDocumentViewMode('doc-1')).toBe('grid');
    });

    it('should maintain separate view modes for different documents', () => {
      const { setDocumentViewMode, getDocumentViewMode } = useDocumentStore.getState();

      setDocumentViewMode('doc-1', 'text');
      setDocumentViewMode('doc-2', 'tree');
      setDocumentViewMode('doc-3', 'grid');

      expect(getDocumentViewMode('doc-1')).toBe('text');
      expect(getDocumentViewMode('doc-2')).toBe('tree');
      expect(getDocumentViewMode('doc-3')).toBe('grid');
    });

    it('should update store state when setting view mode', () => {
      const { setDocumentViewMode } = useDocumentStore.getState();

      setDocumentViewMode('doc-1', 'tree');

      expect(useDocumentStore.getState().documentViewModes.get('doc-1')).toBe('tree');
    });
  });

  describe('getDocumentViewMode', () => {
    it('should return "text" as default view mode for new document', () => {
      const { getDocumentViewMode } = useDocumentStore.getState();

      expect(getDocumentViewMode('non-existent')).toBe('text');
    });

    it('should return the set view mode for existing document', () => {
      const { setDocumentViewMode, getDocumentViewMode } = useDocumentStore.getState();

      setDocumentViewMode('doc-1', 'grid');

      expect(getDocumentViewMode('doc-1')).toBe('grid');
    });

    it('should return "text" when view mode was never set', () => {
      const { getDocumentViewMode } = useDocumentStore.getState();

      expect(getDocumentViewMode('some-doc-id')).toBe('text');
    });
  });

  describe('recordViewUpdate', () => {
    it('should record timestamp for view update', () => {
      const { recordViewUpdate } = useDocumentStore.getState();
      const beforeTime = Date.now();

      recordViewUpdate('doc-1', 'text');

      const afterTime = Date.now();
      const timestamps = useDocumentStore.getState().viewUpdateTimestamps.get('doc-1');
      const recordedTime = timestamps?.get('text');

      expect(recordedTime).toBeDefined();
      expect(recordedTime!).toBeGreaterThanOrEqual(beforeTime);
      expect(recordedTime!).toBeLessThanOrEqual(afterTime);
    });

    it('should record timestamps for multiple views of same document', () => {
      const { recordViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');
      // Wait a bit to ensure different timestamps
      const start = Date.now();
      while (Date.now() - start < 5) {
        // busy wait for 5ms
      }
      recordViewUpdate('doc-1', 'tree');
      while (Date.now() - start < 10) {
        // busy wait for another 5ms
      }
      recordViewUpdate('doc-1', 'grid');

      const timestamps = useDocumentStore.getState().viewUpdateTimestamps.get('doc-1');

      expect(timestamps?.get('text')).toBeDefined();
      expect(timestamps?.get('tree')).toBeDefined();
      expect(timestamps?.get('grid')).toBeDefined();
      expect(timestamps?.get('tree')).toBeGreaterThan(timestamps?.get('text') || 0);
      expect(timestamps?.get('grid')).toBeGreaterThan(timestamps?.get('tree') || 0);
    });

    it('should record timestamps for multiple documents', () => {
      const { recordViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');
      recordViewUpdate('doc-2', 'tree');
      recordViewUpdate('doc-3', 'grid');

      expect(useDocumentStore.getState().viewUpdateTimestamps.get('doc-1')?.get('text')).toBeDefined();
      expect(useDocumentStore.getState().viewUpdateTimestamps.get('doc-2')?.get('tree')).toBeDefined();
      expect(useDocumentStore.getState().viewUpdateTimestamps.get('doc-3')?.get('grid')).toBeDefined();
    });

    it('should update existing timestamp when recording same view again', () => {
      const { recordViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');

      const firstTimestamp = useDocumentStore.getState().viewUpdateTimestamps.get('doc-1')?.get('text');

      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 10) {
        // busy wait for 10ms
      }

      recordViewUpdate('doc-1', 'text');

      const secondTimestamp = useDocumentStore.getState().viewUpdateTimestamps.get('doc-1')?.get('text');

      expect(secondTimestamp).toBeGreaterThan(firstTimestamp || 0);
    });
  });

  describe('shouldProcessViewUpdate', () => {
    it('should return true when no timestamps exist for document', () => {
      const { shouldProcessViewUpdate } = useDocumentStore.getState();

      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(true);
    });

    it('should return true when source view has no timestamp', () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'tree');

      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(true);
    });

    it('should return false when source view was updated within last 100ms', () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');

      // Immediately check - should be within 100ms
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);
    });

    it('should return true when source view was updated more than 100ms ago', async () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');

      // Wait 150ms to exceed debounce threshold
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(true);
    });

    it('should return true for different view within 100ms', () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');

      // Different view should still process
      expect(shouldProcessViewUpdate('doc-1', 'tree')).toBe(true);
    });

    it('should return true for different document within 100ms', () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');

      // Different document should still process
      expect(shouldProcessViewUpdate('doc-2', 'text')).toBe(true);
    });

    it('should allow updates to propagate after debounce period', async () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      // First update
      recordViewUpdate('doc-1', 'text');
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);

      // Wait for debounce period
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should now allow processing
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(true);
    });

    it('should handle rapid updates correctly', () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      // Rapid updates from same view
      recordViewUpdate('doc-1', 'text');
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);

      recordViewUpdate('doc-1', 'text');
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);

      recordViewUpdate('doc-1', 'text');
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);
    });
  });

  describe('clearViewUpdateTimestamps', () => {
    it('should clear all timestamps for a document', () => {
      const { recordViewUpdate, clearViewUpdateTimestamps } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');
      recordViewUpdate('doc-1', 'tree');
      recordViewUpdate('doc-1', 'grid');

      expect(useDocumentStore.getState().viewUpdateTimestamps.get('doc-1')?.size).toBe(3);

      clearViewUpdateTimestamps('doc-1');

      const timestamps = useDocumentStore.getState().viewUpdateTimestamps.get('doc-1');
      expect(timestamps?.size).toBe(0);
    });

    it('should not affect timestamps of other documents', () => {
      const { recordViewUpdate, clearViewUpdateTimestamps } = useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');
      recordViewUpdate('doc-2', 'tree');

      clearViewUpdateTimestamps('doc-1');

      expect(useDocumentStore.getState().viewUpdateTimestamps.get('doc-1')?.size).toBe(0);
      expect(useDocumentStore.getState().viewUpdateTimestamps.get('doc-2')?.size).toBe(1);
    });

    it('should allow processing updates after clearing', () => {
      const { recordViewUpdate, clearViewUpdateTimestamps, shouldProcessViewUpdate } =
        useDocumentStore.getState();

      recordViewUpdate('doc-1', 'text');
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);

      clearViewUpdateTimestamps('doc-1');

      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(true);
    });

    it('should create empty map for document with no timestamps', () => {
      const { clearViewUpdateTimestamps } = useDocumentStore.getState();

      clearViewUpdateTimestamps('non-existent');

      const timestamps = useDocumentStore.getState().viewUpdateTimestamps.get('non-existent');
      expect(timestamps).toBeInstanceOf(Map);
      expect(timestamps?.size).toBe(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete view update cycle', async () => {
      const { setDocumentViewMode, recordViewUpdate, shouldProcessViewUpdate, clearViewUpdateTimestamps } =
        useDocumentStore.getState();

      // Set initial view mode
      setDocumentViewMode('doc-1', 'text');
      expect(useDocumentStore.getState().getDocumentViewMode('doc-1')).toBe('text');

      // Record update from text view
      recordViewUpdate('doc-1', 'text');

      // Should not process text view updates immediately (prevent loop)
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);

      // But should process other views
      expect(shouldProcessViewUpdate('doc-1', 'tree')).toBe(true);
      expect(shouldProcessViewUpdate('doc-1', 'grid')).toBe(true);

      // After debounce period, should allow processing again
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(true);

      // Clear timestamps to reset state
      clearViewUpdateTimestamps('doc-1');
      expect(useDocumentStore.getState().viewUpdateTimestamps.get('doc-1')?.size).toBe(0);
    });

    it('should handle multi-document view synchronization', () => {
      const { setDocumentViewMode, recordViewUpdate, shouldProcessViewUpdate } =
        useDocumentStore.getState();

      // Setup two documents in different views
      setDocumentViewMode('doc-1', 'text');
      setDocumentViewMode('doc-2', 'tree');

      // Update doc-1 from text view
      recordViewUpdate('doc-1', 'text');

      // doc-1 text view should not process (prevent loop)
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);

      // doc-2 should not be affected
      expect(shouldProcessViewUpdate('doc-2', 'text')).toBe(true);
      expect(shouldProcessViewUpdate('doc-2', 'tree')).toBe(true);
      expect(shouldProcessViewUpdate('doc-2', 'grid')).toBe(true);
    });

    it('should handle view mode changes during update cycle', () => {
      const { setDocumentViewMode, recordViewUpdate, shouldProcessViewUpdate } =
        useDocumentStore.getState();

      // Start in text view
      setDocumentViewMode('doc-1', 'text');
      recordViewUpdate('doc-1', 'text');

      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);

      // Switch to tree view - text view was just updated, so it's still within debounce window
      setDocumentViewMode('doc-1', 'tree');
      recordViewUpdate('doc-1', 'tree');

      // Tree view should not process (just updated)
      expect(shouldProcessViewUpdate('doc-1', 'tree')).toBe(false);
      // Text view also should not process yet (still within 100ms window)
      expect(shouldProcessViewUpdate('doc-1', 'text')).toBe(false);
      // Grid view should process (not updated recently)
      expect(shouldProcessViewUpdate('doc-1', 'grid')).toBe(true);
    });
  });
});
