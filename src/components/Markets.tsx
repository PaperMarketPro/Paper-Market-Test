/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Instrument } from '../types';
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Eye, ChevronRight, X, Layers, Percent, Activity } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

interface MarketsProps {
  onNavigate: (tab: string, arg?: any) => void;
  mode?: 'equity' | 'fno';
}

export const Markets: React.FC<MarketsProps> = ({ onNavigate, mode }) => {
  const { instruments, optionChain, setSelectedAssetBySymbol } = useApp();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'options' | 'indices'>(
    mode === 'fno' ? 'options' : 'watchlist'
  );
  const [selectedList, setSelectedList] = useState<'All' | 'My Watchlist'>('All');
  
  // Custom watchlist list
  const [myWatchlist, setMyWatchlist] = useState<string[]>(['RELIANCE', 'TCS', 'HDFCBANK']);
  
  // Search & add state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Asset detail state
  const [expandedAsset, setExpandedAsset] = useState<Instrument | null>(null);

  // Expiries scroll chips
  const expiries = ['11-JUL-2026', '18-JUL-2026', '25-JUL-2026', '01-AUG-2026'];
  const [selectedExpiry, setSelectedExpiry] = useState('11-JUL-2026');

  // Option Greeks toggle
  const [showGreeks, setShowGreeks] = useState(false);

  // Sync activeTab when mode changes
  React.useEffect(() => {
    if (mode === 'fno') {
      setActiveTab('options');
    } else if (mode === 'equity') {
      setActiveTab('watchlist');
    }
  }, [mode]);

  const filteredInstruments = instruments.filter(inst => {
    if (mode === 'equity' && (inst.symbol === 'NIFTY 50' || inst.symbol === 'BANKNIFTY')) {
      return false;
    }
    if (selectedList === 'My Watchlist') {
      return myWatchlist.includes(inst.symbol);
    }
    return true; // All
  });

  const searchResults = instruments.filter(inst =>
    inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToWatchlist = (symbol: string) => {
    if (!myWatchlist.includes(symbol)) {
      setMyWatchlist(prev => [...prev, symbol]);
    }
    setShowSearchModal(false);
    setSearchQuery('');
  };

  const removeFromWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMyWatchlist(prev => prev.filter(s => s !== symbol));
  };

  const handleAssetTap = (inst: Instrument) => {
    if (expandedAsset?.symbol === inst.symbol) {
      setExpandedAsset(null);
    } else {
      setExpandedAsset(inst);
    }
  };

  const handleQuickTrade = (symbol: string) => {
    setSelectedAssetBySymbol(symbol);
    onNavigate('trade');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header Tabs or Mode Title */}
      {!mode ? (
        <div className="flex border-b border-white/5 gap-4">
          {[
            { key: 'watchlist', label: 'Watchlists' },
            { key: 'options', label: 'Nifty Option Chain' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm font-semibold transition relative ${
                activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="marketTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"
                />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-[#0b0e14]/50 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest block font-bold">
              {mode === 'equity' ? 'EQUITY TRADING' : 'F&O DERIVATIVES'}
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {mode === 'equity' ? 'Live Stock Watchlist' : 'Nifty 50 Option Chain'}
            </h2>
          </div>
          <div className="text-[10px] text-gray-500 font-mono bg-white/2 border border-white/5 px-2.5 py-1 rounded-lg self-start sm:self-center">
            {mode === 'equity' ? 'Real-time equity quotes' : '100% simulated option Greeks'}
          </div>
        </div>
      )}

      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          {/* Sub Navigation lists */}
          <div className="flex justify-between items-center bg-white/2 border border-white/5 p-2 rounded-xl">
            <div className="flex gap-2">
              {(['All', 'My Watchlist'] as const).map(list => (
                <button
                  key={list}
                  onClick={() => setSelectedList(list)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedList === list ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {list}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSearchModal(true)}
              className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg hover:bg-sky-500/20 transition flex items-center gap-1 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Stock
            </button>
          </div>

          {/* Instruments List */}
          <div className="space-y-2">
            {filteredInstruments.map(inst => {
              const isChangePositive = inst.change >= 0;
              const isMyItem = myWatchlist.includes(inst.symbol);

              return (
                <div key={inst.symbol} className="bg-white/2 border border-white/5 rounded-xl hover:bg-white/4 transition overflow-hidden">
                  <div
                    onClick={() => handleAssetTap(inst)}
                    className="p-4 flex justify-between items-center cursor-pointer"
                  >
                    {/* Ticker Name details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">{inst.symbol}</span>
                        {selectedList === 'All' && isMyItem && (
                          <span className="bg-sky-500/10 text-[9px] text-sky-400 px-1 rounded">My List</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 block max-w-[120px] truncate md:max-w-xs">{inst.name}</span>
                    </div>

                    {/* Inline SVG Sparkline graph */}
                    <div className="w-20 h-8 hidden sm:block">
                      <svg className="w-full h-full" viewBox="0 0 80 32">
                        <path
                          d={inst.sparkline.map((val, idx) => {
                            const x = (idx / (inst.sparkline.length - 1)) * 80;
                            const minVal = Math.min(...inst.sparkline);
                            const maxVal = Math.max(...inst.sparkline);
                            const y = 30 - ((val - minVal) / (maxVal - minVal || 1)) * 28;
                            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke={isChangePositive ? '#10b981' : '#ef4444'}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    {/* Price and Change */}
                    <div className="text-right space-y-1">
                      <span className="block text-sm font-bold text-white tabular-numbers">
                        ₹{inst.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-xs font-mono font-medium block tabular-numbers ${
                        isChangePositive ? 'text-bull' : 'text-bear'
                      }`}>
                        {isChangePositive ? '+' : ''}{inst.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  <AnimatePresence>
                    {expandedAsset?.symbol === inst.symbol && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white/1 border-t border-white/5 p-4 space-y-4"
                      >
                        {/* Real-time Ticker Chart */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> Real-Time Live Chart (3s ticks)
                          </span>
                          <div className="h-28 w-full bg-black/20 rounded-xl p-2.5 border border-white/5">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={inst.sparkline.map((val, i) => ({ Tick: `T${i}`, Price: val }))}>
                                <YAxis domain={['auto', 'auto']} hide={true} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#11141c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                  labelStyle={{ color: '#9ca3af', fontSize: '9px', fontFamily: 'monospace' }}
                                  itemStyle={{ color: isChangePositive ? '#10b981' : '#ef4444', fontSize: '10px', fontFamily: 'monospace' }}
                                />
                                <defs>
                                  <linearGradient id={`colorPrice-${inst.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isChangePositive ? '#10b981' : '#ef4444'} stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor={isChangePositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="Price" stroke={isChangePositive ? '#10b981' : '#ef4444'} strokeWidth={1.5} fillOpacity={1} fill={`url(#colorPrice-${inst.symbol})`} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white/3 p-2 rounded">
                            <span className="text-[10px] text-gray-500 block">High</span>
                            <span className="font-mono font-semibold text-white tabular-numbers">₹{inst.high.toFixed(1)}</span>
                          </div>
                          <div className="bg-white/3 p-2 rounded">
                            <span className="text-[10px] text-gray-500 block">Low</span>
                            <span className="font-mono font-semibold text-white tabular-numbers">₹{inst.low.toFixed(1)}</span>
                          </div>
                          <div className="bg-white/3 p-2 rounded">
                            <span className="text-[10px] text-gray-500 block">Volume</span>
                            <span className="font-mono font-semibold text-white tabular-numbers">{(inst.volume / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>

                        {/* Interactive CTAs */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuickTrade(inst.symbol)}
                            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition text-center cursor-pointer"
                          >
                            Execute Trade
                          </button>
                          
                          {selectedList === 'My Watchlist' ? (
                            <button
                              onClick={(e) => removeFromWatchlist(inst.symbol, e)}
                              className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition flex items-center justify-center cursor-pointer"
                              title="Remove from Watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => addToWatchlist(inst.symbol)}
                              className="px-3 bg-white/5 hover:bg-white/10 text-sky-400 rounded-xl transition flex items-center justify-center text-xs font-bold gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Watch
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'options' && (
        <div className="space-y-4">
          {/* Expiry Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Select Weekly Expiry</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {expiries.map(exp => (
                <button
                  key={exp}
                  onClick={() => setSelectedExpiry(exp)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedExpiry === exp ? 'bg-sky-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Underlier spot indicator */}
          <div className="flex justify-between items-center bg-white/2 border border-white/5 p-3 rounded-xl text-xs">
            <div className="space-y-0.5">
              <span className="font-mono text-gray-400">NIFTY SPOT</span>
              <span className="block font-bold text-white tabular-numbers">₹{instruments[0].ltp.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={() => setShowGreeks(!showGreeks)}
              className="text-[10px] bg-white/5 text-sky-400 hover:bg-white/10 px-2 py-1 rounded border border-white/5 font-semibold uppercase flex items-center gap-1"
            >
              <Percent className="w-3.5 h-3.5" /> {showGreeks ? 'Hide Greeks' : 'Show Greeks'}
            </button>
          </div>

          {/* Option Chain Grid view */}
          <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0b0e14]">
            {/* Table Header */}
            <div className="grid grid-cols-7 text-center py-2 bg-white/5 border-b border-white/10 text-[9px] font-mono text-gray-400 uppercase tracking-wider">
              <div className="col-span-3 text-emerald-400">Calls</div>
              <div className="bg-white/3 text-white border-x border-white/5">Strike</div>
              <div className="col-span-3 text-red-400">Puts</div>
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-7 text-center py-1.5 border-b border-white/5 text-[9px] font-semibold text-gray-500">
              {showGreeks ? (
                <>
                  <div>Delta</div>
                  <div>Theta</div>
                  <div>LTP</div>
                </>
              ) : (
                <>
                  <div>OI</div>
                  <div>Vol</div>
                  <div>LTP</div>
                </>
              )}
              <div className="bg-white/1 text-gray-300 border-x border-white/5">Strike</div>
              {showGreeks ? (
                <>
                  <div>LTP</div>
                  <div>Theta</div>
                  <div>Delta</div>
                </>
              ) : (
                <>
                  <div>LTP</div>
                  <div>Vol</div>
                  <div>OI</div>
                </>
              )}
            </div>

            {/* Chain rows */}
            <div className="divide-y divide-white/5">
              {optionChain.map(item => {
                const isCallItm = item.strike < instruments[0].ltp;
                const isPutItm = item.strike > instruments[0].ltp;

                return (
                  <div key={item.strike} className="grid grid-cols-7 text-center items-center py-2 text-xs tabular-numbers hover:bg-white/5 transition">
                    {/* CALL side metrics */}
                    <div className={`py-1 ${isCallItm ? 'bg-emerald-500/5' : ''}`}>
                      <span className="text-gray-400">{showGreeks ? item.calls.delta.toFixed(2) : `${(item.calls.oi / 1000).toFixed(0)}k`}</span>
                    </div>
                    <div className={`py-1 ${isCallItm ? 'bg-emerald-500/5' : ''}`}>
                      <span className="text-gray-400">{showGreeks ? item.calls.theta.toFixed(1) : `${(item.calls.volume / 1000).toFixed(0)}k`}</span>
                    </div>
                    <div
                      onClick={() => handleQuickTrade(`NIFTY 24-JUL ${item.strike} CE`)}
                      className={`py-1 font-bold text-emerald-400 cursor-pointer hover:bg-emerald-500/10 rounded transition ${
                        isCallItm ? 'bg-emerald-500/10' : ''
                      }`}
                    >
                      ₹{item.calls.ltp.toFixed(1)}
                    </div>

                    {/* STRIKE price center */}
                    <div className="bg-white/3 text-white border-x border-white/5 font-bold py-1 text-center font-mono">
                      {item.strike}
                    </div>

                    {/* PUT side metrics */}
                    <div
                      onClick={() => handleQuickTrade(`NIFTY 24-JUL ${item.strike} PE`)}
                      className={`py-1 font-bold text-red-400 cursor-pointer hover:bg-red-500/10 rounded transition ${
                        isPutItm ? 'bg-red-500/10' : ''
                      }`}
                    >
                      ₹{item.puts.ltp.toFixed(1)}
                    </div>
                    <div className={`py-1 ${isPutItm ? 'bg-red-500/5' : ''}`}>
                      <span className="text-gray-400">{showGreeks ? item.puts.theta.toFixed(1) : `${(item.puts.volume / 1000).toFixed(0)}k`}</span>
                    </div>
                    <div className={`py-1 ${isPutItm ? 'bg-red-500/5' : ''}`}>
                      <span className="text-gray-400">{showGreeks ? item.puts.delta.toFixed(2) : `${(item.puts.oi / 1000).toFixed(0)}k`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 text-[10px] text-gray-400">
            💡 **ITM contracts** are highlighted in subtle background tint shading. Tapping any **LTP value** pre-fills and opens the order executing ticket instantly.
          </div>
        </div>
      )}

      {/* Dynamic Slide-up Watchlist search and add modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 bg-[#0b0e14]/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-[#11141c] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-white">Add Instrument</h3>
                <button onClick={() => setShowSearchModal(false)} className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search RELIANCE, TCS, INFY..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-gray-600 transition"
                  autoFocus
                />
              </div>

              {/* Search list */}
              <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                {searchResults.map(inst => (
                  <div key={inst.symbol} className="flex justify-between items-center py-2.5">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-xs text-white">{inst.symbol}</span>
                      <span className="block text-[10px] text-gray-400">{inst.name}</span>
                    </div>
                    <button
                      onClick={() => addToWatchlist(inst.symbol)}
                      className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-[10px] font-bold hover:bg-sky-600 transition"
                    >
                      Add
                    </button>
                  </div>
                ))}

                {searchResults.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-xs">No matching symbols found.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
