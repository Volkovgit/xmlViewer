import { Document } from '@/types';
import { DocumentTab } from './DocumentTab';

/**
 * DocumentTabs Props
 */
interface DocumentTabsProps {
  /** Array of all open documents */
  documents: Document[];
  /** ID of the currently active document */
  activeDocumentId: string | null;
  /** Callback when a tab is clicked */
  onTabClick: (docId: string) => void;
  /** Callback when a tab's close button is clicked */
  onClose: (docId: string) => void;
}

/**
 * DocumentTabs Component
 *
 * Horizontal tab bar showing all open documents.
 * Each tab shows document name, dirty indicator, and close button.
 *
 * @example
 * ```tsx
 * <DocumentTabs
 *   documents={documents}
 *   activeDocumentId={activeId}
 *   onTabClick={(id) => setActiveDocument(id)}
 *   onClose={(id) => closeDocument(id)}
 * />
 * ```
 */
export function DocumentTabs({
  documents,
  activeDocumentId,
  onTabClick,
  onClose,
}: DocumentTabsProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="document-tabs" data-testid="document-tabs">
      {documents.map((doc) => (
        <DocumentTab
          key={doc.id}
          document={doc}
          isActive={doc.id === activeDocumentId}
          onClick={() => onTabClick(doc.id)}
          onClose={() => onClose(doc.id)}
        />
      ))}
    </div>
  );
}
