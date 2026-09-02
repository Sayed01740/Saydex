import { Chain } from '../types';

// Alchemy API Key from environment (.env)
const ALCHEMY_KEY = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ALCHEMY_API_KEY) || '';

export function getAlchemyRpc(networkSubdomain: string): string | null {
  if (!ALCHEMY_KEY || ALCHEMY_KEY === 'your_alchemy_key_here') return null;
  return `https://${networkSubdomain}.g.alchemy.com/v2/${ALCHEMY_KEY}`;
}

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
  rpcUrl: 'https://cloudflare-eth.com',
  rpcUrls: {
    default: {
      http: [
        'https://cloudflare-eth.com',
        'https://eth.llamarpc.com',
        'https://ethereum-rpc.publicnode.com',
        'https://rpc.ankr.com/eth',
        'https://1rpc.io/eth',
      ],
    },
    public: {
      http: [
        'https://cloudflare-eth.com',
        'https://eth.llamarpc.com',
        'https://ethereum-rpc.publicnode.com',
      ],
    },
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
    default: {
      http: [
        'https://arb1.arbitrum.io/rpc',
        'https://arbitrum-one-rpc.publicnode.com',
        'https://rpc.ankr.com/arbitrum',
        'https://1rpc.io/arb',
      ],
    },
    public: {
      http: [
        'https://arb1.arbitrum.io/rpc',
        'https://arbitrum-one-rpc.publicnode.com',
      ],
    },
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
    default: {
      http: [
        'https://mainnet.base.org',
        'https://base-rpc.publicnode.com',
        'https://base.llamarpc.com',
        'https://1rpc.io/base',
      ],
    },
    public: {
      http: [
        'https://mainnet.base.org',
        'https://base-rpc.publicnode.com',
      ],
    },
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
    default: {
      http: [
        'https://mainnet.optimism.io',
        'https://optimism-rpc.publicnode.com',
        'https://optimism.llamarpc.com',
        'https://1rpc.io/op',
      ],
    },
    public: {
      http: [
        'https://mainnet.optimism.io',
        'https://optimism-rpc.publicnode.com',
      ],
    },
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
    default: {
      http: [
        'https://polygon-rpc.com',
        'https://polygon-bor-rpc.publicnode.com',
        'https://polygon.llamarpc.com',
        'https://1rpc.io/matic',
      ],
    },
    public: {
      http: [
        'https://polygon-rpc.com',
        'https://polygon-bor-rpc.publicnode.com',
      ],
    },
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
    default: {
      http: [
        'https://api.avax.network/ext/bc/C/rpc',
        'https://avalanche-c-chain-rpc.publicnode.com',
        'https://1rpc.io/avax/c',
      ],
    },
    public: {
      http: [
        'https://api.avax.network/ext/bc/C/rpc',
        'https://avalanche-c-chain-rpc.publicnode.com',
      ],
    },
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
  name: 'Ethereum Sepolia',
  shortName: 'Sepolia',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: getAlchemyRpc('eth-sepolia') || 'https://rpc.sepolia.org',
  rpcUrls: {
    default: {
      http: [
        ...(getAlchemyRpc('eth-sepolia') ? [getAlchemyRpc('eth-sepolia')!] : []),
        'https://rpc.sepolia.org',
        'https://ethereum-sepolia-rpc.publicnode.com',
        'https://rpc2.sepolia.org',
        'https://1rpc.io/sepolia',
      ],
    },
    public: {
      http: [
        'https://rpc.sepolia.org',
        'https://ethereum-sepolia-rpc.publicnode.com',
      ],
    },
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

export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  shortName: 'Base Sepolia',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
  nativeCurrency: { name: 'Base Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: getAlchemyRpc('base-sepolia') || 'https://sepolia.base.org',
  rpcUrls: {
    default: {
      http: [
        ...(getAlchemyRpc('base-sepolia') ? [getAlchemyRpc('base-sepolia')!] : []),
        'https://sepolia.base.org',
        'https://base-sepolia-rpc.publicnode.com',
        'https://1rpc.io/base-sepolia',
      ],
    },
    public: {
      http: [
        'https://sepolia.base.org',
        'https://base-sepolia-rpc.publicnode.com',
      ],
    },
  },
  blockExplorerUrl: 'https://sepolia.basescan.org',
  blockExplorers: {
    default: { name: 'BaseScan Sepolia', url: 'https://sepolia.basescan.org' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1059647,
    },
  },
  gasPriceGwei: 0.1,
  isSupported: true,
  testnet: true,
});

export const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  shortName: 'Arb Sepolia',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  nativeCurrency: { name: 'Arbitrum Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: getAlchemyRpc('arb-sepolia') || 'https://sepolia-rollup.arbitrum.io/rpc',
  rpcUrls: {
    default: {
      http: [
        ...(getAlchemyRpc('arb-sepolia') ? [getAlchemyRpc('arb-sepolia')!] : []),
        'https://sepolia-rollup.arbitrum.io/rpc',
        'https://arbitrum-sepolia-rpc.publicnode.com',
        'https://1rpc.io/arb-sepolia',
      ],
    },
    public: {
      http: [
        'https://sepolia-rollup.arbitrum.io/rpc',
        'https://arbitrum-sepolia-rpc.publicnode.com',
      ],
    },
  },
  blockExplorerUrl: 'https://sepolia.arbiscan.io',
  blockExplorers: {
    default: { name: 'Arbiscan Sepolia', url: 'https://sepolia.arbiscan.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 81140,
    },
  },
  gasPriceGwei: 0.1,
  isSupported: true,
  testnet: true,
});

