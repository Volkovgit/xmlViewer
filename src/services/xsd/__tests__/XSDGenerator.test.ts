/**
 * XSD Generator Tests
 *
 * Tests for generating XSD schemas from XML documents.
 */

import { describe, it, expect } from 'vitest';
import { generateXSDFromXML } from '../XSDGenerator';

describe('XSDGenerator', () => {
  describe('generateXSDFromXML', () => {
    it('should generate XSD from simple XML', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>Hello World</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).not.toBeNull();
      expect(xsd).toContain('<xs:element name="root"');
      expect(xsd).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xsd).toContain('<xs:schema');
    });

    it('should infer string type for text content', () => {
      const xml = `<root>text content</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('type="xs:string"');
    });

    it('should infer integer type for numeric values', () => {
      const xml = `<root>42</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('type="xs:integer"');
    });

    it('should infer decimal type for floating point values', () => {
      const xml = `<root>3.14</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('type="xs:decimal"');
    });

    it('should infer boolean type for boolean values', () => {
      const xmlTrue = `<root>true</root>`;
      const xmlFalse = `<root>false</root>`;

      const xsdTrue = generateXSDFromXML(xmlTrue);
      const xsdFalse = generateXSDFromXML(xmlFalse);

      expect(xsdTrue).toContain('type="xs:boolean"');
      expect(xsdFalse).toContain('type="xs:boolean"');
    });

    it('should infer date type for dates', () => {
      const xml = `<root>2024-01-15</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('type="xs:date"');
    });

    it('should infer dateTime type for datetime values', () => {
      const xml = `<root>2024-01-15T10:30:00</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('type="xs:dateTime"');
    });

    it('should infer time type for time values', () => {
      const xml = `<root>10:30:00</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('type="xs:time"');
    });

    it('should handle nested elements', () => {
      const xml = `<root>
  <parent>
    <child>value</child>
  </parent>
</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('name="root"');
      expect(xsd).toContain('name="parent"');
      expect(xsd).toContain('name="child"');
      expect(xsd).toContain('<xs:sequence>');
    });

    it('should detect and include attributes', () => {
      const xml = `<root id="123" name="test">content</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('<xs:attribute name="id"');
      expect(xsd).toContain('<xs:attribute name="name"');
    });

    it('should handle repeated elements (maxOccurs)', () => {
      const xml = `<root>
  <item>one</item>
  <item>two</item>
  <item>three</item>
</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('maxOccurs="unbounded"');
    });

    it('should handle optional elements (minOccurs)', () => {
      const xml = `<root>
  <required>always</required>
</root>`;

      const xsd = generateXSDFromXML(xml);
      // The element should be present
      expect(xsd).toContain('name="required"');
    });

    it('should generate complex type for elements with children', () => {
      const xml = `<person>
  <name>John</name>
  <age>30</age>
</person>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('<xs:complexType>');
      expect(xsd).toContain('<xs:sequence>');
    });

    it('should generate simple type for leaf elements', () => {
      const xml = `<name>John Doe</name>`;

      const xsd = generateXSDFromXML(xml);
      // Should be a simple element with type attribute
      expect(xsd).toMatch(/<xs:element\s+name="name"\s+type="[^"]+"\s*\/>/);
    });

    it('should handle mixed content (text + attributes)', () => {
      const xml = `<person id="123">John Doe</person>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('name="person"');
      expect(xsd).toContain('<xs:complexType>');
      expect(xsd).toContain('<xs:attribute name="id"');
    });

    it('should handle empty XML', () => {
      expect(generateXSDFromXML('')).toBeNull();
      expect(generateXSDFromXML('   ')).toBeNull();
    });

    it('should handle malformed XML', () => {
      const invalidXml = `<root><unclosed>`;
      const xsd = generateXSDFromXML(invalidXml);
      expect(xsd).toBeNull();
    });

    it('should generate valid XSD structure', () => {
      const xml = `<root>
  <child id="1">value</child>
</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toMatch(/<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(xsd).toMatch(/<xs:schema[^>]*>/);
      expect(xsd).toMatch(/<\/xs:schema>/);
    });

    it('should handle multiple siblings at same level', () => {
      const xml = `<root>
  <first>1</first>
  <second>2</second>
  <third>3</third>
</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('name="first"');
      expect(xsd).toContain('name="second"');
      expect(xsd).toContain('name="third"');
    });

    it('should handle deeply nested structures', () => {
      const xml = `<root>
  <level1>
    <level2>
      <level3>deep</level3>
    </level2>
  </level1>
</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('name="root"');
      expect(xsd).toContain('name="level1"');
      expect(xsd).toContain('name="level2"');
      expect(xsd).toContain('name="level3"');
    });

    it('should ignore xmlns attributes', () => {
      const xml = `<root xmlns="http://example.com" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <child>value</child>
</root>`;

      const xsd = generateXSDFromXML(xml);
      // xmlns attributes should not appear in generated XSD attributes
      expect(xsd).not.toMatch(/<xs:attribute name="xmlns"/);
    });

    it('should preserve XML declaration in output', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>content</root>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('should handle elements with only attributes (empty content)', () => {
      const xml = `<root id="1" name="test"/>`;

      const xsd = generateXSDFromXML(xml);
      expect(xsd).toContain('name="root"');
      expect(xsd).toContain('<xs:attribute');
    });
  });
});
