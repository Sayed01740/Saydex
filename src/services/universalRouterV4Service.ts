import { Token } from '../types';
import { rpcProviderWrapper } from '../utils/rpcProviderWrapper';
import { walletLogger } from '../utils/walletLogger';

/**
 * Universal Permit2 Singleton deployed on all EVM chains
 * https://github.com/Uniswap/permit2
 */
export const PERMIT2_CONTRACT_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

/**
 * Official Uniswap Universal Router Addresses across networks
 */
export const UNIVERSAL_ROUTER_ADDRESSES: Record<number, string> = {
  1: '0x66a9893cC07D91D95644AEDD05d03f95e1dBA8Af', // Ethereum Mainnet (Universal Router v2 - V4 ready)
  42161: '0x4C60051384bd2d3C01bfc845Cf5F4b44bcbE9de5', // Arbitrum One
  8453: '0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC', // Base
  10: '0xb555edF5dcF85f42cEd1F07E5DEa2B043726f781', // OP Mainnet
  137: '0xec7BE89e9d109e7e3Fec59c222CF297125FEFda2', // Polygon
  130: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Unichain Mainnet
  11155111: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Sepolia Testnet
  1301: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Unichain Sepolia
};

/**
 * Uniswap Universal Router Commands enum
 * Command: Commands.V4_SWAP = 0x10
 */
export enum Commands {
  V3_SWAP_EXACT_IN = 0x00,
  V3_SWAP_EXACT_OUT = 0x01,
  PERMIT2_PERMIT = 0x02,
  WRAP_ETH = 0x03,
  UNWRAP_WETH = 0x04,
  PERMIT2_TRANSFER_FROM = 0x05,
  V2_SWAP_EXACT_IN = 0x08,
  V2_SWAP_EXACT_OUT = 0x09,
  SWEEP = 0x0b,
  PAY_PORTION = 0x0c,
  V4_SWAP = 0x10, // Official Uniswap V4 Swap command opcode
  V4_INITIALIZE_POOL = 0x11,
  V4_POSITION_CALL = 0x12,
}

/**
 * Uniswap V4Router Actions enum
 * Defined in @uniswap/v4-periphery/src/libraries/Actions.sol
 */
export enum Actions {
  SWAP_EXACT_IN_SINGLE = 0x06,
  SWAP_EXACT_IN = 0x07,
  SWAP_EXACT_OUT_SINGLE = 0x08,
  SWAP_EXACT_OUT = 0x09,
  SETTLE_ALL = 0x0c,
  TAKE_ALL = 0x0d,
  SETTLE = 0x0e,
  TAKE = 0x0f,
}

/**
 * Uniswap V4 PoolKey struct representation
 */
export interface V4PoolKey {
  currency0: string; // Lower currency address, address(0) for native ETH
  currency1: string; // Higher currency address
  fee: number; // e.g. 3000 (0.3%), 500 (0.05%)
  tickSpacing: number; // e.g. 60, 10
  hooks: string; // Hook contract address or address(0)
}

export interface V4ExactInputSingleParams {
  poolKey: V4PoolKey;
  zeroForOne: boolean;
  amountIn: bigint;
  amountOutMinimum: bigint;
  hookData: string; // Hex string e.g. "0x"
}

export interface PreparedV4SwapTransaction {
  to: string;
  data: string;
  value: string;
  chainId: number;
  requiresPermit2Erc20Approval: boolean;
  permit2Address: string;
  erc20ApprovalTx?: {
    to: string;
    data: string;
    value: string;
  };
  permit2ApproveTx?: {
    to: string;
    data: string;
    value: string;
  };
  details: {
    commandOpcode: string;
    actionsHex: string;
    poolKey: V4PoolKey;
    zeroForOne: boolean;
    amountIn: string;
    minAmountOut: string;
    deadlineTimestamp: number;
  };
}

/**
 * Utility functions for 32-byte EVM ABI encoding
 */
function pad32(val: string | number | bigint): string {
  let hex: string;
  if (typeof val === 'number' || typeof val === 'bigint') {
    hex = val.toString(16);
  } else {
    hex = val.replace(/^0x/, '');
  }
  return hex.padStart(64, '0');
}

