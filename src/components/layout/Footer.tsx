import React from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { ShieldCheck, Activity, Terminal, GitBranch, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView } = useProtocol();

  return (
    <footer className="w-full border-t border-[var(--border-app)] bg-[var(--bg-app)] text-xs text-[var(--text-tertiary)] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Protocol Health Bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-[var(--success)]">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="font-semibold">All Systems Operational</span>
          </div>

          <span className="text-[var(--border-strong)] hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Activity className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Block #21,849,214</span>
          </div>

          <span className="text-[var(--border-strong)] hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>MEV Protected Router</span>
          </div>
        </div>

        {/* Links & Audits */}
        <div className="flex items-center gap-5 text-xs text-[var(--text-secondary)]">
          <button
            onClick={() => setActiveView('design-system')}
            className="hover:text-[var(--primary)] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[var(--primary)]" />
            <span>Design Tokens</span>
          </button>
          <span className="text-[var(--text-tertiary)]">
            Audited by Trail of Bits & OpenZeppelin
          </span>
        </div>
      </div>
    </footer>
  );
};
