import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreeContextMenu } from '../TreeContextMenu';
import { XMLNode } from '@/services/xml/TreeBuilder';

describe('TreeContextMenu', () => {
  const mockNode: XMLNode = {
    id: 'test-1',
    name: 'item',
    value: 'Test',
    attributes: {},
    children: [],
    type: 'element'
  };

  const mockPosition = { x: 100, y: 100 };

  it('should render menu items when visible', () => {
    render(
      <TreeContextMenu
        node={mockNode}
        position={mockPosition}
        onClose={vi.fn()}
        onAddChild={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(screen.getByText(/Add Child/i)).toBeInTheDocument();
    expect(screen.getByText(/Edit/i)).toBeInTheDocument();
    expect(screen.getByText(/Delete/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate/i)).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    const { container } = render(
      <TreeContextMenu
        node={mockNode}
        position={mockPosition}
        visible={false}
        onClose={vi.fn()}
        onAddChild={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should call onAddChild when Add Child clicked', () => {
    const onAddChild = vi.fn();
    const onClose = vi.fn();
    render(
      <TreeContextMenu
        node={mockNode}
        position={mockPosition}
        onClose={onClose}
        onAddChild={onAddChild}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/Add Child/i));
    expect(onAddChild).toHaveBeenCalledWith(mockNode);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onEdit when Edit clicked', () => {
    const onEdit = vi.fn();
    const onClose = vi.fn();
    render(
      <TreeContextMenu
        node={mockNode}
        position={mockPosition}
        onClose={onClose}
        onAddChild={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/Edit/i));
    expect(onEdit).toHaveBeenCalledWith(mockNode);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onDelete when Delete clicked', () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    render(
      <TreeContextMenu
        node={mockNode}
        position={mockPosition}
        onClose={onClose}
        onAddChild={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onDuplicate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText(/Delete/i));
    expect(onDelete).toHaveBeenCalledWith(mockNode);
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onDuplicate when Duplicate clicked', () => {
    const onDuplicate = vi.fn();
    const onClose = vi.fn();
    render(
      <TreeContextMenu
        node={mockNode}
        position={mockPosition}
        onClose={onClose}
        onAddChild={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={onDuplicate}
      />
    );

    fireEvent.click(screen.getByText(/Duplicate/i));
    expect(onDuplicate).toHaveBeenCalledWith(mockNode);
    expect(onClose).toHaveBeenCalled();
  });
});
