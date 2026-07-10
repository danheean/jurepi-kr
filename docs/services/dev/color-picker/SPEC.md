# Color Picker & Contrast Checker — Bidirectional color conversion and WCAG accessibility testing — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Color Picker & Contrast Checker** (컬러 피커·명도 대비) — a client-side dual-panel tool for color work: (1) **Picker/Converter** — native color input, optional EyeDropper API (graceful fallback), format conversion (HEX ↔ RGB(A) ↔ HSL ↔ OKLCH), one-click copy, shade/tint scale generation, saved palettes (localStorage), and (2) **WCAG Contrast Checker** — input foreground + background color pair, compute relative luminance (WCAG 2.1 formula, golden-tested), render pass/fail badges (AA/AAA × normal/large text), live text preview, swap colors, suggestion helper (find nearest passing color along lightness axis). All processing is pure domain logic, client-side, zero network, localStorage-persisted prefs, SPA on the platform shell.
> Internal service codename: `color-picker`. Registry id: `color-picker`. Public URL slug: `/[locale]/tools/color-picker`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/html-entity/SPEC.md`](../html-entity/SPEC.md)

```xml
<project_specification>

<project_name>Color Picker & Contrast Checker — Bidirectional color conversion and WCAG accessibility testing (Jurepi tool, codename color-picker, registry id color-picker)</project_name>

<overview>
Color Picker & Contrast Checker is a two-in-one utility for designers and developers. The tool addresses two everyday needs: (1) **color format conversion and visual exploration** — paste or enter a color as HEX, RGB, HSL, or OKLCH; the tool displays it and offers instant bidirectional conversion, one-click copy per format, a shade/tint scale (10 steps), and quick palette saves for later reuse. (2) **WCAG contrast compliance checking** — select or input a foreground and background color pair, and the tool computes their contrast ratio and instantly badges whether they meet AA/AAA standards for normal text (≥4.5:1 AA, ≥7:1 AAA) and large text (≥3:1 AA, ≥4.5:1 AAA). A live preview panel shows sample text at both sizes. A suggestion helper finds the nearest passing color by walking the lightness axis, so users can quickly adjust for compliance.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no network calls. All color math — space conversions (HEX ↔ RGB ↔ HSL ↔ OKLCH), contrast ratio computation (WCAG 2.1 relative luminance + Delta E), shade/tint generation — is pure JS, golden-tested. OKLCH conversion uses standard color-space matrices; no external color library needed (unless bundling overhead is unacceptable, in which case a well-tested library like polished or chroma.js is acceptable after cost/benefit analysis).

CRITICAL (EyeDropper API, graceful fallback): If the browser supports the EyeDropper API (Chromium 95+), show a dedicated eyedropper button that opens the system color picker. If unavailable (Safari, Firefox, older Chrome), hide the button gracefully — the native `<input type="color">` and manual entry remain fully functional. No feature detection dance or polyfill; just detect and hide.

CRITICAL (error handling, robustness): Invalid colors on input (bad hex format, out-of-range RGB, etc.) render friendly error and remain in input for user correction. Contrast checker works with any valid color pair; invalid input is caught upfront. Accessible color name lookup (e.g., "blue" → resolved color) is out-of-scope (MVP is format-based).

CRITICAL (usability-first, SPA): Every Jurepi tool is a client-side Single-Page Application mounted on the SSG shell. All interaction — color input, format selection, palette save/load, contrast pair selection, text-size toggle — happens via local React state with NO route navigation, NO full page reload. See color, see conversions, see contrast, done.
</overview>

