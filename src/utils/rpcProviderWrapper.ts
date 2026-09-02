import { walletLogger } from './walletLogger';
import { ALL_CHAINS, getAlchemyRpc } from '../config/chains';
import { PublicClient } from '../types';

export interface RpcEndpointState {
  url: string;
  status: 'active' | 'healthy' | 'degraded' | 'rate-limited' | 'error' | 'forbidden' | 'untested';
  lastTested?: number;
  errorCount: number;
  lastError?: string;
  lastStatusCode?: number;
  latencyMs?: number;
}

export interface NetworkRpcPool {
  chainId: number;
  chainName: string;
  activeUrl: string;
  endpoints: string[];
  backupUrls: string[];
  endpointStates: Record<string, RpcEndpointState>;
  failoverCount: number;
  lastFailoverAt?: number;
}

export interface RpcFailoverEvent {
  chainId: number;
  chainName: string;
  previousUrl: string;
  newActiveUrl: string;
  statusCode?: number;
  reason: string;
  timestamp: number;
}

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string;
  method: string;
  params?: any[];
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: string;
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Known restricted/paid domains to exclude by default
const BLOCKED_RPC_PATTERNS = ['drpc.org', 'drpc.io', 'infura.io/v3/YOUR', 'alchemy.com/v2/YOUR'];

// Comprehensive fallback RPC endpoints for supported EVM networks
export const DEFAULT_NETWORK_RPCS: Record<number, string[]> = {
  // Ethereum Mainnet (1)
  1: [
    'https://cloudflare-eth.com',
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://1rpc.io/eth',
  ],
  // Arbitrum One (42161)
  42161: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arbitrum.llamarpc.com',
    'https://rpc.ankr.com/arbitrum',
    'https://1rpc.io/arb',
  ],
  // Base (8453)
  8453: [
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
    'https://base.llamarpc.com',
    'https://1rpc.io/base',
  ],
  // OP Mainnet (10)
  10: [
    'https://mainnet.optimism.io',
    'https://optimism-rpc.publicnode.com',
    'https://optimism.llamarpc.com',
    'https://rpc.ankr.com/optimism',
    'https://1rpc.io/op',
  ],
  // Polygon PoS (137)
  137: [
    'https://polygon-rpc.com',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.llamarpc.com',
    'https://rpc.ankr.com/polygon',
    'https://1rpc.io/matic',
  ],
  // BNB Smart Chain (56)
  56: [
    'https://binance.llamarpc.com',
    'https://bsc-rpc.publicnode.com',
    'https://bsc-dataseed.binance.org',
    'https://rpc.ankr.com/bsc',
    'https://1rpc.io/bnb',
  ],
  // Avalanche C-Chain (43114)
  43114: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://rpc.ankr.com/avalanche',
    'https://1rpc.io/avax/c',
  ],
  // Sepolia Testnet (11155111)
  11155111: [
    ...(getAlchemyRpc('eth-sepolia') ? [getAlchemyRpc('eth-sepolia')!] : []),
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://rpc.sepolia.org',
    'https://rpc2.sepolia.org',
    'https://1rpc.io/sepolia',
  ],
  // Base Sepolia Testnet (84532)
  84532: [
    ...(getAlchemyRpc('base-sepolia') ? [getAlchemyRpc('base-sepolia')!] : []),
    'https://sepolia.base.org',
    'https://base-sepolia-rpc.publicnode.com',
    'https://1rpc.io/base-sepolia',
  ],
  // Arbitrum Sepolia Testnet (421614)
  421614: [
    ...(getAlchemyRpc('arb-sepolia') ? [getAlchemyRpc('arb-sepolia')!] : []),
    'https://sepolia-rollup.arbitrum.io/rpc',
    'https://arbitrum-sepolia-rpc.publicnode.com',
    'https://1rpc.io/arb-sepolia',
  ],
  // Optimism Sepolia Testnet (11155420)
  11155420: [
    ...(getAlchemyRpc('opt-sepolia') ? [getAlchemyRpc('opt-sepolia')!] : []),
    'https://sepolia.optimism.io',
    'https://optimism-sepolia-rpc.publicnode.com',
  ],
  // Unichain Mainnet (130)
  130: [
    'https://mainnet.unichain.org',
    'https://unichain-rpc.publicnode.com',
  ],
  // Unichain Sepolia Testnet (1301)
  1301: [
    'https://sepolia.unichain.org',
    'https://unichain-sepolia.blockpi.network/v1/rpc/public',
  ],
};

