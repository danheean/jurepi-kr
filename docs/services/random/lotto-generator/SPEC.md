# Lotto Number Generator — Korean Lottery 6/45 Fair Draw Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Lotto Number Generator** (로또 번호 생성기) — a client-side tool to generate fair, unbiased Korean Lottery (6/45) draws. Users specify how many games to generate (1–10), optionally fix up to 5 lucky numbers (always included), optionally exclude up to 39 numbers (never picked), and see each game's 6 unique numbers from 1–45 drawn in sorted order, color-coded by official Korean lotto ball band. Copy, save to localStorage history, clear history. The entire interaction is client-side: no routing, no reload, no backend.
> Internal service codename: `lotto-generator`. Registry id: `lotto-generator`. Public URL slug: `/[locale]/tools/lotto-generator`.
>
> This SPEC covers the tool itself. Platform shell, tool registry, SEO & ad infrastructure, and design tokens are provided:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system: [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC: [`docs/services/random/roulette/SPEC.md`](./roulette/SPEC.md)

```xml
<project_specification>

<project_name>Lotto Number Generator — Korean Lottery 6/45 Draw (Jurepi tool, codename lotto-generator, registry id lotto-generator)</project_name>

<overview>
The Lotto Number Generator brings fair, provably-random draws to Korean lottery players. Users specify the number of games to generate (1–10), optionally fix up to 5 "lucky numbers" (guaranteed in every draw), optionally exclude up to 39 numbers (never picked), and hit "Generate" to see 6 unique numbers drawn from 1–45 per game in sorted ascending order. Each number is displayed as a colored ball matching official Korean lotto ball bands (yellow 1–10, blue 11–20, red 21–30, gray 31–40, green 41–45). A disclaimer makes clear: random generation does NOT improve odds, does NOT predict winners, and gambling carries risk. The entire interaction is a **single-page SPA**: no route changes, no full reload. Users can copy all games as text, save to localStorage history (timestamped), and clear history.

CRITICAL (fairness, cryptographic): Random draws use `crypto.getRandomValues` + rejection sampling without modulo bias (Fisher–Yates partial shuffle or Floyd's algorithm). Chi-square uniformity tests in unit tests assert each number 1–45 is equally likely across many independent draws. The algorithm and fairness invariants are non-negotiable.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no API. The only persistence is localStorage (draw history + latest settings). No routing or full-page reload on generation.

CRITICAL (SPA, usability-first): Every Jurepi tool is a client-side Single-Page Application. Interaction — generating, copying, saving, clearing history — happens entirely in React state with NO route navigation and NO full page reload. The route is statically generated (SSG) for SEO; the interactive tool is a single client-component island.
</overview>

<platform_integration>
  - Route: /[locale]/tools/lotto-generator (SSG; registry slug "lotto-generator", id "lotto-generator", status "coming_soon", accent "sun", category "random").
  - Provided by platform: app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.lotto-generator.*` (UI chrome strings: labels, buttons, help text, error messages, disclaimer).
  - Platform dependency (NO new category needed): the `'random'` category already exists with the `sun` accent and the "랜덤·추첨"/"Random" label. Only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Generate N games (1–10 input with spinners or text; default 1)
    - Fixed numbers (up to 5): optional; always included in every draw
    - Excluded numbers (up to 39): optional; never picked; validation: 45 − excluded ≥ 6 − fixed must be ≥ 0 (feasibility check; show conflict error if impossible)
    - Per-game: 6 unique numbers from 1–45, sorted ascending, displayed with official ball colors (1–10 yellow, 11–20 blue, 21–30 red, 31–40 gray, 41–45 green)
    - Fairness invariant: crypto.getRandomValues + rejection sampling (no modulo bias), chi-square uniformity test in unit tests (assertion: each number equally likely)
    - Ball animation on display (reveal one-by-one with pop sound; reduced-motion = instant)
    - Copy all games as plaintext (e.g., "Game 1: 2, 7, 18, 34, 41, 44")
    - Save to localStorage: history of past draws (timestamp, game count, fixed/excluded), max 20 entries
    - Clear history button
    - Keyboard navigation: Tab through inputs, Enter to generate
    - Responsive (320/375/768/1024/1440): grid adapts; controls stack as needed
    - Tool-specific SEO long-form + FAQ (FAQPage JSON-LD), SoftwareApplication JSON-LD, localized ko/en
    - Responsibility disclaimer (visible UI section + FAQ): gambling risk, random generation does not improve odds or predict winners
    - Accessibility: WCAG 2.1 AA, visible focus, ARIA labels, color contrast (balls meet 4.5:1 on white background)
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry (all platform)
    - Past lottery draw data lookup (external data integration)
    - Win probability calculator or odds prediction
    - Custom ball colors per user preference
    - Deep linking to specific draw configurations (Phase 2 candidate)
    - Backend sync / cross-device persistence
  </out_of_scope>
  <future_considerations>
    - Integration with official Korean lotto past-draw lookup (Phase 2, requires external API)
    - Undo/redo stack for fixed/excluded number edits (Phase 2)
    - Statistics dashboard (number frequency across all draws) (Phase 3)
    - Shareable draw link (Phase 2)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <random_generation>crypto.getRandomValues → uniform float [0, 1) × range → rejection sampling (resample if outside valid range, no modulo bias). Fisher–Yates partial shuffle or Floyd's algorithm for unbiased selection of 6 unique numbers from valid set (1–45 minus excluded, with fixed numbers pre-selected). Chi-square goodness-of-fit test in vitest: assert each number 1–45 sampled equally across many independent draws.</random_generation>
    <ball_colors>Official Korean Lotto ball bands: 1–10 yellow (var(--accent-sun)), 11–20 blue (var(--accent-sky)), 21–30 red (var(--accent-coral)), 31–40 gray (var(--surface-sunken), text var(--text)), 41–45 green (var(--accent-mint)). All 44px circles, 600 font weight, var(--text) or var(--on-brand) contrast-safe text centered.</ball_colors>
    <animation>Ball reveal: staggered pop in (scale 0→1 + fade 0→1) over 150ms per ball with 100ms stagger (total ~900ms for 6 balls). Sound: Web Audio API beep on pop. reduced-motion: all balls appear instantly, no sound.</animation>
    <persistence>localStorage key `jurepi-lotto-generator`: { version, history: [{timestamp, gameCount, fixedNumbers: number[], excludedNumbers: number[], games: number[][]}, ...], lastSettings: {gameCount, fixedNumbers, excludedNumbers} }. Read on mount → zod parse → pruneUnknown(history, validate still feasible). Write on every generation and setting change (no debounce — instant sync).</persistence>
    <clipboard>Games rendered as plaintext only (no HTML). "Copy" button uses navigator.clipboard.writeText or fallback (no dangerouslySetInnerHTML).</clipboard>
  </module_specific>
  <libraries>
    <zod>zod v3.x (already in repo) for number, draw, history schemas and localStorage validation.</zod>
    <web_audio>Native Web Audio API (no library) for ball-pop beep sound context + oscillator.</web_audio>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/lotto-generator/                # Pure domain layer (no React/Next)
│   ├── schema.ts                       # zod: Draw, Settings, HistoryEntry, Store (version, history, lastSettings)
│   ├── random.ts                       # fairDraw(fixedNumbers, excludedNumbers, rng) → 6-number draw via crypto rejection sampling; chi-square test helper
│   ├── colors.ts                       # ballColor(number) → (bg CSS class, text CSS class) for 1–45 bands
│   ├── validate.ts                     # isDrawFeasible(fixedCount, excludedCount) → boolean; conflicts(fixed, excluded) → error message or null
│   └── history.ts                      # immutable ops: addHistory, pruneUnknown, clearHistory
├── components/tools/lotto-generator/
│   ├── LottoGenerator.tsx              # Client Component; owns state (gameCount, fixedNumbers, excludedNumbers, games, history)
│   ├── useLottoGenerator.ts            # Hook: draw generation, localStorage persistence, history
│   ├── BallDisplay.tsx                 # Single 44px ball: color, number, pop animation, ARIA label
│   ├── GameList.tsx                    # Render all generated games (balls per game), copy-all button
│   ├── HistoryPanel.tsx                # Show past draws (timestamps, details), clear button; empty state
│   ├── SettingsPanel.tsx               # Game count (1–10), fixed numbers (0–5), excluded numbers (0–39), feasibility warning
│   ├── LottoIntro.tsx                  # H1 + lead (SEO; server-render where possible)
│   ├── LottoHowTo.tsx                  # "How to use" / "Fairness guarantee" (SEO long-form)
│   ├── LottoFaq.tsx                    # Q&A including "Does this improve my odds?" + responsibility disclaimers + FAQPage JSON-LD
│   └── ResponsibilityDisclaimer.tsx    # Prominent disclaimer: random generation does NOT predict winners, gambling carries risk
└── i18n/messages/{ko,en}.json          # tools.lotto-generator.* UI chrome, disclaimers, error messages
</file_structure>

<core_data_entities>
  <draw>
    - fixedNumbers: number[] (0–5 unique numbers from 1–45, optional; always included in every game)
    - excludedNumbers: number[] (0–39 unique numbers from 1–45, optional; never picked)
    - games: number[][] (each game: 6 unique sorted numbers from 1–45, respecting fixed and excluded)
    - Immutable: updates return new object/arrays, never mutate in-place.
  </draw>
  <settings>
    - gameCount: number (1–10, required)
    - fixedNumbers: number[]
    - excludedNumbers: number[]
  </settings>
  <history_entry>
    - timestamp: ISO string (when draw was generated)
    - gameCount: number
    - fixedNumbers: number[]
    - excludedNumbers: number[]
    - games: number[][]
  </history_entry>
  <lotto_store>
    - version: number (STORE_VERSION = 1)
    - history: HistoryEntry[] (max 20; oldest first)
    - lastSettings: Settings (most recent user input, restored on mount)
    localStorage key: `jurepi-lotto-generator`
    Invariant: read is zod-parsed; fail → start fresh (no throw). pruneUnknown after load (unused/invalid entries discarded).
  </lotto_store>
  <constants>
    - GAME_COUNT_MIN = 1, GAME_COUNT_MAX = 10
    - FIXED_MAX = 5, EXCLUDED_MAX = 39
    - LOTTO_MIN = 1, LOTTO_MAX = 45, NUMBERS_PER_GAME = 6
    - HISTORY_MAX = 20
    - BALL_POP_DURATION_MS = 150, BALL_STAGGER_MS = 100
    - BEEP_FREQ_HZ = 900
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/lotto-generator" page="LottoGenerator (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. This tool is status "coming_soon", so NOT pre-SSG'd; it will be live once status changes.</note>
</route_definitions>

<component_hierarchy>
  <lotto_generator>             <!-- "use client"; owns gameCount, fixedNumbers, excludedNumbers, games, history state + useLottoGenerator() owner -->
    <lotto_intro />             <!-- H1 + lead (server-render where possible) -->
    <responsibility_disclaimer/> <!-- Prominent warning: random, no odds prediction, gambling risk -->
    <layout_grid>               <!-- Desktop 2-split (results | settings), mobile stacked -->
      <results_column>
        <game_list />           <!-- Display all games, one per row, balls color-coded; copy-all button -->
        <history_panel />       <!-- Past draws with timestamps, clear button; empty state -->
      </results_column>
      <settings_column>
        <settings_panel />      <!-- Game count (1–10), fixed numbers (0–5), excluded numbers (0–39); feasibility check; generate button -->
      </settings_column>
    </layout_grid>
    <lotto_how_to />            <!-- SEO long-form -->
    <lotto_faq />               <!-- FAQPage JSON-LD -->
  </lotto_generator>
</component_hierarchy>

<pages_and_interfaces>

### LottoIntro
- Eyebrow: "랜덤·추첨" / "RANDOM" — 12px/700/0.6px, var(--brand-ink)
- H1: "로또 번호 생성기" / "Lotto Number Generator" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)
- Lead: "공정하게 로또 번호를 만들어드립니다. 당첨을 보장하지는 않습니다." / "Generate fair lottery numbers with cryptographic randomness. No odds guarantee — for entertainment only."

### BallDisplay
- Size: 44px circle; font 600 white or dark text centered
- Color mapping: 1–10 bg-accent-sun / 11–20 bg-accent-sky / 21–30 bg-accent-coral / 31–40 bg-surface-sunken text-text / 41–45 bg-accent-mint
- Animation: pop (scale 0→1 + fade 0→1) over 150ms on entry; staggered by 100ms; reduced-motion = instant
- Accessibility: role="img", aria-label="공 {number}" (e.g., "공 23", "Ball 23")

### GameList
- Title: "생성된 번호" / "Generated Numbers" — 18px var(--text) 700
- Per-game row: "게임 {N}:" followed by 6 color balls in a row, balls left-aligned
- Copy button (per-game or global): outline rose, clamp(16px,2vw,18px), "복사" / "COPY"; toast on copy
- Empty state (no games yet): "번호를 생성해보세요." / "Generate numbers to get started."

### SettingsPanel
- Sections: game count, fixed numbers, excluded numbers; feasibility indicator
- **Game Count**:
  - Label: "생성할 게임 수" / "Number of Games"
  - Input: spinners or number input, 1–10, default 1
  - Display: "1게임"–"10게임" / "1 game"–"10 games"
- **Fixed Numbers** (optional, 0–5):
  - Label: "매번 포함할 번호 (최대 5개)" / "Always Include (up to 5)"
  - Input: 5 text fields or chip-add UI; remove button per number
  - Feasibility: if (fixed.length + excluded.length > 39) → conflict warning
  - Help text: "선택한 번호는 모든 게임에 포함됩니다." / "These numbers will appear in every game."
- **Excluded Numbers** (optional, 0–39):
  - Label: "제외할 번호 (최대 39개)" / "Never Include (up to 39)"
  - Input: similar chip-add UI; remove button per number
  - Feasibility check: 45 − excluded.length ≥ 6 − fixed.length ? valid : show error "충분한 번호를 선택할 수 없습니다." / "Not enough numbers available to generate games."
- **Generate Button**:
  - Primary CTA, var(--brand) bg, var(--on-brand) text, 56px height, rounded lg
  - Label: "번호 생성하기" / "GENERATE"
  - Disabled if infeasible or gameCount < 1 or gameCount > 10

### ResponsibilityDisclaimer
- Prominent callout (var(--surface-sunken) bg, rose-soft border, rose text), ~16px body
- Text (i18n): "⚠️ 이 도구가 만든 번호는 완전히 무작위로 생성되며, 당첨 확률을 높이지 않습니다. 로또는 도박이며 도박에는 위험이 따릅니다." / "⚠️ These numbers are randomly generated and do NOT improve your odds. Lottery play carries financial risk."

### HistoryPanel
- Title: "지난 생성 기록" / "Generation History" — 18px var(--text) 700
- Empty state: "생성 기록이 없습니다." / "No history yet."
- Per-entry: timestamp (relative, "2시간 전" or "2 hours ago"), game count ("5게임" / "5 games"), fixed numbers (if any, chip list), excluded numbers (if any, chip list), expand/collapse to show all games
- Clear button: outline rose, "기록 지우기" / "Clear History"

### LottoHowTo
- Sections (i18n keys):
  - howTo.title: "사용 방법" / "How to Use"
  - howTo.items[0].description: "1단계: 생성할 게임 수를 선택합니다 (1–10개). 2단계: 선택적으로 매번 포함할 번호와 제외할 번호를 지정합니다. 3단계: '번호 생성하기'를 누르면 공정한 랜덤 추첨으로 번호를 만듭니다."
  - howTo.title (fairness): "공정성 보장" / "Fairness Guarantee"
  - howTo.items[1].description: "이 도구는 암호학적 난수(crypto.getRandomValues)를 사용하여 모든 번호가 동등한 확률로 선택되도록 보장합니다. 시각적 편향이나 예측 가능한 패턴이 없습니다."

### LottoFaq
- faq.items[0]: { q: "이 번호로 당첨될 수 있나요?", a: "네, 하지만 이 도구는 당첨 확률을 높이지 않습니다. 모든 로또 번호 조합은 동등한 확률을 가집니다." } / { q: "Can I win with these numbers?", a: "Yes, but this tool doesn't improve your odds. All lottery combinations have equal probability." }
- faq.items[1]: { q: "고정 번호와 제외 번호의 차이는?", a: "고정: 매번 포함될 번호. 제외: 절대 나올 수 없는 번호." } / { q: "What's the difference between fixed and excluded?", a: "Fixed: always included in every game. Excluded: never picked." }
- faq.items[2]: { q: "이것이 불법인가요?", a: "아니요. 이 도구는 난수 생성만 할 뿐 도박을 유도하지 않습니다. 하지만 로또 구매는 본인의 판단과 책임입니다." } / { q: "Is this legal?", a: "Yes. This tool only generates random numbers and does not encourage gambling. Lottery play is your personal choice and responsibility." }
- FAQPage JSON-LD with all Q&As

</pages_and_interfaces>

<core_functionality>

### Generate Draw (useLottoGenerator hook)
1. User sets gameCount, fixedNumbers, excludedNumbers
2. Click "Generate"
3. Validate feasibility: 45 − excluded.length ≥ 6 − fixed.length ?
4. If invalid, show error toast and return
5. For each game:
   a. Call fairDraw(fixedNumbers, excludedNumbers, crypto.getRandomValues)
   b. Receive 6-number array already sorted ascending
   c. Store in games array (new component state)
6. Save to localStorage immediately (no debounce)
7. Add to history (timestamp, settings, games)
8. Trigger ball-pop animations

### Copy Games
- Copy-all: flatten all games into plaintext ("Game 1: 2, 7, 18, 34, 41, 44\nGame 2: ...") → navigator.clipboard.writeText
- Fallback: TextArea select/copy (if Clipboard API unavailable)
- Toast: "복사되었습니다." / "Copied!"

### History Management
- On mount: load from localStorage, prune unknown entries (validate feasible)
- Add: prepend new entry (timestamp, settings, games), keep only most recent 20
- Clear: localStorage.removeItem() + state reset

### Fairness Algorithm (crypto-backed)
```
fairDraw(fixedNumbers: number[], excludedNumbers: number[], rng: CryptoRNG) → number[]
  validNumbers = [1..45].filter(n => !excluded.has(n))
  fixed_set = Set(fixedNumbers)
  candidates = validNumbers.filter(n => !fixed_set.has(n))
  
  // Fisher–Yates partial shuffle for 6 - fixed.length slots
  shuffle_count = 6 - fixed.length
  for i in 0..shuffle_count-1:
    j = i + random(0, candidates.length - i)  // rejection sampling: crypto.getRandomValues modulo-free
    swap(candidates[i], candidates[j])
  
  selected = candidates.slice(0, shuffle_count)
  all_numbers = [fixed.sort() + selected].sort()  // re-sort ascending for display
  return all_numbers
```

Chi-square test (vitest):
```
For K iterations:
  draw = fairDraw([], [], crypto)
  For each number n in draw:
    count[n]++
Expected[n] = K * 6 / 45
Observed[n] = count[n]
chi2 = Sum((Observed[n] - Expected[n])^2 / Expected[n])
Assert chi2 < critical_value_for_df=44_and_alpha=0.05
```

</core_functionality>

<error_handling>
  - Invalid fixed/excluded count: show validation error inline
  - Feasibility conflict (not enough numbers): show error toast, disable generate
  - Clipboard API unavailable: fallback to textarea select
  - Corrupt localStorage: zod parse error → ignore entry + start fresh (no throw, silent fail-safe)
  - Excessive history entries: trim to HISTORY_MAX (20)
  - All error messages are i18n'd (errors.* namespace)
</error_handling>

<aesthetic_guidelines>
  - Ball colors: Official Korean Lotto bands (yellow/blue/red/gray/green per 1–10/11–20/21–30/31–40/41–45 ranges)
  - Accent color: sun (primary CTA, brand alignment, category identity)
  - Typography: Gmarket Sans 700 for H1/titles, Pretendard 500/600 for body and inputs
  - Spacing: generously rounded (16–28px), white cards, soft shadows, cream app ground (--surface-muted)
  - Motion: staggered ball-pop animation (150ms each, 100ms stagger), reduced-motion = instant
  - Focus: visible focus ring (2px var(--focus-ring))
  - Contrast: all text ≥4.5:1 on background; white numerals on colored balls meet WCAG AA
</aesthetic_guidelines>

<security_considerations>
  - No user-generated content rendering (all UI from i18n keys)
  - No external data fetch; all data is deterministic from user input + crypto
  - localStorage is user-controlled (client device only); zod schema validation prevents corrupt data from crashing the app
  - No cookies or tracking (analytics via GTM/GA on platform level)
  - CSRF/XSS: not applicable (100% client SPA, no form submission to backend)
</security_considerations>

<advanced_functionality>
  - Out of scope for Phase 1; see future_considerations
</advanced_functionality>

<final_integration_test>
Scenario 1 (Happy path):
- Generate 3 games, no fixed/excluded: 18 unique valid numbers across 3 rows, each row sorted ascending, each ball colored per range

Scenario 2 (Fixed + excluded):
- Fix [1, 7], exclude [10–20, 30–40]: Generate 1 game → 6 numbers, includes 1 and 7, none from excluded ranges, sorted

Scenario 3 (Infeasible):
- Fix [1, 2, 3, 4, 5], exclude [6–45] (39 numbers): Click generate → show error "충분한 번호를 선택할 수 없습니다." → button disabled

Scenario 4 (Persistence):
- Generate 2 games → reload page → history shows 1 entry with 2 games, settings restored

Scenario 5 (Responsibility):
- Disclaimer visible on page load, FAQ includes "Does this improve odds? No."

</final_integration_test>

<success_criteria>
- All 6 numbers per game are unique and in range [1, 45]
- Numbers are sorted ascending per game
- Fixed numbers always appear in every game (if set)
- Excluded numbers never appear
- Chi-square test passes (uniformity of draws, no bias)
- Ball animations respect reduced-motion
- Copy functionality works; toast displays
- History persists across reload, max 20 entries
- Feasibility validation prevents impossible configurations
- All UI text is localized (ko/en)
- Accessibility: WCAG 2.1 AA (focus, contrast, ARIA labels)
- No layout shifts on interaction (CLS <0.1)
- Hydration safe: no browser-only values in useState initializers
</success_criteria>

<build_output>
- app/[locale]/tools/lotto-generator/page.tsx (platform route, calls LottoGenerator component)
- src/lib/lotto-generator/ (pure domain: random.ts, schema.ts, colors.ts, validate.ts, history.ts)
- src/components/tools/lotto-generator/ (React: LottoGenerator.tsx, useLottoGenerator.ts, BallDisplay.tsx, GameList.tsx, SettingsPanel.tsx, HistoryPanel.tsx, LottoIntro.tsx, LottoHowTo.tsx, LottoFaq.tsx, ResponsibilityDisclaimer.tsx)
- src/i18n/messages/ko.json + en.json: tools.lotto-generator.* namespace
- Unit tests: src/lib/lotto-generator/*.test.ts (fairness chi-square, schema validation, history ops)
- Component tests: src/components/tools/lotto-generator/*.test.tsx (render, interaction, localStorage persist)
- E2E tests: tests/e2e/lotto-generator.spec.ts (5 scenarios: generate, fixed, excluded, history, responsibility disclaimer)
</build_output>

<key_implementation_notes>
1. Registry entry: { id: "lotto-generator", slug: "lotto-generator", category: "random", icon: "Dices", accent: "sun", status: "coming_soon", addedAt: "YYYY-MM-DD", order: 150, keywords: [...] }. Status MUST be "coming_soon" (not "live" until launch decision).
2. Fairness is non-negotiable: crypto.getRandomValues + rejection sampling, chi-square test in vitest RED→GREEN.
3. Ball colors map exactly to official Korean Lotto ranges; contrast-safe on white background.
4. useLottoGenerator hook owns all state (gameCount, fixedNumbers, excludedNumbers, games, history); components are presentational.
5. localStorage key `jurepi-lotto-generator` with zod schema; corrupt data is silently ignored (fresh start).
6. History pruning on load: remove entries with invalid/infeasible settings.
7. TDD order: domain (random.ts chi-square FIRST), schema validation, history ops, then component interaction.
8. ResponsibilityDisclaimer is ALWAYS visible above the grid (not behind an accordion); not optional per design intent.
9. No external data; all draws are deterministic from user input + secure RNG.
</key_implementation_notes>

</project_specification>
```