function padAddress(addr: string): string {
  return addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function padRight32(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const targetLen = Math.ceil(clean.length / 64) * 64 || 64;
  return clean.padEnd(targetLen, '0');
}

export class UniversalRouterV4Service {
  /**
   * Helper: Sort currencies as required by Uniswap V4 PoolKey
   * Native ETH is address(0)
   */
  public sortCurrencies(tokenAAddress: string, tokenBAddress: string): {
    currency0: string;
    currency1: string;
    isTokenA0: boolean;
  } {
    const isANative = !tokenAAddress || tokenAAddress === '0x0000000000000000000000000000000000000000';
    const isBNative = !tokenBAddress || tokenBAddress === '0x0000000000000000000000000000000000000000';

    const addrA = isANative ? '0x0000000000000000000000000000000000000000' : tokenAAddress.toLowerCase();
    const addrB = isBNative ? '0x0000000000000000000000000000000000000000' : tokenBAddress.toLowerCase();

    if (addrA < addrB) {
      return { currency0: addrA, currency1: addrB, isTokenA0: true };
    } else {
      return { currency0: addrB, currency1: addrA, isTokenA0: false };
    }
  }

  /**
   * Check Permit2 Allowance for an ERC-20 token
   */
  public async checkPermit2Allowance(
    chainId: number,
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<{ standardAllowance: bigint; permit2Allowance: bigint }> {
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      const maxVal = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
      return { standardAllowance: maxVal, permit2Allowance: maxVal };
    }

    try {
      // 1. Check ERC-20 allowance to Permit2 contract: allowance(owner, PERMIT2_CONTRACT_ADDRESS)
      // selector: 0xdd62ed3e
      const callDataERC20 = `0xdd62ed3e${padAddress(ownerAddress)}${padAddress(PERMIT2_CONTRACT_ADDRESS)}`;
      const erc20AllowanceHex = await rpcProviderWrapper.call(chainId, {
        to: tokenAddress,
        data: callDataERC20,
      });
      const standardAllowance = erc20AllowanceHex && erc20AllowanceHex !== '0x' ? BigInt(erc20AllowanceHex) : 0n;

      // 2. Check Permit2 allowance for the Router: allowance(owner, token, spender)
      // selector: 0x927da105
      const callDataPermit2 = `0x927da105${padAddress(ownerAddress)}${padAddress(tokenAddress)}${padAddress(spenderAddress)}`;
      const permit2AllowanceHex = await rpcProviderWrapper.call(chainId, {
        to: PERMIT2_CONTRACT_ADDRESS,
        data: callDataPermit2,
      });

      let permit2Allowance = 0n;
      if (permit2AllowanceHex && permit2AllowanceHex.length >= 66) {
        // First 32 bytes contain uint160 amount
        permit2Allowance = BigInt('0x' + permit2AllowanceHex.slice(2, 66));
      }

      return { standardAllowance, permit2Allowance };
    } catch (err: any) {
      walletLogger.warn('PERMIT2_ALLOWANCE', `Permit2 allowance check error: ${err.message}`);
      return { standardAllowance: 0n, permit2Allowance: 0n };
    }
  }

  /**
   * Build Step 1: Standard ERC20.approve(permit2Address, uint256.max)
   */
  public buildApprovePermit2Transaction(tokenAddress: string) {
    const maxUint256 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const data = `0x095ea7b3${padAddress(PERMIT2_CONTRACT_ADDRESS)}${maxUint256}`;
    return {
      to: tokenAddress,
      data,
      value: '0x0',
    };
  }

  /**
   * Build Step 2: permit2.approve(token, router, amount, expiration)
   * Function selector: 0x87517c45
   */
  public buildPermit2RouterApproveTransaction(
    tokenAddress: string,
    routerAddress: string,
    amount: bigint = BigInt('1461501637330902918203684832716283019655932542975'), // uint160.max
    expirationSeconds: number = 86400 * 30 // 30 days
  ) {
    const expiration = Math.floor(Date.now() / 1000) + expirationSeconds;
    // approve(address token, address spender, uint160 amount, uint48 expiration)
    // selector: 0x87517c45
    const data = `0x87517c45${padAddress(tokenAddress)}${padAddress(routerAddress)}${pad32(amount)}${pad32(expiration)}`;
    return {
      to: PERMIT2_CONTRACT_ADDRESS,
      data,
      value: '0x0',
    };
  }

  /**
   * Build complete Uniswap V4 swap transaction via Universal Router
   * Based on: https://developers.uniswap.org/docs/protocols/v4/guides/swapping/swapping#configuring-universal-router-for-uniswap-v4swaps
   */
  public async buildV4SwapTransaction(params: {
    chainId: number;
    userAddress: string;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    minAmountOut: string;
    feeTier?: number;
    tickSpacing?: number;
    hookAddress?: string;
    deadlineMinutes?: number;
  }): Promise<PreparedV4SwapTransaction> {
    const routerAddress = UNIVERSAL_ROUTER_ADDRESSES[params.chainId] || UNIVERSAL_ROUTER_ADDRESSES[1];
    const isInputNative = !params.tokenIn.address || params.tokenIn.address === '0x0000000000000000000000000000000000000000' || params.tokenIn.symbol === 'ETH';
    const isOutputNative = !params.tokenOut.address || params.tokenOut.address === '0x0000000000000000000000000000000000000000' || params.tokenOut.symbol === 'ETH';

    const decimalsIn = params.tokenIn.decimals || 18;
    const decimalsOut = params.tokenOut.decimals || 18;

    const rawAmountIn = BigInt(Math.floor(parseFloat(params.amountIn) * 10 ** decimalsIn));
    let rawMinAmountOut = BigInt(Math.max(1, Math.floor(parseFloat(params.minAmountOut || '0') * 10 ** decimalsOut)));

    // Fallback minAmountOut calculation with 1% slippage
    if (rawMinAmountOut <= 1n && parseFloat(params.amountIn) > 0) {
      const inPrice = params.tokenIn.priceUSD || 1.0;
      const outPrice = params.tokenOut.priceUSD || 1.0;
      const estOut = (parseFloat(params.amountIn) * inPrice) / Math.max(0.00001, outPrice);
      rawMinAmountOut = BigInt(Math.max(1, Math.floor(estOut * 0.99 * 10 ** decimalsOut)));
    }

    // Step 1: Currency sorting & PoolKey configuration
    const sorted = this.sortCurrencies(
      isInputNative ? '0x0000000000000000000000000000000000000000' : params.tokenIn.address,
      isOutputNative ? '0x0000000000000000000000000000000000000000' : params.tokenOut.address
    );

    const poolKey: V4PoolKey = {
      currency0: sorted.currency0,
      currency1: sorted.currency1,
      fee: params.feeTier || 3000,
      tickSpacing: params.tickSpacing || (params.feeTier === 500 ? 10 : 60),
      hooks: params.hookAddress || '0x0000000000000000000000000000000000000000',
    };

    const zeroForOne = sorted.isTokenA0;

    // Step 2: Check Permit2 and ERC20 allowance if input is not native ETH
    let requiresPermit2Erc20Approval = false;
    let erc20ApprovalTx = undefined;
    let permit2ApproveTx = undefined;

    if (!isInputNative) {
      const allowances = await this.checkPermit2Allowance(
        params.chainId,
        params.tokenIn.address,
        params.userAddress,
        routerAddress
      );

      if (allowances.standardAllowance < rawAmountIn) {
        requiresPermit2Erc20Approval = true;
        erc20ApprovalTx = this.buildApprovePermit2Transaction(params.tokenIn.address);
      }

      if (allowances.permit2Allowance < rawAmountIn) {
        permit2ApproveTx = this.buildPermit2RouterApproveTransaction(params.tokenIn.address, routerAddress);
      }
    }

    // Step 3: Encode Universal Router commands
    // bytes memory commands = abi.encodePacked(uint8(Commands.V4_SWAP));
    const commandOpcode = '10'; // Commands.V4_SWAP = 0x10

    // Step 4: Encode V4Router actions
    // bytes memory actions = abi.encodePacked(
    //     uint8(Actions.SWAP_EXACT_IN_SINGLE),
    //     uint8(Actions.SETTLE_ALL),
    //     uint8(Actions.TAKE_ALL)
    // );
    const actionsHex = '060c0d'; // 0x06 (SWAP_EXACT_IN_SINGLE), 0x0c (SETTLE_ALL), 0x0d (TAKE_ALL)

    // Step 5: Prepare ABI encoded parameters for each action
    // params[0] = abi.encode(IV4Router.ExactInputSingleParams({ poolKey, zeroForOne, amountIn, amountOutMinimum, hookData }));
    const hookDataHex = '0x';
    const params0 = this.encodeExactInputSingleParams(poolKey, zeroForOne, rawAmountIn, rawMinAmountOut, hookDataHex);

    // params[1] = abi.encode(key.currency0, amountIn) for SETTLE_ALL
    const inputCurrency = zeroForOne ? poolKey.currency0 : poolKey.currency1;
    const params1 = `${padAddress(inputCurrency)}${pad32(rawAmountIn)}`;

    // params[2] = abi.encode(key.currency1, minAmountOut) for TAKE_ALL
    const outputCurrency = zeroForOne ? poolKey.currency1 : poolKey.currency0;
    const params2 = `${padAddress(outputCurrency)}${pad32(rawMinAmountOut)}`;

    // Combine actions and params into inputs[0] = abi.encode(actions, params)
    const inputs0 = this.encodeV4Inputs(actionsHex, [params0, params1, params2]);

    // Step 6: Encode router.execute(commands, inputs, deadline)
    const deadlineSeconds = (params.deadlineMinutes || 20) * 60;
    const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadlineSeconds;

    const executeCalldata = this.encodeExecuteFunction('0x' + commandOpcode, [inputs0], deadlineTimestamp);

    const nativeValue = isInputNative ? '0x' + rawAmountIn.toString(16) : '0x0';

    return {
      to: routerAddress,
      data: executeCalldata,
      value: nativeValue,
      chainId: params.chainId,
      requiresPermit2Erc20Approval,
      permit2Address: PERMIT2_CONTRACT_ADDRESS,
      erc20ApprovalTx,
      permit2ApproveTx,
      details: {
        commandOpcode: '0x' + commandOpcode,
        actionsHex: '0x' + actionsHex,
        poolKey,
        zeroForOne,
        amountIn: params.amountIn,
        minAmountOut: params.minAmountOut,
        deadlineTimestamp,
      },
    };
  }

  /**
   * Encodes IV4Router.ExactInputSingleParams
   */
  private encodeExactInputSingleParams(
    key: V4PoolKey,
    zeroForOne: boolean,
    amountIn: bigint,
    amountOutMinimum: bigint,
    hookData: string
  ): string {
    // ExactInputSingleParams struct offset layout:
    // Offset 0: poolKey (tuple) -> currency0, currency1, fee, tickSpacing, hooks
    // Offset 5: zeroForOne (bool)
    // Offset 6: amountIn (uint128)
    // Offset 7: amountOutMinimum (uint128)
    // Offset 8: hookData offset (bytes)

    const cleanHook = hookData.startsWith('0x') ? hookData.slice(2) : hookData;
    const hookBytesLen = cleanHook.length / 2;
    const hookPadded = padRight32(cleanHook);

    // PoolKey encoding:
    const c0 = padAddress(key.currency0);
    const c1 = padAddress(key.currency1);
    const fee = pad32(key.fee);
    // tickSpacing can be negative, pack as uint24/int24
    const tickSpacingHex = BigInt.asUintN(256, BigInt(key.tickSpacing)).toString(16).padStart(64, '0');
    const hooks = padAddress(key.hooks);

    const zfo = pad32(zeroForOne ? 1 : 0);
    const amtIn = pad32(amountIn);
    const amtOutMin = pad32(amountOutMinimum);

    // hookData offset is 9 * 32 = 288 = 0x120
    const hookOffset = pad32(288);
    const hookLenHex = pad32(hookBytesLen);

    return `${c0}${c1}${fee}${tickSpacingHex}${hooks}${zfo}${amtIn}${amtOutMin}${hookOffset}${hookLenHex}${hookPadded}`;
  }

  /**
   * Encodes inputs[0] = abi.encode(actions, params)
   */
  private encodeV4Inputs(actionsHex: string, paramsArray: string[]): string {
    const cleanActions = actionsHex.startsWith('0x') ? actionsHex.slice(2) : actionsHex;
    const actionsBytesLen = cleanActions.length / 2;
    const actionsPadded = padRight32(cleanActions);

    // Tuple has 2 fields: (bytes actions, bytes[] params)
    // Head 0: offset to actions = 64 (0x40)
    // Head 1: offset to params array
    const offsetActions = 64;
    const actionsSize = 32 + actionsPadded.length / 2; // length prefix + padded data
    const offsetParams = offsetActions + actionsSize;

    const head0 = pad32(offsetActions);
    const head1 = pad32(offsetParams);

    const actionsBody = `${pad32(actionsBytesLen)}${actionsPadded}`;

    // Encode bytes[] params
    const paramsCount = paramsArray.length;
    const paramsCountHex = pad32(paramsCount);

    let offsetWithinParams = paramsCount * 32;
    let paramsOffsets = '';
    let paramsData = '';

    for (let i = 0; i < paramsCount; i++) {
      const p = paramsArray[i].replace(/^0x/, '');
      const pLen = p.length / 2;
      const pPadded = padRight32(p);

      paramsOffsets += pad32(offsetWithinParams);
      const chunk = `${pad32(pLen)}${pPadded}`;
      paramsData += chunk;
      offsetWithinParams += chunk.length / 2;
    }

    const paramsBody = `${paramsCountHex}${paramsOffsets}${paramsData}`;

    return `${head0}${head1}${actionsBody}${paramsBody}`;
  }

  /**
   * Encodes UniversalRouter.execute(bytes commands, bytes[] inputs, uint256 deadline)
   * Selector: 0x3593564c
   */
  private encodeExecuteFunction(commandsHex: string, inputsHexArray: string[], deadline: number): string {
    const cleanCommands = commandsHex.startsWith('0x') ? commandsHex.slice(2) : commandsHex;
    const commandsLen = cleanCommands.length / 2;
    const commandsPadded = padRight32(cleanCommands);

    // execute has 3 parameters: (bytes commands, bytes[] inputs, uint256 deadline)
    // Head 0: offset to commands = 96 = 0x60
    // Head 1: offset to inputs = 96 + 32 + commandsPadded.length/2
    // Head 2: uint256 deadline
    const offsetCommands = 96;
    const commandsPartSize = 32 + commandsPadded.length / 2;
    const offsetInputs = offsetCommands + commandsPartSize;

    const head0 = pad32(offsetCommands);
    const head1 = pad32(offsetInputs);
    const head2 = pad32(deadline);

    const commandsPart = `${pad32(commandsLen)}${commandsPadded}`;

    // Encode inputs (bytes[])
    const inputsCount = inputsHexArray.length;
    const inputsCountHex = pad32(inputsCount);

    let currentElemOffset = inputsCount * 32;
    let offsetsHex = '';
    let elementsDataHex = '';

    for (let i = 0; i < inputsCount; i++) {
      const elem = inputsHexArray[i].replace(/^0x/, '');
      const elemByteLen = elem.length / 2;
      const elemPadded = padRight32(elem);

      offsetsHex += pad32(currentElemOffset);
      const elemChunk = `${pad32(elemByteLen)}${elemPadded}`;
      elementsDataHex += elemChunk;
      currentElemOffset += elemChunk.length / 2;
    }

    const inputsPart = `${inputsCountHex}${offsetsHex}${elementsDataHex}`;

    return `0x3593564c${head0}${head1}${head2}${commandsPart}${inputsPart}`;
  }
}

export const universalRouterV4Service = new UniversalRouterV4Service();
