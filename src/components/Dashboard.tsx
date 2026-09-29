/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMainApp, useMarketData } from '../store';
import { 
  TrendingUp, ArrowRight, Search, X, Briefcase, BrainCircuit, BookOpen, Shield
} from 'lucide-react';
import { getWeeklyExpiriesForUnderlier } from '../derivativesUtils';

interface DashboardProps {
  onNavigate: (tab: string, arg?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ onNavigate }) => {
  const { user, positions: basePositions = [], exitPosition } = useMainApp();
  const { livePositions, instruments = [], futures = [], setSelectedAssetBySymbol } = useMarketData();
  const positions = livePositions && livePositions.length > 0 ? livePositions : basePositions;

  // Filter indices list
  const indicesList = React.useMemo(() => {
    return (instruments || []).filter(inst => 
      ['NIFTY 50', 'BANKNIFTY', 'SENSEX', 'FINNIFTY'].includes(inst.symbol)
    );
  }, [instruments]);

  // Search overlay states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchTab, setSelectedSearchTab] = useState<'All' | 'Stocks' | 'Futures' | 'Options'>('All');

  const instrumentsRef = React.useRef(instruments);
  instrumentsRef.current = instruments;
  const futuresRef = React.useRef(futures);
  futuresRef.current = futures;

  const searchableAssets = React.useMemo(() => {
    if (!isSearchOpen) return [];
    const currentInst = instrumentsRef.current || [];
    const currentFut = futuresRef.current || [];
    return [
      ...currentInst.map(inst => ({
        symbol: inst.symbol,
        name: inst.name,
        ltp: inst.ltp,
        change: inst.change,
        type: 'Stock' as const,
      })),
      ...currentFut.map(fut => ({
        symbol: fut.symbol,
        name: fut.name,
        ltp: fut.ltp,
        change: fut.change,
        type: 'Future' as const,
      })),
      ...['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'SBIN', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS'].flatMap(underlier => {
        const underlierInst = currentInst.find(i => i.symbol === (underlier === 'NIFTY' ? 'NIFTY 50' : underlier));
        const spot = underlierInst ? underlierInst.ltp : (underlier === 'BANKNIFTY' ? 52410.50 : 2980.40);
        let strikeStep = 50;
        if (underlier === 'BANKNIFTY' || spot > 3000) strikeStep = 100;
        else if (spot <= 500) strikeStep = 20;
        
        const atmStrike = Math.round(spot / strikeStep) * strikeStep;
        const strikes = [atmStrike - strikeStep, atmStrike, atmStrike + strikeStep];
        const expiries = getWeeklyExpiriesForUnderlier(underlier === 'NIFTY' ? 'NIFTY 50' : underlier).slice(0, 2).map(exp => {
          const parts = exp.split('-');
          return parts.length === 3 ? `${parts[0]}-${parts[1]}-${parts[2].substring(2)}` : exp;
        });
        const underlierNameFull = underlier === 'NIFTY' ? 'Nifty 50' : underlier === 'BANKNIFTY' ? 'Bank Nifty' : underlier;

        return expiries.flatMap(exp => 
          strikes.flatMap(strike => {
            const distance = strike - spot;
            const callIntrinsic = Math.max(0, spot - strike);
            const callTimeValue = (spot * 0.006) * Math.exp(-Math.pow(distance / (strikeStep * 2.5), 2));
            const callLtp = Number((callIntrinsic + callTimeValue).toFixed(2));
            
            const putIntrinsic = Math.max(0, strike - spot);
            const putTimeValue = (spot * 0.0055) * Math.exp(-Math.pow(distance / (strikeStep * 2.5), 2));
            const putLtp = Number((putIntrinsic + putTimeValue).toFixed(2));

            const callDelta = Number((1 / (1 + Math.exp(distance / (strikeStep * 1.5)))).toFixed(2));
            const putDelta = Number((callDelta - 1).toFixed(2));

            return [
              {
                symbol: `${underlier} ${exp} ${strike} CE`,
                name: `${underlierNameFull} ${strike} Call (${exp})`,
                ltp: callLtp < 1.0 ? 1.05 : callLtp,
                change: callDelta * 100,
                type: 'Option (CE)' as const,
              },
              {
                symbol: `${underlier} ${exp} ${strike} PE`,
                name: `${underlierNameFull} ${strike} Put (${exp})`,
                ltp: putLtp < 1.0 ? 1.05 : putLtp,
                change: putDelta * 100,
                type: 'Option (PE)' as const,
              }
            ];
          })
        );
      })
    ];
  }, [isSearchOpen]);

  const finalResults = React.useMemo(() => {
    if (!isSearchOpen) return [];
    const tabFiltered = searchableAssets.filter(asset => {
      if (selectedSearchTab === 'Stocks') return asset.type === 'Stock';
      if (selectedSearchTab === 'Futures') return asset.type === 'Future';
      if (selectedSearchTab === 'Options') return asset.type.startsWith('Option');
      return true;
    });
    return searchQuery.trim() === ''
      ? tabFiltered.slice(0, 12)
      : tabFiltered.filter(asset =>
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
  }, [isSearchOpen, searchableAssets, selectedSearchTab, searchQuery]);

  const openPositions = React.useMemo(() => (positions || []).filter(p => p.status === 'Open'), [positions]);

  const { winRate, openPositionsPnl } = React.useMemo(() => {
    const closedPositions = (positions || []).filter(p => p.status === 'Closed');
    const winsCount = closedPositions.filter(p => (p.realizedPnl || 0) > 0).length;
    const totalClosedCount = closedPositions.length || 1;
    const winRateVal = closedPositions.length > 0 ? Math.round((winsCount / totalClosedCount) * 100) : 0;

    const openPnl = openPositions.reduce((acc, p) => {
      const singlePnl = p.direction === 'Long' ? (p.currentPrice - p.entryPrice) : (p.entryPrice - p.currentPrice);
      return acc + (singlePnl * p.quantity);
    }, 0);

    return {
      winRate: winRateVal,
      openPositionsPnl: openPnl
    };
  }, [positions, openPositions]);

  if (!user) return null;

  const realizedPnl = user.virtualBalance - user.initialBalance;

  return (
    <div className="space-y-6 w-full">
      {/* 1. PORTFOLIO SUMMARY HEADER */}
      <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-gray-400 block">
              Total Portfolio Value
            </span>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                ₹{(user.virtualBalance + openPositionsPnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-mono font-bold ${
                openPositionsPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {openPositionsPnl >= 0 ? '+' : ''}₹{openPositionsPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Open P&L
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>Search & Trade</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('trade')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer text-center"
            >
              New Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-500 dark:text-gray-400 block">Available Cash</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
              ₹{user.virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-gray-400 block">Unrealized P&L</span>
            <span className={`text-sm font-bold font-mono mt-0.5 block ${openPositionsPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {openPositionsPnl >= 0 ? '+' : ''}₹{openPositionsPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-gray-400 block">Realized P&L</span>
            <span className={`text-sm font-bold font-mono mt-0.5 block ${realizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {realizedPnl >= 0 ? '+' : ''}₹{realizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-gray-400 block">Win Rate</span>
            <span className="text-sm font-bold text-blue-600 dark:text-sky-400 font-mono mt-0.5 block">
              {winRate}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. MARKET INDICES ROW */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400">
            Market Indices
          </h3>
          <span className="text-xs text-slate-400 dark:text-gray-500">Click any index to open chart & trade</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {indicesList.map(idxAsset => {
            const isPositive = idxAsset.change >= 0;
            return (
              <div
                key={idxAsset.symbol}
                onClick={() => {
                  setSelectedAssetBySymbol(idxAsset.symbol);
                  onNavigate('trade');
                }}
                className="bg-white dark:bg-[#0c1020] hover:border-blue-500/40 dark:hover:border-sky-500/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 transition cursor-pointer flex flex-col justify-between gap-2 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {idxAsset.symbol}
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isPositive ? '+' : ''}{idxAsset.change.toFixed(2)}%
                  </span>
                </div>
                <span className="text-base font-mono font-extrabold text-slate-900 dark:text-white">
                  ₹{idxAsset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN TWO-COLUMN WORKSPACE: OPEN POSITIONS & QUICK TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Positions (2 cols on desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              Active Positions ({openPositions.length})
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('positions')}
              className="text-xs text-blue-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              View All Orders & History →
            </button>
          </div>

          {openPositions.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-xs text-slate-500 dark:text-gray-400">
                You have no open positions right now.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('equity')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  Browse Stocks
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('fno')}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition"
                >
                  Trade F&O
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {openPositions.map(pos => {
                const pnlValue = pos.direction === 'Long'
                  ? (pos.currentPrice - pos.entryPrice) * pos.quantity
                  : (pos.entryPrice - pos.currentPrice) * pos.quantity;

                return (
                  <div key={pos.id} className="flex flex-wrap justify-between items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{pos.symbol}</span>
                        <span className={`text-[10px] font-bold ${
                          pos.direction === 'Long' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {pos.direction}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">
                        {pos.quantity} Qty · Avg ₹{pos.entryPrice.toLocaleString('en-IN')} · LTP ₹{pos.currentPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs sm:text-sm font-bold font-mono ${
                        pnlValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {pnlValue >= 0 ? '+' : ''}₹{pnlValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => exitPosition(pos.id)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition"
                      >
                        Exit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Navigation Cards (1 col on desktop) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400">
            Quick Tools
          </h3>

          <button
            type="button"
            onClick={() => onNavigate('equity')}
            className="w-full bg-white dark:bg-[#0c1020] hover:border-sky-500/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-left flex items-center justify-between transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Equity & F&O Markets</span>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">Live watchlists & option chain</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ai-coach')}
            className="w-full bg-white dark:bg-[#0c1020] hover:border-sky-500/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-left flex items-center justify-between transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">AI Trading Coach</span>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">Setup analysis & mindset help</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('risk-management')}
            className="w-full bg-white dark:bg-[#0c1020] hover:border-sky-500/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-left flex items-center justify-between transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Position Size Calculator</span>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">Calculate safe trade quantities</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('academy')}
            className="w-full bg-white dark:bg-[#0c1020] hover:border-sky-500/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-left flex items-center justify-between transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Trading Academy</span>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">Interactive courses & quizzes</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Universal Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 bg-[#060913]/90 z-50 flex items-start justify-center p-4 pt-10 sm:pt-16">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#11141c] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
            >
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Search Instruments</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }} 
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="h-4 w-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search stocks, futures, or options (e.g. RELIANCE, NIFTY CE)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                    autoFocus
                  />
                </div>

                <div className="flex gap-1.5">
                  {(['All', 'Stocks', 'Futures', 'Options'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedSearchTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        selectedSearchTab === tab
                          ? 'bg-sky-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {finalResults.length > 0 ? (
                  finalResults.map(asset => {
                    const isChangePositive = asset.change >= 0;
                    return (
                      <div 
                        key={asset.symbol} 
                        className="bg-white/2 border border-white/5 rounded-xl p-3 flex justify-between items-center hover:bg-white/5 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white">{asset.symbol}</span>
                            <span className="text-[10px] text-sky-400 font-mono">{asset.type}</span>
                          </div>
                          <span className="text-[11px] text-gray-400 block">{asset.name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="block text-xs font-bold text-white font-mono">
                              ₹{asset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[10px] font-mono ${isChangePositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isChangePositive ? '+' : ''}{asset.change.toFixed(2)}%
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssetBySymbol(asset.symbol);
                              setIsSearchOpen(false);
                              onNavigate('trade');
                            }}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                          >
                            Trade
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    No matching instruments found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
