# Random Number Picker — Generate Numbers for Lotteries & Draws — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Random Number Picker** (랜덤 번호 뽑기) — a lightweight generator for drawing random numbers within a user-defined range, with optional duplicates suppression, sorting, and localStorage history. Useful for lotteries, raffles, decision-making, and games. The tool mounts as a client-side SPA offering input (min/max/count), controls (duplicates toggle, sort order), a cryptographically fair draw reveal, and access to recent results.
> Internal service codename: `random-number`. Registry id: `random-number`. Public URL slug: `/[locale]/tools/random-number`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Random Number Picker — Number Generator for Draws (Jurepi tool, codename random-number, registry id random-number)</project_name>

<overview>
The Random Number Picker solves a simple, universal problem: "I need to pick N random numbers from a range." A teacher drawing student IDs for participation. A raffle organizer selecting winning ticket numbers. A game needing a fair roll. The tool answers: "What are 5 numbers between 1 and 100?" with a single tap, optionally allowing/disallowing duplicates, and optionally sorting the results.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. Fairness is ensured by `crypto.getRandomValues()` — the same cryptographic random source that browsers use for security. The only first-party persistence is `localStorage` (recent draws), and nothing is ever sent over the network.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. Interaction — adjusting min/max, toggling duplicates, hitting the draw button, viewing history — happens via local React state with NO route navigation and NO full page reload. The route is statically generated (SSG) for SEO/indexing; the interactive tool is a single client-component island on that static shell.

CRITICAL (fairness, crypto): Random draws must use `crypto.getRandomValues()`, NOT `Math.random()`. Fairness is a non-negotiable property that must be unit-tested (e.g., chi-square goodness-of-fit on 1000+ samples).
</overview>

