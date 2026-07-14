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
import { StockChart } from './StockChart';

interface MarketsProps {
  onNavigate: (tab: string, arg?: any) => void;
  mode?: 'equity' | 'fno';
}

export const Markets: React.FC<MarketsProps> = ({ onNavigate, mode }) => {
  const { instruments, futures, optionChain, setSelectedAssetBySymbol, upstoxStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'watchlist' | 'options' | 'indices'>(
    mode === 'fno' ? 'options' : 'watchlist'
  );
  const [fnoSection, setFnoSection] = useState<'futures' | 'options'>('futures');
  const [selectedList, setSelectedList] = useState<'All' | 'My Watchlist'>('All');
  
  // Custom watchlist list with persistent localStorage caching
  const [myWatchlist, setMyWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('upstox_custom_watchlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore and fallback to default
      }
    }
    return ['RELIANCE', 'TCS', 'HDFCBANK'];
  });

  // Save changes to localStorage whenever myWatchlist changes
  React.useEffect(() => {
    localStorage.setItem('upstox_custom_watchlist', JSON.stringify(myWatchlist));
  }, [myWatchlist]);
  
  // Search & add state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Segment-specific inline searches
  const [equitySearchQuery, setEquitySearchQuery] = useState('');
  const [fnoFuturesSearchQuery, setFnoFuturesSearchQuery] = useState('');
  const [fnoOptionsSearchQuery, setFnoOptionsSearchQuery] = useState('');

  // Selected Option underlier index
  const [selectedOptionIndex, setSelectedOptionIndex] = useState('NIFTY 50');

  // Asset detail state
  const [expandedAsset, setExpandedAsset] = useState<Instrument | null>(null);

  // Expiries scroll chips
  const expiries = ['11-JUL-2026', '18-JUL-2026', '25-JUL-2026', '01-AUG-2026'];
  const [selectedExpiry, setSelectedExpiry] = useState('11-JUL-2026');

  // Option Greeks toggle
  const [showGreeks, setShowGreeks] = useState(false);

  // Option Chain approved setup (OK button clicked)
  const [optionChainApproved, setOptionChainApproved] = useState(true);

  // Sync activeTab when mode changes
  React.useEffect(() => {
    if (mode === 'fno') {
      setActiveTab('options');
    } else if (mode === 'equity') {
      setActiveTab('watchlist');
    }
  }, [mode]);

  const indicesList = ['NIFTY 50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'];

  const filteredInstruments = instruments.filter(inst => {
    if (mode === 'equity' && indicesList.includes(inst.symbol)) {
      return false;
    }
    const matchesWatchlist = selectedList === 'My Watchlist' ? myWatchlist.includes(inst.symbol) : true;
    const matchesSearch = inst.symbol.toLowerCase().includes(equitySearchQuery.toLowerCase()) ||
                          inst.name.toLowerCase().includes(equitySearchQuery.toLowerCase());
    return matchesWatchlist && matchesSearch;
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
            { key: 'options', label: 'Future & Option' },
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
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-500"
                />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-[#0b0e14]/50 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">
              {mode === 'equity' ? 'EQUITY TRADING' : 'F&O DERIVATIVES'}
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {mode === 'equity' ? 'Live Stock Watchlist' : 'F&O Derivatives Segment'}
            </h2>
          </div>
          <div className="text-[10px] text-gray-500 font-mono bg-white/2 border border-white/5 px-2.5 py-1 rounded-lg self-start sm:self-center">
            {mode === 'equity' ? 'Real-time equity quotes' : 'Simulated futures & option greeks'}
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

          {/* Equity-Specific Search Bar */}
          <div className="relative font-sans">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-sky-400/60" />
            </span>
            <input
              type="text"
              placeholder="Filter equity stocks (e.g. RELIANCE, TCS, INFY)..."
              value={equitySearchQuery}
              onChange={(e) => setEquitySearchQuery(e.target.value)}
              className="w-full bg-[#0a0d16] border border-white/5 focus:border-sky-500/20 rounded-xl pl-9 pr-10 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500/25 transition duration-200"
            />
            {equitySearchQuery && (
              <button
                onClick={() => setEquitySearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white text-[10px] font-mono"
              >
                Clear
              </button>
            )}
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
                        <StockChart asset={inst} height={210} showControls={true} />

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
                              className="px-3 bg-white/5 hover:bg-white/10 text-blue-600 dark:text-sky-400 rounded-xl transition flex items-center justify-center text-xs font-bold gap-1 cursor-pointer"
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

            {filteredInstruments.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-xs font-sans space-y-2 bg-[#0a0d16]/30 border border-white/5 rounded-2xl">
                <p className="font-semibold text-gray-400">No equity stocks match your search</p>
                <p className="text-[10px] text-gray-600">Try searching for a different ticker symbol or company name</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'options' && (
        <div className="space-y-4">
          {/* F&O SECTION SELECTOR PILLS */}
          <div className="flex bg-[#0b0e14]/50 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setFnoSection('futures')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                fnoSection === 'futures'
                  ? 'bg-blue-600 dark:bg-sky-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Future
            </button>
            <button
              onClick={() => setFnoSection('options')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                fnoSection === 'options'
                  ? 'bg-blue-600 dark:bg-sky-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Option
            </button>
          </div>

          {/* SEPARATE SEARCH BARS FOR BOTH FUTURES AND OPTIONS */}
          {fnoSection === 'futures' ? (
            <div className="relative font-sans">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-amber-500/60" />
              </span>
              <input
                type="text"
                placeholder="Filter futures contracts (e.g. NIFTY, BANKNIFTY, RELIANCE, FUT)..."
                value={fnoFuturesSearchQuery}
                onChange={(e) => setFnoFuturesSearchQuery(e.target.value)}
                className="w-full bg-[#0a0d16] border border-white/5 focus:border-amber-500/20 rounded-xl pl-9 pr-10 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500/25 transition duration-200"
              />
              {fnoFuturesSearchQuery && (
                <button
                  onClick={() => setFnoFuturesSearchQuery('')}
                  className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-white text-[10px] font-mono"
                >
                  Clear
                </button>
              )}
            </div>
          ) : optionChainApproved ? (
            <div className="relative font-sans">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-sky-500/60" />
              </span>
              <input
                type="text"
                placeholder="Search options (e.g. NIFTY 24300, TCS CE, PE, strike price)..."
                value={fnoOptionsSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setFnoOptionsSearchQuery(val);
                  
                  // Smart underlier detector: Automatically switch active underlier if mentioned!
                  const lowerVal = val.toLowerCase();
                  const allUnderliers = [
                    { key: 'NIFTY 50', terms: ['nifty 50', 'nifty', 'nifty50', 'nf'] },
                    { key: 'BANKNIFTY', terms: ['banknifty', 'bank nifty', 'bank', 'bnf'] },
                    { key: 'FINNIFTY', terms: ['finnifty', 'fin nifty', 'fin'] },
                    { key: 'SENSEX', terms: ['sensex', 'sen', 'sx'] },
                    { key: 'MIDCPNIFTY', terms: ['midcpnifty', 'midcap', 'mid'] },
                    { key: 'RELIANCE', terms: ['reliance', 'rel'] },
                    { key: 'TCS', terms: ['tcs'] },
                    { key: 'INFY', terms: ['infy', 'infosys'] },
                    { key: 'HDFCBANK', terms: ['hdfcbank', 'hdfc'] },
                    { key: 'ICICIBANK', terms: ['icici'] },
                    { key: 'SBIN', terms: ['sbin', 'sbi'] },
                    { key: 'TATAMOTORS', terms: ['tatamotors', 'tata'] }
                  ];

                  const matched = allUnderliers.find(u => 
                    u.terms.some(term => lowerVal.includes(term))
                  );
                  if (matched && matched.key !== selectedOptionIndex) {
                    setSelectedOptionIndex(matched.key);
                  }
                }}
                className="w-full bg-[#0a0d16] border border-white/5 focus:border-sky-500/20 rounded-xl pl-9 pr-10 py-2.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500/25 transition duration-200"
              />
              {fnoOptionsSearchQuery && (
                <button
                  onClick={() => setFnoOptionsSearchQuery('')}
                  className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-white text-[10px] font-mono border-0 bg-transparent cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          ) : null}

          {fnoSection === 'futures' ? (
            <div className="space-y-4">
              <div className="text-[11px] text-gray-400 bg-sky-500/5 border border-sky-500/10 px-3.5 py-2.5 rounded-xl leading-relaxed">
                📈 **Futures contracts** allow you to trade entire indices or stock baskets with leverage using pre-defined Lot Sizes. Margin is calculated dynamically at order entry.
              </div>

              {/* Futures List */}
              <div className="space-y-2">
                {futures.filter(inst =>
                  inst.symbol.toLowerCase().includes(fnoFuturesSearchQuery.toLowerCase()) ||
                  inst.name.toLowerCase().includes(fnoFuturesSearchQuery.toLowerCase())
                ).map(inst => {
                  const isChangePositive = inst.change >= 0;
                  const lotSize = inst.symbol.includes('NIFTY') 
                    ? (inst.symbol.includes('BANKNIFTY') ? 15 : 25) 
                    : inst.symbol.includes('RELIANCE') ? 250 
                    : inst.symbol.includes('TCS') ? 175 
                    : inst.symbol.includes('INFY') ? 400 : 1500;

                  return (
                    <div key={inst.symbol} className="bg-white/2 border border-white/5 rounded-xl hover:bg-white/4 transition overflow-hidden">
                      <div
                        onClick={() => handleAssetTap(inst)}
                        className="p-4 flex justify-between items-center cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">{inst.symbol}</span>
                            <span className="bg-white/5 border border-white/5 text-[9px] text-gray-400 px-1.5 py-0.5 rounded font-mono">Lot: {lotSize}</span>
                          </div>
                          <span className="text-xs text-gray-400 block">{inst.name}</span>
                        </div>

                        {/* Sparkline Graph */}
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

                        {/* Price & Change */}
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

                      {/* Expanded Futures Detail Panel */}
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
                                <span className="font-mono font-semibold text-white tabular-numbers">₹{inst.high.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                              </div>
                              <div className="bg-white/3 p-2 rounded">
                                <span className="text-[10px] text-gray-500 block">Low</span>
                                <span className="font-mono font-semibold text-white tabular-numbers">₹{inst.low.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                              </div>
                              <div className="bg-white/3 p-2 rounded">
                                <span className="text-[10px] text-gray-500 block">Volume</span>
                                <span className="font-mono font-semibold text-white tabular-numbers">{(inst.volume / 1000000).toFixed(1)}M</span>
                              </div>
                            </div>

                            {/* Execute CTA */}
                            <button
                              onClick={() => handleQuickTrade(inst.symbol)}
                              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition text-center cursor-pointer font-sans"
                            >
                              Execute Futures Trade
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {futures.filter(inst =>
                  inst.symbol.toLowerCase().includes(fnoFuturesSearchQuery.toLowerCase()) ||
                  inst.name.toLowerCase().includes(fnoFuturesSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-xs font-sans space-y-2 bg-[#0a0d16]/30 border border-white/5 rounded-2xl">
                    <p className="font-semibold text-gray-400">No futures contracts match your search</p>
                    <p className="text-[10px] text-gray-600">Try searching for a different contract symbol (e.g. NIFTY, TCS)</p>
                  </div>
                )}
              </div>
            </div>
          ) : !optionChainApproved ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/2 border border-white/5 rounded-2xl p-6 space-y-6 font-sans"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">
                  OPTIONS CHAIN CONFIGURATOR
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Configure Indices, Options Chain &amp; Greeks
                </h3>
                <p className="text-xs text-gray-400">
                  Select your index underlier, choose weekly expirations, and decide if you want to include real-time Greek metrics like Delta and Theta. Click OK to initialize.
                </p>
              </div>

              {/* Index underlier selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                  Select Index Underlier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { symbol: 'NIFTY 50', name: 'Nifty 50' },
                    { symbol: 'BANKNIFTY', name: 'Bank Nifty' },
                    { symbol: 'FINNIFTY', name: 'Fin Nifty' },
                    { symbol: 'SENSEX', name: 'Sensex' },
                    { symbol: 'MIDCPNIFTY', name: 'Midcap Nifty' },
                    { symbol: 'RELIANCE', name: 'Reliance' },
                    { symbol: 'TCS', name: 'TCS' },
                    { symbol: 'INFY', name: 'Infosys' },
                    { symbol: 'HDFCBANK', name: 'HDFC Bank' },
                    { symbol: 'SBIN', name: 'SBI' },
                    { symbol: 'TATAMOTORS', name: 'Tata Motors' }
                  ].map(idxObj => (
                    <button
                      key={idxObj.symbol}
                      type="button"
                      onClick={() => setSelectedOptionIndex(idxObj.symbol)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition border ${
                        selectedOptionIndex === idxObj.symbol
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/15'
                          : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold">{idxObj.name}</span>
                      <span className="block text-[9px] text-gray-500 font-mono">
                        ₹{(instruments.find(i => i.symbol === idxObj.symbol)?.ltp || 24325.85).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                  Select Weekly Expiry
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {expiries.map(exp => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setSelectedExpiry(exp)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        selectedExpiry === exp
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option Greeks Toggle */}
              <div className="bg-white/2 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Calculate Option Greeks</span>
                  <p className="text-[10px] text-gray-500">
                    Include real-time calculated Delta and Theta sensitivities inside the option chain grid
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGreeks(!showGreeks)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    showGreeks ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      showGreeks ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* OK Action Button */}
              <button
                type="button"
                onClick={() => setOptionChainApproved(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs transition uppercase tracking-wider shadow-lg shadow-blue-500/20 cursor-pointer text-center"
              >
                OK - Load Option Chain &amp; Greeks
              </button>
            </motion.div>
          ) : (() => {
            const selectedIndexInstrument = instruments.find(i => i.symbol === selectedOptionIndex) || instruments[0];
            const spotPrice = selectedIndexInstrument ? selectedIndexInstrument.ltp : 24325.85;

            // Dynamic Option Chain Generator
            const getDynamicOptionChain = (indexSymbol: string, spot: number) => {
              let strikeStep = 50;
              if (indexSymbol === 'BANKNIFTY' || indexSymbol === 'SENSEX' || indexSymbol === 'FINNIFTY') {
                strikeStep = 100;
              } else if (indexSymbol === 'MIDCPNIFTY') {
                strikeStep = 50;
              } else if (spot > 3000) {
                strikeStep = 100;
              } else if (spot > 1000) {
                strikeStep = 50;
              } else if (spot > 500) {
                strikeStep = 20;
              } else if (spot > 100) {
                strikeStep = 10;
              } else {
                strikeStep = 5;
              }
              
              // Round spot to nearest strikeStep
              const atmStrike = Math.round(spot / strikeStep) * strikeStep;
              const strikes = [
                atmStrike - strikeStep * 5,
                atmStrike - strikeStep * 4,
                atmStrike - strikeStep * 3,
                atmStrike - strikeStep * 2,
                atmStrike - strikeStep * 1,
                atmStrike,
                atmStrike + strikeStep * 1,
                atmStrike + strikeStep * 2,
                atmStrike + strikeStep * 3,
                atmStrike + strikeStep * 4,
                atmStrike + strikeStep * 5,
              ];

              return strikes.map((strike, idx) => {
                const distance = strike - spot;
                
                const callIntrinsic = Math.max(0, spot - strike);
                const callTimeValue = (spot * 0.006) * Math.exp(-Math.pow(distance / (strikeStep * 2.5), 2));
                const callLtp = Number((callIntrinsic + callTimeValue).toFixed(2));
                
                const putIntrinsic = Math.max(0, strike - spot);
                const putTimeValue = (spot * 0.0055) * Math.exp(-Math.pow(distance / (strikeStep * 2.5), 2));
                const putLtp = Number((putIntrinsic + putTimeValue).toFixed(2));

                const callDelta = Number((1 / (1 + Math.exp(distance / (strikeStep * 1.5)))).toFixed(2));
                const putDelta = Number((callDelta - 1).toFixed(2));

                const baseOi = 50000;
                const baseVol = 1000000;
                const factor = Math.exp(-Math.pow(distance / (strikeStep * 2), 2));
                
                return {
                  strike,
                  calls: {
                    ltp: callLtp < 1.0 ? 1.05 : callLtp,
                    oi: Math.round(baseOi * factor * (1 + (idx % 3) * 0.2)),
                    volume: Math.round(baseVol * factor * (1 + (idx % 5) * 0.15)),
                    iv: Number((12.0 + Math.abs(distance) / 200).toFixed(1)),
                    delta: callDelta,
                    theta: Number((-8.0 - (idx % 3) * 0.5).toFixed(1))
                  },
                  puts: {
                    ltp: putLtp < 1.0 ? 1.05 : putLtp,
                    oi: Math.round(baseOi * 1.2 * factor * (1 + (idx % 4) * 0.1)),
                    volume: Math.round(baseVol * 1.1 * factor * (1 + (idx % 7) * 0.1)),
                    iv: Number((12.5 + Math.abs(distance) / 200).toFixed(1)),
                    delta: putDelta,
                    theta: Number((-6.0 - (idx % 3) * 0.5).toFixed(1))
                  }
                };
              });
            };

            const currentOptionChain = getDynamicOptionChain(selectedOptionIndex, spotPrice);

            return (
              <div className="space-y-4">
                {/* Active Indicator & Reset Settings */}
                <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 animate-pulse"></span>
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                      Options Chain Simulation Active
                    </span>
                  </div>
                  <button
                    onClick={() => setOptionChainApproved(false)}
                    className="text-[10px] font-bold text-blue-600 dark:text-sky-400 hover:underline bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"
                  >
                    ← Reconfigure Setup
                  </button>
                </div>
                {/* Index & Stock Underliers Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Select Underlier (Indices & Stocks)</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {[
                      { symbol: 'NIFTY 50', name: 'Nifty 50' },
                      { symbol: 'BANKNIFTY', name: 'Bank Nifty' },
                      { symbol: 'FINNIFTY', name: 'Fin Nifty' },
                      { symbol: 'SENSEX', name: 'Sensex' },
                      { symbol: 'MIDCPNIFTY', name: 'Midcap Nifty' },
                      { symbol: 'RELIANCE', name: 'Reliance' },
                      { symbol: 'TCS', name: 'TCS' },
                      { symbol: 'INFY', name: 'Infosys' },
                      { symbol: 'HDFCBANK', name: 'HDFC Bank' },
                      { symbol: 'SBIN', name: 'SBI' },
                      { symbol: 'TATAMOTORS', name: 'Tata Motors' }
                    ].map(idxObj => (
                      <button
                        key={idxObj.symbol}
                        onClick={() => {
                          setSelectedOptionIndex(idxObj.symbol);
                          setFnoOptionsSearchQuery('');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                          selectedOptionIndex === idxObj.symbol
                            ? 'bg-blue-600 border-blue-600 text-white dark:bg-sky-500 dark:text-black dark:border-sky-500 shadow-md'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {idxObj.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expiry Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Select Weekly Expiry</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {expiries.map(exp => (
                      <button
                        key={exp}
                        onClick={() => setSelectedExpiry(exp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                          selectedExpiry === exp ? 'bg-blue-600 dark:bg-sky-500 text-white dark:text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Underlier spot indicator */}
                <div className="flex justify-between items-center bg-[#11141c] border border-white/5 p-3 rounded-xl text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-bold text-gray-400">{selectedOptionIndex} SPOT</span>
                    <span className="block font-bold text-white tabular-numbers">₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <button
                    onClick={() => setShowGreeks(!showGreeks)}
                    className="text-[10px] bg-white/5 text-blue-600 dark:text-sky-400 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 font-semibold uppercase flex items-center gap-1"
                  >
                    <Percent className="w-3.5 h-3.5" /> {showGreeks ? 'Hide Greeks' : 'Show Greeks'}
                  </button>
                </div>

                {/* Option Chain Grid view */}
                <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0b0e14] overflow-x-auto w-full">
                  <div className="min-w-[550px] md:min-w-full">
                    {/* Table Header */}
                    <div className="grid grid-cols-7 text-center py-2 bg-white/5 border-b border-white/10 text-[9px] font-mono text-gray-400 uppercase tracking-wider">
                      <div className="col-span-3 text-emerald-400 font-bold">Calls</div>
                      <div className="bg-white/3 text-white border-x border-white/5">Strike</div>
                      <div className="col-span-3 text-red-400 font-bold">Puts</div>
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
                      {(() => {
                        const filteredChain = currentOptionChain.filter(item => {
                          if (!fnoOptionsSearchQuery) return true;
                          const q = fnoOptionsSearchQuery.trim().toLowerCase();
                          
                          // If they typed an underlier like "reliance", hide non-matching but we already switch automatically.
                          // Let's filter by strike number if present.
                          const numbers = q.match(/\d+/);
                          if (numbers) {
                            return item.strike.toString().includes(numbers[0]);
                          }
                          
                          // Otherwise, if they just type "ce" or "pe", show all (and fade non-matching column inside)
                          if (q.includes('ce') || q.includes('pe') || q.includes('call') || q.includes('put')) {
                            return true;
                          }
                          
                          return item.strike.toString().includes(q) || selectedOptionIndex.toLowerCase().includes(q);
                        });

                        if (filteredChain.length === 0) {
                          return (
                            <div className="text-center py-12 text-gray-500 text-xs font-sans space-y-2">
                              <p className="font-semibold text-gray-400">No option strikes match your search</p>
                              <p className="text-[10px] text-gray-600">Try searching for a strike price like "24300" or a specific index/stock</p>
                            </div>
                          );
                        }

                        return filteredChain.map(item => {
                          const isCallItm = item.strike < spotPrice;
                          const isPutItm = item.strike > spotPrice;

                          const underlierName = selectedOptionIndex.split(' ')[0];

                          const q = fnoOptionsSearchQuery.toLowerCase();
                          const hideCe = (q.includes('pe') || q.includes('put')) && !(q.includes('ce') || q.includes('call'));
                          const hidePe = (q.includes('ce') || q.includes('call')) && !(q.includes('pe') || q.includes('put'));

                          return (
                            <div key={item.strike} className="grid grid-cols-7 text-center items-center py-2 text-xs tabular-numbers hover:bg-white/5 transition">
                              {/* CALL side metrics */}
                              <div className={`py-1 ${isCallItm ? 'bg-emerald-500/5' : ''} ${hideCe ? 'opacity-20' : ''}`}>
                                <span className="text-gray-400">{showGreeks ? item.calls.delta.toFixed(2) : `${(item.calls.oi / 1000).toFixed(0)}k`}</span>
                              </div>
                              <div className={`py-1 ${isCallItm ? 'bg-emerald-500/5' : ''} ${hideCe ? 'opacity-20' : ''}`}>
                                <span className="text-gray-400">{showGreeks ? item.calls.theta.toFixed(1) : `${(item.calls.volume / 1000).toFixed(0)}k`}</span>
                              </div>
                              <div
                                onClick={() => !hideCe && handleQuickTrade(`${underlierName} 24-JUL ${item.strike} CE`)}
                                className={`py-1 font-bold text-emerald-400 cursor-pointer hover:bg-emerald-500/10 rounded transition ${
                                  isCallItm ? 'bg-emerald-500/10' : ''
                                } ${hideCe ? 'opacity-20 pointer-events-none' : ''}`}
                              >
                                ₹{item.calls.ltp.toFixed(1)}
                              </div>

                              {/* STRIKE price center */}
                              <div className="bg-white/3 text-white border-x border-white/5 font-bold py-1 text-center font-mono">
                                {item.strike}
                              </div>

                              {/* PUT side metrics */}
                              <div
                                onClick={() => !hidePe && handleQuickTrade(`${underlierName} 24-JUL ${item.strike} PE`)}
                                className={`py-1 font-bold text-red-400 cursor-pointer hover:bg-red-500/10 rounded transition ${
                                  isPutItm ? 'bg-red-500/10' : ''
                                } ${hidePe ? 'opacity-20 pointer-events-none' : ''}`}
                              >
                                ₹{item.puts.ltp.toFixed(1)}
                              </div>
                              <div className={`py-1 ${isPutItm ? 'bg-red-500/5' : ''} ${hidePe ? 'opacity-20' : ''}`}>
                                <span className="text-gray-400">{showGreeks ? item.puts.theta.toFixed(1) : `${(item.puts.volume / 1000).toFixed(0)}k`}</span>
                              </div>
                              <div className={`py-1 ${isPutItm ? 'bg-red-500/5' : ''} ${hidePe ? 'opacity-20' : ''}`}>
                                <span className="text-gray-400">{showGreeks ? item.puts.delta.toFixed(2) : `${(item.puts.oi / 1000).toFixed(0)}k`}</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 text-[10px] text-gray-400">
                  💡 **ITM contracts** are highlighted in subtle background tint shading. Tapping any **LTP value** pre-fills and opens the order executing ticket instantly.
                </div>
              </div>
            );
          })()}
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
