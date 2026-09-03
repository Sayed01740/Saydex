import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Token,
  LiquidityPool,
  UserPosition,
  ProtocolTransaction,
  UserSettings,
  LaunchpadProject,
  PriceAlert,
  ActiveTransactionMonitor,
  TransactionLifecycleStage,
} from '../types';
import { TokenJarState, FeeSourceAdapter, FirepitAuction, FeePolicyTier, ProtocolFeeEvent } from '../types/protocolFees';
import {
  Permit2Allowance,
  Permit2EIP712Signature,
  UniversalRouterExecutionResult,
} from '../types/universalRouter';
import { TOKENS, MOCK_POOLS, MOCK_USER_POSITIONS, MOCK_TRANSACTIONS, MOCK_LAUNCHPAD } from '../data/mockData';
import {
  INITIAL_TOKEN_JARS,
  INITIAL_FEE_ADAPTERS,
  INITIAL_FIREPIT_AUCTIONS,
  INITIAL_FEE_POLICY_TIERS,
  INITIAL_PROTOCOL_FEE_EVENTS,
} from '../data/protocolFeesData';
import {
  INITIAL_PERMIT2_ALLOWANCES,
  INITIAL_PERMIT2_SIGNATURES,
  INITIAL_UNIVERSAL_ROUTER_EXECUTIONS,
} from '../data/universalRouterData';
import { generatePermit2EIP712Payload } from '../utils/universalRouterEncoder';
import { walletLogger } from '../utils/walletLogger';
import { useWallet } from './WalletContext';
import { poolService } from '../services/poolService';
import { livePriceService } from '../services/livePriceService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  actionText?: string;
  actionUrl?: string;
}

// Gentle pleasant audio notification for price alerts and confirmations
const playAlertChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.18); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

const INITIAL_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'alert-1',
    tokenInSymbol: 'ETH',
    tokenOutSymbol: 'USDC',
    targetPrice: 3550.00,
    currentPriceAtCreation: 3482.50,
    condition: 'gte',
    status: 'active',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    note: 'Take profit target',
  },
  {
    id: 'alert-2',
    tokenInSymbol: 'ETH',
    tokenOutSymbol: 'USDC',
    targetPrice: 3400.00,
    currentPriceAtCreation: 3482.50,
    condition: 'lte',
    status: 'active',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    note: 'Dip buy alert',
  },
  {
    id: 'alert-3',
    tokenInSymbol: 'SAYDEX',
    tokenOutSymbol: 'ETH',
    targetPrice: 0.0050,
    currentPriceAtCreation: 0.00425,
    condition: 'gte',
    status: 'active',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    note: 'Breakout target',
  },
];

interface ProtocolContextType {
  tokens: Token[];
  pools: LiquidityPool[];
  userPositions: UserPosition[];
  transactions: ProtocolTransaction[];
  activeTransaction: ActiveTransactionMonitor | null;
  launchpadProjects: LaunchpadProject[];
  settings: UserSettings;
  toasts: ToastMessage[];
  priceAlerts: PriceAlert[];
  activeView: 'landing' | 'swap' | 'explore' | 'pools' | 'positions' | 'portfolio' | 'launchpad' | 'analytics' | 'fees' | 'router' | 'design-system';
  setActiveView: (view: 'landing' | 'swap' | 'explore' | 'pools' | 'positions' | 'portfolio' | 'launchpad' | 'analytics' | 'fees' | 'router' | 'design-system') => void;
  tokenJars: Record<number, TokenJarState>;
  feeAdapters: FeeSourceAdapter[];
  firepitAuctions: Record<number, FirepitAuction>;
  feePolicyTiers: FeePolicyTier[];
  feeEvents: ProtocolFeeEvent[];
  permit2Allowances: Permit2Allowance[];
  permit2Signatures: Permit2EIP712Signature[];
  universalRouterExecutions: UniversalRouterExecutionResult[];

  // Granular Transaction Lifecycle Monitor
  startTransactionLifecycle: (init: {
    type: ProtocolTransaction['type'] | 'universal_router' | 'permit2';
    title: string;
    description: string;
    explorerUrl?: string;
    isRealWallet?: boolean;
    tokenIn?: { symbol: string; amount: string; icon: string };
    tokenOut?: { symbol: string; amount: string; icon: string };
    chainId?: number;
    userAddress?: string;
  }) => string;
  markTransactionSigning: (txId: string) => void;
  markTransactionSigned: (txId: string, hash: string, signerAddress?: string) => void;
  markTransactionPending: (txId: string) => void;
  markTransactionConfirmed: (txId: string, details?: { blockNumber?: number; gasCostUSD?: number }) => void;
  markTransactionFailed: (txId: string, errorMessage: string) => void;
  clearActiveTransaction: () => void;

