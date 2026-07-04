# Base64 Encoder/Decoder — Text & File Conversion — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Base64 Encoder/Decoder** (Base64 인코딩/디코딩) — a browser-based utility to safely convert text and files to/from Base64 with UTF-8 integrity, supporting both standard and URL-safe variants, plus file upload/download and live data-URI generation. Content manager's reference: all UI chrome strings live under i18n namespace `tools.base64-encoder.*`. Visual design tokens: [`docs/DESIGN.md`](../../../DESIGN.md).
> Internal service codename: `base64-encoder`. Registry id: `base64-encoder`. Public URL slug: `/[locale]/tools/base64-encoder`.
>
> This SPEC covers the **tool itself**. The shared shell, tool registry, SEO infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC: [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Base64 Encoder/Decoder — Text & File Conversion (Jurepi tool, codename base64-encoder, registry id base64-encoder)</project_name>

<overview>
Base64 Encoder/Decoder brings essential encoding tasks to one place — users paste text, upload files, or receive Base64 blobs, then instantly convert between plaintext ↔ Base64 with full UTF-8 safety (no breaking on emoji or non-Latin1 characters). The tool offers both **standard** (A-Za-z0-9+/) and **URL-safe** (A-Za-z0-9-_) variants, file-to-Base64 import (drag-drop or file picker, client-side FileReader, up to 5MB), and Base64-to-downloadable-file export with MIME type inference. Live conversion updates as users type; copy buttons (data-URI or raw Base64) use the platform clipboard API. Pure domain: encode/decode functions with strict UTF-8 round-trip tests. All interaction is local — no backend, no network, just React state and browser APIs.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no network file transfer. The only persistence is localStorage (last mode used: text/file, last variant: standard/url-safe), and nothing is ever sent over the network. Base64 is NOT encryption — the tool's copy/help text clearly discloses this.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application mounted on the SSG shell. All interaction — switching text ↔ file mode, selecting standard/URL-safe, copying, downloading — happens via local React state with NO route navigation and NO full page reload. Usability comes first: encoding/decoding is one keystroke, result is copyable or downloadable, error messages are friendly.
</overview>

<platform_integration>
  - Route: /[locale]/tools/base64-encoder (SSG; registry slug "base64-encoder", id "base64-encoder", status "live", accent "coral", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder.
  - Consumes: i18n namespace `tools.base64-encoder.*` (UI chrome: mode toggle, variant toggle, file input label, copy buttons, error messages, FAQ).
  - Platform dependency (SATISFIED): the `'dev'` category is already fully wired and live (i18n label `categories.dev` = ko "개발 도구" / en equivalent, present in `CATEGORY_ORDER` and `FOOTER_CATEGORIES`; sibling live dev tools: url-encoder, bookmarks, dev-people). No category setup work remains — only the registry entry, route branch, and i18n namespace for this tool. Accent `coral` is free among dev tools (currently only ladder uses coral).
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Text-to-Base64 and Base64-to-text bidirectional conversion with CRITICAL UTF-8 safety (use TextEncoder/TextDecoder, never raw `btoa`/`atob`).
    - Standard Base64 (RFC 4648, A-Za-z0-9+/) and URL-safe variant (RFC 4648 §5, A-Za-z0-9-_, no padding).
    - File upload (drag-drop or file input picker) → Base64 string; limit 5MB with user-friendly overflow message.
    - Base64 → downloadable file: infer MIME type from data-URI prefix or let user choose.
    - Data-URI generation (data:text/plain;base64,...) for copy or preview.
    - Live conversion: text/file input updates output in real time; debounced if >10KB.
    - Copy to clipboard (data-URI or Base64 string); fallback to textarea selection if API unavailable.
    - Input validation: detect invalid Base64 on decode (non-base64 chars, wrong padding) with friendly error.
    - Whitespace/newlines in input: strip or normalize before encode/decode.
    - Empty input handling: clear result, show hint.
    - localStorage persistence: last used mode (text/file), last variant (standard/url-safe).
    - Tool-specific SEO long-form ("What is Base64?") + FAQ (FAQPage JSON-LD) + SoftwareApplication JSON-LD, localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Encryption / decryption (Base64 is encoding, not encryption — tool and copy make this clear).
    - Backend encoding/decoding or file storage.
    - Batch file processing (one file at a time).
    - Custom Base64 alphabets or variants beyond RFC 4648.
    - Live preview (e.g., image preview for image files) — text/summary only.
    - Browser extension or standalone app.
  </out_of_scope>
  <future_considerations>
    - Compression + encoding (gzip → Base64) — Phase 2.
    - Hex / Binary / URL encoding shortcuts — Phase 2.
    - Batch encode/decode via drag-drop folder — Phase 2.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <encoding>TextEncoder (UTF-8 to bytes), base64-js or native btoa workaround (safe for Unicode). URL-safe variant: replace +→-, /→_.</encoding>
    <decoding>atob for Base64 → ASCII, TextDecoder (UTF-8 bytes to string). Validation: regex /^[A-Za-z0-9+/]*={0,2}$/ (standard) or /^[A-Za-z0-9\-_]*={0,2}$/ (URL-safe).</decoding>
    <file_handling>FileReader.readAsArrayBuffer → base64-js encode or native Blob.arrayBuffer().then(btoa equiv).</file_handling>
    <clipboard>navigator.clipboard.writeText → fallback textarea.select() execCommand('copy') → silent if both fail (copy is secondary).</clipboard>
    <validation>zod for UI state schema (mode, variant, fileSize, isValidBase64).</validation>
    <animation>Native CSS transitions only (fade, no transforms). prefers-reduced-motion honored.</animation>
  </module_specific>
  <libraries>
    <base64-js>base64-js v1.5+ — safe Unicode base64 encode/decode (devDependency for build, optional at runtime).</base64-js>
    <zod>zod v3.x — already in repo; state schema validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/base64-encoder/
│   ├── schema.ts                      # zod: UiState, EncodeResult, DecodeResult, FileInfo
│   ├── encoder.ts                     # safeDecode, safeEncode (UTF-8 safe; no framework deps)
│   ├── base64.ts                      # urlSafeEncode, urlSafeDecode, isValidBase64
│   └── mime.ts                        # guessMimeType(filename, base64Prefix)
├── components/tools/base64-encoder/
│   ├── Base64Encoder.tsx              # Orchestrator (Client Component) — mode/variant/input state + useBase64() owner
│   ├── useBase64.ts                   # Hook: state management + localStorage + copy adapter
│   ├── ModeToggle.tsx                 # Text / File radio segment
│   ├── VariantToggle.tsx              # Standard / URL-safe radio segment
│   ├── DirectionToggle.tsx            # Encode / Decode radio segment
│   ├── TextInput.tsx                  # Textarea for plaintext input
│   ├── FileInput.tsx                  # Drag-drop + file picker, size validation
│   ├── OutputDisplay.tsx              # Result textarea (read-only), copy button, download button
│   ├── Base64EncoderIntro.tsx         # H1 + lead (SEO; server-render; tool-prefixed name per repo convention)
│   ├── Base64EncoderHowTo.tsx         # "What is Base64?" (SEO long-form)
│   ├── Base64EncoderFaq.tsx           # Q&A + FAQPage JSON-LD (single owner of FAQPage)
│   ├── Base64EncoderStructuredData.tsx # SoftwareApplication JSON-LD only (route renders; NEVER FAQPage here)
│   └── data/
│       └── (no generated artifacts)
└── i18n/messages/{ko,en}.json         # tools.base64-encoder.* (mode/variant labels, buttons, errors, FAQ)
</file_structure>

<core_data_entities>
  <ui_state>
    - mode: enum (text, file) — default "text"
    - variant: enum (standard, urlSafe) — default "standard"
    - inputText: string — plaintext or Base64 to decode
    - inputFile?: File — selected file to encode
    - outputText: string — encoded/decoded result or error
    - isEncoding: boolean — which direction (true=text→Base64, false=Base64→text)
    - isValidInput: boolean — input validates (non-empty, valid Base64 if decoding)
    - error?: string — friendly error message (null = success)
    INVARIANT: mode=text → inputText present; mode=file → inputFile present; outputText syncs with input.
  </ui_state>
  <encode_result>
    - base64: string (RFC 4648 standard or URL-safe per variant)
    - dataUri: string (data:text/plain;base64,… or inferred MIME)
    - sizeBytes: number (original byte length)
  </encode_result>
  <decode_result>
    - plaintext: string (UTF-8 decoded)
    - sizeBytes: number
  </decode_result>
  <constants>
    - FILE_SIZE_LIMIT_MB = 5
    - DEBOUNCE_MS = 200ms (for input >10KB)
    - TOAST_MS = 1600ms
  </constants>
  <defaults>
    - New user: mode="text", variant="standard", no input
    - localStorage key: `jurepi-base64-encoder` { mode, variant }
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/base64-encoder" page="Base64Encoder (SPA tool route)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <base64_encoder>                    <!-- "use client"; owns mode/variant/input state + useBase64() -->
    <base64_intro />                  <!-- H1 + lead (server-render where possible) -->
    <encoder_layout>                  <!-- Single-column flex container -->
      <mode_toggle />                 <!-- Text ↔ File radio -->
      <variant_toggle />              <!-- Standard ↔ URL-Safe radio -->
      <text_input />                  <!-- Mode=text: plaintext/Base64 textarea -->
      <file_input />                  <!-- Mode=file: drag-drop file area -->
      <direction_toggle />             <!-- Encode ↔ Decode toggle -->
      <output_display />              <!-- Result textarea + copy / download buttons -->
    </encoder_layout>
    <base64_how_to />                 <!-- "What is Base64?" (SEO; server-render) -->
    <base64_faq />                    <!-- Q&A + FAQPage JSON-LD -->
  </base64_encoder>
  <note>SPA within tool: mode/variant/direction switch = local state, NOT route navigation.</note>
  <note>Repo convention: the [slug] route renders StructuredData + Intro + (ErrorBoundary+Suspense around the SPA orchestrator) + HowTo + Faq + ShareButtons as siblings — SEO sections live OUTSIDE any mounted gate and are owned by the route branch, mirroring url-encoder.</note>
</component_hierarchy>

<pages_and_interfaces>
  <base64_intro>
    - Eyebrow: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px tracking, var(--brand).
    - H1: "Base64 인코더 / 디코더" / "Base64 Encoder/Decoder" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: "텍스트와 파일을 Base64로 변환하고, Base64를 원본으로 복원하세요. UTF-8 안전하고 표준/URL-safe 모드 지원." / English equivalent. 18px var(--text-secondary).
  </base64_intro>

  <mode_toggle>
    - Segment [Text] [File]; style category-pill / category-pill-active (brand honey-gold when active).
    - Switching disables/clears the opposite input.
  </mode_toggle>

  <variant_toggle>
    - Segment [Standard] [URL-Safe]; similar styling. Help text: "표준(+/) vs URL-safe(-_)".
  </variant_toggle>

  <text_input>
    - Textarea, full width, rows=6, var(--surface) + 1px var(--hairline), radius var(--radius-lg) 16px, padding 16px.
    - Placeholder: "텍스트 또는 Base64를 붙여넣으세요 / Paste text or Base64 here".
    - Live onChange debounced (>10KB → 200ms).
    - Encode if plaintext detected, else decode if valid Base64.
  </text_input>

  <file_input>
    - Drag-drop zone: 120px min-height, dashed 2px var(--brand-soft) border, radius var(--radius-lg), center align.
    - Icon (lucide File or FileUp), label "파일을 드래그하거나 클릭해 선택 / Drag files or click to browse".
    - Hidden file input type="file"; accept="*".
    - Size validation: ≤5MB; >5MB → error toast "파일이 5MB를 초과합니다."
    - Feedback: "파일 선택됨: filename.ext (123 KB)" on success.
  </file_input>

  <direction_toggle>
    - Segment [Encode →] [← Decode] (if ambiguous, show toggle; else auto-detect).
    - Updates output in real time.
  </direction_toggle>

  <output_display>
    - Textarea, full width, rows=6, readonly, var(--surface-muted) bg, same styling as text_input.
    - Content: result Base64 or plaintext or error message (var(--danger) red text).
    - Buttons: [Copy Base64] [Copy Data-URI] (if encode) or [Copy Text] (if decode); [Download] (if file mode).
    - Button states: success toast "복사됨" / "Copied", 1600ms auto-close.
    - Download infers MIME type from Base64 prefix (e.g., "data:image/png;…" → download.png) or uses filename from original file.
  </output_display>

  <error_states>
    - Invalid Base64 on decode: "잘못된 Base64 형식입니다. A-Za-z0-9+/= 문자만 포함되어야 합니다." (standard) or "…-_ 문자만…" (URL-safe).
    - Empty input: "텍스트 또는 파일을 입력하세요."
    - File too large: "파일이 5MB를 초과합니다."
    - Copy failure: silent (no false success toast).
  </error_states>

  <keyboard_shortcuts>
    - No single-key shortcuts (would conflict with typing in textareas).
    - Tab order: mode → variant → direction → input → output → buttons (DOM order).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <encode_decode note="pure domain layer">
    - safeDecode(base64: string, variant): { plaintext: string; sizeBytes: number } | { error: string }. Validates per RFC 4648, detects UTF-8 errors, returns friendly message.
    - safeEncode(plaintext: string, variant): { base64: string; dataUri: string; sizeBytes: number }. Uses TextEncoder + base64-js or native safe wrapper.
    - urlSafeEncode(standard base64): replace +→-, /→_; trim padding if desired.
    - isValidBase64(input, variant): boolean — regex validation per variant.
  </encode_decode>
  <file_handling>
    - FileReader.readAsArrayBuffer(file) → encode via base64-js → dataUri with inferred MIME.
    - Download: create Blob(base64-decoded bytes, MIME), trigger <a href=ObjectURL download=filename>.
    - MIME guess: default text/plain, or infer from data-URI prefix if present.
  </file_handling>
  <persistence_adapter useBase64>
    - Mount: read `jurepi-base64-encoder` → zod → state; fail → in-memory (no throw).
    - Change (mode/variant): debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: mode + setMode, variant + setVariant, inputText + setInputText, inputFile + setInputFile, outputText, error, isValidInput, encode(), decode(), copy(text), download(base64, filename).
  </persistence_adapter>
  <i18n>All UI chrome from tools.base64-encoder.* (ko/en): mode/variant labels, button text, errors, FAQ. Encode/decode logic is locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <input_validation>
    - decode: regex /^[A-Za-z0-9+/]*={0,2}$/ (standard) or /^[A-Za-z0-9\-_]*={0,2}$/ (URL-safe). Non-match → friendly error.
    - whitespace: strip before validation.
    - empty: show hint, clear output.
  </input_validation>
  <file_size>≤5MB; >5MB → error toast + reject file.</file_size>
  <utf8_decode>atob → bytes may not be valid UTF-8. TextDecoder with { fatal: true } → throw RangeError → "Unable to decode as UTF-8" message.</utf8_decode>
  <clipboard>Success toast only on real success; failure silent (copy is secondary UX).</clipboard>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below is tool-specific application.</source>
  <accent_usage>
    - Category accent is CORAL (var(--accent-coral) / var(--accent-coral-soft)) — "dev" category identity. Intro icon tile, toggle active state, button hover.
    - CTAs (primary buttons) stay brand honey-gold var(--brand). Accent = identity, not action.
  </accent_usage>
  <layout>
    - Single column, max-width 720px, centered.
    - Segments (mode/variant/direction toggles) stacked or horizontal on desktop, responsive.
    - Textareas side-by-side desktop (flex gap 20px); stacked <768px.
  </layout>
  <motion>transform/opacity only: button hover lift 2px, focus-visible var(--focus-ring) ring. All gated by prefers-reduced-motion (instant fade).</motion>
  <accessibility>Textareas labeled; toggles ARIA; buttons ≥44px; visible focus rings; AA contrast (var(--text) on light bg).</accessibility>
  <responsive>≥1024px full side-by-side; <1024px stacked. No overflow at 320px.</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>User input is processed client-side; never sent. Base64 decode is Math.safe (TextDecoder handles UTF-8 validation).</input>
  <file>FileReader client-side only; no upload backend. Downloaded files are user-generated (no injection risk).</file>
  <clipboard>User-initiated copy only (no clipboard read). No third-party cookie.</clipboard>
  <privacy>No analytics event includes encoded/decoded content. Tool copy clearly states: "Base64 is encoding, NOT encryption — do not use for security."</privacy>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>Text encode/decode round-trip UTF-8</description>
    <steps>
      1. Mode=Text, Direction=Encode, type "Hello, 안녕하세요! 😀"
      2. Output shows Base64 (standard variant default).
      3. Switch Direction=Decode; output decodes back to "Hello, 안녕하세요! 😀"
      4. Switch Variant=URL-Safe; Base64 updates (+ → -, / → _).
      5. Decode still works (variant doesn't affect decode when clear).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>File upload encode + download</description>
    <steps>
      1. Mode=File; drag-drop a 1KB .txt file.
      2. Feedback "파일 선택됨: sample.txt (1.2 KB)".
      3. Output shows Base64 + data-URI.
      4. [Copy Data-URI] → clipboard; [Download] → triggers browser download with inferred MIME (text/plain) + original filename.
      5. Drag >5MB file → error "파일이 5MB를 초과합니다."
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Persistence, error handling, accessibility</description>
    <steps>
      1. Set mode=File, variant=urlSafe; reload → settings persist (localStorage).
      2. Text mode, paste invalid Base64 "ABC!@#" (standard mode) → error "잘못된 Base64 형식…"
      3. Paste valid Base64 → decodes successfully.
      4. axe accessibility scan → no violations; tab order logical; focus-visible visible; prefers-reduced-motion honored.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>i18n, SEO (JSON-LD)</description>
    <steps>
      1. Switch to /en → all chrome English; help text English.
      2. Build prod → /ko/tools/base64-encoder and /en/tools/base64-encoder unique title/description/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ localized.
    </steps>
  </test_scenario_4>
</final_integration_test>

<success_criteria>
  <functionality>CRITICAL: UTF-8 round-trip (emoji, Korean, etc.) without corruption. Standard + URL-safe encode/decode bidirectional. File ↔ Base64 with 5MB limit and MIME inference. Copy + download buttons work. Invalid Base64 shows friendly error.</functionality>
  <user_experience>Mode/variant/direction toggles instant; no page reload. Persistent across reload. Copy feedback instant (toast 1.6s). File input drag-drop intuitive.</user_experience>
  <technical_quality>lib/base64-encoder/* pure ≥80% unit coverage (encode/decode UTF-8 edge cases, invalid Base64 detection, URL-safe round-trip). useBase64 hook localStorage isolation test. TS 0 errors; <800 lines per file.</technical_quality>
  <visual_design>DESIGN.md compliant; coral accent identity; text+file mode UI clear distinction; responsive 320/768/1024.</visual_design>
  <accessibility>Full keyboard (tab order, segment keys if needed); aria-live errors; WCAG 2.1 AA contrast.</accessibility>
  <seo>Tool route within platform budget. SoftwareApplication + FAQPage JSON-LD valid. How-to long-form present.</seo>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). No prebuild hook needed. /[locale]/tools/base64-encoder pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category is already live (no platform prerequisite).
    {
      id: 'base64-encoder',
      slug: 'base64-encoder',
      category: 'dev',
      icon: 'Binary',            // lucide-react
      accent: 'coral',
      status: 'live',            // 'coming_soon' until module complete
      isNew: true,
      order: 25,                 // next global order (restaurant-map = 24)
      keywords: ['base64','encode','decode','encoding','binary','텍스트변환','파일변환','인코딩','디코딩','base64 converter'],
    },
    ```
    Also add slug→component branch (<Base64Encoder/>) and generateMetadata branch in tool route alongside ladder/qna-a-day. `categories.dev` i18n label, CATEGORY_ORDER, FOOTER_CATEGORIES are already wired — do NOT re-add. i18n namespace `tools.base64-encoder.*` MUST include top-level `title`/`description` (consumed by searchable-tools: home cards, footer, header search). Register the tool in `public/llms.txt`. SNS share buttons come free from the route template (no per-tool wiring). FAQPage JSON-LD is owned by the `<Base64EncoderFaq>` component (single owner, visible items); `SoftwareApplication` JSON-LD via platform seo helpers with url == canonical.
  </platform_registry_change>
  <critical_paths>
    1. UTF-8 safety: TextEncoder + base64-js (or safe native) + TextDecoder. Never raw `btoa`/`atob` (breaks on non-Latin1).
    2. Variant selection: standard (A-Za-z0-9+/) vs URL-safe (A-Za-z0-9-_) with validation per RFC 4648.
    3. File upload + download: FileReader.readAsArrayBuffer → Base64 → Blob(bytes, MIME) → ObjectURL.
    4. localStorage isolation: key `jurepi-base64-encoder`, prune on mount.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/base64-encoder/{schema,encoder,base64,mime}.ts Vitest (RED→GREEN): UTF-8 encode/decode round-trip (emoji, Korean, newlines), URL-safe variant, invalid Base64 detection, padding rules, MIME guess.
    2. tools.base64-encoder.* messages (ko/en): mode/variant labels, button text, errors, FAQ.
    3. useBase64 hook (state machine + localStorage + copy adapter).
    4. ModeToggle + VariantToggle + DirectionToggle + TextInput + FileInput + OutputDisplay (form UX + validation).
    5. Keyboard a11y, motion-reduce, WCAG AA (axe).
    6. Base64EncoderIntro/HowTo/Faq + Base64EncoderStructuredData (SoftwareApplication) + FAQPage JSON-LD (Faq-owned) via platform lib/seo.ts.
    7. Registry status→live; slug→component + generateMetadata branches; E2E 1–4; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥80% (schema/encoder/base64/mime); file FileReader mocked; copy clipboard mocked; component catalog-injected state; E2E scenarios 1–4; Lighthouse CWV; axe a11y.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

