import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppLayout, useAppLayout } from '../AppLayout';

describe('useAppLayout hook', () => {
  it('provides isSidebarCollapsed state', () => {
    const TestComponent = () => {
      const { isSidebarCollapsed } = useAppLayout();
      return <div>Collapsed: {isSidebarCollapsed.toString()}</div>;
    };

    render(
      <AppLayout>
        <TestComponent />
      </AppLayout>
    );

    expect(screen.getByText('Collapsed: false')).toBeInTheDocument();
  });

  it('provides toggleSidebar function', () => {
    const TestComponent = () => {
      const { toggleSidebar } = useAppLayout();
      return (
        <button onClick={toggleSidebar} data-testid="toggle-btn">
          Toggle
        </button>
      );
    };

    render(
      <AppLayout>
        <TestComponent />
      </AppLayout>
    );

    const button = screen.getByTestId('toggle-btn');
    expect(button).toBeInTheDocument();
    expect(typeof button.onclick).toBe('function');
  });

  it('toggles isSidebarCollapsed when toggleSidebar is called', () => {
    const TestComponent = () => {
      const { isSidebarCollapsed, toggleSidebar } = useAppLayout();
      return (
        <div>
          <div data-testid="collapsed-state">
            {isSidebarCollapsed.toString()}
          </div>
          <button onClick={toggleSidebar}>Toggle</button>
        </div>
      );
    };

    render(
      <AppLayout>
        <TestComponent />
      </AppLayout>
    );

    // Initial state should be false
    expect(screen.getByTestId('collapsed-state')).toHaveTextContent('false');

    // Click toggle button
    const toggleButton = screen.getByText('Toggle');
    fireEvent.click(toggleButton);

    // State should be true
    expect(screen.getByTestId('collapsed-state')).toHaveTextContent('true');
  });

  it('throws error when used outside AppLayout provider', () => {
    const TestComponent = () => {
      const { isSidebarCollapsed } = useAppLayout();
      return <div>{isSidebarCollapsed.toString()}</div>;
    };

    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = vi.fn();

    // Expect the error to be thrown
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAppLayout must be used within an AppLayout');

    console.error = consoleError;
  });
});
