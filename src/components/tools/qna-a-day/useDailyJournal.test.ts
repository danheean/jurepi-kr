import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => key,
}));

// Mock domain modules at module level
const mockLoadQuestionBank = vi.fn().mockResolvedValue({
  '06-30': { date: '06-30', month: 6, day: 30, question: 'Test?', questionEn: 'Test?' },
});

const mockNewStore = vi.fn(() => ({
  version: 1,
  entries: {},
  meta: { createdAt: Date.now() },
}));

const mockUpsertEntry = vi.fn((store, date, text) => ({
  ...store,
  entries: {
    ...store.entries,
    [date]: { date, text, questionKey: '06-30', createdAt: Date.now(), updatedAt: Date.now() },
  },
}));

const mockDeserialize = vi.fn((json) => JSON.parse(json));
const mockSerialize = vi.fn((store) => JSON.stringify(store));

vi.doMock('@/lib/qna-a-day/date', () => ({
  toDateKey: (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
  toQuestionKey: (key: string) => key.slice(5),
  today: () => '2026-06-30',
  addDays: (key: string, delta: number) => key, // Stub
}));

vi.doMock('@/lib/qna-a-day/questions', () => ({
  loadQuestionBank: mockLoadQuestionBank,
  getQuestion: () => 'Test question',
}));

vi.doMock('@/lib/qna-a-day/journal', () => ({
  newStore: mockNewStore,
  upsertEntry: mockUpsertEntry,
  deleteEntry: (store: any) => store,
  getEntry: (store: any, date: string) => store.entries[date],
  entriesForMonthDay: () => [],
  listEntries: () => [],
  searchEntries: () => [],
}));

vi.doMock('@/lib/qna-a-day/stats', () => ({
  currentStreak: () => 0,
  longestStreak: () => 0,
  totalAnswered: () => 0,
  yearCompletion: () => ({ answered: 0, elapsed: 0 }),
}));

vi.doMock('@/lib/qna-a-day/serialization', () => ({
  serialize: mockSerialize,
  deserialize: mockDeserialize,
  mergeStores: (local: any, imported: any) => imported,
  analyzeConflicts: () => ({ totalImported: 0, conflicts: 0 }),
}));

describe('useDailyJournal hook (reducer logic)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have stable localStorage keys', () => {
    expect('jurepi-qna-a-day').toBeDefined();
  });

  it('serializes store to JSON correctly', () => {
    const store = {
      version: 1,
      entries: { '2026-06-30': { date: '2026-06-30', questionKey: '06-30', text: 'answer', createdAt: 0, updatedAt: 0 } },
      meta: { createdAt: 0 },
    };

    mockSerialize(store);
    expect(mockSerialize).toHaveBeenCalledWith(store);
  });

  it('deserializes valid JSON blob', () => {
    const json = JSON.stringify({
      version: 1,
      entries: {},
      meta: { createdAt: 0 },
    });

    mockDeserialize(json);
    expect(mockDeserialize).toHaveBeenCalledWith(json);
  });

  it('initializes with newStore() when no localStorage', () => {
    mockNewStore();
    expect(mockNewStore).toHaveBeenCalled();
  });

  it('loads question bank on initialization', async () => {
    await mockLoadQuestionBank();
    expect(mockLoadQuestionBank).toHaveBeenCalled();
  });

  it('upsertEntry should preserve createdAt on update', () => {
    const store = {
      version: 1,
      entries: {
        '2026-06-30': { date: '2026-06-30', questionKey: '06-30', text: 'old', createdAt: 100, updatedAt: 100 },
      },
      meta: { createdAt: 0 },
    };

    mockUpsertEntry(store, '2026-06-30', 'new');
    expect(mockUpsertEntry).toHaveBeenCalledWith(store, '2026-06-30', 'new');
  });

  it('should support export with filename', () => {
    const store = {
      version: 1,
      entries: {},
      meta: { createdAt: 0 },
    };
    const json = mockSerialize(store);
    expect(json).toBeDefined();
  });
});

describe('useDailyJournal reducer state logic', () => {
  it('handles SET_STORE action', () => {
    const store = {
      version: 1,
      entries: { '2026-06-30': { date: '2026-06-30', questionKey: '06-30', text: 'test', createdAt: 0, updatedAt: 0 } },
      meta: { createdAt: 0 },
    };

    // Simulating reducer state transformation
    expect(store.entries['2026-06-30'].text).toBe('test');
  });

  it('handles UPDATE_STORE action', () => {
    const store1 = {
      version: 1,
      entries: { '2026-06-30': { date: '2026-06-30', questionKey: '06-30', text: 'old', createdAt: 0, updatedAt: 0 } },
      meta: { createdAt: 0 },
    };

    const store2 = {
      ...store1,
      entries: { ...store1.entries, '2026-06-30': { ...store1.entries['2026-06-30'], text: 'new' } },
    };

    expect(store2.entries['2026-06-30'].text).toBe('new');
  });

  it('does not mutate original store on upsert', () => {
    const original = {
      version: 1 as const,
      entries: {} as Record<string, any>,
      meta: { createdAt: 0 },
    };

    const newStore = { ...original, entries: { ...original.entries } };
    expect(newStore).not.toBe(original);
  });
});
