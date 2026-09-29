/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMainApp, useActiveAsset } from '../store';
import { Check, ShieldCheck } from 'lucide-react';
import { StockChart } from './StockChart';

interface TradeScreenProps {
  onSuccess: () => void;
}

export const TradeScreen: React.FC<TradeScreenProps> = React.memo(({ onSuccess }) => {
  const { addOrder, user, isMarketOpen, enforceMarketHours } = useMainApp();
  const { selectedAsset } = useActiveAsset();
  const isTradingBlocked = enforceMarketHours && !isMarketOpen;
  
  const [direction, setDirection] = useState<'Buy' | 'Sell'>('Buy');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop-Loss'>('Market');
  const [qty, setQty] = useState<number>(50);
  const [limitPrice, setLimitPrice] = useState<string>(selectedAsset.ltp.toFixed(2));
  const [triggerPrice, setTriggerPrice] = useState<string>((selectedAsset.ltp * 0.99).toFixed(2));
  const [stopLoss, setStopLoss] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setLimitPrice(selectedAsset.ltp.toFixed(2));
    setTriggerPrice((selectedAsset.ltp * 0.99).toFixed(2));

    const preQty = localStorage.getItem('risk_calc_qty');
    const preSL = localStorage.getItem('risk_calc_sl');
    const preTarget = localStorage.getItem('risk_calc_target');

    if (preQty) {
      setQty(parseInt(preQty, 10) || 50);
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

  const { safeQty, autoSLPrice, marginRequired, taxesAndCharges } = React.useMemo(() => {
    const userBalance = user?.virtualBalance || 500000;
    const riskCapital = userBalance * 0.01; // 1% risk rule
    const slVal = parseFloat(stopLoss);
    const hasSL = !isNaN(slVal) && slVal > 0;
    const slPrice = hasSL
      ? slVal
      : direction === 'Buy'
      ? activePrice * 0.98
      : activePrice * 1.02;

    const riskPerShare = Math.max(0.05, Math.abs(activePrice - slPrice));
    const recommendedQty = Math.max(1, Math.floor(riskCapital / riskPerShare));
    const marginReq = activePrice * qty;
    const taxes = Number((marginReq * 0.0012).toFixed(2));

    return {
      safeQty: recommendedQty,
      autoSLPrice: slPrice,
      marginRequired: marginReq,
      taxesAndCharges: taxes
    };
  }, [user?.virtualBalance, stopLoss, direction, activePrice, qty]);

  const handleApplySafeSizing = () => {
    setQty(safeQty);
    if (!stopLoss) {
      setStopLoss(autoSLPrice.toFixed(2));
    }
  };

  const estimatedBrokerage = direction === 'Buy' && orderType === 'Market' ? 20.0 : 0.0;

  const handleQtyStep = (amt: number) => {
    setQty(prev => Math.max(1, prev + amt));
  };

  const handleOrderSubmission = (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  if (!user) return null;

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto w-full">
      {/* Asset Header */}
      <div className="flex justify-between items-center bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedAsset.symbol}</h2>
          <span className="text-xs text-slate-500 dark:text-gray-400 block">{selectedAsset.name}</span>
        </div>

        <div className="text-right">
          <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono block">
            ₹{selectedAsset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-mono font-bold ${selectedAsset.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Chart */}
        <div className="lg:col-span-7 space-y-4">
          <StockChart height={340} showControls={true} />
        </div>

        {/* Right Column: Clean Order Ticket */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <AnimatePresence>
            {feedback && (
              <div className="absolute inset-0 bg-white/95 dark:bg-[#0b0e14]/95 flex flex-col items-center justify-center z-10 p-6 text-center">
                {feedback.success ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Order Executed</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{feedback.message}</p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3">
                    <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500 font-bold text-lg">
                      !
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Order Rejected</h3>
                    <p className="text-xs text-rose-500 max-w-xs">{feedback.message}</p>
                    <button
                      type="button"
                      onClick={() => setFeedback(null)}
                      className="mt-2 px-4 py-2 bg-slate-100 dark:bg-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      Adjust Order
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>

          <form onSubmit={handleOrderSubmission} className="space-y-4">
            {/* Buy / Sell Toggle */}
            <div className="grid grid-cols-2 bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setDirection('Buy')}
                className={`py-2.5 text-xs font-extrabold rounded-lg transition ${
                  direction === 'Buy'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Buy / Long
              </button>
              <button
                type="button"
                onClick={() => setDirection('Sell')}
                className={`py-2.5 text-xs font-extrabold rounded-lg transition ${
                  direction === 'Sell'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sell / Short
              </button>
            </div>

            {/* Order Type Toggle */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/5">
              {(['Market', 'Limit', 'Stop-Loss'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    orderType === type
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* 1-Click Safe Position Size Helper */}
            <div className="flex items-center justify-between bg-blue-500/5 dark:bg-sky-500/5 border border-blue-500/15 dark:border-sky-500/15 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>1% Risk Safe Qty: <strong className="font-mono text-slate-900 dark:text-white">{safeQty}</strong></span>
              </span>
              <button
                type="button"
                onClick={handleApplySafeSizing}
                className="text-blue-600 dark:text-sky-400 hover:underline font-bold text-xs"
              >
                Apply
              </button>
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 block">Quantity</label>
                <div className="flex bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleQtyStep(-10)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 text-center bg-transparent font-extrabold text-sm text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQtyStep(10)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 block">
                  {orderType === 'Market' ? 'Market Price' : 'Limit Price (₹)'}
                </label>
                <input
                  type="text"
                  disabled={orderType === 'Market'}
                  value={orderType === 'Market' ? `₹${selectedAsset.ltp.toFixed(2)}` : limitPrice}
                  onChange={e => setLimitPrice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Stop Loss & Target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 block">Stop-Loss (Optional ₹)</label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="₹ Price"
                  value={stopLoss}
                  onChange={e => setStopLoss(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 block">Target (Optional ₹)</label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="₹ Price"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {orderType === 'Stop-Loss' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 block">Trigger Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={triggerPrice}
                  onChange={e => setTriggerPrice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-gray-400">
                <span>Order Value</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  ₹{marginRequired.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-gray-400">
                <span>Est. Charges & Taxes</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  ₹{(estimatedBrokerage + taxesAndCharges).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-white/5">
                <span>Total Margin Required</span>
                <span className="font-mono">
                  ₹{(marginRequired + estimatedBrokerage + taxesAndCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {isTradingBlocked && (
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                Markets are currently closed. Disable "Enforce Market Hours" in Settings to trade 24/7.
              </div>
            )}

            <button
              type="submit"
              disabled={isTradingBlocked}
              className={`w-full text-white font-bold py-3.5 rounded-xl text-sm transition ${
                isTradingBlocked
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  : direction === 'Buy'
                  ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                  : 'bg-rose-600 hover:bg-rose-500 cursor-pointer'
              }`}
            >
              {isTradingBlocked ? 'Markets Closed' : `Place ${direction} Order`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
});
