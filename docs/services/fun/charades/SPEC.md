# 몸으로 말해요 (Charades) — Body-Language-Only Party Word Reveal Game — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **몸으로 말해요 / Charades** (Korean display name: **몸으로 말해요**; English display name: *Charades*) — a presenter-controlled party/classroom game, structurally a near-twin of the existing **스피드퀴즈 제시어 / Speed Quiz Prompt Words** tool (`docs/services/fun/speed-quiz/SPEC.md`), reusing its game engine. The performer reveals a prompt word privately, acts it out **using body language only — no speaking, no spelling, no sound effects** — while teammates shout guesses. A moderator taps "정답 (Correct)" / "패스 (Pass)" to advance through a countdown-timed round; a summary shows the score and full word list. Prompt words are managed as markdown file pairs (`<deck>.md` + `<deck>_en.md`) in `content/charades/`, generated at build time into a static catalog. 100% client-side SPA, no backend.
>
> Internal service codename: `charades`. Registry id: `charades`. Public URL slug: `/[locale]/tools/charades`.
>
> **Code-sharing decision (non-negotiable — read before implementing):** The content-agnostic game engine (`fairShuffle`, the game-progress reducer, Web Audio tone synthesis, favorites/recents array ops, slug utilities) already exists as pure, well-tested logic inside `src/lib/speed-quiz/{shuffle,game-reducer,sound,favorites,slug}.ts` with **zero coupling to speed-quiz's category vocabulary**. This tool MUST NOT reimplement that engine. Instead:
> 1. Extract it verbatim into a new shared module `src/lib/party-word-game/{shuffle,game-reducer,sound,favorites,slug}.ts` (+ tests).
> 2. Convert the five speed-quiz files at their **existing paths** into thin re-exports of the shared module (`export * from '@/lib/party-word-game/shuffle'`), so speed-quiz's public API, imports, and existing test suite are **unchanged** — full speed-quiz regression (unit + E2E) MUST stay green after this refactor, verified before any charades-specific work proceeds.
> 3. `src/lib/charades/{shuffle,game-reducer,sound,favorites,slug}.ts` also re-export from `party-word-game` (charades imports the same engine; it never gets its own copy).
> 4. `schema.ts` / `merge.ts` / `catalog.ts` and the generator script remain **per-tool** (category enum + defaults genuinely differ) — mirror speed-quiz's pattern with charades' own category list, do not share these files.
> 5. UI components (`GameBoard`, `GameSetup`, `GameSummary`, `DeckBrowser`, `DeckCard`, `SoundToggle`) are **NOT shared** — charades gets its own new component files mirroring speed-quiz's structure. Rationale: speed-quiz's UI has been through multiple `impeccable` polish passes in production; retrofitting it into a shared component risks visual/behavioral regression on a deployed, tested surface. Structural duplication of UI (same pattern, separate files) is accepted; **algorithmic duplication is not**.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same engine, same content pipeline pattern): [`docs/services/fun/speed-quiz/SPEC.md`](../speed-quiz/SPEC.md)

