import { Document } from '@/types';
import './SchemaSelectionModal.css';

export interface SchemaSelectionModalProps {
  xsdDocuments: Document[];
  onSelect: (xsdDocument: Document) => void;
  onCancel: () => void;
}

export function SchemaSelectionModal({
  xsdDocuments,
  onSelect,
  onCancel
}: SchemaSelectionModalProps) {
  return (
    <div className="schema-modal-overlay" onClick={onCancel}>
      <div className="schema-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="schema-modal-header">
          <h2>Select XSD Schema</h2>
          <button className="schema-modal-close" onClick={onCancel} aria-label="Close modal">
            ×
          </button>
        </div>
        <div className="schema-modal-body">
          {xsdDocuments.length === 0 ? (
            <p className="schema-modal-empty">
              No XSD schemas available. Please open an XSD file first.
            </p>
          ) : (
            <ul className="schema-list">
              {xsdDocuments.map((doc) => (
                <li
                  key={doc.id}
                  className="schema-item"
                  onClick={() => onSelect(doc)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(doc);
                    }
                  }}
                >
                  <span className="schema-name">{doc.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
