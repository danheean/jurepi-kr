# 맛집 리스트 (Restaurant List — Map-Based Curated Places) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **맛집 리스트 / Restaurant List** (Korean display name: **맛집 리스트**; English display name: *Restaurant List*) — a map-based discovery tool where curated place lists (themed restaurants, cafés, bars by region or cuisine) are stored as markdown files with place entries including name, coordinates, category, description, and optional links. At build time a generator reads the folder, validates geospatial integrity, and emits a static catalog. The tool mounts as a client-side SPA offering an **interactive map** (markers, clustering, click-to-pan) synchronized with a **filterable place list** (cards: name, category badge, distance, description, link). Search, region/category tabs, favorites (localStorage), optional geolocation to center the map. The Maps API (NAVER Maps JS API v3, client-side public client ID) is lazy-loaded only on this route; graceful fallback to list-only if SDK fails.
>
> Internal service codename: `restaurant-map`. Registry id: `restaurant-map`. Public URL slug: `/[locale]/tools/restaurant-map`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same markdown-catalog + generator pattern): [`docs/services/news/rankings/SPEC.md`](../../news/rankings/SPEC.md)

```xml
<project_specification>

<project_name>맛집 리스트 (Restaurant List — Map-Based Curated Places rendered with interactive map + list, Jurepi tool, codename restaurant-map, registry id restaurant-map)</project_name>

<overview>
맛집 리스트 (Restaurant List) brings together curated, editor-authored place collections by region and cuisine. Whether seeking hidden-gem cafés in Seongsu-dong, top ramen shops across Busan, or weekend brunch spots in Itaewon, a visitor browses themed lists, sees all places pinned on an **interactive map**, clicks a marker to highlight the card and pan the map, searches by name/cuisine/region, toggles favorites, and optionally centers the map on their location. Each place list is **editor-authored markdown** — not crowdsourced, not real-time, not AI-scraped — with explicit publication date, optional source/attribution, and geospatial data (name, lat/lng, category, address, description, optional link/price/image). This solves "Where should I eat/drink today?"

CRITICAL (trust + usability — map-list sync): the entire UX hinges on **bidirectional sync** between the map and the place list. Click a map marker → the list card highlights and scrolls into view. Click a list card → the map pans/zooms to that marker and opens an info window. The map and list are two views of the same data, always in sync. Search/filter applies to both surfaces simultaneously.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no API. The place catalog is built into static JSON at build time, sourced from markdown. The Maps JS SDK (NAVER Maps JS API v3, primary for Korea; Kakao Map JS SDK as alternative) is lazy-loaded on route mount via a `<script>` tag with a domain-restricted public client ID (`NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` committed to .env.production). The only first-party persistence is `localStorage` (favorites + recently viewed). Geolocation (optional, permission-gated) uses native browser Geolocation API. If the Maps SDK fails to load or the key is missing, the tool degrades gracefully to list-only mode with a friendly notice — the tool remains fully usable.

CRITICAL (presentation — map + list dual-surface): place lists render BOTH as an interactive map (NAVER Maps) with markers/clustering and as a responsive list of cards. Both surfaces are visible simultaneously on desktop (two-column or full-width map above list). On mobile (320px), the map and list stack vertically or can be toggled via tabs; map never causes page overflow. The map container reserves a fixed height (CLS-safe) and respects `prefers-reduced-motion` (instant pan/zoom, no easing animations).

CRITICAL (SPA, usability-first): every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. All interaction — list filtering, map pan, marker click, geolocation, favorites toggle — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the map loads instantly (pre-rendered SSG shell), search is one keystroke away ("/"), and any place is reachable in under a second.
</overview>

<platform_integration>
  - Route: /[locale]/tools/restaurant-map (SSG; registry slug "restaurant-map", id "restaurant-map", status "coming_soon", accent TBD [coral or rose], category "fun").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.restaurant-map.*` (UI chrome strings: tabs, search, map/list toggle, geolocation prompt, how-to, FAQ, distance unit — NOT place content; that comes from markdown in restaurant-map.generated.json).
  - Platform dependency: this tool lives in the `'fun'` category (재미). NOTE: `'fun'` is PROVISIONAL and NOT YET wired in `ToolCategory`/i18n/`FOOTER_CATEGORIES`/`CATEGORY_ORDER`/accent — **this is a prerequisite flag for the platform to activate**. The tool keeps a chosen accent (coral or rose; TBD per design review) as its own per-tool identity. Plus the standard ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
  - CRITICAL ENVIRONMENT: `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` (string, committed to .env.production) — a NAVER Cloud Platform (NCP) Maps "Web Dynamic Map" client ID restricted by a Web service URL allowlist (production domain + localhost for dev). The client ID is safe to commit as a public identifier (no secret) but MUST be URL-restricted in the NCP console. If the client ID is absent or invalid, the tool loads in list-only mode with a notice.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed place list catalog (pairs: `<list>.md` + `<list>_en.md`) in `content/restaurant-map/`. Each file: frontmatter (title, region, city, asOfDate, sourceNote/sourceUrl, places[]), markdown body optional intro.
    - Build-time generator: folder scan → frontmatter parse → validation (geo bounds, pair integrity, ≥3 places) → code-split static catalog (restaurant-map.generated.json). Wired to `prebuild`/`predev`. Failure on violation.
    - Four seed themed lists (e.g., "성수동 감성 카페" 6+ places, "부산 로컬 맛집" 5+ places, "이태원 브런치" 4+ places, "강남 스시집" 3+ places) ko/en with plausible Seoul/Busan/regional coordinates + descriptions.
    - **Place markdown templates**: annotated markdown templates (`content/restaurant-map/_TEMPLATE.md`, `content/restaurant-map/_TEMPLATE_en.md`) and authoring README to make adding new lists easy (fields: name, region, city, asOfDate, sourceNote, places[{name, lat, lng, category, address, description, link?, priceRange?, imageUrl?}]).
    - Region/category tabs: derived from unique regions and categories in the catalog (All / 서울 (Seoul) / 부산 (Busan) / 대구 / ... / (카페 / 한식 / 일식 / 브런치 / ...) / (Favorites) / (Recent)).
    - Interactive map (NAVER Maps JS API v3): markers for each place, cluster when dense, click marker → highlight list card + pan, info window on click. Graceful fallback (list-only + notice) if SDK fails.
    - Place list: responsive cards (name, category badge, region, distance from user [if geolocation enabled], short description, optional link + icon). Roving keyboard navigation.
    - Search: place names, categories, regions, cuisines, across BOTH locales, real-time filter (debounced). Case and diacritic insensitive. Applies to both map (filter markers) and list (filter cards).
    - Geolocation (optional, permission-gated): "내 위치" button triggers browser Geolocation API. If granted, centers map on user's lat/lng + shows radius circle + sorts cards by distance. If denied or unsupported, shows graceful message (no error). Distance calculation in km.
    - Favorites (pinned) + recent views — localStorage persistence, auto-prune of unknown place IDs.
    - Full keyboard support: "/" search focus, arrow keys place/card navigation, Enter to open detail, "f" favorite, Esc to clear/close.
    - Tool-specific SEO long-form (restaurant intro, "Where to eat by city/cuisine?", "What makes a good restaurant list?") + FAQ + **Restaurant / FoodEstablishment schema.org JSON-LD** (one per place, lat/lng/address/name/description, ideal for GEO/Maps indexing) + **ItemList JSON-LD** (places grouped by list), localized ko/en.
    - Reduced-motion fallbacks (instant map pan/zoom, no easing); WCAG 2.1 AA accessibility (keyboard, ARIA labels, color contrast).
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Runtime place add/edit UI (CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - User reviews, ratings, or submissions (NO crowdsourced / social features).
    - Real-time place updates or live reservation integration. Content is static, authored, reviewed, versioned via git.
    - Per-place deep-link URLs (e.g., /tools/restaurant-map/sushi-seongsu-1) — MVP is a single route + client state. (Phase 2 candidate.)
    - Rich HTML/script in markdown body. Descriptions are structured fields (plain text / limited inline emphasis), rendered safely.
    - Multiple Maps SDK instances or switching between Naver/Kakao at runtime (use NAVER Maps primary; Kakao noted as alternative if NAVER unavailable).
  </out_of_scope>
  <future_considerations>
    - Per-place static deep-link routes + individual place detail pages (SEO) — Phase 2.
    - Multi-photo gallery per place (from markdown imageUrl[] array) — Phase 2.
    - User geolocation radius filter (e.g., "within 5km") — Phase 2.
    - Map drawing tool: draw a bounding box or circle on the map to filter places — Phase 2.
    - Place-of-the-week card / random place recommender (similar to roulette) — Phase 3.
    - Editor comments / annotations on places — Phase 3.
    - User suggestion form → repository issue/PR link — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Place lists live as markdown pairs in `content/restaurant-map/`. File system access is build-time only (generator script). Runtime has NO file system access.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Place entries and descriptions are structured frontmatter fields, rendered as plain text.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged place-list-record invariants, including geospatial bounds (lat [33–39], lng [124–132] for Korea sanity, but allow global). Schemas are pure and reusable in both generator and runtime loader. Validation failure → build exit non-zero.</validation>
    <maps_sdk>NAVER Maps JS API v3 (client-side, public NCP client ID via `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`) loaded via dynamic script injection on route mount. Alternative: Kakao Map JS SDK if NAVER unavailable. SDK load is async; tool degrades to list-only if SDK fails to load or client ID is missing (no throw, graceful UX). Map container reserves fixed height (CLS-safe) via CSS aspect-ratio or explicit height + padding-bottom trick.</maps_sdk>
    <geolocation>Native browser Geolocation API (permission-gated). On grant, calculate distance to each place via Haversine formula (spherical geometry, accurate to ~0.5km for short distances). On deny, show friendly message (no error popup).</geolocation>
    <animation>Native CSS transitions only (card hover lift, map pan smooth, place highlight fade-in, marker pulse on select). Web Maps API pan/zoom animations are library-native (can't disable at granular level, but `prefers-reduced-motion` is respected by user's browser). No custom animation library.</animation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/restaurant-map/data/restaurant-map.generated.json), dynamically imported only on this tool's route so place content never enters the global i18n message bundle (protects platform JS budget — same pattern as new-word/rankings/qna-a-day).</catalog>
  </module_specific>
  <libraries>
    <gray_matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray_matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation, geospatial bounds checking.</zod>
    <naver_maps>NAVER Maps JS API v3 — client-side, dynamically loaded via `<script>` tag, public NCP client ID (Web service URL-restricted).</naver_maps>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-restaurant-map.mjs          # Build time: scan content/restaurant-map/* → parse → validate → emit restaurant-map.generated.json. Wired to prebuild/predev.
