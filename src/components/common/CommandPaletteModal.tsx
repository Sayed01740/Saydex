import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { ALL_CHAINS } from '../../config/chains';
import { TokenIcon } from './TokenIcon';
import { audioFeedback } from '../../utils/audioFeedback';
import {
  Search,
  ArrowRight,
  TrendingUp,
  Layers,
  Wallet,
  Settings,
  Sun,
  Moon,
  ExternalLink,
  Command,
  Flame,
  Check,
} from 'lucide-react';
import { Token } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTokenForTrade?: (token: Token) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTokenForTrade,
}) => {
  const { tokens, setActiveView } = useProtocol();
  const { selectedChain, switchChain, address } = useWallet();
  const { theme, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Build searchable items
  const navigationItems = [
    { id: 'nav-swap', type: 'nav', title: 'Swap & Trade', subtitle: 'Execute instant DEX trades', icon: <ArrowRight className="w-4 h-4 text-emerald-400" />, action: () => { setActiveView('swap'); onClose(); } },
    { id: 'nav-explore', type: 'nav', title: 'Explore Market', subtitle: 'Live token prices and trending pairs', icon: <TrendingUp className="w-4 h-4 text-cyan-400" />, action: () => { setActiveView('explore'); onClose(); } },
    { id: 'nav-pools', type: 'nav', title: 'Liquidity Pools', subtitle: 'Concentrated liquidity positions & fees', icon: <Layers className="w-4 h-4 text-indigo-400" />, action: () => { setActiveView('pools'); onClose(); } },
    { id: 'nav-portfolio', type: 'nav', title: 'Portfolio Terminal', subtitle: 'Real-time on-chain accounting', icon: <Wallet className="w-4 h-4 text-purple-400" />, action: () => { setActiveView('portfolio'); onClose(); } },
  ];

  const actionItems = [
    { id: 'act-theme', type: 'action', title: `Toggle Theme (${theme === 'dark' ? 'Light Mode' : 'Dark Mode'})`, subtitle: 'Switch color appearance', icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />, action: () => { toggleTheme(); onClose(); } },
    { id: 'act-explorer', type: 'action', title: 'Open Block Explorer', subtitle: `View ${selectedChain.name} scanner`, icon: <ExternalLink className="w-4 h-4 text-[var(--primary)]" />, action: () => { window.open(selectedChain.blockExplorerUrl, '_blank'); onClose(); } },
  ];

  const filteredChains = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return ALL_CHAINS.filter(c => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q)).slice(0, 4);
  }, [query]);

  const filteredTokens = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return tokens.slice(0, 6);
    return tokens.filter(t => 
      t.symbol.toLowerCase().includes(q) || 
      t.name.toLowerCase().includes(q) || 
      (t.address && t.address.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [tokens, query]);

  // Aggregate results
  const allResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list: Array<{ id: string; category: string; title: string; subtitle?: string; icon: React.ReactNode; onSelect: () => void }> = [];

    if (!q) {
      navigationItems.forEach(n => list.push({ id: n.id, category: 'Navigation', title: n.title, subtitle: n.subtitle, icon: n.icon, onSelect: n.action }));
      actionItems.forEach(a => list.push({ id: a.id, category: 'Quick Actions', title: a.title, subtitle: a.subtitle, icon: a.icon, onSelect: a.action }));
      filteredTokens.forEach(t => list.push({
        id: `tok-${t.symbol}-${t.chainId}`,
        category: 'Popular Tokens',
        title: `${t.symbol} (${t.name})`,
        subtitle: `$${t.priceUSD.toLocaleString()} • ${t.change24h >= 0 ? '+' : ''}${t.change24h}%`,
        icon: <TokenIcon symbol={t.symbol} icon={t.icon} size="xs" />,
        onSelect: () => {
          audioFeedback.playClick();
          if (onSelectTokenForTrade) onSelectTokenForTrade(t);
          setActiveView('swap');
          onClose();
        },
      }));
    } else {
      // Add matching nav items
      navigationItems.filter(n => n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)).forEach(n => {
        list.push({ id: n.id, category: 'Navigation', title: n.title, subtitle: n.subtitle, icon: n.icon, onSelect: n.action });
      });

      // Add matching tokens
      filteredTokens.forEach(t => {
        list.push({
          id: `tok-${t.symbol}-${t.chainId}`,
          category: 'Tokens',
          title: `${t.symbol} • ${t.name}`,
          subtitle: `$${t.priceUSD.toLocaleString()} • Trade on ${selectedChain.shortName}`,
          icon: <TokenIcon symbol={t.symbol} icon={t.icon} size="xs" />,
          onSelect: () => {
            audioFeedback.playClick();
            if (onSelectTokenForTrade) onSelectTokenForTrade(t);
            setActiveView('swap');
            onClose();
          },
        });
      });

      // Add matching chains
      filteredChains.forEach(c => {
        list.push({
          id: `chain-${c.id}`,
          category: 'Networks',
          title: `Switch to ${c.name}`,
          subtitle: `Chain ID: ${c.id} • ${c.nativeCurrency.symbol}`,
          icon: <div className="w-4 h-4 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] text-[9px] font-bold flex items-center justify-center">{c.shortName.charAt(0)}</div>,
          onSelect: () => {
            audioFeedback.playClick();
            switchChain(c.id);
            onClose();
          },
        });
      });

      // Add matching action items
      actionItems.filter(a => a.title.toLowerCase().includes(q)).forEach(a => {
        list.push({ id: a.id, category: 'Actions', title: a.title, subtitle: a.subtitle, icon: a.icon, onSelect: a.action });
      });
    }

    return list;
  }, [query, filteredTokens, filteredChains, selectedChain, theme]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < allResults.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          allResults[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allResults, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-[var(--border-app)] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--border-subtle)] gap-3 bg-[var(--bg-surface)]">
          <Search className="w-5 h-5 text-[var(--primary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, token (ETH, USDC), or network..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-subtle)] border border-[var(--border-app)] text-[var(--text-tertiary)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allResults.length > 0 ? (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--primary-subtle)] border border-[var(--primary)]/30 text-[var(--text-primary)]'
                      : 'hover:bg-[var(--bg-surface-hover)] border border-transparent text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)] font-mono uppercase">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[var(--primary)]" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
              No matching commands or tokens found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-[10px] text-[var(--primary)] font-semibold">Saydex Terminal</span>
        </div>
      </div>
    </div>
  );
};
