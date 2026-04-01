import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaCompletionProvider } from '../SchemaCompletionProvider';
import type { XSDSchema } from '@/services/xsd/XSDParser';
import * as Monaco from 'monaco-editor';

// Mock Monaco URI
vi.mock('monaco-editor', () => ({
  Uri: {
    parse: vi.fn((path: string) => ({ path, toString: () => path }))
  },
  Position: class {
    constructor(public lineNumber: number, public column: number) {}
  },
  languages: {
    CompletionTriggerKind: {
      Invoke: 0,
      TriggerCharacter: 1,
      TriggerForIncompleteCompletions: 2
    }
  },
  CancellationToken: {
    None: {
      isCancellationRequested: false,
      onCancellationRequested: vi.fn()
    }
  }
}));

// Mock XSD schema for testing
const mockSchema: XSDSchema = {
  targetNamespace: 'http://example.com',
  elements: [
    {
      name: 'book',
      type: 'xs:string',
      occurrence: { minOccurs: 1, maxOccurs: 'unbounded' },
      complexType: {
        name: 'bookType',
        elements: [
          { name: 'title', type: 'xs:string', occurrence: { minOccurs: 1, maxOccurs: 1 } },
          { name: 'author', type: 'xs:string', occurrence: { minOccurs: 1, maxOccurs: 1 } }
        ],
        attributes: [
          { name: 'id', type: 'xs:string', use: 'required' },
          { name: 'lang', type: 'xs:string', use: 'optional' }
        ],
        mixed: false
      }
    }
  ],
  complexTypes: [],
  simpleTypes: [],
  raw: '<xs:schema>...</xs:schema>'
};

// Mock Monaco model
class MockModel implements Partial<Monaco.editor.ITextModel> {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  getValue(): string {
    return this.content;
  }

  getOffsetAt(position: Monaco.Position): number {
    const lines = this.content.split('\n');
    let offset = 0;
    for (let i = 0; i < position.lineNumber - 1; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    offset += position.column - 1;
    return offset;
  }

  // Other required Monaco methods (stubs)
  id = 'mock-model';
  uri: any = { path: 'file://test.xml', toString: () => 'file://test.xml' };
  getLanguageId = (): string => 'xml';
  getVersionId = (): number => 1;
  getAlternativeVersionId = (): number => 1;
  getLineCount = (): number => this.content.split('\n').length;
  getLineContent = (lineNumber: number): string => this.content.split('\n')[lineNumber - 1] || '';
  getLineLength = (lineNumber: number): number => this.getLineContent(lineNumber).length;
  getLinesContent = (): string[] => this.content.split('\n');
  getWordAtPosition = (_position: any): any => null;
  getWordUntilPosition = (position: any): any => ({ word: '', startColumn: position.column, endColumn: position.column });
  replace = (value: string, _range: any): void => { this.content = value; };
}

describe('SchemaCompletionProvider', () => {
  let provider: SchemaCompletionProvider;
  let mockModel: MockModel;

  beforeEach(() => {
    provider = new SchemaCompletionProvider();
    mockModel = new MockModel('<book></book>');
  });

  describe('when no schema attached', () => {
    it('should return null when calling provideCompletionItems', () => {
      const position = new (Monaco.Position as any)(1, 1);
      const context: any = {
        triggerKind: 0, // Invoke
        triggerCharacter: undefined
      };
      const token = (Monaco as any).CancellationToken.None;

      const result = provider.provideCompletionItems(mockModel as any, position, context, token);

      expect(result).toBeNull();
    });

    it('should return suggestions list with null value', async () => {
      const position = new (Monaco.Position as any)(1, 1);
      const context: any = {
        triggerKind: 0, // Invoke
        triggerCharacter: undefined
      };
      const token = (Monaco as any).CancellationToken.None;

      const result = await provider.provideCompletionItems!(mockModel as any, position, context, token);

      expect(result).toBeNull();
    });
  });

  describe('when schema attached and inside opening tag', () => {
    beforeEach(() => {
      provider.attachToDocument(mockSchema);
    });

    it('should generate suggestions when cursor is inside opening tag', () => {
      const position = new (Monaco.Position as any)(1, 7); // Inside <book>|</book>
      const context: any = {
        triggerKind: 0, // Invoke
        triggerCharacter: undefined
      };
      const token = (Monaco as any).CancellationToken.None;

      const result = provider.provideCompletionItems(mockModel as any, position, context, token);

      expect(result).not.toBeNull();
      if (result && 'suggestions' in result) {
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should include attributes in suggestions', () => {
      const position = new (Monaco.Position as any)(1, 7);
      const context: any = {
        triggerKind: 0, // Invoke
        triggerCharacter: undefined
      };
      const token = (Monaco as any).CancellationToken.None;

      const result = provider.provideCompletionItems(mockModel as any, position, context, token);

      // Should suggest 'id' and 'lang' as attributes
      if (result && 'suggestions' in result) {
        const labels = result.suggestions?.map((s: any) => s.label) || [];
        expect(labels).toContain('id');
        expect(labels).toContain('lang');
      }
    });
  });

  describe('detach functionality', () => {
    it('should clear schema and invalidate cache on detach', () => {
      provider.attachToDocument(mockSchema);

      // Get some suggestions to populate cache
      const position = new (Monaco.Position as any)(1, 7);
      const context: any = {
        triggerKind: 0, // Invoke
        triggerCharacter: undefined
      };
      const token = (Monaco as any).CancellationToken.None;
      provider.provideCompletionItems(mockModel as any, position, context, token);

      // Detach
      provider.detach();

      // Should return null after detach
      const result = provider.provideCompletionItems(mockModel as any, position, context, token);
      expect(result).toBeNull();
    });
  });
});
