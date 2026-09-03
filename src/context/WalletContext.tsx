import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chain, ChainId, Token, PublicClient } from '../types';
import { SUPPORTED_CHAINS } from '../data/mockData';
import { ALL_CHAINS, getChainById } from '../config/chains';
import { UNISWAP_TOKENS } from '../data/uniswapTokens';
import { livePriceService } from '../services/livePriceService';
import {
  fetchAllMultiChainBalances,
  ChainBalanceSummary,
  TokenBalanceResult,
  sanitizeRpcUrlList,
} from '../utils/balanceFetcher';
import { walletLogger, WalletTraceLog } from '../utils/walletLogger';
import {
  rpcProviderWrapper,
  CustomRpcProviderWrapper,
  NetworkRpcPool,
  RpcFailoverEvent,
} from '../utils/rpcProviderWrapper';

export type WalletProviderType = 'metamask' | 'rabby' | 'coinbase' | 'walletconnect' | 'phantom' | 'ledger' | 'injected';

/**
 * Universal chain ID parser that handles:
 * - Hex strings with 0x / 0X prefix ("0x1", "0xaa36a7")
 * - Plain decimal numbers (1, 11155111)
 * - Plain decimal strings ("1", "11155111")
 */
export function parseChainId(rawId: any): number | null {
  if (rawId === null || rawId === undefined) return null;
  if (typeof rawId === 'number') return isNaN(rawId) || rawId <= 0 ? null : rawId;
  if (typeof rawId === 'string') {
    const trimmed = rawId.trim();
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      const parsed = parseInt(trimmed, 16);
      return isNaN(parsed) || parsed <= 0 ? null : parsed;
    }
    const parsedDec = parseInt(trimmed, 10);
    return isNaN(parsedDec) || parsedDec <= 0 ? null : parsedDec;
  }
  return null;
}

/**
 * Robust injected Web3 provider resolver.
 * Accurately finds MetaMask, Rabby, Coinbase, Phantom, or default injected provider.
 */
export function getActiveInjectedProvider(preferredType?: WalletProviderType | null): any {
  if (typeof window === 'undefined') return null;
  const w = window as any;

  // 1. Rabby Wallet (often sets window.rabby or w.ethereum.isRabby)
  if (preferredType === 'rabby') {
    if (w.rabby?.request) return w.rabby;
    if (w.ethereum?.isRabby) return w.ethereum;
    if (w.ethereum?.providers?.length) {
      const found = w.ethereum.providers.find((p: any) => p.isRabby);
      if (found?.request) return found;
    }
  }

  // 2. MetaMask (often inside w.ethereum.providers or w.ethereum)
  if (preferredType === 'metamask') {
    if (w.ethereum?.providers?.length) {
      const found = w.ethereum.providers.find((p: any) => p.isMetaMask && !p.isRabby);
      if (found?.request) return found;
    }
    if (w.ethereum?.isMetaMask && !w.ethereum?.isRabby) return w.ethereum;
  }

  // 3. Coinbase Wallet
  if (preferredType === 'coinbase') {
    if (w.coinbaseWalletExtension?.request) return w.coinbaseWalletExtension;
    if (w.ethereum?.isCoinbaseWallet) return w.ethereum;
    if (w.ethereum?.providers?.length) {
      const found = w.ethereum.providers.find((p: any) => p.isCoinbaseWallet);
      if (found?.request) return found;
    }
  }

  // 4. Phantom Wallet
  if (preferredType === 'phantom') {
    if (w.phantom?.ethereum?.request) return w.phantom.ethereum;
  }

  // 5. Fallback: window.ethereum or window.rabby
  return w.ethereum || w.rabby || w.coinbaseWalletExtension || null;
}

/**
 * Collect all active Web3 provider objects installed in the browser.
 * Used for universal event listener attachment (chainChanged, accountsChanged).
 */
export function getAllInjectedProviders(): any[] {
  if (typeof window === 'undefined') return [];
  const w = window as any;
  const list: any[] = [];

  if (w.rabby?.request && !list.includes(w.rabby)) list.push(w.rabby);
  if (w.coinbaseWalletExtension?.request && !list.includes(w.coinbaseWalletExtension)) list.push(w.coinbaseWalletExtension);
  if (w.phantom?.ethereum?.request && !list.includes(w.phantom.ethereum)) list.push(w.phantom.ethereum);

  if (w.ethereum) {
    if (Array.isArray(w.ethereum.providers)) {
      w.ethereum.providers.forEach((p: any) => {
        if (p?.request && !list.includes(p)) list.push(p);
      });
    }
    if (!list.includes(w.ethereum)) list.push(w.ethereum);
  }

  return list;
}

interface WalletPreset {
  address: string;
  ensName: string;
  ethBalance: number;
  usdcBalance: number;
}

const WALLET_PRESETS: Record<WalletProviderType, WalletPreset> = {
  rabby: {
    address: '0x38D6F3921B5D343b67Ce847c2F1e5D6bE4929810',
    ensName: 'rabby.saydex.eth',
    ethBalance: 6.42,
    usdcBalance: 24500.0,
  },
  metamask: {
    address: '0x71C25e378A9C1284b3e8eD063A4a8996bDf6631E',
    ensName: 'metamask.saydex.eth',
    ethBalance: 3.85,
    usdcBalance: 12400.5,
  },
  coinbase: {
    address: '0x92AE1a40398F657519bCe1953fC1f3A8849fFa97',
    ensName: 'coinbase.saydex.eth',
    ethBalance: 8.12,
    usdcBalance: 35000.0,
  },
  walletconnect: {
    address: '0x5B4136C70d0E2903820FcaFdDF56Bcf800F174B8',
    ensName: 'mobile.saydex.eth',
    ethBalance: 2.15,
    usdcBalance: 8200.0,
  },
  phantom: {
    address: '0x44Fe853A4753551528Ec96C72b78f441C2A5f448',
    ensName: 'phantom.saydex.eth',
    ethBalance: 4.5,
    usdcBalance: 15600.0,
  },
  ledger: {
    address: '0x1943A45C3358055610214Ddb2aD348E0D7101502',
    ensName: 'vault.saydex.eth',
    ethBalance: 15.75,
    usdcBalance: 78000.0,
  },
  injected: {
    address: '0xA82F72e9D349581A7b91d46c82dB49eC91D4B892',
    ensName: 'alex.saydex.eth',
    ethBalance: 4.825,
    usdcBalance: 14850.2,
  },
};