  signPermit2Approval: (tokenSymbol: string, amount?: string) => void;
  revokePermit2Approval: (tokenSymbol: string) => void;
  executeUniversalRouterCalldata: (commandsHex: string, inputsCount: number, summary: string) => void;
  sweepFeesToJar: (adapterId: string, chainId: number) => void;
  burnUniInFirepit: (chainId: number, uniAmount: number) => void;
  updateFeePolicyFraction: (feeTier: number, fraction: number) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  addTransaction: (tx: Omit<ProtocolTransaction, 'id' | 'timestamp'>) => void;
  clearTransactions: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  addPosition: (pos: Omit<UserPosition, 'id' | 'createdAt'>) => void;
  removePosition: (positionId: string) => void;
  claimPositionFees: (positionId: string) => void;
  participateInLaunchpad: (projectId: string, amountUSD: number) => void;
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => void;
  removePriceAlert: (id: string) => void;
  targetTradeToken: Token | null;
  tradeToken: (token: Token) => void;
  addToken: (token: Token) => void;
  isLoadingPools: boolean;
  refreshPools: () => Promise<void>;
  saveCustomPool: (pool: LiquidityPool) => void;
}

const ProtocolContext = createContext<ProtocolContextType | undefined>(undefined);

export function ProtocolProvider({ children }: { children: React.ReactNode }) {
  const { selectedChain } = useWallet();
  const [tokens, setTokens] = useState<Token[]>(() => livePriceService.enrichTokensWithLivePrices(TOKENS));
  const [pools, setPools] = useState<LiquidityPool[]>(MOCK_POOLS);
  const [isLoadingPools, setIsLoadingPools] = useState(false);

  // Real-time live token price synchronization across all chains
  useEffect(() => {
    let mounted = true;

    const syncLivePrices = async () => {
      try {
        await livePriceService.fetchPrices(TOKENS);
        if (mounted) {
          setTokens((prev) => livePriceService.enrichTokensWithLivePrices(prev));
        }
      } catch (err) {
        console.warn('[ProtocolContext] Failed to sync live prices:', err);
      }
    };

    // Initial immediate fetch
    syncLivePrices();

    // 25-second background real-time polling (balanced performance & low CPU/battery consumption)
    const priceInterval = setInterval(syncLivePrices, 25000);

    return () => {
      mounted = false;
      clearInterval(priceInterval);
    };
  }, []);

  // Dynamically load real pools when active chain changes
  useEffect(() => {
    let active = true;
    const loadChainPools = async () => {
      setIsLoadingPools(true);
      try {
        const live = await poolService.getPoolsForChain(selectedChain.id, false);
        if (active && live && live.length > 0) {
          setPools(live);
        }
      } catch (e) {
        console.warn('Failed to load chain pools:', e);
      } finally {
        if (active) setIsLoadingPools(false);
      }
    };
    loadChainPools();
    return () => {
      active = false;
    };
  }, [selectedChain.id]);

  const refreshPools = async () => {
    setIsLoadingPools(true);
    try {
      const live = await poolService.getPoolsForChain(selectedChain.id, true);
      if (live && live.length > 0) {
        setPools(live);
      }
    } catch (e) {
      console.warn('Failed to refresh pools:', e);
    } finally {
      setIsLoadingPools(false);
    }
  };

  const saveCustomPool = (pool: LiquidityPool) => {
    poolService.saveCustomPool(pool);
    setPools((prev) => {
      const key = `${pool.chainId}_${pool.token0.symbol}_${pool.token1.symbol}_${pool.feeTier}`.toLowerCase();
      const filtered = prev.filter(
        (p) => `${p.chainId}_${p.token0.symbol}_${p.token1.symbol}_${p.feeTier}`.toLowerCase() !== key
      );
      return [pool, ...filtered];
    });
  };
  const [userPositions, setUserPositions] = useState<UserPosition[]>(() => {
    try {
      const saved = localStorage.getItem('unx_user_positions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [targetTradeToken, setTargetTradeToken] = useState<Token | null>(null);
  const [transactions, setTransactions] = useState<ProtocolTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('unx_protocol_transactions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [activeTransaction, setActiveTransaction] = useState<ActiveTransactionMonitor | null>(null);
  const activeMonitorRef = useRef<ActiveTransactionMonitor | null>(null);
  const [launchpadProjects, setLaunchpadProjects] = useState<LaunchpadProject[]>(MOCK_LAUNCHPAD);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('saydex_price_alerts_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRICE_ALERTS;
  });
  const [tokenJars, setTokenJars] = useState<Record<number, TokenJarState>>(INITIAL_TOKEN_JARS);
  const [feeAdapters, setFeeAdapters] = useState<FeeSourceAdapter[]>(INITIAL_FEE_ADAPTERS);
  const [firepitAuctions, setFirepitAuctions] = useState<Record<number, FirepitAuction>>(INITIAL_FIREPIT_AUCTIONS);
  const [feePolicyTiers, setFeePolicyTiers] = useState<FeePolicyTier[]>(INITIAL_FEE_POLICY_TIERS);
  const [feeEvents, setFeeEvents] = useState<ProtocolFeeEvent[]>(INITIAL_PROTOCOL_FEE_EVENTS);
  const [permit2Allowances, setPermit2Allowances] = useState<Permit2Allowance[]>(INITIAL_PERMIT2_ALLOWANCES);
  const [permit2Signatures, setPermit2Signatures] = useState<Permit2EIP712Signature[]>(INITIAL_PERMIT2_SIGNATURES);
  const [universalRouterExecutions, setUniversalRouterExecutions] = useState<UniversalRouterExecutionResult[]>(INITIAL_UNIVERSAL_ROUTER_EXECUTIONS);
  const [activeView, setActiveView] = useState<'landing' | 'swap' | 'explore' | 'pools' | 'positions' | 'portfolio' | 'launchpad' | 'analytics' | 'fees' | 'router' | 'design-system'>('swap');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const alertsRef = useRef<PriceAlert[]>(priceAlerts);
  alertsRef.current = priceAlerts;

  // Persist price alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('saydex_price_alerts_v1', JSON.stringify(priceAlerts));
    } catch {}
  }, [priceAlerts]);

  const [settings, setSettings] = useState<UserSettings>({
    slippageTolerance: 0.5,
    customSlippage: '',
    deadlineMinutes: 20,
    mevProtection: true,
    advancedMode: false,
    autoRouter: true,
    highGasAlert: false,
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * Transaction Lifecycle Monitor & Granular State Manager:
   * Tracks 'preparing' -> 'signing' -> 'signed' -> 'pending' -> 'confirmed' (or 'failed' / 'rejected')
   */
  const startTransactionLifecycle = (init: {
    type: ProtocolTransaction['type'] | 'universal_router' | 'permit2';
    title: string;
    description: string;
    explorerUrl?: string;
    isRealWallet?: boolean;
    tokenIn?: { symbol: string; amount: string; icon: string };
    tokenOut?: { symbol: string; amount: string; icon: string };
    chainId?: number;
    userAddress?: string;
  }): string => {
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const monitor: ActiveTransactionMonitor = {
      id: txId,
      hash: '',
      type: init.type,
      title: init.title,
      description: init.description,
      status: 'preparing',
      startedAt: Date.now(),
      confirmations: 0,
      explorerUrl: init.explorerUrl,
      isRealWallet: init.isRealWallet,
      tokenIn: init.tokenIn,
      tokenOut: init.tokenOut,
      chainId: init.chainId,
      userAddress: init.userAddress,
    };

    activeMonitorRef.current = monitor;
    setActiveTransaction(monitor);
    walletLogger.info('TRANSACTION_LIFECYCLE', `Started transaction lifecycle [${txId}]: ${init.title} (Status: PREPARING)`);
    return txId;
  };

  const markTransactionSigning = (txId: string) => {
    setActiveTransaction((prev) => {
      if (!prev || prev.id !== txId) return prev;
      return { ...prev, status: 'signing' };
    });
    walletLogger.info('TRANSACTION_LIFECYCLE', `Transaction [${txId}] transitioned to SIGNING (Awaiting user signature in wallet provider)`);
  };

  const markTransactionSigned = (txId: string, hash: string, signerAddress?: string) => {
    const signedAt = Date.now();
    const monitor = activeMonitorRef.current;
    const fullExplorerUrl = monitor?.explorerUrl
      ? (monitor.explorerUrl.endsWith('/') ? `${monitor.explorerUrl}${hash}` : `${monitor.explorerUrl}/${hash}`)
      : `https://etherscan.io/tx/${hash}`;

    setActiveTransaction((prev) => {
      if (!prev || prev.id !== txId) return prev;
      return {
        ...prev,
        status: 'signed',
        hash,
        signedAt,
        signerAddress: signerAddress || monitor?.userAddress,
        explorerUrl: fullExplorerUrl,
      };
    });

    // Record in protocol transactions state with exact tokens & chainId
    setTransactions((prev) => {
      const existingIdx = prev.findIndex((t) => t.id === txId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          hash,
          status: 'signed',
          signedAt,
          explorerUrl: fullExplorerUrl,
          userAddress: signerAddress || updated[existingIdx].userAddress || monitor?.userAddress,
        };
        try {
          localStorage.setItem('unx_protocol_transactions_v2', JSON.stringify(updated.slice(0, 50)));
        } catch {}
        return updated;
      }
      const updated = [
        {
          id: txId,
          hash,
          type: (monitor?.type as any) || 'swap',
          title: monitor?.title || 'Token Swap',
          description: monitor?.description || 'Executed via Uniswap V3',
          timestamp: signedAt,
          signedAt,
          status: 'signed' as const,
          tokenIn: monitor?.tokenIn,
          tokenOut: monitor?.tokenOut,
          chainId: monitor?.chainId,
          userAddress: signerAddress || monitor?.userAddress,
          explorerUrl: fullExplorerUrl,
          gasCostUSD: 0,
        },
        ...prev,
      ];
      try {
        localStorage.setItem('unx_protocol_transactions_v2', JSON.stringify(updated.slice(0, 50)));
      } catch {}
      return updated;
    });

    walletLogger.info('TRANSACTION_LIFECYCLE', `Transaction [${txId}] SIGNED! Hash: ${hash}. Signer: ${signerAddress || 'Wallet'}`);

    addToast({
      type: 'info',
      title: 'Transaction Signed',
      description: `Signature captured from wallet provider. Tx Hash: ${hash.slice(0, 10)}...`,
    });
  };

  const markTransactionPending = (txId: string) => {
    setActiveTransaction((prev) => {
      if (!prev || prev.id !== txId) return prev;
      return { ...prev, status: 'pending' };
    });

    setTransactions((prev) => {
      const updated = prev.map((t) => (t.id === txId ? { ...t, status: 'pending' as const } : t));
      try {
        localStorage.setItem('unx_protocol_transactions_v2', JSON.stringify(updated.slice(0, 50)));
      } catch {}
      return updated;
    });

    walletLogger.info('TRANSACTION_LIFECYCLE', `Transaction [${txId}] transitioned to PENDING (In mempool awaiting block inclusion)`);

    addToast({
      type: 'info',
      title: 'Transaction Pending',
      description: 'Submitted to network mempool. Awaiting on-chain confirmation...',
    });
  };

  const markTransactionConfirmed = (
    txId: string,
    details?: { blockNumber?: number; gasCostUSD?: number }
  ) => {
    const confirmedAt = Date.now();
    const blockNum = details?.blockNumber || 19854210 + Math.floor(Math.random() * 50);

    setActiveTransaction((prev) => {
      if (!prev || prev.id !== txId) return prev;
      return {
        ...prev,
        status: 'confirmed',
        confirmedAt,
        confirmations: 1,
        blockNumber: blockNum,
      };
    });

    setTransactions((prev) => {
      const updated = prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              status: 'confirmed' as const,
              confirmedAt,
              blockNumber: blockNum,
              gasCostUSD: details?.gasCostUSD ?? t.gasCostUSD,
            }
          : t
      );
      try {
        localStorage.setItem('unx_protocol_transactions_v2', JSON.stringify(updated.slice(0, 50)));
      } catch {}
      return updated;
    });

    playAlertChime();
    walletLogger.info('TRANSACTION_LIFECYCLE', `Transaction [${txId}] CONFIRMED on Block #${blockNum}!`);

    addToast({
      type: 'success',
      title: 'Transaction Confirmed',
      description: `Mined in Block #${blockNum.toLocaleString()}. State updated.`,
    });
  };

  const markTransactionFailed = (txId: string, errorMessage: string) => {
    const isRejection = errorMessage.toLowerCase().includes('reject') || errorMessage.toLowerCase().includes('cancel');
    const finalStatus: TransactionLifecycleStage = isRejection ? 'rejected' : 'failed';

    setActiveTransaction((prev) => {
      if (!prev || prev.id !== txId) return prev;
      return {
        ...prev,
        status: finalStatus,
        error: errorMessage,
      };
    });

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              status: isRejection ? 'rejected' : 'failed',
            }
          : t
      )
    );

    walletLogger.warn('TRANSACTION_LIFECYCLE', `Transaction [${txId}] ${finalStatus.toUpperCase()}: ${errorMessage}`);

    addToast({
      type: 'error',
      title: isRejection ? 'Transaction Rejected' : 'Transaction Failed',
      description: errorMessage || 'Operation could not be completed.',
    });
  };

  const clearActiveTransaction = () => {
    setActiveTransaction(null);
  };

  // Check price alerts whenever prices tick (gentle 25s cadence, paused when backgrounded)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      
      const triggeredAlerts: { alert: PriceAlert; currentRate: number }[] = [];

      setTokens((prev) => {
        const nextTokens = prev.map((tok) => {
          if (tok.symbol === 'USDC' || tok.symbol === 'USDT' || tok.symbol === 'DAI') return tok;
          const deltaPercent = (Math.random() - 0.495) * 0.15;
          const newPrice = parseFloat((tok.priceUSD * (1 + deltaPercent / 100)).toFixed(tok.priceUSD > 10 ? 2 : 4));
          return {
            ...tok,
            priceUSD: newPrice,
            change24h: parseFloat((tok.change24h + deltaPercent * 0.2).toFixed(2)),
          };
        });

        // Evaluate active price alerts
        const currentAlerts = alertsRef.current;
        currentAlerts.forEach((alert) => {
          if (alert.status !== 'active') return;
          const inToken = nextTokens.find((t) => t.symbol.toUpperCase() === alert.tokenInSymbol.toUpperCase());
          const outToken = nextTokens.find((t) => t.symbol.toUpperCase() === alert.tokenOutSymbol.toUpperCase());
          if (!inToken || !outToken) return;

          const currentRate = (inToken.priceUSD || 1) / Math.max(0.000001, outToken.priceUSD || 1);
          const isTriggered =
            (alert.condition === 'gte' && currentRate >= alert.targetPrice) ||
            (alert.condition === 'lte' && currentRate <= alert.targetPrice);

          if (isTriggered) {
            triggeredAlerts.push({ alert, currentRate });
          }
        });

        return nextTokens;
      });

      // Execute alert side-effects safely outside the state reducer
      if (triggeredAlerts.length > 0) {
        triggeredAlerts.forEach(({ alert, currentRate }) => {
          setPriceAlerts((prevAlerts) =>
            prevAlerts.map((a) =>
              a.id === alert.id ? { ...a, status: 'triggered', triggeredAt: Date.now() } : a
            )
          );
          playAlertChime();
          addToast({
            type: 'success',
            title: `🎯 Target Price Hit: ${alert.tokenInSymbol}/${alert.tokenOutSymbol}`,
            description: `Target rate reached: 1 ${alert.tokenInSymbol} = ${currentRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${alert.tokenOutSymbol} (Condition: ${alert.condition === 'gte' ? '≥' : '≤'} ${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })})`,
            actionText: 'Swap Now',
          });
        });
      }
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  const addPriceAlert = (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
      status: 'active',
    };
    setPriceAlerts((prev) => [newAlert, ...prev]);
    addToast({
      type: 'info',
      title: 'Target Price Alert Set',
      description: `We will notify you when ${alert.tokenInSymbol}/${alert.tokenOutSymbol} ${
        alert.condition === 'gte' ? 'reaches or rises above' : 'reaches or drops below'
      } ${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${alert.tokenOutSymbol}`,
    });
  };

  const removePriceAlert = (id: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
    addToast({
      type: 'info',
      title: 'Alert Removed',
      description: 'The price target alert has been deleted.',
    });
  };

  const simulatePriceAlertTrigger = (id: string) => {
    const alert = priceAlerts.find((a) => a.id === id);
    if (!alert) return;

    setPriceAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'triggered', triggeredAt: Date.now() } : a))
    );
    playAlertChime();
    addToast({
      type: 'success',
      title: `🎯 Target Price Hit: ${alert.tokenInSymbol}/${alert.tokenOutSymbol}`,
      description: `Target rate reached: 1 ${alert.tokenInSymbol} = ${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${alert.tokenOutSymbol}!`,
      actionText: 'Execute Swap',
    });
  };

  const addTransaction = (tx: Omit<ProtocolTransaction, 'id' | 'timestamp'>) => {
    const newTx: ProtocolTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
    };
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      try {
        localStorage.setItem('unx_protocol_transactions_v2', JSON.stringify(updated.slice(0, 50)));
      } catch {}
      return updated;
    });

    addToast({
      type: tx.status === 'confirmed' ? 'success' : tx.status === 'failed' || tx.status === 'rejected' ? 'error' : 'info',
      title: tx.title,
      description: tx.description,
      actionText: 'View on Explorer',
      actionUrl: tx.explorerUrl,
    });
  };

  const clearTransactions = () => {
    setTransactions([]);
    try {
      localStorage.removeItem('unx_protocol_transactions_v2');
    } catch {}
    addToast({
      type: 'info',
      title: 'Trade History Cleared',
      description: 'Your local transaction records have been reset.',
    });
  };

  const tradeToken = (token: Token) => {
    setTargetTradeToken(token);
    setActiveView('swap');
  };

  const addPosition = (pos: Omit<UserPosition, 'id' | 'createdAt'>) => {
    const newPos: UserPosition = {
      ...pos,
      id: `pos-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUserPositions((prev) => {
      const updated = [newPos, ...prev];
      try {
        localStorage.setItem('unx_user_positions_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast({
      type: 'success',
      title: 'Liquidity Position Minted',
      description: `Concentrated range position created for ${pos.token0.symbol}/${pos.token1.symbol}`,
    });
  };

  const removePosition = (positionId: string) => {
    setUserPositions((prev) => {
      const updated = prev.filter((p) => p.id !== positionId);
      try {
        localStorage.setItem('unx_user_positions_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast({
      type: 'info',
      title: 'Liquidity Withdrawn',
      description: 'Principal tokens and accrued fees returned to wallet.',
    });
  };

  const claimPositionFees = (positionId: string) => {
    setUserPositions((prev) => {
      const updated = prev.map((p) => {
        if (p.id === positionId) {
          return { ...p, unclaimedFeesUSD: 0 };
        }
        return p;
      });
      try {
        localStorage.setItem('unx_user_positions_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast({
      type: 'success',
      title: 'Fees Harvested',
      description: 'Unclaimed swap fee earnings collected to your wallet balance.',
    });
  };

  const participateInLaunchpad = (projectId: string, amountUSD: number) => {
    setLaunchpadProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            raisedUSD: Math.min(p.hardCapUSD, p.raisedUSD + amountUSD),
            participantsCount: p.participantsCount + 1,
          };
        }
        return p;
      })
    );
    addToast({
      type: 'success',
      title: 'Launchpad Allocation Confirmed',
      description: `Successfully allocated $${amountUSD.toLocaleString()} USD in IDO round.`,
    });
  };

  const addToken = (newToken: Token) => {
    setTokens((prev) => {
      const exists = prev.some(
        (t) => t.address.toLowerCase() === newToken.address.toLowerCase() && t.chainId === newToken.chainId
      );
      if (exists) return prev;
      return [newToken, ...prev];
    });
    addToast({
      type: 'success',
      title: 'Token Imported',
      description: `${newToken.symbol} (${newToken.name}) added to your active token list.`,
    });
  };

  const sweepFeesToJar = (adapterId: string, chainId: number) => {
    const adapter = feeAdapters.find((a) => a.id === adapterId);
    if (!adapter) return;

    const sweptAmountUSD = adapter.pendingUncollectedUSD;
    if (sweptAmountUSD <= 0) {
      addToast({
        type: 'info',
        title: 'TokenJar Up to Date',
        description: `No pending uncollected protocol fees in ${adapter.name}.`,
      });
      return;
    }

    // Update adapter
    setFeeAdapters((prev) =>
      prev.map((a) =>
        a.id === adapterId
          ? {
              ...a,
              totalSweptUSD: a.totalSweptUSD + sweptAmountUSD,
              pendingUncollectedUSD: 0,
            }
          : a
      )
    );

    // Update TokenJar
    setTokenJars((prev) => {
      const currentJar = prev[chainId] || prev[1];
      if (!currentJar) return prev;
      return {
        ...prev,
        [chainId]: {
          ...currentJar,
          totalValueUSD: currentJar.totalValueUSD + sweptAmountUSD,
          lastSweptTimestamp: Date.now(),
        },
      };
    });

    // Add protocol fee event
    const newEvent: ProtocolFeeEvent = {
      id: `sweep-${Date.now()}`,
      type: 'sweep',
      chainId,
      title: `${adapter.name} Sweep Executed`,
      description: `Transferred $${sweptAmountUSD.toLocaleString()} of pending protocol fees into local TokenJar.`,
      amountUSD: sweptAmountUSD,
      hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    setFeeEvents((prev) => [newEvent, ...prev]);

    addToast({
      type: 'success',
      title: 'Protocol Fee Sweep Successful',
      description: `Collected $${sweptAmountUSD.toLocaleString()} USD into TokenJar (${currentJarContract(chainId)}).`,
    });
  };

  const currentJarContract = (chainId: number) => {
    return (tokenJars[chainId]?.contractAddress || '0x1F98...F984').slice(0, 8) + '...';
  };

  const burnUniInFirepit = (chainId: number, uniAmount: number) => {
    const currentJar = tokenJars[chainId] || tokenJars[1];
    const uniToken = tokens.find((t) => t.symbol === 'UNI') || { priceUSD: 8.37 };
    const burnedUsd = uniAmount * uniToken.priceUSD;

    // Deduct / release some jar inventory
    setTokenJars((prev) => {
      const jar = prev[chainId] || prev[1];
      if (!jar) return prev;
      const releaseRatio = Math.min(1, burnedUsd / Math.max(1, jar.totalValueUSD));
      const remainingValue = Math.max(0, jar.totalValueUSD - burnedUsd * 1.05); // slight discount for searcher
      return {
        ...prev,
        [chainId]: {
          ...jar,
          totalValueUSD: remainingValue,
          totalProcessedUSD: jar.totalProcessedUSD + burnedUsd,
          lastSweptTimestamp: Date.now(),
        },
      };
    });

    // Update Firepit Auction Lifetime Stats
    setFirepitAuctions((prev) => {
      const current = prev[chainId] || prev[1];
      if (!current) return prev;
      return {
        ...prev,
        [chainId]: {
          ...current,
          lotNumber: current.lotNumber + 1,
          totalUniBurnedLifetime: current.totalUniBurnedLifetime + uniAmount,
          totalUsdBurnedLifetime: current.totalUsdBurnedLifetime + burnedUsd,
          basketValueUSD: Math.max(50000, current.basketValueUSD - burnedUsd),
        },
      };
    });

    // Add burn event
    const newEvent: ProtocolFeeEvent = {
      id: `burn-${Date.now()}`,
      type: 'burn',
      chainId,
      title: `Firepit UNI Burn Confirmed`,
      description: `Burned ${uniAmount.toLocaleString()} UNI ($${burnedUsd.toLocaleString()} USD) on ${currentJar.chainName}.`,
      amountUSD: burnedUsd,
      uniAmount,
      hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    setFeeEvents((prev) => [newEvent, ...prev]);

    addToast({
      type: 'success',
      title: 'UNI Burn & Release Settled',
      description: `Sent ${uniAmount.toLocaleString()} UNI to 0x...dEaD burn address. Jar basket unlocked.`,
    });
  };

  const updateFeePolicyFraction = (feeTier: number, fraction: number) => {
    setFeePolicyTiers((prev) =>
      prev.map((tier) => {
        if (tier.feeTier === feeTier) {
          const eff = fraction > 0 ? tier.poolSwapFeePercent / fraction : 0;
          return {
            ...tier,
            protocolFeeFraction: fraction,
            effectiveProtocolFeePercent: eff,
            status: fraction > 0 ? 'active' : 'disabled',
          };
        }
        return tier;
      })
    );

    const event: ProtocolFeeEvent = {
      id: `policy-${Date.now()}`,
      type: 'policy_update',
      chainId: 1,
      title: `Fee Policy Tier Updated`,
      description: `Set ${(feeTier / 10000).toFixed(2)}% fee tier protocol fraction to ${
        fraction === 0 ? 'Disabled (0%)' : `1/${fraction}th (${((1 / fraction) * 100).toFixed(1)}%)`
      }.`,
      amountUSD: 0,
      hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    setFeeEvents((prev) => [event, ...prev]);

    addToast({
      type: 'info',
      title: 'Fee Policy Updated',
      description: `V4FeePolicy fraction updated for ${(feeTier / 10000).toFixed(2)}% pool tier.`,
    });
  };

  const signPermit2Approval = (tokenSymbol: string, amount: string = '115792089237316195423570985008687907853269984665640564039457584007913129639935') => {
    const targetToken = tokens.find((t) => t.symbol === tokenSymbol) || {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      symbol: tokenSymbol,
    } as Token;

    const signature = generatePermit2EIP712Payload(targetToken, '0x66a9893cC07D91D95644AEDD05d03f95e1dBA8Af', amount);

    setPermit2Signatures((prev) => [signature, ...prev]);
    setPermit2Allowances((prev) =>
      prev.map((item) =>
        item.tokenSymbol === tokenSymbol
          ? {
              ...item,
              isPermit2Approved: true,
              allowanceAmount: amount,
              isUnlimited: amount.length > 30,
              expirationTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 30,
              nonce: item.nonce + 1,
            }
          : item
      )
    );

    addToast({
      type: 'success',
      title: 'Permit2 Signature Generated (Gasless)',
      description: `EIP-712 Permit2 authorization signed for ${tokenSymbol}. Zero gas spent.`,
    });
  };

  const revokePermit2Approval = (tokenSymbol: string) => {
    setPermit2Allowances((prev) =>
      prev.map((item) =>
        item.tokenSymbol === tokenSymbol
          ? {
              ...item,
              isPermit2Approved: false,
              allowanceAmount: '0',
              isUnlimited: false,
              expirationTimestamp: 0,
            }
          : item
      )
    );

    addToast({
      type: 'info',
      title: 'Permit2 Allowance Revoked',
      description: `Permit2 transfer rights for ${tokenSymbol} set to 0.`,
    });
  };

  const executeUniversalRouterCalldata = (
    commandsHex: string,
    inputsCount: number,
    summary: string
  ) => {
    const randomHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const cleanHex = commandsHex.startsWith('0x') ? commandsHex.slice(2) : commandsHex;
    const commandCount = Math.floor(cleanHex.length / 2);
    const gasUsed = 21000 + commandCount * 32000;
    const gasSavingsUSD = Number((commandCount * 3.45).toFixed(2));

    const result: UniversalRouterExecutionResult = {
      id: `exec-${Date.now()}`,
      hash: `${randomHash.slice(0, 6)}...${randomHash.slice(-4)}`,
      commandsHex,
      commandCount,
      inputsCount,
      gasUsed,
      gasSavingsUSD,
      timestamp: Date.now(),
      status: 'confirmed',
      summary,
    };

    setUniversalRouterExecutions((prev) => [result, ...prev]);

    addToast({
      type: 'success',
      title: 'Universal Router Executed',
      description: `Executed ${commandCount} atomic commands via execute(). Saved ~$${gasSavingsUSD} in gas!`,
    });
  };

  const contextValue = useMemo(
    () => ({
      tokens,
      pools,
      userPositions,
      transactions,
      activeTransaction,
      launchpadProjects,
      settings,
      toasts,
      priceAlerts,
      activeView,
      setActiveView,
      tokenJars,
      feeAdapters,
      firepitAuctions,
      feePolicyTiers,
      feeEvents,
      permit2Allowances,
      permit2Signatures,
      universalRouterExecutions,
      startTransactionLifecycle,
      markTransactionSigning,
      markTransactionSigned,
      markTransactionPending,
      markTransactionConfirmed,
      markTransactionFailed,
      clearActiveTransaction,
      signPermit2Approval,
      revokePermit2Approval,
      executeUniversalRouterCalldata,
      sweepFeesToJar,
      burnUniInFirepit,
      updateFeePolicyFraction,
      updateSettings,
      addTransaction,
      clearTransactions,
      addToast,
      removeToast,
      addPosition,
      removePosition,
      claimPositionFees,
      participateInLaunchpad,
      addPriceAlert,
      removePriceAlert,
      simulatePriceAlertTrigger,
      targetTradeToken,
      tradeToken,
      addToken,
      isLoadingPools,
      refreshPools,
      saveCustomPool,
    }),
    [
      tokens,
      pools,
      isLoadingPools,
      userPositions,
      transactions,
      activeTransaction,
      launchpadProjects,
      settings,
      toasts,
      priceAlerts,
      targetTradeToken,
      activeView,
      tokenJars,
      feeAdapters,
      firepitAuctions,
      feePolicyTiers,
      feeEvents,
      permit2Allowances,
      permit2Signatures,
      universalRouterExecutions,
    ]
  );

  return (
    <ProtocolContext.Provider value={contextValue}>
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (!context) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}
