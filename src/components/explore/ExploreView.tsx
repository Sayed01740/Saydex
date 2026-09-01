import React, { useState, useMemo } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { Token } from '../../types';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ArrowUpDown,
  Filter,
  Sparkles,
  Flame,
  Layers,
  DollarSign,
  Coins,
  Cpu,
  ExternalLink,
} from 'lucide-react';

export const ExploreView: React.FC = () => {
  const { tokens, setActiveView } = useProtocol();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'gainers' | 'defi' | 'stablecoin' | 'lst' | 'layer2' | 'ai' | 'meme'>('all');
  const [sortField, setSortField] = useState<'volume' | 'price' | 'change' | 'tvl'>('volume');
  const [sortAsc, setSortAsc] = useState(false);

  const categoryFilters = [
    { id: 'all', label: 'All Tokens' },
    { id: 'trending', label: 'Trending', icon: <Flame className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'gainers', label: 'Top Gainers', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
    { id: 'defi', label: 'DeFi', icon: <Layers className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 'stablecoin', label: 'Stablecoins', icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> },
    { id: 'lst', label: 'LST / Restaking', icon: <Coins className="w-3.5 h-3.5 text-cyan-500" /> },
    { id: 'layer2', label: 'Layer 2 & L1' },
    { id: 'ai', label: 'AI & Data', icon: <Cpu className="w-3.5 h-3.5 text-purple-500" /> },
    { id: 'meme', label: 'Memes', icon: <Sparkles className="w-3.5 h-3.5 text-rose-500" /> },
  ];

  const filteredAndSortedTokens = useMemo(() => {
    let result = tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'trending') {
      result = result.filter((t) => t.isPopular || (t.volume24hUSD && t.volume24hUSD > 100000000));
    } else if (activeTab === 'gainers') {
      result = result.filter((t) => t.change24h > 0);
    } else if (activeTab !== 'all') {
      result = result.filter((t) => t.category === activeTab);
    }

    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'volume') {
        valA = a.volume24hUSD || 0;
        valB = b.volume24hUSD || 0;
      } else if (sortField === 'price') {
        valA = a.priceUSD;
        valB = b.priceUSD;
      } else if (sortField === 'change') {
        valA = a.change24h;
        valB = b.change24h;
      } else if (sortField === 'tvl') {
        valA = a.tvlUSD || 0;
        valB = b.tvlUSD || 0;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [tokens, searchQuery, activeTab, sortField, sortAsc]);

  const handleSort = (field: 'volume' | 'price' | 'change' | 'tvl') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Decentralized Markets Explorer
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time on-chain pricing, liquidity depth, and verified protocol volume for Uniswap tokens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-tertiary)] px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            Source: Uniswap Official Token Lists ({tokens.length} assets)
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl overflow-hidden shadow-xs space-y-3 p-4">
        {/* Search & Category Filter Controls */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categoryFilters.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-xs w-full shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search token name or 0x..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all font-sans"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-semibold text-[10px] tracking-wider select-none">
              <tr>
                <th className="py-3 px-4"># Token</th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('price')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('change')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('volume')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>24h Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-primary)]"
                  onClick={() => handleSort('tvl')}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Protocol TVL</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredAndSortedTokens.map((tok, idx) => (
                <tr
                  key={`${tok.chainId}-${tok.address}-${tok.symbol}`}
                  className="hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-[var(--text-tertiary)] w-5">
                        {idx + 1}
                      </span>
                      <TokenIcon symbol={tok.symbol} icon={tok.icon} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[var(--text-primary)]">
                            {tok.symbol}
                          </span>
                          {tok.isVerified ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                          ) : (
                            <span className="text-[9px] px-1 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)]">
                              Custom
                            </span>
                          )}
                          {tok.category && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)] uppercase font-mono">
                              {tok.category}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{tok.name}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                    ${tok.priceUSD < 0.01
                      ? tok.priceUSD.toFixed(6)
                      : tok.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        tok.change24h >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                      }`}
                    >
                      {tok.change24h >= 0 ? '+' : ''}{tok.change24h}%
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                    ${((tok.volume24hUSD || 0) / 1000000).toFixed(1)}M
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                    ${((tok.tvlUSD || 0) / 1000000).toFixed(1)}M
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setActiveView('swap')}
                      className="px-3 py-1 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--primary)] hover:text-[#090B0E] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              ))}

              {filteredAndSortedTokens.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                    No tokens found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
