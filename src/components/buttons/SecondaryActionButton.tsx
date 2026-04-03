import React from 'react';
import * as Icons from 'lucide-react';
import './SecondaryActionButton.css';

interface SecondaryActionButtonProps {
  children: string;
  icon: string; // Lucide icon name like "FileText", "Circle", etc.
  onClick: () => void;
  disabled?: boolean;
}

export const SecondaryActionButton: React.FC<SecondaryActionButtonProps> = ({
  children,
  icon,
  onClick,
  disabled = false,
}) => {
  // Dynamically get the icon component from lucide-react
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon];

  return (
    <button
      className="secondary-action-button"
      onClick={onClick}
      disabled={disabled}
    >
      {IconComponent && <IconComponent size={18} />}
      <span>{children}</span>
    </button>
  );
};
