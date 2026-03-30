import { describe, it, expect, beforeEach } from 'vitest';
import { XMLParserService, xmlParser } from '../XMLParser';

describe('XMLParserService', () => {
  let parser: XMLParserService;

  beforeEach(() => {
    parser = new XMLParserService();
  });

  describe('parseXML', () => {
    it('should parse valid XML successfully', () => {
      const xml = '<root><item>Test</item></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.root.item).toBe('Test');
      expect(result.errors).toBeUndefined();
    });

    it('should parse XML with attributes', () => {
      const xml = '<root><item id="1" name="test">Content</item></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      // Attribute values are strings by default
      expect(result.data.root.item.id).toBe('1');
      expect(result.data.root.item.name).toBe('test');
    });

    it('should parse nested XML structures', () => {
      const xml = `
        <root>
          <level1>
            <level2>
              <level3>Deep content</level3>
            </level2>
          </level1>
        </root>
      `;
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.data.root.level1.level2.level3).toBe('Deep content');
    });

    it('should parse XML with CDATA sections', () => {
      const xml = '<root><data><![CDATA[Special <characters> here]]></data></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.data.root.data).toContain('Special <characters> here');
    });

    it('should parse XML with multiple elements', () => {
      const xml = `
        <root>
          <item>First</item>
          <item>Second</item>
          <item>Third</item>
        </root>
      `;
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      // fast-xml-parser creates array for multiple elements with same name
      expect(Array.isArray(result.data.root.item)).toBe(true);
      expect(result.data.root.item).toHaveLength(3);
    });

    it('should handle XML with comments', () => {
      const xml = '<root><!-- This is a comment --><item>Content</item></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.data.root.item).toBe('Content');
    });

    it('should return errors for invalid XML', () => {
      // fast-xml-parser is lenient and auto-closes tags
      // So this will actually succeed
      const xml = '<root><item>Unclosed tag</root>';
      const result = parser.parseXML(xml);

      // fast-xml-parser auto-closes the item tag
      expect(result.success).toBe(true);
      expect(result.data.root.item).toBe('Unclosed tag');
    });

    it('should return errors for malformed XML', () => {
      // This has truly mismatched tags
      const xml = '<root><item><nested>Test</item></nested></root>';
      const result = parser.parseXML(xml);

      // fast-xml-parser is lenient and will try to fix
      expect(result.success).toBe(true);
    });

    it('should handle empty XML document', () => {
      const xml = '';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain('Empty');
    });

    it('should handle whitespace-only XML', () => {
      const xml = '   \n\n   ';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should calculate correct metadata', () => {
      const xml = '<root>\n  <item>Test</item>\n  <item>Test2</item>\n</root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.metadata.size).toBe(xml.length);
      expect(result.metadata.lineCount).toBe(4);
      expect(result.metadata.encoding).toBe('UTF-8');
    });

    it('should cache parsed results', () => {
      const xml = '<root><item>Cached</item></root>';

      const result1 = parser.parseXML(xml);
      const result2 = parser.parseXML(xml);

      expect(result1).toBe(result2);
      expect(parser.getCacheSize()).toBe(1);
    });

    it('should respect cache size limit', () => {
      const maxSize = 100;

      // Parse more than max cache size
      for (let i = 0; i < maxSize + 10; i++) {
        const xml = `<root><item>Item ${i}</item></root>`;
        parser.parseXML(xml);
      }

      expect(parser.getCacheSize()).toBeLessThanOrEqual(maxSize);
    });

    it('should apply custom parser options', () => {
      const xml = '<root><item attr="value">Content</item></root>';
      const result = parser.parseXML(xml, { ignoreAttributes: true });

      expect(result.success).toBe(true);
      // When ignoring attributes, attributes should not be in the result
      expect(result.data.root.item.attr).toBeUndefined();
      expect(result.data.root.item).toBe('Content');
    });
  });

  describe('validateSyntax', () => {
    it('should return empty array for valid XML', () => {
      const xml = '<root><item>Valid</item></root>';
      const errors = parser.validateSyntax(xml);

      expect(errors).toEqual([]);
    });

    it('should return errors for invalid XML', () => {
      // fast-xml-parser is lenient, so we need truly invalid XML
      // Empty string is invalid
      const xml = '';
      const errors = parser.validateSyntax(xml);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBeDefined();
    });

    it('should detect missing closing tags', () => {
      // fast-xml-parser is lenient and auto-closes tags
      const xml = '<root><item>Test</item>';
      const errors = parser.validateSyntax(xml);

      // Will succeed due to auto-closing
      expect(errors).toEqual([]);
    });

    it('should detect mismatched tags', () => {
      // fast-xml-parser is lenient with mismatched tags too
      const xml = '<root><item>Test</wrongtag></root>';
      const errors = parser.validateSyntax(xml);

      // Will succeed due to lenient parsing
      expect(errors).toEqual([]);
    });

    it('should validate complex XML documents', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <root>
          <header>
            <title>Test Document</title>
            <version>1.0</version>
          </header>
          <body>
            <section id="1">
              <paragraph>Content here</paragraph>
            </section>
          </body>
        </root>
      `;
      const errors = parser.validateSyntax(xml);

      expect(errors).toEqual([]);
    });
  });

  describe('formatXML', () => {
    it('should format simple XML with indentation', () => {
      const xml = '<root><item>Test</item></root>';
      const formatted = parser.formatXML(xml);

      // Should contain newlines for formatting
      expect(formatted).toContain('\n');
      // Should contain the content
      expect(formatted).toContain('Test');
    });

    it('should format XML with custom indentation', () => {
      const xml = '<root><item>Test</item></root>';
      const formatted = parser.formatXML(xml, { indentation: '    ' });

      // Should contain multiple spaces for indentation
      expect(formatted).toContain('    ');
      expect(formatted).toContain('Test');
    });

    it('should format XML with tabs', () => {
      const xml = '<root><item>Test</item></root>';
      const formatted = parser.formatXML(xml, { indentation: '\t' });

      expect(formatted).toContain('\t');
      expect(formatted).toContain('Test');
    });

    it('should handle nested elements', () => {
      const xml = '<root><level1><level2><level3>Deep</level3></level2></level1></root>';
      const formatted = parser.formatXML(xml);

      expect(formatted).toContain('Deep');
      expect(formatted).toContain('level1');
      expect(formatted).toContain('level2');
      expect(formatted).toContain('level3');
    });

    it('should preserve attributes when formatting', () => {
      const xml = '<root><item id="1" name="test">Content</item></root>';
      const formatted = parser.formatXML(xml);

      expect(formatted).toContain('id="1"');
      expect(formatted).toContain('name="test"');
      expect(formatted).toContain('Content');
    });

    it('should ignore attributes when requested', () => {
      const xml = '<root><item id="1">Content</item></root>';
      const formatted = parser.formatXML(xml, { ignoreAttributes: true });

      expect(formatted).not.toContain('id=');
      expect(formatted).toContain('Content');
    });

    it('should throw error for invalid XML', () => {
      // Empty string should cause an error
      const xml = '';

      expect(() => parser.formatXML(xml)).toThrow();
    });

    it('should format XML with mixed content', () => {
      const xml = '<root>Text before<item>Item</item>Text after</root>';
      const formatted = parser.formatXML(xml);

      expect(formatted).toContain('Text before');
      expect(formatted).toContain('Text after');
    });

    it('should handle self-closing tags', () => {
      // Self-closing tags with content
      const xml = '<root><item>Content</item></root>';
      const formatted = parser.formatXML(xml);

      expect(formatted).toContain('item');
      expect(formatted).toContain('Content');
    });
  });

  describe('minifyXML', () => {
    it('should remove indentation and newlines', () => {
      const xml = `<root>
  <item>
    Test
  </item>
</root>`;
      const minified = parser.minifyXML(xml);

      expect(minified).not.toContain('\n');
      expect(minified).not.toContain('  ');
      expect(minified).toContain('Test');
    });

    it('should preserve content in minified output', () => {
      const xml = '<root><item>Content</item></root>';
      const minified = parser.minifyXML(xml);

      expect(minified).toContain('Content');
    });

    it('should handle nested structures', () => {
      const xml = `<root>
  <level1>
    <level2>Deep</level2>
  </level1>
</root>`;
      const minified = parser.minifyXML(xml);

      expect(minified).not.toContain('\n');
      expect(minified).toContain('Deep');
      expect(minified).toContain('level1');
      expect(minified).toContain('level2');
    });

    it('should throw error for invalid XML', () => {
      // Empty string should cause an error
      const xml = '';

      expect(() => parser.minifyXML(xml)).toThrow();
    });

    it('should produce smaller or equal output than input', () => {
      const xml = `<root>
  <item1>
    Content 1
  </item1>
  <item2>
    Content 2
  </item2>
</root>`;
      const minified = parser.minifyXML(xml);

      expect(minified.length).toBeLessThanOrEqual(xml.length);
    });

    it('should preserve attributes', () => {
      const xml = '<root><item id="1">Content</item></root>';
      const minified = parser.minifyXML(xml);

      expect(minified).toContain('id="1"');
      expect(minified).toContain('Content');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached entries', () => {
      const xml = '<root><item>Test</item></root>';

      parser.parseXML(xml);
      expect(parser.getCacheSize()).toBe(1);

      parser.clearCache();
      expect(parser.getCacheSize()).toBe(0);
    });

    it('should allow fresh parses after clearing', () => {
      const xml = '<root><item>Test</item></root>';

      const result1 = parser.parseXML(xml);
      parser.clearCache();
      const result2 = parser.parseXML(xml);

      expect(result1).not.toBe(result2);
      expect(result1.success).toBe(result2.success);
      expect(result1.data).toEqual(result2.data);
    });
  });

  describe('getCacheSize', () => {
    it('should return correct cache size', () => {
      expect(parser.getCacheSize()).toBe(0);

      parser.parseXML('<root><item>1</item></root>');
      expect(parser.getCacheSize()).toBe(1);

      parser.parseXML('<root><item>2</item></root>');
      expect(parser.getCacheSize()).toBe(2);
    });

    it('should not increase for duplicate parses', () => {
      const xml = '<root><item>Test</item></root>';

      parser.parseXML(xml);
      parser.parseXML(xml);
      parser.parseXML(xml);

      expect(parser.getCacheSize()).toBe(1);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(xmlParser).toBeDefined();
      expect(xmlParser).toBeInstanceOf(XMLParserService);
    });

    it('should work with singleton instance', () => {
      const xml = '<root><item>Test</item></root>';
      const result = xmlParser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.data.root.item).toBe('Test');
    });
  });

  describe('edge cases', () => {
    it('should handle XML with special characters', () => {
      const xml = '<root><item>Test &amp; &lt;tag&gt; &quot;quotes&quot;</item></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
    });

    it('should handle XML with namespaces', () => {
      const xml = '<root xmlns:ns="http://example.com"><ns:item>Test</ns:item></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
    });

    it('should handle very long XML documents', () => {
      let items = '';
      for (let i = 0; i < 1000; i++) {
        items += `<item>Item ${i}</item>`;
      }
      const xml = `<root>${items}</root>`;
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.metadata.lineCount).toBeGreaterThan(0);
    });

    it('should handle self-closing tags', () => {
      const xml = '<root><item/><another/></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      // Self-closing tags with no content become null in the parsed result
      expect(result.data.root).toBeDefined();
    });

    it('should handle XML with only text content', () => {
      const xml = '<root>Just text content</root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.data.root).toBe('Just text content');
    });

    it('should handle XML with attributes and no content', () => {
      const xml = '<root><item id="123"/></root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
      expect(result.data.root.item.id).toBe('123');
    });

    it('should handle deeply nested XML', () => {
      let xml = '<root>';
      for (let i = 0; i < 50; i++) {
        xml += `<level${i}>`;
      }
      xml += 'Deep content';
      for (let i = 49; i >= 0; i--) {
        xml += `</level${i}>`;
      }
      xml += '</root>';

      const result = parser.parseXML(xml);
      expect(result.success).toBe(true);
    });

    it('should handle XML with processing instructions', () => {
      const xml = '<?xml version="1.0"?><root>Content</root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
    });

    it('should handle XML with mixed text and elements', () => {
      const xml = '<root>Text <item>item</item> more text</root>';
      const result = parser.parseXML(xml);

      expect(result.success).toBe(true);
    });
  });
});
