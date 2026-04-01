/**
 * ViewSyncManager
 *
 * Manages debouncing of view updates to prevent render storms.
 * Ensures that rapid successive updates from multiple views are
 * coalesced efficiently while prioritizing important updates.
 *
 * Key behaviors:
 * - First update is always processed immediately
 * - Subsequent updates are debounced (default 300ms)
 * - Full updates cancel pending content updates
 * - Structure updates are processed immediately like full updates
 */

import { ViewUpdate, ChangeType } from './ViewUpdate';

/**
 * Configuration options for ViewSyncManager
 */
export interface ViewSyncManagerOptions {
  /** Delay in milliseconds for debouncing updates (default: 300) */
  debounceDelay?: number;
}

/**
 * Callback function type for processing updates
 */
export type UpdateProcessor = (update: ViewUpdate) => void;

/**
 * Manages view update debouncing and prioritization
 *
 * The ViewSyncManager prevents render storms by debouncing rapid
 * successive updates while ensuring important updates (FULL, STRUCTURE)
 * are processed immediately.
 *
 * @example
 * ```typescript
 * const manager = new ViewSyncManager(
 *   (update) => console.log('Processing:', update),
 *   { debounceDelay: 300 }
 * );
 *
 * manager.scheduleUpdate(update1);
 * manager.scheduleUpdate(update2);
 * manager.destroy();
 * ```
 */
export class ViewSyncManager {
  private debounceDelay: number;
  private onProcessUpdate: UpdateProcessor;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private pendingUpdate: ViewUpdate | null = null;
  private isDestroyed: boolean = false;

  /**
   * Creates a new ViewSyncManager
   *
   * @param onProcessUpdate - Callback to process debounced updates
   * @param options - Configuration options
   */
  constructor(
    onProcessUpdate: UpdateProcessor,
    options: ViewSyncManagerOptions = {}
  ) {
    this.debounceDelay = options.debounceDelay ?? 300;
    this.onProcessUpdate = onProcessUpdate;
  }

  /**
   * Schedules an update for processing
   *
   * Processing rules:
   * - First update is processed immediately
   * - Subsequent updates are debounced
   * - FULL updates cancel pending content updates
   * - STRUCTURE updates cancel pending and restart debounce
   * - SELECTION updates process immediately but don't affect debounce cycle
   *
   * @param update - The update to schedule
   */
  scheduleUpdate(update: ViewUpdate): void {
    if (this.isDestroyed) {
      return;
    }

    // Full updates cancel pending content updates
    if (update.changeType === ChangeType.FULL) {
      this.cancelPendingUpdate();
    }

    // Determine processing strategy
    const isFullUpdate = update.changeType === ChangeType.FULL;
    const isStructureUpdate = update.changeType === ChangeType.STRUCTURE;
    const isSelectionUpdate = update.changeType === ChangeType.SELECTION;
    const processImmediately = isFullUpdate || isStructureUpdate || isSelectionUpdate;

    // First update processes immediately and starts debounce window
    if (!this.timeoutId) {
      this.processUpdate(update);
      // Only start debounce window for non-immediate updates
      if (!processImmediately) {
        this.scheduleDebouncedUpdate();
      }
      return;
    }

    // Handle immediate updates (FULL, STRUCTURE, SELECTION)
    if (processImmediately) {
      // Process immediately without affecting debounce cycle
      this.processUpdate(update);

      // STRUCTURE updates restart the debounce cycle
      if (isStructureUpdate) {
        this.cancelPendingUpdate();
        // Don't restart - let next content update start it
      }
      // FULL and SELECTION don't affect the debounce cycle
      return;
    }

    // Store content update for debounced processing
    this.pendingUpdate = update;
  }

  /**
   * Processes an update immediately
   *
   * @param update - The update to process
   */
  private processUpdate(update: ViewUpdate): void {
    if (!this.isDestroyed) {
      this.onProcessUpdate(update);
    }
  }

  /**
   * Schedules a debounced update window
   *
   * After the delay, any pending update will be processed
   */
  private scheduleDebouncedUpdate(): void {
    this.timeoutId = setTimeout(() => {
      if (this.pendingUpdate) {
        this.processUpdate(this.pendingUpdate);
        this.pendingUpdate = null;
      }
      this.timeoutId = null;
    }, this.debounceDelay);
  }

  /**
   * Cancels any pending debounced update
   */
  private cancelPendingUpdate(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingUpdate = null;
  }

  /**
   * Cleans up resources and cancels pending operations
   *
   * After calling destroy, no further updates will be processed.
   */
  destroy(): void {
    this.isDestroyed = true;
    this.cancelPendingUpdate();
  }
}
