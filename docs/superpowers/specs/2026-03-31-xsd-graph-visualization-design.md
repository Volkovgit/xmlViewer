# XSD Graph Visualization Design

**Goal:** Create an interactive graph visualization for XSD schemas that shows elements, types, and their relationships as a layered graph (left-to-right) with full detail in each node.

**Date:** 2026-03-31

**Status:** Approved

---

## Overview

Add a new "Graph View" tab to the existing XSDVisualizer component that displays XSD schemas as an interactive layered graph using React Flow. Users can select an element and see its complete dependency graph including all related types with full detail in each node.

**Key Features:**
- Layered graph layout (left-to-right) using dagre
- Four node types: Element, ComplexType, SimpleType, Built-in Type
- Four edge types with color coding: composition (blue), inheritance (green), reference (orange), attribute (gray)
- Full detail in nodes: name, type, attributes with types, cardinality, restrictions
- Focus-based virtualization: show graph only for selected element and its dependencies
- Full interactivity: zoom, pan, drag nodes, collapsible nodes, minimap, search, export PNG/SVG

---

## Architecture

### Components

#### 1. XSDGraphVisualizer (Main Component)

**File:** `src/views/xsd/graph/XSDGraphVisualizer.tsx`

**Responsibilities:**
- Manage graph state (selected element, collapsed nodes, layout)
- Integrate React Flow for rendering
- Handle user interactions (zoom, pan, node selection, search)
- Coordinate GraphBuilder and GraphLayoutEngine

**Interface:**
```typescript
export interface XSDGraphVisualizerProps {
  schema: XSDSchema;
}

export function XSDGraphVisualizer({ schema }: XSDGraphVisualizerProps): JSX.Element
```

**State:**
```typescript
interface XSDGraphVisualizerState {
  selectedElement: string | null;        // Selected element for graph building
  nodes: Node[];                         // React Flow nodes
  edges: Edge[];                         // React Flow edges
  collapsedNodes: Set<string>;           // Collapsed node IDs
  highlightedNode: string | null;        // Highlighted node ID
  searchQuery: string;                   // Search query string
}
```

#### 2. GraphBuilder (Service)

**File:** `src/views/xsd/graph/GraphBuilder.ts`

**Responsibilities:**
- Build dependency graph for selected element
- Recursively traverse types and collect all related nodes
- Determine edge types (composition, inheritance, reference, attribute)
- Return React Flow data structure (nodes, edges)

**Interface:**
```typescript
export interface GraphBuildResult {
  nodes: Node[];
  edges: Edge[];
}

export class GraphBuilder {
  buildGraph(schema: XSDSchema, elementName: string, maxDepth?: number): GraphBuildResult;
  private buildElementNode(element: XSDElement, visited: Set<string>): Node;
  private buildTypeNode(type: XSDComplexType | XSDSimpleType, visited: Set<string>): Node;
  private buildEdges(schema: XSDSchema, nodes: Node[]): Edge[];
}
```

**Algorithm:**
1. Find element in `schema.elements`
2. Recursively traverse types (with maxDepth limit, default 5)
3. Track visited nodes to detect cycles
4. Create React Flow nodes for each XSD entity
5. Create edges between nodes based on relationships
6. Return { nodes, edges }

**Cycle Detection:**
```typescript
if (visited.has(typeName)) {
  return createCircularRefNode(typeName);
}
visited.add(typeName);
```

**Missing Type Handling:**
```typescript
const type = schema.complexTypes.find(t => t.name === typeName);
if (!type) {
  return createMissingTypeNode(typeName);
}
```

#### 3. GraphLayoutEngine (Utility)

**File:** `src/views/xsd/graph/GraphLayoutEngine.ts`

**Responsibilities:**
- Apply dagre algorithm for layered left-to-right layout
- Calculate node positions for optimal edge routing
- Return nodes with calculated positions

**Interface:**
```typescript
export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';  // We use 'LR' (left-to-right)
  nodeSep: number;                        // Horizontal spacing
  rankSep: number;                        // Vertical spacing
}

export class GraphLayoutEngine {
  layout(nodes: Node[], edges: Edge[], options?: LayoutOptions): Node[];
}
```

