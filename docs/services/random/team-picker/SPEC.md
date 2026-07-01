# Team Picker — Random Fair Team Builder — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Team Picker** (팀 나누기) — a client-side tool to randomly and fairly split a list of names (or a count) into balanced teams. Input names by pasting a line-separated list or tapping to add chips; set team count or team size; invoke fair shuffle (crypto.getRandomValues-based); receive balanced partition (team sizes differ by ≤1); optional captain-lock seeding; result as downloadable PNG + copy-to-text. No backend, no skill-based matching — pure random fairness.
> Internal service codename: `team-picker`. Registry id: `team-picker`. Public URL slug: `/[locale]/tools/team-picker`.
>
> This SPEC covers the **tool itself**. The shared shell, tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Team Picker — Random Fair Team Builder (Jurepi tool, codename team-picker, registry id team-picker)</project_name>

<overview>
Team Picker solves the age-old problem: "How do we split this group fairly into teams?" A user enters names (paste a list, or type a count to generate auto-suggested fruit-emoji names), declares how many teams OR members per team, and hits "Shuffle." The tool instantly partitions the names into balanced teams (team sizes differ by at most 1) using cryptographically-random shuffling and deterministic assignment. Optional captain lock: designate one captain per team (seeded first), re-shuffle others around them. Result is shown as a card layout (team color, member list) and downloadable as a PNG image. Copy-to-text copies the team structure as plain text (e.g., "Team A: Alice, Bob, Carol…").

CRITICAL (client-only, SSG): 100% client-side. No backend, no database. Shuffle uses `crypto.getRandomValues` (secure random); partition is pure function. The only first-party persistence is localStorage (last input + last partition), and nothing is sent over the network.

CRITICAL (SPA, usability-first): per platform rule, Team Picker is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — input, toggle team-count/team-size, set captains, shuffle, download — happens via local React state with NO route navigation and NO full page reload. The route is statically generated (SSG) for SEO; the interactive tool is a single client-component island.

CRITICAL (fairness, not skill): the tool does NOT match players by skill, role, strength, etc. It does ONLY balanced-count random partition with optional captain locks. Fairness = every permutation equally likely (within captain constraints).
</overview>

