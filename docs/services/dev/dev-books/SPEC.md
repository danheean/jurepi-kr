# 개발 추천 도서 (Developer Book Picks — Topic-organized Book Recommendations) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **개발 추천 도서 / Developer Book Picks** (Korean display name: **개발 추천 도서**; English display name: *Developer Book Picks*) — a curated, editor-authored book recommendation directory organized by topic (분야/field). Content is managed as markdown pairs (`<topic>.md` + `<topic>_en.md`), with structured book collections per topic, and at build time a generator reads the folder, validates metadata, and emits a static catalog. The tool mounts as a client-side SPA offering topic tabs, search (primarily by topic and book title), favorites/recents, and topic detail view that renders sections and book rows with structured metadata (title, authors, year, level, description, optional external link).
>
> Internal service codename: `dev-books`. Registry id: `dev-books`. Public URL slug: `/[locale]/tools/dev-books`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/bookmarks/SPEC.md`](../bookmarks/SPEC.md)

```xml
<project_specification>

<project_name>개발 추천 도서 (Developer Book Picks) — Topic-organized Book Recommendations rendered as section+book-item lists (Jurepi tool, codename dev-books, registry id dev-books)</project_name>

<overview>
개발 추천 도서 (Developer Book Picks) brings together curated, hand-picked developer books organized by topic — resources for learning clean code, architecture, algorithms, career growth, and more. A visitor searches for a field ("클린 코드·리팩터링", "소프트웨어 아키텍처", "알고리즘·CS 기초", "개발자 커리어"), browses available topic collections, opens one, and reads subsections of book recommendations — each book labeled with title, authors, publication year, difficulty level, recommendation reason, and optional external link. Each topic is **editor-authored markdown** — not user-generated, not auto-indexed, not a crowdsourced list — with transparent curation intent. This solves "What are the best books for learning X?"

CRITICAL (trust surface — editorial intent): every topic is curated by an editor with a purpose. The directory is NOT a crowdsourced "awesome books" accumulator (no user submissions, no voting). Each book is hand-picked with a written recommendation reason. The topic's introduction/description should be visible and emphasize the curator's intent.

CRITICAL (presentation — structured book lists): book collections render as clean, scannable **sections** within each topic, where each section is a heading + a list of **book rows** (title, authors, year, level badge, description, optional external-link icon, rel=noopener target=_blank). No book is hidden; all are immediately visible in the detail view. Rows are readable and tappable; hover states provide feedback.

The tool's content model is fundamental: topics and books are NOT code — they are **markdown files**. Create pairs in the content folder (`<topic>.md` for Korean + `<topic>_en.md` for English), with structured frontmatter (title, description, sections[heading, books[]]), and at **build time** a generator scans the folder, parses the frontmatter, validates metadata, and bakes it into a static catalog (dev-books.generated.json). The tool then dynamically imports that catalog to render the list, search, and detail views. This means "drop a file in the folder and it appears" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The topic catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + recents), and nothing is ever sent over the network. NO user submissions, NO crowdsourcing, NO real-time updates.

CRITICAL (content model, invariants): every topic MUST have a Korean file and an English file as a matching pair. Each file carries a non-empty `title`, `description`, and `sections` (≥1 section per topic, ≥3 books total). Each book has `title` (required, localized per file), `authors` (array of strings, required), `year` (number, required), `description` (required, plain text ≤150 chars — recommendation reason), `level` (string enum: "beginner"/"intermediate"/"advanced", required), `publisher` (optional), `isbn` (optional), and `link` (optional, valid http(s) URL, must include source domain — official site/publisher/bookstore, no affiliate links). The build generator validates pair integrity, required fields, URL validity (http(s), rel=noopener for rendering), book year range (1900–current year), and **fails the build** if ANY rule is broken.

CRITICAL (SPA, usability-first): every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — topic switching, search, opening topics, pinning favorites — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the topic list is visible, search is one keystroke away ("/"), and every topic is reachable in under a second.
</overview>

