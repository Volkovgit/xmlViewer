import React from 'react';
import { Document } from '@/types';
import { DocumentType } from '@/types';
import { SecondaryActionButton } from '../buttons/SecondaryActionButton';
import './ActionsPanel.css';

interface ActionsPanelProps {
  document: Document | null;
  onGenerateXML?: () => void;
  onValidate?: () => void;
  onAssignSchema?: () => void;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = ({
  document,
  onGenerateXML,
  onValidate,
  onAssignSchema,
}) => {
  const isXSD = document?.type === DocumentType.XSD;
  const isXML = document?.type === DocumentType.XML;

  return (
    <div className="actions-panel">
      <div className="actions-header">Actions</div>

      {document === null ? (
        <div className="actions-empty">No document selected</div>
      ) : (
        <div className="actions-list">
          {isXSD && (
            <>
              <SecondaryActionButton
                icon="FileText"
                onClick={onGenerateXML || (() => {})}
                tooltip="Generate XML instance from XSD schema"
              >
                Generate XML
              </SecondaryActionButton>
              <SecondaryActionButton
                icon="CheckCircle"
                onClick={onValidate || (() => {})}
                tooltip="Validate XSD schema for errors and warnings"
              >
                Validate
              </SecondaryActionButton>
            </>
          )}

          {isXML && (
            <>
              <SecondaryActionButton
                icon="Link"
                onClick={onAssignSchema || (() => {})}
                tooltip="Attach XSD schema to XML document for validation"
              >
                Assign Schema
              </SecondaryActionButton>
              <SecondaryActionButton
                icon="CheckCircle"
                onClick={onValidate || (() => {})}
                tooltip="Validate XML document against XSD schema"
              >
                Validate
              </SecondaryActionButton>
            </>
          )}
        </div>
      )}
    </div>
  );
};
