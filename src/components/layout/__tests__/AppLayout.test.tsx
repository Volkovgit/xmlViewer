import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

  describe('Mobile Responsive Behavior', () => {
    let originalInnerWidth: number;

    beforeEach(() => {
      originalInnerWidth = window.innerWidth;
    });

    afterEach(() => {
      // Reset window width after each test
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    });

    it('shows toggle button on mobile screens (< 768px)', () => {
      // Simulate mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      render(
        <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <div data-testid="content">Content</div>
        </AppLayout>
      );

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toBeVisible();
    });

    it('hides toggle button on desktop screens (>= 768px)', () => {
      // Simulate desktop screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <div data-testid="content">Content</div>
        </AppLayout>
      );

      const toggleButton = screen.queryByLabelText('Toggle sidebar');
      expect(toggleButton).not.toBeInTheDocument();
    });

    it('opens sidebar when toggle button is clicked on mobile', () => {
      // Simulate mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      let contextValue: ReturnType<typeof useAppLayout> | undefined;

      const TestComponent = () => {
        contextValue = useAppLayout();
        return <div data-testid="content">Content</div>;
      };

      render(
        <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <TestComponent />
        </AppLayout>
      );

      // Initially collapsed on mobile
      expect(contextValue?.isSidebarCollapsed).toBe(true);

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      // Click toggle button
      act(() => {
        toggleButton.click();
      });

      // Sidebar should be open
      expect(contextValue?.isSidebarCollapsed).toBe(false);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes sidebar when toggle button is clicked again', () => {
      // Simulate mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      let contextValue: ReturnType<typeof useAppLayout> | undefined;

      const TestComponent = () => {
        contextValue = useAppLayout();
        return <div data-testid="content">Content</div>;
      };

      render(
        <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <TestComponent />
        </AppLayout>
      );

      const toggleButton = screen.getByLabelText('Toggle sidebar');

      // Open sidebar
      act(() => {
        toggleButton.click();
      });
      expect(contextValue?.isSidebarCollapsed).toBe(false);

      // Close sidebar
      act(() => {
        toggleButton.click();
      });
      expect(contextValue?.isSidebarCollapsed).toBe(true);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows overlay when sidebar is open on mobile', () => {
      // Simulate mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      let contextValue: ReturnType<typeof useAppLayout> | undefined;

      const TestComponent = () => {
        contextValue = useAppLayout();
        return <div data-testid="content">Content</div>;
      };

      const { container } = render(
        <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <TestComponent />
        </AppLayout>
      );

      // Initially no overlay (sidebar collapsed)
      let overlay = container.querySelector('.sidebar-overlay');
      expect(overlay).not.toBeInTheDocument();

      // Open sidebar
      act(() => {
        contextValue?.toggleSidebar();
      });

      // Overlay should appear
      overlay = container.querySelector('.sidebar-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('show');
    });

    it('closes sidebar when overlay is clicked', () => {
      // Simulate mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      let contextValue: ReturnType<typeof useAppLayout> | undefined;

      const TestComponent = () => {
        contextValue = useAppLayout();
        return <div data-testid="content">Content</div>;
      };

      const { container } = render(
        <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <TestComponent />
        </AppLayout>
      );

      // Open sidebar
      act(() => {
        contextValue?.toggleSidebar();
      });
      expect(contextValue?.isSidebarCollapsed).toBe(false);

      // Click overlay
      const overlay = container.querySelector('.sidebar-overlay');
      act(() => {
        overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // Sidebar should close
      expect(contextValue?.isSidebarCollapsed).toBe(true);
    });

    it('auto-collapses sidebar when resizing to mobile', () => {
      // Start with desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      let contextValue: ReturnType<typeof useAppLayout> | undefined;

      const TestComponent = () => {
        contextValue = useAppLayout();
        return <div data-testid="content">Content</div>;
      };

      render(
        <AppLayout sidebar={<div data-testid="sidebar">Sidebar</div>}>
          <TestComponent />
        </AppLayout>
      );

      // Initially expanded on desktop
      expect(contextValue?.isSidebarCollapsed).toBe(false);

      // Resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 767,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Should auto-collapse on mobile
      expect(contextValue?.isSidebarCollapsed).toBe(true);
    });
  });
});
