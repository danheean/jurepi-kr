import { type Entry, type Store, STORE_VERSION } from './schema';

export type { Entry, Store };
export type DateKey = string; // "YYYY-MM-DD"
export type QuestionKey = string; // "MM-DD"

/**
 * Create a new Entry.
 */
export function newEntry(date: DateKey, text: string, questionKey: QuestionKey, now: number): Entry {
  return {
    date,
    questionKey,
    text,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new empty Store.
 */
export function newStore(now: number = Date.now()): Store {
  return {
    version: STORE_VERSION,
    entries: {},
    meta: {
      createdAt: now,
    },
  };
}

/**
 * Add or update an entry. Empty (whitespace-only) text triggers deletion.
 * Preserves createdAt, updates updatedAt. Returns a new Store (immutable).
 */
export function upsertEntry(
  store: Readonly<Store>,
  date: DateKey,
  text: string,
  questionKey: QuestionKey,
  now: number
): Store {
  const trimmed = text.trim();

  // Empty text → delete
  if (!trimmed) {
    return deleteEntry(store, date);
  }

  const existing = store.entries[date];
  const entry: Entry = {
    date,
    questionKey,
    text: trimmed,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return {
    ...store,
    entries: {
      ...store.entries,
      [date]: entry,
    },
  };
}

/**
 * Delete an entry. Returns a new Store (immutable).
 */
export function deleteEntry(store: Readonly<Store>, date: DateKey): Store {
  if (!(date in store.entries)) {
    return store;
  }

  const { [date]: _, ...remaining } = store.entries;
  return {
    ...store,
    entries: remaining,
  };
}

/**
 * Get an entry by date, or undefined.
 */
export function getEntry(store: Readonly<Store>, date: DateKey): Entry | undefined {
  return store.entries[date];
}

/**
 * Get all entries for a given MM-DD across years, sorted by year descending (newest first).
 */
export function entriesForMonthDay(
  store: Readonly<Store>,
  mmdd: QuestionKey,
  excludeYear?: number
): Entry[] {
  const result: Entry[] = [];

  for (const entry of Object.values(store.entries)) {
    const entryMMDD = entry.date.slice(5); // Extract MM-DD
    if (entryMMDD !== mmdd) continue;

    const entryYear = parseInt(entry.date.slice(0, 4), 10);
    if (excludeYear !== undefined && entryYear === excludeYear) continue;

    result.push(entry);
  }

  // Sort by year descending (newest first)
  result.sort((a, b) => {
    const yearA = parseInt(a.date.slice(0, 4), 10);
    const yearB = parseInt(b.date.slice(0, 4), 10);
    return yearB - yearA;
  });

  return result;
}

/**
 * Get all entries, sorted by date descending (newest first).
 */
export function listEntries(store: Readonly<Store>): Entry[] {
  const entries = Object.values(store.entries);
  entries.sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

/**
 * Search entries by query (case-insensitive) over answer text + question text.
 * Returns results sorted by date descending.
 */
export function searchEntries(
  store: Readonly<Store>,
  query: string,
  getQuestionText: (mmdd: QuestionKey, locale: 'ko' | 'en') => string,
  locale: 'ko' | 'en'
): Entry[] {
  const lowerQuery = query.toLowerCase();
  const result: Entry[] = [];

  for (const entry of Object.values(store.entries)) {
    const textLower = entry.text.toLowerCase();
    const questionText = getQuestionText(entry.questionKey, locale).toLowerCase();

    if (textLower.includes(lowerQuery) || questionText.includes(lowerQuery)) {
      result.push(entry);
    }
  }

  result.sort((a, b) => b.date.localeCompare(a.date));
  return result;
}
