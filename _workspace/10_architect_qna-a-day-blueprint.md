# 10 · Architect Blueprint — Q&A a Day (1일 1질문) 도구 추가

## 범위 (이번 실행)
"Q&A a Day 도구를 개발하세요" → **platform 셸(대시보드·헤더·라우트 백본)은 완성됨 · 도구 자체만 신규 추가**. `/[locale]/tools/qna-a-day`에서 동작하는 **완전한 일 1질문 저널 도구**를 클린 아키텍처 + TDD로 구현한다.

- **포함:** 도메인(로컬시간 날짜 엔진·질문 은행·저널 불변 ops·통계·스키마·직렬화), 훅(useDailyJournal: localStorage 지속성 + autosave + 액션), 전체 UI 컴포넌트(Today·Calendar·Journal·Settings·Intro·HowTo·FAQ), 코드분할 질문 데이터셋, SEO(SoftwareApplication + FAQPage JSON-LD + metadata), 테스트(유닛 ≥80%·도메인 100%·E2E 5시나리오·a11y).
- **이번 범위 밖:** 플랫폼 셸(앱라우터·헤더/풋터·라우트 백본)은 이미 완성됨 · 변경 금지. 백엔드/데이터베이스/동기화 없음(100% 클라이언트).

## 계층 분해 (클린 아키텍처)

| 계층 | 모듈/파일 | 책임 | 허용 import | 담당 |
|------|-----------|------|------------|------|
| 1 도메인 | `src/lib/qna-a-day/date.ts` | 로컬시간 날짜 엔진: 키생성·파싱·이웃·윤년 | 표준 JS만 | domain |
| 1 도메인 | `src/lib/qna-a-day/questions.ts` | 365 질문 은행: 조회·02-29→02-28 폴백·커버리지 검증 | 표준 JS, `./date` | domain |
| 1 도메인 | `src/lib/qna-a-day/journal.ts` | 항목/스토어 타입 + 불변 ops: upsert·delete·검색·월일 조회 | 표준 JS, `./date` | domain |
| 1 도메인 | `src/lib/qna-a-day/stats.ts` | 통계: 현재연속일·최장연속·누계·해완성도·히트맵 | 표준 JS, `./date`, `./journal` | domain |
| 1 도메인 | `src/lib/qna-a-day/schema.ts` | Zod 스키마: Entry·Store + STORE_VERSION + migrate() | `zod` only | domain |
| 1 도메인 | `src/lib/qna-a-day/serialization.ts` | 직렬화: serialize()·deserialize()·mergeStores() (충돌=최신 updatedAt) | `zod`, `./schema`, `./journal` | domain |
| 2 유스케이스 | `src/lib/qna-a-day/questions.ts` | (포함됨 위) 질문 은행 로드/검증 | (포함됨) | domain |
| 3 어댑터 | `src/components/tools/qna-a-day/useDailyJournal.ts` | 훅: localStorage 읽기/쓰기/격리 + autosave + 액션 디스패처 | 모든 도메인, react, next-intl | ui |
| 3 어댑터 | `src/components/tools/qna-a-day/DailyQuestion.tsx` | 오케스트레이터(use client): 탭상태 + useDailyJournal() | 모든 하위, react | ui |
| 3 어댑터 | `src/components/tools/qna-a-day/{Today,Calendar,Journal,Settings,Progress,Composer,PastYears}.tsx` | UI 패널들 (순수 또는 로컬상태만) | react, useTranslations, useDailyJournal | ui |
| 3 어댑터 | `src/components/tools/qna-a-day/{Intro,HowTo,Faq}.tsx` | SEO 장문·FAQ (서버 렌더 가능) | react, useTranslations | ui |
| 3 어댑터 | `src/components/tools/qna-a-day/data/questions.json` | 코드분할 데이터: 365 질문 (ko·en), 동적 임포트만 | (정적 파일) | platform |
| 4 프레임워크 | `src/tools/types.ts` | ToolCategory에 'mindset' 추가 | 표준 TS | platform |
| 4 프레임워크 | `src/tools/registry.ts` | qna-a-day 엔트리 추가 (id/slug/category/icon/accent/status/order/keywords) | `./types` | platform |
| 4 프레임워크 | `src/lib/tool-search.ts` | CATEGORY_ORDER에 'mindset' 추가 (위치: 'fun' 뒤) | 표준 TS | platform |
| 4 프레임워크 | `src/i18n/messages/{ko,en}.json` | `tools.qna-a-day.*` UI 문자열 + `categories.mindset` 라벨 추가 | (정적 파일) | platform |
| 4 프레임워크 | `src/app/[locale]/tools/[slug]/page.tsx` | slug === 'qna-a-day' 분기 + 동적 임포트 + generateMetadata 추가 | 모든 안쪽 | platform |
| 4 프레임워크 | `pnpm add zod` | 스키마 검증용 라이브러리 추가 | (의존성) | platform |

**의존성 규칙:** `src/lib/qna-a-day/*`는 `react`/`next`/`next-intl`/DOM 직접 import **금지**. 현재 시간은 주입. 질문 은행은 정적이므로 순수 함수.

---

## 계약 (CONTRACT — 변경 시 architect 승인 필수)

### 1. 도메인 계약: 날짜 엔진 `src/lib/qna-a-day/date.ts`

