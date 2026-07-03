import { DateKey } from './date';
import type { CalendarType } from './resolve';

/** A recent lookup: the birthdate as entered, with its calendar context. */
export interface RecentEntry {
  date: DateKey;
  calendarType: CalendarType;
  isLeapMonth: boolean;
}

const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;

/** Identity key for de-duplication (a solar and lunar 1990-01-01 are distinct). */
function keyOf(e: RecentEntry): string {
  return `${e.calendarType}:${e.date}:${e.isLeapMonth ? 'L' : ''}`;
}

/**
 * Add a recent entry to the front of the list.
 * De-duplicate by (calendarType, date, isLeapMonth), prepend, truncate to max.
 */
export function pushRecent(list: RecentEntry[], entry: RecentEntry, max: number = 10): RecentEntry[] {
  const k = keyOf(entry);
  const cleaned = list.filter((item) => keyOf(item) !== k);
  return [entry, ...cleaned].slice(0, max);
}

function isValidDate(date: string): boolean {
  if (typeof date !== 'string' || !dateKeyRegex.test(date)) return false;
  const [, m, d] = date.split('-').map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

/**
 * Prune/normalize unknown entries. Accepts the current object shape AND legacy
 * string DateKeys (migrated to solar entries), dropping anything malformed.
 * Fail-gracefully: non-array → [].
 */
export function pruneUnknown(list: unknown[]): RecentEntry[] {
  if (!Array.isArray(list)) return [];

  const out: RecentEntry[] = [];
  for (const item of list) {
    // Legacy: a bare DateKey string → solar entry.
    if (typeof item === 'string') {
      if (isValidDate(item)) out.push({ date: item, calendarType: 'solar', isLeapMonth: false });
      continue;
    }
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      const date = rec.date;
      const calendarType = rec.calendarType === 'lunar' ? 'lunar' : 'solar';
      const isLeapMonth = rec.isLeapMonth === true;
      if (typeof date === 'string' && isValidDate(date)) {
        out.push({ date, calendarType, isLeapMonth });
      }
    }
  }
  return out;
}

/** Serialize recents to JSON. */
export function serializeRecents(recents: RecentEntry[]): string {
  return JSON.stringify(recents);
}

/**
 * Deserialize recents from JSON.
 * Fail-gracefully: invalid JSON or entries → start fresh.
 */
export function deserializeRecents(json: string): RecentEntry[] {
  try {
    return pruneUnknown(JSON.parse(json));
  } catch {
    return [];
  }
}
