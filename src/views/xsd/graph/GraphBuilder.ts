import type { XSDSchema, XSDElement } from '@/services/xsd';
import type { Node, Edge } from 'reactflow';

export interface GraphBuildResult {
  nodes: Node[];
  edges: Edge[];
}

export class GraphBuilder {
  buildGraph(schema: XSDSchema, elementName: string, maxDepth: number = 5): GraphBuildResult {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const visited = new Set<string>();

    // Find the element
    const element = schema.elements.find(el => el.name === elementName);
    if (!element) {
      return { nodes: [], edges: [] };
    }

    // Build element node
    this.buildElementNode(element, schema, nodes, edges, visited, 0, maxDepth);

    return { nodes, edges };
  }

  private buildElementNode(
    element: XSDElement,
    schema: XSDSchema,
    nodes: Node[],
    edges: Edge[],
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): void {
    const nodeId = `element:${element.name}`;
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Create element node
    nodes.push({
      id: nodeId,
      type: 'elementNode',
      position: { x: 0, y: 0 },
      data: { element }
    });

    // Create reference edge to type
    if (element.type && !element.type.startsWith('xs:')) {
      const typeId = `type:${element.type}`;
      edges.push({
        id: `${nodeId}-${typeId}`,
        source: nodeId,
        target: typeId,
        type: 'reference',
        label: '<<type>>',
        labelStyle: { fill: '#ff9800', fontWeight: 700 },
        style: { stroke: '#ff9800', strokeWidth: 2 }
      });

      // Build type node
      this.buildTypeNode(element.type, schema, nodes, edges, visited, currentDepth + 1, maxDepth);
    }
  }

  private buildTypeNode(
    typeName: string,
    schema: XSDSchema,
    nodes: Node[],
    edges: Edge[],
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): void {
    if (currentDepth > maxDepth) return;

    const nodeId = `type:${typeName}`;
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Find type in complexTypes or simpleTypes
    const complexType = schema.complexTypes.find(t => t.name === typeName);
    const simpleType = schema.simpleTypes.find(t => t.name === typeName);

    if (complexType) {
      nodes.push({
        id: nodeId,
        type: 'complexTypeNode',
        position: { x: 0, y: 0 },
        data: { type: complexType }
      });

      // Recursively build child elements
      complexType.elements.forEach(childElement => {
        const childNodeId = `element:${childElement.name}`;
        edges.push({
          id: `${nodeId}-${childNodeId}`,
          source: nodeId,
          target: childNodeId,
          type: 'composition',
          label: `[${childElement.occurrence.minOccurs}..${childElement.occurrence.maxOccurs}]`,
          labelStyle: { fill: '#2196f3', fontWeight: 700 },
          style: { stroke: '#2196f3', strokeWidth: 2 }
        });

        this.buildElementNode(childElement, schema, nodes, edges, visited, currentDepth + 1, maxDepth);
      });
    } else if (simpleType) {
      nodes.push({
        id: nodeId,
        type: 'simpleTypeNode',
        position: { x: 0, y: 0 },
        data: { type: simpleType }
      });
    }
  }
}
