import { Chain, Token, LiquidityPool, UserPosition, ProtocolTransaction, LaunchpadProject } from '../types';
import { ALL_CHAINS } from '../config/chains';
import { UNISWAP_TOKENS } from './uniswapTokens';

export const SUPPORTED_CHAINS: Chain[] = ALL_CHAINS;

export const TOKENS: Token[] = UNISWAP_TOKENS;

const tokETH = UNISWAP_TOKENS.find((t) => t.symbol === 'ETH') || UNISWAP_TOKENS[0];
const tokUSDC = UNISWAP_TOKENS.find((t) => t.symbol === 'USDC') || UNISWAP_TOKENS[4];
const tokWBTC = UNISWAP_TOKENS.find((t) => t.symbol === 'WBTC') || UNISWAP_TOKENS[2];
const tokSAYDEX = UNISWAP_TOKENS.find((t) => t.symbol === 'SAYDEX') || UNISWAP_TOKENS[3];
const tokUSDT = UNISWAP_TOKENS.find((t) => t.symbol === 'USDT') || UNISWAP_TOKENS[5];
const tokLINK = UNISWAP_TOKENS.find((t) => t.symbol === 'LINK') || UNISWAP_TOKENS[8];
const tokUNI = UNISWAP_TOKENS.find((t) => t.symbol === 'UNI') || UNISWAP_TOKENS[3];

export const MOCK_POOLS: LiquidityPool[] = [
  {
    id: 'eth-usdc-005',
    chainId: 1,
    token0: tokETH,
    token1: tokUSDC,
    feeTier: 500,
    feePercent: 0.05,
    tvlUSD: 1480000000,
    volume24hUSD: 420500000,
    fees24hUSD: 210250,
    apr: 18.4,
    currentPrice: 3482.50,
    priceRangeMin: 3100.00,
    priceRangeMax: 3950.00,
    liquidityDistribution: [
      { price: 2900, depth: 15 },
      { price: 3050, depth: 32 },
      { price: 3200, depth: 65 },
      { price: 3350, depth: 92 },
      { price: 3482, depth: 100 },
      { price: 3600, depth: 88 },
      { price: 3750, depth: 54 },
      { price: 3900, depth: 38 },
      { price: 4100, depth: 18 },
    ],
  },
  {
    id: 'wbtc-eth-030',
    chainId: 1,
    token0: tokWBTC,
    token1: tokETH,
    feeTier: 3000,
    feePercent: 0.30,
    tvlUSD: 890000000,
    volume24hUSD: 210000000,
    fees24hUSD: 630000,
    apr: 24.8,
    currentPrice: 26.54,
    priceRangeMin: 22.0,
    priceRangeMax: 31.5,
    liquidityDistribution: [
      { price: 21.0, depth: 20 },
      { price: 23.5, depth: 48 },
      { price: 25.0, depth: 78 },
      { price: 26.54, depth: 100 },
      { price: 28.0, depth: 85 },
      { price: 30.0, depth: 45 },
      { price: 32.5, depth: 22 },
    ],
  },
  {
    id: 'saydex-eth-030',
    chainId: 1,
    token0: tokSAYDEX,
    token1: tokETH,
    feeTier: 3000,
    feePercent: 0.30,
    tvlUSD: 310000000,
    volume24hUSD: 85000000,
    fees24hUSD: 255000,
    apr: 42.6,
    currentPrice: 0.00425,
    priceRangeMin: 0.0035,
    priceRangeMax: 0.0055,
    liquidityDistribution: [
      { price: 0.0032, depth: 25 },
      { price: 0.0038, depth: 60 },
      { price: 0.00425, depth: 100 },
      { price: 0.0048, depth: 70 },
      { price: 0.0056, depth: 30 },
    ],
  },
  {
    id: 'usdc-usdt-001',
    chainId: 1,
    token0: tokUSDC,
    token1: tokUSDT,
    feeTier: 100,
    feePercent: 0.01,
    tvlUSD: 940000000,
    volume24hUSD: 380000000,
    fees24hUSD: 38000,
    apr: 6.2,
    currentPrice: 1.0001,
    priceRangeMin: 0.998,
    priceRangeMax: 1.002,
    liquidityDistribution: [
      { price: 0.997, depth: 10 },
      { price: 0.999, depth: 80 },
      { price: 1.0001, depth: 100 },
      { price: 1.001, depth: 75 },
      { price: 1.003, depth: 12 },
    ],
  },
  {
    id: 'link-eth-030',
    chainId: 1,
    token0: tokLINK,
    token1: tokETH,
    feeTier: 3000,
    feePercent: 0.30,
    tvlUSD: 185000000,
    volume24hUSD: 42000000,
    fees24hUSD: 126000,
    apr: 19.8,
    currentPrice: 0.00614,
    priceRangeMin: 0.005,
    priceRangeMax: 0.0078,
    liquidityDistribution: [
      { price: 0.0048, depth: 22 },
      { price: 0.0055, depth: 55 },
      { price: 0.00614, depth: 100 },
      { price: 0.0070, depth: 65 },
      { price: 0.0080, depth: 20 },
    ],
  },
  {
    id: 'uni-eth-030',
    chainId: 1,
    token0: tokUNI,
    token1: tokETH,
    feeTier: 3000,
    feePercent: 0.30,
    tvlUSD: 240000000,
    volume24hUSD: 68000000,
    fees24hUSD: 204000,
    apr: 22.4,
    currentPrice: 0.00340,
    priceRangeMin: 0.0028,
    priceRangeMax: 0.0042,
    liquidityDistribution: [
      { price: 0.0026, depth: 15 },
      { price: 0.0030, depth: 50 },
      { price: 0.0034, depth: 100 },
      { price: 0.0038, depth: 70 },
      { price: 0.0044, depth: 25 },
    ],
  },
];

export const MOCK_USER_POSITIONS: UserPosition[] = [];


export const MOCK_TRANSACTIONS: ProtocolTransaction[] = [];

export const MOCK_LAUNCHPAD: LaunchpadProject[] = [];

