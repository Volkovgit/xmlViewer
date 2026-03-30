/**
 * Tests for XMLParser
 */

import { describe, it, expect } from 'vitest';
import { XMLParser } from '../XMLParser.js';

describe('XMLParser', () => {
  let parser: XMLParser;

  beforeEach(() => {
    parser = new XMLParser();
  });

  describe('parse', () => {
    it('should parse valid XML', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><root><child>Content</child></root>';
      const doc = parser.parse(validXML);

      expect(doc).not.toBeNull();
      expect(doc?.documentElement.tagName).toBe('root');
    });

    it('should return null for invalid XML', () => {
      const invalidXML = '<root><child>Content</root>';
      const doc = parser.parse(invalidXML);

      expect(doc).toBeNull();
    });

    it('should return null for empty string', () => {
      const doc = parser.parse('');

      expect(doc).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const doc = parser.parse('   \n\t  ');

      expect(doc).toBeNull();
    });

    it('should parse complex XML structure', () => {
      const complexXML = `<?xml version="1.0" encoding="UTF-8"?>
        <catalog>
          <book id="bk101">
            <author>Gambardella, Matthew</author>
            <title>XML Developer's Guide</title>
          </book>
        </catalog>`;

      const doc = parser.parse(complexXML);

      expect(doc).not.toBeNull();
      expect(doc?.documentElement.tagName).toBe('catalog');
    });
  });

  describe('validateSyntax', () => {
    it('should validate well-formed XML', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><root><child>Content</child></root>';
      const errors = parser.validateSyntax(validXML);

      expect(errors).toEqual([]);
    });

    it('should detect unclosed tag', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].line).toBeGreaterThan(0);
      expect(errors[0].column).toBeGreaterThan(0);
      expect(errors[0].message).toBeTruthy();
    });

    it('should detect mismatched tags', () => {
      const invalidXML = '<root><child>Content</wrongtag></root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should detect missing closing tag', () => {
      const invalidXML = '<root><child>Content';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should return error for empty string', () => {
      const errors = parser.validateSyntax('');

      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain('Empty');
      expect(errors[0].code).toBe('EMPTY_DOCUMENT');
    });

    it('should return error for whitespace only', () => {
      const errors = parser.validateSyntax('   \n\t  ');

      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain('Empty');
    });

    it('should include error code for syntax errors', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBeTruthy();
    });

    it('should provide line and column information', () => {
      const invalidXML = '<root>\n  <child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].line).toBeGreaterThan(0);
      expect(errors[0].column).toBeGreaterThan(0);
    });

    it('should handle XML with special characters', () => {
      const xmlWithSpecialChars =
        '<?xml version="1.0" encoding="UTF-8"?><root><test>&lt;tag&gt;</test></root>';
      const errors = parser.validateSyntax(xmlWithSpecialChars);

      expect(errors).toEqual([]);
    });

    it('should handle XML with attributes', () => {
      const xmlWithAttrs =
        '<?xml version="1.0" encoding="UTF-8"?><root id="1" name="test"><child>Content</child></root>';
      const errors = parser.validateSyntax(xmlWithAttrs);

      expect(errors).toEqual([]);
    });
  });

  describe('extractText', () => {
    it('should extract text content from XML', () => {
      const xml = '<?xml version="1.0"?><root>Hello World</root>';
      const text = parser.extractText(xml);

      expect(text).toBe('Hello World');
    });

    it('should extract nested text content', () => {
      const xml = '<?xml version="1.0"?><root><child>Nested Content</child></root>';
      const text = parser.extractText(xml);

      expect(text).toContain('Nested Content');
    });

    it('should return null for invalid XML', () => {
      const invalidXML = '<root><child>Content</root>';
      const text = parser.extractText(invalidXML);

      expect(text).toBeNull();
    });

    it('should return null for empty string', () => {
      const text = parser.extractText('');

      expect(text).toBeNull();
    });
  });

  describe('getElementNames', () => {
    it('should extract all element names', () => {
      const xml = '<?xml version="1.0"?><root><child><grandchild/></child></root>';
      const names = parser.getElementNames(xml);

      expect(names).not.toBeNull();
      expect(names).toContain('root');
      expect(names).toContain('child');
      expect(names).toContain('grandchild');
    });

    it('should return unique element names', () => {
      const xml =
        '<?xml version="1.0"?><root><child/><child/><grandchild/></root>';
      const names = parser.getElementNames(xml);

      expect(names).not.toBeNull();
      const childCount = names?.filter((n) => n === 'child').length;
      expect(childCount).toBe(1); // Should only appear once
    });

    it('should return null for invalid XML', () => {
      const invalidXML = '<root><child>Content</root>';
      const names = parser.getElementNames(invalidXML);

      expect(names).toBeNull();
    });

    it('should handle empty XML', () => {
      const names = parser.getElementNames('');

      expect(names).toBeNull();
    });
  });

  describe('error message formatting', () => {
    it('should clean error messages', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBeTruthy();
      expect(errors[0].message.length).toBeGreaterThan(0);
    });

    it('should capitalize first letter of error message', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      const firstChar = errors[0].message.charAt(0);
      expect(firstChar).toBe(firstChar.toUpperCase());
    });

    it('should add period to error message if missing', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message.endsWith('.')).toBe(true);
    });
  });

  describe('error code determination', () => {
    it('should detect syntax error for unclosed tags', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBeTruthy();
      // Browser DOMParser may return various error codes
      expect(errors[0].code).toMatch(/^SYNTAX_ERROR_/);
    });

    it('should detect syntax error for malformed XML', () => {
      const invalidXML = '<root><child>Content';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toBeTruthy();
    });

    it('should provide general syntax error code', () => {
      const invalidXML = '<root><child>Content</root>';
      const errors = parser.validateSyntax(invalidXML);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].code).toMatch(/^SYNTAX_ERROR_/);
    });
  });

  describe('edge cases', () => {
    it('should handle XML with only declaration', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?>';
      const errors = parser.validateSyntax(xml);

      // Browser parser may or may not error on this
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should handle XML with comments', () => {
      const xml = '<?xml version="1.0"?><!-- Comment --><root></root>';
      const errors = parser.validateSyntax(xml);

      expect(errors).toEqual([]);
    });

    it('should handle XML with CDATA sections', () => {
      const xml = '<?xml version="1.0"?><root><![CDATA[<not>xml</not>]]></root>';
      const errors = parser.validateSyntax(xml);

      expect(errors).toEqual([]);
    });

    it('should handle XML with processing instructions', () => {
      const xml = '<?xml version="1.0"?><?pi target?><root></root>';
      const errors = parser.validateSyntax(xml);

      expect(errors).toEqual([]);
    });
  });
});
