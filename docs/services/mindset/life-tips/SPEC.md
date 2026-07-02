# Life Tips — Everyday Life Know-How and Practical Facts — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Life Tips** (생활 상식 / 일상 생활 꿀팁) — a bilingual collection of practical, bite-sized know-how for navigating everyday life challenges: laundry & stain removal, food storage & expiration, emergency basics, budgeting & utilities, housing contracts, health & sleep, cleaning & organization, safety, administrative tips, seasonal care. Tips are authored as markdown pairs (`<tip>.md` + `<tip>_en.md`), and at build time a generator reads the folder, validates, and emits a static catalog. The tool mounts as a client-side SPA offering search, subcategory filters, favorites/recents, bilingual view, and related-tip navigation.
> Internal service codename: `life-tips`. Registry id: `life-tips`. Public URL slug: `/[locale]/tools/life-tips`. Part of the extensible **Honey Tips (꿀팁)** content series within the `mindset` (생활·마음) category; sibling tool with office-life-tips.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/mindset/office-life-tips/SPEC.md`](../office-life-tips/SPEC.md)

```xml
<project_specification>

<project_name>Life Tips — Practical Know-How for Everyday Living (Jurepi tool, codename life-tips, registry id life-tips)</project_name>

<overview>
Life Tips brings together practical, actionable advice for navigating everyday life — tips that solve real daily problems: how to remove tough stains from clothes, best practices for food storage and expiration safety, responding to common emergencies, cutting utility costs, understanding rental contracts, improving sleep quality, efficient cleaning & organization, home safety, handling administrative tasks, and seasonal care. Each tip is framed as "problem → solution → pro tips / gotchas" and authored **bilingual — Korean and English side by side** with a title, concrete scenario, actionable guidance, and related tip references. A user searches for a tip ("oil stain removal"), filters by subcategory (Household, Food, Health, Money & Admin), opens the card, and reads the bite-sized wisdom in Korean or English. The tool solves the problem: "How do I handle this everyday situation?" instantly, without needing to search multiple websites.

The tool's content model is fundamental: tips are NOT code — they are **markdown files**. Create a pair of files in the content folder (`<tip>.md` for Korean + `<tip>_en.md` for English), and at **build time** a generator scans the folder, parses the frontmatter, validates it, and bakes it into a static, code-split catalog (tips.generated.json). The tool then dynamically imports that catalog to render the list, search, and detail views. This means "drop a file in the folder and it appears in the list" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The tip catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + recent views + last active subcategory), and nothing is ever sent over the network.

CRITICAL (content model, invariants): every tip MUST have a Korean file and an English file as a matching pair (one file only = build warning then exclusion). Each file must carry a non-empty `title`, `situation`, `tip`, and at least 1 `example`. Structural metadata like `subcategory`/`tags`/`related` is **canonical in the Korean file**; the English file inherits these if absent. The build generator validates (1) pair integrity (2) required fields per locale (3) slug uniqueness (4) `related` references point to real slugs, and **fails the build with a clear message** if ANY rule is broken (no silent omission).

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — subcategory switching, search, opening cards, language toggle, pinning favorites — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the list is visible at a glance, search is one keystroke away ("/"), and every tip is reachable in under a second. The route is statically generated (SSG) for SEO/indexing; the interactive tool is a single client-component island on that static shell.
</overview>

