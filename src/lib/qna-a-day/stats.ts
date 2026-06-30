import { addDays, daysInMonth, isLeapYear, parseDateKey, toDateKey, type DateKey } from './date';

export type { DateKey };

/**
 * Current streak: consecutive days ending at `today` (or yesterday if today not answered, grace day).
 */
export function currentStreak(
  entries: Readonly<Record<DateKey, unknown>>,
  today: DateKey
): number {
  let cursor = today;

  // Check if today answered; if not, start from yesterday (grace day)
  if (!(today in entries)) {
    const yesterday = addDays(today, -1);
    if (!(yesterday in entries)) {
      return 0; // Neither today nor yesterday → broken
    }
    cursor = yesterday;
  }

  // Count consecutive days backward
  let count = 0;
  while (cursor in entries) {
    count++;
    cursor = addDays(cursor, -1);
  }

  return count;
}

/**
 * Longest consecutive streak anywhere in the entries.
 */
export function longestStreak(entries: Readonly<Record<DateKey, unknown>>): number {
  if (Object.keys(entries).length === 0) {
    return 0;
  }

  const sortedDates = Object.keys(entries).sort();
  let maxStreak = 0;
  let currentStreakCount = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = parseDateKey(sortedDates[i - 1]);
    const curr = parseDateKey(sortedDates[i]);

    // Check if curr is exactly 1 day after prev
    const nextDay = new Date(prev);
    nextDay.setDate(nextDay.getDate() + 1);

    if (toDateKey(nextDay) === sortedDates[i]) {
      // Consecutive
      currentStreakCount++;
    } else {
      // Gap
      maxStreak = Math.max(maxStreak, currentStreakCount);
      currentStreakCount = 1;
    }
  }

  maxStreak = Math.max(maxStreak, currentStreakCount);
  return maxStreak;
}

/**
 * Total number of answered entries.
 */
export function totalAnswered(entries: Readonly<Record<DateKey, unknown>>): number {
  return Object.keys(entries).length;
}

/**
 * Year completion: answered count + elapsed days for the year.
 * If year < currentYear, elapsed = full year (365 or 366).
 * If year === currentYear, elapsed = days from 01-01 to today (inclusive).
 */
export function yearCompletion(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number,
  today: DateKey
): { answered: number; elapsed: number } {
  const answered = Object.keys(entries).filter((k) => k.startsWith(`${year}-`)).length;

  // Determine elapsed days
  const todayYear = parseInt(today.slice(0, 4), 10);
  const todayDay = parseInt(today.slice(8, 10), 10);
  const todayMonth = parseInt(today.slice(5, 7), 10);
  let elapsed: number;

  if (year < todayYear) {
    // Past year: full year
    elapsed = isLeapYear(year) ? 366 : 365;
  } else if (year === todayYear) {
    // Current year: count days from 01-01 to today
    // Calculate day-of-year
    elapsed = 0;
    for (let m = 1; m < todayMonth; m++) {
      elapsed += daysInMonth(year, m);
    }
    elapsed += todayDay;
  } else {
    // Future year: 0
    elapsed = 0;
  }

  return { answered, elapsed };
}

/**
 * Month completion: answered count + elapsed days for the month.
 * If month < current month or year < current year, elapsed = full month.
 * If month === current month and year === current year, elapsed = days from 1 to today.
 */
export function monthCompletion(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number,
  month: number,
  today: DateKey
): { answered: number; elapsed: number } {
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
  const answered = Object.keys(entries).filter((k) => k.startsWith(monthPrefix)).length;

  // Determine elapsed days
  const todayYear = parseInt(today.slice(0, 4), 10);
  const todayMonth = parseInt(today.slice(5, 7), 10);
  let elapsed: number;

  if (year < todayYear || (year === todayYear && month < todayMonth)) {
    // Past month: full month
    elapsed = daysInMonth(year, month);
  } else if (year === todayYear && month === todayMonth) {
    // Current month: days from 1 to today
    const day = parseInt(today.slice(8, 10), 10);
    elapsed = day;
  } else {
    // Future month: 0
    elapsed = 0;
  }

  return { answered, elapsed };
}

/**
 * Heatmap: a record mapping all dates in the year to answered boolean.
 */
export function heatmap(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number
): Record<DateKey, boolean> {
  const result: Record<DateKey, boolean> = {};

  // Iterate through all days of the year
  let current = parseDateKey(`${year}-01-01`);
  const yearEnd = parseDateKey(`${year}-12-31`);

  while (current <= yearEnd) {
    const dateKey = toDateKey(current);
    result[dateKey] = dateKey in entries;
    current.setDate(current.getDate() + 1);
  }

  return result;
}
