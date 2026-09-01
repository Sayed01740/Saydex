export enum UniversalRouterCommand {
  // Uniswap V3 Swaps
  V3_SWAP_EXACT_IN = 0x00,
  V3_SWAP_EXACT_OUT = 0x01,

  // Permit2 Operations
  PERMIT2_PERMIT = 0x02,
  PERMIT2_TRANSFER_FROM = 0x05,
  PERMIT2_PERMIT_BATCH = 0x06,
  PERMIT2_TRANSFER_FROM_BATCH = 0x0a,

  // ETH / WETH Operations
  WRAP_ETH = 0x03,
  UNWRAP_WETH = 0x04,

  // Uniswap V2 Swaps
  V2_SWAP_EXACT_IN = 0x08,
  V2_SWAP_EXACT_OUT = 0x09,

  // Balance & Fee Utilities
  SWEEP = 0x0b,
  PAY_PORTION = 0x0c,

  // Uniswap V4 Operations
  V4_SWAP = 0x10,
  V4_INITIALIZE_POOL = 0x11,
  V4_POSITION_CALL = 0x12,

  // NFT Marketplaces & Protocols
  SEAPORT_V1_5 = 0x21,
  LOOKS_RARE_V2 = 0x22,
  NFTX = 0x23,
  SUDOSWAP = 0x24,
  CRYPTOPUNKS = 0x25,
  X2Y2 = 0x26,
  ELEMENT_MARKET = 0x27,
}

export interface UniversalRouterCommandMeta {
  command: UniversalRouterCommand;
  opcodeHex: string;
  name: string;
  category: 'swap' | 'permit2' | 'eth' | 'utility' | 'nft' | 'v4';
  description: string;
  parameterSchema: Array<{
    name: string;
    type: string;
    description: string;
    defaultVal?: string;
  }>;
  gasEstimateGwei: number;
}

export interface UniversalRouterStep {
  id: string;
  command: UniversalRouterCommand;
  opcodeHex: string;
  name: string;
  category: 'swap' | 'permit2' | 'eth' | 'utility' | 'nft' | 'v4';
  description: string;
  params: Record<string, any>;
  inputBytesHex: string;
  gasEstimate: number;
}

export interface Permit2Allowance {
  tokenSymbol: string;
  tokenAddress: string;
  tokenIcon: string;
  allowanceAmount: string;
  isUnlimited: boolean;
  expirationTimestamp: number;
  nonce: number;
  isPermit2Approved: boolean;
}

export interface Permit2EIP712Signature {
  tokenAddress: string;
  tokenSymbol: string;
  spender: string;
  amount: string;
  nonce: number;
  deadline: number;
  r: string;
  s: string;
  v: number;
  signatureHex: string;
  signedTimestamp: number;
}

export interface UniversalRouterDeployment {
  chainId: number;
  chainName: string;
  routerAddress: string;
  permit2Address: string;
  version: string;
  blockCreated: number;
  explorerUrl: string;
  status: 'active' | 'deprecated';
}

export interface UniversalRouterExecutionResult {
  id: string;
  hash: string;
  commandsHex: string;
  commandCount: number;
  inputsCount: number;
  gasUsed: number;
  gasSavingsUSD: number;
  timestamp: number;
  status: 'confirmed' | 'simulated';
  summary: string;
}

export interface NFTMarketItem {
  id: string;
  collectionName: string;
  tokenId: string;
  image: string;
  priceETH: number;
  priceUSD: number;
  marketplace: 'Seaport v1.5' | 'LooksRare v2' | 'Sudoswap' | 'CryptoPunks';
  commandOpcode: UniversalRouterCommand;
}
