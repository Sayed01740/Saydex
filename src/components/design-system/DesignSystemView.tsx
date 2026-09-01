import React, { useState } from 'react';
import { colors, typography, radius, shadows, motionTokens } from '../../tokens';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { BrandLogo } from '../common/BrandLogo';
import { TokenIcon } from '../common/TokenIcon';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Palette,
  Type,
  Maximize2,
  Zap,
} from 'lucide-react';

export const DesignSystemView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'components' | 'banners'>('colors');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-semibold border border-[var(--primary)]/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Axiom Design Specification v3.2</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Design Tokens & Component Architecture
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Deterministic design tokens, layered neutrals, mathematical typography scales, and state matrices.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-app)] text-xs font-medium">
          {[
            { id: 'colors', label: 'Color Tokens' },
            { id: 'typography', label: 'Typography' },
            { id: 'components', label: 'Component Matrix' },
            { id: 'banners', label: 'Banner Templates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold border border-[var(--primary)]/30'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Colors & Layered Neutrals */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Primary Accent */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--primary)]" />
              <span>Primary Brand Accent: Electric Precision Teal</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#00D2B4] text-[#090B0E] font-mono text-xs font-bold">
                <div>Primary Brand</div>
                <div className="mt-2 text-[11px] opacity-80">#00D2B4</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#00E8C7] text-[#090B0E] font-mono text-xs font-bold">
                <div>Primary Hover</div>
                <div className="mt-2 text-[11px] opacity-80">#00E8C7</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#00BFA3] text-[#090B0E] font-mono text-xs font-bold">
                <div>Primary Active</div>
                <div className="mt-2 text-[11px] opacity-80">#00BFA3</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/30 font-mono text-xs font-bold">
                <div>Primary Subtle Tint</div>
                <div className="mt-2 text-[11px] opacity-80">12% Opacity</div>
              </div>
            </div>
          </div>

          {/* Dark Mode Layered Neutrals (Section 6) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Dark Mode Layered Neutral Hierarchy (Background → Surface → Elevated → Active)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-[#090B0E] border border-[#1E2638] text-[#F1F5F9]">
                <div className="font-sans font-bold">1. Background</div>
                <div className="text-[11px] text-[#94A3B8] mt-1">#090B0E</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#13171F] border border-[#1E2638] text-[#F1F5F9]">
                <div className="font-sans font-bold">2. Surface</div>
                <div className="text-[11px] text-[#94A3B8] mt-1">#13171F</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#181E29] border border-[#1E2638] text-[#F1F5F9]">
                <div className="font-sans font-bold">3. Elevated Surface</div>
                <div className="text-[11px] text-[#94A3B8] mt-1">#181E29</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#1F2736] border border-[#2D3A54] text-[#F1F5F9]">
                <div className="font-sans font-bold">4. Surface Hover</div>
                <div className="text-[11px] text-[#94A3B8] mt-1">#1F2736</div>
              </div>
            </div>
          </div>

          {/* Semantic Status Colors */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Semantic Status Palette
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/30 font-bold">
                <div>Success (#10B981)</div>
                <div className="text-[10px] mt-1 opacity-80">Confirmed, In-Range</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/30 font-bold">
                <div>Warning (#F59E0B)</div>
                <div className="text-[10px] mt-1 opacity-80">High Slippage, Out of Range</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--error-subtle)] text-[var(--error)] border border-[var(--error)]/30 font-bold">
                <div>Error (#F43F5E)</div>
                <div className="text-[10px] mt-1 opacity-80">Unverified, Revert, Tax</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--info-subtle)] text-[var(--info)] border border-[var(--info)]/30 font-bold">
                <div>Info (#38BDF8)</div>
                <div className="text-[10px] mt-1 opacity-80">Gas, Calldata, Bridge</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Typography Matrix */}
      {activeTab === 'typography' && (
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Typography Matrix & Mathematical Step Ratio
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Geist Sans for primary UI hierarchy paired with JetBrains Mono for financial numbers, addresses, and hashes.
            </p>
          </div>

          <div className="divide-y divide-[var(--border-subtle)] space-y-4">
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Display Headline (2.5rem / 40px)
              </div>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">Geist 700 / -0.025em</span>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                Heading 1 (2.0rem / 32px)
              </div>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">Geist 700 / -0.02em</span>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xl font-semibold text-[var(--text-primary)]">
                Heading 2 (1.5rem / 24px)
              </div>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">Geist 600 / -0.015em</span>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-base font-normal text-[var(--text-primary)] leading-relaxed max-w-xl">
                Body Regular (1.0rem / 16px) — Institutional-grade decentralized exchange and concentrated liquidity routing terminal.
              </div>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">Geist 400 / 1.55 Line-height</span>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-mono text-xl font-bold text-[var(--primary)]">
                $12,482.40 · 0.428 ETH · 0xA82F...91D4
              </div>
              <span className="font-mono text-xs text-[var(--text-tertiary)]">JetBrains Mono Numeric</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Component Matrix (Section 57) */}
      {activeTab === 'components' && (
        <div className="space-y-6">
          {/* Button States */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Button State Matrix (Primary, Secondary, Subtle, Danger, Loading, Disabled)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="md">Primary CTA</Button>
              <Button variant="secondary" size="md">Secondary Bordered</Button>
              <Button variant="subtle" size="md">Subtle Accent</Button>
              <Button variant="danger" size="md">Danger State</Button>
              <Button variant="primary" size="md" isLoading>Executing...</Button>
              <Button variant="primary" size="md" disabled>Disabled State</Button>
            </div>
          </div>

          {/* Badge System */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Status & Risk Badges
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="md" icon={<Zap className="w-3.5 h-3.5" />}>Optimal Route</Badge>
              <Badge variant="success" size="md" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>In Range (Active)</Badge>
              <Badge variant="warning" size="md" icon={<AlertTriangle className="w-3.5 h-3.5" />}>Out of Range</Badge>
              <Badge variant="error" size="md" icon={<AlertTriangle className="w-3.5 h-3.5" />}>Token Risk Detected</Badge>
              <Badge variant="neutral" size="md">Fee Tier 0.05%</Badge>
            </div>
          </div>

          {/* Border Radius Hierarchy (Section 28) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Mathematical Border Radius Scale (XS 6px → SM 8px → MD 12px → LG 16px → XL 24px)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs text-center">
              <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-[6px]">
                <div>XS (6px)</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Tags, Tooltips</div>
              </div>
              <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-[8px]">
                <div>SM (8px)</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Dropdowns, Chips</div>
              </div>
              <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-[12px]">
                <div>MD (12px)</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Buttons, Inputs</div>
              </div>
              <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-[16px]">
                <div>LG (16px)</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Swap Card</div>
              </div>
              <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-app)] rounded-[24px]">
                <div>XL (24px)</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Modals, Hero</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reusable Banner Templates (Section 41) */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Reusable Banner System (Announcement, Security, Upgrade, Maintenance)
            </h3>

            {/* Announcement Banner */}
            <div className="p-4 rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary)]/30 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">
                    Axiom Concentrated Routing Engine v3.2 Released
                  </div>
                  <div className="text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    Now featuring zero-slippage solver batching and sub-millisecond route optimization across Arbitrum and Base.
                  </div>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[#090B0E] font-bold text-xs shrink-0 cursor-pointer">
                Read Release Notes
              </button>
            </div>

            {/* Security Banner */}
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">
                    Trail of Bits & OpenZeppelin Dual Audit Passed
                  </div>
                  <div className="text-[var(--text-secondary)] mt-0.5">
                    Formal verification completed on all concentrated tick math and vault contracts with zero critical vulnerabilities.
                  </div>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[var(--text-primary)] font-semibold text-xs shrink-0 cursor-pointer">
                View Audit Report
              </button>
            </div>

            {/* Warning / Maintenance Banner */}
            <div className="p-4 rounded-xl bg-[var(--warning-subtle)] border border-[var(--warning)]/30 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">
                    Scheduled Node Upgrade: Polygon PoS
                  </div>
                  <div className="text-[var(--text-secondary)] mt-0.5">
                    RPC latency may fluctuate between 14:00 - 15:00 UTC during sequencer re-indexing.
                  </div>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-[var(--warning)] text-black font-semibold text-xs shrink-0 cursor-pointer">
                Check Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
