/**
 * XSD Parser Tests
 *
 * Tests for XSD schema parsing functionality.
 */

import { describe, it, expect } from 'vitest';
import { parseXSD } from '../XSDParser';

describe('XSDParser', () => {
  describe('parseXSD', () => {
    it('should parse a simple XSD schema with basic elements', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();
      expect(schema?.elements).toHaveLength(1);
      expect(schema?.elements[0].name).toBe('root');
      expect(schema?.elements[0].type).toBe('xs:string');
    });

    it('should parse complex types with child elements', () => {
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

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();
      expect(schema?.elements).toHaveLength(1);

      const person = schema!.elements[0];
      expect(person.name).toBe('person');
      expect(person.complexType).toBeDefined();
      expect(person.complexType!.elements).toHaveLength(2);
      expect(person.complexType!.elements[0].name).toBe('name');
      expect(person.complexType!.elements[1].name).toBe('age');
    });

    it('should parse element attributes', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:string" use="required"/>
      <xs:attribute name="status" type="xs:string" use="optional"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const person = schema!.elements[0];
      expect(person.complexType!.attributes).toHaveLength(2);
      expect(person.complexType!.attributes[0].name).toBe('id');
      expect(person.complexType!.attributes[0].use).toBe('required');
      expect(person.complexType!.attributes[1].name).toBe('status');
      expect(person.complexType!.attributes[1].use).toBe('optional');
    });

    it('should parse element occurrence constraints (minOccurs, maxOccurs)', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="required" type="xs:string"/>
        <xs:element name="optional" type="xs:string" minOccurs="0"/>
        <xs:element name="multiple" type="xs:string" maxOccurs="unbounded"/>
        <xs:element name="range" type="xs:string" minOccurs="2" maxOccurs="5"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const root = schema!.elements[0];
      const children = root.complexType!.elements;

      expect(children[0].occurrence.minOccurs).toBe(1);
      expect(children[0].occurrence.maxOccurs).toBe(1);

      expect(children[1].occurrence.minOccurs).toBe(0);
      expect(children[1].occurrence.maxOccurs).toBe(1);

      expect(children[2].occurrence.minOccurs).toBe(1);
      expect(children[2].occurrence.maxOccurs).toBe('unbounded');

      expect(children[3].occurrence.minOccurs).toBe(2);
      expect(children[3].occurrence.maxOccurs).toBe(5);
    });

    it('should parse simple types with restrictions', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="USState">
    <xs:restriction base="xs:string">
      <xs:enumeration value="AK"/>
      <xs:enumeration value="AL"/>
      <xs:enumeration value="AR"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();
      expect(schema?.simpleTypes).toHaveLength(1);

      const stateType = schema!.simpleTypes[0];
      expect(stateType.name).toBe('USState');
      expect(stateType.restriction).toBeDefined();
      expect(stateType.restriction!.base).toBe('xs:string');
      expect(stateType.restriction!.enumerations).toEqual(['AK', 'AL', 'AR']);
    });

    it('should parse named complex types', () => {
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

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();
      expect(schema?.complexTypes).toHaveLength(1);

      const addressType = schema!.complexTypes[0];
      expect(addressType.name).toBe('AddressType');
      expect(addressType.elements).toHaveLength(2);

      const addressElement = schema!.elements[0];
      expect(addressElement.name).toBe('address');
      expect(addressElement.type).toBe('AddressType');
    });

    it('should parse pattern restrictions', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="ZipCode">
    <xs:restriction base="xs:string">
      <xs:pattern value="[0-9]{5}(-[0-9]{4})?"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const zipType = schema!.simpleTypes[0];
      expect(zipType.restriction!.pattern).toBe('[0-9]{5}(-[0-9]{4})?');
    });

    it('should parse length restrictions', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="Password">
    <xs:restriction base="xs:string">
      <xs:minLength value="8"/>
      <xs:maxLength value="20"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const passwordType = schema!.simpleTypes[0];
      expect(passwordType.restriction!.minLength).toBe(8);
      expect(passwordType.restriction!.maxLength).toBe(20);
    });

    it('should parse numeric range restrictions', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="Age">
    <xs:restriction base="xs:integer">
      <xs:minInclusive value="0"/>
      <xs:maxInclusive value="120"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const ageType = schema!.simpleTypes[0];
      expect(ageType.restriction!.minInclusive).toBe(0);
      expect(ageType.restriction!.maxInclusive).toBe(120);
    });

    it('should parse target namespace', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://example.com/schema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();
      expect(schema?.targetNamespace).toBe('http://example.com/schema');
    });

    it('should parse choice compositor', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:choice>
        <xs:element name="optionA" type="xs:string"/>
        <xs:element name="optionB" type="xs:string"/>
      </xs:choice>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const root = schema!.elements[0];
      // Choice should still parse children
      expect(root.complexType!.elements.length).toBeGreaterThan(0);
    });

    it('should parse all compositor', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root">
    <xs:complexType>
      <xs:all>
        <xs:element name="field1" type="xs:string"/>
        <xs:element name="field2" type="xs:string"/>
      </xs:all>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const root = schema!.elements[0];
      // All should still parse children
      expect(root.complexType!.elements.length).toBeGreaterThan(0);
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

      const schema = parseXSD(xsd);
      expect(schema).not.toBeNull();

      const price = schema!.elements[0];
      expect(price.complexType!.simpleContentBase).toBe('xs:decimal');
      expect(price.complexType!.attributes).toHaveLength(1);
      expect(price.complexType!.attributes[0].name).toBe('currency');
    });

    it('should return null for invalid XML', () => {
      const invalidXsd = `this is not valid xml at all`;
      const schema = parseXSD(invalidXsd);
      expect(schema).toBeNull();
    });

    it('should return null for empty input', () => {
      expect(parseXSD('')).toBeNull();
      expect(parseXSD('   ')).toBeNull();
    });

    it('should handle non-schema root element', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:notSchema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:notSchema>`;

      const schema = parseXSD(xsd);
      expect(schema).toBeNull();
    });

    it('should store raw XSD content', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;

      const schema = parseXSD(xsd);
      expect(schema?.raw).toBe(xsd);
    });
  });
});
