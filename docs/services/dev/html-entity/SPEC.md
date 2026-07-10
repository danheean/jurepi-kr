# HTML Entity Encoder / Decoder — Character escape and named entity reference tool — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **HTML Entity Encoder** (HTML 엔티티 변환기) — a client-side tool that encodes plaintext characters into HTML entity references (named entities like `&copy;`, numeric decimals like `&#169;`, numeric hexadecimals like `&#xA9;`) and decodes the reverse. The tool supports three encode modes: (1) special-only (default, encode &, <, >, ", '), (2) named entities (use &copy;, &nbsp;, etc. where available), (3) all non-ASCII (numeric escape every character above U+007F). Decode tolerates malformed entities and round-trips cleanly. Reference panel displays searchable common entities with one-click copy and SSR'd static table for SEO. All processing is pure domain logic, client-side, 100% localStorage-persisted prefs, SPA on the platform shell.
> Internal service codename: `html-entity`. Registry id: `html-entity`. Public URL slug: `/[locale]/tools/html-entity`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/url-encoder/SPEC.md`](../url-encoder/SPEC.md)

```xml
<project_specification>

<project_name>HTML Entity Encoder / Decoder — Bidirectional HTML entity and character escape conversion (Jurepi tool, codename html-entity, registry id html-entity)</project_name>

<overview>
HTML Entity Encoder solves the everyday friction of converting characters to HTML entity references and back. A developer copies plaintext with special chars (e.g. "Pricing & Terms") and needs it safe for HTML attributes or body text — this tool encodes it to "Pricing &amp; Terms" or "Pricing &#38; Terms" depending on the encode mode. Decode works the reverse: paste "Pricing &amp; Terms" and see "Pricing & Terms" immediately.

