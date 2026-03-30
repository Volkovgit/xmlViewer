import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { ParseError } from '@/types';
import { ParseResult, FormatOptions, ParserOptions } from './types';

/**
 * XMLParser Service
 *
 * Provides XML parsing, validation, formatting, and minification functionality
 * using fast-xml-parser library. Includes caching mechanism for improved performance.
 *
 * @example
 * ```typescript
 * const parser = new XMLParserService();
 * const result = parser.parseXML('<root>content</root>');
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export class XMLParserService {
  /** Cache for parsed XML documents using hash as key */
  private parseCache: Map<string, ParseResult>;

  /** Fast-XML-Parser instance configuration */
  private readonly defaultParserOptions: any = {
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: '#text',
    parseAttributeValue: false, // Keep as strings to match expected behavior
    parseTagValue: false, // Keep as strings to match expected behavior
    parseNodeValue: false,
    trimValues: true,
    ignoreDeclaration: true,
    ignorePiTags: true,
    allowBooleanAttributes: false,
    cdataProp: '#cdata',
    // Strict parsing options
    unpairedTags: [], // No unpaired tags by default
    stopNodes: [], // No stop nodes
  };

  /** Default format options */
  private readonly defaultFormatOptions: FormatOptions = {
    indentation: '  ',
    collapseEmpty: false,
    ignoreAttributes: false,
  };

  /** Maximum cache size to prevent memory issues */
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.parseCache = new Map();
  }

  /**
   * Generate a simple hash from string for cache key
   * Uses a simple hashing algorithm for performance
   *
   * @param xmlString - The XML string to hash
   * @returns A hash string suitable for cache key
   */
  private generateHash(xmlString: string): string {
    let hash = 0;
    for (let i = 0; i < xmlString.length; i++) {
      const char = xmlString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Count the number of lines in a string
   *
   * @param text - The text to count lines in
   * @returns Number of lines
   */
  private countLines(text: string): number {
    return text.split('\n').length;
  }

  /**
   * Manage cache size by removing oldest entries when limit is reached
   * Uses FIFO (First In, First Out) eviction policy
   */
  private manageCacheSize(): void {
    if (this.parseCache.size >= this.MAX_CACHE_SIZE) {
      // Get the first key (oldest entry)
      const firstKey = this.parseCache.keys().next().value;
      if (firstKey) {
        this.parseCache.delete(firstKey);
      }
    }
  }

  /**
   * Parse XML string into JavaScript object
   *
   * Features:
   * - Caching mechanism for improved performance on repeated parses
   * - Preserves attributes and structure
   * - Returns detailed metadata about the parsed document
   * - Handles parse errors with line/column information
   *
   * @param xmlString - The XML string to parse
   * @param options - Optional parser configuration
   * @returns ParseResult with success status, data or errors, and metadata
   *
   * @example
   * ```typescript
   * const parser = new XMLParserService();
   * const result = parser.parseXML('<root><item id="1">Test</item></root>');
   * if (result.success) {
   *   console.log(result.data); // { root: { item: { '#text': 'Test', id: '1' } } }
   *   console.log(result.metadata.lineCount); // 1
   * }
   * ```
   */
  parseXML(xmlString: string, options?: ParserOptions): ParseResult {
    // Trim and validate input
    const trimmedXml = xmlString.trim();

    // Handle empty input
    if (!trimmedXml) {
      return {
        success: false,
        errors: [
          {
            line: 1,
            column: 1,
            message: 'Empty XML document',
          },
        ],
        metadata: {
          size: xmlString.length,
          lineCount: this.countLines(xmlString),
          encoding: 'UTF-8',
        },
      };
    }

    // Generate cache key from XML content
    const hash = this.generateHash(xmlString);

    // Check cache first
    const cached = this.parseCache.get(hash);
    if (cached) {
      return cached;
    }

    // Calculate metadata
    const size = xmlString.length;
    const lineCount = this.countLines(xmlString);
    const metadata = {
      size,
      lineCount,
      encoding: 'UTF-8',
    };

    // Configure parser with merged options
    const parserOptions = {
      ...this.defaultParserOptions,
      ...options,
    };

    const parser = new XMLParser(parserOptions);

    try {
      // Attempt to parse the XML
      const data = parser.parse(trimmedXml);

      const result: ParseResult = {
        success: true,
        data,
        metadata,
      };

      // Cache the result
      this.manageCacheSize();
      this.parseCache.set(hash, result);

      return result;
    } catch (error) {
      // Handle parse errors
      const parseError: ParseError = {
        line: 1,
        column: 1,
        message:
          error instanceof Error
            ? error.message
            : 'Unknown parsing error occurred',
      };

      // Try to extract line/column from error message if available
      if (error instanceof Error) {
        const lineMatch = error.message.match(/line:\s*(\d+)/i);
        const colMatch = error.message.match(/col(?:umn)?:\s*(\d+)/i);

        if (lineMatch) {
          parseError.line = parseInt(lineMatch[1], 10);
        }
        if (colMatch) {
          parseError.column = parseInt(colMatch[1], 10);
        }
      }

      const result: ParseResult = {
        success: false,
        errors: [parseError],
        metadata,
      };

      return result;
    }
  }

  /**
   * Validate XML syntax without returning parsed data
   *
   * Useful for syntax checking before saving or processing documents.
   * Returns an empty array if the XML is valid.
   *
   * @param xmlString - The XML string to validate
   * @returns Array of ParseError objects (empty if valid)
   *
   * @example
   * ```typescript
   * const parser = new XMLParserService();
   * const errors = parser.validateSyntax('<root><item>Test</root>');
   * if (errors.length > 0) {
   *   console.error('Invalid XML:', errors[0].message);
   * }
   * ```
   */
  validateSyntax(xmlString: string): ParseError[] {
    const result = this.parseXML(xmlString);

    if (result.success) {
      return [];
    }

    return result.errors || [];
  }

  /**
   * Format/beautify XML string with proper indentation
   *
   * Features:
   * - Configurable indentation (default: 2 spaces)
   * - Optional self-closing tag support
   * - Preserves attributes by default
   *
   * @param xmlString - The XML string to format
   * @param options - Optional formatting configuration
   * @returns Formatted XML string
   *
   * @example
   * ```typescript
   * const parser = new XMLParserService();
   * const messy = '<root><item>Test</item></root>';
   * const formatted = parser.formatXML(messy);
   * // Returns:
   * // <root>
   * //   <item>Test</item>
   * // </root>
   * ```
   */
  formatXML(xmlString: string, options?: FormatOptions): string {
    // Validate input
    if (!xmlString || !xmlString.trim()) {
      throw new Error('Cannot format empty XML');
    }

    // Merge with default options
    const formatOptions = {
      ...this.defaultFormatOptions,
      ...options,
    };

    // Parse with preserveOrder for proper structure
    const parserOptions = {
      ...this.defaultParserOptions,
      preserveOrder: true,
      ignoreAttributes: formatOptions.ignoreAttributes,
    };

    const parser = new XMLParser(parserOptions);

    try {
      const data = parser.parse(xmlString);

      // Extract actual content from preserveOrder array structure
      let contentToBuild = data;
      if (Array.isArray(data) && data.length > 0) {
        contentToBuild = data[0];
      }

      // Configure builder with proper text node handling
      const builderOptions: any = {
        ignoreAttributes: formatOptions.ignoreAttributes || false,
        attributeNamePrefix: '',
        textNodeName: '#text',
        format: true,
        indentBy: formatOptions.indentation || '  ',
        suppressEmptyNode: formatOptions.collapseEmpty || false,
      };

      const builder = new XMLBuilder(builderOptions);
      const result = builder.build(contentToBuild);

      return result;
    } catch (error) {
      throw new Error(
        `Cannot format XML: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Minify XML string by removing unnecessary whitespace
   *
   * Features:
   * - Removes all indentation and extra whitespace
   * - Collapses empty elements into self-closing tags
   * - Reduces file size for transmission or storage
   *
   * @param xmlString - The XML string to minify
   * @returns Minified XML string
   *
   * @example
   * ```typescript
   * const parser = new XMLParserService();
   * const formatted = '<root>\n  <item>Test</item>\n</root>';
   * const minified = parser.minifyXML(formatted);
   * // Returns: <root><item>Test</item></root>
   * ```
   */
  minifyXML(xmlString: string): string {
    // Validate input
    if (!xmlString || !xmlString.trim()) {
      throw new Error('Cannot minify empty XML');
    }

    // Parse with preserveOrder for proper structure
    const parserOptions = {
      ...this.defaultParserOptions,
      preserveOrder: true,
    };

    const parser = new XMLParser(parserOptions);

    try {
      const data = parser.parse(xmlString);

      // Extract actual content from preserveOrder array structure
      let contentToBuild = data;
      if (Array.isArray(data) && data.length > 0) {
        contentToBuild = data[0];
      }

      // Configure builder for minification
      const builderOptions = {
        ignoreAttributes: false,
        attributeNamePrefix: '',
        textNodeName: '#text',
        format: false,
        suppressEmptyNode: true,
      };

      const builder = new XMLBuilder(builderOptions);
      return builder.build(contentToBuild);
    } catch (error) {
      throw new Error(
        `Cannot minify XML: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear the parse cache
   *
   * Useful for freeing memory or forcing fresh parses
   *
   * @example
   * ```typescript
   * const parser = new XMLParserService();
   * parser.clearCache();
   * ```
   */
  clearCache(): void {
    this.parseCache.clear();
  }

  /**
   * Get current cache size
   *
   * @returns Number of cached parse results
   */
  getCacheSize(): number {
    return this.parseCache.size;
  }
}

/**
 * Singleton instance of XMLParserService
 * Exported for convenient use throughout the application
 */
export const xmlParser = new XMLParserService();
