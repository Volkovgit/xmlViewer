import React from 'react';
import { Document } from '@/types';
import { DocumentType } from '@/types';
import { PrimaryActionButton } from '../buttons/PrimaryActionButton';
import { SecondaryActionButton } from '../buttons/SecondaryActionButton';
import './ActionsPanel.css';

interface ActionsPanelProps {
  document: Document | null;
  onShowGraph?: () => void;
  onGenerateXML?: () => void;
  onGenerateXsd?: () => void;
  onValidate?: () => void;
  onAssignSchema?: () => void;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = ({
  document,
  onShowGraph,
  onGenerateXML,
  onGenerateXsd,
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
              <PrimaryActionButton icon="Circle" onClick={onShowGraph || (() => {})}>
                Show Graph
              </PrimaryActionButton>
              <SecondaryActionButton icon="FileText" onClick={onGenerateXML || (() => {})}>
                Generate XML
              </SecondaryActionButton>
              <SecondaryActionButton icon="CheckCircle" onClick={onValidate || (() => {})}>
                Validate
              </SecondaryActionButton>
            </>
          )}

          {isXML && (
            <>
              <SecondaryActionButton icon="FileCode" onClick={onGenerateXsd || (() => {})}>
                Generate XSD
              </SecondaryActionButton>
              <SecondaryActionButton icon="Link" onClick={onAssignSchema || (() => {})}>
                Assign Schema
              </SecondaryActionButton>
              <SecondaryActionButton icon="CheckCircle" onClick={onValidate || (() => {})}>
                Validate XSD
              </SecondaryActionButton>
            </>
          )}
        </div>
      )}
    </div>
  );
};
