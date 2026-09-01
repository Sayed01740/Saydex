import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
  };

  const variantClasses = {
    primary: 'bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20',
    success: 'bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/20',
    warning: 'bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20',
    error: 'bg-[var(--error-subtle)] text-[var(--error)] border border-[var(--error)]/20',
    neutral: 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-app)]',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-app)]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md whitespace-nowrap select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
