import React, { useState, useMemo } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import {
  BookOpen,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Search,
  ShieldCheck,
  ArrowLeftRight,
  Droplets,
  FileCode2,
  ChevronRight,
  Layers,
  HelpCircle,
  Terminal,
  Compass,
  CheckCircle2,
  Network,
  Zap,
  Lock,
  Flame,
  ArrowUpRight,
  Home,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type DocSectionId =
  | 'home'
  | 'intro'
  | 'quickstart'
  | 'networks'
  | 'swaps'
  | 'limit-orders'
  | 'liquidity-v3'
  | 'fee-tiers'
  | 'contracts'
  | 'universal-router'
  | 'security'
  | 'faq';

interface DocNavCategory {
  title: string;
  items: {
    id: DocSectionId;
    title: string;
    description: string;
  }[];
}

const DOC_CATEGORIES: DocNavCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        id: 'intro',
        title: 'Introduction',
        description: 'What is Saydex Protocol and how does it work?',
      },
      {
        id: 'quickstart',
        title: 'Quick Start',
        description: 'Connect wallet, select network, and execute your first swap',
      },
      {
        id: 'networks',
        title: 'Supported Networks',
        description: 'Ethereum, Arbitrum, Base, Optimism, Polygon, BSC, Sepolia',
      },
    ],
  },
  {
    title: 'Products & Trading',
    items: [
      {
        id: 'swaps',
        title: 'Token Swaps & Routing',
        description: 'Smart order routing, slippage control, and price impact',
      },
      {
        id: 'limit-orders',
        title: 'Limit Orders & Gasless',
        description: 'EIP-712 off-chain signed limit orders with automated execution',
      },
    ],
  },
  {
    title: 'Liquidity & Pools',
    items: [
      {
        id: 'liquidity-v3',
        title: 'V3 Concentrated Liquidity',
        description: 'Provide capital in custom tick ranges for up to 4000x efficiency',
      },
      {
        id: 'fee-tiers',
        title: 'Pool Fee Tiers',
        description: '0.01% stables, 0.05% standard pairs, 0.30% general, 1.00% exotic',
      },
    ],
  },
  {
    title: 'Technical & Contracts',
    items: [
      {
        id: 'contracts',
        title: 'Contract Addresses',
        description: 'Verified factory, router, and position manager deployments',
      },
      {
        id: 'universal-router',
        title: 'Universal Router (V4)',
        description: 'Atomic batch execution with Permit2 integration',
      },
      {
        id: 'security',
        title: 'Security & Non-Custodial Safety',
        description: 'Audited smart contracts, MEV shielding, and private RPCs',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'faq',
        title: 'FAQ & Troubleshooting',
        description: 'Solutions for common transaction and slippage questions',
      },
    ],
  },
];

