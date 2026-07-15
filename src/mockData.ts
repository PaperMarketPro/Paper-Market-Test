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
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro Ltd.',
    ltp: 3560.15,
    change: 0.75,
    high: 3590.00,
    low: 3520.00,
    volume: 1400000,
    sparkline: [3525, 3540, 3530, 3555, 3550, 3575, 3545, 3560.15],
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd.',
    ltp: 1425.30,
    change: -0.85,
    high: 1445.00,
    low: 1412.00,
    volume: 3800000,
    sparkline: [1440, 1435, 1420, 1430, 1415, 1428, 1418, 1425.30],
  },
  {
    symbol: 'ITC',
    name: 'ITC Ltd.',
    ltp: 432.40,
    change: 1.20,
    high: 436.00,
    low: 426.50,
    volume: 12500000,
    sparkline: [427, 429, 428, 431, 430, 434, 431, 432.40],
  },
  {
    symbol: 'HINDUNILVR',
    name: 'Hindustan Unilever Ltd.',
    ltp: 2485.60,
    change: 0.15,
    high: 2510.00,
    low: 2465.00,
    volume: 1100000,
    sparkline: [2470, 2485, 2475, 2495, 2480, 2502, 2482, 2485.60],
  },
  {
    symbol: 'WIPRO',
    name: 'Wipro Ltd.',
    ltp: 495.80,
    change: -1.45,
    high: 508.00,
    low: 490.00,
    volume: 4500000,
    sparkline: [506, 502, 498, 503, 494, 499, 492, 495.80],
  },
  {
    symbol: 'AXISBANK',
    name: 'Axis Bank Ltd.',
    ltp: 1245.50,
    change: 1.65,
    high: 1260.00,
    low: 1215.00,
    volume: 4800000,
    sparkline: [1218, 1225, 1235, 1230, 1248, 1255, 1240, 1245.50],
  },
  {
    symbol: 'KOTAKBANK',
    name: 'Kotak Mahindra Bank Ltd.',
    ltp: 1785.00,
    change: -0.35,
    high: 1805.00,
    low: 1770.00,
    volume: 2100000,
    sparkline: [1798, 1792, 1780, 1790, 1775, 1788, 1782, 1785.00],
  },
  {
    symbol: 'BAJFINANCE',
    name: 'Bajaj Finance Ltd.',
    ltp: 7120.40,
    change: 2.10,
    high: 7180.00,
    low: 6950.00,
    volume: 950000,
    sparkline: [6960, 7010, 7050, 7030, 7110, 7160, 7100, 7120.40],
  },
  {
    symbol: 'M&M',
    name: 'Mahindra & Mahindra Ltd.',
    ltp: 2840.10,
    change: 1.90,
    high: 2875.00,
    low: 2780.00,
    volume: 1900000,
    sparkline: [2785, 2810, 2805, 2835, 2820, 2865, 2830, 2840.10],
  },
  {
    symbol: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries Ltd.',
    ltp: 1540.25,
    change: 0.45,
    high: 1560.00,
    low: 1525.00,
    volume: 1600000,
    sparkline: [1530, 1538, 1545, 1535, 1552, 1558, 1538, 1540.25],
  },
  {
    symbol: 'ADANIENT',
    name: 'Adani Enterprises Ltd.',
    ltp: 3110.45,
    change: 1.62,
    high: 3150.00,
    low: 3045.00,
    volume: 1800000,
    sparkline: [3050, 3080, 3065, 3120, 3090, 3115, 3105, 3110.45],
  },
  {
    symbol: 'ADANIPORTS',
    name: 'Adani Ports & SEZ Ltd.',
    ltp: 1482.30,
    change: -0.55,
    high: 1512.00,
    low: 1465.00,
    volume: 2400000,
    sparkline: [1495, 1490, 1475, 1488, 1470, 1485, 1478, 1482.30],
  },
  {
    symbol: 'APOLLOHOSP',
    name: 'Apollo Hospitals Enterprise Ltd.',
    ltp: 6245.80,
    change: 0.85,
    high: 6310.00,
    low: 6180.00,
    volume: 380000,
    sparkline: [6190, 6210, 6205, 6240, 6220, 6265, 6235, 6245.80],
  },
  {
    symbol: 'ASIANPAINT',
    name: 'Asian Paints Ltd.',
    ltp: 2895.15,
    change: -1.15,
    high: 2940.00,
    low: 2875.00,
    volume: 950000,
    sparkline: [2935, 2920, 2910, 2915, 2885, 2898, 2890, 2895.15],
  },
  {
    symbol: 'BAJAJ-AUTO',
    name: 'Bajaj Auto Ltd.',
    ltp: 9745.20,
    change: 2.35,
    high: 9850.00,
    low: 9510.00,
    volume: 420000,
    sparkline: [9520, 9600, 9580, 9680, 9650, 9760, 9710, 9745.20],
  },
  {
    symbol: 'BAJAJFINSV',
    name: 'Bajaj Finserv Ltd.',
    ltp: 1612.40,
    change: 0.95,
    high: 1635.00,
    low: 1592.00,
    volume: 1200000,
    sparkline: [1595, 1605, 1600, 1615, 1608, 1622, 1610, 1612.40],
  },
  {
    symbol: 'BPCL',
    name: 'Bharat Petroleum Corporation Ltd.',
    ltp: 342.80,
    change: -1.25,
    high: 351.00,
    low: 338.50,
    volume: 8500000,
    sparkline: [349, 347, 343, 345, 340, 344, 341, 342.80],
  },
  {
    symbol: 'BRITANNIA',
    name: 'Britannia Industries Ltd.',
    ltp: 5325.50,
    change: 0.45,
    high: 5380.00,
    low: 5280.00,
    volume: 480000,
    sparkline: [5290, 5310, 5300, 5335, 5315, 5345, 5320, 5325.50],
  },
  {
    symbol: 'CIPLA',
    name: 'Cipla Ltd.',
    ltp: 1512.60,
    change: 1.15,
    high: 1530.00,
    low: 1490.50,
    volume: 1400000,
    sparkline: [1492, 1500, 1498, 1512, 1505, 1520, 1510, 1512.60],
  },
  {
    symbol: 'COALINDIA',
    name: 'Coal India Ltd.',
    ltp: 481.25,
    change: 2.15,
    high: 488.50,
    low: 470.10,
    volume: 9800000,
    sparkline: [471, 474, 473, 479, 476, 483, 479, 481.25],
  },
  {
    symbol: 'DIVISLAB',
    name: 'Divi\'s Laboratories Ltd.',
    ltp: 3955.90,
    change: -0.85,
    high: 4015.00,
    low: 3920.00,
    volume: 380000,
    sparkline: [4005, 3990, 3975, 3988, 3940, 3965, 3948, 3955.90],
  },
  {
    symbol: 'DRREDDY',
    name: 'Dr. Reddy\'s Laboratories Ltd.',
    ltp: 6122.40,
    change: 0.52,
    high: 6185.00,
    low: 6060.00,
    volume: 450000,
    sparkline: [6070, 6095, 6080, 6120, 6100, 6145, 6115, 6122.40],
  },
  {
    symbol: 'EICHERMOT',
    name: 'Eicher Motors Ltd.',
    ltp: 4752.10,
    change: 1.85,
    high: 4810.00,
    low: 4650.00,
    volume: 620000,
    sparkline: [4660, 4690, 4680, 4735, 4710, 4775, 4740, 4752.10],
  },
  {
    symbol: 'GRASIM',
    name: 'Grasim Industries Ltd.',
    ltp: 2512.80,
    change: 0.35,
    high: 2545.00,
    low: 2488.00,
    volume: 780000,
    sparkline: [2492, 2505, 2498, 2515, 2508, 2525, 2510, 2512.80],
  },
  {
    symbol: 'HCLTECH',
    name: 'HCL Technologies Ltd.',
    ltp: 1452.40,
    change: -0.65,
    high: 1475.00,
    low: 1438.00,
    volume: 2100000,
    sparkline: [1468, 1462, 1450, 1458, 1442, 1456, 1448, 1452.40],
  },
  {
    symbol: 'HEROMOTOCO',
    name: 'Hero MotoCorp Ltd.',
    ltp: 5515.35,
    change: 1.25,
    high: 5590.00,
    low: 5430.00,
    volume: 520000,
    sparkline: [5440, 5470, 5460, 5510, 5485, 5545, 5505, 5515.35],
  },
  {
    symbol: 'HINDALCO',
    name: 'Hindalco Industries Ltd.',
    ltp: 686.40,
    change: 1.95,
    high: 694.50,
    low: 671.00,
    volume: 5800000,
    sparkline: [672, 678, 675, 684, 680, 689, 683, 686.40],
  },
  {
    symbol: 'INDUSINDBK',
    name: 'IndusInd Bank Ltd.',
    ltp: 1412.50,
    change: -1.05,
    high: 1438.00,
    low: 1395.00,
    volume: 1800000,
    sparkline: [1430, 1425, 1415, 1422, 1402, 1418, 1408, 1412.50],
  },
  {
    symbol: 'JSWSTEEL',
    name: 'JSW Steel Ltd.',
    ltp: 932.15,
    change: 0.75,
    high: 945.00,
    low: 921.00,
    volume: 2900000,
    sparkline: [922, 927, 925, 933, 929, 938, 930, 932.15],
  },
  {
    symbol: 'LTIM',
    name: 'LTI Mindtree Ltd.',
    ltp: 5122.90,
    change: -1.45,
    high: 5230.00,
    low: 5080.00,
    volume: 480000,
    sparkline: [5210, 5180, 5150, 5165, 5095, 5135, 5110, 5122.90],
  },
  {
    symbol: 'MARUTI',
    name: 'Maruti Suzuki India Ltd.',
    ltp: 12155.80,
    change: 2.65,
    high: 12280.00,
    low: 11810.00,
    volume: 580000,
    sparkline: [11830, 11950, 11910, 12050, 12010, 12180, 12120, 12155.80],
  },
  {
    symbol: 'NESTLEIND',
    name: 'Nestle India Ltd.',
    ltp: 2542.30,
    change: -0.25,
    high: 2570.00,
    low: 2525.00,
    volume: 420000,
    sparkline: [2560, 2552, 2540, 2548, 2530, 2546, 2538, 2542.30],
  },
  {
    symbol: 'NTPC',
    name: 'NTPC Ltd.',
    ltp: 371.45,
    change: 1.55,
    high: 376.80,
    low: 364.50,
    volume: 11200000,
    sparkline: [365, 368, 366, 372, 369, 374, 370, 371.45],
  },
  {
    symbol: 'ONGC',
    name: 'Oil & Natural Gas Corporation Ltd.',
    ltp: 271.85,
    change: 2.45,
    high: 275.40,
    low: 263.80,
    volume: 14500000,
    sparkline: [264, 267, 265, 270, 268, 273, 270, 271.85],
  },
  {
    symbol: 'POWERGRID',
    name: 'Power Grid Corporation of India Ltd.',
    ltp: 311.20,
    change: 0.85,
    high: 315.60,
    low: 307.20,
    volume: 9200000,
    sparkline: [308, 309, 308, 312, 310, 313, 310, 311.20],
  },
  {
    symbol: 'SHRIRAMFIN',
    name: 'Shriram Finance Ltd.',
    ltp: 2682.40,
    change: 1.35,
    high: 2720.00,
    low: 2630.00,
    volume: 1100000,
    sparkline: [2635, 2655, 2645, 2675, 2660, 2695, 2670, 2682.40],
  },
  {
    symbol: 'TATACONSUM',
    name: 'Tata Consumer Products Ltd.',
    ltp: 1142.15,
    change: -0.45,
    high: 1158.00,
    low: 1130.00,
    volume: 1800000,
    sparkline: [1152, 1148, 1140, 1146, 1135, 1145, 1138, 1142.15],
  },
  {
    symbol: 'TATASTEEL',
    name: 'Tata Steel Ltd.',
    ltp: 165.80,
    change: 0.65,
    high: 168.20,
    low: 163.50,
    volume: 24500000,
    sparkline: [164, 164.5, 165, 164.8, 166, 166.5, 165.5, 165.80],
  },
  {
    symbol: 'TECHM',
    name: 'Tech Mahindra Ltd.',
    ltp: 1432.50,
    change: 0.95,
    high: 1455.00,
    low: 1410.00,
    volume: 1600000,
    sparkline: [1412, 1422, 1418, 1430, 1424, 1438, 1428, 1432.50],
  },
  {
    symbol: 'TITAN',
    name: 'Titan Company Ltd.',
    ltp: 3262.15,
    change: -0.75,
    high: 3310.00,
    low: 3242.00,
    volume: 1100000,
    sparkline: [3295, 3280, 3260, 3275, 3245, 3268, 3255, 3262.15],
  },
  {
    symbol: 'ULTRACEMCO',
    name: 'UltraTech Cement Ltd.',
    ltp: 10755.40,
    change: 1.15,
    high: 10880.00,
    low: 10620.00,
    volume: 320000,
    sparkline: [10630, 10690, 10660, 10720, 10680, 10780, 10730, 10755.40],
  },
  {
    symbol: 'UPL',
    name: 'UPL Ltd.',
    ltp: 551.35,
    change: -2.15,
    high: 567.00,
    low: 544.20,
    volume: 3100000,
    sparkline: [564, 560, 552, 555, 546, 553, 548, 551.35],
  },
  {
    symbol: 'JSWENERGY',
    name: 'JSW Energy Ltd.',
    ltp: 682.40,
    change: 3.15,
    high: 694.00,
    low: 652.00,
    volume: 4500000,
    sparkline: [653, 662, 675, 668, 680, 691, 678, 682.40],
  },
  {
    symbol: 'ZOMATO',
    name: 'Zomato Ltd.',
    ltp: 221.30,
    change: 4.82,
    high: 224.80,
    low: 210.50,
    volume: 38000000,
    sparkline: [211, 214, 218, 215, 220, 223, 219, 221.30],
  },
  {
    symbol: 'JIOFIN',
    name: 'Jio Financial Services Ltd.',
    ltp: 351.45,
    change: 1.35,
    high: 356.90,
    low: 345.10,
    volume: 12400000,
    sparkline: [346, 348, 347, 351, 349, 354, 350, 351.45],
  },
  {
    symbol: 'IRFC',
    name: 'Indian Railway Finance Corporation Ltd.',
    ltp: 175.60,
    change: -0.95,
    high: 179.80,
    low: 173.20,
    volume: 28500000,
    sparkline: [178, 177.5, 175, 176.2, 174, 176, 174.5, 175.60],
  },
  {
    symbol: 'RVNL',
    name: 'Rail Vikas Nigam Ltd.',
    ltp: 491.20,
    change: 5.42,
    high: 498.50,
    low: 462.00,
    volume: 18400000,
    sparkline: [463, 471, 479, 474, 485, 495, 488, 491.20],
  },
  {
    symbol: 'HAL',
    name: 'Hindustan Aeronautics Ltd.',
    ltp: 4855.90,
    change: 2.10,
    high: 4910.00,
    low: 4740.00,
    volume: 1450000,
    sparkline: [4745, 4785, 4770, 4825, 4805, 4875, 4840, 4855.90],
  },
  {
    symbol: 'SBILIFE',
    name: 'SBI Life Insurance Company Ltd.',
    ltp: 1450.40,
    change: 0.85,
    high: 1475.00,
    low: 1435.00,
    volume: 850000,
    sparkline: [1435, 1442, 1448, 1440, 1455, 1462, 1448, 1450.40],
  },
  {
    symbol: 'HDFCLIFE',
    name: 'HDFC Life Insurance Company Ltd.',
    ltp: 595.60,
    change: -0.42,
    high: 610.00,
    low: 588.00,
    volume: 1800000,
    sparkline: [602, 598, 592, 595, 589, 597, 593, 595.60],
  }
];

