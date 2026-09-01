import { Token, ChainId } from './index';

export interface JarTokenBalance {
  token: Token;
  amount: number;
  valueUSD: number;
  accrualRate24hUSD: number;
}

export interface TokenJarState {
  chainId: ChainId;
  chainName: string;
  contractAddress: string;
  releaserAddress: string;
  totalValueUSD: number;
  tokens: JarTokenBalance[];
  lastSweptTimestamp: number;
  totalProcessedUSD: number;
}

export interface FeeSourceAdapter {
  id: string;
  name: string;
  protocolVersion: 'V2' | 'V3' | 'V4';
  contractAddress: string;
  status: 'active' | 'paused';
  totalSweptUSD: number;
  pendingUncollectedUSD: number;
  poolsMonitored: number;
  description: string;
}

export interface FirepitAuction {
  id: string;
  chainId: ChainId;
  status: 'open' | 'settling' | 'completed';
  lotNumber: number;
  currentUniPriceTokens: number;
  currentUniPriceUSD: number;
  basketValueUSD: number;
  discountPercent: number;
  timeRemainingSeconds: number;
  totalUniBurnedLifetime: number;
  totalUsdBurnedLifetime: number;
  tokensInBasket: JarTokenBalance[];
}

export interface FeePolicyTier {
  feeTier: number; // e.g. 500 (0.05%), 3000 (0.30%), 10000 (1.00%)
  label: string;
  poolSwapFeePercent: number;
  protocolFeeFraction: number; // e.g. 4 (1/4th), 5 (1/5th), 6 (1/6th), 0 (disabled)
  effectiveProtocolFeePercent: number;
  projectedAnnualRevenueUSD: number;
  lpApyImpactPercent: number;
  status: 'active' | 'governance_proposal' | 'disabled';
}

export interface ProtocolFeeEvent {
  id: string;
  type: 'sweep' | 'release' | 'burn' | 'policy_update';
  chainId: ChainId;
  title: string;
  description: string;
  amountUSD: number;
  uniAmount?: number;
  hash: string;
  timestamp: number;
}