export interface TransactionSignedEvent {
  hash: string;
  isReal: boolean;
  signedAt: number;
  signerAddress: string;
  chainId: number;
  type?: string;
  title?: string;
}

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  ensName: string | null;
  selectedChain: Chain;
  detectedChainId: number | null;
  appChainId: number;
  walletChainId: number | null;
  isChainMismatch: boolean;
  isChainInSync: boolean;
  syncAppWithWalletChain: () => void;
  syncWalletWithAppChain: () => Promise<void>;
  ensureWalletOnChain: (targetChainId: number) => Promise<boolean>;
  assertChainConsistency: (targetChainId: number) => Promise<void>;
  walletProvider: WalletProviderType | null;
  ethBalance: number;
  usdcBalance: number;
  isRealExtensionConnected: boolean;
  detectedExtensions: {
    metamask: boolean;
    rabby: boolean;
    coinbase: boolean;
    phantom: boolean;
    injected: boolean;
  };
  // Real-Time Multi-Chain Balances with debouncing
  tokenBalances: Record<string, TokenBalanceResult>;
  chainSummaries: Record<number, ChainBalanceSummary>;
  totalPortfolioUSD: number;
  isRefreshingBalances: boolean;
  lastBalanceRefresh: Date | null;
  refreshBalances: (forceImmediate?: boolean, overrideChainId?: number, overrideAddress?: string) => Promise<void>;
  getTokenBalance: (tokenOrSymbol: string | Token, chainId?: number) => number;
  getNativeBalanceForChain: (chainId: number) => number;
  getPublicClient: (chainId?: number) => PublicClient;

  connectWallet: (provider: WalletProviderType, options?: { requestFreshAccounts?: boolean }) => Promise<void>;
  requestFreshAccountSelection: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: ChainId) => Promise<void>;
  fixWalletRpc: (chainId?: number) => Promise<void>;
  formatAddress: (addr?: string | null, length?: number) => string;
  updateBalances: (ethDelta: number, usdcDelta: number) => void;
  signMessage: (message: string) => Promise<{ signature: string; signedAt: number; signerAddress: string; isReal: boolean }>;
  signTypedDataV4: (typedData: any) => Promise<{ signature: string; signedAt: number; signerAddress: string; isReal: boolean }>;
  sendTransaction: (params: {
    to?: string;
    value?: string;
    data?: string;
    gas?: string;
    chainId?: number;
    title?: string;
    forceSimulation?: boolean;
  }) => Promise<TransactionSignedEvent>;
  testWalletSignature: () => Promise<{ signature: string; isReal: boolean; signedAt: number }>;

  // Custom RPC Provider with Auto-Failover
  rpcProvider: CustomRpcProviderWrapper;
  activeRpcUrl: string;
  backupRpcUrls: string[];
  rpcPools: Record<number, NetworkRpcPool>;
  lastRpcFailover: RpcFailoverEvent | null;
  getChainActiveRpcUrl: (chainId: number) => string;
  getChainBackupRpcUrls: (chainId: number) => string[];
  switchChainRpc: (chainId: number, newUrl?: string) => string;
  addCustomRpcUrl: (chainId: number, url: string, makeActive?: boolean) => boolean;
  executeRpcCall: <T = any>(chainId: number, method: string, params?: any[]) => Promise<T>;

  // Wallet Trace Logging Engine
  walletLogs: WalletTraceLog[];
  clearLogs: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY_CONNECTED = 'saydex_wallet_connected';
