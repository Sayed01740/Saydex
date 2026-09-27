import { rpcProviderWrapper } from '../utils/rpcProviderWrapper';
import { livePriceService } from './livePriceService';
import { getChainById } from '../config/chains';
import { Token } from '../types';

export interface LiveGasData {
  chainId: number;
  gasPriceGwei: number;
  gasPriceWei: bigint;
  estimatedGasUnits: number;
  nativeSymbol: string;
  nativePriceUSD: number;
  gasCostNative: number;
  l1FeeUSD: number;
  gasCostUSD: number;
  formattedUSD: string;
  isLiveOnChain: boolean;
  updatedAt: number;
}

interface ChainGasProfile {
  nativeSymbol: string;
  fallbackGasPriceGwei: number;
  typicalGasUnits: number;
  l1FeeUSD: number; // L1 calldata fee overhead for L2 rollups (Nitro, OP Stack blobs, etc.)
  defaultNativePrice: number;
}

const CHAIN_GAS_PROFILES: Record<number, ChainGasProfile> = {
  // Ethereum Mainnet (1) - L1
  1: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 1.5,
    typicalGasUnits: 130000,
    l1FeeUSD: 0,
    defaultNativePrice: 2680,
  },
  // Arbitrum One (42161) - L2 (Arbitrum Nitro)
  42161: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.02,
    typicalGasUnits: 140000,
    l1FeeUSD: 0.015,
    defaultNativePrice: 2680,
  },
  // Base (8453) - L2 (OP Stack with EIP-4844 blobs)
  8453: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.006,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.005,
    defaultNativePrice: 2680,
  },
  // OP Mainnet (10) - L2 (OP Stack)
  10: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.002,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.005,
    defaultNativePrice: 2680,
  },
  // Polygon PoS (137) - L1 (POL / MATIC)
  137: {
    nativeSymbol: 'POL',
    fallbackGasPriceGwei: 35.0,
    typicalGasUnits: 140000,
    l1FeeUSD: 0,
    defaultNativePrice: 0.38,
  },
  // BNB Smart Chain (56) - L1 (BNB)
  56: {
    nativeSymbol: 'BNB',
    fallbackGasPriceGwei: 1.0,
    typicalGasUnits: 130000,
    l1FeeUSD: 0,
    defaultNativePrice: 770,
  },
  // Avalanche C-Chain (43114) - L1 (AVAX)
  43114: {
    nativeSymbol: 'AVAX',
    fallbackGasPriceGwei: 25.0,
    typicalGasUnits: 130000,
    l1FeeUSD: 0,
    defaultNativePrice: 11.5,
  },
  // Celo (42220) - L1 (CELO)
  42220: {
    nativeSymbol: 'CELO',
    fallbackGasPriceGwei: 5.0,
    typicalGasUnits: 120000,
    l1FeeUSD: 0,
    defaultNativePrice: 0.45,
  },
  // Blast (81457) - L2
  81457: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.01,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.005,
    defaultNativePrice: 2680,
  },
  // Zora (7777777) - L2
  7777777: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.005,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.005,
    defaultNativePrice: 2680,
  },
  // zkSync Era (324) - L2
  324: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.05,
    typicalGasUnits: 150000,
    l1FeeUSD: 0.01,
    defaultNativePrice: 2680,
  },
  // World Chain (480) - L2
  480: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.005,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.005,
    defaultNativePrice: 2680,
  },
  // Unichain Mainnet (130) - L2
  130: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.01,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.005,
    defaultNativePrice: 2680,
  },
  // Sepolia Testnet (11155111)
  11155111: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 1.0,
    typicalGasUnits: 130000,
    l1FeeUSD: 0,
    defaultNativePrice: 2680,
  },
  // Arbitrum Sepolia (421614)
  421614: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.02,
    typicalGasUnits: 140000,
    l1FeeUSD: 0.005,
    defaultNativePrice: 2680,
  },
  // Base Sepolia (84532)
  84532: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.005,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.002,
    defaultNativePrice: 2680,
  },
  // Optimism Sepolia (11155420)
  11155420: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.002,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.002,
    defaultNativePrice: 2680,
  },
  // Unichain Sepolia (1301)
  1301: {
    nativeSymbol: 'ETH',
    fallbackGasPriceGwei: 0.01,
    typicalGasUnits: 130000,
    l1FeeUSD: 0.002,
    defaultNativePrice: 2680,
  },
};

