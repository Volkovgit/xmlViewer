import React, { ReactNode } from 'react';
import { useAppLayout } from './AppLayout';
import './LeftSidebar.css';

interface LeftSidebarProps {
  actionsPanel?: ReactNode;
  filesPanel?: ReactNode;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  actionsPanel,
  filesPanel,
}) => {
  const { isSidebarCollapsed } = useAppLayout();

  return (
    <div className={`left-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {actionsPanel && (
        <section className="sidebar-section">
          <h2 className="section-header">Actions</h2>
          {actionsPanel}
        </section>
      )}
      {filesPanel && (
        <section className="sidebar-section">
          <h2 className="section-header">Files</h2>
          {filesPanel}
        </section>
      )}
    </div>
  );
};
