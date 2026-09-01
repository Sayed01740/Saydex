import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, ExternalLink, Clock } from 'lucide-react';
import { NATIVE_TOKEN_PRICES_USD } from '../../config/chains';

export const PortfolioView: React.FC = () => {
  const { nativeBalance, nativeSymbol, usdcBalance, selectedChain, formatAddress } = useWallet();
  const { tokens, userPositions, transactions, setActiveView } = useProtocol();

  const ethValUSD = nativeBalance * (NATIVE_TOKEN_PRICES_USD[nativeSymbol] ?? NATIVE_TOKEN_PRICES_USD.ETH);
  const usdcValUSD = usdcBalance;
  const positionsValUSD = userPositions.reduce((acc, p) => acc + p.totalValueUSD, 0);
  const totalNetWorth = ethValUSD + usdcValUSD + positionsValUSD + 1250 * 14.8; // AXIOM holdings

  const allocationData = [
    { name: 'ETH (Ether)', value: Math.round(ethValUSD), color: '#00D2B4' },
    { name: 'USDC (USD Coin)', value: Math.round(usdcValUSD), color: '#38BDF8' },
    { name: 'Concentrated LP Positions', value: Math.round(positionsValUSD), color: '#10B981' },
    { name: 'AXIOM Governance', value: Math.round(1250 * 14.8), color: '#818CF8' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Portfolio Terminal
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time balance accounting, asset allocations, and protocol transaction logs.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setActiveView('swap')}
        >
          Execute Trade
        </Button>
      </div>

      {/* Net Worth & Asset Allocation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Total Net Worth Card */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs space-y-4">
          <span className="text-xs text-[var(--text-tertiary)] font-medium">Total Net Worth</span>
          <div>
            <h2 className="text-3xl font-bold font-mono text-[var(--text-primary)]">
              ${totalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[var(--success)] font-mono mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+$1,842.20 (+3.84%) past 24h</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Wallet Tokens</span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">
                ${(ethValUSD + usdcValUSD + 1250 * 14.8).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Liquidity Positions</span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">
                ${positionsValUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Unclaimed Fee Rewards</span>
              <span className="font-mono text-[var(--success)] font-semibold">
                +$569.10
              </span>
            </div>
          </div>
        </div>

        {/* Allocation Donut Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="w-full sm:w-1/2 h-44">
            <ResponsiveContainer width="100%" height="100%">
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
                            ${Number(data.value).toLocaleString()}
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
            {allocationData.map((item) => (
              <div key={item.name} className="flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--text-secondary)]">{item.name}</span>
                </div>
                <span className="font-semibold text-[var(--text-primary)]">
                  ${item.value.toLocaleString()} ({((item.value / totalNetWorth) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Token Holdings Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          Token Holdings in Wallet
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Asset</th>
                <th className="py-2.5 px-4 text-right">Price</th>
                <th className="py-2.5 px-4 text-right">Balance</th>
                <th className="py-2.5 px-4 text-right">USD Value</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
              <tr>
                <td className="py-3 px-4 font-sans font-semibold">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol="ETH" icon={tokens[0].icon} size="sm" />
                    <span>Ethereum (ETH)</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-[var(--text-primary)]">$3,482.50</td>
                <td className="py-3 px-4 text-right font-semibold text-[var(--text-primary)]">
                  {nativeBalance.toFixed(4)} ETH
                </td>
                <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                  ${ethValUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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

              <tr>
                <td className="py-3 px-4 font-sans font-semibold">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol="USDC" icon={tokens[1].icon} size="sm" />
                    <span>USD Coin (USDC)</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-[var(--text-primary)]">$1.00</td>
                <td className="py-3 px-4 text-right font-semibold text-[var(--text-primary)]">
                  {usdcBalance.toFixed(2)} USDC
                </td>
                <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                  ${usdcValUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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

              <tr>
                <td className="py-3 px-4 font-sans font-semibold">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol="AXIOM" icon={tokens[3].icon} size="sm" />
                    <span>Axiom Protocol (AXIOM)</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-[var(--text-primary)]">$14.80</td>
                <td className="py-3 px-4 text-right font-semibold text-[var(--text-primary)]">
                  1,250.00 AXIOM
                </td>
                <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                  ${(1250 * 14.8).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
            </tbody>
          </table>
        </div>
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
      </div>
    </div>
  );
};
