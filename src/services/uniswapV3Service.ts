import { rpcProviderWrapper } from '../utils/rpcProviderWrapper';
import { getUniswapV3Deployment, UNISWAP_V3_DEPLOYMENTS } from '../config/uniswapV3Contracts';
import { Token } from '../types';
import { walletLogger } from '../utils/walletLogger';
import { uniswapApiService } from './uniswapApiService';
import { getChainById } from '../config/chains';

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
   * Check if a Uniswap V3 Pool exists on-chain via Factory.getPool(tokenA, tokenB, fee)
   */
  public async getPoolAddress(
    chainId: number,
    tokenA: string,
    tokenB: string,
    fee: number
  ): Promise<string | null> {
    const deployment = getUniswapV3Deployment(chainId);
    if (!deployment?.factory) return null;

    try {
      // getPool(address,address,uint24) selector: 0x1698ee82
      const data = `0x1698ee82${padAddress(tokenA)}${padAddress(tokenB)}${pad32Bytes(fee)}`;
      const resultHex = await rpcProviderWrapper.call(chainId, {
        to: deployment.factory,
        data,
      });

      if (resultHex && resultHex.length >= 66) {
        const poolAddr = '0x' + resultHex.slice(26, 66).toLowerCase();
        if (poolAddr !== '0x0000000000000000000000000000000000000000') {
          return poolAddr;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Find any pool across standard fee tiers (3000, 500, 10000, 100)
   */
  public async findAnyPool(
    chainId: number,
    tokenA: string,
    tokenB: string
  ): Promise<{ address: string; fee: number } | null> {
    const tiers = [3000, 500, 10000, 100];
    for (const tier of tiers) {
      const pool = await this.getPoolAddress(chainId, tokenA, tokenB, tier);
      if (pool) {
        return { address: pool, fee: tier };
      }
    }
    return null;
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

    const nativeSym = getChainById(chainId)?.nativeCurrency?.symbol?.toUpperCase() || 'ETH';
    const isNativeIn =
      !tokenIn.address ||
      tokenIn.address === '0x0000000000000000000000000000000000000000' ||
      tokenIn.symbol.toUpperCase() === 'ETH' ||
      tokenIn.symbol.toUpperCase() === nativeSym ||
      tokenIn.symbol.toUpperCase() === 'SEP';

    const isNativeOut =
      !tokenOut.address ||
      tokenOut.address === '0x0000000000000000000000000000000000000000' ||
      tokenOut.symbol.toUpperCase() === 'ETH' ||
      tokenOut.symbol.toUpperCase() === nativeSym ||
      tokenOut.symbol.toUpperCase() === 'SEP';

    const isArc = chainId === 5042 || chainId === 5042002;

    const isWrap = !isArc && isNativeIn && (
      tokenOut.symbol.toUpperCase() === 'WETH' ||
      (tokenOut.address && tokenOut.address.toLowerCase() === deployment?.wethAddress.toLowerCase())
    );

    const isUnwrap = !isArc && (
      tokenIn.symbol.toUpperCase() === 'WETH' ||
      (tokenIn.address && tokenIn.address.toLowerCase() === deployment?.wethAddress.toLowerCase())
    ) && isNativeOut;

    // Instant 1:1 rate for Wrap (ETH -> WETH) & Unwrap (WETH -> ETH)
    if (isWrap || isUnwrap) {
      return {
        amountOut: parsedAmount,
        amountOutRaw: amountInRaw,
        feeTier: 0,
        gasEstimate: isWrap ? 45000 : 50000,
        source: 'onchain_quoter',
      };
    }

    // Resolve address, wrapping native ETH to WETH for Uniswap quoter
    const addrIn = (!tokenIn.address || tokenIn.address === '0x0000000000000000000000000000000000000000')
      ? (deployment?.wethAddress || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
      : tokenIn.address;

    const addrOut = (!tokenOut.address || tokenOut.address === '0x0000000000000000000000000000000000000000')
      ? (deployment?.wethAddress || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
      : tokenOut.address;

    // Check tiers in optimal liquidity order: requested tier, 500, 3000, 100, 10000
    const tiersToTest = [feeTier, 500, 3000, 100, 10000].filter((v, i, a) => a.indexOf(v) === i);

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

    // 2. Direct On-Chain QuoterV2 parallel invocation across fee tiers
    if (deployment?.quoterV2) {
      const tierPromises = tiersToTest.map(async (tier) => {
        try {
          // QuoterV2 quoteExactInputSingle params:
          // (address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)
          // selector: 0xc6a5026a
          const paramsCalldata = `${padAddress(addrIn)}${padAddress(addrOut)}${pad32Bytes(amountInRaw)}${pad32Bytes(tier)}${pad32Bytes(0)}`;
          const quoterCall = `0xc6a5026a${paramsCalldata}`;

          const resultHex = await rpcProviderWrapper.call(chainId, {
            to: deployment.quoterV2,
            data: quoterCall,
          });

          if (resultHex && resultHex.length >= 66) {
            const amountOutHex = '0x' + resultHex.slice(2, 66);
            const rawOut = BigInt(amountOutHex);
            const formattedOut = Number(rawOut) / 10 ** decimalsOut;
            if (formattedOut > 0) {
              return {
                amountOut: formattedOut,
                amountOutRaw: rawOut,
                feeTier: tier,
                gasEstimate: 155000,
                source: 'onchain_quoter' as const,
              };
            }
          }
        } catch {
          // Tier empty or pool does not exist
        }
        return null;
      });

      const settled = await Promise.allSettled(tierPromises);
      let bestResult: OnChainQuoteResult | null = null;
      for (const res of settled) {
        if (res.status === 'fulfilled' && res.value) {
          if (!bestResult || res.value.amountOutRaw > bestResult.amountOutRaw) {
            bestResult = res.value;
          }
        }
      }

      if (bestResult) {
        walletLogger.info(
          'RPC_DISPATCH',
          `QuoterV2 found best rate: ${bestResult.amountOut.toFixed(6)} ${tokenOut.symbol} (fee tier ${bestResult.feeTier}) for ${amountIn} ${tokenIn.symbol} on Chain #${chainId}`
        );
        return bestResult;
      }
    }

    // High precision mathematical fallback quote if RPC/Quoter is temporarily unreachable
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
      gasEstimate: 130000,
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
   * Follows official Uniswap web app execution specification:
   * - Native ETH In: multicall([exactInputSingle, refundETH])
   * - Native ETH Out: multicall([exactInputSingle, unwrapWETH9])
   * - ERC20 to ERC20: exactInputSingle
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
    const fee = params.feeTier || (params.chainId === 11155111 || params.chainId === 421614 ? 500 : 3000);

    const nativeSym = getChainById(params.chainId)?.nativeCurrency?.symbol?.toUpperCase() || 'ETH';

    const isNativeIn =
      !params.tokenIn.address ||
      params.tokenIn.address === '0x0000000000000000000000000000000000000000' ||
      params.tokenIn.symbol.toUpperCase() === 'ETH' ||
      params.tokenIn.symbol.toUpperCase() === nativeSym ||
      params.tokenIn.symbol.toUpperCase() === 'SEP';

    const isNativeOut =
      !params.tokenOut.address ||
      params.tokenOut.address === '0x0000000000000000000000000000000000000000' ||
      params.tokenOut.symbol.toUpperCase() === 'ETH' ||
      params.tokenOut.symbol.toUpperCase() === nativeSym ||
      params.tokenOut.symbol.toUpperCase() === 'SEP';

    const decimalsIn = params.tokenIn.decimals || 18;
    const decimalsOut = params.tokenOut.decimals || 18;

    const rawAmountIn = BigInt(Math.floor(parseFloat(params.amountIn) * 10 ** decimalsIn));
    let rawMinAmountOut = BigInt(Math.max(0, Math.floor(parseFloat(params.minAmountOut || '0') * 10 ** decimalsOut)));

    // Protection against unrealistic minimum output that causes router revert
    const slippagePct = params.slippagePercent !== undefined ? params.slippagePercent : 1.0;
    if (rawMinAmountOut === 0n && parseFloat(params.amountIn) > 0) {
      const inPrice = params.tokenIn.priceUSD || 1.0;
      const outPrice = params.tokenOut.priceUSD || 1.0;
      const estOut = (parseFloat(params.amountIn) * inPrice) / Math.max(0.000001, outPrice);
      const withSlippage = estOut * ((100 - slippagePct) / 100);
      rawMinAmountOut = BigInt(Math.max(1, Math.floor(withSlippage * 10 ** decimalsOut)));
    }

    const isArc = params.chainId === 5042 || params.chainId === 5042002;

    // Direct Native Wrap (ETH -> WETH) - Disabled on Arc since USDC is native and dual-interfaced
    const isWrap = !isArc && isNativeIn && (
      params.tokenOut.symbol.toUpperCase() === 'WETH' ||
      (params.tokenOut.address && params.tokenOut.address.toLowerCase() === deployment.wethAddress.toLowerCase())
    );

    // Direct Native Unwrap (WETH -> ETH) - Disabled on Arc
    const isUnwrap = !isArc && (
      params.tokenIn.symbol.toUpperCase() === 'WETH' ||
      (params.tokenIn.address && params.tokenIn.address.toLowerCase() === deployment.wethAddress.toLowerCase())
    ) && isNativeOut;

    if (isWrap) {
      return {
        to: deployment.wethAddress,
        data: '0xd0e30db0', // WETH9.deposit()
        value: '0x' + rawAmountIn.toString(16),
        chainId: params.chainId,
        requiresApproval: false,
        approvalTx: undefined,
      };
    }

    if (isUnwrap) {
      return {
        to: deployment.wethAddress,
        data: `0x2e1a7d4d${pad32Bytes(rawAmountIn)}`, // WETH9.withdraw(uint256)
        value: '0x0',
        chainId: params.chainId,
        requiresApproval: false,
        approvalTx: undefined,
      };
    }

    const tokenInAddress = isNativeIn ? deployment.wethAddress : params.tokenIn.address;
    const tokenOutAddress = isNativeOut ? deployment.wethAddress : params.tokenOut.address;

    // Check token allowance if not paying in native ETH (On Arc, native USDC uses the 0x3600... system contract)
    let requiresApproval = false;
    let approvalTx = undefined;

    if (isArc) {
      const tokenToCheck = isNativeIn ? deployment.wethAddress : params.tokenIn.address;
      const currentAllowance = await this.checkAllowance(
        params.chainId,
        tokenToCheck,
        params.userAddress,
        routerAddress
      );
      if (currentAllowance < rawAmountIn) {
        requiresApproval = true;
        approvalTx = this.buildApproveTransaction(tokenToCheck, routerAddress);
      }
    } else if (!isNativeIn) {
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
    const recipient = (isNativeOut && !isArc) ? routerAddress : params.userAddress;
    const exactInputSingleParams = `${padAddress(tokenInAddress)}${padAddress(tokenOutAddress)}${pad32Bytes(fee)}${padAddress(recipient)}${pad32Bytes(rawAmountIn)}${pad32Bytes(rawMinAmountOut)}${pad32Bytes(0)}`;
    const exactInputSingleCall = `0x04e45aaf${exactInputSingleParams}`;

    let finalData = exactInputSingleCall;
    let finalValue = '0x0';

    if (isArc) {
      // On Arc, all swaps execute through the ERC-20 interface directly without wrapping
      finalData = exactInputSingleCall;
      finalValue = '0x0';
    } else if (isNativeIn) {
      // ETH -> Token: Bundle exactInputSingle with refundETH() (selector: 0x12210e8a)
      const refundETHCall = '0x12210e8a';
      finalData = this.encodeMulticall([exactInputSingleCall, refundETHCall]);
      finalValue = '0x' + rawAmountIn.toString(16);
    } else if (isNativeOut) {
      // Token -> ETH: Swap to Router as WETH, then unwrapWETH9(minOut, recipient) (selector: 0x49404b7c)
      const unwrapCall = `0x49404b7c${pad32Bytes(rawMinAmountOut)}${padAddress(params.userAddress)}`;
      finalData = this.encodeMulticall([exactInputSingleCall, unwrapCall]);
      finalValue = '0x0';
    } else {
      // ERC20 -> ERC20: direct exactInputSingle
      finalData = exactInputSingleCall;
      finalValue = '0x0';
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
   * Pre-flight simulation for swap transaction before prompting user wallet
   */
  public async simulateSwapTransaction(params: {
    chainId: number;
    from: string;
    to: string;
    data: string;
    value: string;
  }): Promise<{ success: boolean; error?: string; estimatedGas?: number; rawResult?: string }> {
    try {
      // 1. Try estimateGas for accurate on-chain simulation and gas limits
      const gasEstimateHex = await rpcProviderWrapper.estimateGas(params.chainId, {
        from: params.from,
        to: params.to,
        value: params.value || '0x0',
        data: params.data || '0x',
      });
      const gasUnits = parseInt(gasEstimateHex, 16);
      return { success: true, estimatedGas: isNaN(gasUnits) ? 185000 : gasUnits };
    } catch (err: any) {
      // 2. If estimateGas fails, check eth_call to extract exact EVM revert reason
      try {
        const callResult = await rpcProviderWrapper.call(params.chainId, {
          from: params.from,
          to: params.to,
          value: params.value || '0x0',
          data: params.data || '0x',
        });
        return { success: true, estimatedGas: 185000, rawResult: callResult };
      } catch (callErr: any) {
        let msg = callErr.message || err.message || 'Swap simulation reverted on-chain.';
        if (msg.includes('Too little received') || msg.includes('TF')) {
          msg = 'Too little received: Slippage tolerance exceeded. The on-chain pool price moved.';
        } else if (msg.includes('STF')) {
          msg = 'SafeTransferFrom failed: Token approval not confirmed or insufficient balance.';
        }
        return { success: false, error: msg };
      }
    }
  }

  /**
   * Pre-flight verify and optimize swap:
   * Simulates the transaction and if it reverts due to tick rounding or slippage,
   * automatically adjusts rawMinAmountOut safely to match the exact live pool state.
   */
  public async buildAndVerifySwapTransaction(params: {
    chainId: number;
    userAddress: string;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    minAmountOut: string;
    feeTier?: number;
    deadlineMinutes?: number;
    slippagePercent?: number;
    forceSimulation?: boolean;
  }): Promise<{ preparedTx: PreparedSwapTransaction; estimatedGas: number }> {
    const deployment = getUniswapV3Deployment(params.chainId);
    const slippagePct = params.slippagePercent !== undefined ? params.slippagePercent : 1.0;
    let effectiveFee = params.feeTier || (params.chainId === 11155111 || params.chainId === 421614 ? 500 : 3000);
    let effectiveMinAmountOut = params.minAmountOut;

    if (params.forceSimulation) {
      const preparedTx = await this.buildSwapTransaction({
        ...params,
        feeTier: effectiveFee,
        minAmountOut: effectiveMinAmountOut,
      });
      return { preparedTx, estimatedGas: 125000 };
    }

    const nativeSym = getChainById(params.chainId)?.nativeCurrency?.symbol?.toUpperCase() || 'ETH';
    const isNativeIn =
      !params.tokenIn.address ||
      params.tokenIn.address === '0x0000000000000000000000000000000000000000' ||
      params.tokenIn.symbol.toUpperCase() === 'ETH' ||
      params.tokenIn.symbol.toUpperCase() === nativeSym;

    const isNativeOut =
      !params.tokenOut.address ||
      params.tokenOut.address === '0x0000000000000000000000000000000000000000' ||
      params.tokenOut.symbol.toUpperCase() === 'ETH' ||
      params.tokenOut.symbol.toUpperCase() === nativeSym;

    const isWrap = isNativeIn && (
      params.tokenOut.symbol.toUpperCase() === 'WETH' ||
      (deployment && params.tokenOut.address && params.tokenOut.address.toLowerCase() === deployment.wethAddress.toLowerCase())
    );

    const isUnwrap = (
      params.tokenIn.symbol.toUpperCase() === 'WETH' ||
      (deployment && params.tokenIn.address && params.tokenIn.address.toLowerCase() === deployment.wethAddress.toLowerCase())
    ) && isNativeOut;

    // Verify liquidity pool exists if this is an AMM swap (not Wrap/Unwrap) on a custom chain
    if (!isWrap && !isUnwrap && deployment?.factory) {
      const tokenInAddr = isNativeIn ? deployment.wethAddress : params.tokenIn.address;
      const tokenOutAddr = isNativeOut ? deployment.wethAddress : params.tokenOut.address;
      const existingPool = await this.findAnyPool(params.chainId, tokenInAddr, tokenOutAddr);
      if (!existingPool) {
        throw new Error(
          `No Uniswap V3 liquidity pool exists for ${params.tokenIn.symbol} / ${params.tokenOut.symbol} on ${deployment.chainName || 'this network'}. Please initialize the pool and deposit liquidity first.`
        );
      }
      effectiveFee = existingPool.fee;
    }

    // 1. Fetch live on-chain quote right before building to ensure fee tier & pool reserves match exactly
    try {
      const liveQuote = await this.getOnChainQuote(
        params.chainId,
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        effectiveFee
      );

      if (liveQuote && liveQuote.amountOutRaw > 0n && liveQuote.source === 'onchain_quoter') {
        effectiveFee = liveQuote.feeTier;
        const decimalsOut = params.tokenOut.decimals || 18;
        const rawMinOut = (liveQuote.amountOutRaw * BigInt(Math.floor((100 - slippagePct) * 100))) / 10000n;
        effectiveMinAmountOut = (Number(rawMinOut) / 10 ** decimalsOut).toFixed(decimalsOut > 6 ? 6 : decimalsOut);
      }
    } catch (quoteErr: any) {
      walletLogger.warn('ROUTING_QUERY', `Pre-build on-chain quote query bypassed: ${quoteErr.message}`);
    }

    let preparedTx = await this.buildSwapTransaction({
      ...params,
      feeTier: effectiveFee,
      minAmountOut: effectiveMinAmountOut,
    });

    // If approval is required, skip swap simulation until approval is complete
    if (preparedTx.requiresApproval) {
      return { preparedTx, estimatedGas: 185000 };
    }

    if (!params.userAddress) {
      return { preparedTx, estimatedGas: 185000 };
    }

    try {
      // Run pre-flight simulation
      const sim = await this.simulateSwapTransaction({
        chainId: params.chainId,
        from: params.userAddress,
        to: preparedTx.to,
        data: preparedTx.data,
        value: preparedTx.value,
      });

      if (sim.success) {
        return {
          preparedTx,
          estimatedGas: sim.estimatedGas || 185000,
        };
      }

      // If failed with slippage ("Too little received"), automatically adjust minAmountOut and retry
      if (sim.error?.includes('Too little received') || sim.error?.includes('Slippage tolerance exceeded')) {
        walletLogger.warn('TRANSACTION_LIFECYCLE', 'Pre-flight simulation detected slippage revert. Auto-adjusting to pool reserves...');
        
        const liveQuote = await this.getOnChainQuote(
          params.chainId,
          params.tokenIn,
          params.tokenOut,
          params.amountIn,
          effectiveFee
        );

        if (liveQuote && liveQuote.amountOutRaw > 0n) {
          const retrySlippage = slippagePct + 0.5;
          const adjustedMinRaw = (liveQuote.amountOutRaw * BigInt(Math.floor((100 - retrySlippage) * 100))) / 10000n;
          const decimalsOut = params.tokenOut.decimals || 18;
          const adjustedMinFormatted = (Number(adjustedMinRaw) / 10 ** decimalsOut).toFixed(6);

          preparedTx = await this.buildSwapTransaction({
            ...params,
            minAmountOut: adjustedMinFormatted,
            feeTier: liveQuote.feeTier,
          });

          const retrySim = await this.simulateSwapTransaction({
            chainId: params.chainId,
            from: params.userAddress,
            to: preparedTx.to,
            data: preparedTx.data,
            value: preparedTx.value,
          });

          if (retrySim.success) {
            walletLogger.info('TRANSACTION_LIFECYCLE', 'Pre-flight auto-adjusted successfully! Proceeding with swap.');
            return {
              preparedTx,
              estimatedGas: retrySim.estimatedGas || 185000,
            };
          }
        }
      }

      // If simulation note exists, log and fall back gracefully with safe gas so wallet can open
      walletLogger.warn('TRANSACTION_LIFECYCLE', `Simulation note: ${sim.error}. Proceeding with wallet confirmation.`);
      return {
        preparedTx,
        estimatedGas: 220000,
      };
    } catch (err: any) {
      walletLogger.warn('TRANSACTION_LIFECYCLE', `Pre-flight check error: ${err.message}. Proceeding to wallet.`);
      return {
        preparedTx,
        estimatedGas: 220000,
      };
    }
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

    const nativeSym = getChainById(params.chainId)?.nativeCurrency?.symbol?.toUpperCase() || 'ETH';
    const isNative0 = !params.token0.address || params.token0.address === '0x0000000000000000000000000000000000000000' || params.token0.symbol.toUpperCase() === 'ETH' || params.token0.symbol.toUpperCase() === nativeSym;
    const isNative1 = !params.token1.address || params.token1.address === '0x0000000000000000000000000000000000000000' || params.token1.symbol.toUpperCase() === 'ETH' || params.token1.symbol.toUpperCase() === nativeSym;

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
   * Query real on-chain position details from NonfungiblePositionManager
   */
  public async getOnChainPositionLiquidity(chainId: number, tokenId: string | number): Promise<bigint> {
    const deployment = getUniswapV3Deployment(chainId) || UNISWAP_V3_DEPLOYMENTS[11155111];
    const npmAddress = deployment.nonfungiblePositionManager;
    const numTokenId = BigInt(parseInt(String(tokenId).replace(/\D/g, '')) || 1);

    // positions(uint256) selector: 0x99fbab88
    const callData = `0x99fbab88${pad32Bytes(numTokenId)}`;
    try {
      const res = await rpcProviderWrapper.call(chainId, {
        to: npmAddress,
        data: callData,
      });

      if (res && res.length >= 2 + 64 * 8) {
        // Return tuple: word 7 (0-indexed) is uint128 liquidity
        const clean = res.replace(/^0x/, '');
        const liquidityHex = clean.slice(64 * 7, 64 * 8);
        return BigInt('0x' + liquidityHex);
      }
    } catch (e) {
      walletLogger.warn('BALANCE_QUERY', `Failed reading on-chain liquidity for tokenId #${tokenId}: ${e}`);
    }
    return 0n;
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

  /**
   * Extract minted ERC-721 tokenId from Uniswap NonfungiblePositionManager receipt logs
   */
  public parseTokenIdFromReceipt(receipt: any): string | null {
    if (!receipt || !Array.isArray(receipt.logs)) return null;

    // 1. Check ERC-721 Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const ZERO_ADDRESS_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';

    for (const log of receipt.logs) {
      if (
        log.topics &&
        log.topics[0]?.toLowerCase() === TRANSFER_TOPIC.toLowerCase() &&
        log.topics[1]?.toLowerCase() === ZERO_ADDRESS_TOPIC.toLowerCase() &&
        log.topics[3]
      ) {
        try {
          const tokenIdDec = BigInt(log.topics[3]).toString(10);
          if (tokenIdDec && tokenIdDec !== '0') {
            walletLogger.info('TRANSACTION_LIFECYCLE', `Discovered minted Uniswap V3 NFT Token ID: #${tokenIdDec}`);
            return tokenIdDec;
          }
        } catch {}
      }
    }

    // 2. Check IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)
    const INCREASE_LIQ_TOPIC = '0x3067048beee31b25b2f1681f88dac838c8bba36af25bfb2b7cf7473a5847e35f';
    for (const log of receipt.logs) {
      if (log.topics && log.topics[0]?.toLowerCase() === INCREASE_LIQ_TOPIC.toLowerCase() && log.topics[1]) {
        try {
          const tokenIdDec = BigInt(log.topics[1]).toString(10);
          if (tokenIdDec && tokenIdDec !== '0') {
            walletLogger.info('TRANSACTION_LIFECYCLE', `Discovered Uniswap V3 Token ID from IncreaseLiquidity: #${tokenIdDec}`);
            return tokenIdDec;
          }
        } catch {}
      }
    }

    return null;
  }
}

export const uniswapV3Service = new UniswapV3Service();
