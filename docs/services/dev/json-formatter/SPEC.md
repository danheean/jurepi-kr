# JSON Formatter & Validator — Prettify, Minify, and Validate JSON — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **JSON Formatter & Validator** (JSON 정리) — a browser-based tool that prettifies, minifies, validates, and analyzes JSON with precise error messages (line & column), optional key sorting, syntax highlighting, collapsible tree view, download/copy, and **Load from URL** (fetch JSON from a user-provided web address, directly from the browser). Pure client-side: input JSON → live preview with line/col error mapping on invalid input.
> Internal service codename: `json-formatter`. Registry id: `json-formatter`. Public URL slug: `/[locale]/tools/json-formatter`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>JSON Formatter & Validator — Browser-based JSON Tool (Jurepi tool, codename json-formatter, registry id json-formatter)</project_name>

<overview>
JSON Formatter is a zero-backend utility for developers: paste invalid or minified JSON and instantly see it prettified, validated, and analyzed. The tool transforms raw JSON strings into readable, indented output with configurable spacing (2 spaces, 4 spaces, or tabs). Users can minify with one click, toggle recursive key sorting, and download the result as a `.json` file. Every keystroke triggers a silent, debounced parse; if JSON is invalid, a precise error (line number, column, offending token) replaces the output. A collapsible tree view shows JSON structure at a glance; copy and size stats (bytes, elements) appear below.

This is **pure JavaScript** — no backend, no first-party API, no file upload. All processing runs in the browser: `JSON.parse`, `JSON.stringify`, and a lightweight hand-written tokenizer for error-position mapping (or a small lib like jsonc-parser v3.x for JSONC comment support if extended, but MVP is JSON only). The tool is entirely client-side; pasted input never leaves the device.

In addition to paste, the tool supports **Load from URL**: the user enters a web address (e.g., a public API endpoint or a raw `.json` file URL) and the browser fetches it directly with `fetch()` — no proxy, no backend relay. The response body is loaded into the input area and parsed like pasted text. Because the request is a plain cross-origin browser fetch, it only succeeds when the target server allows CORS; when CORS blocks the request, the tool shows a friendly, honest explanation (not a generic failure) telling the user to download the file and paste instead.

CRITICAL (client-only, SSG): 100% client-side, no backend, no database. The ONLY network call is the optional, user-initiated Load-from-URL fetch, which goes directly from the user's browser to the user-provided address (never through a Jurepi or third-party proxy). Pasted/loaded JSON is never sent anywhere else, stored remotely, or logged. The only first-party persistence is localStorage for user preferences (indent style, sort setting, last input).

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. All interaction — paste, format, minify, sort, tree toggle, copy, download — happens via local React state with NO route navigation and NO full page reload. The tool shell is statically generated (SSG) for SEO; the interactive formatter is a single client component. Parsing and error reporting happen live (debounced 200ms) as the user types.

CRITICAL (error reporting): invalid JSON must not silently fail. Return a human-friendly error message with exact line number, column, and context (e.g., "Line 5, column 12: unexpected token '}'"). Line/column tracking is achieved via a lightweight tokenizer scanning the raw input character-by-character to map parse errors to their position.

CRITICAL (XSS-safe rendering): the tree view and error messages render user-supplied JSON structure and source code. NEVER use dangerouslySetInnerHTML. Syntax highlighting is applied via CSS classes (role: token type) not injected HTML. Copy button copies plain text strings only.
</overview>

