import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import {
  ALL_CHAINS,
  getAllChains,
  saveCustomChain,
  removeCustomChain,
  defineChain,
} from '../../config/chains';
import { rpcProviderWrapper } from '../../utils/rpcProviderWrapper';
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
  Trash2,
  Activity,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ChainsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PresetNetwork {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  currencyName: string;
  explorerUrl: string;
}

const PRESET_NETWORKS: PresetNetwork[] = [
  {
    name: 'Sonic Mainnet',
    chainId: 146,
    rpcUrl: 'https://rpc.soniclabs.com',
    symbol: 'S',
    currencyName: 'Sonic',
    explorerUrl: 'https://sonicscan.org',
  },
  {
    name: 'Linea Mainnet',
    chainId: 59144,
    rpcUrl: 'https://rpc.linea.build',
    symbol: 'ETH',
    currencyName: 'Ether',
    explorerUrl: 'https://lineascan.build',
  },
  {
    name: 'Berachain bArtio',
    chainId: 80084,
    rpcUrl: 'https://bartio.rpc.berachain.com',
    symbol: 'BERA',
    currencyName: 'Bera',
    explorerUrl: 'https://bartio.beratrail.io',
  },
  {
    name: 'Hardhat / Anvil Localhost',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    symbol: 'ETH',
    currencyName: 'Ether',
    explorerUrl: '',
  },
];

