/**
 * TopBar Props
 */
interface TopBarProps {
  /** Callback when New File button is clicked */
  onNewFile: () => void;
  /** Callback when Open File button is clicked */
  onOpenFile: () => void;
  /** Callback when Save button is clicked */
  onSave?: () => void;
  /** Whether there is an active document */
  hasActiveDocument?: boolean;
}

/**
 * TopBar Component
 *
 * Modern toolbar with file operations. XSD-specific operations have been
 * moved to the ActionsPanel in the sidebar.
 */
export function TopBar({
  onNewFile,
  onOpenFile,
  onSave,
  hasActiveDocument = false,
}: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="top-bar-title">XML Previewer</div>
      <div className="top-bar-actions">
        <button
          type="button"
          className="top-bar-button"
          onClick={onNewFile}
          data-testid="new-file-button"
          title="New File (Ctrl+N)"
        >
          New File
        </button>
        <button
          type="button"
          className="top-bar-button"
          onClick={onOpenFile}
          data-testid="open-file-button"
          title="Open File (Ctrl+O)"
        >
          Open File
        </button>
        {hasActiveDocument && onSave && (
          <button
            type="button"
            className="top-bar-button primary"
            onClick={onSave}
            data-testid="save-file-button"
            title="Save (Ctrl+S)"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
}