// Dynamically generate Near (July) and Next (August) Month Futures for all market instruments
export function generateFuturesForInstruments(insts: Instrument[]): Instrument[] {
  const list: Instrument[] = [];
  insts.forEach(inst => {
    const shortName = inst.name.replace(' Ltd.', '').replace(' Corporation', '').replace(' Company', '');
    // Near Month (30-JUL-26) Expiry FUT with a minor standard premium
    list.push({
      symbol: `${inst.symbol} 30-JUL-26 FUT`,
      name: `${shortName} Futures`,
      ltp: Number((inst.ltp * 1.0025).toFixed(2)),
      change: inst.change,
      high: Number((inst.high * 1.0025).toFixed(2)),
      low: Number((inst.low * 1.0025).toFixed(2)),
      volume: Math.round(inst.volume * 0.15),
      sparkline: inst.sparkline.map(v => Number((v * 1.0025).toFixed(2))),
    });
    // Next Month (27-AUG-26) Expiry FUT with slightly larger premium
    list.push({
      symbol: `${inst.symbol} 27-AUG-26 FUT`,
      name: `${shortName} Futures`,
      ltp: Number((inst.ltp * 1.005).toFixed(2)),
      change: inst.change,
      high: Number((inst.high * 1.005).toFixed(2)),
      low: Number((inst.low * 1.005).toFixed(2)),
      volume: Math.round(inst.volume * 0.08),
      sparkline: inst.sparkline.map(v => Number((v * 1.005).toFixed(2))),
    });
  });
  return list;
}

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
    symbol: 'SBIN',
    direction: 'Long',
    quantity: 100,
    entryPrice: 855.00,
    currentPrice: 833.00,
    timestamp: '2026-07-02T10:00:00-07:00',
    status: 'Closed',
    realizedPnl: -2200.00,
    closedTimestamp: '2026-07-02T15:15:00-07:00'
  },
  {
    id: 'pos-closed-2',
    symbol: 'TCS',
    direction: 'Long',
    quantity: 64,
    entryPrice: 4050.00,
    currentPrice: 4125.00,
    timestamp: '2026-07-03T09:30:00-07:00',
    status: 'Closed',
    realizedPnl: 4800.00,
    closedTimestamp: '2026-07-03T14:45:00-07:00'
  },
  {
    id: 'pos-closed-3',
    symbol: 'RELIANCE',
    direction: 'Long',
    quantity: 80,
    entryPrice: 2950.00,
    currentPrice: 2918.00,
    timestamp: '2026-07-04T10:30:00-07:00',
    status: 'Closed',
    realizedPnl: -2560.00,
    closedTimestamp: '2026-07-04T15:00:00-07:00'
  },
  {
    id: 'pos-closed-4',
    symbol: 'INFY',
    direction: 'Short',
    quantity: 100,
    entryPrice: 1660.00,
    currentPrice: 1680.00,
    timestamp: '2026-07-05T11:45:00-07:00',
    status: 'Closed',
    realizedPnl: -2000.00,
    closedTimestamp: '2026-07-05T16:00:00-07:00'
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
