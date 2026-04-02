import type { XSDSchema, XSDElement } from '@/services/xsd';
import type { Node, Edge } from 'reactflow';

export interface GraphBuildResult {
  nodes: Node[];
  edges: Edge[];
}

export class GraphBuilder {
  /**
   * Strip namespace prefix from type name (e.g., "tns:MyType" -> "MyType", "xs:string" -> "string")
   */
  private stripNamespacePrefix(typeName: string): string {
    const colonIndex = typeName.indexOf(':');
    if (colonIndex === -1) {
      return typeName;
    }
    return typeName.substring(colonIndex + 1);
  }

  /**
   * Check if type is a built-in XML Schema type (string, int, date, etc.)
   */
  private isBuiltInType(typeName: string): boolean {
    // Common XML Schema built-in types
    const builtInTypes = [
      'string', 'boolean', 'decimal', 'float', 'double', 'integer', 'int',
      'long', 'short', 'byte', 'nonNegativeInteger', 'positiveInteger',
      'date', 'time', 'dateTime', 'duration', 'gDay', 'gMonth', 'gYear',
      'gMonthDay', 'gYearMonth', 'anyURI', 'QName', 'NOTATION', 'base64Binary',
      'hexBinary', 'anyType', 'anySimpleType', 'ID', 'IDREF', 'IDREFS',
      'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'language', 'Name', 'NCName',
      'normalizedString', 'token', 'unsignedByte', 'unsignedInt', 'unsignedLong',
      'unsignedShort', 'negativeInteger', 'nonPositiveInteger'
    ];

    return builtInTypes.includes(typeName);
  }