class GasService {
  private cache = new Map<number, { data: LiveGasData; expiresAt: number }>();
  private pendingRequests = new Map<number, Promise<LiveGasData>>();
  private listeners = new Set<(chainId: number, data: LiveGasData) => void>();

  /**
   * Get chain gas profile
   */
  public getProfile(chainId: number): ChainGasProfile {
    if (CHAIN_GAS_PROFILES[chainId]) {
      return CHAIN_GAS_PROFILES[chainId];
    }
    const chain = getChainById(chainId);
    const sym = chain.nativeCurrency?.symbol || 'ETH';
    return {
      nativeSymbol: sym,
      fallbackGasPriceGwei: chain.gasPriceGwei || (sym === 'BNB' ? 1.0 : sym === 'POL' || sym === 'MATIC' ? 30.0 : sym === 'AVAX' ? 25.0 : sym === 'CELO' ? 5.0 : 0.05),
      typicalGasUnits: 130000,
      l1FeeUSD: chainId > 1000000 ? 0 : 0.005,
      defaultNativePrice: sym === 'BNB' ? 770 : sym === 'POL' || sym === 'MATIC' ? 0.38 : sym === 'AVAX' ? 11.5 : sym === 'CELO' ? 0.45 : 2680,
    };
  }

  /**
   * Get the real-time USD price of the native gas token (ETH, BNB, POL, AVAX, CELO)
   */
  public getNativePriceUSD(chainId: number): number {
    const profile = this.getProfile(chainId);
    const sym = profile.nativeSymbol;

    const cached = livePriceService.getCachedPrice({ symbol: sym, chainId } as Token);
    if (cached && cached.priceUSD && cached.priceUSD > 0) {
      return cached.priceUSD;
    }

    // Fallback to global symbol price if specific chain query is not found
    const globalCached = livePriceService.getCachedPrice({ symbol: sym, chainId: 1 } as Token);
    if (globalCached && globalCached.priceUSD && globalCached.priceUSD > 0) {
      return globalCached.priceUSD;
    }

    return profile.defaultNativePrice;
  }

  /**
   * Format gas fee in USD: shows '<$0.01' if lower than 0.01, otherwise '$0.36'
   */
  public formatGasFee(gasCostUSD: number): string {
    if (gasCostUSD <= 0) return '$0.00';
    if (gasCostUSD < 0.005) return '<$0.01';
    if (gasCostUSD < 0.01) return '$0.01';
    return `$${gasCostUSD.toFixed(2)}`;
  }

  /**
   * Synchronous fallback calculator using latest known or profile gas data
   */
  public getGasDataSync(chainId: number, customGasUnits?: number): LiveGasData {
    const cached = this.cache.get(chainId);
    const profile = this.getProfile(chainId);
    const units = customGasUnits || profile.typicalGasUnits;
    const nativePriceUSD = this.getNativePriceUSD(chainId);

    if (cached && cached.data) {
      const gwei = cached.data.gasPriceGwei;
      const gasCostNative = (units * gwei) / 1e9;
      const gasCostUSD = (gasCostNative * nativePriceUSD) + profile.l1FeeUSD;
      return {
        ...cached.data,
        estimatedGasUnits: units,
        nativePriceUSD,
        gasCostNative,
        gasCostUSD,
        formattedUSD: this.formatGasFee(gasCostUSD),
      };
    }

    const gwei = profile.fallbackGasPriceGwei;
    const gasPriceWei = BigInt(Math.floor(gwei * 1e9));
    const gasCostNative = (units * gwei) / 1e9;
    const gasCostUSD = (gasCostNative * nativePriceUSD) + profile.l1FeeUSD;

    return {
      chainId,
      gasPriceGwei: gwei,
      gasPriceWei,
      estimatedGasUnits: units,
      nativeSymbol: profile.nativeSymbol,
      nativePriceUSD,
      gasCostNative,
      l1FeeUSD: profile.l1FeeUSD,
      gasCostUSD,
      formattedUSD: this.formatGasFee(gasCostUSD),
      isLiveOnChain: false,
      updatedAt: Date.now(),
    };
  }

