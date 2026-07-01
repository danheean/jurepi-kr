# Percentage Calculator — Everyday Percentage Math — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Percentage Calculator** (퍼센트 계산기) — a fast, clear calculator for everyday percentage tasks (what % of Y is X, percent change, tip/discount, add/subtract %). Five labeled modes, live compute, plain-language formula display, and recent calculation history via localStorage.
> Internal service codename: `percentage-calculator`. Registry id: `percentage-calculator`. Public URL slug: `/[locale]/tools/percentage-calculator`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Percentage Calculator — Fast Percent Math for Everyday Use (Jurepi tool, registry id percentage-calculator)</project_name>

<overview>
Percentage Calculator brings the five most common percent scenarios into one screen. A user picks a mode (e.g., "What is X% of Y?"), enters numbers, and sees the result instantly plus the formula in plain English. No clicking between pages, no lost history — everything lives in one tab, and recent calculations stack on the right. The modes are: (1) "What is X% of Y?", (2) "X is what percent of Y?", (3) "percent change from A to B (increase/decrease)", (4) "add/subtract X% from Y", (5) "tip/discount helper (amount + %)". Each mode solves a real friction: quick mental math at a restaurant, understanding a price change, applying a discount code.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database. The only first-party persistence is `localStorage` (recent calculations + mode selection), and nothing is ever sent over the network.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — mode selection, input, copy result — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the layout is one tall column, mode picker at top, inputs visible, result live as you type, copy button always ready. The route is statically generated (SSG) for SEO/indexing; the interactive calculator is a single client-component island on that static shell.
</overview>

