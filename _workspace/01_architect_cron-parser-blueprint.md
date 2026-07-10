# Cron Parser — Clean Architecture Blueprint

**Deliverable Date:** 2026-07-10  
**Status:** Ready for parallel engineering  
**Coordinates:** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-cron-parser`

---

## 1. Layer Decomposition

### Dependency Graph (Strict Clean Architecture)
```
┌──────────────────────────────────────┐
│        Framework (Next.js)           │ ← IMPORTS ONLY: React, next, @/, lib/seo
│  src/app/[locale]/tools/[slug]/page  │
└──────────────────────────────────────┘
              ↑
┌──────────────────────────────────────┐
│        Adapter (UI Components)       │ ← IMPORTS ONLY: React, @/, domain types
│  src/components/tools/cron-parser/*  │
│  (CronParser, ExpressionInput, etc)  │
└──────────────────────────────────────┘
              ↑
┌──────────────────────────────────────┐
│      Usecase (Custom Hook)           │ ← IMPORTS ONLY: React, domain, zod
│  src/components/tools/cron-parser/   │
│  useCronParser.ts                    │
└──────────────────────────────────────┘
              ↑
┌──────────────────────────────────────┐
│    Domain (Pure Business Logic)      │ ← ZERO React/Next/DOM imports
│  src/lib/cron-parser/*               │
│  (parser, validator, description,    │
│   next-runs, timezone, etc)          │
└──────────────────────────────────────┘
```

**Rule:** Arrows point inward only. Domain NEVER imports from React, Next, or any outer layer.

---

## 2. Module Ownership & Responsibilities

### Domain Layer: `src/lib/cron-parser/`

| Module | Responsibility | Exports |
|--------|-----------------|---------|
| `schema.ts` | Zod validation schemas for cron expression, parsed fields, description model, settings | `z.object(...)`, types inferred via `z.infer` |
| `constants.ts` | Field ranges, field names, DEBOUNCE_MS, NEXT_RUNS_LIMIT, MAX_LOOKAHEAD_YEARS, FIELD_RANGES | `const FIELD_RANGES`, `const DEBOUNCE_MS` |
| `tokenizer.ts` | Lexical analysis: split 5-field string into tokens, handle whitespace + error reporting | `tokenizeCron(expr: string): Token[] \| SyntaxError` |
| `parser.ts` | Field-by-field parsing: literals, ranges, steps, names, wildcards, macros; validate bounds | `parseCron(expr: string): ParsedFields \| ParseError` |
| `validator.ts` | Post-parse validation: dom/dow mutual-exclusion check, semantic errors | `validateFields(fields: ParsedFields): { isValid, errors }` |
| `description.ts` | Transform ParsedFields → DescriptionModel (structured, not English) | `toDescriptionModel(fields: ParsedFields): DescriptionModel` |
| `next-runs.ts` | Iterative next-run computation with DST awareness, 4-year lookahead cap | `computeNextRuns(fields: ParsedFields, options): NextRun[]` |
| `macros.ts` | Expand @yearly, @monthly, @weekly, @daily, @hourly to ParsedFields | `expandMacro(macro: string): ParsedFields \| UnknownMacroError` |
| `presets.ts` | Curated preset expressions constant array (typed) | `export const PRESET_EXPRESSIONS: Preset[]` |
| `timezone-list.ts` | IANA timezone names constant array | `export const TIMEZONE_NAMES: string[]` |

**Invariants:**
- ALL functions are pure (deterministic, no side effects, no random).
- Types use `readonly` for immutability where applicable.
- Error handling returns `{ error: ... }` objects (never throws, exceptions only for programmer bugs).

---

### Adapter Layer: `src/components/tools/cron-parser/`

| Component | Responsibility | Props |
|-----------|-----------------|-------|
| `CronParser.tsx` | Root orchestrator (Client Component); state owner; coordinates all sub-components | (none) |
| `useCronParser.ts` | Custom hook: expression/timezone/recents state, localStorage persist, debounce parse | Returns `{ expression, timezone, recents, ... }` |
| `ExpressionInput.tsx` | Text input for cron expression; onChange → debounce → trigger parse | `{value, onChange, onParse, error}` |
| `TimezoneSelector.tsx` | Dropdown: "Local" + IANA zones; onChange → recompute next-runs | `{timezone, onChange}` |
| `ParseResultDisplay.tsx` | Conditional render: FieldBreakdownTable + DescriptionText + NextRunsList OR ErrorMessage | `{fields, description, nextRuns, error, timezone}` |
| `FieldBreakdownTable.tsx` | Table/grid: minute, hour, dom, month, dow columns, parsed values | `{fields}` |
| `DescriptionText.tsx` | Human-readable description (from DescriptionModel, rendered with i18n) | `{model, locale}` |
| `NextRunsList.tsx` | Table/list: 10 upcoming run times, timezone-localized, formatted | `{runs, timezone, locale}` |
| `ErrorMessage.tsx` | Friendly error callout (role=alert) | `{error}` |
| `PresetExpressions.tsx` | Dropdown/button grid: load preset into expression field | `{onSelect}` |
| `RecentsList.tsx` | Collapsible: recent expressions, load/delete buttons | `{recents, onLoad, onDelete}` |
| `CronCheatsheet.tsx` | Collapsible accordion: syntax legend, field meanings, common patterns, gotchas | (none) |
| `CopyButton.tsx` | Copy expression to clipboard + toast feedback | `{expression}` |

**Rules:**
- All components are React Client Components (use `'use client'` directive).
- No direct domain imports in JSX; pass computed values via props.
- i18n via `useTranslations('tools.cron-parser')` (client hook, NOT async getTranslations).

---

### Usecase Layer: `src/components/tools/cron-parser/useCronParser.ts`

```typescript
export function useCronParser(): {
  expression: string;
  setExpression: (expr: string) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  recents: string[];
  addRecent: (expr: string) => void;
  removeRecent: (expr: string) => void;
  
  parsedFields: ParsedFields | null;
  parseError: ParseError | null;
  description: DescriptionModel | null;
  nextRuns: NextRun[] | null;
};
```

**Implementation Details:**
- Debounce expression change 200ms before parsing.
- Parse is: tokenize → parse → validate → (if valid) describe + compute next-runs.
- localStorage key: `jurepi-cron-parser-state`.
- On load: hydration-safe (no immediate render with localStorage data, set in useEffect).
- Timezone change triggers nextRuns recomputation only, not re-parse.

---

### Framework Layer: Route Wiring (See Section 6)

---

## 3. Domain Public API Contracts

### `schema.ts`

```typescript
import { z } from 'zod';

// Parsed field representation
export const ParsedFieldsSchema = z.object({
  minute: z.array(z.number().min(0).max(59)),
  hour: z.array(z.number().min(0).max(23)),
  dom: z.array(z.number().min(1).max(31)),
  month: z.array(z.number().min(1).max(12)),
  dow: z.array(z.number().min(0).max(6)),
  isValid: z.boolean(),
  error: z.object({
    field: z.string(),
    message: z.string(),
  }).optional(),
});

export type ParsedFields = z.infer<typeof ParsedFieldsSchema>;

// Description model (structured, NOT English prose)
export type DescriptionModel = {
  frequencyKind: 'everyMinute' | 'everyNMinutes' | 'everyHour' | 'everyDay' 
                | 'everyWeekday' | 'everyWeekend' | 'monthly' | 'yearly' | 'custom';
  atTimes?: Array<{ hour: number; minute: number }>;
  onDays?: string[]; // e.g., ['MON', 'TUE']
  onMonths?: string[]; // e.g., ['JAN', 'FEB']
  onDatesOfMonth?: number[];
  explanation?: string; // Fallback only; should NOT ship
};

// Settings (localStorage)
export const SettingsSchema = z.object({
  timezone: z.string().default('Local'),
  lastExpression: z.string().optional(),
  recents: z.array(z.string()).max(20).default([]),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Parse/validation errors
export interface SyntaxError {
  type: 'syntax';
  message: string;
  position?: number;
}

export interface ParseError {
  type: 'parse';
  field: string;
  message: string;
  value?: string;
}

export interface DescriptionError {
  type: 'description';
  message: string;
}
```

---

### `constants.ts`

```typescript
export const DEBOUNCE_MS = 200;
export const NEXT_RUNS_LIMIT = 10;
export const MAX_LOOKAHEAD_YEARS = 4;

export const FIELD_RANGES = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dom: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dow: { min: 0, max: 6 },
} as const;

export const FIELD_NAMES = ['minute', 'hour', 'dom', 'month', 'dow'] as const;

export const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

export const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export const MONTH_MAP: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

export const DAY_MAP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};
```

---

### `tokenizer.ts`

```typescript
export interface Token {
  type: 'literal' | 'range' | 'step' | 'list' | 'wildcard' | 'name';
  value: string;
  position: number;
}

export interface TokenizeResult {
  success: boolean;
  tokens?: Token[][];  // 5 arrays (one per field)
  error?: SyntaxError;
}

export function tokenizeCron(expr: string): TokenizeResult;
```

**Contract:** Splits cron expression into 5 fields; tokenizes each field; reports position + message on error.

---

### `parser.ts`

```typescript
export function parseCron(expr: string): ParsedFields;
  // Returns ParsedFields with isValid=false + error if parsing fails
  // Otherwise returns fields with isValid=true, error=undefined
```

**Contract:**
- Handles 5-field POSIX cron only. Returns ParseError if wrong number of fields.
- Parses literals, ranges (1-5), steps (*/15, 1-30/5), lists (1,3,5), wildcards (*), names (JAN-DEC, SUN-SAT).
- Maps day-of-week 7 to 0 (Sunday).
- Expands wildcards to full ranges.
- Returns ParseError if any field is out of range.