<platform_integration>
  - Route: /[locale]/tools/life-tips (SSG; registry slug "life-tips", id "life-tips", status "coming_soon", accent "grape", category "mindset").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.life-tips.*` (UI chrome strings: tabs, search, how-to, FAQ — NOT tip content; that comes from markdown in tips.generated.json); the in_content AdSlot below the tool.
  - Platform dependency (EXISTING — no change): the `'mindset'` category already exists in ToolCategory with the `grape` accent and the "마음가짐"/"Mindset" label (introduced by office-life-tips/qna-a-day). The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch. No category infrastructure work needed.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed tip catalog (pairs: `<tip>.md` + `<tip>_en.md`) in `content/life-tips/tips/`.
    - Build-time generator: folder scan → frontmatter parse → validation → code-split static catalog (tips.generated.json). Wired to `prebuild`/`predev`.
    - Seven seed subcategories and 8+ seed tips per subcategory: **집안일·살림** (Household: laundry, stain removal, storage, organization), **음식·요리** (Food: expiration dates, storage, food safety, cooking basics), **건강·몸** (Health: sleep hygiene, common remedies, wellness, fitness basics), **돈·행정** (Money & Admin: budgeting, utilities, tax basics, contract fundamentals), **안전·응급** (Safety & Emergency: basic first aid, home safety, emergency prep), **계절·환경** (Seasonal & Environmental: seasonal care, weather prep, climate-specific tips), **기타 생활** (Miscellaneous Living: gardening, pet care, DIY basics, general life hacks). Minimum 6+ tips per subcategory.
    - **Tip dictionary templates**: annotated markdown templates (`content/life-tips/_TEMPLATE.md`, `content/life-tips/_TEMPLATE_en.md`) and authoring README to make adding new tips easy.
    - Bilingual indicator: in the list card, primary title in the current locale with the other language as a subtitle; in detail view, show Korean and English guidance side-by-side (+ language toggle).
    - Search: tip title, situation, tip body, tags, examples across BOTH locales, real-time filter (debounced). Case and diacritic insensitive.
    - Subcategory tabs/pills: "All" / "Household" / "Food" / "Health" / "Money & Admin" / "Safety" / "Seasonal" / "Miscellaneous" + "Favorites" (when pinned), "Recent" (when viewed). Virtual tabs shown as applicable.
    - Detail view: large tip title, situation (ko/en), the tip/guidance (ko/en), pro tips & gotchas bullets (ko/en), 1+ example, tags, related-tip chips (clickable), "copy tip" button.
    - Favorites (pinned) + recent views — localStorage persistence, auto-prune of unknown slugs.
    - Full keyboard support: "/" search focus, arrow keys list navigation, Enter to open, Esc to clear/close.
    - Tool-specific SEO long-form ("Practical everyday life tips", "How to handle common household problems") + FAQ (FAQPage JSON-LD) + **HowTo JSON-LD per tip** (schema.org type for how-to articles), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism, mindset category infrastructure (all platform).
    - User browser-based tip add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - Per-tip deep-link URLs (e.g., /tools/life-tips/stain-removal) — MVP is a single route + client state. (Phase 2 candidate.)
    - Auto-generated or AI-drafted tips. All content is human-authored.
    - Rich HTML/script in markdown body. Tips are structured fields (plain text / limited inline emphasis), rendered safely.
    - Expansion to non-everyday-life topics (e.g., professional skills, hobby tips). New Honey-Tip topics are separate services (Phase 2+).
  </out_of_scope>
  <future_considerations>
    - Per-tip static deep-link routes + individual HowTo pages (SEO) — Phase 2.
    - Subcategory expansion: pets, gardening, DIY home repair, vehicle care — Phase 2.
    - "Tip of the Day" card / random recommend — Phase 2.
    - User difficulty-rating (beginner/intermediate/advanced) filters — Phase 2.
    - Export tips as PDF / email digest — Phase 3.
    - New Honey-Tip topics (relationship, parenting, finance, health) as sibling services — Phase 2–3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Tips live as markdown pairs in `content/life-tips/tips/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). No separate markdown renderer needed — tip/situation/gotchas/examples are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged tip-record invariants. Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/life-tips/data/tips.generated.json), dynamically imported only on this tool's route so ko+en content never enters the global i18n message bundle (protects platform JS budget — same pattern as new-word/qna-a-day).</catalog>
    <clipboard>"Copy tip" uses navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail if neither works (copy is a secondary feature for a reference tool; never show false success toast). Platform clipboard lesson respected.</clipboard>
    <animation>Native CSS transitions only (card hover lift, detail cross-fade, mobile sheet slide). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<content_authoring_model>
  <directory>
    content/life-tips/
    ├── _TEMPLATE.md            # New-tip Korean template (annotated; generator excludes "_" prefix)
    ├── _TEMPLATE_en.md         # New-tip English template
    ├── README.md               # Authoring guide (naming, required fields, subcategory list)
    └── tips/
        ├── stain-removal.md              # Korean canonical
        ├── stain-removal_en.md           # English
        ├── food-storage-basics.md
        ├── food-storage-basics_en.md
        ├── sleep-hygiene-tips.md
        ├── sleep-hygiene-tips_en.md
        └── …
  </directory>
  <pairing note="pair rule">
    - File name base (minus `_en` suffix) is the **pair key**. `stain-removal.md` (ko) ↔ `stain-removal_en.md` (en).
    - Files starting with `_` are ignored by the generator (_TEMPLATE, etc.).
    - Missing pair (English-only or Korean-only) → build warning + tip excluded (canonical-pair policy is CRITICAL). ASCII file names required (URL/slug stability).
  </pairing>
  <slug note="identifier">
    - `slug` = value from Korean file frontmatter `slug` (if present), else base file name slugified. Used by `related`, favorites, recents. Must be unique in the catalog (test/generator validated).
  </slug>
  <shared_metadata note="canonical rule">
    - Structural metadata (`subcategory`, `tags`, `related`, `slug`, `difficulty`) is **canonical in the Korean file**. English file inherits if omitted, must match if present (validation enforces).
    - Locale-specific content (`title`, `situation`, `tip`, `gotchas`, `examples`) is independent per file.
  </shared_metadata>
  <template_ko>
    ```markdown
    ---
    # ── required ──
    title: 옷에서 기름 얼룩 제거하기       # Display tip title (Korean)
    slug: stain-removal-oil               # ASCII stable identifier (Korean file canonical)
    subcategory: household                # Subcategory: household | food | health | money-admin | safety | seasonal | miscellaneous
    situation: |                          # The everyday scenario (plain text, ≤200 chars)
      옷에 튀긴 식용유나 버터 자국이 남았을 때 어떻게 없앨까?
    tip: |                                # The guidance/solution (plain text, recommend ≤400 chars)
      찬물에 먼저 불린 후 중성 세제를 문질러 비비고, 따뜻한 물로 헹굼. 뜨거운 물은 단백질을 고착시키므로 피할 것.
    examples:                             # Minimum 1
      - "튀김을 한 직후 냅킨으로 톡톡 두드려 기름을 제거한 후, 중성 세제를 숟가락 한 스푼 물에 섞어 얼룩을 문질러 봅니다."
      - "30분 정도 찬물에 담가두면 섬유가 이완되어 세제가 더 잘 스며듭니다."
    # ── optional ──
    gotchas: |                            # Anti-patterns to avoid (plain text)
      - 뜨거운 물을 즉시 사용하기 (기름이 고착됨)
      - 세탁기에 그냥 넣기 (열이 얼룩을 더 고착시킴)
      - 표백제 사용 (흰옷 아닌 이상 색이 빠짐)
    tags: [세탁, 얼룩, 기름, 가정용, 살림]  # Keywords (optional)
    difficulty: beginner                  # Level: beginner | intermediate | advanced (optional)
    related: [fabric-care-basics, winter-coat-care]  # Related tip slugs (optional)
    ---
    ```
  </template_ko>
  <template_en>
    ```markdown
    ---
    # ── required ──
    title: Removing Oil Stains from Clothes
    situation: How do you remove cooking oil or butter stains from fabric?
    tip: Soak in cold water first, then rub neutral detergent into the stain, rinse with warm water. Avoid hot water initially, as it sets protein-based stains.
    examples:
      - "Blot with a napkin immediately after the spill. Mix one tablespoon of neutral detergent in cold water and gently rub the stain."
      - "Soak for 30 minutes in cold water to relax the fibers and let the detergent penetrate."
    # ── optional (structural meta inherits from Korean file if omitted) ──
    gotchas: |
      - Using hot water immediately (sets the stain)
      - Putting directly in the washer (heat worsens it)
      - Using bleach (fades color on most fabrics)
    ---
    ```
  </template_en>
