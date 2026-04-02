import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppLayout, useAppLayout } from '../AppLayout';

describe('AppLayout', () => {
  it('renders children in content area', () => {
    render(
      <AppLayout>
        <div data-testid="content">Main Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toHaveTextContent('Main Content');
  });

  it('renders sidebar when provided', () => {
    render(
      <AppLayout sidebar={<div data-testid="sidebar">Sidebar Content</div>}>
        <div data-testid="content">Main Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toHaveTextContent('Sidebar Content');
  });

  it('provides context with isSidebarCollapsed and toggleSidebar', () => {
    let contextValue: ReturnType<typeof useAppLayout> | undefined;

    const TestComponent = () => {
      contextValue = useAppLayout();
      return <div>Test</div>;
    };

    render(
      <AppLayout>
        <TestComponent />
      </AppLayout>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(contextValue).toBeDefined();
    expect(contextValue?.isSidebarCollapsed).toBeDefined();
    expect(typeof contextValue?.toggleSidebar).toBe('function');
  });

  it('toggles sidebar when toggleSidebar is called', () => {
    let contextValue: ReturnType<typeof useAppLayout> | undefined;

    const TestComponent = () => {
      contextValue = useAppLayout();
      return (
        <>
          <div data-testid="content">Content</div>
          <button onClick={() => contextValue?.toggleSidebar()}>
            Toggle
          </button>
        </>
      );
    };

    render(
      <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
        <TestComponent />
      </AppLayout>
    );

    // Initial state - sidebar should be expanded (not collapsed)
    // Note: In tests, window.innerWidth defaults to 1024px, so sidebar is not collapsed
    expect(contextValue?.isSidebarCollapsed).toBe(false);

    // Toggle the sidebar
    act(() => {
      contextValue?.toggleSidebar();
    });

    // After toggling, sidebar should be collapsed
    expect(contextValue?.isSidebarCollapsed).toBe(true);
  });

  it('applies collapsed class when isSidebarCollapsed is true', () => {
    let contextValue: ReturnType<typeof useAppLayout> | undefined;

    const TestComponent = () => {
      contextValue = useAppLayout();
      return (
        <button onClick={() => contextValue?.toggleSidebar()}>Toggle</button>
      );
    };

    const { container } = render(
      <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
        <TestComponent />
      </AppLayout>
    );

    const sidebar = container.querySelector('.app-layout-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Initially, sidebar should not have collapsed class
    expect(sidebar).not.toHaveClass('collapsed');

    // Toggle the sidebar
    act(() => {
      contextValue?.toggleSidebar();
    });

    // After toggling, sidebar should have collapsed class
    expect(sidebar).toHaveClass('collapsed');
  });

  it('renders without sidebar when sidebar prop is omitted', () => {
    const { container } = render(
      <AppLayout>
        <div data-testid="content">Main Content</div>
      </AppLayout>
    );

    const sidebar = container.querySelector('.app-layout-sidebar');
    expect(sidebar).not.toBeInTheDocument();

    const layout = container.querySelector('.app-layout');
    expect(layout).toBeInTheDocument();
  });
});
