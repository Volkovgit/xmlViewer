import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSep: number;
  rankSep: number;
}

export class GraphLayoutEngine {
  layout(nodes: Node[], edges: Edge[], options?: Partial<LayoutOptions>): Node[] {
    const opts: LayoutOptions = {
      direction: 'LR',
      nodeSep: 50,
      rankSep: 100,
      ...options
    };

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: opts.direction,
      nodesep: opts.nodeSep,
      ranksep: opts.rankSep
    });

    // Add nodes to dagre graph
    nodes.forEach(node => {
      g.setNode(node.id, { width: 200, height: 100 });
    });

    // Add edges to dagre graph
    edges.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(g);

    // Apply positions to nodes
    return nodes.map(node => ({
      ...node,
      position: {
        x: g.node(node.id).x - 100, // Center the node (width/2)
        y: g.node(node.id).y - 50   // Center the node (height/2)
      }
    }));
  }
}
