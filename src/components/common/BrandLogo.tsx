import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-bold tracking-tight',
    lg: 'text-xl font-bold tracking-tight',
    xl: 'text-2xl font-bold tracking-tight',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Geometric Original Protocol Emblem */}
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer hexagonal matrix frame */}
          <polygon
            points="20,2 35.5,11 35.5,29 20,38 4.5,29 4.5,11"
            className="stroke-[var(--border-app)] fill-[var(--bg-surface-elevated)]"
            strokeWidth="1.5"
          />
          {/* Precision Intersecting Flow Path */}
          <path
            d="M12 28L20 12L28 28M15 22H25"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Quantum Liquidity Node Accent */}
          <circle cx="20" cy="12" r="2.5" className="fill-[var(--primary)]" />
          <circle cx="12" cy="28" r="2" className="fill-[var(--text-primary)]" />
          <circle cx="28" cy="28" r="2" className="fill-[var(--text-primary)]" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`flex items-center gap-1.5 ${textSizes[size]} text-[var(--text-primary)]`}>
            <span>AXIOM</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--primary-subtle)] text-[var(--primary)] font-medium border border-[var(--primary)]/20">
              v3
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
