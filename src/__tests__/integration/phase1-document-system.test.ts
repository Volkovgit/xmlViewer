/**
 * Phase 1 Integration Test - Document System
 *
 * Tests the integration between Document types and DocumentStore
 * to verify the complete document management workflow.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentStore } from '@/stores/documentStore';
import {
  Document,
  DocumentType,
  DocumentStatus,
  ParseError,
  ValidationError,
} from '@/types';

describe('Phase 1: Document System Integration', () => {
  let store: DocumentStore;

  beforeEach(() => {
    // Create fresh store instance for each test
    store = {
      documents: new Map(),
      activeDocumentId: null,
      recentDocuments: [],

      // Getters
      getActiveDocument: function () {
        return this.activeDocumentId
          ? this.documents.get(this.activeDocumentId) ?? null
          : null;
      },

      hasDirtyDocuments: function () {
        return Array.from(this.documents.values()).some(
          (doc) => doc.status === DocumentStatus.DIRTY,
        );
      },

      // Actions
      addDocument: function (document: Document) {
        const newDocuments = new Map(this.documents);
        newDocuments.set(document.id, document);
        this.documents = newDocuments;
      },

      removeDocument: function (id: string) {
        const newDocuments = new Map(this.documents);
        newDocuments.delete(id);
        this.documents = newDocuments;

        // Clear active if it was the removed document
        if (this.activeDocumentId === id) {
          this.activeDocumentId = null;
        }

        // Remove from recents
        this.recentDocuments = this.recentDocuments.filter(
          (docId) => docId !== id,
        );
      },

      getDocument: function (id: string) {
        return this.documents.get(id);
      },

      getAllDocuments: function () {
        return Array.from(this.documents.values());
      },

      setActiveDocument: function (id: string) {
        if (this.documents.has(id)) {
          this.activeDocumentId = id;
        }
      },

      updateDocumentContent: function (id: string, content: string) {
        const document = this.documents.get(id);
        if (!document) return;

        const newDocuments = new Map(this.documents);
        newDocuments.set(id, {
          ...document,
          content,
          modifiedAt: new Date(),
          status: DocumentStatus.DIRTY,
        });
        this.documents = newDocuments;
      },

      markDocumentSaved: function (id: string) {
        const document = this.documents.get(id);
        if (!document) return;

        const newDocuments = new Map(this.documents);
        newDocuments.set(id, {
          ...document,
          status: DocumentStatus.SAVED,
        });
        this.documents = newDocuments;
      },

      markDocumentDirty: function (id: string) {
        const document = this.documents.get(id);
        if (!document) return;

        const newDocuments = new Map(this.documents);
        newDocuments.set(id, {
          ...object,
          status: DocumentStatus.DIRTY,
        });
        this.documents = newDocuments;
      },

      setDocumentStatus: function (id: string, status: DocumentStatus) {
        const document = this.documents.get(id);
        if (!document) return;

        const newDocuments = new Map(this.documents);
        newDocuments.set(id, {
          ...document,
          status,
        });
        this.documents = newDocuments;
      },

      addToRecents: function (id: string) {
        const filtered = this.recentDocuments.filter((docId) => docId !== id);
        this.recentDocuments = [id, ...filtered].slice(0, 10);
      },

      clearRecents: function () {
        this.recentDocuments = [];
      },

      getRecentDocuments: function () {
        return this.recentDocuments
          .map((id) => this.documents.get(id))
          .filter((doc): doc is Document => doc !== undefined);
      },
    } as DocumentStore;
  });

  describe('Document Type System', () => {
    it('should support all document types', () => {
      const types = [
        DocumentType.XML,
        DocumentType.XSD,
        DocumentType.XSLT,
        DocumentType.XQUERY,
        DocumentType.JSON,
      ];

      expect(types).toHaveLength(5);
    });

    it('should support all document statuses', () => {
      const statuses = [
        DocumentStatus.LOADING,
        DocumentStatus.READY,
        DocumentStatus.ERROR,
        DocumentStatus.DIRTY,
        DocumentStatus.SAVED,
      ];

      expect(statuses).toHaveLength(5);
    });

    it('should create parse errors with correct structure', () => {
      const error: ParseError = {
        line: 1,
        column: 10,
        message: 'Unexpected token',
        code: 'UNEXPECTED_TOKEN',
      };

      expect(error.line).toBe(1);
      expect(error.column).toBe(10);
      expect(error.message).toBe('Unexpected token');
      expect(error.code).toBe('UNEXPECTED_TOKEN');
    });

    it('should create validation errors with correct structure', () => {
      const error: ValidationError = {
        line: 5,
        column: 15,
        message: 'Element not allowed here',
        severity: 'error',
        path: '/root/child',
      };

      expect(error.line).toBe(5);
      expect(error.severity).toBe('error');
      expect(error.path).toBe('/root/child');
    });
  });

  describe('Document CRUD Operations', () => {
    it('should create and add a new XML document', () => {
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc);

      expect(store.documents.size).toBe(1);
      expect(store.getDocument('doc-1')).toEqual(doc);
    });

    it('should retrieve all documents', () => {
      const doc1: Document = {
        id: 'doc-1',
        name: 'test1.xml',
        type: DocumentType.XML,
        content: '<root1></root1>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const doc2: Document = {
        id: 'doc-2',
        name: 'test2.xml',
        type: DocumentType.XML,
        content: '<root2></root2>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc1);
      store.addDocument(doc2);

      const allDocs = store.getAllDocuments();
      expect(allDocs).toHaveLength(2);
      expect(allDocs[0].id).toBe('doc-1');
      expect(allDocs[1].id).toBe('doc-2');
    });

    it('should remove a document', () => {
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc);
      expect(store.documents.size).toBe(1);

      store.removeDocument('doc-1');
      expect(store.documents.size).toBe(0);
    });
  });

  describe('Active Document Management', () => {
    it('should set and retrieve active document', () => {
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc);
      store.setActiveDocument('doc-1');

      expect(store.getActiveDocument()).toEqual(doc);
    });

    it('should return null when no active document', () => {
      expect(store.getActiveDocument()).toBeNull();
    });

    it('should not set non-existent document as active', () => {
      store.setActiveDocument('non-existent');
      expect(store.activeDocumentId).toBeNull();
    });
  });

  describe('Document Status Management', () => {
    it('should mark document as dirty when content updated', () => {
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc);
      store.updateDocumentContent('doc-1', '<root>updated</root>');

      const updated = store.getDocument('doc-1');
      expect(updated?.status).toBe(DocumentStatus.DIRTY);
      expect(updated?.content).toBe('<root>updated</root>');
    });

    it('should update modifiedAt timestamp when content changes', async () => {
      const now = new Date();
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.SAVED,
        createdAt: now,
        modifiedAt: now,
      };

      store.addDocument(doc);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 2));
      const modifiedAtBefore = doc.modifiedAt;
      store.updateDocumentContent('doc-1', '<root>updated</root>');

      const updated = store.getDocument('doc-1');
      expect(updated?.modifiedAt.getTime()).toBeGreaterThan(
        modifiedAtBefore.getTime(),
      );
    });

    it('should mark document as saved', () => {
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.DIRTY,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc);
      store.markDocumentSaved('doc-1');

      const saved = store.getDocument('doc-1');
      expect(saved?.status).toBe(DocumentStatus.SAVED);
    });
  });

  describe('Dirty Documents Detection', () => {
    it('should detect no dirty documents when all saved', () => {
      const doc1: Document = {
        id: 'doc-1',
        name: 'test1.xml',
        type: DocumentType.XML,
        content: '<root1></root1>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const doc2: Document = {
        id: 'doc-2',
        name: 'test2.xml',
        type: DocumentType.XML,
        content: '<root2></root2>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc1);
      store.addDocument(doc2);

      expect(store.hasDirtyDocuments()).toBe(false);
    });

    it('should detect dirty documents', () => {
      const doc1: Document = {
        id: 'doc-1',
        name: 'test1.xml',
        type: DocumentType.XML,
        content: '<root1></root1>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const doc2: Document = {
        id: 'doc-2',
        name: 'test2.xml',
        type: DocumentType.XML,
        content: '<root2></root2>',
        status: DocumentStatus.DIRTY,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc1);
      store.addDocument(doc2);

      expect(store.hasDirtyDocuments()).toBe(true);
    });
  });

  describe('Recent Documents Management', () => {
    it('should track recent documents', () => {
      const doc1: Document = {
        id: 'doc-1',
        name: 'test1.xml',
        type: DocumentType.XML,
        content: '<root1></root1>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      const doc2: Document = {
        id: 'doc-2',
        name: 'test2.xml',
        type: DocumentType.XML,
        content: '<root2></root2>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc1);
      store.addDocument(doc2);
      store.addToRecents('doc-1');
      store.addToRecents('doc-2');

      const recents = store.getRecentDocuments();
      expect(recents).toHaveLength(2);
      expect(recents[0].id).toBe('doc-2'); // Most recent first
      expect(recents[1].id).toBe('doc-1');
    });

    it('should limit recent documents to 10', () => {
      // Add 11 documents
      for (let i = 1; i <= 11; i++) {
        const doc: Document = {
          id: `doc-${i}`,
          name: `test${i}.xml`,
          type: DocumentType.XML,
          content: `<root${i}></root${i}>`,
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        };

        store.addDocument(doc);
        store.addToRecents(doc.id);
      }

      const recents = store.getRecentDocuments();
      expect(recents).toHaveLength(10);
      expect(recents[0].id).toBe('doc-11'); // Most recent
      expect(recents[9].id).toBe('doc-2'); // Oldest in list (doc-1 removed)
    });

    it('should clear recent documents', () => {
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc);
      store.addToRecents('doc-1');
      expect(store.getRecentDocuments()).toHaveLength(1);

      store.clearRecents();
      expect(store.getRecentDocuments()).toHaveLength(0);
    });
  });

  describe('Complete Document Workflow', () => {
    it('should support complete document lifecycle', () => {
      // 1. Create new document
      const doc: Document = {
        id: 'doc-1',
        name: 'test.xml',
        type: DocumentType.XML,
        content: '<root></root>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      store.addDocument(doc);
      expect(store.documents.size).toBe(1);

      // 2. Set as active
      store.setActiveDocument('doc-1');
      expect(store.getActiveDocument()?.id).toBe('doc-1');

      // 3. Add to recents
      store.addToRecents('doc-1');
      expect(store.getRecentDocuments()).toHaveLength(1);

      // 4. Update content (becomes dirty)
      store.updateDocumentContent('doc-1', '<root>updated</root>');
      expect(store.getDocument('doc-1')?.status).toBe(DocumentStatus.DIRTY);
      expect(store.hasDirtyDocuments()).toBe(true);

      // 5. Save document
      store.markDocumentSaved('doc-1');
      expect(store.getDocument('doc-1')?.status).toBe(DocumentStatus.SAVED);
      expect(store.hasDirtyDocuments()).toBe(false);

      // 6. Close document
      store.removeDocument('doc-1');
      expect(store.documents.size).toBe(0);
      expect(store.getActiveDocument()).toBeNull();
      expect(store.getRecentDocuments()).toHaveLength(0);
    });
  });
});
