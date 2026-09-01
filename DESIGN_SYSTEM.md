# AXIOM PROTOCOL — DESIGN SYSTEM SPECIFICATION

## 1. Brand Philosophy
Axiom Protocol is an institutional-grade, decentralized exchange and concentrated liquidity routing terminal. The interface is engineered on the principle: **"Complex protocol underneath, effortless interface above."** 

### Core Attributes
- **Precision:** Clean geometric alignments, strict typographic hierarchies, zero decorative clutter.
- **Calm & Confident:** Restrained visual accents, subtle lighting, no aggressive neon or gratuitous animations.
- **Financial Rigor:** High-legibility numeric formatting, explicit risk disclosures, transparent execution routing, deterministic states.

---

## 2. Semantic Color Architecture

### Neutral Layering (Dark Mode — Default)
- **Background (`--color-bg`):** `#090B0E` (Deep space obsidian)
- **Secondary Background (`--color-bg-subtle`):** `#0E1116`
- **Surface (`--color-surface`):** `#13171F`
- **Elevated Surface (`--color-surface-elevated`):** `#1A202C`
- **Hover Surface (`--color-surface-hover`):** `#222938`
- **Border (`--color-border`):** `#1E2638`
- **Subtle Border (`--color-border-subtle`):** `#171E2E`

### Neutral Layering (Light Mode)
- **Background:** `#F8FAFC`
- **Surface:** `#FFFFFF`
- **Surface Hover:** `#F1F5F9`
- **Border:** `#E2E8F0`

### Brand Signature Accent
- **Primary Accent (`--color-primary`):** `#00D2B4` (Electric Precision Teal)
- **Primary Subtle / Tint (`--color-primary-subtle`):** `rgba(0, 210, 180, 0.12)`
- **Primary Glow (`--color-primary-glow`):** `rgba(0, 210, 180, 0.25)`

### Semantic Status
- **Success / Positive:** `#10B981` (Emerald)
- **Warning:** `#F59E0B` (Amber)
- **Error / Risk:** `#F43F5E` (Rose)
- **Info:** `#38BDF8` (Sky)

---

## 3. Typography Matrix

| Role | Font Family | Size | Weight | Tracking | Purpose |
|---|---|---|---|---|---|
| **Display** | Geist Sans | 2.5rem (40px) | Bold (700) | -0.025em | Landing hero headline |
| **Heading 1** | Geist Sans | 2.0rem (32px) | Bold (700) | -0.02em | Section titles, major metrics |
| **Heading 2** | Geist Sans | 1.5rem (24px) | SemiBold (600) | -0.015em | Card headers, modal titles |
| **Heading 3** | Geist Sans | 1.25rem (20px) | SemiBold (600) | -0.01em | Sub-headers, table categories |
| **Body Large** | Geist Sans | 1.125rem (18px) | Regular (400) | 0 | Lead paragraphs, input values |
| **Body** | Geist Sans | 1.0rem (16px) | Regular (400) | 0 | Standard UI text, labels |
| **Body Small** | Geist Sans | 0.875rem (14px) | Regular/500 | 0 | Secondary metrics, descriptions |
| **Caption** | Geist Sans | 0.75rem (12px) | Medium (500) | +0.02em | Helper text, fee tiers |
| **Numeric Mono** | JetBrains Mono | Variable | Medium (500/600) | 0 | Wallet addresses, tx hashes, calldata |

---

## 4. Spacing, Radius & Elevation

### Spacing Scale (Rem / Px)
- `2xs: 4px` · `xs: 8px` · `sm: 12px` · `md: 16px` · `lg: 24px` · `xl: 32px` · `2xl: 48px` · `3xl: 64px`

### Border Radius Scale
- **XS (`6px`):** Small badges, pills, tooltips
- **SM (`8px`):** Dropdown items, input secondary tags, mini buttons
- **MD (`12px`):** Standard buttons, text inputs, token selector rows
- **LG (`16px`):** Main swap card, position cards, pool summaries
- **XL (`24px`):** Modal dialogs, hero banners, high-elevation containers

### Elevation & Shadows
- **Flat:** `border: 1px solid var(--color-border)`
- **Elevated:** `0 4px 20px -2px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--color-border)`
- **Accent Glow:** `0 0 24px -4px rgba(0, 210, 180, 0.22)`

---

## 5. Motion Guidelines
- **Micro-interactions (Hover, press, toggle):** `120ms - 180ms ease-out`
- **Modals & Expanders:** `220ms - 300ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Ambient Hero Visualizer:** `12000ms linear infinite`
- **Accessibility:** Fully supports `prefers-reduced-motion: reduce`

---

## 6. Key Components & Anatomies

1. **Swap Terminal:** Dual input container with balance auto-fill (25%, 50%, MAX), inverted flip trigger with 180° rotation, real-time rate calculator, MEV slippage controls, and route breakdown.
2. **Token Selector:** Instant search, verified protocol badges, risk audit flags (unverified contract, freeze authority, honeypot tax), token balances and USD values.
3. **Concentrated Liquidity Visualizer:** Interactive range boundaries with live fee estimation and in-range APR calculations.
4. **Market Explorer:** High-density data tables with responsive column collapsing, chain filtering, and volume charts.
5. **Wallet Connect Modal & State:** Simulates real EVM & Solana multi-chain connectivity, ENS resolution, custom gas presets, and transaction simulation logs.
