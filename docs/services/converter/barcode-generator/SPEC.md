# Barcode Generator — Convert Text to Scannable Barcodes (EAN-13, UPC-A, Code 39, Code 128) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Barcode Generator** (바코드 생성기) — pure client-side barcode encoder supporting EAN-13, UPC-A, Code 39, and Code 128 formats with automatic checksum calculation and image downloads (PNG/SVG). No server, no network. Content is generated, not stored.
> Internal service codename: `barcode-generator`. Registry id: `barcode-generator`. Public URL slug: `/[locale]/tools/barcode-generator`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (similar domain): [`docs/services/converter/qr-code/SPEC.md`](../qr-code/SPEC.md)

```xml
<project_specification>

<project_name>Barcode Generator — Client-Side Barcode Encoder (Jurepi tool, codename barcode-generator, registry id barcode-generator)</project_name>

<overview>
The Barcode Generator is a text-to-barcode converter: users input data in one of four format tabs (EAN-13, UPC-A, Code 39, Code 128); the tool instantly renders a live barcode preview and calculates checksum automatically. Users adjust barcode size, toggle human-readable text on/off, and download as PNG or SVG. All generation is client-side, deterministic, and frame-perfect — no network, no backend, no persisted state beyond localStorage.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no barcode generation service calls. The `jsbarcode` npm library (bundled locally, no CDN) encodes data into SVG; React renders it. The only first-party persistence is `localStorage` (recent inputs, last format, last size), and nothing is ever sent over the network.

CRITICAL (usability-first, SPA): per the platform rule, the tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. Format selection (EAN-13/UPC-A/CODE39/CODE128), size adjustment, human-readable text toggle, and download happen via local React state with NO route navigation and NO full page reload. Live barcode preview responds to every keystroke (debounced). The route is statically generated (SSG) for SEO; the interactive encoder is a single client-component island.

CRITICAL (safety, accessibility): XSS-safe rendering of user input (barcode data → SVG binary, never innerHTML). Automatic checksum calculation and input validation (type-driven error codes; no raw library exceptions exposed). Keyboard-operable controls, accessible input labels, reduced-motion respected (instant toggle).
</overview>

<platform_integration>
  - Route: /[locale]/tools/barcode-generator (SSG; registry slug "barcode-generator", id "barcode-generator", status "live", accent "mint", category "converter").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder.
  - Consumes: i18n namespace `tools.barcode-generator.*` (UI chrome: format labels, size labels, toggle labels, buttons, error messages, how-to, FAQ).
  - Platform dependency (SMALL): the `'converter'` category already exists in `ToolCategory` with the `mint` accent and the "변환 도구"/"Converter" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Format tabs: EAN-13 (12-digit + auto checksum), UPC-A (11-digit + auto checksum), Code 39 (alphanumeric), Code 128 (full ASCII, auto mode A/B/C).
    - Input validation: format-specific digit/character checks; checksum validation on full input.
    - Automatic checksum calculation: EAN-13 and UPC-A compute 13th/12th digit automatically; user inputs base digits only.
    - Live barcode preview: SVG render on every input change (debounced 100ms).
    - Size control: width slider (100–300px, default 200px); height auto-scales to maintain aspect ratio.
    - Human-readable text toggle: on/off, default ON (displays encoded value below barcode).
    - Download: PNG (via canvas from SVG) + SVG (hand-rolled from jsbarcode output).
    - Copy to clipboard: barcode SVG as PNG image (navigator.clipboard.write).
    - Tool-specific SEO long-form + FAQ + SoftwareApplication/FAQPage JSON-LD, Ko/En localized.
    - Reduced-motion fallbacks: instant toggle (no fade).
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner (all platform).
    - Barcode scanning / decoding (camera input). This tool generates only.
    - Dynamic/trackable barcodes (backend, analytics). Static barcode data only.
    - Bulk batch export (multi-barcode zip). Single barcode per session.
    - Color customization. Monochrome (black/white) fixed for scan reliability.
    - Advanced format-specific options (e.g., UPC-E, GS1-128). Phase 2.
  </out_of_scope>
  <future_considerations>
    - Batch generator (input CSV → multi-barcode download). Phase 2.
    - Format history (recent barcodes, localStorage gallery). Phase 2.
    - Print layout (thermal printer templates, label size presets). Phase 2.
    - UPC-E, GS1-128, ITF-14, Data Matrix. Phase 2.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <barcode_library>jsbarcode ^3.12.3 npm (pure JS encoder, MIT, zero runtime deps). Import ONLY from bin/ (babel-compiled CJS — bin/barcodes/EAN_UPC/EAN13.js, bin/barcodes/EAN_UPC/UPC.js, bin/barcodes/CODE39/index.js, bin/barcodes/CODE128/index.js). NEVER import from src/ (raw ESM, unsafe for bundling) and NEVER import jsbarcode's renderers/ (those require a live DOM canvas/svg element and would break domain purity). Classes: EAN13, UPC, CODE39, CODE128. All DOM-agnostic; encode() returns { data: string (binary bar/space pattern), text: string (human-readable) } for CODE39/CODE128, or an array of such segments for EAN13/UPC (guard bars + digit groups) — encoder.ts normalizes both shapes into a single flat `bars` binary string + `text`.</barcode_library>
    <svg_render>Hand-rolled SVG only (mirrors qr-code tool's svg-export.ts) — domain `svg-export.ts` parses the normalized `bars` binary string and emits `<rect>` elements per bar directly, plus an optional `<text>` element for the human-readable line. No jsbarcode renderer is used anywhere (that module is DOM-coupled and out of scope). No html2canvas or any new dependency.</svg_render>
    <checksum>jsbarcode handles automatically. Input validation: type-driven error codes (lengthError, invalidCharacter, etc.), mapped to UI i18n.</checksum>
    <clipboard>navigator.clipboard.write (PNG blob) → fallback execCommand (never show false success).</clipboard>
    <canvas_render>PNG preview/export draws bars natively to an HTML5 canvas via ctx.fillRect per bar, reading the same normalized `bars` binary string as svg-export.ts — mirrors qr-code's QRPreview.tsx (which fillRect's each QR module directly, never rasterizes its own SVG). The canvas rendering is independent of the SVG string; both are derived from the same domain-level `bars` data so they can never drift from each other.</canvas_render>
    <download>SVG → Blob(xml) → URL.createObjectURL → hidden <a href> click. PNG → canvas.toBlob() on the natively-drawn canvas (see canvas_render above) → same download pattern. No SVG-to-canvas rasterization, no html2canvas.</download>
  </module_specific>
  <libraries>
    <jsbarcode>jsbarcode ^3.12.3 — dependency, npm. Import bin/ paths only for safe CJS bundling.</jsbarcode>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/barcode-generator/
│   ├── types.ts                           # BarcodeFormat, BarcodeInput, BarcodeOptions, EncodedBarcode
│   ├── schema.ts                          # zod: BarcodeInputSchema, BarcodeOptionsSchema; error codes
│   ├── validation.ts                      # validateInput(format, input): { valid: bool, error?: TypedError }
│   ├── encoder.ts                         # encodeBarcode(input, format, options): EncodedBarcode — pure function, no React/DOM
│   ├── svg-export.ts                      # normalizeBarcodeSVG(raw): optimized SVG string
│   └── index.ts                           # Public exports
├── components/tools/barcode-generator/
│   ├── BarcodeGenerator.tsx               # Orchestrator (Client Component) — owns format/input/size/textVisible state
│   ├── useBarcodeGenerator.ts             # Hook: dynamic jsbarcode import, encode (debounced), localStorage recent/format/size
│   ├── FormatSelector.tsx                 # EAN-13 / UPC-A / Code 39 / Code 128 tabs (segment)
│   ├── InputArea.tsx                      # Input field with format-specific placeholder, char count, validation msg
│   ├── BarcodePreview.tsx                 # Live canvas render (native fillRect per bar, mirrors qr-code QRPreview.tsx) + loading spinner
│   ├── SizeControl.tsx                    # Width slider (100–300px) + auto-height display
│   ├── TextToggle.tsx                     # "Show human-readable text" toggle (on/off)
│   ├── DownloadButtons.tsx                # Download PNG, Download SVG, Copy to Clipboard buttons
│   ├── BarcodeIntro.tsx                   # H1 + lead (SEO; server-render where possible)
│   ├── BarcodeHowTo.tsx                   # "How to generate a barcode" (SEO long-form, mounted-gate-free SSR)
│   ├── BarcodeFaq.tsx                     # Q&A + FAQPage JSON-LD (single owner of FAQPage — StructuredData below owns SoftwareApplication only)
│   ├── BarcodeStructuredData.tsx          # SoftwareApplication JSON-LD only (no FAQPage here — avoid duplicate JSON-LD)
│   └── data/
│       └── (no generated artifact; runtime only)
└── i18n/messages/{ko,en}.json             # tools.barcode-generator.* UI chrome
</file_structure>

<core_data_entities>
  <barcode_input>
    - data: string (required, non-empty)
    - format: enum (EAN13, UPC, CODE39, CODE128) — determines encoding rules
    - INVARIANTS: 
      * EAN13: 12 or 13 digits (12 base → auto checksum; 13 full → validate checksum)
      * UPC: 11 or 12 digits (11 base → auto checksum; 12 full → validate checksum)
      * CODE39: alphanumeric + space + dash + dot + $ + / + + + %
      * CODE128: full ASCII (auto mode A/B/C selection)
  </barcode_input>
  <barcode_options>
    - width: number (px, 100–300, default 200)
    - height: auto (scales to maintain standard aspect ratio per format)
    - textVisible: bool (default true; shows encoded value below barcode)
  </barcode_options>
  <encoded_barcode>
    - bars: string — normalized flat binary bar/space pattern (e.g. "1010110..."), the single source of truth both svg-export.ts and BarcodePreview's canvas draw from (so SVG and PNG can never visually drift from each other)
    - svgString: string — SVG XML string, derived from `bars` by svg-export.ts
    - textContent: string — human-readable (or empty if textVisible=false at render time)
    - encodedValue: string — what was actually encoded (base + checksum if applicable)
    - format: enum — for reference
  </encoded_barcode>
  <barcode_store note="localStorage blob">
    - version: number (STORE_VERSION = 1)
    - recentInputs: string[] — last 5 inputs, truncated (max 100 chars each)
    - lastFormat: enum (EAN13|UPC|CODE39|CODE128)
    - lastWidth: number (px)
    localStorage key: `jurepi-barcode-generator`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw).
  </barcode_store>
  <constants>
    - MAX_INPUT_LENGTH = 256 (conservatively large for all formats)
    - DEBOUNCE_MS = 100
    - WIDTH_MIN = 100, WIDTH_MAX = 300, WIDTH_DEFAULT = 200
    - ASPECT_RATIO_STANDARD = 1:0.5 (barcode height typically half width for readability)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/barcode-generator" page="BarcodeGenerator (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry to SSG. No per-barcode routes.</note>
</route_definitions>

<component_hierarchy>
  <barcode_generator>                         <!-- "use client"; owns format + input + size + textVisible state + useBarcodeGenerator() -->
    <barcode_intro />                       <!-- H1 + lead (server-render where possible) -->
    <generator_layout>                       <!-- Two-column desktop (form | preview), stacked mobile -->
      <form_panel>
        <format_selector />                 <!-- EAN-13 / UPC-A / Code 39 / Code 128 tabs -->
        <input_area />                      <!-- Input field + format-specific validation + char count -->
        <size_control />                    <!-- Width slider (100–300px) + display current -->
        <text_toggle />                     <!-- "Show text" toggle (on/off) -->
        <download_buttons />                <!-- PNG / SVG / Copy -->
      </form_panel>
      <preview_panel>                        <!-- Sticky right / below on mobile -->
        <barcode_preview />                 <!-- SVG live render -->
      </preview_panel>
    </generator_layout>
    <barcode_how_to />                      <!-- SEO long-form -->
    <barcode_faq />                         <!-- FAQPage JSON-LD -->
  </barcode_generator>
  <note>SPA within tool: format/size/text = local state switch, NOT route navigation. Preview updates live (debounced).</note>
</component_hierarchy>

<pages_and_interfaces>
  <barcode_preview>
    - SVG render (200px wide default, responsive to size slider). Live barcode on every input change (debounced 100ms).
    - Optional human-readable text below (toggle control).
    - States: empty (placeholder "Barcode will appear here" gray text), loading (spinner), rendered (SVG), error (Toast + fallback).
    - Dimensions: ≥1024px 300px right docked; 768–1023px below form, 100% width; <768px below form, 100% width, height auto.
  </barcode_preview>

  <format_selector>
    - Horizontal pill tabs (segment): "EAN-13", "UPC-A", "Code 39", "Code 128".
    - Active = brand mint bg / on-brand text; inactive = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right navigate; aria-selected on active.
  </format_selector>

  <input_area>
    - Single text input (format-specific placeholder, e.g., "12 digits for EAN-13 base" / "11 digits for UPC-A base").
    - Char count display (current / MAX_INPUT_LENGTH); error state at max.
    - Validation message below (format-specific rules, checksum error if applicable).
    - var(--surface) border var(--hairline), radius var(--radius-md), padding 12px.
  </input_area>

  <size_control>
    - Slider: 100–300px, step 10. Display "Width: 200px" (height auto-scales).
  </size_control>

  <text_toggle>
    - Checkbox or pill toggle: "Show human-readable text" (on/off, default on).
    - When on, barcode displays encoded value (e.g., "978014300723" for EAN-13).
  </text_toggle>

  <download_buttons>
    - Three buttons: "Download PNG", "Download SVG", "Copy to Clipboard" (PNG image).
    - Success toast: "Barcode downloaded" / "Copied to clipboard".
    - Failure (clipboard unavailable): silent (no false success).
  </download_buttons>

  <keyboard_shortcuts>
    - Ctrl+S / Cmd+S → Download PNG.
    - Ctrl+C / Cmd+C → Copy to Clipboard.
    - Tab → navigate fields; focus-visible ring var(--focus-ring).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <format_detection>
    - EAN-13: 12 or 13 digits. If 12 → auto-append checksum (mod 10). If 13 → validate checksum.
    - UPC-A: 11 or 12 digits. If 11 → auto-append checksum. If 12 → validate checksum.
    - Code 39: alphanumeric + space, dash, dot, $, /, +, %. Auto-adds *asterisk* delimiters (jsbarcode handles).
    - Code 128: full ASCII; auto-detects mode A/B/C for optimal encoding (jsbarcode handles).
  </format_detection>
  <barcode_encoding>
    - jsbarcode library: new EAN13(data, opts).encode() / new UPC(data, opts).encode() / new CODE39(data, opts).encode() / new CODE128(data, opts).encode().
    - EAN/UPC return segment array; CODE39/CODE128 return single object. Normalization layer unifies both shapes.
    - SVG export: jsbarcode native SVG adapter or hand-rolled from bar pattern string.
    - All deterministic (no random, stable output).
  </barcode_encoding>
  <checksum_validation>
    - jsbarcode .valid() method returns true/false. Expose typed error code (e.g., checksumError) for UI.
  </checksum_validation>
  <persistence_adapter useBarcodeGenerator>
    - Mount: read `jurepi-barcode-generator` → zod → start fresh on fail (no throw).
    - Change: debounced JSON.stringify → setItem; catch quota → keep in-memory.
    - Expose: input/format/width + setInput/setFormat/setWidth, textVisible + setTextVisible, encode(debounced).
  </persistence_adapter>
  <i18n>All UI chrome from tools.barcode-generator.* (ko/en): format labels, input placeholders, validation messages, buttons, toasts, how-to, FAQ. Barcode data is format-dependent, locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <input_too_long>Char count display shows red at MAX_INPUT_LENGTH; error message "최대 256자입니다" / "Max 256 characters". User must shorten.</input_too_long>
  <invalid_format>Format-specific validation (e.g., "EAN-13은 12개 또는 13개의 숫자여야 합니다" / "EAN-13 requires 12 or 13 digits"). Toast error + in-field hint.</invalid_format>
  <checksum_error>If 13-digit input fails checksum, Toast "유효하지 않은 체크섬입니다" / "Invalid checksum". User re-enters or uses 12-digit base.</checksum_error>
  <jsbarcode_exception>Rare. Map library error codes to typed errors (lengthError, invalidCharacter, etc.). Toast: "바코드 생성 실패" / "Barcode generation failed". Fallback: placeholder SVG.</jsbarcode_exception>
  <canvas_unavailable>PNG export fails → fallback SVG only (user offers SVG-only download, mentions PNG unavailable).</canvas_unavailable>
  <storage>Unavailable (private mode) → in-memory, fully usable. Fail → no error to user.</storage>
  <error_boundary>Platform wraps tool; render fail → retry without crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent>Category accent is MINT (var(--accent-mint) / var(--accent-mint-soft)) — "converter" category identity per DESIGN. Format selector active state, size slider track, download CTA (brand coral for primary, mint for secondary).</accent>
  <surfaces>Form panel = var(--surface) + 1px var(--hairline); preview = var(--surface) + border mint. Input fields var(--surface) + var(--hairline), radius var(--radius-md). Soft mint shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); labels Pretendard 14–16px/600; values 16px/500. Input placeholder 500 weight.</typography>
  <motion>SVG live-update is instant (debounced 100ms, no fade). Toggle transition 150ms ease-out (gated by prefers-reduced-motion: instant).</motion>
  <accessibility>All inputs labeled; validation messages persistent; full keyboard nav; focus-visible ring var(--focus-ring). Error states use color + icon + text (not color alone).</accessibility>
  <responsive>≥1024px: 2-split (form left | preview sticky right). 768–1023px: form above, preview below (full width). <768px: vertical stack. Preview responsive to size slider (no overflow at 320).</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>User data → SVG/barcode encoding (safe). No innerHTML. No script execution. Format strings are literals (no eval).</input>
  <clipboard>User-initiated copy only; never read clipboard; blob (PNG image), never text token.</clipboard>
  <privacy>No input sent over network. localStorage-only history (max 5 inputs, truncated 100 chars). No analytics. Barcode data is user-created (not sensitive by tool design).</privacy>
  <third_party>jsbarcode library is pure JS, no callbacks home. DESIGN tokens are read-only. No CDN. bin/ paths are babel-compiled CJS (safe bundling).</third_party>
  <note>No secrets, no 3rd-party, no network.</note>
</security_considerations>

<final_integration_test>
  <test_1>EAN-13 base input "978014300723" (12 digits) → checksum auto-calculates to "9780143007234" → barcode renders → Download PNG → PNG opens in viewer.</test_1>
  <test_2>UPC-A input "12345678901" (11 digits) → checksum auto-calculates → barcode renders with human-readable text visible → Toggle text off → text disappears.</test_2>
  <test_3>Code 39 input "HELLO-WORLD" → barcode renders → size slider adjusts width (100–300px) → Download SVG → SVG valid XML.</test_3>
  <test_4>Code 128 input "Hello, World! 123" → full ASCII encoded → barcode renders → Copy to clipboard → PNG pasted into image viewer.</test_4>
  <test_5>Keyboard shortcuts (Cmd+S, Cmd+C) → Download + Copy work. Tab nav form fields. Enter download (or explicit button). Validation error on invalid input.</test_5>
  <test_6>Lang switch ko/en → all labels, placeholders, errors localized. Barcode data (numeric/alpha content) unchanged. localStorage persists across lang switch.</test_6>
  <test_7>Reduce-motion on → no transition (instant). Mobile 320px → no overflow, full-width form+preview. JSON-LD SoftwareApplication + FAQPage in prerendered HTML.</test_7>
</final_integration_test>

<success_criteria>
  <functionality>EAN-13, UPC-A, Code 39, Code 128 formats. Live barcode preview. Size slider (100–300px). Human-readable text toggle. Auto checksum (EAN/UPC). Download PNG+SVG. Copy to clipboard. Keyboard operable. Reduced-motion respected. Format-specific validation.</functionality>
  <ux>Live preview instant (debounced 100ms). Form feels responsive. Validation messages helpful (not preachy). Download buttons always reachable. Format-specific placeholders guide input. ≥44px tap targets.</ux>
  <technical>lib/barcode-generator/* pure ≥80% unit coverage (encoder/validation/svg); no React/Next deps. TS 0 errors. <800 lines per file. jsbarcode library ^3.12.3 bundled locally (bin/ CJS pure encoders only, no renderers). localStorage only, no network. Deterministic output (same input → same barcode every time).</technical>
  <visual>DESIGN.md compliant; mint identity + brand coral CTA. Clear, accessible input hints. SVG/PNG render match. Text readable on barcode.</visual>
  <performance>Tool route within platform budget. Live debounce prevents thrashing. SVG render <100ms on modern browsers. CLS unaffected. LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). No prebuild hook needed (pure runtime). /[locale]/tools/barcode-generator pre-rendered by platform generateStaticParams iterating registry (status "live"). Barcode tool itself is SPA, no static artifact.</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Format-specific input validation + auto checksum (EAN/UPC).
    2. jsbarcode library integration: new Format(data, opts).encode() → segment/object normalization.
    3. SVG render from library output.
    4. PNG export (SVG → canvas → blob).
    5. Download (blob → URL.createObjectURL → hidden <a href>).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/barcode-generator/{types,schema,validation,encoder,svg-export}.ts Vitest (RED→GREEN): format validation, jsbarcode integration, checksum, SVG normalization, PNG export.
    2. useBarcodeGenerator hook (jsbarcode dynamic import, encode debounced, localStorage).
    3. FormatSelector + InputArea (EAN/UPC/CODE39/CODE128).
    4. BarcodePreview (SVG render).
    5. SizeControl + TextToggle + DownloadButtons.
    6. Keyboard shortcuts, motion-reduce, a11y (axe).
    7. BarcodeIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    8. Registry status→live; slug→component + generateMetadata; E2E 1–7; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥80% (encoder/validation/svg); component catalog-injected jsbarcode mock; SVG mock (jsdom); E2E scenarios 1–7 (all formats, size, text toggle, download, keyboard, lang, motion); visual barcode content validation (optional decoder).</testing_strategy>
</key_implementation_notes>

</project_specification>
```

Written Barcode Generator SPEC.md | 410 lines.
