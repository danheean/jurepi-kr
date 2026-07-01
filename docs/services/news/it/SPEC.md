# Monthly IT News — Curated IT Industry News Timeline — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Monthly IT News** (월간 IT 뉴스) — a browsable monthly timeline of curated IT industry news, hand-authored as markdown. One markdown file = one month of IT news. At build time a generator scans the folder, parses frontmatter + news items (heading format), validates, and emits a static catalog. The tool mounts as a client-side SPA offering timeline browsing, search, and in-tool favorites. This is a **single-tool instance** (IT-focused only) that shares the MonthlyNews engine and generator with its sibling **general-news** (月간 일반 뉴스).
> Internal codename: `monthly-news` (shared engine). This SPEC registry id: `it-news`. Public URL slug: `/[locale]/tools/it-news`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same engine, monthly-news family): [`docs/services/news/monthly-news/SPEC.md`](../monthly-news/SPEC.md)

```xml
<project_specification>

<project_name>Monthly IT News — Curated News Timeline for IT Industry (Jurepi tool, registry id it-news, sibling to general-news)</project_name>

<overview>
Monthly IT News answers "What happened in tech this month?" by offering a curated, hand-selected timeline of IT industry news organized by month. Technology trends, AI breakthroughs, startups, security, platforms, and developer culture are the focus. Content is NOT auto-fetched from feeds or scraped — it is **human-curated markdown**, one file per month, with headlines, brief summaries, source links, and tags. At build time the same generator scans the `content/news/it/` folder, validates structure, and bakes a static catalog. The tool then renders a searchable monthly timeline with month jump, search, and optional favorites (localStorage).

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The news catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + month jump + last view), and nothing is ever sent over the network.

CRITICAL (content model, single topic): every news item is a `##` markdown heading in the form `## YYYY-MM-DD · Headline`, followed by 1–3 sentence summary and optional `- 출처:` / `- 태그:` lines. One file = IT news for one month at `content/news/it/<YYYY-MM>.md`. The build generator validates pair/structure/dates/references and **fails the build with a clear message** if ANY rule is broken (no silent omission). This is a single-topic tool instance (unlike the monthly-news family SPEC which covers both it and general topics).

CRITICAL (SEO/GEO): the tool page + monthly summaries render server-side OUTSIDE the `mounted` gate (AI crawlers see them). JSON-LD: use schema.org **ItemList / ListItem** for each month's items, **CollectionPage**, **BreadcrumbList**. Longform intro + FAQ prose and all JSON-LD MUST be in server-rendered body. Only date-dependent or localStorage-dependent parts sit behind the mount gate.

CRITICAL (platform integration): the `'news'` category (ToolCategory enum) is NOT yet wired — no i18n label ko "뉴스"/en "News", not in CATEGORY_ORDER/FOOTER_CATEGORIES, no category accent. Activating the `news` category is a one-time platform prerequisite, SHARED with the sibling `general-news` (and potentially future `rankings` tools in the news category). Two `ToolMeta` registry entries (it-news, general-news) + two slug→component branches (same MonthlyNews component, different `topic` prop) + two `generateMetadata` branches.
</overview>

