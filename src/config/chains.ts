import { Chain } from '../types';

/**
 * Viem-compatible defineChain helper for custom and standard chains
 */
export function defineChain<const chain extends Chain>(chain: chain): chain {
  return {
    ...chain,
    rpcUrls: chain.rpcUrls || {
      default: { http: [chain.rpcUrl] },
      public: { http: [chain.rpcUrl] },
    },
    blockExplorers: chain.blockExplorers || {
      default: { name: `${chain.shortName}Scan`, url: chain.blockExplorerUrl },
    },
  };
}

export const mainnet = defineChain({
  id: 1,
  name: 'Ethereum Mainnet',
  shortName: 'Ethereum',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://eth.llamarpc.com',
  rpcUrls: {
    default: { http: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'] },
    public: { http: ['https://eth.llamarpc.com'] },
  },
  blockExplorerUrl: 'https://etherscan.io',
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
  contracts: {
    ensRegistry: {
      address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    },
    ensUniversalResolver: {
      address: '0xE4Acdd618deED4e6d2f03b9bf62dc6118FC9A4da',
      blockCreated: 16773775,
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 14353601,
    },
  },
  gasPriceGwei: 14.2,
  isSupported: true,
  testnet: false,
});

export const arbitrum = defineChain({
  id: 42161,
  name: 'Arbitrum One',
  shortName: 'Arbitrum',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  rpcUrls: {
    default: { http: ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum'] },
    public: { http: ['https://arb1.arbitrum.io/rpc'] },
  },
  blockExplorerUrl: 'https://arbiscan.io',
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 7654707,
    },
  },
  gasPriceGwei: 0.1,
  isSupported: true,
  testnet: false,
  sourceId: 1,
});

export const base = defineChain({
  id: 8453,
  name: 'Base',
  shortName: 'Base',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://mainnet.base.org',
  rpcUrls: {
    default: { http: ['https://mainnet.base.org', 'https://base.llamarpc.com'] },
    public: { http: ['https://mainnet.base.org'] },
  },
  blockExplorerUrl: 'https://basescan.org',
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 5022,
    },
  },
  gasPriceGwei: 0.05,
  isSupported: true,
  testnet: false,
  sourceId: 1,
});

export const optimism = defineChain({
  id: 10,
  name: 'OP Mainnet',
  shortName: 'Optimism',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://mainnet.optimism.io',
  rpcUrls: {
    default: { http: ['https://mainnet.optimism.io', 'https://optimism.llamarpc.com'] },
    public: { http: ['https://mainnet.optimism.io'] },
  },
  blockExplorerUrl: 'https://optimistic.etherscan.io',
  blockExplorers: {
    default: { name: 'OP Etherscan', url: 'https://optimistic.etherscan.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 4286263,
    },
  },
  gasPriceGwei: 0.08,
  isSupported: true,
  testnet: false,
  sourceId: 1,
});

export const polygon = defineChain({
  id: 137,
  name: 'Polygon PoS',
  shortName: 'Polygon',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  nativeCurrency: { name: 'Polygon Ecosystem Token', symbol: 'POL', decimals: 18 },
  rpcUrl: 'https://polygon-rpc.com',
  rpcUrls: {
    default: { http: ['https://polygon-rpc.com', 'https://polygon.llamarpc.com'] },
    public: { http: ['https://polygon-rpc.com'] },
  },
  blockExplorerUrl: 'https://polygonscan.com',
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 25770160,
    },
  },
  gasPriceGwei: 28.5,
  isSupported: true,
  testnet: false,
});

export const avalanche = defineChain({
  id: 43114,
  name: 'Avalanche C-Chain',
  shortName: 'Avalanche',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  rpcUrls: {
    default: { http: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche.public-rpc.com'] },
    public: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
  },
  blockExplorerUrl: 'https://snowtrace.io',
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 11907934,
    },
  },
  gasPriceGwei: 25.0,
  isSupported: true,
  testnet: false,
});

export const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia Testnet',
  shortName: 'Sepolia',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  rpcUrls: {
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.ankr.com/eth_sepolia', 'https://sepolia.gateway.tenderly.co'] },
    public: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  blockExplorers: {
    default: { name: 'Sepolia Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 751532,
    },
  },
  gasPriceGwei: 1.2,
  isSupported: true,
  testnet: true,
});

export const unichain = defineChain({
  id: 130,
  name: 'Unichain',
  shortName: 'Unichain',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://mainnet.unichain.org',
  rpcUrls: {
    default: { http: ['https://mainnet.unichain.org', 'https://unichain-rpc.publicnode.com'] },
    public: { http: ['https://mainnet.unichain.org'] },
  },
  blockExplorerUrl: 'https://unichain.blockscout.com',
  blockExplorers: {
    default: { name: 'Unichain Explorer', url: 'https://unichain.blockscout.com' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
    },
  },
  gasPriceGwei: 0.01,
  isSupported: true,
  testnet: false,
  sourceId: 1,
});

