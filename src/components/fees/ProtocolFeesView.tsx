import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import {
  Flame,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Lock,
  ArrowDownUp,
  Coins,
  Cpu,
  Info,
} from 'lucide-react';

const formatUSD = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const formatTokens = (val: number, maxDecimals: number = 4): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxDecimals,
  }).format(val);
};

export const ProtocolFeesView: React.FC = () => {
  const {
    tokenJars,
    feeAdapters,
    firepitAuctions,
    feePolicyTiers,
    feeEvents,
    sweepFeesToJar,
    burnUniInFirepit,
    updateFeePolicyFraction,
  } = useProtocol();

  const { selectedChain } = useWallet();
  const [selectedChainId, setSelectedChainId] = useState<number>(selectedChain?.id || 1);
  const [activeTab, setActiveTab] = useState<'overview' | 'tokenjar' | 'firepit' | 'policy' | 'contracts'>('overview');

  // Firepit Burn Modal State
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [uniBurnInput, setUniBurnInput] = useState('5000');
  const [isBurning, setIsBurning] = useState(false);

  // Contract execution state
  const [selectedContractTab, setSelectedContractTab] = useState<'tokenjar' | 'v3adapter' | 'v4policy' | 'firepit'>('tokenjar');

  const currentJar = tokenJars[selectedChainId] || tokenJars[1];
  const currentAuction = firepitAuctions[selectedChainId] || firepitAuctions[1];

  const totalJarValueAllChains = (Object.values(tokenJars) as any[]).reduce((acc: number, j: any) => acc + (j?.totalValueUSD || 0), 0);
  const totalUniBurnedAllChains = (Object.values(firepitAuctions) as any[]).reduce((acc: number, a: any) => acc + (a?.totalUniBurnedLifetime || 0), 0);
  const totalUsdBurnedAllChains = (Object.values(firepitAuctions) as any[]).reduce((acc: number, a: any) => acc + (a?.totalUsdBurnedLifetime || 0), 0);

  const handleExecuteBurn = () => {
    const amount = parseFloat(uniBurnInput);
    if (isNaN(amount) || amount <= 0) return;

    setIsBurning(true);
    setTimeout(() => {
      burnUniInFirepit(selectedChainId, amount);
      setIsBurning(false);
      setIsBurnModalOpen(false);
      setUniBurnInput('5000');
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-app)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Flame className="w-3.5 h-3.5" />
              Uniswap Protocol Fees & Firepit
            </span>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">
              repo: Uniswap/protocol-fees
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Decentralized Protocol Fee Collection & Firepit
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
            A three-layer fee routing and burning engine: <strong>Fee Adapters (V2/V3/V4)</strong> channel protocol fees into an immutable <strong>TokenJar</strong> on every chain, continuously released and burned via the <strong>Firepit</strong> in exchange for UNI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Uniswap/protocol-fees"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
          >
            <FileCode className="w-4 h-4 text-[var(--primary)]" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3 text-[var(--text-tertiary)]" />
          </a>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsBurnModalOpen(true)}
          >
            <Flame className="w-4 h-4 mr-1.5 text-amber-950" />
            <span>Burn UNI in Firepit</span>
          </Button>
        </div>
      </div>

      {/* Global Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Total TokenJar Inventory</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
            ${formatUSD(totalJarValueAllChains)}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">Across 4 active chain TokenJars</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Total UNI Burned Lifetime</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500">
            {totalUniBurnedAllChains.toLocaleString()} UNI
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-mono">
            ≈ ${totalUsdBurnedAllChains.toLocaleString()} USD deflationary value
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Active Fee Adapters</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
            3 Adapters Active
          </div>
          <p className="text-[11px] text-emerald-500 font-medium">V2, V3 & V4 Hooks Monitored</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Governance Fee Switch</span>
            <Sliders className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500">
            Activated (3 Tiers)
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-mono">UGP-48 Policy Enforced</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Protocol Architecture', icon: <Layers className="w-4 h-4" /> },
          { id: 'tokenjar', label: 'TokenJar Vaults', icon: <Lock className="w-4 h-4" /> },
          { id: 'firepit', label: 'Firepit Burn Auction', icon: <Flame className="w-4 h-4 text-rose-500" /> },
          { id: 'policy', label: 'Fee Policy & Switch', icon: <Sliders className="w-4 h-4 text-indigo-500" /> },
          { id: 'contracts', label: 'Contract ABI & Verified Code', icon: <FileCode className="w-4 h-4 text-amber-500" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Architecture Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visual Architecture Diagram */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                The Uniswap Protocol Fees Three-Tier Pipeline
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                How liquidity fees flow securely from pool trades to decentralized burn mechanics without custodial intervention.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
              {/* Layer 1: Fee Sources & Adapters */}
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    LAYER 1: SOURCES
                  </span>
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Fee Source Adapters</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Adapter contracts monitor and sweep protocol fees accrued in Uniswap V2, V3 tick fractions, and V4 dynamic hook policies.
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)]">V3FeeAdapter</span>
                    <span className="font-mono text-xs text-emerald-500">Active (842 pools)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)]">V4FeeAdapter</span>
                    <span className="font-mono text-xs text-purple-400">Hook Overrides</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="font-semibold text-[var(--text-primary)]">V2FeeAdapter</span>
                    <span className="font-mono text-xs text-[var(--text-tertiary)]">1/6th LP Sweeper</span>
                  </div>
                </div>
              </div>

              {/* Layer 2: TokenJar */}
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                    LAYER 2: ACCUMULATOR
                  </span>
                  <Lock className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Immutable TokenJar</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  A permissionless vault contract deployed on every blockchain that aggregates fee tokens (WETH, USDC, WBTC) and holds them until released.
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Ethereum Mainnet Jar</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      ${(tokenJars[1]?.totalValueUSD / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Arbitrum One Jar</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      ${(tokenJars[42161]?.totalValueUSD / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Base & OP Jars</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      ${((tokenJars[8453]?.totalValueUSD + tokenJars[10]?.totalValueUSD) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Layer 3: Releasers & Firepit */}
              <div className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    LAYER 3: THE FIREPIT
                  </span>
                  <Flame className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Firepit Releaser Engine</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Searchers & arbitrageurs call <code className="text-rose-400">release()</code> by burning UNI tokens, unlocking the TokenJar asset basket with MEV incentives.
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Burn Destination</span>
                    <span className="font-mono text-[11px] text-rose-400">0x...0000dEaD</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">Release Mechanism</span>
                    <span className="font-mono text-[11px] text-[var(--text-primary)]">Dutch Auction Curve</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs flex justify-between items-center">
                    <span className="text-[var(--text-secondary)]">L2 Bridge Burn</span>
                    <span className="font-mono text-[11px] text-emerald-400">BridgedFirepit.sol</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Adapters Live Status Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Active Fee Adapters</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Sweeping protocol fees continuously into respective TokenJars.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {feeAdapters.map((adapter) => (
                <div
                  key={adapter.id}
                  className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--primary)] border border-[var(--border-subtle)]">
                        {adapter.protocolVersion} Adapter
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Online
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{adapter.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {adapter.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-tertiary)]">Total Swept USD:</span>
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        ${(adapter.totalSweptUSD / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-tertiary)]">Pending Sweep:</span>
                      <span className="font-mono font-semibold text-amber-500">
                        ${adapter.pendingUncollectedUSD.toLocaleString()} USD
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      disabled={adapter.pendingUncollectedUSD === 0}
                      onClick={() => sweepFeesToJar(adapter.id, selectedChainId)}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Sweep to TokenJar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Protocol Fee Events Ledger */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                On-Chain Protocol Fees & Burn Ledger
              </h3>
              <span className="text-xs font-mono text-[var(--text-tertiary)]">
                {feeEvents.length} Verified Events
              </span>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {feeEvents.map((evt) => (
                <div key={evt.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        evt.type === 'burn'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                          : evt.type === 'sweep'
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}
                    >
                      {evt.type === 'burn' ? (
                        <Flame className="w-4 h-4" />
                      ) : evt.type === 'sweep' ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <Sliders className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                        {evt.title}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {evt.description}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {evt.amountUSD > 0 && (
                      <div className="text-xs sm:text-sm font-bold font-mono text-[var(--text-primary)]">
                        +${evt.amountUSD.toLocaleString()} USD
                      </div>
                    )}
                    {evt.uniAmount && (
                      <div className="text-[11px] font-mono text-rose-500">
                        {evt.uniAmount.toLocaleString()} UNI
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      {evt.hash}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: TokenJar Multi-chain Vaults */}
      {activeTab === 'tokenjar' && (
        <div className="space-y-6">
          {/* Chain Switcher Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 1, name: 'Ethereum Mainnet' },
              { id: 42161, name: 'Arbitrum One' },
              { id: 8453, name: 'Base' },
              { id: 10, name: 'OP Mainnet' },
            ].map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChainId(chain.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedChainId === chain.id
                    ? 'bg-[var(--primary)] text-[#090B0E] font-bold shadow-xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-app)]'
                }`}
              >
                {chain.name}
              </button>
            ))}
          </div>

          {/* Active TokenJar Details Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-[var(--text-tertiary)] tracking-wider">
                  Active TokenJar Deployment
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {currentJar.chainName} TokenJar
                </h2>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                  Contract: {currentJar.contractAddress}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-[var(--text-tertiary)]">Accrued Basket Worth</span>
                <div className="text-2xl font-bold font-mono text-[var(--primary)]">
                  ${formatUSD(currentJar.totalValueUSD)}
                </div>
              </div>
            </div>

            {/* Token Jar Inventory Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Accrued Assets Held in TokenJar Vault
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentJar.tokens.map((tok) => (
                  <div
                    key={tok.token.symbol}
                    className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <TokenIcon symbol={tok.token.symbol} icon={tok.token.icon} size="md" />
                      <div>
                        <div className="font-bold text-sm text-[var(--text-primary)]">
                          {formatTokens(tok.amount)} {tok.token.symbol}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          ${formatUSD(tok.valueUSD)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-500 font-mono font-medium block">
                        +${tok.accrualRate24hUSD.toLocaleString()}/day
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">accrual rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Releaser Info & Actions */}
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Designated Releaser Contract
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  {currentJar.releaserAddress} (FirepitReleaser.sol)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => sweepFeesToJar('v3-adapter', selectedChainId)}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Simulate Keeper Sweep
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsBurnModalOpen(true)}
                >
                  <Flame className="w-3.5 h-3.5 mr-1" />
                  Burn UNI & Release
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: The Firepit (UNI Burn Auction Engine) */}
      {activeTab === 'firepit' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[var(--border-subtle)] pb-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Flame className="w-4 h-4" />
                  Active Firepit Lot #{currentAuction.lotNumber} ({currentJar.chainName})
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                  The Firepit: Deflationary UNI Burn Engine
                </h2>
                <p className="text-xs text-[var(--text-secondary)] max-w-2xl">
                  The Firepit accepts bids in UNI governance tokens. When executed, the UNI is permanently burned at the 0x...dEaD address, linking protocol fee capture directly to token supply reduction.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-right space-y-1 shrink-0">
                <span className="text-xs text-[var(--text-tertiary)]">Lot Basket Market Value</span>
                <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                  ${formatUSD(currentAuction.basketValueUSD)}
                </div>
                <div className="text-xs font-mono text-emerald-500 font-semibold">
                  {currentAuction.discountPercent}% MEV Searcher Arbitrage Incentive
                </div>
              </div>
            </div>

            {/* Auction Bid Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Current Dutch Auction Pricing
                </h3>

                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)]">Required UNI to Burn:</span>
                    <span className="font-mono text-lg font-bold text-rose-500">
                      {currentAuction.currentUniPriceTokens.toLocaleString()} UNI
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)]">UNI Value in USD:</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">
                      ${currentAuction.currentUniPriceUSD.toLocaleString()} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)]">Lot Settlement Status:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Open for Permissionless Settlement
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => setIsBurnModalOpen(true)}
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Participate in Firepit Burn & Unlock Basket
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Lifetime Burn Statistics ({currentJar.chainName})
                </h3>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex justify-between items-center">
                    <span className="text-xs text-[var(--text-secondary)]">Lifetime UNI Burned:</span>
                    <span className="font-mono font-bold text-rose-500 text-sm">
                      {currentAuction.totalUniBurnedLifetime.toLocaleString()} UNI
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex justify-between items-center">
                    <span className="text-xs text-[var(--text-secondary)]">Total Value Processed:</span>
                    <span className="font-mono font-bold text-[var(--text-primary)] text-sm">
                      ${currentAuction.totalUsdBurnedLifetime.toLocaleString()} USD
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex justify-between items-center">
                    <span className="text-xs text-[var(--text-secondary)]">Burn Mechanism Contract:</span>
                    <span className="font-mono text-xs text-[var(--primary)]">
                      FirepitReleaser.sol
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Fee Policy & Fee Switch */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Uniswap V3 & V4 Fee Policy Governor (The "Fee Switch")
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Configure protocol fee fractions across pool fee tiers according to Uniswap Governance proposals.
              </p>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {feePolicyTiers.map((tier) => (
                <div key={tier.feeTier} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          {tier.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                            tier.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tier.status === 'governance_proposal'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)]'
                          }`}
                        >
                          {tier.status === 'active'
                            ? 'ACTIVE SWITCH'
                            : tier.status === 'governance_proposal'
                            ? 'PROPOSED'
                            : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5 font-mono">
                        Tier: {tier.feeTier} (Swap Fee: {tier.poolSwapFeePercent}%)
                      </p>
                    </div>

                    {/* Fraction Selector Buttons */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--text-tertiary)] mr-1">Fee Share:</span>
                      {[
                        { val: 4, label: '1/4 (25%)' },
                        { val: 5, label: '1/5 (20%)' },
                        { val: 6, label: '1/6 (16.7%)' },
                        { val: 0, label: 'Off (0%)' },
                      ].map((btn) => (
                        <button
                          key={btn.val}
                          onClick={() => updateFeePolicyFraction(tier.feeTier, btn.val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                            tier.protocolFeeFraction === btn.val
                              ? 'bg-[var(--primary)] text-[#090B0E] font-bold shadow-xs'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Impact Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] text-xs">
                      <span className="text-[var(--text-tertiary)] block text-[11px]">Effective Fee:</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {tier.effectiveProtocolFeePercent.toFixed(4)}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] text-xs">
                      <span className="text-[var(--text-tertiary)] block text-[11px]">Est. Annual Protocol Rev:</span>
                      <span className="font-mono font-bold text-emerald-500">
                        ${(tier.projectedAnnualRevenueUSD / 1000000).toFixed(1)}M / yr
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] text-xs">
                      <span className="text-[var(--text-tertiary)] block text-[11px]">LP Yield Impact:</span>
                      <span className="font-mono font-bold text-rose-400">
                        {tier.lpApyImpactPercent}% APY
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] text-xs">
                      <span className="text-[var(--text-tertiary)] block text-[11px]">Routing Contract:</span>
                      <span className="font-mono text-xs text-[var(--primary)]">
                        V4FeePolicy.sol
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Contract ABI & Code Verification */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Smart Contract ABI Inspector & Verified Code
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Direct integration with smart contracts from the <strong>Uniswap/protocol-fees</strong> GitHub repository.
              </p>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'tokenjar', label: 'TokenJar.sol' },
                { id: 'v3adapter', label: 'V3FeeAdapter.sol' },
                { id: 'v4policy', label: 'V4FeePolicy.sol' },
                { id: 'firepit', label: 'FirepitReleaser.sol' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedContractTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    selectedContractTab === t.id
                      ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] border border-[var(--border-subtle)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Solidity Code Preview */}
            <div className="bg-[#090B0E] border border-[var(--border-app)] rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              {selectedContractTab === 'tokenjar' && (
                <pre>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TokenJar - Immutable Protocol Fee Accumulator
/// @notice Holds accumulated protocol fees across all Uniswap pools on this chain
contract TokenJar {
    address public immutable releaser;
    
    event FeesDeposited(address indexed token, uint256 amount);
    event FeesReleased(address indexed recipient, address[] tokens, uint256[] amounts);
    
    constructor(address _releaser) {
        releaser = _releaser;
    }
    
    function release(address recipient, address[] calldata tokens) external {
        require(msg.sender == releaser, "TokenJar: ONLY_RELEASER");
        // Transfers full accumulated balances to recipient
    }
}`}</pre>
              )}

              {selectedContractTab === 'v3adapter' && (
                <pre>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title V3FeeAdapter - Sweeps V3 Protocol Fee Accruals
contract V3FeeAdapter {
    address public immutable tokenJar;
    
    function collectProtocolFees(address[] calldata pools) external returns (uint256 totalCollected) {
        for (uint256 i = 0; i < pools.length; i++) {
            IUniswapV3Pool(pools[i]).collectProtocol(tokenJar, type(uint128).max, type(uint128).max);
        }
    }
}`}</pre>
              )}

              {selectedContractTab === 'v4policy' && (
                <pre>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title V4FeePolicy - Dynamic Fee Policy & Fraction Control
contract V4FeePolicy {
    mapping(uint24 => uint8) public feeFractions; // e.g. 500 => 5 (1/5th)
    
    function getProtocolFee(PoolKey calldata key) external view returns (uint24) {
        uint8 fraction = feeFractions[key.fee];
        if (fraction == 0) return 0;
        return uint24(key.fee / fraction);
    }
}`}</pre>
              )}

              {selectedContractTab === 'firepit' && (
                <pre>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FirepitReleaser - Permissionless UNI Burn & Release Auction
contract FirepitReleaser {
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address public immutable tokenJar;
    IERC20 public immutable uniToken;
    
    function release(address[] calldata tokens, uint256 maxUniToBurn) external {
        uint256 requiredUni = getCurrentBurnPrice();
        require(requiredUni <= maxUniToBurn, "Firepit: PRICE_EXCEEDED");
        uniToken.transferFrom(msg.sender, BURN_ADDRESS, requiredUni);
        ITokenJar(tokenJar).release(msg.sender, tokens);
    }
}`}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Burn UNI Modal */}
      {isBurnModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsBurnModalOpen(false)}
          title={
            <div className="flex items-center gap-2 text-rose-500 font-bold">
              <Flame className="w-5 h-5" />
              <span>Burn UNI in Firepit Releaser</span>
            </div>
          }
          subtitle={`Unlock ${currentJar.chainName} TokenJar Basket by Burning UNI`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between font-semibold text-rose-500">
                <span>Burn Destination:</span>
                <span className="font-mono">0x0000...dEaD</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Burned UNI tokens are permanently removed from circulating supply. In return, the Firepit contract releases the accrued TokenJar basket to your address.
              </p>
            </div>

            <div>
              <label className="block font-medium text-[var(--text-primary)] mb-1">
                UNI Amount to Burn
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={uniBurnInput}
                  onChange={(e) => setUniBurnInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-sm font-mono text-[var(--text-primary)] outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold font-mono text-[var(--text-tertiary)]">
                  UNI
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Estimated Value Burned:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  ${formatUSD(parseFloat(uniBurnInput || '0') * 8.37)} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Jar Basket Unlocked:</span>
                <span className="font-mono font-bold text-emerald-500">
                  ≈ ${formatUSD(parseFloat(uniBurnInput || '0') * 8.37 * 1.05)} USD
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setIsBurnModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={isBurning}
                onClick={handleExecuteBurn}
              >
                {isBurning ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Burning UNI...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    Confirm Burn
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
