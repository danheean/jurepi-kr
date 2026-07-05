# 생리 일정 (Period Tracker — Menstrual cycle & ovulation predictor) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **생리 일정 / Period Tracker** (Korean display name: **생리 일정**; English display name: *Period Tracker*) — a client-side tool that predicts upcoming menstrual periods, ovulation day, and the fertile window from a user's last period start date, average cycle length, and period duration, and visualizes them on a calendar. Users may log actual period start dates to refine the average cycle length. 100% client-side and **privacy-first**: all health data stays in the browser (localStorage), nothing is ever sent to the network. Shows a clear medical disclaimer (predictions are estimates, not medical or contraceptive advice). The tool mounts as a client-side SPA on the platform shell.
>
> Internal service codename: `period-tracker`. Registry id: `period-tracker`. Public URL slug: `/[locale]/tools/period-tracker`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same interactive-utility pattern): [`docs/services/converter/lunar-converter/SPEC.md`](../../converter/lunar-converter/SPEC.md)

```xml
<project_specification>

<project_name>생리 일정 (Period Tracker) — Menstrual cycle, ovulation, and fertile-window predictor with a calendar view (Jurepi tool, codename period-tracker, registry id period-tracker)</project_name>

<overview>
생리 일정 (Period Tracker) helps a user anticipate their menstrual cycle. She enters her **last period start date**, her **average cycle length** (default 28 days), and her typical **period duration** (default 5 days); the tool predicts the next several period start dates, the estimated **ovulation day** (~14 days before the next period), and the **fertile window** (roughly 5 days before ovulation through the ovulation day), and paints them all on a month calendar. A prominent "다음 생리까지 D-N" summary answers the most common question at a glance.

Optionally she can **log actual period start dates** over time; from that history the tool computes her real average cycle length (and its variability) and uses it to sharpen predictions. Everything is stored only in the browser.

CRITICAL (privacy — sensitive health data): menstrual data is highly personal. This tool is **100% client-side**: no backend, no database, no account, no network calls of any kind. All input and logs live in `localStorage` on the user's own device and are NEVER transmitted, synced, or shared. The UI states this plainly, and offers a one-click "모든 데이터 삭제" (clear all data) control.

CRITICAL (medical disclaimer — not advice): predictions are statistical estimates based on average cycles and vary person to person. The tool MUST show a clear, always-visible disclaimer: it is **not medical advice, not a diagnostic tool, and not a contraceptive method**. Fertile-window/ovulation estimates must not be relied upon for birth control or conception decisions; consult a healthcare professional. (This also matters for ad-policy compliance — the content is informational, disclaimed, and non-explicit.)

CRITICAL (client-only, SSG): 100% client-side. All prediction math is pure JavaScript date arithmetic on the user's local timezone. The only first-party persistence is localStorage (settings + period logs). Nothing is ever sent over the network.

CRITICAL (usability-first, SPA): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — entering dates, adjusting cycle length, logging a period, navigating months — happens via local React state with NO route navigation and NO full page reload. Enter last period + cycle → see prediction + calendar instantly.
</overview>

<platform_integration>
  - Route: /[locale]/tools/period-tracker (SSG; registry slug "period-tracker", id "period-tracker", status "coming_soon", accent "rose", category "calculator").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons.
  - Consumes: i18n namespace `tools.period-tracker.*` (UI chrome strings: field labels, calendar legend, disclaimer, how-to, FAQ — NOT user data). MUST include top-level `tools.period-tracker.title` and `tools.period-tracker.description` (consumed by dashboard card, footer, searchable-tools index).
  - Platform dependency (category note): lives in the `'calculator'` category (계산기), already active (age-calculator/dday-calculator present). The only platform change is adding ONE ToolMeta registry entry, a slug→component branch in the tool route, and a generateMetadata branch. Single-page interactive utility → NO spoke routes.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **Inputs**: last period start date (date picker, default today), average cycle length (number, 20–45, default 28), period duration (number, 2–10, default 5). "오늘" quick-set for the start date.
    - **Predictions**: next N (default 6) predicted period start dates + their end dates; estimated ovulation day per predicted cycle (next period start − 14); fertile window (ovulation − 5 … ovulation); current cycle day ("주기 N일차"); "다음 생리까지 D-N" and "다음 배란까지 D-N" summaries; late/overdue indication if today is past the predicted date.
    - **Calendar view**: month grid marking period days (rose), predicted period days (rose outline), ovulation day (accent), fertile window (soft tint), today marker. Prev/next month navigation. Legend.
    - **Period logging (optional)**: log actual period start dates; list + delete; from logs compute observed average cycle length + a simple variability note ("주기가 규칙적이에요" / "편차가 커요"), and offer to use the observed average.
    - **Clear data**: one-click "모든 데이터 삭제" with confirm; wipes localStorage for this tool.
    - **Always-visible medical disclaimer** + privacy note ("모든 데이터는 이 기기에만 저장됩니다").
    - **localStorage persistence**: settings + logs, zod-validated, auto-prune invalid, in-memory fallback if unavailable.
    - **Localized UI chrome** (ko/en via tools.period-tracker.*), locale-aware date formatting (useLocale → Intl).
    - **Full keyboard support + a11y**: labeled inputs, calendar keyboard navigation, aria for legend/markers.
    - **Tool-specific SEO long-form** ("생리 주기 계산법" / "배란일·가임기란" / "주기가 불규칙할 때") + FAQ (FAQPage JSON-LD), localized ko/en, with disclaimer.
    - **Reduced-motion fallbacks**; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Accounts, login, cloud sync, cross-device (privacy-first, local only).
    - Symptom/mood/flow tracking, pregnancy mode, medication reminders — Phase 2+ candidates (schema-additive).
    - Push notifications / reminders (no backend; would need service worker — Phase 2).
    - Medical diagnosis, contraception guarantee, or any health advice beyond disclaimed estimates.
    - Deep-link URLs with pre-filled personal dates (privacy — never put health data in URL).
  </out_of_scope>
  <future_considerations>
    - Symptom & flow logging + insights — Phase 2 (schema-additive, still local).
    - Optional local reminder via service worker notifications — Phase 2.
    - Export/import encrypted local backup file — Phase 3.
    - Adaptive prediction (weighted recent cycles, variability bands) — Phase 2.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <date_math>Pure JS Date arithmetic in the user's local timezone (day granularity). Helpers: addDays, diffDays, startOfDay — no external date library (or a tiny local util). Deterministic, unit-tested. Avoid UTC/local off-by-one (normalize to local midnight).</date_math>
    <prediction note="pure domain">predictCycles({lastStart, cycleLen, periodDur, count}): Array<{ start, end, ovulation, fertileStart, fertileEnd }>. observedAverage(logs): { avg, stdevDays, count } from consecutive log gaps. currentCycleDay(today, lastStart, cycleLen). All pure, tested with fixed "today" injection (no hidden Date.now in domain).</prediction>
    <validation>zod v3.x for input ranges (cycleLen 20–45, periodDur 2–10, valid dates) and the localStorage store schema.</validation>
    <localStorage>jurepi-period-tracker key, zod-validated, auto-prune invalid on load, in-memory session fallback if unavailable. Clear-all wipes the key.</localStorage>
    <i18n_dates>Locale-aware formatting via useLocale() → Intl.DateTimeFormat / toLocaleDateString; NEVER pass i18n message keys to Intl. No hardcoded Korean date words in components.</i18n_dates>
    <animation>Native CSS transitions only (calendar month fade, marker pop). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod (in repo) — input + store validation.</zod>
    <no_date_lib>Prefer a tiny local date util over a dependency (day-level math only).</no_date_lib>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/period-tracker/                        # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                              # zod: SettingsSchema (cycleLen/periodDur/lastStart), LogSchema, StoreSchema + STORE_VERSION
│   ├── date-util.ts                           # addDays/diffDays/startOfDay (local tz, off-by-one safe)
│   ├── predict.ts                             # predictCycles, ovulation/fertile-window derivation, currentCycleDay, daysUntil
│   ├── observed.ts                            # observedAverage(logs): avg + stdev + variability label; sort/dedupe logs
│   └── store.ts                               # Immutable ops: upsertLog, removeLog, pruneInvalid, serialize/deserialize
├── components/tools/period-tracker/
│   ├── PeriodTracker.tsx                      # Orchestrator (Client Component) — settings/logs state + usePeriodTracker() owner
│   ├── usePeriodTracker.ts                    # Hook: localStorage settings/logs + derived predictions (pure predict())
│   ├── CycleInputs.tsx                        # last-start date picker + cycle length + period duration (labeled)
│   ├── PredictionSummary.tsx                  # "다음 생리까지 D-N", ovulation, current cycle day cards
│   ├── CycleCalendar.tsx                      # Month grid: period/predicted/ovulation/fertile/today markers + legend + prev/next
│   ├── PeriodLog.tsx                          # Log actual starts, list/delete, observed average + "use this" action
│   ├── DisclaimerNote.tsx                     # Always-visible medical + privacy disclaimer
│   ├── ClearDataButton.tsx                    # Confirm → wipe localStorage
│   ├── PeriodTrackerIntro.tsx                 # H1 + lead (SEO; gate-free SSR)
│   ├── PeriodTrackerHowTo.tsx                 # "주기 계산법" / "배란·가임기" / "불규칙할 때" (SEO long-form, gate-free SSR)
│   └── PeriodTrackerFaq.tsx                   # Q&A + FAQPage JSON-LD (visible faq.items, Faq single owner)
└── i18n/messages/{ko,en}.json                # tools.period-tracker.* UI chrome (top-level title/description, labels, legend, disclaimer, how-to, FAQ)
</file_structure>

<core_data_entities>
  <settings note="React state + persisted">
    - lastStart: ISO date (yyyy-mm-dd, local) — last period start
    - cycleLen: number (20–45, default 28)
    - periodDur: number (2–10, default 5)
    INVARIANT: ranges enforced by zod; invalid → clamp or reject with inline message.
  </settings>
  <period_log note="one logged actual start">
    - date: ISO date (yyyy-mm-dd) — actual period start
    - id: string
    INVARIANT: unique dates, sorted; dedupe on insert.
  </period_log>
  <predicted_cycle note="derived, not persisted">
    - start, end: ISO date — predicted period window
    - ovulation: ISO date — start(next) − 14
    - fertileStart, fertileEnd: ISO date — ovulation−5 … ovulation
  </predicted_cycle>
  <store note="single localStorage blob">
    - version: number (STORE_VERSION)
    - settings: Settings
    - logs: PeriodLog[]
    - meta: { createdAt: number }
    localStorage key: `jurepi-period-tracker`
    INVARIANT: zod-parsed on read; fail → fresh (no throw). Invalid logs pruned.
  </store>
  <constants>
    - DEFAULT_CYCLE = 28; DEFAULT_DURATION = 5; PREDICT_COUNT = 6; LUTEAL_DAYS = 14 (ovulation offset); FERTILE_PRE = 5; CYCLE_MIN = 20; CYCLE_MAX = 45; DUR_MIN = 2; DUR_MAX = 10.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/period-tracker" page="PeriodTracker (SPA, single page)" />
  </public_routes>
  <note>Single interactive utility — NO spoke routes. locale ∈ {ko, en}. Platform generateStaticParams SSGs the route for both locales.</note>
</route_definitions>

<component_hierarchy>
  <period_tracker>                 <!-- "use client"; owns settings + logs + usePeriodTracker() -->
    <period_tracker_intro />       <!-- H1 + lead (SEO; gate-free SSR) -->
    <disclaimer_note />            <!-- always visible: medical + privacy -->
    <workspace>
      <cycle_inputs />             <!-- last start, cycle length, period duration -->
      <prediction_summary />       <!-- D-N to next period/ovulation, current cycle day -->
      <cycle_calendar />           <!-- month grid + legend + nav -->
      <period_log />               <!-- log actual starts, observed average -->
      <clear_data_button />        <!-- wipe local data -->
    </workspace>
    <period_tracker_how_to />      <!-- SEO long-form (gate-free SSR) -->
    <period_tracker_faq />         <!-- FAQPage JSON-LD (single owner) -->
    <structured_data />            <!-- SoftwareApplication (tool meta), gate-free -->
  </period_tracker>
  <note>SEO sections + disclaimer render OUTSIDE any `mounted` gate so prerendered HTML carries them. Date/localStorage-dependent parts (predictions using local today) may gate to avoid hydration mismatch, but the disclaimer, intro, how-to, FAQ, and JSON-LD are always in prerender.</note>
</component_hierarchy>

<pages_and_interfaces>
  <period_tracker_intro>
    - Eyebrow: "건강 계산기" / "HEALTH CALCULATOR". H1: "생리 일정" / "Period Tracker" — Gmarket Sans clamp(28–40px)/700.
    - Lead: "마지막 생리 시작일과 평균 주기를 입력하면 다음 생리·배란일·가임기를 예측해 드려요. 모든 데이터는 이 기기에만 저장됩니다." / English equivalent.
  </period_tracker_intro>
  <disclaimer_note>
    - Persistent callout (info/rose tint): "예측은 평균에 기반한 추정치이며 의학적 조언·피임 수단이 아닙니다. 정확한 상담은 전문의와 하세요." / English. + privacy line. role note, not dismissible (or dismissible-but-remembered is fine, but present by default).
  </disclaimer_note>
  <cycle_inputs>
    - Date picker (last start, default today, "오늘" button), cycle length stepper (20–45), period duration stepper (2–10). All labeled (getByLabelText). Inline validation on out-of-range.
  </cycle_inputs>
  <prediction_summary>
    - Cards: "다음 생리까지 D-N" (large), next period date range, "배란 예상일" + "가임기" range, "현재 주기 N일차". Overdue state if today > predicted next start ("예정일 N일 지남").
  </prediction_summary>
  <cycle_calendar>
    - Month grid (Sun–Sat or locale-aware). Markers: logged/predicted period days (rose fill / rose outline), ovulation day (accent dot), fertile window (soft tint band), today (ring). Legend below. Prev/next month buttons; keyboard arrow navigation across days; aria-label per day describing its state. No horizontal overflow at 320px.
  </cycle_calendar>
  <period_log>
    - Add actual start date; list (most recent first) with delete; shows observed average cycle ("관측 평균 주기 N일 · 편차 ±M일") + variability label; "이 값을 평균 주기로 사용" action updates settings.cycleLen.
  </period_log>
  <clear_data_button>
    - "모든 데이터 삭제" → confirm dialog (non-blocking, in-app) → wipe localStorage + reset to defaults + toast.
  </clear_data_button>
  <keyboard_shortcuts_reference>
    - Tab through inputs; calendar arrows move day focus; PageUp/PageDown month; Esc closes confirm.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <predict>predictCycles({lastStart, cycleLen, periodDur, count}): for i in 1..count → start_i = lastStart + i*cycleLen; end_i = start_i + (periodDur−1); ovulation_i = start_i − LUTEAL_DAYS (relative to that cycle's start, i.e. next start − 14); fertile = [ovulation_i − FERTILE_PRE, ovulation_i]. Pure; "today" injected for currentCycleDay/daysUntil (no Date.now in domain).</predict>
  <observed>observedAverage(logs): sort unique, diff consecutive → gaps; avg + sample stdev + count; variability label thresholds (e.g., stdev ≤ 3 규칙적 / ≤ 7 보통 / else 편차 큼). Pure.</observed>
  <persistence_adapter usePeriodTracker>
    - Mount: read store → zod → pruneInvalid → state; fail → fresh. Absent localStorage → in-memory. Derive predictions with local today.
    - Change: debounced JSON.stringify → setItem; catch quota/security → in-memory.
    - Expose: settings + setters, logs + add/remove, predictions, observed, clearAll.
  </persistence_adapter>
  <i18n>All UI chrome from tools.period-tracker.* (ko/en): top-level title/description, labels, legend, disclaimer, how-to, FAQ. Dates formatted via useLocale()→Intl (never i18n keys into Intl). Assert no Korean leakage in EN render.</i18n>
</core_functionality>

<error_handling>
  <invalid_input>Out-of-range cycle/duration → inline message + clamp; invalid date → neutral, no crash.</invalid_input>
  <storage><unavailable>Private mode → in-memory, tool fully works.</unavailable><corrupt_blob>zod fail → fresh start (no throw); invalid logs pruned.</corrupt_blob></storage>
  <timezone>Normalize to local midnight to avoid off-by-one; unit-tested across DST-ish boundaries with injected dates.</timezone>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No network calls; no API surface. Health data never leaves the browser.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of tokens.</source>
  <accent_usage>Per-tool identity accent is ROSE (var(--accent-rose)/-soft): period markers, D-day headline, intro tile. Ovulation uses a distinct accent (e.g., var(--accent-grape)); fertile window a soft tint. CTAs brand honey-gold var(--brand). Disclaimer uses info/rose calm tint. Real tokens only.</accent_usage>
  <surfaces>Cards/calendar = var(--surface) + 1px var(--hairline), radius --radius-xxl. Calendar cells surface-muted; markers tinted.</surfaces>
  <typography>H1 Gmarket Sans (28–40px). D-day headline large/700. Labels 14px text-secondary. Legend 12px.</typography>
  <motion>transform/opacity only: month fade 150ms, marker pop. prefers-reduced-motion gated.</motion>
  <accessibility>Labeled inputs (getByLabelText); calendar day aria-label describes state; legend associated; D-day aria-live; ≥44px targets; focus-visible ring; marker states not by color alone (add shape/label). WCAG 2.1 AA.</accessibility>
  <responsive>Calendar full width; single column <768px; no horizontal overflow at 320px (cells shrink, legend wraps).</responsive>
  <atmosphere>Calm, private, reassuring "health companion": soft rose, gentle calendar, clear disclaimer. Trust and discretion first.</atmosphere>
  <icons>lucide-react: CalendarHeart or Droplet (registry card icon), Calendar, Egg/Sparkles (ovulation), Trash2 (clear), Info (disclaimer). Default 20px, stroke 1.75. Registry card icon: `CalendarHeart` (fallback `Droplet`).</icons>
</aesthetic_guidelines>

<security_considerations>
  <privacy note="CRITICAL — sensitive health data">All data localStorage-only, NEVER sent to network, no analytics event includes cycle dates/logs. Clear-all control. UI states local-only storage plainly.</privacy>
  <input>Dates/numbers render as text nodes (React escape); zod-validated ranges. No dangerouslySetInnerHTML.</input>
  <medical>Prominent, always-visible disclaimer (not medical/contraceptive advice) — also supports ad-policy compliance (informational, disclaimed, non-explicit).</medical>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <observed_average>Refine predictions from logged real cycles (avg + variability) — personalized without any server.</observed_average>
  <calendar_viz>At-a-glance month view of period/ovulation/fertile window — the core value.</calendar_viz>
  <privacy_first>Local-only + one-click wipe — a differentiator vs app-store trackers that upload data.</privacy_first>
  <structured_data>SoftwareApplication + FAQPage JSON-LD (gate-free prerender) for "생리 주기 계산 / 배란일 계산기" discoverability (DESIGN principle ③), with disclaimer in content.</structured_data>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1><description>Basic prediction + calendar</description><steps>
    1. lastStart=2026-07-01, cycle=28, duration=5 → next start 2026-07-29, ovulation 2026-07-15, fertile 07-10…07-15; "다음 생리까지 D-N" correct vs injected today.
    2. Calendar marks period days (07-01…07-05), predicted (07-29…), ovulation, fertile window; legend visible.
  </steps></test_scenario_1>
  <test_scenario_2><description>Logging + observed average</description><steps>
    1. Log starts 06-03, 07-01 (28d gap) and 05-05 (29d) → observed avg ≈ 28–29, variability "규칙적"; "use this" sets cycleLen.
    2. Delete a log → recompute; dedupe same-date add.
  </steps></test_scenario_2>
  <test_scenario_3><description>Overdue + edge</description><steps>
    1. Injected today past predicted next start → "예정일 N일 지남" state.
    2. cycle=20 min / 45 max clamp; duration bounds; invalid date neutral.
  </steps></test_scenario_3>
  <test_scenario_4><description>Privacy + clear data</description><steps>
    1. Reload → settings/logs persist (localStorage). Private mode → in-memory, still works.
    2. "모든 데이터 삭제" → confirm → wiped, defaults restored; no network request ever made (verify).
  </steps></test_scenario_4>
  <test_scenario_5><description>i18n, disclaimer, a11y, SEO</description><steps>
    1. /en → all chrome English incl. disclaimer; dates locale-formatted; NO Korean leakage; prerendered HTML has disclaimer + SoftwareApplication + exactly one FAQPage.
    2. Calendar keyboard nav; labeled inputs; axe pass; 320px no overflow.
  </steps></test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Predict next N periods + ovulation + fertile window from last start/cycle/duration; calendar visualization; optional logging → observed average + variability; D-day summaries; clear-all.</functionality>
  <privacy>CRITICAL: 100% local, zero network, sensitive data never transmitted; explicit local-only messaging + wipe control.</privacy>
  <medical_safety>Always-visible disclaimer (not medical/contraceptive advice); estimates framed as such.</medical_safety>
  <user_experience>Instant prediction; calendar readable at 320px; SPA — no route reload; locale-aware dates; calm/discreet design.</user_experience>
  <technical_quality>lib/period-tracker/* pure ≥90% (predict/observed/date-util/store, injected-today fixtures, off-by-one/timezone, dedupe); TS 0 errors; <800 lines/file; no innerHTML.</technical_quality>
  <visual_design>DESIGN.md compliant; rose identity + distinct ovulation accent; markers not color-only; real tokens only.</visual_design>
  <accessibility>Labeled inputs; calendar keyboard nav + aria; D-day aria-live; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Within calculator budget; CLS unaffected; LCP < 2.5s.</performance>
  <seo_geo>Unique canonical/hreflang; SoftwareApplication + FAQPage JSON-LD (single Faq owner) in gate-free prerender; SSR long-form (cycle/ovulation explainer with disclaimer); llms.txt; sitemap auto-includes hub (single page — no spokes).</seo_geo>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/period-tracker pre-rendered by generateStaticParams iterating registry (status "coming_soon" initially, "live" on launch). Single-page utility — no generated content, no spokes.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — 'calculator' category active; 'rose' per-tool accent.
    {
      id: 'period-tracker',
      slug: 'period-tracker',
      category: 'calculator',
      icon: 'CalendarHeart',
      accent: 'rose',
      status: 'coming_soon',   // 'live' when complete
      isNew: true,
      order: 32,
      keywords: ['생리','생리일정','생리주기','배란일','가임기','월경','주기계산','period','menstrual','cycle','ovulation','fertile','tracker','calendar'],
    },
    ```
    Add slug→component branch (<PeriodTracker/>) + generateMetadata branch. NO spoke route.
  </platform_registry_change>
  <sitemap_integration note="automatic">Single-page tool — hub URL added automatically from registry (getLiveTools) with ko/en hreflang. No collection block/spoke loop. Confirm sitemap.test.ts hub count once live.</sitemap_integration>
  <critical_paths>1. Pure date math (off-by-one/timezone safe, injected today). 2. predict/observed correctness. 3. Privacy (no network, clear-all). 4. i18n date formatting (Intl via useLocale), no Korean leakage in EN; top-level title/description present.</critical_paths>
  <recommended_implementation_order>
    1. lib/period-tracker/{schema,date-util,predict,observed,store}.ts Vitest (RED→GREEN): date math, predictCycles (fixtures with injected today), observedAverage (avg/stdev/variability), store immutable ops + dedupe/prune.
    2. tools.period-tracker.* messages (ko/en): top-level title/description, labels, legend, disclaimer, how-to, FAQ.
    3. usePeriodTracker hook (localStorage settings/logs, derived predictions, in-memory fallback).
    4. CycleInputs + PredictionSummary + DisclaimerNote.
    5. CycleCalendar (markers, legend, keyboard nav, 320px).
    6. PeriodLog (observed average, use-this) + ClearDataButton (confirm/wipe).
    7. a11y (axe, labeled inputs, calendar aria, D-day aria-live), motion-reduce.
    8. Intro/HowTo/Faq + SoftwareApplication + FAQPage(Faq owner) JSON-LD (gate-free SSR) via lib/seo.ts.
    9. Registry status→coming_soon (→live on launch); route + generateMetadata; E2E 1–5; visual regression 320/768/1024 both themes + locales.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥90% (predict/observed/date-util/store) with injected today, timezone/off-by-one, dedupe/prune fixtures; component tests with real message catalog + getByLabelText; E2E 1–5 incl. no-network assertion + clear-all; localStorage jsdom-isolated; both locales (assert `/[가-힣]/` absent in EN chrome).</testing_strategy>
</key_implementation_notes>

</project_specification>
```
