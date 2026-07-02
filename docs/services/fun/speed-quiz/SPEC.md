# 스피드퀴즈 제시어 (Speed Quiz Prompt Words) — Real-Time Party Word Reveal Game — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **스피드퀴즈 제시어 / Speed Quiz Prompt Words** (Korean display name: **스피드퀴즈 제시어**; English display name: *Speed Quiz Prompt Words*) — a presenter-controlled party/classroom game where the presenter picks a category and difficulty, reveals prompt words one at a time on a big-screen-friendly card, runs a countdown timer, and records guesses (correct/pass/skip). At the end, a summary shows the score and full word list. Prompt words are managed as markdown file pairs (`<deck>.md` + `<deck>_en.md`) in `content/speed-quiz/`, and at build time a generator reads the folder, validates, and emits a static catalog. The tool mounts as a 100% client-side SPA with no backend—all state lives in React + localStorage only.
>
> Internal service codename: `speed-quiz`. Registry id: `speed-quiz`. Public URL slug: `/[locale]/tools/speed-quiz`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/new-word/SPEC.md`](../../text/new-word/SPEC.md)

```xml
<project_specification>

<project_name>스피드퀴즈 제시어 (Speed Quiz Prompt Words) — Big-screen-friendly party word-reveal game (Jurepi tool, codename speed-quiz, registry id speed-quiz)</project_name>

<overview>
Speed Quiz Prompt Words turns any classroom, office team-building, or party moment into a fast-paced guessing game. The presenter (teacher, facilitator, or player) chooses a category (Animals, Movies, K-pop, Proverbs, Jobs, Brands, Food, Historical Figures, etc.) and difficulty level (Easy, Normal, Hard), taps to reveal prompt words one at a time on a **large, presenter-friendly display**. Each word stays on screen with a **bold countdown timer** ticking down (default 30–90 seconds per round, adjustable). Other players shout answers; the presenter taps "정답 (Correct)" or "패스 (Pass)" to mark each guess and advance. After all words are revealed or time runs out, a summary shows **"맞힘: 7 / 패스: 2 / 시간초과: 1"** and a full **word list** (to verify answers). The game is **presenter-first UI**: big tap targets (≥60px buttons), huge readable prompt text, keyboard shortcuts (Space=next, →=pass, ←=undo, Esc=end) for power users.

The tool's content model is fundamental: prompt words are NOT code — they are **markdown files** managed as bilingual pairs (`<deck>.md` for Korean + `<deck>_en.md` for English). Drop a deck file in the `content/speed-quiz/` folder, and at **build time** a generator scans, validates, and bakes the catalog into a static JSON artifact (speed-quiz.generated.json). The tool dynamically imports that catalog to render the deck selector, game UI, and summary. This means "drop a file and it appears" is REAL — all without a backend, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The deck catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (game settings + favorite decks + recent games), and nothing is ever sent over the network. Presenter mode is purely local — every guess, timer state, and score is ephemeral.

CRITICAL (content model, invariants): every deck MUST have a Korean file and an English file as a matching pair. Each file must carry a non-empty `title`, `category`, `difficulty` (easy/normal/hard), and `words` (array of ≥10 prompt-word objects: each with `term` (required) and optional `hint`). Structural metadata (`category`, `difficulty`, `words`) is **canonical in the Korean file**; the English file inherits these if absent (only `title` is per-locale). The build generator validates pair integrity, required fields, and word count (≥10 per deck) and **fails the build with a clear message** if ANY rule is broken.

CRITICAL (SPA, presenter-first usability): per the platform rule, the tool is a 100% client-side SPA mounted on the SSG shell. ALL interaction — deck selection, starting the game, revealing words, marking answers, adjusting settings, ending the round — happens via local React state with NO route navigation and NO full-page reload. Usability comes first: the presenter taps/presses as fast as they want without lag, timers are snappy, and the word display is impossible to miss from 10 meters away.

CRITICAL (audio + motion): the tool includes optional **sound effects** (Web Audio API, zero dependencies) — a tick near the time-out, a chime for correct, a buzz for pass — toggled by a sound button. All motion/sound respects `prefers-reduced-motion`. No flashing, no screen shake, no sensory overload.
</overview>

