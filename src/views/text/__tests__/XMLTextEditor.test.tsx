/**
 * XML Text Editor Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { XMLTextEditor } from '../XMLTextEditor';
import { useDocumentStore } from '@/stores/documentStore';
import { xmlValidator } from '@/core/validatorEngine';
import type { Document } from '@/types';
import { DocumentType, DocumentStatus } from '@/types';

// Mock the document store
vi.mock('@/stores/documentStore', () => ({
  useDocumentStore: vi.fn(),
}));

// Mock the validator
vi.mock('@/core/validatorEngine', () => ({
  xmlValidator: {
    validateRealTime: vi.fn(),
    cancelPendingValidation: vi.fn(),
  },
}));

// Mock schema-aware editing providers
vi.mock('@/services/xsd/schemaProvider/SchemaProvider', () => ({
  SchemaProvider: {
    detectSchemaLocation: vi.fn(() => null),
    loadSchemaFromContent: vi.fn(() => null),
    attachSchemaToDocument: vi.fn(),
    detachSchema: vi.fn(),
  },
}));

vi.mock('@/services/xsd/completion/SchemaCompletionProvider', () => ({
  SchemaCompletionProvider: vi.fn(() => ({
    provideCompletionItems: vi.fn(() => null),
    attachToDocument: vi.fn(),
    detach: vi.fn(),
  })),
}));

vi.mock('@/services/xsd/decorations/SchemaDecorationProvider', () => ({
  SchemaDecorationProvider: vi.fn(() => ({
    getDecorations: vi.fn(() => []),
    clearDecorations: vi.fn(),
  })),
}));

vi.mock('@/services/xsd/quickFix/SchemaQuickFixProvider', () => ({
  SchemaQuickFixProvider: vi.fn(() => ({
    provideCodeActions: vi.fn(() => ({ actions: [], dispose: vi.fn() })),
  })),
}));

// Mock Monaco Editor (we don't want to render the actual Monaco in tests)
vi.mock('../MonacoEditor', () => ({
  MonacoEditor: ({ value, onChange, onDidChangeCursorPosition, readOnly }: any) => {
    const [content, setContent] = React.useState(value);

    React.useEffect(() => {
      setContent(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setContent(newValue);
      onChange?.(newValue);
    };

    return (
      <div data-testid="monaco-editor">
        <textarea
          data-testid="editor-textarea"
          value={content}
          onChange={handleChange}
          readOnly={readOnly}
        />
        <button
          data-testid="cursor-change-btn"
          onClick={() =>
            onDidChangeCursorPosition?.({
              position: { lineNumber: 5, column: 10 },
            } as any)
          }
        >
          Change Cursor
        </button>
      </div>
    );
  },
}));

describe('XMLTextEditor', () => {
  const mockUpdateDocumentContent = vi.fn();
  const mockDocument: Document = {
    id: 'test-doc-1',
    name: 'test.xml',
    type: DocumentType.XML,
    content: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>Test</item>\n</root>',
    status: DocumentStatus.READY,
    createdAt: new Date('2024-01-01'),
    modifiedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useDocumentStore as any).mockReturnValue({
      updateDocumentContent: mockUpdateDocumentContent,
      recordViewUpdate: vi.fn(),
      shouldProcessViewUpdate: vi.fn(() => true),
    });
    (xmlValidator.validateRealTime as any).mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render editor with document', () => {
      render(<XMLTextEditor document={mockDocument} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('editor-textarea')).toHaveValue(mockDocument.content);
    });

    it('should render status bar with all information', () => {
      render(<XMLTextEditor document={mockDocument} />);

      expect(screen.getByTestId('cursor-position')).toBeInTheDocument();
      expect(screen.getByTestId('line-count')).toBeInTheDocument();
      expect(screen.getByTestId('file-size')).toBeInTheDocument();
      expect(screen.getByTestId('encoding')).toBeInTheDocument();
      expect(screen.getByTestId('validation-status')).toBeInTheDocument();
    });

    it('should display correct line count', () => {
      render(<XMLTextEditor document={mockDocument} />);

      const lineCount = screen.getByTestId('line-count');
      expect(lineCount).toHaveTextContent('4 lines');
    });

    it('should display file size in bytes', () => {
      render(<XMLTextEditor document={mockDocument} />);

      const fileSize = screen.getByTestId('file-size');
      expect(fileSize).toHaveTextContent(/\d+ bytes/);
    });

    it('should display UTF-8 encoding', () => {
      render(<XMLTextEditor document={mockDocument} />);

      const encoding = screen.getByTestId('encoding');
      expect(encoding).toHaveTextContent('UTF-8');
    });

    it('should display initial cursor position', () => {
      render(<XMLTextEditor document={mockDocument} />);

      const cursorPosition = screen.getByTestId('cursor-position');
      expect(cursorPosition).toHaveTextContent('Ln 1, Col 1');
    });
  });

  describe('Content Changes', () => {
    it('should handle content changes and update document store', async () => {
      const onContentChange = vi.fn();
      render(<XMLTextEditor document={mockDocument} onContentChange={onContentChange} />);

      const textarea = screen.getByTestId('editor-textarea');
      const newContent = '<?xml version="1.0"?><new-root>Content</new-root>';

      // Use clear + type to replace content
      await userEvent.clear(textarea);
      await userEvent.type(textarea, newContent);

      await waitFor(() => {
        expect(mockUpdateDocumentContent).toHaveBeenCalled();
        expect(onContentChange).toHaveBeenCalled();
        // Check that the final call has the new content
        const calls = mockUpdateDocumentContent.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall).toBeDefined();
        expect(lastCall?.[0]).toBe(mockDocument.id);
        expect(lastCall?.[1]).toBe(newContent);
      });
    });

    it('should call validator on content change', async () => {
      render(<XMLTextEditor document={mockDocument} />);

      const textarea = screen.getByTestId('editor-textarea');
      const newContent = '<?xml version="1.0"?><test>Content</test>';

      await userEvent.clear(textarea);
      await userEvent.type(textarea, newContent);

      await waitFor(() => {
        expect(xmlValidator.validateRealTime).toHaveBeenCalled();
        // Check that the final call has the new content
        const calls = (xmlValidator.validateRealTime as any).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall).toBeDefined();
        expect(lastCall?.[0]).toBe(newContent);
      });
    });
  });

  describe('Validation Status', () => {
    it('should show valid status when no errors', () => {
      (xmlValidator.validateRealTime as any).mockReturnValue([]);

      render(<XMLTextEditor document={mockDocument} />);

      const validationStatus = screen.getByTestId('validation-status');
      expect(validationStatus).toHaveTextContent('✓ Valid');
      expect(validationStatus).toHaveClass('valid');
      expect(validationStatus).not.toHaveClass('has-errors');
    });

    it('should show error count when validation fails', () => {
      const mockErrors = [
        { line: 1, column: 10, message: 'Invalid XML', severity: 'error' as const },
        { line: 2, column: 5, message: 'Unclosed tag', severity: 'error' as const },
      ];
      (xmlValidator.validateRealTime as any).mockReturnValue(mockErrors);

      render(<XMLTextEditor document={mockDocument} />);

      const validationStatus = screen.getByTestId('validation-status');
      expect(validationStatus).toHaveTextContent('✗ 2 errors');
      expect(validationStatus).toHaveClass('has-errors');
      expect(validationStatus).not.toHaveClass('valid');
    });

    it('should show singular "error" text for single error', () => {
      const mockErrors = [
        { line: 1, column: 10, message: 'Invalid XML', severity: 'error' as const },
      ];
      (xmlValidator.validateRealTime as any).mockReturnValue(mockErrors);

      render(<XMLTextEditor document={mockDocument} />);

      const validationStatus = screen.getByTestId('validation-status');
      expect(validationStatus).toHaveTextContent('✗ 1 error');
    });

    it('should update error count when content changes', async () => {
      (xmlValidator.validateRealTime as any).mockReturnValue([]);

      render(<XMLTextEditor document={mockDocument} />);

      // Initially valid
      expect(screen.getByTestId('validation-status')).toHaveTextContent('✓ Valid');

      // Simulate validation errors
      const mockErrors = [
        { line: 1, column: 10, message: 'Invalid XML', severity: 'error' as const },
      ];
      (xmlValidator.validateRealTime as any).mockReturnValue(mockErrors);

      const textarea = screen.getByTestId('editor-textarea');
      await userEvent.type(textarea, ' ');

      await waitFor(() => {
        expect(screen.getByTestId('validation-status')).toHaveTextContent('✗ 1 error');
      });
    });
  });

  describe('Cursor Position Tracking', () => {
    it('should display initial cursor position at line 1, column 1', () => {
      render(<XMLTextEditor document={mockDocument} />);

      expect(screen.getByTestId('cursor-position')).toHaveTextContent('Ln 1, Col 1');
    });

    it('should update cursor position when cursor changes', async () => {
      render(<XMLTextEditor document={mockDocument} />);

      const cursorButton = screen.getByTestId('cursor-change-btn');
      await userEvent.click(cursorButton);

      await waitFor(() => {
        expect(screen.getByTestId('cursor-position')).toHaveTextContent('Ln 5, Col 10');
      });
    });
  });

  describe('Read-only Mode', () => {
    it('should pass readOnly prop to MonacoEditor', () => {
      render(<XMLTextEditor document={mockDocument} readOnly={true} />);

      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveAttribute('readOnly');
    });

    it('should allow editing when not in read-only mode', () => {
      render(<XMLTextEditor document={mockDocument} readOnly={false} />);

      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).not.toHaveAttribute('readOnly');
    });
  });

  describe('Lifecycle', () => {
    it('should initialize validation on mount', () => {
      render(<XMLTextEditor document={mockDocument} />);

      expect(xmlValidator.validateRealTime).toHaveBeenCalledWith(mockDocument.content);
    });

    it('should use existing validation errors from document if available', () => {
      const docWithErrors: Document = {
        ...mockDocument,
        validationErrors: [
          { line: 1, column: 1, message: 'Error', severity: 'error' as const },
        ],
      };

      render(<XMLTextEditor document={docWithErrors} />);

      expect(screen.getByTestId('validation-status')).toHaveTextContent('✗ 1 error');
    });

    it('should cancel pending validation on unmount', () => {
      const { unmount } = render(<XMLTextEditor document={mockDocument} />);

      unmount();

      expect(xmlValidator.cancelPendingValidation).toHaveBeenCalled();
    });
  });

  describe('Document Statistics', () => {
    it('should calculate correct line count for multiline document', () => {
      const multilineDoc: Document = {
        ...mockDocument,
        content: 'line1\nline2\nline3\nline4\nline5',
      };

      render(<XMLTextEditor document={multilineDoc} />);

      expect(screen.getByTestId('line-count')).toHaveTextContent('5 lines');
    });

    it('should calculate correct file size', () => {
      const content = '<?xml version="1.0"?><root></root>';
      const doc: Document = {
        ...mockDocument,
        content,
      };

      render(<XMLTextEditor document={doc} />);

      const fileSize = screen.getByTestId('file-size');
      const expectedSize = new Blob([content]).size;
      expect(fileSize).toHaveTextContent(`${expectedSize} bytes`);
    });

    it('should handle empty document', () => {
      const emptyDoc: Document = {
        ...mockDocument,
        content: '',
      };

      render(<XMLTextEditor document={emptyDoc} />);

      expect(screen.getByTestId('line-count')).toHaveTextContent('1 lines');
      expect(screen.getByTestId('file-size')).toHaveTextContent('0 bytes');
    });
  });
});
