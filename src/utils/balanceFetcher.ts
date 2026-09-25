import { Token, Chain } from '../types';
import { ALL_CHAINS, getAllChains, getChainById } from '../config/chains';
import { walletLogger } from './walletLogger';
import { rpcProviderWrapper, DEFAULT_NETWORK_RPCS } from './rpcProviderWrapper';

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

// Resilient public RPC endpoints per chain
export const CHAIN_RPC_FALLBACKS: Record<number, string[]> = DEFAULT_NETWORK_RPCS;

// Blocklist known restricted/paid/rate-limited RPC domains
const RESTRICTED_RPC_PATTERNS = ['drpc.org', 'drpc.io', 'infura.io/v3/YOUR', 'alchemy.com/v2/YOUR'];

/**
 * Filter out invalid, dead or paid-plan restricted RPC URLs
 */
export function sanitizeRpcUrlList(rpcUrls: string | string[]): string[] {
  const list = Array.isArray(rpcUrls) ? rpcUrls : [rpcUrls];
  return rpcProviderWrapper.sanitizeEndpoints(list);
}

/**
 * Fetch native balance for a specific address across a list of RPC endpoints with auto-failover
 */
export async function fetchNativeBalanceRpc(
  rpcUrls: string | string[],
  address: string,
  signal?: AbortSignal,
  chainId?: number
): Promise<number | null> {
  if (signal?.aborted) return null;
  const resolvedChainId = chainId || 1;
  const urlList = sanitizeRpcUrlList(rpcUrls);

  // Register endpoints with rpcProviderWrapper
  urlList.forEach((url) => rpcProviderWrapper.addBackupEndpoint(resolvedChainId, url));

  // Query via custom RPC wrapper with automatic failover
  return rpcProviderWrapper.getBalance(resolvedChainId, address, signal);
}

/**
 * Fetch ERC-20 token balance via standard `balanceOf(address)` RPC call with auto-failover
 */
