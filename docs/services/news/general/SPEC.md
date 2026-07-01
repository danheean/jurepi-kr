# Monthly General News — Curated General-Interest News by Month — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Monthly General News** (월간 일반 뉴스) — a browsable monthly news archive of curated general-interest stories (society, business, culture, science, economics), hand-curated as markdown. One markdown file = one month of general news. At build time a generator scans the folder, parses frontmatter + news items (heading format), validates, and emits a static catalog. The tool mounts as a client-side SPA offering timeline browsing, month jump, search, and in-tool favorites. The same engine powers **it-news** (monthly IT news, separate tool with slug `it-news`); both tools share the code and template but target different audiences.
> Internal service codename: `monthly-news`. General-news registry id: `general-news`. Public URL slug: `/[locale]/tools/general-news`.
>
> This SPEC covers **this tool only**. The shared MonthlyNews component, engine, and generator are shared with sibling it-news (see [`../monthly-news/SPEC.md`](../monthly-news/SPEC.md) for the architecture overview). The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`../../../SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`../../../DESIGN.md`](../../../DESIGN.md)
> - Reference monthly-news shared architecture: [`../monthly-news/SPEC.md`](../monthly-news/SPEC.md)
> - Reference sibling tool it-news: [`../it-news/SPEC.md`](../it-news/SPEC.md)

```xml
<project_specification>

<project_name>Monthly General News — Curated General-Interest News Archive by Month (Jurepi tool, codename monthly-news, registry id general-news, topic general)</project_name>

<overview>
Monthly General News delivers curated, hand-selected stories in the general-interest domain: mainstream business, economics, culture, science, society, and international affairs. "What happened in the business world / culture / science this month?" is answered by browsing a vertical timeline, searching by keyword/tag, or jumping to a specific month. Unlike **it-news** (which focuses on tech trends, AI, startups, security), general-news serves readers interested in broad-based current events, business & economics, cultural trends, and scientific discoveries. Content is NOT auto-fetched from feeds — it is **human-curated markdown**, one file per month, with headlines, brief summaries, sources, and tags. At build time a generator scans the markdown folder, parses each file, validates structure, and bakes a static catalog (news.generated.json). The tool then renders a searchable timeline with month jump, topic selector (for the platform's benefit; each tool is single-topic), and optional favorites (localStorage).

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The news catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + month jump + last view), and nothing is ever sent over the network.

CRITICAL (content model, markdown single source): every news item is a `##` markdown heading in the form `## YYYY-MM-DD · Headline`, followed by 1–3 sentence summary and optional `- 출처:` / `- 태그:` lines. One file = one month at `content/news/general/<YYYY-MM>.md`. The build generator validates pair/structure/dates/references and **fails the build with a clear message** if ANY rule is broken (no silent omission).

CRITICAL (SEO/GEO, AI discoverability): the tool page + monthly summaries render server-side OUTSIDE the `mounted` gate (AI crawlers see them). JSON-LD: use schema.org **ItemList / ListItem** for each month's items, **CollectionPage**, **BreadcrumbList**, **NewsArticle**-style per item. Longform intro + FAQ prose and all JSON-LD MUST be in server-rendered body. Only date-dependent or localStorage-dependent parts sit behind the mount gate.

CRITICAL (platform integration): the `'news'` category (7th in ToolCategory) is NOT yet wired — no i18n label ko "뉴스"/en "News", not in CATEGORY_ORDER/FOOTER_CATEGORIES, no category accent. Activating the `news` category is a one-time platform prerequisite, SHARED with the sibling `it-news` tool. Two `ToolMeta` registry entries (it-news, general-news) + two slug→component branches (same component, different `topic` prop) + two `generateMetadata` branches.
</overview>

