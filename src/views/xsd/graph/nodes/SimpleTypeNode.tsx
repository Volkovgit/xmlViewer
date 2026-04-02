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
          {type.restriction.minInclusive !== undefined && (
            <div className="node-restriction">MinInclusive: {type.restriction.minInclusive}</div>
          )}
          {type.restriction.maxInclusive !== undefined && (
            <div className="node-restriction">MaxInclusive: {type.restriction.maxInclusive}</div>
          )}
          {type.restriction.minExclusive !== undefined && (
            <div className="node-restriction">MinExclusive: {type.restriction.minExclusive}</div>
          )}
          {type.restriction.maxExclusive !== undefined && (
            <div className="node-restriction">MaxExclusive: {type.restriction.maxExclusive}</div>
          )}
          {type.restriction.enumerations && type.restriction.enumerations.length > 0 && (
            <div className="node-section">
              <div className="node-section-title">Enumerations:</div>
              {type.restriction.enumerations.map((enumValue) => (
                <div key={enumValue} className="node-enum">
                  • {enumValue}
                </div>
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