content/restaurant-map/                   # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md         # Templates (excluded by generator)
├── README.md                             # Authoring guide (region list, place format, coordinate ranges)
└── place-lists/*.md  *_en.md             # Place list pairs
src/
├── lib/restaurant-map/                   # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                         # zod: PlaceFileFront(ko/en), Place, MergedPlaceList, StoreSchema + STORE_VERSION
│   ├── merge.ts                          # mergePair(koFront, enFront): apply canonical rule → MergedPlaceList; validatePair
│   ├── slug.ts                           # slugify(title), resolveSlug(front, filename)
│   ├── catalog.ts                        # Typed access: allPlaceLists, byId, byRegion, byCategory, regions(), categories(); geo bounds validation
│   ├── search.ts                         # filterPlaces(places, query, locale): name+category+region+city, both locales; normalize
│   ├── geo.ts                            # haversineDistance(lat1, lng1, lat2, lng2): km; isValidCoord(lat, lng): bounds check
│   └── favorites.ts                      # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(ids, catalog)
├── components/tools/restaurant-map/
│   ├── RestaurantMap.tsx                 # Orchestrator (Client Component) — region/category/query/selectedId state + useRestaurantMapCatalog() owner + map SDK loader
│   ├── useRestaurantMapCatalog.ts        # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select + geolocation state
│   ├── MapContainer.tsx                  # NAVER Maps JS API wrapper; renders markers, clusters, info window; syncs with list selection
│   ├── MapMarker.tsx                     # Single marker render; click → callback to select place (handled by parent)
│   ├── PlaceList.tsx                     # Responsive card list; roving tabindex keyboard nav; synced with map selection
│   ├── PlaceCard.tsx                     # One-place card: name, category badge, region, distance (if geo enabled), short desc, star favorite, optional link
│   ├── RegionTabs.tsx                    # All / 서울 / 부산 / ... / (Favorites) / (Recent) pills
│   ├── CategoryFilter.tsx                # Optional secondary filter: (All categories) / 카페 / 한식 / 일식 / 브런치 / ...
│   ├── PlaceSearch.tsx                   # Search input ("/" focus, clear, result count, aria)
│   ├── GeolocationButton.tsx             # "내 위치" button; on grant show distance; on deny show friendly message
│   ├── MapToggle.tsx                     # Mobile: tab-like toggle between Map View | List View (on desktop both visible)
│   ├── RestaurantMapIntro.tsx            # H1 + lead (SEO; server-render where possible)
│   ├── RestaurantMapHowTo.tsx            # "What is Restaurant List?" / "How to find places" (SEO long-form)
│   ├── RestaurantMapFaq.tsx              # Q&A + FAQPage + ItemList JSON-LD + Restaurant schema.org per place
│   ├── MapFailover.tsx                   # Shown if SDK fails to load: message + list-only UI
│   └── data/
│       └── restaurant-map.generated.json  # Generated artifact — [MergedPlaceList...]
└── i18n/messages/{ko,en}.json            # tools.restaurant-map.* UI chrome (tabs, search, map/list toggle, "내 위치", distance unit [km], how-to, FAQ, category labels [카페/한식/...])
</file_structure>

<core_data_entities>
  <place note="individual place within a list">
    - name: string (required, non-empty) — place name
    - lat: number (required, ≥33 and ≤39 for Korea, or global bounds) — latitude
    - lng: number (required, ≥124 and ≤132 for Korea, or global bounds) — longitude
    - category: string (required, enum-like: 카페, 한식, 일식, 중식, 브런치, 바, 디저트, 기타) — place type (localized labels in i18n)
    - address: string (required, non-empty) — street address, human-readable
    - description: string (required, plain text, ≤300 chars) — why this place is worth visiting
    - link?: string (optional, valid http(s) URL) — external URL (Naver Place, Google Maps, restaurant website, etc.; rel=noopener target=_blank)
    - priceRange?: string (optional, e.g., "₩10,000–20,000" or "$15–30") — price estimate
    - imageUrl?: string (optional, external or local asset path, explicit dimensions required)
    - imageWidth?: number (px, required if imageUrl set)
    - imageHeight?: number (px, required if imageUrl set)
    INVARIANT: name/lat/lng/category/address/description non-empty, coordinate bounds valid, ≥3 places per list. zod parse failure → collect as error (build failure candidate).
  </place>
  <place_list_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — list title (that locale, e.g., "성수동 감성 카페" or "Seongsu-dong Aesthetic Cafés")
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - region: enum (서울/Seoul, 부산/Busan, 대구/Daegu, 대전/Daejeon, 광주/Gwangju, 울산/Ulsan, 경기/Gyeonggi, 강원/Gangwon, 충북/Chungbuk, 충남/Chungnam, 전북/Jeonbuk, 전남/Jeonnam, 경북/Gyeongbuk, 경남/Gyeongnam, 제주/Jeju) — geographic scope (Korean file canonical; EN inherits if absent)
    - city?: string (optional, more granular: e.g., "강남구" under 서울) — city/district within region
    - asOfDate: string ISO date (required) — publication date "2025-01", "2025-01-15", etc.
    - sourceNote: string (required, max 200 chars) — provenance, PER-LOCALE (KO file = Korean note, EN file = English note; EN inherits KO if omitted): "Local guide picks, Jan 2025" / "Based on Michelin Bib Gourmand 2024" / etc.
    - sourceUrl?: string (optional, valid http(s) URL) — clickable source link (canonical from KO; rel=noopener target=_blank), rendered in UI.
    - places: array (required, ≥3)
      - [Detailed place schema as above]
    INVARIANT: title/region/asOfDate/sourceNote/places non-empty, places ≥3, all coords valid, category known. zod parse failure → collect as error (build failure candidate).
  </place_list_file_front>
  <merged_place_list note="ko+en merge result; catalog record; restaurant-map.generated.json item">
    - slug: string — unique identifier (unique per region+locale; favorites/recents reference)
    - region: enum — Korean file canonical
    - city?: string — optional city/district
    - asOfDate: string ISO
    - sourceUrl?: string — optional clickable source link (canonical; rel=noopener).
    - ko: { title, sourceNote, places: [{ name, lat, lng, category, address, description, link?, priceRange?, imageUrl?, imageWidth?, imageHeight? }, ...] }
    - en: { title, sourceNote, places: [...] } — title/sourceNote/places are PER-LOCALE; EN inherits KO sourceNote if omitted. places may differ (e.g., different restaurant names or descriptions per market).
    INVARIANT — PAIR/FIELDS/UNIQUENESS: every record has both ko+en; each has title + ≥3 valid places; slug unique within region; lat/lng bounds valid. Violation → generator build failure.
  </merged_place_list>
  <region note="geographic grouping; localized label from i18n">
    - id: enum (seoul, busan, daegu, daejeon, gwangju, ulsan, gyeonggi, gangwon, chungbuk, chungnam, jeonbuk, jeonnam, gyeongbuk, gyeongnam, jeju). Display order: per REGION_ORDER. Label: tools.restaurant-map.regions.<id>.
    - Virtual tabs (not real regions): "all" (every place), "favorites" (pinned), "recent" (MRU).
  </region>
  <category note="place type; localized label from i18n">
    - id: enum (cafe, korean, japanese, chinese, brunch, bar, dessert, other). Label: tools.restaurant-map.categories.<id>.
  </category>
  <restaurant_map_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — place list slugs, insertion order
    - recents: string[] — place list slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - userGeo?: { lat: number; lng: number; timestamp: number } — cached geolocation result (for performance; retry if stale)
    - meta: { lastRegion?: string; createdAt: number }
    localStorage key: `jurepi-restaurant-map`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown ids pruned on load.
  </restaurant_map_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; REGION_ORDER = ['all', 'seoul', 'busan', 'daegu', ...]; CATEGORY_ORDER = ['all', 'cafe', 'korean', 'japanese', 'chinese', 'brunch', 'bar', 'dessert', 'other']; MAP_CENTER_DEFAULT = { lat: 37.5665, lng: 126.9780 } (Seoul); PLACE_ICON_SIZE = 24px; CLUSTER_RADIUS = 80px.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/restaurant-map" page="RestaurantMap (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "coming_soon" or "live") to SSG. Per-place deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <restaurant_map>                  <!-- "use client"; owns region + category + query + selectedId + mapSDKReady state + useRestaurantMapCatalog() + geolocation state owner -->
    <restaurant_map_intro />        <!-- H1 + lead (server-render where possible) -->
    <restaurant_map_layout>         <!-- Desktop: full-width map above or beside responsive list; Mobile: stacked or toggled -->
      <map_column>
        <map_container />           <!-- NAVER Maps JS API wrapper; renders markers + clusters + info window; synced with list selection -->
        <map_toggle />              <!-- Mobile-only: toggle between Map View | List View -->
        <map_failover />            <!-- Shown only if SDK fails to load: friendly message + list-only UI -->
      </map_column>
      <list_column>
        <place_search />            <!-- "/" focus, clear, result count -->
        <region_tabs />             <!-- All / 서울 / 부산 / ... / Favorites / Recent -->
        <category_filter />         <!-- Optional secondary filter (All categories / 카페 / 한식 / ...) -->
        <geolocation_button />      <!-- "내 위치" button; on grant show distance per card; on deny show notice -->
        <place_list>                <!-- Roving tabindex cards -->
          <place_card />            <!-- × N: click = select + pan map; star = favorite -->
          <empty_state />           <!-- No results / empty favorites -->
        </place_list>
      </list_column>
    </restaurant_map_layout>
    <restaurant_map_how_to />       <!-- SEO long-form -->
    <restaurant_map_faq />          <!-- FAQPage + Restaurant schema.org JSON-LD + ItemList JSON-LD -->
  </restaurant_map>
  <note>SPA within tool: region/search/select = local state switch, NOT route navigation. Map and list are always in sync; bidirectional: click marker ↔ click card. On mobile, map and list may be toggled (tabs) but both are available. Desktop shows both full-width or side-by-side.</note>
</component_hierarchy>

<pages_and_interfaces>
  <restaurant_map_intro>
    - Eyebrow: "맛집 도구" / "RESTAURANT TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "맛집 리스트" / "Restaurant List" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg: "서울·부산·지역별 맛집과 카페를 지도에서 발견하세요." / English equivalent.
  </restaurant_map_intro>

  <map_container>
    - NAVER Maps JS API wrapper: lazy-load script on mount; on ready, instantiate map, render markers (lucide MapPin or custom icon, size 24px), add cluster (if >N markers, cluster them). On marker click, trigger place selection (highlight card, scroll into view, open info window on marker).
    - Map height: reserved via CSS (e.g., `aspect-ratio: 16/9` or `h-[400px]` on desktop, `h-[300px]` on mobile) to prevent CLS.
    - Info window on marker click: show place name + category badge + address, "Open in Maps" link (opens Naver Map place page / Google Maps).
    - Graceful fallback: if SDK load fails, show MapFailover component (friendly message + list-only UI).
    - Pan/zoom: smooth CSS transitions (library-native); respects `prefers-reduced-motion` at browser level (user-agent controlled, library respects it).
    - User geolocation (if granted): show blue dot on map + radius circle (e.g., 5km accuracy radius); center map on grant, ask permission once per session (don't spam).
  </map_container>

  <place_search>
    - DESIGN text-input style, column full width, leading Search icon (20px), placeholder "맛집·카페·지역으로 검색…" / "Search restaurants…".
    - Focus on "/" keypress. Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N개" caption.
    - aria: role="searchbox", aria-controls the list + map markers (both filtered).
  </place_search>

  <region_tabs>
    - Horizontal pill row. Order: "전체"(all) → region(s) by REGION_ORDER → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active.
  </region_tabs>

  <category_filter>
    - Secondary horizontal pill row (below region tabs). Order: "(전체 카테고리)" → category(s) by CATEGORY_ORDER.
    - Composable: region TAB + category FILTER both apply simultaneously (intersection).
    - Same styling as region tabs.
  </category_filter>

  <geolocation_button>
    - Small, labeled button: lucide MapPin icon + text "내 위치" / "My Location".
    - On click, request browser Geolocation permission (if not yet granted). On grant: center map on user's lat/lng, show blue dot, enable distance calculation (sort cards by distance km). On deny: show friendly toast "위치 권한이 거부되었습니다." (no error alert).
    - If location fetched, show distance on each place card: "2.3km away" (right side of card, var(--text-secondary)).
    - Distance uses Haversine formula (accurate to ~0.5km for short distances <50km).
  </geolocation_button>

  <place_list>
    - Responsive grid: 1-column <768px; can show multiple columns on wider screens. Full container width.
    - Each card: name (headline 16–18px var(--text)/700), category badge (colored pill per category), region name, distance (if geo enabled, right side), short description (12–14px var(--text-secondary), ≤50 chars truncated), star (favorite toggle), optional external link icon.
    - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 12px, shadow --shadow-card.
    - States: hover translateY(-2px) + --shadow-card-hover; focus 2px var(--focus-ring); selected 2px var(--accent-color) ring [accent color TBD, likely coral or rose].
    - Roving tabindex; ArrowUp/Down move; Enter/Space open detail or select on map; "f" toggle favorite.
    - empty_state: "'{query}'에 해당하는 맛집이 없어요" / "No restaurants found"; or "별을 눌러 즐겨찾기를 저장하세요".
  </place_list>

  <place_detail_card>
    - Shown when a place is selected (either via map marker click or list card click). Full card or drawer on mobile, inline panel on desktop.
    - Content: name (large), category + region badge, address (with copy button), description, optional image (lazy, explicit dims), optional price range, optional external link ("View on Google Maps", rel=noopener target=_blank, opens new tab).
    - Deselect affordance: X button (mobile) or click outside; Esc also closes.
    - Surface: var(--surface), radius var(--radius-xxl), padding 16px, 1px var(--hairline), shadow --shadow-card.
  </place_detail_card>

  <keyboard_shortcuts_reference>
    - "/" → search input focus (when not typing).
    - Arrow keys → place card/marker focus move.
    - Enter / Space → open focused place detail or select on map.
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search or deselect the open place detail.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-restaurant-map.mjs">
    - Scan content/restaurant-map/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → zod PlaceListFileFront validate (including geospatial bounds).
    - mergePair: apply canonical rule (ko region/asOfDate/sourceUrl canonical + en inherit if absent; sourceNote/title/places PER-LOCALE). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields, slug uniqueness per region, place count ≥3, coordinate bounds valid, category enum, address non-empty.
    - Sort (region order → asOfDate desc → title locale order), emit restaurant-map.generated.json. Deterministic.
    - package.json wire: "predev": "node scripts/generate-restaurant-map.mjs", "prebuild": "node scripts/generate-restaurant-map.mjs".
  </generation>
  <catalog_access note="runtime pure layer">
    - allPlaceLists(): MergedPlaceList[] (generation order). byId(slug), byRegion(region). regions(): live region ids in catalog. categories(): live category ids from all places.
    - Tests assert catalog uniqueness, region validity, locale completeness, coordinate bounds.
  </catalog_access>
  <search>
    - filterPlaces(places, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.title, en.title, ko.region, en.region, ko.places[].name, en.places[].name, ko.places[].category, en.places[].category. Stable order.
    - Compose with region + category tabs: list = filterPlaces(active-region + active-category subset, query). Favorites/Recent tabs filter their own subsets.
  </search>
  <maps_sdk_loader>
    - On component mount (useEffect), check if the NAVER Maps SDK is already loaded in window (global `naver.maps`). If not and NEXT_PUBLIC_NAVER_MAP_CLIENT_ID exists, dynamically inject `<script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...">`. On load, set mapSDKReady=true in state. On error or missing client ID, set mapSDKReady=false + show MapFailover (list-only mode).
    - Script loads async; MapContainer shows placeholder or spinner until SDK is ready.
    - If SDK load times out (>5s), treat as failure (fallback to list-only).
  </maps_sdk_loader>
  <map_marker_sync>
    - Every time selectedPlace changes (either via list card click or map marker click), update map state: pan/zoom to place coordinates, open info window on marker, highlight marker.
    - Every time filtered place list changes (via search/region/category), update map markers: re-render marker set, adjust cluster bounds, remove markers not in filtered set.
  </map_marker_sync>
  <geolocation>
    - On "내 위치" button click, request browser Geolocation (permission-gated). On success, store lat/lng in state + localStorage (jurepi-restaurant-map.userGeo). On error or deny, show friendly message (no console error, no alert).
    - With geolocation, calculate Haversine distance to each place, display on card (km, 1 decimal), optionally sort by distance.
    - If location stale (>1hr), prompt user to refresh.
  </geolocation>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(ids, catalog): drop ids not in current catalog (run on load).
    - Recent push: when place is selected (click marker or card). Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useRestaurantMapCatalog>
    - Mount: dynamic catalog import; read `jurepi-restaurant-map` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, selectedId + select(id), toggleFavorite, favorites, recents, lastRegion, userGeo, copy(text).
  </persistence_adapter>
  <i18n>All UI chrome from tools.restaurant-map.* (ko/en): tabs, region/category labels, search, toasts, empty states, how-to, FAQ, distance unit [km]. Place title/description/address come from markdown (restaurant-map.generated.json), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Orphan files are warned; minimum 1 violation triggers strict failure.
  </build_time>
  <maps_sdk_load_failure>
    - SDK fails to load or key is missing → MapFailover component replaces map. Shows friendly message: "지도를 로드할 수 없습니다. 아래 맛집 목록으로 확인하세요." / "Map unavailable. Use the restaurant list below." Tool remains fully usable (list + search + favorites + recents).
  </maps_sdk_load_failure>
  <geolocation_denied>
    - Browser denies Geolocation permission → show friendly toast, no console error. User can still browse/search; distance is not calculated.
  </geolocation_denied>
  <search_no_results>
    - Friendly empty state echoing query + "clear search" button; map shows no markers; detail retains last selection or empty hint.
  </search_no_results>
  <storage>
    <unavailable>Private mode/disabled → recents/favorites in-memory, no scary error. List/search/map fully work.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (favorites/recents not precious, no throw).</corrupt_blob>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls except SDK load; SDK is 3rd-party but gracefully fails over.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Per-tool identity accent TBD [coral or rose, pending design review]. Category badge colors: cafe (mint), korean (coral/rose), japanese (sky), brunch (sun), bar (grape), dessert (coral), other (text-secondary). (Intro icon tile, card selected ring, favorite star filled, map marker selected state.)
    - CTAs (primary buttons) stay brand honey-gold var(--brand).
    - Place card highlights: selected ring = tool's per-tool accent.
  </accent_usage>
  <surfaces>Card/detail = var(--surface) + 1px var(--hairline); detail radius var(--radius-xxl); place rows var(--surface-muted) on hover. Soft brand-tinted shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); list title (card 16–18px)/700; place name (detail 24px)/bold; address/description caption/eyebrow. Map marker labels 12px/600.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, detail fade-in 150ms on selection, map pan smooth. All gated by prefers-reduced-motion.</motion>
  <accessibility>Card/star/link = labeled real buttons; roving-tabindex list; copy/favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); links rel=noopener; images lazy+explicit dimensions. Map region aria-label for screen readers. Geolocation prompt is accessible modal (not native browser dialog if possible).</accessibility>
  <responsive>
    - Desktop (≥1024px): map full-width or 50% left column + 50% list right; controls grid (search + tabs + geolocation button) stack vertically in list column.
    - Tablet (768–1023px): map 60% top + list 40% below, or full-width map above full-width list stacked.
    - Mobile (<768px): map 50% + list 50% vertically stacked (or toggle via MapToggle tabs); all cards/controls single-column. Map never causes page overflow.
    - Card grid: 1-col <768px, 2-col ≥768px, 3-col ≥1200px (if space allows without cramping).
  </responsive>
  <atmosphere>Bright, discoverable, travel-inspired "find your next meal": generous card spacing, location badges, distance display (if geo enabled), clear images. The BROWSE layer is inviting cards (not dense spreadsheet); the MAP layer is instant visual gratification (see all places at a glance). Trust-first, curated by locals, not scrapes.</atmosphere>
  <icons>lucide-react: Search, Star/StarOff (favorite), MapPin (geolocation + tool identity), ExternalLink (links), MapIcon (map toggle on mobile), Cafe/UtensilsCrossed/Wine or similar for categories, Calendar (asOfDate), BookMarked/Info (source note). Default 20px (16–18px for category badges), stroke 1.75, currentColor. Registry card icon: `MapPin` or `UtensilsCrossed`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Name/address/description/sourceNote render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Links rendered as `<a href={link} rel="noopener target="_blank" />` (external, safe).
    - Images: explicit width/height, lazy load, no <script> in src.
    - Generator validates frontmatter with zod (type/required/length/coordinate bounds).
  </input>
  <maps_api>
    - Client ID is public (NEXT_PUBLIC_NAVER_MAP_CLIENT_ID) but MUST be URL-restricted in the NCP console (Web service URL allowlist: production domain + localhost). Build fails if the client ID is missing; graceful fallback to list-only if SDK fails to load.
  </maps_api>
  <privacy>
    - Favorites/recents localStorage-only, never sent. Geolocation lat/lng cached in localStorage for performance, but can be cleared by user (localStorage clear / browser privacy settings).
    - No analytics event includes place data.
  </privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness, coordinate validity.</content_integrity>
  <note>No secrets (except domain-restricted public key), no network, no 3rd-party storage beyond Maps SDK (which is necessary for map display).</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-search friction. Unknown ids auto-pruned.</favorites_recents>
  <map_list_sync>Two-way sync: marker click ↔ card click, both update map pan/zoom and list scroll. Bidirectional binding ensures both views stay in sync at all times.</map_list_sync>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite — mouse-free power. Full keyboard support for all interactions (map requires focus on a marker or card, then keyboard nav applies).</keyboard_first>
  <structured_data>Restaurant / FoodEstablishment schema.org JSON-LD per place (name, address, lat/lng/geo, description, link) + ItemList JSON-LD (places grouped by list) — search engine recognizes place data (GEO/Maps indexing).</structured_data>
  <geolocation_integration>Native browser Geolocation API; permission-gated; distance calculation via Haversine; radius circle on map; graceful denial (no error).</geolocation_integration>
  <external_links>Links marked rel=noopener for security; trusted sources (Google Maps, Naver Place, restaurant websites, etc.) encoded in markdown.</external_links>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → catalog auto-compose</description>
    <steps>
      1. seongsu-cafes.md + seongsu-cafes_en.md exist in content/restaurant-map/ with region: seoul, ≥3 places with valid lat/lng.
      2. pnpm dev → predev generator runs → restaurant-map.generated.json has merged record (ko/en title, places with coords).
      3. Visit /ko/tools/restaurant-map → list renders "성수동 감성 카페" card (seoul region badge, "6 곳" count).
      4. Add new pair busan-ramen(.md/_en.md), rebuild → catalog auto-updates, map + list both include new places (no code edit).
      5. Missing pair, <3 places, or invalid coords → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Map render + marker click → list sync</description>
    <steps>
      1. Load /ko/tools/restaurant-map → map renders (NAVER Maps SDK loads, markers show for all places in Seoul).
      2. Click a map marker → corresponding list card highlights + scrolls into view (left/right column scroll, not page scroll).
      3. Zoom out → markers cluster (if N>threshold). Click cluster → expands to show individual markers.
      4. Click a place card → map pans/zooms to marker + opens info window (place name + "Open in Maps" link).
      5. Marker + card selection states are always in sync.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Search, region/category filter, geolocation</description>
    <steps>
      1. Type "카페" in search → narrows to cafe places; result count updates; map markers filter to cafes only; aria-live announces.
      2. Click "부산" (Busan) region tab → list + map filter to Busan places.
      3. Click "한식" (Korean) category filter → intersects with region; both surfaces filter (region ∩ category).
      4. Clear search, click "내 위치" button → request browser geolocation. On grant: map centers on user, blue dot shows, each card displays distance (km, e.g. "2.3km away"). On deny: show friendly message (no error popup).
      5. Sort by distance (if geolocation enabled): closest places appear first.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>SDK failure → graceful fallback</description>
    <steps>
      1. Delete NEXT_PUBLIC_NAVER_MAP_CLIENT_ID from .env → rebuild → SDK load skipped, MapFailover shown + list-only UI.
      2. Or: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID set but Web service URL not allowlisted in NCP console → SDK script loads but map init fails (auth error callback) → MapFailover + list-only.
      3. List + search + favorites + recents all fully functional without map.
      4. Geolocation button still available (but no map marker feedback).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Favorites, recent, persistence, keyboard, a11y</description>
    <steps>
      1. Select 2 different places → "최근" tab lists them MRU.
      2. Star a place card → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload → favorites/recents persist (localStorage); unknown ids pruned.
      4. "/" → search focus; arrow navigate cards; Enter select on map or open detail; axe pass → no violations.
      5. Map region has aria-label ("지도" / "Map"); markers have aria-label (place name). Place list has roving tabindex.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>i18n, SEO (JSON-LD), locale swap</description>
    <steps>
      1. Switch to /en → chrome (tabs/search/how-to) English; card title English; place descriptions English (from markdown EN file).
      2. Build prod → /ko/tools/restaurant-map and /en/tools/restaurant-map unique title/canonical/hreflang.
      3. HTML has SoftwareApplication + FAQPage + Restaurant schema.org JSON-LD (each place = Restaurant with name/address/lat/lng/description); ItemList JSON-LD (places grouped by list); place list dataset code-split chunk (not global i18n).
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>Mobile responsive, no overflow</description>
    <steps>
      1. At 320px: map + list stack vertically; both are scrollable independently. Page has no horizontal overflow.
      2. Tap/click region tab, category filter, search input — all accessible, ≥44px touch targets.
      3. On mobile, MapToggle tabs show (Map View | List View); tap to switch between full-width map and full-width list (UX choice: toggle or always-visible depends on viewport, see design review).
      4. Geolocation button is tappable, not cramped.
    </steps>
  </test_scenario_7>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<list>.md` + `<list>_en.md` pair in content folder, rebuild, auto-reflect in map + list with zero code change; generator validates pair/region/places/coords, fails build with clear message on violation.</content_model>
  <functionality>Searchable, region/category-filterable place list (both locales); interactive map (NAVER Maps SDK) with markers + clusters + sync; localStorage favorites + recent; seed 3–4 region lists × 2+ lists each (5+ places per list). Graceful fallback if SDK fails.</functionality>
  <trust_surface>Every place has name, coordinates, address, description, and category (filled form). Optional source note at list level + asOfDate (published) establish trust (not per-place, but list-level provenance).</trust_surface>
  <user_experience>Search/filter instant; cards readable; ≥44px targets; visible focus; map/list never overflow at 320px; SPA — no route reload on any interaction. Geolocation permission-gated, gracefully denied.</user_experience>
  <technical_quality>lib/restaurant-map/* pure ≥80% unit coverage (schema/merge/slug/search/geo/favorites); generator validation tests (pair-missing, invalid-coords, <3-places, dupe-slug → fail); TS 0 errors; <800 lines per file; catalog code-split, no i18n bundle bloat.</technical_quality>
  <visual_design>DESIGN.md compliant; tool accent (coral or rose TBD) + brand honey-gold CTA; category badges (colored per type); map markers clear and clickable; list cards have hover lift + selection ring; responsive layout (map/list sync visible on both desktop and mobile); text-node render only.</visual_design>
  <accessibility>Full keyboard (map marker + list roving, "/", Enter, "f", Esc); aria-live state; labeled buttons; geolocation permission prompt accessible; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; catalog dynamic import; map SDK lazy-load (doesn't block FCP); CLS <0.1 (map container height reserved); LCP < 2.5s (SSG pre-rendered shell + dynamic SDK).</performance>
  <maps_integration>NAVER Maps JS API v3 lazy-loads on route mount; NEXT_PUBLIC_NAVER_MAP_CLIENT_ID (URL-restricted in NCP console) required but optional (graceful fallback); markers render all places; click → sync with list; cluster at high zoom. Maps data is 1st-party (markdown-sourced), not real-time.</maps_integration>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-restaurant-map.mjs to freshen restaurant-map.generated.json. /[locale]/tools/restaurant-map pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" or "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'fun' category must be added to ToolCategory (if not present); accent TBD (coral or rose).
    {
      id: 'restaurant-map',
      slug: 'restaurant-map',
      category: 'fun',
      icon: 'MapPin', // or 'UtensilsCrossed'
      accent: 'coral', // or 'rose' (TBD per design review)
      status: 'coming_soon',
      isNew: true,
      order: 20,
      keywords: ['맛집','맛집리스트','지도','카페','여행','지역','추천','restaurant','map','food','places','guide','eat','cafe','dining','discover'],
    },
    ```
    Also: add slug→component branch (<RestaurantMap/>) and generateMetadata branch in tool route. Add `'fun'` to ToolCategory enum if not present.
  </platform_registry_change>
  <platform_env_setup>
    - `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`: String value (public client ID from the NAVER Cloud Platform Maps console, "Web Dynamic Map" service). Committed to `.env.production`. Web service URL allowlist configured in the NCP console (production domain + localhost).
    - If key is missing or invalid, SDK fails gracefully (list-only mode).
  </platform_env_setup>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod (including geo bounds) → mergePair → validate → restaurant-map.generated.json. Entire tool depends on this.
    2. Pair/canonical-merge rule (ko region/asOfDate/sourceUrl canonical, en inherit) + slug uniqueness + region enum validation + coordinate bounds check.
    3. Maps SDK loader: script injection on mount, graceful fallback (list-only) if load fails.
    4. Map-list sync: bidirectional (marker click ↔ card click, both update both surfaces).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/restaurant-map/{schema,slug,merge,search,geo,favorites}.ts Vitest (RED→GREEN).
    2. scripts/generate-restaurant-map.mjs + content/restaurant-map/{_TEMPLATE,_TEMPLATE_en,README} + seed (seongsu-cafes, busan-ramen, seoul-brunch, etc., 2–3 lists, 5+ places each). Validation tests (pair-missing, <3-places, invalid-coords, dupe-slug → fail). predev/prebuild wire.
    3. tools.restaurant-map.* messages (ko/en): region labels, category labels, tabs, search, toasts, empty states, how-to, FAQ, distance unit [km].
    4. useRestaurantMapCatalog hook (dynamic import + localStorage + in-memory fallback + geolocation state).
    5. MapContainer (NAVER Maps SDK loader + marker render + info window) + MapMarker component.
    6. PlaceSearch + RegionTabs + CategoryFilter + GeolocationButton + PlaceList/PlaceCard (roving tabindex, states) + empty states.
    7. Map-list sync logic: click marker → select card; click card → pan map (component state coordination).
    8. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live).
    9. RestaurantMapIntro/HowTo/Faq + SoftwareApplication + FAQPage + Restaurant schema.org + ItemList JSON-LD via platform lib/seo.ts.
    10. Registry status→coming_soon (or live if approved); slug→component + generateMetadata branches; E2E 1–7; visual regression 320/768/1024 both themes. Mobile MapToggle (tabs) if needed.
  </recommended_implementation_order>
  <seed_place_lists note="initial content — author fine-tunes but start with these">
    - Seoul: seongsu-cafes (성수동 감성 카페, 6+ places, 37.5350/127.0118 center), seoul-brunch (서울 브런치 명소, 5+ places)
    - Busan: busan-ramen (부산 로컬 라면, 5+ places, 35.0973/129.0331 center), busan-restaurants (부산 맛집, 4+ places)
  </seed_place_lists>
  <generator_sketch>
    ```javascript
    // scripts/generate-restaurant-map.mjs (outline)
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) restaurant-map/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod PlaceListFileFront.parse (collect errors; validate coords: lat ∈ [33,39] or global, lng ∈ [124,132] or global)
    // 3) mergePair(ko, en): canonical rule (ko region/asOfDate/sourceUrl), resolveSlug
    // 4) validate: pair-integrity / required-fields / region-valid / places ≥3 / all coords valid / ranks consecutive / slug-unique-per-region → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(restaurant-map.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/geo/favorites); generator validation fixtures (pair-missing/<3-places/invalid-coords/dupe cases); component catalog-injected mocks; map SDK mocked (mock global `naver.maps`); E2E scenarios 1–7; localStorage jsdom-isolated.</testing_strategy>
  <maps_sdk_notes>
    - NAVER Maps JS API v3 is loaded dynamically on route mount via script injection (not in global _document.tsx). Script src: `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}` (legacy param name `ncpClientId` for older NCP registrations).
    - SDK load is async; component uses state (mapSDKReady) to conditionally render MapContainer. Until SDK is loaded, show placeholder or spinner.
    - On SDK load error, graceful fallback: set mapSDKReady=false → show MapFailover (list-only mode, no error alert).
    - Clustering: NAVER Maps JS API v3 has NO built-in clusterer — vendor a small in-repo clustering utility based on NAVER's official MarkerClustering example (navermaps/marker-tools.js, grid-based), wired to cluster markers when zoomed out. Keep it dependency-free and unit-testable (pure grid-bucketing logic separated from the SDK).
    - info window: use naver.maps.InfoWindow to show place name + "Open in Maps" link (opens Naver Map place page or Google Maps link in new tab).
  </maps_sdk_notes>
</key_implementation_notes>

</project_specification>
```

729 lines, English, final.
