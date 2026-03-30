import React from 'react';
import { XMLNode } from '@/services/xml/TreeBuilder';
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
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const hasAttributes = Object.keys(node.attributes).length > 0;
  const paddingLeft = `${level * 20}px`;
  const isSelected = selectedNodeId === node.id;
  const expanded = expandedNodes.has(node.id);

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

  return (
    <div>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft }}
        onClick={handleClick}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