<platform_integration>
  - Route: /[locale]/tools/general-news (SSG; registry id "general-news", slug "general-news", status "live", category "news", accent "sun").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.general-news.*` (UI chrome strings: month jump, search, how-to, FAQ, favorites, empty states — NOT news item content; that comes from markdown in news.generated.json); the in_content AdSlot below the tool.
  - Shared with sibling it-news: MonthlyNews component (same code, different `topic` prop), MonthlyNewsIntro/HowTo/Faq, useTimeline hook, generator script (scripts/generate-news.mjs), content template (content/news/_TEMPLATE.md), catalog merge logic, search/favorites domain layer (src/lib/monthly-news/). General-news = topic "general" only; it-news = topic "it" only.
  - Platform dependency (ONE-TIME, SHARED with it-news): (1) Add `'news'` category to ToolCategory enum + activate with i18n label ko "뉴스"/en "News", CATEGORY_ORDER position, FOOTER_CATEGORIES, and category accent (suggested: mint or sky, TBD by design-system owner). (2) Add TWO `ToolMeta` registry entries (it-news + general-news), two slug→component branches in the tool route (both route to MonthlyNews, different `topic` props), and two `generateMetadata` branches.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed news items for general-interest topic only (`content/news/general/<YYYY-MM>.md`).
    - Build-time generator: folder scan → frontmatter parse → item heading parse (## YYYY-MM-DD · Headline) → validation → code-split static catalog (news.generated.json shared with it-news). Wired to `prebuild`/`predev`.
    - Initial seed content: minimum 6 months of general-news (2026-07 through 2026-02 or later), 8–12 items per month covering business, culture, science, economics, society, international affairs.
    - News item templates & authoring README (shared with it-news).
    - Timeline rendering: vertical months (newest first), items within month sorted date-descending. Sticky month header.
    - Month jump: dropdown list of available months, quick navigate.
    - Search: item headline + summary + tags, debounced live filter across all months, result count.
    - Favorites (pinned items): localStorage persistence, pin/unpin toggle, auto-pruned on load.
    - Full keyboard support: "/" search focus, arrow keys timeline scroll, "f" toggle favorite (focused item).
    - Tool-specific SEO long-form ("Stay informed on business, culture, and current affairs") + FAQ (FAQPage JSON-LD) + **ItemList / ListItem JSON-LD** (schema.org for timeline browsing), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Automated news feed scraping / RSS ingestion / live API fetches (this is NOT an aggregator; content is human-curated markdown only).
    - User comments / submissions / ratings / discussion (curated reference tool only).
    - Per-item deep-link URLs (e.g., /tools/general-news/2026-07-22-headline) — MVP is a single route + client state. (Phase 2 candidate.)
    - Rich HTML/script in markdown body. Item summaries are plain text / limited inline emphasis, rendered safely.
    - Topic switching (each tool is single-topic; general-news = General only).
  </out_of_scope>
  <future_considerations>
    - Per-month static deep-link pages + individual NewsArticle JSON-LD pages (SEO) — Phase 2.
    - Newsletter subscription form (with third-party backend link, out of scope for this tool) — Phase 2.
    - Topic-specific filters (e.g., filter by sector: economy / culture / science) — Phase 2.
    - Share image generation (per-month) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>News items live as markdown files in `content/news/general/<YYYY-MM>.md`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Frontmatter carries metadata (topic="general", year, month, optional title/summary).</frontmatter_parsing>
    <item_parsing>Generator regex-parses `##` markdown headings in the form `## YYYY-MM-DD · Headline` to extract date, headline, and summary. No markdown HTML rendering needed — summaries are plain text.</item_parsing>
    <validation>zod v3.x (already used in repo) for (1) frontmatter schema (2) item structure invariants. Validation is strict: all items must have valid date-in-month, unique source links, etc. Build failure on violation.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/monthly-news/data/news.generated.json), dynamically imported only on this tool's route so topic+month content never enters the global i18n message bundle (protects platform JS budget).</catalog>
    <animation>Native CSS transitions only (month fade-in, search debounce, favorite star pop). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script (shared with it-news).</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter + item validation (shared with it-news).</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-news.mjs                    # Build time (SHARED with it-news): scan content/news/<topic>/*.md → parse frontmatter + items → validate → emit news.generated.json. Wired to prebuild/predev.
content/news/
├── _TEMPLATE.md                         # Template for new monthly file (annotated; generator excludes "_" prefix). SHARED with it-news.
├── general/
│   ├── 2026-07.md                       # One month of general news
│   ├── 2026-06.md
│   └── …
src/
├── lib/monthly-news/                    # Pure domain layer (SHARED with it-news) — no React/Next, fully unit-tested
│   ├── schema.ts
│   ├── parse.ts
│   ├── validate.ts
│   ├── catalog.ts
│   ├── search.ts
│   └── favorites.ts
├── components/tools/monthly-news/       # Presentation layer (SHARED component, topic prop distinguishes)
│   ├── MonthlyNews.tsx                  # topic prop = "general" for this tool
│   ├── useTimeline.ts
│   ├── TimelineMonth.tsx
│   ├── TimelineItem.tsx
│   ├── MonthJump.tsx
│   ├── NewsSearch.tsx
│   ├── MonthlyNewsIntro.tsx
│   ├── MonthlyNewsHowTo.tsx
│   ├── MonthlyNewsFaq.tsx
│   └── data/
│       └── news.generated.json          # Generated artifact
└── i18n/messages/{ko,en}.json           # tools.general-news.* UI chrome (general-news specific labels + how-to/FAQ text)
</file_structure>