</content_authoring_model>

<file_structure>
scripts/
└── generate-life-tips.mjs               # Build time: scan content/life-tips/tips/* → parse → validate → emit tips.generated.json. Wired to prebuild/predev.
content/life-tips/                        # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md         # Templates (excluded by generator)
├── README.md                             # Authoring guide
└── tips/*.md  *_en.md                    # Tip pairs
src/
├── lib/life-tips/                        # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                         # zod: TipFileFront(ko/en), MergedTip, StoreSchema + STORE_VERSION; safeparse helpers
│   ├── merge.ts                          # mergePair(koFront, enFront): apply canonical rule → MergedTip; validatePair(warn/error collect)
│   ├── slug.ts                           # slugify(name), resolveSlug(front, filename)
│   ├── catalog.ts                        # Typed access: allTips, byId, bySubcategory, subcategories(); related referential integrity check
│   ├── search.ts                         # filterTips(tips, query, locale): title+situation+tags+examples, both locales; normalize (case/diacritics)
│   └── favorites.ts                      # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(slugs, catalog)
├── components/tools/life-tips/
│   ├── LifeTips.tsx                      # Orchestrator (Client Component) — subcategory/query/selected state + useLifeTips() owner
│   ├── useLifeTips.ts                    # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── SubcategoryTabs.tsx               # All / Household / Food / Health / … / Favorites / Recent pills (tablist)
│   ├── TipSearch.tsx                     # Search input ("/" focus, clear, result count, aria)
│   ├── TipList.tsx                       # Responsive card list/grid; roving tabindex keyboard nav
│   ├── TipCard.tsx                       # One-tip card: title (locale 1st + other-lang subtitle), situation, subcategory accent, tags, star
│   ├── TipDetail.tsx                     # Selected tip: large title, situation (ko/en), tip/guidance (ko/en), gotchas, examples, related chips, copy
│   ├── RelatedChips.tsx                  # related slug → click to select that tip
│   ├── LifeTipsIntro.tsx                 # H1 + lead (SEO; server-render where possible)
│   ├── LifeTipsHowTo.tsx                 # "Practical everyday life tips" / "How to solve daily problems" (SEO long-form)
│   ├── LifeTipsFaq.tsx                   # Q&A + FAQPage JSON-LD
│   └── data/
│       └── tips.generated.json           # Generated artifact (gitignore OR commit; see build_output)
└── i18n/messages/{ko,en}.json            # tools.life-tips.* UI chrome (tabs, search, toasts, how-to, FAQ)
</file_structure>

<core_data_entities>
  <tip_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — display tip name (that locale)
    - situation: string (required, non-empty, plain text, recommend ≤ 200 chars)
    - tip: string (required, non-empty, plain text, recommend ≤ 400 chars)
    - examples: string[] (required, ≥ 1, each non-empty)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - subcategory?: enum (household, food, health, money-admin, safety, seasonal, miscellaneous) — Korean file canonical; Phase 2 extensible
    - tags?: string[]
    - gotchas?: string — anti-patterns to avoid (plain text)
    - difficulty?: enum (beginner, intermediate, advanced)
    - related?: string[] — other tip slugs
    INVARIANT: title/situation/tip non-empty, examples ≥ 1. zod parse failure → collect as error (build failure candidate).
  </tip_file_front>
  <merged_tip note="ko+en merge result; catalog record; tips.generated.json item">
    - slug: string — unique identifier in catalog (unique; favorites/recents/related reference)
    - subcategory: enum (household, food, health, money-admin, safety, seasonal, miscellaneous) — Korean file canonical
    - tags: string[] — Korean file canonical ([] if absent)
    - difficulty?: enum (beginner, intermediate, advanced)
    - related: string[] — canonical; only real slugs in catalog (build validates, missing → error)
    - ko: { title, situation, tip, examples, gotchas?, tags? }
    - en: { title, situation, tip, examples, gotchas? }
    INVARIANT — PAIR/FIELDS/UNIQUENESS/REFERENCE: every record has both ko+en; each locale's title/situation/tip/≥1 example filled; slug unique; related points to real slugs. Violation → generator build failure (not silent omission, explicit error + file/field report).
  </merged_tip>
  <subcategory note="grouping by everyday theme; localized label from i18n">
    - id: enum (household, food, health, money-admin, safety, seasonal, miscellaneous). Display order: as listed. Phase 2 adds more.
    - Label: tools.life-tips.subcategories.<id> (ko: "집안일·살림"/"음식·요리"/…, en: "Household"/"Food"/…).
    - Virtual tabs (not real subcategories): "all" (everything), "favorites" (pinned), "recent" (MRU) — shown in tab row when applicable.
  </subcategory>
  <life_tips_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — tip slugs, insertion order
    - recents: string[] — tip slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastSubcategory?: string; lastLang?: 'ko' | 'en' | 'both'; createdAt: number }
    localStorage key: `jurepi-life-tips`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown slugs pruned on load (catalog change never leaves dangling ids).
  </life_tips_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; CARD_SITUATION_CLAMP = 2 lines; TOAST_MS = 1600ms.
  </constants>
  <defaults>
    - New user: favorites/recents empty; active tab "all"; no tip selected (detail shows empty hint); language display = current locale 1st + other-lang subtitle, detail = 'both'.
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/life-tips" page="LifeTips (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. Per-tip deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <life_tips>                    <!-- "use client"; owns subcategory + query + selectedSlug + lang state + useLifeTips() owner -->
    <life_tips_intro />          <!-- H1 + lead (server-render where possible) -->
    <tips_layout>                <!-- Desktop 2-split (list | detail), mobile stacked + bottom-sheet -->
      <tips_main>                <!-- Left/top column -->
        <tip_search />           <!-- "/" focus, clear, result count -->
        <subcategory_tabs />     <!-- All / Household / Food / … / Favorites / Recent -->
        <tip_list>               <!-- Roving tabindex cards -->
          <tip_card />           <!-- × N: click = select (open detail); star = favorite -->
          <empty_state />        <!-- No search results / empty favorites / empty recents -->
        </tip_list>
      </tips_main>
      <tip_detail>               <!-- Desktop: sticky right; mobile: bottom-sheet -->
        <related_chips />        <!-- related slug → click to navigate -->
      </tip_detail>
    </tips_layout>
    <life_tips_how_to />         <!-- SEO long-form -->
    <life_tips_faq />            <!-- FAQPage JSON-LD -->
  </life_tips>
  <note>SPA within tool: tab/search/select/language toggle = local state switch, NOT route navigation. Detail panel same component docked (desktop) or bottom-sheet (mobile).</note>
</component_hierarchy>

<pages_and_interfaces>
  <life_tips_intro>
    - Eyebrow: "마음가짐 도구" / "MINDSET TOOL" — 12px/700/0.6px, var(--accent-grape).
    - H1: "생활 상식" / "Life Tips" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "일상의 크고 작은 문제들을 슬기롭게 해결하는 실용적이고 검증된 생활 상식 모음입니다." / English equivalent.
  </life_tips_intro>

  <tip_search>
    - DESIGN text-input style, main column full width, leading Search icon (lucide, 20px var(--text-muted)), placeholder "팁·상황·태그로 검색 (예: 얼룩, 세탁, 음식 보관)".
    - Focus on "/" keypress (when not already typing). Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption var(--text-muted), aria-live="polite".
    - aria: role="searchbox", aria-controls the list.
  </tip_search>

  <subcategory_tabs>
    - Horizontal pill row (category-pill / category-pill-active). Order: "전체"(all) → "집안일" → "음식" → "건강" → "돈·행정" → "안전" → "계절" → "기타" → "즐겨찾기" (when pinned) → "최근" (when viewed).
    - Active = brand grape fill / on-grape text; inactive = surface-muted / text-secondary; hover lifts bg.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active. Narrow screens scroll horizontally + snap.
    - Compose with search: subcategory narrows set, search filters within it. "All" + empty search = full catalog.
  </subcategory_tabs>

  <tip_list>
    - Responsive grid: ≥1024px + detail 2-split = 1-column list or 2-column; 768–1023px 2-column; <768px 1-column.
    - Each card (tip_card):
      - Top: tip title 1st (current locale, headline 18–20px var(--text)/700) + other-lang subtitle (14px var(--text-muted)).
      - Top-right: subcategory badge (small pill, grape-tinted per design) + star button (favorite toggle, aria-pressed).
      - Body: situation 2-line clamp (var(--text-secondary) 14–15px).
      - Bottom: tags (up to 2, surface-muted chips); difficulty indicator (optional, small).
      - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px.
    - States:
      - hover (pointer): translateY(-2px) + var(--shadow-card-hover); cursor pointer.
      - focus (keyboard): 2px var(--focus-ring) ring offset 2px.
      - selected: 2px var(--accent-grape) ring + var(--accent-grape-soft) left accent bar.
    - Roving tabindex: active card tabbable; ArrowUp/Down/Left/Right move; Home/End first/last; Enter/Space open detail (bottom-sheet on mobile); "f" toggle favorite.
    - aria: list role="list"(or grid); card aria-label = "{title} — {subcategory}"; star is a real stateful button.
    - empty_state: no results → "'{query}'에 해당하는 팁이 없어요" + clear; empty favorites → "별을 눌러 자주 보는 팁을 저장하세요"; empty recent → "최근 본 팁이 여기에 모여요".
  </tip_list>

  <tip_detail>
    - Desktop (≥1024px): sticky right column, width 360px, var(--surface), radius var(--radius-xxl) 28px, padding 24px, shadow --shadow-card, sticks below breadcrumb.
    - Tablet (768–1023px): below list as full-width card or ~320px dock.
    - Mobile (<768px): slides-up bottom-sheet on selection; grab handle + close; backdrop dim rgba(30,27,58,0.4).
    - Content (top → bottom):
      1. Tip title: large headline 28px var(--text) (current-lang toggle basis).
      2. Meta row: subcategory badge + difficulty (if any, small) + tag chips + "copy tip" small button (success toast on copy; failure silent).
      3. Language toggle: [Korean] [English] [Both] segment (default 'both' or last choice). 'Both' shows ko·en side-by-side.
      4. Situation: eyebrow "상황"/"Situation", 16px var(--text-secondary), italic or accent.
      5. Tip/Guidance: eyebrow "꿀팁"/"Tip", 16px var(--text-secondary), bold guidance text.
      6. Gotchas/Anti-patterns (if any): contra-bullets, var(--surface-muted) background, 14px var(--text-secondary).
      7. Examples: stacked list (per locale), each var(--surface-muted) chip (radius --radius-md); bolded key phrase within. Label "예시"/"Examples" eyebrow.
      8. Related (related, if any): related_chips — click to select that tip, unknown slugs hidden.
    - Empty/initial (not selected): hint card — "팁을 선택하면 상황과 조언이 여기에 표시됩니다." + if recents exist, nudge to re-view.
  </tip_detail>

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
  <generation note="build time, scripts/generate-life-tips.mjs">
    - Scan content/life-tips/tips/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file frontmatter → zod TipFileFront validate.
    - mergePair: apply canonical rule (ko structural meta + en inherit if absent; locale content independent). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields, slug uniqueness, related references exist.
    - Sort (subcategory order → title locale order), emit tips.generated.json. Deterministic (no Date/random).
    - package.json wire: "predev": "node scripts/generate-life-tips.mjs", "prebuild": "node scripts/generate-life-tips.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allTips(): MergedTip[] (generation order). byId(slug), bySubcategory(subcategory). subcategories(): live subcategory ids in catalog.
    - Tests assert catalog uniqueness, related integrity, locale completeness.
  </catalog_access>
  <search>
    - filterTips(tips, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.title, en.title, ko.situation, en.situation, tags, ko.examples, en.examples. Stable order.
    - Compose with subcategory tab: list = filterTips(active-tab subset, query). Favorites/Recent tabs filter their own ordered subsets.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(slugs, catalog): drop slugs not in current catalog (run on load).
    - Recent push: when detail opens (select). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useLifeTips>
    - Mount: dynamic catalog import; read `jurepi-life-tips` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, selectedSlug + select(slug), toggleFavorite, favorites, recents, lastSubcategory, lang + setLang, copy(text).
  </persistence_adapter>
  <i18n>All UI chrome from tools.life-tips.* (ko/en): tabs, subcategory labels, search, lang toggle, toasts, empty states, how-to, FAQ. Tip title/situation/tip/gotchas/examples come from markdown (tips.generated.json), NOT i18n messages.</i18n>
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
    - Category accent is GRAPE (var(--accent-grape) / var(--accent-grape-soft)) — "mindset" category identity. Intro icon tile, card selected bar, related chips, favorite star (filled), subcategory badge.
    - CTAs (primary buttons) stay brand honey-gold var(--brand) (tab active). Accent = identity, not action (DESIGN do/don't).
    - Subcategory badges: grape tinted but each subcategory read as one visual unit (not per-colored badges).
  </accent_usage>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius --radius-xxl, card radius --radius-lg; example/tag chips var(--surface-muted). Soft brand-tinted shadows, hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); tip title headline (card 18–20px / detail 28px)/700; situation Pretendard 15–16px/1.55 italic; gotchas/example eyebrow. Example term emphasis 600.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail cross-fade 150ms, mobile sheet slide-up (translateY) 250ms, star toggle pop (scale 1→1.15→1) 200ms. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (instant fade, no scale).</motion>
  <accessibility>Card/star/toggle = labeled real buttons; roving-tabindex list; copy/favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); language toggle segmented radio (aria). AA contrast: situation text var(--text-secondary) on bright surface.</accessibility>
  <responsive>
    - ≥1024px: 2-split — main (search+tabs+list) flex:1, detail sticky 360px right.
    - 768–1023px: list 2-column; detail below or ~320px dock.
    - <768px: single column; detail bottom-sheet. Tabs scroll horiz + snap. No overflow (320 test).
  </responsive>
  <atmosphere>Warm, practical "everyday survival guide": generous card spacing, one tip spotlit on the right. Approachable, not preachy; inviting cards feel like trusted neighbor wisdom (not sterile encyclopedia). Grape identity conveys thoughtfulness/mindset, not frivolity.</atmosphere>
  <icons>lucide-react: Search (search), Star/StarOff (favorite), Copy (copy), X (clear/close), Languages (language toggle), ArrowUpRight (related), Lightbulb (intro/registry). Default 20px, stroke 1.75, currentColor. Registry card icon: `Lightbulb`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Title/situation/tip/gotchas/examples render as text nodes (React escape). dangerouslySetInnerHTML forbidden. Markdown body (MVP extend-section) plain-text para only — rich HTML/script banned.
    - Generator validates frontmatter with zod (type/required/length). Unknown fields ignored.
  </input>
  <clipboard>User-initiated strings only (tip/situation); never read clipboard; user-gesture handler only.</clipboard>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes copied content. how-to/FAQ state plainly.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness so no malformed entry ships.</content_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <bilingual_toggle>Detail Ko/En/Both segment — read tip guidance side-by-side. "l" shortcut cycles. Last choice localStorage-remembered.</bilingual_toggle>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-search friction. Unknown slugs auto-pruned.</favorites_recents>
  <related_navigation>related chips navigate between tips — explore the know-how. Dangling refs filtered at build.</related_navigation>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite, "l" language — mouse-free power.</keyboard_first>
  <structured_data>HowTo JSON-LD per tip (name, step-by-step situation→action, url) + FAQPage JSON-LD (site-level Q&A) — search engine recognizes how-to articles (discoverability).</structured_data>
  <difficulty_indicators optional="true">Phase 2: tips can declare beginner/intermediate/advanced; filter chips shown in card (visual cue, no filtering unless user elects).</difficulty_indicators>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → list auto-compose</description>
    <steps>
      1. stain-removal.md + stain-removal_en.md exist in content/life-tips/tips/.
      2. pnpm dev (or build) → predev generator runs → tips.generated.json has stain-removal merged record (ko/en title·situation·tip·examples).
      3. Visit /ko/tools/life-tips → list renders "옷에서 기름 얼룩 제거하기" card (subtitle "Removing Oil Stains from Clothes").
      4. Add new pair food-storage-basics(.md/_en.md), rebuild → list auto-updates (no code edit).
      5. English-only or Korean-only tip → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, subcategory filter, empty states</description>
    <steps>
      1. Type "얼룩" in search → list narrows; result count updates; aria-live announces.
      2. Clear, click "집안일" (Household) tab → household tips only.
      3. Type "기름" → title/situation/tags matching both locales.
      4. Type "asdfqwer" → empty "'asdfqwer'에 해당하는 팁이 없어요" + clear; clear restores.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Detail, Ko/En bilingual, related navigation</description>
    <steps>
      1. Click "옷에서 기름 얼룩 제거하기" card → detail opens: title, Korean situation+tip, examples; pushed to recent.
      2. Toggle [Both] → Ko + En situation/tip side-by-side with labels.
      3. Click related chip → detail switches to that tip (list selection syncs).
      4. "Copy tip" → clipboard has tip text; success toast. (No clipboard → silent.)
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Favorites, recent, persistence, keyboard, a11y</description>
    <steps>
      1. Open 2 different tips → "최근" tab lists them MRU.
      2. Star a card (or "f" focused) → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload → favorites/recents persist (localStorage); unknown slugs pruned.
      4. "/" → search focus; arrow navigate cards; Enter open detail; axe pass → no violations, cards labeled, focus ring visible.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD, long-form), locale swap</description>
    <steps>
      1. Switch to /en → chrome (tabs/search/toggle/how-to/FAQ) English; card 1st label English title, subtitle Korean.
      2. Build prod → /ko/tools/life-tips and /en/tools/life-tips unique title/description/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage + HowTo JSON-LD (per-tip how-to steps); how-to/FAQ localized; tip dataset code-split chunk (not global i18n).
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>Responsive, no overflow, reduced-motion</description>
    <steps>
      1. 320px viewport → single-column list; detail bottom-sheet modal. Tabs scroll horiz + snap. No horizontal overflow.
      2. 768px → 2-column list; detail below. 1024px+ → 2-split docked right.
      3. prefers-reduced-motion ON → card hover (no translateY), detail fade (instant, no scale/pop). Functionality unaffected.
    </steps>
  </test_scenario_6>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<tip>.md` + `<tip>_en.md` pair in content folder, rebuild, auto-reflect in list/search/detail with zero code change; generator validates pair/field/uniqueness/reference, fails build with clear message on violation.</content_model>
  <functionality>Searchable, subcategory-filterable card list (both locales); bilingual detail + language toggle (ko/en/both); related navigation; localStorage favorites + recent (prune unknown, work when absent); seed ≥6 tips per 7 subcategories (42+ tips total).</functionality>
  <user_experience>Search/filter instant; cards feel readable; ≥44px targets; visible focus; SPA — no route reload on any interaction.</user_experience>
  <technical_quality>lib/life-tips/* pure ≥ 80% unit coverage (schema/merge/slug/search/favorites); generator validation tests (pair-missing, dupe-slug, dangling-related, empty-field → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; grape identity + brand honey-gold CTA; warm, approachable everyday guide (not cold reference); text-node render only.</visual_design>
  <accessibility>Full keyboard (roving list, "/", Enter, "f", "l", Esc); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected (ad height platform-reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-life-tips.mjs to freshen tips.generated.json. /[locale]/tools/life-tips pre-rendered by platform generateStaticParams iterating registry (status "live"). Tip catalog ships as code-split chunk on this route only.</note>
  <generated_artifact>tips.generated.json: (a) .gitignore and always regenerate via predev/prebuild, OR (b) commit for reproducibility + CI checks "is generated artifact up-to-date?" (recommended: commit, deterministic generator, diff shows content change review).</generated_artifact>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'mindset' category + 'grape' accent already exist; no ToolCategory change needed.
    {
      id: 'life-tips',
      slug: 'life-tips',
      category: 'mindset',               // Already exists (office-life-tips/qna-a-day)
      icon: 'Lightbulb',                 // lucide-react
      accent: 'grape',                   // Already exists (mindset identity)
      status: 'coming_soon',             // 'live' when module complete
      isNew: true,
      order: 3,                          // tune as desired
      keywords: ['생활상식','생활꿀팁','일상','살림','세탁','얼룩','음식','건강','돈','행정','안전','계절','응급','절약','생활','life tips','everyday','household','practical','know-how','hacks','laundry','food','health','budget','safety','cleaning','organization'],
    },
    ```
    Also add slug→component branch (&lt;LifeTips/&gt;) and generateMetadata branch (title/description/JSON-LD) in tool route alongside ladder/qna-a-day/office-life-tips. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate → tips.generated.json. Entire tool depends on this. Validation failure = build fail.
    2. Pair/canonical-merge rule (ko structural, en inherit) + slug uniqueness + related referential integrity.
    3. Search (both locales, diacritic/case-ignore) + subcategory compose.
    4. Bilingual detail toggle (ko/en/both) — core value prop.
  </critical_paths>
  <recommended_implementation_order>
    1. Platform: register in tools.registry (id/slug/category/icon/accent/status); add route branch + generateMetadata. No new category infrastructure.
    2. lib/life-tips/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema, slug derivation/uniqueness, canonical merge, search match, MRU/favorite immutable ops, pruneUnknown.
    3. scripts/generate-life-tips.mjs + content/life-tips/{_TEMPLATE,_TEMPLATE_en,README} + tips/ seed (42+ tips across 7 subcategories). Generator validation tests (pair-missing, dupe-slug, dangling, empty → fail). predev/prebuild wire.
    4. tools.life-tips.* messages (ko/en): tabs, subcategory labels, search, lang toggle, toasts, empty states, how-to, FAQ.
    5. useLifeTips hook (dynamic import + localStorage favorites/recents + in-memory fallback + copy adapter).
    6. TipSearch + SubcategoryTabs + TipList/TipCard (roving tabindex, states) + empty states.
    7. TipDetail (title/situation/tip/gotchas/examples/lang-toggle/related-chips/copy) — docked desktop, bottom-sheet mobile.
    8. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus).
    9. LifeTipsIntro/HowTo/Faq + SoftwareApplication + FAQPage + HowTo JSON-LD via platform lib/seo.ts.
    10. Registry status→coming_soon→live; slug→component + generateMetadata branches; E2E 1–6; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_tips note="initial content — 42+ tips, ~6 per subcategory. Author refines; structure shown">
    - household (집안일): stain-removal-oil, fabric-care-basics, laundry-sorting, shoe-cleaning, iron-maintenance, storage-organization.
    - food (음식): food-expiration-dates, proper-storage-basics, vegetable-longevity, meat-freezing, herb-preservation, kitchen-safety.
    - health (건강): sleep-hygiene-tips, common-remedies, posture-improvement, hydration-importance, stress-relief, exercise-basics.
    - money-admin (돈·행정): budgeting-101, utility-bill-reduction, contract-basics, tax-essentials, savings-tips, negotiation-basics.
    - safety (안전): first-aid-basics, home-safety-checklist, emergency-prep, fire-safety, electrical-safety, personal-security.
    - seasonal (계절): winter-heating-tips, summer-cooling-efficiency, spring-cleaning, allergy-prevention, seasonal-clothing, weather-prep.
    - miscellaneous (기타): time-management, productivity-hacks, gardening-basics, pet-care-101, diy-simple-repairs, travel-packing.
  </seed_tips>
  <generator_sketch>
    ```javascript
    // scripts/generate-life-tips.mjs (outline) — deterministic, no Date/random
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) tips/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod TipFileFront.parse (collect errors)
    // 3) mergePair(ko, en): canonical rule, resolveSlug
    // 4) validate: pair-integrity / required-fields / slug-unique / related-exist → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(tips.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/favorites); generator validation fixtures (pair-missing/dupe/dangling cases); component catalog-injected mocks; E2E scenarios 1–6 (esp. #1 folder→list, #3 lang-toggle/related, #5 JSON-LD, #6 responsive/motion); clipboard/localStorage jsdom-isolated.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, bottom-sheet behavior, JSON-LD primed HTML, generator real-fail cases, 7 subcategories populated, 42+ tips, ko/en completeness.</tool_usage>
</key_implementation_notes>

</project_specification>
```

**Line count: 689**
