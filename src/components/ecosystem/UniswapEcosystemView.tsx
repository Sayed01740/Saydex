import React, { useState, useMemo } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import {
  UNISWAP_REPOSITORIES_DATA,
  MOCK_DUTCH_AUCTION_ORDERS,
  V4_PRESET_HOOKS,
} from '../../data/uniswapRepositoriesData';
import {
  UniswapRepoItem,
  RepoCategory,
  DutchAuctionOrder,
  V4HookDefinition,
} from '../../types/uniswapEcosystem';
import { Button } from '../common/Button';
import {
  GitFork,
  Star,
  ExternalLink,
  Search,
  Filter,
  Code,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Activity,
  Boxes,
  Database,
  Flame,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Scale,
  Globe,
  Sliders,
  Play,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type HubTab = 'repositories' | 'uniswapx' | 'v4_hooks' | 'sor_routing' | 'seatbelt';

export const UniswapEcosystemView: React.FC = () => {
  const { addToast } = useProtocol();
  const [activeTab, setActiveTab] = useState<HubTab>('repositories');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<UniswapRepoItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // UniswapX Dutch Auction State
  const [dutchOrders, setDutchOrders] = useState<DutchAuctionOrder[]>(MOCK_DUTCH_AUCTION_ORDERS);
  const [auctionInAmount, setAuctionInAmount] = useState('5.0');
  const [auctionTokenIn, setAuctionTokenIn] = useState('ETH');
  const [auctionTokenOut, setAuctionTokenOut] = useState('USDC');
  const [auctionStartUSD, setAuctionStartUSD] = useState('17,650');
  const [auctionEndUSD, setAuctionEndUSD] = useState('17,350');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // v4 Hook Builder State
  const [selectedHookPreset, setSelectedHookPreset] = useState<V4HookDefinition>(V4_PRESET_HOOKS[0]);
  const [customHookName, setCustomHookName] = useState('CustomAlphaHook');
  const [hookFlags, setHookFlags] = useState({
    beforeInitialize: false,
    afterInitialize: true,
    beforeAddLiquidity: false,
    afterAddLiquidity: true,
    beforeRemoveLiquidity: false,
    afterRemoveLiquidity: false,
    beforeSwap: true,
    afterSwap: true,
    beforeDonate: false,
    afterDonate: false,
    beforeSwapReturnDelta: true,
    afterSwapReturnDelta: false,
  });
  const [isMiningSalt, setIsMiningSalt] = useState(false);
  const [minedAddress, setMinedAddress] = useState<string | null>('0x00803a1B920FE4e39818A4c02283088C318C0080');

  // SOR Split Router Demo State
  const [sorAmount, setSorAmount] = useState('50,000');
  const [sorTokenPair, setSorTokenPair] = useState('USDC/ETH');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered repositories
  const filteredRepos = useMemo(() => {
    return UNISWAP_REPOSITORIES_DATA.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || repo.category === selectedCategory;
      const matchesLang = selectedLanguage === 'all' || repo.language === selectedLanguage;

      return matchesSearch && matchesCat && matchesLang;
    });
  }, [searchQuery, selectedCategory, selectedLanguage]);

  // Categories config
  const categoryList: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'All 173 Repositories', count: 173 },
    { id: 'core_amm', label: 'Core AMMs (v4, v3, v2)', count: 28 },
    { id: 'routing_execution', label: 'Routing & Universal Router', count: 24 },
    { id: 'uniswapx', label: 'UniswapX Dutch Protocols', count: 16 },
    { id: 'v4_hooks', label: 'v4 Hooks & Extensions', count: 32 },
    { id: 'sdks_tooling', label: 'SDKs, Monorepos & Tools', count: 35 },
    { id: 'governance_fees', label: 'DAO Governance & Fees', count: 14 },
    { id: 'subgraphs_data', label: 'Subgraphs & GraphQL', count: 12 },
    { id: 'interfaces_mobile', label: 'Web & Mobile Clients', count: 8 },
    { id: 'unichain_infra', label: 'Unichain L2 Infrastructure', count: 4 },
  ];

  // Submit Dutch Auction Order
  const handleCreateDutchOrder = () => {
    setIsSubmittingOrder(true);
    setTimeout(() => {
      setIsSubmittingOrder(false);
      const newOrder: DutchAuctionOrder = {
        id: `order-${Date.now()}`,
        orderHash: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...${Math.floor(Math.random() * 1000)}`,
        swapper: '0xSelf...Wallet',
        tokenIn: `${auctionInAmount} ${auctionTokenIn}`,
        tokenInAmount: `${parseFloat(auctionInAmount) * 1e18}`,
        tokenOut: auctionTokenOut,
        startAmountOut: `${auctionStartUSD} ${auctionTokenOut}`,
        endAmountOut: `${auctionEndUSD} ${auctionTokenOut}`,
        decayStartTime: Date.now(),
        decayEndTime: Date.now() + 1000 * 90,
        currentDecayedAmountOut: `${auctionStartUSD} ${auctionTokenOut}`,
        decayPercent: 0,
        status: 'decaying',
        gasCostUSD: 0,
        exclusivePeriodSeconds: 15,
      };
      setDutchOrders((prev) => [newOrder, ...prev]);
      addToast({
        type: 'success',
        title: 'UniswapX Dutch Order Signed & Broadcast',
        description: `Order ${newOrder.orderHash} entered Dutch auction filler pool with 0 gas cost!`,
      });
    }, 800);
  };

  // Mine v4 Hook Salt
  const handleMineHookAddress = () => {
    setIsMiningSalt(true);
    setTimeout(() => {
      setIsMiningSalt(false);
      const randomSalt = Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setMinedAddress(`0x00A0${randomSalt}b91...${selectedHookPreset.hookFlagsHex.slice(2)}`);
      addToast({
        type: 'success',
        title: 'Foundry CREATE2 Hook Salt Found',
        description: `Valid address prefix matching hook permission bitmask (${selectedHookPreset.hookFlagsHex}) mined!`,
      });
    }, 1200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-app)] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20 text-xs font-semibold">
                <Boxes className="w-3.5 h-3.5" />
                Uniswap GitHub Organization
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
                <Globe className="w-3.5 h-3.5" />
                173 Open-Source Repositories
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono">
                Solidity • TypeScript • Go • Rust
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Uniswap Protocol Ecosystem & Repository Matrix
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-3xl">
              Complete architectural hub and live execution workbench mapping all 173 Uniswap repositories: from v4-core Singleton AMMs & custom Hooks to UniswapX Dutch auctions, Smart Order Routing (SOR), Permit2 signature vaults, and Unichain L2 infrastructure.
            </p>
          </div>

          {/* Org Stats Card */}
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center gap-4">
              <div>
                <div className="text-xs text-[var(--text-tertiary)]">Total Stars</div>
                <div className="text-lg font-bold font-mono text-[var(--text-primary)]">38,400+ ⭐</div>
              </div>
              <div className="w-px h-8 bg-[var(--border-subtle)]" />
              <div>
                <div className="text-xs text-[var(--text-tertiary)]">Total Forks</div>
                <div className="text-lg font-bold font-mono text-pink-500">19,200+ 🔱</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ecosystem Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">Core AMM Generations</span>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">V1 • V2 • V3 • V4</div>
            <span className="text-[10px] text-pink-500">Continuous 7-Year Evolution</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">Routing Protocols</span>
            <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">SOR + Universal + X</div>
            <span className="text-[10px] text-[var(--text-secondary)]">Gasless & Multi-hop</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">v4 Hook Primitives</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">14 Callbacks</div>
            <span className="text-[10px] text-emerald-500">Prefix-bitmask mining</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">Developer Tooling</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">Unified Monorepo</div>
            <span className="text-[10px] text-[var(--text-secondary)]">@uniswap/sdks NPM</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[var(--border-subtle)]">
        {[
          { id: 'repositories', label: '173 Repositories Matrix & Directory', icon: Boxes },
          { id: 'uniswapx', label: 'UniswapX Dutch Auction & Filler Simulator', icon: Sparkles },
          { id: 'v4_hooks', label: 'Uniswap v4 Hook Lab & Salt Miner', icon: Cpu },
          { id: 'sor_routing', label: 'Smart Order Router (SOR) Split-Path', icon: Layers },
          { id: 'seatbelt', label: 'Governance Seatbelt & Proposal Auditor', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-app)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: 173 Repositories Matrix & Directory */}
      {activeTab === 'repositories' && (
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search across all 173 repositories by name, feature, hook, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] outline-none cursor-pointer"
              >
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] outline-none cursor-pointer"
              >
                <option value="all">All Languages</option>
                <option value="Solidity">Solidity</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Go">Go</option>
                <option value="Vyper">Vyper</option>
              </select>
            </div>
          </div>

          {/* Repositories Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => {
              const langBadgeColor: Record<string, string> = {
                Solidity: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                TypeScript: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                Go: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                Vyper: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
              };

              return (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo)}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] hover:border-pink-500/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-pink-500 transition-colors">
                            {repo.name}
                          </h3>
                          {repo.badge && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                              {repo.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-[var(--text-tertiary)]">{repo.repoName}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${langBadgeColor[repo.language] || 'bg-gray-500/10 text-gray-400'}`}>
                        {repo.language}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                      {repo.description}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {repo.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-tertiary)] text-[10px] font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-tertiary)] font-mono">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3.5 h-3.5" />
                        {repo.forks.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-pink-400 group-hover:translate-x-0.5 transition-transform font-sans font-semibold">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Repo Detail Inspector Drawer / Modal */}
          <AnimatePresence>
            {selectedRepo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl no-scrollbar"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedRepo.name}</h2>
                        {selectedRepo.badge && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                            {selectedRepo.badge}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {selectedRepo.language}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--text-tertiary)]">{selectedRepo.repoName}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={selectedRepo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>GitHub</span>
                      </a>
                      <button
                        onClick={() => setSelectedRepo(null)}
                        className="p-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {selectedRepo.description}
                  </p>

                  {/* Architecture Summary */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 uppercase tracking-wider">
                      <Cpu className="w-3.5 h-3.5 text-pink-500" />
                      Architecture Summary
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {selectedRepo.architectureSummary}
                    </p>
                  </div>

                  {/* Key Features List */}
                  {selectedRepo.keyFeatures && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Key Features & Capabilities
                      </h4>
                      <div className="space-y-1.5">
                        {selectedRepo.keyFeatures.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Code Snippet if available */}
                  {selectedRepo.sampleCode && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-purple-400" />
                          Code Reference
                        </h4>
                        <button
                          onClick={() => handleCopy(selectedRepo.sampleCode!, 'sample-code')}
                          className="text-xs text-pink-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          {copiedText === 'sample-code' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          Copy Code
                        </button>
                      </div>
                      <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto whitespace-pre">
                        {selectedRepo.sampleCode}
                      </div>
                    </div>
                  )}

                  {/* Quick Meta Stats */}
                  <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-tertiary)]">License</div>
                      <div className="font-bold text-[var(--text-primary)] mt-0.5">{selectedRepo.license}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-tertiary)]">NPM Package</div>
                      <div className="font-bold text-pink-400 truncate mt-0.5">{selectedRepo.npmPackage || 'N/A'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-tertiary)]">Solidity/Target</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{selectedRepo.solidityVersion || 'v0.8.24+'}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tab 2: UniswapX Dutch Auction & Filler Simulator */}
      {activeTab === 'uniswapx' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              UniswapX Dutch Auction Protocol Simulator (Uniswap/UniswapX)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-3xl">
              UniswapX is a permissionless Dutch auction settlement protocol where swappers sign off-chain orders with decaying output requirements. Third-party fillers (market makers and MEV searchers) compete to fill the order at the best available price with zero gas cost to the user.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create Dutch Order */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  Sign Off-Chain Dutch Order (EIP-712)
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)] font-semibold">You Provide (Token In)</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={auctionInAmount}
                        onChange={(e) => setAuctionInAmount(e.target.value)}
                        className="flex-1 bg-[var(--bg-subtle)] text-[var(--text-primary)] text-sm font-bold p-2.5 rounded-xl border border-[var(--border-subtle)] outline-none"
                      />
                      <select
                        value={auctionTokenIn}
                        onChange={(e) => setAuctionTokenIn(e.target.value)}
                        className="bg-[var(--bg-subtle)] text-[var(--text-primary)] text-sm font-bold px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] outline-none cursor-pointer"
                      >
                        <option value="ETH">ETH</option>
                        <option value="WBTC">WBTC</option>
                        <option value="UNI">UNI</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-tertiary)] font-semibold">Start Price (USDC)</label>
                      <input
                        type="text"
                        value={auctionStartUSD}
                        onChange={(e) => setAuctionStartUSD(e.target.value)}
                        className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] text-sm font-bold p-2.5 rounded-xl border border-[var(--border-subtle)] outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-tertiary)] font-semibold">Decay Floor Price (USDC)</label>
                      <input
                        type="text"
                        value={auctionEndUSD}
                        onChange={(e) => setAuctionEndUSD(e.target.value)}
                        className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] text-sm font-bold p-2.5 rounded-xl border border-[var(--border-subtle)] outline-none mt-1"
                      />
                    </div>
                  </div>

                  {/* Gas & Fee Notice */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Zero Gas Cost • Complete MEV Sandwich Immunity
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      The winning filler pays L1/L2 gas fees directly to the validator upon execution.
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateDutchOrder}
                    disabled={isSubmittingOrder}
                    className="w-full py-3 text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmittingOrder ? (
                      <span>Signing EIP-712 Order...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Sign & Broadcast Dutch Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Dutch Orders Auction Stream */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-500" />
                    Live Dutch Auction RFQ Stream
                  </h4>
                  <span className="text-xs font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    ● Real-Time Fillers Active
                  </span>
                </div>

                <div className="space-y-3">
                  {dutchOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--text-primary)]">{order.tokenIn}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                          <span className="font-bold text-sm text-pink-400">{order.tokenOut}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            order.status === 'filled'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {order.status === 'filled' ? 'FILLED AT TARGET' : `DECAYING (${order.decayPercent}%)`}
                        </span>
                      </div>

                      {/* Decay Progress Visualizer */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
                          <span>Start: {order.startAmountOut}</span>
                          <span className="text-pink-400 font-bold">Current: {order.currentDecayedAmountOut}</span>
                          <span>Floor: {order.endAmountOut}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(10, order.decayPercent))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-subtle)]">
                        <span>Hash: {order.orderHash}</span>
                        <span className="text-emerald-400">Filler: {order.filler || 'Pending Winner'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Uniswap v4 Hook Lab & Salt Miner */}
      {activeTab === 'v4_hooks' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Uniswap v4 Hook Architecture & CREATE2 Address Miner (Uniswap/v4-core)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-3xl">
              Uniswap v4 validates hook permissions strictly by reading the leading bits of the deployed Hook contract address. Select permission flags, inspect generated Solidity callbacks, and mine a valid CREATE2 deployment salt in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Hook Selector & Permission Bitmask */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Hook Presets & Permissions</h4>

                {/* Presets */}
                <div className="space-y-2">
                  {V4_PRESET_HOOKS.map((hook) => {
                    const isSelected = selectedHookPreset.id === hook.id;
                    return (
                      <div
                        key={hook.id}
                        onClick={() => setSelectedHookPreset(hook)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? 'bg-pink-500/10 border-pink-500 text-[var(--text-primary)]'
                            : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:border-[var(--border-app)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[var(--text-primary)]">{hook.name}</span>
                          <span className="font-mono text-[10px] font-bold text-pink-400 bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-app)]">
                            {hook.hookFlagsHex}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{hook.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Salt Mining Tool */}
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Foundry CREATE2 Hook Address</span>
                    <span className="text-[10px] font-mono text-purple-400 font-bold">Bitmask Target: {selectedHookPreset.hookFlagsHex}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] font-mono text-xs text-pink-400 break-all">
                    {minedAddress || 'Click Mine Salt to calculate...'}
                  </div>

                  <Button
                    onClick={handleMineHookAddress}
                    disabled={isMiningSalt}
                    className="w-full py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow flex items-center justify-center gap-2"
                  >
                    {isMiningSalt ? (
                      <span>Mining Salt with Foundry...</span>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Mine Valid Hook Salt (Foundry Script)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Hook Solidity Code Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Code className="w-4 h-4 text-purple-400" />
                    Generated Hook Contract (Solidity ^0.8.24)
                  </h4>
                  <button
                    onClick={() => handleCopy(selectedHookPreset.solidityTemplate, 'hook-sol')}
                    className="text-xs text-pink-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copiedText === 'hook-sol' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy Solidity
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-primary)] max-h-[420px] overflow-y-auto whitespace-pre no-scrollbar">
                  {selectedHookPreset.solidityTemplate}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Smart Order Router (SOR) Split-Path */}
      {activeTab === 'sor_routing' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Smart Order Router (SOR) Multi-Path Split Routing (Uniswap/smart-order-router)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-3xl">
              The Smart Order Router searches across pools, fee tiers, and protocols (V2, V3, V4) to split trade amounts into multiple optimal paths, drastically minimizing slippage and maximizing net token output.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-xs text-[var(--text-tertiary)]">Trade Size</span>
                  <input
                    type="text"
                    value={sorAmount}
                    onChange={(e) => setSorAmount(e.target.value)}
                    className="bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold text-sm p-2 rounded-lg border border-[var(--border-app)] outline-none mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-xs text-[var(--text-tertiary)]">Asset Pair</span>
                  <select
                    value={sorTokenPair}
                    onChange={(e) => setSorTokenPair(e.target.value)}
                    className="bg-[var(--bg-subtle)] text-[var(--text-primary)] font-bold text-sm p-2 rounded-lg border border-[var(--border-app)] outline-none mt-0.5"
                  >
                    <option value="USDC/ETH">USDC → ETH</option>
                    <option value="WBTC/USDC">WBTC → USDC</option>
                    <option value="ETH/UNI">ETH → UNI</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center gap-3">
                <span>Net Output: <strong className="text-[var(--text-primary)]">14.362 ETH</strong></span>
                <span>•</span>
                <span>Price Impact: <strong className="text-emerald-400">0.03%</strong></span>
              </div>
            </div>

            {/* Split Route Path Visualizer */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[var(--text-tertiary)]">SOR Split Distribution:</span>

              {/* Path 1 */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-pink-400 font-mono">Route 1 (55% Split • 27,500 USDC)</span>
                  <span className="text-[var(--text-tertiary)] font-mono">Uniswap V3 (0.05% Fee Pool)</span>
                </div>
                <div className="font-mono text-xs text-[var(--text-primary)] flex items-center gap-2">
                  <span>USDC</span>
                  <span className="text-pink-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-app)] text-[11px]">
                    Pool 0x88e6a0...05%
                  </span>
                  <span className="text-pink-400">→</span>
                  <span>ETH (7.902 ETH)</span>
                </div>
              </div>

              {/* Path 2 */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-400 font-mono">Route 2 (35% Split • 17,500 USDC)</span>
                  <span className="text-[var(--text-tertiary)] font-mono">Uniswap v4 (Singleton + Dynamic Volatility Hook)</span>
                </div>
                <div className="font-mono text-xs text-[var(--text-primary)] flex items-center gap-2">
                  <span>USDC</span>
                  <span className="text-purple-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-app)] text-[11px]">
                    v4 PoolManager [TWAMM Hook]
                  </span>
                  <span className="text-purple-400">→</span>
                  <span>ETH (5.031 ETH)</span>
                </div>
              </div>

              {/* Path 3 */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400 font-mono">Route 3 (10% Split • 5,000 USDC)</span>
                  <span className="text-[var(--text-tertiary)] font-mono">Uniswap V2 Classic</span>
                </div>
                <div className="font-mono text-xs text-[var(--text-primary)] flex items-center gap-2">
                  <span>USDC</span>
                  <span className="text-cyan-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-app)] text-[11px]">
                    V2 Pair 0xb4e16d...
                  </span>
                  <span className="text-cyan-400">→</span>
                  <span>ETH (1.429 ETH)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Governance Seatbelt & Proposal Auditor */}
      {activeTab === 'seatbelt' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Governance Seatbelt Security Auditor (Uniswap/governance-seatbelt)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-3xl">
              Governance Seatbelt is an automated security tool created by Uniswap Labs that simulates on-chain execution of DAO governance proposals against a mainnet fork, auditing storage slot diffs, events, and verifying safety against malicious payload injections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Proposal #54 Execution Simulation</h4>
                <span className="text-xs font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  PASSED SEATBELT
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Deploy Uniswap v4 on Unichain with Cross-Chain Bridge Initialization
              </p>

              <div className="space-y-2 text-xs font-mono pt-2">
                <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Target Contract:</span>
                  <span className="font-bold text-[var(--text-primary)]">0x1a9C8182C09F50C8318d769245beA52c32BE35BC</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Value (ETH):</span>
                  <span className="font-bold text-emerald-400">0.000 ETH</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[var(--bg-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Calldata Function:</span>
                  <span className="font-bold text-pink-400">setImplementation(address)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-3">
              <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Automated Storage Diff Verification
              </h4>
              <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--text-secondary)] space-y-1.5">
                <div>[SLOT 0x00]: 0x0000000000000000000000000000000000000000 (unchanged)</div>
                <div>[SLOT 0x01]: 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984 (owner valid)</div>
                <div className="text-emerald-400 font-bold">✓ Zero unauthorized state mutations detected</div>
                <div className="text-emerald-400 font-bold">✓ Timelock delay period of 7 days strictly enforced</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
