# Everyone's Cheer — Big-Screen Cheer Message Display — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Everyone's Cheer** (모두의 응원) — a client-side tool that turns a typed message into a giant, eye-catching on-screen display for use at concerts, sports games, and events. Users type (or pick a preset) a cheer phrase, choose colors / effect / size, and show it huge — scrolling (marquee), flashing, or neon-glowing — optionally rotated to landscape and in fullscreen so a phone can be waved like an LED banner. The entire interaction is client-side: no routing, no reload, no backend. Persistence is localStorage (recent messages + last settings). Motion is compositor-friendly (`transform`/`opacity`); `prefers-reduced-motion` renders a static banner.
>
> Internal service codename: `cheer`. Registry id: `cheer`. Public URL slug: `/[locale]/tools/cheer`.
>
> This SPEC covers the tool itself. Platform shell, tool registry, SEO & ad infrastructure, and design tokens are provided:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system: [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC: [`docs/services/random/roulette/SPEC.md`](../../random/roulette/SPEC.md)

```xml
<project_specification>

<project_name>Everyone's Cheer — Big-Screen Cheer Display (Jurepi tool, codename cheer, registry id cheer)</project_name>

<overview>
Everyone's Cheer turns a short message into a giant, attention-grabbing display you can wave at a concert, stadium, or event. Users type a phrase (or tap a curated preset like "앵콜!" / "화이팅!"), pick a text color + background color, choose an effect (static, scrolling marquee, flashing, or neon glow), adjust text size, and hit "show". The message fills a large display panel; a single tap enters true fullscreen and an optional landscape rotation turns a held-sideways phone into a wide LED-banner. Screen Wake Lock keeps the screen on while cheering. The entire interaction is a **single-page SPA**: no route changes, no full reload.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no API, no network calls. The only persistence is localStorage (recent messages + last-used settings). Effects are pure CSS on compositor-friendly properties (`transform: translateX` for marquee, `opacity` for flash, `text-shadow` for neon, `transform: rotate(90deg)` for landscape). `prefers-reduced-motion` disables animation and shows a static banner. Fullscreen (Fullscreen API) and keep-awake (Screen Wake Lock API) are feature-detected and degrade gracefully where unsupported.

CRITICAL (SPA, usability-first): Every Jurepi tool is a client-side Single-Page Application. Typing, choosing colors/effects, showing, entering fullscreen — all happens in React state with NO route navigation and NO full page reload. The route is statically generated (SSG) for SEO; the interactive tool is a single client-component island. Mobile usability is paramount — this tool is used primarily on phones at live venues.
</overview>

<platform_integration>
  - Route: /[locale]/tools/cheer (SSG; registry slug "cheer", id "cheer", status "live" once approved, accent "coral", category "fun").
  - Provided by platform: app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons (route template).
  - Consumes: i18n namespace `tools.cheer.*` (UI chrome strings: labels, buttons, help text, preset category/phrase labels — NOT the user's own typed message).
  - Platform dependency (NO new category needed): the `'fun'` category already exists. Platform changes are limited to ONE `ToolMeta` registry entry, one `TOOL_ICONS` icon (`Megaphone`), a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Message input: free text (1..80 chars), plain text only; live preview updates as you type
    - Preset phrase library: curated cheer phrases grouped by situation (concert / sports / birthday / event), one-tap to load into the input; ko/en labels from i18n
    - Effects: static | scroll (horizontal marquee, speed-adjustable) | flash (blink) | neon (glow) — one active at a time
    - Speed control for the scroll/flash effects (slow / medium / fast)
    - Color: text color + background color from a curated palette (DESIGN-token-based swatches) + high-contrast pairing guard (warn on low contrast)
    - Text size / weight control (S / M / L / XL scale)
    - Landscape rotate: rotate the banner 90° so a phone held sideways reads correctly (toggle)
    - Fullscreen: enter/exit true fullscreen via Fullscreen API (feature-detected; falls back to an in-page maximized panel)
    - Screen keep-awake: Screen Wake Lock API while the display is active (feature-detected; re-acquired on visibilitychange; silently absent where unsupported)
    - Recent messages: last N typed messages saved to localStorage, one-tap to restore
    - Responsive (320/375/768/1024/1440): controls stack on mobile; display panel scales; usable one-handed on phones
    - Tool-specific SEO long-form + FAQ (FAQPage JSON-LD), SoftwareApplication JSON-LD, localized ko/en
    - Accessibility: WCAG 2.1 AA, visible focus (focus-visible), ARIA labels, color contrast, reduced-motion static fallback
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry (all platform)
    - Multi-user / real-time sync across devices (this is a single-device display, unlike online-bingo #25 which needs a server)
    - Image/photo/logo upload as background
    - Saving named "cheer sets" or accounts (only lightweight recent-message history)
    - Exporting the banner as an image/video (Phase 2 candidate)
    - Audio / sound effects (a cheer banner is silent by design)
    - Deep-link/share of a pre-filled banner via URL params (Phase 2 candidate)
  </out_of_scope>
  <future_considerations>
    - Share a pre-filled banner via query params (?text=&color=) — Phase 2
    - Export banner as PNG/GIF — Phase 2
    - Custom uploaded background image — Phase 3
    - Multi-line / stacked messages — Phase 3
    - Additional effect: rainbow gradient sweep — Phase 3
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <display>The banner is a DOM element with large text. Marquee = CSS keyframe animating `transform: translateX(100% → -100%)` on the text span; speed maps to animation-duration. Flash = keyframe on `opacity`. Neon = layered `text-shadow` glow (static, no motion). Landscape = `transform: rotate(90deg)` on the display container with swapped width/height. All motion gated by `prefers-reduced-motion` (static banner).</display>
    <fullscreen>Native Fullscreen API: `element.requestFullscreen()` / `document.exitFullscreen()`, feature-detected (`document.fullscreenEnabled`). On unsupported (older iOS Safari): fall back to a fixed-position in-page maximized overlay panel. Track `fullscreenchange` to sync UI state.</fullscreen>
    <wake_lock>Screen Wake Lock API: `'wakeLock' in navigator` → `navigator.wakeLock.request('screen')`. The lock auto-releases when the page is hidden, so re-acquire on `visibilitychange` when the display is active. Silently omit the toggle where unsupported. Never blocks core display.</wake_lock>
    <persistence>localStorage key `jurepi-cheer`: { version, recents: string[], lastSettings: CheerSettings }. Read on mount → zod parse → prune → set state; fail → start fresh (no throw). Recents write on show; settings write on change (immediate, no debounce for discrete settings).</persistence>
    <input_safety>Message is plain text bound to a controlled input and rendered as a text node (never dangerouslySetInnerHTML). Length-capped and validated.</input_safety>
  </module_specific>
  <libraries>
    <zod>zod v3.x (already in repo) for settings + localStorage store schema validation.</zod>
    <no_new_deps>Zero new dependencies. Fullscreen, Wake Lock, and all effects use native web platform APIs and CSS.</no_new_deps>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/cheer/                          # Pure domain layer (no React/Next)
│   ├── schema.ts                       # zod: CheerSettings, StoreSchema (STORE_VERSION, recents, lastSettings)
│   ├── presets.ts                      # curated preset phrases grouped by situation (concert/sports/birthday/event) — structured constants; human labels via i18n
│   ├── recents.ts                      # immutable ops: addRecent (MRU, dedup, cap N), pruneRecents
│   ├── sanitize.ts                     # normalizeMessage(text): trim, collapse, length cap; isValidMessage
│   └── contrast.ts                     # relativeLuminance + contrastRatio(text, bg) → low-contrast guard (reuse pattern from lib/qr-code/contrast if applicable)
├── components/tools/cheer/
│   ├── Cheer.tsx                       # Client Component orchestrator; owns settings + recents state via useCheer(); mounted gate for localStorage-only parts
│   ├── useCheer.ts                     # Hook: settings state, recents persistence, preset apply, fullscreen + wake-lock wiring
│   ├── CheerInput.tsx                  # Message text field + recent-messages chips
│   ├── CheerPresets.tsx                # Preset phrase library (situation tabs → phrase chips)
│   ├── CheerControls.tsx               # Effect selector, speed, color swatches (text/bg), size, landscape toggle
│   ├── CheerDisplay.tsx                # Large banner render (marquee/flash/neon/static, landscape rotate, fullscreen container)
│   ├── useFullscreen.ts                # Fullscreen API + Wake Lock feature-detected wrapper (enter/exit, isSupported, isActive, re-acquire on visibilitychange)
│   ├── CheerIntro is provided by shared ToolIntro (i18n intro.*)
│   ├── CheerHowTo.tsx                  # "How to make a cheer banner" / tips (SEO long-form, gate-outside SSR)
│   ├── CheerFaq.tsx                    # Q&A + FAQPage JSON-LD (single owner of FAQPage)
│   └── CheerStructuredData.tsx         # SoftwareApplication JSON-LD (url == canonical)
└── i18n/messages/{ko,en}.json          # tools.cheer.* UI chrome (input, presets, controls, howTo, faq)
</file_structure>

<core_data_entities>
  <cheer_settings>
    - text: string (1..80 chars) — the message (locale-agnostic user input; not persisted per-keystroke as a "recent" until shown)
    - textColor: string — token-based swatch id (e.g. "white", "coral", "sun", "sky")
    - bgColor: string — token-based swatch id (e.g. "black", "coral", "grape")
    - effect: 'static' | 'scroll' | 'flash' | 'neon' (default 'scroll')
    - speed: 'slow' | 'medium' | 'fast' (default 'medium'; applies to scroll/flash)
    - size: 'S' | 'M' | 'L' | 'XL' (default 'L')
    - landscape: boolean (default false)
    - Immutable: updates return a new settings object, never mutate in place.
  </cheer_settings>
  <cheer_store>
    - version: number (STORE_VERSION = 1)
    - recents: string[] — last MAX_RECENTS shown messages, MRU order, deduped
    - lastSettings: CheerSettings — restored on mount
    localStorage key: `jurepi-cheer`
    Invariant: read is zod-parsed; fail → start fresh (no throw). Unknown fields pruned.
  </cheer_store>
  <preset_phrase>
    - id: string (stable, e.g. "sports.one-more-goal")
    - situation: 'concert' | 'sports' | 'birthday' | 'event'
    - Text label per locale comes from i18n `tools.cheer.presets.<situation>.<id>` (NOT stored in the constant — the constant carries id + situation only, so canonical values stay locale-correct)
  </preset_phrase>
  <constants>
    - MIN_LEN = 1, MAX_LEN = 80; MAX_RECENTS = 10
    - SCROLL_MS = { slow: 12000, medium: 8000, fast: 4000 }; FLASH_MS = { slow: 1200, medium: 700, fast: 350 }
    - SIZE_SCALE = { S: 'clamp(2rem,10vw,4rem)', M: 'clamp(3rem,14vw,6rem)', L: 'clamp(4rem,20vw,9rem)', XL: 'clamp(5rem,28vw,14rem)' }
    - MIN_CONTRAST = 3.0 (warn below; not blocked)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/cheer" page="Cheer (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. No dynamic params, no per-message routes.</note>
</route_definitions>

<component_hierarchy>
  <cheer>                        <!-- "use client"; owns settings + recents; useCheer() owner. localStorage-dependent parts behind mounted gate -->
    <tool_intro />              <!-- shared ToolIntro: eyebrow + H1 + lead (server-render, i18n intro.*) -->
    <layout>
      <cheer_display />         <!-- Large live banner: reflects current settings; fullscreen/landscape target -->
      <control_column>
        <cheer_input />         <!-- Message field + recent chips -->
        <cheer_presets />       <!-- Situation tabs + preset phrase chips -->
        <cheer_controls />      <!-- Effect, speed, colors, size, landscape, fullscreen, keep-awake -->
      </control_column>
    </layout>
    <cheer_how_to />            <!-- SEO long-form (gate-outside SSR) -->
    <cheer_faq />              <!-- FAQPage JSON-LD (gate-outside SSR) -->
  </cheer>
</component_hierarchy>

<pages_and_interfaces>
  <tool_intro>
    - Eyebrow: "재미 도구" / "FUN TOOL" — 12px/700/0.6px, var(--brand-ink)
    - H1: "모두의 응원" / "Everyone's Cheer" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)
    - Lead: "응원 문구를 크게 띄워 콘서트·경기장에서 눈에 띄게 응원하세요." / "Show your cheer message big — wave it like an LED banner at concerts and games."
  </tool_intro>

  <cheer_display>
    - Large panel (min-height responsive), background = selected bgColor swatch, text = selected textColor swatch
    - Renders `settings.text` as a single text node at SIZE_SCALE[size]; empty → placeholder hint ("여기에 응원 문구가 표시돼요")
    - effect 'static': no animation
    - effect 'scroll': text span animates translateX left↔ across the panel, duration SCROLL_MS[speed], linear, infinite; `overflow: hidden`
    - effect 'flash': opacity 1→0.15→1 keyframe, FLASH_MS[speed], infinite
    - effect 'neon': layered text-shadow glow in textColor (no motion, works with reduced-motion)
    - landscape true: container `transform: rotate(90deg)`, dimensions swapped so it fills a sideways phone
    - Fullscreen: a "전체화면" / "Fullscreen" button targets this panel via Fullscreen API; fallback fixed overlay
    - `prefers-reduced-motion`: scroll/flash become static (no transform/opacity animation); neon/static unaffected
    - a11y: `role="img"` or `aria-label` conveying the message text so it's announced; decorative motion hidden from AT
  </cheer_display>

  <cheer_input>
    - Label "응원 문구" / "Cheer message"; text field (max 80, placeholder "예: 우리 팀 우승!")
    - Draft-bound controlled input (typing updates preview live; no debounce loss)
    - Recent chips row: up to MAX_RECENTS recent messages; tap restores into input; empty state hidden
    - "지우기" / "Clear" button to empty the field
  </cheer_input>

  <cheer_presets>
    - Situation tabs (roving tabindex): 콘서트 / 스포츠 / 생일 / 이벤트  —  Concert / Sports / Birthday / Event
    - Under active tab: chips of curated phrases (from i18n presets.<situation>.*); tap sets input text
    - Chips are keyboard-focusable buttons with visible focus-visible ring
  </cheer_presets>

  <cheer_controls>
    - Effect selector: segmented control (정적/스크롤/점멸/네온 — Static/Scroll/Flash/Neon); active = brand pill (bg-brand text-on-brand), inactive = bg-surface-muted
    - Speed: slow/medium/fast segmented (disabled when effect is static/neon)
    - Text color swatches + Background color swatches (curated token palette); low-contrast pair shows a subtle warning chip (not blocked)
    - Size: S/M/L/XL segmented
    - Landscape toggle (aria-pressed): rotate banner 90°
    - Fullscreen button (hidden if Fullscreen API unsupported → fallback overlay button label)
    - Keep-awake toggle (hidden entirely if Wake Lock unsupported), aria-pressed; shows active state while locked
  </cheer_controls>

  <keyboard_shortcuts_reference>
    - Tab: navigate inputs/controls (DOM order), focus-visible ring on all interactive elements
    - Enter (in message input): commit as a recent + keep showing
    - Arrow keys within segmented controls / preset tabs: roving selection
    - Esc: exit fullscreen (native)
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <display_render>
    - The banner always reflects current settings live; no "apply" step needed for preview (fullscreen is the "show big" action)
    - Marquee duration = SCROLL_MS[speed]; flash period = FLASH_MS[speed]; size = SIZE_SCALE[size]
    - Landscape swaps the visual orientation via rotate(90deg) + width/height swap on the container
  </display_render>
  <fullscreen_and_wakelock>
    - Enter fullscreen on the display container; on enter, if keep-awake toggle on and supported → acquire wake lock
    - visibilitychange: if page becomes visible and display active and toggle on → re-acquire wake lock (browser auto-released it)
    - Exit fullscreen (button or Esc) → release wake lock
    - All feature-detected: unsupported → button hidden or fallback overlay; core banner still works
  </fullscreen_and_wakelock>
  <presets>
    - Preset constants carry {id, situation}; display label resolved via i18n at render (locale-correct)
    - Tapping a preset sets settings.text (does not auto-add to recents until "shown"/committed)
  </presets>
  <persistence>
    - Mount: read localStorage jurepi-cheer → zod parse → prune → restore lastSettings + recents; fail → defaults
    - On settings change: immediate immutable write of lastSettings
    - On commit/show: addRecent(text) (MRU, dedup, cap MAX_RECENTS) → write
  </persistence>
  <i18n>All UI chrome + preset labels from tools.cheer.* (ko/en): labels, buttons, help, placeholders, preset phrases, howTo, faq. The user's typed message is locale-agnostic input. Any computed/displayed string (e.g. "지원 안 함") comes from t(), never hardcoded.</i18n>
</core_functionality>

<error_handling>
  <input_validation>
    - Empty message → display shows placeholder hint; fullscreen still allowed (shows placeholder big)
    - Over MAX_LEN → hard cap at input (maxLength) + subtle counter
    - Plain text only; no HTML injection (text node render)
  </input_validation>
  <fullscreen_unsupported>Fullscreen API absent (older iOS Safari) → hide native button, use fixed-overlay maximize fallback; never throw.</fullscreen_unsupported>
  <wakelock_unsupported>Wake Lock absent → hide keep-awake toggle entirely; display works normally.</wakelock_unsupported>
  <storage>
    <unavailable>Private mode/quota → localStorage fails silently; recents in-memory only (fully usable, non-persistent).</unavailable>
    <corrupt_blob>JSON/zod fail on read → start fresh (no throw); no data-loss notice (recents are not precious).</corrupt_blob>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  - DESIGN.md tokens only; no phantom tokens. Accent = coral (fun category identity for this tool); brand violet reserved for the single action/CTA color; accent ≠ CTA.
  - The display panel is a bold, high-contrast canvas — this is the one place saturated color is the point (user-chosen). Controls stay in the calm token system around it.
  - Motion is compositor-friendly only (transform/opacity/text-shadow). `prefers-reduced-motion` → static banner. No layout-animating properties.
  - Hover/focus/press states designed; focus-visible (not bare focus) rings using --focus-ring token.
  - Mobile-first: one-handed reach, large tap targets (≥44px), no 320px overflow.
</aesthetic_guidelines>

<security_considerations>
  - Input safety: message rendered as text node; no dangerouslySetInnerHTML; length-capped.
  - Privacy: nothing leaves the device — no network, no analytics of message content; recents live only in this browser's localStorage.
  - No secrets, no external scripts, no third-party calls.
</security_considerations>

<final_integration_test>
  1. Type "우리 팀 우승!" → banner shows it large and live; scroll effect animates left↔right.
  2. Tap a Sports preset → input + banner update to the preset phrase.
  3. Switch effect to neon + pick coral text on black bg → glowing banner; low-contrast pair (e.g. sun-on-white) shows warning chip.
  4. Toggle landscape → banner rotates 90°; enter fullscreen → panel fills screen; Esc exits.
  5. Reload → lastSettings + recents restored from localStorage; a recent chip restores its message.
  6. reduced-motion emulation → scroll/flash render static (no motion); en locale → no Korean leakage; 320px → no overflow; console clean.
</final_integration_test>

<success_criteria>
  <functionality>Message displays live; all 4 effects work; speed/size/color/landscape apply; presets load; fullscreen + wake-lock feature-detect and degrade; recents persist.</functionality>
  <ux>One-handed mobile use; instant preview; large targets; clear active states.</ux>
  <technical>tsc 0; domain ≥90% coverage; overall ≥ baseline; static export builds ko/en; zero new deps.</technical>
  <visual>DESIGN tokens; coral accent; no phantom tokens; bold display canvas vs calm controls.</visual>
  <a11y>WCAG 2.1 AA; focus-visible; ARIA labels; reduced-motion static; message announced.</a11y>
  <performance>Compositor-only motion; no CLS; ad slot height reserved by platform.</performance>
  <discoverability>Unique meta + SoftwareApplication + FAQPage JSON-LD (url==canonical) in prerendered HTML; answer-first HowTo/FAQ ko/en; preset phrase library adds real content; llms.txt entry; sitemap auto.</discoverability>
</success_criteria>

<key_implementation_notes>
  - Recommended build order: schema/sanitize/recents/contrast (domain TDD) → presets constants → useCheer + useFullscreen hooks → CheerDisplay (effects/reduced-motion) → controls/input/presets → SEO sections (gate-outside SSR) → wiring (registry/icon/i18n/route/llms.txt).
  - CRITICAL discoverability: meta, JSON-LD, Intro/HowTo/FAQ must render OUTSIDE the mounted gate (SSR) so AI crawlers see them. Only localStorage/Date-dependent parts gate.
  - CRITICAL i18n: top-level `tools.cheer.title` + `description` required (consumed by home card / footer / search). Preset labels + any displayed computed string via t().
  - CRITICAL motion: transform/opacity/text-shadow only; reduced-motion static. Never animate width/height/top/left.
  - Feature-detect Fullscreen + Wake Lock; re-acquire wake lock on visibilitychange; hide unsupported controls.
  - Testing: domain pure-function TDD; component tests render with the real message catalog (NextIntlClientProvider, locale ko AND en) to catch Korean hardcoding leaks; E2E cheer.spec covers show/effect/preset/fullscreen-toggle/persistence/en, with a pageerror hard gate.
</key_implementation_notes>

</project_specification>
```
