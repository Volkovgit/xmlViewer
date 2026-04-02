# XSD Graph Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interactive graph visualization to XSDVisualizer showing elements, types, and relationships as a layered left-to-right graph using React Flow

**Architecture:** New XSDGraphVisualizer component with GraphBuilder service for dependency traversal, GraphLayoutEngine for dagre layout, custom React Flow node components, and GraphControls for user interaction

**Tech Stack:** React Flow 11.11.0, dagre 0.8.5, TypeScript, React Testing Library

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install reactflow and dagre**

```bash
npm install reactflow dagre
```

Run: `npm list reactflow dagre`
Expected: Both packages listed with correct versions (reactflow@11.11.0, dagre@0.8.5)

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install reactflow and dagre for XSD graph visualization"
```

---

## Task 2: Create GraphLayoutEngine Utility

**Files:**
- Create: `src/views/xsd/graph/GraphLayoutEngine.ts`
- Test: `src/views/xsd/graph/__tests__/GraphLayoutEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/views/xsd/graph/__tests__/GraphLayoutEngine.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/views/xsd/graph/__tests__/GraphLayoutEngine.test.ts`
Expected: FAIL with "GraphLayoutEngine is not defined"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/views/xsd/graph/GraphLayoutEngine.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/views/xsd/graph/__tests__/GraphLayoutEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/xsd/graph/
git commit -m "feat: create GraphLayoutEngine with dagre layout algorithm"
```

---

## Task 3: Create GraphBuilder Service - Basic Structure

**Files:**
- Create: `src/views/xsd/graph/GraphBuilder.ts`
- Test: `src/views/xsd/graph/__tests__/GraphBuilder.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/views/xsd/graph/__tests__/GraphBuilder.test.ts
import { describe, it, expect } from 'vitest';
import { GraphBuilder } from '../GraphBuilder';
import type { XSDSchema } from '@/services/xsd';
import type { Node, Edge } from 'reactflow';

describe('GraphBuilder', () => {
  it('should build simple element graph with type', () => {
    const schema: XSDSchema = {
      targetNamespace: 'http://example.com',
      elements: [
        {
          name: 'PurchaseOrder',
          type: 'PurchaseOrderType',
          occurrence: { minOccurs: 1, maxOccurs: 1 }
        }
      ],
      complexTypes: [
        {
          name: 'PurchaseOrderType',
          elements: [],
          attributes: [],
          mixed: false
        }
      ],
      simpleTypes: [],
      raw: ''
    };

    const builder = new GraphBuilder();
    const result = builder.buildGraph(schema, 'PurchaseOrder');

    expect(result.nodes).toHaveLength(2); // element + type
    expect(result.edges).toHaveLength(1); // reference edge
    expect(result.nodes[0].id).toBe('element:PurchaseOrder');
    expect(result.nodes[1].id).toBe('type:PurchaseOrderType');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/views/xsd/graph/__tests__/GraphBuilder.test.ts`
Expected: FAIL with "GraphBuilder is not defined"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/views/xsd/graph/GraphBuilder.ts
import type { XSDSchema, XSDElement, XSDComplexType, XSDSimpleType } from '@/services/xsd';
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/views/xsd/graph/__tests__/GraphBuilder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/xsd/graph/
git commit -m "feat: create GraphBuilder service for XSD dependency graph"
```

---

## Task 4: Create GraphBuilder - Handle Edge Cases

**Files:**
- Modify: `src/views/xsd/graph/GraphBuilder.ts`
- Modify: `src/views/xsd/graph/__tests__/GraphBuilder.test.ts`

- [ ] **Step 1: Write tests for edge cases**

```typescript
// Add to GraphBuilder.test.ts

it('should detect cyclic dependencies', () => {
  const schema: XSDSchema = {
    targetNamespace: 'http://example.com',
    elements: [
      {
        name: 'TypeA',
        type: 'TypeB',
        occurrence: { minOccurs: 1, maxOccurs: 1 }
      }
    ],
    complexTypes: [
      {
        name: 'TypeA',
        elements: [
          { name: 'child', type: 'TypeB', occurrence: { minOccurs: 1, maxOccurs: 1 } }
        ],
        attributes: [],
        mixed: false
      },
      {
        name: 'TypeB',
        elements: [
          { name: 'parent', type: 'TypeA', occurrence: { minOccurs: 1, maxOccurs: 1 } }
        ],
        attributes: [],
        mixed: false
      }
    ],
    simpleTypes: [],
    raw: ''
  };

  const builder = new GraphBuilder();
  const result = builder.buildGraph(schema, 'TypeA');

  // Should detect cycle and not go infinite
  expect(result.nodes.length).toBeGreaterThan(0);
  expect(result.nodes.length).toBeLessThan(10); // Should terminate
});