export const ALL_CHAINS: Chain[] = [
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  avalanche,
  sepolia,
  unichain,
];

/**
 * Look up a chain by numeric chainId.
 * Returns a safe fallback (mainnet) if the chain is unknown —
 * but logs a warning so callers know something is misconfigured.
 */
export function getChainById(chainId: number): Chain {
  const found = ALL_CHAINS.find((c) => c.id === chainId);
  if (!found) {
    console.warn(`[CHAIN] getChainById: unknown chainId ${chainId}, falling back to mainnet. Add this chain to ALL_CHAINS to fix.`);
    return mainnet;
  }
  return found;
}

/**
 * Build a block-explorer transaction URL for any supported chain.
 * Uses chain registry data — never hardcoded.
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = getChainById(chainId);
  const base = chain.blockExplorerUrl.replace(/\/$/, '');
  return `${base}/tx/${txHash}`;
}

/**
 * Build a block-explorer address URL for any supported chain.
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const chain = getChainById(chainId);
  const base = chain.blockExplorerUrl.replace(/\/$/, '');
  return `${base}/address/${address}`;
}

/**
 * Get the native currency symbol for a chain.
 */
export function getChainNativeSymbol(chainId: number): string {
  return getChainById(chainId).nativeCurrency.symbol;
}

/**
 * Determine whether a chain is a testnet.
 */
export function isTestnet(chainId: number): boolean {
  return getChainById(chainId).testnet === true;
}

/**
 * USDC contract addresses per chain.
 * Used by WalletContext to query the correct USDC balance per connected chain.
 */
export const USDC_ADDRESSES: Partial<Record<number, `0x${string}`>> = {
  1:       '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
  42161:   '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One
  8453:    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  10:      '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
  137:     '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Polygon PoS (native USDC)
  43114:   '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Avalanche C-Chain
  11155111:'0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia (Chainlink test USDC, 6 decimals)
};

/**
 * Canonical native token prices (USD) — single source of truth.
 * Replace with a live price oracle (e.g. CoinGecko, Chainlink) in production.
 */
export const NATIVE_TOKEN_PRICES_USD: Record<string, number> = {
  ETH: 3482.50,
  POL: 0.52,
  BNB: 645.0,
  AVAX: 34.80,
  SEP: 0.0,
};

/**
 * Canonical Uniswap contract addresses (single source of truth).
 * The Universal Router v2 address is the canonical deployment used across all integrations.
 */
export const PROTOCOL_CONTRACTS = {
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as `0x${string}`,
};

/**
 * Per-chain Universal Router deployment addresses.
 * Falls back to Ethereum mainnet if chain is unknown.
 */
export const UNIVERSAL_ROUTER_ADDRESSES: Record<number, `0x${string}`> = {
  1:       '0x66a9893cC07D91D95644AEDD05d03f95e1dBA8Af', // Ethereum
  42161:   '0x4C60051384bd2d3C01bfc845Cf5F4b44bcbE9de5', // Arbitrum
  8453:    '0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC', // Base
  10:      '0xb555edF5dcF85f42cEd1F07E5DEa2B043726f781', // Optimism
  137:     '0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2', // Polygon
  43114:   '0x66a9893cC07D91D95644AEDD05d03f95e1dBA8Af', // Avalanche (uses mainnet-equivalent)
  11155111:'0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b', // Sepolia
};

/**
 * Per-chain Quoter V2 addresses.
 * Falls back to Ethereum mainnet quoter if chain is unknown.
 */
export const QUOTER_V2_ADDRESSES: Record<number, `0x${string}`> = {
  1:       '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // Ethereum
  42161:   '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // Arbitrum
  8453:    '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // Base
  10:      '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // Optimism
  137:     '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // Polygon
  43114:   '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // Avalanche
  11155111:'0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3', // Sepolia
};

/**
 * Get the Universal Router address for a specific chain.
 */
export function getUniversalRouterAddress(chainId: number): `0x${string}` {
  return UNIVERSAL_ROUTER_ADDRESSES[chainId] ?? UNIVERSAL_ROUTER_ADDRESSES[1];
}

/**
 * Get the Quoter V2 address for a specific chain.
 */
export function getQuoterV2Address(chainId: number): `0x${string}` {
  return QUOTER_V2_ADDRESSES[chainId] ?? QUOTER_V2_ADDRESSES[1];
}

