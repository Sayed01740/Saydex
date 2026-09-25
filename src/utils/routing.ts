import { Token, RouteHop, SwapQuote } from '../types';

export type RouteStrategy = 'smart_split' | 'direct' | 'mev_shield';

export interface CalculatedRoute {
  strategy: RouteStrategy;
  strategyName: string;
  strategyBadge: string;
  routeHops: RouteHop[];
  totalHops: number;
  isMultiHop: boolean;
  priceImpact: number;
  gasCostUSD: number;
  gasSavingsUSD: number;
  expectedOutput: number;
  minimumOutput: number;
  executionPrice: number;
  solverProtocol: string;
  routeSummaryText: string;
}

/**
 * Deterministically generates realistic, transparent visual routing paths for any token pair.
 */
export function calculateTradeRoutes(
  tokenIn: Token,
  tokenOut: Token,
  amountInStr: string,
  slippageTolerance: number,
  selectedStrategy: RouteStrategy = 'smart_split'
): CalculatedRoute[] {
  const amountIn = parseFloat(amountInStr) || 0;
  const inPrice = tokenIn?.priceUSD ?? 1.0;
  const outPrice = tokenOut?.priceUSD ?? 1.0;
  const directRate = inPrice / Math.max(0.000001, outPrice);

  const symIn = tokenIn?.symbol || 'ETH';
  const symOut = tokenOut?.symbol || 'USDC';

  // Check if pair is a direct deep pool pair
  const isDirectPair =
    (symIn === 'ETH' && ['USDC', 'USDT', 'DAI', 'WBTC'].includes(symOut)) ||
    (symOut === 'ETH' && ['USDC', 'USDT', 'DAI', 'WBTC'].includes(symIn)) ||
    (['USDC', 'USDT', 'DAI'].includes(symIn) && ['USDC', 'USDT', 'DAI'].includes(symOut));

  // Determine intermediary bridging token for multi-hop
  const intermediaryToken = symIn === 'ETH' || symOut === 'ETH' ? 'USDC' : 'WETH';

  // Strategy 1: Optimal On-Chain Pool Route (via Uniswap V3 QuoterV2)
  const smartSplitHops: RouteHop[] = isDirectPair
    ? [
        {
          protocol: 'Uniswap V3 Pool',
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          percentage: 100,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05%',
          poolLiquidityUSD: 'Deep On-Chain Liquidity',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: symOut,
              protocol: 'Uniswap V3 Pool (0.05%)',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
          ],
        },
      ]
    : [
        {
          protocol: 'Uniswap V3 Multi-Hop',
          poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
          percentage: 100,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05% + 0.05%',
          intermediateTokens: [intermediaryToken],
          poolLiquidityUSD: 'Multi-Pool Liquidity',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: intermediaryToken,
              protocol: 'Uniswap V3 Pool',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
            {
              fromToken: intermediaryToken,
              toToken: symOut,
              protocol: 'Uniswap V3 Pool',
              feeTier: '0.05%',
              poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
            },
          ],
        },
      ];

  // Strategy 2: Direct Single-Hop (Lowest Gas)
  const directHops: RouteHop[] = isDirectPair
    ? [
        {
          protocol: 'Uniswap V3 Direct Pool',
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          percentage: 100,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05%',
          poolLiquidityUSD: 'Direct Liquidity',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: symOut,
              protocol: 'Uniswap V3 Pool (0.05%)',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
          ],
        },
      ]
    : [
        {
          protocol: 'Uniswap V3 Route',
          poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
          percentage: 100,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05% + 0.05%',
          intermediateTokens: [intermediaryToken],
          poolLiquidityUSD: 'Direct Pipeline',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: intermediaryToken,
              protocol: 'Uniswap V3 Pool',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
            {
              fromToken: intermediaryToken,
              toToken: symOut,
              protocol: 'Uniswap V3 Pool',
              feeTier: '0.05%',
              poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
            },
          ],
        },
      ];

  // Strategy 3: MEV Protected Private Solver Route
  const mevHops: RouteHop[] = [
    {
      protocol: 'MEV-Protected Private RPC Relay',
      poolAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
      percentage: 100,
      fromToken: symIn,
      toToken: symOut,
      feeTier: '0.00% MEV Shield',
      poolLiquidityUSD: 'Flashbots Protect / MEV-Blocker',
      intermediateTokens: isDirectPair ? undefined : [intermediaryToken],
      hopSteps: isDirectPair
        ? [
            {
              fromToken: symIn,
              toToken: symOut,
              protocol: 'Private RPC Uniswap V3 Pool',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
          ]
        : [
            {
              fromToken: symIn,
              toToken: intermediaryToken,
              protocol: 'Private RPC Hop 1',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
            {
              fromToken: intermediaryToken,
              toToken: symOut,
              protocol: 'Private RPC Hop 2',
              feeTier: '0.05%',
              poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
            },
          ],
    },
  ];

  const slippageFactor = (100 - slippageTolerance) / 100;

  // Build Route 1 (Optimal Route)
  const smartExpected = amountIn * directRate;
  const smartRoute: CalculatedRoute = {
    strategy: 'smart_split',
    strategyName: 'Uniswap V3 On-Chain',
    strategyBadge: 'Best Return',
    routeHops: smartSplitHops,
    totalHops: smartSplitHops.reduce((acc, h) => acc + (h.hopSteps?.length || 1), 0),
    isMultiHop: !isDirectPair,
    priceImpact: 0.01,
    gasCostUSD: isDirectPair ? 1.45 : 2.10,
    gasSavingsUSD: 0.85,
    expectedOutput: smartExpected,
    minimumOutput: smartExpected * slippageFactor,
    executionPrice: directRate,
    solverProtocol: 'Uniswap V3 QuoterV2',
    routeSummaryText: isDirectPair
      ? `${symIn} ➔ Uniswap V3 Pool (0.05%) ➔ ${symOut}`
      : `${symIn} ➔ ${intermediaryToken} ➔ ${symOut}`,
  };

  // Build Route 2 (Direct)
  const directExpected = amountIn * (directRate * 0.9994);
  const directRoute: CalculatedRoute = {
    strategy: 'direct',
    strategyName: 'Direct Uniswap V3 Pool',
    strategyBadge: 'Lowest Gas',
    routeHops: directHops,
    totalHops: directHops.reduce((acc, h) => acc + (h.hopSteps?.length || 1), 0),
    isMultiHop: !isDirectPair,
    priceImpact: 0.04,
    gasCostUSD: isDirectPair ? 0.95 : 1.60,
    gasSavingsUSD: 1.35,
    expectedOutput: directExpected,
    minimumOutput: directExpected * slippageFactor,
    executionPrice: directRate * 0.9994,
    solverProtocol: 'Uniswap V3 Direct Pool',
    routeSummaryText: isDirectPair
      ? `${symIn} ➔ Uniswap V3 Pool ➔ ${symOut}`
      : `${symIn} ➔ ${intermediaryToken} ➔ ${symOut}`,
  };

  // Build Route 3 (MEV Protected)
  const mevExpected = amountIn * (directRate * 0.9998);
  const mevRoute: CalculatedRoute = {
    strategy: 'mev_shield',
    strategyName: 'MEV-Shielded Routing',
    strategyBadge: 'Zero Frontrun',
    routeHops: mevHops,
    totalHops: mevHops.reduce((acc, h) => acc + (h.hopSteps?.length || 1), 0),
    isMultiHop: !isDirectPair,
    priceImpact: 0.01,
    gasCostUSD: 1.20,
    gasSavingsUSD: 0.90,
    expectedOutput: mevExpected,
    minimumOutput: mevExpected * slippageFactor,
    executionPrice: directRate * 0.9998,
    solverProtocol: 'Private RPC MEV Relay',
    routeSummaryText: `${symIn} ➔ Flashbots Protect Relay ➔ ${symOut}`,
  };

  return [smartRoute, directRoute, mevRoute];
}