Three encode modes serve different use cases: (1) **special-only** (default) encodes only the five HTML-unsafe chars (&, <, >, ", ') so plain ASCII text is left untouched, (2) **named entities** uses named references (&copy;, &nbsp;, &hellip;, etc.) where one exists in the WHATWG entity list, falling back to numeric for chars without names, (3) **all non-ASCII** escapes every character above U+007F, useful for embedding data in systems that don't handle UTF-8 well.

Numeric style option lets users choose decimal (`&#169;`) or hexadecimal (`&#xA9;`) format. Decode is tolerant: malformed entities (missing semicolon, invalid name, broken numeric) are left as-is, never throwing an error.

The tool includes a searchable **reference table** of ~50 common entities (©, &, <, >, ", ', non-breaking space, ellipsis, em-dash, etc.) with character, named form, decimal, hex, and description columns. Each row is one-click copyable. The top 30 common entities are SSR'd in the long-form SEO section as a static table for AI crawlers and search engines.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no network calls. The entity map (WHATWG ~2200 named entities) is loaded on-demand as a JSON chunk, not in the initial bundle. Decode never needs the map (only to display reference names, which is optional). All encode/decode is pure JS string manipulation and regex.

CRITICAL (error handling, robustness): Malformed entities on decode (missing semicolon, invalid hex, unknown name) are silently left as-is — no throw, no crash, friendly UX. Emoji and Unicode round-trip cleanly (UTF-16 surrogate pairs handled correctly). Empty input is valid (no-op).

CRITICAL (usability-first, SPA): Every Jurepi tool is a client-side Single-Page Application mounted on the SSG shell. All interaction — mode switching, direction toggle, numeric style select, copying — happens via local React state with NO route navigation, NO full page reload. Paste plaintext, choose mode, see result instantly, copy, done.
</overview>

<platform_integration>
  - Route: /[locale]/tools/html-entity (SSG; registry slug "html-entity", id "html-entity", status "coming_soon", accent "coral", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.html-entity.*` (UI chrome strings: mode labels, direction labels, numeric-style labels, button text, error messages, how-to, FAQ — NOT example entities; those live in code-rendered domain/component data, never in messages to avoid i18n parse hazards with raw `<` characters).
  - The `'dev'` category is now LIVE and fully wired. No category activation prerequisite.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **Two encoding directions**: Encode (plaintext → entity references) and Decode (entity references → plaintext) with toggle button.
    - **Three encode modes** with inline help: (1) **Special-only** (default) — encode only &, <, >, ", ', (2) **Named entities** — use &copy;, &nbsp;, &hellip; etc. where available (WHATWG list), fall back to numeric, (3) **All non-ASCII** — numeric escape every character > U+007F (ASCII stays plain).
    - **Numeric style selector**: Decimal (`&#169;`) or hexadecimal (`&#xA9;`) format; applies only when numeric entities are output (modes 2 and 3).
    - **Direction toggle** (Encode ⇄ Decode).
    - **Text input** (single line; paste zone) + optional batch mode (multi-line, each line encoded/decoded independently, results stacked).
    - **Copy to clipboard**: "Copy result" button + keyboard shortcut → clipboard → hidden-textarea fallback → silent fail if unavailable.
    - **Reference table panel**: Searchable ~50–80 common entities (©, &, <, >, ", ', &nbsp;, &hellip;, etc.) with character, named, decimal, hex, description columns, one-click copy per row. Reference table is also SSR'd in the SEO long-form section as a static `<table>` for crawlers and AI.
    - **Recents**: Last 10 encoded/decoded text snippets in localStorage, quick-reuse dropdown.
    - **Localized error messages and UI chrome** (ko/en via tools.html-entity.*).
    - **Full keyboard support**: Tab, Enter to encode/decode, "/" + "r" shortcuts, Esc to clear.
    - **Tool-specific SEO long-form** ("What are HTML entities?" / "When to use named vs numeric" / "Special chars in attributes vs body text" / guide) + FAQ (FAQPage JSON-LD), localized ko/en, includes static reference table.
    - **Reduced-motion fallbacks**, WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - HTML/XML parsing or validation (tool is entity-only, not a full sanitizer or validator).
    - Per-entity deep-link state (e.g., `/tools/html-entity?input=hello&mode=named`) — Phase 2.
    - Non-HTML entity standards (XML entities, SGML legacy) — scope is WHATWG HTML5 only.
    - Graphical entity picker or visual character browser — Phase 2.
  </out_of_scope>
  <future_considerations>
    - Deep-link state in URL query params (e.g., input, mode, direction) — Phase 2.
    - Visual entity browser / picker mode (grid of ~2200 entities, filterable by name/code/category) — Phase 2 or Phase 3.
    - Sidebar palette of most-used entities (frequency-tracked in localStorage).
    - Batch import from file (JSON/CSV of { plaintext, encode-mode } rows) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <entity_map note="WHATWG HTML5 named entities, ~2200 entries, lazy-loaded, not in initial bundle">
      - **Source**: WHATWG entities.json (CC0 / public domain). The full list is ~50KB JSON. **Decision**: Code-split as lazy-loaded chunk: `content/entities/entities.generated.json` or import-time generated map from a canonical CSV/JSON source.
      - **Generation**: Optional build-time script (`scripts/generate-html-entities.mjs`) that validates the entity list, maps entity names to (char, decimal, hex), sorts by frequency for common ones first.
      - **Decode**: Does NOT need the map (can strip `&` + name/number + `;` purely syntactically). Decode works offline.
      - **Encode (named mode)**: Lazy-loads the map only if user selects named mode. UTF-8 uses direct string includes; all entires fit in-memory once.
    </entity_map>
    <encode_decode>
      - **Encode special-only**: Hardcoded set {&, <, >, ", '} → `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;` (no lazy load needed).
      - **Encode named**: User-supplied text → check each char against entity map → if a named entity exists, emit it; otherwise numeric (decimal or hex per numeric-style setting).
      - **Encode all non-ASCII**: Iterate text, emit ASCII as-is, emit chars > U+007F as numeric (decimal or hex). Handles UTF-16 surrogates correctly (emoji like 😊 = U+1F60A → two UTF-16 units, but `String.codePointAt` + `String.fromCodePoint` manage this transparently).
      - **Decode**: Parse input for entity patterns (`&[a-zA-Z0-9]+;` for named, `&#[0-9]+;` for decimal, `&#x[0-9a-fA-F]+;` for hex). Substitute known named entities; validate and decode numeric. Unknown entities stay as-is (no error). Malformed (missing `;`, incomplete hex) → left as-is.
      - **Round-trip**: Encode plaintext → decode result = original (invariant tested with UTF-8, surrogates, all special chars).
      - All logic is pure domain layer, fully unit-tested, ≥90% coverage.
    </encode_decode>
    <validation>zod v3.x for input schema (max length). Single-source validation in domain layer.</validation>
    <localStorage>jurepi-html-entity key, zod-validated schema, versioned, auto-prune on load, fail gracefully (session-only fallback).</localStorage>
    <clipboard>navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail (secondary feature, always optional).</clipboard>
    <animation>Native CSS transitions only (focus, button press, fade-in/out). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; reused for input schema and store validation.</zod>
    <entity_map>Vendored WHATWG entities.json (~50KB JSON) as a lazy-loaded chunk; or a curated subset (~10–15KB) of most common entities (©, ®, ™, &, <, >, ", ', spaces, dashes, arrows, quotes, math symbols). The minimal subset covers 80% of real-world use; full list is available as optional Phase 2 upgrade.</entity_map>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/html-entity/                          # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                             # zod: InputSchema, EncodeMode enum, NumericStyle enum, StoreSchema + validation helpers
│   ├── entity-map.ts                         # Load lazy-loaded entity map (promise-based, await dynamic import); fallback minimal in-code map
│   ├── encode.ts                             # encodeSpecialOnly(text), encodeNamed(text, entityMap, numericStyle), encodeAllNonAscii(text, numericStyle)
│   ├── decode.ts                             # decodeEntities(text) — parse &name;, &#123;, &#xAB; patterns, substitute known, leave malformed as-is
│   ├── entities/
│   │   └── common-entities.ts                # Hardcoded ~30–50 most common entities for special-only mode (©, &, <, >, etc.) — no load required
│   ├── recents.ts                            # Immutable ops: pushRecent(list, text, max=10), pruneUnknown(list), serialize/deserialize
│   └── unicode.ts                            # UTF-16 surrogate pair handling tests (emoji, CJK, accents round-trip)
├── components/tools/html-entity/
│   ├── HtmlEntity.tsx                        # Orchestrator (Client Component) — mode/direction/batch/numericStyle state + useHtmlEntity() owner
│   ├── useHtmlEntity.ts                      # Hook: localStorage prefs + entity-map lazy loading + encode/decode dispatcher
│   ├── ModeToggle.tsx                        # Three options: Special-only (default), Named, All non-ASCII — radio or tabs + inline help
│   ├── DirectionToggle.tsx                   # Encode ⇄ Decode toggle button
│   ├── NumericStyleToggle.tsx                # Decimal (&#169;) / Hex (&#xA9;) selector (only shown in named/all-non-ascii modes)
│   ├── TextInput.tsx                         # Paste zone, single-line or batch textarea
│   ├── ResultOutput.tsx                      # Display result + copy button + success toast
│   ├── BatchToggle.tsx                       # Enable multi-line mode
│   ├── ReferenceTable.tsx                    # Searchable ~50 common entities table (char, named, decimal, hex, description) + one-click copy rows
│   ├── RecentsList.tsx                       # Recent inputs dropdown/side-panel
│   ├── HtmlEntityIntro.tsx                   # H1 + lead (SEO long-form intro)
│   ├── HtmlEntityHowTo.tsx                   # "What are HTML entities?" / "When to use special-only vs named vs all-non-ASCII" / guide + SSR'd static reference table
│   ├── HtmlEntityFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── error/
│       └── EntityDecodeNotice.tsx            # Informational card if decode finds unknown entity (not an error, just a note)
└── i18n/messages/{ko,en}.json                # tools.html-entity.* UI chrome (no raw < characters in message values; use code-rendered strings)
</file_structure>

<core_data_entities>
  <input_state>
    - text: string (plaintext or entity-encoded text)
    - direction: 'encode' | 'decode'
    - encodeMode: 'special-only' | 'named' | 'all-non-ascii'
    - numericStyle: 'decimal' | 'hex' (only applies when numeric entities are output)
    - batchMode: boolean (if true, split by newline, encode/decode each line independently)
  </input_state>
  <entity_reference>
    - name: string (e.g. "copy" for &copy;)
    - char: string (e.g. "©")
    - decimal: number (e.g. 169)
    - hex: string (e.g. "A9")
    - description: string (e.g. "Copyright sign")
  </entity_reference>
  <encode_result>
    - result?: string (encoded text)
    - error?: { message: string; details?: string } (rare; only if entity-map load fails)
  </encode_result>
  <decode_result>
    - result?: string (decoded text; malformed entities left as-is, no error)
    - unknownEntitiesFound?: string[] (list of unknown named entities encountered, informational only)
  </decode_result>
  <store_recents note="localStorage persistence">
    - version: number (starts at 1)
    - recents: string[] (last 10, insertion order, de-duplicated)
    - prefs: { numericStyle: 'decimal' | 'hex'; encodeMode: 'special-only' | 'named' | 'all-non-ascii' }
    - meta: { createdAt: number }
    localStorage key: `jurepi-html-entity`
  </store_recents>
  <constants>
    - RECENTS_MAX = 10
    - INPUT_MAX_LEN = 10000 chars
    - BATCH_MAX_LINES = 100
    - SPECIAL_CHARS_ONLY = {&, <, >, ", '} hardcoded
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/html-entity" page="HtmlEntity (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <html_entity>                        <!-- "use client"; owns direction/mode/numericStyle/batch state + useHtmlEntity() -->
    <html_entity_intro />              <!-- H1 + lead (server-render where possible) -->
    <entity_layout>                    <!-- Main 2-column or stacked mobile layout -->
      <entity_main>                    <!-- Left/top column -->
        <mode_toggle />                <!-- Special-only / Named / All non-ASCII radio -->
        <direction_toggle />           <!-- Encode / Decode toggle -->
        <numeric_style_toggle />       <!-- Decimal / Hex selector (shown when numeric output possible) -->
        <text_input />                 <!-- Paste zone; may be multi-line if batch enabled -->
        <batch_toggle />               <!-- Enable multi-line mode -->
      </entity_main>
      <entity_result>                  <!-- Right/bottom column, sticky on desktop -->
        <result_output />              <!-- Encoded/decoded result + copy button -->
      </entity_result>
    </entity_layout>
    <reference_table />                <!-- Searchable common entities (optional collapsible) -->
    <recents_list />                   <!-- Recent inputs panel -->
    <html_entity_how_to />             <!-- SEO long-form with static reference table -->
    <html_entity_faq />                <!-- FAQPage JSON-LD -->
  </html_entity>
  <note>SPA within tool: all state changes (mode/direction/batch/style) are local React state, NO route navigation. Result panel stays in view.</note>
</component_hierarchy>

<pages_and_interfaces>
  <html_entity_intro>
    - Eyebrow: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px letter-spacing, var(--brand).
    - H1: "HTML 엔티티 변환기" / "HTML Entity Encoder/Decoder" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "HTML 특수 문자와 엔티티 참조를 양방향 변환하세요. 텍스트를 인코딩해 HTML 속성에 안전하게 매장하거나, 엔티티를 디코딩해 원본 텍스트로 복원하세요." / English equivalent.
  </html_entity_intro>

  <text_input>
    - DESIGN text-input style, full width, placeholder "HTML 엔티티 또는 일반 텍스트를 붙여넣으세요…" / "Paste HTML entities or plaintext here…"
    - Single line by default. Batch toggle expands to textarea (≥120px height, wrap).
    - Character counter (current / max 10000), warn at 80%.
    - aria: role="textbox", aria-label, aria-describedby.
  </text_input>

  <mode_toggle>
    - Three options (radio or tabs): 
      **Special-only** (default) — "특수 문자만" / "Special chars only" (&, <, >, ", ') + help text ("가장 일반적인 용도, 일반 텍스트 유지" / "Most common; plain ASCII stays plain").
      **Named entities** — "이름 있는 엔티티" / "Named entities" (&copy;, &nbsp;, etc.) + help text ("&copy;·&nbsp;·&hellip; 등 이름이 있으면 사용, 없으면 숫자" / "Use named (&copy;, &nbsp;, etc.) where available, fall back to numeric").
      **All non-ASCII** — "모든 비ASCII" / "All non-ASCII" (숫자로 이스케이프 U+007F 이상) + help text ("UTF-8을 지원하지 않는 시스템용" / "For systems that don't handle UTF-8").
    - Inline help under each option.
    - Accent color coral (var(--accent-coral) / var(--accent-coral-soft)).
  </mode_toggle>

  <numeric_style_toggle>
    - Two options (segmented control or select): **Decimal** (&#169;) and **Hex** (&#xA9;).
    - Only visible when numeric entities are possible output (named mode or all non-ASCII mode).
    - Inline help: "10진수 또는 16진수 형식" / "Decimal or hexadecimal format".
    - Accent color coral.
  </numeric_style_toggle>

  <direction_toggle>
    - Single toggle button: state Encode ⇄ Decode; label changes direction.
    - Icon: arrow-right-left (lucide).
    - Pressing Enter after text input = activate toggle (encode/decode immediately).
  </direction_toggle>

  <result_output>
    - Sticky or docked right column (desktop ≥1024px: width 360px, radius var(--radius-xxl), var(--surface) + shadow). Mobile: below input.
    - Display result in read-only monospace output block (var(--surface-muted), radius var(--radius-lg), padding 16px, line-break: break-all).
    - "Copy result" button (primary or secondary) → clipboard → success toast "✓ Copied" (1600ms) or silent fail.
    - Keyboard shortcut hint: "Ctrl+C / Cmd+C to copy".
  </result_output>

  <reference_table>
    - Collapsible or always-visible reference panel: searchable ~50 common entities.
    - Columns: Character (visual) | Named (&copy;) | Decimal (&#169;) | Hex (&#xA9;) | Description.
    - Search input (filter by name, char, or description).
    - Each row has a "Copy" button (or entire row is click-to-copy) → clipboard → success toast.
    - Example rows: © (&copy;), & (&amp;), < (&lt;), > (&gt;), " (&quot;), ' (&#39;), non-breaking space (&nbsp;), ellipsis (&hellip;), em-dash (&mdash;), etc.
  </reference_table>

  <keyboard_shortcuts>
    - "/" (when not typing) → focus text input.
    - "r" → toggle recents list.
    - "e" → toggle Encode/Decode.
    - "m" → cycle encode mode (special-only → named → all-non-ascii → special-only).
    - "n" → toggle numeric style (decimal ⇄ hex, if applicable).
    - "b" → toggle batch mode.
    - Enter (in input) → encode/decode.
    - Escape → clear input (if non-empty), else close recents.
    - Tab → standard keyboard nav.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <encode note="plaintext → entity references">
    - Special-only: hardcoded {&→&amp;, <→&lt;, >→&gt;, "→&quot;, '→&#39;}. All other chars pass through unchanged.
    - Named: check each char; if a named entity exists, emit it (e.g. © → &copy;); otherwise emit numeric (decimal or hex per numericStyle setting).
    - All non-ASCII: iterate text; emit ASCII 0–127 as-is; emit chars > U+007F as numeric. Handles UTF-16 surrogates (emoji, CJK) via `String.codePointAt` / `String.fromCodePoint`.
    - UTF-8 never throws. Validation upfront.
  </encode>
  <decode note="entity references → plaintext">
    - Parse input for patterns: `&[a-zA-Z0-9]+;` (named), `&#[0-9]+;` (decimal), `&#x[0-9a-fA-F]+;` (hex).
    - Known named entities → substitute; unknown → leave as-is (informational list, no error).
    - Valid numeric → decode; invalid (out of range, etc.) → leave as-is.
    - Malformed (missing `;`, incomplete hex, etc.) → left as-is (no error).
    - Unicode round-trip tested (emoji, CJK, accents).
  </decode>
  <reference_panel>
    - Searchable grid/table of ~50 common entities, indexed by name/char/description.
    - Each row one-click copyable to clipboard (success toast).
  </reference_panel>
  <recents note="localStorage persistence">
    - pushRecent(list, text, max=10): add to front, de-duplicate, truncate.
    - pruneUnknown(list): filter on load (graceful for corruption).
  </recents>
  <i18n>
    All UI chrome from tools.html-entity.* (ko/en): mode labels, direction labels, numeric-style labels, button text, error/info messages, how-to, FAQ.
    **CRITICAL**: Do NOT put raw `<`, `&`, or other HTML special chars in message catalog values. Example entity names/chars belong in code-rendered domain data or component-rendered literals, never in i18n messages (ICU parse hazard).
  </i18n>
</core_functionality>

<error_handling>
  <entity_map_load_failure>If the dynamic import of the entity map fails (offline, blocked) → graceful degradation: special-only mode remains fully functional; named/all-non-ascii modes show friendly error "Couldn't load entity reference — try special-only mode or check your connection". UTF-8 path and decode are always available.</entity_map_load_failure>
  <malformed_entity_on_decode>Incomplete hex (e.g., `&#x6`), missing semicolon (e.g., `&copy`), unknown named entity (e.g., `&fakename;`) → left as-is in output; no error shown (informational list of unknowns is optional). This is graceful, predictable UX.</malformed_entity_on_decode>
  <empty_or_whitespace_input>Valid (no-op): encode/decode empty string → empty result, no error.</empty_or_whitespace_input>
  <input_too_long>Cap at 10000 chars; warn at 80%; prevent submit if over max (form validation).</input_too_long>
  <storage_unavailable>Private mode → recents in-memory (session-only), no error message (graceful degradation).</storage_unavailable>
  <copy_failure>clipboard.writeText fail → silent (secondary feature; never show false success toast).</copy_failure>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is CORAL (var(--accent-coral) / var(--accent-coral-soft)) — "dev" category identity per this SPEC's accent choice. Mode toggle active state, numeric-style CTA, copy button success state.
    - Primary buttons (Encode/Decode toggle) use brand honey-gold var(--brand) for clear CTA.
  </accent_usage>
  <surfaces>Input/output fields = var(--surface) + 1px var(--hairline); output block var(--surface-muted); result card radius var(--radius-lg); layout cards radius var(--radius-xl). Soft brand-tinted shadows (--shadow-sm / --shadow-card).</surfaces>
  <typography>H1 Gmarket Sans clamp(28–40px)/700; mode/direction labels Pretendard 16px/600; input/output monospace (Fira Mono or system monospace) 14px/1.5; hints body-sm 14px var(--text-secondary).</typography>
  <motion>transform/opacity: input focus lift (translateY -2px) 150ms, copy success pulse (scale 1→1.08→1) 200ms, error fade-in (opacity 0→1) 150ms. All gated by prefers-reduced-motion (instant, no scale).</motion>
  <accessibility>All inputs have aria-label; buttons labeled (icon + tooltip); info/error messages aria-live="polite"; focus-ring visible var(--focus-ring) 2px; ≥44px tap targets; monospace output for clarity.</accessibility>
  <responsive>
    - ≥1024px: 2-column layout (input left, result sticky right 360px).
    - 768–1023px: input full-width top, result below.
    - <768px: single column, textarea height ≥120px in batch mode, recents side-drawer.
  </responsive>
  <atmosphere>Technical, clear, precise — developer utility. Monospace output, precise explanations, flat design. Accent (coral) keeps it brand-warm and distinct from url-encoder (grape).</atmosphere>
  <icons>lucide-react: Link (registry icon), ArrowRightLeft (direction toggle), Copy (copy result), Search (reference table filter), Info (hint). Default 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>User-pasted plaintext or entities are processed locally; no HTML parsing or rendering. All output is text (no dangerouslySetInnerHTML). Monospace display prevents XSS through formatting tricks.</input>
  <entity_decode>Decode never executes the entities — it only substitutes known names/numerics with their character values. No eval, no script injection vector.</entity_decode>
  <clipboard>User-initiated copy only (button or Ctrl+C); never read clipboard; no data sent to network.</clipboard>
  <entity_map>Loaded from bundled content (generated at build-time from WHATWG canonical source). No dynamic fetch from external URL; integrity guaranteed by build hash.</entity_map>
  <localStorage>Recents are plaintext strings only (tool assumes user input is data, not sensitive). localStorage is local-device only, isolated per browser/profile.</localStorage>
  <network>Zero network calls (all encode/decode is JS, synchronous or from bundled data).</network>
  <note>No secrets, no auth, no API calls, no server-side processing.</note>
</security_considerations>

<advanced_functionality>
  <three_encode_modes>Special-only (default, fast, minimal noise) + named (readable references) + all-non-ascii (legacy system compatibility).</three_encode_modes>
  <numeric_style>Decimal (&#169;) vs hex (&#xA9;) format; global setting applies to named and all-non-ascii modes.</numeric_style>
  <batch_mode>Multi-line input: split by newline, encode/decode each line independently, stack results vertically (order preserved).</batch_mode>
  <reference_table>~50 common entities (©, &, <, >, ", ', spaces, dashes, quotes, etc.), searchable by name/char/description, one-click copy. SSR'd static table in SEO long-form section for crawlers.</reference_table>
  <recents_persistence>Last 10 used input snippets (after encode or decode) stored in localStorage; click to repopulate (quick re-use without re-typing).</recents_persistence>
  <unicode_round_trip>Emoji, CJK, accented chars tested end-to-end (encode → decode → original). Special-only mode with emoji: encode to all-non-ascii to escape emoji; decode losslessly.</unicode_round_trip>
  <malformed_tolerance>Decode silently tolerates unknown entities, incomplete hex, missing semicolons — leaves them as-is. No error thrown, friendly UX (optional info list).</malformed_tolerance>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Encode special-only with mixed plaintext and special chars</description>
    <steps>
      1. Input: `Hello & goodbye`
      2. Mode: Special-only, Direction: Encode
      3. Verify output: `Hello &amp; goodbye` (& → &amp;, rest unchanged).
      4. Copy result → toast "✓ Copied".
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Encode named mode with symbols that have entity names</description>
    <steps>
      1. Input: `© 2026 & Co.`
      2. Mode: Named, Direction: Encode, Numeric style: Decimal
      3. Verify output: `&copy; 2026 &amp; Co.` (©→&copy;, &→&amp;, rest plain).
      4. Copy and verify.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Decode mixed named and numeric entities</description>
    <steps>
      1. Input: `&copy; 2026 &#38; Co. &#x26; Ltd.`
      2. Mode: N/A (decoding), Direction: Decode
      3. Verify output: `© 2026 & Co. & Ltd.` (both & forms decoded, named form decoded).
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Decode malformed entity — left as-is, no error</description>
    <steps>
      1. Input: `Hello &copy (missing semicolon) and &#x6 (incomplete hex)`
      2. Direction: Decode
      3. Verify output: `Hello &copy and &#x6` (malformed left untouched, no crash).
      4. Info card (optional): "Found 2 unknown or malformed entities" (non-blocking).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Reference table search and copy</description>
    <steps>
      1. Click on reference table (or toggle).
      2. Search for "copyright" → row &copy; visible.
      3. Click "Copy" button → clipboard contains "©".
      4. Toast "✓ Copied".
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>Batch mode: encode multiple lines</description>
    <steps>
      1. Enable batch toggle.
      2. Input (3 lines):
         ```
         Hello & World
         Copyright © 2026
         <tag> & "quoted"
         ```
      3. Mode: Special-only, Direction: Encode
      4. Verify output (3 lines, each encoded):
         ```
         Hello &amp; World
         Copyright © 2026
         &lt;tag&gt; &amp; &quot;quoted&quot;
         ```
    </steps>
  </test_scenario_6>
</final_integration_test>

<success_criteria>
  - [x] Encode/decode functions are pure, testable domain logic with ≥90% coverage.
  - [x] All three encode modes work correctly (special-only, named, all-non-ascii).
  - [x] Decode is tolerant (malformed entities left as-is, no error).
  - [x] Entity map loads on-demand only (not in initial bundle).
  - [x] Batch mode processes multiple lines correctly.
  - [x] Reference table is searchable and one-click copyable.
  - [x] Recents persist across sessions (localStorage).
  - [x] SPA state management is local (no route navigation).
  - [x] Keyboard shortcuts work (/, r, e, m, n, b, Enter, Escape, Tab).
  - [x] WCAG 2.1 AA: focus ring, aria labels, ≥44px tap targets, prefers-reduced-motion respected.
  - [x] Responsive design: 2-column desktop, stacked mobile, textarea batch mode.
  - [x] SEO long-form (Intro/HowTo/FAQ) includes static reference table (SSR'd, no mounted gate).
  - [x] FAQPage JSON-LD emitted by `<HtmlEntityFaq>` component (single owner, no route duplication).
  - [x] SoftwareApplication + BreadcrumbList JSON-LD via route StructuredData (url == canonical).
  - [x] llms.txt entry + sitemap auto-entry (single-page tool).
  - [x] SNS share buttons wired automatically by route template.
  - [x] i18n: tools.html-entity.* namespace with ko/en, NO raw HTML special chars in message values.
  - [x] Accent color (coral) used consistently; only real tokens from DESIGN.md.
  - [x] Error boundary wraps tool; no unhandled rejections.
  - [x] E2E tests cover all 6 scenarios above + edge cases (empty input, malformed UTF-16, storage unavailable).
  - [x] Production build: bundle size within budget (<80KB JS gzipped for text/converter category).
</success_criteria>

<build_output>
Registry entry:
```js
{
  id: 'html-entity',
  slug: 'html-entity',
  category: 'dev',
  icon: 'Link', // or a dedicated icon
  accent: 'coral',
  status: 'coming_soon', // → 'live' after first deployment
  addedAt: 'YYYY-MM-DD', // fill in implementation date
  order: 8, // position in dev tools list
  keywords: ['html', 'entity', 'encode', 'decode', 'special chars', '엔티티'],
}
```

File structure committed to `/src/`:
- `lib/html-entity/` — domain layer (6–8 files, ≥200 lines, unit tests)
- `components/tools/html-entity/` — UI layer (9–12 components, ≥150 lines, integration tests)
- `i18n/messages/{ko,en}.json` — updated with `tools.html-entity.*` namespace (ko/en)

Generated content (if applicable):
- `content/entities/entities.generated.json` — curated or full WHATWG entity map (~50KB JSON, optional code-split)
- `scripts/generate-html-entities.mjs` — optional build-time generator (validates, maps, sorts)

Test artifacts:
- Domain unit tests: `lib/html-entity/*.test.ts` (5–7 files, ≥400 lines total, ≥90% coverage)
- Component tests: `components/tools/html-entity/*.test.tsx` (3–5 files, ≥250 lines total)
- E2E tests: `tests/e2e/html-entity.spec.ts` (≥10 scenarios, core workflows)
</build_output>

<key_implementation_notes>
  - **Registry entry**: id `html-entity`, slug `html-entity`, category `dev`, accent `coral`, status `coming_soon`, order step (e.g., 8, distinct from other dev tools). Add `addedAt: 'YYYY-MM-DD'` (required for NEW badge derivation).
  - **Entity map loading**: Special-only mode hardcodes {&, <, >, ", '} — no load needed. Named mode lazy-loads entity map only on first user selection. All decode paths work without the map (optional reference display).
  - **Domain-first approach**: Encode/decode functions are pure, testable, exported for reuse (e.g., in SEO components, other tools). Domain layer is ≥90% coverage.
  - **SEO long-form**: Intro (H1 + lead) + HowTo (static reference table SSR'd inside, explains special-only vs named vs all-non-ascii with real examples) + FAQ (5–7 Q&A pairs, example entities rendered in UI, not in message catalog). All three sections rendered OUTSIDE the tool component's `mounted` gate so AI crawlers see them.
  - **i18n critical**: tools.html-entity.* namespace (ko/en). Mode labels, direction labels, numeric-style labels, button text, error/info messages, HowTo, FAQ. **DO NOT put raw `<`, `&`, `"`, `'` in message values** — causes ICU parse errors. Example HTML: `<h1>`, `<tag>`, etc., must be rendered by components or domain code, never in .json.
  - **Accessibility**: Full keyboard support (/, r, e, m, n, b shortcuts), aria labels on all inputs, focus ring visible, ≥44px tap targets, monospace output, prefers-reduced-motion respected (instant transitions).
  - **Testing strategy**: TDD workflow → write domain tests first (RED) → implement (GREEN) → component tests (RTL, input/output behavior) → E2E (6 scenarios above). All paths tested with UTF-8, emojis, CJK, surrogates. Batch mode tested with 1–50 lines. Decode malformed tested (missing ;, incomplete hex, unknown names).
  - **Recommended implementation order**: (1) Domain layer (encode/decode, entity-map loading). (2) UI orchestrator & input/output components. (3) Reference table & recents. (4) SEO sections (Intro/HowTo/Faq). (5) i18n sync (ko/en). (6) E2E tests & polish.
</key_implementation_notes>

</project_specification>
```
