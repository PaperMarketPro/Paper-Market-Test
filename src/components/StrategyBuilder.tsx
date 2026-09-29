/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useMainApp } from '../store';
import { getApiUrl } from '../config';
import { StrategyCondition } from '../types';
import { 
  Plus, Play, Sparkles, Trash2, Cpu, ToggleLeft, ToggleRight
} from 'lucide-react';

export const StrategyBuilder: React.FC = React.memo(() => {
  const { strategies, addStrategy, deleteStrategy, runBacktest, toggleAutoTrade } = useMainApp();
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
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
  const [stopLoss, setStopLoss] = useState<number>(2.5);
  const [takeProfit, setTakeProfit] = useState<number>(5.0);
  const [maxPosSize, setMaxPosSize] = useState<number>(50000);
  const [entryConditions, setEntryConditions] = useState<StrategyCondition[]>([
    { id: 'c-1', indicator: 'RSI', params: '14', operator: 'less than', compareWith: 'value', value: 30 }
  ]);
  const [exitConditions, setExitConditions] = useState<StrategyCondition[]>([
    { id: 'c-2', indicator: 'RSI', params: '14', operator: 'greater than', compareWith: 'value', value: 70 }
  ]);

  const [backtestingId, setBacktestingId] = useState<string | null>(null);
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
      params: '20',
      operator: 'crosses above',
      compareWith: 'value',
      value: 100
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
    const updated = list.map(c => (c.id === id ? { ...c, ...updates } : c));
    if (type === 'entry') setEntryConditions(updated);
    else setExitConditions(updated);
  };

  const handleSaveStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addStrategy({
      name,
      description: desc,
      entryConditions,
      exitConditions,
      isActive: true,
      stopLossPercent: stopLoss,
      takeProfitPercent: takeProfit,
      maxPositionSize: maxPosSize
    });

    setName('');
    setDesc('');
    setActiveTab('saved');
  };

  const handleTriggerBacktest = async (id: string) => {
    setBacktestingId(id);
    const symbolToTest = targetSymbols[id] || 'NIFTY 50';
    await runBacktest(id, symbolToTest);
    setBacktestingId(null);
  };

  return (
    <div className="space-y-5 pb-20 max-w-4xl mx-auto w-full">
      {/* Simple 2-Tab Selector */}
      <div className="flex bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-xl p-1 gap-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'create'
              ? 'bg-blue-600 dark:bg-sky-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Create Strategy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'saved'
              ? 'bg-blue-600 dark:bg-sky-600 text-white shadow-sm'
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Saved Strategies ({strategies.length})
        </button>
      </div>

      {activeTab === 'create' && (
        <form onSubmit={handleSaveStrategy} className="space-y-5">
          {/* AI Quick Builder */}
          <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Quick AI Strategy Builder</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe rules (e.g. Buy when RSI < 30, Sell when RSI > 70)..."
                className="flex-1 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => handleGenerateStrategyWithAI()}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="bg-blue-600 dark:bg-sky-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-50 shrink-0"
              >
                {isGeneratingAi ? 'Generating...' : 'Auto-Fill Rules'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                'RSI Oversold Bounce (RSI < 30)',
                'EMA Trend Crossover (EMA 5 > 20)',
                'Volume Breakout Scalp'
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setAiPrompt(p); handleGenerateStrategyWithAI(p); }}
                  className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 px-2.5 py-1 rounded-lg text-[11px] transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Name & Description */}
          <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">Strategy Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RSI Momentum Scalp"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 block mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. Buys oversold dips on Nifty"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Entry & Exit Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Conditions */}
            <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-500">Buy / Entry Rules</span>
                <button
                  type="button"
                  onClick={() => handleAddCondition('entry')}
                  className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
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
                      {INDICATORS.map(i => <option key={i} value={i} className="bg-[#11141c]">{i}</option>)}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={e => handleUpdateCondition('entry', cond.id, { operator: e.target.value as any })}
                      className="bg-transparent text-slate-600 dark:text-gray-300 flex-1 focus:outline-none"
                    >
                      {OPERATORS.map(o => <option key={o} value={o} className="bg-[#11141c]">{o}</option>)}
                    </select>
                    <input
                      type="number"
                      value={cond.value ?? 0}
                      onChange={e => handleUpdateCondition('entry', cond.id, { value: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-center font-mono text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition('entry', cond.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exit Conditions */}
            <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-500">Sell / Exit Rules</span>
                <button
                  type="button"
                  onClick={() => handleAddCondition('exit')}
                  className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20"
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
                      {INDICATORS.map(i => <option key={i} value={i} className="bg-[#11141c]">{i}</option>)}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={e => handleUpdateCondition('exit', cond.id, { operator: e.target.value as any })}
                      className="bg-transparent text-slate-600 dark:text-gray-300 flex-1 focus:outline-none"
                    >
                      {OPERATORS.map(o => <option key={o} value={o} className="bg-[#11141c]">{o}</option>)}
                    </select>
                    <input
                      type="number"
                      value={cond.value ?? 0}
                      onChange={e => handleUpdateCondition('exit', cond.id, { value: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-center font-mono text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition('exit', cond.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Limits */}
          <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
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

          <button
            type="submit"
            className="w-full bg-blue-600 dark:bg-sky-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition"
          >
            Save Strategy
          </button>
        </form>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map(s => {
            const results = s.backtestResults;
            const isBacktested = results && results.winRate > 0;
            const isRunInProgress = backtestingId === s.id;
            const showTrades = showTradesId === s.id;

            return (
              <div key={s.id} className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
                {isRunInProgress && (
                  <div className="absolute inset-0 bg-[#0b0e14]/90 z-10 flex flex-col items-center justify-center text-white p-4">
                    <div className="w-7 h-7 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mb-2" />
                    <p className="text-xs font-mono text-sky-400">Running 12-Month Backtest...</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                        <span>{s.name}</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{s.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteStrategy(s.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                      title="Delete Strategy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Clean Rules Summary */}
                  <div className="bg-slate-50 dark:bg-[#0b0e14] p-3 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs space-y-1.5">
                    <div>
                      <span className="font-bold text-emerald-500 mr-1.5">Buy:</span>
                      <span className="text-slate-700 dark:text-gray-300 font-mono">
                        {s.entryConditions.map(c => `${c.indicator} ${c.operator} ${c.value ?? ''}`).join(' & ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-rose-500 mr-1.5">Sell:</span>
                      <span className="text-slate-700 dark:text-gray-300 font-mono">
                        {s.exitConditions.map(c => `${c.indicator} ${c.operator} ${c.value ?? ''}`).join(' | ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 font-mono pt-1 border-t border-slate-200 dark:border-white/5">
                      SL: {s.stopLossPercent ?? 2.5}% · TP: {s.takeProfitPercent ?? 5.0}%
                    </div>
                  </div>

                  {/* Backtest Results */}
                  {isBacktested && (
                    <div className="bg-sky-500/5 border border-sky-500/15 p-3.5 rounded-xl space-y-2.5">
                      <div className="grid grid-cols-4 gap-2 text-center font-mono">
                        <div>
                          <span className="block text-[10px] text-gray-400">Win Rate</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{results?.winRate}%</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400">Return</span>
                          <span className={`text-xs font-bold ${(results?.totalReturn || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(results?.totalReturn || 0) >= 0 ? '+' : ''}{results?.totalReturn}%
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400">Drawdown</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{results?.maxDrawdown}%</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400">Profit Factor</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{results?.profitFactor}</span>
                        </div>
                      </div>

                      {s.backtestTrades && s.backtestTrades.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowTradesId(showTrades ? null : s.id)}
                            className="text-[11px] text-sky-400 hover:underline font-semibold"
                          >
                            {showTrades ? 'Hide Backtest Trades' : `View ${s.backtestTrades.length} Simulated Trades`}
                          </button>
                          {showTrades && (
                            <div className="mt-2 max-h-36 overflow-y-auto border-t border-white/10 pt-2 space-y-1 font-mono text-[10px]">
                              {s.backtestTrades.map((t, idx) => (
                                <div key={idx} className="flex justify-between text-gray-300">
                                  <span>{t.exitDate} ({t.direction})</span>
                                  <span className={t.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                    {t.pnl >= 0 ? '+' : ''}₹{t.pnl.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <select
                      value={targetSymbols[s.id] || 'NIFTY 50'}
                      onChange={e => setTargetSymbols({ ...targetSymbols, [s.id]: e.target.value })}
                      className="bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                    >
                      {TARGET_ASSETS.map(asset => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleTriggerBacktest(s.id)}
                      className="flex-1 bg-blue-600 dark:bg-sky-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Backtest
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleAutoTrade(s.id)}
                    className={`w-full font-semibold py-2 rounded-xl text-xs transition border flex items-center justify-center gap-1.5 ${
                      s.isAutoTradeActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/5'
                    }`}
                  >
                    {s.isAutoTradeActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Auto-Trade: Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Auto-Trade: Off</span>
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
