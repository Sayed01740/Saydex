# 🦙 Saydex - DefiLlama Listing & Adapters Guide

This directory contains the official DefiLlama integration adapters for **Saydex Protocol** across all supported Layer 2 networks.

> 🚀 **Live PR Submitted to DefiLlama:** [DefiLlama-Adapters PR #21358](https://github.com/DefiLlama/DefiLlama-Adapters/pull/21358)

---

## 📁 Adapter Files Overview

| File | DefiLlama Repository | Target Destination | Purpose |
| :--- | :--- | :--- | :--- |
| [`tvl-adapter.js`](file:///f:/Unx/integrations/defillama/tvl-adapter.js) | [`DefiLlama-Adapters`](https://github.com/DefiLlama/DefiLlama-Adapters) | `projects/saydex/index.js` | **TVL Tracking** (Counts tokens & liquidity locked in Uniswap V3 pools) |
| [`volume-adapter.ts`](file:///f:/Unx/integrations/defillama/volume-adapter.ts) | [`dimension-adapters`](https://github.com/DefiLlama/dimension-adapters) | `dexs/saydex/index.ts` | **Volume & Fees Tracking** (Tracks 24h trading volume & protocol swap fees) |

---

## 🚀 Step 1: Submit TVL Adapter (Mandatory for Listing)

1. **Fork the DefiLlama-Adapters repository:**
   - Go to [https://github.com/DefiLlama/DefiLlama-Adapters](https://github.com/DefiLlama/DefiLlama-Adapters).
   - Click the **Fork** button (top right) to create a copy in your GitHub account.

2. **Clone your fork locally:**
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/DefiLlama-Adapters.git
   cd DefiLlama-Adapters
   npm install
   ```

3. **Add the Saydex folder & adapter:**
   - Create a folder: `projects/saydex/`
   - Copy the content of [`tvl-adapter.js`](file:///f:/Unx/integrations/defillama/tvl-adapter.js) into `projects/saydex/index.js`.

4. **Test the adapter locally:**
   ```bash
   node test.js projects/saydex/index.js
   ```
   *Expected output: A console table showing the token balances and USD TVL breakdown.*

5. **Commit, push, and open a Pull Request:**
   ```bash
   git checkout -b feat/add-saydex-adapter
   git add projects/saydex/index.js
   git commit -m "feat: add Saydex DEX adapter"
   git push origin feat/add-saydex-adapter
   ```
   - Open a PR from your fork to `DefiLlama/DefiLlama-Adapters:master`.

---

## 📊 Step 2: Submit Volume & Fees Adapter (Recommended for DEXes)

1. **Fork the dimension-adapters repository:**
   - Go to [https://github.com/DefiLlama/dimension-adapters](https://github.com/DefiLlama/dimension-adapters).
   - Click **Fork**.

2. **Clone and install:**
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/dimension-adapters.git
   cd dimension-adapters
   npm install
   ```

3. **Add the Saydex DEX adapter:**
   - Create a folder: `dexs/saydex/`
   - Copy the content of [`volume-adapter.ts`](file:///f:/Unx/integrations/defillama/volume-adapter.ts) into `dexs/saydex/index.ts`.

4. **Test locally:**
   ```bash
   npm run test dexs saydex
   ```

5. **Open a PR to `DefiLlama/dimension-adapters:master`.**

---

## 📝 GitHub Pull Request Template

```markdown
### Protocol Details
- **Name:** Saydex
- **Category:** DEX (Concentrated Liquidity AMM)
- **Website:** https://saydex.site
- **Twitter / X:** https://x.com/saydex_protocol
- **Architecture:** Uniswap V3 Core & Periphery
- **Supported L2 Networks:** GIWA (Dunamu Layer 2), Arbitrum One, Base, OP Mainnet, Blast

### Methodology
Counts the tokens and liquidity locked in Saydex concentrated liquidity pools across supported Layer 2 networks.
```

---

## ✉️ Email Reply Template for DefiLlama Team

You can reply directly to the DefiLlama team's email with the following message:

```text
Hi DefiLlama Team,

Thank you for the guidance!

We have prepared the TVL adapter for Saydex using your standard `uniV3Export` helper. 

Our core Uniswap V3 contracts are currently live on GIWA L2 (Dunamu / Upbit Layer 2) with Factory address:
0xE9348e3e3c17D721575e294BE271BCD11028809e

We have also prepared configurations for our upcoming deployments on Arbitrum, Base, and OP Mainnet. We are opening the Pull Request on the DefiLlama-Adapters repository with the file: `projects/saydex/index.js`.

We look forward to having Saydex tracked on DefiLlama!

Best regards,
Sayed
Saydex Protocol (https://saydex.site)
```