<platform_integration>
  - Route: /[locale]/tools/dev-books (SSG; registry slug "dev-books", id "dev-books", status "coming_soon", accent "sky", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons for hub and spoke pages.
  - Consumes: i18n namespace `tools.dev-books.*` (UI chrome strings: topics, search, how-to, FAQ, level labels, book field labels — NOT topic content or book data; that comes from markdown in dev-books.generated.json); the in_content AdSlot below the tool.
  - Platform dependency (category note): this tool lives in the `'dev'` category (개발) — matching the existing bookmarks tool. The only platform change is adding ONE ToolMeta registry entry, a slug→component branch in the tool route, a generateMetadata branch, and sitemap spoke collection support.
  - Spoke pages (Phase 1): Per-topic static routes `/[locale]/tools/dev-books/<topic-slug>` — managed by generateStaticParams from dev-books.generated.json catalog. Each spoke has unique canonical/hreflang/meta, SSR Intro/Description/Books content (gate-free), ItemList JSON-LD (Book type), and ShareButtons.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed topic catalog (pairs: `<topic>.md` + `<topic>_en.md`) in `content/dev-books/`.
    - Build-time generator: folder scan → frontmatter parse → metadata validation (title/authors/year/level) → catalog merge → code-split static catalog (dev-books.generated.json). Wired to prebuild/predev. Validation: pair integrity, required fields, year range (1900–current), ISBN format (if present), URL validity (http(s), no affiliate).
    - Four seed topics with ≥3 books each (12+ books total): **클린 코드·리팩터링** (Clean Code, Refactoring, Code Complete), **소프트웨어 아키텍처** (Clean Architecture, POSA, Design Patterns), **알고리즘·CS 기초** (Introduction to Algorithms, Computer Systems, Discrete Math), **개발자 커리어·성장** (The Pragmatic Programmer, Cracking the Coding Interview, Soft Skills).
    - **Topic markdown templates**: annotated markdown templates (`content/dev-books/_TEMPLATE.md`, `content/dev-books/_TEMPLATE_en.md`) and authoring README to make adding new topics easy.
    - Topic tabs: derived from unique topics in the catalog (All / Topics / … / Favorites, Recent). Virtual tabs: Favorites (when pinned), Recent (when viewed).
    - Search: topic titles, descriptions, section headings, book titles, author names across BOTH locales, real-time filter (debounced). Case and diacritic insensitive. PRIMARY: topic search; SECONDARY: book title/authors within topics.
    - Detail view: topic title, introduction/description, **sections** (each section: heading + book-row list), where each book row shows title, authors, year, level badge (beginner/intermediate/advanced), recommendation description, and optional external-link affordance (rel=noopener target=_blank).
    - Favorites (pinned topics) + recent views — localStorage persistence, auto-prune of unknown topic ids.
    - Full keyboard support: "/" search focus, arrow keys topic/book navigation, Enter to open, Esc to clear/close.
    - Tool-specific SEO long-form (dev-books intro, topic descriptions, "What books for X?") + FAQ + **ItemList / ListItem JSON-LD with Book type** (schema.org, ideal for GEO/AI citation), localized ko/en.
    - Per-topic static spoke pages (hub+spoke model): `/[locale]/tools/dev-books/<topic-slug>` with unique canonical, hreflang, generateMetadata, SSR description + book sections, ItemList+BreadcrumbList JSON-LD, and ShareButtons.
    - Spoke sitemap: app/sitemap.ts explicitly imports dev-books.generated.json and adds spoke URLs via absoluteEntityUrl (dev-books pattern, not automatic).
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - User browser-based book add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - User submissions of topics or books (NO crowdsourced / social features).
    - Real-time book availability checking (in-stock, price) or cover image scraping. Content is static, authored, reviewed, versioned via git.
    - Individual book deep-link pages (e.g., /tools/dev-books/clean-code-by-uncle-bob) — Phase 2 candidate. Phase 1 is topic-level spokes only.
    - Rich HTML/script in markdown body. Descriptions are structured fields (plain text / limited inline emphasis), rendered safely.
  </out_of_scope>
  <future_considerations>
    - Per-book static deep-link routes + individual BookDetails pages (SEO) — Phase 2.
    - Topic expansion: data science, systems, web services, games, etc. (catalog only, schema unchanged).
    - Book availability aggregator / price tracker — Phase 2 (requires 3rd-party integration; currently static).
    - Reading progress tracker / bookmarks per reader — Phase 3 (requires accounts).
    - Editor annotations or reading guides per book — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Topics live as markdown pairs in `content/dev-books/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Books and section titles are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged topic-record invariants (3) book-item schema. Year range (1900–current year), ISBN format (if present), URL validation (valid http(s), no affiliate domains). Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/dev-books/data/dev-books.generated.json), dynamically imported only on this tool's route so topic content never enters the global i18n message bundle (protects platform JS budget — same pattern as rankings/new-word/bookmarks).</catalog>
    <animation>Native CSS transitions only (card hover lift, book row focus, detail fade-in). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-dev-books.mjs                    # Build time: scan content/dev-books/* → parse → validate metadata → emit dev-books.generated.json. Wired to prebuild/predev.
content/dev-books/                            # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md             # Templates (excluded by generator)
├── README.md                                 # Authoring guide (topic format, book structure, metadata rules, ISBN/URL validation)
└── topics/*.md  *_en.md                      # Topic pairs
src/
├── lib/dev-books/                            # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                             # zod: TopicFileFront(ko/en), Book, MergedTopic, StoreSchema + STORE_VERSION
│   ├── merge.ts                              # mergePair(koFront, enFront): apply canonical rule → MergedTopic; validatePair
│   ├── slug.ts                               # slugify(title), resolveSlug(front, filename)
│   ├── catalog.ts                            # Typed access: allTopics, byId, byAll, topics(); topic enum
│   ├── search.ts                             # filterTopics(topics, query, locale): title+description+section-headings+book-titles+authors, both locales; normalize
│   └── favorites.ts                          # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(ids, catalog)
├── components/tools/dev-books/
│   ├── DevBooks.tsx                          # Orchestrator (Client Component) — query/selectedId state + useDevBooksCatalog() owner
│   ├── useDevBooksCatalog.ts                 # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── TopicTabs.tsx                         # All / Topics / (Favorites) / (Recent) pills
│   ├── DevBooksSearch.tsx                    # Search input ("/" focus, clear, result count, aria)
│   ├── TopicsList.tsx                        # Responsive card list; roving tabindex keyboard nav
│   ├── TopicCard.tsx                         # One-topic card: title, description, section count, book count, star + compact tag line
│   ├── TopicDetail.tsx                       # Selected topic: title, description, then TopicSections
│   ├── TopicSections.tsx                     # Rendered sections within topic detail
│   ├── BookRow.tsx                           # One book row: title, authors, year, level badge, description, external-link icon, rel=noopener
│   ├── DevBooksIntro.tsx                     # H1 + lead (SEO; server-render where possible)
│   ├── DevBooksHowTo.tsx                     # "What are curated developer books?" / "Hand-picked recommendations" (SEO long-form)
│   ├── DevBooksFaq.tsx                       # Q&A + FAQPage + ItemList JSON-LD
│   ├── DevBooksSpoke.tsx                     # [topic] page server component — SSR description + sections, JSON-LD, breadcrumb
│   └── data/
│       └── dev-books.generated.json          # Generated artifact — [MergedTopic...]
└── i18n/messages/{ko,en}.json                # tools.dev-books.* UI chrome (tabs, search, field labels, level names, toasts, how-to, FAQ)
</file_structure>

<core_data_entities>
  <topic_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — topic title (that locale)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - description: string (required, non-empty) — curator's intent, plain text ≤200 chars
    - sections: array (required, ≥1)
      - heading: string (required) — section subheading within topic (e.g., "입문서", "클린 코드", "수준별")
      - books: array (required, ≥1 book per section, ≥3 books total per topic)
        - title: string (required) — book title (localized per file: Korean translation or English original)
        - authors: array of strings (required, ≥1) — author names
        - year: number (required, 1900 ≤ year ≤ current year)
        - description: string (required, plain text ≤150 chars) — reason/recommendation
        - level: string enum (required) — one of "beginner" | "intermediate" | "advanced"
        - publisher?: string (optional)
        - isbn?: string (optional, format: 10 or 13 digits if present)
        - link?: string (optional, valid http(s) URL, source domain only — no affiliate, rel=noopener)
    INVARIANT: title/description non-empty, sections ≥1, books ≥3 total, all URLs valid http(s), year in range, authors non-empty, level valid enum. zod parse failure → collect as error (build failure candidate).
  </topic_file_front>
  <merged_topic note="ko+en merge result; catalog record; dev-books.generated.json item">
    - slug: string — unique identifier (unique per locale; favorites/recents reference)
    - ko: { title, description, sections: [{ heading, books: [{ title, authors, year, description, level, publisher?, isbn?, link? }, ...] }, ...] }
    - en: { title, description, sections: [...] } — title/description/sections are PER-LOCALE (localized like the rest of the app's content); EN inherits KO slug if absent. Sections/books may differ (e.g., "클린 코드·리팩터링" vs "Clean Code & Refactoring" may recommend different books or regions).
    INVARIANT — PAIR/FIELDS/UNIQUENESS: every record has both ko+en; each has title + description + ≥1 section + ≥3 books total; slug unique. Violation → generator build failure.
  </merged_topic>
  <dev_books_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — topic slugs, insertion order
    - recents: string[] — topic slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastQuery?: string; createdAt: number }
    localStorage key: `jurepi-dev-books`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown ids pruned on load.
  </dev_books_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; BOOK_DESC_MAX = 150; SECTION_MAX = 10; BOOKS_MIN_PER_TOPIC = 3; CURRENT_YEAR = new Date().getFullYear().
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/dev-books" page="DevBooks (hub, SPA)" />
    <route path="/:locale/tools/dev-books/:topic" page="DevBooksSpoke [topic] (static spoke, SSR)" note="generateStaticParams from dev-books.generated.json; one per topic slug per locale" />
  </public_routes>
  <note>Dual-route: hub (SPA, no spoke generation) for primary navigation, and per-topic spokes (SSG static, SSR SEO content) for discoverability. locale ∈ {ko, en}. Platform generateStaticParams iterates registry and dev-books.generated.json to SSG. Spoke URLs carry unique canonical/hreflang.</note>
</route_definitions>

<component_hierarchy>
  <dev_books_hub>                 <!-- "use client"; owns query + selectedId + useDevBooksCatalog() state -->
    <dev_books_intro />           <!-- H1 + lead (SEO; server-render where possible) -->
    <dev_books_layout>            <!-- Selector (list) on top, full-width detail below when selected -->
      <dev_books_main>            <!-- Left/top column -->
        <dev_books_search />      <!-- "/" focus, clear, result count -->
        <topic_tabs />            <!-- All / Topics / Favorites / Recent -->
        <topics_list>             <!-- Roving tabindex cards -->
          <topic_card />          <!-- × N: click = select; star = favorite -->
          <empty_state />         <!-- No results / empty favorites -->
        </topics_list>
      </dev_books_main>
      <topic_detail>              <!-- Full-width panel below the list; shown only when a topic is selected -->
        <topic_sections>          <!-- Sections and book rows -->
          <book_row />            <!-- × N: title, authors, year, level badge, desc, external link icon -->
        </topic_sections>
        <share_buttons />          <!-- SNS share (via ShareButtons component, url=absoluteEntityUrl for spoke) -->
      </topic_detail>
    </dev_books_layout>
    <dev_books_how_to />          <!-- SEO long-form -->
    <dev_books_faq />             <!-- FAQPage + ItemList JSON-LD -->
  </dev_books_hub>
  <dev_books_spoke>               <!-- Server component for [topic] route -->
    <breadcrumb_list />           <!-- BreadcrumbList JSON-LD -->
    <spoke_header>                <!-- Topic title + description (SSR) -->
      <share_buttons />           <!-- SNS share (url=absoluteEntityUrl for this spoke) -->
    </spoke_header>
    <book_sections>               <!-- Sections + book rows (SSR, gate-free) -->
      <book_row />                <!-- × N -->
    </book_sections>
    <structured_data>             <!-- ItemList JSON-LD with Book items (url==canonical) -->
  </dev_books_spoke>
  <note>Hub: SPA within tool, search/select = local state switch, NOT route navigation. Spoke: static SSR page, unique per topic, gate-free content (SEO + JSON-LD).</note>
</component_hierarchy>

<pages_and_interfaces>
  <dev_books_intro>
    - Eyebrow: "개발 도서 도구" / "DEVELOPER BOOKS TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "개발 추천 도서" / "Developer Book Picks" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg: "클린 코드·아키텍처·알고리즘·커리어 등 개발자 성장에 필요한 신뢰할 수 있는 도서 추천을 찾아보세요." / English equivalent.
  </dev_books_intro>

  <dev_books_search>
    - DESIGN text-input style, main column full width, leading Search icon (20px), placeholder "주제·책·저자로 검색…" / "Search topics, books, authors…".
    - Focus on "/" keypress. Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption.
    - aria: role="searchbox", aria-controls the list.
  </dev_books_search>

  <topic_tabs>
    - Horizontal pill row. Order: "전체"(all) → topics (derived from catalog) → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active.
  </topic_tabs>

  <topics_list>
    - Responsive grid: 1-column <768px; 2-column ≥768px. Full container width (the detail sits below, not beside).
    - Each card: title (headline 18–20px var(--text)/700), description (clamp 2 lines var(--text-secondary) 14–15px), compact tag line showing section count + book count (e.g., "3 섹션 · 12 권"), and a star (favorite toggle).
    - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, shadow --shadow-card.
    - States: hover translateY(-2px) + --shadow-card-hover; focus 2px var(--focus-ring); selected 2px var(--accent-sky) ring.
    - Roving tabindex; ArrowUp/Down move; Enter/Space open detail; "f" toggle favorite.
    - empty_state: "'{query}'에 해당하는 주제가 없어요" / "No topics found"; or "별을 눌러 즐겨찾기를 저장하세요".
  </topics_list>

  <topic_detail>
    - Placement: a FULL-WIDTH panel rendered below the selector (search + tabs + card list), shown only once a topic is selected. RATIONALE: sections + books are wide and numerous; a sticky sidebar cramps the view — the book rows wrap. Full width lets all content breathe. Same layout on desktop and mobile (single column, stacked).
    - Panel surface: var(--surface), radius var(--radius-xxl), padding 24px (16px on mobile), 1px var(--hairline), shadow --shadow-card.
    - Deselect affordance: X button (lg:hidden — mobile) to clear the selection; Esc also clears.
    - Content (top → bottom):
      1. Title: large headline 28px var(--text).
      2. Description: body 16px var(--text-secondary), 1–2 lines — curator's intent.
      3. Sections (stacked):
         - Section heading: eyebrow/label 12px/700 var(--brand-ink) or accent color per topic.
         - Book rows (`<div role="region">` or unstyled list):
           · Book title: 16px/600 var(--text), tappable.
           · Authors & year: 14px var(--text-secondary) "Author Name(s), Year".
           · Level badge: small pill (beginner=sky/intermediate=violet/advanced=rose), 12px/600 var(--on-accent), e.g. "입문" / "Beginner".
           · Description: 14px var(--text-secondary) — recommendation reason.
           · Optional external-link icon (lucide, 16–18px var(--text-muted)), trailing; aria-label "외부 링크" / "External link"; rel=noopener target=_blank.
         - Row states: hover bg var(--surface-muted); focus 2px var(--focus-ring); active text-primary.
      4. Empty/initial (not selected): hint "주제를 선택하면 도서 모음이 여기에 표시됩니다."
    - Responsive: ≥768px full-width panel; <768px same single-column stacked. Book rows never overflow at 320px.
  </topic_detail>

  <dev_books_spoke>
    - Static page (SSG) per topic, generated from dev-books.generated.json.
    - Unique canonical URL: `apps.jurepi.kr/[locale]/tools/dev-books/[topic-slug]`.
    - Breadcrumb: "Tools > Developer Book Picks > [Topic Title]" (BreadcrumbList JSON-LD, url==canonical).
    - Header: H1 topic title (28px/700), description (16px/text-secondary).
    - Book sections: same structure as hub detail (sections → book rows, full SSR, no gates).
    - Footer: ShareButtons (url=absoluteEntityUrl, pre-configured for this spoke).
    - JSON-LD: ItemList (name=topic title, description=topic description, itemListElement=[Book, Book, ...] with name/author/datePublished/isbn), url==canonical.
  </dev_books_spoke>

  <keyboard_shortcuts_reference>
    - "/" → search input focus (when not typing).
    - Arrow keys → topic card/book focus move.
    - Enter / Space → open focused topic detail.
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search or deselect the open topic detail.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-dev-books.mjs">
    - Scan content/dev-books/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → zod TopicFileFront validate (books schema: title/authors/year/description/level/link).
    - mergePair: apply canonical rule (ko slug canonical + en inherit if absent; description/sections PER-LOCALE). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, required fields, section/book counts (≥1 section, ≥3 books total per topic), URL validity (http(s), no affiliate), year range (1900–current), ISBN format (if present), level enum (beginner/intermediate/advanced), author non-empty, slug uniqueness.
    - Sort (slug alphabetical / title order), emit dev-books.generated.json. Deterministic.
    - package.json wire: "predev": "node scripts/generate-dev-books.mjs", "prebuild": "node scripts/generate-dev-books.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allTopics(): MergedTopic[] (generation order). byId(slug). topics(): live topic ids in catalog.
    - Tests assert catalog uniqueness, locale completeness.
  </catalog_access>
  <search>
    - filterTopics(topics, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.title, en.title, ko.description, en.description, ko.sections[].heading, en.sections[].heading, ko/en.sections[].books[].title, ko/en.sections[].books[].authors (join + search). PRIMARY match = topic title/desc; SECONDARY = book titles + author names within sections. Stable order.
    - Compose with tab: list = filterTopics(all, query) or filterTopics(favorites subset, query), etc.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(ids, catalog): drop ids not in current catalog (run on load).
    - Recent push: when detail opens (select). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useDevBooksCatalog>
    - Mount: dynamic catalog import; read `jurepi-dev-books` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, selectedId + select(id), toggleFavorite, favorites, recents, lastQuery.
  </persistence_adapter>
  <i18n>All UI chrome from tools.dev-books.* (ko/en): tabs, search, level names (입문/중급/심화 vs Beginner/Intermediate/Advanced), toasts, empty states, how-to, FAQ. Topic title/descriptions/sections/books come from markdown (dev-books.generated.json), NOT i18n messages.</i18n>
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
    - Per-tool identity accent is SKY (var(--accent-sky) / var(--accent-sky-soft)). Intro icon tile, card selected bar, favorite star (filled), level badge for "beginner". (Category is `dev`; this tool uses sky as its per-tool identity accent to differentiate from sibling dev tools.)
    - Intermediate level badge: violet (var(--accent-violet) / --accent-violet-soft).
    - Advanced level badge: rose (var(--accent-rose) / --accent-rose-soft).
    - CTAs (primary buttons, active tabs) stay brand honey-gold var(--brand).
    - Topic badge color: sky-tinted pill per topic (optional; can be monochrome).
  </accent_usage>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius --radius-xxl; book rows var(--surface-muted) on hover. Soft brand-tinted shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); topic title (card 18–20px / detail 28px)/700; book title 16px/600; authors+year 14px/text-secondary; description 14px; section heading eyebrow 12px/700.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail fade-in 150ms on selection. All gated by prefers-reduced-motion.</motion>
  <accessibility>Card/star/book row = labeled real buttons; roving-tabindex list; favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); links rel=noopener target=_blank. Sections use semantic structure (headings + lists), not divs faking layout. Level badges use aria-label (e.g., aria-label="Beginner level") for screen reader context.</accessibility>
  <responsive>
    - All breakpoints: single column — selector (search + tabs + card grid) on top, full-width detail section below when a topic is selected. Card grid: 1-col <768px, 2-col ≥768px.
    - The detail's book sections are the responsive unit: full width ≥768px; <768px single column (no horizontal scroll). No page overflow at 320px.
  </responsive>
  <atmosphere>Bright, trustworthy "curated book hub": generous card spacing, clear descriptions. The BROWSE layer is discoverable, tappable topic cards (not a dense list); the DETAIL layer renders clean, scannable book rows (title, authors, year, level, reason) anchored by the topic's curator intent. Trust-first, educational.</atmosphere>
  <icons>lucide-react: Search, Star/StarOff (favorite), ExternalLink (book links), BookOpen (tool card icon), ChevronRight or ArrowUpRight (link affordance). Default 20px (16–18px inside detail), stroke 1.75, currentColor. Registry card icon: `BookOpen`. Level badge icons (optional): Lightbulb (beginner), Zap (intermediate), Flame (advanced).</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Title/authors/description/section headings render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Links rendered as `<a href={url} rel="noopener target="_blank" />` (external, safe).
    - Generator validates frontmatter with zod (type/required/length/year range/URL format — valid http(s) only, no affiliate domains).
  </input>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes topic/book data beyond view count.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness.</content_integrity>
  <affiliate_policy>External links MUST NOT include affiliate parameters (no amazon.co.kr/?tag=jurepi, no yes24?affiliate=jurepi, etc.). Generator validates link URLs against common affiliate domain patterns and rejects during build.</affiliate_policy>
  <note>No secrets, no network access, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-browse friction. Unknown ids auto-pruned.</favorites_recents>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite — mouse-free power.</keyboard_first>
  <level_badges>Visual indicators (sky=beginner, violet=intermediate, rose=advanced) + aria-label for screen readers — quick difficulty assessment.</level_badges>
  <structured_data>ItemList + each topic ListItem with Book type (name, author, datePublished, isbn) — search engine recognizes book collections and AI citation (discoverability = DESIGN principle ③).</structured_data>
  <external_links>Links marked rel=noopener; trusted curator sources (official publishers, Amazon, Yes24, library catalogs, etc.) encoded in markdown. No affiliate links.</external_links>
  <spoke_discovery>Per-topic static pages (SSG) — each topic appears in sitemap and gets unique SEO/JSON-LD, enabling search engines and AI to cite individual book collections by topic. Hub + Spokes model (Phase 1: topics; Phase 2: individual books).</spoke_discovery>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → topic list auto-compose</description>
    <steps>
      1. clean-code.md + clean-code_en.md exist in content/dev-books/ with description, ≥1 section, ≥3 books total.
      2. pnpm dev → predev generator runs → dev-books.generated.json has merged record (ko/en title, description, sections with books).
      3. Visit /ko/tools/dev-books → hub list renders "클린 코드·리팩터링" card with book count.
      4. Add new pair architecture(.md/_en.md), rebuild → hub list auto-updates (no code edit).
      5. Missing pair or <3 books or invalid year/URL → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, empty states</description>
    <steps>
      1. Type "아키텍처" in search → narrows to matching topics/books; result count updates; aria-live announces.
      2. Clear, click "All" → full topic list.
      3. Type "asdfqwer" → empty "'asdfqwer'에 해당하는" + clear; clear restores.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Detail — sections and book rows</description>
    <steps>
      1. Click "클린 코드·리팩터링" card → detail opens: title + description (curator intent), then sections.
      2. Each section: heading (e.g., "입문서") + book rows (title, authors, year, level badge, desc, external-link icon if link present).
      3. Each book row is clickable/hoverable, level badge distinguishable (sky/violet/rose), rel=noopener target=_blank; opens in new tab.
      4. At 320px the rows stack without horizontal scroll; book info remains readable.
      5. Screen reader announces section structure + book affordance + level badge.
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
    <description>Spoke pages, SEO (JSON-LD), i18n, locale swap</description>
    <steps>
      1. Visit /ko/tools/dev-books/clean-code → static spoke page with topic title + description (SSR, gate-free), book sections, canonical=apps.jurepi.kr/ko/tools/dev-books/clean-code, hreflang to /en variant.
      2. Switch to /en/tools/dev-books/clean-code → English book data, metadata updated, unique canonical/hreflang.
      3. HTML has SoftwareApplication (hub meta) + ItemList with Book items (title/author/datePublished/isbn); topic-level code-split chunk (not global i18n).
      4. Sitemap.xml includes both hub + all spokes (8 URLs for 4 topics × ko/en + 1 hub × ko/en = 10 total); lastmod only for statically-authored dates.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<topic>.md` + `<topic>_en.md` pair in content folder, rebuild, auto-reflect in hub list/search/detail + spoke SSG with zero code change; generator validates pair/structure/books/year/links, fails build with clear message on violation.</content_model>
  <functionality>Searchable topic + book list (both locales, search-first); detail renders sections + book rows (titles, authors, year, level badge, descriptions, external affordance); localStorage favorites + recent; seed 4 topics × 3+ books each (12+ books total).</functionality>
  <trust_surface>CRITICAL: every topic detail shows curator's intent (description, organized sections); every book labeled with title + authors + year + level + recommendation reason. Editor-authored, not crowdsourced. No affiliate links.</trust_surface>
  <user_experience>Search/filter instant; cards readable; ≥44px targets; visible focus; book rows never overflow at 320px; SPA hub — no route reload on interaction; spoke pages are static/fast (SSG, no dynamic load).</user_experience>
  <technical_quality>lib/dev-books/* pure ≥80% unit coverage (schema/merge/slug/search/favorites, book validation); generator validation tests (pair-missing, <3-books, invalid-year/url/level → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; sky identity + brand honey-gold CTA; level badges (sky/violet/rose); clean book rows (styled, focused states, external icon — intentional); text-node render only.</visual_design>
  <accessibility>Full keyboard (roving list, "/", Enter, "f", Esc); aria-live state; labeled buttons; level badge aria-labels; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Hub + spokes within platform budget; catalog dynamic import; CLS unaffected; LCP < 2.5s; spokes are static (0 runtime JS per topic beyond platform shell).</performance>
  <seo_geo>Hub + spokes each have unique canonical/hreflang; JSON-LD (SoftwareApplication hub, ItemList+Book spoke); book authors/year/isbn in JSON-LD for AI citation; sitemap includes all spokes (app/sitemap.ts explicitly); llms.txt registered.</seo_geo>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-dev-books.mjs to freshen dev-books.generated.json. /[locale]/tools/dev-books (hub) pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" initially, "live" on launch). /[locale]/tools/dev-books/[topic] (spokes) pre-rendered via generateStaticParams sourcing dev-books.generated.json catalog, one per topic slug per locale (e.g., 4 topics × 2 locales = 8 spoke routes).</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category already exists; 'sky' is this tool's per-tool accent.
    {
      id: 'dev-books',
      slug: 'dev-books',
      category: 'dev',
      icon: 'BookOpen',
      accent: 'sky',
      status: 'coming_soon',    // 'live' when complete
      isNew: true,
      order: 19,
      keywords: ['도서','책','추천','클린코드','아키텍처','알고리즘','커리어','성장','개발자','books','recommendations','clean code','architecture','algorithms','career','developer','dev','tools','learning'],
    },
    ```
    Also add slug→component branches (<DevBooks/> hub, <DevBooksSpoke/> spoke route) and generateMetadata branches in tool route.
  </platform_registry_change>
  <sitemap_integration note="CRITICAL: not automatic">
    ```typescript
    // app/sitemap.ts — add explicit dev-books collection block (parallel to bookmarks/rankings/new-word)
    import devBooksData from '@/components/tools/dev-books/data/dev-books.generated.json';
    
    export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
      // ... existing entries (hub routes, static pages, etc.)
      
      // Dev-books hub (2 locales)
      const devBooksHub: MetadataRoute.Sitemap = ['ko', 'en'].map(locale => ({
        url: seo.absoluteUrl(`/${locale}/tools/dev-books`),
        lastModified: new Date(),
        alternates: {
          languages: {
            ko: seo.absoluteUrl('/ko/tools/dev-books'),
            en: seo.absoluteUrl('/en/tools/dev-books'),
          },
        },
      }));
      
      // Dev-books spokes (4 topics × 2 locales = 8 routes)
      const devBooksSpokes: MetadataRoute.Sitemap = devBooksData.flatMap(topic =>
        ['ko', 'en'].map(locale => ({
          url: seo.absoluteEntityUrl(topic.slug, locale, 'dev-books'),
          lastModified: new Date(),
          alternates: {
            languages: {
              ko: seo.absoluteEntityUrl(topic.slug, 'ko', 'dev-books'),
              en: seo.absoluteEntityUrl(topic.slug, 'en', 'dev-books'),
            },
          },
        }))
      );
      
      return [...existingEntries, ...devBooksHub, ...devBooksSpokes];
    }
    ```
    Update sitemap.test.ts expectations accordingly (count = hubEntries + 8 spokes).
  </sitemap_integration>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate (URLs, year range, levels, structure) → dev-books.generated.json. Entire tool depends on this.
    2. Pair/canonical-merge rule (ko slug canonical, en inherit) + book metadata validation (year 1900–current, level enum, URL safe) + book/section counts.
    3. Search (both locales, diacritic/case-ignore, topic-first + book-title-second) + section/book rendering (semantic structure, level badge, external affordance).
    4. Sitemap spoke collection: explicit dev-books.generated.json import + absoluteEntityUrl loop (not automatic from schema).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/dev-books/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema (book fields + level enum), slug derivation/uniqueness, canonical merge, URL/year/level validation, search match, MRU/favorite immutable ops.
    2. scripts/generate-dev-books.mjs + content/dev-books/{_TEMPLATE,_TEMPLATE_en,README} + seed (클린 코드·리팩터링, 소프트웨어 아키텍처, 알고리즘·CS 기초, 개발자 커리어). Validation tests (pair-missing, <3-books, invalid-year/URL/level → fail). predev/prebuild wire.
    3. tools.dev-books.* messages (ko/en): tabs, search, level names, toasts, empty states, how-to, FAQ.
    4. useDevBooksCatalog hook (dynamic import + localStorage favorites/recents + in-memory fallback).
    5. DevBooksSearch + TopicTabs + TopicsList/TopicCard (roving tabindex, states).
    6. TopicDetail: sections + book rows (title, authors, year, level badge, description, external icon, responsive).
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus).
    8. DevBooksIntro/HowTo/Faq + SoftwareApplication + FAQPage + ItemList JSON-LD (hub) via platform lib/seo.ts.
    9. DevBooksSpoke ([topic] route, SSG generateStaticParams + SSR, BreadcrumbList + ItemList JSON-LD + ShareButtons).
    10. sitemap.ts explicit dev-books collection + spoke URLs.
    11. Registry status→coming_soon (→live on launch); hub + spoke route branches; E2E 1–5; visual regression 320/768/1024 both themes + both locales.
  </recommended_implementation_order>
  <seed_topics note="initial content — author fine-tunes but start with these">
    - 클린 코드·리팩터링: sub-sections "입문서" + "중급" + "심화"; 9+ books (Clean Code / Code Complete / Refactoring / Working Effectively with Legacy Code).
    - 소프트웨어 아키텍처: "기초" + "패턴" + "실전"; 9+ books (Clean Architecture / POSA / Design Patterns / Enterprise Integration Patterns).
    - 알고리즘·CS 기초: "수학·이산수학" + "알고리즘" + "시스템"; 9+ books (CLRS / Computer Systems / Concrete Mathematics / Algorithms Unlocked).
    - 개발자 커리어·성장: "프로답게 일하기" + "취업·면접" + "리더십"; 9+ books (The Pragmatic Programmer / Cracking the Coding Interview / The Manager's Path).
  </seed_topics>
  <generator_sketch>
    ```javascript
    // scripts/generate-dev-books.mjs (outline)
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) dev-books/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod TopicFileFront.parse with Book[] schema (collect errors)
    // 3) validateBook(book): year ∈ [1900, currentYear], level ∈ {beginner|intermediate|advanced}, URL valid http(s), authors non-empty, ISBN format (if present)
    // 4) mergePair(ko, en): canonical rule (ko slug), resolveSlug, localize book titles
    // 5) validate: pair-integrity / required-fields / section/book counts / year/level/URL validity / slug-unique → errors[]
    // 6) errors.length ? (stderr + process.exit(1)) : sorted-write(dev-books.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/favorites, book validation, level enum, year range); generator validation fixtures (pair-missing/<3-books/invalid-year/invalid-level/invalid-URL cases); component catalog-injected mocks; E2E scenarios 1–5 (hub + spokes); localStorage jsdom-isolated; both locales ko/en.</testing_strategy>
</key_implementation_notes>

</project_specification>
```
