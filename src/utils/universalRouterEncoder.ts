import {
  UniversalRouterCommand,
  UniversalRouterCommandMeta,
  UniversalRouterStep,
  Permit2EIP712Signature,
} from '../types/universalRouter';
import { Token } from '../types';

export const PERMIT2_CONTRACT_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

export const UNIVERSAL_ROUTER_DEPLOYMENTS = {
  1: {
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    routerAddress: '0x66a9893cC07D91D95644AEDD05d03f95e1dBA8Af',
    permit2Address: PERMIT2_CONTRACT_ADDRESS,
    version: 'v2.0 (V4 Ready)',
    blockCreated: 18987452,
    explorerUrl: 'https://etherscan.io/address/0x66a9893cC07D91D95644AEDD05d03f95e1dBA8Af',
    status: 'active' as const,
  },
  42161: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    routerAddress: '0x4C60051384bd2d3C01bfc845Cf5F4b44bcbE9de5',
    permit2Address: PERMIT2_CONTRACT_ADDRESS,
    version: 'v2.0',
    blockCreated: 172948210,
    explorerUrl: 'https://arbiscan.io/address/0x4C60051384bd2d3C01bfc845Cf5F4b44bcbE9de5',
    status: 'active' as const,
  },
  8453: {
    chainId: 8453,
    chainName: 'Base',
    routerAddress: '0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC',
    permit2Address: PERMIT2_CONTRACT_ADDRESS,
    version: 'v2.0',
    blockCreated: 13982710,
    explorerUrl: 'https://basescan.org/address/0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC',
    status: 'active' as const,
  },
  10: {
    chainId: 10,
    chainName: 'OP Mainnet',
    routerAddress: '0xb555edF5dcF85f42cEd1F07E5DEa2B043726f781',
    permit2Address: PERMIT2_CONTRACT_ADDRESS,
    version: 'v2.0',
    blockCreated: 114892740,
    explorerUrl: 'https://optimistic.etherscan.io/address/0xb555edF5dcF85f42cEd1F07E5DEa2B043726f781',
    status: 'active' as const,
  },
  137: {
    chainId: 137,
    chainName: 'Polygon',
    routerAddress: '0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2',
    permit2Address: PERMIT2_CONTRACT_ADDRESS,
    version: 'v1.6',
    blockCreated: 53928100,
    explorerUrl: 'https://polygonscan.com/address/0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2',
    status: 'active' as const,
  },
};

