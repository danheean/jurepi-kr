# Cron Expression Parser — Decode & Understand Cron Schedules — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Cron Expression Parser** (크론 표현식 해석기) — a browser-based tool that decodes standard Unix/Linux cron expressions (5-field: minute hour day-of-month month day-of-week) into human-readable descriptions, field-by-field analysis, and a list of the next 10 scheduled run times. Users paste a cron expression or select from presets; the tool instantly shows what the schedule means in plain language ("Every Monday through Friday at 9:00 AM", "First day of every month at midnight"), validates each field with precise error messages, computes upcoming occurrences accounting for the user's local timezone (with DST), and explains common edge cases (leap years, month boundaries).

> Internal service codename: `cron-parser`. Registry id: `cron-parser`. Public URL slug: `/[locale]/tools/cron-parser`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/json-formatter/SPEC.md`](../json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>Cron Expression Parser — Decode & Schedule Next Run Times (Jurepi tool, codename cron-parser, registry id cron-parser)</project_name>

<overview>
Cron Expression Parser transforms cryptic cron expressions (e.g., `0 9 * * MON-FRI`) into readable, actionable descriptions ("Every weekday at 9:00 AM") and computes the next 10 run times in the user's chosen timezone. DevOps engineers, system administrators, and developers often write cron jobs but struggle to verify correctness without running them; this tool provides instant, offline feedback: paste an expression, see a human-friendly explanation, a field-by-field breakdown table (minute, hour, day-of-month, month, day-of-week, each showing the parsed values and their meaning), and a list of upcoming occurrences accounting for timezones and daylight saving time.

The tool supports standard 5-field POSIX cron syntax (minute hour dom month dow), value lists (1,2,3), ranges (1-5), steps (*/15, 1-30/5), common names (JAN-DEC for months, SUN-SAT for day-of-week), the `*` wildcard, and convenience macros (@yearly, @monthly, @weekly, @daily, @hourly). It explicitly rejects non-standard Quartz syntax (L, W, #, ?) with honest error messages ("Quartz syntax not supported; use standard POSIX cron").

CRITICAL (client-only, SSG): 100% client-side, no backend, no database. Pure date-time computation and parsing. The only first-party persistence is localStorage for user preferences (timezone, last expression, recents). Cron expressions and schedules never leave the device.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. All interaction — entering cron expression, selecting timezone, computing next runs — happens via local React state with NO route navigation and NO full page reload. Results update instantly as the user types (debounced 200ms).

CRITICAL (localization of descriptions): the domain layer returns a **structured description model** (not English sentence templates hardcoded in the domain). The UI layer maps that model to localized i18n messages (ko/en). E.g., domain returns { frequencyKind: 'everyDay', atTimes: [{ hour: 9, minute: 0 }] }; UI renders "매일 오전 9시" (ko) or "Every day at 9:00 AM" (en). This ensures descriptions are always accurate in both languages.

CRITICAL (DST-aware next-run computation): the next-run list must account for daylight saving time transitions (spring forward, fall back). Use native `Intl.DateTimeFormat` or a small date library (date-fns, day.js) to handle timezone conversions correctly. If DST transition skips a time (e.g., 2:30 AM doesn't exist on spring-forward day), the tool must either skip that occurrence or explain it in the result.

CRITICAL (honest error messages): invalid cron expressions must not crash. Invalid field values (e.g., minute 61), unsupported syntax (L, W, #, ?), and malformed ranges all produce friendly, precise error messages (e.g., "Day-of-month field: invalid value 32 (must be 1–31)").
</overview>

<platform_integration>
  - Route: /[locale]/tools/cron-parser (SSG; registry slug "cron-parser", id "cron-parser", status "live", accent "rose", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons.
  - Consumes: i18n namespace `tools.cron-parser.*` (UI chrome strings: field labels, error messages, timezone list, description parts, how-to, FAQ — NOT cron expressions, which are user input; descriptions are composed from i18n parts in the UI layer, not generated in the domain).
  - NOTE (updated 2026-07-10): the `'dev'` category is ALREADY live in the platform. No platform prerequisite remains; this tool only adds its own registry entry.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Cron expression input (single text field or multi-line textarea for pasting).
    - Support: 5-field POSIX cron (minute hour dom month dow).
    - Field value syntax: literals (0–59 for minute, 0–23 for hour, 1–31 for dom, 1–12 for month, 0–6 or SUN–SAT for dow), value lists (1,3,5), ranges (1-5), steps (*/15, 1-30/5), wildcard (*), and names (JAN-DEC, SUN-SAT for day-of-week).
    - Macros: @yearly (0 0 1 1 *), @monthly (0 0 1 * *), @weekly (0 0 ? * 0 — non-standard, or equivalently 0 0 * * 0), @daily (0 0 * * *), @hourly (0 * * * *). Note: @yearly through @hourly are standard; @weekly is sometimes written as `0 0 * * 0`.
    - Expression validation: each field is parsed independently; invalid values (e.g., minute 61, month 13) return precise error messages pinpointing the offending field.
    - Human-readable description: domain returns structured model; UI renders localized (ko/en) description (e.g., "매주 월요일부터 금요일 오전 9시" / "Every weekday at 9:00 AM").
    - Field-by-field breakdown table: minute, hour, day-of-month, month, day-of-week, each showing parsed values (e.g., minute [0, 15, 30, 45], day-of-week [MON, TUE, WED, THU, FRI]).
    - Next run times: compute the next 10 occurrences of the schedule in the user's selected timezone, accounting for DST. Display as a list with human-formatted timestamps (e.g., "Monday, July 15, 2026 at 9:00 AM EDT").
    - Timezone selector: dropdown listing major IANA timezones (America/New_York, Europe/London, Asia/Tokyo, etc.) plus "Local" (browser's local timezone). Default is Local.
    - No-upcoming-runs state: if the expression is invalid in a way that produces no future occurrences (e.g., Feb 30), show "No upcoming runs found within 4 years" (the look-ahead cap).
    - Preset expressions: curated gallery of common schedules (every 5 minutes, weekdays 9am, monthly 1st at midnight, etc.). One-click load into expression field.
    - localStorage persistence: last expression, last timezone, recents (max 20).
    - Honest out-of-scope messaging: Quartz-specific syntax (L, W, #, ?) is explicitly not supported; error message directs user to standard POSIX.
    - Tool-specific SEO long-form ("Cron job basics", "field meanings explained", "common scheduling patterns", "timezone considerations") + FAQ (FAQPage JSON-LD), localized ko/en.
    - Keyboard support: Tab, Enter to parse, Ctrl+A select all.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - 6-field (second) cron or 7-field variants — out of scope; future_considerations Phase 2.
    - Quartz syntax (L, W, #, ?) or other cron dialects — out of scope; error messages direct to standard POSIX.
    - Non-IANA timezone formats (e.g., EST, PST) — not supported due to ambiguity; suggest IANA names.
    - Interactive cron builder (dropdown per field to construct expression) — Phase 2 candidate.
    - Cron expression syntax highlighter or IDE-like editor — Phase 2.
    - Web hook or scheduling service integration (e.g., "run this cron job now") — out of scope (tool is read-only, no side effects).
  </out_of_scope>
  <future_considerations>
    - Interactive cron builder UI (dropdown per field) — Phase 2.
    - 6-field cron with seconds — Phase 2.
    - Import/export cron schedules as JSON — Phase 2.
    - Diff mode (compare two cron expressions, show scheduling differences) — Phase 3.
    - Cron expression visualizer (calendar/timeline view of next 30 days) — Phase 3.
    - Non-English language packs (beyond ko/en) — Phase 2+ depending on i18n strategy.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <parser>Hand-written parser (no external cron lib) or lightweight parser (cron-parser v3, if available and MIT/Apache-licensed and small). Parser tokenizes the 5-field expression, validates each field (range checks, name mapping JAN-DEC/SUN-SAT), and builds a structured representation: { minute: number[], hour: number[], dom: number[], month: number[], dow: number[] } or similar. Special handling: `*` expands to full range, `/` for steps, `,` for lists, `-` for ranges. Mutually exclusive dom/dow rule (if both are non-*, cron semantics say "match dom OR dow, not AND"); document this in FAQ.</parser>
    <description_model>Domain layer returns a TYPED model: { frequencyKind: 'everyMinute' | 'everyNMinutes' | 'everyHour' | 'everyDay' | 'everyWeekday' | 'monthly' | 'yearly' | 'custom', atTimes?: [{hour, minute}], onDays?: [...], onMonths?: [...], ... } (structured, not English prose). UI layer maps model to i18n keys to render localized descriptions.</description_model>
    <next_run_computation>Iterative algorithm (no external date math lib required, though day.js or date-fns is acceptable if small): start from current time (or tomorrow if past all today's runs), iterate minute-by-minute (or hour-by-hour for optimization), test each candidate datetime against the cron expression, collect matches until N=10 runs. Optimization: skip forward by large jumps (e.g., if month doesn't match, jump to next month's 1st). Cap iterations at 4 years look-ahead to prevent infinite loops on impossible dates (Feb 30). Handle DST transitions: when advancing time crosses a DST boundary, use the browser's local timezone (via Intl.DateTimeFormat or Date/Intl APIs) to compute correct local time.</next_run_computation>
    <timezone_handling>Localize next-run times to the user's selected timezone via Intl.DateTimeFormat with timeZone option, or date-fns `utcToZonedTime` + `format`. Intl is standard; date-fns is optional (add if iteration cap algo is too slow). Format next-run display as locale-aware date/time string (e.g., "Monday, July 15, 2026 at 9:00 AM EDT").
</timezone_handling>
    <validation>zod v3.x for cron expression schema and settings store (timezone, recents).</validation>
    <localStorage>jurepi-cron-parser key; zod-validated store (expression, timezone, recents); auto-prune invalid on load.</localStorage>
    <presets>Curated cron constant module (`lib/cron-parser/presets.ts`) with named expressions (every 5 min, weekdays 9am, 1st of month, etc.). Localized display names via i18n.</presets>
    <testing_strategy>Golden vectors: test against known cron expressions with expected next-run results (e.g., `0 9 * * MON-FRI` should compute weekdays). Verify edge cases (leap years, month boundaries, DST transitions, impossible dates like Feb 30). Use a reference cron lib (as an external test oracle, not shipped) to validate computed times.
</testing_strategy>
  </module_specific>
  <libraries>
    <parser_option_1>Hand-written parser: ~300 LOC, no external deps, full control, suitable if performance is critical.</parser_option_1>
    <parser_option_2>cron-parser v3.1+ (MIT) or cron-schedule (small, pure JS, MIT). Evaluate at implementation time for size + API fit.</parser_option_2>
    <date_handling>Intl.DateTimeFormat (standard, builtin) for timezone conversion. Optional: date-fns v2/3 (ESM tree-shakeable, small) for DST-aware date arithmetic if hand-written iteration is too slow.</date_handling>
    <zod>zod v3.x — already in repo; reused for expression + settings schema validation.</zod>
  </libraries>
  <note>CRITICAL: NO backend, NO API calls, NO network. All computation is client-side, deterministic.</note>
</technology_stack>

<file_structure>
src/
├── lib/cron-parser/                       # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: CronExpression, ParsedFields, DescriptionModel, Settings
│   ├── tokenizer.ts                       # tokenizeCron(expr: string): tokens | { error: SyntaxError }
│   ├── parser.ts                          # parseCron(expr): ParsedFields | { error: ParseError } (field-by-field validation)
│   ├── validator.ts                       # validateFields(fields): { isValid, errors: FieldError[] }
│   ├── description.ts                     # toDescriptionModel(fields): DescriptionModel (structured, no English)
│   ├── next-runs.ts                       # computeNextRuns(fields, {now, timezone, limit, maxYears}): DateTime[]
│   ├── macros.ts                          # expandMacro(macro): ParsedFields (e.g., @daily → 0 0 * * *)
│   ├── presets.ts                         # PRESET_EXPRESSIONS: typed constant
│   ├── timezone-list.ts                   # TIMEZONE_NAMES: IANA timezone strings
│   └── constants.ts                       # Field ranges, field names, common constants
├── components/tools/cron-parser/
│   ├── CronParser.tsx                     # Orchestrator (Client Component) — state owner
│   ├── useCronParser.ts                   # Hook: expression/timezone/recents state, localStorage persist
│   ├── ExpressionInput.tsx                # Text field for cron expression; onChange → debounce → parse
│   ├── TimezoneSelector.tsx               # Dropdown: "Local" + IANA timezones
│   ├── ParseResultDisplay.tsx             # Conditional: show parsed fields table, description, or error
│   ├── FieldBreakdownTable.tsx            # Table: minute, hour, dom, month, dow columns; parsed values in each
│   ├── DescriptionText.tsx                # Human-readable description (from DescriptionModel, rendered with i18n)
│   ├── NextRunsList.tsx                   # Table or list: 10 upcoming run times (formatted, timezone-localized)
│   ├── ErrorMessage.tsx                   # Friendly error display for invalid expression or no-upcoming-runs state
│   ├── PresetExpressions.tsx              # Dropdown or button grid: load preset into expression field
│   ├── RecentsList.tsx                    # List of recent expressions (max 20); load/delete buttons
│   ├── CronCheatsheet.tsx                 # Collapsible reference: syntax legend (*, ranges, steps, names, macros)
│   ├── CronParserIntro.tsx                # H1 + lead (SEO long-form)
│   ├── CronParserHowTo.tsx                # "Cron basics", "field meanings", "common patterns", "timezone tips" (SEO)
│   ├── CronParserFaq.tsx                  # FAQ + FAQPage JSON-LD (e.g., "What's dom/dow mutual exclusion?", "Why 0–6 for day-of-week?")
│   └── CopyButton.tsx                     # Copy expression to clipboard (with toast feedback)
└── i18n/messages/{ko,en}.json             # tools.cron-parser.* UI chrome
</file_structure>

<core_data_entities>
  <parsed_fields>
    - minute: number[] (0–59).
    - hour: number[] (0–23).
    - dom: number[] (1–31, day of month).
    - month: number[] (1–12).
    - dow: number[] (0–6, where 0 = Sunday; or mapped from SUN–SAT names to 0–6).
    - isValid: boolean.
    - error?: { field: string; message: string } — if any field is invalid.
  </parsed_fields>
  <description_model>
    - frequencyKind: enum (everyMinute, everyNMinutes, everyHour, everyDay, everyWeekday, everyWeekend, monthly, yearly, custom).
    - atTimes?: { hour: number; minute: number }[] — when the job runs each day.
    - onDays?: string[] — names like "MON", "TUE" (if dow specified).
    - onMonths?: string[] — names like "JAN", "FEB" (if month specified).
    - onDatesOfMonth?: number[] — day numbers (if dom specified).
    - explanation?: string — fallback English (should not ship; use i18n parts instead).
  </description_model>
  <next_run>
    - datetime: Date object (in the user's selected timezone, formatted as locale-aware string).
    - formatted: string — e.g., "Monday, July 15, 2026 at 9:00 AM EDT".
    - utc: string — ISO 8601 UTC for technical reference (optional).
  </next_run>
  <settings>
    - timezone: string — IANA timezone name (e.g., "America/New_York") or "Local".
    - lastExpression?: string — persisted.
    - recents?: string[] — array of recent expressions (max 20).
  </settings>
  <constants>
    - DEBOUNCE_MS = 200ms (parse on keystroke delay).
    - NEXT_RUNS_LIMIT = 10.
    - MAX_LOOKAHEAD_YEARS = 4 (iteration cap to prevent infinite loops).
    - FIELD_RANGES = { minute: [0, 59], hour: [0, 23], dom: [1, 31], month: [1, 12], dow: [0, 6] }.
  </constants>
</core_data_entities>

<route_definitions>
/[locale]/tools/cron-parser
  - SSG page.
  - Breadcrumb: Home > Tools > Cron Parser.
  - Metadata: from `generateMetadata(locale)` using `seo.absoluteToolUrl('cron-parser', locale)` as canonical.
  - Error Boundary wraps the CronParser component.
  - Intro/HowTo/Faq sections rendered outside `mounted` gate (SSR).
  - ShareButtons auto-wired by route template.
</route_definitions>

<component_hierarchy>
CronParser (Client Component, root)
├── ExpressionInput (text field, onChange → debounce → parse)
├── TimezoneSelector (dropdown, onChange → recompute next-runs)
├── ParseResultDisplay (conditional: show parsed fields OR error)
│   ├── FieldBreakdownTable (if valid)
│   ├── DescriptionText (human-readable, from i18n)
│   ├── NextRunsList (10 upcoming occurrences)
│   └── ErrorMessage (if invalid)
├── PresetExpressions (button grid or dropdown)
├── RecentsList (list of saved expressions, load/delete)
├── CronCheatsheet (collapsible accordion)
├── CopyButton (copy expression to clipboard)
└── [ErrorMessage component] (conditional, top-level error or no-runs state)

Server Components (SEO):
├── CronParserIntro (H1 + lead paragraph)
├── CronParserHowTo (multi-section guide)
├── CronParserFaq (Q/A pairs, FAQPage JSON-LD emitted by Faq component)
└── StructuredData (SoftwareApplication JSON-LD, url == canonical)
</component_hierarchy>

<pages_and_interfaces>
Interactive Tool (Client SPA):
  - ExpressionInput: One-line or multi-line text field (monospace font), aria-label "Cron expression", onChange → debounce 200ms → re-parse + re-compute.
  - TimezoneSelector: Dropdown listing "Local" + IANA zones (America/New_York, Europe/London, Asia/Tokyo, etc.), onChange → recompute next-runs in new timezone, format times accordingly.
  - FieldBreakdownTable: A clean table (or div grid on mobile) with columns: field name (minute, hour, dom, month, dow), parsed values (e.g., [0, 15, 30, 45] or [MON, TUE, WED]). If a field is wildcard (*), show "All" with a tooltip "wildcard matches all values".
  - DescriptionText: Single paragraph or short multi-line, locale-aware (ko/en), e.g., "Every weekday (Monday–Friday) at 9:00 AM".
  - NextRunsList: Table-like list (or card grid on mobile) with columns: occurrence # (1–10), date, time, timezone abbreviation (EDT, JST, etc.). Click row → copy to clipboard? (optional interaction). If no upcoming runs within 4 years, show "No upcoming runs found."
  - PresetExpressions: Dropdown ("Load preset…") or button grid listing "Every 5 minutes", "Weekdays at 9 AM", "First of month at midnight", etc. Click → populate expression field + parse.
  - RecentsList: Collapsible section listing recent expressions (text preview, load/delete buttons). Max 20.
  - CronCheatsheet: Collapsible accordion with sections: Syntax Overview, Field Meanings, Common Values, Ranges & Steps, Names (Month/Day), Macros, Gotchas (dom/dow mutual exclusion, 0–6 for dow, leap years).
  - ErrorMessage: Inline callout (role=alert) if expression is invalid or no upcoming runs. Shows friendly message + suggestion.
  - CopyButton: Copy expression to clipboard; toast "Copied!" on success.

SEO/Long-form (SSR):
  - CronParserIntro: H1 "크론 표현식 해석기" + brief lead explaining the tool.
  - CronParserHowTo: Sections (multi-paragraph each): "Understanding Cron Fields", "Common Scheduling Patterns", "Time Zone Considerations", "Daylight Saving Time Edge Cases".
  - CronParserFaq: 6–8 Q/A pairs (localized, e.g., "What's the difference between dom and dow?", "Why is day-of-week 0–6, not 1–7?", "How do I schedule something for the 15th of every month?", "What happens during daylight saving time?"). FAQPage JSON-LD emitted by Faq component.
</pages_and_interfaces>

<core_functionality>
1. **Parsing & Validation**: User enters a 5-field cron expression. On keystroke (debounced 200ms), tokenize and parse each field. Validate ranges (minute 0–59, hour 0–23, etc.); map names (JAN-DEC, SUN-SAT); expand wildcards and steps. If any field is invalid, show friendly error ("Day-of-month: invalid value 32"). Otherwise, build ParsedFields object.

2. **Description Generation**: From ParsedFields, generate a DescriptionModel (structured, not English prose). E.g., { frequencyKind: 'everyWeekday', atTimes: [{ hour: 9, minute: 0 }] }. UI layer renders this model using i18n keys to produce locale-aware text.

3. **Next-Run Computation**: Starting from current time (or next applicable occurrence), iterate through candidates, testing each against the cron expression. Optimize by skipping ahead (e.g., if month doesn't match, jump to next month). Collect 10 matches, cap at 4 years look-ahead. Format each with locale-aware date/time + timezone abbreviation.

4. **Timezone Handling**: User selects timezone (or "Local"). Next-run computation is done in UTC internally; results are converted to the user's timezone for display via Intl.DateTimeFormat. DST transitions are handled automatically by the browser's timezone database.

5. **Preset Loading**: User selects a preset expression from dropdown/grid → expression field is populated → re-parse + re-compute + results update.

6. **Copy Operations**: User copies expression → navigator.clipboard (with textarea fallback). Toast feedback on success.

7. **Cheatsheet & Help**: Collapsible cheatsheet with syntax reference, field meanings, common patterns, and gotchas (dom/dow mutual exclusion, day-of-week 0–6 semantics, impossible dates).
</core_functionality>

<error_handling>
- **Invalid Field Value** (e.g., minute 61): Catch during parsing, display friendly error: "Minute field: invalid value 61 (must be 0–59)".
- **Unsupported Syntax** (L, W, #, ?): Display "Quartz syntax not supported. Use standard POSIX cron: *, ranges (1-5), steps (*/15), lists (1,3,5), names (JAN-DEC, SUN-SAT)."
- **Malformed Range or Step** (e.g., "1-5-9"): Display "Invalid range syntax. Use 'start-end' or 'start-end/step'."
- **Empty or Missing Fields**: If user enters "0 9 * *" (4 fields), display "Cron expression must have 5 fields (minute hour dom month dow)."
- **No Upcoming Runs**: If the expression is valid but no matches found within 4 years (e.g., Feb 30), show "No upcoming run times found within the next 4 years."
- **localStorage unavailable**: In-memory fallback (recents lost on reload). User is NOT shown an error.
- **Timezone not recognized**: If a saved timezone is no longer available (unlikely for IANA names), fall back to Local.
- **Invalid macro** (e.g., @hourlyy): Display "Unknown macro. Valid macros: @yearly, @monthly, @weekly, @daily, @hourly."
</error_handling>

<aesthetic_guidelines>
- Accent color (rose — `#fb7185` / var(--accent-rose)) used for: highlight important next-run dates, active timezone in dropdown, button hover states.
- Monospace font (Monaco, Courier New) for: expression input, field values in breakdown table, upcoming timestamps.
- Field breakdown table styled with subtle row separators; hover state lifts row slightly (shadow).
- Cheatsheet in collapsible accordion; section headers use headline typography, code examples use monospace, syntax rules use accent color for highlights.
- Next-runs list as table on desktop, stacked cards on mobile (≤600px). Each run shows date (large), time (large), timezone (small, secondary color).
- Dark theme colors: accent-rose in dark mode brightens via --dark-accent-rose or similar.
- Reduced motion: disable row hover lift, cheatsheet accordion opens instantly, no slide animation.
- Focus visible: all buttons and interactive elements have `focus-visible` ring (use --focus-ring color).
</aesthetic_guidelines>

