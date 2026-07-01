# New Word — Glossary of Trendy Terms and Slang — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **New Word** (신조어 / 트렌드 용어사전) — a bilingual glossary of MZ slang and modern tech terms (바이브 코딩, 루프 엔지니어링, 갓생, 억까, etc.) stored as markdown pairs and auto-compiled into a searchable, interactive term dictionary. Content is managed as markdown file pairs (`<term>.md` + `<term>_en.md`), and at build time a generator reads the folder, validates, and emits a static catalog. The tool mounts as a client-side SPA offering search, category tabs, favorites/recents, bilingual toggles, and related-term navigation.
> Internal service codename: `new-word`. Registry id: `new-word`. Public URL slug: `/[locale]/tools/new-word`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/special-symbol/SPEC.md`](../special-symbol/SPEC.md)

```xml
<project_specification>

<project_name>New Word — Glossary of Trendy Terms and Slang (Jurepi tool, codename new-word, registry id new-word)</project_name>

<overview>
New Word brings together trendy language in one place — terms that appear and disappear quickly in everyday speech. MZ slang (갓생, 억까, 알잘딱깔센, 스불재, 완내스, 킹받다, …) and modern tech terms (바이브 코딩, 루프 엔지니어링, 프롬프트 엔지니어링, AI 에이전트, …) are presented **bilingual — Korean and English side by side** with meaning, usage examples, and etymology. A user types one word in the search box or taps a topic tab (MZ / Tech) to instantly find a term, opens the card, and reads the Korean definition and English definition together. The tool solves two problems at once: "What does this word mean?" and "How do I say this in English?"

The tool's content model is fundamental: terms are NOT code — they are **markdown files**. Create a pair of files in the content folder (`<term>.md` for Korean + `<term>_en.md` for English), and at **build time** a generator scans the folder, parses the frontmatter, validates it, and bakes it into a static, code-split catalog (terms.generated.json). The tool then dynamically imports that catalog to render the list, search, and detail views. This means "drop a file in the folder and it appears in the list" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The term catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + recent views + last active topic tab), and nothing is ever sent over the network.

CRITICAL (content model, invariants): every term MUST have a Korean file and an English file as a matching pair (one file only = build warning then exclusion). Each file must carry a non-empty `term`, `definition`, and at least 1 `example`. Structural metadata like `topic`/`tags`/`related`/`slug` is **canonical in the Korean file**; the English file inherits these if absent. The build generator validates (1) pair integrity (2) required fields per locale (3) slug uniqueness (4) `related` references point to real slugs, and **fails the build with a clear message** if ANY rule is broken (no silent omission).

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — topic switching, search, opening cards, language toggle, pinning favorites — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the list is visible at a glance, search is one keystroke away ("/"), and every term is reachable in under a second. The route is statically generated (SSG) for SEO/indexing; the interactive tool is a single client-component island on that static shell.
</overview>

