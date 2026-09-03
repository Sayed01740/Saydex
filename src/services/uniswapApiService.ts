import { Token } from '../types';
import { walletLogger } from '../utils/walletLogger';

export interface UniswapQuoteRequest {
  type: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  amount: string;
  tokenInAddress: string;
  tokenInChainId: number;
  tokenOutAddress: string;
  tokenOutChainId: number;
  swapper?: string;
  slippageTolerance?: number;
  protocols?: Array<'V2' | 'V3' | 'V4' | 'MIXED'>;
  routingPreference?: 'BEST_PRICE' | 'FASTEST' | 'UNISWAPX';
}

export interface UniswapQuoteResponse {
  quoteId: string;
  amountOut: string;
  amountOutRaw: string;
  gasFeeUSD?: string;
  gasUseEstimate?: string;
  route: any[][];
  routeString?: string;
  priceImpact?: number;
  source: 'uniswap_api' | 'uniswap_x' | 'sor_auto_router';
  portionAmount?: string;
}

export interface UniswapSwapRequest {
  quote: any;
  signature?: string;
  permitData?: any;
  simulateTransaction?: boolean;
}

export interface UniswapSwapResponse {
  swap: {
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
  };
  gasFee?: string;
}

class UniswapApiService {
  private readonly baseUrl = 'https://trade-api.gateway.uniswap.org/v1';

  /**
   * Retrieves the Uniswap API Key from Vite environment variables or localStorage
   */
  public getApiKey(): string {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UNISWAP_API_KEY) || '';
    if (envKey && envKey !== 'YOUR_UNISWAP_API_KEY' && envKey.trim().length > 5) {
      return envKey.trim();
    }
    try {
      const stored = localStorage.getItem('unx_custom_uniswap_api_key');
      if (stored && stored.trim().length > 5) return stored.trim();
    } catch {}
    return '';
  }

  /**
   * Set custom API Key in runtime localStorage
   */
  public setApiKey(key: string): void {
    try {
      if (key && key.trim()) {
        localStorage.setItem('unx_custom_uniswap_api_key', key.trim());
      } else {
        localStorage.removeItem('unx_custom_uniswap_api_key');
      }
    } catch {}
  }

  /**
   * Returns whether a valid Uniswap API Key is configured
   */
  public hasApiKey(): boolean {
    return this.getApiKey().length > 0;
  }

  /**
   * Fetch optimal Smart Order Route & Quote from official Uniswap Trading API
   */
  public async getQuote(params: {
    chainId: number;
    tokenIn: Token;
    tokenOut: Token;
    amountIn: string;
    recipient?: string;
    slippageTolerance?: number;
  }): Promise<UniswapQuoteResponse | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const decimalsIn = params.tokenIn.decimals || 18;
    const decimalsOut = params.tokenOut.decimals || 18;
    const amountInRaw = BigInt(Math.floor(parseFloat(params.amountIn) * 10 ** decimalsIn)).toString();

    const addrIn = (!params.tokenIn.address || params.tokenIn.address === '0x0000000000000000000000000000000000000000')
      ? '0x0000000000000000000000000000000000000000'
      : params.tokenIn.address;

    const addrOut = (!params.tokenOut.address || params.tokenOut.address === '0x0000000000000000000000000000000000000000')
      ? '0x0000000000000000000000000000000000000000'
      : params.tokenOut.address;

    const body: UniswapQuoteRequest = {
      type: 'EXACT_INPUT',
      amount: amountInRaw,
      tokenInAddress: addrIn,
      tokenInChainId: params.chainId,
      tokenOutAddress: addrOut,
      tokenOutChainId: params.chainId,
      swapper: params.recipient || '0x0000000000000000000000000000000000000000',
      slippageTolerance: params.slippageTolerance || 0.5,
      protocols: ['V2', 'V3'],
      routingPreference: 'BEST_PRICE',
    };

    try {
      walletLogger.info('ROUTING_QUERY', `Querying Uniswap SOR Trading API for ${params.tokenIn.symbol} → ${params.tokenOut.symbol}`);

      const res = await fetch(`${this.baseUrl}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        walletLogger.warn('ROUTING_QUERY', `Uniswap API Quote failed (${res.status}): ${errorText.slice(0, 100)}`);
        return null;
      }

      const json = await res.json();
      const quoteData = json.quote || json;

      if (quoteData && quoteData.amount) {
        const rawOut = quoteData.amount;
        const formattedOut = Number(BigInt(rawOut)) / 10 ** decimalsOut;

        walletLogger.info(
          'ROUTING_QUERY',
          `Uniswap SOR returned optimal output ${formattedOut.toFixed(6)} ${params.tokenOut.symbol} (Price Impact: ${quoteData.priceImpact || '0'}%)`
        );

        return {
          quoteId: quoteData.quoteId || 'uniswap_sor_' + Date.now(),
          amountOut: formattedOut.toString(),
          amountOutRaw: rawOut,
          gasFeeUSD: quoteData.gasFeeUSD,
          gasUseEstimate: quoteData.gasUseEstimate,
          route: quoteData.route || [],
          routeString: quoteData.routeString || 'Uniswap V3 Auto Router SOR',
          priceImpact: parseFloat(quoteData.priceImpact) || 0,
          source: json.routing === 'DUTCH_LIMIT_ORDER' ? 'uniswap_x' : 'sor_auto_router',
        };
      }
    } catch (err: any) {
      walletLogger.warn('ROUTING_QUERY', `Uniswap Trading API unreachable, failing over to RPC: ${err?.message || err}`);
    }

    return null;
  }

  /**
   * Build Universal Router swap transaction directly via Uniswap Swap API
   */
  public async buildSwap(quotePayload: any): Promise<UniswapSwapResponse | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    try {
      const res = await fetch(`${this.baseUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          quote: quotePayload,
          simulateTransaction: true,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[UniswapApiService] Swap transaction build error:', err);
    }
    return null;
  }
}

export const uniswapApiService = new UniswapApiService();
