import React from 'react';
import { Badge } from '../common/Badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface RangeVisualizerProps {
  currentPrice: number;
  priceMin: number;
  priceMax: number;
  token0Symbol: string;
  token1Symbol: string;
  onMinChange?: (newMin: number) => void;
  onMaxChange?: (newMax: number) => void;
  distribution?: { price: number; depth: number }[];
}

export const RangeVisualizer: React.FC<RangeVisualizerProps> = ({
  currentPrice,
  priceMin,
  priceMax,
  token0Symbol,
  token1Symbol,
  onMinChange,
  onMaxChange,
  distribution = [
    { price: 2900, depth: 15 },
    { price: 3050, depth: 32 },
    { price: 3200, depth: 65 },
    { price: 3350, depth: 92 },
    { price: 3482, depth: 100 },
    { price: 3600, depth: 88 },
    { price: 3750, depth: 54 },
    { price: 3900, depth: 38 },
    { price: 4100, depth: 18 },
  ],
}) => {
  const inRange = currentPrice >= priceMin && currentPrice <= priceMax;
  const isBelowRange = currentPrice < priceMin;
  const isAboveRange = currentPrice > priceMax;

  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl p-4 space-y-3.5">
      {/* Range Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Concentrated Price Range
          </span>
          {inRange ? (
            <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
              In Range (Earning Fees)
            </Badge>
          ) : (
            <Badge variant="warning" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>
              {isBelowRange ? 'Below Range (Inactive)' : 'Above Range (Inactive)'}
            </Badge>
          )}
        </div>

        <div className="text-xs font-mono text-[var(--text-tertiary)]">
          Current: <span className="text-[var(--text-primary)] font-bold">{currentPrice.toLocaleString()}</span> {token1Symbol}/{token0Symbol}
        </div>
      </div>

      {/* Visual Liquidity Depth Distribution Histogram (Section 33) */}
      <div className="h-24 w-full flex items-end justify-between gap-1.5 px-2 py-1 bg-[var(--bg-surface-elevated)] rounded-lg relative overflow-hidden border border-[var(--border-app)]">
        {distribution.map((item, idx) => {
          const itemInRange = item.price >= priceMin && item.price <= priceMax;
          const isCurrent = Math.abs(item.price - currentPrice) < currentPrice * 0.05;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full relative group"
            >
              <div
                style={{ height: `${item.depth}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  itemInRange
                    ? isCurrent
                      ? 'bg-[var(--primary)]'
                      : 'bg-[var(--primary)]/60 group-hover:bg-[var(--primary)]/90'
                    : 'bg-[var(--border-strong)]/60 group-hover:bg-[var(--text-tertiary)]/50'
                }`}
              />
              {isCurrent && (
                <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />
              )}
            </div>
          );
        })}

        {/* Current price indicator vertical line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--primary)] pointer-events-none"
          style={{
            left: `${Math.max(10, Math.min(90, ((currentPrice - (currentPrice * 0.8)) / (currentPrice * 0.4)) * 100))}%`,
          }}
        >
          <span className="absolute -top-1 -translate-x-1/2 bg-[var(--primary)] text-[#090B0E] text-[9px] font-mono font-bold px-1 rounded">
            NOW
          </span>
        </div>
      </div>

      {/* Min & Max Price Bounds Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)]">
          <div className="text-[11px] text-[var(--text-tertiary)]">Min Price</div>
          <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">
            {priceMin.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
            {token1Symbol} per {token0Symbol}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)]">
          <div className="text-[11px] text-[var(--text-tertiary)]">Max Price</div>
          <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">
            {priceMax.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
            {token1Symbol} per {token0Symbol}
          </div>
        </div>
      </div>
    </div>
  );
};
