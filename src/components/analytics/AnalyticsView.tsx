import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { TokenIcon } from '../common/TokenIcon';
import { TrendingUp, BarChart3, Droplets, Coins, Zap } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { pools, tokens } = useProtocol();
  const [metricTab, setMetricTab] = useState<'tvl' | 'volume'>('tvl');

  const historicalData = [
    { date: 'Aug 01', tvlB: 10.2, volumeB: 2.1 },
    { date: 'Aug 06', tvlB: 10.8, volumeB: 2.4 },
    { date: 'Aug 11', tvlB: 11.2, volumeB: 2.8 },
    { date: 'Aug 16', tvlB: 11.7, volumeB: 2.6 },
    { date: 'Aug 21', tvlB: 11.9, volumeB: 3.0 },
    { date: 'Aug 26', tvlB: 12.2, volumeB: 3.4 },
    { date: 'Aug 31', tvlB: 12.48, volumeB: 3.18 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Protocol Analytics Terminal
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Macro on-chain liquidity depth, cumulative settlement volume, and solver routing efficiency.
        </p>
      </div>

      {/* Top 4 Metrics (Section 39) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">Total Value Locked (TVL)</span>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
            $12.48B
          </div>
          <span className="text-[11px] text-[var(--success)] font-mono">+4.82% 24h</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">24h Settlement Volume</span>
          <div className="text-2xl font-bold font-mono text-[var(--primary)] mt-1">
            $3.18B
          </div>
          <span className="text-[11px] text-[var(--success)] font-mono">+12.4% vs 7d avg</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">24h Protocol LP Fees</span>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
            $4.25M
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">100% to Providers</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">Cumulative Volume</span>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
            $142.85B
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono">Since Genesis v1</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {metricTab === 'tvl' ? 'Protocol TVL Growth' : '24h Volume Run-Rate'}
            </h3>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">
              30-Day Historical Trend (USD)
            </span>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs font-medium">
            <button
              onClick={() => setMetricTab('tvl')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                metricTab === 'tvl'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] font-semibold shadow-xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              TVL
            </button>
            <button
              onClick={() => setMetricTab('volume')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                metricTab === 'volume'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] font-semibold shadow-xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Volume
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            {metricTab === 'tvl' ? (
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-disabled)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  orientation="right"
                  stroke="var(--text-disabled)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}B`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] p-2.5 rounded-lg text-xs font-mono shadow-xl">
                          <div className="text-[var(--text-tertiary)]">{data.date}</div>
                          <div className="font-bold text-[var(--primary)] mt-0.5">${data.tvlB} Billion TVL</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="tvlB" stroke="var(--primary)" strokeWidth={2} fill="url(#tvlGradient)" />
              </AreaChart>
            ) : (
              <BarChart data={historicalData}>
                <XAxis dataKey="date" stroke="var(--text-disabled)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  orientation="right"
                  stroke="var(--text-disabled)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}B`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] p-2.5 rounded-lg text-xs font-mono shadow-xl">
                          <div className="text-[var(--text-tertiary)]">{data.date}</div>
                          <div className="font-bold text-[var(--primary)] mt-0.5">${data.volumeB} Billion 24h Vol</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="volumeB" fill="var(--primary)" opacity={0.75} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Protocol Pools by 24h Volume */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Top Volume Concentrated Pools
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-sans font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Pool</th>
                <th className="py-2.5 px-4 text-right">TVL</th>
                <th className="py-2.5 px-4 text-right">24h Volume</th>
                <th className="py-2.5 px-4 text-right">24h Fees</th>
                <th className="py-2.5 px-4 text-right">Annual APR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {pools.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        <TokenIcon symbol={p.token0.symbol} icon={p.token0.icon} size="xs" />
                        <TokenIcon symbol={p.token1.symbol} icon={p.token1.icon} size="xs" />
                      </div>
                      <span>{p.token0.symbol}/{p.token1.symbol}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">({p.feePercent}%)</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-[var(--text-primary)]">
                    ${(p.tvlUSD / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                    ${(p.volume24hUSD / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                    ${p.fees24hUSD.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[var(--success)]">
                    {p.apr}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
