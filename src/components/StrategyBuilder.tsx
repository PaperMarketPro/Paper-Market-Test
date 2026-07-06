/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { StrategyCondition, Strategy } from '../types';
import { 
  Plus, Play, Sparkles, Trash2, ShieldCheck, 
  TrendingUp, Cpu, X, Check, HelpCircle, Eye, 
  FileText, Activity, AlertCircle, ToggleLeft, ToggleRight,
  BarChart2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

export const StrategyBuilder: React.FC = () => {
  const { strategies, addStrategy, runBacktest, toggleAutoTrade, updateStrategyRiskParams } = useApp();
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  
  // Create New Strategy State
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

  // Backtest triggering visual state
  const [backtestingId, setBacktestingId] = useState<string | null>(null);
  const [showLedgerId, setShowLedgerId] = useState<string | null>(null);
  const [showAuditId, setShowAuditId] = useState<string | null>(null);
  const [showAnalyticsId, setShowAnalyticsId] = useState<string | null>(null);

  const INDICATORS = ['RSI', 'EMA', 'SMA', 'MACD', 'Volume', 'Price'] as const;
  const OPERATORS = ['crosses above', 'crosses below', 'greater than', 'less than'] as const;

  const handleAddCondition = (type: 'entry' | 'exit') => {
    const newCond: StrategyCondition = {
      id: `cond-${Date.now()}`,
      indicator: 'EMA',
      params: '20',
      operator: 'crosses above',
      compareWith: 'value',
      value: 100
    };

    if (type === 'entry') {
      setEntryConditions([...entryConditions, newCond]);
    } else {
      setExitConditions([...exitConditions, newCond]);
    }
  };

  const handleRemoveCondition = (type: 'entry' | 'exit', id: string) => {
    if (type === 'entry') {
      setEntryConditions(entryConditions.filter(c => c.id !== id));
    } else {
      setExitConditions(exitConditions.filter(c => c.id !== id));
    }
  };

  const handleUpdateCondition = (type: 'entry' | 'exit', id: string, updates: Partial<StrategyCondition>) => {
    const list = type === 'entry' ? entryConditions : exitConditions;
    const updated = list.map(c => (c.id === id ? { ...c, ...updates } : c));
    if (type === 'entry') {
      setEntryConditions(updated);
    } else {
      setExitConditions(updated);
    }
  };

  const handleSaveStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

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

    // Reset Form
    setName('');
    setDesc('');
    setStopLoss(2.5);
    setTakeProfit(5.0);
    setMaxPosSize(50000);
    setEntryConditions([{ id: 'c-1', indicator: 'RSI', params: '14', operator: 'less than', compareWith: 'value', value: 30 }]);
    setExitConditions([{ id: 'c-2', indicator: 'RSI', params: '14', operator: 'greater than', compareWith: 'value', value: 70 }]);
    setActiveTab('saved');
  };

  const handleTriggerBacktest = async (id: string) => {
    setBacktestingId(id);
    await runBacktest(id);
    setBacktestingId(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header tab switch */}
      <div className="flex border-b border-white/5 gap-4">
        {[
          { key: 'create', label: 'Create Custom Logic' },
          { key: 'saved', label: `My saved Strategies (${strategies.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-sm font-semibold transition relative cursor-pointer ${
              activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="strategyTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <form onSubmit={handleSaveStrategy} className="space-y-6 max-w-lg mx-auto font-sans">
          {/* Metadata Card info */}
          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Strategy Title</label>
              <input
                type="text"
                required
                placeholder="e.g. RSI Momentum Scalp"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/2 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-gray-700 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Objective Description</label>
              <input
                type="text"
                placeholder="e.g. Scalping Nifty breakouts when momentum is oversold."
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="w-full bg-white/2 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-gray-700 transition"
              />
            </div>
          </div>

          {/* ENTRY CONDITIONS BLOCK */}
          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block font-bold">1. Entry Triggers (BUY Conditions)</span>
                <span className="text-[10px] text-gray-500">All rules listed below must match simultaneously</span>
              </div>
              <button
                type="button"
                onClick={() => handleAddCondition('entry')}
                className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {entryConditions.map(cond => (
                <div key={cond.id} className="bg-white/2 border border-white/5 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <select
                    value={cond.indicator}
                    onChange={e => handleUpdateCondition('entry', cond.id, { indicator: e.target.value as any })}
                    className="bg-[#11141c] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {INDICATORS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>

                  <select
                    value={cond.operator}
                    onChange={e => handleUpdateCondition('entry', cond.id, { operator: e.target.value as any })}
                    className="bg-[#11141c] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 col-span-2"
                  >
                    {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>

                  <div className="flex gap-1.5 items-center justify-between">
                    <input
                      type="number"
                      value={cond.value || ''}
                      onChange={e => handleUpdateCondition('entry', cond.id, { value: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-[#11141c] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition('entry', cond.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EXIT CONDITIONS BLOCK */}
          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-red-400 uppercase tracking-widest block font-bold">2. Exit Triggers (SELL Conditions)</span>
                <span className="text-[10px] text-gray-500">Any active rule below will trigger a market exit</span>
              </div>
              <button
                type="button"
                onClick={() => handleAddCondition('exit')}
                className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {exitConditions.map(cond => (
                <div key={cond.id} className="bg-white/2 border border-white/5 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <select
                    value={cond.indicator}
                    onChange={e => handleUpdateCondition('exit', cond.id, { indicator: e.target.value as any })}
                    className="bg-[#11141c] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {INDICATORS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>

                  <select
                    value={cond.operator}
                    onChange={e => handleUpdateCondition('exit', cond.id, { operator: e.target.value as any })}
                    className="bg-[#11141c] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 col-span-2"
                  >
                    {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>

                  <div className="flex gap-1.5 items-center justify-between">
                    <input
                      type="number"
                      value={cond.value || ''}
                      onChange={e => handleUpdateCondition('exit', cond.id, { value: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-[#11141c] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition('exit', cond.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RISK MANAGEMENT BLOCK */}
          <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 space-y-4 font-sans">
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block font-bold">3. Risk Management Parameters (Auto-Trading)</span>
              <span className="text-[10px] text-gray-500">Set guards to protect your virtual capital during automated strategy execution.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-500 uppercase block">Stop-Loss (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={stopLoss}
                    onChange={e => setStopLoss(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/2 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-gray-500 font-mono">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-500 uppercase block">Take-Profit (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="500"
                    value={takeProfit}
                    onChange={e => setTakeProfit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/2 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-gray-500 font-mono">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-gray-500 uppercase block">Max Position Size</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-gray-500 font-mono">₹</span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    max="10000000"
                    value={maxPosSize}
                    onChange={e => setMaxPosSize(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/2 border border-white/5 rounded-xl pl-6 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
          >
            Save Strategy definition
          </button>
        </form>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4 max-w-lg mx-auto font-sans">
          {strategies.map(s => {
            const results = s.backtestResults;
            const isBacktested = results && results.winRate > 0;
            const isRunInProgress = backtestingId === s.id;
            const showLedger = showLedgerId === s.id;
            const showAudit = showAuditId === s.id;
            const showAnalytics = showAnalyticsId === s.id;

            // Map equityCurve numbers into simple chart objects
            const chartData = results?.equityCurve?.map((val, idx) => ({
              point: `P${idx + 1}`,
              Balance: val
            })) || [];

            const winsCount = s.backtestTrades?.filter(t => t.pnl > 0).length || 0;
            const lossesCount = s.backtestTrades?.filter(t => t.pnl <= 0).length || 0;
            const totalTrades = s.backtestTrades?.length || 0;
            const calculatedWinRate = totalTrades > 0 ? ((winsCount / totalTrades) * 100).toFixed(1) : '0';

            const winsTotal = s.backtestTrades?.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) || 0;
            const lossesTotal = s.backtestTrades?.filter(t => t.pnl <= 0).reduce((sum, t) => sum + Math.abs(t.pnl), 0) || 0;

            const avgWin = winsCount > 0 ? (winsTotal / winsCount).toFixed(0) : '0';
            const avgLoss = lossesCount > 0 ? (lossesTotal / lossesCount).toFixed(0) : '0';

            // Chronological Bar Chart Data
            const tradesBarData = s.backtestTrades?.map((t, idx) => ({
              trade: `T${idx + 1}`,
              pnl: t.pnl,
              pnlPercent: t.pnlPercent || 0,
              direction: t.direction,
              exitDate: t.exitDate
            })) || [];

            const winLossPieData = [
              { name: 'Wins', value: winsCount, color: '#10b981' },
              { name: 'Losses', value: lossesCount, color: '#ef4444' }
            ];

            return (
              <div key={s.id} className="bg-[#11141c] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
                {isRunInProgress && (
                  <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-white p-4">
                    <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mb-3" />
                    <p className="text-xs font-mono font-bold animate-pulse text-sky-400">CONNECTING TO GEMINI walk 12M SIMULATION BACKTESTER...</p>
                    <span className="text-[10px] text-gray-500 mt-1">Generating 365 daily candles and calculating technical vectors...</span>
                  </div>
                )}

                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-sky-400" /> {s.name}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.description}</p>
                  </div>

                  {/* Auto-Trading Switch Toggle */}
                  <div className="text-right shrink-0">
                    <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">AI AUTO-TRADE</span>
                    <button
                      onClick={() => toggleAutoTrade(s.id)}
                      className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                    >
                      {s.isAutoTradeActive ? (
                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-1 rounded-xl">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-white/2 border border-white/10 text-gray-400 text-[10px] px-2 py-1 rounded-xl hover:border-white/20">
                          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                          <span>Suspended</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Condition Chips summaries */}
                <div className="space-y-1.5 bg-white/1 p-3 rounded-xl border border-white/5 text-[10px] text-gray-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-emerald-400 uppercase">Buy criteria:</span>
                    {s.entryConditions.map((c, i) => (
                      <span key={i} className="bg-[#0b0e14] border border-white/5 px-2 py-0.5 rounded text-white">
                        {c.indicator} ({c.params || 'val'}) {c.operator} {c.value || c.compareIndicator}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/5 mt-1.5">
                    <span className="font-bold text-red-400 uppercase">Sell criteria:</span>
                    {s.exitConditions.map((c, i) => (
                      <span key={i} className="bg-[#0b0e14] border border-white/5 px-2 py-0.5 rounded text-white">
                        {c.indicator} ({c.params || 'val'}) {c.operator} {c.value || c.compareIndicator}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risk Management Settings for Auto-Trading */}
                <div className="bg-white/1 border border-white/5 rounded-xl p-3.5 space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px] flex items-center gap-1.5 uppercase font-mono tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Risk Controls (Auto-Trading)
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">Simulated execution parameters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 block uppercase font-mono">Stop-Loss (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="50"
                        defaultValue={s.stopLossPercent ?? 2.5}
                        id={`sl-${s.id}`}
                        className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 block uppercase font-mono">Take-Profit (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="500"
                        defaultValue={s.takeProfitPercent ?? 5.0}
                        id={`tp-${s.id}`}
                        className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <button
                        onClick={() => {
                          const slInput = document.getElementById(`sl-${s.id}`) as HTMLInputElement;
                          const tpInput = document.getElementById(`tp-${s.id}`) as HTMLInputElement;
                          if (slInput && tpInput) {
                            updateStrategyRiskParams(
                              s.id,
                              parseFloat(slInput.value) || 2.5,
                              parseFloat(tpInput.value) || 5.0
                            );
                          }
                        }}
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl py-1.5 font-bold text-[10px] transition cursor-pointer text-center h-[34px] uppercase tracking-wider font-mono"
                      >
                        Apply Controls
                      </button>
                    </div>
                  </div>

                  {/* Settings status indicator */}
                  <div className="text-[9px] text-gray-500 flex justify-between pt-1 font-mono border-t border-white/2">
                    <span>Active Trigger: S/L at {s.stopLossPercent ?? 2.5}%</span>
                    <span>T/P target: {s.takeProfitPercent ?? 5.0}%</span>
                  </div>
                </div>

                {/* Result Block details */}
                {isBacktested ? (
                  <div className="space-y-3">
                    <div className="bg-sky-500/5 border border-sky-500/10 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-sky-400" />
                          <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest font-bold">12-Month Backtest Report Card</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500">Initial: ₹5,00,000</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="space-y-0.5">
                          <span className="block text-[8px] text-gray-500 uppercase">Win-Rate</span>
                          <span className="block text-sm font-bold text-white tabular-numbers">{results?.winRate}%</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[8px] text-gray-500 uppercase">Sim. Return</span>
                          <span className={`block text-sm font-bold tabular-numbers ${results?.totalReturn && results.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {results?.totalReturn && results.totalReturn >= 0 ? '+' : ''}{results?.totalReturn}%
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[8px] text-gray-500 uppercase">Max Drawdown</span>
                          <span className="block text-sm font-bold text-white tabular-numbers">{results?.maxDrawdown}%</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[8px] text-gray-500 uppercase">Profit Factor</span>
                          <span className="block text-sm font-bold text-white tabular-numbers">{results?.profitFactor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Miniature Equity curve Chart */}
                    <div className="h-20 bg-white/1 border border-white/5 rounded-xl p-2 relative">
                      <span className="absolute top-1 left-2 text-[8px] font-mono text-gray-500 uppercase z-10">12-Month Equity Curve</span>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#11141c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            labelStyle={{ color: '#9ca3af', fontSize: '9px', fontFamily: 'monospace' }}
                            itemStyle={{ color: '#0ea5e9', fontSize: '10px', fontFamily: 'monospace' }}
                          />
                          <Area type="monotone" dataKey="Balance" stroke="#0ea5e9" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBalance)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Accordion buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* 1. Show Audit Report button */}
                      {s.backtestAudit && (
                        <button
                          onClick={() => { setShowAuditId(showAudit ? null : s.id); setShowLedgerId(null); setShowAnalyticsId(null); }}
                          className={`flex-1 min-w-[90px] py-1.5 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1 transition cursor-pointer border ${
                            showAudit 
                              ? 'bg-sky-500 text-white border-sky-400' 
                              : 'bg-white/2 text-gray-400 border-white/5 hover:text-white hover:bg-white/4'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Quant Audit
                        </button>
                      )}

                      {/* 2. Show Trades Ledger button */}
                      {s.backtestTrades && s.backtestTrades.length > 0 && (
                        <button
                          onClick={() => { setShowLedgerId(showLedger ? null : s.id); setShowAuditId(null); setShowAnalyticsId(null); }}
                          className={`flex-1 min-w-[90px] py-1.5 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1 transition cursor-pointer border ${
                            showLedger 
                              ? 'bg-sky-500 text-white border-sky-400' 
                              : 'bg-white/2 text-gray-400 border-white/5 hover:text-white hover:bg-white/4'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Simulation Ledger
                        </button>
                      )}

                      {/* 3. Performance Analytics button */}
                      {s.backtestTrades && s.backtestTrades.length > 0 && (
                        <button
                          onClick={() => { setShowAnalyticsId(showAnalytics ? null : s.id); setShowAuditId(null); setShowLedgerId(null); }}
                          className={`flex-1 min-w-[90px] py-1.5 rounded-lg text-[10px] font-mono flex items-center justify-center gap-1 transition cursor-pointer border ${
                            showAnalytics 
                              ? 'bg-sky-500 text-white border-sky-400' 
                              : 'bg-white/2 text-gray-400 border-white/5 hover:text-white hover:bg-white/4'
                          }`}
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-sky-400" /> Visual Analytics
                        </button>
                      )}
                    </div>

                    {/* AI Audit text block */}
                    <AnimatePresence>
                      {showAudit && s.backtestAudit && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-[#0b0e14] border border-sky-500/20 rounded-xl p-4 text-[11px] text-gray-300 leading-relaxed font-sans space-y-2 mt-2">
                            <span className="text-[9px] font-mono text-sky-400 uppercase tracking-widest block font-bold border-b border-white/5 pb-1 mb-2">Gemini AI Audit Report</span>
                            <p className="whitespace-pre-line text-xs font-light tracking-wide">{s.backtestAudit}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Ledger Trades table */}
                    <AnimatePresence>
                      {showLedger && s.backtestTrades && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-3 text-[10px] text-gray-400 space-y-2 mt-2">
                            <span className="text-[9px] font-mono text-white uppercase tracking-widest block font-bold border-b border-white/5 pb-1">Last 15 Walktrades ledger</span>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse font-mono text-[9px]">
                                <thead>
                                  <tr className="border-b border-white/5 text-gray-500">
                                    <th className="py-1">Date</th>
                                    <th className="py-1">Type</th>
                                    <th className="py-1">Entry</th>
                                    <th className="py-1">Exit</th>
                                    <th className="py-1 text-right">P&L</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {s.backtestTrades.map((t, idx) => (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/1">
                                      <td className="py-1 text-gray-500">{t.exitDate}</td>
                                      <td className="py-1 text-white font-bold">{t.direction}</td>
                                      <td className="py-1">₹{t.entryPrice.toFixed(0)}</td>
                                      <td className="py-1">₹{t.exitPrice.toFixed(0)}</td>
                                      <td className={`py-1 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {t.pnl >= 0 ? '+' : ''}₹{t.pnl.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Performance Visualizer Analytics Panel */}
                    <AnimatePresence>
                      {showAnalytics && s.backtestTrades && s.backtestTrades.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-4 text-[10px] text-gray-400 space-y-4 mt-2 font-mono">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-[9px] text-sky-400 uppercase tracking-widest block font-bold">12-Month Performance Analytics Dashboard</span>
                              <span className="text-[8px] text-gray-500 font-mono">Historical Simulation Data</span>
                            </div>

                            {/* Stat Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                              <div className="bg-white/2 p-2 rounded-xl border border-white/5 flex flex-col justify-between">
                                <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1">Trades</span>
                                <span className="block text-xs font-bold text-white">{totalTrades}</span>
                              </div>
                              <div className="bg-white/2 p-2 rounded-xl border border-white/5 flex flex-col justify-between">
                                <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1 text-emerald-400">Avg. Win</span>
                                <span className="block text-xs font-bold text-emerald-400">₹{parseFloat(avgWin).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="bg-white/2 p-2 rounded-xl border border-white/5 flex flex-col justify-between">
                                <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1 text-red-400">Avg. Loss</span>
                                <span className="block text-xs font-bold text-red-400">-₹{parseFloat(avgLoss).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="bg-white/2 p-2 rounded-xl border border-white/5 flex flex-col justify-between">
                                <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1">Win Rate</span>
                                <span className="block text-xs font-bold text-white">{calculatedWinRate}%</span>
                              </div>
                            </div>

                            {/* Gross Profit and Loss summary bars */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10 flex justify-between items-center px-3">
                                <span className="text-[8px] text-emerald-500/70 uppercase">Gross Profit</span>
                                <span className="text-xs font-bold text-emerald-400">₹{winsTotal.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="bg-red-500/5 p-2 rounded-xl border border-red-500/10 flex justify-between items-center px-3">
                                <span className="text-[8px] text-red-500/70 uppercase">Gross Loss</span>
                                <span className="text-xs font-bold text-red-400">-₹{lossesTotal.toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            {/* Two-Column Chart Layout */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Chronological Trade Bar Chart */}
                              <div className="space-y-1 bg-white/1 border border-white/5 p-2.5 rounded-xl">
                                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Trade P&L Chronology</span>
                                <div className="h-32 w-full pt-1">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={tradesBarData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                      <XAxis dataKey="trade" stroke="#4b5563" fontSize={7} tickLine={false} />
                                      <YAxis stroke="#4b5563" fontSize={7} tickLine={false} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: '#11141c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#9ca3af', fontSize: '8px', fontFamily: 'monospace' }}
                                        itemStyle={{ fontSize: '9px', fontFamily: 'monospace' }}
                                        formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'P&L']}
                                      />
                                      <Bar dataKey="pnl">
                                        {tradesBarData.map((entry, index) => (
                                          <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.pnl >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'} 
                                            stroke={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                                            strokeWidth={1}
                                          />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Donut Chart representing Win/Loss balance */}
                              <div className="space-y-1 bg-white/1 border border-white/5 p-2.5 rounded-xl flex flex-col justify-between">
                                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Win vs Loss Split</span>
                                <div className="h-24 w-full flex items-center justify-center relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={winLossPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={20}
                                        outerRadius={30}
                                        paddingAngle={3}
                                        dataKey="value"
                                      >
                                        {winLossPieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ backgroundColor: '#11141c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '9px', fontFamily: 'monospace', color: '#fff' }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-[7px] text-gray-500 uppercase">Ratio</span>
                                    <span className="text-[10px] font-bold text-emerald-400">{calculatedWinRate}%</span>
                                  </div>
                                </div>
                                <div className="flex justify-center gap-2 text-[8px] mt-1.5 pt-1.5 border-t border-white/5">
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-gray-400">Wins ({winsCount})</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    <span className="text-gray-400">Losses ({lossesCount})</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/1 border border-white/5 rounded-xl text-gray-500 text-xs">
                    Not backtested yet. Run historical simulation below to generate the AI audit.
                  </div>
                )}

                {/* Trigger Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerBacktest(s.id)}
                    className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold py-2.5 rounded-xl text-xs transition border border-sky-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> Run 12-Month Historical Simulation
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAutoTrade(s.id)}
                    className={`font-bold py-2.5 rounded-xl text-xs transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                      s.isAutoTradeActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5'
                    }`}
                  >
                    {s.isAutoTradeActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Auto Trade: Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-gray-500" />
                        <span>Auto Trade: Disabled</span>
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
};
