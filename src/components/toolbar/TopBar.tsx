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
  /** Whether the active document is an XSD file */
  isXSDDocument?: boolean;
  /** Current XSD view mode */
  xsdMode?: 'text' | 'graph';
  /** Callback when XSD mode changes */
  onXsdModeChange?: (mode: 'text' | 'graph') => void;
}

/**
 * TopBar Component
 *
 * Modern toolbar with file operations and XSD mode switcher.
 * XSD-specific operations have been moved to the ActionsPanel in the sidebar.
 */
export function TopBar({
  onNewFile,
  onOpenFile,
  onSave,
  hasActiveDocument = false,
  isXSDDocument = false,
  xsdMode = 'text',
  onXsdModeChange,
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

        {isXSDDocument && (
          <div className="xsd-mode-switcher">
            <span className="mode-label">Mode:</span>
            <label className={xsdMode === 'text' ? 'active' : ''}>
              <input
                type="radio"
                name="xsd-mode"
                checked={xsdMode === 'text'}
                onChange={() => onXsdModeChange?.('text')}
                data-testid="xsd-text-mode-radio"
              />
              Text
            </label>
            <label className={xsdMode === 'graph' ? 'active' : ''}>
              <input
                type="radio"
                name="xsd-mode"
                checked={xsdMode === 'graph'}
                onChange={() => onXsdModeChange?.('graph')}
                data-testid="xsd-graph-mode-radio"
              />
              Graph
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
