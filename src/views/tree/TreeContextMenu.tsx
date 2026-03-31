import React, { useEffect, useRef } from 'react';
import { XMLNode } from '@/services/xml/TreeBuilder';

export interface TreeContextMenuProps {
  node: XMLNode;
  position: { x: number; y: number };
  visible?: boolean;
  onClose: () => void;
  onAddChild: (node: XMLNode) => void;
  onEdit: (node: XMLNode) => void;
  onDelete: (node: XMLNode) => void;
  onDuplicate: (node: XMLNode) => void;
}

export const TreeContextMenu: React.FC<TreeContextMenuProps> = ({
  node,
  position,
  visible = true,
  onClose,
  onAddChild,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="tree-context-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
      role="menu"
      aria-label="Node actions"
    >
      <button
        className="context-menu-item"
        onClick={() => handleAction(() => onAddChild(node))}
        role="menuitem"
      >
        ➕ Add Child
      </button>
      <button
        className="context-menu-item"
        onClick={() => handleAction(() => onEdit(node))}
        role="menuitem"
      >
        ✏️ Edit
      </button>
      <button
        className="context-menu-item"
        onClick={() => handleAction(() => onDuplicate(node))}
        role="menuitem"
      >
        📋 Duplicate
      </button>
      <div className="context-menu-separator" />
      <button
        className="context-menu-item context-menu-item-danger"
        onClick={() => handleAction(() => onDelete(node))}
        role="menuitem"
      >
        🗑️ Delete
      </button>
    </div>
  );
};
