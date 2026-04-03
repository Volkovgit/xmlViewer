import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import * as Icons from 'lucide-react';
import './PrimaryActionButton.css';

interface PrimaryActionButtonProps {
  children: string;
  icon: string; // Lucide icon name like "Circle", "FileText", etc.
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export const PrimaryActionButton: React.FC<PrimaryActionButtonProps> = ({
  children,
  icon,
  onClick,
  disabled = false,
  tooltip,
}) => {
  // Dynamically get the icon component from lucide-react
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon];

  const buttonContent = (
    <button
      className="primary-action-button"
      onClick={onClick}
      disabled={disabled}
    >
      {IconComponent && <IconComponent size={20} />}
      <span>{children}</span>
    </button>
  );

  // Conditionally wrap with tooltip
  if (tooltip) {
    return <Tippy content={tooltip} placement="top">{buttonContent}</Tippy>;
  }

  return buttonContent;
};
