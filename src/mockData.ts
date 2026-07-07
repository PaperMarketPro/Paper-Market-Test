/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Instrument, OptionChainItem, Course, Badge, Challenge, AIInsight, Position, Order, JournalEntry } from './types';

// Helper to generate a small random walk
export function randomWalk(current: number, min: number, max: number, volatility: number = 0.001): number {
  const changePercent = (Math.random() - 0.5) * 2 * volatility;
  let next = current * (1 + changePercent);
  if (next < min) next = min;
  if (next > max) next = max;
  return Number(next.toFixed(2));
}

// Preset Indices and Stocks
export const INITIAL_INSTRUMENTS: Instrument[] = [
  {
    symbol: 'NIFTY 50',
    name: 'NSE Nifty 50 Index',
    ltp: 24325.85,
    change: 1.24,
    high: 24410.00,
    low: 24150.30,
    volume: 35000000,
    sparkline: [24150, 24190, 24220, 24180, 24250, 24310, 24290, 24325.85],
  },
  {
    symbol: 'BANKNIFTY',
    name: 'NSE Bank Nifty Index',
    ltp: 52410.50,
    change: -0.42,
    high: 52850.00,
    low: 52110.10,
    volume: 18000000,
    sparkline: [52800, 52650, 52400, 52500, 52310, 52450, 52200, 52410.50],
  },
  {
    symbol: 'FINNIFTY',
    name: 'NSE Nifty Financial Services',
    ltp: 21850.20,
    change: 0.35,
    high: 22010.00,
    low: 21740.00,
    volume: 12000000,
    sparkline: [21750, 21780, 21810, 21840, 21800, 21860, 21830, 21850.20],
  },
  {
    symbol: 'SENSEX',
    name: 'BSE Sensex Index',
    ltp: 79840.40,
    change: 1.15,
    high: 80120.00,
    low: 79350.00,
    volume: 25000000,
    sparkline: [79400, 79450, 79620, 79580, 79700, 79850, 79780, 79840.40],
  },
  {
    symbol: 'MIDCPNIFTY',
    name: 'NSE Nifty Midcap 50 Index',
    ltp: 12140.75,
    change: -0.15,
    high: 12250.00,
    low: 12080.00,
    volume: 8000000,
    sparkline: [12100, 12150, 12120, 12180, 12110, 12160, 12130, 12140.75],
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    ltp: 2980.40,
    change: 1.85,
    high: 3010.00,
    low: 2932.10,
    volume: 4500000,
    sparkline: [2932, 2945, 2960, 2952, 2975, 2990, 2978, 2980.40],
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    ltp: 4125.15,
    change: 0.95,
    high: 4150.00,
    low: 4095.00,
    volume: 1200000,
    sparkline: [4095, 4110, 4105, 4120, 4115, 4135, 4120, 4125.15],
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    ltp: 1642.80,
    change: -1.20,
    high: 1675.00,
    low: 1630.00,
    volume: 2300000,
    sparkline: [1670, 1665, 1650, 1658, 1640, 1645, 1635, 1642.80],
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    ltp: 1715.45,
    change: 2.10,
    high: 1725.00,
    low: 1678.00,
    volume: 6800000,
    sparkline: [1678, 1690, 1695, 1685, 1705, 1712, 1710, 1715.45],
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    ltp: 1210.60,
    change: -0.85,
    high: 1230.00,
    low: 1202.00,
    volume: 4100000,
    sparkline: [1225, 1220, 1215, 1218, 1205, 1212, 1208, 1210.60],
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    ltp: 842.20,
    change: 0.65,
    high: 851.00,
    low: 834.00,
    volume: 7500000,
    sparkline: [835, 838, 845, 840, 842, 846, 841, 842.20],
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd.',
    ltp: 985.90,
    change: 3.42,
    high: 995.00,
    low: 951.00,
    volume: 9100000,
    sparkline: [952, 960, 972, 965, 980, 992, 981, 985.90],
  }
];