<platform_integration>
  - Route: /[locale]/tools/new-word (SSG; registry slug "new-word", id "new-word", status "live", accent "mint", category "text").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.new-word.*` (UI chrome strings: tabs, search, how-to, FAQ — NOT term content; that comes from markdown in terms.generated.json); the in_content AdSlot below the tool.
  - Platform dependency (SMALL — NO new category needed): the `'text'` category already exists in `ToolCategory` with the `mint` accent and the "텍스트"/"Text" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch. Contrast with qna-a-day (which introduced a new category).
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed term catalog (pairs: `<term>.md` + `<term>_en.md`) in `content/new-word/terms/`.
    - Build-time generator: folder scan → frontmatter parse → validation → code-split static catalog (terms.generated.json). Wired to `prebuild`/`predev`.
    - Two seed topics and initial terms: **MZ** (갓생, 억까, 알잘딱깔센, 스불재, 완내스, 킹받다, …) and **Tech** (바이브 코딩, 루프 엔지니어링, 프롬프트 엔지니어링, AI 에이전트, …). Minimum 6+ terms per topic.
    - **Term dictionary templates**: annotated markdown templates (`content/new-word/_TEMPLATE.md`, `content/new-word/_TEMPLATE_en.md`) and authoring README to make adding new terms easy.
    - Bilingual indicator: in the list card, primary label in the current locale with the other language as a subtitle; in detail view, show Korean and English definitions side-by-side (+ language toggle).
    - Search: term name, aliases, definition, tags across BOTH locales, real-time filter (debounced). Case and diacritic insensitive.
    - Topic tabs/pills: "All" / "MZ" / "Tech" (+ "Favorites" when pinned, "Recent" when viewed). Virtual tabs shown as applicable.
    - Detail view: large term name, pronunciation (if any), aliases, Ko/En definition, examples (per locale), etymology/appearance date (optional), related-term chips (clickable to navigate), tags, "copy term" and "copy definition" buttons.
    - Favorites (pinned) + recent views — localStorage persistence, auto-prune of unknown slugs.
    - Full keyboard support: "/" search focus, arrow keys list navigation, Enter to open, Esc to clear/close.
    - Tool-specific SEO long-form ("What is new slang?" / "MZ terms and tech terms") + FAQ (FAQPage JSON-LD) + **DefinedTermSet/DefinedTerm JSON-LD** (schema.org type for glossaries), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - User browser-based term add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - Per-term deep-link URLs (e.g., /tools/new-word/vibe-coding) — MVP is a single route + client state. (Phase 2 candidate.)
    - Auto-translation / AI definition generation (content is human-authored markdown).
    - Rich HTML/script in markdown body. Definitions are structured fields (plain text / limited inline emphasis), rendered safely.
  </out_of_scope>
  <future_considerations>
    - Per-term static deep-link routes + individual DefinedTerm pages (SEO) — Phase 2.
    - Korean initial-consonant search ("ㄱㅅ" → "갓생") — Phase 2.
    - Topic expansion: internet, business, game, finance, etc. — Phase 2 (catalog only, schema unchanged).
    - "Term of the Day" random card / share image — Phase 3.
    - User suggestions (term submissions) form → repository issue/PR link — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Terms live as markdown pairs in `content/new-word/terms/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). No separate markdown renderer needed — definitions/examples are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged term-record invariants. Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/new-word/data/terms.generated.json), dynamically imported only on this tool's route so ko+en content never enters the global i18n message bundle (protects platform JS budget — same pattern as special-symbol/qna-a-day).</catalog>
    <clipboard>"Copy term" / "Copy definition" use navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail if neither works (copy is a secondary feature for a reference tool; never show false success toast). Platform clipboard lesson respected.</clipboard>
    <animation>Native CSS transitions only (card hover lift, detail cross-fade, mobile sheet slide). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<content_authoring_model>
  <directory>
    content/new-word/
    ├── _TEMPLATE.md            # New-term Korean template (annotated; generator excludes "_" prefix)
    ├── _TEMPLATE_en.md         # New-term English template
    ├── README.md               # Authoring guide (naming, required fields, topic list)
    └── terms/
        ├── vibe-coding.md          # Korean canonical (structural metadata canonical)
        ├── vibe-coding_en.md       # English
        ├── loop-engineering.md
        ├── loop-engineering_en.md
        ├── god-saeng.md            # 갓생
        ├── god-saeng_en.md
        └── …
  </directory>
  <pairing note="pair rule">
    - File name base (minus `_en` suffix) is the **pair key**. `vibe-coding.md` (ko) ↔ `vibe-coding_en.md` (en).
    - Files starting with `_` are ignored by the generator (_TEMPLATE, etc.).
    - Missing pair (English-only or Korean-only) → build warning + term excluded (canonical-pair policy is CRITICAL). ASCII file names preferred (URL/slug stability); Korean names also supported if frontmatter `slug` (ASCII) is present and mandatory.
  </pairing>
  <slug note="identifier">
    - `slug` = value from Korean file frontmatter `slug` (if present), else base file name slugified. Used by `related`, favorites, recents. Must be unique in the catalog (test/generator validated).
  </slug>
  <shared_metadata note="canonical rule">
    - Structural metadata (`topic`, `tags`, `related`, `slug`, `coinedYear`) is **canonical in the Korean file**. English file inherits if omitted, must match if present (validation enforces).
    - Locale-specific content (`term`, `reading`, `aliases`, `definition`, `examples`, `origin`) is independent per file.
  </shared_metadata>
  <template_ko>
    ```markdown
    ---
    # ── required ──
    term: 바이브 코딩            # Display term name (Korean)
    slug: vibe-coding           # ASCII stable identifier (Korean file canonical). Related/favorites/recents reference this.
    topic: tech                 # Topic: mz | tech (Phase 2: internet | business | culture …)
    definition: |               # 1–3 sentences, plain text
      AI에게 자연어로 원하는 바를 설명하고, 코드를 한 줄씩 읽기보다
      '느낌(vibe)'대로 받아들이며 소프트웨어를 만드는 방식.
    examples:                   # Minimum 1
      - "요즘은 바이브 코딩으로 주말 프로젝트를 하루 만에 만든다."
      - "바이브 코딩은 빠르지만, 프로덕션에선 검증이 필요하다."
    # ── optional ──
    reading: 바이브 코딩         # Pronunciation/reading aid (optional)
    aliases: [바이브코딩, 바코]  # Search aliases (optional)
    tags: [AI, 개발, 트렌드]     # Filter/display tags (optional)
    origin: 2025년 개발자 커뮤니티에서 확산된 표현.  # Etymology (optional)
    coinedYear: 2025            # Appearance date (optional)
    related: [loop-engineering, prompt-engineering]  # Related term slugs (optional)
    ---

    <!-- (Optional) Extended explanation. MVP renders only paragraph-level plain text.
         Rich HTML/script forbidden. -->
    ```
  </template_ko>
  <template_en>
    ```markdown
    ---
    # ── required ──
    term: Vibe Coding
    definition: |
      Building software by describing intent to an AI in natural language and
      accepting the output by "vibe" instead of reading every line.
    examples:
      - "I vibe-coded the whole weekend project in a day."
      - "Vibe coding is fast, but production still needs review."
    # ── optional (structural meta inherits from Korean file if omitted) ──
    reading: /vaɪb ˈkoʊdɪŋ/
    aliases: [vibe-coding]
    origin: Popularized in developer communities in 2025.
    ---
    ```
  </template_en>
