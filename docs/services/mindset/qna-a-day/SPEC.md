# Q&A a Day — One Question a Day (Daily Question Journal) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Q&A a Day** (1일 1질문 / Daily Question Journal) — a year-long, one-question-a-day self-reflection tool.
> Internal service codename: `qna-a-day`. Registry id: `qna-a-day`. Public URL slug: `/[locale]/tools/qna-a-day`.
> Question content source: the provided **`1mnc-questions.json`** dataset in this service directory (365 entries, ko + en).
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md) (Korean: [`SPEC_KR.md`](../../../SPEC_KR.md))
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>Q&A a Day — One Question a Day / Daily Question Journal (Jurepi tool, codename qna-a-day, registry id qna-a-day)</project_name>

<overview>
Q&A a Day is a year-long self-reflection tool: every calendar date carries one fixed, curated, open-ended question, and the user writes a short answer to it. "Today" shows today's question front and center with a writing area; the answer is saved privately in the browser. Because each question is keyed to the calendar date (month-day), the same question returns on the same date every year — so over multiple years the user accumulates a personal record and can read what they wrote "a year ago today." This is the classic "Q&A a Day" journal reimagined as a free, private, browser-only web tool.

The tool mounts inside the Jurepi platform shell at `/[locale]/tools/qna-a-day`. It uses the platform header/footer, locale (ko/en), theme, consent-gated ad slots, and the DESIGN.md token system. This SPEC specifies only the tool: its data model, views, calendar/question engine, interactions/animation, tool-specific SEO content, and tests.

CRITICAL (question source): the 365 questions are NOT invented here — they come from the provided dataset `1mnc-questions.json` (365 records: `date` "MM-DD", `month`, `day`, `question` for Korean, `questionEn` for English, covering 01-01 through 12-31). The build copies/transforms this file into the tool's code-split bank module. Treat this dataset as the canonical content; do not paraphrase or reassign questions to different dates.

CRITICAL (client-only): 100% client-side. There is NO backend and NO database. Every answer is stored in the browser via `localStorage` under a single versioned, schema-validated key. The only first-party persistence is `localStorage`; there is no network call that ever sends a user's answers anywhere.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL of this tool's views — Today / Calendar / Journal / Settings, plus opening/editing any date — switch via local React state with NO route navigation and NO full page reload; nothing about answering or browsing triggers a server round-trip. Usability comes first: the daily answer is reachable in one glance, help/how-to is collapsed by default, and every interaction stays instant. The route is statically generated (SSG) for SEO/indexing, and the interactive tool itself is a single client-component island on that static shell.

CRITICAL (durability): Because `localStorage` is the only store and is trivially erased (clearing browsing data, private mode, quota eviction, switching devices/browsers), a year of journaling is fragile. Therefore JSON **export (backup) and import (restore)** are not a nice-to-have — they are a core, first-class feature, paired with a gentle periodic backup nudge. Losing the user's writing is the worst possible failure; the design defends against it explicitly.

CRITICAL (date correctness): "Today's question" is derived from the user's LOCAL wall-clock date, never from UTC. Naive `Date.prototype.toISOString()` returns a UTC date and will show the wrong day's question for users behind/ahead of UTC near midnight. All date-key derivation uses local date components. This is treated with the same rigor that the Ladder tool gives to fairness.

CRITICAL (question stability): Once a date's question text is published, it is a stable contract. Users build a multi-year record against "the March 15 question," so silently reassigning or reordering questions to dates breaks the "compare to last year" promise. Wording corrections are allowed; changing which question belongs to which date is a breaking change.
</overview>

