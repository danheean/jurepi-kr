# D-Day Calculator — Count Days to/from Target Dates — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **D-Day Calculator** (디데이 계산기) — a date arithmetic tool that counts days to/from a target date, shows D-Day status (D-Day / D-<n> / D+<n>), calculates days between two dates, and adds/subtracts days (or weeks/months) from a base date. All dates are computed in local time (no UTC drift). Users can save named events to localStorage, each with live D-day display. The tool mounts as a client-side SPA offering three interactive modes (tabs) without full page reload.
> Internal service codename: `dday-calculator`. Registry id: `dday-calculator`. Public URL slug: `/[locale]/tools/dday-calculator`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/new-word/SPEC.md`](../../text/new-word/SPEC.md)

```xml
<project_specification>

<project_name>D-Day Calculator — Date Countdown & Arithmetic (Jurepi tool, codename dday-calculator, registry id dday-calculator)</project_name>

<overview>
D-Day Calculator solves a simple need: "How many days until my exam/vacation/deadline?" and "What date is 30 days from now?" A user picks a target date (exam day, anniversary, etc.) and the tool instantly shows D-Day status (today is D-Day / 3 days to go = D-3 / 5 days past = D+5) plus a breakdown into weeks/days. The tool also supports "days between two dates" (for counting project duration) and "add/subtract N days" (for quick date math). All computation is local-midnight, leap-year aware, and timezone-correct. Users can save named events in localStorage and see each one's live D-day count in a persistent list.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database. The only first-party persistence is `localStorage` (saved events). Nothing is sent over the network.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — mode switching (D-Day / Days Between / Date Arithmetic), adding events, deleting, live updates — happens via local React state with NO route navigation and NO full page reload. Date navigation and mode tabs are instant and non-blocking.

CRITICAL (local-time date math, never UTC): Reuse and adapt the proven local-midnight date engine from qna-a-day (src/lib/qna-a-day/date.ts). Dates are always `toDateKey()` (YYYY-MM-DD in local time), parsed via `parseDateKey()` (local midnight), and compared without UTC conversion. Leap years tested. Today's date from `new Date()` (local) — never Date.UTC().

CRITICAL (Intl locale for display, never i18n message keys): Format dates for display via `Intl.DateTimeFormat` using `useLocale()` (BCP-47: "ko"/"en") as the locale parameter. Never pass a translation key string to Intl. Date strings ("수요일" / "Wednesday", "2025년 1월 15일" / "January 15, 2025") come from Intl, not i18n messages.
</overview>