export const DocsView: React.FC = () => {
  const { setActiveView } = useProtocol();
  const { selectedChain } = useWallet();
  const [activeDoc, setActiveDoc] = useState<DocSectionId>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DOC_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return DOC_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  // Find next and previous documentation articles
  const allDocItems = useMemo(
    () => DOC_CATEGORIES.flatMap((c) => c.items),
    []
  );
  const currentIdx = allDocItems.findIndex((item) => item.id === activeDoc);
  const prevDoc = currentIdx > 0 ? allDocItems[currentIdx - 1] : null;
  const nextDoc =
    currentIdx >= 0 && currentIdx < allDocItems.length - 1
      ? allDocItems[currentIdx + 1]
      : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Banner (AchSwap style) */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] py-2 px-4 text-center text-xs text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Saydex Protocol Documentation</span>
        {' '}· Routing on Ethereum, Arbitrum, Base, Optimism, Polygon & BSC ·{' '}
        <button
          onClick={() => setActiveView('swap')}
          className="text-[var(--primary)] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
        >
          <span>Launch App</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {activeDoc === 'home' ? (
        /* HOMEPAGE VIEW (Exact AchSwap Portal Style) */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/20 text-xs font-semibold text-[var(--primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              Official Documentation
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Saydex Documentation
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Decentralized swaps, concentrated liquidity provisioning, and Universal Router execution on EVM Multi-Chain networks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveDoc('intro')}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-[#090B0E] font-bold text-sm hover:opacity-90 transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <span>Start Reading</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDoc('swaps')}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-sm font-semibold transition-all cursor-pointer"
              >
                Swaps & Routing
              </button>
              <button
                onClick={() => setActiveDoc('liquidity-v3')}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-sm font-semibold transition-all cursor-pointer"
              >
                Liquidity Pools
              </button>
              <button
                onClick={() => setActiveDoc('contracts')}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-sm font-semibold transition-all cursor-pointer"
              >
                Smart Contracts
              </button>
            </div>
          </div>

          {/* 3 Core Feature Cards Grid (Like AchSwap docs) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Swap */}
            <div
              onClick={() => setActiveDoc('swaps')}
              className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] hover:border-[var(--primary)]/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-subtle)] px-2.5 py-0.5 rounded-md border border-[var(--primary)]/20">
                  Trading Guide
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-between">
                  <span>Swap & Routing</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)]" />
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Compare on-chain quotes, inspect multi-hop routes, set customized slippage tolerance, and execute swaps across EVM networks.
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-subtle)]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>Instant token swaps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>Split & multi-hop route maps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>MEV protected private RPC routing</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2: Liquidity */}
            <div
              onClick={() => setActiveDoc('liquidity-v3')}
              className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] hover:border-[var(--primary)]/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  Pools & Earn
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Concentrated Liquidity</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Provide liquidity in Saydex V3 concentrated positions, collect trading fees, and manage dynamic NFT position ranges.
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-subtle)]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Up to 4000x capital efficiency</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Customizable tick ranges & fee tiers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Non-fungible ERC-721 LP tokens</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: Contracts */}
            <div
              onClick={() => setActiveDoc('contracts')}
              className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] hover:border-[var(--primary)]/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                  Technical Reference
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors flex items-center justify-between">
                  <span>Contract Addresses</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Verify on-chain deployments for Uniswap V3 Factory, SwapRouter02, Universal Router (V4), and Position Manager.
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-subtle)]">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Ethereum, Arbitrum, Base, Optimism</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Universal Router (0x10 command suite)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Open-source & fully audited</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Network Spec Panel (AchSwap style) */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full sm:w-auto">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  Core Engine
                </span>
                <strong className="text-sm font-semibold text-[var(--text-primary)] mt-1 block">
                  Uniswap V3 / V4
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  Networks
                </span>
                <strong className="text-sm font-semibold text-[var(--text-primary)] mt-1 block">
                  7+ Major EVMs
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  Custody
                </span>
                <strong className="text-sm font-semibold text-emerald-400 mt-1 block">
                  100% Non-Custodial
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  License
                </span>
                <strong className="text-sm font-semibold text-[var(--text-primary)] mt-1 block">
                  MIT Open Source
                </strong>
              </div>
            </div>

            <button
              onClick={() => setActiveDoc('networks')}
              className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Explore Network Setup</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* INNER DOCS VIEWER (Sidebar + Content View) */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            {/* Quick Back to Docs Home */}
            <button
              onClick={() => setActiveDoc('home')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 text-[var(--primary)]" />
              <span>Docs Overview</span>
            </button>

            {/* Instant Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
              />
            </div>

            {/* Navigation Categories */}
            <nav className="space-y-5">
              {filteredCategories.map((cat) => (
                <div key={cat.title} className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-2">
                    {cat.title}
                  </span>
                  <div className="space-y-0.5 pt-1">
                    {cat.items.map((item) => {
                      const isActive = activeDoc === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveDoc(item.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold border border-[var(--primary)]/20'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] pb-4 border-b border-[var(--border-subtle)]">
              <button
                onClick={() => setActiveDoc('home')}
                className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Docs
              </button>
              <span>/</span>
              <span className="text-[var(--primary)] font-semibold">
                {allDocItems.find((i) => i.id === activeDoc)?.title || 'Article'}
              </span>
            </div>

            {/* Dynamic Article Rendering */}
            <article className="prose prose-invert max-w-none space-y-6">
              {activeDoc === 'intro' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Introduction to Saydex Protocol
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Saydex Protocol is an open-source, non-custodial decentralized trading terminal and concentrated liquidity routing interface. It bridges users, professional traders, and automated liquidity providers directly to battle-tested Ethereum Virtual Machine (EVM) decentralized exchange protocols.
                  </p>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                      <span>Non-Custodial Guarantee</span>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Saydex does not manage, store, or have access to user funds. Every trade and liquidity transaction is executed via deterministic on-chain smart contracts cryptographically authorized by your private wallet key.
                    </p>
                  </div>

                  <h2 className="text-xl font-bold text-[var(--text-primary)] pt-2">
                    Core Architectural Advantages
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Concentrated Liquidity</span>
                      <p className="text-xs text-[var(--text-secondary)]">Liquidity providers allocate assets within custom price ranges, dramatically enhancing depth and fee revenue.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Universal Router</span>
                      <p className="text-xs text-[var(--text-secondary)]">Next-generation execution pipeline combining Permit2 allowances and multi-hop token swaps in a single transaction.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'quickstart' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Quick Start Guide
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Get started trading and providing liquidity on Saydex in three simple steps:
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                        <span className="w-6 h-6 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center text-xs">1</span>
                        <span>Connect Your Web3 Wallet</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] pl-8">
                        Click <strong>Connect Wallet</strong> in the top-right header. Saydex supports MetaMask, Coinbase Wallet, Phantom, Rabby, Ledger, and 300+ mobile wallets via WalletConnect v2.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                        <span className="w-6 h-6 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center text-xs">2</span>
                        <span>Select Your Preferred Network</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] pl-8">
                        Use the network selector in the top bar to choose between Ethereum, Arbitrum One, Base, Optimism, Polygon, or BNB Chain.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                        <span className="w-6 h-6 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center text-xs">3</span>
                        <span>Execute Swap or Deposit Liquidity</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] pl-8">
                        Enter the token pair and amount. Review the real-time quote, slippage, and estimated network gas cost, then click <strong>Swap</strong> and confirm in your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'networks' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Supported Networks & RPCs
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Saydex integrates multi-chain EVM routing with automatic RPC failover to ensure uninterrupted connectivity even during network congestion.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[var(--border-app)] rounded-xl overflow-hidden">
                      <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-app)] text-[var(--text-secondary)]">
                        <tr>
                          <th className="p-3">Network</th>
                          <th className="p-3">Chain ID</th>
                          <th className="p-3">Gas Token</th>
                          <th className="p-3">Default RPC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-mono">
                        <tr>
                          <td className="p-3 font-sans font-semibold">Ethereum Mainnet</td>
                          <td className="p-3">1</td>
                          <td className="p-3 font-sans">ETH</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://eth.llamarpc.com</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-semibold">Arbitrum One</td>
                          <td className="p-3">42161</td>
                          <td className="p-3 font-sans">ETH</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://arb1.arbitrum.io/rpc</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-semibold">Optimism</td>
                          <td className="p-3">10</td>
                          <td className="p-3 font-sans">ETH</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://mainnet.optimism.io</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-semibold">Base</td>
                          <td className="p-3">8453</td>
                          <td className="p-3 font-sans">ETH</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://mainnet.base.org</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-semibold">Polygon PoS</td>
                          <td className="p-3">137</td>
                          <td className="p-3 font-sans">POL</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://polygon-rpc.com</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-semibold">BNB Smart Chain</td>
                          <td className="p-3">56</td>
                          <td className="p-3 font-sans">BNB</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://binance.llamarpc.com</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-sans font-semibold">Sepolia Testnet</td>
                          <td className="p-3">11155111</td>
                          <td className="p-3 font-sans">SepoliaETH</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://rpc.sepolia.org</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeDoc === 'swaps' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Token Swaps & Smart Order Routing
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Saydex utilizes on-chain Quoter contracts and routing heuristics to discover the best execution path across all available liquidity pools.
                  </p>

                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Slippage Tolerance</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Slippage is the difference between the expected price of a trade and the executed price. Saydex provides an <strong>Auto (0.5%)</strong> preset suitable for liquid assets, while custom slippage (0.1% - 5.0%) can be configured in Trade Settings.
                    </p>

                    <h3 className="text-base font-bold text-[var(--text-primary)] pt-2">MEV & Front-Running Protection</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      When enabled in Settings, transactions can be dispatched directly to private builder nodes (Flashbots / private mempools) to protect users from sandwich attacks and front-running bots.
                    </p>
                  </div>
                </div>
              )}

              {activeDoc === 'limit-orders' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Limit Orders & Gasless Submissions
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Saydex supports off-chain signed limit orders allowing users to define exact target prices without spending upfront gas.
                  </p>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                    <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">How it works</span>
                    <ol className="list-decimal pl-5 text-xs text-[var(--text-secondary)] space-y-1.5 leading-relaxed">
                      <li>Select <strong>Limit</strong> in the swap card header.</li>
                      <li>Specify your sell token, buy token, and target price (e.g. +5% above market).</li>
                      <li>Sign the off-chain cryptographic intent in your wallet (Zero gas consumed).</li>
                      <li>When market prices reach your threshold, on-chain executors settle the trade automatically.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeDoc === 'liquidity-v3' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    V3 Concentrated Liquidity Pools
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    In standard constant-product AMMs (x * y = k), capital is spread uniformly across prices from 0 to infinity. In Saydex V3, liquidity providers concentrate capital within custom price bounds:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1.5">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Higher Capital Efficiency</span>
                      <p className="text-xs text-[var(--text-secondary)]">Earn the same or higher trading fees with up to 99% less capital committed to the pool.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1.5">
                      <span className="font-bold text-sm text-[var(--text-primary)]">ERC-721 NFT Positions</span>
                      <p className="text-xs text-[var(--text-secondary)]">Each position is minted as a distinct non-fungible token containing your customized tick parameters.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'fee-tiers' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Pool Fee Tiers
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Saydex pools support four distinct fee tiers tailored to asset volatility:
                  </p>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-[var(--text-primary)]">0.01% Fee Tier (1 bps)</strong>
                        <p className="text-xs text-[var(--text-secondary)]">Optimized for highly correlated stablecoin pairs (USDC/USDT, DAI/USDC).</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Stable</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-[var(--text-primary)]">0.05% Fee Tier (5 bps)</strong>
                        <p className="text-xs text-[var(--text-secondary)]">High-volume bluechip pairs (ETH/USDC, WBTC/ETH).</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[var(--primary)] bg-[var(--primary-subtle)] px-2 py-1 rounded">Popular</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-[var(--text-primary)]">0.30% Fee Tier (30 bps)</strong>
                        <p className="text-xs text-[var(--text-secondary)]">Standard market pairs and general altcoins.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Standard</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-between">
                      <div>
                        <strong className="text-sm text-[var(--text-primary)]">1.00% Fee Tier (100 bps)</strong>
                        <p className="text-xs text-[var(--text-secondary)]">Exotic pairs, low liquidity tokens, and higher volatility assets.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">Exotic</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'contracts' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Verified Smart Contract Deployments
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Saydex routes execution through standardized, audited core and peripheral smart contracts across EVM networks:
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        name: 'Uniswap V3 Factory',
                        desc: 'Deploys concentrated liquidity pools and controls fee tiers',
                        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
                        id: 'factory',
                      },
                      {
                        name: 'SwapRouter02',
                        desc: 'Multi-hop swap routing and token payment settlement',
                        address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
                        id: 'router02',
                      },
                      {
                        name: 'NonfungiblePositionManager',
                        desc: 'Mints and manages concentrated liquidity positions as ERC-721 NFTs',
                        address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                        id: 'position-mgr',
                      },
                      {
                        name: 'Universal Router (V4)',
                        desc: 'Flexible batch execution pipeline supporting Permit2 and multi-protocol settlement',
                        address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
                        id: 'universal-router',
                      },
                    ].map((contract) => (
                      <div
                        key={contract.id}
                        className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-sm text-[var(--text-primary)]">{contract.name}</strong>
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{contract.desc}</p>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs">
                          <span className="truncate text-[var(--text-primary)]">{contract.address}</span>
                          <button
                            onClick={() => handleCopy(contract.address, contract.id)}
                            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 ml-2"
                            title="Copy address"
                          >
                            {copiedContract === contract.id ? (
                              <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeDoc === 'universal-router' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Universal Router & Permit2 (V4)
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    The Universal Router unifies token swaps and NFT execution into an extensible single-transaction command pipeline.
                  </p>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                    <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Permit2 Integration</span>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Traditional ERC-20 approvals require on-chain gas for every new protocol. With Permit2, approvals are signed via off-chain EIP-712 cryptographic signatures, allowing gasless permissions that expire automatically after a deadline.
                    </p>
                  </div>
                </div>
              )}

              {activeDoc === 'security' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Security & Non-Custodial Architecture
                  </h1>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Saydex is architected on the premise that user security is paramount in decentralized finance.
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Audited Smart Contracts</span>
                      <p className="text-xs text-[var(--text-secondary)]">All trades execute via battle-tested Uniswap V3 core and Universal Router contracts with billions in verified historical volume.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Zero Front-Running Exposure</span>
                      <p className="text-xs text-[var(--text-secondary)]">Optional MEV shield dispatches transactions directly to block builders, bypassing public mempools vulnerable to predatory bots.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'faq' && (
                <div className="space-y-6">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
                    Frequently Asked Questions
                  </h1>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1.5">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Why did my transaction revert or fail?</span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        The most common reason for a reverted swap is slippage exceeding your configured tolerance during volatile market movement. Increasing slippage slightly (e.g. from 0.5% to 1.0%) in Trade Settings resolves this.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1.5">
                      <span className="font-bold text-sm text-[var(--text-primary)]">Are there any deposit or withdrawal fees?</span>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        No. Saydex is completely non-custodial. You only pay standard blockchain network gas fees and the pool trading fee that goes 100% to liquidity providers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </article>

            {/* Bottom Navigation Pagination (Previous / Next Article) */}
            <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
              {prevDoc ? (
                <button
                  onClick={() => {
                    setActiveDoc(prevDoc.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Previous: {prevDoc.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextDoc ? (
                <button
                  onClick={() => {
                    setActiveDoc(nextDoc.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:underline transition-colors cursor-pointer"
                >
                  <span>Next: {nextDoc.title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