<platform_integration>
  - Route: /[locale]/tools/qna-a-day (SSG; registry slug "qna-a-day", id "qna-a-day", status "live", accent "grape", category "mindset")
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module.
  - Consumes: i18n namespace `tools.qna-a-day.*` (UI strings, how-to, FAQ — NOT the 365 questions); the in_content AdSlot below the tool; the SEO metadata builder in lib/seo.ts.
  - Platform dependency (small registry change, see key_implementation_notes): add `'mindset'` to the `ToolCategory` union in src/tools/types.ts, a localized category label, and (DESIGN mapping) `mindset → grape` accent. The tool registry gains one entry.
  - The page shell (breadcrumb + in_content ad) is rendered by the platform tool route; this module renders everything between the breadcrumb and the ad.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - CRITICAL date engine: pure, LOCAL-time date math — dateKey "YYYY-MM-DD", questionKey "MM-DD" (365 keys, 01-01..12-31; no 02-29 → leap-day reuses the 02-28 question), leap-year handling, neighbor-day navigation, multi-year same-date grouping.
    - The 365-question dataset (ko + en) loaded from the provided `1mnc-questions.json`, keyed by month-day, code-split and lazy-loaded on the tool page (see performance note).
    - "Today" view: today's date + question + autosaving answer composer + char count + streak/progress chip + "a year ago today" past-year answers + prev/next neighbor peek.
    - "Calendar" view: month grid with answered/unanswered/today states, year switcher, a year-strip heatmap; tap a day → compose/edit that date's answer.
    - "Journal" view: searchable reverse-chronological list of all answered entries, year filter, click to edit.
    - "Settings" view: data export (download JSON backup), import (restore/merge from file), reset-all (double-confirm), privacy explainer, optional backup reminder.
    - Streak + progress stats (current streak, longest streak, total answered, this-year completion).
    - Tool-specific SEO long-form ("What is a daily question journal?" / "How to use") + FAQ (FAQPage JSON-LD).
    - Keyboard shortcuts; reduced-motion fallbacks; full a11y (aria-live save status, focus management).
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle (platform).
    - Tool registry, sitemap/robots, consent banner, ad loading mechanism (platform).
    - Accounts, server persistence, cross-device sync (no backend) — cross-device is achieved only via manual export/import.
    - Push notifications / scheduled reminders (no service worker scheduling at launch; an in-page reminder note only).
    - Social sharing of private answers, AI-generated prompts, mood tracking analytics.
  </out_of_scope>
  <future_considerations>
    - Optional passphrase-based client-side encryption of the stored journal (Web Crypto) — Phase 2.
    - Optional Web Notification daily reminder (requires permission + a service worker) — Phase 2.
    - Export to formatted PDF / printable "year book" — Phase 2.
    - A dedicated 366th question for 02-29 (currently reuses 02-28) — Phase 2 content addition.
    - Themed question packs (gratitude, career, relationships) selectable per day — Phase 3.
    - Local full-text search highlighting and tags — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl — all inherited from the platform.</inherited>
  <module_specific>
    <persistence>localStorage only, single versioned key `jurepi-qna-a-day` holding `{ version, entries, meta }` as JSON. Read once on mount, debounced write on change.</persistence>
    <validation>zod v3.x to validate the stored blob on read and any imported file at the trust boundary (reject malformed without destroying existing data).</validation>
    <question_bank>The 365 ko+en questions come from the provided `1mnc-questions.json` (one file holds both languages: `question` = ko, `questionEn` = en, keyed by `date` "MM-DD"). Ship it as a CODE-SPLIT data module (src/components/tools/qna-a-day/data/questions.json), dynamically imported only on this tool page — NOT placed in the global i18n message files (protects the platform JS budget; see performance note). ~75KB; may be split per-locale at build if needed.</question_bank>
    <ids>nanoid v5.1 only if a per-entry surrogate id is ever needed; the dateKey "YYYY-MM-DD" is the natural primary key, so ids are generally unnecessary.</ids>
    <animation>Native CSS transitions only (save-pulse, tab cross-fade, calendar-day fill, streak bump). No animation library.</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/
├── lib/qna-a-day/                     # PURE domain layer — no React/Next imports, fully unit-tested
│   ├── date.ts                        # LOCAL-time date math: toDateKey, toQuestionKey, parseDateKey, addDays, isLeapYear, daysInMonth, neighbors
│   ├── questions.ts                   # questionKeyForDate(date) + resolveQuestionKey (02-29 → 02-28) + bank lookup; 365-key coverage assert
│   ├── journal.ts                     # Entry/Store types + immutable ops: upsertEntry, getEntry, deleteEntry, entriesForMonthDay, listEntries, searchEntries
│   ├── stats.ts                       # currentStreak, longestStreak, totalAnswered, yearCompletion, monthCompletion, heatmap
│   ├── schema.ts                      # zod schemas (Entry, Store) + STORE_VERSION + migrate()
│   └── serialization.ts               # serialize() (export), deserialize() (validated import), mergeStores() (conflict = newer updatedAt)
├── components/tools/qna-a-day/
│   ├── DailyQuestion.tsx              # orchestrator (Client Component) — owns tab state + useDailyJournal()
│   ├── useDailyJournal.ts             # hook: wraps pure store with localStorage persistence + autosave + actions
│   ├── TodayPanel.tsx                 # today's date + question + composer + streak chip + neighbor peek
│   ├── AnswerComposer.tsx             # textarea + autosave indicator + char counter (reused by Today & Calendar)
│   ├── PastYears.tsx                  # "a year ago today" — entries for the same MM-DD across prior years
│   ├── CalendarPanel.tsx             # month grid + year switch + year-strip heatmap; opens composer for a chosen date
│   ├── JournalPanel.tsx               # searchable list of all entries + year filter
│   ├── SettingsPanel.tsx              # export / import / reset / privacy / backup reminder
│   ├── ProgressChip.tsx               # streak + this-year completion ring
│   ├── QnaIntro.tsx                   # H1 + lead (SEO; server-rendered where possible)
│   ├── QnaHowTo.tsx                   # "What is 1일 1질문?" / "How to use" (SEO long-form)
│   ├── QnaFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── data/
│       └── questions.json             # 365 entries sourced from this service's 1mnc-questions.json: { date "MM-DD", month, day, question(ko), questionEn(en) }
└── i18n/messages/{ko,en}.json         # tools.qna-a-day.* UI strings (tabs, labels, how-to, FAQ) — NOT the 365 questions
</file_structure>

