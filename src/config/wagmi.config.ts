/// <reference types="vite/client" />
import { http, fallback, createConfig } from 'wagmi';
import {
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  avalanche,
  sepolia,
  unichain,
} from './chains';
import {
  injected,
  metaMask,
  walletConnect,
  coinbaseWallet,
} from 'wagmi/connectors';

/**
 * Single authoritative Wagmi configuration.
 * ONE createConfig() call — referenced by WagmiProvider in main.tsx.
 * Do NOT create additional createConfig() instances inside components.
 */

const rawProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const projectId = (rawProjectId && rawProjectId !== 'YOUR_WALLETCONNECT_PROJECT_ID' && rawProjectId.trim().length > 5)
  ? rawProjectId.trim()
  : '';

export const wagmiConfig = createConfig({
  chains: [mainnet, base, optimism, arbitrum, polygon, avalanche, sepolia, unichain],
  connectors: [
    // EIP-6963: auto-discovers ALL injected wallets (MetaMask, Rabby, Phantom EVM, etc.)
    // This is the modern standard — wallets announce themselves, no collision.
    injected(),
    // Explicit MetaMask connector for wallets that prefer the legacy window.ethereum path
    metaMask(),
    // WalletConnect v2 — only included when valid VITE_WALLETCONNECT_PROJECT_ID exists
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: 'Axiom Protocol',
              description: 'Advanced DeFi Terminal',
              url: typeof window !== 'undefined' ? window.location.origin : 'https://axiom.finance',
              icons: ['https://axiom.finance/logo.png'],
            },
            showQrModal: true,
          }),
        ]
      : []),
    // Coinbase Wallet (Smart Wallet + extension)
    coinbaseWallet({ appName: 'Axiom Protocol' }),
  ],
  transports: {
    // Primary + fallback RPC per chain for resilience
    // RC-18/19: Each chain has its own isolated transport — no cross-chain RPC bleed
    [mainnet.id]: fallback([
      http('https://eth.llamarpc.com'),
      http('https://cloudflare-eth.com'),
      http('https://ethereum-rpc.publicnode.com'),
    ]),
    [base.id]: fallback([
      http('https://mainnet.base.org'),
      http('https://base-rpc.publicnode.com'),
      http('https://base.llamarpc.com'),
    ]),
    [optimism.id]: fallback([
      http('https://mainnet.optimism.io'),
      http('https://optimism-rpc.publicnode.com'),
      http('https://optimism.llamarpc.com'),
    ]),
    [arbitrum.id]: fallback([
      http('https://arb1.arbitrum.io/rpc'),
      http('https://arbitrum-one-rpc.publicnode.com'),
      http('https://arbitrum.llamarpc.com'),
    ]),
    [polygon.id]: fallback([
      http('https://polygon-rpc.com'),
      http('https://polygon-bor-rpc.publicnode.com'),
      http('https://polygon.llamarpc.com'),
    ]),
    [avalanche.id]: fallback([
      http('https://api.avax.network/ext/bc/C/rpc'),
      http('https://avalanche-c-chain-rpc.publicnode.com'),
      http('https://rpc.ankr.com/avalanche'),
    ]),
    [sepolia.id]: fallback([
      http('https://rpc.sepolia.org'),
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://sepolia.gateway.tenderly.co'),
    ]),
    [unichain.id]: fallback([
      http('https://mainnet.unichain.org'),
      http('https://unichain-rpc.publicnode.com'),
    ]),
  },
});