  buildGraph(schema: XSDSchema, elementName: string, maxDepth: number = 5): GraphBuildResult {
    console.log('[GraphBuilder] Building graph for element:', elementName);
    console.log('[GraphBuilder] Schema elements:', schema.elements.map(e => e.name));
    console.log('[GraphBuilder] Schema complexTypes:', schema.complexTypes.map(t => t.name));
    console.log('[GraphBuilder] Schema simpleTypes:', schema.simpleTypes.map(t => t.name));

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const visited = new Set<string>();

    // Find the element
    const element = schema.elements.find(el => el.name === elementName);
    if (!element) {
      console.error('[GraphBuilder] Element not found:', elementName);
      return { nodes: [], edges: [] };
    }

    console.log('[GraphBuilder] Found element:', element);
    // Build element node
    this.buildElementNode(element, schema, nodes, edges, visited, 0, maxDepth);

    console.log('[GraphBuilder] Final result - nodes:', nodes.length, 'edges:', edges.length);
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
    console.log(`[GraphBuilder] buildElementNode: ${element.name}, type: ${element.type}, depth: ${currentDepth}`);

    // Cycle detection
    if (visited.has(nodeId)) {
      console.log(`[GraphBuilder] Circular reference detected for ${nodeId}`);
      this.createCircularRefNode(nodeId, nodes);
      return;
    }
    visited.add(nodeId);

    // Create element node
    nodes.push({
      id: nodeId,
      type: 'elementNode',
      position: { x: 0, y: 0 },
      data: { element }
    });

    // Create reference edge to type
    if (element.type) {
      console.log(`[GraphBuilder] Element ${element.name} has type: ${element.type}`);

      // Strip namespace prefix if present (e.g., "tns:MyType" -> "MyType", "xs:string" -> "string")
      const typeName = this.stripNamespacePrefix(element.type);
      console.log(`[GraphBuilder] Stripped namespace prefix: ${element.type} -> ${typeName}`);

      // Check if it's a built-in XML Schema type
      const isBuiltIn = element.type.startsWith('xs:') || this.isBuiltInType(typeName);

      if (!isBuiltIn) {
        const typeId = `type:${typeName}`;
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
        this.buildTypeNode(typeName, schema, nodes, edges, visited, currentDepth + 1, maxDepth);
      } else {
        console.log(`[GraphBuilder] Element ${element.name} has built-in type: ${typeName}, skipping type node`);
      }
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
    console.log(`[GraphBuilder] buildTypeNode: ${typeName}, depth: ${currentDepth}`);

    if (currentDepth > maxDepth) {
      console.log(`[GraphBuilder] Max depth ${maxDepth} exceeded for ${typeName}`);
      // Create truncated node for depth limit
      const truncatedId = `type:${typeName}:truncated`;
      if (!nodes.find(n => n.id === truncatedId)) {
        nodes.push({
          id: truncatedId,
          type: 'truncatedNode',
          position: { x: 0, y: 0 },
          data: {
            label: `... (${typeName} too deep, maxDepth=${maxDepth})`,
            isTruncated: true
          }
        });
      }
      return;
    }

    const nodeId = `type:${typeName}`;

    // Cycle detection
    if (visited.has(nodeId)) {
      console.log(`[GraphBuilder] Circular reference detected for ${nodeId}`);
      this.createCircularRefNode(nodeId, nodes);
      return;
    }
    visited.add(nodeId);

    // Find type in complexTypes or simpleTypes
    const complexType = schema.complexTypes.find(t => t.name === typeName);
    const simpleType = schema.simpleTypes.find(t => t.name === typeName);

    console.log(`[GraphBuilder] Looking for type ${typeName}:`, {
      complexType: complexType ? 'found' : 'not found',
      simpleType: simpleType ? 'found' : 'not found'
    });

    // Missing type handling
    if (!complexType && !simpleType) {
      if (!this.isBuiltInType(typeName)) {
        console.error(`[GraphBuilder] Type ${typeName} not found in schema`);
        this.createMissingTypeNode(typeName, nodes);
        return;
      } else {
        console.log(`[GraphBuilder] Type ${typeName} is built-in, not creating node`);
        return;
      }
    }

    if (complexType) {
      // Check if node already exists (for shared types like AddressType used by ShipTo and BillTo)
      const existingNode = nodes.find(n => n.id === nodeId);
      if (existingNode) {
        console.log(`[GraphBuilder] Type node ${nodeId} already exists, creating circular ref`);
        this.createCircularRefNode(nodeId, nodes);
        return;
      }

      console.log(`[GraphBuilder] Creating complexTypeNode for ${typeName} with ${complexType.elements.length} child elements`);
      nodes.push({
        id: nodeId,
        type: 'complexTypeNode',
        position: { x: 0, y: 0 },
        data: { type: complexType }
      });

      // Recursively build child elements
      complexType.elements.forEach(childElement => {
        console.log(`[GraphBuilder] Adding child element ${childElement.name} to ${typeName}`);

        // Strip namespace prefix from child element type if present for lookup
        const childElementType = childElement.type
          ? this.stripNamespacePrefix(childElement.type)
          : undefined;

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

        // Pass child element with potentially modified type
        this.buildElementNode(
          { ...childElement, type: childElementType },
          schema,
          nodes,
          edges,
          visited,
          currentDepth + 1,
          maxDepth
        );
      });
    } else if (simpleType) {
      // Check if node already exists
      const existingNode = nodes.find(n => n.id === nodeId);
      if (existingNode) {
        console.log(`[GraphBuilder] Simple type node ${nodeId} already exists, creating circular ref`);
        this.createCircularRefNode(nodeId, nodes);
        return;
      }

      console.log(`[GraphBuilder] Creating simpleTypeNode for ${typeName}`);
      nodes.push({
        id: nodeId,
        type: 'simpleTypeNode',
        position: { x: 0, y: 0 },
        data: { type: simpleType }
      });
    }
  }

  private createCircularRefNode(nodeId: string, nodes: Node[]): void {
    const circularId = `${nodeId}:circular`;
    if (!nodes.find(n => n.id === circularId)) {
      const name = nodeId.split(':')[1] || nodeId;
      nodes.push({
        id: circularId,
        type: 'circularRefNode',
        position: { x: 0, y: 0 },
        data: {
          label: `🔄 ${name} (circular reference)`,
          isCircular: true
        }
      });
    }
  }

  private createMissingTypeNode(typeName: string, nodes: Node[]): void {
    const missingId = `type:${typeName}:missing`;
    if (!nodes.find(n => n.id === missingId)) {
      nodes.push({
        id: missingId,
        type: 'missingTypeNode',
        position: { x: 0, y: 0 },
        data: {
          label: `❌ ${typeName} (type not found in schema)`,
          isMissing: true
        }
      });
    }
  }
}
