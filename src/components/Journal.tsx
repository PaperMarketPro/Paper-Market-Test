/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMainApp } from '../store';
import { getApiUrl } from '../config';
import { Position, EmotionTag, MistakeTag } from '../types';
import { 
  Plus, X, Search, Check, Sparkles, BrainCircuit, Bot
} from 'lucide-react';

interface JournalProps {
  preselectedPosition?: Position | null;
  onClearPreselected: () => void;
}

export const Journal: React.FC<JournalProps> = React.memo(({ preselectedPosition, onClearPreselected }) => {
  const { journals, positions, addJournalEntry, user, cognitiveRules } = useMainApp();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pnlFilter, setPnlFilter] = useState<'All' | 'Profits' | 'Losses'>('All');

  // Form states
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [entryReason, setEntryReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [emotions, setEmotions] = useState<EmotionTag[]>([]);
  const [mistakes, setMistakes] = useState<MistakeTag[]>([]);
  const [lessons, setLessons] = useState('');

  // Closed positions not yet journaled
  const unjournaledPositions = positions.filter(
    p => p.status === 'Closed' && !journals.some(j => j.positionId === p.id)
  );

  useEffect(() => {
    if (preselectedPosition) {
      setSelectedPosition(preselectedPosition);
      setShowModal(true);
      onClearPreselected();
    }
  }, [preselectedPosition, onClearPreselected]);

  const EMOTIONS: { tag: EmotionTag; emoji: string; color: string }[] = [
    { tag: 'Disciplined', emoji: '🧘', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { tag: 'Patient', emoji: '⏳', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { tag: 'FOMO', emoji: '😱', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { tag: 'Greedy', emoji: '🤑', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { tag: 'Fearful', emoji: '😨', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { tag: 'Revenge', emoji: '🔥', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { tag: 'Anxious', emoji: '🥺', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { tag: 'Overconfident', emoji: '😎', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  ];

  const MISTAKES: MistakeTag[] = [
    'Early Exit',
    'Late Exit',
    'Moved Stop Loss',
    'Oversized Position',
    'No Plan',
    'FOMO Entry',
    'Revenge Trade',
    'Broke Rules'
  ];

  const toggleEmotion = (tag: EmotionTag) => {
    setEmotions(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleMistake = (tag: MistakeTag) => {
    setMistakes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPosition(null);
    setEntryReason('');
    setExitReason('');
    setEmotions([]);
    setMistakes([]);
    setLessons('');
  };

  const handleAutoFillWithAI = async (pos: Position) => {
    setSelectedPosition(pos);
    setShowModal(true);
    setIsAiGenerating(true);

    try {
      const res = await fetch(getApiUrl('/api/journal/auto-generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: pos.symbol,
          direction: pos.direction,
          entryPrice: pos.entryPrice,
          exitPrice: pos.currentPrice,
          realizedPnl: pos.realizedPnl || 0,
          quantity: pos.quantity,
          closedTimestamp: pos.closedTimestamp,
          additionalNotes: 'Auto analyzed by AI Journal.',
          llmConfig: user?.llmConfig,
          cognitiveRules: cognitiveRules
        })
      });

      const resText = await res.text();
      let data: any = {};
      try { data = JSON.parse(resText); } catch (_) {}

      if (res.ok && data.success && data.entry) {
        const { entry } = data;
        setEntryReason(entry.entryReason || '');
        setExitReason(entry.exitReason || '');
        setEmotions(entry.emotionTags || []);
        setMistakes(entry.mistakeTags || []);
        setLessons(entry.lessonLearned || '');
      } else {
        throw new Error('Fallback to heuristic');
      }
    } catch (_) {
      const isWin = (pos.realizedPnl || 0) >= 0;
      setEntryReason(`Entered ${pos.direction} on ${pos.symbol} at ₹${pos.entryPrice} following momentum confirmation.`);
      setExitReason(isWin ? `Closed at ₹${pos.currentPrice} to lock in target profit.` : `Exited at ₹${pos.currentPrice} to respect stop-loss discipline.`);
      setEmotions(isWin ? ['Disciplined', 'Patient'] : ['Anxious']);
      setMistakes(isWin ? [] : ['Early Exit']);
      setLessons(`Stick to predefined stop-loss and target levels on ${pos.symbol} without mid-trade hesitation.`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = () => {
    if (!selectedPosition) return;
    addJournalEntry({
      positionId: selectedPosition.id,
      symbol: selectedPosition.symbol,
      direction: selectedPosition.direction,
      pnl: selectedPosition.realizedPnl || 0,
      entryReason: entryReason || `Entered ${selectedPosition.direction} at ₹${selectedPosition.entryPrice}`,
      exitReason: exitReason || `Exited at ₹${selectedPosition.currentPrice}`,
      emotionTags: emotions,
      mistakeTags: mistakes,
      lessonLearned: lessons || 'Follow risk management rules consistently.',
      notes: ''
    });
    handleCloseModal();
  };

  const filteredJournals = journals.filter(jr => {
    const matchesSearch =
      jr.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jr.entryReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jr.lessonLearned.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPnl =
      pnlFilter === 'All' || (pnlFilter === 'Profits' ? jr.pnl >= 0 : jr.pnl < 0);
    return matchesSearch && matchesPnl;
  });

  return (
    <div className="space-y-5 pb-20 max-w-4xl mx-auto w-full">
      {/* Unjournaled Closed Trades Banner */}
      {unjournaledPositions.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/15 text-blue-500 rounded-xl shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {unjournaledPositions.length} Closed {unjournaledPositions.length === 1 ? 'Trade' : 'Trades'} Ready to Journal
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                Click any trade below to auto-generate its journal entry with AI.
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {unjournaledPositions.slice(0, 3).map(pos => {
              const isProfit = (pos.realizedPnl || 0) >= 0;
              return (
                <button
                  key={pos.id}
                  onClick={() => handleAutoFillWithAI(pos)}
                  className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 hover:border-blue-500 rounded-xl py-1.5 px-3 flex items-center gap-2 text-left transition shrink-0 cursor-pointer"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">{pos.symbol}</span>
                    <span className={`text-[10px] font-mono font-semibold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isProfit ? '+' : ''}₹{pos.realizedPnl}
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-sm">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search symbol or lesson..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5 shrink-0">
            {(['All', 'Profits', 'Losses'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPnlFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  pnlFilter === tab
                    ? 'bg-white dark:bg-[#12182d] text-blue-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedPosition(unjournaledPositions[0] || null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Log Trade
        </button>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-3">
        {filteredJournals.map(entry => {
          const isWin = entry.pnl >= 0;
          return (
            <div
              key={entry.id}
              className="bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-3.5 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{entry.symbol}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      entry.direction === 'Long' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {entry.direction}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-gray-500 block mt-0.5">
                    {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <span className={`text-sm font-bold font-mono ${isWin ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isWin ? '+' : ''}₹{entry.pnl.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-mono block mb-1">Entry Reason</span>
                  <p className="text-slate-700 dark:text-gray-300 leading-relaxed">{entry.entryReason}</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-mono block mb-1">Exit Reason</span>
                  <p className="text-slate-700 dark:text-gray-300 leading-relaxed">{entry.exitReason}</p>
                </div>
              </div>

              {entry.lessonLearned && (
                <div className="bg-blue-500/5 border border-blue-500/15 p-3 rounded-xl text-xs flex items-start gap-2.5">
                  <BrainCircuit className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-blue-500 uppercase font-mono font-bold block">Key Takeaway</span>
                    <p className="text-slate-700 dark:text-gray-200 mt-0.5">{entry.lessonLearned}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {entry.emotionTags.map(tag => {
                  const matched = EMOTIONS.find(e => e.tag === tag);
                  return (
                    <span key={tag} className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${matched?.color || 'bg-white/5 text-gray-400'}`}>
                      {matched?.emoji} {tag}
                    </span>
                  );
                })}
                {entry.mistakeTags.map(tag => (
                  <span key={tag} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                    ⚠️ {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {filteredJournals.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 text-xs space-y-2">
            <Bot className="w-7 h-7 text-slate-400 mx-auto" />
            <p>No journal entries found.</p>
          </div>
        )}
      </div>

      {/* Simple Single-Step Journal Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl my-8"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-blue-500" />
                  Log Trade Reflection
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {unjournaledPositions.length === 0 && !selectedPosition ? (
                <div className="text-center py-8 text-slate-500 dark:text-gray-400 text-xs space-y-2">
                  <p>No closed trades waiting to be journaled.</p>
                  <p className="text-[11px] text-slate-400">Close an open position first to log your trade reflection.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {/* Trade Selector + AI Auto-Fill */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block">Closed Trade</label>
                      <select
                        value={selectedPosition?.id || ''}
                        onChange={e => {
                          const found = positions.find(p => p.id === e.target.value) || null;
                          setSelectedPosition(found);
                        }}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      >
                        {selectedPosition && !unjournaledPositions.some(p => p.id === selectedPosition.id) && (
                          <option value={selectedPosition.id} className="bg-white dark:bg-[#0c1020]">
                            {selectedPosition.symbol} ({selectedPosition.direction}) • P&L: ₹{selectedPosition.realizedPnl}
                          </option>
                        )}
                        {unjournaledPositions.map(pos => (
                          <option key={pos.id} value={pos.id} className="bg-white dark:bg-[#0c1020]">
                            {pos.symbol} ({pos.direction}) • P&L: ₹{pos.realizedPnl}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPosition && (
                      <button
                        type="button"
                        disabled={isAiGenerating}
                        onClick={() => handleAutoFillWithAI(selectedPosition)}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-sky-400 border border-blue-500/20 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isAiGenerating ? 'Analyzing...' : 'Auto-Fill with AI'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block">Entry Reason</label>
                      <textarea
                        rows={2}
                        value={entryReason}
                        onChange={e => setEntryReason(e.target.value)}
                        placeholder="Why did you enter this trade?"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase block">Exit Reason</label>
                      <textarea
                        rows={2}
                        value={exitReason}
                        onChange={e => setExitReason(e.target.value)}
                        placeholder="Why did you exit?"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase block">Key Takeaway / Lesson</label>
                    <textarea
                      rows={2}
                      value={lessons}
                      onChange={e => setLessons(e.target.value)}
                      placeholder="What rule will you follow next time?"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase block">Emotions Felt</label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOTIONS.map(e => {
                        const isSel = emotions.includes(e.tag);
                        return (
                          <button
                            type="button"
                            key={e.tag}
                            onClick={() => toggleEmotion(e.tag)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                              isSel
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400'
                            }`}
                          >
                            {e.emoji} {e.tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase block">Mistakes (If any)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {MISTAKES.map(tag => {
                        const isSel = mistakes.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => toggleMistake(tag)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                              isSel
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedPosition || isAiGenerating}
                      onClick={handleSave}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Save Entry
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
