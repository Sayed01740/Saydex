import React, { useState, useMemo, useEffect } from 'react';
import { Token, SwapQuote } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { calculateTradeRoutes } from '../../utils/routing';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import { TokenSelectorModal } from './TokenSelectorModal';
import { SwapSettingsModal } from './SwapSettingsModal';
import { RoutingVisualizer } from './RoutingVisualizer';
import { WalletModal } from '../wallet/WalletModal';
import { SwapReviewModal } from './SwapReviewModal';
import { ALL_CHAINS, getChainById } from '../../config/chains';
import {
  ArrowDownUp,
  ChevronDown,
  SlidersHorizontal,
  Info,
  Sparkles,
  BarChart2,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Target,
  Loader2,
  CreditCard,
  Clock,
  CheckCircle2,
  Zap,
  Fuel,
} from 'lucide-react';
import { motion } from 'motion/react';
import { uniswapV3Service, OnChainQuoteResult } from '../../services/uniswapV3Service';
import { getUniswapV3Deployment } from '../../config/uniswapV3Contracts';
import { livePriceService } from '../../services/livePriceService';
import { LimitOrdersManager } from './LimitOrdersManager';
import { FiatOnRampModal } from '../common/FiatOnRampModal';
import { limitOrdersService } from '../../services/limitOrdersService';
import { tokenSecurityService } from '../../services/tokenSecurityService';
import { audioFeedback } from '../../utils/audioFeedback';
import { TokenSecurityBadge } from './TokenSecurityBadge';

interface SwapCardProps {
  onToggleChart?: () => void;
  isChartOpen?: boolean;
  onTokensChanged?: (tokenIn: Token, tokenOut: Token) => void;
  onAmountInChanged?: (amount: string) => void;
  externalTokenIn?: Token;
  externalTokenOut?: Token;
  externalAmountIn?: string;
  onOpenSetAlertModal?: (tokenIn?: Token, tokenOut?: Token) => void;
  onQuoteChanged?: (quote: SwapQuote) => void;
}

