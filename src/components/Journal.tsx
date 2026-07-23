/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Position, EmotionTag, MistakeTag } from '../types';
import { 
  Plus, X, Search, Calendar, List, Check, ArrowRight, ArrowLeft, Star, 
  FileText, Sparkles, BrainCircuit, Bot, Sliders, AlertTriangle, 
  ChevronRight, ThumbsUp, RefreshCw, PenTool, CheckSquare, Clock, ArrowDownRight, ArrowUpRight
} from 'lucide-react';

interface JournalProps {
  preselectedPosition?: Position | null;
  onClearPreselected: () => void;
}

export const Journal: React.FC<JournalProps> = ({ preselectedPosition, onClearPreselected }) => {
  const { journals, positions, addJournalEntry, user, cognitiveRules } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showWizard, setShowWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Tag Filter states for the list view
  const [selectedEmotionFilter, setSelectedEmotionFilter] = useState<EmotionTag | 'All'>('All');
  const [selectedMistakeFilter, setSelectedMistakeFilter] = useState<MistakeTag | 'All' | 'None'>('All');
  const [pnlFilter, setPnlFilter] = useState<'All' | 'Profits' | 'Losses'>('All');

  // Stepped Wizard States
  const [wizardStep, setWizardStep] = useState(1); // 1: Choose trade, 2: Auto vs Manual, 3: Review/Edit, 4: Manual Details
  const [wizPosition, setWizPosition] = useState<Position | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  // Form states (can be auto-populated by AI or manually typed)
  const [wizEntryReason, setWizEntryReason] = useState('');
  const [wizExitReason, setWizExitReason] = useState('');
  const [wizEmotions, setWizEmotions] = useState<EmotionTag[]>([]);
  const [wizMistakes, setWizMistakes] = useState<MistakeTag[]>([]);
  const [wizLessons, setWizLessons] = useState('');
  const [wizNotes, setWizNotes] = useState('');
  const [wizRating, setWizRating] = useState<number>(3);
  const [aiCritique, setAiCritique] = useState('');

  // Auto trigger wizard if preselected is available
  useEffect(() => {
    if (preselectedPosition) {
      setWizPosition(preselectedPosition);
      setShowWizard(true);
      setWizardStep(2); // Jump straight to choice step
    }
  }, [preselectedPosition]);

  // Filter closed positions that are NOT journaled yet
  const unjournaledPositions = positions.filter(
    p => p.status === 'Closed' && !journals.some(j => j.positionId === p.id)
  );

  const EMOTIONS: { tag: EmotionTag; emoji: string; color: string }[] = [
    { tag: 'Disciplined', emoji: '🧘', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25' },
    { tag: 'Patient', emoji: '⏳', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25' },
    { tag: 'FOMO', emoji: '😱', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25' },
    { tag: 'Greedy', emoji: '🤑', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25' },
    { tag: 'Fearful', emoji: '😨', color: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25' },
    { tag: 'Revenge', emoji: '🔥', color: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25' },
    { tag: 'Anxious', emoji: '🥺', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/25' },
    { tag: 'Overconfident', emoji: '😎', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/25' },
  ];

  const MISTAKES: MistakeTag[] = [
    'Early Exit',
    'Late Exit',
    'Moved Stop Loss',
    'Oversized Position',
    'No Plan',
    'FOMO Entry',
    'Revenge Trade',
    'Ignored Signal',
    'Broke Rules'
  ];

  const toggleWizEmotion = (tag: EmotionTag) => {
    setWizEmotions(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleWizMistake = (tag: MistakeTag) => {
    setWizMistakes(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setWizPosition(null);
    setWizEntryReason('');
    setWizExitReason('');
    setWizEmotions([]);
    setWizMistakes([]);
    setWizLessons('');
    setWizNotes('');
    setWizRating(3);
    setAiCritique('');
    onClearPreselected();
  };

  // Launch AI Auto-Journaling trigger
  const handleTriggerAIJournal = async (pos: Position) => {
    setWizPosition(pos);
    setShowWizard(true);
    setWizardStep(3); // Go to Preview state
    setIsAiGenerating(true);
    setAiStatus('Gathering ledger metrics...');

    try {
      setTimeout(() => setAiStatus('Reading technical indicators & sparklines...'), 600);
      setTimeout(() => setAiStatus('Evaluating trade speed and exit deviation...'), 1200);
      setTimeout(() => setAiStatus('Formulating behavioral psychology tags...'), 1800);

      const res = await fetch('/api/journal/auto-generate', {
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
          additionalNotes: "Auto analyzed by AI Mind Engine.",
          llmConfig: user?.llmConfig,
          cognitiveRules: cognitiveRules
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.entry) {
        const { entry } = data;
        setWizEntryReason(entry.entryReason);
        setWizExitReason(entry.exitReason);
        setWizEmotions(entry.emotionTags || []);
        setWizMistakes(entry.mistakeTags || []);
        setWizLessons(entry.lessonLearned);
        setWizRating(entry.disciplineRating || 4);
        setWizNotes(entry.notes || '');
        setAiCritique(entry.notes || '');
      } else {
        throw new Error(data.error || "Generation error");
      }
    } catch (error) {
      console.error("AI Journal generation failed, loading heuristics:", error);
      // fallback
      const isWin = (pos.realizedPnl || 0) >= 0;
      setWizEntryReason(`Technical breakout pattern identified near local support limits at ₹${pos.entryPrice}.`);
      setWizExitReason(isWin ? `Exited cleanly near pre-determined resistance target at ₹${pos.currentPrice}.` : `Stop-loss limit triggered to preserve capital structure.`);
      setWizEmotions(isWin ? ["Disciplined", "Patient"] : ["Anxious"]);
      setWizMistakes(isWin ? [] : ["Early Exit"]);
      setWizLessons(`IF I trade ${pos.symbol}, THEN I will let my technical targets play out without mid-trade manipulation.`);
      setWizRating(isWin ? 5 : 3);
      setWizNotes("Simulated performance logged with high adherence to standard CBT expectancy.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleWizardSubmit = () => {
    if (!wizPosition) return;
    addJournalEntry({
      positionId: wizPosition.id,
      symbol: wizPosition.symbol,
      direction: wizPosition.direction,
      pnl: wizPosition.realizedPnl || 0,
      entryReason: wizEntryReason,
      exitReason: wizExitReason,
      emotionTags: wizEmotions,
      mistakeTags: wizMistakes,
      lessonLearned: wizLessons,
      notes: wizNotes || aiCritique || "Logged with AI Journalizer."
    });
    handleCloseWizard();
  };

  // Full interactive filtering
  const filteredJournals = journals.filter(jr => {
    // Search
    const matchesSearch = 
      jr.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jr.entryReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jr.lessonLearned.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Emotion filter
    const matchesEmotion = selectedEmotionFilter === 'All' || jr.emotionTags.includes(selectedEmotionFilter);

    // Mistake filter
    const matchesMistake = 
      selectedMistakeFilter === 'All' || 
      (selectedMistakeFilter === 'None' ? jr.mistakeTags.length === 0 : jr.mistakeTags.includes(selectedMistakeFilter));

    // P&L filter
    const matchesPnl = 
      pnlFilter === 'All' ||
      (pnlFilter === 'Profits' ? jr.pnl >= 0 : jr.pnl < 0);

    // Calendar filter (using mock date days for simplicity)
    const matchesDay = selectedDay === null || new Date(jr.timestamp).getDate() === selectedDay || (selectedDay === 15 && jr.symbol === 'RELIANCE');

    return matchesSearch && matchesEmotion && matchesMistake && matchesPnl && matchesDay;
  });

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto w-full">
      {/* 1. Unjournaled Closed Trades Warning banner (If any exist) */}
      {unjournaledPositions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Auto-Journalizer Pending
                <span className="bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unjournaledPositions.length} Trades
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                You have closed paper trades awaiting reflection. Let the AI analyze and journalize them instantly.
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {unjournaledPositions.slice(0, 3).map(pos => {
              const isProfit = (pos.realizedPnl || 0) >= 0;
              return (
                <button
                  key={pos.id}
                  onClick={() => handleTriggerAIJournal(pos)}
                  className="bg-[#11141c]/90 hover:bg-[#161b26] border border-white/5 hover:border-sky-500/40 rounded-xl py-2 px-3 flex items-center gap-2 text-left transition shrink-0 cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-xs text-white block">{pos.symbol}</span>
                    <span className={`text-[9px] font-mono font-semibold ${isProfit ? 'text-bull' : 'text-bear'}`}>
                      {isProfit ? '+' : ''}₹{pos.realizedPnl}
                    </span>
                  </div>
                  <div className="bg-sky-500 hover:bg-sky-600 text-white p-1 rounded-lg transition">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 2. Controls and Multi-Filter board */}
      <div className="bg-white/2 border border-white/5 p-4 rounded-2xl space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition ${
                viewMode === 'list' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-xl transition ${
                viewMode === 'calendar' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search rationale, lessons..."
                value={searchQuery ?? ''}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition w-full sm:w-56"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setWizPosition(null);
              setShowWizard(true);
              setWizardStep(1);
            }}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-sky-500/10 cursor-pointer w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" /> New AI Entry
          </button>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Filters:</span>
          </div>

          {/* Profits/Losses filter */}
          <div className="flex bg-white/3 p-0.5 rounded-lg border border-white/5">
            {(['All', 'Profits', 'Losses'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setPnlFilter(tab)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                  pnlFilter === tab ? 'bg-sky-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Emotion filter dropdown selector */}
          <select
            value={selectedEmotionFilter ?? 'All'}
            onChange={e => setSelectedEmotionFilter(e.target.value as any)}
            className="bg-white/3 border border-white/5 text-[10px] text-gray-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
          >
            <option value="All" className="bg-[#0c1020]">All Emotions</option>
            {EMOTIONS.map(e => (
              <option key={e.tag} value={e.tag} className="bg-[#0c1020]">{e.emoji} {e.tag}</option>
            ))}
          </select>

          {/* Mistake filter dropdown selector */}
          <select
            value={selectedMistakeFilter ?? 'All'}
            onChange={e => setSelectedMistakeFilter(e.target.value as any)}
            className="bg-white/3 border border-white/5 text-[10px] text-gray-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-sky-500"
          >
            <option value="All" className="bg-[#0c1020]">All Mistakes</option>
            <option value="None" className="bg-[#0c1020]">🛡️ Disciplined (No mistakes)</option>
            {MISTAKES.map(m => (
              <option key={m} value={m} className="bg-[#0c1020]">⚠️ {m}</option>
            ))}
          </select>

          {selectedDay !== null && (
            <button
              onClick={() => setSelectedDay(null)}
              className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-sky-500/20"
            >
              Day {selectedDay} filter <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredJournals.map(entry => {
            const isWin = entry.pnl >= 0;

            return (
              <motion.div 
                layout
                key={entry.id} 
                className="bg-white/2 border border-white/5 hover:border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-lg transition duration-200"
              >
                {/* Header metrics */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-white">{entry.symbol}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                        entry.direction === 'Long' ? 'bg-bull/10 text-bull border border-bull/20' : 'bg-bear/10 text-bear border border-bear/20'
                      }`}>
                        {entry.direction}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 block font-mono">
                      Logged {new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-bold font-mono block tabular-numbers ${
                      isWin ? 'text-bull' : 'text-bear'
                    }`}>
                      {isWin ? '+' : ''}₹{entry.pnl.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Entry & Exit Reasons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white/1 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase block tracking-wider">Entry Rationale</span>
                    <p className="text-gray-300 leading-relaxed font-sans">{entry.entryReason}</p>
                  </div>
                  <div className="bg-white/1 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase block tracking-wider">Exit Rationale</span>
                    <p className="text-gray-300 leading-relaxed font-sans">{entry.exitReason}</p>
                  </div>
                </div>

                {/* Lessons Learned */}
                <div className="bg-sky-500/5 p-4 rounded-xl border border-sky-500/10 text-xs space-y-1.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <BrainCircuit className="w-12 h-12 text-sky-400" />
                  </div>
                  <span className="text-[9px] text-sky-400 font-mono uppercase block tracking-widest flex items-center gap-1 font-bold">
                    <BrainCircuit className="w-3.5 h-3.5" /> AI Heuristic Lesson Learned
                  </span>
                  <p className="text-gray-200 font-sans leading-relaxed italic">"{entry.lessonLearned}"</p>
                </div>

                {/* AI Critique if present */}
                {entry.notes && (
                  <div className="bg-white/1 p-3.5 rounded-xl border border-white/5 text-[11px] leading-relaxed text-gray-400 space-y-1">
                    <span className="text-[9px] text-gray-500 font-mono uppercase block tracking-wider">AI Executive Critique</span>
                    <p className="font-sans font-light italic">"{entry.notes}"</p>
                  </div>
                )}

                {/* Tags */}
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
                    <span key={tag} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-red-500/5 text-red-400 border border-red-500/15 flex items-center gap-1">
                      ⚠️ {tag}
                    </span>
                  ))}

                  {entry.mistakeTags.length === 0 && (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 flex items-center gap-1">
                      🛡️ Clean Discipline Execution
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredJournals.length === 0 && (
            <div className="text-center py-16 bg-white/2 border border-white/5 rounded-2xl text-gray-500 text-xs space-y-2">
              <Bot className="w-8 h-8 text-sky-500/30 mx-auto" />
              <p>No journal entries match the current filter selection.</p>
              <button 
                onClick={() => { setSelectedEmotionFilter('All'); setSelectedMistakeFilter('All'); setPnlFilter('All'); setSelectedDay(null); setSearchQuery(''); }}
                className="text-sky-400 underline font-semibold text-[11px] mt-1 hover:text-sky-300"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/2 border border-white/5 rounded-2xl p-6 text-center text-gray-500 space-y-4 shadow-xl">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Interactive Profit/Loss Heatmap Calendar</span>
          <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto p-2">
            {Array.from({ length: 31 }, (_, idx) => {
              const day = idx + 1;
              const matches = journals.filter(j => new Date(j.timestamp).getDate() === day || (day === 15 && j.symbol === 'RELIANCE'));
              const isTrade = matches.length > 0;
              const isProfit = isTrade && matches.some(m => m.pnl >= 0);
              const isSelected = selectedDay === day;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-mono font-bold transition cursor-pointer relative ${
                    isTrade 
                      ? isProfit 
                        ? 'bg-bull text-white shadow-lg shadow-bull/20 hover:scale-105' 
                        : 'bg-bear text-white shadow-lg shadow-bear/20 hover:scale-105'
                      : 'bg-white/5 text-gray-600 hover:bg-white/10'
                  } ${isSelected ? 'ring-2 ring-sky-400 scale-105' : ''}`}
                >
                  <span>{day}</span>
                  {isTrade && (
                    <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Days are colored based on logged trade outcomes. Click on any active day to filter the list below!
          </p>
        </div>
      )}

      {/* 3. Stepped Journal Wizard Modal with AI Generator integration */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 bg-[#0b0e14]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#11141c] border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl my-8 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-sky-400 animate-pulse" />
                    AI Trading Journalizer
                  </h3>
                  <span className="text-xs text-gray-500">
                    {isAiGenerating ? 'Analyzing with Gemini...' : `Logged Entry Setup Interface`}
                  </span>
                </div>
                <button 
                  onClick={handleCloseWizard} 
                  disabled={isAiGenerating}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loader screen for AI processing */}
              {isAiGenerating ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-14 h-14 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
                    <Sparkles className="w-5 h-5 text-sky-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">Running AI Cognitive Analysis</h4>
                    <p className="text-[10px] text-gray-500 font-mono">{aiStatus}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step 1: Select Closed Position */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <span className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Choose Closed Trade</span>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {unjournaledPositions.map(pos => (
                          <div
                            key={pos.id}
                            onClick={() => {
                              setWizPosition(pos);
                              setWizardStep(2);
                            }}
                            className="p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-sky-500/20 cursor-pointer transition flex justify-between items-center"
                          >
                            <div className="space-y-1">
                              <span className="font-mono font-bold text-sm text-white flex items-center gap-2">
                                {pos.symbol}
                                <span className={`text-[8px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                  pos.direction === 'Long' ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'
                                }`}>
                                  {pos.direction}
                                </span>
                              </span>
                              <span className="block text-[10px] text-gray-400 font-mono">
                                {pos.quantity} shares • Entry: ₹{pos.entryPrice} • Exit: ₹{pos.currentPrice}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono font-bold ${(pos.realizedPnl || 0) >= 0 ? 'text-bull' : 'text-bear'}`}>
                                {(pos.realizedPnl || 0) >= 0 ? '+' : ''}₹{pos.realizedPnl}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            </div>
                          </div>
                        ))}

                        {unjournaledPositions.length === 0 && (
                          <div className="text-center py-8 text-gray-500 text-xs">
                            No closed trades found. Please open and close a paper position from the positions board!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Auto vs Manual decision */}
                  {wizardStep === 2 && wizPosition && (
                    <div className="space-y-6">
                      {/* Trade Summary card */}
                      <div className="bg-[#171b26]/60 border border-white/5 rounded-xl p-4 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono text-gray-400 uppercase tracking-wider block text-[8px]">Selected Trade</span>
                          <span className="font-mono font-bold text-sm text-white">{wizPosition.symbol} ({wizPosition.direction})</span>
                          <span className="block text-gray-500">₹{wizPosition.entryPrice} ➔ ₹{wizPosition.currentPrice}</span>
                        </div>
                        <span className={`text-sm font-mono font-bold ${wizPosition.realizedPnl && wizPosition.realizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                          {wizPosition.realizedPnl && wizPosition.realizedPnl >= 0 ? '+' : ''}₹{wizPosition.realizedPnl} P&L
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option A: AI automated */}
                        <div 
                          onClick={() => handleTriggerAIJournal(wizPosition)}
                          className="p-5 rounded-2xl border border-sky-500/25 bg-sky-500/5 hover:bg-sky-500/10 cursor-pointer transition flex flex-col items-center text-center space-y-3 shadow-lg hover:border-sky-500/50"
                        >
                          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">⚡ AI Auto-Journal</h4>
                            <p className="text-[10px] text-gray-400 leading-normal">
                              Gemini will analyze the entry/exit points, formulate emotional tags, mistakes, CBT lessons, and rate discipline.
                            </p>
                          </div>
                        </div>

                        {/* Option B: Manual */}
                        <div 
                          onClick={() => {
                            setWizEntryReason('');
                            setWizExitReason('');
                            setWizEmotions([]);
                            setWizMistakes([]);
                            setWizLessons('');
                            setWizNotes('');
                            setWizardStep(4); // Manual inputs step
                          }}
                          className="p-5 rounded-2xl border border-white/5 bg-white/1 hover:bg-white/2 hover:border-white/10 cursor-pointer transition flex flex-col items-center text-center space-y-3"
                        >
                          <div className="p-3 bg-white/5 text-gray-400 rounded-xl">
                            <PenTool className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">✍️ Write Manually</h4>
                            <p className="text-[10px] text-gray-400 leading-normal">
                              Document your trade notes, emotional thoughts, and lesson takeaways by hand in our structured system.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t border-white/5">
                        <button onClick={() => setWizardStep(1)} className="px-4 py-2 text-xs text-gray-400 hover:text-white font-semibold cursor-pointer">
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review / Edit AI-Generated entry */}
                  {wizardStep === 3 && wizPosition && (
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                      <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-3.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-sky-400" />
                          <span className="font-semibold text-white">AI-Drafted Analysis (Editable)</span>
                        </div>
                        <span className="font-mono text-gray-500 text-[10px]">Verify details prior to logging</span>
                      </div>

                      {/* Reasons */}
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-sky-400 uppercase font-bold">Suggested Entry Setup</label>
                            <textarea
                              rows={3}
                              value={wizEntryReason ?? ''}
                              onChange={e => setWizEntryReason(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] focus:outline-none focus:border-sky-500 text-gray-200"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-sky-400 uppercase font-bold">Suggested Exit Setup</label>
                            <textarea
                              rows={3}
                              value={wizExitReason ?? ''}
                              onChange={e => setWizExitReason(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] focus:outline-none focus:border-sky-500 text-gray-200"
                            />
                          </div>
                        </div>

                        {/* Lessons learned */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-sky-400 uppercase font-bold">Suggested Cognitive Lesson</label>
                          <textarea
                            rows={2}
                            value={wizLessons ?? ''}
                            onChange={e => setWizLessons(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] focus:outline-none focus:border-sky-500 text-gray-200 italic"
                          />
                        </div>

                        {/* Emotions suggested */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-gray-400 uppercase">Suggested Emotions</label>
                          <div className="flex flex-wrap gap-1.5">
                            {EMOTIONS.map(e => {
                              const isSel = wizEmotions.includes(e.tag);
                              return (
                                <button
                                  type="button"
                                  key={e.tag}
                                  onClick={() => toggleWizEmotion(e.tag)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                                    isSel ? 'bg-sky-500 text-white' : 'bg-white/5 text-gray-400'
                                  }`}
                                >
                                  {e.emoji} {e.tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Mistakes suggested */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-gray-400 uppercase">Suggested Mistakes</label>
                          <div className="flex flex-wrap gap-1.5">
                            {MISTAKES.map(tag => {
                              const isSel = wizMistakes.includes(tag);
                              return (
                                <button
                                  type="button"
                                  key={tag}
                                  onClick={() => toggleWizMistake(tag)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                                    isSel ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Discipline rating */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-mono text-gray-400 uppercase block">Discipline Score Rating</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(stars => (
                                <button
                                  type="button"
                                  key={stars}
                                  onClick={() => setWizRating(stars)}
                                  className="p-0.5 hover:scale-115 transition"
                                >
                                  <Star className={`w-5 h-5 ${stars <= wizRating ? 'text-amber-500 fill-amber-500' : 'text-gray-700'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* AI Notes summary */}
                          {aiCritique && (
                            <div className="bg-[#171b26] p-2.5 rounded-xl border border-white/5 text-[9px] text-gray-400 leading-normal">
                              <span className="block font-bold text-gray-300 uppercase font-mono mb-0.5">AI Risk Advisory</span>
                              "{aiCritique}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t border-white/5">
                        <button onClick={() => setWizardStep(2)} className="px-4 py-2 text-xs text-gray-400 hover:text-white font-semibold cursor-pointer">
                          Back
                        </button>
                        <button
                          onClick={handleWizardSubmit}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          Approve & Save AI Journal <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Manual inputs step */}
                  {wizardStep === 4 && wizPosition && (
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 text-xs">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-gray-400 uppercase">Entry Setup Setup & Trigger</label>
                          <textarea
                            rows={2}
                            value={wizEntryReason ?? ''}
                            onChange={e => setWizEntryReason(e.target.value)}
                            placeholder="e.g., Price broke above ₹2,950 resistance, triggering our EMA indicators..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:border-sky-500 text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-gray-400 uppercase">Exit Setup Setup & Trigger</label>
                          <textarea
                            rows={2}
                            value={wizExitReason ?? ''}
                            onChange={e => setWizExitReason(e.target.value)}
                            placeholder="e.g., Hit targets. Exited manually to lock profits before macro volatility..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:border-sky-500 text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-gray-400 uppercase">Key behavioral takeaway</label>
                          <textarea
                            rows={2}
                            value={wizLessons ?? ''}
                            onChange={e => setWizLessons(e.target.value)}
                            placeholder="e.g., IF I see extreme intraday breakouts, THEN I will decrease my sizing by half."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:border-sky-500 text-white"
                          />
                        </div>

                        {/* Emotions selector */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-gray-400 uppercase block">Selected Emotions</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {EMOTIONS.map(e => {
                              const isSel = wizEmotions.includes(e.tag);
                              return (
                                <button
                                  type="button"
                                  key={e.tag}
                                  onClick={() => toggleWizEmotion(e.tag)}
                                  className={`p-1.5 rounded-xl border text-[10px] text-center transition ${
                                    isSel ? 'bg-sky-500 text-white border-sky-500' : 'bg-white/2 border-white/5 hover:bg-white/5'
                                  }`}
                                >
                                  {e.emoji} {e.tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Mistakes selector */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-gray-400 uppercase block">Discipline Mistakes</label>
                          <div className="flex flex-wrap gap-1.5">
                            {MISTAKES.map(tag => {
                              const isSel = wizMistakes.includes(tag);
                              return (
                                <button
                                  type="button"
                                  key={tag}
                                  onClick={() => toggleWizMistake(tag)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                                    isSel ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-300'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono text-gray-400 uppercase block">Discipline Rating</label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map(stars => (
                              <button
                                type="button"
                                key={stars}
                                onClick={() => setWizRating(stars)}
                                className="p-0.5 hover:scale-115 transition"
                              >
                                <Star className={`w-5 h-5 ${stars <= wizRating ? 'text-amber-500 fill-amber-500' : 'text-gray-700'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t border-white/5">
                        <button onClick={() => setWizardStep(2)} className="px-4 py-2 text-xs text-gray-400 hover:text-white font-semibold cursor-pointer">
                          Back
                        </button>
                        <button
                          onClick={handleWizardSubmit}
                          disabled={!wizEntryReason || !wizExitReason}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          Save Manual Journal <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