<platform_integration>
  - Route: /[locale]/tools/color-picker (SSG; registry slug "color-picker", id "color-picker", status "coming_soon", accent "sky", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.color-picker.*` (UI chrome strings: panel labels, button text, format labels, contrast pass/fail messages, how-to, FAQ).
  - The `'dev'` category is now LIVE and fully wired. No category activation prerequisite.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **Bidirectional color format conversion**: HEX (3/6 digits, lowercase default), RGB (integers 0–255), RGBA (with alpha 0–1), HSL (hue 0–360, saturation/lightness 0–100), OKLCH (perceptual, per CSS Color Module 4).
    - **Native color input**: `<input type="color">` for point-and-click; manual entry fields for each format (single input or individual R/G/B/A fields, user preference).
    - **EyeDropper API** (optional, graceful fallback): If supported (Chromium 95+), show eyedropper button; on click, open system color picker, read pixel color, convert to selected format, populate main color. If unsupported, hide button (no error, no polyfill).
    - **Shade/tint scale**: Generate 10-step linear scale (e.g., darken/lighten along lightness axis in HSL or OKLCH) from a base color; display as swatches, one-click copy hex per swatch.
    - **Saved palette**: localStorage-backed list of user-saved colors (~20 max). Click to load into picker; delete-per-color. Persist across sessions.
    - **WCAG 2.1 Contrast Checker**: 
      - Foreground + background color inputs (use main color picker or dual inputs).
      - Compute contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` where L = relative luminance per WCAG formula.
      - Display ratio (e.g., "7.2:1").
      - Pass/fail badges for (Normal text AA: ≥4.5, AAA: ≥7, Large text AA: ≥3, AAA: ≥4.5).
      - Icons + text (never color-only signaling).
      - Live text preview: sample paragraph at normal (body size) and large (18px+) text sizes, rendered in fg/bg pair, updates live as colors change.
    - **Contrast suggestion helper**: If current pair fails a target level (e.g., Normal/AA), offer "Suggest color" button → compute nearest color along lightness axis that passes target → display suggestion with new ratio; user can accept (load into picker) or dismiss.
    - **Swap button**: Quick toggle foreground ⇄ background (useful for exploring both directions).
    - **Localized UI and long-form** (ko/en via tools.color-picker.*).
    - **Full keyboard support**: Tab through all inputs, Enter to confirm input, "c" to copy active hex, "/" to focus input.
    - **Tool-specific SEO long-form** ("Color spaces and why OKLCH?" / "WCAG contrast compliance" / "How to choose accessible colors" / guide) + FAQ (FAQPage JSON-LD), localized ko/en.
    - **Reduced-motion fallbacks**, WCAG 2.1 AA accessibility (including color-blind-safe contrast messaging).
  </in_scope>
  <out_of_scope>
    - Named color lookup by English name ("blue", "red", etc.) — too open-ended, scope remains format-based only.
    - Color harmony rules (complementary, triadic, etc.) — Phase 2.
    - APCA (WCAG 3 draft) contrast model — scope is WCAG 2.1 only; APCA as future_considerations.
    - Color-blindness simulators or daltonization tools — Phase 2.
    - Per-color deep-link state (e.g., `/tools/color-picker?color=ff0000`) — Phase 2.
  </out_of_scope>
  <future_considerations>
    - Deep-link state in URL query params (color, contrast pair) — Phase 2.
    - APCA (WCAG 3 draft) contrast model option — Phase 2 or 3.
    - Color harmony generator (complementary, triadic, etc.) — Phase 2.
    - Color-blindness simulator for visual testing — Phase 2 or 3.
    - Named color synonyms lookup (e.g., "navy" → #000080) — future, requires name database.
    - Accessible color palette generator (select N colors, auto-space by lightness) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <color_math note="Pure JS, zero external libs for MVP (or one battle-tested lib if justified)">
      - **HEX parsing & formatting**: Native `parseInt(hex, 16)` → RGB; RGB → `#RRGGBB` (pad zeros, lowercase).
      - **RGB ↔ HSL conversion**: Standard formulas (well-documented, golden-tested with vectors). Test emoji-hex round-trip (e.g., #ff0000 → rgb(255,0,0) → #ff0000).
      - **RGB ↔ OKLCH conversion**: CSS Color Module 4 matrices (Oklab intermediate space). Golden test with reference vectors from Color.js or similar (e.g., #ff0000 → oklch(63% 0.25 29) — exact values verified against canonical implementations).
      - **Relative luminance (WCAG)**: L = (R/255)^2.2 or (R/255)/12.92 (piecewise; same for G, B), then sum per WCAG formula. Golden tests: #000000 → 0, #ffffff → 1, #ffff00 → specific value verified.
      - **Contrast ratio**: (L_lighter + 0.05) / (L_darker + 0.05).
      - **Shade/tint generation**: Walk the lightness axis (HSL L or OKLCH L) in 10% steps (0–100 or equiv); return hex array.
      - **Nearest passing color search**: Binary search or hill-climb along L axis to find nearest color (in the same hue/chroma) that meets target contrast ratio.
      - All functions are pure, unit-tested, ≥90% coverage, exported for reuse.
    </color_math>
    <eyedropper_api note="Native browser API, graceful hide if unavailable">
      - Detect `window.EyeDropper` at mount time.
      - If present, show eyedropper button (20px lucide icon).
      - On click: `new EyeDropper().open()` → Promise resolves to `{ sRGBHex: "#RRGGBB" }`.
      - Convert to selected format (RGB, HSL, OKLCH, etc.) and populate picker.
      - If unsupported or user cancels (AbortError), gracefully handle (no error toast, just silent).
    </eyedropper_api>
    <validation>zod v3.x for color input schema (HEX format, RGB range 0–255, alpha 0–1, etc.). Single-source validation in domain layer.</validation>
    <localStorage>jurepi-color-picker key, zod-validated schema, palette array + prefs (active format, last colors). Fail gracefully (session-only fallback).</localStorage>
    <clipboard>navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail (secondary feature, always optional).</clipboard>
    <animation>Native CSS transitions only (color swatch fade, text preview update, pass/fail badge animate-in). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; reused for color input schema and store validation.</zod>
    <color_library_optional>If bundling pure color-math functions overshoots bundle size, evaluate battle-tested single-function libs: polished (MIT, tiny color utils), chroma.js (Apache 2, color manipulation + scales), or color.js (spec-aligned OKLCH, but larger). MVP assumes pure functions; lib is a Phase 1.5 cost-benefit decision if math size balloons.</color_library_optional>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/color-picker/                         # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                             # zod: ColorInput, ContrastInput, PaletteSchema, StoreSchema + validation helpers
│   ├── color-space.ts                        # Converters: hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToOklch, oklchToRgb, etc. (round-trip tested)
│   ├── luminance.ts                          # WCAG 2.1 relative luminance(color) → L ∈ [0,1]
│   ├── contrast.ts                           # Contrast ratio(fg, bg), wcag-level check (AA/AAA × normal/large), nearestPassingColor(fg, bg, target) suggestion
│   ├── scales.ts                             # generateShade(baseColor, steps=10), generateTint(…), linearScale(…)
│   ├── palette.ts                            # Immutable ops: addColor(palette, hex, max=20), removeColor(…), reorder(…)
│   └── vectors.ts                            # Test golden vectors (e.g., known HEX → RGB → HSL → OKLCH → back, reference colors)
├── components/tools/color-picker/
│   ├── ColorPicker.tsx                       # Orchestrator (Client Component) — picker/checker state + useColorPicker() owner
│   ├── useColorPicker.ts                     # Hook: localStorage palette/prefs, color conversion dispatcher
│   ├── ColorInput.tsx                        # Native color input + manual entry fields (tabs: HEX / RGB / HSL / OKLCH)
│   ├── EyedropperButton.tsx                  # Show if EyeDropper API available; graceful hide if not
│   ├── FormatTabs.tsx                        # Format selector (HEX / RGB / HSL / OKLCH) + copy button per format
│   ├── ColorSwatch.tsx                       # Visual swatch (square div with bg-color), aria-label with hex/rgb
│   ├── ShadeScale.tsx                        # 10-step shade/tint scale display (swatches) + one-click copy hex per step
│   ├── PalettePanel.tsx                      # Saved palette list (click to load, delete-per-color)
│   ├── ContrastChecker.tsx                   # Fg/Bg inputs, ratio display, pass/fail badges (AA/AAA × normal/large), swap button
│   ├── ContrastBadge.tsx                     # Single badge component (icon + text, level + size, pass/fail styling)
│   ├── TextPreview.tsx                       # Live preview paragraph: normal text (16px) + large text (18px+), rendered with fg/bg
│   ├── ContrastSuggestion.tsx                # "Suggest" button + suggestion card (show nearest passing color, new ratio, accept/dismiss)
│   ├── ColorPickerIntro.tsx                  # H1 + lead (SEO long-form intro)
│   ├── ColorPickerHowTo.tsx                  # "Color spaces and why OKLCH?" / "WCAG contrast" / "How to choose colors" (SEO long-form)
│   ├── ColorPickerFaq.tsx                    # Q&A + FAQPage JSON-LD
│   └── error/
│       └── InvalidColorError.tsx             # Render friendly error on bad input (bad hex, out-of-range RGB, etc.)
└── i18n/messages/{ko,en}.json                # tools.color-picker.* UI chrome (format names, contrast levels, how-to, FAQ)
</file_structure>

<core_data_entities>
  <color_input_state>
    - color: string (hex #RRGGBB, normalized lowercase)
    - format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'oklch' (active display format)
    - alpha?: number (0–1, only if RGBA or OKLCH with alpha)
  </color_input_state>
  <contrast_input_state>
    - foregroundColor: string (hex #RRGGBB)
    - backgroundColor: string (hex #RRGGBB)
  </contrast_input_state>
  <contrast_result note="derived from foreground + background">
    - ratio: number (e.g., 7.2)
    - wcagAA_normal: boolean (ratio ≥ 4.5)
    - wcagAA_large: boolean (ratio ≥ 3)
    - wcagAAA_normal: boolean (ratio ≥ 7)
    - wcagAAA_large: boolean (ratio ≥ 4.5)
  </contrast_result>
  <suggestion_result note="if contrast fails target level">
    - suggestedColor: string (hex #RRGGBB, nearest passing color on lightness axis)
    - newRatio: number
    - targetLevel: 'AA_normal' | 'AA_large' | 'AAA_normal' | 'AAA_large'
  </suggestion_result>
  <palette_item>
    - id: string (uuid or timestamp key)
    - hex: string (#RRGGBB)
    - label?: string (optional user-assigned name)
    - createdAt: number (unix timestamp)
  </palette_item>
  <store note="localStorage persistence">
    - version: number (starts at 1)
    - palette: PaletteItem[] (max 20)
    - prefs: { activeFormat: 'hex' | 'rgb' | … }
    - meta: { createdAt: number }
    localStorage key: `jurepi-color-picker`
  </store>
  <constants>
    - PALETTE_MAX = 20
    - SHADE_SCALE_STEPS = 10
    - WCAG_AA_NORMAL = 4.5
    - WCAG_AA_LARGE = 3
    - WCAG_AAA_NORMAL = 7
    - WCAG_AAA_LARGE = 4.5
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/color-picker" page="ColorPicker (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <color_picker>                     <!-- "use client"; owns color/contrast state + useColorPicker() -->
    <color_picker_intro />           <!-- H1 + lead (server-render where possible) -->
    <picker_layout>                  <!-- Main 2-panel or tab layout -->
      <picker_panel>                 <!-- Panel 1: Color picker/converter -->
        <color_input />              <!-- Native input + manual fields (tabs HEX/RGB/HSL/OKLCH) -->
        <eyedropper_button />        <!-- If EyeDropper API available (graceful hide if not) -->
        <format_tabs />              <!-- Format selector + copy buttons -->
        <color_swatch />             <!-- Visual display of current color -->
        <shade_scale />              <!-- 10-step scale (darken→lighten), one-click copy -->
        <palette_panel />            <!-- Saved colors, click to load, delete-per-item -->
      </picker_panel>
      <contrast_panel>               <!-- Panel 2: WCAG contrast checker -->
        <contrast_input_section>     <!-- Fg/Bg color pickers -->
          <contrast_color_input fg_or_bg="fg" />
          <swap_button />            <!-- Quick toggle fg ⇄ bg -->
          <contrast_color_input fg_or_bg="bg" />
        </contrast_input_section>
        <contrast_result_section>
          <ratio_display />          <!-- "7.2:1" -->
          <contrast_badges />        <!-- AA_normal, AA_large, AAA_normal, AAA_large (pass/fail) -->
          <text_preview />           <!-- Live preview at normal + large sizes -->
          <contrast_suggestion />    <!-- "Suggest" button → nearest passing color + new ratio -->
        </contrast_result_section>
      </contrast_panel>
    </picker_layout>
    <color_picker_how_to />          <!-- SEO long-form guide -->
    <color_picker_faq />             <!-- FAQPage JSON-LD -->
  </color_picker>
  <note>SPA within tool: all state changes (color input, format selection, contrast pair, palette ops) are local React state, NO route navigation. Both panels stay in view (or tabbed on mobile).</note>
</component_hierarchy>

<pages_and_interfaces>
  <color_picker_intro>
    - Eyebrow: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px letter-spacing, var(--brand).
    - H1: "컬러 피커·명도 대비" / "Color Picker & Contrast Checker" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "색상을 입력하고 다양한 형식으로 변환하세요. WCAG 명도 대비를 실시간으로 확인해 접근 가능한 색상 쌍을 선택하세요." / English equivalent.
  </color_picker_intro>

  <color_input>
    - DESIGN text-input style + native `<input type="color">` (side-by-side or stacked). Placeholder "Enter hex, RGB, HSL, or OKLCH…".
    - Format tabs (radio or segmented): HEX / RGB / HSL / OKLCH.
    - When format selected, show input fields for that format (HEX: single input; RGB: R/G/B/A sliders or number inputs; HSL: H/S/L inputs; OKLCH: O/K/L/C/H inputs).
    - Validation on blur; error card if malformed (non-hex, RGB out of range, etc.).
    - aria: role="group", aria-label "Color format selector", each format input aria-label.
  </color_input>

  <eyedropper_button>
    - Icon button (eyedropper lucide icon, 20px).
    - Only render if `window.EyeDropper` exists (graceful feature detect, no polyfill).
    - On click: `new EyeDropper().open()` → resolve sRGBHex → convert to selected format → update color input.
    - If unsupported or user cancels, silently no-op (no error toast).
    - Tooltip: "Pick a color from the screen" / "화면에서 색상 선택".
  </eyedropper_button>

  <format_tabs>
    - Display 4 tabs (or buttons): HEX / RGB / HSL / OKLCH.
    - Active tab shows the current color in that format (computed on-the-fly from canonical hex).
    - Each tab has a "Copy" button (clipboard → success toast "✓ Copied" 1600ms, or silent fail).
    - Example outputs:
      - HEX: `#ff0000`
      - RGB: `rgb(255, 0, 0)` or `rgba(255, 0, 0, 1)`
      - HSL: `hsl(0, 100%, 50%)`
      - OKLCH: `oklch(63% 0.25 29)`
    - Accent color sky (var(--accent-sky) / var(--accent-sky-soft)).
  </format_tabs>

  <shade_scale>
    - Generate 10 swatches: shade-9 (darkest) → shade-0 (original) → shade+9 (lightest), or equiv.
    - Each swatch is a 40px × 40px square with bg-color, inline or grid layout.
    - Hover: show hex value + copy button (or click swatch to copy hex).
    - Keyboard: Tab through swatches, Enter/Space to copy.
    - Example: base #ff0000 → swatches from near-black (darkened) to near-white (tinted).
  </shade_scale>

  <palette_panel>
    - Collapsible or always-visible panel: "Saved Colors" / "저장된 색상".
    - List of saved colors (max 20): swatches + optional label + delete button.
    - "Save current" button → add to palette (toast "✓ Saved", or error if at max).
    - Click swatch to load into main picker.
    - Delete button (trash icon) per color.
    - localStorage auto-sync.
  </palette_panel>

  <contrast_input_section>
    - Two color pickers (labeled "Foreground" / "Background", ko: "글자색" / "배경색").
    - Each picker: native color input + eyedropper (if available) + format tabs (live display).
    - Swap button (bidirectional arrow icon, labeled "Swap colors" / "색상 교환"): click to swap fg ↔ bg (contrast re-computes instantly).
  </contrast_input_section>

  <ratio_display>
    - Large text, monospace: "7.2:1" (or "3:1", etc.).
    - Placed prominently; updates live as colors change.
    - aria-live="polite" for screen readers (ratio change announced).
  </ratio_display>

  <contrast_badges>
    - 4 badges in a 2×2 grid or row:
      - "Normal text AA" / "일반 텍스트 AA" (4.5:1 threshold)
      - "Normal text AAA" / "일반 텍스트 AAA" (7:1 threshold)
      - "Large text AA" / "큰 텍스트 AA" (3:1 threshold)
      - "Large text AAA" / "큰 텍스트 AAA" (4.5:1 threshold)
    - Each badge: icon (checkmark ✓ for pass, cross ✗ for fail, or ✓/— if borderline) + text label.
    - Color: green (semantic-success or accent-mint) for pass, gray/red for fail (never color-only — icon + text always).
    - aria-label: "Passes WCAG AA for normal text" or "Fails…" (precise wording per level).
  </contrast_badges>

  <text_preview>
    - Two sample text blocks: one at normal size (16px, body), one at large (18px or 24px).
    - Same text in both: "The quick brown fox jumps over the lazy dog. 0123456789 !@#$%^&*()" or localized equiv.
    - Rendered with current fg/bg pair: {color: foreground, backgroundColor: background}.
    - Updates live as colors change.
    - aria: role="region", aria-label "Contrast preview at normal and large text sizes".
  </text_preview>

  <contrast_suggestion>
    - If current ratio fails a target level (user selects target or auto-check first failing level), show "Suggest" button.
    - On click: compute nearest color (along lightness axis, same hue/chroma) that passes target → display:
      - Suggested color (swatch + hex).
      - New ratio (e.g., "4.5:1" now passes).
      - Approve/Dismiss buttons: Approve → load suggested color into foreground picker (auto-updates ratio).
    - Non-blocking; user can ignore and try manual edit.
  </contrast_suggestion>

  <keyboard_shortcuts>
    - "/" (when not typing) → focus first color input.
    - "c" → copy active hex to clipboard.
    - "s" → swap foreground ⇄ background (in contrast checker).
    - Tab → standard keyboard nav through all inputs/buttons.
    - Enter → confirm color input (blur event).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <color_conversion note="All bidirectional, round-trip tested">
    - HEX ↔ RGB: `parseInt(hex.slice(1), 16)` → [R, G, B]; reverse: pad zeros, lowercase.
    - RGB ↔ HSL: Standard algorithm (search "RGB to HSL formula"); hue ∈ [0, 360), sat/light ∈ [0, 100].
    - RGB ↔ OKLCH: CSS Color Module 4 spec (Oklab intermediate); golden-tested vectors.
    - OKLCH ↔ RGB: Reverse of above.
    - All conversions preserve alpha if present (0–1 range).
    - Round-trip: any color → any format → back = pixel-perfect original (unit tests verify).
  </color_conversion>
  <wcag_contrast note="WCAG 2.1 relative luminance + ratio">
    - Relative luminance L = sum of weighted sRGB values (piecewise function, gamma-linear + gamma-compressed channels).
    - Contrast ratio = (L_light + 0.05) / (L_dark + 0.05).
    - Pass/fail check per level (AA_normal 4.5, AAA_normal 7, etc.).
    - Golden tests: known color pairs with expected ratios verified against spec examples.
  </wcag_contrast>
  <shade_scale note="Immutable">
    - generateShade(baseColor, steps=10) → array of hex colors.
    - Walk lightness axis (HSL L or OKLCH L) from 0 to 100 in equal steps.
    - Return array (darkest first or lightest first, user pref).
    - Example: base #ff0000 (L=50 in HSL) → [#000000 (L=0), #330000 (L=10), …, #ff0000 (L=50), …, #ffcccc (L=90), #ffffff (L=100)].
  </shade_scale>
  <palette_ops note="Immutable">
    - addColor(palette, hex, label?) → new array (insert at front, de-duplicate, truncate to max=20).
    - removeColor(palette, id) → new array (filter out by id).
    - Save/load from localStorage (zod-validated on load, graceful fail).
  </palette_ops>
  <contrast_suggestion note="Nearest passing color">
    - nearestPassingColor(fgColor, bgColor, targetLevel) → suggestedColor.
    - Algorithm: binary search or linear walk along lightness axis (keep hue/chroma constant, vary L).
    - Return first color that achieves targetLevel contrast; if none exists (edge case: bg nearly white/black), return best-effort color.
  </contrast_suggestion>
  <i18n>All UI chrome from tools.color-picker.* (ko/en): format labels, contrast level labels, button text, error/info messages, how-to, FAQ.</i18n>
</core_functionality>

<error_handling>
  <invalid_color_input>Bad hex (wrong length, non-hex chars), RGB out of range (>255 or <0), HSL invalid (H>360, S>100, etc.) → render friendly error card ("Invalid color format: expected HEX #RRGGBB or RGB 0–255"). Allow user to correct input; no crash.</invalid_color_input>
  <eyedropper_unavailable>EyeDropper API not available (Safari, Firefox, old Chrome) → gracefully hide button. User can still use native color input or manual entry. No error message or polyfill fallback.</eyedropper_unavailable>
  <eyedropper_user_cancel>User opens EyeDropper but cancels (or closes system picker) → AbortError caught, silent no-op. No error toast.</eyedropper_user_cancel>
  <empty_input>Empty color input is invalid; require at least hex or a single RGB value. Validation fails, error card shown.</empty_input>
  <storage_unavailable>Private mode → palette in-memory (session-only), no error message (graceful degradation).</storage_unavailable>
  <copy_failure>clipboard.writeText fail → silent (secondary feature; never show false success toast).</copy_failure>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SKY (var(--accent-sky) / var(--accent-sky-soft)) — "dev" category identity per this SPEC's accent choice. Format tabs active state, contrast pass badges (green accent override), copy button success state.
    - Primary buttons (Swap, Suggest, Save) use brand honey-gold var(--brand) for clear CTA.
  </accent_usage>
  <surfaces>Color inputs = var(--surface) + 1px var(--hairline); swatch displays = var(--surface-muted) if empty, actual color otherwise. Result/suggestion cards radius var(--radius-lg); layout cards radius var(--radius-xl). Soft shadows (--shadow-sm / --shadow-card).</surfaces>
  <typography>H1 Gmarket Sans clamp(28–40px)/700; format labels Pretendard 14px/600; ratio display monospace 24px/1.4; contrast badges body-sm 14px var(--text-secondary).</typography>
  <motion>transform/opacity: swatch fade-in (opacity 0→1) 150ms, badge pulse (scale 1→1.02→1) 200ms if pass/fail changes, text preview smooth update (no animation, just live). All gated by prefers-reduced-motion (instant).</motion>
  <accessibility>All inputs have aria-label; buttons labeled (icon + tooltip); contrast badges use icon + text (never color-only). Focus-ring visible var(--focus-ring) 2px. Text preview has aria-label and aria-live="polite". ≥44px tap targets. WCAG AA contrast badge colors themselves verified for contrast against surface.</accessibility>
  <responsive>
    - ≥1024px: 2-panel side-by-side (picker left, checker right).
    - 768–1023px: panels stacked vertically.
    - <768px: single column, collapsible panels (tabs or accordion).
  </responsive>
  <atmosphere>Technical, precise, clarity-focused. Monospace for ratio and hex values, large swatches for visual confidence. Accent (sky) distinct from other dev tools (html-entity=coral, url-encoder=grape).</atmosphere>
  <icons>lucide-react: Pipette (eyedropper), Copy (copy hex), Trash (delete from palette), ArrowLeftRight (swap fg/bg), Plus (add to palette). Default 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>User-entered color values are hex/RGB/HSL/OKLCH strings and numbers; parsed locally, no HTML rendering. All output is CSS color values (never dangerouslySetInnerHTML). No user-supplied colors are ever executed or eval'd.</input>
  <clipboard>User-initiated copy only (button or Ctrl+C shortcut); never read clipboard. No data sent to network.</clipboard>
  <eyedropper>EyeDropper API is a standard browser feature; resolved color comes from OS system picker (trusted). No external service involved.</eyedropper>
  <localStorage>Palette is plaintext hex strings only (no sensitive data, tool assumes user input is color data). localStorage is local-device only, isolated per browser/profile.</localStorage>
  <network>Zero network calls (all color math is JS, synchronous).</network>
  <note>No secrets, no auth, no API calls, no server-side processing.</note>
</security_considerations>

<advanced_functionality>
  <format_conversion>Six-way conversion (HEX ↔ RGB ↔ HSL ↔ OKLCH, all bidirectional, alpha support). Round-trip tested; pixel-perfect accuracy.</format_conversion>
  <eyedropper_api>Graceful feature detection (no polyfill, just hide if unsupported). Chromium 95+ works; older browsers and Safari/Firefox degrade to manual entry only.</eyedropper_api>
  <shade_scale>10-step linear scale (darken/lighten); user can select base and generate palette on the fly. Useful for design systems.</shade_scale>
  <wcag_contrast>Dual-level checking (AA + AAA) × 2 sizes (normal + large). Live preview with sample text. Suggestion helper finds nearest passing color in one operation.</wcag_contrast>
  <palette_persistence>Save up to 20 colors locally; click to reuse. Useful for iterative color picking (try + save candidates, compare later).</palette_persistence>
  <color_blind_safe_ui>Contrast badges never signal pass/fail by color alone — always icon + text (checkmark / cross). Ratio text is monospace and large enough for clarity.</color_blind_safe_ui>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Convert HEX color to all formats and copy each</description>
    <steps>
      1. Input color: `#ff0000` (red).
      2. Verify format tabs display correctly:
         - HEX: `#ff0000`
         - RGB: `rgb(255, 0, 0)`
         - HSL: `hsl(0, 100%, 50%)`
         - OKLCH: `oklch(63% 0.25 29)`
      3. Click copy button for each format → verify clipboard.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>EyeDropper button visible and functional (if available)</description>
    <steps>
      1. Detect platform (Chromium 95+?).
      2. If yes: eyedropper button visible; click → system picker opens.
      3. Select a color (or cancel) → if selected, color loads into picker.
      4. If no (Safari/Firefox): eyedropper button hidden; no error.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Shade scale generation and copy</description>
    <steps>
      1. Base color: `#0088ff` (sky blue).
      2. Generate shade scale → 10 swatches (dark → base → light).
      3. Click swatch 5 → copy hex.
      4. Verify hex value in clipboard matches swatch color.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Contrast checker: pass and fail scenarios</description>
    <steps>
      1. Fg: `#000000` (black), Bg: `#ffffff` (white) → ratio `21:1` (passes all levels).
      2. Verify 4 badges all show checkmark (pass).
      3. Change Fg: `#999999` (medium gray) → ratio drops to ~2.4:1 (fails all).
      4. Verify 4 badges all show cross (fail).
      5. Text preview visible in both cases, readable in case 1, low contrast in case 2.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Contrast suggestion: find nearest passing color</description>
    <steps>
      1. Fg: `#cc0000` (dark red), Bg: `#ffffff` (white) → ratio ~3.9 (fails AA_normal 4.5).
      2. Click "Suggest for AA Normal" → new fg computed (e.g., darker red to reach 4.5+).
      3. Display suggestion: new fg hex + new ratio (e.g., "4.5:1 passes AA Normal").
      4. Click "Accept" → load new fg into picker; ratio badge updates.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>Save and load from palette</description>
    <steps>
      1. Pick color `#ffaa00` (orange).
      2. Click "Save to palette" → toast "✓ Saved".
      3. Change to different color `#0088ff`.
      4. Palette panel shows saved orange swatch.
      5. Click saved swatch → load into picker (color changes to `#ffaa00`).
      6. Refresh page → palette persists (localStorage).
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>Invalid color input handling</description>
    <steps>
      1. Enter invalid hex: `#gg0000` (invalid hex char).
      2. Blur input → error card: "Invalid color format…".
      3. Clear and enter valid hex `#ff0000` → error clears, color loads.
    </steps>
  </test_scenario_7>
  <test_scenario_8>
    <description>Swap foreground and background</description>
    <steps>
      1. Fg: `#ff0000`, Bg: `#0000ff` → ratio (compute).
      2. Click swap button.
      3. Fg: `#0000ff`, Bg: `#ff0000` → ratio re-computed (same value, reversed roles).
      4. Verify badges update (if asymmetric ratio, order matters for which "passes").
    </steps>
  </test_scenario_8>
</final_integration_test>

<success_criteria>
  - [x] All color conversion functions are pure, testable, ≥90% coverage, round-trip tested.
  - [x] HEX ↔ RGB ↔ HSL ↔ OKLCH conversions are accurate and bidirectional.
  - [x] WCAG 2.1 relative luminance and contrast ratio computed correctly (golden-tested).
  - [x] Contrast checker displays pass/fail for AA/AAA × normal/large (4 levels).
  - [x] EyeDropper API gracefully detected and hidden if unavailable (no polyfill).
  - [x] Shade/tint scale generates 10 steps correctly; one-click copy works.
  - [x] Palette saves/loads from localStorage; persists across sessions (max 20).
  - [x] Contrast suggestion finds nearest passing color (valid for all valid pairs).
  - [x] Text preview updates live as colors change; both normal and large sizes visible.
  - [x] SPA state management is local (no route navigation).
  - [x] Keyboard shortcuts work (/, c, s, Tab, Enter).
  - [x] WCAG 2.1 AA: focus ring, aria labels, ≥44px tap targets, prefers-reduced-motion respected, contrast badges never color-only.
  - [x] Responsive design: 2-panel desktop, stacked mobile, collapsible on small screens.
  - [x] SEO long-form (Intro/HowTo/FAQ) includes contrast guidance (SSR'd, no mounted gate).
  - [x] FAQPage JSON-LD emitted by `<ColorPickerFaq>` component (single owner, no route duplication).
  - [x] SoftwareApplication + BreadcrumbList JSON-LD via route StructuredData (url == canonical).
  - [x] llms.txt entry + sitemap auto-entry (single-page tool).
  - [x] SNS share buttons wired automatically by route template.
  - [x] i18n: tools.color-picker.* namespace with ko/en.
  - [x] Accent color (sky) used consistently; only real tokens from DESIGN.md.
  - [x] Error boundary wraps tool; no unhandled rejections.
  - [x] E2E tests cover all 8 scenarios above + invalid input, storage unavailable, eyedropper fallback.
  - [x] Production build: bundle size within budget (<80KB JS gzipped for dev/converter category).
</success_criteria>

<build_output>
Registry entry:
```js
{
  id: 'color-picker',
  slug: 'color-picker',
  category: 'dev',
  icon: 'Pipette', // or dedicated icon
  accent: 'sky',
  status: 'coming_soon', // → 'live' after first deployment
  addedAt: 'YYYY-MM-DD', // fill in implementation date
  order: 10, // position in dev tools list
  keywords: ['color', 'contrast', 'wcag', 'hex', 'rgb', 'hsl', 'oklch', '컬러', '명도'],
}
```

File structure committed to `/src/`:
- `lib/color-picker/` — domain layer (7–8 files, ≥250 lines, unit tests)
- `components/tools/color-picker/` — UI layer (10–14 components, ≥200 lines, integration tests)
- `i18n/messages/{ko,en}.json` — updated with `tools.color-picker.*` namespace (ko/en)

Test artifacts:
- Domain unit tests: `lib/color-picker/*.test.ts` (6–8 files, ≥500 lines total, ≥90% coverage)
- Component tests: `components/tools/color-picker/*.test.tsx` (4–6 files, ≥300 lines total)
- E2E tests: `tests/e2e/color-picker.spec.ts` (≥12 scenarios, core workflows + EyeDropper fallback)
</build_output>

<key_implementation_notes>
  - **Registry entry**: id `color-picker`, slug `color-picker`, category `dev`, accent `sky`, status `coming_soon`, order step (e.g., 10, distinct from other dev tools). Add `addedAt: 'YYYY-MM-DD'` (required for NEW badge derivation).
  - **Color math**: Implement pure JS functions for all conversions (HEX↔RGB↔HSL↔OKLCH). If bundle size balloons, evaluate battle-tested libs like polished or chroma.js post-MVP. WCAG luminance and contrast ratio must be golden-tested against known reference values.
  - **EyeDropper graceful fallback**: Detect `window.EyeDropper` at component mount; show button only if available. No polyfill or fallback UI. Catch AbortError (user cancel) silently.
  - **Domain-first approach**: All color conversion and WCAG math is pure, exported domain logic, fully tested, reusable. Domain layer ≥90% coverage.
  - **SEO long-form**: Intro (H1 + lead) + HowTo (explain color spaces, OKLCH vs HSL, WCAG levels, practical tips) + FAQ. All rendered OUTSIDE the tool component's `mounted` gate.
  - **i18n critical**: tools.color-picker.* namespace (ko/en). Format labels (HEX, RGB, HSL, OKLCH), contrast level labels (AA, AAA, normal, large), button text, error/info messages, HowTo, FAQ. All user-facing strings localized.
  - **Accessibility non-negotiable**: Contrast badges **never** signal pass/fail by color alone — always icon (✓/✗) + text label. Text preview is large and readable. All inputs have aria-label. ≥44px tap targets.
  - **Testing strategy**: TDD → domain tests first (RED) → color conversion round-trips, contrast ratio golden vectors → component tests (input/output behavior, EyeDropper graceful hide) → E2E (8 scenarios + invalid input + EyeDropper unavailable). All paths tested with edge-case colors (#000000, #ffffff, grays, saturated hues).
  - **Recommended implementation order**: (1) Domain layer (color conversion, WCAG math, scales). (2) Color picker input + format tabs. (3) Contrast checker (ratio, badges, text preview). (4) Shade scale & palette. (5) EyeDropper button (graceful hide if unavailable). (6) Suggestion helper. (7) SEO sections (Intro/HowTo/Faq). (8) i18n sync (ko/en). (9) E2E tests & polish.
</key_implementation_notes>

</project_specification>
```