---

### `validator.ts`

```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export function validateFields(fields: ParsedFields): ValidationResult;
```

**Contract:**
- Checks dom/dow mutual-exclusion semantics (if both non-*, document the OR logic in FAQPage).
- Returns empty errors if all valid.
- MUST handle edge cases: leap years (Feb 29), month boundaries (Apr 31), etc.

---

### `description.ts`

```typescript
export function toDescriptionModel(fields: ParsedFields): DescriptionModel;
```

**Contract:**
- Takes ParsedFields, returns DescriptionModel (NOT English sentence).
- Determines frequencyKind (everyDay, everyWeekday, monthly, yearly, custom, etc.).
- Populates atTimes, onDays, onMonths, onDatesOfMonth as appropriate.
- Example: `{ minute: [0], hour: [9], dom: [1-31], month: [1-12], dow: [1,2,3,4,5] }` → 
  `{ frequencyKind: 'everyWeekday', atTimes: [{ hour: 9, minute: 0 }] }`

---

### `next-runs.ts`

```typescript
export interface NextRunOptions {
  now: Date;
  timezone: string; // IANA name or 'Local'
  limit: number; // Default: NEXT_RUNS_LIMIT
  maxYears: number; // Default: MAX_LOOKAHEAD_YEARS
}

export interface NextRun {
  datetime: Date;
  formatted: string; // e.g., "Monday, July 15, 2026 at 9:00 AM EDT"
  utc: string; // ISO 8601, optional
}

export function computeNextRuns(
  fields: ParsedFields, 
  options: NextRunOptions
): NextRun[];
```

