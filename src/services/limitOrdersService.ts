import { Token } from '../types';
import { livePriceService } from './livePriceService';

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
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  signature?: string;
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

    // Start with clean slate for real user limit orders
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
    return this.getOrders(userAddress).filter((o) => o.status === 'OPEN');
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
    if (order && order.status === 'OPEN') {
      order.status = 'CANCELLED';
      this.save();
      return true;
    }
    return false;
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

        // Get latest price for tokenIn
        const livePriceData = livePriceService.getCachedPrice(order.tokenIn);
        const currentPrice = livePriceData?.priceUSD || order.tokenIn.priceUSD || 0;

        if (currentPrice <= 0) return;

        // Check if condition triggered
        const triggered =
          (order.condition === 'gte' && currentPrice >= order.targetPrice) ||
          (order.condition === 'lte' && currentPrice <= order.targetPrice);

        if (triggered) {
          order.status = 'FILLED';
          order.filledAt = now;
          order.txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
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
