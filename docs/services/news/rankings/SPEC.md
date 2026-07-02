# 별별 랭킹 (Various Rankings) — Curated Top N Lists Across Many Domains — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **별별 랭킹 / Various Rankings** (Korean display name: **별별 랭킹**; English display name: *Various Rankings*) — a curated browsable collection of "Top N" ranked lists across domains (movies, books, restaurants, travel, games, music, tools, apps, etc.) stored as markdown files and auto-compiled into a searchable, interactive **ranked table** interface. Content is managed as markdown pairs (`<ranking>.md` + `<ranking>_en.md`), and at build time a generator reads the folder, validates, and emits a static catalog. The tool mounts as a client-side SPA offering field tabs, search, favorites/recents, and per-ranking detail view that renders items as a **table** (rank + medal 🥇🥈🥉, name, description, link, image) with a **prominently emphasized source & as-of-date provenance banner**.
>
> Internal service codename: `rankings`. Registry id: `rankings`. Public URL slug: `/[locale]/tools/rankings`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/new-word/SPEC.md`](../new-word/SPEC.md)

```xml
<project_specification>

<project_name>별별 랭킹 (Various Rankings) — Curated Top N Ranked Lists rendered as tables (Jurepi tool, codename rankings, registry id rankings)</project_name>

<overview>
별별 랭킹 (Rankings) brings together trustworthy "Top N" lists curated by editors across domains users care about. Whether seeking the best movies this year, top restaurants by cuisine in a city, or most-used dev tools, a visitor searches for a field ("restaurants", "movies", "games"), browses the available ranked lists within that field, opens one, and reads items ranked 1–N **in a clean, scannable table** (rank column with medals + name + description + link/image) with optional external links (Rotten Tomatoes, Michelin guide, YouTube) and hero images. Each ranking is **editor-authored markdown** — not user-voted, not AI-generated, not real-time — with an explicit "as-of date" and source/provenance note. This solves "What's genuinely the best X?"

CRITICAL (trust surface — TOP priority): a ranking is only useful if the reader can immediately judge **who ranked it and when**. The **source note (`sourceNote`) and as-of date (`asOfDate`) are the single most important UI elements** and MUST be rendered as a prominent, high-contrast provenance banner at the top of every detail view (NOT a muted caption) — plus a compact source+date line on every list card. Both fields are `required` in the schema; a ranking without them fails the build. Emphasis > decoration: this banner outranks medals, images, and links in visual priority.

CRITICAL (presentation — table form): item lists render as a **semantic HTML `<table>`** (`<thead>` with column headers, `<tbody>` rows, `<caption>` for a11y), NOT as loose card/row stacks. Columns: rank (medal 🥇🥈🥉 for top 3), optional thumbnail, name, description, link. Table is responsive (horizontal scroll or column collapse at 320px, never overflow) and fully keyboard/screen-reader accessible.

The tool's content model is fundamental: rankings are NOT code — they are **markdown files**. Create pairs in the content folder (`<ranking>.md` for Korean + `<ranking>_en.md` for English), and at **build time** a generator scans the folder, parses the frontmatter, validates it, and bakes it into a static catalog (rankings.generated.json). The tool then dynamically imports that catalog to render the list, search, and detail views. This means "drop a file in the folder and it appears" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime file system access. The ranking catalog is built into static JSON at build time, sourced from markdown. The only first-party persistence is `localStorage` (favorites + recents), and nothing is ever sent over the network. NO user voting, NO submissions, NO real-time updates.

CRITICAL (content model, invariants): every ranking MUST have a Korean file and an English file as a matching pair. Each file carries a non-empty `title`, `field`, `asOfDate`, and `items` (≥3 items per ranking). Each item has `rank` (number), `name`, `description`, `link` (optional, rel=noopener), and `imageUrl` (optional, explicit dimensions). The build generator validates pair integrity, required fields, field uniqueness per locale, and **fails the build** if ANY rule is broken.

CRITICAL (SPA, usability-first): every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — field switching, search, selecting rankings, opening items — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the list is visible, search is one keystroke away ("/"), and every ranking is reachable in under a second.
</overview>