```xml
<project_specification>

<project_name>몸으로 말해요 (Charades) — Body-language-only party word-reveal game (Jurepi tool, codename charades, registry id charades)</project_name>

<overview>
Charades turns any classroom, office team-building session, or party into a fast-paced silent-acting guessing game. One player (the performer) taps to reveal a prompt word on their own screen, then **acts it out using only body language, gestures, and facial expressions — no speaking, no mouthing words, no sound effects, no pointing at objects in the room**. Teammates watch and shout guesses; a moderator (often the performer's own device, tapped one-handed) marks "정답 (Correct)" or "패스 (Pass)" for each word and advances. A **bold countdown timer** (default 30–90s, adjustable) ticks down per round. After all words are revealed or time runs out, a summary shows **"맞힘: 7 / 패스: 2 / 시간초과: 1"** and the full word list (to verify answers).

**The single defining difference from the sibling tool 스피드퀴즈 제시어 (Speed Quiz Prompt Words, `docs/services/fun/speed-quiz/SPEC.md`) is the content, not the mechanic.** Speed Quiz's prompt words are guessed through spoken description/knowledge (proverbs, brand names, K-pop acts — words that require the presenter to *talk*). Charades' prompt words MUST be things a person can physically demonstrate in silence: concrete actions/verbs, animals (by movement/posture, not by mimicking sound), occupations (by their characteristic actions), archetypal roles/characters (by iconic pose/movement, not by referencing a copyrighted brand character), sports (by their motion), and simple emotions (by face + body). Every seed word is vetted against the curation checklist below — **abstract concepts, proverbs, brand names, and anything only identifiable through speech or written knowledge are out of scope for this tool** (they belong to Speed Quiz instead).

Because the reveal→timer→correct/pass→summary game loop, the deck content model (markdown pairs → build-time generated catalog), the settings/favorites/recents persistence, and the sound design are structurally identical to Speed Quiz, this tool reuses that engine (see the code-sharing decision above) rather than reimplementing it. Only the category vocabulary, seed content, and UI copy are new.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The deck catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (game settings + favorite decks + recent games); nothing is ever sent over the network. Game state is ephemeral.

CRITICAL (content model, invariants — mirrors speed-quiz): every deck MUST have a Korean file and an English file as a matching pair. Each file must carry a non-empty `title`, `category`, `difficulty` (easy/normal/hard), and `words` (array of ≥10 prompt-word objects: `term` required, optional `hint`). Structural metadata (`category`, `difficulty`, `words`) is canonical in the Korean file; the English file inherits these if absent (only `title` is per-locale). The build generator validates pair integrity, required fields, and word count and **fails the build** on any violation.

CRITICAL (SPA, presenter-first usability): 100% client-side SPA mounted on the SSG shell — deck selection, game setup, reveal/mark/undo, and summary all happen via local React state, no route navigation, no full reload.

CRITICAL (audio + motion): optional Web Audio sound effects (tick/chime/buzz, reused from the shared engine), toggleable, `prefers-reduced-motion` respected throughout. No flashing, no screen shake.
</overview>

<platform_integration>
  - Route: /[locale]/tools/charades (SSG; registry slug "charades", id "charades", status "live", accent "mint", category "fun", icon "PersonStanding").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, SNS ShareButtons.
  - Consumes: i18n namespace `tools.charades.*` (UI chrome strings only — NOT word content, which comes from markdown in charades.generated.json); the in_content AdSlot below the tool.
  - Platform dependency: uses the existing `'fun'` category (already active — speed-quiz, cheer, restaurant-map). One new `ToolMeta` registry entry, a slug→component branch in the tool route, a `generateMetadata` branch, and a `PersonStanding` entry in `src/components/home/toolStyle.tsx`'s `TOOL_ICONS` map (both registrations required — a missing `TOOL_ICONS` entry silently falls back to a generic Wrench icon on the home card, a repeat pitfall from prior tools).
  - **Shared engine dependency**: `src/lib/party-word-game/*` (new, this build extracts it — see code-sharing decision above). `src/lib/speed-quiz/*` five engine files become re-exports of it as part of this build; speed-quiz's own SPEC/behavior does not change, only its internal implementation location.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed deck catalog (pairs: `<deck>.md` + `<deck>_en.md`) in `content/charades/decks/`.
    - Build-time generator `scripts/generate-charades.mjs`: folder scan → frontmatter parse → validation → code-split static catalog (charades.generated.json). Wired to `prebuild`/`predev` alongside the existing speed-quiz generator (both run; independent scripts).
    - Six seed deck categories, each with **exactly 2 decks — Team A and Team B (A/B team-battle format)**, 120 prompt words total (6 × 2 × 10), ALL vetted mimeable-without-speech (see curation checklist): **동작 (Actions, easy)**, **동물 (Animals, easy)**, **직업 (Occupations, normal)**, **캐릭터·역할 (Characters/Roles, normal)**, **스포츠 (Sports, normal)**, **감정 (Emotions, hard)**. Each deck has **exactly 10 words** (not just a floor — capped so a category's A and B decks stay the same length for fair team rounds). Within a category, Team A and Team B share the same difficulty label and are curated to a comparable *word-level* difficulty distribution (no schema field for this — it's an authoring discipline: tier candidate words informally, then distribute tiers evenly across A/B, mirroring speed-quiz's precedent of encoding "team" purely via filename suffix + title, not a schema field).
    - Deck markdown templates (`content/charades/_TEMPLATE.md`, `_TEMPLATE_en.md`) + authoring README with the curation checklist embedded so future contributors vet new words the same way.
    - Presenter flow (mirrors speed-quiz exactly): (1) Home screen shows deck cards by category. (2) Tap a deck → game setup (difficulty, round time 30/60/90s/unlimited, shuffle on/off, show hints on/off — hint is a private text cue for the performer only, e.g. "동물원에 있어요" for 코끼리, never shown to guessers). (3) Tap "시작" → game UI: huge prompt word (center, performer-only view), countdown timer (top, bold), buttons "정답"/"패스" (bottom, ≥60px). Space/→ keyboard shortcuts. (4) Advance through all words or until time expires. (5) Summary: score card + full word list. (6) "다시" or "홈".
    - Deck selection: category filter tabs, search by deck name, favorites tab.
    - Game settings: category, difficulty, round time, shuffle, show/hide hints.
    - Scoring: `{ correct, pass, timeout }` + word-by-word result.
    - Sound: reused from `party-word-game` (tick/chime/buzz), toggleable, reduced-motion aware.
    - localStorage persistence: last game settings + favorite decks + recent games (separate storage key from speed-quiz — `jurepi-charades`).
    - Full keyboard support identical to speed-quiz: Space=correct/next, →=pass, ←=undo, Esc=end, ?=help.
    - Tool-specific SEO long-form (what is charades, how to host a round, party/classroom tips, why no speaking) + FAQ + SoftwareApplication + FAQPage JSON-LD, localized ko/en, rendered outside any client-mount gate (AI-crawler visible).
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Multiplayer / networked play. Single-device, local-only, same as speed-quiz.
    - Runtime deck-editing UI. Content changes only via repository markdown + rebuild.
    - Login / accounts / cross-device sync / leaderboards.
    - Rich HTML/script in markdown body. Prompts are plain text ± optional plain-text hint.
    - Per-deck deep-link routes (Phase 2 candidate, same as speed-quiz).
    - Analytics / usage metrics.
    - Any word/category requiring spoken description, brand-name recognition, or abstract/proverbial knowledge (that's Speed Quiz's job, not this tool's).
  </out_of_scope>
  <future_considerations>
    - Per-deck static deep-link routes (SEO) — Phase 2, same pattern as new-word/rankings/bookmarks entity spokes IF this content proves search-demanded (this tool is an interactive utility like speed-quiz/ladder, not a content collection — no spoke pages at launch).
    - Additional categories: household objects, weather, seasons/holidays, transportation — Phase 2.
    - Team mode with score-by-team — Phase 3.
    - Difficulty voting — Phase 3.
  </future_considerations>
</scope_boundaries>

<content_curation_policy note="THE core differentiator from speed-quiz — apply to every single seed word, multiple review passes">
  <checklist>
    - Can a person identify this from gesture/posture/facial-expression ALONE, without knowing any spoken word, brand name, or written phrase?
    - Is it distinguishable by MOVEMENT/POSTURE rather than by SOUND (avoid animals or actions where the only differentiator is a noise, e.g. cicada, telephone ringing)?
    - Is it a generic noun/role/action/emotion, NOT a specific copyrighted character or brand (e.g. use "닌자"/"해적"/"마법사" as archetypal roles, never a specific named franchise character)?
    - Is it concrete and physical, NOT an abstract concept, proverb, idiom, or four-character phrase (those stay in speed-quiz's `proverbs` deck)?
    - Is it unique within its deck (no near-duplicates)?
    - **Is the term itself a NOUN, not a verb phrase with a "-하기/타기/만들기/찍기/쓰기" suffix?** Guessers shout the exact word they think is correct; a verb-phrase term (e.g. "눈사람 만들기") leaves them unsure whether to say the full phrase or just the object, whereas a noun (e.g. "눈사람") has one unambiguous correct answer. Use the mimed object's name ("자전거", "기타", "우산") or the activity's own established noun form ("낚시", "저글링", "다림질", "세수") — never a raw "명사+하기" instruction. If no clean noun exists for a candidate, swap it for a different word rather than forcing an awkward reduction.
  </checklist>
  <categories note="each category = exactly 2 decks (Team A / Team B), 10 words each, disjoint word sets, matched difficulty">
    <category id="actions" difficulty="easy" note="verbs/activities, fully mimeable with props implied by gesture. Terms are NOUNS (the mimed object/activity name), not verb phrases with a '-하기/타기/만들기' suffix — guessers shout a crisp noun, not a full instruction (user correction 2026-07-22: verb-suffixed terms make the exact expected answer ambiguous).">
      Team A: 자전거, 낚시, 양치질, 설거지, 줄넘기, 눈사람, 기타, 저글링, 사진, 우산.
      Team B: 계단, 신발끈, 그네, 훌라후프, 물구나무서기, 빗자루, 세수, 머리 감기, 다림질, 요가.
    </category>
    <category id="animals" difficulty="easy" note="movement/posture-distinct, sound-independent">
      Team A: 캥거루, 코끼리, 원숭이, 뱀, 펭귄, 문어, 고릴라, 토끼, 곰, 거북이.
      Team B: 사자, 기린, 사슴, 다람쥐, 닭, 말, 돼지, 낙타, 코알라, 박쥐.
    </category>
    <category id="occupations" difficulty="normal" note="characteristic action, not a uniform/label">
      Team A: 의사, 소방관, 경찰관, 요리사, 미용사, 화가, 택배기사, 마술사, 지휘자, 개그맨.
      Team B: 선생님, 농부, 제빵사, 종업원, 가수, 우주비행사, 목수, 판사, 비행기 조종사, 승무원.
    </category>
    <category id="characters" difficulty="normal" note="archetypal role/pose, NOT a named copyrighted character">
      Team A: 좀비, 로봇, 유령, 발레리나, 카우보이, 닌자, 해적, 인어, 마법사, 슈퍼히어로.
      Team B: 왕, 기사, 마녀, 요정, 거인, 난쟁이, 엘프, 트롤, 늑대인간, 뱀파이어.
    </category>
    <category id="sports" difficulty="normal" note="characteristic motion">
      Team A: 야구, 축구, 농구, 볼링, 스키, 씨름, 태권도, 수영, 복싱, 양궁.
      Team B: 배구, 탁구, 골프, 배드민턴, 승마, 펜싱, 다이빙, 스케이트보드, 하키, 체조.
    </category>
    <category id="emotions" difficulty="hard" note="face + body only, hardest tier (deliberately harder — abstract-adjacent, requires clear physical expression)">
      Team A: 화남, 슬픔, 놀람, 부끄러움, 신남, 졸림, 무서움, 사랑, 아픔, 헷갈림.
      Team B: 행복, 걱정, 실망, 자신감, 질투, 안도, 후회, 피곤함, 자랑스러움, 감동.
    </category>
  </categories>
  <rejected_examples note="considered and explicitly excluded during review, kept here so future authors don't re-add them">
    - 카멜레온 (animals) — movement not visually distinct enough from generic "lizard" mime; ambiguous.
    - 스파이더맨/슈퍼맨/아이언맨 (characters) — specific copyrighted franchise characters; replaced with generic "슈퍼히어로" archetype pose.
    - Any 속담/사자성어/브랜드/K-pop act — inherently requires spoken/written knowledge, not body-mimeable; these remain speed-quiz's domain, not duplicated here.
  </rejected_examples>
</content_curation_policy>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <shared_engine>`src/lib/party-word-game/{shuffle,game-reducer,sound,favorites,slug}.ts` — extracted from speed-quiz (see code-sharing decision). Charades imports these directly (via its own `src/lib/charades/{shuffle,game-reducer,sound,favorites,slug}.ts` re-export files, mirroring speed-quiz's file layout for consistency, each just `export * from '@/lib/party-word-game/<name>'`).</shared_engine>
    <content_source>Decks live as markdown pairs in `content/charades/decks/`. Build-time-only generator access, no runtime file system access.</content_source>
    <frontmatter_parsing>gray-matter (already a devDependency from speed-quiz) — generator script only.</frontmatter_parsing>
    <validation>zod (already in repo) for per-file frontmatter schema + merged deck invariants. `src/lib/charades/schema.ts` defines its OWN category enum (`actions | animals | occupations | characters | sports | emotions`), distinct from speed-quiz's.</validation>
    <catalog>Generated artifact `src/components/tools/charades/data/charades.generated.json`, dynamically imported only on this tool's route (code-split, same pattern as speed-quiz/new-word/qna-a-day — protects platform JS budget).</catalog>
    <sound>Reused from `party-word-game/sound.ts` — no new synthesis code.</sound>
    <timer>Reused pattern from speed-quiz's `useSpeedQuiz` (vanilla countdown, snappy display) — implemented fresh in `useCharades.ts` following the same approach (hook itself is NOT shared per the UI-not-shared decision, but its internal timer *technique* mirrors speed-quiz's proven approach).</timer>
    <animation>Native CSS transitions/animations only, compositor-friendly properties, `prefers-reduced-motion` gated.</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/lib/party-word-game/                    # NEW shared engine (content-agnostic, extracted from speed-quiz)
├── shuffle.ts (+test)                      # fairShuffle(words, seed)
├── game-reducer.ts (+test)                 # nextWord/markCorrect/markPass/undo/endGame — generic over {term,hint} words
├── sound.ts (+test)                        # synthesizeTick/Chime/Buzz (Web Audio tone specs)
├── favorites.ts (+test)                    # toggleFavorite/pushRecent/pruneUnknown (generic string-id ops)
└── slug.ts (+test)                         # slugify/resolveSlug

src/lib/speed-quiz/                         # UNCHANGED public paths — 5 files become re-exports
├── shuffle.ts        → `export * from '@/lib/party-word-game/shuffle'`
├── game-reducer.ts   → `export * from '@/lib/party-word-game/game-reducer'`
├── sound.ts          → `export * from '@/lib/party-word-game/sound'`
├── favorites.ts      → `export * from '@/lib/party-word-game/favorites'`
├── slug.ts           → `export * from '@/lib/party-word-game/slug'`
└── schema.ts / merge.ts / catalog.ts       # UNCHANGED, speed-quiz-specific category enum stays here

scripts/
└── generate-charades.mjs                   # mirrors generate-speed-quiz.mjs: scan content/charades/decks/* → parse → validate → emit charades.generated.json

content/charades/                           # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md           # Templates (excluded by generator)
├── README.md                               # Authoring guide + curation checklist (mimeable-without-speech)
└── decks/*.md  *_en.md                     # Deck pairs (6 categories × 1 deck each minimum)

src/
├── lib/charades/                           # Domain layer — pure, unit-tested
│   ├── schema.ts                           # zod: DeckFileFront, MergedDeck, GameState, StoreSchema + STORE_VERSION — charades' OWN category enum
│   ├── merge.ts                            # mergePair(koFront, enFront) — charades' own canonical-rule defaults
│   ├── catalog.ts                          # allDecks/byId/byCategory/categories(); CATEGORY_ORDER for charades
│   ├── shuffle.ts / game-reducer.ts / sound.ts / favorites.ts / slug.ts   # re-export from party-word-game
│   └── *.test.ts                           # schema/merge/catalog tests + re-export smoke tests
├── components/tools/charades/
│   ├── Charades.tsx                        # Orchestrator (Client Component) — route/setup/game/summary state
│   ├── useCharades.ts                      # Hook: dynamic catalog import + localStorage (`jurepi-charades`) + sound + timer
│   ├── DeckBrowser.tsx                     # Home: category tabs + deck cards; search
│   ├── DeckCard.tsx                        # One deck: title, category, difficulty, word count, favorite star
│   ├── GameSetup.tsx                       # Settings: difficulty, round time, shuffle, hint toggles
│   ├── GameBoard.tsx                       # Active game: huge prompt word, countdown timer, correct/pass/undo/end
│   ├── GameSummary.tsx                     # Score card + word-by-word results + full word list
│   ├── SoundToggle.tsx                     # Mute/unmute button
│   ├── CharadesIntro.tsx                   # H1 + lead (SSR, SEO)
│   ├── CharadesHowTo.tsx                   # How-to-play + hosting tips (SSR, SEO long-form)
│   ├── CharadesFaq.tsx                     # Q&A + FAQPage JSON-LD (single owner of FAQPage per platform convention)
│   ├── CharadesStructuredData.tsx          # SoftwareApplication JSON-LD
│   └── data/charades.generated.json        # Generated artifact
└── i18n/messages/{ko,en}.json              # tools.charades.* (mirrors tools.speed-quiz.* namespace shape)
</file_structure>

<core_data_entities note="mirrors speed-quiz's shapes exactly; only the category enum differs">
  <deck_file_front>
    - title: string (required)
    - slug?: string
    - category: enum (actions, animals, occupations, characters, sports, emotions) — Korean file canonical
    - difficulty: enum (easy, normal, hard) — Korean file canonical
    - words: array (required, ≥10) — { term: string (required), hint?: string }
  </deck_file_front>
  <merged_deck>
    - slug, category, difficulty, words (canonical from ko), ko: {title, words?}, en: {title, words?}
    - INVARIANT — same as speed-quiz: pair required, ≥10 words each, unique terms per deck, unique slug per category.
  </merged_deck>
  <game_state>
    - deckId, words: WordWithResult[] (result: correct|pass|timeout|unrevealed), currentIndex, timerMs, score {correct,pass,timeout}, roundSettings {difficulty, roundTimeSeconds, shuffle, showHints}
  </game_state>
  <charades_store note="localStorage key `jurepi-charades` — separate from speed-quiz's `jurepi-speed-quiz`">
    - version (STORE_VERSION), settings {lastCategory?, lastDifficulty?, roundTimeSeconds?, shuffleOn, soundOn}, favorites: string[], recents: string[] (max 10)
  </charades_store>
  <constants>RECENTS_MAX=10; WORDS_PER_DECK_MIN=10; WORDS_PER_DECK_MAX=10 (exactly 10 — A/B team decks stay the same length); TIME_PRESETS=[30,60,90]; CATEGORY_ORDER=['actions','animals','occupations','characters','sports','emotions']</constants>
</core_data_entities>

<route_definitions>
  <public_routes><route path="/:locale/tools/charades" page="Charades (platform tool route branches slug→component)" /></public_routes>
  <note>Single route. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <charades>
    <charades_intro />
    <deck_browser><deck_card /></deck_browser>
    <game_setup />
    <game_board />
    <game_summary />
    <charades_how_to />
    <charades_faq />
  </charades>
  <note>Identical shape to speed-quiz's tree (see that SPEC for the fully annotated version) — separate files, same pattern.</note>
</component_hierarchy>

<pages_and_interfaces>
  <note>Visual/interaction spec mirrors speed-quiz's `pages_and_interfaces` section verbatim (huge prompt word clamp(48px,10vw,120px), 72px monospace timer, ≥60px buttons, responsive column counts) — see `docs/services/fun/speed-quiz/SPEC.md` for the full annotated layout. Differences for charades:</note>
  <charades_intro>
    - Eyebrow: "몸으로 하는 게임" / "SILENT ACTING GAME".
    - H1: "몸으로 말해요" / "Charades".
    - Lead: "말은 금지! 몸짓과 표정만으로 제시어를 표현하고 팀원이 맞춰보세요." / English equivalent — the "no speaking" rule stated up front.
  </charades_intro>
  <game_setup>
    - Hint toggle label clarifies it's performer-only: "힌트 보기 (나만 보여요)" / "Show hint (performer only)".
  </game_setup>
  <game_board>
    - Optional small reminder badge: "말하지 마세요!" / "No talking!" (static, non-intrusive, top corner) — reinforces the rule during play.
  </game_board>
  <how_to>
    - Explicitly explains the "no speaking, no spelling, no sound effects" rule as step 1, since this is the tool's entire differentiator.
  </how_to>
</pages_and_interfaces>

<core_functionality>
  <generation note="scripts/generate-charades.mjs — mirrors generate-speed-quiz.mjs exactly, different folder/schema/output">
    Scan content/charades/decks/ → gray-matter → zod validate → mergePair → validate (pair/fields/count/uniqueness) → sort (CATEGORY_ORDER → difficulty → slug) → emit charades.generated.json. package.json: add to existing `predev`/`prebuild` chain alongside generate-speed-quiz.mjs (both scripts run, independent).
  </generation>
  <catalog_access>allDecks()/byId()/byCategory()/categories() — same shape as speed-quiz's src/lib/speed-quiz/catalog.ts, own file in src/lib/charades/catalog.ts.</catalog_access>
  <search>searchDecks(decks, query, locale) — same normalize/match logic as speed-quiz (own copy, tiny, ~15 lines, not worth extracting given its trivial size and the emphasis on NOT touching speed-quiz's files further than the 5 engine re-exports).</search>
  <shuffle>Reused from party-word-game/shuffle.ts via re-export — seeded, reproducible.</shuffle>
  <game_reducer>Reused from party-word-game/game-reducer.ts via re-export — nextWord/markCorrect/markPass/undo/endGame, immutable.</game_reducer>
  <timer>Same technique as speed-quiz's useSpeedQuiz (interval-based countdown, ~60fps display update), implemented in useCharades.ts (hook itself not shared, per UI-not-shared decision).</timer>
  <sound>Reused from party-word-game/sound.ts via re-export — tick/chime/buzz.</sound>
  <favorites_and_recents>Reused from party-word-game/favorites.ts via re-export.</favorites_and_recents>
  <persistence_adapter useCharades>Same shape as useSpeedQuiz: mount → dynamic catalog import + localStorage(`jurepi-charades`) → zod → pruneUnknown; debounced persist; exposes filtered decks, selectedDeckId, gameState + dispatch, favorites, sound toggle.</persistence_adapter>
  <i18n>All UI chrome from tools.charades.* (ko/en). Deck title/words come from markdown (charades.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>CRITICAL: generator reports each violation (file/field/reason) to stderr, exits non-zero → build fails.</build_time>
  <search_no_results>Same empty-state pattern as speed-quiz.</search_no_results>
  <storage>Same as speed-quiz: unavailable → in-memory only; corrupt blob → zod fail → fresh start, no throw.</storage>
  <web_audio>Unavailable/fails → silently skip, no error banner.</web_audio>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens.</source>
  <accent_usage>Per-tool identity accent is MINT (var(--accent-mint) / var(--accent-mint-soft)) — distinct from speed-quiz(sun)/cheer(coral)/restaurant-map(rose) within the 'fun' category. Intro icon, setup button accent, deck selected bar, favorite star (filled).</accent_usage>
  <presenter_first_scale>Identical to speed-quiz: prompt word clamp(48px,10vw,120px) bold; buttons ≥60px full-width mobile; timer 72px monospace high-contrast; deck cards 18–20px title.</presenter_first_scale>
  <typography>H1 Gmarket Sans clamp(28–40px); prompt word 48–120px/700; timer 72px/700 monospace tabular-nums; button labels 16–18px/600.</typography>
  <motion>transform/opacity only; prefers-reduced-motion respected throughout (same as speed-quiz).</motion>
  <accessibility>Real `<button>` elements ≥44px; timer aria-live; keyboard shortcuts documented in help overlay; WCAG 2.1 AA.</accessibility>
  <responsive>≥1024px 4-col deck grid; 768–1023px 2-col; <768px 1-col, full-width game board/buttons; no overflow at 320px.</responsive>
  <icons>lucide-react: `PersonStanding` (tool card, registered in TOOL_ICONS), Search, Volume2/VolumeX, Star/StarOff, Play, X.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>Titles/terms/hints render as text nodes only, no dangerouslySetInnerHTML. Generator validates frontmatter with zod.</input>
  <privacy>Favorites/recents/settings localStorage-only, never sent; no analytics on game data; game state ephemeral.</privacy>
  <content_integrity>Catalog is a build-time static asset; unit tests validate derivation/uniqueness/locale completeness.</content_integrity>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>Engine extraction causes zero speed-quiz regression</description>
    <steps>
      1. After extracting src/lib/party-word-game/* and converting speed-quiz's 5 engine files to re-exports, run the FULL existing speed-quiz unit suite (schema/merge/slug/shuffle/game-reducer/sound/favorites/catalog + all component tests) — must be 100% green, unchanged assertion count.
      2. Run the full speed-quiz E2E spec (tests/e2e/speed-quiz.spec.ts) — must be 100% green.
      3. tsc --noEmit clean.
    </description>
  </test_scenario_1>
  <test_scenario_2>
    <description>Markdown folder → deck list auto-compose (charades)</description>
    <steps>
      1. actions-a.md + actions-a_en.md exist with exactly 10 words vetted against the curation checklist.
      2. pnpm dev → predev generator runs → charades.generated.json has merged record.
      3. Visit /ko/tools/charades → deck browser renders "일상 동작 A팀" card (and its "일상 동작 B팀" sibling, side by side within the actions category group).
      4. Missing pair or word count ≠10 → generator reports file/reason, exits non-zero.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Full game flow, favorites, keyboard, sound</description>
    <steps>
      1. Select deck → setup (difficulty/time/shuffle/hint) → start → huge prompt word + countdown.
      2. Correct/Pass/Undo via tap and keyboard (Space/→/←).
      3. Round ends (timeout or all words) → summary with score + word list.
      4. Favorite toggle persists across reload; recents populated after a completed round.
      5. Sound toggle mutes/unmutes tick/chime/buzz.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>i18n, SEO, responsive, a11y</description>
    <steps>
      1. /en renders English chrome + English deck titles.
      2. Prerendered HTML has unique title/canonical/hreflang, SoftwareApplication + FAQPage JSON-LD (outside any mount gate).
      3. 320px viewport: no overflow, single-column deck list, full-width game board/buttons.
      4. axe a11y: no violations. prefers-reduced-motion: no scale/pulse animation, instant transitions.
    </steps>
  </test_scenario_4>
</final_integration_test>

<success_criteria>
  <content_model>Drop `<deck>.md` + `<deck>_en.md` pair, rebuild, auto-reflects with zero code change; generator validates and fails build on violation.</content_model>
  <curation>Every seed word passes the mimeable-without-speech checklist; zero words requiring spoken/written knowledge, brand names, or abstract concepts.</curation>
  <code_reuse>party-word-game/{shuffle,game-reducer,sound,favorites,slug} has exactly ONE implementation each, consumed by both speed-quiz and charades via re-export; speed-quiz's public API/paths are unchanged.</code_reuse>
  <technical_quality>lib/charades/* pure ≥90% unit coverage; generator validation tests; TS 0 errors; catalog code-split.</technical_quality>
  <visual_design>DESIGN.md compliant; mint identity accent; presenter-first scale; text-node render only.</visual_design>
  <accessibility>Full keyboard; aria-live score; WCAG 2.1 AA.</accessibility>
  <discoverability>Unique meta/canonical/hreflang; SoftwareApplication + FAQPage JSON-LD; llms.txt entry; answer-first HowTo/FAQ SSR outside mount gate.</discoverability>
</success_criteria>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry.
    {
      id: 'charades',
      slug: 'charades',
      category: 'fun',
      icon: 'PersonStanding',            // lucide-react — MUST also register in toolStyle.tsx TOOL_ICONS map
      accent: 'mint',
      status: 'live',
      addedAt: '<build date>',
      order: <derived from demand-based curation, insert near other fun-category tools>,
      keywords: ['몸으로말해요','몸으로말하기','바디랭귀지','제스처게임','파티게임','팀빌딩','교실게임','charades','body language','gesture game','party game','pantomime','no talking'],
    },
    ```
    Also add slug→component branch (`<Charades/>`) + generateMetadata branch in `[slug]/page.tsx`, and register `PersonStanding` in `toolStyle.tsx`'s `TOOL_ICONS`.
  </platform_registry_change>
  <recommended_implementation_order>
    1. Extract src/lib/party-word-game/* from speed-quiz's 5 engine files; convert speed-quiz files to re-exports; run FULL speed-quiz regression (unit+E2E) — must be green before proceeding.
    2. src/lib/charades/{schema,catalog,merge}.ts TDD (own category enum) + re-export shims for shuffle/game-reducer/sound/favorites/slug.
    3. scripts/generate-charades.mjs + content/charades/{_TEMPLATE,_TEMPLATE_en,README} + seed decks (6 categories, curated per checklist, ≥100 words) + validation tests.
    4. tools.charades.* i18n messages (ko/en) — leader inserts via deterministic Node script, `{key,ko,en}` contract, not delegated to a subagent (large-JSON-edit lesson).
    5. useCharades hook + DeckBrowser/DeckCard/GameSetup/GameBoard/GameSummary/SoundToggle (new files, speed-quiz pattern mirrored).
    6. CharadesIntro/HowTo/Faq + StructuredData (SoftwareApplication + FAQPage JSON-LD via lib/seo.ts), rendered outside any mount gate.
    7. Registry entry (status live) + route branch + TOOL_ICONS registration + llms.txt entry.
    8. Full verification: tsc, full vitest (speed-quiz regression + charades new), color-tokens guard, i18n symmetry/leak grep, static build, E2E (speed-quiz full spec + new charades spec), live visual gate (ko/en/320/1440/console-0).
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥90% (lib/charades/*); generator validation fixtures; component tests against the REAL i18n catalog (not inline mocks); E2E scenarios 1–4 above; speed-quiz's full existing suite re-run as a regression gate after the engine extraction step.</testing_strategy>
</key_implementation_notes>

</project_specification>
```