<core_data_entities>
  <question note="DERIVED, not stored — text comes from the questions.json dataset">
    - key: string "MM-DD" (e.g., "03-15"); 365 keys total, 01-01..12-31 (no 02-29)
    - month: number (1–12); day: number (1–31, valid for month)
    - question: string (ko) / questionEn: string (en) — from questions.json[date]; localized at lookup; stable contract per date
    INVARIANT — COVERAGE: the dataset defines exactly 365 month-day keys (01-01..12-31, excluding 02-29) with non-empty `question` AND `questionEn`; a unit test asserts full coverage and no gaps/dupes. On 02-29 (leap years) the lookup falls back to the 02-28 question so there is never a missing question.
  </question>
  <entry note="the user's answer for one real calendar date">
    - date: string "YYYY-MM-DD" — PRIMARY KEY (local date the answer belongs to)
    - questionKey: string "MM-DD" — derived from `date`; denormalized for convenience
    - text: string — the answer; max 4000 chars (soft counter from 3500; hard cap 4000)
    - createdAt: number (epoch ms); updatedAt: number (epoch ms)
    INVARIANT — KEY CONSISTENCY: questionKey === questionKeyFromDateKey(date); empty/whitespace-only `text` means "no entry" → such an entry is removed, not stored blank. A 02-29 entry stores its own dateKey (e.g., "2028-02-29") even though it shows the 02-28 question.
  </entry>
  <journal_store note="the single localStorage blob">
    - version: number (STORE_VERSION, starts at 1; migrate() upgrades older blobs)
    - entries: Record&lt;dateKey, Entry&gt; (keyed by "YYYY-MM-DD")
    - meta: { lastBackupAt?: number; reminderDismissedAt?: number; createdAt: number }
    localStorage key: `jurepi-qna-a-day`
    INVARIANT — VALIDATED BOUNDARY: every read from localStorage AND every imported file is parsed through the zod Store schema; a failure NEVER overwrites or deletes existing good data — it is quarantined (see error_handling).
  </journal_store>
  <defaults>
    - New user: empty entries, meta.createdAt = now, no backup reminder until ≥ 7 answered entries.
    - Active tab default: "today".
  </defaults>
</core_data_entities>

<component_hierarchy>
  <daily_question>            <!-- "use client"; owns tab state + useDailyJournal() -->
    <qna_intro />            <!-- H1 + lead (server-rendered where possible) -->
    <progress_chip />        <!-- current streak + this-year completion ring -->
    <tab_bar />              <!-- 오늘 / 달력 / 모아보기 / 설정 -->
    <today_panel>            <!-- tab: today (default) -->
      <answer_composer />    <!-- textarea + autosave indicator + counter -->
      <past_years />         <!-- "a year ago today" for the same MM-DD -->
      <neighbor_peek />      <!-- prev/next day arrows -->
    </today_panel>
    <calendar_panel>         <!-- tab: calendar -->
      <month_grid />         <!-- answered/unanswered/today cells -->
      <year_switch />
      <heatmap />            <!-- year-strip cells -->
      <answer_composer />    <!-- opens for the selected date -->
    </calendar_panel>
    <journal_panel>          <!-- tab: journal — searchable list -->
    </journal_panel>
    <settings_panel>         <!-- tab: settings — export/import/reset/privacy -->
    </settings_panel>
    <qna_how_to />           <!-- SEO long-form -->
    <qna_faq />              <!-- FAQPage JSON-LD -->
  </daily_question>
  <note>SPA within the tool: views switch via local tab state, NOT route navigation (platform UX rule: tools are SPAs; easy, low-friction UX). Help/how-to is collapsed by default and opens on demand.</note>
</component_hierarchy>