<platform_integration>
  - Route: /[locale]/tools/team-picker (SSG; registry slug "team-picker", id "team-picker", status "live", accent "mint", category "random").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.team-picker.*` (UI chrome: input labels, button text, empty states, how-to, FAQ — NOT team names; those are user-provided); the in_content AdSlot.
  - Platform dependency (SMALL — NO new category needed): the `'random'` category already exists in `ToolCategory` with the `mint` accent and label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Input modes: paste a line-separated list of names, OR type a count (auto-suggest fruit-emoji names: 🍎 Apple, 🍌 Banana, …).
    - Partition controls: toggle "Number of teams" (default 2) OR "Members per team" (calculated from count). Bidirectional: change team count → auto-recalc team size; change team size → auto-recalc team count.
    - Fair shuffle: use crypto.getRandomValues for unbiased random permutation; partition into balanced teams (sizes differ by ≤1; remainder distributed).
    - Captain lock (optional): designate one captain per team (seed captains first, shuffle others around them); captains remain fixed, non-captains redistributed.
    - Result views: card layout (team name, accent color, member list); downloadable PNG (reuse lib/result-image pattern: SVG→PNG self-contained image with team+members+title).
    - Copy to text: copy team structure as plain-text block (e.g., "Team A: Alice, Bob\nTeam B: Carol, Dave…").
    - localStorage persistence: save last input (names or count), last partition, last captains — restore on reload.
    - Keyboard support: Enter to shuffle, Tab to navigate, Esc to clear.
    - Full accessibility (WCAG 2.1 AA): labeled inputs, roving tabindex, visible focus, copy/download toast feedback.
    - SEO long-form ("Why split teams fairly?" / "How randomness works") + FAQ (FAQPage JSON-LD), HowToPerformAction JSON-LD.
    - Reduced-motion fallbacks; light + dark theme support.
  </in_scope>
  <out_of_scope>
    - Skill-based or ELO-based balancing (MVP is random only).
    - Backend team storage / cross-device sync / accounts.
    - Weighted random (e.g., prefer balanced skill groups) — pure uniform shuffle only.
    - Sub-teams or brackets (Phase 2 candidate).
    - Undo/redo history (Phase 2 candidate).
  </out_of_scope>
  <future_considerations>
    - Weighted randomization (Phase 2) — designate player strength/role, algorithm aims for balanced teams.
    - Persistent shuffle history + undo (Phase 2).
    - Team color/name customization (Phase 2).
    - Export as CSV or printable format (Phase 2).
    - Randomized order-of-play list (Phase 3).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <random>Web Crypto API — `crypto.getRandomValues(new Uint32Array(1))[0]` for secure random seed; fisher-yates shuffle implementation.</random>
    <partition>Pure function: fisher-yates(names) → assign to teams via modulo or balanced distribution (sizes differ ≤1).</partition>
    <image_export>Reuse `lib/result-image.ts` SVG builder pattern (self-contained SVG with team+member layout) → rasterize to PNG via `html2canvas` (or similar client-side SVG→PNG, no server).</image_export>
    <validation>zod for input schema (names array, team count/size, captain indices).</validation>
    <clipboard>navigator.clipboard.writeText → execCommand fallback → silent fail (copy is secondary).</clipboard>
    <animation>CSS transitions only (team card entrance fade, shuffle spin on button). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; validate team config (count/size consistency, captain indices exist).</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/team-picker/                    # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                       # zod: TeamInput, TeamConfig, ShuffleResult; captain indices validation
│   ├── shuffle.ts                      # fisher-yates(array, seed) → permuted array; crypto.getRandomValues seed
│   ├── partition.ts                    # balancedTeams(names, count, captains?) → Team[] (deterministic, fair)
│   ├── captain-lock.ts                 # applyCaptainLock(names, captainIndices) → {captains, others}
│   └── result-image.ts                 # buildTeamSvgString(params): self-contained SVG (teams+members+colors)
├── components/tools/team-picker/
│   ├── TeamPicker.tsx                  # Orchestrator (Client Component) — input/config/shuffle/results state
│   ├── useTeamPicker.ts                # Hook: localStorage persistence + API (setNames, setTeamCount, setShuffle, copy, download)
│   ├── NameInput.tsx                   # Textarea/chip input OR count input toggle
│   ├── TeamConfig.tsx                  # Toggle "Team Count" ↔ "Team Size"; spinners; bidirectional sync
│   ├── CaptainSelector.tsx             # Checkboxes or roving list to designate 1 captain per name (optional)
│   ├── ShuffleButton.tsx               # Main action (disabled if empty input or captain count mismatch)
│   ├── TeamResultCard.tsx              # One team: color + name + member list; roving tabindex
│   ├── ResultPanel.tsx                 # Grid of TeamResultCard; copy + download buttons
│   ├── TeamPickerIntro.tsx             # H1 + lead (SEO; server-render where possible)
│   ├── TeamPickerHowTo.tsx             # "Fair teams use random shuffle" + HowToPerformAction JSON-LD (SSR)
│   ├── TeamPickerFaq.tsx               # Q&A + FAQPage JSON-LD
│   └── data/
│       └── fruit-emojis.ts             # Default name suggestions: [{ emoji: '🍎', name: 'Apple' }, …]
└── i18n/messages/{ko,en}.json          # tools.team-picker.* UI chrome (input, config, buttons, empty, FAQ)
</file_structure>

<core_data_entities>
  <team_input>
    - mode: enum (list | count) — paste names OR type a count
    - value: string — either newline-separated names or a numeric count
    - names: string[] (derived if mode=list, or auto-generated if mode=count)
  </team_input>
  <team_config>
    - mode: enum (by-count | by-size) — "Divide into N teams" or "N members per team"
    - teamCount: number (≥2, ≤ names.length)
    - INVARIANT: teamCount + teamSize must allow balanced partition of names.length
  </team_config>
  <captain_lock>
    - enabled: boolean — if true, designate 1 captain per team (optional feature)
    - captainIndices: number[] — indices into names[] (length must equal teamCount if enabled)
    - INVARIANT: all indices in range [0, names.length); no duplicates
  </captain_lock>
  <team_result>
    - id: string (team-A, team-B, …)
    - name: string ("Team A", "Team B", …)
    - accentHex: string (mint + variant per team, from DESIGN tokens)
    - members: string[] (names in this team)
    - captain?: string (if captain-lock enabled, the captain of this team)
  </team_result>
  <app_store>
    - version: number (STORE_VERSION, starts at 1)
    - names: string[] (last input)
    - teamCount: number; mode: enum
    - results: Team[] (last partition)
    - captainIndices?: number[]
    - meta: { shuffledAt: number; }
    - localStorage key: `jurepi-team-picker`
  </app_store>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/team-picker" page="TeamPicker (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<pages_and_interfaces>
  <team_picker_intro>
    - Eyebrow: "무작위 도구" / "RANDOM TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "팀 나누기" / "Team Picker" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "공정하게 팀을 나누어요. 이름을 입력하고 '섞기'를 누르면 균형 잡힌 팀이 만들어집니다." / English equivalent.
  </team_picker_intro>

  <name_input>
    - Toggle: [Paste Names] [Count] — switch input mode.
    - Mode=list: textarea (rows=6, placeholder "이름을 한 줄에 하나씩 입력하세요\nAlice\nBob\nCarol…"). Leading icon (lucide Users 20px var(--text-muted)).
    - Mode=count: number input (min=2, max=999, placeholder "참가자 수 입력 (예: 10)"). Auto-suggest fruit-emoji names (🍎 Apple 1, 🍌 Banana 2, …).
    - DESIGN text-input style. Trailing clear (×) when non-empty.
  </name_input>

  <team_config>
    - Toggle: [Number of Teams] [Members per Team].
    - Display spinners (↑/↓ or +/− buttons, 44px tap target). Min team count = 2; max = names.length.
    - Bidirectional: adjust team count → auto-calc team size (rounded down, re-balance); adjust team size → auto-calc team count.
    - Validation note: if (names.length % teamCount !== 0), show hint "팀 크기: 최대 M명, 최소 N명" (sizes differ ≤1).
  </team_config>

  <captain_selector>
    - Optional toggle: "팀 고정 (선택사항)" / "Lock Captains (optional)".
    - If enabled: show 1 checkbox per name + team-color indicator + "(captain #1)". User selects exactly teamCount captains.
    - Disable Shuffle button if (captain count ≠ teamCount).
    - If disabled: captains are not selected; shuffle ignores.
  </captain_selector>

  <shuffle_button>
    - Primary button (brand honey-gold var(--brand)), icon (lucide Shuffle 20px), text "섞기" / "Shuffle".
    - Disabled if (names.length < 2 OR team count/size invalid OR captains enabled + count ≠ teamCount).
    - On click: invoke partition (with captains if enabled) → set results → localStorage save.
    - Loading state: spinner icon (250ms) while computing (quick, but visible feedback).
  </shuffle_button>

  <team_result_card>
    - Grid: 1–3 columns (responsive: ≥1024px 3-col, 768–1023px 2-col, <768px 1-col).
    - Card: var(--surface), 1px var(--hairline), radius var(--radius-lg), padding 16px.
    - Header: team name (18px/700 var(--text)) + accent color dot (8px circle, that team's accent hex).
    - Body: members list (14px var(--text-secondary), one per line or comma-separated if space constrained).
    - Footer (if captain): "캡틴: {name}" / "Captain: {name}" — 12px/600 var(--accent-mint), italic.
    - States: hover (desktop) → translateY(-2px) + shadow-card-hover; focus (keyboard) → 2px var(--focus-ring).
  </team_result_card>

  <result_panel>
    - Below cards: [Copy as Text] [Download PNG] buttons (secondary style).
    - "Copy as Text": copies "Team A: member1, member2\nTeam B: …" → toast "복사되었어요" / "Copied!".
    - "Download PNG": triggers PNG export via lib/result-image pattern (SVG string → rasterize → download team-picker-YYYYMMDDHHMM.png).
    - Empty state (no shuffle yet): hint "섞기를 눌러서 팀을 만들어보세요" / "Press Shuffle to build your teams."
  </result_panel>

  <keyboard_shortcuts>
    - Enter (input focused) → Shuffle (same as button click).
    - Tab → roving focus through team cards.
    - Esc → clear input (if focused).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <shuffle note="pure domain layer">
    - fisherYates(array, seed): in-place permutation using crypto-derived seed. O(n), deterministic given seed.
    - seed source: crypto.getRandomValues(new Uint32Array(1))[0].
    - Test: assert every permutation of small input (n=3,4) appears with ~equal probability over 1000 runs (chi-square test).
  </shuffle>
  <partition note="pure, balanced distribution">
    - balancedTeams(names, teamCount, ?captainIndices): names shuffled, then assigned to teams round-robin (teams 0,1,2,…0,1,2,… until all assigned).
    - Result: Team[] with members property (names). Sizes differ ≤1.
    - Test: assert sum of team sizes = names.length; max size − min size ≤ 1.
  </partition>
  <captain_lock note="conditional, pure">
    - If captains enabled: extract captainIndices → place at team[i % teamCount] as first member. Shuffle non-captains; assign to fill teams.
    - Test: assert captains appear in correct team.
  </captain_lock>
  <persistence_adapter useTeamPicker>
    - Mount: read `jurepi-team-picker` → zod → state; fail → start fresh. Absent localStorage → in-memory (fully usable, non-persistent).
    - Change: debounced JSON.stringify (names, teamCount, results, meta) → setItem; catch quota → keep in-memory.
    - Expose: names, teamCount, results, setNames, setTeamCount, shuffle, copy(text), download(png).
  </persistence_adapter>
  <i18n>All UI chrome from tools.team-picker.* (ko/en): input labels, config, buttons, empty states, how-to, FAQ. Team names are user-provided or auto-generated emoji names (NOT i18n keys).</i18n>
</core_functionality>

<error_handling>
  <input_validation>
    - Empty input → show hint, disable Shuffle.
    - Names with leading/trailing whitespace → trim; skip empty lines.
    - Count=1 or count > 999 → show validation error ("최소 2명 필요").
    - Duplicate names → allowed (no de-dupe); warn if user intention unclear.
  </input_validation>
  <captain_mismatch>
    - If captain count ≠ teamCount → disable Shuffle, show tooltip "각 팀에 한 명씩 선택하세요".
  </captain_mismatch>
  <clipboard_failure>
    - Copy is secondary. clipboard → execCommand fail → silent (no false success toast).
  </clipboard_failure>
  <storage>
    <unavailable>Private mode/disabled → results in-memory, no scary error. Tool fully usable.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (no throw).</corrupt_blob>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is MINT (var(--accent-mint)) — "random" category identity per DESIGN. Shuffle button = brand honey-gold (action); team cards = accent-mint per-team (identity + variety).
    - Team card accent rotation: team-A mint, team-B sky, team-C sun, team-D grape, team-E coral, team-F rose (repeat if > 6 teams). Each team's accent is stable across shuffles.
  </accent_usage>
  <typography>H1 Gmarket Sans (clamp 28–40px); team name 18px/700; member list 14px/500; captain label 12px/600 italic. Input labels eyebrow 12px/700.</typography>
  <motion>transform/opacity only: shuffle button spin (rotate 360°) 250ms, card entrance fade 150ms, hover lift translateY(-2px) 150ms. Gated by prefers-reduced-motion (instant, no spin).</motion>
  <responsive>≥1024px: 3-column team grid; 768–1023px 2-col; <768px 1-col. No overflow at 320px.</responsive>
  <icons>lucide-react: Users (input), Shuffle (button), Copy (action), Download (action), ChevronUp/ChevronDown (spinners). Default 20px, stroke 1.75, currentColor. Registry card icon: `Users`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <random>Crypto API seed (not Math.random) ensures unbiased randomness. No exploitable patterns.</random>
  <input>User-provided names rendered as text nodes (React escape). No dangerouslySetInnerHTML. Emoji names are hardcoded data.</input>
  <privacy>Results localStorage-only, never sent. No analytics event includes team data. How-to/FAQ state plainly.</privacy>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<final_integration_test>
  <test_1>Paste 6 names → team count=2 → Shuffle → expect 2 teams (3 each), all names present, captain absent.</test_1>
  <test_2>Count=8 → auto-generate (🍎 Apple, 🍌 Banana, …) → toggle "Members per Team"=3 → auto-calc team count=3 (one team gets 2, others 3) → Shuffle → verify balance.</test_2>
  <test_3>6 names + enable captains → select 3 captains (indices 0,2,4) → Shuffle → captains locked in correct teams, others random.</test_3>
  <test_4>Copy text → clipboard has "Team A: Alice, Bob, Carol…" → Download PNG → file team-picker-*.png (SVG rasterized).</test_4>
  <test_5>Reload → localStorage persists last input + results. Shuffle again → new random partition (not same as before unless extreme coincidence).</test_5>
  <test_6>i18n /en → chrome English; /ko → Korean. All 6 tests repeat in both locales. 320px no overflow; Lighthouse CWV green.</test_6>
</final_integration_test>

<success_criteria>
  <functionality>Input names or count; toggle team-count/team-size (bidirectional); optional captain lock; fair random shuffle (crypto seed); balanced teams (±1 size); download PNG + copy text.</functionality>
  <ux>Input instant; shuffle <250ms (spinner shown); results card layout (color + members); every action ≥44px; visible focus; keyboard operable (Enter, Tab, Esc); SPA — no reload.</ux>
  <technical>lib/team-picker/* pure ≥80% coverage (shuffle/partition/captain-lock); zod schema; TS 0 errors; <800 lines per file; result-image SVG pattern reused.</technical>
  <visual>DESIGN.md compliant; mint + 6-team accent rotation; responsive 320/768/1024; text-node render; motion-respect.</visual>
  <a11y>Full keyboard (roving cards, Enter, Tab, Esc); aria-label on team cards; labeled buttons; motion-respect; WCAG 2.1 AA.</a11y>
  <performance>Tool route within platform budget; result PNG ~50–100KB; LCP <2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/team-picker pre-rendered by platform generateStaticParams. Result SVG→PNG export is client-side (no server processing).</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Pure shuffle + partition domain logic (lib/team-picker/, ≥80% tested first).
    2. Result image SVG builder (reuse pattern from ladder result-image).
    3. Input ↔ Team config bidirectional sync (count ↔ size).
    4. Captain lock (optional, but clean integration if enabled).
  </critical_paths>
  <recommended_order>
    1. lib/team-picker/{schema,shuffle,partition,captain-lock}.ts Vitest (RED→GREEN).
    2. lib/team-picker/result-image.ts (reuse ladder pattern).
    3. tools.team-picker.* messages (ko/en).
    4. useTeamPicker hook (localStorage, shuffle invocation).
    5. NameInput + TeamConfig (bidirectional state sync).
    6. CaptainSelector (optional toggle).
    7. ShuffleButton + ResultPanel (TeamResultCard grid, copy, download).
    8. TeamPickerIntro/HowTo/Faq + JSON-LD (SoftwareApplication, HowToPerformAction, FAQPage).
    9. Registry entry; slug→component; E2E 1–6; visual 320/768/1024 both themes.
  </recommended_order>
  <testing_strategy>Vitest ≥80% (shuffle chi-square, partition balance, captain lock); E2E scenarios 1–6 (io modes, config toggle, captains, copy/download, i18n, no overflow); a11y (axe, roving focus, ARIA labels); PNG export mock (SVG string generated, no real rasterization in unit).</testing_strategy>
</key_implementation_notes>

</project_specification>
```

