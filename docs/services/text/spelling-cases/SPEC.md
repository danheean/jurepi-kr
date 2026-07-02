# Spelling Cases — Korean Spelling & Usage Rules — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **맞춤법 사례 / Spelling Cases** — a browsable reference of common Korean spelling, spacing, and usage confusions (맞춤법/띄어쓰기/발음·표기/외래어 표기), each entry capturing the CORRECT form, common WRONG forms, a plain-language rule/explanation, and contrastive example sentences. Cases are stored as markdown pairs and auto-compiled into a searchable, interactive dictionary. Content is managed as markdown file pairs (`<case>.md` + `<case>_en.md`), and at build time a generator reads the folder, validates, and emits a static catalog. The tool mounts as a client-side SPA offering type tabs (spelling, spacing, notation, loanword), search, favorites/recents, and a detail view that **emphasizes the correct vs. wrong contrast visually** (correct ○ green/success, wrong ✗ red/danger with strikethrough) followed by the rule and example sentence pairs.
> Internal service codename: `spelling-cases`. Registry id: `spelling-cases`. Public URL slug: `/[locale]/tools/spelling-cases`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/new-word/SPEC.md`](../new-word/SPEC.md)

```xml
<project_specification>

<project_name>Spelling Cases — Korean Spelling & Usage Rules (Jurepi tool, codename spelling-cases, registry id spelling-cases)</project_name>

<overview>
Spelling Cases brings together common Korean spelling and usage dilemmas in one place — quick reference for native speakers and learners alike. Users search for a problem pair ("되 돼", "안 않", "왠지 웬지") or browse by type (맞춤법/띄어쓰기/발음·표기/외래어), open a case card, and instantly see "which is right and why" with clear visual emphasis: the ○ CORRECT form highlighted in success/green, the ✗ WRONG form(s) struck through in danger/red, followed by a concise rule explanation and sentence pairs showing correct vs. wrong usage. This solves "Is it 돼 or 되?" instantly and decisively — no ambiguity, no debate.

The tool's content model is fundamental: cases are NOT code — they are **markdown files**. Create pairs in the content folder (`<case>.md` for Korean + `<case>_en.md` for English), and at **build time** a generator scans the folder, parses the frontmatter, validates it, and bakes it into a static catalog (spelling-cases.generated.json). The tool then dynamically imports that catalog to render the list, search, and detail views. This means "drop a file in the folder and it appears in the list" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The case catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + recents), and nothing is ever sent over the network.

CRITICAL (content model, invariants): every case MUST have a Korean file and an English file as a matching pair (one file only = build warning then exclusion). Each file must carry a non-empty `correct` (the right form), `type` (enum: spelling, spacing, notation, loanword), `rule` (short plain-text explanation), and `examples` (array of ≥1 `{ correct, wrong }` sentence pair). Structural metadata like `slug`, `relatedSlugs` is **canonical in the Korean file**; the English file inherits these if absent. The build generator validates (1) pair integrity (2) required fields per locale (3) slug uniqueness (4) `relatedSlugs` references point to real slugs, and **fails the build with a clear message** if ANY rule is broken (no silent omission).

CRITICAL (visual contrast — the core value prop): the detail view MUST emphasize correct vs. wrong with **high visual contrast** — correct form rendered with success/green token (`--color-success` / `--color-success-ink`), wrong forms with danger/red token (`--color-danger` / `--color-danger-ink`) + strikethrough text decoration. This is the defining UX of this tool: "which is right" is answered in 1 second by color and strikethrough. Use DESIGN.md tokens ONLY; do NOT invent new semantic tokens.

CRITICAL (SPA, usability-first): every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — type switching, search, opening cards, favoriting — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the case list is visible at a glance, search is one keystroke away ("/"), and every case is reachable in under a second.
</overview>

