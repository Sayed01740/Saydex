export type ChainId = 1 | 42161 | 10 | 8453 | 137 | 43114 | 11155111 | 130 | number;

/**
 * Explicit wallet connection state machine.
 * Never reduce this to a single boolean.
 */
export type WalletState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'WRONG_CHAIN'
  | 'CHAIN_SWITCHING'
  | 'ACCOUNT_CHANGED'
  | 'DISCONNECTING'
  | 'ERROR';

export interface ChainContract {
  address: string;
  blockCreated?: number;
}

export interface Chain {
  id: ChainId;
  name: string;
  shortName: string;
  icon: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  rpcUrls?: {
    default: { http: string[]; webSocket?: string[] };
    public?: { http: string[]; webSocket?: string[] };
  };
  blockExplorerUrl: string;
  blockExplorers?: {
    default: { name: string; url: string; apiUrl?: string };
  };
  contracts?: {
    multicall3?: ChainContract;
    ensRegistry?: ChainContract;
    ensUniversalResolver?: ChainContract;
  };
  gasPriceGwei: number;
  isSupported: boolean;
  testnet?: boolean;
  sourceId?: number;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TokenRiskAudit {
  isVerified: boolean;
  isMintable: boolean;
  hasFreezeAuthority: boolean;
  buyTaxPercent: number;
  sellTaxPercent: number;
  isHoneypot: boolean;
  auditNotes: string[];
}

export interface Token {
  address: string;
  chainId: ChainId;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  priceUSD: number;
  change24h: number;
  balance?: number;
  volume24hUSD?: number;
  tvlUSD?: number;
  isVerified: boolean;
  isPopular?: boolean;
  category?: 'defi' | 'stablecoin' | 'layer2' | 'lst' | 'ai' | 'meme' | 'native';
  tokenListSource?: 'Uniswap Default' | 'Uniswap Extended' | 'CoinGecko' | 'Custom Imported';
  riskAudit?: TokenRiskAudit;
}

export type FeeTier = 100 | 500 | 3000 | 10000; // 0.01%, 0.05%, 0.30%, 1.00%

export interface LiquidityPool {
  id: string;
  chainId: ChainId;
  token0: Token;
  token1: Token;
  feeTier: FeeTier;
  feePercent: number;
  tvlUSD: number;
  volume24hUSD: number;
  fees24hUSD: number;
  apr: number;
  currentPrice: number;
  priceRangeMin: number;
  priceRangeMax: number;
  liquidityDistribution: { price: number; depth: number }[];
}

export interface UserPosition {
  id: string;
  poolId: string;
  token0: Token;
  token1: Token;
  feeTier: FeeTier;
  priceMin: number;
  priceMax: number;
  currentPrice: number;
  inRange: boolean;
  amount0: number;
  amount1: number;
  unclaimedFeesUSD: number;
  totalValueUSD: number;
  apr: number;
  createdAt: string;
}

export interface RouteHopStep {
  fromToken: string;
  toToken: string;
  protocol: string;
  feeTier: string;
  poolAddress: string;
}

export interface RouteHop {
  protocol: string;
  poolAddress: string;
  percentage: number;
  fromToken: string;
  toToken: string;
  feeTier: string;
  intermediateTokens?: string[];
  poolLiquidityUSD?: string;
  hopSteps?: RouteHopStep[];
}

export interface SwapQuote {
  /** The chain this quote was computed on. Must match wallet chain before execution. */
  chainId: ChainId;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  executionPrice: number;
  priceImpact: number;
  networkFeeUSD: number;
  routeHops: RouteHop[];
  calldataHex: string;
  guaranteedUntil: number;
  mevProtected: boolean;
}

export type TransactionStatus =
  | 'idle'
  | 'simulating'
  | 'checking_allowance'
  | 'approving'
  | 'wallet_approval'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'rejected'      // User rejected in wallet
  | 'wrong_chain';  // Chain mismatch detected before submit

export interface ProtocolTransaction {
  id: string;
  hash: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'claim_fees' | 'launch_participate';
  title: string;
  description: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  tokenIn?: { symbol: string; amount: string; icon: string };
  tokenOut?: { symbol: string; amount: string; icon: string };
  explorerUrl: string;
  gasCostUSD: number;
}

export interface LaunchpadProject {
  id: string;
  name: string;
  symbol: string;
  tagline: string;
  description: string;
  logo: string;
  tokenPriceUSD: number;
  hardCapUSD: number;
  raisedUSD: number;
  participantsCount: number;
  status: 'upcoming' | 'live' | 'completed';
  startTime: string;
  endTime: string;
  minAllocationUSD: number;
  maxAllocationUSD: number;
  liquidityLockedPercent: number;
  vestingTerms: string;
  tokenomics: { label: string; percent: number }[];
}

export interface UserSettings {
  slippageTolerance: number; // e.g. 0.1, 0.5, 1.0, or custom
  customSlippage: string;
  deadlineMinutes: number;
  mevProtection: boolean;
  advancedMode: boolean;
  autoRouter: boolean;
  highGasAlert: boolean;
}

export interface PriceAlert {
  id: string;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  targetPrice: number; // in tokenOut per tokenIn (e.g. 3600 USDC per ETH)
  currentPriceAtCreation: number;
  condition: 'gte' | 'lte'; // 'gte' = rises above or equal, 'lte' = drops below or equal
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: number;
  triggeredAt?: number;
  note?: string;
}

