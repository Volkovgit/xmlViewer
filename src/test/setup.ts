import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for ReactFlow
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Extend global interface with ResizeObserver
declare global {
  interface Window {
    ResizeObserver: any;
  }
}

if (typeof window !== 'undefined') {
  window.ResizeObserver = ResizeObserverMock;
}

// Mock document.queryCommandSupported for Monaco Editor
if (typeof document !== 'undefined') {
  document.queryCommandSupported = vi.fn(() => false);
  document.queryCommandEnabled = vi.fn(() => false);
  document.execCommand = vi.fn(() => false);
}

// Mock window.matchMedia for Monaco Editor
if (typeof window !== 'undefined') {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock navigator.clipboard for Monaco Editor
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'navigator', {
    value: {
      ...window.navigator,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
        readText: vi.fn(() => Promise.resolve('')),
        write: vi.fn(() => Promise.resolve()),
        read: vi.fn(() => Promise.resolve([])),
      },
    },
    writable: true,
  });
}

export {};
