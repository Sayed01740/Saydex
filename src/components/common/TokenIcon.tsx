import React, { useState } from 'react';

interface TokenIconProps {
  symbol: string;
  icon?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ symbol, icon, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };

  // Color generator for fallback initials
  const getSymbolBg = (sym: string) => {
    const palette = [
      'bg-emerald-950/70 text-emerald-400 border-emerald-800/40',
      'bg-cyan-950/70 text-cyan-400 border-cyan-800/40',
      'bg-blue-950/70 text-blue-400 border-blue-800/40',
      'bg-indigo-950/70 text-indigo-400 border-indigo-800/40',
      'bg-amber-950/70 text-amber-400 border-amber-800/40',
      'bg-purple-950/70 text-purple-400 border-purple-800/40',
    ];
    let hash = 0;
    for (let i = 0; i < sym.length; i++) {
      hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-[var(--border-app)] ${sizeClasses[size]} ${className}`}
    >
      {icon && !imgError ? (
        <img
          src={icon}
          alt={symbol}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-bold font-mono tracking-tighter ${getSymbolBg(
            symbol
          )}`}
        >
          {symbol.slice(0, 3).toUpperCase()}
        </div>
      )}
    </div>
  );
};
