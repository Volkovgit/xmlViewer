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
