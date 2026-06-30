# 11 · Domain Engineer Contract — Q&A a Day Pure Layer (FINAL)

**Date:** 2026-06-30  
**Module Path:** `src/lib/qna-a-day/*`  
**Test Coverage:** 123 tests, 94.31% statements (≥90% goal), 100% on core modules (date, journal, schema, serialization)  
**TypeCheck:** 0 errors

---

## Executive Summary

The **pure domain layer** for the Q&A a Day tool is **complete, tested, and contract-stable**. All 6 modules (`date`, `questions`, `schema`, `journal`, `stats`, `serialization`) are implemented via strict TDD with immutable operations, local-time correctness, and comprehensive validation.

**Key Property:** Type ownership is **centralized in `schema.ts`**, which defines `Store` and `Entry` types via Zod and exports them. All other modules re-export or reference these types to maintain single source of truth.

---

## Public API Contracts (EXACT SIGNATURES)

### Module 1: `src/lib/qna-a-day/date.ts`
**Purpose:** LOCAL-time date key generation, parsing, arithmetic (DST-safe).

```typescript
export type DateKey = string;      // "YYYY-MM-DD" (local time, never UTC)
export type QuestionKey = string;  // "MM-DD" (01-01..12-31, no 02-29)

export function toDateKey(d: Date): DateKey;
  // Example: new Date(2026, 5, 30) → "2026-06-30" (local components)
  
export function toQuestionKey(d: Date | DateKey): QuestionKey;
  // Date: new Date(2026, 5, 30) → "06-30"
  // DateKey: "2026-06-30" → "06-30"

export function questionKeyFromDateKey(k: DateKey): QuestionKey;
  // "2026-06-30" → "06-30" (simple slice)

export function resolveQuestionKey(mmdd: QuestionKey): QuestionKey;
  // "02-29" → "02-28" (leap day maps to Feb 28 question)
  // All others are identity

export function parseDateKey(k: DateKey): Date;
  // "2026-06-30" → Date at local midnight (not UTC)

export function addDays(k: DateKey, delta: number): DateKey;
  // "2026-06-30" + 1 → "2026-07-01" (DST-safe via setDate)
  // Handles month/year boundaries automatically

export function neighbors(k: DateKey): { prev: DateKey; next: DateKey };
  // "2026-06-30" → { prev: "2026-06-29", next: "2026-07-01" }

export function isLeapYear(y: number): boolean;
  // 2024 → true, 2026 → false, 2000 → true, 1900 → false

export function daysInMonth(y: number, m: number): number;
  // (2026, 2) → 28; (2024, 2) → 29; (2026, 4) → 30; etc.

export function today(now?: Date): DateKey;
  // No arg: toDateKey(new Date())
  // With arg: toDateKey(injected now) — for testing
```

**Invariants:**
- All date keys use local `getFullYear()`, `getMonth()`, `getDate()`, **never** `toISOString()`.
- `addDays` is DST-safe: operates on date components, not milliseconds.
- `resolveQuestionKey("02-29")` always returns `"02-28"`.
- `parseDateKey(toDateKey(d))` round-trips correctly.

---

### Module 2: `src/lib/qna-a-day/questions.ts`
**Purpose:** 365-day question bank loading, validation, locale-aware lookup.

```typescript
export interface QuestionRecord {
  date: string;      // "MM-DD" (key in the bank)
  month: number;     // 1–12
  day: number;       // 1–31 (valid for that month)
  question: string;  // Korean question (non-empty)
  questionEn: string; // English question (non-empty)
}

export type QuestionBank = Record<QuestionKey, QuestionRecord>;

export function getQuestion(
  bank: QuestionBank,
  mmdd: QuestionKey,
  locale: 'ko' | 'en'
): string;
  // Resolves "02-29" → "02-28" internally.
  // Returns record.question (ko) or record.questionEn (en).
  // Throws if key not found after resolution.

export function getQuestionForDate(
  bank: QuestionBank,
  dateKey: DateKey,
  locale: 'ko' | 'en'
): string;
  // Converts "2026-06-30" → "06-30", then calls getQuestion().

export function validateBank(bank: QuestionBank): {
  valid: boolean;
  errors: string[];
};
  // Checks:
  //   - Exactly 365 keys (no 02-29, covers 01-01..12-31)
  //   - Each key format "MM-DD"
  //   - No 02-29 in keys
  //   - Each record.question and record.questionEn non-empty
  //   - No duplicate record.date values
  //   - Valid month/day ranges per month
  //   - record.month and record.day match parsed key

export async function loadQuestionBank(): Promise<QuestionBank>;
  // Dynamically imports @/components/tools/qna-a-day/data/questions.json
  // Converts array to record (keyed by "MM-DD")
  // Validates via validateBank(); throws on failure
```

