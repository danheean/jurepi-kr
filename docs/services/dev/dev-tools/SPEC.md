# 개발 툴 추천 (Developer Tool Picks — Category-organized Tool Recommendations) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **개발 툴 추천 / Developer Tool Picks** (Korean display name: **개발 툴 추천**; English display name: *Developer Tool Picks*) — a curated, editor-authored developer-tool recommendation directory organized by category (분야: editors/IDEs, terminals, API clients, DB tools, AI coding assistants, DevOps, design, productivity, …). Content is managed as markdown pairs (`<category>.md` + `<category>_en.md`), with structured tool collections per category, and at build time a generator reads the folder, validates metadata, and emits a static catalog. The tool mounts as a client-side SPA offering category tabs, search (primarily by category and tool name), favorites/recents, and a category detail view that renders sections and tool rows with structured metadata (name, description, platforms, pricing, official link).
>
> Internal service codename: `dev-tools`. Registry id: `dev-tools`. Public URL slug: `/[locale]/tools/dev-tools`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/dev-books/SPEC.md`](../dev-books/SPEC.md)

```xml
<project_specification>

<project_name>개발 툴 추천 (Developer Tool Picks) — Category-organized Tool Recommendations rendered as section+tool-item lists (Jurepi tool, codename dev-tools, registry id dev-tools)</project_name>

