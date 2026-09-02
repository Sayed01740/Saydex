export interface UniswapV3Deployment {
  chainId: number;
  chainName: string;
  swapRouter02: string;
  quoterV2: string;
  nonfungiblePositionManager: string;
  factory: string;
  wethAddress: string;
  defaultStablecoinAddress: string;
  defaultStablecoinSymbol: string;
  permit2?: string;
}

export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export const UNISWAP_V3_DEPLOYMENTS: Record<number, UniswapV3Deployment> = {
  // Ethereum Sepolia Testnet
  11155111: {
    chainId: 11155111,
    chainName: 'Ethereum Sepolia',
    swapRouter02: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
    quoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
    nonfungiblePositionManager: '0x1238536071E1c677A632429e3655c799b22cDA52',
    factory: '0x0227628f3F023674B2267139662a91a4d1DE40b5',
    wethAddress: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
    defaultStablecoinAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Base Sepolia Testnet
  84532: {
    chainId: 84532,
    chainName: 'Base Sepolia',
    swapRouter02: '0x94cC0AaC535CCDB3C01d6787d6413C739ae12bc4',
    quoterV2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
    nonfungiblePositionManager: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
    factory: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Arbitrum Sepolia Testnet
  421614: {
    chainId: 421614,
    chainName: 'Arbitrum Sepolia',
    swapRouter02: '0x101F443B4d1b059569D643917553c771E1b9663E',
    quoterV2: '0x2779a0De1c3ec1AC29534e6d6d888258e72390f2',
    nonfungiblePositionManager: '0x6b2937Bde1bCD93edd8378A555986420f1883F8C',
    factory: '0x248AB7956328b082084c7EBEa11A99039E83b7E7',
    wethAddress: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    defaultStablecoinAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arb Sepolia USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Optimism Sepolia Testnet
  11155420: {
    chainId: 11155420,
    chainName: 'Optimism Sepolia',
    swapRouter02: '0x94cC0AaC535CCDB3C01d6787d6413C739ae12bc4',
    quoterV2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
    nonfungiblePositionManager: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
    factory: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // OP Sepolia USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Unichain Sepolia Testnet
  1301: {
    chainId: 1301,
    chainName: 'Unichain Sepolia',
    swapRouter02: '0xf76A54B9d885E4e24D7B38b2488a08d6c8b935d8',
    quoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
    nonfungiblePositionManager: '0x1238536071E1c677A632429e3655c799b22cDA52',
    factory: '0x0227628f3F023674B2267139662a91a4d1DE40b5',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Ethereum Mainnet (fallback)
  1: {
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoterV2: '0x61fCE1D2243C1F3fCda1846Ca9cd08090ba7E401',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    defaultStablecoinAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
};

export function getUniswapV3Deployment(chainId: number): UniswapV3Deployment | undefined {
  return UNISWAP_V3_DEPLOYMENTS[chainId];
}

export const POPULAR_FEE_TIERS = [
  { fee: 100, label: '0.01%', description: 'Best for very stable pairs (e.g. USDC/USDT)' },
  { fee: 500, label: '0.05%', description: 'Best for stable/liquid pairs (e.g. ETH/USDC)' },
  { fee: 3000, label: '0.30%', description: 'Standard pairs with market volatility' },
  { fee: 10000, label: '1.00%', description: 'Exotic pairs with high price risk' },
];
