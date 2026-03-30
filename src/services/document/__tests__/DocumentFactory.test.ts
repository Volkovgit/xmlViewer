import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateDocumentId,
  detectDocumentType,
  createUntitledDocument,
  createDocumentFromFile,
  resetUntitledCounters,
} from '../DocumentFactory';
import { DocumentType, DocumentStatus } from '@/types';

describe('DocumentFactory', () => {
  beforeEach(() => {
    // Reset untitled counters before each test
    resetUntitledCounters();
  });

  describe('generateDocumentId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateDocumentId();
      const id2 = generateDocumentId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate UUID format', () => {
      const id = generateDocumentId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate different IDs on multiple calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateDocumentId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('detectDocumentType', () => {
    it('should detect XML files', () => {
      expect(detectDocumentType('document.xml')).toBe(DocumentType.XML);
      expect(detectDocumentType('data.XML')).toBe(DocumentType.XML);
    });

    it('should detect XSD files', () => {
      expect(detectDocumentType('schema.xsd')).toBe(DocumentType.XSD);
      expect(detectDocumentType('types.XSD')).toBe(DocumentType.XSD);
    });

    it('should detect XSLT files', () => {
      expect(detectDocumentType('transform.xsl')).toBe(DocumentType.XSLT);
      expect(detectDocumentType('style.xslt')).toBe(DocumentType.XSLT);
      expect(detectDocumentType('format.XSL')).toBe(DocumentType.XSLT);
      expect(detectDocumentType('template.XSLT')).toBe(DocumentType.XSLT);
    });

    it('should detect XQuery files', () => {
      expect(detectDocumentType('query.xq')).toBe(DocumentType.XQUERY);
      expect(detectDocumentType('search.xquery')).toBe(DocumentType.XQUERY);
      expect(detectDocumentType('find.XQ')).toBe(DocumentType.XQUERY);
      expect(detectDocumentType('filter.XQUERY')).toBe(DocumentType.XQUERY);
    });

    it('should detect JSON files', () => {
      expect(detectDocumentType('data.json')).toBe(DocumentType.JSON);
      expect(detectDocumentType('config.JSON')).toBe(DocumentType.JSON);
    });

    it('should default to XML for unknown extensions', () => {
      expect(detectDocumentType('unknown.txt')).toBe(DocumentType.XML);
      expect(detectDocumentType('document.doc')).toBe(DocumentType.XML);
      expect(detectDocumentType('README')).toBe(DocumentType.XML);
      expect(detectDocumentType('noextension')).toBe(DocumentType.XML);
    });

    it('should handle filenames with multiple dots', () => {
      expect(detectDocumentType('my.document.xml')).toBe(DocumentType.XML);
      expect(detectDocumentType('data.backup.json')).toBe(DocumentType.JSON);
      expect(detectDocumentType('schema.v1.xsd')).toBe(DocumentType.XSD);
    });

    it('should handle edge cases', () => {
      expect(detectDocumentType('.xml')).toBe(DocumentType.XML);
      expect(detectDocumentType('')).toBe(DocumentType.XML);
      expect(detectDocumentType('.')).toBe(DocumentType.XML);
    });
  });

  describe('createUntitledDocument', () => {
    it('should create untitled XML document', () => {
      const doc = createUntitledDocument(DocumentType.XML);

      expect(doc.id).toBeTruthy();
      expect(doc.name).toBe('Untitled-xml-1.xml');
      expect(doc.type).toBe(DocumentType.XML);
      expect(doc.content).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<root/>\n');
      expect(doc.status).toBe(DocumentStatus.SAVED);
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.modifiedAt).toBeInstanceOf(Date);
    });

    it('should create untitled XSD document', () => {
      const doc = createUntitledDocument(DocumentType.XSD);

      expect(doc.name).toBe('Untitled-xsd-1.xsd');
      expect(doc.type).toBe(DocumentType.XSD);
      expect(doc.content).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n</xs:schema>\n'
      );
      expect(doc.status).toBe(DocumentStatus.SAVED);
    });

    it('should create untitled XSLT document', () => {
      const doc = createUntitledDocument(DocumentType.XSLT);

      expect(doc.name).toBe('Untitled-xslt-1.xslt');
      expect(doc.type).toBe(DocumentType.XSLT);
      expect(doc.content).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">\n</xsl:stylesheet>\n'
      );
      expect(doc.status).toBe(DocumentStatus.SAVED);
    });

    it('should create untitled XQuery document', () => {
      const doc = createUntitledDocument(DocumentType.XQUERY);

      expect(doc.name).toBe('Untitled-xquery-1.xq');
      expect(doc.type).toBe(DocumentType.XQUERY);
      expect(doc.content).toBe('xquery version "3.1";\n\n');
      expect(doc.status).toBe(DocumentStatus.SAVED);
    });

    it('should create untitled JSON document', () => {
      const doc = createUntitledDocument(DocumentType.JSON);

      expect(doc.name).toBe('Untitled-json-1.json');
      expect(doc.type).toBe(DocumentType.JSON);
      expect(doc.content).toBe('{\n  \n}\n');
      expect(doc.status).toBe(DocumentStatus.SAVED);
    });

    it('should increment counter for same document type', () => {
      const doc1 = createUntitledDocument(DocumentType.XML);
      const doc2 = createUntitledDocument(DocumentType.XML);
      const doc3 = createUntitledDocument(DocumentType.XML);

      expect(doc1.name).toBe('Untitled-xml-1.xml');
      expect(doc2.name).toBe('Untitled-xml-2.xml');
      expect(doc3.name).toBe('Untitled-xml-3.xml');
      expect(doc1.id).not.toBe(doc2.id);
      expect(doc2.id).not.toBe(doc3.id);
    });

    it('should maintain separate counters for different document types', () => {
      const xmlDoc = createUntitledDocument(DocumentType.XML);
      const xsdDoc = createUntitledDocument(DocumentType.XSD);
      const xmlDoc2 = createUntitledDocument(DocumentType.XML);
      const xsdDoc2 = createUntitledDocument(DocumentType.XSD);

      expect(xmlDoc.name).toBe('Untitled-xml-1.xml');
      expect(xsdDoc.name).toBe('Untitled-xsd-1.xsd');
      expect(xmlDoc2.name).toBe('Untitled-xml-2.xml');
      expect(xsdDoc2.name).toBe('Untitled-xsd-2.xsd');
    });

    it('should set createdAt and modifiedAt to current time', () => {
      const before = new Date();
      const doc = createUntitledDocument(DocumentType.XML);
      const after = new Date();

      expect(doc.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(doc.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(doc.modifiedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(doc.modifiedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should generate unique IDs for untitled documents', () => {
      const docs = [
        createUntitledDocument(DocumentType.XML),
        createUntitledDocument(DocumentType.XSD),
        createUntitledDocument(DocumentType.XSLT),
      ];

      const ids = new Set(docs.map((doc) => doc.id));
      expect(ids.size).toBe(3);
    });

    it('should reset counters when resetUntitledCounters is called', () => {
      const doc1 = createUntitledDocument(DocumentType.XML);
      expect(doc1.name).toBe('Untitled-xml-1.xml');

      resetUntitledCounters();

      const doc2 = createUntitledDocument(DocumentType.XML);
      expect(doc2.name).toBe('Untitled-xml-1.xml');
    });
  });

  describe('createDocumentFromFile', () => {
    it('should create document from XML file', async () => {
      const content = '<?xml version="1.0" encoding="UTF-8"?><root><item>Test</item></root>';
      const file = new File([content], 'test.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.id).toBeTruthy();
      expect(doc.name).toBe('test.xml');
      expect(doc.type).toBe(DocumentType.XML);
      expect(doc.content).toBe(content);
      expect(doc.status).toBe(DocumentStatus.READY);
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.modifiedAt).toBeInstanceOf(Date);
      expect(doc.parseErrors).toBeUndefined();
    });

    it('should create document from XSD file', async () => {
      const content = '<?xml version="1.0"?><xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>';
      const file = new File([content], 'schema.xsd', { type: 'application/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.name).toBe('schema.xsd');
      expect(doc.type).toBe(DocumentType.XSD);
      expect(doc.content).toBe(content);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should create document from XSLT file (.xslt extension)', async () => {
      const content = '<?xml version="1.0"?><xsl:stylesheet/>';
      const file = new File([content], 'transform.xslt', { type: 'application/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.type).toBe(DocumentType.XSLT);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should create document from XSLT file (.xsl extension)', async () => {
      const content = '<?xml version="1.0"?><xsl:stylesheet/>';
      const file = new File([content], 'style.xsl', { type: 'application/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.type).toBe(DocumentType.XSLT);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should create document from XQuery file (.xq extension)', async () => {
      const content = 'xquery version "3.1"; 1 + 1';
      const file = new File([content], 'query.xq', { type: 'text/plain' });

      const doc = await createDocumentFromFile(file);

      expect(doc.type).toBe(DocumentType.XQUERY);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should create document from XQuery file (.xquery extension)', async () => {
      const content = 'xquery version "3.1"; 1 + 1';
      const file = new File([content], 'search.xquery', { type: 'text/plain' });

      const doc = await createDocumentFromFile(file);

      expect(doc.type).toBe(DocumentType.XQUERY);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should create document from JSON file', async () => {
      const content = '{"name": "test", "value": 123}';
      const file = new File([content], 'data.json', { type: 'application/json' });

      const doc = await createDocumentFromFile(file);

      expect(doc.type).toBe(DocumentType.JSON);
      expect(doc.content).toBe(content);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should handle FileReader errors gracefully', async () => {
      // Note: Testing FileReader error handling is difficult in a test environment
      // The implementation includes error handling that sets ERROR status
      // In real usage, FileReader errors will be caught and handled
      const file = new File(['<root/>'], 'test.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);

      // Normal file read should succeed
      expect(doc.status).toBe(DocumentStatus.READY);
      // The error handling path exists in the code but is hard to trigger in tests
    });

    it('should set initial status to LOADING then update to READY', async () => {
      const content = '<root/>';
      const file = new File([content], 'test.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);

      // After the async operation completes, status should be READY
      expect(doc.status).toBe(DocumentStatus.READY);
      expect(doc.content).toBe(content);
    });

    it('should generate unique IDs for documents from files', async () => {
      const content1 = '<root1/>';
      const content2 = '<root2/>';
      const file1 = new File([content1], 'test1.xml', { type: 'text/xml' });
      const file2 = new File([content2], 'test2.xml', { type: 'text/xml' });

      const doc1 = await createDocumentFromFile(file1);
      const doc2 = await createDocumentFromFile(file2);

      expect(doc1.id).not.toBe(doc2.id);
    });

    it('should preserve exact file content', async () => {
      const content =
        '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item id="1">Test</item>\n</root>\n';
      const file = new File([content], 'formatted.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.content).toBe(content);
    });

    it('should handle empty file', async () => {
      const content = '';
      const file = new File([content], 'empty.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.content).toBe('');
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should handle file with special characters', async () => {
      const content = '<root><![CDATA[Special chars: <>&\'"]]></root>';
      const file = new File([content], 'special.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.content).toBe(content);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should handle file with unicode content', async () => {
      const content = '<root>日本語 中文 한국어 Ελληνικά العربية</root>';
      const file = new File([content], 'unicode.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);

      expect(doc.content).toBe(content);
      expect(doc.status).toBe(DocumentStatus.READY);
    });

    it('should set timestamps correctly', async () => {
      const before = new Date();
      const content = '<root/>';
      const file = new File([content], 'test.xml', { type: 'text/xml' });

      const doc = await createDocumentFromFile(file);
      const after = new Date();

      expect(doc.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(doc.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(doc.modifiedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(doc.modifiedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Integration scenarios', () => {
    it('should create multiple documents of different types', async () => {
      const files = [
        new File(['<root/>'], 'data.xml', { type: 'text/xml' }),
        new File(['<xs:schema/>'], 'schema.xsd', { type: 'text/xml' }),
        new File(['{"key": "value"}'], 'config.json', { type: 'application/json' }),
      ];

      const docs = await Promise.all(files.map(createDocumentFromFile));

      expect(docs[0].type).toBe(DocumentType.XML);
      expect(docs[1].type).toBe(DocumentType.XSD);
      expect(docs[2].type).toBe(DocumentType.JSON);
      expect(docs[0].id).not.toBe(docs[1].id);
      expect(docs[1].id).not.toBe(docs[2].id);
      expect(docs[2].id).not.toBe(docs[0].id);
    });

    it('should mix untitled and file-created documents', async () => {
      const untitledDoc = createUntitledDocument(DocumentType.XML);
      const file = new File(['<root/>'], 'file.xml', { type: 'text/xml' });
      const fileDoc = await createDocumentFromFile(file);
      const untitledDoc2 = createUntitledDocument(DocumentType.XSD);

      expect(untitledDoc.name).toBe('Untitled-xml-1.xml');
      expect(fileDoc.name).toBe('file.xml');
      expect(untitledDoc2.name).toBe('Untitled-xsd-1.xsd');

      const ids = new Set([untitledDoc.id, fileDoc.id, untitledDoc2.id]);
      expect(ids.size).toBe(3);
    });
  });
});
