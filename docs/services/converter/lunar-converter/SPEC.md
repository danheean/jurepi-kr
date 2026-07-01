# Lunar–Solar Calendar Converter — Bilingual Gregorian ↔ Korean Lunar Conversion Tool — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Lunar–Solar Calendar Converter** (음력/양력 변환기) — a client-side Single-Page Application offering two-way conversion between the Gregorian (solar) calendar and the Korean lunar calendar, with sexagenary cycle (간지 / 60갑자) display, zodiac animal labeling, and localStorage history tracking. Conversion data is bundled at build time from a curated KASI-derived table (1391–2050 range); all computation is client-side with NO backend or network calls.
> Internal service codename: `lunar-converter`. Registry id: `lunar-converter`. Public URL slug: `/[locale]/tools/lunar-converter`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>Lunar–Solar Calendar Converter (Jurepi tool, registry id lunar-converter)</project_name>

<overview>
The Lunar–Solar Calendar Converter bridges two calendars in daily use across Korea, East Asia, and diaspora: the solar (Gregorian) calendar used in modern business, and the lunar (lunisolar) calendar rooted in tradition, astrology, and cultural holidays. A visitor enters a date in either system and sees the equivalent in the other, along with rich metadata: the sexagenary cycle (간지 — a 60-year repeating pattern of 10 heavenly stems and 12 earthly branches), the zodiac animal (띠 — rat, ox, tiger, etc., derived from the earthly branch), and a note if it's a leap month (윤달, inserted 7 times per 19-year Metonic cycle).

The tool is split into two input sections: one for the solar date (year/month/day dropdowns), and one for the lunar date (with leap-month toggle). Toggle between them by selecting a date; the conversion updates instantly. A "Today" button shows both systems' current date. Recent conversions (last 10, keyed by serialized date) live in localStorage for quick re-access. Sexagenary and zodiac are displayed as inline labels (e.g., "2024 — 甲辰년(용띠)").

CRITICAL: The conversion data is **finite and explicitly bounded** — KASI (Korea Astronomy and Space Science Institute) data covers **1391 CE to 2050 CE only**. Any date outside this range triggers a friendly error ("지원하지 않는 년도입니다: 3000년" / "Year not supported: 3000 CE"). The table is baked into the bundle at build time; the tool queries it in microseconds and never calls a network API.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no network calls except for static bundle assets. The only first-party persistence is `localStorage` (recent conversions), and nothing is sent upstream.

CRITICAL (i18n locale binding): Do NOT pass i18n translation keys to Intl APIs. Locale must come from `useLocale()` returning BCP-47 code ("ko" or "en"), then passed to `Intl.DateTimeFormat(locale, options)` or equivalent. This lesson comes from Q&A a Day: passing a translation key to Intl throws RangeError and was silent in tests but caught by visual inspection. Always source locale from `useLocale()`, never from messages.
</overview>

