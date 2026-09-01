import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ALL_CHAINS, defineChain } from '../../config/chains';
import { Chain, ChainId } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Globe,
  Check,
  Plus,
  ExternalLink,
  Cpu,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface ChainsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChainsModal: React.FC<ChainsModalProps> = ({ isOpen, onClose }) => {
  const { selectedChain, switchChain } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'mainnet' | 'testnet'>('all');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Custom chain form state
  const [customName, setCustomName] = useState('');
  const [customChainId, setCustomChainId] = useState('');
  const [customRpcUrl, setCustomRpcUrl] = useState('');
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState('ETH');
  const [customCurrencyName, setCustomCurrencyName] = useState('Ether');
  const [customExplorerUrl, setCustomExplorerUrl] = useState('');
  const [customMulticall3, setCustomMulticall3] = useState('');
  const [customError, setCustomError] = useState('');

  const [chainsList, setChainsList] = useState<Chain[]>(ALL_CHAINS);

  const filteredChains = chainsList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toString().includes(searchQuery);
    if (!matchesSearch) return false;

    if (filterMode === 'mainnet') return !c.testnet;
    if (filterMode === 'testnet') return !!c.testnet;
    return true;
  });

  const handleSelectChain = (id: ChainId) => {
    switchChain(id);
    onClose();
  };

  const handleCopyRpc = (chain: Chain, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(chain.rpcUrl);
    setCopiedId(chain.id as number);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAddCustomChain = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError('');

    const parsedId = parseInt(customChainId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      setCustomError('Please provide a valid numeric Chain ID.');
      return;
    }

    if (!customName.trim()) {
      setCustomError('Network name is required.');
      return;
    }

    if (!customRpcUrl.trim() || !customRpcUrl.startsWith('http')) {
      setCustomError('A valid HTTP(S) RPC URL is required.');
      return;
    }

    // Check if ID exists
    const exists = chainsList.some((c) => c.id === parsedId);
    if (exists) {
      setCustomError(`Chain with ID ${parsedId} already exists in configuration.`);
      return;
    }

    const newChain: Chain = defineChain({
      id: parsedId,
      name: customName.trim(),
      shortName: customName.trim().slice(0, 10),
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      nativeCurrency: {
        name: customCurrencyName.trim() || 'Ether',
        symbol: customCurrencySymbol.trim() || 'ETH',
        decimals: 18,
      },
      rpcUrl: customRpcUrl.trim(),
      rpcUrls: {
        default: { http: [customRpcUrl.trim()] },
        public: { http: [customRpcUrl.trim()] },
      },
      blockExplorerUrl: customExplorerUrl.trim() || 'https://etherscan.io',
      blockExplorers: {
        default: {
          name: `${customName.trim()} Explorer`,
          url: customExplorerUrl.trim() || 'https://etherscan.io',
        },
      },
      contracts: customMulticall3.trim()
        ? {
            multicall3: {
              address: customMulticall3.trim(),
            },
          }
        : undefined,
      gasPriceGwei: 1.0,
      isSupported: true,
      testnet: customName.toLowerCase().includes('test') || customName.toLowerCase().includes('sepolia') || customName.toLowerCase().includes('dev'),
    });

    setChainsList((prev) => [...prev, newChain]);
    switchChain(parsedId);
    setIsCustomMode(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCustomMode ? 'Add Custom EVM Chain (Viem/Wagmi)' : 'Select Network'}
      subtitle={
        isCustomMode
          ? 'Define a custom chain with Viem defineChain properties (RPC, Explorer, Multicall3).'
          : 'Switch between EVM Layer 1s, Layer 2 rollups, and testnets.'
      }
      maxWidth="lg"
    >
      {!isCustomMode ? (
        <div className="space-y-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or Chain ID (e.g. 1, 42161, Base)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-app)] text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('mainnet')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'mainnet'
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Mainnets
              </button>
              <button
                onClick={() => setFilterMode('testnet')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'testnet'
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Testnets
              </button>
            </div>
          </div>

          {/* Chains Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredChains.map((chain) => {
              const isSelected = selectedChain.id === chain.id;
              return (
                <div
                  key={chain.id}
                  onClick={() => handleSelectChain(chain.id as ChainId)}
                  className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[var(--primary-subtle)] border-[var(--primary)]/60 shadow-xs'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-app)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center p-1 font-mono font-bold text-xs text-[var(--text-primary)]">
                        {chain.shortName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-[var(--text-primary)]">
                            {chain.name}
                          </span>
                          {chain.testnet && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/30">
                              Testnet
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          <span>Chain #{chain.id}</span>
                          <span>•</span>
                          <span>{chain.nativeCurrency.symbol}</span>
                          <span>•</span>
                          <span className="text-[var(--text-secondary)]">{chain.gasPriceGwei} gwei</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Chain Details and Links */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono">
                    <div className="flex items-center gap-1 truncate max-w-[170px]" title={chain.rpcUrl}>
                      <Globe className="w-3 h-3 shrink-0 text-[var(--text-disabled)]" />
                      <span className="truncate">{chain.rpcUrl.replace('https://', '')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopyRpc(chain, e)}
                        className="hover:text-[var(--text-primary)] transition-colors p-1"
                        title="Copy RPC URL"
                      >
                        {copiedId === chain.id ? (
                          <Check className="w-3 h-3 text-[var(--success)]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <a
                        href={chain.blockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[var(--text-primary)] transition-colors p-1"
                        title="Open Block Explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-[var(--border-app)] flex items-center justify-between">
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Viem & Wagmi v2 Compatible Configs</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomMode(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Custom Chain
            </Button>
          </div>
        </div>
      ) : (
        /* Custom Chain Creation Form */
        <form onSubmit={handleAddCustomChain} className="space-y-4">
          {customError && (
            <div className="p-3 rounded-xl bg-[var(--danger-subtle)] border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{customError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Network Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Localhost 8545 / Scroll / Linea"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Chain ID * (EIP-155)
              </label>
              <input
                type="number"
                placeholder="e.g. 534352 or 31337"
                value={customChainId}
                onChange={(e) => setCustomChainId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              RPC HTTP URL *
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={customRpcUrl}
              onChange={(e) => setCustomRpcUrl(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                placeholder="ETH / MATIC / BNB"
                value={customCurrencySymbol}
                onChange={(e) => setCustomCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Currency Name
              </label>
              <input
                type="text"
                placeholder="Ether"
                value={customCurrencyName}
                onChange={(e) => setCustomCurrencyName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Block Explorer URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://scrollscan.com"
              value={customExplorerUrl}
              onChange={(e) => setCustomExplorerUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Multicall3 Contract Address (Optional)
            </label>
            <input
              type="text"
              placeholder="0xca11bde05977b3631167028862be2a173976ca11"
              value={customMulticall3}
              onChange={(e) => setCustomMulticall3(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCustomError('');
                setIsCustomMode(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Save & Switch Chain
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
