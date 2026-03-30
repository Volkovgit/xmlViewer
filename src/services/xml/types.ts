import { ParseError } from '@/types';

/**
 * Parse result interface
 * Represents the result of parsing an XML document
 */
export interface ParseResult {
  /** Indicates if parsing was successful */
  success: boolean;
  /** Parsed data as JavaScript object (available when success is true) */
  data?: any;
  /** Array of parse errors (available when success is false) */
  errors?: ParseError[];
  /** Metadata about the parsed document */
  metadata: {
    /** Size of the XML content in bytes */
    size: number;
    /** Number of lines in the XML content */
    lineCount: number;
    /** Detected or specified encoding (default: UTF-8) */
    encoding: string;
  };
}

/**
 * Format options interface
 * Configuration options for formatting XML
 */
export interface FormatOptions {
  /** Indentation string (default: '  ' - 2 spaces) */
  indentation?: string;
  /** Whether to collapse empty elements into self-closing tags (default: false) */
  collapseEmpty?: boolean;
  /** Whether to ignore attributes when formatting (default: false) */
  ignoreAttributes?: boolean;
}

/**
 * XML Parser options interface
 * Configuration options for the XML parser
 */
export interface ParserOptions {
  /** Whether to ignore attributes during parsing (default: false) */
  ignoreAttributes?: boolean;
  /** Prefix for attribute names (default: '') */
  attributeNamePrefix?: string;
  /** Whether to preserve text content (default: true) */
  textNodeName?: string;
  /** Whether to parse attribute values (default: true) */
  parseAttributeValue?: boolean;
  /** Whether to parse tag values (default: true) */
  parseTagValue?: boolean;
  /** Whether to trim values (default: true) */
  trimValues?: boolean;
}