<platform_integration>
  - Route: /[locale]/tools/percentage-calculator (SSG; registry slug "percentage-calculator", id "percentage-calculator", status "live", accent "sun", category "calculator").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.percentage-calculator.*` (UI chrome strings: mode labels, input placeholders, button labels, how-to, FAQ — NOT calculated values; those are locale-agnostic number formatting).
  - Platform dependency (NO new category needed): the `'calculator'` category already exists in `ToolCategory` with the `sun` accent and the "계산기"/"Calculator" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Five percentage-math modes: (1) "X% of Y", (2) "X is what % of Y", (3) "percent change A→B", (4) "Y ± X%", (5) "tip/discount (amount + %)".
    - Live computation: inputs debounced 80ms; result updates as user types.
    - Plain-language formula display (e.g., "25% of 200 = 50").
    - Copy-to-clipboard for the result; silent fail if clipboard unavailable.
    - Recent calculations: localStorage stack (max 10 entries); tap/click to re-populate inputs; clear history button.
    - Rounding display: sensible defaults (2 decimals for percent, 2 for amounts); user can toggle "show more decimals" per-mode.
    - Edge-case handling: divide by zero (Y=0 in modes 1/2), negative inputs, very large numbers, empty inputs.
    - Tool-specific SEO long-form ("How to calculate percentages") + FAQ (FAQPage JSON-LD).
    - Reduced-motion fallback; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Compound interest, loan amortization, tax calculators (separate future tools).
    - Multi-step calculations or stored workbooks (MVP is single-operation, recent history only).
    - Custom decimal places UI (preset sensible defaults; "show more" is enough).
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Backend, database, user accounts, sharing.
  </out_of_scope>
  <future_considerations>
    - Batch mode: paste/upload CSV of values for bulk calculation.
    - Unit converter integration (% calculations on different units, e.g., grams/ml).
    - Dark-mode-specific styling refinements (Phase 2).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <computation>Pure, deterministic percent math functions: `percentOf`, `percentIs`, `percentChange`, `addPercent`, `tipDiscount`. No library; use Number type (JavaScript native). Validation via zod (already in repo) for input range/NaN/infinity.</computation>
    <formatting>Intl.NumberFormat (locale from useLocale(), BCP-47: "ko"/"en") for displaying results; never pass i18n message keys to Intl (throws RangeError).</formatting>
    <history>Immutable list ops; localStorage key `jurepi-percentage-calculator`; shape [{ inputs: {mode, values...}, result: number, formulaText: string, ts: number }, ...]. De-dupe on write; prune unknown modes on load.</history>
    <clipboard>navigator.clipboard.writeText → fallback textarea.execCommand → silent fail (copy is secondary; never show false success).</clipboard>
    <animation>CSS transitions only (result fade-in 100ms, history item slide-in 150ms). No animation library. Respect prefers-reduced-motion (instant fade, no translate).</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; input schema validation (mode enum, number range/NaN/infinity checks).</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/percentage-calculator/              # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                           # zod: input validation, mode enum, result type
│   ├── math.ts                             # percentOf, percentIs, percentChange, addPercent, tipDiscount (deterministic, no side effects)
│   ├── format.ts                           # formatResult(value, locale), formatFormula(mode, inputs, result)
│   ├── history.ts                          # Immutable ops: addToHistory, pruneUnknown, clearOld; localStorage key constant
│   └── types.ts                            # CalcMode, Inputs[mode], History, HistoryEntry
├── components/tools/percentage-calculator/
│   ├── PercentageCalculator.tsx            # Orchestrator (Client Component) — mode + inputs + result + history state
│   ├── usePercentageCalculator.ts          # Hook: live compute, localStorage sync, copy adapter
│   ├── ModeSelector.tsx                    # Pill row; selected → brand fill; click switches mode
│   ├── InputGroup.tsx                      # Per-mode inputs; row for simple modes, 2-row for complex
│   ├── ResultDisplay.tsx                   # Big result number (sun accent, can toggle decimals) + formula text + copy button
│   ├── HistoryPanel.tsx                    # Stack of recent calcs; click to populate inputs; clear button
│   ├── PercentageCalculatorIntro.tsx       # H1 + lead (SEO long-form); server-render where possible
│   ├── PercentageCalculatorHowTo.tsx       # "How to calculate percentages" — 5 tips matching the 5 modes
│   ├── PercentageCalculatorFaq.tsx         # Q&A + FAQPage JSON-LD
│   └── data/ (if any generated content)
└── i18n/messages/{ko,en}.json              # tools.percentage-calculator.* UI chrome (mode labels, placeholders, buttons, how-to, FAQ) — NOT numbers
</file_structure>

<core_data_entities>
  <calc_mode enum>
    - "percent_of": "What is X% of Y?"
    - "percent_is": "X is what percent of Y?"
    - "percent_change": "Percent change from A to B"
    - "add_subtract_percent": "Add/subtract X% from Y"
    - "tip_discount": "Tip/discount (amount + %)"
  </calc_mode>
  <inputs_by_mode note="per-mode input shape; fully typed">
    - percent_of: { percent: number, amount: number } → result = (percent / 100) * amount
    - percent_is: { amount: number, total: number } → result = (amount / total) * 100
    - percent_change: { before: number, after: number } → result = ((after - before) / before) * 100 (sign indicates direction)
    - add_subtract_percent: { amount: number, percent: number, operation: '+' | '-' } → result = amount + (amount * (percent/100) * sign)
    - tip_discount: { amount: number, percent: number, operation: 'tip' | 'discount' } → result = amount + (amount * (percent/100) * multiplier); total = amount + result
  </inputs_by_mode>
  <result note="single number output per mode">
    - value: number (may be NaN, Infinity, or valid; validation layer reports these to UI)
    - formulaText: string (plain English, e.g., "(25 / 100) × 200 = 50")
    - formattedValue: string (locale-aware, 2–15 decimals user-selectable)
  </result>
  <history_entry>
    - mode: CalcMode
    - inputs: Inputs[mode]
    - result: number (raw; UI re-formats on render)
    - formulaText: string (snapshot at time of calc)
    - ts: number (Date.now(); used for MRU ordering and "30-day auto-prune" if implemented)
  </history_entry>
  <calculator_store note="localStorage blob">
    - version: number (1)
    - history: HistoryEntry[] (max 10; newer first)
    - lastMode: CalcMode (persisted tab selection)
    - meta: { createdAt: number }
    localStorage key: `jurepi-percentage-calculator`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown modes pruned on load.
  </calculator_store>
  <constants>
    - HISTORY_MAX = 10
    - COMPUTE_DEBOUNCE = 80ms
    - DECIMAL_DEFAULT = 2
    - DECIMAL_MAX = 15
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/percentage-calculator" page="PercentageCalculator (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <percentage_calculator>              <!-- "use client"; owns mode + inputs + result + decimal state + usePercentageCalculator() -->
    <percentage_calculator_intro />    <!-- H1 + lead (server-render where possible) -->
    <main_layout>                       <!-- Desktop: 2-col (calc | history); mobile: stacked -->
      <calculator_main>                <!-- Left/top column -->
        <mode_selector />               <!-- 5 pills: tap to switch mode, updates inputs layout -->
        <input_group />                 <!-- Per-mode input fields; dynamic layout per mode -->
        <result_display />              <!-- Big result (sun tint), formula, copy button, toggle decimals -->
      </calculator_main>
      <history_panel />                 <!-- Right/bottom column; recent calculations stack -->
    </main_layout>
    <percentage_calculator_how_to />    <!-- SEO long-form -->
    <percentage_calculator_faq />       <!-- FAQPage JSON-LD -->
  </percentage_calculator>
  <note>SPA within tool: mode/inputs/copy = local state switch, NOT route navigation.</note>
</component_hierarchy>

<pages_and_interfaces>
  <percentage_calculator_intro>
    - Eyebrow: "계산기 도구" / "CALCULATOR TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "퍼센트 계산기" / "Percentage Calculator" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary).
  </percentage_calculator_intro>

  <mode_selector>
    - Horizontal pill row, 5 pills (one per mode).
    - Active pill: background var(--accent-sun), text var(--accent-sun-ink); inactive: var(--surface-muted) / var(--text-secondary).
    - Hover lifts bg (200ms --ease-out). Narrow screens: scroll horizontally + snap.
    - aria: role="tablist"; ArrowLeft/Right move; aria-selected on active.
  </mode_selector>

  <input_group>
    - Per-mode layout:
      - percent_of (2 inputs): "percent" + "amount" → side-by-side ≥768, stack <768.
      - percent_is (2 inputs): same layout.
      - percent_change (2 inputs): "before" + "after"; shows direction arrow.
      - add_subtract_percent (3 controls): amount, percent, ±/toggle.
      - tip_discount (3 controls): amount, percent, tip/discount toggle.
    - Each input: DESIGN text-input style, leading icon (if helpful), placeholder, full width on mobile.
    - Live debounce 80ms on change; shows "Calculating…" (caption, var(--text-muted)) during debounce.
    - aria: input aria-label includes mode context.
  </input_group>

  <result_display>
    - Big headline number (40px, sun accent) displaying the result; "Invalid" if NaN/Infinity.
    - Beneath: formula in body-sm var(--text-secondary) (e.g., "(25 ÷ 100) × 200 = 50").
    - Below formula: small toggle link "Show more decimals" (cycle 2→4→6→all); displays current precision.
    - Buttons row: "Copy result" (primary brand CTA) + "Clear" (secondary).
    - Copy success: brief "Copied!" toast (success semantic color, 1.5s).
  </result_display>

  <history_panel>
    - Label "Recent Calculations" (eyebrow var(--text-muted)).
    - Stack of cards (max 10); each card displays the mode name, inputs summary (e.g., "25% of 200"), result.
    - Card hover: translateY(-2px) + --shadow-card-hover, cursor pointer. Click → populate inputs + switch to that mode.
    - Empty: "Your calculations will appear here" + no clear button.
    - "Clear history" button (ghost, footer of panel) when non-empty.
    - aria: list role="list"; each card aria-label = "{mode}: {inputs summary} = {result}".
  </history_panel>

  <keyboard_shortcuts_reference>
    - Tab: navigate inputs; after result → copy button → clear.
    - "/" (when not typing): focus first input. Esc: clear all inputs.
    - ArrowLeft/Right: mode selection (when focus on pills).
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <computation note="pure lib/percentage-calculator/math.ts, fully tested">
    - percentOf(percent: number, amount: number): number
    - percentIs(amount: number, total: number): number (may return NaN if total = 0; UI reports "Cannot divide by zero")
    - percentChange(before: number, after: number): number (may return Infinity if before = 0)
    - addPercent(amount: number, percent: number, operation: '+' | '-'): number
    - tipDiscount(amount: number, percent: number, operation: 'tip' | 'discount'): { result: number; total: number }
    - All functions deterministic; no Date/random. Input validation (NaN check) at schema layer.
  </computation>
  <live_compute note="usePercentageCalculator hook">
    - On input change: debounce 80ms, call compute(mode, inputs), store result + formulaText + ts.
    - Expose: computedResult, formula, error (if any), copy(result), setMode, setInputs, history, clearHistory.
    - Mode/inputs change is client-only state (React Context or hook-local); no route change.
  </live_compute>
  <formatting note="lib/percentage-calculator/format.ts">
    - formatResult(value: number, locale: string, decimals: number = 2): string → uses Intl.NumberFormat with locale from useLocale().
    - formatFormula(mode: CalcMode, inputs, result): string → e.g., "(25 ÷ 100) × 200 = 50" (symbols localized in i18n, not in function).
  </formatting>
  <history note="immutable ops in lib/percentage-calculator/history.ts">
    - addToHistory(entry: HistoryEntry, list: HistoryEntry[], max: number = 10): HistoryEntry[] → new array with entry at front, de-duped by (mode+inputs hash), truncated to max.
    - pruneUnknown(list: HistoryEntry[], knownModes: CalcMode[]): HistoryEntry[] → drop entries with unknown modes (e.g., if modes change).
    - clearHistory(): HistoryEntry[] → [].
    - On mount: read localStorage → zod parse → pruneUnknown → restore state. Fail → start fresh (no throw).
    - On change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
  </history>
  <i18n>All UI chrome from tools.percentage-calculator.* (ko/en): mode labels, input placeholders, button labels, how-to, FAQ. Calculated values use Intl.NumberFormat (locale-aware, no i18n message).</i18n>
</core_functionality>

<error_handling>
  <divide_by_zero>Y = 0 in modes 1/2 → result = NaN. UI displays "Cannot divide by zero" (localized error via i18n) in result area instead of number.</divide_by_zero>
  <infinity>before = 0 in percent_change → result = Infinity. UI displays "Undefined (before value is zero)" instead of number.</infinity>
  <nan_inputs>Non-numeric input → rejected by HTML5 type="number" or zod validation. Empty input treated as 0 or ignored (per mode).</nan_inputs>
  <very_large_numbers>JavaScript Number handles up to 2^53; results >this are rare for percent math but treated as valid (no special clamping).</very_large_numbers>
  <clipboard_failure>Clipboard unavailable (private mode, denied permission) → copy button click is silent (no error toast).</clipboard_failure>
  <storage>Private mode/quota → recents in-memory, fully usable; no error. Corrupt blob → start fresh (no throw).</storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of truth. Below is tool-specific application.</source>
  <accent_usage>
    - Category accent is SUN (var(--accent-sun) / var(--accent-sun-soft)) — "calculator" category identity per DESIGN. Result display, mode active pill, toggle states.
    - CTAs (primary buttons) stay brand honey-gold var(--brand). Accent = identity, not action (DESIGN do/don't).
  </accent_usage>
  <layout>
    - Desktop ≥768px: 2-col (calc 60% left, history 40% right; gap 24px).
    - Tablet 480–767px: stacked (calc full width top, history below).
    - Mobile <480px: single column, full width.
  </layout>
  <typography>
    - H1 Gmarket Sans clamp(28–40px); mode labels Pretendard button (15px/600); result headline 40px/700 sun accent; formula body-sm var(--text-secondary).
  </typography>
  <motion>
    - Mode switch: pill bg cross-fade 150ms --ease-out.
    - Result appear: fade-in 100ms.
    - History card on add: slide-in from bottom 150ms.
    - All gated by prefers-reduced-motion (instant fade, no translate).
  </motion>
  <responsive>
    - ≥1024px: 2-col fixed; history sticky right 360px.
    - 768–1023px: 2-col flex.
    - <768px: stacked. No overflow (320 test).
    - Touch targets ≥44px.
  </responsive>
  <accessibility>
    - Mode pills role="tablist"; inputs aria-label; copy button labeled; focus-visible ring var(--focus-ring); WCAG AA contrast.
  </accessibility>
</aesthetic_guidelines>

<security_considerations>
  <input note="HTML5 type=number validates client-side; zod re-validates for safety">
    - Numbers only; NaN/Infinity render as user errors, not crashes.
    - No user-generated strings rendered as HTML (only computed numbers and enum labels).
  </input>
  <clipboard>User-initiated; result value only (never inputs or history); read-only.</clipboard>
  <privacy>History localStorage-only; never sent. No analytics events include values.</privacy>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>All five modes compute correctly with live feedback</description>
    <steps>
      1. Visit /ko/tools/percentage-calculator → renders mode pills, empty inputs, "Your calculations will appear here".
      2. Click mode "25%의 200은?" (percent_of) → inputs change to percent + amount fields.
      3. Type 25, 200 → result updates live (debounced): "50".
      4. Formula displays "(25 ÷ 100) × 200 = 50".
      5. Repeat for all 5 modes with clear inputs; all compute without errors.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Edge cases: divide by zero, infinity, empty inputs</description>
    <steps>
      1. Mode "X는 Y의 몇 %인가?" (percent_is); enter 10, 0 → "Cannot divide by zero".
      2. Mode "percent_change" (A to B); enter 0, 100 → "Undefined (before is zero)".
      3. Leave inputs empty; "Enter a value" or no result shown gracefully.
      4. All edge cases show user-facing message, never crash.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>History, copy, persist</description>
    <steps>
      1. Do 3 calculations (modes mixed) → history stack shows all 3 (newest first), each shows mode + summary + result.
      2. Click a history card → inputs + mode switch to that calc; can edit and re-compute.
      3. "Copy result" → clipboard has "50" (or the result); toast "Copied!" (success color, 1.5s).
      4. Reload page → history + last mode persist; localStorage survives.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>i18n, responsive, a11y</description>
    <steps>
      1. Switch to /en → UI chrome (mode labels, buttons, placeholders) English; numbers locale-aware (comma/period per locale).
      2. 320px mobile → single column, mode pills scroll snap, inputs full width, history below. No overflow.
      3. Tab through inputs → focus ring visible; ArrowLeft/Right navigate mode pills; "/" focuses first input.
      4. axe pass (no violations); WCAG AA contrast on all text.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>SEO, build</description>
    <steps>
      1. Build prod → /ko and /en tools/percentage-calculator unique title/description/canonical/hreflang/OG.
      2. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ localized.
      3. Result computation is NOT gated behind mounted; formula + intro visible in prerendered HTML.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>All 5 modes compute live; edge cases (÷0, ∞, empty) handled gracefully; history stack + copy + clear work; i18n + locale-aware formatting correct.</functionality>
  <user_experience>Input→result < 80ms debounce; visible focus + ≥44px targets; SPA (no page reload on mode switch); formula always visible.</user_experience>
  <technical_quality>lib/percentage-calculator/* pure ≥90% unit coverage (math/format/history); TS 0 errors; <800 lines per file; no mutation (immutable history ops).</technical_quality>
  <visual_design>DESIGN.md compliant; sun identity (result + active pill); responsive 320/768/1024; motion-respect; light theme intentional.</visual_design>
  <accessibility>Full keyboard (Tab, Arrow, "/"); aria-live for copy; labeled inputs; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; debounce + live compute feel fast (&lt;100ms perceived latency).</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/percentage-calculator pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Pure domain math + input validation (schema); deterministic, no side effects.
    2. Live compute with debounce 80ms (UX feel).
    3. Immutable history ops + localStorage sync.
    4. Mode-aware input layout (5 distinct shapes).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/percentage-calculator/{types,schema,math,format,history}.ts Vitest (RED→GREEN): math deterministic, edge cases (÷0, ∞), format locale-aware, history immutable ops, pruneUnknown.
    2. tools.percentage-calculator.* messages (ko/en): 5 mode labels, input placeholders, button labels, how-to, FAQ.
    3. usePercentageCalculator hook (dynamic compute + localStorage).
    4. ModeSelector + InputGroup (per-mode layout) + ResultDisplay (big number + formula + copy).
    5. HistoryPanel (stack + click to restore + clear).
    6. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving).
    7. PercentageCalculatorIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via platform lib/seo.ts.
    8. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥90% (math/format/history); component: ModeSelector/InputGroup states, ResultDisplay edge cases, HistoryPanel restore; E2E scenarios 1–5 (esp. #1 all modes, #2 edge cases, #3 persist/copy); clipboard/localStorage jsdom-isolated; reduced-motion verify.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

328 lines.
