import { useCallback, useState, useMemo } from 'react';
import { useDocumentStore } from '@/stores';
import { createUntitledDocument } from '@/services/document';
import { DocumentType, DocumentStatus } from '@/types';
import { ValidationError } from '@/types';
import { useFileOperations } from '@/hooks/useFileOperations';
import { generateXSDFromXML, generateXMLFromXSD, validateXMLAgainstXSD } from '@/services/xsd';
import { AppLayout } from '@/components/layout';
import { LeftSidebar } from '@/components/layout';
import { ActionsPanel } from '@/components/actions';
import { FilesPanel } from '@/components/files';
import { DocumentTabs } from './DocumentTabs';
import { DocumentToolbar } from './DocumentToolbar';
import { XMLTextEditor } from '@/views/text';
import { XMLTree } from '@/views/tree';
import { XMLGrid } from '@/views/grid';
import { XSDVisualizer } from '@/views/xsd/XSDVisualizer';
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
    updateDocumentContent,
  } = useDocumentStore();

  const {
    handleFileSelected,
    handleFiles,
    fileInputRef,
    saveFile,
    saveFileAs,
    saveAllDocuments,
    hasDirtyDocuments,
  } = useFileOperations();

  // Schema assignment state: maps docId → schemaDocId
  const [schemaAssignments, setSchemaAssignments] = useState<Map<string, string>>(new Map());
  // Validation errors from XSD validation
  const [xsdErrors, setXsdErrors] = useState<string[]>([]);
  // XSD view mode: 'text' or 'visualizer'
  const [xsdViewMode, setXsdViewMode] = useState<'text' | 'visualizer'>('text');
  // XML view mode: 'text', 'tree', or 'grid'
  const [xmlViewMode, setXmlViewMode] = useState<'text' | 'tree' | 'grid'>('text');

  // Get data for FilesPanel
  const openDocuments = getAllDocuments();
  const activeDocument = getActiveDocument();

  // Validation errors map for FilesPanel - empty for now, will be populated when validation is integrated
  const validationErrors = useMemo(() => new Map<string, ValidationError[]>(), []);

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
      setXsdErrors([]);
      alert('✓ XML is valid against the assigned schema.');
    } else {
      const msgs = errors.map((e) => `Line ${e.line}: ${e.message}`);
      setXsdErrors(msgs);
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

  // Handle grid cell value changes
  const handleGridCellValueChanged = useCallback(
    (newXml: string) => {
      const activeDoc = getActiveDocument();
      if (!activeDoc) return;

      updateDocumentContent(activeDoc.id, newXml);
    },
    [getActiveDocument, updateDocumentContent]
  );

  // ─── Render ────────────────────────────────────

  const isActiveXML = activeDocument?.type === DocumentType.XML;
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
              validationErrors={validationErrors}
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
        <DocumentToolbar
          onNewFile={handleNewFile}
          onOpenFile={handleOpenButtonClick}
          onSaveFile={() => activeDocument && saveFile(activeDocument)}
          onSaveFileAs={() => activeDocument && saveFileAs(activeDocument)}
          onSaveAllDocuments={saveAllDocuments}
          hasDirtyDocuments={hasDirtyDocuments}
          hasActiveDocument={!!activeDocument}
          isActiveXML={isActiveXML}
          isActiveXSD={isActiveXSD}
          onGenerateXSD={handleGenerateXSD}
          onGenerateXML={handleGenerateXML}
          onValidateXSD={handleValidateXSD}
          onAssignSchema={handleAssignSchema}
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

        <div className="document-content">
          {activeDocument ? (
            <div className="active-document" data-testid="active-document">
              {isActiveXSD ? (
                xsdViewMode === 'visualizer' ? (
                  <XSDVisualizer xsdContent={activeDocument.content} />
                ) : (
                  <XMLTextEditor
                    document={activeDocument}
                    onSave={() => saveFile(activeDocument)}
                  />
                )
              ) : isActiveXML ? (
                xmlViewMode === 'tree' ? (
                  <XMLTree document={activeDocument} />
                ) : xmlViewMode === 'grid' ? (
                  <XMLGrid document={activeDocument} onCellValueChanged={handleGridCellValueChanged} />
                ) : (
                  <XMLTextEditor
                    document={activeDocument}
                    onSave={() => saveFile(activeDocument)}
                  />
                )
              ) : (
                <XMLTextEditor
                  document={activeDocument}
                  onSave={() => saveFile(activeDocument)}
                />
              )}
              {isActiveXSD && (
                <div className="xsd-view-toggle">
                  <button
                    className={`toggle-btn ${xsdViewMode === 'text' ? 'active' : ''}`}
                    onClick={() => setXsdViewMode('text')}
                    data-testid="xsd-text-view-btn"
                  >
                    Text
                  </button>
                  <button
                    className={`toggle-btn ${xsdViewMode === 'visualizer' ? 'active' : ''}`}
                    onClick={() => setXsdViewMode('visualizer')}
                    data-testid="xsd-visual-view-btn"
                  >
                    Visual
                  </button>
                </div>
              )}
              {isActiveXML && (
                <div className="xml-view-toggle">
                  <button
                    className={`toggle-btn ${xmlViewMode === 'text' ? 'active' : ''}`}
                    onClick={() => setXmlViewMode('text')}
                    data-testid="xml-text-view-btn"
                  >
                    Text View
                  </button>
                  <button
                    className={`toggle-btn ${xmlViewMode === 'tree' ? 'active' : ''}`}
                    onClick={() => setXmlViewMode('tree')}
                    data-testid="xml-tree-view-btn"
                  >
                    Tree View
                  </button>
                  <button
                    className={`toggle-btn ${xmlViewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setXmlViewMode('grid')}
                    data-testid="xml-grid-view-btn"
                  >
                    Grid View
                  </button>
                </div>
              )}
              {xsdErrors.length > 0 && isActiveXML && (
                <div className="xsd-error-panel" data-testid="xsd-error-panel">
                  <h4>XSD Validation Errors</h4>
                  <ul>
                    {xsdErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
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
      </div>
    </AppLayout>
  );
}

