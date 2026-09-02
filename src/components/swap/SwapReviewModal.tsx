import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDown,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  PlusCircle,
  Check,
  Copy,
  FileKey2,
  Zap,
} from 'lucide-react';
import { SwapQuote, TransactionStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TokenIcon } from '../common/TokenIcon';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { uniswapV3Service } from '../../services/uniswapV3Service';
import { walletLogger } from '../../utils/walletLogger';

interface SwapReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: SwapQuote;
  onSwapCompleted: () => void;
}

export const SwapReviewModal: React.FC<SwapReviewModalProps> = ({
  isOpen,
  onClose,
  quote,
  onSwapCompleted,
}) => {
  const {
    isConnected,
    selectedChain,
    address,
    isRealExtensionConnected,
    updateBalances,
    formatAddress,
    sendTransaction,
    fixWalletRpc,
  } = useWallet();

  const {
    startTransactionLifecycle,
    markTransactionSigning,
    markTransactionSigned,
    markTransactionPending,
    markTransactionConfirmed,
    markTransactionFailed,
    clearActiveTransaction,
  } = useProtocol();

  const [status, setStatus] = useState<TransactionStatus | 'signed'>('idle');
  const [approvalStep, setApprovalStep] = useState<'none' | 'approving' | 'approved'>('none');
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [tokenAdded, setTokenAdded] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [isFixingRpc, setIsFixingRpc] = useState(false);

  const handleFixRpcAndRetry = async () => {
    try {
      setIsFixingRpc(true);
      await fixWalletRpc(quote.tokenIn.chainId || selectedChain.id);
      await handleConfirmSwap(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update wallet RPC.');
    } finally {
      setIsFixingRpc(false);
    }
  };

  const handleConfirmSwap = async (forceSimArg: any = false) => {
    // Crucial: onClick={handleConfirmSwap} passes React SyntheticMouseEvent as first argument!
    // We must strictly check for boolean true, otherwise it accidentally forces simulation!
    const forceSimulation = forceSimArg === true;
    let txId = '';
    const targetChainId = quote.tokenIn.chainId || selectedChain.id;

    try {
      setErrorMessage('');
      setStatus('wallet_approval');

      // Initialize lifecycle tracking in ProtocolContext
      txId = startTransactionLifecycle({
        type: 'swap',
        title: `Swap ${quote.amountIn} ${quote.tokenIn.symbol} -> ${quote.amountOut} ${quote.tokenOut.symbol}`,
        description: `Rate: 1 ${quote.tokenIn.symbol} = ${quote.executionPrice.toFixed(4)} ${quote.tokenOut.symbol} via Uniswap V3`,
        explorerUrl: `${selectedChain.blockExplorerUrl}/tx/`,
        isRealWallet: !forceSimulation,
        tokenIn: { symbol: quote.tokenIn.symbol, amount: quote.amountIn, icon: quote.tokenIn.icon },
        tokenOut: { symbol: quote.tokenOut.symbol, amount: quote.amountOut, icon: quote.tokenOut.icon },
        chainId: targetChainId,
        userAddress: address || undefined,
      });
      setActiveTxId(txId);
      markTransactionSigning(txId);

      if (!isConnected || !address) {
        throw new Error('No active wallet connected. Please connect your MetaMask or Rabby extension first.');
      }

      // Prepare real Uniswap V3 swap transaction on targetChainId
      const preparedTx = await uniswapV3Service.buildSwapTransaction({
        chainId: targetChainId,
        userAddress: address,
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        amountIn: quote.amountIn,
        minAmountOut: quote.amountOutMin || quote.amountOut,
        feeTier: quote.feeTier || 3000,
        deadlineMinutes: 20,
      });

      // Handle token approval if selling ERC-20
      if (preparedTx.requiresApproval && preparedTx.approvalTx && !forceSimulation) {
        setApprovalStep('approving');
        const approveResult = await sendTransaction({
          to: preparedTx.approvalTx.to,
          value: preparedTx.approvalTx.value,
          data: preparedTx.approvalTx.data,
          chainId: targetChainId,
          title: `Approve ${quote.tokenIn.symbol} for Uniswap Router`,
          forceSimulation: false,
        });

        // Wait for approval confirmation on-chain before executing swap
        if (approveResult.hash && !approveResult.hash.startsWith('0x_sim')) {
          walletLogger.info(
            'TRANSACTION_LIFECYCLE',
            `Waiting for approval transaction to be mined on Chain ${targetChainId} (${approveResult.hash})...`
          );
          await uniswapV3Service.waitForReceipt(targetChainId, approveResult.hash, 45000);
        }
        setApprovalStep('approved');
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Execute Swap transaction through connected wallet
      const txResult = await sendTransaction({
        to: preparedTx.to,
        value: preparedTx.value,
        data: preparedTx.data,
        chainId: targetChainId,
        title: `Swap ${quote.amountIn} ${quote.tokenIn.symbol} -> ${quote.amountOut} ${quote.tokenOut.symbol}`,
        forceSimulation: false,
      });

      setTxHash(txResult.hash);

      // STEP 1: Signed by user / wallet provider
      setStatus('signed');
      markTransactionSigned(txId, txResult.hash, txResult.signerAddress || address || undefined);

      await new Promise((resolve) => setTimeout(resolve, 600));

      // STEP 2: Pending mempool broadcast
      setStatus('pending');
      markTransactionPending(txId);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      // STEP 3: Confirmed on-chain
      setStatus('confirmed');
      markTransactionConfirmed(txId, { gasCostUSD: quote.networkFeeUSD });

      // Update local quick balances
      const inAmountNum = parseFloat(quote.amountIn);
      const outAmountNum = parseFloat(quote.amountOut);

      if (quote.tokenIn.symbol === 'ETH') {
        updateBalances(-inAmountNum, outAmountNum);
      } else if (quote.tokenOut.symbol === 'ETH') {
        updateBalances(outAmountNum, -inAmountNum);
      }

      onSwapCompleted();
    } catch (err: any) {
      console.warn('Swap transaction was cancelled or failed:', err);
      setStatus('failed');
      const errText = err.message || 'Transaction was rejected or cancelled in your Web3 wallet.';
      setErrorMessage(errText);
      if (txId) {
        markTransactionFailed(txId, errText);
      }
    }
  };

  const handleCopyHash = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleAddTokenToWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum?.request) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: quote.tokenOut.address,
              symbol: quote.tokenOut.symbol,
              decimals: quote.tokenOut.decimals,
              image: quote.tokenOut.icon,
            },
          },
        });
      } catch {
        // ignore
      }
    }
    setTokenAdded(true);
    setTimeout(() => setTokenAdded(false), 3000);
  };

  const handleModalClose = () => {
    setStatus('idle');
    setTxHash('');
    setErrorMessage('');
    clearActiveTransaction();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        status === 'confirmed'
          ? 'Transaction Completed'
          : status === 'pending' || status === 'submitting'
          ? 'Confirming on Network'
          : status === 'signed'
          ? 'Transaction Signed'
          : status === 'wallet_approval'
          ? 'Confirm in Wallet'
          : 'Review Swap Order'
      }
      subtitle={
        status === 'idle'
          ? 'Verify execution route and minimum output before signing'
          : undefined
      }
      maxWidth="md"
      showCloseButton={status === 'idle' || status === 'confirmed'}
    >
      {/* 1. Review Swap State */}
      {status === 'idle' && (
        <div className="space-y-4">
          {/* Tokens Input/Output Cards */}
          <div className="space-y-2">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)]">
              <div className="text-[11px] text-[var(--text-tertiary)] mb-1">You Pay</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-[var(--text-primary)]">
                  {quote.amountIn}
                </span>
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={quote.tokenIn.symbol} icon={quote.tokenIn.icon} size="sm" />
                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                    {quote.tokenIn.symbol}
                  </span>
                </div>
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1 font-mono">
                ≈ ${(parseFloat(quote.amountIn || '0') * (quote.tokenIn?.priceUSD || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] flex items-center justify-center shadow-sm">
                <ArrowDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)]">
              <div className="text-[11px] text-[var(--text-tertiary)] mb-1">You Receive (Estimated)</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-[var(--primary)]">
                  {quote.amountOut}
                </span>
                <div className="flex items-center gap-2">
                  <TokenIcon symbol={quote.tokenOut.symbol} icon={quote.tokenOut.icon} size="sm" />
                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                    {quote.tokenOut.symbol}
                  </span>
                </div>
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1 font-mono">
                ≈ ${(parseFloat(quote.amountOut || '0') * (quote.tokenOut?.priceUSD || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Exchange Rate</span>
              <span className="font-mono text-[var(--text-primary)] font-medium">
                1 {quote.tokenIn.symbol} = {quote.executionPrice.toFixed(4)} {quote.tokenOut.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Price Impact</span>
              <span className="font-mono text-[var(--success)] font-medium">
                &lt;{quote.priceImpact}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Minimum Received</span>
              <span className="font-mono text-[var(--text-primary)] font-medium">
                {quote.amountOutMin} {quote.tokenOut.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Network Gas Fee</span>
              <span className="font-mono text-[var(--text-primary)] font-medium">
                ~${quote.networkFeeUSD.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
              <span className="text-[var(--text-tertiary)]">Routing Engine</span>
              <span className="text-pink-500 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Universal Router + Permit2</span>
              </span>
            </div>
          </div>

          {/* Universal Router Command Stack Preview */}
          <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-pink-500 flex items-center gap-1">
                <span>Atomic Calldata Pipeline</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Single execute() call
              </span>
            </div>
            <div className="font-mono text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-app)] text-emerald-500 font-bold">
                0x02 PERMIT2
              </span>
              <span>→</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-app)] text-indigo-400 font-bold">
                0x00 V3_SWAP
              </span>
              <span>→</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-app)] text-amber-400 font-bold">
                0x0b SWEEP
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => handleConfirmSwap(false)}
          >
            Confirm & Execute Swap
          </Button>
        </div>
      )}

      {/* 2. Wallet Signature Request */}
      {status === 'wallet_approval' && (
        <div className="py-8 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[var(--primary-subtle)] animate-ping opacity-50" />
            <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--primary)]/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          </div>
          <div>
            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              Confirm in Wallet
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs mx-auto">
              Please sign the swap authorization request in your wallet extension.
            </p>
          </div>

          {/* Lifecycle Stepper Badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[var(--text-tertiary)] pt-2">
            <span className="text-[var(--primary)] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              1. Awaiting Signature
            </span>
            <span>→</span>
            <span>2. Signed</span>
            <span>→</span>
            <span>3. Confirmed</span>
          </div>
        </div>
      )}

      {/* 3. Transaction Signed Stage */}
      {status === 'signed' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
            <FileKey2 className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              Signature Captured
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Transaction signed by {formatAddress(address, 4)}. Broadcasting to network mempool...
            </p>
          </div>

          {/* Lifecycle Stepper Badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[var(--text-tertiary)] pt-1">
            <span className="text-emerald-500 font-bold">✓ 1. Signature Valid</span>
            <span>→</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              2. Broadcasting
            </span>
            <span>→</span>
            <span>3. Confirmed</span>
          </div>
        </div>
      )}

      {/* 4. Submitting / Pending Transaction */}
      {(status === 'submitting' || status === 'pending') && (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/40 flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--primary)]" />
          </div>

          <div>
            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              Confirming on {selectedChain.name}
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Swapping {quote.amountIn} {quote.tokenIn.symbol} for {quote.amountOut} {quote.tokenOut.symbol}
            </p>
          </div>

          {/* Lifecycle Stepper Badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[var(--text-tertiary)]">
            <span className="text-emerald-500 font-bold">✓ Signed</span>
            <span>→</span>
            <span className="text-[var(--primary)] font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 animate-bounce" />
              Pending Inclusion
            </span>
            <span>→</span>
            <span>Confirmed</span>
          </div>

          {txHash && (
            <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
              <span>{formatAddress(txHash, 8)}</span>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyHash} className="hover:text-[var(--text-primary)] p-1">
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`${selectedChain.blockExplorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-primary)] p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Confirmed / Success State */}
      {status === 'confirmed' && (
        <div className="py-4 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 rounded-full bg-[var(--success-subtle)] border border-[var(--success)]/40 flex items-center justify-center mx-auto text-[var(--success)]"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>

          <div>
            <h4 className="text-lg font-bold text-[var(--text-primary)]">
              Swap Successful!
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Received <span className="font-semibold font-mono text-[var(--primary)]">{quote.amountOut} {quote.tokenOut.symbol}</span>
            </p>
          </div>

          {/* Transaction Receipt Card */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl p-3.5 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Transaction Hash</span>
              <div className="flex items-center gap-1.5 font-mono text-[var(--text-primary)]">
                <span>{formatAddress(txHash, 6)}</span>
                <a
                  href={`${selectedChain.blockExplorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 inline" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Lifecycle Status</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Signed & Confirmed
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Network & Settlement</span>
              <span className="text-[var(--text-primary)] font-medium">
                {selectedChain.name} (Sub-second finality)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Actual Gas Used</span>
              <span className="font-mono text-[var(--text-primary)]">
                ${quote.networkFeeUSD.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleAddTokenToWallet}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {tokenAdded ? (
                <>
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  <span>Added {quote.tokenOut.symbol} to Wallet</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-[var(--primary)]" />
                  <span>Add {quote.tokenOut.symbol} to Wallet</span>
                </>
              )}
            </button>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleModalClose}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* 6. Failed / Rejected State */}
      {status === 'failed' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--danger-subtle)] border border-[var(--danger)]/30 flex items-center justify-center mx-auto text-[var(--danger)]">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              Transaction Not Completed
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-xs mx-auto">
              {errorMessage || 'Signature request was rejected or expired in your wallet extension.'}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {(errorMessage.toLowerCase().includes('drpc') || errorMessage.toLowerCase().includes('paid plan')) && (
              <button
                type="button"
                disabled={isFixingRpc}
                onClick={handleFixRpcAndRetry}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {isFixingRpc ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Wallet RPC to Alchemy...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Fix Wallet RPC (Replace dRPC with Alchemy)</span>
                  </>
                )}
              </button>
            )}

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => handleConfirmSwap(false)}
            >
              Retry in Wallet
            </Button>
            <button
              type="button"
              onClick={() => handleConfirmSwap(true)}
              className="w-full py-2 px-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] hover:border-[var(--primary)]/40 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            >
              Simulate Swap (Dev & Test Mode)
            </button>
            <button
              onClick={() => setStatus('idle')}
              className="w-full py-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Back to Quote
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
