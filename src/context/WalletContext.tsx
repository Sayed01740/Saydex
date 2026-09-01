import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsName,
  useEnsAvatar,
  useBalance,
  useSwitchChain,
  useReadContract,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { mainnet } from '../config/chains';
import { Chain, ChainId, WalletState } from '../types';
import { SUPPORTED_CHAINS } from '../data/mockData';
import { USDC_ADDRESSES, getChainById, getExplorerAddressUrl } from '../config/chains';
import { walletLogger } from '../utils/walletLogger';

// ─────────────────────────────────────────────────────────────────────────────
// Context Interface
// ─────────────────────────────────────────────────────────────────────────────

export type WalletProviderType =
  | 'metamask'
  | 'walletconnect'
  | 'coinbase'
  | 'rabby'
  | 'phantom'
  | 'ledger'
  | 'injected';

interface WalletContextType {
  /** Explicit state machine — never rely on a single boolean */
  walletState: WalletState;

  /** Convenience: true only when walletState === 'CONNECTED' */
  isConnected: boolean;
  /** Convenience: true when walletState === 'CONNECTING' | 'RECONNECTING' */
  isConnecting: boolean;

  /** The actual wallet address (null when disconnected) */
  address: string | null;
  ensName: string | null;
  ensAvatar: string | null;

  /**
   * The chain the WALLET is actually on.
   * This is ground truth — always from the connected provider.
   */
  walletChain: Chain | null;
  walletChainId: number | null;

  /**
   * Currently active chain object (always non-null, defaults to Ethereum mainnet when disconnected).
   * Safe for accessing gasPriceGwei, shortName, blockExplorerUrl, etc.
   */
  selectedChain: Chain;

  /**
   * True when the connected wallet chain ≠ the chain the user has selected in the UI.
   * Block all transactions when this is true — request switch first.
   */
  isWrongChain: boolean;

  /** Which wallet connector is active */
  walletProvider: WalletProviderType | null;

  /**
   * Native balance for the CURRENT WALLET CHAIN.
   * Never the previously selected chain's balance.
   */
  nativeBalance: number;
  nativeSymbol: string;

  /**
   * USDC balance using the chain-specific USDC contract address.
   * Never the Ethereum mainnet USDC on a Base/Arbitrum wallet.
   */
  usdcBalance: number;

  /**
   * @deprecated Use nativeBalance instead.
   * Kept for backward compatibility with existing components.
   */
  ethBalance: number;

  connectWallet: (provider: WalletProviderType) => Promise<void>;
  disconnectWallet: () => void;

  /**
   * Request actual wallet chain switch — not just a UI variable update.
   * Handles: user rejection, chain not in wallet, success confirmation.
   */
  switchChain: (chainId: ChainId) => Promise<void>;

  formatAddress: (addr?: string | null, length?: number) => string;
  getExplorerAddressUrl: (address: string) => string;

  /**
   * @deprecated Balances are now sourced from the chain via useBalance hooks.
   * Manual delta updates are no longer applied. Kept as no-op for compatibility.
   */
  updateBalances: (ethDelta: number, usdcDelta: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider-to-connector ID mapping
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_TO_CONNECTOR_ID: Record<string, string> = {
  metamask: 'metaMask',
  walletconnect: 'walletConnect',
  coinbase: 'coinbaseWallet',
  injected: 'injected',
  // Rabby, Phantom EVM, and other injected wallets announce via EIP-6963
  // The `injected()` connector handles all of them automatically
  rabby: 'injected',
  phantom: 'injected',
  ledger: 'injected',
};

// ─────────────────────────────────────────────────────────────────────────────
// Context + Provider
// ─────────────────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // ── Wagmi hooks ──────────────────────────────────────────────────────────
  const {
    address,
    isConnected,
    isConnecting,
    isReconnecting,
    isDisconnected,
    chain,            // ACTUAL wallet chain from the connected provider
    connector,
    status,
  } = useAccount();

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain: wagmiSwitchChain, isPending: isSwitchPending } = useSwitchChain();

  // ── Wallet State Machine ─────────────────────────────────────────────────
  const walletState: WalletState = (() => {
    if (isDisconnected) return 'DISCONNECTED';
    if (isConnecting)   return 'CONNECTING';
    if (isReconnecting) return 'RECONNECTING';
    if (isSwitchPending) return 'CHAIN_SWITCHING';
    if (isConnected)    return 'CONNECTED';
    return 'DISCONNECTED';
  })();

  // ── ENS (mainnet only — ENS lives on Ethereum) ───────────────────────────
  const { data: ensNameData } = useEnsName({
    address: address ? (address as `0x${string}`) : undefined,
    chainId: mainnet.id,
    query: {
      enabled: !!address,
    },
  });
  const { data: ensAvatarData } = useEnsAvatar({
    name: ensNameData ?? undefined,
    chainId: mainnet.id,
    query: {
      enabled: !!ensNameData,
    },
  });

