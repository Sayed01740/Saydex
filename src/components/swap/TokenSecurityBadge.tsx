import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Lock, CheckCircle2, ChevronRight, X, ExternalLink, Zap } from 'lucide-react';
import { Token } from '../../types';
import { tokenSecurityService, TokenSecurityAudit } from '../../services/tokenSecurityService';

interface TokenSecurityBadgeProps {
  token: Token;
  chainId: number;
  variant?: 'chips' | 'badge' | 'bar' | 'compact';
  className?: string;
  showDetailsModalOnClick?: boolean;
}

export const TokenSecurityBadge: React.FC<TokenSecurityBadgeProps> = ({
  token,
  chainId,
  variant = 'chips',
  className = '',
  showDetailsModalOnClick = true,
}) => {
  const [audit, setAudit] = useState<TokenSecurityAudit | null>(() =>
    tokenSecurityService.getCachedAudit(chainId, token.address)
  );
  const [loading, setLoading] = useState<boolean>(!audit);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const cached = tokenSecurityService.getCachedAudit(chainId, token.address);
    if (cached) {
      setAudit(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    tokenSecurityService
      .auditToken(chainId, token.address)
      .then((res) => {
        if (isMounted) {
          setAudit(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [chainId, token.address]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-tertiary)] animate-pulse ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>Auditing security...</span>
      </div>
    );
  }

  if (!audit) return null;

  const isSafe = audit.riskLevel === 'SAFE' && !audit.isHoneypot;
  const isCritical = audit.riskLevel === 'CRITICAL' || audit.isHoneypot;

  // COMPACT VARIANT
  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            if (showDetailsModalOnClick) {
              e.stopPropagation();
              setModalOpen(true);
            }
          }}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold transition-all cursor-pointer ${
            isCritical
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : !isSafe
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
          } ${className}`}
          title="Click to view security contract audit"
        >
          {isCritical ? (
            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
          ) : (
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
          )}
          <span>{audit.buyTax === 0 && audit.sellTax === 0 ? '0% Tax' : `${audit.sellTax.toFixed(0)}% Tax`}</span>
        </button>
        {modalOpen && <SecurityAuditModal audit={audit} token={token} onClose={() => setModalOpen(false)} />}
      </>
    );
  }

  // CHIPS VARIANT (Default for Token Modal & Item list)
  if (variant === 'chips') {
    return (
      <>
        <div
          onClick={(e) => {
            if (showDetailsModalOnClick) {
              e.stopPropagation();
              setModalOpen(true);
            }
          }}
          className={`inline-flex items-center gap-1.5 flex-wrap cursor-pointer ${className}`}
        >
          {/* Tax Chip */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-colors ${
              audit.buyTax > 10 || audit.sellTax > 10
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : audit.buyTax > 0 || audit.sellTax > 0
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
            }`}
          >
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>
              {audit.buyTax === 0 && audit.sellTax === 0
                ? '0% Tax'
                : `Tax: ${audit.buyTax > 0 ? `${audit.buyTax.toFixed(0)}%B/` : ''}${audit.sellTax.toFixed(0)}%S`}
            </span>
          </span>

          {/* Honeypot Chip */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-colors ${
              audit.isHoneypot
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
            }`}
          >
            <Lock className="w-2.5 h-2.5" />
            <span>{audit.isHoneypot ? 'Honeypot Risk' : 'No Honeypot'}</span>
          </span>

          {/* Verified Contract Chip */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-colors ${
              audit.isVerified
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
                : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]'
            }`}
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>{audit.auditSource === 'testnet_verified' ? 'Testnet Verified' : 'Verified'}</span>
          </span>
        </div>
        {modalOpen && <SecurityAuditModal audit={audit} token={token} onClose={() => setModalOpen(false)} />}
      </>
    );
  }

  // BAR VARIANT (Full width interactive security strip for SwapCard)
  return (
    <>
      <div
        onClick={() => showDetailsModalOnClick && setModalOpen(true)}
        className={`w-full p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
          isCritical
            ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'
            : !isSafe
            ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
            : 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isCritical ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          </div>

          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {token.symbol} Security Audit
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  isCritical ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {audit.score}/100 {audit.riskLevel}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
              {audit.isHoneypot
                ? '⚠️ Danger: Contract is detected as a honeypot!'
                : `0% Tax • No Honeypot • ${audit.auditSource === 'testnet_verified' ? 'Testnet Verified' : 'Open-Source Verified'}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] shrink-0">
          <span className="text-[11px] font-medium hidden sm:inline">Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
      {modalOpen && <SecurityAuditModal audit={audit} token={token} onClose={() => setModalOpen(false)} />}
    </>
  );
};

interface SecurityAuditModalProps {
  audit: TokenSecurityAudit;
  token: Token;
  onClose: () => void;
}

const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ audit, token, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {token.symbol} Security Audit
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] font-mono truncate max-w-[240px]">
                {audit.address}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Score Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div>
            <div className="text-xs text-[var(--text-tertiary)]">Overall Safety Score</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
              {audit.score} / 100
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${
              audit.riskLevel === 'SAFE'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {audit.riskLevel} RISK
          </span>
        </div>

        {/* Warnings */}
        {audit.warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Security Warnings Flagged</span>
            </div>
            {audit.warnings.map((w, idx) => (
              <div key={idx} className="text-xs text-rose-300">
                • {w}
              </div>
            ))}
          </div>
        )}

        {/* Audit Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)]">Buy Fee / Tax</span>
            <div className="font-mono font-bold text-[var(--text-primary)] mt-1">
              {audit.buyTax.toFixed(1)}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)]">Sell Fee / Tax</span>
            <div className="font-mono font-bold text-[var(--text-primary)] mt-1">
              {audit.sellTax.toFixed(1)}%
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)]">Honeypot Status</span>
            <div className="font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {audit.isHoneypot ? 'Failed (Honeypot)' : 'Passed (Can Sell)'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)]">Source Code</span>
            <div className="font-mono font-bold text-cyan-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {audit.isOpenSource ? 'Verified Open-Source' : 'Unverified'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)]">Mint Function</span>
            <div className="font-mono font-bold text-[var(--text-primary)] mt-1">
              {audit.isMintable ? 'Mintable' : 'Fixed Supply'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)]">Audit Verification</span>
            <div className="font-mono font-bold text-[var(--primary)] mt-1 capitalize">
              {audit.auditSource.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Multi-RPC Live Verified</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--text-on-primary)] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