<platform_integration>
  - Route: /[locale]/tools/lunar-converter (SSG; registry slug "lunar-converter", id "lunar-converter", status "live", accent "grape", category "converter").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.lunar-converter.*` (UI chrome strings: labels, buttons, errors, how-to, FAQ — NOT conversion data; that comes from the build-time lunar table).
  - Platform dependency (SMALL — NO new category or accent needed): the `'converter'` category already exists in `ToolCategory` with the `sky` accent. This tool's suggested accent is `grape` (warm amber-gold, suitable for date/time/cultural identity per DESIGN.md). The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Two-way conversion: solar (Gregorian) ↔ lunar (Korean KASI lunisolar).
    - Input UI: year/month/day dropdowns for both calendar systems, leap-month toggle for lunar, "Today" button.
    - Rich metadata: sexagenary cycle (간지 name + hanja glyph), zodiac animal (띠 name + emoji), leap-month indicator (윤달).
    - Conversion range: 1391 CE – 2050 CE (KASI official tables). Out-of-range friendly error with clear message.
    - Recent conversions: localStorage (last 10), keyed by a canonical date serialization (YYYY-MM-DD format). Prune unknown/malformed entries on load.
    - Copy-to-clipboard: lunar date string, solar date string, both together.
    - "Today" current-date display in both calendars (via JavaScript local time, no network call).
    - Tool-specific SEO long-form (why lunar calendars, sexagenary, Korean culture) + FAQ (FAQPage JSON-LD) + breadcrumb.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Other lunar calendars (Chinese, Vietnamese, Buddhist) — MVP is Korean KASI only.
    - Lunar birthday reminders / notification integrations (future).
    - Backend APIs or cross-device sync (all client localStorage only).
    - Detailed astrological interpretation (Four Pillars / Saju) — tool is calendar conversion, not divination.
  </out_of_scope>
  <future_considerations>
    - Dark-theme sexagenary glyph color contrast tweaks (Phase 2).
    - Lunar birthday tracking with auto-reminder on current-day lunar anniversary (Phase 2).
    - Export conversions as .ics calendar file (Phase 2).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <lunar_data>Conversion table sourced from KASI (Korea Astronomy and Space Science Institute) public lunar calendar data (1391–2050). Table is a static TypeScript module `src/lib/lunar-converter/lunar-table.ts` generated once at build time via a script that parses KASI source, validates, and emits typed records. Runtime has NO network access to this data; it's all bundled.</lunar_data>
    <sexagenary>The 60-year sexagenary cycle (10 stems × 12 branches) is computed from lunar year modulo 60; mapping to hanja glyphs and English names is a pure, tinydata lookup table.</sexagenary>
    <zodiac>The 12-animal zodiac (rat/ox/tiger/…) derives from the lunar year's earthly branch; emoji are rendered inline (🐭🐂🐅…).</zodiac>
    <date_arithmetic>Pure JS Date arithmetic for solar dates; lunar conversion delegates to the build-time KASI table (no algorithmic computation, lookup-based).</date_arithmetic>
    <clipboard>navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail (copy is secondary; no false success toast).</clipboard>
    <animation>Native CSS transitions only (dropdown focus, copy success fade). No animation library.</animation>
    <validation>zod v3.x for localStorage parsing (recent-conversions), build-time KASI table schema.</validation>
  </module_specific>
  <libraries>
    <korean_lunar_calendar>Candidate: `korean-lunar-calendar` npm package (if found mature + MIT licensed). Fallback: inline build-time generation from KASI CSV/JSON source (preferred for full control and transparency). Version TBD post-research.</korean_lunar_calendar>
    <zod>zod v3.x — already in repo; reused for localStorage schema + date-record validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/lunar-converter/
│   ├── lunar-table.ts                  # Type: LunarTableRecord[]. Build-time data (1391–2050 range).
│   ├── conversion.ts                   # Pure domain: solarToLunar(year,month,day), lunarToSolar, validate date range, error messages.
│   ├── sexagenary.ts                   # Pure: 60-cycle lookup; name + hanja for any year.
│   ├── zodiac.ts                       # Pure: 12-animal mapping from earthly branch; name + emoji.
│   ├── schema.ts                       # zod: Recent (localStorage model), ConversionResult, DateRecord.
│   └── recents.ts                      # Immutable ops: addRecent, getRecents, prune on load.
├── components/tools/lunar-converter/
│   ├── LunarConverter.tsx               # Orchestrator (Client Component) — owns solar/lunar state + useConverter() hook.
│   ├── useConverter.ts                  # Hook: dynamic table import + localStorage recents + derived conversion + copy adapter.
│   ├── SolarInput.tsx                   # Solar year/month/day dropdowns (auto-range based on table bounds).
│   ├── LunarInput.tsx                   # Lunar year/month/day dropdowns + leap-month toggle.
│   ├── ConversionResult.tsx             # Displays the converted date with sexagenary/zodiac/leap label.
│   ├── TodayButton.tsx                  # "오늘 조회" / "Today" button.
│   ├── RecentsList.tsx                  # Accordion or inline list of recent conversions (click to load).
│   ├── LunarConverterIntro.tsx           # H1 + lead (SEO; server-render where possible).
│   ├── LunarConverterHowTo.tsx           # "Why lunar calendar?" / "Sexagenary explained" (SEO long-form).
│   ├── LunarConverterFaq.tsx             # Q&A + FAQPage JSON-LD.
│   └── ErrorMessage.tsx                 # Out-of-range / invalid date (friendly error in toast).
├── i18n/messages/{ko,en}.json           # tools.lunar-converter.* UI chrome (input labels, button, errors, how-to, FAQ).
└── [locale]/tools/lunar-converter/
    └── page.tsx                         # SSG route; mounts LunarConverter; generateMetadata branch.
</file_structure>

<core_data_entities>
  <lunar_table_record note="build-time artifact per KASI">
    - solarYear, solarMonth, solarDay: solar (Gregorian) date as anchor.
    - lunarYear, lunarMonth, isLeapMonth, lunarDay: corresponding lunar date.
    - INVARIANT: every solar date 1391–2050 maps to exactly one lunar date; leap months are flagged.
  </lunar_table_record>
  <conversion_result note="runtime computed result">
    - inputDate: { calendar: 'solar' | 'lunar'; year, month, day, isLeapMonth? }
    - outputDate: { calendar: 'solar' | 'lunar'; year, month, day, isLeapMonth? }
    - sexagenary: { name: string (e.g. "갑진"); hanja: string (e.g. "甲辰"); english: string (e.g. "Metal Dragon") }
    - zodiac: { name: string (e.g. "용"); emoji: string ("🐉"); english: string ("Dragon") }
    - error?: string (if out-of-range)
  </conversion_result>
  <recents_store note="single localStorage blob, pruned on load">
    - version: number (STORE_VERSION = 1)
    - entries: { solarDate: "YYYY-MM-DD", lunarDate: "YYYY-MM-DD(윤)", ts: number }[] (max 10, MRU first)
    localStorage key: `jurepi-lunar-converter`
    INVARIANT: read is zod-parsed; fail → start fresh. Dates outside current table bounds are pruned on load.
  </recents_store>
  <constants>
    - TABLE_YEAR_MIN = 1391, TABLE_YEAR_MAX = 2050
    - RECENTS_MAX = 10
    - SEXAGENARY_CYCLE = 60
    - ZODIAC_ANIMALS = 12 (rat–pig)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/lunar-converter" page="LunarConverter (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route, locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <lunar_converter>              <!-- "use client"; owns solar/lunar state + useConverter() owner -->
    <lunar_converter_intro />    <!-- H1 + lead (server-render where possible) -->
    <converter_layout>           <!-- Desktop 2-section (inputs | result), mobile stacked -->
      <input_panel>             <!-- Left/top -->
        <solar_input />         <!-- Year/month/day dropdowns, solar -->
        <lunar_input />         <!-- Year/month/day dropdowns + leap toggle, lunar -->
        <today_button />        <!-- "오늘 조회" / "Today" -->
      </input_panel>
      <result_panel>            <!-- Right/bottom, sticky on desktop -->
        <conversion_result />   <!-- Both dates + sexagenary + zodiac + copy buttons -->
        <error_message />       <!-- Out-of-range friendly error -->
        <recents_list />        <!-- Click to load a recent conversion -->
      </result_panel>
    </converter_layout>
    <lunar_converter_how_to />   <!-- SEO long-form -->
    <lunar_converter_faq />      <!-- FAQPage JSON-LD -->
  </lunar_converter>
  <note>SPA within tool: input change = local state update → conversion (instant), NOT route navigation. Result panel docked (desktop) or below (mobile).</note>
</component_hierarchy>

<pages_and_interfaces>
  <converter_intro>
    - Eyebrow: "변환 도구" / "CONVERTER TOOL" — 12px/700/0.6px, var(--text-muted).
    - H1: "음력·양력 변환기" / "Lunar–Solar Calendar Converter" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: one sentence, body-lg 18px var(--text-secondary): "음력과 양력의 날짜를 쉽게 변환하고, 60갑자와 띠를 한눈에 확인해 보세요." / English equivalent.
  </converter_intro>

  <solar_input>
    - Three aligned dropdowns (연 / 월 / 일 or Year / Month / Day).
    - Year 1391–2050 (KASI bounds). Month 1–12. Day 1–31 (validated per month).
    - Labels & ARIA: "solar year", "solar month", "solar day"; aria-label per control.
    - On change → call conversion; display result.
  </solar_input>

  <lunar_input>
    - Three dropdowns (연 / 월 / 일 or Year / Month / Day) + toggle "윤달" / "Leap month".
    - Year 1391–2050. Month 1–12. Day 1–29/30 (varies per year+month KASI table).
    - Leap toggle is a checkbox-style button (aria-pressed); affects month label dynamically.
    - On change → conversion; validate day range against selected year+month±leap.
  </lunar_input>

  <today_button>
    - Prominent pill button, 44px, brand honey-gold background, on-brand text, "오늘 조회" / "Today".
    - On click → set both inputs to today's solar + computed lunar equivalents.
    - Uses JS local date (no network call); locale aware via `useLocale()` for display labels.
  </today_button>

  <conversion_result>
    - Two-column display (desktop) or stacked (mobile).
    - Left: Solar date formatted per locale (e.g., "2024년 3월 15일" or "Friday, March 15, 2024").
    - Right: Lunar date + leap indicator (e.g., "2024년 윤2월 6일").
    - Below: Sexagenary (e.g., "甲辰년" + "(Metal Dragon)") and Zodiac (e.g., "용띠" + "🐉" + "(Dragon)").
    - Copy buttons: "복사 (태양력)" / "Copy (Solar)", "복사 (음력)" / "Copy (Lunar)", "복사 (전체)" / "Copy both".
    - Success toast "복사했습니다!" on copy; silent fail if clipboard unavailable.
  </conversion_result>

  <recents_list>
    - Accordion or inline history: "최근 조회" / "Recent conversions" header.
    - Each entry: solar date → lunar date, clickable to reload into inputs.
    - Empty state: "최근 조회 기록이 없습니다." / "No recent conversions."
    - Max 10 entries (MRU first).
  </recents_list>

  <keyboard_shortcuts>
    - Tab navigation through inputs and buttons.
    - Enter on year/month/day dropdowns updates conversion.
    - Visible focus-visible rings on all controls.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <build_time_table>
    - At `npm run build` (or `pnpm build`), a script `scripts/generate-lunar-table.mjs` (or `generate-lunar-table.ts`) scans a KASI source (CSV or JSON), validates (no gaps, all pairs present), and emits `src/lib/lunar-converter/lunar-table.ts` as a TS array of LunarTableRecord. Table is fully deterministic (no Date/random).
  </build_time_table>
  <conversion_logic>
    - solarToLunar(year, month, day): lookup solar date in table → return lunar equiv + compute sexagenary/zodiac.
    - lunarToSolar(year, month, day, isLeapMonth): lookup lunar date in table → return solar equiv + compute sexagenary/zodiac.
    - validateRange(year): if year < 1391 or year > 2050, return error message.
    - validateLunarMonth(year, month): true if month exists in that lunar year; false if leap month not present.
  </conversion_logic>
  <sexagenary_zodiac>
    - computeSexagenary(year): year % 60 → (stem index, branch index) → lookup name + hanja + English.
    - computeZodiac(year): year % 12 (or branch index % 12) → lookup name + emoji + English.
  </sexagenary_zodiac>
  <persistence_adapter>
    - Mount: read `jurepi-lunar-converter` → zod parse → pruneUnknown → state. Fail → start fresh (no throw).
    - Change (on convert): addRecent(date, MAX=10) → JSON.stringify → setItem. Catch quota/security → keep in-memory.
    - Expose: getRecents(), addRecent(solar, lunar), copy(text).
  </persistence_adapter>
  <i18n>
    - All UI chrome from tools.lunar-converter.* (ko/en): labels, buttons, months, zodiac names, how-to, FAQ.
    - Locale sourced from `useLocale()` (BCP-47 "ko"/"en"), passed to Intl APIs (DateTimeFormat, etc.).
    - Sexagenary hanja + zodiac emoji are locale-agnostic.
  </i18n>
</core_functionality>

<error_handling>
  <out_of_range>
    - Year < 1391 or > 2050 → toast "지원하지 않는 년도입니다 (1391–2050)." / "Year not supported (1391–2050)."
  </out_of_range>
  <invalid_lunar_month>
    - Leap month selected but does not exist in chosen year → toast "선택한 연도에 윤달이 없습니다." / "No leap month in selected year."
  </invalid_lunar_month>
  <invalid_lunar_day>
    - Day 30 selected but month has 29 days → auto-clamp to 29 or show error.
  </invalid_lunar_day>
  <clipboard_fail>
    - Copy fails → silent (no error toast; copy is secondary feature).
  </clipboard_fail>
  <storage>
    - localStorage unavailable / disabled → recents kept in-memory; list/input/conversion all work normally.
    - corrupt blob → start fresh.
  </storage>
  <error_boundary>
    - Platform wraps tool; render fail → retry without shell crash.
  </error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Tool accent is `grape` (warm honey-gold #e0912b / #fbe8cb soft). Below is tool-specific.</source>
  <accent_usage>
    - Category accent is GRAPE (var(--accent-grape) / var(--accent-grape-soft)) — date/time/cultural identity per DESIGN. Input icons, "Today" button tint, sexagenary/zodiac labels.
    - CTAs (primary buttons) stay brand honey-gold var(--brand) (copy buttons). Accent = identity, not action.
  </accent_usage>
  <layout>
    - Desktop (≥1024px): 2-column layout — inputs left (sticky), result right (sticky).
    - Tablet (768–1023px): inputs top, result below, both full-width cards.
    - Mobile (<768px): single column, stacked; result scrolls into view.
  </layout>
  <typography>H1 Gmarket Sans clamp(28–40px); input labels Pretendard 15px/600; sexagenary/zodiac display body 16px/500 with hanja/emoji inline.</typography>
  <motion>Transitions on dropdown focus (150ms), copy success fade (200ms), all gated by prefers-reduced-motion (instant, no transition).</motion>
  <accessibility>Inputs labeled via aria-label; buttons real; keyboard operable (tab, enter); visible focus-visible ring var(--focus-ring); ≥44px tap targets.</accessibility>
  <responsive>
    - ≥1024px: 2-split, inputs 40% left, result 60% right.
    - 768–1023px: inputs top full-width, result full-width below.
    - <768px: single column; scrollable.
  </responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>Dropdown selections are bounded (year 1391–2050, month 1–12); user cannot input arbitrary strings. All user input is validated server-side during build (KASI table validation) and client-side (range checks). No user-generated content is rendered via dangerouslySetInnerHTML.</input>
  <clipboard>User-initiated copy only (lunar/solar date strings); never read clipboard; user-gesture handler only.</clipboard>
  <privacy>Recents localStorage-only, never sent. No analytics event includes dates. Conversion is deterministic, no randomness.</privacy>
  <data_integrity>Table is build-time static asset (no remote fetch); unit tests validate derivation, completeness, range so no malformed entry ships.</data_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>Basic conversion: solar → lunar and lunar → solar</description>
    <steps>
      1. Set solar date to 2024-03-15 → lunar equivalent displays (2024년 윤2월 6일) + sexagenary (甲辰) + zodiac (용/Dragon).
      2. Set lunar date to 2024-02-06 (leap) → solar equivalent displays 2024-03-15.
      3. Swap inputs (click another date) → conversion updates instantly, no reload.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Edge cases: boundary years, leap months, invalid dates</description>
    <steps>
      1. Try 1390 (before table) → error "지원하지 않는 년도입니다."
      2. Try 2051 (after table) → error.
      3. Click leap toggle on a year with no leap month → error "선택한 연도에 윤달이 없습니다."
      4. Try solar day 31 in Feb → validation prevents (no Feb 31).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>"Today" button, locale-aware formatting</description>
    <steps>
      1. Click "오늘 조회" / "Today" → both inputs set to today's date; conversion displays.
      2. Switch locale /en → "Today" button label changes; date formatting switches (e.g., "March 15, 2024" vs "2024년 3월 15일").
      3. Verify locale from `useLocale()` is passed to Intl.DateTimeFormat (no i18n key passed to Intl).
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Recents, persistence, copy, accessibility</description>
    <steps>
      1. Convert 5 different dates → recent list populates (MRU first).
      2. Reload → recents persist (localStorage); unknown entries pruned.
      3. Click a recent entry → inputs load, conversion displays.
      4. Click "복사 (전체)" → clipboard has both dates; success toast displays 1.5s.
      5. axe pass → no violations; buttons labeled; focus rings visible.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>SEO, JSON-LD, bilingual HTML</description>
    <steps>
      1. Production build → /ko/tools/lunar-converter and /en/tools/lunar-converter unique title/description/canonical/hreflang/OG, statically generated.
      2. HTML has SoftwareApplication + FAQPage + BreadcrumbList JSON-LD; how-to/FAQ localized; intro text SSR (outside mounted gate).
      3. Verify table is bundled (no dynamic import of raw CSV).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Two-way conversion solar ↔ lunar (1391–2050 range); sexagenary + zodiac display; leap-month handling; Today button; recent history (localStorage, max 10); copy to clipboard; friendly out-of-range errors.</functionality>
  <user_experience>Conversion instant on input change; ≥44px tap targets; keyboard operable; visible focus; SPA — no reload on input change. Mobile <768px single-column, no horizontal overflow.</user_experience>
  <technical_quality>lib/lunar-converter/* pure ≥ 80% unit coverage (conversion, sexagenary, zodiac, schema); table validation tests (bounds, gaps, leap consistency); TS 0 errors; <800 lines per file; locale from useLocale() (never i18n key to Intl).</technical_quality>
  <visual_design>DESIGN.md compliant; grape accent for identity + brand honey-gold CTAs; warm, friendly calendar tool (not clinical); readable sexagenary glyph + zodiac emoji.</visual_design>
  <accessibility>Full keyboard (tab, enter); aria-label on inputs; labeled buttons; motion-respect; WCAG 2.1 AA.</accessibility>
  <build_performance>Table bundled; tool route within platform budget; LCP < 2.5s; CLS unaffected (ad height platform-reserved).</build_performance>
</success_criteria>

<key_implementation_notes>
  <critical_paths>
    1. KASI lunar table build-time generation + TS typing + bounds validation (1391–2050 hard bounds).
    2. solarToLunar / lunarToSolar lookup logic + sexagenary/zodiac computation.
    3. Input dropdowns with dynamic validation (leap months, day ranges per month).
    4. Locale binding: useLocale() → Intl APIs (never i18n keys).
    5. localStorage recents with pruning on load.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/lunar-converter/{schema,conversion,sexagenary,zodiac,recents}.ts Vitest (RED→GREEN): KASI table lookup, sexagenary/zodiac name+hanja mapping, recents immutable ops, localStorage parse.
    2. scripts/generate-lunar-table.mjs + KASI source integration + lunar-table.ts emission. Validation tests (year bounds, leap months, gaps).
    3. tools.lunar-converter.* messages (ko/en): labels, months, zodiac names, copy toast, errors, how-to, FAQ.
    4. useConverter hook (dynamic table import + localStorage + conversion + copy adapter).
    5. SolarInput + LunarInput dropdowns (year/month/day, leap toggle, validation, aria-label).
    6. TodayButton (JS local date via useLocale() for display).
    7. ConversionResult (both dates formatted, sexagenary hanja, zodiac emoji, copy buttons).
    8. RecentsList (click to reload), ErrorMessage, RecentsStore.
    9. LunarConverterIntro/HowTo/Faq + SoftwareApplication + FAQPage + BreadcrumbList JSON-LD via platform lib/seo.ts.
    10. Registry status→live; slug→component + generateMetadata branches; E2E (scenarios 1–5); visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <locale_lesson>
    DO: const locale = useLocale(); new Intl.DateTimeFormat(locale, options).format(date);
    DO NOT: new Intl.DateTimeFormat(t('locale_key'), options) — this throws RangeError.
    Lesson from Q&A a Day: test may pass with fixed props but live app breaks because Intl gets a translation key string, not "ko"/"en".
  </locale_lesson>
  <testing_strategy>Pure Vitest ≥80% (conversion/sexagenary/zodiac/schema); table generation tests (bounds, leap, gaps); jsdom localStorage isolation; E2E scenarios 1–5 (esp. #1 conversion, #2 edge cases, #3 Today + locale, #5 JSON-LD); clipboard/localStorage mocks.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

**Lunar–Solar Calendar Converter SPEC.md: 354 lines.**