const STORAGE_KEY_PROVIDER = 'saydex_wallet_provider';
const STORAGE_KEY_ADDRESS = 'saydex_wallet_address';
const STORAGE_KEY_ENS = 'saydex_wallet_ens';
const STORAGE_KEY_CHAIN = 'saydex_wallet_chain';
const STORAGE_KEY_IS_REAL = 'saydex_wallet_is_real';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADDRESS);
    // Purge simulated preset addresses so the user is not stuck in demo mode
    if (saved && Object.values(WALLET_PRESETS).some((p) => p.address.toLowerCase() === saved.toLowerCase())) {
      localStorage.removeItem(STORAGE_KEY_ADDRESS);
      localStorage.removeItem(STORAGE_KEY_CONNECTED);
      localStorage.removeItem(STORAGE_KEY_IS_REAL);
      localStorage.removeItem(STORAGE_KEY_PROVIDER);
      return null;
    }
    return saved || null;
  });
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADDRESS);
    if (saved && Object.values(WALLET_PRESETS).some((p) => p.address.toLowerCase() === saved.toLowerCase())) {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY_CONNECTED) === 'true';
  });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletProvider, setWalletProvider] = useState<WalletProviderType | null>(() => {
    return (localStorage.getItem(STORAGE_KEY_PROVIDER) as WalletProviderType) || null;
  });
  const [ensName, setEnsName] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_ENS) || null;
  });
  const [selectedChain, setSelectedChain] = useState<Chain>(() => {
    const savedChain = localStorage.getItem(STORAGE_KEY_CHAIN);
    if (savedChain) {
      const parsed = parseInt(savedChain, 10);
      return getChainById(parsed);
    }
    return SUPPORTED_CHAINS[0];
  });
  const [detectedChainId, setDetectedChainId] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isRealExtensionConnected, setIsRealExtensionConnected] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_IS_REAL) === 'true';
  });

  // Multi-Chain Real-Time Balances State
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalanceResult>>({});
  const [chainSummaries, setChainSummaries] = useState<Record<number, ChainBalanceSummary>>({});
  const [totalPortfolioUSD, setTotalPortfolioUSD] = useState<number>(0);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState<boolean>(false);
  const [lastBalanceRefresh, setLastBalanceRefresh] = useState<Date | null>(null);

  // Live trace log feed
  const [walletLogs, setWalletLogs] = useState<WalletTraceLog[]>(() => walletLogger.getLogs());

  const [detectedExtensions, setDetectedExtensions] = useState({
    metamask: false,
    rabby: false,
    coinbase: false,
    phantom: false,
    injected: false,
  });

  const addressRef = useRef<string | null>(address);
  addressRef.current = address;
  const isRealRef = useRef<boolean>(isRealExtensionConnected);
  isRealRef.current = isRealExtensionConnected;
  const chainIdRef = useRef<number>(selectedChain.id);
  chainIdRef.current = selectedChain.id;
  const detectedChainIdRef = useRef<number | null>(detectedChainId);
  detectedChainIdRef.current = detectedChainId;

  // Abort controller and debounce timer refs for debounced polling strategy
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingBalancesRef = useRef<boolean>(false);
  const lastFetchTimestampRef = useRef<number>(0);

  // Custom RPC Provider State and Dynamic Pool Registry
  const [rpcPools, setRpcPools] = useState<Record<number, NetworkRpcPool>>(() =>
    rpcProviderWrapper.getAllPools()
  );
  const [lastRpcFailover, setLastRpcFailover] = useState<RpcFailoverEvent | null>(null);

  // Subscribe to RPC failovers and pool updates (never trigger balance refresh here to avoid recursive storms)
  useEffect(() => {
    const unsubscribe = rpcProviderWrapper.subscribeToFailovers((event) => {
      setLastRpcFailover(event);
      setRpcPools(rpcProviderWrapper.getAllPools());
    });
    return unsubscribe;
  }, []);

  const getChainActiveRpcUrl = useCallback((chainId: number): string => {
    return rpcProviderWrapper.getActiveEndpoint(chainId);
  }, []);

  const getChainBackupRpcUrls = useCallback((chainId: number): string[] => {
    return rpcProviderWrapper.getBackupEndpoints(chainId);
  }, []);

  const switchChainRpc = useCallback((chainId: number, newUrl?: string): string => {
    let activeUrl: string;
    if (newUrl) {
      rpcProviderWrapper.setActiveEndpoint(chainId, newUrl);
      activeUrl = newUrl;
    } else {
      activeUrl = rpcProviderWrapper.switchToNextBackup(chainId, 'Manual user rotation in interface');
    }
    setRpcPools(rpcProviderWrapper.getAllPools());
    return activeUrl;
  }, []);

  const addCustomRpcUrl = useCallback((chainId: number, url: string, makeActive = false): boolean => {
    const success = rpcProviderWrapper.addBackupEndpoint(chainId, url, makeActive);
    setRpcPools(rpcProviderWrapper.getAllPools());
    return success;
  }, []);

  const executeRpcCall = useCallback(
    async <T = any,>(chainId: number, method: string, params: any[] = []): Promise<T> => {
      return rpcProviderWrapper.execute<T>(chainId, method, params);
    },
    []
  );

  const activeRpcUrl = rpcProviderWrapper.getActiveEndpoint(selectedChain.id);
  const backupRpcUrls = rpcProviderWrapper.getBackupEndpoints(selectedChain.id);

  // Subscribe to logger events with throttling to prevent UI thread freezing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const unsubscribe = walletLogger.subscribe(() => {
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          setWalletLogs(walletLogger.getLogs());
          timeoutId = null;
        }, 250);
      }
    });
    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const clearLogs = useCallback(() => {
    walletLogger.clear();
    setWalletLogs(walletLogger.getLogs());
  }, []);

  const disconnectWallet = useCallback(() => {
    walletLogger.info('PROVIDER_SELECTION', 'Disconnecting wallet and resetting local session.');
    setIsConnected(false);
    setAddress(null);
    setEnsName(null);
    setWalletProvider(null);
    setIsRealExtensionConnected(false);
    setEthBalance(0);
    setUsdcBalance(0);
    setTokenBalances({});
    setChainSummaries({});
    setTotalPortfolioUSD(0);

    localStorage.removeItem(STORAGE_KEY_CONNECTED);
    localStorage.removeItem(STORAGE_KEY_PROVIDER);
    localStorage.removeItem(STORAGE_KEY_ADDRESS);
    localStorage.removeItem(STORAGE_KEY_ENS);
    localStorage.removeItem(STORAGE_KEY_IS_REAL);
  }, []);

  /**
   * Refactored Balance Detection Engine:
   * Uses debounced queueing, validates selected chain against wallet provider,
   * cancels stale in-flight requests, and logs execution trace.
   */
  const executeBalanceFetch = useCallback(
    async (overrideChainId?: number, overrideAddress?: string) => {
      const targetAddress = overrideAddress || addressRef.current;
      if (!targetAddress) {
        walletLogger.debug('BALANCE_QUERY', 'No active address to query balances for. Skipping query.');
        return;
      }

      if (isFetchingBalancesRef.current) {
        walletLogger.debug('BALANCE_QUERY', 'Balance query already in flight. Skipping duplicate execution.');
        return;
      }
      isFetchingBalancesRef.current = true;
      lastFetchTimestampRef.current = Date.now();

      // Cancel any previous in-flight balance request
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;

      const activeCid = overrideChainId || chainIdRef.current;
      const providerCid = detectedChainIdRef.current;

      setIsRefreshingBalances(true);

      try {
        walletLogger.debug(
          'BALANCE_QUERY',
          `Executing balance query for address ${targetAddress.slice(0, 6)}... on chain ${activeCid}. Validating provider chain: ${providerCid || 'none'}`
        );

        const { tokenBalances: tb, chainSummaries: cs, totalPortfolioUSD: total } =
          await fetchAllMultiChainBalances(
            targetAddress,
            livePriceService.enrichTokensWithLivePrices(UNISWAP_TOKENS),
            activeCid,
            isRealRef.current,
            providerCid,
            abortController.signal
          );

        // Check if aborted before setting state
        if (abortController.signal.aborted) {
          walletLogger.debug('BALANCE_QUERY', 'Balance query response discarded (request superseded).');
          return;
        }

        setTokenBalances(tb);
        setChainSummaries(cs);
        setTotalPortfolioUSD(total);
        setLastBalanceRefresh(new Date());

        // Update current chain native & USDC balance for selected chain
        const currentChainSummary = cs[activeCid];
        if (currentChainSummary) {
          setEthBalance(currentChainSummary.nativeBalance);
        }
        const usdcKey = `${activeCid}:usdc`;
        if (tb[usdcKey]) {
          setUsdcBalance(tb[usdcKey].balance);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          walletLogger.debug('BALANCE_QUERY', 'Balance query aborted cleanly.');
        } else {
          walletLogger.warn('BALANCE_QUERY', `Error querying real-time balances: ${err.message || err}`);
        }
      } finally {
        isFetchingBalancesRef.current = false;
        if (activeAbortControllerRef.current === abortController) {
          setIsRefreshingBalances(false);
          activeAbortControllerRef.current = null;
        }
      }
    },
    []
  );

  /**
   * Debounced balance refresh trigger:
   * Batches rapid trigger requests (such as quick chain toggles, token selection, or block events)
   * to avoid RPC spamming while ensuring latest query runs cleanly.
   */
  const refreshBalances = useCallback(
    async (forceImmediate = false, overrideChainId?: number, overrideAddress?: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (forceImmediate) {
        // Enforce a 600ms cooldown even on immediate calls if query is currently running
        if (isFetchingBalancesRef.current || Date.now() - lastFetchTimestampRef.current < 600) {
          debounceTimerRef.current = setTimeout(() => {
            executeBalanceFetch(overrideChainId, overrideAddress);
          }, 600);
          return;
        }
        walletLogger.debug('BALANCE_QUERY', 'Immediate balance refresh requested (bypassing debounce).');
        await executeBalanceFetch(overrideChainId, overrideAddress);
      } else {
        walletLogger.debug('BALANCE_QUERY', 'Queueing debounced balance refresh (400ms window)...');
        debounceTimerRef.current = setTimeout(() => {
          executeBalanceFetch(overrideChainId, overrideAddress);
        }, 400);
      }
    },
    [executeBalanceFetch]
  );

  // Detect real installed browser extensions and detect active accounts & chain on load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eth = (window as any).ethereum;
    const rabbyEth = (window as any).rabby;
    const phantomEth = (window as any).phantom?.ethereum;
    const coinbaseEth = (window as any).coinbaseWalletExtension;

    const detected = {
      metamask: Boolean(eth?.isMetaMask && !eth?.isRabby),
      rabby: Boolean(rabbyEth?.isRabby || eth?.isRabby),
      coinbase: Boolean(coinbaseEth || eth?.isCoinbaseWallet),
      phantom: Boolean(phantomEth?.isPhantom || (window as any).phantom?.solana),
      injected: Boolean(eth || rabbyEth || coinbaseEth),
    };

    setDetectedExtensions(detected);
    walletLogger.info('PROVIDER_DISCOVERY', 'Scanned browser environment for Web3 wallet providers:', detected);

    // Prefer the user's previously connected provider or any discovered active provider
    const activeEth = getActiveInjectedProvider(walletProvider) || eth || rabbyEth;

    if (activeEth?.request) {
      activeEth
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            const liveAddr = accounts[0];
            walletLogger.info('ACCOUNT_SELECTION', `Discovered active authorized account: ${liveAddr}`);
            setAddress(liveAddr);
            setIsConnected(true);
            setIsRealExtensionConnected(true);
            localStorage.setItem(STORAGE_KEY_CONNECTED, 'true');
            localStorage.setItem(STORAGE_KEY_ADDRESS, liveAddr);

            activeEth
              .request({ method: 'eth_chainId' })
              .then((rawHexId: any) => {
                const decId = parseChainId(rawHexId);
                if (decId && decId > 0) {
                  setDetectedChainId(decId);
                  detectedChainIdRef.current = decId;
                  walletLogger.info('CHAIN_VALIDATION', `Wallet provider is active on Chain ID: ${decId}`);
                  const resolvedChain = getChainById(decId);
                  setSelectedChain(resolvedChain);
                  localStorage.setItem(STORAGE_KEY_CHAIN, resolvedChain.id.toString());
                  refreshBalances(true, resolvedChain.id, liveAddr);
                } else {
                  refreshBalances(true, undefined, liveAddr);
                }
              })
              .catch(() => {
                refreshBalances(true, undefined, liveAddr);
              });
          } else {
            walletLogger.info('PROVIDER_DISCOVERY', 'No pre-authorized accounts returned by provider. Awaiting explicit user connection.');
            // Clear detectedChainId when no account is connected so false mismatch warnings are never shown
            setDetectedChainId(null);
            detectedChainIdRef.current = null;
          }
        })
        .catch((err: any) => {
          walletLogger.warn('PROVIDER_DISCOVERY', `eth_accounts check returned: ${err.message || err}`);
        });
    }
  }, [refreshBalances, walletProvider]);

  // Universal Multi-Provider event listener (MetaMask, Rabby, Coinbase, Phantom, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const providers = getAllInjectedProviders();
    if (providers.length === 0) return;

    const handleAccountsChanged = (accounts: string[]) => {
      walletLogger.info('ACCOUNT_SELECTION', 'Provider event accountsChanged received:', accounts);
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAddress = accounts[0];
        setAddress(newAddress);
        setEnsName(null);
        setIsConnected(true);
        setIsRealExtensionConnected(true);
        localStorage.setItem(STORAGE_KEY_CONNECTED, 'true');
        localStorage.setItem(STORAGE_KEY_ADDRESS, newAddress);
        localStorage.removeItem(STORAGE_KEY_ENS);
        refreshBalances(true, undefined, newAddress);
      }
    };

    const handleChainChanged = (chainIdRaw: any) => {
      try {
        const decimalId = parseChainId(chainIdRaw);
        if (!decimalId) return;
        walletLogger.info('CHAIN_VALIDATION', `Provider event chainChanged received: Chain ${decimalId} (${chainIdRaw})`);
        setDetectedChainId(decimalId);
        detectedChainIdRef.current = decimalId;
        const resolvedChain = getChainById(decimalId);
        setSelectedChain(resolvedChain);
        localStorage.setItem(STORAGE_KEY_CHAIN, resolvedChain.id.toString());
        refreshBalances(true, decimalId);
      } catch (err) {
        walletLogger.warn('CHAIN_VALIDATION', `Chain changed parsing error: ${err}`);
      }
    };

    providers.forEach((p) => {
      if (p?.on) {
        try {
          p.on('accountsChanged', handleAccountsChanged);
          p.on('chainChanged', handleChainChanged);
        } catch {}
      }
    });

    return () => {
      providers.forEach((p) => {
        if (p?.removeListener) {
          try {
            p.removeListener('accountsChanged', handleAccountsChanged);
            p.removeListener('chainChanged', handleChainChanged);
          } catch {}
        }
      });
    };
  }, [refreshBalances, disconnectWallet, walletProvider]);

  // Active Window Focus & Visibility Re-Syncing (solves isolated extension popups)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncWalletState = async () => {
      if (!isConnected && !isRealExtensionConnected) return;
      const eth = getActiveInjectedProvider(walletProvider);
      if (!eth?.request) return;

      try {
        const rawHex = await eth.request({ method: 'eth_chainId' });
        const decId = parseChainId(rawHex);
        if (decId && decId > 0) {
          if (detectedChainIdRef.current !== decId) {
            walletLogger.info('CHAIN_VALIDATION', `Auto-synced wallet chain from window event: #${decId}`);
            setDetectedChainId(decId);
            detectedChainIdRef.current = decId;
            const resolvedChain = getChainById(decId);
            setSelectedChain(resolvedChain);
            localStorage.setItem(STORAGE_KEY_CHAIN, resolvedChain.id.toString());
            refreshBalances(true, decId);
          }
        }
      } catch {}
    };

    const handleFocus = () => {
      syncWalletState();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Periodic fast-sync check while wallet is actively connected (every 3 seconds)
    const interval = setInterval(syncWalletState, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(interval);
    };
  }, [isConnected, isRealExtensionConnected, walletProvider, refreshBalances]);

  // Debounced background polling every 15 seconds when active
  useEffect(() => {
    if (address) {
      refreshBalances(false, selectedChain.id);
    }
    const interval = setInterval(() => {
      if (address && typeof document !== 'undefined' && !document.hidden) {
        refreshBalances(false, selectedChain.id);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [refreshBalances, address, selectedChain.id]);

  // Helper to query token balance for any token object or symbol
  const getTokenBalance = useCallback(
    (tokenOrSymbol: string | Token, chainId?: number): number => {
      const targetChainId = chainId || (typeof tokenOrSymbol === 'object' && tokenOrSymbol.chainId ? tokenOrSymbol.chainId : selectedChain.id);
      
      let tokenKey = '';
      let symbolKey = '';
      let sym = '';

      if (typeof tokenOrSymbol === 'object') {
        sym = tokenOrSymbol.symbol.toUpperCase();
        // Check if native token
        const isNative =
          !tokenOrSymbol.address ||
          tokenOrSymbol.address === '0x0000000000000000000000000000000000000000' ||
          sym === selectedChain.nativeCurrency.symbol.toUpperCase() ||
          (sym === 'ETH' && [1, 42161, 8453, 10, 130].includes(targetChainId)) ||
          (sym === 'POL' && targetChainId === 137) ||
          (sym === 'BNB' && targetChainId === 56) ||
          (sym === 'AVAX' && targetChainId === 43114) ||
          (sym === 'SEP' && targetChainId === 11155111);

        if (isNative) {
          return chainSummaries[targetChainId]?.nativeBalance ?? (targetChainId === selectedChain.id ? ethBalance : (isRealExtensionConnected ? 0 : (tokenOrSymbol.balance || 0)));
        }

        tokenKey = `${targetChainId}:${tokenOrSymbol.address.toLowerCase()}`;
        symbolKey = `${targetChainId}:${sym}`;
      } else {
        sym = tokenOrSymbol.toUpperCase();
        const isNative =
          sym === selectedChain.nativeCurrency.symbol.toUpperCase() ||
          (sym === 'ETH' && [1, 42161, 8453, 10, 130].includes(targetChainId)) ||
          (sym === 'POL' && targetChainId === 137) ||
          (sym === 'BNB' && targetChainId === 56) ||
          (sym === 'AVAX' && targetChainId === 43114) ||
          (sym === 'SEP' && targetChainId === 11155111);

        if (isNative) {
          return chainSummaries[targetChainId]?.nativeBalance ?? (targetChainId === selectedChain.id ? ethBalance : 0);
        }
        tokenKey = `${targetChainId}:${tokenOrSymbol.toLowerCase()}`;
        symbolKey = `${targetChainId}:${sym}`;
      }

      if (tokenBalances[tokenKey]) {
        return tokenBalances[tokenKey].balance;
      }
      if (tokenBalances[symbolKey]) {
        return tokenBalances[symbolKey].balance;
      }

      // If querying for selected chain, also check bare symbol key
      if (targetChainId === selectedChain.id) {
        if (tokenBalances[sym]) {
          return tokenBalances[sym].balance;
        }
        if (tokenBalances[sym.toLowerCase()]) {
          return tokenBalances[sym.toLowerCase()].balance;
        }
      }

      if (typeof tokenOrSymbol === 'object' && !isRealExtensionConnected && tokenOrSymbol.balance !== undefined) {
        return tokenOrSymbol.balance;
      }

      return 0;
    },
    [tokenBalances, chainSummaries, selectedChain, ethBalance, isRealExtensionConnected]
  );

  const getNativeBalanceForChain = useCallback(
    (chainId: number): number => {
      return chainSummaries[chainId]?.nativeBalance ?? 0;
    },
    [chainSummaries]
  );

  /**
   * Request fresh account selection from the connected Web3 provider UI.
   * Uses EIP-2255 `wallet_requestPermissions` which commands MetaMask/Rabby
   * to display its native account picker modal so the user can choose a new address.
   */
  const requestFreshAccountSelection = async () => {
    walletLogger.info('ACCOUNT_SELECTION', 'Initiating fresh account selection via wallet_requestPermissions...');
    if (typeof window !== 'undefined') {
      const eth = (window as any).ethereum;
      if (eth?.request) {
        try {
          const permissions = await eth.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          });
          walletLogger.info('ACCOUNT_SELECTION', 'Permissions modal approved by user:', permissions);

          // Read the newly selected account
          const accounts: string[] = await eth.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const selectedAddr = accounts[0];
            walletLogger.info('ACCOUNT_SELECTION', `Fresh account selected from wallet UI: ${selectedAddr}`);
            setAddress(selectedAddr);
            setEnsName(null);
            setIsConnected(true);
            setIsRealExtensionConnected(true);
            localStorage.setItem(STORAGE_KEY_CONNECTED, 'true');
            localStorage.setItem(STORAGE_KEY_ADDRESS, selectedAddr);
            refreshBalances(true, undefined, selectedAddr);
            return;
          }
        } catch (err: any) {
          if (err.code === 4001 || err.message?.includes('rejected')) {
            walletLogger.warn('ACCOUNT_SELECTION', 'User cancelled fresh account selection in wallet UI.');
            return;
          }
          walletLogger.warn(
            'ACCOUNT_SELECTION',
            `wallet_requestPermissions not supported by this provider (${err.message}). Falling back to eth_requestAccounts.`
          );
        }
      }
    }
  };

  /**
   * Connect wallet with support for fresh account selection
   */
  const connectWallet = async (
    provider: WalletProviderType,
    options?: { requestFreshAccounts?: boolean }
  ) => {
    setIsConnecting(true);
    walletLogger.info(
      'PROVIDER_SELECTION',
      `User initiated wallet connection for provider: ${provider.toUpperCase()}${options?.requestFreshAccounts ? ' (Requesting fresh account picker)' : ''}`
    );

    try {
      const eth = getActiveInjectedProvider(provider);

      // Prefer real browser extension connection whenever provider is available
      if (eth?.request) {
        try {
          let accounts: string[] = [];

          if (options?.requestFreshAccounts) {
            try {
              walletLogger.info('ACCOUNT_SELECTION', 'Prompting wallet UI for fresh account permissions...');
              await eth.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
              });
            } catch (permErr: any) {
              walletLogger.debug('ACCOUNT_SELECTION', 'wallet_requestPermissions skipped or declined, proceeding with requestAccounts.');
            }
          }

          accounts = await eth.request({ method: 'eth_requestAccounts' });

          if (accounts && accounts.length > 0) {
            const realAddress = accounts[0];
            walletLogger.info('ACCOUNT_SELECTION', `Successfully connected address: ${realAddress}`);
            setAddress(realAddress);
            setEnsName(null);
            setWalletProvider(provider);
            setIsConnected(true);
            setIsRealExtensionConnected(true);

            let activeCid = selectedChain.id;
            // Read live chain ID from wallet
            try {
              const chainIdHex = await eth.request({ method: 'eth_chainId' });
              const decId = parseInt(chainIdHex, 16);
              if (!isNaN(decId) && decId > 0) {
                setDetectedChainId(decId);
                detectedChainIdRef.current = decId;
                const resolvedChain = getChainById(decId);
                setSelectedChain(resolvedChain);
                activeCid = resolvedChain.id;
                localStorage.setItem(STORAGE_KEY_CHAIN, resolvedChain.id.toString());
                walletLogger.info('CHAIN_VALIDATION', `Synchronized chain with provider: ${resolvedChain.name} (${decId})`);
              }
            } catch {
              // fallback
            }

            localStorage.setItem(STORAGE_KEY_CONNECTED, 'true');
            localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
            localStorage.setItem(STORAGE_KEY_ADDRESS, realAddress);
            localStorage.removeItem(STORAGE_KEY_ENS);
            setIsConnecting(false);

            // Fetch live balances immediately
            refreshBalances(true, activeCid, realAddress);
            return;
          }
        } catch (err: any) {
          if (err.code === 4001 || err.message?.includes('rejected')) {
            walletLogger.warn('PROVIDER_SELECTION', 'Connection rejected by user in Web3 wallet extension.');
            setIsConnecting(false);
            return;
          }
          walletLogger.error('PROVIDER_SELECTION', `Web3 extension error: ${err.message || err}`);
          throw err;
        }
      }

      // If provider was not found and user requested a real extension, do NOT pretend with demo profile
      if (provider === 'metamask' || provider === 'rabby' || provider === 'coinbase' || provider === 'phantom') {
        const errorMsg = `No ${provider.toUpperCase()} extension found in your browser. Please ensure the extension is installed, enabled, and unlocked.`;
        walletLogger.error('PROVIDER_SELECTION', errorMsg);
        throw new Error(errorMsg);
      }

      // Simulated / Demo Profile connection only for fallback
      await new Promise((res) => setTimeout(res, 300));
      const preset = WALLET_PRESETS[provider] || WALLET_PRESETS.rabby;

      walletLogger.info('PROVIDER_SELECTION', `Loaded simulated demo profile for ${provider} (${preset.address.slice(0, 6)}...).`);
      setWalletProvider(provider);
      setAddress(preset.address);
      setEnsName(preset.ensName);
      setEthBalance(preset.ethBalance);
      setUsdcBalance(preset.usdcBalance);
      setIsConnected(true);
      setIsRealExtensionConnected(false);

      localStorage.setItem(STORAGE_KEY_CONNECTED, 'true');
      localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
      localStorage.setItem(STORAGE_KEY_ADDRESS, preset.address);
      localStorage.setItem(STORAGE_KEY_ENS, preset.ensName);
      
      refreshBalances(true, selectedChain.id, preset.address);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Switch network with seamless EIP-3326 & EIP-3085 (wallet_addEthereumChain) fallback
   */
  const switchChain = async (chainId: ChainId) => {
    const chain = getChainById(chainId);
    walletLogger.info('CHAIN_VALIDATION', `Switching active chain to: ${chain.name} (${chain.id})`);
    setSelectedChain(chain);
    chainIdRef.current = chain.id;
    localStorage.setItem(STORAGE_KEY_CHAIN, chain.id.toString());

    // Update current native balance immediately from cache if available
    if (chainSummaries[chain.id]) {
      setEthBalance(chainSummaries[chain.id].nativeBalance);
    }

    if (typeof window !== 'undefined') {
      const eth = getActiveInjectedProvider(walletProvider);
      if (eth?.request) {
        const hexChainId = '0x' + Number(chainId).toString(16);
        const safeRpcs = sanitizeRpcUrlList([
          chain.rpcUrl,
          ...(chain.rpcUrls?.default?.http || []),
        ]).filter((url) => !url.includes('drpc.org') && !url.includes('drpc.io'));

        try {
          // On testnets or Rabby, proactively push verified RPC endpoints
          if (chain.testnet || Boolean((eth as any)?.isRabby)) {
            try {
              await eth.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: hexChainId,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: safeRpcs,
                    blockExplorerUrls: [chain.blockExplorerUrl],
                  },
                ],
              });
            } catch {}
          }

          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
          });
          setDetectedChainId(Number(chainId));
          detectedChainIdRef.current = Number(chainId);
          walletLogger.info('CHAIN_VALIDATION', `Wallet provider switched successfully to Chain ${chainId}`);
        } catch (switchError: any) {
          if (switchError.code === 4001 || switchError.message?.includes('rejected')) {
            walletLogger.warn('CHAIN_VALIDATION', 'User rejected network switch in wallet.');
          } else if (
            switchError.code === 4902 ||
            switchError.message?.includes('Unrecognized chain') ||
            switchError.message?.includes('Try adding the chain')
          ) {
            try {
              walletLogger.info('CHAIN_VALIDATION', `Chain ${chainId} not configured in wallet. Requesting wallet_addEthereumChain...`);
              await eth.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: hexChainId,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: safeRpcs,
                    blockExplorerUrls: [chain.blockExplorerUrl],
                  },
                ],
              });
              setDetectedChainId(Number(chainId));
              detectedChainIdRef.current = Number(chainId);
              walletLogger.info('CHAIN_VALIDATION', `Added and switched to Chain ${chainId}`);
            } catch (addError) {
              walletLogger.warn('CHAIN_VALIDATION', `Failed to add chain to wallet: ${addError}`);
            }
          }
        }
      }
    }

    // Refresh balances on new selected chain immediately
    refreshBalances(true, chain.id);
  };

  /**
   * Proactively pushes verified Alchemy / publicnode RPC endpoints into wallet extension (Rabby/MetaMask)
   * via EIP-3085 (wallet_addEthereumChain), replacing dead endpoints like sepolia.drpc.org.
   */
  const fixWalletRpc = useCallback(
    async (chainId?: number) => {
      const targetId = chainId || selectedChain.id;
      const targetChain = getChainById(targetId);
      const eth = getActiveInjectedProvider(walletProvider);
      if (!eth?.request) throw new Error('No Web3 wallet extension detected.');

      const hexTarget = '0x' + Number(targetId).toString(16);
      const safeEndpoints = sanitizeRpcUrlList([
        targetChain.rpcUrl,
        ...(targetChain.rpcUrls?.default?.http || []),
      ]).filter((url) => !url.includes('drpc.org') && !url.includes('drpc.io'));

      walletLogger.info(
        'CHAIN_VALIDATION',
        `Prompting wallet extension via wallet_addEthereumChain to update RPC on Chain ${targetId} (${targetChain.name}) with safe endpoints:`,
        safeEndpoints
      );

      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexTarget,
            chainName: targetChain.name,
            nativeCurrency: targetChain.nativeCurrency,
            rpcUrls: safeEndpoints,
            blockExplorerUrls: [targetChain.blockExplorerUrl],
          },
        ],
      });

      walletLogger.info('CHAIN_VALIDATION', `Wallet RPC updated successfully for Chain ${targetId}`);
    },
    [selectedChain.id, walletProvider]
  );

  const isChainMismatch = Boolean(
    isConnected && isRealExtensionConnected && detectedChainId !== null && detectedChainId !== selectedChain.id
  );

  const isChainInSync = !isRealExtensionConnected || (detectedChainId !== null && detectedChainId === selectedChain.id);

  const syncAppWithWalletChain = useCallback(() => {
    if (detectedChainId) {
      const chain = getChainById(detectedChainId);
      walletLogger.info('CHAIN_VALIDATION', `Syncing UI chain to match Wallet Provider: ${chain.name} (${chain.id})`);
      setSelectedChain(chain);
      chainIdRef.current = chain.id;
      localStorage.setItem(STORAGE_KEY_CHAIN, chain.id.toString());
      refreshBalances(true, chain.id);
    }
  }, [detectedChainId, refreshBalances]);

  const syncWalletWithAppChain = useCallback(async () => {
    await switchChain(selectedChain.id);
  }, [selectedChain.id, switchChain]);

  /**
   * Pre-flight Chain Synchronization:
   * Enforces that the wallet provider is on the exact target chain ID before a signature/transaction occurs.
   * If live extension is connected and not on targetChainId, requests a seamless chain switch.
   */
  const ensureWalletOnChain = useCallback(
    async (targetChainId: number): Promise<boolean> => {
      const targetChain = getChainById(targetChainId);

      // 1. If in simulated demo mode, sync app selectedChain directly
      if (!isRealExtensionConnected) {
        if (selectedChain.id !== targetChainId) {
          setSelectedChain(targetChain);
          chainIdRef.current = targetChain.id;
          localStorage.setItem(STORAGE_KEY_CHAIN, targetChain.id.toString());
          refreshBalances(true, targetChain.id);
        }
        return true;
      }

      // 2. Real Web3 wallet extension connected
      if (typeof window === 'undefined') return false;
      const eth = getActiveInjectedProvider(walletProvider);
      if (!eth?.request) return false;

      // Check current detected provider chain
      let currentChainId = detectedChainIdRef.current;
      try {
        const hex = await eth.request({ method: 'eth_chainId' });
        const dec = parseInt(hex, 16);
        if (!isNaN(dec) && dec > 0) {
          currentChainId = dec;
          setDetectedChainId(dec);
          detectedChainIdRef.current = dec;
        }
      } catch {}

      if (currentChainId === targetChainId) {
        // App and Wallet are already on the target chain
        if (selectedChain.id !== targetChainId) {
          setSelectedChain(targetChain);
          chainIdRef.current = targetChain.id;
          localStorage.setItem(STORAGE_KEY_CHAIN, targetChain.id.toString());
        }
        return true;
      }

      // Chain mismatch detected, request network switch
      walletLogger.info(
        'CHAIN_VALIDATION',
        `Pre-flight assertion: Wallet is on Chain ${currentChainId}, switching to required Target Chain ${targetChainId} (${targetChain.name})...`
      );

      const hexTarget = '0x' + Number(targetChainId).toString(16);
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexTarget }],
        });

        // Re-query chain ID to confirm
        const postHex = await eth.request({ method: 'eth_chainId' });
        const postDec = parseInt(postHex, 16);
        setDetectedChainId(postDec);
        detectedChainIdRef.current = postDec;
        setSelectedChain(targetChain);
        chainIdRef.current = targetChain.id;
        localStorage.setItem(STORAGE_KEY_CHAIN, targetChain.id.toString());
        refreshBalances(true, targetChain.id);

        walletLogger.info('CHAIN_VALIDATION', `Wallet provider confirmed switch to Target Chain ${targetChainId}`);
        return true;
      } catch (switchErr: any) {
        if (switchErr.code === 4001 || switchErr.message?.includes('rejected')) {
          walletLogger.warn('CHAIN_VALIDATION', 'User rejected required network switch in wallet.');
          throw new Error(`Transaction cancelled: Network switch to ${targetChain.name} (${targetChainId}) was rejected in your wallet.`);
        }

        // If chain is not added to wallet, attempt wallet_addEthereumChain
        if (
          switchErr.code === 4902 ||
          switchErr.message?.includes('Unrecognized chain') ||
          switchErr.message?.includes('Try adding the chain')
        ) {
          try {
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: hexTarget,
                  chainName: targetChain.name,
                  nativeCurrency: targetChain.nativeCurrency,
                  rpcUrls: sanitizeRpcUrlList([targetChain.rpcUrl, ...(targetChain.rpcUrls?.default?.http || [])]),
                  blockExplorerUrls: [targetChain.blockExplorerUrl],
                },
              ],
            });

            setDetectedChainId(targetChainId);
            detectedChainIdRef.current = targetChainId;
            setSelectedChain(targetChain);
            chainIdRef.current = targetChain.id;
            localStorage.setItem(STORAGE_KEY_CHAIN, targetChain.id.toString());
            refreshBalances(true, targetChain.id);
            return true;
          } catch (addErr: any) {
            walletLogger.warn('CHAIN_VALIDATION', `Failed to add target chain ${targetChainId} to wallet: ${addErr.message}`);
            throw new Error(`Failed to add and switch to ${targetChain.name} (${targetChainId}) in your wallet.`);
          }
        }

        throw switchErr;
      }
    },
    [isRealExtensionConnected, selectedChain.id, refreshBalances]
  );

  /**
   * Assert chain consistency and abort if mismatched
   */
  const assertChainConsistency = useCallback(
    async (targetChainId: number): Promise<void> => {
      const ok = await ensureWalletOnChain(targetChainId);
      if (!ok) {
        throw new Error(`Chain mismatch: Target chain ${targetChainId} is not active in wallet.`);
      }
    },
    [ensureWalletOnChain]
  );

  const getPublicClientInstance = useCallback(
    (chainId?: number) => {
      return rpcProviderWrapper.getPublicClient(chainId || selectedChain.id);
    },
    [selectedChain.id]
  );

  const formatAddress = (addr?: string | null, length = 4): string => {
    if (!addr) return '';
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 2 + length)}...${addr.slice(-length)}`;
  };

  const updateBalances = (ethDelta: number, usdcDelta: number) => {
    setEthBalance((prev) => Math.max(0, parseFloat((prev + ethDelta).toFixed(6))));
    setUsdcBalance((prev) => Math.max(0, parseFloat((prev + usdcDelta).toFixed(2))));
    setTimeout(() => refreshBalances(true), 500);
  };

  /**
   * Request personal signature from the connected Web3 wallet
   */
  const signMessage = async (
    message: string
  ): Promise<{ signature: string; signedAt: number; signerAddress: string; isReal: boolean }> => {
    const signer = address || '0x0000000000000000000000000000000000000000';
    walletLogger.info('TRANSACTION_LIFECYCLE', `Requesting personal_sign for message (${message.slice(0, 32)}...) from ${signer.slice(0, 6)}...`);

    if (typeof window !== 'undefined' && (window as any).ethereum && address) {
      const eth = (window as any).ethereum;
      try {
        const msgHex = `0x${Array.from(new TextEncoder().encode(message))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`;
        const signature: string = await eth.request({
          method: 'personal_sign',
          params: [msgHex, address],
        });
        const signedAt = Date.now();
        walletLogger.info('TRANSACTION_LIFECYCLE', `Message signed successfully by wallet provider! Signature: ${signature.slice(0, 16)}...`);
        return { signature, signedAt, signerAddress: address, isReal: true };
      } catch (err: any) {
        if (err.code === 4001 || err.message?.includes('rejected')) {
          walletLogger.warn('TRANSACTION_LIFECYCLE', 'Signature request rejected by user in wallet.');
          throw new Error('User rejected the signature request in wallet.');
        }
        walletLogger.warn('TRANSACTION_LIFECYCLE', `Personal sign failed in extension: ${err.message || err}. Falling back to simulation.`);
      }
    }

    // Cryptographic simulated signature fallback
    await new Promise((r) => setTimeout(r, 600));
    const simSig = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}1b`;
    const signedAt = Date.now();
    walletLogger.info('TRANSACTION_LIFECYCLE', `Simulated signature captured: ${simSig.slice(0, 16)}...`);
    return { signature: simSig, signedAt, signerAddress: signer, isReal: false };
  };

  /**
   * Request EIP-712 Typed Data signature (Permit2 / SwapRouter)
   */
  const signTypedDataV4 = async (
    typedData: any
  ): Promise<{ signature: string; signedAt: number; signerAddress: string; isReal: boolean }> => {
    const signer = address || '0x0000000000000000000000000000000000000000';
    walletLogger.info('TRANSACTION_LIFECYCLE', `Prompting wallet for EIP-712 Permit2 Typed Data signature (PrimaryType: ${typedData?.primaryType || 'PermitSingle'})...`);

    if (typeof window !== 'undefined' && (window as any).ethereum && address) {
      const eth = (window as any).ethereum;
      try {
        const payloadString = typeof typedData === 'string' ? typedData : JSON.stringify(typedData);
        const signature: string = await eth.request({
          method: 'eth_signTypedData_v4',
          params: [address, payloadString],
        });
        const signedAt = Date.now();
        walletLogger.info('TRANSACTION_LIFECYCLE', `EIP-712 Typed Data signed via wallet provider! Sig: ${signature.slice(0, 16)}...`);
        return { signature, signedAt, signerAddress: address, isReal: true };
      } catch (err: any) {
        if (err.code === 4001 || err.message?.includes('rejected')) {
          walletLogger.warn('TRANSACTION_LIFECYCLE', 'EIP-712 Permit2 signature rejected by user in wallet.');
          throw new Error('User rejected EIP-712 Permit2 signature in wallet.');
        }
        walletLogger.warn('TRANSACTION_LIFECYCLE', `eth_signTypedData_v4 failed: ${err.message || err}. Falling back to simulation.`);
      }
    }

    await new Promise((r) => setTimeout(r, 700));
    const simSig = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}1c`;
    const signedAt = Date.now();
    walletLogger.info('TRANSACTION_LIFECYCLE', `Simulated EIP-712 signature generated: ${simSig.slice(0, 16)}...`);
    return { signature: simSig, signedAt, signerAddress: signer, isReal: false };
  };

  /**
   * Request transaction execution on chain and monitor signature capture with strict chain assertion
   */
  const sendTransaction = async (params: {
    to?: string;
    value?: string;
    data?: string;
    gas?: string;
    chainId?: number;
    title?: string;
    forceSimulation?: boolean;
  }): Promise<TransactionSignedEvent> => {
    const targetChainId = params.chainId || selectedChain.id;

    // Explicit simulation mode only if requested
    if (params.forceSimulation) {
      await new Promise((r) => setTimeout(r, 900));
      const generatedHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      const signedAt = Date.now();
      walletLogger.info('TRANSACTION_LIFECYCLE', `Transaction signed in simulation. Generated Hash: ${generatedHash}`);
      setTimeout(() => refreshBalances(true, targetChainId), 1500);
      return {
        hash: generatedHash,
        isReal: false,
        signedAt,
        signerAddress: address || '0x0000000000000000000000000000000000000000',
        chainId: targetChainId,
        title: params.title,
      };
    }

    // REAL ON-CHAIN TRANSACTION EXECUTION:
    const eth = getActiveInjectedProvider(walletProvider);

    if (!eth?.request) {
      const msg = `Web3 wallet provider (${walletProvider || 'MetaMask/Rabby'}) is not available in this browser. Please ensure your extension is installed and unlocked.`;
      walletLogger.error('TRANSACTION_LIFECYCLE', msg);
      throw new Error(msg);
    }

    // Always fetch active unlocked account directly from provider
    let activeAccount = address;
    try {
      const accounts: string[] = await eth.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        activeAccount = accounts[0];
        if (address !== activeAccount) {
          setAddress(activeAccount);
          localStorage.setItem(STORAGE_KEY_ADDRESS, activeAccount);
        }
      }
    } catch {}

    if (!activeAccount) {
      const reqAccounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      if (reqAccounts && reqAccounts.length > 0) {
        activeAccount = reqAccounts[0];
        setAddress(activeAccount);
        localStorage.setItem(STORAGE_KEY_ADDRESS, activeAccount);
      } else {
        throw new Error('Please open and unlock your MetaMask or Rabby extension.');
      }
    }

    // Pre-flight assertion: verify and switch wallet chain if necessary
    await ensureWalletOnChain(targetChainId);

    if (!params.to) {
      throw new Error('Transaction destination (to) address is required.');
    }
    const targetTo = params.to;

    walletLogger.info(
      'TRANSACTION_LIFECYCLE',
      `Dispatching real on-chain transaction "${params.title || 'Swap'}" to wallet extension on Chain ${targetChainId}...`,
      { to: targetTo, from: activeAccount, value: params.value || '0x0', data: params.data }
    );

    try {
      const txHash: string = await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: activeAccount,
            to: targetTo,
            value: params.value || '0x0',
            data: params.data || '0x',
            ...(params.gas ? { gas: params.gas } : {}),
          },
        ],
      });

      const signedAt = Date.now();
      walletLogger.info(
        'TRANSACTION_LIFECYCLE',
        `Transaction broadcasted onto blockchain! Tx Hash: ${txHash}. Signer: ${activeAccount}`,
        { hash: txHash, chainId: targetChainId }
      );

      setTimeout(() => refreshBalances(true, targetChainId), 1500);
      return {
        hash: txHash,
        isReal: true,
        signedAt,
        signerAddress: activeAccount,
        chainId: targetChainId,
        title: params.title,
      };
    } catch (err: any) {
      if (err.code === 4001 || err.message?.includes('rejected')) {
        walletLogger.warn('TRANSACTION_LIFECYCLE', 'Transaction rejected by user in wallet.');
        throw new Error('Transaction was rejected by the user in wallet.');
      }

      // Detect dead or restricted RPC in wallet extension (such as Rabby default drpc.org endpoints)
      const isRestrictedRpc =
        err.message?.includes('drpc.org') ||
        err.message?.includes('drpc.io') ||
        err.message?.includes('free plan') ||
        err.message?.includes('paid plan') ||
        err.message?.includes('RPC Request failed') ||
        err.message?.includes('403') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('rate limit') ||
        err.message?.includes('429');

      if (isRestrictedRpc) {
        walletLogger.warn(
          'TRANSACTION_LIFECYCLE',
          'Wallet extension failed with restricted dRPC endpoint. Attempting automatic RPC update via wallet_addEthereumChain...'
        );
        try {
          await fixWalletRpc(targetChainId);
          // Wait briefly for wallet provider internal state refresh
          await new Promise((res) => setTimeout(res, 600));

          // Retry sending transaction with repaired RPC
          const retryTxHash: string = await eth.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: activeAccount,
                to: targetTo,
                value: params.value || '0x0',
                data: params.data || '0x',
                ...(params.gas ? { gas: params.gas } : {}),
              },
            ],
          });

          return {
            hash: retryTxHash,
            isReal: true,
            signedAt: Date.now(),
            signerAddress: activeAccount,
            chainId: targetChainId,
            title: params.title,
          };
        } catch (repairErr: any) {
          if (repairErr.code === 4001 || repairErr.message?.includes('rejected')) {
            throw new Error('Please approve updating the network RPC in your wallet to proceed with the swap.');
          }
          throw new Error(
            `Your wallet (Rabby) is using a dead default RPC (sepolia.drpc.org). Please update Rabby's Sepolia RPC to Alchemy or publicnode in Rabby Settings -> Custom RPC.`
          );
        }
      }

      walletLogger.error('TRANSACTION_LIFECYCLE', `eth_sendTransaction failed: ${err.message || err}`);
      throw new Error(err.message || 'Transaction failed in your Web3 wallet.');
    }
  };

  /**
   * Immediate Web3 signature verification test
   */
  const testWalletSignature = async (): Promise<{ signature: string; isReal: boolean; signedAt: number }> => {
    const timestamp = new Date().toISOString();
    const testMessage = `Welcome to Saydex Protocol!\n\nVerify wallet ownership & session auth:\nAccount: ${address}\nChain ID: ${selectedChain.id} (${selectedChain.name})\nTimestamp: ${timestamp}\nNonce: ${Math.floor(Math.random() * 1000000)}`;

    if (typeof window !== 'undefined' && (window as any).ethereum && address) {
      const eth = (window as any).ethereum;
      try {
        const msgHex = `0x${Array.from(new TextEncoder().encode(testMessage))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}`;
        const signature: string = await eth.request({
          method: 'personal_sign',
          params: [msgHex, address],
        });
        const signedAt = Date.now();
        walletLogger.info('TRANSACTION_LIFECYCLE', `Test signature completed via wallet provider: ${signature.slice(0, 16)}...`);
        return { signature, isReal: true, signedAt };
      } catch (err: any) {
        if (err.code === 4001 || err.message?.includes('rejected')) {
          walletLogger.warn('TRANSACTION_LIFECYCLE', 'Test signature rejected in wallet.');
          throw new Error('Verification signature rejected in wallet.');
        }
      }
    }

    const simRes = await signMessage(testMessage);
    return { signature: simRes.signature, isReal: false, signedAt: simRes.signedAt };
  };

  const contextValue = useMemo(
    () => ({
      isConnected,
      isConnecting,
      address,
      ensName,
      selectedChain,
      detectedChainId,
      appChainId: selectedChain.id,
      walletChainId: detectedChainId,
      isChainMismatch,
      isChainInSync,
      syncAppWithWalletChain,
      syncWalletWithAppChain,
      ensureWalletOnChain,
      assertChainConsistency,
      walletProvider,
      ethBalance,
      usdcBalance,
      isRealExtensionConnected,
      detectedExtensions,
      tokenBalances,
      chainSummaries,
      totalPortfolioUSD,
      isRefreshingBalances,
      lastBalanceRefresh,
      refreshBalances,
      getTokenBalance,
      getNativeBalanceForChain,
      getPublicClient: getPublicClientInstance,
      connectWallet,
      requestFreshAccountSelection,
      disconnectWallet,
      switchChain,
      fixWalletRpc,
      formatAddress,
      updateBalances,
      signMessage,
      signTypedDataV4,
      sendTransaction,
      testWalletSignature,
      // Custom RPC Provider with Auto-Failover
      rpcProvider: rpcProviderWrapper,
      activeRpcUrl,
      backupRpcUrls,
      rpcPools,
      lastRpcFailover,
      getChainActiveRpcUrl,
      getChainBackupRpcUrls,
      switchChainRpc,
      addCustomRpcUrl,
      executeRpcCall,
      walletLogs,
      clearLogs,
    }),
    [
      isConnected,
      isConnecting,
      address,
      ensName,
      selectedChain,
      detectedChainId,
      isChainMismatch,
      isChainInSync,
      syncAppWithWalletChain,
      syncWalletWithAppChain,
      ensureWalletOnChain,
      assertChainConsistency,
      walletProvider,
      ethBalance,
      usdcBalance,
      isRealExtensionConnected,
      detectedExtensions,
      tokenBalances,
      chainSummaries,
      totalPortfolioUSD,
      isRefreshingBalances,
      lastBalanceRefresh,
      refreshBalances,
      getTokenBalance,
      getNativeBalanceForChain,
      getPublicClientInstance,
      connectWallet,
      requestFreshAccountSelection,
      disconnectWallet,
      switchChain,
      fixWalletRpc,
      activeRpcUrl,
      backupRpcUrls,
      rpcPools,
      lastRpcFailover,
      getChainActiveRpcUrl,
      getChainBackupRpcUrls,
      switchChainRpc,
      addCustomRpcUrl,
      executeRpcCall,
      walletLogs,
      clearLogs,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
