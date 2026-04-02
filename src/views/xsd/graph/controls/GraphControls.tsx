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
