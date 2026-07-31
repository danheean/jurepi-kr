import { MONTH_SLUGS, type MonthSlug } from './schema';

export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Pad a number to 2 digits with leading zero
 */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Create MM-DD key from month (1-12) and day (1-31)
 */
export function monthDayKey(month: number, day: number): string {
  return `${pad2(month)}-${pad2(day)}`;
}

/**
 * Check if month (1-12) and day (1-31) are valid
 * Feb-29 is considered valid (allows leap day lookups)
 */
export function isValidMonthDay(month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > DAYS_IN_MONTH[month - 1]) return false;
  return true;
}

/**
 * Parse MM-DD key and return { month, day } or null if invalid
 */
export function parseMonthDay(key: string): { month: number; day: number } | null {
  const match = key.match(/^(\d{2})-(\d{2})$/);
  if (!match) return null;

  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);

  if (!isValidMonthDay(month, day)) return null;

  return { month, day };
}

/**
 * Convert Date to MM-DD key (local timezone, never UTC)
 */
export function todayKey(now: Date): string {
  const month = now.getMonth() + 1; // getMonth() is 0-indexed
  const day = now.getDate();
  return monthDayKey(month, day);
}

/**
 * Extract month (1-12) from MM-DD key, or null if invalid format
 */
export function monthOfKey(key: string): number | null {
  const parsed = parseMonthDay(key);
  return parsed ? parsed.month : null;
}

/**
 * Convert month number (1-12) to month slug
 */
export function monthSlug(month: number): MonthSlug {
  return MONTH_SLUGS[month - 1];
}

/**
 * Convert month slug to month number (1-12)
 */
export function monthNumber(slug: MonthSlug): number {
  return MONTH_SLUGS.indexOf(slug) + 1;
}
