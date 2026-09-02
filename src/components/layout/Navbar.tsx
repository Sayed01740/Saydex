import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../common/BrandLogo';
import { Button } from '../common/Button';
import { WalletModal } from '../wallet/WalletModal';
import { ChainsModal } from '../chains/ChainsModal';
import { SwapSettingsModal } from '../swap/SwapSettingsModal';
import { ALL_CHAINS } from '../../config/chains';
import { ChainId } from '../../types';
import {
  ChevronDown,
  Sun,
  Moon,
  Fuel,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  Network,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const { activeView, setActiveView } = useProtocol();
  const {
    isConnected,
    isChainMismatch,
    syncAppWithWalletChain,
    address,
    ensName,
    selectedChain,
    detectedChainId,
    ethBalance,
    switchChain,
    formatAddress,
  } = useWallet();
  const { theme, toggleTheme } = useTheme();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isChainModalOpen, setIsChainModalOpen] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const primaryNavItems = [
    { id: 'swap', label: 'Trade' },
    { id: 'explore', label: 'Explore' },
    { id: 'pools', label: 'Pools' },
    { id: 'portfolio', label: 'Portfolio' },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-app)] bg-[var(--bg-app)]/85 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand & Main Navigation */}
          <div className="flex items-center gap-8 sm:gap-10">
            <button
              onClick={() => setActiveView('swap')}
              className="cursor-pointer focus:outline-none shrink-0"
            >
              <BrandLogo size="md" showText={false} />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryNavItems.map((item) => {
                const isActive = activeView === item.id || (item.id === 'pools' && activeView === 'positions');
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] border border-[var(--border-strong)] font-semibold shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Network Selector, Wallet, Theme & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Live Testnet Indicator Pill */}
            {selectedChain.testnet && (
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Testnet</span>
              </div>
            )}

            {/* Live Network Gas Indicator (Desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs text-[var(--text-tertiary)] font-mono">
              <Fuel className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{selectedChain.gasPriceGwei} Gwei</span>
            </div>

            {/* Network Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  isChainMismatch
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-app)] hover:border-[var(--border-strong)] text-[var(--text-primary)]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/40 flex items-center justify-center text-[9px] font-mono font-bold text-[var(--primary)]">
                  {selectedChain.shortName.charAt(0)}
                </div>
                <span className="hidden sm:inline">{selectedChain.shortName}</span>
                {isChainMismatch && <AlertCircle className="w-3 h-3 text-amber-400" />}
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </button>

              {isChainDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsChainDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-xl shadow-xl z-40 py-1.5 overflow-hidden">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center justify-between">
                      <span>Select Network</span>
                      {detectedChainId && (
                        <span className="text-[9px] text-[var(--text-tertiary)] font-mono">
                          Wallet: #{detectedChainId}
                        </span>
                      )}
                    </div>

                    {isChainMismatch && detectedChainId && (
                      <div className="mx-2 mb-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-amber-300 truncate">
                          Wallet is on #{detectedChainId}
                        </span>
                        <button
                          onClick={() => {
                            syncAppWithWalletChain();
                            setIsChainDropdownOpen(false);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-500 text-black font-semibold text-[10px] hover:bg-amber-400 cursor-pointer shrink-0"
                        >
                          Sync
                        </button>
                      </div>
                    )}
                    <div className="max-h-64 overflow-y-auto">
                      {ALL_CHAINS.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            switchChain(chain.id as ChainId);
                            setIsChainDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left cursor-pointer ${
                            selectedChain.id === chain.id
                              ? 'bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold'
                              : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] flex items-center justify-center text-[9px] font-mono font-bold">
                              {chain.shortName.charAt(0)}
                            </div>
                            <span className="truncate">{chain.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                            {chain.gasPriceGwei} gwei
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 mt-1 border-t border-[var(--border-subtle)] px-2">
                      <button
                        onClick={() => {
                          setIsChainDropdownOpen(false);
                          setIsChainModalOpen(true);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-left text-[11px] font-medium text-[var(--primary)] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5" />
                          <span>All Networks & Custom...</span>
                        </span>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Wallet Button */}
            {isConnected ? (
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--primary)]/50 transition-all text-xs font-semibold text-[var(--text-primary)] cursor-pointer shadow-xs"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse shrink-0" />
                <span className="hidden md:inline text-[var(--text-secondary)] font-mono text-[11px]">
                  {ethBalance.toFixed(3)} {selectedChain.nativeCurrency.symbol}
                </span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px]">
                  {ensName || formatAddress(address, 4)}
                </span>
              </button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsWalletModalOpen(true)}
              >
                Connect Wallet
              </Button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings || (() => setIsSettingsModalOpen(true))}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] transition-colors cursor-pointer"
              title="Protocol Settings & Routing Engine"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      {/* Chains & Custom EVM Network Modal */}
      <ChainsModal
        isOpen={isChainModalOpen}
        onClose={() => setIsChainModalOpen(false)}
      />

      {/* Swap & Global Protocol Settings Modal */}
      <SwapSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};