```typescript
export type DateKey = string;      // "YYYY-MM-DD" 형식
export type QuestionKey = string;  // "MM-DD" 형식

// ===== 로컬시간 기반 키 생성 (CRITICAL: UTC 아님) =====
export function toDateKey(d: Date): DateKey;
  // 예: new Date(2026, 5, 30) → "2026-06-30" (로컬 연/월/일)

export function toQuestionKey(d: Date | DateKey): QuestionKey;
  // 예: new Date(2026, 5, 30) → "06-30" (로컬 월/일)
  // 또는 "2026-06-30" → "06-30"

export function questionKeyFromDateKey(k: DateKey): QuestionKey;
  // "2026-06-30" → "06-30" (slice)

// ===== 02-29 폴백 (윤년 처리) =====
export function resolveQuestionKey(mmdd: QuestionKey): QuestionKey;
  // "02-29" → "02-28", 나머지는 항등원

// ===== 파싱·이웃 =====
export function parseDateKey(k: DateKey): Date;
  // "2026-06-30" → new Date(2026, 5, 30) 로컬 자정

export function addDays(k: DateKey, delta: number): DateKey;
  // "2026-06-30" + 1 → "2026-07-01" (DST 안전: date component 직접 조작)

export function neighbors(k: DateKey): { prev: DateKey; next: DateKey };
  // "2026-06-30" → { prev: "2026-06-29", next: "2026-07-01" }

// ===== 윤년·월 계산 =====
export function isLeapYear(y: number): boolean;
  // (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

export function daysInMonth(y: number, m: number): number;
  // 1-12, 고려: 윤년의 2월 = 29, 평년 = 28

// ===== 주입 가능 now (테스트용) =====
export function today(now?: Date): DateKey;
  // now가 주어지면 그 로컬 날짜 키, 없으면 new Date() 사용
```

**불변식:**
- **로컬시간 only:** `Date.prototype.toISOString()`(UTC)는 절대 사용 금지. 항상 `getFullYear()`, `getMonth()`, `getDate()`로 로컬 컴포넌트 추출.
- **DST 안전:** `addDays`는 밀리초 계산(ms±3600s 손실) 대신 date 객체의 `setDate()` 사용.
- **일관성:** `questionKeyFromDateKey(dateKey) === toQuestionKey(parseDateKey(dateKey))`
- **모든 함수 순수:** `new Date()` 금지 (주입).

---

### 2. 도메인 계약: 질문 은행 `src/lib/qna-a-day/questions.ts`

```typescript
export interface QuestionRecord {
  date: string;              // "MM-DD" (예: "01-01", "02-28")
  month: number;             // 1-12
  day: number;               // 1-31 (그 월 범위 내)
  question: string;          // 한국어 질문
  questionEn: string;        // 영어 질문
}

export interface QuestionBank {
  [mmdd: QuestionKey]: QuestionRecord;  // "01-01" → { question, questionEn, ... }
}

// ===== 은행 초기화 (동적 임포트 타겟) =====
export async function loadQuestionBank(): Promise<QuestionBank>;
  // src/components/tools/qna-a-day/data/questions.json을 동적 로드·파싱·반환
  // 실패 시 에러 throw (초기화 시점에서만 처리)

// ===== 질문 조회 =====
export function getQuestion(bank: QuestionBank, mmdd: QuestionKey, locale: 'ko' | 'en'): string;
  // mmdd="02-29"이면 resolveQuestionKey("02-29") → "02-28"로 변환 후 조회
  // locale 선택: locale==='ko' ? record.question : record.questionEn
  // 누락 시 에러

export function getQuestionForDate(bank: QuestionBank, dateKey: DateKey, locale: 'ko' | 'en'): string;
  // dateKey="2026-06-30" → toQuestionKey() → "06-30" → resolveQuestionKey() → getQuestion()

// ===== 검증 (빌드/테스트 타임) =====
export function validateBank(bank: QuestionBank): { valid: boolean; errors: string[] };
  // 체크:
  // 1. 정확히 365개 항목 (02-29 제외, 01-01..12-31)
  // 2. 각 항목 date 형식 "MM-DD" 유효
  // 3. 각 항목 question과 questionEn 비어있지 않음
  // 4. 중복 없음 (중복 date → 에러)
  // 5. 월/일 범위 검증 (day ∈ [1, daysInMonth(any_year, m)])
```

**불변식:**
- **365-키 커버리지:** 01-01부터 12-31까지 정확히 365일 (02-29 없음).
- **02-29 폴백:** 윤년의 2월 29일 조회는 자동으로 2월 28일 질문으로 리다이렉트.
- **장기 안정성:** 질문이 날짜에 매핑되면, 같은 날짜는 같은 질문을 영구히 반환 (사용자의 "1년 전 오늘" 약속 보호).

---

### 3. 도메인 계약: 저널 `src/lib/qna-a-day/journal.ts`

```typescript
export type DateKey = string; // "YYYY-MM-DD"
export type QuestionKey = string; // "MM-DD"

// ===== 데이터 엔티티 =====
export interface Entry {
  date: DateKey;             // "2026-06-30" (primary key)
  questionKey: QuestionKey;  // "06-30" (derived from date, normalized by resolveQuestionKey)
  text: string;              // 답변 텍스트, 0..4000자
  createdAt: number;         // epoch ms
  updatedAt: number;         // epoch ms
}

export interface Store {
  version: number;           // STORE_VERSION (초기값 1)
  entries: Record<DateKey, Entry>;  // "2026-06-30" → Entry
  meta: {
    createdAt: number;
    lastBackupAt?: number;
    reminderDismissedAt?: number;
  };
}

export const STORE_VERSION = 1;

// ===== 불변 ops =====
export function newEntry(date: DateKey, text: string, questionKey: QuestionKey, now: number): Entry;
  // 새 항목 생성 (createdAt = updatedAt = now)

export function upsertEntry(
  store: Readonly<Store>,
  date: DateKey,
  text: string,
  questionKey: QuestionKey,
  now: number
): Store;
  // text 트림. 빈 텍스트(공백만) → deleteEntry 호출.
  // 기존 항목이면 createdAt 보존, updatedAt만 업데이트.
  // 신규면 newEntry() 사용.
  // 새 스토어 반환 (원본 불변).

export function deleteEntry(store: Readonly<Store>, date: DateKey): Store;
  // date 항목 제거 · 새 스토어 반환

export function getEntry(store: Readonly<Store>, date: DateKey): Entry | undefined;

// ===== 조회 =====
export function entriesForMonthDay(
  store: Readonly<Store>,
  mmdd: QuestionKey,
  excludeYear?: number
): Entry[];
  // 같은 MM-DD인 항목들 반환 (여러 연도).
  // excludeYear가 주어지면 그 연도 제외.
  // 결과: 최신 연도 먼저 (desc 정렬).

export function listEntries(store: Readonly<Store>): Entry[];
  // 모든 항목, 날짜 역순 (최신 먼저).

export function searchEntries(
  store: Readonly<Store>,
  query: string,
  getQuestionText: (mmdd: QuestionKey, locale: 'ko' | 'en') => string,
  locale: 'ko' | 'en'
): Entry[];
  // 쿼리(case-insensitive, diacritic-insensitive)로 Entry.text + question 문자열 검색.
  // 일치 항목, 날짜 역순.
```

