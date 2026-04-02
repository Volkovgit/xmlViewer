import { describe, it, expect } from 'vitest';
import { GraphLayoutEngine } from '../GraphLayoutEngine';
import type { Node, Edge } from 'reactflow';

describe('GraphLayoutEngine', () => {
  it('should layout nodes left-to-right using dagre', () => {
    const nodes: Node[] = [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
    ];
    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
    ];

    const engine = new GraphLayoutEngine();
    const layouted = engine.layout(nodes, edges, { direction: 'LR' });

    expect(layouted).toHaveLength(2);
    expect(layouted[0].position.x).toBeLessThan(layouted[1].position.x);
  });

  it('should calculate positions with custom spacing', () => {
    const nodes: Node[] = [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    ];
    const edges: Edge[] = [];

    const engine = new GraphLayoutEngine();
    const layouted = engine.layout(nodes, edges, {
      direction: 'LR',
      nodeSep: 100,
      rankSep: 200
    });

    expect(layouted[0].position).toBeDefined();
    expect(layouted[0].position.x).toBeGreaterThanOrEqual(0);
  });
});
