import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilesPanel } from '../FilesPanel';
import { Document, DocumentType, DocumentStatus } from '@/types/document';
import { ValidationError } from '@/types/document';

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'test.xml',
    type: DocumentType.XML,
    content: '<root/>',
    status: DocumentStatus.READY,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: '2',
    name: 'dirty.xsd',
    type: DocumentType.XSD,
    content: '<schema/>',
    status: DocumentStatus.DIRTY,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: '3',
    name: 'errors.xml',
    type: DocumentType.XML,
    content: '<broken>',
    status: DocumentStatus.READY,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: '4',
    name: 'clean.xml',
    type: DocumentType.XML,
    content: '<root/>',
    status: DocumentStatus.SAVED,
    createdAt: new Date(),
    modifiedAt: new Date(),
  },
];

const mockValidationErrors = new Map<string, ValidationError[]>();
mockValidationErrors.set('3', [
  { line: 1, column: 8, message: 'Parse error', severity: 'error' },
  { line: 1, column: 10, message: 'Unclosed tag', severity: 'warning' },
]);

describe('FilesPanel', () => {
  it('renders "Open Files" section header', () => {
    const mockOnSelect = vi.fn();
    render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="1"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    expect(screen.getByText('Open Files')).toBeInTheDocument();
  });

  it('renders all documents in the list', () => {
    const mockOnSelect = vi.fn();
    render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="1"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    expect(screen.getByText('test.xml')).toBeInTheDocument();
    expect(screen.getByText('dirty.xsd')).toBeInTheDocument();
    expect(screen.getByText('errors.xml')).toBeInTheDocument();
    expect(screen.getByText('clean.xml')).toBeInTheDocument();
  });

  it('highlights active document', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="2"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    const fileItems = container.querySelectorAll('.file-item');
    const activeItem = fileItems[1]; // Second document (id: '2') is active
    expect(activeItem).toHaveClass('active');
  });

  it('shows file type icon for each document', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="1"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    // Check that icons are rendered (lucide icons have specific data-testid or class)
    const fileItems = container.querySelectorAll('.file-item');
    fileItems.forEach((item) => {
      const icon = item.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  it('shows DirtyBadge for dirty documents', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="1"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    const fileItems = container.querySelectorAll('.file-item');
    const dirtyItem = fileItems[1]; // dirty.xsd has DIRTY status
    const dirtyBadge = dirtyItem.querySelector('.dirty-badge');
    expect(dirtyBadge).toBeInTheDocument();
  });

  it('shows ErrorBadge with count for documents with errors', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="1"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    const fileItems = container.querySelectorAll('.file-item');
    const errorItem = fileItems[2]; // errors.xml has 2 validation errors
    const errorBadge = errorItem.querySelector('.error-badge');
    expect(errorBadge).toBeInTheDocument();
    expect(errorBadge?.textContent).toBe('2');
  });

  it('calls onDocumentSelect when clicked', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="1"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    const fileItems = container.querySelectorAll('.file-item');
    fireEvent.click(fileItems[2]); // Click on errors.xml
    expect(mockOnSelect).toHaveBeenCalledWith('3');
  });

  it('does not show badges for clean documents without errors', () => {
    const mockOnSelect = vi.fn();
    const { container } = render(
      <FilesPanel
        documents={mockDocuments}
        activeDocumentId="1"
        onDocumentSelect={mockOnSelect}
        validationErrors={mockValidationErrors}
      />
    );

    const fileItems = container.querySelectorAll('.file-item');
    const cleanItem = fileItems[3]; // clean.xml is SAVED and has no errors
    const dirtyBadge = cleanItem.querySelector('.dirty-badge');
    const errorBadge = cleanItem.querySelector('.error-badge');
    expect(dirtyBadge).not.toBeInTheDocument();
    expect(errorBadge).not.toBeInTheDocument();
  });
});
