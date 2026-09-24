import { Token } from '../types';
import { livePriceService } from './livePriceService';
import { uniswapV3Service } from './uniswapV3Service';

export interface LimitOrder {
  id: string;
  userAddress: string;
  chainId: number;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  minAmountOut: string;
  targetPrice: number; // In terms of tokenOut per tokenIn or USD
  currentPriceAtCreation: number;
  condition: 'gte' | 'lte'; // greater than or equal (take profit) or less than or equal (buy dip)
  status: 'OPEN' | 'READY' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  signature?: string;
  signedAt?: number;
  filledAt?: number;
  txHash?: string;
}

type OrderListener = (orders: LimitOrder[]) => void;

class LimitOrdersService {
  private orders: LimitOrder[] = [];
  private listeners: Set<OrderListener> = new Set();
  private monitorInterval: any = null;

  constructor() {
    try {
      const saved = localStorage.getItem('saydex_limit_orders_v2');
      if (saved) {
        this.orders = JSON.parse(saved);
      }
    } catch {}

    // Start background monitor matching active limit orders against live market prices
    this.startPriceMonitor();
  }

  private save() {
    try {
      localStorage.setItem('saydex_limit_orders_v2', JSON.stringify(this.orders));
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.orders]));
  }

  public subscribe(listener: OrderListener): () => void {
    this.listeners.add(listener);
    listener([...this.orders]);
    return () => this.listeners.delete(listener);
  }

  public getOrders(userAddress?: string): LimitOrder[] {
    if (!userAddress) return this.orders;
    return this.orders.filter(
      (o) => o.userAddress.toLowerCase() === userAddress.toLowerCase()
    );
  }

  public getOpenOrders(userAddress?: string): LimitOrder[] {
    return this.getOrders(userAddress).filter((o) => o.status === 'OPEN' || o.status === 'READY');
  }

  public createLimitOrder(order: Omit<LimitOrder, 'id' | 'createdAt' | 'status'>): LimitOrder {
    const newOrder: LimitOrder = {
      ...order,
      id: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now(),
      status: 'OPEN',
    };

    this.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public cancelOrder(orderId: string): boolean {
    const order = this.orders.find((o) => o.id === orderId);
    if (order && (order.status === 'OPEN' || order.status === 'READY')) {
      order.status = 'CANCELLED';
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Executes a limit order on-chain using Uniswap V3 Router with user's wallet
   */
  public async executeOrderOnChain(
    orderId: string,
    sendTransactionFn: (tx: any) => Promise<any>,
    chainId: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };
    if (order.status !== 'OPEN' && order.status !== 'READY') {
      return { success: false, error: `Order is already ${order.status.toLowerCase()}` };
    }

    try {
      const swapTx = await uniswapV3Service.buildSwapTransaction({
        chainId,
        userAddress: order.userAddress,
        tokenIn: order.tokenIn,
        tokenOut: order.tokenOut,
        amountIn: order.amountIn,
        minAmountOut: order.minAmountOut,
        slippagePercent: 1.0,
      });

      const txResult = await sendTransactionFn({
        to: swapTx.to,
        value: swapTx.value,
        data: swapTx.data,
        title: `Execute Limit Order: ${order.amountIn} ${order.tokenIn.symbol} → ${order.tokenOut.symbol}`,
      });

      const txHash = txResult?.hash || (typeof txResult === 'string' ? txResult : null);
      if (!txHash) {
        throw new Error('Transaction submission failed to return a hash');
      }

      const receipt = await uniswapV3Service.waitForReceipt(chainId, txHash);
      if (receipt.status === 0 || receipt.status === '0x0') {
        throw new Error('Execution transaction reverted on-chain');
      }

      order.status = 'FILLED';
      order.filledAt = Date.now();
      order.txHash = receipt.transactionHash || txHash;
      this.save();

      return { success: true, txHash: order.txHash };
    } catch (err: any) {
      console.error('[LimitOrdersService] On-chain execution failed:', err);
      return { success: false, error: err.message || 'On-chain execution failed' };
    }
  }

  /**
   * Continuous background monitor matching active limit orders against live market prices
   */
  private startPriceMonitor() {
    if (this.monitorInterval) clearInterval(this.monitorInterval);

    this.monitorInterval = setInterval(() => {
      const now = Date.now();
      let hasUpdates = false;

      this.orders.forEach((order) => {
        if (order.status !== 'OPEN') return;

        // Check expiration
        if (order.expiresAt > 0 && now >= order.expiresAt) {
          order.status = 'EXPIRED';
          hasUpdates = true;
          return;
        }

        // Get latest price for tokenIn & tokenOut
        const inPriceData = livePriceService.getCachedPrice(order.tokenIn);
        const outPriceData = livePriceService.getCachedPrice(order.tokenOut);

        const inPrice = inPriceData?.priceUSD || order.tokenIn.priceUSD || 0;
        const outPrice = outPriceData?.priceUSD || order.tokenOut.priceUSD || 1;

        if (inPrice <= 0) return;

        // Current exchange rate (tokenOut per tokenIn)
        const currentRate = inPrice / Math.max(0.000001, outPrice);

        // Check if condition triggered
        const triggered =
          (order.condition === 'gte' && (currentRate >= order.targetPrice || inPrice >= order.targetPrice)) ||
          (order.condition === 'lte' && (currentRate <= order.targetPrice || inPrice <= order.targetPrice));

        if (triggered) {
          // Mark order as READY for on-chain execution
          order.status = 'READY';
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        this.save();
      }
    }, 10000);
  }
}

export const limitOrdersService = new LimitOrdersService();