export const SwapCard: React.FC<SwapCardProps> = ({
  onToggleChart,
  isChartOpen = false,
  onTokensChanged,
  onAmountInChanged,
  onQuoteChanged,
  externalTokenIn,
  externalTokenOut,
  externalAmountIn,
  onOpenSetAlertModal,
}) => {
  const {
    isConnected,
    address,
    signTypedDataV4,
    ethBalance,
    usdcBalance,
    getTokenBalance,
    selectedChain,
    isChainMismatch,
    detectedChainId,
    switchChain,
    syncAppWithWalletChain,
  } = useWallet();
  const { tokens, settings } = useProtocol();

  const [tokenIn, setTokenIn] = useState<Token>(() => externalTokenIn || tokens[0] || {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    priceUSD: livePriceService.getCachedPrice({ symbol: 'ETH', chainId: 1 } as Token)?.priceUSD || 2680.00,
    change24h: 3.42,
    volume24hUSD: 425000000,
    color: '#627EEA',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  });
  const [tokenOut, setTokenOut] = useState<Token>(() => externalTokenOut || tokens[1] || {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    priceUSD: 1.00,
    change24h: 0.01,
    volume24hUSD: 850000000,
    color: '#2775CA',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  });
  const [amountIn, setAmountIn] = useState<string>(() => externalAmountIn || '1.0');
  const [showDetails, setShowDetails] = useState(false);

  // Adapt native currency & pair tokens when selected chain changes
  useEffect(() => {
    if (!externalTokenIn) {
      const nativeSym = selectedChain.nativeCurrency.symbol;
      const nativeName = selectedChain.nativeCurrency.name;
      const deployment = getUniswapV3Deployment(selectedChain.id);
      
      const chainTokens = tokens.filter((t) => t.chainId === selectedChain.id);
      const matchingNative =
        chainTokens.find(
          (t) =>
            t.address === '0x0000000000000000000000000000000000000000' ||
            t.symbol.toUpperCase() === nativeSym.toUpperCase()
        ) || {
          id: `${selectedChain.id}-${nativeSym.toLowerCase()}`,
          address: '0x0000000000000000000000000000000000000000',
          symbol: nativeSym,
          name: nativeName,
          decimals: selectedChain.nativeCurrency.decimals || 18,
          priceUSD: livePriceService.getCachedPrice({ symbol: nativeSym, chainId: selectedChain.id } as Token)?.priceUSD || 0,
          change24h: livePriceService.getCachedPrice({ symbol: nativeSym, chainId: selectedChain.id } as Token)?.change24h || 0,
          volume24hUSD: 100000000,
          color: '#627EEA',
          iconUrl: selectedChain.icon,
          chainId: selectedChain.id,
        };

      setTokenIn(matchingNative);

      // Also adapt tokenOut to a token on the selected chain (e.g. USDC or USDT or default stablecoin)
      if (!externalTokenOut) {
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
                id: `${selectedChain.id}-${deployment.defaultStablecoinSymbol.toLowerCase()}`,
                address: deployment.defaultStablecoinAddress,
                chainId: selectedChain.id,
                symbol: deployment.defaultStablecoinSymbol,
                name: deployment.defaultStablecoinSymbol,
                decimals: ['USDT', 'CUSD', 'USDB'].includes(deployment.defaultStablecoinSymbol) && selectedChain.id !== 1 ? 18 : 6,
                priceUSD: 1.0,
                change24h: 0.0,
                color: '#2775CA',
                iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
              }
            : undefined);

        if (matchingOut) {
          setTokenOut(matchingOut);
          if (onTokensChanged) onTokensChanged(matchingNative, matchingOut);
        } else {
          if (onTokensChanged) onTokensChanged(matchingNative, tokenOut);
        }
      } else {
        if (onTokensChanged) onTokensChanged(matchingNative, tokenOut);
      }
    }
  }, [selectedChain.id]);

  // Sync when external tokens change
  useEffect(() => {
    if (externalTokenIn && (externalTokenIn.symbol !== tokenIn.symbol || externalTokenIn.chainId !== tokenIn.chainId || externalTokenIn.address !== tokenIn.address)) {
      setTokenIn(externalTokenIn);
    }
  }, [externalTokenIn]);

  useEffect(() => {
    if (externalTokenOut && (externalTokenOut.symbol !== tokenOut.symbol || externalTokenOut.chainId !== tokenOut.chainId || externalTokenOut.address !== tokenOut.address)) {
      setTokenOut(externalTokenOut);
    }
  }, [externalTokenOut]);

  useEffect(() => {
    if (externalAmountIn && externalAmountIn !== amountIn) {
      setAmountIn(externalAmountIn);
    }
  }, [externalAmountIn]);

  const [selectorTarget, setSelectorTarget] = useState<'in' | 'out' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isFiatModalOpen, setIsFiatModalOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [onChainQuoteResult, setOnChainQuoteResult] = useState<OnChainQuoteResult | null>(null);

  // Trade Modes: Swap vs Gasless Limit vs Buy with Card
  const [tradeMode, setTradeMode] = useState<'swap' | 'limit' | 'buy'>('swap');
  const [limitTargetPrice, setLimitTargetPrice] = useState<string>('');
  const [limitCondition, setLimitCondition] = useState<'gte' | 'lte'>('gte');
  const [limitExpiryDays, setLimitExpiryDays] = useState<number>(7);
  const [isLimitSuccess, setIsLimitSuccess] = useState(false);
  const [isSigningLimitOrder, setIsSigningLimitOrder] = useState(false);

  const handlePlaceLimitOrder = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0 || !limitTargetPrice) return;
    if (!address) {
      setIsWalletModalOpen(true);
      return;
    }

    setIsSigningLimitOrder(true);
    try {
      const targetNum = parseFloat(limitTargetPrice) || (tokenIn.priceUSD * 1.05);
      const estOut = (parseFloat(amountIn) * targetNum).toFixed(4);
      const expiryTimestamp = limitExpiryDays > 0 ? Date.now() + limitExpiryDays * 86400000 : 0;

      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          LimitOrder: [
            { name: 'maker', type: 'address' },
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'amountIn', type: 'string' },
            { name: 'minAmountOut', type: 'string' },
            { name: 'targetPrice', type: 'string' },
            { name: 'condition', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        primaryType: 'LimitOrder',
        domain: {
          name: 'Saydex Limit Orders',
          version: '1',
          chainId: selectedChain.id,
          verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
        },
        message: {
          maker: address,
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amountIn,
          minAmountOut: estOut,
          targetPrice: targetNum.toString(),
          condition: limitCondition,
          nonce: Date.now(),
          deadline: expiryTimestamp > 0 ? Math.floor(expiryTimestamp / 1000) : Math.floor(Date.now() / 1000) + 86400 * 30,
        },
      };

      const sigResult = await signTypedDataV4(typedData);

      limitOrdersService.createLimitOrder({
        userAddress: address,
        chainId: selectedChain.id,
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut: estOut,
        targetPrice: targetNum,
        currentPriceAtCreation: tokenIn.priceUSD || 0,
        condition: limitCondition,
        expiresAt: expiryTimestamp,
        signature: sigResult.signature,
        signedAt: sigResult.signedAt,
      });

      setIsLimitSuccess(true);
      setTimeout(() => setIsLimitSuccess(false), 3500);
    } catch (err: any) {
      console.error('Limit order signing cancelled or rejected:', err);
    } finally {
      setIsSigningLimitOrder(false);
    }
  };

  // Debounced live on-chain quoting effect against QuoterV2
  useEffect(() => {
    let isCancelled = false;
    const parsedAmount = parseFloat(amountIn) || 0;
    if (parsedAmount <= 0) {
      setOnChainQuoteResult(null);
      setIsQuoting(false);
      return;
    }

    setIsQuoting(true);
    const timer = setTimeout(async () => {
      try {
        const result = await uniswapV3Service.getOnChainQuote(
          selectedChain.id,
          tokenIn,
          tokenOut,
          amountIn,
          3000
        );
        if (!isCancelled) {
          setOnChainQuoteResult(result);
          setIsQuoting(false);
        }
      } catch {
        if (!isCancelled) setIsQuoting(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [amountIn, tokenIn, tokenOut, selectedChain.id]);

  // Calculate live output quote combining on-chain quoter with fallback math
  const quote: SwapQuote = useMemo(() => {
    const parsedAmount = parseFloat(amountIn) || 0;
    const inPrice = (tokenIn?.priceUSD && tokenIn.priceUSD > 0)
      ? tokenIn.priceUSD
      : (livePriceService.getCachedPrice(tokenIn)?.priceUSD || 0);
    const outPrice = (tokenOut?.priceUSD && tokenOut.priceUSD > 0)
      ? tokenOut.priceUSD
      : (livePriceService.getCachedPrice(tokenOut)?.priceUSD || 1.0);
    const mathRate = outPrice > 0 ? inPrice / outPrice : inPrice;
    const mathOut = parsedAmount * mathRate;

    // Use live on-chain quote if available and valid
    const hasOnChain = Boolean(onChainQuoteResult && onChainQuoteResult.amountOut > 0);
    const calculatedOut = hasOnChain ? onChainQuoteResult!.amountOut : mathOut;
    const rate = parsedAmount > 0 ? calculatedOut / parsedAmount : mathRate;

    const slippageMultiplier = (100 - settings.slippageTolerance) / 100;
    const minOut = calculatedOut * slippageMultiplier;

    // Use calculated trade routes
    const routes = calculateTradeRoutes(tokenIn, tokenOut, amountIn, settings.slippageTolerance, 'smart_split');
    const selectedRoute = routes[0];

    const feeTier = onChainQuoteResult?.feeTier || 3000;
    const feeTierDisplay = feeTier === 500 ? '0.05%' : feeTier === 10000 ? '1.00%' : '0.30%';

    return {
      tokenIn,
      tokenOut,
      amountIn: amountIn || '0',
      amountOut: calculatedOut > 0 ? (calculatedOut > 1 ? calculatedOut.toFixed(4) : calculatedOut.toFixed(6)) : '0.00',
      amountOutMin: minOut > 0 ? (minOut > 1 ? minOut.toFixed(4) : minOut.toFixed(6)) : '0.00',
      executionPrice: rate,
      priceImpact: selectedRoute ? selectedRoute.priceImpact : 0.01,
      networkFeeUSD: onChainQuoteResult?.gasEstimate
        ? Math.max(0.05, (onChainQuoteResult.gasEstimate * 25e-9 * (tokenIn.priceUSD || 3000)))
        : (selectedRoute ? selectedRoute.gasCostUSD : 1.45),
      feeTier,
      quoteSource: onChainQuoteResult?.source || 'fallback_math',
      gasEstimate: onChainQuoteResult?.gasEstimate,
      routeHops: selectedRoute ? selectedRoute.routeHops : [
        {
          protocol: 'Uniswap V3',
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          percentage: 100,
          fromToken: tokenIn?.symbol || 'ETH',
          toToken: tokenOut?.symbol || 'USDC',
          feeTier: feeTierDisplay,
        },
      ],
      calldataHex: `0x5ae401dc000000000000000000000000${(tokenIn?.address || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2').replace('0x', '')}000000000000000000000000${(tokenOut?.address || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48').replace('0x', '')}0000000000000000000000000000000000000000000000000de0b6b3a7640000`,
      guaranteedUntil: Date.now() + 30000,
      mevProtected: settings.mevProtection,
    };
  }, [tokenIn, tokenOut, amountIn, settings, onChainQuoteResult]);

  // Synchronize live quote to parent container (for chart and external viewers)
  useEffect(() => {
    if (onQuoteChanged && quote) {
      onQuoteChanged(quote);
    }
  }, [quote, onQuoteChanged]);

  // Synchronize live token prices when ProtocolContext updates
  useEffect(() => {
    const liveIn = tokens.find((t) => t.symbol === tokenIn.symbol && (t.chainId === tokenIn.chainId || !tokenIn.chainId));
    if (liveIn && (liveIn.priceUSD !== tokenIn.priceUSD || liveIn.change24h !== tokenIn.change24h)) {
      setTokenIn((prev) => ({ ...prev, priceUSD: liveIn.priceUSD, change24h: liveIn.change24h }));
    }
    const liveOut = tokens.find((t) => t.symbol === tokenOut.symbol && (t.chainId === tokenOut.chainId || !tokenOut.chainId));
    if (liveOut && (liveOut.priceUSD !== tokenOut.priceUSD || liveOut.change24h !== tokenOut.change24h)) {
      setTokenOut((prev) => ({ ...prev, priceUSD: liveOut.priceUSD, change24h: liveOut.change24h }));
    }
  }, [tokens]);

  const userBalanceIn = isConnected ? getTokenBalance(tokenIn, selectedChain.id) : 0;
  const userBalanceOut = isConnected ? getTokenBalance(tokenOut, selectedChain.id) : 0;

  const isInsufficientBalance = isConnected && parseFloat(amountIn || '0') > userBalanceIn;

  const handleFlipTokens = () => {
    audioFeedback.playFlip();
    setIsFlipping(true);
    setTimeout(() => {
      const prevIn = tokenIn;
      const prevOut = tokenOut;
      setTokenIn(prevOut);
      setTokenOut(prevIn);
      if (onTokensChanged) onTokensChanged(prevOut, prevIn);
      setIsFlipping(false);
    }, 150);
  };

  const handleSelectToken = (selected: Token) => {
    audioFeedback.playClick();
    if (selectorTarget === 'in') {
      if (selected.symbol === tokenOut.symbol) {
        setTokenOut(tokenIn);
      }
      setTokenIn(selected);
      if (onTokensChanged) onTokensChanged(selected, tokenOut);
    } else if (selectorTarget === 'out') {
      if (selected.symbol === tokenIn.symbol) {
        setTokenIn(tokenOut);
      }
      setTokenOut(selected);
      if (onTokensChanged) onTokensChanged(tokenIn, selected);
    }
  };

  const handlePercentInput = (pct: number) => {
    audioFeedback.playClick();
    if (userBalanceIn <= 0) {
      setAmountIn('0');
      if (onAmountInChanged) onAmountInChanged('0');
      return;
    }
    const val = (userBalanceIn * pct).toFixed(tokenIn.decimals > 8 ? 4 : 2);
    setAmountIn(val);
    if (onAmountInChanged) onAmountInChanged(val);
  };

  const handleAmountChange = (val: string) => {
    setAmountIn(val);
    if (onAmountInChanged) onAmountInChanged(val);
  };

  return (
    <>
      <div className="relative w-full max-w-[480px] mx-auto">
        {/* Ambient Aurora Glow Backdrop */}
        <div className="aurora-glow-cyan w-64 h-64 -top-10 -left-10 opacity-70 pointer-events-none" />
        <div className="aurora-glow-indigo w-64 h-64 -bottom-10 -right-10 opacity-60 pointer-events-none" />

        <div className="relative w-full glass-panel rounded-3xl p-4 sm:p-5 shadow-[var(--shadow-card)] transition-all">
        {/* Header: Tab Switcher (Swap vs Limit), Chart toggle, Settings */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTradeMode('swap')}
              className={`px-3 py-1.5 rounded-xl text-base font-bold transition-all cursor-pointer ${
                tradeMode === 'swap'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Swap
            </button>
            <button
              type="button"
              onClick={() => {
                setTradeMode('limit');
                if (!limitTargetPrice) {
                  const defaultTarget = (tokenIn.priceUSD || 2424.65) * 1.05;
                  setLimitTargetPrice(defaultTarget.toFixed(2));
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-base font-bold transition-all cursor-pointer ${
                tradeMode === 'limit'
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Limit
            </button>
          </div>

          <div className="flex items-center gap-1">
            {onToggleChart && (
              <button
                onClick={onToggleChart}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isChartOpen
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
                title="Toggle Price Chart"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              title="Trade Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Network Mismatch Quick Sync Bar */}
        {isChainMismatch && detectedChainId && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                Wallet on <strong>{getChainById(detectedChainId).shortName || `#${detectedChainId}`}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => switchChain(selectedChain.id)}
                className="px-2 py-1 rounded bg-amber-500 text-black font-semibold text-[11px] hover:bg-amber-400 cursor-pointer transition-colors"
                title={`Switch wallet extension to ${selectedChain.name}`}
              >
                Sync Wallet
              </button>
            </div>
          </div>
        )}

        {/* Input: Token In ("Sell") */}
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] hover:border-[var(--border-strong)] focus-within:border-[var(--primary)]/50 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
            <span className="font-medium text-[var(--text-secondary)]">Sell</span>
            {isConnected && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-tertiary)]">
                <span>{userBalanceIn.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenIn.symbol}</span>
                {userBalanceIn > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePercentInput(1.0)}
                    className="text-[var(--primary)] hover:underline font-bold cursor-pointer text-[11px]"
                  >
                    Max
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              placeholder="0"
              value={amountIn}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-transparent font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none"
              min="0"
              step="any"
            />

            <button
              onClick={() => setSelectorTarget('in')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-xs shrink-0"
            >
              <TokenIcon symbol={tokenIn.symbol} icon={tokenIn.icon} size="sm" />
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                {tokenIn.symbol}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-tertiary)] font-mono">
            <span>
              ≈ ${(parseFloat(amountIn || '0') * tokenIn.priceUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Flip Token Trigger Button */}
        <div className="flex justify-center -my-3.5 relative z-10">
          <motion.button
            onClick={handleFlipTokens}
            animate={{ rotate: isFlipping ? 180 : 0 }}
            transition={{ duration: 0.16 }}
            className="w-9 h-9 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center justify-center shadow-md transition-colors cursor-pointer"
            title="Invert swap direction"
          >
            <ArrowDownUp className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Input: Token Out ("Buy") */}
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] hover:border-[var(--border-strong)] rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
            <span className="font-medium text-[var(--text-secondary)]">Buy</span>
            {isConnected && (
              <div className="font-mono text-xs text-[var(--text-tertiary)]">
                {userBalanceOut.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenOut.symbol}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="w-full font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] select-all truncate flex items-center gap-2">
              {isQuoting ? (
                <div className="h-9 w-44 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] shimmer-wave" />
              ) : (
                quote.amountOut || '0'
              )}
            </div>

            <button
              onClick={() => setSelectorTarget('out')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-xs shrink-0"
            >
              <TokenIcon symbol={tokenOut.symbol} icon={tokenOut.icon} size="sm" />
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                {tokenOut.symbol}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-tertiary)] font-mono">
            <span>
              ≈ ${(parseFloat(quote.amountOut || '0') * tokenOut.priceUSD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* LIMIT ORDER CONTROLS (Only visible in Limit Mode) */}
        {tradeMode === 'limit' && (
          <div className="my-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)]">Target Rate Price</span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'Market', mult: 1.0 },
                  { label: '+1%', mult: 1.01 },
                  { label: '+5%', mult: 1.05 },
                  { label: '+10%', mult: 1.10 },
                  { label: '-5%', mult: 0.95 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const base = tokenIn.priceUSD || 2424.65;
                      const calculated = (base * preset.mult).toFixed(2);
                      setLimitTargetPrice(calculated);
                      setLimitCondition(preset.mult >= 1.0 ? 'gte' : 'lte');
                    }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-tertiary)]">$</span>
                <input
                  type="number"
                  value={limitTargetPrice}
                  onChange={(e) => setLimitTargetPrice(e.target.value)}
                  placeholder="Target USD price..."
                  className="w-full pl-6 pr-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] focus:border-[var(--primary)] text-sm font-mono font-bold text-[var(--text-primary)] outline-none"
                />
              </div>

              <select
                value={limitExpiryDays}
                onChange={(e) => setLimitExpiryDays(parseInt(e.target.value, 10))}
                className="px-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer focus:outline-none"
              >
                <option value={1}>1 Day</option>
                <option value={7}>1 Week</option>
                <option value={30}>1 Month</option>
                <option value={0}>Never</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
              <span>Execute when {tokenIn.symbol} {limitCondition === 'gte' ? '≥' : '≤'} ${limitTargetPrice || '0.00'}</span>
              <span className="text-[var(--primary)] font-semibold font-mono">Gasless</span>
            </div>
          </div>
        )}

        {/* Rate & Swap Details (Clean Uniswap Accordion) */}
        {tradeMode === 'swap' && parseFloat(amountIn || '0') > 0 && (
          <div className="my-2.5 px-1">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-1 font-mono text-[12px]">
                <span>1 {tokenIn.symbol} = {quote.executionPrice.toFixed(4)} {tokenOut.symbol}</span>
                <span className="text-[var(--text-tertiary)]">
                  (${(quote.executionPrice * (tokenOut.priceUSD || 1.0)).toFixed(2)})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                <Fuel className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>${quote.networkFeeUSD.toFixed(2)}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showDetails && (
              <div className="mt-2 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)]">Price Impact</span>
                  <span className="font-mono text-[var(--text-primary)]">{quote.priceImpact < 0.01 ? '<0.01%' : `${quote.priceImpact.toFixed(2)}%`}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)]">Max Slippage</span>
                  <span className="font-mono text-[var(--text-primary)]">{settings.slippageTolerance}%</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)]">Network Cost</span>
                  <span className="font-mono text-[var(--text-primary)]">~${quote.networkFeeUSD.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-tertiary)]">Order Routing</span>
                  <span className="font-mono text-[var(--primary)] font-medium">
                    {settings.routingProtocol === 'v4' ? 'Uniswap V4 Universal Router' : 'Uniswap V3'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Action Button (Swap vs Limit) */}
        {!isConnected ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setIsWalletModalOpen(true)}
            className="mt-2"
          >
            Connect Wallet
          </Button>
        ) : tradeMode === 'limit' ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!amountIn || parseFloat(amountIn) <= 0 || !limitTargetPrice || isSigningLimitOrder}
            onClick={handlePlaceLimitOrder}
            className="mt-2"
          >
            {isSigningLimitOrder ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing via Wallet...</span>
              </>
            ) : isLimitSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Limit Order Placed!</span>
              </>
            ) : (
              <span>Place Limit Order</span>
            )}
          </Button>
        ) : (
          <Button
            variant={isInsufficientBalance ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            disabled={!amountIn || parseFloat(amountIn) <= 0 || isInsufficientBalance}
            onClick={() => setIsReviewOpen(true)}
            className="mt-2"
          >
            {isInsufficientBalance
              ? `Insufficient ${tokenIn.symbol} balance`
              : !amountIn || parseFloat(amountIn) <= 0
              ? 'Enter an amount'
              : 'Swap'}
          </Button>
        )}
        </div>
      </div>

      {/* Render Active Limit Orders below the card when on Limit Mode */}
      {tradeMode === 'limit' && (
        <div className="w-full max-w-[480px] mx-auto mt-4">
          <LimitOrdersManager />
        </div>
      )}

      {/* Token Selector Modal */}
      <TokenSelectorModal
        isOpen={selectorTarget !== null}
        onClose={() => setSelectorTarget(null)}
        onSelectToken={handleSelectToken}
        selectedToken={selectorTarget === 'in' ? tokenIn : tokenOut}
      />

      {/* Trade Settings Modal */}
      <SwapSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Review Swap & Signature Modal */}
      <SwapReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        quote={quote}
        onSwapCompleted={() => {
          setAmountIn('');
        }}
      />

      {/* Fiat On-Ramp Modal */}
      <FiatOnRampModal
        isOpen={isFiatModalOpen}
        onClose={() => setIsFiatModalOpen(false)}
        defaultToken={tokenIn}
      />

      {/* Wallet Connection Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
};