**불변식:**
- **키 일관성:** `questionKey === resolveQuestionKey(toQuestionKey(parseDateKey(date)))`
- **빈 항목 미저장:** 공백 또는 empty 텍스트 → 엔트리 제거, 저장 금지.
- **dateKey PRIMARY KEY:** 같은 dateKey는 최대 1개 항목만.
- **타임스탬프:** createdAt ≤ updatedAt (항상).

---

### 4. 도메인 계약: 통계 `src/lib/qna-a-day/stats.ts`

```typescript
export type DateKey = string;

export function currentStreak(
  entries: Readonly<Record<DateKey, unknown>>,
  today: DateKey
): number;
  // 오늘을 포함한 연속일 수.
  // 오늘 미기입 → 어제가 기입이면 어제까지 카운트 (현재일 grace).
  // 어제도 미기입 → 0.
  // 그 외: 오늘부터 역순으로 연속 기입 일수.
  // 예: [어제, 그저께, 3일전] 기입 + 오늘 미기입 → 3일 (grace로 어제까지).

export function longestStreak(entries: Readonly<Record<DateKey, unknown>>): number;
  // 전체 기록에서 가장 긴 연속.

export function totalAnswered(entries: Readonly<Record<DateKey, unknown>>): number;
  // 항목 개수.

export function yearCompletion(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number,
  today: DateKey
): { answered: number; elapsed: number };
  // 그 연도의 완성도.
  // year < currentYear: 365 (또는 윤년 366).
  // year === currentYear: today까지 경과 일수.
  // answered: 그 연도 기입 수.

export function monthCompletion(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number,
  month: number,
  today: DateKey
): { answered: number; elapsed: number };
  // 월 완성도 (유사).

export function heatmap(
  entries: Readonly<Record<DateKey, unknown>>,
  year: number
): Record<DateKey, boolean>;
  // 그 연도 모든 날짜 → boolean (기입 여부).
  // 예: "2026-01-01" → true if exists, else false.
```

**불변식:**
- **grace day:** currentStreak이 현재일을 기입하지 않아도 어제가 연속이면 포함.
- **누계:** totalAnswered = entries.length (주입만 가능).
- **연도 클램프:** year > currentYear는 미래 (처리 미정).

---

### 5. 도메인 계약: 스키마 & 직렬화 `src/lib/qna-a-day/schema.ts`, `serialization.ts`

```typescript
// schema.ts
import { z } from 'zod';

export const STORE_VERSION = 1;

export const EntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  questionKey: z.string().regex(/^\d{2}-\d{2}$/),
  text: z.string().max(4000),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

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
export type Entry = z.infer<typeof EntrySchema>;

export function migrate(raw: unknown): Store;
  // raw JSON을 zod 파싱 + 마이그레이션 적용 후 최신 Store 반환.
  // version < STORE_VERSION이면 수정.
  // 지금은 version=1만 → migrate는 항등원.

// serialization.ts

export function serialize(store: Readonly<Store>): string;
  // JSON.stringify(store) (정렬 가능하도록 replacer 사용 권장).

export function deserialize(json: string): Store;
  // JSON.parse + zod 검증 + migrate() 호출.
  // 실패 → Zod ValidationError throw (통화자가 처리).

export function mergeStores(local: Store, imported: Store): Store;
  // 두 스토어 병합.
  // 충돌(같은 dateKey): updatedAt 더 최신인 항목 선택.
  // 반환: 새 Store (원본 불변).

export interface ConflictSummary {
  totalImported: number;
  conflicts: number;  // 같은 dateKey인데 다른 updatedAt 항목 수
}

export function analyzeConflicts(local: Store, imported: Store): ConflictSummary;
  // 병합 전 미리보기.
```

**불변식:**
- **Zod 검증 mandatory:** 모든 경계(localStorage read, import, migrate)에서.
- **실패 → 격리:** 불량 JSON/스키마 오류 → 기존 데이터 삭제 금지, 격리 key에 복사 후 사용자에게 다운로드 제안.
- **버전 호환성:** STORE_VERSION 증가 시 migrate() 업데이트 (Phase 2+).

---

### 6. 어댑터 계약: 훅 `src/components/tools/qna-a-day/useDailyJournal.ts`

