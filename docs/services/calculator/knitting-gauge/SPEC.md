# 뜨개질 게이지 계산기 (Knitting Gauge Calculator — stitches/rows ↔ dimensions) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **뜨개질 게이지 계산기 / Knitting Gauge Calculator** (Korean display name: **뜨개질 게이지 계산기**; English display name: *Knitting Gauge Calculator*) — a client-side calculator that turns a knitter's (or crocheter's) **swatch gauge** (stitches and rows measured over a known length) into the numbers they actually need: how many **stitches to cast on** and **rows to knit** for a target finished width/length, and how to **rescale a pattern** written for a different gauge to their own. Supports cm/inch units and a 10cm/4inch gauge convention. 100% client-side, pure math, localStorage for recent projects. The tool mounts as a client-side SPA on the platform shell.
>
> Internal service codename: `knitting-gauge`. Registry id: `knitting-gauge`. Public URL slug: `/[locale]/tools/knitting-gauge`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same interactive-utility pattern): [`docs/services/calculator/age-calculator/SPEC.md`](../age-calculator/SPEC.md)

```xml
<project_specification>

<project_name>뜨개질 게이지 계산기 (Knitting Gauge Calculator) — convert swatch gauge to cast-on stitches/rows and rescale patterns (Jurepi tool, codename knitting-gauge, registry id knitting-gauge)</project_name>

<overview>
뜨개질 게이지 계산기 (Knitting Gauge Calculator) answers the questions every knitter faces before casting on. From a **gauge swatch** — "I got 22 stitches and 30 rows over 10 cm" — the tool computes three things: (1) **Dimensions → stitches/rows**: for a target finished size (e.g., 50 cm wide × 30 cm tall) how many stitches to cast on and rows to knit; (2) **Stitches/rows → dimensions**: how big a given stitch/row count will come out at this gauge; (3) **Pattern rescale**: a pattern says "cast on 100 sts" at its gauge, but your gauge differs — what count gives the same finished size with your yarn/needles. Units toggle between **cm and inch**, with the standard 10 cm (4 inch) swatch convention, and results round to whole stitches/rows with the exact value shown.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no network calls. All math is pure JavaScript arithmetic. The only first-party persistence is localStorage (recent projects/gauges). Nothing is ever sent over the network.

CRITICAL (correctness — the whole point is the math): gauge = stitches per unit length. stitchesFor(width) = width × (stitchCount / swatchWidth); rowsFor(length) = length × (rowCount / swatchHeight); rescale(count, fromGauge, toGauge) = count × (toGauge / fromGauge). Unit conversion cm↔inch (1 inch = 2.54 cm) must be exact and applied consistently. Results are rounded to whole counts for casting on, but the precise fractional value and the resulting actual dimension (given the rounded count) are shown so the knitter understands the trade-off. All formulas are pure and unit-tested with known fixtures.

CRITICAL (usability-first, SPA): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — entering gauge, switching mode, toggling units, reading results — happens via local React state with NO route navigation and NO full page reload. Enter gauge once; it feeds all three modes.
</overview>

<platform_integration>
  - Route: /[locale]/tools/knitting-gauge (SSG; registry slug "knitting-gauge", id "knitting-gauge", status "coming_soon", accent "sun", category "calculator").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons.
  - Consumes: i18n namespace `tools.knitting-gauge.*` (UI chrome strings: mode labels, field labels, unit labels, result labels, how-to, FAQ — NOT user numbers). MUST include top-level `tools.knitting-gauge.title` and `tools.knitting-gauge.description` (consumed by dashboard card, footer, searchable-tools index).
  - Platform dependency (category note): lives in the `'calculator'` category (계산기), already active. Adds ONE ToolMeta registry entry, a slug→component branch, and a generateMetadata branch. Single-page interactive utility → NO spoke routes.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **Gauge input**: stitches count + rows count measured over a swatch of a given size (default 10 cm / 4 in each direction, editable); unit toggle cm/inch. Optional needle size + yarn weight note (free text, not used in math).
    - **Mode 1 — Dimensions → stitches/rows**: target width + length → cast-on stitches + rows (rounded, exact shown, actual resulting size shown).
    - **Mode 2 — Stitches/rows → dimensions**: given stitch/row counts → finished width/length at this gauge.
    - **Mode 3 — Pattern rescale**: pattern stitch/row count at a pattern gauge (sts/rows per unit) → equivalent count at the user's gauge for the same finished size.
    - **Units**: cm ↔ inch toggle, 10 cm / 4 inch swatch convention; exact 2.54 conversion; consistent display.
    - **Rounding transparency**: round to whole stitches/rows, but show the precise fractional value and the actual dimension the rounded count produces (± difference).
    - **Recent projects/gauges**: save a named gauge/project; recents in localStorage (auto-prune invalid).
    - **Copy results** (summary text).
    - **Localized UI chrome** (ko/en via tools.knitting-gauge.*), locale-aware number formatting.
    - **Full keyboard + a11y**: labeled numeric inputs, mode tabs, unit toggle.
    - **Tool-specific SEO long-form** ("게이지란?" / "게이지 내는 법" / "패턴 게이지 환산") + FAQ (FAQPage JSON-LD), localized ko/en.
    - **Reduced-motion fallbacks**; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Shaping/decrease/increase distribution calculators (e.g., "decrease evenly across N stitches") — Phase 2 candidate.
    - Yarn quantity / yardage estimator — Phase 2.
    - Garment size charts / pattern generator — out of scope.
    - Backend, accounts, cloud sync.
    - Deep-link URLs with pre-filled values — Phase 2.
  </out_of_scope>
  <future_considerations>
    - "Decrease/increase evenly" distributor — Phase 2.
    - Yardage estimator from gauge + dimensions — Phase 2.
    - Circular/pattern-repeat aware casting-on (round to nearest repeat multiple) — Phase 2.
    - Crochet-specific presets — data only.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — inherited from platform.</inherited>
  <module_specific>
    <math>Pure arithmetic. gauge helpers: stitchesPerUnit = stitchCount/swatchWidth; stitchesFor(width), rowsFor(length), dimensionFor(count), rescale(count, fromPerUnit, toPerUnit). Unit conversion cmToIn/inToCm (×/÷ 2.54). All pure, deterministic, unit-tested with known fixtures. Rounding kept at the presentation boundary; domain returns exact numbers + rounded + actualDimension.</math>
    <validation>zod v3.x for input schema (positive numbers, non-zero swatch sizes → guard divide-by-zero) and localStorage store schema.</validation>
    <localStorage>jurepi-knitting-gauge key, zod-validated, auto-prune invalid on load, in-memory fallback.</localStorage>
    <i18n_numbers>Locale-aware number formatting via useLocale() → Intl.NumberFormat; no hardcoded units/labels in components.</i18n_numbers>
    <animation>Native CSS transitions only (mode switch, result update). No animation library.</animation>
  </module_specific>
  <libraries><zod>zod (in repo) — input + store validation.</zod></libraries>
</technology_stack>

<file_structure>
src/
├── lib/knitting-gauge/                        # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                              # zod: GaugeSchema (stitches/rows/swatchW/swatchH/unit), StoreSchema + STORE_VERSION
│   ├── units.ts                               # cmToIn/inToCm (×2.54), toBaseCm/fromBaseCm normalization
│   ├── gauge.ts                               # stitchesPerUnit/rowsPerUnit, stitchesFor, rowsFor, dimensionFor, rescale, withActual (rounded + actual dim + delta)
│   └── store.ts                               # Immutable ops: saveProject, removeProject, pushRecent, pruneInvalid, serialize/deserialize
├── components/tools/knitting-gauge/
│   ├── KnittingGauge.tsx                      # Orchestrator (Client Component) — gauge/mode/unit state + useKnittingGauge() owner
│   ├── useKnittingGauge.ts                    # Hook: localStorage projects/recents + derived calculations
│   ├── GaugeInput.tsx                         # stitches/rows over swatch size + unit toggle + optional needle/yarn note
│   ├── ModeTabs.tsx                           # Dimensions→counts / counts→Dimensions / Pattern rescale
│   ├── DimToCounts.tsx                        # Mode 1: width/length → cast-on stitches + rows (rounded + exact + actual)
│   ├── CountsToDim.tsx                        # Mode 2: stitch/row counts → finished width/length
│   ├── PatternRescale.tsx                     # Mode 3: pattern count @ pattern gauge → your count
│   ├── ResultCard.tsx                         # Result display: rounded value, exact value, actual dimension ±delta, copy
│   ├── SavedProjects.tsx                      # localStorage saved gauges/projects (apply/delete)
│   ├── KnittingGaugeIntro.tsx                 # H1 + lead (SEO; gate-free SSR)
│   ├── KnittingGaugeHowTo.tsx                 # "게이지란/내는 법/패턴 환산" (SEO long-form, gate-free SSR)
│   └── KnittingGaugeFaq.tsx                   # Q&A + FAQPage JSON-LD (visible faq.items, Faq single owner)
└── i18n/messages/{ko,en}.json                # tools.knitting-gauge.* UI chrome (top-level title/description, mode/field/unit/result labels, how-to, FAQ)
</file_structure>

<core_data_entities>
  <gauge note="React state + persisted">
    - stitches: number (>0) — stitch count in the swatch
    - rows: number (>0) — row count in the swatch
    - swatchW: number (>0) — swatch width (in current unit; default 10 cm / 4 in)
    - swatchH: number (>0) — swatch height (default 10 cm / 4 in)
    - unit: "cm" | "inch" (default "cm")
    - note?: string — optional needle size / yarn (not used in math)
    INVARIANT: all sizes/counts > 0 (guard divide-by-zero); zod-enforced.
  </gauge>
  <result note="derived, not persisted">
    - value: number (exact) ; rounded: number (whole sts/rows or cm/inch) ; actual?: number (dimension the rounded count actually yields) ; delta?: number (actual − target)
  </result>
  <store note="single localStorage blob">
    - version: number (STORE_VERSION)
    - projects: Array<{ name: string; gauge: Gauge }>
    - recents: Gauge[] (RECENTS_MAX)
    - meta: { createdAt: number }
    localStorage key: `jurepi-knitting-gauge`
    INVARIANT: zod-parsed on read; fail → fresh (no throw); invalid pruned.
  </store>
  <constants>
    - DEFAULT_SWATCH_CM = 10; DEFAULT_SWATCH_IN = 4; IN_TO_CM = 2.54; RECENTS_MAX = 10; PROJECTS_MAX = 50.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes><route path="/:locale/tools/knitting-gauge" page="KnittingGauge (SPA, single page)" /></public_routes>
  <note>Single interactive utility — NO spoke routes. locale ∈ {ko, en}. Platform generateStaticParams SSGs the route for both locales.</note>
</route_definitions>

<component_hierarchy>
  <knitting_gauge>                 <!-- "use client"; owns gauge + mode + unit + useKnittingGauge() -->
    <knitting_gauge_intro />       <!-- H1 + lead (SEO; gate-free SSR) -->
    <workspace>
      <gauge_input />              <!-- stitches/rows over swatch + unit toggle -->
      <mode_tabs />               <!-- 3 modes -->
      <mode_panel>                <!-- DimToCounts | CountsToDim | PatternRescale -->
        <result_card />           <!-- rounded + exact + actual ± delta + copy -->
      </mode_panel>
      <saved_projects />          <!-- localStorage projects -->
    </workspace>
    <knitting_gauge_how_to />      <!-- SEO long-form (gate-free SSR) -->
    <knitting_gauge_faq />         <!-- FAQPage JSON-LD (single owner) -->
    <structured_data />            <!-- SoftwareApplication (tool meta), gate-free -->
  </knitting_gauge>
  <note>SEO sections (Intro/HowTo/Faq/StructuredData) render OUTSIDE any `mounted` gate for prerender. Calculations are pure (no browser API) so the workspace can SSR too; localStorage hydration only affects saved projects.</note>
</component_hierarchy>

<pages_and_interfaces>
  <knitting_gauge_intro>
    - Eyebrow: "뜨개질 계산기" / "KNITTING CALCULATOR". H1: "뜨개질 게이지 계산기" / "Knitting Gauge Calculator".
    - Lead: "게이지(10cm 안의 코·단 수)만 입력하면 원하는 크기에 필요한 코 수·단 수를 계산하고, 다른 게이지의 패턴도 내 게이지로 환산해 드려요." / English equivalent.
  </knitting_gauge_intro>
  <gauge_input>
    - Fields: stitches, rows, swatch width, swatch height (default 10cm/4in), unit toggle (cm/inch). Optional needle/yarn note. Labeled (getByLabelText); positive-number validation; divide-by-zero guarded (swatch size >0).
  </gauge_input>
  <mode_tabs>
    - Tabs: "크기 → 코·단 수" / "코·단 수 → 크기" / "패턴 환산". role=tablist, ArrowLeft/Right, aria-selected. Gauge is shared across modes.
  </mode_tabs>
  <dim_to_counts>
    - Inputs target width + length → ResultCard(cast-on stitches) + ResultCard(rows): rounded whole count + exact value + actual finished size the rounded count yields (± delta).
  </dim_to_counts>
  <counts_to_dim>
    - Inputs stitch count + row count → finished width + length at this gauge (in current unit).
  </counts_to_dim>
  <pattern_rescale>
    - Inputs pattern gauge (sts/rows per unit or over swatch) + pattern count → your equivalent count for the same finished size (rescale by gauge ratio). Explains the ratio.
  </pattern_rescale>
  <result_card>
    - Prominent rounded number; secondary exact value; "실제 크기 X cm (목표 대비 +Y)"; copy button. Locale-formatted numbers.
  </result_card>
  <saved_projects>
    - Save current gauge under a name; list (apply/delete). localStorage; pruned invalid on load.
  </saved_projects>
  <keyboard_shortcuts_reference>Tab through fields; mode tabs arrow keys; Esc blur; copy shortcut.</keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <gauge_math>stitchesPerUnit = stitches/swatchW; rowsPerUnit = rows/swatchH (in current unit's base). stitchesFor(width)=width×stitchesPerUnit; rowsFor(length)=length×rowsPerUnit; dimensionFor(count, perUnit)=count/perUnit; rescale(count, fromPerUnit, toPerUnit)=count×(toPerUnit/fromPerUnit). withActual(target, perUnit): {value, rounded=Math.round(value), actual=dimensionFor(rounded, perUnit), delta=actual−target}. Pure, unit-tested with fixtures (e.g., 22 sts/10cm, want 50cm → 110 sts).</gauge_math>
  <units>Convert all lengths to a base (cm) for math, format back to selected unit. cmToIn/inToCm exact ×÷2.54. Unit toggle re-labels swatch defaults (10cm↔4in) but keeps entered gauge meaning consistent.</units>
  <persistence_adapter useKnittingGauge>
    - Mount: read store → zod → pruneInvalid → state; fail → fresh. Absent localStorage → in-memory.
    - Change: debounced setItem; catch quota/security → in-memory.
    - Expose: gauge + setters, unit toggle, mode, per-mode results, projects/recents + save/apply/remove, copy.
  </persistence_adapter>
  <i18n>All UI chrome from tools.knitting-gauge.* (ko/en): top-level title/description, mode/field/unit/result labels, how-to, FAQ. Numbers via useLocale()→Intl.NumberFormat. Units are labels (cm/인치) via i18n, not hardcoded. Assert no Korean leakage in EN render.</i18n>
</core_functionality>

<error_handling>
  <invalid_input>Zero/negative/empty swatch or count → inline message + guard divide-by-zero (no NaN/Infinity shown); neutral until valid.</invalid_input>
  <storage><unavailable>Private mode → in-memory, tool fully works.</unavailable><corrupt_blob>zod fail → fresh (no throw); invalid pruned.</corrupt_blob></storage>
  <precision>Show exact + rounded + actual so rounding is transparent; no misleading single number.</precision>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No network calls; no API surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of tokens.</source>
  <accent_usage>Per-tool identity accent is SUN (var(--accent-sun)/-soft): intro tile, active mode tab underline, primary result number. CTAs brand honey-gold var(--brand). Real tokens only.</accent_usage>
  <surfaces>Cards = var(--surface) + 1px var(--hairline), radius --radius-xxl. Inputs surface-muted. Result number large on surface.</surfaces>
  <typography>H1 Gmarket Sans (28–40px). Result number large/700 (tabular-nums). Labels 14px text-secondary. Exact/actual 13–14px text-muted.</typography>
  <motion>transform/opacity only: mode fade 150ms, result update. prefers-reduced-motion gated.</motion>
  <accessibility>Labeled numeric inputs (inputmode="decimal"); mode tabs aria; result aria-live="polite"; ≥44px targets; focus-visible ring; WCAG 2.1 AA.</accessibility>
  <responsive>Single column <768px; inputs stack; result cards full width; no horizontal overflow at 320px.</responsive>
  <atmosphere>Warm, crafty "maker's calculator": cozy sun accent, clear big numbers, honest rounding. Practical and friendly.</atmosphere>
  <icons>lucide-react: Ruler or Grid (registry card icon), Calculator, Copy, Check. Default 20px, stroke 1.75. Registry card icon: `Ruler` (fallback `Grid`).</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>Numbers render as text nodes (React escape); zod-validated positives; divide-by-zero guarded. No dangerouslySetInnerHTML.</input>
  <privacy>Projects/recents localStorage-only, never sent. No analytics event includes project data.</privacy>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <three_modes>One gauge feeds dimensions→counts, counts→dimensions, and pattern rescale — covers the real knitting workflow.</three_modes>
  <rounding_transparency>Exact + rounded + actual-size ±delta — the knitter sees the trade-off, not a misleading single number.</rounding_transparency>
  <units>cm/inch with 10cm/4in convention — serves both KO and EN knitting communities.</units>
  <structured_data>SoftwareApplication + FAQPage JSON-LD (gate-free prerender) for "게이지 계산 / knitting gauge calculator" discoverability (DESIGN principle ③).</structured_data>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1><description>Dimensions → counts</description><steps>
    1. Gauge 22 sts / 30 rows per 10cm; target 50cm × 30cm → 110 sts, 90 rows (exact shown; actual size for rounded count shown).
    2. Non-integer (e.g., 21 sts want 33cm → 69.3 → 69 sts, actual 32.86cm, delta −0.14cm).
  </steps></test_scenario_1>
  <test_scenario_2><description>Counts → dimensions + units</description><steps>
    1. 100 sts at 22/10cm → 45.45cm. Toggle inch → swatch default 4in, gauge re-based, dimension in inches consistent (2.54 exact).
  </steps></test_scenario_2>
  <test_scenario_3><description>Pattern rescale</description><steps>
    1. Pattern gauge 20 sts/10cm, "cast on 100" (=50cm); your gauge 22/10cm → 110 sts for the same 50cm. Ratio explained.
  </steps></test_scenario_3>
  <test_scenario_4><description>Edge + persistence</description><steps>
    1. Swatch size 0 / empty → guarded, no NaN, inline message. Reload → gauge/projects persist; private mode in-memory.
    2. Save project "스웨터 앞판" → apply later repopulates gauge.
  </steps></test_scenario_4>
  <test_scenario_5><description>i18n, a11y, SEO</description><steps>
    1. /en → all chrome English, numbers/units locale-formatted; NO Korean leakage; prerendered HTML has SoftwareApplication + exactly one FAQPage.
    2. Labeled inputs, mode tabs keyboard, result aria-live; axe pass; 320px no overflow.
  </steps></test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Gauge → cast-on stitches/rows for a target size; counts → dimensions; pattern rescale; cm/inch units; rounding transparency (exact + rounded + actual ±delta); localStorage projects/recents; copy.</functionality>
  <correctness>CRITICAL: formulas exact, unit conversion exact (2.54), divide-by-zero guarded, no NaN/Infinity surfaced; verified with known fixtures.</correctness>
  <user_experience>One gauge feeds all modes; instant results; readable at 320px; SPA — no route reload; locale-aware numbers.</user_experience>
  <technical_quality>lib/knitting-gauge/* pure ≥90% (units/gauge/store, fixtures incl. non-integer + inch + rescale + divide-by-zero); TS 0 errors; <800 lines/file; no innerHTML.</technical_quality>
  <visual_design>DESIGN.md compliant; sun identity; big tabular result; real tokens only.</visual_design>
  <accessibility>Labeled numeric inputs; mode tabs aria; result aria-live; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Within calculator budget; CLS unaffected; LCP < 2.5s.</performance>
  <seo_geo>Unique canonical/hreflang; SoftwareApplication + FAQPage JSON-LD (single Faq owner) in gate-free prerender; SSR long-form (gauge explainer); llms.txt; sitemap auto-includes hub (single page — no spokes).</seo_geo>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/knitting-gauge pre-rendered by generateStaticParams iterating registry (status "coming_soon" initially, "live" on launch). Single-page utility — no generated content, no spokes.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — 'calculator' category active; 'sun' per-tool accent.
    {
      id: 'knitting-gauge',
      slug: 'knitting-gauge',
      category: 'calculator',
      icon: 'Ruler',
      accent: 'sun',
      status: 'coming_soon',   // 'live' when complete
      isNew: true,
      order: 33,
      keywords: ['뜨개질','게이지','코수','단수','대바늘','코바늘','니트','스웨치','패턴환산','knitting','gauge','stitches','rows','swatch','cast on','crochet'],
    },
    ```
    Add slug→component branch (<KnittingGauge/>) + generateMetadata branch. NO spoke route.
  </platform_registry_change>
  <sitemap_integration note="automatic">Single-page tool — hub URL added automatically from registry (getLiveTools) with ko/en hreflang. No collection block/spoke loop. Confirm sitemap.test.ts hub count once live.</sitemap_integration>
  <critical_paths>1. Pure gauge math + exact unit conversion + divide-by-zero guard. 2. Rounding transparency (exact/rounded/actual). 3. Three modes sharing one gauge. 4. i18n number/unit formatting (Intl via useLocale), no Korean leakage in EN; top-level title/description present.</critical_paths>
  <recommended_implementation_order>
    1. lib/knitting-gauge/{schema,units,gauge,store}.ts Vitest (RED→GREEN): unit conversion (2.54), stitchesFor/rowsFor/dimensionFor/rescale/withActual (fixtures incl. non-integer + inch + divide-by-zero), store immutable ops + prune.
    2. tools.knitting-gauge.* messages (ko/en): top-level title/description, mode/field/unit/result labels, how-to, FAQ.
    3. useKnittingGauge hook (localStorage projects/recents, derived results, in-memory fallback).
    4. GaugeInput + ModeTabs + three mode panels + ResultCard (rounded/exact/actual/copy).
    5. SavedProjects (apply/delete).
    6. a11y (axe, labeled inputs, tabs, result aria-live), motion-reduce.
    7. Intro/HowTo/Faq + SoftwareApplication + FAQPage(Faq owner) JSON-LD (gate-free SSR) via lib/seo.ts.
    8. Registry status→coming_soon (→live on launch); route + generateMetadata; E2E 1–5; visual regression 320/768/1024 both themes + locales.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥90% (units/gauge/store) with known fixtures (22 sts/10cm→50cm=110; non-integer; inch 2.54; rescale ratio; divide-by-zero guard); component tests with real message catalog + getByLabelText; E2E 1–5; localStorage jsdom-isolated; both locales (assert `/[가-힣]/` absent in EN chrome).</testing_strategy>
</key_implementation_notes>

</project_specification>
```
