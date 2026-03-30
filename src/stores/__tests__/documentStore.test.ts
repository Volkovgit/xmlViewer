import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../documentStore';
import { Document, DocumentType, DocumentStatus } from '@/types';

/**
 * Helper function to create a mock document
 */
function createMockDocument(overrides?: Partial<Document>): Document {
  const now = new Date();
  return {
    id: 'doc-1',
    name: 'test.xml',
    type: DocumentType.XML,
    content: '<root></root>',
    status: DocumentStatus.READY,
    createdAt: now,
    modifiedAt: now,
    ...overrides,
  };
}

describe('DocumentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDocumentStore.setState({
      documents: new Map(),
      activeDocumentId: null,
      recentDocuments: [],
    });
  });

  describe('addDocument', () => {
    it('should add a document to the store', () => {
      const { addDocument, getDocument, getAllDocuments } = useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);

      expect(getDocument(doc.id)).toEqual(doc);
      expect(getAllDocuments()).toHaveLength(1);
      expect(getAllDocuments()[0]).toEqual(doc);
    });

    it('should add multiple documents to the store', () => {
      const { addDocument, getAllDocuments } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1', name: 'test1.xml' });
      const doc2 = createMockDocument({ id: 'doc-2', name: 'test2.xml' });

      addDocument(doc1);
      addDocument(doc2);

      expect(getAllDocuments()).toHaveLength(2);
    });

    it('should replace existing document when adding with same ID', () => {
      const { addDocument, getDocument } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1', content: '<root>old</root>' });
      const doc2 = createMockDocument({ id: 'doc-1', content: '<root>new</root>' });

      addDocument(doc1);
      addDocument(doc2);

      expect(getDocument(doc1.id)?.content).toBe('<root>new</root>');
      expect(useDocumentStore.getState().getAllDocuments()).toHaveLength(1);
    });
  });

  describe('removeDocument', () => {
    it('should remove a document from the store', () => {
      const { addDocument, removeDocument, getDocument, getAllDocuments } =
        useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);
      expect(getAllDocuments()).toHaveLength(1);

      removeDocument(doc.id);
      expect(getDocument(doc.id)).toBeUndefined();
      expect(getAllDocuments()).toHaveLength(0);
    });

    it('should clear active document ID if removing active document', () => {
      const { addDocument, removeDocument, setActiveDocument } = useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);
      setActiveDocument(doc.id);
      expect(useDocumentStore.getState().activeDocumentId).toBe(doc.id);

      removeDocument(doc.id);
      expect(useDocumentStore.getState().activeDocumentId).toBeNull();
    });

    it('should not clear active document ID if removing different document', () => {
      const { addDocument, removeDocument, setActiveDocument } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });

      addDocument(doc1);
      addDocument(doc2);
      setActiveDocument(doc1.id);
      expect(useDocumentStore.getState().activeDocumentId).toBe(doc1.id);

      removeDocument(doc2.id);
      expect(useDocumentStore.getState().activeDocumentId).toBe(doc1.id);
    });

    it('should remove document from recent documents', () => {
      const { addDocument, removeDocument, addToRecents } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });

      addDocument(doc1);
      addDocument(doc2);
      addToRecents(doc1.id);
      addToRecents(doc2.id);
      expect(useDocumentStore.getState().recentDocuments).toEqual(['doc-2', 'doc-1']);

      removeDocument(doc1.id);
      expect(useDocumentStore.getState().recentDocuments).toEqual(['doc-2']);
    });
  });

  describe('getDocument', () => {
    it('should return undefined for non-existent document', () => {
      const { getDocument } = useDocumentStore.getState();
      expect(getDocument('non-existent')).toBeUndefined();
    });

    it('should return the document if it exists', () => {
      const { addDocument, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);
      expect(getDocument(doc.id)).toEqual(doc);
    });
  });

  describe('getAllDocuments', () => {
    it('should return empty array when no documents', () => {
      const { getAllDocuments } = useDocumentStore.getState();
      expect(getAllDocuments()).toEqual([]);
    });

    it('should return all documents as array', () => {
      const { addDocument, getAllDocuments } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });
      const doc3 = createMockDocument({ id: 'doc-3' });

      addDocument(doc1);
      addDocument(doc2);
      addDocument(doc3);

      const allDocs = getAllDocuments();
      expect(allDocs).toHaveLength(3);
      expect(allDocs).toContainEqual(doc1);
      expect(allDocs).toContainEqual(doc2);
      expect(allDocs).toContainEqual(doc3);
    });
  });

  describe('setActiveDocument', () => {
    it('should set the active document ID', () => {
      const { addDocument, setActiveDocument } = useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);
      setActiveDocument(doc.id);

      expect(useDocumentStore.getState().activeDocumentId).toBe(doc.id);
    });

    it('should not set active document for non-existent document', () => {
      const { setActiveDocument } = useDocumentStore.getState();

      setActiveDocument('non-existent');
      expect(useDocumentStore.getState().activeDocumentId).toBeNull();
    });

    it('should change active document from one to another', () => {
      const { addDocument, setActiveDocument } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });

      addDocument(doc1);
      addDocument(doc2);
      setActiveDocument(doc1.id);
      expect(useDocumentStore.getState().activeDocumentId).toBe(doc1.id);

      setActiveDocument(doc2.id);
      expect(useDocumentStore.getState().activeDocumentId).toBe(doc2.id);
      // setActiveDocument is used above
      void setActiveDocument;
    });
  });

  describe('getActiveDocument', () => {
    it('should return null when no active document', () => {
      const { getActiveDocument } = useDocumentStore.getState();
      expect(getActiveDocument()).toBeNull();
    });

    it('should return the active document', () => {
      const { addDocument, setActiveDocument, getActiveDocument } = useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);
      setActiveDocument(doc.id);

      expect(getActiveDocument()).toEqual(doc);
    });

    it('should return null if active document ID does not exist in store', () => {
      const { getActiveDocument } = useDocumentStore.getState();

      // Manually set active document ID to non-existent document
      useDocumentStore.setState({ activeDocumentId: 'non-existent' });

      expect(getActiveDocument()).toBeNull();
    });
  });

  describe('updateDocumentContent', () => {
    it('should update document content', () => {
      const { addDocument, updateDocumentContent, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument({ content: '<root>old</root>' });

      addDocument(doc);
      updateDocumentContent(doc.id, '<root>new</root>');

      expect(getDocument(doc.id)?.content).toBe('<root>new</root>');
    });

    it('should mark document as dirty when updating content', () => {
      const { addDocument, updateDocumentContent, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument({ status: DocumentStatus.SAVED });

      addDocument(doc);
      updateDocumentContent(doc.id, '<root>updated</root>');

      expect(getDocument(doc.id)?.status).toBe(DocumentStatus.DIRTY);
    });

    it('should update modifiedAt timestamp when updating content', async () => {
      const { addDocument, updateDocumentContent, getDocument } = useDocumentStore.getState();
      const originalDate = new Date('2024-01-01T00:00:00Z');
      const doc = createMockDocument({ modifiedAt: originalDate });

      addDocument(doc);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      updateDocumentContent(doc.id, '<root>updated</root>');

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.modifiedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should not update non-existent document', () => {
      const { updateDocumentContent, getDocument } = useDocumentStore.getState();

      updateDocumentContent('non-existent', '<root>updated</root>');

      expect(getDocument('non-existent')).toBeUndefined();
    });
  });

  describe('markDocumentSaved', () => {
    it('should mark document as saved', () => {
      const { addDocument, markDocumentSaved, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument({ status: DocumentStatus.DIRTY });

      addDocument(doc);
      markDocumentSaved(doc.id);

      expect(getDocument(doc.id)?.status).toBe(DocumentStatus.SAVED);
    });

    it('should not mark non-existent document', () => {
      const { markDocumentSaved, getDocument } = useDocumentStore.getState();

      markDocumentSaved('non-existent');

      expect(getDocument('non-existent')).toBeUndefined();
    });
  });

  describe('markDocumentDirty', () => {
    it('should mark document as dirty', () => {
      const { addDocument, markDocumentDirty, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument({ status: DocumentStatus.SAVED });

      addDocument(doc);
      markDocumentDirty(doc.id);

      expect(getDocument(doc.id)?.status).toBe(DocumentStatus.DIRTY);
    });

    it('should not mark non-existent document', () => {
      const { markDocumentDirty, getDocument } = useDocumentStore.getState();

      markDocumentDirty('non-existent');

      expect(getDocument('non-existent')).toBeUndefined();
    });
  });

  describe('setDocumentStatus', () => {
    it('should set document status to LOADING', () => {
      const { addDocument, setDocumentStatus, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument({ status: DocumentStatus.READY });

      addDocument(doc);
      setDocumentStatus(doc.id, DocumentStatus.LOADING);

      expect(getDocument(doc.id)?.status).toBe(DocumentStatus.LOADING);
    });

    it('should set document status to ERROR', () => {
      const { addDocument, setDocumentStatus, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument({ status: DocumentStatus.READY });

      addDocument(doc);
      setDocumentStatus(doc.id, DocumentStatus.ERROR);

      expect(getDocument(doc.id)?.status).toBe(DocumentStatus.ERROR);
    });

    it('should not set status for non-existent document', () => {
      const { setDocumentStatus, getDocument } = useDocumentStore.getState();

      setDocumentStatus('non-existent', DocumentStatus.ERROR);

      expect(getDocument('non-existent')).toBeUndefined();
    });
  });

  describe('hasDirtyDocuments', () => {
    it('should return false when no documents', () => {
      const { hasDirtyDocuments } = useDocumentStore.getState();
      expect(hasDirtyDocuments()).toBe(false);
    });

    it('should return false when all documents are saved', () => {
      const { addDocument, hasDirtyDocuments } = useDocumentStore.getState();
      const doc1 = createMockDocument({ status: DocumentStatus.SAVED });
      const doc2 = createMockDocument({ id: 'doc-2', status: DocumentStatus.READY });

      addDocument(doc1);
      addDocument(doc2);

      expect(hasDirtyDocuments()).toBe(false);
    });

    it('should return true when at least one document is dirty', () => {
      const { addDocument, hasDirtyDocuments } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1', status: DocumentStatus.SAVED });
      const doc2 = createMockDocument({ id: 'doc-2', status: DocumentStatus.DIRTY });

      addDocument(doc1);
      addDocument(doc2);

      expect(hasDirtyDocuments()).toBe(true);
    });

    it('should return false after marking dirty document as saved', () => {
      const { addDocument, markDocumentSaved, hasDirtyDocuments } = useDocumentStore.getState();
      const doc = createMockDocument({ status: DocumentStatus.DIRTY });

      addDocument(doc);
      expect(hasDirtyDocuments()).toBe(true);

      markDocumentSaved(doc.id);
      expect(hasDirtyDocuments()).toBe(false);
    });
  });

  describe('addToRecents', () => {
    it('should add document to recents', () => {
      const { addDocument, addToRecents } = useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);
      addToRecents(doc.id);

      expect(useDocumentStore.getState().recentDocuments).toEqual([doc.id]);
    });

    it('should add most recent document to front', () => {
      const { addDocument, addToRecents } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });
      const doc3 = createMockDocument({ id: 'doc-3' });

      addDocument(doc1);
      addDocument(doc2);
      addDocument(doc3);

      addToRecents(doc1.id);
      addToRecents(doc2.id);
      addToRecents(doc3.id);

      expect(useDocumentStore.getState().recentDocuments).toEqual([
        doc3.id,
        doc2.id,
        doc1.id,
      ]);
    });

    it('should move existing document to front when added again', () => {
      const { addDocument, addToRecents } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });
      const doc3 = createMockDocument({ id: 'doc-3' });

      addDocument(doc1);
      addDocument(doc2);
      addDocument(doc3);

      addToRecents(doc1.id);
      addToRecents(doc2.id);
      addToRecents(doc3.id);
      expect(useDocumentStore.getState().recentDocuments).toEqual([
        doc3.id,
        doc2.id,
        doc1.id,
      ]);

      // Add doc1 again - should move to front
      addToRecents(doc1.id);
      expect(useDocumentStore.getState().recentDocuments).toEqual([
        doc1.id,
        doc3.id,
        doc2.id,
      ]);
    });

    it('should limit recent documents to 10', () => {
      const { addDocument, addToRecents } = useDocumentStore.getState();

      // Add 11 documents
      for (let i = 1; i <= 11; i++) {
        const doc = createMockDocument({ id: `doc-${i}` });
        addDocument(doc);
        addToRecents(doc.id);
      }

      expect(useDocumentStore.getState().recentDocuments).toHaveLength(10);
      // Should contain doc-11 through doc-2 (oldest doc-1 should be removed)
      expect(useDocumentStore.getState().recentDocuments).not.toContain('doc-1');
      expect(useDocumentStore.getState().recentDocuments).toContain('doc-11');
    });
  });

  describe('clearRecents', () => {
    it('should clear all recent documents', () => {
      const { addDocument, addToRecents, clearRecents } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });

      addDocument(doc1);
      addDocument(doc2);
      addToRecents(doc1.id);
      addToRecents(doc2.id);
      expect(useDocumentStore.getState().recentDocuments).toHaveLength(2);

      clearRecents();
      expect(useDocumentStore.getState().recentDocuments).toEqual([]);
    });
  });

  describe('getRecentDocuments', () => {
    it('should return empty array when no recent documents', () => {
      const { getRecentDocuments } = useDocumentStore.getState();
      expect(getRecentDocuments()).toEqual([]);
    });

    it('should return recent documents in order', () => {
      const { addDocument, addToRecents, getRecentDocuments } = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1', name: 'first.xml' });
      const doc2 = createMockDocument({ id: 'doc-2', name: 'second.xml' });
      const doc3 = createMockDocument({ id: 'doc-3', name: 'third.xml' });

      addDocument(doc1);
      addDocument(doc2);
      addDocument(doc3);

      addToRecents(doc1.id);
      addToRecents(doc2.id);
      addToRecents(doc3.id);

      const recents = getRecentDocuments();
      expect(recents).toHaveLength(3);
      expect(recents[0]).toEqual(doc3);
      expect(recents[1]).toEqual(doc2);
      expect(recents[2]).toEqual(doc1);
    });

    it('should filter out documents that no longer exist', () => {
      const { addDocument, addToRecents, removeDocument, getRecentDocuments } =
        useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1' });
      const doc2 = createMockDocument({ id: 'doc-2' });

      addDocument(doc1);
      addDocument(doc2);
      addToRecents(doc1.id);
      addToRecents(doc2.id);

      expect(getRecentDocuments()).toHaveLength(2);

      // Remove doc2
      removeDocument(doc2.id);

      const recents = getRecentDocuments();
      expect(recents).toHaveLength(1);
      expect(recents[0]).toEqual(doc1);
    });

    it('should not return documents that were never added to store', () => {
      const { getRecentDocuments } = useDocumentStore.getState();

      // Manually add a non-existent document ID to recents
      useDocumentStore.setState({ recentDocuments: ['non-existent'] });

      expect(getRecentDocuments()).toEqual([]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete document lifecycle', () => {
      const store = useDocumentStore.getState();
      const doc = createMockDocument({ status: DocumentStatus.READY });

      // Create document
      store.addDocument(doc);
      expect(store.getAllDocuments()).toHaveLength(1);
      expect(store.getDocument(doc.id)).toEqual(doc);

      // Set as active
      store.setActiveDocument(doc.id);
      expect(store.getActiveDocument()).toEqual(doc);

      // Update content (should mark dirty)
      store.updateDocumentContent(doc.id, '<root>updated</root>');
      expect(store.getDocument(doc.id)?.content).toBe('<root>updated</root>');
      expect(store.getDocument(doc.id)?.status).toBe(DocumentStatus.DIRTY);
      expect(store.hasDirtyDocuments()).toBe(true);

      // Add to recents
      store.addToRecents(doc.id);
      expect(store.getRecentDocuments()).toHaveLength(1);

      // Mark as saved
      store.markDocumentSaved(doc.id);
      expect(store.getDocument(doc.id)?.status).toBe(DocumentStatus.SAVED);
      expect(store.hasDirtyDocuments()).toBe(false);

      // Remove document
      store.removeDocument(doc.id);
      expect(store.getAllDocuments()).toHaveLength(0);
      expect(store.getActiveDocument()).toBeNull();
      expect(store.getRecentDocuments()).toHaveLength(0);
    });

    it('should handle multiple documents with different states', () => {
      const store = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1', status: DocumentStatus.SAVED });
      const doc2 = createMockDocument({ id: 'doc-2', status: DocumentStatus.DIRTY });
      const doc3 = createMockDocument({ id: 'doc-3', status: DocumentStatus.READY });

      store.addDocument(doc1);
      store.addDocument(doc2);
      store.addDocument(doc3);

      expect(store.getAllDocuments()).toHaveLength(3);
      expect(store.hasDirtyDocuments()).toBe(true);

      // Switch between documents
      store.setActiveDocument(doc1.id);
      expect(store.getActiveDocument()?.id).toBe(doc1.id);

      store.setActiveDocument(doc2.id);
      expect(store.getActiveDocument()?.id).toBe(doc2.id);

      // Update active document
      store.updateDocumentContent(doc2.id, '<root>modified</root>');
      expect(store.getDocument(doc2.id)?.content).toBe('<root>modified</root>');
    });
  });
});
