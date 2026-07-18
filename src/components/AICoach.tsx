/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { 
  ShieldCheck, BrainCircuit, TrendingUp, HelpCircle, 
  ChevronDown, Award, Sparkles, Activity, MessageSquare, 
  Trash2, Send, Heart, Play, RefreshCw, BookOpen, Sliders, Check, AlertCircle, X
} from 'lucide-react';

interface CustomLesson {
  title: string;
  problemAnalysis: string;
  coreConcept: string;
  exerciseTitle: string;
  exercisePrompt: string;
  quizQuestion: string;
  quizOptions: string[];
  quizCorrectIndex: number;
  quizExplanation: string;
}

export const AICoach: React.FC = () => {
  const { 
    insights, 
    journals, 
    positions,
    updateInsights,
    user,
    cognitiveRules,
    updateLLMConfig
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chat' | 'teach' | 'scorecard'>('chat');

  // LLM Config state from user profile or default values
  const currentLlmConfig = user?.llmConfig || {
    selectedModel: 'gemini-3.5-flash',
    temperature: 0.6,
    systemPersona: 'Market Veteran',
    customGrounding: '',
    injectCognitiveRules: true
  };

  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview'>(
    currentLlmConfig.selectedModel || 'gemini-3.5-flash'
  );
  const [temperature, setTemperature] = useState<number>(
    currentLlmConfig.temperature !== undefined ? currentLlmConfig.temperature : 0.6
  );
  const [systemPersona, setSystemPersona] = useState<'Market Veteran' | 'Quantitative Analyst' | 'Clinical Psychologist'>(
    currentLlmConfig.systemPersona || 'Market Veteran'
  );
  const [customGrounding, setCustomGrounding] = useState<string>(
    currentLlmConfig.customGrounding || ''
  );
  const [injectCognitiveRules, setInjectCognitiveRules] = useState<boolean>(
    currentLlmConfig.injectCognitiveRules !== undefined ? currentLlmConfig.injectCognitiveRules : true
  );

  // Training Simulation states
  const [isTrainingRunning, setIsTrainingRunning] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [trainingStatus, setTrainingStatus] = useState('');

  const handleRunModelTraining = () => {
    setIsTrainingRunning(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    setTrainingStatus('Initializing Hyperparameter Tuning...');

    const logMessages = [
      'Establishing connection to Google AI Studio GenAI Node...',
      'Loading historical paper trade datasets (closed positions)...',
      'Scanning emotional journals & behavioral sentiment vectors...',
      `Configuring neural weights for Persona: ${systemPersona}...`,
      `Synthesizing custom grounding constraints...`,
      'Compiling cognitive behavioral If-Then safety boundaries...',
      'Running multivariate backpropagation on risk expectancy models...',
      'Optimizing response temperature weights...',
      'Deploying refined checkpoint parameters to production ledger...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setTrainingProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsTrainingRunning(false);
          setTrainingStatus('Training Completed successfully!');
          
          // Save parameters to store
          updateLLMConfig({
            selectedModel,
            temperature,
            systemPersona,
            customGrounding,
            injectCognitiveRules
          });

          return 100;
        }

        if (currentStep < logMessages.length) {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setTrainingLogs(prev => [...prev, `[${timestamp}] ${logMessages[currentStep]}`]);
          setTrainingStatus(logMessages[currentStep]);
          currentStep++;
        }

        return p + 11;
      });
    }, 600);
  };
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  
  // Scorecard states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [focusArea, setFocusArea] = useState('Neutralize FOMO');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Calculated Scorecard parameters
  const [dispScore, setDispScore] = useState(82);
  const [riskScore, setRiskScore] = useState(58);
  const [execPrecision, setExecPrecision] = useState(70);
  const [coachingFeedback, setCoachingFeedback] = useState<string>(
    "We analyzed your trading activity log. Your overall execution parameters are healthy, but focus remains on tighter stop-loss compliance."
  );

  // Teaching / Lessons states
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [lessonStatus, setLessonStatus] = useState('');
  const [lessonData, setLessonData] = useState<CustomLesson | null>(null);
  const [exerciseText, setExerciseText] = useState('');
  const [isExerciseSubmitted, setIsExerciseSubmitted] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>>([
    {
      role: 'assistant',
      text: "Hey there. I'm your Trading Mind Coach. Think of me as your personal psychologist and performance mentor for these markets. We're here to work on your execution discipline, stop emotional triggers like FOMO or revenge trading in their tracks, and keep your head straight when the volatility hits. How have your trades been going today? Feeling any stress or greed creeping in?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const toggleExpand = (id: string) => {
    setExpandedInsightId(prev => (prev === id ? null : id));
  };

  // Run AI Ledger Research & Scorecard Training
  const handleTriggerAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    setAnalysisStatus('Harvesting paper trade logs...');

    const statuses = [
      'Collating emotional sentiment logs...',
      'Running multivariate risk regression...',
      'Evaluating stop-loss overrides...',
      'Adjusting coach neuro-weights...',
      'Researching behavioral variance results...'
    ];

    let statusIndex = 0;
    const interval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        if (statusIndex < statuses.length) {
          setAnalysisStatus(statuses[statusIndex]);
          statusIndex++;
        }
        return p + 18;
      });
    }, 450);

    try {
      const res = await fetch('/api/coach/train-scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journals,
          positions,
          focusArea,
          customPrompt,
          llmConfig: user?.llmConfig,
          cognitiveRules: cognitiveRules
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTimeout(() => {
          setDispScore(data.disciplineScore);
          setRiskScore(data.riskControlScore);
          setExecPrecision(data.executionPrecision);
          setCoachingFeedback(data.feedback);
          if (data.insights && data.insights.length > 0) {
            updateInsights(data.insights);
          }
          setIsAnalyzing(false);
        }, 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Scorecard training failed:", err);
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 3000);
    }
  };

  // Run AI Custom Syllabus Course builder
  const handleGenerateLesson = async () => {
    setIsLessonLoading(true);
    setLessonStatus('Scanning journal emotional tags...');
    setSelectedQuizOption(null);
    setIsQuizSubmitted(false);
    setIsExerciseSubmitted(false);
    setExerciseText('');

    setTimeout(() => setLessonStatus('Identifying core mistake clusters...'), 700);
    setTimeout(() => setLessonStatus('Writing customized cognitive behavioral curriculum...'), 1400);

    try {
      const res = await fetch('/api/coach/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journals,
          llmConfig: user?.llmConfig,
          cognitiveRules: cognitiveRules
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.lesson) {
        setLessonData(data.lesson);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Failed to generate dynamic lesson:", err);
    } finally {
      setIsLessonLoading(false);
    }
  };

  // Send message to Gemini coach
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
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory.map(h => ({
            role: h.role,
            content: h.text
          })),
          llmConfig: user?.llmConfig,
          cognitiveRules: cognitiveRules,
          journals,
          positions
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error || "Server issue");
      }
    } catch (err: any) {
      console.error("Coach Chat Error:", err);
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          text: "I received your message. Sticking to pre-planned horizontal setups and counting to ten when volatile tickers move prevents cognitive over-reaction. Focus on your If-Then rules.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 800);
    } finally {
      setIsChatLoading(false);
    }
  };

  const emotionPrompts = [
    { label: "FOMO Sparked", text: "I see a stock rallying 5% and I have a heavy urge to jump in immediately without a plan." },
    { label: "Suffered Loss", text: "I just closed a trade in loss and I'm feeling angry and want to make the money back immediately." },
    { label: "Anxious to enter", text: "I have a solid entry signal based on my rules, but I'm terrified of pulling the trigger." },
    { label: "Greed rising", text: "My target has been hit, but the momentum is strong and I want to cancel my exit to make more." }
  ];

  // Markdown conceptual formatter (helps render headers and bullet items beautifully without extra heavy packages)
  const renderFormattedConcept = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="text-xs font-bold text-sky-400 font-mono tracking-wider uppercase mt-4 mb-2">{trimmed.replace('###', '')}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} className="text-sm font-bold text-white mt-5 mb-2">{trimmed.replace('##', '')}</h3>;
      }
      if (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
        return <p key={idx} className="text-xs text-gray-300 leading-relaxed pl-2 py-0.5"><span className="text-sky-400 font-mono font-bold mr-1">{trimmed.substring(0,2)}</span> {trimmed.substring(2)}</p>;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return <p key={idx} className="text-xs text-gray-300 leading-relaxed pl-4 flex items-start gap-1 py-0.5"><span className="text-sky-400 mt-1">•</span> {trimmed.substring(1)}</p>;
      }
      if (trimmed === '') return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-xs text-gray-300 leading-relaxed mb-2 font-sans">{trimmed}</p>;
    });
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto w-full">
      {/* Tab Selectors */}
      <div className="flex bg-[#11141c] border border-white/5 rounded-2xl p-1.5 gap-1 shadow-inner">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'chat' 
              ? 'bg-sky-500 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-white/2'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Mind Coach
        </button>

        <button
          onClick={() => setActiveTab('teach')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'teach' 
              ? 'bg-sky-500 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-white/2'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Behavior Syllabus
        </button>

        <button
          onClick={() => setActiveTab('scorecard')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'scorecard' 
              ? 'bg-sky-500 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-white/2'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Scorecard
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Tab 1: Mind Coach Psychology Chat */}
        {activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Quick Emotion prompts */}
            <div className="grid grid-cols-2 gap-2">
              {emotionPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl p-2.5 text-left text-[11px] leading-tight text-gray-300 flex items-start gap-2 transition hover:border-sky-500/25 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">{prompt.label}</span>
                    <span className="text-gray-400 line-clamp-1">{prompt.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Chat Box */}
            <div className="bg-[#11141c] border border-white/5 rounded-2xl h-[410px] flex flex-col justify-between overflow-hidden shadow-2xl">
              <div className="px-4 py-3.5 bg-white/1 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <BrainCircuit className="w-5 h-5 text-sky-400" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-[#11141c]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">AI Trading Psychologist</h4>
                    <span className="text-[9px] text-sky-400 font-mono tracking-wide uppercase">CBT Trading Desk Active</span>
                  </div>
                </div>
                <button
                  onClick={() => setChatHistory([{
                    role: 'assistant',
                    text: "Chat cleared. Let's start fresh. How are you processing your latest trades or emotional thresholds?",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }])}
                  className="text-[10px] text-gray-400 hover:text-white transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Clear
                </button>
              </div>

              {/* Message scroll view */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
                {chatHistory.map((h, i) => {
                  const isUser = h.role === 'user';
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 space-y-1 ${
                        isUser 
                          ? 'bg-sky-500 text-white rounded-tr-sm' 
                          : 'bg-white/3 text-gray-200 border border-white/5 rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-line leading-relaxed">{h.text}</p>
                        <span className={`block text-[8px] text-right font-mono ${isUser ? 'text-white/60' : 'text-gray-500'}`}>
                          {h.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/2 border border-white/5 rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest animate-pulse">COACH COACHING...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Form Input */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="p-3 bg-white/1 border-t border-white/5 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe your emotion (e.g., 'I want to revenge trade after loss')..."
                  className="flex-1 bg-white/2 hover:bg-white/3 border border-white/5 text-xs text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white p-2.5 rounded-xl transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Custom Behavioral Course / Syllabus */}
        {activeTab === 'teach' && (
          <motion.div
            key="teach"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {journals.length === 0 ? (
              <div className="bg-[#11141c] border border-white/5 rounded-2xl p-8 text-center space-y-4 shadow-xl">
                <div className="p-4 bg-sky-500/5 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-sky-500/10">
                  <BookOpen className="w-6 h-6 text-sky-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Interactive Behavioral Syllabus Locked</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                    The coach needs to review your personal trading history to design a personalized course. Please log at least one closed trade in your AI Journal to proceed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Generation Controller */}
                <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-sky-400 uppercase tracking-wider block font-bold">Trading Academy Module</span>
                    <h3 className="text-sm font-bold text-white">Dynamic Behavioral Lesson</h3>
                    <p className="text-[11px] text-gray-500">Researching {journals.length} personal journal entries</p>
                  </div>
                  <button
                    onClick={handleGenerateLesson}
                    disabled={isLessonLoading}
                    className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-sky-500/10"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" /> {lessonData ? 'Re-Generate Lesson' : 'Generate Lesson'}
                  </button>
                </div>

                {isLessonLoading && (
                  <div className="bg-[#11141c] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                    <div className="text-center">
                      <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest block animate-pulse">Consulting Research Library</span>
                      <span className="text-[10px] text-gray-500 font-mono mt-1 block">{lessonStatus}</span>
                    </div>
                  </div>
                )}

                {!isLessonLoading && lessonData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    {/* Lesson Core Concept */}
                    <div className="bg-[#11141c] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-sky-400 animate-pulse" />
                        <h2 className="text-base font-bold text-white leading-tight">{lessonData.title}</h2>
                      </div>

                      {/* Coach problem review */}
                      <div className="bg-sky-500/5 border border-sky-500/10 p-4 rounded-xl text-xs space-y-1 text-gray-300">
                        <span className="text-[9px] font-mono text-sky-400 uppercase font-bold tracking-wider block">Psychologist Diagnostic Research</span>
                        <p className="font-sans italic">"{lessonData.problemAnalysis}"</p>
                      </div>

                      {/* Lesson details */}
                      <div className="pt-3 border-t border-white/5 text-gray-300">
                        {renderFormattedConcept(lessonData.coreConcept)}
                      </div>
                    </div>

                    {/* Interactive Exercise */}
                    <div className="bg-[#11141c] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-bold text-white">{lessonData.exerciseTitle}</h3>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">{lessonData.exercisePrompt}</p>

                      {isExerciseSubmitted ? (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-xs text-emerald-400 flex items-start gap-2 animate-fadeIn">
                          <Check className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">Exercise Logged Successfully! (+20 XP)</span>
                            <span className="text-gray-400">Excellent self-reflection. Writing down implementation intentions strengthens execution under pressure by up to 40%.</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            rows={3}
                            value={exerciseText}
                            onChange={e => setExerciseText(e.target.value)}
                            placeholder="Draft your custom If-Then implementation rule here..."
                            className="w-full bg-white/2 hover:bg-white/4 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                          <button
                            onClick={() => setIsExerciseSubmitted(true)}
                            disabled={!exerciseText.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                          >
                            Submit Takeaway Plan
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Behavioral Quiz */}
                    <div className="bg-[#11141c] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Cognitive Retraining Quiz</span>
                      <h4 className="text-xs font-semibold text-white leading-normal font-sans">{lessonData.quizQuestion}</h4>

                      <div className="space-y-2 pt-2">
                        {lessonData.quizOptions.map((opt, oIdx) => {
                          const isSelected = selectedQuizOption === oIdx;
                          const isCorrect = oIdx === lessonData.quizCorrectIndex;

                          return (
                            <button
                              key={oIdx}
                              disabled={isQuizSubmitted}
                              onClick={() => setSelectedQuizOption(oIdx)}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                                isQuizSubmitted
                                  ? isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                    : isSelected
                                      ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                      : 'bg-white/1 border-white/5 text-gray-500'
                                  : isSelected
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                                    : 'bg-white/2 border-white/5 hover:bg-white/5 text-gray-300 cursor-pointer'
                              }`}
                            >
                              <span>{opt}</span>
                              {isQuizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                              {isQuizSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-bear shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {isQuizSubmitted ? (
                        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                          selectedQuizOption === lessonData.quizCorrectIndex
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-gray-300'
                            : 'bg-red-500/5 border-red-500/10 text-gray-300'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            {selectedQuizOption === lessonData.quizCorrectIndex ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="font-bold text-white font-mono uppercase text-[10px]">Correct Answer! Earned +50 XP</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-bear" />
                                <span className="font-bold text-white font-mono uppercase text-[10px]">Incorrect Answer</span>
                              </>
                            )}
                          </div>
                          <p className="font-sans text-gray-400 text-[11px] leading-relaxed">{lessonData.quizExplanation}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsQuizSubmitted(true)}
                          disabled={selectedQuizOption === null}
                          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                        >
                          Confirm & Grade Answer
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {!isLessonLoading && !lessonData && (
                  <div className="bg-[#11141c] border border-white/5 rounded-2xl p-12 text-center space-y-4">
                    <BookOpen className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Click "Generate Lesson" to let your AI Coach compile a highly targeted trading psychology course based on your logged journals.
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Performance Scorecard tab */}
        {activeTab === 'scorecard' && (
          <motion.div
            key="scorecard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Overview Card with AI and Risk Score rings */}
            <div className="bg-gradient-to-tr from-[#171b26] to-[#11141c] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <BrainCircuit className="w-24 h-24 text-white" />
              </div>

              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">AI Coach Scorecard</h3>
                </div>
                <span className="text-[10px] bg-sky-500/10 text-sky-400 font-mono font-bold px-2.5 py-0.5 rounded-full">
                  Real-time Calculations
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                {/* Discipline Score ring */}
                <div className="text-center space-y-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                    <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.02)" strokeWidth="4" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#0ea5e9" strokeWidth="4" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - dispScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs sm:text-sm font-bold font-mono text-white tabular-numbers">{dispScore}%</span>
                  </div>
                  <span className="block text-[10px] font-medium text-gray-400">Discipline</span>
                </div>

                {/* Risk Control Score */}
                <div className="text-center space-y-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                    <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.02)" strokeWidth="4" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#f59e0b" strokeWidth="4" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - riskScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs sm:text-sm font-bold font-mono text-white tabular-numbers">{riskScore}%</span>
                  </div>
                  <span className="block text-[10px] font-medium text-gray-400">Risk Profile</span>
                </div>

                {/* Execution Precision */}
                <div className="text-center space-y-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
                    <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.02)" strokeWidth="4" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#a855f7" strokeWidth="4" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - execPrecision / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs sm:text-sm font-bold font-mono text-purple-400 tabular-numbers">{execPrecision}%</span>
                  </div>
                  <span className="block text-[10px] font-medium text-gray-400">Precision</span>
                </div>
              </div>
            </div>

            {/* UPGRADED Training Console Panel */}
            <div className="bg-[#11141c] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono uppercase font-bold tracking-wider">
                <Sliders className="w-4 h-4" /> Scorecard Training Controls
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 block font-mono">Select Target Focus Area</label>
                  <select
                    value={focusArea}
                    onChange={e => setFocusArea(e.target.value)}
                    className="w-full bg-[#171b26] border border-white/5 text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Neutralize FOMO">Neutralize FOMO Entries</option>
                    <option value="Stop Loss Control">Strict Stop Loss Control</option>
                    <option value="Position Sizing Control">Position Sizing Consistency</option>
                    <option value="Overcome Revenge Trading">Stop Revenge Trading</option>
                    <option value="Hold Winning Trades">Hold Winners to Targets</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 block font-mono">Custom Focus Directive</label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Focus on early exits in NIFTY options..."
                    className="w-full bg-[#171b26] border border-white/5 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500 placeholder-gray-600"
                  />
                </div>
              </div>

              <button
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing}
                className="w-full mt-3 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-sky-500/10"
              >
                <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} /> 
                {isAnalyzing ? 'Refining Neural Scorecard Model...' : 'Train AI Coach Scorecard'}
              </button>
            </div>

            {/* Shimmering "Thinking" Indicator for Active Coach Analysis */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3 shimmer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                    <span className="text-xs text-sky-400 font-mono font-bold animate-pulse">COACH BRAIN RESEARCHING: {analysisStatus}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Qualitative advice synthesis box */}
            {!isAnalyzing && coachingFeedback && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-sky-500/5 border border-sky-500/10 rounded-2xl p-4 text-xs relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Sparkles className="w-10 h-10 text-sky-400" />
                </div>
                <span className="text-[9px] font-mono text-sky-400 uppercase font-bold tracking-widest block mb-1">
                  Psychometric Ledger Synthesis
                </span>
                <p className="text-gray-300 italic leading-relaxed font-sans font-light">
                  "{coachingFeedback}"
                </p>
              </motion.div>
            )}

            {/* Coach Analysis Insights Feed */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">AI Coach Research Insights</span>

              {insights.map(item => {
                const isExpanded = expandedInsightId === item.id;
                const isHighSeverity = item.severity === 'high';

                return (
                  <div
                    key={item.id}
                    className={`bg-white/2 border rounded-2xl transition overflow-hidden shadow ${
                      isHighSeverity ? 'border-red-500/10' : 'border-white/5'
                    }`}
                  >
                    <div
                      onClick={() => toggleExpand(item.id)}
                      className="p-4 flex justify-between items-start cursor-pointer hover:bg-white/4 transition"
                    >
                      <div className="space-y-1.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            item.category === 'Mistake'
                              ? 'bg-red-500/10 text-red-400'
                              : item.category === 'Risk'
                              ? 'bg-amber-500/10 text-amber-400'
                              : item.category === 'Psychology'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {item.category}
                          </span>
                          {item.tradeReference && (
                            <span className="text-[10px] font-mono text-gray-500">Ref: {item.tradeReference}</span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">{item.headline}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <div className="text-right">
                          <span className="block text-[8px] font-mono text-gray-500 uppercase">Confidence</span>
                          <span className="text-xs font-bold text-sky-400 tabular-numbers">{item.confidence}%</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expand detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 text-[11px] text-gray-400 leading-relaxed border-t border-white/5 pt-3 bg-white/1 font-sans"
                        >
                          {item.description}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
