import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { XSDVisualizer } from '../XSDVisualizer';

const sampleXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="PurchaseOrder" type="PurchaseOrderType"/>
  <xs:complexType name="PurchaseOrderType">
    <xs:sequence>
      <xs:element name="shipTo" type="USAddress"/>
      <xs:element name="billTo" type="USAddress"/>
    </xs:sequence>
    <xs:attribute name="orderDate" type="xs:date"/>
  </xs:complexType>
  <xs:complexType name="USAddress">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="street" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="country" type="xs:NMTOKEN" default="US"/>
  </xs:complexType>
</xs:schema>`;

describe('XSDVisualizer Graph Integration', () => {
  it('should show Graph View tab', () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);
    expect(screen.getByTestId('xsd-graph-tab')).toBeInTheDocument();
  });

  it('should switch to Graph View when tab is clicked', async () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);
    const graphTab = screen.getByTestId('xsd-graph-tab');
    fireEvent.click(graphTab);
    await waitFor(() => {
      expect(screen.getByTestId('xsd-graph-view')).toBeInTheDocument();
    });
  });

  it('should show all elements in dropdown', async () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);
    const graphTab = screen.getByTestId('xsd-graph-tab');
    fireEvent.click(graphTab);
    await waitFor(() => {
      const select = screen.getByLabelText('Element:');
      expect(select.innerHTML).toContain('PurchaseOrder');
    });
  });

  it('should render graph when element is selected', async () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);
    const graphTab = screen.getByTestId('xsd-graph-tab');
    fireEvent.click(graphTab);
    await waitFor(() => {
      const select = screen.getByLabelText('Element:');
      fireEvent.change(select, { target: { value: 'PurchaseOrder' } });
    });
    await waitFor(() => {
      const container = screen.getByTestId('xsd-graph-view');
      expect(container.querySelector('.react-flow')).toBeInTheDocument();
    });
  });
});
