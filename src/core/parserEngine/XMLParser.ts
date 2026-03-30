/**
 * XMLParser
 *
 * Provides XML parsing functionality with syntax validation.
 * Uses browser's DOMParser for XML parsing and error detection.
 */

import type { ParseError } from '../../types/document.js';

/**
 * XMLParser class
 * Handles XML parsing and syntax validation
 */
export class XMLParser {
  private domParser: DOMParser;

  constructor() {
    this.domParser = new DOMParser();
  }

  /**
   * Parse XML string into DOM Document
   * @param xmlString - XML content to parse
   * @returns Parsed DOM Document or null if parsing fails
   */
  parse(xmlString: string): Document | null {
    if (!xmlString || xmlString.trim().length === 0) {
      return null;
    }

    const doc = this.domParser.parseFromString(xmlString, 'application/xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return null;
    }

    return doc;
  }

  /**
   * Validate XML syntax without throwing exceptions
   * @param xmlString - XML content to validate
   * @returns Array of ParseError objects (empty if valid)
   */
  validateSyntax(xmlString: string): ParseError[] {
    const errors: ParseError[] = [];

    if (!xmlString || xmlString.trim().length === 0) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Empty document',
        code: 'EMPTY_DOCUMENT',
      });
      return errors;
    }

    const doc = this.domParser.parseFromString(xmlString, 'application/xml');

    // Check for parser errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      const errorText = parserError.textContent || '';

      // Parse the error message to extract line and column information
      const parsedError = this.parseErrorMessage(errorText);
      errors.push(parsedError);
    }

    return errors;
  }

  /**
   * Parse browser's parser error message to extract structured error information
   * @param errorText - Raw error text from parsererror element
   * @returns Structured ParseError object
   */
  private parseErrorMessage(errorText: string): ParseError {
    // Default values
    let line = 1;
    let column = 1;
    let message = errorText;
    let code: string | undefined;

    // Try to extract line and column from error message
    // Common patterns:
    // "Error: line 1, column 45: ..."
    // "error on line 5 at column 12"
    // "XML parsing error: <message>"

    const lineColMatch = errorText.match(
      /line\s+(\d+).*?column\s+(\d+)/i
    );
    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10);
      column = parseInt(lineColMatch[2], 10);
    } else {
      // Try alternative pattern
      const altMatch = errorText.match(/line\s+(\d+)/i);
      if (altMatch) {
        line = parseInt(altMatch[1], 10);
      }
    }

    // Clean up the error message
    message = this.cleanErrorMessage(errorText);

    // Try to determine error code from message
    code = this.determineErrorCode(message);

    return {
      line,
      column,
      message,
      code,
    };
  }

  /**
   * Clean up error message to make it more user-friendly
   * @param errorText - Raw error text
   * @returns Cleaned error message
   */
  private cleanErrorMessage(errorText: string): string {
    // Remove the "XML Parsing Error:" prefix if present
    let cleaned = errorText.replace(/^XML\s+Parsing\s+Error:\s*/i, '');

    // Remove the "Error:" prefix if present
    cleaned = cleaned.replace(/^Error:\s*/i, '');

    // Try to extract just the meaningful error message
    // Common patterns to remove: "line X, column Y:", "at line X", etc.
    cleaned = cleaned.replace(/line\s+\d+.*?column\s+\d+:\s*/gi, '');
    cleaned = cleaned.replace(/at\s+line\s+\d+:\s*/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Add period if missing
    if (cleaned.length > 0 && !cleaned.endsWith('.')) {
      cleaned += '.';
    }

    return cleaned;
  }

  /**
   * Determine error code from error message
   * @param message - Error message
   * @returns Error code or undefined
   */
  private determineErrorCode(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('mismatch') || lowerMessage.includes('unexpected')) {
      return 'SYNTAX_ERROR_UNEXPECTED_TOKEN';
    }
    if (lowerMessage.includes('not well-formed')) {
      return 'SYNTAX_ERROR_NOT_WELL_FORMED';
    }
    if (lowerMessage.includes('unclosed') || lowerMessage.includes('not closed')) {
      return 'SYNTAX_ERROR_UNCLOSED_TAG';
    }
    if (lowerMessage.includes('invalid')) {
      return 'SYNTAX_ERROR_INVALID';
    }

    return 'SYNTAX_ERROR_GENERAL';
  }

  /**
   * Extract text content from XML
   * @param xmlString - XML content
   * @returns Text content or null if parsing fails
   */
  extractText(xmlString: string): string | null {
    const doc = this.parse(xmlString);
    if (!doc) {
      return null;
    }

    return doc.documentElement.textContent || '';
  }

  /**
   * Get all element names from XML
   * @param xmlString - XML content
   * @returns Array of element names or null if parsing fails
   */
  getElementNames(xmlString: string): string[] | null {
    const doc = this.parse(xmlString);
    if (!doc) {
      return null;
    }

    const elements = doc.getElementsByTagName('*');
    const names = new Set<string>();

    for (let i = 0; i < elements.length; i++) {
      names.add(elements[i].tagName);
    }

    return Array.from(names);
  }
}

// Export singleton instance
export const xmlParser = new XMLParser();
