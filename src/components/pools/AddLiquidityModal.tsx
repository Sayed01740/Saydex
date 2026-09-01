import React, { useState, useMemo } from 'react';
import { LiquidityPool, FeeTier, Token } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { getChainById, NATIVE_TOKEN_PRICES_USD } from '../../config/chains';
import { walletLogger } from '../../utils/walletLogger';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TokenIcon } from '../common/TokenIcon';
import { RangeVisualizer } from './RangeVisualizer';
import { Sparkles, Info, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool?: LiquidityPool;
}

export const AddLiquidityModal: React.FC<AddLiquidityModalProps> = ({
  isOpen,
  onClose,
  pool,
}) => {
  const { isConnected, nativeBalance, usdcBalance, updateBalances, walletChainId } = useWallet();
  const { tokens, addPosition, addTransaction, addToast } = useProtocol();

  // selectedPool must be declared before any chain validation that references it
  const selectedPool = pool || {
    id: 'eth-usdc-005',
    chainId: 1,
    token0: tokens[0], // ETH
    token1: tokens[1], // USDC
    feeTier: 500 as FeeTier,
    feePercent: 0.05,
    tvlUSD: 1480000000,
    volume24hUSD: 420500000,
    fees24hUSD: 210250,
    apr: 18.4,
    currentPrice: NATIVE_TOKEN_PRICES_USD.ETH,
    priceRangeMin: 3100.0,
    priceRangeMax: 3950.0,
    liquidityDistribution: [],
  };

  // RC-42: All chain IDs must match before allowing liquidity deposit
  const poolChainId = selectedPool.chainId;
  const chainMismatch = isConnected && walletChainId !== null && walletChainId !== poolChainId;
  const poolChainName = getChainById(poolChainId).name;


  const [feeTier, setFeeTier] = useState<FeeTier>(selectedPool.feeTier);
  const [rangePreset, setRangePreset] = useState<'tight' | 'standard' | 'wide' | 'full'>('standard');
  const [amount0, setAmount0] = useState<string>('0.5');

  // Dynamic range boundaries
  const { minPrice, maxPrice } = useMemo(() => {
    const cur = selectedPool.currentPrice;
    if (rangePreset === 'tight') return { minPrice: cur * 0.95, maxPrice: cur * 1.05 };
    if (rangePreset === 'standard') return { minPrice: cur * 0.9, maxPrice: cur * 1.15 };
    if (rangePreset === 'wide') return { minPrice: cur * 0.8, maxPrice: cur * 1.3 };
    return { minPrice: cur * 0.5, maxPrice: cur * 2.0 };
  }, [selectedPool.currentPrice, rangePreset]);

  // Dual token ratio calculation
  const amount1 = useMemo(() => {
    const num0 = parseFloat(amount0) || 0;
    return (num0 * selectedPool.currentPrice).toFixed(2);
  }, [amount0, selectedPool.currentPrice]);

  const estimatedAPR = useMemo(() => {
    const base = feeTier === 500 ? 21.5 : feeTier === 3000 ? 34.2 : 12.0;
    const multiplier = rangePreset === 'tight' ? 1.6 : rangePreset === 'standard' ? 1.2 : 0.8;
    return (base * multiplier).toFixed(1);
  }, [feeTier, rangePreset]);

  const handleDeposit = () => {
    // RC-42: Block transaction if pool chain !== wallet chain
    if (chainMismatch) {
      addToast({
        type: 'error',
        title: 'Wrong Network',
        description: `This pool is on ${poolChainName}. Please switch your wallet to ${poolChainName} before adding liquidity.`,
      });
      walletLogger.error('TRANSACTION_LIFECYCLE', 'Liquidity add blocked: chain mismatch', {
        walletChainId,
        poolChainId,
        poolId: selectedPool.id,
      });
      return;
    }

    const num0 = parseFloat(amount0) || 0;
    const num1 = parseFloat(amount1) || 0;
    const totalUSD = num0 * selectedPool.token0.priceUSD + num1 * selectedPool.token1.priceUSD;

    walletLogger.info('TRANSACTION_LIFECYCLE', 'Adding liquidity position', {
      chainId: walletChainId,
      poolId: selectedPool.id,
      token0: selectedPool.token0.symbol,
      token1: selectedPool.token1.symbol,
      amount0: num0,
      amount1: num1,
    });

    addPosition({
      poolId: selectedPool.id,
      token0: selectedPool.token0,
      token1: selectedPool.token1,
      feeTier: feeTier,
      priceMin: parseFloat(minPrice.toFixed(2)),
      priceMax: parseFloat(maxPrice.toFixed(2)),
      currentPrice: selectedPool.currentPrice,
      inRange: true,
      amount0: num0,
      amount1: num1,
      unclaimedFeesUSD: 0,
      totalValueUSD: totalUSD,
      apr: parseFloat(estimatedAPR),
    });

    // RC-39: Post-transaction — trigger balance refresh (updateBalances now calls refetch)
    updateBalances(0, 0);

    onClose();
  };

  const feeTiersList: { tier: FeeTier; label: string; desc: string; share: string }[] = [
    { tier: 100, label: '0.01%', desc: 'Best for very stable pairs (USDC/USDT)', share: '12%' },
    { tier: 500, label: '0.05%', desc: 'Best for correlated pairs (ETH/USDC)', share: '68%' },
    { tier: 3000, label: '0.30%', desc: 'Best for standard pairs (WBTC/ETH)', share: '18%' },
    { tier: 10000, label: '1.00%', desc: 'Best for exotic tokens', share: '2%' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Liquidity: ${selectedPool.token0.symbol} / ${selectedPool.token1.symbol}`}
      subtitle="Provide concentrated liquidity to earn proportional swap fees."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Fee Tier Selector */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
            Select Fee Tier
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {feeTiersList.map((f) => (
              <button
                key={f.tier}
                onClick={() => setFeeTier(f.tier)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  feeTier === f.tier
                    ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-app)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono">{f.label}</span>
                  <span className="text-[10px] text-[var(--primary)] font-semibold">{f.share}</span>
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1 line-clamp-1">
                  {f.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Range Preset Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Concentration Width
            </span>
            <span className="text-[11px] font-mono text-[var(--primary)] font-semibold">
              Est. APR: ~{estimatedAPR}%
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'tight', label: 'Tight (±5%)' },
              { id: 'standard', label: 'Standard (±10%)' },
              { id: 'wide', label: 'Wide (±20%)' },
              { id: 'full', label: 'Full Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setRangePreset(p.id as any)}
                className={`py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  rangePreset === p.id
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--primary)] text-[var(--primary)] font-semibold'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Visualizer */}
        <RangeVisualizer
          currentPrice={selectedPool.currentPrice}
          priceMin={parseFloat(minPrice.toFixed(2))}
          priceMax={parseFloat(maxPrice.toFixed(2))}
          token0Symbol={selectedPool.token0.symbol}
          token1Symbol={selectedPool.token1.symbol}
        />

        {/* Deposit Amounts Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
              <span>{selectedPool.token0.symbol} Deposit</span>
              <span>Bal: {nativeBalance.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                className="w-full bg-transparent font-mono text-lg font-bold text-[var(--text-primary)] focus:outline-none"
                placeholder="0.0"
              />
              <TokenIcon symbol={selectedPool.token0.symbol} icon={selectedPool.token0.icon} size="xs" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
              <span>{selectedPool.token1.symbol} Required</span>
              <span>Bal: ${usdcBalance.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={amount1}
                readOnly
                className="w-full bg-transparent font-mono text-lg font-bold text-[var(--text-primary)] focus:outline-none"
              />
              <TokenIcon symbol={selectedPool.token1.symbol} icon={selectedPool.token1.icon} size="xs" />
            </div>
          </div>
        </div>

        {/* Chain mismatch warning (RC-42) */}
        {chainMismatch && (
          <div className="p-2.5 rounded-xl bg-[var(--error-subtle)] border border-[var(--error)]/30 flex items-center gap-2 text-xs text-[var(--error)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              This pool is on <strong>{poolChainName}</strong>. Your wallet is on a different network.
              Switch to {poolChainName} to add liquidity.
            </span>
          </div>
        )}

        {/* Deposit Action Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!amount0 || parseFloat(amount0) <= 0 || chainMismatch}
          onClick={handleDeposit}
        >
          {chainMismatch
            ? `Switch to ${poolChainName}`
            : 'Mint Concentrated Liquidity Position'}
        </Button>
      </div>
    </Modal>
  );
};
