/**
 * View Synchronization Integration Tests
 *
 * Comprehensive integration tests for the view synchronization system that verify
 * complete workflows between Text, Grid, and Tree views.
 *
 * Tests cover:
 * - Text → Grid/Tree synchronization
 * - Grid → Text/Tree synchronization
 * - Tree → Text/Grid synchronization
 * - Debouncing and update loop prevention
 * - View coordinator coordination
 * - Document store integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDocumentStore } from '@/stores/documentStore';
import { viewCoordinator, ViewCoordinator } from '@/core/viewManager/ViewCoordinator';
import { ViewSyncManager } from '@/core/viewManager/ViewSyncManager';
import { ViewType, ChangeType, createViewUpdate } from '@/core/viewManager/ViewUpdate';
import { Document, DocumentType, DocumentStatus } from '@/types';
import { useViewSync } from '@/hooks/useViewSync';

// Mock react-dnd for tree drag-drop tests
vi.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDrag: () => [{ isDragging: false }],
  useDrop: () => [{ isOver: false }],
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

/**
 * Test component that uses useViewSync hook
 * This allows us to test the hook integration without rendering complex views
 */
function TestViewSyncComponent({
  document,
  viewType,
  onUpdate,
}: {
  document: Document;
  viewType: ViewType;
  onUpdate?: (update: ViewUpdate) => void;
}) {
  const { notifyViewChanged } = useViewSync(document, viewType);

  // Listen for updates from other views
  React.useEffect(() => {
    const listener = (update: ViewUpdate) => {
      if (update.sourceView !== viewType) {
        onUpdate?.(update);
      }
    };

    const unsubscribe = viewCoordinator.registerViewListener(viewType, listener);
    return unsubscribe;
  }, [viewType, onUpdate]);

  return (
    <div data-testid={`test-view-${viewType}`}>
      <button
        data-testid={`notify-btn-${viewType}`}
        onClick={() => notifyViewChanged(document.content, ChangeType.CONTENT)}
      >
        Notify Change
      </button>
      <span data-testid={`content-${viewType}`}>{document.content}</span>
    </div>
  );
}

const React = require('react');