export const optimismSepolia = defineChain({
  id: 11155420,
  name: 'Optimism Sepolia',
  shortName: 'OP Sepolia',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
  nativeCurrency: { name: 'OP Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: getAlchemyRpc('opt-sepolia') || 'https://sepolia.optimism.io',
  rpcUrls: {
    default: {
      http: [
        ...(getAlchemyRpc('opt-sepolia') ? [getAlchemyRpc('opt-sepolia')!] : []),
        'https://sepolia.optimism.io',
        'https://optimism-sepolia-rpc.publicnode.com',
      ],
    },
    public: {
      http: [
        'https://sepolia.optimism.io',
        'https://optimism-sepolia-rpc.publicnode.com',
      ],
    },
  },
  blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
  blockExplorers: {
    default: { name: 'OP Etherscan Sepolia', url: 'https://sepolia-optimism.etherscan.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
    },
  },
  gasPriceGwei: 0.1,
  isSupported: true,
  testnet: true,
});

export const bsc = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  shortName: 'BNB Chain',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrl: 'https://binance.llamarpc.com',
  rpcUrls: {
    default: {
      http: [
        'https://binance.llamarpc.com',
        'https://bsc-dataseed.binance.org',
        'https://bsc-rpc.publicnode.com',
        'https://1rpc.io/bnb',
      ],
    },
    public: {
      http: [
        'https://binance.llamarpc.com',
        'https://bsc-dataseed.binance.org',
      ],
    },
  },
  blockExplorerUrl: 'https://bscscan.com',
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 15921452,
    },
  },
  gasPriceGwei: 3.0,
  isSupported: true,
  testnet: false,
});

export const unichain = defineChain({
  id: 1301,
  name: 'Unichain Sepolia',
  shortName: 'Unichain',
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://sepolia.unichain.org',
  rpcUrls: {
    default: { http: ['https://sepolia.unichain.org'] },
    public: { http: ['https://sepolia.unichain.org'] },
  },
  blockExplorerUrl: 'https://sepolia.uniscan.xyz',
  blockExplorers: {
    default: { name: 'UniScan', url: 'https://sepolia.uniscan.xyz' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
    },
  },
  gasPriceGwei: 0.05,
  isSupported: true,
  testnet: true,
});

export const ALL_CHAINS: Chain[] = [
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  bsc,
  avalanche,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  unichain,
];

/**
 * Check if a chain ID is in the officially supported list
 */
export function isSupportedChain(chainId: number | string): boolean {
  const numId = typeof chainId === 'string' ? (chainId.startsWith('0x') ? parseInt(chainId, 16) : parseInt(chainId, 10)) : chainId;
  return ALL_CHAINS.some((c) => c.id === numId);
}

/**
 * Get prioritized RPC endpoint list for a chain
 */
export function getChainRpcUrls(chainId: number | string): string[] {
  const chain = getChainById(chainId);
  const urls = [
    chain.rpcUrl,
    ...(chain.rpcUrls?.default?.http || []),
    ...(chain.rpcUrls?.public?.http || []),
  ];
  return Array.from(new Set(urls.filter(Boolean)));
}

/**
 * Universal Chain Resolver & Dynamic Detector:
 * Matches any chain by decimal or hex ID, or synthesizes a dynamic EVM Chain definition
 */
export function getChainById(chainId: number | string): Chain {
  const numId = typeof chainId === 'string' ? (chainId.startsWith('0x') ? parseInt(chainId, 16) : parseInt(chainId, 10)) : chainId;
  const found = ALL_CHAINS.find((c) => c.id === numId);
  if (found) return found;

  // Synthesize dynamic chain object for custom EVM networks
  return defineChain({
    id: numId,
    name: `EVM Chain #${numId}`,
    shortName: `Chain ${numId}`,
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    nativeCurrency: { name: 'Native Token', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://rpc.ankr.com/eth',
    blockExplorerUrl: 'https://etherscan.io',
    gasPriceGwei: 1.0,
    isSupported: true,
    testnet: numId > 100000,
  });
}