**Contract:**
- Iterates forward from `now` to find up to `limit` (default 10) upcoming occurrences.
- Tests each candidate datetime against the cron expression.
- Accounts for DST transitions via Intl.DateTimeFormat.
- Returns array sorted by datetime ascending.
- Returns empty array if no matches found within `maxYears` (4 years).
- Formatted string must include timezone abbreviation (EDT, JST, etc.) and be locale-aware.

---

### `macros.ts`

```typescript
export function expandMacro(macro: string): ParsedFields | ParseError;
  // @yearly → 0 0 1 1 *
  // @monthly → 0 0 1 * *
  // @weekly → 0 0 * * 0
  // @daily → 0 0 * * *
  // @hourly → 0 * * * *
```

---

### `presets.ts`

```typescript
export interface Preset {
  id: string;
  expression: string;
  descriptionKey: string; // i18n key, e.g., 'presets.every5Minutes'
}

export const PRESET_EXPRESSIONS: Readonly<Preset[]> = [
  { id: 'every-5-minutes', expression: '*/5 * * * *', descriptionKey: 'presets.every5Minutes' },
  { id: 'every-hour', expression: '0 * * * *', descriptionKey: 'presets.everyHour' },
  { id: 'weekdays-9am', expression: '0 9 * * MON-FRI', descriptionKey: 'presets.weekdays9am' },
  { id: 'monthly-1st', expression: '0 0 1 * *', descriptionKey: 'presets.monthly1st' },
  // ... (10–15 presets total)
];
```

---

### `timezone-list.ts`

```typescript
export const TIMEZONE_NAMES: Readonly<string[]> = [
  'Local',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Tokyo',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Bangkok',
  'Australia/Sydney',
  'Australia/Melbourne',
  // ... (30–40 major IANA zones)
];
```

---

## 4. i18n Key Contract

**CRITICAL: Separate columns (key, ko, en) — NO pipes in ko.json**

### Top-Level Keys (Required for Dashboard/Search/Footer)

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.title` | 크론 표현식 해석기 | Cron Expression Parser |
| `tools.cron-parser.description` | Unix 크론 표현식을 인간이 이해할 수 있는 설명으로 변환하고 다음 실행 시간을 계산합니다. | Convert Unix cron expressions to human-readable descriptions and compute upcoming run times. |
| `tools.cron-parser.meta.title` | 크론 표현식 해석기 | Cron Expression Parser |
| `tools.cron-parser.meta.description` | 크론 표현식을 해석하고 다음 실행 시간을 계산하는 온라인 도구 | Online tool to decode cron expressions and calculate next run times. |

### UI Chrome Keys

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.expressionLabel` | 크론 표현식 | Cron Expression |
| `tools.cron-parser.timezoneLabel` | 시간대 | Timezone |
| `tools.cron-parser.parseLabel` | 해석 | Parse |
| `tools.cron-parser.presetLabel` | 템플릿 선택 | Load Preset |
| `tools.cron-parser.copyLabel` | 복사 | Copy |
| `tools.cron-parser.copiedToast` | 복사됨! | Copied! |
| `tools.cron-parser.recentLabel` | 최근 사용 | Recent |
| `tools.cron-parser.cheatsheetLabel` | 문법 참고 | Cheatsheet |
| `tools.cron-parser.clearRecentsLabel` | 최근 항목 지우기 | Clear Recents |

