/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Format a Date object to standard Indian market date format: DD-MMM-YYYY or DD-MMM-YY
 */
export function formatDateToIndianFormat(date: Date, includeFullYear = true): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mmm = MONTHS[date.getMonth()];
  const yyyy = date.getFullYear();
  const yy = String(yyyy).substring(2);
  return includeFullYear ? `${dd}-${mmm}-${yyyy}` : `${dd}-${mmm}-${yy}`;
}

/**
 * Find the last Thursday of a given month and year
 */
export function getLastThursdayOfMonth(year: number, month: number): Date {
  // Create a date object at the last day of the given month (0th day of next month)
  const date = new Date(year, month + 1, 0);
  // Move backwards until we find Thursday (day index 4)
  while (date.getDay() !== 4) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}

export interface FuturesExpiries {
  near: Date;
  next: Date;
  nearStr: string;
  nextStr: string;
}

/**
 * Dynamically calculates the Near Month and Next Month futures expiration dates
 * based on the current local date.
 */
export function getFuturesExpiries(baseDate = new Date()): FuturesExpiries {
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth(); // 0-indexed

  // Find the last Thursday of the current month
  const nearMonthThursday = getLastThursdayOfMonth(currentYear, currentMonth);

  // Set standard midnight time on dates for safe comparison
  const baseCompare = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const nearCompare = new Date(nearMonthThursday.getFullYear(), nearMonthThursday.getMonth(), nearMonthThursday.getDate());

  let nearExpiryDate: Date;
  let nextExpiryDate: Date;

  if (baseCompare.getTime() <= nearCompare.getTime()) {
    // Current month's last Thursday hasn't passed yet (or is today)
    nearExpiryDate = nearMonthThursday;
    nextExpiryDate = getLastThursdayOfMonth(currentYear, currentMonth + 1);
  } else {
    // Current month's last Thursday has passed, so roll over
    nearExpiryDate = getLastThursdayOfMonth(currentYear, currentMonth + 1);
    nextExpiryDate = getLastThursdayOfMonth(currentYear, currentMonth + 2);
  }

  return {
    near: nearExpiryDate,
    next: nextExpiryDate,
    nearStr: formatDateToIndianFormat(nearExpiryDate, false), // e.g. "30-JUL-26"
    nextStr: formatDateToIndianFormat(nextExpiryDate, false), // e.g. "27-AUG-26"
  };
}

/**
 * Dynamically gets the option chain weekly or monthly expiration dates for a specific underlier
 * based on current market standards.
 * 
 * - NIFTY 50: Thursdays
 * - BANKNIFTY: Wednesdays
 * - FINNIFTY: Tuesdays
 * - MIDCPNIFTY: Mondays
 * - SENSEX: Fridays
 * - Equities (RELIANCE, TCS, etc.): Only monthly expiries (last Thursday of near/next months)
 */
export function getWeeklyExpiriesForUnderlier(symbol: string, baseDate = new Date()): string[] {
  let targetDay = 4; // Default to Thursday (Nifty, Stocks)
  const cleanSym = symbol.toUpperCase();

  if (cleanSym.includes('BANKNIFTY')) {
    targetDay = 3; // Wednesday
  } else if (cleanSym.includes('FINNIFTY')) {
    targetDay = 2; // Tuesday
  } else if (cleanSym.includes('MIDCPNIFTY')) {
    targetDay = 1; // Monday
  } else if (cleanSym.includes('SENSEX')) {
    targetDay = 5; // Friday
  }

  const isIndex = ['NIFTY 50', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'].includes(cleanSym);

  if (!isIndex) {
    // Stocks ONLY have monthly options expiries (last Thursday)
    const fut = getFuturesExpiries(baseDate);
    return [
      formatDateToIndianFormat(fut.near, true),
      formatDateToIndianFormat(fut.next, true)
    ];
  }

  // It's an index - calculate next 7 weekly expirations on the target day of the week
  const expiries: string[] = [];
  const tempDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  // Find first occurrence of the target day of the week
  let daysToAdd = (targetDay - tempDate.getDay() + 7) % 7;
  
  // If today is the target day of the week, but we are after standard hours (15:30 IST/10:00 UTC/approx),
  // we could roll over. For a clean UX, if it is today, we include it, but if it has passed, we start next week.
  // Let's just find the next occurrences.
  tempDate.setDate(tempDate.getDate() + daysToAdd);

  for (let i = 0; i < 7; i++) {
    expiries.push(formatDateToIndianFormat(tempDate, true));
    tempDate.setDate(tempDate.getDate() + 7);
  }

  return expiries;
}