<platform_integration>
  - Route: /[locale]/tools/dday-calculator (SSG; registry slug "dday-calculator", id "dday-calculator", status "live", accent "grape", category "calculator").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.dday-calculator.*` (UI chrome strings: mode labels, button labels, placeholders, empty states, how-to, FAQ — NOT date strings; those come from Intl); the in_content AdSlot below the tool.
  - Platform dependency (SMALL — NO new category needed): the `'calculator'` category already exists in `ToolCategory` with the `grape` accent and the "계산기"/"Calculator" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Three interactive modes as tabs (no route change): (1) D-Day: target date → D-<n> / D-Day / D+<n> + weeks/days breakdown; (2) Days Between: start + end date → total days (inclusive option); (3) Date Arithmetic: base date + delta (±N days/weeks/months) → result date.
    - Saved events: add event (name + date), list (sorted by proximity to today), delete, localStorage persistence (auto-prune unknown entries).
    - Live D-day display: each saved event shows current D-day count; updates on every interaction (fast local recompute, no polling).
    - Optional "include start day" toggle (for "Days Between" mode): affects count logic.
    - Locale-aware date formatting via Intl.DateTimeFormat (no strftime templates; full i18n via Intl + BCP-47 locale).
    - Full keyboard support: Tab navigation, Enter/Space on controls, date picker focus, delete via menu.
    - Tool-specific SEO long-form ("When is D-Day?", "Countdown tips") + FAQ (FAQPage JSON-LD) + SoftwareApplication JSON-LD, localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Recurring dates / reminders / alarms / push notifications.
    - Syncing events across devices (no account / no backend).
    - Time-of-day precision (day granularity only; all times are midnight local).
    - Timezone selection (uses device timezone only).
    - Calendar view (MVP is list + input; Phase 2 candidate).
  </out_of_scope>
  <future_considerations>
    - Calendar/month view for saved events — Phase 2.
    - Sharing events (JSON/URL export, import) — Phase 2.
    - Recurrence patterns (e.g., "3rd anniversary every year") — Phase 2.
    - Dark theme support — Phase 2 (platform-wide).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <date_logic>Local-midnight date engine adapted from src/lib/qna-a-day/date.ts: toDateKey (YYYY-MM-DD), parseDateKey, addDays (DST-safe via setDate), daysInMonth, isLeapYear, today(). Pure domain; no external library needed (Date API only).</date_logic>
    <date_arithmetic>daysBetween(key1, key2, inclusive): count days; addDaysCount(key, delta): add/subtract; resolveMonthDelta(y, m, delta): handle month arithmetic (e.g., Jan 31 + 1mo → Feb 28/29).</date_arithmetic>
    <intl_formatting>Intl.DateTimeFormat for display dates; always use locale from useLocale() (BCP-47). Never pass i18n message key to Intl.</intl_formatting>
    <validation>zod v3.x (already in repo) for event schema (name, date, optional notes). Input dates validated before compute.</validation>
    <persistence>localStorage key: `jurepi-dday-calculator` (blob: {version, events: [{name, date, createdAt, notes}], lastTab}). Read zod-parsed; fail → start fresh (no throw). Unknown events pruned on load (if date is invalid).</persistence>
    <animation>Native CSS transitions only (tab fade, event card fade, date picker expand). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; event schema + store validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/dday-calculator/                    # Pure domain layer — no React/Next, fully unit-tested
│   ├── date.ts                             # Local-midnight date math (toDateKey, parseDateKey, addDays, daysInMonth, isLeapYear, today)
│   ├── arithmetic.ts                       # Domain logic: daysBetween, addDaysCount, resolveMonthDelta
│   ├── schema.ts                           # zod: EventRecord, StoreSchema; safeparse helpers
│   ├── store.ts                            # Immutable ops: addEvent, deleteEvent, pruneInvalid; sorted by proximity
│   └── display.ts                          # Formatters: formatDateKey (via Intl), ddayLabel (D-<n> / D-Day / D+<n>), weeksDaysBreakdown
├── components/tools/dday-calculator/
│   ├── DDayCalculator.tsx                  # Orchestrator (Client Component) — tab state + events + useDDayStore() owner
│   ├── useDDayStore.ts                     # Hook: dynamic catalog import + localStorage events + derived filters
│   ├── ModeTab.tsx                         # Tab pills: D-Day / Days Between / Date Arithmetic (segmented control)
│   ├── DDayMode.tsx                        # Target date picker → D-<n> display + weeks/days breakdown
│   ├── DaysBetweenMode.tsx                 # Start + end date pickers + optional include-start toggle → day count
│   ├── DateArithmeticMode.tsx              # Base date + delta (days/weeks/months with ±) → result date
│   ├── SavedEventsList.tsx                 # List of saved events, each showing name + date + live D-day count + delete button
│   ├── EventCard.tsx                       # Single event: name + formatted date + D-day + delete menu
│   ├── DateInput.tsx                       # Reusable date input (native <input type="date" /> with label + error)
│   ├── DDayLabel.tsx                       # Displays D-<n> / D-Day / D+<n> with optional weeks/days breakdown
│   ├── DDayCalculatorIntro.tsx             # H1 + lead (SEO; server-render where possible)
│   ├── DDayCalculatorHowTo.tsx             # "How to count D-day" / "Date arithmetic" (SEO long-form)
│   ├── DDayCalculatorFaq.tsx               # Q&A + FAQPage JSON-LD
│   └── styles/
│       └── dday-calculator.css             # Local styles (mode tabs, event cards, date inputs)
└── i18n/messages/{ko,en}.json              # tools.dday-calculator.* UI chrome (tabs, buttons, placeholders, empty states, how-to, FAQ)
</file_structure>

<core_data_entities>
  <event_record note="saved event; stored and displayed">
    - id: string — unique stable identifier (nanoid or slug from name + date)
    - name: string (required, 1–50 chars) — event label ("My Birthday", "Project Deadline")
    - date: DateKey (YYYY-MM-DD, required) — the target date (local midnight)
    - notes?: string (optional, ≤200 chars)
    - createdAt: number — timestamp when added
  </event_record>
  <store_blob note="single localStorage entry">
    - version: number (STORE_VERSION, starts at 1)
    - events: EventRecord[] — sorted by daysFromToday (nearest first)
    - lastTab: enum (dday | daysbetween | datearithmetic) — remember last active mode
    localStorage key: `jurepi-dday-calculator`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Invalid date keys pruned on load.
  </store_blob>
  <dday_status note="computed state for display">
    - D-<n> (n days until target, n > 0)
    - D-Day (today === target)
    - D+<n> (n days past target, n > 0)
    - breakdown: { weeks, days } (total weeks + remaining days)
  </dday_status>
  <constants>
    - MAX_EVENTS = 50; DEBOUNCE_SAVE = 300ms; EVENT_NAME_MAX_LEN = 50.
  </constants>
  <defaults>
    - New user: events empty; active tab "dday"; no event selected.
    - Date pickers: default to today (via today() utility).
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/dday-calculator" page="DDayCalculator (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. All interaction is local state; no sub-routes.</note>
</route_definitions>

<component_hierarchy>
  <dday_calculator>                <!-- "use client"; owns tab + dates + events state + useDDayStore() owner -->
    <dday_calculator_intro />       <!-- H1 + lead (server-render where possible) -->
    <mode_tab />                   <!-- D-Day / Days Between / Date Arithmetic pills (segmented) -->
    <dday_mode>
      <date_input label="Target date" />
      <dday_label shows="D-<n> / D-Day / D+<n> + weeks/days" />
      <button add_event />
    </dday_mode>
    <days_between_mode>
      <date_input label="Start date" />
      <date_input label="End date" />
      <toggle label="Include start day" />
      <result shows="N days" />
    </days_between_mode>
    <date_arithmetic_mode>
      <date_input label="Base date" />
      <delta_input label="Add/subtract" unit="days/weeks/months" />
      <result shows="Result date" />
    </date_arithmetic_mode>
    <saved_events_list>
      <event_card /> × N
      <empty_state when_no_events />
    </saved_events_list>
    <dday_calculator_how_to />      <!-- SEO long-form -->
    <dday_calculator_faq />         <!-- FAQPage JSON-LD -->
  </dday_calculator>
  <note>SPA within tool: tab/mode switches = local state switch, NOT route navigation. All modes visible on same page or same persistent view (no modal/sheet required).</note>
</component_hierarchy>

<pages_and_interfaces>
  <dday_calculator_intro>
    - Eyebrow: "계산 도구" / "CALCULATOR TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "디데이 계산기" / "D-Day Calculator" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "목표 날짜까지 남은 날을 세고, 언제가 D-Day인지 확인하세요. 30일 후가 언제인지도 바로 계산!" / English equivalent.
  </dday_calculator_intro>

  <mode_tab>
    - Horizontal segmented control (3 pills): "디데이" / "사이" / "계산" (ko) or "D-Day" / "Between" / "Arithmetic" (en).
    - Active = brand var(--brand) background / on-brand text; inactive = var(--surface-muted) / var(--text-secondary); focus-visible 2px var(--brand) ring.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active. Flex full width, gap 8px.
  </mode_tab>

  <dday_mode>
    - Card var(--surface), radius var(--radius-xl) 20px, padding 20px.
    - Label "목표 날짜" / "Target date" (14px var(--text-secondary) caption).
    - Date input (native <input type="date" />, full width, 40px height, DESIGN text-input style).
    - Output region: large D-<n> / D-Day / D+<n> label (32px var(--text)/700), below "example: 3주 2일" / "e.g., 3w 2d" (14px var(--text-muted)).
    - Button "저장" / "Save" (brand var(--brand), 16px button) — adds event to list; debounced 300ms to avoid dupe rapid clicks.
  </dday_mode>

  <days_between_mode>
    - Two date inputs vertically stacked (start + end), 16px gap.
    - Toggle "시작일 포함" / "Include start day" (default off; affects count by ±1).
    - Output: "N일" / "N days" in large text (32px var(--text)/700).
  </days_between_mode>

  <date_arithmetic_mode>
    - Date input (base date).
    - Horizontal row: text input (±N number), select (days/weeks/months), = result date display.
    - Result: formatted date (via Intl), editable (click to change delta, re-compute).
  </date_arithmetic_mode>

  <saved_events_list>
    - Heading "저장된 일정" / "Saved Events" (18px var(--text)/700).
    - Card list (one per event), each: name + formatted date (14px var(--text-secondary)) + live D-day label (large purple var(--accent-grape)) + delete button (icon, 32px tap target, aria-label "Delete {name}").
    - Event cards clickable to edit (future Phase 2) or just display.
    - Empty state: "일정을 저장하면 여기에 표시됩니다." / "Save an event to see it here" + hint "위의 탭에서 계산 후 저장을 누르세요." (14px var(--text-muted)).
  </saved_events_list>

  <keyboard_shortcuts>
    - Tab between inputs; Enter/Space on buttons; ← → switch mode tabs; Delete on event card focuses + deletes.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <domain_layer note="src/lib/dday-calculator/* — pure, unit-tested ≥90%">
    - date.ts: toDateKey (format), parseDateKey (parse), addDays (DST-safe), daysInMonth, isLeapYear, today.
    - arithmetic.ts: daysBetween (start, end, inclusive) → days; addDaysCount (date, delta) → new date; resolveMonthDelta (handle month overflow).
    - display.ts: formatDateKey (Intl-backed), ddayLabel (compute status), weeksDaysBreakdown.
    - store.ts: addEvent, deleteEvent, sortByProximity, pruneInvalid — all immutable.
  </domain_layer>
  <hook_adapter note="useDDayStore">
    - Mount: read `jurepi-dday-calculator` → zod → pruneInvalid; fail → start fresh. Expose: events, addEvent, deleteEvent, today().
    - Change: debounced JSON.stringify → setItem (300ms). Catch quota/security → keep in-memory (fully usable without persistence).
  </hook_adapter>
  <i18n>All UI chrome from tools.dday-calculator.* (ko/en): tabs, labels, buttons, placeholders, empty states, how-to, FAQ. Date strings (formatted dates, day names) come from Intl.DateTimeFormat(useLocale()), not i18n messages.</i18n>
</core_functionality>

<error_handling>
  <input_validation>Invalid date (e.g., Feb 30) → native <input> rejects or browser shows warning; backup zod parse on submit → toast error "날짜를 다시 확인하세요" / "Please check the date".</input_validation>
  <edge_cases>Target = today → D-Day; leap year Feb 29 → addDays handles via setDate() (DST-safe); far-future dates (year 9999) → no overflow (JS Date handles).</edge_cases>
  <storage>
    <unavailable>Private mode/disabled → events in-memory, fully usable, no error shown.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (events not precious, no throw).</corrupt_blob>
    <quota>setItem throw → keep in-memory; no user error.</quota>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is GRAPE (var(--accent-grape) / var(--accent-grape-soft)) — "calculator" category identity per DESIGN. Intro icon tile, D-day labels, saved events accent, favorite star (if any).
    - CTAs (primary buttons "저장") stay brand honey-gold var(--brand) (DESIGN do/don't).
    - Date input focus rings: var(--accent-grape) for tool identity.
  </accent_usage>
  <surfaces>Card/input = var(--surface) + 1px var(--hairline); radius --radius-xl 20px; button radius --radius-lg 16px. Soft grape-tinted shadows on cards, hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); D-day label (32px var(--text)/700); input/button Pretendard 15–16px; caption 14px var(--text-muted).</typography>
  <motion>transform/opacity only: date input focus blur 4px soft, button press scale 0.99, card fade-in 150ms. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (instant fade, no scale).</motion>
  <accessibility>Inputs labeled; buttons real buttons; tabindex managed; date picker native HTML5; focus-visible ring 2px var(--focus-ring); ≥44px tap targets; visible focus rings on all interactive. WCAG 2.1 AA contrast: D-day label var(--accent-grape) on var(--surface); all text ≥4.5:1 ratio.</accessibility>
  <responsive>
    - ≥1024px: two-column layout (modes left, events right, both full visible).
    - 768–1023px: single column, modes stacked, events below.
    - <768px: single column, compact spacing, modal/drawer for event details (Phase 2). Date inputs full width 320px-safe.
  </responsive>
  <atmosphere>Bright, helpful "D-day counter": generous card spacing, large readable D-day labels, one clear result per mode. Inviting (warm, clear) like Jurepi.</atmosphere>
  <icons>lucide-react: Calendar (date picker), Plus (add event), Trash2 (delete), ChevronLeft/Right (tab nav), Clock (time-related). Default 20px, stroke 1.75, currentColor. Registry card icon: `CalendarClock`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="dates + event names; first-party user data">
    - Date inputs: <input type="date" /> (native browser validation); zod parse on submit.
    - Event names: 1–50 chars, rendered as text nodes (React escape). No dangerouslySetInnerHTML.
    - Never eval or dynamic computation over user input.
  </input>
  <privacy>Events localStorage-only, never sent. No analytics event includes event names/dates.</privacy>
  <no_secrets>No secrets in code or NEXT_PUBLIC_*; no localStorage per-user auth; tool fully public.</no_secrets>
  <note>No network calls; no third-party storage; no PII leakage.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>D-Day mode: pick target date, see D-<n>, save event</description>
    <steps>
      1. Load /ko/tools/dday-calculator; Mode "디데이" is active.
      2. Pick a date 10 days from today → displays "D-10" (or equivalent).
      3. Click "저장" → event added to "저장된 일정" list with name prompt or auto-name.
      4. Reload page → event persists (localStorage); D-day count updates automatically.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Days Between mode: count days between two dates</description>
    <steps>
      1. Switch to "사이" tab.
      2. Pick start date (Jan 1) + end date (Jan 31) → shows "31일" (inclusive: 32 if "시작일 포함" toggled on).
      3. Toggle "시작일 포함" → count updates (±1 difference).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Date Arithmetic mode: compute date + delta</description>
    <steps>
      1. Switch to "계산" tab.
      2. Base date (today) + "30" days → result shows date 30 days from now.
      3. Change delta to "3" weeks → result updates.
      4. Change unit to "months", delta "1" → result shows 1 month from base.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Saved events, persistence, keyboard, a11y</description>
    <steps>
      1. Add 2 events (birthday, deadline) → list shows both sorted by proximity.
      2. Reload → events persist; D-day counts are live (recomputed).
      3. Delete one event → removed; localStorage updated.
      4. Tab through inputs; arrow keys switch modes; Enter on save; axe pass → no violations; focus-visible ring visible on all controls.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD), locale swap, leap year edge case</description>
    <steps>
      1. Switch to /en → chrome (tabs/buttons/how-to/FAQ) English; dates formatted via Intl.
      2. Build prod → /ko/tools/dday-calculator and /en/tools/dday-calculator unique title/description/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ localized.
      4. Pick Feb 29 (leap year) as target → arithmetic handles correctly (no off-by-one).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Three modes (D-Day, Days Between, Date Arithmetic) all compute correctly and instantly; saved events persist + update live; all edge cases (leap year, Feb 29, far-future dates, today=D-Day) handled correctly.</functionality>
  <user_experience>All calculations instant (&lt;10ms); date pickers/controls responsive; saved events sorted by proximity; full keyboard operable; ≥44px targets; focus visible; SPA — no reload on any interaction.</user_experience>
  <technical_quality>lib/dday-calculator/* pure ≥90% unit coverage (date/arithmetic/display/store); TS 0 errors; &lt;800 lines per file; dates always local-midnight (no UTC drift); Intl for display only (never pass i18n key to Intl).</technical_quality>
  <visual_design>DESIGN.md compliant; grape identity + brand honey-gold CTA; bright, friendly calculator (not austere); inputs/buttons designed; text-node render only.</visual_design>
  <accessibility>Full keyboard (Tab/ArrowKeys/Enter); aria-label on controls; native date input; visible focus-visible ring; WCAG 2.1 AA contrast; motion-respect.</accessibility>
  <performance>Tool route within platform budget; localStorage reads/writes sub-100ms; Intl formatting cached where possible; CLS unaffected (ad height platform-reserved); LCP &lt; 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/dday-calculator pre-rendered by platform generateStaticParams iterating registry (status "live"). No external data files; pure client logic + Intl at runtime.</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Date domain logic (src/lib/dday-calculator/date.ts + arithmetic.ts): local-midnight invariant; leap year; DST-safe addDays.
    2. D-day status computation + display labels (ddayLabel, weeksDaysBreakdown).
    3. Event persistence (localStorage zod schema + immutable ops + sort by proximity).
    4. Three mode views (DDayMode, DaysBetweenMode, DateArithmeticMode) with instant re-render.
    5. Intl.DateTimeFormat display (useLocale() BCP-47; never pass i18n key).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/dday-calculator/{date,arithmetic,schema,store,display}.ts Vitest (RED→GREEN): local date math (toDateKey/parseDateKey/addDays/daysInMonth/isLeapYear), daysBetween/addDaysCount/resolveMonthDelta, ddayLabel, event store immutable ops.
    2. tools.dday-calculator.* messages (ko/en): tabs, labels, buttons, placeholders, empty states, how-to, FAQ.
    3. useDDayStore hook (dynamic import + localStorage favorites/events + in-memory fallback + today adapter).
    4. ModeTab, DateInput, DDayLabel (reusables).
    5. DDayMode, DaysBetweenMode, DateArithmeticMode (three view components).
    6. SavedEventsList, EventCard (event display + delete).
    7. DDayCalculator orchestrator (state management + mode switching).
    8. Intro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via platform lib/seo.ts.
    9. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024/1440 both themes.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥90% (date/arithmetic/store); generator validation fixtures (leap year, Feb 29, month overflow); component catalog-injected mocks; E2E scenarios 1–5 (esp. #1 D-day compute + save, #4 persistence + keyboard, #5 i18n + leap year); localStorage jsdom-isolated.</testing_strategy>
  <date_safety>Always use local `new Date()` (never Date.UTC). Always format display dates via `Intl.DateTimeFormat(useLocale())` — never hardcode strings. Never pass i18n message key to Intl. Test Feb 29 leap year + non-leap year scenarios explicitly.</date_safety>
</key_implementation_notes>

</project_specification>
```

