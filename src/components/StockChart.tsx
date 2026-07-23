/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../store';
import { Instrument } from '../types';
import { 
  TrendingUp, TrendingDown, Activity, Settings, Eye, Info, RefreshCw, BarChart2,
  ChevronDown, Layers, Calendar, Sparkles, BookOpen, CheckSquare, ShieldCheck,
  Trash2, Maximize2, Minimize2, Plus, Type, Target, Palette, Percent, GitCommit
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line as RechartsLine, Bar as RechartsBar, XAxis, YAxis, Tooltip, Area as RechartsArea, CartesianGrid 
} from 'recharts';
import { createChart, ColorType, CrosshairMode, UTCTimestamp, CandlestickSeries, AreaSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

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
  ema50?: number;
  ema200?: number;
  vwap?: number;
  supertrend?: number;
  supertrendDirection?: 'up' | 'down';
}

/**
 * Native Ticker Tape Widget
 * Renders a rolling ribbon of live prices for major Indian market assets.
 */
export const NativeTickerTape: React.FC = React.memo(() => {
  const { instruments } = useApp();

  const majorInstruments = React.useMemo(() => {
    const list = instruments.filter(inst => 
      ['NIFTY 50', 'BANKNIFTY', 'SENSEX', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'ICICIBANK', 'BHARTIARTL'].includes(inst.symbol)
    );
    return list.length > 0 ? list : instruments.slice(0, 8);
  }, [instruments]);

  return (
    <div className="w-full bg-[#07090e]/85 border-b border-white/5 py-1.5 z-40 relative overflow-hidden select-none">
      <div className="flex w-max whitespace-nowrap animate-marquee">
        {/* Triple the list to ensure a seamless looping scroll animation */}
        {[...majorInstruments, ...majorInstruments, ...majorInstruments].map((inst, index) => {
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
});

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

// Helper to enrich candles with continuous sequential Unix timestamps for lightweight-charts
const enrichCandlesWithTimestamps = (rawCandles: Candle[], tf: string) => {
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '1D': 86400
  }[tf] || 300;

  const n = rawCandles.length;
  return rawCandles.map((candle, idx) => {
    const timestamp = now - (n - 1 - idx) * intervalSeconds;
    return {
      ...candle,
      timestamp
    };
  });
};

// Quantitative Indicators calculations
function calculateRSI(data: (Candle & { timestamp?: number })[], period: number = 14): { time: string; timestamp?: number; value: number }[] {
  if (data.length < period + 1) return [];
  const rsiData: { time: string; timestamp?: number; value: number }[] = [];
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
  
  rsiData.push({ time: data[period].time, timestamp: data[period].timestamp, value: Number(rsi.toFixed(2)) });
  
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    
    rsiData.push({ time: data[i].time, timestamp: data[i].timestamp, value: Number(rsi.toFixed(2)) });
  }
  
  return rsiData;
}

interface MACDResult {
  time: string;
  timestamp?: number;
  macd: number;
  signal: number;
  histogram: number;
}

function calculateMACD(data: (Candle & { timestamp?: number })[]): MACDResult[] {
  if (data.length < 26) return [];
  
  const closes = data.map(c => c.close);
  const ema12 = computeEMAValues(closes, 12);
  const ema26 = computeEMAValues(closes, 26);
  
  const macdValues: number[] = [];
  for (let i = 0; i < data.length; i++) {
    macdValues.push(ema12[i] - ema26[i]);
  }
  
  const signalValues = computeEMAValues(macdValues, 9);
  
  const macdResults: MACDResult[] = [];
  for (let i = 0; i < data.length; i++) {
    const macd = macdValues[i];
    const signal = signalValues[i];
    const histogram = macd - signal;
    macdResults.push({
      time: data[i].time,
      timestamp: data[i].timestamp,
      macd: Number(macd.toFixed(2)),
      signal: Number(signal.toFixed(2)),
      histogram: Number(histogram.toFixed(2))
    });
  }
  
  return macdResults;
}

function computeEMAValues(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];
  if (values.length === 0) return [];
  ema[0] = values[0];
  for (let i = 1; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function findSupportResistanceLevels(candles: Candle[], windowSize: number = 5): { support: number[]; resistance: number[] } {
  const support: number[] = [];
  const resistance: number[] = [];
  
  if (candles.length < windowSize * 2 + 1) return { support, resistance };
  
  for (let i = windowSize; i < candles.length - windowSize; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    
    let isSwingHigh = true;
    let isSwingLow = true;
    
    for (let j = -windowSize; j <= windowSize; j++) {
      if (j === 0) continue;
      if (candles[i + j].high > currentHigh) {
        isSwingHigh = false;
      }
      if (candles[i + j].low < currentLow) {
        isSwingLow = false;
      }
    }
    
    if (isSwingHigh) {
      resistance.push(Number(currentHigh.toFixed(2)));
    }
    if (isSwingLow) {
      support.push(Number(currentLow.toFixed(2)));
    }
  }
  
  const filterLevels = (levels: number[]) => {
    if (levels.length === 0) return [];
    levels.sort((a, b) => a - b);
    const clustered: number[] = [levels[0]];
    for (let i = 1; i < levels.length; i++) {
      const prev = clustered[clustered.length - 1];
      const diffPercent = Math.abs(levels[i] - prev) / prev;
      if (diffPercent > 0.015) { // 1.5% cluster threshold
        clustered.push(levels[i]);
      } else {
        clustered[clustered.length - 1] = Number(((prev + levels[i]) / 2).toFixed(2));
      }
    }
    return clustered.slice(-3); // return 3 closest levels
  };
  
  return {
    support: filterLevels(support),
    resistance: filterLevels(resistance)
  };
}

export const TradingViewChart: React.FC<{
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '1D';
  candles: Candle[];
  chartType: 'candle' | 'area';
  showEMA: boolean;
  showSMA: boolean;
  showBB: boolean;
  showVolume: boolean;
  isPositive: boolean;
  isExpanded?: boolean;
  onCloseExpanded?: () => void;
  emaPeriod: number;
  smaPeriod: number;
  bbPeriod: number;
  showSupertrend: boolean;
  showVWAP: boolean;
  showEma50_200: boolean;
}> = ({
  symbol,
  timeframe,
  candles,
  chartType,
  showEMA,
  showSMA,
  showBB,
  showVolume,
  isPositive,
  isExpanded,
  onCloseExpanded,
  emaPeriod,
  smaPeriod,
  bbPeriod,
  showSupertrend,
  showVWAP,
  showEma50_200
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const areaSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const emaSeriesRef = useRef<any>(null);
  const smaSeriesRef = useRef<any>(null);
  const bbUpperSeriesRef = useRef<any>(null);
  const bbLowerSeriesRef = useRef<any>(null);
  const bbBasisSeriesRef = useRef<any>(null);

  // Advanced TradingView States
  const [activeTool, setActiveTool] = useState<
    'cursor' | 'draw-support' | 'draw-resistance' | 'draw-fib-start' | 'draw-fib-end' | 'draw-marker' | 'risk-reward-entry' | 'risk-reward-target' | 'risk-reward-sl' | 'draw-trendline-start' | 'draw-trendline-end'
  >('cursor');
  const [customLines, setCustomLines] = useState<{ id: string; price: number; type: 'support' | 'resistance' }[]>([]);
  const [trendlineStart, setTrendlineStart] = useState<{ time: number; price: number } | null>(null);
  const [trendlines, setTrendlines] = useState<{ id: string; start: { time: number; price: number }; end: { time: number; price: number } }[]>([]);
  const [showAutoSR, setShowAutoSR] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [chartTheme, setChartTheme] = useState<'charcoal' | 'forest' | 'cyberpunk' | 'light'>('charcoal');

  const { theme } = useApp();

  // Synchronize chart theme with global app theme automatically
  useEffect(() => {
    if (theme === 'light') {
      setChartTheme('light');
    } else if (theme === 'dark') {
      setChartTheme(prev => prev === 'light' ? 'charcoal' : prev);
    }
  }, [theme]);

  // Fibonacci States
  const [fibStartPrice, setFibStartPrice] = useState<number | null>(null);
  const [fibLevelsList, setFibLevelsList] = useState<{ id: string; start: number; end: number }[]>([]);

  // Risk/Reward States
  const [rrEntryPrice, setRREntryPrice] = useState<number | null>(null);
  const [rrTargetPrice, setRRTargetPrice] = useState<number | null>(null);
  const [rrSetup, setRRSetup] = useState<{ entry: number; target: number; sl: number } | null>(null);

  // Custom text markers state
  const [customMarkers, setCustomMarkers] = useState<any[]>([]);
  const [markerText, setMarkerText] = useState<string>('BREAKOUT');

  // AI & Advanced Pattern Scanner States
  const [showPatternMarkers, setShowPatternMarkers] = useState(true);
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [advisorQuestion, setAdvisorQuestion] = useState<string>('');
  const [analysisSteps, setAnalysisSteps] = useState<string>('');

  const handleRunChartAnalysis = async (customQuestion?: string) => {
    setIsAnalyzing(true);
    setAnalysisResult('');
    
    const steps = [
      "Gathering latest candle tick feeds...",
      "Calculating Bollinger Band volatility...",
      "Auditing custom support & trendlines...",
      "Analyzing candlestick pattern matches...",
      "Structuring cognitive confluence prompt...",
      "Querying AI Quantitative Mentor model..."
    ];
    
    let stepIdx = 0;
    setAnalysisSteps(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setAnalysisSteps(steps[stepIdx]);
      }
    }, 1100);

    try {
      const res = await fetch("/api/coach/analyze-chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          candles,
          customLines,
          trendlines,
          fibLevelsList,
          rrSetup,
          userQuestion: customQuestion !== undefined ? customQuestion : advisorQuestion,
        })
      });
      const data = await res.json();
      setAnalysisResult(data.analysis || "Analysis failed to load.");
      if (customQuestion === undefined) {
        setAdvisorQuestion('');
      }
    } catch (e) {
      console.error(e);
      setAnalysisResult("### ⚠️ Error\nFailed to reach the AI Technical Analysis endpoint. Please check your network connection.");
    } finally {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
    }
  };

  const themeConfig = useMemo(() => {
    switch (chartTheme) {
      case 'forest':
        return {
          background: '#06120e',
          grid: 'rgba(16, 185, 129, 0.04)',
          textColor: '#6ee7b7',
        };
      case 'cyberpunk':
        return {
          background: '#0f0716',
          grid: 'rgba(168, 85, 247, 0.04)',
          textColor: '#d8b4fe',
        };
      case 'light':
        return {
          background: '#f8fafc',
          grid: 'rgba(15, 23, 42, 0.04)',
          textColor: '#334155',
        };
      case 'charcoal':
      default:
        return {
          background: '#090c13',
          grid: 'rgba(255, 255, 255, 0.02)',
          textColor: '#9ca3af',
        };
    }
  }, [chartTheme]);

  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // Initialize and synchronize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isLight = chartTheme === 'light';
    const borderCol = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    const crosshairCol = isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';
    const labelBg = isLight ? '#475569' : '#1e222d';

    // 1. Create a clean new chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: themeConfig.background },
        textColor: themeConfig.textColor,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: themeConfig.grid },
        horzLines: { color: themeConfig.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairCol,
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: labelBg,
        },
        horzLine: {
          color: crosshairCol,
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: labelBg,
        },
      },
      rightPriceScale: {
        borderColor: borderCol,
        alignLabels: true,
      },
      timeScale: {
        borderColor: borderCol,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    if (candles.length === 0) {
      // Setup cleanup for empty state
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };
      window.addEventListener('resize', handleResize);
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartContainerRef.current);

      return () => {
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
        chart.remove();
        chartRef.current = null;
      };
    }

    // 2. Enrich candles with sequential timestamps for lightweight-charts
    const enrichedCandles = enrichCandlesWithTimestamps(candles, timeframe);

    // 3. Setup primary series based on chartType
    const greenColor = '#10b981';
    const redColor = '#ef4444';
    let activeSeries: any = null;

    if (chartType === 'candle') {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: greenColor,
        downColor: redColor,
        borderUpColor: greenColor,
        borderDownColor: redColor,
        wickUpColor: greenColor,
        wickDownColor: redColor,
      });
      candlestickSeriesRef.current = candlestickSeries;
      activeSeries = candlestickSeries;

      const seriesData = enrichedCandles.map(c => ({
        time: c.timestamp as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candlestickSeries.setData(seriesData);
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: isPositive ? greenColor : redColor,
        topColor: isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        bottomColor: 'rgba(9, 12, 19, 0)',
        lineWidth: 2,
      });
      areaSeriesRef.current = areaSeries;
      activeSeries = areaSeries;

      const seriesData = enrichedCandles.map(c => ({
        time: c.timestamp as UTCTimestamp,
        value: c.close,
      }));
      areaSeries.setData(seriesData);
    }

    // 4. Setup volume overlay if visible
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: 'rgba(255, 255, 255, 0.12)',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });
      volumeSeriesRef.current = volumeSeries;

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      const volumeData = enrichedCandles.map(c => ({
        time: c.timestamp as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      }));
      volumeSeries.setData(volumeData);
    }

    // 5. Setup Technical Indicators (EMA, SMA, BB)
    if (showEMA) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: '#0ea5e9',
        lineWidth: 2,
        title: `EMA(${emaPeriod})`,
      });
      emaSeriesRef.current = emaSeries;

      const emaData = enrichedCandles
        .filter(c => c.ema !== undefined)
        .map(c => ({
          time: c.timestamp as UTCTimestamp,
          value: c.ema!,
        }));
      emaSeries.setData(emaData);
    }

    if (showSMA) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        title: `SMA(${smaPeriod})`,
      });
      smaSeriesRef.current = smaSeries;

      const smaData = enrichedCandles
        .filter(c => c.sma !== undefined)
        .map(c => ({
          time: c.timestamp as UTCTimestamp,
          value: c.sma!,
        }));
      smaSeries.setData(smaData);
    }

    if (showBB) {
      const bbUpperSeries = chart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 1,
        lineStyle: 1, // dashed
        title: 'BB Upper',
      });
      bbUpperSeriesRef.current = bbUpperSeries;

      const bbLowerSeries = chart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 1,
        lineStyle: 1, // dashed
        title: 'BB Lower',
      });
      bbLowerSeriesRef.current = bbLowerSeries;

      const bbBasisSeries = chart.addSeries(LineSeries, {
        color: 'rgba(168, 85, 247, 0.5)',
        lineWidth: 1,
        title: 'BB Basis',
      });
      bbBasisSeriesRef.current = bbBasisSeries;

      const bbUpperData = enrichedCandles.filter(c => c.bbUpper !== undefined).map(c => ({ time: c.timestamp as UTCTimestamp, value: c.bbUpper! }));
      const bbLowerData = enrichedCandles.filter(c => c.bbLower !== undefined).map(c => ({ time: c.timestamp as UTCTimestamp, value: c.bbLower! }));
      const bbBasisData = enrichedCandles.filter(c => c.bbBasis !== undefined).map(c => ({ time: c.timestamp as UTCTimestamp, value: c.bbBasis! }));

      bbUpperSeries.setData(bbUpperData);
      bbLowerSeries.setData(bbLowerData);
      bbBasisSeries.setData(bbBasisData);
    }

    // 5.1 Setup EMA 50 & 200 Multi-EMA
    if (showEma50_200) {
      const ema50Series = chart.addSeries(LineSeries, {
        color: '#f97316', // Orange
        lineWidth: 2,
        title: 'EMA(50)',
      });
      const ema50Data = enrichedCandles
        .filter(c => c.ema50 !== undefined)
        .map(c => ({ time: c.timestamp as UTCTimestamp, value: c.ema50! }));
      ema50Series.setData(ema50Data);

      const ema200Series = chart.addSeries(LineSeries, {
        color: '#ec4899', // Pink
        lineWidth: 2,
        title: 'EMA(200)',
      });
      const ema200Data = enrichedCandles
        .filter(c => c.ema200 !== undefined)
        .map(c => ({ time: c.timestamp as UTCTimestamp, value: c.ema200! }));
      ema200Series.setData(ema200Data);
    }

    // 5.2 Setup VWAP
    if (showVWAP) {
      const vwapSeries = chart.addSeries(LineSeries, {
        color: '#06b6d4', // Cyan
        lineWidth: 2,
        title: 'VWAP',
      });
      const vwapData = enrichedCandles
        .filter(c => c.vwap !== undefined)
        .map(c => ({ time: c.timestamp as UTCTimestamp, value: c.vwap! }));
      vwapSeries.setData(vwapData);
    }

    // 5.3 Setup Supertrend (Period: 10, Multiplier: 3)
    if (showSupertrend) {
      const supertrendSeries = chart.addSeries(LineSeries, {
        color: '#fbbf24', // Amber/Gold
        lineWidth: 2,
        lineStyle: 1, // Dashed
        title: 'Supertrend',
      });
      const supertrendData = enrichedCandles
        .filter(c => c.supertrend !== undefined)
        .map(c => ({ time: c.timestamp as UTCTimestamp, value: c.supertrend! }));
      supertrendSeries.setData(supertrendData);
    }

    // 6. Support auto-drawn support and resistance pivot lines
    if (showAutoSR && activeSeries) {
      const levels = findSupportResistanceLevels(enrichedCandles);
      levels.support.forEach(level => {
        activeSeries.createPriceLine({
          price: level,
          color: '#10b981',
          lineWidth: 1.5,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Auto Support',
        });
      });
      levels.resistance.forEach(level => {
        activeSeries.createPriceLine({
          price: level,
          color: '#ef4444',
          lineWidth: 1.5,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Auto Resistance',
        });
      });
    }

    // 7. Support custom user-drawn lines
    if (activeSeries) {
      customLines.forEach(cl => {
        activeSeries.createPriceLine({
          price: cl.price,
          color: cl.type === 'support' ? '#10b981' : '#ef4444',
          lineWidth: 2,
          lineStyle: 0, // Solid
          axisLabelVisible: true,
          title: cl.type === 'support' ? 'Support' : 'Resistance',
        });
      });
    }

    // 7.1 Fibonacci drawings
    if (activeSeries) {
      fibLevelsList.forEach(fib => {
        const diff = fib.start - fib.end;
        const ratios = [
          { ratio: 0, color: '#ef4444', label: '0.000 (End)' },
          { ratio: 0.236, color: '#f59e0b', label: '0.236' },
          { ratio: 0.382, color: '#10b981', label: '0.382' },
          { ratio: 0.5, color: '#0ea5e9', label: '0.500' },
          { ratio: 0.618, color: '#6366f1', label: '0.618' },
          { ratio: 0.786, color: '#a855f7', label: '0.786' },
          { ratio: 1.0, color: '#ec4899', label: '1.000 (Start)' },
        ];
        ratios.forEach(r => {
          const price = Number((fib.end + diff * r.ratio).toFixed(2));
          activeSeries.createPriceLine({
            price: price,
            color: r.color,
            lineWidth: 1.5,
            lineStyle: 1, // dashed
            axisLabelVisible: true,
            title: `Fib ${r.label}: ₹${price}`,
          });
        });
      });
    }

    // 7.2 Risk/Reward drawings
    if (activeSeries && rrSetup) {
      activeSeries.createPriceLine({
        price: rrSetup.entry,
        color: '#f59e0b', // Yellow
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Entry Price',
      });
      activeSeries.createPriceLine({
        price: rrSetup.target,
        color: '#10b981', // Green
        lineWidth: 2.5,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'Take Profit',
      });
      activeSeries.createPriceLine({
        price: rrSetup.sl,
        color: '#ef4444', // Red
        lineWidth: 2.5,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'Stop Loss',
      });
    }

    // 7.3 Custom Text Candle Markers & Supertrend BUY/SELL Alerts & AI Candlestick Patterns
    if (activeSeries) {
      const supertrendMarkers: any[] = [];
      if (showSupertrend) {
        for (let i = 1; i < enrichedCandles.length; i++) {
          const prev = enrichedCandles[i - 1];
          const curr = enrichedCandles[i];
          if (prev.supertrendDirection === 'down' && curr.supertrendDirection === 'up') {
            supertrendMarkers.push({
              time: curr.timestamp as UTCTimestamp,
              position: 'belowBar',
              color: '#10b981',
              shape: 'arrowUp',
              text: 'ST BUY',
            });
          } else if (prev.supertrendDirection === 'up' && curr.supertrendDirection === 'down') {
            supertrendMarkers.push({
              time: curr.timestamp as UTCTimestamp,
              position: 'aboveBar',
              color: '#ef4444',
              shape: 'arrowDown',
              text: 'ST SELL',
            });
          }
        }
      }

      const patternMarkers: any[] = [];
      if (showPatternMarkers) {
        for (let i = 1; i < enrichedCandles.length; i++) {
          const prev = enrichedCandles[i - 1];
          const curr = enrichedCandles[i];
          const currOpen = curr.open;
          const currClose = curr.close;
          const currHigh = curr.high;
          const currLow = curr.low;
          const prevOpen = prev.open;
          const prevClose = prev.close;

          const isCurrGreen = currClose > currOpen;
          const isPrevGreen = prevClose > prevOpen;
          const bodySize = Math.abs(currClose - currOpen);
          const totalRange = currHigh - currLow;

          if (totalRange === 0) continue;

          // 1. Hammer Pattern
          const lowerShadow = isCurrGreen ? (currOpen - currLow) : (currClose - currLow);
          const upperShadow = isCurrGreen ? (currHigh - currClose) : (currHigh - currOpen);
          if (lowerShadow >= 2 * bodySize && upperShadow <= 0.25 * bodySize && bodySize > 0) {
            patternMarkers.push({
              time: curr.timestamp as UTCTimestamp,
              position: 'belowBar',
              color: '#34d399',
              shape: 'arrowUp',
              text: '🔨 HAMMER (BUY)',
            });
            continue;
          }

          // 2. Shooting Star Pattern
          if (upperShadow >= 2 * bodySize && lowerShadow <= 0.25 * bodySize && bodySize > 0) {
            patternMarkers.push({
              time: curr.timestamp as UTCTimestamp,
              position: 'aboveBar',
              color: '#f87171',
              shape: 'arrowDown',
              text: '☄️ SHOOTING STAR (SELL)',
            });
            continue;
          }

          // 3. Bullish Engulfing
          if (!isPrevGreen && isCurrGreen && currClose > prevOpen && currOpen < prevClose) {
            patternMarkers.push({
              time: curr.timestamp as UTCTimestamp,
              position: 'belowBar',
              color: '#059669',
              shape: 'arrowUp',
              text: '📈 ENGULFING (BUY)',
            });
            continue;
          }

          // 4. Bearish Engulfing
          if (isPrevGreen && !isCurrGreen && currClose < prevOpen && currOpen > prevClose) {
            patternMarkers.push({
              time: curr.timestamp as UTCTimestamp,
              position: 'aboveBar',
              color: '#dc2626',
              shape: 'arrowDown',
              text: '📉 ENGULFING (SELL)',
            });
            continue;
          }
        }
      }

      const combinedMarkers = [...supertrendMarkers, ...patternMarkers, ...customMarkers];
      if (activeSeries && typeof activeSeries.setMarkers === 'function') {
        if (combinedMarkers.length > 0) {
          combinedMarkers.sort((a, b) => (a.time as number) - (b.time as number));
          activeSeries.setMarkers(combinedMarkers);
        } else {
          activeSeries.setMarkers([]);
        }
      }
    }

    // 7.4 Trendlines drawings
    if (activeSeries && trendlines.length > 0) {
      trendlines.forEach(tl => {
        const trendLineSeries = chart.addSeries(LineSeries, {
          color: '#38bdf8', // Light blue trendline
          lineWidth: 2,
          priceLineVisible: false,
          title: 'Trendline',
        });
        const trendLineData = [
          { time: tl.start.time as UTCTimestamp, value: tl.start.price },
          { time: tl.end.time as UTCTimestamp, value: tl.end.price }
        ].sort((a, b) => (a.time as number) - (b.time as number));
        trendLineSeries.setData(trendLineData);
      });
    }

    // 8. Secondary RSI Chart Panel
    let rsiChart: any = null;
    if (showRSI && rsiContainerRef.current) {
      rsiChart = createChart(rsiContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: themeConfig.background },
          textColor: themeConfig.textColor,
          fontFamily: 'Inter, sans-serif',
        },
        grid: {
          vertLines: { color: themeConfig.grid },
          horzLines: { color: themeConfig.grid },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: crosshairCol,
            width: 1,
            style: 3,
          },
          horzLine: {
            color: crosshairCol,
            width: 1,
            style: 3,
          }
        },
        rightPriceScale: {
          borderColor: borderCol,
          visible: true,
        },
        timeScale: {
          borderColor: borderCol,
          visible: false, // hide time scale on the RSI chart to avoid duplicate labels
        },
      });
      rsiChartRef.current = rsiChart;

      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 1.5,
        title: 'RSI(14)',
      });

      // Add horizontal guidelines at 30, 50, 70 limits
      rsiSeries.createPriceLine({
        price: 70,
        color: 'rgba(239, 68, 68, 0.3)',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: '70 (Overbought)',
      });
      rsiSeries.createPriceLine({
        price: 50,
        color: isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.1)',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: '50 (Neutral)',
      });
      rsiSeries.createPriceLine({
        price: 30,
        color: 'rgba(16, 185, 129, 0.3)',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: '30 (Oversold)',
      });

      const rsiDataRaw = calculateRSI(enrichedCandles, 14);
      const rsiSeriesData = rsiDataRaw.map(r => {
        return {
          time: (r.timestamp || 0) as UTCTimestamp,
          value: r.value,
        };
      }).filter(d => d.time > 0);

      rsiSeries.setData(rsiSeriesData);

      // Synchronize time scales
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) {
          rsiChart.timeScale().setVisibleLogicalRange(range);
        }
      });

      rsiChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) {
          chart.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    // 8.1 Secondary MACD Chart Panel
    let macdChart: any = null;
    if (showMACD && macdContainerRef.current) {
      macdChart = createChart(macdContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: themeConfig.background },
          textColor: themeConfig.textColor,
          fontFamily: 'Inter, sans-serif',
        },
        grid: {
          vertLines: { color: themeConfig.grid },
          horzLines: { color: themeConfig.grid },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: crosshairCol,
            width: 1,
            style: 3,
          },
          horzLine: {
            color: crosshairCol,
            width: 1,
            style: 3,
          }
        },
        rightPriceScale: {
          borderColor: borderCol,
          visible: true,
        },
        timeScale: {
          borderColor: borderCol,
          visible: false, // hide time scale
        },
      });
      macdChartRef.current = macdChart;

      const macdLineSeries = macdChart.addSeries(LineSeries, {
        color: '#3b82f6', // blue
        lineWidth: 1.5,
        title: 'MACD',
      });
      const signalLineSeries = macdChart.addSeries(LineSeries, {
        color: '#f97316', // orange
        lineWidth: 1.5,
        title: 'Signal',
      });
      const histogramSeries = macdChart.addSeries(HistogramSeries, {
        color: isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)',
        priceFormat: {
          type: 'volume',
        },
      });

      const macdDataRaw = calculateMACD(enrichedCandles);
      const macdLineData = macdDataRaw.map(r => {
        return {
          time: (r.timestamp || 0) as UTCTimestamp,
          value: r.macd,
        };
      }).filter(d => d.time > 0);

      const signalLineData = macdDataRaw.map(r => {
        return {
          time: (r.timestamp || 0) as UTCTimestamp,
          value: r.signal,
        };
      }).filter(d => d.time > 0);

      const histogramData = macdDataRaw.map(r => {
        return {
          time: (r.timestamp || 0) as UTCTimestamp,
          value: r.histogram,
          color: r.histogram >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        };
      }).filter(d => d.time > 0);

      macdLineSeries.setData(macdLineData);
      signalLineSeries.setData(signalLineData);
      histogramSeries.setData(histogramData);

      // Synchronize time scales
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) {
          macdChart.timeScale().setVisibleLogicalRange(range);
        }
      });
      macdChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) {
          chart.timeScale().setVisibleLogicalRange(range);
        }
      });

      if (rsiChart) {
        rsiChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (range) {
            macdChart.timeScale().setVisibleLogicalRange(range);
          }
        });
        macdChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (range) {
            rsiChart.timeScale().setVisibleLogicalRange(range);
          }
        });
      }
    }

    // Auto fit visible content nicely
    chart.timeScale().fitContent();

    // 9. Click Handler for Drawing tools
    const clickHandler = (param: any) => {
      if (!param.point || !activeSeries) return;
      const price = activeSeries.coordinateToPrice(param.point.y);
      if (price === null || price === undefined) return;

      if (activeToolRef.current === 'draw-support') {
        const roundedPrice = Number(price.toFixed(2));
        setCustomLines(prev => [...prev, { id: `cl-${Date.now()}`, price: roundedPrice, type: 'support' }]);
        setActiveTool('cursor');
      } else if (activeToolRef.current === 'draw-resistance') {
        const roundedPrice = Number(price.toFixed(2));
        setCustomLines(prev => [...prev, { id: `cl-${Date.now()}`, price: roundedPrice, type: 'resistance' }]);
        setActiveTool('cursor');
      } else if (activeToolRef.current === 'draw-fib-start') {
        setFibStartPrice(Number(price.toFixed(2)));
        setActiveTool('draw-fib-end');
      } else if (activeToolRef.current === 'draw-fib-end') {
        if (fibStartPrice !== null) {
          setFibLevelsList(prev => [
            ...prev,
            { id: `fib-${Date.now()}`, start: fibStartPrice, end: Number(price.toFixed(2)) }
          ]);
        }
        setFibStartPrice(null);
        setActiveTool('cursor');
      } else if (activeToolRef.current === 'risk-reward-entry') {
        setRREntryPrice(Number(price.toFixed(2)));
        setActiveTool('risk-reward-target');
      } else if (activeToolRef.current === 'risk-reward-target') {
        setRRTargetPrice(Number(price.toFixed(2)));
        setActiveTool('risk-reward-sl');
      } else if (activeToolRef.current === 'risk-reward-sl') {
        if (rrEntryPrice !== null && rrTargetPrice !== null) {
          setRRSetup({
            entry: rrEntryPrice,
            target: rrTargetPrice,
            sl: Number(price.toFixed(2))
          });
        }
        setRREntryPrice(null);
        setRRTargetPrice(null);
        setActiveTool('cursor');
      } else if (activeToolRef.current === 'draw-marker') {
        const time = param.time;
        if (time) {
          setCustomMarkers(prev => [
            ...prev,
            {
              time: time,
              position: 'aboveBar',
              color: '#3b82f6',
              shape: 'arrowDown',
              text: markerText || 'NOTE',
            }
          ]);
          setActiveTool('cursor');
        }
      } else if (activeToolRef.current === 'draw-trendline-start') {
        const time = param.time;
        if (time) {
          setTrendlineStart({ time: Number(time), price: Number(price.toFixed(2)) });
          setActiveTool('draw-trendline-end');
        }
      } else if (activeToolRef.current === 'draw-trendline-end') {
        const time = param.time;
        if (time && trendlineStart) {
          setTrendlines(prev => [
            ...prev,
            {
              id: `tl-${Date.now()}`,
              start: trendlineStart,
              end: { time: Number(time), price: Number(price.toFixed(2)) }
            }
          ]);
        }
        setTrendlineStart(null);
        setActiveTool('cursor');
      }
    };
    chart.subscribeClick(clickHandler);

    // 10. Handle resize and cleanup
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
      if (rsiChart && rsiContainerRef.current) {
        rsiChart.applyOptions({
          width: rsiContainerRef.current.clientWidth,
          height: rsiContainerRef.current.clientHeight,
        });
      }
      if (macdChart && macdContainerRef.current) {
        macdChart.applyOptions({
          width: macdContainerRef.current.clientWidth,
          height: macdContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      chart.unsubscribeClick(clickHandler);
      chart.remove();
      chartRef.current = null;
      if (rsiChart) {
        rsiChart.remove();
        rsiChartRef.current = null;
      }
      if (macdChart) {
        macdChart.remove();
        macdChartRef.current = null;
      }
      candlestickSeriesRef.current = null;
      areaSeriesRef.current = null;
      volumeSeriesRef.current = null;
      emaSeriesRef.current = null;
      smaSeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
      bbBasisSeriesRef.current = null;
    };
  }, [candles, timeframe, chartType, showEMA, showSMA, showBB, showVolume, isPositive, showAutoSR, showRSI, showMACD, customLines, trendlines, trendlineStart, fibLevelsList, fibStartPrice, rrSetup, customMarkers, chartTheme, themeConfig, showSupertrend, showVWAP, showEma50_200, showPatternMarkers]);

  const riskRewardRatio = useMemo(() => {
    if (!rrSetup) return null;
    const targetDiff = Math.abs(rrSetup.target - rrSetup.entry);
    const slDiff = Math.abs(rrSetup.entry - rrSetup.sl);
    if (slDiff === 0) return 0;
    return Number((targetDiff / slDiff).toFixed(2));
  }, [rrSetup]);

  return (
    <div className="flex h-full w-full bg-[#090c13] rounded-xl overflow-hidden border border-white/5 relative">
      {/* TradingView Advanced Vertical Sidebar Toolbar */}
      <div className="w-12 border-r border-white/5 bg-[#07090e]/85 flex flex-col items-center py-3.5 gap-3.5 shrink-0 overflow-y-auto max-h-full">
        {/* Navigation Cursor / Move mode */}
        <button
          onClick={() => setActiveTool('cursor')}
          title="Cursor / Select Mode"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer ${
            activeTool === 'cursor' ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Support Line Tool */}
        <button
          onClick={() => setActiveTool(activeTool === 'draw-support' ? 'cursor' : 'draw-support')}
          title="Draw Support Line (Click on Chart)"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer relative ${
            activeTool === 'draw-support' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-gray-500 hover:text-emerald-400 hover:bg-white/5'
          }`}
        >
          {activeTool === 'draw-support' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <TrendingUp className="w-4 h-4" />
        </button>

        {/* Resistance Line Tool */}
        <button
          onClick={() => setActiveTool(activeTool === 'draw-resistance' ? 'cursor' : 'draw-resistance')}
          title="Draw Resistance Line (Click on Chart)"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer relative ${
            activeTool === 'draw-resistance' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-gray-500 hover:text-rose-400 hover:bg-white/5'
          }`}
        >
          {activeTool === 'draw-resistance' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          )}
          <TrendingDown className="w-4 h-4" />
        </button>

        {/* Fibonacci Retracement Tool */}
        <button
          onClick={() => setActiveTool(activeTool === 'draw-fib-start' ? 'cursor' : 'draw-fib-start')}
          title="Fibonacci Retracement Tool (High to Low)"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer relative ${
            activeTool === 'draw-fib-start' || activeTool === 'draw-fib-end' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-gray-500 hover:text-amber-400 hover:bg-white/5'
          }`}
        >
          {(activeTool === 'draw-fib-start' || activeTool === 'draw-fib-end') && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
          <Percent className="w-4 h-4" />
        </button>

        {/* Trendline Tool */}
        <button
          onClick={() => setActiveTool(activeTool === 'draw-trendline-start' || activeTool === 'draw-trendline-end' ? 'cursor' : 'draw-trendline-start')}
          title="Draw Trendline Segment (Click point A then point B)"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer relative ${
            activeTool === 'draw-trendline-start' || activeTool === 'draw-trendline-end' ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-gray-500 hover:text-sky-400 hover:bg-white/5'
          }`}
        >
          {(activeTool === 'draw-trendline-start' || activeTool === 'draw-trendline-end') && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          )}
          <GitCommit className="w-4 h-4" />
        </button>

        {/* Risk/Reward Calculator Tool */}
        <button
          onClick={() => setActiveTool(activeTool === 'risk-reward-entry' ? 'cursor' : 'risk-reward-entry')}
          title="Risk/Reward Setup (Entry -> Target -> SL)"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer relative ${
            activeTool === 'risk-reward-entry' || activeTool === 'risk-reward-target' || activeTool === 'risk-reward-sl' ? 'bg-teal-500/20 text-teal-400 font-bold' : 'text-gray-500 hover:text-teal-400 hover:bg-white/5'
          }`}
        >
          {(activeTool === 'risk-reward-entry' || activeTool === 'risk-reward-target' || activeTool === 'risk-reward-sl') && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          )}
          <Target className="w-4 h-4" />
        </button>

        {/* Custom Text Marker / Flag Tool */}
        <button
          onClick={() => setActiveTool(activeTool === 'draw-marker' ? 'cursor' : 'draw-marker')}
          title="Add Text Marker (Type text and click candle)"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer relative ${
            activeTool === 'draw-marker' ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-gray-500 hover:text-sky-400 hover:bg-white/5'
          }`}
        >
          {activeTool === 'draw-marker' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          )}
          <Type className="w-4 h-4" />
        </button>

        {/* Clear user drawings / reset all button */}
        {(customLines.length > 0 || trendlines.length > 0 || fibLevelsList.length > 0 || rrSetup !== null || customMarkers.length > 0) && (
          <button
            onClick={() => {
              setCustomLines([]);
              setTrendlines([]);
              setTrendlineStart(null);
              setFibLevelsList([]);
              setRRSetup(null);
              setCustomMarkers([]);
              setActiveTool('cursor');
            }}
            title="Clear All Custom Annotations/Drawings"
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all border-0 bg-transparent cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="w-6 h-px bg-white/5 my-0.5" />

        {/* Auto S/R pivots calculation */}
        <button
          onClick={() => setShowAutoSR(!showAutoSR)}
          title="Toggle Auto-S/R Pivot Zones"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer ${
            showAutoSR ? 'bg-sky-500/15 text-sky-400 font-bold' : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Synchronized RSI Panel Toggle */}
        <button
          onClick={() => setShowRSI(!showRSI)}
          title="Toggle RSI Oscillator Panel"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer ${
            showRSI ? 'bg-purple-500/15 text-purple-400 font-bold' : 'text-gray-500 hover:text-purple-400 hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Synchronized MACD Panel Toggle */}
        <button
          onClick={() => setShowMACD(!showMACD)}
          title="Toggle MACD Indicator Panel"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer ${
            showMACD ? 'bg-blue-500/15 text-blue-400 font-bold' : 'text-gray-500 hover:text-blue-400 hover:bg-white/5'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
        </button>

        {/* Automatic Technical Pattern Scan Toggler */}
        <button
          onClick={() => setShowPatternMarkers(!showPatternMarkers)}
          title="Toggle Candlestick Pattern Scan Markers"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer ${
            showPatternMarkers ? 'bg-emerald-500/15 text-emerald-400 font-bold' : 'text-gray-500 hover:text-emerald-400 hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* AI Chart Analyst Sidepanel Toggler */}
        <button
          onClick={() => setShowAIAdvisor(!showAIAdvisor)}
          title="Toggle AI Chart Analyst Sidepanel"
          className={`p-2 rounded-lg transition-all border-0 bg-transparent cursor-pointer relative ${
            showAIAdvisor ? 'bg-sky-500/15 text-sky-400 font-bold' : 'text-gray-500 hover:text-sky-400 hover:bg-white/5'
          }`}
        >
          {isAnalyzing && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
          )}
          <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
        </button>

        {/* Chart Theme Switcher */}
        <button
          onClick={() => {
            const themes: ('charcoal' | 'forest' | 'cyberpunk' | 'light')[] = ['charcoal', 'forest', 'cyberpunk', 'light'];
            const nextIdx = (themes.indexOf(chartTheme) + 1) % themes.length;
            setChartTheme(themes[nextIdx]);
          }}
          title={`Chart Theme: ${chartTheme.toUpperCase()}`}
          className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-white/5 transition-all border-0 bg-transparent cursor-pointer"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Maximized Fullscreen Toggle inside app */}
        {isExpanded && onCloseExpanded ? (
          <button
            onClick={onCloseExpanded}
            title="Minimize / Exit Fullscreen (Esc)"
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all border-0 bg-transparent cursor-pointer mt-auto"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Main Chart Workspace */}
      <div className="flex-1 flex flex-col h-full bg-[#090c13] min-w-0" style={{ backgroundColor: themeConfig.background }}>
        <div className="flex-1 relative min-h-[140px]">
          <div ref={chartContainerRef} className="absolute inset-0" />

          {/* Prompt drawing assistance overlays */}
          {activeTool !== 'cursor' && (
            <div className="absolute top-3 left-3 bg-[#0c0f17]/95 border border-sky-500/25 px-3 py-1.5 rounded-xl shadow-2xl z-20 pointer-events-none flex items-center gap-2 text-xs text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              <span className="font-medium">
                {activeTool === 'draw-support' && '🎯 DRAWING SUPPORT: Click anywhere on chart to place a green Support line'}
                {activeTool === 'draw-resistance' && '🎯 DRAWING RESISTANCE: Click anywhere on chart to place a red Resistance line'}
                {activeTool === 'draw-fib-start' && '📐 FIBONACCI RETRACEMENT: Click on the HIGH / Start price point'}
                {activeTool === 'draw-fib-end' && '📐 FIBONACCI RETRACEMENT: Click on the LOW / End price point to draw levels'}
                {activeTool === 'risk-reward-entry' && '🎯 RISK/REWARD SETUP: Click on the Entry price point'}
                {activeTool === 'risk-reward-target' && '🎯 RISK/REWARD SETUP: Click on the Target / Take Profit price point'}
                {activeTool === 'risk-reward-sl' && '🎯 RISK/REWARD SETUP: Click on the Stop Loss price point'}
                {activeTool === 'draw-marker' && '💬 TEXT FLAG: Type annotation label in input box and click candle'}
                {activeTool === 'draw-trendline-start' && '📈 DRAWING TRENDLINE: Click point A (Start point on candle)'}
                {activeTool === 'draw-trendline-end' && '📈 DRAWING TRENDLINE: Click point B (End point on candle) to draw line segment'}
              </span>
            </div>
          )}

          {/* Custom marker label text overlay input */}
          {activeTool === 'draw-marker' && (
            <div className="absolute top-14 left-3 bg-[#0c0f17]/95 border border-sky-500/25 px-3 py-1.5 rounded-xl shadow-2xl z-20 flex items-center gap-2 text-xs text-white">
              <span>Flag Label:</span>
              <input
                type="text"
                value={markerText ?? ''}
                onChange={e => setMarkerText(e.target.value.toUpperCase())}
                className="w-24 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-gray-400 font-mono text-[10px]">(Then click candle)</span>
            </div>
          )}

          {/* Risk/Reward active ratio display banner */}
          {rrSetup && (
            <div className="absolute top-3 right-3 bg-[#0c0f17]/95 border border-emerald-500/25 px-3 py-1.5 rounded-xl shadow-2xl z-20 flex items-center gap-3 text-xs text-white">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Target className="w-3.5 h-3.5" />
                Risk/Reward Ratio: {riskRewardRatio}
              </span>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-gray-400">Entry: <span className="text-amber-400">₹{rrSetup.entry}</span></span>
              <span className="text-gray-400">Target: <span className="text-emerald-400">₹{rrSetup.target}</span></span>
              <span className="text-gray-400">SL: <span className="text-rose-400">₹{rrSetup.sl}</span></span>
              <button
                onClick={() => setRRSetup(null)}
                className="ml-1 text-gray-500 hover:text-rose-400 bg-transparent border-0 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Relative Strength Index Subpanel */}
        {showRSI && (
          <div className="h-28 border-t border-white/5 relative shrink-0" style={{ backgroundColor: themeConfig.background }}>
            <div ref={rsiContainerRef} className="absolute inset-0" />
            <div className="absolute top-2.5 left-2.5 text-[9px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/10 pointer-events-none tracking-wider select-none">
              RSI (14)
            </div>
          </div>
        )}

        {/* Moving Average Convergence Divergence Subpanel */}
        {showMACD && (
          <div className="h-28 border-t border-white/5 relative shrink-0" style={{ backgroundColor: themeConfig.background }}>
            <div ref={macdContainerRef} className="absolute inset-0" />
            <div className="absolute top-2.5 left-2.5 text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/10 pointer-events-none tracking-wider select-none">
              MACD (12, 26, 9)
            </div>
          </div>
        )}
      </div>

      {/* AI Advisor Panel on the right side of the chart workspace */}
      {showAIAdvisor && (
        <div className="w-80 border-l border-white/5 bg-[#07090e]/95 flex flex-col h-full shrink-0 relative overflow-hidden select-text">
          {/* Header */}
          <div className="p-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#090c13]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase font-display tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> AI Chart Analyst
              </span>
            </div>
            <button
              onClick={() => setShowAIAdvisor(false)}
              className="text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer p-0 text-sm font-bold"
              title="Close Panel"
            >
              ✕
            </button>
          </div>

          {/* Analysis View Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
            {!isAnalyzing && !analysisResult && (
              <div className="flex flex-col items-center justify-center text-center h-full space-y-4 py-8">
                <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1 px-2">
                  <h4 className="text-sm font-semibold text-white">Interactive Confluence Audit</h4>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Analyze indicators, volume, moving averages, and your custom drawing confluences instantly.
                  </p>
                </div>
                <button
                  onClick={() => handleRunChartAnalysis()}
                  className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold hover:from-sky-400 hover:to-indigo-400 transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Scan Active Chart
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center text-center h-full space-y-4 py-12">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-sky-500/20 border-t-sky-400 border-solid animate-spin" />
                  <Sparkles className="w-5 h-5 text-sky-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-sky-400 font-bold font-mono tracking-wider uppercase text-[10px] animate-pulse">Running Scan...</span>
                  <p className="text-gray-400 font-mono text-[10px] max-w-[200px] leading-relaxed">
                    {analysisSteps}
                  </p>
                </div>
              </div>
            )}

            {!isAnalyzing && analysisResult && (
              <div className="space-y-4">
                {/* Main Results Container */}
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-[11px] bg-[#0c0f17]/60 p-3 rounded-xl border border-white/5 space-y-3">
                  {analysisResult.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('###')) {
                      return <h3 key={idx} className="text-sm font-extrabold text-white mt-4 first:mt-0 font-display uppercase tracking-wider">{trimmed.replace(/###/g, '').trim()}</h3>;
                    }
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                      return <div key={idx} className="font-bold text-sky-400 mt-2">{trimmed.replace(/\*\*/g, '').trim()}</div>;
                    }
                    if (trimmed.startsWith('-')) {
                      return <li key={idx} className="list-none pl-2 border-l border-sky-500/30 text-gray-300 my-1">{trimmed.substring(1).trim()}</li>;
                    }
                    if (trimmed.startsWith('>')) {
                      return <blockquote key={idx} className="border-l-2 border-amber-500 bg-amber-500/5 p-2 rounded text-[10px] italic text-amber-300 my-2">{trimmed.substring(1).trim()}</blockquote>;
                    }
                    return line ? <p key={idx} className="my-1.5">{line}</p> : <div key={idx} className="h-1" />;
                  })}
                </div>

                {/* Quick actions inside result */}
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <button
                    onClick={() => handleRunChartAnalysis("Based on this chart, should I Buy or Sell right now? Give specific entry, take profit, and stop loss values.")}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[9px] font-mono border border-solid border-white/5 transition cursor-pointer text-left"
                  >
                    🎯 Trade Levels?
                  </button>
                  <button
                    onClick={() => handleRunChartAnalysis("Identify the key support and resistance zones and whether the price is showing strength or weakness.")}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[9px] font-mono border border-solid border-white/5 transition cursor-pointer text-left"
                  >
                    🛡️ Key Confluences?
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chat / Custom Question Input Bar */}
          <div className="p-3 border-t border-solid border-white/5 bg-[#090c13] shrink-0 space-y-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={isAnalyzing ? "AI is thinking..." : "Ask in Hinglish, Hindi, etc..."}
                value={advisorQuestion ?? ''}
                onChange={e => setAdvisorQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && advisorQuestion.trim() && !isAnalyzing) {
                    handleRunChartAnalysis();
                  }
                }}
                disabled={isAnalyzing}
                className="flex-1 bg-white/5 border border-solid border-white/10 px-2.5 py-1.5 rounded-xl text-[11px] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleRunChartAnalysis()}
                disabled={!advisorQuestion.trim() || isAnalyzing}
                className="px-3 rounded-xl bg-sky-500 border-0 text-white hover:bg-sky-400 transition font-bold disabled:opacity-40 disabled:hover:bg-sky-500 flex items-center justify-center cursor-pointer"
              >
                Ask
              </button>
            </div>
            <div className="text-[8px] text-gray-500 text-center font-mono uppercase tracking-wider">
              Gemini Pro Chart Reasoning Engine
            </div>
          </div>
        </div>
      )}
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
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Chart engine state locked to TradingView for a professional charting experience with advanced drawing tools and indicators
  const chartSource = 'tradingview';

  // Auto-switch to Native chart has been removed because the new interactive lightweight-charts engine supports all instruments flawlessly.
  
  // Technical Indicators Toggles
  const [showEMA, setShowEMA] = useState(true);
  const [showSMA, setShowSMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showSupertrend, setShowSupertrend] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showEma50_200, setShowEma50_200] = useState(false);

  // Customizable indicator periods
  const [emaPeriod, setEmaPeriod] = useState<number>(8);
  const [smaPeriod, setSmaPeriod] = useState<number>(15);
  const [bbPeriod, setBbPeriod] = useState<number>(20);

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

  // Technical Indicators Formulas: EMA, SMA, Bollinger Bands, EMA 50/200, VWAP, Supertrend
  const computeIndicators = (rawCandles: Candle[]): Candle[] => {
    if (rawCandles.length === 0) return [];
    
    // Create shallow copies of candle objects to bypass read-only property errors from frozen react states
    const data = rawCandles.map(c => ({ ...c }));

    // 1. EMA (Period dynamic)
    const k = 2 / (emaPeriod + 1);
    let emaVal = data[0].close;
    data[0].ema = Number(emaVal.toFixed(2));

    for (let i = 1; i < data.length; i++) {
      emaVal = data[i].close * k + emaVal * (1 - k);
      data[i].ema = Number(emaVal.toFixed(2));
    }

    // 2. SMA (Period dynamic)
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

    // 3. Bollinger Bands (Period dynamic, StdDev 2)
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

    // 4. EMA 50
    const k50 = 2 / (50 + 1);
    let emaVal50 = data[0].close;
    data[0].ema50 = Number(emaVal50.toFixed(2));
    for (let i = 1; i < data.length; i++) {
      emaVal50 = data[i].close * k50 + emaVal50 * (1 - k50);
      data[i].ema50 = Number(emaVal50.toFixed(2));
    }

    // 5. EMA 200
    const k200 = 2 / (200 + 1);
    let emaVal200 = data[0].close;
    data[0].ema200 = Number(emaVal200.toFixed(2));
    for (let i = 1; i < data.length; i++) {
      emaVal200 = data[i].close * k200 + emaVal200 * (1 - k200);
      data[i].ema200 = Number(emaVal200.toFixed(2));
    }

    // 6. VWAP (Cumulative Volume Weighted Average Price)
    let cumulativeTypicalPriceVolume = 0;
    let cumulativeVolume = 0;
    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      cumulativeTypicalPriceVolume += typicalPrice * data[i].volume;
      cumulativeVolume += data[i].volume;
      data[i].vwap = Number((cumulativeVolume === 0 ? typicalPrice : cumulativeTypicalPriceVolume / cumulativeVolume).toFixed(2));
    }

    // 7. Supertrend (ATR Period: 10, ATR Multiplier: 3)
    const stPeriod = 10;
    const stMultiplier = 3;
    if (data.length >= stPeriod) {
      const tr: number[] = [];
      const atr: number[] = [];

      // Calculate True Range
      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          tr.push(data[i].high - data[i].low);
        } else {
          const prevClose = data[i - 1].close;
          const t1 = data[i].high - data[i].low;
          const t2 = Math.abs(data[i].high - prevClose);
          const t3 = Math.abs(data[i].low - prevClose);
          tr.push(Math.max(t1, t2, t3));
        }
      }

      // Calculate ATR
      let trSum = 0;
      for (let i = 0; i < stPeriod; i++) {
        trSum += tr[i];
      }
      let currentAtr = trSum / stPeriod;
      atr[stPeriod - 1] = currentAtr;

      for (let i = stPeriod; i < data.length; i++) {
        currentAtr = (atr[i - 1] * (stPeriod - 1) + tr[i]) / stPeriod;
        atr.push(currentAtr);
      }

      // Compute Supertrend Bands
      let prevUpperBand = 0;
      let prevLowerBand = 0;
      let prevSupertrend = 0;

      for (let i = 0; i < data.length; i++) {
        if (i < stPeriod) {
          data[i].supertrend = data[i].close;
          data[i].supertrendDirection = 'up';
          continue;
        }

        const hl2 = (data[i].high + data[i].low) / 2;
        const currentAtrVal = atr[i];

        const basicUpperBand = hl2 + stMultiplier * currentAtrVal;
        const basicLowerBand = hl2 - stMultiplier * currentAtrVal;

        let finalUpperBand = basicUpperBand;
        let finalLowerBand = basicLowerBand;

        const prevClose = data[i - 1].close;
        if (basicUpperBand < prevUpperBand || prevClose > prevUpperBand) {
          finalUpperBand = basicUpperBand;
        } else {
          finalUpperBand = prevUpperBand;
        }

        if (basicLowerBand > prevLowerBand || prevClose < prevLowerBand) {
          finalLowerBand = basicLowerBand;
        } else {
          finalLowerBand = prevLowerBand;
        }

        let supertrendVal = 0;
        let direction: 'up' | 'down' = 'up';

        if (i === stPeriod) {
          supertrendVal = data[i].close > finalUpperBand ? finalLowerBand : finalUpperBand;
          direction = data[i].close > finalUpperBand ? 'up' : 'down';
        } else {
          if (prevSupertrend === prevUpperBand) {
            if (data[i].close > finalUpperBand) {
              supertrendVal = finalLowerBand;
              direction = 'up';
            } else {
              supertrendVal = finalUpperBand;
              direction = 'down';
            }
          } else {
            if (data[i].close < finalLowerBand) {
              supertrendVal = finalUpperBand;
              direction = 'down';
            } else {
              supertrendVal = finalLowerBand;
              direction = 'up';
            }
          }
        }

        data[i].supertrend = Number(supertrendVal.toFixed(2));
        data[i].supertrendDirection = direction;

        prevUpperBand = finalUpperBand;
        prevLowerBand = finalLowerBand;
        prevSupertrend = supertrendVal;
      }
    } else {
      // Fallback if not enough data
      for (let i = 0; i < data.length; i++) {
        data[i].supertrend = data[i].close;
        data[i].supertrendDirection = 'up';
      }
    }

    return data;
  };

  // Listen for Escape key to exit fullscreen expanded view
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

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
  }, [activeAsset.symbol, timeframe, emaPeriod, smaPeriod, bbPeriod]);

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
      if (showEma50_200 && c.ema50 && c.ema50 < lowest) lowest = c.ema50;
      if (showEma50_200 && c.ema50 && c.ema50 > highest) highest = c.ema50;
      if (showEma50_200 && c.ema200 && c.ema200 < lowest) lowest = c.ema200;
      if (showEma50_200 && c.ema200 && c.ema200 > highest) highest = c.ema200;
      if (showVWAP && c.vwap && c.vwap < lowest) lowest = c.vwap;
      if (showVWAP && c.vwap && c.vwap > highest) highest = c.vwap;
      if (showSupertrend && c.supertrend && c.supertrend < lowest) lowest = c.supertrend;
      if (showSupertrend && c.supertrend && c.supertrend > highest) highest = c.supertrend;

      if (lowest < min) min = lowest;
      if (highest > max) max = highest;
    });

    const padding = (max - min) * 0.05 || 1;
    return {
      minPrice: Math.floor(min - padding),
      maxPrice: Math.ceil(max + padding)
    };
  }, [candles, showEMA, showSMA, showBB, showSupertrend, showVWAP, showEma50_200]);

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

        {/* Advanced Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#07090e] border border-white/5 p-1 rounded-xl">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border-0 bg-transparent cursor-pointer ${
                  timeframe === tf 
                    ? 'bg-sky-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center bg-[#07090e] border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border-0 bg-transparent cursor-pointer ${
                chartType === 'candle' 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border-0 bg-transparent cursor-pointer ${
                chartType === 'area' 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Area
            </button>
          </div>

          {/* Immersive Fullscreen Button */}
          <button
            onClick={() => setIsExpanded(true)}
            title="Open Immersive Fullscreen Drawing Terminal"
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-[#07090e] border border-white/10 text-sky-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" /> Maximize
          </button>
        </div>
      </div>

      {/* Grid Layout for Active Chart Terminal and Technical Gauge Tools */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
        {/* Main Chart viewport container */}
        <div className={`col-span-1 ${showControls ? 'xl:col-span-3' : 'xl:col-span-4'} relative`} style={{ height: `${height}px` }}>
          <TradingViewChart 
            symbol={activeAsset.symbol} 
            timeframe={timeframe} 
            candles={candles}
            chartType={chartType}
            showEMA={showEMA}
            showSMA={showSMA}
            showBB={showBB}
            showVolume={showVolume}
            isPositive={isPositive}
            emaPeriod={emaPeriod}
            smaPeriod={smaPeriod}
            bbPeriod={bbPeriod}
            showSupertrend={showSupertrend}
            showVWAP={showVWAP}
            showEma50_200={showEma50_200}
          />
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
      {showControls && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-white/5 text-[10px] text-gray-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5" /> Indicators:
            </span>

            {/* EMA Control Button with custom input */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition border-solid ${
              showEMA 
                ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-md' 
                : 'bg-[#07090e] border-white/5 text-gray-400'
            }`}>
              <button
                onClick={() => setShowEMA(!showEMA)}
                className="flex items-center gap-1.5 font-bold bg-transparent border-0 text-inherit cursor-pointer p-0"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showEMA ? 'bg-sky-400' : 'bg-gray-600'}`} />
                <span>EMA</span>
              </button>
              <input
                type="number"
                min="2"
                max="200"
                value={emaPeriod ?? 8}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 2 && val <= 200) setEmaPeriod(val);
                }}
                className="w-8 text-center bg-white/5 border border-white/10 rounded font-mono text-[9px] text-white focus:outline-none focus:ring-1 focus:ring-sky-500 py-0"
                title="EMA Period (2 to 200)"
                onClick={e => e.stopPropagation()}
              />
            </div>

            {/* SMA Control Button with custom input */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition border-solid ${
              showSMA 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-md' 
                : 'bg-[#07090e] border-white/5 text-gray-400'
            }`}>
              <button
                onClick={() => setShowSMA(!showSMA)}
                className="flex items-center gap-1.5 font-bold bg-transparent border-0 text-inherit cursor-pointer p-0"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showSMA ? 'bg-amber-500' : 'bg-gray-600'}`} />
                <span>SMA</span>
              </button>
              <input
                type="number"
                min="2"
                max="200"
                value={smaPeriod ?? 15}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 2 && val <= 200) setSmaPeriod(val);
                }}
                className="w-8 text-center bg-white/5 border border-white/10 rounded font-mono text-[9px] text-white focus:outline-none focus:ring-1 focus:ring-amber-500 py-0"
                title="SMA Period (2 to 200)"
                onClick={e => e.stopPropagation()}
              />
            </div>

            {/* Bollinger Bands Control Button with custom input */}
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition border-solid ${
              showBB 
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-md' 
                : 'bg-[#07090e] border-white/5 text-gray-400'
            }`}>
              <button
                onClick={() => setShowBB(!showBB)}
                className="flex items-center gap-1.5 font-bold bg-transparent border-0 text-inherit cursor-pointer p-0"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showBB ? 'bg-purple-500' : 'bg-gray-600'}`} />
                <span>BB</span>
              </button>
              <input
                type="number"
                min="2"
                max="200"
                value={bbPeriod ?? 20}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 2 && val <= 200) setBbPeriod(val);
                }}
                className="w-8 text-center bg-white/5 border border-white/10 rounded font-mono text-[9px] text-white focus:outline-none focus:ring-1 focus:ring-purple-500 py-0"
                title="Bollinger Bands Period (2 to 200)"
                onClick={e => e.stopPropagation()}
              />
            </div>

            <button
              onClick={() => setShowSupertrend(!showSupertrend)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer border-solid ${
                showSupertrend 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold shadow-md' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showSupertrend ? 'bg-amber-400' : 'bg-gray-600'}`} />
              Supertrend (10,3)
            </button>

            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer border-solid ${
                showVWAP 
                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold shadow-md' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showVWAP ? 'bg-cyan-400' : 'bg-gray-600'}`} />
              VWAP
            </button>

            <button
              onClick={() => setShowEma50_200(!showEma50_200)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer border-solid ${
                showEma50_200 
                  ? 'bg-pink-500/10 border-pink-500/20 text-pink-400 font-bold shadow-md' 
                  : 'bg-[#07090e] border-white/5 hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showEma50_200 ? 'bg-pink-400' : 'bg-gray-600'}`} />
              EMA 50 & 200
            </button>

            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer border-solid ${
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
            <span>Interactive TradingView chart with advanced custom drawing indicators.</span>
          </div>
        </div>
      )}

      {/* Immersive Fullscreen Modal Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#060913] flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto md:overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between shrink-0 gap-4 bg-[#090c13] p-4 rounded-2xl border border-white/5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <Activity className={`w-5 h-5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'} animate-pulse`} />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-base font-bold text-white font-display leading-none">{activeAsset.symbol}</h3>
                  <span className="text-xs text-gray-400">{activeAsset.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-white font-mono leading-none">
                    ₹{activeAsset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{activeChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Timeframe Selector in expanded view */}
              <div className="flex items-center bg-[#07090e] border border-white/5 p-1 rounded-xl">
                {(['1m', '5m', '15m', '1h', '1D'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all border-0 bg-transparent cursor-pointer ${
                      timeframe === tf 
                        ? 'bg-sky-500 text-white shadow-md' 
                        : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Chart Type Selector in expanded view */}
              <div className="flex items-center bg-[#07090e] border border-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setChartType('candle')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-0 bg-transparent cursor-pointer ${
                    chartType === 'candle' 
                      ? 'bg-sky-500 text-white shadow-md' 
                      : 'text-gray-500 hover:text-white'
                    }`}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-0 bg-transparent cursor-pointer ${
                    chartType === 'area' 
                      ? 'bg-sky-500 text-white shadow-md' 
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Area
                </button>
              </div>

              {/* Minimize Chart Button */}
              <button 
                onClick={() => setIsExpanded(false)}
                title="Minimize / Exit Fullscreen (Esc)"
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-950/20 animate-none"
              >
                <Minimize2 className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Minimize Chart</span>
                <span className="hidden xl:inline text-[10px] text-rose-400/50 ml-1 font-mono">ESC</span>
              </button>
            </div>
          </div>
          
          {/* Main Fullscreen workspace */}
          <div className="flex-1 min-h-0 bg-[#090c13] rounded-2xl border border-white/5 overflow-hidden">
            <TradingViewChart 
              symbol={activeAsset.symbol} 
              timeframe={timeframe} 
              candles={candles}
              chartType={chartType}
              showEMA={showEMA}
              showSMA={showSMA}
              showBB={showBB}
              showVolume={showVolume}
              isPositive={isPositive}
              isExpanded={true}
              onCloseExpanded={() => setIsExpanded(false)}
              showSupertrend={showSupertrend}
              showVWAP={showVWAP}
              showEma50_200={showEma50_200}
            />
          </div>
        </div>
      )}
    </div>
  );
};