```typescript
// 전체 도메인 타입 리익스포트 (UI가 import하기 쉽게)
export type { DateKey, QuestionKey, Entry, Store, QuestionBank } from '@/lib/qna-a-day/*';

// ===== 훅 반환 타입 =====
export interface DailyJournalState {
  // 현재 상태
  today: DateKey;
  todayEntry: Entry | undefined;
  todayQuestion: { key: QuestionKey; text: string };  // locale 선택됨
  
  // 통계
  currentStreak: number;
  longestStreak: number;
  totalAnswered: number;
  yearCompletion: { answered: number; elapsed: number };
  
  // 접근자
  entries: Readonly<Record<DateKey, Entry>>;
  store: Readonly<Store>;
}

export interface DailyJournalActions {
  // 편집
  upsertEntry: (date: DateKey, text: string) => Promise<void>;  // debounce 700ms
  deleteEntry: (date: DateKey) => Promise<void>;
  
  // 쿼리
  getEntry: (date: DateKey) => Entry | undefined;
  entriesForMonthDay: (mmdd: QuestionKey, excludeYear?: number) => Entry[];
  searchEntries: (query: string) => Entry[];
  
  // 백업
  export: () => Blob;  // JSON Blob, filename과 함께
  import: (file: File, strategy: 'merge' | 'replace') => Promise<{ success: boolean; error?: string }>;
  reset: () => Promise<void>;
  
  // UI 상태 (로컬)
  dismissBackupReminder: () => void;
  setOnboarded: () => void;
}

export function useDailyJournal(): DailyJournalState & DailyJournalActions;
  // 마운트 시:
  //   1. localStorage 읽기 (key: 'jurepi-qna-a-day')
  //   2. zod 파싱 + migrate()
  //   3. 실패 → 격리 (corrupt 키에 저장) + 신규 스토어로 시작
  //   4. 질문 은행 동적 로드 (locale 기반)
  // 언마운트 시 debounce 타이머 정리.
  // 의존성: locale (next-intl), now (주입 또는 현재).

export interface UseLocalStorageError {
  type: 'UNAVAILABLE' | 'QUOTA_EXCEEDED' | 'UNKNOWN';
  message: string;
  isRecoverable: boolean;
}

export function useLocalStorageError(): UseLocalStorageError | null;
  // localStorage 에러 (Private mode, 비활성화, 용량 초과) 감지.
  // 경고 표시용.
```

**불변식:**
- **Autosave debounce:** 700ms 후 마지막 변경만 쓰기.
- **Blur on save:** 포커스 잃으면 즉시 저장 (700ms 대기 안 함).
- **실시간 상태 갱신:** dispatch 직후 store 업데이트 (localStorage 쓰기는 비동기지만 상태는 동기).
- **격리 on 오류:** localStorage 읽기/쓰기 실패 → 세션 메모리로 폴백 + 경고 표시.

---

### 7. 컴포넌트 계약: DailyQuestion (오케스트레이터)

```typescript
export interface DailyQuestionProps {
  // (비어있음 — 모든 상태는 useDailyJournal에서 옴)
}

export function DailyQuestion(): React.ReactNode;
  // 'use client'
  // 탭 상태(today/calendar/journal/settings) 소유.
  // useDailyJournal() 호출, 자식에 pass.
  // 구조:
  // <DailyQuestion>
  //   <QnaIntro /> (서버 렌더 가능)
  //   <ProgressChip />
  //   <TabBar />
  //   {activeTab === 'today' && <TodayPanel {...state} />}
  //   {activeTab === 'calendar' && <CalendarPanel {...state} />}
  //   {activeTab === 'journal' && <JournalPanel {...state} />}
  //   {activeTab === 'settings' && <SettingsPanel {...state} />}
  //   <QnaHowTo /> (서버 렌더 가능)
  //   <QnaFaq /> (서버 렌더 가능)
  // </DailyQuestion>
```

---

### 8. SEO & 프레임워크 계약

```typescript
// src/app/[locale]/tools/[slug]/page.tsx (수정)

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const t = await getTranslations({ locale, namespace: `tools.${slug}` });
  const tool = getToolBySlug(slug);
  
  if (!tool || tool.status !== 'live') {
    return {};
  }
  
  // slug별 metadata 생성
  if (slug === 'qna-a-day') {
    return buildToolMetadata({
      locale,
      slug,
      title: t('meta.title'),  // "1일 1질문 · 매일의 기록"
      description: t('meta.description'),  // "365일 자기성찰 일기…"
    });
  }
  
  // (기존 ladder 분기 생략)
  return {};
}

// ToolContent 컴포넌트 (역시 수정)

async function ToolContent({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);
  if (!tool || tool.status !== 'live') notFound();
  
  const DailyQuestion = dynamic(
    () => import('@/components/tools/qna-a-day/DailyQuestion').then(m => ({ default: m.DailyQuestion }))
  );
  
  if (slug === 'qna-a-day') {
    return <DailyQuestion />;
  }
  if (slug === 'ladder') {
    return <LadderGame />;
  }
  
  notFound();
}
```

**i18n 키 네임스페이스** `tools.qna-a-day.*` (ko/en 동일 셋):
```
meta.title
meta.description
intro.lead
tabBar.today
tabBar.calendar
tabBar.journal
tabBar.settings
todayPanel.weekday    // "오늘" 배지
todayPanel.neighborPrev
todayPanel.neighborNext
todayPanel.backToToday
todayPanel.pastYearsHeading
todayPanel.noPastYears
composerPlaceholder
composerSaving
composerSaved
composerCharCount
composerDelete
composerUndo
composerSaveNow
calendarPanel.monthSwitch
calendarPanel.yearSwitch
calendarPanel.answered
calendarPanel.unanswered
calendarPanel.today
calendarPanel.future
journalPanel.search
journalPanel.yearFilter
journalPanel.noEntries
journalPanel.noResults
journalPanel.clearSearch
settingsPanel.export
settingsPanel.import
settingsPanel.reset
settingsPanel.privacy
settingsPanel.backupReminder
howTo.heading
howTo.section1
howTo.section2
howTo.section3
faqHeading
faq[0].q, faq[0].a
...
faq[6].q, faq[6].a
```

---

## 불변식 & CRITICAL 게이트

