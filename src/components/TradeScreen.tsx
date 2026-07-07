/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle, Check, Info } from 'lucide-react';

interface TradeScreenProps {
  onSuccess: () => void;
}

export const TradeScreen: React.FC<TradeScreenProps> = ({ onSuccess }) => {
  const { selectedAsset, addOrder, user } = useApp();
  if (!user) return null;
  
  // Ticket States
  const [direction, setDirection] = useState<'Buy' | 'Sell'>('Buy');
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop-Loss'>('Market');
  const [qty, setQty] = useState<number>(50);
  const [limitPrice, setLimitPrice] = useState<string>(selectedAsset.ltp.toFixed(2));
  const [triggerPrice, setTriggerPrice] = useState<string>((selectedAsset.ltp * 0.99).toFixed(2));
  const [stopLoss, setStopLoss] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  
  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Sync price on asset change
  useEffect(() => {
    setLimitPrice(selectedAsset.ltp.toFixed(2));
    setTriggerPrice((selectedAsset.ltp * 0.99).toFixed(2));
    setStopLoss('');
    setTarget('');
  }, [selectedAsset]);

  const activePrice = orderType === 'Market' ? selectedAsset.ltp : parseFloat(limitPrice) || selectedAsset.ltp;
  const marginRequired = activePrice * qty;
  const estimatedBrokerage = direction === 'Buy' && orderType === 'Market' ? 20.00 : 0.00; // Zerodha delivery modeling
  const taxesAndCharges = Number((marginRequired * 0.0012).toFixed(2)); // STT, SEBI, GST estimation

  const handleQtyStep = (amt: number) => {
    setQty(prev => {
      const next = prev + amt;
      return next <= 0 ? 1 : next;
    });
  };

  const handleOrderSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    setTimeout(() => {
      setIsLoading(false);
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
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    }, 1000);
  };

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
      <div className="flex justify-between items-center bg-white/2 border border-white/5 rounded-2xl p-4">
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Active Order Target</span>
          <h2 className="text-lg font-display font-bold text-white mt-0.5">{selectedAsset.symbol}</h2>
          <span className="text-xs text-gray-400 block mt-0.5">{selectedAsset.name}</span>
        </div>

        <div className="text-right">
          <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Live Paper LTP</span>
          <span className="text-lg font-bold text-white tabular-numbers block mt-0.5">
            ₹{selectedAsset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-xs font-mono font-medium ${selectedAsset.change >= 0 ? 'text-bull' : 'text-bear'}`}>
            {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column - Chart */}
        <div className="space-y-6">
          {/* Mini Candlestick SVG Chart (TradingView style) */}
          <div className="bg-[#11141c]/50 border border-white/5 rounded-2xl p-4 relative overflow-hidden">
        <span className="absolute top-2 right-2 text-[8px] font-mono text-gray-500 uppercase tracking-widest bg-[#0b0e14]/85 px-1.5 py-0.5 rounded border border-white/5">
          Simulated 5m Candle Chart
        </span>
        <div className="h-[120px] flex items-center justify-center">
          <svg width={chartWidth} height={chartHeight}>
            {/* Horizontal guidelines */}
            <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255,255,255,0.02)" />
            <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="rgba(255,255,255,0.02)" />
            <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="rgba(255,255,255,0.02)" />

            {mockCandles.map((c, idx) => {
              const x = idx * (candleWidth + candleGap) + 15;
              const openY = chartHeight - ((c.o - minVal) / range) * (chartHeight - 20) - 10;
              const closeY = chartHeight - ((c.c - minVal) / range) * (chartHeight - 20) - 10;
              const highY = chartHeight - ((c.h - minVal) / range) * (chartHeight - 20) - 10;
              const lowY = chartHeight - ((c.l - minVal) / range) * (chartHeight - 20) - 10;

              const isGreen = c.c >= c.o;
              const color = isGreen ? '#10b981' : '#ef4444';

              return (
                <g key={idx}>
                  {/* Wick */}
                  <line x1={x + candleWidth / 2} y1={highY} x2={x + candleWidth / 2} y2={lowY} stroke={color} strokeWidth="1.5" />
                  {/* Candle Body */}
                  <rect
                    x={x}
                    y={Math.min(openY, closeY)}
                    width={candleWidth}
                    height={Math.max(Math.abs(closeY - openY), 2)}
                    fill={color}
                    rx="1.5"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Info card underneath the chart */}
      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] text-gray-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <span className="font-sans leading-relaxed">
          Executing CE/PE and Limit orders simulates real-time matching with mock order books. All transaction records populate your private portfolio positions history instantly.
        </span>
      </div>
    </div>

    {/* Right Column - Trade Ticket Form */}
    <div className="bg-white/2 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Dynamic Overlay for feedback states */}
        <AnimatePresence>
          {isLoading && (
            <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white">
              <div className="w-10 h-10 border-4 border-sky-500/25 border-t-sky-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold tracking-wide">Placing order on simulated ledger...</p>
            </div>
          )}

          {feedback && (
            <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6 text-center">
              {feedback.success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="w-12 h-12 bg-bull/10 border border-bull/20 rounded-full flex items-center justify-center mx-auto text-bull">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Execution Success!</h3>
                  <p className="text-xs text-gray-400">{feedback.message}</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  <div className="w-12 h-12 bg-bear/10 border border-bear/20 rounded-full flex items-center justify-center mx-auto text-bear font-bold text-lg">
                    !
                  </div>
                  <h3 className="text-lg font-bold text-white">Execution Failed</h3>
                  <p className="text-xs text-red-400 max-w-xs">{feedback.message}</p>
                  <button
                    onClick={() => setFeedback(null)}
                    className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-white border border-white/5 transition"
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
          <div className="grid grid-cols-2 bg-white/5 rounded-xl p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setDirection('Buy')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                direction === 'Buy'
                  ? 'bg-bull text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Buy (CE / Long)
            </button>
            <button
              type="button"
              onClick={() => setDirection('Sell')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                direction === 'Sell'
                  ? 'bg-bear text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sell (PE / Short)
            </button>
          </div>

          {/* Order Type Select */}
          <div className="grid grid-cols-3 gap-1 bg-white/3 rounded-xl p-0.5 border border-white/5">
            {(['Market', 'Limit', 'Stop-Loss'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  orderType === type ? 'bg-white/5 text-white shadow' : 'text-gray-500 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Quantity Stepper and Optional Limit Price details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Quantity</label>
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleQtyStep(-10)}
                  className="w-8 h-8 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center font-bold text-sm"
                >
                  -
                </button>
                <span className="font-bold text-sm text-white tabular-numbers">{qty}</span>
                <button
                  type="button"
                  onClick={() => handleQtyStep(10)}
                  className="w-8 h-8 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white flex items-center justify-center font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
                {orderType === 'Market' ? 'Price (Est.)' : 'Limit Price'}
              </label>
              <input
                type="text"
                disabled={orderType === 'Market'}
                value={orderType === 'Market' ? `₹${selectedAsset.ltp.toFixed(2)}` : limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-gray-600 transition tabular-numbers disabled:opacity-50"
              />
            </div>
          </div>

          {/* Stop loss and target configuration indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Stop-Loss (S/L)</label>
              <input
                type="number"
                step="0.05"
                placeholder="Optional ₹ value"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-gray-600 transition tabular-numbers"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Target (TGT)</label>
              <input
                type="number"
                step="0.05"
                placeholder="Optional ₹ value"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-gray-600 transition tabular-numbers"
              />
            </div>
          </div>

          {/* Trigger Price for Stop-Loss Order */}
          {orderType === 'Stop-Loss' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Trigger Price</label>
              <input
                type="number"
                step="0.05"
                required
                value={triggerPrice}
                onChange={e => setTriggerPrice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-gray-600 transition tabular-numbers"
              />
            </div>
          )}

          {/* Live Brokerage and Margin Estimate Panel */}
          <div className="bg-white/1 border border-white/5 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Required Margin</span>
              <span className="font-mono text-white tabular-numbers">₹{marginRequired.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Brokerage Charges (Est.)</span>
              <span className="font-mono text-emerald-400">₹{estimatedBrokerage.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 border-b border-white/5 pb-1.5">
              <span>Taxes, Stamp & SEBI Fees</span>
              <span className="font-mono text-white tabular-numbers">₹{taxesAndCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-300 pt-0.5">
              <span>Total Capital Deducted</span>
              <span className="font-mono text-white tabular-numbers">
                ₹{(marginRequired + estimatedBrokerage + taxesAndCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Execute CTA Button */}
          <button
            type="submit"
            className={`w-full text-white font-bold py-3.5 rounded-xl text-sm transition tracking-wide flex items-center justify-center gap-1.5 ${
              direction === 'Buy' ? 'bg-bull hover:bg-emerald-600' : 'bg-bear hover:bg-red-600'
            }`}
          >
            CONFIRM SIMULATED {direction.toUpperCase()} <Sparkles className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  </div>
  );
};