### Field Names (Used in FieldBreakdownTable)

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.fields.minute` | 분 (0–59) | Minute (0–59) |
| `tools.cron-parser.fields.hour` | 시간 (0–23) | Hour (0–23) |
| `tools.cron-parser.fields.dom` | 일자 (1–31) | Day of Month (1–31) |
| `tools.cron-parser.fields.month` | 월 (1–12) | Month (1–12) |
| `tools.cron-parser.fields.dow` | 요일 (0–6) | Day of Week (0–6) |

### Error Messages

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.errors.invalidField` | 필드 오류: {{field}} — {{message}} | Field error: {{field}} — {{message}} |
| `tools.cron-parser.errors.unsupportedSyntax` | Quartz 문법은 지원되지 않습니다. 표준 POSIX 크론을 사용하세요. | Quartz syntax not supported. Use standard POSIX cron. |
| `tools.cron-parser.errors.malformedRange` | 범위 형식이 잘못되었습니다. 'start-end' 또는 'start-end/step' 형식을 사용하세요. | Invalid range syntax. Use 'start-end' or 'start-end/step'. |
| `tools.cron-parser.errors.wrongFieldCount` | 크론 표현식은 5개 필드를 포함해야 합니다. | Cron expression must have 5 fields. |
| `tools.cron-parser.errors.noUpcomingRuns` | 4년 이내에 예정된 실행 시간이 없습니다. | No upcoming run times found within 4 years. |
| `tools.cron-parser.errors.unknownMacro` | 알 수 없는 매크로입니다. 유효한 매크로: @yearly, @monthly, @weekly, @daily, @hourly | Unknown macro. Valid macros: @yearly, @monthly, @weekly, @daily, @hourly |

### Description Parts (for DescriptionModel rendering)

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.descriptions.everyMinute` | 매분 | Every minute |
| `tools.cron-parser.descriptions.everyNMinutes` | {{n}}분마다 | Every {{n}} minutes |
| `tools.cron-parser.descriptions.everyHour` | 매시간 | Every hour |
| `tools.cron-parser.descriptions.everyDay` | 매일 | Every day |
| `tools.cron-parser.descriptions.everyWeekday` | 평일(월-금) | Every weekday (Monday–Friday) |
| `tools.cron-parser.descriptions.everyWeekend` | 주말(토-일) | Every weekend (Saturday–Sunday) |
| `tools.cron-parser.descriptions.monthly` | 매월 {{day}}일 | Monthly on the {{day}}{{suffix}} |
| `tools.cron-parser.descriptions.yearly` | 매년 {{month}} {{day}}일 | Yearly on {{month}} {{day}}{{suffix}} |
| `tools.cron-parser.descriptions.atTime` | {{hour}}:{{minute}} | at {{hour}}:{{minute}} |
| `tools.cron-parser.descriptions.onDays` | {{days}} | on {{days}} |
| `tools.cron-parser.descriptions.onMonths` | {{months}} | in {{months}} |

### Presets Display Names

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.presets.every5Minutes` | 5분마다 | Every 5 minutes |
| `tools.cron-parser.presets.everyHour` | 매시간 | Every hour |
| `tools.cron-parser.presets.weekdays9am` | 평일 오전 9시 | Weekdays at 9:00 AM |
| `tools.cron-parser.presets.monthly1st` | 매월 1일 자정 | First of month at midnight |
| `tools.cron-parser.presets.daily` | 매일 자정 | Daily at midnight |