| 불변식 | 검증 방법 | 실패 시 영향 |
|---------|---------|-----------|
| **로컬시간 날짜 키** | 단위테스트: UTC ≠ 로컬 검증, 타임존 오프셋 조작 | "오늘" 질문 오류 (시간대마다 다름) |
| **365 질문 커버리지** | 도메인 단위테스트: validateBank() 통과 + 02-29→02-28 | 누락된 날짜의 "데이터 없음" |
| **02-29→02-28 폴백** | 유닛테스트: resolveQuestionKey("02-29") 확인 + E2E leap day | 윤년 2월29일 에러 또는 404 |
| **불변 ops** | 모든 journal.* 함수가 새 Store 반환 | Redux-스타일 시간여행 디버깅 불가 |
| **durability** | 격리 테스트: JSON 손상 → 재시작 | 사용자 기록 silent wipe |
| **import/export round-trip** | serialize→deserialize 바이트 재현 테스트 | 기록 손실 또는 타임스탬프 손상 |
| **키 일관성** | questionKey === resolveQuestionKey(toQuestionKey(parseDateKey(date))) | 2월29일 쿼리 실패 |
| **빈 항목 제거** | 공백 입력 → deleteEntry 자동 | 실제 삭제는 안 되고 blank 항목 남음 |
| **Zod 검증** | 모든 read/import가 StoreSchema.parse() 통과 | 불량 데이터 inject |
| **질문 안정성** | 같은 MM-DD는 여러 연도에 같은 질문 | "1년 전 오늘" 약속 깨짐 |

---

## 데이터 와이어링: 질문 데이터셋

**소스:** `docs/services/mindset/qna-a-day/1mnc-questions.json` (365개, ko/en)  
**대상:** `src/components/tools/qna-a-day/data/questions.json` (동일 구조)  
**로드:** `useDailyJournal` 마운트 시 동적 임포트

```typescript
// src/components/tools/qna-a-day/data/questions.json 구조
{
  "generated": "2026-06-30",
  "total": 365,
  "questions": [
    { "date": "01-01", "month": 1, "day": 1, "question": "...", "questionEn": "..." },
    ...
  ]
}
```

**변환 규칙:** 소스 → 대상 (구조 동일, 복사만)

**로드 방식:**
```typescript
async function loadQuestionBank(): Promise<QuestionBank> {
  const module = await import('@/components/tools/qna-a-day/data/questions.json');
  const data = module.default;
  
  // 배열 → 레코드 매핑
  const bank: QuestionBank = {};
  for (const q of data.questions) {
    bank[q.date] = q;  // "01-01" → record
  }
  
  const validation = validateBank(bank);
  if (!validation.valid) throw new Error(...validation.errors);
  
  return bank;
}
```

**성능:** 코드분할 (동적 임포트) → 이 라우트에서만 로드, 메인 bundle 영향 없음.

---

## 작업 분배 & 모듈 경계

### Phase 1: 도메인 (domain-engineer) — **병렬 독립**

**모듈:**
- `src/lib/qna-a-day/date.ts` (로컬시간, 윤년, 이웃)
- `src/lib/qna-a-day/questions.ts` (은행 로드·검증·02-29→02-28)
- `src/lib/qna-a-day/journal.ts` (불변 ops, Entry/Store)
- `src/lib/qna-a-day/stats.ts` (streak, completion, heatmap)
- `src/lib/qna-a-day/schema.ts` (Zod schemas + STORE_VERSION)
- `src/lib/qna-a-day/serialization.ts` (serialize, deserialize, merge)

**파일 의존성:**
```
date.ts (순수 JS)
├── questions.ts (date 사용)
├── journal.ts (date 사용)
│   └── stats.ts (journal 사용)
└── serialization.ts (journal, schema 사용)
   └── schema.ts (journal 타입)
```

**테스트 (Vitest, ≥80% 커버리지, 도메인 100%):**
- date: UTC offset mock (±12h), DST transition, leap year, year boundary
- questions: 365 커버리지, 02-29 폴백, 필드 presence
- journal: upsert/delete, empty removal, monthDay query, immutability
- stats: streak grace, longest, completion 수학, heatmap
- schema: Zod rejection, validation error handling, 버전 관리
- serialization: round-trip byte-fidelity, merge 충돌 해결

**완료 기준:**
- 0 TS errors
- ≥80% coverage (도메인 100%)
- 모든 유닛 GREEN
- 날짜 엔진: UTC와 로컬 분리 입증 (타임존 테스트)
- 질문 은행: 365 커버리지 입증 (테스트 어설션)

---

### Phase 2: 훅 & i18n (ui-engineer: 1명, platform-engineer: 병렬) — **모듈 경계 명확**

#### ui-engineer 담당

**모듈:**
- `src/components/tools/qna-a-day/useDailyJournal.ts`
  - localStorage 읽기/쓰기/격리
  - debounce autosave (700ms)
  - 액션 디스패처 (upsert, delete, export, import, reset)
  - 상태 expose (today, entries, stats, store)
  - 에러 핸들링 (UNAVAILABLE, QUOTA_EXCEEDED, corrupt blob 격리)

**테스트 (Vitest):**
- 마운트: localStorage 읽기, 파싱, 격리 테스트
- autosave: 700ms debounce, blur 즉시 저장
- 액션: upsert 후 상태 갱신, export blob 생성, import 검증
- 에러: private mode fallback, quota error toast, corrupt isolation

**완료 기준:**
- ≥80% coverage
- debounce / blur 동작 입증
- localStorage 오류 처리 입증

#### platform-engineer 담당 (병렬)

