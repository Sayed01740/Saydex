import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Token, SwapQuote } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { calculateTradeRoutes } from '../../utils/routing';
import { TokenIcon } from '../common/TokenIcon';
import { getTokensForChain } from '../../data/uniswapTokens';
import { PROTOCOL_CONTRACTS, NATIVE_TOKEN_PRICES_USD, getQuoterV2Address } from '../../config/chains';
import { useReadContract } from 'wagmi';
import { encodeFunctionData, parseEther, pad } from 'viem';
import { Button } from '../common/Button';
import { TokenSelectorModal } from './TokenSelectorModal';
import { SwapSettingsModal } from './SwapSettingsModal';
import { RoutingVisualizer } from './RoutingVisualizer';
import { SwapReviewModal } from './SwapReviewModal';
import {
  ArrowDownUp,
  ChevronDown,
  SlidersHorizontal,
  Info,
  Sparkles,
  BarChart2,
  ShieldCheck,
  AlertTriangle,
  Target,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';

const QUOTER_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenIn', type: 'address' },
      { internalType: 'address', name: 'tokenOut', type: 'address' },
      { internalType: 'uint24', name: 'fee', type: 'uint24' },
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint160', name: 'sqrtPriceLimitX96', type: 'uint160' },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
      { internalType: 'uint160', name: 'sqrtPriceX96After', type: 'uint160' },
      { internalType: 'uint32', name: 'initializedTicksCrossed', type: 'uint32' },
      { internalType: 'uint256', name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'payable', // quoteExactInputSingle reverts with output data — use staticcall via useReadContract
    type: 'function',
  },
] as const;

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
  const { isConnected, nativeBalance, usdcBalance, walletChainId, switchChain, walletState, selectedChain } = useWallet();
  const { tokens, settings } = useProtocol();

  const activeChainId = walletChainId ?? selectedChain?.id ?? 1;
  const activeTokens = useMemo(() => getTokensForChain(activeChainId), [activeChainId]);

  const [tokenIn, setTokenIn] = useState<Token>(() => externalTokenIn || activeTokens[0]);
  const [tokenOut, setTokenOut] = useState<Token>(() => externalTokenOut || activeTokens[1]);
  const [amountIn, setAmountIn] = useState<string>(() => externalAmountIn || '1.0');

  // Keep tokens synced to active chain (RC-56 fix)
  useEffect(() => {
    const defaultIn = activeTokens.find((t) => t.category === 'native') || activeTokens[0];
    const defaultOut = activeTokens.find((t) => t.symbol === 'USDC' && t.address !== defaultIn.address) || activeTokens[1];

    setTokenIn((prev) => {
      if (prev.chainId === activeChainId) return prev;
      return activeTokens.find((t) => t.symbol === prev.symbol) || defaultIn;
    });

    setTokenOut((prev) => {
      if (prev.chainId === activeChainId) return prev;
      return activeTokens.find((t) => t.symbol === prev.symbol && t.address !== defaultIn.address) || defaultOut;
    });
  }, [activeChainId, activeTokens]);

  // Sync when external tokens change
  useEffect(() => {
    if (externalTokenIn && externalTokenIn.address !== tokenIn.address) {
      setTokenIn(externalTokenIn);
    }
  }, [externalTokenIn]);

  useEffect(() => {
    if (externalTokenOut && externalTokenOut.address !== tokenOut.address) {
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
  const [isFlipping, setIsFlipping] = useState(false);

  // Parse amount in to BigInt
  const parsedAmountInBigInt = useMemo(() => {
    if (!amountIn || isNaN(Number(amountIn))) return 0n;
    return BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)));
  }, [amountIn, tokenIn.decimals]);

  // Fetch actual on-chain quote
  const { data: quoteData, isLoading: isQuoteLoading } = useReadContract({
    address: getQuoterV2Address(activeChainId),
    abi: QUOTER_ABI,
    functionName: 'quoteExactInputSingle',
    args: [
      (tokenIn.address || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      (tokenOut.address || '0x0000000000000000000000000000000000000000') as `0x${string}`,
      500, // 0.05% fee tier
      parsedAmountInBigInt,
      0n, // sqrtPriceLimitX96
    ],
    chainId: activeChainId,
    query: {
      enabled: parsedAmountInBigInt > 0n && !!tokenIn.address && !!tokenOut.address,
      refetchInterval: 12000,
    }
  });

  // Calculate live output quote
  const quote: SwapQuote = useMemo(() => {
    const parsedAmount = parseFloat(amountIn) || 0;
    
    // Fallback if quote fails or is loading
    let calculatedOut = 0;
    if (quoteData && typeof quoteData[0] === 'bigint') {
      calculatedOut = Number(quoteData[0]) / Math.pow(10, tokenOut.decimals);
    } else {
      const inPrice = tokenIn?.priceUSD ?? NATIVE_TOKEN_PRICES_USD.ETH;
      const outPrice = tokenOut?.priceUSD ?? 1.00;
      const rate = inPrice / Math.max(0.000001, outPrice);
      calculatedOut = parsedAmount * rate;
    }
    
    const rate = parsedAmount > 0 ? calculatedOut / parsedAmount : 0;
    const slippageMultiplier = (100 - settings.slippageTolerance) / 100;
    const minOut = calculatedOut * slippageMultiplier;

    const routes = calculateTradeRoutes(tokenIn, tokenOut, amountIn, settings.slippageTolerance, 'smart_split');
    const selectedRoute = routes[0];

    return {
      // RC-7: chainId binds this quote to the current wallet chain
      // Before execution, verify quote.chainId === walletChainId
      chainId: walletChainId ?? tokenIn.chainId ?? 1,
      tokenIn,
      tokenOut,
      amountIn: amountIn || '0',
      amountOut: calculatedOut > 0 ? (calculatedOut > 1 ? calculatedOut.toFixed(4) : calculatedOut.toFixed(6)) : '0.00',
      amountOutMin: minOut > 0 ? (minOut > 1 ? minOut.toFixed(4) : minOut.toFixed(6)) : '0.00',
      executionPrice: rate,
      priceImpact: selectedRoute ? selectedRoute.priceImpact : 0.01,
      networkFeeUSD: selectedRoute ? selectedRoute.gasCostUSD : 1.45,
      routeHops: selectedRoute ? selectedRoute.routeHops : [
        {
          protocol: 'Axiom Concentrated v3',
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          percentage: 70,
          fromToken: tokenIn?.symbol || 'ETH',
          toToken: tokenOut?.symbol || 'USDC',
          feeTier: '0.05%',
        },
      ],
      calldataHex: (() => {
        try {
          // Build a real V3_SWAP_EXACT_IN calldata for the Universal Router
          const UNIVERSAL_ROUTER_ABI = [{
            name: 'execute',
            type: 'function',
            stateMutability: 'payable',
            inputs: [
              { name: 'commands', type: 'bytes' },
              { name: 'inputs', type: 'bytes[]' },
              { name: 'deadline', type: 'uint256' },
            ],
          }] as const;

          const tokenInAddr = (tokenIn?.address || '0x0000000000000000000000000000000000000000') as `0x${string}`;
          const tokenOutAddr = (tokenOut?.address || '0x0000000000000000000000000000000000000000') as `0x${string}`;
          const isNativeIn = tokenInAddr === '0x0000000000000000000000000000000000000000';
          const deadline = BigInt(Math.floor(Date.now() / 1000) + (settings.deadlineMinutes || 20) * 60);

          // Commands: WRAP_ETH (0x03) + V3_SWAP_EXACT_IN (0x00) for native, or V3_SWAP_EXACT_IN (0x00) for ERC20
          const commands = isNativeIn ? '0x0300' : '0x00';

          const swapPath = `0x${tokenInAddr.slice(2)}0001f4${tokenOutAddr.slice(2)}`;
          // BigInt math: amountOutMin = parsedAmountIn * (10000 - slippageBps) / 10000
          const slippageBps = BigInt(Math.floor((settings.slippageTolerance || 0.5) * 100));
          const amountOutMin = (parsedAmountInBigInt * (10000n - slippageBps)) / 10000n;

          // Build swap input: recipient (0x01 = MSG_SENDER), amountIn, amountOutMin, path, payerIsUser
          const swapInput = `0x0000000000000000000000000000000000000000000000000000000000000001${parsedAmountInBigInt.toString(16).padStart(64, '0')}${amountOutMin.toString(16).padStart(64, '0')}${swapPath.slice(2).padEnd(128, '0')}${isNativeIn ? '00' : '01'}`;

          const inputs = isNativeIn
            ? [
                // WRAP_ETH input: recipient (0x02 = ROUTER), amountMin (0 = use msg.value)
                `0x00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000`,
                swapInput,
              ]
            : [swapInput];

          return encodeFunctionData({
            abi: UNIVERSAL_ROUTER_ABI,
            functionName: 'execute',
            args: [commands as `0x${string}`, inputs as `0x${string}`[], deadline],
          });
        } catch {
          // Fallback: minimal valid calldata (will likely revert but prevents crash)
          return '0x';
        }
      })(),
      guaranteedUntil: Date.now() + 30000,
      mevProtected: settings.mevProtection,
    };
  }, [tokenIn, tokenOut, amountIn, settings, walletChainId, quoteData]);

  // RC-2: userBalanceIn now uses nativeBalance (chain-specific) not a stale ethBalance
  const userBalanceIn =
    tokenIn.address === '0x0000000000000000000000000000000000000000'
      ? nativeBalance
      : tokenIn.symbol === 'USDC'
      ? usdcBalance
      : tokenIn.balance || 0;

  // RC-28: Detect chain mismatch — token belongs to a different chain than wallet
  const tokenChainMismatch = isConnected &&
    walletChainId !== null &&
    tokenIn.chainId !== walletChainId;

  const isInsufficientBalance = isConnected && !tokenChainMismatch && parseFloat(amountIn || '0') > userBalanceIn;

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

  // RC-6: Token identity uses address + chainId — never symbol alone
  const handleSelectToken = (selected: Token) => {
    const isSameAsOut =
      selected.address.toLowerCase() === tokenOut.address.toLowerCase() &&
      selected.chainId === tokenOut.chainId;
    const isSameAsIn =
      selected.address.toLowerCase() === tokenIn.address.toLowerCase() &&
      selected.chainId === tokenIn.chainId;

    if (selectorTarget === 'in') {
      if (isSameAsOut) setTokenOut(tokenIn); // swap them
      setTokenIn(selected);
      if (onTokensChanged) onTokensChanged(selected, isSameAsOut ? tokenIn : tokenOut);
    } else if (selectorTarget === 'out') {
      if (isSameAsIn) setTokenIn(tokenOut); // swap them
      setTokenOut(selected);
      if (onTokensChanged) onTokensChanged(isSameAsIn ? tokenOut : tokenIn, selected);
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
        {/* Header: Title, Chart toggle, Settings */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
              Swap
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold border border-[var(--primary)]/20">
              Zero MEV
            </span>
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
                {(tokenOut.symbol === 'USDC' ? usdcBalance : tokenOut.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenOut.symbol}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="w-full font-mono text-2xl font-bold text-[var(--primary)] select-all truncate">
              {isQuoteLoading ? 'Fetching Quote...' : quote.amountOut}
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
            <span className="text-[11px] font-mono text-[var(--success)]">
              Best Protocol Route
            </span>
          </div>
        </div>

        {/* Live Rate & Details Summary */}
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

        {/* Chain mismatch warning (RC-28/54) */}
        {tokenChainMismatch && (
          <div className="mb-3 p-2.5 rounded-xl bg-[var(--warning-subtle,var(--bg-subtle))] border border-amber-500/30 flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Selected tokens are on a different network than your wallet.
              Switch your wallet network to continue.
            </span>
          </div>
        )}

        {/* Insufficient balance warning */}
        {isInsufficientBalance && !tokenChainMismatch && (
          <div className="mb-3 p-2.5 rounded-xl bg-[var(--error-subtle)] border border-[var(--error)]/30 flex items-center gap-2 text-xs text-[var(--error)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Insufficient {tokenIn.symbol} balance for this swap.</span>
          </div>
        )}

        {/* Primary Swap Action Button */}
        {tokenChainMismatch && isConnected ? (
          // RC-13/31: Must switch wallet chain before executing — never fake a chain
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => tokenIn.chainId && switchChain(tokenIn.chainId)}
            className="mt-1"
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Switch Wallet to {tokenIn.chainId === 8453 ? 'Base' : tokenIn.chainId === 42161 ? 'Arbitrum' : 'Correct Network'}
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
    </>
  );
};