<platform_integration>
  - Route: /[locale]/tools/it-news (SSG; registry id "it-news", slug "it-news", status "live", category "news", accent "sky").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.it-news.*` (UI chrome strings: month jump, search, how-to, FAQ, favorites, empty states — NOT news item content; that comes from markdown in news.generated.json); the in_content AdSlot below the tool.
  - Platform dependency (TWO-PART): (1) Add `'news'` category to ToolCategory enum + activate it with i18n label ko "뉴스"/en "News", CATEGORY_ORDER position, FOOTER_CATEGORIES, and category accent (sky, per it-news identity). (2) Add ONE `ToolMeta` registry entry (it-news, alongside general-news), slug→component branch in the tool route (routes to MonthlyNews with topic="it"), and `generateMetadata` branch per topic. The shared generator and component are wired once; each tool instance is a thin registry + topic-prop slice.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed news items for IT topics (one file per month at `content/news/it/<YYYY-MM>.md`).
    - Build-time generator (shared with general-news): folder scan → frontmatter parse → item heading parse (## YYYY-MM-DD · Headline) → validation → code-split static catalog (news.generated.json). Wired to `prebuild`/`predev`.
    - Seed content: minimum 6 months of IT news (2026-07 back to 2026-02 recommended), 8–12 items per month. Topics: AI, startups, crypto, security, hardware, platforms, developer culture.
    - News item templates & authoring README.
    - Timeline rendering: vertical months (newest first), items within month sorted date-descending. Sticky month header.
    - Month jump: dropdown list of available months, quick navigate.
    - Search: item headline + summary + tags, debounced live filter, result count.
    - Favorites (pinned items): localStorage persistence, pin/unpin toggle, localStorage-pruned on load.
    - Full keyboard support: "/" search focus, arrow keys timeline scroll, "f" toggle favorite (focused item).
    - Tool-specific SEO long-form ("IT news this month" / "Stay informed with tech trends") + FAQ (FAQPage JSON-LD) + **ItemList / ListItem JSON-LD** (schema.org for timeline browsing), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Automated news feed scraping / RSS ingestion / live API fetches (this is NOT an aggregator; content is human-curated markdown only).
    - User comments / submissions / ratings / discussion.
    - Per-item deep-link URLs (e.g., /tools/it-news/2026-07-22-headline) — MVP is a single route + client state. (Phase 2 candidate.)
    - Multiple news topics per instance (this tool = IT only; general-news is a separate instance).
  </out_of_scope>
  <future_considerations>
    - Per-month static deep-link pages + individual NewsArticle JSON-LD pages (SEO) — Phase 2.
    - Newsletter subscription form (with third-party backend link, out of scope) — Phase 2.
    - "This Week in Tech" AI-powered summary (Phase 2, backend).
    - Topic expansion (e.g., crypto-news, health-news as separate tools) — Phase 2+ (same engine, folder-based).
    - Share image generation (per-month) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>News items live as markdown files in `content/news/it/<YYYY-MM>.md`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Frontmatter carries metadata (topic, year, month, optional title/summary).</frontmatter_parsing>
    <item_parsing>Generator regex-parses `##` markdown headings in the form `## YYYY-MM-DD · Headline` to extract date, headline, and summary. No markdown HTML rendering needed — summaries are plain text.</item_parsing>
    <validation>zod v3.x (already used in repo) for (1) frontmatter schema (2) item structure invariants (3) date-in-month validation. Validation is strict: all items must have valid date, unique source links, etc. Build failure on violation.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/monthly-news/data/news.generated.json), dynamically imported only on this tool's route so content never enters the global i18n message bundle (protects platform JS budget).</catalog>
    <animation>Native CSS transitions only (month fade-in, search debounce, favorite star pop). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter + item validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-news.mjs                    # Build time: scan content/news/<topic>/*.md → parse frontmatter + items → validate → emit news.generated.json. Shared with general-news. Wired to prebuild/predev.
content/news/
├── it/
│   ├── 2026-07.md                       # One month of IT news (frontmatter topic: it)
│   ├── 2026-06.md
│   └── …
└── general/
    ├── 2026-07.md                       # (Separate topic; separate tool instance)
    └── …
src/
├── lib/monthly-news/                    # Pure domain layer — no React/Next, fully unit-tested (shared with general-news)
│   ├── schema.ts                        # zod: NewsFileFront, NewsItem, StoreSchema (favorites, lastMonthView)
│   ├── parse.ts                         # parseItems(markdown): extract ## YYYY-MM-DD · Headline items
│   ├── validate.ts                      # validateMonth(items, year, month): dates in range, required fields
│   ├── catalog.ts                       # Typed access: allItems, byMonth, monthList(), monthTitle(year, month)
│   ├── search.ts                        # filterItems(items, query): headline + summary + tags, case-insensitive
│   └── favorites.ts                     # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown
├── components/tools/monthly-news/       # Shared component (topic prop switches behavior)
│   ├── MonthlyNews.tsx                  # Orchestrator (Client Component) — topic prop, month/search/favorites state + useTimeline() owner
│   ├── useTimeline.ts                   # Hook: dynamic catalog import + localStorage favorites + derived filter/select
│   ├── TimelineMonth.tsx                # Sticky month header ("2026년 7월") + month's items
│   ├── TimelineItem.tsx                 # One-item card: date, headline, summary, source links (open new tab), tags, favorite star
│   ├── MonthJump.tsx                    # Dropdown / combobox: jump to a month (available months list)
│   ├── NewsSearch.tsx                   # Search input ("/" focus, clear, result count, aria)
│   ├── MonthlyNewsIntro.tsx             # H1 + lead + topic description (SSR-friendly)
│   ├── MonthlyNewsHowTo.tsx             # "How to stay informed" / "Follow IT trends" (SEO long-form)
│   ├── MonthlyNewsFaq.tsx               # Q&A + FAQPage JSON-LD
│   └── data/
│       └── news.generated.json          # Generated artifact — [NewsItem...]
└── i18n/messages/{ko,en}.json           # tools.it-news.* UI chrome (search, month labels, FAQ, empty states)
</file_structure>

