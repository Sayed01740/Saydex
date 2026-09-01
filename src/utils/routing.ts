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

  // Strategy 1: Smart Split Routing (Optimal Price & Low Impact)
  const smartSplitHops: RouteHop[] = isDirectPair
    ? [
        {
          protocol: 'Axiom Concentrated v3',
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          percentage: 70,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05%',
          poolLiquidityUSD: '$428.5M',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: symOut,
              protocol: 'Axiom v3 Pool (0.05%)',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
          ],
        },
        {
          protocol: 'Axiom StableSwap / Curve',
          poolAddress: '0x3416cf6c708da44db26246036dd72e2938de866b',
          percentage: 30,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.01%',
          poolLiquidityUSD: '$189.2M',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: symOut,
              protocol: 'Axiom Stable Pool (0.01%)',
              feeTier: '0.01%',
              poolAddress: '0x3416cf6c708da44db26246036dd72e2938de866b',
            },
          ],
        },
      ]
    : [
        {
          protocol: 'Axiom Concentrated v3',
          poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
          percentage: 65,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05% + 0.05%',
          intermediateTokens: [intermediaryToken],
          poolLiquidityUSD: '$215.8M',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: intermediaryToken,
              protocol: 'Axiom v3 Primary',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
            {
              fromToken: intermediaryToken,
              toToken: symOut,
              protocol: 'Axiom v3 Secondary',
              feeTier: '0.05%',
              poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
            },
          ],
        },
        {
          protocol: 'Uniswap v3 Multi-Hop',
          poolAddress: '0xcbc50143180d8c4581e4602842d404746b502a30',
          percentage: 35,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.30%',
          intermediateTokens: [symIn === 'USDC' || symOut === 'USDC' ? 'DAI' : 'USDC'],
          poolLiquidityUSD: '$112.4M',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: symIn === 'USDC' || symOut === 'USDC' ? 'DAI' : 'USDC',
              protocol: 'Uniswap v3 Deep Pool',
              feeTier: '0.05%',
              poolAddress: '0x6c6bc977e13233652659dd5a30f01e02cd0c0d12',
            },
            {
              fromToken: symIn === 'USDC' || symOut === 'USDC' ? 'DAI' : 'USDC',
              toToken: symOut,
              protocol: 'Uniswap v3 Anchor',
              feeTier: '0.30%',
              poolAddress: '0xcbc50143180d8c4581e4602842d404746b502a30',
            },
          ],
        },
      ];

  // Strategy 2: Direct Single-Hop (Lowest Gas)
  const directHops: RouteHop[] = isDirectPair
    ? [
        {
          protocol: 'Axiom Concentrated v3 Direct',
          poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          percentage: 100,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05%',
          poolLiquidityUSD: '$428.5M',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: symOut,
              protocol: 'Axiom Concentrated Pool',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
          ],
        },
      ]
    : [
        {
          protocol: 'Axiom Multi-Hop Direct Pipeline',
          poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
          percentage: 100,
          fromToken: symIn,
          toToken: symOut,
          feeTier: '0.05% + 0.05%',
          intermediateTokens: [intermediaryToken],
          poolLiquidityUSD: '$215.8M',
          hopSteps: [
            {
              fromToken: symIn,
              toToken: intermediaryToken,
              protocol: 'Axiom Concentrated v3',
              feeTier: '0.05%',
              poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
            },
            {
              fromToken: intermediaryToken,
              toToken: symOut,
              protocol: 'Axiom Concentrated v3',
              feeTier: '0.05%',
              poolAddress: '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
            },
          ],
        },
      ];

  // Strategy 3: MEV Protected Private Solver Route
  const mevHops: RouteHop[] = [
    {
      protocol: 'Flashbots / MEV-Blocker Private Solver',
      poolAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
      percentage: 100,
      fromToken: symIn,
      toToken: symOut,
      feeTier: '0.00% MEV Shield',
      poolLiquidityUSD: '$890.0M Multi-Source',
      intermediateTokens: isDirectPair ? undefined : [intermediaryToken],
      hopSteps: isDirectPair
        ? [
            {
              fromToken: symIn,
              toToken: symOut,
              protocol: 'Private Solver CoW Matcher',
              feeTier: '0.00% Zero-Slippage',
              poolAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
            },
          ]
        : [
            {
              fromToken: symIn,
              toToken: intermediaryToken,
              protocol: 'Private Batch Settlement',
              feeTier: '0.01%',
              poolAddress: '0x9008d19f58aabd9ed0d60971565aa8510560ab41',
            },
            {
              fromToken: intermediaryToken,
              toToken: symOut,
              protocol: 'Axiom Private Fill',
              feeTier: '0.01%',
              poolAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
            },
          ],
    },
  ];

  const slippageFactor = (100 - slippageTolerance) / 100;

  // Build Route 1 (Smart Split)
  const smartExpected = amountIn * directRate;
  const smartRoute: CalculatedRoute = {
    strategy: 'smart_split',
    strategyName: 'Smart Split Route',
    strategyBadge: 'Best Return',
    routeHops: smartSplitHops,
    totalHops: smartSplitHops.reduce((acc, h) => acc + (h.hopSteps?.length || 1), 0),
    isMultiHop: !isDirectPair || smartSplitHops.length > 1,
    priceImpact: 0.01,
    gasCostUSD: isDirectPair ? 1.45 : 2.10,
    gasSavingsUSD: 0.85,
    expectedOutput: smartExpected,
    minimumOutput: smartExpected * slippageFactor,
    executionPrice: directRate,
    solverProtocol: 'Axiom Split Smart Engine',
    routeSummaryText: isDirectPair
      ? `${symIn} ➔ 70% Axiom v3 + 30% StableSwap ➔ ${symOut}`
      : `${symIn} ➔ 65% [${intermediaryToken}] + 35% [USDC] ➔ ${symOut}`,
  };

  // Build Route 2 (Direct)
  const directExpected = amountIn * (directRate * 0.9994); // slightly lower return due to single pool depth
  const directRoute: CalculatedRoute = {
    strategy: 'direct',
    strategyName: 'Direct Pipeline',
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
    solverProtocol: 'Axiom Direct Liquidity Pool',
    routeSummaryText: isDirectPair
      ? `${symIn} ➔ 100% Axiom v3 ➔ ${symOut}`
      : `${symIn} ➔ ${intermediaryToken} ➔ ${symOut}`,
  };

  // Build Route 3 (MEV Protected)
  const mevExpected = amountIn * (directRate * 0.9998);
  const mevRoute: CalculatedRoute = {
    strategy: 'mev_shield',
    strategyName: 'MEV-Shielded Solver',
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
    solverProtocol: 'Private Builder MEV Relay',
    routeSummaryText: `${symIn} ➔ Private Solver Batch ➔ ${symOut}`,
  };

  return [smartRoute, directRoute, mevRoute];
}
