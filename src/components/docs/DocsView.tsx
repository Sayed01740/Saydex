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
  Code2,
  Cpu,
  AlertTriangle,
  GitBranch,
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
    title: 'Protocol Fundamentals',
    items: [
      {
        id: 'intro',
        title: 'System Overview',
        description: 'Protocol architecture, invariants, and execution topology',
      },
      {
        id: 'quickstart',
        title: 'Integration & Usage',
        description: 'Wallet handshake, network selection, and transaction settlement',
      },
      {
        id: 'networks',
        title: 'Network Deployments',
        description: 'RPC endpoints, chain IDs, and gas configuration matrix',
      },
    ],
  },
  {
    title: 'Execution Engine',
    items: [
      {
        id: 'swaps',
        title: 'Swap Routing & Invariants',
        description: 'Quoter v2 heuristics, multi-hop splits, and slippage bounds',
      },
      {
        id: 'limit-orders',
        title: 'Off-Chain Limit Orders',
        description: 'EIP-712 structured digest signing and settlement mechanics',
      },
    ],
  },
  {
    title: 'Liquidity Mechanics',
    items: [
      {
        id: 'liquidity-v3',
        title: 'Concentrated Liquidity Math',
        description: 'Tick indices, virtual reserves, and dynamic range management',
      },
      {
        id: 'fee-tiers',
        title: 'Fee Tiers & Tick Spacing',
        description: 'Tick spacing relationships, fee distributions, and pool parameters',
      },
    ],
  },
  {
    title: 'Contract Reference',
    items: [
      {
        id: 'contracts',
        title: 'Core & Periphery Addresses',
        description: 'Factory, SwapRouter02, PositionManager, and Universal Router',
      },
      {
        id: 'universal-router',
        title: 'Universal Router & Permit2',
        description: 'Command stream bytecode, Permit2 allowance transfer, and execution',
      },
      {
        id: 'security',
        title: 'Security & Threat Model',
        description: 'Reentrancy protection, MEV mitigation, and private RPC relays',
      },
    ],
  },
  {
    title: 'Operational Support',
    items: [
      {
        id: 'faq',
        title: 'Error Codes & Troubleshooting',
        description: 'Revert reasons, slippage exceptions, and on-chain diagnostics',
      },
    ],
  },
];

