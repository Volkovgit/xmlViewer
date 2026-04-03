import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionsPanel } from '../ActionsPanel';
import { Document, DocumentType, DocumentStatus } from '@/types';

describe('ActionsPanel', () => {
  const mockCallbacks = {
    onShowGraph: vi.fn(),
    onGenerateXML: vi.fn(),
    onGenerateXsd: vi.fn(),
    onValidate: vi.fn(),
    onAssignSchema: vi.fn(),
  };

  it('renders "Actions" section header', () => {
    render(<ActionsPanel document={null} {...mockCallbacks} />);

    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders empty state when document is null', () => {
    render(<ActionsPanel document={null} {...mockCallbacks} />);

    // Check for empty state message
    expect(screen.getByText('No document selected')).toBeInTheDocument();

    // Ensure no action buttons are rendered (only the header)
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('renders XSD actions when document type is XSD', () => {
    const xsdDocument: Document = {
      id: '1',
      name: 'schema.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    render(<ActionsPanel document={xsdDocument} {...mockCallbacks} />);

    // Check for XSD-specific buttons
    expect(screen.getByText('Открыть граф')).toBeInTheDocument();
    expect(screen.getByText('Generate XML')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();

    // Ensure XML-specific buttons are not rendered
    expect(screen.queryByText('Generate XSD')).not.toBeInTheDocument();
    expect(screen.queryByText('Assign Schema')).not.toBeInTheDocument();
  });

  it('renders XML actions when document type is XML', () => {
    const xmlDocument: Document = {
      id: '2',
      name: 'document.xml',
      type: DocumentType.XML,
      content: '<root></root>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    render(<ActionsPanel document={xmlDocument} {...mockCallbacks} />);

    // Check for XML-specific buttons
    expect(screen.getByText('Generate XSD')).toBeInTheDocument();
    expect(screen.getByText('Assign Schema')).toBeInTheDocument();
    expect(screen.getByText('Validate XSD')).toBeInTheDocument();

    // Ensure XSD-specific buttons are not rendered
    expect(screen.queryByText('Открыть граф')).not.toBeInTheDocument();
    expect(screen.queryByText('Generate XML')).not.toBeInTheDocument();
  });

  it('"Show Graph" button uses PrimaryActionButton for XSD documents', () => {
    const xsdDocument: Document = {
      id: '1',
      name: 'schema.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const { container } = render(<ActionsPanel document={xsdDocument} {...mockCallbacks} />);

    // Find the Show Graph button
    const showGraphButton = Array.from(container.querySelectorAll('button')).find(
      btn => btn.textContent === 'Открыть граф'
    );

    expect(showGraphButton).toBeDefined();
    expect(showGraphButton?.className).toContain('primary-action-button');
  });

  it('other buttons use SecondaryActionButton', () => {
    const xsdDocument: Document = {
      id: '1',
      name: 'schema.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const { container } = render(<ActionsPanel document={xsdDocument} {...mockCallbacks} />);

    // Find Generate XML and Validate buttons
    const buttons = Array.from(container.querySelectorAll('button'));
    const generateXmlButton = buttons.find(btn => btn.textContent === 'Generate XML');
    const validateButton = buttons.find(btn => btn.textContent === 'Validate');

    expect(generateXmlButton?.className).toContain('secondary-action-button');
    expect(validateButton?.className).toContain('secondary-action-button');
  });

  it('correct icons are used for each action', () => {
    const xsdDocument: Document = {
      id: '1',
      name: 'schema.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"></xs:schema>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const { container } = render(<ActionsPanel document={xsdDocument} {...mockCallbacks} />);

    // Check that icons are rendered (lucide icons render as SVG elements)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);

    // Verify that buttons have icon children
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });
});
