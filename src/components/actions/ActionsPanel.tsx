import React from 'react';
import { Document } from '@/types';
import { DocumentType } from '@/types';
import { PrimaryActionButton } from '../buttons/PrimaryActionButton';
import { SecondaryActionButton } from '../buttons/SecondaryActionButton';
import './ActionsPanel.css';

interface ActionsPanelProps {
  document: Document | null;
  onToggleGraphMode?: () => void;
  onGenerateXML?: () => void;
  onValidate?: () => void;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = ({
  document,
  onToggleGraphMode,
  onGenerateXML,
  onValidate,
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
              <PrimaryActionButton
                icon="Circle"
                onClick={onToggleGraphMode || (() => {})}
                tooltip="Show dependency graph for XSD schema"
              >
                Открыть граф
              </PrimaryActionButton>
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
