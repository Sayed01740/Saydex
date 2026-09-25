import { TokenJarState, FeeSourceAdapter, FirepitAuction, FeePolicyTier, ProtocolFeeEvent } from '../types/protocolFees';
import { TOKENS } from './mockData';

const findToken = (symbol: string) =>
  TOKENS.find((t) => t.symbol === symbol) || TOKENS[0];

export const INITIAL_TOKEN_JARS: Record<number, TokenJarState> = {
  1: {
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    contractAddress: '0x1F9840a85d5aF5bf1D1762F925BDADdC4201F984',
    releaserAddress: '0x3F88a29A887556a35A224Fe7906E57E882650085',
    totalValueUSD: 0,
    totalProcessedUSD: 0,
    lastSweptTimestamp: 0,
    tokens: [],
  },
  42161: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    contractAddress: '0x8b5b46F3a56A3A3D0B758b760d6966141a004543',
    releaserAddress: '0x49B45A82728fE8C2224cb1495c643644061A2253',
    totalValueUSD: 0,
    totalProcessedUSD: 0,
    lastSweptTimestamp: 0,
    tokens: [],
  },
  8453: {
    chainId: 8453,
    chainName: 'Base',
    contractAddress: '0x321689CeB70C63eFd363e80F83d3527D6013a29B',
    releaserAddress: '0x99A82Ce624dB80b6F95c2e0b57140Bf552e1f2Ac',
    totalValueUSD: 0,
    totalProcessedUSD: 0,
    lastSweptTimestamp: 0,
    tokens: [],
  },
  10: {
    chainId: 10,
    chainName: 'OP Mainnet',
    contractAddress: '0x7166CEf1BB39E36F392B7e4e138a0F6c9F9389c9',
    releaserAddress: '0x01BFea61118a8A061448b2611739fF78c18714e3',
    totalValueUSD: 0,
    totalProcessedUSD: 0,
    lastSweptTimestamp: 0,
    tokens: [],
  },
};

export const INITIAL_FEE_ADAPTERS: FeeSourceAdapter[] = [
  {
    id: 'v3-adapter',
    name: 'Uniswap V3 Fee Adapter',
    protocolVersion: 'V3',
    contractAddress: '0x889812A9E1985F806aD13E40e1189C638148b111',
    status: 'active',
    totalSweptUSD: 98400000,
    pendingUncollectedUSD: 412500,
    poolsMonitored: 842,
    description: 'Collects accrued protocolFees (1/4 to 1/6th) from concentrated liquidity pools into local TokenJar.',
  },
  {
    id: 'v4-adapter',
    name: 'Uniswap V4 Hook & Pool Fee Adapter',
    protocolVersion: 'V4',
    contractAddress: '0x99480C2893d9e84C180e03eB05F66d6E27138404',
    status: 'active',
    totalSweptUSD: 34200000,
    pendingUncollectedUSD: 184200,
    poolsMonitored: 419,
    description: 'Enforces V4FeePolicy override tiers and streams dynamic hook protocol proceeds directly to TokenJar.',
  },
  {
    id: 'v2-adapter',
    name: 'Uniswap V2 Pair Fee Sweeper',
    protocolVersion: 'V2',
    contractAddress: '0x2289cAf28f58bE51613c239fF025Ec4295eF7212',
    status: 'active',
    totalSweptUSD: 10250000,
    pendingUncollectedUSD: 45000,
    poolsMonitored: 1250,
    description: 'Sweeps 1/6th V2 LP protocol fee mints, converting LP shares into underlying tokens for TokenJar.',
  },
];

export const INITIAL_FIREPIT_AUCTIONS: Record<number, FirepitAuction> = {
  1: {
    id: 'firepit-eth-1',
    chainId: 1,
    status: 'settled',
    lotNumber: 1,
    currentUniPriceTokens: 0,
    currentUniPriceUSD: 0,
    basketValueUSD: 0,
    discountPercent: 0,
    timeRemainingSeconds: 0,
    totalUniBurnedLifetime: 0,
    totalUsdBurnedLifetime: 0,
    tokensInBasket: [],
  },
  42161: {
    id: 'firepit-arb-1',
    chainId: 42161,
    status: 'settled',
    lotNumber: 1,
    currentUniPriceTokens: 0,
    currentUniPriceUSD: 0,
    basketValueUSD: 0,
    discountPercent: 0,
    timeRemainingSeconds: 0,
    totalUniBurnedLifetime: 0,
    totalUsdBurnedLifetime: 0,
    tokensInBasket: [],
  },
  8453: {
    id: 'firepit-base-1',
    chainId: 8453,
    status: 'settled',
    lotNumber: 1,
    currentUniPriceTokens: 0,
    currentUniPriceUSD: 0,
    basketValueUSD: 0,
    discountPercent: 0,
    timeRemainingSeconds: 0,
    totalUniBurnedLifetime: 0,
    totalUsdBurnedLifetime: 0,
    tokensInBasket: [],
  },
  10: {
    id: 'firepit-op-1',
    chainId: 10,
    status: 'settled',
    lotNumber: 1,
    currentUniPriceTokens: 0,
    currentUniPriceUSD: 0,
    basketValueUSD: 0,
    discountPercent: 0,
    timeRemainingSeconds: 0,
    totalUniBurnedLifetime: 0,
    totalUsdBurnedLifetime: 0,
    tokensInBasket: [],
  },
};

export const INITIAL_FEE_POLICY_TIERS: FeePolicyTier[] = [
  {
    feeTier: 100,
    label: '0.01% Ultra-Stable Pools (e.g. USDC/USDT)',
    poolSwapFeePercent: 0.01,
    protocolFeeFraction: 4, // 1/4th
    effectiveProtocolFeePercent: 0.0025,
    projectedAnnualRevenueUSD: 0,
    lpApyImpactPercent: 0,
    status: 'active',
  },
  {
    feeTier: 500,
    label: '0.05% Correlated & Bluechip Pairs (e.g. ETH/USDC, stETH/ETH)',
    poolSwapFeePercent: 0.05,
    protocolFeeFraction: 5, // 1/5th
    effectiveProtocolFeePercent: 0.010,
    projectedAnnualRevenueUSD: 0,
    lpApyImpactPercent: 0,
    status: 'active',
  },
  {
    feeTier: 3000,
    label: '0.30% Standard Volatile Pools (e.g. UNI/ETH, LINK/ETH)',
    poolSwapFeePercent: 0.30,
    protocolFeeFraction: 6, // 1/6th
    effectiveProtocolFeePercent: 0.050,
    projectedAnnualRevenueUSD: 0,
    lpApyImpactPercent: 0,
    status: 'active',
  },
  {
    feeTier: 10000,
    label: '1.00% Exotic & Long-Tail Pools',
    poolSwapFeePercent: 1.00,
    protocolFeeFraction: 4, // 1/4th
    effectiveProtocolFeePercent: 0.250,
    projectedAnnualRevenueUSD: 0,
    lpApyImpactPercent: 0,
    status: 'governance_proposal',
  },
];

export const INITIAL_PROTOCOL_FEE_EVENTS: ProtocolFeeEvent[] = [];
