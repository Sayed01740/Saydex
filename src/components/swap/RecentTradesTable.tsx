import React, { useState, useMemo } from 'react';
import { ProtocolTransaction, Token } from '../../types';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { TokenIcon } from '../common/TokenIcon';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Search,
  Check,
  Copy,
  Receipt,
  Zap,
  Filter,
  Layers,
  ArrowUpRight,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_CHAINS } from '../../config/chains';

interface RecentTradesTableProps {
  onSelectPair?: (tokenInSymbol: string, tokenOutSymbol: string, amount?: string) => void;
}

export const RecentTradesTable: React.FC<RecentTradesTableProps> = ({ onSelectPair }) => {
  const { transactions, tokens, clearTransactions } = useProtocol();
  const { formatAddress, selectedChain, address } = useWallet();

  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'failed'>('all');
  const [networkFilter, setNetworkFilter] = useState<'current' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<ProtocolTransaction | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to get chain label
  const getChainName = (chainId?: number) => {
    if (!chainId) return null;
    const found = ALL_CHAINS.find((c) => c.id === chainId);
    return found ? found.name : `Chain ${chainId}`;
  };

  // Filter only swap-related transactions
  const swapTrades = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type !== 'swap') return false;
      if (networkFilter === 'current' && tx.chainId && tx.chainId !== selectedChain.id) {
        return false;
      }
      return true;
    });
  }, [transactions, networkFilter, selectedChain.id]);

  // Apply filters & search
  const filteredTrades = useMemo(() => {
    return swapTrades.filter((tx) => {
      // Status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) {
        return false;
      }
      // Search query (token symbol, title, hash)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inSymbol = tx.tokenIn?.symbol?.toLowerCase() || '';
        const outSymbol = tx.tokenOut?.symbol?.toLowerCase() || '';
        const title = tx.title.toLowerCase();
        const hash = tx.hash.toLowerCase();
        return inSymbol.includes(query) || outSymbol.includes(query) || title.includes(query) || hash.includes(query);
      }
      return true;
    });
  }, [swapTrades, statusFilter, searchQuery]);

  // Helper to format relative time
  const formatTimeAgo = (timestamp: number) => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;
    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays}d ago`;
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRepeatSwap = (tx: ProtocolTransaction) => {
    if (onSelectPair && tx.tokenIn && tx.tokenOut) {
      onSelectPair(tx.tokenIn.symbol, tx.tokenOut.symbol, tx.tokenIn.amount);
    }
  };

  // Helper to get USD value for a trade
  const getTradeUSDValue = (tx: ProtocolTransaction) => {
    if (tx.tokenIn?.amount && tx.tokenIn?.symbol) {
      const tok = tokens.find((t) => t.symbol.toUpperCase() === tx.tokenIn?.symbol.toUpperCase());
      if (tok?.priceUSD) {
        const amt = parseFloat(tx.tokenIn.amount.replace(/,/g, ''));
        if (!isNaN(amt) && amt > 0) {
          return (amt * tok.priceUSD).toFixed(2);
        }
      }
    }
    return null;
  };

  // Helper to get token icon safely
  const getTokenIcon = (symbol?: string, fallbackIcon?: string) => {
    if (!symbol) return fallbackIcon;
    const found = tokens.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
    return found?.icon || fallbackIcon;
  };

  return (
    <div id="recent-trades-section" className="w-full mt-6">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Clickable Header for Collapsible / Minimize */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-subtle)]/40 transition-colors select-none"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                  Recent Trade History
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                  {swapTrades.length} {swapTrades.length === 1 ? 'Trade' : 'Trades'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 hidden sm:block">
                Recent swap transactions on your connected wallet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              {/* Filter Pills & Search */}
              <div className="p-3 sm:p-4 bg-[var(--bg-subtle)]/40 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search token or hash..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-all font-mono"
                  />
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2">
                  {/* Network Filter Badges */}
                  <div className="flex items-center p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-app)] text-xs font-semibold">
                    <button
                      onClick={() => setNetworkFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        networkFilter === 'all'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      All Chains
                    </button>
                    <button
                      onClick={() => setNetworkFilter('current')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        networkFilter === 'current'
                          ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-xs'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {selectedChain.name.split(' ')[0]}
                    </button>
                  </div>

                  {/* Status Filter Badges */}
                  <div className="flex items-center p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-app)] text-xs font-semibold">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('confirmed')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        statusFilter === 'confirmed'
                          ? 'bg-[var(--bg-surface)] text-[var(--success)] shadow-xs'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        statusFilter === 'pending'
                          ? 'bg-[var(--bg-surface)] text-[var(--warning)] shadow-xs'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Pending
                    </button>
                  </div>

                  {/* Clear History Button */}
                  {swapTrades.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear your local trade history?')) {
                          clearTransactions();
                        }
                      }}
                      title="Clear trade history"
                      className="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-rose-500/10 text-[var(--text-tertiary)] hover:text-rose-500 border border-[var(--border-app)] hover:border-rose-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Token Pair & Network</th>
                      <th className="py-3 px-4">Swapped (In ➔ Out)</th>
                      <th className="py-3 px-4 hidden md:table-cell">Execution Rate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
              {filteredTrades.length > 0 ? (
                filteredTrades.map((tx) => {
                  const inIcon = getTokenIcon(tx.tokenIn?.symbol, tx.tokenIn?.icon);
                  const outIcon = getTokenIcon(tx.tokenOut?.symbol, tx.tokenOut?.icon);
                  const usdVal = getTradeUSDValue(tx);
                  const chainLabel = getChainName(tx.chainId);

                  const inAmtNum = parseFloat(tx.tokenIn?.amount?.replace(/,/g, '') || '0');
                  const outAmtNum = parseFloat(tx.tokenOut?.amount?.replace(/,/g, '') || '0');
                  const calcRate = inAmtNum > 0 && outAmtNum > 0 ? (outAmtNum / inAmtNum).toFixed(4) : null;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[var(--bg-subtle)]/50 transition-colors group"
                    >
                      {/* Token Pair */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5 font-sans">
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            <TokenIcon
                              symbol={tx.tokenIn?.symbol || 'ETH'}
                              icon={inIcon}
                              size="sm"
                              className="border border-[var(--bg-surface)]"
                            />
                            <TokenIcon
                              symbol={tx.tokenOut?.symbol || 'USDC'}
                              icon={outIcon}
                              size="sm"
                              className="border border-[var(--bg-surface)]"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-sm text-[var(--text-primary)]">
                              <span>{tx.tokenIn?.symbol || 'Unknown'}</span>
                              <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)]" />
                              <span>{tx.tokenOut?.symbol || 'Unknown'}</span>
                            </div>
                            <div className="text-[10px] text-[var(--text-tertiary)] font-mono flex items-center gap-1.5 mt-0.5">
                              {chainLabel && (
                                <span className="px-1.5 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium">
                                  {chainLabel}
                                </span>
                              )}
                              <span className="text-[var(--primary)]">●</span>
                              <span>Uniswap V3</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amounts */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 font-mono">
                          <div className="font-semibold text-[var(--text-primary)] text-xs flex items-center gap-1">
                            <span className="text-[var(--text-secondary)]">
                              {tx.tokenIn?.amount || '0'} {tx.tokenIn?.symbol || ''}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
                            <span className="text-[var(--primary)] font-bold">
                              {tx.tokenOut?.amount || '0'} {tx.tokenOut?.symbol || ''}
                            </span>
                          </div>
                          {usdVal && (
                            <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                              ≈ ${usdVal} USD
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Execution Rate */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate max-w-[220px]">
                          {calcRate
                            ? `1 ${tx.tokenIn?.symbol} ≈ ${calcRate} ${tx.tokenOut?.symbol}`
                            : tx.description?.includes('Rate:')
                            ? tx.description.split('•')[0].trim()
                            : 'Direct Pool Swap'}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                          Gas: ~${(tx.gasCostUSD || 0.05).toFixed(2)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {tx.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Confirmed</span>
                          </span>
                        ) : tx.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                            <Clock className="w-3 h-3 shrink-0 animate-spin" />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
                        <span title={new Date(tx.timestamp).toLocaleString()}>
                          {formatTimeAgo(tx.timestamp)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Swap Again button */}
                          <button
                            onClick={() => handleRepeatSwap(tx)}
                            title="Load this pair into swap card"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--primary)] hover:text-[#090B0E] border border-[var(--border-app)] text-[11px] font-semibold text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span className="hidden sm:inline">Swap Again</span>
                          </button>

                          {/* Explorer Link */}
                          <a
                            href={tx.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on Block Explorer"
                            className="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all inline-flex items-center justify-center cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Quick receipt modal button */}
                          <button
                            onClick={() => setSelectedTx(tx)}
                            title="View trade receipt"
                            className="p-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all inline-flex items-center justify-center cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-xs mx-auto space-y-2 font-sans">
                      <div className="w-10 h-10 mx-auto rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                        No trade history found
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {searchQuery || statusFilter !== 'all'
                          ? 'No transactions matched your current filters. Try resetting your search.'
                          : 'You have not made any swaps yet. Your completed trades will automatically appear here.'}
                      </p>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="mt-2 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-[var(--bg-subtle)] border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--text-tertiary)] gap-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Trades automatically settle through MEV-shielded private solvers.</span>
          </div>
          <div className="font-mono">
            Showing {filteredTrades.length} of {swapTrades.length} recorded swaps
          </div>
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trade Receipt Modal */}
      <AnimatePresence>
        {selectedTx && (
          <Modal
            isOpen={!!selectedTx}
            onClose={() => setSelectedTx(null)}
            title="Trade Transaction Receipt"
          >
            <div className="space-y-5">
              {/* Main summary header */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)] font-mono">Status</span>
                  {selectedTx.status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#10B981]/15 text-[#10B981]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F59E0B]/15 text-[#F59E0B]">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between font-sans">
                  <div className="space-y-0.5">
                    <div className="text-xs text-[var(--text-tertiary)]">Sent</div>
                    <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                      {selectedTx.tokenIn?.amount} {selectedTx.tokenIn?.symbol}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <div className="space-y-0.5 text-right">
                    <div className="text-xs text-[var(--text-tertiary)]">Received</div>
                    <div className="text-base font-bold font-mono text-[var(--primary)]">
                      {selectedTx.tokenOut?.amount} {selectedTx.tokenOut?.symbol}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Transaction Hash</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[var(--text-primary)]">
                      {formatAddress(selectedTx.hash, 8)}
                    </span>
                    <button
                      onClick={() => handleCopyHash(selectedTx.hash)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Timestamp</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {new Date(selectedTx.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Network Fee Paid</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    ~${selectedTx.gasCostUSD?.toFixed(2) || '1.45'} USD
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Route Type</span>
                  <span className="font-mono text-[var(--primary)] font-semibold">
                    Concentrated v3 (MEV Shielded)
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={selectedTx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View on Explorer</span>
                  </Button>
                </a>
                <Button
                  variant="primary"
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    handleRepeatSwap(selectedTx);
                    setSelectedTx(null);
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Repeat Trade</span>
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
