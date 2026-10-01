import { SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { getUniV3LogAdapter } from "../../helpers/uniswap";

/**
 * Saydex Protocol - DefiLlama Volume & Fees Adapter
 * Target Repo: https://github.com/DefiLlama/dimension-adapters
 * Target File: dexs/saydex/index.ts
 *
 * Tracks 24h trading volume, cumulative volume, and swap fee generation
 * across Saydex Uniswap V3 concentrated liquidity pools.
 */

const adapters = getUniV3LogAdapter({
  // GIWA L2 (Dunamu / Upbit Layer 2)
  giwa: {
    factory: '0xE9348e3e3c17D721575e294BE271BCD11028809e',
    start: '2026-09-29',
  },
  // Arbitrum One L2
  [CHAIN.ARBITRUM]: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    start: '2024-01-01',
  },
  // Base L2
  [CHAIN.BASE]: {
    factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    start: '2024-01-01',
  },
  // OP Mainnet
  [CHAIN.OPTIMISM]: {
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    start: '2024-01-01',
  },
  // Blast L2
  [CHAIN.BLAST]: {
    factory: '0x792EdAdE80af5fC680d96a2eD80A44247D1AF6Fd',
    start: '2024-03-01',
  },
});

const adapter: SimpleAdapter = {
  version: 2,
  adapter: adapters,
};

export default adapter;
