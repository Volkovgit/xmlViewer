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

export {};
