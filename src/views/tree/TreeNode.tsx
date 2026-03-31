import React, { useState } from 'react';
import { XMLNode } from '@/services/xml/TreeBuilder';
import { useTreeDragDrop } from './TreeDragDrop';
import { TreeContextMenu } from './TreeContextMenu';
import './XMLTree.css';

/**
 * TreeNode component props
 */
interface TreeNodeProps {
  /** The XML node to render */
  node: XMLNode;
  /** Nesting level for indentation */
  level: number;
  /** Set of expanded node IDs */
  expandedNodes: Set<string>;
  /** Callback when node is toggled */
  onToggle?: (node: XMLNode) => void;
  /** Callback when node is selected */
  onSelect?: (node: XMLNode) => void;
  /** Currently selected node ID */
  selectedNodeId?: string;
  /** Callback when node is dropped on this node */
  onDrop?: (draggedNode: XMLNode, targetNode: XMLNode) => void;
  /** Set of matched node IDs from search */
  matchedNodeIds?: Set<string>;
}

/**
 * TreeNode Component
 *
 * Recursive component for rendering XML tree nodes.
 * Displays node name, value, attributes, and handles expand/collapse.
 *
 * @example
 * ```tsx
 * <TreeNode
 *   node={xmlNode}
 *   level={0}
 *   expanded={true}
 *   onToggle={handleToggle}
 *   onSelect={handleSelect}
 * />
 * ```
 */
export function TreeNode({
  node,
  level,
  expandedNodes,
  onToggle,
  onSelect,
  selectedNodeId,
  onDrop,
  matchedNodeIds,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const hasAttributes = Object.keys(node.attributes).length > 0;
  const paddingLeft = `${level * 20}px`;
  const isSelected = selectedNodeId === node.id;
  const expanded = expandedNodes.has(node.id);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  // Drag-drop functionality - always enabled but no-op without onDrop
  const { dragRef, dropRef, isDragging, isOver } = useTreeDragDrop({
    node,
    onDrop: onDrop ?? (() => {})
  });

  // Combine refs for drag and drop
  const combinedRef = (element: HTMLDivElement | null) => {
    dragRef(element);
    dropRef(element);
  };

  const handleClick = () => {
    onSelect?.(node);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(node);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasChildren) {
        onToggle?.(node);
      }
      onSelect?.(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  const isHighlighted = matchedNodeIds?.has(node.id);
  const isDragEnabled = !!onDrop;

  return (
    <div>
      <div
        ref={combinedRef}
        className={`tree-node ${isSelected ? 'selected' : ''} ${isDragEnabled && isDragging ? 'dragging' : ''} ${isDragEnabled && isOver ? 'drop-target' : ''} ${isHighlighted ? 'search-highlight' : ''}`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        role="treeitem"
        aria-expanded={expanded}
        aria-selected={isSelected}
        tabIndex={0}
      >
        {hasChildren && (
          <button
            className="toggle-button"
            onClick={handleToggle}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            type="button"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="toggle-spacer" />}

        <span className="node-name">{node.name}</span>

        {node.value && !hasChildren && (
          <span className="node-value">: {node.value}</span>
        )}

        {hasAttributes && !expanded && (
          <span className="node-attributes">
            {Object.entries(node.attributes).map(([key, value]) => (
              <span key={key} className="attribute">
                <span className="attr-name">{key}</span>
                <span className="attr-equals">=</span>
                <span className="attr-value">"{value}"</span>
              </span>
            ))}
          </span>
        )}

        {node.type !== 'element' && (
          <span className="node-type">({node.type})</span>
        )}
      </div>

      {contextMenu.visible && (
        <TreeContextMenu
          node={node}
          position={contextMenu}
          visible={contextMenu.visible}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
          onAddChild={(n) => {
            // Will be handled by parent
            console.log('Add child to', n.id);
          }}
          onEdit={(n) => {
            // Will be handled by parent
            console.log('Edit', n.id);
          }}
          onDelete={(n) => {
            // Will be handled by parent
            console.log('Delete', n.id);
          }}
          onDuplicate={(n) => {
            // Will be handled by parent
            console.log('Duplicate', n.id);
          }}
        />
      )}

      {hasChildren && expanded && (
        <div className="tree-node-children" role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              onDrop={onDrop}
              matchedNodeIds={matchedNodeIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
