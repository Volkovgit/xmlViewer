import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileOperations } from '../useFileOperations';
import { useDocumentStore } from '@/stores/documentStore';
import { createDocumentFromFile } from '@/services/document/DocumentFactory';
import { Document, DocumentStatus, DocumentType } from '@/types';

// Mock the document store
vi.mock('@/stores/documentStore', () => ({
  useDocumentStore: vi.fn(),
}));

// Mock DocumentFactory
vi.mock('@/services/document/DocumentFactory', () => ({
  createDocumentFromFile: vi.fn(),
}));

describe('useFileOperations', () => {
  const mockAddDocument = vi.fn();
  const mockSetActiveDocument = vi.fn();
  const mockUpdateDocumentContent = vi.fn();
  const mockMarkDocumentSaved = vi.fn();
  const mockGetAllDocuments = vi.fn();
  const mockGetRecentDocuments = vi.fn();
  const mockAddToRecents = vi.fn();
  const mockHasDirtyDocuments = vi.fn(() => false);
  const mockUpdateDocumentMetadata = vi.fn();

  const createMockDocument = (overrides?: Partial<Document>): Document => {
    const now = new Date();
    return {
      id: 'test-id-1',
      name: 'test.xml',
      type: DocumentType.XML,
      content: '<?xml version="1.0" encoding="UTF-8"?><root/>',
      status: DocumentStatus.READY,
      createdAt: now,
      modifiedAt: now,
      filePath: '/path/to/file.xml',
      ...overrides,
    };
  };

  const mockDocument = createMockDocument();
  const mockUntitledDocument = createMockDocument({
    id: 'test-id-2',
    name: 'Untitled-xml-1.xml',
    status: DocumentStatus.DIRTY,
    filePath: undefined,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    (useDocumentStore as any).mockReturnValue({
      addDocument: mockAddDocument,
      setActiveDocument: mockSetActiveDocument,
      updateDocumentContent: mockUpdateDocumentContent,
      markDocumentSaved: mockMarkDocumentSaved,
      getAllDocuments: mockGetAllDocuments,
      getRecentDocuments: mockGetRecentDocuments,
      addToRecents: mockAddToRecents,
      hasDirtyDocuments: () => mockHasDirtyDocuments(),
      updateDocumentMetadata: mockUpdateDocumentMetadata,
    });
  });

  describe('openFile', () => {
    it('should trigger file input click', () => {
      const { result } = renderHook(() => useFileOperations());

      const clickSpy = vi.fn();
      (result.current.fileInputRef as any).current = {
        click: clickSpy,
      };

      act(() => {
        result.current.openFile();
      });

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle missing file input ref', () => {
      const { result } = renderHook(() => useFileOperations());

      expect(() => {
        act(() => {
          result.current.openFile();
        });
      }).not.toThrow();
    });
  });

  describe('handleFileSelected', () => {
    it('should create document from selected file', async () => {
      const mockFile = new File(['<root/>'], 'test.xml', { type: 'text/xml' });
      const mockDoc = createMockDocument({ id: 'new-doc-id' });

      (createDocumentFromFile as any).mockResolvedValue(mockDoc);
      mockGetRecentDocuments.mockReturnValue([]);

      const { result } = renderHook(() => useFileOperations());

      let returnedDoc: Document | null = null;

      await act(async () => {
        const event = {
          target: { files: [mockFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        returnedDoc = await result.current.handleFileSelected(event);
      });

      expect(createDocumentFromFile).toHaveBeenCalledWith(mockFile);
      expect(mockAddDocument).toHaveBeenCalledWith(mockDoc);
      expect(mockSetActiveDocument).toHaveBeenCalledWith('new-doc-id');
      expect(mockAddToRecents).toHaveBeenCalledWith('new-doc-id');
      expect(returnedDoc).toEqual(mockDoc);
    });

    it('should return null when no file selected', async () => {
      const { result } = renderHook(() => useFileOperations());

      let returnedDoc: Document | null = null;

      await act(async () => {
        const event = {
          target: { files: null },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        returnedDoc = await result.current.handleFileSelected(event);
      });

      expect(returnedDoc).toBeNull();
      expect(mockAddDocument).not.toHaveBeenCalled();
    });

    it('should handle file reading errors gracefully', async () => {
      const mockFile = new File(['<root/>'], 'test.xml', { type: 'text/xml' });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (createDocumentFromFile as any).mockRejectedValue(
        new Error('Failed to read file')
      );

      const { result } = renderHook(() => useFileOperations());

      let returnedDoc: Document | null = null;

      await act(async () => {
        const event = {
          target: { files: [mockFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        returnedDoc = await result.current.handleFileSelected(event);
      });

      expect(returnedDoc).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to open files:',
        expect.any(Error)
      );
      expect(mockAddDocument).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveFile', () => {
    beforeEach(() => {
      // Mock window.showSaveFilePicker for File System Access API
      const mockShowSaveFilePicker = vi.fn();

      Object.defineProperty(window, 'showSaveFilePicker', {
        writable: true,
        value: mockShowSaveFilePicker,
      });

      // Mock DOM methods for file download
      (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      (globalThis as any).URL.revokeObjectURL = vi.fn();
    });

    it('should call saveFileAs for untitled documents', async () => {
      const mockShowSaveFilePicker = window.showSaveFilePicker as any;
      const mockWrite = vi.fn().mockResolvedValue(undefined);
      const mockClose = vi.fn().mockResolvedValue(undefined);

      mockShowSaveFilePicker.mockResolvedValue({
        createWritable: vi.fn().mockResolvedValue({
          write: mockWrite,
          close: mockClose,
        }),
      });

      const { result } = renderHook(() => useFileOperations());

      let success = false;

      await act(async () => {
        success = await result.current.saveFile(mockUntitledDocument);
      });

      expect(success).toBe(true);
      // When calling saveFile on untitled document, it calls saveFileAs which includes types
      expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: mockUntitledDocument.name,
        types: expect.any(Array),
      });
      expect(mockMarkDocumentSaved).toHaveBeenCalledWith(mockUntitledDocument.id);
    });

    it('should save document with filePath using cached fileHandle', async () => {
      const mockWrite = vi.fn().mockResolvedValue(undefined);
      const mockClose = vi.fn().mockResolvedValue(undefined);
      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: mockWrite,
          close: mockClose,
        }),
      };

      const docWithHandle = createMockDocument({ fileHandle: mockFileHandle });

      const { result } = renderHook(() => useFileOperations());

      let success = false;

      await act(async () => {
        success = await result.current.saveFile(docWithHandle);
      });

      expect(success).toBe(true);
      expect(mockFileHandle.createWritable).toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalledWith(docWithHandle.content);
      expect(mockClose).toHaveBeenCalled();
      expect(mockMarkDocumentSaved).toHaveBeenCalledWith(docWithHandle.id);
    });

    it('should handle save errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorHandle = {
        createWritable: vi.fn().mockRejectedValue(new Error('Save failed')),
      };

      const docWithBrokenHandle = createMockDocument({ fileHandle: errorHandle });

      const { result } = renderHook(() => useFileOperations());

      let success = true;

      await act(async () => {
        success = await result.current.saveFile(docWithBrokenHandle);
      });

      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save file:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveFileAs', () => {
    beforeEach(() => {
      // Mock window.showSaveFilePicker for File System Access API
      const mockShowSaveFilePicker = vi.fn();
      Object.defineProperty(window, 'showSaveFilePicker', {
        writable: true,
        value: mockShowSaveFilePicker,
      });

      // Mock DOM methods for file download
      (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      (globalThis as any).URL.revokeObjectURL = vi.fn();
    });

    it('should save document with new filename using File System Access API', async () => {
      const mockShowSaveFilePicker = window.showSaveFilePicker as any;
      const mockWrite = vi.fn().mockResolvedValue(undefined);
      const mockClose = vi.fn().mockResolvedValue(undefined);

      mockShowSaveFilePicker.mockResolvedValue({
        createWritable: vi.fn().mockResolvedValue({
          write: mockWrite,
          close: mockClose,
        }),
      });

      const { result } = renderHook(() => useFileOperations());

      let success = false;

      await act(async () => {
        success = await result.current.saveFileAs(mockDocument);
      });

      expect(success).toBe(true);
      expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: mockDocument.name,
        types: expect.any(Array),
      });
      expect(mockWrite).toHaveBeenCalledWith(mockDocument.content);
      expect(mockClose).toHaveBeenCalled();
      expect(mockMarkDocumentSaved).toHaveBeenCalledWith(mockDocument.id);
    });

    it('should handle AbortError when user cancels file picker', async () => {
      const mockShowSaveFilePicker = window.showSaveFilePicker as any;
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      mockShowSaveFilePicker.mockRejectedValue(abortError);

      const { result } = renderHook(() => useFileOperations());

      let success = true;

      await act(async () => {
        success = await result.current.saveFileAs(mockDocument);
      });

      expect(success).toBe(false);
      expect(mockMarkDocumentSaved).not.toHaveBeenCalled();
    });

    it('should handle other errors during save as', async () => {
      const mockShowSaveFilePicker = window.showSaveFilePicker as any;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockShowSaveFilePicker.mockRejectedValue(new Error('Unknown error'));

      const { result } = renderHook(() => useFileOperations());

      let success = true;

      await act(async () => {
        success = await result.current.saveFileAs(mockDocument);
      });

      expect(success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save file as:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveAllDocuments', () => {
    it('should save all dirty documents', async () => {
      const mockWrite = vi.fn().mockResolvedValue(undefined);
      const mockClose = vi.fn().mockResolvedValue(undefined);
      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: mockWrite,
          close: mockClose,
        }),
      };

      const dirtyDoc1 = createMockDocument({ id: 'doc1', status: DocumentStatus.DIRTY, fileHandle: mockFileHandle });
      const dirtyDoc2 = createMockDocument({ id: 'doc2', status: DocumentStatus.DIRTY, fileHandle: mockFileHandle });

      mockGetAllDocuments.mockReturnValue([dirtyDoc1, dirtyDoc2]);
      mockHasDirtyDocuments.mockReturnValue(true);

      const { result } = renderHook(() => useFileOperations());

      let success = false;

      await act(async () => {
        success = await result.current.saveAllDocuments();
      });

      expect(success).toBe(true);
      expect(mockWrite).toHaveBeenCalledTimes(2);
    });

    it('should return false if any document fails to save', async () => {
      const goodHandle = {
        createWritable: vi.fn().mockResolvedValue({
          write: vi.fn().mockResolvedValue(undefined),
          close: vi.fn().mockResolvedValue(undefined),
        }),
      };
      const badHandle = {
        createWritable: vi.fn().mockRejectedValue(new Error('Save failed')),
      };

      const dirtyDoc1 = createMockDocument({ id: 'doc1', status: DocumentStatus.DIRTY, fileHandle: goodHandle });
      const dirtyDoc2 = createMockDocument({ id: 'doc2', status: DocumentStatus.DIRTY, fileHandle: badHandle });

      mockGetAllDocuments.mockReturnValue([dirtyDoc1, dirtyDoc2]);
      mockHasDirtyDocuments.mockReturnValue(true);

      vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useFileOperations());

      let success = true;

      await act(async () => {
        success = await result.current.saveAllDocuments();
      });

      expect(success).toBe(false);
    });

    it('should return true when no dirty documents exist', async () => {
      mockGetAllDocuments.mockReturnValue([]);
      mockHasDirtyDocuments.mockReturnValue(false);

      const { result } = renderHook(() => useFileOperations());

      let success = false;

      await act(async () => {
        success = await result.current.saveAllDocuments();
      });

      expect(success).toBe(true);
    });
  });

  describe('recentDocuments', () => {
    it('should return recent documents from store', () => {
      const recentDocs = [mockDocument, mockUntitledDocument];
      mockGetRecentDocuments.mockReturnValue(recentDocs);

      const { result } = renderHook(() => useFileOperations());

      expect(result.current.recentDocuments).toEqual(recentDocs);
      expect(mockGetRecentDocuments).toHaveBeenCalled();
    });

    it('should return empty array when no recent documents', () => {
      mockGetRecentDocuments.mockReturnValue([]);

      const { result } = renderHook(() => useFileOperations());

      expect(result.current.recentDocuments).toEqual([]);
    });
  });

  describe('hasDirtyDocuments', () => {
    it('should reflect dirty documents state from store', () => {
      mockHasDirtyDocuments.mockReturnValue(true);

      const { result } = renderHook(() => useFileOperations());

      expect(result.current.hasDirtyDocuments).toBe(true);
    });

    it('should return false when no dirty documents', () => {
      mockHasDirtyDocuments.mockReturnValue(false);

      const { result } = renderHook(() => useFileOperations());

      expect(result.current.hasDirtyDocuments).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should track loading state during file operations', async () => {
      const mockFile = new File(['<root/>'], 'test.xml', { type: 'text/xml' });

      // Simulate async operation
      (createDocumentFromFile as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockDocument), 100);
          })
      );

      mockGetRecentDocuments.mockReturnValue([]);

      const { result } = renderHook(() => useFileOperations());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        const event = {
          target: { files: [mockFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        await result.current.handleFileSelected(event);
      });

      // After operation completes, loading should be false
      expect(result.current.isLoading).toBe(false);
    });
  });
});
