import React, { useState, useEffect } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { Token } from '../../types';
import { SwapCard } from './SwapCard';
import { PriceChart } from './PriceChart';
import { TradeRouteVisualizer } from './TradeRouteVisualizer';
import { RecentTradesTable } from './RecentTradesTable';
import { PriceAlertsManager } from './PriceAlertsManager';
import { SetPriceAlertModal } from './SetPriceAlertModal';
import { SwapSettingsModal } from './SwapSettingsModal';
import { TokenIcon } from '../common/TokenIcon';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Activity,
  Layers,
  Target,
  Clock,
  Sliders,
  SlidersHorizontal,
  Info,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SwapTerminalView: React.FC = () => {
  const { tokens, settings, targetTradeToken } = useProtocol();
  const { selectedChain } = useWallet();
  const [tokenIn, setTokenIn] = useState<Token>(() => tokens.find((t) => t.chainId === selectedChain.id) || tokens[0]);
  const [tokenOut, setTokenOut] = useState<Token>(() => tokens.find((t) => t.chainId === selectedChain.id && t.symbol === 'USDC') || tokens[1]);
  const [amountIn, setAmountIn] = useState<string>('1.0');
  const [isChartOpen, setIsChartOpen] = useState(true);

  // Synchronize when a trade token is selected from Explore or Markets
  useEffect(() => {
    if (targetTradeToken) {
      if (tokenIn.symbol === targetTradeToken.symbol) {
        const other = tokens.find((t) => t.symbol !== targetTradeToken.symbol && t.chainId === selectedChain.id);
        if (other) setTokenIn(other);
      }
      setTokenOut(targetTradeToken);
      setTimeout(() => {
        document.getElementById('swap-terminal-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [targetTradeToken]);

  // Automatically synchronize tokenIn and tokenOut whenever the active network / chain changes
  useEffect(() => {
    const nativeSym = selectedChain.nativeCurrency.symbol;
    const nativeName = selectedChain.nativeCurrency.name;

    const chainTokens = tokens.filter((t) => t.chainId === selectedChain.id);
    const matchingNative =
      chainTokens.find(
        (t) =>
          t.symbol.toUpperCase() === nativeSym.toUpperCase() ||
          t.address === '0x0000000000000000000000000000000000000000'
      ) ||
      tokens.find((t) => t.symbol.toUpperCase() === nativeSym.toUpperCase() && t.chainId === selectedChain.id) || {
        address: '0x0000000000000000000000000000000000000000',
        chainId: selectedChain.id,
        symbol: nativeSym,
        name: nativeName,
        decimals: selectedChain.nativeCurrency.decimals || 18,
        priceUSD: nativeSym === 'BNB' ? 645.0 : nativeSym === 'AVAX' ? 34.8 : nativeSym === 'POL' ? 0.52 : 3482.5,
        change24h: 2.5,
        icon: selectedChain.icon,
        isVerified: true,
        isPopular: true,
      };

    setTokenIn(matchingNative);

    const outCandidates = chainTokens.filter(
      (t) =>
        t.symbol.toUpperCase() !== nativeSym.toUpperCase() &&
        t.address !== '0x0000000000000000000000000000000000000000'
    );
    const matchingOut =
      outCandidates.find((t) => t.symbol.toUpperCase() === 'USDC') ||
      outCandidates.find((t) => t.symbol.toUpperCase() === 'USDT') ||
      outCandidates[0] ||
      tokens.find((t) => t.symbol.toUpperCase() === 'USDC') ||
      tokens[1];

    if (matchingOut) {
      setTokenOut(matchingOut);
    }
  }, [selectedChain.id, selectedChain.nativeCurrency.symbol, tokens]);

  // Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Target Price Alert Modal state
  const [isSetAlertModalOpen, setIsSetAlertModalOpen] = useState(false);
  const [alertModalTokenIn, setAlertModalTokenIn] = useState<Token | undefined>(undefined);
  const [alertModalTokenOut, setAlertModalTokenOut] = useState<Token | undefined>(undefined);

  const handleOpenSetAlertModal = (inTok?: Token, outTok?: Token) => {
    setAlertModalTokenIn(inTok || tokenIn);
    setAlertModalTokenOut(outTok || tokenOut);
    setIsSetAlertModalOpen(true);
  };

  const handleSelectPairFromTrade = (inSymbol: string, outSymbol: string, amount?: string) => {
    const foundIn = tokens.find((t) => t.symbol.toUpperCase() === inSymbol.toUpperCase());
    const foundOut = tokens.find((t) => t.symbol.toUpperCase() === outSymbol.toUpperCase());
    if (foundIn) setTokenIn(foundIn);
    if (foundOut) setTokenOut(foundOut);
    if (amount) setAmountIn(amount);
  };

  return (
    <div className="space-y-6 pb-16 pt-4 sm:pt-6">
      {/* Primary Swap Terminal Layout */}
      <div id="swap-terminal-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
        {/* Terminal Execution & Settings Quick Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="font-semibold text-[var(--text-primary)]">Saydex v3 Hybrid Router</span>
            </div>

            {/* Clickable Slippage Tolerance pill */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--primary-subtle)] hover:border-[var(--primary)]/40 border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all cursor-pointer group"
              title="Click to configure max allowed slippage tolerance"
            >
              <span className="text-[var(--text-tertiary)] group-hover:text-[var(--primary)]">Slippage:</span>
              <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                {settings.slippageTolerance}%
              </span>
            </button>

            {/* Clickable Transaction Deadline pill */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--primary-subtle)] hover:border-[var(--primary)]/40 border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all cursor-pointer group"
              title="Click to configure transaction expiration deadline duration"
            >
              <Clock className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-[var(--primary)]" />
              <span className="text-[var(--text-tertiary)] group-hover:text-[var(--primary)]">Deadline:</span>
              <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                {settings.deadlineMinutes}m
              </span>
            </button>

            {settings.mevProtection && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MEV Guard Active</span>
              </span>
            )}
          </div>

          {/* Quick Settings & Alert Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => handleOpenSetAlertModal(tokenIn, tokenOut)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs"
            >
              <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Price Alert</span>
            </button>

            <button
              type="button"
              id="swap-terminal-settings-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--primary-subtle)] hover:bg-[var(--primary)] hover:text-[#090B0E] border border-[var(--primary)]/30 text-xs font-bold text-[var(--primary)] transition-all cursor-pointer shadow-2xs group"
              title="Configure Slippage Tolerance, Transaction Deadline & Execution Routing"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-6">
          {/* Left / Center: Interactive Price Chart (Collapsible/Responsive) */}
          <AnimatePresence>
            {isChartOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="w-full lg:flex-1 min-w-0"
              >
                <PriceChart
                  tokenIn={tokenIn}
                  tokenOut={tokenOut}
                  onOpenSetAlertModal={handleOpenSetAlertModal}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right / Center: Precision Swap Card Terminal */}
          <div id="swap-card-container" className="w-full lg:w-[480px] shrink-0 mx-auto scroll-mt-24">
            <SwapCard
              isChartOpen={isChartOpen}
              onToggleChart={() => setIsChartOpen(!isChartOpen)}
              externalTokenIn={tokenIn}
              externalTokenOut={tokenOut}
              externalAmountIn={amountIn}
              onOpenSetAlertModal={handleOpenSetAlertModal}
              onAmountInChanged={(amt) => setAmountIn(amt)}
              onTokensChanged={(inTok, outTok) => {
                setTokenIn(inTok);
                setTokenOut(outTok);
              }}
            />
          </div>
        </div>

        {/* Visual Trade Routing & Multi-Hop Path Indicator */}
        <TradeRouteVisualizer
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          amountIn={amountIn}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Target Price Alerts Manager */}
        <PriceAlertsManager
          onOpenSetAlertModal={handleOpenSetAlertModal}
          onSelectPair={handleSelectPairFromTrade}
        />

        {/* Mini-table of User's Recent Trade History */}
        <RecentTradesTable onSelectPair={handleSelectPairFromTrade} />

        {/* Protocol Execution Assurances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto pt-2">
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                MEV-Shielded Execution
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Swaps are routed via private solver mempools to prevent frontrunning and sandwich attacks.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Multi-Hop Split Routing
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Automated order splitting across concentrated ticks guarantees minimal market price impact.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0">
              <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Guaranteed Settlement Rate
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Zero slippage beyond your configured threshold ({settings.slippageTolerance}%). Unfavorable price shifts are automatically reverted.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trade & Protocol Settings Modal */}
      <SwapSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Set Price Alert Modal */}
      <SetPriceAlertModal
        isOpen={isSetAlertModalOpen}
        onClose={() => setIsSetAlertModalOpen(false)}
        initialTokenIn={alertModalTokenIn}
        initialTokenOut={alertModalTokenOut}
      />
    </div>
  );
};
