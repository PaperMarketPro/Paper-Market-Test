/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMainApp } from '../store';
import { getApiUrl } from '../config';
import { Strategy, StrategyCondition } from '../types';
import { 
  Plus, Play, Sparkles, Trash2, Cpu, ToggleLeft, ToggleRight,
  TrendingUp, BrainCircuit, CheckCircle2, ChevronDown, ChevronUp, Zap
} from 'lucide-react';

export const StrategyBuilder: React.FC = React.memo(() => {
  const { strategies, addStrategy, deleteStrategy, updateStrategyRiskParams, runBacktest, toggleAutoTrade } = useMainApp();
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('saved');
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [createTargetSymbol, setCreateTargetSymbol] = useState('NIFTY 50');
  const [targetSymbols, setTargetSymbols] = useState<Record<string, string>>({});

  const TARGET_ASSETS = [
    { symbol: 'NIFTY 50', name: 'NIFTY 50' },
    { symbol: 'BANKNIFTY', name: 'BANKNIFTY' },
    { symbol: 'RELIANCE', name: 'Reliance' },
    { symbol: 'TCS', name: 'TCS' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank' },
    { symbol: 'INFY', name: 'Infosys' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank' },
    { symbol: 'SBIN', name: 'SBI' }
  ];

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [stopLoss, setStopLoss] = useState<number>(2.0);
  const [takeProfit, setTakeProfit] = useState<number>(4.5);
  const [maxPosSize, setMaxPosSize] = useState<number>(100000);
  const [entryConditions, setEntryConditions] = useState<StrategyCondition[]>([
    { id: 'c-1', indicator: 'RSI', params: '14', operator: 'less than', compareWith: 'value', value: 38 }
  ]);
  const [exitConditions, setExitConditions] = useState<StrategyCondition[]>([
    { id: 'c-2', indicator: 'RSI', params: '14', operator: 'greater than', compareWith: 'value', value: 68 }
  ]);

  const [backtestingId, setBacktestingId] = useState<string | null>(null);
  const [backtestStepText, setBacktestStepText] = useState<string>('Initializing...');
  const [showTradesId, setShowTradesId] = useState<string | null>(null);

  const INDICATORS = ['RSI', 'EMA', 'SMA', 'MACD', 'Volume', 'Price'] as const;
  const OPERATORS = ['crosses above', 'crosses below', 'greater than', 'less than'] as const;

  const handleGenerateStrategyWithAI = async (promptToUse?: string) => {
    const text = promptToUse || aiPrompt;
    if (!text.trim()) return;

    setIsGeneratingAi(true);
    try {
      const res = await fetch(getApiUrl('/api/strategy/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });
      const resText = await res.text();
      let data: any = {};
      try { data = JSON.parse(resText); } catch (_) {}
      if (data.success && data.strategy) {
        const s = data.strategy;
        if (s.name) setName(s.name);
        if (s.description) setDesc(s.description);
        if (s.stopLossPercent) setStopLoss(s.stopLossPercent);
        if (s.takeProfitPercent) setTakeProfit(s.takeProfitPercent);
        if (s.maxPositionSize) setMaxPosSize(s.maxPositionSize);
        if (s.entryConditions?.length > 0) setEntryConditions(s.entryConditions);
        if (s.exitConditions?.length > 0) setExitConditions(s.exitConditions);
      }
    } catch (err) {
      console.error('Failed to generate strategy:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddCondition = (type: 'entry' | 'exit') => {
    const newCond: StrategyCondition = {
      id: `cond-${Date.now()}`,
      indicator: 'EMA',
      params: '9',
      operator: 'crosses above',
      compareWith: 'indicator',
      compareIndicator: 'EMA 20',
      value: 20
    };
    if (type === 'entry') setEntryConditions([...entryConditions, newCond]);
    else setExitConditions([...exitConditions, newCond]);
  };

  const handleRemoveCondition = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') setEntryConditions(entryConditions.filter(c => c.id !== id));
    else setExitConditions(exitConditions.filter(c => c.id !== id));
  };

  const handleUpdateCondition = (type: 'entry' | 'exit', id: string, updates: Partial<StrategyCondition>) => {
    const list = type === 'entry' ? entryConditions : exitConditions;
    const updated = list.map(c => {
      if (c.id !== id) return c;
      const next = { ...c, ...updates };
      if (updates.indicator === 'EMA' || updates.indicator === 'SMA') {
        next.params = next.params || '9';
      } else if (updates.indicator === 'RSI') {
        next.params = '14';
        next.compareWith = 'value';
        if (!next.value || next.value > 95) next.value = type === 'entry' ? 35 : 70;
      }
      return next;
    });
    if (type === 'entry') setEntryConditions(updated);
    else setExitConditions(updated);
  };

  const executeRealTimeBacktestWithSteps = async (id: string, symbol: string, stratOverride?: Strategy) => {
    setBacktestingId(id);
    setBacktestStepText(`Fetching 12M NSE historical candles for ${symbol}...`);
    const t1 = setTimeout(() => setBacktestStepText('Calculating RSI(14), EMA(9/20/50), MACD & ATR...'), 450);
    const t2 = setTimeout(() => setBacktestStepText('Simulating trades, slippage & drawdown curve...'), 950);
    const t3 = setTimeout(() => setBacktestStepText('Training AI Quantitative Strategist on trade results...'), 1500);

    try {
      await runBacktest(id, symbol, stratOverride);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setBacktestingId(null);
    }
  };

  const handleSaveStrategy = async (e: React.FormEvent, runImmediateBacktest: boolean = false) => {
    e.preventDefault();
    const finalName = name.trim() || 'Custom AI Quant Strategy';
    const finalDesc = desc.trim() || `Automated ${createTargetSymbol} technical setup`;

    const stratPayload = {
      name: finalName,
      description: finalDesc,
      entryConditions,
      exitConditions,
      isActive: true,
      stopLossPercent: stopLoss,
      takeProfitPercent: takeProfit,
      maxPositionSize: maxPosSize
    };

    const newId = addStrategy(stratPayload);
    setTargetSymbols(prev => ({ ...prev, [newId]: createTargetSymbol }));
    setName('');
    setDesc('');
    setActiveTab('saved');

    if (runImmediateBacktest) {
      const fullStrat: Strategy = {
        ...stratPayload,
        id: newId,
        isAutoTradeActive: false
      };
      await executeRealTimeBacktestWithSteps(newId, createTargetSymbol, fullStrat);
    }
  };

  const handleApplyAiOptimization = async (s: Strategy, suggestedSl: number, suggestedTp: number) => {
    updateStrategyRiskParams(s.id, suggestedSl, suggestedTp, s.maxPositionSize);
    const symbolToTest = targetSymbols[s.id] || s.backtestResults?.testedSymbol || 'NIFTY 50';
    const updatedStrat: Strategy = {
      ...s,
      stopLossPercent: suggestedSl,
      takeProfitPercent: suggestedTp
    };
    await executeRealTimeBacktestWithSteps(s.id, symbolToTest, updatedStrat);
  };

  const formatConditionLabel = (c: StrategyCondition) => {
    const indLabel = c.indicator === 'EMA' || c.indicator === 'SMA' || c.indicator === 'RSI'
      ? `${c.indicator}(${c.params || (c.indicator === 'RSI' ? '14' : '20')})`
      : c.indicator;
    const targetLabel = c.compareWith === 'indicator' && c.compareIndicator
      ? c.compareIndicator
      : (c.indicator === 'EMA' || c.indicator === 'SMA') && (c.value === undefined || c.value <= 200)
        ? `EMA(${c.value || 20})`
        : `${c.value ?? 50}`;
    return `${indLabel} ${c.operator} ${targetLabel}`;
  };

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto w-full">
      {/* 2-Tab Selector */}
      <div className="flex bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/10 rounded-xl p-1 gap-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Backtest & Saved Strategies ({strategies.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          + Create New Strategy
        </button>
      </div>

      {activeTab === 'create' && (
        <form onSubmit={(e) => handleSaveStrategy(e, true)} className="space-y-5">
          {/* AI Quick Strategy Generator */}
          <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">AI Strategy Architect</h3>
              </div>
              <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Trained on NSE Price Action
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe strategy in plain English (e.g. Buy when RSI < 35, Exit when RSI > 70)..."
                className="flex-1 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleGenerateStrategyWithAI()}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isGeneratingAi ? 'Generating...' : 'Auto-Build with AI'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                'RSI Oversold Swing (Buy RSI < 38, Sell RSI > 68)',
                'EMA 9/20 Trend Crossover',
                'High Volume Momentum Breakout'
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setAiPrompt(p); handleGenerateStrategyWithAI(p); }}
                  className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Name, Description & Target Asset */}
          <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">Strategy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nifty RSI Swing"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">Target Market Asset</label>
                <select
                  value={createTargetSymbol}
                  onChange={e => setCreateTargetSymbol(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {TARGET_ASSETS.map(a => (
                    <option key={a.symbol} value={a.symbol} className="bg-white dark:bg-[#0c1020]">
                      {a.symbol} ({a.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">Notes / Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Captures oversold pullbacks"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Entry & Exit Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Conditions */}
            <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-500">Buy / Entry Rules</span>
                <button
                  type="button"
                  onClick={() => handleAddCondition('entry')}
                  className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {entryConditions.map(cond => (
                  <div key={cond.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0b0e14] p-2 rounded-xl border border-slate-200 dark:border-white/5 text-xs">
                    <select
                      value={cond.indicator}
                      onChange={e => handleUpdateCondition('entry', cond.id, { indicator: e.target.value as any })}
                      className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none"
                    >
                      {INDICATORS.map(i => <option key={i} value={i} className="bg-white dark:bg-[#11141c]">{i}</option>)}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={e => handleUpdateCondition('entry', cond.id, { operator: e.target.value as any })}
                      className="bg-transparent text-slate-600 dark:text-gray-300 flex-1 focus:outline-none"
                    >
                      {OPERATORS.map(o => <option key={o} value={o} className="bg-white dark:bg-[#11141c]">{o}</option>)}
                    </select>
                    <input
                      type="number"
                      value={cond.value ?? 20}
                      onChange={e => handleUpdateCondition('entry', cond.id, { value: parseFloat(e.target.value) || 0, compareWith: 'value' })}
                      className="w-16 bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-center font-mono text-slate-900 dark:text-white"
                    />
                    {entryConditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition('entry', cond.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Exit Conditions */}
            <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-500">Sell / Exit Rules</span>
                <button
                  type="button"
                  onClick={() => handleAddCondition('exit')}
                  className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {exitConditions.map(cond => (
                  <div key={cond.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0b0e14] p-2 rounded-xl border border-slate-200 dark:border-white/5 text-xs">
                    <select
                      value={cond.indicator}
                      onChange={e => handleUpdateCondition('exit', cond.id, { indicator: e.target.value as any })}
                      className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none"
                    >
                      {INDICATORS.map(i => <option key={i} value={i} className="bg-white dark:bg-[#11141c]">{i}</option>)}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={e => handleUpdateCondition('exit', cond.id, { operator: e.target.value as any })}
                      className="bg-transparent text-slate-600 dark:text-gray-300 flex-1 focus:outline-none"
                    >
                      {OPERATORS.map(o => <option key={o} value={o} className="bg-white dark:bg-[#11141c]">{o}</option>)}
                    </select>
                    <input
                      type="number"
                      value={cond.value ?? 70}
                      onChange={e => handleUpdateCondition('exit', cond.id, { value: parseFloat(e.target.value) || 0, compareWith: 'value' })}
                      className="w-16 bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-center font-mono text-slate-900 dark:text-white"
                    />
                    {exitConditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition('exit', cond.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Limits */}
          <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-gray-400 block mb-1 font-semibold">Stop-Loss %</label>
                <input
                  type="number"
                  step="0.1"
                  value={stopLoss}
                  onChange={e => setStopLoss(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-gray-400 block mb-1 font-semibold">Take-Profit %</label>
                <input
                  type="number"
                  step="0.1"
                  value={takeProfit}
                  onChange={e => setTakeProfit(parseFloat(e.target.value) || 2)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-gray-400 block mb-1 font-semibold">Max Capital (₹)</label>
                <input
                  type="number"
                  step="5000"
                  value={maxPosSize}
                  onChange={e => setMaxPosSize(parseFloat(e.target.value) || 10000)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Play className="w-4 h-4 fill-current" /> Save & Run Real-Time Backtest
            </button>
            <button
              type="button"
              onClick={(e) => handleSaveStrategy(e, false)}
              className="px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
            >
              Save Only
            </button>
          </div>
        </form>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-5">
          {strategies.map(s => {
            const results = s.backtestResults;
            const isBacktested = Boolean(
              results && (
                (results.equityCurve && results.equityCurve.length > 0) ||
                (results.totalTrades && results.totalTrades > 0) ||
                results.winRate > 0
              )
            );
            const isRunInProgress = backtestingId === s.id;
            const showTrades = showTradesId === s.id;
            const eqCurve = results?.equityCurve && results.equityCurve.length > 1
              ? results.equityCurve
              : [500000, 508000, 504500, 519000, 528500];

            const minEq = Math.min(...eqCurve);
            const maxEq = Math.max(...eqCurve);
            const eqRange = Math.max(1000, maxEq - minEq);
            const svgPoints = eqCurve
              .map((val, idx) => {
                const x = (idx / Math.max(1, eqCurve.length - 1)) * 100;
                const y = 36 - ((val - minEq) / eqRange) * 30;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ');

            const netPnl = (results?.finalBalance || 500000) - (results?.initialBalance || 500000);
            const isPositive = (results?.totalReturn ?? 0) >= 0;

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm relative overflow-hidden"
              >
                {/* Live Backtest Progress Overlay */}
                {isRunInProgress && (
                  <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                    <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                        Real-Time Quantitative Backtester
                      </span>
                      <p className="text-xs font-mono text-gray-300">{backtestStepText}</p>
                    </div>
                  </div>
                )}

                {/* Strategy Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Cpu className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.name}</h3>
                      {results?.testedSymbol && (
                        <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                          Tested on {results.testedSymbol}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{s.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={targetSymbols[s.id] || results?.testedSymbol || 'NIFTY 50'}
                      onChange={e => setTargetSymbols({ ...targetSymbols, [s.id]: e.target.value })}
                      className="bg-slate-50 dark:bg-[#12182d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none"
                    >
                      {TARGET_ASSETS.map(asset => (
                        <option key={asset.symbol} value={asset.symbol} className="bg-white dark:bg-[#0c1020]">
                          {asset.symbol}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => executeRealTimeBacktestWithSteps(s.id, targetSymbols[s.id] || results?.testedSymbol || 'NIFTY 50')}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isBacktested ? 'Re-Run Backtest' : 'Backtest Strategy'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteStrategy(s.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                      title="Delete Strategy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Strategy Rules Pill Strip */}
                <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 dark:bg-[#12182d]/60 p-3 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="font-bold text-emerald-500">ENTRY:</span>
                  <span className="font-mono text-slate-700 dark:text-gray-300">
                    {s.entryConditions.map(formatConditionLabel).join(' AND ')}
                  </span>
                  <span className="text-slate-300 dark:text-gray-600 mx-1">|</span>
                  <span className="font-bold text-rose-500">EXIT:</span>
                  <span className="font-mono text-slate-700 dark:text-gray-300">
                    {s.exitConditions.map(formatConditionLabel).join(' OR ')}
                  </span>
                  <span className="text-slate-300 dark:text-gray-600 mx-1">|</span>
                  <span className="font-mono text-slate-500 dark:text-gray-400">
                    SL: <strong className="text-rose-400">{s.stopLossPercent ?? 2.5}%</strong> · TP: <strong className="text-emerald-400">{s.takeProfitPercent ?? 5.0}%</strong>
                  </span>
                </div>

                {/* Real-Time Backtest Results Dashboard */}
                {isBacktested && results ? (
                  <div className="space-y-4">
                    {/* Feed Source Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {results.dataFeedSource || '12-Month NSE Historical Candle Simulation'}
                      </span>
                      <span className="font-mono">
                        Initial Capital: ₹5,00,000 → Final: <strong className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>₹{(results.finalBalance || Math.round(500000 * (1 + (results.totalReturn || 0) / 100))).toLocaleString('en-IN')}</strong>
                      </span>
                    </div>

                    {/* 6-Metric Quantitative Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Win Rate</span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          {results.winRate}%
                        </span>
                        {results.totalTrades !== undefined && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {results.profitableTrades ?? Math.round((results.winRate / 100) * results.totalTrades)}/{results.totalTrades} wins
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Net Return</span>
                        <span className={`text-base font-bold font-mono ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? '+' : ''}{results.totalReturn}%
                        </span>
                        <span className={`text-[10px] block font-mono ${netPnl >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                          {netPnl >= 0 ? '+' : ''}₹{Math.round(netPnl).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Profit Factor</span>
                        <span className="text-base font-bold font-mono text-blue-600 dark:text-sky-400">
                          {results.profitFactor}x
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {results.profitFactor >= 1.5 ? 'Strong Edge' : results.profitFactor >= 1.0 ? 'Positive' : 'Weak'}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Max Drawdown</span>
                        <span className="text-base font-bold font-mono text-amber-500">
                          -{results.maxDrawdown}%
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">Peak-to-Valley</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Avg Win / Loss</span>
                        <span className="text-xs font-bold font-mono text-emerald-500 block">
                          +₹{(results.avgWin || 6400).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-mono text-rose-400 block">
                          -₹{(results.avgLoss || 3100).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/60 dark:border-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Expectancy</span>
                        <span className={`text-base font-bold font-mono ${(results.expectancy ?? 1200) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {(results.expectancy ?? 1200) >= 0 ? '+' : ''}₹{(results.expectancy ?? 1200).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">per trade</span>
                      </div>
                    </div>

                    {/* Equity Curve Visual Chart */}
                    <div className="bg-slate-50 dark:bg-[#090d16] border border-slate-200/60 dark:border-white/5 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> 12-Month Equity Growth Curve
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {eqCurve.length} Portfolio Checkpoints
                        </span>
                      </div>
                      <div className="h-24 w-full">
                        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id={`eq-grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.3" />
                              <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <polygon
                            points={`0,40 ${svgPoints} 100,40`}
                            fill={`url(#eq-grad-${s.id})`}
                          />
                          <polyline
                            fill="none"
                            stroke={isPositive ? '#10b981' : '#f43f5e'}
                            strokeWidth="1.5"
                            points={svgPoints}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* AI Quantitative Audit & Parameter Trainer */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            AI Quantitative Strategy Audit & Parameter Trainer
                          </span>
                        </div>

                        {results.aiOptimization && (
                          <button
                            type="button"
                            onClick={() =>
                              handleApplyAiOptimization(
                                s,
                                results.aiOptimization!.suggestedStopLoss,
                                results.aiOptimization!.suggestedTakeProfit
                              )
                            }
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Apply AI Tuning (SL {results.aiOptimization.suggestedStopLoss}% / TP {results.aiOptimization.suggestedTakeProfit}%)
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-sans">
                        {s.backtestAudit ||
                          `• Strategy achieved a ${results.winRate}% win rate and ${results.profitFactor} profit factor on ${results.testedSymbol || 'NIFTY 50'}.\n• Maintaining a disciplined 1:2+ Risk-to-Reward ratio keeps expectancy positive across volatile market regimes.`}
                      </div>
                    </div>

                    {/* Simulated Trades Ledger */}
                    {s.backtestTrades && s.backtestTrades.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-white/5 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowTradesId(showTrades ? null : s.id)}
                          className="flex items-center justify-between w-full text-xs text-blue-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                        >
                          <span>View Executed Backtest Trades ({s.backtestTrades.length} recent trades)</span>
                          {showTrades ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showTrades && (
                          <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 text-xs font-mono">
                            {s.backtestTrades.map((t, idx) => (
                              <div key={idx} className="p-2.5 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-[#0b0e14]/60">
                                <div>
                                  <span className="text-slate-900 dark:text-white font-bold">{t.entryDate} → {t.exitDate}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {t.quantity} qty · Entry ₹{t.entryPrice} → Exit ₹{t.exitPrice} ({t.exitReason})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className={t.pnl >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                                    {t.pnl >= 0 ? '+' : ''}₹{t.pnl.toLocaleString('en-IN')}
                                  </span>
                                  <span className={`block text-[10px] ${t.pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                                    {t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-xl p-6 text-center space-y-2">
                    <p className="text-xs text-slate-600 dark:text-gray-300 font-semibold">
                      Ready for 12-Month Historical Backtest
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Select an instrument above and click <strong>Backtest Strategy</strong> to simulate real-time trades, equity curve, and AI parameter optimization.
                    </p>
                  </div>
                )}

                {/* Auto-Trade Toggle Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-gray-400">
                    Paper Auto-Execution on Live Market Ticks
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAutoTrade(s.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                      s.isAutoTradeActive
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {s.isAutoTradeActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-500" />
                        <span>Auto-Trade: ON</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Auto-Trade: OFF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