export const DocsView: React.FC = () => {
  const { setActiveView } = useProtocol();
  const { selectedChain } = useWallet();
  const [activeDoc, setActiveDoc] = useState<DocSectionId>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
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
      {/* Sub-Header Banner */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/70 py-2 px-4 text-center text-xs text-[var(--text-secondary)] font-mono">
        <span className="font-semibold text-[var(--text-primary)]">SAYDEX Protocol Specification v3.2</span>
        {' '}— Production Multi-Chain Deployments —{' '}
        <button
          onClick={() => setActiveView('swap')}
          className="text-[var(--primary)] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1 font-sans"
        >
          <span>Launch Terminal</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {activeDoc === 'home' ? (
        /* PORTAL OVERVIEW (Docusaurus / AchSwap style) */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/20 text-xs font-semibold text-[var(--primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              Technical Documentation
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Protocol Reference
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              In-depth architecture, smart contract interfaces, concentrated liquidity invariants, and Universal Router execution mechanics across EVM chains.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveDoc('intro')}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-[#090B0E] font-bold text-sm hover:opacity-90 transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <span>Read Overview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveDoc('swaps')}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-sm font-semibold transition-all cursor-pointer"
              >
                Router Mechanics
              </button>
              <button
                onClick={() => setActiveDoc('liquidity-v3')}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-sm font-semibold transition-all cursor-pointer"
              >
                Concentrated Math
              </button>
              <button
                onClick={() => setActiveDoc('contracts')}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-sm font-semibold transition-all cursor-pointer"
              >
                Contract Registry
              </button>
            </div>
          </div>

          {/* 3 Core Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Swap Routing */}
            <div
              onClick={() => setActiveDoc('swaps')}
              className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] hover:border-[var(--primary)]/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-subtle)] px-2.5 py-0.5 rounded-md border border-[var(--primary)]/20">
                  Execution Layer
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-between">
                  <span>Routing & Invariants</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)]" />
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Deterministic path evaluation via QuoterV2, sub-graph pool traversal, and atomic multi-hop swap settlement with strict slippage ceilings.
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-subtle)] font-mono">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>exactInputSingle & Multi-Hop</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>Dynamic sqrtPriceLimitX96 checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>Private RPC relay dispatch</span>
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
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  Pools & Math
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>Concentrated Liquidity</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Discrete tick ranges, Q64.96 fixed-point arithmetic, and non-fungible ERC-721 liquidity tokens with autonomous fee harvesting.
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-subtle)] font-mono">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>p(i) = 1.0001^i tick indices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>1, 10, 60, 200 tick spacing tiers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>ERC-721 NonfungiblePositionManager</span>
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
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                  On-Chain Registry
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors flex items-center justify-between">
                  <span>Deployments & ABI</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Canonical contract addresses across Ethereum, Arbitrum, Base, Optimism, Polygon PoS, and BSC, compiled with solc 0.8.20+.
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-subtle)] font-mono">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Deterministic CREATE2 addresses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Universal Router (0x3fC9...7FAD)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Permit2 (0x0000...0001)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Protocol Specifications Panel */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full sm:w-auto font-mono">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  Core Invariant
                </span>
                <strong className="text-sm font-semibold text-[var(--text-primary)] mt-1 block">
                  L = Δy / Δ√P
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  Supported EVMs
                </span>
                <strong className="text-sm font-semibold text-[var(--text-primary)] mt-1 block">
                  7 Mainnets + Sepolia
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  Execution Model
                </span>
                <strong className="text-sm font-semibold text-emerald-400 mt-1 block">
                  Non-Custodial CREATE2
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] block">
                  Software License
                </span>
                <strong className="text-sm font-semibold text-[var(--text-primary)] mt-1 block">
                  MIT Permissive
                </strong>
              </div>
            </div>

            <button
              onClick={() => setActiveDoc('networks')}
              className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <span>View Network Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* INNER DOCS VIEWER (Sidebar + Technical Reader) */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-6">
            <button
              onClick={() => setActiveDoc('home')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 text-[var(--primary)]" />
              <span>Specification Overview</span>
            </button>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search topics, methods, ABIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
              />
            </div>

            {/* Navigation Categories */}
            <nav className="space-y-5">
              {filteredCategories.map((cat) => (
                <div key={cat.title} className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-2 font-mono">
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
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] pb-4 border-b border-[var(--border-subtle)] font-mono">
              <button
                onClick={() => setActiveDoc('home')}
                className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Docs
              </button>
              <span>/</span>
              <span className="text-[var(--primary)] font-semibold">
                {allDocItems.find((i) => i.id === activeDoc)?.title || 'Section'}
              </span>
            </div>

            {/* Dynamic Article Content */}
            <article className="space-y-8">
              {activeDoc === 'intro' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Architecture & Topology
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Protocol Architecture Overview
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    SAYDEX is a decentralized exchange protocol that routes asset trades and concentrates liquidity provisioning across EVM networks. The architecture isolates stateful core pool contracts from stateless peripheral routers to preserve upgrade flexibility without placing liquidity assets at risk.
                  </p>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Non-Custodial Design Properties</span>
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Core pool contracts hold deposited reserves in isolation. All liquidity minting, burns, and swap transfers are executed via verified immutable contracts (<code className="font-mono text-[var(--primary)]">UniswapV3Pool</code>) where tokens can only be transferred with cryptographic approvals (<code className="font-mono text-[var(--primary)]">IERC20.permit</code>, <code className="font-mono text-[var(--primary)]">Permit2</code>, or <code className="font-mono text-[var(--primary)]">IERC20.approve</code>) signed by the asset owner.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">
                      System Topology
                    </h2>
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] font-mono text-xs text-[var(--text-secondary)] overflow-x-auto leading-relaxed">
                      <pre>{`[User Wallet / EIP-1193]
         │
         ├─── (EIP-712 Signature / Gasless) ───► [Permit2 (0x000000000022D473030F116dDEE9F6B43aC78BA3)]
         │                                                      │
         ▼                                                      ▼
[Universal Router (0x3fC9...7FAD)] ──────────────► [AllowanceTransfer]
         │
         ├──► [Uniswap V3 Pool A (0.05%)] ───► swap() -> sqrtPriceLimitX96
         │
         └──► [Uniswap V3 Pool B (0.30%)] ───► swap() -> recipient settlement`}</pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1.5">
                      <strong className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase">Core Contracts (Immutable)</strong>
                      <p className="text-xs text-[var(--text-secondary)]">Holds custody of token pairs. Governs tick states, liquidity accumulators, and fee growth globals.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1.5">
                      <strong className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase">Periphery Routers (Stateless)</strong>
                      <p className="text-xs text-[var(--text-secondary)]">Calculates multi-hop routing, executes slippage safety checks, unwraps native WETH, and sweeps remainders.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'quickstart' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Execution Guide
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Protocol Handshake & Swap Execution
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Executing trades or supplying liquidity via the SAYDEX interface requires a standard EIP-1193 provider connection.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--primary)]">
                        <span className="w-5 h-5 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center">01</span>
                        <span>EIP-1193 Provider Handshake</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-7">
                        The interface requests accounts via <code className="font-mono text-[var(--text-primary)]">eth_requestAccounts</code>. Active chain ID is verified against the network selector using <code className="font-mono text-[var(--text-primary)]">wallet_switchEthereumChain</code> with fallback to <code className="font-mono text-[var(--text-primary)]">wallet_addEthereumChain</code>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--primary)]">
                        <span className="w-5 h-5 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center">02</span>
                        <span>Token Allowance Authorization</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-7">
                        If input token is not native gas token (ETH/BNB/POL), the router checks <code className="font-mono text-[var(--text-primary)]">allowance(owner, routerAddress)</code>. For Universal Router interactions, Permit2 EIP-712 signatures are preferred to eliminate initial gas approvals.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--primary)]">
                        <span className="w-5 h-5 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center">03</span>
                        <span>On-Chain Settlement</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-7">
                        Transactions are dispatched with encoded calldata, specifying <code className="font-mono text-[var(--text-primary)]">amountOutMinimum</code> calculated from chosen slippage tolerance. If pool execution yields fewer tokens than this threshold, the contract atomically reverts.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2 font-mono text-xs">
                    <span className="text-[var(--text-tertiary)] uppercase text-[10px] font-bold">Standard Swap Calldata Interface</span>
                    <pre className="text-[var(--text-primary)] overflow-x-auto">{`struct ExactInputSingleParams {
    address tokenIn;
    address tokenOut;
    uint24 fee;
    address recipient;
    uint256 amountIn;
    uint256 amountOutMinimum;
    uint160 sqrtPriceLimitX96;
}`}</pre>
                  </div>
                </div>
              )}

              {activeDoc === 'networks' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Infrastructure Matrix
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Supported EVM Networks & Endpoints
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    SAYDEX maintains deterministic multi-chain routing across primary EVM layers with redundant JSON-RPC failovers.
                  </p>

                  <div className="overflow-x-auto border border-[var(--border-app)] rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-app)] text-[var(--text-secondary)] font-mono">
                        <tr>
                          <th className="p-3">Network</th>
                          <th className="p-3">Chain ID</th>
                          <th className="p-3">Gas Token</th>
                          <th className="p-3">Primary Public RPC</th>
                          <th className="p-3">Block Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-mono">
                        <tr>
                          <td className="p-3 font-semibold font-sans">Ethereum Mainnet</td>
                          <td className="p-3">1</td>
                          <td className="p-3">ETH (18 dec)</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://eth.llamarpc.com</td>
                          <td className="p-3">~12.0s</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold font-sans">Arbitrum One</td>
                          <td className="p-3">42161</td>
                          <td className="p-3">ETH (18 dec)</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://arb1.arbitrum.io/rpc</td>
                          <td className="p-3">~0.25s</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold font-sans">Base</td>
                          <td className="p-3">8453</td>
                          <td className="p-3">ETH (18 dec)</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://mainnet.base.org</td>
                          <td className="p-3">~2.0s</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold font-sans">Optimism (OP Mainnet)</td>
                          <td className="p-3">10</td>
                          <td className="p-3">ETH (18 dec)</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://mainnet.optimism.io</td>
                          <td className="p-3">~2.0s</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold font-sans">Polygon PoS</td>
                          <td className="p-3">137</td>
                          <td className="p-3">POL (18 dec)</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://polygon-rpc.com</td>
                          <td className="p-3">~2.1s</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold font-sans">BNB Smart Chain</td>
                          <td className="p-3">56</td>
                          <td className="p-3">BNB (18 dec)</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://binance.llamarpc.com</td>
                          <td className="p-3">~3.0s</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold font-sans">Sepolia Testnet</td>
                          <td className="p-3">11155111</td>
                          <td className="p-3">SepoliaETH</td>
                          <td className="p-3 text-[var(--text-tertiary)]">https://rpc.sepolia.org</td>
                          <td className="p-3">~12.0s</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeDoc === 'swaps' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Execution Mathematics
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Swap Routing & Slippage Mechanics
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    SAYDEX queries liquidity pools across fee tiers to synthesize minimal price-impact routes. For single pairs with fragmented depth, paths may split across multi-hop intermediaries (e.g. USDC → WETH → UNI).
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono">
                        Slippage Tolerance Constraint
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Slippage measures pool spot movement between transaction broadcast and inclusion. The interface enforces minimum output using the bounding formula:
                      </p>
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--primary)]">
                        amountOutMinimum = quoteAmountOut * (10000 - slippageBps) / 10000
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                        For an expected quote of 1,000 USDC with a 0.50% (50 bps) slippage ceiling, <code className="font-mono text-[var(--text-primary)]">amountOutMinimum</code> is strictly encoded as 995.000000 USDC.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono">
                        MEV Protection via Private RPC Relays
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Transactions submitted to public mempools are subject to maximal extractable value (MEV) attacks, including sandwich bundles where searchers front-run and back-run user transactions. When MEV Protection is enabled, SAYDEX sends transactions to private block builders (Flashbots Protect, MEV-Blocker), bypassing the public mempool entirely.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'limit-orders' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Off-Chain Settlement
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Off-Chain Signed Limit Orders
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Limit orders on SAYDEX use EIP-712 structured message signatures. Makers define executable parameters off-chain without broadcasting a stateful transaction or paying initial gas.
                  </p>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-3">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase">Order Lifecycle</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                        <strong className="text-[var(--text-primary)] font-mono block">1. Quote</strong>
                        <span className="text-[var(--text-secondary)]">Specify limit price and order expiry deadline.</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                        <strong className="text-[var(--text-primary)] font-mono block">2. EIP-712</strong>
                        <span className="text-[var(--text-secondary)]">Sign structured typed digest in wallet. Zero gas.</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                        <strong className="text-[var(--text-primary)] font-mono block">3. Relayer</strong>
                        <span className="text-[var(--text-secondary)]">Orderbook indexer monitors on-chain pool spot price.</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                        <strong className="text-[var(--text-primary)] font-mono block">4. Settle</strong>
                        <span className="text-[var(--text-secondary)]">Executor submits on-chain batch fill when price cross occurs.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2 font-mono text-xs">
                    <span className="text-[var(--text-tertiary)] uppercase text-[10px] font-bold">EIP-712 Order TypeHash</span>
                    <pre className="text-[var(--text-primary)] overflow-x-auto">{`keccak256("LimitOrder(address maker,address tokenIn,address tokenOut,uint256 amountIn,uint256 minAmountOut,uint256 deadline,uint256 nonce)")`}</pre>
                  </div>
                </div>
              )}

              {activeDoc === 'liquidity-v3' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Concentrated Pools
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      V3 Concentrated Liquidity Mathematics
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    SAYDEX V3 pools segment liquidity into discrete tick boundaries, allowing providers to allocate capital bounded between <code className="font-mono text-[var(--primary)]">tickLower</code> and <code className="font-mono text-[var(--primary)]">tickUpper</code> instead of across infinite price ranges (0, ∞).
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2 font-mono text-xs">
                      <span className="text-[var(--primary)] font-bold uppercase text-[10px]">Price to Tick Index Relation</span>
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                        P(i) = 1.0001^i
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                        Where each tick index <code className="font-mono text-[var(--primary)]">i</code> represents a 0.01% (1 basis point) geometric price increment over the previous tick.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2 font-mono text-xs">
                      <span className="text-[var(--primary)] font-bold uppercase text-[10px]">Virtual Reserves & Liquidity Invariant</span>
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                        L = Δy / (√P_upper - √P_lower) = Δx / (1/√P_lower - 1/√P_upper)
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                        When the current pool price operates within the specified bounds [<code className="font-mono text-[var(--primary)]">tickLower</code>, <code className="font-mono text-[var(--primary)]">tickUpper</code>], capital yields up to 4000x the trading fees compared to an identical capital allocation in a classical constant product (x * y = k) pool.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono">
                        Nonfungible Position Tokens (ERC-721)
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Because concentrated liquidity positions carry unique price ranges and fee growth accumulators, positions are represented by unique ERC-721 non-fungible tokens managed by the canonical <code className="font-mono text-[var(--text-primary)]">NonfungiblePositionManager</code> contract.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'fee-tiers' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Pool Configuration
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Pool Fee Tiers & Tick Spacing Matrix
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Every V3 pool is instantiated with a fixed fee tier and an associated tick spacing multiplier. Tick spacing dictates the minimum allowable granularity for lower and upper position bounds.
                  </p>

                  <div className="overflow-x-auto border border-[var(--border-app)] rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-app)] text-[var(--text-secondary)]">
                        <tr>
                          <th className="p-3">Fee Tier</th>
                          <th className="p-3">Fee (bps)</th>
                          <th className="p-3">Tick Spacing</th>
                          <th className="p-3">Primary Asset Class</th>
                          <th className="p-3">Target Volatility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                        <tr>
                          <td className="p-3 font-semibold text-emerald-400">0.01%</td>
                          <td className="p-3">1</td>
                          <td className="p-3">1</td>
                          <td className="p-3 font-sans">Stablecoins (USDC/USDT, DAI/USDC, LUSD/USDC)</td>
                          <td className="p-3">Near Zero</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--primary)]">0.05%</td>
                          <td className="p-3">5</td>
                          <td className="p-3">10</td>
                          <td className="p-3 font-sans">Blue-Chip Pairs (WETH/USDC, WBTC/ETH, ARB/ETH)</td>
                          <td className="p-3">Low</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-amber-400">0.30%</td>
                          <td className="p-3">30</td>
                          <td className="p-3">60</td>
                          <td className="p-3 font-sans">Standard Altcoin Pairs & General DeFi Tokens</td>
                          <td className="p-3">Medium</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-rose-400">1.00%</td>
                          <td className="p-3">100</td>
                          <td className="p-3">200</td>
                          <td className="p-3 font-sans">Exotic & Low-Liquidity Assets</td>
                          <td className="p-3">High</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">Tick Alignment Constraint</span>
                    <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
                      tickLower % tickSpacing == 0 && tickUpper % tickSpacing == 0
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                      Any attempt to initialize a position with ticks not divisible by the pool's tick spacing parameter will revert with error code <code className="font-mono text-[var(--text-primary)]">TLM</code> (Tick Lower Modulo).
                    </p>
                  </div>
                </div>
              )}

              {activeDoc === 'contracts' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      On-Chain Registry
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Contract Deployments & Canonical Addresses
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    SAYDEX interacts with battle-tested CREATE2 deterministic contract deployments identical across Ethereum, Arbitrum, Base, Optimism, Polygon PoS, and BSC:
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        name: 'Uniswap V3 Factory',
                        role: 'Deploys pools, tracks state, sets default fee tier protocols',
                        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
                        id: 'v3-factory',
                      },
                      {
                        name: 'SwapRouter02',
                        role: 'Standard peripheral router executing exactInputSingle and multi-hop paths',
                        address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
                        id: 'swap-router-02',
                      },
                      {
                        name: 'Universal Router (V4 Pipeline)',
                        role: 'Command-stream multi-protocol executor integrated with Permit2',
                        address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
                        id: 'universal-router',
                      },
                      {
                        name: 'Permit2 Canonical',
                        role: 'Signature-based ERC-20 token allowance manager (EIP-712)',
                        address: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
                        id: 'permit2',
                      },
                      {
                        name: 'NonfungiblePositionManager',
                        role: 'Wraps Uniswap V3 liquidity positions in transferable ERC-721 tokens',
                        address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                        id: 'pos-mgr',
                      },
                      {
                        name: 'QuoterV2',
                        role: 'Stateless on-chain contract for exact pre-execution quote calculation',
                        address: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
                        id: 'quoter-v2',
                      },
                    ].map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-sm text-[var(--text-primary)] font-mono">{c.name}</strong>
                          <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{c.role}</p>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs">
                          <span className="truncate text-[var(--text-primary)]">{c.address}</span>
                          <button
                            onClick={() => handleCopy(c.address, c.id)}
                            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 ml-2"
                            title="Copy address"
                          >
                            {copiedKey === c.id ? (
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
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Execution Bytecode
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Universal Router & Permit2 Specification
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Universal Router executes sequential commands packed as single-byte opcodes within a <code className="font-mono text-[var(--primary)]">bytes commands</code> payload, paired with an array of ABI-encoded parameter bytes.
                  </p>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-3">
                    <h3 className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                      Universal Router Command Opcode Suite
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          <tr>
                            <th className="p-2">Opcode</th>
                            <th className="p-2">Command Identifier</th>
                            <th className="p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                          <tr>
                            <td className="p-2 text-[var(--primary)] font-bold">0x00</td>
                            <td className="p-2">V3_SWAP_EXACT_IN</td>
                            <td className="p-2 font-sans">Performs exact input single or multi-hop swap on Uniswap V3</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-[var(--primary)] font-bold">0x01</td>
                            <td className="p-2">V3_SWAP_EXACT_OUT</td>
                            <td className="p-2 font-sans">Performs exact output swap on Uniswap V3</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-[var(--primary)] font-bold">0x04</td>
                            <td className="p-2">SWEEP</td>
                            <td className="p-2 font-sans">Sweeps leftover token balances from the router to the recipient</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-[var(--primary)] font-bold">0x08</td>
                            <td className="p-2">V2_SWAP_EXACT_IN</td>
                            <td className="p-2 font-sans">Executes swaps through legacy constant product pools</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-[var(--primary)] font-bold">0x0a</td>
                            <td className="p-2">PERMIT2_PERMIT</td>
                            <td className="p-2 font-sans">Consumes an off-chain EIP-712 Permit2 signature</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-[var(--primary)] font-bold">0x0b</td>
                            <td className="p-2">WRAP_ETH</td>
                            <td className="p-2 font-sans">Wraps native ETH sent in msg.value into WETH</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-[var(--primary)] font-bold">0x0c</td>
                            <td className="p-2">UNWRAP_WETH</td>
                            <td className="p-2 font-sans">Unwraps router WETH balance and transfers native ETH to recipient</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2 font-mono text-xs">
                    <span className="text-[var(--text-tertiary)] uppercase text-[10px] font-bold">Router Solidity Interface</span>
                    <pre className="text-[var(--text-primary)] overflow-x-auto">{`function execute(
    bytes calldata commands,
    bytes[] calldata inputs,
    uint256 deadline
) external payable;`}</pre>
                  </div>
                </div>
              )}

              {activeDoc === 'security' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Security & Audits
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Security Architecture & Threat Mitigation
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    SAYDEX prioritizes non-custodial asset isolation and defense-in-depth across front-end relays and on-chain contract executions.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span>Reentrancy Protection</span>
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        All pool contracts employ strict reentrancy locks during pool balance modifications. Transient state unlocks only after callback settlement, eliminating external vector attacks.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Permit2 Expiration Windows</span>
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Unlike traditional infinite token approvals (<code className="font-mono text-[var(--text-primary)]">type(uint256).max</code>) that persist indefinitely, Permit2 permits enforce an explicit expiration timestamp (<code className="font-mono text-[var(--text-primary)]">deadline</code>) and single-use nonces, mitigating token allowance drain risks.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <span>Direct-to-Builder MEV Shielding</span>
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        When enabled, transactions avoid mempool listening nodes by relaying transactions over bundle RPCs directly to verified block builders (Flashbots / Titan / BeaverBuild), neutralizing predatory front-running and sandwich attacks.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeDoc === 'faq' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
                      Diagnostics
                    </span>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      Error Codes & Diagnostic Troubleshooting
                    </h1>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    When on-chain calls fail or transactions revert, contracts emit compact string error codes. Use this index to diagnose revert causes:
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-rose-400 font-bold">SPL / STF / Transaction Reverted</strong>
                        <span className="text-[10px] text-[var(--text-tertiary)]">Slippage Limit Exceeded</span>
                      </div>
                      <p className="text-[var(--text-secondary)] font-sans text-xs">
                        The pool price moved outside your configured slippage ceiling before block inclusion. Solution: Increase slippage tolerance from 0.5% to 1.0% in Settings or enable MEV Protection to avoid price manipulation.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-rose-400 font-bold">TF / STF</strong>
                        <span className="text-[10px] text-[var(--text-tertiary)]">TransferFrom Failed</span>
                      </div>
                      <p className="text-[var(--text-secondary)] font-sans text-xs">
                        The input token allowance is lower than the amount being traded, or the wallet balance changed between quote and execution. Solution: Authorize sufficient allowance or check your token balance.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-rose-400 font-bold">TLU / TUP</strong>
                        <span className="text-[10px] text-[var(--text-tertiary)]">Tick Lower / Upper Bound Invalid</span>
                      </div>
                      <p className="text-[var(--text-secondary)] font-sans text-xs">
                        Attempted to mint a position where tickLower &gt;= tickUpper, or ticks did not match the pool's required tick spacing. Solution: Re-align price bounds in the liquidity interface.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-rose-400 font-bold">EXPIRED / SignatureExpired</strong>
                        <span className="text-[10px] text-[var(--text-tertiary)]">Permit2 Deadline Reached</span>
                      </div>
                      <p className="text-[var(--text-secondary)] font-sans text-xs">
                        The EIP-712 Permit2 cryptographic signature expired before transaction inclusion on-chain. Solution: Re-sign the prompt with a refreshed timestamp.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </article>

            {/* Bottom Pagination */}
            <div className="pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4 font-mono text-xs">
              {prevDoc ? (
                <button
                  onClick={() => {
                    setActiveDoc(prevDoc.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-2 font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
                  className="flex items-center gap-2 font-semibold text-[var(--primary)] hover:underline transition-colors cursor-pointer"
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