it('should handle missing types', () => {
  const schema: XSDSchema = {
    targetNamespace: 'http://example.com',
    elements: [
      {
        name: 'MyElement',
        type: 'MissingType',
        occurrence: { minOccurs: 1, maxOccurs: 1 }
      }
    ],
    complexTypes: [],
    simpleTypes: [],
    raw: ''
  };

  const builder = new GraphBuilder();
  const result = builder.buildGraph(schema, 'MyElement');

  // Should create missing type node
  const missingNode = result.nodes.find(n => n.id === 'type:MissingType:missing');
  expect(missingNode).toBeDefined();
});

it('should limit depth with maxDepth parameter', () => {
  const schema: XSDSchema = {
    targetNamespace: 'http://example.com',
    elements: [
      {
        name: 'Level1',
        type: 'Type1',
        occurrence: { minOccurs: 1, maxOccurs: 1 }
      }
    ],
    complexTypes: [
      {
        name: 'Type1',
        elements: [
          { name: 'Level2', type: 'Type2', occurrence: { minOccurs: 1, maxOccurs: 1 } }
        ],
        attributes: [],
        mixed: false
      },
      {
        name: 'Type2',
        elements: [
          { name: 'Level3', type: 'Type3', occurrence: { minOccurs: 1, maxOccurs: 1 } }
        ],
        attributes: [],
        mixed: false
      },
      {
        name: 'Type3',
        elements: [
          { name: 'Level4', type: 'Type4', occurrence: { minOccurs: 1, maxOccurs: 1 } }
        ],
        attributes: [],
        mixed: false
      },
      {
        name: 'Type4',
        elements: [],
        attributes: [],
        mixed: false
      }
    ],
    simpleTypes: [],
    raw: ''
  };

  const builder = new GraphBuilder();
  const result = builder.buildGraph(schema, 'Level1', 2); // maxDepth = 2

  // Should not go deeper than maxDepth
  expect(result.nodes.length).toBeLessThan(10);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/views/xsd/graph/__tests__/GraphBuilder.test.ts`
Expected: FAIL - cycle detection, missing type handling, and depth limit not implemented

- [ ] **Step 3: Implement edge case handling**

Add to GraphBuilder.ts:

```typescript
private buildElementNode(
  // ... existing params
): void {
  const nodeId = `element:${element.name}`;

  // Cycle detection
  if (visited.has(nodeId)) {
    this.createCircularRefNode(nodeId, nodes);
    return;
  }
  visited.add(nodeId);

  // ... existing element node creation
}

private buildTypeNode(
  // ... existing params
): void {
  if (currentDepth > maxDepth) {
    // Create truncated node
    return;
  }

  const nodeId = `type:${typeName}`;

  // Cycle detection
  if (visited.has(nodeId)) {
    this.createCircularRefNode(nodeId, nodes);
    return;
  }
  visited.add(nodeId);

  // Find type
  const complexType = schema.complexTypes.find(t => t.name === typeName);
  const simpleType = schema.simpleTypes.find(t => t.name === typeName);

  if (!complexType && !simpleType && !typeName.startsWith('xs:')) {
    // Create missing type node
    this.createMissingTypeNode(typeName, nodes);
    return;
  }

  // ... existing type handling
}

private createCircularRefNode(nodeId: string, nodes: Node[]): void {
  if (!nodes.find(n => n.id === `${nodeId}:circular`)) {
    nodes.push({
      id: `${nodeId}:circular`,
      type: 'circularRefNode',
      position: { x: 0, y: 0 },
      data: { label: `🔄 ${nodeId.split(':')[1]} (circular)` }
    });
  }
}

private createMissingTypeNode(typeName: string, nodes: Node[]): void {
  if (!nodes.find(n => n.id === `type:${typeName}:missing`)) {
    nodes.push({
      id: `type:${typeName}:missing`,
      type: 'missingTypeNode',
      position: { x: 0, y: 0 },
      data: { label: `❌ ${typeName} (not found)` }
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/views/xsd/graph/__tests__/GraphBuilder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/xsd/graph/
git commit -m "feat: add cycle detection, missing type handling, and depth limit to GraphBuilder"
```

---

## Task 5: Create Custom Node Component - ElementNode

**Files:**
- Create: `src/views/xsd/graph/nodes/ElementNode.tsx`
- Create: `src/views/xsd/graph/nodes/index.ts`

- [ ] **Step 1: Write the component**

```typescript
// src/views/xsd/graph/nodes/ElementNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { XSDElement } from '@/services/xsd';
import './ElementNode.css';

export interface ElementNodeData {
  element: XSDElement;
}

export function ElementNode({ data }: NodeProps<ElementNodeData>) {
  const { element } = data;

  const occurrenceText = (() => {
    const { minOccurs, maxOccurs } = element.occurrence;
    if (minOccurs === 1 && maxOccurs === 1) return '';
    const max = maxOccurs === 'unbounded' ? '∞' : maxOccurs;
    return `[${minOccurs}..${max}]`;
  })();

  return (
    <div className="graph-element-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <span className="node-icon">📦</span>
        <span className="node-label">{element.name}</span>
      </div>
      {element.type && (
        <div className="node-type">Type: {element.type}</div>
      )}
      {element.complexType && element.complexType.attributes.length > 0 && (
        <div className="node-section">
          <div className="node-section-title">Attributes:</div>
          {element.complexType.attributes.map(attr => (
            <div key={attr.name} className="node-attribute">
              • {attr.name} ({attr.type})
              {attr.use === 'required' && <span className="node-required"> [required]</span>}
              {attr.defaultValue && <span className="node-default"> = "{attr.defaultValue}"</span>}
            </div>
          ))}
        </div>
      )}
      {element.complexType && element.complexType.elements.length > 0 && (
        <div className="node-section">
          <div className="node-section-title">
            Children ({element.complexType.elements.length}):
          </div>
          {element.complexType.elements.map(child => (
            <div key={child.name} className="node-child">
              • {child.name} [{child.occurrence.minOccurs}..{child.occurrence.maxOccurs}]
            </div>
          ))}
        </div>
      )}
      {occurrenceText && <div className="node-occurrence">{occurrenceText}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(ElementNode);
```

- [ ] **Step 2: Create CSS**

```css
/* src/views/xsd/graph/nodes/ElementNode.css */
.graph-element-node {
  background-color: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  margin-bottom: 8px;
}

.node-icon {
  font-size: 16px;
}

.node-label {
  font-size: 14px;
}

.node-type {
  color: #666;
  font-style: italic;
  margin-bottom: 8px;
}

.node-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #bbdefb;
}

.node-section-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.node-attribute,
.node-child {
  padding: 2px 0;
}

.node-required {
  color: #f44336;
  font-weight: bold;
}

.node-default {
  color: #666;
}

.node-occurrence {
  margin-top: 8px;
  color: #2196f3;
  font-weight: bold;
}
```

- [ ] **Step 3: Create index export**

```typescript
// src/views/xsd/graph/nodes/index.ts
export { ElementNode } from './ElementNode';
export type { ElementNodeData } from './ElementNode';
```

- [ ] **Step 4: Commit**

```bash
git add src/views/xsd/graph/nodes/
git commit -m "feat: create ElementNode component with full detail display"
```

---

## Task 6: Create ComplexTypeNode Component

**Files:**
- Create: `src/views/xsd/graph/nodes/ComplexTypeNode.tsx`
- Modify: `src/views/xsd/graph/nodes/index.ts`

- [ ] **Step 1: Write the component**

```typescript
// src/views/xsd/graph/nodes/ComplexTypeNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { XSDComplexType } from '@/services/xsd';
import './ComplexTypeNode.css';

export interface ComplexTypeNodeData {
  type: XSDComplexType;
}

export function ComplexTypeNode({ data }: NodeProps<ComplexTypeNodeData>) {
  const { type } = data;

  return (
    <div className="graph-complextype-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <span className="node-icon">🟦</span>
        <span className="node-label">{type.name}</span>
      </div>
      {type.simpleContentBase && (
        <div className="node-extension">Extension: {type.simpleContentBase}</div>
      )}
      {type.attributes.length > 0 && (
        <div className="node-section">
          <div className="node-section-title">Attributes:</div>
          {type.attributes.map(attr => (
            <div key={attr.name} className="node-attribute">
              • {attr.name} ({attr.type})
              {attr.use === 'required' && <span className="node-required"> [required]</span>}
              {attr.defaultValue && <span className="node-default"> = "{attr.defaultValue}"</span>}
            </div>
          ))}
        </div>
      )}
      {type.elements.length > 0 && (
        <div className="node-section">
          <div className="node-section-title">Elements ({type.elements.length}):</div>
          {type.elements.map(element => (
            <div key={element.name} className="node-child">
              • {element.name} ({element.type}) [{element.occurrence.minOccurs}..{element.occurrence.maxOccurs}]
            </div>
          ))}
        </div>
      )}
      {type.mixed && <div className="node-mixed">mixed content</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(ComplexTypeNode);
```

- [ ] **Step 2: Create CSS**

```css
/* src/views/xsd/graph/nodes/ComplexTypeNode.css */
.graph-complextype-node {
  background-color: #f3e5f5;
  border: 2px solid #9c27b0;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  margin-bottom: 8px;
}

.node-icon {
  font-size: 16px;
}

.node-label {
  font-size: 14px;
}

.node-extension {
  color: #666;
  font-style: italic;
  margin-bottom: 8px;
}

.node-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e1bee7;
}

.node-section-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.node-attribute,
.node-child {
  padding: 2px 0;
}

.node-required {
  color: #f44336;
  font-weight: bold;
}

.node-default {
  color: #666;
}

.node-mixed {
  margin-top: 8px;
  color: #9c27b0;
  font-style: italic;
}
```

- [ ] **Step 3: Update index export**

```typescript
// src/views/xsd/graph/nodes/index.ts
export { ElementNode } from './ElementNode';
export type { ElementNodeData } from './ElementNode';
export { ComplexTypeNode } from './ComplexTypeNode';
export type { ComplexTypeNodeData } from './ComplexTypeNode';
```

- [ ] **Step 4: Commit**

```bash
git add src/views/xsd/graph/nodes/
git commit -m "feat: create ComplexTypeNode component with attribute and element display"
```

---

## Task 7: Create SimpleTypeNode and BuiltInTypeNode Components

**Files:**
- Create: `src/views/xsd/graph/nodes/SimpleTypeNode.tsx`
- Create: `src/views/xsd/graph/nodes/BuiltInTypeNode.tsx`
- Modify: `src/views/xsd/graph/nodes/index.ts`

- [ ] **Step 1: Write SimpleTypeNode**

```typescript
// src/views/xsd/graph/nodes/SimpleTypeNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { XSDSimpleType } from '@/services/xsd';
import './SimpleTypeNode.css';

export interface SimpleTypeNodeData {
  type: XSDSimpleType;
}

export function SimpleTypeNode({ data }: NodeProps<SimpleTypeNodeData>) {
  const { type } = data;

  return (
    <div className="graph-simpletype-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <span className="node-icon">🟩</span>
        <span className="node-label">{type.name}</span>
      </div>
      {type.restriction && (
        <>
          <div className="node-base">Base: {type.restriction.base}</div>
          {type.restriction.pattern && (
            <div className="node-restriction">Pattern: {type.restriction.pattern}</div>
          )}
          {type.restriction.minLength !== undefined && (
            <div className="node-restriction">MinLength: {type.restriction.minLength}</div>
          )}
          {type.restriction.maxLength !== undefined && (
            <div className="node-restriction">MaxLength: {type.restriction.maxLength}</div>
          )}
          {type.restriction.enumerations && type.restriction.enumerations.length > 0 && (
            <div className="node-section">
              <div className="node-section-title">Enumerations:</div>
              {type.restriction.enumerations.map(enumValue => (
                <div key={enumValue} className="node-enum">• {enumValue}</div>
              ))}
            </div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(SimpleTypeNode);
```

- [ ] **Step 2: Create SimpleTypeNode CSS**

```css
/* src/views/xsd/graph/nodes/SimpleTypeNode.css */
.graph-simpletype-node {
  background-color: #e8f5e9;
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  margin-bottom: 8px;
}

.node-icon {
  font-size: 16px;
}

.node-label {
  font-size: 14px;
}

.node-base {
  color: #666;
  font-style: italic;
  margin-bottom: 8px;
}

.node-restriction {
  color: #4caf50;
  margin: 4px 0;
}

.node-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #c8e6c9;
}

.node-section-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.node-enum {
  padding: 2px 0;
}
```

- [ ] **Step 3: Write BuiltInTypeNode**

```typescript
// src/views/xsd/graph/nodes/BuiltInTypeNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './BuiltInTypeNode.css';

export interface BuiltInTypeNodeData {
  typeName: string;
}

export function BuiltInTypeNode({ data }: NodeProps<BuiltInTypeNodeData>) {
  return (
    <div className="graph-builtin-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <span className="node-icon">⚪</span>
        <span className="node-label">{data.typeName}</span>
      </div>
      <div className="node-builtin">(built-in type)</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default memo(BuiltInTypeNode);
```

- [ ] **Step 4: Create BuiltInTypeNode CSS**

```css
/* src/views/xsd/graph/nodes/BuiltInTypeNode.css */
.graph-builtin-node {
  background-color: #fafafa;
  border: 2px solid #9e9e9e;
  border-radius: 8px;
  padding: 8px;
  min-width: 150px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.node-icon {
  font-size: 16px;
}

.node-label {
  font-size: 14px;
}

.node-builtin {
  color: #9e9e9e;
  font-style: italic;
  font-size: 10px;
}
```

- [ ] **Step 5: Update index export**

```typescript
// src/views/xsd/graph/nodes/index.ts
export { ElementNode } from './ElementNode';
export type { ElementNodeData } from './ElementNode';
export { ComplexTypeNode } from './ComplexTypeNode';
export type { ComplexTypeNodeData } from './ComplexTypeNode';
export { SimpleTypeNode } from './SimpleTypeNode';
export type { SimpleTypeNodeData } from './SimpleTypeNode';
export { BuiltInTypeNode } from './BuiltInTypeNode';
export type { BuiltInTypeNodeData } from './BuiltInTypeNode';
```

- [ ] **Step 6: Commit**

```bash
git add src/views/xsd/graph/nodes/
git commit -m "feat: create SimpleTypeNode and BuiltInTypeNode components"
```

---

## Task 8: Create GraphControls Component

**Files:**
- Create: `src/views/xsd/graph/controls/GraphControls.tsx`
- Create: `src/views/xsd/graph/controls/index.ts`

- [ ] **Step 1: Write the component**

```typescript
// src/views/xsd/graph/controls/GraphControls.tsx
import type { XSDSchema } from '@/services/xsd';
import './GraphControls.css';

export interface GraphControlsProps {
  schema: XSDSchema;
  selectedElement: string | null;
  onElementSelect: (elementName: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onSearch: (query: string) => void;
}

export function GraphControls({
  schema,
  selectedElement,
  onElementSelect,
  onZoomIn,
  onZoomOut,
  onFitView,
  onExportPNG,
  onExportSVG,
  onSearch
}: GraphControlsProps) {
  return (
    <div className="graph-controls">
      <div className="graph-controls-section">
        <label htmlFor="element-select">Element:</label>
        <select
          id="element-select"
          value={selectedElement || ''}
          onChange={(e) => e.target.value && onElementSelect(e.target.value)}
          className="graph-select"
        >
          <option value="">Select element...</option>
          {schema.elements.map(el => (
            <option key={el.name} value={el.name}>
              {el.name}
            </option>
          ))}
        </select>
      </div>

      <div className="graph-controls-section">
        <button onClick={onZoomIn} className="graph-btn" title="Zoom In">
          🔍+
        </button>
        <button onClick={onZoomOut} className="graph-btn" title="Zoom Out">
          🔍-
        </button>
        <button onClick={onFitView} className="graph-btn" title="Fit View">
          ⛶
        </button>
      </div>

      <div className="graph-controls-section">
        <button onClick={onExportPNG} className="graph-btn" title="Export PNG">
          📷 PNG
        </button>
        <button onClick={onExportSVG} className="graph-btn" title="Export SVG">
          📐 SVG
        </button>
      </div>

      <div className="graph-controls-section">
        <input
          type="text"
          placeholder="Search nodes..."
          onChange={(e) => onSearch(e.target.value)}
          className="graph-search"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CSS**

```css
/* src/views/xsd/graph/controls/GraphControls.css */
.graph-controls {
  display: flex;
  gap: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  align-items: center;
  flex-wrap: wrap;
}

.graph-controls-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.graph-select {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.graph-btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.graph-btn:hover {
  background-color: #e3f2fd;
}

.graph-search {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
}
```

- [ ] **Step 3: Create index export**

```typescript
// src/views/xsd/graph/controls/index.ts
export { GraphControls } from './GraphControls';
export type { GraphControlsProps } from './GraphControls';
```

- [ ] **Step 4: Commit**

```bash
git add src/views/xsd/graph/controls/
git commit -m "feat: create GraphControls component with element selector and zoom controls"
```

---

## Task 9: Create XSDGraphVisualizer Main Component

**Files:**
- Create: `src/views/xsd/graph/XSDGraphVisualizer.tsx`
- Test: `src/views/xsd/graph/__tests__/XSDGraphVisualizer.test.tsx`

- [ ] **Step 1: Write the component**

```typescript
// src/views/xsd/graph/XSDGraphVisualizer.tsx
import { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Edge,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { XSDSchema } from '@/services/xsd';
import { GraphBuilder } from './GraphBuilder';
import { GraphLayoutEngine } from './GraphLayoutEngine';
import { GraphControls } from './controls';
import {
  ElementNode,
  ComplexTypeNode,
  SimpleTypeNode,
  BuiltInTypeNode
} from './nodes';
import './XSDGraphVisualizer.css';

const nodeTypes: NodeTypes = {
  elementNode: ElementNode,
  complexTypeNode: ComplexTypeNode,
  simpleTypeNode: SimpleTypeNode,
  builtinTypeNode: BuiltInTypeNode
};

export interface XSDGraphVisualizerProps {
  schema: XSDSchema;
}

export function XSDGraphVisualizer({ schema }: XSDGraphVisualizerProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  const graphBuilder = useMemo(() => new GraphBuilder(), []);
  const layoutEngine = useMemo(() => new GraphLayoutEngine(), []);

  const handleElementSelect = useCallback((elementName: string) => {
    setSelectedElement(elementName);

    // Build graph
    const { nodes: builtNodes, edges: builtEdges } = graphBuilder.buildGraph(schema, elementName);

    // Apply layout
    const layoutedNodes = layoutEngine.layout(builtNodes, builtEdges);

    setNodes(layoutedNodes);
    setEdges(builtEdges);
  }, [schema, graphBuilder, layoutEngine, setNodes, setEdges]);

  const handleZoomIn = useCallback(() => {
    reactFlowInstance.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.current?.zoomOut();
  }, []);

  const handleFitView = useCallback(() => {
    reactFlowInstance.current?.fitView({ padding: 0.2 });
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!reactFlowInstance.current) return;

    const dataUrl = await reactFlowInstance.current.toPng({
      backgroundColor: '#f5f5f5'
    });

    const link = document.createElement('a');
    link.download = `${schema.targetNamespace || 'schema'}-graph.png`;
    link.href = dataUrl;
    link.click();
  }, [schema]);

  const handleExportSVG = useCallback(async () => {
    if (!reactFlowInstance.current) return;

    // Note: React Flow doesn't have built-in SVG export
    // This is a placeholder - implement if needed
    alert('SVG export not yet implemented');
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query) {
      setNodes(nodes => nodes.map(n => ({ ...n, className: '' })));
      return;
    }

    setNodes(nodes => nodes.map(n => {
      const label = n.data.label || n.data.element?.name || n.data.type?.name || '';
      const matches = label.toLowerCase().includes(query.toLowerCase());
      return {
        ...n,
        className: matches ? 'highlighted' : ''
      };
    }));
  }, [setNodes]);

  if (!schema || schema.elements.length === 0) {
    return (
      <div className="graph-empty">
        <p>No elements found in schema</p>
        <p>Add elements to XSD to visualize graph</p>
      </div>
    );
  }

  return (
    <div className="xsd-graph-view" ref={reactFlowWrapper}>
      <GraphControls
        schema={schema}
        selectedElement={selectedElement}
        onElementSelect={handleElementSelect}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        onSearch={handleSearch}
      />
      <div className="xsd-graph-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onInit={(instance) => { reactFlowInstance.current = instance; }}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CSS**

```css
/* src/views/xsd/graph/XSDGraphVisualizer.css */
.xsd-graph-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.xsd-graph-container {
  flex: 1;
  position: relative;
  background-color: #f5f5f5;
}

.graph-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  padding: 40px;
}

/* Node highlight for search */
.react-flow__node.highlighted {
  box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.5);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/xsd/graph/
git commit -m "feat: create XSDGraphVisualizer main component with React Flow integration"
```

---

## Task 10: Integrate XSDGraphVisualizer into XSDVisualizer

**Files:**
- Modify: `src/views/xsd/XSDVisualizer.tsx`
- Modify: `src/views/xsd/XSDVisualizer.css`

- [ ] **Step 1: Update XSDVisualizer to add Graph View tab**

```typescript
// Modify the tab state in XSDVisualizer.tsx
const [activeTab, setActiveTab] = useState<'elements' | 'types' | 'graph'>('elements');

// Add import at top
import { XSDGraphVisualizer } from './graph/XSDGraphVisualizer';

// Add tab button
<button
  className={`xsd-tab ${activeTab === 'graph' ? 'active' : ''}`}
  onClick={() => handleTabClick('graph')}
  data-testid="xsd-graph-tab"
>
  Graph View
</button>

// Add graph view content
{activeTab === 'graph' && (
  <div className="xsd-graph-view" data-testid="xsd-graph-view">
    <XSDGraphVisualizer schema={schema} />
  </div>
)}
```

- [ ] **Step 2: Update CSS**

```css
/* Add to XSDVisualizer.css */
.xsd-graph-view {
  width: 100%;
  height: 100%;
  position: relative;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/xsd/
git commit -m "feat: integrate XSDGraphVisualizer as third tab in XSDVisualizer"
```

---

## Task 11: Write Component Tests

**Files:**
- Modify: `src/views/xsd/graph/__tests__/XSDGraphVisualizer.test.tsx`

- [ ] **Step 1: Write tests**

```typescript
// src/views/xsd/graph/__tests__/XSDGraphVisualizer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { XSDGraphVisualizer } from '../XSDGraphVisualizer';
import type { XSDSchema } from '@/services/xsd';

describe('XSDGraphVisualizer', () => {
  const mockSchema: XSDSchema = {
    targetNamespace: 'http://example.com',
    elements: [
      {
        name: 'TestElement',
        type: 'TestType',
        occurrence: { minOccurs: 1, maxOccurs: 1 }
      }
    ],
    complexTypes: [
      {
        name: 'TestType',
        elements: [],
        attributes: [],
        mixed: false
      }
    ],
    simpleTypes: [],
    raw: ''
  };

  it('should render graph controls', () => {
    render(<XSDGraphVisualizer schema={mockSchema} />);

    expect(screen.getByText('Element:')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
  });

  it('should show empty state when schema has no elements', () => {
    const emptySchema: XSDSchema = {
      ...mockSchema,
      elements: []
    };

    render(<XSDGraphVisualizer schema={emptySchema} />);

    expect(screen.getByText('No elements found in schema')).toBeInTheDocument();
  });

  it('should populate element dropdown', () => {
    render(<XSDGraphVisualizer schema={mockSchema} />);

    const select = screen.getByLabelText('Element:');
    expect(select).toBeInTheDocument();
    expect(select.innerHTML).toContain('TestElement');
  });

  it('should build graph when element is selected', () => {
    const { container } = render(<XSDGraphVisualizer schema={mockSchema} />);

    const select = screen.getByLabelText('Element:');
    fireEvent.change(select, { target: { value: 'TestElement' } });

    // After selection, React Flow should render
    const reactFlowContainer = container.querySelector('.react-flow');
    expect(reactFlowContainer).toBeInTheDocument();
  });

  it('should filter nodes on search', () => {
    render(<XSDGraphVisualizer schema={mockSchema} />);

    const searchInput = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    // Search input should have the value
    expect(searchInput).toHaveValue('Test');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test -- src/views/xsd/graph/__tests__/XSDGraphVisualizer.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/views/xsd/graph/
git commit -m "test: add component tests for XSDGraphVisualizer"
```

---

## Task 12: Write Integration Tests

**Files:**
- Create: `src/views/xsd/__tests__/XSDVisualizer.graph.integration.test.tsx`

- [ ] **Step 1: Write integration tests**

```typescript
// src/views/xsd/__tests__/XSDVisualizer.graph.integration.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { XSDVisualizer } from '../XSDVisualizer';

const sampleXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="PurchaseOrder" type="PurchaseOrderType"/>
  <xs:complexType name="PurchaseOrderType">
    <xs:sequence>
      <xs:element name="shipTo" type="USAddress"/>
      <xs:element name="billTo" type="USAddress"/>
    </xs:sequence>
    <xs:attribute name="orderDate" type="xs:date"/>
  </xs:complexType>
  <xs:complexType name="USAddress">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="street" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="country" type="xs:NMTOKEN" default="US"/>
  </xs:complexType>
</xs:schema>`;

describe('XSDVisualizer Graph Integration', () => {
  it('should show Graph View tab', () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);

    expect(screen.getByTestId('xsd-graph-tab')).toBeInTheDocument();
  });

  it('should switch to Graph View when tab is clicked', async () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);

    const graphTab = screen.getByTestId('xsd-graph-tab');
    fireEvent.click(graphTab);

    await waitFor(() => {
      expect(screen.getByTestId('xsd-graph-view')).toBeInTheDocument();
    });
  });

  it('should show all elements in dropdown', async () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);

    const graphTab = screen.getByTestId('xsd-graph-tab');
    fireEvent.click(graphTab);

    await waitFor(() => {
      const select = screen.getByLabelText('Element:');
      expect(select.innerHTML).toContain('PurchaseOrder');
    });
  });

  it('should render graph when element is selected', async () => {
    render(<XSDVisualizer xsdContent={sampleXSD} />);

    const graphTab = screen.getByTestId('xsd-graph-tab');
    fireEvent.click(graphTab);

    await waitFor(() => {
      const select = screen.getByLabelText('Element:');
      fireEvent.change(select, { target: { value: 'PurchaseOrder' } });
    });

    // Graph should render
    await waitFor(() => {
      const container = screen.getByTestId('xsd-graph-view');
      expect(container.querySelector('.react-flow')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `npm test -- src/views/xsd/__tests__/XSDVisualizer.graph.integration.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/views/xsd/
git commit -m "test: add integration tests for graph visualization"
```

---

## Task 13: Update Test Coverage and Verify Build

**Files:**
- No new files

- [ ] **Step 1: Run all graph-related tests**

```bash
npm test -- src/views/xsd/graph/
```

Expected: All tests pass (GraphBuilder, GraphLayoutEngine, XSDGraphVisualizer)

- [ ] **Step 2: Check coverage**

```bash
npm run test:coverage -- src/views/xsd/graph/
```

Expected: GraphBuilder 80%+, XSDGraphVisualizer 70%+

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: Build succeeds without errors

- [ ] **Step 4: Update documentation**

```bash
# Update IMPLEMENTATION_PLAN.md with XSD Graph Visualization completion
# Update CLAUDE.md with new feature description
```

- [ ] **Step 5: Final commit**

```bash
git add docs/ IMPLEMENTATION_PLAN.md CLAUDE.md
git commit -m "docs: complete XSD Graph Visualization implementation"
```

---

## Success Criteria Verification

After completing all tasks, verify:

1. ✅ Graph View tab visible in XSDVisualizer
2. ✅ Dropdown shows all elements from schema
3. ✅ Selecting element renders graph left-to-right
4. ✅ Four node types with correct styling (Element, ComplexType, SimpleType, Built-in)
5. ✅ Four edge types with color coding (composition blue, inheritance green, reference orange, attribute gray)
6. ✅ Nodes show full detail (name, type, attributes, cardinality)
7. ✅ Interactive: zoom, pan, node selection, collapse
8. ✅ Search highlights matching nodes
9. ✅ Export PNG downloads file
10. ✅ Handles cycles, missing types, large graphs
11. ✅ 80%+ test coverage for GraphBuilder
12. ✅ 70%+ test coverage for XSDGraphVisualizer

Run verification:
```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5173
# Open an XSD file
# Switch to Graph View tab
# Select an element
# Verify graph renders correctly
# Test zoom, pan, search, export
```

---

**Total Tasks:** 13
**Estimated Time:** 6-8 hours
**Test Coverage Target:** 75%+ overall
