/**
 * XSD Visualizer Component
 *
 * Displays an XSD schema as a collapsible, color-coded tree.
 * Elements are blue, attributes are green, types are purple.
 */

import { useMemo } from 'react';
import { parseXSD } from '@/services/xsd';
import { XSDGraphVisualizer } from './graph/XSDGraphVisualizer';
import './XSDVisualizer.css';

// ────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────

export interface XSDVisualizerProps {
  /** Raw XSD content to visualize */
  xsdContent: string;
}

// ────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────

export function XSDVisualizer({ xsdContent }: XSDVisualizerProps) {
  const schema = useMemo(() => parseXSD(xsdContent), [xsdContent]);

  if (!schema) {
    return (
      <div className="xsd-visualizer-error" data-testid="xsd-visualizer-error">
        <p>Unable to parse XSD schema. Please check the schema syntax.</p>
      </div>
    );
  }

  return (
    <div className="xsd-visualizer" data-testid="xsd-visualizer">
      <div className="xsd-graph-view" data-testid="xsd-graph-view">
        <XSDGraphVisualizer schema={schema} />
      </div>
    </div>
  );
}

export default XSDVisualizer;
