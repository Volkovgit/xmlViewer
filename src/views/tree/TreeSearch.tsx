import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { XMLNode } from '@/services/xml/TreeBuilder';

export interface TreeSearchProps {
  tree: XMLNode | null;
  onSearchResults: (matchedIds: string[]) => void;
}

export const TreeSearch: React.FC<TreeSearchProps> = ({ tree, onSearchResults }) => {
  const [query, setQuery] = useState('');

  // Collect all nodes for search
  const allNodes = useMemo(() => {
    if (!tree) return [];

    const collectNodes = (node: XMLNode): XMLNode[] => {
      const nodes = [node];
      node.children.forEach(child => {
        nodes.push(...collectNodes(child));
      });
      return nodes;
    };

    return collectNodes(tree);
  }, [tree]);

  // Fuse.js instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allNodes, {
      keys: ['name', 'value'],
      threshold: 0.3,
      ignoreLocation: true
    });
  }, [allNodes]);

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      onSearchResults([]);
      return;
    }

    const results = fuse.search(query);
    const matchedIds = results.map(result => result.item.id);
    onSearchResults(matchedIds);
  }, [query, fuse, onSearchResults]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="tree-search">
      <input
        type="text"
        className="tree-search-input"
        placeholder="Search nodes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search tree nodes"
      />
      {query && (
        <button
          className="tree-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};
