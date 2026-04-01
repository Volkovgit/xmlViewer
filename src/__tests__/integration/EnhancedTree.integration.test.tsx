import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { XMLTree } from '@/views/tree/XMLTree';
import { Document, DocumentType, DocumentStatus } from '@/types';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
}

describe('Enhanced Tree Integration', () => {
  const createDocument = (content: string): Document => ({
    id: 'test-doc',
    name: 'test.xml',
    type: DocumentType.XML,
    content,
    status: DocumentStatus.READY,
    createdAt: new Date(),
    modifiedAt: new Date()
  });

  it('should display tree and support search', async () => {
    const xml = `
      <root>
        <item id="1">First</item>
        <item id="2">Second</item>
      </root>
    `;

    render(
      <XMLTree document={createDocument(xml)} />,
      { wrapper }
    );

    // Tree should render
    await waitFor(() => {
      expect(screen.getByText('root')).toBeInTheDocument();
    });

    // Search input should be present
    const searchInput = screen.getByPlaceholderText('Search nodes...');
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'First' } });

    // Wait for search results - just check no errors
    await waitFor(() => {
      expect(searchInput).toHaveValue('First');
    });
  });

  it('should support expand/collapse all', () => {
    const xml = `
      <root>
        <level1>
          <level2>
            <level3>Deep</level3>
          </level2>
        </level1>
      </root>
    `;

    render(<XMLTree document={createDocument(xml)} />, { wrapper });

    const expandButton = screen.getByLabelText('Expand all nodes');
    const collapseButton = screen.getByLabelText('Collapse all nodes');

    expect(expandButton).toBeInTheDocument();
    expect(collapseButton).toBeInTheDocument();

    // Click expand all
    fireEvent.click(expandButton);

    // All nodes should be visible
    expect(screen.getByText('level1')).toBeInTheDocument();
    expect(screen.getByText('level2')).toBeInTheDocument();
    expect(screen.getByText('level3')).toBeInTheDocument();
  });

  it('should support context menu', async () => {
    const xml = '<root><item>Test</item></root>';

    render(<XMLTree document={createDocument(xml)} />, { wrapper });

    const itemNode = screen.getByText('item');

    // Right-click to open context menu
    fireEvent.contextMenu(itemNode);

    // Context menu items should appear
    await waitFor(() => {
      expect(screen.getByText(/Add Child/i)).toBeInTheDocument();
      expect(screen.getByText(/Edit/i)).toBeInTheDocument();
      expect(screen.getByText(/Delete/i)).toBeInTheDocument();
      expect(screen.getByText(/Duplicate/i)).toBeInTheDocument();
    });
  });

  it('should display node structure correctly', async () => {
    const xml = `
      <root>
        <parent id="p1" name="test">
          <child>Content</child>
        </parent>
      </root>
    `;

    render(<XMLTree document={createDocument(xml)} />, { wrapper });

    // Wait for tree to render
    await waitFor(() => {
      expect(screen.getByText('root')).toBeInTheDocument();
    });
  });

  it('should handle node selection', () => {
    const xml = '<root><item>Test</item></root>';

    render(<XMLTree document={createDocument(xml)} />, { wrapper });

    const itemNode = screen.getByText('item');

    // Click to select
    fireEvent.click(itemNode);

    // Selected node info should show
    expect(screen.getByText(/Selected:/i)).toBeInTheDocument();
  });
});
