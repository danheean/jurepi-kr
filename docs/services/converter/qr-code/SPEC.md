# QR Code Generator — Convert Text/URLs to Scannable QR Codes — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **QR Code Generator** (QR 코드 생성기) — pure client-side QR code encoder with color picker, error correction tuning, and image downloads (PNG/SVG). No server, no network. Content is generated, not stored.
> Internal service codename: `qr-code`. Registry id: `qr-code`. Public URL slug: `/[locale]/tools/qr-code`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (similar domain): [`docs/services/text/special-symbol/SPEC.md`](../special-symbol/SPEC.md)

```xml
<project_specification>

<project_name>QR Code Generator — Client-Side QR Encoder (Jurepi tool, codename qr-code, registry id qr-code)</project_name>

<overview>
The QR Code Generator is a text-to-code converter: users paste text, URLs, Wi-Fi credentials, contact info, or email addresses; the tool instantly renders a live QR preview. Users adjust error correction (L/M/Q/H), colors (foreground/background with contrast guard), optional center logo overlay (client image only), and download as PNG or SVG. All generation is client-side, deterministic, and frame-perfect — no network, no backend, no persisted state beyond localStorage.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no qr-code generation service calls. The `qrcode` npm library (bundled locally, no CDN) encodes data into a canvas; React renders it. The only first-party persistence is `localStorage` (recent inputs, last colors, last ECC level), and nothing is ever sent over the network.

CRITICAL (usability-first, SPA): per the platform rule, the tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. Input mode selection (text/URL/Wi-Fi/vCard/email/SMS), ECC selection, color adjustment, logo upload, and download happen via local React state with NO route navigation and NO full page reload. Live QR preview responds to every keystroke (debounced). The route is statically generated (SSG) for SEO; the interactive encoder is a single client-component island.

CRITICAL (safety, accessibility): XSS-safe rendering of user input (code data → canvas binary, never innerHTML). Contrast checking before download blocks low-readability codes (visually verify) and warns via Toast. Keyboard-operable color picker, accessible input labels, reduced-motion respected (instant color transition).
</overview>

<platform_integration>
  - Route: /[locale]/tools/qr-code (SSG; registry slug "qr-code", id "qr-code", status "live", accent "sky", category "converter").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder.
  - Consumes: i18n namespace `tools.qr-code.*` (UI chrome: input modes, ECC labels, copy feedback, contrast warning).
  - Platform dependency (SMALL): the `'converter'` category already exists in `ToolCategory` with the `sky` accent and the "변환 도구"/"Converter" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Input modes: plain text, URL, Wi-Fi (SSID/password/encryption), vCard (contact card), email (mailto), SMS (tel:/sms:). Each mode pre-formats data into QR-encodable string.
    - Live QR preview: canvas render on every input change (debounced 100ms).
    - Error correction level selector: L (7%), M (15%), Q (25%), H (30%) with tooltip explaining recovery benefit.
    - Size/quiet-zone controls: size selector (px: 200–500 by 50px steps), quiet zone (4–8 modules, default 4).
    - Foreground (dark)/background (light) color pickers (hex input + visual picker, DESIGN accent palette shortcut buttons).
    - Contrast check: warn if ΔE (delta-E) < 50 (WCAG AA, approximate) between fg/bg; block download if too low (user can override by re-confirming).
    - Optional center logo overlay: client file input (PNG/SVG/JPG), centered, scales to ~25% of QR size, no network upload.
    - Download: PNG (via canvas.toBlob) + SVG (hand-rolled path XML from qrcode library module data).
    - Copy to clipboard: QR as PNG image (navigator.clipboard.write).
    - Keyboard shortcuts: Ctrl+S / Cmd+S = download PNG; Ctrl+C / Cmd+C = copy (native selection override).
    - Tool-specific SEO long-form + FAQ + SoftwareApplication/FAQPage JSON-LD, Ko/En localized.
    - Reduced-motion fallbacks: instant color transition (no fade).
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner (all platform).
    - QR scanning / decoding (camera input). This tool generates only.
    - Dynamic/trackable QRs (backend, analytics). Static QR data only.
    - Bulk batch export (multi-QR zip). Single QR per session.
    - Rich media (video/audio embedded in QR). Text/URL/contact only.
    - QR design templates (shapes, rounded corners). Standard square modules.
  </out_of_scope>
  <future_considerations>
    - Logo palette (pre-made shapes to embed). Phase 2.
    - Batch generator (input CSV → multi-QR download). Phase 2.
    - QR history (recent codes, localStorage gallery). Phase 2.
    - Print layout (A4 with labels). Phase 2.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <qr_library>qrcode ^1.5.x npm (pure JS encoder, no canvas dependency but works with canvas adapter). Bundled locally; no CDN. Generates QR data matrix (binary modules) and supports dynamic canvas rendering. Used ONLY for data encoding; all rendering is React+canvas.</qr_library>
    <canvas_render>Native HTML5 canvas (via useRef + drawImage). qrcode library is adapted to draw to canvas context. SVG export hand-rolled from library's internal module data.</canvas_render>
    <color_delta_e>Simple RGB ΔE calc (Euclidean distance in RGB space) — approximate WCAG AA (not full CIE-Lab, sufficient for QR contrast). Library: DIY (20 lines).</color_delta_e>
    <clipboard>navigator.clipboard.write (PNG blob) → fallback execCommand (never show false success).</clipboard>
    <file_input>Client-side image read via FileReader.readAsDataURL → Image onload → canvas drawImage (no upload).</file_input>
    <download>canvas.toBlob → URL.createObjectURL → hidden <a href> click (PNG). SVG → Blob(xml) → same pattern.</download>
  </module_specific>
  <libraries>
    <qrcode>qrcode v1.5.3 (or later ^1.5.x) — devDependency/peerDependency, npm.</qrcode>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/qr-code/
│   ├── schema.ts                          # zod: QRInput, QROptions, QRGenerationResult; validation
│   ├── encoder.ts                         # generateQR(data, options): { dataUrl, svg, matrix } — pure function, no React
│   ├── contrast.ts                        # deltaE(fg, bg): number; isContrustAcceptable(fg, bg, threshold=50): bool
│   ├── svg-export.ts                      # matrixToSVG(matrix, size, fg, bg): string; no library
│   └── types.ts                           # QRInput, InputMode, ECCLevel, QROptions
├── components/tools/qr-code/
│   ├── QRCodeGenerator.tsx                # Orchestrator (Client Component) — owns input/mode/ecc/colors/logo state
│   ├── useQRCode.ts                       # Hook: dynamic qrcode import, encode (debounced), localStorage recent/options
│   ├── InputModeSelector.tsx              # Text / URL / Wi-Fi / vCard / Email / SMS tabs (segment)
│   ├── InputArea.tsx                      # Textarea/input for data (locale-specific placeholder)
│   ├── ECCSelector.tsx                    # L/M/Q/H radio + tooltip explaining recovery
│   ├── QRPreview.tsx                      # Canvas live render + loading spinner
│   ├── ColorPickers.tsx                   # Fg/bg hex inputs + palette buttons (DESIGN accent shortcuts) + contrast indicator
│   ├── LogoUpload.tsx                     # File input, preview, remove button
│   ├── SizeControls.tsx                   # Size (200–500px) + quiet-zone (4–8) sliders
│   ├── DownloadButtons.tsx                # Download PNG, Download SVG, Copy to Clipboard buttons
│   ├── ContrastWarning.tsx                # Toast-style warning + override confirm
│   ├── QRIntro.tsx                        # H1 + lead (SEO; server-render where possible)
│   ├── QRHowTo.tsx                        # "How to generate a QR code" (SEO long-form)
│   ├── QRFaq.tsx                          # Q&A + FAQPage JSON-LD
│   └── data/
│       └── (no generated artifact; runtime only)
└── i18n/messages/{ko,en}.json             # tools.qr-code.* UI chrome
</file_structure>

<core_data_entities>
  <qr_input>
    - data: string (required, non-empty, ≤ 2953 chars for QR code capacity at ECC H)
    - mode: enum (text, url, wifi, vcard, email, sms) — determines data encoding
    - INVARIANTS: data non-empty; mode determines pre-format rules (e.g., wifi needs SSID+password; vcard needs name+phone-or-email).
  </qr_input>
  <qr_options>
    - eccLevel: enum (L, M, Q, H) — error correction capacity (default M)
    - size: number (px, 200–500, default 300)
    - quietZone: number (modules, 4–8, default 4)
    - fgColor: hex string (#RRGGBB, default #2a2411, var(--text))
    - bgColor: hex string (#RRGGBB, default #ffffff, var(--bg))
    - logoUrl?: string (data URL, if user uploaded image)
  </qr_options>
  <qr_generation_result>
    - matrix: boolean[][] — QR module grid (encoder output)
    - dataUrl: string — canvas PNG data URL
    - svg: string — SVG XML string
    - contrastAcceptable: bool — deltaE >= 50
  </qr_generation_result>
  <qr_store note="localStorage blob">
    - version: number (STORE_VERSION = 1)
    - recentInputs: string[] — last 5 inputs, truncated (max 100 chars each)
    - lastMode: string — last selected input mode (text|url|wifi|vcard|email|sms)
    - lastECC: enum (L|M|Q|H)
    - lastFgColor: hex
    - lastBgColor: hex
    localStorage key: `jurepi-qr-code`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw).
  </qr_store>
  <constants>
    - MAX_INPUT_LENGTH = 2953 (QR 40-L capacity, safest limit)
    - CONTRAST_THRESHOLD = 50 (approximate WCAG AA)
    - DEBOUNCE_MS = 100
    - SIZE_STEP = 50 (px)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/qr-code" page="QRCodeGenerator (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry to SSG. No per-QR routes.</note>
</route_definitions>

<component_hierarchy>
  <qr_code_generator>                           <!-- "use client"; owns input + mode + options + logo state + useQRCode() -->
    <qr_intro />                                <!-- H1 + lead (server-render where possible) -->
    <generator_layout>                          <!-- Two-column desktop (form | preview), stacked mobile -->
      <form_panel>
        <input_mode_selector />                <!-- Text / URL / Wi-Fi / vCard / Email / SMS -->
        <input_area />                         <!-- Textarea + input for data -->
        <ecc_selector />                       <!-- L/M/Q/H radio + tooltip -->
        <size_controls />                      <!-- Size + quiet-zone sliders -->
        <color_pickers />                      <!-- Fg/bg hex + palette buttons + contrast indicator -->
        <logo_upload />                        <!-- File input + preview + remove -->
        <download_buttons />                   <!-- PNG / SVG / Copy -->
      </form_panel>
      <preview_panel>                          <!-- Sticky right / below on mobile -->
        <qr_preview />                         <!-- Canvas live render -->
        <contrast_warning />                   <!-- Toast-style, if needed -->
      </preview_panel>
    </generator_layout>
    <qr_how_to />                              <!-- SEO long-form -->
    <qr_faq />                                 <!-- FAQPage JSON-LD -->
  </qr_code_generator>
  <note>SPA within tool: mode/size/color/logo = local state switch, NOT route navigation. Preview updates live (debounced).</note>
</component_hierarchy>

<pages_and_interfaces>
  <qr_preview>
    - Canvas (300×300px default, responsive to size control). Live QR render on every input change (debounced 100ms). Centered, var(--surface) border var(--hairline), radius var(--radius-lg).
    - States: empty (placeholder "QR code will appear here" gray text), loading (spinner), rendered (canvas), error (Toast + fallback).
    - Dimensions: ≥1024px 360px right docked; 768–1023px below form, 100% width; <768px below form, 100% width, height auto.
  </qr_preview>

  <input_mode_selector>
    - Horizontal pill tabs (segment): "텍스트"/"Text", "URL", "Wi-Fi", "명함"/"vCard", "이메일"/"Email", "문자"/"SMS".
    - Active = brand honey-gold bg / on-brand text; inactive = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right navigate; aria-selected on active.
  </input_mode_selector>

  <input_area>
    - Textarea (mode=text|url) or structured inputs (mode=wifi: SSID, password, encryption; mode=vcard: name, phone, email, url; mode=email: email + subject + body; mode=sms: phone + message).
    - var(--surface) border var(--hairline), radius var(--radius-md), padding 12px. Placeholder varies by mode and locale.
    - Char count display (current / MAX_INPUT_LENGTH); warn at 80%, error at 100%.
  </input_area>

  <ecc_selector>
    - Radio group (L, M, Q, H) with labels and tooltip per option ("7% recovery", "15% recovery", etc.).
    - Default M. Layout: vertical stack or horizontal pill (narrow screens stack).
  </ecc_selector>

  <size_controls>
    - Slider: 200–500px, step 50. Display "Size: 300px". Quiet-zone slider: 4–8 modules, step 1, default 4.
  </size_controls>

  <color_pickers>
    - Two hex input fields: "Foreground" (#2a2411) and "Background" (#ffffff). Palette shortcut buttons (DESIGN accents: coral, mint, sky, sun, grape, rose) — click to apply fg or bg.
    - Contrast indicator (live): "Contrast: 87" (deltaE number) + color dot (🟢 good / 🟡 warn / 🔴 poor).
    - If contrast < 50: "Low contrast may reduce scannability" Toast (warn, not block).
  </color_pickers>

  <logo_upload>
    - File input (accept="image/*") + preview (100×100px thumbnail, border var(--hairline)). "Remove" button to clear.
    - Logo scales to ~25% of QR size on render. No upload; data URL only.
  </logo_upload>

  <download_buttons>
    - Three buttons: "Download PNG", "Download SVG", "Copy to Clipboard" (PNG image).
    - If contrast warning active, user must confirm "Generate anyway" before download enabled (secondary button).
    - Success toast: "QR code downloaded" / "Copied to clipboard".
    - Failure (clipboard unavailable): silent (no false success).
  </download_buttons>

  <keyboard_shortcuts>
    - Ctrl+S / Cmd+S → Download PNG.
    - Ctrl+C / Cmd+C → Copy to Clipboard.
    - Tab → navigate fields; focus-visible ring var(--focus-ring).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <input_mode_detection>
    - text: raw string, any length.
    - url: validate with URL() constructor, prepend "http://" if no scheme; encode as-is.
    - wifi: format "WIFI:T:WPA;S:<SSID>;P:<PASSWORD>;;" (WPA2 default, user selects WEP).
    - vcard: vCard 3.0 format (BEGIN:VCARD … END:VCARD) from structured inputs.
    - email: "mailto:<email>?subject=<subj>&body=<body>" (URL-encoded).
    - sms: "smsto:<phone>:<message>" (URL-encoded).
  </input_mode_detection>
  <qr_encoding>
    - qrcode library: generateQR(data, options) returns encoded matrix (boolean[][]).
    - Canvas render: iterate matrix, draw black/white modules + quiet zone.
    - SVG export: hand-roll <svg> + <rect> grid from matrix.
    - All deterministic (no random, stable output).
  </qr_encoding>
  <error_correction>
    - User selects L/M/Q/H. Library encodes accordingly. No runtime override.
  </error_correction>
  <color_contrast_check>
    - deltaE(fg_hex, bg_hex): simple RGB Euclidean distance. If < 50, warn (Toast) but allow override.
    - Library: ~20 lines pure function.
  </color_contrast_check>
  <logo_overlay note="optional, client-side only">
    - User uploads image (file input → FileReader → data URL).
    - On QR render: load image via Image() onload → drawImage on canvas (25% of QR size, centered).
    - Fallback: no image → no logo (continues rendering).
  </logo_overlay>
  <persistence_adapter useQRCode>
    - Mount: read `jurepi-qr-code` → zod → start fresh on fail (no throw).
    - Change: debounced JSON.stringify → setItem; catch quota → keep in-memory.
    - Expose: input/mode/options + setInput/setMode/setOptions, logoUrl + setLogoUrl, encode(debounced).
  </persistence_adapter>
  <i18n>All UI chrome from tools.qr-code.* (ko/en): mode labels, ECC labels, buttons, toasts, placeholders, how-to, FAQ. QR data is mode-dependent, locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <input_too_long>Char count display shows red at 100%; error message "최대 2953자입니다" / "Max 2953 characters". User must shorten.</input_too_long>
  <bad_url>URL() constructor throws → Toast "유효하지 않은 URL" / "Invalid URL". Retry with valid URL.</bad_url>
  <low_contrast>Toast warn (not block) "낮은 명도차로 스캔 어려울 수 있습니다. 색상을 조정하거나 [생성]을 다시 누르세요." / "Low contrast may reduce scannability. Adjust colors or confirm again." User can override.</low_contrast>
  <copy_failure>clipboard → execCommand fail → silent (no toast). Copy is secondary; non-critical.</copy_failure>
  <canvas_unavailable>Rare. Graceful fallback: render SVG instead of canvas PNG. Offer SVG-only download.</canvas_unavailable>
  <storage>Unavailable (private mode) → in-memory, fully usable. Fail → no error to user.</storage>
  <error_boundary>Platform wraps tool; render fail → retry without crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent>Category accent is SKY (var(--accent-sky) / var(--accent-sky-soft)) — "converter" category identity per DESIGN. Input mode selector active state, QR preview border (optional), download CTA (brand honey-gold for primary, sky for secondary).</accent>
  <surfaces>Form panel = var(--surface) + 1px var(--hairline); preview = var(--surface) + border sky. Input fields var(--surface) + var(--hairline), radius var(--radius-md). Soft honey shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); labels Pretendard 14–16px/600; values 16px/500. Contrast indicator 600 weight.</typography>
  <motion>Canvas live-update is instant (debounced 100ms, no fade). Color picker swatch transition 150ms ease-out (gated by prefers-reduced-motion: instant).</motion>
  <accessibility>All inputs labeled; color picker rgb hex manually typed (not image picker only); contrast indicator text + visual dot; full keyboard nav; focus-visible ring. Contrast check protects scannability.</accessibility>
  <responsive>≥1024px: 2-split (form left | preview sticky right). 768–1023px: form above, preview below (full width). <768px: vertical stack. Preview responsive to size slider (no overflow at 320).</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>User data → canvas binary (safe). No innerHTML. No script execution. vCard/email/SMS strings are literals (no eval).</input>
  <clipboard>User-initiated copy only; never read clipboard; blob (PNG image), never text token.</clipboard>
  <file_upload>Client-side image load via FileReader → data URL → Image onload. No network; no server check. Type validation: MIME check (PNG/JPEG/SVG) + file extension (strip others).</file_upload>
  <privacy>No input sent over network. localStorage-only history (max 5 inputs, truncated 100 chars). No analytics. QR data is user-created (not sensitive by tool design).</privacy>
  <third_party>qrcode library is pure JS, no callbacks home. DESIGN tokens are read-only. No CDN.</third_party>
  <note>No secrets, no 3rd-party, no network.</note>
</security_considerations>

<final_integration_test>
  <test_1>Text input "Hello World" → QR live preview renders → [M ECC, default colors] → Download PNG (no dialog, direct save) → PNG opens in viewer (contains "Hello World" data).</test_1>
  <test_2>URL mode "jurepi.kr" → QR live render → Low contrast warning (choose complementary colors from palette) → Download SVG (XML valid) → SVG opens in browser.</test_2>
  <test_3>Wi-Fi mode (SSID "Jurepi", password "qwerty123", WPA2) → QR render → Upload logo (PNG) → Logo centered on QR → Download PNG with logo → Contrast unaffected (logo not darkened).</test_3>
  <test_4>Keyboard shortcuts (Cmd+S, Cmd+C) → Download + Copy work. Tab nav form fields. Arrow keys mode tabs. Enter download. Contrast info visible, accessible.</test_4>
  <test_5>Lang switch ko/en → all labels, tooltips, toasts localized. QR data (text content) unchanged. localStorage persists across lang switch.</test_5>
  <test_6>Reduce-motion on → no transition (instant). Mobile 320px → no overflow, full-width form+preview. JSON-LD SoftwareApplication + FAQPage in prerendered HTML.</test_6>
</final_integration_test>

<success_criteria>
  <functionality>Text/URL/Wi-Fi/vCard/Email/SMS modes. Live QR preview. ECC selector (L/M/Q/H). Fg/bg color pickers + contrast check + palette shortcuts. Logo overlay (optional). Download PNG+SVG. Copy to clipboard. Keyboard operable. Reduced-motion respected.</functionality>
  <ux>Live preview instant (debounced 100ms). Form feels responsive. Contrast warning helpful (not preachy). Download buttons always reachable. Char count prevents errors. ≥44px tap targets.</ux>
  <technical>lib/qr-code/* pure ≥80% unit coverage (encoder/contrast/svg); no React/Next deps. TS 0 errors. <800 lines per file. qrcode library ^1.5.x bundled locally. localStorage only, no network. Deterministic output (same input → same QR + data URL every time).</technical>
  <visual>DESIGN.md compliant; sky identity + brand honey-gold CTA. Bright, accessible color pickers. Canvas/SVG render match. Text readable on canvas.</visual>
  <performance>Tool route within platform budget. Live debounce prevents thrashing. Canvas render <100ms on modern browsers. CLS unaffected. LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). No prebuild hook needed (pure runtime). /[locale]/tools/qr-code pre-rendered by platform generateStaticParams iterating registry (status "live"). QR tool itself is SPA, no static artifact.</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Input mode detection + data formatting (text/url/wifi/vcard/email/sms).
    2. qrcode library integration: generateQR(data, ecc) → matrix.
    3. Canvas render from matrix + color application + logo overlay (optional).
    4. SVG export (hand-rolled <svg> from matrix).
    5. Contrast deltaE check + warn/block UX.
    6. Download (canvas.toBlob + clipboard.write + SVG blob).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/qr-code/{schema,types,encoder,contrast,svg-export}.ts Vitest (RED→GREEN): mode formatting, qrcode integration, canvas render logic, deltaE calc, SVG XML gen.
    2. useQRCode hook (qrcode dynamic import, encode debounced, localStorage).
    3. InputModeSelector + InputArea (text/URL/Wi-Fi/vCard/Email/SMS).
    4. QRPreview (canvas render).
    5. ECCSelector + SizeControls + ColorPickers + LogoUpload.
    6. DownloadButtons + ContrastWarning + Copy logic.
    7. Keyboard shortcuts, motion-reduce, a11y (axe).
    8. QRIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    9. Registry status→live; slug→component + generateMetadata; E2E 1–6; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥80% (encoder/contrast/svg); component catalog-injected qrcode mock; canvas mock (jsdom); E2E scenarios 1–6 (input modes, logo, contrast, keyboard, lang, motion); visual QR matrix content validation (data decoder optional).</testing_strategy>
</key_implementation_notes>

</project_specification>
```

Written QR Code Generator SPEC.md | 373 lines (within 250–400 target range).
