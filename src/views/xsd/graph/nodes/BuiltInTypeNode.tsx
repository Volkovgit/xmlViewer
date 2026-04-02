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