<overview>
개발 툴 추천 (Developer Tool Picks) brings together curated, hand-picked developer tools organized by category — the editors, terminals, API clients, database GUIs, AI coding assistants, and productivity apps that working developers actually reach for. A visitor searches for a category ("에디터·IDE", "터미널", "API 클라이언트", "DB 도구", "AI 코딩 도구"), browses available category collections, opens one, and reads subsections of tool recommendations — each tool labeled with name, description (why it's recommended), supported platforms, pricing model, and an official link. Each category is **editor-authored markdown** — not user-generated, not auto-indexed, not a crowdsourced "awesome list" — with transparent curation intent. This solves "What tools should I use for X?"

CRITICAL (trust surface — editorial intent): every category is curated by an editor with a purpose. The directory is NOT a crowdsourced "awesome tools" accumulator (no user submissions, no voting). Each tool is hand-picked with a written recommendation reason. The category's introduction/description should be visible and emphasize the curator's intent.

CRITICAL (presentation — structured tool lists): tool collections render as clean, scannable **sections** within each category, where each section is a heading + a list of **tool rows** (name, description, platform badges, pricing badge, optional official-link icon, rel=noopener target=_blank). No tool is hidden; all are immediately visible in the detail view. Rows are readable and tappable; hover states provide feedback.

The tool's content model is fundamental: categories and tools are NOT code — they are **markdown files**. Create pairs in the content folder (`<category>.md` for Korean + `<category>_en.md` for English), with structured frontmatter (title, description, sections[heading, tools[]]), and at **build time** a generator scans the folder, parses the frontmatter, validates metadata, and bakes it into a static catalog (dev-tools.generated.json). The tool then dynamically imports that catalog to render the list, search, and detail views. This means "drop a file in the folder and it appears" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The category catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + recents), and nothing is ever sent over the network. NO user submissions, NO crowdsourcing, NO real-time updates.

CRITICAL (content model, invariants): every category MUST have a Korean file and an English file as a matching pair. Each file carries a non-empty `title`, `description`, and `sections` (≥1 section per category, ≥3 tools total). Each tool has `name` (required, localized per file), `description` (required, plain text ≤150 chars — recommendation reason), `platforms` (array of enum, required, ≥1: "macos"/"windows"/"linux"/"web"/"cli"/"mobile"), `pricing` (string enum, required: "free"/"freemium"/"paid"/"open-source"), `link` (required, valid http(s) URL — official site/repo, no affiliate links), and `tags` (optional array of strings). The build generator validates pair integrity, required fields, URL validity (http(s), rel=noopener for rendering), platform/pricing enums, and **fails the build** if ANY rule is broken.

CRITICAL (SPA, usability-first): every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — category switching, search, opening categories, pinning favorites — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the category list is visible, search is one keystroke away ("/"), and every category is reachable in under a second.
</overview>

<platform_integration>
  - Route: /[locale]/tools/dev-tools (SSG; registry slug "dev-tools", id "dev-tools", status "coming_soon", accent "mint", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons for hub and spoke pages.
  - Consumes: i18n namespace `tools.dev-tools.*` (UI chrome strings: tabs, search, how-to, FAQ, pricing labels, platform labels, tool field labels — NOT category content or tool data; that comes from markdown in dev-tools.generated.json); the in_content AdSlot below the tool. MUST include top-level `tools.dev-tools.title` and `tools.dev-tools.description` (consumed by the dashboard card, footer, and searchable-tools index).
  - Platform dependency (category note): this tool lives in the `'dev'` category (개발) — matching the existing dev-books/bookmarks/dev-people tools. The only platform change is adding ONE ToolMeta registry entry, a slug→component branch in the tool route, a generateMetadata branch, and sitemap spoke collection support.
  - Spoke pages (Phase 1): Per-category static routes `/[locale]/tools/dev-tools/<category-slug>` — managed by generateStaticParams from dev-tools.generated.json catalog. Each spoke has unique canonical/hreflang/meta, SSR Intro/Description/Tools content (gate-free), ItemList JSON-LD (SoftwareApplication items), and ShareButtons.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed category catalog (pairs: `<category>.md` + `<category>_en.md`) in `content/dev-tools/`.
    - Build-time generator: folder scan → frontmatter parse → metadata validation (name/platforms/pricing/link) → catalog merge → code-split static catalog (dev-tools.generated.json). Wired to prebuild/predev. Validation: pair integrity, required fields, platform enum, pricing enum, URL validity (http(s), no affiliate).
    - Four seed categories with ≥3 tools each (12+ tools total): **에디터·IDE** (VS Code, JetBrains IDEs, Neovim, Zed), **터미널·셸** (iTerm2, Warp, Ghostty, Oh My Zsh), **API·DB 도구** (Postman, Insomnia, TablePlus, DBeaver), **AI 코딩 도구** (Claude Code, Cursor, GitHub Copilot, Codex CLI).
    - **Category markdown templates**: annotated markdown templates (`content/dev-tools/_TEMPLATE.md`, `content/dev-tools/_TEMPLATE_en.md`) and authoring README to make adding new categories easy.
    - Category tabs: derived from unique categories in the catalog (All / Categories / … / Favorites, Recent). Virtual tabs: Favorites (when pinned), Recent (when viewed).
    - Search: category titles, descriptions, section headings, tool names, tags across BOTH locales, real-time filter (debounced). Case and diacritic insensitive. PRIMARY: category search; SECONDARY: tool name/tags within categories.
    - Detail view: category title, introduction/description, **sections** (each section: heading + tool-row list), where each tool row shows name, description, platform badges, pricing badge, and optional official-link affordance (rel=noopener target=_blank).
    - Favorites (pinned categories) + recent views — localStorage persistence, auto-prune of unknown category ids.
    - Full keyboard support: "/" search focus, arrow keys category/tool navigation, Enter to open, Esc to clear/close.
    - Tool-specific SEO long-form (dev-tools intro, category descriptions, "What tools for X?") + FAQ + **ItemList / ListItem JSON-LD with SoftwareApplication type** (schema.org, ideal for GEO/AI citation), localized ko/en.
    - Per-category static spoke pages (hub+spoke model): `/[locale]/tools/dev-tools/<category-slug>` with unique canonical, hreflang, generateMetadata, SSR description + tool sections, ItemList+BreadcrumbList JSON-LD, and ShareButtons.
    - Spoke sitemap: app/sitemap.ts explicitly imports dev-tools.generated.json and adds spoke URLs via absoluteEntityUrl (dev-books/rankings pattern, not automatic).
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - User browser-based tool add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - User submissions of categories or tools (NO crowdsourced / social features).
    - Real-time pricing/version scraping or logo/screenshot scraping. Content is static, authored, reviewed, versioned via git.
    - Individual tool deep-link pages (e.g., /tools/dev-tools/vs-code) — Phase 2 candidate. Phase 1 is category-level spokes only.
    - Rich HTML/script in markdown body. Descriptions are structured fields (plain text / limited inline emphasis), rendered safely.
    - Affiliate/sponsored placement. Curation is editorial and disclosed; no paid ranking.
  </out_of_scope>
  <future_considerations>
    - Per-tool static deep-link routes + individual tool detail pages (SEO) — Phase 2.
    - Category expansion: DevOps·CI/CD, design·prototyping, monitoring·observability, note-taking, etc. (catalog only, schema unchanged).
    - "Compare tools" side-by-side view within a section — Phase 2.
    - Community upvote/curated collections per reader — Phase 3 (requires accounts).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Categories live as markdown pairs in `content/dev-tools/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Tools and section titles are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged category-record invariants (3) tool-item schema. Platform enum, pricing enum, URL validation (valid http(s), no affiliate domains). Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/dev-tools/data/dev-tools.generated.json), dynamically imported only on this tool's route so category content never enters the global i18n message bundle (protects platform JS budget — same pattern as rankings/new-word/bookmarks/dev-books).</catalog>
    <animation>Native CSS transitions only (card hover lift, tool row focus, detail fade-in). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-dev-tools.mjs                    # Build time: scan content/dev-tools/* → parse → validate metadata → emit dev-tools.generated.json. Wired to prebuild/predev.
content/dev-tools/                            # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md             # Templates (excluded by generator)
├── README.md                                 # Authoring guide (category format, tool structure, metadata rules, platform/pricing/URL validation)
└── *.md  *_en.md                             # Category pairs
src/
├── lib/dev-tools/                            # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                             # zod: CategoryFileFront(ko/en), Tool, MergedCategory, StoreSchema + STORE_VERSION
│   ├── merge.ts                              # mergePair(koFront, enFront): apply canonical rule → MergedCategory; validatePair
│   ├── slug.ts                               # slugify(title), resolveSlug(front, filename)
│   ├── catalog.ts                            # Typed access: allCategories, byId, byAll, categories(); category enum (STATELESS: byId(catalog, slug))
│   ├── search.ts                             # filterCategories(categories, query, locale): title+description+section-headings+tool-names+tags, both locales; normalize
│   └── favorites.ts                          # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(ids, catalog)
├── components/tools/dev-tools/
│   ├── DevTools.tsx                          # Orchestrator (Client Component) — query/selectedId state + useDevToolsCatalog() owner
│   ├── useDevToolsCatalog.ts                 # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── CategoryTabs.tsx                      # All / Categories / (Favorites) / (Recent) pills
│   ├── DevToolsSearch.tsx                    # Search input ("/" focus, clear, result count, aria)
│   ├── CategoriesList.tsx                    # Responsive card list; roving tabindex keyboard nav
│   ├── CategoryCard.tsx                      # One-category card: title, description, section count, tool count, star + compact tag line
│   ├── CategoryDetail.tsx                    # Selected category: title, description, then CategorySections
│   ├── CategorySections.tsx                  # Rendered sections within category detail
│   ├── ToolRow.tsx                           # One tool row: name, description, platform badges, pricing badge, official-link icon, rel=noopener
│   ├── DevToolsIntro.tsx                     # H1 + lead (SEO; server-render where possible)
│   ├── DevToolsHowTo.tsx                     # "What are curated developer tools?" / "Hand-picked recommendations" (SEO long-form)
│   ├── DevToolsFaq.tsx                       # Q&A + FAQPage JSON-LD (visible faq.items, Faq is single owner)
│   ├── DevToolsSpoke.tsx                     # [category] page server component — SSR description + sections, JSON-LD, breadcrumb
│   └── data/
│       └── dev-tools.generated.json          # Generated artifact — [MergedCategory...]
└── i18n/messages/{ko,en}.json                # tools.dev-tools.* UI chrome (top-level title/description, tabs, search, field labels, platform/pricing names, toasts, how-to, FAQ)
</file_structure>

<core_data_entities>
  <category_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — category title (that locale)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - description: string (required, non-empty) — curator's intent, plain text ≤200 chars
    - sections: array (required, ≥1)
      - heading: string (required) — section subheading within category (e.g., "무료·오픈소스", "유료", "터미널 확장")
      - tools: array (required, ≥1 tool per section, ≥3 tools total per category)
        - name: string (required) — tool name (localized per file where meaningful; proper nouns may stay identical)
        - description: string (required, plain text ≤150 chars) — reason/recommendation
        - platforms: array of enum (required, ≥1) — subset of "macos" | "windows" | "linux" | "web" | "cli" | "mobile"
        - pricing: string enum (required) — one of "free" | "freemium" | "paid" | "open-source"
        - link: string (required, valid http(s) URL, official site/repo only — no affiliate, rel=noopener)
        - tags?: array of strings (optional)
    INVARIANT: title/description non-empty, sections ≥1, tools ≥3 total, all links valid http(s), platforms non-empty subset of enum, pricing valid enum. zod parse failure → collect as error (build failure candidate).
  </category_file_front>
  <merged_category note="ko+en merge result; catalog record; dev-tools.generated.json item">
    - slug: string — unique identifier (favorites/recents reference)
    - ko: { title, description, sections: [{ heading, tools: [{ name, description, platforms, pricing, link, tags? }, ...] }, ...] }
    - en: { title, description, sections: [...] } — title/description/sections are PER-LOCALE; EN inherits KO slug if absent. Sections/tools may differ per locale.
    INVARIANT — PAIR/FIELDS/UNIQUENESS: every record has both ko+en; each has title + description + ≥1 section + ≥3 tools total; slug unique. Violation → generator build failure.
  </merged_category>
  <dev_tools_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — category slugs, insertion order
    - recents: string[] — category slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastQuery?: string; createdAt: number }
    localStorage key: `jurepi-dev-tools`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown ids pruned on load.
  </dev_tools_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; TOOL_DESC_MAX = 150; SECTION_MAX = 10; TOOLS_MIN_PER_CATEGORY = 3.
    - PLATFORM_ENUM = ["macos","windows","linux","web","cli","mobile"]; PRICING_ENUM = ["free","freemium","paid","open-source"].
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/dev-tools" page="DevTools (hub, SPA)" />
    <route path="/:locale/tools/dev-tools/:category" page="DevToolsSpoke [category] (static spoke, SSR)" note="generateStaticParams from dev-tools.generated.json; one per category slug per locale" />
  </public_routes>
  <note>Dual-route: hub (SPA, no spoke generation) for primary navigation, and per-category spokes (SSG static, SSR SEO content) for discoverability. locale ∈ {ko, en}. Platform generateStaticParams iterates registry and dev-tools.generated.json to SSG. Spoke URLs carry unique canonical/hreflang.</note>
</route_definitions>

<component_hierarchy>
  <dev_tools_hub>                 <!-- "use client"; owns query + selectedId + useDevToolsCatalog() state -->
    <dev_tools_intro />           <!-- H1 + lead (SEO; gate-free SSR) -->
    <dev_tools_layout>            <!-- Selector (list) on top, full-width detail below when selected -->
      <dev_tools_main>            <!-- Left/top column -->
        <dev_tools_search />      <!-- "/" focus, clear, result count -->
        <category_tabs />         <!-- All / Categories / Favorites / Recent -->
        <categories_list>         <!-- Roving tabindex cards -->
          <category_card />       <!-- × N: click = select; star = favorite -->
          <empty_state />         <!-- No results / empty favorites -->
        </categories_list>
      </dev_tools_main>
      <category_detail>           <!-- Full-width panel below the list; shown only when a category is selected -->
        <category_sections>       <!-- Sections and tool rows -->
          <tool_row />            <!-- × N: name, description, platform badges, pricing badge, official link -->
        </category_sections>
        <share_buttons />          <!-- SNS share (url=absoluteEntityUrl for spoke) -->
      </category_detail>
    </dev_tools_layout>
    <dev_tools_how_to />          <!-- SEO long-form (gate-free SSR) -->
    <dev_tools_faq />             <!-- FAQPage JSON-LD (single owner) -->
    <structured_data />           <!-- SoftwareApplication (hub meta) -->
  </dev_tools_hub>
  <dev_tools_spoke>               <!-- Server component for [category] route -->
    <breadcrumb_list />           <!-- BreadcrumbList JSON-LD -->
    <spoke_header>                <!-- Category title + description (SSR) -->
      <share_buttons />           <!-- SNS share (url=absoluteEntityUrl for this spoke) -->
    </spoke_header>
    <tool_sections>               <!-- Sections + tool rows (SSR, gate-free) -->
      <tool_row />                <!-- × N -->
    </tool_sections>
    <structured_data>             <!-- ItemList JSON-LD with SoftwareApplication items (url==canonical) -->
  </dev_tools_spoke>
  <note>Hub: SPA within tool, search/select = local state switch, NOT route navigation. Spoke: static SSR page, unique per category, gate-free content (SEO + JSON-LD).</note>
</component_hierarchy>

<pages_and_interfaces>
  <dev_tools_intro>
    - Eyebrow: "개발 도구 추천" / "DEVELOPER TOOLS" — 12px/700/0.6px, var(--brand-ink).
    - H1: "개발 툴 추천" / "Developer Tool Picks" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg: "에디터·터미널·API 클라이언트·AI 코딩 도구 등 개발 생산성을 높이는 검증된 도구 추천을 분야별로 찾아보세요." / English equivalent.
  </dev_tools_intro>

  <dev_tools_search>
    - DESIGN text-input style, main column full width, leading Search icon (20px), placeholder "분야·도구 이름으로 검색…" / "Search categories, tools…".
    - Focus on "/" keypress. Trailing clear (×) when non-empty. Draft-bound value (typing never dropped by debounce).
    - Live filter, debounced 120ms. Result count "결과 N개" caption.
    - aria: role="searchbox", aria-controls the list.
  </dev_tools_search>

  <category_tabs>
    - Horizontal pill row. Order: "전체"(all) → categories (derived from catalog) → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill (bg-brand text-on-brand) / inactive = surface-muted / text-secondary. Real design tokens only (no phantom tokens).
    - role="tablist"; ArrowLeft/Right move; aria-selected on active.
  </category_tabs>

  <categories_list>
    - Responsive grid: 1-column <768px; 2-column ≥768px. Full container width (the detail sits below, not beside).
    - Each card is a crawlable visible anchor to the spoke (onClick preventDefault → SPA select; star is a sibling outside the anchor).
    - Card content: title (18–20px var(--text)/700), description (clamp 2 lines var(--text-secondary) 14–15px), compact tag line showing section count + tool count (e.g., "3 섹션 · 12 도구"), and a star (favorite toggle).
    - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, shadow --shadow-card.
    - States: hover translateY(-2px) + --shadow-card-hover; focus 2px var(--focus-ring); selected 2px var(--accent-mint) ring.
    - Roving tabindex; ArrowUp/Down move; Enter/Space open detail; "f" toggle favorite.
    - empty_state: contextual — no-results echoes query + reset; empty-favorites shows onboarding "별을 눌러 즐겨찾기를 저장하세요".
  </categories_list>

  <category_detail>
    - Placement: FULL-WIDTH panel rendered below the selector, shown only once a category is selected. RATIONALE: sections + tools are wide and numerous; full width lets all content breathe. Same layout on desktop and mobile (single column, stacked).
    - Panel surface: var(--surface), radius var(--radius-xxl), padding 24px (16px mobile), 1px var(--hairline), shadow --shadow-card.
    - Deselect affordance: X button (lg:hidden — mobile) to clear the selection; Esc also clears.
    - Content (top → bottom):
      1. Title: large headline 28px var(--text).
      2. Description: body 16px var(--text-secondary), 1–2 lines — curator's intent.
      3. Sections (stacked):
         - Section heading: eyebrow/label 12px/700 var(--brand-ink) or accent color.
         - Tool rows (`<div role="region">` or semantic list):
           · Tool name: 16px/600 var(--text), tappable.
           · Description: 14px var(--text-secondary) — recommendation reason.
           · Platform badges: small pills (macOS/Windows/Linux/Web/CLI/Mobile), 12px/600.
           · Pricing badge: pill (free=mint / freemium=sky / paid=rose / open-source=violet), 12px/600 var(--on-accent), e.g. "무료" / "Free".
           · Optional official-link icon (lucide ExternalLink, 16–18px var(--text-muted)), trailing; aria-label "공식 사이트" / "Official site"; rel=noopener target=_blank.
         - Row states: hover bg var(--surface-muted); focus 2px var(--focus-ring); active text-primary.
      4. Empty/initial (not selected): hint "분야를 선택하면 도구 모음이 여기에 표시됩니다."
    - Responsive: ≥768px full-width panel; <768px same single-column stacked. Tool rows never overflow at 320px.
  </category_detail>

  <dev_tools_spoke>
    - Static page (SSG) per category, generated from dev-tools.generated.json.
    - Unique canonical URL: `apps.jurepi.kr/[locale]/tools/dev-tools/[category-slug]`.
    - Breadcrumb: "Tools > Developer Tool Picks > [Category Title]" (BreadcrumbList JSON-LD, url==canonical).
    - Header: H1 category title (28px/700), description (16px/text-secondary).
    - Tool sections: same structure as hub detail (sections → tool rows, full SSR, no gates).
    - Footer: ShareButtons (url=absoluteEntityUrl, pre-configured for this spoke).
    - JSON-LD: ItemList (name=category title, description=category description, itemListElement=[SoftwareApplication with name/description/url/applicationCategory/operatingSystem/offers.price]), url==canonical.
  </dev_tools_spoke>

  <keyboard_shortcuts_reference>
    - "/" → search input focus (when not typing).
    - Arrow keys → category card/tool focus move.
    - Enter / Space → open focused category detail.
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search or deselect the open category detail.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-dev-tools.mjs">
    - Scan content/dev-tools/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → zod CategoryFileFront validate (tool schema: name/description/platforms/pricing/link/tags).
    - mergePair: apply canonical rule (ko slug canonical + en inherit if absent; description/sections PER-LOCALE). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, required fields, section/tool counts (≥1 section, ≥3 tools total per category), URL validity (http(s), no affiliate), platform enum, pricing enum, slug uniqueness.
    - Sort (slug alphabetical / title order), emit dev-tools.generated.json. Deterministic.
    - package.json wire: "predev" + "prebuild" prepend `node scripts/generate-dev-tools.mjs`.
  </generation>
  <catalog_access note="runtime pure layer — STATELESS">
    - allCategories(): MergedCategory[] (generation order). byId(catalog, slug) — stateless lookup (spoke routes call CATALOG.find directly; no init required). categories(): live category ids in catalog.
    - Tests assert catalog uniqueness, locale completeness.
  </catalog_access>
  <search>
    - filterCategories(categories, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko/en.title, ko/en.description, ko/en.sections[].heading, ko/en.sections[].tools[].name, ko/en.sections[].tools[].tags (join + search). PRIMARY = category title/desc; SECONDARY = tool names + tags. Stable order.
    - Compose with tab: list = filterCategories(all, query) or filterCategories(favorites subset, query), etc.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(ids, catalog): drop ids not in current catalog (run on load).
    - Recent push: when detail opens (select). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useDevToolsCatalog>
    - Mount: dynamic catalog import; read `jurepi-dev-tools` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory. Persist timer separate from search-debounce timer.
    - Expose: filtered list, selectedId + select(id), toggleFavorite, favorites, recents, lastQuery.
  </persistence_adapter>
  <i18n>All UI chrome from tools.dev-tools.* (ko/en): top-level title/description, tabs, search, pricing names (무료/부분 무료/유료/오픈소스 vs Free/Freemium/Paid/Open Source), platform names, toasts, empty states, how-to, FAQ. Category title/descriptions/sections/tools come from markdown (dev-tools.generated.json), NOT i18n messages.</i18n>
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
    - Per-tool identity accent is MINT (var(--accent-mint) / var(--accent-mint-soft)). Intro icon tile, card selected ring, favorite star (filled), pricing badge for "free". (Category is `dev`; this tool uses mint as its per-tool identity accent to differentiate from sibling dev tools.)
    - Pricing badges: free=mint, freemium=sky, paid=rose, open-source=violet (each with its `-soft`/`-ink` real tokens).
    - CTAs (primary buttons, active tabs) stay brand honey-gold var(--brand).
    - Platform badges: monochrome surface-muted pills (or subtle accent tint), text-secondary.
  </accent_usage>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius --radius-xxl; tool rows var(--surface-muted) on hover. Soft brand-tinted shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); category title (card 18–20px / detail 28px)/700; tool name 16px/600; description 14px; section heading eyebrow 12px/700.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail fade-in 150ms on selection. All gated by prefers-reduced-motion.</motion>
  <accessibility>Card = crawlable visible anchor; star/tool row = labeled real buttons; roving-tabindex list; favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); links rel=noopener target=_blank. Sections use semantic structure. Pricing/platform badges use aria-label for screen reader context.</accessibility>
  <responsive>
    - All breakpoints: single column — selector on top, full-width detail below when a category is selected. Card grid: 1-col <768px, 2-col ≥768px.
    - The detail's tool sections are the responsive unit: full width ≥768px; <768px single column (no horizontal scroll). No page overflow at 320px.
  </responsive>
  <atmosphere>Bright, trustworthy "curated tool hub": generous card spacing, clear descriptions. The BROWSE layer is discoverable category cards; the DETAIL layer renders clean, scannable tool rows (name, description, platforms, pricing) anchored by the curator intent. Trust-first, practical.</atmosphere>
  <icons>lucide-react: Search, Star/StarOff (favorite), ExternalLink (tool links), Wrench or LayoutGrid (tool card icon), ChevronRight (link affordance). Default 20px (16–18px inside detail), stroke 1.75, currentColor. Registry card icon: `Wrench` (or `LayoutGrid`). Pricing badge icons (optional): Gift (free), Sparkles (freemium), CreditCard (paid), GitBranch (open-source).</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Name/description/section headings render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Links rendered as `<a href={url} rel="noopener" target="_blank" />` (external, safe).
    - Generator validates frontmatter with zod (type/required/length/platform-enum/pricing-enum/URL format — valid http(s) only, no affiliate domains).
  </input>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes category/tool data beyond view count.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness.</content_integrity>
  <affiliate_policy>External links MUST NOT include affiliate parameters. Generator validates link URLs against common affiliate patterns and rejects during build. Curation is editorial and disclosed; no paid placement.</affiliate_policy>
  <note>No secrets, no network access, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-browse friction. Unknown ids auto-pruned.</favorites_recents>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite — mouse-free power.</keyboard_first>
  <platform_pricing_badges>Visual indicators (platform + pricing) + aria-label for screen readers — quick suitability assessment.</platform_pricing_badges>
  <structured_data>ItemList + each category ListItem with SoftwareApplication type (name, description, url, applicationCategory, operatingSystem, offers) — search engine recognizes tool collections and AI citation (discoverability = DESIGN principle ③).</structured_data>
  <external_links>Links marked rel=noopener; trusted official sources (vendor sites, GitHub repos). No affiliate links.</external_links>
  <spoke_discovery>Per-category static pages (SSG) — each category appears in sitemap and gets unique SEO/JSON-LD, enabling search engines and AI to cite individual tool collections by category. Hub + Spokes model (Phase 1: categories; Phase 2: individual tools).</spoke_discovery>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → category list auto-compose</description>
    <steps>
      1. editors.md + editors_en.md exist in content/dev-tools/ with description, ≥1 section, ≥3 tools total.
      2. pnpm dev → predev generator runs → dev-tools.generated.json has merged record (ko/en title, description, sections with tools).
      3. Visit /ko/tools/dev-tools → hub list renders "에디터·IDE" card with tool count.
      4. Add new pair terminals(.md/_en.md), rebuild → hub list auto-updates (no code edit).
      5. Missing pair or <3 tools or invalid platform/pricing/URL → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, empty states</description>
    <steps>
      1. Type "터미널" in search → narrows to matching categories/tools; result count updates; aria-live announces.
      2. Clear, click "All" → full category list.
      3. Type "asdfqwer" → empty "'asdfqwer'에 해당하는" + clear; clear restores.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Detail — sections and tool rows</description>
    <steps>
      1. Click "AI 코딩 도구" card → detail opens: title + description (curator intent), then sections.
      2. Each section: heading + tool rows (name, description, platform badges, pricing badge, official-link icon if link present).
      3. Each tool row is clickable/hoverable, badges distinguishable, rel=noopener target=_blank; opens in new tab.
      4. At 320px the rows stack without horizontal scroll; tool info remains readable.
      5. Screen reader announces section structure + tool affordance + pricing/platform badges.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Favorites, recent, persistence, keyboard, a11y</description>
    <steps>
      1. Open 2 different categories → "최근" tab lists them MRU.
      2. Star a card → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload → favorites/recents persist (localStorage); unknown ids pruned.
      4. "/" → search focus; arrow navigate cards; Enter open detail; axe pass → no violations.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Spoke pages, SEO (JSON-LD), i18n, locale swap</description>
    <steps>
      1. Visit /ko/tools/dev-tools/editors → static spoke page with category title + description (SSR, gate-free), tool sections, canonical=apps.jurepi.kr/ko/tools/dev-tools/editors, hreflang to /en variant.
      2. Switch to /en/tools/dev-tools/editors → English tool data, metadata updated, unique canonical/hreflang.
      3. Prerendered HTML has SoftwareApplication (hub meta) + ItemList with SoftwareApplication items (name/description/url); topic-level code-split chunk (not global i18n). Exactly one FAQPage + one SoftwareApplication on hub.
      4. Sitemap.xml includes both hub + all spokes (4 categories × ko/en + 1 hub × ko/en = 10 total); hreflang alternates on every entry.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<category>.md` + `<category>_en.md` pair in content folder, rebuild, auto-reflect in hub list/search/detail + spoke SSG with zero code change; generator validates pair/structure/tools/platform/pricing/links, fails build with clear message on violation.</content_model>
  <functionality>Searchable category + tool list (both locales, search-first); detail renders sections + tool rows (name, description, platform badges, pricing badge, official affordance); localStorage favorites + recent; seed 4 categories × 3+ tools each (12+ tools total).</functionality>
  <trust_surface>CRITICAL: every category detail shows curator's intent (description, organized sections); every tool labeled with name + description + platforms + pricing + official link. Editor-authored, not crowdsourced. No affiliate/paid placement.</trust_surface>
  <user_experience>Search/filter instant; cards readable; ≥44px targets; visible focus; tool rows never overflow at 320px; SPA hub — no route reload on interaction; spoke pages static/fast (SSG).</user_experience>
  <technical_quality>lib/dev-tools/* pure ≥90% domain coverage (schema/merge/slug/search/favorites, tool validation); generator validation tests (pair-missing, <3-tools, invalid-platform/pricing/URL → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; mint identity + brand honey-gold CTA; pricing badges (mint/sky/rose/violet); clean tool rows (styled, focused states, external icon); text-node render only; real tokens only (no phantom).</visual_design>
  <accessibility>Full keyboard (roving list, "/", Enter, "f", Esc); aria-live state; crawlable card anchors + labeled buttons; badge aria-labels; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Hub + spokes within platform budget; catalog dynamic import; CLS unaffected; LCP < 2.5s; spokes static (0 runtime JS per category beyond platform shell).</performance>
  <seo_geo>Hub + spokes each have unique canonical/hreflang; JSON-LD (SoftwareApplication hub, ItemList+SoftwareApplication spoke); tool url/description in JSON-LD for AI citation; sitemap includes all spokes (app/sitemap.ts explicitly, not automatic); llms.txt registered.</seo_geo>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-dev-tools.mjs to freshen dev-tools.generated.json. /[locale]/tools/dev-tools (hub) pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" initially, "live" on launch). /[locale]/tools/dev-tools/[category] (spokes) pre-rendered via generateStaticParams sourcing dev-tools.generated.json catalog, one per category slug per locale (e.g., 4 categories × 2 locales = 8 spoke routes).</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category already exists; 'mint' is this tool's per-tool accent.
    {
      id: 'dev-tools',
      slug: 'dev-tools',
      category: 'dev',
      icon: 'Wrench',
      accent: 'mint',
      status: 'coming_soon',    // 'live' when complete
      isNew: true,
      order: 30,
      keywords: ['개발도구','툴','추천','에디터','IDE','터미널','API','DB','AI코딩','생산성','dev','tools','recommendations','editor','terminal','productivity'],
    },
    ```
    Also add slug→component branches (<DevTools/> hub, <DevToolsSpoke/> spoke route) and generateMetadata branches in tool route.
  </platform_registry_change>
  <sitemap_integration note="CRITICAL: not automatic">
    ```typescript
    // app/sitemap.ts — add explicit dev-tools collection block (parallel to dev-books/bookmarks/rankings/new-word)
    import devToolsData from '@/components/tools/dev-tools/data/dev-tools.generated.json';
    // Dev-tools hub (2 locales, hreflang alternates) + spokes (4 categories × 2 locales = 8)
    // via seo.absoluteUrl (hub) and seo.absoluteEntityUrl(category.slug, locale, 'dev-tools') (spokes).
    // Update sitemap.test.ts expectations (count derived from same catalog).
    ```
  </sitemap_integration>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate (URLs, platform/pricing enums, structure) → dev-tools.generated.json. Entire tool depends on this.
    2. Pair/canonical-merge rule (ko slug canonical, en inherit) + tool metadata validation (platform/pricing enum, URL safe) + tool/section counts.
    3. Search (both locales, diacritic/case-ignore, category-first + tool-name-second) + section/tool rendering (semantic structure, badges, external affordance).
    4. Sitemap spoke collection: explicit dev-tools.generated.json import + absoluteEntityUrl loop (not automatic from schema).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/dev-tools/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema (tool fields + platform/pricing enums), slug derivation/uniqueness, canonical merge, URL validation, search match, MRU/favorite immutable ops.
    2. scripts/generate-dev-tools.mjs + content/dev-tools/{_TEMPLATE,_TEMPLATE_en,README} + seed (에디터·IDE, 터미널·셸, API·DB 도구, AI 코딩 도구). Validation tests (pair-missing, <3-tools, invalid-platform/pricing/URL → fail). predev/prebuild wire.
    3. tools.dev-tools.* messages (ko/en): top-level title/description, tabs, search, platform/pricing names, toasts, empty states, how-to, FAQ.
    4. useDevToolsCatalog hook (dynamic import + localStorage favorites/recents + in-memory fallback).
    5. DevToolsSearch + CategoryTabs + CategoriesList/CategoryCard (crawlable anchors, roving tabindex, states).
    6. CategoryDetail: sections + tool rows (name, description, platform badges, pricing badge, external icon, responsive).
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus).
    8. DevToolsIntro/HowTo/Faq + SoftwareApplication + FAQPage(Faq owner) + ItemList JSON-LD (hub) via platform lib/seo.ts.
    9. DevToolsSpoke ([category] route, SSG generateStaticParams + SSR, BreadcrumbList + ItemList JSON-LD + ShareButtons).
    10. sitemap.ts explicit dev-tools collection + spoke URLs.
    11. Registry status→coming_soon (→live on launch); hub + spoke route branches; E2E 1–5; visual regression 320/768/1024 both themes + both locales.
  </recommended_implementation_order>
  <seed_categories note="initial content — author fine-tunes but start with these">
    - 에디터·IDE: "무료·오픈소스" + "유료·상용"; VS Code / Neovim / Zed / JetBrains IDEs / Sublime Text.
    - 터미널·셸: "터미널 앱" + "셸·확장"; iTerm2 / Warp / Ghostty / Oh My Zsh / Fig(Amazon Q) / tmux.
    - API·DB 도구: "API 클라이언트" + "DB GUI"; Postman / Insomnia / Bruno / TablePlus / DBeaver / Beekeeper Studio.
    - AI 코딩 도구: "에이전트·CLI" + "IDE 통합"; Claude Code / Codex CLI / Cursor / GitHub Copilot / Windsurf.
  </seed_categories>
  <generator_sketch>
    ```javascript
    // scripts/generate-dev-tools.mjs (outline)
    // 1) dev-tools/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod CategoryFileFront.parse with Tool[] schema (collect errors)
    // 3) validateTool(tool): platforms ⊆ PLATFORM_ENUM (≥1), pricing ∈ PRICING_ENUM, URL valid http(s) (no affiliate), name/description non-empty
    // 4) mergePair(ko, en): canonical rule (ko slug), resolveSlug
    // 5) validate: pair-integrity / required-fields / section/tool counts / enum validity / slug-unique → errors[]
    // 6) errors.length ? (stderr + process.exit(1)) : sorted-write(dev-tools.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥90% (schema/merge/slug/search/favorites, tool validation, platform/pricing enums); generator validation fixtures (pair-missing/<3-tools/invalid-platform/invalid-pricing/invalid-URL cases); component real-catalog + real-message-catalog render (no mocks); E2E scenarios 1–5 (hub + spokes); localStorage jsdom-isolated; both locales ko/en (assert no Korean leakage in EN).</testing_strategy>
</key_implementation_notes>

</project_specification>
```
