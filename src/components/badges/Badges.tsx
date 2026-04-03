import React from 'react';
import './Badges.css';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DirtyBadgeProps {}

interface ErrorBadgeProps {
  count: number;
}

export const DirtyBadge: React.FC<DirtyBadgeProps> = () => {
  return <div className="dirty-badge" />;
};

export const ErrorBadge: React.FC<ErrorBadgeProps> = ({ count }) => {
  return <div className="error-badge">{count}</div>;
};
