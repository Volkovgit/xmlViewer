import { create } from 'zustand';
import { Document, DocumentStatus } from '@/types';

/**
 * Document Store State Interface
 * Contains all state properties for document management
 */
interface DocumentStoreState {
  /** Map of all documents indexed by ID */
  documents: Map<string, Document>;
  /** ID of the currently active document */
  activeDocumentId: string | null;
  /** Array of document IDs in order of recent access */
  recentDocuments: string[];
}

/**
 * Document Store Actions Interface
 * Contains all actions for manipulating document state
 */
interface DocumentStoreActions {
  // Document CRUD operations
  /** Add a new document to the store */
  addDocument: (document: Document) => void;
  /** Remove a document from the store */
  removeDocument: (id: string) => void;
  /** Get a document by ID */
  getDocument: (id: string) => Document | undefined;
  /** Get all documents as an array */
  getAllDocuments: () => Document[];

  // Active document management
  /** Set the active document by ID */
  setActiveDocument: (id: string) => void;

  // Content updates
  /** Update document content and mark as dirty */
  updateDocumentContent: (id: string, content: string) => void;

  // Status management
  /** Mark a document as saved (clears dirty flag) */
  markDocumentSaved: (id: string) => void;
  /** Mark a document as dirty (has unsaved changes) */
  markDocumentDirty: (id: string) => void;
  /** Set a specific status for a document */
  setDocumentStatus: (id: string, status: DocumentStatus) => void;

  // Recent documents
  /** Add a document to recent documents list */
  addToRecents: (id: string) => void;
  /** Clear all recent documents */
  clearRecents: () => void;
  /** Get recent documents as Document array */
  getRecentDocuments: () => Document[];

  // Computed/Getters
  /** Get the active document or null */
  getActiveDocument: () => Document | null;
  /** Check if any document has unsaved changes */
  hasDirtyDocuments: () => boolean;
}

/**
 * Combined Document Store Interface
 * Extends both state and actions
 */
interface DocumentStore extends DocumentStoreState, DocumentStoreActions {}

/**
 * Maximum number of recent documents to track
 */
const MAX_RECENT_DOCUMENTS = 10;

/**
 * Document Store
 *
 * Zustand store for managing document state in the XML editor.
 * Uses Map for efficient document lookup and maintains recent documents history.
 *
 * @example
 * ```tsx
 * const { addDocument, activeDocument, updateDocumentContent } = useDocumentStore();
 * ```
 */
export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial state
  documents: new Map(),
  activeDocumentId: null,
  recentDocuments: [],

  // Document CRUD operations
  addDocument: (document) => {
    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.set(document.id, document);
      return { documents: newDocuments };
    });
  },

  removeDocument: (id) => {
    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.delete(id);
      const newRecentDocuments = state.recentDocuments.filter((docId) => docId !== id);
      const newActiveDocumentId =
        state.activeDocumentId === id ? null : state.activeDocumentId;
      return {
        documents: newDocuments,
        recentDocuments: newRecentDocuments,
        activeDocumentId: newActiveDocumentId,
      };
    });
  },

  getDocument: (id) => {
    return get().documents.get(id);
  },

  getAllDocuments: () => {
    return Array.from(get().documents.values());
  },

  // Active document management
  setActiveDocument: (id) => {
    set(() => {
      const state = get();
      if (!state.documents.has(id)) {
        return {};
      }
      return { activeDocumentId: id };
    });
  },

  // Content updates
  updateDocumentContent: (id, content) => {
    set((state) => {
      const document = state.documents.get(id);
      if (!document) {
        return {};
      }

      const newDocuments = new Map(state.documents);
      newDocuments.set(id, {
        ...document,
        content,
        modifiedAt: new Date(),
        status: DocumentStatus.DIRTY,
      });
      return { documents: newDocuments };
    });
  },

  // Status management
  markDocumentSaved: (id) => {
    set((state) => {
      const document = state.documents.get(id);
      if (!document) {
        return {};
      }

      const newDocuments = new Map(state.documents);
      newDocuments.set(id, {
        ...document,
        status: DocumentStatus.SAVED,
      });
      return { documents: newDocuments };
    });
  },

  markDocumentDirty: (id) => {
    set((state) => {
      const document = state.documents.get(id);
      if (!document) {
        return {};
      }

      const newDocuments = new Map(state.documents);
      newDocuments.set(id, {
        ...document,
        status: DocumentStatus.DIRTY,
      });
      return { documents: newDocuments };
    });
  },

  setDocumentStatus: (id, status) => {
    set((state) => {
      const document = state.documents.get(id);
      if (!document) {
        return {};
      }

      const newDocuments = new Map(state.documents);
      newDocuments.set(id, {
        ...document,
        status,
      });
      return { documents: newDocuments };
    });
  },

  // Recent documents
  addToRecents: (id) => {
    set((state) => {
      // Filter out the ID if it already exists
      const filtered = state.recentDocuments.filter((docId) => docId !== id);
      // Add to front
      const newRecentDocuments = [id, ...filtered].slice(0, MAX_RECENT_DOCUMENTS);
      return { recentDocuments: newRecentDocuments };
    });
  },

  clearRecents: () => {
    set({ recentDocuments: [] });
  },

  getRecentDocuments: () => {
    const { documents, recentDocuments } = get();
    return recentDocuments
      .map((id) => documents.get(id))
      .filter((doc): doc is Document => doc !== undefined);
  },

  // Computed/Getters
  getActiveDocument: () => {
    const { activeDocumentId, documents } = get();
    return activeDocumentId ? documents.get(activeDocumentId) ?? null : null;
  },

  hasDirtyDocuments: () => {
    const { documents } = get();
    return Array.from(documents.values()).some(
      (doc) => doc.status === DocumentStatus.DIRTY
    );
  },
}));
