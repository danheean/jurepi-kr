# UUID Generator — Generate and Inspect UUIDs — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **UUID Generator** — a browser-based tool that generates UUIDs (v4 random, v7 time-ordered, and NIL) with zero dependencies and optional signature verification via RFC 9562 vector checks. Bulk generation (1–1000), format options (uppercase, no-hyphens, braces, quotes + comma for code paste), one-click copy per row, copy-all, download (.txt/.csv). UUID inspector: paste a UUID → detect version/variant, extract embedded timestamp for v7/v1. Pure domain layer with deterministic cryptographic RNG, no external crypto libraries (WebCrypto only where needed).
> Internal service codename: `uuid-generator`. Registry id: `uuid-generator`. Public URL slug: `/[locale]/tools/uuid-generator`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/json-formatter/SPEC.md`](./json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>UUID Generator — Generate and Inspect UUIDs (Jurepi tool, codename uuid-generator, registry id uuid-generator)</project_name>

<overview>
UUID Generator is a developer utility for generating and inspecting Universally Unique Identifiers (UUIDs) instantly, locally, and without a backend. The tool supports three core UUID types: **v4** (random, RFC 4122 compliant, crypto.getRandomValues source), **v7** (time-ordered, monotonically sortable, suitable for databases and distributed systems — RFC 9562 v7 specification with correct version/variant bit fields and pure-JavaScript implementation, no external deps), and **NIL** (all-zeros, 00000000-0000-0000-0000-000000000000). Users can generate single or bulk UUIDs (1–1000), customize output format (uppercase / lowercase, hyphenated / no-hyphens, with/without braces, comma-quoted for code paste), copy individual rows or the entire batch with one click, and download as plaintext (.txt) or CSV. An optional **UUID inspector** section lets users paste a UUID to detect its version/variant and (for v7) extract the embedded timestamp as human-readable local time.

CRITICAL (client-only, zero network): 100% client-side, no backend, no database, no external RNG. UUID generation uses only `crypto.getRandomValues` (WebCrypto, browser-native) for v4 randomness and pure JavaScript arithmetic for v7 timestamp-ordering and variant bit math. No external crypto libraries. All output stays in the browser; no logging, no analytics, no network calls except user-initiated downloads (direct Blob).

CRITICAL (SPA, usability-first): per the platform rule, the tool is a client-side SPA. All interaction — format toggle, bulk count, copy, download, UUID inspection — happens via local React state with no route navigation. The tool shell is statically generated (SSG) for SEO; the interactive generator is a single client component.

CRITICAL (determinism & fairness): v4 randomness is from crypto.getRandomValues only (never Math.random). v7 implementation is pure and deterministic with correct RFC 9562 version/variant bits verified by unit tests using golden vector validation (test vectors from RFC 9562 Appendix A and publicly available implementations confirm correctness).

CRITICAL (no external deps for UUID logic): Uuid v4, v7, and NIL are hand-written pure functions, no uuid lib, no crypto lib beyond WebCrypto. Justification: uuid npm pkg is heavy; this tool needs only RFC 9562 compliance for v7, which is learnable and deterministically testable.
</overview>

<platform_integration>
  - Route: /[locale]/tools/uuid-generator (SSG; registry slug "uuid-generator", id "uuid-generator", status "coming_soon", accent "mint", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.uuid-generator.*` (UI chrome strings: format labels, generator options, copy toast, download prompt, how-to, FAQ — NOT UUID data; that comes from the tool itself).
  - NOTE (updated 2026-07-04): the `'dev'` category is ALREADY live in the platform. No platform prerequisite remains; this tool only adds its own registry entry.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - UUID v4 generation (random, RFC 4122, crypto.getRandomValues source).
    - UUID v7 generation (time-ordered, RFC 9562, sortable for databases, with correct version 7 and variant bits).
    - NIL UUID generation (all-zeros, 00000000-0000-0000-0000-000000000000).
    - Single or bulk generation (1–1000 UUIDs per batch).
    - Format options: uppercase (Y/N), hyphenated (Y/N), braces (Y/N), comma-quoted for code paste (Y/N).
    - Copy buttons: copy a single row, copy all, copy to clipboard with one-click toast.
    - Download: save UUIDs as .txt (newline-delimited) or .csv.
    - UUID inspector: paste a UUID → validate format → detect version/variant → if v7 or v1, extract timestamp (Unix ms or seconds) and render as local datetime.
    - Input validation on inspect: reject malformed UUIDs (wrong length, invalid hex chars, missing hyphens if expected).
    - localStorage persistence: remember user's last format choices (uppercase, hyphenated, braces, quoted).
    - Tool-specific SEO long-form ("What is UUID?") + FAQ + SoftwareApplication JSON-LD, ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - UUID v1 or v5 or v6 (focus: v4 + v7 only; v1 micro/clock requires system clock, out of scope).
    - UUID namespace generation (v5 HMAC-SHA1, complex; future Phase 2).
    - Custom entropy sources (tool uses crypto.getRandomValues only).
    - Parsing / bulk batch inspection of many UUIDs at once.
    - UUID collision testing or statistical analysis.
  </out_of_scope>
  <future_considerations>
    - UUID v1/v5/v6 generation — Phase 2.
    - Bulk inspector (paste multiple UUIDs, get version/variant for each) — Phase 2.
    - UUID namespace/domain configurator for v5 — Phase 3.
    - Sortable UUID performance comparison chart — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <uuid_v4>crypto.getRandomValues(Uint8Array) → set version 4 and variant bits (RFC 4122) → format as UUID string (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y ∈ {8,9,a,b}).</uuid_v4>
    <uuid_v7>current timestamp (Date.now() in ms, pad to 48-bit Unix timestamp + 12-bit subsec precision) + crypto.getRandomValues for random bits (74-bit) + version 7 and variant bits (6-bit reserved). Sortable: time-first ordering within same millisecond. Pure arithmetic, no external lib.</uuid_v7>
    <uuid_nil>all zeros: 00000000-0000-0000-0000-000000000000.
    <format_options>String transformations: uppercase (toUpperCase), no-hyphens (remove -), braces (wrap in {}), comma-quoted ("uuid", or "uuid",).</format_options>
    <parsing_and_validation>Regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i (hyphenated 36 chars). Also accept no-hyphens variant (32 hex chars). Extract version (byte 7 hi 4 bits), variant (byte 9 hi 2-3 bits per RFC 4122).</parsing_and_validation>
    <uuid_inspect>detectVersion(uuidStr): return 1-7 or unknown. For v7: extract timestamp from first 48 bits → render as ISO + local datetime. For v1: similar (60-bit timestamp).</uuid_inspect>
    <copy>navigator.clipboard.writeText() with textarea fallback; silent fail on error (copy is secondary).</copy>
    <download>Blob (.txt newline-delimited or .csv) → URL → a[href] trick, synthetic click.
    <zod>zod v3.x for UI state schema (format options, bulk count, etc.).</zod>
  </module_specific>
  <libraries>
    <no_external_uuid_lib>Hand-written v4/v7/nil; RFC 9562 compliance verified by unit tests (golden vectors).</no_external_uuid_lib>
    <webcrypto>Crypto.getRandomValues for v4/v7 randomness; no external crypto deps.</webcrypto>
    <zod>zod v3.x for state validation.</zod>
  </libraries>
  <note>CRITICAL: NO external uuid npm pkg, NO crypto libs beyond WebCrypto.</note>
