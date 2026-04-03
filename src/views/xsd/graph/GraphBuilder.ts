import type { XSDSchema, XSDElement, XSDComplexType, XSDSimpleType } from '@/services/xsd';
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

    // Cycle detection
    if (visited.has(nodeId)) {
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

    // Handle inline complexType/simpleType or reference to named type
    if (element.complexType) {
      // Element has inline anonymous complexType
      const typeId = `type:${element.name}Type`;
      edges.push({
        id: `${nodeId}-${typeId}`,
        source: nodeId,
        target: typeId,
        type: 'reference',
        label: '<<inline type>>',
        labelStyle: { fill: '#ff9800', fontWeight: 700 },
        style: { stroke: '#ff9800', strokeWidth: 2, strokeDasharray: '5,5' }
      });
      this.buildInlineComplexTypeNode(element.complexType, element.name, schema, nodes, edges, visited, currentDepth + 1, maxDepth);
    } else if (element.simpleType) {
      // Element has inline anonymous simpleType
      const typeId = `type:${element.name}Type`;
      edges.push({
        id: `${nodeId}-${typeId}`,
        source: nodeId,
        target: typeId,
        type: 'reference',
        label: '<<inline type>>',
        labelStyle: { fill: '#ff9800', fontWeight: 700 },
        style: { stroke: '#ff9800', strokeWidth: 2, strokeDasharray: '5,5' }
      });
      this.buildInlineSimpleTypeNode(element.simpleType, element.name, nodes);
    } else if (element.type) {
      // Element references a named type
      // Strip namespace prefix if present (e.g., "tns:MyType" -> "MyType", "xs:string" -> "string")
      const typeName = this.stripNamespacePrefix(element.type);

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
    if (currentDepth > maxDepth) {
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
      this.createCircularRefNode(nodeId, nodes);
      return;
    }
    visited.add(nodeId);

    // Find type in complexTypes or simpleTypes
    const complexType = schema.complexTypes.find(t => t.name === typeName);
    const simpleType = schema.simpleTypes.find(t => t.name === typeName);

    // Missing type handling
    if (!complexType && !simpleType) {
      if (!this.isBuiltInType(typeName)) {
        this.createMissingTypeNode(typeName, nodes);
      }
      return;
    }

    if (complexType) {
      // Check if node already exists (for shared types like AddressType used by ShipTo and BillTo)
      const existingNode = nodes.find(n => n.id === nodeId);
      if (existingNode) {
        this.createCircularRefNode(nodeId, nodes);
        return;
      }

      nodes.push({
        id: nodeId,
        type: 'complexTypeNode',
        position: { x: 0, y: 0 },
        data: { type: complexType }
      });

      // Recursively build child elements
      complexType.elements.forEach(childElement => {
        // Strip namespace prefix from child element type if present for lookup
        const childElementType = this.stripNamespacePrefix(childElement.type);

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
        this.createCircularRefNode(nodeId, nodes);
        return;
      }

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

  private buildInlineComplexTypeNode(
    complexType: XSDComplexType,
    elementName: string,
    schema: XSDSchema,
    nodes: Node[],
    edges: Edge[],
    visited: Set<string>,
    currentDepth: number,
    maxDepth: number
  ): void {
    const nodeId = `type:${elementName}Type`;

    // Cycle detection
    if (visited.has(nodeId)) {
      this.createCircularRefNode(nodeId, nodes);
      return;
    }
    visited.add(nodeId);

    nodes.push({
      id: nodeId,
      type: 'complexTypeNode',
      position: { x: 0, y: 0 },
      data: { type: complexType }
    });

    // Recursively build child elements
    complexType.elements.forEach(childElement => {
      // Strip namespace prefix from child element type if present for lookup
      const childElementType = this.stripNamespacePrefix(childElement.type);

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
  }

  private buildInlineSimpleTypeNode(
    simpleType: XSDSimpleType,
    elementName: string,
    nodes: Node[]
  ): void {
    const nodeId = `type:${elementName}Type`;

    nodes.push({
      id: nodeId,
      type: 'simpleTypeNode',
      position: { x: 0, y: 0 },
      data: { type: simpleType }
    });
  }
}
