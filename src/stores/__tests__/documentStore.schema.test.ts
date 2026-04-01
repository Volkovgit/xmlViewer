import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from '../documentStore';
import { Document, DocumentType, DocumentStatus } from '@/types';
import type { XSDSchema } from '@/services/xsd/XSDParser';

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

/**
 * Helper function to create a mock XSD schema
 */
function createMockSchema(overrides?: Partial<XSDSchema>): XSDSchema {
  return {
    targetNamespace: 'http://example.com/ns',
    elements: [
      {
        name: 'root',
        type: 'xs:string',
        occurrence: { minOccurs: 1, maxOccurs: 1 },
      },
    ],
    complexTypes: [],
    simpleTypes: [],
    raw: '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>',
    ...overrides,
  };
}

describe('DocumentStore - Schema Actions', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDocumentStore.setState({
      documents: new Map(),
      activeDocumentId: null,
      recentDocuments: [],
      documentViewModes: new Map(),
      viewUpdateTimestamps: new Map(),
    });
  });

  describe('attachSchema', () => {
    it('should attach schema to document', () => {
      const { addDocument, attachSchema, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument();
      const schema = createMockSchema();

      addDocument(doc);
      attachSchema(doc.id, '/path/to/schema.xsd', schema);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.xsdSchema).toEqual(schema);
      expect(updatedDoc?.xsdPath).toBe('/path/to/schema.xsd');
    });

    it('should update modifiedAt timestamp when attaching schema', async () => {
      const { addDocument, attachSchema, getDocument } = useDocumentStore.getState();
      const originalDate = new Date('2024-01-01T00:00:00Z');
      const doc = createMockDocument({ modifiedAt: originalDate });
      const schema = createMockSchema();

      addDocument(doc);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      attachSchema(doc.id, '/path/to/schema.xsd', schema);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.modifiedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should not attach schema to non-existent document', () => {
      const { attachSchema, getDocument } = useDocumentStore.getState();
      const schema = createMockSchema();

      attachSchema('non-existent', '/path/to/schema.xsd', schema);

      expect(getDocument('non-existent')).toBeUndefined();
    });

    it('should replace existing schema when attaching another', () => {
      const { addDocument, attachSchema, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument();
      const schema1 = createMockSchema({
        targetNamespace: 'http://example.com/ns1',
      });
      const schema2 = createMockSchema({
        targetNamespace: 'http://example.com/ns2',
      });

      addDocument(doc);
      attachSchema(doc.id, '/path/to/schema1.xsd', schema1);
      attachSchema(doc.id, '/path/to/schema2.xsd', schema2);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.xsdSchema).toEqual(schema2);
      expect(updatedDoc?.xsdPath).toBe('/path/to/schema2.xsd');
    });
  });

  describe('detachSchema', () => {
    it('should detach schema from document', () => {
      const { addDocument, attachSchema, detachSchema, getDocument } =
        useDocumentStore.getState();
      const doc = createMockDocument();
      const schema = createMockSchema();

      addDocument(doc);
      attachSchema(doc.id, '/path/to/schema.xsd', schema);

      expect(getDocument(doc.id)?.xsdSchema).toEqual(schema);
      expect(getDocument(doc.id)?.xsdPath).toBe('/path/to/schema.xsd');

      detachSchema(doc.id);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.xsdSchema).toBeUndefined();
      expect(updatedDoc?.xsdPath).toBeUndefined();
    });

    it('should update modifiedAt timestamp when detaching schema', async () => {
      const { addDocument, attachSchema, detachSchema, getDocument } =
        useDocumentStore.getState();
      const originalDate = new Date('2024-01-01T00:00:00Z');
      const doc = createMockDocument({ modifiedAt: originalDate });
      const schema = createMockSchema();

      addDocument(doc);
      attachSchema(doc.id, '/path/to/schema.xsd', schema);

      // Reset modifiedAt to original date
      useDocumentStore.setState((state) => {
        const newDocuments = new Map(state.documents);
        const currentDoc = newDocuments.get(doc.id);
        if (currentDoc) {
          newDocuments.set(doc.id, { ...currentDoc, modifiedAt: originalDate });
        }
        return { documents: newDocuments };
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      detachSchema(doc.id);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.modifiedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should not detach schema from non-existent document', () => {
      const { detachSchema, getDocument } = useDocumentStore.getState();

      detachSchema('non-existent');

      expect(getDocument('non-existent')).toBeUndefined();
    });

    it('should handle detaching schema from document without schema', () => {
      const { addDocument, detachSchema, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument();

      addDocument(doc);
      detachSchema(doc.id);

      // Should not throw error, document should still exist
      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.xsdSchema).toBeUndefined();
      expect(updatedDoc?.xsdPath).toBeUndefined();
    });
  });

  describe('updateSchema', () => {
    it('should update schema on document', () => {
      const { addDocument, attachSchema, updateSchema, getDocument } =
        useDocumentStore.getState();
      const doc = createMockDocument();
      const schema1 = createMockSchema({
        targetNamespace: 'http://example.com/ns1',
        elements: [
          {
            name: 'root',
            type: 'xs:string',
            occurrence: { minOccurs: 1, maxOccurs: 1 },
          },
        ],
      });
      const schema2 = createMockSchema({
        targetNamespace: 'http://example.com/ns2',
        elements: [
          {
            name: 'root',
            type: 'xs:integer',
            occurrence: { minOccurs: 1, maxOccurs: 1 },
          },
        ],
      });

      addDocument(doc);
      attachSchema(doc.id, '/path/to/schema.xsd', schema1);

      expect(getDocument(doc.id)?.xsdSchema).toEqual(schema1);

      updateSchema(doc.id, schema2);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.xsdSchema).toEqual(schema2);
      // xsdPath should remain unchanged
      expect(updatedDoc?.xsdPath).toBe('/path/to/schema.xsd');
    });

    it('should update modifiedAt timestamp when updating schema', async () => {
      const { addDocument, attachSchema, updateSchema, getDocument } =
        useDocumentStore.getState();
      const originalDate = new Date('2024-01-01T00:00:00Z');
      const doc = createMockDocument({ modifiedAt: originalDate });
      const schema1 = createMockSchema();
      const schema2 = createMockSchema({
        targetNamespace: 'http://example.com/ns2',
      });

      addDocument(doc);
      attachSchema(doc.id, '/path/to/schema.xsd', schema1);

      // Reset modifiedAt to original date
      useDocumentStore.setState((state) => {
        const newDocuments = new Map(state.documents);
        const currentDoc = newDocuments.get(doc.id);
        if (currentDoc) {
          newDocuments.set(doc.id, { ...currentDoc, modifiedAt: originalDate });
        }
        return { documents: newDocuments };
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      updateSchema(doc.id, schema2);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.modifiedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should not update schema on non-existent document', () => {
      const { updateSchema, getDocument } = useDocumentStore.getState();
      const schema = createMockSchema();

      updateSchema('non-existent', schema);

      expect(getDocument('non-existent')).toBeUndefined();
    });

    it('should handle updating schema on document without existing schema', () => {
      const { addDocument, updateSchema, getDocument } = useDocumentStore.getState();
      const doc = createMockDocument();
      const schema = createMockSchema();

      addDocument(doc);
      updateSchema(doc.id, schema);

      const updatedDoc = getDocument(doc.id);
      expect(updatedDoc?.xsdSchema).toEqual(schema);
      expect(updatedDoc?.xsdPath).toBeUndefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete schema attachment lifecycle', () => {
      const store = useDocumentStore.getState();
      const doc = createMockDocument();
      const schema = createMockSchema();

      // Add document
      store.addDocument(doc);
      expect(store.getDocument(doc.id)?.xsdSchema).toBeUndefined();

      // Attach schema
      store.attachSchema(doc.id, '/path/to/schema.xsd', schema);
      expect(store.getDocument(doc.id)?.xsdSchema).toEqual(schema);
      expect(store.getDocument(doc.id)?.xsdPath).toBe('/path/to/schema.xsd');

      // Update schema
      const updatedSchema = createMockSchema({
        targetNamespace: 'http://example.com/updated',
      });
      store.updateSchema(doc.id, updatedSchema);
      expect(store.getDocument(doc.id)?.xsdSchema).toEqual(updatedSchema);
      expect(store.getDocument(doc.id)?.xsdPath).toBe('/path/to/schema.xsd');

      // Detach schema
      store.detachSchema(doc.id);
      expect(store.getDocument(doc.id)?.xsdSchema).toBeUndefined();
      expect(store.getDocument(doc.id)?.xsdPath).toBeUndefined();
    });

    it('should handle schema changes across multiple documents', () => {
      const store = useDocumentStore.getState();
      const doc1 = createMockDocument({ id: 'doc-1', name: 'file1.xml' });
      const doc2 = createMockDocument({ id: 'doc-2', name: 'file2.xml' });
      const schema1 = createMockSchema({ targetNamespace: 'http://example.com/ns1' });
      const schema2 = createMockSchema({ targetNamespace: 'http://example.com/ns2' });

      store.addDocument(doc1);
      store.addDocument(doc2);

      // Attach different schemas to each document
      store.attachSchema(doc1.id, '/path/to/schema1.xsd', schema1);
      store.attachSchema(doc2.id, '/path/to/schema2.xsd', schema2);

      expect(store.getDocument(doc1.id)?.xsdSchema).toEqual(schema1);
      expect(store.getDocument(doc2.id)?.xsdSchema).toEqual(schema2);

      // Update schema on doc1
      const updatedSchema1 = createMockSchema({
        targetNamespace: 'http://example.com/ns1-updated',
      });
      store.updateSchema(doc1.id, updatedSchema1);
      expect(store.getDocument(doc1.id)?.xsdSchema).toEqual(updatedSchema1);
      // doc2 schema should remain unchanged
      expect(store.getDocument(doc2.id)?.xsdSchema).toEqual(schema2);

      // Detach schema from doc2 only
      store.detachSchema(doc2.id);
      expect(store.getDocument(doc1.id)?.xsdSchema).toEqual(updatedSchema1);
      expect(store.getDocument(doc2.id)?.xsdSchema).toBeUndefined();
    });
  });
});