</technology_stack>

<file_structure>
src/
├── lib/uuid-generator/                    # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: FormatOptions, UuidVersion, InspectResult
│   ├── v4.ts                              # generateV4(rng?): string — RFC 4122 v4 (injected RNG for tests)
│   ├── v7.ts                              # generateV7(rng?, timestamp?): string — RFC 9562 v7 (injected RNG + optional timestamp override for tests)
│   ├── nil.ts                             # generateNil(): string — all-zeros UUID
│   ├── format.ts                          # formatUuid(uuid, options): string — apply uppercase/hyphens/braces/quotes
│   ├── parse.ts                           # parseUuid(uuidStr): {version, variant, error?} — detect version/variant
│   ├── inspect.ts                         # inspectUuid(uuidStr): {version, variant, timestamp?: Date, error?} — full analysis
│   ├── constants.ts                       # UUID structure: bit positions, variant field values (RFC 4122/9562)
│   └── errors.ts                          # Typed error codes: malformed_uuid / invalid_version / invalid_variant
├── components/tools/uuid-generator/
│   ├── UuidGenerator.tsx                  # Orchestrator (Client Component) — state owner
│   ├── useUuidGenerator.ts                # Hook: format options, bulk count, localStorage
│   ├── GeneratorOptions.tsx               # Format checkboxes (uppercase, hyphens, braces, quotes) + bulk count input
│   ├── UuidVersionSelector.tsx            # v4 / v7 / nil radio buttons (default v4)
│   ├── GeneratorButton.tsx                # [Generate] CTA button
│   ├── UuidList.tsx                       # Rendered UUID rows, each with copy button
│   ├── BulkActions.tsx                    # Copy All, Download .txt, Download .csv buttons
│   ├── UuidInspector.tsx                  # Input textarea + parse + version/variant + timestamp display
│   ├── UuidGeneratorIntro.tsx             # H1 + lead (SEO long-form)
│   ├── UuidGeneratorHowTo.tsx             # "What is UUID and why use v7?" (SEO)
│   ├── UuidGeneratorFaq.tsx               # FAQ + FAQPage JSON-LD
│   └── UuidGeneratorStructuredData.tsx    # SoftwareApplication JSON-LD (route renders; Faq does not emit FAQPage)
└── i18n/messages/{ko,en}.json             # tools.uuid-generator.* UI chrome
</file_structure>

