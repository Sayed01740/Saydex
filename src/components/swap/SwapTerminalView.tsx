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
  }, [selectedChain.id, selectedChain.nativeCurrency.symbol]);

  // Keep active selected token prices and 24h change synchronized with live tokens array
  useEffect(() => {
    if (tokenIn) {
      const liveIn = tokens.find(
        (t) =>
          t.symbol.toUpperCase() === tokenIn.symbol.toUpperCase() &&
          (t.chainId === tokenIn.chainId || (!t.address && !tokenIn.address))
      );
      if (liveIn && Math.abs(liveIn.priceUSD - tokenIn.priceUSD) > 0.0001) {
        setTokenIn((prev) => ({ ...prev, priceUSD: liveIn.priceUSD, change24h: liveIn.change24h }));
      }
    }
    if (tokenOut) {
      const liveOut = tokens.find(
        (t) =>
          t.symbol.toUpperCase() === tokenOut.symbol.toUpperCase() &&
          (t.chainId === tokenOut.chainId || (!t.address && !tokenOut.address))
      );
      if (liveOut && Math.abs(liveOut.priceUSD - tokenOut.priceUSD) > 0.0001) {
        setTokenOut((prev) => ({ ...prev, priceUSD: liveOut.priceUSD, change24h: liveOut.change24h }));
      }
    }
  }, [tokens]);

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
    <div className="space-y-8 pb-16 pt-4 sm:pt-6">
      {/* Primary Swap Terminal Layout */}
      <div id="swap-terminal-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
        {/* Interactive Chart + Swap Card Grid */}
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

        {/* Target Price Alerts Manager */}
        <PriceAlertsManager
          onOpenSetAlertModal={handleOpenSetAlertModal}
          onSelectPair={handleSelectPairFromTrade}
        />

        {/* Mini-table of User's Recent Trade History */}
        <RecentTradesTable onSelectPair={handleSelectPairFromTrade} />
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
