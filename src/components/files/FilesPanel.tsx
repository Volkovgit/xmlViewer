import React from 'react';
import { File, FileCode, FileText } from 'lucide-react';
import { DirtyBadge, ErrorBadge } from '@/components/badges/Badges';
import { Document, DocumentType, DocumentStatus } from '@/types/document';
import { ValidationError } from '@/types/document';
import './FilesPanel.css';

interface FilesPanelProps {
  documents: Document[];
  activeDocumentId: string;
  onDocumentSelect: (id: string) => void;
  validationErrors: Map<string, ValidationError[]>;
}

const getFileIcon = (type: DocumentType) => {
  const iconClassName = 'file-icon';
  switch (type) {
    case DocumentType.XML:
      return <FileText className={iconClassName} size={16} />;
    case DocumentType.XSD:
      return <FileCode className={iconClassName} size={16} />;
    default:
      return <File className={iconClassName} size={16} />;
  }
};

export const FilesPanel: React.FC<FilesPanelProps> = ({
  documents,
  activeDocumentId,
  onDocumentSelect,
  validationErrors,
}) => {
  return (
    <div className="files-panel">
      <h3 className="files-panel-header">Open Files</h3>
      {documents.map((document) => {
        const isActive = document.id === activeDocumentId;
        const isDirty = document.status === DocumentStatus.DIRTY;
        const errors = validationErrors.get(document.id);
        const hasErrors = errors && errors.length > 0;

        return (
          <div
            key={document.id}
            className={`file-item ${isActive ? 'active' : ''}`}
            onClick={() => onDocumentSelect(document.id)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onDocumentSelect(document.id);
              }
            }}
            aria-selected={isActive}
          >
            {getFileIcon(document.type)}
            <span className="file-name">{document.name}</span>
            <div className="file-badges">
              {isDirty && <DirtyBadge />}
              {hasErrors && <ErrorBadge count={errors.length} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
