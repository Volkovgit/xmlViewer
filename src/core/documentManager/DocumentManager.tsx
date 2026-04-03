import { useCallback, useState, useMemo } from 'react';
import { useDocumentStore } from '@/stores';
import { createUntitledDocument } from '@/services/document';
import { Document, DocumentType, DocumentStatus } from '@/types';
import { ValidationError } from '@/types';
import { useFileOperations } from '@/hooks/useFileOperations';
import { generateXSDFromXML, generateXMLFromXSD, validateXMLAgainstXSD, parseXSD } from '@/services/xsd';
import { AppLayout } from '@/components/layout';
import { LeftSidebar } from '@/components/layout';
import { ActionsPanel } from '@/components/actions';
import { FilesPanel } from '@/components/files';
import { ValidationPanel, SchemaSelectionModal } from '@/components/validation';
import { DocumentTabs } from './DocumentTabs';
import { TopBar } from '@/components/toolbar';
import { XMLTextEditor } from '@/views/text';
import { XSDVisualizer } from '@/views/xsd/XSDVisualizer';
import { XSDGraphVisualizer } from '@/views/xsd/graph/XSDGraphVisualizer';
import '@/components/toolbar/TopBar.css';
import './DocumentManager.css';

/**
 * DocumentManager Component
 *
 * Central UI component for document management in the XML editor.
 * Provides tab bar, toolbar, and document content area.
 * Integrates XSD schema operations: generate, validate, assign.
 */