// Option Chain for NIFTY (Strike prices surrounding Spot LTP ~ 24325)
export const MOCK_OPTION_CHAIN: OptionChainItem[] = [
  {
    strike: 24200,
    calls: { ltp: 195.40, oi: 45000, volume: 820000, iv: 12.8, delta: 0.72, theta: -8.5 },
    puts: { ltp: 58.20, oi: 120000, volume: 1540000, iv: 13.2, delta: -0.28, theta: -6.1 }
  },
  {
    strike: 24250,
    calls: { ltp: 154.10, oi: 65000, volume: 980000, iv: 12.5, delta: 0.64, theta: -8.9 },
    puts: { ltp: 74.80, oi: 95000, volume: 1120000, iv: 12.9, delta: -0.36, theta: -6.7 }
  },
  {
    strike: 24300, // Near-the-money
    calls: { ltp: 118.50, oi: 98000, volume: 1850000, iv: 12.2, delta: 0.55, theta: -9.5 },
    puts: { ltp: 98.40, oi: 115000, volume: 2200000, iv: 12.6, delta: -0.45, theta: -7.5 }
  },
  {
    strike: 24350, // Near-the-money
    calls: { ltp: 88.20, oi: 125000, volume: 2400000, iv: 12.0, delta: 0.46, theta: -9.8 },
    puts: { ltp: 128.10, oi: 85000, volume: 1450000, iv: 12.3, delta: -0.54, theta: -8.2 }
  },
  {
    strike: 24400,
    calls: { ltp: 63.80, oi: 165000, volume: 3100000, iv: 11.9, delta: 0.37, theta: -9.6 },
    puts: { ltp: 164.50, oi: 55000, volume: 850000, iv: 12.2, delta: -0.63, theta: -8.5 }
  },
  {
    strike: 24450,
    calls: { ltp: 44.50, oi: 110000, volume: 1500000, iv: 11.7, delta: 0.29, theta: -9.0 },
    puts: { ltp: 205.30, oi: 34000, volume: 480000, iv: 12.0, delta: -0.71, theta: -8.0 }
  }
];

// Initial active positions
export const INITIAL_POSITIONS: Position[] = [
  {
    id: 'pos-1',
    symbol: 'RELIANCE',
    direction: 'Long',
    quantity: 50,
    entryPrice: 2950.00,
    currentPrice: 2980.40,
    stopLoss: 2900.00,
    target: 3100.00,
    timestamp: '2026-07-05T10:15:00-07:00',
    status: 'Open'
  },
  {
    id: 'pos-2',
    symbol: 'INFY',
    direction: 'Short',
    quantity: 100,
    entryPrice: 1660.00,
    currentPrice: 1642.80,
    stopLoss: 1690.00,
    target: 1600.00,
    timestamp: '2026-07-05T11:45:00-07:00',
    status: 'Open'
  }
];

// Closed positions for journal & logs
export const CLOSED_POSITIONS: Position[] = [
  {
    id: 'pos-closed-1',
    symbol: 'TCS',
    direction: 'Long',
    quantity: 30,
    entryPrice: 4050.00,
    currentPrice: 4125.15,
    timestamp: '2026-07-04T09:30:00-07:00',
    status: 'Closed',
    realizedPnl: 2254.50,
    closedTimestamp: '2026-07-04T14:45:00-07:00'
  },
  {
    id: 'pos-closed-2',
    symbol: 'SBIN',
    direction: 'Long',
    quantity: 200,
    entryPrice: 855.00,
    currentPrice: 842.20,
    timestamp: '2026-07-03T10:00:00-07:00',
    status: 'Closed',
    realizedPnl: -2560.00,
    closedTimestamp: '2026-07-03T15:15:00-07:00'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    symbol: 'RELIANCE',
    direction: 'Buy',
    type: 'Market',
    quantity: 50,
    status: 'Executed',
    timestamp: '2026-07-05T10:15:00-07:00',
    price: 2950.00
  },
  {
    id: 'ord-102',
    symbol: 'INFY',
    direction: 'Sell',
    type: 'Limit',
    quantity: 100,
    price: 1660.00,
    status: 'Executed',
    timestamp: '2026-07-05T11:45:00-07:00'
  },
  {
    id: 'ord-103',
    symbol: 'HDFCBANK',
    direction: 'Buy',
    type: 'Limit',
    quantity: 150,
    price: 1700.00,
    status: 'Pending',
    timestamp: '2026-07-05T14:20:00-07:00'
  }
];

