import {
  Permit2Allowance,
  Permit2EIP712Signature,
  UniversalRouterExecutionResult,
  NFTMarketItem,
  UniversalRouterCommand,
} from '../types/universalRouter';
import { PERMIT2_CONTRACT_ADDRESS } from '../utils/universalRouterEncoder';

export const INITIAL_PERMIT2_ALLOWANCES: Permit2Allowance[] = [
  {
    tokenSymbol: 'USDC',
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tokenIcon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    allowanceAmount: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    isUnlimited: true,
    expirationTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 28, // 28 days left
    nonce: 3,
    isPermit2Approved: true,
  },
  {
    tokenSymbol: 'WETH',
    tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tokenIcon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    allowanceAmount: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
    isUnlimited: true,
    expirationTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days left
    nonce: 1,
    isPermit2Approved: true,
  },
  {
    tokenSymbol: 'UNI',
    tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    tokenIcon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
    allowanceAmount: '5000000000000000000000',
    isUnlimited: false,
    expirationTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days left
    nonce: 0,
    isPermit2Approved: true,
  },
  {
    tokenSymbol: 'WBTC',
    tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    tokenIcon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    allowanceAmount: '0',
    isUnlimited: false,
    expirationTimestamp: 0,
    nonce: 0,
    isPermit2Approved: false,
  },
  {
    tokenSymbol: 'DAI',
    tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    tokenIcon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    allowanceAmount: '0',
    isUnlimited: false,
    expirationTimestamp: 0,
    nonce: 0,
    isPermit2Approved: false,
  },
];

export const INITIAL_PERMIT2_SIGNATURES: Permit2EIP712Signature[] = [
  {
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tokenSymbol: 'USDC',
    spender: '0x66a9893cC07D91D95644AEDD05d03f95e1dBA8Af',
    amount: '1000000000',
    nonce: 3,
    deadline: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    r: '0x3a928e469083fd1420b92e70f612048598a39a03977ec309489f0322d815e982',
    s: '0x43ba4e6b541314ff90f671ebfa061a91e5c3e031a5eb234c9c1b72e1e7fa8302',
    v: 27,
    signatureHex: '0x3a928e469083fd1420b92e70f612048598a39a03977ec309489f0322d815e98243ba4e6b541314ff90f671ebfa061a91e5c3e031a5eb234c9c1b72e1e7fa83021b',
    signedTimestamp: Date.now() - 1000 * 60 * 35,
  },
];

export const INITIAL_UNIVERSAL_ROUTER_EXECUTIONS: UniversalRouterExecutionResult[] = [
  {
    id: 'exec-1',
    hash: '0x8f23...49a1',
    commandsHex: '0x0200040b',
    commandCount: 4,
    inputsCount: 4,
    gasUsed: 114500,
    gasSavingsUSD: 9.85,
    timestamp: Date.now() - 1000 * 60 * 18,
    status: 'confirmed',
    summary: 'PERMIT2_PERMIT -> V3_SWAP (USDC -> WETH) -> UNWRAP_WETH -> SWEEP',
  },
  {
    id: 'exec-2',
    hash: '0x2a91...bc72',
    commandsHex: '0x03000b',
    commandCount: 3,
    inputsCount: 3,
    gasUsed: 98200,
    gasSavingsUSD: 7.20,
    timestamp: Date.now() - 1000 * 60 * 85,
    status: 'confirmed',
    summary: 'WRAP_ETH -> V3_SWAP (WETH -> UNI) -> SWEEP',
  },
  {
    id: 'exec-3',
    hash: '0x71e0...dd84',
    commandsHex: '0x0200210b',
    commandCount: 4,
    inputsCount: 4,
    gasUsed: 198400,
    gasSavingsUSD: 24.50,
    timestamp: Date.now() - 1000 * 60 * 240,
    status: 'confirmed',
    summary: 'PERMIT2_PERMIT -> V3_SWAP (USDC -> WETH) -> SEAPORT_V1_5 (Uniswap V3 LP NFT #4928) -> SWEEP',
  },
];

export const MOCK_NFT_ITEMS: NFTMarketItem[] = [
  {
    id: 'nft-1',
    collectionName: 'Uniswap V3 Position NFT',
    tokenId: '#4928 (ETH/USDC 0.05%)',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80',
    priceETH: 0.85,
    priceUSD: 2932.50,
    marketplace: 'Seaport v1.5',
    commandOpcode: UniversalRouterCommand.SEAPORT_V1_5,
  },
  {
    id: 'nft-2',
    collectionName: 'Uniswap Socks (SOCKS)',
    tokenId: '#142',
    image: 'https://images.unsplash.com/photo-1582965314431-a23644635697?w=600&auto=format&fit=crop&q=80',
    priceETH: 2.15,
    priceUSD: 7417.50,
    marketplace: 'LooksRare v2',
    commandOpcode: UniversalRouterCommand.LOOKS_RARE_V2,
  },
  {
    id: 'nft-3',
    collectionName: 'CryptoPunks',
    tokenId: '#5821',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=600&auto=format&fit=crop&q=80',
    priceETH: 32.5,
    priceUSD: 112125.00,
    marketplace: 'CryptoPunks',
    commandOpcode: UniversalRouterCommand.CRYPTOPUNKS,
  },
  {
    id: 'nft-4',
    collectionName: 'SudoSwap Concentrated Pool',
    tokenId: '#881',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    priceETH: 0.45,
    priceUSD: 1552.50,
    marketplace: 'Sudoswap',
    commandOpcode: UniversalRouterCommand.SUDOSWAP,
  },
];
