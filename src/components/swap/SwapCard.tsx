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
} from 'lucide-react';
import { motion } from 'motion/react';
import { uniswapV3Service, OnChainQuoteResult } from '../../services/uniswapV3Service';
import { LimitOrdersManager } from './LimitOrdersManager';
import { FiatOnRampModal } from '../common/FiatOnRampModal';
import { limitOrdersService } from '../../services/limitOrdersService';
import { tokenSecurityService } from '../../services/tokenSecurityService';

interface SwapCardProps {
  onToggleChart?: () => void;
  isChartOpen?: boolean;
  onTokensChanged?: (tokenIn: Token, tokenOut: Token) => void;
  onAmountInChanged?: (amount: string) => void;
  externalTokenIn?: Token;
  externalTokenOut?: Token;
  externalAmountIn?: string;
  onOpenSetAlertModal?: (tokenIn?: Token, tokenOut?: Token) => void;
}

export const SwapCard: React.FC<SwapCardProps> = ({
  onToggleChart,
  isChartOpen = false,
  onTokensChanged,
  onAmountInChanged,
  externalTokenIn,
  externalTokenOut,
  externalAmountIn,
  onOpenSetAlertModal,
}) => {
  const {
    isConnected,
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
    priceUSD: 3482.50,
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

  // Adapt native currency & pair tokens when selected chain changes
  useEffect(() => {
    if (!externalTokenIn) {
      const nativeSym = selectedChain.nativeCurrency.symbol;
      const nativeName = selectedChain.nativeCurrency.name;
      
      const matchingNative = tokens.find(
        (t) => t.symbol === nativeSym && (t.chainId === selectedChain.id || t.address === '0x0000000000000000000000000000000000000000')
      ) || {
        id: `${selectedChain.id}-${nativeSym.toLowerCase()}`,
        symbol: nativeSym,
        name: nativeName,
        decimals: selectedChain.nativeCurrency.decimals || 18,
        priceUSD: nativeSym === 'BNB' ? 645.0 : nativeSym === 'AVAX' ? 34.8 : nativeSym === 'POL' ? 0.52 : 3482.5,
        change24h: 2.5,
        volume24hUSD: 100000000,
        color: '#627EEA',
        iconUrl: selectedChain.icon,
        chainId: selectedChain.id,
      };

      setTokenIn(matchingNative);

      // Also adapt tokenOut to a token on the selected chain (e.g. USDC or USDT or popular DEX token)
      if (!externalTokenOut) {
        const chainTokens = tokens.filter((t) => t.chainId === selectedChain.id && t.symbol !== nativeSym);
        const matchingOut = chainTokens.find((t) => t.symbol === 'USDC') || chainTokens.find((t) => t.symbol === 'USDT') || chainTokens[0];
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
    const inPrice = tokenIn?.priceUSD ?? 3482.50;
    const outPrice = tokenOut?.priceUSD ?? 1.00;
    const mathRate = inPrice / Math.max(0.000001, outPrice);
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

  const userBalanceIn = isConnected ? getTokenBalance(tokenIn, selectedChain.id) : 0;
  const userBalanceOut = isConnected ? getTokenBalance(tokenOut, selectedChain.id) : 0;

  const isInsufficientBalance = isConnected && parseFloat(amountIn || '0') > userBalanceIn;

  const handleFlipTokens = () => {
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
      <div className="w-full max-w-[480px] mx-auto bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-card)] transition-all">
        {/* Header: Tab Switcher (Swap vs Limit vs Buy with Card), Chart toggle, Settings */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setTradeMode('swap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tradeMode === 'swap'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-sm'
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tradeMode === 'limit'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Limit</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                Gasless
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsFiatModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-tertiary)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
            >
              <CreditCard className="w-3 h-3 text-emerald-400" />
              <span>Buy</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleChart && (
              <button
                onClick={onToggleChart}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isChartOpen
                    ? 'bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/30'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'
                }`}
                title="Toggle Price Chart"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent transition-all cursor-pointer"
              title="Trade Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Network Mismatch Quick Sync Bar */}
        {isChainMismatch && detectedChainId && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                Wallet on <strong>{ALL_CHAINS.find(c => c.id === detectedChainId)?.shortName || `#${detectedChainId}`}</strong>
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
              <button
                type="button"
                onClick={() => syncAppWithWalletChain()}
                className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-amber-500/30 text-amber-200 font-semibold text-[11px] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                title="Switch app interface to match wallet"
              >
                Sync App
              </button>
            </div>
          </div>
        )}

        {/* Input: Token In Terminal */}
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] hover:border-[var(--border-strong)] focus-within:border-[var(--primary)]/60 rounded-xl p-3.5 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-2">
            <span>You Pay</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span>Balance:</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {userBalanceIn.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenIn.symbol}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-transparent font-mono text-2xl font-bold text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none"
              min="0"
              step="any"
            />

            <button
              onClick={() => setSelectorTarget('in')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--border-strong)] transition-all cursor-pointer shrink-0 shadow-xs"
            >
              <TokenIcon symbol={tokenIn.symbol} icon={tokenIn.icon} size="sm" />
              <span className="font-semibold text-sm text-[var(--text-primary)]">
                {tokenIn.symbol}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
            <span className="text-[var(--text-tertiary)] font-mono">
              ≈ ${(parseFloat(amountIn || '0') * tokenIn.priceUSD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>

            {/* Percentage shortcuts */}
            <div className="flex items-center gap-1">
              {[
                { label: '25%', val: 0.25 },
                { label: '50%', val: 0.5 },
                { label: 'MAX', val: 1.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePercentInput(p.val)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Flip Token Trigger Button */}
        <div className="flex justify-center -my-3 relative z-10">
          <motion.button
            onClick={handleFlipTokens}
            animate={{ rotate: isFlipping ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-9 h-9 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center justify-center shadow-md transition-colors cursor-pointer"
            title="Invert swap direction"
          >
            <ArrowDownUp className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Input: Token Out Terminal */}
        <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] hover:border-[var(--border-strong)] rounded-xl p-3.5 transition-all">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-2">
            <span>You Receive (Estimated)</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span>Balance:</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {userBalanceOut.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenOut.symbol}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="w-full font-mono text-2xl font-bold text-[var(--primary)] select-all truncate flex items-center gap-2">
              {isQuoting ? (
                <span className="text-sm font-sans font-medium text-[var(--text-tertiary)] flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span>Fetching QuoterV2 route...</span>
                </span>
              ) : (
                quote.amountOut
              )}
            </div>

            <button
              onClick={() => setSelectorTarget('out')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--border-strong)] transition-all cursor-pointer shrink-0 shadow-xs"
            >
              <TokenIcon symbol={tokenOut.symbol} icon={tokenOut.icon} size="sm" />
              <span className="font-semibold text-sm text-[var(--text-primary)]">
                {tokenOut.symbol}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
            <span className="text-[var(--text-tertiary)] font-mono">
              ≈ ${(parseFloat(quote.amountOut || '0') * tokenOut.priceUSD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* LIMIT ORDER CONTROLS (Only visible in Limit Mode) */}
        {tradeMode === 'limit' && (
          <div className="mb-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2.5">
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
              <span className="text-indigo-400 font-semibold font-mono">0 Gas Cost (UniswapX)</span>
            </div>
          </div>
        )}

        {/* Live Rate & Details Summary (Swap Mode) */}
        {tradeMode === 'swap' && (
          <div className="my-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-tertiary)]">Rate</span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  1 {tokenIn.symbol} = {quote.executionPrice.toFixed(4)} {tokenOut.symbol}
                </span>
              </div>
              {onOpenSetAlertModal && (
                <button
                  type="button"
                  onClick={() => onOpenSetAlertModal(tokenIn, tokenOut)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:underline cursor-pointer transition-colors"
                  title="Set a price alert notification for this pair"
                >
                  <Target className="w-3 h-3" />
                  <span>Target Alert</span>
                </button>
              )}
            </div>

            {/* Smart Routing Visualizer Component */}
            <RoutingVisualizer quote={quote} />
          </div>
        )}

        {/* Warning if balance is insufficient */}
        {isInsufficientBalance && (
          <div className="mb-3 p-2.5 rounded-xl bg-[var(--error-subtle)] border border-[var(--error)]/30 flex items-center gap-2 text-xs text-[var(--error)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Insufficient {tokenIn.symbol} balance for this swap.</span>
          </div>
        )}

        {/* Primary Action Button (Swap vs Limit) */}
        {!isConnected ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setIsWalletModalOpen(true)}
            className="mt-1"
          >
            Connect Wallet
          </Button>
        ) : tradeMode === 'limit' ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!amountIn || parseFloat(amountIn) <= 0 || !limitTargetPrice}
            onClick={() => {
              const targetNum = parseFloat(limitTargetPrice) || (tokenIn.priceUSD * 1.05);
              const estOut = (parseFloat(amountIn) * targetNum).toFixed(2);
              limitOrdersService.createLimitOrder({
                userAddress: '0x38D6F3921B5D343b67Ce847c2F1e5D6bE4929810',
                chainId: selectedChain.id,
                tokenIn,
                tokenOut,
                amountIn,
                minAmountOut: estOut,
                targetPrice: targetNum,
                currentPriceAtCreation: tokenIn.priceUSD || 2424.65,
                condition: limitCondition,
                expiresAt: limitExpiryDays > 0 ? Date.now() + limitExpiryDays * 86400000 : 0,
              });
              setIsLimitSuccess(true);
              setTimeout(() => setIsLimitSuccess(false), 3000);
            }}
            className="mt-1 bg-indigo-500 hover:bg-indigo-400 text-white font-bold gap-2"
          >
            {isLimitSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Limit Order Placed Gaslessly!</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Sign Gasless Limit Order (EIP-712)</span>
              </>
            )}
          </Button>
        ) : (
          <Button
            variant={isInsufficientBalance ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            disabled={!amountIn || parseFloat(amountIn) <= 0 || isInsufficientBalance}
            onClick={() => setIsReviewOpen(true)}
            className="mt-1"
          >
            {isInsufficientBalance
              ? `Insufficient ${tokenIn.symbol} Balance`
              : !amountIn || parseFloat(amountIn) <= 0
              ? 'Enter an Amount'
              : 'Review Swap'}
          </Button>
        )}
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