export function DocumentManager() {
  const {
    getAllDocuments,
    getActiveDocument,
    setActiveDocument,
    removeDocument,
    addDocument,
  } = useDocumentStore();

  const {
    handleFileSelected,
    handleFiles,
    fileInputRef,
    saveFile,
  } = useFileOperations();

  // Schema assignment state: maps docId → schemaDocId
  const [schemaAssignments, setSchemaAssignments] = useState<Map<string, string>>(new Map());
  // XSD view mode: 'text' or 'visualizer'
  const [xsdViewMode, setXsdViewMode] = useState<'text' | 'visualizer'>('text');

  // Validation errors for ValidationPanel
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  // Schema selection modal state
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Get data for FilesPanel
  const openDocuments = getAllDocuments();
  const activeDocument = getActiveDocument();

  // Validation errors map for FilesPanel - maps document ID to list of errors
  const validationErrorsMap = useMemo(() => new Map<string, ValidationError[]>(), []);

  // Handler for document selection from FilesPanel
  const handleDocumentSelect = useCallback((id: string) => {
    setActiveDocument(id);
  }, [setActiveDocument]);

  const handleNewFile = useCallback(() => {
    const newDoc = createUntitledDocument(DocumentType.XML);
    addDocument(newDoc);
    setActiveDocument(newDoc.id);
  }, [addDocument, setActiveDocument]);

  const handleOpenButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleClose = useCallback(
    (docId: string) => {
      const documents = getAllDocuments();
      const doc = documents.find((d) => d.id === docId);
      if (!doc) return;
      if (doc.status === DocumentStatus.DIRTY) {
        const confirmed = confirm(`Save changes to "${doc.name}" before closing?`);
        if (!confirmed) return;
      }
      removeDocument(docId);
      // Clean up schema assignment
      setSchemaAssignments((prev) => {
        const next = new Map(prev);
        next.delete(docId);
        return next;
      });
    },
    [getAllDocuments, removeDocument]
  );

  const handleTabClick = useCallback(
    (docId: string) => {
      setActiveDocument(docId);
    },
    [setActiveDocument]
  );

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  // ─── XSD Actions ────────────────────────────────

  const handleGenerateXSD = useCallback(() => {
    const activeDoc = getActiveDocument();
    if (!activeDoc) return;

    const xsdContent = generateXSDFromXML(activeDoc.content);
    if (!xsdContent) {
      alert('Failed to generate XSD. Please ensure the XML is well-formed.');
      return;
    }

    const newDoc = createUntitledDocument(DocumentType.XSD);
    // Replace default content with generated XSD
    const docWithContent = { ...newDoc, content: xsdContent, name: `${activeDoc.name.replace(/\.[^.]+$/, '')}.xsd` };
    addDocument(docWithContent);
    setActiveDocument(docWithContent.id);
  }, [getActiveDocument, addDocument, setActiveDocument]);

  const handleGenerateXML = useCallback(() => {
    const activeDoc = getActiveDocument();
    if (!activeDoc) return;

    const xmlContent = generateXMLFromXSD(activeDoc.content);
    if (!xmlContent) {
      alert('Failed to generate XML. Please ensure the XSD is valid.');
      return;
    }

    const newDoc = createUntitledDocument(DocumentType.XML);
    const docWithContent = { ...newDoc, content: xmlContent, name: `${activeDoc.name.replace(/\.[^.]+$/, '')}_instance.xml` };
    addDocument(docWithContent);
    setActiveDocument(docWithContent.id);
  }, [getActiveDocument, addDocument, setActiveDocument]);

  const handleValidateXSD = useCallback(() => {
    const activeDoc = getActiveDocument();
    if (!activeDoc) return;

    // Find assigned schema
    const schemaDocId = schemaAssignments.get(activeDoc.id);
    if (!schemaDocId) {
      alert('No schema assigned. Use "Assign Schema" to attach an XSD file first.');
      return;
    }

    const allDocs = getAllDocuments();
    const schemaDoc = allDocs.find((d) => d.id === schemaDocId);
    if (!schemaDoc) {
      alert('Assigned schema document not found. It may have been closed.');
      return;
    }

    const errors = validateXMLAgainstXSD(activeDoc.content, schemaDoc.content);
    if (errors.length === 0) {
      setValidationErrors([]);
      alert('✓ XML is valid against the assigned schema.');
    } else {
      const msgs = errors.map((e) => `Line ${e.line}: ${e.message}`);
      setValidationErrors(errors);
      alert(`✗ ${errors.length} validation error(s):\n\n${msgs.join('\n')}`);
    }
  }, [getActiveDocument, schemaAssignments, getAllDocuments]);

  const handleAssignSchema = useCallback(() => {
    const activeDoc = getActiveDocument();
    if (!activeDoc) return;

    const allDocs = getAllDocuments();
    const xsdDocs = allDocs.filter((d) => d.type === DocumentType.XSD);

    if (xsdDocs.length === 0) {
      alert('No XSD files are open. Please open an XSD file first.');
      return;
    }

    const options = xsdDocs.map((d, i) => `${i + 1}. ${d.name}`).join('\n');
    const choice = prompt(`Select XSD schema to assign:\n\n${options}\n\nEnter number:`);
    if (!choice) return;

    const index = parseInt(choice, 10) - 1;
    if (isNaN(index) || index < 0 || index >= xsdDocs.length) {
      alert('Invalid selection.');
      return;
    }

    setSchemaAssignments((prev) => {
      const next = new Map(prev);
      next.set(activeDoc.id, xsdDocs[index].id);
      return next;
    });

    alert(`Schema "${xsdDocs[index].name}" assigned to "${activeDoc.name}".`);
  }, [getActiveDocument, getAllDocuments]);

  // Handle schema selection from modal
  const handleSchemaSelect = useCallback((xsdDocument: Document) => {
    setShowSchemaModal(false);

    const activeDoc = getActiveDocument();
    if (!activeDoc) return;

    try {
      const errors = validateXMLAgainstXSD(activeDoc.content, xsdDocument.content);
      setValidationErrors(errors);

      if (errors.length === 0) {
        alert(`✓ XML is valid according to ${xsdDocument.name}`);
      } else {
        const msgs = errors.map((e) => `Line ${e.line}: ${e.message}`);
        alert(`✗ ${errors.length} validation error(s):\n\n${msgs.join('\n')}`);
      }
    } catch (error) {
      alert(`Validation error: ${error}`);
    }
  }, [getActiveDocument]);

  // Parse XSD schema for graph visualization
  const parsedSchema = useMemo(() => {
    const activeDoc = getActiveDocument();
    if (activeDoc?.type === DocumentType.XSD && xsdViewMode === 'visualizer') {
      try {
        return parseXSD(activeDoc.content);
      } catch {
        return null;
      }
    }
    return null;
  }, [getActiveDocument, xsdViewMode]);

  // ─── Render ────────────────────────────────────

  const isActiveXSD = activeDocument?.type === DocumentType.XSD;

  const handleShowGraph = useCallback(() => {
    if (activeDocument?.type === DocumentType.XSD) {
      setXsdViewMode('visualizer');
    }
  }, [activeDocument]);

  return (
    <AppLayout
      sidebar={
        <LeftSidebar
          actionsPanel={
            <ActionsPanel
              document={activeDocument ?? null}
              onShowGraph={handleShowGraph}
              onGenerateXML={handleGenerateXML}
              onGenerateXsd={handleGenerateXSD}
              onValidate={handleValidateXSD}
              onAssignSchema={handleAssignSchema}
            />
          }
          filesPanel={
            <FilesPanel
              documents={openDocuments}
              activeDocumentId={activeDocument?.id ?? ''}
              onDocumentSelect={handleDocumentSelect}
              validationErrors={validationErrorsMap}
            />
          }
        />
      }
    >
      <div
        className="document-manager"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <TopBar
          onNewFile={handleNewFile}
          onOpenFile={handleOpenButtonClick}
          onSave={() => activeDocument && saveFile(activeDocument)}
          hasActiveDocument={!!activeDocument}
        />

        <input
          ref={fileInputRef}
          type="file"
          className="document-file-input"
          onChange={handleFileSelected}
          accept=".xml,.xsd,.xsl,.xslt,.xq,.xquery,.json"
          data-testid="file-input"
        />

        <DocumentTabs
          documents={openDocuments}
          activeDocumentId={activeDocument?.id ?? null}
          onTabClick={handleTabClick}
          onClose={handleClose}
        />

        {activeDocument && isActiveXSD && (
          <div className="view-mode-bar">
            <div className="view-mode-toggles">
              <button
                className={`view-mode-btn ${xsdViewMode === 'text' ? 'active' : ''}`}
                onClick={() => setXsdViewMode('text')}
                data-testid="xsd-text-view-btn"
              >
                Text
              </button>
              <button
                className={`view-mode-btn ${xsdViewMode === 'visualizer' ? 'active' : ''}`}
                onClick={() => setXsdViewMode('visualizer')}
                data-testid="xsd-visual-view-btn"
              >
                Visual
              </button>
            </div>
          </div>
        )}

        <div className="document-content">
          {activeDocument ? (
            <div className="active-document" data-testid="active-document">
              {isActiveXSD ? (
                xsdViewMode === 'visualizer' ? (
                  parsedSchema ? (
                    <XSDGraphVisualizer schema={parsedSchema} />
                  ) : (
                    <div className="error-state">
                      <p>Failed to parse XSD schema for visualization.</p>
                    </div>
                  )
                ) : (
                  <XSDVisualizer xsdContent={activeDocument.content} />
                )
              ) : (
                <XMLTextEditor
                  document={activeDocument}
                  onSave={() => saveFile(activeDocument)}
                />
              )}
            </div>
          ) : (
            <div className="empty-state" data-testid="empty-state">
              <div className="empty-state-content">
                <h2>No Document Open</h2>
                <p>Create a new file or open an existing file to get started</p>
              </div>
            </div>
          )}
        </div>

        <ValidationPanel
          errors={validationErrors}
          visible={validationErrors.length > 0}
          onErrorClick={(error) => {
            if (error.line) {
              // TODO: Implement focus logic for editor line
              console.log('Focus on line:', error.line);
            }
          }}
        />

        {showSchemaModal && (
          <SchemaSelectionModal
            xsdDocuments={getAllDocuments().filter(d => d.type === DocumentType.XSD)}
            onSelect={handleSchemaSelect}
            onCancel={() => setShowSchemaModal(false)}
          />
        )}
      </div>
    </AppLayout>
  );
}

