import { useEffect, useState, useCallback } from 'react';
import { XMLNode, treeBuilder } from '@/services/xml/TreeBuilder';
import { treeManipulator } from '@/services/xml/TreeManipulator';
import { Document } from '@/types';
import { TreeNode } from './TreeNode';
import { TreeSearch } from './TreeSearch';
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
  const [matchedNodeIds, setMatchedNodeIds] = useState<Set<string>>(new Set());

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

  // Node manipulation callbacks
  const handleDrop = useCallback((draggedNode: XMLNode, targetNode: XMLNode) => {
    if (!tree) return;

    try {
      // Remove from old location
      let updatedTree = treeManipulator.removeNode(tree, draggedNode.id);
      // Add to new location
      updatedTree = treeManipulator.addChild(targetNode, draggedNode);
      setTree(updatedTree);

      // Expand target to show dropped node
      setExpandedNodes(prev => new Set(prev).add(targetNode.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Drop failed');
    }
  }, [tree]);

  const handleAddChild = useCallback((parent: XMLNode) => {
    if (!tree) return;

    const newChild: XMLNode = {
      id: `node-${Date.now()}`,
      name: 'newElement',
      attributes: {},
      children: [],
      type: 'element'
    };

    const updatedTree = treeManipulator.addChild(parent, newChild);
    setTree(updatedTree);
    setExpandedNodes(prev => new Set(prev).add(parent.id));
  }, [tree]);

  const handleEditNode = useCallback((node: XMLNode) => {
    // TODO: Implement edit dialog
    alert(`Edit node: ${node.name}`);
  }, []);

  const handleDeleteNode = useCallback((node: XMLNode) => {
    if (!tree) return;

    const confirmed = confirm(`Delete node "${node.name}"?`);
    if (!confirmed) return;

    try {
      const updatedTree = treeManipulator.removeNode(tree, node.id);
      setTree(updatedTree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [tree]);

  const handleDuplicateNode = useCallback((node: XMLNode) => {
    if (!tree) return;

    const updatedTree = treeManipulator.duplicateNode(tree, node.id);
    setTree(updatedTree);
  }, [tree]);

  // Prevent unused warnings - handlers will be connected to context menu in TreeNode
  void { handleAddChild, handleEditNode, handleDeleteNode, handleDuplicateNode };

  const handleSearchResults = useCallback((matchedIds: string[]) => {
    setMatchedNodeIds(new Set(matchedIds));

    // Expand parents of matched nodes
    if (tree && matchedIds.length > 0) {
      const idsToExpand = new Set(matchedIds);

      const expandParents = (node: XMLNode): boolean => {
        let shouldExpand = false;

        node.children.forEach(child => {
          if (idsToExpand.has(child.id)) {
            shouldExpand = true;
          }
          if (expandParents(child)) {
            shouldExpand = true;
          }
        });

        if (shouldExpand && !expandedNodes.has(node.id)) {
          setExpandedNodes(prev => new Set(prev).add(node.id));
        }

        return shouldExpand;
      };

      expandParents(tree);
    }
  }, [tree, expandedNodes]);

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
        <TreeSearch tree={tree} onSearchResults={handleSearchResults} />
        <div className="tree-toolbar-actions">
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
      </div>

      <div className="tree-content" role="tree" aria-label="XML structure tree">
        <TreeNode
          node={tree}
          level={0}
          expandedNodes={expandedNodes}
          onToggle={handleToggle}
          onSelect={handleSelect}
          selectedNodeId={selectedNode?.id}
          onDrop={handleDrop}
          matchedNodeIds={matchedNodeIds}
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
