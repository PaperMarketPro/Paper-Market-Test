/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle, Check, Info } from 'lucide-react';
import { StockChart } from './StockChart';

interface TradeScreenProps {
  onSuccess: () => void;
}

export const TradeScreen: React.FC<TradeScreenProps> = React.memo(({ onSuccess }) => {
  const { selectedAsset, addOrder, user, isMarketOpen, enforceMarketHours } = useApp();
  const isTradingBlocked = enforceMarketHours && !isMarketOpen;
  
  // Ticket States
  const [direction, setDirection] = useState<'Buy' | 'Sell'>('Buy');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop-Loss'>('Market');
  const [qty, setQty] = useState<number>(50);
  const [limitPrice, setLimitPrice] = useState<string>(selectedAsset.ltp.toFixed(2));
  const [triggerPrice, setTriggerPrice] = useState<string>((selectedAsset.ltp * 0.99).toFixed(2));
  const [stopLoss, setStopLoss] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  
  // Sizing Planner States
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [customBalanceInput, setCustomBalanceInput] = useState<string>('');
  const [simSLPercent, setSimSLPercent] = useState<number>(2);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Sync price and load any pre-configured sizing from RiskManagement on asset change
  useEffect(() => {
    setLimitPrice(selectedAsset.ltp.toFixed(2));
    setTriggerPrice((selectedAsset.ltp * 0.99).toFixed(2));

    const preQty = localStorage.getItem('risk_calc_qty');
    const preSL = localStorage.getItem('risk_calc_sl');
    const preTarget = localStorage.getItem('risk_calc_target');

    if (preQty) {
      setQty(parseInt(preQty) || 50);
      localStorage.removeItem('risk_calc_qty');
    }
    if (preSL) {
      setStopLoss(preSL);
      localStorage.removeItem('risk_calc_sl');
    } else {
      setStopLoss('');
    }
    if (preTarget) {
      setTarget(preTarget);
      localStorage.removeItem('risk_calc_target');
    } else {
      setTarget('');
    }
  }, [selectedAsset.symbol]);

  const activePrice = orderType === 'Market' ? selectedAsset.ltp : parseFloat(limitPrice) || selectedAsset.ltp;
  
  // Position Sizing calculations
  const { plannerRecommendedQty, slPriceForSizing, hasFormSL, formSLVal, marginRequired, taxesAndCharges, plannerRiskCapital, plannerRiskPerShare, plannerRequiredMargin } = React.useMemo(() => {
    const userBalance = user?.virtualBalance || 500000;
    const plannerBalance = customBalanceInput ? (parseFloat(customBalanceInput) || userBalance) : userBalance;
    const riskCap = plannerBalance * (riskPercent / 100);
    
    const slVal = parseFloat(stopLoss);
    const formSLValid = !isNaN(slVal) && slVal > 0;
    
    const slPrice = formSLValid 
      ? slVal 
      : (direction === 'Buy' ? activePrice * (1 - simSLPercent / 100) : activePrice * (1 + simSLPercent / 100));
      
    const riskPerShare = Math.max(0.01, Math.abs(activePrice - slPrice));
    const recommendedQty = Math.max(1, Math.floor(riskCap / riskPerShare));
    const reqMargin = recommendedQty * activePrice;

    const marginReq = activePrice * qty;
    const taxes = Number((marginReq * 0.0012).toFixed(2)); // STT, SEBI, GST estimation

    return {
      plannerRecommendedQty: recommendedQty,
      slPriceForSizing: slPrice,
      hasFormSL: formSLValid,
      formSLVal: slVal,
      marginRequired: marginReq,
      taxesAndCharges: taxes,
      plannerRiskCapital: riskCap,
      plannerRiskPerShare: riskPerShare,
      plannerRequiredMargin: reqMargin
    };
  }, [customBalanceInput, user?.virtualBalance, riskPercent, stopLoss, direction, activePrice, simSLPercent, qty]);

  const handleApplySizing = React.useCallback(() => {
    setQty(plannerRecommendedQty);
    if (!hasFormSL) {
      setStopLoss(slPriceForSizing.toFixed(2));
    }
  }, [plannerRecommendedQty, hasFormSL, slPriceForSizing]);

  const estimatedBrokerage = direction === 'Buy' && orderType === 'Market' ? 20.00 : 0.00; // Zerodha delivery modeling

  const handleQtyStep = React.useCallback((amt: number) => {
    setQty(prev => {
      const next = prev + amt;
      return next <= 0 ? 1 : next;
    });
  }, []);

  if (!user) return null;

  const handleOrderSubmission = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(false);
    setFeedback(null);

    const res = addOrder({
      symbol: selectedAsset.symbol,
      direction,
      type: orderType,
      quantity: qty,
      price: orderType !== 'Market' ? parseFloat(limitPrice) : undefined,
      triggerPrice: orderType === 'Stop-Loss' ? parseFloat(triggerPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      target: target ? parseFloat(target) : undefined
    });

    setFeedback(res);

    if (res.success) {
      onSuccess();
    }
  }, [addOrder, selectedAsset.symbol, direction, orderType, qty, limitPrice, triggerPrice, stopLoss, target, onSuccess]);

  // Mock TradingView-style candlestick coordinates for SVG
  const candleCount = 12;
  const mockCandles = [
    { o: 2890, h: 2920, l: 2880, c: 2915 },
    { o: 2915, h: 2935, l: 2905, c: 2928 },
    { o: 2928, h: 2930, l: 2895, c: 2902 },
    { o: 2902, h: 2918, l: 2890, c: 2912 },
    { o: 2912, h: 2940, l: 2910, c: 2935 },
    { o: 2935, h: 2960, l: 2925, c: 2955 },
    { o: 2955, h: 2985, l: 2950, c: 2978 },
    { o: 2978, h: 2980, l: 2945, c: 2962 },
    { o: 2962, h: 2975, l: 2950, c: 2970 },
    { o: 2970, h: 2995, l: 2962, c: 2985 },
    { o: 2985, h: 3010, l: 2978, c: 2990 },
    { o: 2990, h: 3012, l: selectedAsset.ltp * 0.99, c: selectedAsset.ltp }
  ];

  const chartHeight = 120;
  const chartWidth = 320;
  const candleWidth = 16;
  const candleGap = 8;

  const minVal = Math.min(...mockCandles.map(c => c.l));
  const maxVal = Math.max(...mockCandles.map(c => c.h));
  const range = maxVal - minVal || 1;

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto w-full">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
        <div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest font-bold">Active Order Target</span>
          <h2 className="text-lg font-display font-extrabold text-slate-900 dark:text-white mt-0.5">{selectedAsset.symbol}</h2>
          <span className="text-xs text-slate-500 dark:text-gray-400 block mt-0.5 font-medium">{selectedAsset.name}</span>
        </div>

        <div className="text-right">
          <span className="block text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest font-bold">Live Paper LTP</span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-numbers block mt-0.5">
            ₹{selectedAsset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-mono font-bold ${selectedAsset.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Chart */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-time Ticking interactive stock chart */}
          <StockChart height={280} showControls={true} />

          {/* Info card underneath the chart */}
          <div className="p-4 bg-white dark:bg-[#0c1020] rounded-2xl border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-gray-400 flex items-start gap-2.5 shadow-sm">
            <Info className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed">
              Executing CE/PE and Limit orders simulates real-time matching with mock order books. All transaction records populate your private portfolio positions history instantly.
            </span>
          </div>

          {/* Position Size Calculator Panel */}
          <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">📐 Sizing & Risk Protection Planner</h4>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-normal">
              Ensure proper leverage by locking down your per-trade risk coefficient. Calculates target quantity matching your risk profile.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Risk Coefficient */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 dark:text-gray-400 font-mono uppercase font-bold block">Risk %: {riskPercent}%</span>
                <div className="flex gap-1">
                  {[0.5, 1, 2].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRiskPercent(v)}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
                        riskPercent === v 
                          ? 'bg-blue-600 dark:bg-sky-500 text-white shadow' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      {v}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={riskPercent ?? ''}
                    onChange={e => setRiskPercent(parseFloat(e.target.value) || 1)}
                    className="w-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-1.5 py-1 text-center text-[10px] text-slate-900 dark:text-white font-mono"
                    placeholder="Custom"
                  />
                </div>
              </div>

              {/* Stop-Loss Simulation */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 dark:text-gray-400 font-mono uppercase font-bold block">
                  {hasFormSL ? 'Active Stop-Loss (₹)' : 'Fallback SL %'}
                </span>
                {hasFormSL ? (
                  <div className="bg-blue-500/10 dark:bg-sky-500/10 border border-blue-500/20 dark:border-sky-500/20 text-blue-600 dark:text-sky-400 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg text-center">
                    ₹{formSLVal.toFixed(2)}
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {[1, 2, 3].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSimSLPercent(v)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${
                          simSLPercent === v 
                            ? 'bg-amber-500 text-white shadow' 
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {v}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Custom Balance Override */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 dark:text-gray-400 font-mono uppercase font-bold block">Capital Balance (₹)</span>
                <input
                  type="number"
                  value={customBalanceInput ?? ''}
                  onChange={e => setCustomBalanceInput(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-sky-500 font-mono placeholder-slate-400 dark:placeholder-gray-600"
                  placeholder={`Default: ₹${user.virtualBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                />
              </div>

              {/* Recommended Quantity Display */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 dark:text-gray-400 font-mono uppercase font-bold block">Recommended Qty</span>
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold flex justify-between items-center">
                  <span className="text-blue-600 dark:text-sky-400 font-extrabold">{plannerRecommendedQty}</span>
                  <span className="text-[8px] text-slate-500 dark:text-gray-400 font-normal">units</span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200 dark:border-white/5 text-[10px] font-mono text-slate-600 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Account Capital Risked:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">₹{plannerRiskCapital.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Per Share (₹):</span>
                <span className="text-slate-900 dark:text-white font-bold">₹{plannerRiskPerShare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Equivalent Stop-Loss:</span>
                <span className="text-slate-900 dark:text-white font-bold">₹{slPriceForSizing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Required Margin for Sized Qty:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{plannerRequiredMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplySizing}
              className="w-full bg-blue-500/10 dark:bg-sky-500/10 hover:bg-blue-500/20 dark:hover:bg-sky-500/20 text-blue-600 dark:text-sky-400 font-bold py-2.5 rounded-xl text-[10px] transition border border-blue-500/15 dark:border-sky-500/15 tracking-wider uppercase cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              Apply Recommended Sizing & Stop Loss to Ticket
            </button>
          </div>
        </div>

        {/* Right Column - Trade Ticket Form */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Dynamic Overlay for feedback states */}
        <AnimatePresence>
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 dark:bg-[#0b0e14]/90  flex flex-col items-center justify-center z-10 text-slate-900 dark:text-white">
              <div className="w-10 h-10 border-4 border-blue-500/25 dark:border-sky-500/25 border-t-blue-600 dark:border-t-sky-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold tracking-wide">Placing order on simulated ledger...</p>
            </div>
          )}

          {feedback && (
            <div className="absolute inset-0 bg-white/95 dark:bg-[#0b0e14]/95  flex flex-col items-center justify-center z-10 p-6 text-center">
              {feedback.success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Execution Success!</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{feedback.message}</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 font-bold text-lg">
                    !
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Execution Failed</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs">{feedback.message}</p>
                  <button
                    onClick={() => setFeedback(null)}
                    className="mt-4 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 transition"
                  >
                    Close & Adjust Ticket
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        <form onSubmit={handleOrderSubmission} className="space-y-5">
          {/* Buy/Sell Segment Switch */}
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/5">
            <button
              type="button"
              onClick={() => setDirection('Buy')}
              className={`py-2.5 text-xs font-extrabold rounded-lg transition ${
                direction === 'Buy'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              Buy (CE / Long)
            </button>
            <button
              type="button"
              onClick={() => setDirection('Sell')}
              className={`py-2.5 text-xs font-extrabold rounded-lg transition ${
                direction === 'Sell'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              Sell (PE / Short)
            </button>
          </div>

          {/* Order Type Select */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/5">
            {(['Market', 'Limit', 'Stop-Loss'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  orderType === type ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Quantity Stepper and Optional Limit Price details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest block font-bold">Quantity</label>
              <div className="flex bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleQtyStep(-10)}
                  className="w-10 h-10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-extrabold text-base"
                  style={{ touchAction: 'manipulation' }}
                >
                  -
                </button>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tabular-numbers">{qty}</span>
                <button
                  type="button"
                  onClick={() => handleQtyStep(10)}
                  className="w-10 h-10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-extrabold text-base"
                  style={{ touchAction: 'manipulation' }}
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest block font-bold">
                {orderType === 'Market' ? 'Price (Est.)' : 'Limit Price'}
              </label>
              <input
                type="text"
                disabled={orderType === 'Market'}
                value={orderType === 'Market' ? `₹${selectedAsset.ltp.toFixed(2)}` : (limitPrice ?? '')}
                onChange={e => setLimitPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-sky-500 placeholder-slate-400 dark:placeholder-gray-600 transition tabular-numbers disabled:opacity-50"
              />
            </div>
          </div>

          {/* Stop loss and target configuration indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest block font-bold">Stop-Loss (S/L)</label>
              <input
                type="number"
                step="0.05"
                placeholder="Optional ₹ value"
                value={stopLoss ?? ''}
                onChange={e => setStopLoss(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-sky-500 placeholder-slate-400 dark:placeholder-gray-600 transition tabular-numbers"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest block font-bold">Target (TGT)</label>
              <input
                type="number"
                step="0.05"
                placeholder="Optional ₹ value"
                value={target ?? ''}
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-sky-500 placeholder-slate-400 dark:placeholder-gray-600 transition tabular-numbers"
              />
            </div>
          </div>

          {/* Trigger Price for Stop-Loss Order */}
          {orderType === 'Stop-Loss' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest block font-bold">Trigger Price</label>
              <input
                type="number"
                step="0.05"
                required
                value={triggerPrice ?? ''}
                onChange={e => setTriggerPrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-sky-500 placeholder-slate-400 dark:placeholder-gray-600 transition tabular-numbers"
              />
            </div>
          )}

          {/* Live Brokerage and Margin Estimate Panel */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-gray-400 font-medium">
              <span>Required Margin</span>
              <span className="font-mono text-slate-900 dark:text-white tabular-numbers font-bold">₹{marginRequired.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-gray-400 font-medium">
              <span>Brokerage Charges (Est.)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{estimatedBrokerage.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-gray-400 border-b border-slate-200 dark:border-white/5 pb-1.5 font-medium">
              <span>Taxes, Stamp & SEBI Fees</span>
              <span className="font-mono text-slate-900 dark:text-white tabular-numbers font-bold">₹{taxesAndCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-800 dark:text-gray-300 pt-0.5">
              <span>Total Capital Deducted</span>
              <span className="font-mono text-slate-900 dark:text-white tabular-numbers">
                ₹{(marginRequired + estimatedBrokerage + taxesAndCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {isTradingBlocked && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-200/90 leading-normal font-sans font-medium">
              ⚠️ Strict Market Hours Enforced: Indian Markets (NSE/BSE) are currently <strong>CLOSED</strong>. You can disable 'Enforce Market Hours' in Settings to practice paper trading 24/7.
            </div>
          )}

          {/* Execute CTA Button */}
          <button
            type="submit"
            disabled={isTradingBlocked}
            className={`w-full text-white font-extrabold py-3.5 rounded-xl text-sm transition tracking-wide flex items-center justify-center gap-1.5 duration-200 ${
              isTradingBlocked
                ? 'bg-slate-300 dark:bg-slate-800/60 text-slate-500 dark:text-gray-500 cursor-not-allowed border border-slate-200 dark:border-white/5'
                : (direction === 'Buy' ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer active:scale-[0.99]' : 'bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-[0.99]')
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {!isTradingBlocked ? (
              <>
                CONFIRM SIMULATED {direction.toUpperCase()} <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                MARKETS CLOSED (TRANSACTION LOCKED)
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  </div>
  );
});
