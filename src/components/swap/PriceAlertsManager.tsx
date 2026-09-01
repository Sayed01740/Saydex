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
    <div id="price-alerts-manager" className="w-full bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-app)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Live automated triggers notifying you when market pairs cross your target thresholds.
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Status Tabs */}
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
                  ? 'bg-[var(--bg-surface)] text-[var(--success)] shadow-xs'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Triggered
            </button>
          </div>

          {/* New Alert Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenSetAlertModal()}
            className="gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Alert</span>
          </Button>
        </div>
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
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                      isTriggered
                        ? 'bg-[#10B981]/5 border-[#10B981]/30 shadow-2xs'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-app)] hover:border-[var(--border-strong)]'
                    }`}
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

                        {/* Status Badge */}
                        {isTriggered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Reached</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>Monitoring</span>
                          </span>
                        )}
                      </div>

                      {/* Note if present */}
                      {alert.note && (
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 italic line-clamp-1">
                          "{alert.note}"
                        </p>
                      )}
                    </div>

                    {/* Target Price & Current Price Comparison Box */}
                    <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[var(--text-tertiary)] flex items-center gap-1">
                          <Target className="w-3 h-3 text-[var(--primary)]" />
                          <span>Target:</span>
                        </span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {alert.condition === 'gte' ? '≥ ' : '≤ '}
                          {alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 5 })}{' '}
                          {alert.tokenOutSymbol}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[var(--text-tertiary)]">Current:</span>
                        <span className="text-[var(--text-secondary)]">
                          {currentRate.toLocaleString(undefined, { maximumFractionDigits: 5 })}{' '}
                          {alert.tokenOutSymbol}
                        </span>
                      </div>

                      {/* Distance metric indicator */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--border-subtle)] font-mono">
                        <span className="text-[var(--text-tertiary)]">Distance:</span>
                        <span
                          className={`font-semibold flex items-center gap-0.5 ${
                            isTriggered
                              ? 'text-[var(--success)]'
                              : Math.abs(diffPct) < 2
                              ? 'text-[var(--warning)] font-bold'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {diffPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>
                            {diffPct >= 0 ? '+' : ''}
                            {diffPct.toFixed(2)}% away
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      {/* Simulate Hit (for testing) */}
                      {!isTriggered ? (
                        <button
                          type="button"
                          onClick={() => simulatePriceAlertTrigger(alert.id)}
                          title="Simulate price reaching this target now"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-secondary)] transition-colors cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-[var(--primary)]" />
                          <span>Simulate Hit</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-[var(--success)] font-mono flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Triggered {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        {/* Swap This Pair Button */}
                        {onSelectPair && (
                          <button
                            type="button"
                            onClick={() => onSelectPair(alert.tokenInSymbol, alert.tokenOutSymbol)}
                            title="Load this pair into swap card"
                            className="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete alert */}
                        <button
                          type="button"
                          onClick={() => removePriceAlert(alert.id)}
                          title="Remove alert"
                          className="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--error-subtle)] hover:text-[var(--error)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors cursor-pointer"
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
          <div className="py-10 text-center max-w-sm mx-auto space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              No target price alerts found
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Set target price notifications for any token pair to receive automatic in-app toasts and audio alerts when your desired price is reached.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenSetAlertModal()}
              className="gap-1.5 mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Set First Target Alert</span>
            </Button>
          </div>
        )}
      </div>

      {/* Informational Sub-footer */}
      <div className="p-3 bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--text-tertiary)] gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Alerts continuously monitor live mempool exchange rates and trigger in real time.</span>
        </div>
        <div className="font-mono">
          {activeCount} active / {priceAlerts.length} total alerts
        </div>
      </div>
    </div>
  );
};
