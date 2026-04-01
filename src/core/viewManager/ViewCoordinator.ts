/**
 * ViewCoordinator
 *
 * Central dispatcher for view synchronization using the Observer pattern.
 * Broadcasts updates from one view to all other registered views, ensuring
 * that the source view does not receive its own updates back.
 *
 * This coordinator is a singleton that manages all view-to-view communication
 * in the application.
 */

import { ViewType, ViewUpdate } from './ViewUpdate';

/**
 * Listener function type for view updates
 * Each registered view receives updates through this callback
 */
export type ViewListener = (update: ViewUpdate) => void;

/**
 * ViewCoordinator - Central dispatcher for view synchronization
 *
 * Implements the Observer pattern to broadcast updates from one view
 * to all other registered views while preventing update loops by
 * excluding the source view from receiving its own updates.
 *
 * @example
 * ```typescript
 * // Register a view listener
 * const unregister = viewCoordinator.registerViewListener(
 *   ViewType.TEXT,
 *   (update) => console.log('Received:', update)
 * );
 *
 * // Broadcast an update
 * viewCoordinator.broadcastUpdate(update);
 *
 * // Later, unregister the listener
 * unregister();
 * ```
 */
export class ViewCoordinator {
  /**
   * Map of registered view listeners by view type
   * Each view type can have only one active listener at a time
   */
  private viewListeners: Map<ViewType, ViewListener> = new Map();

  /**
   * Registers a listener for a specific view type
   *
   * @param viewType - The type of view to register (TEXT, GRID, or TREE)
   * @param listener - Callback function to receive updates
   * @returns Unregister function that removes the listener when called
   *
   * @example
   * ```typescript
   * const unregister = viewCoordinator.registerViewListener(
   *   ViewType.TEXT,
   *   (update) => handleUpdate(update)
   * );
   *
   * // Clean up when component unmounts
   * useEffect(() => {
   *   return () => unregister();
   * }, []);
   * ```
   */
  registerViewListener(viewType: ViewType, listener: ViewListener): () => void {
    this.viewListeners.set(viewType, listener);

    // Return cleanup function
    return () => {
      this.viewListeners.delete(viewType);
    };
  }

  /**
   * Broadcasts an update to all registered views except the source
   *
   * This prevents update loops where a view receives back the same
   * update it just sent, which would cause infinite re-render cycles.
   *
   * @param update - The ViewUpdate to broadcast to other views
   *
   * @example
   * ```typescript
   * const update = createViewUpdate(
   *   ViewType.TEXT,
   *   '<root>updated</root>',
   *   ChangeType.CONTENT
   * );
   *
   * // Broadcasts to GRID and TREE, but not TEXT (source)
   * viewCoordinator.broadcastUpdate(update);
   * ```
   */
  broadcastUpdate(update: ViewUpdate): void {
    this.viewListeners.forEach((listener, viewType) => {
      // Don't broadcast back to the source view
      if (viewType !== update.sourceView) {
        listener(update);
      }
    });
  }

  /**
   * Returns the number of currently registered listeners
   *
   * Useful for debugging and testing to verify listeners are
   * properly registered and unregistered.
   *
   * @returns Count of active view listeners
   */
  getListenerCount(): number {
    return this.viewListeners.size;
  }

  /**
   * Clears all registered listeners
   *
   * Useful for cleanup and testing. Removes all view listeners
   * from the coordinator.
   *
   * @example
   * ```typescript
   * viewCoordinator.clear();
   * console.log(viewCoordinator.getListenerCount()); // 0
   * ```
   */
  clear(): void {
    this.viewListeners.clear();
  }
}

/**
 * Global singleton instance of ViewCoordinator
 *
 * Use this instance throughout the application to coordinate
 * view updates across all open views.
 *
 * @example
 * ```typescript
 * import { viewCoordinator } from '@/core/viewManager';
 *
 * // Register listener
 * viewCoordinator.registerViewListener(ViewType.TEXT, myListener);
 *
 * // Broadcast update
 * viewCoordinator.broadcastUpdate(myUpdate);
 * ```
 */
export const viewCoordinator = new ViewCoordinator();
