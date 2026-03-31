import { useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { XMLNode } from '@/services/xml/TreeBuilder';

export interface DragItem {
  node: XMLNode;
  type: string;
}

export interface UseTreeDragDropProps {
  node: XMLNode;
  onDrop: (draggedNode: XMLNode, targetNode: XMLNode) => void;
}

export interface UseTreeDragDropResult {
  dragRef: (element: HTMLElement | null) => void;
  dropRef: (element: HTMLElement | null) => void;
  isDragging: boolean;
  isOver: boolean;
  canDrop: boolean;
  handleDrop: (draggedNode: XMLNode) => void;
}

const ITEM_TYPE = 'TREE_NODE';

/**
 * Custom hook for tree node drag-drop functionality
 */
export function useTreeDragDrop({
  node,
  onDrop
}: UseTreeDragDropProps): UseTreeDragDropResult {
  const dragCollected = useDrag({
    type: ITEM_TYPE,
    item: { node, type: ITEM_TYPE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const dropCollected = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      handleDrop(item.node);
    },
    canDrop: (item: DragItem) => {
      // Cannot drop into self or ancestors
      return !isNodeOrDescendant(item.node, node);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const handleDrop = useCallback(
    (draggedNode: XMLNode) => {
      if (!isNodeOrDescendant(draggedNode, node)) {
        onDrop(draggedNode, node);
      }
    },
    [node, onDrop]
  );

  return {
    dragRef: dragCollected[1],
    dropRef: dropCollected[1],
    isDragging: dragCollected[0].isDragging,
    isOver: dropCollected[0].isOver,
    canDrop: dropCollected[0].canDrop,
    handleDrop
  };
}

/**
 * Check if target is the same as node or a descendant
 */
function isNodeOrDescendant(node: XMLNode, target: XMLNode): boolean {
  if (node.id === target.id) return true;

  for (const child of node.children) {
    if (isNodeOrDescendant(child, target)) return true;
  }

  return false;
}