**Implementation:**
```typescript
import dagre from 'dagre';

const g = new dagre.graphlib.Graph();
g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 });

// Add nodes
nodes.forEach(node => {
  g.setNode(node.id, { width: 200, height: 100 });
});

// Add edges
edges.forEach(edge => {
  g.setEdge(edge.source, edge.target);
});

// Calculate layout
dagre.layout(g);

// Apply positions to nodes
return nodes.map(node => ({
  ...node,
  position: g.node(node.id)
}));
```

#### 4. Custom Node Components

**Directory:** `src/views/xsd/graph/nodes/`

##### ElementNode.tsx
```typescript
export interface ElementNodeProps {
  data: {
    element: XSDElement;
    onCollapse: (nodeId: string) => void;
    collapsed: boolean;
  };
}

export function ElementNode({ data }: ElementNodeProps): JSX.Element
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│ 📦 PurchaseOrder               │
│ Type: PurchaseOrderType        │
│ ───────────────────────────────│
│ Attributes:                    │
│ • orderDate (xs:date)          │
│ • orderId (xs:ID) [required]   │
│ ───────────────────────────────│
│ Children (5):                  │
│ • shipTo [1..1]                │
│ • billTo [1..1]                │
│ • items [1..∞]                 │
│ • comment [0..1]               │
│ ───────────────────────────────│
│ [▼ Collapse]                   │
└─────────────────────────────────┘
```

##### ComplexTypeNode.tsx
```typescript
export interface ComplexTypeNodeProps {
  data: {
    type: XSDComplexType;
    onCollapse: (nodeId: string) => void;
    collapsed: boolean;
  };
}

export function ComplexTypeNode({ data }: ComplexTypeNodeProps): JSX.Element
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│ 🟦 USAddress                   │
│ Extension: AddressType         │
│ ───────────────────────────────│
│ Attributes:                    │
│ • country (xs:NMTOKEN) [default: US]│
│ ───────────────────────────────│
│ Elements (4):                  │
│ • name (xs:string) [1..1]      │
│ • street (xs:string) [2..2]    │
│ • city (xs:string) [1..1]      │
│ • zip (xs:decimal) [1..1]      │
└─────────────────────────────────┘
```

##### SimpleTypeNode.tsx
```typescript
export interface SimpleTypeNodeProps {
  data: {
    type: XSDSimpleType;
    onCollapse: (nodeId: string) => void;
    collapsed: boolean;
  };
}

export function SimpleTypeNode({ data }: SimpleTypeNodeProps): JSX.Element
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│ 🟩 SKU                         │
│ Base: xs:string                │
│ ───────────────────────────────│
│ Pattern: \\d{3}-[A-Z]{2}       │
│ MinLength: 5                   │
│ MaxLength: 10                  │
│ ───────────────────────────────│
│ Enumerations:                  │
│ • 123-AB                       │
│ • 456-CD                       │
└─────────────────────────────────┘
```

##### BuiltInTypeNode.tsx
```typescript
export interface BuiltInTypeNodeProps {
  data: {
    typeName: string;
  };
}

export function BuiltInTypeNode({ data }: BuiltInTypeNodeProps): JSX.Element
```

**Visual Structure:**
```
┌─────────────────────────────────┐
│ ⚪ xs:string                   │
│ (built-in type)                │
└─────────────────────────────────┘
```

#### 5. GraphControls (Control Panel)

**File:** `src/views/xsd/graph/controls/GraphControls.tsx`

**Responsibilities:**
- Element selector dropdown
- Zoom controls (in/out, fit to screen)
- Export buttons (PNG/SVG)
- Search input

**Interface:**
```typescript
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

export function GraphControls(props: GraphControlsProps): JSX.Element
```

#### 6. SearchBar (Search Component)

**File:** `src/views/xsd/graph/controls/SearchBar.tsx`

**Responsibilities:**
- Search input field
- Filter nodes by name (case-insensitive)
- Highlight matching nodes

**Interface:**
```typescript
export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder }: SearchBarProps): JSX.Element
```

---

## Data Flow

### Scenario 1: User Selects Element

```
1. User clicks element in GraphControls dropdown
2. XSDGraphVisualizer receives selectedElementName
3. GraphBuilder.buildGraph(schema, selectedElementName):
   a. Find XSDElement in schema.elements
   b. Recursively traverse types:
      - If element.type == "AddressType"
      - Find AddressType in schema.complexTypes
      - Add all child elements from AddressType.elements
      - For each child element, find its type
      - Repeat recursively for all nested types
   c. Collect all related XSDElement, XSDComplexType, XSDSimpleType
   d. Create React Flow nodes (one node per XSD entity)
   e. Create React Flow edges (relationships between nodes)
   f. Return { nodes, edges }
4. GraphLayoutEngine.layout(nodes, edges):
   a. Apply dagre for left-to-right positioning
   b. Return nodes with calculated positions
5. XSDGraphVisualizer updates React Flow:
   a. setNodes(layoutedNodes)
   b. setEdges(edges)
6. React Flow renders graph with new positions
```

