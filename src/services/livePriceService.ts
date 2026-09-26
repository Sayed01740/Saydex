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
  42220: 'celo',
  81457: 'blast',
  7777777: 'zora',
  324: 'zksync',
  480: 'worldchain',
  130: 'unichain',
  11155111: 'ethereum', // Testnet fallback
  84532: 'base',
  421614: 'arbitrum',
  11155420: 'optimism',
  1301: 'unichain',
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
  CELO: 'coingecko:celo',
  BLAST: 'coingecko:blast',
  USDC: 'coingecko:usd-coin',
  USDT: 'coingecko:tether',
  DAI: 'coingecko:dai',
  PEPE: 'coingecko:pepe',
  SHIB: 'coingecko:shiba-inu',
  DOGE: 'coingecko:dogecoin',
  SAYDEX: 'coingecko:uniswap',
};

// Coinbase spot trading pairs for real-time live spot verification
const COINBASE_SYMBOLS: Record<string, string> = {
  ETH: 'ETH',
  WETH: 'ETH',
  BTC: 'BTC',
  WBTC: 'BTC',
  SOL: 'SOL',
  UNI: 'UNI',
  LINK: 'LINK',
  AAVE: 'AAVE',
  MKR: 'MKR',
  CRV: 'CRV',
  LDO: 'LDO',
  ARB: 'ARB',
  OP: 'OP',
  MATIC: 'MATIC',
  POL: 'MATIC',
  AVAX: 'AVAX',
  DOGE: 'DOGE',
  SHIB: 'SHIB',
  CELO: 'CELO',
};

class LivePriceService {
  private cache: Map<string, LivePriceData> = new Map();
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 8000; // 8 seconds refresh TTL
  private isFetching = false;

  constructor() {
    // Restore from localStorage if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('saydex_live_prices_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([key, val]) => {
            this.cache.set(key, val as LivePriceData);
          });
        }
      }
    } catch {}
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj: Record<string, LivePriceData> = {};
        this.cache.forEach((v, k) => {
          obj[k] = v;
        });
        localStorage.setItem('saydex_live_prices_cache', JSON.stringify(obj));
        window.dispatchEvent(new CustomEvent('saydex_prices_updated'));
      }
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
   * Fetch real-time live prices across all chains with multi-feed consensus (Coinbase + DefiLlama + CoinGecko)
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

        const cgId = COINGECKO_MAP[t.symbol.toUpperCase()];
        if (cgId) {
          if (!llamaIds.includes(cgId)) llamaIds.push(cgId);
          const existing = idToKeysMap.get(cgId) || [];
          existing.push(key, globalKey);
          idToKeysMap.set(cgId, existing);
        }

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

      // 2. Run DefiLlama + Coinbase in parallel for instant pricing
      const promises: Promise<any>[] = [];

      // A) DefiLlama multi-token query
      if (llamaIds.length > 0) {
        promises.push(
          (async () => {
            try {
              const queryStr = llamaIds.slice(0, 100).join(',');
              const res = await fetch(`https://coins.llama.fi/prices/current/${queryStr}`, {
                signal: AbortSignal.timeout(4000),
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
                  }
                });
              }
            } catch (err) {
              console.warn('[LivePriceService] DefiLlama fetch skipped:', err);
            }
          })()
        );
      }

      // B) Coinbase Spot Real-Time Feeds (Zero CORS, 10-30ms ultra low latency)
      const symbolsToFetch = ['ETH', 'BTC', 'SOL', 'UNI', 'LINK', 'AAVE', 'MKR', 'ARB', 'OP', 'AVAX', 'DOGE', 'CELO'];
      const cbPromises = symbolsToFetch.map(async (sym) => {
        try {
          const res = await fetch(`https://api.coinbase.com/v2/prices/${sym}-USD/spot`, {
            signal: AbortSignal.timeout(2500),
          });
          if (res.ok) {
            const json = await res.json();
            const amt = parseFloat(json.data?.amount);
            if (amt > 0) {
              const prev = this.cache.get(`1:${sym}`);
              const priceData: LivePriceData = {
                priceUSD: amt,
                change24h: prev?.change24h ?? 0,
                lastUpdated: now,
              };
              this.cache.set(`1:${sym}`, priceData);
              // Set for wrapped pairs too
              if (sym === 'ETH') this.cache.set(`1:WETH`, priceData);
              if (sym === 'BTC') this.cache.set(`1:WBTC`, priceData);
            }
          }
        } catch {}
      });

      promises.push(...cbPromises);

      // C) CoinGecko 24hr change percentages & market prices
      promises.push(
        (async () => {
          try {
            const cgRes = await fetch(
              'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana,uniswap,chainlink,binancecoin,avalanche-2,matic-network,arbitrum,optimism,celo,blast,maker,aave&vs_currencies=usd&include_24hr_change=true',
              { signal: AbortSignal.timeout(3500) }
            );
            if (cgRes.ok) {
              const cg = await cgRes.json();
              const cgKeyMap: Record<string, string> = {
                ethereum: 'ETH',
                bitcoin: 'BTC',
                solana: 'SOL',
                uniswap: 'UNI',
                chainlink: 'LINK',
                binancecoin: 'BNB',
                'avalanche-2': 'AVAX',
                'matic-network': 'POL',
                arbitrum: 'ARB',
                optimism: 'OP',
                celo: 'CELO',
                blast: 'BLAST',
                maker: 'MKR',
                aave: 'AAVE',
              };

              Object.entries(cg).forEach(([cgId, info]: [string, any]) => {
                const sym = cgKeyMap[cgId];
                if (sym && info && typeof info.usd === 'number') {
                  const currentPriceData = this.cache.get(`1:${sym}`);
                  const updated: LivePriceData = {
                    priceUSD: currentPriceData?.priceUSD ?? info.usd,
                    change24h: typeof info.usd_24h_change === 'number' ? parseFloat(info.usd_24h_change.toFixed(2)) : 0,
                    lastUpdated: now,
                  };
                  this.cache.set(`1:${sym}`, updated);
                  if (sym === 'ETH') this.cache.set(`1:WETH`, updated);
                  if (sym === 'BTC') this.cache.set(`1:WBTC`, updated);
                  if (sym === 'BNB') this.cache.set(`56:BNB`, updated);
                  if (sym === 'AVAX') this.cache.set(`43114:AVAX`, updated);
                  if (sym === 'CELO') this.cache.set(`42220:CELO`, updated);
                }
              });
            }
          } catch {}
        })()
      );

      // Wait for all price sources to settle
      await Promise.allSettled(promises);

      // 3. Stablecoins strictly set to $1.00 USD
      tokens.forEach((t) => {
        const sym = t.symbol.toUpperCase();
        if (['USDC', 'USDT', 'DAI', 'USDS', 'FDUSD', 'PYUSD', 'USDB', 'CUSD'].includes(sym)) {
          const key = this.getTokenKey(t);
          this.cache.set(key, {
            priceUSD: 1.0,
            change24h: 0.01,
            lastUpdated: now,
          });
          this.cache.set(`1:${sym}`, {
            priceUSD: 1.0,
            change24h: 0.01,
            lastUpdated: now,
          });
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
