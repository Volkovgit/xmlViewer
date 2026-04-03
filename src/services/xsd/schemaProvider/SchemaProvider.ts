/**
 * SchemaProvider
 *
 * Provides functionality for detecting, loading, and attaching XSD schemas to XML documents.
 * This service enables schema-aware editing by:
 * - Detecting schema references in XML documents (xsi:noNamespaceSchemaLocation, xsi:schemaLocation)
 * - Loading and parsing XSD schema content
 * - Attaching/detaching schemas to documents in the DocumentStore
 */

import { parseXSD } from '@/services/xsd/XSDParser';
import { useDocumentStore } from '@/stores/documentStore';
import type { XSDSchema } from '@/services/xsd/XSDParser';

/**
 * XSI namespace URI for schema instance attributes
 */
const XSI_NAMESPACE_URI = 'http://www.w3.org/2001/XMLSchema-instance';

/**
 * SchemaProvider Service
 *
 * Static service class for schema-related operations.
 * No instantiation needed - all methods are static.
 */
export class SchemaProvider {
  /**
   * Detect schema location from XML content
   *
   * Looks for xsi:noNamespaceSchemaLocation or xsi:schemaLocation attributes
   * in the root element of the XML document.
   *
   * @param xmlContent - The XML document content as string
   * @returns The schema path/URL if found, null otherwise
   *
   * @example
   * ```ts
   * const xml = '<?xml version="1.0"?><root xsi:noNamespaceSchemaLocation="schema.xsd"/>';
   * const schemaPath = SchemaProvider.detectSchemaLocation(xml);
   * // Returns: "schema.xsd"
   * ```
   */
  static detectSchemaLocation(xmlContent: string): string | null {
    if (!xmlContent || xmlContent.trim().length === 0) {
      return null;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'application/xml');

      // Check for parse errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        return null;
      }

      // Get the root element
      const rootElement = doc.documentElement;
      if (!rootElement) {
        return null;
      }

      // Try xsi:noNamespaceSchemaLocation first (no namespace)
      const noNamespaceSchemaLocation = rootElement.getAttributeNS(
        XSI_NAMESPACE_URI,
        'noNamespaceSchemaLocation'
      );
      if (noNamespaceSchemaLocation) {
        return noNamespaceSchemaLocation;
      }

      // Try xsi:schemaLocation (with namespace)
      // Format: "namespace-uri schema.xsd"
      const schemaLocation = rootElement.getAttributeNS(XSI_NAMESPACE_URI, 'schemaLocation');
      if (schemaLocation) {
        // Parse the value and extract the schema path (last whitespace-separated token)
        const parts = schemaLocation.trim().split(/\s+/);
        if (parts.length >= 2) {
          return parts[parts.length - 1];
        }
      }

      return null;
    } catch {
      // If parsing fails, return null
      return null;
    }
  }

  /**
   * Load and parse XSD schema from content
   *
   * Uses XSDParser.parseXSD to convert XSD content into a structured schema model.
   *
   * @param xsdContent - The XSD schema content as string
   * @returns Parsed XSDSchema object or null if parsing fails
   *
   * @example
   * ```ts
   * const xsd = '<?xml version="1.0"?><xs:schema...>';
   * const schema = SchemaProvider.loadSchemaFromContent(xsd);
   * if (schema) {
   *   console.log('Elements:', schema.elements);
   * }
   * ```
   */
  static loadSchemaFromContent(xsdContent: string): XSDSchema | null {
    if (!xsdContent || xsdContent.trim().length === 0) {
      return null;
    }

    try {
      return parseXSD(xsdContent);
    } catch {
      // If parsing fails, return null
      return null;
    }
  }

  /**
   * Attach an XSD schema to a document
   *
   * Updates the document in the DocumentStore with schema information.
   * This enables schema-aware editing and validation.
   *
   * @param documentId - The ID of the document to attach schema to
   * @param schemaPath - The path or URL of the schema file
   * @param schema - The parsed XSDSchema object
   *
   * @example
   * ```ts
   * const schema = SchemaProvider.loadSchemaFromContent(xsdContent);
   * if (schema) {
   *   SchemaProvider.attachSchemaToDocument('doc-123', 'schema.xsd', schema);
   * }
   * ```
   */
  static attachSchemaToDocument(
    documentId: string,
    schemaPath: string,
    schema: XSDSchema
  ): void {
    const store = useDocumentStore.getState();
    store.attachSchema(documentId, schemaPath, schema);
  }

  /**
   * Detach the XSD schema from a document
   *
   * Removes schema information from the document in the DocumentStore.
   * This disables schema-aware editing and validation.
   *
   * @param documentId - The ID of the document to detach schema from
   *
   * @example
   * ```ts
   * SchemaProvider.detachSchema('doc-123');
   * ```
   */
  static detachSchema(documentId: string): void {
    const store = useDocumentStore.getState();
    store.detachSchema(documentId);
  }
}
