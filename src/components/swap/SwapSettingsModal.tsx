import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  Activity,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  Flame,
} from 'lucide-react';

interface SwapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwapSettingsModal: React.FC<SwapSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useProtocol();
  const [customSlippageVal, setCustomSlippageVal] = useState(settings.customSlippage || '');

  const slippagePresets = [
    { label: 'Auto (0.5%)', value: 0.5, isAuto: true },
    { label: '0.1%', value: 0.1 },
    { label: '0.5%', value: 0.5 },
    { label: '1.0%', value: 1.0 },
    { label: '2.5%', value: 2.5 },
  ];

  const deadlinePresets = [5, 10, 20, 30, 60];

  const handleSelectPreset = (val: number, isAuto = false) => {
    updateSettings({ slippageTolerance: val, customSlippage: isAuto ? '' : '' });
    setCustomSlippageVal('');
  };

  const handleCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomSlippageVal(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 50) {
      updateSettings({ slippageTolerance: num, customSlippage: val });
    }
  };

  const handleDeadlineChange = (val: number) => {
    const clamped = Math.max(1, Math.min(180, val));
    updateSettings({ deadlineMinutes: clamped });
  };

  const handleResetDefaults = () => {
    updateSettings({
      slippageTolerance: 0.5,
      customSlippage: '',
      deadlineMinutes: 20,
      mevProtection: true,
      autoRouter: true,
      advancedMode: false,
      highGasAlert: false,
    });
    setCustomSlippageVal('');
  };

  // Determine safety indicator
  const currentSlippage = settings.slippageTolerance;
  const isHighSlippage = currentSlippage > 1.0 && currentSlippage <= 5.0;
  const isExtremeSlippage = currentSlippage > 5.0;
  const isLowSlippage = currentSlippage < 0.1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)]">
            <Sliders className="w-4 h-4" />
          </div>
          <span>Swap Execution & Settings</span>
        </div>
      }
      subtitle="Configure allowed slippage tolerance, transaction deadlines, and MEV routing"
      maxWidth="md"
    >
      <div className="space-y-5 pt-1">
        {/* Section 1: Max Slippage Tolerance */}
        <div className="space-y-2.5 p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Allowed Slippage Tolerance
              </span>
              <div className="group relative cursor-help">
                <Info className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[11px] text-[var(--text-secondary)] shadow-lg z-50 pointer-events-none">
                  Your transaction will revert if the price changes unfavorably by more than this percentage.
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--primary)]">
              {settings.slippageTolerance}%
            </span>
          </div>

          {/* Slippage Presets Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {slippagePresets.map((preset) => {
              const isSelected =
                settings.slippageTolerance === preset.value &&
                (!settings.customSlippage || preset.isAuto);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value, preset.isAuto)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer text-center ${
                    isSelected
                      ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)] shadow-2xs'
                      : 'bg-[var(--bg-surface)] border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            {/* Custom Input */}
            <div className="relative col-span-3 sm:col-span-1">
              <input
                type="number"
                placeholder="Custom"
                value={customSlippageVal}
                onChange={handleCustomSlippageChange}
                className={`w-full py-2 px-2 rounded-xl bg-[var(--bg-surface)] border text-xs font-mono text-center focus:outline-none transition-all pr-4 ${
                  settings.customSlippage
                    ? 'border-[var(--primary)] text-[var(--primary)] font-bold ring-1 ring-[var(--primary)]/30'
                    : 'border-[var(--border-app)] text-[var(--text-primary)] focus:border-[var(--primary)]'
                }`}
                step="0.1"
                min="0.01"
                max="50"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-tertiary)] pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Dynamic Warning Messages */}
          {isLowSlippage && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[11px] text-[var(--warning)]">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Low slippage (&lt;0.1%): Trade may fail or revert during high volatility.</span>
            </div>
          )}

          {isHighSlippage && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[11px] text-[var(--warning)]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>High slippage: Increases risk of sandwich attacks. Private MEV shield recommended.</span>
            </div>
          )}

          {isExtremeSlippage && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/25 text-[11px] text-[var(--error)] font-medium">
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>Extreme slippage (&gt;5%): High risk of substantial financial loss from frontrunning.</span>
            </div>
          )}
        </div>

        {/* Section 2: Transaction Deadline Duration */}
        <div className="space-y-2.5 p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                Transaction Deadline Duration
              </span>
              <div className="group relative cursor-help">
                <Info className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[11px] text-[var(--text-secondary)] shadow-lg z-50 pointer-events-none">
                  Your transaction will automatically revert if it is pending in the mempool longer than this duration.
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {settings.deadlineMinutes} mins
            </span>
          </div>

          {/* Deadline Presets & Stepper */}
          <div className="flex flex-wrap items-center gap-1.5">
            {deadlinePresets.map((mins) => {
              const isSelected = settings.deadlineMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleDeadlineChange(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {mins}m
                </button>
              );
            })}

            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => handleDeadlineChange(settings.deadlineMinutes - 5)}
                className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-xs font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                title="Decrease 5 minutes"
              >
                -5
              </button>
              <input
                type="number"
                value={settings.deadlineMinutes}
                onChange={(e) => handleDeadlineChange(parseInt(e.target.value) || 20)}
                className="w-14 py-1 px-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-app)] focus:border-[var(--primary)] text-xs font-mono font-bold text-[var(--text-primary)] text-center focus:outline-none"
                min="1"
                max="180"
              />
              <button
                type="button"
                onClick={() => handleDeadlineChange(settings.deadlineMinutes + 5)}
                className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-xs font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                title="Increase 5 minutes"
              >
                +5
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Reverts if execution is delayed past deadline to protect against stale rates.
          </p>
        </div>

        {/* Section 3: Advanced Routing & Protection Toggles */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[var(--primary)] mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  MEV & Private RPC Shield
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)]">
                  Routes directly to private builder nodes to eliminate sandwich attacks
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ mevProtection: !settings.mevProtection })}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.mevProtection
                  ? 'bg-[var(--primary)]'
                  : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-app)]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.mevProtection ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors">
            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-[var(--info)] mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Axiom Split Auto-Router
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)]">
                  Splits trades across concentrated liquidity pools for optimal pricing
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ autoRouter: !settings.autoRouter })}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.autoRouter
                  ? 'bg-[var(--primary)]'
                  : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-app)]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.autoRouter ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors">
            <div className="flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Developer & Advanced Mode
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)]">
                  Show raw transaction calldata hex, pool contracts, and execution hops
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ advancedMode: !settings.advancedMode })}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.advancedMode
                  ? 'bg-[var(--primary)]'
                  : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-app)]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  settings.advancedMode ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <Button variant="primary" size="md" onClick={onClose} className="px-6 gap-1.5">
            <Check className="w-4 h-4" />
            <span>Apply Settings</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
