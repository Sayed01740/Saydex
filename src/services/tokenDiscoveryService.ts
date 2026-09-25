import { Token } from '../types';
import { getChainById } from '../config/chains';

const CHAIN_SLUG_TO_ID: Record<string, number> = {
  ethereum: 1,
  eth: 1,
  arbitrum: 42161,
  arbitrumone: 42161,
  base: 8453,
  optimism: 10,
  optimistic: 10,
  polygon: 137,
  matic: 137,
  bsc: 56,
  binance: 56,
  avalanche: 43114,
  avax: 43114,
  unichain: 1301,
};

const CHAIN_ID_TO_NAME: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  8453: 'Base',
  10: 'Optimism',
  137: 'Polygon',
  56: 'BNB Chain',
  43114: 'Avalanche',
  1301: 'Unichain',
};

class TokenDiscoveryService {
  private cache: Map<string, Token> = new Map();

  /**
   * Resolves any ERC-20 token by contract address across all networks.
   * Leverages DexScreener & DeFiLlama APIs with local caching.
   */
  public async resolveToken(
    contractAddress: string,
    preferredChainId?: number
  ): Promise<Token | null> {
    const cleanAddress = contractAddress.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(cleanAddress)) {
      return null;
    }

    const cacheKey = `${preferredChainId || 'all'}:${cleanAddress}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 1. Query DexScreener multi-chain token registry
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${cleanAddress}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.pairs && data.pairs.length > 0) {
          // Sort pairs: prioritize preferredChainId if provided, then by highest liquidity
          const pairs = [...data.pairs].sort((a, b) => {
            const aChain = CHAIN_SLUG_TO_ID[a.chainId?.toLowerCase()] || 0;
            const bChain = CHAIN_SLUG_TO_ID[b.chainId?.toLowerCase()] || 0;

            if (preferredChainId) {
              if (aChain === preferredChainId && bChain !== preferredChainId) return -1;
              if (bChain === preferredChainId && aChain !== preferredChainId) return 1;
            }

            const aLiq = a.liquidity?.usd || 0;
            const bLiq = b.liquidity?.usd || 0;
            return bLiq - aLiq;
          });

          const bestPair = pairs[0];
          const isBase = bestPair.baseToken?.address?.toLowerCase() === cleanAddress;
          const tokenMeta = isBase ? bestPair.baseToken : bestPair.quoteToken;

          if (tokenMeta && tokenMeta.symbol) {
            const resolvedChainId = CHAIN_SLUG_TO_ID[bestPair.chainId?.toLowerCase()] || preferredChainId || 1;
            const decimals = (tokenMeta.symbol.toUpperCase() === 'USDC' || tokenMeta.symbol.toUpperCase() === 'USDT') ? 6 : 18;

            const token: Token = {
              address: tokenMeta.address || contractAddress,
              chainId: resolvedChainId,
              symbol: tokenMeta.symbol.toUpperCase(),
              name: tokenMeta.name || tokenMeta.symbol,
              decimals,
              icon: bestPair.info?.imageUrl || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${contractAddress}/logo.png`,
              priceUSD: parseFloat(bestPair.priceUsd) || 0,
              change24h: parseFloat(bestPair.priceChange?.h24) || 0,
              volume24hUSD: bestPair.volume?.h24 || 0,
              isVerified: false,
              category: 'defi',
              tokenListSource: 'On-Chain Registry',
            };

            this.cache.set(cacheKey, token);
            return token;
          }
        }
      }
    } catch (err) {
      console.warn('[TokenDiscoveryService] DexScreener query error:', err);
    }

    // 2. Query DeFiLlama multi-chain token pricing endpoint as secondary resolver
    try {
      const prefixes = preferredChainId ? [preferredChainId] : [1, 8453, 42161, 10, 137, 56];
      const llamaIds = prefixes.map((cid) => {
        const slug = cid === 1 ? 'ethereum' : cid === 8453 ? 'base' : cid === 42161 ? 'arbitrum' : cid === 10 ? 'optimism' : cid === 137 ? 'polygon' : 'bsc';
        return `${slug}:${cleanAddress}`;
      });

      const llamaRes = await fetch(`https://coins.llama.fi/prices/current/${llamaIds.join(',')}`, {
        signal: AbortSignal.timeout(4000),
      });

      if (llamaRes.ok) {
        const llamaData = await llamaRes.json();
        const coins = llamaData.coins || {};

        for (const [coinKey, coinInfo] of Object.entries<any>(coins)) {
          if (coinInfo && coinInfo.symbol) {
            const chainPrefix = coinKey.split(':')[0];
            const resolvedChainId = CHAIN_SLUG_TO_ID[chainPrefix] || preferredChainId || 1;

            const token: Token = {
              address: contractAddress,
              chainId: resolvedChainId,
              symbol: coinInfo.symbol.toUpperCase(),
              name: coinInfo.symbol,
              decimals: coinInfo.decimals || 18,
              icon: '',
              priceUSD: coinInfo.price || 0,
              change24h: 0,
              volume24hUSD: 0,
              isVerified: false,
              category: 'defi',
              tokenListSource: 'DeFiLlama Registry',
            };

            this.cache.set(cacheKey, token);
            return token;
          }
        }
      }
    } catch (err) {
      console.warn('[TokenDiscoveryService] DeFiLlama fallback error:', err);
    }

    // 3. Fallback: Query direct on-chain RPC for ERC-20 metadata (symbol, name, decimals)
    // Critical for custom EVM chains, testnets, and newly deployed tokens
    if (preferredChainId) {
      try {
        const chain = getChainById(preferredChainId);
        const rpcUrl = chain?.rpcUrl;
        if (rpcUrl && rpcUrl.startsWith('http')) {
          const onChainToken = await this.queryOnChainErc20(cleanAddress, preferredChainId, rpcUrl);
          if (onChainToken) {
            this.cache.set(cacheKey, onChainToken);
            return onChainToken;
          }
        }
      } catch (err) {
        console.warn('[TokenDiscoveryService] Direct RPC ERC-20 query failed:', err);
      }
    }

    return null;
  }

  /**
   * Resolves ERC-20 token info directly via JSON-RPC eth_call (Uniswap style)
   */
  private async queryOnChainErc20(
    address: string,
    chainId: number,
    rpcUrl: string
  ): Promise<Token | null> {
    const decodeString = (hex?: string): string => {
      try {
        if (!hex || hex === '0x') return '';
        // If ABI encoded string: offset(32) + length(32) + bytes
        if (hex.length >= 130) {
          const len = parseInt(hex.slice(66, 130), 16);
          const strHex = hex.slice(130, 130 + len * 2);
          return (
            strHex
              .match(/.{1,2}/g)
              ?.map((byte) => String.fromCharCode(parseInt(byte, 16)))
              .join('')
              .replace(/\0/g, '')
              .trim() || ''
          );
        }
        // If bytes32 ASCII
        const clean = hex.replace(/^0x/, '');
        return (
          clean
            .match(/.{1,2}/g)
            ?.map((byte) => String.fromCharCode(parseInt(byte, 16)))
            .join('')
            .replace(/\0/g, '')
            .trim() || ''
        );
      } catch {
        return '';
      }
    };

    try {
      // JSON-RPC calls for symbol (0x95d89b41), name (0x06fdde03), decimals (0x313ce567)
      const [symRes, nameRes, decRes] = await Promise.all([
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [{ to: address, data: '0x95d89b41' }, 'latest'],
          }),
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => r.json())
          .catch(() => null),
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            method: 'eth_call',
            params: [{ to: address, data: '0x06fdde03' }, 'latest'],
          }),
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => r.json())
          .catch(() => null),
        fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            method: 'eth_call',
            params: [{ to: address, data: '0x313ce567' }, 'latest'],
          }),
          signal: AbortSignal.timeout(3500),
        })
          .then((r) => r.json())
          .catch(() => null),
      ]);

      const symbolHex = symRes?.result;
      if (!symbolHex || symbolHex === '0x') return null;

      const symbol = decodeString(symbolHex) || 'TOKEN';
      const name = decodeString(nameRes?.result) || symbol;
      let decimals = 18;
      if (decRes?.result && decRes.result !== '0x') {
        const parsed = parseInt(decRes.result, 16);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 36) {
          decimals = parsed;
        }
      }

      return {
        address,
        chainId,
        symbol: symbol.toUpperCase(),
        name,
        decimals,
        icon: '',
        priceUSD: 0,
        change24h: 0,
        volume24hUSD: 0,
        isVerified: false,
        category: 'defi',
        tokenListSource: 'On-Chain Custom RPC',
      };
    } catch {
      return null;
    }
  }

  public getChainName(chainId?: number): string {
    if (!chainId) return 'Unknown Chain';
    return CHAIN_ID_TO_NAME[chainId] || `Chain ${chainId}`;
  }
}

export const tokenDiscoveryService = new TokenDiscoveryService();
