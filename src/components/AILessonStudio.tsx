import React, { useState, useEffect } from 'react';
import { Lesson, Course } from '../types';
import {
  Pause,
  Volume2,
  VolumeX,
  ArrowRight,
  Target,
  BarChart2,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';

interface AILessonStudioProps {
  lesson: Lesson;
  course: Course;
  lang: 'English' | 'Hindi';
  onLanguageChange?: (lang: 'English' | 'Hindi') => void;
  onCompleteLesson: () => void;
}

export const AILessonStudio: React.FC<AILessonStudioProps> = ({
  lesson,
  course,
  lang,
  onLanguageChange,
  onCompleteLesson
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'practice' | 'quiz'>('notes');

  // Simple Candlestick preset state
  const [activePattern, setActivePattern] = useState<'hammer' | 'engulfing' | 'breakout'>('hammer');

  // Simple Options Payoff calculator state
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [strikePrice, setStrikePrice] = useState<number>(22000);
  const [optionPremium, setOptionPremium] = useState<number>(200);
  const [spotPrice, setSpotPrice] = useState<number>(22350);

  // Simple Risk / Position Size calculator state
  const [capital, setCapital] = useState<number>(100000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(500);
  const [stopLossPrice, setStopLossPrice] = useState<number>(490);

  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    setHasSpeechSupport(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    setSelectedOption(null);
    setQuizSubmitted(false);
    setActiveTab('notes');
  }, [lesson.id]);

  const handleToggleAudio = () => {
    if (!hasSpeechSupport) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const rawText = lang === 'Hindi' && lesson.contentHindi ? lesson.contentHindi : lesson.content;
      const cleanText = `${lesson.title}. ${rawText.replace(/[#\-*]/g, ' ')}`;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Preset Candlestick details
  const patternDetails = {
    hammer: {
      name: 'Hammer (Bullish Reversal)',
      open: 100,
      high: 104,
      low: 72,
      close: 103,
      desc: 'Forms after a decline. The long lower wick shows buyers stepped in strongly to push prices back up.'
    },
    engulfing: {
      name: 'Bullish Engulfing',
      open: 85,
      high: 128,
      low: 82,
      close: 124,
      desc: 'Strong upward candle that completely covers the prior red candle, signaling strong buying momentum.'
    },
    breakout: {
      name: 'Momentum Breakout',
      open: 92,
      high: 140,
      low: 90,
      close: 136,
      desc: 'Large green body closing near the high, showing decisive buyer control above resistance.'
    }
  }[activePattern];

  // Option Calculations
  const optionIntrinsic = optionType === 'CALL'
    ? Math.max(0, spotPrice - strikePrice)
    : Math.max(0, strikePrice - spotPrice);
  const netPnL = optionIntrinsic - optionPremium;
  const breakEven = optionType === 'CALL' ? strikePrice + optionPremium : strikePrice - optionPremium;

  // Position Sizing Calculations
  const maxRiskAmount = (capital * riskPct) / 100;
  const riskPerUnit = Math.max(1, Math.abs(entryPrice - stopLossPrice));
  const recommendedQty = Math.floor(maxRiskAmount / riskPerUnit);
  const targetPrice = entryPrice + riskPerUnit * 2;

  // Determine which single interactive tool to show based on course category
  const toolType: 'options' | 'candles' | 'risk' =
    course.category === 'Options'
      ? 'options'
      : course.category === 'Price Action' || lesson.title.toLowerCase().includes('candle')
      ? 'candles'
      : 'risk';

  const activeContent = lang === 'Hindi' && lesson.contentHindi ? lesson.contentHindi : lesson.content;

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Top Controls Bar: Language & Audio */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0b0e14] p-3 rounded-xl border border-white/10">
        {/* Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'notes'
                ? 'bg-sky-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Lesson Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'practice'
                ? 'bg-sky-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Interactive Tool</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'quiz'
                ? 'bg-sky-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Quick Quiz</span>
          </button>
        </div>

        {/* Language & Voice Controls */}
        <div className="flex items-center gap-2">
          {lesson.contentHindi && onLanguageChange && (
            <div className="flex items-center bg-[#121620] p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('English')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  lang === 'English' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('Hindi')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  lang === 'Hindi' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>
          )}

          {hasSpeechSupport && (
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isPlayingAudio
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" /> Listen
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: LESSON NOTES & KEY TAKEAWAYS */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
            <div className="bg-sky-500/5 p-4 rounded-xl border border-sky-500/15 space-y-2">
              <span className="text-xs font-bold text-sky-400 block">Key Takeaways</span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-200">
                {lesson.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-[#0b0e14] p-4 sm:p-5 rounded-xl border border-white/10 text-xs sm:text-sm text-gray-200 leading-relaxed space-y-3">
            {activeContent.split('\n\n').map((para, i) => {
              const trimmed = para.trim();
              if (!trimmed) return null;
              if (trimmed.startsWith('###')) {
                return (
                  <h4 key={i} className="text-sm font-bold text-white pt-2 border-b border-white/10 pb-1">
                    {trimmed.replace(/^###\s*/, '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('-')) {
                return (
                  <ul key={i} className="list-disc pl-5 space-y-1.5">
                    {trimmed.split('\n').map((item, j) => (
                      <li key={j} className="text-gray-300">
                        {item.replace(/^-\s*/, '').trim()}
                      </li>
                    ))}
                  </ul>
                );
              }
              return <p key={i}>{trimmed}</p>;
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE SIMPLE INTERACTIVE TOOL */}
      {activeTab === 'practice' && (
        <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/10 space-y-4">
          {toolType === 'candles' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-sky-400" /> Select Candlestick Pattern
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['hammer', 'engulfing', 'breakout'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActivePattern(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition border ${
                        activePattern === type
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-[#121620] text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[#121620] p-4 rounded-xl border border-white/5">
                <div className="flex flex-col items-center justify-center">
                  <svg className="w-28 h-36" viewBox="0 0 120 140">
                    {(() => {
                      const getY = (price: number) => 125 - Math.max(0, Math.min(1, (price - 60) / 90)) * 105;
                      const yHigh = getY(patternDetails.high);
                      const yLow = getY(patternDetails.low);
                      const yOpen = getY(patternDetails.open);
                      const yClose = getY(patternDetails.close);
                      const yTop = Math.min(yOpen, yClose);
                      const bodyH = Math.max(8, Math.abs(yClose - yOpen));
                      return (
                        <>
                          <line x1="60" y1={yHigh} x2="60" y2={yLow} stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                          <rect x="42" y={yTop} width="36" height={bodyH} fill="#10b981" rx="3" />
                        </>
                      );
                    })()}
                  </svg>
                  <div className="grid grid-cols-4 gap-1.5 w-full text-center text-[11px] font-mono pt-2 border-t border-white/5">
                    <div>
                      <span className="text-gray-500 block text-[9px]">OPEN</span>
                      <span className="text-white font-bold">₹{patternDetails.open}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px]">HIGH</span>
                      <span className="text-emerald-400 font-bold">₹{patternDetails.high}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px]">LOW</span>
                      <span className="text-rose-400 font-bold">₹{patternDetails.low}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px]">CLOSE</span>
                      <span className="text-emerald-400 font-bold">₹{patternDetails.close}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">{patternDetails.name}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{patternDetails.desc}</p>
                  <div className="p-2.5 bg-sky-500/10 rounded-lg border border-sky-500/20 text-xs text-sky-200 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Always wait for the candle to close before taking a trade entry.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {toolType === 'options' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#121620] p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Option Type</span>
                  <div className="flex bg-[#0b0e14] p-0.5 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setOptionType('CALL')}
                      className={`px-3 py-1 rounded text-xs font-bold transition ${
                        optionType === 'CALL' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      CALL (CE)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptionType('PUT')}
                      className={`px-3 py-1 rounded text-xs font-bold transition ${
                        optionType === 'PUT' ? 'bg-rose-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      PUT (PE)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>Strike Price</span>
                    <span className="font-mono font-bold text-white">₹{strikePrice}</span>
                  </div>
                  <input
                    type="range"
                    min="21000"
                    max="23000"
                    step="100"
                    value={strikePrice}
                    onChange={(e) => setStrikePrice(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>Premium Paid</span>
                    <span className="font-mono font-bold text-amber-400">₹{optionPremium}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={optionPremium}
                    onChange={(e) => setOptionPremium(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>Market Expiry Price</span>
                    <span className="font-mono font-bold text-sky-400">₹{spotPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="21000"
                    max="23000"
                    step="50"
                    value={spotPrice}
                    onChange={(e) => setSpotPrice(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>

              <div className="bg-[#121620] p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                <span className="font-bold text-white text-xs">Payoff Summary</span>
                <div className="space-y-2 bg-[#0b0e14] p-3 rounded-lg border border-white/5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Break-Even Price:</span>
                    <span className="font-bold text-amber-400">₹{breakEven}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intrinsic Value:</span>
                    <span className="font-bold text-white">₹{optionIntrinsic}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="font-bold text-gray-200">Net P&L per unit:</span>
                    <span className={`font-bold text-sm ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {netPnL >= 0 ? `+₹${netPnL}` : `-₹${Math.abs(netPnL)}`}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  {optionType === 'CALL'
                    ? 'Calls profit when market rises above Strike + Premium.'
                    : 'Puts profit when market falls below Strike - Premium.'}
                </p>
              </div>
            </div>
          )}

          {toolType === 'risk' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#121620] p-4 rounded-xl border border-white/5 space-y-3">
                <span className="font-bold text-white block">Position Size Calculator</span>
                <div>
                  <label className="text-gray-400 block mb-1">Account Capital (₹)</label>
                  <input
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(Number(e.target.value) || 0)}
                    className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">Risk %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={riskPct}
                      onChange={(e) => setRiskPct(Number(e.target.value) || 1)}
                      className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-sky-400 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Entry (₹)</label>
                    <input
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                      className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Stop Loss</label>
                    <input
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value) || 0)}
                      className="w-full bg-[#0b0e14] border border-white/10 rounded-lg px-2.5 py-1.5 text-rose-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#121620] p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3">
                <span className="font-bold text-white">Safe Order Sizing</span>
                <div className="space-y-2 bg-[#0b0e14] p-3 rounded-lg border border-white/5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Risk Allowed:</span>
                    <span className="text-rose-400 font-bold">₹{maxRiskAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">1:2 Target Price:</span>
                    <span className="text-emerald-400 font-bold">₹{targetPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-gray-200 font-bold">Safe Quantity:</span>
                    <span className="text-sky-400 font-bold text-sm">{recommendedQty} Shares</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Keeping risk at 1%–2% per trade protects your account from large losing streaks.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUICK QUIZ */}
      {activeTab === 'quiz' && (
        <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" /> Quick Knowledge Check
            </span>
            <span className="text-xs text-amber-400 font-mono font-bold">+20 XP</span>
          </div>

          <p className="text-xs sm:text-sm text-gray-200 font-medium">
            What is the most important rule for long-term survival in trading?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              'Strict position sizing and honoring stop-loss levels',
              'Using 100% capital on a single high-conviction trade',
              'Averaging down into losing option positions',
              'Trading without a predefined exit plan'
            ].map((opt, oIdx) => {
              const isSelected = selectedOption === oIdx;
              const isCorrect = oIdx === 0;

              let btnClass = 'bg-[#121620] border-white/10 hover:border-sky-500 text-gray-300';
              if (quizSubmitted) {
                if (isCorrect) btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                else if (isSelected) btnClass = 'bg-rose-500/20 border-rose-500 text-rose-300';
              }

              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => {
                    setSelectedOption(oIdx);
                    setQuizSubmitted(true);
                  }}
                  className={`p-3 rounded-lg border text-left transition ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className="bg-sky-500/10 p-3 rounded-lg border border-sky-500/20 text-xs text-sky-200 flex items-center justify-between gap-2">
              <span>
                {selectedOption === 0
                  ? 'Correct! Risk management is the foundation of trading.'
                  : 'Remember: Protecting capital with stop-losses and sizing comes first.'}
              </span>
              <button
                type="button"
                onClick={onCompleteLesson}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shrink-0"
              >
                Next Lesson <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
