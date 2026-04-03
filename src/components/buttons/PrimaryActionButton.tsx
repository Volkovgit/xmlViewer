import React from 'react';
import * as Icons from 'lucide-react';
import './PrimaryActionButton.css';

interface PrimaryActionButtonProps {
  children: string;
  icon: string; // Lucide icon name like "Circle", "FileText", etc.
  onClick: () => void;
  disabled?: boolean;
}

export const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  children,
  icon,
  onClick,
  disabled = false,
}) => {
  // Dynamically get the icon component from lucide-react
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon];

  return (
    <button
      className="primary-action-button"
      onClick={onClick}
      disabled={disabled}
    >
      {IconComponent && <IconComponent size={20} />}
      <span>{children}</span>
    </button>
  );
};
