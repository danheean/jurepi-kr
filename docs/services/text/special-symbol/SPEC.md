# Special Symbols — Click-to-Copy Special Character Picker — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Special Symbols** (특수문자 / 특수기호 모음) — a grid of small tiles, each holding a hard-to-type special character; one click copies it to the clipboard, and a side panel explains what the symbol is and shows real-world usage examples.
> Internal service codename: `special-symbol`. Registry id: `special-symbol`. Public URL slug: `/[locale]/tools/special-symbol`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md) (Korean: [`SPEC_KR.md`](../../../SPEC_KR.md))
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>Special Symbols — Click-to-Copy Special Character Picker (Jurepi tool, codename special-symbol, registry id special-symbol)</project_name>

<overview>
Special Symbols solves a small but constant annoyance: people regularly need characters that are not on the keyboard — the middle dot (·), the em dash (—), the inverted question mark (¿), arrows (→), currency marks (€ £ ¥), units (℃ ㎡), and so on — and today they hunt for them every single time (search engines, copying from a random web page, fighting an OS character viewer). This tool puts a curated, searchable grid of those characters in one place. Each character sits in its own small square tile; clicking a tile **copies it instantly** to the clipboard and shows a toast, and at the same time a **detail panel** (to the right on desktop, a bottom sheet on mobile) explains what the symbol is and shows concrete examples of when it is used. Repeat use is frictionless via a "recently copied" row and pinnable favorites.

The tool mounts inside the Jurepi platform shell at `/[locale]/tools/special-symbol`. It uses the platform header/footer, locale (ko/en), theme, consent-gated ad slots, and the DESIGN.md token system. This SPEC specifies only the tool: its symbol catalog/data model, the grid + detail-panel interface, the click-to-copy and search interactions, recents/favorites persistence, tool-specific SEO content, and tests.

CRITICAL (core interaction): a single click/tap on a symbol tile does TWO things at once — (1) it copies that character to the clipboard immediately (the primary requirement) and (2) it selects the symbol so the detail panel shows its name + usage + examples. Browsing without copying is supported via hover (mouse) and keyboard focus/arrow navigation, which PREVIEW the detail panel without writing to the clipboard. Copy must never silently fail: if the Clipboard API is unavailable, fall back to a legacy copy, and if that also fails, present the character pre-selected for manual copy.

CRITICAL (client-only): 100% client-side. There is NO backend and NO database. The symbol catalog is a static, code-split data module bundled at build time. The only first-party persistence is `localStorage` (recently-copied list + favorites + last-used category); there is no network call that ever sends anything anywhere.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — category switching, searching, selecting, copying, pinning — happens via local React state with NO route navigation and NO full page reload. Usability comes first: the grid is reachable in one glance, search is one keystroke away ("/"), and copying is one click. The route is statically generated (SSG) for SEO/indexing, and the interactive tool is a single client-component island on that static shell.

CRITICAL (content integrity): every symbol entry is keyed by its Unicode codepoint sequence and must carry a non-empty localized name, a usage note, and at least one example in BOTH ko and en. The displayed codepoint (e.g., "U+00B7") and HTML entity (e.g., "&amp;middot;" / "&amp;#183;") must be DERIVED from the actual character — a unit test asserts the derivation matches and that there are no duplicate symbols. Characters are stored NFC-normalized.
</overview>

