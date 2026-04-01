/**
 * ViewUpdate Data Structures
 *
 * Defines the data structures used for view synchronization updates.
 * These structures represent changes made in one view that need to be
 * propagated to other views.
 */

/**
 * Enum representing the different view types in the application
 */
export enum ViewType {
  /** Text-based editor (Monaco) */
  TEXT = 'TEXT',
  /** Hierarchical tree view */
  TREE = 'TREE',
  /** Tabular grid view */
  GRID = 'GRID',
}

/**
 * Enum representing the type of change that occurred
 */
export enum ChangeType {
  /** Content changed (text, node values) */
  CONTENT = 'CONTENT',
  /** Structure changed (nodes added/removed/moved) */
  STRUCTURE = 'STRUCTURE',
  /** Only selection/cursor changed */
  SELECTION = 'SELECTION',
  /** Full document update (re-render everything) */
  FULL = 'FULL',
}

/**
 * Position information for text editor cursor/selection
 */
export interface TextPosition {
  /** Line number (1-based) */
  lineNumber: number;
  /** Column number (1-based) */
  column: number;
  /** Optional selection end position */
  selection?: {
    endLineNumber: number;
    endColumn: number;
  };
}

/**
 * Position information for tree view selection
 */
export class TreeSelection {
  /** Unique identifier of the selected node */
  readonly nodeId: string;
  /** Set of expanded node IDs (for maintaining tree state) */
  readonly expandedNodes?: Set<string>;

  /**
   * Creates a new TreeSelection instance
   * @param nodeId - Unique identifier of the selected node
   * @param expandedNodes - Optional set of expanded node IDs
   */
  constructor(nodeId: string, expandedNodes?: Set<string>) {
    this.nodeId = nodeId;
    this.expandedNodes = expandedNodes;
  }
}

/**
 * Position information for grid view selection
 */
export class GridSelection {
  /** Unique identifier of the selected row */
  readonly rowId: string;
  /** Field/column name of the selected cell */
  readonly field: string;

  /**
   * Creates a new GridSelection instance
   * @param rowId - Unique identifier of the selected row
   * @param field - Field/column name of the selected cell
   */
  constructor(rowId: string, field: string) {
    this.rowId = rowId;
    this.field = field;
  }
}

/**
 * Represents an update from one view that needs to be propagated to other views
 */
export interface ViewUpdate {
  /** The view that originated this update */
  sourceView: ViewType;
  /** The type of change that occurred */
  changeType: ChangeType;
  /** The full content of the document after the change */
  content: string;
  /** Optional position information (context-dependent) */
  position?: TextPosition | TreeSelection | GridSelection;
  /** Timestamp when the update was created (milliseconds since epoch) */
  timestamp: number;
  /** Unique identifier for this update */
  updateId: string;
}

/**
 * Factory function to create a ViewUpdate with automatic ID generation
 *
 * @param sourceView - The view that originated this update
 * @param content - The full content of the document after the change
 * @param changeType - The type of change that occurred (defaults to CONTENT)
 * @param position - Optional position information
 * @returns A new ViewUpdate instance with generated ID and timestamp
 */
export function createViewUpdate(
  sourceView: ViewType,
  content: string,
  changeType: ChangeType = ChangeType.CONTENT,
  position?: TextPosition | TreeSelection | GridSelection
): ViewUpdate {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  const updateId = `${sourceView}-${timestamp}-${randomStr}`;

  return {
    sourceView,
    changeType,
    content,
    position,
    timestamp,
    updateId,
  };
}
