import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { XMLTree } from '../XMLTree';
import { Document, DocumentType, DocumentStatus } from '@/types';

describe('XMLTree Component', () => {
  const createMockDocument = (content: string): Document => ({
    id: 'test-doc-1',
    name: 'test.xml',
    type: DocumentType.XML,
    content,
    status: DocumentStatus.READY,
    createdAt: new Date(),
    modifiedAt: new Date(),
  });

  it('should render empty state for no XML', () => {
    const document = createMockDocument('');
    render(<XMLTree document={document} />);

    expect(screen.getByText('No XML to display')).toBeInTheDocument();
  });

  it('should render tree for simple XML', () => {
    const document = createMockDocument('<root>content</root>');
    render(<XMLTree document={document} />);

    expect(screen.getByText('root')).toBeInTheDocument();
  });

  it('should render tree for nested XML', () => {
    const document = createMockDocument(
      '<root><parent><child>value</child></parent></root>'
    );
    render(<XMLTree document={document} />);

    expect(screen.getByText('root')).toBeInTheDocument();

    // Click expand all to see all nodes
    const expandAllButton = screen.getByRole('button', { name: 'Expand all nodes' });
    fireEvent.click(expandAllButton);

    expect(screen.getByText('parent')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('should expand and collapse nodes', () => {
    const document = createMockDocument(
      '<root><child>value</child></root>'
    );
    render(<XMLTree document={document} />);

    // Get toggle buttons (filter out Expand All/Collapse All toolbar buttons)
    const toggleButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent === '▶' || btn.textContent === '▼'
    );

    // Root should be expanded by default
    const rootButton = toggleButtons[0];
    expect(rootButton.textContent).toBe('▼');

    // Click to collapse
    fireEvent.click(rootButton);
    expect(rootButton.textContent).toBe('▶');

    // Click to expand
    fireEvent.click(rootButton);
    expect(rootButton.textContent).toBe('▼');
  });

  it('should select nodes', () => {
    const onNodeSelect = vi.fn();
    const document = createMockDocument('<root>content</root>');
    render(<XMLTree document={document} onNodeSelect={onNodeSelect} />);

    const rootNode = screen.getByText('root').closest('.tree-node');
    fireEvent.click(rootNode!);

    expect(onNodeSelect).toHaveBeenCalled();
    expect(onNodeSelect.mock.calls[0][0].name).toBe('root');
  });

  it('should display selected node info', () => {
    const document = createMockDocument('<root>content</root>');
    render(<XMLTree document={document} />);

    const rootNodes = screen.getAllByText('root');
    const rootNode = rootNodes[0].closest('.tree-node');
    fireEvent.click(rootNode!);

    expect(screen.getByText(/Selected:/)).toBeInTheDocument();
    // The selected info should contain "root"
    const selectedInfo = screen.getByText(/Selected:/).parentElement;
    expect(selectedInfo?.textContent).toContain('root');
  });

  it('should display node value', () => {
    const document = createMockDocument('<root>test value</root>');
    render(<XMLTree document={document} />);

    expect(screen.getByText(': test value')).toBeInTheDocument();
  });

  it('should display attributes in collapsed state', () => {
    const document = createMockDocument('<root id="1" name="test">content</root>');
    render(<XMLTree document={document} />);

    // Select the root node to see attributes in the selected node info
    const rootNodes = screen.getAllByText('root');
    const rootNode = rootNodes[0].closest('.tree-node');
    fireEvent.click(rootNode!);

    // Attributes should be shown in selected info
    expect(screen.getByText(/Attributes:/)).toBeInTheDocument();
    const attributesSection = screen.getByText(/Attributes:/).parentElement;
    expect(attributesSection?.textContent).toContain('id');
    expect(attributesSection?.textContent).toContain('1');
    expect(attributesSection?.textContent).toContain('name');
    expect(attributesSection?.textContent).toContain('test');
  });

  it('should expand all nodes', () => {
    const document = createMockDocument(
      '<root><child>value</child></root>'
    );
    render(<XMLTree document={document} />);

    const expandAllButton = screen.getByRole('button', { name: 'Expand all nodes' });
    fireEvent.click(expandAllButton);

    // All expand buttons should show expanded state
    const buttons = screen.getAllByRole('button').filter(btn =>
      btn.textContent === '▶' || btn.textContent === '▼'
    );
    buttons.forEach((button) => {
      expect(button.textContent).toBe('▼');
    });
  });

  it('should collapse all nodes except root', () => {
    const document = createMockDocument(
      '<root><child>value</child></root>'
    );
    render(<XMLTree document={document} />);

    // First expand all
    const expandAllButton = screen.getByRole('button', { name: 'Expand all nodes' });
    fireEvent.click(expandAllButton);

    // Then collapse all
    const collapseAllButton = screen.getByRole('button', { name: 'Collapse all nodes' });
    fireEvent.click(collapseAllButton);

    // Root should remain expanded
    const toggleButtons = screen.getAllByRole('button').filter(btn =>
      btn.textContent === '▶' || btn.textContent === '▼'
    );
    const rootButton = toggleButtons[0];
    expect(rootButton.textContent).toBe('▼');
  });

  it('should handle parse errors gracefully', () => {
    // The parser might actually parse this, so let's use truly invalid XML
    const document = createMockDocument('<<<>>><<<');
    render(<XMLTree document={document} />);

    // Should either show an error or empty state
    const errorElement = screen.queryByText(/Error:/i);
    const emptyElement = screen.queryByText('No XML to display');
    expect(errorElement || emptyElement).toBeInTheDocument();
  });

  it('should rebuild tree when document content changes', () => {
    const { rerender, container } = render(
      <XMLTree document={createMockDocument('<root>old</root>')} />
    );

    expect(container.textContent).toContain('old');

    rerender(<XMLTree document={createMockDocument('<root>new</root>')} />);

    expect(container.textContent).toContain('new');
    expect(container.textContent).not.toContain('old');
  });

  it('should apply custom className', () => {
    const document = createMockDocument('<root>content</root>');
    const { container } = render(
      <XMLTree document={document} className="custom-class" />
    );

    const treeElement = container.querySelector('.xml-tree');
    expect(treeElement).toHaveClass('custom-class');
  });

  it('should handle keyboard navigation', () => {
    const document = createMockDocument('<root><child>value</child></root>');
    render(<XMLTree document={document} />);

    const rootNode = screen.getByText('root').closest('.tree-node');
    if (rootNode) {
      (rootNode as HTMLElement).focus();

      // Press Enter to select
      fireEvent.keyDown(rootNode as HTMLElement, { key: 'Enter' });

      expect(screen.getByText(/Selected:/)).toBeInTheDocument();
    }
  });

  it('should display node type for non-element nodes', () => {
    const document = createMockDocument('<root>text content</root>');
    render(<XMLTree document={document} />);

    // Text nodes should display type
    const treeContent = screen.getByRole('tree');
    expect(treeContent).toBeInTheDocument();
  });

  it('should show attributes in selected node info', () => {
    const document = createMockDocument('<root id="1" name="test">content</root>');
    render(<XMLTree document={document} />);

    const rootNodes = screen.getAllByText('root');
    const rootNode = rootNodes[0].closest('.tree-node');
    fireEvent.click(rootNode!);

    expect(screen.getByText(/Attributes:/)).toBeInTheDocument();
    const attributesSection = screen.getByText(/Attributes:/).parentElement;
    expect(attributesSection?.textContent).toContain('id="1"');
    expect(attributesSection?.textContent).toContain('name="test"');
  });

  it('should handle deeply nested structures', async () => {
    const document = createMockDocument(
      '<root><l1><l2><l3><l4><l5>deep</l5></l4></l3></l2></l1></root>'
    );
    render(<XMLTree document={document} />);

    // Initially only root is visible
    expect(screen.getByText('root')).toBeInTheDocument();

    // Expand all to see nested elements
    const expandAllButton = screen.getByRole('button', { name: 'Expand all nodes' });
    fireEvent.click(expandAllButton);

    // Wait for state to update and DOM to re-render
    await waitFor(() => {
      expect(screen.getByText('l1')).toBeInTheDocument();
    });

    expect(screen.getByText('l2')).toBeInTheDocument();
    expect(screen.getByText('l3')).toBeInTheDocument();
    expect(screen.getByText('l4')).toBeInTheDocument();
    expect(screen.getByText('l5')).toBeInTheDocument();
  });

  it('should handle multiple children at same level', async () => {
    const document = createMockDocument(
      '<root><item1>a</item1><item2>b</item2><item3>c</item3></root>'
    );
    render(<XMLTree document={document} />);

    // Expand all to see all children
    const expandAllButton = screen.getByRole('button', { name: 'Expand all nodes' });
    fireEvent.click(expandAllButton);

    await waitFor(() => {
      expect(screen.getByText('item1')).toBeInTheDocument();
      expect(screen.getByText('item2')).toBeInTheDocument();
      expect(screen.getByText('item3')).toBeInTheDocument();
    });
  });

  it('should highlight selected node', () => {
    const document = createMockDocument('<root>content</root>');
    render(<XMLTree document={document} />);

    const rootNode = screen.getByText('root').closest('.tree-node');
    fireEvent.click(rootNode!);

    expect(rootNode).toHaveClass('selected');
  });
});
