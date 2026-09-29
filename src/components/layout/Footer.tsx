import React from 'react';
import { ShieldCheck, BookOpen } from 'lucide-react';
import { useProtocol } from '../../context/ProtocolContext';

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
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>MEV Protected Router</span>
          </div>
        </div>

        {/* Links & Audits */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <button
            onClick={() => setActiveView('docs')}
            className="flex items-center gap-1.5 text-[var(--primary)] hover:underline cursor-pointer font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation</span>
          </button>
          <span className="text-[var(--border-strong)]">•</span>
          <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
            SAYDEX Protocol v3 • Audited Architecture
          </span>
        </div>
      </div>
    </footer>
  );
};
