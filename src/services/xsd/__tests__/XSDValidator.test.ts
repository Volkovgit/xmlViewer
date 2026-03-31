/**
 * XSD Validator Tests
 *
 * Tests for XML validation against XSD schema.
 */

import { describe, it, expect } from 'vitest';
import { validateXMLAgainstXSD, validateXMLAgainstSchema } from '../XSDValidator';
import { parseXSD } from '../XSDParser';

describe('XSDValidator', () => {
  describe('validateXMLAgainstXSD', () => {
    it('should validate valid XML against a simple XSD schema', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>Hello World</root>`;

      const errors = validateXMLAgainstXSD(xml, xsd);
      expect(errors).toHaveLength(0);
    });

    it('should detect mismatched root element', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="correctRoot" type="xs:string"/>
</xs:schema>`;

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<wrongRoot>Hello</wrongRoot>`;

      const errors = validateXMLAgainstXSD(xml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('wrongRoot');
      expect(errors[0].severity).toBe('error');
    });

    it('should validate complex types with child elements', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
  <age>30</age>
</person>`;

      const errors = validateXMLAgainstXSD(validXml, xsd);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required child elements', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John Doe</name>
</person>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('age'))).toBe(true);
    });

    it('should detect unexpected child elements', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John</name>
  <unexpected>value</unexpected>
</person>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('unexpected'))).toBe(true);
    });

    it('should validate minOccurs constraints', () => {
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

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>one</item>
</root>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('at least 2'))).toBe(true);
    });

    it('should validate maxOccurs constraints', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="item" type="xs:string" maxOccurs="2"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item>one</item>
  <item>two</item>
  <item>three</item>
</root>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('at most 2'))).toBe(true);
    });

    it('should validate required attributes', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<person/>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('id') && e.message.includes('required'))).toBe(true);
    });

    it('should validate prohibited attributes', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string" use="prohibited"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<person id="123"/>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('id') && e.message.includes('Prohibited'))).toBe(true);
    });

    it('should warn about unexpected attributes', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<person id="123" unexpected="value"/>`;

      const errors = validateXMLAgainstXSD(xml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('unexpected') && e.severity === 'warning')).toBe(true);
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

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<color>yellow</color>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('yellow') && e.message.includes('allowed values'))).toBe(true);
    });

    it('should validate pattern constraints', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="zip">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:pattern value="[0-9]{5}"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<zip>ABCDE</zip>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('pattern'))).toBe(true);
    });

    it('should validate length constraints', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="password">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:minLength value="8"/>
        <xs:maxLength value="20"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

      const tooShortXml = `<?xml version="1.0" encoding="UTF-8"?>
<password>abc</password>`;

      const errors = validateXMLAgainstXSD(tooShortXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('too short'))).toBe(true);
    });

    it('should validate numeric range constraints', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="age">
    <xs:simpleType>
      <xs:restriction base="xs:integer">
        <xs:minInclusive value="0"/>
        <xs:maxInclusive value="120"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<age>150</age>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('maximum'))).toBe(true);
    });

    it('should handle nested complex types', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
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

      const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<person>
  <name>John</name>
  <address>
    <street>123 Main St</street>
    <city>Springfield</city>
  </address>
</person>`;

      const errors = validateXMLAgainstXSD(validXml, xsd);
      expect(errors).toHaveLength(0);
    });

    it('should return error for malformed XSD', () => {
      const invalidXsd = `not valid xml`;
      const xml = `<?xml version="1.0"?><root/>`;

      const errors = validateXMLAgainstXSD(xml, invalidXsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Failed to parse XSD');
    });

    it('should return error for malformed XML', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const invalidXml = `<root><unclosed>`;

      const errors = validateXMLAgainstXSD(invalidXml, xsd);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('not well-formed');
    });
  });

  describe('validateXMLAgainstSchema', () => {
    it('should validate against pre-parsed schema', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>Hello</root>`;

      const errors = validateXMLAgainstSchema(xml, schema!);
      expect(errors).toHaveLength(0);
    });

    it('should validate multiple root elements', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="rootA" type="xs:string"/>
  <xs:element name="rootB" type="xs:string"/>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const xmlA = `<?xml version="1.0" encoding="UTF-8"?><rootA>A</rootA>`;
      const xmlB = `<?xml version="1.0" encoding="UTF-8"?><rootB>B</rootB>`;

      expect(validateXMLAgainstSchema(xmlA, schema!)).toHaveLength(0);
      expect(validateXMLAgainstSchema(xmlB, schema!)).toHaveLength(0);
    });
  });
});
