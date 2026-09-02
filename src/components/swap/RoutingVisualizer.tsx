import React, { useState } from 'react';
import { SwapQuote } from '../../types';
import { useProtocol } from '../../context/ProtocolContext';
import { GitBranch, ShieldCheck, ChevronDown, ChevronUp, Copy, Check, Terminal, ArrowRight, Layers } from 'lucide-react';

interface RoutingVisualizerProps {
  quote: SwapQuote;
}

export const RoutingVisualizer: React.FC<RoutingVisualizerProps> = ({ quote }) => {
  const { settings } = useProtocol();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCalldata, setCopiedCalldata] = useState(false);

  const handleCopyCalldata = () => {
    navigator.clipboard.writeText(quote.calldataHex);
    setCopiedCalldata(true);
    setTimeout(() => setCopiedCalldata(false), 2000);
  };

  const isMultiHop = quote.routeHops.some((h) => (h.intermediateTokens && h.intermediateTokens.length > 0) || (h.hopSteps && h.hopSteps.length > 1));

  return (
    <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl p-3 text-xs transition-all">
      {/* Summary Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[var(--primary-subtle)] text-[var(--primary)]">
            <GitBranch className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[var(--text-primary)]">
                Saydex Smart Router
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20">
                {isMultiHop ? 'Multi-Hop' : 'Split Path'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--success)] font-medium flex items-center gap-1">
              <span>Optimal 0.01% Price Impact</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            ~${quote.networkFeeUSD.toFixed(2)} Gas
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
          )}
        </div>
      </div>

      {/* Expanded Route Graph & Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-3">
          {/* Visual Route Splitting Diagram */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-secondary)]">
              <span>Routing Execution Graph:</span>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                {quote.tokenIn.symbol} ➔ {quote.tokenOut.symbol}
              </span>
            </div>

            <div className="space-y-1.5">
              {quote.routeHops.map((hop, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] font-mono text-[11px] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--primary-subtle)] text-[var(--primary)] font-bold text-[10px]">
                        {hop.percentage}%
                      </span>
                      <span className="text-[var(--text-primary)] font-semibold">
                        {hop.protocol}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)] text-[10px] border border-[var(--border-subtle)]">
                      {hop.feeTier}
                    </span>
                  </div>

                  {/* Visual Hop Steps */}
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] pt-0.5">
                    <span className="font-bold text-[var(--text-primary)]">{hop.fromToken}</span>
                    {hop.intermediateTokens && hop.intermediateTokens.length > 0 ? (
                      <>
                        <ArrowRight className="w-3 h-3 text-[var(--primary)]" />
                        <span className="px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-app)] text-[var(--text-primary)] font-bold">
                          {hop.intermediateTokens.join(' ➔ ')}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[var(--primary)]" />
                      </>
                    ) : (
                      <ArrowRight className="w-3 h-3 text-[var(--primary)]" />
                    )}
                    <span className="font-bold text-[var(--text-primary)]">{hop.toToken}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metric details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)] pt-1">
            <div>
              <span className="text-[var(--text-tertiary)]">Minimum Received:</span>
              <p className="font-mono text-[var(--text-primary)] font-medium">
                {quote.amountOutMin} {quote.tokenOut.symbol}
              </p>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Slippage Tolerance:</span>
              <p className="font-mono text-[var(--text-primary)] font-medium">
                {settings.slippageTolerance}%
              </p>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Routing Engine:</span>
              <p className="text-[var(--primary)] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>MEV Protected</span>
              </p>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Guaranteed:</span>
              <p className="font-mono text-[var(--text-primary)] font-medium">
                30s Dynamic Block Window
              </p>
            </div>
          </div>

          {/* Calldata Hex for Developer / Advanced Mode */}
          {settings.advancedMode && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-[var(--primary)]" />
                  <span>Encoded Calldata Hex:</span>
                </span>
                <button
                  onClick={handleCopyCalldata}
                  className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {copiedCalldata ? (
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
              <div className="p-2 rounded bg-black/50 border border-[var(--border-app)] text-[10px] font-mono text-[var(--text-tertiary)] break-all max-h-16 overflow-y-auto">
                {quote.calldataHex}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
