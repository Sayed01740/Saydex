import { Token, Chain } from '../types';
import { ALL_CHAINS, getChainById, NATIVE_TOKEN_PRICES_USD } from '../config/chains';
import { walletLogger } from './walletLogger';

export interface ChainBalanceSummary {
  chainId: number;
  chainName: string;
  nativeSymbol: string;
  nativeBalance: number;
  nativeUsdValue: number;
  tokensUsdValue: number;
  totalUsdValue: number;
  tokenCount: number;
}

export interface TokenBalanceResult {
  key: string;
  symbol: string;
  chainId: number;
  balance: number;
  balanceUSD: number;
  formatted: string;
}

// Known simulated preset addresses
const DEMO_PRESET_ADDRESSES = new Set([
  '0x38D6F3921B5D343b67Ce847c2F1e5D6bE4929810'.toLowerCase(),
  '0x71C25e378A9C1284b3e8eD063A4a8996bDf6631E'.toLowerCase(),
  '0x92AE1a40398F657519bCe1953fC1f3A8849fFa97'.toLowerCase(),
  '0x5B4136C70d0E2903820FcaFdDF56Bcf800F174B8'.toLowerCase(),
  '0x44Fe853A4753551528Ec96C72b78f441C2A5f448'.toLowerCase(),
  '0x1943A45C3358055610214Ddb2aD348E0D7101502'.toLowerCase(),
  '0xA82F72e9D349581A7b91d46c82dB49eC91D4B892'.toLowerCase(),
]);

// Resilient public RPC endpoints per chain with CORS support
export const CHAIN_RPC_FALLBACKS: Record<number, string[]> = {
  1: [
    'https://cloudflare-eth.com',
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
  ],
  42161: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arbitrum.llamarpc.com',
    'https://rpc.ankr.com/arbitrum',
  ],
  8453: [
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
    'https://base.llamarpc.com',
    'https://1rpc.io/base',
  ],
  10: [
    'https://mainnet.optimism.io',
    'https://optimism-rpc.publicnode.com',
    'https://optimism.llamarpc.com',
    'https://rpc.ankr.com/optimism',
  ],
  137: [
    'https://polygon-rpc.com',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.llamarpc.com',
    'https://rpc.ankr.com/polygon',
  ],
  56: [
    'https://binance.llamarpc.com',
    'https://bsc-rpc.publicnode.com',
    'https://bsc-dataseed.binance.org',
    'https://rpc.ankr.com/bsc',
  ],
  43114: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://rpc.ankr.com/avalanche',
  ],
  11155111: [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.gateway.tenderly.co',
  ],
  130: [
    'https://mainnet.unichain.org',
    'https://unichain-rpc.publicnode.com',
  ],
};

// Fallback balance templates ONLY for simulated demo profiles
export const PRESET_CHAIN_BALANCES: Record<string, Record<number, { native: number; tokens: Record<string, number> }>> = {
  default: {
    1: { native: 4.825, tokens: { USDC: 14850.2, USDT: 2400.0, WBTC: 0.42, UNI: 350.0, DAI: 500.0, AXIOM: 12500.0 } },
    42161: { native: 2.15, tokens: { ARB: 3400.0, USDC: 4200.0, WETH: 1.8 } },
    8453: { native: 1.45, tokens: { USDC: 3100.0, AERO: 1850.0, DEGEN: 45000.0 } },
    10: { native: 0.85, tokens: { OP: 800.0, USDC: 1500.0 } },
    137: { native: 1850.0, tokens: { POL: 1500.0, USDC: 2200.0 } },
    56: { native: 3.5, tokens: { BNB: 3.5, CAKE: 450.0, BUSD: 1200.0 } },
    43114: { native: 45.2, tokens: { AVAX: 45.2, USDC: 1800.0 } },
    11155111: { native: 10.5, tokens: { SEP: 10.5, UNI: 100.0 } },
    130: { native: 1.2, tokens: { UNI: 50.0, USDC: 1000.0 } },
  },
};

// Blocklist known restricted/paid/rate-limited RPC domains
const RESTRICTED_RPC_PATTERNS = ['drpc.org', 'drpc.io', 'infura.io/v3/YOUR', 'alchemy.com/v2/YOUR'];

/**
 * Filter out invalid, dead or paid-plan restricted RPC URLs
 */
export function sanitizeRpcUrlList(rpcUrls: string | string[]): string[] {
  const list = Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls];
  const valid = list.filter((url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
    const lower = url.toLowerCase();
    return !RESTRICTED_RPC_PATTERNS.some((pattern) => lower.includes(pattern));
  });
  return valid.length > 0 ? Array.from(new Set(valid)) : list;
}

/**
 * Fetch native balance for a specific address across a list of RPC endpoints
 */
