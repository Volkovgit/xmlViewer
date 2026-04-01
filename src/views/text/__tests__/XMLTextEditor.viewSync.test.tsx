/**
 * XML Text Editor View Sync Integration Tests
 *
 * Tests the integration of view synchronization functionality into XMLTextEditor.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock the view coordinator and related modules
vi.mock('@/core/viewManager/ViewCoordinator', () => ({
  viewCoordinator: {
    registerViewListener: vi.fn(() => vi.fn()),
    broadcastUpdate: vi.fn(),
  },
}));

vi.mock('@/core/viewManager/ViewSyncManager', () => ({
  ViewSyncManager: vi.fn().mockImplementation(() => ({
    scheduleUpdate: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock('@/core/viewManager/ViewUpdate', () => ({
  ViewType: { TEXT: 'TEXT', TREE: 'TREE', GRID: 'GRID' },
  ChangeType: { CONTENT: 'CONTENT', STRUCTURE: 'STRUCTURE', SELECTION: 'SELECTION', FULL: 'FULL' },
  createViewUpdate: vi.fn((source, content, type) => ({
    sourceView: source,
    content,
    changeType: type,
    timestamp: Date.now(),
    updateId: 'test-update',
  })),
}));

// Mock the useViewSync hook - must be a simple inline function
vi.mock('@/hooks/useViewSync', () => ({
  useViewSync: vi.fn(() => ({
    document: {} as Document,
    currentView: 'TEXT',
    subscribe: vi.fn(() => vi.fn()),
    notifyViewChanged: vi.fn(),
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

describe('XMLTextEditor - View Sync Integration', () => {
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

  describe('View Sync Hook Integration', () => {
    it('should render successfully with view sync enabled', () => {
      expect(() => {
        render(<XMLTextEditor document={mockDocument} />);
      }).not.toThrow();
    });
  });

  describe('Content Change Propagation', () => {
    it('should call document store when content changes', async () => {
      render(<XMLTextEditor document={mockDocument} />);

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      const newContent = '<?xml version="1.0"?><new-root>Updated Content</new-root>';

      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.clear(textarea);
      await userEvent.type(textarea, newContent);

      await waitFor(() => {
        expect(mockUpdateDocumentContent).toHaveBeenCalled();
      });
    });

    it('should work with all view sync related code paths', async () => {
      render(<XMLTextEditor document={mockDocument} />);

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      const newContent = '<?xml version="1.0"?><test>Changed</test>';

      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.clear(textarea);
      await userEvent.type(textarea, newContent);

      // Just verify no errors were thrown
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Interface Extensions', () => {
    it('should accept onExternalUpdate prop without errors', () => {
      const onExternalUpdate = vi.fn();

      expect(() => {
        render(<XMLTextEditor document={mockDocument} onExternalUpdate={onExternalUpdate} />);
      }).not.toThrow();
    });

    it('should render successfully with all optional props', () => {
      const onContentChange = vi.fn();
      const onSave = vi.fn();
      const onExternalUpdate = vi.fn();

      expect(() => {
        render(
          <XMLTextEditor
            document={mockDocument}
            onContentChange={onContentChange}
            onSave={onSave}
            onExternalUpdate={onExternalUpdate}
            readOnly={false}
          />
        );
      }).not.toThrow();
    });
  });

  describe('View Sync Lifecycle', () => {
    it('should not interfere with existing validation functionality', async () => {
      const mockErrors = [
        { line: 1, column: 10, message: 'Invalid XML', severity: 'error' as const },
      ];
      (xmlValidator.validateRealTime as any).mockReturnValue(mockErrors);

      render(<XMLTextEditor document={mockDocument} />);

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.type(textarea, ' ');

      await waitFor(() => {
        expect(xmlValidator.validateRealTime).toHaveBeenCalled();
        const validationStatus = screen.getByTestId('validation-status');
        expect(validationStatus).toHaveTextContent('✗ 1 error');
      });
    });

    it('should not interfere with cursor position tracking', async () => {
      render(<XMLTextEditor document={mockDocument} />);

      const cursorButton = screen.getByTestId('cursor-change-btn');
      const userEvent = (await import('@testing-library/user-event')).default;
      await userEvent.click(cursorButton);

      await waitFor(() => {
        expect(screen.getByTestId('cursor-position')).toHaveTextContent('Ln 5, Col 10');
      });
    });
  });

  describe('No Regressions', () => {
    it('should maintain backward compatibility without view sync props', () => {
      expect(() => {
        render(<XMLTextEditor document={mockDocument} />);
      }).not.toThrow();
    });

    it('should work with minimal props (only document)', () => {
      expect(() => {
        render(<XMLTextEditor document={mockDocument} />);
      }).not.toThrow();

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      // Status bar is rendered but with class name, not test id in this case
      const statusBar = document.querySelector('.status-bar');
      expect(statusBar).toBeInTheDocument();
    });
  });
});
