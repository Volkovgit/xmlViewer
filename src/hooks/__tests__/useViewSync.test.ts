/**
 * Unit tests for useViewSync hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewSync } from '../useViewSync';
import { viewCoordinator } from '@/core/viewManager/ViewCoordinator';
import { useDocumentStore } from '@/stores/documentStore';
import { ViewType, ChangeType } from '@/core/viewManager/ViewUpdate';
import { Document, DocumentType, DocumentStatus } from '@/types';

// Mock ViewCoordinator
vi.mock('@/core/viewManager/ViewCoordinator', () => ({
  viewCoordinator: {
    registerViewListener: vi.fn(() => vi.fn()),
    broadcastUpdate: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock document store
vi.mock('@/stores/documentStore', () => ({
  useDocumentStore: vi.fn(),
}));

describe('useViewSync', () => {
  const mockDocument: Document = {
    id: 'doc-1',
    name: 'test.xml',
    type: DocumentType.XML,
    content: '<root>test</root>',
    status: DocumentStatus.READY,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockRecordViewUpdate = vi.fn();
  const mockShouldProcessViewUpdate = vi.fn(() => true);

  beforeEach(() => {
    vi.clearAllMocks();
    (useDocumentStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      recordViewUpdate: mockRecordViewUpdate,
      shouldProcessViewUpdate: mockShouldProcessViewUpdate,
    });
  });

  afterEach(() => {
    viewCoordinator.clear();
  });

  it('should initialize with current document and view', () => {
    const { result } = renderHook(() =>
      useViewSync(mockDocument, ViewType.TEXT)
    );

    expect(result.current.document).toEqual(mockDocument);
    expect(result.current.currentView).toBe(ViewType.TEXT);
    expect(result.current.subscribe).toBeInstanceOf(Function);
    expect(result.current.notifyViewChanged).toBeInstanceOf(Function);
  });

  it('should emit updates when notifyViewChanged is called with new content', async () => {
    const newContent = '<root>updated</root>';
    const { result } = renderHook(() =>
      useViewSync(mockDocument, ViewType.TEXT)
    );

    await act(async () => {
      result.current.notifyViewChanged(newContent, ChangeType.CONTENT);
    });

    expect(viewCoordinator.broadcastUpdate).toHaveBeenCalled();
    expect(mockRecordViewUpdate).toHaveBeenCalledWith(mockDocument.id, ViewType.TEXT);
  });

  it('should skip notifications when content is the same', () => {
    const { result } = renderHook(() =>
      useViewSync(mockDocument, ViewType.TEXT)
    );

    act(() => {
      result.current.notifyViewChanged(mockDocument.content, ChangeType.CONTENT);
    });

    expect(viewCoordinator.broadcastUpdate).not.toHaveBeenCalled();
    expect(mockRecordViewUpdate).not.toHaveBeenCalled();
  });

  it('should return unsubscribe function from subscribe', () => {
    const { result } = renderHook(() =>
      useViewSync(mockDocument, ViewType.TEXT)
    );

    const unsubscribe = result.current.subscribe(() => {});

    expect(unsubscribe).toBeInstanceOf(Function);

    // Calling unsubscribe should not throw
    expect(() => unsubscribe()).not.toThrow();
  });

  it('should handle multiple view types correctly', () => {
    const treeResult = renderHook(() =>
      useViewSync(mockDocument, ViewType.TREE)
    );

    expect(treeResult.result.current.currentView).toBe(ViewType.TREE);

    const gridResult = renderHook(() =>
      useViewSync(mockDocument, ViewType.GRID)
    );

    expect(gridResult.result.current.currentView).toBe(ViewType.GRID);
  });
});