<platform_integration>
  - Route: /[locale]/tools/json-formatter (SSG; registry slug "json-formatter", id "json-formatter", status "live", accent "sky", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.json-formatter.*` (UI chrome strings: options labels, error messages, copy toast, download prompt, how-to, FAQ — NOT JSON data; that comes from user input).
  - NOTE (updated 2026-07-04): the `'dev'` category is ALREADY live in the platform (url-encoder, base64-encoder, bookmarks, dev-people ship under it — i18n label, `CATEGORY_ORDER`, `FOOTER_CATEGORIES` all wired). No platform prerequisite remains; this tool only adds its own registry entry.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - JSON input (raw string) via a large textarea or paste area.
    - Load from URL: user enters an http(s) address → browser fetches it directly (`fetch`, user-initiated, no proxy) → response text fills the input and is parsed. Loading state, response-size guard (same 10MB cap), and friendly CORS/network/HTTP error messages.
    - Live validation: parse on keystroke (debounced 200ms); if invalid, return precise error (line, column, token, context).
    - Format output: pretty-print with selectable indent (2 spaces / 4 spaces / tab); minify (no whitespace); sort object keys (optional, recursive, alphabetical).
    - Syntax highlighting: color tokens by type (string/number/boolean/null/key) using DESIGN.md sky accent palette.
    - Collapsible tree view: recursive JSON structure as a navigable tree; expand/collapse nodes; show nesting level.
    - Copy button (copy formatted JSON); download button (download as `.json`); byte/element count stats.
    - Keyboard support: Ctrl+A select all, Ctrl+C copy, Ctrl+Enter format, Ctrl+Shift+M minify.
    - localStorage persistence: remember user's indent choice + sort preference + last valid input (optional).
    - Tool-specific SEO long-form + FAQ, plus a simple HowTo (usage guide).
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - JSON↔YAML/CSV/XML conversion (future tool or separate feature).
    - JSONPath querying (future feature).
    - JSONL (newline-delimited) processing (Phase 2 candidate).
    - Schema validation (JSON Schema) — out of scope; basic well-formedness only.
    - Backend processing or storage (all client).
    - AI-powered fixes or suggestions.
  </out_of_scope>
  <future_considerations>
    - JSONC (JSON with comments) and trailing-comma leniency mode — Phase 2.
    - JSONPath query UI — Phase 2.
    - JSONL streaming view — Phase 2.
    - Diff mode (compare two JSONs) — Phase 3.
    - JSON Schema validation (user supplies schema) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <parsing>JSON.parse (native), small tokenizer or jsonc-parser v3.x (devDependency, optional for JSONC Phase 2; MVP uses native JSON.parse for exact error positions). Hand-written tokenizer is simpler for MVP: scan input character-by-character, track line/col, return (line, col, offendingToken) on parse error.</parsing>
    <formatting>JSON.stringify with space argument (2, 4, or '\t') for pretty-print; no external formatter lib.</formatting>
    <sorting>Recursive key sort via immutable ops (sort array of Object.keys, rebuild object).</sorting>
    <tree_view>Recursive React component rendering JSON structure; expand/collapse via local state per node.</tree_view>
    <syntax_highlighting>CSS classes mapped to token types (string, number, key, bracket, etc.); Tailwind classes (e.g., text-sky-600 for strings, text-orange-600 for numbers) apply colors from DESIGN tokens.</syntax_highlighting>
    <copy>navigator.clipboard.writeText() with textarea fallback; silent fail on error (copy is secondary).</copy>
    <download>Blob → URL → a[href] trick, synthetic click (no fetch).</download>
  </module_specific>
  <libraries>
    <tokenizer>Hand-written or jsonc-parser v3.1.0 (optional, devDep for test fixtures). MVP: hand-written suffices.</tokenizer>
    <zod>zod v3.x (already in repo) for user settings schema (indent choice, sort flag, preferences).</zod>
  </libraries>
  <note>CRITICAL: NO backend, NO first-party API, NO DB.</note>
</technology_stack>

<file_structure>
src/
├── lib/json-formatter/                    # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: FormatOptions (indent, sort, precision); SettingsStore
│   ├── tokenizer.ts                       # lineColFromParseError(jsonStr, error): {line, col, token, context}
│   ├── format.ts                          # formatJson(jsonStr, options): {output, error?}
│   ├── minify.ts                          # minifyJson(jsonStr): {output, error?}
│   ├── sort-keys.ts                       # sortKeysRecursive(json, deep): object with sorted keys
│   ├── tree-nodes.ts                      # jsonToTreeNodes(json): TreeNode[] (structure for tree view)
│   ├── fetch-url.ts                       # validateJsonUrl(url) + fetchJsonFromUrl(url, {maxBytes, fetchImpl}): {text} | {error: typed code}
│   └── stats.ts                           # getStats(json): {byteSize, elementCount, depth}
├── components/tools/json-formatter/
│   ├── JsonFormatter.tsx                  # Orchestrator (Client Component) — state owner
│   ├── useJsonFormatter.ts                # Hook: parse state, options, localStorage persist
│   ├── UrlLoader.tsx                      # URL input + load button, loading/error states
│   ├── JsonInput.tsx                      # Large textarea, live onChange → parse
│   ├── FormatOptions.tsx                  # Indent select, sort toggle, action buttons (format/minify)
│   ├── OutputPane.tsx                     # Formatted output (read-only) + copy/download buttons
│   ├── JsonTreeView.tsx                   # Collapsible tree (recursive TreeNode render)
│   ├── JsonTreeNode.tsx                   # One node: value + expand/collapse + children
│   ├── SyntaxHighlight.tsx                # Token-typed spans (string/number/key/etc)
│   ├── ErrorMessage.tsx                   # Precise error: "Line X, column Y: <context>"
│   ├── JsonFormatterIntro.tsx             # H1 + lead (SEO long-form)
│   ├── JsonFormatterHowTo.tsx             # "How to format JSON" (SEO)
│   ├── JsonFormatterFaq.tsx               # FAQ + FAQPage JSON-LD
│   └── JsonFormatterStats.tsx             # Size + element count display
└── i18n/messages/{ko,en}.json             # tools.json-formatter.* UI chrome
</file_structure>

<core_data_entities>
  <format_options>
    - indent: enum (2, 4, tab) — default 2.
    - sortKeys: boolean — default false.
    - theme: enum (light, dark, system) — inherited from platform.
    PERSISTENT: localStorage key `jurepi-json-formatter` stores { indent, sortKeys, lastInput? (optional, last valid JSON).
  </format_options>
  <parse_result>
    - success: boolean.
    - output?: string — formatted JSON if valid.
    - error?: { line: number; column: number; token: string; context: string } — if invalid. lineCol values 1-indexed (human-friendly).
  </parse_result>
  <tree_node>
    - type: enum (object, array, string, number, boolean, null).
    - key?: string — for object properties.
    - value?: any — raw value (or omitted for parent nodes).
    - children?: TreeNode[] — for object/array.
    - depth: number.
    - expanded: boolean (UI state, not persisted).
  </tree_node>
  <stats>
    - byteSize: number — byte length of formatted JSON.
    - elementCount: number — count of leaf values (strings, numbers, booleans, nulls, excluding structure).
    - depth: number — max nesting depth.
  </stats>
  <constants>
    - DEBOUNCE_MS = 200ms (parse on keystroke delay).
    - MAX_INPUT_SIZE = 10MB (guard against browser freeze).
    - TOAST_DURATION_MS = 1600ms.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/json-formatter" page="JsonFormatter (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <json_formatter>                  <!-- "use client"; owns input + options + output state + useJsonFormatter() -->
    <json_formatter_intro />        <!-- H1 + lead (server-render where possible) -->
    <formatter_container>           <!-- Desktop 2-split or mobile stacked -->
      <json_input />                <!-- Textarea: live onChange → debounced parse -->
      <format_options />            <!-- Indent select, sort toggle, format/minify buttons -->
      <output_pane>                 <!-- Formatted output (read-only) or tree view tab -->
        <syntax_highlight />        <!-- Token-colored output -->
        <json_tree_view />          <!-- Collapsible tree (alternative tab) -->
        <error_message />           <!-- Precise error if invalid -->
      </output_pane>
      <json_formatter_stats />      <!-- Byte size, element count -->
    </formatter_container>
    <json_formatter_how_to />       <!-- SEO long-form -->
    <json_formatter_faq />          <!-- FAQPage JSON-LD -->
  </json_formatter>
</component_hierarchy>

<pages_and_interfaces>
  <json_formatter_intro>
    - Eyebrow: "개발자 도구" / "DEVELOPER TOOL" — 12px/700, var(--brand).
    - H1: "JSON 정렬 및 검증" / "JSON Formatter & Validator" — Gmarket Sans clamp(28px,5vw,40px)/700.
    - Lead: "복잡한 JSON을 한눈에 정리하고, 무효한 JSON의 정확한 오류 위치를 확인하세요." (body-lg 18px var(--text-secondary)).
  </json_formatter_intro>

  <url_loader>
    - Single row above the input textarea: URL text input (placeholder "https://api.example.com/data.json") + [불러오기] / [Load] button (secondary style; brand CTA stays Format).
    - Enter key in the URL input triggers load. While loading: button disabled + spinner, input read-only.
    - Error message renders directly below the row (danger styling per DESIGN tokens); success clears the message and fills the JSON textarea.
  </url_loader>

  <json_input>
    - Large textarea, full width (desktop) or mobile stacked, placeholder "JSON을 붙여넣으세요…" / "Paste JSON here…", monospace font (Menlo/Monaco/Courier New fallback).
    - Syntax highlighting in textarea optional (MVP: plain, Phase 2: CodeMirror-lite).
    - Live onChange debounced 200ms → parse (no debounce visual lag; input updates immediately).
  </json_input>

  <format_options>
    - Horizontal control bar (or vertical on mobile): Indent select (2 / 4 / Tab), Sort Keys toggle (checkbox).
    - Action buttons: [Format] (brand color, default indent), [Minify] (secondary style), [Clear] (text button).
    - Status icon: checkmark (valid) or error (⚠) indicator.
  </format_options>

  <output_pane>
    - Tab row (if tree view enabled): "Formatted" / "Tree" tabs (default "Formatted").
    - Formatted tab: read-only monospace output, syntax-highlighted (strings var(--accent-sky), numbers var(--accent-sun), booleans var(--accent-rose), keys var(--accent-mint-ink)/700).
    - Tree tab: collapsible JSON tree, nodes labeled by key/index, expand/collapse chevron (lucide ChevronRight), depth-indented.
    - Copy button (top-right): copies formatted JSON → success toast "복사됨!" / "Copied!"
    - Download button: prompts filename (default "data.json"), downloads as blob.
    - Error state: red border + ErrorMessage block (line, column, context snippet).
  </output_pane>

  <json_formatter_stats>
    - Below output: "크기: 4.2 KB · 요소: 42개 · 깊이: 5" / "Size: 4.2 KB · Elements: 42 · Depth: 5" (var(--text-muted) 14px).
  </json_formatter_stats>

  <keyboard_shortcuts_reference>
    - Ctrl+A (or Cmd+A) → select all input
    - Ctrl+C (Cmd+C) → copy formatted (if valid)
    - Ctrl+Enter (Cmd+Enter) → format with current indent
    - Ctrl+Shift+M (Cmd+Shift+M) → minify
    - Tab (in textarea) → insert indent (Shift+Tab to outdent), or use aria-label + button focus if accessibility conflict.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <parsing note="live, debounced">
    - parseJson(input): attempt JSON.parse(input). On success, return { success: true, json }. On error, extract line/col via tokenizer, return { success: false, error: {line, col, token, context} }.
    - Tokenizer scans character-by-character, tracking line (LF increments) and column (reset on LF). On parse error, look back to nearest delimiter or token boundary to pinpoint error position and show context snippet.
  </parsing>
  <formatting>
    - formatJson(json, indent): JSON.stringify(json, null, indent). indent ∈ {2, 4, '\t'}.
    - sortKeysRecursive(json, true): traverse json, for each object, sort keys alphabetically, rebuild.
  </formatting>
  <minification>
    - minifyJson(json): JSON.stringify(json) — no whitespace.
  </minification>
  <tree_generation>
    - jsonToTreeNodes(json, depth=0): recursively walk json structure, emit TreeNode for each branch/leaf. Used for tree-view UI.
  </tree_generation>
  <copy_and_download>
    - copyJson(text): navigator.clipboard.writeText(text), fallback to execCommand('copy') if unavailable. Silent fail (no false success).
    - downloadJson(json, filename='data.json'): create Blob from JSON.stringify, generate download link, trigger synthetic click.
  </copy_and_download>
  <load_from_url>
    - validateJsonUrl(raw): trim, require http:// or https:// scheme (reject javascript:, data:, file:, ftp:, blank). Return typed result {ok, url?} | {ok:false, error:'invalid_url'}.
    - fetchJsonFromUrl(url, {maxBytes=10MB, fetchImpl}): user-initiated only (button/Enter). Browser `fetch(url)` with Accept: application/json. Typed error codes (NOT raw exception text): 'cors_or_network' (TypeError from fetch — browsers do not distinguish CORS vs offline), 'http_error' (response.ok false, include status), 'too_large' (Content-Length or body length > maxBytes), 'empty_body'. Success returns {text} — the raw body; parsing/validation is the normal input pipeline's job (a non-JSON body simply produces the standard precise parse error).
    - fetchImpl is injectable for unit tests (pure domain function, no jsdom fetch dependency).
    - UI: UrlLoader renders a single-line URL input + [Load] button above the textarea; while loading, button shows spinner and is disabled; on success input textarea is replaced with fetched text (undo = user's own paste); on error a friendly i18n message per error code, with the CORS message explicitly suggesting "download the file and paste it here" as the fallback path.
    - The loaded URL is NOT persisted to localStorage (privacy); only the standard prefs are.
  </load_from_url>
  <persistence>
    - Mount: read `jurepi-json-formatter` from localStorage → zod parse → load indent + sort prefs; fail → start fresh (no throw).
    - Change: debounced setItem after every option change (indent, sort toggle). lastInput optional (takes space; disabled by default).
  </persistence>
  <i18n>All UI chrome from tools.json-formatter.* (ko/en): labels, error messages, toasts, how-to, FAQ. JSON input/output is locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <invalid_json>
    - Parse fails → ErrorMessage component: "Line 5, column 12: unexpected token '}' (expected ',')". Line/col 1-indexed. Show ~20-char context snippet around error position.
  </invalid_json>
  <input_size>
    - Input > 10MB guard: show warning "파일이 너무 커서 처리할 수 없습니다" / "Input too large", don't parse. Prevent UI freeze.
  </input_size>
  <copy_failure>
    - Copy is secondary. clipboard API fail → no error toast, silent (best-effort). Download is always available.
  </copy_failure>
  <storage>
    - localStorage unavailable (private mode) → prefs in-memory, no scary error. Tool fully functional.
  </storage>
  <url_load_failure>
    - invalid_url → "올바른 http(s) 주소를 입력하세요" / "Enter a valid http(s) address".
    - cors_or_network → honest CORS explanation: "해당 서버가 브라우저에서의 접근(CORS)을 허용하지 않거나 네트워크 오류입니다. 파일을 내려받아 붙여넣어 주세요." / equivalent EN. Never a blank or generic "failed".
    - http_error → include status code ("서버 응답 404" / "Server responded 404").
    - too_large → same message as the 10MB input guard.
    - Errors are shown in the UrlLoader area and never clear the user's existing textarea content.
  </url_load_failure>
  <note>No first-party API; the only network surface is the user-initiated Load-from-URL fetch above.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SKY (var(--accent-sky) / var(--accent-sky-soft)) — "dev" category identity per DESIGN. Intro icon tile, syntax highlighting (strings), tree expand/collapse chevron.
    - CTAs (buttons) stay brand honey-gold var(--brand) (Format/Download). Accent = identity for data types.
    - Syntax coloring: strings var(--accent-sky) / numbers var(--accent-sun) / booleans var(--accent-rose) / null var(--accent-mint) / keys var(--accent-mint-ink)/700.
  </accent_usage>
  <layout>Textarea (left/top), output (right/bottom) stacked or 2-split. Desktop ≥1024px: 2-split side-by-side (50/50). Mobile <768px: stacked, output collapsible.</layout>
  <typography>H1 Gmarket Sans; textarea/output monospace (Menlo/Monaco/Courier New); UI labels/buttons Pretendard.</typography>
  <motion>transform/opacity only: tab switch 150ms cross-fade, tree expand 200ms (height animated via max-height for accessibility), copy toast slide-up 250ms, error shake (keyframes scale 1→1.02→1) 300ms. All gated by prefers-reduced-motion.</motion>
  <responsive>≥1024px: 2-col split 50/50; 768–1023px: 2-col with narrower; <768px: stacked, tabs + sheet. No overflow (320 guard).</responsive>
  <atmosphere>Technical but friendly: bright monospace input/output, clean control bar, precise error messages. Not a "dark IDE mode"; light-first (Jurepi bright brand).</atmosphere>
</aesthetic_guidelines>

<security_considerations>
  <input note="user JSON, defend against XSS">
    - JSON strings are data, not code. Tree view and output render as text nodes (React escapes). dangerouslySetInnerHTML forbidden.
    - Syntax highlighting: map token type to CSS class only, never inject HTML markup from token value.
    - Copy button copies plain text only (no rich HTML).
  </input>
  <clipboard>User-initiated; never read clipboard. Write-only.</clipboard>
  <url_fetch>
    - User-initiated only; no automatic fetch on paste/typing of a URL. Scheme allowlist http/https (reject javascript:, data:, file:).
    - The browser's same-origin policy / CORS is the security boundary — the tool never proxies, so it cannot be used to bypass CORS or reach private networks beyond what the user's own browser allows.
    - The fetched URL and body are never sent to Jurepi or any third party, and the URL is not persisted.
  </url_fetch>
  <privacy>Input never sent (except the user's own Load-from-URL request going directly to the address the user typed). localStorage stores only user prefs (indent choice), not JSON data (opt-in lastInput is disabled by default).</privacy>
  <performance>Parsing debounced 200ms; input capped at 10MB (guard freeze). No memory leak (tree/tokenizer garbage-collected per parse).</performance>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <syntax_highlighting>Token-typed spans (string/number/key/bracket) colored via DESIGN.md sky accent palette. No HTML injection; CSS classes only.</syntax_highlighting>
  <tree_view>Collapsible JSON structure; expand/collapse nodes via local state; depth-aware indentation. Shows structure at a glance for large JSONs.</tree_view>
  <key_sorting>Recursive alphabetical sort of all object keys, preserving array order.</key_sorting>
  <precise_error_reporting>Line and column (1-indexed) + token context snippet on parse fail. Hand-written tokenizer maps error position accurately.</precise_error_reporting>
  <keyboard_shortcuts>Ctrl+Enter format, Ctrl+Shift+M minify, Ctrl+C copy — power-user friendly.</keyboard_shortcuts>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Paste invalid JSON, see precise error</description>
    <steps>
      1. Paste `{"name":"John", "age":30, }` (trailing comma, invalid).
      2. Input → debounce 200ms → error block shows "Line 1, column 24: unexpected token '}'".
      3. Error message displays context: `...30, }` with error indicator.
      4. Fix: remove comma, paste again → parse succeeds, output renders formatted.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Format, minify, sort</description>
    <steps>
      1. Paste minified `{"z":1,"a":{"b":2},"m":3}`.
      2. Click [Format] → 2-space indent output; toggle [Sort Keys] → keys reorder (a, m, z); nested b stays intact.
      3. Click [Minify] → compact, no whitespace.
      4. Stats show byte size reduction.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Tree view, expand/collapse, copy</description>
    <steps>
      1. Paste valid nested JSON (array of objects).
      2. Click "Tree" tab → collapsible tree renders; root as Array(N).
      3. Click expand chevron → children expand; depth-indented.
      4. Copy button → success toast "복사됨!" / "Copied!"; clipboard has formatted JSON.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Download, large JSON, i18n</description>
    <steps>
      1. Paste large valid JSON (~500KB, well under 10MB).
      2. Click [Download] → browser prompts filename (default "data.json"); file saves.
      3. Switch locale to /en → UI labels switch to English (indent "spaces"→"Spaces", sort to "Sort Keys").
      4. Input/output are locale-agnostic.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Keyboard, reduce-motion, a11y</description>
    <steps>
      1. Focus input, Ctrl+A → select all; type new JSON; Ctrl+Enter → format.
      2. prefers-reduced-motion ON → tree expand instant (no height anim), copy toast fade-only, error no shake.
      3. Tab navigate to buttons; Enter/Space trigger (≥44px tap targets); aria-labels present; focus-visible ring 2px var(--focus-ring).
      4. axe scan → no violations.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>Load from URL (mocked), CORS failure path</description>
    <steps>
      1. Enter a valid https URL serving JSON (E2E: route-intercepted/mocked response) → click [Load] → textarea fills with response body → auto-parse → formatted output renders.
      2. Enter a URL whose fetch rejects (mocked network/CORS failure) → friendly CORS/network message appears in the loader area; existing textarea content is NOT cleared.
      3. Enter "not-a-url" → invalid_url message, no fetch attempted.
      4. Unit tests cover fetchJsonFromUrl with injected fetchImpl: success, HTTP 404, TypeError (cors_or_network), oversized body.
    </steps>
  </test_scenario_6>
</final_integration_test>

<success_criteria>
  <functionality>Paste invalid JSON → precise error (line/col); paste valid → format (2/4/tab), minify, sort; tree view; copy + download; Load from URL (direct browser fetch, typed friendly errors incl. CORS); stats (size, elements); keyboard shortcuts (Ctrl+Enter, Ctrl+C).</functionality>
  <user_experience>Keystroke → parse in ≤200ms visible (no lag); copy toast; download immediate; ≥44px targets; visible focus; SPA — no route reload.</user_experience>
  <technical_quality>lib/json-formatter/* pure ≥80% unit coverage (tokenizer, format, sort, stats); TS 0 errors; <800 lines per file; error message test fixtures (invalid JSON cases).</technical_quality>
  <visual_design>DESIGN.md compliant; sky accent identity; monospace I/O (readable); control bar clean; light-first (bright, not dark IDE).</visual_design>
  <accessibility>Full keyboard (Ctrl+shortcuts); roving focus buttons; aria-labels; tree expand respects reduce-motion; WCAG 2.1 AA contrast; prerendered SEO/FAQ.</accessibility>
  <performance>Tool route within platform budget; debounced parse; ≤10MB input guard; copy/download no fetch; LCP < 2.5s.</performance>
  <security>No XSS: text-node render only, no dangerouslySetInnerHTML. Input never sent. localStorage prefs only (lastInput opt-out).</security>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/json-formatter pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. Also activate 'dev' category (one-time, platform-wide).
    {
      id: 'json-formatter',
      slug: 'json-formatter',
      category: 'dev',
      icon: 'Braces',           // lucide-react
      accent: 'sky',
      status: 'live',
      isNew: true,
      order: 25,               // 20 is already taken (bookmarks); next free slot after 24
      keywords: ['JSON','포맷','정렬','검증','개발','도구','URL','minify','prettify','formatter','validator'],
    },
    // No platform prerequisite: 'dev' category is already fully wired (see platform_integration note).
    ```
  </platform_registry_change>
  <critical_paths>
    1. Tokenizer (lineColFromParseError) — foundation for error reporting.
    2. Recursive sort/tree-node generation — core value props (not just minify/prettify).
    3. Copy/download (no fetch, client-only Blob trick).
    4. XSS-safe rendering: text nodes + CSS classes, no HTML injection.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/json-formatter/{tokenizer, format, minify, sort-keys, tree-nodes, stats, fetch-url, schema}.ts (Vitest ≥80%).
    2. tools.json-formatter.* messages (ko/en): labels, error messages (incl. urlLoad.*), button text, how-to, FAQ.
    3. JsonInput + UrlLoader + FormatOptions (controlled input, debounced onChange).
    4. OutputPane (Formatted + Tree tabs, syntax highlighting, copy/download).
    5. useJsonFormatter hook (state management, localStorage, error handling).
    6. JsonFormatter orchestrator + keyboard shortcuts.
    7. Intro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    8. Registry status→live; slug→component + generateMetadata branches.
    9. Keyboard/reduce-motion/a11y pass; axe scan.
    10. E2E 1–5 scenarios; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>
    - Unit (Vitest ≥80%): tokenizer (various parse errors), format (indent options, sort), tree-nodes, stats, copy fallback, fetch-url (injected fetchImpl: success/404/TypeError/oversize/invalid scheme).
    - Component: JsonInput state, FormatOptions toggle, OutputPane tab switch, SyntaxHighlight token rendering.
    - E2E (Playwright): scenarios 1–5 (paste + error, format/minify/sort, tree, download, i18n/a11y).
    - Visual regression: 320/768/1024 both themes, large JSON (scroll), error state, tree expanded.
    - A11y: axe + keyboard (Ctrl shortcuts) + reduce-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```