<security_considerations>
- **Input Validation**: Cron expression is a user-supplied string (textarea, not eval). Parsed via a safe tokenizer/parser (no dynamic code execution). No security risk from user-supplied schedules.
- **localStorage Injection**: Validate loaded settings with zod before using. Fail gracefully if schema is invalid (discard recents, fresh start).
- **No Network Leaks**: Timezone names are static (IANA list). No user schedule or expression data is sent to the network.
- **XSS Prevention**: Description text and error messages render via React (safe by default). No dangerouslySetInnerHTML.
</security_considerations>

<advanced_functionality>
- **Dom/Dow Mutual Exclusion**: In standard cron, if BOTH dom and dow are specified (not wildcards), the expression matches if **either** condition is true (OR logic, not AND). E.g., `0 9 15 * MON` means "at 9 AM on the 15th of any month OR any Monday". Explain in cheatsheet + FAQ with example.
- **Day-of-Week Semantics**: Day 0 = Sunday, 1 = Monday, …, 6 = Saturday. Some systems allow 7 = Sunday (alternate). This tool uses 0–6 standard POSIX; if user enters 7, interpret as 0 (Sunday).
- **Leap Years & February**: Feb 29 exists only in leap years. Expression `0 0 29 2 *` runs every leap year on Feb 29. Next-run computation must skip non-leap-year Feb 29 candidates.
- **Month Boundaries**: Apr 31 doesn't exist; if expression specifies day 31, skip April's occurrence.
- **DST Transitions**: When local time springs forward (e.g., 2 AM → 3 AM), a time like 2:30 AM is skipped. When local time falls back (e.g., 2 AM → 1 AM, repeated), a time like 1:30 AM occurs twice. The tool uses the browser's Intl.DateTimeFormat, which handles DST correctly; document the behavior in FAQ.
</advanced_functionality>

