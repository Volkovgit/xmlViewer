import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTreeDragDrop } from '../TreeDragDrop';
import { XMLNode } from '@/services/xml/TreeBuilder';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
}

describe('useTreeDragDrop', () => {
  const mockNode: XMLNode = {
    id: 'test-1',
    name: 'item',
    value: 'Test',
    attributes: {},
    children: [],
    type: 'element'
  };

  it('should initialize with drag and drop refs', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() =>
      useTreeDragDrop({ node: mockNode, onDrop }),
      { wrapper }
    );

    expect(result.current.dragRef).toBeDefined();
    expect(result.current.dropRef).toBeDefined();
    expect(typeof result.current.handleDrop).toBe('function');
  });

  it('should call onDrop when dropping valid node', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() =>
      useTreeDragDrop({ node: mockNode, onDrop }),
      { wrapper }
    );

    const draggedNode: XMLNode = {
      id: 'dragged-1',
      name: 'dragged',
      attributes: {},
      children: [],
      type: 'element'
    };

    result.current.handleDrop(draggedNode);
    expect(onDrop).toHaveBeenCalledWith(draggedNode, mockNode);
  });

  it('should not drop node into itself', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() =>
      useTreeDragDrop({ node: mockNode, onDrop }),
      { wrapper }
    );

    result.current.handleDrop(mockNode);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should not drop node into its descendants', () => {
    const onDrop = vi.fn();
    const childNode: XMLNode = {
      id: 'child-1',
      name: 'child',
      attributes: {},
      children: [],
      type: 'element'
    };

    const parentNode: XMLNode = {
      id: 'parent-1',
      name: 'parent',
      attributes: {},
      children: [childNode],
      type: 'element'
    };

    const { result } = renderHook(() =>
      useTreeDragDrop({ node: childNode, onDrop }),
      { wrapper }
    );

    result.current.handleDrop(parentNode);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should allow dropping sibling node', () => {
    const onDrop = vi.fn();
    const siblingNode: XMLNode = {
      id: 'sibling-1',
      name: 'sibling',
      attributes: {},
      children: [],
      type: 'element'
    };

    const { result } = renderHook(() =>
      useTreeDragDrop({ node: mockNode, onDrop }),
      { wrapper }
    );

    result.current.handleDrop(siblingNode);
    expect(onDrop).toHaveBeenCalledWith(siblingNode, mockNode);
  });
});
