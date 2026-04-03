import { ValidationError } from '@/types';
import './ValidationPanel.css';

export interface ValidationPanelProps {
  errors: ValidationError[];
  visible: boolean;
  onErrorClick?: (error: ValidationError) => void;
}

export function ValidationPanel({ errors, visible, onErrorClick }: ValidationPanelProps) {
  if (!visible || errors.length === 0) {
    return null;
  }

  return (
    <div className="validation-panel">
      <div className="validation-panel-header">
        <h3>Validation Errors</h3>
        <span className="error-count">{errors.length}</span>
      </div>
      <div className="validation-errors-list">
        {errors.map((error, index) => (
          <div
            key={index}
            className="validation-error-item"
            onClick={() => onErrorClick?.(error)}
          >
            <div className="error-path">{error.path}</div>
            <div className="error-message">{error.message}</div>
            {error.line && (
              <div className="error-location">Line {error.line}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
