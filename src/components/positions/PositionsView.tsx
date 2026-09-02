import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { uniswapV3Service } from '../../services/uniswapV3Service';
import { UserPosition } from '../../types';
import { TokenIcon } from '../common/TokenIcon';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  CheckCircle2,
  AlertTriangle,
  Coins,
  Sparkles,
  ArrowUpRight,
  Droplets,
  ExternalLink,
  Plus,
  Loader2,
} from 'lucide-react';

export const PositionsView: React.FC = () => {
  const { userPositions, removePosition, claimPositionFees, setActiveView, addTransaction } = useProtocol();
  const { sendTransaction, selectedChain, address } = useWallet();
  const [selectedPosToManage, setSelectedPosToManage] = useState<UserPosition | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPositionsValue = userPositions.reduce((acc, p) => acc + p.totalValueUSD, 0);
  const totalUnclaimedFees = userPositions.reduce((acc, p) => acc + p.unclaimedFeesUSD, 0);

  const handleClaim = async (posId: string, feesUSD: number) => {
    try {
      setIsProcessing(true);
      const pos = userPositions.find((p) => p.id === posId);
      const targetChainId = pos?.token0?.chainId || selectedChain.id;
      const collectTx = uniswapV3Service.buildCollectFeesTransaction({
        chainId: targetChainId,
        userAddress: address || '0x0000000000000000000000000000000000000000',
        tokenId: posId,
      });

      const tx = await sendTransaction({
        to: collectTx.to,
        value: collectTx.value,
        data: collectTx.data,
        chainId: targetChainId,
        title: `Collect Fees: $${feesUSD.toFixed(2)}`,
      });

      claimPositionFees(posId);
      addTransaction({
        hash: tx.hash,
        type: 'remove_liquidity',
        title: `Collected Accrued Fees: $${feesUSD.toFixed(2)}`,
        description: `Position #${posId} fee sweep confirmed`,
        status: 'confirmed',
        explorerUrl: `${selectedChain.blockExplorerUrl}/tx/${tx.hash}`,
        gasCostUSD: 1.25,
      });
      setIsProcessing(false);
    } catch (err) {
      console.warn('Fee collection rejected:', err);
      setIsProcessing(false);
    }
  };

  const handleClaimAll = async () => {
    try {
      setIsProcessing(true);
      const firstPos = userPositions.find((p) => p.unclaimedFeesUSD > 0) || userPositions[0];
      const targetChainId = firstPos?.token0?.chainId || selectedChain.id;
      const collectTx = uniswapV3Service.buildCollectFeesTransaction({
        chainId: targetChainId,
        userAddress: address || '0x0000000000000000000000000000000000000000',
        tokenId: firstPos?.id || '1',
      });

      const tx = await sendTransaction({
        to: collectTx.to,
        value: collectTx.value,
        data: collectTx.data,
        chainId: targetChainId,
        title: `Batch Collect Fees: $${totalUnclaimedFees.toFixed(2)}`,
      });

      userPositions.forEach((p) => {
        if (p.unclaimedFeesUSD > 0) {
          claimPositionFees(p.id);
        }
      });

      addTransaction({
        hash: tx.hash,
        type: 'remove_liquidity',
        title: `Batch Collected Fees: $${totalUnclaimedFees.toFixed(2)}`,
        description: 'Multi-pool fee harvest confirmed',
        status: 'confirmed',
        explorerUrl: `${selectedChain.blockExplorerUrl}/tx/${tx.hash}`,
        gasCostUSD: 2.15,
      });
      setIsProcessing(false);
    } catch (err) {
      console.warn('Batch fee collection rejected:', err);
      setIsProcessing(false);
    }
  };

  const handleWithdrawPosition = async () => {
    if (selectedPosToManage) {
      try {
        setIsProcessing(true);
        const targetChainId = selectedPosToManage.token0.chainId || selectedChain.id;
        const decTx = uniswapV3Service.buildDecreaseLiquidityTransaction({
          chainId: targetChainId,
          userAddress: address || '0x0000000000000000000000000000000000000000',
          tokenId: selectedPosToManage.id,
          liquidity: '1000000000000',
          deadlineMinutes: 30,
        });

        const tx = await sendTransaction({
          to: decTx.to,
          value: decTx.value,
          data: decTx.data,
          chainId: targetChainId,
          title: `Withdraw Position #${selectedPosToManage.id}`,
        });

        removePosition(selectedPosToManage.id);
        addTransaction({
          hash: tx.hash,
          type: 'remove_liquidity',
          title: `Burned Position #${selectedPosToManage.id} (${selectedPosToManage.token0.symbol}/${selectedPosToManage.token1.symbol})`,
          description: `Withdrew $${selectedPosToManage.totalValueUSD.toFixed(2)} principal`,
          status: 'confirmed',
          explorerUrl: `${selectedChain.blockExplorerUrl}/tx/${tx.hash}`,
          gasCostUSD: 3.4,
        });

        setIsProcessing(false);
        setSelectedPosToManage(null);
      } catch (err) {
        console.warn('Withdrawal rejected in wallet:', err);
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            My Concentrated Positions
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Monitor real-time in-range status, fee accruals, and liquidity capital efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalUnclaimedFees > 0 && (
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<Coins className="w-4 h-4" />}
              onClick={handleClaimAll}
            >
              Harvest All (${totalUnclaimedFees.toFixed(2)})
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setActiveView('pools')}
          >
            New Position
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">Total Position Value</span>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
            ${totalPositionsValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            {userPositions.length} active LP NFTs
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">Unclaimed Fees</span>
          <div className="text-2xl font-bold font-mono text-[var(--success)] mt-1">
            ${totalUnclaimedFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            Accrued in real-time
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-xs">
          <span className="text-xs text-[var(--text-tertiary)]">Weighted Average APR</span>
          <div className="text-2xl font-bold font-mono text-[var(--primary)] mt-1">
            {userPositions.length > 0
              ? `${(userPositions.reduce((acc, p) => acc + (p.apr || 0), 0) / userPositions.length).toFixed(1)}%`
              : '0.0%'}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            {userPositions.length > 0 ? 'Annualized yield' : 'No active positions'}
          </span>
        </div>
      </div>

      {/* Positions Grid (Section 35) */}
      {userPositions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userPositions.map((pos) => (
            <div
              key={pos.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-app)] hover:border-[var(--border-strong)] rounded-2xl p-4 shadow-xs space-y-3.5 transition-all flex flex-col justify-between"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      <TokenIcon symbol={pos.token0.symbol} icon={pos.token0.icon} size="sm" />
                      <TokenIcon symbol={pos.token1.symbol} icon={pos.token1.icon} size="sm" />
                    </div>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {pos.token0.symbol} / {pos.token1.symbol}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-app)] text-[var(--text-secondary)]">
                      {(pos.feeTier / 10000).toFixed(2)}%
                    </span>
                  </div>

                  {pos.inRange ? (
                    <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                      IN RANGE
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" icon={<AlertTriangle className="w-3 h-3" />}>
                      OUT OF RANGE
                    </Badge>
                  )}
                </div>

                {/* Price Range Details */}
                <div className="mt-3 p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-tertiary)]">Min Price:</span>
                    <span className="text-[var(--text-primary)] font-semibold">{pos.priceMin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-tertiary)]">Max Price:</span>
                    <span className="text-[var(--text-primary)] font-semibold">{pos.priceMax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-[var(--border-subtle)]">
                    <span className="text-[var(--text-tertiary)]">Current Market:</span>
                    <span className="text-[var(--primary)] font-semibold">{pos.currentPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Position Balances */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Principal Balance:</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">
                    ${pos.totalValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-[var(--text-secondary)] pl-2">
                  <span>• {pos.amount0} {pos.token0.symbol}</span>
                  <span>• {pos.amount1} {pos.token1.symbol}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Unclaimed Fees:</span>
                  <span className="font-mono font-bold text-[var(--success)]">
                    +${pos.unclaimedFeesUSD.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                {pos.unclaimedFeesUSD > 0 && (
                  <button
                    disabled={isProcessing}
                    onClick={() => handleClaim(pos.id, pos.unclaimedFeesUSD)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--success-subtle)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white font-semibold text-xs transition-colors cursor-pointer border border-[var(--success)]/30 disabled:opacity-50"
                  >
                    Claim Fees
                  </button>
                )}
                <button
                  onClick={() => setSelectedPosToManage(pos)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Manage Position
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State (Section 53) */
        <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No Liquidity Positions Yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
              You haven't deposited liquidity into any concentrated price ranges yet. Provide liquidity to earn continuous swap fees.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setActiveView('pools')}
          >
            Explore Pools & Deposit
          </Button>
        </div>
      )}

      {/* Manage Position Modal */}
      {selectedPosToManage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPosToManage(null)}
          title={`Manage Position #${selectedPosToManage.id}`}
          subtitle={`${selectedPosToManage.token0.symbol} / ${selectedPosToManage.token1.symbol} (${(selectedPosToManage.feeTier / 10000).toFixed(2)}%)`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Total Position Value</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  ${selectedPosToManage.totalValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Accrued Unclaimed Fees</span>
                <span className="font-mono font-bold text-[var(--success)]">
                  ${selectedPosToManage.unclaimedFeesUSD.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Annualized Fee APR</span>
                <span className="font-mono font-bold text-[var(--primary)]">
                  {selectedPosToManage.apr}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {selectedPosToManage.unclaimedFeesUSD > 0 && (
                <Button
                  variant="subtle"
                  size="md"
                  fullWidth
                  disabled={isProcessing}
                  onClick={async () => {
                    await handleClaim(selectedPosToManage.id, selectedPosToManage.unclaimedFeesUSD);
                    setSelectedPosToManage(null);
                  }}
                  leftIcon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                >
                  {isProcessing ? 'Confirming in Wallet...' : `Collect Accrued Fees ($${selectedPosToManage.unclaimedFeesUSD.toFixed(2)})`}
                </Button>
              )}

              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={isProcessing}
                onClick={handleWithdrawPosition}
                leftIcon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isProcessing ? 'Confirming in Wallet...' : 'Withdraw Liquidity & Burn Position'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