export const ChainsModal: React.FC<ChainsModalProps> = ({ isOpen, onClose }) => {
  const { selectedChain, switchChain } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'mainnet' | 'testnet' | 'custom'>('all');
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

  // RPC Live Validation State
  const [isTestingRpc, setIsTestingRpc] = useState(false);
  const [rpcTestResult, setRpcTestResult] = useState<{
    ok: boolean;
    chainId?: number;
    latencyMs?: number;
    error?: string;
    blockNumber?: number;
  } | null>(null);

  const [chainsList, setChainsList] = useState<Chain[]>(getAllChains());

  // Listen to custom chain storage events
  useEffect(() => {
    const handleSync = () => {
      setChainsList(getAllChains());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('saydex_custom_chains_changed', handleSync);
      return () => window.removeEventListener('saydex_custom_chains_changed', handleSync);
    }
  }, []);

  const filteredChains = chainsList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toString().includes(searchQuery);
    if (!matchesSearch) return false;

    if (filterMode === 'mainnet') return !c.testnet && !c.isCustom;
    if (filterMode === 'testnet') return !!c.testnet && !c.isCustom;
    if (filterMode === 'custom') return !!c.isCustom;
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

  const handleDeleteCustomChain = (chainId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove custom EVM chain #${chainId}?`)) {
      return;
    }
    removeCustomChain(chainId);
    setChainsList(getAllChains());
    if (selectedChain.id === chainId) {
      switchChain(1); // Fallback to Ethereum mainnet
    }
  };

  const testRpcConnection = async (rpcUrl: string) => {
    const url = rpcUrl.trim();
    if (!url || !url.startsWith('http')) {
      setRpcTestResult({ ok: false, error: 'Please enter a valid HTTP(S) RPC URL.' });
      return;
    }

    setIsTestingRpc(true);
    setRpcTestResult(null);
    setCustomError('');
    const start = performance.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_chainId',
          params: [],
        }),
        signal: AbortSignal.timeout(6000),
      });

      const latency = Math.round(performance.now() - start);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || 'RPC returned JSON-RPC error');
      }

      const hexId = data.result;
      const parsedId = parseInt(hexId, 16);
      if (isNaN(parsedId) || parsedId <= 0) {
        throw new Error(`Invalid chain ID response from RPC: ${hexId}`);
      }

      let blockNum: number | undefined;
      try {
        const blockRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_blockNumber', params: [] }),
          signal: AbortSignal.timeout(3000),
        });
        if (blockRes.ok) {
          const bData = await blockRes.json();
          if (bData.result) blockNum = parseInt(bData.result, 16);
        }
      } catch {}

      setRpcTestResult({
        ok: true,
        chainId: parsedId,
        latencyMs: latency,
        blockNumber: blockNum,
      });

      // Auto-fill chain ID if empty
      if (!customChainId || customChainId.trim() === '') {
        setCustomChainId(parsedId.toString());
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      let errMsg = err.message || 'Failed to connect to RPC';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        errMsg = 'CORS blocked or unreachable from browser. Ensure RPC allows CORS header (Access-Control-Allow-Origin: *).';
      }
      setRpcTestResult({
        ok: false,
        latencyMs: latency,
        error: errMsg,
      });
    } finally {
      setIsTestingRpc(false);
    }
  };

  const handleApplyPreset = (preset: PresetNetwork) => {
    setCustomName(preset.name);
    setCustomChainId(preset.chainId.toString());
    setCustomRpcUrl(preset.rpcUrl);
    setCustomCurrencySymbol(preset.symbol);
    setCustomCurrencyName(preset.currencyName);
    setCustomExplorerUrl(preset.explorerUrl);
    setCustomError('');
    testRpcConnection(preset.rpcUrl);
  };

  const handleAddCustomChain = async (e: React.FormEvent) => {
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

    // Check if ID is a standard hardcoded chain
    const isStandard = ALL_CHAINS.some((c) => c.id === parsedId);
    if (isStandard) {
      setCustomError(`Chain ID ${parsedId} is already a native supported network in Saydex.`);
      return;
    }

    // Warn if RPC test succeeded and chainId differs
    if (rpcTestResult?.ok && rpcTestResult.chainId && rpcTestResult.chainId !== parsedId) {
      setCustomError(
        `Chain ID mismatch! RPC node reports chain ID ${rpcTestResult.chainId}, but you entered ${parsedId}. Please match the RPC's chain ID.`
      );
      return;
    }

    const newChain: Chain = defineChain({
      id: parsedId,
      name: customName.trim(),
      shortName: customName.trim().slice(0, 12),
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
      nativeCurrency: {
        name: customCurrencyName.trim() || 'Ether',
        symbol: customCurrencySymbol.trim().toUpperCase() || 'ETH',
        decimals: 18,
      },
      rpcUrl: customRpcUrl.trim(),
      rpcUrls: {
        default: { http: [customRpcUrl.trim()] },
        public: { http: [customRpcUrl.trim()] },
      },
      blockExplorerUrl: customExplorerUrl.trim() || '',
      blockExplorers: customExplorerUrl.trim()
        ? {
            default: {
              name: `${customName.trim()} Explorer`,
              url: customExplorerUrl.trim(),
            },
          }
        : undefined,
      contracts: customMulticall3.trim()
        ? {
            multicall3: {
              address: customMulticall3.trim(),
            },
          }
        : undefined,
      gasPriceGwei: 1.0,
      isSupported: true,
      isCustom: true,
      testnet:
        customName.toLowerCase().includes('test') ||
        customName.toLowerCase().includes('sepolia') ||
        customName.toLowerCase().includes('dev') ||
        parsedId === 31337 ||
        parsedId === 1337,
    });

    // 1. Save persistently to localStorage
    saveCustomChain(newChain);

    // 2. Register in rpcProviderWrapper for failover & active RPC management
    rpcProviderWrapper.registerChain(newChain.id, newChain.name, [newChain.rpcUrl]);

    // 3. EIP-3085 & EIP-3326: Request browser injected wallet (MetaMask / Rabby) to add and switch
    if (typeof window !== 'undefined') {
      const eth = (window as any).ethereum;
      if (eth?.request) {
        const hexChainId = '0x' + parsedId.toString(16);
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: newChain.name,
                nativeCurrency: newChain.nativeCurrency,
                rpcUrls: [newChain.rpcUrl],
                blockExplorerUrls: newChain.blockExplorerUrl ? [newChain.blockExplorerUrl] : undefined,
              },
            ],
          });
        } catch (walletErr: any) {
          console.warn('[ChainsModal] wallet_addEthereumChain notice:', walletErr);
        }
      }
    }

    // 4. Switch app context
    await switchChain(parsedId as ChainId);

    // 5. Update local view and close
    setChainsList(getAllChains());
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
          ? 'Add any EVM compatible network with live RPC verification and EIP-3085 wallet synchronization.'
          : 'Switch between EVM Layer 1s, Layer 2 rollups, testnets, or your custom EVM chains.'
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
                placeholder="Search by name or Chain ID (e.g. 1, 8453, Sonic)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-app)] text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('mainnet')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'mainnet'
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Mainnets
              </button>
              <button
                onClick={() => setFilterMode('testnet')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'testnet'
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Testnets
              </button>
              <button
                onClick={() => setFilterMode('custom')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterMode === 'custom'
                    ? 'bg-purple-500/20 text-purple-400 shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                Custom ({chainsList.filter((c) => c.isCustom).length})
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
                  className={`p-3.5 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-[var(--primary-subtle)] border-[var(--primary)]/60 shadow-xs'
                      : chain.isCustom
                      ? 'bg-purple-950/10 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/20'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-app)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center p-1 font-mono font-bold text-xs ${
                          chain.isCustom
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                        }`}
                      >
                        {chain.shortName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-[var(--text-primary)]">
                            {chain.name}
                          </span>
                          {chain.isCustom ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              Custom EVM
                            </span>
                          ) : chain.testnet ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/30">
                              Testnet
                            </span>
                          ) : null}
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

                    <div className="flex items-center gap-1.5">
                      {chain.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomChain(chain.id as number, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer"
                          title="Remove custom chain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--primary-text)] flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chain Details and Links */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono">
                    <div className="flex items-center gap-1 truncate max-w-[170px]" title={chain.rpcUrl}>
                      <Globe className="w-3 h-3 shrink-0 text-[var(--text-disabled)]" />
                      <span className="truncate">{chain.rpcUrl.replace('https://', '').replace('http://', '')}</span>
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
                      {chain.blockExplorerUrl ? (
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
                      ) : null}
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
              <span>Viem & Wagmi v2 defineChain Configured</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCustomError('');
                setRpcTestResult(null);
                setIsCustomMode(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5 text-purple-400" />}
              className="border-purple-500/40 hover:border-purple-500 hover:bg-purple-500/10 text-purple-300 font-semibold"
            >
              Add Custom EVM Chain
            </Button>
          </div>
        </div>
      ) : (
        /* Custom Chain Creation Form (Uniswap & Viem Standard) */
        <form onSubmit={handleAddCustomChain} className="space-y-4">
          {/* Quick Presets Bar */}
          <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Quick Presets (Click to autofill):
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_NETWORKS.map((preset) => (
                <button
                  key={preset.chainId}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--bg-surface-elevated)] hover:bg-purple-500/20 hover:text-purple-300 border border-[var(--border-subtle)] hover:border-purple-500/40 text-[var(--text-secondary)] transition-all cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{preset.name}</span>
                  <span className="font-mono text-[9px] text-[var(--text-tertiary)]">#{preset.chainId}</span>
                </button>
              ))}
            </div>
          </div>

          {customError && (
            <div className="p-3 rounded-xl bg-[var(--danger-subtle)] border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{customError}</span>
            </div>
          )}

          {/* RPC HTTP URL with Live Ping/Verification */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                RPC HTTP URL *
              </label>
              <button
                type="button"
                onClick={() => testRpcConnection(customRpcUrl)}
                disabled={isTestingRpc || !customRpcUrl.trim()}
                className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Activity className={`w-3 h-3 ${isTestingRpc ? 'animate-spin' : ''}`} />
                <span>{isTestingRpc ? 'Pinging RPC...' : 'Test & Detect Chain ID'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="url"
                placeholder="https://rpc.yournetwork.com or http://127.0.0.1:8545"
                value={customRpcUrl}
                onChange={(e) => {
                  setCustomRpcUrl(e.target.value);
                  setRpcTestResult(null);
                }}
                onBlur={() => {
                  if (customRpcUrl.startsWith('http') && !rpcTestResult && !isTestingRpc) {
                    testRpcConnection(customRpcUrl);
                  }
                }}
                required
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* Live RPC Status Banner */}
            {rpcTestResult && (
              <div
                className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  rpcTestResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {rpcTestResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    {rpcTestResult.ok ? (
                      <span className="font-semibold">
                        Connected to RPC • Chain ID #{rpcTestResult.chainId} • Latency: {rpcTestResult.latencyMs}ms
                        {rpcTestResult.blockNumber ? ` (Block #${rpcTestResult.blockNumber})` : ''}
                      </span>
                    ) : (
                      <span>{rpcTestResult.error}</span>
                    )}
                  </div>
                </div>

                {rpcTestResult.ok && rpcTestResult.chainId && customChainId !== rpcTestResult.chainId.toString() && (
                  <button
                    type="button"
                    onClick={() => setCustomChainId(rpcTestResult.chainId!.toString())}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Use #{rpcTestResult.chainId}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Network Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sonic Mainnet, Monad, Berachain"
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
                placeholder="e.g. 146, 59144, 31337"
                value={customChainId}
                onChange={(e) => setCustomChainId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Currency Symbol *
              </label>
              <input
                type="text"
                placeholder="ETH / S / BERA / USDC"
                value={customCurrencySymbol}
                onChange={(e) => setCustomCurrencySymbol(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Currency Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ether, Sonic, Bera"
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
              placeholder="https://sonicscan.org or https://explorer.custom.io"
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
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              Leave blank to use standard EVM multicall3 address if deployed on your chain.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[var(--border-app)]">
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Syncs to MetaMask / Rabby via EIP-3085</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomError('');
                  setRpcTestResult(null);
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
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md"
              >
                Save & Switch Chain
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
