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

export const PositionsList: React.FC<PositionsListProps> = ({ onJournalShortcut }) => {
  const { positions, orders, exitPosition, modifySLTarget, journals, isMarketOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'orders'>('open');

  // Filter lists
  const openPositions = positions.filter(p => p.status === 'Open');
  const closedPositions = positions.filter(p => p.status === 'Closed');

  // Check if position already has a journal logged
  const isJournaled = (posId: string) => journals.some(j => j.positionId === posId);

  // Total Open Unrealized P&L
  const totalUnrealizedPnl = openPositions.reduce((acc, pos) => {
    const singlePnl = pos.direction === 'Long'
      ? (pos.currentPrice - pos.entryPrice)
      : (pos.entryPrice - pos.currentPrice);
    return acc + (singlePnl * pos.quantity);
  }, 0);

  // Exit trigger handle
  const handleExit = (id: string) => {
    exitPosition(id);
  };

  // State for modifying SL/Tgt
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editSL, setEditSL] = useState<string>('');
  const [editTgt, setEditTgt] = useState<string>('');

  const handleEditRiskStart = (p: Position) => {
    setEditingPosId(p.id);
    setEditSL(p.stopLoss?.toString() || '');
    setEditTgt(p.target?.toString() || '');
  };

  const handleEditRiskSave = (id: string) => {
    modifySLTarget(id, editSL ? parseFloat(editSL) : undefined, editTgt ? parseFloat(editTgt) : undefined);
    setEditingPosId(null);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto w-full">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/5 gap-4">
        {[
          { key: 'open', label: `Open Positions (${openPositions.length})` },
          { key: 'closed', label: `Closed Logs (${closedPositions.length})` },
          { key: 'orders', label: `Order Book (${orders.length})` }
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
                layoutId="positionTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'open' && (
        <div className="space-y-4">
          {/* Summary Header */}
          <div className="bg-gradient-to-r from-white/3 to-white/1 border border-white/5 rounded-2xl p-4 md:p-6 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Total Unrealized P&L</span>
              <span className={`text-2xl font-display font-bold tabular-numbers block ${
                totalUnrealizedPnl >= 0 ? 'text-bull' : 'text-bear'
              }`}>
                {totalUnrealizedPnl >= 0 ? '+' : ''}₹{totalUnrealizedPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Positions count</span>
              <span className="text-lg font-bold text-white tabular-numbers mt-0.5 block">{openPositions.length}</span>
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
                <div key={pos.id} className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">{pos.symbol}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          pos.direction === 'Long' ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'
                        }`}>
                          {pos.direction}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 block tabular-numbers">
                        {pos.quantity} Qty • Entry ₹{pos.entryPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className={`block text-base font-bold tabular-numbers ${
                        isGreen ? 'text-bull' : 'text-bear'
                      }`}>
                        {isGreen ? '+' : ''}₹{pnlValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="block text-[10px] text-gray-500 tabular-numbers">
                        LTP: ₹{pos.currentPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Stop Loss & Target Display / Edit Mode */}
                  {editingPosId === pos.id ? (
                    <div className="bg-white/3 p-3 rounded-xl space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-gray-500 uppercase">Edit S/L</label>
                          <input
                            type="number"
                            value={editSL ?? ''}
                            onChange={e => setEditSL(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-gray-500 uppercase">Edit Target</label>
                          <input
                            type="number"
                            value={editTgt ?? ''}
                            onChange={e => setEditTgt(e.target.value)}
                            className="w-full bg-[#0b0e14] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingPosId(null)}
                          className="px-3 py-1 bg-white/5 rounded text-xs text-gray-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditRiskSave(pos.id)}
                          className="px-3 py-1 bg-sky-600 rounded text-xs text-white font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 text-[10px] text-gray-400 font-mono py-1 border-t border-b border-white/5">
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
                        className={`flex-1 font-medium py-2 rounded-xl text-xs transition transition-colors duration-200 ${
                          !isMarketOpen
                            ? 'bg-slate-800/40 text-gray-500 cursor-not-allowed border border-white/5'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer'
                        }`}
                        title={!isMarketOpen ? 'Indian markets are currently closed. Exiting positions is disabled.' : 'Exit position at market rate'}
                      >
                        {isMarketOpen ? 'Exit Position (Market)' : 'Markets Closed'}
                      </button>
                      <button
                        onClick={() => handleEditRiskStart(pos)}
                        disabled={!isMarketOpen}
                        className={`px-3 rounded-xl text-xs border border-white/5 transition flex items-center gap-1 ${
                          !isMarketOpen
                            ? 'bg-slate-800/20 text-gray-600 cursor-not-allowed'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer'
                        }`}
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
              <div className="text-center py-12 bg-white/2 border border-white/5 rounded-2xl text-gray-500 text-sm">
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
              <div key={pos.id} className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{pos.symbol}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        pos.direction === 'Long' ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'
                      }`}>
                        {pos.direction}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 block tabular-numbers">
                      {pos.quantity} Qty • Entry ₹{pos.entryPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className={`block text-base font-bold tabular-numbers ${
                      isWin ? 'text-bull' : 'text-bear'
                    }`}>
                      {isWin ? '+' : ''}₹{pos.realizedPnl?.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-gray-500 tabular-numbers">
                      Exit: ₹{pos.currentPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Hold Duration & Time stamp */}
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Closed {pos.closedTimestamp ? new Date(pos.closedTimestamp).toLocaleDateString() : 'Recently'}
                  </span>
                  <span>Simulation Duration: ~4.5 hours</span>
                </div>

                {/* Journal block shortcut CTA */}
                {!journalLogged ? (
                  <button
                    onClick={() => onJournalShortcut(pos)}
                    className="w-full py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-xl text-xs font-semibold border border-sky-500/10 transition flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Add to Trading Journal
                  </button>
                ) : (
                  <div className="w-full py-2 bg-emerald-500/5 text-emerald-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Entry Logged in Journal
                  </div>
                )}
              </div>
            );
          })}

          {closedPositions.length === 0 && (
            <div className="text-center py-12 bg-white/2 border border-white/5 rounded-2xl text-gray-500 text-sm">
              No closed logs found. Complete standard market exits to populate results.
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.map(ord => (
            <div key={ord.id} className="bg-white/2 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-white">{ord.symbol}</span>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    ord.direction === 'Buy' ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'
                  }`}>
                    {ord.direction}
                  </span>
                </div>
                <span className="text-xs text-gray-400 block tabular-numbers">
                  {ord.quantity} Qty • {ord.type}
                </span>
                <span className="text-[10px] text-gray-500 block font-mono">
                  {new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="text-right space-y-1">
                <span className="block text-xs font-semibold text-white font-mono tabular-numbers">
                  {ord.price ? `₹${ord.price}` : 'Market Price'}
                </span>
                <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  ord.status === 'Executed'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : ord.status === 'Pending'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {ord.status}
                </span>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12 bg-white/2 border border-white/5 rounded-2xl text-gray-500 text-sm">
              No orders placed in this session.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