**Invariants:**
- **365-day coverage:** Exactly 01-01 through 12-31, no 02-29.
- **02-29 fallback:** Any lookup for Feb 29 automatically resolves to Feb 28 question.
- **Question stability:** Once a date→question mapping is published, it is immutable (same date = same question forever).
- **Locale selection:** `locale === 'ko'` → `record.question`; else → `record.questionEn`.

---

### Module 3: `src/lib/qna-a-day/schema.ts`
**Purpose:** Zod schemas, type exports, versioning, migration.

```typescript
export const STORE_VERSION: 1;

export const EntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  questionKey: z.string().regex(/^\d{2}-\d{2}$/),
  text: z.string().max(4000),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

export type Entry = z.infer<typeof EntrySchema>;

export const StoreSchema = z.object({
  version: z.number().int().min(1),
  entries: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), EntrySchema),
  meta: z.object({
    createdAt: z.number().int().nonnegative(),
    lastBackupAt: z.number().int().nonnegative().optional(),
    reminderDismissedAt: z.number().int().nonnegative().optional(),
  }),
});

export type Store = z.infer<typeof StoreSchema>;

export function migrate(raw: unknown): Store;
  // Currently identity (v1 → v1).
  // Future: handle version upgrades.
```

**Invariants:**
- **Single source of types:** `Store` and `Entry` are Zod-derived, re-exported by other modules.
- **Zod validation mandatory:** All read operations (deserialize, migrate) use `StoreSchema.parse()`.
- **Version tracking:** Supports future migrations; current version is 1.

---

### Module 4: `src/lib/qna-a-day/journal.ts`
**Purpose:** Immutable store operations, entry management, queries.

```typescript
export type { Entry, Store }; // From schema
export type DateKey = string; // "YYYY-MM-DD"
export type QuestionKey = string; // "MM-DD"

export function newEntry(
  date: DateKey,
  text: string,
  questionKey: QuestionKey,
  now: number
): Entry;
  // Creates Entry with createdAt === updatedAt === now

export function newStore(now: number = Date.now()): Store;
  // Empty store, version=1, meta.createdAt=now

export function upsertEntry(
  store: Readonly<Store>,
  date: DateKey,
  text: string,
  questionKey: QuestionKey,
  now: number
): Store;
  // Trims text. Empty/whitespace → deletes entry (calls deleteEntry internally).
  // New entry: createdAt=now, updatedAt=now.
  // Existing: createdAt preserved, updatedAt=now.
  // Returns NEW Store (immutable).

export function deleteEntry(store: Readonly<Store>, date: DateKey): Store;
  // Removes entry at date. No-op if absent. Returns new Store.

export function getEntry(store: Readonly<Store>, date: DateKey): Entry | undefined;
  // Direct lookup.

export function entriesForMonthDay(
  store: Readonly<Store>,
  mmdd: QuestionKey,
  excludeYear?: number
): Entry[];
  // Same MM-DD across all years, sorted by year desc (newest first).
  // If excludeYear provided, skip that year.

export function listEntries(store: Readonly<Store>): Entry[];
  // All entries, date desc (newest first).

export function searchEntries(
  store: Readonly<Store>,
  query: string,
  getQuestionText: (mmdd: QuestionKey, locale: 'ko' | 'en') => string,
  locale: 'ko' | 'en'
): Entry[];
  // Case-insensitive substring search over entry.text + question text.
  // Requires injected getQuestionText callback.
  // Returns date desc.
```

**Invariants:**
- **Immutability:** Every operation returns a new `Store`; original is never modified.
- **Empty removal:** Whitespace-only `text` → entry deleted, never stored.
- **Key consistency:** `questionKey === resolveQuestionKey(toQuestionKey(parseDateKey(date)))`.
- **Timestamps:** `createdAt ≤ updatedAt` always.
- **Primary key:** `date` is unique within a store (at most 1 entry per date).