<final_integration_test>
Scenario 1: **Weekdays at 9 AM** — User enters `0 9 * * MON-FRIor loads "Weekdays at 9 AM" preset. Parsed fields show: minute=[0], hour=[9], dom=[1-31], month=[1-12], dow=[1,2,3,4,5]. Description: "Every weekday (Monday–Friday) at 9:00 AM". Next-runs lists 10 upcoming Monday-Friday 9 AM times. Timezone selector allows swapping (EST → JST, times update correctly).

Scenario 2: **Invalid field — day 32** — User enters `0 0 32 1 *`. Parser catches invalid dom value 32, displays "Day-of-month field: invalid value 32 (must be 1–31)." No crash; app remains usable.

Scenario 3: **Leap year February 29** — User enters `0 0 29 2 *`. Parser succeeds. Description: "At midnight on February 29 (every leap year)." Next-runs lists Feb 29 of upcoming leap years (2028, 2032, etc.), skipping non-leap years.

Scenario 4: **Preset macro @daily** — User selects @daily from presets. Expanded to `0 0 * * *`. Next-runs shows "tomorrow at midnight, day after tomorrow at midnight", etc., each day at 12:00 AM in selected timezone.

Scenario 5: **Timezone DST transition** — User selects "America/New_York". A cron run falls during spring-forward (skipped time 2–3 AM). Tooltip or FAQ explains the skipped run time during DST.

Scenario 6: **No upcoming runs (Feb 30)** — User manually enters `0 0 30 2 *` (February 30th, which never exists). Parser accepts (dom=30 is in range 1–31), but next-run computation finds no matches within 4 years. Result: "No upcoming run times found within the next 4 years."

Scenario 7: **Quartz syntax error** — User enters `0 0 L * *` (Quartz L for "last day of month"). Parser shows: "Quartz syntax not supported. Use standard POSIX cron." Suggests the correct POSIX workaround if applicable.

Scenario 8: **Copy & recent** — User enters a valid expression, clicks "Copy to clipboard". Toast "Copied!" appears. Next refresh or new session, RecentsList shows the saved expression. Click → re-load into input.

Scenario 9: **Locale switching (ko/en)** — User switches language via header. All UI strings (field labels, error messages, description text) update via next-intl. Cron expression itself is language-agnostic (numbers + names like MON, JAN are English conventions). FAQ/HowTo sections also re-render in selected language.

Scenario 10: **Mobile responsive** — On 320px width, field breakdown table becomes single-column cards. Next-runs list is stacked cards (date large, time large). Cheatsheet collapsible. No horizontal scroll. Touch targets ≥44×44px. Timezone dropdown works (dropdown scrolls if long).
</final_integration_test>

<success_criteria>
- **Correctness**: Cron parsing matches standard POSIX semantics (5-field, wildcards, ranges, steps, names). Next-run computation accounts for month boundaries, leap years, and DST. dom/dow mutual exclusion is correct (OR logic).
- **Safety**: No uncaught errors; invalid expressions show friendly messages; no infinite loops (4-year cap on iteration).
- **Usability**: Parse/describe/compute all complete in <200ms for typical expressions. Error messages are actionable (specify field, range, suggestion).
- **Accessibility**: WCAG 2.1 AA; keyboard navigation; screen reader announces results and errors; prefers-reduced-motion respected.
- **Localization**: All user-facing strings (descriptions, error messages, field names, help text) in i18n namespace `tools.cron-parser.*` (ko/en). Description generation uses i18n parts, not English templates.
- **Timezone**: Next-run list displays times in user-selected timezone with DST-aware formatting. Timezone selector includes "Local" + major IANA zones. Time string includes timezone abbreviation (EDT, JST, etc.).
- **Mobile**: Responsive layout (320px+); no horizontal scroll; touch interactions work.
- **SEO**: Title, description, Intro/HowTo/FAQ indexed; SoftwareApplication + FAQPage JSON-LD emitted; canonical URL correct.
- **Platform Integration**: Registry entry added (id, slug, accent, category, status, addedAt); route with proper generateMetadata and Error Boundary; ShareButtons auto-wired.
</success_criteria>

<build_output>
File structure under src/:
- lib/cron-parser/ (9 modules, ~600 lines total, 95%+ unit test coverage)
- components/tools/cron-parser/ (13 component files, ~700 lines total, 85%+ coverage)
- i18n/messages/{ko,en}.json (tools.cron-parser.* keys added; ~100 strings)

Registry entry (tools/registry.ts):
```ts
{
  id: 'cron-parser',
  slug: 'cron-parser',
  category: 'dev',
  icon: 'Clock', // or similar lucide icon
  accent: 'rose',
  status: 'live',
  order: 125,
  addedAt: '2026-07-10',
  keywords: ['cron', 'schedule', 'job', 'timezone', 'next-run', 'crontab']
}
```

i18n keys (tools.cron-parser.*):
- title, description (top-level, dashboard card)
- expressionLabel, timezoneLabel, parseLabel, presetLabel
- fieldNames: minute, hour, dom, month, dow
- fieldRanges: (display ranges)
- noUpcomingRuns, invalidField, unsupportedSyntax
- descriptionTemplates: (parts for building descriptions: "everyDay", "weekdayAt", "monthlyOn", etc.)
- cheatsheet.title, cheatsheet.sections[…]
- howTo.title, howTo.sections[…]
- faq.items[{q, a}]

Sitemap: single /[locale]/tools/cron-parser entry (no spoke routes; single-page interactive tool).

SEO metadata:
- canonical: seo.absoluteToolUrl('cron-parser', locale)
- og:title, og:description from i18n title/description
- JSON-LD: SoftwareApplication (url == canonical), FAQPage emitted by Faq component

Build time: ~8–12 seconds (vitest + tsc + next build).
</build_output>

<key_implementation_notes>
1. **Registry Entry**: id/slug `cron-parser`, category `dev`, accent `rose`, status `live`, `addedAt: '2026-07-10'` (REQUIRED). Order = 125 (free slot between url-encoder 120 and rankings 130).

2. **i18n Namespace**: All user-facing strings in `tools.cron-parser.*`. Top-level `title` and `description` required. Descriptions are composed from i18n **parts** (e.g., `descriptionTemplates.everyWeekday`, `atTime`), not English prose templates in the domain.

3. **Critical Paths**:
   - Expression input → parse (field by field) → if valid, generate description model + compute next-runs.
   - Timezone change → recompute next-runs in new timezone, reformat times.
   - All timing uses native Date + Intl.DateTimeFormat (DST-aware).

4. **Test Strategy (TDD)**:
   - Domain (`lib/cron-parser/`): Unit tests for parser, validator, description model, next-run computation. Golden vectors (known expressions with expected next-run dates). Coverage ≥95%.
   - Components: Snapshot + RTL tests for ExpressionInput, FieldBreakdownTable, NextRunsList. Mock computeNextRuns for UI testing.
   - E2E (Playwright): Enter expression → parsed fields display → description rendered → next-runs computed and formatted in selected timezone.

5. **Recommended Build Order**:
   - Phase 1a: Domain (tokenizer, parser, validator, description model). TDD red→green.
   - Phase 1b: Next-run computation algorithm (with golden test vectors).
   - Phase 1c: Constants, presets, timezone list, localStorage schema (zod).
   - Phase 2a: Hook (useCronParser) + root CronParser orchestrator.
   - Phase 2b: Input components (ExpressionInput, TimezoneSelector).
   - Phase 2c: Display components (FieldBreakdownTable, DescriptionText, NextRunsList, ErrorMessage).
   - Phase 3: Preset/RecentsList, CronCheatsheet, CopyButton.
   - Phase 4: SEO (Intro, HowTo, Faq), registry entry, i18n keys.
   - Phase 5: E2E tests, design polish, accessibility audit.

6. **Parser: Build vs. Buy**: If cron-parser (npm) v3 is available, small, and MIT-licensed, consider it. Otherwise, hand-written parser is simple (~300 LOC) and gives full control. Verify bundle size + test pass before deciding.

7. **Next-Run Computation Optimization**: Naive minute-by-minute iteration over 4 years = ~2M iterations; slow. Optimize by:
   - Skip forward by months if month doesn't match.
   - Skip forward by hours/days if hour/dom/dow don't match.
   - Use Intl.DateTimeFormat to avoid Date object churn.
   - If hand-written is still slow, consider date-fns `nextDate` helper or similar.

8. **Dom/Dow Gotcha**: Explain clearly in FAQ + HowTo. Test with golden vectors like "0 0 15 * MON" (15th OR Monday).

9. **DST Explanation**: Document in FAQ: "During daylight saving time transitions, some times are skipped (spring forward) or repeated (fall back). This tool uses your browser's timezone database to handle DST automatically. If a scheduled time is skipped, the next valid occurrence is used."

10. **Copy Button UX**: Copy expression (not description or next-runs). Toast "Copied! Expression: [preview]" on success.
</key_implementation_notes>

</project_specification>
```