export const UNIVERSAL_ROUTER_COMMAND_DEFINITIONS: Record<UniversalRouterCommand, UniversalRouterCommandMeta> = {
  [UniversalRouterCommand.V3_SWAP_EXACT_IN]: {
    command: UniversalRouterCommand.V3_SWAP_EXACT_IN,
    opcodeHex: '0x00',
    name: 'V3_SWAP_EXACT_IN',
    category: 'swap',
    description: 'Performs an exact-input multihop swap through Uniswap V3 concentrated liquidity pools.',
    parameterSchema: [
      { name: 'recipient', type: 'address', description: 'Address to receive the output tokens (or 0x0000000000000000000000000000000000000001 for MSG_SENDER / 0x2 for ROUTER)', defaultVal: '0x0000000000000000000000000000000000000001' },
      { name: 'amountIn', type: 'uint256', description: 'Exact amount of input tokens to swap', defaultVal: '1000000000000000000' },
      { name: 'amountOutMin', type: 'uint256', description: 'Minimum amount of output tokens to accept (slippage protection)', defaultVal: '3450000000' },
      { name: 'path', type: 'bytes', description: 'ABI-encoded token/fee path: (address, uint24, address)', defaultVal: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f4a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      { name: 'payerIsUser', type: 'bool', description: 'True if input tokens originate directly from user balance, false if already in Router', defaultVal: 'true' },
    ],
    gasEstimateGwei: 85000,
  },
  [UniversalRouterCommand.V3_SWAP_EXACT_OUT]: {
    command: UniversalRouterCommand.V3_SWAP_EXACT_OUT,
    opcodeHex: '0x01',
    name: 'V3_SWAP_EXACT_OUT',
    category: 'swap',
    description: 'Swaps the minimum necessary input tokens to yield an exact output amount on Uniswap V3.',
    parameterSchema: [
      { name: 'recipient', type: 'address', description: 'Recipient of exact output tokens', defaultVal: '0x0000000000000000000000000000000000000001' },
      { name: 'amountOut', type: 'uint256', description: 'Exact desired output amount', defaultVal: '2000000000' },
      { name: 'amountInMax', type: 'uint256', description: 'Maximum allowed input tokens to consume', defaultVal: '650000000000000000' },
      { name: 'path', type: 'bytes', description: 'Reversed token/fee path for exact-output swaps', defaultVal: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
      { name: 'payerIsUser', type: 'bool', description: 'Payer flag', defaultVal: 'true' },
    ],
    gasEstimateGwei: 92000,
  },
  [UniversalRouterCommand.PERMIT2_PERMIT]: {
    command: UniversalRouterCommand.PERMIT2_PERMIT,
    opcodeHex: '0x02',
    name: 'PERMIT2_PERMIT',
    category: 'permit2',
    description: 'Applies an off-chain EIP-712 Permit2 signature into the Permit2 contract, unlocking gasless approvals.',
    parameterSchema: [
      { name: 'permitSingle', type: 'PermitSingle', description: 'Permit details (token, amount, expiration, nonce, spender)', defaultVal: 'PermitSingle(token: 0xa0b8...eb48, amount: max, nonce: 0)' },
      { name: 'signature', type: 'bytes', description: 'EIP-712 65-byte signature (r, s, v)', defaultVal: '0x996a...5b1b' },
    ],
    gasEstimateGwei: 28000,
  },
  [UniversalRouterCommand.WRAP_ETH]: {
    command: UniversalRouterCommand.WRAP_ETH,
    opcodeHex: '0x03',
    name: 'WRAP_ETH',
    category: 'eth',
    description: 'Deposits native ETH in the router into the WETH9 canonical wrapper contract.',
    parameterSchema: [
      { name: 'recipient', type: 'address', description: 'Recipient of WETH', defaultVal: '0x0000000000000000000000000000000000000002' },
      { name: 'amountMin', type: 'uint256', description: 'Amount of ETH to wrap (or CONTRACT_BALANCE)', defaultVal: '0' },
    ],
    gasEstimateGwei: 25000,
  },
  [UniversalRouterCommand.UNWRAP_WETH]: {
    command: UniversalRouterCommand.UNWRAP_WETH,
    opcodeHex: '0x04',
    name: 'UNWRAP_WETH',
    category: 'eth',
    description: 'Withdraws WETH into native ETH and forwards the native coin to recipient.',
    parameterSchema: [
      { name: 'recipient', type: 'address', description: 'Recipient of native ETH', defaultVal: '0x0000000000000000000000000000000000000001' },
      { name: 'amountMin', type: 'uint256', description: 'Minimum ETH to receive', defaultVal: '0' },
    ],
    gasEstimateGwei: 29000,
  },
  [UniversalRouterCommand.PERMIT2_TRANSFER_FROM]: {
    command: UniversalRouterCommand.PERMIT2_TRANSFER_FROM,
    opcodeHex: '0x05',
    name: 'PERMIT2_TRANSFER_FROM',
    category: 'permit2',
    description: 'Transfers tokens from user to router via Permit2 allowance without standard ERC20 approve.',
    parameterSchema: [
      { name: 'token', type: 'address', description: 'Token address to transfer', defaultVal: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      { name: 'recipient', type: 'address', description: 'Recipient inside Universal Router pipeline', defaultVal: '0x0000000000000000000000000000000000000002' },
      { name: 'amount', type: 'uint160', description: 'Amount to transfer', defaultVal: '1000000000' },
    ],
    gasEstimateGwei: 31000,
  },
  [UniversalRouterCommand.PERMIT2_PERMIT_BATCH]: {
    command: UniversalRouterCommand.PERMIT2_PERMIT_BATCH,
    opcodeHex: '0x06',
    name: 'PERMIT2_PERMIT_BATCH',
    category: 'permit2',
    description: 'Sets approvals for multiple tokens in a single gas-efficient Permit2 signature.',
    parameterSchema: [
      { name: 'permitBatch', type: 'PermitBatch', description: 'Array of token permit details', defaultVal: 'PermitBatch([USDC, WETH, WBTC])' },
      { name: 'signature', type: 'bytes', description: 'Batch EIP-712 signature', defaultVal: '0x88f2...331c' },
    ],
    gasEstimateGwei: 39000,
  },
  [UniversalRouterCommand.V2_SWAP_EXACT_IN]: {
    command: UniversalRouterCommand.V2_SWAP_EXACT_IN,
    opcodeHex: '0x08',
    name: 'V2_SWAP_EXACT_IN',
    category: 'swap',
    description: 'Executes a constant-product Uniswap V2 exact-in swap.',
    parameterSchema: [
      { name: 'recipient', type: 'address', description: 'Output token recipient', defaultVal: '0x0000000000000000000000000000000000000001' },
      { name: 'amountIn', type: 'uint256', description: 'Input token amount', defaultVal: '500000000000000000' },
      { name: 'amountOutMin', type: 'uint256', description: 'Minimum output amount', defaultVal: '1650000000' },
      { name: 'path', type: 'address[]', description: 'Token addresses path', defaultVal: '[0xc02a..., 0xa0b8...]' },
      { name: 'payerIsUser', type: 'bool', description: 'Payer flag', defaultVal: 'true' },
    ],
    gasEstimateGwei: 72000,
  },
  [UniversalRouterCommand.V2_SWAP_EXACT_OUT]: {
    command: UniversalRouterCommand.V2_SWAP_EXACT_OUT,
    opcodeHex: '0x09',
    name: 'V2_SWAP_EXACT_OUT',
    category: 'swap',
    description: 'Executes a constant-product Uniswap V2 exact-output swap.',
    parameterSchema: [
      { name: 'recipient', type: 'address', description: 'Output token recipient', defaultVal: '0x0000000000000000000000000000000000000001' },
      { name: 'amountOut', type: 'uint256', description: 'Exact output amount desired', defaultVal: '1000000000' },
      { name: 'amountInMax', type: 'uint256', description: 'Maximum allowed input tokens', defaultVal: '320000000000000000' },
      { name: 'path', type: 'address[]', description: 'Token addresses path', defaultVal: '[0xc02a..., 0xa0b8...]' },
      { name: 'payerIsUser', type: 'bool', description: 'Payer flag', defaultVal: 'true' },
    ],
    gasEstimateGwei: 76000,
  },
  [UniversalRouterCommand.PERMIT2_TRANSFER_FROM_BATCH]: {
    command: UniversalRouterCommand.PERMIT2_TRANSFER_FROM_BATCH,
    opcodeHex: '0x0a',
    name: 'PERMIT2_TRANSFER_FROM_BATCH',
    category: 'permit2',
    description: 'Transfers multiple tokens via Permit2 in a single atomic transaction.',
    parameterSchema: [
      { name: 'batchDetails', type: 'AllowanceTransferDetails[]', description: 'List of from, to, amount, token', defaultVal: '[USDC, DAI]' },
    ],
    gasEstimateGwei: 48000,
  },
  [UniversalRouterCommand.SWEEP]: {
    command: UniversalRouterCommand.SWEEP,
    opcodeHex: '0x0b',
    name: 'SWEEP',
    category: 'utility',
    description: 'Sweeps any leftover token dust or change sitting in the Router back to the user address.',
    parameterSchema: [
      { name: 'token', type: 'address', description: 'Token address to sweep', defaultVal: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      { name: 'recipient', type: 'address', description: 'Recipient of swept tokens', defaultVal: '0x0000000000000000000000000000000000000001' },
      { name: 'amountMin', type: 'uint256', description: 'Minimum balance expected', defaultVal: '0' },
    ],
    gasEstimateGwei: 16000,
  },
  [UniversalRouterCommand.PAY_PORTION]: {
    command: UniversalRouterCommand.PAY_PORTION,
    opcodeHex: '0x0c',
    name: 'PAY_PORTION',
    category: 'utility',
    description: 'Splits or routes a portion (basis points) of tokens to an external fee collector or integrator.',
    parameterSchema: [
      { name: 'token', type: 'address', description: 'Token address', defaultVal: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
      { name: 'recipient', type: 'address', description: 'Fee or affiliate recipient', defaultVal: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
      { name: 'bips', type: 'uint256', description: 'Portion in basis points (e.g. 15 = 0.15%)', defaultVal: '15' },
    ],
    gasEstimateGwei: 18000,
  },
  [UniversalRouterCommand.V4_SWAP]: {
    command: UniversalRouterCommand.V4_SWAP,
    opcodeHex: '0x10',
    name: 'V4_SWAP',
    category: 'v4',
    description: 'Calls Uniswap V4 PoolManager swap with custom hook parameters and transient delta settlement.',
    parameterSchema: [
      { name: 'poolKey', type: 'PoolKey', description: 'V4 Pool Key (currency0, currency1, fee, tickSpacing, hooks)', defaultVal: 'PoolKey(ETH/USDC, fee=500, hooks=0x...)' },
      { name: 'actions', type: 'bytes', description: 'V4 actions byte array (SWAP_EXACT_IN_SINGLE, TAKE_ALL, SETTLE_ALL)', defaultVal: '0x060c0d' },
      { name: 'params', type: 'bytes[]', description: 'Encoded action params', defaultVal: '[...]' },
    ],
    gasEstimateGwei: 68000,
  },
  [UniversalRouterCommand.V4_INITIALIZE_POOL]: {
    command: UniversalRouterCommand.V4_INITIALIZE_POOL,
    opcodeHex: '0x11',
    name: 'V4_INITIALIZE_POOL',
    category: 'v4',
    description: 'Initializes a new Uniswap V4 singleton pool with initial sqrtPriceX96 and hook data.',
    parameterSchema: [
      { name: 'poolKey', type: 'PoolKey', description: 'Pool definition', defaultVal: 'PoolKey(...)' },
      { name: 'sqrtPriceX96', type: 'uint160', description: 'Initial Q64.96 square root price', defaultVal: '79228162514264337593543950336' },
      { name: 'hookData', type: 'bytes', description: 'Optional data passed to pool hook', defaultVal: '0x' },
    ],
    gasEstimateGwei: 110000,
  },
  [UniversalRouterCommand.V4_POSITION_CALL]: {
    command: UniversalRouterCommand.V4_POSITION_CALL,
    opcodeHex: '0x12',
    name: 'V4_POSITION_CALL',
    category: 'v4',
    description: 'Modifies liquidity position on Uniswap V4 (mint, burn, collect).',
    parameterSchema: [
      { name: 'actions', type: 'bytes', description: 'Position manager actions', defaultVal: '0x0102' },
      { name: 'params', type: 'bytes[]', description: 'Position parameters', defaultVal: '[...]' },
    ],
    gasEstimateGwei: 125000,
  },
  [UniversalRouterCommand.SEAPORT_V1_5]: {
    command: UniversalRouterCommand.SEAPORT_V1_5,
    opcodeHex: '0x21',
    name: 'SEAPORT_V1_5',
    category: 'nft',
    description: 'Fulfills NFT orders through OpenSea Seaport protocol in the same transaction as token swaps.',
    parameterSchema: [
      { name: 'value', type: 'uint256', description: 'ETH value forwarded to Seaport', defaultVal: '85000000000000000' },
      { name: 'orderData', type: 'bytes', description: 'Encoded AdvancedOrder / Fulfillment data', defaultVal: '0x5b38...' },
    ],
    gasEstimateGwei: 145000,
  },
  [UniversalRouterCommand.LOOKS_RARE_V2]: {
    command: UniversalRouterCommand.LOOKS_RARE_V2,
    opcodeHex: '0x22',
    name: 'LOOKS_RARE_V2',
    category: 'nft',
    description: 'Executes NFT buy order on LooksRare v2 marketplace.',
    parameterSchema: [
      { name: 'value', type: 'uint256', description: 'ETH cost', defaultVal: '120000000000000000' },
      { name: 'orderData', type: 'bytes', description: 'LooksRare taker bid / quote data', defaultVal: '0x77c1...' },
    ],
    gasEstimateGwei: 138000,
  },
  [UniversalRouterCommand.NFTX]: {
    command: UniversalRouterCommand.NFTX,
    opcodeHex: '0x23',
    name: 'NFTX',
    category: 'nft',
    description: 'Swaps or redeems NFT inventory through NFTX liquidity vaults.',
    parameterSchema: [
      { name: 'value', type: 'uint256', description: 'ETH value', defaultVal: '0' },
      { name: 'calldata', type: 'bytes', description: 'NFTX vault interaction bytes', defaultVal: '0x3a4b...' },
    ],
    gasEstimateGwei: 115000,
  },
  [UniversalRouterCommand.SUDOSWAP]: {
    command: UniversalRouterCommand.SUDOSWAP,
    opcodeHex: '0x24',
    name: 'SUDOSWAP',
    category: 'nft',
    description: 'Buys NFTs from Sudoswap AMM bonding curve pools.',
    parameterSchema: [
      { name: 'value', type: 'uint256', description: 'ETH payment', defaultVal: '95000000000000000' },
      { name: 'calldata', type: 'bytes', description: 'SudoSwap swapNFTsForToken calldata', defaultVal: '0x992e...' },
    ],
    gasEstimateGwei: 122000,
  },
  [UniversalRouterCommand.CRYPTOPUNKS]: {
    command: UniversalRouterCommand.CRYPTOPUNKS,
    opcodeHex: '0x25',
    name: 'CRYPTOPUNKS',
    category: 'nft',
    description: 'Directly buys CryptoPunks from the canonical CryptoPunksMarket contract.',
    parameterSchema: [
      { name: 'punkId', type: 'uint256', description: 'CryptoPunk token index (0-9999)', defaultVal: '7804' },
      { name: 'recipient', type: 'address', description: 'Recipient of punk', defaultVal: '0x0000000000000000000000000000000000000001' },
      { name: 'value', type: 'uint256', description: 'ETH price offered', defaultVal: '45000000000000000000' },
    ],
    gasEstimateGwei: 98000,
  },
  [UniversalRouterCommand.X2Y2]: {
    command: UniversalRouterCommand.X2Y2,
    opcodeHex: '0x26',
    name: 'X2Y2',
    category: 'nft',
    description: 'Fulfills NFT buy order on X2Y2 marketplace.',
    parameterSchema: [
      { name: 'value', type: 'uint256', description: 'ETH value', defaultVal: '60000000000000000' },
      { name: 'calldata', type: 'bytes', description: 'X2Y2 trade data', defaultVal: '0x12a9...' },
    ],
    gasEstimateGwei: 135000,
  },
  [UniversalRouterCommand.ELEMENT_MARKET]: {
    command: UniversalRouterCommand.ELEMENT_MARKET,
    opcodeHex: '0x27',
    name: 'ELEMENT_MARKET',
    category: 'nft',
    description: 'Fulfills batch order on Element NFT marketplace.',
    parameterSchema: [
      { name: 'value', type: 'uint256', description: 'ETH value', defaultVal: '40000000000000000' },
      { name: 'calldata', type: 'bytes', description: 'Element trade calldata', defaultVal: '0x4421...' },
    ],
    gasEstimateGwei: 130000,
  },
};

/**
 * Builds the complete `commands` bytes string from an array of steps.
 * Example: [PERMIT2_PERMIT, V3_SWAP_EXACT_IN, UNWRAP_WETH, SWEEP] => "0x0200040b"
 */
export function encodeCommandsByteString(commands: UniversalRouterCommand[]): string {
  const hex = commands
    .map((c) => {
      const hexVal = c.toString(16);
      return hexVal.length === 1 ? `0${hexVal}` : hexVal;
    })
    .join('');
  return `0x${hex}`;
}

/**
 * Encodes full Universal Router calldata for a standard Swap.
 */
export function buildSwapUniversalRouterExecution(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  amountOutMin: string,
  recipient: string = '0x0000000000000000000000000000000000000001',
  usePermit2: boolean = true
): {
  commandsHex: string;
  commandSteps: UniversalRouterStep[];
  inputsHexArray: string[];
  fullCalldataHex: string;
  totalGasEstimate: number;
  traditionalGasEstimate: number;
  gasSavingsUSD: number;
} {
  const steps: UniversalRouterStep[] = [];
  const isInputETH = tokenIn.symbol === 'ETH';
  const isOutputETH = tokenOut.symbol === 'ETH';

  // Step 1: If non-ETH and Permit2 enabled, prepend PERMIT2_PERMIT
  if (!isInputETH && usePermit2) {
    const permitCommand = UniversalRouterCommand.PERMIT2_PERMIT;
    steps.push({
      id: `step-${steps.length}`,
      command: permitCommand,
      opcodeHex: '0x02',
      name: 'PERMIT2_PERMIT',
      category: 'permit2',
      description: `Authorizes ${tokenIn.symbol} transfer via gasless EIP-712 Permit2 signature`,
      params: {
        token: tokenIn.address,
        spender: 'UniversalRouter',
        amount: amountIn,
        expiration: '30 days',
        nonce: 0,
      },
      inputBytesHex: `0x${Array.from({ length: 128 }, () => 'a').join('')}`,
      gasEstimate: 28000,
    });
  }

  // Step 2: If input is ETH, add WRAP_ETH
  if (isInputETH) {
    const wrapCommand = UniversalRouterCommand.WRAP_ETH;
    steps.push({
      id: `step-${steps.length}`,
      command: wrapCommand,
      opcodeHex: '0x03',
      name: 'WRAP_ETH',
      category: 'eth',
      description: `Wraps ${amountIn} ETH into WETH inside router pipeline`,
      params: {
        recipient: '0x0000000000000000000000000000000000000002', // ROUTER
        amountMin: amountIn,
      },
      inputBytesHex: `0x000000000000000000000000000000000000000200000000000000000000000000000000`,
      gasEstimate: 25000,
    });
  }

  // Step 3: Swap execution (V3_SWAP_EXACT_IN)
  const swapCommand = UniversalRouterCommand.V3_SWAP_EXACT_IN;
  steps.push({
    id: `step-${steps.length}`,
    command: swapCommand,
    opcodeHex: '0x00',
    name: 'V3_SWAP_EXACT_IN',
    category: 'swap',
    description: `Executes exact input swap: ${amountIn} ${tokenIn.symbol} -> min ${amountOutMin} ${tokenOut.symbol}`,
    params: {
      recipient: isOutputETH ? '0x0000000000000000000000000000000000000002' : recipient,
      amountIn,
      amountOutMin,
      path: `0x${tokenIn.address.slice(2, 42)}0001f4${tokenOut.address.slice(2, 42)}`,
      payerIsUser: !isInputETH && !usePermit2,
    },
    inputBytesHex: `0x000000000000000000000000${(isOutputETH ? '0000000000000000000000000000000000000002' : recipient).slice(2)}0000000000000000000000000000000000000000000000000de0b6b3a7640000`,
    gasEstimate: 85000,
  });

  // Step 4: If output is ETH, add UNWRAP_WETH
  if (isOutputETH) {
    const unwrapCommand = UniversalRouterCommand.UNWRAP_WETH;
    steps.push({
      id: `step-${steps.length}`,
      command: unwrapCommand,
      opcodeHex: '0x04',
      name: 'UNWRAP_WETH',
      category: 'eth',
      description: `Unwraps received WETH into native ETH and sends to recipient`,
      params: {
        recipient,
        amountMin: amountOutMin,
      },
      inputBytesHex: `0x000000000000000000000000${recipient.slice(2)}0000000000000000000000000000000000000000000000000000000000000000`,
      gasEstimate: 29000,
    });
  }

  // Step 5: Always add SWEEP for token change recovery
  const sweepCommand = UniversalRouterCommand.SWEEP;
  steps.push({
    id: `step-${steps.length}`,
    command: sweepCommand,
    opcodeHex: '0x0b',
    name: 'SWEEP',
    category: 'utility',
    description: `Sweeps any leftover token dust back to user address`,
    params: {
      token: tokenOut.address,
      recipient,
      amountMin: '0',
    },
    inputBytesHex: `0x000000000000000000000000${tokenOut.address.slice(2)}000000000000000000000000${recipient.slice(2)}0000000000000000000000000000000000000000000000000000000000000000`,
    gasEstimate: 16000,
  });

  const commandsHex = encodeCommandsByteString(steps.map((s) => s.command));
  const inputsHexArray = steps.map((s) => s.inputBytesHex);
  const totalGasEstimate = steps.reduce((sum, s) => sum + s.gasEstimate, 21000);

  // Traditional router requires: Approve ERC20 (46k) + Swap Multicall (125k) + Unwrap (30k) = 201k gas
  const traditionalGasEstimate = isInputETH ? totalGasEstimate + 35000 : totalGasEstimate + 65000;
  // Gas savings: difference in gas units × assumed gas price (gwei) → ETH → USD
  const gasSavingsUnits = Math.max(0, traditionalGasEstimate - totalGasEstimate);
  const assumedGasPriceGwei = 25;
  const ethPriceUSD = 3482.50;
  const gasSavingsUSD = (gasSavingsUnits * assumedGasPriceGwei * 1e-9) * ethPriceUSD;

  // Synthesize execute(bytes commands, bytes[] inputs, uint256 deadline) selector: 0x3593564c
  const fullCalldataHex = `0x3593564c${commandsHex.slice(2)}${inputsHexArray.join('')}`;

  return {
    commandsHex,
    commandSteps: steps,
    inputsHexArray,
    fullCalldataHex,
    totalGasEstimate,
    traditionalGasEstimate,
    gasSavingsUSD,
  };
}

/**
 * Disassembles arbitrary hex `commands` bytes into human-readable opcode definitions.
 */
export function disassembleCommandsHex(commandsHex: string): UniversalRouterCommandMeta[] {
  const clean = commandsHex.startsWith('0x') ? commandsHex.slice(2) : commandsHex;
  const metas: UniversalRouterCommandMeta[] = [];

  for (let i = 0; i < clean.length; i += 2) {
    const byteHex = clean.substr(i, 2);
    const opcode = parseInt(byteHex, 16);
    const meta = UNIVERSAL_ROUTER_COMMAND_DEFINITIONS[opcode as UniversalRouterCommand];
    if (meta) {
      metas.push(meta);
    } else {
      metas.push({
        command: opcode as any,
        opcodeHex: `0x${byteHex}`,
        name: `CUSTOM_COMMAND_0x${byteHex.toUpperCase()}`,
        category: 'utility',
        description: 'User-defined or unverified command opcode.',
        parameterSchema: [],
        gasEstimateGwei: 40000,
      });
    }
  }

  return metas;
}

/**
 * Generates a Permit2 EIP-712 typed data payload for signing.
 * 
 * IMPORTANT: This generates the structured data that SHOULD be signed by the wallet
 * via EIP-712 personal_sign. It does NOT generate a valid signature — the caller
 * must use the wallet provider (eth_signTypedData_v4) to produce the real (r, s, v).
 * 
 * The returned fields r, s, v, and signatureHex are placeholder values that must be
 * replaced with the actual wallet signature before on-chain submission.
 */
export function generatePermit2EIP712Payload(
  token: Token,
  spender: string,
  amount: string = '115792089237316195423570985008687907853269984665640564039457584007913129639935',
  nonce: number = 0,
  deadlineMinutes: number = 43200 // 30 days
): Permit2EIP712Signature {
  const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

  // Placeholder values — real signature must come from wallet provider via eth_signTypedData_v4
  const r = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const s = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const v = 27;
  const signatureHex = `${r.slice(2)}${s.slice(2)}${v.toString(16).padStart(2, '0')}`;

  return {
    tokenAddress: token.address,
    tokenSymbol: token.symbol,
    spender,
    amount,
    nonce,
    deadline,
    r,
    s,
    v,
    signatureHex,
    signedTimestamp: Date.now(),
  };
}
