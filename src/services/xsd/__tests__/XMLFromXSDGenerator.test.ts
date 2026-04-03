/**
 * XML From XSD Generator Tests
 *
 * Tests for generating sample XML instances from XSD schemas.
 */

import { describe, it, expect } from 'vitest';
import { generateXMLFromXSD } from '../XMLFromXSDGenerator';

describe('XMLFromXSDGenerator', () => {
  describe('generateXMLFromXSD', () => {
    it('should generate XML from simple XSD element', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).not.toBeNull();
      expect(xml).toContain('<root>');
      expect(xml).toContain('</root>');
    });

    it('should generate string sample values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="name" type="xs:string"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('sample_name');
    });

    it('should generate integer sample values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="age" type="xs:integer"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('0');
    });

    it('should generate decimal sample values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="price" type="xs:decimal"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('0.0');
    });

    it('should generate boolean sample values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="active" type="xs:boolean"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('true');
    });

    it('should generate date sample values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="birthdate" type="xs:date"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('2024-01-01');
    });

    it('should generate dateTime sample values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="timestamp" type="xs:dateTime"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('2024-01-01T00:00:00');
    });

    it('should generate time sample values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="startTime" type="xs:time"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('00:00:00');
    });

    it('should handle complex types with child elements', () => {
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

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('<person>');
      expect(xml).toContain('<name>');
      expect(xml).toContain('<age>0</age>');
      expect(xml).toContain('</person>');
    });

    it('should include required attributes', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('id=');
    });

    it('should respect minOccurs (generate minimum required)', () => {
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
      expect(xml).not.toBeNull();
      // Should generate 2 items
      const matches = xml!.match(/<item>/g);
      expect(matches?.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle optional elements (minOccurs="0")', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="required" type="xs:string"/>
        <xs:element name="optional" type="xs:string" minOccurs="0"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('<required>');
      // Optional may or may not be included
    });

    it('should use enumeration value (any of them)', () => {
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

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toBeTruthy();
      const match = xml!.match(/<color>(.+)<\/color>/);
      expect(match).toBeTruthy();
      expect(['red', 'green', 'blue']).toContain(match![1]);
    });

    it('should generate deterministic values with seed', () => {
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

      const xml1 = generateXMLFromXSD(xsd, { seed: 42 });
      const xml2 = generateXMLFromXSD(xsd, { seed: 42 });

      expect(xml1).toBe(xml2);
    });

    it('should handle named complex types', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="AddressType">
    <xs:sequence>
      <xs:element name="street" type="xs:string"/>
      <xs:element name="city" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>

  <xs:element name="address" type="AddressType"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('<address>');
      expect(xml).toContain('<street>');
      expect(xml).toContain('<city>');
    });

    it('should handle named simple types', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="USState">
    <xs:restriction base="xs:string">
      <xs:enumeration value="AK"/>
      <xs:enumeration value="AL"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:element name="state" type="USState"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      const match = xml!.match(/<state>(.+)<\/state>/);
      expect(match).toBeTruthy();
      expect(['AK', 'AL']).toContain(match![1]);
    });

    it('should handle simple content with attributes', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="price">
    <xs:complexType>
      <xs:simpleContent>
        <xs:extension base="xs:decimal">
          <xs:attribute name="currency" type="xs:string" use="required"/>
        </xs:extension>
      </xs:simpleContent>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('<price');
      expect(xml).toContain('currency=');
      expect(xml).toContain('0.0');
      expect(xml).toContain('</price>');
    });

    it('should generate self-closing tags for empty complex types', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="empty">
    <xs:complexType>
      <xs:attribute name="id" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('<empty');
    });

    it('should handle deeply nested structures', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="level1">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="level2" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('<root>');
      expect(xml).toContain('<level1>');
      expect(xml).toContain('<level2>');
    });

    it('should return null for invalid XSD', () => {
      const invalidXsd = `not valid xml`;
      const xml = generateXMLFromXSD(invalidXsd);
      expect(xml).toBeNull();
    });

    it('should return null for empty XSD', () => {
      expect(generateXMLFromXSD('')).toBeNull();
      expect(generateXMLFromXSD('   ')).toBeNull();
    });

    it('should generate XML declaration', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('should use the first root element when multiple are defined', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="first" type="xs:string"/>
  <xs:element name="second" type="xs:string"/>
</xs:schema>`;

      const xml = generateXMLFromXSD(xsd);
      expect(xml).not.toBeNull();
      expect(xml!).toContain('<first>');
      expect(xml).not.toContain('<second>');
    });
  });
});