### HowTo Sections (SEO, rendered server-side)

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.intro.eyebrow` | 크론 표현식 해석 | Decode Cron Schedules |
| `tools.cron-parser.intro.title` | 크론 표현식 해석기 | Cron Expression Parser |
| `tools.cron-parser.intro.lead` | Unix/Linux 크론 표현식을 인간이 이해할 수 있는 설명으로 변환하고 다음 실행 시간을 계산하는 온라인 도구입니다. | Convert cryptic Unix cron expressions to clear, human-readable descriptions and compute upcoming run times in your timezone. |
| `tools.cron-parser.howTo.title` | 크론 표현식 이해하기 | Understanding Cron Expressions |
| `tools.cron-parser.howTo.items.0` | **필드 이해하기**: 크론 표현식은 5개 필드로 구성됩니다: 분(0–59) 시간(0–23) 일자(1–31) 월(1–12) 요일(0–6). 각 필드는 일정을 언제 실행할지 정의합니다. | **Understanding Fields**: A cron expression has 5 fields: minute (0–59), hour (0–23), day-of-month (1–31), month (1–12), day-of-week (0–6). Each field defines when the job runs. |
| `tools.cron-parser.howTo.items.1` | **와일드카드와 범위**: * (와일드카드)는 "모든 값"을 의미합니다. 범위(1-5)는 1,2,3,4,5를 의미합니다. 단계(*/15)는 0,15,30,45(분의 경우)를 의미합니다. | **Wildcards & Ranges**: The * (wildcard) means "any value". Ranges (1-5) mean 1,2,3,4,5. Steps (*/15) mean every 15th value (e.g., 0,15,30,45 for minutes). |
| `tools.cron-parser.howTo.items.2` | **일반적인 패턴**: 평일 오전 9시 = `0 9 * * MON-FRI`. 매월 1일 자정 = `0 0 1 * *`. 매시간 = `0 * * * *`. | **Common Patterns**: Weekdays at 9 AM = `0 9 * * MON-FRI`. First of month = `0 0 1 * *`. Hourly = `0 * * * *`. |
| `tools.cron-parser.howTo.items.3` | **타임존 고려**: 이 도구는 당신이 선택한 타임존에서 다음 실행 시간을 계산합니다. 일광절약시간(DST) 전환은 자동으로 처리됩니다. | **Timezone Awareness**: This tool calculates upcoming run times in your selected timezone. Daylight saving time (DST) transitions are handled automatically. |

### FAQ Items

| Key | ko | en |
|-----|----|----|
| `tools.cron-parser.faq.items.0.q` | 도메인(일자)과 요일 필드가 모두 지정되면 어떻게 되나요? | What happens when both day-of-month and day-of-week are specified? |
| `tools.cron-parser.faq.items.0.a` | 표준 크론 의미에 따르면 둘 다 지정되면 OR 로직을 따릅니다. 즉, 지정된 일자 OR 지정된 요일에 작업이 실행됩니다. 예: `0 9 15 * MON`은 매월 15일 오전 9시 또는 모든 월요일 오전 9시에 실행됩니다. | According to standard cron semantics, if both are specified, OR logic applies: the job runs on the specified day-of-month OR the specified day-of-week. E.g., `0 9 15 * MON` runs on the 15th of any month OR any Monday at 9 AM. |
| `tools.cron-parser.faq.items.1.q` | 왜 요일 필드가 0–6(0=일요일)인가요? | Why is day-of-week 0–6, with 0 = Sunday? |
| `tools.cron-parser.faq.items.1.a` | 이는 표준 POSIX 크론 관례입니다. 0 = 일요일, 1 = 월요일, ..., 6 = 토요일입니다. 일부 시스템은 7을 일요일로 허용하는데, 이 도구는 7을 0으로 변환합니다. | This is the standard POSIX cron convention: 0 = Sunday, 1 = Monday, …, 6 = Saturday. Some systems allow 7 for Sunday; this tool converts 7 to 0. |
| `tools.cron-parser.faq.items.2.q` | 2월 29일 또는 4월 31일 같은 불가능한 날짜는 어떻게 되나요? | What happens with impossible dates like February 29 or April 31? |
| `tools.cron-parser.faq.items.2.a` | 2월 29일은 윤년에만 존재하므로 윤년에만 해당 일자에 작업이 실행됩니다. 4월 31일은 존재하지 않으므로 그 일자의 작업은 건너뜁니다. | February 29 exists only in leap years, so a job on Feb 29 runs only in leap years. April 31 doesn't exist, so a job on that date is skipped. |
| `tools.cron-parser.faq.items.3.q` | 일광절약시간(DST) 전환 중에 어떤 일이 발생하나요? | What happens during daylight saving time (DST) transitions? |
| `tools.cron-parser.faq.items.3.a` | 봄으로 넘어갈 때(시간이 앞당겨질 때) 건너뛴 시간대가 있으면 그 시간에 예약된 작업은 건너뜁니다. 가을로 넘어갈 때(시간이 반복될 때) 반복되는 시간대의 작업은 두 번 실행될 수 있습니다. 이 도구는 브라우저의 타임존 데이터베이스를 사용해 DST를 자동으로 처리합니다. | During spring DST transition, skipped times are skipped. During fall transition, times that occur twice may run twice. This tool uses your browser's timezone database to handle DST automatically. |

---

## 5. SEO/GEO & StructuredData Contract

**Critical invariant:** The route `page.tsx` is the **SINGLE OWNER** of all SEO sections. Components are **STATELESS SERVER COMPONENTS** that render without props.

### Components to Wire in Route

```typescript
// src/components/tools/cron-parser/CronParserStructuredData.tsx (Server Component)
export function CronParserStructuredData({ locale }: { locale: string }): JSX.Element {
  // Renders SoftwareApplication JSON-LD script
  // url == canonical == seo.absoluteToolUrl(locale, 'cron-parser')
}

