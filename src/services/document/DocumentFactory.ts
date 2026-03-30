import { Document, DocumentType, DocumentStatus } from '@/types';

/**
 * DocumentFactory Service
 *
 * Provides factory methods for creating documents from files or as new untitled documents.
 * Handles document type detection, unique ID generation, and default content templates.
 *
 * @example
 * ```typescript
 * // Create from file
 * const file = new File(['<root/>'], 'test.xml', { type: 'text/xml' });
 * const doc = await createDocumentFromFile(file);
 *
 * // Create untitled document
 * const newDoc = createUntitledDocument(DocumentType.XML);
 * ```
 */

/**
 * Generate a unique document ID using crypto.randomUUID()
 *
 * @returns A unique UUID string
 *
 * @example
 * ```typescript
 * const id = generateDocumentId();
 * console.log(id); // e.g., "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateDocumentId(): string {
  return crypto.randomUUID();
}

/**
 * Detect document type from filename extension
 *
 * Maps file extensions to DocumentType enum values:
 * - .xml → DocumentType.XML
 * - .xsd → DocumentType.XSD
 * - .xsl, .xslt → DocumentType.XSLT
 * - .xq, .xquery → DocumentType.XQUERY
 * - .json → DocumentType.JSON
 * - Default: DocumentType.XML
 *
 * @param filename - The filename to analyze
 * @returns The detected DocumentType
 *
 * @example
 * ```typescript
 * detectDocumentType('schema.xsd'); // DocumentType.XSD
 * detectDocumentType('transform.xslt'); // DocumentType.XSLT
 * detectDocumentType('data.json'); // DocumentType.JSON
 * detectDocumentType('unknown.txt'); // DocumentType.XML (default)
 * ```
 */
export function detectDocumentType(filename: string): DocumentType {
  const extension = filename.toLowerCase().split('.').pop() || '';

  switch (extension) {
    case 'xml':
      return DocumentType.XML;
    case 'xsd':
      return DocumentType.XSD;
    case 'xsl':
    case 'xslt':
      return DocumentType.XSLT;
    case 'xq':
    case 'xquery':
      return DocumentType.XQUERY;
    case 'json':
      return DocumentType.JSON;
    default:
      return DocumentType.XML;
  }
}

/**
 * Counter for generating unique untitled document names
 * Maps document type to the next available number
 */
const untitledCounters: Map<DocumentType, number> = new Map([
  [DocumentType.XML, 0],
  [DocumentType.XSD, 0],
  [DocumentType.XSLT, 0],
  [DocumentType.XQUERY, 0],
  [DocumentType.JSON, 0],
]);

/**
 * Get default content template for a given document type
 *
 * @param type - The document type
 * @returns Default content string for the document type
 *
 * @example
 * ```typescript
 * getDefaultContent(DocumentType.XML);
 * // Returns: '<?xml version="1.0" encoding="UTF-8"?>\n<root/>\n'
 * ```
 */
function getDefaultContent(type: DocumentType): string {
  switch (type) {
    case DocumentType.XML:
      return `<?xml version="1.0" encoding="UTF-8"?>\n<root/>\n`;
    case DocumentType.XSD:
      return `<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n</xs:schema>\n`;
    case DocumentType.XSLT:
      return `<?xml version="1.0" encoding="UTF-8"?>\n<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">\n</xsl:stylesheet>\n`;
    case DocumentType.XQUERY:
      return `xquery version "3.1";\n\n`;
    case DocumentType.JSON:
      return `{\n  \n}\n`;
    default:
      return '';
  }
}

/**
 * Create a new untitled document with default content
 *
 * Generates a unique name using the format "Untitled-{type}-{number}.xml"
 * (or appropriate extension for the document type).
 * The counter increments for each document type separately.
 *
 * @param type - The document type to create
 * @returns A new Document object with default content
 *
 * @example
 * ```typescript
 * const doc = createUntitledDocument(DocumentType.XML);
 * console.log(doc.name); // "Untitled-xml-1.xml"
 * console.log(doc.content); // '<?xml version="1.0" encoding="UTF-8"?>\n<root/>\n'
 *
 * const doc2 = createUntitledDocument(DocumentType.XML);
 * console.log(doc2.name); // "Untitled-xml-2.xml"
 *
 * const xsdDoc = createUntitledDocument(DocumentType.XSD);
 * console.log(xsdDoc.name); // "Untitled-xsd-1.xsd"
 * ```
 */
