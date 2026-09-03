import { Token } from '../types';

export interface LivePriceData {
  priceUSD: number;
  change24h: number;
  lastUpdated: number;
}

// Chain prefix mappings for DefiLlama Coins API
const LLAMA_CHAIN_PREFIX: Record<number, string> = {
  1: 'ethereum',
  42161: 'arbitrum',
  8453: 'base',
  10: 'optimism',
  137: 'polygon',
  56: 'bsc',
  43114: 'avax',
  11155111: 'ethereum', // Testnet fallback
  84532: 'base',
  421614: 'arbitrum',
  11155420: 'optimism',
  1301: 'ethereum',
};

// Coingecko IDs for major native/wrapped coins
const COINGECKO_MAP: Record<string, string> = {
  ETH: 'coingecko:ethereum',
  WETH: 'coingecko:ethereum',
  BTC: 'coingecko:bitcoin',
  WBTC: 'coingecko:wrapped-bitcoin',
  SOL: 'coingecko:solana',
  WSOL: 'coingecko:solana',
  UNI: 'coingecko:uniswap',
  LINK: 'coingecko:chainlink',
  AAVE: 'coingecko:aave',
  MKR: 'coingecko:maker',
  SNX: 'coingecko:havven',
  CRV: 'coingecko:curve-dao-token',
  LDO: 'coingecko:lido-dao',
  ARB: 'coingecko:arbitrum',
  OP: 'coingecko:optimism',
  POL: 'coingecko:matic-network',
  MATIC: 'coingecko:matic-network',
  BNB: 'coingecko:binancecoin',
  WBNB: 'coingecko:binancecoin',
  AVAX: 'coingecko:avalanche-2',
  WAVAX: 'coingecko:avalanche-2',
  USDC: 'coingecko:usd-coin',
  USDT: 'coingecko:tether',
  DAI: 'coingecko:dai',
  PEPE: 'coingecko:pepe',
  SHIB: 'coingecko:shiba-inu',
  DOGE: 'coingecko:dogecoin',
  SAYDEX: 'coingecko:uniswap', // Benchmarked token
};

// Binance ticker mapping for instant ultra-low latency fallback
const BINANCE_TICKERS: Record<string, string> = {
  ETH: 'ETHUSDT',
  WETH: 'ETHUSDT',
  BTC: 'BTCUSDT',
  WBTC: 'BTCUSDT',
  SOL: 'SOLUSDT',
  WSOL: 'SOLUSDT',
  UNI: 'UNIUSDT',
  LINK: 'LINKUSDT',
  AAVE: 'AAVEUSDT',
  MKR: 'MKRUSDT',
  SNX: 'SNXUSDT',
  CRV: 'CRVUSDT',
  LDO: 'LDOUSDT',
  ARB: 'ARBUSDT',
  OP: 'OPUSDT',
  POL: 'POLUSDT',
  MATIC: 'POLUSDT',
  BNB: 'BNBUSDT',
  WBNB: 'BNBUSDT',
  AVAX: 'AVAXUSDT',
  WAVAX: 'AVAXUSDT',
  PEPE: 'PEPEUSDT',
  SHIB: 'SHIBUSDT',
  DOGE: 'DOGEUSDT',
};

class LivePriceService {
  private cache: Map<string, LivePriceData> = new Map();
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 15000; // 15 seconds refresh TTL
  private isFetching = false;