  // ── Actual wallet chain (RC-3 fix) ───────────────────────────────────────
  // `chain` comes from wagmi's useAccount — it reflects what the wallet reports,
  // not what the UI has "selected". This is ground truth.
  const walletChainId: number | null = chain?.id ?? null;
  const walletChain: Chain | null = chain
    ? SUPPORTED_CHAINS.find((c) => c.id === chain.id) ?? null
    : null;

  // ── Native Balance — bound to actual wallet chain (RC-2 fix) ────────────
  // Passing chainId ensures we read from the chain the wallet is ACTUALLY on.
  // wagmi v3 useBalance returns { value: bigint, decimals: number, symbol: string }
  const { data: nativeBalanceData, refetch: refetchNativeBalance } = useBalance({
    address: address ? (address as `0x${string}`) : undefined,
    chainId: walletChainId ?? undefined,
    query: {
      enabled: !!address && !!walletChainId,
      refetchInterval: 12000, // Poll every 12s
    },
  });

  // ── USDC Balance — chain-specific address via ERC20 balanceOf (RC-2 fix) ─
  // Safe fallback address prevents Viem InvalidAddressError when usdcAddress is undefined
  const usdcAddress = walletChainId ? USDC_ADDRESSES[walletChainId] : undefined;
  const ERC20_BALANCE_OF_ABI = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const;

  const { data: usdcBalanceRaw, refetch: refetchUsdcBalance } = useReadContract({
    address: usdcAddress || '0x0000000000000000000000000000000000000000',
    abi: ERC20_BALANCE_OF_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : ['0x0000000000000000000000000000000000000000'],
    chainId: walletChainId ?? mainnet.id,
    query: {
      enabled: !!address && !!walletChainId && !!usdcAddress,
      refetchInterval: 12000, // Poll every 12s
    },
  });

  // ── Previous address/chain tracking for cache invalidation ───────────────
  const prevAddressRef = useRef<string | null | undefined>(null);
  const prevChainIdRef = useRef<number | null>(null);

  // RC-15 + RC-22: Invalidate ALL account/chain-specific queries when either changes
  useEffect(() => {
    const addressChanged = address !== prevAddressRef.current;
    const chainChanged = walletChainId !== prevChainIdRef.current;

    if (addressChanged || chainChanged) {
      if (prevAddressRef.current !== null) {
        // Not the initial mount — this is a real change
        walletLogger.info(
          'ACCOUNT_SELECTION',
          addressChanged
            ? `Account changed: ${prevAddressRef.current?.slice(0, 8) ?? 'none'} → ${address?.slice(0, 8) ?? 'none'}. Invalidating all queries.`
            : `Chain changed: ${prevChainIdRef.current} → ${walletChainId}. Invalidating balance and allowance queries.`,
          { prevAddress: prevAddressRef.current, newAddress: address, prevChainId: prevChainIdRef.current, newChainId: walletChainId }
        );

        // Invalidate the entire query cache on account change (stale data from old account must never show)
        if (addressChanged) {
          queryClient.invalidateQueries();
        } else {
          // Chain change: invalidate balance/allowance queries specifically
          queryClient.invalidateQueries({ queryKey: ['balance'] });
          queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
          queryClient.invalidateQueries({ queryKey: ['allowance'] });
        }
      }

      prevAddressRef.current = address;
      prevChainIdRef.current = walletChainId;
    }
  }, [address, walletChainId, queryClient]);