### Scenario 2: User Clicks Node

```
1. User clicks node in graph
2. XSDGraphVisualizer handles onNodeClick:
   a. If node already selected → deselect
   b. If node not selected → select node + highlight related edges
3. State updates → React Flow re-renders with highlights
```

### Scenario 3: User Collapses Node

```
1. User clicks collapse button on node
2. XSDGraphVisualizer handles onCollapse:
   a. Add node.id to collapsedNodes Set
   b. Hide child nodes
   c. Update edges (remove edges to/from hidden children)
3. State updates → React Flow re-renders with hidden children
```

### Scenario 4: User Searches

```
1. User types "Address" in SearchBar
2. XSDGraphVisualizer receives searchQuery
3. Filter nodes: nodes.filter(n => n.data.label.includes("Address"))
4. Add 'highlighted' class to matching nodes
5. React Flow re-renders with highlights
```

### Scenario 5: User Exports PNG

```
1. User clicks "Export PNG" in GraphControls
2. XSDGraphVisualizer calls React Flow's toPng()
3. File downloads automatically with name "{schema-name}-graph.png"
```

---

## Edge Types and Styling

### Edge Types with Color Coding

1. **Composition** (element contains element) - Solid Blue Line
   - Example: `PurchaseOrder --(blue solid)--> shipTo`
   - Marker: `[1..∞]` above line (cardinality)
   - CSS: `.graph-edge-composition { stroke: #2196f3; stroke-width: 2px; }`

2. **Inheritance/Extension** (type inherits/extends type) - Dashed Green Line
   - Example: `USAddress --(green dashed)--> AddressType`
   - Marker: `<<extends>>` label above line
   - CSS: `.graph-edge-inheritance { stroke: #4caf50; stroke-dasharray: 5,5; }`

3. **Reference** (element references type) - Dash-Dot Orange Line
   - Example: `PurchaseOrder --(orange dash-dot)--> PurchaseOrderType`
   - Marker: `<<type>>` label above line
   - CSS: `.graph-edge-reference { stroke: #ff9800; stroke-dasharray: 10,5,2,5; }`

4. **Attribute** (attribute belongs to type) - Thin Gray Line
   - Example: `orderDate --(gray thin)--> xs:date`
   - Marker: `@` symbol above line
   - CSS: `.graph-edge-attribute { stroke: #9e9e9e; stroke-width: 1px; }`

### Edge Labels

```typescript
{
  id: 'e1',
  source: 'element:PurchaseOrder',
  target: 'element:shipTo',
  label: '[1..1]',
  labelStyle: { fill: '#2196f3', fontWeight: 700 },
  type: 'composition',
  style: { stroke: '#2196f3', strokeWidth: 2 }
}
```

---

## Error Handling and Edge Cases

### 1. Cyclic Dependencies

**Problem:** TypeA references TypeB, TypeB references TypeA

**Solution in GraphBuilder:**
```typescript
function buildGraph(schema: XSDSchema, elementName: string, visited = new Set()) {
  if (visited.has(elementName)) {
    return createCircularRefNode(elementName);
  }
  visited.add(elementName);
  // ... continue traversal
}
```

**Visualization:**
```
┌─────────────────────────────────┐
│ 🔄 TypeA (circular reference)   │
└─────────────────────────────────┘
```

### 2. Missing Type

**Problem:** `element.type = "MissingType"` but type not in schema

**Solution in GraphBuilder:**
```typescript
function getTypeByName(schema: XSDSchema, typeName: string) {
  const type = schema.complexTypes.find(t => t.name === typeName);
  if (!type) {
    return createMissingTypeNode(typeName);
  }
  return type;
}
```

**Visualization:**
```
┌─────────────────────────────────┐
│ ❌ MissingType                  │
│ (type not found in schema)      │
└─────────────────────────────────┘
```

### 3. Very Large Graph (100+ nodes)

**Problem:** Graph too large for rendering