<core_data_entities>
  <format_options>
    - uppercase: boolean — default false (lowercase)
    - hyphenated: boolean — default true (with hyphens)
    - braces: boolean — default false (no braces)
    - quoted: boolean — default false (no quotes)
    PERSISTENT: localStorage key `jurepi-uuid-generator` stores { uppercase, hyphenated, braces, quoted }.
  </format_options>
  <uuid_generation>
    - version: enum (v4, v7, nil) — default v4
    - count: number 1–1000 — default 1
    - output: string[] — array of formatted UUID strings
  </uuid_generation>
  <uuid_structure_v4>
    - 128 bits total
    - time_low (32-bit) random
    - time_mid (16-bit) random
    - time_hi_and_version (16-bit): high 4 bits = version (0100 for v4), low 12 bits random
    - clock_seq_hi_and_reserved (8-bit): high 2 bits = variant (10 for RFC 4122), low 6 bits random
    - clock_seq_low (8-bit) random
    - node (48-bit) random
  </uuid_structure_v4>
  <uuid_structure_v7>
    - 128 bits total
    - unix_ts_ms (48-bit): Unix timestamp in milliseconds (sortable)
    - subsec_a (4-bit): subsecond (high part)
    - version (4-bit): 0111 (v7)
    - subsec_b (8-bit): subsecond (low part)
    - variant (2-bit): 10 (RFC 4122 variant)
    - random (62-bit): random
    RFC 9562 compliant, sortable by time (then random within same millisecond).
  </uuid_structure_v7>
  <inspect_result>
    - version: enum (1–7) or unknown
    - variant: enum (RFC4122, Reserved, Microsoft, Future) or unknown
    - timestamp?: Date — extracted Unix time (for v1/v7)
    - error?: string — malformed or unsupported
  </inspect_result>
  <constants>
    - BULK_MAX = 1000 (prevent runaway generation)
    - NIL_UUID = "00000000-0000-0000-0000-000000000000"
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/uuid-generator" page="UuidGenerator (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <uuid_generator>                          <!-- "use client"; owns format options + version + count state + useUuidGenerator() -->
    <uuid_generator_intro />                <!-- H1 + lead (server-render where possible) -->
    <generator_container>                   <!-- Stacked or 2-split layout -->
      <generator_options />                 <!-- Format checkboxes + bulk count slider/input -->
      <uuid_version_selector />             <!-- v4 / v7 / nil radio (default v4) -->
      <generator_button />                  <!-- [Generate] button -->
      <uuid_list />                         <!-- Rendered rows with individual copy buttons -->
      <bulk_actions />                      <!-- Copy All, Download buttons -->
      <uuid_inspector />                    <!-- Optional: paste + inspect section (togglable) -->
    </generator_container>
    <uuid_generator_how_to />               <!-- SEO long-form -->
    <uuid_generator_faq />                  <!-- FAQPage JSON-LD -->
  </uuid_generator>
</component_hierarchy>

<pages_and_interfaces>
  <uuid_generator_intro>
    - Eyebrow: "개발자 도구" / "DEVELOPER TOOL" — 12px/700, var(--brand).
    - H1: "UUID 생성기" / "UUID Generator" — Gmarket Sans clamp(28px,5vw,40px)/700.
    - Lead: "데이터베이스부터 분산 시스템까지, UUID를 즉시 생성하고 검증하세요." / equivalent EN.
  </uuid_generator_intro>

  <generator_options>
    - Format checkboxes (4 toggles): Uppercase, Hyphens (default on), Braces, Quoted-comma.
    - Bulk count: slider or number input, 1–1000 (live preview "Generate 5 UUIDs").
    - Version selector: v4 (default) / v7 / nil radio buttons.
  </generator_options>

  <generator_button>
    - [Generate] button (brand var(--brand), mint accent for mint category identity).
    - On click: generate count UUIDs per version/format, render immediately.
  </generator_button>

  <uuid_list>
    - Monospace rows, each UUID with [Copy] button (icon + text).
    - On copy: success toast "복사됨!" / "Copied!"; clipboard receives formatted UUID.
    - Rows have truncate/overflow:auto if needed, but 320px guard ensures no overflow.
  </uuid_list>

  <bulk_actions>
    - [Copy All] button: copy all UUIDs as newline-delimited.
    - [Download .txt] button: save as plaintext (newline-delimited).
    - [Download .csv] button: save as CSV (no header, one UUID per line).
  </bulk_actions>

  <uuid_inspector>
    - Toggleable advanced section: [+] Inspector.
    - Textarea: paste a UUID (or UUID-like string).
    - [Analyze] button or auto-parse on paste.
    - Output: version (1–7 or unknown), variant (RFC4122/Microsoft/etc), timestamp (if v7/v1), human-readable datetime.
    - Error state: "Malformed UUID. Expected 36 hex chars with hyphens (8-4-4-4-12)."
  </uuid_inspector>

  <keyboard_shortcuts>
    - Ctrl+G → focus generator options, ready for bulk count change.
    - Ctrl+C → copy selected UUID or all (context-dependent).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <uuid_v4 note="random, RFC 4122">
    - generateV4(rng): rng(Uint8Array) → WebCrypto crypto.getRandomValues or injected RNG (tests).
    - Set version 4 bits (byte 7 hi nibble = 4).
    - Set variant bits (byte 9 hi 2 bits = 10 binary).
    - Format as string: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (y ∈ {8,9,a,b}).
    - Determinism: golden tests confirm exact output against known vector (if using fixed RNG seed).
  </uuid_v4>

  <uuid_v7 note="time-ordered, RFC 9562">
    - generateV7(rng, timestamp?): use current Date.now() or override for tests.
    - Encode Unix ms as 48-bit timestamp (first 6 bytes).
    - Add subsecond (12-bit) + version 7 (4-bit 0111) to bytes 7-8.
    - Set variant bits (byte 9 hi 2 bits = 10 binary).
    - Append 62-bit random (bytes 10-16, generated via rng).
    - Result: sortable by time, monotonic within same millisecond (if random increments).
    - Determinism: fixed timestamp + fixed RNG → identical output (unit tests verify against RFC 9562 Appendix A vectors).
  </uuid_v7>

  <uuid_nil>
    - Return constant: "00000000-0000-0000-0000-000000000000".
  </uuid_nil>

  <formatting>
    - formatUuid(uuid, {uppercase, hyphenated, braces, quoted}): apply transformations in order.
    - uppercase: .toUpperCase().
    - hyphenated: false → remove hyphens (uuid.replace(/-/g, '')).
    - braces: true → wrap with {}.
    - quoted: true → wrap with quotes, optionally add comma (for code paste: "uuid", or just "uuid").
  </formatting>

  <parsing_and_detection>
    - parseUuid(uuidStr): normalize (trim, lowercase), regex test for 36-char hyphenated OR 32-char no-hyphens.
    - Extract version (byte 7, hi nibble = bits 4–7).
    - Extract variant (byte 9, hi 2–3 bits): 10 → RFC 4122; 110 → Microsoft; 111 → Future.
    - Return {version: 1–7 | unknown, variant: RFC4122|Microsoft|Future|unknown, error?: string}.
  </parsing_and_detection>

  <inspect>
    - inspectUuid(uuidStr): parseUuid + extract timestamp if v1 or v7.
    - v7: first 48 bits = Unix ms → new Date(ms) → render as ISO + local.
    - v1: bytes 1–7 (100-nanosecond intervals since 1582-10-15) → extract and convert to Unix (note: complex, but educational).
    - Return {version, variant, timestamp?: Date, error?: string}.
  </inspect>

  <persistence>
    - Mount: read `jurepi-uuid-generator` from localStorage → zod parse → load format options; fail → start with defaults.
    - Change: debounced setItem after every option change (uppercase, hyphenated, braces, quoted).
  </persistence>

  <i18n>All UI chrome from tools.uuid-generator.* (ko/en): labels, format option names, button text, error messages, how-to, FAQ. UUID data is locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <malformed_uuid>
    - Input not 36 chars (hyphenated) or 32 chars (no-hyphens) → "Malformed UUID. Expected 36 hex characters with hyphens (8-4-4-4-12)."
    - Invalid hex chars → "Invalid UUID. Contains non-hexadecimal characters."
  </malformed_uuid>
  <unsupported_version>
    - v1/v5/v6 mentioned but not generated; if detected in inspector, honest message: "UUID version 1 detected. This tool generates v4 and v7 only."
  </unsupported_version>
  <input_validation>
    - Bulk count > 1000 → clamp to 1000, show warning toast "Max 1000 UUIDs per batch."
    - Count < 1 → disable [Generate] button or show validation error.
  </input_validation>
  <copy_failure>
    - Copy is secondary. clipboard API fail → silent (best-effort). Download is always available.
  </copy_failure>
  <storage>
    - localStorage unavailable (private mode) → prefs in-memory, no scary error. Tool fully functional.
  </storage>
  <note>No network calls; all errors are client-side (malformed input, validation).</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is MINT (var(--accent-mint) / var(--accent-mint-soft)) — "dev" category identity per DESIGN. Intro icon tile, [Generate] button, version selector radio active state.
    - CTAs (buttons) stay brand honey-gold var(--brand) (Copy/Download) except [Generate] which may use mint for category identity.
    - UUID list item background: surface-muted (light) with mint accent copy button.
  </accent_usage>
  <layout>Options panel (top), generator button, UUID list (main), inspector (optional collapsed section). Desktop ≥1024px: 2-col (options left, list right). Mobile <768px: stacked, list scrollable.</layout>
  <typography>H1 Gmarket Sans; UUID monospace (Menlo/Monaco/Courier New); UI labels/buttons Pretendard.</typography>
  <motion>transform/opacity only: inspector expand 200ms, copy toast slide-up 250ms, [Generate] button glow on hover (var(--brand) shadow, no scale). All gated by prefers-reduced-motion.</motion>
  <responsive>≥1024px: 2-col; 768–1023px: 2-col narrower; <768px: stacked. UUID rows scrollable x if needed, but no overflow at 320px (monospace scales down gracefully).</responsive>
  <atmosphere>Technical and friendly: monospace UUIDs, clear format options, instant copy feedback. No jargon; "v4 = random, v7 = sortable".</atmosphere>
</aesthetic_guidelines>

<security_considerations>
  <rng note="cryptographically strong">
    - v4 and v7 randomness is ONLY from crypto.getRandomValues (browser native, CSPRNG).
    - Never Math.random (weak).
    - Unit tests inject deterministic RNG for reproducibility; production uses crypto.getRandomValues.
  </rng>
  <privacy>No UUIDs, format options, or timestamps are persisted to server, sent to analytics, or logged remotely. Only localStorage for UI prefs (format choices).</privacy>
  <no_network>No API calls except user-initiated downloads (direct Blob). No telemetry.</no_network>
  <performance>UUID generation and formatting are O(1); copy/download use Blob (no fetch). Bulk 1000 UUIDs render instantly (list virtualization not needed for this volume).</performance>
  <note>No secrets, no network, no external deps beyond WebCrypto.</note>
</security_considerations>

<advanced_functionality>
  <uuid_v7_sorting>v7 UUIDs are sortable by creation time, enabling efficient database indexing and distributed ID generation without coordination.</uuid_v7_sorting>
  <bulk_generation>Generate 1–1000 UUIDs at once; format options apply to entire batch.</bulk_generation>
  <format_customization>5 independent toggles allow any combination (e.g., uppercase, no-hyphens, braces, quoted = {UUID}, perfect for code paste).</format_customization>
  <uuid_inspection>Paste any UUID to detect version/variant and extract timestamps for v1/v7.</uuid_inspection>
  <rfc_compliance>v4 and v7 implementations verified against RFC 4122 and RFC 9562 golden vectors.</rfc_compliance>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Generate v4 UUIDs, copy and download</description>
    <steps>
      1. Default options: v4, lowercase, hyphens, no braces, not quoted. Click [Generate] → 1 v4 UUID renders (e.g., "a1b2c3d4-e5f6-4a1b-c2d3-e4f5a6b7c8d9").
      2. Copy button → clipboard receives UUID, toast "복사됨!" / "Copied!"
      3. Change bulk count to 5, click [Generate] → 5 v4 UUIDs render.
      4. [Copy All] → clipboard has 5 UUIDs newline-delimited.
      5. [Download .txt] → browser saves "uuids.txt" with 5 UUIDs.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Generate v7 UUIDs, verify sortability</description>
    <steps>
      1. Select v7, generate 3 UUIDs → render (e.g., "0186...xxxx", "0186...yyyy", "0186...zzzz" all with same high 48 bits if within same millisecond).
      2. Manually generate 3 more after 1-2 second delay → observe higher timestamp bits (sortable property).
      3. Toggle uppercase → UUIDs shift to uppercase.
      4. Toggle no-hyphens → UUIDs render without hyphens (32 chars).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Generate NIL UUID, format options</description>
    <steps>
      1. Select nil, generate 1 → "00000000-0000-0000-0000-000000000000" renders.
      2. Toggle braces → "{00000000-0000-0000-0000-000000000000}".
      3. Toggle quoted-comma → "{\"00000000-0000-0000-0000-000000000000\",}".
      4. All transformations apply correctly.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>UUID inspector, detect version/variant</description>
    <steps>
      1. Expand [Inspector].
      2. Paste a known v4 UUID → [Analyze] → detected "Version 4 (random)" + "Variant: RFC 4122".
      3. Paste a v7 UUID → detected "Version 7 (time-ordered)" + timestamp extracted and rendered (e.g., "2026-07-06T14:30:45Z" + "Monday, Jul 6, 2026 at 2:30 PM UTC").
      4. Paste malformed string → error "Malformed UUID..."
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Accessibility, reduced-motion, i18n</description>
    <steps>
      1. Tab navigate to [Generate], Space/Enter triggers.
      2. Copy button has aria-label, focus-visible ring.
      3. prefers-reduced-motion ON → inspector expand instant (no slide), copy toast fade-only.
      4. Switch locale to /en → UI labels switch (UUID / UUIDs, Version, Variant, etc.).
      5. axe scan → no violations.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Generate v4, v7, nil; single or bulk (1–1000); format options (uppercase, hyphens, braces, quoted); copy per row or all; download .txt/.csv; inspect (version/variant detection, v7 timestamp extraction); localStorage prefs.</functionality>
  <user_experience>Generate instant (no lag); copy toast; download immediate; ≥44px targets; visible focus; SPA — no route reload; v7 sortability explained in how-to.</user_experience>
  <technical_quality>lib/uuid-generator/* pure ≥80% unit coverage (v4, v7, nil, format, parse, inspect); TS 0 errors; <800 lines per file; golden vector tests (RFC 9562 Appendix A, external references).</technical_quality>
  <visual_design>DESIGN.md compliant; mint accent identity; monospace UUIDs (readable); clear format toggles; no jargon.</visual_design>
  <accessibility>Full keyboard (Tab, Space); roving focus; aria-labels; reduce-motion: no slide/glow; WCAG 2.1 AA contrast; prerendered SEO/FAQ.</accessibility>
  <performance>Tool route within platform budget; instant UUID generation (<1ms for 1000); copy/download no fetch; LCP < 2.5s.</performance>
  <security>Randomness from crypto.getRandomValues only (CSPRNG). No network. No logging. Format options and UUIDs never persisted to server.</security>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/uuid-generator pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry
    {
      id: 'uuid-generator',
      slug: 'uuid-generator',
      category: 'dev',
      icon: 'Shuffle',            // or 'Dices' / 'Hash' — lucide-react (mint theme)
      accent: 'mint',
      status: 'coming_soon',
      addedAt: '2026-07-10',
      order: 35,                  // demand-based, after jwt-decoder (30)
      keywords: ['UUID','생성','v4','v7','생성기','identifiers','generator','random','sortable','database','unique','distributed'],
    },
    // No platform prerequisite: 'dev' category is already fully wired.
    ```
  </platform_registry_change>
  <critical_paths>
    1. UUID v4 generation (crypto.getRandomValues, version/variant bit math).
    2. UUID v7 generation (timestamp encoding, subsecond precision, version/variant bits, RFC 9562 compliance).
    3. Format transformations (uppercase, hyphens, braces, quotes).
    4. UUID parsing and version detection (regex, bit extraction).
    5. v7/v1 timestamp extraction and rendering (Intl.DateTimeFormat for human-readable time).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/uuid-generator/{v4, v7, nil, format, parse, inspect, schema, constants, errors}.ts (Vitest ≥80%, golden vector tests).
    2. tools.uuid-generator.* messages (ko/en): labels, format option names, button text, error messages, how-to, FAQ.
    3. GeneratorOptions + UuidVersionSelector (checkboxes/radios, localStorage load/save).
    4. GeneratorButton + UuidList (render UUIDs with copy buttons).
    5. BulkActions (Copy All, Download .txt/.csv).
    6. UuidInspector (paste, parse, render version/variant/timestamp).
    7. useUuidGenerator hook (state management, localStorage).
    8. UuidGenerator orchestrator + keyboard shortcuts.
    9. Intro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    10. Registry status→live; slug→component + generateMetadata branches.
    11. Keyboard/reduce-motion/a11y pass; axe scan.
    12. E2E 1–5 scenarios; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>
    - Unit (Vitest ≥80%): v4/v7/nil generation (injected RNG for determinism, golden vectors), format (uppercase/hyphens/braces/quotes combo), parse (valid/malformed UUIDs, version detection), inspect (v7 timestamp extraction), copy fallback, download blob.
    - Component: GeneratorOptions state, UuidVersionSelector toggle, UuidList render + copy, BulkActions, UuidInspector parse + display.
    - E2E (Playwright): scenarios 1–5 (generate, format, download, inspect, keyboard/reduce-motion/i18n).
    - Visual regression: 320/768/1024 both themes, bulk 100 UUIDs (scrollable), inspector expanded/collapsed.
    - A11y: axe + keyboard (Tab, Space) + reduce-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