  // ── Logging ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isConnected && address && chain) {
      walletLogger.info('PROVIDER_DISCOVERY', `Wallet connected`, {
        address: address.slice(0, 8) + '...',
        chainId: chain.id,
        chainName: chain.name,
        connector: connector?.id,
      });
    }
    if (isDisconnected && prevAddressRef.current) {
      walletLogger.info('PROVIDER_DISCOVERY', 'Wallet disconnected — clearing all session state.');
    }
  }, [isConnected, isDisconnected, address, chain, connector]);

  // ── isWrongChain ─────────────────────────────────────────────────────────
  // We don't maintain a separate "selectedAppChain" UI variable in this context
  // because the correct pattern is: the wallet chain IS the authoritative chain.
  // Components that let users pick a chain must call switchChain() to actually
  // switch the wallet — never just update a local React state.
  // For now, isWrongChain is false when connected (chain is what it is).
  // The swap components use this to show "Switch Network" prompts.
  const isWrongChain = false; // Managed per-component by comparing walletChainId vs desired chain

  // ── Actions ───────────────────────────────────────────────────────────────

  const connectWallet = useCallback(
    async (provider: WalletProviderType) => {
      const connectorId = PROVIDER_TO_CONNECTOR_ID[provider] ?? 'injected';

      walletLogger.info('PROVIDER_SELECTION', `Attempting wallet connect`, {
        requestedProvider: provider,
        targetConnectorId: connectorId,
        availableConnectors: connectors.map((c) => c.id),
      });

      // Try to find the exact connector first, then fall back to any injected
      const target =
        connectors.find((c) => c.id === connectorId) ??
        connectors.find((c) => c.id.toLowerCase().includes(connectorId.toLowerCase())) ??
        connectors.find((c) => c.id === 'injected') ??
        connectors[0];

      if (!target) {
        walletLogger.error('PROVIDER_SELECTION', `No connector found for provider: ${provider}`);
        return;
      }

      walletLogger.info('PROVIDER_SELECTION', `Connecting via connector: ${target.id} (${target.name})`);
      connect({ connector: target });
    },
    [connect, connectors],
  );

  const disconnectWallet = useCallback(() => {
    walletLogger.info('PROVIDER_SELECTION', 'User initiated wallet disconnect.');
    disconnect();
  }, [disconnect]);

  const switchChain = useCallback(
    async (chainId: ChainId) => {
      const targetChain = getChainById(chainId as number);

      walletLogger.info('CHAIN_VALIDATION', `Chain switch requested`, {
        currentChainId: walletChainId,
        targetChainId: chainId,
        targetChainName: targetChain.name,
      });

      if (walletChainId === chainId) {
        walletLogger.info('CHAIN_VALIDATION', `Already on chain ${chainId} — no switch needed.`);
        return;
      }

      try {
        await wagmiSwitchChain({ chainId: chainId as number });

        walletLogger.info('CHAIN_VALIDATION', `Chain switch successful → ${targetChain.name} (${chainId})`);

        // After switch: invalidate balances and quotes for new chain context
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
        queryClient.invalidateQueries({ queryKey: ['allowance'] });
      } catch (err: any) {
        walletLogger.error('CHAIN_VALIDATION', `Chain switch failed`, {
          chainId,
          errorCode: err?.code,
          errorMessage: err?.message,
        });

        // Surface friendly message — the calling component should handle UI
        throw err;
      }
    },
    [wagmiSwitchChain, walletChainId, queryClient],
  );

  const formatAddress = useCallback((addr?: string | null, length = 4): string => {
    if (!addr) return '';
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 2 + length)}...${addr.slice(-length)}`;
  }, []);

  const getExplorerAddrUrl = useCallback(
    (addr: string): string => {
      if (!walletChainId) return `https://etherscan.io/address/${addr}`;
      return getExplorerAddressUrl(walletChainId, addr);
    },
    [walletChainId],
  );

  // RC-11: Documented no-op — kept for backward compatibility.
  // Post-transaction balance refresh is handled via React Query invalidation.
  const updateBalances = useCallback((_ethDelta: number, _usdcDelta: number) => {
    // Balances are managed by wagmi's useBalance hooks + React Query cache.
    // After a confirmed transaction, callers should call queryClient.invalidateQueries()
    // or use the refetch helpers exposed by useBalance directly.
    refetchNativeBalance();
    refetchUsdcBalance();
  }, [refetchNativeBalance, refetchUsdcBalance]);

  // ── Derived values ────────────────────────────────────────────────────────
  // selectedChain is guaranteed non-null — defaults to Ethereum mainnet when wallet is disconnected
  const selectedChain: Chain = walletChain ?? SUPPORTED_CHAINS[0];

  // wagmi v3 useBalance: result is { value: bigint, decimals: number, symbol: string }
  const nativeBalance = nativeBalanceData
    ? Number(nativeBalanceData.value) / Math.pow(10, nativeBalanceData.decimals)
    : 0;
  const nativeSymbol = walletChain?.nativeCurrency.symbol ?? 'ETH';
  // USDC: 6 decimals on all chains
  const usdcBalance = usdcBalanceRaw !== undefined
    ? Number(usdcBalanceRaw) / 1_000_000
    : 0;

  return (
    <WalletContext.Provider
      value={{
        walletState,
        isConnected,
        isConnecting: isConnecting || isReconnecting,
        address: address ?? null,
        ensName: ensNameData ?? null,
        ensAvatar: ensAvatarData ?? null,
        walletChain,
        walletChainId,
        selectedChain,
        isWrongChain,
        walletProvider: connector ? (connector.id as WalletProviderType) : null,
        nativeBalance,
        nativeSymbol,
        usdcBalance,
        ethBalance: nativeBalance, // backward-compat alias
        connectWallet,
        disconnectWallet,
        switchChain,
        formatAddress,
        getExplorerAddressUrl: getExplorerAddrUrl,
        updateBalances,
      }}
    >
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
