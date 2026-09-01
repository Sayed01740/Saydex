import React, { useState, useEffect, useCallback } from 'react';
import { SwapQuote, TransactionStatus } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { useProtocol } from '../../context/ProtocolContext';
import { useSendTransaction, useWaitForTransactionReceipt, useReadContract, useWriteContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TokenIcon } from '../common/TokenIcon';
import { getExplorerTxUrl, getChainById, PROTOCOL_CONTRACTS, getUniversalRouterAddress } from '../../config/chains';
import { walletLogger } from '../../utils/walletLogger';
import { encodeFunctionData, parseEther } from 'viem';
import {
  ArrowDown,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  PlusCircle,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';

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
    walletChainId,
    walletChain,
    address,
    isConnected,
    updateBalances,
    formatAddress,
  } = useWallet();
  const { addTransaction, addToast } = useProtocol();
  const queryClient = useQueryClient();

  // ── Wagmi real transaction hooks (RC-4 fix) ──────────────────────────────
  const {
    sendTransaction,
    data: txHash,
    isPending: isWalletPending,
    error: sendError,
    reset: resetSend,
  } = useSendTransaction();

  const {
    writeContract: approveContract,
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const isNativeToken = quote.tokenIn.address === '0x0000000000000000000000000000000000000000';
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: isNativeToken ? undefined : (quote.tokenIn.address as `0x${string}`),
    abi: [{ name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' }] as const,
    functionName: 'allowance',
    args: [address as `0x${string}`, PROTOCOL_CONTRACTS.PERMIT2],
    chainId: walletChainId,
    query: { enabled: !!address && !isNativeToken }
  });

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed,
    isError: isApproveReceiptError,
    data: approveReceipt,
  } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: { enabled: !!approveTxHash },
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [tokenAdded, setTokenAdded] = useState(false);

  // BUG-5 FIX: Track whether we've already triggered swap after approval to prevent double-fire
  const hasTriggeredSwapRef = React.useRef(false);

  // Reset the ref when modal opens or quote changes
  useEffect(() => {
    hasTriggeredSwapRef.current = false;
  }, [quote.tokenIn.address, quote.tokenOut.address, quote.amountIn]);

  // ── Derive UI status from wagmi state ────────────────────────────────────
  useEffect(() => {
    if (isApprovePending) {
      setStatus('wallet_approval');
      setLocalError(null);
      return;
    }
    if (approveTxHash && isApproveConfirming) {
      setStatus('approving');
      return;
    }
    if (approveTxHash && isApproveConfirmed && approveReceipt) {
      if (approveReceipt.status === 'success') {
        setStatus('checking_allowance');
        // BUG-5 FIX: Await allowance refetch, then execute swap only once
        if (!hasTriggeredSwapRef.current) {
          hasTriggeredSwapRef.current = true;
          refetchAllowance().then(() => {
            // Use a short delay to allow React state to settle
            setTimeout(() => {
              handleExecuteSwap();
            }, 300);
          });
        }
      } else {
        setStatus('failed');
        setLocalError('Approval transaction reverted on-chain.');
      }
      return;
    }
    if (approveError) {
      setStatus('failed');
      setLocalError('Approval rejected or failed.');
      return;
    }
    
    if (isWalletPending) {
      setStatus('wallet_approval');
      setLocalError(null);
      return;
    }
    if (txHash && isConfirming) {
      setStatus('pending');
      return;
    }
    if (txHash && isConfirmed && receipt) {
      if (receipt.status === 'success') {
        setStatus('confirmed');
        // RC-39/15: Post-transaction refresh — read new state from chain
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
        queryClient.invalidateQueries({ queryKey: ['allowance'] });
        updateBalances(0, 0); // Trigger wagmi refetch

        // Add transaction record with real hash and chain-correct explorer URL
        const explorerUrl = getExplorerTxUrl(walletChainId ?? quote.chainId, txHash);
        addTransaction({
          hash: txHash,
          type: 'swap',
          title: `Swapped ${quote.amountIn} ${quote.tokenIn.symbol} for ${quote.amountOut} ${quote.tokenOut.symbol}`,
          description: `Rate: 1 ${quote.tokenIn.symbol} = ${quote.executionPrice.toFixed(4)} ${quote.tokenOut.symbol}`,
          status: 'confirmed',
          tokenIn: { symbol: quote.tokenIn.symbol, amount: quote.amountIn, icon: quote.tokenIn.icon },
          tokenOut: { symbol: quote.tokenOut.symbol, amount: quote.amountOut, icon: quote.tokenOut.icon },
          explorerUrl,
          gasCostUSD: quote.networkFeeUSD,
        });

        walletLogger.info('TRANSACTION_LIFECYCLE', 'Swap confirmed on-chain', {
          hash: txHash,
          chainId: walletChainId,
          tokenIn: quote.tokenIn.symbol,
          tokenOut: quote.tokenOut.symbol,
          receipt: receipt.status,
        });

        onSwapCompleted();
      } else {
        // Receipt received but status is reverted
        setStatus('failed');
        setLocalError('Transaction was reverted on-chain. Check the explorer for details.');
        walletLogger.error('TRANSACTION_LIFECYCLE', 'Swap reverted on-chain', {
          hash: txHash,
          chainId: walletChainId,
        });
      }
      return;
    }
    if (sendError) {
      // RC-38: Classify wallet errors properly
      const code = (sendError as any)?.code;
      const message = sendError.message ?? String(sendError);

      if (code === 4001 || message.includes('User rejected') || message.includes('user rejected')) {
        setStatus('rejected');
        setLocalError('Transaction was rejected in your wallet.');
        walletLogger.info('TRANSACTION_LIFECYCLE', 'User rejected swap transaction', { code });
      } else if (message.includes('insufficient funds') || message.includes('InsufficientFunds')) {
        setStatus('failed');
        setLocalError('Insufficient funds for gas. Add more ETH to your wallet.');
        walletLogger.error('TRANSACTION_LIFECYCLE', 'Insufficient funds for swap', { code, message });
      } else if (message.includes('ChainMismatch') || message.includes('chain_mismatch') || message.includes('chainId mismatch') || message.includes('network changed') || message.includes('wrong network')) {
        setStatus('wrong_chain');
        setLocalError(`Chain mismatch. Your wallet must be on ${walletChain?.name ?? 'the correct network'}.`);
        walletLogger.error('TRANSACTION_LIFECYCLE', 'Chain mismatch during swap', { code, walletChainId, quoteChainId: quote.chainId });
      } else {
        setStatus('failed');
        setLocalError(`Transaction failed: ${message.slice(0, 120)}`);
        walletLogger.error('TRANSACTION_LIFECYCLE', 'Swap transaction failed', { code, message });
      }
    }
    if (isReceiptError) {
      setStatus('failed');
      setLocalError('Could not retrieve transaction receipt. Check the explorer.');
    }
  }, [
    isApprovePending, approveTxHash, isApproveConfirming, isApproveConfirmed, approveReceipt, approveError,
    isWalletPending, txHash, isConfirming, isConfirmed, receipt, sendError, isReceiptError
  ]);

  // ── Pre-execution validation (RC-32 + BUG-7/10 fixes) ──────────────────
  const validateBeforeSubmit = useCallback((): string | null => {
    if (!isConnected || !address) return 'Wallet is not connected.';
    // BUG-7 FIX: Guard against null walletChainId
    if (!walletChainId) return 'Cannot detect wallet chain. Please ensure your wallet is connected.';

    // RC-31: Quote chain must match wallet chain
    if (quote.chainId !== walletChainId) {
      return `Quote is for chain ${quote.chainId} but your wallet is on chain ${walletChainId} (${walletChain?.name}). Please switch networks.`;
    }

    // RC-28: Tokens must belong to current chain
    if (quote.tokenIn.chainId !== walletChainId) {
      return `${quote.tokenIn.symbol} is a ${getChainById(quote.tokenIn.chainId).name} token, but wallet is on ${walletChain?.name}.`;
    }

    if (!quote.amountIn || parseFloat(quote.amountIn) <= 0) {
      return 'Invalid swap amount.';
    }

    // BUG-10 FIX: Stale quote check (30 second validity) — must not be expired
    if (Date.now() > quote.guaranteedUntil) {
      return 'Quote has expired. Please go back and refresh.';
    }

    // BUG-10 FIX: Additional safety — ensure calldataHex is not empty
    if (!quote.calldataHex || quote.calldataHex === '0x') {
      return 'Invalid swap calldata. Please refresh the quote.';
    }

    return null;
  }, [isConnected, address, walletChainId, walletChain, quote]);

  // BUG-1 FIX: Get the correct Universal Router address for the current chain
  const routerAddress = getUniversalRouterAddress(walletChainId ?? 1);

  // BUG-3/7/8 FIX: handleExecuteSwap with deadline, null guard, and parseEther precision
  const handleExecuteSwap = React.useCallback(() => {
    if (!walletChainId) {
      setStatus('failed');
      setLocalError('Cannot detect wallet chain. Please reconnect your wallet.');
      return;
    }

    walletLogger.info('TRANSACTION_LIFECYCLE', 'Submitting swap transaction', {
      chainId: walletChainId,
      account: address?.slice(0, 8),
      tokenIn: quote.tokenIn.symbol,
      tokenOut: quote.tokenOut.symbol,
      amountIn: quote.amountIn,
      routerAddress,
    });

    sendTransaction({
      to: routerAddress,
      data: quote.calldataHex as `0x${string}`,
      chainId: walletChainId,
      value: isNativeToken
        ? parseEther(quote.amountIn || '0')
        : 0n,
    });
  }, [walletChainId, address, quote, isNativeToken, routerAddress, sendTransaction]);

  const handleConfirmSwap = async () => {
    setLocalError(null);
    resetSend();
    resetApprove();

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    if (!isNativeToken) {
      // BUG-8 FIX: Use BigInt math instead of float multiplication for precision
      const requiredAmount = BigInt(quote.amountIn || '0') * (10n ** BigInt(quote.tokenIn.decimals || 18));
      if (allowance === undefined || BigInt(allowance as bigint) < requiredAmount) {
        // Needs approval — BUG-5 FIX: Reset the swap trigger flag before approval
        hasTriggeredSwapRef.current = false;
        setStatus('wallet_approval');
        approveContract({
          address: quote.tokenIn.address as `0x${string}`,
          abi: [{ name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' }] as const,
          functionName: 'approve',
          args: [PROTOCOL_CONTRACTS.PERMIT2, 115792089237316195423570985008687907853269984665640564039457584007913129639935n],
          account: address as `0x${string}`,
          chain: undefined,
        });
        return;
      }
    }

    handleExecuteSwap();
  };

  const handleCopyHash = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleAddTokenToWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
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
      setTokenAdded(true);
      setTimeout(() => setTokenAdded(false), 3000);
    } catch {
      // User dismissed — no error shown
    }
  };

  const handleModalClose = () => {
    // Only allow close when not mid-transaction
    if (status === 'wallet_approval' || status === 'pending' || status === 'submitting' || status === 'approving' || status === 'checking_allowance') return;
    setStatus('idle');
    setLocalError(null);
    resetSend();
    resetApprove();
    onClose();
  };

  // Explorer URL uses chain registry — never hardcoded (RC-40/85)
  const explorerUrl = txHash
    ? getExplorerTxUrl(walletChainId ?? quote.chainId, txHash)
    : '#';

  const activeChainName = walletChain?.name ?? getChainById(quote.chainId).name;
  const isInProgress = status === 'wallet_approval' || status === 'submitting' || status === 'pending' || status === 'approving' || status === 'checking_allowance';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        status === 'confirmed'
          ? 'Transaction Completed'
          : status === 'pending' || status === 'submitting'
          ? 'Executing Protocol Swap'
          : status === 'approving'
          ? 'Approving Token'
          : status === 'wallet_approval'
          ? 'Confirm in Wallet'
          : status === 'failed' || status === 'rejected'
          ? 'Transaction Failed'
          : status === 'wrong_chain'
          ? 'Wrong Network'
          : 'Review Swap Order'
      }
      subtitle={
        status === 'idle'
          ? 'Verify execution route and minimum output before signing'
          : undefined
      }
      maxWidth="md"
      showCloseButton={!isInProgress}
    >
      {/* ── 1. Review State ─────────────────────────────────────────────── */}
      {status === 'idle' && (
        <div className="space-y-4">
          {/* Validation error (pre-send) */}
          {localError && (
            <div className="p-3 rounded-xl bg-[var(--error-subtle)] border border-[var(--error)]/30 flex items-start gap-2 text-xs text-[var(--error)]">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {/* Chain context confirmation */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[var(--text-tertiary)]">Executing on</span>
            <span className="font-semibold text-[var(--text-primary)]">{activeChainName}</span>
          </div>

          {/* Tokens */}
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

          {/* Details */}
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

          <Button variant="primary" size="lg" fullWidth onClick={handleConfirmSwap}>
            Confirm & Execute Swap
          </Button>
        </div>
      )}

      {/* ── 2. Wallet Signature Request ──────────────────────────────────── */}
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
              Please sign the swap transaction in your wallet extension.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Pending / Submitting / Approving ──────────────────────────────────────── */}
      {(status === 'submitting' || status === 'pending' || status === 'approving' || status === 'checking_allowance') && (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/40 flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--primary)]" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              {status === 'approving' ? 'Approving Permit2' : `Confirming on ${activeChainName}`}
            </h4>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {status === 'approving' 
                ? `Please wait while we approve ${quote.tokenIn.symbol} for trading.` 
                : `Swapping ${quote.amountIn} ${quote.tokenIn.symbol} for ${quote.amountOut} ${quote.tokenOut.symbol}`}
            </p>
          </div>
          {(txHash || approveTxHash) && (
            <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
              <span>{formatAddress(status === 'approving' ? approveTxHash : txHash, 8)}</span>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyHash} className="hover:text-[var(--text-primary)] p-1">
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={status === 'approving' && approveTxHash ? getExplorerTxUrl(walletChainId ?? quote.chainId, approveTxHash) : explorerUrl}
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

      {/* ── 4. Confirmed / Success ───────────────────────────────────────── */}
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
            <h4 className="text-lg font-bold text-[var(--text-primary)]">Swap Successful!</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Received{' '}
              <span className="font-semibold font-mono text-[var(--primary)]">
                {quote.amountOut} {quote.tokenOut.symbol}
              </span>
            </p>
          </div>
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl p-3.5 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Transaction Hash</span>
              <div className="flex items-center gap-1.5 font-mono text-[var(--text-primary)]">
                <span>{formatAddress(txHash ?? '', 6)}</span>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 inline" />
                </a>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Network</span>
              <span className="text-[var(--text-primary)] font-medium">{activeChainName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-tertiary)]">Gas Used</span>
              <span className="font-mono text-[var(--text-primary)]">
                ~${quote.networkFeeUSD.toFixed(2)}
              </span>
            </div>
          </div>
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
            <Button variant="primary" size="md" fullWidth onClick={handleModalClose}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ── 5. Failed / Rejected / Wrong Chain ──────────────────────────── */}
      {(status === 'failed' || status === 'rejected' || status === 'wrong_chain') && (
        <div className="py-4 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 rounded-full bg-[var(--error-subtle)] border border-[var(--error)]/40 flex items-center justify-center mx-auto text-[var(--error)]"
          >
            {status === 'rejected' ? (
              <XCircle className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </motion.div>
          <div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              {status === 'rejected' ? 'Transaction Rejected' : status === 'wrong_chain' ? 'Wrong Network' : 'Transaction Failed'}
            </h4>
            {localError && (
              <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs mx-auto">{localError}</p>
            )}
          </div>
          {txHash && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View on {activeChainName} Explorer
            </a>
          )}
          <div className="space-y-2">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                setStatus('idle');
                setLocalError(null);
                resetSend();
              }}
            >
              Try Again
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={handleModalClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
