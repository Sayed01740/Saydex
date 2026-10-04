import { Token } from '../types';
import { getStableFXDeployment, isStableFXPair } from '../config/stableFXContracts';
import { rpcProviderWrapper } from '../utils/rpcProviderWrapper';
import { livePriceService } from './livePriceService';
import { walletLogger } from '../utils/walletLogger';

export interface StableFXQuoteResult {
  amountOut: number;
  amountOutRaw: bigint;
  executionPrice: number;
  gasEstimate: number;
  protocol: string;
  source: 'stablefx_rfq';
}

function padAddr(addr: string): string {
  return addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function padUint(val: bigint | number | string): string {
  return BigInt(val).toString(16).padStart(64, '0');
}

class StableFXService {
  /**
   * Check if pair is supported by Circle's native StableFX / Arc Router engine
   */
  public isSupported(chainId: number, tokenIn?: Token, tokenOut?: Token): boolean {
    if (!tokenIn || !tokenOut) return false;
    return isStableFXPair(chainId, tokenIn.symbol, tokenOut.symbol);
  }

  /**
   * Synchronous quote estimate using spot FX rates
   */
  public getQuote(
    chainId: number,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string
  ): StableFXQuoteResult {
    const parsedAmount = parseFloat(amountIn) || 0;
    const decimalsOut = tokenOut.decimals || 6;

    let rate = 1.0;
    const symIn = tokenIn.symbol.toUpperCase();
    const symOut = tokenOut.symbol.toUpperCase();

    // Arc testnet pool spot rate ~ 0.8225 EURC per USDC / 1.2147 USDC per EURC
    if (symIn === 'USDC' && symOut === 'EURC') {
      rate = 0.822531;
    } else if (symIn === 'EURC' && symOut === 'USDC') {
      rate = 1.214786;
    } else if (symIn === 'USDC' && symOut === 'USYC') {
      rate = 1 / 1.05;
    } else if (symIn === 'USYC' && symOut === 'USDC') {
      rate = 1.05;
    } else if (symIn === 'EURC' && symOut === 'USYC') {
      rate = 1.08 / 1.05;
    } else if (symIn === 'USYC' && symOut === 'EURC') {
      rate = 1.05 / 1.08;
    } else {
      const pIn = tokenIn.priceUSD || livePriceService.getCachedPrice(tokenIn)?.priceUSD || 1.0;
      const pOut = tokenOut.priceUSD || livePriceService.getCachedPrice(tokenOut)?.priceUSD || 1.0;
      rate = pIn / Math.max(0.000001, pOut);
    }

    const calculatedOut = parsedAmount * rate;
    const rawOut = BigInt(Math.floor(calculatedOut * 10 ** decimalsOut));

    return {
      amountOut: calculatedOut,
      amountOutRaw: rawOut,
      executionPrice: rate,
      gasEstimate: 85000,
      protocol: 'Circle StableFX (Native)',
      source: 'stablefx_rfq',
    };
  }

  /**
   * Live on-chain quote from Arc's Native Router pool
   * getAmountOut(address tokenIn, address tokenOut, uint256 amountIn)
   */
  public async getOnChainQuote(
    chainId: number,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string
  ): Promise<StableFXQuoteResult> {
    const deployment = getStableFXDeployment(chainId);
    const parsedAmount = parseFloat(amountIn) || 0;
    const decimalsIn = tokenIn.decimals || 6;
    const decimalsOut = tokenOut.decimals || 6;
    const rawAmountIn = BigInt(Math.floor(parsedAmount * 10 ** decimalsIn));

    if (!deployment || rawAmountIn <= 0n) {
      return this.getQuote(chainId, tokenIn, tokenOut, amountIn);
    }

    try {
      const tokenInAddr = tokenIn.address || '0x3600000000000000000000000000000000000000';
      const tokenOutAddr = tokenOut.address || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

      // getAmountOut(address,address,uint256) selector: 0x4aa06652
      const data = `0x4aa06652${padAddr(tokenInAddr)}${padAddr(tokenOutAddr)}${padUint(rawAmountIn)}`;

      const resHex = await rpcProviderWrapper.call(chainId, {
        to: deployment.routerAddress,
        data,
      });

      if (resHex && resHex !== '0x' && resHex !== '0x0') {
        const rawOut = BigInt(resHex);
        if (rawOut > 0n) {
          const calculatedOut = Number(rawOut) / 10 ** decimalsOut;
          const rate = parsedAmount > 0 ? calculatedOut / parsedAmount : 1.0;
          return {
            amountOut: calculatedOut,
            amountOutRaw: rawOut,
            executionPrice: rate,
            gasEstimate: 85000,
            protocol: 'Circle StableFX (Native)',
            source: 'stablefx_rfq',
          };
        }
      }
    } catch (err: any) {
      walletLogger.warn('ROUTING_QUERY', `On-chain Arc Router quote failed (${err.message}), falling back to spot rate.`);
    }

    return this.getQuote(chainId, tokenIn, tokenOut, amountIn);
  }

  /**
   * Check allowance for token transfer to Router
   */
  public async checkAllowance(
    chainId: number,
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<bigint> {
    try {
      const cleanOwner = padAddr(ownerAddress);
      const cleanSpender = padAddr(spenderAddress);
      // allowance(address,address) selector: 0xdd62ed3e
      const data = `0xdd62ed3e${cleanOwner}${cleanSpender}`;

      const resHex = await rpcProviderWrapper.call(chainId, {
        to: tokenAddress,
        data,
      });

      if (resHex && resHex !== '0x') {
        return BigInt(resHex);
      }
      return 0n;
    } catch {
      return 0n;
    }
  }

  /**
   * Build approve transaction calldata (ERC20.approve(spender, maxUint256))
   */
  public buildApproveTransaction(tokenAddress: string, spenderAddress: string) {
    const cleanSpender = padAddr(spenderAddress);
    const maxUint256 = 'f'.repeat(64);
    // approve(address,uint256) selector: 0x095ea7b3
    const data = `0x095ea7b3${cleanSpender}${maxUint256}`;

    return {
      to: tokenAddress,
      data,
      value: '0x0',
    };
  }

  /**
   * Build atomic Arc DEX swap transaction calldata
   * swap((address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address to, uint256 deadline))
   */
  public async buildSwapTransaction(params: {
    chainId: number;
    userAddress: string;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    amountOutMin: string;
  }) {
    const deployment = getStableFXDeployment(params.chainId);
    if (!deployment) {
      throw new Error(`Circle StableFX is not deployed on Chain ID ${params.chainId}`);
    }

    const routerAddress = deployment.routerAddress;
    const decimalsIn = params.tokenIn.decimals || 6;
    const decimalsOut = params.tokenOut.decimals || 6;
    const rawAmountIn = BigInt(Math.floor(parseFloat(params.amountIn) * 10 ** decimalsIn));
    
    // Calculate rawMinAmountOut safely
    const parsedMinOut = parseFloat(params.amountOutMin) || 0;
    const rawMinAmountOut = parsedMinOut > 0 
      ? BigInt(Math.floor(parsedMinOut * 10 ** decimalsOut))
      : 1n;

    const tokenInAddr = params.tokenIn.address || '0x3600000000000000000000000000000000000000';
    const tokenOutAddr = params.tokenOut.address || '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

    // 1. Check token allowance to Arc Router
    let requiresApproval = false;
    let approvalTx = undefined;

    if (params.userAddress && params.userAddress !== '0x0000000000000000000000000000000000000000') {
      const currentAllowance = await this.checkAllowance(
        params.chainId,
        tokenInAddr,
        params.userAddress,
        routerAddress
      );

      if (currentAllowance < rawAmountIn) {
        requiresApproval = true;
        approvalTx = this.buildApproveTransaction(tokenInAddr, routerAddress);
      }
    }

    // 2. Build on-chain trade execution on Arc Router
    // swap((address,address,uint256,uint256,address,uint256)) selector: 0x56e87df9
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
    const tradeData = `0x56e87df9${padAddr(tokenInAddr)}${padAddr(tokenOutAddr)}${padUint(rawAmountIn)}${padUint(rawMinAmountOut)}${padAddr(params.userAddress)}${padUint(deadline)}`;

    walletLogger.info(
      'ROUTING_QUERY',
      `Built Arc StableFX swap transaction: ${params.amountIn} ${params.tokenIn.symbol} -> ${params.tokenOut.symbol} via Router (${routerAddress})`
    );

    return {
      to: routerAddress,
      data: tradeData,
      value: '0x0',
      chainId: params.chainId,
      requiresApproval,
      approvalTx,
      protocol: 'Circle StableFX (Native)',
    };
  }
}

export const stableFXService = new StableFXService();
