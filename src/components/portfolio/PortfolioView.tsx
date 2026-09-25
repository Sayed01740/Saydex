import React, { useMemo, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ALL_CHAINS } from '../../config/chains';
import { WalletModal } from '../wallet/WalletModal';
import { TokenBalanceResult } from '../../utils/balanceFetcher';

export const PortfolioView: React.FC = () => {
  const {
    isConnected,
    address,
    selectedChain,
    formatAddress,
    tokenBalances,
    fixWalletRpc,
    switchChain,
  } = useWallet();

  const { tokens, userPositions, transactions, setActiveView } = useProtocol();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fixWalletRpc(selectedChain.id);
    } catch {
      // Ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Extract unique tokens with strictly balance > 0
  const uniqueTokenHoldings: TokenBalanceResult[] = useMemo(() => {
    if (!isConnected) return [];
    const list = Object.values(tokenBalances) as TokenBalanceResult[];
    return list
      .filter(
        (t, idx, arr) =>
          t.balance > 0 &&
          arr.findIndex((x) => x.symbol === t.symbol && x.chainId === t.chainId) === idx
      )
      .sort((a, b) => b.balanceUSD - a.balanceUSD);
  }, [isConnected, tokenBalances]);

  // Compute values strictly from real on-chain balances
  const tokensValUSD = useMemo(() => {
    return uniqueTokenHoldings.reduce((acc, t) => acc + (t.balanceUSD || 0), 0);
  }, [uniqueTokenHoldings]);

  const positionsValUSD = useMemo(() => {
    return userPositions.reduce((acc, p) => acc + (p.totalValueUSD || 0), 0);
  }, [userPositions]);

  const unclaimedFeesUSD = useMemo(() => {
    return userPositions.reduce((acc, p) => acc + (p.unclaimedFeesUSD || 0), 0);
  }, [userPositions]);

  const totalNetWorth = tokensValUSD + positionsValUSD + unclaimedFeesUSD;

  // Build allocation slices from real positive holdings
  const allocationData = useMemo(() => {
    if (!isConnected || uniqueTokenHoldings.length === 0) {
      return [{ name: 'No Assets Detected', value: 1, color: '#374151' }];
    }

    const palette = ['#00D2B4', '#38BDF8', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];
    const slices = uniqueTokenHoldings.slice(0, 6).map((tok, i) => ({
      name: tok.symbol,
      value: Math.max(0.01, Number(tok.balanceUSD.toFixed(2))),
      color: palette[i % palette.length],
    }));

    if (positionsValUSD > 0) {
      slices.push({
        name: 'LP Positions',
        value: Number(positionsValUSD.toFixed(2)),
        color: '#10B981',
      });
    }

    if (unclaimedFeesUSD > 0) {
      slices.push({
        name: 'Unclaimed Fees',
        value: Number(unclaimedFeesUSD.toFixed(2)),
        color: '#F59E0B',
      });
    }

    return slices;
  }, [isConnected, uniqueTokenHoldings, positionsValUSD, unclaimedFeesUSD]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Portfolio Terminal
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time on-chain balance accounting and asset allocations across EVM networks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
              title="Refresh on-chain balances"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[var(--primary)]' : ''}`} />
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveView('swap')}
          >
            Execute Trade
          </Button>
        </div>
      </div>

      {/* Testnet Network Status Notice */}
      {selectedChain.testnet && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-amber-200">
                Connected to {selectedChain.name} (Testnet)
              </span>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Balances and liquidity positions reflect testnet assets only with zero real monetary value.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchChain(1)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Switch to Mainnet
          </button>
        </div>
      )}

      {/* Disconnected State (Uniswap-style) */}
      {!isConnected ? (
        <div className="space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-sm text-center flex flex-col items-center justify-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shadow-lg shadow-[var(--primary)]/10">
              <Wallet className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Connect a wallet to view portfolio
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Connect your Web3 wallet (MetaMask, Coinbase, Phantom, Rabby, or WalletConnect) to view your live on-chain token balances, multi-chain assets, and LP positions. No mock data.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsWalletModalOpen(true)}
              className="px-6 py-2.5 font-semibold text-sm shadow-md"
            >
              Connect Wallet
            </Button>
          </div>

          {/* Value Prop Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--primary)]">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                100% Real-Time On-Chain Data
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                Queries native and ERC-20 token balances directly from high-availability RPC nodes via standard contract calls.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--primary)]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Multi-Chain Asset Indexing
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                Aggregates your holdings across Ethereum, Arbitrum, Optimism, Polygon, and Base in a single unified terminal.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--primary)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Non-Custodial & Private
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                Disconnect anytime with EIP-2255 permission revocation. Zero persistent tracking or server-side wallet custody.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Connected State with Real Data */
        <>
          {/* Net Worth & Asset Allocation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Total Net Worth Card */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-tertiary)] font-medium">Total Net Worth</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">
                  <span>{formatAddress(address, 4)}</span>
                  <button
                    onClick={handleCopy}
                    className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                  ${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono mt-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                  <span>Live on-chain accounting ({selectedChain.name})</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Wallet Tokens</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">
                    ${tokensValUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Liquidity Positions</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">
                    ${positionsValUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Unclaimed Fee Rewards</span>
                  <span className="font-mono text-[var(--success)] font-semibold">
                    +${unclaimedFeesUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation Donut Chart */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="w-full sm:w-1/2 h-44">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] p-2 rounded-lg text-xs shadow-lg font-mono">
                              <div>{data.name}</div>
                              <div className="font-bold text-[var(--text-primary)]">
                                ${Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full sm:w-1/2 space-y-2.5 text-xs">
                <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Asset Allocation
                </div>
                {uniqueTokenHoldings.length > 0 ? (
                  allocationData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[var(--text-secondary)]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-[var(--text-primary)]">
                        ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        ({totalNetWorth > 0 ? ((item.value / totalNetWorth) * 100).toFixed(1) : '0.0'}%)
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[var(--text-tertiary)] py-4">
                    No positive token balances detected on this address.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Token Holdings Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Token Holdings in Wallet ({uniqueTokenHoldings.length})
              </h3>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                {selectedChain.name}
              </span>
            </div>

            {uniqueTokenHoldings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Asset</th>
                      <th className="py-2.5 px-4">Network</th>
                      <th className="py-2.5 px-4 text-right">Balance</th>
                      <th className="py-2.5 px-4 text-right">USD Value</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                    {uniqueTokenHoldings.map((tok) => {
                      const chain = ALL_CHAINS.find((c) => c.id === tok.chainId) || selectedChain;
                      const matchedToken = tokens.find(
                        (t) => t.symbol.toUpperCase() === tok.symbol.toUpperCase()
                      );

                      return (
                        <tr key={tok.key} className="hover:bg-[var(--bg-subtle)]/40 transition-colors">
                          <td className="py-3 px-4 font-sans font-semibold">
                            <div className="flex items-center gap-2.5">
                              <TokenIcon symbol={tok.symbol} icon={matchedToken?.icon} size="sm" />
                              <div>
                                <span className="text-[var(--text-primary)]">{tok.symbol}</span>
                                <div className="text-[10px] text-[var(--text-tertiary)] font-normal">
                                  {matchedToken?.name || tok.symbol}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                              {chain.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-[var(--text-primary)]">
                            {tok.formatted} {tok.symbol}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                            ${tok.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              onClick={() => setActiveView('swap')}
                              className="px-2.5 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--primary)] hover:text-[#090B0E] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
                            >
                              Swap
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] mx-auto flex items-center justify-center text-[var(--text-tertiary)]">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    No token balances detected
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] max-w-sm mx-auto">
                    This connected wallet currently holds 0 balance in the queried tokens on {selectedChain.name}. Deposit or swap to fund your account.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('swap')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-[#090B0E] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>Trade Tokens</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Protocol Transaction History */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Recent On-Chain Activity
              </h3>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                {transactions.length} Transactions
              </span>
            </div>

            {transactions.length > 0 ? (
              <div className="divide-y divide-[var(--border-subtle)]">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-sm text-[var(--text-primary)]">
                        {tx.title}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                        {tx.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-[var(--text-tertiary)]">
                        ~${tx.gasCostUSD.toFixed(2)} Gas
                      </span>
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[var(--primary)] hover:underline"
                      >
                        <span>{formatAddress(tx.hash, 6)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-tertiary)]">
                No recent transactions executed from this session.
              </div>
            )}
          </div>
        </>
      )}

      {/* Wallet Connect / Account Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};
