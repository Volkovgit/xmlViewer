import { useCallback, useRef, useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { createDocumentFromFile } from '@/services/document/DocumentFactory';
import { Document, DocumentStatus } from '@/types';

/**
 * File System Access API types
 * Extends Window interface to include File System Access API
 */
interface FileSystemAccessAPI {
  showSaveFilePicker: () => Promise<FileSystemFileHandle>;
  showOpenFilePicker: () => Promise<FileSystemFileHandle[]>;
}

declare global {
  interface Window {
    showSaveFilePicker?: FileSystemAccessAPI['showSaveFilePicker'];
    showOpenFilePicker?: FileSystemAccessAPI['showOpenFilePicker'];
  }
}

/**
 * File Operations Hook Return Type
 */
export interface UseFileOperationsReturn {
  /** Open file picker dialog */
  openFile: () => Promise<Document | null>;
  /** Handle file selection from input element */
  handleFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => Promise<Document | null>;
  /** Reference to hidden file input element */
  fileInputRef: React.RefObject<HTMLInputElement>;
  /** Save document to disk */
  saveFile: (document: Document) => Promise<boolean>;
  /** Save document with new filename */
  saveFileAs: (document: Document) => Promise<boolean>;
  /** Save all dirty documents */
  saveAllDocuments: () => Promise<boolean>;
  /** Get recent documents */
  recentDocuments: Document[];
  /** Check if any document has unsaved changes */
  hasDirtyDocuments: boolean;
  /** Loading state during file operations */
  isLoading: boolean;
}

/**
 * Custom hook for file I/O operations
 *
 * Provides functionality for opening, saving, and managing documents.
 * Uses File System Access API with fallbacks for older browsers.
 *
 * @example
 * ```tsx
 * function Editor() {
 *   const {
 *     openFile,
 *     saveFile,
 *     saveAllDocuments,
 *     fileInputRef,
 *     hasDirtyDocuments
 *   } = useFileOperations();
 *
 *   return (
 *     <>
 *       <input
 *         ref={fileInputRef}
 *         type="file"
 *         accept=".xml,.xsd,.xslt,.xquery,.json"
 *         style={{ display: 'none' }}
 *         onChange={handleFileSelected}
 *       />
 *       <button onClick={openFile}>Open File</button>
 *       <button onClick={() => saveFile(document)}>Save</button>
 *       <button onClick={saveAllDocuments} disabled={!hasDirtyDocuments}>
 *         Save All
 *       </button>
 *     </>
 *   );
 * }
 * ```
 */
export function useFileOperations(): UseFileOperationsReturn {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    addDocument,
    setActiveDocument,
    markDocumentSaved,
    getAllDocuments,
    getRecentDocuments,
    hasDirtyDocuments,
    addToRecents,
  } = useDocumentStore();

  /**
   * Open file picker dialog
   * Triggers the hidden file input click
   */
  const openFile = useCallback(async (): Promise<Document | null> => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    return null;
  }, []);

  /**
   * Handle file selection from input element
   * Reads the file, creates a document, and adds it to the store
   */
  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<Document | null> => {
      const file = e.target.files?.[0];
      if (!file) return null;

      setIsLoading(true);

      try {
        // Create document from file
        const doc = await createDocumentFromFile(file);

        // Add to store
        addDocument(doc);
        setActiveDocument(doc.id);
        addToRecents(doc.id);

        return doc;
      } catch (error) {
        console.error('Failed to open file:', error);
        return null;
      } finally {
        setIsLoading(false);

        // Reset input value to allow selecting the same file again
        if (e.target) {
          e.target.value = '';
        }
      }
    },
    [addDocument, setActiveDocument, addToRecents]
  );

  /**
   * Save document to disk
   * If document has no filePath, prompts for location (Save As)
   */
  const saveFile = useCallback(
    async (document: Document): Promise<boolean> => {
      // If untitled (no filePath), use save as
      if (!document.filePath) {
        return saveFileAs(document);
      }

      setIsLoading(true);

      try {
        // Use File System Access API if available
        if ('showSaveFilePicker' in window) {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: document.name,
          });

          const writable = await handle.createWritable();
          await writable.write(document.content);
          await writable.close();

          // Mark as saved
          markDocumentSaved(document.id);
          return true;
        } else {
          // Fallback: download file
          const blob = new Blob([document.content], { type: 'text/xml' });
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = document.name;
          a.click();
          URL.revokeObjectURL(url);

          // Mark as saved
          markDocumentSaved(document.id);
          return true;
        }
      } catch (error) {
        console.error('Failed to save file:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markDocumentSaved]
  );

  /**
   * Save document with a new filename
   * Always prompts for file location
   */
  const saveFileAs = useCallback(
    async (document: Document): Promise<boolean> => {
      setIsLoading(true);

      try {
        if ('showSaveFilePicker' in window) {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: document.name,
            types: [
              {
                description: 'XML Files',
                accept: { 'text/xml': ['.xml', '.xsd'] },
              },
              {
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] },
              },
              {
                description: 'All Files',
                accept: { '*/*': ['*'] },
              },
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(document.content);
          await writable.close();

          // Mark as saved
          markDocumentSaved(document.id);
          return true;
        } else {
          // Fallback: prompt for filename
          const filename = prompt('Save as:', document.name);
          if (!filename) return false;

          const blob = new Blob([document.content], { type: 'text/xml' });
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);

          // Mark as saved
          markDocumentSaved(document.id);
          return true;
        }
      } catch (error) {
        // User cancelled the dialog
        if (error instanceof Error && error.name === 'AbortError') {
          return false;
        }
        console.error('Failed to save file as:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [markDocumentSaved]
  );

  /**
   * Save all dirty documents
   * Iterates through all documents and saves only those with unsaved changes
   */
  const saveAllDocuments = useCallback(async (): Promise<boolean> => {
    const allDocs = getAllDocuments();
    const dirtyDocs = allDocs.filter((doc) => doc.status === DocumentStatus.DIRTY);

    if (dirtyDocs.length === 0) {
      return true; // Nothing to save
    }

    let allSuccessful = true;
    for (const doc of dirtyDocs) {
      const saved = await saveFile(doc);
      if (!saved) {
        allSuccessful = false;
      }
    }

    return allSuccessful;
  }, [getAllDocuments, saveFile]);

  /**
   * Get recent documents from store
   */
  const recentDocuments = useCallback((): Document[] => {
    return getRecentDocuments();
  }, [getRecentDocuments]);

  return {
    openFile,
    handleFileSelected,
    fileInputRef,
    saveFile,
    saveFileAs,
    saveAllDocuments,
    recentDocuments: recentDocuments(),
    hasDirtyDocuments: hasDirtyDocuments(),
    isLoading,
  };
}
