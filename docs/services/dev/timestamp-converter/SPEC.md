# Unix Timestamp Converter — Bidirectional Unix epoch ↔ human date/time — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Unix Timestamp Converter** (타임스탐프 변환기 / 유닉스 타임스탐프 변환) — converts Unix epoch timestamps (seconds and milliseconds, auto-detected) to human-readable dates/times and vice versa, with timezone support (Local / UTC / named IANA zones), a live-ticking current timestamp display, ISO 8601 parsing, relative time rendering, and batch conversion. The tool solves "What date was 1700000000?" and "How many seconds until New Year?" The tool mounts as a client-side SPA offering tabs for conversion, current time, batch import, and settings (timezone/24h display).
> Internal service codename: `timestamp-converter`. Registry id: `timestamp-converter`. Public URL slug: `/[locale]/tools/timestamp-converter`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/new-word/SPEC.md`](../../text/new-word/SPEC.md)

```xml
<project_specification>

<project_name>Unix Timestamp Converter — epoch ↔ human date/time translator (Jurepi tool, registry id timestamp-converter)</project_name>

<overview>
Unix Timestamp Converter bridges the gap between machine time (seconds/milliseconds since 1970-01-01T00:00:00Z) and human time (readable dates, timezones, relative phrases). A developer pastes "1700000000" and instantly sees "2023-11-14 22:13:20 UTC"; a user asks "what time is it now in seconds?" and sees a live-ticking counter. The tool handles the ambiguity of epoch magnitude (1700000000 is seconds, 1700000000000 is milliseconds) via auto-detection + manual override. Timezone support (Local, UTC, + Intl IANA zones like Asia/Seoul, America/New_York) lets users see the same timestamp across regions. Relative time ("3 hours ago", "in 25 minutes") is localized via Intl.RelativeTimeFormat.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no network. The only first-party persistence is `localStorage` (timezone preference, 24h display mode, batch history), and nothing is ever sent over the network.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — tab switching, timezone selection, copy button, batch input — happens via local React state with NO route navigation and NO full page reload. The route is statically generated (SSG) for SEO/indexing; the interactive tool is a single client-component island on that static shell. Usability is paramount: copy timestamps, relative time, timezone switcher all within reach.
</overview>

