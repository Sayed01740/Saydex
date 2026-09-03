import { rpcProviderWrapper } from '../utils/rpcProviderWrapper';
import { getUniswapV3Deployment, UNISWAP_V3_DEPLOYMENTS } from '../config/uniswapV3Contracts';
import { Token } from '../types';
import { walletLogger } from '../utils/walletLogger';
import { uniswapApiService } from './uniswapApiService';

/**
 * Helper: pad hex string to 32 bytes (64 hex characters)
 */
function pad32Bytes(value: string | number | bigint): string {
  let hex: string;
  if (typeof value === 'number' || typeof value === 'bigint') {
    hex = value.toString(16);
  } else {
    hex = value.replace(/^0x/, '');
  }
  return hex.padStart(64, '0');
}

/**
 * Helper: pad address to 32 bytes
 */
function padAddress(address: string): string {
  return address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

export interface OnChainQuoteResult {
  amountOut: number;
  amountOutRaw: bigint;
  feeTier: number;
  gasEstimate: number;
  source: 'onchain_quoter' | 'fallback_math';
}

export interface PreparedSwapTransaction {
  to: string;
  data: string;
  value: string;
  chainId: number;
  requiresApproval: boolean;
  approvalTx?: {
    to: string;
    data: string;
    value: string;
  };
}

export class UniswapV3Service {
  /**
   * Check if user has approved router to spend ERC-20 token
   */
  public async checkAllowance(
    chainId: number,
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<bigint> {
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      return BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'); // Native token requires no approval
    }

    // allowance(owner, spender) selector: 0xdd62ed3e
    const callData = `0xdd62ed3e${padAddress(ownerAddress)}${padAddress(spenderAddress)}`;

    try {
      const resultHex = await rpcProviderWrapper.call(chainId, {
        to: tokenAddress,
        data: callData,
      });

      if (resultHex && resultHex !== '0x') {
        return BigInt(resultHex);
      }
      return 0n;
    } catch (err: any) {
      walletLogger.warn('BALANCE_QUERY', `Failed checking allowance for ${tokenAddress} on chain ${chainId}: ${err.message}`);
      return 0n;
    }
  }

  /**
   * Build approve transaction calldata for ERC-20 token
   */
  public buildApproveTransaction(
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')
  ) {
    // approve(spender, amount) selector: 0x095ea7b3
    const data = `0x095ea7b3${padAddress(spenderAddress)}${pad32Bytes(amount)}`;
    return {
      to: tokenAddress,
      data,
      value: '0x0',
    };
  }

  /**
   * Gasless On-Chain Quoting via QuoterV2 / QuoterV1
   */
  public async getOnChainQuote(
    chainId: number,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    feeTier: number = 3000
  ): Promise<OnChainQuoteResult> {
    const deployment = getUniswapV3Deployment(chainId);
    const parsedAmount = parseFloat(amountIn) || 0;
    if (parsedAmount <= 0) {
      return {
        amountOut: 0,
        amountOutRaw: 0n,
        feeTier,
        gasEstimate: 125000,
        source: 'fallback_math',
      };
    }

    const decimalsIn = tokenIn.decimals || 18;
    const decimalsOut = tokenOut.decimals || 18;
    const amountInRaw = BigInt(Math.floor(parsedAmount * 10 ** decimalsIn));

    // Resolve address, wrapping native ETH to WETH for Uniswap quoter
    const addrIn = (!tokenIn.address || tokenIn.address === '0x0000000000000000000000000000000000000000')
      ? (deployment?.wethAddress || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
      : tokenIn.address;

    const addrOut = (!tokenOut.address || tokenOut.address === '0x0000000000000000000000000000000000000000')
      ? (deployment?.wethAddress || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
      : tokenOut.address;

    // Check tiers: prioritize requested tier, then check 500, 3000, 10000
    const tiersToTest = Array.from(new Set([feeTier, 3000, 500, 10000]));

    // 1. Check official Uniswap Trading API (SOR / Auto Router / UniswapX) if API Key is configured
    if (uniswapApiService.hasApiKey()) {
      try {
        const apiQuote = await uniswapApiService.getQuote({
          chainId,
          tokenIn,
          tokenOut,
          amountIn,
        });

        if (apiQuote && parseFloat(apiQuote.amountOut) > 0) {
          return {
            amountOut: parseFloat(apiQuote.amountOut),
            amountOutRaw: BigInt(apiQuote.amountOutRaw || '0'),
            feeTier,
            gasEstimate: parseInt(apiQuote.gasUseEstimate || '130000', 10),
            source: 'onchain_quoter',
          };
        }
      } catch (e) {
        walletLogger.warn('ROUTING_QUERY', 'Uniswap API quote attempt errored, proceeding with on-chain QuoterV2');
      }
    }

    // 2. Direct On-Chain QuoterV2 invocation via RPC Provider
    if (deployment?.quoterV2) {
      let bestResult: OnChainQuoteResult | null = null;

      for (const tier of tiersToTest) {
        try {
          // QuoterV2 quoteExactInputSingle params struct:
          // (address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)
          // selector: 0xc6a5026a
          const paramsCalldata = `${padAddress(addrIn)}${padAddress(addrOut)}${pad32Bytes(amountInRaw)}${pad32Bytes(tier)}${pad32Bytes(0)}`;
          const quoterCall = `0xc6a5026a${paramsCalldata}`;

          const resultHex = await rpcProviderWrapper.call(chainId, {
            to: deployment.quoterV2,
            data: quoterCall,
          });

          if (resultHex && resultHex.length >= 66) {
            // First 32 bytes is amountOut
            const amountOutHex = '0x' + resultHex.slice(2, 66);
            const rawOut = BigInt(amountOutHex);
            const formattedOut = Number(rawOut) / 10 ** decimalsOut;

            if (formattedOut > 0) {
              walletLogger.info(
                'RPC_DISPATCH',
                `On-Chain Quoter returned ${formattedOut.toFixed(4)} ${tokenOut.symbol} (feeTier ${tier}) for ${amountIn} ${tokenIn.symbol} on Chain ${chainId}`
              );

              const currentTierResult: OnChainQuoteResult = {
                amountOut: formattedOut,
                amountOutRaw: rawOut,
                feeTier: tier,
                gasEstimate: 145000,
                source: 'onchain_quoter',
              };

              if (!bestResult || currentTierResult.amountOutRaw > bestResult.amountOutRaw) {
                bestResult = currentTierResult;
              }
            }
          }
        } catch (err: any) {
          // Pool does not exist at this specific fee tier or empty, try next tier
        }
      }

      if (bestResult) {
        return bestResult;
      }
    }

    // High precision mathematical fallback quote if on-chain pool is not yet created
    const inPrice = tokenIn.priceUSD || 1.0;
    const outPrice = tokenOut.priceUSD || 1.0;
    const rate = inPrice / Math.max(0.000001, outPrice);
    const feeDiscount = (1000000 - feeTier) / 1000000;
    const calculatedOut = parsedAmount * rate * feeDiscount;
    const calculatedRaw = BigInt(Math.floor(calculatedOut * 10 ** decimalsOut));

    return {
      amountOut: calculatedOut,
      amountOutRaw: calculatedRaw,
      feeTier,
      gasEstimate: 120000,
      source: 'fallback_math',
    };
  }

  /**
   * Wait for a transaction receipt by polling with automatic RPC failover
   */
  public async waitForReceipt(chainId: number, txHash: string, maxWaitMs: number = 60000) {
    return rpcProviderWrapper.waitForTransactionReceipt(chainId, txHash, maxWaitMs);
  }

  /**
   * Build Real Swap Transaction Calldata for Uniswap SwapRouter02
   */
  public async buildSwapTransaction(params: {
    chainId: number;
    userAddress: string;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    minAmountOut: string;
    feeTier?: number;
    deadlineMinutes?: number;
    slippagePercent?: number;
  }): Promise<PreparedSwapTransaction> {
    const deployment = getUniswapV3Deployment(params.chainId) || UNISWAP_V3_DEPLOYMENTS[11155111];
    const routerAddress = deployment.swapRouter02;
    const fee = params.feeTier || 3000;
    const deadline = Math.floor(Date.now() / 1000) + (params.deadlineMinutes || 20) * 60;

    const isNativeIn =
      !params.tokenIn.address ||
      params.tokenIn.address === '0x0000000000000000000000000000000000000000' ||
      params.tokenIn.symbol.toUpperCase() === 'ETH' ||
      params.tokenIn.symbol.toUpperCase() === 'SEP';

    const isNativeOut =
      !params.tokenOut.address ||
      params.tokenOut.address === '0x0000000000000000000000000000000000000000' ||
      params.tokenOut.symbol.toUpperCase() === 'ETH' ||
      params.tokenOut.symbol.toUpperCase() === 'SEP';

    const decimalsIn = params.tokenIn.decimals || 18;
    const decimalsOut = params.tokenOut.decimals || 18;

    const rawAmountIn = BigInt(Math.floor(parseFloat(params.amountIn) * 10 ** decimalsIn));
    let rawMinAmountOut = BigInt(Math.max(0, Math.floor(parseFloat(params.minAmountOut || '0') * 10 ** decimalsOut)));

    // Protection against unrealistic minimum output that causes router revert
    const slippagePct = params.slippagePercent !== undefined ? params.slippagePercent : 2.5;
    if (rawMinAmountOut === 0n && parseFloat(params.amountIn) > 0) {
      const inPrice = params.tokenIn.priceUSD || 1.0;
      const outPrice = params.tokenOut.priceUSD || 1.0;
      const estOut = (parseFloat(params.amountIn) * inPrice) / Math.max(0.000001, outPrice);
      const withSlippage = estOut * ((100 - slippagePct) / 100);
      rawMinAmountOut = BigInt(Math.max(1, Math.floor(withSlippage * 10 ** decimalsOut)));
    }

    const tokenInAddress = isNativeIn ? deployment.wethAddress : params.tokenIn.address;
    const tokenOutAddress = isNativeOut ? deployment.wethAddress : params.tokenOut.address;

    // Check token allowance if not paying in native ETH
    let requiresApproval = false;
    let approvalTx = undefined;

    if (!isNativeIn) {
      const currentAllowance = await this.checkAllowance(
        params.chainId,
        params.tokenIn.address,
        params.userAddress,
        routerAddress
      );
      if (currentAllowance < rawAmountIn) {
        requiresApproval = true;
        approvalTx = this.buildApproveTransaction(params.tokenIn.address, routerAddress);
      }
    }

    // exactInputSingle params:
    // (address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)
    // selector: 0x04e45aaf
    const recipient = isNativeOut ? '0x0000000000000000000000000000000000000002' : params.userAddress; // 2 indicates SwapRouter router unwraps WETH to user
    const exactInputSingleParams = `${padAddress(tokenInAddress)}${padAddress(tokenOutAddress)}${pad32Bytes(fee)}${padAddress(recipient)}${pad32Bytes(rawAmountIn)}${pad32Bytes(rawMinAmountOut)}${pad32Bytes(0)}`;
    const exactInputSingleCall = `0x04e45aaf${exactInputSingleParams}`;

    let finalData = exactInputSingleCall;
    let finalValue = isNativeIn ? '0x' + rawAmountIn.toString(16) : '0x0';

    // If native token output, bundle with unwrapWETH9 via multicall if supported
    if (isNativeOut) {
      // unwrapWETH9(uint256 amountMinimum, address recipient) selector: 0x49404b7c
      const unwrapCall = `0x49404b7c${pad32Bytes(rawMinAmountOut)}${padAddress(params.userAddress)}`;
      // multicall(bytes[] data)
      finalData = this.encodeMulticall([exactInputSingleCall, unwrapCall]);
    }

    return {
      to: routerAddress,
      data: finalData,
      value: finalValue,
      chainId: params.chainId,
      requiresApproval,
      approvalTx,
    };
  }

  /**
   * Helper: encode multicall(bytes[]) for SwapRouter02
   */
  private encodeMulticall(calls: string[]): string {
    // multicall(bytes[]) selector: 0xac9650d8
    let offsets = '';
    let callDataBodies = '';

    let currentOffset = calls.length * 32;
    calls.forEach((c) => {
      const clean = c.replace(/^0x/, '');
      const byteLength = clean.length / 2;
      offsets += pad32Bytes(currentOffset);
      const callChunk = `${pad32Bytes(byteLength)}${clean.padEnd(Math.ceil(clean.length / 64) * 64, '0')}`;
      callDataBodies += callChunk;
      currentOffset += callChunk.length / 2;
    });

    return `0xac9650d8${pad32Bytes(32)}${pad32Bytes(calls.length)}${offsets}${callDataBodies}`;
  }

  /**
   * Build Uniswap V3 LP Mint Transaction (NonfungiblePositionManager.mint)
   */
  public async buildMintLiquidityTransaction(params: {
    chainId: number;
    userAddress: string;
    token0: Token;
    token1: Token;
    feeTier: number;
    tickLower: number;
    tickUpper: number;
    amount0Desired: string;
    amount1Desired: string;
    deadlineMinutes?: number;
  }) {
    const deployment = getUniswapV3Deployment(params.chainId) || UNISWAP_V3_DEPLOYMENTS[11155111];
    const npmAddress = deployment.nonfungiblePositionManager;
    const deadline = Math.floor(Date.now() / 1000) + (params.deadlineMinutes || 30) * 60;

    const raw0 = BigInt(Math.floor(parseFloat(params.amount0Desired) * 10 ** (params.token0.decimals || 18)));
    const raw1 = BigInt(Math.floor(parseFloat(params.amount1Desired) * 10 ** (params.token1.decimals || 18)));

    const isNative0 = !params.token0.address || params.token0.address === '0x0000000000000000000000000000000000000000' || params.token0.symbol === 'ETH';
    const isNative1 = !params.token1.address || params.token1.address === '0x0000000000000000000000000000000000000000' || params.token1.symbol === 'ETH';

    const addr0 = isNative0 ? deployment.wethAddress : params.token0.address;
    const addr1 = isNative1 ? deployment.wethAddress : params.token1.address;

    // Ensure tokens are ordered by address as required by Uniswap V3
    const isToken0Smaller = addr0.toLowerCase() < addr1.toLowerCase();
    const [t0Addr, t1Addr] = isToken0Smaller ? [addr0, addr1] : [addr1, addr0];
    const [t0IsNative, t1IsNative] = isToken0Smaller ? [isNative0, isNative1] : [isNative1, isNative0];
    const [amt0, amt1] = isToken0Smaller ? [raw0, raw1] : [raw1, raw0];

    // Check approvals for non-native tokens
    let requiresApproval0 = false;
    let requiresApproval1 = false;

    if (!t0IsNative) {
      const allowance0 = await this.checkAllowance(params.chainId, t0Addr, params.userAddress, npmAddress);
      requiresApproval0 = allowance0 < amt0;
    }

    if (!t1IsNative) {
      const allowance1 = await this.checkAllowance(params.chainId, t1Addr, params.userAddress, npmAddress);
      requiresApproval1 = allowance1 < amt1;
    }

    // mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline))
    // selector: 0x88316456
    const tickLowerHex = BigInt.asUintN(256, BigInt(params.tickLower)).toString(16).padStart(64, '0');
    const tickUpperHex = BigInt.asUintN(256, BigInt(params.tickUpper)).toString(16).padStart(64, '0');

    // Slippage 2.5%
    const amt0Min = (amt0 * 975n) / 1000n;
    const amt1Min = (amt1 * 975n) / 1000n;

    const mintParams = `${padAddress(t0Addr)}${padAddress(t1Addr)}${pad32Bytes(params.feeTier)}${tickLowerHex}${tickUpperHex}${pad32Bytes(amt0)}${pad32Bytes(amt1)}${pad32Bytes(amt0Min)}${pad32Bytes(amt1Min)}${padAddress(params.userAddress)}${pad32Bytes(deadline)}`;
    const mintCall = `0x88316456${mintParams}`;

    const nativeValue = t0IsNative ? amt0 : t1IsNative ? amt1 : 0n;
    let finalData = mintCall;
    let finalValue = nativeValue > 0n ? '0x' + nativeValue.toString(16) : '0x0';

    if (nativeValue > 0n) {
      // Bundle mint + refundETH via multicall
      finalData = this.encodeMulticall([mintCall, '0x12210e8a']);
    }

    return {
      to: npmAddress,
      data: finalData,
      value: finalValue,
      requiresApproval0,
      requiresApproval1,
      token0ApprovalTx: requiresApproval0 ? this.buildApproveTransaction(t0Addr, npmAddress) : undefined,
      token1ApprovalTx: requiresApproval1 ? this.buildApproveTransaction(t1Addr, npmAddress) : undefined,
    };
  }

  /**
   * Build Uniswap V3 Fee Collection Calldata (NonfungiblePositionManager.collect)
   */
  public buildCollectFeesTransaction(params: {
    chainId: number;
    userAddress: string;
    tokenId: string | number;
    amount0Max?: string;
    amount1Max?: string;
  }) {
    const deployment = getUniswapV3Deployment(params.chainId) || UNISWAP_V3_DEPLOYMENTS[11155111];
    const npmAddress = deployment.nonfungiblePositionManager;

    const numTokenId = BigInt(parseInt(String(params.tokenId).replace(/\D/g, '')) || 1);
    const maxUint128 = 'ffffffffffffffffffffffffffffffff';
    const a0Max = params.amount0Max ? pad32Bytes(BigInt(params.amount0Max)) : pad32Bytes('0x' + maxUint128);
    const a1Max = params.amount1Max ? pad32Bytes(BigInt(params.amount1Max)) : pad32Bytes('0x' + maxUint128);

    // collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max))
    // selector: 0xfc6f7865
    const collectParams = `${pad32Bytes(numTokenId)}${padAddress(params.userAddress)}${a0Max}${a1Max}`;
    const data = `0xfc6f7865${collectParams}`;

    return {
      to: npmAddress,
      data,
      value: '0x0',
    };
  }

  /**
   * Build Uniswap V3 Decrease Liquidity Calldata (NonfungiblePositionManager.decreaseLiquidity)
   */
  public buildDecreaseLiquidityTransaction(params: {
    chainId: number;
    userAddress: string;
    tokenId: string | number;
    liquidity: string;
    deadlineMinutes?: number;
  }) {
    const deployment = getUniswapV3Deployment(params.chainId) || UNISWAP_V3_DEPLOYMENTS[11155111];
    const npmAddress = deployment.nonfungiblePositionManager;
    const deadline = Math.floor(Date.now() / 1000) + (params.deadlineMinutes || 30) * 60;

    const numTokenId = BigInt(parseInt(String(params.tokenId).replace(/\D/g, '')) || 1);
    const rawLiquidity = BigInt(params.liquidity || '1000000000000');

    // decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline))
    // selector: 0x0c53c51c
    const decParams = `${pad32Bytes(numTokenId)}${pad32Bytes(rawLiquidity)}${pad32Bytes(0)}${pad32Bytes(0)}${pad32Bytes(deadline)}`;
    const decCall = `0x0c53c51c${decParams}`;

    // Also bundle collect call to withdraw the freed tokens
    const maxUint128 = 'ffffffffffffffffffffffffffffffff';
    const collectParams = `${pad32Bytes(numTokenId)}${padAddress(params.userAddress)}${pad32Bytes('0x' + maxUint128)}${pad32Bytes('0x' + maxUint128)}`;
    const collectCall = `0xfc6f7865${collectParams}`;

    const data = this.encodeMulticall([decCall, collectCall]);

    return {
      to: npmAddress,
      data,
      value: '0x0',
    };
  }
}

export const uniswapV3Service = new UniswapV3Service();
