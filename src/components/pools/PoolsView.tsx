import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { LiquidityPool } from '../../types';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import { AddLiquidityModal } from './AddLiquidityModal';
import { Plus, Search, Filter, ArrowUpRight, TrendingUp, Droplets } from 'lucide-react';

export const PoolsView: React.FC = () => {
  const { pools, setActiveView } = useProtocol();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoolForDeposit, setSelectedPoolForDeposit] = useState<LiquidityPool | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const filteredPools = pools.filter((p) =>
    `${p.token0.symbol}/${p.token1.symbol}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDeposit = (pool: LiquidityPool) => {
    setSelectedPoolForDeposit(pool);
    setIsDepositModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Concentrated Liquidity Pools
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Deposit dual-token assets into concentrated price ticks to earn continuous protocol swap fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveView('positions')}
          >
            My Positions
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setSelectedPoolForDeposit(pools[0]);
              setIsDepositModalOpen(true);
            }}
          >
            Create / Add Position
          </Button>
        </div>
      </div>

      {/* Global Pool Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">Total Pools TVL</span>
          <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
            $3,805,000,000
          </div>
          <span className="text-[11px] text-[var(--success)] font-mono">+3.2% this week</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">24h Distributed Fees</span>
          <div className="text-xl font-bold font-mono text-[var(--primary)] mt-1">
            $1,259,250
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">100% to Liquidity Providers</span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">Highest Pool APR</span>
          <div className="text-xl font-bold font-mono text-[var(--success)] mt-1">
            42.6% APR
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">AXIOM / ETH (0.30%)</span>
        </div>
      </div>

      {/* Pools Table Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl overflow-hidden shadow-xs">
        {/* Filter bar */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search pools (e.g. ETH/USDC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>

          <div className="text-xs text-[var(--text-tertiary)] font-mono">
            {filteredPools.length} Active Pools
          </div>
        </div>

        {/* Table Desktop / Card Mobile (Section 37) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Pool Pair</th>
                <th className="py-3 px-4">Fee Tier</th>
                <th className="py-3 px-4 text-right">TVL</th>
                <th className="py-3 px-4 text-right">24h Volume</th>
                <th className="py-3 px-4 text-right">24h Fees</th>
                <th className="py-3 px-4 text-right">Estimated APR</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredPools.map((pool) => (
                <tr
                  key={pool.id}
                  className="hover:bg-[var(--bg-surface-hover)] transition-colors group"
                >
                  {/* Pair */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex -space-x-1.5">
                        <TokenIcon symbol={pool.token0.symbol} icon={pool.token0.icon} size="sm" />
                        <TokenIcon symbol={pool.token1.symbol} icon={pool.token1.icon} size="sm" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[var(--text-primary)]">
                          {pool.token0.symbol} / {pool.token1.symbol}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                          1 {pool.token0.symbol} = {pool.currentPrice.toLocaleString()} {pool.token1.symbol}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Fee Tier */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-app)] text-[var(--text-secondary)]">
                      {pool.feePercent}%
                    </span>
                  </td>

                  {/* TVL */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                    ${(pool.tvlUSD / 1000000).toFixed(1)}M
                  </td>

                  {/* 24h Volume */}
                  <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                    ${(pool.volume24hUSD / 1000000).toFixed(1)}M
                  </td>

                  {/* 24h Fees */}
                  <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                    ${pool.fees24hUSD.toLocaleString()}
                  </td>

                  {/* APR */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--success)]">
                    {pool.apr}%
                  </td>

                  {/* CTA */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenDeposit(pool)}
                      className="px-3 py-1 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[#090B0E] font-semibold text-xs transition-all cursor-pointer border border-[var(--primary)]/30"
                    >
                      Deposit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Liquidity Modal */}
      {selectedPoolForDeposit && (
        <AddLiquidityModal
          isOpen={isDepositModalOpen}
          onClose={() => {
            setIsDepositModalOpen(false);
            setSelectedPoolForDeposit(null);
          }}
          pool={selectedPoolForDeposit}
        />
      )}
    </div>
  );
};
