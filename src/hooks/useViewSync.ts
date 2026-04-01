/**
 * useViewSync Hook
 *
 * React hook for view synchronization that components use to emit updates
 * and receive updates from other views through the ViewCoordinator.
 *
 * This hook provides:
 * - Access to current document and view type
 * - Ability to notify other views of changes
 * - Subscription to updates from other views
 * - Automatic debouncing to prevent update loops
 * - Cleanup on unmount
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { viewCoordinator } from '@/core/viewManager/ViewCoordinator';
import { ViewSyncManager } from '@/core/viewManager/ViewSyncManager';
import { ViewType, ViewUpdate, createViewUpdate, ChangeType } from '@/core/viewManager/ViewUpdate';
import { useDocumentStore } from '@/stores/documentStore';
import { Document } from '@/types';

/**
 * Result type returned by useViewSync hook
 */
export interface UseViewSyncResult {
  /** Current document being synchronized */
  document: Document;
  /** Current view type (TEXT, GRID, or TREE) */
  currentView: ViewType;
  /**
   * Subscribe to updates from other views
   * Note: This is handled internally by ViewCoordinator, so this returns a no-op
   * @param listener - Callback function to receive updates
   * @returns Unsubscribe function
   */
  subscribe: (listener: (update: ViewUpdate) => void) => () => void;
  /**
   * Notify other views that this view has changed
   * @param newContent - New document content after the change
   * @param changeType - Type of change that occurred (default: CONTENT)
   */
  notifyViewChanged: (newContent: string, changeType?: ChangeType) => void;
}

/**
 * React hook for view synchronization
 *
 * Integrates with ViewCoordinator and ViewSyncManager to provide
 * real-time synchronization between multiple views of the same document.
 *
 * Features:
 * - Prevents update loops with timestamp tracking (50ms debounce)
 * - Checks if content actually changed before notifying
 * - Records view updates via document store
 * - Cleans up sync manager on unmount
 *
 * @param document - The document to synchronize
 * @param currentView - The type of view using this hook
 * @returns UseViewSyncResult with synchronization methods
 *
 * @example
 * ```tsx
 * function MyView({ document }) {
 *   const { document: doc, currentView, notifyViewChanged } = useViewSync(
 *     document,
 *     ViewType.TEXT
 *   );
 *
 *   const handleChange = (newContent) => {
 *     notifyViewChanged(newContent, ChangeType.CONTENT);
 *   };
 *
 *   return <Editor value={doc.content} onChange={handleChange} />;
 * }
 * ```
 */
export function useViewSync(
  document: Document,
  currentView: ViewType
): UseViewSyncResult {
  const { recordViewUpdate, shouldProcessViewUpdate } = useDocumentStore();
  const lastUpdateRef = useRef<number>(0);

  // Create sync manager instance once (created on first render, stable across re-renders)
  const [syncManager] = useState(() => {
    return new ViewSyncManager((update) => {
      viewCoordinator.broadcastUpdate(update);
    });
  });

  // Clean up sync manager on unmount
  useEffect(() => {
    return () => {
      syncManager?.destroy();
    };
  }, [syncManager]);

  // Subscribe to updates from this document's other views
  useEffect(() => {
    const listener = (update: ViewUpdate) => {
      // Check if we should process this update (prevents update loops)
      if (!shouldProcessViewUpdate(document.id, update.sourceView as 'text' | 'tree' | 'grid')) {
        return;
      }

      // Only process updates from other views, not from ourselves
      if (update.sourceView !== currentView) {
        lastUpdateRef.current = update.timestamp;
        console.log(`[${currentView}] received update from ${update.sourceView}:`, update.content.substring(0, 50) + '...');
      }
    };

    const unsubscribe = viewCoordinator.registerViewListener(currentView, listener);

    return () => {
      unsubscribe();
    };
  }, [document.id, currentView, shouldProcessViewUpdate]);

  // Notify view changes
  const notifyViewChanged = useCallback(
    (newContent: string, changeType: ChangeType = ChangeType.CONTENT) => {
      // Skip if content hasn't actually changed
      if (newContent === document.content) {
        return;
      }

      const now = Date.now();

      // Prevent rapid updates within 50ms to avoid update loops
      if (now - lastUpdateRef.current < 50) {
        return;
      }

      const update = createViewUpdate(currentView, newContent, changeType);
      recordViewUpdate(document.id, currentView as 'text' | 'tree' | 'grid');
      syncManager?.scheduleUpdate(update);
      lastUpdateRef.current = now;
    },
    [document, currentView, recordViewUpdate, syncManager]
  );

  // Return subscribe as a no-op (ViewCoordinator handles it internally)
  const subscribe = useCallback(() => {
    return () => {
      // No-op unsubscribe function
    };
  }, []);

  return {
    document,
    currentView,
    subscribe,
    notifyViewChanged,
  };
}