<platform_integration>
  - Route: /[locale]/tools/speed-quiz (SSG; registry slug "speed-quiz", id "speed-quiz", status "coming_soon", accent "sun", category "fun").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.speed-quiz.*` (UI chrome strings: deck selector, difficulty labels, time presets, button labels, toasts, how-to, FAQ, sound toggle — NOT word content; that comes from markdown in speed-quiz.generated.json); the in_content AdSlot below the tool.
  - Platform dependency: the tool uses the existing `'fun'` category (already active). Simply add ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed deck catalog (pairs: `<deck>.md` + `<deck>_en.md`) in `content/speed-quiz/decks/`.
    - Build-time generator: folder scan → frontmatter parse → validation → code-split static catalog (speed-quiz.generated.json). Wired to `prebuild`/`predev`.
    - Eight seed deck categories with 1–2 decks each (~80+ prompt words total): **동물 (Animals: easy/normal)**, **영화 (Movies: normal/hard)**, **K-pop (K-pop: normal)**, **속담 (Proverbs: hard)**, **직업 (Jobs: easy)**, **브랜드 (Brands: normal)**, **음식 (Food: easy/normal)**, **역사인물 (Historical Figures: hard)**. Each deck ≥10 words.
    - **Deck markdown templates**: annotated markdown templates (`content/speed-quiz/_TEMPLATE.md`, `content/speed-quiz/_TEMPLATE_en.md`) and authoring README to make adding new decks easy.
    - Presenter flow: (1) Home screen shows deck cards by category. (2) Tap a deck → game setup (difficulty, round time 30/60/90s/unlimited, shuffle on/off, show hints on/off). (3) Tap "시작 (Start)" → game UI: huge prompt word (center), countdown timer (top, bold), buttons "정답"/"패스" (bottom, ≥60px). Space/→ keyboard shortcuts. (4) Advance through all words or until time expires. (5) Summary: score card + full word list (verify). (6) "다시 (Replay)" or "홈 (Home)".
    - Deck selection: category filter tabs (All / Animals / Movies / K-pop / Proverbs / etc.), search by deck name.
    - Game settings: category, difficulty, round time (30s / 60s / 90s / unlimited), shuffle (on/off), show/hide hints during play.
    - Scoring: `{ correct: number, pass: number, timeout: number }` + word-by-word result (correct/pass/timeout).
    - Sound: Web Audio API (no external libraries), tick/chime/buzz, toggleable, respects prefers-reduced-motion.
    - localStorage persistence: last game settings (category/difficulty/time/shuffle/sound) + favorite decks + recent games (limited history).
    - Full keyboard support: "Space"=next/correct, "→"=pass, "←"=undo, "Esc"=end game or home, "?" or Shift+/ = help.
    - Tool-specific SEO long-form (what is a speed quiz, how to host a game, party tips) + FAQ + SoftwareApplication + FAQPage JSON-LD, localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Multiplayer / networked play. Game state is single-presenter, local-only.
    - User browser-based deck add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync / scoring leaderboards.
    - Rich HTML/script in markdown body. Prompts are plain text ± optional plain-text hint.
    - Per-deck deep-link URLs (e.g., /tools/speed-quiz/animals-easy) — MVP is a single route + client state. (Phase 2 candidate.)
    - Analytics / usage metrics. No events sent.
  </out_of_scope>
  <future_considerations>
    - Per-deck static deep-link routes + individual prompt pages (SEO) — Phase 2.
    - Deck expansion: sports, tech, literature, geography, science, history — Phase 2.
    - Multiplayer mode (local network or web socket) — Phase 3.
    - "Daily Deck" random featured deck / social sharing (image export) — Phase 3.
    - Difficulty ratings (user vote on "too easy / just right / too hard") — Phase 3.
    - Hint system refinement (timed reveal of hints) — Phase 2.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Decks live as markdown pairs in `content/speed-quiz/decks/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Prompt words are structured frontmatter fields (array of objects: term + optional hint), rendered as-is.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged deck invariants. Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/speed-quiz/data/speed-quiz.generated.json), dynamically imported only on this tool's route so deck content never enters the global i18n message bundle (protects platform JS budget — same pattern as new-word/qna-a-day).</catalog>
    <sound>Web Audio API (no HOWLER.js / Tone.js dependency): on-demand synthesis of tick/chime/buzz, or optional MP3 asset fetch (fallback: silent). Zero-dependency approach preferred.</sound>
    <timer>Vanilla setInterval or requestAnimationFrame; snappy countdown display (no lag). On time-out, auto-end or prompt continue-or-home.</timer>
    <animation>Native CSS transitions + CSS animations only (card reveal fade, button pulse). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-speed-quiz.mjs                # Build time: scan content/speed-quiz/decks/* → parse → validate → emit speed-quiz.generated.json. Wired to prebuild/predev.
