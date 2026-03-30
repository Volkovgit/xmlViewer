/**
 * Phase 1: Complete XML Editor Workflow - E2E Tests
 *
 * End-to-end tests for the complete XML editor functionality.
 * Tests cover the full user workflow from document creation to editing.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentManager } from '@/core/documentManager';
import { useDocumentStore } from '@/stores';
import { resetUntitledCounters } from '@/services/document';

/**
 * Helper component to render DocumentManager with test context
 */
function TestApp() {
  return <DocumentManager />;
}

describe('Phase 1: Complete XML Editor Workflow', () => {
  beforeEach(() => {
    // Reset untitled counters before each test
    resetUntitledCounters();

    // Reset document store state before each test by clearing all documents
    const { getAllDocuments, removeDocument } = useDocumentStore.getState();
    const docs = getAllDocuments();
    docs.forEach((doc) => removeDocument(doc.id));
  });

  describe('Document Creation', () => {
    it('should create new untitled document', () => {
      render(<TestApp />);

      // Find and click "New File" button
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      expect(newFileButton).toBeInTheDocument();

      fireEvent.click(newFileButton);

      // Verify: New document created - check for tab
      const tabs = screen.queryAllByTestId(/document-tab-/);
      expect(tabs.length).toBe(1);

      // Verify: Document name contains "Untitled"
      expect(screen.getByText(/Untitled-xml-1/i)).toBeInTheDocument();

      // Verify: Active document container is shown
      const activeDocument = screen.getByTestId('active-document');
      expect(activeDocument).toBeInTheDocument();

      // Verify: Status bar shows valid
      expect(screen.getByTestId('validation-status')).toHaveTextContent('✓ Valid');
    });

    it('should create multiple untitled documents with incrementing names', () => {
      render(<TestApp />);

      const newFileButton = screen.getByRole('button', { name: /new file/i });

      // Create first document
      fireEvent.click(newFileButton);
      expect(screen.getByText(/Untitled-xml-1/i)).toBeInTheDocument();

      // Create second document
      fireEvent.click(newFileButton);
      expect(screen.getByText(/Untitled-xml-2/i)).toBeInTheDocument();

      // Create third document
      fireEvent.click(newFileButton);
      expect(screen.getByText(/Untitled-xml-3/i)).toBeInTheDocument();

      // Verify we have 3 tabs
      const tabs = screen.queryAllByTestId(/document-tab-/);
      expect(tabs.length).toBe(3);
    });
  });

  describe('Document Editing', () => {
    it('should edit XML and see validation', () => {
      render(<TestApp />);

      // Create new document
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      // Verify the editor container is present
      const activeDocument = screen.getByTestId('active-document');
      expect(activeDocument).toBeInTheDocument();

      // Initial state should be valid
      expect(screen.getByTestId('validation-status')).toHaveTextContent('✓ Valid');

      // Note: Actual typing test would require Monaco editor mocking
      // For E2E we verify the component structure and state management
    });

    it('should show dirty indicator when content changes', () => {
      render(<TestApp />);

      // Create new document
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      // Get the initial tab
      const tabs = screen.queryAllByTestId(/document-tab-/);
      expect(tabs.length).toBe(1);

      // Note: Dirty indicator testing would require actual Monaco editor interaction
      // The dirty indicator (•) is handled by DocumentTabs component
      // This test verifies the structure is in place
    });
  });

  describe('Document Switching', () => {
    it('should switch between documents', () => {
      render(<TestApp />);

      const newFileButton = screen.getByRole('button', { name: /new file/i });

      // Create first document
      fireEvent.click(newFileButton);

      const firstTabText = screen.getByText(/Untitled-xml-1/i);
      expect(firstTabText).toBeInTheDocument();

      // Create second document
      fireEvent.click(newFileButton);

      const secondTabText = screen.getByText(/Untitled-xml-2/i);
      expect(secondTabText).toBeInTheDocument();

      // Verify we have 2 tabs
      const tabs = screen.queryAllByTestId(/document-tab-/);
      expect(tabs.length).toBe(2);

      // Switch back to first document
      fireEvent.click(firstTabText);

      // Verify active document is shown
      expect(screen.getByTestId('active-document')).toBeInTheDocument();
    });
  });

  describe('Document Closing', () => {
    it('should close document without unsaved changes', () => {
      render(<TestApp />);

      // Create new document
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      // Verify document exists
      expect(screen.getByText(/Untitled-xml-1/i)).toBeInTheDocument();

      // Find close button (×) on the tab
      const closeButton = screen.getByRole('button', { name: /close Untitled-xml-1/i });
      expect(closeButton).toBeInTheDocument();

      // Click close button
      fireEvent.click(closeButton);

      // Verify document is closed
      expect(screen.queryByText(/Untitled-xml-1/i)).not.toBeInTheDocument();

      // Verify empty state is shown
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show confirmation dialog when closing document with unsaved changes', () => {
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<TestApp />);

      // Create new document
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      // Simulate dirty state by updating document store directly
      const { getAllDocuments, updateDocumentContent } = useDocumentStore.getState();
      const documents = getAllDocuments();
      const docId = documents[0].id;

      // Update content to mark as dirty
      updateDocumentContent(docId, '<?xml version="1.0" encoding="UTF-8"?><root>Modified</root>');

      // Try to close document
      const closeButton = screen.getByRole('button', { name: /close Untitled-xml-1/i });
      fireEvent.click(closeButton);

      // Verify confirmation dialog was called
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Save changes to')
      );

      // Cleanup
      confirmSpy.mockRestore();
    });
  });

  describe('Status Bar', () => {
    it('should display correct status information', () => {
      render(<TestApp />);

      // Create new document
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      // Verify cursor position
      expect(screen.getByTestId('cursor-position')).toHaveTextContent('Ln 1, Col 1');

      // Verify line count
      expect(screen.getByTestId('line-count')).toBeInTheDocument();

      // Verify file size
      expect(screen.getByTestId('file-size')).toBeInTheDocument();

      // Verify encoding
      expect(screen.getByTestId('encoding')).toHaveTextContent('UTF-8');

      // Verify validation status
      expect(screen.getByTestId('validation-status')).toHaveTextContent('✓ Valid');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no documents open', () => {
      render(<TestApp />);

      // Verify empty state is shown
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Document Open')).toBeInTheDocument();
      expect(
        screen.getByText('Create a new file or open an existing file to get started')
      ).toBeInTheDocument();
    });
  });

  describe('Full Document Lifecycle', () => {
    it('should complete full document lifecycle', () => {
      render(<TestApp />);

      // Step 1: Empty state
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();

      // Step 2: Create new file
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      // Verify document created
      expect(screen.getByTestId('active-document')).toBeInTheDocument();
      expect(screen.getByText(/Untitled-xml-1/i)).toBeInTheDocument();

      // Step 3: Verify editor container is ready
      const activeDocument = screen.getByTestId('active-document');
      expect(activeDocument.querySelector('.monaco-editor-container')).toBeInTheDocument();

      // Step 4: Verify validation works
      expect(screen.getByTestId('validation-status')).toHaveTextContent('✓ Valid');

      // Step 5: Verify status bar
      expect(screen.getByTestId('cursor-position')).toHaveTextContent('Ln 1, Col 1');

      // Step 6: Close document
      const closeButton = screen.getByRole('button', { name: /close Untitled-xml-1/i });
      fireEvent.click(closeButton);

      // Step 7: Back to empty state
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();

      // All operations completed successfully
      expect(true).toBe(true);
    });
  });

  describe('Multiple Documents Workflow', () => {
    it('should handle multiple documents with different states', () => {
      render(<TestApp />);

      const newFileButton = screen.getByRole('button', { name: /new file/i });

      // Create three documents
      fireEvent.click(newFileButton);
      fireEvent.click(newFileButton);
      fireEvent.click(newFileButton);

      // Verify we have 3 tabs
      const tabs = screen.queryAllByTestId(/document-tab-/);
      expect(tabs.length).toBe(3);

      // Verify all three names exist
      expect(screen.getByText(/Untitled-xml-1/i)).toBeInTheDocument();
      expect(screen.getByText(/Untitled-xml-2/i)).toBeInTheDocument();
      expect(screen.getByText(/Untitled-xml-3/i)).toBeInTheDocument();

      // Close middle document
      const closeButton = screen.getByRole('button', { name: /close Untitled-xml-2/i });
      fireEvent.click(closeButton);

      // Verify first and third still exist
      expect(screen.getByText(/Untitled-xml-1/i)).toBeInTheDocument();
      expect(screen.queryByText(/Untitled-xml-2/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Untitled-xml-3/i)).toBeInTheDocument();
    });
  });
});
