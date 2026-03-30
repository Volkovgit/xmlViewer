import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentManager } from '../DocumentManager';
import { useDocumentStore } from '@/stores';
import { createUntitledDocument, createDocumentFromFile } from '@/services/document';
import { DocumentType, DocumentStatus } from '@/types';

// Mock the document store
vi.mock('@/stores', () => ({
  useDocumentStore: vi.fn(),
}));

// Mock document factory functions
vi.mock('@/services/document', () => ({
  createUntitledDocument: vi.fn(),
  createDocumentFromFile: vi.fn(),
}));

describe('DocumentManager', () => {
  const mockAddDocument = vi.fn();
  const mockSetActiveDocument = vi.fn();
  const mockRemoveDocument = vi.fn();
  const mockGetAllDocuments = vi.fn();
  const mockGetActiveDocument = vi.fn();

  const defaultStore = {
    addDocument: mockAddDocument,
    setActiveDocument: mockSetActiveDocument,
    removeDocument: mockRemoveDocument,
    getAllDocuments: mockGetAllDocuments,
    getActiveDocument: mockGetActiveDocument,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDocumentStore).mockReturnValue(defaultStore);
    mockGetAllDocuments.mockReturnValue([]);
    mockGetActiveDocument.mockReturnValue(null);

    // Mock document factory functions
    vi.mocked(createUntitledDocument).mockReturnValue({
      id: 'test-id-1',
      name: 'Untitled-xml-1.xml',
      type: DocumentType.XML,
      content: '<?xml version="1.0" encoding="UTF-8"?>\n<root/>\n',
      status: DocumentStatus.SAVED,
      createdAt: new Date(),
      modifiedAt: new Date(),
    });

    vi.mocked(createDocumentFromFile).mockResolvedValue({
      id: 'test-id-2',
      name: 'test.xml',
      type: DocumentType.XML,
      content: '<root>test</root>',
      status: DocumentStatus.READY,
      createdAt: new Date(),
      modifiedAt: new Date(),
    });
  });

  describe('Rendering', () => {
    it('should render with no documents', () => {
      render(<DocumentManager />);

      expect(screen.getByTestId('new-file-button')).toBeInTheDocument();
      expect(screen.getByTestId('open-file-button')).toBeInTheDocument();
      expect(screen.getByTestId('file-input')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.queryByTestId('document-tabs')).not.toBeInTheDocument();
    });

    it('should render with multiple documents', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
        {
          id: 'doc-2',
          name: 'file2.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      expect(screen.getByTestId('document-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('document-tab-doc-1')).toBeInTheDocument();
      expect(screen.getByTestId('document-tab-doc-2')).toBeInTheDocument();
      expect(screen.getByTestId('active-document')).toBeInTheDocument();
    });

    it('should render active document content', () => {
      const activeDoc = {
        id: 'doc-1',
        name: 'file1.xml',
        type: DocumentType.XML,
        content: '<root>test content</root>',
        status: DocumentStatus.SAVED,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };

      mockGetAllDocuments.mockReturnValue([activeDoc]);
      mockGetActiveDocument.mockReturnValue(activeDoc);

      render(<DocumentManager />);

      // Verify the active document container is rendered
      const activeDocument = screen.getByTestId('active-document');
      expect(activeDocument).toBeInTheDocument();
    });

    it('should show dirty indicator for dirty documents', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.DIRTY,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      expect(screen.getByTestId('dirty-indicator-doc-1')).toBeInTheDocument();
    });
  });

  describe('New File Button', () => {
    it('should create new untitled document when New File button is clicked', () => {
      render(<DocumentManager />);

      const newFileButton = screen.getByTestId('new-file-button');
      fireEvent.click(newFileButton);

      expect(createUntitledDocument).toHaveBeenCalledWith(
        DocumentType.XML
      );
      expect(mockAddDocument).toHaveBeenCalled();
      expect(mockSetActiveDocument).toHaveBeenCalled();
    });
  });

  describe('Open File Button', () => {
    it('should trigger file input when Open File button is clicked', () => {
      render(<DocumentManager />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const openFileButton = screen.getByTestId('open-file-button');
      fireEvent.click(openFileButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should create document from selected file', async () => {
      render(<DocumentManager />);

      const file = new File(['<root/>'], 'test.xml', { type: 'text/xml' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      await waitFor(() => {
        expect(createDocumentFromFile).toHaveBeenCalledWith(file);
        expect(mockAddDocument).toHaveBeenCalled();
        expect(mockSetActiveDocument).toHaveBeenCalled();
      });
    });

    it('should reset file input after file is loaded', async () => {
      render(<DocumentManager />);

      const file = new File(['<root/>'], 'test.xml', { type: 'text/xml' });
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });
  });

  describe('Tab Switching', () => {
    it('should switch active document when tab is clicked', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
        {
          id: 'doc-2',
          name: 'file2.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      const tab2 = screen.getByTestId('document-tab-doc-2');
      fireEvent.click(tab2);

      expect(mockSetActiveDocument).toHaveBeenCalledWith('doc-2');
    });
  });

  describe('Closing Documents', () => {
    it('should close document when close button is clicked (saved document)', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      const closeButton = screen.getByTestId('close-button-doc-1');
      fireEvent.click(closeButton);

      expect(mockRemoveDocument).toHaveBeenCalledWith('doc-1');
    });

    it('should show confirmation for dirty documents', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.DIRTY,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      // Mock confirm to return false (user cancels)
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<DocumentManager />);

      const closeButton = screen.getByTestId('close-button-doc-1');
      fireEvent.click(closeButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Save changes to "file1.xml" before closing?'
      );
      expect(mockRemoveDocument).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should close dirty document if user confirms', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.DIRTY,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      // Mock confirm to return true (user confirms)
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<DocumentManager />);

      const closeButton = screen.getByTestId('close-button-doc-1');
      fireEvent.click(closeButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Save changes to "file1.xml" before closing?'
      );
      expect(mockRemoveDocument).toHaveBeenCalledWith('doc-1');
      confirmSpy.mockRestore();
    });
  });

  describe('Active Tab Highlighting', () => {
    it('should apply active class to active tab', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
        {
          id: 'doc-2',
          name: 'file2.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      const tab1 = screen.getByTestId('document-tab-doc-1');
      const tab2 = screen.getByTestId('document-tab-doc-2');

      expect(tab1).toHaveClass('active');
      expect(tab2).not.toHaveClass('active');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on tabs', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      const tab = screen.getByTestId('document-tab-doc-1');
      expect(tab).toHaveAttribute('role', 'tab');
      expect(tab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper aria-label on close buttons', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.SAVED,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      const closeButton = screen.getByTestId('close-button-doc-1');
      expect(closeButton).toHaveAttribute('aria-label', 'Close file1.xml');
    });

    it('should have aria-label on dirty indicator', () => {
      const documents = [
        {
          id: 'doc-1',
          name: 'file1.xml',
          type: DocumentType.XML,
          content: '<root/>',
          status: DocumentStatus.DIRTY,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      mockGetAllDocuments.mockReturnValue(documents);
      mockGetActiveDocument.mockReturnValue(documents[0]);

      render(<DocumentManager />);

      const dirtyIndicator = screen.getByTestId('dirty-indicator-doc-1');
      expect(dirtyIndicator).toHaveAttribute('aria-label', 'Unsaved changes');
    });
  });
});