<platform_integration>
  - Route: /[locale]/tools/rankings (SSG; registry slug "rankings", id "rankings", status "live", accent "rose", category "news").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.rankings.*` (UI chrome strings: fields, search, how-to, FAQ, medal labels, link labels — NOT ranking content; that comes from markdown in rankings.generated.json); the in_content AdSlot below the tool.
  - Platform dependency: this tool lives in the `'news'` category (뉴스), alongside the monthly-news tools. NOTE: `'news'` is the 7th category and is NOT yet wired in `ToolCategory`/i18n/`FOOTER_CATEGORIES`/`CATEGORY_ORDER`/accent — activating it is a one-time platform prerequisite (shared with the monthly-news tools). The tool keeps `rose` as its own per-tool identity accent (per-tool accents are allowed). Plus the standard ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed ranking catalog (pairs: `<ranking>.md` + `<ranking>_en.md`) in `content/rankings/`.
    - Build-time generator: folder scan → frontmatter parse → validation → code-split static catalog (rankings.generated.json). Wired to `prebuild`/`predev`.
    - Four seed fields with 2–3 seeded rankings each (8+ items per ranking minimum): **movies** (this year's top films, underrated gems), **restaurants** (sushi by city, pizza by origin), **travel** (must-see destinations, hidden gems), **games** (best indie games, classic board games). Scalable to more fields.
    - **Ranking markdown templates**: annotated markdown templates (`content/rankings/_TEMPLATE.md`, `content/rankings/_TEMPLATE_en.md`) and authoring README to make adding new rankings easy.
    - Field tabs: derived from unique fields in the catalog (All / Movies / Restaurants / Travel / Games / etc.). Virtual tabs: Favorites (when pinned), Recent (when viewed).
    - Search: ranking titles, item names, descriptions, field names across BOTH locales, real-time filter (debounced). Case and diacritic insensitive.
    - Detail view: ranking title, field badge, **prominently emphasized provenance banner (source note + as-of date — high contrast, iconized, top of view)**, then an **item table** (`<table>`: rank 1–N with medal emoji 🥇🥈🥉 for top 3, optional thumbnail, name, description, external link if present, optional linked image with explicit width/height + lazy).
    - Favorites (pinned) + recent views — localStorage persistence, auto-prune of unknown ranking IDs.
    - Full keyboard support: "/" search focus, arrow keys item/ranking navigation, Enter to open, Esc to clear/close.
    - Tool-specific SEO long-form (rankings intro, "What are the best restaurants/games/movies?") + FAQ + **ItemList / ListItem JSON-LD** (schema.org type for rankings, ideal for GEO/AI answer citation), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - User browser-based ranking add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - User voting, rating, or submission of rankings (NO crowdsourced / social features).
    - Real-time ranking updates. Content is static, authored, reviewed, versioned via git.
    - Per-ranking deep-link URLs (e.g., /tools/rankings/best-pizza) — MVP is a single route + client state. (Phase 2 candidate.)
    - Rich HTML/script in markdown body. Descriptions are structured fields (plain text / limited inline emphasis), rendered safely.
  </out_of_scope>
  <future_considerations>
    - Per-ranking static deep-link routes + individual ListItem pages (SEO) — Phase 2.
    - Field expansion: sports, music, books, startups, podcasts, etc. (catalog only, schema unchanged).
    - Ranking-of-the-day random card / share image — Phase 3.
    - Editor comments / annotations on items — Phase 3.
    - User suggestions form → repository issue/PR link — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Rankings live as markdown pairs in `content/rankings/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Descriptions/links are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged ranking-record invariants. Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/rankings/data/rankings.generated.json), dynamically imported only on this tool's route so ranking content never enters the global i18n message bundle (protects platform JS budget — same pattern as new-word/qna-a-day).</catalog>
    <animation>Native CSS transitions only (card hover lift, item row focus, detail fade-in). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-rankings.mjs                 # Build time: scan content/rankings/* → parse → validate → emit rankings.generated.json. Wired to prebuild/predev.