**모듈:**
- `src/tools/types.ts`: 'mindset' to ToolCategory union
- `src/tools/registry.ts`: qna-a-day 엔트리 추가
  ```typescript
  {
    id: 'qna-a-day',
    slug: 'qna-a-day',
    category: 'mindset',
    icon: 'NotebookPen',
    accent: 'grape',
    status: 'live',
    isNew: true,
    order: 8,
    keywords: ['1일1질문', '하루한질문', '365질문', '질문일기', '자기성찰', '일기', '저널', 'q&a a day', 'daily question', 'journal', 'self reflection'],
  }
  ```
- `src/lib/tool-search.ts`: CATEGORY_ORDER에 'mindset' 추가 (위치: 'fun' 뒤, 'dev' 앞 또는 제거)
  ```typescript
  const CATEGORY_ORDER: Array<ToolCategory | 'all'> = [
    'all',
    'random',
    'calculator',
    'text',
    'converter',
    'fun',
    'mindset',  // NEW
  ];
  ```
- `src/i18n/messages/ko.json` & `en.json`
  - `categories.mindset: "마음·기록" / "Mindset"`
  - `tools.qna-a-day.*` 전체 네임스페이스 (UI 작성자와 협력)
- `pnpm add zod` (package.json 업데이트)

**완료 기준:**
- 레지스트리 타입 일관성 (no TS errors)
- 메시지 키 동일성 (ko/en)
- 빌드 그린

---

### Phase 3: UI 컴포넌트 (ui-engineer) — **2가지 순차 옵션**

**옵션 A: 한 번에 전체** (컨텍스트 충분하면)
- DailyQuestion (오케스트레이터)
- TodayPanel + AnswerComposer + PastYears + ProgressChip + onboarding
- CalendarPanel (month grid + year switch + heatmap)
- JournalPanel (search + year filter)
- SettingsPanel (export/import/reset/privacy/reminder)
- Intro, HowTo, Faq (SEO 장문)

**옵션 B: 2단계 분할** (컨텍스트 제약 시)
1. **Core (Today):** DailyQuestion + TodayPanel + AnswerComposer + ProgressChip + onboarding + 기본 Intro
2. **Extended (Calendar·Journal·Settings):** CalendarPanel + JournalPanel + SettingsPanel + HowTo + Faq

**모듈 경계:**
```
src/components/tools/qna-a-day/
├── DailyQuestion.tsx (오케스트레이터, 탭 상태)
├── TodayPanel.tsx (오늘의 질문·답변)
├── AnswerComposer.tsx (textarea, autosave 지시, char count) — 재사용
├── PastYears.tsx (1년 전 오늘)
├── ProgressChip.tsx (streak + 올해 완성도)
├── CalendarPanel.tsx (월 그리드 + 히트맵 + 연도 전환)
├── JournalPanel.tsx (검색·년도 필터)
├── SettingsPanel.tsx (export/import/reset/privacy/reminder)
├── QnaIntro.tsx (H1 + lead)
├── QnaHowTo.tsx (SEO 장문)
├── QnaFaq.tsx (FAQ + JSON-LD)
├── useDailyJournal.ts (훅, phase 2에서 완성됨)
└── data/
    └── questions.json (365 entries, 동적 로드)
```

**테스트 (Vitest + Playwright):**
- Vitest: 컴포넌트 렌더링, props 변화, 이벤트 핸들러
- Playwright: E2E 5가지 시나리오 (아래 참고)

**완료 기준:**
- ≥80% coverage (전체, 도메인만 아님)
- E2E 5가지 시나리오 GREEN
- a11y: keyboard tab/navigate, aria-live save, reduced-motion
- 시각 회귀: 320/768/1024, 라이트·다크 (Playwright 스크린샷)

---

### Phase 4: 프레임워크·SEO (platform-engineer) — phase 2 후 **의존**

**모듈:**
- `src/app/[locale]/tools/[slug]/page.tsx` (수정)
  - slug === 'qna-a-day' 분기 추가
  - `dynamic(() => import(...DailyQuestion))` 추가
  - `generateMetadata` 구현 (platform-wide, 모든 도구 지원)
- `src/lib/seo.ts` (이미 존재, softwareApplicationJsonLd + faqPageJsonLd 사용)

**완료 기준:**
- title/description/canonical/hreflang 생성 입증 (E2E, 소스 검사)
- SoftwareApplication + FAQPage JSON-LD 발출 입증
- buildToolMetadata 호출 확인

---

### Phase 5: QA & 통합 (qa-integration) — 모든 phase 후

**크로스-커팅 검증:**
1. **레지스트리↔라우트↔i18n 일관성**
   - registry id/slug 와 route 분기 일치
   - 모든 i18n 키 사용되고 빠진 것 없음
   - 메시지 ko/en 길이 균형 (UI 깨짐 방지)

2. **질문 데이터셋**
   - 365 커버리지 (단위테스트로 이미 입증되지만, 재확인)
   - 02-29→02-28 폴백 동작 (E2E)
   - 한국어/영어 동일 레이아웃 (시각 회귀)

3. **날짜 엔진**
   - 로컬시간 정확성 (타임존 E2E 테스트, 클락 mock)
   - DST 경계 (옵션)

4. **durability round-trip**
   - export → reset → import (E2E)
   - corrupt blob 격리 (E2E)
   - 병합 vs 덮어쓰기 (유닛테스트)

5. **UI/UX**
   - Autosave 느낌 (<50ms 입력 지연)
   - 한 번에 한 질문 (시각 위계)
   - ≥44px 터치 타겟 (a11y)

6. **성능**
   - 질문 데이터셋 코드분할 (번들 영향 확인)
   - CLS 0 (ad slot 고정 높이)
   - CWV 목표 충족 (Lighthouse)

7. **a11y**
   - 키보드 전체 네비게이션 (tab/shift-tab, arrow, enter)
   - aria-live save 상태 (스크린리더)
   - reduced-motion 존중 (탭 전환, 연속일 bump, 저장 펄스)
   - 색상 대비 (grape on white: WCAG 2.1 AA)