<pages_and_interfaces>
  <qna_intro>
    - H1: "1일 1질문" / "One Question a Day" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): the private, year-long reflection ritual; answers stay in this browser.
    - Eyebrow above H1: "매일의 기록" / "DAILY REFLECTION" — eyebrow 12px/700/0.6px, var(--brand)
  </qna_intro>

  <progress_chip>
    - Compact row under the intro: a circular completion ring (this year answered / elapsed days) + "🔥 N일 연속" current-streak pill + "총 N개" total.
    - Ring stroke = accent grape var(--accent-grape); track = var(--surface-sunken). Streak pill = grape-soft bg, var(--text). Numbers in headline weight.
    - aria: ring has role="img" aria-label "올해 {answered}/{elapsed}일 기록".
  </progress_chip>

  <tab_bar>
    - Four pills: "오늘" / "달력" / "모아보기" / "설정" (en: Today / Calendar / Journal / Settings). category-pill style; active = brand honey-gold, inactive = surface-muted. role="tablist"; arrow-key navigation; aria-selected.
  </tab_bar>

  <today_panel tab="today">
    - Card: var(--surface), radius var(--radius-xxl) 28px, padding 24px, shadow --shadow-card.
    - Date header: weekday + full local date (e.g., "2026년 6월 30일 화요일"), headline weight; small "오늘" badge (grape-soft).
    - Question: displayed large — body-lg→headline scale, var(--text), quotation styling (leading accent bar 3px var(--accent-grape), 16px left padding). One question only.
    - <answer_composer>: see below. Placeholder "오늘의 답을 적어보세요…". Autosaves.
    - <neighbor_peek>: ‹ 어제 / 내일 › arrow buttons to view adjacent dates' questions+answers without leaving Today (updates the panel to that date; a "오늘로" chip returns). Future dates are viewable but show a subtle "미래" hint; answering a future date is allowed (people pre-write) but de-emphasized.
    - <past_years>: if entries exist for the same MM-DD in earlier years, show them beneath as stacked cards: "1년 전 오늘 · 2025" + answer excerpt, newest-first. Empty when none. This is the signature multi-year payoff.
  </today_panel>

  <answer_composer>
    - Auto-growing &lt;textarea&gt;, min-height 140px, body 16px line-height 1.6, radius var(--radius-lg), 1px var(--hairline), focus → border var(--brand) + 3px var(--brand-soft) ring.
    - Autosave: debounce 700ms after typing stops AND on blur; writes via useDailyJournal. Save status line (aria-live="polite"): "저장 중…" → "저장됨 · 방금" with a brief grape check pulse (reduced-motion: no pulse, text only).
    - Char counter bottom-right: "1234 / 4000"; turns var(--semantic-warning) from 3500; hard-stops input at 4000.
    - Clearing all text removes the entry (with an inline "삭제됨 · 되돌리기" undo toast for 5s).
    - Keyboard: Cmd/Ctrl+S forces immediate save + toast "저장됨".
  </answer_composer>

  <calendar_panel tab="calendar">
    - Year switch row: ‹ {year} › with current year default; cannot exceed current year + reasonable bound; shows count answered that year.
    - Month grid: 12 small month blocks OR a single large current-month grid with month paging (default: single month, paged). Each day cell 40–44px: answered = filled grape dot/tint, unanswered-past = faint outline, today = brand ring, future = muted. Tap a cell → opens the composer for that date (same AnswerComposer + that date's question) in an inline sheet/section.
    - Heatmap: a year-strip (GitHub-style), 365 cells (366 in leap years), grape intensity by answered (binary) with optional length tiers; hover/focus shows date + question + excerpt tooltip. Reduced-motion safe (no shimmer).
    - Cells are buttons with aria-label "{date}, {answered?'기록 있음':'기록 없음'}".
  </calendar_panel>

  <journal_panel tab="journal">
    - Search input (debounce 200ms) over answer text + question text; year filter pills (전체 / 2026 / 2025 …).
    - Reverse-chronological list: each row = date + question (1 line, ellipsis) + answer excerpt (2 lines, ellipsis) + edit affordance. Click → opens composer for that date.
    - Empty states: no entries yet ("첫 기록을 남겨보세요"), no search results ("검색 결과가 없어요" + clear button).
  </journal_panel>

  <settings_panel tab="settings">
    - Backup (export): "기록 내보내기" primary button → downloads `jurepi-qna-a-day-backup-YYYY-MM-DD.json` (the validated Store blob). Sets meta.lastBackupAt; shows "마지막 백업: …".
    - Restore (import): "기록 가져오기" → file picker (.json, size cap 5MB). Parsed + zod-validated. If valid, show a diff summary ("가져올 기록 N개, 겹치는 날짜 M개") and a choice: "병합(merge)" (conflict → keep newer updatedAt) or "덮어쓰기(replace)". Confirm before applying. Invalid file → friendly error, no change to existing data.
    - Reset: "모든 기록 삭제" danger button → double confirm modal that requires typing/holding; warns it is irreversible and suggests exporting first.
    - Privacy explainer: short, reassuring copy — answers live only in this browser, never uploaded; clearing browser data or switching device loses them unless exported.
    - Backup reminder: once ≥ 14 days since lastBackupAt AND ≥ 7 entries, show a dismissible inline nudge atop Today.
  </settings_panel>

  <onboarding>
    - First-ever visit (empty store): a one-time intro card above Today explaining the ritual + a "시작하기" that focuses the composer. Dismissed flag stored in meta.
  </onboarding>

  <qna_how_to>
    - SEO long-form (per locale): "1일 1질문이란?", "어떻게 사용하나요?", "왜 매일 한 가지 질문에 답할까요?" — 600–900 chars; emphasizes private/local storage, multi-year comparison, and the habit benefit.
  </qna_how_to>
  <qna_faq>
    - 5–7 Q&A; rendered + emitted as FAQPage JSON-LD. MUST include: "내 답변은 어디에 저장되나요?" (browser localStorage only, never uploaded → back up regularly); "기기를 바꾸면 기록이 옮겨지나요?" (only via export/import); "작년에 쓴 답을 볼 수 있나요?" (yes — same date shows prior years); "질문을 건너뛰어도 되나요?" (yes, return anytime); "2월 29일에는 어떤 질문이 나오나요?" (the dataset has 365 days; on leap-day 02-29 the 02-28 question is shown); "기록이 사라질 수 있나요?" (yes if browser data is cleared → export to be safe).
  </qna_faq>

  <keyboard_shortcuts_reference>
    - Global within tool: "1/2/3/4" → switch tabs (Today/Calendar/Journal/Settings); "t" → jump to Today.
    - Composer: Cmd/Ctrl+S → save now; Esc → blur composer / close calendar day sheet.
    - Calendar: arrow keys move the focused day; Enter opens it; PageUp/PageDown change month.
    - Disabled on touch (no physical keyboard).
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <date_engine>
    - toDateKey(d: Date): "YYYY-MM-DD" using LOCAL year/month/date (zero-padded) — never toISOString().
    - toQuestionKey(d: Date | dateKey): "MM-DD".
    - parseDateKey("YYYY-MM-DD"): Date at LOCAL midnight.
    - addDays / neighbors(dateKey): prev/next dateKey, DST-safe (operate on date components, not raw ms).
    - isLeapYear(y), daysInMonth(y, m). today(): a Date provider injectable for tests (no direct `new Date()` deep in pure code — pass `now`).
  </date_engine>
  <question_lookup>
    - questionKeyForDate(date) → "MM-DD"; resolveQuestionKey(mmdd) maps "02-29" → "02-28", else identity; bank[resolveQuestionKey(key)] → { question, questionEn }; pick by locale. The pure layer asserts the dataset covers all 365 keys.
  </question_lookup>
  <journal_ops note="all immutable — return new Store, never mutate">
    - upsertEntry(store, dateKey, text, now): trims text; empty → deleteEntry; else writes Entry (preserve createdAt, bump updatedAt).
    - entriesForMonthDay(store, "MM-DD", excludeYear?): Entry[] sorted by year desc — powers "a year ago today".
    - listEntries(store): Entry[] sorted by date desc.
    - searchEntries(store, query, bank): case/diacritic-insensitive substring over answer + question text.
  </journal_ops>
  <stats>
    - currentStreak(store, today): length of the consecutive run of answered days ending at `today`, OR ending at yesterday if today is not yet answered (grace for the current day); 0 if neither today nor yesterday answered.
    - longestStreak(store): longest consecutive answered run anywhere.
    - totalAnswered(store); yearCompletion(store, year, today) = answeredInYear / elapsedDaysInYear (full year if past year); monthCompletion similarly.
    - heatmap(store, year): per-date answered flag (+ optional length tier) for the year strip.
  </stats>
  <persistence_adapter useDailyJournal>
    - On mount: read `jurepi-qna-a-day` → zod parse → migrate() → state; on failure quarantine + start fresh (see error_handling).
    - On change: debounced (700ms) JSON.stringify → localStorage.setItem; catch quota/security errors → in-memory fallback + persistent warning.
    - Exposes: today's questionKey+text (locale dataset), today's entry, upsert/delete, stats, export(), import(file, strategy), reset().
  </persistence_adapter>
  <i18n>All UI strings from tools.qna-a-day.* (ko/en). The 365 questions come from the code-split questions.json dataset (ko `question` + en `questionEn`), dynamically imported on the route. No hard-coded copy.</i18n>
</core_functionality>

<error_handling>
  <form_validation>
    - Answer hard cap 4000 chars (input stops); soft warning color from 3500.
    - Whitespace-only answer is treated as empty (entry removed) — users are never blocked.
  </form_validation>
  <runtime>
    <localstorage_unavailable>Private mode / disabled storage → reads/writes throw → fall back to in-memory store for the session AND show a persistent, non-dismissible-until-acknowledged warning: "이 브라우저에서는 기록이 저장되지 않아요 — 내보내기로 백업하세요." Current typing is never lost mid-session.</localstorage_unavailable>
    <quota_exceeded>setItem throws QuotaExceededError → keep the in-memory state, toast: "저장 공간이 가득 찼어요. 오래된 기록을 내보내고 정리해 주세요." Do not drop the user's latest text.</quota_exceeded>
    <corrupt_blob>On read, if JSON parse or zod validation fails → DO NOT delete it. Copy the raw string to a quarantine key `jurepi-qna-a-day-corrupt-{ts}`, offer a one-click "손상된 데이터 내려받기" download, then start a fresh store. Never silently wipe.</corrupt_blob>
    <import_invalid>Imported file fails zod or exceeds size cap → friendly error modal, existing data untouched, no partial apply.</import_invalid>
    <error_boundary>Platform wraps the tool in an Error Boundary; a render failure shows a retry without crashing the shell.</error_boundary>
  </runtime>
  <note>This module makes NO first-party network requests; there is no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is the single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is GRAPE (var(--accent-grape) #e0912b / var(--accent-grape-soft) #fbe8cb) — a warm honey-gold (token name kept as `grape`). It shares the brand's warm family; identity vs. action is separated by ROLE, not hue.
    - Grape marks identity: the question's leading bar, the completion ring, the streak pill, answered calendar cells, heatmap intensity — always as accent tint / text-ink (var(--accent-grape-ink)), never as a CTA fill.
    - CTAs (export, "시작하기", primary save) stay brand honey-gold var(--brand) fill with var(--on-brand) text (or var(--brand-ink) for links). Accent is identity, never the action color (DESIGN do/don't).
  </accent_usage>
  <surfaces>Question card radius var(--radius-xxl) 28px; composer radius var(--radius-lg); past-year cards var(--radius-lg) on var(--surface-muted). Soft brand-tinted shadows (--shadow-card), no hard borders as elevation.</surfaces>
  <typography>H1 Gmarket Sans; the question itself is the editorial focal point (large, generous line-height, quotation bar) — hierarchy through scale contrast. Body/answer in Pretendard 16px/1.6. Dates/labels in caption/body-sm.</typography>
  <motion>transform / opacity only: tab cross-fade 150ms, save-check pulse (scale 1→1.2→1, 200ms), calendar-cell fill 150ms, streak bump on increment. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (no pulse/bump; instant fills).</motion>
  <accessibility>aria-live save status; tablist/tab roles + arrow keys; calendar cells as labeled buttons; ≥44px primary tap targets (≥40px calendar cells with spacing); visible focus-visible ring var(--focus-ring); WCAG 2.1 AA contrast on grape-on-white text (use var(--text) on grape-soft, not grape-on-white for body).</accessibility>
  <responsive>Single-column composer-first layout on mobile; Today card full-width; calendar month grid keeps ≥40px cells (scrolls if needed); tab bar scrolls horizontally with snap on narrow screens. Breakpoints follow DESIGN (480/768/1024).</responsive>
  <atmosphere>Quiet, warm, journal-like — generous whitespace, one question in the spotlight, low-chrome. Avoids dashboard-by-numbers density; the stats are a small chip, not the hero.</atmosphere>
</aesthetic_guidelines>

<security_considerations>
  <input>Answers and questions render as text nodes (React escapes); NEVER dangerouslySetInnerHTML anywhere in this module.</input>
  <import_validation>CRITICAL: imported JSON is parsed with a strict zod Store schema (version known, dateKey regex `^\d{4}-\d{2}-\d{2}$`, text length ≤ 4000, numeric timestamps, array/object shapes), behind a 5MB size cap and a `.json`/application-json type check. Anything failing is rejected wholesale — never partially applied, never destructive to existing data.</import_validation>
  <privacy>The user's answers are private personal writing. They are stored ONLY in localStorage and are NEVER transmitted. No analytics event ever includes answer/question text (only coarse counters like tab_open if any). This is stated plainly in the UI and FAQ.</privacy>
  <note>No secrets, no network calls, no third-party storage. Export produces a local file the user controls.</note>
</security_considerations>

<advanced_functionality>
  <multi_year_reflection>The signature feature: MM-DD question keying means the same date returns the same question every year, so PastYears surfaces prior-year answers as a built-in "then vs. now" — no extra storage, emerges from the key design.</multi_year_reflection>
  <backup_restore optional="false">Export/import is core (see Settings). Merge strategy resolves conflicts by newer updatedAt; replace is offered explicitly with confirmation.</backup_restore>
  <heatmap>Year-strip visualization of the journaling habit; grape intensity; keyboard/hover tooltips; reduced-motion safe.</heatmap>
  <reduced_motion>Applies to tab transitions, save pulse, streak bump, calendar fills.</reduced_motion>
  <future_encryption optional="true">Phase 2: optional passphrase-derived (Web Crypto, PBKDF2 + AES-GCM) at-rest encryption of the stored blob, with an unlock gate — keeps the no-backend model while protecting shared devices.</future_encryption>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Answer today, persist across reload</description>
    <steps>
      1. Visit /ko/tools/qna-a-day with empty storage → onboarding card + Today tab active; today's date + a single question (from questions.json for today's MM-DD) shown.
      2. Type an answer → after ~700ms the status reads "저장됨"; char counter updates.
      3. Reload the page → the same answer is present for today; onboarding no longer shown.
      4. Press Cmd/Ctrl+S → immediate "저장됨" toast.
      5. Clear the answer entirely → entry removed; "삭제됨 · 되돌리기" undo appears; undo restores it.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Calendar navigation, past dates, multi-year reflection</description>
    <steps>
      1. Switch to 달력 → current month grid; today has the brand ring; days are unanswered outlines.
      2. Tap a past date → its question + composer open; write an answer → cell fills grape.
      3. Manually seed a prior-year entry for the same month-day (e.g., last year) → return to 오늘 for that month-day → PastYears shows the prior-year answer "1년 전 오늘".
      4. Heatmap reflects answered days; hovering a cell shows date + question excerpt.
      5. Year switch to a past year shows that year's answered density.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Backup / restore round-trip + durability</description>
    <steps>
      1. With several entries, Settings → 기록 내보내기 → a JSON file downloads; "마지막 백업" updates.
      2. Reset all (double-confirm) → store empty.
      3. 기록 가져오기 → choose the exported file → diff summary shows N entries → 덮어쓰기 → all entries restored exactly (text, dates, timestamps).
      4. Import a malformed JSON → friendly error; existing data unchanged.
      5. Import with overlapping dates using 병합 → conflicts resolve to the newer updatedAt.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>i18n, leap day, local-time correctness</description>
    <steps>
      1. Switch to /en → all UI strings + the day's question render in English; the question for the same date matches questions.json[`MM-DD`].questionEn.
      2. Navigate (Calendar) to Feb 29 in a leap year → the 02-28 question is shown (dataset has no 02-29), with a subtle leap-day note; Feb 29 is only selectable in leap years.
      3. With the OS timezone set behind UTC, near local midnight the "today" question matches the LOCAL calendar date (not the UTC date) — verified by the date engine unit tests and an E2E with a mocked clock.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>SEO + storage-failure resilience</description>
    <steps>
      1. Production build → /ko/tools/qna-a-day and /en/tools/qna-a-day are statically generated with unique title, meta description, canonical, hreflang, OG, SoftwareApplication + FAQPage JSON-LD; how-to + FAQ localized.
      2. Simulate localStorage disabled (private mode) → a persistent warning shows; typing still works in-session; export still produces a file.
      3. Corrupt the stored blob → on load it is quarantined (copied to a corrupt key + download offered), a fresh store starts, nothing is silently wiped.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <date_correctness>CRITICAL: all date keys derive from LOCAL components; unit tests cover timezones behind/ahead of UTC, DST transitions, year boundaries, and leap years — "today" always equals the user's wall-clock date.</date_correctness>
  <durability>CRITICAL: no code path ever silently destroys user entries; corrupt/oversized/invalid data is quarantined or rejected without data loss; export/import round-trips entries byte-faithfully (text, dateKey, timestamps).</durability>
  <question_integrity>CRITICAL: the dataset covers exactly 365 month-day keys (01-01..12-31, no 02-29) with non-empty `question` AND `questionEn`; 02-29 resolves to 02-28; the same date maps to the same question across years and builds; a unit test asserts coverage, uniqueness, and ko/en field presence.</question_integrity>
  <functionality>Today autosave (debounce + blur + Cmd/Ctrl+S); calendar browse/edit any date; multi-year PastYears; searchable journal; streak/completion stats; export/import with merge/replace; reset with double-confirm.</functionality>
  <user_experience>Composer feels instant (&lt; 50ms keystroke latency); save status is clear and unobtrusive; one question in the spotlight; ≥44px primary targets; visible focus; SPA tab switching with no route reload.</user_experience>
  <technical_quality>lib/qna-a-day/* pure-function unit coverage ≥ 80% (date math, streak edge cases, immutable ops, serialize/merge, zod rejection); 0 TS errors; no file &gt; 800 lines; the 365-question dataset is code-split and does NOT inflate the global i18n bundle.</technical_quality>
  <visual_design>DESIGN.md compliant; grape accent used for identity (question bar, ring, streak, calendar fills); brand honey-gold reserved for CTAs; warm, low-chrome journal atmosphere — not a dashboard.</visual_design>
  <accessibility>Full keyboard operation; aria-live save status; labeled calendar buttons; reduced-motion respected; WCAG 2.1 AA contrast.</accessibility>
  <performance>Tool route stays within platform budgets; question dataset dynamically imported (not in global i18n bundle); Today interactive quickly; CLS unaffected (ad height reserved by platform).</performance>
</success_criteria>

<build_output>
  <note>Built as part of the platform (pnpm build). /[locale]/tools/qna-a-day is pre-rendered by the platform's generateStaticParams iterating the registry (status "live"). The question dataset ships as a code-split chunk loaded on this route only.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/types.ts — extend the category union
    export type ToolCategory = 'random' | 'calculator' | 'text' | 'converter' | 'fun' | 'dev' | 'mindset';

    // src/tools/registry.ts — add the entry
    {
      id: 'qna-a-day',
      slug: 'qna-a-day',
      category: 'mindset',
      icon: 'NotebookPen',     // lucide-react
      accent: 'grape',
      status: 'live',          // 'coming_soon' until the module is built
      isNew: true,
      order: 8,
      keywords: ['1일1질문', '하루한질문', '365질문', '질문일기', '자기성찰', '일기', '저널', 'q&a a day', 'daily question', 'journal', 'self reflection', 'one question a day'],
    },
    ```
    Also add a localized category label (messages.categories.mindset = "마음·기록" / "Mindset") and, per DESIGN, treat mindset's identity accent as grape.
  </platform_registry_change>
  <critical_paths>
    1. lib/qna-a-day/date.ts — LOCAL-time date keys first; prove correctness (timezone/DST/leap) before any UI. Everything depends on it.
    2. Durability path — schema.ts + serialization.ts + the useDailyJournal read/quarantine/fallback logic; export/import round-trip.
    3. Question dataset wiring — import 1mnc-questions.json (365 entries) as questions.json; coverage + 02-29→02-28 fallback test.
    4. Composer autosave correctness — debounce + blur + empty-removal + undo, without dropping keystrokes.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/qna-a-day/date.ts + schema.ts + journal.ts + stats.ts + serialization.ts with Vitest (RED→GREEN): local-time keys, leap (02-29→02-28), streak edges, immutable upsert, serialize/deserialize/merge, zod rejection. Inject `now`/RNG-free determinism.
    2. Wire data/questions.json from the provided 1mnc-questions.json (365 entries, ko `question` + en `questionEn`) + coverage/field-presence test.
    3. tools.qna-a-day.* messages (ko/en): tabs, labels, composer, settings, how-to, FAQ.
    4. useDailyJournal hook (localStorage read/quarantine/fallback + debounced write + actions + dataset dynamic import).
    5. TodayPanel + AnswerComposer + PastYears + ProgressChip + onboarding.
    6. CalendarPanel (month grid + year switch + heatmap) reusing AnswerComposer.
    7. JournalPanel (search + year filter) + SettingsPanel (export/import/reset/privacy/reminder).
    8. Keyboard shortcuts; reduced-motion; a11y pass (axe, aria-live, focus).
    9. QnaIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via platform lib/seo.ts.
    10. Registry status → live; platform category 'mindset' wiring; E2E scenarios 1–5.
  </recommended_implementation_order>
  <date_engine_sketch>
    ```typescript
    // src/lib/qna-a-day/date.ts — LOCAL-time, deterministic, no hidden new Date().
    export type DateKey = string;     // "YYYY-MM-DD"
    export type QuestionKey = string; // "MM-DD"

    const pad = (n: number) => String(n).padStart(2, '0');

    // CRITICAL: local components, NOT toISOString() (which is UTC and shifts the day).
    export function toDateKey(d: Date): DateKey {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    export function toQuestionKey(d: Date): QuestionKey {
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // "MM-DD" (matches 1mnc-questions.json)
    }
    export function questionKeyFromDateKey(k: DateKey): QuestionKey {
      return k.slice(5); // "MM-DD"
    }
    // The dataset has 365 days (no 02-29); leap-day reuses the 02-28 question.
    export function resolveQuestionKey(mmdd: QuestionKey): QuestionKey {
      return mmdd === '02-29' ? '02-28' : mmdd;
    }
    export function parseDateKey(k: DateKey): Date {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d); // local midnight
    }
    export function addDays(k: DateKey, delta: number): DateKey {
      const d = parseDateKey(k);
      d.setDate(d.getDate() + delta); // DST-safe via date components
      return toDateKey(d);
    }
    export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    ```
  </date_engine_sketch>
  <streak_sketch>
    ```typescript
    // src/lib/qna-a-day/stats.ts — current streak with a grace day for "today not done yet".
    export function currentStreak(entries: Record<DateKey, unknown>, today: DateKey): number {
      let cursor = today;
      if (!(today in entries)) {
        const yesterday = addDays(today, -1);
        if (!(yesterday in entries)) return 0; // neither today nor yesterday → broken
        cursor = yesterday;
      }
      let n = 0;
      while (cursor in entries) { n++; cursor = addDays(cursor, -1); }
      return n;
    }
    ```
  </streak_sketch>
  <question_dataset>
    - Source of truth: the provided `1mnc-questions.json` in this service directory — 365 records, one per calendar day 01-01..12-31 (no 02-29).
    - Record shape: `{ "date": "MM-DD", "month": number, "day": number, "question": "<ko>", "questionEn": "<en>" }`. Top-level: `{ "generated": "<date>", "total": 365, "questions": [...] }`.
    - Loader picks `question` for ko and `questionEn` for en; 02-29 resolves to 02-28.
    - STABLE CONTRACT once shipped: fix wording freely, but do NOT move a question to a different date (it would break "compare to last year").
    - Samples drawn from the dataset (date · ko · en):
      - 01-01 · "내 삶의 목적은 무엇인가?" · "What is your purpose in life?"
      - 02-14 · "지금 사랑하고 있는가?" · "Are you in love right now?"
      - 02-28 · "마지막으로 아팠던 적은 언제인가?" · "When was the last time you were sick?"  (also used for 02-29)
      - 03-15 · "아무에게도 하고 싶지 않은 이야기가 있는가?" · "What do you not want to talk about?"
      - 06-30 · "딱 하루만 원하는 직업으로 살 수 있다면 무엇을 선택하겠는가?" · "If you could do any job in the world for one day, what would you choose?"
      - 08-15 · "오늘 내 몸 중에서 가장 마음에 드는 곳은?" · "What do you like best about your body today?"
      - 12-25 · "크리스마스로 오행시를 지어보자" · "Make a five line poem using the letters in the word CHRISTMAS"
      - 12-31 · "올 한해 수고한 내 자신에게 하고 싶은 말은?" · "What would you like to tell yourself, as someone gave it their best this year?"
  </question_dataset>
  <store_schema_sketch>
    ```typescript
    // src/lib/qna-a-day/schema.ts
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
      version: z.number().int(),
      entries: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), EntrySchema),
      meta: z.object({
        createdAt: z.number().int().nonnegative(),
        lastBackupAt: z.number().int().nonnegative().optional(),
        reminderDismissedAt: z.number().int().nonnegative().optional(),
      }),
    });
    export type Store = z.infer<typeof StoreSchema>;
    ```
  </store_schema_sketch>
  <performance>The 365-question dataset is dynamically imported on the tool route only, so it never enters the global i18n message bundle that ships site-wide. Server-render the intro/how-to/FAQ where possible; keep the composer + calendar as the only client-interactive surfaces. Debounce writes to avoid localStorage thrash.</performance>
  <testing_strategy>
    - Unit (Vitest, ≥80% on lib/qna-a-day): date local-time correctness (mock timezone offsets + DST), leap (02-29 → 02-28 fallback), neighbors across year boundaries; streak (today-not-done grace, gaps, single day, longest); completion math; immutable upsert/delete + empty-removal; serialize/deserialize round-trip; mergeStores conflict-by-updatedAt; zod rejects malformed import; dataset 365 coverage + ko/en field presence.
    - Component: AnswerComposer autosave/debounce/blur/empty-undo + char cap; calendar answered/today/future states; tab switching; empty states; storage-disabled warning.
    - E2E (Playwright): scenarios 1–5; reload persistence; export→reset→import restore; locale ko/en question swap; mocked clock near local midnight; visual regression 320/768/1024 both themes.
    - A11y: axe + keyboard tab/calendar navigation + aria-live save status + reduced-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
