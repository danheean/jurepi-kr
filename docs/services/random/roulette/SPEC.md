# Roulette — Decision Wheel for Fair Random Picks — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Roulette** (룰렛 돌리기) — a spin-to-decide tool where users add options to a wheel, apply optional per-option weights, spin to land on a fair random winner, see the result highlighted, and optionally remove that winner to re-spin. The entire interaction is client-side: no routing, no reload, no backend. Persistence is localStorage (save/load named option sets). Display is pure SVG with CSS `transform: rotate()` animation; reduced-motion reveals the winner instantly.
> Internal service codename: `roulette`. Registry id: `roulette`. Public URL slug: `/[locale]/tools/roulette`.
>
> This SPEC covers the tool itself. Platform shell, tool registry, SEO & ad infrastructure, and design tokens are provided:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system: [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC: [`docs/services/game/ladder/SPEC.md`](../../game/ladder/SPEC.md)

```xml
<project_specification>

<project_name>Roulette — Decision Wheel (Jurepi tool, codename roulette, registry id roulette)</project_name>

<overview>
Roulette brings the thrill of the spin to decision-making. Users type or paste option names into a list, optionally assign weights (higher weight = larger slice), hit spin, and watch the wheel rotate to reveal a winner. The winner is highlighted on-screen with confetti (optional, dependency-free, respects reduced-motion). The entire interaction is a **single-page SPA**: no route changes, no full reload. Use "remove winner" mode to draw multiple times from the same wheel. Save favorite option sets by name to localStorage for instant reload.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no API. The only persistence is localStorage (option sets + last active set name). Random pick uses `crypto.getRandomValues` for cryptographic uniformity (bias-free selection independent of visual angle). Wheel layout is pure SVG; spin is CSS `transform: rotate()` with ease-out, instant on `prefers-reduced-motion`.

CRITICAL (SPA, usability-first): Every Jurepi tool is a client-side Single-Page Application. Interaction — adding options, changing weights, spinning, saving/loading — happens entirely in React state with NO route navigation and NO full page reload. The route is statically generated (SSG) for SEO; the interactive tool is a single client-component island.
</overview>

<platform_integration>
  - Route: /[locale]/tools/roulette (SSG; registry slug "roulette", id "roulette", status "live", accent "rose", category "random").
  - Provided by platform: app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.roulette.*` (UI chrome strings: labels, buttons, help text — NOT option names; those come from localStorage/user input).
  - Platform dependency (NO new category needed): the `'random'` category already exists with the `rose` accent and the "랜덤·추첨"/"Random" label. Only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Option list management: add (2..30 options), edit label, remove, reorder (drag or arrow buttons)
    - Per-option weight: optional numeric weight (default 1, min 1); display as slice size in SVG
    - Spin: CSS animated rotation (transform: rotate) over ~4s with ease-out; reduced-motion reveals winner instantly
    - Winner reveal: highlight slice + option name prominently + play optional sound (Web Audio API, toggle in settings)
    - "Remove winner" sequential draw mode: re-spin excluding the last winner
    - Confetti on win (pure CSS/JS, zero dependencies, respects reduced-motion)
    - Save/load named option sets (localStorage): persist list state by set name, default set on mount
    - Keyboard-navigable: Tab through inputs/buttons, Enter to add, Backspace in name field to delete
    - Responsive (320/375/768/1024/1440): SVG scales; controls grid/stack as needed
    - Sound toggle + volume slider (Web Audio context, beep on tick / chime on win)
    - Tool-specific SEO long-form + FAQ (FAQPage JSON-LD), SoftwareApplication JSON-LD, localized ko/en
    - Accessibility: WCAG 2.1 AA, visible focus, ARIA labels, color contrast
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry (all platform)
    - In-app image/photo upload for custom backgrounds
    - Backend sync / cross-device persistence
    - Per-option emojis or rich styling (simple text labels only)
    - Link-sharing of wheels (Phase 2 candidate with per-wheel routes)
  </out_of_scope>
  <future_considerations>
    - Deep-link per wheel + shareable unique URL — Phase 2
    - Undo/redo stack for option edits — Phase 2
    - Weighted random distribution analytics (chart) — Phase 3
    - Custom wheel colors per user preference — Phase 3
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <wheel_svg>Rendered as pure SVG: circle + slices (path elements), tick marks, center label area. CSS `transform: rotate()` animates spin. Slice angle = (weight / total weight) × 360°. Labels are rendered **radially** (rotated to the slice's mid-angle, reading inner→outer along the radius) so thin wedges still fit text; font size auto-scales with option count (clamp) and long labels truncate with `…` (full name preserved via `<title>`/aria-label). Above LEGEND_THRESHOLD options the slice shows its **index number** instead of the name and a numbered legend list maps number→full label beside/below the wheel.</wheel_svg>
    <random_selection>crypto.getRandomValues → uniform float [0, 1) × total weight → binary search to land on slice. Independent of visual angle (fair, bias-free).</random_selection>
    <animation>CSS transitions (rotate 4s ease-out); Web Audio API beeps (oscillator + gain); CSS keyframe confetti (scale, fade); all gated by `prefers-reduced-motion` (instant reveal, no motion).</animation>
    <persistence>localStorage key `jurepi-roulette`: { version, sets: { [name]: { options: [{label, weight}...] } }, lastSetName }. Read on mount → zod parse → pruneUnknown. Write on every change (no debounce — instant sync).</persistence>
    <clipboard>Option labels are plain text (no dangerouslySetInnerHTML). User input via text inputs validated (non-empty, reasonable length).</clipboard>
  </module_specific>
  <libraries>
    <zod>zod v3.x (already in repo) for option/set schemas and localStorage validation.</zod>
    <web_audio>Native Web Audio API (no library) for sound context + oscillator beeps + gain nodes.</web_audio>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/roulette/                       # Pure domain layer (no React/Next)
│   ├── schema.ts                       # zod: Option, OptionSet, StoreSchema (STORE_VERSION, sets, lastSetName)
│   ├── random.ts                       # fairWeightedPick(options) → index via crypto.getRandomValues
│   ├── geometry.ts                     # sliceAngle(weight, total), labelPosition(angle, radius)
│   ├── sound.ts                        # playTick(freq, duration), playWin(freq, duration) via Web Audio API
│   └── sets.ts                         # immutable ops: addSet, renameSet, deleteSet, updateOptions, loadLastSet
├── components/tools/roulette/
│   ├── Roulette.tsx                    # Client Component; owns state (options, weights, spinning, selectedIndex, savedSets)
│   ├── useRoulette.ts                  # Hook: wheel geometry, random pick, localStorage persistence (favorites/sets)
│   ├── WheelSVG.tsx                    # Pure SVG wheel render (slices, ticks, center label, winner highlight); adaptive radial labels, index-number mode + numbered legend above LEGEND_THRESHOLD
│   ├── OptionList.tsx                  # Add input + option row (label, weight, delete button)
│   ├── SpinButton.tsx                  # Main CTA; disabled when <2 options
│   ├── ResultPanel.tsx                 # Winner reveal (name, "spin again?" prompt, confetti)
│   ├── SaveLoadPanel.tsx               # Save current → name input + save button; load → button grid of saved sets
│   ├── SettingsPanel.tsx               # Sound toggle + volume slider; remove-winner checkbox
│   ├── RouletteIntro.tsx               # H1 + lead (SEO; server-render where possible)
│   ├── RouletteHowTo.tsx               # "How to spin" / "Tips for fair decisions" (SEO long-form)
│   ├── RouletteFaq.tsx                 # Q&A + FAQPage JSON-LD
│   └── confetti.ts                     # Dependency-free confetti: CSS keyframe + element spawn on win (respects prefers-reduced-motion)
└── i18n/messages/{ko,en}.json          # tools.roulette.* UI chrome (add, spin, save, load, sound, etc.)
</file_structure>

<core_data_entities>
  <option>
    - label: string (required, non-empty, max 50 chars) — user-facing name for the slice
    - weight: number (≥1, default 1, max 1000) — relative size of the slice
    - Immutable: updates return new array, never mutate in-place.
  </option>
  <option_set>
    - name: string (unique within sets; "Untitled 1", "Lunch Picker", etc.)
    - options: Option[]
    - createdAt: timestamp (for sort/display)
  </option_set>
  <roulette_store>
    - version: number (STORE_VERSION=1)
    - sets: { [name]: OptionSet } — all saved sets
    - lastSetName: string | null — which set to load on mount
    localStorage key: `jurepi-roulette`
    Invariant: read is zod-parsed; fail → start fresh (no throw).
  </roulette_store>
  <constants>
    - MIN_OPTIONS = 2, MAX_OPTIONS = 30; MIN_WEIGHT = 1, MAX_WEIGHT = 1000
    - LEGEND_THRESHOLD = 16 (≤ this: full names on slices; > this: index numbers on slices + numbered legend list)
    - SPIN_DURATION_MS = 4000; TICK_FREQ_HZ = 800; WIN_FREQ_HZ = 1200; CONFETTI_COUNT = 50
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/roulette" page="Roulette (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <roulette>                    <!-- "use client"; owns options, spinning, selectedIndex, savedSets, lastSetName state + useRoulette() owner -->
    <roulette_intro />          <!-- H1 + lead (server-render where possible) -->
    <layout_grid>               <!-- Desktop 2-split (SVG | controls), mobile stacked -->
      <wheel_column>
        <wheel_svg />           <!-- SVG wheel, highlights winner, animates on spin -->
        <result_panel />        <!-- Winner name + "spin again" + confetti -->
      </wheel_column>
      <control_column>
        <option_list />         <!-- Add input, option rows (label, weight input, delete), min 2 max 30 -->
        <spin_button />         <!-- Large CTA, disabled if <2 options or spinning -->
        <save_load_panel />     <!-- Save → name input + button; Load → grid of saved sets -->
        <settings_panel />      <!-- Sound toggle + volume slider; remove-winner checkbox -->
      </control_column>
    </layout_grid>
    <roulette_how_to />         <!-- SEO long-form -->
    <roulette_faq />            <!-- FAQPage JSON-LD -->
  </roulette>
</component_hierarchy>

<pages_and_interfaces>
  <roulette_intro>
    - Eyebrow: "랜덤·추첨 도구" / "RANDOM TOOL" — 12px/700/0.6px, var(--brand-ink)
    - H1: "결정의 룰렛" / "Decision Roulette" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)
    - Lead: "선택지를 적어서 돌리면 공정하게 결정해줍니다." / "Spin to decide fairly from your options."
  </roulette_intro>

  <wheel_svg>
    - Container: 320px square (scales on mobile); center at (160, 160). For dense wheels (many options) the SVG viewBox may enlarge (e.g. up to 400px) to preserve arc length while still scaling responsively.
    - Radius: 140px (outer), 40px (center label area)
    - Each slice: path with arc from angle[i] to angle[i+1], wedge to center
    - Slice color: rose accent `var(--accent-rose)` all slices, with slight tint variance per index (rose-soft to rose saturated)
    - Slice label (adaptive): rendered radially (rotated to slice mid-angle, reading inner→outer). Font size auto-scales down as option count rises (clamp, floor ~9px); overflow truncated with `…`, full label in `<title>`/aria-label. ≤ LEGEND_THRESHOLD (16): full names on slices. > 16: slice shows index number; a numbered legend (1→name, 2→name…) renders beside/below the wheel so all options stay scannable pre-spin.
    - Center label: winner name (non-spinning text, always visible above spinning slices) — always full name regardless of slice density, so the result is never obscured by thin wedges
    - Tick marks: 24 small radial lines around edge for spin-tick animation (decorative; decoupled from slice count)
    - Selected slice highlight: 2px var(--accent-rose) outline + glow on result
    - Animation: `transform: rotate(0deg → finalAngle)` 4s ease-out, 0s on reduced-motion
  </wheel_svg>

  <option_list>
    - Heading "옵션 추가" / "Add Option" — 16px var(--text)
    - Input row: text field (max 50 chars, placeholder "예: 점심 추천") + weight spinner (1–1000) + delete button (—)
    - Option rows: each has label + weight input + delete button; drag handle (six dots) for reorder
    - Min 2 options to enable spin; max 30. Readability at high counts is handled by adaptive labels (radial + auto-scale + `…` truncation) and, above LEGEND_THRESHOLD (16), a numbered legend — not by a hard low cap
    - Min weight 1; if user sets 0 → default to 1
    - States: focused input 2px var(--accent-rose) ring; option row hover lifts
  </option_list>

  <spin_button>
    - 56px tall, rounded var(--radius-lg), background var(--brand), text var(--on-brand), "지금 돌리기!" / "SPIN!"
    - Disabled (< 2 options or already spinning): opacity 0.5, cursor not-allowed
    - Hover (enabled): scale(1.05) 150ms; press scale(0.98)
    - On click: disable, generate random final angle, animate rotate over 4s, play tick sounds, reveal result, re-enable
  </spin_button>

  <result_panel>
    - Appears below/beside wheel on result
    - Large winning option name (28px var(--text) Gmarket Sans/700)
    - "축하합니다!" / "You landed on…" eyebrow
    - Confetti animation 1.5s (scale + fade, respects prefers-reduced-motion)
    - Buttons: "다시 돌리기" / "Spin Again" (primary), "결과 제거 후 돌리기" / "Remove & Re-spin" (secondary, if toggle on)
  </result_panel>

  <save_load_panel>
    - Save section: "이 조합 저장" / "Save Set" input (max 50 chars, default "Untitled 1") + save button
    - Load section: grid of saved set buttons; each shows name + option count + delete icon (×)
    - Clicking a load button replaces current options + selects that set as lastSetName
    - Empty state: no saved sets → "조합을 저장하면 여기에 보여요"
  </save_load_panel>

  <settings_panel>
    - Sound toggle: "소리" / "Sound" switch (default ON); below it "음량" / "Volume" slider 0–100%
    - "결과 제거 후 재시작" / "Remove Winner Mode" toggle (default OFF); if ON, "다시 돌리기" button removes winner from wheel
    - Keyboard: Tab through, Space to toggle
  </settings_panel>

  <keyboard_shortcuts_reference>
    - Tab: navigate inputs/buttons (DOM order)
    - Enter (in add input): add option; (in save input): save set; (on load button): load set
    - Backspace (in add input with focus): clear all if empty input focused
    - Space (on toggle): switch setting
    - Disabled on spin animation
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <wheel_geometry>
    - sliceAngle(weight, total) = (weight / total) × 360 degrees
    - labelPosition(angle): x = 140×cos(angle), y = 140×sin(angle) — arc midpoint for text placement
    - finalAngle (spin result): scaled to 0–360 based on selected slice, rotated so winner is at top
  </wheel_geometry>
  <random_selection>
    - fairWeightedPick(options) → index: crypto.getRandomValues → float [0, total weight) → binary search to slice index
    - Guarantees uniform selection across repeated spins (unbiased by visual layout, strictly mathematical)
  </random_selection>
  <animation>
    - Spin: `transform: rotate(0deg → finalAngle)` 4000ms cubic-bezier(0.16,1,0.3,1)
    - Sound: play 10–12 tick beeps during spin (increasing freq), one chime on reveal
    - Confetti: spawn 50 div.confetti-particle, each scale 1→0.2, opacity 1→0 over 1.5s, rotate random, stagger 50ms
    - All gated by `prefers-reduced-motion` (instant reveal, fade only, no transforms)
  </animation>
  <persistence>
    - Mount: read localStorage jurepi-roulette → zod parse → set state; fail → empty options
    - On every change (add/edit/delete/weight/save/load): immutable update → setItem (no debounce)
    - Save set: { name, options } added to sets; lastSetName = name
    - Load set: options replaced; lastSetName = name; re-render wheel
  </persistence>
  <i18n>All UI chrome from tools.roulette.* (ko/en): labels, buttons, help, placeholders. Option names are user input (locale-agnostic).</i18n>
</core_functionality>

<error_handling>
  <option_validation>
    - Empty label → toast "옵션 이름을 입력하세요" / "Enter an option name"; focus input
    - Duplicate label (case-insensitive) → toast "이미 있는 옵션입니다"; focus input
    - < 2 options → spin button disabled; tooltip "옵션이 2개 이상 필요해요"
    - > 30 options → toast "최대 30개까지 추가 가능합니다"; block add
  </option_validation>
  <storage>
    <unavailable>Private mode/quota → localStorage fails silently; recents in-memory only (full usable, non-persistent)</unavailable>
    <corrupt_blob>JSON/zod fail on read → start fresh (no throw); no data loss notice (save sets are not precious)</corrupt_blob>
  </storage>
  <sound_fallback>Web Audio context fails → silent fallback (animation continues)</sound_fallback>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of truth for tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is ROSE (var(--accent-rose) / var(--accent-rose-soft)) — "random" category identity per DESIGN. Slices use saturated rose with slight tint shifts; winner highlight 2px rose outline + glow.
    - CTAs (spin button, primary actions) stay brand honey-gold var(--brand) per DESIGN principle (accents are identity, not action).
  </accent_usage>
  <wheel_design>Slices rotate and highlight with rose accent; center label non-spinning; tick marks for visual rhythm. No gradients or 3D effects — clean 2D SVG.</wheel_design>
  <typography>H1 Gmarket Sans (clamp 28–40px); UI Pretendard 15–16px/500; button labels Pretendard 15px/600. Option names are user input (any length clamped to display)</typography>
  <motion>transform: rotate (wheel spin), scale/opacity (confetti), opacity (result fade). All with ease-out. Respects prefers-reduced-motion (no transforms → instant reveal + fade only).</motion>
  <responsive>Desktop ≥1024px: 2-split (wheel 50%, controls 50%); tablet 768–1023px: stacked, wheel above; mobile <768px: single column, full-width wheel (scales to container), controls below. SVG viewBox responsive. Touch targets ≥44px.</responsive>
  <accessibility>Option inputs labeled (aria-label), spin button labeled; result panel heading (aria-live="polite" for announce). Visible focus-visible 2px rose ring. No color-only (weight/options differentiated by text + position). WCAG 2.1 AA contrast.</accessibility>
</aesthetic_guidelines>

<security_considerations>
  <input>
    - Option labels: text input, React escapes on render (no dangerouslySetInnerHTML)
    - Set names: text input, treated as plain text (no template execution)
    - Weights: number input, zod validates range (1–1000) before state
  </input>
  <privacy>No network calls; localStorage only, never sent to server; no analytics event includes option content</privacy>
  <content_integrity>Random selection uses crypto API (not seeded, not predictable); fair across many spins</content_integrity>
</security_considerations>

<advanced_functionality>
  <remove_winner_mode>If enabled, "다시 돌리기" button re-spins excluding the last winner, allowing sequential draws from the same wheel</remove_winner_mode>
  <sound_control>Toggle + volume slider for audio feedback on spin/win</sound_control>
  <set_persistence>Save unlimited named option sets; load any set in one tap; sets stored locally and survive reload</set_persistence>
  <dense_wheel_legibility>Up to 30 options supported. Slice labels adapt to density: radial orientation + auto-scaled font + `…` truncation (full name in aria/`<title>`). Above LEGEND_THRESHOLD (16), slices carry index numbers and a numbered legend (number→full name) renders alongside the wheel for pre-spin scanning. The winner is always shown full-size in the ResultPanel + center label, so density never obscures the outcome.</dense_wheel_legibility>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Add options, spin, see fair result</description>
    <steps>
      1. Add 4 options: "점심", "카페", "산책", "쉬기" with default weights (all 1).
      2. Verify wheel renders 4 equal slices (90° each), labels positioned in arcs.
      3. Click "돌리기" → wheel animates rotate 4s, tick sounds play, result reveals a slice.
      4. Verify result name matches landing slice, no visual misalignment (±1px).
      5. Add more options, re-spin; verify fair distribution over 20 spins (chi-square test passes).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Weights and geometry</description>
    <steps>
      1. Add 3 options: A weight 1, B weight 2, C weight 3 (total 6).
      2. Verify slice angles: A = 60°, B = 120°, C = 180°.
      3. Spin 60 times; verify B and C land ~2x and ~3x as often as A (chi-square: null hypothesis "equal probability" rejected).
      4. Edit B weight to 1; verify slice angles recalculate immediately; relayout.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Save/load and persistence</description>
    <steps>
      1. Create set A (4 options), save as "점심 추천".
      2. Verify set card appears in load section.
      3. Create set B (6 options), save as "게임".
      4. Load "점심 추천" → wheel updates to 4 slices; localStorage lastSetName = "점심 추천".
      5. Reload page; verify set A auto-loads, matches saved state.
      6. Delete set A from load section; verify removed from localStorage.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Sound and settings</description>
    <steps>
      1. Spin with sound ON → hear 10 ticks + 1 chime.
      2. Toggle sound OFF → no audio (animation silent).
      3. Move volume slider 0–100 → playback volume scales.
      4. Toggle "결과 제거" ON → second button "제거 후 돌리기" appears.
      5. Land on A, click "제거" → A removed from wheel, re-spin with remaining.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Accessibility and reduced-motion</description>
    <steps>
      1. Keyboard: Tab → add input → enter option → Tab → weight → Tab → delete button.
      2. Space on toggle to flip settings.
      3. Enter on add input to add; enter in save input to save.
      4. OS reduced-motion ON → spin reveals winner instantly (no rotate), confetti fades (no scale).
      5. axe scan: no violations, all buttons labeled, focus ring visible, color contrast ≥4.5:1 body / ≥3:1 large.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>i18n, SEO, edge cases</description>
    <steps>
      1. Switch to /en → chrome English; wheel interaction identical.
      2. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ localized; no JavaScript-gated SEO content.
      3. Add 30 options (max) → add button disables; delete one → button re-enables. Above 16 options, slices show index numbers + a numbered legend renders; result panel still shows the full winner name.
      4. Add empty label → toast error, no option added; input focused.
      5. localStorage quota hit → save set fails silently, in-memory state continues; re-enable storage → next save succeeds.
    </steps>
  </test_scenario_6>
</final_integration_test>

<success_criteria>
  <functionality>≥2 options spin fair; weights scale slices proportionally; chi-square test on 100 spins shows p > 0.05 (fair distribution); save/load persist across reload; remove-winner mode excludes last winner; sound toggle + volume work</functionality>
  <user_experience>Spin ≤5s animation + instant result reveal; keyboard navigation full (no mouse required); ≥44px tap targets; visible focus; <320px no overflow; sounds optional</user_experience>
  <technical_quality>lib/roulette/* pure ≥80% unit coverage (geometry, random, sets); TS 0 errors; <800 lines per file; confetti pure JS (no deps); Web Audio API context graceful degrade</technical_quality>
  <visual_design>DESIGN.md compliant; rose identity in slices + winner highlight; white wheel on white surface with soft rose shadow; typography readable at all sizes</visual_design>
  <accessibility>Full keyboard (Tab/Space/Enter); aria-live result announce; visible focus 2px rose ring; WCAG 2.1 AA (4.5:1 body, 3:1 large); prefers-reduced-motion fade-only</accessibility>
  <performance>Tool route within platform budget; no janky spin (60 fps CSS animation); <50ms add/edit latency; localStorage reads <10ms; LCP < 2.5s</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/roulette pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Fair random selection: crypto.getRandomValues → uniform pick (independent of wheel angle)
    2. SVG slice/label geometry: angle calc + text arc positioning
    3. CSS rotate animation (4s ease-out) + instant on reduced-motion
    4. Web Audio context lifecycle + fallback (sound is secondary)
    5. localStorage immutable persist (on every change, no debounce)
  </critical_paths>
  <recommended_implementation_order>
    1. lib/roulette/{schema,random,geometry,sound,sets}.ts Vitest (geometry angles, fair pick chi-square, immutable ops)
    2. useRoulette hook (state, localStorage read/write, geometry derived)
    3. WheelSVG + SVG render (slices, labels, ticks, highlight)
    4. OptionList + SpinButton (add/edit/delete, spin trigger)
    5. ResultPanel + confetti (reveal, animation, sound)
    6. SaveLoadPanel, SettingsPanel (persistence, toggles)
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live)
    8. RouletteIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via platform lib/seo.ts
    9. Registry status→live; slug→component + generateMetadata branches; E2E 1–6; visual regression 320/768/1024 both themes
  </recommended_implementation_order>
  <testing_strategy>Vitest ≥80%: geometry (slice angles, label positions), random (chi-square fairness over 100 spins), immutable set ops; component test wheel SVG render + highlight; E2E scenarios 1–6 (especially fair distribution #2 + persist #3); a11y axe scan; reduced-motion visual verification</testing_strategy>
</key_implementation_notes>

</project_specification>
```
