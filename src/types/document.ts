/**
 * Document type enumeration
 * Defines all supported document types in the XML editor
 */
export enum DocumentType {
  /** XML document */
  XML = 'xml',
  /** XML Schema Definition document */
  XSD = 'xsd',
  /** XSL Transform document */
  XSLT = 'xslt',
  /** XQuery query document */
  XQUERY = 'xquery',
  /** JSON document */
  JSON = 'json',
}

/**
 * Document status enumeration
 * Tracks the current state of a document in the editor
 */
export enum DocumentStatus {
  /** Document is currently loading */
  LOADING = 'loading',
  /** Document is ready for editing */
  READY = 'ready',
  /** Document has encountered an error */
  ERROR = 'error',
  /** Document has unsaved changes */
  DIRTY = 'dirty',
  /** Document is saved to disk */
  SAVED = 'saved',
}

/**
 * Parse error interface
 * Represents a syntax error found during XML parsing
 */
export interface ParseError {
  /** Line number where the error occurred (1-based) */
  line: number;
  /** Column number where the error occurred (1-based) */
  column: number;
  /** Human-readable error message */
  message: string;
  /** Optional error code for programmatic handling */
  code?: string;
}

/**
 * Validation error interface
 * Represents a schema validation error or warning
 */
export interface ValidationError {
  /** Line number where the error occurred (1-based) */
  line: number;
  /** Column number where the error occurred (1-based) */
  column: number;
  /** Human-readable error message */
  message: string;
  /** Error severity level */
  severity: 'error' | 'warning';
  /** Optional XPath to the element with the validation issue */
  path?: string;
}

/**
 * Main document interface
 * Represents an open document in the XML editor
 */
export interface Document {
  /** Unique document identifier (UUID) */
  id: string;
  /** Document filename or "Untitled-N" for new documents */
  name: string;
  /** Document type from DocumentType enum */
  type: DocumentType;
  /** Current document content as string */
  content: string;
  /** Current document status from DocumentStatus enum */
  status: DocumentStatus;
  /** Optional reference to XSD schema for validation (Phase 2) */
  schemaRef?: string;
  /** Optional file system path for saved documents */
  filePath?: string;
  /** Timestamp when document was created */
  createdAt: Date;
  /** Timestamp when document was last modified */
  modifiedAt: Date;
  /** Optional array of parse errors (populated on parse failure) */
  parseErrors?: ParseError[];
  /** Optional array of validation errors (populated on schema validation) */
  validationErrors?: ValidationError[];
}