<platform_integration>
  - Route: /[locale]/tools/timestamp-converter (SSG; registry slug "timestamp-converter", id "timestamp-converter", status "live", accent "sun", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.timestamp-converter.*` (UI chrome strings: tabs, labels, placeholders, help, FAQ — NOT conversion data; that comes from Intl APIs).
  - CRITICAL PREREQUISITE: the `'dev'` category exists in `ToolCategory` type union but is NOT yet wired (no `categories.dev` i18n label, not in `CATEGORY_ORDER` or `FOOTER_CATEGORIES`). This tool's launch requires a one-time platform setup: add i18n labels ko "개발"/en "Developer", add `category: 'dev'` to `CATEGORY_ORDER` and `FOOTER_CATEGORIES`, and assign the category accent ("sun", matching this tool's suggested accent). Only ONE tool needs to activate the category; subsequent dev tools inherit it.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Timestamp conversion: Unix epoch (seconds ↔ milliseconds, auto-detect by magnitude 10-digit vs 13-digit, manual override) ↔ human date/time.
    - Timezone support: Local (browser), UTC (Z suffix), named IANA zones via Intl.DateTimeFormat options (Asia/Seoul, America/New_York, Europe/London, etc.), live DST-aware.
    - Human-readable output: formatted date+time per locale (useLocale() BCP-47 "ko"/"en" + Intl APIs), ISO 8601 format option, relative time ("3 hours ago", "in 2 days") via Intl.RelativeTimeFormat.
    - Live current timestamp: ticking second display of now() in seconds + milliseconds, with copy buttons, respecting timezone/format preference.
    - Batch conversion: paste multiline numbers, convert all at once, download as CSV.
    - Settings panel: timezone selector (picklist or typeahead), 24h/12h format toggle, relative-time language preference, localStorage persistence.
    - Copy-to-clipboard: each timestamp/result field copy-able; success toast.
    - Edge cases: negative timestamps (pre-1970), very large values (year 5138+), invalid input validation, DST transitions.
    - Tool-specific SEO long-form ("What is Unix timestamp?") + FAQ (FAQPage JSON-LD) + SoftwareApplication JSON-LD, localized ko/en.
    - Full keyboard support: Tab to fields, Enter submit, Esc clear.
    - Accessibility: WCAG 2.1 AA, labeled inputs, visible focus, ARIA live regions for results.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Cron expression parsing (future).
    - Backend API / server-side conversion.
    - Login / accounts / conversion history sync.
    - Real-time collaboration / shared results.
  </out_of_scope>
  <future_considerations>
    - Timezone abbreviation quick-select (EST, KST, JST) — Phase 2.
    - Calendar picker (date → epoch) — Phase 2.
    - Cron expression translator — Phase 3.
    - Browser's local calendar app integration (deeplink) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <epoch_math>Vanilla JS: Date, Intl.DateTimeFormat, Intl.RelativeTimeFormat. No date library (date-fns / day.js). Conversion logic is pure functions in lib/timestamp-converter/; framework-free.</epoch_math>
    <timezone_database>Browser Intl (CLDR built-in); IANA zone list from Intl.DateTimeFormat.prototype.resolvedOptions().timeZone docs. No tzdata dependency.</timezone_database>
    <csv_export>Vanilla Blob + URL.createObjectURL for client-side download.</csv_export>
    <copy>navigator.clipboard.writeText → fallback textarea.execCommand('copy') → silent fail (copy is secondary feature).</copy>
    <animation>Native CSS transitions only (tab fade, input focus glow). No animation library.</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/
├── lib/timestamp-converter/                       # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                                  # zod: ConversionInput, ConversionResult, TimestampStore; safeparse helpers
│   ├── detect.ts                                  # detectMagnitude(str): "seconds" | "milliseconds"
│   ├── convert.ts                                 # toDate(epoch, magnitude), fromDate(date), toIso(date), toRelative(date, now, locale)
│   ├── zones.ts                                   # listIanaZones(), formatInZone(date, zone, locale), isValidZone(zone)
│   ├── parse.ts                                   # parseHumanDate(str): Date | null (ISO 8601 + locale formats)
│   ├── batch.ts                                   # parseBatch(multiline: string): { epoch, magnitude, result? }[]
│   └── storage.ts                                 # Immutable ops: savePrefs(tz, format), loadPrefs(), pruneHistory(max)
├── components/tools/timestamp-converter/
│   ├── TimestampConverter.tsx                     # Orchestrator (Client Component) — tab + form state + useConverter()
│   ├── useConverter.ts                            # Hook: dynamic zone list, localStorage prefs, derived conversions
│   ├── ConvertTab.tsx                             # "Convert" tab: input(epoch/date), detect toggle, result(date/epoch)
│   ├── CurrentTab.tsx                             # "Now" tab: live-ticking timestamp display (s + ms), copy, timezone picker
│   ├── BatchTab.tsx                               # "Batch" tab: multiline input, convert all, CSV download
│   ├── SettingsPanel.tsx                          # Timezone selector, 24h/12h toggle, clear history button
│   ├── TimestampDisplay.tsx                       # Reusable: format + copy button + toast feedback
│   ├── TimestampConverterIntro.tsx                # H1 + lead (SEO; server-render where possible)
│   ├── TimestampConverterHowTo.tsx                # "What is a Unix timestamp?" (SEO long-form)
│   ├── TimestampConverterFaq.tsx                  # Q&A + FAQPage JSON-LD
│   └── data/
│       └── zones.generated.json                   # Generated list of IANA zones (build-time only, reference)
└── i18n/messages/{ko,en}.json                     # tools.timestamp-converter.* UI chrome (tabs, labels, help, FAQ) — NOT conversion data
</file_structure>

<core_data_entities>
  <conversion_state note="per-session in-memory, persisted prefs in localStorage">
    - activeTab: enum (convert, now, batch, settings)
    - input: { epoch?: string; humanDate?: string; direction: "epoch-to-date" | "date-to-epoch" }
    - magnitude: enum (seconds, milliseconds, auto) — default auto; toggle via "Detect" checkbox
    - result: { timestamp?: string; date?: string; iso?: string; relative?: string } — derived from input + convert funcs
    - timezone: string — IANA zone (e.g., "Asia/Seoul", "UTC") or "Local"; resolved from Intl
    - format24h: boolean — true = 23:45, false = 11:45 PM; localStorage persisted
    - batchInput: string; batchResults: { epoch, magnitude, date, iso }[]
  </conversion_state>
  <timestamp_store note="localStorage only, per-tool key">
    - version: number (STORE_VERSION, starts at 1)
    - timezone: string — last-selected IANA zone
    - format24h: boolean
    - batchHistory: { id, timestamp, date, tz }[] (max 50 entries, auto-pruned on load)
    localStorage key: `jurepi-timestamp-converter`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw).
  </timestamp_store>
  <conversion_result note="derived; never stored">
    - epoch: string (as-input)
    - magnitude: "seconds" | "milliseconds"
    - date: string (formatted per locale + timezone: "2023-11-14 22:13:20")
    - iso: string ("2023-11-14T22:13:20Z" or with offset)
    - relative: string via Intl.RelativeTimeFormat ("3 hours ago", "in 2 days")
    - warnings?: string[] (e.g., "pre-1970", "year > 5138")
  </conversion_result>
  <iana_zones note="static list, not persisted">
    List of ~400 supported IANA zones from Intl (Asia/Seoul, America/New_York, Europe/London, Etc/UTC, etc.). Never changes per session; listIanaZones() returns sorted array.
  </iana_zones>
  <constants>
    - SECONDS_MAGNITUDE_MAX = 9999999999 (≈ year 2286)
    - MILLIS_MAGNITUDE_MIN = 10000000000 (≈ year 1970)
    - BATCH_HISTORY_MAX = 50
    - COPY_TOAST_MS = 1600ms
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/timestamp-converter" page="TimestampConverter (platform tool route)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <timestamp_converter>                             <!-- "use client"; owns tab + form state + useConverter() -->
    <timestamp_converter_intro />                   <!-- H1 + lead (server-render where possible) -->
    <converter_layout>                              <!-- Tabs container -->
      <tab_list role="tablist">
        <tab_trigger value="convert" />             <!-- "Convert" -->
        <tab_trigger value="now" />                 <!-- "Current" / "Now" -->
        <tab_trigger value="batch" />               <!-- "Batch" -->
      </tab_list>
      <tab_content value="convert">
        <convert_tab />                             <!-- Input(epoch/date) + detect toggle → output(date/epoch) -->
      </tab_content>
      <tab_content value="now">
        <current_tab />                             <!-- Live ticking now timestamp (s+ms) + timezone picker + copy -->
      </tab_content>
      <tab_content value="batch">
        <batch_tab />                               <!-- Multiline input → results grid + CSV download -->
      </tab_content>
      <settings_panel />                            <!-- Timezone picker, 24h/12h toggle -->
    </converter_layout>
    <timestamp_converter_how_to />                  <!-- SEO long-form -->
    <timestamp_converter_faq />                     <!-- FAQPage JSON-LD -->
  </timestamp_converter>
  <note>SPA within tool: tab click = state switch, NOT route navigation. Settings accessed via floating button or inline panel.</note>
</component_hierarchy>

<pages_and_interfaces>
  <timestamp_converter_intro>
    - Eyebrow: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "유닉스 타임스탐프 변환기" / "Unix Timestamp Converter" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: "Unix epoch(초/밀리초)와 인간 가독성 날짜·시간을 즉시 변환하세요. 시간대·상대시간·배치 변환 지원." / English equivalent.
  </timestamp_converter_intro>

  <convert_tab>
    - Two input columns (stacked mobile, side-by-side desktop): epoch input ↔ date input (bidirectional).
    - Epoch input: "Unix Epoch" label, number field, leading Clock icon, placeholder "1700000000 or 1700000000000".
    - Detect toggle: checkbox "Detect (auto)" — auto-magnitude; unchecked = picker (seconds/milliseconds).
    - Date input: "Date & Time" label, date + time input or text parser "2023-11-14 22:13:20".
    - Timezone picker: "Timezone" dropdown (Local, UTC, Asia/Seoul, …), selected zone auto-persisted.
    - Results card: shows date/iso/relative in separate blocks, each with copy button.
    - Edge-case warnings: alert banner if pre-1970 or year > 5138.
    - Clear button resets both inputs.
  </convert_tab>

  <current_tab>
    - Prominent live counter: seconds + milliseconds (displayed as "1700000000 | 1700000000000").
    - Updates every 100ms; motion-respect: no animation if prefers-reduced-motion.
    - Copy buttons for seconds and milliseconds separately.
    - Timezone picker; shows now in multiple zones side-by-side (e.g., "Asia/Seoul" + "UTC" + "Local").
    - Relative time below ("as of just now" / time since page load in seconds).
    - Formatted date/time display (respecting 24h/12h setting).
  </current_tab>

  <batch_tab>
    - Textarea: multiline input, paste N timestamps or dates, one per line.
    - "Convert" button processes all.
    - Results grid: rows = epoch + magnitude + date + iso; columns sortable; each row copy-able.
    - "Download CSV" button exports results (epoch,magnitude,date,iso,relative).
    - History sidebar (optional): recent batch operations with dates, delete-able.
  </batch_tab>

  <settings_panel>
    - Floating gear icon button or footer link "Settings".
    - Timezone selector: searchable dropdown or typeahead (≥400 zones); "Local" + "UTC" pinned top.
    - Format toggle: "24h" / "12h" (AM/PM) segment; default 24h.
    - Clear history button (batch history).
    - Prefs localStorage-persisted; no sync across tabs (single-session).
  </settings_panel>

  <keyboard_shortcuts_reference>
    - Tab → move between inputs / buttons.
    - Enter (epoch input) → convert.
    - Ctrl+C / Cmd+C (copy buttons) → clipboard.
    - Esc → clear current tab input.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <detect_magnitude note="pure, unit-tested">
    - detectMagnitude(str): if str length ≤ 10 digits → "seconds", ≥ 13 → "milliseconds", else ambiguous (ask user).
    - Auto-toggle via "Detect" checkbox; manual override via dropdown.
  </detect_magnitude>
  <convert_to_date note="pure, Intl-aware">
    - toDate(epoch: string, magnitude: string): Date | null. Validates range (pre-1970 warn, year > 5138 warn).
    - Handles negative (pre-1970) dates correctly.
  </convert_to_date>
  <format_date note="pure, localized">
    - toDateString(date: Date, locale: BCP47, timezone: string, format24h: bool): formatted date/time string.
    - Uses Intl.DateTimeFormat with options { timeZone, hour12, year, month, day, hour, minute, second }.
    - Never pass an i18n message key to Intl (CRITICAL; RangeError if non-BCP47).
  </format_date>
  <relative_time note="pure, localized">
    - toRelative(date: Date, now: Date, locale: BCP47): "3 hours ago" / "in 2 days" via Intl.RelativeTimeFormat.
    - Locale from useLocale(), never from i18n key.
  </relative_time>
  <timezone_support note="browser native via Intl">
    - listIanaZones(): static list from Intl (≥400 zones, sorted).
    - isValidZone(zone): check if zone exists; returns bool.
    - formatInZone(date, zone, locale): wrapper around Intl.DateTimeFormat with timeZone option.
  </timezone_support>
  <parse_human_date note="pure; ISO 8601 + locale formats">
    - parseHumanDate(str, locale): attempt ISO parse, fallback locale-aware parse (DD/MM/YYYY or MM/DD/YYYY).
    - Strict validation; return null on fail (user sees error, not exception).
  </parse_human_date>
  <persistence_adapter useConverter>
    - Mount: read `jurepi-timestamp-converter` → zod → loadPrefs (tz, format24h, batch history); fail → start fresh.
    - Change: JSON.stringify → setItem; catch quota → keep in-memory (no error thrown).
    - Expose: currentEpoch (ticking), magnitude, timezone, format24h, setTimezone, setFormat, convertEpoch, convertDate, batch.
  </persistence_adapter>
  <copy_adapter note="secondary feature, silent fail">
    - navigator.clipboard.writeText(text) → success toast → catch → fallback textarea execCommand('copy') → catch silent.
    - Success toast only on real success (no false positive).
  </copy_adapter>
  <i18n>All UI chrome from tools.timestamp-converter.* (ko/en): tabs, labels, help, how-to, FAQ. Conversion data (dates, relative times, zones) come from Intl APIs (locale-aware), never i18n messages.</i18n>
</core_functionality>

<error_handling>
  <input_validation>Invalid epoch (non-numeric, out-of-range) → error label under input; user can clear. Invalid date → "Invalid date" label.</input_validation>
  <magnitude_ambiguity>If 10 < len < 13 digits, show user picker "seconds or milliseconds?"; both interpretations shown side-by-side.</magnitude_ambiguity>
  <edge_cases>Pre-1970 timestamps → warn label "This is before 1970 (negative offset)". Year > 5138 → warn "Exceeds JavaScript Date limit".</edge_cases>
  <timezone_invalid>If stored zone no longer valid (rare Intl update), fall back to "Local" (no error).</timezone_invalid>
  <storage_quota>setItem throw → keep in-memory; no scary error toast (no user action available).</storage_quota>
  <copy_failure>Clipboard API unavailable → silent (copy is secondary for a reference tool).</copy_failure>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SUN (var(--accent-sun) / var(--accent-sun-soft)) — "dev" category identity per DESIGN + this tool's suggested accent. Timer icon tile, active tab underline, "copy" success toast.
    - CTAs (primary buttons) stay brand honey-gold var(--brand) (convert button). Accent = identity, not action (DESIGN do/don't).
  </accent_usage>
  <surfaces>Input card = var(--surface) + 1px var(--hairline); results card = var(--surface) + shadow --shadow-card; batch results table var(--surface-muted) rows. Soft surfaces, hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); result labels (date/iso/relative) Pretendard 15px/1.55 var(--text-secondary); input labels eyebrow 12px/700. Monospace for epoch numbers (optional, family "Menlo"/"Courier New" for visual distinction).</typography>
  <motion>transform/opacity only: input focus glow 150ms, tab fade 150ms, copy success toast slide-up 200ms, live counter updates (no jitter). --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (instant, no transform).</motion>
  <accessibility>Inputs labeled properly (label for=id); visible focus-visible ring var(--focus-ring); ≥44px tap targets; copy buttons aria-label; live counter aria-live="polite"; results grid keyboard-navigable.</accessibility>
  <responsive>
    - ≥768px: 2-column inputs (epoch | date) side-by-side.
    - <768px: stacked inputs; timezone picker full-width.
    - Batch results: scrollable table <768px; full width ≥768px.
    - No overflow (320px test).
  </responsive>
  <atmosphere>Technical, precise, focused: monospace + clear labels for developers. Not flashy; respect prefers-reduced-motion. Every field copy-able, every result exportable.</atmosphere>
  <icons>lucide-react: Clock (leading), Copy, Download, Settings, Calendar, ChevronDown. Default 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="user-supplied numbers only">
    - Epoch input: validated as number; no HTML injection.
    - Date input: parsed, validated; no dangerous formats.
    - Batch input: line-by-line parse, no execution.
  </input>
  <clipboard>User-initiated strings only (epoch/date/iso); never read clipboard. User-gesture handler only.</clipboard>
  <privacy>Batch history localStorage-only, never sent. No analytics event logs conversion data. No network calls (Intl is local).</privacy>
  <timezone_list>IANA zone list from Intl (browser-native); no remote fetch; valid zones verified per Intl.DateTimeFormat resolution.</timezone_list>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <live_ticking>"Now" tab updates every 100ms; respects prefers-reduced-motion (no smooth animation, instant updates).</live_ticking>
  <relative_time>Intl.RelativeTimeFormat auto-picks units (hours, days, minutes) based on delta; output fully localized.</relative_time>
  <batch_processing>Multiline paste → parse all → results grid; each row copy-able or export all as CSV.</batch_processing>
  <timezone_coverage>≥400 IANA zones; searchable dropdown; DST-aware (Intl handles it).</timezone_coverage>
  <edge_case_handling>Negative timestamps (pre-1970), very large values, invalid input all handled gracefully with clear warnings, never crash.</edge_case_handling>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Epoch → date conversion, auto-detect</description>
    <steps>
      1. Open /ko/tools/timestamp-converter → "Convert" tab.
      2. Enter "1700000000" in epoch input → detect auto-checks → result shows date "2023-11-14 22:13:20 (UTC)" + ISO + relative "1 day ago" (approx).
      3. Toggle detect off → picker appears "seconds / milliseconds"; "seconds" selected; same result.
      4. Enter "1700000000000" → auto-detects "milliseconds" → same date result.
      5. Copy date result → clipboard has text; success toast appears 1600ms then fades.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Timezone switching, 24h/12h format</description>
    <steps>
      1. Current "Now" tab shows live timestamp (seconds + milliseconds ticking).
      2. Timezone picker: select "America/New_York" → now displays in that zone (5–8 hours behind UTC depending on DST).
      3. Open settings → toggle 24h → OFF → now shows "10:45 PM" format; toggle ON → "22:45"; localStorage persists.
      4. Reload page → timezone and format stick (localStorage).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Batch convert, CSV export</description>
    <steps>
      1. Batch tab; paste multiline:\n1700000000\n1700000000000\n2024-01-01T00:00:00Z\n
      2. Click "Convert" → results grid shows 3 rows: (epoch, magnitude, date, iso, relative).
      3. "Download CSV" → file timestamp-converter-batch.csv downloads with rows (no backend call).
      4. Open file → CSV headers + 3 data rows present; dates match manual conversion.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Edge cases: pre-1970, out-of-range</description>
    <steps>
      1. Enter "-86400" (1 day before epoch, 1969-12-31) → warning "This is before 1970" appears; date still converts correctly.
      2. Enter "999999999999" (year 5138+) → warning "Exceeds JavaScript Date limit" appears.
      3. Enter "invalid text" → error "Not a number" under input; clear and retry.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO, a11y</description>
    <steps>
      1. Switch to /en → chrome (tabs, labels, help, FAQ) English; epoch input label "Unix Epoch", timezone "Local" → "UTC" options.
      2. Build prod → /ko/tools/timestamp-converter and /en/tools/timestamp-converter unique title/description/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage JSON-LD localized; how-to/FAQ localized; no Intl RangeError on load.
      4. Keyboard: Tab → cycle inputs/buttons, visible focus ring; axe pass → no violations.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Bidirectional conversion (epoch ↔ date) with auto-detect + manual magnitude override; timezone support (Local/UTC/IANA); live current timestamp; ISO 8601 + relative time; batch input → CSV export.</functionality>
  <user_experience>Instant conversion; timezone picker accessible; copy buttons obvious; batch paste-and-go; 24h/12h toggle persistent; no page reload on any interaction (SPA).</user_experience>
  <technical_quality>lib/timestamp-converter/* pure ≥ 80% unit coverage (detect, convert, parse, batch, storage); TS 0 errors; &lt;800 lines per file; no i18n bundle bloat (Intl APIs, not messages).</technical_quality>
  <visual_design>DESIGN.md compliant; sun accent identity + brand honey-gold CTA; monospace optional for epoch numbers; text-node render only; motion-respect.</visual_design>
  <accessibility>Full keyboard (Tab, Enter, Esc); labeled inputs; visible focus; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; live counter updates smooth (&lt;100ms); no jank; CLS unaffected.</performance>
  <security>Client-only; no XSS, no secrets, no network.</security>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/timestamp-converter pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category does NOT exist yet; it must be wired first (see platform_integration).
    {
      id: 'timestamp-converter',
      slug: 'timestamp-converter',
      category: 'dev',          // NEW CATEGORY (prerequisite: i18n labels + CATEGORY_ORDER + FOOTER_CATEGORIES)
      icon: 'Clock',            // lucide-react
      accent: 'sun',
      status: 'live',           // 'coming_soon' until module complete
      isNew: true,
      order: 10,
      keywords: ['타임스탐프','유닉스 시간','epoch','시간 변환','시간대','타임존','Unix timestamp','time converter','timezone','epoch converter'],
    },
    ```
    Also add slug→component branch (&lt;TimestampConverter/&gt;) and generateMetadata branch (title/description/JSON-LD) in tool route alongside ladder/qna-a-day/new-word.
  </platform_registry_change>
  <critical_paths>
    1. Magnitude detection (10 vs 13 digits) — core UX clarity.
    2. Intl.DateTimeFormat + Intl.RelativeTimeFormat for locale/timezone — never pass i18n keys to Intl (RangeError).
    3. useConverter hook with localStorage prefs + live ticking now.
    4. Copy adapter (clipboard → fallback → silent).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/timestamp-converter/{schema,detect,convert,zones,parse,batch,storage}.ts Vitest (RED→GREEN): magnitude detection, epoch↔date round-trip, edge cases (pre-1970, year 5138+), timezone formatting, batch parsing, localStorage persistence.
    2. useConverter hook (Intl APIs, localStorage, live ticking).
    3. ConvertTab + CurrentTab + BatchTab + SettingsPanel components (forms + results display).
    4. tools.timestamp-converter.* messages (ko/en): tabs, labels, help, how-to, FAQ.
    5. Keyboard shortcuts, motion-reduce, a11y (axe, labeled inputs, visible focus).
    6. TimestampConverterIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via platform lib/seo.ts.
    7. Registry status→live; E2E scenarios 1–5; visual regression 320/768/1024 both themes + both locales.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥80% (detect/convert/parse/batch/storage); Intl awareness tests (timezone, locale, RangeError guards); E2E scenarios 1–5 (detect, tz switch, batch, edge cases, SEO); clipboard/localStorage jsdom-isolated; live counter no jitter.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024/1440 screenshots both themes, no overflow, copy feedback, live counter smooth, settings persist, batch CSV correct, JSON-LD primed HTML.</tool_usage>
</key_implementation_notes>

</project_specification>
```

SPEC.md generated successfully — 383 lines.