<platform_integration>
  - Route: /[locale]/tools/spelling-cases (SSG; registry slug "spelling-cases", id "spelling-cases", status "coming_soon", accent "mint", category "text").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.spelling-cases.*` (UI chrome strings: type labels, search, how-to, FAQ — NOT case content; that comes from markdown in spelling-cases.generated.json); the in_content AdSlot below the tool.
  - Platform dependency (SMALL — NO new category needed): the `'text'` category already exists in `ToolCategory` with the `mint` accent and the "텍스트"/"Text" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch. Contrast with qna-a-day (which introduced a new category).
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed case catalog (pairs: `<case>.md` + `<case>_en.md`) in `content/spelling-cases/cases/`.
    - Build-time generator: folder scan → frontmatter parse → validation → code-split static catalog (spelling-cases.generated.json). Wired to `prebuild`/`predev`.
    - Four seed types with initial cases: **spelling** (맞춤법: 되/돼, 안/않, 각/갹, 낫다/낳다/났다 …), **spacing** (띄어쓰기: 로서/로써, 든지/던지, 붙여쓰기 사례 …), **notation** (발음·표기: 왠지/웬, 뵈요/봬요, 여 받침 …), **loanword** (외래어: 외래어 표기법 …). Minimum 3+ cases per type.
    - **Spelling case markdown templates**: annotated markdown templates (`content/spelling-cases/_TEMPLATE.md`, `content/spelling-cases/_TEMPLATE_en.md`) and authoring README to make adding new cases easy.
    - Type tabs: derived from unique types in the catalog (All / Spelling / Spacing / Notation / Loanword). Virtual tabs: Favorites (when pinned), Recent (when viewed).
    - Search: case correct/wrong forms, rule, examples across BOTH locales, real-time filter (debounced). Case and diacritic insensitive.
    - Detail view: **CORRECT form prominently displayed in ○ success/green (--color-success token)**, then **WRONG form(s) in ✗ danger/red (--color-danger token) with strikethrough**, then the `rule` (short explanation), then example sentence pairs (each marked ○/✗ corresponding to correct/wrong).
    - Favorites (pinned) + recent views — localStorage persistence, auto-prune of unknown slugs.
    - Full keyboard support: "/" search focus, arrow keys case navigation, Enter to open, Esc to clear/close, "f" favorite toggle.
    - Tool-specific SEO long-form ("What is Korean spelling?" / "Common spelling mistakes") + FAQ (FAQPage JSON-LD) + **DefinedTermSet-style JSON-LD** (each case as a concept), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - User browser-based case add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - Per-case deep-link URLs (e.g., /tools/spelling-cases/dwe-doe) — MVP is a single route + client state. (Phase 2 candidate.)
    - Rich HTML/script in markdown body. Rules and examples are structured fields (plain text / limited inline emphasis), rendered safely.
    - Audio/pronunciation samples (MVP text-only; pronunciation guide as text transcription only).
  </out_of_scope>
  <future_considerations>
    - Per-case static deep-link routes + individual case pages (SEO) — Phase 2.
    - Type expansion: homophone confusion, honorific usage, etc. (catalog only, schema unchanged).
    - Audio pronunciation guide for each case — Phase 2.
    - "Spelling tip of the day" random card / share image — Phase 3.
    - User suggestions (case submissions) form → repository issue/PR link — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Cases live as markdown pairs in `content/spelling-cases/cases/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Rules and examples are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged case-record invariants. Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/spelling-cases/data/spelling-cases.generated.json), dynamically imported only on this tool's route so case content never enters the global i18n message bundle (protects platform JS budget — same pattern as new-word/rankings).</catalog>
    <color_tokens>CRITICAL: Use DESIGN.md tokens ONLY for correct/wrong contrast. Correct = `var(--color-success)` / `var(--color-success-ink)`. Wrong = `var(--color-danger)` / `var(--color-danger-ink)`. DO NOT invent semantic-* or custom tokens.</color_tokens>
    <animation>Native CSS transitions only (card hover lift, detail cross-fade). No animation library. Strikethrough is CSS text-decoration, not animated.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<content_authoring_model>
  <directory>
    content/spelling-cases/
    ├── _TEMPLATE.md            # New-case Korean template (annotated; generator excludes "_" prefix)
    ├── _TEMPLATE_en.md         # New-case English template
    ├── README.md               # Authoring guide (type list, required fields, example pairs)
    └── cases/
        ├── dwe-doe.md              # Korean canonical (structural metadata canonical) — 돼 vs 되
        ├── dwe-doe_en.md           # English
        ├── an-anh.md               # 안 vs 않
        ├── an-anh_en.md
        ├── gak-gakk.md             # 각 vs 갹
        ├── gak-gakk_en.md
        └── …
  </directory>
  <pairing note="pair rule">
    - File name base (minus `_en` suffix) is the **pair key**. `dwe-doe.md` (ko) ↔ `dwe-doe_en.md` (en).
    - Files starting with `_` are ignored by the generator (_TEMPLATE, etc.).
    - Missing pair (English-only or Korean-only) → build warning + case excluded (canonical-pair policy is CRITICAL). ASCII file names preferred (URL/slug stability).
  </pairing>
  <slug note="identifier">
    - `slug` = value from Korean file frontmatter `slug` (if present), else base file name slugified. Used by `relatedSlugs`, favorites, recents. Must be unique in the catalog (test/generator validated).
  </slug>
  <shared_metadata note="canonical rule">
    - Structural metadata (`type`, `slug`, `relatedSlugs`) is **canonical in the Korean file**. English file inherits if omitted, must match if present (validation enforces).
    - Locale-specific content (`correct`, `wrong`, `rule`, `examples`, `note`) is independent per file.
  </shared_metadata>
  <template_ko>
    ```markdown
    ---
    # ── required ──
    correct: 돼              # The RIGHT form (Korean display)
    type: spelling           # Type: spelling | spacing | notation | loanword
    rule: |                  # Short plain-text rule (1–2 sentences, ≤150 chars)
      '돼'는 동사 '되다'의 어간 '되'에 '어'가 붙은 형태로, 
      미완료 과거형을 나타낸다. '안 돼' = 안 되다.
    examples:                # Minimum 1 pair { correct, wrong }
      - correct: "안 돼요."   # Correct usage
        wrong: "안 되요."     # Wrong usage (common mistake)
      - correct: "할 수 돼요." (informal) / "할 수 있어요." (formal)
        wrong: "할 수 되요."
    # ── optional ──
    slug: dwe-doe            # ASCII stable identifier (canonical from Korean file; absent = derive from filename)
    wrong: ["되", "도", …]   # Optional list of common wrong forms (distinct list for quick scanning)
    note: "Informal speech uses '돼' more; formal writing uses '되' more often, but '돼' in paste-tense negative is always correct."  # Etymology/usage note
    relatedSlugs: [an-anh, gak-gakk]  # Related case slugs (optional)
    ---

    <!-- (Optional) Extended explanation. MVP renders only paragraph-level plain text.
         Rich HTML/script forbidden. -->
    ```
  </template_ko>
  <template_en>
    ```markdown
    ---
    # ── required ──
    correct: 돼 (Dwe)
    rule: |
      '돼' is the stem '되' (to become) + the vowel '어' forming the incomplete past tense.
      '안 돼' = cannot, is unable to. Native speakers always use '돼' in negatives like '안 돼' and '못 돼'.
    examples:
      - correct: "안 돼요." (Cannot do it. / It won't work.)
        wrong: "안 되요." (Technically wrong in modern Korean.)
      - correct: "이제 돼요." (Now is okay / acceptable.)
        wrong: "이제 되요." (Rarely used; sounds formal/archaic.)
    # ── optional (inherits from Korean file if omitted) ──
    wrong: ["되 (Doe)"]
    note: "Modern Korean strongly prefers '돼' in negative, informal, and conversational contexts."
    ---
    ```
  </template_en>