// src/components/tools/cron-parser/CronParserHowTo.tsx (Server Component)
export function CronParserHowTo(): JSX.Element {
  // Renders Intro + HowTo sections (SSR, NOT behind mounted gate)
  // Uses synchronous useTranslations('tools.cron-parser')
  // Renders as semantic HTML (h1, h2, p, etc.)
}

// src/components/tools/cron-parser/CronParserFaq.tsx (Server Component)
export function CronParserFaq(): JSX.Element {
  // Renders FAQ section (SSR, NOT behind mounted gate)
  // Emits FAQPage JSON-LD (via Faq component pattern)
}
```

**Rules:**
- All three components render OUTSIDE any `'use client'` Client Component (no mounted gate).
- i18n in these components MUST use **synchronous** `useTranslations` (NOT async getTranslations—vitest incompatible).
- HowTo + Faq are rendered in the route, never in the Client Component.
- Canonical URL = `seo.absoluteToolUrl('cron-parser', locale)` (computed in route).
- JSON-LD `url` field == canonical.

---

## 6. Registry Entry (Exact)

**File:** `src/tools/registry.ts`

**Addition:**

```typescript
{
  id: 'cron-parser',
  slug: 'cron-parser',
  category: 'dev',
  icon: 'Clock',
  accent: 'rose',
  status: 'live',  // ← UPDATE SPEC: currently says 'coming_soon'
  order: 125,      // ← UPDATE SPEC: currently says order:22
  addedAt: '2026-07-10',
  keywords: [
    'cron', 'schedule', 'job', 'timezone', 'next-run', 'crontab',
    '크론', '크론표현식', '스케줄', '일정', '예약', '시간대', '작업',
    'unix', 'linux', '자동화', 'automation', 'developer', 'devops'
  ],
}
```

**SPEC Edits Required:**
- Line 36: `status: 'coming_soon'` → `status: 'live'` (ship it immediately)
- Line 324: `order: 22` → `order: 125` (place it after other dev tools in registry)
- Line 325: `addedAt: '2026-07-10'` ✓ (correct)

---

## 7. Route Wiring Checklist

**File:** `src/app/[locale]/tools/[slug]/page.tsx`

### Step 1: Import Components

Add to the top of the file (in alphabetical order with other tool imports):

```typescript
import { CronParserStructuredData } from '@/components/tools/cron-parser/CronParserStructuredData';
import { CronParserHowTo } from '@/components/tools/cron-parser/CronParserHowTo';
import { CronParserFaq } from '@/components/tools/cron-parser/CronParserFaq';
```

### Step 2: Dynamic Import

Add to the `dynamic()` block (in alphabetical order):

```typescript
const CronParser = dynamic(() =>
  import('@/components/tools/cron-parser/CronParser').then((m) => ({
    default: m.CronParser,
  }))
);
```

### Step 3: generateMetadata Branch

In the `generateMetadata` function, add branch (after existing tools, maintain alphabetical order):

```typescript
else if (slug === 'cron-parser') {
  title = t('meta.title');
  description = t('meta.description');
}
```

### Step 4: Page Render (Inside ToolBody)

In the render return, add branch inside `<ToolBody>` switch/if (maintain alphabetical order):

```typescript
else if (slug === 'cron-parser') {
  return (
    <>
      <CronParserStructuredData locale={locale} />
      <CronParser />
      <CronParserHowTo />
      <CronParserFaq />
    </>
  );
}
```

---

## 8. Build Order & Task Split

### Phase 1: Domain (Parallel Domain Engineer)

**Duration:** ~3–4 hours  
**Deliverables:** `src/lib/cron-parser/*` (all modules + tests)

1. `schema.ts` + `constants.ts` (zod + field definitions)
2. `tokenizer.ts` (lexical analysis, test with golden tokens)
3. `parser.ts` (field parsing, test with golden expressions: `0 9 * * MON-FRI`, `@daily`, invalid: `61 * * * *`)
4. `validator.ts` (semantic validation, test dom/dow OR logic)
5. `description.ts` (DescriptionModel generation, NOT English prose)
6. `next-runs.ts` (next-run algorithm with DST, golden vectors: known expressions + expected next runs)
7. `macros.ts` (expansion + tests)
8. `presets.ts` + `timezone-list.ts` (constants, no tests needed)

**Test Coverage:** ≥95% (golden vectors, edge cases: leap year Feb 29, Feb 30, DST boundaries)

---

### Phase 2a: Hook & Root (Parallel UI Engineer #1)

**Duration:** ~2 hours  
**Deliverables:** `useCronParser.ts` + `CronParser.tsx`

1. `useCronParser.ts`: state management, localStorage persist, debounce parse orchestration
2. `CronParser.tsx`: client root component, state owner, layout coordinator

**Tests:** useCronParser hook tests (localStorage load/save, parse flow, debounce)

---

### Phase 2b: Input Components (Parallel UI Engineer #2)

**Duration:** ~2 hours  
**Deliverables:** `ExpressionInput.tsx`, `TimezoneSelector.tsx`, `PresetExpressions.tsx`, `RecentsList.tsx`, `CopyButton.tsx`

**Tests:** RTL for each component (onChange, value binding, selections)

---

### Phase 2c: Display Components (Parallel UI Engineer #1)

**Duration:** ~2 hours  
**Deliverables:** `FieldBreakdownTable.tsx`, `DescriptionText.tsx`, `NextRunsList.tsx`, `ErrorMessage.tsx`, `CronCheatsheet.tsx`, `ParseResultDisplay.tsx`

**Tests:** RTL snapshot + structure tests

---

### Phase 3: Platform Wiring (Platform Engineer)

**Duration:** ~1.5 hours  
**Deliverables:** Registry entry, route wiring, i18n keys

1. Add registry entry to `src/tools/registry.ts`
2. Add dynamic imports + branches to `src/app/[locale]/tools/[slug]/page.tsx`
3. Add i18n keys to `src/i18n/messages/{ko,en}.json`
4. Create SEO components: `CronParserStructuredData.tsx`, `CronParserHowTo.tsx`, `CronParserFaq.tsx`

**Tests:** tsc, build, route availability

---

### Phase 4: SEO & Accessibility (Parallel QA + Platform)

**Duration:** ~1.5 hours  
**Deliverables:** E2E tests, accessibility audit

1. E2E: Expression input → parse → field table display → next-runs computed + formatted
2. E2E: Timezone change → next-runs reformatted in new timezone
3. E2E: Invalid expression → error message (specific field + message)
4. E2E: Preset load → next-runs computed
5. Accessibility: WCAG 2.1 AA (keyboard Nav, screen reader, reduced-motion)
6. Visual: 320px responsive, no overflow, focus visible

---

## 9. QA Gate List (Non-Negotiable)

### Golden Vectors (Domain Layer Unit Tests)

These expressions MUST compute correctly:

| Expression | Expected Frequency | Example Next Run |
|------------|-------------------|------------------|
| `0 9 * * MON-FRI` | Weekdays 9 AM | Next Mon/Tue/Wed/Thu/Fri 9:00 AM |
| `0 0 1 * *` | Monthly 1st midnight | Next 1st of month 12:00 AM |
| `0 0 * * 0` | Weekly Sunday midnight | Next Sunday 12:00 AM |
| `0 0 29 2 *` | Feb 29 (leap years only) | 2028-02-29, 2032-02-29, ... |
| `*/5 * * * *` | Every 5 minutes | +5 min, +10 min, ... |
| `0 0 31 * *` | 31st of each month | Next 31st (skip Apr, Jun, Sep, Nov, Feb) |
| `@daily` | Midnight | Tomorrow 12:00 AM, day after, ... |

### Edge Cases

- **Leap Year Feb 29**: `0 0 29 2 *` must skip 2026, 2027 (non-leap), match 2028
- **Feb 30 (impossible)**: No upcoming runs within 4 years
- **DST Spring Forward (2 AM → 3 AM)**: If job at 2:30 AM EDT, skip that occurrence
- **DST Fall Back (2 AM → 1 AM)**: If job at 1:30 AM EDT, check both occurrences
- **Timezone localization**: Same expression in EST vs. JST must compute correct times
- **dom/dow OR logic**: `0 0 15 * MON` → runs 15th OR any Monday (not AND)

### Accessibility (E2E)

- [ ] Tab through all inputs (ExpressionInput, TimezoneSelector, PresetExpressions)
- [ ] Screen reader announces field labels, error messages, next-run dates
- [ ] Reduced-motion: Cheatsheet accordion opens instantly (no slide), no hover lift
- [ ] Focus visible: All buttons have `focus-visible:ring` (no mouse-only focus rings)
- [ ] Color contrast: Error text ≥4.5:1 (rose on white/dark), field table readable

### Responsive (E2E)

- [ ] 320px: FieldBreakdownTable single-column cards, NextRunsList stacked, timezone dropdown scrollable
- [ ] 1440px: FieldBreakdownTable multi-column, NextRunsList table layout
- [ ] Touch targets: All buttons/inputs ≥44×44px
- [ ] No horizontal scroll

### i18n (E2E)

- [ ] /ko page: All visible text in Korean, no English leaks
- [ ] /en page: All visible text in English, no Korean leaks
- [ ] Error messages localized
- [ ] Description text (from DescriptionModel) rendered correctly in both locales

### SEO (Lighthouse + Manual)

- [ ] Prerender HTML: `<meta name="description">` present + matches i18n
- [ ] Prerender HTML: `<link rel="canonical">` present + correct URL
- [ ] Prerender HTML: JSON-LD SoftwareApplication + FAQPage (both 1 each)
- [ ] JSON-LD `url` field == canonical
- [ ] HowTo/FAQ content appears in prerender (not behind mounted gate)
- [ ] robots.txt allows crawl
- [ ] sitemap.xml includes `/[locale]/tools/cron-parser` (2 entries for ko/en)

### Build & Type Safety

- [ ] `tsc --noEmit` → 0 errors (strict mode)
- [ ] `vitest run` → 100% pass (domain ≥95%, UI ≥80%, total ≥85%)
- [ ] `next build` → Success (SSG page generated for both locales)
- [ ] No `console.log` in source
- [ ] No hardcoded English in domain layer

---

## 10. Parser Implementation: Build vs. Buy

### Recommendation: **Hand-Written Parser**

**Rationale:**
1. Cron parsing is simple (~300 LOC): tokenize 5 fields → validate bounds → expand ranges/steps/names
2. No external dependency added (bundle impact: 0 bytes)
3. Full control over error messages (friendly, field-specific)
4. Hand-written is often faster than npm library overhead
5. npm `cron-parser` v3 is ~30KB gzipped (not tiny for a single feature)

**Decision Point (at implementation time):**
- If `cron-parser` v3 is MIT/Apache-licensed AND <15KB gzipped AND passes all golden vectors:
  - Consider it as a test oracle (validate hand-written against it)
  - Ship hand-written
- Otherwise: ship hand-written

---

## 11. Assumptions & Confirmations Required

| Assumption | Status | Required Confirmation |
|-----------|--------|----------------------|
| `dev` category already exists in registry | ✓ Yes (SPEC says so) | N/A |
| status='live' (not 'coming_soon') for immediate ship | ✓ Assumed per SPEC context | Update SPEC line 36 + 324 |
| order=125 (after other dev tools) | ✓ Assumed | Confirm with liveTools order |
| Timezone = IANA names only (not EST, PST) | ✓ Per SPEC | Confirm TIMEZONE_NAMES coverage |
| 10 presets (not 5, not 20) | ? Assumed | Exact number acceptable? |
| 4-year lookahead cap (not 2, not 10) | ✓ Per SPEC line 53 | Confirm MAX_LOOKAHEAD_YEARS |
| dom/dow = OR logic (not AND) | ✓ Per SPEC line 267 | Documented in FAQ.items.0 |

---

## 12. Risk Mitigations

### Risk: Parser Correctness vs. Known Cron Libraries
**Mitigation:** Use https://crontab.guru as reference for golden vectors. Compare hand-written output against it for 20+ expressions before shipping.

### Risk: DST Boundary Bugs
**Mitigation:** Test with explicit UTC/EST/JST triplets. Use Intl.DateTimeFormat as single source of truth (no Date math tricks).

### Risk: Long Iteration (4 years = 2M+ candidates)
**Mitigation:** Optimize with smart skip-ahead (jump months/years if not matching). If >200ms, introduce date-fns `nextDate` helper. Benchmark early.

### Risk: i18n Key Drift (UI references non-existent keys)
**Mitigation:** Linter: grep all `t('tools.cron-parser.\*')` calls in UI; cross-check against ko.json/en.json keys. Fail build if mismatch.

---

## Summary for Parallel Engineers

| Role | Phase | Duration | Start Condition | Deliverables |
|------|-------|----------|-----------------|---------------|
| **Domain Engineer** | 1 | 3–4h | Go signal | All `lib/cron-parser/*` (95%+ tests) |
| **UI Engineer #1** | 2a, 2c | 4h | Domain green | Hook + root + display components (80%+ tests) |
| **UI Engineer #2** | 2b | 2h | Domain green | Input + preset + recent components (80%+ tests) |
| **Platform Engineer** | 3 | 1.5h | All 2* green | Registry + route wiring + SEO components + i18n |
| **QA** | 4 | 1.5h | Platform green | E2E golden vectors + accessibility + responsive + i18n |

**Critical Path:** Domain (3–4h) → UI (4h parallel) → Platform (1.5h) → QA (1.5h) = **~7–8 hours wall time**

---

**Blueprint prepared by:** Architect  
**Date:** 2026-07-10  
**Status:** ✅ Ready for parallel execution