---

### Module 5: `src/lib/qna-a-day/stats.ts`
**Purpose:** Streak, completion, heatmap statistics.

```typescript
export type { DateKey };

export function currentStreak(
  entries: Readonly<Record<DateKey, unknown>>,
  today: DateKey
): number;
  // Grace day: if today not answered but yesterday is, count through yesterday.
  // Returns consecutive days ending at today (or yesterday if needed).

export function longestStreak(entries: Readonly<Record<DateKey, unknown>>): number;
  // Longest consecutive answered stretch anywhere in entries.

export function totalAnswered(entries: Readonly<Record<DateKey, unknown>>): number;
  // Count of keys in entries.

export function yearCompletion(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number,
  today: DateKey
): { answered: number; elapsed: number };
  // Past years: elapsed = 365 or 366 (full year).
  // Current year: elapsed = days from Jan 1 to today (inclusive).
  // Future: elapsed = 0.

export function monthCompletion(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number,
  month: number,
  today: DateKey
): { answered: number; elapsed: number };
  // Past months: elapsed = days in month.
  // Current month: elapsed = days from 1 to today (inclusive).
  // Future: elapsed = 0.

export function heatmap(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number
): Record<DateKey, boolean>;
  // All 365/366 dates in year → true if answered, false if not.
```

**Invariants:**
- **Grace day:** `currentStreak` includes yesterday if today is missing but yesterday answered.
- **Completion math:** Year/month elapsed accounts for leap years and day-of-year calculations.
- **Heatmap coverage:** Includes all days of the year (365 for non-leap, 366 for leap).

---

### Module 6: `src/lib/qna-a-day/serialization.ts`
**Purpose:** JSON export/import, store merging, conflict resolution.

```typescript
export type { Store, Entry }; // Re-exported from schema

export interface ConflictSummary {
  totalImported: number;
  conflicts: number; // Same dateKey, different updatedAt
}

export function serialize(store: Readonly<Store>): string;
  // JSON.stringify(store).
  // Produces deterministic JSON.

export function deserialize(json: string): Store;
  // JSON.parse(json) + StoreSchema.parse() + migrate().
  // Throws Zod error if invalid.

export function mergeStores(local: Store, imported: Store): Store;
  // Combines entries from both stores.
  // Conflicts (same dateKey, different updatedAt): keep newer.
  // Returns new Store (immutable).

export function analyzeConflicts(local: Store, imported: Store): ConflictSummary;
  // Preview of merge before applying.
  // totalImported = count of entries in imported.
  // conflicts = count where same dateKey but different updatedAt.
```

**Invariants:**
- **Durability:** `deserialize(serialize(store))` is byte-faithful (all text, keys, timestamps preserved).
- **Conflict resolution:** Always picks entry with newer `updatedAt`.
- **Immutability:** `mergeStores` returns new Store; originals unchanged.
- **Validation boundary:** `deserialize` validates via Zod; rejects malformed JSON/schema with error (never silently corrupts).

---

## Type Ownership Decision

**Single Source of Truth: `schema.ts`**

- **Rule:** `schema.ts` defines `Entry` and `Store` types via Zod's `z.infer<typeof Schema>`.
- **Re-export:** `journal.ts`, `serialization.ts`, and `stats.ts` **re-export** these types so consumers see a single canonical definition.
- **Local Types:** `DateKey`, `QuestionKey`, `QuestionRecord` are defined in their natural modules (`date.ts`, `questions.ts`) and re-exported as needed.
- **No duplication:** No copy-paste type definitions; all types converge to `schema.ts`.