export const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: 'jr-1',
    positionId: 'pos-closed-1',
    symbol: 'TCS',
    direction: 'Long',
    pnl: 2254.50,
    entryReason: 'TCS crossed above its 50-day moving average on heavy volume. Support at 4020 was verified.',
    exitReason: 'Price hit my visual target near resistance of 4130.',
    emotionTags: ['Disciplined', 'Patient'],
    mistakeTags: [],
    lessonLearned: 'Patience and waiting for the moving average confirmation pay off in sideways markets.',
    notes: 'No stress during the trade. Followed the stop loss rules perfectly.',
    timestamp: '2026-07-04T15:00:00-07:00'
  },
  {
    id: 'jr-2',
    positionId: 'pos-closed-2',
    symbol: 'SBIN',
    direction: 'Long',
    pnl: -2560.00,
    entryReason: 'Chased the breakout after SBI jumped 1.5% in 5 minutes.',
    exitReason: 'Panicked and exited near the low when price pulled back and cracked through local support.',
    emotionTags: ['FOMO', 'Anxious', 'Revenge'],
    mistakeTags: ['FOMO Entry', 'Revenge Trade', 'Oversized Position'],
    lessonLearned: 'Never jump into a fast moving train without an exact stop-loss planning beforehand.',
    notes: 'Exceeded my single trade risk boundary by sizing too large. Felt restless.',
    timestamp: '2026-07-03T16:00:00-07:00'
  }
];

// Dynamic AI Insights Feed
export const INITIAL_AI_INSIGHTS: AIInsight[] = [
  {
    id: 'insight-1',
    category: 'Mistake',
    headline: 'Over-exposure on Quick Breakouts Detected',
    description: 'Based on your SBIN trade on July 3rd, you entered with a position size 2.5x larger than your average, prompted by a rapid price spurt (FOMO). This leads to heightened anxiety and pre-emptive exits.',
    severity: 'high',
    confidence: 94,
    tradeReference: 'SBIN'
  },
  {
    id: 'insight-2',
    category: 'Risk',
    headline: 'Excellent Risk-to-Reward Ratio',
    description: 'Your TCS position of July 4th showed an optimized 1:3 Risk-to-Reward setup. Consistent utilization of this formula guarantees profitability even with a 40% win rate.',
    severity: 'low',
    confidence: 98,
    tradeReference: 'TCS'
  },
  {
    id: 'insight-3',
    category: 'Psychology',
    headline: 'Revenge Trading Pattern Warning',
    description: 'When a loss exceeds ₹2,000, you tend to place another trade within 12 minutes. This has historically resulted in an average loss of ₹1,400 per recovery attempt. Try setting a cool-off timer of 30 minutes after any loss.',
    severity: 'high',
    confidence: 89
  },
  {
    id: 'insight-4',
    category: 'Suggestion',
    headline: 'Optimize Stop Losses in Intraday',
    description: 'We noticed you often set stop losses too tight (under 0.5% of asset value) for volatile stocks like TATAMOTORS. Consider using the ATR (Average True Range) indicator to give trades enough breathing room.',
    severity: 'medium',
    confidence: 85
  }
];