**Solution:**
- Limit recursion depth (maxDepth = 5)
- Show warning: "Graph is too large, showing first 5 levels"
- Offer to select specific element for focus

```typescript
function buildGraph(schema: XSDSchema, elementName: string, maxDepth = 5, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return createTruncatedNode("... (too deep)");
  }
  // ... continue traversal
}
```

### 4. Empty Schema

**Problem:** No elements in schema

**Solution:**
```typescript
if (schema.elements.length === 0) {
  return (
    <div className="graph-empty">
      <p>No elements found in schema</p>
      <p>Add elements to XSD to visualize graph</p>
    </div>
  );
}
```

### 5. Parse Error

**Problem:** XSD failed to parse

**Solution:**
```typescript
if (!schema) {
  return (
    <div className="graph-error">
      <p>Failed to parse XSD schema</p>
      <pre>{parseError.message}</pre>
    </div>
  );
}
```

### 6. React Flow Not Available

**Problem:** React Flow library failed to load

**Solution:**
```typescript
// Graceful degradation
if (!ReactFlow) {
  return (
    <div className="graph-unavailable">
      <p>Graph visualization not available</p>
      <p>Use Tree View instead</p>
    </div>
  );
}
```

### 7. Name Collisions

**Problem:** Element and type have same name (e.g., both "Address")

**Solution:** Use unique IDs for nodes
```typescript
nodes: [
  { id: 'element:Address', data: { ... }, type: 'elementNode' },
  { id: 'type:Address', data: { ... }, type: 'complexTypeNode' }
]
```

---

## Integration with Existing Code

### Modify XSDVisualizer.tsx

**File:** `src/views/xsd/XSDVisualizer.tsx`

**Changes:**

1. Add "Graph View" tab:
```typescript
const [activeTab, setActiveTab] = useState<'elements' | 'types' | 'graph'>('elements');
```

2. Import XSDGraphVisualizer:
```typescript
import { XSDGraphVisualizer } from './graph/XSDGraphVisualizer';
```

3. Add tab button:
```typescript
<button
  className={`xsd-tab ${activeTab === 'graph' ? 'active' : ''}`}
  onClick={() => handleTabClick('graph')}
>
  Graph View
</button>
```

4. Render graph view:
```typescript
{activeTab === 'graph' && (
  <div className="xsd-graph-view" data-testid="xsd-graph-view">
    <XSDGraphVisualizer schema={schema} />
  </div>
)}
```

### Add CSS Styles

**File:** `src/views/xsd/XSDVisualizer.css`

```css
/* Graph container */
.xsd-graph-view {
  width: 100%;
  height: 100%;
  position: relative;
}

.xsd-graph-container {
  width: 100%;
  height: calc(100vh - 200px);
  background-color: #f5f5f5;
}

/* Node styles */
.graph-element-node {
  background-color: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
}

.graph-complextype-node {
  background-color: #f3e5f5;
  border: 2px solid #9c27b0;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
}

.graph-simpletype-node {
  background-color: #e8f5e9;
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
}

.graph-builtin-node {
  background-color: #fafafa;
  border: 2px solid #9e9e9e;
  border-radius: 8px;
  padding: 8px;
  min-width: 150px;
}

/* Node states */
.graph-node-selected {
  box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.5);
}

.graph-node-highlighted {
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.5);
}

.graph-node-collapsed .node-children {
  display: none;
}

/* Empty/error states */
.graph-empty,
.graph-error,
.graph-unavailable {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  padding: 40px;
}
```

---

## Dependencies

### npm Packages

```json
{
  "reactflow": "^11.11.0",
  "dagre": "^0.8.5"
}
```

**Why These Packages:**

- **reactflow (11.11.0):** Modern, actively maintained, excellent TypeScript support, built-in zoom/pan/minimap, simple custom node API, ~150KB
- **dagre (0.8.5):** Standard algorithm for layered graphs, stable, well-documented, used in React Flow examples, ~50KB

### Installation

```bash
npm install reactflow dagre
```

---

## File Structure

