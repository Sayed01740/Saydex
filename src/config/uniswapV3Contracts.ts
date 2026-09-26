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

/**
 * Official Uniswap V3 & Universal Router deployments on all supported networks
 * Reference: https://docs.uniswap.org/contracts/v3/reference/deployments
 */
export const UNISWAP_V3_DEPLOYMENTS: Record<number, UniswapV3Deployment> = {
  // Ethereum Mainnet (1)
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
  // Arbitrum One (42161)
  42161: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoterV2: '0x61fCE1D2243C1F3fCda1846Ca9cd08090ba7E401',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    wethAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    defaultStablecoinAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Native USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Base (8453)
  8453: {
    chainId: 8453,
    chainName: 'Base',
    swapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481',
    quoterV2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    nonfungiblePositionManager: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
    factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Native USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Optimism Mainnet (10)
  10: {
    chainId: 10,
    chainName: 'OP Mainnet',
    swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoterV2: '0x61fCE1D2243C1F3fCda1846Ca9cd08090ba7E401',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Native USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Polygon PoS (137)
  137: {
    chainId: 137,
    chainName: 'Polygon PoS',
    swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoterV2: '0x61fCE1D2243C1F3fCda1846Ca9cd08090ba7E401',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    wethAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    defaultStablecoinAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // BNB Smart Chain (56)
  56: {
    chainId: 56,
    chainName: 'BNB Chain',
    swapRouter02: '0xB9714879f4ae833966579E78F592750eA4f77F5B',
    quoterV2: '0x78D78E420Da98ad378D7799bE8f4AF69033EB077',
    nonfungiblePositionManager: '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613',
    factory: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
    wethAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    defaultStablecoinAddress: '0x55d398326f99059fF775485246999027B3197955', // USDT
    defaultStablecoinSymbol: 'USDT',
    permit2: PERMIT2_ADDRESS,
  },
  // Avalanche C-Chain (43114)
  43114: {
    chainId: 43114,
    chainName: 'Avalanche C-Chain',
    swapRouter02: '0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE',
    quoterV2: '0xbe0F5544EC67e9B3b272f218253471C0F7783E00',
    nonfungiblePositionManager: '0x655C406EBFa14EE2006250925e54ec43AD184f8B',
    factory: '0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD',
    wethAddress: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    defaultStablecoinAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Celo Mainnet (42220)
  42220: {
    chainId: 42220,
    chainName: 'Celo Mainnet',
    swapRouter02: '0x5615CDAb10dc425a742d643d949a7F474C01abc4',
    quoterV2: '0x82825d0554fA07607d642cE7eC3369DD6AA9c384',
    nonfungiblePositionManager: '0x3d79EdAaBC0EaB6F08ED885C05Fc0B014290D95A',
    factory: '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc',
    wethAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438', // CELO
    defaultStablecoinAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // cUSD
    defaultStablecoinSymbol: 'cUSD',
    permit2: PERMIT2_ADDRESS,
  },
  // Blast (81457)
  81457: {
    chainId: 81457,
    chainName: 'Blast',
    swapRouter02: '0x549Fe52140aF3A9FF8F3d3215802BCe45D33e089',
    quoterV2: '0x198EF79F1F515F02dFE9e3115e9F807830589344',
    nonfungiblePositionManager: '0xB218e4f7cdc4FF2746481283B462b88D82aAfaEc',
    factory: '0x792EdAdE80af5fC680d96a2eD80A44247D1AF6Fd',
    wethAddress: '0x4300000000000000000000000000000000000004',
    defaultStablecoinAddress: '0x4300000000000000000000000000000000000003', // USDB
    defaultStablecoinSymbol: 'USDB',
    permit2: PERMIT2_ADDRESS,
  },
  // Zora (7777777)
  7777777: {
    chainId: 7777777,
    chainName: 'Zora',
    swapRouter02: '0x7De2a8D081D005aA8276fF76e5e8e82aFfBf94C1',
    quoterV2: '0x198EF79F1F515F02dFE9e3115e9F807830589344',
    nonfungiblePositionManager: '0x43d3E4F4202359d95F4ad4519967265B54d2042C',
    factory: '0x7145e178C49BEa5035E881a4a7536868670A88D1',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinSymbol: 'WETH',
    permit2: PERMIT2_ADDRESS,
  },
  // ZKsync Era (324)
  324: {
    chainId: 324,
    chainName: 'ZKsync Era',
    swapRouter02: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
    quoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
    nonfungiblePositionManager: '0x1238536071E1c677A632429e3655c799b22cDA52',
    factory: '0x8FdA91136b6F0945952f36BE6B03348C9E9bB373',
    wethAddress: '0x5AEa5775959fBE2537233048360914357177f25c',
    defaultStablecoinAddress: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', // USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // World Chain (480)
  480: {
    chainId: 480,
    chainName: 'World Chain',
    swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoterV2: '0x61fCE1D2243C1F3fCda1846Ca9cd08090ba7E401',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1', // USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Unichain Mainnet (130)
  130: {
    chainId: 130,
    chainName: 'Unichain Mainnet',
    swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    quoterV2: '0x61fCE1D2243C1F3fCda1846Ca9cd08090ba7E401',
    nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x078D782b760474a361dDA0AF3839290b0EF57AD6', // USDC
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Ethereum Sepolia Testnet (11155111)
  11155111: {
    chainId: 11155111,
    chainName: 'Ethereum Sepolia',
    swapRouter02: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
    quoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
    nonfungiblePositionManager: '0x1238536071E1c677A632429e3655c799b22cDA52',
    factory: '0x0227628f3F023674B2267139662a91a4d1DE40b5',
    wethAddress: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
    defaultStablecoinAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Base Sepolia Testnet (84532)
  84532: {
    chainId: 84532,
    chainName: 'Base Sepolia',
    swapRouter02: '0x94cC0AaC535CCDB3C01d6787d6413C739ae12bc4',
    quoterV2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
    nonfungiblePositionManager: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
    factory: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Arbitrum Sepolia Testnet (421614)
  421614: {
    chainId: 421614,
    chainName: 'Arbitrum Sepolia',
    swapRouter02: '0x101F443B4d1b059569D643917553c771E1b9663E',
    quoterV2: '0x2779a0De1c3ec1AC29534e6d6d888258e72390f2',
    nonfungiblePositionManager: '0x6b2937Bde1bCD93edd8378A555986420f1883F8C',
    factory: '0x248AB7956328b082084c7EBEa11A99039E83b7E7',
    wethAddress: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    defaultStablecoinAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Optimism Sepolia Testnet (11155420)
  11155420: {
    chainId: 11155420,
    chainName: 'Optimism Sepolia',
    swapRouter02: '0x94cC0AaC535CCDB3C01d6787d6413C739ae12bc4',
    quoterV2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27',
    nonfungiblePositionManager: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
    factory: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24',
    wethAddress: '0x4200000000000000000000000000000000000006',
    defaultStablecoinAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    defaultStablecoinSymbol: 'USDC',
    permit2: PERMIT2_ADDRESS,
  },
  // Unichain Sepolia Testnet (1301)
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
