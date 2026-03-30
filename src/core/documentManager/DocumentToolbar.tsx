/**
 * DocumentToolbar Props
 */
interface DocumentToolbarProps {
  /** Callback when New File button is clicked */
  onNewFile: () => void;
  /** Callback when Open File button is clicked */
  onOpenFile: () => void;
}

/**
 * DocumentToolbar Component
 *
 * Toolbar component with New File and Open File buttons.
 *
 * @example
 * ```tsx
 * <DocumentToolbar
 *   onNewFile={() => console.log('New file')}
 *   onOpenFile={() => console.log('Open file')}
 * />
 * ```
 */
export function DocumentToolbar({ onNewFile, onOpenFile }: DocumentToolbarProps) {
  return (
    <div className="document-toolbar">
      <button
        type="button"
        className="toolbar-button"
        onClick={onNewFile}
        data-testid="new-file-button"
      >
        New File
      </button>
      <button
        type="button"
        className="toolbar-button"
        onClick={onOpenFile}
        data-testid="open-file-button"
      >
        Open File
      </button>
    </div>
  );
}
