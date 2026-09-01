import React, { useState, useMemo } from 'react';
import { Token } from '../../types';
import { useProtocol } from '../../context/ProtocolContext';
import { TokenIcon } from '../common/TokenIcon';
import { calculateTradeRoutes, RouteStrategy, CalculatedRoute } from '../../utils/routing';
import {
  GitBranch,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronRight,
  Info,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  DollarSign,
  Fuel,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TradeRouteVisualizerProps {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  onOpenSettings?: () => void;
  className?: string;
}

export const TradeRouteVisualizer: React.FC<TradeRouteVisualizerProps> = ({
  tokenIn,
  tokenOut,
  amountIn,
  onOpenSettings,
  className = '',
}) => {
  const { settings } = useProtocol();
  const [selectedStrategy, setSelectedStrategy] = useState<RouteStrategy>('smart_split');
  const [selectedHopIndex, setSelectedHopIndex] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showRawCalldata, setShowRawCalldata] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Calculate available routes
  const availableRoutes = useMemo(() => {
    return calculateTradeRoutes(
      tokenIn,
      tokenOut,
      amountIn,
      settings.slippageTolerance,
      selectedStrategy
    );
  }, [tokenIn, tokenOut, amountIn, settings.slippageTolerance, selectedStrategy]);

  // Active chosen route
  const activeRoute = useMemo(() => {
    return (
      availableRoutes.find((r) => r.strategy === selectedStrategy) || availableRoutes[0]
    );
  }, [availableRoutes, selectedStrategy]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(id);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const parsedAmountIn = parseFloat(amountIn) || 0;
  const inUsdValue = parsedAmountIn * (tokenIn.priceUSD || 1);
  const outUsdValue = activeRoute.expectedOutput * (tokenOut.priceUSD || 1);

  return (
    <div
      id="trade-route-path-indicator"
      className={`w-full bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-app)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Trade Routing Path
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20">
                <Sparkles className="w-3 h-3" />
                {activeRoute.isMultiHop ? 'Multi-Hop Split' : 'Direct Single-Hop'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Live visualization of automated liquidity routing and DEX split paths for maximum output.
            </p>
          </div>
        </div>

        {/* Strategy Selector Tabs */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-1 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-app)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedStrategy('smart_split')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStrategy === 'smart_split'
                  ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-xs font-bold'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Split</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStrategy('direct')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStrategy === 'direct'
                  ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-xs font-bold'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Direct Hop</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStrategy('mev_shield')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStrategy === 'mev_shield'
                  ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-xs font-bold'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>MEV Shield</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={isCompact ? 'Expand Visual Diagram' : 'Compact View'}
          >
            {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary Visual Routing Schematic Diagram */}
      <div className="p-4 sm:p-6 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-subtle)]/40">
        <div className="max-w-4xl mx-auto">
          {/* Main Visual Flow Graph */}
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            {/* 1. Source Token Node */}
            <motion.div
              layout
              className="w-full md:w-56 p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--primary)]/40 shadow-xs relative shrink-0 z-10 flex flex-col items-center text-center"
            >
              <div className="absolute -top-2.5 px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-[#090B0E] text-[10px] font-bold tracking-wider uppercase">
                Input Source
              </div>

              <div className="relative mt-1">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] flex items-center justify-center shadow-xs">
                  <TokenIcon symbol={tokenIn.symbol} icon={tokenIn.icon} size="lg" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--success)] border-2 border-[var(--bg-surface)]" />
              </div>

              <div className="mt-2.5">
                <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                  {parsedAmountIn > 0 ? parsedAmountIn.toLocaleString() : '0.00'} {tokenIn.symbol}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] font-mono">
                  ≈ ${inUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] w-full text-[11px] text-[var(--text-secondary)] font-mono flex items-center justify-between">
                <span>Network:</span>
                <span className="text-[var(--text-primary)] font-semibold">Ethereum</span>
              </div>
            </motion.div>

            {/* 2. Routing Pathways / Connector Network */}
            <div className="flex-1 w-full flex flex-col justify-center gap-3 relative py-2 px-1 sm:px-3 min-w-0">
              {/* Animated Connection Arrow Lines */}
              <div className="space-y-3">
                {activeRoute.routeHops.map((hop, hopIdx) => {
                  const isSelected = selectedHopIndex === hopIdx;
                  return (
                    <motion.div
                      key={hopIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: hopIdx * 0.08 }}
                      onClick={() => setSelectedHopIndex(isSelected ? null : hopIdx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'bg-[var(--primary-subtle)] border-[var(--primary)] shadow-xs'
                          : 'bg-[var(--bg-surface)] border-[var(--border-app)] hover:border-[var(--border-strong)] hover:shadow-2xs'
                      }`}
                    >
                      {/* Split Percentage Progress Track */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                              hop.percentage === 100
                                ? 'bg-[var(--primary)] text-[#090B0E]'
                                : 'bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/30'
                            }`}
                          >
                            {hop.percentage}% of Trade
                          </span>
                          <span className="font-semibold text-[var(--text-primary)] truncate">
                            {hop.protocol}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            Fee {hop.feeTier}
                          </span>
                        </div>
                      </div>

                      {/* Path Hops Chain Representation */}
                      <div className="flex items-center justify-between gap-1 p-2 rounded-lg bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] font-mono text-xs">
                        {/* Start */}
                        <div className="flex items-center gap-1 shrink-0 font-bold text-[var(--text-primary)]">
                          <span>{tokenIn.symbol}</span>
                        </div>

                        {/* Middle steps / Intermediary tokens */}
                        {hop.intermediateTokens && hop.intermediateTokens.length > 0 ? (
                          <>
                            <div className="flex items-center gap-1 text-[var(--primary)]">
                              <span className="w-3 h-0.5 bg-[var(--primary)]" />
                              <ArrowRight className="w-3 h-3" />
                            </div>

                            {hop.intermediateTokens.map((interToken, iIdx) => (
                              <div
                                key={iIdx}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[var(--text-primary)] font-semibold shadow-2xs"
                              >
                                <span className="text-[10px] text-[var(--text-tertiary)] mr-0.5">
                                  Hop:
                                </span>
                                <span>{interToken}</span>
                              </div>
                            ))}

                            <div className="flex items-center gap-1 text-[var(--primary)]">
                              <span className="w-3 h-0.5 bg-[var(--primary)]" />
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[var(--primary)] px-2">
                            <span className="w-6 h-0.5 bg-[var(--primary)]/60" />
                            <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                            <span className="w-6 h-0.5 bg-[var(--primary)]/60" />
                          </div>
                        )}

                        {/* End */}
                        <div className="flex items-center gap-1 shrink-0 font-bold text-[var(--text-primary)]">
                          <span>{tokenOut.symbol}</span>
                        </div>
                      </div>

                      {/* Liquidity and Pool Details */}
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[var(--primary)]" />
                          <span>Pool Depth: {hop.poolLiquidityUSD || '$340M+'}</span>
                        </span>
                        <span className="text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors">
                          {isSelected ? 'Hide Details ▲' : 'Inspect Pool ▼'}
                        </span>
                      </div>

                      {/* Expanded Hop Inspector Details */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] space-y-2 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-tertiary)]">Pool Contract:</span>
                            <div className="flex items-center gap-1 font-mono text-[var(--text-primary)]">
                              <span>
                                {hop.poolAddress.slice(0, 8)}...{hop.poolAddress.slice(-6)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(hop.poolAddress, `hop-${hopIdx}`);
                                }}
                                className="p-1 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                title="Copy contract address"
                              >
                                {copiedAddress === `hop-${hopIdx}` ? (
                                  <Check className="w-3 h-3 text-[var(--success)]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          {hop.hopSteps && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[var(--text-tertiary)] font-medium">
                                Atomic Execution Steps:
                              </span>
                              {hop.hopSteps.map((step, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-1.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] flex items-center justify-between font-mono text-[10px]"
                                >
                                  <span className="text-[var(--text-primary)] font-semibold">
                                    Step {sIdx + 1}: {step.fromToken} ➔ {step.toToken}
                                  </span>
                                  <span className="text-[var(--primary)]">{step.protocol}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 3. Destination Token Node */}
            <motion.div
              layout
              className="w-full md:w-56 p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--success)]/40 shadow-xs relative shrink-0 z-10 flex flex-col items-center text-center"
            >
              <div className="absolute -top-2.5 px-2.5 py-0.5 rounded-full bg-[var(--success)] text-[#090B0E] text-[10px] font-bold tracking-wider uppercase">
                Expected Output
              </div>

              <div className="relative mt-1">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] flex items-center justify-center shadow-xs">
                  <TokenIcon symbol={tokenOut.symbol} icon={tokenOut.icon} size="lg" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--success)] border-2 border-[var(--bg-surface)]" />
              </div>

              <div className="mt-2.5">
                <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                  {activeRoute.expectedOutput > 0
                    ? activeRoute.expectedOutput > 1
                      ? activeRoute.expectedOutput.toLocaleString(undefined, { maximumFractionDigits: 4 })
                      : activeRoute.expectedOutput.toFixed(6)
                    : '0.00'}{' '}
                  {tokenOut.symbol}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] font-mono">
                  ≈ ${outUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] w-full text-[11px] text-[var(--text-secondary)] font-mono flex items-center justify-between">
                <span>Min. Received:</span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {activeRoute.minimumOutput > 0
                    ? activeRoute.minimumOutput > 1
                      ? activeRoute.minimumOutput.toFixed(4)
                      : activeRoute.minimumOutput.toFixed(6)
                    : '0.00'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Transparency & Execution Guarantees Bar */}
      <div className="p-4 bg-[var(--bg-subtle)] border-t border-[var(--border-app)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-xs font-mono">
          {/* Metric 1 */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 font-sans">
              <Zap className="w-3 h-3 text-[var(--primary)]" />
              <span>Price Impact</span>
            </div>
            <div className="text-sm font-bold text-[var(--success)] mt-0.5">
              &lt; {activeRoute.priceImpact}%
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 font-sans">
              <Fuel className="w-3 h-3 text-[var(--primary)]" />
              <span>Network Gas</span>
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
              ~${activeRoute.gasCostUSD.toFixed(2)}
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 font-sans">
              <ShieldCheck className="w-3 h-3 text-[var(--primary)]" />
              <span>Routing Protocol</span>
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)] truncate mt-0.5">
              {activeRoute.solverProtocol}
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 font-sans">
              <Sliders className="w-3 h-3 text-[var(--primary)]" />
              <span>Max Slippage</span>
            </div>
            <div className="text-sm font-bold text-[var(--primary)] mt-0.5 flex items-center justify-between">
              <span>{settings.slippageTolerance}%</span>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-[10px] underline hover:text-[var(--text-primary)] cursor-pointer font-sans"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Developer / Raw Calldata Toggle */}
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[var(--text-tertiary)] gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>
              All atomic swap hops are validated by the Axiom On-Chain Settlement Router.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowRawCalldata(!showRawCalldata)}
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer font-mono"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showRawCalldata ? 'Hide Calldata' : 'View Calldata Hex'}</span>
          </button>
        </div>

        {/* Encoded Calldata Drawer */}
        {showRawCalldata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 rounded-xl bg-black/60 border border-[var(--border-app)] text-[10px] font-mono text-[var(--text-secondary)] space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span className="font-semibold text-[var(--primary)]">Router Calldata Payload:</span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `0x5ae401dc000000000000000000000000${(tokenIn.address || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2').replace('0x', '')}000000000000000000000000${(tokenOut.address || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48').replace('0x', '')}`,
                    'calldata'
                  )
                }
                className="flex items-center gap-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {copiedAddress === 'calldata' ? (
                  <>
                    <Check className="w-3 h-3 text-[var(--success)]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Hex</span>
                  </>
                )}
              </button>
            </div>
            <div className="break-all text-[var(--text-tertiary)]">
              0x5ae401dc000000000000000000000000{(tokenIn.address || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2').replace('0x', '')}000000000000000000000000{(tokenOut.address || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48').replace('0x', '')}0000000000000000000000000000000000000000000000000de0b6b3a7640000
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
