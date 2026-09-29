import { ethers } from 'ethers';

/**
 * GIWA Chain Ecosystem Service
 * Built for Dunamu / Upbit Ethereum Layer 2 Network (Chain ID: 91342)
 */

export const GIWA_CONSTANTS = {
  chainId: 91342,
  chainName: 'GIWA Sepolia',
  rpcUrl: 'https://sepolia-rpc.giwa.io',
  flashblocksRpcUrl: 'https://sepolia-rpc-flashblocks.giwa.io',
  explorerUrl: 'https://sepolia-explorer.giwa.io',

  // Core DEX Deployments on GIWA Sepolia
  factory: '0xE9348e3e3c17D721575e294BE271BCD11028809e',
  swapRouter02: '0xF0B95C36d907441c5936D4c14ff7610957A6d926',
  nonfungiblePositionManager: '0xf72BcA1af1F50C133Ea5211c60c479045A7e5106',
  quoterV2: '0x7788cb9e1Dba291623c51f10A2f3fd199676202f',
  tickLens: '0x172E2402955c5de6eE6D47A41fD7a29334aa0b7e',

  // Pre-installed System Contracts
  weth9: '0x4200000000000000000000000000000000000006',
  permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  multicall3: '0xca11bde05977b3631167028862be2a173976ca11',

  // GIWA Native Ecosystem Services
  upNameRegistry: '0x091D00004f21eb2Fc30964A8a4995692d9b49628',
  verifiedToken: '0xBCdB22f56642DE57624CfC2fBb9eE398cF3CA268',
  verifiedTokenFaucet: '0xfe4b4F5f2f8843dC9Ca75E563f2f7eB0f44Ae83e',
};

class GiwaService {
  private flashblocksProvider: ethers.JsonRpcProvider | null = null;

  constructor() {
    try {
      this.flashblocksProvider = new ethers.JsonRpcProvider(GIWA_CONSTANTS.flashblocksRpcUrl);
    } catch {
      this.flashblocksProvider = null;
    }
  }

  /**
   * Check if current chain is GIWA Sepolia
   */
  public isGiwa(chainId: number): boolean {
    return chainId === GIWA_CONSTANTS.chainId;
  }

  /**
   * Get latest block from Flashblocks RPC for instant confirmation (<1.0s)
   */
  public async getLatestFlashblockNumber(): Promise<number | null> {
    try {
      if (!this.flashblocksProvider) {
        this.flashblocksProvider = new ethers.JsonRpcProvider(GIWA_CONSTANTS.flashblocksRpcUrl);
      }
      return await this.flashblocksProvider.getBlockNumber();
    } catch (err) {
      console.warn('[GIWA] Flashblocks RPC query error:', err);
      return null;
    }
  }

  /**
   * Resolve an Upbit Web3 Name (e.g. "sayed.up") on GIWA
   */
  public async resolveUpName(name: string): Promise<string | null> {
    if (!name.endsWith('.up')) return null;
    try {
      // Mock / fallback resolution or query UPNameRegistry
      return null;
    } catch (err) {
      console.warn('[GIWA] UP Name resolution error:', err);
      return null;
    }
  }
}

export const giwaService = new GiwaService();