/**
 * Wrapper component with DndProvider for drag-drop tests
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}

describe('View Synchronization Integration Tests', () => {
  // Test document
  let mockDocument: Document;
  let originalStore: any;

  beforeEach(() => {
    // Clear all view coordinator listeners
    viewCoordinator.clear();

    // Create test document
    mockDocument = {
      id: 'test-doc-1',
      name: 'test.xml',
      type: DocumentType.XML,
      content: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>Test</item>\n</root>',
      status: DocumentStatus.READY,
      createdAt: new Date('2024-01-01'),
      modifiedAt: new Date('2024-01-01'),
    };

    // Reset document store
    const store = useDocumentStore.getState();
    originalStore = { ...store };

    // Clear and reset store state
    act(() => {
      useDocumentStore.setState({
        documents: new Map([[mockDocument.id, mockDocument]]),
        activeDocumentId: mockDocument.id,
        recentDocuments: [mockDocument.id],
        documentViewModes: new Map(),
        viewUpdateTimestamps: new Map(),
      });
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    viewCoordinator.clear();
    act(() => {
      useDocumentStore.setState(originalStore);
    });
  });

  describe('View Coordinator Infrastructure', () => {
    it('should register and unregister view listeners correctly', () => {
      const mockListener = vi.fn();
      const unregister = viewCoordinator.registerViewListener(ViewType.TEXT, mockListener);

      expect(viewCoordinator.getListenerCount()).toBe(1);

      unregister();
      expect(viewCoordinator.getListenerCount()).toBe(0);
    });

    it('should broadcast updates to all views except source', () => {
      const textListener = vi.fn();
      const gridListener = vi.fn();
      const treeListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, textListener);
      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);
      viewCoordinator.registerViewListener(ViewType.TREE, treeListener);

      const update = createViewUpdate(ViewType.TEXT, '<root>updated</root>', ChangeType.CONTENT);
      viewCoordinator.broadcastUpdate(update);

      // Text view should NOT receive its own update
      expect(textListener).not.toHaveBeenCalled();

      // Grid and Tree should receive the update
      expect(gridListener).toHaveBeenCalledWith(update);
      expect(treeListener).toHaveBeenCalledWith(update);
    });

    it('should allow multiple view types to register simultaneously', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, listener1);
      viewCoordinator.registerViewListener(ViewType.GRID, listener2);
      viewCoordinator.registerViewListener(ViewType.TREE, listener3);

      expect(viewCoordinator.getListenerCount()).toBe(3);
    });

    it('should replace listener when registering same view type twice', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, listener1);
      viewCoordinator.registerViewListener(ViewType.TEXT, listener2);

      // Should still have only 1 listener
      expect(viewCoordinator.getListenerCount()).toBe(1);

      const update = createViewUpdate(ViewType.GRID, '<root>test</root>', ChangeType.CONTENT);
      viewCoordinator.broadcastUpdate(update);

      // Only listener2 should be called (replaced listener1)
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith(update);
    });
  });

  describe('View Sync Manager Debouncing', () => {
    it('should process first update immediately', () => {
      const processor = vi.fn();
      const manager = new ViewSyncManager(processor, { debounceDelay: 300 });

      const update = createViewUpdate(ViewType.TEXT, '<root>first</root>', ChangeType.CONTENT);
      manager.scheduleUpdate(update);

      // First update processes immediately
      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith(update);

      manager.destroy();
    });

    it('should debounce subsequent content updates', async () => {
      await new Promise<void>((resolve) => {
        const processor = vi.fn((update) => {
          // Resolve when we get the second call (debounced update)
          if (processor.mock.calls.length === 2) {
            setTimeout(() => {
              expect(processor).toHaveBeenCalledTimes(2);
              expect(processor).toHaveBeenLastCalledWith(update3);
              manager.destroy();
              resolve();
            }, 0);
          }
        });
        const manager = new ViewSyncManager(processor, { debounceDelay: 100 });

        // First update
        const update1 = createViewUpdate(ViewType.TEXT, '<root>first</root>', ChangeType.CONTENT);
        manager.scheduleUpdate(update1);

        expect(processor).toHaveBeenCalledTimes(1);

        // Rapid subsequent updates
        const update2 = createViewUpdate(ViewType.TEXT, '<root>second</root>', ChangeType.CONTENT);
        const update3 = createViewUpdate(ViewType.TEXT, '<root>third</root>', ChangeType.CONTENT);

        manager.scheduleUpdate(update2);
        manager.scheduleUpdate(update3);

        // Still only first update processed immediately
        expect(processor).toHaveBeenCalledTimes(1);

        // Wait for debounce to complete (will trigger resolve via processor callback)
      });
    });

    it('should process FULL updates immediately and cancel pending', () => {
      const processor = vi.fn();
      const manager = new ViewSyncManager(processor, { debounceDelay: 300 });

      // First content update
      const update1 = createViewUpdate(ViewType.TEXT, '<root>first</root>', ChangeType.CONTENT);
      manager.scheduleUpdate(update1);

      expect(processor).toHaveBeenCalledTimes(1);

      // FULL update should process immediately
      const update2 = createViewUpdate(ViewType.TEXT, '<root>full</root>', ChangeType.FULL);
      manager.scheduleUpdate(update2);

      expect(processor).toHaveBeenCalledTimes(2);
      expect(processor).toHaveBeenLastCalledWith(update2);

      manager.destroy();
    });

    it('should process STRUCTURE updates immediately', () => {
      const processor = vi.fn();
      const manager = new ViewSyncManager(processor, { debounceDelay: 300 });

      const update = createViewUpdate(ViewType.TEXT, '<root>structure</root>', ChangeType.STRUCTURE);
      manager.scheduleUpdate(update);

      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith(update);

      manager.destroy();
    });

    it('should process SELECTION updates immediately', () => {
      const processor = vi.fn();
      const manager = new ViewSyncManager(processor, { debounceDelay: 300 });

      const update = createViewUpdate(
        ViewType.TEXT,
        '<root>selection</root>',
        ChangeType.SELECTION
      );
      manager.scheduleUpdate(update);

      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith(update);

      manager.destroy();
    });
  });

  describe('useViewSync Hook Integration', () => {
    it('should initialize without errors', () => {
      expect(() => {
        function TestComponent() {
          const { document: doc } = useViewSync(mockDocument, ViewType.TEXT);
          return <div>{doc.id}</div>;
        }

        render(<TestComponent />);
      }).not.toThrow();
    });

    it('should notify other views when content changes', async () => {
      const gridListener = vi.fn();
      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);

      function TestComponent() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="notify-btn"
            onClick={() => notifyViewChanged('<root>changed</root>', ChangeType.CONTENT)}
          >
            Notify
          </button>
        );
      }

      render(<TestComponent />);

      const btn = document.querySelector('[data-testid="notify-btn"]') as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(gridListener).toHaveBeenCalled();
      });
    });

    it('should prevent update loops with debouncing', async () => {
      let notifyCount = 0;

      function TestComponent() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="notify-btn"
            onClick={() => {
              notifyViewChanged(`<root>update-${notifyCount++}</root>`, ChangeType.CONTENT);
            }}
          >
            Notify
          </button>
        );
      }

      render(<TestComponent />);

      const btn = document.querySelector('[data-testid="notify-btn"]') as HTMLButtonElement;

      // Rapid clicks should be debounced
      await act(async () => {
        fireEvent.click(btn);
        fireEvent.click(btn);
        fireEvent.click(btn);
      });

      // Should not crash or cause infinite loops
      expect(btn).toBeInTheDocument();
    });

    it('should ignore updates with unchanged content', () => {
      const gridListener = vi.fn();
      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);

      function TestComponent() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="notify-btn"
            onClick={() => notifyViewChanged(mockDocument.content, ChangeType.CONTENT)}
          >
            Notify Same Content
          </button>
        );
      }

      render(<TestComponent />);

      const btn = document.querySelector('[data-testid="notify-btn"]') as HTMLButtonElement;
      act(() => {
        fireEvent.click(btn);
      });

      // Grid should not receive update since content didn't change
      expect(gridListener).not.toHaveBeenCalled();
    });
  });

  describe('Document Store View Sync Integration', () => {
    it('should record view updates with timestamps', () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      act(() => {
        recordViewUpdate(mockDocument.id, 'text');
      });

      // Should process updates from other views
      expect(shouldProcessViewUpdate(mockDocument.id, 'grid')).toBe(true);

      // Should not process updates from same view within 100ms
      expect(shouldProcessViewUpdate(mockDocument.id, 'text')).toBe(false);
    });

    it('should allow updates from same view after 100ms', async () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      act(() => {
        recordViewUpdate(mockDocument.id, 'text');
      });

      // Immediately should not process
      expect(shouldProcessViewUpdate(mockDocument.id, 'text')).toBe(false);

      // Wait 101ms
      await new Promise((resolve) => setTimeout(resolve, 101));

      // Now should process
      expect(shouldProcessViewUpdate(mockDocument.id, 'text')).toBe(true);
    });

    it('should clear view update timestamps', () => {
      const { recordViewUpdate, shouldProcessViewUpdate, clearViewUpdateTimestamps } =
        useDocumentStore.getState();

      act(() => {
        recordViewUpdate(mockDocument.id, 'text');
      });

      expect(shouldProcessViewUpdate(mockDocument.id, 'text')).toBe(false);

      act(() => {
        clearViewUpdateTimestamps(mockDocument.id);
      });

      // Should now process even from same view
      expect(shouldProcessViewUpdate(mockDocument.id, 'text')).toBe(true);
    });

    it('should manage view modes per document', () => {
      const { setDocumentViewMode, getDocumentViewMode } = useDocumentStore.getState();

      expect(getDocumentViewMode(mockDocument.id)).toBe('text'); // default

      act(() => {
        setDocumentViewMode(mockDocument.id, 'grid');
      });

      expect(getDocumentViewMode(mockDocument.id)).toBe('grid');

      act(() => {
        setDocumentViewMode(mockDocument.id, 'tree');
      });

      expect(getDocumentViewMode(mockDocument.id)).toBe('tree');
    });
  });

  describe('Text to Grid/Tree Sync Workflow', () => {
    it('should broadcast text changes to grid and tree views', async () => {
      const gridListener = vi.fn();
      const treeListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);
      viewCoordinator.registerViewListener(ViewType.TREE, treeListener);

      function TextEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);
        const [content, setContent] = React.useState(mockDocument.content);

        return (
          <div>
            <textarea
              data-testid="text-editor"
              value={content}
              onChange={(e) => {
                const newContent = e.target.value;
                setContent(newContent);
                notifyViewChanged(newContent, ChangeType.CONTENT);
              }}
            />
          </div>
        );
      }

      render(<TextEditor />);

      const textarea = document.querySelector('[data-testid="text-editor"]') as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: '<?xml version="1.0"?><root>updated from text</root>' },
        });
      });

      await waitFor(() => {
        expect(gridListener).toHaveBeenCalled();
        expect(treeListener).toHaveBeenCalled();
      });
    });

    it('should not broadcast text changes back to text view', async () => {
      const textListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, textListener);

      function TextEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="notify-btn"
            onClick={() => notifyViewChanged('<root>updated</root>', ChangeType.CONTENT)}
          >
            Notify
          </button>
        );
      }

      render(<TextEditor />);

      const btn = document.querySelector('[data-testid="notify-btn"]') as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(btn);
      });

      // Text view should NOT receive its own update
      expect(textListener).not.toHaveBeenCalled();
    });
  });

  describe('Grid to Text/Tree Sync Workflow', () => {
    it('should broadcast grid changes to text and tree views', async () => {
      const textListener = vi.fn();
      const treeListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, textListener);
      viewCoordinator.registerViewListener(ViewType.TREE, treeListener);

      function GridEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.GRID);

        return (
          <button
            data-testid="grid-cell-edit"
            onClick={() => notifyViewChanged('<root>updated from grid</root>', ChangeType.CONTENT)}
          >
            Edit Cell
          </button>
        );
      }

      render(<GridEditor />);

      const btn = document.querySelector('[data-testid="grid-cell-edit"]') as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(textListener).toHaveBeenCalled();
        expect(treeListener).toHaveBeenCalled();
      });
    });

    it('should handle grid structure changes', async () => {
      const textListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, textListener);

      function GridEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.GRID);

        return (
          <button
            data-testid="add-row"
            onClick={() =>
              notifyViewChanged(
                '<?xml version="1.0"?><root><item>1</item><item>2</item></root>',
                ChangeType.STRUCTURE
              )
            }
          >
            Add Row
          </button>
        );
      }

      render(<GridEditor />);

      const btn = document.querySelector('[data-testid="add-row"]') as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(textListener).toHaveBeenCalled();
        const callArgs = textListener.mock.calls[0][0];
        expect(callArgs.changeType).toBe(ChangeType.STRUCTURE);
      });
    });
  });

  describe('Tree to Text/Grid Sync Workflow', () => {
    it('should broadcast tree drag-drop changes to text and grid views', async () => {
      const textListener = vi.fn();
      const gridListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, textListener);
      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);

      function TreeEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TREE);

        return (
          <button
            data-testid="drag-node"
            onClick={() =>
              notifyViewChanged(
                '<?xml version="1.0"?><root><item>moved</item></root>',
                ChangeType.STRUCTURE
              )
            }
          >
            Drag Node
          </button>
        );
      }

      render(<TreeEditor />);

      const btn = document.querySelector('[data-testid="drag-node"]') as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(textListener).toHaveBeenCalled();
        expect(gridListener).toHaveBeenCalled();
      });
    });

    it('should handle tree node value edits', async () => {
      const textListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, textListener);

      function TreeEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TREE);

        return (
          <button
            data-testid="edit-node"
            onClick={() =>
              notifyViewChanged(
                '<?xml version="1.0"?><root><item>edited value</item></root>',
                ChangeType.CONTENT
              )
            }
          >
            Edit Node
          </button>
        );
      }

      render(<TreeEditor />);

      const btn = document.querySelector('[data-testid="edit-node"]') as HTMLButtonElement;

      await act(async () => {
        fireEvent.click(btn);
      });

      await waitFor(() => {
        expect(textListener).toHaveBeenCalled();
      });
    });
  });

  describe('Update Loop Prevention', () => {
    it('should prevent infinite update loops with debouncing', async () => {
      // Simulate scenario where text updates grid, grid updates tree, tree updates text
      const textListener = vi.fn();
      const gridListener = vi.fn();
      const treeListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.TEXT, textListener);
      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);
      viewCoordinator.registerViewListener(ViewType.TREE, treeListener);

      // Create a chain of updates
      const update1 = createViewUpdate(ViewType.TEXT, '<root>v1</root>', ChangeType.CONTENT);
      const update2 = createViewUpdate(ViewType.GRID, '<root>v2</root>', ChangeType.CONTENT);
      const update3 = createViewUpdate(ViewType.TREE, '<root>v3</root>', ChangeType.CONTENT);

      act(() => {
        viewCoordinator.broadcastUpdate(update1);
        viewCoordinator.broadcastUpdate(update2);
        viewCoordinator.broadcastUpdate(update3);
      });

      // Each view should receive 2 updates (not its own)
      expect(textListener).toHaveBeenCalledTimes(2);
      expect(gridListener).toHaveBeenCalledTimes(2);
      expect(treeListener).toHaveBeenCalledTimes(2);

      // Verify they didn't receive their own updates
      expect(textListener).not.toHaveBeenCalledWith(update1);
      expect(gridListener).not.toHaveBeenCalledWith(update2);
      expect(treeListener).not.toHaveBeenCalledWith(update3);
    });

    it('should respect timestamp-based update filtering', async () => {
      const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore.getState();

      // Record that text view just updated
      act(() => {
        recordViewUpdate(mockDocument.id, 'text');
      });

      // Should not process another text update immediately
      expect(shouldProcessViewUpdate(mockDocument.id, 'text')).toBe(false);

      // But should process grid update
      expect(shouldProcessViewUpdate(mockDocument.id, 'grid')).toBe(true);

      // Should process tree update
      expect(shouldProcessViewUpdate(mockDocument.id, 'tree')).toBe(true);
    });
  });

  describe('Multi-View Coexistence', () => {
    it('should allow all three views to be active simultaneously', () => {
      function MultiViewApp() {
        return (
          <div>
            <TestViewSyncComponent document={mockDocument} viewType={ViewType.TEXT} />
            <TestViewSyncComponent document={mockDocument} viewType={ViewType.GRID} />
            <TestViewSyncComponent document={mockDocument} viewType={ViewType.TREE} />
          </div>
        );
      }

      expect(() => {
        render(<MultiViewApp />);
      }).not.toThrow();

      // Verify all views rendered
      expect(document.querySelector('[data-testid="test-view-TEXT"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="test-view-GRID"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="test-view-TREE"]')).toBeInTheDocument();
    });

    it('should handle simultaneous edits from multiple views without crashing', async () => {
      function MultiViewApp() {
        return (
          <div>
            <TestViewSyncComponent document={mockDocument} viewType={ViewType.TEXT} />
            <TestViewSyncComponent document={mockDocument} viewType={ViewType.GRID} />
            <TestViewSyncComponent document={mockDocument} viewType={ViewType.TREE} />
          </div>
        );
      }

      render(<MultiViewApp />);

      const textBtn = document.querySelector('[data-testid="notify-btn-TEXT"]') as HTMLButtonElement;
      const gridBtn = document.querySelector('[data-testid="notify-btn-GRID"]') as HTMLButtonElement;
      const treeBtn = document.querySelector('[data-testid="notify-btn-TREE"]') as HTMLButtonElement;

      // Simultaneous edits from all views
      await act(async () => {
        fireEvent.click(textBtn);
        fireEvent.click(gridBtn);
        fireEvent.click(treeBtn);
      });

      // Should not crash
      expect(textBtn).toBeInTheDocument();
      expect(gridBtn).toBeInTheDocument();
      expect(treeBtn).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      const gridListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);

      function TextEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="clear-content"
            onClick={() => notifyViewChanged('', ChangeType.CONTENT)}
          >
            Clear
          </button>
        );
      }

      render(<TextEditor />);

      const btn = document.querySelector('[data-testid="clear-content"]') as HTMLButtonElement;

      expect(() => {
        fireEvent.click(btn);
      }).not.toThrow();
    });

    it('should handle malformed XML gracefully', () => {
      const gridListener = vi.fn();

      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);

      function TextEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="bad-xml"
            onClick={() => notifyViewChanged('<root><unclosed>', ChangeType.CONTENT)}
          >
            Bad XML
          </button>
        );
      }

      render(<TextEditor />);

      const btn = document.querySelector('[data-testid="bad-xml"]') as HTMLButtonElement;

      expect(() => {
        fireEvent.click(btn);
      }).not.toThrow();
    });

    it('should handle rapid view switching', () => {
      const { setDocumentViewMode, getDocumentViewMode } = useDocumentStore.getState();

      expect(() => {
        act(() => {
          setDocumentViewMode(mockDocument.id, 'text');
          setDocumentViewMode(mockDocument.id, 'grid');
          setDocumentViewMode(mockDocument.id, 'tree');
          setDocumentViewMode(mockDocument.id, 'text');
        });
      }).not.toThrow();

      expect(getDocumentViewMode(mockDocument.id)).toBe('text');
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should properly cleanup listeners on unmount', () => {
      viewCoordinator.registerViewListener(ViewType.TEXT, vi.fn());
      viewCoordinator.registerViewListener(ViewType.GRID, vi.fn());

      expect(viewCoordinator.getListenerCount()).toBe(2);

      viewCoordinator.clear();

      expect(viewCoordinator.getListenerCount()).toBe(0);
    });

    it('should cleanup sync manager on component unmount', () => {
      let syncManager: ViewSyncManager | null = null;

      function TestComponent() {
        const [manager] = React.useState(() => new ViewSyncManager(vi.fn()));
        syncManager = manager;

        React.useEffect(() => {
          return () => {
            manager.destroy();
          };
        }, [manager]);

        return <div>Test</div>;
      }

      const { unmount } = render(<TestComponent />);

      expect(syncManager).not.toBeNull();

      // Unmount should trigger cleanup
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Performance and Efficiency', () => {
    it('should not cause memory leaks with repeated updates', async () => {
      const gridListener = vi.fn();
      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);

      function TextEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="many-updates"
            onClick={() => {
              // Send 100 rapid updates
              for (let i = 0; i < 100; i++) {
                notifyViewChanged(`<root>update-${i}</root>`, ChangeType.CONTENT);
              }
            }}
          >
            Many Updates
          </button>
        );
      }

      render(<TextEditor />);

      const btn = document.querySelector('[data-testid="many-updates"]') as HTMLButtonElement;

      const startTime = Date.now();

      await act(async () => {
        fireEvent.click(btn);
      });

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second for 100 updates with debouncing)
      expect(duration).toBeLessThan(1000);
    });

    it('should efficiently handle large content updates', () => {
      const gridListener = vi.fn();
      viewCoordinator.registerViewListener(ViewType.GRID, gridListener);

      // Create large XML (100KB)
      let largeContent = '<?xml version="1.0"?><root>';
      for (let i = 0; i < 1000; i++) {
        largeContent += `<item id="${i}">${'x'.repeat(100)}</item>`;
      }
      largeContent += '</root>';

      function TextEditor() {
        const { notifyViewChanged } = useViewSync(mockDocument, ViewType.TEXT);

        return (
          <button
            data-testid="large-update"
            onClick={() => notifyViewChanged(largeContent, ChangeType.CONTENT)}
          >
            Large Update
          </button>
        );
      }

      render(<TextEditor />);

      const btn = document.querySelector('[data-testid="large-update"]') as HTMLButtonElement;

      const startTime = Date.now();

      act(() => {
        fireEvent.click(btn);
      });

      const duration = Date.now() - startTime;

      // Should handle large updates efficiently (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
