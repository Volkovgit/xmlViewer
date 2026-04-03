import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SchemaSelectionModal } from '../SchemaSelectionModal';
import { Document, DocumentType, DocumentStatus } from '@/types';

describe('SchemaSelectionModal', () => {
  const mockXsdDocuments: Document[] = [
    {
      id: '1',
      name: 'schema1.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema></xs:schema>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: '2',
      name: 'schema2.xsd',
      type: DocumentType.XSD,
      content: '<xs:schema></xs:schema>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    }
  ];

  it('should render modal with XSD documents', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText('Select XSD Schema')).toBeInTheDocument();
    expect(screen.getByText('schema1.xsd')).toBeInTheDocument();
    expect(screen.getByText('schema2.xsd')).toBeInTheDocument();
  });

  it('should show empty state when no XSD documents', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={[]}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText(/No XSD schemas available/)).toBeInTheDocument();
  });

  it('should call onSelect when schema is clicked', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText('schema1.xsd'));
    expect(handleSelect).toHaveBeenCalledWith(mockXsdDocuments[0]);
  });

  it('should call onCancel when close button is clicked', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(handleCancel).toHaveBeenCalled();
  });

  it('should call onCancel when overlay is clicked', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    const { container } = render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    const overlay = container.querySelector('.schema-modal-overlay');
    fireEvent.click(overlay!);
    expect(handleCancel).toHaveBeenCalled();
  });

  it('should not call onCancel when modal content is clicked', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    const { container } = render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    const modalContent = container.querySelector('.schema-modal-content');
    fireEvent.click(modalContent!);
    expect(handleCancel).not.toHaveBeenCalled();
  });

  it('should support keyboard navigation on schema items', () => {
    const handleSelect = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SchemaSelectionModal
        xsdDocuments={mockXsdDocuments}
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    );

    const schemaItem = screen.getByText('schema1.xsd');
    fireEvent.keyDown(schemaItem, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith(mockXsdDocuments[0]);

    handleSelect.mockClear();

    fireEvent.keyDown(schemaItem, { key: ' ' });
    expect(handleSelect).toHaveBeenCalledWith(mockXsdDocuments[0]);
  });
});
