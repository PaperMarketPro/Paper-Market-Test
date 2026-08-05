/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../store';
import { Position, Order } from '../types';
import { Layers, CheckCircle2, TrendingUp, TrendingDown, Clock, HelpCircle, Edit3, X, Eye } from 'lucide-react';

interface PositionsListProps {
  onJournalShortcut: (pos: Position) => void;
}

export const PositionsList: React.FC<PositionsListProps> = React.memo(({ onJournalShortcut }) => {
  const { positions, orders, exitPosition, modifySLTarget, journals, isMarketOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'orders'>('open');

  // Filter lists
  const openPositions = React.useMemo(() => positions.filter(p => p.status === 'Open'), [positions]);
  const closedPositions = React.useMemo(() => positions.filter(p => p.status === 'Closed'), [positions]);

  // Check if position already has a journal logged
  const isJournaled = React.useCallback((posId: string) => journals.some(j => j.positionId === posId), [journals]);

  // Total Open Unrealized P&L
  const totalUnrealizedPnl = React.useMemo(() => {
    return openPositions.reduce((acc, pos) => {
      const singlePnl = pos.direction === 'Long'
        ? (pos.currentPrice - pos.entryPrice)
        : (pos.entryPrice - pos.currentPrice);
      return acc + (singlePnl * pos.quantity);
    }, 0);
  }, [openPositions]);

  // Exit trigger handle
  const handleExit = React.useCallback((id: string) => {
    exitPosition(id);
  }, [exitPosition]);

  // State for modifying SL/Tgt
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editSL, setEditSL] = useState<string>('');
  const [editTgt, setEditTgt] = useState<string>('');

  const handleEditRiskStart = React.useCallback((p: Position) => {
    setEditingPosId(p.id);
    setEditSL(p.stopLoss?.toString() || '');
    setEditTgt(p.target?.toString() || '');
  }, []);

  const handleEditRiskSave = React.useCallback((id: string) => {
    modifySLTarget(id, editSL ? parseFloat(editSL) : undefined, editTgt ? parseFloat(editTgt) : undefined);
    setEditingPosId(null);
  }, [modifySLTarget, editSL, editTgt]);

  return (
    <div className="space-y-6 w-full">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-white/5 gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
        {[
          { key: 'open', label: `Open Positions (${openPositions.length})` },
          { key: 'closed', label: `Closed Logs (${closedPositions.length})` },
          { key: 'orders', label: `Order Book (${orders.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-xs sm:text-sm font-semibold transition relative whitespace-nowrap px-1 ${
              activeTab === tab.key ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="positionTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-400"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'open' && (
        <div className="space-y-4">
          {/* Summary Header */}
          <div className="bg-white dark:bg-[#0c1020] border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 md:p-6 flex justify-between items-center shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest block font-bold">Total Unrealized P&L</span>
              <span className={`text-2xl font-display font-extrabold tabular-numbers block ${
                totalUnrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {totalUnrealizedPnl >= 0 ? '+' : ''}₹{totalUnrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 uppercase tracking-widest block font-bold">Positions count</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white tabular-numbers mt-0.5 block">{openPositions.length}</span>
            </div>
          </div>

          {/* Active Positions list */}
          <div className="space-y-3">
            {openPositions.map(pos => {
              const pnlValue = pos.direction === 'Long'
                ? (pos.currentPrice - pos.entryPrice) * pos.quantity
                : (pos.entryPrice - pos.currentPrice) * pos.quantity;

              const isGreen = pnlValue >= 0;

              return (
                <div key={pos.id} className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition duration-200">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{pos.symbol}</span>
                        <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                          pos.direction === 'Long' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {pos.direction}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-gray-400 block tabular-numbers font-medium">
                        {pos.quantity} Qty • Entry ₹{pos.entryPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className={`block text-base font-extrabold tabular-numbers ${
                        isGreen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isGreen ? '+' : ''}₹{pnlValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-gray-400 tabular-numbers font-mono">
                        LTP: ₹{pos.currentPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Stop Loss & Target Display / Edit Mode */}
                  {editingPosId === pos.id ? (
                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl space-y-3 border border-slate-200 dark:border-white/5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 dark:text-gray-400 uppercase font-bold">Edit S/L</label>
                          <input
                            type="number"
                            value={editSL ?? ''}
                            onChange={e => setEditSL(e.target.value)}
                            className="w-full bg-white dark:bg-[#060913] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-slate-500 dark:text-gray-400 uppercase font-bold">Edit Target</label>
                          <input
                            type="number"
                            value={editTgt ?? ''}
                            onChange={e => setEditTgt(e.target.value)}
                            className="w-full bg-white dark:bg-[#060913] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingPosId(null)}
                          className="px-3 py-1 bg-slate-200 dark:bg-white/10 rounded-lg text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditRiskSave(pos.id)}
                          className="px-3 py-1 bg-blue-600 dark:bg-sky-500 rounded-lg text-xs text-white font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 text-[10px] text-slate-500 dark:text-gray-400 font-mono py-1 border-t border-b border-slate-100 dark:border-white/5">
                      <span>S/L: {pos.stopLoss ? `₹${pos.stopLoss}` : 'None'}</span>
                      <span>Target: {pos.target ? `₹${pos.target}` : 'None'}</span>
                    </div>
                  )}

                  {/* Action controls */}
                  {editingPosId !== pos.id && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleExit(pos.id)}
                        disabled={!isMarketOpen}
                        className={`flex-1 font-bold py-2.5 rounded-xl text-xs transition duration-200 ${
                          !isMarketOpen
                            ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-gray-500 cursor-not-allowed border border-slate-200 dark:border-white/5'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer active:scale-[0.98]'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                        title={!isMarketOpen ? 'Indian markets are currently closed. Exiting positions is disabled.' : 'Exit position at market rate'}
                      >
                        {isMarketOpen ? 'Exit Position (Market)' : 'Markets Closed'}
                      </button>
                      <button
                        onClick={() => handleEditRiskStart(pos)}
                        disabled={!isMarketOpen}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/5 transition flex items-center gap-1 ${
                          !isMarketOpen
                            ? 'bg-slate-100 dark:bg-slate-800/20 text-slate-400 dark:text-gray-600 cursor-not-allowed'
                            : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-[0.98]'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                        title={!isMarketOpen ? 'Markets closed' : 'Modify Stop Loss'}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Modify S/L
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {openPositions.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-500 dark:text-gray-400 text-xs sm:text-sm shadow-sm">
                No active open positions. Search watchlists to buy/sell assets.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'closed' && (
        <div className="space-y-3">
          {closedPositions.map(pos => {
            const isWin = (pos.realizedPnl || 0) > 0;
            const journalLogged = isJournaled(pos.id);

            return (
              <div key={pos.id} className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{pos.symbol}</span>
                      <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                        pos.direction === 'Long' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {pos.direction}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-gray-400 block tabular-numbers">
                      {pos.quantity} Qty • Entry ₹{pos.entryPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className={`block text-base font-extrabold tabular-numbers ${
                      isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isWin ? '+' : ''}₹{pos.realizedPnl?.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-gray-400 tabular-numbers font-mono">
                      Exit: ₹{pos.currentPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Hold Duration & Time stamp */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-gray-400 font-mono pt-2 border-t border-slate-100 dark:border-white/5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Closed {pos.closedTimestamp ? new Date(pos.closedTimestamp).toLocaleDateString() : 'Recently'}
                  </span>
                  <span>Simulation Duration: ~4.5 hours</span>
                </div>

                {/* Journal block shortcut CTA */}
                {!journalLogged ? (
                  <button
                    onClick={() => onJournalShortcut(pos)}
                    className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-sky-400 rounded-xl text-xs font-bold border border-blue-500/15 transition flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Add to Trading Journal
                  </button>
                ) : (
                  <div className="w-full py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Entry Logged in Journal
                  </div>
                )}
              </div>
            );
          })}

          {closedPositions.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-500 dark:text-gray-400 text-xs sm:text-sm shadow-sm">
              No closed logs found. Complete standard market exits to populate results.
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.map(ord => (
            <div key={ord.id} className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{ord.symbol}</span>
                  <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                    ord.direction === 'Buy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {ord.direction}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-gray-400 block tabular-numbers">
                  {ord.quantity} Qty • {ord.type}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-gray-500 block font-mono">
                  {new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="text-right space-y-1">
                <span className="block text-xs font-extrabold text-slate-900 dark:text-white font-mono tabular-numbers">
                  {ord.price ? `₹${ord.price}` : 'Market Price'}
                </span>
                <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  ord.status === 'Executed'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : ord.status === 'Pending'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {ord.status}
                </span>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-500 dark:text-gray-400 text-xs sm:text-sm shadow-sm">
              No orders placed in this session.
            </div>
          )}
        </div>
      )}
    </div>
  );
});
