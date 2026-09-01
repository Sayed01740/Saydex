import React, { useState, useMemo } from 'react';
import { Token } from '../../types';
import { useProtocol } from '../../context/ProtocolContext';
import { NATIVE_TOKEN_PRICES_USD } from '../../config/chains';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Clock, BarChart2, Bell, Target, Plus } from 'lucide-react';

interface PriceChartProps {
  tokenIn?: Token;
  tokenOut?: Token;
  token0?: Token;
  token1?: Token;
  onOpenSetAlertModal?: (tokenIn?: Token, tokenOut?: Token) => void;
}

type Timeframe = '1H' | '1D' | '1W' | '1M' | '1Y' | 'ALL';

export const PriceChart: React.FC<PriceChartProps> = (props) => {
  const { priceAlerts } = useProtocol();
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');

  const inTok = props.tokenIn || props.token0;
  const outTok = props.tokenOut || props.token1;

  const currentTokenIn = inTok || {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    priceUSD: NATIVE_TOKEN_PRICES_USD.ETH,
    change24h: 3.42,
    volume24hUSD: 425000000,
    color: '#627EEA',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  };

  const currentTokenOut = outTok || {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    priceUSD: 1.00,
    change24h: 0.01,
    volume24hUSD: 850000000,
    color: '#2775CA',
    iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  };

  const baseRatio = (currentTokenIn.priceUSD || 1) / Math.max(0.0001, currentTokenOut.priceUSD || 1);
  const isPositive = (currentTokenIn.change24h ?? 0) >= 0;

  // Active alerts for this specific pair
  const pairAlerts = useMemo(() => {
    return priceAlerts.filter(
      (a) =>
        a.status === 'active' &&
        a.tokenInSymbol.toUpperCase() === currentTokenIn.symbol.toUpperCase() &&
        a.tokenOutSymbol.toUpperCase() === currentTokenOut.symbol.toUpperCase()
    );
  }, [priceAlerts, currentTokenIn.symbol, currentTokenOut.symbol]);

  // Generate smooth realistic price series based on timeframe
  const chartData = useMemo(() => {
    const pointsCount = timeframe === '1H' ? 24 : timeframe === '1D' ? 48 : timeframe === '1W' ? 56 : 60;
    const data = [];
    const now = Date.now();
    const stepMs =
      timeframe === '1H'
        ? 1000 * 60 * 2.5
        : timeframe === '1D'
        ? 1000 * 60 * 30
        : timeframe === '1W'
        ? 1000 * 60 * 60 * 3
        : 1000 * 60 * 60 * 12;

    let currentVal = baseRatio * (1 - (isPositive ? 0.035 : -0.035));

    for (let i = pointsCount; i >= 0; i--) {
      const time = new Date(now - i * stepMs);
      const volatility = baseRatio * 0.008;
      const change = (Math.sin(i * 0.5) * 0.5 + (Math.random() - 0.48)) * volatility;
      currentVal = Math.max(0.00001, currentVal + change);

      const timeLabel =
        timeframe === '1H' || timeframe === '1D'
          ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : time.toLocaleDateString([], { month: 'short', day: 'numeric' });

      data.push({
        timestamp: time.getTime(),
        timeLabel,
        price: parseFloat(currentVal.toFixed(currentVal > 10 ? 2 : 5)),
        volumeUSD: Math.round(150000 + Math.random() * 850000),
      });
    }
    return data;
  }, [baseRatio, timeframe, isPositive]);

  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const displayPrice = hoveredPoint
    ? hoveredPoint.price
    : parseFloat(baseRatio.toFixed(baseRatio > 10 ? 2 : 5));

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-app)] rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">
              {currentTokenIn.symbol} / {currentTokenOut.symbol}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
                isPositive
                  ? 'bg-[var(--success-subtle)] text-[var(--success)]'
                  : 'bg-[var(--error-subtle)] text-[var(--error)]'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{currentTokenIn.change24h}%</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {displayPrice.toLocaleString(undefined, { maximumFractionDigits: 5 })}
            </h2>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">
              {currentTokenOut.symbol} per {currentTokenIn.symbol}
            </span>
          </div>
        </div>

        {/* Timeframe & View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Price Alert Button */}
          {props.onOpenSetAlertModal && (
            <button
              onClick={() => props.onOpenSetAlertModal?.(currentTokenIn, currentTokenOut)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary-subtle)] hover:bg-[var(--primary)] hover:text-[#090B0E] border border-[var(--primary)]/30 text-xs font-semibold text-[var(--primary)] transition-all cursor-pointer shadow-2xs"
              title="Set target price alert for this pair"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Set Alert</span>
              {pairAlerts.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-[#090B0E] text-[10px] font-mono font-bold flex items-center justify-center">
                  {pairAlerts.length}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-app)] text-xs font-medium">
            {(['1H', '1D', '1W', '1M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] font-semibold shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => setChartType(chartType === 'price' ? 'volume' : 'price')}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              chartType === 'volume'
                ? 'bg-[var(--primary-subtle)] border-[var(--primary)]/40 text-[var(--primary)]'
                : 'bg-[var(--bg-subtle)] border-[var(--border-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Volume Chart"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Target Banner on Chart */}
      {pairAlerts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
          <div className="flex items-center gap-1.5 text-[var(--primary)] font-semibold shrink-0">
            <Bell className="w-3.5 h-3.5" />
            <span>Active Targets:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pairAlerts.map((alt) => (
              <span
                key={alt.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-app)] font-mono text-[11px] text-[var(--text-primary)]"
              >
                <span>{alt.condition === 'gte' ? '≥' : '≤'}</span>
                <span className="font-bold">{alt.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                <span className="text-[var(--text-tertiary)]">{alt.tokenOutSymbol}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-64 w-full select-none pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'price' ? (
            <AreaChart
              data={chartData}
              onMouseMove={(e: any) => {
                if (e?.activePayload && e.activePayload.length) {
                  setHoveredPoint(e.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timeLabel"
                stroke="var(--text-disabled)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={['dataMin - 0.005', 'dataMax + 0.005']}
                orientation="right"
                stroke="var(--text-disabled)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toFixed(val > 10 ? 1 : 4)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] p-2 rounded-lg shadow-lg text-xs">
                        <div className="text-[var(--text-tertiary)] font-mono">{data.timeLabel}</div>
                        <div className="font-semibold font-mono text-[var(--text-primary)] mt-0.5">
                          {data.price} {currentTokenOut.symbol}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Target Price Reference Line */}
              {pairAlerts.map((alt) => (
                <ReferenceLine
                  key={alt.id}
                  y={alt.targetPrice}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Target: ${alt.targetPrice}`,
                    fill: '#10B981',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              ))}
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <XAxis
                dataKey="timeLabel"
                stroke="var(--text-disabled)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                orientation="right"
                stroke="var(--text-disabled)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Bar dataKey="volumeUSD" fill="var(--primary)" opacity={0.65} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Metrics Footer */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
        <div>
          <span className="text-[var(--text-tertiary)]">24h High</span>
          <p className="font-semibold font-mono text-[var(--text-primary)] mt-0.5">
            {(baseRatio * 1.042).toFixed(baseRatio > 10 ? 2 : 4)}
          </p>
        </div>
        <div>
          <span className="text-[var(--text-tertiary)]">24h Low</span>
          <p className="font-semibold font-mono text-[var(--text-primary)] mt-0.5">
            {(baseRatio * 0.965).toFixed(baseRatio > 10 ? 2 : 4)}
          </p>
        </div>
        <div>
          <span className="text-[var(--text-tertiary)]">24h Total Volume</span>
          <p className="font-semibold font-mono text-[var(--text-primary)] mt-0.5">
            ${((currentTokenIn.volume24hUSD || 42000000) / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>
    </div>
  );
};

