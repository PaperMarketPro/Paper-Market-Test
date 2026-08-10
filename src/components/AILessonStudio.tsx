import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Course } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  ShieldAlert,
  Target,
  CheckCircle2,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight
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
  // Speech synthesis audio states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  // Candlestick simulator states
  const [openPrice, setOpenPrice] = useState<number>(100);
  const [highPrice, setHighPrice] = useState<number>(115);
  const [lowPrice, setLowPrice] = useState<number>(90);
  const [closePrice, setClosePrice] = useState<number>(110);
  const [isCandleAnimating, setIsCandleAnimating] = useState(false);
  const [candleProgress, setCandleProgress] = useState(100);

  // Support / Resistance simulator
  const [supportLevel, setSupportLevel] = useState<number>(2800);
  const [resistanceLevel, setResistanceLevel] = useState<number>(3000);
  const [priceActionPath, setPriceActionPath] = useState<'bounce' | 'breakout' | 'fakeout'>('bounce');

  // Options Payoff simulator
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [strikePrice, setStrikePrice] = useState<number>(22000);
  const [optionPremium, setOptionPremium] = useState<number>(250);
  const [spotPrice, setSpotPrice] = useState<number>(22300);

  // Position Size calculator
  const [accountCapital, setAccountCapital] = useState<number>(100000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const [entryPrice, setEntryPrice] = useState<number>(500);
  const [stopLossPrice, setStopLossPrice] = useState<number>(490);

  // Interactive Drill / Quiz
  const [drillAnswer, setDrillAnswer] = useState<number | null>(null);
  const [drillSubmitted, setDrillSubmitted] = useState(false);

  // Check speech synthesis support
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

  // Cancel speech on lesson change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    setDrillAnswer(null);
    setDrillSubmitted(false);
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
        const textToSpeak = `${lesson.title}. Key takeaways: ${
          lesson.keyTakeaways ? lesson.keyTakeaways.join('. ') : ''
        }. ${
          lang === 'Hindi' && lesson.contentHindi
            ? lesson.contentHindi.replace(/[#\-\*]/g, '')
            : lesson.content.replace(/[#\-\*]/g, '')
        }`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = speechRate;
        utterance.pitch = 1.0;

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

  // Animate candlestick formation
  const startCandleAnimation = () => {
    setIsCandleAnimating(true);
    setCandleProgress(0);
    let step = 0;
    const interval = setInterval(() => {
      step += 10;
      setCandleProgress(step);
      if (step >= 100) {
        clearInterval(interval);
        setIsCandleAnimating(false);
      }
    }, 150);
  };

  // Calculate Option Payoff
  const calculateOptionPayoff = () => {
    let intrinsic = 0;
    if (optionType === 'CALL') {
      intrinsic = Math.max(0, spotPrice - strikePrice);
    } else {
      intrinsic = Math.max(0, strikePrice - spotPrice);
    }
    const netProfit = intrinsic - optionPremium;
    const breakEven = optionType === 'CALL' ? strikePrice + optionPremium : strikePrice - optionPremium;
    return { intrinsic, netProfit, breakEven };
  };

  // Calculate Position Size
  const calculatePositionSize = () => {
    const maxRiskAmount = (accountCapital * riskPercentage) / 100;
    const riskPerShare = Math.abs(entryPrice - stopLossPrice) || 1;
    const sharesToBuy = Math.floor(maxRiskAmount / riskPerShare);
    const totalCapitalRequired = sharesToBuy * entryPrice;
    return { maxRiskAmount, riskPerShare, sharesToBuy, totalCapitalRequired };
  };

  const payoff = calculateOptionPayoff();
  const posSize = calculatePositionSize();

  return (
    <div className="space-y-5 bg-[#0d1017] p-4 sm:p-5 rounded-2xl border border-sky-500/20 shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sky-950/60 via-[#111827] to-indigo-950/60 p-3.5 rounded-xl border border-sky-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-sky-500/10 border border-sky-400/30 rounded-lg flex items-center justify-center text-sky-400 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-sky-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <span>Interactive AI Studio</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded font-sans">
                Active
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
              {lesson.title}
            </h4>
          </div>
        </div>

        {/* AI Audio Speech Synthesizer Control Bar */}
        {hasSpeechSupport && (
          <div className="flex items-center gap-2 bg-[#080a0f] p-1.5 rounded-xl border border-white/10">
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
                  <Volume2 className="w-3.5 h-3.5" /> Listen AI Voiceover
                </>
              )}
            </button>

            {isPlayingAudio && (
              <button
                onClick={handleStopAudio}
                className="p-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg border border-rose-500/30 transition"
                title="Stop Narration"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}

            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="bg-[#121620] text-gray-300 text-[10px] font-mono rounded-lg px-2 py-1 border border-white/10"
            >
              <option value="0.85">0.85x</option>
              <option value="1.0">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>
        )}
      </div>

      {/* Interactive Visual Simulation Engine tailored to lesson topic */}
      <div className="bg-[#080a0f] p-4 rounded-xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Activity className="w-4 h-4 text-sky-400" /> Interactive Visual Simulation
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Category: {course.category}
          </span>
        </div>

        {/* 1. Candlestick OHLC Interactive Visualizer */}
        {(course.category === 'Basics' || lesson.title.toLowerCase().includes('candle')) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Candlestick Canvas SVG Graphic */}
              <div className="bg-[#11141f] p-4 rounded-xl border border-white/5 relative flex flex-col items-center justify-center min-h-[220px]">
                <div className="text-[10px] font-mono text-gray-400 absolute top-2 left-2">
                  Live OHLC Candle Graphic
                </div>
                {/* SVG Candlestick representation */}
                <svg className="w-40 h-48 overflow-visible" viewBox="0 0 100 200">
                  {/* High to Low Wick Line */}
                  <line
                    x1="50"
                    y1={20 + (150 - (highPrice / 150) * 150)}
                    x2="50"
                    y2={20 + (150 - (lowPrice / 150) * 150)}
                    stroke={closePrice >= openPrice ? '#10b981' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={isCandleAnimating ? '4 2' : undefined}
                  />

                  {/* Body Rectangle */}
                  {(() => {
                    const topVal = Math.max(openPrice, closePrice);
                    const botVal = Math.min(openPrice, closePrice);
                    const yTop = 20 + (150 - (topVal / 150) * 150);
                    const yBot = 20 + (150 - (botVal / 150) * 150);
                    const height = Math.max(Math.abs(yBot - yTop), 6);
                    const isGreen = closePrice >= openPrice;

                    return (
                      <rect
                        x="30"
                        y={yTop}
                        width="40"
                        height={(height * candleProgress) / 100}
                        fill={isGreen ? '#10b981' : '#ef4444'}
                        rx="3"
                        className="transition-all duration-300"
                      />
                    );
                  })()}

                  {/* Price Tags */}
                  <text x="75" y={20 + (150 - (highPrice / 150) * 150)} fill="#9ca3af" fontSize="9" fontFamily="monospace">
                    H: ₹{highPrice}
                  </text>
                  <text x="75" y={20 + (150 - (lowPrice / 150) * 150)} fill="#9ca3af" fontSize="9" fontFamily="monospace">
                    L: ₹{lowPrice}
                  </text>
                  <text x="2" y={20 + (150 - (openPrice / 150) * 150)} fill="#6b7280" fontSize="9" fontFamily="monospace">
                    O: ₹{openPrice}
                  </text>
                  <text x="2" y={20 + (150 - (closePrice / 150) * 150)} fill={closePrice >= openPrice ? '#34d399' : '#f87171'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    C: ₹{closePrice}
                  </text>
                </svg>

                <div className="mt-2 text-center">
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      closePrice >= openPrice
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {closePrice >= openPrice ? 'Bullish Green Candle (+₹' + (closePrice - openPrice) + ')' : 'Bearish Red Candle (-₹' + (openPrice - closePrice) + ')'}
                  </span>
                </div>
              </div>

              {/* Interactive Sliders */}
              <div className="space-y-3 bg-[#11141f] p-3.5 rounded-xl border border-white/5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200">Adjust OHLC Price Inputs:</span>
                  <button
                    onClick={startCandleAnimation}
                    disabled={isCandleAnimating}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Animate Formation
                  </button>
                </div>

                <div className="space-y-2 font-mono">
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Open: ₹{openPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="130"
                      value={openPrice}
                      onChange={(e) => setOpenPrice(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>High: ₹{highPrice}</span>
                    </div>
                    <input
                      type="range"
                      min={Math.max(openPrice, closePrice)}
                      max="145"
                      value={highPrice}
                      onChange={(e) => setHighPrice(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Low: ₹{lowPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max={Math.min(openPrice, closePrice)}
                      value={lowPrice}
                      onChange={(e) => setLowPrice(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Close: ₹{closePrice}</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="130"
                      value={closePrice}
                      onChange={(e) => setClosePrice(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Options Payoff & Greeks Simulator */}
        {course.category === 'Options' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">Option Contract Setup:</span>
                  <div className="flex bg-[#080a0f] p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => setOptionType('CALL')}
                      className={`px-2.5 py-0.5 rounded font-bold transition ${
                        optionType === 'CALL' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      CALL (CE)
                    </button>
                    <button
                      onClick={() => setOptionType('PUT')}
                      className={`px-2.5 py-0.5 rounded font-bold transition ${
                        optionType === 'PUT' ? 'bg-rose-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      PUT (PE)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 font-mono">
                  <div>
                    <div className="flex justify-between text-gray-400">
                      <span>Strike Price: ₹{strikePrice}</span>
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
                    <div className="flex justify-between text-gray-400">
                      <span>Option Premium Paid: ₹{optionPremium}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="800"
                      step="10"
                      value={optionPremium}
                      onChange={(e) => setOptionPremium(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400">
                      <span>Spot Price at Expiry: ₹{spotPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="20500"
                      max="23500"
                      step="50"
                      value={spotPrice}
                      onChange={(e) => setSpotPrice(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payoff Results */}
              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/5 space-y-3 flex flex-col justify-between">
                <span className="font-bold text-sky-400 font-mono uppercase tracking-wider block">
                  Simulated Payoff & P&L Analysis
                </span>

                <div className="space-y-2 font-mono bg-[#080a0f] p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between text-gray-300">
                    <span>Break-even Price:</span>
                    <span className="font-bold text-amber-400">₹{payoff.breakEven}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Intrinsic Value:</span>
                    <span className="font-bold text-white">₹{payoff.intrinsic}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span className="font-bold text-gray-200">Net Profit / Loss:</span>
                    <span
                      className={`font-extrabold text-sm ${
                        payoff.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {payoff.netProfit >= 0 ? `+₹${payoff.netProfit}` : `-₹${Math.abs(payoff.netProfit)}`}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                  💡 <strong>Pro Tip:</strong> {optionType === 'CALL' ? 'Call Options gain value when Spot rises above Strike + Premium.' : 'Put Options gain value when Spot falls below Strike - Premium.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Position Sizing & Risk Management Calculator */}
        {(course.category === 'Psychology' || course.category === 'Price Action') && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/5 space-y-2.5 font-mono">
                <span className="font-bold text-white block">Trader Capital & Risk Inputs:</span>
                <div>
                  <label className="text-gray-400 block text-[11px] mb-1">Total Account Capital (₹):</label>
                  <input
                    type="number"
                    value={accountCapital}
                    onChange={(e) => setAccountCapital(Number(e.target.value))}
                    className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block text-[11px] mb-1">Max Risk Per Trade (%):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={riskPercentage}
                    onChange={(e) => setRiskPercentage(Number(e.target.value))}
                    className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sky-400 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block text-[11px] mb-1">Entry Price (₹):</label>
                    <input
                      type="number"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(Number(e.target.value))}
                      className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block text-[11px] mb-1">Stop Loss (₹):</label>
                    <input
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value))}
                      className="w-full bg-[#080a0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-rose-400"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#11141f] p-3.5 rounded-xl border border-white/5 space-y-2 font-mono flex flex-col justify-between">
                <span className="font-bold text-sky-400 uppercase tracking-wider block text-[11px]">
                  Optimal Position Sizing Result
                </span>

                <div className="space-y-2 bg-[#080a0f] p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Risk Budget:</span>
                    <span className="text-rose-400 font-bold">₹{posSize.maxRiskAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Per Share:</span>
                    <span className="text-amber-400 font-bold">₹{posSize.riskPerShare}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1">
                    <span className="text-gray-200 font-bold">Recommended Quantity:</span>
                    <span className="text-emerald-400 font-extrabold text-sm">{posSize.sharesToBuy} Shares</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  🛡️ <strong>1% Rule:</strong> Never risk more than 1% of your total trading equity on a single setup to ensure long-term survivability!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Trader Knowledge Drill Check */}
      <div className="bg-[#080a0f] p-4 rounded-xl border border-sky-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5 uppercase tracking-wider">
            <Target className="w-4 h-4 text-amber-400" /> Interactive Lesson Knowledge Drill
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded font-bold">
            +20 XP Reward
          </span>
        </div>

        <p className="text-xs text-gray-200 font-medium">
          Q: According to this lesson, what is the primary factor that causes stock prices to move up or down on the exchange?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            'Balance of Buy Demand vs Sell Supply on Order Book',
            'Random computer algorithms without buyer interest',
            'Fixed prices set by the government at night',
            'Bank interest rates changing every minute'
          ].map((opt, oIdx) => {
            const isSelected = drillAnswer === oIdx;
            const isCorrect = oIdx === 0;

            let btnClass = 'bg-[#11141f] border-white/10 hover:border-sky-500 text-gray-300';
            if (drillSubmitted) {
              if (isCorrect) btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
              else if (isSelected) btnClass = 'bg-rose-500/20 border-rose-500 text-rose-300';
            }

            return (
              <button
                key={oIdx}
                onClick={() => {
                  setDrillAnswer(oIdx);
                  setDrillSubmitted(true);
                }}
                className={`p-2.5 rounded-lg border text-left text-xs transition ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {drillSubmitted && (
          <div className="bg-sky-500/10 p-3 rounded-lg border border-sky-500/20 text-xs text-sky-200 flex items-center justify-between gap-2">
            <span>
              {drillAnswer === 0 ? '🎉 Correct! Demand exceeding Supply creates bullish momentum.' : '💡 Hint: High buy demand pushes prices up, high sell supply pushes prices down.'}
            </span>
            <button
              onClick={onCompleteLesson}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shrink-0"
            >
              Complete & Earn XP <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
