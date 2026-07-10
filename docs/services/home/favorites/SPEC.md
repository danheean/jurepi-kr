# Home Favorites — Personal Curation Feature SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Home Favorites** (홈 즐겨찾기) — a dashboard feature (not a standalone tool) that lets users star tools they love and filter the home grid to show only their favorites. The entire interaction is client-side: UI state is managed in React with localStorage persistence, URL params are optional, and the SSR'd tool grid remains unchanged (crawl-safe, SEO-intact).
> Internal feature codename: `home-favorites`. This feature is part of the platform home (`/[locale]/` route, no separate registry entry).
>
> This SPEC covers the feature itself. Platform shell and design system are inherited:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system: [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>Home Favorites — Personal Curation Feature (codename home-favorites, part of platform home)</project_name>

<overview>
Home Favorites empowers users to curate their own view of the tool hub. Every live tool card in the home grid displays a star button; clicking it toggles the tool as a favorite. A "Favorites" filter control (pill toggle or checkbox) in the filter row lets users show only their starred tools. Favorites state is persisted to localStorage (zod-validated, corrupt-safe) and optional URL params (`?favorites=true` or similar), with all changes reflected in the URL for shareability. The full tool grid is always SSR'd for SEO crawl anchors and fast LCP; favorites filtering applies after mount (hydration-safe, no React #418, no layout shift CLS violation).

CRITICAL (SSR-safe, no layout shift): The tool grid is server-rendered; the star buttons are the ONLY interactive addition. Star buttons are positioned sibling to (outside) the crawlable tool card anchor, so button-click does NOT trigger link navigation. Favorites state (boolean per tool) is applied post-mount; the SSR'd grid and button positions remain constant (CLS <0.1).

CRITICAL (client state only): Favorites are a purely client-side feature. No backend, no database, no API. Persistence is localStorage only. If URL params are added, they are derived from state and reflect changes but do NOT block SSR or add complexity to the route.

CRITICAL (SPA paradigm, no route change): Toggling favorites or showing/hiding the filter does NOT navigate, reload, or change the route slug. Only the URL searchParams change (history.replaceState), and the grid content updates in-place.
</overview>

<platform_integration>
  - Route: /[locale]/ (home dashboard; existing SSG route, no new route needed)
  - Provided by platform: ToolGrid (renders all tools as Link cards), SearchBar, CategoryFilter (category pills), design tokens, i18n runtime, layout shell.
  - Consumes: i18n namespace `home.favorites.*` (UI chrome: filter label, empty-state message, button labels, aria-labels)
  - Component integration: FavoriteButton (new, sibling to ToolCard within the grid cell), FavoritesFilterToggle (new, added to the existing filter row alongside CategoryFilter), HomeEmptyState (existing, extended to handle favorites-only + 0 matches state)
  - Platform dependency: No new route, no new category, no registry entry. Only changes: Add FavoriteButton component, add FavoritesFilterToggle to filter row, extend ToolExplorer to wire favorites state + filter.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Star button on every live tool card (not coming_soon cards): visible in the top-right corner of the card, aria-pressed + aria-label with tool name
    - Star button is a clickable sibling OUTSIDE the crawlable card anchor (valid HTML, no button-in-anchor)
    - Toggle favorite: click = add to favorites if absent, remove if present (immutable ops)
    - Favorites filter: "즐겨찾기" / "Favorites" pill toggle in the filter row; ON = show only favorites, OFF = show all (default)
    - Favorites filter combines with search + category filters (AND semantics): query AND category AND favorites (if ON)
    - Favorites state persists to localStorage: key `jurepi-home-favorites` { version, ids: string[] }, zod-validated, corrupt → fresh
    - Optional URL state: favorites filter state reflected in searchParams (?favorites=true or omitted = false), shareability
    - Empty state (favorites ON + 0 matches): contextual message ("카드의 별을 눌러 즐겨찾기를 추가하세요." / "Star a tool to add it to your favorites") + escape action (turn off filter)
    - Star button position: absolute within card container, top-right, 44px target (a11y), focus ring visible
    - Hydration safety: SSR grid unchanged; favorites state loaded post-mount; no browser-only values in useState initializers
    - Responsive (320/375/768/1024/1440): star button size adapts; filter pill text + icon readable
    - Accessibility: aria-pressed (on/off state), aria-label (tool name + "즐겨찾기 추가/해제" / "Add/remove from favorites"), keyboard reachable
    - No SEO impact: prerendered home HTML tool anchors must remain unchanged; crawl-safe
  </in_scope>
  <out_of_scope>
    - App shell, header, footer, consent banner, ads (all platform)
    - Per-tool custom data (notes, tags, ratings) — favorites are boolean only
    - Syncing favorites across devices or to a backend account (Phase 2)
    - Favorite sets/collections (Phase 2)
    - Analytics on favorite patterns (Phase 3)
    - Pinned/top-of-grid section for favorites (stay flat grid, no reorganization)
  </out_of_scope>
  <future_considerations>
    - Favorites sets (multiple saved views, e.g., "Work", "Creative", "Fun") (Phase 2)
    - Cloud sync to user account (Phase 2)
    - Export/import favorites list (Phase 2)
    - Analytics dashboard (favorite frequency by tool) (Phase 3)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <favorites_state>Client state only. Hook `useHomeFavorites` owns: favoriteIds (string[], tool slugs), toggleFavorite(slug), isFavorited(slug), pruneMissing(registry). Persists to localStorage key `jurepi-home-favorites` ({ version: number, ids: string[] }) with zod schema; corrupt data → silent fresh start.</favorites_state>
    <filter_integration>ToolExplorer.tsx extended with: favoritesOnly (boolean state), setFavoritesOnly. Filter composition: results = filterBySearch(query) ∩ filterByCategory(category) ∩ (favoritesOnly ? filterByFavorites(favorites) : all). Precedence: all 3 filters AND (not OR).</filter_integration>
    <url_state>Optional: FavoritesFilterToggle can dispatch URL param update. On change: setFavoritesOnly(bool) → window.history.replaceState(null, '', new URL with ?favorites=true or param removed). On mount (once): read URL ?favorites=true → setFavoritesOnly(true), mirror ToolExplorer's existing hydrate pattern (url → state, ONE time, useRef guard).</url_state>
    <button_positioning>Star button: position absolute, top-right within ToolCard container (relative), z-10 so it floats above card content. Size 44px (circle or slightly rounded square) with visible focus ring. Icon: lucide Heart or Star, var(--accent-rose) when favorited, var(--text-muted) when not; no text label (icon only, but aria-label present).</button_positioning>
    <hydration_safety>ToolExplorer SSR: renderFull grid with no favorites logic. On mount (client): load favorites from localStorage → apply filter. FavoriteButton: aria-pressed = true/false (pressed state), onClick toggles without rerender (state update in parent ToolExplorer). NO useState initializers reading favorites (that would cause hydration mismatch).</hydration_safety>
    <empty_state>HomeEmptyState component receives isEmptyBecauseFavorites (boolean). If true + query empty + category 'all': render "카드의 별을 눌러 즐겨찾기를 추가하세요." / "Star a tool to add it to your favorites" + button to turn off favorites filter. Otherwise use existing empty-state logic (no results for query/category).</empty_state>
    <accessibility>FavoriteButton: role button (or button element), aria-pressed boolean, aria-label "{tool-name} 즐겨찾기 {추가/해제}" (ko) / "{tool-name} — Add to/Remove from favorites" (en), tab-reachable, visible focus.</accessibility>
  </module_specific>
  <libraries>
    <zod>zod v3.x (already in repo) for favorites schema: { version: number, ids: string[] }.</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/home-favorites/
│   ├── schema.ts                       # zod: FavoritesStore { version, ids }
│   ├── favorites.ts                    # Pure domain: toggleFavorite(ids, slug), pruneMissing(ids, registry), isInFavorites(ids, slug)
│   └── favorites.test.ts               # Unit tests: toggle, prune, is-in
├── hooks/
│   ├── useHomeFavorites.ts             # Hook: load localStorage → state, toggle, prune on mount
│   └── useHomeFavorites.test.ts
├── components/home/
│   ├── FavoriteButton.tsx              # Star button: aria-pressed, onClick toggle, position absolute top-right
│   ├── FavoriteButton.test.tsx
│   ├── FavoritesFilterToggle.tsx       # Pill toggle: "즐겨찾기" / "Favorites", triggers setFavoritesOnly
│   ├── FavoritesFilterToggle.test.tsx
│   ├── ToolCard.tsx                    # Modified: import FavoriteButton, render as sibling to link
│   ├── ToolExplorer.tsx                # Modified: useHomeFavorites hook, favoritesOnly state, filter composition, URL hydration
│   ├── ToolGrid.tsx                    # Modified: pass favoriteIds + isEmptyBecauseFavorites to ToolCard + HomeEmptyState
│   ├── HomeEmptyState.tsx              # Modified: handle isEmptyBecauseFavorites case
│   └── CategoryFilter.tsx              # No change (alongside FavoritesFilterToggle in filter row)
└── i18n/messages/{ko,en}.json          # home.favorites.* namespace
</file_structure>

<core_data_entities>
  <favorites_store>
    - version: number (STORE_VERSION = 1) — for future schema migrations
    - ids: string[] (array of tool slugs, order preserved by push/filter order, max ~100 tools)
    - localStorage key: `jurepi-home-favorites`
    - Immutable operations: all updates return new array, never mutate in-place
  </favorites_store>
  <favorite_button_props>
    - slug: string (tool's id)
    - name: string (tool's display name, for aria-label)
    - isFavorited: boolean
    - onToggle: (slug: string) => void
    - testId?: string
  </favorite_button_props>
  <filter_state>
    - favoritesOnly: boolean (true = show only favorites, false = show all)
    - category: ToolCategory | 'all'
    - query: string
    - results: computed from applying all 3 filters AND
  </filter_state>
  <constants>
    - STORE_VERSION = 1
    - STORAGE_KEY = 'jurepi-home-favorites'
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/" page="Home dashboard (existing route, no new route needed)" />
  </public_routes>
  <url_params>
    <param name="q" type="string" optional="true" description="Search query (existing)" />
    <param name="cat" type="string" optional="true" description="Category filter (existing)" />
    <param name="favorites" type="string" optional="true" enum="true" description="NEW: Show only favorites when set; omitted = false" />
  </url_params>
</route_definitions>

<component_hierarchy>
  <home>                          <!-- Existing SSG route -->
    <hero />                      <!-- Unchanged -->
    <tool_explorer>               <!-- "use client" (existing); modified to add favoritesOnly state + useHomeFavorites hook -->
      <search_bar />              <!-- Unchanged -->
      <filter_row>
        <category_filter />       <!-- Unchanged -->
        <favorites_filter_toggle/><!-- NEW: Pill toggle alongside category -->
      </filter_row>
      <result_count />            <!-- Unchanged (extended to announce favorites state) -->
      <tool_grid>                 <!-- Modified to pass favoriteIds to ToolCard + HomeEmptyState -->
        <tool_card />             <!-- Modified: render FavoriteButton sibling -->
          <tool_card_link />      <!-- Unchanged -->
          <favorite_button />     <!-- NEW: sibling, position absolute -->
          <badges />              <!-- Unchanged -->
          <content />             <!-- Unchanged -->
        <home_empty_state />      <!-- Modified: handle favorites-only empty case -->
  </tool_explorer>
</component_hierarchy>

<pages_and_interfaces>

### FavoriteButton
- Appearance: Circle or slightly rounded square, 44px, positioned `absolute top-4 right-4` within ToolCard container (relative)
- Icon: lucide Heart (preferred) or Star, 20px
- Unfavorited: icon var(--text-muted), bg-transparent, border transparent
- Favorited: icon var(--accent-rose), bg-rose-soft, border rose (to make it pop)
- Hover/Focus: shadow subtle, focus ring 2px var(--focus-ring), accessible target
- State: aria-pressed="true"/"false", aria-label="{tool-name} — 즐겨찾기 추가" / "Add {tool-name} to favorites" or "즐겨찾기 해제" / "Remove from favorites" (dynamic)
- Click: onClick → onToggle(slug) → parent ToolExplorer updates state + localStorage + URL

### FavoritesFilterToggle
- Appearance: Pill button with Heart icon, same style as CategoryFilter pills (border, 12px/16px padding, hover bg-surface-muted, active bg-surface-sunken)
- Label: "즐겨찾기" / "Favorites" — 14px var(--text), icon 16px var(--accent-rose) when active
- State: aria-pressed boolean, aria-label "즐겨찾기 필터" / "Filter by favorites"
- Behavior: Click toggles favoritesOnly boolean → ToolExplorer re-filters results → URL updates (if URL params enabled)
- Position: In filter row, after CategoryFilter (flex row, wraps on mobile)

### ToolCard (modified)
- Wrapper: `<div className="relative">` around existing card (to position FavoriteButton absolutely)
- Link: unchanged (full crawlable card inside wrapper)
- FavoriteButton: sibling to link, positioned absolute, z-10, floats over card

### HomeEmptyState (modified)
- If `isEmptyBecauseFavorites = true` (favoritesOnly ON + 0 favorites):
  - Heading: "아직 즐겨찾기가 없어요" / "No favorites yet"
  - Description: "카드의 별을 눌러 즐겨찾기를 추가하세요." / "Star a tool to add it to your favorites"
  - Action button: "모두 보기" / "Show all tools" → setFavoritesOnly(false)
- Else:
  - Existing logic (no results for query/category)

### FavoritesFilterToggle in Filter Row
- Layout: flex row, responsive columns on mobile (wrap)
- Items: CategoryFilter (existing) + FavoritesFilterToggle (new)
- Spacing: gap-2, consistent with existing pills

</pages_and_interfaces>

<core_functionality>

### Toggle Favorite (immutable domain op)
```
toggleFavorite(ids: string[], slug: string): string[]
  if (ids.includes(slug))
    return ids.filter(id => id !== slug)
  else
    return [...ids, slug]
```

### Prune Missing (after registry changes)
```
pruneMissing(ids: string[], registry: ToolMeta[]): string[]
  validSlugs = Set(registry.map(t => t.slug))
  return ids.filter(id => validSlugs.has(id))
```

### useHomeFavorites Hook
```
On mount (once, useRef guard):
  1. Load from localStorage key `jurepi-home-favorites`
  2. zod parse → if invalid, start fresh { version: 1, ids: [] }
  3. pruneMissing(ids, registry) → remove deleted tools
  4. setState(ids)
  5. Optionally read URL ?favorites=true → setFavoritesOnly

On toggle favorite (slug):
  1. newIds = toggleFavorite(favoriteIds, slug)
  2. setState(newIds)
  3. localStorage.setItem(`jurepi-home-favorites`, JSON.stringify({ version: 1, ids: newIds }))
  4. URL update (optional): window.history.replaceState(...)
```

### Filter Composition
```
results = allTools
  .filter(t => t.status === 'live')  // Only live tools (coming_soon hidden in favorites filter)
  .filter(t => matchesSearch(t, query))
  .filter(t => matchesCategory(t, category) || category === 'all')
  .filter(t => !favoritesOnly || favorites.includes(t.slug))
```

### Empty State Logic
```
if (results.length === 0) {
  if (favoritesOnly && query === '' && category === 'all') {
    // Only favorites filter is on, no query/category, 0 favorites
    isEmptyBecauseFavorites = true
  } else {
    // No match for query/category
    isEmptyBecauseFavorites = false
  }
}
```

</core_functionality>

<error_handling>
  - Corrupt localStorage: zod parse error → ignore entry, start fresh { version: 1, ids: [] } (silent fail-safe, no throw)
  - Missing tools (after registry update): pruneUnknown on mount (remove deleted tool slugs)
  - Favorites state is never null/undefined (always array); defaults to [] (empty favorites)
  - All error states are caught client-side; no error toast (favorites is non-critical, UX continues)
</error_handling>

<aesthetic_guidelines>
  - Star/Heart icon: lucide icon 20px, var(--accent-rose) when favorited, var(--text-muted) when not
  - Button: 44px circle/slightly rounded, consistent with other icon buttons (focus ring 2px, visible)
  - Hover: subtle shadow (--shadow-sm), slight bg tint (--surface-sunken) on favorited state
  - Filter pill: existing CategoryFilter style applied to FavoritesFilterToggle (border, rounded-full, 12px/16px padding)
  - Empty state: existing illustration (if any) + new CTA button with var(--brand) background
  - Motion: star toggle is instant (no animation; favorite state updates immediately)
  - Accessibility: aria-pressed, aria-label with tool name, 44px target ≥ WCAG AAA
</aesthetic_guidelines>

<security_considerations>
  - No user-generated content (only tool slugs stored in favorites)
  - localStorage is user-controlled (client device only); zod validation prevents corrupt data
  - No external API calls (favorites are local-only, Phase 1)
  - URL params are read-only on client mount (no XSS vector)
  - CSRF/XSS: not applicable (100% client SPA, no form submission)
</security_considerations>

<advanced_functionality>
  - Out of scope for Phase 1; see future_considerations
</advanced_functionality>

<final_integration_test>
Scenario 1 (Happy path):
- Star a tool card → button visual changes (rose icon + bg) → reload → star persists
- Click "Favorites" filter → grid shows only favorited tools (rest hidden, SEO anchors remain in HTML but off-screen via CSS)
- Click filter off → all tools show again
- Star count reflects in favorites-only grid

Scenario 2 (Empty favorites):
- Turn on "Favorites" filter, 0 favorites → empty state shows "카드의 별을 눌러…" + "Show all tools" button
- Click button → filter off, grid populates

Scenario 3 (Search + Favorites):
- Star 3 tools, search for "로또" → only favorited lottos shown; unfavorited lottos hidden even if they match search
- Clear search → 3 favorites show (only those 3, others hidden by favorites filter)

Scenario 4 (Category + Favorites):
- Star tools from different categories (random, text, converter)
- Set category filter to "text" + favorites ON → only favorited text tools show
- Precedence: category AND favorites (not OR)

Scenario 5 (URL shareability):
- Star 2 tools, click "Favorites" filter → URL becomes `?favorites=true`
- Copy URL, open in new tab → page loads with favorites ON, 2 tools showing (correct)
- Modify query to `?q=lotto&favorites=true` → search + favorites both active (AND logic)

Scenario 6 (SSR + Crawl safety):
- View page source (pre-render HTML) → tool card anchors are all present (unchanged from no-favorites state)
- Verify: `<a href="/ko/tools/…">` links are in HTML (not hidden, searchable)
- Favorite toggle (JS) does NOT render/remove anchors (stars are UX-only, grid is always crawlable)

Scenario 7 (Hydration safety):
- Render page → SSR grid, no favorites loaded yet
- Page hydrates → favorites load from localStorage
- No visual shift (CLS <0.1), no React warnings (hydration match)

Scenario 8 (Favorites + coming_soon):
- coming_soon tools do NOT get star buttons (no star toggle, not in favorites logic)
- If a tool's status changes to coming_soon after being favorited → prune removes it from favorites on next mount

</final_integration_test>

<success_criteria>
- Star button visible on every live tool, hidden on coming_soon
- Star toggle persists across reload
- Favorites filter combines with search and category (AND logic)
- Empty state shows correct message for each case
- URL params reflect filter state (optional but recommended)
- SSR'd tool anchors unchanged (all present in prerendered HTML)
- No layout shift on favorite toggle or filter change (CLS <0.1)
- No hydration mismatch (React 19 strict mode clean)
- Accessibility: aria-pressed + aria-label on star, 44px target, keyboard reachable
- All UI text localized (ko/en)
- Corrupt localStorage handled silently (fresh start)
- Pruning of deleted tools on mount
- Filter precedence: query AND category AND favorites (not OR)
</success_criteria>

<build_output>
- src/lib/home-favorites/ (pure domain: schema.ts, favorites.ts + tests)
- src/hooks/useHomeFavorites.ts + test
- src/components/home/FavoriteButton.tsx + test
- src/components/home/FavoritesFilterToggle.tsx + test
- Modified: src/components/home/{ToolCard,ToolExplorer,ToolGrid,HomeEmptyState}.tsx
- src/i18n/messages/ko.json + en.json: home.favorites.* namespace
- Unit tests: src/lib/home-favorites/*.test.ts, src/hooks/useHomeFavorites.test.ts, src/components/home/FavoriteButton.test.tsx, FavoritesFilterToggle.test.tsx
- E2E tests: tests/e2e/home-favorites.spec.ts (8 scenarios: toggle, empty, search+favorites, category+favorites, URL, SSR, hydration, coming_soon)
</build_output>

<key_implementation_notes>
1. FavoriteButton is positioned `absolute top-4 right-4` within a `relative` ToolCard container; link remains crawlable (button is outside, doesn't block click).
2. useHomeFavorites hook: load once on mount (useRef guard), prune missing, apply filter. NO useState initializer reads localStorage (hydration-safe).
3. Filter composition: (search AND category AND favorites) — all 3 must match.
4. URL params (`?favorites=true`) are optional; if omitted, default favorites filter = false. Recommended for shareable links.
5. SSR grid is unchanged; favorites filtering is client-only post-mount. All tool anchors remain in prerendered HTML (crawlable).
6. CLS: star button size + position are constant (44px absolute, no reflow). No layout shift on toggle or filter.
7. Coming_soon tools do NOT get star buttons (filter & logic skips them). If a favorited tool becomes coming_soon, prune removes it on mount.
8. Empty state cases: (favoritesOnly=true + 0 favorites) → special message + escape button; otherwise, existing "no results" message.
9. TDD order: domain (toggleFavorite, prune tests FIRST), hook (localStorage + prune), then component interaction (button click + filter).
10. Responsive: star button 44px on all breakpoints; filter pill text + icon wrap on mobile (flex row, gap-2).
</key_implementation_notes>

</project_specification>
```
