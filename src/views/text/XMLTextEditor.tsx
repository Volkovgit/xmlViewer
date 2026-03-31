/**
 * XML Text Editor Component
 *
 * Provides XML editing functionality with real-time validation and status bar.
 * Integrates with MonacoEditor for syntax highlighting and DocumentStore for state management.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { MonacoEditor } from './MonacoEditor';
import { xmlValidator } from '@/core/validatorEngine';
import { useDocumentStore } from '@/stores';
import type { Document } from '@/types';
import type * as Monaco from 'monaco-editor';
import './XMLTextEditor.css';

/**
 * Props interface for XMLTextEditor component
 */
export interface XMLTextEditorProps {
  /** Document to edit */
  document: Document;
  /** Callback when content changes */
  onContentChange?: (content: string) => void;
  /** Callback when save is requested */
  onSave?: () => void;
  /** Whether editor is read-only */
  readOnly?: boolean;
}

/**
 * Editor position state interface
 */
interface EditorPosition {
  /** Current line number (1-based) */
  line: number;
  /** Current column number (1-based) */
  column: number;
}

/**
 * Document statistics interface
 */
interface DocumentStats {
  /** Total number of lines in document */
  lineCount: number;
  /** File size in bytes */
  size: number;
  /** Encoding format */
  encoding: string;
}

/**
 * XML Text Editor Component
 *
 * Features:
 * - Real-time XML validation with debouncing
 * - Status bar with cursor position, line count, file size, and encoding
 * - Validation status display
 * - Controlled mode with DocumentStore integration
 * - Read-only mode support
 *
 * @example
 * ```tsx
 * <XMLTextEditor
 *   document={activeDocument}
 *   onContentChange={(content) => console.log('Content changed:', content)}
 *   readOnly={false}
 * />
 * ```
 */
export function XMLTextEditor({
  document,
  onContentChange,
  onSave,
  readOnly = false,
}: XMLTextEditorProps) {
  const { updateDocumentContent } = useDocumentStore();

  // State for validation errors and cursor position
  const [errors, setErrors] = useState(0);
  const [position, setPosition] = useState<EditorPosition>({ line: 1, column: 1 });

  /**
   * Calculate document statistics
   */
  const documentStats: DocumentStats = useMemo(() => {
    const lineCount = document.content.split('\n').length;
    const size = new Blob([document.content]).size;
    return {
      lineCount,
      size,
      encoding: 'UTF-8',
    };
  }, [document.content]);

  /**
   * Format validation status message
   */
  const validationStatus = useMemo(() => {
    if (errors === 0) {
      return '✓ Valid';
    }
    return `✗ ${errors} error${errors > 1 ? 's' : ''}`;
  }, [errors]);

  /**
   * Handle content changes from Monaco Editor
   * Updates document store and triggers validation
   */
  const handleChange = useCallback(
    (value: string) => {
      // Update document in store (marks dirty, updates timestamp)
      updateDocumentContent(document.id, value);

      // Notify parent if needed
      onContentChange?.(value);

      // Validate using real-time validation (debounced internally by validator)
      const validationErrors = xmlValidator.validateRealTime(value);

      // Update errors count for status bar
      setErrors(validationErrors.length);
    },
    [document.id, onContentChange, updateDocumentContent]
  );

  /**
   * Handle cursor position changes
   */
  const handleCursorChange = useCallback(
    (event: Monaco.editor.ICursorPositionChangedEvent) => {
      const newPosition = event.position;
      setPosition({
        line: newPosition.lineNumber,
        column: newPosition.column,
      });
    },
    []
  );

  /**
   * Initialize validation errors from document on mount
   */
  useEffect(() => {
    if (document.validationErrors) {
      setErrors(document.validationErrors.length);
    } else {
      // Perform initial validation
      const validationErrors = xmlValidator.validateRealTime(document.content);
      setErrors(validationErrors.length);
    }
  }, [document.id, document.validationErrors, document.content]);

  /**
   * Clean up validator state on unmount
   */
  useEffect(() => {
    return () => {
      xmlValidator.cancelPendingValidation();
    };
  }, []);

  return (
    <div className="xml-text-editor">
      <MonacoEditor
        value={document.content}
        language="xml"
        onChange={handleChange}
        onDidChangeCursorPosition={handleCursorChange}
        onSave={onSave}
        readOnly={readOnly}
        height="calc(100% - 30px)"
        options={{
          automaticLayout: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          // Disable tab switching for now (Phase 3)
          tabFocusMode: false,
        }}
      />
      <div className="status-bar">
        <span className="status-item" data-testid="cursor-position">
          Ln {position.line}, Col {position.column}
        </span>
        <span className="status-item" data-testid="line-count">
          {documentStats.lineCount} lines
        </span>
        <span className="status-item" data-testid="file-size">
          {documentStats.size} bytes
        </span>
        <span className="status-item" data-testid="encoding">
          {documentStats.encoding}
        </span>
        <span
          className={`status-item validation-status ${errors > 0 ? 'has-errors' : 'valid'}`}
          data-testid="validation-status"
        >
          {validationStatus}
        </span>
      </div>
    </div>
  );
}

export default XMLTextEditor;
