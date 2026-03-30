import { useCallback, useRef } from 'react';
import { useDocumentStore } from '@/stores';
import { createUntitledDocument, createDocumentFromFile } from '@/services/document';
import { DocumentType, DocumentStatus } from '@/types';
import { DocumentTabs } from './DocumentTabs';
import { DocumentToolbar } from './DocumentToolbar';
import { XMLTextEditor } from '@/views/text';
import './DocumentManager.css';

/**
 * DocumentManager Component
 *
 * Central UI component for document management in the XML editor.
 * Provides tab bar, toolbar, and document content area.
 *
 * Features:
 * - Tab bar showing all open documents with dirty indicators
 * - Toolbar with New File and Open File buttons
 * - Active document content display
 * - Document switching and closing
 * - Full height layout
 *
 * @example
 * ```tsx
 * <DocumentManager />
 * ```
 */
export function DocumentManager() {
  const {
    getAllDocuments,
    getActiveDocument,
    setActiveDocument,
    removeDocument,
    addDocument,
  } = useDocumentStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle creating a new untitled document
   */
  const handleNewFile = useCallback(() => {
    const newDoc = createUntitledDocument(DocumentType.XML);
    addDocument(newDoc);
    setActiveDocument(newDoc.id);
  }, [addDocument, setActiveDocument]);

  /**
   * Handle opening a file from the file system
   */
  const handleOpenFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const doc = await createDocumentFromFile(file);
        addDocument(doc);
        setActiveDocument(doc.id);
      } catch (error) {
        console.error('Failed to open file:', error);
      }

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addDocument, setActiveDocument]
  );

  /**
   * Handle clicking the Open File button
   */
  const handleOpenButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Handle closing a document
   * Shows confirmation dialog if document has unsaved changes
   */
  const handleClose = useCallback(
    (docId: string) => {
      const documents = getAllDocuments();
      const doc = documents.find((d) => d.id === docId);

      if (!doc) return;

      if (doc.status === DocumentStatus.DIRTY) {
        const confirmed = confirm(
          `Save changes to "${doc.name}" before closing?`
        );
        if (!confirmed) {
          return;
        }
      }

      removeDocument(docId);
    },
    [getAllDocuments, removeDocument]
  );

  /**
   * Handle switching to a different document
   */
  const handleTabClick = useCallback(
    (docId: string) => {
      setActiveDocument(docId);
    },
    [setActiveDocument]
  );

  const documents = getAllDocuments();
  const activeDocument = getActiveDocument();

  return (
    <div className="document-manager">
      <DocumentToolbar
        onNewFile={handleNewFile}
        onOpenFile={handleOpenButtonClick}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="document-file-input"
        onChange={handleOpenFile}
        accept=".xml,.xsd,.xsl,.xslt,.xq,.xquery,.json"
        data-testid="file-input"
      />

      <DocumentTabs
        documents={documents}
        activeDocumentId={activeDocument?.id ?? null}
        onTabClick={handleTabClick}
        onClose={handleClose}
      />

      <div className="document-content">
        {activeDocument ? (
          <div className="active-document" data-testid="active-document">
            <XMLTextEditor document={activeDocument} />
          </div>
        ) : (
          <div className="empty-state" data-testid="empty-state">
            <div className="empty-state-content">
              <h2>No Document Open</h2>
              <p>Create a new file or open an existing file to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
