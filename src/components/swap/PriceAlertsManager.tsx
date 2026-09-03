import React, { useState, useMemo } from 'react';
import { PriceAlert, Token } from '../../types';
import { useProtocol } from '../../context/ProtocolContext';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import {
  Bell,
  Target,
  Zap,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PriceAlertsManagerProps {
  onOpenSetAlertModal: (inTok?: Token, outTok?: Token) => void;
  onSelectPair?: (tokenInSymbol: string, tokenOutSymbol: string) => void;
}

export const PriceAlertsManager: React.FC<PriceAlertsManagerProps> = ({
  onOpenSetAlertModal,
  onSelectPair,
}) => {
  const { priceAlerts, tokens, removePriceAlert, simulatePriceAlertTrigger } = useProtocol();
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredAlerts = useMemo(() => {
    return priceAlerts.filter((alert) => {
      if (filter === 'active') return alert.status === 'active';
      if (filter === 'triggered') return alert.status === 'triggered';
      return true;
    });
  }, [priceAlerts, filter]);

  const activeCount = useMemo(() => {
    return priceAlerts.filter((a) => a.status === 'active').length;
  }, [priceAlerts]);

  // Helper to find current exchange rate for a given alert
  const getCurrentRate = (inSymbol: string, outSymbol: string) => {
    const inTok = tokens.find((t) => t.symbol.toUpperCase() === inSymbol.toUpperCase());
    const outTok = tokens.find((t) => t.symbol.toUpperCase() === outSymbol.toUpperCase());
    const pIn = inTok?.priceUSD || 1;
    const pOut = outTok?.priceUSD || 1;
    return pIn / Math.max(0.000001, pOut);
  };

  const getToken = (symbol: string) => {
    return tokens.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
  };

  return (
    <div id="price-alerts-manager" className="w-full bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Clickable Header for Collapsible / Minimize */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--bg-subtle)]/40 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Target Price Alerts
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                {activeCount} Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 hidden sm:block">
              Automated notifications when pairs reach your target price.
            </p>
          </div>
        </div>

        {/* Action Controls & Dropdown Chevron */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSetAlertModal();
            }}
            className="gap-1.5 shadow-xs shrink-0 whitespace-nowrap text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Alert</span>
          </Button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            title={isExpanded ? 'Minimize / Collapse' : 'Expand / Open'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsible Content Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-[var(--border-app)]"
          >
            {/* Filter Sub-bar */}
            <div className="px-4 sm:px-5 py-3 bg-[var(--bg-subtle)]/50 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-app)] text-xs font-semibold">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  All ({priceAlerts.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filter === 'active'
                      ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-xs'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setFilter('triggered')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filter === 'triggered'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Triggered
                </button>
              </div>

              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
              </span>
            </div>

      {/* Alerts Grid / List */}
      <div className="p-4 sm:p-5">
        {filteredAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <AnimatePresence>
              {filteredAlerts.map((alert) => {
                const inTok = getToken(alert.tokenInSymbol);
                const outTok = getToken(alert.tokenOutSymbol);
                const currentRate = getCurrentRate(alert.tokenInSymbol, alert.tokenOutSymbol);
                const diffPct = ((alert.targetPrice - currentRate) / currentRate) * 100;
                const isTriggered = alert.status === 'triggered';

                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl border bg-[var(--bg-surface-elevated)] border-[var(--border-app)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
                  >
                    {/* Top Row: Pair & Status */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            <TokenIcon
                              symbol={alert.tokenInSymbol}
                              icon={inTok?.icon}
                              size="sm"
                              className="border border-[var(--bg-surface)]"
                            />
                            <TokenIcon
                              symbol={alert.tokenOutSymbol}
                              icon={outTok?.icon}
                              size="sm"
                              className="border border-[var(--bg-surface)]"
                            />
                          </div>
                          <span className="font-bold text-sm text-[var(--text-primary)]">
                            {alert.tokenInSymbol} / {alert.tokenOutSymbol}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                            isTriggered
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : 'bg-[var(--bg-subtle)] text-[var(--primary)] border border-[var(--primary)]/20'
                          }`}
                        >
                          {isTriggered ? 'Triggered' : 'Active'}
                        </span>
                      </div>

                      {/* Note if available */}
                      {alert.note && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-1.5 line-clamp-1 italic">
                          "{alert.note}"
                        </p>
                      )}
                    </div>

                    {/* Middle: Target Price & Current Price */}
                    <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-tertiary)]">Target Condition</span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {alert.condition === 'gte' ? '≥' : '≤'} {alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })} {alert.tokenOutSymbol}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-tertiary)]">Current Rate</span>
                        <span className="font-mono text-[var(--text-secondary)]">
                          1 {alert.tokenInSymbol} = {currentRate.toLocaleString(undefined, { maximumFractionDigits: 6 })} {alert.tokenOutSymbol}
                        </span>
                      </div>

                      {/* Distance Percentage Bar */}
                      {!isTriggered && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono mb-1">
                            <span>Distance</span>
                            <span className={diffPct > 0 ? 'text-[var(--primary)]' : 'text-amber-400'}>
                              {diffPct > 0 ? `+${diffPct.toFixed(2)}%` : `${diffPct.toFixed(2)}%`}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(5, Math.min(100, 100 - Math.abs(diffPct)))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        {isTriggered && alert.triggeredAt ? (
                          <span>Hit {new Date(alert.triggeredAt).toLocaleTimeString()}</span>
                        ) : (
                          <span>Set {new Date(alert.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Instant Test / Trigger Button */}
                        {alert.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => simulatePriceAlertTrigger(alert.id)}
                            className="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--primary-subtle)] text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-all cursor-pointer"
                            title="Simulate / Trigger this alert now"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Trade Pair Button */}
                        {onSelectPair && (
                          <button
                            type="button"
                            onClick={() => onSelectPair(alert.tokenInSymbol, alert.tokenOutSymbol)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--primary-subtle)] hover:bg-[var(--primary)] text-[var(--primary)] hover:text-[#090B0E] text-xs font-semibold transition-all cursor-pointer"
                          >
                            <span>Swap</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {/* Delete Alert Button */}
                        <button
                          type="button"
                          onClick={() => removePriceAlert(alert.id)}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all cursor-pointer"
                          title="Delete Alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-8 text-center max-w-sm mx-auto space-y-2.5">
            <div className="w-9 h-9 mx-auto rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              No target price alerts
            </h4>
            <p className="text-xs text-[var(--text-tertiary)]">
              Set target price alerts for any token pair to get instant notifications when your desired rate is reached.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenSetAlertModal()}
              className="gap-1.5 mt-2 inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-semibold"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Set Price Alert</span>
            </Button>
          </div>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
