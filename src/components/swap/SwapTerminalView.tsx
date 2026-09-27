import React, { useState, useEffect } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { Token } from '../../types';
import { SwapCard } from './SwapCard';
import { PriceChart } from './PriceChart';
import { SwapSettingsModal } from './SwapSettingsModal';
import { motion, AnimatePresence } from 'motion/react';
import { getUniswapV3Deployment } from '../../config/uniswapV3Contracts';
import { livePriceService } from '../../services/livePriceService';

export const SwapTerminalView: React.FC = () => {
  const { tokens, settings, targetTradeToken } = useProtocol();
  const { selectedChain } = useWallet();
  const [tokenIn, setTokenIn] = useState<Token>(() => tokens.find((t) => t.chainId === selectedChain.id) || tokens[0]);
  const [tokenOut, setTokenOut] = useState<Token>(() => tokens.find((t) => t.chainId === selectedChain.id && t.symbol === 'USDC') || tokens[1]);
  const [amountIn, setAmountIn] = useState<string>('1.0');
  const [isChartOpen, setIsChartOpen] = useState(false);

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
    const deployment = getUniswapV3Deployment(selectedChain.id);

    const chainTokens = tokens.filter((t) => t.chainId === selectedChain.id);
    const matchingNative =
      chainTokens.find(
        (t) =>
          t.address === '0x0000000000000000000000000000000000000000' ||
          t.symbol.toUpperCase() === nativeSym.toUpperCase()
      ) ||
      tokens.find((t) => t.symbol.toUpperCase() === nativeSym.toUpperCase() && t.chainId === selectedChain.id) || {
        address: '0x0000000000000000000000000000000000000000',
        chainId: selectedChain.id,
        symbol: nativeSym,
        name: nativeName,
        decimals: selectedChain.nativeCurrency.decimals || 18,
        priceUSD: livePriceService.getCachedPrice({ symbol: nativeSym, chainId: selectedChain.id } as Token)?.priceUSD || 0,
        change24h: livePriceService.getCachedPrice({ symbol: nativeSym, chainId: selectedChain.id } as Token)?.change24h || 0,
        icon: selectedChain.icon,
        isVerified: true,
        isPopular: true,
      };

    setTokenIn(matchingNative);

    const outCandidates = chainTokens.filter(
      (t) =>
        t.address !== '0x0000000000000000000000000000000000000000' &&
        t.symbol.toUpperCase() !== nativeSym.toUpperCase()
    );

    const targetStableAddr = deployment?.defaultStablecoinAddress?.toLowerCase();
    const targetStableSym = deployment?.defaultStablecoinSymbol?.toUpperCase() || 'USDC';

    const matchingOut =
      (targetStableAddr ? outCandidates.find((t) => t.address.toLowerCase() === targetStableAddr) : undefined) ||
      outCandidates.find((t) => t.symbol.toUpperCase() === targetStableSym) ||
      outCandidates.find((t) => t.symbol.toUpperCase() === 'USDC') ||
      outCandidates.find((t) => t.symbol.toUpperCase() === 'USDT') ||
      outCandidates[0] ||
      (deployment
        ? {
            address: deployment.defaultStablecoinAddress,
            chainId: selectedChain.id,
            symbol: deployment.defaultStablecoinSymbol,
            name: deployment.defaultStablecoinSymbol,
            decimals: ['USDT', 'CUSD', 'USDB'].includes(deployment.defaultStablecoinSymbol) && selectedChain.id !== 1 ? 18 : 6,
            priceUSD: 1.0,
            change24h: 0.0,
            icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
            isVerified: true,
            isPopular: true,
          }
        : tokens.find((t) => t.symbol.toUpperCase() === 'USDC') || tokens[1]);

    if (matchingOut) {
      setTokenOut(matchingOut);
    }
  }, [selectedChain.id, selectedChain.nativeCurrency.symbol]);

  // Keep active selected token prices and 24h change synchronized with live price service
  useEffect(() => {
    if (tokenIn) {
      const live = livePriceService.getCachedPrice(tokenIn);
      if (live && live.priceUSD > 0 && Math.abs(live.priceUSD - tokenIn.priceUSD) > 0.0001) {
        setTokenIn((prev) => ({ ...prev, priceUSD: live.priceUSD, change24h: live.change24h || prev.change24h }));
      }
    }
    if (tokenOut) {
      const live = livePriceService.getCachedPrice(tokenOut);
      if (live && live.priceUSD > 0 && Math.abs(live.priceUSD - tokenOut.priceUSD) > 0.0001) {
        setTokenOut((prev) => ({ ...prev, priceUSD: live.priceUSD, change24h: live.change24h || prev.change24h }));
      }
    }
  }, [tokens, tokenIn.symbol, tokenOut.symbol]);

  // Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentSwapRate, setCurrentSwapRate] = useState<number | undefined>(undefined);

  return (
    <div className="pb-16 pt-4 sm:pt-10">
      {/* Primary Swap Terminal Layout */}
      <div id="swap-terminal-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        {/* Interactive Chart + Swap Card Grid */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
          {/* Left: Interactive Price Chart (Collapsible/Responsive) */}
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
                  liveRate={currentSwapRate}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center: Precision Swap Card Terminal */}
          <div id="swap-card-container" className="w-full max-w-[480px] shrink-0 mx-auto scroll-mt-24">
            <SwapCard
              isChartOpen={isChartOpen}
              onToggleChart={() => setIsChartOpen(!isChartOpen)}
              externalTokenIn={tokenIn}
              externalTokenOut={tokenOut}
              externalAmountIn={amountIn}
              onAmountInChanged={(amt) => setAmountIn(amt)}
              onQuoteChanged={(q) => setCurrentSwapRate(q.executionPrice)}
              onTokensChanged={(inTok, outTok) => {
                setTokenIn(inTok);
                setTokenOut(outTok);
              }}
            />
          </div>
        </div>
      </div>

      {/* Trade & Protocol Settings Modal */}
      <SwapSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};
