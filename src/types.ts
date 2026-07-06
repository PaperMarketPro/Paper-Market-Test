/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  name: string;
  email: string;
  phoneNumber?: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  riskTolerance: number; // slider 1-100
  virtualBalance: number;
  initialBalance: number;
  streak: number;
  xp: number;
  level: number;
  isPro: boolean;
  role: 'user' | 'admin';
}

export interface Instrument {
  symbol: string;
  name: string;
  ltp: number;
  change: number; // percentage change e.g. +1.42 or -0.55
  high: number;
  low: number;
  volume: number;
  sparkline: number[];
}

export interface OptionChainItem {
  strike: number;
  calls: {
    ltp: number;
    oi: number;
    volume: number;
    iv: number;
    delta: number;
    theta: number;
  };
  puts: {
    ltp: number;
    oi: number;
    volume: number;
    iv: number;
    delta: number;
    theta: number;
  };
}

export type OrderType = 'Market' | 'Limit' | 'Stop-Loss';
export type OrderStatus = 'Pending' | 'Executed' | 'Cancelled' | 'Rejected';

export interface Order {
  id: string;
  symbol: string;
  direction: 'Buy' | 'Sell';
  type: OrderType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  status: OrderStatus;
  timestamp: string;
}

export interface Position {
  id: string;
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  target?: number;
  timestamp: string;
  status: 'Open' | 'Closed';
  realizedPnl?: number;
  closedTimestamp?: string;
}

export type EmotionTag = 'FOMO' | 'Greedy' | 'Fearful' | 'Disciplined' | 'Revenge' | 'Overconfident' | 'Patient' | 'Anxious';
export type MistakeTag = 'Early Exit' | 'Late Exit' | 'Moved Stop Loss' | 'Oversized Position' | 'No Plan' | 'FOMO Entry' | 'Revenge Trade' | 'Ignored Signal' | 'Broke Rules';

export interface JournalEntry {
  id: string;
  positionId: string;
  symbol: string;
  direction: 'Long' | 'Short';
  pnl: number;
  entryReason: string;
  exitReason: string;
  emotionTags: EmotionTag[];
  mistakeTags: MistakeTag[];
  lessonLearned: string;
  notes: string;
  screenshot?: string;
  timestamp: string;
}

export interface AIInsight {
  id: string;
  category: 'Risk' | 'Psychology' | 'Mistake' | 'Suggestion' | 'Trade';
  headline: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number; // e.g. 92
  tradeReference?: string; // Symbol or ID
}

export interface StrategyCondition {
  id: string;
  indicator: 'EMA' | 'SMA' | 'RSI' | 'MACD' | 'Volume' | 'Price';
  params?: string; // e.g. "20", "14"
  operator: 'crosses above' | 'crosses below' | 'greater than' | 'less than';
  compareWith: 'value' | 'indicator';
  value?: number;
  compareIndicator?: string;
}

export interface CognitiveRule {
  id: string;
  trigger: string;
  action: string;
  isActive: boolean;
  createdAt: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  entryConditions: StrategyCondition[];
  exitConditions: StrategyCondition[];
  isActive: boolean;
  isAutoTradeActive?: boolean;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  maxPositionSize?: number;
  backtestResults?: {
    winRate: number;
    totalReturn: number;
    maxDrawdown: number;
    profitFactor: number;
    equityCurve: number[];
  };
  backtestTrades?: {
    entryDate: string;
    exitDate: string;
    direction: 'Long' | 'Short';
    quantity: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    exitReason: string;
  }[];
  backtestAudit?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isPremium: boolean;
  content: string;
  videoUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number; // percentage
  isPremium: boolean;
  lessons: Lesson[];
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number; // current
  target: number; // total required
  isCompleted: boolean;
  category: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  earnedDate?: string;
  category: string;
}
