import { UniswapRepoItem, DutchAuctionOrder, V4HookDefinition } from '../types/uniswapEcosystem';

export const UNISWAP_REPOSITORIES_DATA: UniswapRepoItem[] = [
  // 1. Core AMM Protocols & Bytecode Engines
  {
    id: 'v4-core',
    name: 'v4-core',
    repoName: 'Uniswap/v4-core',
    githubUrl: 'https://github.com/Uniswap/v4-core',
    category: 'core_amm',
    description: 'Core smart contracts for Uniswap v4 featuring the singleton PoolManager, custom Hooks, flash accounting, and native ETH support.',
    language: 'Solidity',
    stars: 3840,
    forks: 1420,
    license: 'BUSL-1.1',
    badge: 'Latest Core AMM',
    version: 'v4.0.0-rc',
    solidityVersion: '^0.8.24',
    keyFeatures: [
      'Singleton PoolManager: All pools held in a single contract, reducing multihop gas by up to 99%',
      'Flash Accounting via transient storage (EIP-1153) and CurrencySettler',
      'Dynamic Hooks architecture with prefix-encoded permission flags',
      'Native ETH pairs without compulsory WETH wrapper',
      'Custom accounting and donation mechanics'
    ],
    architectureSummary: 'A singleton AMM architecture where `PoolManager.sol` handles all token balances and state deltas using ERC-6909 claims and transient storage, calling Hook contracts at predefined lifecycle checkpoints.',
    sampleCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";

contract HookExample {
    IPoolManager public immutable manager;
    constructor(IPoolManager _manager) {
        manager = _manager;
    }
}`,
    tags: ['AMM', 'v4', 'Singleton', 'Hooks', 'Flash Accounting', 'EIP-1153']
  },
  {
    id: 'v4-periphery',
    name: 'v4-periphery',
    repoName: 'Uniswap/v4-periphery',
    githubUrl: 'https://github.com/Uniswap/v4-periphery',
    category: 'core_amm',
    description: 'Peripheral contracts for Uniswap v4 including PositionManager, Quoter, Subscriptions, and Hook library helpers.',
    language: 'Solidity',
    stars: 1210,
    forks: 580,
    license: 'GPL-2.0-or-later',
    badge: 'Periphery & Position Manager',
    version: 'v4.0.0-rc',
    solidityVersion: '^0.8.24',
    keyFeatures: [
      'PositionManager: Non-fungible LP position tracker with Permit2 authorization',
      'Quoter: Exact-in and exact-out price quotes across single and multihop paths',
      'StateView: Efficient read-only access to PoolManager slot0, ticks, and liquidity',
      'BaseHook: Standard abstract base class with validation for all hook lifecycle callbacks'
    ],
    architectureSummary: 'Wraps `PoolManager` with user-facing liquidity management, ERC-721 position tokens, and off-chain execution encoders.',
    tags: ['PositionManager', 'Quoter', 'StateView', 'BaseHook']
  },
  {
    id: 'v3-core',
    name: 'v3-core',
    repoName: 'Uniswap/v3-core',
    githubUrl: 'https://github.com/Uniswap/v3-core',
    category: 'core_amm',
    description: 'Core smart contracts of Uniswap V3 protocol introducing concentrated liquidity, tick-based pricing, and configurable fee tiers.',
    language: 'Solidity',
    stars: 5690,
    forks: 2880,
    license: 'BUSL-1.1 (Expired to GPL-2.0)',
    badge: 'Concentrated Liquidity',
    version: 'v3.0.0',
    solidityVersion: '>=0.5.0 <0.8.0',
    keyFeatures: [
      'Concentrated Liquidity: Up to 4000x capital efficiency compared to V2',
      'Discrete Ticks & TickBitmap using Q64.96 fixed-point arithmetic',
      'Configurable Fee Tiers (0.01%, 0.05%, 0.30%, 1.00%)',
      'Decentralized TWAP Oracle observations recorded directly in pool storage'
    ],
    architectureSummary: 'Independent pool contracts (`UniswapV3Pool.sol`) spawned by `UniswapV3Factory.sol` that compute virtual reserves along price intervals.',
    tags: ['V3', 'Concentrated Liquidity', 'Q64.96', 'TWAP Oracle']
  },
  {
    id: 'v3-periphery',
    name: 'v3-periphery',
    repoName: 'Uniswap/v3-periphery',
    githubUrl: 'https://github.com/Uniswap/v3-periphery',
    category: 'core_amm',
    description: 'Periphery smart contracts for interacting with Uniswap V3, including SwapRouter, NonfungiblePositionManager, and Oracle libraries.',
    language: 'Solidity',
    stars: 2890,
    forks: 1820,
    license: 'GPL-2.0-or-later',
    badge: 'V3 Routers & LPs',
    tags: ['SwapRouter', 'NonfungiblePositionManager', 'QuoterV2']
  },
  {
    id: 'v2-core',
    name: 'v2-core',
    repoName: 'Uniswap/v2-core',
    githubUrl: 'https://github.com/Uniswap/v2-core',
    category: 'core_amm',
    description: 'The foundational constant-product (x*y=k) AMM core contracts that revolutionized decentralized exchange.',
    language: 'Solidity',
    stars: 7850,
    forks: 4620,
    license: 'GPL-3.0',
    badge: 'DeFi Classic',
    version: 'v2.0.0',
    keyFeatures: [
      'Constant product formula x * y = k',
      'ERC-20 / ERC-20 pair creation without ETH intermediaries',
      'Flash Swaps enabling zero-capital arbitrage and collateral swapping',
      'Time-Weighted Average Price (TWAP) cumulative price accumulator'
    ],
    architectureSummary: '`UniswapV2Factory.sol` creates deterministic pair contracts (`UniswapV2Pair.sol`) using CREATE2 opcode.',
    tags: ['V2', 'x*y=k', 'Flash Swaps', 'CREATE2']
  },
  {
    id: 'v2-periphery',
    name: 'v2-periphery',
    repoName: 'Uniswap/v2-periphery',
    githubUrl: 'https://github.com/Uniswap/v2-periphery',
    category: 'core_amm',
    description: 'UniswapV2Router02 and periphery contracts for multi-hop trades, liquidity additions, and WETH wrapping.',
    language: 'Solidity',
    stars: 3410,
    forks: 2350,
    license: 'GPL-3.0',
    tags: ['Router02', 'V2 Periphery', 'Multihop']
  },
  {
    id: 'v1-contracts',
    name: 'v1-contracts',
    repoName: 'Uniswap/v1-contracts',
    githubUrl: 'https://github.com/Uniswap/v1-contracts',
    category: 'core_amm',
    description: 'The original Vyper implementation of Uniswap v1 deployed to Ethereum mainnet in November 2018.',
    language: 'Vyper',
    stars: 1820,
    forks: 730,
    license: 'GPL-3.0',
    badge: 'Historical Genesis',
    tags: ['V1', 'Vyper', 'Genesis', 'ETH-ERC20']
  },

  // 2. Routing, Execution & Aggregation
  {
    id: 'universal-router',
    name: 'universal-router',
    repoName: 'Uniswap/universal-router',
    githubUrl: 'https://github.com/Uniswap/universal-router',
    category: 'routing_execution',
    description: 'Universal execution contract for token swaps (V2, V3, V4), Permit2 token transfers, and multi-marketplace NFT trade batching in single atomic transactions.',
    language: 'Solidity',
    stars: 1560,
    forks: 690,
    license: 'GPL-3.0-or-later',
    badge: 'Flagship Execution Engine',
    npmPackage: '@uniswap/universal-router-sdk',
    keyFeatures: [
      'Single `execute(bytes commands, bytes[] inputs)` entrypoint',
      'Permit2 native integration for zero-allowance trades',
      'Gas savings up to 38% vs standalone router multicalls',
      'Supports Seaport, LooksRare, Sudoswap, and NFTX order fulfillments'
    ],
    architectureSummary: 'Interprets compact byte-encoded command arrays sequentially inside a single re-entrancy safe dispatcher.',
    tags: ['Universal Router', 'Permit2', 'NFTs', 'Batching', 'Opcode Dispatcher']
  },
  {
    id: 'smart-order-router',
    name: 'smart-order-router',
    repoName: 'Uniswap/smart-order-router',
    githubUrl: 'https://github.com/Uniswap/smart-order-router',
    category: 'routing_execution',
    description: 'Off-chain routing algorithm (SOR) that searches across pools, fee tiers, and split paths to find optimal trade execution routes with minimum slippage.',
    language: 'TypeScript',
    stars: 940,
    forks: 510,
    license: 'GPL-3.0-or-later',
    badge: 'Routing Algorithm',
    npmPackage: '@uniswap/smart-order-router',
    keyFeatures: [
      'Multi-hop path generation with split routes across V2, V3, and V4',
      'Gas-aware route optimization taking gas costs into net return calculations',
      'Heuristic search pruning for millisecond quotation latency',
      'Used as the core engine in Uniswap Web Interface and Routing API'
    ],
    architectureSummary: 'Graph-based graph traversal heuristic with on-chain multicall provider caching for pool states.',
    tags: ['SOR', 'Split Routing', 'Pathfinding', 'Optimization']
  },
  {
    id: 'permit2',
    name: 'permit2',
    repoName: 'Uniswap/permit2',
    githubUrl: 'https://github.com/Uniswap/permit2',
    category: 'routing_execution',
    description: 'Next-generation token approval contract enabling gasless off-chain EIP-712 signatures, batched transfers, and expiring allowances for all ERC-20 tokens.',
    language: 'Solidity',
    stars: 2650,
    forks: 890,
    license: 'AGPL-3.0',
    badge: 'Canonical Signature Vault',
    npmPackage: '@uniswap/permit2-sdk',
    keyFeatures: [
      'Universal allowance vault: approve Permit2 once, sign gasless authorizations forever',
      'Expiring approvals with nonces preventing replay attacks',
      'Batch permits and transfers in a single signature',
      'Backwards compatible with non-EIP-2612 legacy tokens (USDC, USDT, WBTC, DAI)'
    ],
    architectureSummary: 'A shared canonical smart contract deployed at `0x000000000022D473030F116dDEE9F6B43aC78BA3` across all EVM networks.',
    tags: ['Permit2', 'EIP-712', 'Gasless', 'Signature Approvals']
  },
  {
    id: 'routing-api',
    name: 'routing-api',
    repoName: 'Uniswap/routing-api',
    githubUrl: 'https://github.com/Uniswap/routing-api',
    category: 'routing_execution',
    description: 'High-throughput microservice exposing REST and WebSocket endpoints for smart order routing, quote simulation, and calldata generation.',
    language: 'TypeScript',
    stars: 380,
    forks: 190,
    license: 'GPL-3.0',
    badge: 'Cloud Routing API',
    tags: ['API', 'Microservices', 'REST', 'Quotes']
  },
  {
    id: 'redux-multicall',
    name: 'redux-multicall',
    repoName: 'Uniswap/redux-multicall',
    githubUrl: 'https://github.com/Uniswap/redux-multicall',
    category: 'routing_execution',
    description: 'Redux middleware for batching, debouncing, and caching on-chain contract state reads via Multicall.',
    language: 'TypeScript',
    stars: 290,
    forks: 140,
    license: 'MIT',
    tags: ['Redux', 'Multicall', 'Caching', 'React State']
  },

  // 3. UniswapX & Dutch Auctions Ecosystem
  {
    id: 'UniswapX',
    name: 'UniswapX',
    repoName: 'Uniswap/UniswapX',
    githubUrl: 'https://github.com/Uniswap/UniswapX',
    category: 'uniswapx',
    description: 'Auction-based routing protocol that outsources routing to open filler competition, offering gasless swaps, MEV protection, and cross-chain execution.',
    language: 'Solidity',
    stars: 1840,
    forks: 620,
    license: 'GPL-2.0-or-later',
    badge: 'Zero-Gas MEV-Protected AMM',
    keyFeatures: [
      'Dutch Auction Orders: Price gradually decays over time until filled by a third-party filler',
      'Gasless Swaps: Fillers pay transaction fees on behalf of swappers',
      'MEV Protection: Fillers internalize arbitrage and protect users from frontrunning/sandwiching',
      'Cross-Chain Swaps: Unified cross-chain liquidity via Filler settlement relays'
    ],
    architectureSummary: 'Off-chain signed orders with Dutch decay schedules are settled via `ExclusiveDutchOrderReactor.sol` and `Permit2`.',
    tags: ['UniswapX', 'Dutch Auction', 'MEV Protected', 'Fillers', 'Cross-Chain']
  },
  {
    id: 'uniswapx-sdk',
    name: 'uniswapx-sdk',
    repoName: 'Uniswap/uniswapx-sdk',
    githubUrl: 'https://github.com/Uniswap/uniswapx-sdk',
    category: 'uniswapx',
    description: 'TypeScript SDK for encoding, validating, and signing UniswapX Dutch orders and cross-chain orders.',
    language: 'TypeScript',
    stars: 310,
    forks: 160,
    license: 'MIT',
    npmPackage: '@uniswap/uniswapx-sdk',
    tags: ['UniswapX SDK', 'Order Builder', 'EIP-712 Dutch Orders']
  },
  {
    id: 'uniswapx-service',
    name: 'uniswapx-service',
    repoName: 'Uniswap/uniswapx-service',
    githubUrl: 'https://github.com/Uniswap/uniswapx-service',
    category: 'uniswapx',
    description: 'Backend quoting and order relay service connecting swappers with professional market maker fillers.',
    language: 'TypeScript',
    stars: 220,
    forks: 110,
    license: 'GPL-3.0',
    tags: ['RFQ Service', 'Order Relay', 'Filler Network']
  },
  {
    id: 'uniswapx-parameter-controller',
    name: 'uniswapx-parameter-controller',
    repoName: 'Uniswap/uniswapx-parameter-controller',
    githubUrl: 'https://github.com/Uniswap/uniswapx-parameter-controller',
    category: 'uniswapx',
    description: 'On-chain parameter governance and decay slope manager for UniswapX auction reactors.',
    language: 'Solidity',
    stars: 95,
    forks: 35,
    license: 'GPL-2.0',
    tags: ['Auction Parameters', 'Governance', 'Reactor Control']
  },

  // 4. v4 Hooks Directory & Hook Incubator
  {
    id: 'v4-template',
    name: 'v4-template',
    repoName: 'Uniswap/v4-template',
    githubUrl: 'https://github.com/Uniswap/v4-template',
    category: 'v4_hooks',
    description: 'Foundry template repository for developing, testing, and deploying custom Uniswap v4 Hooks with address bit-mask mining scripts.',
    language: 'Solidity',
    stars: 1720,
    forks: 890,
    license: 'MIT',
    badge: 'Hook Starter Template',
    keyFeatures: [
      'Pre-configured Foundry test suite with `Deployers` and `TestPoolManager`',
      'Automated Hook address mining script targeting specific hook permission bits',
      'Example counter hook and volatility fee hooks',
      'Mock tokens and router harnesses for rapid TDD'
    ],
    architectureSummary: 'Foundry scaffolding integrating `@uniswap/v4-core` and `@uniswap/v4-periphery`.',
    tags: ['Foundry', 'v4 Template', 'Hook Miner', 'Testing Harness']
  },
  {
    id: 'v4-by-example',
    name: 'v4-by-example',
    repoName: 'Uniswap/v4-by-example',
    githubUrl: 'https://github.com/Uniswap/v4-by-example',
    category: 'v4_hooks',
    description: 'Educational reference repository containing end-to-end verified examples of innovative Uniswap v4 Hooks.',
    language: 'Solidity',
    stars: 980,
    forks: 410,
    license: 'MIT',
    badge: 'Hook Examples & Recipes',
    keyFeatures: [
      'TWAMM (Time-Weighted Automated Market Maker) Hook',
      'Native On-Chain Limit Orders & Stop Loss Hook',
      'Dynamic Volatility Fees Hook using geometric mean oracles',
      'KYC / Whitelist Access Control Hook',
      'Delta Return Custom Accounting Hook'
    ],
    architectureSummary: 'Production-ready reference implementations illustrating every hook callback in the v4 lifecycle.',
    tags: ['TWAMM', 'Limit Orders', 'Dynamic Fees', 'KYC Hooks']
  },
  {
    id: 'hook-incubator',
    name: 'hook-incubator',
    repoName: 'Uniswap/hook-incubator',
    githubUrl: 'https://github.com/Uniswap/hook-incubator',
    category: 'v4_hooks',
    description: 'Community and core research incubator for cutting-edge Uniswap v4 Hook primitives and formal verifications.',
    language: 'Solidity',
    stars: 450,
    forks: 180,
    license: 'GPL-3.0',
    badge: 'Research & Innovation',
    tags: ['Incubator', 'Formal Verification', 'DeFi Primitives']
  },

  // 5. Developer SDKs, Tooling & Monorepos
  {
    id: 'sdks',
    name: 'sdks',
    repoName: 'Uniswap/sdks',
    githubUrl: 'https://github.com/Uniswap/sdks',
    category: 'sdks_tooling',
    description: 'Unified monorepo containing all official Uniswap TypeScript SDKs: v4-sdk, v3-sdk, v2-sdk, sdk-core, permit2-sdk, and universal-router-sdk.',
    language: 'TypeScript',
    stars: 1820,
    forks: 910,
    license: 'GPL-3.0',
    badge: 'Official Monorepo',
    npmPackage: '@uniswap/sdk-core',
    keyFeatures: [
      'Fraction and BigNumber arithmetic libraries with zero floating point drift',
      'Currency, Token, and Ether native abstractions',
      'Pool, Route, and Trade entities for V2, V3, and V4',
      'Position minting, burning, and fee calculation utilities'
    ],
    architectureSummary: 'Lerna / Turborepo monorepo publishing synchronized modular packages to NPM.',
    tags: ['SDK Monorepo', 'TypeScript', 'Turborepo', 'sdk-core']
  },
  {
    id: 'v4-sdk',
    name: 'v4-sdk',
    repoName: 'Uniswap/v4-sdk',
    githubUrl: 'https://github.com/Uniswap/v4-sdk',
    category: 'sdks_tooling',
    description: 'TypeScript SDK for Uniswap v4 protocol interaction, hook calldata encoding, and PositionManager calldata building.',
    language: 'TypeScript',
    stars: 540,
    forks: 230,
    license: 'GPL-3.0',
    badge: 'v4 Developer Kit',
    npmPackage: '@uniswap/v4-sdk',
    tags: ['v4-sdk', 'Calldata Builder', 'Hook Encoding']
  },
  {
    id: 'v3-sdk',
    name: 'v3-sdk',
    repoName: 'Uniswap/v3-sdk',
    githubUrl: 'https://github.com/Uniswap/v3-sdk',
    category: 'sdks_tooling',
    description: 'TypeScript SDK for interacting with Uniswap V3, generating swap routes, and computing liquidity math.',
    language: 'TypeScript',
    stars: 1950,
    forks: 1120,
    license: 'GPL-3.0',
    npmPackage: '@uniswap/v3-sdk',
    tags: ['v3-sdk', 'Liquidity Math', 'Ticks']
  },
  {
    id: 'token-lists',
    name: 'token-lists',
    repoName: 'Uniswap/token-lists',
    githubUrl: 'https://github.com/Uniswap/token-lists',
    category: 'sdks_tooling',
    description: 'The industry-standard JSON schema specification for decentralized, community-curated ERC-20 token lists.',
    language: 'TypeScript',
    stars: 2840,
    forks: 1490,
    license: 'MIT',
    badge: 'DeFi Standard',
    npmPackage: '@uniswap/token-lists',
    tags: ['Token Lists', 'JSON Schema', 'Metadata', 'Ecosystem Standard']
  },
  {
    id: 'default-token-list',
    name: 'default-token-list',
    repoName: 'Uniswap/default-token-list',
    githubUrl: 'https://github.com/Uniswap/default-token-list',
    category: 'sdks_tooling',
    description: 'The canonical Uniswap Labs default token list repository with automated validation workflows.',
    language: 'TypeScript',
    stars: 620,
    forks: 940,
    license: 'MIT',
    tags: ['Default List', 'Verified Tokens', 'CI Validation']
  },

  // 6. Protocol Governance, Fees & Seatbelt
  {
    id: 'protocol-fees',
    name: 'protocol-fees',
    repoName: 'Uniswap/protocol-fees',
    githubUrl: 'https://github.com/Uniswap/protocol-fees',
    category: 'governance_fees',
    description: 'Uniswap Protocol Fee collection, TokenJar aggregation, and Firepit auction burn/distribution architecture.',
    language: 'Solidity',
    stars: 390,
    forks: 170,
    license: 'GPL-2.0-or-later',
    badge: 'Protocol Fee Architecture',
    tags: ['Protocol Fees', 'TokenJar', 'Firepit', 'Fee Switch']
  },
  {
    id: 'governance',
    name: 'governance',
    repoName: 'Uniswap/governance',
    githubUrl: 'https://github.com/Uniswap/governance',
    category: 'governance_fees',
    description: 'UNI governance smart contracts (GovernorBravo, Timelock, and UNI token checkpointing).',
    language: 'Solidity',
    stars: 1250,
    forks: 670,
    license: 'GPL-3.0',
    badge: 'DAO Governance',
    tags: ['UNI Token', 'GovernorBravo', 'Timelock', 'On-Chain Voting']
  },
  {
    id: 'governance-seatbelt',
    name: 'governance-seatbelt',
    repoName: 'Uniswap/governance-seatbelt',
    githubUrl: 'https://github.com/Uniswap/governance-seatbelt',
    category: 'governance_fees',
    description: 'Automated safety auditor that simulates on-chain governance proposal execution, generating detailed diffs and checking against malicious bytecode execution.',
    language: 'TypeScript',
    stars: 480,
    forks: 190,
    license: 'MIT',
    badge: 'Proposal Security Guardian',
    tags: ['Seatbelt', 'Proposal Simulation', 'Security Audit', 'State Diffs']
  },
  {
    id: 'liquidity-staker',
    name: 'liquidity-staker',
    repoName: 'Uniswap/liquidity-staker',
    githubUrl: 'https://github.com/Uniswap/liquidity-staker',
    category: 'governance_fees',
    description: 'Liquidity mining smart contracts distributing rewards to LP token holders based on duration and volume.',
    language: 'Solidity',
    stars: 580,
    forks: 340,
    license: 'GPL-3.0',
    tags: ['Staking', 'Farming', 'Rewards']
  },
  {
    id: 'merkle-distributor',
    name: 'merkle-distributor',
    repoName: 'Uniswap/merkle-distributor',
    githubUrl: 'https://github.com/Uniswap/merkle-distributor',
    category: 'governance_fees',
    description: 'Gas-efficient Merkle tree airdrop contract utilized for the historic UNI genesis distribution.',
    language: 'Solidity',
    stars: 2100,
    forks: 1300,
    license: 'GPL-3.0',
    tags: ['Merkle Airdrop', 'Cryptographic Proofs', 'Genesis']
  },

  // 7. Subgraphs, Indexers & Data
  {
    id: 'v4-subgraph',
    name: 'v4-subgraph',
    repoName: 'Uniswap/v4-subgraph',
    githubUrl: 'https://github.com/Uniswap/v4-subgraph',
    category: 'subgraphs_data',
    description: 'The Graph indexer subgraph tracking Uniswap v4 pools, volume, tick liquidity, hook events, and swap analytics.',
    language: 'TypeScript',
    stars: 320,
    forks: 140,
    license: 'GPL-3.0',
    badge: 'v4 GraphQL Indexer',
    tags: ['The Graph', 'GraphQL', 'v4 Indexer', 'Pool Analytics']
  },
  {
    id: 'v3-subgraph',
    name: 'v3-subgraph',
    repoName: 'Uniswap/v3-subgraph',
    githubUrl: 'https://github.com/Uniswap/v3-subgraph',
    category: 'subgraphs_data',
    description: 'The Graph subgraph powering Uniswap V3 info, volume charts, token prices, and LP position tracking.',
    language: 'TypeScript',
    stars: 1180,
    forks: 820,
    license: 'GPL-3.0',
    tags: ['The Graph', 'V3 Indexer', 'TVL Tracking', 'Candlestick Data']
  },
  {
    id: 'v2-subgraph',
    name: 'v2-subgraph',
    repoName: 'Uniswap/v2-subgraph',
    githubUrl: 'https://github.com/Uniswap/v2-subgraph',
    category: 'subgraphs_data',
    description: 'The Graph subgraph indexing Uniswap V2 pairs, swaps, mints, and burns across all historical blocks.',
    language: 'TypeScript',
    stars: 840,
    forks: 710,
    license: 'GPL-3.0',
    tags: ['V2 Indexer', 'Historical Data', 'GraphQL']
  },

  // 8. Frontends, Mobile & Web3 Components
  {
    id: 'interface',
    name: 'interface',
    repoName: 'Uniswap/interface',
    githubUrl: 'https://github.com/Uniswap/interface',
    category: 'interfaces_mobile',
    description: 'Open-source React web interface for the Uniswap Protocol featuring token swaps, pools, send, and token exploration.',
    language: 'TypeScript',
    stars: 5400,
    forks: 4100,
    license: 'GPL-3.0',
    badge: 'Official Web App',
    tags: ['React', 'Next.js', 'Web Interface', 'Ecosystem Gateway']
  },
  {
    id: 'wallet-mobile',
    name: 'wallet-mobile',
    repoName: 'Uniswap/wallet-mobile',
    githubUrl: 'https://github.com/Uniswap/wallet-mobile',
    category: 'interfaces_mobile',
    description: 'Self-custodial mobile wallet built in React Native with built-in Uniswap swap routing, fiat on-ramps, and MEV protection.',
    language: 'TypeScript',
    stars: 1240,
    forks: 580,
    license: 'GPL-3.0',
    badge: 'Mobile Wallet',
    tags: ['React Native', 'Mobile Wallet', 'iOS & Android', 'Self-Custody']
  },
  {
    id: 'widgets',
    name: 'widgets',
    repoName: 'Uniswap/widgets',
    githubUrl: 'https://github.com/Uniswap/widgets',
    category: 'interfaces_mobile',
    description: 'Embeddable React component library enabling any decentralized application to integrate Uniswap token swaps with customizable themes.',
    language: 'TypeScript',
    stars: 640,
    forks: 320,
    license: 'GPL-3.0',
    npmPackage: '@uniswap/widgets',
    tags: ['Embeddable Widget', 'React Component', 'Swap UI']
  },

  // 9. Unichain L2 Infrastructure
  {
    id: 'unichain',
    name: 'unichain',
    repoName: 'Uniswap/unichain',
    githubUrl: 'https://github.com/Uniswap/unichain',
    category: 'unichain_infra',
    description: 'Decentralized Ethereum Layer 2 designed specifically for DeFi with 1-second block times, verifiable block building, and native Uniswap v4 execution.',
    language: 'Go',
    stars: 1680,
    forks: 420,
    license: 'MIT',
    badge: 'DeFi-Native L2 Rollup',
    keyFeatures: [
      'Sub-second 250ms verifiable sub-blocks for instant trade finality',
      'Trusted Execution Environment (TEE) block builder preventing predatory MEV',
      'Seamless cross-chain liquidity sharing across the Superchain',
      'Subsidized gas costs optimized for high-frequency AMM rebalancing'
    ],
    architectureSummary: 'Optimism OP Stack rollup augmented with Flashbots rollblock builder and v4 Hook precompiles.',
    tags: ['Unichain', 'Layer 2', 'OP Stack', 'TEE Builder', 'Superchain']
  },
  {
    id: 'unichain-contracts',
    name: 'unichain-contracts',
    repoName: 'Uniswap/unichain-contracts',
    githubUrl: 'https://github.com/Uniswap/unichain-contracts',
    category: 'unichain_infra',
    description: 'Canonical L1-L2 bridge contracts, sequencer feeds, and gas price oracles for Unichain.',
    language: 'Solidity',
    stars: 490,
    forks: 130,
    license: 'MIT',
    tags: ['Unichain Bridge', 'L1-L2 Cross Messaging', 'Sequencer Oracles']
  }
];

export const MOCK_DUTCH_AUCTION_ORDERS: DutchAuctionOrder[] = [
  {
    id: 'order-1',
    orderHash: '0x8f23c19...4b8e',
    swapper: '0x71C...a829',
    tokenIn: '10.0 ETH',
    tokenInAmount: '10000000000000000000',
    tokenOut: 'USDC',
    startAmountOut: '35,420.00 USDC',
    endAmountOut: '34,950.00 USDC',
    decayStartTime: Date.now() - 1000 * 25,
    decayEndTime: Date.now() + 1000 * 65,
    currentDecayedAmountOut: '35,280.50 USDC',
    decayPercent: 28,
    status: 'decaying',
    filler: 'Wintermute MEV Filler #4',
    gasCostUSD: 0,
    exclusivePeriodSeconds: 15
  },
  {
    id: 'order-2',
    orderHash: '0x12a9ef0...99cd',
    swapper: '0x32D...f410',
    tokenIn: '50,000 USDC',
    tokenInAmount: '50000000000',
    tokenOut: 'WBTC',
    startAmountOut: '0.5480 WBTC',
    endAmountOut: '0.5390 WBTC',
    decayStartTime: Date.now() - 1000 * 80,
    decayEndTime: Date.now() - 1000 * 5,
    currentDecayedAmountOut: '0.5442 WBTC',
    decayPercent: 100,
    status: 'filled',
    filler: 'B2C2 Flash Liquidity',
    gasCostUSD: 0,
    exclusivePeriodSeconds: 10
  },
  {
    id: 'order-3',
    orderHash: '0x94bb311...02fa',
    swapper: '0x88F...b132',
    tokenIn: '25,000 UNI',
    tokenInAmount: '25000000000000000000000',
    tokenOut: 'ETH',
    startAmountOut: '72.50 ETH',
    endAmountOut: '70.80 ETH',
    decayStartTime: Date.now() - 1000 * 10,
    decayEndTime: Date.now() + 1000 * 110,
    currentDecayedAmountOut: '72.35 ETH',
    decayPercent: 8,
    status: 'decaying',
    gasCostUSD: 0,
    exclusivePeriodSeconds: 20
  }
];

export const V4_PRESET_HOOKS: V4HookDefinition[] = [
  {
    id: 'twamm-hook',
    name: 'Time-Weighted Average Market Maker (TWAMM)',
    repo: 'Uniswap/v4-by-example',
    hookFlagsHex: '0x0080',
    addressPrefix: '0x0080...',
    category: 'trading',
    description: 'Breaks large orders into infinitesimally small virtual orders executed smoothly across blocks to minimize price impact and MEV loss.',
    enabledPermissions: {
      beforeInitialize: false,
      afterInitialize: true,
      beforeAddLiquidity: false,
      afterAddLiquidity: false,
      beforeRemoveLiquidity: false,
      afterRemoveLiquidity: false,
      beforeSwap: true,
      afterSwap: false,
      beforeDonate: false,
      afterDonate: false,
      beforeSwapReturnDelta: true,
      afterSwapReturnDelta: false,
      afterAddLiquidityReturnDelta: false,
      afterRemoveLiquidityReturnDelta: false,
    },
    solidityTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, toBeforeSwapDelta} from "v4-core/src/types/BeforeSwapDelta.sol";

contract TWAMMHook is BaseHook {
    struct OrderPool {
        uint256 sellRateCurrent;
        uint256 earningsFactor;
    }
    mapping(bytes32 => OrderPool) public orderPools;

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: true,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata params, bytes calldata)
        external
        override
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Execute TWAMM virtual orders up to current block
        _executeVirtualOrders(key);
        return (BaseHook.beforeSwap.selector, toBeforeSwapDelta(0, 0), 0);
    }

    function _executeVirtualOrders(PoolKey calldata key) internal {
        // TWAMM mathematical integration logic
    }
}`
  },
  {
    id: 'dynamic-fee-volatility',
    name: 'Dynamic Volatility-Adjusted Fee Hook',
    repo: 'Uniswap/hook-incubator',
    hookFlagsHex: '0x0020',
    addressPrefix: '0x0020...',
    category: 'fees',
    description: 'Automatically calculates real-time implied volatility and scales pool swap fees higher during high-volatility events to protect liquidity providers from LVR (Loss-Versus-Rebalancing).',
    enabledPermissions: {
      beforeInitialize: true,
      afterInitialize: false,
      beforeAddLiquidity: false,
      afterAddLiquidity: false,
      beforeRemoveLiquidity: false,
      afterRemoveLiquidity: false,
      beforeSwap: true,
      afterSwap: true,
      beforeDonate: false,
      afterDonate: false,
      beforeSwapReturnDelta: false,
      afterSwapReturnDelta: false,
      afterAddLiquidityReturnDelta: false,
      afterRemoveLiquidityReturnDelta: false,
    },
    solidityTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";

contract VolatilityDynamicFeeHook is BaseHook {
    using LPFeeLibrary for uint24;

    uint24 public constant BASE_FEE = 500; // 0.05%
    uint24 public constant MAX_FEE = 10000; // 1.00%
    uint256 public lastBlockTimestamp;
    uint256 public rollingVolatilityEMA;

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: true,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        override
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        uint24 dynamicFee = _calculateDynamicFee();
        // Dynamic fee override with OVERRIDE_FEE_FLAG
        return (BaseHook.beforeSwap.selector, toBeforeSwapDelta(0, 0), dynamicFee | LPFeeLibrary.OVERRIDE_FEE_FLAG);
    }

    function _calculateDynamicFee() internal view returns (uint24) {
        // Volatility EMA scaling logic
        return BASE_FEE;
    }
}`
  },
  {
    id: 'limit-order-hook',
    name: 'Native On-Chain Limit Orders & Out-of-Range Claims',
    repo: 'Uniswap/v4-by-example',
    hookFlagsHex: '0x0040',
    addressPrefix: '0x0040...',
    category: 'trading',
    description: 'Allows users to place zero-fee limit orders directly on-chain within narrow tick ranges that are filled automatically when price crosses and claimed without gas penalties.',
    enabledPermissions: {
      beforeInitialize: false,
      afterInitialize: true,
      beforeAddLiquidity: false,
      afterAddLiquidity: true,
      beforeRemoveLiquidity: false,
      afterRemoveLiquidity: true,
      beforeSwap: false,
      afterSwap: true,
      beforeDonate: false,
      afterDonate: false,
      beforeSwapReturnDelta: false,
      afterSwapReturnDelta: false,
      afterAddLiquidityReturnDelta: false,
      afterRemoveLiquidityReturnDelta: false,
    },
    solidityTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract LimitOrderHook is BaseHook {
    mapping(bytes32 => uint256) public filledOrders;

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function afterSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata)
        external
        override
        onlyPoolManager
        returns (bytes4, int128)
    {
        // Check crossed ticks and mark limit orders ready for redemption
        return (BaseHook.afterSwap.selector, 0);
    }
}`
  },
  {
    id: 'kyc-compliance-hook',
    name: 'Permissioned Institutional KYC / Whitelist Hook',
    repo: 'Uniswap/v4-core',
    hookFlagsHex: '0x0001',
    addressPrefix: '0x0001...',
    category: 'security',
    description: 'Enforces ERC-3643 / EAS on-chain attestations before permitting swaps or LP capital allocations, enabling compliant institutional dark pools on Uniswap v4.',
    enabledPermissions: {
      beforeInitialize: true,
      afterInitialize: false,
      beforeAddLiquidity: true,
      afterAddLiquidity: false,
      beforeRemoveLiquidity: true,
      afterRemoveLiquidity: false,
      beforeSwap: true,
      afterSwap: false,
      beforeDonate: false,
      afterDonate: false,
      beforeSwapReturnDelta: false,
      afterSwapReturnDelta: false,
      afterAddLiquidityReturnDelta: false,
      afterRemoveLiquidityReturnDelta: false,
    },
    solidityTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";

contract InstitutionalKYCHook is BaseHook {
    mapping(address => bool) public isKYCVerified;

    error UserNotKYCCompliant(address sender);

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function beforeSwap(address sender, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        view
        override
        onlyPoolManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        if (!isKYCVerified[sender]) revert UserNotKYCCompliant(sender);
        return (BaseHook.beforeSwap.selector, toBeforeSwapDelta(0, 0), 0);
    }
}`
  }
];
