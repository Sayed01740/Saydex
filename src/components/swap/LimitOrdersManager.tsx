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
} from 'lucide-react';

export const LimitOrdersManager: React.FC = () => {
  const { accountAddress, selectedChain } = useWallet();
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'HISTORY'>('OPEN');

  useEffect(() => {
    const unsub = limitOrdersService.subscribe((allOrders) => {
      setOrders(allOrders);
    });
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (filter === 'OPEN') return order.status === 'OPEN';
    if (filter === 'HISTORY') return order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'EXPIRED';
    return true;
  });

  const handleCancel = (orderId: string) => {
    limitOrdersService.cancelOrder(orderId);
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
            {orders.filter((o) => o.status === 'OPEN').length} Active
          </span>
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
            Open ({orders.filter((o) => o.status === 'OPEN').length})
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
              ((order.targetPrice - order.currentPriceAtCreation) / order.currentPriceAtCreation) * 100;

            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] transition-all"
              >
                {/* Pair Details */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-2">
                    <TokenIcon symbol={order.tokenIn.symbol} iconUrl={order.tokenIn.icon} size="sm" />
                    <TokenIcon symbol={order.tokenOut.symbol} iconUrl={order.tokenOut.icon} size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
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
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      Target: ${order.targetPrice.toLocaleString()} ({priceDistance >= 0 ? `+${priceDistance.toFixed(1)}%` : `${priceDistance.toFixed(1)}%`})
                    </div>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="flex items-center gap-2">
                  {order.status === 'OPEN' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Monitoring
                    </span>
                  )}
                  {order.status === 'FILLED' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Filled
                    </span>
                  )}
                  {order.status === 'CANCELLED' && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-disabled)] bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" />
                      Cancelled
                    </span>
                  )}

                  {order.status === 'OPEN' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order.id)}
                      title="Cancel Order"
                      className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