---

## 빌드 순서 & 의존 그래프

```
0. pnpm add zod (platform-engineer)
1. src/tools/types.ts + registry.ts + tool-search.ts (platform-engineer) [독립]
   ↓
2. src/lib/qna-a-day/* (domain-engineer) + src/i18n/messages/* (platform-engineer) [병렬]
   ↓
3. src/components/tools/qna-a-day/useDailyJournal.ts + src/components/tools/qna-a-day/data/questions.json (ui-engineer) [병렬 platform]
   ↓
4. src/components/tools/qna-a-day/{Today,Calendar,Journal,Settings,Progress,Composer,PastYears,Intro,HowTo,Faq}.tsx (ui-engineer)
   ↓
5. src/app/[locale]/tools/[slug]/page.tsx + generateMetadata (platform-engineer)
   ↓
6. E2E + a11y + 시각 회귀 (qa-integration)
```

**병렬 가능:**
- phase 1 도메인 × registry 변경 (독립 모듈)
- phase 2 훅 × i18n 메시지 (계약만 맞으면)
- phase 3 UI × phase 2 후 platform-engineer의 라우트 통합

---

## 테스트 전략

### 유닛 (Vitest, 도메인 100% · 전체 ≥80%)

```typescript
// date.ts 테스트 예
describe('date engine', () => {
  test('toDateKey uses local components, not UTC', () => {
    // UTC+9 환경에서 new Date("2026-06-29T23:00:00Z") (= 로컬 2026-06-30)
    // → toDateKey() = "2026-06-30" (로컬, not UTC 2026-06-29)
  });
  test('resolveQuestionKey("02-29") → "02-28"', () => {
    expect(resolveQuestionKey("02-29")).toBe("02-28");
  });
  test('addDays DST-safe', () => {
    // DST 경계에서 +1day가 23h/25h 차이 무시하고 정확히 다음날
  });
});

// journal.ts 테스트 예
describe('journal ops', () => {
  test('upsertEntry returns new Store (immutable)', () => {
    const s1 = initStore();
    const s2 = upsertEntry(s1, "2026-06-30", "answer", "06-30", Date.now());
    expect(s1).not.toBe(s2);  // 다른 객체
    expect(s1.entries).not.toBe(s2.entries);
  });
  test('empty text → deleteEntry', () => {
    const s1 = upsertEntry(store, "2026-06-30", "  ", "06-30", Date.now());
    expect("2026-06-30" in s1.entries).toBe(false);
  });
});

// schema.ts 테스트 예
describe('zod schema', () => {
  test('rejects invalid dateKey', () => {
    expect(() => StoreSchema.parse({
      version: 1,
      entries: { "wrong": { ... } },  // "YYYY-MM-DD" 아님
      meta: { createdAt: 0 }
    })).toThrow();
  });
});
```

### E2E (Playwright)

**시나리오 1: 답변 저장·새로고침**
```typescript
test('answer today, persist across reload', async ({ page }) => {
  await page.goto('/ko/tools/qna-a-day');
  // 1. 오늘 질문 보임
  const question = await page.locator('text=내 삶의 목적은').isVisible();
  // 2. 답변 입력 → 700ms 후 "저장됨"
  await page.fill('textarea', 'My answer');
  await page.waitForTimeout(800);
  await expect(page.locator('text=저장됨')).toBeVisible();
  // 3. 페이지 새로고침 → 같은 답변 보임
  await page.reload();
  await expect(page.locator('textarea')).toHaveValue('My answer');
});
```

**시나리오 2: 캘린더·다중 연도 조회**
```typescript
test('calendar, multi-year past entries', async ({ page }) => {
  // 1. 과거 데이터 시드 (예: 작년 같은 날)
  // 2. 달력 탭 → 현재 월 그리드
  // 3. 과거 연도 선택 → 기입 밀도 시각화
  // 4. 같은 날 "1년 전 오늘" 보임
});
```

**시나리오 3: Export·Reset·Import**
```typescript
test('backup/restore round-trip', async ({ page }) => {
  // 1. 기존 기록 여러 개 + export → JSON 다운로드
  // 2. Settings → reset → 확인·기록 삭제
  // 3. import 파일 선택 → 병합 옵션 선택
  // 4. 모든 기록 복원 완벽 (text, date, timestamp)
});
```

**시나리오 4: i18n·윤년**
```typescript
test('locale switch, Feb 29 handling', async ({ page }) => {
  // ko → en 스위치 시 질문 언어 변경
  // 윤년 2월 29 선택 → 2월 28 질문 표시
});
```

**시나리오 5: SEO·Storage 오류 복원력**
```typescript
test('SEO metadata, storage failure graceful', async ({ page }) => {
  // 1. 빌드 산출물 정적 metadata (title/desc/canonical/hreflang)
  // 2. Private mode → 경고 표시, 입력 가능, export 여전히 작동
  // 3. 손상된 blob → 격리 키에 저장, 새로 시작
});
```

### a11y (axe + 키보드)
- axe-playwright: 자동 감지
- 키보드 탐색: Tab → 모든 button/input 순회, 모달 포커스 트랩
- aria-live: 저장 상태 읽혀짐
- reduced-motion: 탭 전환/펄스 안 함

### 시각 회귀 (Playwright 스크린샷)
- 320 (mobile), 768 (tablet), 1024 (desktop)
- 라이트·다크 테마 모두
- 주요 상태: 오늘, 캘린더, 팝업 열림

---

## 주요 발견사항 & 위험

### 1. CategoryFilter 동적 유도 — 잠재적 버그

**문제점:**
- `src/lib/tool-search.ts`의 `deriveCategories()` 함수는 **tools 배열에 현재 존재하는 카테고리**만 필터링한다.
- **CATEGORY_ORDER 배열은 하드코딩** (현재: `['all', 'random', 'calculator', 'text', 'converter', 'fun']`).
- `'mindset'`을 registry에 추가해도, **CATEGORY_ORDER에 없으면 필터 칩에 나타나지 않는다.**

