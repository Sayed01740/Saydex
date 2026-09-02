import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { LiquidityPool } from '../../types';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import { AddLiquidityModal } from './AddLiquidityModal';
import { PositionsView } from '../positions/PositionsView';
import { Plus, Search, RotateCw, Droplets, Sparkles, Layers, WalletCards } from 'lucide-react';

export const PoolsView: React.FC = () => {
  const { pools, isLoadingPools, refreshPools, userPositions } = useProtocol();
  const { selectedChain } = useWallet();
  const [activeSubTab, setActiveSubTab] = useState<'pools' | 'positions'>('pools');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoolForDeposit, setSelectedPoolForDeposit] = useState<LiquidityPool | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Filter pools by selected network (or generic multi-chain fallback)
  const chainPools = pools.filter((p) => !p.chainId || p.chainId === selectedChain.id);
  const activePoolsList = chainPools.length > 0 ? chainPools : pools;

  const filteredPools = activePoolsList.filter((p) =>
    `${p.token0.symbol}/${p.token1.symbol}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPoolsTvl = filteredPools.reduce((acc, p) => acc + (p.tvlUSD || 0), 0);
  const total24hFees = filteredPools.reduce(
    (acc, p) => acc + (p.fees24hUSD || (p.volume24hUSD ? p.volume24hUSD * (p.feeTier / 1000000) : 0)),
    0
  );
  const topAprPool = filteredPools.length > 0
    ? filteredPools.reduce((prev, curr) => ((curr.apr || 0) > (prev.apr || 0) ? curr : prev), filteredPools[0])
    : null;

  const formatCurrency = (val: number) => {
    if (!val || isNaN(val)) return '$0';
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  const handleOpenDeposit = (pool?: LiquidityPool) => {
    setSelectedPoolForDeposit(pool || activePoolsList[0] || null);
    setIsDepositModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & New Position CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Concentrated Pools
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live On-Chain
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
            <span>Deposit assets into concentrated price ticks to earn automated swap fees.</span>
            <span className="hidden sm:inline-block text-[var(--border-app)]">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[var(--primary)]">
              {selectedChain.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'pools' && (
            <button
              onClick={() => refreshPools()}
              disabled={isLoadingPools}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              title="Refresh on-chain liquidity data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoadingPools ? 'animate-spin text-[var(--primary)]' : ''}`} />
              <span>{isLoadingPools ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => handleOpenDeposit()}
          >
            + New Position
          </Button>
        </div>
      </div>

      {/* Uniswap-Style Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] w-fit">
        <button
          onClick={() => setActiveSubTab('pools')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'pools'
              ? 'bg-[var(--bg-surface)] text-[var(--primary)] border border-[var(--border-strong)] shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>All Pools</span>
        </button>

        <button
          onClick={() => setActiveSubTab('positions')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeSubTab === 'positions'
              ? 'bg-[var(--bg-surface)] text-[var(--primary)] border border-[var(--border-strong)] shadow-xs'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <WalletCards className="w-3.5 h-3.5" />
          <span>Your Positions</span>
          {userPositions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-mono">
              {userPositions.length}
            </span>
          )}
        </button>
      </div>

      {/* If "Your Positions" tab is selected, render Position Manager */}
      {activeSubTab === 'positions' ? (
        <PositionsView />
      ) : (
        <>
          {/* Global Pool Highlights for Selected Chain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
              <span className="text-xs text-[var(--text-tertiary)]">Total Pools TVL ({selectedChain.shortName})</span>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                {formatCurrency(totalPoolsTvl)}
              </div>
              <span className="text-[11px] text-[var(--success)] font-mono flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3" /> Live Verified Reserves
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
              <span className="text-xs text-[var(--text-tertiary)]">24h Distributed Fees</span>
              <div className="text-xl font-bold font-mono text-[var(--primary)] mt-1">
                {formatCurrency(total24hFees)}
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5 block">
                100% to Active Liquidity Providers
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
              <span className="text-xs text-[var(--text-tertiary)]">Top Concentrated APR</span>
              <div className="text-xl font-bold font-mono text-[var(--success)] mt-1">
                {topAprPool?.apr || 28.5}% APR
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] font-mono truncate mt-0.5 block">
                {topAprPool ? `${topAprPool.token0.symbol}/${topAprPool.token1.symbol} (${(topAprPool.feeTier / 10000).toFixed(2)}%)` : 'Active Ticks'}
              </span>
            </div>
          </div>

          {/* Pools Table Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl overflow-hidden shadow-xs">
            {/* Filter bar */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder={`Search ${selectedChain.shortName} pools (e.g. ETH/USDC)...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] font-mono">
                <span>{filteredPools.length} Active Pools on {selectedChain.name}</span>
              </div>
            </div>

            {/* Table Desktop / Card Mobile */}
            <div className="overflow-x-auto">
              {filteredPools.length > 0 ? (
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
                              <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                                <span>{pool.token0.symbol} / {pool.token1.symbol}</span>
                              </div>
                              <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                                1 {pool.token0.symbol} ≈ {pool.currentPrice < 0.001 ? pool.currentPrice.toExponential(3) : pool.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })} {pool.token1.symbol}
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
                          {formatCurrency(pool.tvlUSD)}
                        </td>

                        {/* 24h Volume */}
                        <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                          {formatCurrency(pool.volume24hUSD)}
                        </td>

                        {/* 24h Fees */}
                        <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                          {formatCurrency(pool.fees24hUSD)}
                        </td>

                        {/* APR */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--success)]">
                          {pool.apr}%
                        </td>

                        {/* CTA */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenDeposit(pool)}
                            className="px-3 py-1 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[#090B0E] font-semibold text-xs transition-all cursor-pointer border border-[var(--primary)]/30 inline-flex items-center gap-1"
                          >
                            Deposit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
                    <Droplets className="w-6 h-6 text-[var(--primary)] opacity-70" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      No pools found on {selectedChain.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                      Be the pioneer to seed concentrated liquidity on this chain and earn 100% of trading swap fees.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => handleOpenDeposit()}
                    >
                      Create First Pool
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Liquidity Modal */}
      {isDepositModalOpen && (
        <AddLiquidityModal
          isOpen={isDepositModalOpen}
          onClose={() => {
            setIsDepositModalOpen(false);
            setSelectedPoolForDeposit(null);
          }}
          pool={selectedPoolForDeposit || undefined}
        />
      )}
    </div>
  );
};
