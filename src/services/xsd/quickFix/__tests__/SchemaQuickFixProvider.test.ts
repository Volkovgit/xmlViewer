/**
 * Unit tests for SchemaQuickFixProvider
 *
 * Tests quick fix provider that suggests code actions for schema validation errors.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaQuickFixProvider } from '../SchemaQuickFixProvider';

// Mock Monaco editor
const mockUri = {
  file: vi.fn((path: string) => ({ toString: () => path })),
  parse: vi.fn((str: string) => str),
};

vi.mock('monaco-editor', () => ({
  default: {
    Uri: mockUri,
  },
}));

// Mock Monaco editor types
interface MockModel {
  uri: { toString: () => string };
  getValueInRange(range: any): string;
}

interface MockRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

interface MockContext {
  markers: any[];
}

describe('SchemaQuickFixProvider', () => {
  let provider: SchemaQuickFixProvider;
  let mockModel: MockModel;
  let mockRange: MockRange;
  let mockContext: MockContext;
  let mockToken: { isCancellationRequested: boolean };

  beforeEach(() => {
    provider = new SchemaQuickFixProvider();
    mockModel = {
      uri: { toString: () => 'test.xml' },
      getValueInRange: (range: any) => '',
    };
    mockRange = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 10,
    };
    mockContext = {
      markers: [],
    };
    mockToken = {
      isCancellationRequested: false,
    };
  });

  describe('provideCodeActions', () => {
    it('should return empty actions array for skeleton implementation', () => {
      const result = provider.provideCodeActions(
        mockModel as any,
        mockRange as any,
        mockContext as any,
        mockToken as any
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('actions');
      expect(Array.isArray(result.actions)).toBe(true);
      expect(result.actions).toHaveLength(0);
    });

    it('should handle cancellation token', () => {
      mockToken.isCancellationRequested = true;

      const result = provider.provideCodeActions(
        mockModel as any,
        mockRange as any,
        mockContext as any,
        mockToken as any
      );

      expect(result).toBeDefined();
      expect(result.actions).toEqual([]);
    });

    it('should handle context with markers', () => {
      mockContext.markers = [
        {
          code: 'missing-required-attribute',
          severity: 8, // Error
          message: 'Required attribute "id" is missing',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 10,
        },
      ];

      const result = provider.provideCodeActions(
        mockModel as any,
        mockRange as any,
        mockContext as any,
        mockToken as any
      );

      // Skeleton implementation returns empty actions
      expect(result).toBeDefined();
      expect(result.actions).toEqual([]);
    });
  });
});
