import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showText = false, className = '' }) => {
  const logoHeights = {
    sm: 'h-8',
    md: 'h-[42px] sm:h-[46px]',
    lg: 'h-[52px]',
    xl: 'h-16',
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none group ${className}`}>
      <img
        src="/SAYDEX_logo.svg"
        alt="SAYDEX"
        className={`${logoHeights[size]} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]`}
      />
      {showText && (
        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold border border-[var(--primary)]/25 shrink-0 tracking-wider">
          v3
        </span>
      )}
    </div>
  );
};
