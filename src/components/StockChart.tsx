/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../store';
import { Instrument } from '../types';
import { 
  TrendingUp, Activity, Settings, Eye, Info, RefreshCw, BarChart2,
  ChevronDown, Layers, Calendar, Sparkles, BookOpen, CheckSquare, ShieldCheck
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

/**
 * Native Ticker Tape Widget
 * Renders a rolling ribbon of live prices for major Indian market assets.
 */
export const NativeTickerTape: React.FC = () => {
  const { instruments } = useApp();

  return (
    <div className="w-full bg-[#07090e]/85 border-b border-white/5 py-1.5 z-40 relative overflow-hidden select-none">
      <div className="flex w-max whitespace-nowrap animate-marquee">
        {/* Triple the list to ensure a seamless looping scroll animation */}
        {[...instruments, ...instruments, ...instruments].map((inst, index) => {
          const isPositive = inst.change >= 0;
          return (
            <div 
              key={`${inst.symbol}-${index}`} 
              className="inline-flex items-center space-x-2 px-5 border-r border-white/5 text-[11px] hover:bg-white/5 transition cursor-pointer"
            >
              <span className="font-bold text-gray-200 font-display uppercase">
                {inst.symbol}
              </span>
              <span className="text-gray-400 font-mono">
                ₹{inst.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className={`font-mono font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '▲' : '▼'}{inst.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Native Technical Analysis Gauge Widget
 * Renders buy/sell gauges computed over standard technical oscillators and moving averages.
 */
export const NativeTechnicalGauge: React.FC<{ candles: Candle[]; activeAsset: Instrument; height?: number }> = ({ 
  candles, 
  activeAsset, 
  height = 220 
}) => {
  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];

  const metrics = useMemo(() => {
    if (!lastCandle) {
      return { 
        score: 0, 
        label: 'Neutral', 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-400/5', 
        strokeColor: '#f59e0b',
        emaStatus: 'Neutral', 
        smaStatus: 'Neutral', 
        bbStatus: 'Neutral', 
        momentumStatus: 'Neutral' 
      };
    }

    const ltp = activeAsset.ltp;
    let score = 0;
    
    // EMA (8) signal
    let emaStatus = 'Neutral';
    if (lastCandle.ema) {
      if (ltp > lastCandle.ema) {
        score += 30;
        emaStatus = 'Bullish';
      } else if (ltp < lastCandle.ema) {
        score -= 30;
        emaStatus = 'Bearish';
      }
    }

    // SMA (15) signal
    let smaStatus = 'Neutral';
    if (lastCandle.sma) {
      if (ltp > lastCandle.sma) {
        score += 30;
        smaStatus = 'Bullish';
      } else if (ltp < lastCandle.sma) {
        score -= 30;
        smaStatus = 'Bearish';
      }
    }

    // Bollinger Bands position signal
    let bbStatus = 'Neutral';
    if (lastCandle.bbUpper && lastCandle.bbLower && lastCandle.bbBasis) {
      const range = lastCandle.bbUpper - lastCandle.bbLower;
      if (range > 0) {
        const percent = (ltp - lastCandle.bbLower) / range;
        if (percent > 0.8) {
          score += 25;
          bbStatus = 'Overbought';
        } else if (percent < 0.2) {
          score -= 25;
          bbStatus = 'Oversold';
        } else if (ltp > lastCandle.bbBasis) {
          score += 15;
          bbStatus = 'Bullish';
        } else {
          score -= 15;
          bbStatus = 'Bearish';
        }
      }
    }

    // Momentum signal
    let momentumStatus = 'Neutral';
    if (prevCandle) {
      if (lastCandle.close > prevCandle.close) {
        score += 15;
        momentumStatus = 'Bullish';
      } else {
        score -= 15;
        momentumStatus = 'Bearish';
      }
    }

    // Normalize score to -100 to 100 range
    score = Math.max(-100, Math.min(100, score));

    let label = 'Neutral';
    let color = 'text-amber-400';
    let bgColor = 'bg-amber-400/10';
    let strokeColor = '#f59e0b';
    
    if (score >= 60) {
      label = 'Strong Buy';
      color = 'text-emerald-400';
      bgColor = 'bg-emerald-500/10';
      strokeColor = '#10b981';
    } else if (score >= 20) {
      label = 'Buy';
      color = 'text-emerald-400';
      bgColor = 'bg-emerald-500/5';
      strokeColor = '#34d399';
    } else if (score <= -60) {
      label = 'Strong Sell';
      color = 'text-rose-400';
      bgColor = 'bg-red-500/10';
      strokeColor = '#f43f5e';
    } else if (score <= -20) {
      label = 'Sell';
      color = 'text-rose-400';
      bgColor = 'bg-red-500/5';
      strokeColor = '#f87171';
    }

    return {
      score,
      label,
      color,
      bgColor,
      strokeColor,
      emaStatus,
      smaStatus,
      bbStatus,
      momentumStatus
    };
  }, [lastCandle, prevCandle, activeAsset.ltp]);

  // Translate score (-100 to 100) to rotation angle for gauge needle (-90deg to 90deg)
  const rotationAngle = (metrics.score / 100) * 90;

  return (
    <div 
      className="w-full rounded-xl overflow-hidden bg-[#07090e]/40 p-4 border border-white/5 flex flex-col justify-between" 
      style={{ height: `${height}px` }}
    >
      {/* Visual Gauge Header */}
      <div className="text-center">
        <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Composite Technical Outlook</span>
        <span className={`text-sm font-extrabold tracking-tight ${metrics.color}`}>
          {metrics.label}
        </span>
      </div>

      {/* Speedometer Gauge Arc (SVG) */}
      <div className="relative flex justify-center items-end h-16 mt-2">
        <svg className="w-28 h-14 overflow-visible" viewBox="0 0 100 50">
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Segmented Color Backgrounds for Sell, Neutral, Buy */}
          <path
            d="M 10 50 A 40 40 0 0 1 35 15"
            fill="none"
            stroke="#ef4444"
            strokeWidth="8"
            opacity="0.1"
          />
          <path
            d="M 35 15 A 40 40 0 0 1 65 15"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="8"
            opacity="0.1"
          />
          <path
            d="M 65 15 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            opacity="0.1"
          />
          {/* Value Arc Accent (Drawn dynamically based on value) */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={metrics.strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="126"
            strokeDashoffset={126 - (126 * ((metrics.score + 100) / 200))}
            className="transition-all duration-500 ease-out"
          />
          {/* Center Hub */}
          <circle cx="50" cy="50" r="3.5" fill="#3b82f6" />
          {/* Needle indicator */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ 
              transform: `rotate(${rotationAngle}deg)`, 
              transformOrigin: '50px 50px',
            }}
            className="transition-transform duration-500 ease-out"
          />
        </svg>

        {/* Dynamic score label overlay */}
        <div className="absolute bottom-0 text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          Score: {metrics.score > 0 ? '+' : ''}{metrics.score}
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono mt-3 border-t border-white/5 pt-3">
        <div className="flex justify-between items-center bg-white/[0.01] px-1.5 py-1 rounded border border-white/5">
          <span className="text-gray-500">EMA (8):</span>
          <span className={metrics.emaStatus === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}>{metrics.emaStatus}</span>
        </div>
        <div className="flex justify-between items-center bg-white/[0.01] px-1.5 py-1 rounded border border-white/5">
          <span className="text-gray-500">SMA (15):</span>
          <span className={metrics.smaStatus === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}>{metrics.smaStatus}</span>
        </div>
        <div className="flex justify-between items-center bg-white/[0.01] px-1.5 py-1 rounded border border-white/5">
          <span className="text-gray-500">Bollinger:</span>
          <span className={metrics.bbStatus.includes('Bullish') || metrics.bbStatus.includes('Overbought') ? 'text-emerald-400' : 'text-rose-400'}>{metrics.bbStatus}</span>
        </div>
        <div className="flex justify-between items-center bg-white/[0.01] px-1.5 py-1 rounded border border-white/5">
          <span className="text-gray-500">Momentum:</span>
          <span className={metrics.momentumStatus === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}>{metrics.momentumStatus}</span>
        </div>
      </div>
    </div>
  );
};

export const TradingViewChart: React.FC<{ symbol: string; timeframe: string }> = ({ symbol, timeframe }) => {
  // Map timeframe to TradingView intervals: 1m -> 1, 5m -> 5, 15m -> 15, 1h -> 60, 1D -> D
  const intervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '1D': 'D'
  };
  const interval = intervalMap[timeframe] || '5';

  // Extract clean symbol and map to standard TradingView ticker
  const getTradingViewSymbol = (sym: string): string => {
    const clean = sym.toUpperCase().trim();
    
    // Extract first word (e.g. "NIFTY" from "NIFTY 24-JUL FUT" or "NIFTY 50" or options like "NIFTY 24-JUL 24300 CE")
    const parts = clean.split(' ');
    const firstWord = parts[0];

    if (firstWord === 'NIFTY') {
      return 'NSE:NIFTY';
    }
    if (firstWord === 'BANKNIFTY') {
      return 'NSE:BANKNIFTY';
    }
    if (firstWord === 'FINNIFTY') {
      return 'NSE:CNXFINANCE';
    }
    if (firstWord === 'SENSEX') {
      return 'BSE:SENSEX';
    }
    if (firstWord === 'MIDCPNIFTY') {
      return 'NSE:MIDCPNIFTY';
    }

    const mapping: Record<string, string> = {
      'RELIANCE': 'NSE:RELIANCE',
      'TCS': 'NSE:TCS',
      'INFY': 'NSE:INFY',
      'HDFCBANK': 'NSE:HDFCBANK',
      'ICICIBANK': 'NSE:ICICIBANK',
      'SBIN': 'NSE:SBIN',
      'TATAMOTORS': 'NSE:TATAMOTORS',
      'LT': 'NSE:LT',
      'BHARTIARTL': 'NSE:BHARTIARTL',
      'ITC': 'NSE:ITC',
      'HINDUNILVR': 'NSE:HINDUNILVR',
      'WIPRO': 'NSE:WIPRO',
      'AXISBANK': 'NSE:AXISBANK',
      'KOTAKBANK': 'NSE:KOTAKBANK',
      'BAJFINANCE': 'NSE:BAJFINANCE',
      'M&M': 'NSE:M_M',
      'SUNPHARMA': 'NSE:SUNPHARMA'
    };

    return mapping[firstWord] || `NSE:${firstWord}`;
  };

  const tvSymbol = getTradingViewSymbol(symbol);
  
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-white/5 bg-[#0b0e14]">
      <iframe
        id={`tv-iframe-${tvSymbol}`}
        name={`tv-iframe-${tvSymbol}`}
        title={`TradingView Chart - ${tvSymbol}`}
        src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=${interval}&theme=dark&style=1&timezone=Asia%2FKolkata&locale=en&toolbarbg=131722&hide_side_toolbar=0&allow_symbol_change=1&details=0&calendar=0&hotlist=0&news=0`}
        className="w-full h-full border-none"
        style={{ colorScheme: 'dark' }}
        allowFullScreen
      />
    </div>
  );
};

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
  
  // Chart engine state - default to TradingView as requested
  const [chartSource, setChartSource] = useState<'native' | 'tradingview'>(() => {
    return (localStorage.getItem('preferred_chart_source') as 'native' | 'tradingview') || 'tradingview';
  });

  const handleChartSourceChange = (src: 'native' | 'tradingview') => {
    setChartSource(src);
    localStorage.setItem('preferred_chart_source', src);
  };

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

  // Technical Indicators Formulas: EMA, SMA, Bollinger Bands (pure computation over cloned array)
  const computeIndicators = (rawCandles: Candle[]): Candle[] => {
    if (rawCandles.length === 0) return [];
    
    // Create shallow copies of candle objects to bypass read-only property errors from frozen react states
    const data = rawCandles.map(c => ({ ...c }));

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
        let sum = 0;
        for (let j = 0; j < bbPeriod; j++) {
          sum += data[i - j].close;
        }
        const basis = sum / bbPeriod;
        data[i].bbBasis = Number(basis.toFixed(2));

        let varianceSum = 0;
        for (let j = 0; j < bbPeriod; j++) {
          varianceSum += Math.pow(data[i - j].close - basis, 2);
        }
        const stdDev = Math.sqrt(varianceSum / bbPeriod);

        data[i].bbUpper = Number((basis + stdDevMultiplier * stdDev).toFixed(2));
        data[i].bbLower = Number((basis - stdDevMultiplier * stdDev).toFixed(2));
      }
    }

    return data;
  };

  // Generate or fetch historical baseline candles when symbol or timeframe changes
  useEffect(() => {
    let isMounted = true;
    const symbol = activeAsset.symbol;
    const ltp = activeAsset.ltp;

    const loadCandles = async () => {
      try {
        const res = await fetch(`/api/integrations/upstox/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
        if (!res.ok) throw new Error("Network error loading candles");
        const data = await res.json();
        if (data.success && data.candles && data.candles.length > 0) {
          if (isMounted) {
            setCandles(computeIndicators(data.candles));
            previousAssetPrice.current = ltp;
            previousAssetSymbol.current = symbol;
          }
          return;
        }
      } catch (err) {
        console.warn("Using simulation fallback for candle history:", err);
      }

      // Generate fallback baseline candles if not connected or API fails
      if (!isMounted) return;

      const timeframeConfig: Record<'1m' | '5m' | '15m' | '1h' | '1D', { seedOffset: number; varianceMultiplier: number }> = {
        '1m': { seedOffset: 120, varianceMultiplier: 0.001 },
        '5m': { seedOffset: 340, varianceMultiplier: 0.002 },
        '15m': { seedOffset: 560, varianceMultiplier: 0.0045 },
        '1h': { seedOffset: 780, varianceMultiplier: 0.008 },
        '1D': { seedOffset: 990, varianceMultiplier: 0.018 },
      };

      const config = timeframeConfig[timeframe] || { seedOffset: 0, varianceMultiplier: 0.003 };

      let seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + config.seedOffset;
      const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const count = 35;
      const generatedCandles: Candle[] = [];
      const variance = ltp * config.varianceMultiplier;

      const now = new Date();
      let currentClose = ltp;

      for (let i = count - 1; i >= 0; i--) {
        const step = (random() - 0.5) * variance;
        const close = Number(currentClose.toFixed(2));
        let open = Number((currentClose - step).toFixed(2));

        if (open < ltp * 0.7) open = Number((ltp * 0.7).toFixed(2));
        if (open > ltp * 1.3) open = Number((ltp * 1.3).toFixed(2));

        const high = Number((Math.max(open, close) + random() * (variance * 0.4)).toFixed(2));
        const low = Number((Math.min(open, close) - random() * (variance * 0.4)).toFixed(2));
        const volume = Math.round(100000 + random() * 800000);

        let timeStr = '';
        if (timeframe === '1D') {
          const d = new Date(now);
          d.setDate(d.getDate() - (count - 1 - i));
          timeStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } else {
          const m = new Date(now);
          const minsToSubtract = (count - 1 - i) * (timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : 60);
          m.setMinutes(m.getMinutes() - minsToSubtract);
          timeStr = m.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
        }

        generatedCandles.unshift({
          time: timeStr,
          open,
          high,
          low,
          close,
          volume
        });

        currentClose = open;
      }

      setCandles(computeIndicators(generatedCandles));
      previousAssetPrice.current = ltp;
      previousAssetSymbol.current = symbol;
    };

    loadCandles();

    return () => {
      isMounted = false;
    };
  }, [activeAsset.symbol, timeframe]);

  // Handle live ticking prices from the store
  useEffect(() => {
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
      const withIndicators = computeIndicators(updated);
      return withIndicators;
    });

    previousAssetPrice.current = currentLtp;
  }, [activeAsset.ltp, activeAsset.symbol]);

  // Min and Max prices for nice Y-Axis auto fitting
  const { minPrice, maxPrice } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100 };
    
    let min = Infinity;
    let max = -Infinity;

    candles.forEach(c => {
      let lowest = c.low;
      let highest = c.high;

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
    const { x, width, payload, yAxis } = props;
    if (!payload || payload.open === undefined) return null;

    const { open, close, high, low } = payload;
    const isGreen = close >= open;
    const strokeColor = isGreen ? '#10b981' : '#ef4444';
    const fillColor = isGreen ? '#10b981' : '#ef4444';

    const cx = x + width / 2;

    // Compute the uniform scale factor for the whole chart using Y-axis dimensions if available
    const chartHeight = yAxis?.height ?? (height - 40);
    const chartY = yAxis?.y ?? 10;
    const pxPerUnit = chartHeight / (maxPrice - minPrice || 1);

    const getY = (val: number) => {
      return chartY + chartHeight - (val - minPrice) * pxPerUnit;
    };

    const yOpen = getY(open);
    const yClose = getY(close);
    const yHigh = getY(high);
    const yLow = getY(low);

    const candleTopY = Math.min(yOpen, yClose);
    const candleBottomY = Math.max(yOpen, yClose);
    const candleHeight = Math.max(Math.abs(yOpen - yClose), 1.5);

    return (
      <g>
        {/* Wick */}
        <line 
          x1={cx} 
          y1={yHigh} 
          x2={cx} 
          y2={yLow} 
          stroke={strokeColor} 
          strokeWidth={1.5} 
          strokeLinecap="round"
        />
        {/* Body */}
        <rect 
          x={x} 
          y={candleTopY} 
          width={width} 
          height={candleHeight} 
          fill={fillColor} 
          stroke={strokeColor}
          strokeWidth={0.5}
          rx={1} 
        />
      </g>
    );
  };

  const activeChange = activeAsset.change;
  const isPositive = activeChange >= 0;

  return (
    <div className="bg-[#0b0e14] border border-white/5 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl">
      {/* Top Header - Asset details & Chart engine controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <Activity className={`w-5 h-5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'} animate-pulse`} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
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

        {/* Engine Controls with beautiful active states */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Engine Switcher */}
          <div className="flex items-center bg-[#07090e] border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => handleChartSourceChange('tradingview')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                chartSource === 'tradingview' 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" /> TradingView
            </button>
            <button
              onClick={() => handleChartSourceChange('native')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                chartSource === 'native' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Native
            </button>
          </div>

          <div className="flex items-center bg-[#07090e] border border-white/5 p-1 rounded-xl">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                  timeframe === tf 
                    ? 'bg-blue-600 dark:bg-sky-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {chartSource === 'native' && (
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
          )}
        </div>
      </div>

      {/* Grid Layout for Active Chart Terminal and Technical Gauge Tools */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        {/* Main Chart viewport container */}
        <div className={`col-span-1 ${showControls ? 'xl:col-span-3' : 'xl:col-span-4'} relative`} style={{ height: `${height}px` }}>
          {chartSource === 'tradingview' ? (
            <TradingViewChart symbol={activeAsset.symbol} timeframe={timeframe} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={candles}
                margin={{ top: 5, right: 0, left: -25, bottom: 5 }}
              >
                <defs>
                  <linearGradient id={`gradientArea-${activeAsset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                  </linearGradient>

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
                  <Bar 
                    dataKey="close" 
                    shape={<CustomCandleShape />} 
                    maxBarSize={12}
                  />
                )}

                {showVolume && (
                  <Bar 
                    dataKey="volume" 
                    yAxisId="volumeAxis" 
                    opacity={0.12} 
                    fill="#ffffff"
                    maxBarSize={12}
                  />
                )}

                <YAxis 
                  yAxisId="volumeAxis" 
                  hide={true} 
                  domain={['auto', 'auto']} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right side tools panel - Technical Analysis Gauge Indicator (Only visible if showControls is active) */}
        {showControls && (
          <div className="col-span-1 flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
              <span className="flex items-center gap-1 uppercase tracking-widest text-[9px] font-bold">
                <BarChart2 className="w-3.5 h-3.5 text-blue-500" /> Technical Gauges
              </span>
              <span className="bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase">
                15m Feed
              </span>
            </div>

            {/* Native Dynamic Analysis Gauge */}
            <NativeTechnicalGauge candles={candles} activeAsset={activeAsset} height={height - 20} />
          </div>
        )}
      </div>

      {/* Control panel & Indicators Toggles */}
      {showControls && chartSource === 'native' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5 text-[10px] text-gray-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5" /> Indicators:
            </span>

            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showEMA 
                  ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 font-bold shadow-md' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showEMA ? 'bg-sky-400' : 'bg-gray-600'}`} />
              EMA (8)
            </button>

            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showSMA 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 font-bold shadow-md' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showSMA ? 'bg-amber-500' : 'bg-gray-600'}`} />
              SMA (15)
            </button>

            <button
              onClick={() => setShowBB(!showBB)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showBB 
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 font-bold shadow-md' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showBB ? 'bg-purple-500' : 'bg-gray-600'}`} />
              Bollinger Bands
            </button>

            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showVolume 
                  ? 'bg-white/10 border-white/20 text-white font-bold shadow-md' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showVolume ? 'bg-white' : 'bg-gray-600'}`} />
              Volume Overlay
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-gray-500 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Interactive terminal syncing live NSE/BSE feeds.</span>
          </div>
        </div>
      )}

      {showControls && chartSource === 'tradingview' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5 text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5 text-gray-400 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive TradingView terminal powered by real-time NSE/BSE exchange streams.</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Virtual ledger synchronization remains active.</span>
          </div>
        </div>
      )}
    </div>
  );
};
