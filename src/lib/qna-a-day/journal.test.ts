import { describe, it, expect } from 'vitest';
import {
  newEntry,
  upsertEntry,
  deleteEntry,
  getEntry,
  entriesForMonthDay,
  listEntries,
  searchEntries,
  newStore,
  type DateKey,
  type QuestionKey,
  type Entry,
} from './journal';

const initStore = () => newStore();

describe('journal — immutable entry operations', () => {
  describe('newEntry', () => {
    it('creates a new Entry with createdAt === updatedAt', () => {
      const now = 1000;
      const entry = newEntry('2026-06-30', 'My answer', '06-30', now);
      expect(entry.date).toBe('2026-06-30');
      expect(entry.questionKey).toBe('06-30');
      expect(entry.text).toBe('My answer');
      expect(entry.createdAt).toBe(now);
      expect(entry.updatedAt).toBe(now);
    });
  });

  describe('upsertEntry', () => {
    it('adds a new entry to an empty store', () => {
      const store = initStore();
      const updated = upsertEntry(store, '2026-06-30', 'My answer', '06-30', 1000);
      expect(updated.entries['2026-06-30']).toBeDefined();
      expect(updated.entries['2026-06-30'].text).toBe('My answer');
    });

    it('preserves createdAt and updates updatedAt on re-upsert', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'Original', '06-30', 1000);
      const originalCreatedAt = store.entries['2026-06-30'].createdAt;

      store = upsertEntry(store, '2026-06-30', 'Updated', '06-30', 2000);
      expect(store.entries['2026-06-30'].createdAt).toBe(originalCreatedAt);
      expect(store.entries['2026-06-30'].updatedAt).toBe(2000);
      expect(store.entries['2026-06-30'].text).toBe('Updated');
    });

    it('trims whitespace from text', () => {
      const store = initStore();
      const updated = upsertEntry(store, '2026-06-30', '  hello  ', '06-30', 1000);
      expect(updated.entries['2026-06-30'].text).toBe('hello');
    });

    it('removes entry if text is empty after trimming', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'Original', '06-30', 1000);
      expect('2026-06-30' in store.entries).toBe(true);

      store = upsertEntry(store, '2026-06-30', '   ', '06-30', 2000);
      expect('2026-06-30' in store.entries).toBe(false);
    });

    it('removes entry if text is empty string', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'text', '06-30', 1000);
      store = upsertEntry(store, '2026-06-30', '', '06-30', 2000);
      expect('2026-06-30' in store.entries).toBe(false);
    });

    it('returns a new Store object (immutable)', () => {
      const store1 = initStore();
      const store2 = upsertEntry(store1, '2026-06-30', 'answer', '06-30', 1000);
      expect(store1).not.toBe(store2);
      expect(store1.entries).not.toBe(store2.entries);
      expect('2026-06-30' in store1.entries).toBe(false);
      expect('2026-06-30' in store2.entries).toBe(true);
    });
  });

  describe('deleteEntry', () => {
    it('removes an entry', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'text', '06-30', 1000);
      store = deleteEntry(store, '2026-06-30');
      expect('2026-06-30' in store.entries).toBe(false);
    });

    it('is a no-op if entry does not exist', () => {
      const store = initStore();
      const updated = deleteEntry(store, '2026-06-30');
      expect('2026-06-30' in updated.entries).toBe(false);
    });

    it('returns a new Store object (immutable)', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'text', '06-30', 1000);
      const store2 = deleteEntry(store, '2026-06-30');
      expect(store).not.toBe(store2);
      expect('2026-06-30' in store.entries).toBe(true);
      expect('2026-06-30' in store2.entries).toBe(false);
    });
  });

  describe('getEntry', () => {
    it('returns an entry if it exists', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'My answer', '06-30', 1000);
      const entry = getEntry(store, '2026-06-30');
      expect(entry).toBeDefined();
      expect(entry?.text).toBe('My answer');
    });

    it('returns undefined if entry does not exist', () => {
      const store = initStore();
      expect(getEntry(store, '2026-06-30')).toBeUndefined();
    });
  });

  describe('entriesForMonthDay', () => {
    it('returns entries for the same MM-DD across multiple years', () => {
      let store = initStore();
      store = upsertEntry(store, '2024-06-30', 'two years ago', '06-30', 1000);
      store = upsertEntry(store, '2025-06-30', 'one year ago', '06-30', 1500);
      store = upsertEntry(store, '2026-06-30', 'today', '06-30', 2000);

      const entries = entriesForMonthDay(store, '06-30');
      expect(entries).toHaveLength(3);
      expect(entries[0].date).toBe('2026-06-30'); // newest first
      expect(entries[1].date).toBe('2025-06-30');
      expect(entries[2].date).toBe('2024-06-30');
    });

    it('returns empty array if no entries for that MM-DD', () => {
      const store = initStore();
      expect(entriesForMonthDay(store, '06-30')).toHaveLength(0);
    });

    it('excludes a specific year if excludeYear is provided', () => {
      let store = initStore();
      store = upsertEntry(store, '2024-06-30', 'two years ago', '06-30', 1000);
      store = upsertEntry(store, '2025-06-30', 'one year ago', '06-30', 1500);
      store = upsertEntry(store, '2026-06-30', 'today', '06-30', 2000);

      const entries = entriesForMonthDay(store, '06-30', 2025);
      expect(entries).toHaveLength(2);
      expect(entries.every((e) => !e.date.startsWith('2025-'))).toBe(true);
    });

    it('sorts by year descending (newest first)', () => {
      let store = initStore();
      // Insert in random order
      store = upsertEntry(store, '2024-06-30', 'a', '06-30', 1000);
      store = upsertEntry(store, '2026-06-30', 'c', '06-30', 3000);
      store = upsertEntry(store, '2025-06-30', 'b', '06-30', 2000);

      const entries = entriesForMonthDay(store, '06-30');
      expect(entries.map((e) => e.text)).toEqual(['c', 'b', 'a']);
    });
  });

  describe('listEntries', () => {
    it('returns all entries sorted by date descending', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-28', 'a', '06-28', 1000);
      store = upsertEntry(store, '2026-06-30', 'c', '06-30', 3000);
      store = upsertEntry(store, '2026-06-29', 'b', '06-29', 2000);

      const entries = listEntries(store);
      expect(entries).toHaveLength(3);
      expect(entries[0].date).toBe('2026-06-30');
      expect(entries[1].date).toBe('2026-06-29');
      expect(entries[2].date).toBe('2026-06-28');
    });

    it('returns empty array for empty store', () => {
      const store = initStore();
      expect(listEntries(store)).toHaveLength(0);
    });
  });

  describe('searchEntries', () => {
    it('searches case-insensitively in entry text', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'My favorite place', '06-30', 1000);
      store = upsertEntry(store, '2026-06-29', 'I love Python', '06-29', 2000);
      store = upsertEntry(store, '2026-06-28', 'Something else', '06-28', 3000);

      const mockGetQuestionText = () => '';
      const results = searchEntries(store, 'LOVE', mockGetQuestionText, 'ko');
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('I love Python');
    });

    it('searches in question text via injected getQuestionText', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'My answer', '06-30', 1000);
      store = upsertEntry(store, '2026-06-29', 'Different answer', '06-29', 2000);

      const mockGetQuestionText = (mmdd: QuestionKey) =>
        mmdd === '06-30' ? '아이 러브 코딩' : '다른 질문';

      const results = searchEntries(store, '코딩', mockGetQuestionText, 'ko');
      expect(results).toHaveLength(1);
      expect(results[0].date).toBe('2026-06-30');
    });

    it('returns empty array if no matches', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-30', 'hello world', '06-30', 1000);

      const mockGetQuestionText = () => 'question text';
      const results = searchEntries(store, 'xyz', mockGetQuestionText, 'ko');
      expect(results).toHaveLength(0);
    });

    it('sorts results by date descending', () => {
      let store = initStore();
      store = upsertEntry(store, '2026-06-28', 'love it', '06-28', 1000);
      store = upsertEntry(store, '2026-06-30', 'I love this', '06-30', 3000);
      store = upsertEntry(store, '2026-06-29', 'love', '06-29', 2000);

      const mockGetQuestionText = () => '';
      const results = searchEntries(store, 'love', mockGetQuestionText, 'ko');
      expect(results).toHaveLength(3);
      expect(results[0].date).toBe('2026-06-30');
      expect(results[1].date).toBe('2026-06-29');
      expect(results[2].date).toBe('2026-06-28');
    });
  });

  describe('newStore', () => {
    it('creates an empty store with version and meta', () => {
      const store = newStore(5000);
      expect(store.version).toBe(1);
      expect(Object.keys(store.entries)).toHaveLength(0);
      expect(store.meta.createdAt).toBe(5000);
      expect(store.meta.lastBackupAt).toBeUndefined();
    });

    it('uses injected now time', () => {
      const store = newStore(1234567890);
      expect(store.meta.createdAt).toBe(1234567890);
    });
  });
});
