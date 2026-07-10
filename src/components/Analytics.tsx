import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, Award, ArrowUpRight, 
  ArrowDownRight, RefreshCw, BarChart2, PieChart, Activity, User, 
  Target, ShieldCheck, Heart, Sparkles, Brain, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';

export const Analytics: React.FC = () => {
  const { positions, journals, user } = useApp();
  const [timeframe, setTimeframe] = useState<'All' | 'Month' | 'Week'>('All');
  const [assetFilter, setAssetFilter] = useState<'All' | 'Equity' | 'FnO'>('All');

  // Filter closed positions
  const closedTrades = useMemo(() => {
    let filtered = positions.filter(p => p.status === 'Closed');

    // Time filter
    if (timeframe === 'Month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(t => new Date(t.closedTimestamp || t.timestamp) >= thirtyDaysAgo);
    } else if (timeframe === 'Week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.closedTimestamp || t.timestamp) >= sevenDaysAgo);
    }

    // Asset filter helper
    const isDerivatives = (pos: any) => {
      const sym = pos.symbol.toUpperCase();
      return sym.includes('CE') || sym.includes('PE') || 
             ['NIFTY 50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'].includes(sym);
    };

    if (assetFilter === 'Equity') {
      filtered = filtered.filter(t => !isDerivatives(t));
    } else if (assetFilter === 'FnO') {
      filtered = filtered.filter(t => isDerivatives(t));
    }

    // Sort chronologically by close time (or open time fallback)
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.closedTimestamp || a.timestamp).getTime();
      const timeB = new Date(b.closedTimestamp || b.timestamp).getTime();
      return timeA - timeB;
    });
  }, [positions, timeframe, assetFilter]);

  // Core metrics calculations
  const metrics = useMemo(() => {
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => (t.realizedPnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.realizedPnl || 0) < 0);
    const breakevenTrades = closedTrades.filter(t => (t.realizedPnl || 0) === 0);

    const winRate = totalTrades > 0 ? Math.round((winningTrades.length / totalTrades) * 100) : 0;
    const netPnl = closedTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);

    const grossWin = closedTrades.reduce((sum, t) => sum + ((t.realizedPnl || 0) > 0 ? (t.realizedPnl || 0) : 0), 0);
    const grossLoss = closedTrades.reduce((sum, t) => sum + ((t.realizedPnl || 0) < 0 ? Math.abs(t.realizedPnl || 0) : 0), 0);
    const profitFactor = grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : (grossWin > 0 ? 99.9 : 0);

    const averageWin = winningTrades.length > 0 ? grossWin / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;

    // Drawdown Calculation
    const initialBalance = user?.initialBalance || 500000.00;
    let runningBalance = initialBalance;
    let peakBalance = initialBalance;
    let maxDrawdownVal = 0;

    closedTrades.forEach(t => {
      runningBalance += (t.realizedPnl || 0);
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance;
      }
      const dd = peakBalance - runningBalance;
      if (dd > maxDrawdownVal) {
        maxDrawdownVal = dd;
      }
    });

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      winRate,
      netPnl,
      grossWin,
      grossLoss,
      profitFactor,
      averageWin,
      averageLoss,
      expectancy,
      maxDrawdown: maxDrawdownVal
    };
  }, [closedTrades, user]);

  // Equity Curve Curve Data for AreaChart
  const equityCurveData = useMemo(() => {
    const initialBalance = user?.initialBalance || 500000.00;
    let runningBalance = initialBalance;
    
    const startNode = {
      name: 'Start',
      balance: initialBalance,
      pnl: 0,
      formattedPnl: '₹0.00'
    };

    const nodes = closedTrades.map((t, idx) => {
      runningBalance += (t.realizedPnl || 0);
      return {
        name: `Trade ${idx + 1}`,
        balance: runningBalance,
        pnl: t.realizedPnl || 0,
        formattedPnl: (t.realizedPnl || 0) >= 0 
          ? `+₹${(t.realizedPnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          : `-₹${Math.abs(t.realizedPnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      };
    });

    return [startNode, ...nodes];
  }, [closedTrades, user]);

  // Breakdown of Trades by Category (Long vs Short)
  const directionData = useMemo(() => {
    const longs = closedTrades.filter(t => t.direction === 'Long');
    const shorts = closedTrades.filter(t => t.direction === 'Short');

    const longWinRate = longs.length > 0 
      ? Math.round((longs.filter(t => (t.realizedPnl || 0) > 0).length / longs.length) * 100) 
      : 0;
    const shortWinRate = shorts.length > 0 
      ? Math.round((shorts.filter(t => (t.realizedPnl || 0) > 0).length / shorts.length) * 100) 
      : 0;

    const longNetPnl = longs.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);
    const shortNetPnl = shorts.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);

    return [
      { name: 'Long Position', count: longs.length, winRate: longWinRate, netPnl: longNetPnl },
      { name: 'Short Position', count: shorts.length, winRate: shortWinRate, netPnl: shortNetPnl }
    ];
  }, [closedTrades]);

  // Emotional analysis from journals correlation
  const psychologyInsights = useMemo(() => {
    // Correlate journals with closed trades to find PnL and Win Rate per Emotion
    const emotionStats: { [key: string]: { sumPnl: number; count: number; wins: number } } = {};

    journals.forEach(j => {
      // Find corresponding closed position if exists
      const relatedPos = positions.find(p => p.id === j.positionId && p.status === 'Closed');
      if (relatedPos && j.emotionTags) {
        j.emotionTags.forEach(emotion => {
          if (!emotionStats[emotion]) {
            emotionStats[emotion] = { sumPnl: 0, count: 0, wins: 0 };
          }
          const pnl = relatedPos.realizedPnl || 0;
          emotionStats[emotion].sumPnl += pnl;
          emotionStats[emotion].count += 1;
          if (pnl > 0) {
            emotionStats[emotion].wins += 1;
          }
        });
      }
    });

    return Object.entries(emotionStats).map(([emotion, stat]) => ({
      emotion,
      avgPnl: stat.sumPnl / stat.count,
      winRate: Math.round((stat.wins / stat.count) * 100),
      count: stat.count
    })).sort((a, b) => b.avgPnl - a.avgPnl);
  }, [journals, positions]);

  // Dynamic feedback text for emotions
  const cognitiveAdvice = useMemo(() => {
    if (psychologyInsights.length === 0) {
      return "Start logging your trades inside the AI Journal to unlock cognitive psychology insights and discover which mindsets generate your highest returns.";
    }

    const bestEmotion = psychologyInsights[0];
    const worstEmotion = psychologyInsights[psychologyInsights.length - 1];

    let advice = "";
    if (bestEmotion && bestEmotion.avgPnl > 0) {
      advice += `Your most profitable mindset is **${bestEmotion.emotion}** (Avg. Return: +₹${bestEmotion.avgPnl.toFixed(0)}), resulting in a stellar **${bestEmotion.winRate}% win rate**. `;
    }
    if (worstEmotion && worstEmotion.avgPnl < 0) {
      advice += `Conversely, trading under **${worstEmotion.emotion}** has been highly destructive, causing an average loss of **₹${Math.abs(worstEmotion.avgPnl).toFixed(0)}** per trade. We recommend enabling mental barriers or checking in with your AI Coach before trading during these emotional states.`;
    }

    return advice;
  }, [psychologyInsights]);

  // Format utility
  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto w-full" id="analytics-page">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Comprehensive real-time trading statistics, equity curve analysis, and cognitive journal correlations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {/* Time Filter */}
          <div className="flex items-center bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/5 rounded-xl p-1 text-xs">
            {(['All', 'Month', 'Week'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  timeframe === tf 
                    ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold shadow-sm' 
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf === 'All' ? 'All-Time' : tf === 'Month' ? '30 Days' : '7 Days'}
              </button>
            ))}
          </div>

          {/* Asset Class Filter */}
          <div className="flex items-center bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/5 rounded-xl p-1 text-xs">
            {(['All', 'Equity', 'FnO'] as const).map(ac => (
              <button
                key={ac}
                onClick={() => setAssetFilter(ac)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  assetFilter === ac 
                    ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold shadow-sm' 
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {ac === 'All' ? 'All Assets' : ac === 'Equity' ? 'Equity' : 'F&O'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" id="stats-grid">
        {/* Net PNL Card */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Net P&L</span>
            <div className={`p-1.5 rounded-xl ${metrics.netPnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl md:text-2xl font-extrabold tracking-tight font-mono leading-none ${
              metrics.netPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-rose-400'
            }`}>
              {formatCurrency(metrics.netPnl)}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-sans mt-1.5 block">Total realized return</span>
          </div>
          {/* Subtle colored accent glow */}
          <div className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full blur-2xl opacity-10 ${
            metrics.netPnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'
          }`} />
        </div>

        {/* Win Rate Card */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Win Rate</span>
            <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500 dark:text-sky-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none font-mono">
              {metrics.winRate}%
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-sans mt-1.5 block">
              {metrics.winningTrades}W / {metrics.losingTrades}L / {metrics.breakevenTrades}BE
            </span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-blue-500/10 blur-2xl opacity-10" />
        </div>

        {/* Profit Factor Card */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Profit Factor</span>
            <div className={`p-1.5 rounded-xl ${metrics.profitFactor >= 1.5 ? 'bg-emerald-500/10 text-emerald-500' : metrics.profitFactor >= 1.0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl md:text-2xl font-extrabold tracking-tight leading-none font-mono ${
              metrics.profitFactor >= 1.5 ? 'text-emerald-500' : metrics.profitFactor >= 1.0 ? 'text-blue-600 dark:text-sky-400' : 'text-red-500'
            }`}>
              {metrics.profitFactor}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-sans mt-1.5 block">Gross Win / Gross Loss</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-indigo-500/10 blur-2xl opacity-10" />
        </div>

        {/* Expectancy Card */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Expectancy</span>
            <div className="p-1.5 rounded-xl bg-violet-500/10 text-violet-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl md:text-2xl font-extrabold tracking-tight leading-none font-mono ${
              metrics.expectancy >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-rose-400'
            }`}>
              {formatCurrency(metrics.expectancy)}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-sans mt-1.5 block">Average P&L per trade</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-violet-500/10 blur-2xl opacity-10" />
        </div>

        {/* Total Trades Card */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Total Trades</span>
            <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none font-mono">
              {metrics.totalTrades}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-sans mt-1.5 block">Closed ledger entries</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-orange-500/10 blur-2xl opacity-10" />
        </div>

        {/* Max Drawdown Card */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Max Drawdown</span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 leading-none font-mono">
              -{formatCurrency(metrics.maxDrawdown)}
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-sans mt-1.5 block">Largest peak-to-trough drop</span>
          </div>
          <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-rose-500/10 blur-2xl opacity-10" />
        </div>
      </div>

      {/* Auxiliary Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Average Gain / Loss Breakdown */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between gap-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Gain & Loss Averages</h4>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-1 bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 dark:border-emerald-500/5 p-3 rounded-xl">
              <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wide flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Average Win
              </span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(metrics.averageWin)}
              </p>
            </div>
            <div className="space-y-1 bg-red-500/5 dark:bg-red-500/[0.02] border border-red-500/10 dark:border-red-500/5 p-3 rounded-xl">
              <span className="text-[9px] text-red-600 dark:text-rose-500 font-bold uppercase tracking-wide flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Average Loss
              </span>
              <p className="text-lg font-bold text-red-600 dark:text-rose-400 font-mono">
                {formatCurrency(metrics.averageLoss)}
              </p>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-gray-500 font-sans flex justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
            <span>Risk-to-Reward Ratio (Average)</span>
            <span className="font-bold font-mono text-slate-800 dark:text-white">
              1 : {metrics.averageLoss > 0 ? (metrics.averageWin / metrics.averageLoss).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        {/* Win/Loss Consistency Ratio */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Execution Ratio</h4>
            <span className="text-[10px] text-slate-400 dark:text-gray-500">Gross wins vs total loss</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold">
              <span className="text-emerald-500">Gross Profit (+{formatCurrency(metrics.grossWin)})</span>
              <span className="text-red-500">Gross Loss (-{formatCurrency(metrics.grossLoss)})</span>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
              {metrics.grossWin === 0 && metrics.grossLoss === 0 ? (
                <div className="w-full h-full bg-slate-300 dark:bg-white/10" />
              ) : (
                <>
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${(metrics.grossWin / (metrics.grossWin + metrics.grossLoss || 1)) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${(metrics.grossLoss / (metrics.grossWin + metrics.grossLoss || 1)) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-gray-500 font-sans">
              <span>Ratio: {metrics.grossWin === 0 && metrics.grossLoss === 0 ? '50% / 50%' : `${Math.round((metrics.grossWin / (metrics.grossWin + metrics.grossLoss || 1)) * 100)}% Win Volume / ${Math.round((metrics.grossLoss / (metrics.grossWin + metrics.grossLoss || 1)) * 100)}% Loss Volume`}</span>
              <span>PF: {metrics.profitFactor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capital Equity Growth Curve */}
      <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 shadow-sm" id="equity-curve">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              Simulated Capital Curve
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Chronological ledger growth including compound returns</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 dark:text-gray-500 block uppercase font-mono">Current Balance</span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(user?.virtualBalance || 500000.00)}
            </span>
          </div>
        </div>

        <div className="h-64 w-full text-xs">
          {equityCurveData.length <= 1 ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-gray-600 font-mono bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/5">
              Complete your first closed paper trade to visualize your performance curve.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={equityCurveData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0d" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  dx={-5}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const balanceVal = payload[0].value as number;
                      const changeVal = ((balanceVal - (user?.initialBalance || 500000.00)) / (user?.initialBalance || 500000.00)) * 100;
                      return (
                        <div className="bg-slate-900/90 dark:bg-[#090c16]/95 border border-white/10 backdrop-blur-md p-3 rounded-xl shadow-xl space-y-1">
                          <p className="text-[10px] font-bold text-gray-500 uppercase font-mono">{data.name}</p>
                          <p className="text-xs font-extrabold text-white font-mono">₹{balanceVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <span className={data.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {data.formattedPnl}
                            </span>
                            <span className="text-gray-500 font-mono">|</span>
                            <span className={changeVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {changeVal >= 0 ? '+' : ''}{changeVal.toFixed(2)}% Return
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Grid: Long vs Short Breakdown & Emotional Psychology Correlations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Direction Breakdown (Long vs Short) */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 md:col-span-1 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-indigo-500" />
              Direction Stats
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Performance index by position bias</p>
          </div>

          <div className="space-y-3.5">
            {directionData.map(dir => (
              <div key={dir.name} className="border border-slate-100 dark:border-white/5 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{dir.name}</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-semibold px-2 py-0.5 rounded-full">
                    {dir.count} Trade{dir.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase block font-mono">Win Rate</span>
                    <span className="font-bold text-slate-800 dark:text-white font-mono">{dir.winRate}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase block font-mono">Net Returns</span>
                    <span className={`font-bold font-mono ${dir.netPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {dir.netPnl >= 0 ? '+' : ''}{formatCurrency(dir.netPnl)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cognitive Journal Psychology Correlation */}
        <div className="bg-white dark:bg-[#0f121d] border border-slate-200/50 dark:border-white/5 rounded-2xl p-5 md:col-span-2 space-y-4 relative overflow-hidden">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-amber-500" />
              Mindset & Emotion Correlation
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Average trading results categorized by psychological mindset</p>
          </div>

          {psychologyInsights.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/5">
              <Sparkles className="w-6 h-6 text-amber-500 mb-2 animate-bounce" />
              <p className="text-xs text-slate-600 dark:text-gray-400 font-semibold">Ready to map your trading psychology?</p>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1 max-w-xs leading-normal">
                Simply attach mindset tags (FOMO, Patient, Disciplined) inside your AI Journal to generate correlation stats.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {psychologyInsights.map(item => {
                const isProfitable = item.avgPnl >= 0;
                return (
                  <div key={item.emotion} className="flex items-center justify-between border border-slate-100 dark:border-white/5 p-2.5 rounded-xl text-xs bg-slate-50/50 dark:bg-transparent">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        item.emotion === 'Disciplined' || item.emotion === 'Patient' 
                          ? 'bg-emerald-500' 
                          : item.emotion === 'FOMO' || item.emotion === 'Greedy' || item.emotion === 'Revenge'
                          ? 'bg-rose-500' 
                          : 'bg-amber-500'
                      }`} />
                      <span className="font-bold text-slate-950 dark:text-white">{item.emotion}</span>
                      <span className="text-[9px] text-slate-400 dark:text-gray-500 font-mono">({item.count} sample{item.count !== 1 ? 's' : ''})</span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[9px] text-slate-400 dark:text-gray-500 block">Win Rate</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-white">{item.winRate}%</span>
                      </div>
                      <div className="min-w-[80px]">
                        <span className="text-[9px] text-slate-400 dark:text-gray-500 block">Avg. Returns</span>
                        <span className={`font-mono font-bold ${isProfitable ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isProfitable ? '+' : ''}{item.avgPnl.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Advisor Banner */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3.5 flex gap-3 items-start">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] text-blue-600 dark:text-sky-400 uppercase font-mono font-bold tracking-wider">AI Mindset Advisor</span>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: cognitiveAdvice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