content/rankings/                          # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md          # Templates (excluded by generator)
├── README.md                              # Authoring guide (field list, item format, as-of-date rule)
└── rankings/*.md  *_en.md                 # Ranking pairs
src/
├── lib/rankings/                          # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: RankingFileFront(ko/en), MergedRanking, StoreSchema + STORE_VERSION
│   ├── merge.ts                           # mergePair(koFront, enFront): apply canonical rule → MergedRanking; validatePair
│   ├── slug.ts                            # slugify(title), resolveSlug(front, filename)
│   ├── catalog.ts                         # Typed access: allRankings, byId, byField, fields(); field enum
│   ├── search.ts                          # filterRankings(rankings, query, locale): title+field+items, both locales; normalize
│   └── favorites.ts                       # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(ids, catalog)
├── components/tools/rankings/
│   ├── Rankings.tsx                       # Orchestrator (Client Component) — field/query/selectedId state + useRankingsCatalog() owner
│   ├── useRankingsCatalog.ts              # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── FieldTabs.tsx                      # All / Movies / Restaurants / Travel / Games / (Favorites) / (Recent) pills
│   ├── RankingSearch.tsx                  # Search input ("/" focus, clear, result count, aria)
│   ├── RankingsList.tsx                   # Responsive card list; roving tabindex keyboard nav
│   ├── RankingCard.tsx                    # One-ranking card: title, field badge, item count, star + compact source+date line (always visible)
│   ├── RankingDetail.tsx                  # Selected ranking: title, field, ProvenanceBanner, then RankingTable
│   ├── ProvenanceBanner.tsx               # CRITICAL — high-contrast source note + as-of date callout (icon + emphasis); top of detail
│   ├── RankingTable.tsx                   # Semantic <table>: thead (rank/name/description/link cols) + tbody rows + caption; responsive + a11y
│   ├── RankingRow.tsx                     # One <tr>: rank cell (+ medal emoji top 3), optional thumbnail, name, description, optional link
│   ├── RankingsIntro.tsx                  # H1 + lead (SEO; server-render where possible)
│   ├── RankingsHowTo.tsx                  # "What are rankings?" / "Curated top lists" (SEO long-form)
│   ├── RankingsFaq.tsx                    # Q&A + FAQPage + ItemList JSON-LD
│   └── data/
│       └── rankings.generated.json        # Generated artifact — [MergedRanking...]
└── i18n/messages/{ko,en}.json             # tools.rankings.* UI chrome (tabs, search, field labels, toasts, how-to, FAQ, medal labels, TABLE COLUMN HEADERS [rank/name/description/link], provenance labels [source/as-of date])
</file_structure>

<core_data_entities>
  <ranking_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — ranking title (that locale)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - field: enum (movies, restaurants, travel, games, music, books, apps, startups, sports) — Korean file canonical; Phase 2 extensible
    - asOfDate: string ISO date (required) — publication date "2025-12", "2025-01-15", etc.
    - sourceNote: string (required, max 200 chars) — provenance, PER-LOCALE (KO file = Korean note, EN file = English note; EN inherits KO if omitted): "Editor's personal picks, Jan 2025" / "Based on Michelin Guide 2024" / etc.
    - sourceUrl?: string (optional, valid http(s) URL) — clickable source link (canonical from KO; rel=noopener target=_blank), rendered in the ProvenanceBanner.
    - items: array (required, ≥3)
      - rank: number (1–N)
      - name: string (required)
      - description: string (required, plain text, ≤200 chars)
      - link?: string (external URL, rel=noopener target=_blank)
      - imageUrl?: string (external or local asset path)
      - imageWidth?: number (px, required if imageUrl set)
      - imageHeight?: number (px, required if imageUrl set)
    INVARIANT: title/field/asOfDate/sourceNote/items non-empty, items ≥3. zod parse failure → collect as error (build failure candidate).
  </ranking_file_front>
  <merged_ranking note="ko+en merge result; catalog record; rankings.generated.json item">
    - slug: string — unique identifier (unique per field+locale; favorites/recents reference)
    - field: enum — Korean file canonical
    - asOfDate: string ISO
    - sourceUrl?: string — optional clickable source link (canonical; rel=noopener). Rendered as a link in the ProvenanceBanner when present.
    - ko: { title, sourceNote, items: [{ rank, name, description, link?, imageUrl?, imageWidth?, imageHeight? }, ...] }
    - en: { title, sourceNote, items: [...] } — title/sourceNote/items are PER-LOCALE (localized like the rest of the app's content); EN inherits KO sourceNote if omitted. items may differ (e.g., "Best Pizza Worldwide" vs "Best Pizza in Tokyo").
    INVARIANT — PAIR/FIELDS/UNIQUENESS: every record has both ko+en; each has title + ≥3 items; slug unique within field; rank 1–N consecutive. Violation → generator build failure.
  </merged_ranking>
  <field note="grouping by domain; localized label from i18n">
    - id: enum (movies, restaurants, travel, games, music, books, apps, startups, sports). Display order: per FIELD_ORDER. Label: tools.rankings.fields.<id>.
    - Virtual tabs (not real fields): "all" (every ranking), "favorites" (pinned), "recent" (MRU).
  </field>
  <rankings_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — ranking slugs, insertion order
    - recents: string[] — ranking slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastField?: string; createdAt: number }
    localStorage key: `jurepi-rankings`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown ids pruned on load.
  </rankings_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; FIELD_ORDER = ['all', 'movies', 'restaurants', 'travel', 'games', 'music', 'books', 'apps', 'startups', 'sports']; MEDAL_EMOJI = ['🥇', '🥈', '🥉'].
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/rankings" page="Rankings (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. Per-ranking deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <rankings>                      <!-- "use client"; owns field + query + selectedId + useRankingsCatalog() state -->
    <rankings_intro />            <!-- H1 + lead (server-render where possible) -->
    <rankings_layout>             <!-- Selector (list) on top, full-width detail below when selected — same on desktop & mobile -->
      <rankings_main>             <!-- Left/top column -->
        <ranking_search />        <!-- "/" focus, clear, result count -->
        <field_tabs />            <!-- All / Movies / Restaurants / … / Favorites / Recent -->
        <rankings_list>           <!-- Roving tabindex cards -->
          <ranking_card />        <!-- × N: click = select; star = favorite -->
          <empty_state />         <!-- No results / empty favorites -->
        </rankings_list>
      </rankings_main>
      <ranking_detail>            <!-- Full-width panel below the list; shown only when a ranking is selected -->
        <provenance_banner />     <!-- CRITICAL: emphasized source note + as-of date (top, high contrast) -->
        <ranking_table>           <!-- Semantic <table>; thead + caption -->
          <ranking_row />         <!-- × N <tr>: rank (medal), thumbnail?, name, desc, link? -->
        </ranking_table>
      </ranking_detail>
    </rankings_layout>
    <rankings_how_to />           <!-- SEO long-form -->
    <rankings_faq />              <!-- FAQPage + ItemList JSON-LD -->
  </rankings>
  <note>SPA within tool: field/search/select = local state switch, NOT route navigation. Detail is a full-width panel rendered below the selector (same component on desktop & mobile), not a sidebar or bottom-sheet.</note>
</component_hierarchy>

<pages_and_interfaces>
  <rankings_intro>
    - Eyebrow: "순위 도구" / "RANKINGS TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "별별 랭킹" / "Various Rankings" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg: "영화·음식·여행·게임 등 다양한 분야의 신뢰할 수 있는 순위 목록을 찾아보세요." / English equivalent.
  </rankings_intro>

  <ranking_search>
    - DESIGN text-input style, main column full width, leading Search icon (20px), placeholder "순위·영화·레스토랑으로 검색…" / "Search rankings…".
    - Focus on "/" keypress. Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption.
    - aria: role="searchbox", aria-controls the list.
  </ranking_search>

  <field_tabs>
    - Horizontal pill row. Order: "전체"(all) → field(s) by FIELD_ORDER → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active.
  </field_tabs>

  <rankings_list>
    - Responsive grid: 1-column <768px; 2-column ≥768px. Full container width (the detail sits below, not beside).
    - Each card: title (headline 18–20px var(--text)/700), field badge (rose-tinted pill), item count ("N개 항목"), star (favorite toggle), and a COMPACT SOURCE+DATE line (always visible, not hidden on hover): Calendar icon + as-of date and a truncated source note — e.g. "📅 2024-12 · 출처: Michelin Guide 2024". This is the card's trust cue; keep it legible (var(--text-secondary), not near-invisible muted).
    - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, shadow --shadow-card.
    - States: hover translateY(-2px) + --shadow-card-hover; focus 2px var(--focus-ring); selected 2px var(--accent-rose) ring.
    - Roving tabindex; ArrowUp/Down move; Enter/Space open detail; "f" toggle favorite.
    - empty_state: "'{query}'에 해당하는 순위가 없어요" / "No rankings found"; or "별을 눌러 즐겨찾기를 저장하세요".
  </rankings_list>

  <ranking_detail>
    - Placement: a FULL-WIDTH panel rendered below the selector (search + tabs + card list), shown only once a ranking is selected. RATIONALE: a ranking is a wide, long table (10+ rows × rank/name/description); a narrow sticky sidebar cramps it — the description column wraps character-by-character and half the viewport sits empty. Full width lets the table breathe. Same layout on desktop and mobile (single column, stacked). (Superseded design: an earlier 360px sticky-right sidebar — do NOT reintroduce it.)
    - Panel surface: var(--surface), radius var(--radius-xxl), padding 24px (16px on mobile), 1px var(--hairline), shadow --shadow-card.
    - Deselect affordance: X button (lg:hidden — mobile) to clear the selection; Esc also clears.
    - Content (top → bottom):
      1. Title: large headline 28px var(--text) + field badge.
      2. PROVENANCE BANNER — CRITICAL, most prominent element after the title. A distinct rose-tinted callout surface (var(--accent-rose-soft) bg, 1px var(--accent-rose) or hairline, radius --radius-lg, padding 12–16px), NOT a muted caption:
         - As-of date: Calendar icon (16–18px) + label "기준일" / "As of" + value ("2024-12" / "January 2025") — value in var(--text)/600, high contrast.
         - Source note: BookMarked/Info icon + label "출처" / "Source" + `sourceNote` value in var(--text)/500 (e.g., "Editor's picks, Jan 2025" / "Based on Michelin Guide 2024").
         - Both lines readable at a glance; banner has aria-label grouping ("출처 및 기준일"). Contrast meets WCAG AA. This banner is the trust anchor — it must never be visually subordinate to the table.
      3. Item TABLE (semantic `<table>`, ordered by rank):
         - `<caption class="sr-only">` = "{ranking title} — {N}개 항목 순위표" for screen readers.
         - `<thead>`: column headers (scope="col") — 순위/Rank, (썸네일/·) , 이름/Name, 설명/Description, 링크/Link. Header row var(--surface-muted).
         - `<tbody>` rows (`<tr>`), zebra/hover via var(--surface-muted):
           · Rank cell: medal emoji (🥇🥈🥉 top 3, plain "4." rest), rose accent text for top 3, tabular-nums.
           · Thumbnail cell (if imageUrl): small fixed-size img (explicit width/height, lazy, rounded).
           · Name cell: bold 15–16px var(--text).
           · Description cell: 14px var(--text-secondary), plain text.
           · Link cell (if present): small rose-tinted "View on Rotten Tomatoes" with external icon (rel=noopener target=_blank).
         - Responsive: ≥768px full table; <768px horizontal scroll wrapper (overflow-x:auto, focusable region role="region" aria-label) OR stacked-row fallback — never overflow at 320px.
    - Empty/initial (not selected): hint "순위를 선택하면 순위표가 여기에 표시됩니다."
  </ranking_detail>

  <keyboard_shortcuts_reference>
    - "/" → search input focus (when not typing).
    - Arrow keys → ranking card/item focus move.
    - Enter / Space → open focused ranking detail.
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search or deselect the open ranking detail.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-rankings.mjs">
    - Scan content/rankings/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → zod RankingFileFront validate.
    - mergePair: apply canonical rule (ko field/asOfDate/sourceUrl canonical + en inherit if absent; sourceNote/title/items PER-LOCALE — EN sourceNote inherits KO if omitted, else independent). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields, slug uniqueness per field, item count ≥3, consecutive ranks.
    - Sort (field order → asOfDate desc → title locale order), emit rankings.generated.json. Deterministic.
    - package.json wire: "predev": "node scripts/generate-rankings.mjs", "prebuild": "node scripts/generate-rankings.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allRankings(): MergedRanking[] (generation order). byId(slug), byField(field). fields(): live field ids in catalog.
    - Tests assert catalog uniqueness, field validity, locale completeness.
  </catalog_access>
  <search>
    - filterRankings(rankings, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.title, en.title, ko.field, en.field, ko.items[].name, en.items[].name. Stable order.
    - Compose with field tab: list = filterRankings(active-field subset, query). Favorites/Recent tabs filter their own subsets.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(ids, catalog): drop ids not in current catalog (run on load).
    - Recent push: when detail opens (select). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useRankingsCatalog>
    - Mount: dynamic catalog import; read `jurepi-rankings` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, selectedId + select(id), toggleFavorite, favorites, recents, lastField, copy(text).
  </persistence_adapter>
  <i18n>All UI chrome from tools.rankings.* (ko/en): tabs, field labels, search, toasts, empty states, how-to, FAQ, medal labels. Ranking title/items come from markdown (rankings.generated.json), NOT i18n messages.</i18n>
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
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Per-tool identity accent is ROSE (var(--accent-rose) / var(--accent-rose-soft)). Intro icon tile, card selected bar, top-3 medal text, favorite star (filled), and the PROVENANCE BANNER background/border. (Category is `news`; this tool uses rose as its own per-tool identity accent.)
    - CTAs (primary buttons) stay brand honey-gold var(--brand).
    - Field badge color: rose-tinted pill per ranking field.
  </accent_usage>
  <provenance_banner note="CRITICAL — the trust anchor; source note + as-of date must be emphasized, never muted">
    - Surface: var(--accent-rose-soft) background, 1px var(--accent-rose)/hairline border, radius --radius-lg, padding 12–16px, sits directly under the detail title.
    - Icons: Calendar (as-of date), BookMarked/Info (source). Labels ("기준일"/"출처") in eyebrow weight; VALUES in var(--text) 600 high contrast (this is the point — the reader must instantly see who ranked it and when).
    - Contrast: WCAG AA against rose-soft; must remain the second-most-prominent element (after title), above the table.
  </provenance_banner>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius --radius-xxl; item rows var(--surface-muted) chips on hover. Soft brand-tinted shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); ranking title (card 18–20px / detail 28px)/700; item name 16px/bold; description/note caption/eyebrow. Medal emojis for top 3.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail fade-in 150ms on selection. All gated by prefers-reduced-motion.</motion>
  <accessibility>Card/star/link = labeled real buttons; roving-tabindex list; copy/favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); links rel=noopener; images lazy+explicit dimensions. TABLE: real `<table>`/`<thead>`/`<tbody>`/`<th scope="col">` + sr-only `<caption>`; horizontal-scroll wrapper is a focusable role="region" with aria-label; provenance banner grouped with aria-label ("출처 및 기준일"). No `<div>`-grid faking a table.</accessibility>
  <responsive>
    - All breakpoints: single column — selector (search + tabs + card grid) on top, full-width detail section below when a ranking is selected. Card grid: 1-col <768px, 2-col ≥768px.
    - The detail's `<table>` is the responsive unit: full table ≥768px; <768px horizontal-scroll wrapper (overflow-x:auto, focusable region). No page overflow at 320px.
  </responsive>
  <atmosphere>Bright, trustworthy "curated rankings": generous card spacing, medal emoji, clear as-of dates. The BROWSE layer is discoverable, tappable cards (not a dense list); the DETAIL layer renders the items as a clean, scannable table anchored by the emphasized source+date banner. Trust-first, editorial, not a spreadsheet.</atmosphere>
  <icons>lucide-react: Search, Star/StarOff (favorite), ExternalLink (links), Trophy (tool card icon), Calendar (as-of date), BookMarked/Info (source note). Default 20px (16–18px inside provenance banner), stroke 1.75, currentColor. Registry card icon: `Trophy`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Title/description/sourceNote render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Links rendered as `<a href={link} rel="noopener target="_blank" />` (external, safe).
    - Images: explicit width/height, lazy load, no <script> in src.
    - Generator validates frontmatter with zod (type/required/length).
  </input>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes ranking data.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness.</content_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-search friction. Unknown ids auto-pruned.</favorites_recents>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite — mouse-free power.</keyboard_first>
  <structured_data>ItemList + each item ListItem JSON-LD (position, name, description, url) — search engine recognizes rankings (discoverability = DESIGN principle ③).</structured_data>
  <external_links>Links marked rel=noopener for security; trusted sources (IMDb, Michelin, Rotten Tomatoes, TripAdvisor, etc.) encoded in markdown.</external_links>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → list auto-compose</description>
    <steps>
      1. best-sushi.md + best-sushi_en.md exist in content/rankings/ with field: restaurants, ≥3 items.
      2. pnpm dev → predev generator runs → rankings.generated.json has merged record (ko/en title, items).
      3. Visit /ko/tools/rankings → list renders "최고의 초밥" card (restaurant field badge).
      4. Add new pair top-movies-2025(.md/_en.md), rebuild → list auto-updates (no code edit).
      5. Missing pair or <3 items → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, field filter, empty states</description>
    <steps>
      1. Type "영화" in search → narrows to movie rankings; result count updates; aria-live announces.
      2. Clear, click "음식점" (restaurants) field → restaurant rankings only.
      3. Type "asdfqwer" → empty "'asdfqwer'에 해당하는" + clear; clear restores.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Detail — emphasized provenance banner + item table (medals, links, images)</description>
    <steps>
      1. Click "최고의 초밥" card → detail opens: title + field badge, then the PROVENANCE BANNER prominently shows "기준일 2024-12" and "출처: Based on Michelin Guide 2024" (rose-soft callout, high contrast — NOT a muted caption). Verify banner is visually above/before the table.
      2. Below it, a semantic `<table>` renders with `<thead>` column headers (순위/이름/설명/링크) and rows: 🥇 Jiro Ono, 🥈 Mizutani, 🥉 Saito, "4." Sukiyabashi Jiro. Each row has its description cell.
      3. Row 1 has a link cell to IMDb (text "View on IMDb", rel=noopener, new tab) + thumbnail (lazy, explicit dims).
      4. At 320px the table scrolls horizontally (focusable region) without page overflow; image loads on scroll; link opens in new tab.
      5. Screen reader announces caption + column headers; provenance banner announced as a labeled group.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Favorites, recent, persistence, keyboard, a11y</description>
    <steps>
      1. Open 2 different rankings → "최근" tab lists them MRU.
      2. Star a card → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload → favorites/recents persist (localStorage); unknown ids pruned.
      4. "/" → search focus; arrow navigate cards; Enter open detail; axe pass → no violations.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD), locale swap</description>
    <steps>
      1. Switch to /en → chrome (tabs/search/how-to) English; card title English.
      2. Build prod → /ko/tools/rankings and /en/tools/rankings unique title/canonical/hreflang.
      3. HTML has SoftwareApplication + FAQPage + ItemList JSON-LD (each ranking's items as ListItem); ranking dataset code-split chunk (not global i18n).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<ranking>.md` + `<ranking>_en.md` pair in content folder, rebuild, auto-reflect in list/search/detail with zero code change; generator validates pair/field/items/uniqueness, fails build with clear message on violation.</content_model>
  <functionality>Searchable, field-filterable card list (both locales); detail renders items as a semantic `<table>` (medals, links, images); localStorage favorites + recent; seed 4+ fields × 2+ rankings each (8+ items per ranking).</functionality>
  <trust_surface>CRITICAL: every detail view leads with an emphasized, high-contrast provenance banner showing source note + as-of date (not a muted caption); every list card shows a compact source+date line. Both fields required by schema — build fails if absent.</trust_surface>
  <user_experience>Search/filter instant; cards readable; ≥44px targets; visible focus; table never overflows at 320px; SPA — no route reload on any interaction.</user_experience>
  <technical_quality>lib/rankings/* pure ≥80% unit coverage (schema/merge/slug/search/favorites); generator validation tests (pair-missing, dupe-slug, <3-items, bad-links → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; rose identity + brand honey-gold CTA; medal emoji for top 3; emphasized rose-soft provenance banner; clean editorial table (styled headers, zebra/hover, tabular-nums — intentional, not a raw spreadsheet); text-node render only.</visual_design>
  <accessibility>Full keyboard (roving list, "/", Enter, "f", Esc); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; CLS unaffected; LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-rankings.mjs to freshen rankings.generated.json. /[locale]/tools/rankings pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'news' category must be added to ToolCategory (7th category); 'rose' is this tool's per-tool accent.
    {
      id: 'rankings',
      slug: 'rankings',
      category: 'news',
      icon: 'Trophy',
      accent: 'rose',
      status: 'live',
      isNew: true,
      order: 15,
      keywords: ['별별랭킹','별별','랭킹','순위','영화','음식','여행','게임','음악','책','앱','추천','best','top','rankings','curator','ratings'],
    },
    ```
    Also add slug→component branch (<Rankings/>) and generateMetadata branch in tool route. No new category label needed.
  </platform_registry_change>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate → rankings.generated.json. Entire tool depends on this.
    2. Pair/canonical-merge rule (ko field/asOfDate/sourceNote canonical, en inherit) + slug uniqueness + field enum validation.
    3. Search (both locales, diacritic/case-ignore) + field compose + item rendering (medals, links, images).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/rankings/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN).
    2. scripts/generate-rankings.mjs + content/rankings/{_TEMPLATE,_TEMPLATE_en,README} + seed (best-sushi, top-movies, famous-travel, indie-games). Validation tests (pair-missing, <3-items, dupe-slug → fail). predev/prebuild wire.
    3. tools.rankings.* messages (ko/en): field labels, tabs, search, toasts, empty states, how-to, FAQ, medal labels.
    4. useRankingsCatalog hook (dynamic import + localStorage + in-memory fallback).
    5. RankingSearch + FieldTabs + RankingsList/RankingCard (roving tabindex, states) + empty states.
    6. RankingDetail: ProvenanceBanner (emphasized source note + as-of date — build/verify FIRST as the trust anchor) → RankingTable/RankingRow (semantic table, medals/links/thumbnails, responsive scroll).
    7. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live).
    8. RankingsIntro/HowTo/Faq + SoftwareApplication + FAQPage + ItemList JSON-LD via platform lib/seo.ts.
    9. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_rankings note="initial content — author fine-tunes but start with these">
    - movies: top-2024-films (2024년 최고 영화, 8+ items), underrated-gems (저평가된 명작, 6+ items).
    - restaurants: best-sushi-worldwide (최고의 초밥, 8+), ramen-by-region (지역별 라면, 6+).
    - travel: must-see-asia (아시아 필수 여행지, 10+), hidden-europe (숨은 유럽 보석, 6+).
    - games: best-indie-games-2024 (2024 인디게임, 8+), classic-board-games (클래식 보드게임, 6+).
  </seed_rankings>
  <generator_sketch>
    ```javascript
    // scripts/generate-rankings.mjs (outline)
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) rankings/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod RankingFileFront.parse (collect errors)
    // 3) mergePair(ko, en): canonical rule (ko field/asOfDate/sourceNote), resolveSlug
    // 4) validate: pair-integrity / required-fields / field-valid / items ≥3 / ranks consecutive / slug-unique-per-field → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(rankings.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/favorites); generator validation fixtures (pair-missing/<3-items/dupe cases); component catalog-injected mocks; E2E scenarios 1–5; localStorage jsdom-isolated.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

466 lines, English, final.
