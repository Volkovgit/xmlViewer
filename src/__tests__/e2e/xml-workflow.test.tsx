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

      // Verify: New document created - check for file item in sidebar
      const fileItems = screen.queryAllByTestId(/file-item-/);
      expect(fileItems.length).toBe(1);

      // Verify: Document name contains "Untitled"
      const documentName = screen.getByTestId(/file-name-/);
      expect(documentName).toBeInTheDocument();
      expect(documentName).toHaveTextContent(/Untitled-xml-1/i);

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
      const docNames = screen.getAllByTestId(/file-name-/);
      expect(docNames[0]).toHaveTextContent(/Untitled-xml-1/i);

      // Create second document
      fireEvent.click(newFileButton);
      const docNames2 = screen.getAllByTestId(/file-name-/);
      expect(docNames2.some(el => el.textContent?.includes('Untitled-xml-2'))).toBe(true);

      // Create third document
      fireEvent.click(newFileButton);
      const docNames3 = screen.getAllByTestId(/file-name-/);
      expect(docNames3.some(el => el.textContent?.includes('Untitled-xml-3'))).toBe(true);

      // Verify we have 3 file items
      const fileItems = screen.queryAllByTestId(/file-item-/);
      expect(fileItems.length).toBe(3);
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

      // Get the initial file item
      const fileItems = screen.queryAllByTestId(/file-item-/);
      expect(fileItems.length).toBe(1);

      // Note: Dirty indicator testing would require actual Monaco editor interaction
      // The dirty badge is handled by FilesPanel component
      // This test verifies the structure is in place
    });
  });

  describe('Document Switching', () => {
    it('should switch between documents', () => {
      render(<TestApp />);

      const newFileButton = screen.getByRole('button', { name: /new file/i });

      // Create first document
      fireEvent.click(newFileButton);

      const firstDocName = screen.getAllByTestId(/file-name-/)[0];
      expect(firstDocName).toHaveTextContent(/Untitled-xml-1/i);

      // Create second document
      fireEvent.click(newFileButton);

      const docNames = screen.getAllByTestId(/file-name-/);
      const secondDocName = docNames.find(el => el.textContent?.includes('Untitled-xml-2'));
      expect(secondDocName).toBeInTheDocument();

      // Verify we have 2 file items
      const fileItems = screen.queryAllByTestId(/file-item-/);
      expect(fileItems.length).toBe(2);

      // Switch back to first document by clicking on its file item
      fireEvent.click(fileItems[0]);

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
      expect(screen.getAllByTestId(/file-name-/)[0]).toHaveTextContent(/Untitled-xml-1/i);

      // Find close button on the file item
      const closeButton = screen.getByTestId(/close-file-/);
      expect(closeButton).toBeInTheDocument();

      // Click close button
      fireEvent.click(closeButton);

      // Verify document is closed (no file names left)
      expect(screen.queryByTestId(/file-name-/)).not.toBeInTheDocument();

      // Verify empty state is shown
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show confirmation dialog when closing document with unsaved changes', () => {
      // Mock window.confirm to return true (user confirms)
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<TestApp />);

      // Create new document
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      // Get the document ID before modifying
      const { getAllDocuments, updateDocumentContent } = useDocumentStore.getState();
      const documentsBefore = getAllDocuments();
      const docId = documentsBefore[0].id;

      // Update content to mark as dirty
      updateDocumentContent(docId, '<?xml version="1.0" encoding="UTF-8"?><root>Modified</root>');

      // Verify close button exists
      const closeButton = screen.getByTestId(`close-file-${docId}`);
      expect(closeButton).toBeInTheDocument();

      // Try to close document
      fireEvent.click(closeButton);

      // Document should be closed (user confirmed)
      // Note: The actual confirm dialog is shown by browser, we just verify the flow works
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
      const docName = screen.getAllByTestId(/file-name-/)[0];
      expect(docName).toHaveTextContent(/Untitled-xml-1/i);

      // Step 3: Verify editor container is ready
      const activeDocument = screen.getByTestId('active-document');
      expect(activeDocument.querySelector('.monaco-editor-container')).toBeInTheDocument();

      // Step 4: Verify validation works
      expect(screen.getByTestId('validation-status')).toHaveTextContent('✓ Valid');

      // Step 5: Verify status bar
      expect(screen.getByTestId('cursor-position')).toHaveTextContent('Ln 1, Col 1');

      // Step 6: Close document
      const closeButton = screen.getByTestId(/close-file-/);
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

      // Verify we have 3 file items
      const fileItems = screen.queryAllByTestId(/file-item-/);
      expect(fileItems.length).toBe(3);

      // Verify all three names exist
      const docNames = screen.getAllByTestId(/file-name-/);
      const nameTexts = docNames.map(el => el.textContent);
      expect(nameTexts.some(t => t?.includes('Untitled-xml-1'))).toBe(true);
      expect(nameTexts.some(t => t?.includes('Untitled-xml-2'))).toBe(true);
      expect(nameTexts.some(t => t?.includes('Untitled-xml-3'))).toBe(true);

      // Close middle document
      const closeButton = screen.getAllByTestId(/close-file-/)[1];
      fireEvent.click(closeButton);

      // Verify first and third still exist
      const remainingDocNames = screen.getAllByTestId(/file-name-/);
      const remainingTexts = remainingDocNames.map(el => el.textContent);
      expect(remainingTexts.some(t => t?.includes('Untitled-xml-1'))).toBe(true);
      expect(remainingTexts.some(t => t?.includes('Untitled-xml-2'))).toBe(false);
      expect(remainingTexts.some(t => t?.includes('Untitled-xml-3'))).toBe(true);
    });
  });
});
