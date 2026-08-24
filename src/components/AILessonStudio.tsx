import React, { useState, useEffect } from 'react';
import { Lesson, Course } from '../types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Activity,
  ArrowRight,
  Target,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  Sliders
} from 'lucide-react';

interface AILessonStudioProps {
  lesson: Lesson;
  course: Course;
  lang: 'English' | 'Hindi';
  onCompleteLesson: () => void;
}

export const AILessonStudio: React.FC<AILessonStudioProps> = ({
  lesson,
  course,
  lang,
  onCompleteLesson
}) => {
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'simulation' | 'notes' | 'quiz'>('simulation');

  // Candlestick simulator states
  const [openPrice, setOpenPrice] = useState<number>(100);
  const [highPrice, setHighPrice] = useState<number>(125);
  const [lowPrice, setLowPrice] = useState<number>(75);
  const [closePrice, setClosePrice] = useState<number>(118);
  const [isCandleAnimating, setIsCandleAnimating] = useState(false);
  const [candleProgress, setCandleProgress] = useState(100);
  const [activePattern, setActivePattern] = useState<'hammer' | 'engulfing' | 'breakout' | 'custom'>('custom');

  // Options Payoff simulator
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [strikePrice, setStrikePrice] = useState<number>(22000);
  const [optionPremium, setOptionPremium] = useState<number>(200);
  const [spotPrice, setSpotPrice] = useState<number>(22350);

  // Risk / Position Size calculator
  const [capital, setCapital] = useState<number>(100000);
  const [riskPct, setRiskPct] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(500);
  const [stopLossPrice, setStopLossPrice] = useState<number>(490);

  // Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSpeechSupport(true);
    } else {
      setHasSpeechSupport(false);
    }
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
    setActiveTab('simulation');
  }, [lesson.id]);

  const handleToggleAudio = () => {
    if (!hasSpeechSupport) return;

    if (isPlayingAudio) {
      window.speechSynthesis.pause();
      setIsPlayingAudio(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlayingAudio(true);
      } else {
        window.speechSynthesis.cancel();
        // Clean text for speech
        const rawText = lang === 'Hindi' && lesson.contentHindi ? lesson.contentHindi : lesson.content;
        const cleanText = `${lesson.title}. ${rawText.replace(/[#\-\*]/g, ' ')}`;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = speechRate;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  // Preset Candlestick Loader
  const loadPreset = (type: 'hammer' | 'engulfing' | 'breakout') => {
    setActivePattern(type);
    if (type === 'hammer') {
      setOpenPrice(100);
      setHighPrice(104);
      setLowPrice(65);
      setClosePrice(102);
    } else if (type === 'engulfing') {
      setOpenPrice(80);
      setHighPrice(135);
      setLowPrice(78);
      setClosePrice(130);
    } else if (type === 'breakout') {
      setOpenPrice(95);
      setHighPrice(150);
      setLowPrice(92);
      setClosePrice(145);
    }
    // Animate
    setIsCandleAnimating(true);
    setCandleProgress(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 15;
      setCandleProgress(step);
      if (step >= 100) {
        clearInterval(interval);
        setIsCandleAnimating(false);
      }
    }, 80);
  };

  // Option Calculations
  const optionIntrinsic = optionType === 'CALL' ? Math.max(0, spotPrice - strikePrice) : Math.max(0, strikePrice - spotPrice);
  const netPnL = optionIntrinsic - optionPremium;
  const breakEven = optionType === 'CALL' ? strikePrice + optionPremium : strikePrice - optionPremium;

  // Position Sizing Calculations
  const maxRiskAmount = (capital * riskPct) / 100;
  const riskPerUnit = Math.max(1, Math.abs(entryPrice - stopLossPrice));
  const recommendedQty = Math.floor(maxRiskAmount / riskPerUnit);
  const targetPrice = entryPrice + (riskPerUnit * 2); // 1:2 Risk-Reward

  // Clean, bulleted points for notes
  const getCleanBullets = () => {
    const raw = lang === 'Hindi' && lesson.contentHindi ? lesson.contentHindi : lesson.content;
    const sentences = raw
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim().replace(/^[-*#]\s*/, ''))
      .filter(s => s.length > 10);

    return sentences.slice(0, 4); // Max 4 bullet points to prevent long paragraphs
  };

  return (
    <div className="space-y-4 bg-[#0a0d14] p-3 sm:p-5 rounded-2xl border border-sky-500/20 shadow-2xl max-w-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-950/40 via-[#111827] to-indigo-950/40 p-3.5 rounded-xl border border-sky-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-sky-500/10 border border-sky-400/30 rounded-xl flex items-center justify-center text-sky-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span>Interactive Studio</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                Visual
              </span>
            </div>
            <h4 className="text-sm font-bold text-white line-clamp-1">{lesson.title}</h4>
          </div>
        </div>

        {/* Voice Controls */}
        {hasSpeechSupport && (
          <div className="flex items-center gap-2 bg-[#080a0f] p-1.5 rounded-xl border border-white/10 shrink-0 self-start sm:self-auto">
            <button
              onClick={handleToggleAudio}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                isPlayingAudio
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Voice
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Listen Narration
                </>
              )}
            </button>

            {isPlayingAudio && (
              <button
                onClick={handleStopAudio}
                className="p-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg border border-rose-500/30 transition"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}

            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="bg-[#121620] text-gray-300 text-[10px] font-mono rounded-lg px-2 py-1 border border-white/10"
            >
              <option value="0.9">0.9x</option>
              <option value="1.0">1.0x</option>
              <option value="1.2">1.2x</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#080a0f] p-1 rounded-xl border border-white/10 text-xs font-medium">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 transition font-semibold text-center ${
            activeTab === 'simulation'
              ? 'bg-sky-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
          <span className="truncate">Visual Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 transition font-semibold text-center ${
            activeTab === 'notes'
              ? 'bg-sky-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-300 shrink-0" />
          <span className="truncate">Key Concepts</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 transition font-semibold text-center ${
            activeTab === 'quiz'
              ? 'bg-sky-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="truncate">Quick Test</span>
        </button>
      </div>

      {/* TAB 1: VISUAL LAB */}
      {activeTab === 'simulation' && (
        <div className="bg-[#080a0f] p-3.5 sm:p-4 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-sky-400" /> Interactive Visual Tool
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Category: {course.category}
            </span>
          </div>

          {/* 1. CANDLESTICK / PRICE ACTION TOOL */}
          {(course.category === 'Basics' || course.category === 'Price Action' || lesson.title.toLowerCase().includes('candle')) && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[10px] font-mono text-gray-400 shrink-0 mr-1">Presets:</span>
                <button
                  onClick={() => loadPreset('hammer')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition shrink-0 border ${
                    activePattern === 'hammer'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#11141f] text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  🔨 Hammer (Reversal)
                </button>
                <button
                  onClick={() => loadPreset('engulfing')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition shrink-0 border ${
                    activePattern === 'engulfing'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-[#11141f] text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  📈 Bullish Engulfing
                </button>
                <button
                  onClick={() => loadPreset('breakout')}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition shrink-0 border ${
                    activePattern === 'breakout'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-[#11141f] text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  🚀 Breakout Candle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SVG Visual Canvas */}
                <div className="bg-[#11141f] p-4 rounded-xl border border-white/10 flex flex-col items-center justify-between min-h-[240px]">
                  <div className="w-full flex items-center justify-between text-[11px] font-mono text-gray-400 border-b border-white/5 pb-2">
                    <span className="text-sky-400 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Candle Graphic
                    </span>
                    <button
                      onClick={() => loadPreset('hammer')}
                      disabled={isCandleAnimating}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" /> Animate
                    </button>
                  </div>

                  {/* SVG graphic */}
                  <div className="my-3 flex items-center justify-center">
                    <svg className="w-36 h-44 overflow-visible" viewBox="0 0 160 160">
                      {(() => {
                        const getY = (price: number) => 140 - Math.max(0, Math.min(1, (price - 50) / 100)) * 120;
                        const yHigh = getY(highPrice);
                        const yLow = getY(lowPrice);
                        const yOpen = getY(openPrice);
                        const yClose = getY(closePrice);

                        const isGreen = closePrice >= openPrice;
                        const color = isGreen ? '#10b981' : '#f43f5e';
                        const yTop = Math.min(yOpen, yClose);
                        const yBot = Math.max(yOpen, yClose);
                        const bodyH = Math.max(6, Math.abs(yBot - yTop));

                        return (
                          <>
                            {/* Wick */}
                            <line x1="80" y1={yHigh} x2="80" y2={yLow} stroke={color} strokeWidth="3" strokeLinecap="round" />
                            {/* Body */}
                            <rect
                              x="58"
                              y={yTop}
                              width="44"
                              height={(bodyH * candleProgress) / 100}
                              fill={color}
                              rx="3"
                              stroke="rgba(255,255,255,0.2)"
                            />
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Clean 4-Card HUD */}
                  <div className="w-full grid grid-cols-4 gap-1 font-mono text-[10px] text-center">
                    <div className="bg-[#080a0f] p-1.5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-[9px]">OPEN</span>
                      <span className="font-bold text-gray-200">₹{openPrice}</span>
                    </div>
                    <div className="bg-[#080a0f] p-1.5 rounded-lg border border-emerald-500/20">
                      <span className="text-emerald-400 block text-[9px]">HIGH</span>
                      <span className="font-bold text-emerald-400">₹{highPrice}</span>
                    </div>
                    <div className="bg-[#080a0f] p-1.5 rounded-lg border border-rose-500/20">
                      <span className="text-rose-400 block text-[9px]">LOW</span>
                      <span className="font-bold text-rose-400">₹{lowPrice}</span>
                    </div>
                    <div className={`p-1.5 rounded-lg border ${closePrice >= openPrice ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                      <span className="block text-[9px] font-bold">CLOSE</span>
                      <span className="font-extrabold">₹{closePrice}</span>
                    </div>
                  </div>
                </div>

                {/* Adjust Sliders */}
                <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/10 space-y-3 font-mono text-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" /> Adjust Price Levels:
                    </span>
                    <p className="text-[11px] text-gray-400 font-sans">
                      Test how changing Open, High, Low, and Close reshapes the candlestick.
                    </p>
                  </div>

                  <div className="space-y-2 bg-[#080a0f] p-2.5 rounded-lg border border-white/5">
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-gray-400">Open:</span>
                        <span className="text-white font-bold">₹{openPrice}</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="130"
                        value={openPrice}
                        onChange={(e) => {
                          setOpenPrice(Number(e.target.value));
                          setActivePattern('custom');
                        }}
                        className="w-full accent-sky-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-emerald-400">High:</span>
                        <span className="text-emerald-400 font-bold">₹{highPrice}</span>
                      </div>
                      <input
                        type="range"
                        min={Math.max(openPrice, closePrice)}
                        max="150"
                        value={highPrice}
                        onChange={(e) => {
                          setHighPrice(Number(e.target.value));
                          setActivePattern('custom');
                        }}
                        className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-rose-400">Low:</span>
                        <span className="text-rose-400 font-bold">₹{lowPrice}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max={Math.min(openPrice, closePrice)}
                        value={lowPrice}
                        onChange={(e) => {
                          setLowPrice(Number(e.target.value));
                          setActivePattern('custom');
                        }}
                        className="w-full accent-rose-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-sky-400">Close:</span>
                        <span className="text-sky-400 font-bold">₹{closePrice}</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="130"
                        value={closePrice}
                        onChange={(e) => {
                          setClosePrice(Number(e.target.value));
                          setActivePattern('custom');
                        }}
                        className="w-full accent-sky-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20 text-[10px] text-sky-200 font-sans flex items-start gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Pro Tip:</strong> Long lower wicks show buyers pushing back from the lows (Bullish Reversal).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. OPTIONS PAYOFF TOOL */}
          {course.category === 'Options' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Option Type:</span>
                  <div className="flex bg-[#080a0f] p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setOptionType('CALL')}
                      className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                        optionType === 'CALL' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      CALL (CE)
                    </button>
                    <button
                      onClick={() => setOptionType('PUT')}
                      className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                        optionType === 'PUT' ? 'bg-rose-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      PUT (PE)
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-gray-300 text-[11px] mb-0.5">
                      <span>Strike Price:</span>
                      <span className="font-bold text-white">₹{strikePrice}</span>
                    </div>
                    <input
                      type="range"
                      min="21000"
                      max="23000"
                      step="100"
                      value={strikePrice}
                      onChange={(e) => setStrikePrice(Number(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-300 text-[11px] mb-0.5">
                      <span>Option Premium Paid:</span>
                      <span className="font-bold text-amber-400">₹{optionPremium}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="600"
                      step="10"
                      value={optionPremium}
                      onChange={(e) => setOptionPremium(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-300 text-[11px] mb-0.5">
                      <span>Spot Price at Expiry:</span>
                      <span className="font-bold text-sky-400">₹{spotPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="20500"
                      max="23500"
                      step="50"
                      value={spotPrice}
                      onChange={(e) => setSpotPrice(Number(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Payoff Results */}
              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/10 flex flex-col justify-between space-y-2">
                <span className="font-bold text-sky-400 uppercase tracking-wider block text-[11px]">
                  Payoff Calculation
                </span>

                <div className="space-y-2 bg-[#080a0f] p-2.5 rounded-lg border border-white/5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Break-even Level:</span>
                    <span className="font-bold text-amber-400">₹{breakEven}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Intrinsic Value:</span>
                    <span className="font-bold text-white">₹{optionIntrinsic}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span className="font-bold text-gray-200">Estimated P&L:</span>
                    <span
                      className={`font-extrabold text-sm ${
                        netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {netPnL >= 0 ? `+₹${netPnL}` : `-₹${Math.abs(netPnL)}`}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[10px] text-amber-200 font-sans">
                  💡 <strong>Rule:</strong> {optionType === 'CALL' ? 'Calls gain profit when spot price moves above Strike + Premium.' : 'Puts gain profit when spot price moves below Strike - Premium.'}
                </div>
              </div>
            </div>
          )}

          {/* 3. POSITION SIZING TOOL */}
          {(course.category === 'Psychology' || course.category === 'Technical Analysis') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/10 space-y-2.5">
                <span className="font-bold text-white block">Risk Inputs:</span>
                <div>
                  <label className="text-gray-400 block text-[10px] mb-1">Account Capital (₹):</label>
                  <input
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(Number(e.target.value))}
                    className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block text-[10px] mb-1">Risk Per Trade (%):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={riskPct}
                    onChange={(e) => setRiskPct(Number(e.target.value))}
                    className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1 text-sky-400 font-bold text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block text-[10px] mb-1">Entry Price (₹):</label>
                    <input
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(Number(e.target.value))}
                      className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1 text-emerald-400 font-bold text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block text-[10px] mb-1">Stop Loss (₹):</label>
                    <input
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value))}
                      className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1 text-rose-400 font-bold text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/10 flex flex-col justify-between space-y-2">
                <span className="font-bold text-sky-400 uppercase tracking-wider block text-[11px]">
                  Recommended Position Size
                </span>

                <div className="space-y-2 bg-[#080a0f] p-2.5 rounded-lg border border-white/5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Risk Budget:</span>
                    <span className="text-rose-400 font-bold">₹{maxRiskAmount}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Target (1:2 RR):</span>
                    <span className="text-emerald-400 font-bold">₹{targetPrice}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span className="text-gray-200 font-bold">Buy Quantity:</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{recommendedQty} Shares</span>
                  </div>
                </div>

                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[10px] text-emerald-200 font-sans">
                  🛡️ <strong>Rule:</strong> Keep risk per trade under 1% to 2% to protect capital.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KEY CONCEPTS (CONCISE BULLETS) */}
      {activeTab === 'notes' && (
        <div className="bg-[#080a0f] p-3.5 sm:p-4 rounded-xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Key Learning Bullets
            </h3>
            <span className="text-[10px] font-mono text-gray-400">Fast Read (30 sec)</span>
          </div>

          <div className="space-y-2">
            {getCleanBullets().map((bullet, idx) => (
              <div
                key={idx}
                className="bg-[#11141f] p-3 rounded-xl border border-white/5 flex items-start gap-2.5 text-xs text-gray-200 leading-relaxed"
              >
                <div className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          {/* Key Takeaways Cards */}
          {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider block">
                Rule Summary:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {lesson.keyTakeaways.map((takeaway, tIdx) => (
                  <div key={tIdx} className="bg-[#11141f] p-2.5 rounded-lg border border-white/5 flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUICK TEST */}
      {activeTab === 'quiz' && (
        <div className="bg-[#080a0f] p-3.5 sm:p-4 rounded-xl border border-sky-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="w-4 h-4 text-amber-400" /> Knowledge Check
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded font-bold">
              +20 XP
            </span>
          </div>

          <p className="text-xs text-gray-200 font-medium leading-normal">
            Q: What is the main principle to preserve capital according to this lesson?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              'Equilibrium between Buyers (Demand) and Sellers (Supply)',
              'Investing 100% of capital into a single stock',
              'Ignoring stop-loss rules during volatile trends',
              'Trading without calculating position size'
            ].map((opt, oIdx) => {
              const isSelected = selectedOption === oIdx;
              const isCorrect = oIdx === 0;

              let btnClass = 'bg-[#11141f] border-white/10 hover:border-sky-500 text-gray-300';
              if (quizSubmitted) {
                if (isCorrect) btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                else if (isSelected) btnClass = 'bg-rose-500/20 border-rose-500 text-rose-300';
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => {
                    setSelectedOption(oIdx);
                    setQuizSubmitted(true);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs transition ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className="bg-sky-500/10 p-3 rounded-lg border border-sky-500/20 text-xs text-sky-200 flex items-center justify-between gap-2">
              <span className="text-[11px]">
                {selectedOption === 0 ? '🎉 Excellent! Core concepts mastered.' : '💡 Hint: Demand vs Supply determines market equilibrium.'}
              </span>
              <button
                onClick={onCompleteLesson}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shrink-0 shadow"
              >
                Complete Lesson (+20 XP) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