</content_authoring_model>

<file_structure>
scripts/
└── generate-spelling-cases.mjs         # Build time: scan content/spelling-cases/cases/* → parse → validate → emit spelling-cases.generated.json. Wired to prebuild/predev.
content/spelling-cases/                  # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md        # Templates (excluded by generator)
├── README.md                            # Authoring guide
└── cases/*.md  *_en.md                  # Case pairs
src/
├── lib/spelling-cases/                  # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                        # zod: CaseFileFront(ko/en), MergedCase, StoreSchema + STORE_VERSION
│   ├── merge.ts                         # mergePair(koFront, enFront): apply canonical rule → MergedCase; validatePair
│   ├── slug.ts                          # slugify(name), resolveSlug(front, filename)
│   ├── catalog.ts                       # Typed access: allCases, byId, byType, types(); related referential integrity check
│   ├── search.ts                        # filterCases(cases, query, locale): correct+wrong+rule+examples both locales; normalize
│   └── favorites.ts                     # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(slugs, catalog)
├── components/tools/spelling-cases/
│   ├── SpellingCases.tsx                # Orchestrator (Client Component) — type/query/selectedSlug state + useSpellingCatalog()
│   ├── useSpellingCatalog.ts            # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── TypeTabs.tsx                     # All / Spelling / Spacing / Notation / Loanword / (Favorites) / (Recent) pills
│   ├── CaseSearch.tsx                   # Search input ("/" focus, clear, result count, aria)
│   ├── CaseList.tsx                     # Responsive card list; roving tabindex keyboard nav
│   ├── CaseCard.tsx                     # One-case card: correct form (success), wrong forms, rule excerpt, type badge, star
│   ├── CaseDetail.tsx                   # Selected case: correct (success/green), wrong (danger/red strikethrough), rule, examples, related chips
│   ├── ExamplePair.tsx                  # Single example row: ○ correct sentence (success) vs ✗ wrong sentence (danger strikethrough)
│   ├── RelatedChips.tsx                 # related slug → click to select that case
│   ├── SpellingIntro.tsx                # H1 + lead (SEO; server-render where possible)
│   ├── SpellingHowTo.tsx                # "What is spelling confusion?" / "Common Korean mistakes" (SEO long-form)
│   ├── SpellingFaq.tsx                  # Q&A + FAQPage JSON-LD
│   └── data/
│       └── spelling-cases.generated.json # Generated artifact (gitignore OR commit) — [MergedCase...]
└── i18n/messages/{ko,en}.json           # tools.spelling-cases.* UI chrome (tabs, type labels, search, toasts, lang toggle, how-to, FAQ) — NOT case content
</file_structure>

<core_data_entities>
  <case_file_front note="individual markdown file frontmatter (parse unit)">
    - correct: string (required, non-empty) — the RIGHT form (that locale)
    - type: enum (spelling, spacing, notation, loanword) — Korean file canonical
    - rule: string (required, non-empty, plain text, 50–200 chars)
    - examples: array (required, ≥1)
      - correct: string (example sentence using correct form)
      - wrong: string (example sentence using common wrong form)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - wrong?: string[] — optional list of common wrong forms (distinct collection for UI scanning)
    - note?: string — usage context or etymology (optional)
    - relatedSlugs?: string[] — other case slugs (optional)
    INVARIANT: correct/type/rule/examples non-empty, examples ≥1. zod parse failure → collect as error (build failure candidate).
  </case_file_front>
  <merged_case note="ko+en merge result; catalog record; spelling-cases.generated.json item">
    - slug: string — unique identifier in catalog (unique; favorites/recents/related reference)
    - type: enum (spelling, spacing, notation, loanword) — Korean file canonical
    - relatedSlugs: string[] — canonical; only real slugs in catalog (build validates, missing → error)
    - ko: { correct, wrong?, rule, examples, note? }
    - en: { correct, wrong?, rule, examples, note? }
    INVARIANT — PAIR/FIELDS/UNIQUENESS/REFERENCE: every record has both ko+en; each has correct/type/rule/≥1 example; slug unique; related points to real slugs. Violation → generator build failure (not silent omission, explicit error + file/field report).
  </merged_case>
  <case_type note="grouping by category; localized label from i18n">
    - id: enum (spelling, spacing, notation, loanword). Display order: spelling → spacing → notation → loanword. Label: tools.spelling-cases.types.<id>.
    - Virtual tabs (not real types): "all" (everything), "favorites" (pinned), "recent" (MRU) — shown in tab row when applicable.
  </case_type>
  <spelling_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — case slugs, insertion order
    - recents: string[] — case slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastType?: string; createdAt: number }
    localStorage key: `jurepi-spelling-cases`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown slugs pruned on load (catalog change never leaves dangling ids).
  </spelling_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; CARD_DEF_CLAMP = 2 lines; TOAST_MS = 1600ms.
  </constants>
  <defaults>
    - New user: favorites/recents empty; active tab "all"; no case selected (detail shows empty hint); language display = current locale.
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/spelling-cases" page="SpellingCases (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. Per-case deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <spelling_cases>               <!-- "use client"; owns type + query + selectedSlug + useSpellingCatalog() state -->
    <spelling_intro />           <!-- H1 + lead (SSR where possible) -->
    <spelling_layout>            <!-- Selector on top, detail below when selected — same on desktop & mobile -->
      <spelling_main>            <!-- Left/top column -->
        <case_search />          <!-- "/" focus, clear, result count -->
        <type_tabs />            <!-- All / Spelling / Spacing / Notation / Loanword / Favorites / Recent -->
        <case_list>              <!-- Roving tabindex cards -->
          <case_card />          <!-- × N: click = select (open detail); star = favorite -->
          <empty_state />        <!-- No results / empty favorites / empty recents -->
        </case_list>
      </spelling_main>
      <case_detail>              <!-- Full-width panel below; shown only when case selected -->
        <example_pair />         <!-- Correct (success) vs Wrong (danger strikethrough) sentences -->
        <related_chips />        <!-- related slug → click to navigate -->
      </case_detail>
    </spelling_layout>
    <spelling_how_to />          <!-- SEO long-form -->
    <spelling_faq />             <!-- FAQPage JSON-LD -->
  </spelling_cases>
  <note>SPA within tool: type/search/select = local state switch, NOT route navigation. Detail is a full-width panel rendered below the selector (same component on desktop & mobile), not a sidebar or bottom-sheet.</note>
</component_hierarchy>

<pages_and_interfaces>
  <spelling_intro>
    - Eyebrow: "텍스트 도구" / "TEXT TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "맞춤법 사례" / "Spelling Cases" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "한국어 맞춤법과 띄어쓰기, 표기 헷갈리는 부분을 정답과 오답을 명확히 구분하여 찾아보세요." / English equivalent.
  </spelling_intro>

  <case_search>
    - DESIGN text-input style, main column full width, leading Search icon (lucide, 20px var(--text-muted)), placeholder "되·돼, 안·않, 띄어쓰기로 검색…" / "Search by case, rule, examples…".
    - Focus on "/" keypress (when not already typing). Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption var(--text-muted), aria-live="polite".
    - aria: role="searchbox", aria-controls the list.
  </case_search>

  <type_tabs>
    - Horizontal pill row (category-pill / category-pill-active). Order: "전체"(all) → types (spelling → spacing → notation → loanword) → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary; hover lifts bg.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active. Narrow screens scroll horizontally + snap.
    - Compose with search: type narrows set, search filters within it. "All" + empty search = full catalog.
  </type_tabs>

  <case_list>
    - Responsive grid: 1-column <768px; 2-column ≥768px. Full container width (detail sits below, not beside).
    - Each card (case_card):
      - Top: correct form (headline 18–20px **var(--color-success)** / 600 weight) with ○ prefix, then type badge (small pill, type-tinted).
      - Body: rule excerpt (var(--text-secondary) 14–15px, 2-line clamp).
      - Bottom: wrong form(s) summary (small var(--text-muted) with strikethrough example) + star button (favorite toggle, aria-pressed).
      - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px.
    - States:
      - hover (pointer): translateY(-2px) + var(--shadow-card-hover); cursor pointer.
      - focus (keyboard): 2px var(--focus-ring) ring offset 2px.
      - selected: 2px var(--accent-mint) ring + var(--accent-mint-soft) left accent bar.
    - Roving tabindex: active card tabbable; ArrowUp/Down/Left/Right move; Home/End first/last; Enter/Space open detail; "f" toggle favorite.
    - aria: list role="list"; card aria-label = "{correct} — {type}"; star is a real stateful button.
    - empty_state: no results → "'{query}'에 해당하는 사례가 없어요" + clear; empty favorites → "별을 눌러 자주 보는 사례를 저장하세요"; empty recent → "최근 본 사례가 여기에 모여요".
  </case_list>

  <case_detail>
    - Placement: a FULL-WIDTH panel rendered below the selector (search + tabs + card list), shown only once a case is selected. Single column, stacked on all breakpoints.
    - Panel surface: var(--surface), radius var(--radius-xxl), padding 24px (16px on mobile), 1px var(--hairline), shadow --shadow-card.
    - Deselect affordance: X button (lg:hidden — mobile) to clear the selection; Esc also clears.
    - Content (top → bottom):
      1. Title row: large ○ CORRECT form (headline 28px **var(--color-success)** / 600) + type badge.
      2. Wrong forms (if multiple): stacked small pills, each marked ✗ with **var(--color-danger)** + **text-decoration:line-through**.
      3. Rule: body 16px/1.55 var(--text-secondary), clear and concise explanation.
      4. Examples section: header "예시"/"Examples" eyebrow, then list of example_pair components:
         - Each pair is two sentences: 
           - ○ Correct: var(--color-success) text, normal styling
           - ✗ Wrong: var(--color-danger) text, **text-decoration:line-through**, reduced contrast (optional: lighter opacity 0.6 or grayed)
      5. Related (related, if any): related_chips — click to select that case; unknown slugs hidden.
    - Empty/initial (not selected): hint card — "사례를 선택하면 정답과 오답이 명확하게 표시됩니다." + if recents exist, nudge to re-view.
  </case_detail>

  <keyboard_shortcuts_reference>
    - "/" → search input focus (when not typing in a field).
    - Arrow keys → list card focus move (roving tabindex); Home/End → first/last.
    - Enter / Space → open focused case detail.
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search if non-empty, else close mobile detail sheet.
    - Disabled on touch; all actions reachable via tap.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-spelling-cases.mjs">
    - Scan content/spelling-cases/cases/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file frontmatter → zod CaseFileFront validate.
    - mergePair: apply canonical rule (ko type + en inherit if absent; locale content independent). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields, slug uniqueness, related references exist.
    - Sort (type order → slug), emit spelling-cases.generated.json. Deterministic (no Date/random).
    - package.json wire: "predev": "node scripts/generate-spelling-cases.mjs", "prebuild": "node scripts/generate-spelling-cases.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allCases(): MergedCase[] (generation order). byId(slug), byType(type). types(): live type ids in catalog.
    - Tests assert catalog uniqueness, related integrity, locale completeness.
  </catalog_access>
  <search>
    - filterCases(cases, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.correct, en.correct, ko.wrong[], en.wrong[], ko.rule, en.rule, ko.examples.correct, en.examples.correct. Stable order.
    - Compose with type tab: list = filterCases(active-type subset, query). Favorites/Recent tabs filter their own ordered subsets.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(slugs, catalog): drop slugs not in current catalog (run on load).
    - Recent push: when detail opens (select). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useSpellingCatalog>
    - Mount: dynamic catalog import; read `jurepi-spelling-cases` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, selectedSlug + select(slug), toggleFavorite, favorites, recents, lastType, copy(text).
  </persistence_adapter>
  <i18n>All UI chrome from tools.spelling-cases.* (ko/en): tabs, type labels, search, lang toggle, toasts, empty states, how-to, FAQ. Case correct/wrong/rule/examples come from markdown (spelling-cases.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Orphan files (pair-less) are warned but minimum 1 violation triggers strict failure (configurable, default strict).
  </build_time>
  <search_no_results>Friendly empty state echoing query + "clear search" button; detail retains last selection or empty hint.</search_no_results>
  <storage>
    <unavailable>Private mode/disabled → recents/favorites in-memory, no scary error. List/search/detail fully work.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (favorites/recents not precious, no throw).</corrupt_blob>
    <quota>setItem throw → keep in-memory; no user error.</quota>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <color_contrast_critical>
    - CORRECT form: **var(--color-success)** text (NOT success-soft, NOT success-ink alone; use success with 600+ weight for high contrast). Default label "○" prefix.
    - WRONG form(s): **var(--color-danger)** text + **text-decoration: line-through** (strikethrough). Default label "✗" prefix. Card shows danger-soft tinted background for wrong-form snippet if space permits.
    - This contrast is the defining feature of the tool — a user should see "green = right, red strikethrough = wrong" in 1 second. Never use neutral colors for wrong; never omit strikethrough.
  </color_contrast_critical>
  <accent_usage>
    - Category accent is MINT (var(--accent-mint) / var(--accent-mint-soft)) — "text" category identity per DESIGN. Intro icon tile, card selected bar, favorite star (filled).
    - CTAs (primary buttons) stay brand honey-gold var(--brand) (tab active). Accent = identity, not action (DESIGN do/don't).
  </accent_usage>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius --radius-xxl, card radius --radius-lg; example row alternating var(--surface-muted) for readability. Soft brand-tinted shadows, hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); correct form headline (card 18–20px / detail 28px)/600; rule Pretendard 15–16px/1.55; example sentences body 15px; wrong form strikethrough. Eyebrow labels and type badges caption.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail cross-fade 150ms on selection. All gated by prefers-reduced-motion (instant fade, no transform).</motion>
  <accessibility>Card/star/link = labeled real buttons; roving-tabindex list; favorite/select status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); example pairs announced clearly by screen reader (○/✗ labels audible). AA contrast: correct success-ink on light surface, danger-ink on light surface (both meet AA). Detail text readable at 2x zoom (responsive font sizing).</accessibility>
  <responsive>
    - All breakpoints: single column — selector (search + tabs + card grid) on top, full-width detail section below when a case is selected. Card grid: 1-col <768px, 2-col ≥768px.
    - No overflow at 320px. Strikethrough and success/danger colors remain visible and usable on small screens.
  </responsive>
  <atmosphere>Bright, decisive "spelling referee": the ○/✗ contrast is visual, instant, and absolute — no hedging, no "it depends." Generous card spacing, success/danger accent used sparingly and purposefully. Example sentences side-by-side (or stacked on mobile) make the rule memorable through contrast. Not a dense reference table; inviting cards help users explore beyond their original question.</atmosphere>
  <icons>lucide-react: Search (search), Star/StarOff (favorite), Copy (copy), X (clear/close), CheckCircle (correct ○), XCircle or AlertCircle (wrong ✗). Default 20px, stroke 1.75, currentColor. Registry card icon: `SpellCheck`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Correct/wrong/rule/examples render as text nodes (React escape). dangerouslySetInnerHTML forbidden. Markdown body (MVP extend-section) plain-text para only — rich HTML/script banned.
    - Generator validates frontmatter with zod (type/required/length). Unknown fields ignored.
  </input>
  <clipboard>User-initiated strings only (case correct/rule); never read clipboard; user-gesture handler only.</clipboard>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes case data. How-to/FAQ state plainly.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness so no malformed entry ships.</content_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-search friction. Unknown slugs auto-pruned.</favorites_recents>
  <related_navigation>related chips navigate between cases — explore the spelling landscape. Dangling refs filtered at build.</related_navigation>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite, Esc — mouse-free power.</keyboard_first>
  <structured_data>DefinedTermSet + each case as a DefinedTerm (or HowTo) JSON-LD — search engine recognizes reference (discoverability = DESIGN principle ③).</structured_data>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → list auto-compose</description>
    <steps>
      1. dwe-doe.md + dwe-doe_en.md exist in content/spelling-cases/cases/.
      2. pnpm dev (or build) → predev generator runs → spelling-cases.generated.json has merged record (ko/en correct/wrong/rule/examples).
      3. Visit /ko/tools/spelling-cases → list renders "돼" card (success green) with "되" wrong note (danger strikethrough).
      4. Add new pair an-anh(.md/_en.md), rebuild → list auto-updates (no code edit).
      5. English-only or Korean-only case → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, type filter, empty states</description>
    <steps>
      1. Type "돼" in search → list narrows; result count updates; aria-live announces.
      2. Clear, click "띄어쓰기" (spacing) type → spacing cases only.
      3. Type "asdfqwer" → empty "'asdfqwer'에 해당하는 사례가 없어요" + clear; clear restores.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Detail — correct vs. wrong visual contrast + examples</description>
    <steps>
      1. Click "돼" card → detail opens: large ○ "돼" in success/green, then ✗ "되" in danger/red strikethrough.
      2. Rule displays: clear explanation. Example pairs follow: ○ "안 돼요." (success, normal) vs ✗ "안 되요." (danger, strikethrough).
      3. Screen reader announces: "Correct: 돼. Wrong: 되 strikethrough. Example: correct sentence, wrong sentence."
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Favorites, recent, persistence, keyboard, a11y</description>
    <steps>
      1. Open 2 different cases → "최근" tab lists them MRU.
      2. Star a card (or "f" focused) → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload → favorites/recents persist (localStorage); unknown slugs pruned.
      4. "/" → search focus; arrow navigate cards; Enter open detail; axe pass → no violations, cards labeled, focus ring visible.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD), locale swap</description>
    <steps>
      1. Switch to /en → chrome (tabs/search/how-to) English; card 1st label English correct form.
      2. Build prod → /ko/tools/spelling-cases and /en/tools/spelling-cases unique title/description/canonical/hreflang/OG.
      3. HTML has SoftwareApplication + FAQPage + DefinedTermSet (each case) JSON-LD; how-to/FAQ localized; case dataset code-split chunk (not global i18n).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<case>.md` + `<case>_en.md` pair in content folder, rebuild, auto-reflect in list/search/detail with zero code change; generator validates pair/field/uniqueness/reference, fails build with clear message on violation.</content_model>
  <functionality>Searchable, type-filterable card list (both locales); detail emphasizes correct ○ (success/green) vs. wrong ✗ (danger/red strikethrough) with rule + examples; related navigation; localStorage favorites + recent (prune unknown, work when absent); seed spelling ≥3 + spacing ≥3 + notation ≥2 + loanword ≥2.</functionality>
  <visual_contrast>CRITICAL: correct form rendered in var(--color-success) with no ambiguity; wrong form(s) rendered in var(--color-danger) with text-decoration:line-through. A user scanning the detail view sees "green = right, red strikethrough = wrong" in ≤1 second. No neutral or subtle colors for the contrast.</visual_contrast>
  <user_experience>Search/filter instant; cards feel readable; ≥44px targets; visible focus; SPA — no route reload on any interaction. Correct vs. wrong is the hero of the interface, not an afterthought.</user_experience>
  <technical_quality>lib/spelling-cases/* pure ≥80% unit coverage (schema/merge/slug/search/favorites); generator validation tests (pair-missing, dupe-slug, dangling-related, empty-field → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; mint identity + brand honey-gold CTA; success/danger tokens used as specified; text-node render only. No invented semantic-* tokens.</visual_design>
  <accessibility>Full keyboard (roving list, "/", Enter, "f", Esc); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA. ○/✗ labels accessible to screen readers.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected (ad height platform-reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-spelling-cases.mjs to freshen spelling-cases.generated.json. /[locale]/tools/spelling-cases pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" → not live until ready).</note>
  <generated_artifact>spelling-cases.generated.json: (a) .gitignore and always regenerate via predev/prebuild, OR (b) commit for reproducibility + CI checks "is generated artifact up-to-date?" (recommended: commit, deterministic generator, diff shows content change review).</generated_artifact>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'text' category + 'mint' accent already exist; no ToolCategory change needed.
    {
      id: 'spelling-cases',
      slug: 'spelling-cases',
      category: 'text',
      icon: 'SpellCheck',            // lucide-react
      accent: 'mint',
      status: 'coming_soon',         // Change to 'live' when complete
      isNew: true,
      order: 11,                     // After new-word (order 10), tune as desired
      keywords: ['맞춤법','띄어쓰기','발음·표기','외래어','표기','국어','사례','됨','돼','안','않','왠지','웬','로서','로써','각','갹','낫다','낳다','났다','결재','결제','며칠','몇일','뵈요','봬요','정확한 한글','Korean spelling','usage cases','grammar','native speaker','common mistakes','spelling confusion'],
    },
    ```
    Also add slug→component branch (<SpellingCases/>) and generateMetadata branch in tool route alongside ladder/qna-a-day/new-word. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate → spelling-cases.generated.json. Entire tool depends on this. Validation failure = build fail.
    2. Pair/canonical-merge rule (ko type canonical, en inherit) + slug uniqueness + related referential integrity.
    3. Search (both locales, diacritic/case-ignore) + type compose.
    4. Visual contrast (correct success, wrong danger strikethrough) — core UX, must implement first in detail component.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/spelling-cases/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema, slug derivation/uniqueness, canonical merge, search match, MRU/favorite immutable ops, pruneUnknown.
    2. scripts/generate-spelling-cases.mjs + content/spelling-cases/{_TEMPLATE,_TEMPLATE_en,README} + cases/ seed (돼vs되, 안vs않, 띄어쓰기 3+, 외래어 2+). Generator validation tests (pair-missing, dupe-slug, dangling, empty → fail). predev/prebuild wire.
    3. tools.spelling-cases.* messages (ko/en): tabs, type labels, search, toasts, empty states, how-to, FAQ.
    4. useSpellingCatalog hook (dynamic import + localStorage favorites/recents + in-memory fallback + copy adapter).
    5. CaseSearch + TypeTabs + CaseList/CaseCard (roving tabindex, states) + empty states.
    6. CaseDetail: **FIRST implement visual contrast (correct success, wrong danger strikethrough) and ExamplePair component** — this is the unique value. Then add rule text, related chips, etc.
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus).
    8. SpellingIntro/HowTo/Faq + SoftwareApplication + FAQPage + DefinedTermSet JSON-LD via platform lib/seo.ts.
    9. Registry status→coming_soon (or live); slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes + verify success/danger colors render correctly.
  </recommended_implementation_order>
  <seed_cases note="initial content — author fine-tunes but start with these slug/type">
    - spelling: dwe-doe (돼 vs 되, incorrect past-tense negation), an-anh (안 vs 않, negation particle), gak-gakk (각 vs 갹, counter), nat-nah-nat (낫다 vs 낳다 vs 났다, homophone confusion).
    - spacing: logeo-losseo (로서 vs 로써, preposition/instrumental), deun-ji-deon-ji (든지 vs 던지, conditional). 
    - notation: wen-ji-wangi (왠지 vs 웬, colloquial / formal).
    - loanword: loanword-01 (외래어 표기법 사례 1), loanword-02.
  </seed_cases>
  <generator_sketch>
    ```javascript
    // scripts/generate-spelling-cases.mjs (outline) — deterministic, no Date/random
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) cases/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod CaseFileFront.parse (collect errors)
    // 3) mergePair(ko, en): canonical rule, resolveSlug
    // 4) validate: pair-integrity / required-fields / type-valid / related-exist → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(spelling-cases.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/favorites); generator validation fixtures (pair-missing/dupe/dangling cases); component catalog-injected mocks; E2E scenarios 1–5 (esp. #3 visual contrast verification); clipboard/localStorage jsdom-isolated.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, verify success/danger colors render correctly (not semantic-* pantone misstakes), no overflow, example pair sentences readable, ○/✗ labels clear. Generator real-fail cases (pair-missing, empty-field). JSON-LD primed HTML.</tool_usage>
</key_implementation_notes>

</project_specification>
```

1089 lines, English, final.
