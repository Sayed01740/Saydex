import React, { useState, useMemo } from 'react';
import { LiquidityPool, FeeTier, Token } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TokenIcon } from '../common/TokenIcon';
import { RangeVisualizer } from './RangeVisualizer';
import { Sparkles, Info, ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { uniswapV3Service } from '../../services/uniswapV3Service';
import { getUniswapV3Deployment } from '../../config/uniswapV3Contracts';
import { UNISWAP_TOKENS } from '../../data/uniswapTokens';

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
  const {
    isConnected,
    ethBalance,
    usdcBalance,
    address,
    isRealExtensionConnected,
    updateBalances,
    sendTransaction,
    selectedChain,
  } = useWallet();
  const { tokens, addPosition, addTransaction, saveCustomPool } = useProtocol();

  const chainTokens = useMemo(() => {
    return UNISWAP_TOKENS.filter((t) => t.chainId === selectedChain.id || t.chainId === 1);
  }, [selectedChain.id]);

  const defaultToken0 = chainTokens[0] || tokens[0];
  const defaultToken1 = chainTokens.find((t) => t.symbol === 'USDC' || t.symbol === 'USDT') || chainTokens[1] || tokens[1];

  const selectedPool = pool || {
    id: `${defaultToken0.symbol.toLowerCase()}-${defaultToken1.symbol.toLowerCase()}-005`,
    chainId: selectedChain.id,
    token0: defaultToken0,
    token1: defaultToken1,
    feeTier: 500 as FeeTier,
    feePercent: 0.05,
    tvlUSD: 850000,
    volume24hUSD: 240000,
    fees24hUSD: 120,
    apr: 18.4,
    currentPrice: defaultToken1.priceUSD > 0 ? defaultToken0.priceUSD / defaultToken1.priceUSD : 3482.5,
    priceRangeMin: 3100.0,
    priceRangeMax: 3950.0,
    liquidityDistribution: [],
  };

  const [feeTier, setFeeTier] = useState<FeeTier>(selectedPool.feeTier);
  const [rangePreset, setRangePreset] = useState<'tight' | 'standard' | 'wide' | 'full'>('standard');
  const [amount0, setAmount0] = useState<string>('0.5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

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

  const handleDeposit = async () => {
    const num0 = parseFloat(amount0) || 0;
    const num1 = parseFloat(amount1) || 0;
    const totalUSD = num0 * selectedPool.token0.priceUSD + num1 * selectedPool.token1.priceUSD;

    try {
      setErrorMsg('');
      setIsSubmitting(true);

      const targetChainId = selectedPool.chainId || selectedChain.id;
      const tickSpacing = feeTier === 100 ? 1 : feeTier === 500 ? 10 : feeTier === 3000 ? 60 : 200;
      const safeMin = Math.max(0.000001, minPrice);
      const safeMax = Math.max(safeMin * 1.01, maxPrice);
      const tickLower = Math.floor(Math.log(safeMin) / Math.log(1.0001) / tickSpacing) * tickSpacing;
      const tickUpper = Math.ceil(Math.log(safeMax) / Math.log(1.0001) / tickSpacing) * tickSpacing;

      // Build real Uniswap V3 mint transaction
      const mintTx = await uniswapV3Service.buildMintLiquidityTransaction({
        chainId: targetChainId,
        userAddress: address || '0x0000000000000000000000000000000000000000',
        token0: selectedPool.token0,
        token1: selectedPool.token1,
        feeTier,
        tickLower,
        tickUpper,
        amount0Desired: amount0,
        amount1Desired: amount1,
        deadlineMinutes: 30,
      });

      // Handle token approvals if needed
      if (isRealExtensionConnected) {
        if (mintTx.requiresApproval0 && mintTx.token0ApprovalTx) {
          const app0Res = await sendTransaction({
            to: mintTx.token0ApprovalTx.to,
            value: mintTx.token0ApprovalTx.value,
            data: mintTx.token0ApprovalTx.data,
            chainId: targetChainId,
            title: `Approve ${selectedPool.token0.symbol} for Position Manager`,
          });
          if (app0Res.hash && !app0Res.hash.startsWith('0x_sim')) {
            await uniswapV3Service.waitForReceipt(targetChainId, app0Res.hash, 45000);
          }
          await new Promise((res) => setTimeout(res, 800));
        }

        if (mintTx.requiresApproval1 && mintTx.token1ApprovalTx) {
          const app1Res = await sendTransaction({
            to: mintTx.token1ApprovalTx.to,
            value: mintTx.token1ApprovalTx.value,
            data: mintTx.token1ApprovalTx.data,
            chainId: targetChainId,
            title: `Approve ${selectedPool.token1.symbol} for Position Manager`,
          });
          if (app1Res.hash && !app1Res.hash.startsWith('0x_sim')) {
            await uniswapV3Service.waitForReceipt(targetChainId, app1Res.hash, 45000);
          }
          await new Promise((res) => setTimeout(res, 800));
        }
      }

      const txResult = await sendTransaction({
        to: mintTx.to,
        value: mintTx.value,
        data: mintTx.data,
        chainId: targetChainId,
        title: `Mint Position: ${num0} ${selectedPool.token0.symbol} + ${num1} ${selectedPool.token1.symbol}`,
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

      saveCustomPool({
        ...selectedPool,
        chainId: targetChainId,
        feeTier: feeTier,
        feePercent: feeTier / 10000,
        tvlUSD: (selectedPool.tvlUSD || 0) + totalUSD,
      });

      addTransaction({
        hash: txResult.hash,
        type: 'add_liquidity',
        title: `Added Liquidity: ${selectedPool.token0.symbol}/${selectedPool.token1.symbol}`,
        description: `Deposited ${num0} ${selectedPool.token0.symbol} + ${num1} ${selectedPool.token1.symbol} (${(feeTier / 10000).toFixed(2)}%)`,
        status: 'confirmed',
        tokenIn: { symbol: selectedPool.token0.symbol, amount: amount0, icon: selectedPool.token0.icon },
        tokenOut: { symbol: selectedPool.token1.symbol, amount: amount1, icon: selectedPool.token1.icon },
        explorerUrl: `${selectedChain.blockExplorerUrl}/tx/${txResult.hash}`,
        gasCostUSD: 4.82,
      });

      if (selectedPool.token0.symbol === 'ETH') {
        updateBalances(-num0, -num1);
      }

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.warn('Deposit failed or rejected:', err);
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Signature was rejected in your Web3 wallet.');
    }
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
              <span>Bal: {ethBalance.toFixed(4)}</span>
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

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[var(--danger-subtle)] border border-[var(--danger)]/30 flex items-center gap-2 text-xs text-[var(--danger)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Deposit Action Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!amount0 || parseFloat(amount0) <= 0 || isSubmitting}
          onClick={handleDeposit}
          className="flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming in Wallet...</span>
            </>
          ) : (
            <span>Mint Concentrated Liquidity Position</span>
          )}
        </Button>
      </div>
    </Modal>
  );
};