<platform_integration>
  - Route: /[locale]/tools/special-symbol (SSG; registry slug "special-symbol", id "special-symbol", status "live", accent "mint", category "text").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, the SEO metadata builder in lib/seo.ts.
  - Consumes: i18n namespace `tools.special-symbol.*` (UI chrome strings, category labels, how-to, FAQ — NOT the symbol names/usages/examples); the in_content AdSlot below the tool.
  - Platform dependency (SMALL — NO new category needed): the `'text'` category already exists in `ToolCategory` with the `mint` accent and the "텍스트"/"Text" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch. Contrast with qna-a-day, which had to introduce a new category.
  - The page shell (breadcrumb + in_content ad) is rendered by the platform tool route; this module renders everything between the breadcrumb and the ad.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - A curated symbol catalog (~180–260 entries) organized into categories (punctuation, quotes/brackets, currency, math/science, arrows, units, stars/marks, black circled numbers, legal/misc, optional Greek). Korean-first selection: the symbols Korean writers actually reach for (가운뎃점 ·, 엠/엔 대시 — –, 당구장 표시 ※, 《》「」, ℃, ㎡, → ★ ©, 검은 원 숫자 ❶❷❸, 이메일 골뱅이 @), plus the common Latin/Spanish marks (¿ ¡, em dash, curly quotes).
    - Click/tap a tile → copy the character immediately + success toast + select it.
    - Detail panel showing: large glyph, localized name, codepoint(s) (U+XXXX), HTML entity (named if it exists, else decimal), a 1–2 sentence usage note, and 2–3 localized usage examples. "Copy as" chips let the user copy the raw character, the HTML entity, or the U+ codepoint.
    - Search box: filter the grid live by localized name, keywords, the character itself, and codepoint (e.g. "00b7", "u+00b7"). Case- and diacritic-insensitive.
    - Category tabs/pills (incl. "전체" / "All" and "최근" / "Recent" and "즐겨찾기" / "Favorites").
    - "Recently copied" row (localStorage, MRU, capped) and pinnable favorites (localStorage) — directly addressing the "I have to find it every time" pain.
    - Full keyboard support: "/" focus search, arrow-key roving grid navigation (previews detail), Enter/Space copies, Esc clears/closes.
    - Tool-specific SEO long-form ("What is a special character?" / "How to use") + FAQ (FAQPage JSON-LD), localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA a11y (labeled tiles, aria-live copy status, focus management).
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Emoji picker (😀🎉…). Emoji are easily reached via OS pickers and warrant their own dedicated tool; this tool is for typographic/technical symbols that are HARD to type. Emoji are explicitly excluded to keep the catalog focused.
    - Symbols directly typable on the KOREAN 2-beolsik keyboard: the ASCII set (! ? . , : ; ' " - + = * / \ ( ) [ ] { } &lt; &gt; $ # % &amp; ^ _ | ~ and backtick). The tool exists for characters NOT on the keyboard, so these are excluded by design. Symbols reached only via the IME 한자 palette (※, ○, △, 「」 …) are NOT considered keyboard-present and remain in scope. Exceptions retained by explicit user request: @ and ₩ (won).
    - A full Unicode browser / every codepoint, block explorer, or font/glyph rendering tool.
    - Accounts, server persistence, cross-device sync (no backend).
    - User-defined custom symbols / editable catalog at launch.
    - Export/import of recents/favorites (these are conveniences, not precious data — no durability machinery like qna-a-day's journal).
  </out_of_scope>
  <future_considerations>
    - Korean 초성(initial-consonant) search ("ㄱㅇㄷㅈ" → "가운뎃점") — Phase 2 search enhancement.
    - User-defined custom symbol pins / a "my set" group — Phase 2.
    - Emoji as a SEPARATE sibling tool (registry id `emoji`) — Phase 2.
    - Per-symbol "insert N times" or build-a-string scratchpad — Phase 3.
    - Variant selector / combining-mark helpers (e.g., accents over letters) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <persistence>localStorage only, single versioned key `jurepi-special-symbol` holding `{ version, recents: string[], favorites: string[], meta }` (recents/favorites are arrays of symbol ids). Read once on mount; debounced write on change. The tool is FULLY functional even if localStorage is unavailable (recents/favorites simply don't persist).</persistence>
    <validation>zod v3.x to validate the stored blob on read (reject malformed → start fresh, never throw to the user). Symbol ids in the stored arrays are filtered against the live catalog on load (drop unknown ids).</validation>
    <catalog>The symbol catalog is a CODE-SPLIT data module (src/components/tools/special-symbol/data/symbols.json), dynamically imported only on this tool page so its ko+en content never enters the global i18n message bundle (protects the platform JS budget — same pattern as qna-a-day's question bank). Each record carries the character + ko/en name, usage, examples, keywords; codepoint and HTML entity are derived in the pure layer.</catalog>
    <clipboard>navigator.clipboard.writeText in a secure context, with a legacy hidden-textarea + document.execCommand('copy') fallback, with a final manual-copy modal fallback. (The platform has a recorded clipboard lesson — handle all three tiers.)</clipboard>
    <animation>Native CSS transitions only (tile hover-lift, copy flash/check pulse, panel cross-fade, bottom-sheet slide). No animation library.</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/
├── lib/special-symbol/                  # PURE domain layer — no React/Next imports, fully unit-tested
│   ├── codepoint.ts                      # toCodepoints(char) → ["U+00B7"]; toHtmlEntity(char) (named→decimal); idForChar(char) → "u00b7"; NFC normalize
│   ├── catalog.ts                        # typed catalog access: allSymbols, byId, byCategory, categories[]; coverage/derivation asserts
│   ├── search.ts                         # filterSymbols(symbols, query, locale): name + keywords + char + codepoint match; case/diacritic-insensitive
│   ├── recents.ts                        # immutable ops: pushRecent(list, id, max), clearRecents; toggleFavorite(list, id); pruneUnknown(ids, catalog)
│   └── schema.ts                         # zod Store schema + STORE_VERSION + safeParseStore()
├── components/tools/special-symbol/
│   ├── SpecialSymbol.tsx                  # orchestrator (Client Component) — owns category/search/selection state + useSymbolPicker()
│   ├── useSymbolPicker.ts                 # hook: localStorage recents/favorites + clipboard adapter + derived selection/filtered list
│   ├── CategoryTabs.tsx                   # All / Recent / Favorites / <category…> pills (tablist)
│   ├── SymbolSearch.tsx                   # search input ("/" focus, clear, result count, aria)
│   ├── SymbolGrid.tsx                     # responsive tile grid; roving-tabindex keyboard nav
│   ├── SymbolTile.tsx                     # one square tile: glyph + aria-label + copied flash; click = copy + select
│   ├── DetailPanel.tsx                    # selected symbol: big glyph, name, codepoint/entity copy-chips, usage, examples, big Copy button
│   ├── RecentRow.tsx                      # compact recently-copied strip (shown above grid when non-empty)
│   ├── CopyFallbackModal.tsx              # manual-copy modal when programmatic copy fails (pre-selected text)
│   ├── SymbolIntro.tsx                    # H1 + lead (SEO; server-rendered where possible)
│   ├── SymbolHowTo.tsx                    # "특수문자란?" / "어떻게 복사하나요?" (SEO long-form)
│   ├── SymbolFaq.tsx                      # Q&A + FAQPage JSON-LD
│   └── data/
│       └── symbols.json                  # catalog: [{ id, char, category, keywords, name{ko,en}, usage{ko,en}, examples{ko,en} }]
└── i18n/messages/{ko,en}.json             # tools.special-symbol.* UI chrome (tabs, search, toasts, how-to, FAQ) — NOT symbol content
</file_structure>

<core_data_entities>
  <symbol note="catalog record; text/keywords come from symbols.json, codepoint/entity DERIVED">
    - id: string — stable key = lowercased codepoint sequence joined by "-" (e.g., "u00b7", "u2014"); used by recents/favorites
    - char: string — the literal character(s), NFC-normalized (usually 1 codepoint; allow short sequences for compounds)
    - category: enum (punctuation, quotes, currency, math, arrows, units, stars, circled, legal, greek)
    - codepoints: string[] — DERIVED from char, e.g. ["U+00B7"] (a test asserts id === codepoints joined+lowercased without "u+")
    - htmlEntity: string — DERIVED: named entity when one exists (e.g. "&amp;middot;"), else decimal numeric (e.g. "&amp;#183;")
    - name: { ko: string; en: string } — e.g. { ko: "가운뎃점", en: "Middle Dot (Interpunct)" } (non-empty both)
    - keywords: string[] — search aliases across ko+en (e.g. ["가운데점","중점","interpunct","middot"])
    - usage: { ko: string; en: string } — 1–2 sentences: when/why to use it (non-empty both)
    - examples: { ko: string[]; en: string[] } — 2–3 short example strings each showing the symbol in context (≥1 each)
    INVARIANT — DERIVATION &amp; UNIQUENESS: a unit test asserts every entry's id and codepoints derive correctly from char, ids are unique, char is NFC, and name/usage/examples are non-empty in BOTH locales (≥1 example per locale).
  </symbol>
  <category note="presentation grouping; localized label from i18n">
    - id: enum value above; labelKey resolves to tools.special-symbol.categories.&lt;id&gt; (ko/en)
    - Display order: punctuation → quotes → currency → math → arrows → units → stars → circled → legal → greek
    - Virtual tabs (NOT real categories): "all" (everything), "recent" (from localStorage MRU), "favorites" (pinned). Shown first in the tab row when applicable.
  </category>
  <picker_store note="the single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - recents: string[] — symbol ids, most-recent-first, capped at RECENTS_MAX = 16, de-duplicated
    - favorites: string[] — symbol ids, insertion order, no hard cap (practical)
    - meta: { lastCategory?: string; createdAt: number }
    localStorage key: `jurepi-special-symbol`
    INVARIANT — VALIDATED &amp; PRUNED: read is zod-parsed; on failure start fresh (no throw). Any id not present in the current catalog is pruned on load so a catalog change never leaves dangling ids.
  </picker_store>
  <constants>
    - RECENTS_MAX = 16; SEARCH_DEBOUNCE = 120ms; COPY_FLASH_MS = 600ms; TOAST_MS = 1800ms.
  </constants>
  <defaults>
    - New user: empty recents/favorites; active tab "all"; no symbol selected (detail panel shows the empty hint, see below).
  </defaults>
</core_data_entities>

<component_hierarchy>
  <special_symbol>             <!-- "use client"; owns category + query + selectedId state + useSymbolPicker() -->
    <symbol_intro />          <!-- H1 + lead (server-rendered where possible) -->
    <picker_layout>           <!-- two-pane on desktop, stacked + bottom-sheet on mobile -->
      <picker_main>           <!-- left/top column -->
        <symbol_search />     <!-- "/" focus, clear, result count -->
        <category_tabs />     <!-- All / Recent / Favorites / categories… -->
        <recent_row />        <!-- shown above the grid when recents exist & not already on Recent tab -->
        <symbol_grid>         <!-- roving-tabindex tiles -->
          <symbol_tile />     <!-- × N: click = copy + select; hover/focus = preview -->
          <empty_state />     <!-- no search results / empty Favorites / empty Recent -->
        </symbol_grid>
      </picker_main>
      <detail_panel />        <!-- desktop: sticky right column; mobile: bottom sheet -->
    </picker_layout>
    <symbol_how_to />         <!-- SEO long-form -->
    <symbol_faq />            <!-- FAQPage JSON-LD -->
    <copy_fallback_modal />   <!-- only mounts when programmatic copy fails -->
  </special_symbol>
  <note>SPA within the tool: tabs/search/selection switch via local state, NOT route navigation. The detail panel is the same component whether docked (desktop) or in a bottom sheet (mobile).</note>
</component_hierarchy>

<pages_and_interfaces>
  <symbol_intro>
    - Eyebrow: "텍스트 도구" / "TEXT TOOL" — eyebrow 12px/700/0.6px, var(--brand).
    - H1: "특수문자" / "Special Symbols" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "키보드에 없는 특수기호를 클릭 한 번으로 복사하세요. 오른쪽에서 언제 쓰는지 예시도 볼 수 있어요." / English equivalent.
  </symbol_intro>

  <symbol_search>
    - text-input style (DESIGN text-input), full width of the main column, leading search icon (lucide Search, 20px var(--text-muted)), placeholder "기호 이름·키워드·문자로 검색 (예: 가운데점, →, ₩)".
    - Focus on "/" keypress (when not already typing in a field). Trailing clear (×) button when non-empty.
    - Live filter, debounced 120ms. Below the input (or inline), a quiet result count "결과 N개" in caption var(--text-muted).
    - aria: role="searchbox", aria-controls the grid; result count in an aria-live="polite" region.
  </symbol_search>

  <category_tabs>
    - Horizontal pill row (category-pill / category-pill-active). Order: "전체"(all), then "최근"(recent, only if recents exist), "즐겨찾기"(favorites, only if any), then the 9 categories.
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary; hover lifts bg.
    - role="tablist"; ArrowLeft/Right move between pills; aria-selected on active. Row scrolls horizontally with snap on narrow screens.
    - Selecting a category clears the search? NO — search and category compose (category narrows the set, search filters within it). "전체" + empty search = whole catalog.
  </category_tabs>

  <recent_row>
    - Shown directly above the grid ONLY when recents exist and the active tab is not already "recent". A single horizontal strip of small tiles (same SymbolTile, compact), labeled "최근 복사" / "Recently copied" in eyebrow.
    - Overflow scrolls horizontally; a small "전체 보기" link switches to the Recent tab.
  </recent_row>

  <symbol_grid>
    - CSS grid, `grid-template-columns: repeat(auto-fill, minmax(56px, 1fr))`, gap var(--space-xs) 8px. Fills the main column width.
    - Each tile: 56px square (≥44px touch), radius var(--radius-md) 12px, var(--surface) with 1px var(--hairline), glyph centered at 26px var(--text) (Pretendard — but the glyph renders in the system/symbol font naturally).
    - States:
      - hover (mouse): var(--accent-mint-soft) bg + translateY(-2px) + var(--shadow-card); previews the symbol in the detail panel (no copy).
      - focus-visible (keyboard): 2px var(--focus-ring) ring offset 2px; previews in the detail panel.
      - selected: 2px var(--accent-mint) ring + var(--accent-mint-soft) bg (persists after copy).
      - copied flash: on click, a brief mint pulse + a ✓ check overlay for 600ms (reduced-motion: show the ✓ without scale animation).
    - Roving tabindex: only the active tile is tabbable; ArrowUp/Down/Left/Right move focus across the visual grid (compute columns from layout); Home/End jump to first/last; Enter/Space copy the focused tile.
    - aria: grid is role="grid" (or a labeled list); each tile is a button with aria-label = "{name}, {char}, {U+codepoint}" so screen readers announce it without relying on the glyph.
    - empty_state: no search results → friendly "‘{query}’에 해당하는 기호가 없어요" + clear-search button; empty Favorites → "별 아이콘을 눌러 자주 쓰는 기호를 저장하세요"; empty Recent → "최근 복사한 기호가 여기에 모여요".
  </symbol_grid>

  <symbol_tile_interaction>
    - CLICK / TAP: copy char to clipboard → on success: toast "복사됨: {char}" (semantic-success leading dot), copied flash, push to recents, set as selected (detail panel updates). On failure: open CopyFallbackModal.
    - HOVER (pointer) / FOCUS (keyboard): set as selected/preview WITHOUT copying — detail panel updates so users can read usage before deciding. (On touch there is no hover; tap copies + selects.)
    - A small star button in the top-right corner of the tile (appears on hover/focus, always visible on touch) toggles favorite; does NOT copy. aria-pressed reflects state.
  </symbol_tile_interaction>

  <detail_panel>
    - Desktop (≥1024px): sticky right column, width 340px, var(--surface), radius var(--radius-xxl) 28px, padding 24px, shadow --shadow-card. Sticks below the breadcrumb as the grid scrolls.
    - Tablet (768–1023px): same panel docked at the right of a narrower grid, width ~300px (grid reflows to fewer columns).
    - Mobile (&lt;768px): a bottom sheet that slides up after a tile is selected; shows the same content; a grab handle + close; backdrop dim rgba(30,27,58,0.4). Because tap already copied, the sheet is "what you just copied + how to use it".
    - Content (top → bottom):
      1. Big glyph: the char at 64px, centered on a var(--accent-mint-soft) tile (radius var(--radius-lg)).
      2. Name: headline 24px var(--text) (localized).
      3. Meta "copy as" chips (row): "기호 {char}" · "HTML {entity}" · "유니코드 {U+XXXX}" — each a small pill (player-chip style, mint-soft); clicking a chip copies THAT representation (toast "HTML 엔티티 복사됨" etc.). Keyboard accessible.
      4. Usage: body 16px var(--text-secondary), the localized 1–2 sentence note.
      5. Examples: a small stacked list (2–3), each in a var(--surface-muted) chip (radius var(--radius-md)); the symbol within each example is emphasized (var(--accent-mint) / 700). Label "예시" / "Examples" in eyebrow.
      6. Primary "복사" button (button-primary, brand honey-gold, full width) — copies the char (redundant with tile click, but the obvious affordance once a symbol is selected).
    - Empty/initial state (nothing selected): a friendly hint card — "기호를 선택하면 사용법과 예시가 여기에 표시됩니다." plus, if recents exist, a nudge to re-copy a recent one.
  </detail_panel>

  <copy_fallback_modal>
    - Mounts only when both navigator.clipboard and execCommand fail. Modal (DESIGN modal) with the character shown large and in a pre-selected read-only input + instruction "Ctrl/Cmd+C 로 복사하세요". Close button. Never blocks the rest of the UI.
  </copy_fallback_modal>

  <symbol_how_to>
    - SEO long-form (per locale): "특수문자란?", "어떻게 복사하나요?", "자주 쓰는 특수문자" — 600–900 chars; explains click-to-copy, search, favorites; mentions everything is free and stays in the browser.
  </symbol_how_to>
  <symbol_faq>
    - 5–7 Q&A; rendered + emitted as FAQPage JSON-LD. MUST include: "어떻게 복사하나요?" (기호를 클릭하면 바로 복사됩니다); "복사가 안 돼요" (보안 컨텍스트/권한 안내 + 수동 복사 폴백); "이모지도 있나요?" (이모지는 별도 — 이 도구는 키보드에 없는 특수기호 모음); "엠 대시(—)와 엔 대시(–) 차이는?" (간단 설명); "가운뎃점(·)은 어떻게 입력하나요?" (검색 후 클릭); "내 즐겨찾기는 어디 저장되나요?" (이 브라우저 localStorage, 업로드되지 않음).
  </symbol_faq>

  <keyboard_shortcuts_reference>
    - "/" → focus the search input (when not typing in a field).
    - Arrow keys → move focus across the grid (roving tabindex); Home/End → first/last tile.
    - Enter / Space → copy the focused tile.
    - "f" (while a tile is focused) → toggle favorite for that tile.
    - Esc → clear search if non-empty, else close the mobile detail sheet.
    - Disabled on touch (no physical keyboard); all actions remain reachable by tap.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <codepoint_engine note="pure, deterministic">
    - idForChar(char): NFC-normalize, map each codepoint to "u{hex}", join with "-" → stable id.
    - toCodepoints(char): array of "U+XXXX" (uppercase, ≥4 hex digits) for each codepoint.
    - toHtmlEntity(char): if a single codepoint has a well-known named entity (small built-in map: middot, mdash, ndash, hellip, copy, reg, trade, deg, times, divide, larr, rarr, harr, hearts, euro, pound, yen, cent, sect, para, …) return "&amp;name;"; else return decimal "&amp;#NNN;". Multi-codepoint → concatenated decimal entities.
  </codepoint_engine>
  <catalog_access>
    - allSymbols(): Symbol[] in (category order, then catalog order). byId(id), byCategory(cat). categories(): ordered category ids present in the catalog.
    - On import, the pure layer can assert (in tests) derivation + uniqueness + locale completeness over the whole dataset.
  </catalog_access>
  <search>
    - filterSymbols(symbols, query, locale): if query is blank, return input unchanged. Else normalize query (trim, NFC, lowercase, strip diacritics, also strip a leading "u+" / "u" for codepoint matches). A symbol matches if ANY of: localized name, any keyword, the raw char, or any codepoint hex contains the normalized query as a substring. Stable order preserved. Case- and diacritic-insensitive.
    - Composes with the active category: the grid shows filterSymbols(symbolsForActiveTab, query). (Recent/Favorites tabs filter their own ordered subset.)
  </search>
  <recents_and_favorites note="all immutable — return new arrays/store">
    - pushRecent(list, id, max=16): move/insert id to front, de-dupe, truncate to max.
    - toggleFavorite(list, id): add if absent, remove if present (preserve order).
    - pruneUnknown(ids, catalog): drop ids not in the current catalog (run on load).
  </recents_and_favorites>
  <clipboard_adapter useSymbolPicker>
    - copy(text): try navigator.clipboard.writeText in a secure context; on throw/absence, try the hidden-textarea + execCommand('copy') fallback; if that also fails, resolve to a "manual" outcome that opens CopyFallbackModal. Returns the outcome so the UI can toast or open the modal. Each copy that targets a CHARACTER (not an entity/codepoint chip) also pushes that symbol to recents.
  </clipboard_adapter>
  <persistence_adapter useSymbolPicker>
    - On mount: read `jurepi-special-symbol` → zod parse → pruneUnknown(recents/favorites) → state; on failure start fresh (no user-visible error). If localStorage is entirely unavailable, run in-memory for the session (tool still fully usable; nothing persists).
    - On change: debounced JSON.stringify → setItem; catch quota/security errors → keep in-memory state silently (recents/favorites are non-critical).
    - Exposes: filtered list for the active tab+query, selectedId + select(id, {copy?}), copy(text), toggleFavorite(id), recents, favorites, lastCategory.
  </persistence_adapter>
  <i18n>All UI chrome from tools.special-symbol.* (ko/en): tabs, category labels, search placeholder, result count, toasts ("복사됨", "HTML 엔티티 복사됨", "즐겨찾기 추가/해제"), empty states, how-to, FAQ. Symbol name/usage/examples come from the code-split symbols.json (ko/en fields), NOT i18n messages.</i18n>
</core_functionality>

<error_handling>
  <copy_failure>
    - CRITICAL: copy must degrade gracefully. Tier 1 navigator.clipboard → Tier 2 execCommand → Tier 3 CopyFallbackModal (character pre-selected for manual Ctrl/Cmd+C). The user always has a path to the character; copy never appears to silently succeed when it didn't (success toast only on a confirmed tier-1/2 success).
  </copy_failure>
  <search_no_results>Friendly empty state with the queried text echoed + a "검색 지우기" button; the detail panel keeps its last selection or the empty hint.</search_no_results>
  <storage>
    <unavailable>Private mode / disabled storage → recents/favorites run in-memory for the session; NO scary error (these are conveniences). The grid, search, copy, and detail panel all work normally.</unavailable>
    <corrupt_blob>On read, JSON/zod failure → ignore and start with an empty store (recents/favorites are not precious; no quarantine needed). Never throw to the UI.</corrupt_blob>
    <quota>setItem throws → keep in-memory state; optionally trim recents; no user-facing error.</quota>
  </storage>
  <error_boundary>Platform wraps the tool in an Error Boundary; a render failure shows a retry without crashing the shell.</error_boundary>
  <note>This module makes NO first-party network requests; there is no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is the single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is MINT (var(--accent-mint) #2dd4bf / var(--accent-mint-soft) #d7f7f2) — the "text" category identity per DESIGN.
    - Mint marks identity: the intro icon tile, tile hover/selected state, the detail panel's glyph tile, the "copy as" chips, the emphasized symbol inside examples, and the favorite star (filled).
    - CTAs (the detail "복사" button, primary actions) stay brand honey-gold var(--brand). Accent is identity, never the action color (DESIGN do/don't). The success toast uses var(--semantic-success) for its leading dot, not mint.
  </accent_usage>
  <surfaces>Grid tiles var(--surface) + 1px var(--hairline) at rest, radius var(--radius-md) 12px; detail panel radius var(--radius-xxl) 28px on var(--surface); example chips var(--surface-muted) radius var(--radius-md). Soft brand-tinted shadows (--shadow-card / --shadow-card-hover), never hard borders as elevation.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); detail name headline 24px; the GLYPH itself is the focal object (large, centered). Body/usage Pretendard 16px/1.55; meta chips/labels caption/eyebrow. Codepoints/entities shown in a monospace-ish treatment (use a mono fallback stack for the U+XXXX and &amp;#NNN; strings only) for legibility.</typography>
  <motion>transform / opacity only: tile hover translateY(-2px) 150ms, copy flash + ✓ pulse (scale 1→1.15→1, 600ms), detail cross-fade 150ms, mobile sheet slide-up (translateY) 250ms. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (no translate/scale; instant fades; ✓ appears without pulse).</motion>
  <accessibility>Each tile is a labeled button (aria-label includes name + char + codepoint, so the glyph is announced reliably); roving-tabindex grid with arrow keys; copy status in an aria-live="polite" region ("복사됨: 가운뎃점"); ≥44px effective tap targets (56px tiles); visible focus-visible ring var(--focus-ring); "copy as" chips and favorite star are real buttons with state. WCAG 2.1 AA contrast: symbol glyph uses var(--text) on light tiles (not mint-on-white for the glyph); mint is for tile background/identity, not body text on white.</accessibility>
  <responsive>
    - ≥1024px: two-pane — main column (search + tabs + grid) flex:1, detail panel sticky 340px right.
    - 768–1023px: two-pane with a narrower grid (fewer auto-fill columns) + ~300px detail panel; if width is tight, detail panel may dock below as a full-width card.
    - &lt;768px: single column; detail becomes a bottom sheet triggered by selection. Category pills scroll horizontally with snap. Grid keeps ≥56px tiles (wraps to as few as 4–5 columns on the narrowest screens). Breakpoints follow DESIGN (480/768/1024).
  </responsive>
  <atmosphere>Bright, friendly, utilitarian-but-warm: a calm grid of inviting tappable tiles with mint identity, one big glyph in the spotlight on the right. Avoids a dense "character map" look; generous gaps and rounded tiles make it feel like Jurepi, not a system dialog.</atmosphere>
  <icons>lucide-react: Search (search field), Star/StarOff (favorite), Copy (chips/button), X (clear/close). 20px default, stroke 1.75, currentColor. The registry card icon is `Asterisk`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>Symbol names, usage, examples, and search results render as text nodes (React escapes); NEVER dangerouslySetInnerHTML anywhere in this module — even the "HTML entity" string (e.g. "&amp;middot;") is shown as LITERAL TEXT, never injected as markup.</input>
  <clipboard>Only writes the user-initiated character/entity/codepoint string; never reads the clipboard. Copy happens inside a user-gesture handler (click/keypress) as required by browsers.</clipboard>
  <privacy>Recents/favorites are stored ONLY in localStorage and are NEVER transmitted. No analytics event includes copied content (at most a coarse "copy" count if any). Stated plainly in the how-to/FAQ.</privacy>
  <catalog_integrity>The catalog is a build-time static asset (no remote fetch); a unit test validates codepoint/entity derivation and locale completeness so no malformed/duplicate entry ships.</catalog_integrity>
  <note>No secrets, no network calls, no third-party storage.</note>
</security_considerations>

<advanced_functionality>
  <recently_copied>MRU strip + Recent tab (localStorage, capped 16) — the core friction-killer for repeat use.</recently_copied>
  <favorites>Pin any symbol (star); Favorites tab + persisted set — for the handful a given user needs constantly.</favorites>
  <copy_as_representations>Beyond the raw character, one click copies the HTML entity or the U+ codepoint — useful for developers and writers embedding symbols in code/markup.</copy_as_representations>
  <keyboard_first>"/" to search, arrow-roving grid, Enter to copy, "f" to favorite — power users never touch the mouse.</keyboard_first>
  <reduced_motion>Applies to tile hover, copy flash/pulse, detail cross-fade, and the mobile sheet slide.</reduced_motion>
  <initial_consonant_search optional="true">Phase 2: Korean 초성 search (e.g. "ㄱㅇㄷ" → 가운뎃점) layered into filterSymbols without changing its signature.</initial_consonant_search>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Click to copy + detail panel updates</description>
    <steps>
      1. Visit /ko/tools/special-symbol → grid renders with categories; detail panel shows the empty hint; nothing selected.
      2. Click the "·" (middle dot) tile → clipboard now contains "·"; a toast "복사됨: ·" appears; the tile shows a brief ✓ flash and becomes selected.
      3. The detail panel now shows: big "·", name "가운뎃점", chips "기호 ·" / "HTML &amp;middot;" / "유니코드 U+00B7", a usage note, and 2–3 examples (e.g. "사과·배·감").
      4. Paste into any field → "·" is pasted.
      5. Click the "HTML" chip → clipboard now contains "&amp;middot;"; toast "HTML 엔티티 복사됨".
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Search, category filter, and empty states</description>
    <steps>
      1. Type "대시" (or "dash") in search → grid narrows to em dash (—) and en dash (–); result count updates; aria-live announces it.
      2. Clear search; click the "화살표"(arrows) category → grid shows only arrows (→ ← ↑ ↓ …).
      3. Type "00b7" → the middle dot appears (codepoint match).
      4. Type "asdfqwer" → empty state "‘asdfqwer’에 해당하는 기호가 없어요" + clear button; clicking clear restores the grid.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Recents + favorites persistence</description>
    <steps>
      1. Copy three different symbols → a "최근 복사" strip appears above the grid showing them most-recent-first; the Recent tab also lists them.
      2. Hover a tile and click its star → it appears under the Favorites tab; star is filled (aria-pressed=true).
      3. Reload the page → recents and favorites are still present (localStorage), pruned of any unknown ids.
      4. With localStorage disabled (private mode) → copying still works and the strip updates in-session, but after reload it's empty; NO error is shown.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Keyboard-only operation + a11y</description>
    <steps>
      1. Press "/" → focus jumps to the search box.
      2. Tab into the grid; use Arrow keys to move the focused tile (detail panel previews each focused symbol WITHOUT copying).
      3. Press Enter on a tile → it copies (toast + aria-live "복사됨: {name}").
      4. Press "f" on a focused tile → toggles favorite (aria-pressed flips; toast).
      5. Run axe → no violations; every tile button has an aria-label containing name + char + codepoint; focus ring visible throughout.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, copy fallback, and SEO</description>
    <steps>
      1. Switch to /en → all chrome + every symbol's name/usage/examples render in English; "·" name reads "Middle Dot (Interpunct)".
      2. Simulate navigator.clipboard absent + execCommand failing → clicking a tile opens the CopyFallbackModal with the character pre-selected and an instruction; no false "복사됨" toast was shown.
      3. Production build → /ko/tools/special-symbol and /en/tools/special-symbol are statically generated with unique title, meta description, canonical, hreflang, OG, SoftwareApplication + FAQPage JSON-LD; how-to + FAQ localized; the symbols dataset ships as a code-split chunk, not in the global i18n bundle.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <core_interaction>CRITICAL: one click copies the character AND selects it (detail panel updates); hover/focus previews without copying; copy degrades through clipboard API → execCommand → manual modal and never reports false success.</core_interaction>
  <content_integrity>CRITICAL: a unit test asserts every catalog entry's id + codepoints + HTML entity derive correctly from char, ids are unique, char is NFC, and name/usage/examples are non-empty in BOTH ko and en (≥1 example each).</content_integrity>
  <functionality>Searchable, category-filterable grid; recents (capped MRU) + favorites persisted in localStorage and pruned of unknown ids; "copy as" character/entity/codepoint; keyboard-first operation; works fully without localStorage.</functionality>
  <user_experience>Copy feels instant (&lt; 50ms perceived); clear, unobtrusive success toast + ✓ flash; one glyph in the spotlight; ≥44px targets; visible focus; SPA — no route reload for any interaction.</user_experience>
  <technical_quality>lib/special-symbol/* pure-function unit coverage ≥ 80% (codepoint/entity derivation, search matching incl. codepoint + diacritics, recents/favorites immutable ops, zod rejection + prune); 0 TS errors; no file &gt; 800 lines; the catalog is code-split and does NOT inflate the global i18n bundle.</technical_quality>
  <visual_design>DESIGN.md compliant; mint accent for identity (tiles, glyph tile, chips, favorites), brand honey-gold reserved for the Copy CTA; bright, friendly grid — not a system character-map dialog; HTML-entity strings rendered as literal text only.</visual_design>
  <accessibility>Full keyboard operation (roving grid, "/", Enter, "f", Esc); aria-live copy status; labeled tile buttons announcing the symbol without relying on glyph rendering; reduced-motion respected; WCAG 2.1 AA contrast.</accessibility>
  <performance>Tool route stays within platform budgets; catalog dynamically imported (not in global i18n bundle); grid renders 200+ tiles smoothly; CLS unaffected (ad height reserved by platform).</performance>
</success_criteria>

<build_output>
  <note>Built as part of the platform (pnpm build). /[locale]/tools/special-symbol is pre-rendered by the platform's generateStaticParams iterating the registry (status "live"). The symbol catalog ships as a code-split chunk loaded on this route only.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'text' category + 'mint' accent ALREADY exist; no ToolCategory change needed.
    {
      id: 'special-symbol',
      slug: 'special-symbol',
      category: 'text',
      icon: 'Asterisk',          // lucide-react
      accent: 'mint',
      status: 'live',            // 'coming_soon' until the module is built
      isNew: true,
      order: 9,                  // after qna-a-day(8); tune as desired
      keywords: ['특수문자','특수기호','기호','가운뎃점','가운데점','중점','엠대시','엔대시','대시','물음표','거꾸로물음표','화살표','별표','통화기호','단위기호','문장부호','괄호','따옴표','copy','special characters','special symbols','glyphs','punctuation','em dash','interpunct','arrows','currency'],
    },
    ```
    Also add a slug→component branch in the tool route (render &lt;SpecialSymbol/&gt; for slug 'special-symbol') and a generateMetadata branch (title/description/JSON-LD) alongside the existing ladder/qna-a-day branches. No new category label is required (the "텍스트"/"Text" pill already exists).
  </platform_registry_change>
  <critical_paths>
    1. lib/special-symbol/codepoint.ts — id/codepoint/entity derivation correctness (NFC, multi-codepoint, named-vs-decimal entity). Everything keys off this.
    2. The clipboard adapter — three-tier fallback with a confirmed-success contract (toast only on real success); covered by component/E2E tests with the API mocked absent.
    3. The click = copy + select interaction (and hover/focus = preview without copy) — the heart of the tool; get the gesture/copy timing right.
    4. Catalog content + the derivation/locale-completeness test (gate the dataset).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/special-symbol/codepoint.ts + catalog.ts + search.ts + recents.ts + schema.ts with Vitest (RED→GREEN): derivation, named/decimal entities, search (name/keyword/char/codepoint, diacritics), MRU push/dedupe/cap, toggleFavorite, zod parse + pruneUnknown.
    2. Seed data/symbols.json with the category set + a representative ~40 symbols (incl. the user's three: · — ¿), then a dataset test asserting derivation + ko/en completeness + uniqueness; expand to ~180–260 entries.
    3. tools.special-symbol.* messages (ko/en): tabs, category labels, search, toasts, empty states, how-to, FAQ.
    4. useSymbolPicker hook (localStorage read/prune/in-memory fallback + debounced write + clipboard adapter + derived filtered list/selection).
    5. SymbolTile + SymbolGrid (roving tabindex, states, copied flash) + SymbolSearch + CategoryTabs + RecentRow + empty states.
    6. DetailPanel (glyph tile, name, copy-as chips, usage, examples, Copy button) — docked on desktop, bottom sheet on mobile.
    7. CopyFallbackModal; keyboard shortcuts; reduced-motion; a11y pass (axe, aria-live, roving focus).
    8. SymbolIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via platform lib/seo.ts.
    9. Registry status → live; slug→component + generateMetadata branches; E2E scenarios 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <codepoint_sketch>
    ```typescript
    // src/lib/special-symbol/codepoint.ts — deterministic derivation from the character.
    const NAMED: Record<number, string> = {
      0x00b7: 'middot', 0x2014: 'mdash', 0x2013: 'ndash', 0x2026: 'hellip',
      0x00a9: 'copy', 0x00ae: 'reg', 0x2122: 'trade', 0x00b0: 'deg',
      0x00d7: 'times', 0x00f7: 'divide', 0x2190: 'larr', 0x2192: 'rarr', 0x2194: 'harr',
      0x20a9: 'won' /* not a standard named entity — fall through to decimal if unsure */,
      0x20ac: 'euro', 0x00a3: 'pound', 0x00a5: 'yen', 0x00a2: 'cent', 0x00a7: 'sect', 0x00b6: 'para',
    };
    const cps = (s: string) => Array.from(s.normalize('NFC')).map(c => c.codePointAt(0)!);

    export const idForChar = (s: string) =>
      cps(s).map(cp => 'u' + cp.toString(16).padStart(4, '0')).join('-');

    export const toCodepoints = (s: string) =>
      cps(s).map(cp => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'));

    export const toHtmlEntity = (s: string) =>
      cps(s).map(cp => (NAMED[cp] ? `&${NAMED[cp]};` : `&#${cp};`)).join('');
    ```
  </codepoint_sketch>
  <clipboard_sketch>
    ```typescript
    // returns 'ok' (programmatic success) | 'manual' (caller should open the fallback modal)
    export async function copyText(text: string): Promise<'ok' | 'manual'> {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return 'ok';
        }
      } catch { /* fall through */ }
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.readOnly = true;
        ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok ? 'ok' : 'manual';
      } catch { return 'manual'; }
    }
    // CRITICAL: show the "복사됨" toast ONLY when this resolves 'ok'. On 'manual', open CopyFallbackModal.
    ```
  </clipboard_sketch>
  <store_schema_sketch>
    ```typescript
    // src/lib/special-symbol/schema.ts
    import { z } from 'zod';
    export const STORE_VERSION = 1;
    export const StoreSchema = z.object({
      version: z.number().int(),
      recents: z.array(z.string()).max(64),       // pruned to known ids + capped to RECENTS_MAX on load
      favorites: z.array(z.string()).max(512),
      meta: z.object({
        createdAt: z.number().int().nonnegative(),
        lastCategory: z.string().optional(),
      }),
    });
    export type Store = z.infer<typeof StoreSchema>;
    ```
  </store_schema_sketch>
  <catalog_categories>
    - punctuation (문장부호): · ㆍ — – ‒ … ‥ • ‧ ※ ¶ § † ‡ ‖ ′ ″ ‴ ‐ ⁇ ⁈ ⁉ ¿ ¡
    - quotes (따옴표·괄호): “ ” ‘ ’ 「 」 『 』 《 》 〈 〉 【 】 〔 〕 〖 〗 ‹ › « » ⟨ ⟩
    - currency (통화): ₩ € £ ¥ ¢ ₿ ₽ ₹ ฿ ₫ ₴ ₦ ₱ ₪   (제외: $ — 한글 자판에 있음. ₩은 백슬래시 키에 있으나 사용자 요청으로 예외 포함)
    - math (수학·과학): × ÷ ± ∓ ∞ ≈ ≠ ≤ ≥ √ ∛ ∑ ∏ ∫ ∂ ∆ ∇ π µ Ω ° ‰ ‱ ∈ ∉ ⊂ ⊃ ∀ ∃ ¬ ∧ ∨ ∝ ∴ ∵
    - arrows (화살표): ← → ↑ ↓ ↔ ↕ ⇐ ⇒ ⇑ ⇓ ⇔ ↵ ↩ ↪ ⤴ ⤵ ⟶ ⟵ ➡ ⬅ ⬆ ⬇ ⇄ ⇆
    - units (단위): ℃ ℉ ㎡ ㎥ ㎏ ㎎ ㎞ ㎝ ㎜ ㎖ ㎘ ㏈ № ℡ µ ㎐ ㎓ ㏊
    - stars (별·도형): ★ ☆ ✦ ✧ ✩ ✪ ✯ ❤ ♥ ♡ ✓ ✔ ✗ ✘ ☑ ☒ ○ ● ◇ ◆ □ ■ △ ▲ ▽ ▼ ◈ ◐ ◑
    - circled (원 숫자): ❶ ❷ ❸ ❹ ❺ ❻ ❼ ❽ ❾ ❿ ⓫ ⓬ ⓭ ⓮ ⓯ ⓰ ⓱ ⓲ ⓳ ⓴ ⓿  — CRITICAL: black-filled "검은 원 + 흰 숫자" (negative circled numbers, U+2776–U+277F / U+24EB–U+24F4 / U+24FF) ONLY; do NOT include the outline variants ① ② ③.
    - legal (기타·법률): @ © ® ™ ℗ ¶ § ª º ¦ ° ☎ ✉ ⌘ ⌥ ⇧ ⏎ ⌫ ␣ ☜ ☞ ☝ ✂   (제외: # % & — 자판에 있음. @는 자판에 있으나 사용자 요청으로 예외 포함 — 이메일 앳/골뱅이)
    - greek (그리스 문자, optional): α β γ δ ε ζ η θ λ μ π ρ σ φ ω Α Β Γ Δ Θ Λ Π Σ Φ Ω
    NOTE: this list is the SEED/coverage guide; the builder curates the final ~180–260 with full ko/en name+usage+examples. The following MUST be present: · (U+00B7, punctuation), — (U+2014, punctuation), ¿ (U+00BF, punctuation/inverted), ※ (U+203B, punctuation — searchable by "당구장 표시"), @ (U+0040, legal — searchable by "앳"/"골뱅이"/"email"), ₩ (U+20A9, currency — keyboard-present but retained), and the black circled numbers ❶…❿ (circled).
    EXCLUDE (CRITICAL): symbols directly typable on the KOREAN 2-beolsik keyboard — the ASCII set ! ? . , : ; ' " - + = * / \ ( ) [ ] { } &lt; &gt; $ # % &amp; ^ _ | ~ (and backtick). This tool is ONLY for characters NOT on the keyboard. NOT excluded: symbols reachable only via the IME 한자 palette (e.g. ㅁ+한자 → ※ ○ △, ㄴ+한자 → 「 」) — that multi-step lookup is exactly the friction this tool removes, so they stay. Exceptions (keyboard-typable but RETAINED by explicit user request): @ (Shift+2) and ₩ (won, backslash key). (The listed curly quotes “ ” ‘ ’ are typographic, NOT the straight ASCII ' " — so they stay.)
  </catalog_categories>
  <symbol_record_samples>
    ```json
    [
      {
        "id": "u00b7", "char": "·", "category": "punctuation",
        "keywords": ["가운뎃점","가운데점","중점","interpunct","middot","middle dot"],
        "name": { "ko": "가운뎃점", "en": "Middle Dot (Interpunct)" },
        "usage": { "ko": "단어를 나란히 나열하거나 날짜·비율을 구분할 때 씁니다.", "en": "Separates listed items, dates, or ratios." },
        "examples": { "ko": ["사과·배·감", "9·11", "남녀·노소"], "en": ["A·B·C", "ratio 3·2"] }
      },
      {
        "id": "u2014", "char": "—", "category": "punctuation",
        "keywords": ["엠대시","대시","긴줄표","줄표","em dash","mdash"],
        "name": { "ko": "엠 대시(줄표)", "en": "Em Dash" },
        "usage": { "ko": "문장 중간에 보충 설명이나 강한 끊김을 넣을 때 씁니다.", "en": "Marks a strong break or parenthetical aside in a sentence." },
        "examples": { "ko": ["그는 떠났다 — 영원히.", "정답은 하나 — 바로 너야."], "en": ["He left — for good.", "One answer — you."] }
      },
      {
        "id": "u00bf", "char": "¿", "category": "punctuation",
        "keywords": ["거꾸로물음표","역물음표","스페인어","inverted question mark","spanish"],
        "name": { "ko": "거꾸로 된 물음표", "en": "Inverted Question Mark" },
        "usage": { "ko": "스페인어에서 의문문의 시작을 표시합니다.", "en": "Opens a question in Spanish (paired with ?)." },
        "examples": { "ko": ["¿Cómo estás?", "¿Qué hora es?"], "en": ["¿Cómo estás?", "¿Dónde?"] }
      },
      {
        "id": "u203b", "char": "※", "category": "punctuation",
        "keywords": ["당구장표시","당구장 표시","참고표","참조표","주석","reference mark","komejirushi"],
        "name": { "ko": "참고표 (당구장 표시)", "en": "Reference Mark" },
        "usage": { "ko": "주석이나 참고·주의 사항을 강조해 표시할 때 씁니다. 흔히 ‘당구장 표시’라고 불립니다.", "en": "Flags a note or caveat preceding a supplementary remark." },
        "examples": { "ko": ["※ 우천 시 행사는 취소됩니다.", "※ 주의: 반품 불가"], "en": ["※ Subject to change.", "※ Note: non-refundable"] }
      },
      {
        "id": "u0040", "char": "@", "category": "legal",
        "keywords": ["앳","골뱅이","at","email","이메일","멘션","앳사인","commercial at"],
        "name": { "ko": "앳 (골뱅이)", "en": "At Sign" },
        "usage": { "ko": "이메일 주소에서 아이디와 도메인을 구분하거나 SNS에서 사용자를 멘션할 때 씁니다.", "en": "Separates the user from the domain in an email address; mentions a user on social media." },
        "examples": { "ko": ["jurepi@example.com", "@사용자이름"], "en": ["name@example.com", "@username"] }
      },
      {
        "id": "u2776", "char": "❶", "category": "circled",
        "keywords": ["검은원숫자","원숫자","번호","순서","circled number","negative circled one"],
        "name": { "ko": "검은 원 숫자 1", "en": "Black Circled Number 1" },
        "usage": { "ko": "단계·순위·목록 번호를 눈에 띄게 표시할 때 씁니다. 검은 원에 흰 숫자 형태입니다.", "en": "Marks ordered steps, ranks, or list numbers with emphasis (white digit on a black disc)." },
        "examples": { "ko": ["❶ 준비 ❷ 실행 ❸ 점검", "추천 순위 ❶"], "en": ["❶ Prep ❷ Run ❸ Check", "Rank ❶"] }
      }
    ]
    ```
  </symbol_record_samples>
  <performance>The catalog is dynamically imported on the tool route only, so its ko+en strings never enter the global i18n bundle. Server-render the intro/how-to/FAQ where possible; keep the grid + detail panel as the only client-interactive surfaces. Render 200+ tiles without virtualization (lightweight buttons), but memoize the filtered list and the per-tile render to keep typing snappy; debounce search 120ms.</performance>
  <testing_strategy>
    - Unit (Vitest, ≥80% on lib/special-symbol): codepoint/id/entity derivation (single + multi-codepoint, NFC, named-vs-decimal); search matching (name, keyword, raw char, codepoint hex, diacritic/case-insensitive, blank query passthrough); recents push/dedupe/cap; toggleFavorite add/remove; zod parse + pruneUnknown; dataset coverage (derivation matches, unique ids, ko/en name+usage+≥1 example).
    - Component: SymbolTile click=copy+select vs hover/focus=preview; copied flash; favorite toggle; CategoryTabs compose with search; empty states; copy-fallback path with clipboard mocked absent; localStorage-disabled in-memory behavior.
    - E2E (Playwright): scenarios 1–5; reload persistence of recents/favorites; locale ko/en symbol-content swap; keyboard-only operation (/, arrows, Enter, f, Esc); copy fallback modal; visual regression 320/768/1024 both themes; verify HTML-entity strings render as literal text (not injected markup).
    - A11y: axe + keyboard roving grid + aria-live copy status + reduced-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
