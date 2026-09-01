import React, { useState, useEffect, useMemo } from 'react';
import { Token } from '../../types';
import { useProtocol } from '../../context/ProtocolContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TokenIcon } from '../common/TokenIcon';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Target,
  Sparkles,
  Volume2,
  Check,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface SetPriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokenIn?: Token;
  initialTokenOut?: Token;
}

export const SetPriceAlertModal: React.FC<SetPriceAlertModalProps> = ({
  isOpen,
  onClose,
  initialTokenIn,
  initialTokenOut,
}) => {
  const { tokens, addPriceAlert } = useProtocol();

  const [selectedTokenIn, setSelectedTokenIn] = useState<Token>(() => initialTokenIn || tokens[0]);
  const [selectedTokenOut, setSelectedTokenOut] = useState<Token>(() => initialTokenOut || tokens[1]);
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [condition, setCondition] = useState<'gte' | 'lte'>('gte');
  const [note, setNote] = useState<string>('');
  const [hasTestedChime, setHasTestedChime] = useState<boolean>(false);

  // Sync initial tokens when modal opens
  useEffect(() => {
    if (isOpen) {
      const inTok = initialTokenIn || tokens[0];
      const outTok = initialTokenOut || tokens[1];
      setSelectedTokenIn(inTok);
      setSelectedTokenOut(outTok);

      const currentRate = (inTok.priceUSD || 1) / Math.max(0.000001, outTok.priceUSD || 1);
      // Default to +5% target price
      const defaultTarget = parseFloat((currentRate * 1.05).toFixed(currentRate > 10 ? 2 : 5));
      setTargetPriceInput(defaultTarget.toString());
      setCondition('gte');
      setNote('');
    }
  }, [isOpen, initialTokenIn, initialTokenOut, tokens]);

  // Current market exchange rate
  const currentRate = useMemo(() => {
    const pIn = selectedTokenIn?.priceUSD || 1;
    const pOut = selectedTokenOut?.priceUSD || 1;
    return pIn / Math.max(0.000001, pOut);
  }, [selectedTokenIn, selectedTokenOut]);

  // Parse entered target price
  const parsedTargetPrice = useMemo(() => {
    const val = parseFloat(targetPriceInput.replace(/,/g, ''));
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [targetPriceInput]);

  // Percent difference from current price
  const percentDiff = useMemo(() => {
    if (!currentRate || !parsedTargetPrice) return 0;
    return ((parsedTargetPrice - currentRate) / currentRate) * 100;
  }, [currentRate, parsedTargetPrice]);

  // Auto-suggest condition when target price changes
  const handlePriceChange = (val: string) => {
    setTargetPriceInput(val);
    const num = parseFloat(val.replace(/,/g, ''));
    if (!isNaN(num) && num > 0) {
      if (num >= currentRate) {
        setCondition('gte');
      } else {
        setCondition('lte');
      }
    }
  };

  // Quick preset percentages
  const applyPresetPercent = (pct: number) => {
    const newPrice = currentRate * (1 + pct / 100);
    const formatted = parseFloat(newPrice.toFixed(newPrice > 10 ? 2 : 5)).toString();
    setTargetPriceInput(formatted);
    if (pct >= 0) {
      setCondition('gte');
    } else {
      setCondition('lte');
    }
  };

  const handleTestSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
      setHasTestedChime(true);
      setTimeout(() => setHasTestedChime(false), 2000);
    } catch {
      // Audio fallback
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedTargetPrice || parsedTargetPrice <= 0) return;

    addPriceAlert({
      tokenInSymbol: selectedTokenIn.symbol,
      tokenOutSymbol: selectedTokenOut.symbol,
      targetPrice: parsedTargetPrice,
      currentPriceAtCreation: currentRate,
      condition,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)]">
            <Target className="w-4 h-4" />
          </div>
          <span>Set Target Price Alert</span>
        </div>
      }
      subtitle="Receive an instant notification and audio chime when the market reaches your target."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Token Pair Info Banner */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Selected Pair</span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Live Rate
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1.5 shrink-0">
                <TokenIcon symbol={selectedTokenIn.symbol} icon={selectedTokenIn.icon} size="sm" />
                <TokenIcon symbol={selectedTokenOut.symbol} icon={selectedTokenOut.icon} size="sm" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {selectedTokenIn.symbol} / {selectedTokenOut.symbol}
              </span>
            </div>

            <div className="text-right font-mono">
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {currentRate.toLocaleString(undefined, { maximumFractionDigits: 5 })} {selectedTokenOut.symbol}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">
                1 {selectedTokenIn.symbol}
              </div>
            </div>
          </div>
        </div>

        {/* Target Price Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Target Price ({selectedTokenOut.symbol} per {selectedTokenIn.symbol})
            </label>
            {parsedTargetPrice > 0 && (
              <span
                className={`text-[11px] font-mono font-semibold flex items-center gap-0.5 ${
                  percentDiff >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                }`}
              >
                {percentDiff >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {percentDiff >= 0 ? '+' : ''}
                  {percentDiff.toFixed(2)}% from current
                </span>
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              value={targetPriceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-base font-mono font-bold text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/40 transition-all pr-20"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-[var(--text-tertiary)] pointer-events-none">
              {selectedTokenOut.symbol}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-[var(--text-tertiary)] mr-1">Quick:</span>
            {[
              { label: '-10%', val: -10 },
              { label: '-5%', val: -5 },
              { label: '-2%', val: -2 },
              { label: '+2%', val: 2 },
              { label: '+5%', val: 5 },
              { label: '+10%', val: 10 },
              { label: '+20%', val: 20 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPresetPercent(preset.val)}
                className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] border border-[var(--border-subtle)] text-[10px] font-mono font-medium text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Condition Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Notification Trigger Condition
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCondition('gte')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                condition === 'gte'
                  ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)]'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  condition === 'gte'
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[#090B0E]'
                    : 'border-[var(--border-strong)]'
                }`}
              >
                {condition === 'gte' && <Check className="w-2.5 h-2.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold">Rises To / Above (≥)</div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">
                  Price reaches or climbs
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCondition('lte')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                condition === 'lte'
                  ? 'bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--primary)]'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-app)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  condition === 'lte'
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[#090B0E]'
                    : 'border-[var(--border-strong)]'
                }`}
              >
                {condition === 'lte' && <Check className="w-2.5 h-2.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold">Drops To / Below (≤)</div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">
                  Price reaches or falls
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
            <span>Alert Note (Optional)</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">e.g. Take Profit / DCA</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Execute 50% profit take, Buy the support bounce"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] transition-all font-sans"
            maxLength={60}
          />
        </div>

        {/* Notification Sound Test */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span>In-App Toast & Audio Chime active</span>
          </div>
          <button
            type="button"
            onClick={handleTestSound}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-app)] text-[11px] font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{hasTestedChime ? 'Chimed!' : 'Test Sound'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 gap-1.5"
            disabled={!parsedTargetPrice || parsedTargetPrice <= 0}
          >
            <Target className="w-4 h-4" />
            <span>Create Price Alert</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
