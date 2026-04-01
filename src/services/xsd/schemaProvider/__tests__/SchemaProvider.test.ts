/**
 * Unit tests for SchemaProvider
 *
 * Tests schema detection from XML documents and schema loading functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchemaProvider } from '../SchemaProvider';
import { parseXSD } from '@/services/xsd/XSDParser';
import { useDocumentStore } from '@/stores/documentStore';
import { Document, DocumentType, DocumentStatus } from '@/types';

// Mock XSDParser
vi.mock('@/services/xsd/XSDParser', () => ({
  parseXSD: vi.fn(),
}));

describe('SchemaProvider', () => {
  const mockParseXSD = vi.mocked(parseXSD);

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

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useDocumentStore.setState({
      documents: new Map(),
      activeDocumentId: null,
      recentDocuments: [],
      documentViewModes: new Map(),
      viewUpdateTimestamps: new Map(),
    });
  });

  describe('detectSchemaLocation', () => {
    it('should detect schema from xsi:noNamespaceSchemaLocation', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:noNamespaceSchemaLocation="schema.xsd">
  <child>content</child>
</root>`;

      const result = SchemaProvider.detectSchemaLocation(xmlContent);
      expect(result).toBe('schema.xsd');
    });

    it('should detect schema from xsi:schemaLocation with namespace', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://example.com/ns schema.xsd">
  <child>content</child>
</root>`;

      const result = SchemaProvider.detectSchemaLocation(xmlContent);
      expect(result).toBe('schema.xsd');
    });

    it('should return null when no schema location is found', () => {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <child>content</child>
</root>`;

      const result = SchemaProvider.detectSchemaLocation(xmlContent);
      expect(result).toBeNull();
    });
  });

  describe('loadSchemaFromContent', () => {
    it('should parse XSD content successfully', () => {
      const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const mockSchema = {
        targetNamespace: undefined,
        elements: [],
        complexTypes: [],
        simpleTypes: [],
        raw: xsdContent,
      };

      mockParseXSD.mockReturnValue(mockSchema);

      const result = SchemaProvider.loadSchemaFromContent(xsdContent);

      expect(result).toEqual(mockSchema);
      expect(mockParseXSD).toHaveBeenCalledWith(xsdContent);
    });

    it('should return null when XSD parsing fails', () => {
      const xsdContent = 'invalid xsd content';
      mockParseXSD.mockReturnValue(null);

      const result = SchemaProvider.loadSchemaFromContent(xsdContent);

      expect(result).toBeNull();
      expect(mockParseXSD).toHaveBeenCalledWith(xsdContent);
    });
  });

  describe('attachSchemaToDocument', () => {
    it('should attach schema to document using DocumentStore', () => {
      const documentId = 'doc-123';
      const schemaPath = 'schema.xsd';
      const mockSchema = {
        targetNamespace: undefined,
        elements: [],
        complexTypes: [],
        simpleTypes: [],
        raw: 'mock',
      };

      // Add a document to the store first
      const mockDoc = createMockDocument({ id: documentId });
      useDocumentStore.getState().addDocument(mockDoc);

      SchemaProvider.attachSchemaToDocument(documentId, schemaPath, mockSchema);

      // Verify the schema was attached
      const updatedDoc = useDocumentStore.getState().getDocument(documentId);
      expect(updatedDoc?.xsdSchema).toEqual(mockSchema);
      expect(updatedDoc?.xsdPath).toBe(schemaPath);
    });
  });

  describe('detachSchema', () => {
    it('should detach schema from document using DocumentStore', () => {
      const documentId = 'doc-123';
      const mockSchema = {
        targetNamespace: undefined,
        elements: [],
        complexTypes: [],
        simpleTypes: [],
        raw: 'mock',
      };

      // Add a document with schema to the store
      const mockDoc = createMockDocument({
        id: documentId,
        xsdSchema: mockSchema,
        xsdPath: 'schema.xsd',
      });
      useDocumentStore.getState().addDocument(mockDoc);

      SchemaProvider.detachSchema(documentId);

      // Verify the schema was detached
      const updatedDoc = useDocumentStore.getState().getDocument(documentId);
      expect(updatedDoc?.xsdSchema).toBeUndefined();
      expect(updatedDoc?.xsdPath).toBeUndefined();
    });
  });
});
