/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../store';
import { 
  Shield, Calculator, Sliders, Info, Sparkles, TrendingUp, 
  Coins, AlertTriangle, ArrowRight, RefreshCw, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { Instrument } from '../types';

export const RiskManagement: React.FC = () => {
  const { user, instruments, futures, setSelectedAssetBySymbol } = useApp();
  if (!user) return null;

  // Available assets
  const allAssets = [...instruments, ...futures];
  
  // State variables for position size calculator
  const [selectedSymbol, setSelectedSymbol] = useState<string>(allAssets[0]?.symbol || '');
  const [entryPrice, setEntryPrice] = useState<number>(allAssets[0]?.ltp || 100);
  const [customBalance, setCustomBalance] = useState<number>(user.virtualBalance);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [stopLossMode, setStopLossMode] = useState<'price' | 'percent'>('percent');
  const [stopLossValue, setStopLossValue] = useState<number>(2); // 2% or ₹ price
  const [targetPrice, setTargetPrice] = useState<string>('');

  // Drawdown Simulator state
  const [simRiskPercent, setSimRiskPercent] = useState<number>(2);
  const [simBalance, setSimBalance] = useState<number>(100000);

  // Sync selected asset ltp
  useEffect(() => {
    const asset = allAssets.find(a => a.symbol === selectedSymbol);
    if (asset) {
      setEntryPrice(asset.ltp);
      // Set a reasonable stop loss value based on price if mode is price
      if (stopLossMode === 'price') {
        setStopLossValue(Number((asset.ltp * 0.98).toFixed(2)));
      }
    }
  }, [selectedSymbol]);

  // Recalculate price if stopLossMode changes
  useEffect(() => {
    const asset = allAssets.find(a => a.symbol === selectedSymbol);
    if (asset) {
      if (stopLossMode === 'percent') {
        setStopLossValue(2);
      } else {
        setStopLossValue(Number((asset.ltp * 0.98).toFixed(2)));
      }
    }
  }, [stopLossMode]);

  // Calculations for position size
  const totalBalance = customBalance || user.virtualBalance;
  const maxRiskCapital = (totalBalance * riskPercent) / 100;
  
  let finalStopLossPrice = 0;
  let riskPerShare = 0;

  if (stopLossMode === 'percent') {
    finalStopLossPrice = entryPrice * (1 - stopLossValue / 100);
    riskPerShare = entryPrice * (stopLossValue / 100);
  } else {
    finalStopLossPrice = stopLossValue;
    riskPerShare = Math.max(0.01, Math.abs(entryPrice - stopLossValue));
  }

  const recommendedQuantity = riskPerShare > 0 ? Math.floor(maxRiskCapital / riskPerShare) : 0;
  const totalCapitalRequired = recommendedQuantity * entryPrice;
  const leverageRatio = totalBalance > 0 ? (totalCapitalRequired / totalBalance).toFixed(2) : '0.00';

  // Risk to reward calculation
  let riskRewardRatio = 'N/A';
  const targetNum = parseFloat(targetPrice);
  if (targetNum && targetNum > 0 && riskPerShare > 0) {
    const rewardPerShare = Math.abs(targetNum - entryPrice);
    riskRewardRatio = `1 : ${(rewardPerShare / riskPerShare).toFixed(1)}`;
  }

  // Pre-configured trade jump
  const handleInitiateTrade = () => {
    setSelectedAssetBySymbol(selectedSymbol);
    // We can save calculations in localStorage or pass them through to TradeScreen.
    // Let's store in localStorage for TradeScreen to pick up on mount!
    localStorage.setItem('risk_calc_qty', recommendedQuantity.toString());
    localStorage.setItem('risk_calc_sl', finalStopLossPrice.toFixed(2));
    if (targetPrice) localStorage.setItem('risk_calc_target', targetNum.toFixed(2));
    
    // Trigger navigation by searching for navigation callback or setting state (via dispatch / click)
    // We can simulate navigating to 'trade' tab by triggering a custom window event
    const event = new CustomEvent('navigate_tab', { detail: 'trade' });
    window.dispatchEvent(event);
  };

  // Drawdown math
  const getDrawdownSeries = (risk: number, startBal: number) => {
    let bal = startBal;
    const series = [];
    for (let i = 1; i <= 10; i++) {
      const lost = bal * (risk / 100);
      bal -= lost;
      series.push({ trade: i, remaining: bal, lost });
    }
    return series;
  };

  const simSeries = getDrawdownSeries(simRiskPercent, simBalance);
  const totalDrawdownPercent = (((simBalance - simSeries[9].remaining) / simBalance) * 100).toFixed(1);

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto w-full">
      {/* Title Header Banner */}
      <div className="bg-gradient-to-r from-[#0d1527] to-[#0c1020] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-40 h-40 text-sky-400" />
        </div>
        
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider w-fit">
            <ShieldAlert className="w-3.5 h-3.5" /> Capital Protection Suite
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Risk Management & Position Sizing</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Professional quantitative models to insulate your capital from ruin. Keep emotional revenge sizing at bay by standardizing risk coefficients based on your active equity curves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: POSITION SIZE CALCULATOR */}
        <div className="lg:col-span-7 bg-[#0b0e14] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Dynamic Sizing Assistant</h3>
                <p className="text-[10px] text-gray-500">Calculate recommended exposure in real-time</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setCustomBalance(user.virtualBalance);
                setRiskPercent(1);
                setStopLossValue(2);
                setStopLossMode('percent');
                setTargetPrice('');
              }}
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition"
              title="Reset parameters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input: Asset Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Select Asset</label>
              <select
                value={selectedSymbol}
                onChange={e => setSelectedSymbol(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 transition"
              >
                {allAssets.map(asset => (
                  <option key={asset.symbol} value={asset.symbol} className="bg-[#0c1020]">
                    {asset.symbol} (₹{asset.ltp.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Input: Account Balance */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block flex justify-between">
                <span>Trading Account Balance</span>
                <button 
                  onClick={() => setCustomBalance(user.virtualBalance)}
                  className="text-sky-400 hover:underline text-[9px]"
                >
                  Use Live
                </button>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs text-gray-500 font-mono">₹</span>
                <input
                  type="number"
                  value={customBalance}
                  onChange={e => setCustomBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input: Risk Per Trade % */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block flex justify-between">
                <span>Risk Per Trade: {riskPercent}%</span>
              </label>
              <div className="flex gap-2">
                {[0.5, 1, 1.5, 2].map(p => (
                  <button
                    key={p}
                    onClick={() => setRiskPercent(p)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
                      riskPercent === p 
                        ? 'bg-sky-500 text-white shadow' 
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="0.25"
                max="10"
                step="0.25"
                value={riskPercent}
                onChange={e => setRiskPercent(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-500 mt-2"
              />
            </div>

            {/* Input: Stop Loss Toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Stop-Loss Config</label>
              <div className="grid grid-cols-2 bg-white/5 rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setStopLossMode('percent')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition ${
                    stopLossMode === 'percent' ? 'bg-white/5 text-white shadow' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Percent (%)
                </button>
                <button
                  onClick={() => setStopLossMode('price')}
                  className={`py-1 text-[10px] font-bold rounded-lg transition ${
                    stopLossMode === 'price' ? 'bg-white/5 text-white shadow' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  Price (₹)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input: Stop Loss Value */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                {stopLossMode === 'percent' ? 'Stop-Loss percentage below Entry' : 'Stop-Loss Price Trigger (₹)'}
              </label>
              <div className="relative">
                {stopLossMode === 'percent' && (
                  <span className="absolute right-3.5 top-3.5 text-xs text-gray-500 font-mono">%</span>
                )}
                {stopLossMode === 'price' && (
                  <span className="absolute left-3.5 top-3.5 text-xs text-gray-500 font-mono">₹</span>
                )}
                <input
                  type="number"
                  step={stopLossMode === 'percent' ? '0.25' : '0.1'}
                  value={stopLossValue}
                  onChange={e => setStopLossValue(parseFloat(e.target.value) || 0)}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono ${
                    stopLossMode === 'price' ? 'pl-8 pr-4' : 'px-4'
                  }`}
                />
              </div>
            </div>

            {/* Input: Optional Profit Target */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Target Profit Price (Optional ₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs text-gray-500 font-mono">₹</span>
                <input
                  type="number"
                  placeholder="e.g. ₹ price"
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sizing Outputs Panel */}
          <div className="bg-[#12182d] border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-white/5 pb-2">RECOMMENDED ALLOCATION</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-gray-400 font-mono uppercase block">Max Risk Capital</span>
                <span className="text-sm font-bold text-red-400 font-mono">₹{maxRiskCapital.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-gray-400 font-mono uppercase block">Risk Per Share</span>
                <span className="text-sm font-bold text-white font-mono">₹{riskPerShare.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-gray-400 font-mono uppercase block">Target Qty</span>
                <span className="text-sm font-bold text-sky-400 font-mono">{recommendedQuantity} <span className="text-[10px] text-gray-500 font-sans">units</span></span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-gray-400 font-mono uppercase block">Total Margin Req.</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">₹{totalCapitalRequired.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-3 text-[11px] text-gray-400">
              <div className="flex justify-between items-center bg-white/2 p-2 rounded-lg">
                <span>Account Leverage Ratio:</span>
                <span className={`font-mono font-bold ${parseFloat(leverageRatio) > 1.5 ? 'text-amber-500' : 'text-gray-300'}`}>
                  {leverageRatio}x
                </span>
              </div>
              <div className="flex justify-between items-center bg-white/2 p-2 rounded-lg">
                <span>Calculated R:R Ratio:</span>
                <span className="font-mono font-bold text-emerald-400">{riskRewardRatio}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleInitiateTrade}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/15 group"
          >
            LAUNCH PRE-SIZED TICKET <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Right Column: RUIN MATHEMATICS & DRILL DOWNS */}
        <div className="lg:col-span-5 space-y-8">
          {/* DRAWDOWN SIMULATOR */}
          <div className="bg-[#0b0e14] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Ruin Probability Simulator
              </h3>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                See how a streak of 10 consecutive trading losses drains your equity curve depending on your trade risk.
              </p>
            </div>

            <div className="space-y-4 bg-white/2 rounded-xl p-3 border border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Simulate Trade Risk:</span>
                <span className="font-bold text-amber-500 font-mono">{simRiskPercent}% per trade</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 5, 10].map(val => (
                  <button
                    key={val}
                    onClick={() => setSimRiskPercent(val)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
                      simRiskPercent === val 
                        ? 'bg-amber-500 text-white shadow' 
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* List of losses */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
              {simSeries.map(item => (
                <div key={item.trade} className="flex justify-between items-center text-[10px] border-b border-white/3 py-1 font-mono">
                  <span className="text-gray-500">Loss #{item.trade}</span>
                  <span className="text-red-400">-₹{item.lost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  <span className="text-gray-300">₹{item.remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>

            <div className="bg-red-500/10 border border-red-500/15 rounded-xl p-3 flex justify-between items-center">
              <span className="text-[10px] text-red-300 uppercase tracking-wider font-bold">10 Loss Total Drawdown:</span>
              <span className="text-sm font-bold font-mono text-red-400">{totalDrawdownPercent}%</span>
            </div>
            
            <p className="text-[9px] text-gray-500 font-sans leading-relaxed">
              *With <span className="text-red-400 font-semibold font-mono">10%</span> trade risk, a streak of 10 losses wipes out <span className="text-red-400 font-semibold font-mono">65.1%</span> of your starting account. With <span className="text-emerald-400 font-semibold font-mono">1%</span>, you only lose <span className="text-emerald-400 font-semibold font-mono">9.6%</span>, keeping your drawdown shallow and easy to recover.
            </p>
          </div>

          {/* RISK LAWS / CORE PRINCIPLES CARD */}
          <div className="bg-[#0b0e14] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Capital Preservation Axioms
            </h3>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5 bg-white/2 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">The 2% Golden Ceiling</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Never risk more than 2% of capital on any trade. For beginner accounts, a maximum risk of 1% is strongly recommended.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white/2 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">No Stop-Loss, No Trade</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Always establish stop-losses on the chart before taking entry. A trade without a designated exit plan is gambling, not trading.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white/2 p-2.5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Minimum 1:2 Risk/Reward Ratio</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">The reward potential must always be at least twice the stop loss amount. This enables a profitable strategy even with a sub-50% win rate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