type FailoverListener = (event: RpcFailoverEvent) => void;

/**
 * CustomRpcProviderWrapper
 *
 * Maintains prioritized pools of primary and backup RPC endpoints for every network.
 * Automatically detects HTTP 402 (Payment Required) or 403 (Forbidden) responses,
 * rate limits, or JSON-RPC tier quota errors, and switches dynamically to secondary backup RPC endpoints.
 */
export class CustomRpcProviderWrapper {
  private pools: Map<number, NetworkRpcPool> = new Map();
  private failoverListeners: Set<FailoverListener> = new Set();
  private readonly defaultTimeoutMs: number = 6000;

  constructor() {
    this.initializeDefaultPools();
  }

  /**
   * Populate pools using configured chains and hardcoded resilient fallbacks
   */
  private initializeDefaultPools() {
    // Seed from ALL_CHAINS
    ALL_CHAINS.forEach((chain) => {
      const configuredEndpoints: string[] = [
        chain.rpcUrl,
        ...(chain.rpcUrls?.default?.http || []),
        ...(chain.rpcUrls?.public?.http || []),
        ...(DEFAULT_NETWORK_RPCS[chain.id] || []),
      ];

      this.registerChain(chain.id, chain.name, configuredEndpoints);
    });

    // Also register any remaining standard chains
    Object.entries(DEFAULT_NETWORK_RPCS).forEach(([chainIdStr, endpoints]) => {
      const chainId = parseInt(chainIdStr, 10);
      if (!this.pools.has(chainId)) {
        this.registerChain(chainId, `Chain #${chainId}`, endpoints);
      }
    });
  }

  /**
   * Sanitize, deduplicate, and validate a list of RPC endpoints
   */
  public sanitizeEndpoints(urls: string[]): string[] {
    const valid = urls.filter((url) => {
      if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
      const lower = url.toLowerCase();
      return !BLOCKED_RPC_PATTERNS.some((pattern) => lower.includes(pattern));
    });

    const unique: string[] = [];
    valid.forEach((url) => {
      const clean = url.trim().replace(/\/+$/, '');
      if (!unique.includes(clean)) {
        unique.push(clean);
      }
    });

    return unique.length > 0 ? unique : urls;
  }

  /**
   * Register or update a network with its RPC endpoints
   */
  public registerChain(chainId: number, chainName: string, urls: string[]): NetworkRpcPool {
    const sanitized = this.sanitizeEndpoints(urls);
    const existing = this.pools.get(chainId);

    const activeUrl = existing?.activeUrl && sanitized.includes(existing.activeUrl)
      ? existing.activeUrl
      : sanitized[0] || 'https://cloudflare-eth.com';

    const backupUrls = sanitized.filter((u) => u !== activeUrl);

    const endpointStates: Record<string, RpcEndpointState> = existing?.endpointStates || {};
    sanitized.forEach((url) => {
      if (!endpointStates[url]) {
        endpointStates[url] = {
          url,
          status: 'untested',
          errorCount: 0,
        };
      }
    });

    const pool: NetworkRpcPool = {
      chainId,
      chainName,
      activeUrl,
      endpoints: sanitized,
      backupUrls,
      endpointStates,
      failoverCount: existing?.failoverCount || 0,
      lastFailoverAt: existing?.lastFailoverAt,
    };

    this.pools.set(chainId, pool);
    return pool;
  }

  /**
   * Get the current active RPC endpoint for a given chain
   */
  public getActiveEndpoint(chainId: number): string {
    const pool = this.pools.get(chainId);
    if (pool?.activeUrl) return pool.activeUrl;
    const defaults = DEFAULT_NETWORK_RPCS[chainId];
    return defaults?.[0] || 'https://cloudflare-eth.com';
  }

