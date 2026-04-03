import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import { Menu } from 'lucide-react';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

interface AppLayoutContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const AppLayoutContext = createContext<AppLayoutContextType | undefined>(
  undefined
);

export const useAppLayout = (): AppLayoutContextType => {
  const context = useContext(AppLayoutContext);
  if (context === undefined) {
    throw new Error('useAppLayout must be used within an AppLayout');
  }
  return context;
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children, sidebar }) => {
  // Detect mobile screen size
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768);

  // Initialize collapsed state based on window width (mobile-first)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => window.innerWidth < 768
  );

  // Handle window resize to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true); // Auto-collapse on mobile
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const contextValue: AppLayoutContextType = {
    isSidebarCollapsed,
    toggleSidebar,
  };

  return (
    <AppLayoutContext.Provider value={contextValue}>
      <div className="app-layout">
        {sidebar && (
          <aside
            className={`app-layout-sidebar ${
              isSidebarCollapsed ? 'collapsed' : ''
            }`}
          >
            {sidebar}
          </aside>
        )}

        {/* Mobile sidebar toggle button */}
        {isMobile && (
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            aria-expanded={!isSidebarCollapsed}
          >
            <Menu size={24} />
          </button>
        )}

        {/* Mobile overlay */}
        {isMobile && !isSidebarCollapsed && (
          <div
            className="sidebar-overlay show"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        <main className="app-layout-content">{children}</main>
      </div>
    </AppLayoutContext.Provider>
  );
};