<core_data_entities>
  <news_item note="parsed from ## markdown headings + body">
    - date: string (YYYY-MM-DD) — extracted from heading; must fall within file's year/month
    - headline: string (non-empty) — extracted from heading after ·
    - summary: string (1–3 sentences, plain text) — paragraph(s) immediately following heading
    - sources: { text: string; url: string }[] — extracted from `- 출처:` lines (markdown links)
    - tags: string[] — extracted from `- 태그:` comma-separated list
    INVARIANT: date valid YYYY-MM-DD, within month, headline non-empty, ≥ 1 source recommended.
  </news_item>
  <news_file_front note="individual markdown file frontmatter">
    - topic: enum (it | general) — required, must match file folder (it for this tool)
    - year: number (e.g., 2026) — required
    - month: number (1–12) — required
    - title?: string — optional; if absent, auto-generate from year+month+topic
    - summary?: string — optional (1 line, used for card meta/SEO)
    INVARIANT: topic="it", year/month valid (month 1–12). Mismatch with file folder → generator error.
  </news_file_front>
  <timeline_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: { date: string; topic: string; headline: string }[] — favorited items, insertion order
    - lastMonthView: { topic: string; year: number; month: number; ts: number } — last month browsed
    localStorage key: `jurepi-monthly-news`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Orphan items pruned on load.
  </timeline_store>
  <constants>
    - SEARCH_DEBOUNCE = 120ms; TOAST_MS = 1600ms.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/it-news" page="MonthlyNews (topic=it, platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <monthly_news>                 <!-- "use client"; owns month + search + favorites state + useTimeline() owner. Passed topic="it" from route. -->
    <monthly_news_intro />       <!-- H1 + lead + IT focus description (server-render where possible) -->
    <timeline_layout>            <!-- Main column: month jump + search + vertical month groups -->
      <month_jump />             <!-- Dropdown: available months, jump to month -->
      <news_search />            <!-- "/" focus, clear, result count -->
      <timeline_months>          <!-- Vertical scroll, months newest-first -->
        <timeline_month>         <!-- Month header + items -->
          <timeline_item />      <!-- × N: date, headline, summary, sources, tags, favorite star -->
          <empty_state />        <!-- No items in month / no search results -->
        </timeline_month>
      </timeline_months>
    </timeline_layout>
    <monthly_news_how_to />      <!-- SEO long-form ("Stay informed with IT trends") -->
    <monthly_news_faq />         <!-- FAQPage JSON-LD -->
  </monthly_news>
  <note>SPA within tool: month/search/favorite = local state switch, NOT route navigation. Single-column layout, responsive.</note>
</component_hierarchy>

<pages_and_interfaces>
  <monthly_news_intro>
    - Eyebrow: "뉴스" / "NEWS" — 12px/700/0.6px, var(--brand).
    - H1: "IT 월간 뉴스" / "IT Monthly News" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Topic descriptor: 1–2 sentences, body-lg 18px var(--text-secondary): IT industry focus (e.g., "AI, startups, security, platforms — what's happening in tech this month").
  </monthly_news_intro>

  <month_jump>
    - Dropdown/combobox UI, "2026년 7월로 이동" / "Jump to July 2026", label "Month".
    - Lists all available months (from catalog), newest first. Click = scroll to month.
    - Keyboard: ArrowUp/Down navigate, Enter jump, Esc close.
  </month_jump>

  <news_search>
    - DESIGN text-input style, full width, leading Search icon (lucide, 20px var(--text-muted)), placeholder "IT 뉴스·요약·태그로 검색".
    - Focus on "/" keypress. Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption var(--text-muted), aria-live="polite".
    - aria: role="searchbox", aria-controls timeline.
  </news_search>

  <timeline_month>
    - Sticky month header: "2026년 7월" (year + "년" + month + "월"), large headline 24px var(--text)/700, var(--hairline) bottom border.
    - Sticky position: top 0 (adjusted for header height), z-index below modal.
    - Items list below header (roving tabindex for a11y).
  </timeline_month>

  <timeline_item>
    - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, margin-bottom 12px.
    - Top row: date (eyebrow 12px var(--text-muted) "YYYY-MM-DD") + headline (card-title 17px var(--text)/700).
    - Top-right: favorite star button (aria-pressed), icon 20px.
    - Body: summary 2-line clamp (body-sm 14px var(--text-secondary)).
    - Source links: comma-separated text links (14px var(--brand-ink)), open new tab (rel=noopener noreferrer), underline on hover.
    - Tags (if any): pills, var(--surface-muted) + var(--text-muted), radius var(--radius-pill), padding 4px 10px.
    - States: hover translateY(-2px) + var(--shadow-card-hover); favorite filled var(--accent-sky); focus 2px var(--focus-ring) ring.
    - aria: card aria-label = "date headline"; star is stateful button aria-pressed.
  </timeline_item>

  <keyboard_shortcuts>
    - "/" → search input focus (when not already typing).
    - ArrowDown/Up → scroll timeline (month/item focus move).
    - "f" (item focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search if non-empty, else no-op.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-news.mjs (shared)">
    - Scan content/news/it/, collect all *.md files.
    - gray-matter parse each file frontmatter → zod NewsFileFront validate (topic must = "it").
    - Regex parse `## YYYY-MM-DD · Headline` items + body + `- 출처:` / `- 태그:` lines.
    - Validate (fail → process.exit(1) with file/field/reason): topic="it", year/month valid, items date-in-month, required fields per item.
    - Sort: by year desc → month desc → items within month date-desc. Deterministic.
    - Emit news.generated.json (code-split). package.json wire: "predev": "node scripts/generate-news.mjs", "prebuild": "node scripts/generate-news.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allItems(topic="it"): NewsItem[] (sorted month-desc → date-desc). byMonth(topic="it", year, month): items. monthList(topic="it"): [{ year, month, count, title }, …].
    - Tests assert catalog structure, date validity.
  </catalog_access>
  <search>
    - filterItems(items, query): blank query → as-is. Else normalize (trim, NFC, lowercase). Match if ANY of: headline, summary, tags. Stable order.
  </search>
  <favorites_and_recents note="immutable — return new arrays">
    - toggleFavorite(list, date, topic, headline): add if absent, remove if present (preserve order).
    - pruneUnknown(items, catalogTopics): drop items no longer in catalog (run on load).
  </favorites_and_recents>
  <persistence_adapter useTimeline>
    - Mount: dynamic catalog import; read `jurepi-monthly-news` → zod → pruneUnknown → state; fail → start fresh (no throw).
    - Change: debounced JSON.stringify → setItem; catch quota → keep in-memory.
    - Expose: filtered list by month, search query, selectedMonth, jump(month), toggleFavorite, favorites, search(query).
  </persistence_adapter>
  <i18n>All UI chrome from tools.it-news.* (ko/en): month labels, search, month-jump, toasts, empty states, how-to, FAQ. News items come from markdown (news.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Dates outside month or topic mismatch trigger strict failure.
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
    - Category accent: SKY (var(--accent-sky) #38bdf8 / var(--accent-sky-soft)) for it-news identity. Intro icon tile, favorite star (filled), item hover. CTAs (primary buttons, month-jump) stay brand honey-gold var(--brand).
  </accent_usage>
  <surfaces>Item card = var(--surface) + 1px var(--hairline), radius var(--radius-lg); month header var(--surface); tag chips var(--surface-muted).</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); month headline (24px/700); item headline (card-title 17px/700); summary body-sm (14px); date eyebrow (12px).</typography>
  <motion>transform/opacity only: item hover translateY(-2px) 150ms, favorite star pop (scale 1→1.2→1) 150ms, month fade-in 150ms. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion.</motion>
  <accessibility>Item/star = labeled real buttons; tablist month-jump; search aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); WCAG 2.1 AA contrast.</accessibility>
  <responsive>≥1024px: main column full width. 768–1023px: single column, month header sticky. <768px: single column, no overflow (320 test).</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Headline/summary/tags render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Source links: href validated (http/https only), rendered as text links.
    - Generator validates frontmatter with zod (type/required/format). Unknown fields ignored.
  </input>
  <privacy>Favorites localStorage-only, never sent. No analytics event includes item details.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); generator validates structure so no malformed entry ships.</content_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites>Pin items; localStorage-remembered. Reduce repeat-scroll friction.</favorites>
  <month_jump>Fast navigation to a month. Dropdown list of all available months.</month_jump>
  <search_across_months>Headline + summary + tags matched across all months; result count shown.</search_across_months>
  <keyboard_first>"/" search, ArrowDown/Up timeline scroll, "f" favorite (focused item), Esc clear — mouse-free power.</keyboard_first>
  <structured_data>ItemList + each month ListItem; CollectionPage JSON-LD (schema.org). Discovery = DESIGN principle ③.</structured_data>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → timeline auto-compose</description>
    <steps>
      1. Files exist: content/news/it/2026-07.md (and earlier months).
      2. pnpm dev (or build) → predev generator runs → news.generated.json has IT items.
      3. Visit /ko/tools/it-news → timeline renders July 2026 items (date-descending).
      4. Add content/news/it/2026-08.md, rebuild → month-jump shows August; items render.
      5. Malformed items (missing date/headline) → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, month jump, favorites, keyboard</description>
    <steps>
      1. Type "AI" in search → items matching headline/summary/tags filter; result count updates.
      2. Click month dropdown, select "2026년 6월" → timeline scrolls to June; month header sticky.
      3. Type "asdfqwer" → empty "'asdfqwer'에 해당하는 뉴스가 없어요" + clear.
      4. Star an item ("f" or click) → filled star var(--accent-sky), toast "즐겨찾기 추가"; reload → item still starred (localStorage).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>i18n, SEO (JSON-LD), source links</description>
    <steps>
      1. Switch to /en/tools/it-news → chrome English; month header "July 2026"; source links clickable.
      2. Build prod → /ko/tools/it-news and /en/tools/it-news unique title/description/canonical/hreflang, statically generated.
      3. HTML has SoftwareApplication + FAQPage + ItemList (each month) + ListItem (each item) JSON-LD.
      4. Source links open new tab (rel=noopener noreferrer); URLs validated as http/https.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Accessibility, reduced-motion, 320px no overflow</description>
    <steps>
      1. "/" → search focus. Type "crypto" → results filter. Esc → clear. ArrowDown → scroll timeline.
      2. Focus item with Tab; "f" → toggle favorite (aria-pressed=true, star filled, toast).
      3. axe pass → no violations. Item cards labeled. Focus ring visible (var(--focus-ring)).
      4. prefers-reduced-motion: ON → no scale pop on favorite, fade instead; timeline still operable. 320px viewport → no horizontal overflow.
    </steps>
  </test_scenario_4>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<YYYY-MM>.md` markdown file in content/news/it/, rebuild, auto-reflect in timeline with zero code change; generator validates frontmatter/items/dates, fails build with clear message on violation.</content_model>
  <functionality>Browsable vertical month timeline (newest-first), items sorted date-descending; searchable headline + summary + tags; month jump dropdown; localStorage favorites (pin/unpin); seed 6+ months.</functionality>
  <user_experience>Month jump/search instant; items feel readable; ≥44px targets; visible focus; SPA — no route reload on any interaction.</user_experience>
  <technical_quality>lib/monthly-news/* pure ≥80% unit coverage (schema/parse/validate/search/favorites); generator validation tests (missing-date, malformed-item → fail); TS 0 errors; &lt;800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; sky accent identity; bright, clean timeline (not dense table); text-node render only. 320/768/1024 responsive, no overflow.</visual_design>
  <accessibility>Full keyboard ("/" search, ArrowUp/Down scroll, "f" favorite, Esc close); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected (ad height platform-reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-news.mjs to freshen news.generated.json. /[locale]/tools/it-news pre-rendered by platform generateStaticParams iterating registry (status "live"). News catalog ships as code-split chunk on this route only.</note>
  <generated_artifact>news.generated.json: (a) .gitignore and always regenerate via predev/prebuild, OR (b) commit for reproducibility + CI checks "is generated artifact up-to-date?" (recommended: commit, deterministic generator).</generated_artifact>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'news' category must be wired first (platform prerequisite).
    {
      id: 'it-news',
      slug: 'it-news',
      category: 'news',
      icon: 'Cpu',                // lucide-react
      accent: 'sky',
      status: 'live',
      isNew: false,
      order: 20,
      keywords: ['IT','뉴스','기술','AI','스타트업','보안','개발','기술 트렌드','…'],
    },
    ```
    Also add slug→component branch (&lt;MonthlyNews topic="it"/&gt;) and generateMetadata branch (title/description/JSON-LD) in tool route alongside general-news.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → parse items → validate → news.generated.json. Entire tool depends on this. Validation failure = build fail.
    2. Item parsing (## YYYY-MM-DD · Headline + body + sources/tags) + date-in-month validation + topic="it" enforcement.
    3. Search (headline + summary + tags, diacritic/case-ignore, across all months).
    4. Month jump + timeline scroll (sticky month header, items date-desc).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/monthly-news/{schema,parse,validate,catalog,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema, item parse/date-valid, topic validation, catalog structure, search match, favorite ops. Topic="it" assertion in tests.
    2. scripts/generate-news.mjs + content/news/it/{_TEMPLATE.md, README} + seed data (6 months IT news with topic: it frontmatter). Generator validation tests (missing-date, malformed-item, topic mismatch → fail). predev/prebuild wire.
    3. tools.it-news.* messages (ko/en): search, month-jump, empty states, how-to, FAQ.
    4. useTimeline hook (dynamic import + localStorage favorites + in-memory fallback).
    5. MonthJump + NewsSearch + TimelineMonth/TimelineItem (cards, roving tabindex, states, favorite toggle).
    6. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, focus).
    7. MonthlyNewsIntro/HowTo/Faq + SoftwareApplication + FAQPage + ItemList JSON-LD via platform lib/seo.ts (topic-aware intro text).
    8. Registry status→live (after 'news' category wired); slug→component + generateMetadata branches; E2E tests (scenarios 1–4).
    9. Visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_data note="initial 6 months, IT-focused — author fine-tunes">
    - 2026-07 through 2026-02: AI breakthroughs, startup news, security, platforms, hardware, developer culture. 8–12 items per month.
    - Example: date=2026-07-22, headline="OpenAI Releases o1 Reasoning Model", summary="New frontier in AI reasoning and complex problem-solving.", sources=[OpenAI, TechCrunch], tags=[AI, LLM].
  </seed_data>
  <generator_sketch>
    ```javascript
    // scripts/generate-news.mjs (outline) — deterministic
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) content/news/*/YYYY-MM.md scan (both it/ and general/), collect by topic
    // 2) matter(file).data → zod NewsFileFront.parse (enforce topic match folder) (collect errors)
    // 3) file.content regex parse ## YYYY-MM-DD · Headline + body + sources/tags → NewsItem[]
    // 4) validate: topic match folder, year/month valid, items date-in-month, required fields → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(news.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/parse/validate/search/favorites + topic enforcement); generator validation fixtures (missing-date, topic-mismatch cases); component catalog-injected mocks (topic="it"); E2E scenarios 1–4 (esp. #1 folder→timeline, #3 JSON-LD, #4 a11y 320px); localStorage jsdom-isolated.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, month header sticky behavior, JSON-LD primed HTML (ItemList for IT items), generator real-fail cases (topic mismatch).</tool_usage>
</key_implementation_notes>

</project_specification>
```

**Line count: 404**