export async function fetchTokenBalanceRpc(
  rpcUrls: string | string[],
  tokenAddress: string,
  walletAddress: string,
  decimals: number = 18,
  signal?: AbortSignal,
  chainId?: number
): Promise<number | null> {
  if (signal?.aborted) return null;
  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
    return fetchNativeBalanceRpc(rpcUrls, walletAddress, signal, chainId);
  }

  const resolvedChainId = chainId || 1;
  const urlList = sanitizeRpcUrlList(rpcUrls);
  urlList.forEach((url) => rpcProviderWrapper.addBackupEndpoint(resolvedChainId, url));

  // Query via custom RPC wrapper
  return rpcProviderWrapper.getTokenBalance(
    resolvedChainId,
    tokenAddress,
    walletAddress,
    decimals,
    signal
  );
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

  walletLogger.info('BALANCE_QUERY', `Initiating 100% on-chain balance query for ${cleanAddress.slice(0, 8)}...`, {
    activeChainId,
    walletProviderChainId,
    isLiveExtension,
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

  // Native price estimation map
  const nativePrices: Record<string, number> = {
    ETH: 3482.5,
    POL: 0.52,
    BNB: 645.0,
    AVAX: 34.8,
    SEP: 0.0,
  };

  const activeChains = getAllChains();

  // 1. Initialize summaries for each chain
  for (const chain of activeChains) {
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
  const chainBalancePromises = activeChains.map(async (chain) => {
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
      bal = await fetchNativeBalanceRpc(rpcEndpoints, cleanAddress, signal, chain.id);
    }

    // Default unresolved or null balance strictly to 0
    const finalBal = bal !== null && !isNaN(bal) ? bal : 0;
    const nativePrice = nativePrices[chain.nativeCurrency.symbol] || 3482.5;
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

    // If this is the active selected chain, also record as primary native balance
    if (chain.id === activeChainId) {
      tokenBalances['native'] = res;
      tokenBalances[chain.nativeCurrency.symbol.toUpperCase()] = res;
      tokenBalances[chain.nativeCurrency.symbol.toLowerCase()] = res;
    }
  });

  // 3. Process Token balances efficiently
  // Curated major token symbols to query actively on real chains
  const MAJOR_SYMBOLS = new Set(['USDC', 'USDT', 'WETH', 'WBTC', 'UNI', 'DAI', 'LINK', 'AAVE', 'AERO', 'ARB', 'OP', 'POL', 'BNB', 'AVAX', 'CAKE', 'DEGEN', 'SAYDEX']);

  // Query tokens belonging to the active chain
  const tokensToQuery = tokens.filter((t) => t.chainId === activeChainId);

  // Initialize all tokens in the directory with 0 balance
  tokens.forEach((token) => {
    const tokenKey = `${token.chainId}:${(token.address || token.symbol).toLowerCase()}`;
    const symbolKey = `${token.chainId}:${token.symbol.toUpperCase()}`;
    const defaultBal = 0;
    const usdVal = 0;

    const initRes: TokenBalanceResult = {
      key: tokenKey,
      symbol: token.symbol,
      chainId: token.chainId,
      balance: 0,
      balanceUSD: 0,
      formatted: '0.00',
    };
    tokenBalances[tokenKey] = initRes;
    tokenBalances[symbolKey] = initRes;
  });

  const processSingleToken = async (token: Token) => {
    if (signal?.aborted) return;
    const chain = getAllChains().find((c) => c.id === token.chainId) || ALL_CHAINS[0];
    const rpcEndpoints = [
      chain.rpcUrl,
      ...(chain.rpcUrls?.default?.http || []),
      ...(CHAIN_RPC_FALLBACKS[token.chainId] || []),
    ].filter((u, i, arr) => u && arr.indexOf(u) === i);

    let bal: number | null = null;

    // Native token representation
    if (!token.address || token.address === '0x0000000000000000000000000000000000000000') {
      bal = chainSummaries[token.chainId]?.nativeBalance ?? 0;
    } else {
      // Query token balance via injected provider first if on the same chain (10x faster, zero rate limits)
      if (isLiveExtension && typeof window !== 'undefined') {
        const eth = (window as any).ethereum;
        if (eth?.request && walletProviderChainId === token.chainId) {
          try {
            const cleanAddr = cleanAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
            const hex = await eth.request({
              method: 'eth_call',
              params: [{ to: token.address, data: `0x70a08231${cleanAddr}` }, 'latest'],
            });
            if (hex && hex !== '0x') {
              const rawBal = BigInt(hex);
              const divisor = 10 ** (token.decimals || 18);
              bal = Number(rawBal) / divisor;
            }
          } catch {
            // fallback to public rpc
          }
        }
      }

      if (bal === null) {
        bal = await fetchTokenBalanceRpc(rpcEndpoints, token.address, cleanAddress, token.decimals, signal, token.chainId);
      }
    }

    const safeBal = bal !== null && !isNaN(bal) ? bal : 0;
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

    // If this token belongs to the active selected chain, also index by bare symbol/address
    if (token.chainId === activeChainId) {
      tokenBalances[token.symbol.toUpperCase()] = res;
      tokenBalances[token.symbol.toLowerCase()] = res;
      if (token.address) {
        tokenBalances[token.address.toLowerCase()] = res;
      }
    }

    // Aggregate into chain summaries
    if (chainSummaries[token.chainId]) {
      if (token.address && token.address !== '0x0000000000000000000000000000000000000000') {
        chainSummaries[token.chainId].tokensUsdValue += usdVal;
        if (safeBal > 0) {
          chainSummaries[token.chainId].tokenCount += 1;
        }
      }
    }
  };

  // Wait for native balances first so native calculations are ready
  await Promise.allSettled(chainBalancePromises);

  // Run token balance queries in concurrent batches of 4
  const BATCH_SIZE = 4;
  for (let i = 0; i < tokensToQuery.length; i += BATCH_SIZE) {
    if (signal?.aborted) break;
    const batch = tokensToQuery.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(processSingleToken));
  }

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
