# 즐겨찾기 (Curated Bookmarks — Topic-organized Link Directory) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **즐겨찾기 / Curated Bookmarks** (Korean display name: **즐겨찾기**; English display name: *Curated Bookmarks*) — a curated, editor-authored link directory organized by topic (分野/field). Content is managed as markdown pairs (`<topic>.md` + `<topic>_en.md`), with structured link collections per topic, and at build time a generator reads the folder, validates URLs, and emits a static catalog. The tool mounts as a client-side SPA offering topic tabs, search (primarily by topic), favorites/recents, and topic detail view that renders sections and links as clean rows with external-link affordance.
>
> Internal service codename: `bookmarks`. Registry id: `bookmarks`. Public URL slug: `/[locale]/tools/bookmarks`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/news/rankings/SPEC.md`](../../news/rankings/SPEC.md)

```xml
<project_specification>

<project_name>즐겨찾기 (Curated Bookmarks) — Topic-organized Link Directory rendered as section+link lists (Jurepi tool, codename bookmarks, registry id bookmarks)</project_name>

<overview>
즐겨찾기 (Curated Bookmarks) brings together trustworthy, carefully curated link collections organized by topic — resources for web developers, designers, product builders, etc. A visitor searches for a field ("하네스 엔지니어링", "프런트엔드 리소스", "디자인 참고"), browses available topic collections, opens one, and reads subsections of curated links — each link labeled with title, description, and a link-out affordance. Each topic is **editor-authored markdown** — not user-generated, not auto-indexed, not a social bookmark manager — with transparent source attribution and curation intent. This solves "What are the best resources for X?"

CRITICAL (trust surface — editorial intent): every topic is curated by an editor with a purpose. The directory is NOT a crowdsourced "awesome list" accumulator (no user submissions, no voting). Each link is hand-picked and described. The topic's introduction/description should be visible and emphasize the curator's intent.

CRITICAL (presentation — structured link lists): link collections render as clean, scannable **sections** within each topic, where each section is a heading + a list of **link rows** (title, description, external-link icon, rel=noopener target=_blank). No link is hidden; all are immediately visible in the detail view. Rows are readable and tappable; hover states provide feedback.

The tool's content model is fundamental: topics and links are NOT code — they are **markdown files**. Create pairs in the content folder (`<topic>.md` for Korean + `<topic>_en.md` for English), with structured frontmatter (title, description, sections[heading, links[]]), and at **build time** a generator scans the folder, parses the frontmatter, validates link URLs, and bakes it into a static catalog (bookmarks.generated.json). The tool then dynamically imports that catalog to render the list, search, and detail views. This means "drop a file in the folder and it appears" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The topic catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + recents), and nothing is ever sent over the network. NO user submissions, NO crowdsourcing, NO real-time updates.

CRITICAL (content model, invariants): every topic MUST have a Korean file and an English file as a matching pair. Each file carries a non-empty `title`, `description`, and `sections` (≥1 section per topic, ≥3 links total). Each link has `label` (required), `url` (required, valid http(s)), and `description` (optional). The build generator validates pair integrity, required fields, URL validity (http(s), rel=noopener for rendering), field uniqueness per locale, and **fails the build** if ANY rule is broken.

CRITICAL (SPA, usability-first): every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — topic switching, search, opening topics, pinning favorites — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the topic list is visible, search is one keystroke away ("/"), and every topic is reachable in under a second.
</overview>

