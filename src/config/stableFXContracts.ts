/**
 * Circle StableFX Contract Deployments on Arc
 * Circle's Native Institutional FX Engine on Arc Network (PvP Atomic Settlement)
 */

export interface StableFXDeployment {
  chainId: number;
  chainName: string;
  routerAddress: string;
  fxEscrow: string;
  permit2: string;
  supportedTokens: string[];
  explorerUrl: string;
}

export const STABLEFX_DEPLOYMENTS: Record<number, StableFXDeployment> = {
  // Arc Mainnet (5042)
  5042: {
    chainId: 5042,
    chainName: 'Arc Mainnet',
    routerAddress: '0x73742278c31a76dBb0D2587d03ef92E6E2141023',
    fxEscrow: '0xe2E5F173576B513d994073CCbDaCBE027d43DFe6',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    supportedTokens: ['USDC', 'EURC', 'USYC'],
    explorerUrl: 'https://explorer.arc.io',
  },
  // Arc Testnet (5042002)
  5042002: {
    chainId: 5042002,
    chainName: 'Arc Testnet',
    routerAddress: '0x73742278c31a76dBb0D2587d03ef92E6E2141023',
    fxEscrow: '0xd68256f4D69C6BbEcB873D8588AE0Dc6B8E22E10',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    supportedTokens: ['USDC', 'EURC', 'USYC'],
    explorerUrl: 'https://testnet.arcscan.app',
  },
};

export function getStableFXDeployment(chainId: number): StableFXDeployment | undefined {
  return STABLEFX_DEPLOYMENTS[chainId];
}

export function isStableFXPair(chainId: number, tokenASymbol: string, tokenBSymbol: string): boolean {
  const deployment = getStableFXDeployment(chainId);
  if (!deployment) return false;
  const symA = tokenASymbol.toUpperCase();
  const symB = tokenBSymbol.toUpperCase();
  return deployment.supportedTokens.includes(symA) && deployment.supportedTokens.includes(symB) && symA !== symB;
}
