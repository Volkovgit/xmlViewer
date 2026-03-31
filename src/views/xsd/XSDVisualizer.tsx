/**
 * XSD Visualizer Component
 *
 * Displays an XSD schema as a collapsible, color-coded tree.
 * Elements are blue, attributes are green, types are purple.
 */

import { useState, useMemo, useCallback } from 'react';
import { parseXSD } from '@/services/xsd';
import type { XSDElement, XSDComplexType, XSDSimpleType, XSDAttribute } from '@/services/xsd';
import './XSDVisualizer.css';

// ────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────

export interface XSDVisualizerProps {
  /** Raw XSD content to visualize */
  xsdContent: string;
}

// ────────────────────────────────────────────────
// Tree node components
// ────────────────────────────────────────────────

function AttributeNode({ attr }: { attr: XSDAttribute }) {
  return (
    <div className="xsd-tree-node xsd-attribute-node">
      <span className="xsd-icon xsd-icon-attr">@</span>
      <span className="xsd-attr-name">{attr.name}</span>
      <span className="xsd-type-badge">{attr.type}</span>
      {attr.use === 'required' && (
        <span className="xsd-required-badge">required</span>
      )}
      {attr.defaultValue && (
        <span className="xsd-default-value">= "{attr.defaultValue}"</span>
      )}
    </div>
  );
}

function SimpleTypeNode({ st }: { st: XSDSimpleType }) {
  return (
    <div className="xsd-tree-node xsd-simpletype-node">
      <span className="xsd-icon xsd-icon-type">T</span>
      <span className="xsd-type-name">{st.name}</span>
      {st.restriction && (
        <span className="xsd-type-badge">{st.restriction.base}</span>
      )}
      {st.restriction?.enumerations && (
        <span className="xsd-enum-list">
          [{st.restriction.enumerations.join(', ')}]
        </span>
      )}
    </div>
  );
}

function ComplexTypeNode({ ct }: { ct: XSDComplexType }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = ct.elements.length > 0 || ct.attributes.length > 0;

  return (
    <div className="xsd-tree-branch">
      <div
        className="xsd-tree-node xsd-complextype-node"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className={`xsd-toggle ${expanded ? 'expanded' : ''}`}>▶</span>
        )}
        <span className="xsd-icon xsd-icon-type">CT</span>
        <span className="xsd-type-name">{ct.name}</span>
        {ct.mixed && <span className="xsd-mixed-badge">mixed</span>}
      </div>
      {expanded && hasChildren && (
        <div className="xsd-tree-children">
          {ct.attributes.map((attr) => (
            <AttributeNode key={`attr-${attr.name}`} attr={attr} />
          ))}
          {ct.elements.map((el) => (
            <ElementNode key={`el-${el.name}`} element={el} />
          ))}
        </div>
      )}
    </div>
  );
}

function ElementNode({ element }: { element: XSDElement }) {
  const [expanded, setExpanded] = useState(true);
  const hasInlineType = !!element.complexType;
  const hasChildren = hasInlineType && (
    (element.complexType?.elements?.length ?? 0) > 0 ||
    (element.complexType?.attributes?.length ?? 0) > 0
  );

  const occurrenceText = useMemo(() => {
    const { minOccurs, maxOccurs } = element.occurrence;
    if (minOccurs === 1 && maxOccurs === 1) return '';
    const max = maxOccurs === 'unbounded' ? '∞' : maxOccurs;
    return `[${minOccurs}..${max}]`;
  }, [element.occurrence]);

  return (
    <div className="xsd-tree-branch">
      <div
        className="xsd-tree-node xsd-element-node"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <span className={`xsd-toggle ${expanded ? 'expanded' : ''}`}>▶</span>
        )}
        <span className="xsd-icon xsd-icon-element">E</span>
        <span className="xsd-element-name">{element.name}</span>
        <span className="xsd-type-badge">{element.type}</span>
        {occurrenceText && (
          <span className="xsd-occurrence-badge">{occurrenceText}</span>
        )}
      </div>
      {expanded && hasChildren && element.complexType && (
        <div className="xsd-tree-children">
          {element.complexType.attributes.map((attr) => (
            <AttributeNode key={`attr-${attr.name}`} attr={attr} />
          ))}
          {element.complexType.elements.map((child) => (
            <ElementNode key={`el-${child.name}`} element={child} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────

export function XSDVisualizer({ xsdContent }: XSDVisualizerProps) {
  const schema = useMemo(() => parseXSD(xsdContent), [xsdContent]);

  const [activeTab, setActiveTab] = useState<'elements' | 'types'>('elements');

  const handleTabClick = useCallback((tab: 'elements' | 'types') => {
    setActiveTab(tab);
  }, []);

  if (!schema) {
    return (
      <div className="xsd-visualizer-error" data-testid="xsd-visualizer-error">
        <p>Unable to parse XSD schema. Please check the schema syntax.</p>
      </div>
    );
  }

  return (
    <div className="xsd-visualizer" data-testid="xsd-visualizer">
      <div className="xsd-visualizer-tabs">
        <button
          className={`xsd-tab ${activeTab === 'elements' ? 'active' : ''}`}
          onClick={() => handleTabClick('elements')}
        >
          Elements ({schema.elements.length})
        </button>
        <button
          className={`xsd-tab ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => handleTabClick('types')}
        >
          Types ({schema.complexTypes.length + schema.simpleTypes.length})
        </button>
      </div>

      <div className="xsd-visualizer-content">
        {activeTab === 'elements' && (
          <div className="xsd-tree" data-testid="xsd-elements-tree">
            {schema.elements.length === 0 ? (
              <p className="xsd-empty">No elements defined</p>
            ) : (
              schema.elements.map((el) => (
                <ElementNode key={el.name} element={el} />
              ))
            )}
          </div>
        )}

        {activeTab === 'types' && (
          <div className="xsd-tree" data-testid="xsd-types-tree">
            {schema.complexTypes.length === 0 && schema.simpleTypes.length === 0 ? (
              <p className="xsd-empty">No named types defined</p>
            ) : (
              <>
                {schema.complexTypes.map((ct) => (
                  <ComplexTypeNode key={ct.name} ct={ct} />
                ))}
                {schema.simpleTypes.map((st) => (
                  <SimpleTypeNode key={st.name} st={st} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default XSDVisualizer;
