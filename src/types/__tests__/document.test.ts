import { Document, DocumentType, DocumentStatus } from '../document';

describe('Document Types', () => {
  it('should create a valid document object', () => {
    const doc: Document = {
      id: 'test-id',
      name: 'test.xml',
      type: DocumentType.XML,
      content: '<root/>',
      status: DocumentStatus.SAVED,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    expect(doc).toBeDefined();
  });

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
});
