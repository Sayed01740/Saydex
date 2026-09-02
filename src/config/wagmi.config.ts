/// <reference types="vite/client" />
import { http, fallback, createConfig } from 'wagmi';
import {
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  avalanche,
  sepolia,
  unichain,
} from './chains';
import {
  injected,
  metaMask,
  walletConnect,
  coinbaseWallet,
} from 'wagmi/connectors';

// ─────────────────────────────────────────────────────────────────────────────
// RPC Blocklist
// ─────────────────────────────────────────────────────────────────────────────
const BLOCKED_RPC_PATTERNS = ['drpc.org', 'drpc.io'];

const CHAIN_FREE_RPC: Record<number, string> = {
  1:        'https://ethereum-rpc.publicnode.com',
  42161:    'https://arbitrum-one-rpc.publicnode.com',
  8453:     'https://base-rpc.publicnode.com',
  10:       'https://optimism-rpc.publicnode.com',
  137:      'https://polygon-bor-rpc.publicnode.com',
  56:       'https://bsc-rpc.publicnode.com',
  43114:    'https://avalanche-c-chain-rpc.publicnode.com',
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com',
  130:      'https://unichain-rpc.publicnode.com',
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Global fetch interceptor — safety net for any direct HTTP RPC calls
// ─────────────────────────────────────────────────────────────────────────────
if (typeof globalThis !== 'undefined') {
  const _origFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (BLOCKED_RPC_PATTERNS.some((p) => url.includes(p))) {
      let chainId: number | null = null;
      if (init?.body && typeof init.body === 'string') {
        try {
          const parsed = JSON.parse(init.body);
          if (typeof parsed.chainId === 'number') chainId = parsed.chainId;
        } catch { /* ignore */ }
      }
      if (chainId === null) {
        const host = (() => { try { return new URL(url).hostname; } catch { return url.toLowerCase(); } })();
        const combined = host + url.toLowerCase();
        if (combined.includes('sepolia'))                             chainId = 11155111;
        else if (combined.includes('unichain'))                       chainId = 130;
        else if (combined.includes('arbitrum') || combined.includes('-arb')) chainId = 42161;
        else if (combined.includes('base'))                           chainId = 8453;
        else if (combined.includes('optimism') || combined.includes('-op-')) chainId = 10;
        else if (combined.includes('polygon') || combined.includes('-matic')) chainId = 137;
        else if (combined.includes('bsc') || combined.includes('binance')) chainId = 56;
        else if (combined.includes('avalanche') || combined.includes('avax')) chainId = 43114;
        else if (combined.includes('ethereum') || combined.includes('/eth')) chainId = 1;
      }

      const replacement = CHAIN_FREE_RPC[chainId!] ?? CHAIN_FREE_RPC[1];
      const rewritten = url.replace(/https?:\/\/[^/]+/, replacement);
      console.warn(`[RPC-INTERCEPT] Blocked ${url} (chain=${chainId}) → ${rewritten}`);

      if (typeof input === 'string') {
        input = rewritten;
      } else if (input instanceof URL) {
        input = new URL(rewritten);
      } else {
        input = new Request(rewritten, input);
      }
    }

    return _origFetch(input, init);
  };

  if (typeof window !== 'undefined') {
    window.fetch = globalThis.fetch;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Wallet provider interceptor
//    When MetaMask is connected, wagmi routes RPC calls through the wallet
//    provider (window.ethereum). The wallet uses its OWN RPC endpoint for
//    each chain — often drpc.org on free tier — bypassing our fetch interceptor
//    and transport config entirely. This interceptor catches wallet RPC errors
//    caused by paid-tier RPC failures and silences them (React Query retries
//    will use our transport config instead).
// ─────────────────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined' && (window as any).ethereum) {
  const eth = (window as any).ethereum;

  if (typeof eth.request === 'function') {
    const _origRequest = eth.request.bind(eth);
    eth.request = async function (args: { method: string; params?: any[] }) {
      try {
        return await _origRequest(args);
      } catch (err: any) {
        const msg = String(err?.message ?? err ?? '');
        // If the wallet's RPC fails with a paid-tier error, log and re-throw.
        // React Query will retry via our transport config (publicnode.com).
        if (BLOCKED_RPC_PATTERNS.some((p) => msg.includes(p))) {
          console.warn(
            `[WALLET-RPC] Wallet provider RPC failed (${msg.slice(0, 80)}). ` +
            `React Query will retry via safe transport.`
          );
          // Re-throw so wagmi knows the wallet RPC failed and falls back
          throw err;
        }
        throw err;
      }
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Wagmi Configuration
// ─────────────────────────────────────────────────────────────────────────────
const rawProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const projectId =
  rawProjectId &&
  rawProjectId !== 'YOUR_WALLETCONNECT_PROJECT_ID' &&
  rawProjectId.trim().length > 5
    ? rawProjectId.trim()
    : '';

/**
 * Rewrite a chain's rpcUrls to use ONLY our safe free endpoints.
 * Prevents viem's internal chain registry from providing paid RPC URLs.
 */
function safeChain(original: any, safeRpcUrl: string) {
  return {
    ...original,
    rpcUrls: {
      default: { http: [safeRpcUrl] },
      public: { http: [safeRpcUrl] },
    },
  };
}

/**
 * Create an http() transport that always delegates to our intercepted fetch.
 */
function safeHttp(url: string) {
  return http(url, {
    fetchFn: (input: string | URL | Request, init?: RequestInit) =>
      globalThis.fetch(input, init),
  });
}

export const wagmiConfig = createConfig({
  chains: [
    safeChain(mainnet, CHAIN_FREE_RPC[1]),
    safeChain(base, CHAIN_FREE_RPC[8453]),
    safeChain(optimism, CHAIN_FREE_RPC[10]),
    safeChain(arbitrum, CHAIN_FREE_RPC[42161]),
    safeChain(polygon, CHAIN_FREE_RPC[137]),
    safeChain(avalanche, CHAIN_FREE_RPC[43114]),
    safeChain(sepolia, CHAIN_FREE_RPC[11155111]),
    safeChain(unichain, CHAIN_FREE_RPC[130]),
  ],
  connectors: [
    injected(),
    metaMask(),
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: 'Axiom Protocol',
              description: 'Advanced DeFi Terminal',
              url: typeof window !== 'undefined' ? window.location.origin : 'https://axiom.finance',
              icons: ['https://axiom.finance/logo.png'],
            },
            showQrModal: true,
          }),
        ]
      : []),
    coinbaseWallet({ appName: 'Axiom Protocol' }),
  ],
  transports: {
    [mainnet.id]: fallback([
      safeHttp('https://ethereum-rpc.publicnode.com'),
      safeHttp('https://eth.llamarpc.com'),
      safeHttp('https://cloudflare-eth.com'),
    ]),
    [base.id]: fallback([
      safeHttp('https://base-rpc.publicnode.com'),
      safeHttp('https://mainnet.base.org'),
      safeHttp('https://base.llamarpc.com'),
    ]),
    [optimism.id]: fallback([
      safeHttp('https://optimism-rpc.publicnode.com'),
      safeHttp('https://mainnet.optimism.io'),
      safeHttp('https://optimism.llamarpc.com'),
    ]),
    [arbitrum.id]: fallback([
      safeHttp('https://arbitrum-one-rpc.publicnode.com'),
      safeHttp('https://arb1.arbitrum.io/rpc'),
      safeHttp('https://arbitrum.llamarpc.com'),
    ]),
    [polygon.id]: fallback([
      safeHttp('https://polygon-bor-rpc.publicnode.com'),
      safeHttp('https://polygon-rpc.com'),
      safeHttp('https://polygon.llamarpc.com'),
    ]),
    [avalanche.id]: fallback([
      safeHttp('https://avalanche-c-chain-rpc.publicnode.com'),
      safeHttp('https://api.avax.network/ext/bc/C/rpc'),
      safeHttp('https://rpc.ankr.com/avalanche'),
    ]),
    [sepolia.id]: fallback([
      safeHttp('https://ethereum-sepolia-rpc.publicnode.com'),
      safeHttp('https://sepolia.gateway.tenderly.co'),
    ]),
    [unichain.id]: fallback([
      safeHttp('https://unichain-rpc.publicnode.com'),
      safeHttp('https://mainnet.unichain.org'),
    ]),
  },
});
