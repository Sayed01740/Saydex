import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import { LaunchpadProject } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Rocket, ShieldCheck, Clock, Users, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';

export const LaunchpadView: React.FC = () => {
  const { launchpadProjects, participateInLaunchpad } = useProtocol();
  const { usdcBalance, updateBalances } = useWallet();
  const [selectedProject, setSelectedProject] = useState<LaunchpadProject | null>(null);
  const [allocationInput, setAllocationInput] = useState<string>('500');

  const handleParticipate = () => {
    if (!selectedProject) return;
    const amount = parseFloat(allocationInput) || 0;
    participateInLaunchpad(selectedProject.id, amount);
    updateBalances(0, -amount);
    setSelectedProject(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-semibold border border-[var(--primary)]/20 mb-2">
            <Rocket className="w-3.5 h-3.5" />
            <span>Saydex Fair Launch Incubator</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Decentralized Protocol Launchpad
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Zero-frontrunning, MEV-shielded fair token sales with automated concentrated liquidity seeding.
          </p>
        </div>
      </div>

      {/* Projects Grid (Section 40) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {launchpadProjects.map((proj) => {
          const progressPercent = Math.min(100, Math.round((proj.raisedUSD / proj.hardCapUSD) * 100));

          return (
            <div
              key={proj.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-app)] hover:border-[var(--border-strong)] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                {/* Project Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {proj.name}
                    </h3>
                    <span className="font-mono text-xs text-[var(--primary)] font-semibold">
                      ${proj.symbol}
                    </span>
                  </div>

                  <Badge
                    variant={
                      proj.status === 'live'
                        ? 'primary'
                        : proj.status === 'completed'
                        ? 'success'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {proj.status.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {proj.tagline}
                </p>

                {/* Raise Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-tertiary)]">Raised:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      ${(proj.raisedUSD / 1000).toLocaleString()}k / ${(proj.hardCapUSD / 1000).toLocaleString()}k ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-app)]">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">Token Price</span>
                    <span className="font-bold text-[var(--text-primary)]">${proj.tokenPriceUSD}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">Liquidity Lock</span>
                    <span className="font-bold text-[var(--success)]">{proj.liquidityLockedPercent}% (12m)</span>
                  </div>
                </div>

                {/* Vesting info */}
                <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[var(--primary)]" />
                  <span>{proj.vestingTerms}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant={proj.status === 'live' ? 'primary' : 'secondary'}
                size="md"
                fullWidth
                disabled={proj.status !== 'live'}
                onClick={() => setSelectedProject(proj)}
              >
                {proj.status === 'live'
                  ? 'Participate in IDO'
                  : proj.status === 'completed'
                  ? 'Sale Concluded'
                  : 'Upcoming (Whitelist)'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Allocation Modal */}
      {selectedProject && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          title={`Allocate to ${selectedProject.name}`}
          subtitle={`Commit USDC into ${selectedProject.symbol} Fair Launch Pool`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Sale Token Price</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  ${selectedProject.tokenPriceUSD} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Min / Max Allocation</span>
                <span className="font-mono text-[var(--text-primary)]">
                  ${selectedProject.minAllocationUSD} - ${selectedProject.maxAllocationUSD.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Your Available USDC</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">
                  ${usdcBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                USDC Allocation Amount
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={allocationInput}
                  onChange={(e) => setAllocationInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] focus:border-[var(--primary)] text-sm font-mono text-[var(--text-primary)] focus:outline-none"
                  min={selectedProject.minAllocationUSD}
                  max={selectedProject.maxAllocationUSD}
                />
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">
                You will receive ≈{' '}
                <span className="font-bold text-[var(--primary)]">
                  {(parseFloat(allocationInput || '0') / selectedProject.tokenPriceUSD).toLocaleString()}{' '}
                  {selectedProject.symbol}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleParticipate}
            >
              Confirm IDO Participation
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