```
src/views/xsd/
├── XSDVisualizer.tsx                    (existing - modify)
├── XSDVisualizer.css                    (existing - modify)
├── graph/
│   ├── XSDGraphVisualizer.tsx           (new - main component)
│   ├── GraphBuilder.ts                  (new - graph building service)
│   ├── GraphLayoutEngine.ts             (new - layout utility)
│   ├── nodes/
│   │   ├── ElementNode.tsx              (new)
│   │   ├── ComplexTypeNode.tsx          (new)
│   │   ├── SimpleTypeNode.tsx           (new)
│   │   ├── BuiltInTypeNode.tsx          (new)
│   │   └── index.ts                     (new - exports)
│   ├── controls/
│   │   ├── GraphControls.tsx            (new)
│   │   └── SearchBar.tsx                (new)
│   └── __tests__/
│       ├── XSDGraphVisualizer.test.tsx  (new)
│       ├── GraphBuilder.test.ts         (new)
│       └── GraphLayoutEngine.test.ts    (new)
```

---

## Testing Strategy

### Unit Tests (GraphBuilder focus)

1. **Simple element graph**
   - Input: Element with type containing 2 child elements
   - Expected: 3 nodes (element + type + 2 children), 3 edges
   - Verify: Correct edge types, cardinality on edges

2. **Recursive type traversal**
   - Input: TypeA -> TypeB -> TypeC chain
   - Expected: 4 nodes, 3 edges with correct hierarchy
   - Verify: Node order left-to-right (dagre layout)

3. **Cyclic dependency detection**
   - Input: TypeA -> TypeB -> TypeA
   - Expected: 2 nodes + 1 circular reference node
   - Verify: No infinite recursion

4. **Missing type handling**
   - Input: Element.type = "MissingType"
   - Expected: 2 nodes (element + missing type node)
   - Verify: Missing type node has special style

5. **Depth limit (maxDepth)**
   - Input: Deep type chain (10 levels)
   - Expected: Only 6 levels (maxDepth = 5 + root)
   - Verify: Truncated node at last level

6. **Edge type variations**
   - Input: Element with attributes, child elements, extension
   - Expected: 4 edge types with correct colors
   - Verify: Composition (blue), Inheritance (green), Reference (orange), Attribute (gray)

### Component Tests (React Testing Library)

7. **XSDGraphVisualizer rendering**
   - Input: Valid XSD schema
   - Expected: Graph renders without errors
   - Verify: GraphControls, React Flow container present

8. **Element selection from dropdown**
   - Action: User selects element from dropdown
   - Expected: Graph rebuilds for selected element
   - Verify: setNodes/setEdges called with correct data

9. **Node click interaction**
   - Action: User clicks node
   - Expected: Node highlights, related edges highlight
   - Verify: CSS classes 'selected' and 'highlighted' applied

10. **Node collapse/expand**
    - Action: User clicks collapse button
    - Expected: Node collapses, children hide
    - Verify: collapsedNodes state updated

11. **Search functionality**
    - Action: User types "Address" in search
    - Expected: Nodes with "Address" highlight
    - Verify: Filter works case-insensitive

12. **Export PNG**
    - Action: User clicks "Export PNG"
    - Expected: File downloads
    - Verify: toPng() function called

### Integration Tests

13. **Full XSDVisualizer integration**
    - Scenario: User opens XSD -> switches to Graph View -> selects element
    - Expected: Graph renders correctly for selected element
    - Verify: "Graph View" tab visible, dropdown contains all elements

14. **Large graph performance**
    - Input: Schema with 100+ types
    - Expected: Graph renders in < 3 seconds
    - Verify: Visualization works with depth limit

### Test Coverage Targets

- GraphBuilder: 80%+ coverage
- XSDGraphVisualizer component: 70%+ coverage

---

## Performance Considerations

- **React Flow virtualization:** Automatically handles large graphs
- **Dagre layout:** Fast calculation (100-500ms for 100 nodes)
- **Memory usage:** ~50MB for 500+ nodes
- **Max depth limit:** Default 5 to prevent exponential growth
- **Focus-based rendering:** Only graph for selected element, not entire schema

---

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers with ES6+ support.

---

## Success Criteria

1. ✅ Graph View tab visible in XSDVisualizer
2. ✅ Dropdown shows all elements from schema
3. ✅ Selecting element renders graph left-to-right
4. ✅ Four node types with correct styling
5. ✅ Four edge types with color coding
6. ✅ Nodes show full detail (name, type, attributes, cardinality)
7. ✅ Interactive: zoom, pan, node selection, collapse
8. ✅ Search highlights matching nodes
9. ✅ Export PNG downloads file
10. ✅ Handles cycles, missing types, large graphs
11. ✅ 80%+ test coverage for GraphBuilder
12. ✅ 70%+ test coverage for XSDGraphVisualizer
