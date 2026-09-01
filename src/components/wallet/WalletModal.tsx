import React, { useState } from 'react';
import { useConnectors, useConnect } from 'wagmi';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  Copy,
  ExternalLink,
  Check,
  Power,
  Wallet,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Connector icon lookup ─────────────────────────────────────────────────────
function getConnectorIcon(connectorId: string, connectorName: string): string {
  const id = connectorId.toLowerCase();
  const name = connectorName.toLowerCase();
  if (id.includes('metamask') || name.includes('metamask')) {
    return 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg';
  }
  if (id.includes('coinbase') || name.includes('coinbase')) {
    return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png';
  }
  if (id.includes('walletconnect') || name.includes('walletconnect')) {
    return 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg';
  }
  if (id.includes('phantom') || name.includes('phantom')) {
    return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png';
  }
  return '';
}

// ── Connector Button ──────────────────────────────────────────────────────────
// RC-9 Fix: We no longer disable the button based on getProvider() result.
// getProvider() may return null for EIP-6963 wallets during initialization.
// Instead: always show the connector, let wagmi handle the "not available" case.
function ConnectorButton({
  connector,
  onClick,
  isPending,
}: {
  connector: ReturnType<typeof useConnectors>[number];
  onClick: () => void;
  isPending: boolean;
}) {
  const iconSrc = getConnectorIcon(connector.id, connector.name);

  // Deduplicate: skip "Injected" if a more specific connector covers it
  // (e.g., if MetaMask connector is present AND injected is present, both are shown
  //  but the user gets to choose — EIP-6963 provides proper provider separation)

  return (
    <button
      key={connector.uid}
      id={`connect-${connector.id}`}
      onClick={onClick}
      disabled={isPending}
      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-app)] hover:border-[var(--primary)]/50 bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all group text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
          {iconSrc ? (
            <img src={iconSrc} alt={connector.name} className="w-4 h-4 object-contain" />
          ) : (
            <Wallet className="w-4 h-4 text-[var(--primary)]" />
          )}
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
            {connector.name}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            {isPending ? 'Connecting…' : 'Click to connect'}
          </div>
        </div>
      </div>
      {isPending && <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />}
    </button>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    walletState,
    isConnected,
    isConnecting,
    address,
    ensName,
    walletChain,
    walletChainId,
    nativeBalance,
    nativeSymbol,
    usdcBalance,
    disconnectWallet,
    formatAddress,
    getExplorerAddressUrl,
    switchChain,
  } = useWallet();

  const connectors = useConnectors();
  const { connect, isPending } = useConnect();

  const [copied, setCopied] = useState(false);
  const [switchingChainId, setSwitchingChainId] = useState<number | null>(null);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = (connector: ReturnType<typeof useConnectors>[number]) => {
    connect({ connector });
    // Don't close — let the user see the connecting state, then auto-close on success
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  // Build explorer URL using chain-aware helper (RC-14 fix)
  const explorerUrl = address && walletChainId
    ? getExplorerAddressUrl(address)
    : address
    ? `https://etherscan.io/address/${address}`
    : '#';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isConnected ? 'Wallet Account' : 'Connect a Wallet'}
      subtitle={
        isConnected
          ? `Connected to ${walletChain?.name ?? 'Unknown Network'}`
          : 'Choose your preferred wallet to interact with Axiom Protocol.'
      }
      maxWidth="md"
    >
      {/* ── CONNECTED STATE ─────────────────────────────────────────────── */}
      {isConnected ? (
        <div className="space-y-4">
          {/* Wrong Chain Banner */}
          {walletState === 'WRONG_CHAIN' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--error-subtle)] border border-[var(--error)]/30 text-xs text-[var(--error)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Your wallet is on the wrong network. Switch to continue.</span>
            </div>
          )}

          {/* Chain Switching Banner */}
          {walletState === 'CHAIN_SWITCHING' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--warning-subtle,var(--bg-subtle))] border border-[var(--warning,var(--border-app))]/30 text-xs text-[var(--text-secondary)]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Switching network in your wallet…</span>
            </div>
          )}

          {/* Active Account Card */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">
                    {ensName || formatAddress(address, 6)}
                  </div>
                  <div className="font-mono text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5">
                    <span>{formatAddress(address, 6)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  id="wallet-copy-address"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-subtle)]"
                  title="Copy full address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors border border-[var(--border-subtle)]"
                  title={`View on ${walletChain?.name ?? 'Explorer'}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Balances — from actual wallet chain */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {nativeSymbol} Balance
                </span>
                <p className="text-sm font-semibold text-[var(--text-primary)] font-mono mt-0.5">
                  {nativeBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {nativeSymbol}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  Native • {walletChain?.name ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-tertiary)]">USDC Balance</span>
                <p className="text-sm font-semibold text-[var(--text-primary)] font-mono mt-0.5">
                  ${usdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {walletChain?.name ?? '—'} USDC
                </p>
              </div>
            </div>
          </div>

          {/* Network Info Row */}
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>MEV & Sandwich Protected</span>
            </span>
            <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
              {walletChain?.name ?? 'Unknown'} #{walletChainId ?? '—'}
            </span>
          </div>

          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={handleDisconnect}
            leftIcon={<Power className="w-4 h-4" />}
          >
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        /* ── DISCONNECTED STATE ──────────────────────────────────────────── */
        <div className="space-y-2.5">
          {(isPending || isConnecting) && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-[var(--text-secondary)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              <span>Connecting to wallet…</span>
            </div>
          )}

          {/* RC-9 fix: Always show all connectors — never disable based on getProvider() */}
          {connectors.map((connector) => (
            <div key={connector.uid}>
              <ConnectorButton
                connector={connector}
                onClick={() => handleConnect(connector)}
                isPending={isPending}
              />
            </div>
          ))}

          <div className="pt-2 text-center text-xs text-[var(--text-tertiary)] leading-relaxed">
            By connecting a wallet, you agree to the Axiom Protocol{' '}
            <span className="text-[var(--text-secondary)] underline cursor-pointer">
              Terms of Service
            </span>{' '}
            and zero-knowledge privacy policy.
          </div>
        </div>
      )}
    </Modal>
  );
};
