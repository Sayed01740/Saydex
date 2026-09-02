import React, { useState, useMemo } from 'react';
import { Token } from '../../types';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { ALL_CHAINS } from '../../config/chains';
import { Modal } from '../common/Modal';
import { TokenIcon } from '../common/TokenIcon';
import {
  Search,
  AlertTriangle,
  ShieldCheck,
  Check,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Cpu,
  Coins,
  ExternalLink,
  Layers as NetworkIcon,
} from 'lucide-react';
import { Button } from '../common/Button';

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  selectedToken?: Token;
}

type CategoryTab = 'all' | 'popular' | 'defi' | 'stablecoin' | 'lst' | 'layer2' | 'ai' | 'meme';

export const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectToken,
  selectedToken,
}) => {
  const { tokens, addToken } = useProtocol();
  const { getTokenBalance, selectedChain } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<'selected' | 'all'>('selected');
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [warningToken, setWarningToken] = useState<Token | null>(null);
  const [displayCount, setDisplayCount] = useState(45);

  // Custom Token Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDecimals, setCustomDecimals] = useState('18');

  // Reset display count when search or category changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setDisplayCount(45);
  };

  const handleCategoryChange = (cat: CategoryTab) => {
    setActiveCategory(cat);
    setDisplayCount(45);
  };

  const categories: { id: CategoryTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All' },
    { id: 'popular', label: 'Popular', icon: <Flame className="w-3 h-3 text-amber-500" /> },
    { id: 'defi', label: 'DeFi', icon: <Layers className="w-3 h-3 text-indigo-500" /> },
    { id: 'stablecoin', label: 'Stablecoins', icon: <DollarSign className="w-3 h-3 text-emerald-500" /> },
    { id: 'lst', label: 'LST & Staking', icon: <Coins className="w-3 h-3 text-cyan-500" /> },
    { id: 'layer2', label: 'L2 & L1' },
    { id: 'ai', label: 'AI & Data', icon: <Cpu className="w-3 h-3 text-purple-500" /> },
    { id: 'meme', label: 'Memes', icon: <Sparkles className="w-3 h-3 text-rose-500" /> },
  ];

  const popularTokens = useMemo(() => {
    return tokens
      .filter((t) => {
        if (!t.isPopular) return false;
        if (chainFilter === 'selected') {
          return t.chainId === selectedChain.id || (!t.chainId && !t.address);
        }
        return true;
      })
      .sort((a, b) => {
        const aMatches = a.chainId === selectedChain.id ? 1 : 0;
        const bMatches = b.chainId === selectedChain.id ? 1 : 0;
        return bMatches - aMatches;
      });
  }, [tokens, chainFilter, selectedChain.id]);

  const filteredTokens = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = tokens.filter((t) => {
      // Chain filter
      if (chainFilter === 'selected') {
        const matchesChain = t.chainId === selectedChain.id || (!t.chainId && !t.address);
        if (!matchesChain) return false;
      }

      // Search matches
      const matchesSearch =
        !q ||
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Verified toggle
      if (verifiedOnly && !t.isVerified) return false;

      // Category tab
      if (activeCategory === 'all') return true;
      if (activeCategory === 'popular') return Boolean(t.isPopular);
      return t.category === activeCategory;
    });

    if (chainFilter === 'all') {
      return list.sort((a, b) => {
        const aMatches = a.chainId === selectedChain.id ? 1 : 0;
        const bMatches = b.chainId === selectedChain.id ? 1 : 0;
        return bMatches - aMatches;
      });
    }

    return list;
  }, [tokens, searchQuery, activeCategory, verifiedOnly, chainFilter, selectedChain.id]);

  const getChainName = (chainId?: number) => {
    if (!chainId) return null;
    const c = ALL_CHAINS.find((ch) => ch.id === chainId);
    return c ? c.shortName : `Chain ${chainId}`;
  };

  const handleTokenClick = (token: Token) => {
    if (token.riskAudit && !token.isVerified) {
      setWarningToken(token);
      return;
    }
    onSelectToken(token);
    onClose();
  };

  const handleAcceptRiskyToken = () => {
    if (warningToken) {
      onSelectToken(warningToken);
      setWarningToken(null);
      onClose();
    }
  };

  const handleImportCustomToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress || !customSymbol || !customName) return;

    const newToken: Token = {
      address: customAddress.trim(),
      chainId: 1,
      symbol: customSymbol.toUpperCase().trim(),
      name: customName.trim(),
      decimals: parseInt(customDecimals, 10) || 18,
      icon: '',
      priceUSD: 1.0,
      change24h: 0.0,
      balance: 1000.0,
      volume24hUSD: 50000,
      isVerified: false,
      category: 'defi',
      tokenListSource: 'Custom Imported',
    };

    addToken(newToken);
    setCustomAddress('');
    setCustomSymbol('');
    setCustomName('');
    setIsImportModalOpen(false);
    onSelectToken(newToken);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !warningToken && !isImportModalOpen}
        onClose={onClose}
        title="Select a Token"
        subtitle={`Select from ${selectedChain.name} (${selectedChain.shortName}) or all chains`}
        maxWidth="lg"
      >
        <div className="space-y-3.5">
          {/* Chain Scope Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl">
            <button
              onClick={() => {
                setChainFilter('selected');
                setDisplayCount(45);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chainFilter === 'selected'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <img
                src={selectedChain.icon}
                alt={selectedChain.name}
                className="w-4 h-4 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>{selectedChain.name} Only</span>
            </button>

            <button
              onClick={() => {
                setChainFilter('all');
                setDisplayCount(45);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                chainFilter === 'all'
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <NetworkIcon className="w-3.5 h-3.5" />
              <span>All Networks</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder={`Search name, symbol on ${selectedChain.shortName}, or paste 0x...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] focus:outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-all font-sans"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Pick Popular Tokens Chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-[var(--text-tertiary)] font-medium mr-1">Popular:</span>
            {popularTokens.slice(0, 7).map((tok) => (
              <button
                key={`${tok.chainId || 1}-${tok.symbol}`}
                onClick={() => handleTokenClick(tok)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  selectedToken?.symbol === tok.symbol
                    ? 'bg-[var(--primary-subtle)] border-[var(--primary)]/50 text-[var(--primary)] font-semibold shadow-xs'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-app)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <TokenIcon symbol={tok.symbol} icon={tok.icon} size="xs" />
                <span>{tok.symbol}</span>
                {tok.chainId && tok.chainId !== selectedChain.id && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-surface)] text-[var(--text-tertiary)]">
                    {getChainName(tok.chainId)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Category Tabs & Verified Filter */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 pt-1 gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setVerifiedOnly(!verifiedOnly);
                  setDisplayCount(45);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border ${
                  verifiedOnly
                    ? 'bg-[var(--primary-subtle)] border-[var(--primary)]/40 text-[var(--primary)] font-semibold'
                    : 'border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                title="Filter only verified smart contracts"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </button>
            </div>
          </div>

          {/* Token List Counter & Source */}
          <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] px-1">
            <span>
              Showing {Math.min(displayCount, filteredTokens.length)} of {filteredTokens.length} tokens on {chainFilter === 'selected' ? selectedChain.shortName : 'all chains'}
            </span>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Import custom ERC-20</span>
            </button>
          </div>

          {/* Token Rows */}
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {filteredTokens.slice(0, displayCount).map((tok) => {
              const isSelected = selectedToken?.symbol === tok.symbol && (tok.chainId === selectedChain.id || !tok.chainId);
              const hasRisk = tok.riskAudit && !tok.isVerified;
              const isPositive = tok.change24h >= 0;
              const chainName = getChainName(tok.chainId);

              return (
                <button
                  key={`${tok.chainId}-${tok.address}-${tok.symbol}`}
                  onClick={() => handleTokenClick(tok)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer border ${
                    isSelected
                      ? 'bg-[var(--primary-subtle)] border-[var(--primary)]/40 shadow-xs'
                      : 'hover:bg-[var(--bg-surface-hover)] border-transparent hover:border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={tok.symbol} icon={tok.icon} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-[var(--text-primary)]">
                          {tok.symbol}
                        </span>
                        {chainName && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                            tok.chainId === selectedChain.id
                              ? 'bg-[var(--primary-subtle)] text-[var(--primary)] border-[var(--primary)]/30 font-semibold'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border-[var(--border-subtle)]'
                          }`}>
                            {chainName}
                          </span>
                        )}
                        {tok.isVerified ? (
                          <ShieldCheck
                            className="w-3.5 h-3.5 text-[var(--primary)] shrink-0"
                            title="Verified Token List"
                          />
                        ) : hasRisk ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-[var(--error-subtle)] text-[var(--error)] font-medium border border-[var(--error)]/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Risk Flagged</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-tertiary)] px-1 rounded bg-[var(--bg-subtle)]">
                            Custom
                          </span>
                        )}
                        {tok.category && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--bg-subtle)] text-[var(--text-tertiary)] uppercase font-mono tracking-wider">
                            {tok.category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] truncate max-w-[180px]">
                        {tok.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                      {(() => {
                        const bal = getTokenBalance(tok, selectedChain.id);
                        return bal > 0
                          ? (bal < 0.001 ? bal.toFixed(6) : bal.toLocaleString(undefined, { maximumFractionDigits: 4 }))
                          : '0.00';
                      })()}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-xs font-mono">
                      <span className="text-[var(--text-tertiary)]">
                        ${tok.priceUSD < 0.01
                          ? tok.priceUSD.toFixed(6)
                          : tok.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                      <span
                        className={`text-[11px] font-medium flex items-center ${
                          isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {tok.change24h}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredTokens.length > displayCount && (
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + 50)}
                className="w-full py-2.5 text-xs font-semibold text-[var(--primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] rounded-xl transition-all cursor-pointer text-center"
              >
                Show more tokens ({filteredTokens.length - displayCount} remaining)
              </button>
            )}

            {filteredTokens.length === 0 && (
              <div className="py-12 text-center space-y-3">
                <p className="text-sm text-[var(--text-secondary)] font-medium">
                  No tokens found matching "{searchQuery}"
                </p>
                <p className="text-xs text-[var(--text-tertiary)] max-w-xs mx-auto">
                  You can import any custom ERC-20 token directly by its contract address.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (searchQuery.startsWith('0x')) {
                      setCustomAddress(searchQuery);
                    }
                    setIsImportModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Import Custom Token
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Import Custom Token Sub-Modal */}
      {isImportModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Custom ERC-20 Token"
          subtitle="Add any custom token on Ethereum or Layer 2"
          maxWidth="md"
        >
          <form onSubmit={handleImportCustomToken} className="space-y-4">
            <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] p-3 rounded-xl flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
              <Info className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
              <span>
                Anyone can create an ERC-20 token on Ethereum with fake names. Make sure you verify the contract address on Etherscan before trading.
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-primary)] mb-1">
                  Contract Address (0x...)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-sm font-mono text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[var(--text-primary)] mb-1">
                    Token Symbol
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ALPHA"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-sm font-mono text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--text-primary)] mb-1">
                    Decimals
                  </label>
                  <input
                    type="number"
                    required
                    value={customDecimals}
                    onChange={(e) => setCustomDecimals(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-sm font-mono text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[var(--text-primary)] mb-1">
                  Token Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alpha Community Token"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-sm text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setIsImportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" fullWidth>
                Import & Select Token
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Dangerous Token Warning Modal */}
      {warningToken && (
        <Modal
          isOpen={true}
          onClose={() => setWarningToken(null)}
          title={
            <div className="flex items-center gap-2 text-[var(--error)]">
              <AlertTriangle className="w-5 h-5" />
              <span>Token Risk Detected</span>
            </div>
          }
          subtitle={`Explicit automated contract audit flags for ${warningToken.symbol}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="bg-[var(--error-subtle)] border border-[var(--error)]/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-[var(--error)] mb-2">
                Why this token was flagged by Saydex Security Solvers:
              </p>
              <ul className="space-y-2 text-xs text-[var(--text-primary)] list-disc pl-4">
                {warningToken.riskAudit?.auditNotes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Anyone can create a token with any name on decentralized blockchains. Trading this token may result in complete loss of funds due to transfer restrictions, honeypot traps, or infinite minting.
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setWarningToken(null)}
              >
                Cancel & Go Back
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={handleAcceptRiskyToken}
              >
                I Understand the Risks
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