<platform_integration>
  - Route: /[locale]/tools/random-number (SSG; registry slug "random-number", id "random-number", status "live", accent "coral", category "random").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.random-number.*` (UI chrome strings: labels, hints, button text, toast messages — NOT number content; that is generated at runtime); the in_content AdSlot below the tool.
  - Platform dependency (NO new category needed): the `'random'` category already exists in `ToolCategory` with the `coral` accent and the "랜덤·추첨"/"Random & Draw" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Input controls: min/max range (integer inputs, min ≤ max validation), count N (1 to 100, default 5).
    - Options: toggle allow/disallow duplicates (default true).
    - Options: sort result ascending/descending/unsorted (default unsorted).
    - Options: toggle integer vs decimal with precision control (0–6 decimal places, default 0 = integer).
    - Draw button: generate N random numbers using `crypto.getRandomValues()`.
    - Reveal animation: compositor-friendly fade-in or number-scroll (no layout shifts; respects prefers-reduced-motion).
    - Result display: N numbers in a formatted list or grid; copy all results (clipboard).
    - Recent draws: localStorage history (last 10 draws, each with min/max/count/options/timestamp), prune unknown entries.
    - Error handling: invalid input (min>max, N > distinct integers when no-duplicates), toast notifications.
    - SEO long-form intro ("How to pick random numbers", "Fair draws via crypto") + FAQ (FAQPage JSON-LD).
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry (all platform).
    - Weighted or biased draws (all draws are uniform probability).
    - User-saved draw templates or shared draw sessions.
    - Backend storage, accounts, or cross-device sync.
    - Per-number deep-link URLs — single route + client state.
  </out_of_scope>
  <future_considerations>
    - Weighted draws (Phase 2).
    - Scheduled auto-draws / timer mode (Phase 2).
    - Draw sharing (embed screenshot or JSON state) (Phase 3).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <crypto>Web Crypto API (crypto.getRandomValues) for cryptographically secure random integers. Native; no polyfill needed in modern browsers.</crypto>
    <number_generation>Pure domain layer: `generateRandomNumbers(min, max, count, allowDuplicates, asPrecision)` → number[] (unit-testable, framework-free).</number_generation>
    <animation>Native CSS transitions only (fade-in 150ms, number scroll 300ms). No animation library.</animation>
    <clipboard>navigator.clipboard.writeText → fallback execCommand (silent fail if unavailable).</clipboard>
  </module_specific>
  <libraries>
    <note>Zero external dependencies beyond the platform's inherited stack. Pure domain + React hooks.</note>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/random-number/                    # Pure domain layer — no React/Next, fully unit-tested ≥90%
│   ├── generate.ts                       # crypto.getRandomValues wrapper + fairness; chi-square test
│   ├── validate.ts                       # min/max/count/precision validation; edge cases (min>max, N exceeds distinct range)
│   ├── schema.ts                         # zod: InputState, DrawResult, StoreSchema + STORE_VERSION
│   └── store.ts                          # Immutable ops: toggleDuplicates, setSortOrder, pushHistory, pruneHistory
├── components/tools/random-number/
│   ├── RandomNumberPicker.tsx            # Orchestrator (Client Component) — owns input/options state + useRandomPicker hook
│   ├── useRandomPicker.ts                # Hook: dynamic localStorage + history + copy adapter
│   ├── RangeInput.tsx                    # Min/max inputs (44px touch targets, aria labels, validation feedback)
│   ├── CountControl.tsx                  # Stepper 1–100 (or spinner)
│   ├── OptionsPanel.tsx                  # Toggles: duplicates (checkbox), sort order (radio), precision slider
│   ├── DrawButton.tsx                    # Primary action button ("뽑기" / "Draw")
│   ├── ResultDisplay.tsx                 # Grid/list of N numbers; formatted per precision; "Copy all" button
│   ├── HistoryPanel.tsx                  # Recent draws (date + parameters + result summary); click to recall/restore
│   ├── RandomIntro.tsx                   # H1 + lead (SEO; server-render where possible)
│   ├── RandomHowTo.tsx                   # "How to pick random numbers" + "Fairness via crypto" (SEO long-form)
│   ├── RandomFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── data/
│       └── (no generated artifacts; all logic is deterministic from inputs)
└── i18n/messages/{ko,en}.json            # tools.random-number.* UI chrome (labels, button text, hints, toasts, FAQ)
</file_structure>

<core_data_entities>
  <input_state note="current UI settings">
    - min: number (default 1, validated ≥ -999999999)
    - max: number (default 100, validated ≤ 999999999, must have max ≥ min)
    - count: number (1–100, default 5)
    - allowDuplicates: boolean (default true)
    - sortOrder: enum (unsorted, asc, desc; default unsorted)
    - precision: number (0–6, default 0 = integers)
  </input_state>
  <draw_result note="single draw outcome; immutable">
    - id: string (nanoid, for history dedup)
    - numbers: number[] — sorted as per sortOrder or in draw order
    - timestamp: number (ms since epoch)
    - params: { min, max, count, allowDuplicates, sortOrder, precision } — snapshot of inputs at draw time
    - error?: string (if draw failed validation)
  </draw_result>
  <store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - history: DrawResult[] — most-recent-first, max 10 items
    localStorage key: `jurepi-random-number`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Max 10 items; pruning is automatic on load and on new draw.
  </store>
  <constants>
    - TOAST_MS = 1600; HISTORY_MAX = 10; ANIMATION_DURATION_MS = 150–300 (fade/scroll).
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/random-number" page="RandomNumberPicker (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <random_number_picker>                  <!-- "use client"; owns input + options + results state + useRandomPicker -->
    <random_intro />                      <!-- H1 + lead (server-render where possible) -->
    <range_input />                       <!-- Min/max fields, validation feedback -->
    <count_control />                     <!-- Count stepper -->
    <options_panel>
      <duplicates_toggle />
      <sort_order_radio />
      <precision_slider />
    </options_panel>
    <draw_button />                       <!-- Primary CTA; disabled if invalid state -->
    <result_display />                    <!-- N numbers in grid, copy button, success toast -->
    <history_panel />                     <!-- Recent 10 draws, click to restore -->
    <random_how_to />                     <!-- SEO long-form -->
    <random_faq />                        <!-- FAQPage JSON-LD -->
  </random_number_picker>
</component_hierarchy>

<core_functionality>
  <number_generation note="pure, deterministic, crypto-fair">
    - generateRandomNumbers(min: number, max: number, count: number, allowDuplicates: boolean, asPrecision: number): number[]
    - Uses crypto.getRandomValues(Uint32Array) → normalize to [min, max], respecting precision.
    - Rejection sampling if count > (max - min + 1) AND !allowDuplicates → error/"not enough distinct numbers".
    - Unit tests ≥90% + chi-square goodness-of-fit validation (1000+ samples for uniform distribution).
  </number_generation>
  <validation note="at system boundaries">
    - validateInput(InputState): { valid: boolean; errors: string[] }
    - min ≤ max, count ≥ 1 && count ≤ 100, precision ∈ [0, 6], range span ≤ 1e10 (prevent oversized ranges).
    - If count > (max - min + 1) AND !allowDuplicates, error: "Not enough distinct integers in range."
  </validation>
  <persistence_adapter useRandomPicker>
    - Mount: read `jurepi-random-number` → zod parse → pruneHistory → state; fail → start fresh (in-memory).
    - On draw: pushHistory(result, max=10) → debounced JSON.stringify → setItem; catch quota → keep in-memory.
    - Expose: currentDraw, history[], recall(historyId), copy(numbers), clearHistory.
  </persistence_adapter>
  <i18n>All UI chrome from tools.random-number.* (ko/en): labels, button text, hints, validation messages, toasts, how-to, FAQ. Number content is generated at runtime (locale-agnostic).</i18n>
</core_functionality>

<error_handling>
  <input_validation>Toast: "최소값이 최대값보다 클 수 없어요" / "Max must be greater than or equal to min." Invalid state disables draw button.</input_validation>
  <insufficient_distinct_range>Toast: "범위 내 서로 다른 숫자가 부족해요" / "Not enough distinct numbers in range. Reduce count or allow duplicates." Suggests turning on duplicates.</insufficient_distinct_range>
  <storage>Private mode/unavailable → recents in-memory, fully functional (no scary error). Quota → keep in-memory.</storage>
  <clipboard>Copy fail → silent (no false success toast). Success toast only on real success.</clipboard>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of tokens. Below are tool-specific applications.</source>
  <accent>Category accent is CORAL (var(--accent-coral) / var(--accent-coral-soft)) — "random/draw" category identity. Button primary stays brand honey-gold var(--brand) (DESIGN do/don't: accents = identity, not action).</accent>
  <layout>Input form (min/max/count) stacked or 2-col ≥768px. Options panel (duplicates/sort/precision) as toggles/radio/slider. Result grid responsive: 2-up ≥768px, 1-up <768px. History as scrollable list or accordion.</layout>
  <motion>transform/opacity only: draw button press scale(0.98) 100ms, result fade-in 150ms, number scroll 300ms (translate-y). All gated by prefers-reduced-motion (instant fade).</motion>
  <responsive>320–1440px, no overflow, touch targets ≥44px, inputs 40–56px tall.</responsive>
</aesthetic_guidelines>

<security_considerations>
  <crypto>Web Crypto API is audited by browsers; no hand-rolled PRNGs. crypto.getRandomValues is the source.</crypto>
  <input>User-entered min/max/count are numeric; validated/clamped before use. No user HTML injection.</input>
  <privacy>History localStorage-only, never sent. No analytics event includes drawn numbers.</privacy>
</security_considerations>

<final_integration_test>
  <scenario_1>
    <description>Draw 5 numbers from 1–100</description>
    <steps>
      1. Visit /ko/tools/random-number → form loads with min=1, max=100, count=5, allowDuplicates=true, sort=unsorted.
      2. Click "뽑기" → result fades in (150ms, prefers-reduced-motion → instant).
      3. 5 numbers displayed in grid; all ∈ [1, 100]; copy button works (success toast).
      4. Recent draw appears in history panel below.
    </steps>
  </scenario_1>
  <scenario_2>
    <description>Validate min/max edge cases</description>
    <steps>
      1. Set min=50, max=40 → draw button disabled, error toast "Max must be ≥ min."
      2. Set min=1, max=5, count=10, allowDuplicates=false → draw button disabled, error toast "Not enough distinct numbers."
      3. Enable duplicates → draw succeeds with ≥2 repeats (verify list contains duplicates).
    </steps>
  </scenario_2>
  <scenario_3>
    <description>Sort & precision options</description>
    <steps>
      1. Draw 5 numbers unsorted (random order).
      2. Toggle sort=asc → result re-displays in ascending order (same numbers, reordered).
      3. Set precision=2, redraw → numbers show 2 decimals (e.g., 42.37, 71.09).
    </steps>
  </scenario_3>
  <scenario_4>
    <description>History & locale</description>
    <steps>
      1. Draw 3 separate sets (different min/max/count). History shows 3 items, most-recent first.
      2. Click a history item → form fields + result restore to that draw state.
      3. Switch to /en → chrome English; history persists (dates format per locale).
      4. Reload → history still there (localStorage).
    </steps>
  </scenario_4>
  <scenario_5>
    <description>SEO & JSON-LD</description>
    <steps>
      1. Build prod → /ko/tools/random-number HTML has SoftwareApplication + FAQPage JSON-LD.
      2. How-To section present outside mounted gate (SSR-visible).
      3. Canonical URL matches NEXT_PUBLIC_SITE_URL.
    </steps>
  </scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Min/max range input; count 1–100 (user-editable); toggle duplicates on/off; sort order (unsorted/asc/desc); decimal precision 0–6; draw button generates N numbers via crypto.getRandomValues; copy result; history last 10 (localStorage, auto-prune).</functionality>
  <fairness>crypto.getRandomValues used (not Math.random); uniform distribution verified by chi-square test ≥1000 samples; all integers/decimals equally likely within range.</fairness>
  <user_experience>Input instant feedback (disabled button on invalid state); draw animation 150–300ms (reduced-motion instant); result copy ≥1600ms toast; history click restores state; ≥44px tap targets; visible focus rings.</user_experience>
  <technical_quality>lib/random-number/* pure ≥90% coverage; validation tests (edge cases: min>max, N>range, precision bounds); generateRandomNumbers deterministic + testable; TS strict; <800 lines per file.</technical_quality>
  <visual_design>DESIGN.md compliant; coral accent (identity), brand honey-gold CTA; responsive 320–1440px; no overflow.</visual_design>
  <accessibility>Keyboard operable (Tab/Enter/arrow on stepper); aria-label on inputs; visible focus-visible ring var(--focus-ring); prefers-reduced-motion instant animation; WCAG 2.1 AA.</accessibility>
  <build>Tool route within platform budget; within CWV targets (LCP < 2.5s).</build>
</success_criteria>

<key_implementation_notes>
  <critical_paths>
    1. generateRandomNumbers(min, max, count, allowDuplicates, precision) using crypto.getRandomValues — the heart of fairness.
    2. Validation: min ≤ max, count bounds, sufficient distinct integers (when no-duplicates).
    3. Copy + localStorage persistence (debounced, catch quota gracefully).
    4. Responsive form + result grid + history list (mobile/tablet/desktop).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/random-number/{generate,validate,schema,store}.ts Vitest ≥90%: crypto generation + chi-square fairness test, validation edge cases (min>max, N>range, precision clamp), immutable store ops.
    2. useRandomPicker hook (dynamic localStorage + in-memory fallback + copy adapter).
    3. Form components (RangeInput, CountControl, OptionsPanel, DrawButton) with validation feedback + disabled state.
    4. ResultDisplay (grid/list, copy button, success toast).
    5. HistoryPanel (recent draws, click to restore, date formatting).
    6. RandomIntro/HowTo/Faq + SoftwareApplication/FAQPage JSON-LD via platform lib/seo.ts.
    7. i18n keys (ko/en), responsive layout 320–1440px, motion (prefers-reduced-motion).
    8. E2E scenarios 1–5; visual regression 320/768/1024/1440 both themes; axe a11y pass.
  </recommended_implementation_order>
  <testing_strategy>Unit Vitest ≥90%: generateRandomNumbers (chi-square fairness), validateInput (all edge cases), store immutables. Component mocks generateRandomNumbers. E2E (Playwright) scenarios 1–5 (esp. validation, sort, history, locale, SEO JSON-LD). A11y: axe, keyboard, reduced-motion.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

**Final line count: 379 lines.**
