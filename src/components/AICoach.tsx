/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMainApp } from '../store';
import { getApiUrl } from '../config';
import { 
  ShieldCheck, BrainCircuit, MessageSquare, 
  Send, RefreshCw, ChevronDown
} from 'lucide-react';

export const AICoach: React.FC = React.memo(() => {
  const { 
    insights, 
    journals, 
    positions,
    updateInsights,
    user,
    cognitiveRules
  } = useMainApp();

  const [activeTab, setActiveTab] = useState<'chat' | 'scorecard'>('chat');
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  // Scorecard states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dispScore, setDispScore] = useState(82);
  const [riskScore, setRiskScore] = useState(68);
  const [execPrecision, setExecPrecision] = useState(75);
  const [coachingFeedback, setCoachingFeedback] = useState<string>(
    "Your overall execution discipline is steady. Focus on honoring your predefined stop-loss levels and avoiding impulsive re-entries after a loss."
  );

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>>([
    {
      role: 'assistant',
      text: "Hello! I'm your Trading Coach. Ask me to analyze any setup (like Nifty or Reliance), or let's work through trading stress, FOMO, or a recent loss. How is your trading going today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const handleTriggerAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(getApiUrl('/api/coach/train-scorecard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journals,
          positions,
          focusArea: 'Strict Stop Loss Control',
          customPrompt: '',
          llmConfig: user?.llmConfig,
          cognitiveRules
        })
      });

      const resText = await res.text();
      let data: any = {};
      try { data = JSON.parse(resText); } catch (_) {}
      if (res.ok && data.success) {
        setDispScore(data.disciplineScore);
        setRiskScore(data.riskControlScore);
        setExecPrecision(data.executionPrecision);
        setCoachingFeedback(data.feedback);
        if (data.insights && data.insights.length > 0) {
          updateInsights(data.insights);
        }
      }
    } catch (err) {
      console.error("Scorecard update failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    if (!msgText) setChatInput('');

    const userMsg = {
      role: 'user' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/coach/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory.map(h => ({
            role: h.role,
            content: h.text
          })),
          llmConfig: user?.llmConfig,
          cognitiveRules,
          journals,
          positions
        })
      });

      const responseText = await response.text();
      let data: any = {};
      try { data = JSON.parse(responseText); } catch (_) {}
      if (response.ok && data.text) {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error || "Server error");
      }
    } catch (err) {
      const lower = textToSend.toLowerCase();
      const isHinglish = /\b(mera|meri|mujhe|bhai|kya|aaj|ho|gaya|hogya|karu|batao|kaise|nuksan|ghata|loss)\b/i.test(lower);
      let fallbackMsg = "Trading is 10% strategy and 90% discipline. Stick to your position sizing rules and never trade without a predefined stop-loss.";

      if (lower.includes("analyze") || lower.includes("nifty") || lower.includes("reliance")) {
        fallbackMsg = "**Key Technical Setup (Nifty 50):**\n• **Support Zone:** 24,520 – 24,550\n• **Resistance / Trigger:** 24,675\n• **Action Plan:** Wait for a clean 15-min candle close above 24,675 with a strict stop-loss at 24,630 (1:2 Risk-Reward).";
      } else if (isHinglish) {
        fallbackMsg = "Bhai, sabse pehle ek gehra breath lo aur trading screen thodi der ke liye band kar do. Loss ke baad turant revenge trade bilkul mat lena. Capital bachaoge toh kal naya mauka zaroor milega!";
      } else if (lower.includes("loss") || lower.includes("revenge")) {
        fallbackMsg = "Step away from the screen for 30 minutes. Taking a loss is part of trading, but trying to win it back immediately leads to oversized mistakes. Protect your remaining capital first.";
      }

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: fallbackMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const quickPrompts = [
    { label: "Analyze Nifty Setup", text: "Analyze Nifty 50 and Reliance support, resistance, and option chain levels." },
    { label: "Stop FOMO", text: "A stock is rallying fast and I feel FOMO to jump in without a plan." },
    { label: "Recover from Loss", text: "I just took a loss and feel tempted to revenge trade immediately." },
    { label: "Hinglish: Loss ho gaya", text: "Bhai aaj options me loss ho gaya, samjha do abhi kya karu?" }
  ];

  const renderMessageText = (text: string) => {
    return text.split('\n\n').map((paragraph, pIdx) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={pIdx} className="leading-relaxed mb-2 last:mb-0 text-xs sm:text-sm whitespace-pre-line">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="space-y-5 pb-20 max-w-4xl mx-auto w-full">
      {/* Simple 2-Tab Bar */}
      <div className="flex bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-xl p-1 gap-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'chat' 
              ? 'bg-blue-600 dark:bg-sky-600 text-white shadow-sm' 
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat with Coach</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scorecard')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'scorecard' 
              ? 'bg-blue-600 dark:bg-sky-600 text-white shadow-sm' 
              : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Discipline Scorecard</span>
        </button>
      </div>

      {/* TAB 1: CHAT */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          {/* Quick Prompts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt.text)}
                className="bg-white dark:bg-[#11141c] hover:border-sky-500/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-left text-xs transition cursor-pointer shadow-sm"
              >
                <span className="font-bold text-slate-900 dark:text-white block truncate">{prompt.label}</span>
                <span className="text-[11px] text-slate-500 dark:text-gray-400 line-clamp-1 mt-0.5">{prompt.text}</span>
              </button>
            ))}
          </div>

          {/* Chat Container */}
          <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl h-[460px] flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Trading Mind & Setup Coach</h4>
              </div>
              <button
                type="button"
                onClick={() => setChatHistory([{
                  role: 'assistant',
                  text: "Chat cleared. How can I help with your trades today?",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }])}
                className="text-xs text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((h, i) => {
                const isUser = h.role === 'user';
                return (
                  <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-1 ${
                      isUser 
                        ? 'bg-blue-600 dark:bg-sky-600 text-white' 
                        : 'bg-slate-900 dark:bg-[#181d2a] text-slate-100 border border-white/10'
                    }`}>
                      {isUser ? (
                        <p className="whitespace-pre-line leading-relaxed text-xs sm:text-sm">{h.text}</p>
                      ) : (
                        <div>{renderMessageText(h.text)}</div>
                      )}
                      <span className="block text-[10px] text-right font-mono opacity-60 pt-0.5">
                        {h.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-500 dark:text-sky-400 font-mono">
                    Coach is typing...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="p-3 border-t border-slate-100 dark:border-white/5 flex gap-2 items-center"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about a stock setup, risk rule, or trading mindset..."
                className="flex-1 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="bg-blue-600 dark:bg-sky-600 hover:bg-blue-500 dark:hover:bg-sky-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SCORECARD */}
      {activeTab === 'scorecard' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-5 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trading Discipline Scorecard</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">Based on your recent paper trades and journal logs</p>
              </div>
              <button
                type="button"
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing}
                className="bg-blue-600 dark:bg-sky-600 hover:bg-blue-500 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Updating...' : 'Refresh Score'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-[#0b0e14] p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-sky-400 block">{dispScore}%</span>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-1 block">Discipline</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#0b0e14] p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-amber-500 block">{riskScore}%</span>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-1 block">Risk Control</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#0b0e14] p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-500 block">{execPrecision}%</span>
                <span className="text-xs text-slate-500 dark:text-gray-400 mt-1 block">Precision</span>
              </div>
            </div>

            {coachingFeedback && (
              <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-4 text-xs text-slate-700 dark:text-gray-200 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{coachingFeedback}</span>
              </div>
            )}
          </div>

          {/* Actionable Insights List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
              Recent Observations
            </h4>

            {insights.map(item => {
              const isExpanded = expandedInsightId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedInsightId(isExpanded ? null : item.id)}
                    className="w-full p-4 flex justify-between items-center text-left hover:bg-slate-50 dark:hover:bg-white/5 transition"
                  >
                    <div className="space-y-1 pr-3">
                      <span className="text-[11px] font-mono text-sky-400">{item.category}</span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.headline}</h4>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 text-xs text-slate-600 dark:text-gray-300 leading-relaxed border-t border-slate-100 dark:border-white/5">
                      {item.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
