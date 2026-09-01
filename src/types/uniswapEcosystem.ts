export type RepoCategory =
  | 'core_amm'
  | 'routing_execution'
  | 'uniswapx'
  | 'v4_hooks'
  | 'sdks_tooling'
  | 'governance_fees'
  | 'subgraphs_data'
  | 'interfaces_mobile'
  | 'unichain_infra';

export interface UniswapRepoItem {
  id: string;
  name: string;
  repoName: string;
  githubUrl: string;
  category: RepoCategory;
  description: string;
  language: 'Solidity' | 'TypeScript' | 'Rust' | 'Python' | 'Go' | 'Vyper' | 'JSON/Config';
  stars: number;
  forks: number;
  license: string;
  badge?: string;
  keyFeatures?: string[];
  architectureSummary?: string;
  sampleCode?: string;
  npmPackage?: string;
  version?: string;
  solidityVersion?: string;
  tags: string[];
}

export interface DutchAuctionOrder {
  id: string;
  orderHash: string;
  swapper: string;
  tokenIn: string;
  tokenInAmount: string;
  tokenOut: string;
  startAmountOut: string;
  endAmountOut: string;
  decayStartTime: number;
  decayEndTime: number;
  currentDecayedAmountOut: string;
  decayPercent: number;
  status: 'decaying' | 'filled' | 'expired';
  filler?: string;
  gasCostUSD: number;
  exclusivePeriodSeconds: number;
}

export interface V4HookDefinition {
  id: string;
  name: string;
  repo: string;
  hookFlagsHex: string;
  addressPrefix: string;
  description: string;
  enabledPermissions: {
    beforeInitialize: boolean;
    afterInitialize: boolean;
    beforeAddLiquidity: boolean;
    afterAddLiquidity: boolean;
    beforeRemoveLiquidity: boolean;
    afterRemoveLiquidity: boolean;
    beforeSwap: boolean;
    afterSwap: boolean;
    beforeDonate: boolean;
    afterDonate: boolean;
    beforeSwapReturnDelta: boolean;
    afterSwapReturnDelta: boolean;
    afterAddLiquidityReturnDelta: boolean;
    afterRemoveLiquidityReturnDelta: boolean;
  };
  solidityTemplate: string;
  category: 'trading' | 'fees' | 'liquidity' | 'security' | 'oracle';
}
