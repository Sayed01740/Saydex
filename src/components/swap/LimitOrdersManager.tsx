import React, { useState, useEffect } from 'react';
import { LimitOrder, limitOrdersService } from '../../services/limitOrdersService';
import { useWallet } from '../../context/WalletContext';
import { TokenIcon } from '../common/TokenIcon';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  ExternalLink,
  Zap,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export const LimitOrdersManager: React.FC = () => {
  const { selectedChain, sendTransaction } = useWallet();
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'HISTORY'>('OPEN');
  const [executingOrderId, setExecutingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = limitOrdersService.subscribe((allOrders) => {
      setOrders(allOrders);
    });
    return () => unsub();
  }, []);

  const openOrdersCount = orders.filter((o) => o.status === 'OPEN' || o.status === 'READY').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'READY').length;

  const filteredOrders = orders.filter((order) => {
    if (filter === 'OPEN') return order.status === 'OPEN' || order.status === 'READY';
    if (filter === 'HISTORY') return order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'EXPIRED';
    return true;
  });

  const handleCancel = (orderId: string) => {
    limitOrdersService.cancelOrder(orderId);
  };

  const handleExecuteOnChain = async (orderId: string) => {
    setExecutingOrderId(orderId);
    try {
      await limitOrdersService.executeOrderOnChain(orderId, sendTransaction, selectedChain.id);
    } catch (err) {
      console.error('Failed to execute limit order on chain:', err);
    } finally {
      setExecutingOrderId(null);
    }
  };

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 space-y-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            DEX Limit Orders (Gasless)
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold">
            {openOrdersCount} Active
          </span>
          {readyOrdersCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold animate-pulse">
              {readyOrdersCount} Ready to Fill
            </span>
          )}
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setFilter('OPEN')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              filter === 'OPEN'
                ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Open ({openOrdersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('HISTORY')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              filter === 'HISTORY'
                ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--text-tertiary)]">
          No {filter.toLowerCase()} limit orders found.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => {
            const isProfit = order.condition === 'gte';
            const priceDistance =
              order.currentPriceAtCreation > 0
                ? ((order.targetPrice - order.currentPriceAtCreation) / order.currentPriceAtCreation) * 100
                : 0;

            const isExecuting = executingOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-3 ${
                  order.status === 'READY'
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
                }`}
              >
                {/* Pair Details */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    <TokenIcon symbol={order.tokenIn.symbol} iconUrl={order.tokenIn.icon} size="sm" />
                    <TokenIcon symbol={order.tokenOut.symbol} iconUrl={order.tokenOut.icon} size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {order.amountIn} {order.tokenIn.symbol} → {order.minAmountOut} {order.tokenOut.symbol}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isProfit
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-indigo-500/15 text-indigo-400'
                        }`}
                      >
                        {isProfit ? 'Take Profit' : 'Buy Dip'}
                      </span>
                      {order.signature && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded"
                          title={`EIP-712 Signature: ${order.signature}`}
                        >
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Signed
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      Target: ${order.targetPrice.toLocaleString()} ({priceDistance >= 0 ? `+${priceDistance.toFixed(1)}%` : `${priceDistance.toFixed(1)}%`})
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {order.status === 'READY' && (
                    <button
                      type="button"
                      disabled={isExecuting}
                      onClick={() => handleExecuteOnChain(order.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#090B0E] font-bold text-xs shadow-sm cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Execute On-Chain</span>
                        </>
                      )}
                    </button>
                  )}

                  {order.status === 'OPEN' && (
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Monitoring
                      </span>
                      <button
                        type="button"
                        disabled={isExecuting}
                        onClick={() => handleExecuteOnChain(order.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-surface-elevated)] hover:bg-[var(--primary-subtle)] text-[var(--text-secondary)] hover:text-[var(--primary)] text-[11px] font-semibold transition-all cursor-pointer border border-[var(--border-subtle)]"
                        title="Execute swap immediately at current market rate"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Fill Now</span>
                      </button>
                    </div>
                  )}

                  {order.status === 'FILLED' && (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Filled
                      </span>
                      {order.txHash && (
                        <a
                          href={`${selectedChain.blockExplorerUrl}/tx/${order.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] hover:underline"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {order.status === 'CANCELLED' && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-disabled)] bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" />
                      Cancelled
                    </span>
                  )}

                  {(order.status === 'OPEN' || order.status === 'READY') && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order.id)}
                      title="Cancel Order"
                      className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

