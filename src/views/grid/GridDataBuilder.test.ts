import { describe, it, expect } from 'vitest';
import { buildGridData, updateXMLFromGrid, GridUpdateData } from './GridDataBuilder';

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

  describe('updateXMLFromGrid', () => {
    it('should update text content of an element', () => {
      const originalXml = '<root><person id="1">John</person></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], text: 'Jane' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('>Jane</person>');
      expect(result).toContain('id="1"');
      expect(result).not.toContain('>John</person>');
    });

    it('should update attribute values', () => {
      const originalXml = '<root><person id="1" name="John">Content</person></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], id: '2', name: 'Jane' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('id="2"');
      expect(result).toContain('name="Jane"');
      expect(result).toContain('>Content</person>');
      expect(result).not.toContain('id="1"');
      expect(result).not.toContain('name="John"');
    });

    it('should update multiple rows', () => {
      const originalXml = `
        <root>
          <person id="1">John</person>
          <person id="2">Jane</person>
        </root>
      `;
      const gridData = buildGridData(originalXml);

      const updatedRows = gridData.rows.map(row => ({
        ...row,
        text: row.text === 'John' ? 'Johnny' : 'Janey'
      }));

      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('>Johnny</person>');
      expect(result).toContain('>Janey</person>');
      expect(result).not.toContain('>John</person>');
      expect(result).not.toContain('>Jane</person>');
    });

    it('should handle adding new attributes', () => {
      const originalXml = '<root><person id="1">John</person></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], active: 'true' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('active="true"');
      expect(result).toContain('id="1"');
    });

    it('should handle removing attributes', () => {
      const originalXml = '<root><person id="1" name="John">Content</person></root>';
      const gridData = buildGridData(originalXml);

      // Remove name attribute by setting it to undefined
      const { name: _name, ...rowWithoutName } = gridData.rows[0];
      const updatedRow = { ...rowWithoutName, name: undefined as unknown as string };

      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('id="1"');
      expect(result).not.toContain('name=');
    });

    it('should handle empty text content updates', () => {
      const originalXml = '<root><person id="1">John</person></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], text: '' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('<person id="1"/>');
      expect(result).not.toContain('>John</person>');
    });

    it('should handle special characters in text content', () => {
      const originalXml = '<root><item id="1">Simple text</item></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], text: 'Text with <tags> & "quotes"' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('Text with');
    });

    it('should handle special characters in attributes', () => {
      const originalXml = '<root><item id="1">Content</item></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], desc: 'A & B "quoted"' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('desc=');
    });

    it('should only update rows that have changes', () => {
      const originalXml = `
        <root>
          <person id="1">John</person>
          <person id="2">Jane</person>
        </root>
      `;
      const gridData = buildGridData(originalXml);

      // Only update first row
      const updatedRow = { ...gridData.rows[0], text: 'Johnny' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('>Johnny</person>');
      expect(result).toContain('>Jane</person>');
    });

    it('should handle elements with only attributes (no text)', () => {
      const originalXml = '<root><person id="1" name="John"/></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], name: 'Jane' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('name="Jane"');
      expect(result).not.toContain('name="John"');
    });

    it('should handle adding text to empty elements', () => {
      const originalXml = '<root><person id="1"/></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], text: 'John' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('>John</person>');
      expect(result).not.toContain('<person id="1"/>');
    });

    it('should throw error for invalid XML', () => {
      const invalidXml = '<root><unclosed></root>';
      const gridData = buildGridData('<root></root>');

      const updateData: GridUpdateData = {
        originalXml: invalidXml,
        originalGridData: gridData,
        updatedRows: []
      };

      expect(() => updateXMLFromGrid(updateData)).toThrow();
    });

    it('should preserve XML declaration and structure', () => {
      const originalXml = '<?xml version="1.0" encoding="UTF-8"?>\n<root><person id="1">John</person></root>';
      const gridData = buildGridData(originalXml);

      const updatedRow = { ...gridData.rows[0], text: 'Jane' };
      const updateData: GridUpdateData = {
        originalXml,
        originalGridData: gridData,
        updatedRows: [updatedRow]
      };

      const result = updateXMLFromGrid(updateData);

      expect(result).toContain('<?xml version="1.0"');
      expect(result).toContain('<root>');
      expect(result).toContain('</root>');
    });
  });
});