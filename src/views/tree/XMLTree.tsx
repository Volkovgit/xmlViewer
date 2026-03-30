import { useEffect, useState } from 'react';
import { XMLNode, treeBuilder } from '@/services/xml/TreeBuilder';
import { Document } from '@/types';
import { TreeNode } from './TreeNode';
import './XMLTree.css';

/**
 * XMLTree component props
 */
interface XMLTreeProps {
  /** The document to display as a tree */
  document: Document;
  /** Callback when a node is selected */
  onNodeSelect?: (node: XMLNode) => void;
  /** CSS class name for custom styling */
  className?: string;
}

/**
 * XMLTree Component
 *
 * Displays a hierarchical tree view of XML document structure.
 * Supports expand/collapse, node selection, and automatic tree building.
 *
 * @example
 * ```tsx
 * <XMLTree
 *   document={currentDocument}
 *   onNodeSelect={(node) => console.log('Selected:', node.name)}
 * />
 * ```
 */
export function XMLTree({ document, onNodeSelect, className = '' }: XMLTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [tree, setTree] = useState<XMLNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<XMLNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset ID counter for consistent IDs on document change
    treeBuilder.resetIdCounter();

    // Build tree when document content changes
    try {
      const trimmedContent = document.content.trim();

      // Handle empty content
      if (!trimmedContent) {
        setTree(null);
        setError(null); // No error, just empty
        return;
      }

      const parsedTree = treeBuilder.buildFromXML(trimmedContent);
      if (parsedTree) {
        setTree(parsedTree);
        // Auto-expand root node
        setExpandedNodes(new Set([parsedTree.id]));
        setError(null);
      } else {
        setTree(null);
        setError('Failed to parse XML document');
      }
    } catch (err) {
      setTree(null);
      setError(
        err instanceof Error ? err.message : 'Unknown error occurred'
      );
    }
  }, [document.content]);

  const handleToggle = (node: XMLNode) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  };

  const handleSelect = (node: XMLNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  const handleExpandAll = () => {
    if (!tree) return;

    const collectAllIds = (node: XMLNode): string[] => {
      const ids = [node.id];
      node.children.forEach((child) => {
        ids.push(...collectAllIds(child));
      });
      return ids;
    };

    setExpandedNodes(new Set(collectAllIds(tree)));
  };

  const handleCollapseAll = () => {
    if (!tree) return;
    setExpandedNodes(new Set([tree.id])); // Keep root expanded
  };

  if (error) {
    return (
      <div className={`xml-tree xml-tree-error ${className}`}>
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className={`xml-tree xml-tree-empty ${className}`}>
        <div className="empty-tree">No XML to display</div>
      </div>
    );
  }

  return (
    <div className={`xml-tree ${className}`}>
      <div className="tree-toolbar">
        <button
          onClick={handleExpandAll}
          className="tree-button"
          type="button"
          aria-label="Expand all nodes"
        >
          Expand All
        </button>
        <button
          onClick={handleCollapseAll}
          className="tree-button"
          type="button"
          aria-label="Collapse all nodes"
        >
          Collapse All
        </button>
      </div>

      <div className="tree-content" role="tree" aria-label="XML structure tree">
        <TreeNode
          node={tree}
          level={0}
          expandedNodes={expandedNodes}
          onToggle={handleToggle}
          onSelect={handleSelect}
          selectedNodeId={selectedNode?.id}
        />
      </div>

      {selectedNode && (
        <div className="selected-node-info">
          <strong>Selected:</strong> {selectedNode.name}
          {selectedNode.value && (
            <span className="selected-node-value">
              : {selectedNode.value}
            </span>
          )}
          {Object.keys(selectedNode.attributes).length > 0 && (
            <div className="selected-node-attributes">
              <strong>Attributes:</strong>
              {Object.entries(selectedNode.attributes).map(([key, value]) => (
                <span key={key} className="selected-attribute">
                  {key}="{value}"
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
