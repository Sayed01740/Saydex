import React, { useState } from 'react';
import { useWallet, WalletProviderType } from '../../context/WalletContext';
import { TokenBalanceResult } from '../../utils/balanceFetcher';
import { useProtocol } from '../../context/ProtocolContext';
import { ALL_CHAINS } from '../../config/chains';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TokenIcon } from '../common/TokenIcon';
import {
  Copy,
  ExternalLink,
  Check,
  Power,
  Wallet,
  ShieldCheck,
  ArrowRightLeft,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Layers,
  Coins,
  Globe,
  Radio,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  UserCheck,
  Server,
  Network,
  Activity,
  Plus,
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = 'overview' | 'tokens' | 'chains' | 'rpc';

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    isConnected,
    isConnecting,
    isChainMismatch,
    syncAppWithWalletChain,
    address,
    ensName,
    selectedChain,
    detectedChainId,
    walletProvider,
    ethBalance,
    usdcBalance,
    isRealExtensionConnected,
    detectedExtensions,
    chainSummaries,
    tokenBalances,
    totalPortfolioUSD,
    isRefreshingBalances,
    lastBalanceRefresh,
    refreshBalances,
    connectWallet,
    requestFreshAccountSelection,
    disconnectWallet,
    switchChain,
    formatAddress,
    testWalletSignature,
    // Custom RPC Auto-Failover Props
    activeRpcUrl,
    backupRpcUrls,
    rpcPools,
    lastRpcFailover,
    switchChainRpc,
    addCustomRpcUrl,
  } = useWallet();

  const { setActiveView } = useProtocol();

  const [copied, setCopied] = useState(false);
  const [showSwitchList, setShowSwitchList] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [isTestingSignature, setIsTestingSignature] = useState(false);
  const [testSignatureResult, setTestSignatureResult] = useState<{ signature: string; isReal: boolean } | null>(null);
  const [customRpcInput, setCustomRpcInput] = useState('');
  const [isTestingRpcFailover, setIsTestingRpcFailover] = useState(false);

  const handleTestSignature = async () => {
    try {
      setIsTestingSignature(true);
      const res = await testWalletSignature();
      setTestSignatureResult(res);
      setIsTestingSignature(false);
    } catch (err: any) {
      setIsTestingSignature(false);
      console.warn('Test signature rejected or cancelled:', err);
    }
  };

  const walletOptions: {
    id: WalletProviderType;
    name: string;
    description: string;
    color: string;
    isDetected?: boolean;
  }[] = [
    {
      id: 'rabby',
      name: 'Rabby Wallet',
      description: 'Web3 multi-chain wallet with pre-tx risk analysis',
      color: '#8697FF',
      isDetected: detectedExtensions.rabby,
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Popular Ethereum browser extension & mobile app',
      color: '#F6851B',
      isDetected: detectedExtensions.metamask,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Self-custody crypto wallet & Smart Wallet passkeys',
      color: '#0052FF',
      isDetected: detectedExtensions.coinbase,
    },
    {
      id: 'phantom',
      name: 'Phantom',
      description: 'EVM & Solana multi-chain friendly interface',
      color: '#AB9FF2',
      isDetected: detectedExtensions.phantom,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Scan QR with Trust, Rainbow, Zerion or 300+ apps',
      color: '#3B99FC',
    },
    {
      id: 'ledger',
      name: 'Ledger Hardware',
      description: 'Cold storage security with USB / Bluetooth verification',
      color: '#22c55e',
    },
  ];

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (provider: WalletProviderType, freshAccounts = false) => {
    await connectWallet(provider, { requestFreshAccounts: freshAccounts });
    setShowSwitchList(false);
    onClose();
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowSwitchList(false);
    onClose();
  };

  const getProviderName = (type: WalletProviderType | null) => {
    if (!type) return 'Web3 Wallet';
    const found = walletOptions.find((w) => w.id === type);
    return found ? found.name : type.toUpperCase();
  };

  // Convert tokenBalances map to sorted array of user holdings
  const userTokenList: TokenBalanceResult[] = (Object.values(tokenBalances) as TokenBalanceResult[])
    .filter((t, idx, arr) => t.balance > 0 && arr.findIndex((x) => x.symbol === t.symbol && x.chainId === t.chainId) === idx)
    .sort((a, b) => b.balanceUSD - a.balanceUSD);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowSwitchList(false);
        onClose();
      }}
      title={isConnected && !showSwitchList ? 'Portfolio & Account' : 'Connect a Wallet'}
      subtitle={
        isConnected && !showSwitchList
          ? `Active on ${selectedChain.name} (${getProviderName(walletProvider)})`
          : 'Select your Web3 wallet or choose a fresh account from your provider.'
      }
      maxWidth="md"
    >
      {isConnected && !showSwitchList ? (
        <div className="space-y-4">
          {/* Real-time Chain Detector Notice if mismatch */}
          {isChainMismatch && detectedChainId && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Wallet provider is on <strong>Chain #{detectedChainId} ({ALL_CHAINS.find(c => c.id === detectedChainId)?.name || 'Custom'})</strong> while app UI is viewing{' '}
                  <strong>{selectedChain.name}</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => switchChain(selectedChain.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-semibold text-[11px] hover:bg-amber-400 cursor-pointer transition-colors"
                >
                  Switch Wallet to {selectedChain.shortName}
                </button>
                <button
                  type="button"
                  onClick={() => syncAppWithWalletChain()}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-amber-500/40 text-amber-200 font-semibold text-[11px] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                >
                  Switch App to {ALL_CHAINS.find(c => c.id === detectedChainId)?.shortName || `#${detectedChainId}`}
                </button>
              </div>
            </div>
          )}

          {/* Active Account Card */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">
                      {ensName || formatAddress(address, 6)}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20 uppercase tracking-wider">
                      {walletProvider || 'EVM'}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5">
                    <span>{formatAddress(address, 6)}</span>
                    {isRealExtensionConnected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--success)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                        Live Extension
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                        <Radio className="w-2.5 h-2.5 text-[var(--primary)]" />
                        Web3 Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-subtle)] cursor-pointer"
                  title="Copy full address"
                >
                  {copied ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`${selectedChain.blockExplorerUrl}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-subtle)]"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Total Net Worth Banner */}
            <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
                  Multi-Chain Net Worth
                </span>
                <p className="text-xl font-bold text-[var(--text-primary)] font-mono">
                  ${(totalPortfolioUSD > 0 ? totalPortfolioUSD : ethBalance * 3482.5 + usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => refreshBalances(true)}
                  disabled={isRefreshingBalances}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--primary)] bg-[var(--primary-subtle)] hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 transition-all cursor-pointer disabled:opacity-50"
                  title="Debounced on-chain RPC balance refresh"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingBalances ? 'Syncing...' : 'Live Sync'}</span>
                </button>
                {lastBalanceRefresh && (
                  <p className="text-[9px] text-[var(--text-tertiary)] font-mono mt-1">
                    {lastBalanceRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Balances for Current Chain */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-tertiary)]">Current Chain ({selectedChain.shortName})</span>
                <p className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">
                  {ethBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedChain.nativeCurrency.symbol}
                </p>
              </div>
              <div className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-tertiary)]">USDC Balance</span>
                <p className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">
                  ${usdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Details */}
          <div className="flex border-b border-[var(--border-app)]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'tokens'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Token Assets ({userTokenList.length})
            </button>
            <button
              onClick={() => setActiveTab('chains')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'chains'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Chains ({ALL_CHAINS.length})
            </button>
            <button
              onClick={() => setActiveTab('rpc')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'rpc'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Server className="w-3 h-3" />
              <span>RPC Pool ({backupRpcUrls.length + 1})</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Debounced RPC Polling Engine</span>
                </span>
                <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                  Chain #{selectedChain.id}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => requestFreshAccountSelection()}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Prompt wallet extension to choose a different address"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Choose Fresh Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSwitchList(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Switch Provider</span>
                </button>
              </div>

              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={handleDisconnect}
                leftIcon={<Power className="w-4 h-4" />}
              >
                Disconnect Session
              </Button>

              {/* Web3 Signature Test Section */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <button
                  type="button"
                  disabled={isTestingSignature}
                  onClick={handleTestSignature}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-subtle)] hover:bg-[var(--primary)] hover:text-[#090B0E] text-xs font-semibold text-[var(--primary)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isTestingSignature ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Awaiting Signature in Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Test Web3 Signature (personal_sign)</span>
                    </>
                  )}
                </button>

                {testSignatureResult && (
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-1 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--success)] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Signature Verified {testSignatureResult.isReal ? '(Live Provider)' : '(Cryptographic)'}</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">65 Bytes</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)] font-mono text-[9px] text-[var(--text-secondary)] break-all border border-[var(--border-subtle)]">
                      {testSignatureResult.signature}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {userTokenList.length > 0 ? (
                userTokenList.map((tok) => {
                  const chain = ALL_CHAINS.find((c) => c.id === tok.chainId) || selectedChain;
                  return (
                    <div
                      key={tok.key}
                      className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-xs hover:border-[var(--border-strong)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <TokenIcon symbol={tok.symbol} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[var(--text-primary)]">{tok.symbol}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                              {chain.shortName}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                            {tok.formatted} {tok.symbol}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-[var(--text-primary)]">
                          ${tok.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <button
                          onClick={() => {
                            setActiveView('swap');
                            onClose();
                          }}
                          className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-0.5 justify-end cursor-pointer"
                        >
                          <span>Trade</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-[var(--text-tertiary)]">
                  No positive token balances detected on connected address.
                </div>
              )}
            </div>
          )}

          {activeTab === 'chains' && (
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {ALL_CHAINS.map((chain) => {
                const summary = chainSummaries[chain.id];
                const isCurrent = selectedChain.id === chain.id;
                const bal = summary ? summary.nativeBalance : 0;
                const usd = summary ? summary.totalUsdValue : 0;

                return (
                  <button
                    key={chain.id}
                    onClick={() => switchChain(chain.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[var(--primary-subtle)] border-[var(--primary)]/40 shadow-xs'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                        {chain.shortName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-[var(--text-primary)]">
                            {chain.name}
                          </span>
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                          {bal.toFixed(4)} {chain.nativeCurrency.symbol}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        ${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[9px] text-[var(--text-tertiary)]">
                        {summary?.tokenCount || 0} tokens
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'rpc' && (
            <div className="space-y-3">
              {/* Header Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
                  <span className="font-semibold text-[var(--text-primary)]">
                    Active Chain: {selectedChain.name} (#{selectedChain.id})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => switchChainRpc(selectedChain.id)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/30 font-semibold text-[11px] hover:bg-[var(--primary)]/20 cursor-pointer transition-all flex items-center gap-1"
                  title="Rotate to next backup RPC"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rotate RPC</span>
                </button>
              </div>

              {/* Active RPC card */}
              <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--primary)]/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Primary RPC Endpoint
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/20">
                    Active
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[var(--text-secondary)] break-all bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-subtle)] select-all">
                  {activeRpcUrl}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] pt-0.5">
                  <span>Auto-detects 402 / 403 & Rate Limits</span>
                  <span className="text-[var(--primary)] font-medium">Auto-Failover Active</span>
                </div>
              </div>

              {/* Backup Endpoints Pool */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-medium text-[var(--text-secondary)]">
                    Backup Endpoints ({backupRpcUrls.length})
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    Switches automatically on 402/403
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {backupRpcUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="font-mono text-[var(--text-tertiary)] truncate select-all flex-1">
                        {url}
                      </span>
                      <button
                        type="button"
                        onClick={() => switchChainRpc(selectedChain.id, url)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--primary-subtle)] text-[var(--text-secondary)] hover:text-[var(--primary)] border border-[var(--border-app)] cursor-pointer transition-colors shrink-0"
                      >
                        Make Active
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom RPC Form */}
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <Plus className="w-3 h-3 text-[var(--primary)]" />
                  Add Custom Backup RPC
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={customRpcInput}
                    onChange={(e) => setCustomRpcInput(e.target.value)}
                    placeholder="https://your-custom-rpc.com"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customRpcInput.trim()) {
                        addCustomRpcUrl(selectedChain.id, customRpcInput.trim());
                        setCustomRpcInput('');
                      }
                    }}
                    disabled={!customRpcInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[#090B0E] font-bold text-xs hover:opacity-90 cursor-pointer disabled:opacity-50 transition-opacity"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Last Failover Banner if any */}
              {lastRpcFailover && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Recent Auto-Failover Event</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Switched to backup RPC on Chain #{lastRpcFailover.chainId} ({lastRpcFailover.reason}).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {showSwitchList && (
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Choose another wallet to connect:
              </span>
              <button
                onClick={() => setShowSwitchList(false)}
                className="text-xs text-[var(--primary)] hover:underline cursor-pointer"
              >
                Back to active account
              </button>
            </div>
          )}

          {/* Fresh Account Selector Prompt */}
          <div className="p-3 rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary)]/20 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <UserCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>Prompt wallet UI to select a specific account</span>
            </div>
            <button
              onClick={() => handleConnect('injected', true)}
              className="px-2.5 py-1 rounded-lg bg-[var(--primary)] text-[#090B0E] font-bold text-[11px] hover:opacity-90 cursor-pointer shrink-0"
            >
              Fresh Account
            </button>
          </div>

          {walletOptions.map((w) => {
            const isCurrentlyActive = isConnected && walletProvider === w.id;

            return (
              <button
                key={w.id}
                onClick={() => handleConnect(w.id)}
                disabled={isConnecting}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all group text-left cursor-pointer ${
                  isCurrentlyActive
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'border-[var(--border-app)] hover:border-[var(--primary)]/50 bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: w.color }}
                  >
                    {w.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {w.name}
                      </span>
                      {w.isDetected && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[var(--success-subtle)] text-[var(--success)] text-[10px] font-semibold border border-[var(--success)]/20 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                          Detected
                        </span>
                      )}
                      {isCurrentlyActive && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[var(--primary-subtle)] text-[var(--primary)] text-[10px] font-semibold">
                          Connected
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {w.description}
                    </div>
                  </div>
                </div>

                {isCurrentlyActive ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                ) : (
                  <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    Connect →
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 text-center text-xs text-[var(--text-tertiary)] leading-relaxed">
            By connecting a wallet, you agree to Saydex Protocol{' '}
            <span className="text-[var(--text-secondary)] underline cursor-pointer">
              Terms of Service
            </span>{' '}
            and zero-knowledge privacy policies.
          </div>
        </div>
      )}
    </Modal>
  );
};
