/**
 * MonacoEditor Usage Examples
 *
 * This file contains examples of how to use the MonacoEditor component
 * in different scenarios.
 */

import { useRef, useState } from 'react';
import { MonacoEditor, MonacoEditorHandle } from './MonacoEditor';

/**
 * Example 1: Basic XML Editor
 */
export function BasicXMLEditor() {
  const [code, setCode] = useState('<root>\n  <item>Example</item>\n</root>');

  return (
    <div style={{ height: '500px' }}>
      <MonacoEditor
        value={code}
        language="xml"
        onChange={(newValue) => setCode(newValue)}
        height="500px"
        theme="vs-light"
      />
    </div>
  );
}

/**
 * Example 2: Read-Only Viewer
 */
export function ReadOnlyViewer({ content }: { content: string }) {
  return (
    <MonacoEditor
      value={content}
      language="xml"
      readOnly={true}
      height="100%"
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
      }}
    />
  );
}

/**
 * Example 3: Editor with Advanced Controls
 */
export function AdvancedEditor() {
  const editorRef = useRef<MonacoEditorHandle>(null);
  const [code, setCode] = useState('<root></root>');
  const [theme, setTheme] = useState<'vs-light' | 'vs-dark'>('vs-light');

  const handleFormat = () => {
    editorRef.current?.formatDocument();
  };

  const handleFocus = () => {
    editorRef.current?.focus();
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'vs-light' ? 'vs-dark' : 'vs-light'));
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleFormat}>Format Document</button>
        <button onClick={handleFocus}>Focus Editor</button>
        <button onClick={toggleTheme}>Toggle Theme</button>
      </div>
      <MonacoEditor
        ref={editorRef}
        value={code}
        language="xml"
        onChange={setCode}
        height="600px"
        theme={theme}
        options={{
          fontSize: 14,
          tabSize: 2,
          wordWrap: 'on',
          minimap: { enabled: true },
        }}
      />
    </div>
  );
}

/**
 * Example 4: Multi-Language Editor
 */
export function MultiLanguageEditor() {
  const [language, setLanguage] = useState<'xml' | 'json' | 'xquery'>('xml');
  const [code, setCode] = useState('<root></root>');

  const handleLanguageChange = (newLanguage: 'xml' | 'json' | 'xquery') => {
    setLanguage(newLanguage);
    // Update content based on language
    switch (newLanguage) {
      case 'xml':
        setCode('<root></root>');
        break;
      case 'json':
        setCode('{}');
        break;
      case 'xquery':
        setCode('for $x in doc("input.xml")//item return $x');
        break;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <select
          value={language}
          onChange={(e) =>
            handleLanguageChange(e.target.value as 'xml' | 'json' | 'xquery')
          }
        >
          <option value="xml">XML</option>
          <option value="json">JSON</option>
          <option value="xquery">XQuery</option>
        </select>
      </div>
      <MonacoEditor
        value={code}
        language={language}
        onChange={setCode}
        height="500px"
        theme="vs-light"
      />
    </div>
  );
}

/**
 * Example 5: Editor with Custom Options
 */
export function CustomizedEditor() {
  const [code, setCode] = useState('<root>\n  <item>Data</item>\n</root>');

  return (
    <MonacoEditor
      value={code}
      language="xml"
      onChange={setCode}
      height="400px"
      theme="vs-dark"
      options={{
        // Font settings
        fontSize: 16,
        fontFamily: "'Fira Code', 'Consolas', monospace",

        // Editor behavior
        tabSize: 4,
        wordWrap: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: true,

        // Formatting
        formatOnPaste: true,
        formatOnType: true,

        // Appearance
        renderWhitespace: 'selection',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',

        // Features
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
      }}
    />
  );
}

/**
 * Example 6: Responsive Editor
 */
export function ResponsiveEditor() {
  const [code, setCode] = useState('<root></root>');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <h2>XML Editor</h2>
      </div>
      <div style={{ flex: 1 }}>
        <MonacoEditor
          value={code}
          language="xml"
          onChange={setCode}
          height="100%"
          theme="vs-light"
          options={{
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
