# Unit Converter — Real-time multi-category unit conversion — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Unit Converter** (단위 변환기) — a client-side tool that converts measurements across eight common categories (length, mass, temperature, area, volume, speed, digital storage, time) with live keystroke-by-keystroke conversion, a full unit catalog per category, precision control, and localStorage recents. No backend, no live exchange rates; pure domain layer with affine-transform temperature logic and static conversion factor tables. The tool mounts as a Client Component SPA offering instant conversions and swappable from/to selectors.
> Internal service codename: `unit-converter`. Registry id: `unit-converter`. Public URL slug: `/[locale]/tools/unit-converter`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Unit Converter — Real-time Multi-Category Unit Conversion (Jurepi tool, codename unit-converter, registry id unit-converter)</project_name>

<overview>
Unit Converter answers the instant question "What is X feet in meters?" — a tool for converting measurements across eight everyday categories (length, mass/weight, temperature, area, volume, speed, digital storage, time). The user picks a category, enters a value in a "from" unit, and the UI shows the live, keystroke-by-keystroke conversion to any "to" unit. A full matrix of all unit pairs is always visible (the conversion table), letting them scan all available conversions at a glance. Swapping from/to is a single tap; adjusting decimal precision is a slider. Recent conversions live in localStorage so re-visiting the tool shows prior searches.

The tool's architecture is a pure domain layer (eight category-specific converters, each with base-unit factors or, for temperature, affine transforms a×°C + b) separated cleanly from React. Temperature (Celsius ↔ Fahrenheit ↔ Kelvin) is handled algebraically as an offset+scale, not a lookup table, ensuring exact round-trip accuracy. Every other category is factor-based: 1 km = 1000 m → all unit pairs derive from the meter/kilogram/second base system.

CRITICAL (client-only, SSG): 100% client-side. No backend, no API for live exchange rates (currency is explicitly out-of-scope), no network. The only first-party persistence is `localStorage` (recents), and nothing is ever sent over the network except from the tool's own UI events to its own state.

CRITICAL (live conversion, SPA): Per the platform rule, every Jurepi tool is a Single-Page Application (SPA). All interaction — category selection, typing in the input, unit picker toggle, precision slider, swap from/to, clearing recents — happens via local React state with NO route navigation and NO full page reload. Usability comes first: type a number and see all conversions update in under 50ms (debounced). The route is statically generated (SSG) for SEO/indexing; the interactive tool is a single client-component island on that static shell.
</overview>