export async function fetchNativeBalanceRpc(
  rpcUrls: string | string[],
  address: string,
  signal?: AbortSignal
): Promise<number | null> {
  const urlList = sanitizeRpcUrlList(rpcUrls);

  for (const url of urlList) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Link external abort signal if provided
      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'eth_getBalance',
          params: [address, 'latest'],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      if (data.error) {
        // e.g. paid tier error, rate limit, or invalid response
        continue;
      }

      if (data.result !== undefined && data.result !== null) {
        const hex = data.result;
        const wei = BigInt(hex);
        const eth = Number(wei) / 1e18;
        return isNaN(eth) ? 0 : parseFloat(eth.toFixed(6));
      }
    } catch {
      // try next fallback RPC
    }
  }

  return null;
}

/**
 * Fetch ERC-20 token balance via standard `balanceOf(address)` RPC call
 */
export async function fetchTokenBalanceRpc(
  rpcUrls: string | string[],
  tokenAddress: string,
  walletAddress: string,
  decimals: number = 18,
  signal?: AbortSignal
): Promise<number | null> {
  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
    return fetchNativeBalanceRpc(rpcUrls, walletAddress, signal);
  }

  const urlList = sanitizeRpcUrlList(rpcUrls);
  const cleanAddr = walletAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const callData = `0x70a08231${cleanAddr}`;

  for (const url of urlList) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'eth_call',
          params: [
            {
              to: tokenAddress,
              data: callData,
            },
            'latest',
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      if (data.error) {
        continue;
      }

      if (data.result && data.result !== '0x') {
        const rawBal = BigInt(data.result);
        const divisor = 10 ** decimals;
        const parsed = Number(rawBal) / divisor;
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch {
      // try next fallback RPC
    }
  }

  return null;
}

/**
 * Multi-Chain Balance Aggregator:
 * Validates selected chain against connected wallet provider before querying,
 * avoiding chain mismatch inaccuracy and querying authoritative RPCs.
 */
