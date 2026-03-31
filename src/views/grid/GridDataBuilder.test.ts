import { describe, it, expect, beforeEach } from 'vitest';
import { buildGridData } from './GridDataBuilder';

describe('GridDataBuilder', () => {
  describe('buildGridData', () => {
    it('should transform simple XML with attributes and text content to grid rows', () => {
      const xmlString = `
        <root>
          <person id="1" name="John" active="true">
            Some content
          </person>
          <person id="2" name="Jane" active="false">
            More content
          </person>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            active: 'true',
            id: '1',
            name: 'John',
            text: 'Some content'
          },
          {
            _nodeId: expect.any(String),
            active: 'false',
            id: '2',
            name: 'Jane',
            text: 'More content'
          }
        ],
        columns: ['_nodeId', 'text', 'active', 'id', 'name'],
        rootElement: 'root'
      });
    });

    it('should handle XML with only attributes (no text content)', () => {
      const xmlString = `
        <root>
          <person id="1" name="John" />
          <person id="2" name="Jane" />
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            id: '1',
            name: 'John',
            text: ''
          },
          {
            _nodeId: expect.any(String),
            id: '2',
            name: 'Jane',
            text: ''
          }
        ],
        columns: ['_nodeId', 'text', 'id', 'name'],
        rootElement: 'root'
      });
    });

    it('should handle nested elements (treat as empty text for now)', () => {
      const xmlString = `
        <root>
          <person id="1">
            <name>John</name>
            <age>30</age>
          </person>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            id: '1',
            text: ''
          }
        ],
        columns: ['_nodeId', 'text', 'id'],
        rootElement: 'root'
      });
    });

    it('should handle empty XML', () => {
      const xmlString = '<root></root>';

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [],
        columns: ['_nodeId', 'text'],
        rootElement: 'root'
      });
    });

    it('should handle malformed XML', () => {
      const xmlString = '<root><unclosed-tag></root>';

      // xmldom handles malformed XML without throwing, just produces warnings
      // The function should still return a result
      expect(() => buildGridData(xmlString)).not.toThrow();

      const result = buildGridData(xmlString);
      expect(result.rootElement).toBe('root');
      expect(result.rows).toHaveLength(1);
    });

    it('should handle XML with mixed content', () => {
      const xmlString = `
        <root>
          <element id="1">Text before <child>Child element</child> text after</element>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            id: '1',
            text: 'Text before text after'
          }
        ],
        columns: ['_nodeId', 'text', 'id'],
        rootElement: 'root'
      });
    });

    it('should handle XML with different attribute types', () => {
      const xmlString = `
        <root>
          <item id="123" price="19.99" inStock="true" category="electronics">
            Product description
          </item>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            category: 'electronics',
            id: '123',
            inStock: 'true',
            price: '19.99',
            text: 'Product description'
          }
        ],
        columns: ['_nodeId', 'text', 'category', 'id', 'inStock', 'price'],
        rootElement: 'root'
      });
    });

    it('should handle XML with no attributes but text content', () => {
      const xmlString = `
        <root>
          <item>Just text content</item>
          <item>More text</item>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            text: 'Just text content'
          },
          {
            _nodeId: expect.any(String),
            text: 'More text'
          }
        ],
        columns: ['_nodeId', 'text'],
        rootElement: 'root'
      });
    });

    it('should handle XML with CDATA sections', () => {
      const xmlString = `
        <root>
          <item><![CDATA[<script>alert('test')</script>]]></item>
          <item>Regular text</item>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            text: "<script>alert('test')</script>"
          },
          {
            _nodeId: expect.any(String),
            text: 'Regular text'
          }
        ],
        columns: ['_nodeId', 'text'],
        rootElement: 'root'
      });
    });

    it('should handle XML with special characters in attributes and text', () => {
      const xmlString = `
        <root>
          <item id="1&2" name="A & B" quote='"' single="'">
            Text with "quotes" & ampersands
          </item>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            id: '1&2',
            name: 'A & B',
            quote: '"',
            single: "'",
            text: 'Text with "quotes" & ampersands'
          }
        ],
        columns: ['_nodeId', 'text', 'id', 'name', 'quote', 'single'],
        rootElement: 'root'
      });
    });

    it('should handle XML with only whitespace content', () => {
      const xmlString = `
        <root>
          <item>   </item>
          <item>

          </item>
        </root>
      `;

      const result = buildGridData(xmlString);

      expect(result).toEqual({
        rows: [
          {
            _nodeId: expect.any(String),
            text: ''
          },
          {
            _nodeId: expect.any(String),
            text: ''
          }
        ],
        columns: ['_nodeId', 'text'],
        rootElement: 'root'
      });
    });
  });
});