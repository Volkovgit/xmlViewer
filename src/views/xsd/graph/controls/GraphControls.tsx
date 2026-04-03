import type { XSDSchema } from '@/services/xsd';
import './GraphControls.css';

export interface GraphControlsProps {
  schema: XSDSchema;
  selectedElement: string | null;
  maxDepth: number;
  onElementSelect: (elementName: string) => void;
  onMaxDepthChange: (depth: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onSearch: (query: string) => void;
}

export function GraphControls({
  schema,
  selectedElement,
  maxDepth,
  onElementSelect,
  onMaxDepthChange,
  onZoomIn,
  onZoomOut,
  onFitView,
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
        <label htmlFor="max-depth">Max Depth:</label>
        <input
          id="max-depth"
          type="number"
          min="1"
          max="20"
          value={maxDepth}
          onChange={(e) => onMaxDepthChange(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
          className="graph-number-input"
          title="Maximum graph depth (1-20)"
        />
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