  /**
   * Fetch live on-chain gas price directly from the blockchain RPC pool
   */
  public async fetchLiveGasData(chainId: number, customGasUnits?: number): Promise<LiveGasData> {
    const profile = this.getProfile(chainId);
    const units = customGasUnits || profile.typicalGasUnits;
    const now = Date.now();

    // Check recent valid cache (10s TTL)
    const existing = this.cache.get(chainId);
    if (existing && existing.expiresAt > now) {
      const nativePriceUSD = this.getNativePriceUSD(chainId);
      const gasCostNative = (units * existing.data.gasPriceGwei) / 1e9;
      const gasCostUSD = (gasCostNative * nativePriceUSD) + profile.l1FeeUSD;
      return {
        ...existing.data,
        estimatedGasUnits: units,
        nativePriceUSD,
        gasCostNative,
        gasCostUSD,
        formattedUSD: this.formatGasFee(gasCostUSD),
      };
    }

    // Deduplicate in-flight requests for the same chain
    if (this.pendingRequests.has(chainId)) {
      return this.pendingRequests.get(chainId)!;
    }

    const fetchPromise = (async () => {
      let isLive = false;
      let gasPriceWei: bigint | null = null;

      try {
        gasPriceWei = await rpcProviderWrapper.getGasPrice(chainId);
        if (gasPriceWei !== null && gasPriceWei > 0n) {
          isLive = true;
        }
      } catch (err) {
        console.warn(`[GasService] Failed to query live eth_gasPrice for chain ${chainId}:`, err);
      }

      // If RPC failed, fall back to chain profile default
      const gwei = (gasPriceWei !== null && gasPriceWei > 0n)
        ? Number(gasPriceWei) / 1e9
        : profile.fallbackGasPriceGwei;

      const finalWei = gasPriceWei ?? BigInt(Math.floor(gwei * 1e9));
      const nativePriceUSD = this.getNativePriceUSD(chainId);
      const gasCostNative = (units * gwei) / 1e9;
      const gasCostUSD = (gasCostNative * nativePriceUSD) + profile.l1FeeUSD;

      const result: LiveGasData = {
        chainId,
        gasPriceGwei: gwei,
        gasPriceWei: finalWei,
        estimatedGasUnits: units,
        nativeSymbol: profile.nativeSymbol,
        nativePriceUSD,
        gasCostNative,
        l1FeeUSD: profile.l1FeeUSD,
        gasCostUSD,
        formattedUSD: this.formatGasFee(gasCostUSD),
        isLiveOnChain: isLive,
        updatedAt: Date.now(),
      };

      this.cache.set(chainId, {
        data: result,
        expiresAt: Date.now() + 10000, // 10 second freshness window
      });

      this.listeners.forEach((fn) => fn(chainId, result));
      return result;
    })().finally(() => {
      this.pendingRequests.delete(chainId);
    });

    this.pendingRequests.set(chainId, fetchPromise);
    return fetchPromise;
  }

  /**
   * Subscribe to live gas updates across chains
   */
  public subscribe(listener: (chainId: number, data: LiveGasData) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const gasService = new GasService();