</content_authoring_model>

<file_structure>
scripts/
└── generate-glossary.mjs                 # Build time: scan content/new-word/terms/* → parse → validate → emit terms.generated.json. Wired to prebuild/predev.
content/new-word/                          # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md          # Templates (excluded by generator)
├── README.md                              # Authoring guide
└── terms/*.md  *_en.md                    # Term pairs
src/
├── lib/new-word/                          # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: TermFileFront(ko/en), MergedTerm, StoreSchema + STORE_VERSION; safeparse helpers
│   ├── merge.ts                           # mergePair(koFront, enFront): apply canonical rule → MergedTerm; validatePair(warn/error collect)
│   ├── slug.ts                            # slugify(name), resolveSlug(front, filename)
│   ├── catalog.ts                         # Typed access: allTerms, byId, byTopic, topics(); related referential integrity check
│   ├── search.ts                          # filterTerms(terms, query, locale): term+aliases+definition+tags, both locales; normalize (case/diacritics)
│   └── favorites.ts                       # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(slugs, catalog)
├── components/tools/new-word/
│   ├── NewWord.tsx                        # Orchestrator (Client Component) — topic/query/selected state + useGlossary() owner
│   ├── useGlossary.ts                     # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── TopicTabs.tsx                      # All / MZ / Tech / (Favorites) / (Recent) pills (tablist)
│   ├── TermSearch.tsx                     # Search input ("/" focus, clear, result count, aria)
│   ├── TermList.tsx                       # Responsive card list/grid; roving tabindex keyboard nav
│   ├── TermCard.tsx                       # One-term card: term name (locale 1st + other-lang subtitle), brief def, topic accent, tags, star
│   ├── TermDetail.tsx                     # Selected term: large name, reading, Ko/En definition (+lang toggle), examples, etymology, related chips, copy
│   ├── RelatedChips.tsx                   # related slug → click to select that term
│   ├── NewWordIntro.tsx                   # H1 + lead (SEO; server-render where possible)
│   ├── NewWordHowTo.tsx                   # "What is new slang?" / "MZ and tech terms" (SEO long-form)
│   ├── NewWordFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── data/
│       └── terms.generated.json          # Generated artifact (gitignore OR commit; see build_output) — [MergedTerm...]
└── i18n/messages/{ko,en}.json             # tools.new-word.* UI chrome (tabs, search, toasts, lang toggle, how-to, FAQ) — NOT term content
</file_structure>

<core_data_entities>
  <term_file_front note="individual markdown file frontmatter (parse unit)">
    - term: string (required, non-empty) — display term name (that locale)
    - definition: string (required, non-empty, plain text, recommend ≤ 400 chars)
    - examples: string[] (required, ≥ 1, each non-empty)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - topic?: enum (mz, tech) — Korean file canonical; Phase 2 extensible
    - reading?: string
    - aliases?: string[]
    - tags?: string[]
    - origin?: string
    - coinedYear?: number
    - related?: string[] — other term slugs
    INVARIANT: term/definition non-empty, examples ≥ 1. zod parse failure → collect as error (build failure candidate).
  </term_file_front>
  <merged_term note="ko+en merge result; catalog record; terms.generated.json item">
    - slug: string — unique identifier in catalog (unique; favorites/recents/related reference)
    - topic: enum (mz, tech) — Korean file canonical
    - tags: string[] — Korean file canonical ([] if absent)
    - coinedYear?: number
    - related: string[] — canonical; only real slugs in catalog (build validates, missing → error)
    - ko: { term, definition, examples, reading?, aliases?, origin? }
    - en: { term, definition, examples, reading?, aliases?, origin? }
    INVARIANT — PAIR/FIELDS/UNIQUENESS/REFERENCE: every record has both ko+en; each locale's term/definition/≥1 example filled; slug unique; related points to real slugs. Violation → generator build failure (not silent omission, explicit error + file/field report).
  </merged_term>
  <topic note="grouping by theme; localized label from i18n">
    - id: enum (mz, tech). Display order: mz → tech (Phase 2 adds more).
    - Label: tools.new-word.topics.<id> (ko: "MZ 용어"/"기술 용어", en: "MZ Slang"/"Tech Terms").
    - Virtual tabs (not real topics): "all" (everything), "favorites" (pinned), "recent" (MRU) — shown in tab row when applicable.
  </topic>
  <glossary_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — term slugs, insertion order
    - recents: string[] — term slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastTopic?: string; lastLang?: 'ko' | 'en' | 'both'; createdAt: number }
    localStorage key: `jurepi-new-word`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown slugs pruned on load (catalog change never leaves dangling ids).
  </glossary_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; CARD_DEF_CLAMP = 2 lines; TOAST_MS = 1600ms.
  </constants>
  <defaults>
    - New user: favorites/recents empty; active tab "all"; no term selected (detail shows empty hint); language display = current locale 1st + other-lang subtitle, detail = 'both'.
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/new-word" page="NewWord (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. Per-term deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <new_word>                    <!-- "use client"; owns topic + query + selectedSlug + lang state + useGlossary() -->
    <new_word_intro />          <!-- H1 + lead (server-render where possible) -->
    <glossary_layout>           <!-- Desktop 2-split (list | detail), mobile stacked + bottom-sheet -->
      <glossary_main>           <!-- Left/top column -->
        <term_search />         <!-- "/" focus, clear, result count -->
        <topic_tabs />          <!-- All / MZ / Tech / Favorites / Recent -->
        <term_list>             <!-- Roving tabindex cards -->
          <term_card />         <!-- × N: click = select (open detail); star = favorite -->
          <empty_state />       <!-- No search results / empty favorites / empty recents -->
        </term_list>
      </glossary_main>
      <term_detail>             <!-- Desktop: sticky right; mobile: bottom-sheet -->
        <related_chips />       <!-- related slug → click to navigate -->
      </term_detail>
    </glossary_layout>
    <new_word_how_to />         <!-- SEO long-form -->
    <new_word_faq />            <!-- FAQPage JSON-LD -->
  </new_word>
  <note>SPA within tool: tab/search/select/language toggle = local state switch, NOT route navigation. Detail panel same component docked (desktop) or bottom-sheet (mobile).</note>
</component_hierarchy>

<pages_and_interfaces>
  <new_word_intro>
    - Eyebrow: "텍스트 도구" / "TEXT TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "신조어 용어사전" / "New Word Glossary" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "요즘 유행하는 MZ 용어와 최신 기술 용어를 뜻·예문과 함께 한국어·영어로 찾아보세요." / English equivalent.
  </new_word_intro>

  <term_search>
    - DESIGN text-input style, main column full width, leading Search icon (lucide, 20px var(--text-muted)), placeholder "용어·뜻·태그로 검색 (예: 갓생, 바이브 코딩, AI)".
    - Focus on "/" keypress (when not already typing). Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption var(--text-muted), aria-live="polite".
    - aria: role="searchbox", aria-controls the list.
  </term_search>

  <topic_tabs>
    - Horizontal pill row (category-pill / category-pill-active). Order: "전체"(all) → "MZ" → "기술"(tech) → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary; hover lifts bg.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active. Narrow screens scroll horizontally + snap.
    - Compose with search: topic narrows set, search filters within it. "All" + empty search = full catalog.
  </topic_tabs>

  <term_list>
    - Responsive grid: ≥1024px + detail 2-split = 1-column list or 2-column; 768–1023px 2-column; <768px 1-column.
    - Each card (term_card):
      - Top: term name 1st (current locale, headline 18–20px var(--text)/700) + other-lang subtitle (14px var(--text-muted)). E.g., ko locale → "갓생" / "god life (productive life)".
      - Top-right: topic badge (small pill, topic-tinted) + star button (favorite toggle, aria-pressed).
      - Body: definition 2-line clamp (var(--text-secondary) 14–15px).
      - Bottom: tags (up to 3, surface-muted chips).
      - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px.
    - States:
      - hover (pointer): translateY(-2px) + var(--shadow-card-hover); cursor pointer.
      - focus (keyboard): 2px var(--focus-ring) ring offset 2px.
      - selected: 2px var(--accent-mint) ring + var(--accent-mint-soft) left accent bar.
    - Roving tabindex: active card tabbable; ArrowUp/Down/Left/Right move; Home/End first/last; Enter/Space open detail (bottom-sheet on mobile); "f" toggle favorite.
    - aria: list role="list"(or grid); card aria-label = "{term} — {topic}"; star is a real stateful button.
    - empty_state: no results → "'{query}'에 해당하는 용어가 없어요" + clear; empty favorites → "별을 눌러 자주 보는 용어를 저장하세요"; empty recent → "최근 본 용어가 여기에 모여요".
  </term_list>

  <term_detail>
    - Desktop (≥1024px): sticky right column, width 360px, var(--surface), radius var(--radius-xxl) 28px, padding 24px, shadow --shadow-card, sticks below breadcrumb.
    - Tablet (768–1023px): below list as full-width card or ~320px dock.
    - Mobile (<768px): slides-up bottom-sheet on selection; grab handle + close; backdrop dim rgba(30,27,58,0.4).
    - Content (top → bottom):
      1. Term name: large headline 28px var(--text) (current-lang toggle basis). Reading beside (caption var(--text-muted)). Aliases as small gray chips.
      2. Meta row: topic badge + coinedYear(if any, "2025~") + tag chips + "copy term"/"copy definition" small buttons (success toast on copy; failure silent). 
      3. Language toggle: [Korean] [English] [Both] segment (default 'both' or last choice). 'Both' shows ko·en definitions vertically.
      4. Definition: body 16px/1.55 var(--text-secondary). When 'both', each block labeled eyebrow("한국어"/"English").
      5. Examples: stacked list (per locale), each var(--surface-muted) chip (radius --radius-md); term within example emphasized (var(--accent-mint)/600). Label "예시"/"Examples" eyebrow.
      6. Etymology (origin, if any): caption var(--text-muted) note, "유래"/"Origin" label.
      7. Related (related, if any): related_chips — click to select that term, unknown slugs hidden.
    - Empty/initial (not selected): hint card — "용어를 선택하면 뜻과 예문이 여기에 표시됩니다." + if recents exist, nudge to re-view.
  </term_detail>

  <keyboard_shortcuts_reference>
    - "/" → search input focus (when not typing in a field).
    - Arrow keys → list card focus move (roving tabindex); Home/End → first/last.
    - Enter / Space → open focused card detail.
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - "l" (detail open) → cycle language (ko → en → both).
    - Esc → clear search if non-empty, else close mobile detail sheet.
    - Disabled on touch; all actions reachable via tap.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-glossary.mjs">
    - Scan content/new-word/terms/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file frontmatter → zod TermFileFront validate.
    - mergePair: apply canonical rule (ko structural meta + en inherit if absent; locale content independent). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields, slug uniqueness, related references exist.
    - Sort (topic order → coinedYear desc → term locale order), emit terms.generated.json. Deterministic (no Date/random).
    - package.json wire: "predev": "node scripts/generate-glossary.mjs", "prebuild": "node scripts/generate-glossary.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allTerms(): MergedTerm[] (generation order). byId(slug), byTopic(topic). topics(): live topic ids in catalog.
    - Tests assert catalog uniqueness, related integrity, locale completeness.
  </catalog_access>
  <search>
    - filterTerms(terms, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.term, en.term, aliases(both), ko.definition, en.definition, tags. Stable order.
    - Compose with topic tab: list = filterTerms(active-tab subset, query). Favorites/Recent tabs filter their own ordered subsets.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(slugs, catalog): drop slugs not in current catalog (run on load).
    - Recent push: when detail opens (select). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useGlossary>
    - Mount: dynamic catalog import; read `jurepi-new-word` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, selectedSlug + select(slug), toggleFavorite, favorites, recents, lastTopic, lang + setLang, copy(text).
  </persistence_adapter>
  <i18n>All UI chrome from tools.new-word.* (ko/en): tabs, topic labels, search, lang toggle, toasts, empty states, how-to, FAQ. Term term/definition/examples/origin come from markdown (terms.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Orphan files (pair-less) are warned but minimum 1 violation triggers strict failure (configurable, default strict).
  </build_time>
  <search_no_results>Friendly empty state echoing query + "clear search" button; detail retains last selection or empty hint.</search_no_results>
  <copy_failure>Copy is secondary. clipboard → execCommand fail → silent (no false success toast). Success toast only on real success.</copy_failure>
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
  <accent_usage>
    - Category accent is MINT (var(--accent-mint) / var(--accent-mint-soft)) — "text" category identity per DESIGN. Intro icon tile, card selected bar, related chips, favorite star (filled).
    - CTAs (primary buttons) stay brand honey-gold var(--brand) (tab active). Accent = identity, not action (DESIGN do/don't).
    - Topic badge color: mz and tech distinguish visually but within mint identity (e.g., mz = var(--accent-mint) tint, tech = var(--accent-sky) tint badge — card badge only; tool-wide accent stays mint). AA contrast.
  </accent_usage>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius --radius-xxl, card radius --radius-lg; example/tag chips var(--surface-muted). Soft brand-tinted shadows, hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); term name headline (card 18–20px / detail 28px)/700; definition Pretendard 15–16px/1.55; reading/origin/tags caption/eyebrow. Example term emphasis 600.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail cross-fade 150ms, mobile sheet slide-up (translateY) 250ms, star toggle pop (scale 1→1.15→1) 200ms. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (instant fade, no scale).</motion>
  <accessibility>Card/star/toggle = labeled real buttons; roving-tabindex list; copy/favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); language toggle segmented radio (aria). AA contrast: definition text var(--text-secondary) on bright surface (avoid mint-on-white for body text).</accessibility>
  <responsive>
    - ≥1024px: 2-split — main (search+tabs+list) flex:1, detail sticky 360px right.
    - 768–1023px: list 2-column; detail below or ~320px dock.
    - <768px: single column; detail bottom-sheet. Tabs scroll horiz + snap. No overflow (320 test).
  </responsive>
  <atmosphere>Bright, friendly "trendy-term dictionary": generous card spacing, one big term spotlit on the right. Not a dense table; inviting cards feel like Jurepi (warm, clear).</atmosphere>
  <icons>lucide-react: Search (search), Star/StarOff (favorite), Copy (copy), X (clear/close), Languages (language toggle), ArrowUpRight (related). Default 20px, stroke 1.75, currentColor. Registry card icon: `BookA`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Term/definition/examples/origin/tags render as text nodes (React escape). dangerouslySetInnerHTML forbidden. Markdown body (MVP extend-section) plain-text para only — rich HTML/script banned.
    - Generator validates frontmatter with zod (type/required/length). Unknown fields ignored.
  </input>
  <clipboard>User-initiated strings only (term/definition); never read clipboard; user-gesture handler only.</clipboard>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes copied content. how-to/FAQ state plainly.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness so no malformed entry ships.</content_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <bilingual_toggle>Detail Ko/En/Both segment — read term definitions side-by-side. "l" shortcut cycles. Last choice localStorage-remembered.</bilingual_toggle>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-search friction. Unknown slugs auto-pruned.</favorites_recents>
  <related_navigation>related chips navigate between terms — explore the glossary. Dangling refs filtered at build.</related_navigation>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite, "l" language — mouse-free power.</keyboard_first>
  <structured_data>DefinedTermSet + each term DefinedTerm JSON-LD (name, description, inDefinedTermSet) — search engine recognizes glossary (discoverability = DESIGN principle ③).</structured_data>
  <initial_consonant_search optional="true">Phase 2: Korean 초성 search ("ㄱㅅ" → "갓생") layered into filterTerms without signature change.</initial_consonant_search>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → list auto-compose</description>
    <steps>
      1. vibe-coding.md + vibe-coding_en.md exist in content/new-word/terms/.
      2. pnpm dev (or build) → predev generator runs → terms.generated.json has vibe-coding merged record (ko/en term·definition·examples).
      3. Visit /ko/tools/new-word → list renders "바이브 코딩" card (subtitle "Vibe Coding").
      4. Add new pair loop-engineering(.md/_en.md), rebuild → list auto-updates (no code edit).
      5. English-only or Korean-only term → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, topic filter, empty states</description>
    <steps>
      1. Type "갓생" in search → list narrows; result count updates; aria-live announces.
      2. Clear, click "기술" (tech) tab → tech terms only (바이브 코딩, 루프 엔지니어링, …).
      3. Type "AI" → tags/definition matching both locales.
      4. Type "asdfqwer" → empty "'asdfqwer'에 해당하는 용어가 없어요" + clear; clear restores.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Detail, Ko/En bilingual, related navigation</description>
    <steps>
      1. Click "바이브 코딩" card → detail opens: name, Korean definition, examples; pushed to recent.
      2. Toggle [Both] → Ko + En definitions side-by-side with labels.
      3. Click related chip "루프 엔지니어링" → detail switches to that term (list selection syncs).
      4. "Copy definition" → clipboard has definition text; success toast. (No clipboard → silent.)
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Favorites, recent, persistence, keyboard, a11y</description>
    <steps>
      1. Open 2 different terms → "최근" tab lists them MRU.
      2. Star a card (or "f" focused) → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload → favorites/recents persist (localStorage); unknown slugs pruned.
      4. "/" → search focus; arrow navigate cards; Enter open detail; axe pass → no violations, cards labeled, focus ring visible.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD), locale swap</description>
    <steps>
      1. Switch to /en → chrome (tabs/search/toggle/how-to/FAQ) English; card 1st label English term, subtitle Korean.
      2. Build prod → /ko/tools/new-word and /en/tools/new-word unique title/description/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage + DefinedTermSet (each term DefinedTerm) JSON-LD; how-to/FAQ localized; term dataset code-split chunk (not global i18n).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<term>.md` + `<term>_en.md` pair in content folder, rebuild, auto-reflect in list/search/detail with zero code change; generator validates pair/field/uniqueness/reference, fails build with clear message on violation.</content_model>
  <functionality>Searchable, topic-filterable card list (both locales); bilingual detail + language toggle (ko/en/both); related navigation; localStorage favorites + recent (prune unknown, work when absent); seed MZ ≥6 + tech ≥6 terms.</functionality>
  <user_experience>Search/filter instant; cards feel readable; ≥44px targets; visible focus; SPA — no route reload on any interaction.</user_experience>
  <technical_quality>lib/new-word/* pure ≥ 80% unit coverage (schema/merge/slug/search/favorites); generator validation tests (pair-missing, dupe-slug, dangling-related, empty-field → fail); TS 0 errors; &lt;800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; mint identity + brand honey-gold CTA; bright, friendly glossary (not dense table); text-node render only.</visual_design>
  <accessibility>Full keyboard (roving list, "/", Enter, "f", "l", Esc); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected (ad height platform-reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-glossary.mjs to freshen terms.generated.json. /[locale]/tools/new-word pre-rendered by platform generateStaticParams iterating registry (status "live"). Term catalog ships as code-split chunk on this route only.</note>
  <generated_artifact>terms.generated.json: (a) .gitignore and always regenerate via predev/prebuild, OR (b) commit for reproducibility + CI checks "is generated artifact up-to-date?" (recommended: commit, deterministic generator, diff shows content change review).</generated_artifact>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'text' category + 'mint' accent already exist; no ToolCategory change needed.
    {
      id: 'new-word',
      slug: 'new-word',
      category: 'text',
      icon: 'BookA',            // lucide-react
      accent: 'mint',
      status: 'live',           // 'coming_soon' until module complete
      isNew: true,
      order: 10,                // after special-symbol(9) etc., tune as desired
      keywords: ['신조어','유행어','MZ','밈','용어','용어사전','트렌드','바이브코딩','바이브 코딩','루프엔지니어링','갓생','억까','새로운 말','new word','slang','glossary','terms','vibe coding','trend','buzzword'],
    },
    ```
    Also add slug→component branch (&lt;NewWord/&gt;) and generateMetadata branch (title/description/JSON-LD) in tool route alongside ladder/qna-a-day. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate → terms.generated.json. Entire tool depends on this. Validation failure = build fail.
    2. Pair/canonical-merge rule (ko structural, en inherit) + slug uniqueness + related referential integrity.
    3. Search (both locales, diacritic/case-ignore) + topic compose.
    4. Bilingual detail toggle (ko/en/both) — core value prop.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/new-word/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema, slug derivation/uniqueness, canonical merge, search match, MRU/favorite immutable ops, pruneUnknown.
    2. scripts/generate-glossary.mjs + content/new-word/{_TEMPLATE,_TEMPLATE_en,README} + terms/ seed (바이브 코딩, 루프 엔지니어링, 갓생, 억까, 알잘딱깔센, 스불재, …). Generator validation tests (pair-missing, dupe-slug, dangling, empty → fail). predev/prebuild wire.
    3. tools.new-word.* messages (ko/en): tabs, topic labels, search, lang toggle, toasts, empty states, how-to, FAQ.
    4. useGlossary hook (dynamic import + localStorage favorites/recents + in-memory fallback + copy adapter).
    5. TermSearch + TopicTabs + TermList/TermCard (roving tabindex, states) + empty states.
    6. TermDetail (name/reading/lang-toggle/Ko-En def/examples/origin/related-chips/copy) — docked desktop, bottom-sheet mobile.
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus).
    8. NewWordIntro/HowTo/Faq + SoftwareApplication + FAQPage + DefinedTermSet/DefinedTerm JSON-LD via platform lib/seo.ts.
    9. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_terms note="initial content — author fine-tunes but start with these slug/topic">
    - tech: vibe-coding (바이브 코딩), loop-engineering (루프 엔지니어링), prompt-engineering (프롬프트 엔지니어링), ai-agent (AI 에이전트), context-window (컨텍스트 윈도우), rag (검색 증강 생성).
    - mz: god-saeng (갓생), eok-kka (억까), aljaldakkkalsen (알잘딱깔센), sbuljae (스불재), wannaes (완내스), king-batda (킹받다).
    - Example: loop-engineering — "AI 에이전트가 스스로 반복 루프를 돌며 작업을 계획·실행·검증하도록 설계·운영하는 기법." / en "Designing and operating AI agents so they iterate in autonomous loops to plan, act, and verify."
  </seed_terms>
  <generator_sketch>
    ```javascript
    // scripts/generate-glossary.mjs (outline) — deterministic, no Date/random
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) terms/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod TermFileFront.parse (collect errors)
    // 3) mergePair(ko, en): canonical rule, resolveSlug
    // 4) validate: pair-integrity / required-fields / slug-unique / related-exist → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(terms.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/favorites); generator validation fixtures (pair-missing/dupe/dangling cases); component catalog-injected mocks; E2E scenarios 1–5 (esp. #1 folder→list, #3 lang-toggle/related, #5 JSON-LD); clipboard/localStorage jsdom-isolated.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, bottom-sheet behavior, JSON-LD primed HTML, generator real-fail cases.</tool_usage>
</key_implementation_notes>

</project_specification>
```

