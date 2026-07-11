/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../store';
import { Instrument } from '../types';
import { 
  TrendingUp, Activity, Settings, Eye, Info, RefreshCw, BarChart2,
  ChevronDown, Layers, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Area, CartesianGrid 
} from 'recharts';

interface StockChartProps {
  asset?: Instrument;
  height?: number;
  showControls?: boolean;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema?: number;
  sma?: number;
  bbUpper?: number;
  bbLower?: number;
  bbBasis?: number;
}

export const StockChart: React.FC<StockChartProps> = ({ 
  asset, 
  height = 240, 
  showControls = true 
}) => {
  const { selectedAsset, instruments } = useApp();
  
  // Use explicitly passed asset, or fallback to selectedAsset, or first instrument
  const activeAsset = asset || selectedAsset || instruments[0];

  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('5m');
  const [chartType, setChartType] = useState<'candle' | 'area'>('candle');
  
  // Technical Indicators Toggles
  const [showEMA, setShowEMA] = useState(true);
  const [showSMA, setShowSMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Store candles in local state so we can let the last one tick in real-time
  const [candles, setCandles] = useState<Candle[]>([]);
  const previousAssetPrice = useRef<number>(activeAsset.ltp);
  const previousAssetSymbol = useRef<string>(activeAsset.symbol);

  // Timeframe description label
  const timeframeLabel = useMemo(() => {
    switch (timeframe) {
      case '1m': return '1 Minute Ticks';
      case '5m': return '5 Minute Interval';
      case '15m': return '15 Minute Interval';
      case '1h': return 'Hourly Candlesticks';
      case '1D': return 'Daily Session';
    }
  }, [timeframe]);

  // Generate historical baseline candles when symbol or timeframe changes
  useEffect(() => {
    const symbol = activeAsset.symbol;
    const ltp = activeAsset.ltp;
    
    // Seed random seed based on symbol name to make charts unique yet persistent
    let seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const count = 35;
    const generatedCandles: Candle[] = [];
    
    // Scale standard deviation/variance based on the stock's price range
    const variance = ltp * 0.003; 
    let currentPrice = ltp - (count * variance * 0.2); // Start a bit lower/higher for a natural walk

    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const step = (random() - 0.48) * variance;
      const open = Number((currentPrice).toFixed(2));
      const close = Number((currentPrice + step).toFixed(2));
      const high = Number((Math.max(open, close) + random() * (variance * 0.4)).toFixed(2));
      const low = Number((Math.min(open, close) - random() * (variance * 0.4)).toFixed(2));
      const volume = Math.round(100000 + random() * 800000);

      // Create format label based on index & timeframe
      let timeStr = '';
      if (timeframe === '1D') {
        const d = new Date(now);
        d.setDate(d.getDate() - (count - i));
        timeStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else {
        const m = new Date(now);
        const minsToSubtract = (count - i) * (timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : 60);
        m.setMinutes(m.getMinutes() - minsToSubtract);
        timeStr = m.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      generatedCandles.push({
        time: timeStr,
        open,
        high,
        low,
        close,
        volume
      });

      currentPrice = close;
    }

    // Force the very last candle's close to be exactly equal to the activeAsset.ltp
    const lastIdx = generatedCandles.length - 1;
    if (lastIdx >= 0) {
      generatedCandles[lastIdx].close = ltp;
      generatedCandles[lastIdx].high = Math.max(generatedCandles[lastIdx].open, ltp, generatedCandles[lastIdx].high);
      generatedCandles[lastIdx].low = Math.min(generatedCandles[lastIdx].open, ltp, generatedCandles[lastIdx].low);
    }

    // Compute technical indicators over the generated candles
    computeIndicators(generatedCandles);
    
    setCandles(generatedCandles);
    previousAssetPrice.current = ltp;
    previousAssetSymbol.current = symbol;
  }, [activeAsset.symbol, timeframe]);

  // Handle live ticking prices from the store
  useEffect(() => {
    // If the active symbol changed, the baseline generator handles it.
    if (activeAsset.symbol !== previousAssetSymbol.current) {
      return;
    }

    const currentLtp = activeAsset.ltp;
    if (currentLtp === previousAssetPrice.current || candles.length === 0) {
      return;
    }

    setCandles(prev => {
      const updated = [...prev];
      const lastCandle = { ...updated[updated.length - 1] };
      
      // Update the live last candle metrics
      lastCandle.close = currentLtp;
      if (currentLtp > lastCandle.high) lastCandle.high = currentLtp;
      if (currentLtp < lastCandle.low) lastCandle.low = currentLtp;
      
      // Update volume slightly for the tick
      lastCandle.volume = lastCandle.volume + Math.round(Math.random() * 5000);

      updated[updated.length - 1] = lastCandle;
      
      // Re-compute indicators so lines follow live ticks flawlessly
      computeIndicators(updated);
      return updated;
    });

    previousAssetPrice.current = currentLtp;
  }, [activeAsset.ltp, activeAsset.symbol]);

  // Technical Indicators Formulas: EMA, SMA, Bollinger Bands
  const computeIndicators = (data: Candle[]) => {
    if (data.length === 0) return;

    // 1. EMA (Period 8)
    const emaPeriod = 8;
    const k = 2 / (emaPeriod + 1);
    let emaVal = data[0].close;
    data[0].ema = Number(emaVal.toFixed(2));

    for (let i = 1; i < data.length; i++) {
      emaVal = data[i].close * k + emaVal * (1 - k);
      data[i].ema = Number(emaVal.toFixed(2));
    }

    // 2. SMA (Period 15)
    const smaPeriod = 15;
    for (let i = 0; i < data.length; i++) {
      if (i < smaPeriod - 1) {
        data[i].sma = data[i].close; // fallback
      } else {
        let sum = 0;
        for (let j = 0; j < smaPeriod; j++) {
          sum += data[i - j].close;
        }
        data[i].sma = Number((sum / smaPeriod).toFixed(2));
      }
    }

    // 3. Bollinger Bands (Period 20, StdDev 2)
    const bbPeriod = 20;
    const stdDevMultiplier = 2;
    for (let i = 0; i < data.length; i++) {
      if (i < bbPeriod - 1) {
        data[i].bbBasis = data[i].close;
        data[i].bbUpper = data[i].close;
        data[i].bbLower = data[i].close;
      } else {
        // Compute basis (SMA 20)
        let sum = 0;
        for (let j = 0; j < bbPeriod; j++) {
          sum += data[i - j].close;
        }
        const basis = sum / bbPeriod;
        data[i].bbBasis = Number(basis.toFixed(2));

        // Compute Standard Deviation
        let varianceSum = 0;
        for (let j = 0; j < bbPeriod; j++) {
          varianceSum += Math.pow(data[i - j].close - basis, 2);
        }
        const stdDev = Math.sqrt(varianceSum / bbPeriod);

        data[i].bbUpper = Number((basis + stdDevMultiplier * stdDev).toFixed(2));
        data[i].bbLower = Number((basis - stdDevMultiplier * stdDev).toFixed(2));
      }
    }
  };

  // Min and Max prices for nice Y-Axis auto fitting
  const { minPrice, maxPrice } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100 };
    
    let min = Infinity;
    let max = -Infinity;

    candles.forEach(c => {
      let lowest = c.low;
      let highest = c.high;

      // Include indicators in axis bounds if active
      if (showBB && c.bbLower && c.bbLower < lowest) lowest = c.bbLower;
      if (showBB && c.bbUpper && c.bbUpper > highest) highest = c.bbUpper;
      if (showEMA && c.ema && c.ema < lowest) lowest = c.ema;
      if (showEMA && c.ema && c.ema > highest) highest = c.ema;
      if (showSMA && c.sma && c.sma < lowest) lowest = c.sma;
      if (showSMA && c.sma && c.sma > highest) highest = c.sma;

      if (lowest < min) min = lowest;
      if (highest > max) max = highest;
    });

    const padding = (max - min) * 0.05 || 1;
    return {
      minPrice: Math.floor(min - padding),
      maxPrice: Math.ceil(max + padding)
    };
  }, [candles, showEMA, showSMA, showBB]);

  // Render dynamic Candlestick using SVG inside Recharts ComposedChart
  const CustomCandleShape = (props: any) => {
    const { x, y, width, payload } = props;
    if (!payload || payload.open === undefined) return null;

    const { open, close, high, low } = payload;
    const isGreen = close >= open;
    const strokeColor = isGreen ? '#10b981' : '#ef4444';
    const fillColor = isGreen ? '#10b981' : '#ef4444';

    // Map high and low to chart Y coordinates
    const chartMin = minPrice;
    const chartMax = maxPrice;
    const scaleY = (val: number) => {
      // Recharts passes internal coordinates, but we can compute relative coordinates in our SVG space
      const ratio = (val - chartMin) / (chartMax - chartMin);
      // y is the coordinate of the bottom, height is the size.
      // Actually we can map them precisely. Let's draw candle relative to props.y and props.height
      return val;
    };

    // Calculate wick lines relative to the candle center
    const cx = x + width / 2;

    // In Recharts shapes, we can read standard svg properties calculated by Recharts
    // x, y represent the visual coordinates for the bar/candle body.
    // openY and closeY map to y and y + height
    const bodyY = props.y;
    const bodyHeight = props.height;
    
    // We compute the visual coordinate ratio to project the wick high and low
    const candleTopY = Math.min(bodyY, bodyY + bodyHeight);
    const candleBottomY = Math.max(bodyY, bodyY + bodyHeight);

    // Wick ratios
    const totalDiff = Math.abs(open - close) || 0.01;
    const highDiff = high - Math.max(open, close);
    const lowDiff = Math.min(open, close) - low;

    const pxPerUnit = bodyHeight / totalDiff;
    const wickTopY = candleTopY - (highDiff * pxPerUnit);
    const wickBottomY = candleBottomY + (lowDiff * pxPerUnit);

    return (
      <g>
        {/* Wick line */}
        <line 
          x1={cx} 
          y1={wickTopY} 
          x2={cx} 
          y2={wickBottomY} 
          stroke={strokeColor} 
          strokeWidth={1.5} 
          strokeLinecap="round"
        />
        {/* Candle Body rect */}
        <rect 
          x={x} 
          y={bodyY} 
          width={width} 
          height={Math.max(bodyHeight, 2)} 
          fill={fillColor} 
          stroke={strokeColor}
          strokeWidth={0.5}
          rx={1.5} 
        />
      </g>
    );
  };

  // Formatted active stats
  const activeChange = activeAsset.change;
  const isPositive = activeChange >= 0;

  return (
    <div className="bg-[#0b0e14] border border-white/5 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl">
      {/* Top Details & Interactive Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <Activity className={`w-5 h-5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'} animate-pulse`} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight font-display">{activeAsset.symbol}</h3>
              <span className="text-[10px] font-mono text-gray-500">{activeAsset.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-bold text-white font-mono leading-none">
                ₹{activeAsset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{activeChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Chart Style & Timeframe Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector chips */}
          <div className="flex items-center bg-[#07090e] border border-white/5 p-1 rounded-xl">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                  timeframe === tf 
                    ? 'bg-blue-600 dark:bg-sky-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Toggles */}
          <div className="flex items-center bg-[#07090e] border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                chartType === 'candle' 
                  ? 'bg-blue-600 dark:bg-sky-500 text-white shadow-md' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                chartType === 'area' 
                  ? 'bg-blue-600 dark:bg-sky-500 text-white shadow-md' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Area
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Canvas Area */}
      <div className="relative" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={candles}
            margin={{ top: 5, right: 0, left: -25, bottom: 5 }}
          >
            <defs>
              {/* Dynamic gradient color fill for Area Chart */}
              <linearGradient id={`gradientArea-${activeAsset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
              </linearGradient>

              {/* Bollinger Bands Shaded Area */}
              <linearGradient id="bbShade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.03}/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
            
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.15)" 
              fontSize={9} 
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
            />

            <YAxis 
              domain={[minPrice, maxPrice]} 
              stroke="rgba(255,255,255,0.15)" 
              fontSize={9} 
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              orientation="right"
              align="right"
            />

            {/* Recharts Tooltip with Custom OHLC + Indicators Renderer */}
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{ backgroundColor: '#090c13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as Candle;
                const isCandleGreen = d.close >= d.open;
                return (
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between gap-4 text-[10px] text-gray-500 border-b border-white/5 pb-1">
                      <span>Time: {d.time}</span>
                      <span className="bg-white/5 px-1 rounded font-bold uppercase">{timeframe}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="text-gray-500">Open:</span>
                      <span className="text-white text-right">₹{d.open.toFixed(2)}</span>

                      <span className="text-gray-500">High:</span>
                      <span className="text-emerald-400 text-right">₹{d.high.toFixed(2)}</span>

                      <span className="text-gray-500">Low:</span>
                      <span className="text-rose-400 text-right">₹{d.low.toFixed(2)}</span>

                      <span className="text-gray-500">Close:</span>
                      <span className={`text-right font-bold ${isCandleGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{d.close.toFixed(2)}
                      </span>

                      {showVolume && (
                        <>
                          <span className="text-gray-500">Volume:</span>
                          <span className="text-white text-right">{(d.volume).toLocaleString('en-IN')}</span>
                        </>
                      )}
                    </div>

                    {/* Show Active Technical Indicators values in tooltips */}
                    {(showEMA || showSMA || showBB) && (
                      <div className="border-t border-white/5 pt-1.5 mt-1.5 space-y-0.5 text-[10px]">
                        {showEMA && d.ema && (
                          <div className="flex justify-between gap-2">
                            <span className="text-sky-400">EMA (8):</span>
                            <span className="text-white">₹{d.ema.toFixed(2)}</span>
                          </div>
                        )}
                        {showSMA && d.sma && (
                          <div className="flex justify-between gap-2">
                            <span className="text-amber-500">SMA (15):</span>
                            <span className="text-white">₹{d.sma.toFixed(2)}</span>
                          </div>
                        )}
                        {showBB && d.bbBasis && (
                          <div className="flex flex-col text-[9px] text-gray-400">
                            <div className="flex justify-between">
                              <span>BB Upper:</span>
                              <span className="text-purple-400">₹{d.bbUpper?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>BB Lower:</span>
                              <span className="text-purple-400">₹{d.bbLower?.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* 1. Bollinger Bands Shaded Channel */}
            {showBB && (
              <Area
                type="monotone"
                dataKey="bbUpper"
                stroke="transparent"
                fill="url(#bbShade)"
                fillOpacity={1}
              />
            )}
            {showBB && (
              <Line 
                type="monotone" 
                dataKey="bbUpper" 
                stroke="#a855f7" 
                strokeWidth={1} 
                strokeDasharray="3 3"
                dot={false} 
                activeDot={false}
              />
            )}
            {showBB && (
              <Line 
                type="monotone" 
                dataKey="bbLower" 
                stroke="#a855f7" 
                strokeWidth={1} 
                strokeDasharray="3 3"
                dot={false} 
                activeDot={false}
              />
            )}
            {showBB && (
              <Line 
                type="monotone" 
                dataKey="bbBasis" 
                stroke="#a855f7" 
                strokeWidth={1} 
                opacity={0.5}
                dot={false} 
                activeDot={false}
              />
            )}

            {/* 2. Technical Indicator EMA (8) Line */}
            {showEMA && (
              <Line 
                type="monotone" 
                dataKey="ema" 
                stroke="#0ea5e9" 
                strokeWidth={1.5} 
                dot={false} 
                activeDot={false}
              />
            )}

            {/* 3. Technical Indicator SMA (15) Line */}
            {showSMA && (
              <Line 
                type="monotone" 
                dataKey="sma" 
                stroke="#f59e0b" 
                strokeWidth={1.5} 
                dot={false} 
                activeDot={false}
              />
            )}

            {/* 4. Chart Display: Candlestick or modern Area Chart */}
            {chartType === 'area' ? (
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke={isPositive ? '#10b981' : '#ef4444'} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill={`url(#gradientArea-${activeAsset.symbol})`} 
                dot={false}
              />
            ) : (
              // Recharts Bar chart utilizing custom SVG layout elements
              <Bar 
                dataKey="close" 
                shape={<CustomCandleShape />} 
                maxBarSize={12}
              />
            )}

            {/* 5. Mini volume bar overlays at the bottom */}
            {showVolume && (
              <Bar 
                dataKey="volume" 
                yAxisId="volumeAxis" 
                opacity={0.12} 
                fill="#ffffff"
                maxBarSize={12}
              />
            )}

            {/* Volume separate YAxis hidden bounds */}
            <YAxis 
              yAxisId="volumeAxis" 
              hide={true} 
              domain={['auto', 'auto']} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Control panel & Legends for Technical Indicators */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5 text-[10px] text-gray-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Indicators:
            </span>

            {/* EMA Toggle Checkbox Button */}
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition ${
                showEMA 
                  ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showEMA ? 'bg-sky-400' : 'bg-gray-600'}`} />
              EMA (8)
            </button>

            {/* SMA Toggle Checkbox Button */}
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition ${
                showSMA 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showSMA ? 'bg-amber-500' : 'bg-gray-600'}`} />
              SMA (15)
            </button>

            {/* Bollinger Bands Toggle Button */}
            <button
              onClick={() => setShowBB(!showBB)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition ${
                showBB 
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showBB ? 'bg-purple-500' : 'bg-gray-600'}`} />
              Bollinger Bands
            </button>

            {/* Volume Toggle Button */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition ${
                showVolume 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showVolume ? 'bg-white' : 'bg-gray-600'}`} />
              Volume
            </button>
          </div>

          <div className="flex items-center gap-1 text-gray-500 font-sans">
            <Info className="w-3.5 h-3.5" />
            <span>Ticking in real-time matching live order books.</span>
          </div>
        </div>
      )}
    </div>
  );
};
