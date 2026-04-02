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