**Benefit:** Zod schemas and TypeScript types stay in sync automatically (Zod's `z.infer` ensures this).

---

## Testing Summary

### Coverage by Module
```
lib/qna-a-day     |   94.31 |    94.11 |   97.05 |   94.31 |
  date.ts         |     100 |      100 |     100 |     100 |
  journal.ts      |     100 |       96 |     100 |     100 |
  questions.ts    |    75.67|       88 |      75 |    75.67 | (loadQuestionBank async)
  schema.ts       |     100 |      100 |     100 |     100 |
  serialization.ts|     100 |    92.85 |     100 |     100 |
  stats.ts        |    96.11|    93.33 |     100 |    96.11 |
```

### Test Count
- **Total domain tests:** 123 (29 date + 24 journal + 14 questions + 24 stats + 17 schema + 15 serialization)
- **All passing:** ✓
- **Coverage goal:** ≥90% (achieved: 94.31% overall, 100% on 4/6 modules)

### Critical Test Scenarios (RED→GREEN→REFACTOR)
1. **Local-time correctness:** UTC offset mock ±12h, DST transitions, leap years, year boundaries ✓
2. **365 coverage + 02-29→02-28:** Validates full dataset coverage, leap-day fallback ✓
3. **Immutability:** New Store objects returned, originals unchanged ✓
4. **Empty removal:** Whitespace-only text deletes entry ✓
5. **Streak grace:** Today-not-done counted if yesterday answered ✓
6. **Round-trip durability:** serialize→deserialize byte-faithful, merge conflict resolution ✓
7. **Zod validation:** Rejects malformed JSON, invalid schema ✓

---

## Integration Notes for UI/Platform Engineers

### For `ui-engineer` (useDailyJournal hook implementation)

**Public API Surface:**
```typescript
import {
  type DateKey, type QuestionKey, type Entry, type Store,
  toDateKey, today, parseDateKey, addDays, neighbors,
  loadQuestionBank, getQuestion, getQuestionForDate,
  newStore, upsertEntry, deleteEntry, getEntry,
  entriesForMonthDay, listEntries, searchEntries,
  currentStreak, longestStreak, totalAnswered,
  yearCompletion, monthCompletion, heatmap,
  serialize, deserialize, mergeStores, analyzeConflicts
} from '@/lib/qna-a-day/*';
```

**localStorage Integration:**
- Key: `'jurepi-qna-a-day'`
- On read: `deserialize(JSON.parse(localStorage.getItem(...)))` + error handling
- On write: `localStorage.setItem(..., serialize(store))`
- Error fallback: quarantine corrupt blob, start fresh

**Autosave Pattern:**
```typescript
const [store, setStore] = useState<Store>(/* initial */);
const debounce = useCallback(
  debounce(() => localStorage.setItem('jurepi-qna-a-day', serialize(store)), 700),
  [store]
);
// On blur: flush debounce immediately
```

**Action Dispatcher Example:**
```typescript
const upsertEntry = (date: DateKey, text: string) => {
  const updated = journal.upsertEntry(store, date, text, toQuestionKey(date), Date.now());
  setStore(updated);
  debounce(); // Auto-save with debounce
};
```

---

### For `platform-engineer` (registry, i18n, route integration)

**No domain layer changes needed in platform.** All 6 modules are stable and complete.

**Platform tasks (outside domain scope):**
1. Add `'mindset'` category to `src/tools/types.ts` union.
2. Register qna-a-day tool in `src/tools/registry.ts`.
3. Add category label and UI messages in `src/i18n/messages/{ko,en}.json`.
4. Wire route metadata generation and JSON-LD in `src/app/[locale]/tools/[slug]/page.tsx`.
5. Verify question dataset copied to `src/components/tools/qna-a-day/data/questions.json` (365 entries, valid schema).

**Domain contracts:** Zero changes to domain layer. UI hook and components consume the pure layer as-is.

---

## Known Limitations & Future Phases

### Phase 1 (Complete)
- ✓ Pure domain: all 6 modules tested, immutable, local-time correct.
- ✓ 365 question coverage verified.
- ✓ Zod validation, durability, merge semantics.

### Phase 2 (Out of scope, noted for future)
- Optional client-side encryption (Web Crypto, PBKDF2 + AES-GCM).
- Web Notification daily reminder (service worker).
- Dedicated 366th question for Feb 29 (currently reuses Feb 28).
- PDF export / "year book" printable format.

---

## Sign-Off

**Domain layer is production-ready.**

- **Contracts:** Stable, backward-compatible (v1).
- **Tests:** 123 tests, 94.31% coverage (≥90% goal).
- **Types:** TypeScript strict, 0 errors.
- **Quality:** Pure functions, immutable, deterministic, zero side effects.

**Next steps:**
1. UI engineer implements `useDailyJournal` hook.
2. UI engineer builds React components (Today, Calendar, Journal, Settings, etc.).
3. Platform engineer wires registry, i18n, route.
4. QA verifies end-to-end flows, accessibility, performance.

---

**Contract approved by domain-engineer.**
