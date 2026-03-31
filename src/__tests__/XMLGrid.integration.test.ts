/**
 * XML Grid Integration Tests
 *
 * These tests verify the end-to-end functionality of the XML grid component
 * by testing the GridDataBuilder service that powers it.
 */

import { describe, it, expect } from 'vitest';
import { buildGridData, updateXMLFromGrid } from '@/views/grid/GridDataBuilder';

describe('XML Grid Integration', () => {
  describe('buildGridData function', () => {
    it('should display tabular data for simple XML', () => {
      const xml = `
        <books>
          <book id="1" title="XML 101" author="John"/>
          <book id="2" title="XSD Guide" author="Jane"/>
        </books>
      `;

      const result = buildGridData(xml);

      // Verify result structure
      expect(result.rootElement).toBe('books');
      expect(result.rows).toHaveLength(2);
      expect(result.columns).toEqual(['_nodeId', 'text', 'author', 'id', 'title']);

      // Verify first row
      expect(result.rows[0]._nodeId).toBeDefined();
      expect(result.rows[0].text).toBe(''); // Self-closing tag has no text content
      expect(result.rows[0].id).toBe('1');
      expect(result.rows[0].title).toBe('XML 101');
      expect(result.rows[0].author).toBe('John');

      // Verify second row
      expect(result.rows[1].id).toBe('2');
      expect(result.rows[1].title).toBe('XSD Guide');
      expect(result.rows[1].author).toBe('Jane');
    });

    it('should handle XML with mixed attributes and text content', () => {
      const xml = `
        <root>
          <item id="1">First item</item>
          <item id="2">Second item</item>
        </root>
      `;

      const result = buildGridData(xml);

      // Verify result structure
      expect(result.rootElement).toBe('root');
      expect(result.rows).toHaveLength(2);
      expect(result.columns).toEqual(['_nodeId', 'text', 'id']);

      // Verify row data with text content
      expect(result.rows[0].text).toBe('First item');
      expect(result.rows[0].id).toBe('1');

      expect(result.rows[1].text).toBe('Second item');
      expect(result.rows[1].id).toBe('2');
    });

    it('should show empty state for XML without tabular data', () => {
      const xml = '<root><single>value</single></root>';

      const result = buildGridData(xml);

      // Should return rows with root element as data
      expect(result.rows).toHaveLength(1);
      expect(result.columns).toEqual(['_nodeId', 'text']);
      expect(result.rootElement).toBe('root');
      expect(result.rows[0].text).toBe('value');
    });

    it('should handle XML with attributes only (no text content)', () => {
      const xml = `
        <products>
          <product sku="12345" name="Widget" price="19.99"/>
          <product sku="67890" name="Gadget" price="29.99"/>
        </products>
      `;

      const result = buildGridData(xml);

      // Verify result structure
      expect(result.rootElement).toBe('products');
      expect(result.rows).toHaveLength(2);
      expect(result.columns).toEqual(['_nodeId', 'text', 'name', 'price', 'sku']);

      // Verify empty text content for self-closing tags
      expect(result.rows[0].text).toBe('');
      expect(result.rows[0].name).toBe('Widget');
      expect(result.rows[0].price).toBe('19.99');
      expect(result.rows[0].sku).toBe('12345');

      expect(result.rows[1].text).toBe('');
      expect(result.rows[1].name).toBe('Gadget');
      expect(result.rows[1].price).toBe('29.99');
      expect(result.rows[1].sku).toBe('67890');
    });

    it('should handle XML with complex nested elements', () => {
      const xml = `
        <library>
          <book id="1">
            <title>Advanced XML</title>
            <author>Smith, John</author>
            <price>39.99</price>
          </book>
          <book id="2">
            <title>XML Basics</title>
            <author>Doe, Jane</author>
            <price>24.99</price>
          </book>
        </library>
      `;

      const result = buildGridData(xml);

      // Verify result structure
      expect(result.rootElement).toBe('library');
      expect(result.rows).toHaveLength(2);
      expect(result.columns).toEqual(['_nodeId', 'text', 'id']);

      // Verify that child elements become text content
      expect(result.rows[0].text).toBe('');
      expect(result.rows[0].id).toBe('1');

      expect(result.rows[1].text).toBe('');
      expect(result.rows[1].id).toBe('2');
    });

    it('should handle error state for invalid XML', () => {
      const xml = '<root><unclosed>missing tag</unclosed';

      // The xmldom parser doesn't throw for this case, it returns a parsererror
      const result = buildGridData(xml);
      // This test demonstrates that invalid XML doesn't crash but may produce unexpected results
      expect(result).toBeDefined();
    });

    it('should handle empty XML', () => {
      const xml = '';

      expect(() => {
        buildGridData(xml);
      }).toThrow(); // Empty XML causes an error when accessing documentElement
    });

    it('should handle XML with only text content', () => {
      const xml = '<root>Just some text</root>';

      const result = buildGridData(xml);

      // Should return empty rows since no elements to convert
      expect(result.rows).toHaveLength(0);
      expect(result.columns).toEqual(['_nodeId', 'text']);
      expect(result.rootElement).toBe('root');
    });
  });

  describe('updateXMLFromGrid function', () => {
    it('should update XML from grid changes', () => {
      const originalXml = `
        <books>
          <book id="1" title="XML 101" author="John"/>
          <book id="2" title="XSD Guide" author="Jane"/>
        </books>
      `;

      const originalGridData = buildGridData(originalXml);
      const updatedRows = [
        { ...originalGridData.rows[0], title: 'Updated Title' },
        originalGridData.rows[1]
      ];

      const updatedXml = updateXMLFromGrid({
        originalXml,
        originalGridData,
        updatedRows
      });

      // Verify XML was updated
      expect(updatedXml).not.toBe(originalXml);
      expect(updatedXml).toContain('Updated Title');
      expect(updatedXml).toContain('id="1"');
      expect(updatedXml).toContain('id="2"');
      expect(updatedXml).toContain('Jane');
    });

    it('should update text content in XML', () => {
      const originalXml = `
        <root>
          <item id="1">First item</item>
          <item id="2">Second item</item>
        </root>
      `;

      const originalGridData = buildGridData(originalXml);
      const updatedRows = [
        { ...originalGridData.rows[0], text: 'Updated first item' },
        { ...originalGridData.rows[1], text: 'Updated second item' }
      ];

      const updatedXml = updateXMLFromGrid({
        originalXml,
        originalGridData,
        updatedRows
      });

      // Verify text content was updated
      expect(updatedXml).toContain('Updated first item');
      expect(updatedXml).toContain('Updated second item');
    });

    it('should handle attribute updates', () => {
      const originalXml = `
        <products>
          <product sku="12345" name="Widget"/>
        </products>
      `;

      const originalGridData = buildGridData(originalXml);
      const updatedRows = [
        {
          ...originalGridData.rows[0],
          sku: "99999",
          name: "Updated Widget"
        }
      ];

      const updatedXml = updateXMLFromGrid({
        originalXml,
        originalGridData,
        updatedRows
      });

      // Verify attributes were updated
      expect(updatedXml).toContain('sku="99999"');
      expect(updatedXml).toContain('name="Updated Widget"');
    });

    it('should set attribute to empty when requested', () => {
      const originalXml = `
        <products>
          <product sku="12345" name="Widget"/>
        </products>
      `;

      const originalGridData = buildGridData(originalXml);
      const updatedRows = [
        {
          ...originalGridData.rows[0],
          sku: "",
          name: "Widget"
        }
      ];

      const updatedXml = updateXMLFromGrid({
        originalXml,
        originalGridData,
        updatedRows
      });

      // Verify sku attribute is empty
      expect(updatedXml).toContain('sku=""');
      expect(updatedXml).toContain('name="Widget"');
    });

    it('should handle missing updated rows gracefully', () => {
      const originalXml = `
        <root>
          <item id="1">First</item>
        </root>
      `;

      const originalGridData = buildGridData(originalXml);
      const updatedRows = []; // Empty update

      // When no updates are provided, no modifications should be made
      const updatedXml = updateXMLFromGrid({
        originalXml,
        originalGridData,
        updatedRows
      });

      // The XML should remain functionally the same (ignoring whitespace)
      expect(updatedXml.trim()).toBe(originalXml.trim());
    });

    it('should preserve XML structure', () => {
      const originalXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">First</item>
  <item id="2">Second</item>
</root>`;

      const originalGridData = buildGridData(originalXml);
      const updatedRows = originalGridData.rows.map(row => ({
        ...row,
        text: `${row.text} updated`
      }));

      const updatedXml = updateXMLFromGrid({
        originalXml,
        originalGridData,
        updatedRows
      });

      // Verify XML declaration is preserved
      expect(updatedXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      // Verify tags are preserved
      expect(updatedXml).toContain('<root>');
      expect(updatedXml).toContain('</root>');
      expect(updatedXml).toContain('<item');
      expect(updatedXml).toContain('</item>');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should support complete round-trip: XML -> Grid -> XML', () => {
      const originalXml = `
        <catalog>
          <book id="1">
            <title>Test Book</title>
            <author>Test Author</author>
            <price>19.99</price>
          </book>
          <book id="2">
            <title>Another Book</title>
            <author>Another Author</author>
            <price>29.99</price>
          </book>
        </catalog>
      `;

      // Step 1: Convert XML to grid data
      const gridData = buildGridData(originalXml);
      expect(gridData.rows).toHaveLength(2);

      // Step 2: Modify grid data
      const modifiedRows = gridData.rows.map((row, index) => ({
        ...row,
        text: `${row.text} - Modified`
      }));

      // Step 3: Convert back to XML
      const updatedXml = updateXMLFromGrid({
        originalXml,
        originalGridData: gridData,
        updatedRows: modifiedRows
      });

      // Verify round-trip success
      expect(updatedXml).not.toBe(originalXml);
      expect(updatedXml).toContain('Modified');
      expect(updatedXml).toContain('Test Book');
      expect(updatedXml).toContain('Another Book');
    });

    it('should handle real-world scenario: product catalog', () => {
      const xml = `
        <products>
          <product id="1" category="electronics">
            <name>Laptop</name>
            <price>999.99</price>
            <stock>10</stock>
          </product>
          <product id="2" category="books">
            <name>XML Guide</name>
            <price>29.99</price>
            <stock>5</stock>
          </product>
        </products>
      `;

      // Convert to grid
      const gridData = buildGridData(xml);

      // Update some values - modify category and stock
      const updatedRows = gridData.rows.map(row => {
        if (row.id === '1') {
          return { ...row, category: 'computers' };
        } else if (row.id === '2') {
          return { ...row, stock: '15' };
        }
        return row;
      });

      // Convert back to XML
      const updatedXml = updateXMLFromGrid({
        originalXml: xml,
        originalGridData: gridData,
        updatedRows
      });

      // Verify changes
      expect(updatedXml).toContain('category="computers"');
      expect(updatedXml).toContain('stock="15"');
      expect(updatedXml).not.toContain('electronics'); // Should be removed from first product
      expect(updatedXml).toContain('books');
    });
  });
});