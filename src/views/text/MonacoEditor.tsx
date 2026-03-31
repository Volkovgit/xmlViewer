/**
 * Monaco Editor Component
 *
 * A reusable wrapper around Monaco Editor for code editing with support for
 * multiple languages, themes, and advanced editor features.
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

/**
 * Supported Monaco themes
 */
export type MonacoTheme = 'vs-light' | 'vs-dark';

/**
 * Supported editor languages
 */
export type EditorLanguage =
  | 'xml'
  | 'xsd'
  | 'xslt'
  | 'xquery'
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'python'
  | 'java'
  | 'csharp'
  | 'cpp'
  | 'sql'
  | 'markdown';

/**
 * Props interface for MonacoEditor component
 */
export interface MonacoEditorProps {
  /** Current editor content */
  value: string;
  /** Editor language for syntax highlighting */
  language: EditorLanguage;
  /** Callback when editor content changes */
  onChange?: (value: string) => void;
  /** Whether editor is read-only */
  readOnly?: boolean;
  /** Editor height (CSS string or number in pixels) */
  height?: string | number;
  /** Editor theme */
  theme?: MonacoTheme;
  /** Additional Monaco editor options */
  options?: Monaco.editor.IStandaloneEditorConstructionOptions;
  /** Editor loading component */
  loading?: React.ReactNode;
  /** Class name for editor container */
  className?: string;
  /** Callback when cursor position changes */
  onDidChangeCursorPosition?: (event: Monaco.editor.ICursorPositionChangedEvent) => void;
  /** Callback when save keyboard shortcut is triggered */
  onSave?: () => void;
}

/**
 * Editor handle interface exposed via ref
 */
export interface MonacoEditorHandle {
  /** Get current editor value */
  getValue: () => string | undefined;
  /** Set editor value */
  setValue: (value: string) => void;
  /** Format document content */
  formatDocument: () => void;
  /** Focus the editor */
  focus: () => void;
  /** Get editor instance */
  getEditor: () => Monaco.editor.IStandaloneCodeEditor | null;
  /** Get Monaco instance */
  getMonaco: () => typeof Monaco | null;
}

/**
 * Default editor options
 */
const DEFAULT_OPTIONS: Monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  readOnly: false,
  // Enable better editing experience
  formatOnPaste: true,
  formatOnType: true,
  autoIndent: 'full',
  renderWhitespace: 'selection',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  // Enable bracket pair colorization
  bracketPairColorization: { enabled: true },
  // Enable guides
  guides: {
    bracketPairs: true,
    indentation: true,
  },
};

/**
 * Monaco Editor Wrapper Component
 *
 * Provides a controlled interface to Monaco Editor with sensible defaults,
 * theme switching, and advanced editor operations via ref.
 *
 * @example
 * ```tsx
 * const editorRef = useRef<MonacoEditorHandle>(null);
 *
 * <MonacoEditor
 *   ref={editorRef}
 *   value={code}
 *   language="xml"
 *   onChange={(newValue) => setCode(newValue)}
 *   theme="vs-dark"
 *   height="600px"
 * />
 *
 * // Later, access editor methods:
 * editorRef.current?.formatDocument();
 * ```
 */
export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  (
    {
      value,
      language,
      onChange,
      readOnly = false,
      height = '100%',
      theme = 'vs-light',
      options = {},
      loading,
      className,
      onDidChangeCursorPosition,
      onSave,
    },
    ref
  ) => {
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof Monaco | null>(null);

    /**
     * Handle editor mount
     */
    const handleEditorDidMount = (
      editor: Monaco.editor.IStandaloneCodeEditor,
      monaco: typeof Monaco
    ) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Apply keyboard shortcuts for common actions
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          // Trigger save handler
          if (onSave) {
            onSave();
          } else {
            console.log('Save command triggered in Monaco Editor');
          }
        }
      );

      // Format on Ctrl/Cmd + Shift + F
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          editor.getAction('editor.action.formatDocument')?.run();
        }
      );

      // Register cursor position change listener if callback provided
      if (onDidChangeCursorPosition) {
        editor.onDidChangeCursorPosition(onDidChangeCursorPosition);
      }
    };

    /**
     * Handle editor value changes
     */
    const handleChange = (newValue: string | undefined) => {
      if (onChange && newValue !== undefined) {
        onChange(newValue);
      }
    };

    /**
     * Expose editor methods via ref
     */
    useImperativeHandle(
      ref,
      () => ({
        getValue: () => editorRef.current?.getValue(),
        setValue: (newValue: string) => {
          editorRef.current?.setValue(newValue);
        },
        formatDocument: () => {
          editorRef.current
            ?.getAction('editor.action.formatDocument')
            ?.run();
        },
        focus: () => {
          editorRef.current?.focus();
        },
        getEditor: () => editorRef.current,
        getMonaco: () => monacoRef.current,
      }),
      []
    );

    /**
     * Merge default options with custom options
     */
    const mergedOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      readOnly: readOnly || options.readOnly || false,
    };

    return (
      <div className={`monaco-editor-container ${className || ''}`}>
        <Editor
          value={value}
          language={language}
          theme={theme}
          options={mergedOptions}
          height={height}
          onMount={handleEditorDidMount}
          onChange={handleChange}
          loading={loading}
        />
      </div>
    );
  }
);

MonacoEditor.displayName = 'MonacoEditor';

export default MonacoEditor;