<platform_integration>
  - Route: /[locale]/tools/bookmarks (SSG; registry slug "bookmarks", id "bookmarks", status "coming_soon", accent "sky", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.bookmarks.*` (UI chrome strings: topics, search, how-to, FAQ, link labels — NOT topic content; that comes from markdown in bookmarks.generated.json); the in_content AdSlot below the tool.
  - Platform dependency (category note): this tool lives in the `'dev'` category (개발) — currently PROVISIONAL because the sole concrete example is developer/harness resources. If topics become broadly cross-domain (design, product, business, etc.), a dedicated category could be considered in Phase 2. For now, `dev` is appropriate. NOTE: the `'dev'` category already exists in ToolCategory/i18n/CATEGORY_ORDER/accent(sky). The only platform change is adding ONE ToolMeta registry entry, a slug→component branch in the tool route, and a generateMetadata branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed topic catalog (pairs: `<topic>.md` + `<topic>_en.md`) in `content/bookmarks/`.
    - Build-time generator: folder scan → frontmatter parse → URL validation → catalog merge → code-split static catalog (bookmarks.generated.json). Wired to prebuild/predev.
    - Four seed topics with ≥3 links each (12+ links total): **하네스 엔지니어링** (meta-skills, skills, techniques), **프런트엔드 리소스** (components, CSS, perf), **디자인 참고** (inspiration, tools, systems), **무료 개발 도구** (utilities, gens, services). Scalable to more topics.
    - **Topic markdown templates**: annotated markdown templates (`content/bookmarks/_TEMPLATE.md`, `content/bookmarks/_TEMPLATE_en.md`) and authoring README to make adding new topics easy.
    - Topic tabs: derived from unique topics in the catalog (All / Topics / … / Favorites, Recent). Virtual tabs: Favorites (when pinned), Recent (when viewed).
    - Search: topic titles, descriptions, section headings, link labels across BOTH locales, real-time filter (debounced). Case and diacritic insensitive. PRIMARY: topic search; SECONDARY: link title/description within topics.
    - Detail view: topic title, introduction/description, **sections** (each section: heading + link-row list), where each link row shows title, optional description, and external-link affordance (rel=noopener target=_blank).
    - **Link enrichment (build-time, no runtime fetch)**: the generator bakes two OPTIONAL fields onto each link — `youtubeId` (for embeddable YouTube video URLs: watch/youtu.be/embed/shorts; channels & playlists excluded) and `image` (og:image resolved at build time via a committed cache `content/bookmarks/.og-cache.json`, cache-first & offline-safe, failures degrade gracefully). Rendering: (a) a link with `youtubeId` → **click-to-load lite embed** (16:9 thumbnail + play button facade → `youtube-nocookie.com` iframe on click; CLS-reserved; keeps an "open on YouTube" external affordance); (b) a link with `image` → compact row + ~64px leading OG thumbnail (lazy, dimensions reserved, onError → plain row); (c) otherwise → the plain compact row. No runtime network calls; enrichment is static in `bookmarks.generated.json`.
    - Favorites (pinned topics) + recent views — localStorage persistence, auto-prune of unknown topic ids.
    - Full keyboard support: "/" search focus, arrow keys topic/link navigation, Enter to open, Esc to clear/close.
    - Tool-specific SEO long-form (bookmarks intro, topic descriptions, "What resources for X?") + FAQ + **ItemList / ListItem JSON-LD** (schema.org type for resource collections, ideal for GEO/AI citation), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - User browser-based link add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - User submissions of topics or links (NO crowdsourced / social features).
    - Real-time link updates or broken-link checking. Content is static, authored, reviewed, versioned via git.
    - Per-topic or per-link deep-link URLs (e.g., /tools/bookmarks/frontend-resources) — MVP is a single route + client state. (Phase 2 candidate.)
    - Rich HTML/script in markdown body. Descriptions are structured fields (plain text / limited inline emphasis), rendered safely.
  </out_of_scope>
  <future_considerations>
    - Per-topic static deep-link routes + individual ListItem pages (SEO) — Phase 2.
    - Topic expansion: design, product, business, data, games, etc. (catalog only, schema unchanged).
    - Broken-link detector / periodic refresh audit — Phase 2.
    - Editor comments / annotations on links — Phase 3.
    - Link submission form → repository issue/PR link — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Topics live as markdown pairs in `content/bookmarks/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Links and section titles are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged topic-record invariants. URL validation (valid http(s), non-empty label). Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/bookmarks/data/bookmarks.generated.json), dynamically imported only on this tool's route so topic content never enters the global i18n message bundle (protects platform JS budget — same pattern as rankings/new-word/qna-a-day).</catalog>
    <animation>Native CSS transitions only (card hover lift, link row focus, detail fade-in). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-bookmarks.mjs                  # Build time: scan content/bookmarks/* → parse → validate URLs → emit bookmarks.generated.json. Wired to prebuild/predev.