export async function fetchAllMultiChainBalances(
  address: string,
  tokens: Token[],
  activeChainId: number,
  isLiveExtension: boolean,
  walletProviderChainId: number | null = null,
  signal?: AbortSignal
): Promise<{
  tokenBalances: Record<string, TokenBalanceResult>;
  chainSummaries: Record<number, ChainBalanceSummary>;
  totalPortfolioUSD: number;
}> {
  const tokenBalances: Record<string, TokenBalanceResult> = {};
  const chainSummaries: Record<number, ChainBalanceSummary> = {};

  const cleanAddress = address.trim();
  const isDemo = !isLiveExtension && DEMO_PRESET_ADDRESSES.has(cleanAddress.toLowerCase());

  walletLogger.info('BALANCE_QUERY', `Initiating multi-chain balance query for ${cleanAddress.slice(0, 8)}...`, {
    activeChainId,
    walletProviderChainId,
    isLiveExtension,
    isDemo,
  });

  // Validate chain alignment with provider
  if (isLiveExtension && walletProviderChainId !== null) {
    if (walletProviderChainId === activeChainId) {
      walletLogger.info(
        'CHAIN_VALIDATION',
        `Chain synchronization confirmed: Active UI Chain (${activeChainId}) matches Connected Wallet Provider Chain (${walletProviderChainId}).`
      );
    } else {
      walletLogger.info(
        'CHAIN_VALIDATION',
        `Cross-Chain Query: UI viewing Chain ${activeChainId} (${getChainById(activeChainId).name}) while Wallet Provider is connected to Chain ${walletProviderChainId}. Querying authoritative public RPC for Chain ${activeChainId} with complete multi-chain data isolation.`,
        { activeChainId, walletProviderChainId }
      );
    }
  }

  // Use centralized native token prices from config
  const nativePrices = NATIVE_TOKEN_PRICES_USD;

  // 1. Initialize summaries for each chain
  for (const chain of ALL_CHAINS) {
    chainSummaries[chain.id] = {
      chainId: chain.id,
      chainName: chain.name,
      nativeSymbol: chain.nativeCurrency.symbol,
      nativeBalance: 0,
      nativeUsdValue: 0,
      tokensUsdValue: 0,
      totalUsdValue: 0,
      tokenCount: 0,
    };
  }

  // 2. Fetch native balances in parallel
  const chainBalancePromises = ALL_CHAINS.map(async (chain) => {
    let bal: number | null = null;
    const rpcEndpoints = [
      chain.rpcUrl,
      ...(chain.rpcUrls?.default?.http || []),
      ...(CHAIN_RPC_FALLBACKS[chain.id] || []),
    ].filter((u, i, arr) => u && arr.indexOf(u) === i);

    // If browser ethereum extension is available, ONLY query provider if chain matches walletProviderChainId
    if (typeof window !== 'undefined' && isLiveExtension) {
      const eth = (window as any).ethereum;
      if (eth?.request && walletProviderChainId === chain.id) {
        try {
          const hex = await eth.request({ method: 'eth_getBalance', params: [cleanAddress, 'latest'] });
          if (hex) {
            const wei = BigInt(hex);
            bal = Number(wei) / 1e18;
            walletLogger.debug(
              'RPC_DISPATCH',
              `Fetched live native balance from wallet provider on Chain ${chain.id}: ${bal} ${chain.nativeCurrency.symbol}`
            );
          }
        } catch (err) {
          walletLogger.debug('RPC_DISPATCH', `Provider getBalance failed for Chain ${chain.id}, falling back to public RPC.`);
        }
      }
    }

    // If not fetched via injected provider or provider chain was different, query resilient public RPCs
    if (bal === null) {
      bal = await fetchNativeBalanceRpc(rpcEndpoints, cleanAddress, signal);
    }

    // If simulated demo profile and offline/unreachable, fallback to preset
    if (bal === null && isDemo) {
      const fallbackData = PRESET_CHAIN_BALANCES.default[chain.id];
      bal = fallbackData ? fallbackData.native : 0;
    }

    // For real wallets, default unresolved balance to 0, not mock data
    const finalBal = bal !== null && !isNaN(bal) ? bal : 0;
    const nativePrice = nativePrices[chain.nativeCurrency.symbol] ?? NATIVE_TOKEN_PRICES_USD.ETH;
    const usdVal = finalBal * nativePrice;

    chainSummaries[chain.id].nativeBalance = finalBal;
    chainSummaries[chain.id].nativeUsdValue = usdVal;

    // Record in token balances map
    const nativeKey = `${chain.id}:native`;
    const nativeSymbolKey = `${chain.id}:${chain.nativeCurrency.symbol.toUpperCase()}`;
    const res: TokenBalanceResult = {
      key: nativeKey,
      symbol: chain.nativeCurrency.symbol,
      chainId: chain.id,
      balance: finalBal,
      balanceUSD: usdVal,
      formatted: finalBal > 0
        ? (finalBal < 0.0001 ? finalBal.toFixed(6) : finalBal.toLocaleString(undefined, { maximumFractionDigits: 4 }))
        : '0.00',
    };

    tokenBalances[nativeKey] = res;
    tokenBalances[nativeSymbolKey] = res;
  });

  // 3. Process Token balances
  const tokenPromises = tokens.map(async (token) => {
    const chain = ALL_CHAINS.find((c) => c.id === token.chainId) || ALL_CHAINS[0];
    const rpcEndpoints = [
      chain.rpcUrl,
      ...(chain.rpcUrls?.default?.http || []),
      ...(CHAIN_RPC_FALLBACKS[token.chainId] || []),
    ].filter((u, i, arr) => u && arr.indexOf(u) === i);

    let bal: number | null = null;

    // Native token representation
    if (!token.address || token.address === '0x0000000000000000000000000000000000000000') {
      bal = chainSummaries[token.chainId]?.nativeBalance ?? (isDemo ? (token.balance || 0) : 0);
    } else {
      // Query token balance via authoritative RPCs for the token's chainId
      bal = await fetchTokenBalanceRpc(rpcEndpoints, token.address, cleanAddress, token.decimals, signal);
      
      if (bal === null && isDemo) {
        // Fallback to preset token balance ONLY for demo accounts
        const fallbackTokens = PRESET_CHAIN_BALANCES.default[token.chainId]?.tokens;
        if (fallbackTokens && fallbackTokens[token.symbol] !== undefined) {
          bal = fallbackTokens[token.symbol];
        } else {
          bal = token.balance ?? 0;
        }
      }
    }

    const safeBal = bal !== null && !isNaN(bal) ? bal : (isDemo ? (token.balance ?? 0) : 0);
    const usdVal = safeBal * (token.priceUSD || 1);

    const tokenKey = `${token.chainId}:${(token.address || token.symbol).toLowerCase()}`;
    const symbolKey = `${token.chainId}:${token.symbol.toUpperCase()}`;

    const res: TokenBalanceResult = {
      key: tokenKey,
      symbol: token.symbol,
      chainId: token.chainId,
      balance: safeBal,
      balanceUSD: usdVal,
      formatted: safeBal > 0
        ? (safeBal < 0.001 ? safeBal.toFixed(6) : safeBal.toLocaleString(undefined, { maximumFractionDigits: 4 }))
        : '0.00',
    };

    tokenBalances[tokenKey] = res;
    tokenBalances[symbolKey] = res;

    // Aggregate into chain summaries
    if (chainSummaries[token.chainId]) {
      if (token.address && token.address !== '0x0000000000000000000000000000000000000000') {
        chainSummaries[token.chainId].tokensUsdValue += usdVal;
        if (safeBal > 0) {
          chainSummaries[token.chainId].tokenCount += 1;
        }
      }
    }
  });

  await Promise.allSettled([...chainBalancePromises, ...tokenPromises]);

  // Compute grand total
  let totalPortfolioUSD = 0;
  for (const cid in chainSummaries) {
    const summary = chainSummaries[cid];
    summary.totalUsdValue = summary.nativeUsdValue + summary.tokensUsdValue;
    totalPortfolioUSD += summary.totalUsdValue;
  }

  walletLogger.info(
    'BALANCE_QUERY',
    `Multi-chain balance fetch complete. Total Portfolio Value: $${totalPortfolioUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );

  return {
    tokenBalances,
    chainSummaries,
    totalPortfolioUSD,
  };
}
