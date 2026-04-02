import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
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
  // Initialize collapsed state based on window width (mobile-first)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(
    () => window.innerWidth < 768
  );

  // Handle window resize to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsSidebarCollapsed(isMobile);
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
        <main className="app-layout-content">{children}</main>
      </div>
    </AppLayoutContext.Provider>
  );
};