**위험 수준:** HIGH

**해결:**
- `src/lib/tool-search.ts` CATEGORY_ORDER에 `'mindset'` 추가 (위치: 'fun' 뒤)
- platform-engineer 필수 작업

**검증:**
- E2E: CategoryFilter 화면에서 "마음·기록" 칩 보임 입증
- 단위테스트: deriveCategories(tools) 에 mindset 도구 포함 시 필터링 확인

---

### 2. generateMetadata 미구현 — SEO 미완성

**문제점:**
- 현재 `src/app/[locale]/tools/[slug]/page.tsx`에는 **generateMetadata 내보내기 없음**.
- 각 도구별 title/description/canonical/hreflang 미생성.
- Ladder도 SEO metadata 없음 (단순 기본값).

**위험 수준:** MEDIUM (SEO 영향)

**해결:**
- platform-engineer가 `generateMetadata` 구현 (phase 4)
- `buildToolMetadata()`를 각 slug 분기에서 호출

---

### 3. Zod 미설치 — 빌드 오류 예상

**문제점:**
- 스키마·검증 계약이 `zod`를 사용하지만, package.json에 없음.

**위험 수준:** CRITICAL (빌드 차단)

**해결:**
- `pnpm add zod@latest` (v3.x)
- platform-engineer, phase 0

---

### 4. 로컬시간 날짜 키 — 시간대 에러 가능성

**문제점:**
- 전 세계 사용자가 UTC offset 다양 (예: UTC+12, UTC-11).
- 자정 근처에 `new Date().toISOString()`을 쓰면 **다음날 질문이 보일 수 있음** (예: 로컬 23:30 = UTC 다음날 08:30).

**위험 수준:** CRITICAL (기능 오류, 여러 보고 후 대면)

**해결:**
- domain-engineer가 date.ts에서 로컬 component만 사용 보장
- 단위테스트: UTC offset mock으로 UTC ± 범위 검증
- E2E 선택: 클락 조작 library (`@sinonjs/fake-timers` 등) 사용해 UTC+12/-11 시뮬레이션

---

### 5. 365 질문 커버리지 — 빠진 날짜 위험

**문제점:**
- 소스 `docs/.../1mnc-questions.json`이 정말 365개인지, 02-29 없는지, 필드 complete인지 검증 필요.

**위험 수준:** MEDIUM

**해결:**
- domain-engineer가 `validateBank()` 구현 + 단위테스트로 입증
- 빌드 시 데이터셋 검증 (또는 별도 스크립트)

---

### 6. localStorage 격리 키 이름 — 충돌 가능성

**문제점:**
- corrupt blob 격리 키: `jurepi-qna-a-day-corrupt-{ts}`.
- 많은 손상 이벤트 → 여러 key 누적 → 저장공간 낭비.

**위험 수준:** LOW (Phase 2)

**해결:**
- 격리 key는 타임스탠프가 아닌 **고정 이름** + 기존 corrupt 덮어쓰기
- 또는: 최대 1개만 유지 (이전 corrupt 삭제 후 새로 저장)

---

### 7. 의존성 격리 검증 부재

**문제점:**
- domain-engineer가 실수로 `import React` 추가 → 계층 위반 (테스트 미통과여도 컴파일 성공).

**위험 수준:** MEDIUM (설계 침식)

**해결:**
- ESLint 규칙 추가: `src/lib/qna-a-day/*` import 화이트리스트 제한
- 또는: 수동 code review gate

---

## 성공 기준

| 기준 | 검증 방법 |
|------|----------|
| **날짜 정확성** | 유닛테스트: UTC offset mock ±12h, DST 경계, 윤년 |
| **내구성** | E2E: export→reset→import 바이트 정확도, corrupt 격리 |
| **질문 무결성** | 유닛테스트: 365 커버리지, 02-29→02-28, ko/en 완전성 |
| **기능** | E2E 5가지 시나리오 GREEN |
| **UX** | <50ms 입력 지연, autosave 명확, 4000자 하드캡 |
| **기술품질** | 0 TS errors, ≥80% 커버리지 (도메인 100%), 계층 import 규칙 준수 |
| **SEO** | title/desc/canonical/hreflang/OG/JSON-LD 발출 (E2E 소스 검사) |
| **a11y** | axe PASS, 키보드 전체 네비, aria-live 작동, reduced-motion 존중 |
| **성능** | 질문 데이터셋 코드분할, CLS 0, CWV 목표 충족 |
| **빌드** | pnpm build 그린, 10page SSG 생성, 무검사 라우트 404 |

---

## 최종 정리

### 핵심 계약 변수
- **DateKey** = "YYYY-MM-DD" (로컬시간, UTC 아님)
- **QuestionKey** = "MM-DD" (365개, 02-29 없음 → 02-28로 폴백)
- **STORE_VERSION** = 1 (migrate 준비)
- **Autosave debounce** = 700ms (blur는 즉시)
- **maxChars** = 4000 (soft 3500부터 경고)

### 리스크 STOP-START 변경
- **STOP:** Ladder 도구 관련 코드 수정 금지 (별도 서비스)
- **START:** Zod 설치 + CATEGORY_ORDER 업데이트 + generateMetadata 구현

### 팀 커뮤니케이션
- domain-engineer → ui-engineer: date.ts 계약 확정 후 통지
- ui-engineer → platform-engineer: i18n 키 최종 목록 제공
- platform-engineer → qa-integration: registry·route·messages 일관성 검증

---

**Blueprint 작성 완료.** architect는 단계별 실행을 감시하며, 계약 위반 시 즉시 개입한다.
