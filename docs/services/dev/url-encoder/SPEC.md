# URL Encoder / Decoder — Two-direction percent-encoding and query-string inspector — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **URL Encoder** (URL 인코딩·디코딩) — a client-side text transformer that encodes and decodes URL text in two modes (`encodeURIComponent` vs `encodeURI`), across two character sets (**UTF-8** default and **EUC-KR/CP949** for legacy Korean URLs), parses and edits query strings as tables, processes multiple lines in batch, and handles edge cases (malformed sequences, unicode, already-encoded input, unencodable characters, empty input) with friendly errors. Content is pure domain logic unit-tested, localStorage-persisted recents, and fully client-side. The tool mounts as a client-side SPA on the platform shell.
> Internal service codename: `url-encoder`. Registry id: `url-encoder`. Public URL slug: `/[locale]/tools/url-encoder`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>URL Encoder / Decoder — Percent-encoding and query-string inspector (Jurepi tool, codename url-encoder, registry id url-encoder)</project_name>

<overview>
URL Encoder brings URL text encoding and decoding to one place with clarity and precision. A user pastes a string and chooses one of two directions: encode (text → percent-encoded URL text) or decode (percent-encoded → readable text). Two modes exist to serve different needs: **component mode** (`encodeURIComponent` / `decodeURIComponent`) for URL query parameters and fragment identifiers, and **full URI mode** (`encodeURI` / `decodeURI`) for complete URL strings where slashes, colons, and hashes must remain unencoded. Each mode explains its difference upfront so users understand when to use which. A special feature — **query-string table view** — parses URL query parameters (`?a=1&b=2`) into editable key/value rows and rebuilds the full query on edit. Batch mode processes multiple lines at once, and all results are copyable with success feedback. Recents (last 10 used inputs) live in localStorage for quick re-use.

The tool solves the friction of "Is my text encoded right?" and "What does `%20` mean?" with instant, transparent results and zero network calls.

A **charset selector** (UTF-8 default / EUC-KR) handles the recurring real-world need to work with legacy Korean URLs. Many older Korean sites and systems percent-encode non-ASCII characters as EUC-KR (CP949) bytes rather than UTF-8, so `%C7%D1%B1%DB` must decode to `한글`, not a malformed-sequence error. UTF-8 stays the default and native fast path; EUC-KR is opt-in and, for encoding, loaded on demand (see technology_stack) so it never taxes the default bundle.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime API calls. The only first-party persistence is localStorage (recents), and nothing is ever sent to the network. UTF-8 encoding/decoding is synchronous (native JS `encodeURIComponent`/`decodeURIComponent`/`encodeURI`/`decodeURI` and manual percent-sequence parsing). EUC-KR **decoding** uses the browser-native `TextDecoder('euc-kr')` (zero dependency); EUC-KR **encoding** uses a dynamically-imported CP949 forward table (code-split, loaded only when the user actually encodes to EUC-KR).

CRITICAL (error handling, robustness): Malformed percent sequences on decode (`URIError` from `decodeURIComponent`) never crash the app — a friendly error message explains what went wrong. Already-encoded input on encode triggers an optional warning (user can proceed or inspect first). Unicode (emoji, CJK, accents) round-trips cleanly. Empty input is a valid, no-op case. All edge cases are unit-tested ≥90% domain coverage.

CRITICAL (usability-first, SPA): Per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. All interaction — mode switching, direction toggle, table editing, batch on/off, copying — happens via local React state with NO route navigation and NO full page reload. Usability is paramount: paste text, choose mode/direction, see result instantly, copy, done.
</overview>