// Academy Courses
export const ACADEMY_COURSES: Course[] = [
  {
    id: 'crs-1',
    title: 'Trading Basics for Beginners',
    description: 'Learn the foundational building blocks of stock markets, how order routing works, bid-ask spreads, and basic charts.',
    level: 'Beginner',
    duration: '45 mins',
    progress: 100,
    isPremium: false,
    lessons: [
      {
        id: 'l-101',
        title: 'What is a Stock Market?',
        duration: '10 mins',
        isCompleted: true,
        isPremium: false,
        content: `### 1. Introduction to Stock Markets
A stock market, equity market, or share market is the aggregation of buyers and sellers of stocks, which represent ownership claims on businesses.

### 2. How Stock Prices Move
Stock prices change because of supply and demand. If more people want to buy a stock (demand) than sell it (supply), then the price moves up. If more people want to sell a stock than buy it, there would be greater supply than demand, and the price would fall.

### 3. Key Players
- **Exchanges** (e.g., NSE, BSE in India, NYSE in US): The centralized marketplaces.
- **Brokers**: The intermediaries allowing retail users to buy/sell (e.g. Zerodha, Groww).
- **Traders vs Investors**: Investors hold for years; traders hold for seconds, minutes, or days.`
      },
      {
        id: 'l-102',
        title: 'Understanding Order Types',
        duration: '15 mins',
        isCompleted: true,
        isPremium: false,
        content: `### 1. Market Orders
A market order executes immediately at the best available current market price. Use when speed of execution is your highest priority.

### 2. Limit Orders
A limit order allows you to specify the maximum buy price or minimum sell price you are willing to accept. The order will only execute if the price reaches or passes your limit.

### 3. Stop-Loss Orders
A stop-loss order becomes active only once a specific "trigger price" is touched. It is critical for protecting capital and managing maximum possible risk.`
      },
      {
        id: 'l-103',
        title: 'Bid-Ask Spread & Liquidity',
        duration: '20 mins',
        isCompleted: true,
        isPremium: false,
        content: `### 1. What is the Order Book?
The order book is a real-time, continuously updated ledger showing all pending limit buy and sell orders.

### 2. The Spread
- **Bid**: The highest price a buyer is willing to pay.
- **Ask**: The lowest price a seller is willing to accept.
- **Spread**: The difference between the Ask and the Bid. Highly liquid assets have a very tight spread (e.g. ₹0.05).`
      }
    ],
    quiz: {
      questions: [
        {
          question: 'Which order type guarantees execution but does not guarantee the exact price?',
          options: ['Limit Order', 'Market Order', 'Stop-Loss Order', 'GTT Order'],
          correctIndex: 1,
          explanation: 'A Market Order guarantees immediate execution at the current best available price, but slippage can occur in volatile markets.'
        },
        {
          question: 'What is the bid-ask spread?',
          options: [
            'The total volume of shares traded',
            'The difference between the day high and day low',
            'The difference between the highest buy bid and the lowest sell ask',
            'The fee charged by the broker'
          ],
          correctIndex: 2,
          explanation: 'The bid-ask spread is the gap between the highest price a buyer is offering (bid) and the lowest price a seller is demanding (ask).'
        }
      ]
    }
  },
  {
    id: 'crs-2',
    title: 'Introduction to Options Trading',
    description: 'Master calls, puts, premium decay, option Greeks, and basic single-leg options strategies.',
    level: 'Intermediate',
    duration: '1.5 hours',
    progress: 33,
    isPremium: true,
    lessons: [
      {
        id: 'l-201',
        title: 'What are Call and Put Options?',
        duration: '20 mins',
        isCompleted: true,
        isPremium: false,
        content: `### 1. What is an Option?
An option is a contract that gives the buyer the right, but not the obligation, to buy or sell an underlying asset at a specified strike price within a certain timeframe.

### 2. Call Options (Bullish Outlook)
Buying a Call option gives you the right to BUY the asset. You profit if the price rises significantly past the strike price plus the premium paid.

### 3. Put Options (Bearish Outlook)
Buying a Put option gives you the right to SELL the asset. You profit if the price falls significantly below the strike price minus premium.`
      },
      {
        id: 'l-202',
        title: 'The Mechanics of Premium Decay (Theta)',
        duration: '30 mins',
        isCompleted: false,
        isPremium: true,
        content: `### 1. Extrinsic vs Intrinsic Value
An options premium is composed of two values:
- **Intrinsic Value**: The real value if exercised right now.
- **Extrinsic (Time) Value**: The speculative premium representing the time left until expiry.

### 2. Time Decay (Theta)
Time decay represents the erosion of an option option's extrinsic value as it approaches expiration. Theta is negative for options buyers, meaning your option loses value every day, even if the stock price does not move.`
      },
      {
        id: 'l-203',
        title: 'Understanding Delta and Option Greeks',
        duration: '40 mins',
        isCompleted: false,
        isPremium: true,
        content: `### Option Greeks:
- **Delta**: Measures the sensitivity of an option premium to a ₹1 change in the underlying stock.
- **Gamma**: Measures the rate of change of Delta.
- **Theta**: Time decay rate.
- **Vega**: Volatility sensitivity.`
      }
    ],
    quiz: {
      questions: [
        {
          question: 'If you purchase a CALL option, you generally expect the stock price to:',
          options: ['Go down', 'Go up', 'Stay exactly flat', 'Consolidate'],
          correctIndex: 1,
          explanation: 'Call options are bullish contracts; buyers expect prices to rise above the strike price.'
        },
        {
          question: 'Which Option Greek represents time decay?',
          options: ['Delta', 'Vega', 'Gamma', 'Theta'],
          correctIndex: 3,
          explanation: 'Theta measures the rate of decay of an option premium over time.'
        }
      ]
    }
  },
  {
    id: 'crs-3',
    title: 'Risk Management & Trading Psychology',
    description: 'Learn position sizing formulas, drawdown defense, avoiding FOMO, and creating clear rule-based journals.',
    level: 'Advanced',
    duration: '2 hours',
    progress: 0,
    isPremium: false,
    lessons: [
      {
        id: 'l-301',
        title: 'The 1% Risk Sizing Rule',
        duration: '25 mins',
        isCompleted: false,
        isPremium: false,
        content: `### 1. What is Capital Risk?
Never risk more than 1% to 2% of your total virtual capital on any single trade.

### 2. Sizing Formula
To calculate how many shares/lots to buy:
**Suggested Quantity = (Total Capital * Risk %) / (Entry Price - Stop Loss Price)**

*Example*: Capital = ₹100,000. Risk % = 1% (₹1,000). Entry = ₹1,000. Stop Loss = ₹980.
- Stop Distance = ₹20.
- Quantity = ₹1,000 / ₹20 = 50 shares.`
      },
      {
        id: 'l-302',
        title: 'How to Prevent Overtrading and FOMO',
        duration: '35 mins',
        isCompleted: false,
        isPremium: false,
        content: `### Psychological Triggers of Losses
1. **FOMO (Fear of Missing Out)**: Entering high-velocity trends too late.
2. **Revenge Trading**: Trying to "win back" lost money immediately by increasing size.

### Best Defenses
- Set a strict rule: Max 3-4 trades per day.
- Lock your terminal or close the app if daily loss limits are breached.`
      }
    ]
  }
];

