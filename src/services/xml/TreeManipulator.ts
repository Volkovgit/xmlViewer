import { XMLNode } from './TreeBuilder';

export class TreeManipulator {
  /**
   * Add a child node to parent
   */
  addChild(parent: XMLNode, child: XMLNode): XMLNode {
    return {
      ...parent,
      children: [...parent.children, child]
    };
  }

  /**
   * Remove node by ID (recursive)
   */
  removeNode(root: XMLNode, nodeId: string): XMLNode {
    if (root.id === nodeId) {
      throw new Error('Cannot remove root node');
    }

    const removeInChildren = (nodes: XMLNode[]): XMLNode[] => {
      return nodes
        .filter(node => node.id !== nodeId)
        .map(node => ({
          ...node,
          children: removeInChildren(node.children)
        }));
    };

    return {
      ...root,
      children: removeInChildren(root.children)
    };
  }

  /**
   * Move node to new index in its sibling list
   */
  moveNode(root: XMLNode, nodeId: string, newIndex: number): XMLNode {
    const moveInChildren = (nodes: XMLNode[]): XMLNode[] => {
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        return nodes.map(node => ({
          ...node,
          children: moveInChildren(node.children)
        }));
      }

      const newNodes = [...nodes];
      const [movedNode] = newNodes.splice(nodeIndex, 1);
      newNodes.splice(newIndex, 0, movedNode);
      return newNodes;
    };

    return {
      ...root,
      children: moveInChildren(root.children)
    };
  }

  /**
   * Duplicate node with new ID
   */
  duplicateNode(root: XMLNode, nodeId: string): XMLNode {
    const duplicateInChildren = (nodes: XMLNode[]): XMLNode[] => {
      const nodeIndex = nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        return nodes.map(node => ({
          ...node,
          children: duplicateInChildren(node.children)
        }));
      }

      const nodeToDup = nodes[nodeIndex];
      const duplicate: XMLNode = {
        ...nodeToDup,
        id: `${nodeToDup.id}-copy-${Date.now()}`,
        children: nodeToDup.children.map(child => ({ ...child }))
      };

      const newNodes = [...nodes];
      newNodes.splice(nodeIndex + 1, 0, duplicate);
      return newNodes;
    };

    return {
      ...root,
      children: duplicateInChildren(root.children)
    };
  }

  /**
   * Find node by ID (recursive)
   */
  findNode(root: XMLNode, nodeId: string): XMLNode | null {
    if (root.id === nodeId) return root;

    for (const child of root.children) {
      const found = this.findNode(child, nodeId);
      if (found) return found;
    }

    return null;
  }

  /**
   * Serialize tree back to XML string
   */
  toXML(node: XMLNode, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let xml = '';

    // Opening tag with attributes
    const attrs = Object.entries(node.attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    xml += `${spaces}<${node.name}${attrs}`;

    // Self-closing if no content
    if (!node.value && node.children.length === 0) {
      xml += '/>\n';
      return xml;
    }

    xml += '>';

    // Text content
    if (node.value) {
      xml += node.value;
    }

    // Children
    if (node.children.length > 0) {
      xml += '\n';
      node.children.forEach(child => {
        xml += this.toXML(child, indent + 1);
      });
      xml += spaces;
    }

    // Closing tag
    xml += `</${node.name}>\n`;
    return xml;
  }

  /**
   * Update node properties
   */
  updateNode(root: XMLNode, nodeId: string, updates: Partial<XMLNode>): XMLNode {
    if (root.id === nodeId) {
      return { ...root, ...updates };
    }

    return {
      ...root,
      children: root.children.map(child =>
        child.id === nodeId || this.hasChildWithId(child, nodeId)
          ? this.updateNode(child, nodeId, updates)
          : child
      )
    };
  }

  private hasChildWithId(node: XMLNode, nodeId: string): boolean {
    return node.children.some(c => c.id === nodeId || this.hasChildWithId(c, nodeId));
  }
}

export const treeManipulator = new TreeManipulator();
