/**
 * MVP Integration Tests for Phase 1 and Phase 2
 *
 * These tests verify the end-to-end functionality of the XML editor MVP.
 * They cover all scenarios from the implementation plan verification checklist.
 */

import { describe, it, expect } from 'vitest';
import { generateXSDFromXML, generateXMLFromXSD, validateXMLAgainstXSD, parseXSD } from '@/services/xsd';
import { xmlParser } from '@/core/parserEngine';
import { xmlValidator } from '@/core/validatorEngine/XMLValidator';
import { treeBuilder } from '@/services/xml';

describe('MVP Integration Tests', () => {
  describe('Phase 1: Basic XML Editor', () => {
    describe('1. Opening XML files', () => {
      it('should parse simple XML file correctly', () => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <child>content</child>
</root>`;

        const result = xmlParser.parse(xmlContent);
        expect(result).not.toBeNull();
        expect(result?.querySelector('root')).not.toBeNull();
      });

      it('should handle XML with attributes', () => {
        const xmlContent = `<root id="1" name="test">
  <item value="123"/>
</root>`;

        const result = xmlParser.parse(xmlContent);
        expect(result).not.toBeNull();
        expect(result?.querySelector('root')?.getAttribute('id')).toBe('1');
      });
    });

    describe('2. Editing XML with syntax highlighting', () => {
      it('should validate XML syntax in real-time', () => {
        const validXml = '<root>content</root>';
        const errors = xmlValidator.validateRealTime(validXml);
        expect(errors).toHaveLength(0);
      });

      it('should detect XML syntax errors', () => {
        const invalidXml = '<root><unclosed>';
        const errors = xmlValidator.validateRealTime(invalidXml);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].severity).toBe('error');
      });

      it('should clear errors when XML is fixed', () => {
        // First, invalid XML
        const invalidXml = '<root><unclosed>';
        const errors1 = xmlValidator.validateRealTime(invalidXml);
        expect(errors1.length).toBeGreaterThan(0);

        // Cancel pending validation before testing valid XML
        xmlValidator.cancelPendingValidation();

        // Then, valid XML
        const validXml = '<root>content</root>';
        const errors2 = xmlValidator.validateRealTime(validXml);
        expect(errors2).toHaveLength(0);
      });
    });

    describe('3. XML validation error display', () => {
      it('should show error for unclosed tag', () => {
        const invalidXml = '<root><child></root>';
        const result = xmlValidator.validateXML(invalidXml);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should show error for mismatched tags', () => {
        const invalidXml = '<root><child></wrongtag></root>';
        const result = xmlValidator.validateXML(invalidXml);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should generate helpful error messages', () => {
        const invalidXml = '<root><unclosed>';
        const errors = xmlValidator.validateRealTime(invalidXml);
        const formattedError = xmlValidator.formatErrorMessage(errors[0]);

        expect(formattedError).toContain('Line');
        expect(formattedError).toContain('Column');
      });
    });

    describe('4. Tree view functionality', () => {
      it('should build tree from simple XML', () => {
        const xmlContent = '<root><child>text</child></root>';
        const tree = treeBuilder.buildFromXML(xmlContent);

        expect(tree).not.toBeNull();
        expect(tree!.name).toBe('root');
        expect(tree!.children).toHaveLength(1);
        expect(tree!.children[0].name).toBe('child');
      });

      it('should handle nested elements', () => {
        const xmlContent = '<root><level1><level2>deep</level2></level1></root>';
        const tree = treeBuilder.buildFromXML(xmlContent);

        expect(tree).not.toBeNull();
        expect(tree!.children[0].children[0].name).toBe('level2');
      });

      it('should handle attributes in tree', () => {
        const xmlContent = '<root id="1" name="test">content</root>';
        const tree = treeBuilder.buildFromXML(xmlContent, { includeAttributes: true });

        expect(tree?.attributes).toBeDefined();
        expect(Object.keys(tree!.attributes).length).toBeGreaterThan(0);
        expect(tree?.attributes.id).toBe('1');
      });

      it('should handle mixed content', () => {
        const xmlContent = '<root>text<child>more</child>tail</root>';
        const tree = treeBuilder.buildFromXML(xmlContent);

        expect(tree).not.toBeNull();
        // Mixed content might be in value or children depending on parser
        expect(tree?.value || tree?.children.length).toBeTruthy();
      });
    });
  });

  describe('Phase 2: XSD Support', () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
  <address>
    <street>123 Main St</street>
    <city>Springfield</city>
  </address>
</person>`;

    const sampleXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:integer"/>
        <xs:element name="address">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="street" type="xs:string"/>
              <xs:element name="city" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    describe('5. XSD file support', () => {
      it('should parse XSD schema', () => {
        const schema = parseXSD(sampleXSD);

        expect(schema).not.toBeNull();
        expect(schema?.elements).toHaveLength(1);
        expect(schema?.elements[0].name).toBe('person');
      });

      it('should extract complex types from XSD', () => {
        const schema = parseXSD(sampleXSD);

        expect(schema?.complexTypes).toBeDefined();
        // The inline complexType should be parsed
        expect(schema?.elements[0].complexType).toBeDefined();
      });
    });

    describe('6. Generate XSD from XML', () => {
      it('should generate valid XSD from XML', () => {
        const generatedXSD = generateXSDFromXML(sampleXML);

        expect(generatedXSD).not.toBeNull();
        expect(generatedXSD).toContain('<?xml version="1.0"');
        expect(generatedXSD).toContain('<xs:schema');
        expect(generatedXSD).toContain('<xs:element name="person"');
      });

      it('should infer correct types from XML content', () => {
        const xml = `<root>
          <string>text</string>
          <number>42</number>
          <decimal>3.14</decimal>
          <bool>true</bool>
        </root>`;

        const xsd = generateXSDFromXML(xml);
        expect(xsd).toContain('xs:string');
        expect(xsd).toContain('xs:integer');
        expect(xsd).toContain('xs:decimal');
        expect(xsd).toContain('xs:boolean');
      });

      it('should handle nested structures', () => {
        const xsd = generateXSDFromXML(sampleXML);
        expect(xsd).toContain('name="address"');
        expect(xsd).toContain('name="street"');
        expect(xsd).toContain('name="city"');
      });

      it('should detect attributes in XML', () => {
        const xml = '<root id="123" name="test">content</root>';
        const xsd = generateXSDFromXML(xml);

        expect(xsd).toContain('<xs:attribute');
      });
    });

    describe('7. Generate XML from XSD', () => {
      it('should generate valid XML instance from XSD', () => {
        const generatedXML = generateXMLFromXSD(sampleXSD);

        expect(generatedXML).not.toBeNull();
        expect(generatedXML).toContain('<?xml version="1.0"');
        expect(generatedXML).toContain('<person>');
        expect(generatedXML).toContain('</person>');
      });

      it('should include all required elements', () => {
        const xml = generateXMLFromXSD(sampleXSD);
        expect(xml).toContain('<name>');
        expect(xml).toContain('<age>');
        expect(xml).toContain('<address>');
      });

      it('should generate sample values for different types', () => {
        const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="data">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="str" type="xs:string"/>
        <xs:element name="num" type="xs:integer"/>
        <xs:element name="flag" type="xs:boolean"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

        const xml = generateXMLFromXSD(xsd);
        expect(xml).toContain('sample_str');
        expect(xml).toContain('0');
        expect(xml).toContain('true');
      });

      it('should respect minOccurs constraints', () => {
        const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="item" type="xs:string" minOccurs="2"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

        const xml = generateXMLFromXSD(xsd);
        const matches = xml?.match(/<item>/g);
        expect(matches?.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('8. Validate XML against XSD', () => {
      it('should validate correct XML against XSD', () => {
        const errors = validateXMLAgainstXSD(sampleXML, sampleXSD);
        expect(errors).toHaveLength(0);
      });

      it('should detect missing required elements', () => {
        const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <!-- missing age -->
</person>`;

        const errors = validateXMLAgainstXSD(invalidXML, sampleXSD);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.message.includes('age'))).toBe(true);
      });

      it('should detect unexpected elements', () => {
        const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John</name>
  <unexpected>value</unexpected>
</person>`;

        const errors = validateXMLAgainstXSD(invalidXML, sampleXSD);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.message.includes('unexpected'))).toBe(true);
      });

      it('should validate element types and constraints', () => {
        const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="data">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="value">
          <xs:simpleType>
            <xs:restriction base="xs:integer">
              <xs:minInclusive value="0"/>
              <xs:maxInclusive value="100"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

        const validXML = '<data><value>50</value></data>';
        const invalidXML = '<data><value>150</value></data>';

        expect(validateXMLAgainstXSD(validXML, xsd)).toHaveLength(0);
        expect(validateXMLAgainstXSD(invalidXML, xsd).length).toBeGreaterThan(0);
      });

      it('should validate required attributes', () => {
        const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="item">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

        const invalidXML = '<item/>';
        const errors = validateXMLAgainstXSD(invalidXML, xsd);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.message.includes('id') && e.message.includes('required'))).toBe(true);
      });

      it('should validate enumeration constraints', () => {
        const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="color">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:enumeration value="red"/>
        <xs:enumeration value="green"/>
        <xs:enumeration value="blue"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

        const validXML = '<color>red</color>';
        const invalidXML = '<color>yellow</color>';

        expect(validateXMLAgainstXSD(validXML, xsd)).toHaveLength(0);
        expect(validateXMLAgainstXSD(invalidXML, xsd).length).toBeGreaterThan(0);
      });
    });
  });

  describe('End-to-End Workflows', () => {
    it('should complete round-trip: XML -> XSD -> XML', () => {
      const originalXML = `<catalog>
  <book id="1">
    <title>Test Book</title>
    <author>Test Author</author>
    <price>19.99</price>
  </book>
</catalog>`;

      // Generate XSD from XML
      const generatedXSD = generateXSDFromXML(originalXML);
      expect(generatedXSD).not.toBeNull();

      // Generate XML from XSD
      const generatedXML = generateXMLFromXSD(generatedXSD!);
      expect(generatedXML).not.toBeNull();

      // Verify generated XML is valid
      const parsed = xmlParser.parse(generatedXML!);
      expect(parsed).not.toBeNull();
    });

    it('should support schema-driven validation workflow', () => {
      // Start with XML
      const xml = `<person>
        <name>John Doe</name>
        <age>30</age>
      </person>`;

      // Generate XSD
      const xsd = generateXSDFromXML(xml);
      expect(xsd).not.toBeNull();

      // Validate original XML against generated XSD
      const validationErrors = validateXMLAgainstXSD(xml, xsd!);
      expect(validationErrors).toHaveLength(0);

      // Modify XML to introduce error
      const invalidXml = `<person>
        <name>John Doe</name>
      </person>`;

      // Validate and detect error
      const errors = validateXMLAgainstXSD(invalidXml, xsd!);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