content/speed-quiz/                         # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md           # Templates (excluded by generator)
├── README.md                               # Authoring guide (deck format, category list, word count rules)
└── decks/*.md  *_en.md                     # Deck pairs
src/
├── lib/speed-quiz/                         # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                           # zod: DeckFileFront(ko/en), MergedDeck, GameState, StoreSchema + STORE_VERSION
│   ├── merge.ts                            # mergePair(koFront, enFront): apply canonical rule → MergedDeck; validatePair
│   ├── slug.ts                             # slugify(title), resolveSlug(front, filename)
│   ├── catalog.ts                          # Typed access: allDecks, byId, byCategory, categories(); category enum
│   ├── shuffle.ts                          # fairShuffle(words, seed): seeded shuffle (no immediate repeats, reproducible)
│   ├── game-reducer.ts                     # Immutable: nextWord, markCorrect, markPass, undo, endGame → new GameState
│   ├── sound.ts                            # Immutable sound ops: synthesizeTick, synthesizeChime, synthesizeBuzz (Web Audio)
│   └── favorites.ts                        # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(ids, catalog)
├── components/tools/speed-quiz/
│   ├── SpeedQuiz.tsx                       # Orchestrator (Client Component) — route/setup/game/summary state + useSpeedQuiz() owner
│   ├── useSpeedQuiz.ts                     # Hook: dynamic catalog import + localStorage settings + sound context
│   ├── DeckBrowser.tsx                     # Home: category tabs + deck cards (grid); search filter
│   ├── DeckCard.tsx                        # One deck: title, category, difficulty, word count, star (favorite toggle)
│   ├── GameSetup.tsx                       # Settings: difficulty, time preset (30/60/90/unlimited), shuffle toggle, hint toggle
│   ├── GameBoard.tsx                       # Active game: large prompt word (center), countdown timer (top bold), buttons (bottom)
│   ├── GameSummary.tsx                     # After game: score card (correct/pass/timeout), word-by-word results, full word list
│   ├── SoundToggle.tsx                     # Small toggle button (speaker icon) — mutes/unmutes sound effects
│   ├── SpeedQuizIntro.tsx                  # H1 + lead (SEO; server-render where possible)
│   ├── SpeedQuizHowTo.tsx                  # "How to play" / "Hosting a speed quiz" (SEO long-form)
│   ├── SpeedQuizFaq.tsx                    # Q&A + FAQPage JSON-LD
│   └── data/
│       └── speed-quiz.generated.json       # Generated artifact — [MergedDeck...]
└── i18n/messages/{ko,en}.json             # tools.speed-quiz.* UI chrome (categories, difficulty labels, time presets, button labels, toasts, how-to, FAQ, sound label, keyboard help)
</file_structure>

<core_data_entities>
  <deck_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — deck title (that locale)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - category: enum (animals, movies, kpop, proverbs, jobs, brands, food, historical-figures) — Korean file canonical; Phase 2 extensible
    - difficulty: enum (easy, normal, hard) — Korean file canonical; required
    - words: array (required, ≥10)
      - term: string (required, non-empty, 1–10 chars typical) — the prompt word to guess
      - hint?: string (optional, ≤30 chars) — optional clue displayed when hints enabled
    INVARIANT: title/category/difficulty non-empty, words ≥10, each word term non-empty. zod parse failure → collect as error (build failure candidate).
  </deck_file_front>
  <merged_deck note="ko+en merge result; catalog record; speed-quiz.generated.json item">
    - slug: string — unique identifier (unique per category+locale; favorites/recents reference)
    - category: enum — Korean file canonical
    - difficulty: enum — Korean file canonical
    - words: array (same structure as above) — canonical from Korean; EN inherits if absent
    - ko: { title, words? } — title is per-locale (localized like the rest); words inherited if absent (same word list)
    - en: { title, words? } — title is per-locale; words inherited from KO if absent (same prompt words, English title only)
    INVARIANT — PAIR/FIELDS/UNIQUENESS: every record has both ko+en; each has non-empty title + ≥10 words; slug unique within category; word terms unique within deck. Violation → generator build failure.
  </merged_deck>
  <category note="grouping by theme; localized label from i18n">
    - id: enum (animals, movies, kpop, proverbs, jobs, brands, food, historical-figures). Display order: per CATEGORY_ORDER. Label: tools.speed-quiz.categories.<id>.
  </category>
  <game_state note="ephemeral; in-memory during round, persisted settings via localStorage">
    - deckId: string (current deck slug)
    - words: WordWithResult[] — full word list with result for each
      - term: string
      - hint?: string
      - result: 'correct' | 'pass' | 'timeout' | 'unrevealed'
    - currentIndex: number (0-based; which word is shown)
    - timerMs: number — countdown milliseconds remaining (updated every 16ms or on tick)
    - score: { correct: number, pass: number, timeout: number }
    - roundSettings: { difficulty, roundTimeSeconds, shuffle: bool, showHints: bool }
  </game_state>
  <speed_quiz_store note="single localStorage blob (settings + favorites only; game state is ephemeral)">
    - version: number (STORE_VERSION, starts at 1)
    - settings: { lastCategory?: string; lastDifficulty?: string; roundTimeSeconds?: number; shuffleOn: bool; soundOn: bool }
    - favorites: string[] — deck slugs, insertion order
    - recents: string[] — deck slugs, MRU, RECENTS_MAX = 10
    localStorage key: `jurepi-speed-quiz`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown ids pruned on load. Game round is never persisted (ephemeral only).
  </speed_quiz_store>
  <constants>
    - RECENTS_MAX = 10; WORDS_PER_DECK_MIN = 10; TIME_PRESETS = [30, 60, 90]; CATEGORY_ORDER = ['animals', 'movies', 'kpop', 'proverbs', 'jobs', 'brands', 'food', 'historical-figures']; SOUND_TICK_HZ = 800; SOUND_CHIME_HZ = 1200; SOUND_BUZZ_HZ = 200; TIMER_UPDATE_FPS = 60.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/speed-quiz" page="SpeedQuiz (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. Per-deck deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <speed_quiz>                    <!-- "use client"; owns route/setup/game/summary state + useSpeedQuiz() owner + SoundContext provider -->
    <speed_quiz_intro />          <!-- H1 + lead (server-render where possible) -->
    <sound_context_provider>      <!-- Wraps children; provides sound play methods (tick/chime/buzz) + mute toggle state -->
      <deck_browser />            <!-- Home/browsing: category tabs + deck grid; search -->
        <deck_card />             <!-- × N: title, category, difficulty, word count, star (favorite toggle) -->
      <game_setup />              <!-- Settings panel: difficulty, time, shuffle, hints; "start game" button -->
      <game_board />              <!-- Active game: huge prompt word (center), bold countdown (top), buttons (bottom) -->
        <prompt_word />           <!-- Large centered text (font-size clamp + bold) -->
        <countdown_timer />       <!-- Digital countdown (MM:SS or S), top-center, 72px font -->
        <button_group />          <!-- "정답 (Correct)" + "패스 (Pass)" buttons, ≥60px tall, full-width on mobile -->
      <game_summary />            <!-- Score card + word-by-word results + full word list; "홈" and "다시" buttons -->
    </sound_context_provider>
    <speed_quiz_how_to />         <!-- SEO long-form -->
    <speed_quiz_faq />            <!-- FAQPage JSON-LD -->
  </speed_quiz>
  <note>SPA within tool: category/search/deck-select/settings/game = local state switch, NOT route navigation. Game board is a full-screen overlay on deck browser (mobile) or main canvas (desktop).</note>
</component_hierarchy>

<pages_and_interfaces>
  <speed_quiz_intro>
    - Eyebrow: "재미있는 게임" / "FUN GAME" — 12px/700/0.6px, var(--accent-sun).
    - H1: "스피드퀴즈 제시어" / "Speed Quiz Prompt Words" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg: "파티, 팀 빌딩, 교실 속 즉석 게임! 재미있는 제시어를 공개하고 빠르게 답을 맞춰보세요." / English equivalent.
  </speed_quiz_intro>

  <deck_browser>
    - Top: search input (text, icon Search) + sound toggle (speaker icon, mute/unmute).
    - Tabs: category pills (All / Animals / Movies / K-pop / Proverbs / Jobs / Brands / Food / Historical Figures) + "즐겨찾기" (Favorites, when starred).
    - Grid: responsive 2–4 columns (≥1024px 4-col, 768–1023px 2-col, <768px 1-col).
    - Each deck_card: title (headline 18–20px), category badge (sun-tinted pill), difficulty emoji (⭐/⭐⭐/⭐⭐⭐), word count ("N개 단어"), star button (favorite toggle), tap to open game setup.
    - empty_state: no decks in category → "아직 준비 중인 게임이에요" / "No decks in this category yet".
  </deck_browser>

  <game_setup>
    - Panel / modal: selected deck title + icon. Settings:
      1. Difficulty: radio (Easy / Normal / Hard) — if deck has only one difficulty, preset it (no choice).
      2. Round time: buttons "30초 / 60초 / 90초 / 무한" (30s / 60s / 90s / unlimited) — tap to select, default 60s.
      3. Shuffle: toggle on/off (default on).
      4. Show hints: toggle on/off (default off).
    - Button "시작 (Start)" — large, sun-tinted, ≥48px.
    - Button "취소 (Cancel)" or back arrow.
    - Responsive: full-width modal on mobile, centered panel on desktop.
  </game_setup>

  <game_board>
    - Full screen / modal. Background: var(--surface) or gradient; presenter-optimized contrast.
    - Top: bold countdown timer (font 72px, monospace tabular-nums, color var(--brand) when >10s, var(--accent-coral) when ≤10s + 1Hz pulse).
    - Center: prompt word in huge, bold font (clamp(48px, 10vw, 120px), var(--text), center, family Gmarket Sans 700, single-line or word-wrap if needed).
    - Optional hint (if enabled): below prompt, 16px var(--text-secondary), italic, max 1 line.
    - Bottom: button row (2 buttons, ≥60px height, full-width on mobile):
      - Left: "정답 (Correct)" — green-tinted or brand sun, keyboard Space.
      - Right: "패스 (Pass)" — gray-tinted, keyboard →.
    - Small top-left: "← (Undo)" button, keyboard ← (if currentIndex > 0).
    - Small top-right: "X (End Game)" or Esc.
    - Score tally (always visible, top-right corner): "맞힘: 5 / 패스: 2" or use badge format.
    - All motion gated by prefers-reduced-motion.
  </game_board>

  <game_summary>
    - Panel / modal. Headline: "라운드 종료! (Round Over!)" or "시간 초과! (Time's Up!)"
    - Score card: large numbers
      - "맞힘 (Correct): 7"
      - "패스 (Pass): 2"
      - "시간초과 (Timeout): 1" (if applicable)
    - Word-by-word results (scrollable list): for each word, show "✓ term (correct)" / "✗ term (pass)" / "· term (timeout)" with color-coded icon.
    - Full word list (scrollable): all terms from the deck (verify answers offline).
    - Buttons:
      - "다시 (Replay this deck)" — sun-tinted, large.
      - "다른 게임 (Choose different deck)" or "홈 (Home)" — muted.
    - Responsive: single column on mobile, card on desktop.
  </game_summary>

  <keyboard_shortcuts_reference>
    - Space → "정답 (Correct)" / next word.
    - → (Right arrow) → "패스 (Pass)".
    - ← (Left arrow) → "← (Undo)" previous word.
    - Esc → end game or close modal.
    - "?" or Shift+/ → show help overlay with shortcuts + sound info.
    - Disabled when typing (if search input focused).
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-speed-quiz.mjs">
    - Scan content/speed-quiz/decks/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → zod DeckFileFront validate.
    - mergePair: apply canonical rule (ko category/difficulty/words canonical + en inherit if absent; title PER-LOCALE — EN inherits KO words but has its own title). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields, slug uniqueness per category, word count ≥10, word terms unique.
    - Sort (category order → difficulty order → title locale order), emit speed-quiz.generated.json. Deterministic.
    - package.json wire: "predev": "node scripts/generate-speed-quiz.mjs", "prebuild": "node scripts/generate-speed-quiz.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allDecks(): MergedDeck[] (generation order). byId(slug), byCategory(category). categories(): live category ids in catalog.
    - Tests assert catalog uniqueness, category validity, locale completeness.
  </catalog_access>
  <search>
    - searchDecks(decks, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.title, en.title, category name, difficulty. Stable order.
    - Compose with category tab: list = searchDecks(active-category subset, query).
  </search>
  <shuffle>
    - fairShuffle(words, seed): seeded shuffle using a deterministic PRNG (e.g., Xorshift from seed). Reproducible per seed; no Math.random() in-game.
    - Shuffle applied on "Start Game" if toggle enabled. Same seed for undo/redo consistency.
  </shuffle>
  <game_reducer note="immutable — return new GameState">
    - nextWord: advance to next word; if last, return endgame state.
    - markCorrect(state): mark currentWord as 'correct', increment score.correct, call nextWord.
    - markPass(state): mark currentWord as 'pass', increment score.pass, call nextWord.
    - undo: revert to previous word (reset its result), decrement score counters.
    - endGame(state): freeze current state, mark unrevealed words as 'timeout'.
    - All operations preserve immutability; return new GameState.
  </game_reducer>
  <timer>
    - requestAnimationFrame or setInterval for countdown tick (~60 FPS).
    - Decrement timerMs every frame; update display.
    - On timerMs ≤ 0: auto-call endGame (or prompt continue).
    - Sound: tick effect every 1 second (or when ≤10s, every 0.5s if enabled).
  </timer>
  <sound note="Web Audio API, zero dependencies">
    - soundOn toggle in localStorage + UI button.
    - synthesizeTick(hz=800): short beep (100ms duration, fade-out).
    - synthesizeChime(hz=1200): pleasant chime (200ms, major chord).
    - synthesizeBuzz(hz=200): low buzz (150ms, descending).
    - All respect prefers-reduced-motion (silent if reduced).
    - Fallback: if Web Audio unavailable, silently skip (no error toast).
  </sound>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=10): move/insert to front, de-dupe, truncate.
    - pruneUnknown(ids, catalog): drop ids not in current catalog (run on load).
    - Recent push: when game ends (endGame). Deck selection doesn't trigger.
  </favorites_and_recents>
  <persistence_adapter useSpeedQuiz>
    - Mount: dynamic catalog import; read `jurepi-speed-quiz` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered decks, selectedDeckId + selectDeck(id), gameState + dispatch (nextWord/markCorrect/markPass/undo/endGame), toggleFavorite, soundOn + toggleSound, localStorage favorites/recents.
  </persistence_adapter>
  <i18n>All UI chrome from tools.speed-quiz.* (ko/en): categories, difficulty labels, time presets, button labels, toasts, empty states, how-to, FAQ, sound label, keyboard help. Deck title/words come from markdown (speed-quiz.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Orphan files are warned; minimum 1 violation triggers strict failure.
  </build_time>
  <search_no_results>Friendly empty state "'{query}'에 해당하는 게임이 없어요" + clear button; deck list retains last selection.</search_no_results>
  <storage>
    <unavailable>Private mode/disabled → settings/favorites/recents in-memory, no scary error. Game fully works (shuffled seed differs per session).</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (favorites/recents not precious, no throw).</corrupt_blob>
  </storage>
  <web_audio>If Web Audio API unavailable or synthesis fails → silently skip sound (no error banner). Functionality unaffected.</web_audio>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Per-tool identity accent is SUN (var(--accent-sun) / var(--accent-sun-soft)) — playful, energetic. Intro icon, setup button, deck selected bar, favorite star (filled), timer pulse when ≤10s.
    - CTAs (primary buttons "Start") stay brand honey-gold (or use sun for energy).
    - Deck category badges: sun-tinted pills.
  </accent_usage>
  <presenter_first_scale>
    - Prompt word: clamp(48px, 10vw, 120px), bold, high contrast (var(--text) on var(--surface)).
    - Buttons: ≥60px height, full-width on mobile, tap-friendly (no sub-32px targets).
    - Timer: 72px monospace, ultra-high contrast (var(--brand) or var(--accent-coral) pulse ≤10s).
    - Deck cards: 18–20px title, large tap target ≥48px.
  </presenter_first_scale>
  <surfaces>Deck card/setup/summary = var(--surface) + 1px var(--hairline); detail radius --radius-lg; button hover/press micro-lift/scale. Soft shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); deck title 18–20px/700; prompt word 48–120px/700 monospace or serif (readability); timer 72px/700 monospace tabular-nums; button labels 16–18px/600.</typography>
  <motion>transform/opacity only: card hover scale(1.02) + shadow-lift 150ms, timer pulse scale (≤10s, 1→1.1→1) 200ms, button press scale(0.95) 100ms. All gated by prefers-reduced-motion (instant, no scale).</motion>
  <accessibility>Buttons = labeled real `<button>` elements, ≥44px touch targets; timer announces countdown via aria-live; keyboard shortcuts labeled in help; screen reader hints for hint toggle. High contrast: timer color ≥ WCAG AAA. No flashing (prefers-reduced-motion always honored).</accessibility>
  <responsive>
    - ≥1024px: deck browser 4-column, game board centered, summary card.
    - 768–1023px: 2-column; game board full-width overlay.
    - <768px: 1-column; game board full screen, buttons full-width.
    - No page overflow at 320px.
  </responsive>
  <atmosphere>Fast-paced, energetic "party game": bright, snappy UI, huge readable text, bold colors (sun accent). Presenter can see everything from 10m away. Fun, not corporate — emojis optional (difficulty stars), playful language ("정답!", "패스!"). Sound effects add energy (optionally).</atmosphere>
  <icons>lucide-react: Zap or Timer or Sparkles (tool card), Search (search), Volume2/VolumeX (sound toggle), Star/StarOff (favorite), Play (start), X (close/end). Default 24px (larger for game buttons), stroke 2, currentColor. Registry card icon: `Zap`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Titles/terms/hints render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Generator validates frontmatter with zod (type/required/length).
  </input>
  <privacy>Favorites/recents/settings localStorage-only, never sent. No analytics event includes game data. Game state is ephemeral (never persisted to storage; new round = clean slate).</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness.</content_integrity>
  <sound>Web Audio synthesis is sandboxed; no external audio loads by default.</sound>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <seeded_shuffle>Reproducible shuffle per seed; same deck+seed = same word order every time (for consistent teaching demos or replayability).</seeded_shuffle>
  <favorites_recents>Star pin + MRU recent decks (localStorage) — quick access to frequently-used party games.</favorites_recents>
  <keyboard_power_user>"Space", "→", "←", "Esc", "?" shortcuts — run a game one-handed or with presentation remote.</keyboard_power_user>
  <hint_system>Optional per-word hints displayed during play if enabled in setup; helps beginner players.</hint_system>
  <sound_effects>Tick/chime/buzz (Web Audio) add energy; toggleable + prefers-reduced-motion respected.</sound_effects>
  <structured_data>SoftwareApplication + FAQPage JSON-LD (site-level how-to-play guidance) — search engine recognizes party game tool (discoverability = DESIGN principle ③).</structured_data>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → deck list auto-compose</description>
    <steps>
      1. animals-easy.md + animals-easy_en.md exist in content/speed-quiz/decks/ with ≥10 words.
      2. pnpm dev → predev generator runs → speed-quiz.generated.json has merged record (ko/en title, words, category, difficulty).
      3. Visit /ko/tools/speed-quiz → deck browser renders "쉬운 동물" card (category: animals, ⭐).
      4. Add new pair movies-hard(.md/_en.md), rebuild → deck list auto-updates (no code edit).
      5. Missing pair or <10 words → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Deck selection, game setup, game flow</description>
    <steps>
      1. Tap "쉬운 동물" deck → game setup modal opens (difficulty preset to easy, time default 60s, shuffle on, hints off).
      2. Adjust time to "30초", toggle shuffle off, toggle hints on.
      3. Tap "시작 (Start)" → game board appears: huge prompt word (center), 30-second countdown (top, bold), "정답"/"패스" buttons (bottom).
      4. Tap "정답" (or Space) → word advances, score.correct increments ("맞힘: 1 / 패스: 0").
      5. Tap "패스" (or →) → word advances, score.pass increments.
      6. Tap "←" (Undo) → revert to previous word, score decrements.
      7. Countdown reaches 0 or all words shown → game board transitions to summary (score card + word list).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Favorites, recents, persistence, sound, keyboard</description>
    <steps>
      1. Star "쉬운 동물" deck → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      2. Play a game → on end, deck pushed to recents.
      3. Reload → favorites/recents persist (localStorage); unknown ids pruned.
      4. Sound toggle ON (default) → during game, tick sounds every 1s; chime on correct, buzz on pass.
      5. Sound toggle OFF → no audio.
      6. Keyboard (Space=next, →=pass, ←=undo, Esc=end): all work during game; aria-label on buttons confirms shortcuts.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Search, category filter, empty states</description>
    <steps>
      1. Type "동물" in search → narrows to animal decks; result count updates.
      2. Clear, click "영화" (Movies) tab → movie decks only.
      3. Type "hard" → difficulty filter optional; title search works both locales.
      4. Type "asdfqwer" → empty "'{query}'에 해당하는 게임이 없어요" + clear button.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD), locale swap, responsive, accessibility</description>
    <steps>
      1. Switch to /en → chrome (buttons/tabs/help) English; deck titles English.
      2. Build prod → /ko/tools/speed-quiz and /en/tools/speed-quiz unique title/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ localized; deck dataset code-split chunk (not global i18n).
      4. 320px viewport → single-column deck list; game board full-width; buttons full-width.
      5. Keyboard shortcuts (?, Space, →, ←, Esc) all work; axe a11y check → no violations; focus ring visible.
      6. prefers-reduced-motion ON → no card scale/timer pulse/button pop; fade only (instant). Functionality unaffected.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<deck>.md` + `<deck>_en.md` pair in content folder, rebuild, auto-reflect in deck list/game with zero code change; generator validates pair/category/difficulty/words/uniqueness, fails build with clear message on violation.</content_model>
  <functionality>Searchable, category-filterable deck browser (both locales); game setup (difficulty/time/shuffle/hints); game board with huge prompt word, bold countdown, score tracking, undo; game summary with score card + word-by-word results + full list; localStorage favorites + recents; seed ≥8 decks across categories (80+ words total).</functionality>
  <presenter_experience>Tap/keyboard shortcuts snappy; word display readable from 10m; timer prominent; buttons ≥60px; no lag on "next" / "pass" / "undo".</presenter_experience>
  <user_experience>Deck discovery instant; category tabs responsive; search live; sound optional + toggleable; ≥44px tap targets; visible focus; SPA — no route reload on any game interaction.</user_experience>
  <technical_quality>lib/speed-quiz/* pure ≥80% unit coverage (schema/merge/slug/shuffle/game-reducer/sound/favorites); generator validation tests (pair-missing/<10-words/dupe-slug → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; sun identity + brand honey-gold CTA; presenter-first scale (48–120px prompt, 72px timer, 60px buttons); text-node render only.</visual_design>
  <accessibility>Full keyboard (Space/→/←/Esc/?); aria-live score; labeled buttons; motion-respect; WCAG 2.1 AA (timer contrast ≥AAA).</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected (timer pulsing only ≤10s, bounded); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-speed-quiz.mjs to freshen speed-quiz.generated.json. /[locale]/tools/speed-quiz pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" → non-clickable placeholder; "live" → interactive).</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'fun' category already exists; 'sun' accent already exists.
    {
      id: 'speed-quiz',
      slug: 'speed-quiz',
      category: 'fun',
      icon: 'Zap',                       // lucide-react (or Timer, Sparkles)
      accent: 'sun',
      status: 'coming_soon',             // 'live' once implementation complete
      isNew: true,
      order: 8,
      keywords: ['스피드퀴즈','제시어','빠른게임','캐치마인드','게임','파티','팀','재미','speed quiz','prompt','party game','charades','guess','fun','presentation','classroom'],
    },
    ```
    Also add slug→component branch (<SpeedQuiz/>) and generateMetadata branch in tool route. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate → speed-quiz.generated.json. Entire tool depends on this.
    2. Pair/canonical-merge rule (ko category/difficulty/words canonical, en inherit) + slug uniqueness + word count ≥10 + term uniqueness per deck.
    3. Game reducer (immutable state transitions: nextWord/markCorrect/markPass/undo/endGame) — all game logic.
    4. Sound synthesis (Web Audio tick/chime/buzz) — optional but core presenter experience.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/speed-quiz/{schema,slug,merge,shuffle,game-reducer,sound,favorites}.ts Vitest (RED→GREEN).
    2. scripts/generate-speed-quiz.mjs + content/speed-quiz/{_TEMPLATE,_TEMPLATE_en,README} + seed (~80 words across 8+ decks, multiple difficulties). Validation tests (pair-missing, <10-words, dupe-slug → fail). predev/prebuild wire.
    3. tools.speed-quiz.* messages (ko/en): categories, difficulty labels, time presets, button labels, toasts, empty states, how-to, FAQ, sound label, keyboard help.
    4. useSpeedQuiz hook (dynamic import + localStorage settings + immutable game reducer + sound context).
    5. DeckBrowser/DeckCard (search, category tabs, roving tabindex, states) + empty states.
    6. GameSetup: difficulty/time/shuffle/hints toggles + start button.
    7. GameBoard: huge prompt word + countdown timer + buttons + score display + keyboard/sound wiring.
    8. GameSummary: score card + word-by-word results + full word list + replay/home buttons.
    9. Sound: Web Audio synthesis (tick/chime/buzz) + toggle + prefers-reduced-motion respect.
    10. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus, help overlay with "?").
    11. SpeedQuizIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via platform lib/seo.ts.
    12. Registry status→coming_soon (then live); slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_decks note="initial content — ~80 words, ~8–10 decks. Author fine-tunes; structure shown">
    - animals (easy): 10 words (dog, cat, lion, bear, etc.) — no hints.
    - animals (normal): 12 words (giraffe, penguin, flamingo, etc.) — hints optional.
    - movies (normal): 10 films (Parasite, Titanic, Avatar, etc.) — hints = director/actor.
    - movies (hard): 8–10 obscure indie/Korean films — hints = year or plot.
    - kpop (normal): 12 K-pop groups/soloists (BTS, BLACKPINK, IVE, Stray Kids, etc.) — hints = debut year or catchphrase.
    - proverbs (hard): 8–10 Korean 속담/사자성어 (written, not spoken) — hints = meaning snippet.
    - jobs (easy): 10 occupations (의사/Doctor, 선생님/Teacher, 경찰/Police, etc.) — no hints.
    - brands (normal): 10 brands (삼성/Samsung, CJ, LG, 현대/Hyundai, etc.) — hints = category.
    - food (easy): 12 food items (김밥/kimbap, 떡볶이/tteokbokki, 피자/pizza, etc.) — no hints.
    - historical-figures (hard): 8–10 Korean/world historical figures — hints = era or achievement.
  </seed_decks>
  <generator_sketch>
    ```javascript
    // scripts/generate-speed-quiz.mjs (outline)
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) decks/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod DeckFileFront.parse (collect errors)
    // 3) mergePair(ko, en): canonical rule (ko category/difficulty/words), resolveSlug
    // 4) validate: pair-integrity / required-fields / field-valid / words ≥10 / terms unique / slug-unique-per-category → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(speed-quiz.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/shuffle/game-reducer/sound/favorites); generator validation fixtures (pair-missing/<10-words/dupe cases); component catalog-injected mocks; E2E scenarios 1–5; localStorage/sound jsdom-isolated; seed words stress-tested (≥80 words, mixed locales, varied difficulty).</testing_strategy>
</key_implementation_notes>

</project_specification>
```

568 lines, English, final.
