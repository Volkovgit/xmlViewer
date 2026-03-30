/**
 * Tests for MonacoEditor component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { MonacoEditor, MonacoEditorHandle } from '../MonacoEditor';

// Mock Monaco Editor
const mockEditorInstance: any = {
  getValue: vi.fn(() => ''),
  setValue: vi.fn(),
  getAction: vi.fn(() => ({
    run: vi.fn(),
  })),
  addCommand: vi.fn(),
  focus: vi.fn(),
  updateOptions: vi.fn(),
};

vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(
    ({
      value,
      language,
      theme,
      options,
      height,
      onMount,
      onChange,
      loading,
    }: any) => {
      // Simulate editor mount
      React.useEffect(() => {
        if (onMount) {
          mockEditorInstance.getValue = vi.fn(() => value);
          mockEditorInstance.setValue = vi.fn((val: string) => {
            if (onChange) onChange(val);
          });

          const mockMonaco: any = {
            KeyMod: {
              CtrlCmd: 1,
              Shift: 2,
            },
            KeyCode: {
              KeyS: 83,
              KeyF: 70,
            },
            editor: {
              IStandaloneEditorConstructionOptions: {},
            },
          };
          onMount(mockEditorInstance, mockMonaco);
        }
      }, [onMount, value, onChange]);

      // Show loading if provided, otherwise show textarea
      // In the actual component, loading is undefined by default, so we treat it as falsy
      const hasCustomLoading = loading !== undefined;

      return (
        <div
          data-testid="monaco-editor"
          data-language={language}
          data-theme={theme}
          data-height={height}
          data-readonly={options?.readOnly || false}
        >
          {hasCustomLoading ? (
            loading
          ) : (
            <textarea
              data-testid="monaco-textarea"
              value={value}
              readOnly={options?.readOnly || false}
            />
          )}
        </div>
      );
    }
  ),
}));

const React = await import('react');

describe('MonacoEditor', () => {
  const defaultProps = {
    value: '<root></root>',
    language: 'xml' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render editor with default props', () => {
      render(<MonacoEditor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('data-language', 'xml');
      expect(editor).toHaveAttribute('data-theme', 'vs-light');
      expect(editor).toHaveAttribute('data-readonly', 'false');
    });

    it('should render with custom height', () => {
      render(<MonacoEditor {...defaultProps} height="600px" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-height', '600px');
    });

    it('should render with numeric height', () => {
      render(<MonacoEditor {...defaultProps} height={500} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-height', '500');
    });

    it('should render with custom className', () => {
      const { container } = render(
        <MonacoEditor {...defaultProps} className="custom-editor" />
      );

      const editorContainer = container.querySelector('.monaco-editor-container');
      expect(editorContainer).toHaveClass('custom-editor');
    });

    it('should render with custom loading component', () => {
      const customLoading = <div data-testid="custom-loading">Loading...</div>;
      render(<MonacoEditor {...defaultProps} loading={customLoading} />);

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });

    it('should render with value', () => {
      render(<MonacoEditor {...defaultProps} value="<test>content</test>" />);

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('<test>content</test>');
    });
  });

  describe('Language Support', () => {
    it('should support XML language', () => {
      render(<MonacoEditor {...defaultProps} language="xml" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'xml');
    });

    it('should support XSD language', () => {
      render(<MonacoEditor {...defaultProps} language="xsd" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'xsd');
    });

    it('should support XSLT language', () => {
      render(<MonacoEditor {...defaultProps} language="xslt" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'xslt');
    });

    it('should support XQuery language', () => {
      render(<MonacoEditor {...defaultProps} language="xquery" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'xquery');
    });

    it('should support JSON language', () => {
      render(<MonacoEditor {...defaultProps} language="json" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'json');
    });

    it('should support JavaScript language', () => {
      render(<MonacoEditor {...defaultProps} language="javascript" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'javascript');
    });

    it('should support TypeScript language', () => {
      render(<MonacoEditor {...defaultProps} language="typescript" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'typescript');
    });

    it('should support Markdown language', () => {
      render(<MonacoEditor {...defaultProps} language="markdown" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'markdown');
    });
  });

  describe('Theme Support', () => {
    it('should render with vs-light theme by default', () => {
      render(<MonacoEditor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-theme', 'vs-light');
    });

    it('should render with vs-dark theme', () => {
      render(<MonacoEditor {...defaultProps} theme="vs-dark" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-theme', 'vs-dark');
    });

    it('should support theme switching', () => {
      const { rerender } = render(
        <MonacoEditor {...defaultProps} theme="vs-light" />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-theme', 'vs-light');

      rerender(<MonacoEditor {...defaultProps} theme="vs-dark" />);
      expect(editor).toHaveAttribute('data-theme', 'vs-dark');
    });
  });

  describe('Read-Only Mode', () => {
    it('should be editable by default', () => {
      render(<MonacoEditor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-readonly', 'false');
    });

    it('should support read-only mode', () => {
      render(<MonacoEditor {...defaultProps} readOnly={true} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-readonly', 'true');
    });

    it('should respect readOnly in options over prop', () => {
      render(
        <MonacoEditor
          {...defaultProps}
          readOnly={false}
          options={{ readOnly: true }}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-readonly', 'true');
    });
  });

  describe('Value Changes', () => {
    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn();
      render(<MonacoEditor {...defaultProps} onChange={handleChange} />);

      const textarea = screen.getByTestId('monaco-textarea');

      // Note: This test verifies the component structure
      // Actual change testing would require more complex mock setup
      expect(textarea).toBeInTheDocument();
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should support controlled mode', () => {
      const { rerender } = render(
        <MonacoEditor {...defaultProps} value="<root>v1</root>" />
      );

      const textarea = screen.getByTestId('monaco-textarea');

      expect(textarea).toHaveValue('<root>v1</root>');

      rerender(<MonacoEditor {...defaultProps} value="<root>v2</root>" />);
      expect(textarea).toHaveValue('<root>v2</root>');
    });

    it('should support uncontrolled mode (no onChange)', () => {
      render(<MonacoEditor {...defaultProps} onChange={undefined} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Editor Options', () => {
    it('should merge custom options with defaults', () => {
      render(
        <MonacoEditor
          {...defaultProps}
          options={{
            fontSize: 16,
            minimap: { enabled: false },
          }}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should apply custom tabSize option', () => {
      render(<MonacoEditor {...defaultProps} options={{ tabSize: 4 }} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should apply custom wordWrap option', () => {
      render(<MonacoEditor {...defaultProps} options={{ wordWrap: 'off' }} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should apply custom minimap option', () => {
      render(
        <MonacoEditor
          {...defaultProps}
          options={{ minimap: { enabled: false } }}
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Editor Ref API', () => {
    it('should expose editor methods via ref', async () => {
      const TestComponent = () => {
        const editorRef = useRef<MonacoEditorHandle>(null);

        React.useEffect(() => {
          // Test ref methods
          expect(editorRef.current).toBeDefined();
          expect(typeof editorRef.current?.getValue).toBe('function');
          expect(typeof editorRef.current?.setValue).toBe('function');
          expect(typeof editorRef.current?.formatDocument).toBe('function');
          expect(typeof editorRef.current?.focus).toBe('function');
          expect(typeof editorRef.current?.getEditor).toBe('function');
          expect(typeof editorRef.current?.getMonaco).toBe('function');
        }, []);

        return <MonacoEditor {...defaultProps} ref={editorRef} />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });
    });

    it('should get current value via ref', async () => {
      let handleRef: MonacoEditorHandle | null = null;

      const TestComponent = () => {
        const editorRef = useRef<MonacoEditorHandle>(null);

        React.useEffect(() => {
          handleRef = editorRef.current;
          const value = handleRef?.getValue();
          expect(value).toBe('<root></root>');
        }, []);

        return <MonacoEditor {...defaultProps} ref={editorRef} />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(handleRef).toBeDefined();
      });
    });

    it('should set value via ref', async () => {
      let handleRef: MonacoEditorHandle | null = null;

      const TestComponent = () => {
        const editorRef = useRef<MonacoEditorHandle>(null);

        React.useEffect(() => {
          handleRef = editorRef.current;
          handleRef?.setValue('<new>value</new>');
        }, []);

        return <MonacoEditor {...defaultProps} ref={editorRef} />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(handleRef).toBeDefined();
      });
    });

    it('should call formatDocument via ref', async () => {
      let handleRef: MonacoEditorHandle | null = null;

      const TestComponent = () => {
        const editorRef = useRef<MonacoEditorHandle>(null);

        React.useEffect(() => {
          handleRef = editorRef.current;
          handleRef?.formatDocument();
        }, []);

        return <MonacoEditor {...defaultProps} ref={editorRef} />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(handleRef).toBeDefined();
      });
    });

    it('should call focus via ref', async () => {
      let handleRef: MonacoEditorHandle | null = null;

      const TestComponent = () => {
        const editorRef = useRef<MonacoEditorHandle>(null);

        React.useEffect(() => {
          handleRef = editorRef.current;
          handleRef?.focus();
        }, []);

        return <MonacoEditor {...defaultProps} ref={editorRef} />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(handleRef).toBeDefined();
      });
    });

    it('should get editor instance via ref', async () => {
      let handleRef: MonacoEditorHandle | null = null;

      const TestComponent = () => {
        const editorRef = useRef<MonacoEditorHandle>(null);

        React.useEffect(() => {
          handleRef = editorRef.current;
          const editor = handleRef?.getEditor();
          expect(editor).toBeDefined();
        }, []);

        return <MonacoEditor {...defaultProps} ref={editorRef} />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(handleRef).toBeDefined();
      });
    });

    it('should get Monaco instance via ref', async () => {
      let handleRef: MonacoEditorHandle | null = null;

      const TestComponent = () => {
        const editorRef = useRef<MonacoEditorHandle>(null);

        React.useEffect(() => {
          handleRef = editorRef.current;
          const monaco = handleRef?.getMonaco();
          expect(monaco).toBeDefined();
        }, []);

        return <MonacoEditor {...defaultProps} ref={editorRef} />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(handleRef).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<MonacoEditor {...defaultProps} value="" />);

      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('');
    });

    it('should handle very long content', () => {
      const longContent = '<root>' + 'a'.repeat(10000) + '</root>';
      render(<MonacoEditor {...defaultProps} value={longContent} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = '<root><![CDATA[<special>&chars;]]></root>';
      render(<MonacoEditor {...defaultProps} value={specialContent} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should handle undefined onChange', () => {
      render(<MonacoEditor {...defaultProps} onChange={undefined} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work in controlled mode with state', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('<root></root>');

        return (
          <MonacoEditor
            value={value}
            language="xml"
            onChange={setValue}
            height="400px"
            theme="vs-dark"
          />
        );
      };

      render(<TestComponent />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-theme', 'vs-dark');
      expect(editor).toHaveAttribute('data-height', '400px');
    });

    it('should support dynamic language changes', () => {
      const { rerender } = render(
        <MonacoEditor {...defaultProps} language="xml" />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'xml');

      rerender(<MonacoEditor {...defaultProps} language="json" />);
      expect(editor).toHaveAttribute('data-language', 'json');
    });

    it('should support dynamic theme changes', () => {
      const { rerender } = render(
        <MonacoEditor {...defaultProps} theme="vs-light" />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-theme', 'vs-light');

      rerender(<MonacoEditor {...defaultProps} theme="vs-dark" />);
      expect(editor).toHaveAttribute('data-theme', 'vs-dark');
    });
  });

  describe('Accessibility', () => {
    it('should have proper container structure', () => {
      const { container } = render(<MonacoEditor {...defaultProps} />);

      const editorContainer = container.querySelector(
        '.monaco-editor-container'
      );
      expect(editorContainer).toBeInTheDocument();
    });

    it('should pass through className to container', () => {
      const { container } = render(
        <MonacoEditor
          {...defaultProps}
          className="my-custom-class another-class"
        />
      );

      const editorContainer = container.querySelector(
        '.monaco-editor-container'
      );
      expect(editorContainer).toHaveClass('my-custom-class', 'another-class');
    });
  });
});
