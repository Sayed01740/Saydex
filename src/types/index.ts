export type ChainId = 1 | 42161 | 10 | 8453 | 137 | 56 | 43114 | 11155111 | 1301 | number;

export interface PublicClient {
  chainId: number;
  getActiveRpcUrl: () => string;
  getBackupRpcUrls: () => string[];
  getBalance: (address: string, signal?: AbortSignal) => Promise<number | null>;
  getTokenBalance: (tokenAddress: string, walletAddress: string, decimals?: number, signal?: AbortSignal) => Promise<number | null>;
  call: (params: { to: string; data: string; from?: string; value?: string }, blockTag?: string) => Promise<string>;
  estimateGas: (params: { to?: string; from?: string; data?: string; value?: string }) => Promise<string>;
  getChainId: () => Promise<number | null>;
  getBlockNumber: () => Promise<number | null>;
  getTransactionReceipt: (hash: string) => Promise<any>;
  execute: <T = any>(method: string, params?: any[], options?: { timeoutMs?: number; signal?: AbortSignal; maxRetries?: number }) => Promise<T>;
}

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
  feeTier?: number;
  quoteSource?: 'onchain_quoter' | 'fallback_math';
  gasEstimate?: number;
}

export type TransactionLifecycleStage =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'signed'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'rejected';

export type TransactionStatus =
  | 'idle'
  | 'simulating'
  | 'wallet_approval'
  | 'signing'
  | 'signed'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'rejected';

export interface ActiveTransactionMonitor {
  id: string;
  hash: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'claim_fees' | 'launch_participate' | 'universal_router' | 'permit2';
  title: string;
  description: string;
  status: TransactionLifecycleStage;
  startedAt: number;
  signedAt?: number;
  confirmedAt?: number;
  confirmations: number;
  blockNumber?: number;
  explorerUrl?: string;
  isRealWallet?: boolean;
  signerAddress?: string;
  tokenIn?: { symbol: string; amount: string; icon: string };
  tokenOut?: { symbol: string; amount: string; icon: string };
  chainId?: number;
  userAddress?: string;
  error?: string;
}

export interface ProtocolTransaction {
  id: string;
  hash: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'claim_fees' | 'launch_participate';
  title: string;
  description: string;
  timestamp: number;
  status: 'signed' | 'pending' | 'confirmed' | 'failed' | 'rejected';
  tokenIn?: { symbol: string; amount: string; icon: string };
  tokenOut?: { symbol: string; amount: string; icon: string };
  explorerUrl: string;
  gasCostUSD: number;
  chainId?: number;
  userAddress?: string;
  blockNumber?: number;
  signedAt?: number;
  confirmedAt?: number;
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