<platform_integration>
  - Route: /[locale]/tools/url-encoder (SSG; registry slug "url-encoder", id "url-encoder", status "live", accent "grape", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.url-encoder.*` (UI chrome strings: mode/direction/charset labels, batch toggle, error messages, how-to, FAQ — NOT encoded content; that is user-provided).
  - PLATFORM PREREQUISITE (CRITICAL): The `'dev'` category exists in `ToolCategory` type union but is NOT yet wired (no `categories.dev` i18n label in messages, not in `CATEGORY_ORDER`, not in `FOOTER_CATEGORIES`). Before adding this tool to live status, activate the `dev` category: (1) Add i18n entry `categories.dev: { ko: "개발", en: "Developer" }` to both locale message files. (2) Add `'dev'` to `CATEGORY_ORDER` array. (3) Add `'dev'` to `FOOTER_CATEGORIES` filter list. (4) Assign category accent color to `'dev'` (suggested: `'grape'` = `var(--accent-grape)` per this tool's accent). This is a one-time platform setup, shared by all future dev tools.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **Two encoding directions**: Encode (text → percent-encoded) and Decode (percent-encoded → text) with toggle button.
    - **Two modes with clear explanation**: (1) Component mode (`encodeURIComponent` / `decodeURIComponent`) for query params/fragments, (2) Full URI mode (`encodeURI` / `decodeURI`) for complete URLs — platform explains the difference (what stays unencoded in each).
    - **Charset selector (UTF-8 / EUC-KR)**: UTF-8 (default) uses native JS functions; EUC-KR (CP949) handles legacy Korean URLs. Decode uses native `TextDecoder('euc-kr')`; encode uses a dynamically-imported CP949 forward table (code-split). ASCII-only input is charset-agnostic (identical bytes). Selected charset persists per-session and applies to both encode and decode. Non-ASCII characters absent from CP949 (e.g., emoji) surface a friendly "cannot represent in EUC-KR" error on encode.
    - **Text input (single or batch)**: Single-line input field (paste URL or text); optional batch mode toggle to process multiple lines (newline-separated), each encoded/decoded independently with results stacked.
    - **Query-string table view**: Parse `?key1=val1&key2=val2` into interactive rows (key/value inputs); edit values in-place; "Rebuild URL" button re-serializes the table back to a query string. Handles `+` as space option.
    - **Plus-as-space toggle**: Checkbox option "Treat `+` as space" for legacy form-encoded inputs (application/x-www-form-urlencoded spec).
    - **Already-encoded detection**: Heuristic check (presence of `%xx` sequences) suggests user may be double-encoding; non-blocking warning UI lets user proceed.
    - **Copy to clipboard**: "Copy result" button (keyboard shortcut) → navigator.clipboard.writeText → hidden-textarea fallback → silent fail if unavailable (not a critical feature).
    - **Recent inputs**: Last 10 input strings stored in localStorage; "Recent" dropdown / list for quick reuse (auto-prune unknown/stale entries on load).
    - **Localized error messages and UI chrome** (ko/en via tools.url-encoder.*).
    - **Full keyboard support**: Tab through all inputs, Enter to encode/decode, "/" + "r" shortcuts, Esc to clear.
    - **Tool-specific SEO long-form** ("What is URL encoding?" / "When to use component vs full URI" / "UTF-8 vs EUC-KR for Korean URLs" / guide) + FAQ (FAQPage JSON-LD), localized ko/en.
    - **Reduced-motion fallbacks**; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Full URL parsing / validation suite (parsing domain, path, protocol validation is out-of-scope; this tool focuses on encoding).
    - Backend API (all encoding/decoding is client-side, 0-latency).
    - Filename / MIME-type encoding (tool is URL-specific).
    - Per-tool deep-link URLs with pre-filled input (MVP is single route + client state).
  </out_of_scope>
  <future_considerations>
    - Per-input deep-link state (e.g., `/tools/url-encoder?input=hello&mode=component&dir=encode`) — Phase 2.
    - Hex viewer for byte-level inspection of percent sequences — Phase 2.
    - Multi-URL diff (compare encodings across inputs) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <encoding_decoding>UTF-8: native JS `encodeURIComponent`, `decodeURIComponent`, `encodeURI`, `decodeURI` + manual percent-sequence validation/error handling.</encoding_decoding>
    <charset note="UTF-8 default + EUC-KR/CP949 legacy support, isolated behind a domain-layer codec interface so the concrete codec is swappable">
      - **Decode (both charsets, native)**: manually parse the input into a raw byte array (`%XX` → byte; plain ASCII → its code), then `new TextDecoder(charset).decode(bytes)`. `TextDecoder` supports both `'utf-8'` and `'euc-kr'` (CP949) natively in all evergreen browsers — ZERO dependency for EUC-KR decode. Invalid byte sequences → friendly error (TextDecoder in fatal mode or post-validation).
      - **Encode UTF-8**: native `encodeURIComponent`/`encodeURI` (unchanged fast path).
      - **Encode EUC-KR**: `TextEncoder` is UTF-8-only, so map each character to CP949 bytes via a **dynamically-imported** forward table (`await import('./charset/cp949-encode')`), then percent-escape the bytes using the same "which chars stay unencoded" ruleset as component vs full-URI mode (ASCII unreserved/reserved chars behave identically to UTF-8; only non-ASCII bytes differ). Characters not in CP949 → throw a typed `UnencodableCharError` caught by the UI.
      - **Code-split**: the CP949 table (tens of KB) is imported on demand only when the user encodes to EUC-KR, keeping the default UTF-8 path within the microsite JS budget (<80KB). Decode path needs no table (native TextDecoder).
      - **Domain interface**: `lib/url-encoder/charset.ts` exposes `bytesToText(bytes, charset)` and `textToBytes(text, charset): Promise<Uint8Array>` (async because EUC-KR encode lazy-loads the table); UTF-8 resolves synchronously/immediately.
    </charset>
    <validation>zod v3.x for input schema (max length, query-table structure). Single-source validation in domain layer (reusable in both generator and UI).</validation>
    <query_parser>Manual string split/join (`?key=val&key2=val2` → Array<{key, val}> → back to string). No external parser library; leverage built-in URL API if helpful (URLSearchParams) but keep parsing logic transparent for testing.</query_parser>
    <localStorage>jurepi-url-encoder key, zod-validated schema, auto-prune unknown entries on load, fail gracefully if unavailable (in-memory session fallback).</localStorage>
    <clipboard>navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail (secondary feature; copy always optional).</clipboard>
    <animation>Native CSS transitions only (input focus, button press, result fade). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; reused for input/query-table schema validation.</zod>
    <cp949_encode note="EUC-KR/CP949 forward (text→bytes) table for ENCODE only; dynamically imported">Candidates: a self-contained CP949 forward map (e.g. `cptable` from js-codepage, or a vendored minimal CP949 codec). Choose the smallest gzip footprint; wrap behind `charset.ts` so it is swappable. NOT needed for decode (native `TextDecoder('euc-kr')`). MUST be lazy-loaded via dynamic import, never in the tool's initial chunk.</cp949_encode>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/url-encoder/                          # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                             # zod: InputSchema (incl. charset), QueryTableSchema, StoreSchema + validation helpers
│   ├── encode.ts                             # encodeComponent(text, charset), encodeUri(text, charset) (async for euc-kr), handleAlreadyEncoded(text) heuristic
│   ├── decode.ts                             # decodeComponent(text, {plusAsSpace?, charset}), decodeUri(...), byte-array %xx parse → TextDecoder, error handling (malformed/invalid bytes → friendly msg)
│   ├── charset.ts                            # Codec interface: bytesToText(bytes, charset) [native TextDecoder], textToBytes(text, charset): Promise<Uint8Array> [utf-8 sync; euc-kr lazy-imports cp949 table], UnencodableCharError
│   ├── charset/
│   │   └── cp949-encode.ts                   # CP949 forward map (text→bytes) for EUC-KR ENCODE; dynamically imported only (never in initial chunk)
│   ├── query-parser.ts                       # parseQueryString(str), serializeQueryTable(rows), edit(rows, idx, key/val) immutable ops
│   ├── recents.ts                            # Immutable ops: pushRecent(list, text, max=10), pruneUnknown(list, validate), serialize/deserialize
│   └── unicode.ts                            # Round-trip test helpers (emoji, CJK, accents; UTF-8 + EUC-KR CJK) — used by unit tests
├── components/tools/url-encoder/
│   ├── UrlEncoder.tsx                        # Orchestrator (Client Component) — mode/direction/batch/table state + useUrlEncoder() owner
│   ├── useUrlEncoder.ts                      # Hook: localStorage recents + derived mode/direction logic; encode/decode dispatcher
│   ├── ModeToggle.tsx                        # Component / Full URI radio or tabs
│   ├── CharsetToggle.tsx                     # UTF-8 / EUC-KR selector (default UTF-8) + inline "legacy Korean URL" help
│   ├── DirectionToggle.tsx                   # Encode ⇄ Decode toggle button
│   ├── TextInput.tsx                         # Main input field (paste zone, can be multi-line in batch mode)
│   ├── ResultOutput.tsx                      # Display encoded/decoded result + copy button + success toast
│   ├── QueryTableView.tsx                    # Query-string parser UI (key/value rows, editable, rebuild button)
│   ├── BatchToggle.tsx                       # Enable/disable multi-line batch processing
│   ├── AlreadyEncodedWarning.tsx             # Friendly hint if input looks already-encoded (heuristic check)
│   ├── RecentsList.tsx                       # Dropdown / side panel of recent inputs (click to populate input)
│   ├── PlusAsSpaceToggle.tsx                 # Checkbox for legacy form-encoding
│   ├── UrlEncoderIntro.tsx                   # H1 + lead (SEO long-form intro)
│   ├── UrlEncoderHowTo.tsx                   # "What is URL encoding?" / "Component vs Full URI" / "UTF-8 vs EUC-KR (legacy Korean URLs)" (SEO long-form)
│   ├── UrlEncoderFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── error/
│       └── MalformedSequenceError.tsx        # Render friendly error on URIError (malformed %xx)
└── i18n/messages/{ko,en}.json                # tools.url-encoder.* UI chrome (mode/direction labels, batch, copy feedback, how-to, FAQ)
</file_structure>

<core_data_entities>
  <input_state note="single string or multi-line text">
    - text: string (the raw user input — URL text or plaintext)
    - batchMode: boolean (if true, split by newline, encode/decode each line, stack results)
    - direction: 'encode' | 'decode'
    - mode: 'component' | 'uri'
    - charset: 'utf-8' | 'euc-kr' (default 'utf-8'; applies to both encode and decode)
    - plusAsSpace: boolean (for legacy form-encoding on decode)
  </input_state>
  <query_table_row note="one parameter in a query string">
    - key: string (parameter name)
    - value: string (parameter value, may be empty)
    INVARIANT: key non-empty (or omitted), value any string (including empty). No null.
  </query_table_row>
  <encode_result note="output of encode operation">
    - result?: string (percent-encoded text)
    - alreadyEncodedHint: boolean (heuristic: presence of %xx suggests input may already be encoded)
    - error?: { message: string; details: string } | null (UTF-8 encode never throws; EUC-KR encode may fail with UnencodableCharError when a char has no CP949 mapping — e.g. emoji — reported here with the offending character)
  </encode_result>
  <decode_result note="output of decode operation">
    - result?: string (decoded text, if successful)
    - error?: { message: string; details: string } (friendly error if malformed %xx sequences or bytes invalid for the selected charset; from URIError / TextDecoder)
  </decode_result>
  <store_recents note="localStorage persistence">
    - version: number (STORE_VERSION, starts at 1)
    - recents: string[] (last 10 encoded/decoded inputs, insertion order, de-duplicated, pruned unknown on load)
    - meta: { createdAt: number }
    localStorage key: `jurepi-url-encoder`
    INVARIANT: reads are zod-parsed; fail → start fresh (no throw). Unknown/invalid entries pruned.
  </store_recents>
  <constants>
    - RECENTS_MAX = 10; INPUT_MAX_LEN = 10000 chars (domain validates); BATCH_MAX_LINES = 100.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/url-encoder" page="UrlEncoder (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <url_encoder>                    <!-- "use client"; owns direction/mode/batch/table state + useUrlEncoder() -->
    <url_encoder_intro />          <!-- H1 + lead (server-render where possible) -->
    <encoder_layout>               <!-- Main 2-column or stacked mobile layout -->
      <encoder_main>               <!-- Left/top column -->
        <mode_toggle />            <!-- Component / Full URI radio -->
        <charset_toggle />         <!-- UTF-8 / EUC-KR selector (default UTF-8) -->
        <direction_toggle />       <!-- Encode / Decode toggle -->
        <text_input />             <!-- Paste zone; may be multi-line if batch enabled -->
        <batch_toggle />           <!-- Enable multi-line mode -->
        <plus_as_space_toggle />   <!-- Legacy form-encoding option (decode only) -->
      </encoder_main>
      <encoder_result>             <!-- Right/bottom column, sticky on desktop -->
        <result_output />          <!-- Encoded/decoded result + copy button -->
        <already_encoded_warning/> <!-- If input looks double-encoded -->
      </encoder_result>
    </encoder_layout>
    <query_table_view />           <!-- Optional tab: parse &amp; edit query string (hidden until toggled) -->
    <recents_list />               <!-- Recent inputs panel (can be side-drawer or dropdown) -->
    <url_encoder_how_to />         <!-- SEO long-form explanation -->
    <url_encoder_faq />            <!-- FAQPage JSON-LD -->
  </url_encoder>
  <note>SPA within tool: all state changes (mode/direction/batch/table edits) are local React state, NO route navigation. Result panel and query-table stay in same view.</note>
</component_hierarchy>

<pages_and_interfaces>
  <url_encoder_intro>
    - Eyebrow: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "URL 인코더" / "URL Encoder" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "URL 텍스트를 인코딩·디코딩하고, 쿼리 매개변수를 편집하세요. 컴포넌트/전체 URI 모드와 UTF-8·EUC-KR 문자셋(레거시 한국어 URL)을 즉시 전환하세요." / English equivalent ("…switch between component/full-URI modes and UTF-8/EUC-KR charsets for legacy Korean URLs.").
  </url_encoder_intro>

  <text_input>
    - DESIGN text-input style, main column full width, placeholder "텍스트 또는 URL을 붙여넣으세요…" / "Paste URL or text here…".
    - Single line by default. Batch toggle expands to textarea (≥ 120px height, wrap).
    - Character counter (current / max 10000), warn at 80%.
    - aria: role="textbox", aria-label, aria-describedby for hints.
  </text_input>

  <mode_toggle>
    - Two options (radio or tabs): **Component** (encodeURIComponent / decodeURIComponent) — "쿼리 매개변수 &amp; 조각" / "Query params &amp; fragments" + help text ("&lt;, &gt;, &amp;, : / 인코딩됨" / encoded). **Full URI** (encodeURI / decodeURI) — "전체 URL" / "Full URL" + help text ("/, :, ? 유지" / reserved chars stay unencoded).
    - Inline help under each option explaining the difference.
    - Accent color grape (var(--accent-grape) / var(--accent-grape-soft)).
  </mode_toggle>

  <charset_toggle>
    - Two options (segmented control or select): **UTF-8** (default) and **EUC-KR** — labels "UTF-8" / "EUC-KR (CP949)".
    - Inline help: "레거시 한국어 URL(구형 사이트)은 EUC-KR을 선택하세요. 대부분의 최신 URL은 UTF-8입니다." / "Choose EUC-KR for legacy Korean URLs from older sites. Most modern URLs are UTF-8."
    - Applies to both encode and decode. Selecting EUC-KR for encode may lazy-load the CP949 table (brief, one-time); show no blocking spinner for typical short inputs.
    - Accent color grape; keyboard shortcut "u" toggles UTF-8 ⇄ EUC-KR.
  </charset_toggle>

  <direction_toggle>
    - Single toggle button: state Encode ⇄ Decode; label changes direction.
    - Icon: arrow-right-left (lucide).
    - Pressing Enter after text input = activate toggle (encode/decode immediately).
  </direction_toggle>

  <result_output>
    - Sticky or docked right column (desktop ≥1024px: width 360px, radius var(--radius-xxl), var(--surface) + shadow). Mobile: below input.
    - Display result in read-only monospace output block (var(--surface-muted), radius var(--radius-lg), padding 16px, line-break: break-all for long strings).
    - "Copy result" button (primary or secondary) → clipboard → success toast "✓ Copied" (1600ms) or silent fail.
    - Keyboard shortcut hint: "Ctrl+C / Cmd+C to copy".
  </result_output>

  <query_table_view>
    - Optional tab "Query String Editor" / "쿼리 문자열 편집기" — hidden by default, toggled via tab or link.
    - Parse input (if it starts with `?` or is a query string) into rows: [{ key: "foo", value: "bar" }, …].
    - Each row: key input + "=" + value input, side-by-side in a table row (or stacked on mobile).
    - Plus-as-space toggle affects both row display and serialization.
    - "Add row" button + delete-per-row buttons (trash icon).
    - "Rebuild URL" button → serialize rows back to `?key1=val1&key2=val2` + copy to clipboard.
    - Empty query table → "Enter parameters above or paste a query string to parse" hint.
  </query_table_view>

  <already_encoded_warning>
    - Heuristic: if input contains `%` followed by 2 hex digits, show optional warning card (info icon + text). "This text looks already encoded. Encoding again may double-encode. Proceed?" [Yes, encode anyway] [Cancel].
    - Non-blocking; user can dismiss or proceed. Stored in transient UI state (no localStorage).
  </already_encoded_warning>

  <keyboard_shortcuts>
    - "/" (when not typing) → focus text input.
    - "r" → toggle recent list (side-drawer / dropdown).
    - "e" → toggle Encode/Decode.
    - "c" → toggle Component/Full URI mode.
    - "u" → toggle UTF-8/EUC-KR charset.
    - "b" → toggle batch mode.
    - Enter (in input) → encode/decode (only if input non-empty).
    - Escape → clear input (if non-empty), else close recent drawer.
    - Tab → standard keyboard nav through all buttons/inputs.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <encode note="text → percent-encoded">
    - UTF-8 Component: `encodeURIComponent(text)` — everything except unreserved chars + reserved chars (/, :, ?, #, etc.) are encoded.
    - UTF-8 Full URI: `encodeURI(text)` — fewer chars encoded; slashes, colons, hashes stay, query/fragment chars encoded.
    - EUC-KR (either mode): lazy-load CP949 forward table → convert each char to CP949 bytes → percent-escape bytes with the same "which chars stay unencoded" ruleset as the chosen mode. ASCII chars are byte-identical to UTF-8; only non-ASCII differ. Char with no CP949 mapping (emoji, rare CJK) → `UnencodableCharError` → friendly error naming the character (no crash).
    - Already-encoded heuristic: check if input contains %xx pattern; suggest warning to avoid double-encoding.
    - UTF-8 never throws; EUC-KR only throws the caught UnencodableCharError. Validation happens upfront.
  </encode>
  <decode note="percent-encoded → text">
    - UTF-8 Component: `decodeURIComponent(text, plusAsSpace?)` — %xx → char; + → space if plusAsSpace enabled.
    - UTF-8 Full URI: `decodeURI(text, plusAsSpace?)` — %xx → char (same as component for most chars; difference minimal at this layer).
    - EUC-KR (either mode): parse `%xx` (and `+`→space if plusAsSpace) into a raw byte array, then `new TextDecoder('euc-kr').decode(bytes)` (native, zero dep) → readable text. e.g. `%C7%D1%B1%DB` → `한글`.
    - Malformed %xx (incomplete hex) or bytes invalid for the selected charset → catch URIError / TextDecoder failure → friendly error card with suggestion (e.g., "Malformed %xx near position 15; check: %6" + "Did you mean: %60?", or "These bytes aren't valid EUC-KR — is the URL actually UTF-8?").
    - Unicode / emoji round-trip tested ≥90% (test suite includes CJK, accents, emoji for UTF-8, plus Hangul round-trips for EUC-KR in encode/decode cycles).
  </decode>
  <query_parser note="immutable ops">
    - parseQueryString(str): scan for ? prefix, split by &, extract key=value pairs, handle empty keys/values.
    - serializeQueryTable(rows, plusAsSpace?): join rows as key1=val1&key2=val2, apply encoding based on direction.
    - editRow(rows, idx, newKey, newValue): return new array (immutable), no in-place mutation.
  </query_parser>
  <recents note="localStorage persistence">
    - pushRecent(list, text, max=10): add to front, de-duplicate (remove if already present), truncate to max.
    - pruneUnknown(list): filter to only valid/non-empty entries (on load, drop any corrupted entries).
    - Serialize: JSON.stringify with zod validation on load; fail gracefully (start fresh, no throw).
  </recents>
  <i18n>All UI chrome from tools.url-encoder.* (ko/en): mode/direction labels, button text, error messages, how-to, FAQ. Encoded text is user data, not i18n.</i18n>
</core_functionality>

<error_handling>
  <malformed_percent_sequences>Catch URIError on decode → extract error message + position hint → render MalformedSequenceError card with suggestion (e.g., "Invalid percent sequence %6 at position N"). Allow user to edit or clear input.</malformed_percent_sequences>
  <euckr_encode_unrepresentable>Encoding to EUC-KR a character absent from CP949 (emoji, rare CJK, non-Korean scripts) → typed UnencodableCharError → friendly card naming the offending character and suggesting UTF-8 instead. Never crashes; result stays empty.</euckr_encode_unrepresentable>
  <euckr_decode_invalid_bytes>Bytes that are not valid EUC-KR (e.g. UTF-8 bytes decoded as EUC-KR by mistake) → TextDecoder yields replacement chars or fatal error → friendly hint: "These bytes aren't valid EUC-KR — the URL may actually be UTF-8." User can switch charset and retry.</euckr_decode_invalid_bytes>
  <charset_table_load_failure>If the dynamic import of the CP949 encode table fails (offline first-load of that chunk, blocked) → friendly error "Couldn't load the EUC-KR encoder — check your connection and retry"; UTF-8 path and all decode paths remain fully functional (no table needed).</charset_table_load_failure>
  <empty_or_whitespace_input>Valid (no-op): encode/decode empty string → empty result, no error.</empty_or_whitespace_input>
  <input_too_long>Cap at 10000 chars; warn at 80%; prevent submit if over max (via form validation).</input_too_long>
  <already_encoded_heuristic>Warn but don't block; user can proceed or inspect first.</already_encoded_heuristic>
  <storage_unavailable>Private mode/disabled → recents in-memory (session-only), no error message (graceful degradation).</storage_unavailable>
  <copy_failure>clipboard.writeText fail → silent (secondary feature; never show false success toast).</copy_failure>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is GRAPE (var(--accent-grape) / var(--accent-grape-soft)) — "dev" category identity per this SPEC's accent suggestion. Mode toggle active state, "Rebuild" CTA, copy button success state.
    - Primary buttons (Encode/Decode toggle) use brand honey-gold var(--brand) for clear CTA.
  </accent_usage>
  <surfaces>Input/output fields = var(--surface) + 1px var(--hairline); output block var(--surface-muted); result card radius var(--radius-lg); layout cards radius var(--radius-xl). Soft brand-tinted shadows (--shadow-sm / --shadow-card), hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans clamp(28–40px)/700; mode/direction labels Pretendard 16px/600; input/output monospace (Fira Mono or system monospace) 14px/1.5; hints/errors body-sm 14px var(--text-secondary).</typography>
  <motion>transform/opacity: input focus lift (translateY -2px) 150ms, copy success pulse (scale 1→1.08→1) 200ms, error card fade-in (opacity 0→1) 150ms. All gated by prefers-reduced-motion (instant, no scale).</motion>
  <accessibility>All inputs have aria-label; buttons labeled (icon + tooltip); error messages aria-live="assertive"; focus-ring visible var(--focus-ring) 2px; ≥44px tap targets; monospace output allows screen-reader users to hear individual chars clearly.</accessibility>
  <responsive>
    - ≥1024px: 2-column layout (input left, result sticky right 360px).
    - 768–1023px: input full-width top, result below.
    - <768px: single column, textarea height ≥120px batch mode, recents side-drawer.
  </responsive>
  <atmosphere>Technical, clear, precise — every tool feels like a developer utility. No playfulness here; monospace output, clear explanations, flat design. Accent (grape) keeps it brand-warm.</atmosphere>
  <icons>lucide-react: Link (registry icon), ArrowRightLeft (direction toggle), Copy (copy result), Trash (delete query row), Plus (add query row), AlertCircle (error), Info (hint). Default 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>User-pasted URL/text is encoded/decoded locally; no parsing or HTML rendering. All output is text (no dangerouslySetInnerHTML). Monospace display prevents XSS through visual/formatting tricks.</input>
  <clipboard>User-initiated copy only (button or Ctrl+C); never read clipboard; no data sent to network.</clipboard>
  <localStorage>Recents are plaintext strings only (no sensitive data in inputs, tool assumes user input is data — not passwords). localStorage is local-device only, isolated per browser/profile.</localStorage>
  <network>Zero network calls (all encoding/decoding is JS native functions, synchronous).</network>
  <note>No secrets, no auth, no API calls, no server-side processing.</note>
</security_considerations>

<advanced_functionality>
  <charset_euckr>UTF-8 (default) + EUC-KR/CP949 for legacy Korean URLs. Decode is native (`TextDecoder('euc-kr')`, zero dep); encode lazy-loads a CP949 forward table (code-split, off the default bundle). ASCII is charset-agnostic; only non-ASCII bytes differ. Unrepresentable chars on EUC-KR encode → friendly error. Applies to single, batch, and query-table serialization alike.</charset_euckr>
  <batch_mode>Process multiple lines in one go: split input by newline, encode/decode each, stack results vertically (one result per line, matching input order).</batch_mode>
  <query_string_table>Parse `?a=1&b=2` into rows, edit in-place, rebuild. Handles edge cases (empty keys/values, special chars in values, already-encoded query strings with %-escape).</query_string_table>
  <plus_as_space>Legacy application/x-www-form-urlencoded spec treated `+` as space on decode. Checkbox toggle controls this per-session.</plus_as_space>
  <recents_persistence>Last 10 used inputs in localStorage; click to repopulate (quick re-use without re-typing).</recents_persistence>
  <unicode_round_trip>Emoji, CJK, accented chars tested end-to-end for UTF-8 (encode → decode → original, ≥90% domain coverage). EUC-KR: Hangul + CP949-covered CJK round-trip (`한글` ⇄ `%C7%D1%B1%DB`), plus unrepresentable-char (emoji → error) and cross-charset-mismatch cases.</unicode_round_trip>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Encode component mode with special chars and unicode</description>
    <steps>
      1. Input: `hello world &amp; 안녕 😊`
      2. Mode: Component, Direction: Encode
      3. Verify output: `hello%20world%20%26%20%EC%95%88%EB%85%95%20%F0%9F%98%8A` (each space/special/emoji → %xx).
      4. Copy result → toast "✓ Copied" appears 1600ms.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Decode with malformed %xx sequence error</description>
    <steps>
      1. Input: `hello%2Fworld%6` (incomplete hex at end)
      2. Direction: Decode, Mode: Component
      3. Verify error card: "Malformed percent sequence %6 at position X. Did you mean: %60?"
      4. User can edit input and retry, or clear.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Query-string table parse and rebuild</description>
    <steps>
      1. Input: `?name=Alice&amp;age=30&amp;city=Seoul` (or paste full URL with `?...`)
      2. Click "Query String Editor" tab.
      3. Table renders 3 rows: [name=Alice], [age=30], [city=Seoul].
      4. Edit name value to "Bob".
      5. Click "Rebuild URL" → result: `?name=Bob&amp;age=30&amp;city=Seoul`.
      6. Copy → clipboard has `?name=Bob&amp;age=30&amp;city=Seoul`.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Batch mode, multi-line processing</description>
    <steps>
      1. Enable batch toggle.
      2. Input: `hello world\nanother line\nthird` (3 lines).
      3. Mode: Component, Direction: Encode.
      4. Verify result (stacked): `hello%20world\nanother%20line\nthird` (each line encoded, newlines preserved).
      5. Copy → result has all 3 encoded lines.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Recents, localStorage persistence, already-encoded warning</description>
    <steps>
      1. Encode `test%20string` → warning "This text looks already encoded…" appears.
      2. Click [Yes, encode anyway] → result: `test%2520string` (note double %25).
      3. Close and reopen (reload page) → recents list shows `test%20string` as most recent.
      4. Click recent → input repopulates; click [No] on warning this time.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>Full URI mode vs component mode difference</description>
    <steps>
      1. Input: `https://example.com/path?a=1&amp;b=2#section`
      2. Mode: Full URI, Direction: Encode → output: input unchanged (/, :, ?, &amp;, # unencoded).
      3. Mode: Component, Direction: Encode → output: heavily encoded (/, :, ?, &amp;, # → %xx).
      4. Verify both modes side-by-side in UI explanation (help cards explain use case for each).
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>Internationalization, responsive, a11y, no overflow at 320px</description>
    <steps>
      1. Switch locale ko ↔ en → chrome (mode/direction labels, button text, help) switches language.
      2. View at 320px (mobile) → single column, textarea visible, recents as bottom drawer.
      3. axe scan → 0 violations; buttons aria-labeled; monospace output readable; focus ring visible.
      4. Keyboard nav: Tab through all inputs/buttons, Enter to encode, Esc to clear; "/" focuses input, "c" toggles mode.
    </steps>
  </test_scenario_7>
  <test_scenario_8>
    <description>EUC-KR (CP949) legacy Korean URL: decode, encode round-trip, and unrepresentable-char error</description>
    <steps>
      1. Charset: EUC-KR, Direction: Decode, Mode: Component. Input: `%C7%D1%B1%DB` → output `한글` (native TextDecoder, NOT a malformed error).
      2. Sanity: same input with Charset UTF-8 → friendly "not valid UTF-8 / try EUC-KR" hint (proves charset actually changes behavior).
      3. Charset: EUC-KR, Direction: Encode. Input `한글` → output `%C7%D1%B1%DB` (lazy-loads CP949 table on first use; brief, no blocking spinner). Round-trip matches step 1.
      4. Charset: EUC-KR, Direction: Encode. Input `😊` → friendly UnencodableCharError card naming the emoji + "switch to UTF-8" suggestion; result empty, no crash.
      5. ASCII-only input (`hello`) → identical result under both UTF-8 and EUC-KR (charset-agnostic for ASCII).
      6. Verify CP949 encode chunk is NOT in the tool's initial JS bundle (dynamic import; only fetched at step 3).
    </steps>
  </test_scenario_8>
</final_integration_test>

<success_criteria>
  <functionality>Encode + decode both directions; component + full URI modes with clear explanation; UTF-8 + EUC-KR charset (native decode, code-split encode); query-string table (parse/edit/rebuild); batch mode (multi-line); plus-as-space toggle; copy with toast; recents (localStorage).</functionality>
  <error_handling>Malformed %xx → friendly error card (no crash); EUC-KR unrepresentable char → typed error naming the char; EUC-KR invalid bytes → "maybe UTF-8?" hint; already-encoded heuristic warning (non-blocking); empty input valid (no-op); unicode round-trip ≥90% tested (UTF-8 + EUC-KR Hangul).</error_handling>
  <user_experience>Text pastes, mode/direction chosen, result instant, copy feedback clear, recents reduce re-typing friction. No route reloads, SPA feel (all interactions local state).</user_experience>
  <technical_quality>lib/url-encoder/* pure ≥90% unit coverage (encode/decode/query-parser/recents/charset); TS 0 errors; <800 lines per file; no external library for UTF-8 (native JS); EUC-KR decode native (TextDecoder); EUC-KR encode via one dynamically-imported CP949 table kept off the initial chunk.</technical_quality>
  <visual_design>DESIGN.md compliant; grape accent (dev category identity); monospace output for clarity; responsive 320/768/1024; reduced-motion respected; ≥44px touch targets.</visual_design>
  <accessibility>Full keyboard (Tab, Enter, Esc, "/", "c", "u", "e", "b"); aria-live errors; labeled inputs/buttons; visible focus-ring; monospace readable by screen readers; WCAG 2.1 AA.</accessibility>
  <performance>Tool route within platform budget; <2.5s LCP; CLS <0.1 (ad-slot height reserved); zero network latency for UTF-8 (all JS native); EUC-KR decode also zero-latency native; EUC-KR encode fetches its CP949 chunk once on first use (kept out of initial bundle to protect the microsite JS budget).</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). No prebuild hook needed (unlike new-word's markdown generator). /[locale]/tools/url-encoder pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry.
    {
      id: 'url-encoder',
      slug: 'url-encoder',
      category: 'dev',            // NEW CATEGORY — must be activated in platform (see platform_integration)
      icon: 'Link',               // lucide-react
      accent: 'grape',
      status: 'live',             // 'coming_soon' until module complete
      isNew: true,
      order: 20,                  // after text/game tools, tune as desired
      keywords: ['URL','인코딩','디코딩','encode','decode','%20','percent','query','parameter','쿼리','매개변수','EUC-KR','euckr','CP949','한글','UTF-8','charset','개발','developer','tool'],
    },
    ```
    Also add slug→component branch (&lt;UrlEncoder/&gt;) and generateMetadata branch (title/description/JSON-LD) in tool route alongside ladder/qna-a-day. **Before going live, activate `'dev'` category**: add i18n entry, CATEGORY_ORDER, FOOTER_CATEGORIES, accent mapping (see platform_integration).
  </platform_registry_change>
  <critical_paths>
    1. Encoding/decoding with accurate native JS `encodeURIComponent`/`decodeURIComponent`/`encodeURI`/`decodeURI` — entire tool depends on this. No approximations.
    2. Charset abstraction (`charset.ts`): decode via byte-array → `TextDecoder(charset)` (native, both UTF-8 + EUC-KR); encode UTF-8 native, EUC-KR via lazy-imported CP949 table. Async `textToBytes` for EUC-KR; keep the table OUT of the initial chunk (dynamic import verified in bundle analysis).
    3. Malformed %xx + charset error handling (URIError / TextDecoder / UnencodableCharError → friendly messages) — user-facing robustness.
    4. Query-string parsing (split &amp;, extract key=value) and serialization — must round-trip losslessly (under both charsets).
    5. localStorage recents (pruneUnknown, zod validation, fail-graceful) — persistence without crashes.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/url-encoder/{schema,encode,decode,query-parser,recents}.ts Vitest ≥90%: encodeComponent, encodeUri, decodeComponent (with error catch), decodeUri, malformed %xx → friendly error, query-string parse/serialize (edge cases: empty keys/values, special chars), recents ops (push/prune/round-trip). (UTF-8 first, charset param threaded through but defaulting to utf-8.)
    1b. lib/url-encoder/charset.ts + charset/cp949-encode.ts Vitest ≥90%: bytesToText (native TextDecoder, utf-8 + euc-kr), textToBytes (utf-8 sync; euc-kr lazy-imports table), `%C7%D1%B1%DB` ⇄ `한글` round-trip, UnencodableCharError on emoji, invalid-EUC-KR-bytes handling. Wire decode.ts/encode.ts to route non-UTF-8 through charset.ts.
    2. useUrlEncoder hook: localStorage favorites/recents + in-memory fallback + encode/decode dispatcher (async-aware for EUC-KR encode) + copy adapter.
    3. TextInput + ModeToggle + CharsetToggle + DirectionToggle + ResultOutput (basic flow: paste, toggle, see result, copy).
    4. QueryTableView (parse input → rows; edit row; rebuild). PlusAsSpaceToggle.
    5. BatchToggle + expand textarea. AlreadyEncodedWarning heuristic + MalformedSequenceError card.
    6. RecentsList (dropdown / side-drawer). Keyboard shortcuts ("/", "c", "u", "e", "b", "r").
    7. UrlEncoderIntro/HowTo/Faq + SoftwareApplication JSON-LD via platform lib/seo.ts.
    8. Registry entry status→live; slug→component + generateMetadata branches. E2E scenarios 1–7; visual regression 320/768/1024 both themes.
    9. Platform activation (i18n categories.dev, CATEGORY_ORDER, FOOTER_CATEGORIES).
  </recommended_implementation_order>
  <generator_sketch note="none — no build-time generation like new-word">
    No generator needed. Tool is pure client-side React. All logic is synchronous (native JS encode/decode).
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥90% (encode/decode all modes/directions/charsets, malformed %xx → URIError catch, EUC-KR round-trip `한글` ⇄ `%C7%D1%B1%DB`, EUC-KR unrepresentable-char + invalid-bytes cases, query-string parse/serialize edge cases, recents round-trip); component tests (mode/charset/direction toggle, query table edit, copy); E2E scenarios 1–8 (esp. #1 encode/decode, #2 error, #3 query-table, #4 batch, #5 recents+warning, #6 mode-difference, #7 i18n/responsive/a11y, #8 EUC-KR); verify CP949 encode chunk is dynamically imported (bundle analysis); clipboard/localStorage jsdom-isolated.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots, no overflow, charset toggle + query-table rows aligned, EUC-KR decode (`%C7%D1%B1%DB`→`한글`) and unrepresentable-char error verified live, error card prominent, monospace readable, JSON-LD present in prerendered HTML.</tool_usage>
</key_implementation_notes>

</project_specification>
```

SPEC written for `url-encoder` tool at `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/docs/services/dev/url-encoder/SPEC.md` — 336 lines.
