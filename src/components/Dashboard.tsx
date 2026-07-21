/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Instrument, Position } from '../types';
import { 
  Flame, TrendingUp, TrendingDown, Award, Calendar, DollarSign, 
  Activity, HelpCircle, ArrowRight, Shield, RefreshCw, Search, ShieldCheck, X 
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { getWeeklyExpiriesForUnderlier } from '../derivativesUtils';

interface DashboardProps {
  onNavigate: (tab: string, arg?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, positions, instruments, futures, optionChain, setSelectedAssetBySymbol, upstoxStatus } = useApp();
  if (!user) return null;
  const [activeTab, setActiveTab] = useState<'equity' | 'monthly'>('equity');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter indices list
  const indicesList = instruments.filter(inst => 
    ['NIFTY 50', 'BANKNIFTY', 'SENSEX', 'FINNIFTY'].includes(inst.symbol)
  );

  // Sparkline generator helper
  const renderMiniSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length === 0) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 45;
    const height = 14;
    const pathPoints = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="opacity-80">
        <path
          d={pathPoints}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // Search overlay states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchTab, setSelectedSearchTab] = useState<'All' | 'Stocks' | 'Futures' | 'Options'>('All');

  // Compile full-segment searchable assets dynamically
  const searchableAssets = React.useMemo(() => {
    if (!isSearchOpen) return [];
    return [
      // 1. Stocks and Indices
      ...instruments.map(inst => ({
        symbol: inst.symbol,
        name: inst.name,
        ltp: inst.ltp,
        change: inst.change,
        type: 'Stock' as const,
      })),
      // 2. Futures Contracts
      ...futures.map(fut => ({
        symbol: fut.symbol,
        name: fut.name,
        ltp: fut.ltp,
        change: fut.change,
        type: 'Future' as const,
      })),
      // 3 & 4. Option Chain Contracts (Dynamic Multi-Underlier & Multi-Expiry)
      ...['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'SBIN', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS'].flatMap(underlier => {
        const underlierInst = instruments.find(i => i.symbol === (underlier === 'NIFTY' ? 'NIFTY 50' : underlier));
        const spot = underlierInst ? underlierInst.ltp : (underlier === 'BANKNIFTY' ? 52410.50 : 2980.40);
        let strikeStep = 50;
        if (underlier === 'BANKNIFTY') {
          strikeStep = 100;
        } else if (spot > 3000) {
          strikeStep = 100;
        } else if (spot > 500) {
          strikeStep = 50;
        } else {
          strikeStep = 20;
        }
        
        const atmStrike = Math.round(spot / strikeStep) * strikeStep;
        const strikes = [atmStrike - strikeStep * 2, atmStrike - strikeStep, atmStrike, atmStrike + strikeStep, atmStrike + strikeStep * 2];
        const expiries = getWeeklyExpiriesForUnderlier(underlier === 'NIFTY' ? 'NIFTY 50' : underlier).slice(0, 3).map(exp => {
          const parts = exp.split('-');
          if (parts.length === 3) {
            return `${parts[0]}-${parts[1]}-${parts[2].substring(2)}`;
          }
          return exp;
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
                name: `${underlierNameFull} ${strike} Call Option (${exp})`,
                ltp: callLtp < 1.0 ? 1.05 : callLtp,
                change: callDelta * 100,
                type: 'Option (CE)' as const,
              },
              {
                symbol: `${underlier} ${exp} ${strike} PE`,
                name: `${underlierNameFull} ${strike} Put Option (${exp})`,
                ltp: putLtp < 1.0 ? 1.05 : putLtp,
                change: putDelta * 100,
                type: 'Option (PE)' as const,
              }
            ];
          })
        );
      })
    ];
  }, [isSearchOpen, instruments, futures]);

  // Apply tab filters
  const tabFiltered = React.useMemo(() => {
    if (!isSearchOpen) return [];
    return searchableAssets.filter(asset => {
      if (selectedSearchTab === 'Stocks') return asset.type === 'Stock';
      if (selectedSearchTab === 'Futures') return asset.type === 'Future';
      if (selectedSearchTab === 'Options') return asset.type.startsWith('Option');
      return true; // All
    });
  }, [isSearchOpen, searchableAssets, selectedSearchTab]);

  // Apply text query matching
  const finalResults = React.useMemo(() => {
    if (!isSearchOpen) return [];
    return searchQuery.trim() === ''
      ? tabFiltered.slice(0, 10)
      : tabFiltered.filter(asset =>
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
  }, [isSearchOpen, tabFiltered, searchQuery]);

  // Filter open positions from closed logs in positions store
  const openPositions = positions.filter(p => p.status === 'Open');

  // Compute stats dynamically
  const closedPositions = positions.filter(p => p.status === 'Closed');
  const winsCount = closedPositions.filter(p => (p.realizedPnl || 0) > 0).length;
  const lossesCount = closedPositions.filter(p => (p.realizedPnl || 0) < 0).length;
  const totalClosedCount = closedPositions.length || 1;
  const winRate = Math.round((winsCount / totalClosedCount) * 100);

  // Profit factor = Sum(Wins) / Sum(Losses)
  const grossWins = closedPositions.reduce((acc, curr) => (curr.realizedPnl || 0) > 0 ? acc + (curr.realizedPnl || 0) : acc, 0);
  const grossLosses = Math.abs(closedPositions.reduce((acc, curr) => (curr.realizedPnl || 0) < 0 ? acc + (curr.realizedPnl || 0) : acc, 0)) || 1;
  const profitFactor = Number((grossWins / grossLosses).toFixed(2));

  // Compute total unrealized P&L from open positions
  const openPositionsPnl = openPositions.reduce((acc, p) => {
    const singlePnl = p.direction === 'Long' ? (p.currentPrice - p.entryPrice) : (p.entryPrice - p.currentPrice);
    return acc + (singlePnl * p.quantity);
  }, 0);

  const dailyPnl = openPositionsPnl + 2254.50; // Dynamic simulated baseline
  const totalPnl = (user.virtualBalance - user.initialBalance) + openPositionsPnl;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Custom Equity Curve Coordinates for responsive SVG
  const equityData = [480000, 485000, 478000, 492000, 498000, 488000, 501000, user.virtualBalance + openPositionsPnl];
  const maxEquity = Math.max(...equityData);
  const minEquity = Math.min(...equityData);
  const range = maxEquity - minEquity || 1;

  // Render SVG Line Path
  const width = 500;
  const height = 180;
  const points = equityData.map((val, index) => {
    const x = (index / (equityData.length - 1)) * width;
    const y = height - ((val - minEquity) / range) * (height - 30) - 15;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // SVG Area Path
  const areaPoints = `${points} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: MAIN ANALYTICS & WATCHLISTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. SEARCH BOX BAR */}
          <div className="relative font-sans cursor-pointer" onClick={() => setIsSearchOpen(true)}>
            <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-sky-400/60" />
            </span>
            <input
              type="text"
              placeholder="Search stocks, FUT/CE/PE, index..."
              className="w-full bg-[#0a0d16] border border-white/5 focus:border-sky-500/20 rounded-2xl pl-10 pr-4 py-3.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500/25 transition duration-200 cursor-pointer"
              readOnly
            />
          </div>

          {/* Market Indices Quick Ticker cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">
                Live Market Indices
              </span>
              <span className="text-[9px] font-sans text-gray-500">
                Tap to trade derivatives
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {indicesList.map(idxAsset => {
                const isPositive = idxAsset.change >= 0;
                return (
                  <div
                    key={idxAsset.symbol}
                    onClick={() => {
                      setSelectedAssetBySymbol(idxAsset.symbol);
                      onNavigate('trade');
                    }}
                    className="bg-[#0b0e14]/60 hover:bg-[#0c1018] border border-white/5 hover:border-sky-500/25 rounded-2xl p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between h-[85px] group relative overflow-hidden"
                  >
                    {/* Hover subtle glow accent */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-sky-500/0 group-hover:to-sky-500/5 transition duration-200" />
                    
                    <div className="flex justify-between items-start relative z-10 w-full">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-white tracking-tight block">
                          {idxAsset.symbol}
                        </span>
                        <span className="text-[8px] text-gray-500 font-medium block truncate max-w-[70px]">
                          {idxAsset.name.replace('Index', '').replace('NSE', '').trim()}
                        </span>
                      </div>
                      <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded ${
                        isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {isPositive ? '+' : ''}{idxAsset.change.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-1.5 relative z-10 w-full">
                      <span className="text-xs font-mono font-bold text-white tabular-numbers">
                        ₹{idxAsset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                      {renderMiniSparkline(idxAsset.sparkline, isPositive)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. SIMULATED PERFORMANCE MATRIX WITH AREA CHART */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">
              Simulated Performance Matrix
            </span>
            
            <div className="bg-[#0b0e14]/60 border border-white/5 rounded-2xl p-4 space-y-3">
              {/* Custom Area Chart */}
              <div className="relative h-[110px] w-full flex items-end">
                <svg
                  className="w-full h-full"
                  viewBox={`0 0 ${width} ${height}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2={width} y2="40" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                  <line x1="0" y1="80" x2={width} y2="80" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                  <line x1="0" y1="120" x2={width} y2="120" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />

                  {/* Curve Area */}
                  <path d={areaPoints} fill="url(#equityGrad)" />
                  
                  {/* Curve Stroke */}
                  <path
                    d={points}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Interactive Dots */}
                  {equityData.map((val, idx) => {
                    const x = (idx / (equityData.length - 1)) * width;
                    const y = height - ((val - minEquity) / range) * (height - 30) - 15;
                    const isLast = idx === equityData.length - 1;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r={isLast ? "4" : "2"}
                        fill={isLast ? "#3b82f6" : "#ffffff"}
                        stroke={isLast ? "#ffffff" : "#3b82f6"}
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>
              </div>
              
              <span className="block text-[10px] text-gray-500 font-sans text-center mt-2 font-medium">
                Weekly Cumulative Equity Return Curve
              </span>
            </div>
          </div>

          {/* 6. COMPACT ACTIVE POSITIONS LIST */}
          <div className="bg-[#0b0e14]/60 border border-white/5 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Active Positions ({openPositions.length})</h3>
              <button
                onClick={() => onNavigate('positions')}
                className="text-[10px] text-blue-600 dark:text-sky-400 hover:text-blue-500 dark:hover:text-sky-300 font-bold font-mono uppercase flex items-center gap-1"
              >
                Full View
              </button>
            </div>

            {openPositions.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                No active positions open. Use Watchlists or Trade screen.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {openPositions.map(pos => {
                  const pnlValue = pos.direction === 'Long'
                    ? (pos.currentPrice - pos.entryPrice) * pos.quantity
                    : (pos.entryPrice - pos.currentPrice) * pos.quantity;

                  return (
                    <div key={pos.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">{pos.symbol}</span>
                          <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            pos.direction === 'Long' ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'
                          }`}>
                            {pos.direction}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 tabular-numbers">
                          {pos.quantity} Qty @ ₹{pos.entryPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className={`block text-xs font-bold tabular-numbers ${
                          pnlValue >= 0 ? 'text-bull' : 'text-bear'
                        }`}>
                          {pnlValue >= 0 ? '+' : ''}₹{pnlValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="block text-[9px] text-gray-500 tabular-numbers">
                          LTP: ₹{pos.currentPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7. COLLAPSIBLE ADVANCED METRICS DRAWER */}
          <details className="group bg-[#0b0e14]/40 border border-white/5 rounded-2xl overflow-hidden">
            <summary className="flex justify-between items-center p-4 text-xs font-semibold text-gray-400 cursor-pointer hover:bg-white/4 select-none">
              <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                Detailed Ledger Analytics
              </span>
              <span className="text-[9px] text-blue-600 dark:text-sky-400 font-mono uppercase group-open:hidden">Expand</span>
              <span className="text-[9px] text-gray-500 font-mono uppercase group-open:inline hidden">Collapse</span>
            </summary>
            
            <div className="p-4 border-t border-white/5 space-y-5">
              {/* Secondary Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Profit Factor</span>
                  <span className="block text-sm font-bold text-white tabular-numbers mt-0.5">{profitFactor}</span>
                </div>
                <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Max Drawdown</span>
                  <span className="block text-sm font-bold text-white tabular-numbers mt-0.5">2.4%</span>
                </div>
                <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Expectancy</span>
                  <span className="block text-sm font-bold text-white tabular-numbers mt-0.5">+₹142.50</span>
                </div>
                <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Discipline Score</span>
                  <span className="block text-sm font-bold text-blue-600 dark:text-sky-400 mt-0.5">88/100</span>
                </div>
              </div>

              {/* Heatmap Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">P&L Calendar Heatmap</span>
                </div>
                <div className="flex flex-wrap gap-1 items-center pb-1">
                  {Array.from({ length: 30 }, (_, idx) => {
                    let colorClass = 'bg-white/5';
                    let label = 'No Trades';
                    if (idx === 3 || idx === 11 || idx === 18) {
                      colorClass = 'bg-bear opacity-50';
                      label = '-₹1,200';
                    } else if (idx === 7 || idx === 21) {
                      colorClass = 'bg-bear';
                      label = '-₹4,800';
                    } else if (idx === 5 || idx === 14 || idx === 25 || idx === 28) {
                      colorClass = 'bg-bull opacity-50';
                      label = '+₹2,100';
                    } else if (idx === 15 || idx === 29) {
                      colorClass = 'bg-bull';
                      label = '+₹8,400';
                    }

                    return (
                      <div
                        key={idx}
                        title={`Day ${idx + 1}: ${label}`}
                        className={`w-[18px] h-[18px] rounded cursor-pointer hover:ring-2 hover:ring-white/20 transition ${colorClass}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono pt-1">
                  <span>Older Days</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-bear rounded-sm" />
                    <div className="w-2 h-2 bg-white/5 rounded-sm" />
                    <div className="w-2 h-2 bg-bull rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate('journal')}
                  className="flex-1 text-center text-[10px] text-blue-600 dark:text-sky-400 font-bold py-2 bg-sky-500/5 rounded-xl border border-sky-500/10 block uppercase font-mono tracking-wider"
                >
                  Discipline Journal
                </button>
                <button
                  onClick={handleRefresh}
                  className={`px-3 bg-white/5 rounded-xl border border-white/5 text-gray-400 hover:text-white transition flex items-center justify-center ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* RIGHT COLUMN: LEVEL & CAPITAL CARDS */}
        <div className="space-y-6">
          {/* 2. DYNAMIC LEVEL XP CARD */}
          <div className="bg-[#0b0e14]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            {/* Left Circular Meter */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-sky-500/5 border border-sky-500/10 shrink-0">
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-sky-400">{user.level}</span>
              <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r="20"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * (Math.min(300, user.xp % 300))) / 300}
                  className="opacity-40"
                />
              </svg>
            </div>

            {/* Right Info blocks */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-blue-600 dark:text-sky-400 font-bold tracking-wider uppercase">Option Apprentice</span>
                <span className="text-gray-400 font-medium">{user.xp % 300} / 300 XP</span>
              </div>
              
              {/* Progress bar track */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((user.xp % 300) / 300) * 100)}%` }} 
                />
              </div>
              
              <span className="block text-[9px] text-gray-500 font-sans">
                Trade or study in Academy to level up
              </span>
            </div>
          </div>

          {/* 3. TOTAL VIRTUAL CAPITAL CARD */}
          <div className="bg-[#0b0e14]/60 border border-sky-500/5 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-blue-600 dark:text-sky-400 uppercase tracking-widest block font-bold">
                Total Virtual Capital
              </span>
              <span className="text-3xl font-display font-extrabold text-white tracking-tight block mt-1 tabular-numbers">
                ₹{(user.virtualBalance + openPositionsPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-500 block uppercase font-mono">Unrealized P&L (Live)</span>
                <span className={`text-xs font-bold font-mono block tabular-numbers ${
                  openPositionsPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {openPositionsPnl >= 0 ? '+' : ''}₹{openPositionsPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-500 block uppercase font-mono">Realized P&L</span>
                <span className={`text-xs font-bold font-mono block tabular-numbers ${
                  (user.virtualBalance - user.initialBalance) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {(user.virtualBalance - user.initialBalance) >= 0 ? '+' : ''}₹{(user.virtualBalance - user.initialBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 4. METRICS ROW GRID (WIN RATE & RISK SCORE) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Win Rate Card */}
            <div className="bg-[#0b0e14]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between h-[90px]">
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Win Rate</span>
                <span className="text-xl font-bold text-white tabular-numbers mt-1 block">{winRate}.0%</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-red-400 font-mono">
                <span className="text-xs">📉</span>
                <span>Challenged</span>
              </div>
            </div>

            {/* Risk Score Card */}
            <div className="bg-[#0b0e14]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between h-[90px]">
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Risk Score</span>
                <span className="text-xl font-bold text-white tabular-numbers mt-1 block">100/100</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                <span className="text-xs">📈</span>
                <span>Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Search Modal Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-10 sm:pt-20">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-[#11141c] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Universal Market Search</h3>
                    <p className="text-[10px] text-gray-500">Search across stocks, index derivatives, options & futures</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }} 
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search input field inside modal */}
                <div className="relative font-sans">
                  <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <Search className="h-4.5 w-4.5 text-sky-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search e.g. RELIANCE, NIFTY FUT, 24300 CE, PE..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 focus:border-sky-500/20 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500/25 transition duration-200"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-white text-xs font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Tabs inside modal */}
                <div className="flex gap-2">
                  {(['All', 'Stocks', 'Futures', 'Options'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedSearchTab(tab)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition cursor-pointer ${
                        selectedSearchTab === tab
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-white/2 text-gray-500 hover:text-gray-300 border border-transparent'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
                {finalResults.length > 0 ? (
                  finalResults.map(asset => {
                    const isChangePositive = asset.change >= 0;
                    return (
                      <div 
                        key={asset.symbol} 
                        className="bg-white/2 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:bg-white/4 hover:border-white/10 transition group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs text-white tracking-wide">{asset.symbol}</span>
                            <span className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                              asset.type === 'Stock' ? 'bg-sky-500/10 text-sky-400' :
                              asset.type === 'Future' ? 'bg-amber-500/10 text-amber-500' :
                              asset.type.includes('CE') ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {asset.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 block font-sans">{asset.name}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Price & Change info */}
                          <div className="text-right space-y-0.5">
                            <span className="block text-xs font-bold text-white tabular-numbers">
                              ₹{asset.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[10px] font-mono font-medium block tabular-numbers ${
                              isChangePositive ? 'text-bull' : 'text-bear'
                            }`}>
                              {isChangePositive ? '+' : ''}{asset.change.toFixed(2)}%
                            </span>
                          </div>

                          {/* Quick Trade Action button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssetBySymbol(asset.symbol);
                              setIsSearchOpen(false);
                              onNavigate('trade');
                            }}
                            className="opacity-90 group-hover:opacity-100 bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                          >
                            Trade <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500 text-xs font-sans space-y-1">
                    <p>No instruments match your search.</p>
                    <p className="text-[10px] text-gray-600">Try searching for "Nifty", "Reliance", "CE", or "FUT"</p>
                  </div>
                )}
              </div>

              {/* Modal Footer helper */}
              <div className="p-3.5 bg-white/2 border-t border-white/5 text-[9px] text-center text-gray-500 font-sans">
                💡 Tap **Trade** next to any instrument to instantly pre-fill your secure order execution ticket.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
