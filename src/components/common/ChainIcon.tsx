import React, { useState } from 'react';
import { Chain } from '../../types';

interface ChainIconProps {
  chain?: Partial<Chain> | null;
  icon?: string;
  name?: string;
  shortName?: string;
  chainId?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ChainIcon: React.FC<ChainIconProps> = ({
  chain,
  icon,
  name,
  shortName,
  chainId,
  size = 'sm',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const finalIcon = icon || chain?.icon;
  const finalName = name || chain?.name || 'Chain';
  const finalShort = shortName || chain?.shortName || finalName.slice(0, 2);
  const finalId = chainId || chain?.id || 1;

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
    xl: 'w-10 h-10 text-base',
  };

  // Color generator for fallback initials
  const getChainBg = (id: number) => {
    const palette = [
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'bg-rose-500/20 text-rose-400 border-rose-500/30',
      'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    ];
    return palette[Math.abs(id) % palette.length];
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-[var(--border-app)] ${sizeClasses[size]} ${className}`}
      title={finalName}
    >
      {finalIcon && !imgError ? (
        <img
          src={finalIcon}
          alt={finalName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-bold font-mono tracking-tighter ${getChainBg(
            finalId
          )}`}
        >
          {finalShort.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};