<core_data_entities>
  <news_file_front note="individual markdown file frontmatter (parse unit)">
    - topic: "general" (required, MUST match "general" for this tool) — no enum choice at tool level
    - year: number (e.g., 2026) — required
    - month: number (1–12) — required
    - title?: string — optional; if absent, auto-generate as "일반 뉴스 2026년 7월" / "General News — July 2026"
    - summary?: string — optional (1 line, used for card meta/SEO)
    INVARIANT: topic="general" (enforced), year/month non-empty and valid (month 1–12). Mismatch with file folder → generator error.
  </news_file_front>
  <news_item note="parsed from ## markdown headings + body">
    - date: string (YYYY-MM-DD) — extracted from heading; must fall within file's year/month
    - headline: string (non-empty) — extracted from heading after ·
    - summary: string (1–3 sentences, plain text) — paragraph(s) immediately following heading
    - sources: { text: string; url: string }[] — extracted from `- 출처:` lines (markdown links)
    - tags: string[] — extracted from `- 태그:` comma-separated list
    INVARIANT: date valid YYYY-MM-DD, within month, headline non-empty, ≥ 1 source recommended. Missing source/tags OK (optional).
  </news_item>
  <timeline_store note="single localStorage blob (shared schema with it-news, topic-aware)">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: { date: string; topic: string ("general" | "it"); headline: string }[] — favorited items, insertion order
    - lastMonthView: { topic: string; year: number; month: number; ts: number } — last month browsed (per topic)
    localStorage key: `jurepi-monthly-news`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Orphan items pruned on load (catalog change never leaves dangling ids).
  </timeline_store>
  <constants>
    - SEARCH_DEBOUNCE = 120ms; TOAST_MS = 1600ms.
  </constants>
  <defaults>
    - New user: no favorites; timeline shows latest available general-news month; search empty.
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/general-news" page="MonthlyNews (topic=general, platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. Per-month deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <monthly_news topic="general">        <!-- "use client"; owns month + search + favorites state + useTimeline() owner. Passed topic="general" prop from route. -->
    <monthly_news_intro />               <!-- H1 "일반 뉴스" / "General News" + lead + topic description (server-render where possible) -->
    <timeline_layout>                    <!-- Main column: month jump + search + vertical month groups -->
      <month_jump />                     <!-- Dropdown: available months within general-news, jump to month -->
      <news_search />                    <!-- "/" focus, clear, result count -->
      <timeline_months>                  <!-- Vertical scroll, months newest-first (general-news only) -->
        <timeline_month />               <!-- Month header + items -->
          <timeline_item />              <!-- × N: date, headline, summary, sources, tags, favorite star -->
          <empty_state />                <!-- No items in month / no search results -->
      </timeline_months>
    </timeline_layout>
    <monthly_news_how_to />              <!-- SEO long-form ("Stay informed on current affairs") -->
    <monthly_news_faq />                 <!-- FAQPage JSON-LD -->
  </monthly_news>
  <note>SPA within tool: month/search/favorite = local state switch, NOT route navigation. Single-column layout, responsive.</note>
</component_hierarchy>

<pages_and_interfaces>
  <monthly_news_intro>
    - Eyebrow: "뉴스" / "NEWS" — 12px/700/0.6px, var(--brand).
    - H1: "일반 뉴스" / "General News" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Topic descriptor: 1–2 sentences, body-lg 18px var(--text-secondary): "세계 경제, 비즈니스, 문화, 과학 소식을 매달 큐레이션해서 모았습니다. 현재 사회 흐름을 빠르게 파악하세요." / "Curated monthly digest of global business, economics, culture, and science news. Stay informed on what matters."
  </monthly_news_intro>

  <month_jump>
    - Dropdown/combobox UI, "2026년 7월로 이동" / "Jump to July 2026", label "Month".
    - Lists all available general-news months (from catalog), newest first. Click = scroll to month.
    - Keyboard: ArrowUp/Down navigate, Enter jump, Esc close.
  </month_jump>

  <news_search>
    - DESIGN text-input style, full width, leading Search icon (lucide, 20px var(--text-muted)), placeholder "뉴스 제목·요약·태그로 검색 (예: 경제, AI, 문화)".
    - Focus on "/" keypress (when not already typing). Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption var(--text-muted), aria-live="polite".
    - aria: role="searchbox", aria-controls timeline.
  </news_search>

  <timeline_item>
    - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, margin-bottom 12px.
    - Top row: date (eyebrow 12px var(--text-muted) "YYYY-MM-DD") + headline (card-title 17px var(--text)/700).
    - Top-right: favorite star button (aria-pressed), icon 20px.
    - Body: summary 2-line clamp (body-sm 14px var(--text-secondary)).
    - Source links: comma-separated text links (14px var(--brand-ink)), open new tab (rel=noopener noreferrer), underline on hover.
    - Tags (if any): pills, var(--surface-muted) + var(--text-muted), radius var(--radius-pill), padding 4px 10px.
    - States:
      - hover (pointer): translateY(-2px) + var(--shadow-card-hover); cursor pointer.
      - focus (keyboard): 2px var(--focus-ring) ring offset 2px.
      - favorite (star filled): var(--accent-sun) fill + pop animation (scale 1→1.2→1) 150ms.
    - aria: card aria-label = "date headline"; star is real stateful button aria-pressed.
    - empty_state: no items in month / no search results → "이 월에 뉴스가 없습니다" + "최근 달을 확인하세요"; no results → "'{query}'에 해당하는 뉴스가 없어요" + clear.
  </timeline_item>

  <keyboard_shortcuts>
    - "/" → search input focus (when not already typing).
    - ArrowDown/Up → scroll timeline (month/item focus move).
    - "f" (item focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search if non-empty, else no-op.
    - Disabled on touch; all actions reachable via tap.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-news.mjs (shared with it-news)">
    - Scan content/news/general/, collect all *.md files (exclude `_` prefix).
    - gray-matter parse each file frontmatter → zod NewsFileFront validate (topic="general" enforced).
    - Regex parse `## YYYY-MM-DD · Headline` items + body + `- 출처:` / `- 태그:` lines.
    - Validate (fail → process.exit(1) with file/field/reason): topic="general", year/month valid, items date-in-month, required fields per item, source URLs well-formed.
    - Sort: topic → year desc → month desc → items within month date-desc. Deterministic (no Date/random).
    - Emit news.generated.json (code-split, shared with it-news catalog). package.json wire: "predev": "node scripts/generate-news.mjs", "prebuild": "node scripts/generate-news.mjs".
  </generation>
  <catalog_access note="runtime pure layer (shared with it-news)">
    - allItems(topic="general"): NewsItem[] (all general-news items, sorted month-desc → date-desc). byMonth(topic="general", year, month): items. monthList(topic="general"): [{ year, month, count, title }, …]. monthTitle(year, month): "2026년 7월".
    - Tests assert catalog structure, date validity, uniqueness per (topic, date, headline).
  </catalog_access>
  <search>
    - filterItems(items, query): blank query → as-is. Else normalize (trim, NFC, lowercase). Match if ANY of: headline, summary, tags. Stable order (month-desc → date-desc within results).
  </search>
  <favorites_and_recents note="immutable — return new arrays/store (shared schema, topic-aware)">
    - toggleFavorite(list, date, topic, headline): add if absent (topic="general"), remove if present. Preserve order.
    - pruneUnknown(items, catalogTopics): drop items no longer in catalog (run on load).
  </favorites_and_recents>
  <persistence_adapter useTimeline>
    - Mount: dynamic catalog import; read `jurepi-monthly-news` → zod → filter favorites by topic="general" → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list by month, search query, selectedMonth, jump(month), toggleFavorite, favorites (topic="general" only), search(query).
  </persistence_adapter>
  <i18n>All UI chrome from tools.general-news.* (ko/en): month labels, search, month-jump, toasts, empty states, how-to, FAQ. News items (date, headline, summary, tags) come from markdown (news.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. topic="general" mismatch with file folder is a hard error.
  </build_time>
  <search_no_results>Friendly empty state echoing query + "clear search" button; timeline retains last month selection.</search_no_results>
  <storage>
    <unavailable>Private mode/disabled → favorites in-memory, no scary error. Timeline fully works.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (favorites not precious, no throw).</corrupt_blob>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent: sun (var(--accent-sun) / var(--accent-sun-soft)) for general-news (vs. sky for it-news). Category identity per DESIGN. Intro icon tile, favorite star (filled), item hover, month badge.
    - CTAs (primary buttons, month-jump) stay brand honey-gold var(--brand). Accent = identity, not action.
  </accent_usage>
  <surfaces>Item card = var(--surface) + 1px var(--hairline); month header var(--surface); tag chips var(--surface-muted). Soft shadows, hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); month headline (24px/700); item headline (card-title 17px/700); summary body-sm (14px); date eyebrow (12px). Source links var(--brand-ink) (not visited purple).</typography>
  <motion>transform/opacity only: item hover translateY(-2px) 150ms, favorite star pop (scale 1→1.2→1) 150ms, month fade-in 150ms. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (instant fade, no scale).</motion>
  <accessibility>Item/star = labeled real buttons; tablist month-jump; search aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); link color var(--brand-ink) AA contrast on white.</accessibility>
  <responsive>
    - ≥1024px: main column full width.
    - 768–1023px: items 1-column, month header sticky.
    - <768px: single column, month jump horizontal scroll if many. No overflow (320 test).
  </responsive>
  <atmosphere>Bright, clean timeline of current affairs: generous item spacing, readable headlines, trustworthy source links. Not dense; inviting reference for staying informed on what matters.</atmosphere>
  <icons>lucide-react: Search (search), Star/StarOff (favorite), X (clear), ChevronDown (month-jump), Calendar (date marker). Default 20px, stroke 1.75, currentColor. Registry card icon: `Newspaper`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Headline/summary/tags render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Source links: href is validated URL (http/https only), rendered as text links.
    - Generator validates frontmatter with zod (type/required/format). Unknown fields ignored.
  </input>
  <privacy>Favorites localStorage-only, never sent. No analytics event includes item details. How-to/FAQ state plainly.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); generator validates structure so no malformed entry ships.</content_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites>Pin items; localStorage-remembered. Reduce repeat-scroll friction (topic-aware storage shared with it-news).</favorites>
  <month_jump>Fast navigation to a month within general-news. Dropdown list of all available months.</month_jump>
  <search_across_months>Headline + summary + tags matched across all general-news months; result count shown.</search_across_months>
  <keyboard_first>"/" search, ArrowDown/Up timeline scroll, "f" favorite (focused item), Esc clear — mouse-free power.</keyboard_first>
  <structured_data>ItemList + each month ListItem; CollectionPage JSON-LD (schema.org). Discovery = DESIGN principle ③.</structured_data>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → timeline auto-compose (general-news only)</description>
    <steps>
      1. File exists: content/news/general/2026-07.md with topic=general.
      2. pnpm dev (or build) → predev generator runs → news.generated.json has general-news items.
      3. Visit /ko/tools/general-news → timeline renders July 2026 general-news items (date-descending).
      4. Add content/news/general/2026-08.md, rebuild → month-jump shows August; items render.
      5. topic mismatch (e.g., topic=it in general folder) → generator reports error, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, month jump, favorites, empty states</description>
    <steps>
      1. Type "경제" / "economy" in search → items matching headline/summary/tags filter; result count updates.
      2. Click month dropdown, select "2026년 6월" / "June 2026" → timeline scrolls to June; month header sticky.
      3. Type "asdfqwer" → empty "'asdfqwer'에 해당하는 뉴스가 없어요" + clear.
      4. Star an item ("f" or click) → filled star, toast "즐겨찾기 추가"; reload → item still starred (localStorage persists).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>i18n, SEO (JSON-LD), source links</description>
    <steps>
      1. Switch to /en/tools/general-news → chrome English; month header "July 2026"; source links clickable.
      2. Build prod → /ko/tools/general-news and /en/tools/general-news unique title/description/canonical/hreflang, statically generated.
      3. HTML has SoftwareApplication + FAQPage + ItemList (each month) + ListItem (each item) JSON-LD.
      4. Source links open new tab (rel=noopener noreferrer); URLs validated as http/https.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Keyboard, a11y, reduced-motion</description>
    <steps>
      1. "/" → search focus. Type "문화" / "culture" → results filter. Esc → clear. ArrowDown → scroll timeline.
      2. Focus item with Tab; "f" → toggle favorite (aria-pressed=true, star filled, toast).
      3. axe pass → no violations. Item cards labeled. Focus ring visible. Star button real button aria-pressed.
      4. prefers-reduced-motion: ON → no scale pop on favorite, fade instead; timeline still operable.
    </steps>
  </test_scenario_4>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `content/news/general/<YYYY-MM>.md` markdown file (topic=general), rebuild, auto-reflect in timeline with zero code change; generator validates frontmatter/items/dates, fails build with clear message on violation (topic mismatch hard error).</content_model>
  <functionality>Browsable vertical month timeline (newest-first), items sorted date-descending; searchable headline + summary + tags; month jump dropdown; localStorage favorites (pin/unpin); seed 6+ months general-news.</functionality>
  <user_experience>Month jump/search instant; items feel readable; ≥44px targets; visible focus; SPA — no route reload on any interaction.</user_experience>
  <technical_quality>lib/monthly-news/* pure ≥80% unit coverage (schema/parse/validate/search/favorites); generator validation tests (topic-mismatch, missing-date, malformed-item → fail); TS 0 errors; &lt;800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; sun accent identity for general-news; bright, clean timeline (not dense table); text-node render only. 320/768/1024 responsive, no overflow.</visual_design>
  <accessibility>Full keyboard ("/" search, ArrowUp/Down scroll, "f" favorite, Esc close); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected (ad height platform-reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-news.mjs to freshen news.generated.json (shared with it-news). /[locale]/tools/general-news pre-rendered by platform generateStaticParams iterating registry (status "live"). News catalog ships as code-split chunk on both news tool routes.</note>
  <generated_artifact>news.generated.json: (a) .gitignore and always regenerate via predev/prebuild, OR (b) commit for reproducibility + CI checks "is generated artifact up-to-date?" (recommended: commit, deterministic generator, diff shows content change review).</generated_artifact>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry (general-news). 'news' category must be wired first (platform prerequisite, shared with it-news).
    {
      id: 'general-news',
      slug: 'general-news',
      category: 'news',
      icon: 'Newspaper',          // lucide-react
      accent: 'sun',
      status: 'live',
      isNew: false,
      order: 21,
      keywords: ['뉴스','일반','비즈니스','경제','문화','과학','사회','news','business','economics','culture','science','society'],
    },
    ```
    Also add slug→component branch (general-news → MonthlyNews topic="general") and generateMetadata branch in tool route.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan (content/news/general/) → gray-matter → zod (topic="general" enforced) → parse items → validate → news.generated.json. Entire tool depends on this. Validation failure = build fail.
    2. Item parsing (## YYYY-MM-DD · Headline + body + sources/tags) + date-in-month validation.
    3. Search (headline + summary + tags, diacritic/case-ignore, across all general-news months).
    4. Month jump + timeline scroll (sticky month header, items date-desc, general-news only).
  </critical_paths>
  <recommended_implementation_order>
    1. Activate `'news'` category in ToolCategory (platform prerequisite, shared with it-news).
    2. lib/monthly-news/{schema,parse,validate,catalog,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema (topic="general"), item parse/date-valid, catalog structure, search match, favorite ops.
    3. scripts/generate-news.mjs (shared, already written for both topics) + content/news/general/*.md seed data (6–8 months). Generator validation tests (topic="general" enforcement, missing-date, malformed-item → fail). predev/prebuild wire.
    4. tools.general-news.* messages (ko/en): search, month-jump, empty states, how-to, FAQ.
    5. useTimeline hook (dynamic import + localStorage favorites + in-memory fallback).
    6. MonthlyNews component (topic="general" prop) + MonthJump + NewsSearch + TimelineMonth/TimelineItem (cards, states, favorite toggle).
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, focus).
    8. MonthlyNewsIntro/HowTo/Faq + SoftwareApplication + FAQPage + ItemList JSON-LD via platform lib/seo.ts.
    9. Registry: add general-news entry; wire slug→component (MonthlyNews topic="general") + generateMetadata; set status→live.
    10. E2E tests (scenarios 1–4); visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_data note="initial content, 6+ months, 8–12 items per month">
    - Topics: business, economics, culture, science, society, international affairs.
    - Example: date=2026-07-15, headline="Global EV Market Surges Despite Economic Slowdown", summary="Electric vehicle sales reach record high in Q2 across major markets.", sources=[Reuters, Bloomberg], tags=[경제, 자동차, 녹색에너지].
  </seed_data>
  <testing_strategy>Pure Vitest ≥80% (schema/parse/validate/search/favorites); generator validation fixtures (topic="general" mismatch, missing-date, malformed-item → fail); component catalog-injected mocks; E2E scenarios 1–4 (esp. #1 folder→timeline, #3 JSON-LD, #4 a11y); localStorage jsdom-isolated.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, month header sticky behavior, JSON-LD primed HTML, generator real-fail cases.</tool_usage>
</key_implementation_notes>

</project_specification>
```

**Line count: 418**
