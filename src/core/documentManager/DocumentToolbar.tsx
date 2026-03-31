/**
 * DocumentToolbar Props
 */
interface DocumentToolbarProps {
  /** Callback when New File button is clicked */
  onNewFile: () => void;
  /** Callback when Open File button is clicked */
  onOpenFile: () => void;
  /** Callback when Save File button is clicked */
  onSaveFile?: () => void;
  /** Callback when Save File As button is clicked */
  onSaveFileAs?: () => void;
  /** Callback when Save All Documents button is clicked */
  onSaveAllDocuments?: () => void;
  /** Whether there are dirty documents */
  hasDirtyDocuments?: boolean;
  /** Whether there is an active document */
  hasActiveDocument?: boolean;
  /** Whether the active document is XML */
  isActiveXML?: boolean;
  /** Whether the active document is XSD */
  isActiveXSD?: boolean;
  /** Callback to generate XSD from XML */
  onGenerateXSD?: () => void;
  /** Callback to generate XML from XSD */
  onGenerateXML?: () => void;
  /** Callback to validate XML against XSD */
  onValidateXSD?: () => void;
  /** Callback to assign a schema to the active document */
  onAssignSchema?: () => void;
}

/**
 * DocumentToolbar Component
 *
 * Toolbar component with file operations and XSD tools.
 */
export function DocumentToolbar({
  onNewFile,
  onOpenFile,
  onSaveFile,
  onSaveFileAs,
  onSaveAllDocuments,
  hasDirtyDocuments = false,
  hasActiveDocument = false,
  isActiveXML = false,
  isActiveXSD = false,
  onGenerateXSD,
  onGenerateXML,
  onValidateXSD,
  onAssignSchema,
}: DocumentToolbarProps) {
  return (
    <div className="document-toolbar">
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-button"
          onClick={onNewFile}
          data-testid="new-file-button"
          title="New File (Ctrl+N)"
        >
          New File
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={onOpenFile}
          data-testid="open-file-button"
          title="Open File (Ctrl+O)"
        >
          Open File
        </button>
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-button"
          onClick={onSaveFile}
          data-testid="save-file-button"
          disabled={!hasActiveDocument}
          title="Save (Ctrl+S)"
        >
          Save
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={onSaveFileAs}
          data-testid="save-file-as-button"
          disabled={!hasActiveDocument}
          title="Save As (Ctrl+Shift+S)"
        >
          Save As...
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={onSaveAllDocuments}
          data-testid="save-all-button"
          disabled={!hasDirtyDocuments}
          title="Save All"
        >
          Save All
        </button>
      </div>

      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-button"
          onClick={onGenerateXSD}
          data-testid="generate-xsd-button"
          disabled={!isActiveXML}
          title="Generate XSD from XML"
        >
          Generate XSD
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={onGenerateXML}
          data-testid="generate-xml-button"
          disabled={!isActiveXSD}
          title="Generate XML from XSD"
        >
          Generate XML
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={onValidateXSD}
          data-testid="validate-xsd-button"
          disabled={!isActiveXML}
          title="Validate against XSD"
        >
          Validate XSD
        </button>
        <button
          type="button"
          className="toolbar-button"
          onClick={onAssignSchema}
          data-testid="assign-schema-button"
          disabled={!isActiveXML}
          title="Assign Schema"
        >
          Assign Schema
        </button>
      </div>
    </div>
  );
}

