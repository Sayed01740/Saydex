import {
  Permit2Allowance,
  Permit2EIP712Signature,
  UniversalRouterExecutionResult,
  NFTMarketItem,
  UniversalRouterCommand,
} from '../types/universalRouter';
import { PERMIT2_CONTRACT_ADDRESS } from '../utils/universalRouterEncoder';

export const INITIAL_PERMIT2_ALLOWANCES: Permit2Allowance[] = [];

export const INITIAL_PERMIT2_SIGNATURES: Permit2EIP712Signature[] = [];

export const INITIAL_UNIVERSAL_ROUTER_EXECUTIONS: UniversalRouterExecutionResult[] = [];

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
