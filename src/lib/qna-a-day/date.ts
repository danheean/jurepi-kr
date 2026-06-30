export type DateKey = string; // "YYYY-MM-DD"
export type QuestionKey = string; // "MM-DD"

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Convert a Date to "YYYY-MM-DD" using LOCAL date components (never UTC).
 */
export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Extract "MM-DD" from a Date or dateKey string.
 */
export function toQuestionKey(d: Date | DateKey): QuestionKey {
  if (typeof d === 'string') {
    return questionKeyFromDateKey(d);
  }
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Extract "MM-DD" from a "YYYY-MM-DD" string.
 */
export function questionKeyFromDateKey(k: DateKey): QuestionKey {
  return k.slice(5); // "MM-DD"
}

/**
 * Map "02-29" to "02-28"; all other keys are identity.
 * (The dataset has 365 days; leap-day reuses Feb 28 question.)
 */
export function resolveQuestionKey(mmdd: QuestionKey): QuestionKey {
  return mmdd === '02-29' ? '02-28' : mmdd;
}

/**
 * Parse "YYYY-MM-DD" to a Date at local midnight.
 */
export function parseDateKey(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Add/subtract days to a dateKey, DST-safe via setDate().
 */
export function addDays(k: DateKey, delta: number): DateKey {
  const d = parseDateKey(k);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

/**
 * Return the previous and next dateKeys.
 */
export function neighbors(k: DateKey): { prev: DateKey; next: DateKey } {
  return {
    prev: addDays(k, -1),
    next: addDays(k, 1),
  };
}

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Return the number of days in a month (1-12), respecting leap years.
 */
export function daysInMonth(y: number, m: number): number {
  if (m === 2) {
    return isLeapYear(y) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(m)) {
    return 30;
  }
  return 31;
}

/**
 * Get today's dateKey. Accepts an optional injected `now` for testing.
 */
export function today(now?: Date): DateKey {
  return toDateKey(now ?? new Date());
}