  constructor() {
    // Restore from localStorage if available
    try {
      const saved = localStorage.getItem('saydex_live_prices_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, val]) => {
          this.cache.set(key, val as LivePriceData);
        });
      }
    } catch {}
  }

  private saveToStorage() {
    try {
      const obj: Record<string, LivePriceData> = {};
      this.cache.forEach((v, k) => {
        obj[k] = v;
      });
      localStorage.setItem('saydex_live_prices_cache', JSON.stringify(obj));
    } catch {}
  }

  /**
   * Generates a unique key for token price lookup
   */
  public getTokenKey(token: { chainId?: number; symbol: string; address?: string }): string {
    const sym = token.symbol.toUpperCase();
    return `${token.chainId || 1}:${sym}`;
  }

  /**
   * Get cached price for a token synchronously
   */
  public getCachedPrice(token: Token): LivePriceData | null {
    const key = this.getTokenKey(token);
    return this.cache.get(key) || this.cache.get(`1:${token.symbol.toUpperCase()}`) || null;
  }

  /**
   * Fetch live prices for a list of tokens across all chains
   */
  public async fetchPrices(tokens: Token[], force: boolean = false): Promise<Map<string, LivePriceData>> {
    const now = Date.now();
    if (!force && now - this.lastFetchTime < this.CACHE_TTL_MS && this.cache.size > 0) {
      return this.cache;
    }

    if (this.isFetching) {
      return this.cache;
    }

    this.isFetching = true;

    try {
      // 1. Prepare DefiLlama query parameters
      const llamaIds: string[] = [];
      const idToKeysMap = new Map<string, string[]>();

      tokens.forEach((t) => {
        const key = this.getTokenKey(t);
        const globalKey = `1:${t.symbol.toUpperCase()}`;

        // Add Coingecko ID mapping if available
        const cgId = COINGECKO_MAP[t.symbol.toUpperCase()];
        if (cgId) {
          if (!llamaIds.includes(cgId)) llamaIds.push(cgId);
          const existing = idToKeysMap.get(cgId) || [];
          existing.push(key, globalKey);
          idToKeysMap.set(cgId, existing);
        }

        // Add on-chain address mapping for real contracts
        if (t.address && t.address !== '0x0000000000000000000000000000000000000000' && t.chainId) {
          const prefix = LLAMA_CHAIN_PREFIX[t.chainId];
          if (prefix) {
            const addrId = `${prefix}:${t.address.toLowerCase()}`;
            if (!llamaIds.includes(addrId)) llamaIds.push(addrId);
            const existing = idToKeysMap.get(addrId) || [];
            existing.push(key);
            idToKeysMap.set(addrId, existing);
          }
        }
      });

      // 2. Fetch from DefiLlama (Multi-Token Batch)
      let llamaSuccess = false;
      if (llamaIds.length > 0) {
        try {
          const queryStr = llamaIds.slice(0, 100).join(',');
          const res = await fetch(`https://coins.llama.fi/prices/current/${queryStr}`, {
            signal: AbortSignal.timeout(4500),
          });

          if (res.ok) {
            const data = await res.json();
            const coins = data.coins || {};

            Object.entries(coins).forEach(([coinId, coinData]: [string, any]) => {
              if (coinData && typeof coinData.price === 'number') {
                const mappedKeys = idToKeysMap.get(coinId) || [];
                const priceData: LivePriceData = {
                  priceUSD: coinData.price,
                  change24h: typeof coinData.confidence === 'number' ? (coinData.change24h ?? 0) : 0,
                  lastUpdated: now,
                };

                mappedKeys.forEach((k) => {
                  this.cache.set(k, priceData);
                });
                llamaSuccess = true;
              }
            });
          }
        } catch (e) {
          console.warn('[LivePriceService] DefiLlama API error, attempting fallback:', e);
        }
      }

      // 3. Fallback / Augment with Binance 24hr Tickers for top liquid tokens
      try {
        const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
          signal: AbortSignal.timeout(4000),
        });

        if (binanceRes.ok) {
          const tickers: Array<{ symbol: string; lastPrice: string; priceChangePercent: string }> = await binanceRes.json();
          const tickerMap = new Map<string, { price: number; change24h: number }>();

          tickers.forEach((t) => {
            tickerMap.set(t.symbol, {
              price: parseFloat(t.lastPrice) || 0,
              change24h: parseFloat(t.priceChangePercent) || 0,
            });
          });

          tokens.forEach((t) => {
            const sym = t.symbol.toUpperCase();
            const binancePair = BINANCE_TICKERS[sym];
            if (binancePair && tickerMap.has(binancePair)) {
              const bData = tickerMap.get(binancePair)!;
              if (bData.price > 0) {
                const key = this.getTokenKey(t);
                const globalKey = `1:${sym}`;
                const priceData: LivePriceData = {
                  priceUSD: bData.price,
                  change24h: bData.change24h,
                  lastUpdated: now,
                };
                this.cache.set(key, priceData);
                this.cache.set(globalKey, priceData);
              }
            }
          });
        }
      } catch (binanceErr) {
        // Binance might be geo-restricted in some regions; DefiLlama will be primary
      }

      // 4. Fallback for Stablecoins
      tokens.forEach((t) => {
        const sym = t.symbol.toUpperCase();
        if (['USDC', 'USDT', 'DAI', 'USDS', 'FDUSD', 'PYUSD'].includes(sym)) {
          const key = this.getTokenKey(t);
          if (!this.cache.has(key)) {
            this.cache.set(key, {
              priceUSD: 1.0,
              change24h: 0.01,
              lastUpdated: now,
            });
          }
        }
      });

      this.lastFetchTime = now;
      this.saveToStorage();
    } catch (err) {
      console.warn('[LivePriceService] Error updating prices:', err);
    } finally {
      this.isFetching = false;
    }

    return this.cache;
  }

  /**
   * Enriches a token array with latest live prices and returns a new list
   */
  public enrichTokensWithLivePrices(tokens: Token[]): Token[] {
    return tokens.map((token) => {
      const live = this.getCachedPrice(token);
      if (live && live.priceUSD > 0) {
        return {
          ...token,
          priceUSD: live.priceUSD,
          change24h: live.change24h !== 0 ? live.change24h : token.change24h,
        };
      }
      return token;
    });
  }
}

export const livePriceService = new LivePriceService();
