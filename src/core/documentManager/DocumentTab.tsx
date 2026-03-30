import { Document, DocumentStatus } from '@/types';

/**
 * DocumentTab Props
 */
interface DocumentTabProps {
  /** The document to display */
  document: Document;
  /** Whether this tab is the active tab */
  isActive: boolean;
  /** Callback when the tab is clicked */
  onClick: () => void;
  /** Callback when the close button is clicked */
  onClose: () => void;
}

/**
 * DocumentTab Component
 *
 * Individual tab component showing document name, dirty indicator, and close button.
 *
 * @example
 * ```tsx
 * <DocumentTab
 *   document={doc}
 *   isActive={true}
 *   onClick={() => switchDocument(doc.id)}
 *   onClose={() => closeDocument(doc.id)}
 * />
 * ```
 */
export function DocumentTab({ document, isActive, onClick, onClose }: DocumentTabProps) {
  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const showDirtyIndicator = document.status === DocumentStatus.DIRTY;

  return (
    <div
      className={`document-tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      data-testid={`document-tab-${document.id}`}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
    >
      <span className="document-name" data-testid={`document-name-${document.id}`}>
        {document.name}
      </span>
      {showDirtyIndicator && (
        <span
          className="dirty-indicator"
          data-testid={`dirty-indicator-${document.id}`}
          aria-label="Unsaved changes"
        >
          &bull;
        </span>
      )}
      <button
        type="button"
        className="close-button"
        onClick={handleCloseClick}
        data-testid={`close-button-${document.id}`}
        aria-label={`Close ${document.name}`}
        tabIndex={-1}
      >
        &times;
      </button>
    </div>
  );
}