export function createUntitledDocument(type: DocumentType): Document {
  const now = new Date();

  // Increment counter for this document type
  const currentCount = (untitledCounters.get(type) || 0) + 1;
  untitledCounters.set(type, currentCount);

  // Determine file extension
  let extension = 'xml';
  switch (type) {
    case DocumentType.XSD:
      extension = 'xsd';
      break;
    case DocumentType.XSLT:
      extension = 'xslt';
      break;
    case DocumentType.XQUERY:
      extension = 'xq';
      break;
    case DocumentType.JSON:
      extension = 'json';
      break;
    default:
      extension = 'xml';
  }

  // Generate name
  const name = `Untitled-${type}-${currentCount}.${extension}`;

  return {
    id: generateDocumentId(),
    name,
    type,
    content: getDefaultContent(type),
    status: DocumentStatus.SAVED,
    createdAt: now,
    modifiedAt: now,
  };
}

/**
 * Read a File object and return its content as text
 *
 * Helper function that wraps the FileReader API in a Promise.
 *
 * @param file - The File object to read
 * @returns Promise resolving to the file content as text
 * @throws Error if file reading fails
 *
 * @example
 * ```typescript
 * try {
 *   const content = await readFileContent(file);
 *   console.log(content);
 * } catch (error) {
 *   console.error('Failed to read file:', error);
 * }
 * ```
 */
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('File content is not text'));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsText(file);
  });
}

/**
 * Create a document from a File object
 *
 * Reads the file content, detects the document type from the filename,
 * generates a unique ID, and creates a Document object.
 *
 * The document is initially created with LOADING status, then the content
 * is read. If reading fails, the document status is set to ERROR with
 * error details in parseErrors.
 *
 * Note: This function performs basic content reading. Full XML parsing
 * will be handled by the XMLParser service in a separate task.
 *
 * @param file - The File object to create a document from
 * @returns Promise resolving to a Document object
 *
 * @example
 * ```typescript
 * const file = new File(['<root><item>Test</item></root>'], 'test.xml', {
 *   type: 'text/xml'
 * });
 *
 * const doc = await createDocumentFromFile(file);
 * console.log(doc.name); // "test.xml"
 * console.log(doc.type); // DocumentType.XML
 * console.log(doc.content); // "<root><item>Test</item></root>"
 * console.log(doc.status); // DocumentStatus.READY
 *
 * // Handle errors
 * const badFile = new File([''], 'test.xml');
 * const badDoc = await createDocumentFromFile(badFile);
 * if (badDoc.status === DocumentStatus.ERROR) {
 *   console.error('Failed to load:', badDoc.parseErrors);
 * }
 * ```
 */
export async function createDocumentFromFile(file: File): Promise<Document> {
  const now = new Date();
  const id = generateDocumentId();
  const type = detectDocumentType(file.name);

  // Create document with LOADING status initially
  const document: Document = {
    id,
    name: file.name,
    type,
    content: '',
    status: DocumentStatus.LOADING,
    createdAt: now,
    modifiedAt: now,
  };

  try {
    // Read file content
    const content = await readFileContent(file);

    // Update document with content and READY status
    document.content = content;
    document.status = DocumentStatus.READY;

    return document;
  } catch (error) {
    // Handle error - set ERROR status with details
    document.status = DocumentStatus.ERROR;
    document.parseErrors = [
      {
        line: 1,
        column: 1,
        message: error instanceof Error ? error.message : 'Unknown error reading file',
      },
    ];

    return document;
  }
}

/**
 * Reset untitled document counters
 *
 * Utility function for testing purposes. Resets the counter for each
 * document type back to zero.
 *
 * @example
 * ```typescript
 * resetUntitledCounters();
 * const doc = createUntitledDocument(DocumentType.XML);
 * console.log(doc.name); // "Untitled-xml-1.xml" (not 2, 3, etc.)
 * ```
 */
export function resetUntitledCounters(): void {
  untitledCounters.set(DocumentType.XML, 0);
  untitledCounters.set(DocumentType.XSD, 0);
  untitledCounters.set(DocumentType.XSLT, 0);
  untitledCounters.set(DocumentType.XQUERY, 0);
  untitledCounters.set(DocumentType.JSON, 0);
}
