# 사다리타기 (Ghost Leg) — Service SPEC

> Jurepi 플랫폼의 첫 번째 도구인 **사다리타기 게임**의 빌드 사양입니다.
> 내부 서비스 코드네임: `ghost-leg` (사다리타기의 표준 영문명). 공개 URL 슬러그: `/[locale]/tools/ladder`.
>
> 이 SPEC는 **게임 자체**에 집중합니다. 공통 쉘(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공합니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 기준, 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>사다리타기 (Ladder Game / Ghost Leg / Amidakuji) - Jurepi tool, codename ghost-leg</project_name>

<overview>
The Ladder Game (사다리타기) is the launch tool of the Jurepi hub: the classic Korean ladder-lottery for fairly and playfully assigning outcomes — who buys coffee, team draws, gift order, chores, etc. Players are listed across the top, prizes/outcomes across the bottom; a randomly generated ladder of vertical lines and horizontal rungs connects each player to exactly one outcome. The user builds the ladder, then reveals results by tracing a player's path (single reveal) or revealing everyone at once.

It mounts as a tool module inside the Jurepi platform shell at /[locale]/tools/ladder. It uses the platform's header/footer, locale (ko/en), theme, consent-gated ad slots, and the DESIGN.md token system. This SPEC specifies only the game: its state model, screens, the ladder engine, interactions/animations, game-specific SEO content, and game tests.

CRITICAL: 100% client-side. The ladder engine is a set of PURE functions (shuffle/build/trace/resolve) with an injectable RNG so it is unit-testable and (Phase 2) reproducible from a shared seed. No backend, no persistence beyond optional URL-encoded share state.

CRITICAL (FAIRNESS): The game MUST be provably fair — every player has exactly 1/N probability of any given outcome, independent of starting column. A valid bijection (each prize used once) is NOT sufficient: a naive "random rungs per level" ladder is biased toward nearby outcomes and may never reach far columns — the well-known "추악한 진실(ugly truth)" of 사다리타기. Therefore fairness is DECOUPLED from the visual ladder: pick a UNIFORM random permutation FIRST (Fisher–Yates), THEN construct a ladder that realizes that permutation. Default RNG = crypto.getRandomValues (unbiased); a seeded PRNG is used only for Phase 2 shareable links.
</overview>

<platform_integration>
  - Route: /[locale]/tools/ladder (SSG; registry slug "ladder", status "live", accent "coral", category "random")
  - Provided by platform (do NOT re-implement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime
  - Consumes: i18n namespace `tools.ladder.*` in messages/{ko,en}.json; in_content AdSlot below the game; SEO metadata builder from lib/seo.ts
  - The page shell (breadcrumb + in_content ad) is rendered by the platform tool route; this module renders everything between the breadcrumb and the ad.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - CRITICAL fairness: uniform-permutation-first generation (each player→prize = 1/N), NOT naive random rungs; statistically verified
    - Setup: choose player count (2–10), edit player labels (top) and prize labels (bottom)
    - "결과 가리기" mode (prizes hidden as "?" until revealed) vs visible mode
    - Random valid ladder generation (no-adjacent-rung invariant) and SVG rendering
    - Single-player reveal with animated path trace; reveal-all with stagger
    - Reshuffle (new rungs, same labels), Reset (back to setup), Copy results
    - Result summary (player → prize mapping) and aria-live announcements
    - Game-specific SEO long-form content (사다리 타기란? / 사용 방법) + FAQ (FAQPage JSON-LD)
    - Keyboard shortcuts; reduced-motion fallbacks; sound toggle (default off)
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle (platform)
    - Tool registry, sitemap/robots, consent banner, ad loading mechanics (platform)
    - Accounts, server persistence, saving game history
  </out_of_scope>
  <future_considerations>
    - Shareable URL: encode {players, prizes, seed} → link reproduces the exact ladder + result (Phase 2)
    - OG image generation for shared results (Phase 2)
    - Per-result reactions / confetti on "당첨" (Phase 2)
    - Variable rung density / "harder" ladder option (Phase 3)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl — all from the platform</inherited>
  <module_specific>
    <randomness>crypto.getRandomValues-backed uniform RNG for the fairness shuffle (Fisher–Yates); seeded PRNG (e.g. mulberry32) ONLY for Phase 2 reproducible share links</randomness>
    <rendering>SVG for the ladder board (crisp, animatable via stroke-dashoffset)</rendering>
    <ids>nanoid v5.1 for ephemeral player/prize row IDs</ids>
    <validation>zod v3.x to validate URL-encoded share state at the boundary (Phase 2)</validation>
    <animation>Native CSS transitions + SVG stroke animation; NO animation library</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/
├── lib/
│   └── ladder.ts                  # PURE engine: uniformPermutation, ladderFromPermutation, tracePath, resolveAll (+ share encode/decode, Phase 2)
├── components/tools/ladder/
│   ├── LadderGame.tsx             # Orchestrator (Client Component) — phase machine
│   ├── LadderSetup.tsx            # player count stepper + name/prize inputs + 결과 가리기 toggle + build CTA
│   ├── LadderBoard.tsx            # SVG ladder + animated trace paths
│   ├── PlayerHeader.tsx           # clickable player chips (top)
│   ├── PrizeCards.tsx             # flippable result cards (bottom)
│   ├── ResultPanel.tsx            # reveal-all / reshuffle / reset / copy / summary
│   ├── LadderIntro.tsx            # H1 + lead (SEO)
│   ├── LadderHowTo.tsx            # 사다리 타기란? / 사용 방법 (SEO long-form)
│   ├── LadderFaq.tsx              # Q&A + FAQPage JSON-LD
│   └── useLadder.ts               # hook wrapping the pure engine + animation/reveal state
└── i18n/messages/{ko,en}.json     # tools.ladder.* keys (added by this service)
</file_structure>

<core_data_entities>
  <ladder_game_state note="client-side React state only; never persisted server-side">
    - playerCount: number (2–10, default 5)
    - players: { id: string; name: string }[] (length = playerCount; name max 12 chars; blank → "참가자 N")
    - prizes: { id: string; label: string }[] (length = playerCount; label max 12 chars; blank → default e.g. "꽝"/"당첨" pattern)
    - rows: number (ladder rung-levels = levels produced by ladderFromPermutation; equals the permutation's inversion count, optionally + canceling decoy levels to pad a pleasant minimum height; board scales/scrolls to fit — NOT a fixed formula)
    - rungs: boolean[][] (rungs[level][c] = horizontal rung between column c and c+1; c ∈ 0..playerCount-2)
    - permutation: number[] (the FAIRNESS source of truth — perm[startCol] = prizeIndex, from uniformPermutation; chosen BEFORE any rung exists)
    - mapping: Record&lt;playerId, prizeId&gt; (derived from `permutation`; resolveAll(rungs) MUST equal `permutation` — consistency check)
    - phase: enum (setup, ready, revealing, done)
    - revealedPlayers: Set&lt;playerId&gt;
    - hideResults: boolean (default true — prizes shown as "?" until revealed)
    - activeTrace: playerId | null (currently animating)
    - soundOn: boolean (default false)
    INVARIANT 1 — STRUCTURAL: within any rung level, no two adjacent columns both carry a rung (rungs[l][c] && rungs[l][c+1] is forbidden) → every node has ≤ 1 horizontal edge → the ladder is a valid bijection (each prize hit exactly once).
    INVARIANT 2 — FAIRNESS (CRITICAL): the player→prize mapping is a UNIFORM random permutation (each player→prize probability = exactly 1/N; all N! permutations equally likely). Guaranteed by drawing the permutation with Fisher–Yates FIRST, then building rungs to realize it — NEVER by hoping random rungs are "fair" (they are biased toward nearby columns). Consistency: resolveAll(rungs) MUST equal `permutation`.
  </ladder_game_state>
  <defaults>
    - Default players: "참가자 1..N" / "Player 1..N"
    - Default prizes: localized pattern, e.g. ["당첨", "꽝", "꽝", "꽝", ...] capped to playerCount (en: ["Win","Lose",...]) — used only when a field is left blank at build time
  </defaults>
</core_data_entities>

<component_hierarchy>
  <ladder_game>          <!-- "use client"; owns phase machine + useLadder() -->
    <ladder_intro />     <!-- H1 + lead (rendered server-side where possible) -->
    <ladder_setup>       <!-- phase: setup -->
      <stepper />        <!-- player count 2–10 -->
      <player_inputs />  <!-- top labels -->
      <prize_inputs />   <!-- bottom labels -->
      <toggle />         <!-- 결과 가리기 -->
      <build_button />   <!-- "사다리 만들기" -->
    </ladder_setup>
    <player_header />    <!-- phase: ready/revealing/done — clickable chips -->
    <ladder_board />     <!-- SVG ladder + animated trace -->
    <prize_cards />      <!-- flippable "?" → result -->
    <result_panel />     <!-- reveal-all / reshuffle / reset / copy / summary -->
    <ladder_how_to />    <!-- SEO long-form -->
    <ladder_faq />       <!-- FAQPage JSON-LD -->
  </ladder_game>
</component_hierarchy>

<pages_and_interfaces>
  <ladder_intro>
    - H1: "사다리 타기" / "Ladder Game" — Gmarket Sans clamp(28px,5vw,40px)/700
    - Lead: 1–2 sentences, 16px var(--text-secondary)
  </ladder_intro>

  <ladder_setup phase="setup">
    - Card: var(--surface), radius var(--radius-xl), padding 24px, shadow --shadow-card
    - Player count: Stepper "참가자 수" — value 2–10 default 5; − / + 40px buttons; value 24px/700; buttons disable at bounds
    - Two columns (stack &lt;768px): "참가자" inputs (top) and "결과" inputs (bottom)
      - Each row: TextInput 44px, rounded var(--radius-md), placeholder "참가자 1"/"결과 1", max 12 chars with counter near limit
      - Color-dot prefix per row cycles the accent palette (coral→mint→sky→sun→grape→rose) for visual pairing
    - "결과 가리기" Toggle (default ON)
    - Primary CTA: "사다리 만들기" / "Build ladder" — var(--brand), 48px, radius var(--radius-lg), hover --brand-strong + lift; full-width on mobile
    - Count sync: changing player count adds/removes rows while preserving existing values
  </ladder_setup>

  <player_header phase="ready|revealing|done">
    - Row of player chips aligned to ladder columns; chip = accent-tinted pill, 14px/600, name truncates
    - Click → start trace for that player (disabled while another trace animates)
    - Revealed chips get a check + accent border
    - a11y: each chip is a &lt;button&gt; aria-label "{name} 결과 보기"
  </player_header>

  <ladder_board>
    - SVG, responsive viewBox, preserveAspectRatio; vertical lines = playerCount evenly spaced; rungs from rungs[][]
    - Structure stroke: var(--hairline-strong) 3px round caps; trace stroke: player's accent 4px
    - Trace draw: stroke-dasharray/offset animated 280ms × segments, --ease-out; endpoint pulse on arrival (scale 1→1.3→1, 200ms) over the matched prize
    - prefers-reduced-motion: path renders instantly, no pulse
    - Min height 320px; columns keep ≥44px gap on mobile (horizontal scroll if &gt;7 players on very narrow screens)
    - role="img" with descriptive aria-label; decorative segments aria-hidden
  </ladder_board>

  <prize_cards phase="ready|revealing|done">
    - Row aligned to ladder bottoms; each a flip card 56px tall, rounded var(--radius-md)
    - hideResults ON + not revealed: "?" centered on var(--surface-muted)
    - On reveal: rotateY 300ms flip to a face tinted with the landing player's accent, label in var(--text)
    - hideResults OFF: labels visible from start
  </prize_cards>

  <result_panel>
    - Appears after first reveal
    - "전체 결과 보기" / "Reveal all" — secondary; staggers remaining traces 150ms apart
    - "다시 섞기" / "Reshuffle" — new rungs, same labels, reveals cleared
    - "처음으로" / "Reset" — back to setup (labels retained)
    - "결과 복사" / "Copy results" — clipboard text "참가자1 → 결과3 …" + success toast (clipboard fallback per error_handling)
    - phase=done: summary list mapping each player → prize with accent dot per pair
    - aria-live="polite": announces each reveal "{player}님의 결과는 {prize}입니다"
    - soundOn toggle: subtle pop on reveal (off by default)
  </result_panel>

  <ladder_how_to>
    - SEO long-form (localized): "사다리 타기란?", "사용 방법" under headings; 600–900 chars
  </ladder_how_to>
  <ladder_faq>
    - 3–5 Q&A; rendered + emitted as FAQPage JSON-LD. MUST include "사다리타기는 공정한가요?" → honest answer: this digital version IS provably fair (uniform shuffle → each player exactly 1/N regardless of starting column), and explains that hand-drawn / few-rung ladders are biased toward nearby outcomes (the common "추악한 진실"); plus "최대 몇 명까지 가능한가요?" (2–10) and "시작 위치가 유리한가요?" (no — result is independent of start; "결과 가리기" + hidden ladder also prevent gaming)
  </ladder_faq>

  <keyboard_shortcuts_reference>
    - Setup: Enter in last input → "사다리 만들기"
    - Ready: number keys 1–9/0 → reveal player at that column; "a" → reveal all; "r" → reshuffle; Esc → back to setup
    - Inert on touch (no physical keyboard)
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <ladder_engine>
    - uniformPermutation(n, rng): number[] — Fisher–Yates uniform shuffle; perm[startCol] = prizeIndex. THIS is what guarantees fairness (each player→prize = exactly 1/N), independent of the visual ladder.
    - ladderFromPermutation(perm, rng): boolean[][] — construct rungs that realize `perm` by decomposing it into adjacent transpositions (bubble-sort network), one rung per level; optionally interleave canceling decoy rung pairs to obscure structure WITHOUT changing the result. Honors the no-adjacent structural invariant.
    - tracePath(rungs, startCol): { col, level }[] — deterministic walk producing the full segment path for animation
    - resolveAll(rungs, cols): number[] — endCol per startCol; in dev MUST equal `perm` (consistency) and be a permutation
    - rng injectable: crypto-backed uniform by default; seeded PRNG for tests + Phase 2 share
  </ladder_engine>
  <reveal_flow>
    - Single: click chip/number → animate trace → flip matching prize card → mark revealed → announce
    - All: stagger remaining; inputs disabled during animation; phase → done when all revealed
    - Reshuffle keeps labels + counts; Reset returns to setup
  </reveal_flow>
  <sharing>
    - "결과 복사" copies plain-text mapping
    - Phase 2: lib/ladder.ts encode/decode {players, prizes, seed} to URL (zod-validated decode) reproduces the exact ladder
  </sharing>
  <i18n>All strings from tools.ladder.* (ko/en); default labels localized; no hardcoded copy</i18n>
</core_functionality>

<error_handling>
  <form_validation>
    - Labels capped at 12 chars (hard cap) with "12/12" counter at limit
    - Blank labels allowed → auto-filled with defaults at build time (never block the user)
    - Player count clamped 2–10 at the Stepper
  </form_validation>
  <runtime>
    <clipboard>navigator.clipboard may be unavailable (insecure context) → hidden-textarea + execCommand fallback → if both fail, show text in a Modal to copy manually</clipboard>
    <share_decode>Malformed share params fail zod validation → ignore, start fresh setup, no crash (Phase 2)</share_decode>
    <error_boundary>The platform wraps the tool module in an Error Boundary; a render failure shows retry without crashing the shell</error_boundary>
  </runtime>
  <note>No first-party network requests in this module.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is the single source of truth for all tokens. Below is game-specific application.</source>
  <accent_usage>
    - Category accent is coral, but EACH PLAYER is assigned an accent cycling coral→mint→sky→sun→grape→rose
    - A player's chip tint, their trace line color, and the face of the prize they land on all share that player's accent — color ties player → path → result
    - CTAs ("사다리 만들기", "전체 결과 보기") stay brand honey-gold; accents are identity only
  </accent_usage>
  <board>SVG structure in var(--hairline-strong) 3px; trace 4px in player accent; prize cards flip with rotateY 300ms; "?" on var(--surface-muted)</board>
  <motion>transform / opacity / stroke-dashoffset only; --ease-out cubic-bezier(0.16,1,0.3,1); durations 150/250/350ms; ALL gated by prefers-reduced-motion (instant path, cross-fade flip)</motion>
  <accessibility>SVG role/aria-label; reveals via aria-live="polite"; full keyboard operability; ≥44px tap targets; visible focus-visible rings</accessibility>
  <responsive>Setup columns stack &lt;768px; board columns keep ≥44px gap, horizontal scroll for &gt;7 players on narrow screens</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>Player/prize labels rendered as text (React escapes); NEVER dangerouslySetInnerHTML</input>
  <share_validation>CRITICAL (Phase 2): URL-encoded share state parsed via strict zod schema with bounds (playerCount 2–10, label length ≤12, arrays length-matched); reject + ignore on failure</share_validation>
  <note>No secrets; no network calls; nothing user-entered leaves the browser except via explicit copy/share by the user</note>
</security_considerations>

<advanced_functionality>
  <shareable_ladder optional="true">Phase 2: a seeded PRNG feeds the SAME uniformPermutation (still uniform/fair — seeding only makes it reproducible, never biased) + URL encode/decode reproduces the identical ladder + result on open</shareable_ladder>
  <sound>Optional subtle pop on reveal; toggle in ResultPanel; off by default; respects reduced-motion (no sound coupling required)</sound>
  <reduced_motion>Honored across trace draw, endpoint pulse, prize flip</reduced_motion>
  <fairness_transparency>How-To/FAQ honestly explain that the digital game is uniform/fair (each player 1/N, independent of start) and contrast it with the biased hand-drawn ladder — directly answering the well-known "사다리타기는 불공정하다 / 추악한 진실" critique and building user trust</fairness_transparency>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Full game with hidden results</description>
    <steps>
      1. On /ko/tools/ladder, verify setup card: player count default 5, "결과 가리기" ON
      2. Click + twice → 6 player rows and 6 prize rows; existing values preserved
      3. Enter names "민수,영희,철수,지은,현우,수빈" and prizes "꽝,커피,꽝,당첨,꽝,청소"
      4. Click "사다리 만들기" → SVG renders 6 vertical lines + valid rungs (no two adjacent rungs in any level)
      5. Verify all prize cards show "?" (hidden mode)
      6. Click chip "영희" → colored path animates 영희's column → a prize; that card flips; aria-live announces the result
      7. Clicking another chip mid-animation is blocked until current trace finishes
      8. Click "전체 결과 보기" → remaining paths reveal staggered; phase → done
      9. Verify each prize hit exactly once (bijection) and summary mapping shown
      10. Click "결과 복사" → clipboard has player→prize text; success toast
      11. Click "다시 섞기" → new ladder, same labels, reveals cleared
      12. Click "처음으로" → back to setup with labels retained
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Visible-results mode + edge counts</description>
    <steps>
      1. In setup, turn "결과 가리기" OFF → build → prize labels visible immediately (no "?")
      2. Reset; set player count to minimum 2 → verify − disabled at 2; build → 2 columns, valid single/zero rungs
      3. Reset; set to maximum 10 → verify + disabled at 10; build → 10 columns render; on a 360px viewport verify horizontal scroll keeps ≥44px column gap
      4. Leave some labels blank → build → blanks auto-filled with localized defaults
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>i18n, keyboard, reduced-motion</description>
    <steps>
      1. Switch locale to /en → all game UI + default labels in English
      2. Build a ladder; press number key "2" → reveals player at column 2 with trace
      3. Press "a" → reveal all; press "r" → reshuffle
      4. Enable OS reduced-motion → reload → reveal: path renders instantly, prize cross-fades (no rotateY/pulse)
      5. Verify aria-live announces each reveal
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>SEO for the tool page</description>
    <steps>
      1. Production build → /ko/tools/ladder and /en/tools/ladder statically generated
      2. Each has unique title, meta description, canonical, hreflang alternate, OG, and SoftwareApplication + FAQPage JSON-LD
      3. How-to + FAQ content present and localized
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Fairness — uniform distribution (the "추악한 진실" guard)</description>
    <steps>
      1. Unit: for each N in 2..10, run uniformPermutation 100,000× with a seeded RNG → tally start→prize counts in an N×N matrix
      2. Assert every cell ≈ totalRuns/N within ±1% and chi-square goodness-of-fit p &gt; 0.01 (distribution is uniform, NOT center-biased)
      3. Assert every start column reaches every prize at least once, including the farthest opposite column (no unreachable ends)
      4. For each sampled perm, build ladderFromPermutation(perm) → assert resolveAll(rungs) === perm (the visual ladder realizes the fair result exactly)
      5. UI: with "결과 가리기" ON, confirm neither prizes nor ladder reveal any positional hint before build → cannot be gamed by choosing a start column
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <fairness>CRITICAL: over ≥100,000 trials per N∈{2..10}, empirical P(start i → prize j) within ±1% of 1/N; chi-square goodness-of-fit p &gt; 0.01; every start reaches every prize incl. the farthest column (full support, NOT center-biased). Fairness is independent of starting column and of hide/show mode.</fairness>
  <functionality>Uniform-permutation-first generation; resolveAll(rungs) equals the chosen permutation and is a bijection; structural no-adjacent invariant; tracePath matches rendered path exactly; single + reveal-all flows; hide/show mode; reshuffle/reset/copy; keyboard shortcuts</functionality>
  <user_experience>Build click → board visible &lt; 100ms; trace animation smooth 60fps; reveal latency imperceptible; ≥44px targets; visible focus</user_experience>
  <technical_quality>lib/ladder.ts pure functions ≥ 80% unit coverage (invariant, bijection, trace correctness, seeded reproducibility); zero TS errors; no file &gt; 800 lines</technical_quality>
  <visual_design>Matches DESIGN.md; per-player accent ties chip↔trace↔prize; CTAs stay brand honey-gold</visual_design>
  <accessibility>Keyboard-complete; aria-live reveals; reduced-motion honored; SVG labeled; WCAG 2.1 AA contrast</accessibility>
</success_criteria>

<build_output>
  <note>Built as part of the platform (pnpm build). The tool page /[locale]/tools/ladder is prerendered via the platform's generateStaticParams over the registry.</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. FAIRNESS engine — uniformPermutation FIRST, then ladderFromPermutation; prove uniformity with a chi-square test BEFORE building anything visual. Never rely on random rungs for fairness.
    2. lib/ladder.ts pure engine overall — everything visual depends on it
    3. SVG board + tracePath alignment — the rendered path MUST match the engine's path (resolveAll === perm)
    4. Phase machine in LadderGame (setup → ready → revealing → done) + animation locking
  </critical_paths>
  <recommended_implementation_order>
    1. lib/ladder.ts — uniformPermutation (Fisher–Yates, crypto rng) + ladderFromPermutation + trace/resolve + Vitest including the chi-square FAIRNESS test (RED→GREEN); seedable rng for reproducibility
    2. tools.ladder.* messages (ko/en) incl. default labels, how-to, FAQ
    3. LadderSetup (stepper + inputs + toggle + count sync + build)
    4. LadderBoard SVG (static render from rungs) + column/row geometry
    5. Trace animation (stroke-dashoffset) + PlayerHeader chips + PrizeCards flip
    6. ResultPanel (reveal-all/reshuffle/reset/copy/summary) + aria-live
    7. Keyboard shortcuts; reduced-motion fallbacks; sound toggle
    8. LadderIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD (via platform lib/seo.ts)
    9. Phase 2: shareable URL (encode/decode + zod)
  </recommended_implementation_order>
  <ladder_algorithm>
    ```typescript
    // src/lib/ladder.ts — FAIRNESS-FIRST, pure, injectable rng.
    type Rng = () => number; // uniform in [0,1)

    // Default UNBIASED rng. (Seeded PRNG used only for Phase 2 shareable links.)
    export const cryptoRng: Rng = () => {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] / 2 ** 32;
    };

    // 1) FAIRNESS: choose a uniform permutation FIRST. perm[startCol] = prizeIndex.
    //    Each player→prize probability is exactly 1/N, independent of start column.
    export function uniformPermutation(n: number, rng: Rng = cryptoRng): number[] {
      const p = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1)); // Fisher–Yates
        [p[i], p[j]] = [p[j], p[i]];
      }
      return p;
    }

    // 2) VISUAL: build rungs that REALIZE `perm` via adjacent transpositions.
    //    Bubble-sort a copy of perm to identity, recording each adjacent swap (c,c+1)
    //    as one rung-level. The resulting ladder satisfies tracePath(s) === perm[s].
    //    (Verified: e.g. perm=[2,0,1] → rungs=[[t,f],[f,t]] → trace = [2,0,1].)
    export function ladderFromPermutation(perm: number[], rng: Rng = cryptoRng): boolean[][] {
      const n = perm.length;
      const arr = perm.slice();          // arr[col] = prizeIndex this column must reach
      const rungs: boolean[][] = [];
      for (let pass = 0; pass < n; pass++) {
        for (let c = 0; c < n - 1; c++) {
          if (arr[c] > arr[c + 1]) {
            [arr[c], arr[c + 1]] = [arr[c + 1], arr[c]];
            const level = new Array(n - 1).fill(false);
            level[c] = true;             // one rung per level → no-adjacent invariant holds trivially
            rungs.push(level);
          }
        }
      }
      // (optional) interleave canceling decoy rung pairs for visual richness — does NOT change the result.
      return rungs;
    }

    export function tracePath(rungs: boolean[][], startCol: number) {
      const path = [{ col: startCol, level: 0 }];
      let c = startCol;
      for (let l = 0; l < rungs.length; l++) {
        if (c < rungs[l].length && rungs[l][c]) c += 1;       // rung to the right
        else if (c > 0 && rungs[l][c - 1]) c -= 1;            // rung to the left
        path.push({ col: c, level: l + 1 });
      }
      return path; // last entry's col = prize index
    }

    export function resolveAll(rungs: boolean[][], cols: number): number[] {
      const out: number[] = [];
      for (let s = 0; s < cols; s++) out.push(tracePath(rungs, s).at(-1)!.col);
      // dev: out MUST equal the perm passed to ladderFromPermutation, and be a permutation of 0..cols-1
      return out;
    }
    ```
  </ladder_algorithm>
  <testing_strategy>
    - Unit (Vitest): FAIRNESS — uniformPermutation passes chi-square uniformity (within ±1% of 1/N, p &gt; 0.01) for cols 2..10 over ≥100k trials, with full support (reaches the farthest column); ladderFromPermutation realizes perm exactly (resolveAll === perm); structural no-adjacent invariant; tracePath endpoints == resolveAll; seeded reproducibility
    - Component: Stepper bounds, count sync preserves values, hide/show mode, clipboard fallback
    - E2E (Playwright): scenarios 1–3; visual regression of the board at 320/768/1024 in both themes
    - A11y: axe + keyboard reveal + aria-live + reduced-motion
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