  /**
   * Get all registered backup RPC endpoints for a chain (excluding active URL)
   */
  public getBackupEndpoints(chainId: number): string[] {
    const pool = this.pools.get(chainId);
    if (!pool) return DEFAULT_NETWORK_RPCS[chainId]?.slice(1) || [];
    return pool.endpoints.filter((url) => url !== pool.activeUrl);
  }

  /**
   * Get all RPC endpoints configured for a chain
   */
  public getAllEndpoints(chainId: number): string[] {
    const pool = this.pools.get(chainId);
    return pool ? [...pool.endpoints] : DEFAULT_NETWORK_RPCS[chainId] || [];
  }

  /**
   * Get full state for a network pool
   */
  public getPool(chainId: number): NetworkRpcPool | undefined {
    return this.pools.get(chainId);
  }

  /**
   * Get all network pools
   */
  public getAllPools(): Record<number, NetworkRpcPool> {
    const result: Record<number, NetworkRpcPool> = {};
    this.pools.forEach((pool, chainId) => {
      result[chainId] = { ...pool };
    });
    return result;
  }

  /**
   * Manually set or prioritize an active RPC endpoint
   */
  public setActiveEndpoint(chainId: number, newUrl: string): boolean {
    const pool = this.pools.get(chainId);
    const cleanUrl = newUrl.trim().replace(/\/+$/, '');
    if (!pool) return false;

    if (!pool.endpoints.includes(cleanUrl)) {
      pool.endpoints.unshift(cleanUrl);
    }

    pool.activeUrl = cleanUrl;
    pool.backupUrls = pool.endpoints.filter((u) => u !== cleanUrl);
    if (!pool.endpointStates[cleanUrl]) {
      pool.endpointStates[cleanUrl] = {
        url: cleanUrl,
        status: 'active',
        errorCount: 0,
      };
    } else {
      pool.endpointStates[cleanUrl].status = 'active';
    }

    walletLogger.info(
      'RPC_DISPATCH',
      `Active RPC endpoint for chain ${pool.chainName} (${chainId}) updated to: ${cleanUrl}`
    );
    return true;
  }

  /**
   * Add a custom backup RPC endpoint to a chain's pool
   */
  public addBackupEndpoint(chainId: number, url: string, makeActive = false): boolean {
    const pool = this.pools.get(chainId);
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http')) return false;

    if (!pool) {
      this.registerChain(chainId, `Chain #${chainId}`, [cleanUrl]);
      return true;
    }

    if (!pool.endpoints.includes(cleanUrl)) {
      if (makeActive) {
        pool.endpoints.unshift(cleanUrl);
        pool.activeUrl = cleanUrl;
      } else {
        pool.endpoints.push(cleanUrl);
      }
      pool.backupUrls = pool.endpoints.filter((u) => u !== pool.activeUrl);
      pool.endpointStates[cleanUrl] = {
        url: cleanUrl,
        status: makeActive ? 'active' : 'untested',
        errorCount: 0,
      };
      return true;
    }

    if (makeActive) {
      this.setActiveEndpoint(chainId, cleanUrl);
    }
    return true;
  }

  private lastFailoverNotify: Map<number, number> = new Map();

