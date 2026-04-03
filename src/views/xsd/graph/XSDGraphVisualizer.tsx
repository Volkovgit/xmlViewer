import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  useNodesState,
  useEdgesState,
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
  const [maxDepth, setMaxDepth] = useState<number>(10);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);

  const graphBuilder = useRef(new GraphBuilder());
  const layoutEngine = useRef(new GraphLayoutEngine());

  const handleElementSelect = useCallback((elementName: string) => {
    setSelectedElement(elementName);
  }, []);

  // Rebuild graph when selectedElement or maxDepth changes
  useEffect(() => {
    if (selectedElement) {
      const { nodes: builtNodes, edges: builtEdges } = graphBuilder.current.buildGraph(schema, selectedElement, maxDepth);
      const layoutedNodes = layoutEngine.current.layout(builtNodes, builtEdges);
      setNodes(layoutedNodes);
      setEdges(builtEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [selectedElement, maxDepth, schema]); // Remove setNodes/setEdges from deps

  const handleZoomIn = useCallback(() => {
    reactFlowInstance.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.current?.zoomOut();
  }, []);

  const handleFitView = useCallback(() => {
    reactFlowInstance.current?.fitView({ padding: 0.2 });
  }, []);

  const handleSearch = useCallback((query: string) => {
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
        maxDepth={maxDepth}
        onElementSelect={handleElementSelect}
        onMaxDepthChange={setMaxDepth}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
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
