/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useMainApp, useMarketData } from '../store';
import { 
  Shield, Calculator, ArrowRight, RefreshCw, CheckCircle2
} from 'lucide-react';

export const RiskManagement: React.FC = React.memo(() => {
  const { user } = useMainApp();
  const { instruments, futures, setSelectedAssetBySymbol } = useMarketData();

  const allAssets = React.useMemo(() => [...(instruments || []), ...(futures || [])], [instruments, futures]);
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [customBalance, setCustomBalance] = useState<number>(user?.virtualBalance || 500000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [stopLossMode, setStopLossMode] = useState<'price' | 'percent'>('percent');
  const [stopLossValue, setStopLossValue] = useState<number>(2);
  const [targetPrice, setTargetPrice] = useState<string>('');

  const allAssetsRef = React.useRef(allAssets);
  useEffect(() => {
    allAssetsRef.current = allAssets;
  }, [allAssets]);

  useEffect(() => {
    if (!selectedSymbol && allAssets.length > 0) {
      setSelectedSymbol(prev => prev || (allAssets[0]?.symbol || ''));
    }
  }, [selectedSymbol, allAssets.length]);

  useEffect(() => {
    if (!selectedSymbol) return;
    const asset = allAssetsRef.current.find(a => a.symbol === selectedSymbol);
    if (asset) {
      setEntryPrice(asset.ltp);
      if (stopLossMode === 'percent') {
        setStopLossValue(2);
      } else {
        setStopLossValue(Number((asset.ltp * 0.98).toFixed(2)));
      }
    }
  }, [selectedSymbol, stopLossMode]);

  if (!user) return null;

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

  let riskRewardRatio = '—';
  const targetNum = parseFloat(targetPrice);
  if (targetNum && targetNum > 0 && riskPerShare > 0) {
    const rewardPerShare = Math.abs(targetNum - entryPrice);
    riskRewardRatio = `1 : ${(rewardPerShare / riskPerShare).toFixed(1)}`;
  }

  const handleInitiateTrade = () => {
    setSelectedAssetBySymbol(selectedSymbol);
    localStorage.setItem('risk_calc_qty', recommendedQuantity.toString());
    localStorage.setItem('risk_calc_sl', finalStopLossPrice.toFixed(2));
    if (targetPrice && targetNum > 0) localStorage.setItem('risk_calc_target', targetNum.toFixed(2));
    
    const event = new CustomEvent('navigate_tab', { detail: 'trade' });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Position Size Calculator */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Position Size Calculator</h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">Calculate exact share quantity based on your stop-loss and risk limit</p>
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
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl transition cursor-pointer"
              title="Reset calculator"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block">Instrument</label>
              <select
                value={selectedSymbol}
                onChange={e => setSelectedSymbol(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {allAssets.map(asset => (
                  <option key={asset.symbol} value={asset.symbol} className="bg-white dark:bg-[#0c1020]">
                    {asset.symbol} (₹{asset.ltp.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase flex justify-between">
                <span>Account Capital (₹)</span>
                <button 
                  onClick={() => setCustomBalance(user.virtualBalance)}
                  className="text-blue-600 dark:text-sky-400 hover:underline text-[10px]"
                >
                  Use Current
                </button>
              </label>
              <input
                type="number"
                value={customBalance}
                onChange={e => setCustomBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block">
                Risk Per Trade ({riskPercent}%)
              </label>
              <div className="flex gap-1.5">
                {[0.5, 1, 1.5, 2].map(p => (
                  <button
                    key={p}
                    onClick={() => setRiskPercent(p)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                      riskPercent === p 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block">Stop-Loss Type</label>
              <div className="grid grid-cols-2 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setStopLossMode('percent')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    stopLossMode === 'percent' ? 'bg-white dark:bg-[#12182d] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Percent (%)
                </button>
                <button
                  onClick={() => setStopLossMode('price')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    stopLossMode === 'price' ? 'bg-white dark:bg-[#12182d] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Price (₹)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block">
                {stopLossMode === 'percent' ? 'Stop-Loss Distance (%)' : 'Stop-Loss Price (₹)'}
              </label>
              <input
                type="number"
                step={stopLossMode === 'percent' ? '0.25' : '0.5'}
                value={stopLossValue}
                onChange={e => setStopLossValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase block">Target Price (Optional ₹)</label>
              <input
                type="number"
                placeholder={`e.g. ${(entryPrice * 1.04).toFixed(0)}`}
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-slate-50 dark:bg-[#12182d] border border-slate-200/70 dark:border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Recommended Qty</span>
                <span className="text-base font-bold text-blue-600 dark:text-sky-400 font-mono">
                  {recommendedQuantity} <span className="text-[10px] font-sans text-slate-400">shares</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Max Risk (₹)</span>
                <span className="text-base font-bold text-red-500 font-mono">
                  ₹{maxRiskCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Capital Needed</span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  ₹{totalCapitalRequired.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Reward : Risk</span>
                <span className="text-base font-bold text-emerald-500 font-mono">{riskRewardRatio}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleInitiateTrade}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Trade {selectedSymbol} with {recommendedQuantity} Qty <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Essential Risk Rules */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" /> Core Risk Rules
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">1% – 2% Max Risk</h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Never risk more than 2% of your total account balance on a single trade.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Always Set a Stop-Loss</h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Define your exit price before entering a trade to prevent emotional losses.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Aim for 1:2 Risk-Reward</h4>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Target at least twice your risk distance so you stay profitable even with a 45% win rate.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