// Challenges list
export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'ch-1',
    title: 'Rigorous Journaler',
    description: 'Journal 3 closed positions with detailed notes, entry/exit reasons, and tags.',
    xpReward: 200,
    progress: 1,
    target: 3,
    isCompleted: false,
    category: 'Journal'
  },
  {
    id: 'ch-2',
    title: 'Patience Champion',
    description: 'Complete 2 full lessons in any premium option course.',
    xpReward: 150,
    progress: 1,
    target: 2,
    isCompleted: false,
    category: 'Academy'
  },
  {
    id: 'ch-3',
    title: 'Discipline Master',
    description: 'Hold any open position with both Target and Stop-Loss defined for at least 24 hours.',
    xpReward: 300,
    progress: 1,
    target: 1,
    isCompleted: true,
    category: 'Trade'
  }
];

// Badges / Achievements
export const INITIAL_BADGES: Badge[] = [
  {
    id: 'bd-1',
    code: 'FIRST_TRADE',
    name: 'First Blood',
    description: 'Successfully executed your first paper trade order.',
    icon: 'ShieldAlert',
    isEarned: true,
    earnedDate: '2026-07-02',
    category: 'Trade'
  },
  {
    id: 'bd-2',
    code: 'STREAK_5',
    name: 'High Flyer',
    description: 'Maintained a 5-day active trading or learning streak.',
    icon: 'Flame',
    isEarned: true,
    earnedDate: '2026-07-05',
    category: 'Discipline'
  },
  {
    id: 'bd-3',
    code: 'NO_MISTAKES',
    name: 'Pristine Record',
    description: 'Journaled 3 trades with zero marked emotional mistakes.',
    icon: 'CheckCircle',
    isEarned: false,
    category: 'Journal'
  },
  {
    id: 'bd-4',
    code: 'OPTIONS_PRO',
    name: 'Contract Architect',
    description: 'Completed the advanced options trading quiz with 100% score.',
    icon: 'TrendingUp',
    isEarned: false,
    category: 'Academy'
  },
  {
    id: 'bd-5',
    code: 'RISK_MINIMIZER',
    name: 'Safe Haven',
    description: 'Kept single trade risk below 1% of total balance for 5 consecutive trades.',
    icon: 'Activity',
    isEarned: false,
    category: 'Risk'
  }
];