  /**
   * Automatically switches the active RPC URL to the next available backup in the pool
   */
  public switchToNextBackup(
    chainId: number,
    reason: string,
    failedUrl?: string,
    statusCode?: number
  ): string {
    const pool = this.pools.get(chainId);
    if (!pool || pool.endpoints.length <= 1) {
      walletLogger.warn(
        'RPC_FAILOVER',
        `No backup RPC endpoints available to switch for chain ${chainId}. Retaining active URL: ${failedUrl || pool?.activeUrl}`
      );
      return pool?.activeUrl || failedUrl || '';
    }

    // If pool has already moved away from failedUrl, avoid cascade duplicate rotation
    if (failedUrl && pool.activeUrl !== failedUrl) {
      return pool.activeUrl;
    }

    const currentActive = failedUrl || pool.activeUrl;
    const currentIndex = pool.endpoints.indexOf(currentActive);
    const nextIndex = (currentIndex + 1) % pool.endpoints.length;
    const nextUrl = pool.endpoints[nextIndex];

    // Mark previous endpoint state
    if (pool.endpointStates[currentActive]) {
      pool.endpointStates[currentActive].status =
        statusCode === 402 || statusCode === 403 ? 'forbidden' : 'degraded';
      pool.endpointStates[currentActive].lastStatusCode = statusCode;
      pool.endpointStates[currentActive].lastError = reason;
      pool.endpointStates[currentActive].errorCount += 1;
    }

    // Set new active URL
    pool.activeUrl = nextUrl;
    pool.backupUrls = pool.endpoints.filter((u) => u !== nextUrl);
    pool.failoverCount += 1;
    pool.lastFailoverAt = Date.now();

    if (pool.endpointStates[nextUrl]) {
      pool.endpointStates[nextUrl].status = 'active';
    }

    const event: RpcFailoverEvent = {
      chainId,
      chainName: pool.chainName,
      previousUrl: currentActive,
      newActiveUrl: nextUrl,
      statusCode,
      reason,
      timestamp: Date.now(),
    };

    walletLogger.info(
      'RPC_FAILOVER',
      `[RPC Auto-Failover] Switched chain ${pool.chainName} (${chainId}) RPC from ${currentActive} -> ${nextUrl} due to: ${reason}${statusCode ? ` (HTTP ${statusCode})` : ''}`,
      {
        chainId,
        chainName: pool.chainName,
        previousUrl: currentActive,
        newActiveUrl: nextUrl,
        statusCode,
        reason,
        remainingBackups: pool.backupUrls.length,
      }
    );

    // Throttle listener notifications to at most once every 3s per chain to prevent UI re-render storms
    const lastNotified = this.lastFailoverNotify.get(chainId) || 0;
    if (Date.now() - lastNotified > 3000) {
      this.lastFailoverNotify.set(chainId, Date.now());
      this.failoverListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error('RPC failover listener error:', err);
        }
      });
    }

    return nextUrl;
  }

  /**
   * Check if an error or status indicates a 402/403 or payment/tier restriction
   */
  private isAuthOrTierError(statusCode?: number, errorObj?: any): boolean {
    if (statusCode === 402 || statusCode === 403) return true;

    if (errorObj) {
      const msg = (typeof errorObj === 'string' ? errorObj : errorObj.message || JSON.stringify(errorObj)).toLowerCase();
      if (
        msg.includes('402') ||
        msg.includes('403') ||
        msg.includes('payment required') ||
        msg.includes('forbidden') ||
        msg.includes('free plan') ||
        msg.includes('paid plan') ||
        msg.includes('upgrade to paid') ||
        msg.includes('unauthorized') ||
        msg.includes('credits') ||
        msg.includes('quota exceeded') ||
        msg.includes('plan limit')
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Execute an arbitrary JSON-RPC request with automated 402/403 detection,
   * exponential timeout guards, and automated secondary backup failover.
   */
  public async execute<T = any>(
    chainId: number,
    method: string,
    params: any[] = [],
    options?: {
      timeoutMs?: number;
      signal?: AbortSignal;
      maxRetries?: number;
    }
  ): Promise<T> {
    let pool = this.pools.get(chainId);
    if (!pool) {
      const defaultEndpoints = DEFAULT_NETWORK_RPCS[chainId] || ['https://cloudflare-eth.com'];
      pool = this.registerChain(chainId, `Chain #${chainId}`, defaultEndpoints);
    }

    const availableEndpoints = [...pool.endpoints];
    const maxAttempts = options?.maxRetries ?? Math.max(availableEndpoints.length, 3);
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentUrl = pool.activeUrl;
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        if (options?.signal) {
          options.signal.addEventListener('abort', () => controller.abort(), { once: true });
        }

        const payload: JsonRpcRequest = {
          jsonrpc: '2.0',
          id: Date.now() + attempt,
          method,
          params,
        };

        const response = await fetch(currentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        // 1. Check HTTP Status for 402 (Payment Required) or 403 (Forbidden)
        if (response.status === 402 || response.status === 403) {
          const statusText = response.status === 402 ? '402 Payment Required' : '403 Forbidden';
          this.switchToNextBackup(
            chainId,
            `HTTP ${statusText} returned by primary RPC provider`,
            currentUrl,
            response.status
          );
          continue; // Automatically retry on newly active secondary backup RPC
        }

        // 2. Check for other HTTP errors (429 Rate Limit, 5xx server errors)
        if (!response.ok) {
          this.switchToNextBackup(
            chainId,
            `HTTP ${response.status} ${response.statusText}`,
            currentUrl,
            response.status
          );
          continue;
        }

        // 3. Parse JSON-RPC response
        const data: JsonRpcResponse<T> = await response.json();

        // 4. Check JSON-RPC Error Payload for tier / permission restrictions
        if (data.error) {
          const isTierLimit = this.isAuthOrTierError(undefined, data.error);
          if (isTierLimit) {
            this.switchToNextBackup(
              chainId,
              `RPC Provider error: ${data.error.message}`,
              currentUrl,
              403
            );
            continue;
          }

          // For other RPC method errors (e.g. execution reverted), record and throw
          throw new Error(data.error.message || `JSON-RPC Error code ${data.error.code}`);
        }

        // 5. Successful response!
        if (pool.endpointStates[currentUrl]) {
          pool.endpointStates[currentUrl].status = 'healthy';
          pool.endpointStates[currentUrl].latencyMs = latencyMs;
          pool.endpointStates[currentUrl].lastTested = Date.now();
          pool.endpointStates[currentUrl].errorCount = 0;
        }

        return data.result as T;
      } catch (err: any) {
        lastError = err;

        // If parent signal was aborted, exit immediately without failover or retries
        if (options?.signal?.aborted) {
          throw err;
        }

        // Check if error is due to abort or network failure
        const isAbort = err.name === 'AbortError';
        const reason = isAbort ? `Request timed out after ${options?.timeoutMs || this.defaultTimeoutMs}ms` : err.message || 'Network fetch error';

        if (this.isAuthOrTierError(undefined, err)) {
          this.switchToNextBackup(chainId, reason, currentUrl, 403);
        } else {
          // Switch to backup for timeout or fetch failures
          this.switchToNextBackup(chainId, reason, currentUrl);
        }
      }
    }

    throw new Error(
      `All RPC endpoints failed for chain ${pool.chainName} (${chainId}). Last error: ${lastError?.message || lastError}`
    );
  }

  /**
   * Helper: Query Native Balance (eth_getBalance)
   */
  public async getBalance(
    chainId: number,
    address: string,
    signal?: AbortSignal
  ): Promise<number | null> {
    try {
      const hex = await this.execute<string>(
        chainId,
        'eth_getBalance',
        [address, 'latest'],
        { signal, timeoutMs: 4000 }
      );

      if (hex !== undefined && hex !== null) {
        const wei = BigInt(hex);
        const eth = Number(wei) / 1e18;
        return isNaN(eth) ? 0 : parseFloat(eth.toFixed(6));
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper: Query ERC-20 Token Balance via eth_call
   */
  public async getTokenBalance(
    chainId: number,
    tokenAddress: string,
    walletAddress: string,
    decimals: number = 18,
    signal?: AbortSignal
  ): Promise<number | null> {
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      return this.getBalance(chainId, walletAddress, signal);
    }

    const cleanAddr = walletAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    const callData = `0x70a08231${cleanAddr}`;

    try {
      const resultHex = await this.execute<string>(
        chainId,
        'eth_call',
        [
          {
            to: tokenAddress,
            data: callData,
          },
          'latest',
        ],
        { signal, timeoutMs: 4000 }
      );

      if (resultHex && resultHex !== '0x') {
        const rawBal = BigInt(resultHex);
        const divisor = 10 ** decimals;
        const parsed = Number(rawBal) / divisor;
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    } catch {
      return null;
    }
  }

  /**
   * Helper: Get current chain ID from provider
   */
  public async getChainId(chainId: number): Promise<number | null> {
    try {
      const hex = await this.execute<string>(chainId, 'eth_chainId', [], { timeoutMs: 3000 });
      return hex ? parseInt(hex, 16) : null;
    } catch {
      return null;
    }
  }

  /**
   * Helper: Get latest block number
   */
  public async getBlockNumber(chainId: number): Promise<number | null> {
    try {
      const hex = await this.execute<string>(chainId, 'eth_blockNumber', [], { timeoutMs: 3000 });
      return hex ? parseInt(hex, 16) : null;
    } catch {
      return null;
    }
  }

  /**
   * Helper: eth_call on chain
   */
  public async call(
    chainId: number,
    params: { to: string; data: string; from?: string; value?: string },
    blockTag: string = 'latest'
  ): Promise<string> {
    return this.execute<string>(chainId, 'eth_call', [params, blockTag]);
  }

  /**
   * Helper: estimate gas on chain
   */
  public async estimateGas(
    chainId: number,
    params: { to?: string; from?: string; data?: string; value?: string }
  ): Promise<string> {
    return this.execute<string>(chainId, 'eth_estimateGas', [params]);
  }

  /**
   * Helper: get transaction receipt on chain
   */
  public async getTransactionReceipt(
    chainId: number,
    hash: string
  ): Promise<any> {
    return this.execute<any>(chainId, 'eth_getTransactionReceipt', [hash]);
  }

  /**
   * Wait for a transaction receipt by polling with automatic RPC failover
   */
  public async waitForTransactionReceipt(
    chainId: number,
    hash: string,
    maxWaitMs: number = 60000,
    pollIntervalMs: number = 1800
  ): Promise<any> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const receipt = await this.getTransactionReceipt(chainId, hash);
        if (receipt && receipt.blockNumber) {
          return receipt;
        }
      } catch {
        // Receipt not mined yet
      }
      await new Promise((res) => setTimeout(res, pollIntervalMs));
    }
    return null;
  }

  /**
   * Chain-Bound Public Client Factory:
   * Returns a lightweight, chain-isolated client interface strictly bound to `chainId`.
   * Any call on this client will ONLY query the RPC pool for the specified chain.
   */
  public getPublicClient(chainId: number): PublicClient {
    return {
      chainId,
      getActiveRpcUrl: () => this.getActiveEndpoint(chainId),
      getBackupRpcUrls: () => this.getBackupEndpoints(chainId),
      getBalance: (address: string, signal?: AbortSignal) => this.getBalance(chainId, address, signal),
      getTokenBalance: (tokenAddress: string, walletAddress: string, decimals?: number, signal?: AbortSignal) =>
        this.getTokenBalance(chainId, tokenAddress, walletAddress, decimals, signal),
      call: (params, blockTag) => this.call(chainId, params, blockTag),
      estimateGas: (params) => this.estimateGas(chainId, params),
      getChainId: () => this.getChainId(chainId),
      getBlockNumber: () => this.getBlockNumber(chainId),
      getTransactionReceipt: (hash: string) => this.getTransactionReceipt(chainId, hash),
      execute: <T = any>(method: string, params?: any[], options?: { timeoutMs?: number; signal?: AbortSignal; maxRetries?: number }) =>
        this.execute<T>(chainId, method, params, options),
    };
  }

  /**
   * Subscribe to RPC failover events
   */
  public subscribeToFailovers(listener: FailoverListener): () => void {
    this.failoverListeners.add(listener);
    return () => {
      this.failoverListeners.delete(listener);
    };
  }
}

// Global Singleton Instance
export const rpcProviderWrapper = new CustomRpcProviderWrapper();

/**
 * Top-level factory function to get a chain-bound public client
 */
export function getPublicClient(chainId: number): PublicClient {
  return rpcProviderWrapper.getPublicClient(chainId);
}