content/bookmarks/                          # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md           # Templates (excluded by generator)
├── README.md                               # Authoring guide (topic format, link structure, URL rules)
└── topics/*.md  *_en.md                    # Topic pairs
src/
├── lib/bookmarks/                          # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                           # zod: TopicFileFront(ko/en), MergedTopic, StoreSchema + STORE_VERSION
│   ├── merge.ts                            # mergePair(koFront, enFront): apply canonical rule → MergedTopic; validatePair
│   ├── slug.ts                             # slugify(title), resolveSlug(front, filename)
│   ├── catalog.ts                          # Typed access: allTopics, byId, byAll, topics(); topic enum
│   ├── search.ts                           # filterTopics(topics, query, locale): title+description+section-headings+link-labels, both locales; normalize
│   └── favorites.ts                        # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(ids, catalog)
├── components/tools/bookmarks/
│   ├── Bookmarks.tsx                       # Orchestrator (Client Component) — query/selectedId state + useBookmarksCatalog() owner
│   ├── useBookmarksCatalog.ts              # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── TopicTabs.tsx                       # All / Topics / (Favorites) / (Recent) pills
│   ├── BookmarksSearch.tsx                 # Search input ("/" focus, clear, result count, aria)
│   ├── TopicsList.tsx                      # Responsive card list; roving tabindex keyboard nav
│   ├── TopicCard.tsx                       # One-topic card: title, description, section count, link count, star + compact tag line
│   ├── TopicDetail.tsx                     # Selected topic: title, description, then TopicSections
│   ├── TopicSections.tsx                   # Rendered sections within topic detail
│   ├── LinkRow.tsx                         # One link row: title, optional description, external-link icon, rel=noopener
│   ├── BookmarksIntro.tsx                  # H1 + lead (SEO; server-render where possible)
│   ├── BookmarksHowTo.tsx                  # "What are curated bookmarks?" / "Organized link resources" (SEO long-form)
│   ├── BookmarksFaq.tsx                    # Q&A + FAQPage + ItemList JSON-LD
│   └── data/
│       └── bookmarks.generated.json        # Generated artifact — [MergedTopic...]
└── i18n/messages/{ko,en}.json              # tools.bookmarks.* UI chrome (tabs, search, field labels, toasts, how-to, FAQ)
</file_structure>

<core_data_entities>
  <topic_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — topic title (that locale)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - description: string (required, non-empty) — curator's intent, plain text ≤200 chars
    - sections: array (required, ≥1)
      - heading: string (required) — section subheading within topic (e.g., "메타 스킬", "스킬")
      - links: array (required, ≥1 link per section, ≥3 links total per topic)
        - label: string (required) — link title/display name
        - url: string (required, valid http(s) URL, rel=noopener)
        - description?: string (optional, plain text, ≤100 chars)
    INVARIANT: title/description non-empty, sections ≥1, links ≥3 total, all URLs valid http(s). zod parse failure → collect as error (build failure candidate).
  </topic_file_front>
  <merged_topic note="ko+en merge result; catalog record; bookmarks.generated.json item">
    - slug: string — unique identifier (unique per locale; favorites/recents reference)
    - ko: { title, description, sections: [{ heading, links: [{ label, url, description? }, ...] }, ...] }
    - en: { title, description, sections: [...] } — title/description/sections are PER-LOCALE (localized like the rest of the app's content); EN inherits KO slug if absent. Sections/links may differ (e.g., "하네스 엔지니어링" vs "Harness Engineering" may have different resources).
    INVARIANT — PAIR/FIELDS/UNIQUENESS: every record has both ko+en; each has title + description + ≥1 section + ≥3 links total; slug unique. Violation → generator build failure.
  </merged_topic>
  <bookmarks_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — topic slugs, insertion order
    - recents: string[] — topic slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastQuery?: string; createdAt: number }
    localStorage key: `jurepi-bookmarks`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown ids pruned on load.
  </bookmarks_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; LINK_DESC_MAX = 100; SECTION_MAX = 10; LINKS_MIN_PER_TOPIC = 3.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/bookmarks" page="Bookmarks (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "coming_soon" initially, then "live" on launch) to SSG. Per-topic deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <bookmarks>                     <!-- "use client"; owns query + selectedId + useBookmarksCatalog() state -->
    <bookmarks_intro />           <!-- H1 + lead (SEO; server-render where possible) -->
    <bookmarks_layout>            <!-- Selector (list) on top, full-width detail below when selected -->
      <bookmarks_main>            <!-- Left/top column -->
        <bookmarks_search />      <!-- "/" focus, clear, result count -->
        <topic_tabs />            <!-- All / Topics / Favorites / Recent -->
        <topics_list>             <!-- Roving tabindex cards -->
          <topic_card />          <!-- × N: click = select; star = favorite -->
          <empty_state />         <!-- No results / empty favorites -->
        </topics_list>
      </bookmarks_main>
      <topic_detail>              <!-- Full-width panel below the list; shown only when a topic is selected -->
        <topic_sections>          <!-- Sections and link rows -->
          <link_row />            <!-- × N: title, desc, external link icon -->
        </topic_sections>
      </topic_detail>
    </bookmarks_layout>
    <bookmarks_how_to />          <!-- SEO long-form -->
    <bookmarks_faq />             <!-- FAQPage + ItemList JSON-LD -->
  </bookmarks>
  <note>SPA within tool: search/select = local state switch, NOT route navigation. Detail is a full-width panel rendered below the selector (same component on desktop & mobile), not a sidebar or bottom-sheet.</note>
</component_hierarchy>

<pages_and_interfaces>
  <bookmarks_intro>
    - Eyebrow: "북마크 도구" / "BOOKMARKS TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "즐겨찾기" / "Curated Bookmarks" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg: "하네스·프런트엔드·디자인·개발 등 각 분야의 신뢰할 수 있는 큐레이션 링크 모음을 찾아보세요." / English equivalent.
  </bookmarks_intro>

  <bookmarks_search>
    - DESIGN text-input style, main column full width, leading Search icon (20px), placeholder "주제·리소스로 검색…" / "Search topics…".
    - Focus on "/" keypress. Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption.
    - aria: role="searchbox", aria-controls the list.
  </bookmarks_search>

  <topic_tabs>
    - Horizontal pill row. Order: "전체"(all) → topics (derived from catalog) → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active.
  </topic_tabs>

  <topics_list>
    - Responsive grid: 1-column <768px; 2-column ≥768px. Full container width (the detail sits below, not beside).
    - Each card: title (headline 18–20px var(--text)/700), description (clamp 2 lines var(--text-secondary) 14–15px), compact tag line showing section count + link count (e.g., "3 섹션 · 12 링크"), and a star (favorite toggle).
    - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, shadow --shadow-card.
    - States: hover translateY(-2px) + --shadow-card-hover; focus 2px var(--focus-ring); selected 2px var(--accent-sky) ring.
    - Roving tabindex; ArrowUp/Down move; Enter/Space open detail; "f" toggle favorite.
    - empty_state: "'{query}'에 해당하는 주제가 없어요" / "No topics found"; or "별을 눌러 즐겨찾기를 저장하세요".
  </topics_list>

  <topic_detail>
    - Placement: a FULL-WIDTH panel rendered below the selector (search + tabs + card list), shown only once a topic is selected. RATIONALE: sections + links are wide and numerous; a sticky sidebar cramps the view — the link rows wrap. Full width lets all content breathe. Same layout on desktop and mobile (single column, stacked).
    - Panel surface: var(--surface), radius var(--radius-xxl), padding 24px (16px on mobile), 1px var(--hairline), shadow --shadow-card.
    - Deselect affordance: X button (lg:hidden — mobile) to clear the selection; Esc also clears.
    - Content (top → bottom):
      1. Title: large headline 28px var(--text).
      2. Description: body 16px var(--text-secondary), 1–2 lines — curator's intent.
      3. Sections (stacked):
         - Section heading: eyebrow/label 12px/700 var(--brand-ink) or accent color per topic.
         - Link rows (`<div role="region">` or unstyled list):
           · Link title: 16px/600 var(--text), tappable.
           · Optional description: 14px var(--text-secondary) below title.
           · External-link icon (lucide, 16–18px var(--text-muted)), trailing; aria-label "외부 링크" / "External link"; rel=noopener target=_blank.
         - Row states: hover bg var(--surface-muted); focus 2px var(--focus-ring); active text-primary.
      4. Empty/initial (not selected): hint "주제를 선택하면 링크 모음이 여기에 표시됩니다."
    - Responsive: ≥768px full-width panel; <768px same single-column stacked. Links never overflow at 320px.
  </topic_detail>

  <keyboard_shortcuts_reference>
    - "/" → search input focus (when not typing).
    - Arrow keys → topic card/link focus move.
    - Enter / Space → open focused topic detail.
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search or deselect the open topic detail.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-bookmarks.mjs">
    - Scan content/bookmarks/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → zod TopicFileFront validate.
    - mergePair: apply canonical rule (ko slug canonical + en inherit if absent; description/sections PER-LOCALE). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, required fields, section/link counts (≥1 section, ≥3 links total per topic), URL validity (http(s) + non-empty label), slug uniqueness.
    - Sort (slug alphabetical / title order), emit bookmarks.generated.json. Deterministic.
    - package.json wire: "predev": "node scripts/generate-bookmarks.mjs", "prebuild": "node scripts/generate-bookmarks.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allTopics(): MergedTopic[] (generation order). byId(slug). topics(): live topic ids in catalog.
    - Tests assert catalog uniqueness, locale completeness.
  </catalog_access>
  <search>
    - filterTopics(topics, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.title, en.title, ko.description, en.description, ko.sections[].heading, en.sections[].heading, ko/en.sections[].links[].label. PRIMARY match = topic title/desc; SECONDARY = link labels within sections. Stable order.
    - Compose with tab: list = filterTopics(all, query) or filterTopics(favorites subset, query), etc.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(ids, catalog): drop ids not in current catalog (run on load).
    - Recent push: when detail opens (select). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useBookmarksCatalog>
    - Mount: dynamic catalog import; read `jurepi-bookmarks` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, selectedId + select(id), toggleFavorite, favorites, recents, lastQuery.
  </persistence_adapter>
  <i18n>All UI chrome from tools.bookmarks.* (ko/en): tabs, search, toasts, empty states, how-to, FAQ. Topic title/descriptions/sections/links come from markdown (bookmarks.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Orphan files are warned; minimum 1 violation triggers strict failure.
  </build_time>
  <search_no_results>Friendly empty state echoing query + "clear search" button; detail retains last selection or empty hint.</search_no_results>
  <storage>
    <unavailable>Private mode/disabled → recents/favorites in-memory, no scary error. List/search/detail fully work.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (favorites/recents not precious, no throw).</corrupt_blob>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; external links are simple href navigation, no API surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Per-tool identity accent is SKY (var(--accent-sky) / var(--accent-sky-soft)). Intro icon tile, card selected bar, favorite star (filled). (Category is `dev`; this tool uses sky as its per-tool identity accent to differentiate from sibling dev tools.)
    - CTAs (primary buttons, active tabs) stay brand honey-gold var(--brand).
    - Topic badge color: sky-tinted pill per topic (optional; can be monochrome).
  </accent_usage>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius --radius-xxl; link rows var(--surface-muted) on hover. Soft brand-tinted shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); topic title (card 18–20px / detail 28px)/700; link title 16px/600; description 14–15px; section heading eyebrow 12px/700.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail fade-in 150ms on selection. All gated by prefers-reduced-motion.</motion>
  <accessibility>Card/star/link = labeled real buttons; roving-tabindex list; favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); links rel=noopener target=_blank. Sections use semantic structure (headings + lists), not divs faking layout.</accessibility>
  <responsive>
    - All breakpoints: single column — selector (search + tabs + card grid) on top, full-width detail section below when a topic is selected. Card grid: 1-col <768px, 2-col ≥768px.
    - The detail's link sections are the responsive unit: full width ≥768px; <768px single column (no horizontal scroll). No page overflow at 320px.
  </responsive>
  <atmosphere>Bright, trustworthy "curated resource hub": generous card spacing, clear descriptions. The BROWSE layer is discoverable, tappable topic cards (not a dense list); the DETAIL layer renders clean, scannable link rows anchored by the topic's curator intent. Trust-first, editorial.</atmosphere>
  <icons>lucide-react: Search, Star/StarOff (favorite), ExternalLink (links), Bookmark (tool card icon), ChevronRight or ArrowUpRight (link affordance). Default 20px (16–18px inside detail), stroke 1.75, currentColor. Registry card icon: `Bookmark`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Title/description/section headings/link labels render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Links rendered as `<a href={url} rel="noopener target="_blank" />` (external, safe).
    - Generator validates frontmatter with zod (type/required/length/URL format — valid http(s) only).
  </input>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes topic/link data beyond view count.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness.</content_integrity>
  <note>No secrets, no network access, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-browse friction. Unknown ids auto-pruned.</favorites_recents>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite — mouse-free power.</keyboard_first>
  <structured_data>ItemList + each topic ListItem JSON-LD (position, name, description, url, mainEntity→links as sub-items) — search engine recognizes topic collections (discoverability = DESIGN principle ③).</structured_data>
  <external_links>Links marked rel=noopener; trusted curator sources (GitHub, docs, tools, design systems, etc.) encoded in markdown.</external_links>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → list auto-compose</description>
    <steps>
      1. harness-engineering.md + harness-engineering_en.md exist in content/bookmarks/ with description, ≥1 section, ≥3 links total.
      2. pnpm dev → predev generator runs → bookmarks.generated.json has merged record (ko/en title, description, sections).
      3. Visit /ko/tools/bookmarks → list renders "하네스 엔지니어링" card with link count.
      4. Add new pair frontend-resources(.md/_en.md), rebuild → list auto-updates (no code edit).
      5. Missing pair or <3 links or invalid URL → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, empty states</description>
    <steps>
      1. Type "프런트엔드" in search → narrows to matching topics; result count updates; aria-live announces.
      2. Clear, click "All" → full topic list.
      3. Type "asdfqwer" → empty "'asdfqwer'에 해당하는" + clear; clear restores.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Detail — sections and link rows</description>
    <steps>
      1. Click "하네스 엔지니어링" card → detail opens: title + description (curator intent), then sections.
      2. Each section: heading (e.g., "메타 스킬") + link rows (title, desc, external-link icon).
      3. Each link row is clickable/hoverable, rel=noopener target=_blank; opens in new tab.
      4. At 320px the rows stack without horizontal scroll; link title + desc remain readable.
      5. Screen reader announces section structure + link affordance.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Favorites, recent, persistence, keyboard, a11y</description>
    <steps>
      1. Open 2 different topics → "최근" tab lists them MRU.
      2. Star a card → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload → favorites/recents persist (localStorage); unknown ids pruned.
      4. "/" → search focus; arrow navigate cards; Enter open detail; axe pass → no violations.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD), locale swap</description>
    <steps>
      1. Switch to /en → chrome (tabs/search/how-to) English; card title English.
      2. Build prod → /ko/tools/bookmarks and /en/tools/bookmarks unique title/canonical/hreflang.
      3. HTML has SoftwareApplication + FAQPage + ItemList JSON-LD (topics as items, links as sub-items); topic dataset code-split chunk (not global i18n).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<topic>.md` + `<topic>_en.md` pair in content folder, rebuild, auto-reflect in list/search/detail with zero code change; generator validates pair/structure/links/uniqueness, fails build with clear message on violation.</content_model>
  <functionality>Searchable topic list (both locales, search-first); detail renders sections + link rows (titles, descriptions, external affordance); localStorage favorites + recent; seed 4 topics × 3+ links each (12+ links total).</functionality>
  <trust_surface>CRITICAL: every topic detail shows curator's intent (description, organized sections); every link labeled with title + optional description. Editor-authored, not crowdsourced.</trust_surface>
  <user_experience>Search/filter instant; cards readable; ≥44px targets; visible focus; detail rows never overflow at 320px; SPA — no route reload on any interaction.</user_experience>
  <technical_quality>lib/bookmarks/* pure ≥80% unit coverage (schema/merge/slug/search/favorites); generator validation tests (pair-missing, <3-links, invalid-URL → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; sky identity + brand honey-gold CTA; clean link rows (styled, focused states, external icon — intentional, not a raw list); text-node render only.</visual_design>
  <accessibility>Full keyboard (roving list, "/", Enter, "f", Esc); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected; LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-bookmarks.mjs to freshen bookmarks.generated.json. /[locale]/tools/bookmarks pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" initially, "live" on launch).</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category already exists; 'sky' is this tool's per-tool accent.
    {
      id: 'bookmarks',
      slug: 'bookmarks',
      category: 'dev',
      icon: 'Bookmark',
      accent: 'sky',
      status: 'coming_soon',    // 'live' when complete
      isNew: true,
      order: 18,
      keywords: ['즐겨찾기','북마크','링크','모음','자료','큐레이션','리소스','하네스','엔지니어링','프런트엔드','디자인','개발','bookmarks','links','directory','resources','curated','engineering','frontend','design','dev','tools'],
    },
    ```
    Also add slug→component branch (<Bookmarks/>) and generateMetadata branch in tool route. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate (URLs, structure) → bookmarks.generated.json. Entire tool depends on this.
    2. Pair/canonical-merge rule (ko slug canonical, en inherit) + link URL validation (http(s), rel=noopener) + link/section counts.
    3. Search (both locales, diacritic/case-ignore, topic-first) + section/link rendering (semantic structure, external affordance).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/bookmarks/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema, slug derivation/uniqueness, canonical merge, URL validation, search match, MRU/favorite immutable ops.
    2. scripts/generate-bookmarks.mjs + content/bookmarks/{_TEMPLATE,_TEMPLATE_en,README} + seed (하네스 엔지니어링, 프런트엔드 리소스, 디자인 참고, 무료 개발 도구). Validation tests (pair-missing, <3-links, invalid-URL → fail). predev/prebuild wire.
    3. tools.bookmarks.* messages (ko/en): tabs, search, toasts, empty states, how-to, FAQ.
    4. useBookmarksCatalog hook (dynamic import + localStorage favorites/recents + in-memory fallback).
    5. BookmarksSearch + TopicTabs + TopicsList/TopicCard (roving tabindex, states) + empty states.
    6. TopicDetail: sections + link rows (semantic structure, external icon, responsive, hover/focus states).
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus).
    8. BookmarksIntro/HowTo/Faq + SoftwareApplication + FAQPage + ItemList JSON-LD via platform lib/seo.ts.
    9. Registry status→coming_soon (→live on launch); slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_topics note="initial content — author fine-tunes but start with these">
    - 하네스 엔지니어링: sub-sections "메타 스킬" + "스킬" + "기법"; 8+ links total (e.g., agent orchestration, TDD, code review).
    - 프런트엔드 리소스: "컴포넌트 라이브러리" + "CSS" + "성능"; 8+ links (React, Tailwind, Lighthouse, etc.).
    - 디자인 참고: "디자인 시스템" + "영감" + "도구"; 6+ links (Figma, design tokens, reference sites).
    - 무료 개발 도구: "코드 생성" + "배포" + "분석"; 6+ links (GitHub, Vercel, etc.).
  </seed_topics>
  <generator_sketch>
    ```javascript
    // scripts/generate-bookmarks.mjs (outline)
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) bookmarks/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod TopicFileFront.parse (collect errors)
    // 3) mergePair(ko, en): canonical rule (ko slug), resolveSlug
    // 4) validate: pair-integrity / required-fields / section/link counts / URL validity (http(s)) / slug-unique → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(bookmarks.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/favorites); generator validation fixtures (pair-missing/<3-links/invalid-URL cases); component catalog-injected mocks; E2E scenarios 1–5; localStorage jsdom-isolated.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

572 lines, English, final.
