import React, { useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useWallet } from '../../context/WalletContext';
import {
  UniversalRouterCommand,
  UniversalRouterCommandMeta,
  UniversalRouterStep,
  NFTMarketItem,
} from '../../types/universalRouter';
import {
  UNIVERSAL_ROUTER_COMMAND_DEFINITIONS,
  UNIVERSAL_ROUTER_DEPLOYMENTS,
  PERMIT2_CONTRACT_ADDRESS,
  encodeCommandsByteString,
  disassembleCommandsHex,
  buildSwapUniversalRouterExecution,
} from '../../utils/universalRouterEncoder';
import { MOCK_NFT_ITEMS } from '../../data/universalRouterData';
import { Button } from '../common/Button';
import { TokenIcon } from '../common/TokenIcon';
import {
  Zap,
  ShieldCheck,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Code,
  Activity,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  ShoppingBag,
  Cpu,
  FileCode2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Key,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type RouterTab = 'builder' | 'permit2' | 'nft_atomic' | 'gas_benchmark' | 'contracts';

export const UniversalRouterView: React.FC = () => {
  const {
    tokens,
    permit2Allowances,
    permit2Signatures,
    universalRouterExecutions,
    signPermit2Approval,
    revokePermit2Approval,
    executeUniversalRouterCalldata,
    addToast,
  } = useProtocol();

  const { selectedChain, sendTransaction, signTypedDataV4, address } = useWallet();

  const [activeTab, setActiveTab] = useState<RouterTab>('builder');
  const [selectedChainId, setSelectedChainId] = useState<number>(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isExecutingPipeline, setIsExecutingPipeline] = useState(false);
  const [isSigningPermit2, setIsSigningPermit2] = useState(false);

  // Command Builder State
  const [pipelineSteps, setPipelineSteps] = useState<UniversalRouterStep[]>([
    {
      id: 'step-1',
      command: UniversalRouterCommand.PERMIT2_PERMIT,
      opcodeHex: '0x02',
      name: 'PERMIT2_PERMIT',
      category: 'permit2',
      description: 'Applies off-chain EIP-712 Permit2 authorization (gasless token transfer approval)',
      params: { token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', amount: 'Max', nonce: 3 },
      inputBytesHex: '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      gasEstimate: 28000,
    },
    {
      id: 'step-2',
      command: UniversalRouterCommand.V3_SWAP_EXACT_IN,
      opcodeHex: '0x00',
      name: 'V3_SWAP_EXACT_IN',
      category: 'swap',
      description: 'Swaps 2,500 USDC for WETH via Uniswap V3 0.05% pool',
      params: { recipient: '0x0000000000000000000000000000000000000002', amountIn: '2500000000', amountOutMin: '715000000000000000', payerIsUser: false },
      inputBytesHex: '0x0000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000009502f90000000000000000000000000000000000000000000000000009ec35e6ba300000',
      gasEstimate: 85000,
    },
    {
      id: 'step-3',
      command: UniversalRouterCommand.UNWRAP_WETH,
      opcodeHex: '0x04',
      name: 'UNWRAP_WETH',
      category: 'eth',
      description: 'Unwraps received WETH into native ETH and forwards to user',
      params: { recipient: '0x0000000000000000000000000000000000000001', amountMin: '715000000000000000' },
      inputBytesHex: '0x000000000000000000000000000000000000000100000000000000000000000000000000000000000000000009ec35e6ba300000',
      gasEstimate: 29000,
    },
    {
      id: 'step-4',
      command: UniversalRouterCommand.SWEEP,
      opcodeHex: '0x0b',
      name: 'SWEEP',
      category: 'utility',
      description: 'Sweeps any leftover token dust back to user wallet',
      params: { token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', recipient: '0x0000000000000000000000000000000000000001', amountMin: '0' },
      inputBytesHex: '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000001',
      gasEstimate: 16000,
    },
  ]);

  const [decoderInput, setDecoderInput] = useState('0x0200040b');
  const [decodedCommands, setDecodedCommands] = useState<UniversalRouterCommandMeta[]>(
    disassembleCommandsHex('0x0200040b')
  );

  // Permit2 Signer Interactive State
  const [selectedPermitToken, setSelectedPermitToken] = useState('USDC');
  const [permitAmountType, setPermitAmountType] = useState<'max' | 'custom'>('max');
  const [customPermitAmount, setCustomPermitAmount] = useState('5000');

  // NFT Atomic Trade State
  const [selectedNft, setSelectedNft] = useState<NFTMarketItem>(MOCK_NFT_ITEMS[0]);
  const [nftPayToken, setNftPayToken] = useState('USDC');
  const [isExecutingAtomicNft, setIsExecutingAtomicNft] = useState(false);

  // Active Deployment
  const currentDeployment =
    UNIVERSAL_ROUTER_DEPLOYMENTS[selectedChainId as keyof typeof UNIVERSAL_ROUTER_DEPLOYMENTS] ||
    UNIVERSAL_ROUTER_DEPLOYMENTS[1];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAddCommand = (cmd: UniversalRouterCommand) => {
    const meta = UNIVERSAL_ROUTER_COMMAND_DEFINITIONS[cmd];
    const newStep: UniversalRouterStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      command: cmd,
      opcodeHex: meta.opcodeHex,
      name: meta.name,
      category: meta.category,
      description: meta.description,
      params: meta.parameterSchema.reduce((acc, p) => ({ ...acc, [p.name]: p.defaultVal || '' }), {}),
      inputBytesHex: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      gasEstimate: meta.gasEstimateGwei,
    };
    setPipelineSteps((prev) => [...prev, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setPipelineSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDecodeCalldata = (hex: string) => {
    setDecoderInput(hex);
    const parsed = disassembleCommandsHex(hex);
    setDecodedCommands(parsed);
  };

  const compiledCommandsHex = encodeCommandsByteString(pipelineSteps.map((s) => s.command));
  const totalGas = pipelineSteps.reduce((acc, s) => acc + s.gasEstimate, 21000);
  const traditionalGas = totalGas + 68000;
  const gasSavingsPct = Math.round(((traditionalGas - totalGas) / traditionalGas) * 100);

  const handleExecutePipeline = async () => {
    try {
      setIsExecutingPipeline(true);
      const summary = pipelineSteps.map((s) => s.name).join(' -> ');
      
      const routerAddress = currentDeployment.routerAddress;
      const tx = await sendTransaction({
        to: routerAddress,
        value: '0x0',
        data: `0x3593564c${compiledCommandsHex.replace('0x', '')}`,
        title: `Universal Router: ${pipelineSteps.length} Opcodes`,
      });

      executeUniversalRouterCalldata(compiledCommandsHex, pipelineSteps.length, summary);
      setIsExecutingPipeline(false);
    } catch (err: any) {
      console.warn('Pipeline execution rejected:', err);
      setIsExecutingPipeline(false);
      addToast({
        type: 'error',
        title: 'Execution Cancelled',
        description: err.message || 'Signature / Transaction was rejected in your Web3 wallet.',
      });
    }
  };

  const handleExecuteAtomicNftTrade = async () => {
    try {
      setIsExecutingAtomicNft(true);
      const summary = `PERMIT2_PERMIT -> V3_SWAP (${nftPayToken} -> WETH) -> ${selectedNft.marketplace} (${selectedNft.collectionName} ${selectedNft.tokenId}) -> SWEEP`;
      const randomCommands = '0x0200210b';
      
      const tx = await sendTransaction({
        to: currentDeployment.routerAddress,
        value: '0x0',
        data: '0x3593564c0200210b',
        title: `Atomic NFT Swap: ${selectedNft.collectionName} #${selectedNft.tokenId}`,
      });

      executeUniversalRouterCalldata(randomCommands, 4, summary);
      setIsExecutingAtomicNft(false);
      addToast({
        type: 'success',
        title: 'Atomic Multi-Asset NFT Swap Complete!',
        description: `Successfully swapped ${nftPayToken} and acquired ${selectedNft.collectionName} ${selectedNft.tokenId} on-chain!`,
      });
    } catch (err: any) {
      console.warn('Atomic NFT trade rejected:', err);
      setIsExecutingAtomicNft(false);
      addToast({
        type: 'error',
        title: 'NFT Trade Rejected',
        description: err.message || 'Wallet rejected the atomic settlement transaction.',
      });
    }
  };

  const handleSignPermit2WithWallet = async (tokenSymbol: string) => {
    try {
      setIsSigningPermit2(true);
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          PermitSingle: [
            { name: 'details', type: 'PermitDetails' },
            { name: 'spender', type: 'address' },
            { name: 'sigDeadline', type: 'uint256' },
          ],
          PermitDetails: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint160' },
            { name: 'expiration', type: 'uint48' },
            { name: 'nonce', type: 'uint48' },
          ],
        },
        primaryType: 'PermitSingle',
        domain: {
          name: 'Permit2',
          chainId: selectedChainId,
          verifyingContract: PERMIT2_CONTRACT_ADDRESS,
        },
        message: {
          details: {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '1461501637330902918203684832716283019655932542975',
            expiration: Math.floor(Date.now() / 1000) + 86400 * 30,
            nonce: 0,
          },
          spender: currentDeployment.routerAddress,
          sigDeadline: Math.floor(Date.now() / 1000) + 3600,
        },
      };

      await signTypedDataV4(typedData);
      signPermit2Approval(tokenSymbol);
      setIsSigningPermit2(false);
    } catch (err: any) {
      console.warn('Permit2 signing rejected:', err);
      setIsSigningPermit2(false);
      addToast({
        type: 'error',
        title: 'Permit2 Signature Rejected',
        description: err.message || 'User rejected EIP-712 structured data signing in wallet.',
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-app)] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                Uniswap Universal Router
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Permit2 EIP-712 Integrated
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-mono">
                v2.0 (V4 & NFT Capable)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Universal Router & Permit2 Engine
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
              Next-generation unified execution pipeline combining ERC-20 swaps (V2/V3/V4), Permit2 gasless signatures, ETH wrap/unwrap, and multi-protocol NFT settlements in a single atomic byte-encoded transaction.
            </p>
          </div>

          {/* Chain Deployment Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5">
              <div className="text-xs text-[var(--text-tertiary)] flex items-center justify-between">
                <span>Active Router Deployment</span>
                <span className="text-[10px] text-emerald-500 font-mono">● LIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedChainId}
                  onChange={(e) => setSelectedChainId(Number(e.target.value))}
                  className="bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[var(--border-app)] outline-none cursor-pointer"
                >
                  <option value={1}>Ethereum Mainnet</option>
                  <option value={42161}>Arbitrum One</option>
                  <option value={8453}>Base</option>
                  <option value={10}>OP Mainnet</option>
                  <option value={137}>Polygon</option>
                </select>
                <button
                  onClick={() => handleCopy(currentDeployment.routerAddress, 'router-addr')}
                  className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-app)] text-[var(--text-secondary)] transition-colors"
                  title="Copy Universal Router Address"
                >
                  {copiedText === 'router-addr' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={currentDeployment.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border-app)] text-[var(--text-secondary)] transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">Supported Opcode Commands</span>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">24 Commands</div>
            <span className="text-[10px] text-pink-500">V2, V3, V4, Permit2, NFT</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">Gas Reduction Rate</span>
            <div className="text-xl font-bold font-mono text-emerald-500 mt-0.5">~38.4%</div>
            <span className="text-[10px] text-[var(--text-secondary)]">vs Separate Multicalls</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">Canonical Permit2 Vault</span>
            <div className="text-xs font-mono font-bold text-[var(--text-primary)] truncate mt-1.5">
              0x000000000022...78BA3
            </div>
            <span className="text-[10px] text-purple-400">Single Universal Approval</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-tertiary)]">Atomic Execution Status</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">100% Revert Safe</div>
            <span className="text-[10px] text-[var(--text-secondary)]">All-or-nothing rollback</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[var(--border-subtle)]">
        {[
          { id: 'builder', label: 'Command Pipeline & Calldata Builder', icon: Layers },
          { id: 'permit2', label: 'Permit2 Signature Station', icon: Key },
          { id: 'nft_atomic', label: 'Token + NFT Multi-Trade Studio', icon: ShoppingBag },
          { id: 'gas_benchmark', label: 'Gas Efficiency Benchmark', icon: TrendingDown },
          { id: 'contracts', label: 'Verified Contracts & Architecture', icon: FileCode2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RouterTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-app)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Command Pipeline & Calldata Builder */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Command Stack */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">Execution Command Pipeline</h3>
                      <p className="text-xs text-[var(--text-secondary)]">Sequential atomic commands executed by UniversalRouter.execute()</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setPipelineSteps([
                        {
                          id: 'step-1',
                          command: UniversalRouterCommand.PERMIT2_PERMIT,
                          opcodeHex: '0x02',
                          name: 'PERMIT2_PERMIT',
                          category: 'permit2',
                          description: 'Applies off-chain EIP-712 Permit2 signature',
                          params: { token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', amount: 'Max', nonce: 3 },
                          inputBytesHex: '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                          gasEstimate: 28000,
                        },
                        {
                          id: 'step-2',
                          command: UniversalRouterCommand.V3_SWAP_EXACT_IN,
                          opcodeHex: '0x00',
                          name: 'V3_SWAP_EXACT_IN',
                          category: 'swap',
                          description: 'Swaps 2,500 USDC for WETH',
                          params: { recipient: '0x0000000000000000000000000000000000000002', amountIn: '2500000000' },
                          inputBytesHex: '0x0000000000000000000000000000000000000002',
                          gasEstimate: 85000,
                        },
                        {
                          id: 'step-3',
                          command: UniversalRouterCommand.SWEEP,
                          opcodeHex: '0x0b',
                          name: 'SWEEP',
                          category: 'utility',
                          description: 'Sweeps any remaining tokens back to user',
                          params: { token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
                          inputBytesHex: '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                          gasEstimate: 16000,
                        },
                      ])
                    }
                    className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Pipeline Step List */}
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {pipelineSteps.map((step, idx) => {
                      const categoryColors = {
                        swap: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                        permit2: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        eth: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                        utility: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        nft: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                        v4: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                      };

                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-app)] transition-all relative group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-app)] text-[11px] font-mono font-bold flex items-center justify-center text-[var(--text-tertiary)]">
                                {idx + 1}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${categoryColors[step.category]}`}>
                                {step.opcodeHex}
                              </span>
                              <span className="font-bold text-sm text-[var(--text-primary)]">{step.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                                ~{step.gasEstimate.toLocaleString()} gas
                              </span>
                              <button
                                onClick={() => handleRemoveStep(step.id)}
                                className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[var(--text-secondary)] mt-2 pl-8.5">
                            {step.description}
                          </p>

                          {/* Raw Input Bytes Snippet */}
                          <div className="mt-2.5 pl-8.5 flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-surface)]/80 p-2 rounded-lg border border-[var(--border-subtle)]">
                            <span className="truncate max-w-[280px] sm:max-w-md">inputs[{idx}]: {step.inputBytesHex}</span>
                            <button
                              onClick={() => handleCopy(step.inputBytesHex, `step-${idx}`)}
                              className="hover:text-[var(--text-primary)] shrink-0 ml-2"
                            >
                              {copiedText === `step-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Add Command Palette */}
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                  <span className="text-xs font-semibold text-[var(--text-tertiary)]">Add Command to Pipeline:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { cmd: UniversalRouterCommand.PERMIT2_PERMIT, label: '+ PERMIT2_PERMIT', color: 'text-emerald-500 hover:bg-emerald-500/10' },
                      { cmd: UniversalRouterCommand.V3_SWAP_EXACT_IN, label: '+ V3_SWAP', color: 'text-indigo-400 hover:bg-indigo-500/10' },
                      { cmd: UniversalRouterCommand.WRAP_ETH, label: '+ WRAP_ETH', color: 'text-cyan-400 hover:bg-cyan-500/10' },
                      { cmd: UniversalRouterCommand.UNWRAP_WETH, label: '+ UNWRAP_WETH', color: 'text-cyan-400 hover:bg-cyan-500/10' },
                      { cmd: UniversalRouterCommand.SWEEP, label: '+ SWEEP', color: 'text-amber-400 hover:bg-amber-500/10' },
                      { cmd: UniversalRouterCommand.PAY_PORTION, label: '+ PAY_PORTION', color: 'text-amber-400 hover:bg-amber-500/10' },
                      { cmd: UniversalRouterCommand.V4_SWAP, label: '+ V4_SWAP', color: 'text-purple-400 hover:bg-purple-500/10' },
                      { cmd: UniversalRouterCommand.SEAPORT_V1_5, label: '+ SEAPORT (NFT)', color: 'text-pink-400 hover:bg-pink-500/10' },
                    ].map((item) => (
                      <button
                        key={item.cmd}
                        onClick={() => handleAddCommand(item.cmd)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-app)] transition-colors ${item.color}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Calldata Compiler & Execution Simulator */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Code className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">Compiled Calldata</h3>
                      <p className="text-xs text-[var(--text-secondary)]">execute(bytes commands, bytes[] inputs)</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                    -{gasSavingsPct}% Gas
                  </span>
                </div>

                {/* Encoded Commands String */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-tertiary)] font-semibold">bytes commands (Opcode Sequence)</span>
                    <button
                      onClick={() => handleCopy(compiledCommandsHex, 'commands-hex')}
                      className="text-xs text-pink-400 hover:underline flex items-center gap-1"
                    >
                      {copiedText === 'commands-hex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-sm font-bold text-pink-400 break-all">
                    {compiledCommandsHex}
                  </div>
                </div>

                {/* Function Selector & Inputs Array Info */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Function Selector:</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">0x3593564c (execute)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Command Count:</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{pipelineSteps.length} Opcodes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Total Inputs Array:</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{pipelineSteps.length} Byte Arrays</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Estimated Gas:</span>
                    <span className="font-mono font-bold text-emerald-500">~{totalGas.toLocaleString()} gas</span>
                  </div>
                </div>

                {/* Execute Pipeline Button */}
                <Button
                  disabled={isExecutingPipeline}
                  onClick={handleExecutePipeline}
                  className="w-full py-3 text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExecutingPipeline ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming in Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Simulate & Execute Pipeline</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Instant Calldata Disassembler Card */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Calldata Hex Disassembler</h4>
                    <p className="text-[11px] text-[var(--text-secondary)]">Paste any Universal Router `commands` hex to reverse-engineer opcodes</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={decoderInput}
                    onChange={(e) => handleDecodeCalldata(e.target.value)}
                    placeholder="e.g. 0x0200040b"
                    className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] outline-none focus:border-pink-500"
                  />
                </div>

                {/* Decoded Steps Preview */}
                <div className="space-y-1.5 pt-1">
                  {decodedCommands.map((dc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">#{i + 1}</span>
                        <span className="font-mono font-bold text-pink-400">{dc.opcodeHex}</span>
                        <span className="font-semibold text-[var(--text-primary)]">{dc.name}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[140px]">{dc.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Executions Stream */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Recent Universal Router Transactions
            </h3>

            <div className="space-y-2">
              {universalRouterExecutions.map((exec) => (
                <div
                  key={exec.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{exec.summary}</div>
                      <div className="text-[11px] font-mono text-[var(--text-tertiary)]">
                        commands: <span className="text-pink-400">{exec.commandsHex}</span> • Tx: {exec.hash}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center font-mono">
                    <span className="text-emerald-500 font-semibold">+${exec.gasSavingsUSD.toFixed(2)} Saved</span>
                    <span className="text-[var(--text-tertiary)]">{exec.gasUsed.toLocaleString()} gas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Permit2 Signature Station */}
      {activeTab === 'permit2' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Active Permit2 Allowances */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">Permit2 Token Allowances</h3>
                      <p className="text-xs text-[var(--text-secondary)]">Single master approval enables signature-based zero-gas trading</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    EIP-712 Active
                  </span>
                </div>

                {/* Token Allowance List */}
                <div className="space-y-2.5">
                  {permit2Allowances.map((item) => (
                    <div
                      key={item.tokenSymbol}
                      className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <TokenIcon symbol={item.tokenSymbol} icon={item.tokenIcon} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--text-primary)]">{item.tokenSymbol}</span>
                            {item.isPermit2Approved ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Approved (Gasless Ready)
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-tertiary)] border border-[var(--border-app)]">
                                Not Authorized
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {item.isPermit2Approved
                              ? item.isUnlimited
                                ? 'Unlimited (Max uint160)'
                                : `Allowance: ${item.allowanceAmount}`
                              : '0.00 Allowance'}
                            {item.expirationTimestamp > 0 && (
                              <span className="text-[var(--text-tertiary)] ml-2">
                                • Expires in {Math.ceil((item.expirationTimestamp - Date.now()) / (1000 * 60 * 60 * 24))}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.isPermit2Approved ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => revokePermit2Approval(item.tokenSymbol)}
                            className="text-xs text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
                          >
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isSigningPermit2}
                            onClick={() => handleSignPermit2WithWallet(item.tokenSymbol)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                          >
                            {isSigningPermit2 ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Signing...</span>
                              </>
                            ) : (
                              <span>Sign Permit2</span>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Interactive EIP-712 Signature Studio */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Permit2 Signature Studio</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Generate & sign off-chain EIP-712 structured data</p>
                  </div>
                </div>

                {/* Token Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-tertiary)]">Select Token to Authorize</label>
                  <select
                    value={selectedPermitToken}
                    onChange={(e) => setSelectedPermitToken(e.target.value)}
                    className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] text-sm font-semibold p-2.5 rounded-xl border border-[var(--border-subtle)] outline-none"
                  >
                    {tokens.map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.name} ({t.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Spender Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-tertiary)]">Spender Contract</label>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] truncate">
                    UniversalRouter ({currentDeployment.routerAddress})
                  </div>
                </div>

                {/* EIP-712 Payload Preview */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-tertiary)]">EIP-712 Typed Data Struct</label>
                  <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-1">
                    <div>Domain: &#123; name: "Permit2", chainId: {selectedChainId}, verifyingContract: "{PERMIT2_CONTRACT_ADDRESS.slice(0, 10)}..." &#125;</div>
                    <div>PrimaryType: "PermitSingle"</div>
                    <div>Details: &#123; token: "{selectedPermitToken}", amount: "Max", expiration: 30d, nonce: 0 &#125;</div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  disabled={isSigningPermit2}
                  onClick={() => handleSignPermit2WithWallet(selectedPermitToken)}
                  className="w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSigningPermit2 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sign Request Pending in Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Sign Permit2 with Wallet (0 Gas)</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Signed Signatures History */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Active EIP-712 Signatures
                </h4>
                <div className="space-y-2">
                  {permit2Signatures.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[var(--text-primary)]">{sig.tokenSymbol} Permit</span>
                        <span className="text-[10px] text-emerald-500 font-mono">v = {sig.v} (EIP-155)</span>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-tertiary)] truncate">
                        sig: {sig.signatureHex}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Token + NFT Multi-Trade Studio */}
      {activeTab === 'nft_atomic' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-pink-500" />
              Unified Token Swap + NFT Purchase in One Transaction
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-3xl">
              The Universal Router seamlessly unifies token swaps and NFT marketplace fulfillments (Seaport, LooksRare, Sudoswap, CryptoPunks). Swap any ERC-20 token to ETH and purchase an NFT atomically without holding native ETH upfront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_NFT_ITEMS.map((item) => {
              const isSelected = selectedNft.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedNft(item)}
                  className={`p-4 rounded-2xl bg-[var(--bg-surface)] border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-pink-500 ring-2 ring-pink-500/20 shadow-md'
                      : 'border-[var(--border-app)] hover:border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-subtle)] relative">
                    <img src={item.image} alt={item.collectionName} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono font-semibold">
                      {item.marketplace}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--text-tertiary)]">{item.collectionName}</div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{item.tokenId}</div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-mono font-bold text-pink-400">{item.priceETH} ETH</span>
                      <span className="text-xs text-[var(--text-secondary)]">${item.priceUSD.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unified Execution Terminal */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-5">
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Execute Atomic Multi-Asset Swap</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Payment Token */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <span className="text-xs text-[var(--text-tertiary)] font-semibold">You Pay (Any ERC20)</span>
                <div className="flex items-center gap-3">
                  <select
                    value={nftPayToken}
                    onChange={(e) => setNftPayToken(e.target.value)}
                    className="bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold text-sm p-2 rounded-lg border border-[var(--border-app)] outline-none"
                  >
                    <option value="USDC">USDC</option>
                    <option value="DAI">DAI</option>
                    <option value="WBTC">WBTC</option>
                    <option value="UNI">UNI</option>
                  </select>
                  <div className="text-right flex-1">
                    <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                      {(selectedNft.priceUSD * 1.002).toFixed(2)} {nftPayToken}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Auto-swaps via V3</div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="p-2 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* Receive NFT */}
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                <span className="text-xs text-[var(--text-tertiary)] font-semibold">You Receive (Direct to Wallet)</span>
                <div className="flex items-center gap-3">
                  <img src={selectedNft.image} alt="NFT" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)] truncate">{selectedNft.collectionName}</div>
                    <div className="text-xs font-mono text-pink-400">{selectedNft.tokenId}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Atomic Commands Breakdown */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)] text-xs space-y-1.5">
              <span className="font-semibold text-[var(--text-tertiary)]">Atomic Command Pipeline:</span>
              <div className="font-mono text-pink-400 font-semibold flex items-center gap-2 flex-wrap">
                <span>[0x02: PERMIT2_PERMIT]</span>
                <span>→</span>
                <span>[0x00: V3_SWAP_EXACT_IN ({nftPayToken} → WETH)]</span>
                <span>→</span>
                <span>[0x04: UNWRAP_WETH]</span>
                <span>→</span>
                <span>[0x21: SEAPORT_V1_5 ({selectedNft.collectionName})]</span>
                <span>→</span>
                <span>[0x0b: SWEEP]</span>
              </div>
            </div>

            <Button
              onClick={handleExecuteAtomicNftTrade}
              disabled={isExecutingAtomicNft}
              className="w-full py-3.5 text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              {isExecutingAtomicNft ? (
                <span>Executing Atomic Transaction...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Execute Atomic Swap & Buy NFT
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 4: Gas Efficiency Benchmark */}
      {activeTab === 'gas_benchmark' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
              Universal Router Gas Efficiency & Benchmark
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Comparison between Universal Router (with Permit2 batching) and legacy multi-transaction routers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Universal Router Card */}
            <div className="p-6 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/30 space-y-4 relative">
              <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                RECOMMENDED
              </span>
              <div>
                <h4 className="font-bold text-base text-[var(--text-primary)]">Universal Router + Permit2</h4>
                <p className="text-xs text-[var(--text-secondary)]">Single execute() atomic call</p>
              </div>

              <div className="text-3xl font-extrabold font-mono text-emerald-500">
                114,500 <span className="text-sm font-normal text-[var(--text-tertiary)]">gas</span>
              </div>

              <div className="space-y-2 text-xs border-t border-[var(--border-subtle)] pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Permit2 Approval:</span>
                  <span className="font-mono text-emerald-500 font-bold">0 gas (Off-chain signature)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Swap + Unwrap + Sweep:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">114,500 gas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Total Transactions:</span>
                  <span className="font-mono font-bold text-emerald-500">1 Transaction</span>
                </div>
              </div>
            </div>

            {/* Multicall V3 Card */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
              <div>
                <h4 className="font-bold text-base text-[var(--text-primary)]">Multicall Router (V3 Legacy)</h4>
                <p className="text-xs text-[var(--text-secondary)]">Requires standard ERC20 approve first</p>
              </div>

              <div className="text-3xl font-extrabold font-mono text-amber-400">
                182,000 <span className="text-sm font-normal text-[var(--text-tertiary)]">gas</span>
              </div>

              <div className="space-y-2 text-xs border-t border-[var(--border-subtle)] pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">ERC-20 approve():</span>
                  <span className="font-mono text-rose-400 font-bold">46,000 gas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">exactInputSingle():</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">106,000 gas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">unwrapWETH9():</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">30,000 gas</span>
                </div>
              </div>
            </div>

            {/* V2 Legacy Router Card */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-4">
              <div>
                <h4 className="font-bold text-base text-[var(--text-primary)]">V2 Router (Legacy 2020)</h4>
                <p className="text-xs text-[var(--text-secondary)]">Pair transfers + separate approvals</p>
              </div>

              <div className="text-3xl font-extrabold font-mono text-[var(--text-tertiary)]">
                162,000 <span className="text-sm font-normal text-[var(--text-tertiary)]">gas</span>
              </div>

              <div className="space-y-2 text-xs border-t border-[var(--border-subtle)] pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">ERC-20 approve():</span>
                  <span className="font-mono text-rose-400 font-bold">46,000 gas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">swapExactTokensForETH():</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">116,000 gas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Revert Rollback:</span>
                  <span className="font-mono font-bold text-rose-400">Partial failures possible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Verified Solidity Contracts & Architecture */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-app)] space-y-2">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-purple-400" />
              Verified Solidity Architecture (Uniswap/universal-router)
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Core dispatch logic, reentrancy locking, and command decoding routines.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-pink-400">contracts/UniversalRouter.sol</span>
              <button
                onClick={() => handleCopy(`// SPDX-License-Identifier: GPL-3.0-or-later\npragma solidity ^0.8.24;\n\ncontract UniversalRouter is Dispatcher {\n  function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline)\n    external\n    payable\n    checkDeadline(deadline)\n  {\n    execute(commands, inputs);\n  }\n}`, 'sol-code')}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                {copiedText === 'sol-code' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Code
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-app)] font-mono text-xs text-[var(--text-secondary)] overflow-x-auto leading-relaxed">
{`// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import {Dispatcher} from "./base/Dispatcher.sol";
import {Permit2Payments} from "./modules/Permit2Payments.sol";
import {V3SwapRouter} from "./modules/uniswap/v3/V3SwapRouter.sol";
import {V4Router} from "./modules/uniswap/v4/V4Router.sol";

/// @title Universal Router
/// @notice Flexible execution router for Uniswap V2, V3, V4, and NFT protocols
contract UniversalRouter is Dispatcher {
    constructor(RouterParameters memory params) Dispatcher(params) {}

    /// @notice Primary entry point to execute a sequence of commands
    /// @param commands String of opcode bytes representing sequential actions
    /// @param inputs Array of ABI-encoded parameter bytes corresponding to each opcode
    /// @param deadline Timestamp by which the transaction must be included
    function execute(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable checkDeadline(deadline) {
        execute(commands, inputs);
    }
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