<platform_integration>
  - Route: /[locale]/tools/unit-converter (SSG; registry slug "unit-converter", id "unit-converter", status "live", accent "sky", category "converter").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.unit-converter.*` (UI chrome strings: category labels, unit names, placeholders, how-to, FAQ — NOT conversion factors; those are pure code).
  - Platform dependency (NO new category needed): the `'converter'` category already exists in `ToolCategory` with the `sky` accent and the "변환"/"Converter" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Eight unit categories: length (mm, cm, m, km, in, ft, yd, mi), mass/weight (mg, g, kg, oz, lb), temperature (°C, °F, K), area (mm², cm², m², km², in², ft², yd², mi²), volume (mL, L, in³, ft³, gal), speed (m/s, km/h, mi/h, knot), digital storage (B, KB, MB, GB, TB), time (ms, s, min, h, day).
    - Live conversion as you type (debounced 50ms); keystroke input validates as a number (or empty).
    - Category selector (8 tabs or pills); selecting a category resets from/to unit to canonical pair but preserves value history.
    - From-unit + To-unit pickers (dropdown or combobox; default canonical pair per category, e.g., m/km for length, °C/°F for temperature).
    - Swap from/to button: flip the selected units and re-calculate (toggle icon).
    - Decimal precision slider: 0–6 decimals (live range input, inclusive); default 2.
    - Full conversion table: all unit pairs for the active category in a card grid or responsive table (read-only).
    - Recent conversions (localStorage): up to 20 most-recent (category, from_unit, to_unit, from_value, to_value, timestamp); displayed as a tappable history (pick to restore).
    - Keyboard support: Tab/Shift+Tab to move between controls; type number in input; arrow keys in unit picker; Esc to close picker.
    - Tool-specific SEO long-form ("Unit conversion for everyday needs") + FAQ (FAQPage JSON-LD) + SoftwareApplication JSON-LD.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Currency conversion — requires live exchange rates (3rd-party API dependency) which violates the no-backend/no-network constraint. Explicitly listed in future_considerations with the rationale.
    - Unit definitions/data CMS or user-submitted units. All units are compile-time constants.
    - Historical conversion rate tracking / charts.
    - Custom unit definitions by the user.
  </out_of_scope>
  <future_considerations>
    - Currency conversion (Phase 2+): would require live exchange rate API (e.g., Open Exchange Rates, Fixer.io). Adds network dependency, backend gateway, and rate-limit complexity. Rationale: free tier unpredictable, requires API key management, rate limits impact UX (non-instant conversion). Recommend as a separate tool or behind an opt-in consent gate.
    - More granular unit families (cooking volume, tire pressure, etc.) — Phase 2.
    - Unit symbol copy-to-clipboard — Phase 2.
    - Conversion history export (CSV) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <conversion_engine>Pure domain layer: eight category modules in `src/lib/unit-converter/` (framework-free, Vitest-tested). Each category exports: (1) UNITS constant (name, symbol, factor or temp-formula), (2) convert(fromValue, fromUnit, toUnit): number, (3) validateUnit(unit): boolean. Temperature uses affine: T_F = T_C × 9/5 + 32 (round-trip verified in tests).</conversion_engine>
    <precision>Rounding via `Number.toLocaleString()` with Intl.NumberFormat (preserves trailing zeros for 0.50 display if desired) OR custom toFixed/toPrecision logic (Vitest-tested for precision edge cases).</precision>
    <recents_store>Typed localStorage blob (zod schema): { version: 1, recents: [ { categoryId, fromUnit, toUnit, fromValue, toValue, ts } ], ...}. Immutable ops: addRecent(list, entry, max=20), pruneUnknown(list, validCategories/units), deserialize with fallback to empty.</recents_store>
    <icons>lucide-react: ArrowRightLeft (swap), Sliders (precision control), History (recent), Trash2 (clear), ChevronDown (picker toggle). 20px default, stroke 1.75, currentColor.</icons>
  </module_specific>
  <libraries>
    <zod>zod v3.x (already in repo) — validate recents store on load.</zod>
    <intl>Intl.NumberFormat (native) — format numbers with locale + precision.</intl>
    <no_animation_lib>CSS transitions only; no GSAP/Framer Motion.</no_animation_lib>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/unit-converter/                     # Pure domain layer — no React/Next, fully unit-tested ≥80%
│   ├── types.ts                            # Category, Unit, Conversion, RecentsStore types
│   ├── constants.ts                        # CATEGORIES, UNITS_BY_CATEGORY (8 categories × 8–12 units each)
│   ├── converters/
│   │   ├── length.ts                       # convert(value, fromUnit, toUnit): number; UNITS = {m, km, mi, ...}
│   │   ├── mass.ts                         # mass/weight converters
│   │   ├── temperature.ts                  # affine transform: T_F = T_C × 9/5 + 32; T_K = T_C + 273.15
│   │   ├── area.ts
│   │   ├── volume.ts
│   │   ├── speed.ts
│   │   ├── digital-storage.ts              # B, KB (1000), KiB (1024), MB, GB, TB
│   │   └── time.ts                         # ms, s, min, h, day
│   ├── convert.ts                          # Router: convert(category, value, from, to) dispatches to converter
│   ├── precision.ts                        # formatNumber(value, decimals, locale): string
│   ├── recents.ts                          # addRecent, pruneUnknown, deserialize store
│   ├── schema.ts                           # zod schemas: Unit, RecentsEntry, RecentsStore
│   └── __tests__/                          # Vitest: round-trip accuracy, edge cases, precision
├── components/tools/unit-converter/
│   ├── UnitConverter.tsx                   # Orchestrator Client Component; owns category/from/to/value/precision/recents state
│   ├── useUnitConverter.ts                 # Hook: conversion logic + localStorage recents + derived state
│   ├── CategoryTabs.tsx                    # 8 tabs (pills); selected = active category
│   ├── ConversionPanel.tsx                 # Input + from-unit picker, swap button, to-unit picker, precision slider
│   ├── ConversionInput.tsx                 # Number input (max 15 chars), placeholder, live onChange
│   ├── UnitPicker.tsx                      # Dropdown/combobox; filterable by unit name+symbol
│   ├── PrecisionSlider.tsx                 # Range 0–6, live onChange
│   ├── ConversionTable.tsx                 # Grid/table of all unit pairs; read-only; responsive 2–4 col
│   ├── RecentsPanel.tsx                    # Recent conversions history (up to 20); tap to restore
│   ├── UnitConverterIntro.tsx              # H1 + lead (SEO; server-render where possible)
│   ├── UnitConverterHowTo.tsx              # "How do unit conversions work?" (SEO long-form)
│   ├── UnitConverterFaq.tsx                # Q&A + FAQPage JSON-LD
│   └── styles/
│       └── unit-converter.css              # Tool-specific animations (input focus, swap rotate, grid flow)
└── i18n/messages/{ko,en}.json              # tools.unit-converter.* UI chrome (category names, unit symbols, placeholders, how-to, FAQ)
</file_structure>

<core_data_entities>
  <unit note="a single unit of measurement">
    - id: string (e.g. "meter", "foot", "kelvin")
    - symbol: string (e.g. "m", "ft", "K") — displayed in UI
    - category: enum (length, mass, temperature, area, volume, speed, digital_storage, time)
    - factor?: number — for non-temperature: ratio to base unit (e.g., meter=1, kilometer=1000, foot=0.3048)
    - tempFormula?: { a: number; b: number } — for temperature: T_target = T_source × a + b (e.g., C→F: a=9/5, b=32)
    INVARIANT: factor XOR tempFormula (not both).
  </unit>
  <category note="grouped by measurement type">
    - id: enum (length, mass, temperature, area, volume, speed, digital_storage, time)
    - label: string (from i18n tools.unit-converter.categories.<id>) — "Length" / "길이"
    - icon: lucide icon name
    - units: Unit[] — 8–12 units per category
    - canonicalPair: { from: string; to: string } — default from/to units on category select (e.g., length: m→km, temperature: C→F)
  </category>
  <conversion_result>
    - fromValue: number (validated, ≥0 except temperature)
    - toValue: number (computed, rounded to precision)
    - precision: number (0–6 decimals)
    - category: string (active category)
  </conversion_result>
  <recents_store note="single localStorage blob">
    - version: number (STORE_VERSION = 1)
    - recents: [ { categoryId, fromUnit, toUnit, fromValue, toValue, ts } ] (array, MRU first, max 20 de-duped on save)
    - metadata: { createdAt: number }
    localStorage key: `jurepi-unit-converter`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown units pruned on load (category evolution never leaves dangling entries).
  </recents_store>
  <constants>
    - RECENTS_MAX = 20; CONVERSION_DEBOUNCE = 50ms; PRECISION_MIN = 0; PRECISION_MAX = 6; PRECISION_DEFAULT = 2.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/unit-converter" page="UnitConverter (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <unit_converter>           <!-- "use client"; owns category/fromUnit/toUnit/value/precision/recents state + useUnitConverter() hook -->
    <unit_converter_intro /> <!-- H1 + lead (server-render where possible) -->
    <category_tabs />        <!-- All 8 categories as pills; roving tabindex; ArrowLeft/Right navigate -->
    <conversion_panel>       <!-- Grid layout: input + pickers + precision -->
      <conversion_input />   <!-- Number field; live onChange with validation -->
      <unit_picker />        <!-- Dropdown; click/focus to open; ArrowUp/Down/Enter; Esc close -->
      <swap_button />        <!-- Flip from↔to; rotate animation (200ms) -->
      <precision_slider />   <!-- Range 0–6 -->
    </conversion_panel>
    <conversion_table />     <!-- Read-only grid of all unit pairs (from × to) + conversion factors or symbols -->
    <recents_panel />        <!-- Tap to restore prior conversion; clear history button -->
    <unit_converter_how_to /><!-- SEO long-form -->
    <unit_converter_faq />   <!-- FAQPage JSON-LD -->
  </unit_converter>
  <note>SPA within tool: category/unit/precision/recents = local state switch, NOT route navigation.</note>
</component_hierarchy>

<pages_and_interfaces>
  <unit_converter_intro>
    - Eyebrow: "변환 도구" / "CONVERTER TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "단위 변환기" / "Unit Converter" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "길이·무게·온도·시간 등 일상의 측정값을 즉시 변환하세요." / English equivalent.
  </unit_converter_intro>

  <category_tabs>
    - Horizontal pill row (category-pill / category-pill-active). 8 categories: "길이"/"Length", "무게"/"Weight", "온도"/"Temperature", etc.
    - Active = sky accent fill (var(--accent-sky)) / dark text; inactive = surface-muted / text-secondary; hover lifts bg.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active; keyboard-focused tab is tabbable.
    - Narrow screens scroll horizontally + snap. Selecting a category resets from/to to canonical pair but keeps conversion history.
  </category_tabs>

  <conversion_panel>
    - Desktop grid: 4 columns (input, from-unit, swap, to-unit + precision below); tablet/mobile stack vertically.
    - ConversionInput: type="number" DESIGN text-input style, placeholder "값을 입력하세요" / "Enter value", validation tooltip on invalid (negative non-temperature, non-numeric).
    - UnitPicker (from/to): button style, text-primary, dropdown opens on click/focus. List shows 8–12 units (symbol + name), searchable (debounced 100ms), selected = highlight + checkmark. ArrowUp/Down navigate; Enter select; Esc close.
    - SwapButton: icon lucide ArrowRightLeft, 44px touch target, hover rotate(180deg) 200ms cubic-bezier, aria-label "단위 맞바꾸기" / "Swap units".
    - PrecisionSlider: range [0–6], thumb 16px, track 4px, color var(--accent-sky), live onChange updates display. Caption: "소수점 자리수: N" / "Decimal places: N".
  </conversion_panel>

  <conversion_table>
    - Responsive: ≥1024px 4-column matrix (unit × unit grid, cell = conversion factor or symbol pair); 768–1023px 2–3 col; <768px 1-col scrollable.
    - Each cell: from-symbol → to-symbol (e.g., "m → ft: 3.28084"). Surface var(--surface), border var(--hairline), radius var(--radius-md), padding 12px. Read-only; no interaction.
    - Empty state (if 0 units in category, never happens): friendly message.
  </conversion_table>

  <recents_panel>
    - Collapsible card or separate section: "최근 변환" / "Recent Conversions" (if recents exist).
    - Each recent: clickable chip or card showing "X fromUnit → toUnit = Y", timestamp (e.g., "2 minutes ago"), tap to restore that conversion to the input.
    - Clear button (icon Trash2): clears all recents; aria-label "변환 기록 삭제".
    - Empty state (no recents): friendly message "변환 기록이 없습니다" / "No conversions yet".
  </recents_panel>

  <keyboard_shortcuts_reference>
    - Tab → move to next control (input, from-picker, swap, to-picker, precision).
    - ArrowLeft/Right (tabs focused) → previous/next category.
    - ArrowUp/Down (unit picker open) → scroll unit list; Home/End → first/last.
    - Enter (picker focused) → select unit; Esc (picker open) → close.
    - Type in input → live conversion (50ms debounce); invalid = error color border.
    - (Future) "/" → focus input; already handled by input focus on category change.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <conversion_engine>
    - Eight category modules (length, mass, temperature, area, volume, speed, digital_storage, time) each export convert(value, from, to): number.
    - Non-temperature categories use factor-based: factor = unitA_baseRatio / unitB_baseRatio (e.g., 0.3048 m/ft).
    - Temperature uses affine: T_to = T_from × a + b (test validates C→F→C round-trip = original ±0.0001).
    - All calculations Float64; results rounded to precision decimals via toLocaleString(locale, {minimumFractionDigits, maximumFractionDigits}).
  </conversion_engine>
  <input_validation>
    - Type: number or empty string (cleared state).
    - Range: negative allowed for temperature only; ≥0 for all others (validate on input).
    - Non-numeric/overflow → red border; tooltip "숫자를 입력해주세요" / "Please enter a number".
  </input_validation>
  <live_conversion>
    - onChange in input debounced 50ms (stable, no jank); compute toValue = convert(fromValue, fromUnit, toUnit) at that precision.
    - Category/unit picker change → re-compute at current value + precision immediately.
    - Swap button → flip from/to and re-compute immediately.
    - Precision change → format display immediately, no re-conversion.
  </live_conversion>
  <persistence useUnitConverter>
    - Mount: read `jurepi-unit-converter` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable).
    - Change: addRecent called on every conversion (debounced 100ms to avoid spam); write JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: category, fromUnit, toUnit, fromValue, toValue, precision, recents, setCategory(), swap(), addRecent(), clearRecents().
  </persistence>
  <i18n>
    All UI chrome from tools.unit-converter.* (ko/en): category labels, unit names/symbols, placeholders, button labels, how-to, FAQ. Conversion factors/formulas are pure code (no i18n).
  </i18n>
</core_functionality>

<error_handling>
  <input_validation>
    - Non-numeric → red border + error icon + aria-live="polite" message "숫자를 입력하세요".
    - Negative non-temperature → same error.
    - Overflow (>1e308) → message "입력 범위를 초과했습니다" / "Number too large".
  </input_validation>
  <conversion_edge_cases>
    - Zero input → valid, toValue = 0 (all categories).
    - Very small/large magnitudes: 1e-10 m to 1e10 km → format with precision (no scientific notation unless necessary).
    - Temperature Kelvin < absolute zero (< -273.15 °C) → warn but don't block; show computed K (may be negative or invalid; educational).
  </conversion_edge_cases>
  <storage>
    <unavailable>Private mode/disabled → recents in-memory, no scary error. All conversions fully work.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (recents not precious, no throw).</corrupt_blob>
    <quota>setItem throw → keep in-memory; silent (copy to clipboard is secondary, conversions don't depend on it).</quota>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SKY (var(--accent-sky) #38bdf8 / var(--accent-sky-soft)) — "converter" category identity per DESIGN.
    - Intro icon tile, active tab, precision slider, unit picker highlight use var(--accent-sky).
    - CTAs (primary buttons) stay brand honey-gold var(--brand). Accent = identity, not action (DESIGN do/don't).
  </accent_usage>
  <surfaces>Input field = var(--surface) + 1px var(--hairline), focus 2px var(--focus-ring) offset 2px. Picker dropdown background var(--surface-muted), selected item var(--accent-sky-soft). Table cells var(--surface) light borders.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); category labels Pretendard 15px/600; input/picker text Pretendard 16px/500; unit symbols caption/eyebrow. Precision label 14px var(--text-secondary).</typography>
  <motion>Input focus expand (width ±4px) 100ms. Swap button rotate(180deg) 200ms --ease-out on click. Tab underline slide 150ms. Picker open slide-down (translateY -8px → 0) 150ms. All gated by prefers-reduced-motion (instant, no rotate/translate).</motion>
  <accessibility>Input/picker/slider = labeled real <input> / <button> / <select> elements (or accessible combobox with ARIA roles). Focus-visible rings 2px var(--focus-ring). ≥44px tap targets. Error messages aria-live="polite". Precision slider aria-valuetext = "2 decimal places". AA contrast: input text on white/surface, error red on white (contrast ≥4.5:1).</accessibility>
  <responsive>
    - ≥1024px: 4-column conversion table, horizontal pill tabs.
    - 768–1023px: 2–3 col table, horizontal scrolling tabs.
    - <768px: single column input/pickers, 1-col table (scrollable), tabs scroll horiz + snap. No overflow (320 test).
  </responsive>
  <atmosphere>Bright, friendly "handy unit converter": clear, immediate feedback (keystroke→result <50ms). Not a dense scientific calculator; focused single purpose. Matches Jurepi warm, clear brand.</atmosphere>
</aesthetic_guidelines>

<security_considerations>
  <input>User-entered numbers are validated as numbers before conversion (no code injection). NaN/Infinity checks at conversion layer. Output is text (React escapes).</input>
  <computation>Floating-point arithmetic is native JS Number (IEEE 754 Double). Rounding at display layer only (precision parameter). No unsafe eval or dynamic code generation.</computation>
  <privacy>Recents stored in localStorage (user device only), never sent. No analytics event includes conversion values. Optional GA can be gated by consent.</privacy>
  <content_integrity>Conversion constants (factors, formulas) are compile-time (no remote fetch). Unit tests validate derivations (e.g., C→F→C round-trip accuracy).</content_integrity>
  <note>No secrets, no network, no 3rd-party storage. Temperature formulas public (thermodynamics standard).</note>
</security_considerations>

<advanced_functionality>
  <conversion_table>Real-time matrix: all unit pairs in active category displayed as a browsable, scan-able reference (reduces repeat unit-picker clicks).</conversion_table>
  <recents_history>MRU recent conversions (localStorage) — restore prior conversion with one tap (reduce repeat typing).</recents_history>
  <precision_control>Fine-grained decimal places (0–6) live slider — suit different use cases (rough estimates vs. engineering precision).</precision_control>
  <unit_picker_search>Combobox with text filter (unit name + symbol) — fast lookup for categories with many units (e.g., area with mm²–mi²).</unit_picker_search>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Category selection and canonical pairs</description>
    <steps>
      1. Load /[locale]/tools/unit-converter → Length category active; "m" from, "km" to, precision 2.
      2. Click "온도" / "Temperature" tab → category switches; canonical pair now "°C" from, "°F" to.
      3. Type "0" in input → conversion shows 32 (0°C = 32°F); table shows all C/F/K pairs.
      4. Click "길이" / "Length" → category resets to m/km, table refreshes.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Live conversion, precision, swap</description>
    <steps>
      1. Length category; type "100" in input → "to" field shows "100 km" (assuming from=m, to=km) = 100000 m.
      2. Move precision slider to 4 decimals → displays "100.0000 km".
      3. Click swap button → from/to flip; input still 100, now "from=km to=m" → "100 km = 100000 m".
      4. Type "5.5" → live updates as you type (no lag). Clear input → both fields empty.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Temperature edge cases and round-trip accuracy</description>
    <steps>
      1. Temperature category; type "-40" (from=°C) → shows -40 (°F) = -40 (affine property).
      2. Type "0" → shows 32.00 (0°C = 32°F); flip to K → "273.15 K" (0°C = 273.15 K).
      3. Type "273.15" from=K, to=°C → shows 0.00 (round-trip).
      4. Type "212" from=°F, to=°C → shows 100.00 (boiling water).
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Recents, keyboard, a11y</description>
    <steps>
      1. Perform 3 conversions (e.g., m→ft, kg→lb, L→gal) → each added to recents MRU.
      2. Reload → recents persist; "최근 변환" panel shows 3 entries; click one → restores that category + units + value.
      3. Tab through: input→from picker→swap→to picker→precision slider; Enter on pickers opens them; Esc closes.
      4. Arrow keys in picker list navigate; Home/End jump; type "f" in meter picker searches for "foot".
      5. axe pass → no violations; input focused has visible 2px ring; error message aria-live; precision slider aria-valuetext.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO, locale swap</description>
    <steps>
      1. Switch to /en → chrome (categories, unit names, how-to, FAQ) English; category labels "Length", "Weight", etc.
      2. Build prod → /ko/tools/unit-converter and /en/tools/unit-converter unique title/description/canonical/hreflang/OG.
      3. HTML has SoftwareApplication + FAQPage + How-To JSON-LD; intro/how-to/FAQ localized; conversion code locale-agnostic.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>All 8 categories + 8–12 units each present and convertible; live keystroke-to-result <50ms; swap flips from/to; precision 0–6 live; table shows all pairs; recents persist + restore; category tabs + keyboard roving.</functionality>
  <user_experience>Input focus visual (2px ring); keystroke→result instant (no perceptible lag); swap icon rotates; recents 1-tap restore; ≥44px targets; full keyboard (Tab, Arrow, Enter, Esc).</user_experience>
  <technical_quality>lib/unit-converter/* pure ≥80% unit coverage (converters, precision, recents, types); round-trip temperature tests (±0.0001); TS 0 errors; <800 lines per file.</technical_quality>
  <visual_design>DESIGN.md compliant; sky accent for tabs/input focus; Gmarket H1, Pretendard body; bright, friendly calculator (not dense scientific tool); responsive 320/768/1024.</visual_design>
  <accessibility>Full keyboard (roving, Tab, Arrow, Enter, Esc); visible focus-visible rings; error messages aria-live; input labeled; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; no network; localStorage-only persistence; CLS unaffected (ad height platform-reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). No prebuild hook needed (all code compile-time). /[locale]/tools/unit-converter pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'converter' category + 'sky' accent already exist; no ToolCategory change needed.
    {
      id: 'unit-converter',
      slug: 'unit-converter',
      category: 'converter',
      icon: 'Ruler',                    // lucide-react
      accent: 'sky',
      status: 'live',                   // 'coming_soon' until module complete
      isNew: true,
      order: 20,                        // tune as desired
      keywords: ['단위변환','길이','무게','온도','시간','변환','unit','conversion','length','weight','temperature','time'],
    },
    ```
    Also add slug→component branch (<UnitConverter/>) and generateMetadata branch in tool route.
  </platform_registry_change>
  <critical_paths>
    1. Domain: 8 converters (length/mass/temp/area/volume/speed/storage/time) with static factors (or temp affine). All round-trip tested.
    2. Precision: Intl.NumberFormat or toFixed at display layer (never store rounded).
    3. Live conversion: debounced 50ms onChange dispatches to active converter, updates toValue.
    4. Recents: zod schema → localStorage → prune unknowns on load → immutable addRecent/clearRecents.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/unit-converter/{types,constants,converters/*}.ts Vitest: unit tests for each converter (round-trip, edge cases, precision). Temperature affine first.
    2. lib/unit-converter/{precision,schema,recents}.ts + tests (Intl.NumberFormat formatting, zod store, immutable ops).
    3. lib/unit-converter/convert.ts router (dispatch by category + unit pair).
    4. useUnitConverter hook (state, localStorage read/write, derived conversions).
    5. UI components (CategoryTabs, ConversionInput, UnitPicker, SwapButton, PrecisionSlider, ConversionTable, RecentsPanel).
    6. Keyboard/a11y: roving tabindex tabs, combobox picker ARIA roles, error aria-live, precision aria-valuetext.
    7. UnitConverterIntro/HowTo/Faq + SoftwareApplication + FAQPage + How-To JSON-LD.
    8. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_data note="compile-time constants — no markdown/remote source">
    - Length: m (1), mm (0.001), cm (0.01), km (1000), in (0.0254), ft (0.3048), yd (0.9144), mi (1609.34)
    - Mass: kg (1), g (0.001), mg (1e-6), oz (0.0283495), lb (0.453592)
    - Temperature: °C (base), °F (T_F = T_C × 9/5 + 32), K (T_K = T_C + 273.15)
    - Area: m² (1), mm² (1e-6), cm² (0.0001), km² (1e6), in² (0.00064516), ft² (0.092903), yd² (0.836127), mi² (2.58999e6)
    - Volume: L (0.001 m³), mL (1e-6 m³), in³ (1.63871e-5 m³), ft³ (0.0283168 m³), gal (0.00378541 m³)
    - Speed: m/s (1), km/h (1/3.6), mi/h (0.44704), knot (0.51444)
    - Digital storage: B (1), KB (1000), MB (1e6), GB (1e9), TB (1e12), KiB (1024), MiB (1048576), GiB (1073741824), TiB (1099511627776)
    - Time: ms (0.001), s (1), min (60), h (3600), day (86400)
  </seed_data>
  <testing_strategy>Vitest ≥80% (converters, precision, recents, schema validation); temperature round-trip accuracy ±0.0001; E2E scenarios 1–5 (category tabs, live conversion, temp edge cases, recents, i18n); keyboard/ARIA axe checks; localStorage jsdom isolation.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, input focus visible, table grid correct, recents populate + restore, temp round-trip verified.</tool_usage>
</key_implementation_notes>

</project_specification>
```

376 lines.
