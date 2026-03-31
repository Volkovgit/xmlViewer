import { useCallback, useRef, useState } from 'react';
import { useDocumentStore } from '@/stores';
import { createDocumentFromFile } from '@/services/document';
import { Document, DocumentStatus } from '@/types';

/**
 * File System Access API types
 * Extends Window interface to include File System Access API
 */
interface FileSystemAccessAPI {
  showSaveFilePicker: (options?: any) => Promise<any>;
  showOpenFilePicker: (options?: any) => Promise<any[]>;
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
  /** Handle multiple files (e.g. from drag and drop) */
  handleFiles: (files: FileList | File[]) => Promise<Document[]>;
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
    updateDocumentMetadata,
  } = useDocumentStore();

  /**
   * Open file picker dialog
   * Uses File System Access API if available, otherwise triggers hidden input
   */
  const openFile = useCallback(async (): Promise<Document | null> => {
    if ('showOpenFilePicker' in window && window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: 'XML Files',
              accept: { 'text/xml': ['.xml', '.xsd', '.xsl', '.xslt', '.xq', '.xquery'] },
            },
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });

        setIsLoading(true);
        const docs = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          const doc = await createDocumentFromFile(file);
          doc.fileHandle = handle;
          doc.filePath = file.name;
          addDocument(doc);
          addToRecents(doc.id);
          docs.push(doc);
        }

        if (docs.length > 0) {
          setActiveDocument(docs[docs.length - 1].id);
          return docs[0];
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return null; // User cancelled
        }
        console.error('Failed to open file via picker:', error);
      } finally {
        setIsLoading(false);
      }
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    return null;
  }, [addDocument, addToRecents, setActiveDocument]);

  /**
   * Handle multiple files (e.g. from drag and drop)
   */
  const handleFiles = useCallback(
    async (files: FileList | File[]): Promise<Document[]> => {
      if (!files || files.length === 0) return [];

      setIsLoading(true);
      const newDocs: Document[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const doc = await createDocumentFromFile(file);
          addDocument(doc);
          addToRecents(doc.id);
          newDocs.push(doc);
        }

        // Set the last opened document as active
        if (newDocs.length > 0) {
          setActiveDocument(newDocs[newDocs.length - 1].id);
        }

        return newDocs;
      } catch (error) {
        console.error('Failed to open files:', error);
        return newDocs;
      } finally {
        setIsLoading(false);
      }
    },
    [addDocument, setActiveDocument, addToRecents]
  );

  /**
   * Handle file selection from input element
   * Reads the file, creates a document, and adds it to the store
   */
  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<Document | null> => {
      const files = e.target.files;
      if (!files || files.length === 0) {
        return null;
      }

      const docs = await handleFiles(files);

      // Reset input value to allow selecting the same file again
      if (e.target) {
        e.target.value = '';
      }

      return docs.length > 0 ? docs[0] : null;
    },
    [handleFiles]
  );

  /**
   * Save document to disk
   * If document has a fileHandle, writes directly.
   * If document has no fileHandle/filePath, prompts for location (Save As).
   */
  const saveFile = useCallback(
    async (document: Document): Promise<boolean> => {
      // If untitled (no fileHandle/filePath) and we have window.showSaveFilePicker
      // or if it's new and we don't have a handle, we MUST use saveFileAs
      if (!document.fileHandle && !document.filePath) {
        return saveFileAs(document);
      }

      setIsLoading(true);

      try {
        // Direct write using existing FileSystemFileHandle
        if (document.fileHandle && 'createWritable' in document.fileHandle) {
          const writable = await document.fileHandle.createWritable();
          await writable.write(document.content);
          await writable.close();

          markDocumentSaved(document.id);
          return true;
        }
        // Fallback or legacy save-as check if handle is missing but filePath exists:
        // Use File System Access API if available but no cached handle (edge case)
        if ('showSaveFilePicker' in window && !document.fileHandle) {
          return saveFileAs(document);
        } else {
          // Fallback: download file for browsers without File System API
          const blob = new Blob([document.content], { type: 'text/xml' });
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          a.download = document.name;
          a.click();
          URL.revokeObjectURL(url);

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
    [markDocumentSaved, updateDocumentMetadata]
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
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(document.content);
          await writable.close();

          // Update document metadata with new handle and name
          updateDocumentMetadata(document.id, {
            fileHandle: handle,
            filePath: handle.name,
            name: handle.name,
          });

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
    [markDocumentSaved, updateDocumentMetadata]
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
    handleFiles,
    fileInputRef,
    saveFile,
    saveFileAs,
    saveAllDocuments,
    recentDocuments: recentDocuments(),
    hasDirtyDocuments: hasDirtyDocuments(),
    isLoading,
  };
}
