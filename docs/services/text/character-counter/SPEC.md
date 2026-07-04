# Character & Word Counter — Live text metrics & counting tool — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Character & Word Counter** (글자 수 세기) — a live-counting utility that analyzes pasted or typed text to report character count (with/without spaces), word count, sentence count, paragraph count, line count, UTF-8 byte size, and estimated reading/speaking time. The tool helps writers, social-media managers, and form-fillers stay within character limits. Input state persists to localStorage; all computation is client-side.
>
> Internal service codename: `character-counter`. Registry id: `character-counter`. Public URL slug: `/[locale]/tools/character-counter`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/text/new-word/SPEC.md`](../new-word/SPEC.md)

```xml
<project_specification>

<project_name>Character & Word Counter — Live Text Metrics (Jurepi tool, codename character-counter, registry id character-counter)</project_name>

<overview>
Character & Word Counter is a straightforward, focused tool: paste or type text into a textarea, and watch live metrics appear — character count (with/without spaces), words, sentences, paragraphs, lines, UTF-8 bytes, and estimated reading/speaking time. Social-media managers use it to verify a tweet fits the 280-character limit; essayists use it to track progress toward a word-count goal; form-fillers use it to see if their input exceeds a field limit.

The tool is 100% client-side. It has one primary input (textarea), one metrics display (card with 8–10 key statistics), an optional target-limit slider/input with a visual progress indicator that changes color when over-limit, buttons to copy the current stats or clear the textarea, and localStorage persistence so the last text typed carries over to the next visit.

CRITICAL (client-only, SPA): 100% client-side. No backend, no database, no external API. The only first-party persistence is `localStorage` (last text, last limit, preferences), and nothing is ever sent over the network.

CRITICAL (usability-first, SPA): every Jurepi tool is a client-side Single-Page Application mounted on the SSG shell. All interaction — typing, adjusting the limit, copying, clearing — updates local React state with NO route navigation and NO full page reload. The route is statically generated (SSG) for SEO; the interactive tool is a single client-component island on that static shell.
</overview>

<platform_integration>
  - Route: /[locale]/tools/character-counter (SSG; registry slug "character-counter", id "character-counter", status "live", accent "mint", category "text").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.character-counter.*` (UI strings: textarea placeholder, metric labels, copy-done/clear toast, limit slider label, reading-time unit).
  - REQUIRED i18n top-level keys (ko/en): `tools.character-counter.title` + `tools.character-counter.description` — consumed by the registry-driven `searchable-tools`, footer, home card, and header search. Missing these renders literal keys in shared surfaces (recurring defect). Also add `meta.title`/`meta.description` for generateMetadata.
  - Platform dependency: the `'text'` category + `'mint'` accent already exist (shared with new-word, special-symbol). Only platform change is ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch. No new category/accent needed.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Textarea input (multiline, full-width, resizable, auto-focus, placeholder).
    - Live metrics computation: character (with spaces), character (no spaces), words, sentences, paragraphs, lines, UTF-8 byte size, estimated reading time (default 200 WPM), estimated speaking time (default 130 WPM).
    - DETERMINISTIC COUNTING RULES (pin tests to these):
      - sentences: split on /[.!?…]+/, trim each segment, count non-empty. A non-empty text with NO sentence-ending punctuation = 1 sentence (e.g. "안녕하세요" → 1). Empty text → 0.
      - words: trim, split on /\s+/, count non-empty. Empty → 0.
      - paragraphs: split on /\n\s*\n/ (blank-line separated), count non-empty trimmed blocks. Empty → 0.
      - lines: split on /\r\n|\r|\n/; empty text → 0, otherwise segments.length.
      - characters: grapheme count via Intl.Segmenter (emoji/ZWJ = 1); "no spaces" removes /\s/ graphemes.
    - Grapheme-aware character counting (emoji/ZWJ sequences = 1 character, use Intl.Segmenter with fallback).
    - Optional preset target limits: Twitter/X 280, Meta description 160, custom input, or none (slider toggleable).
    - Visual limit indicator (color-coded: green under, yellow near 80%, red over).
    - Copy text, copy metrics (stats as copiable card), clear textarea.
    - localStorage persistence: last text (key `jurepi-char-counter-text`, auto-prune on reload), last limit (key `jurepi-char-counter-limit`), preferences (dark/light toggle, WPM preference).
    - Full keyboard support: Tab to inputs, Ctrl+A selects textarea, keyboard-accessible limit picker.
    - Tool-specific SEO long-form ("How to count characters and words") + FAQ (FAQPage JSON-LD).
    - JSON-LD SINGLE OWNERSHIP: FAQPage is emitted ONLY by CounterFaq (via `faqPageJsonLd` over the visible faq.items); SoftwareApplication (+ breadcrumb) ONLY by the StructuredData/route. Never emit FAQPage from two components (duplication defect). All must render OUTSIDE any `mounted` gate so they exist in prerendered HTML.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Grammar/spell check or quality scoring.
    - Readability index (Flesch-Kincaid, etc.) — only reading time.
    - Summarization, editing suggestions, or text transformation.
    - Backend text storage, cloud sync, or cross-device persistence.
    - Plugin/API for third-party text sources.
  </out_of_scope>
  <future_considerations>
    - Readability scoring (Flesch, Gunning Fog) — Phase 2.
    - Korean-aware counting (초성 / 자모 optional detail display) — Phase 2.
    - Preset limits for other platforms (LinkedIn 3000, LinkedIn post 13k, Instagram caption 2200) — Phase 2.
    - Compare two texts side-by-side — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <pure_domain>lib/character-counter/: countCharacters (Intl.Segmenter or fallback), countWords (split on whitespace), countSentences (regex /[.!?]+/), countParagraphs (split on \n\n or \r\n\r\n), countLines (split on \n/\r\n), getByteSize (TextEncoder), estimateReadingTime (words / WPM). All pure functions, no React.</pure_domain>
    <hook>useCharacterCounter: manages textarea state, metrics, localStorage (read on mount, write debounced), limit picker state, copy handler.</hook>
    <note>CRITICAL: NO backend, NO first-party API, NO DB.</note>
  </module_specific>
  <libraries>
    <textarea_resizable>Native textarea with CSS resize: vertical; no external library needed.</textarea_resizable>
    <segmenter>Intl.Segmenter (ES2024) for grapheme-aware counting; fallback to String.length if unavailable (tested/documented).</segmenter>
    <text_encoder>TextEncoder (Web API) for UTF-8 byte counting.</text_encoder>
    <clipboard>navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail if both unavailable.</clipboard>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/character-counter/                      # Pure domain layer
│   ├── counter.ts                              # countCharacters, countWords, countSentences, countParagraphs, countLines, getByteSize, estimateReadingTime
│   ├── segmenter.ts                            # Intl.Segmenter wrapper + fallback for grapheme counting
│   ├── preset-limits.ts                        # TWITTER_LIMIT=280, META_DESC=160, etc.
│   └── types.ts                                # CharacterCounterMetrics, PresetLimit
├── components/tools/character-counter/
│   ├── CharacterCounter.tsx                    # Orchestrator (Client Component) — textarea + metrics + limit picker + actions
│   ├── useCharacterCounter.ts                  # Hook: state + localStorage + metrics compute
│   ├── CounterMetrics.tsx                      # Display 8–10 metrics in a grid card
│   ├── LimitIndicator.tsx                      # Visual progress bar (green → yellow → red) + preset buttons
│   ├── CopyButton.tsx                          # Copy textarea or copy metrics-as-text
│   ├── ClearButton.tsx                         # Clear textarea + toast confirm
│   ├── CounterIntro.tsx                        # H1 + lead (SEO; server-render where possible)
│   ├── CounterHowTo.tsx                        # "How to count characters and words"
│   └── CounterFaq.tsx                          # Q&A + FAQPage JSON-LD
└── i18n/messages/{ko,en}.json                  # tools.character-counter.* (textarea placeholder, metric labels, toast messages, limit presets)
</file_structure>

<core_data_entities>
  <character_counter_metrics>
    - charactersWithSpaces: number
    - charactersWithoutSpaces: number
    - words: number
    - sentences: number
    - paragraphs: number
    - lines: number
    - byteSize: number (UTF-8)
    - readingTimeMinutes: number (words / readWPM)
    - speakingTimeMinutes: number (words / speakWPM)
  </character_counter_metrics>
  <preset_limit>
    - id: enum (twitter, meta_description, custom, none)
    - label: string (localized from i18n)
    - limit: number | null
    - description?: string (e.g., "X allows 280 characters per post")
  </preset_limit>
  <counter_store>
    - version: number (STORE_VERSION, starts at 1)
    - lastText: string (last non-empty textarea value)
    - lastLimit: { id: string; limit: number } | null
    - readWPM: number (default 200, user-adjustable Phase 2)
    - speakWPM: number (default 130)
    localStorage keys: `jurepi-char-counter-text`, `jurepi-char-counter-limit`, `jurepi-char-counter-prefs`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw, fully functional in-memory).
  </counter_store>
  <constants>
    - TWITTER_LIMIT = 280; META_DESC_LIMIT = 160; STORAGE_MAX_LENGTH = 100000; DEBOUNCE_MS = 300ms.
    - DEFAULT_READ_WPM = 200; DEFAULT_SPEAK_WPM = 130.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/character-counter" page="CharacterCounter (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <character_counter>                                     <!-- "use client"; owns textarea + limit + copy state -->
    <counter_intro />                                    <!-- H1 + lead (server-render where possible) -->
    <main_layout>                                        <!-- Flex row desktop, stack mobile -->
      <textarea_section>                                 <!-- textarea + character count under -->
        <textarea />
        <char_count_hint />                             <!-- "X characters (Y without spaces)" live caption -->
      </textarea_section>
      <metrics_sidebar>                                  <!-- Sticky right (desktop) or below (mobile) -->
        <limit_indicator />                             <!-- Presets or custom slider + progress bar -->
        <counter_metrics />                             <!-- Grid: 8–10 metrics -->
        <action_buttons>                                 <!-- Copy text / Copy stats / Clear -->
          <copy_button />
          <clear_button />
        </action_buttons>
      </metrics_sidebar>
    </main_layout>
    <counter_how_to />                                   <!-- SEO long-form -->
    <counter_faq />                                      <!-- FAQPage JSON-LD -->
  </character_counter>
  <note>SPA within tool: textarea change = local state update, NOT route navigation. Limit and copy actions same.</note>
</component_hierarchy>

<pages_and_interfaces>
  <counter_intro>
    - Eyebrow: "텍스트 도구" / "TEXT TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "글자·단어 카운터" / "Character & Word Counter" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: "텍스트의 글자·단어·문장을 실시간으로 세어 보세요." — body-lg 18px var(--text-secondary).
  </counter_intro>

  <textarea_section>
    - Full-width textarea on desktop / mobile, min-height 280px, max-height 480px, resize: vertical.
    - Placeholder: "여기에 텍스트를 붙여 넣으세요 · Paste or type text here…" (bilingual fallback style).
    - Font: Pretendard 16px, line-height 1.6. Padding 16px.
    - Border: 1px var(--hairline), radius var(--radius-md), focus-visible 3px var(--brand-soft) ring + 2px var(--focus-ring) offset.
    - Live beneath: "N characters (M without spaces)" — small gray caption, updates every keystroke (no lag).
  </textarea_section>

  <limit_indicator>
    - Label: "글자 제한" / "Character Limit" — eyebrow style.
    - Preset buttons row: Twitter 280, Meta 160, Custom, None. Active = brand fill / on-brand text.
    - If Custom → inline input field (width 80px) to set a number.
    - Visual progress bar: height 8px, radius var(--radius-sm), background var(--surface-muted).
      - ≤ 80% of limit: fill var(--accent-mint), text var(--text-secondary) "N / M".
      - 80–100%: fill var(--warning), text var(--warning-ink) "N / M (80%)".
      - \> 100%: fill var(--danger), text var(--danger-ink) "N / M (OVER)".
      - NOTE: use REAL tokens only. `--semantic-*` does NOT exist; fills = `--warning`/`--danger`, text = `--warning-ink`/`--danger-ink` (AA contrast).
    - Disable progress if "None" selected (no bar shown).
  </limit_indicator>

  <counter_metrics>
    - Card: var(--surface), 1px var(--hairline), radius var(--radius-xl), padding 20px, shadow --shadow-card.
    - Grid 2-col on desktop / 1-col mobile of metric rows:
      1. 글자 (공백) / Characters (with spaces) — **largest**, bold, primary
      2. 글자 (공백 제외) / Characters (no spaces)
      3. 단어 / Words
      4. 문장 / Sentences
      5. 단락 / Paragraphs
      6. 줄 / Lines
      7. 바이트 (UTF-8) / Bytes (UTF-8)
      8. 읽는 시간 / Reading time
      9. 말하는 시간 / Speaking time
    - Each row: label (var(--text-secondary) 13px), value (var(--text) 18px/700), unit (small gray).
    - Empty textarea → all metrics = 0; no error state.
  </counter_metrics>

  <action_buttons>
    - Copy text: button-primary honey-gold. Icon (lucide Copy) + "텍스트 복사" / "Copy text". Success toast "복사됨!".
    - Copy metrics: button-secondary cream. Icon (lucide Copy) + "통계 복사" / "Copy stats" (copies "N characters, M words, …" as text).
    - Clear: button-ghost honey-ink. Icon (lucide Trash2) + "지우기" / "Clear". Toast confirm "초기화되었습니다!" and empties textarea.
    - All buttons ≥ 44px tap height; full-width on mobile, side-by-side desktop.
  </action_buttons>

  <keyboard_shortcuts>
    - Tab: navigate textarea → limit controls → copy/clear buttons (natural DOM order).
    - Ctrl+A (textarea focused): select all text.
    - Esc (mobile bottom-sheet if Phase 2): close metrics panel.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <live_counting>
    - On every textarea change (debounced 300ms for performance): countCharacters, countWords, countSentences, countParagraphs, countLines, getByteSize, estimateReadingTime. Update state → re-render metrics.
    - Intl.Segmenter counts graphemes (emoji/ZWJ = 1); fallback to String.length if unavailable + warn console (no user-facing error).
  </live_counting>
  <limit_handling>
    - Preset: TV Twitter (280), Meta description (160), custom input (parsed int), or none (disabled).
    - Limit indicator color coding: ≤80% green, 80–100% yellow, >100% red.
    - No character limit enforced (user can type past limit); only visual feedback.
  </limit_handling>
  <persistence>
    - Mount: read `jurepi-char-counter-text` + `jurepi-char-counter-limit` → zod parse → state. Fail → start empty (no throw, fully usable).
    - Change: debounced 300ms write to localStorage; catch quota/security errors (private mode) → keep in-memory, no user error.
  </persistence>
  <copy>
    - Copy text: navigator.clipboard.writeText(textarea.value) → success toast. Fail → execCommand fallback → silent (copy is secondary).
    - Copy metrics: format "Characters: N\nCharacters (no spaces): M\n…" → clipboard → toast.
  </copy>
</core_functionality>

<error_handling>
  <empty_input>Empty textarea → all metrics = 0; no error state, fully functional.</empty_input>
  <large_paste>Very large paste (>100k chars) → compute debounced (300ms); no lag UI, no "please wait" message (counting is fast on desktop). Mobile: consider progressive rendering Phase 2.</large_paste>
  <grapheme_segmenter>Intl.Segmenter unavailable (old browser) → fallback to String.length. Console warn; no user error. Behavior: emoji count as 2 instead of 1 (acceptable, documented).</grapheme_segmenter>
  <storage>Private-mode/quota errors → keep in-memory (text persists for session, lost on reload); no scary error banner.</storage>
  <copy_failure>Clipboard unavailable (private, old browser) → silent fail (copy is optional, text remains in textarea).</copy_failure>
  <note>No first-party network calls → no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>Mint (var(--accent-mint) / var(--accent-mint-soft)) — "text" category identity. Progress bar fill ≤80%, metric card accent line. CTA (copy/clear) = brand honey-gold (not mint).</accent_usage>
  <typography>H1 Gmarket Sans; textarea, metrics, labels Pretendard. Metric values 18px/700; labels 13px/500.</typography>
  <motion>Debounce textarea computations (no lag); progress bar color transition 150ms --ease-out; copy toast fade-in 150ms. No transform/scale motion (counting is instant data, not playful).</motion>
  <tokens>CRITICAL: use only tokens that exist in tokens.css. Limit indicator: fill `--warning`/`--danger`, text `--warning-ink`/`--danger-ink` (NOT `--semantic-*`). Mint identity: `--accent-mint`/`--accent-mint-soft`, mint text `--accent-mint-ink`. No Tailwind default palette (gray-/sky-/text-white).</tokens>
  <responsive>Desktop: 2-column (textarea left, metrics sidebar right sticky); Mobile: single column, textarea full-width, metrics below. Textarea height 280–480px; limit controls full-width on narrow.</responsive>
  <accessibility>Textarea aria-label "Text input"; limit preset buttons aria-label include "characters" (e.g. "Twitter limit: 280 characters"). Copy/clear buttons labeled. Progress bar aria-live="polite" announces limit status on change. ≥44px tap targets. WCAG 2.1 AA contrast.</accessibility>
</aesthetic_guidelines>

<security_considerations>
  <input>Textarea value rendered as text (React escapes); dangerouslySetInnerHTML forbidden. All computed metrics are numbers (safe).</input>
  <clipboard>User-initiated copy only; never read clipboard. Copy button handler alone calls clipboard API.</clipboard>
  <privacy>Text is stored in localStorage only, never sent to server. No analytics event includes text content (only metrics counts, if any).</privacy>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>Type and paste, live metrics</description>
    <steps>
      1. Visit /ko/tools/character-counter.
      2. Type "안녕하세요" (5 syllables) → metrics update: 5 characters, 1 word, 1 sentence (non-empty no-punctuation = 1 per counting rules), 1 paragraph, 1 line.
      3. Paste long text (Lorem ipsum) → all metrics update live, no lag.
      4. Select all (Ctrl+A), copy → clipboard has text; success toast.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Limit indicator + color coding</description>
    <steps>
      1. Click "Twitter 280" preset → progress bar appears.
      2. Type 200 characters → bar is green (≤80%).
      3. Type 240 characters → bar turns yellow (80–100%).
      4. Type 300 characters → bar turns red (>100%); text "300 / 280 (OVER)" in red.
      5. Click "Custom" → input field appears; set to 400 → bar resets green, shows "300 / 400".
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Persistence, emoji, copy stats</description>
    <steps>
      1. Type "Hello 👋 world" → metrics: 13 characters with spaces / 11 without (1 emoji = 1 grapheme, if Segmenter present), 2 words. (Verified via Intl.Segmenter — do NOT pin to a hand-counted value; assert against the domain function output.)
      2. Reload page → text "Hello 👋 world" persists + limit "Twitter 280" persists.
      3. Click "통계 복사" (copy stats) → clipboard has "Characters: 13\nCharacters (no spaces): 11\nWords: 2\n…"; toast "복사됨!".
      4. Switch to /en → metrics labels change to English; text persists.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Keyboard, accessibility, reduced-motion</description>
    <steps>
      1. Tab → focus moves textarea → limit buttons → copy/clear buttons (DOM order).
      2. Keyboard-only: type in textarea, Tab to limit preset, arrow keys select, Enter to activate.
      3. axe scan → no violations; textarea + buttons labeled; focus-visible rings visible.
      4. prefers-reduced-motion: enabled → progress bar color change is instant (no transition delay).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO, empty state</description>
    <steps>
      1. /ko: all UI chrome Korean; /en: all English. Textarea placeholder bilingual (fallback style).
      2. Build prod → /ko/tools/character-counter and /en/tools/character-counter unique title/description/canonical/hreflang.
      3. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ server-rendered (SSR, not behind mounted gate).
      4. Empty textarea → all metrics = 0; no error, no broken state.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Live metrics on every keystroke (debounced, no lag); 8–10 metric types all correct; limit presets (Twitter, Meta, custom) color-coded visual feedback; copy text + stats + clear all work; persistence restores last text and limit on reload.</functionality>
  <user_experience>Instant feedback (300ms debounce imperceptible); ≥44px buttons; full keyboard operable; visible focus; no errors on edge cases (empty, very large, emoji, CRLF).</user_experience>
  <technical_quality>lib/character-counter/* pure ≥80% unit coverage (counter functions, segmenter fallback, preset logic); countCharacters emoji/grapheme tested; TS 0 errors; no file >800 lines.</technical_quality>
  <visual_design>DESIGN.md compliant; mint identity on progress bar; honey-gold CTAs; simple, bright card layout; responsive column swap at 768px.</visual_design>
  <accessibility>Full keyboard (Tab, Ctrl+A); aria-label on textarea + buttons; aria-live metric updates; WCAG 2.1 AA contrast; prefers-reduced-motion instant color change.</accessibility>
  <performance>Tool route within platform budget; no external libraries for counting; TextEncoder + Intl.Segmenter are native; localStorage debounced; CLS unaffected.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). SSG page /[locale]/tools/character-counter pre-rendered by platform generateStaticParams iterating registry (status "live"). Tool is a single Client Component; no code-split artifact.</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Counter domain: countCharacters (Intl.Segmenter + fallback), countWords, countSentences, countParagraphs, countLines, getByteSize, estimateReadingTime. All pure, fast.
    2. Hook: useState textarea, useState limit, useEffect localStorage read/write (debounced).
    3. Limit preset enum + color-coded progress bar (green → yellow → red).
    4. Clipboard copy text + copy metrics strings.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/character-counter/{counter, segmenter, preset-limits, types}.ts Vitest ≥80%: grapheme counting (emoji/ZWJ), word/sentence split, byte size, reading time; segmenter fallback tested.
    2. useCharacterCounter hook: state + localStorage + debounce + copy adapters.
    3. CharacterCounter.tsx (layout: textarea + sidebar) + CounterMetrics (grid card).
    4. LimitIndicator (presets + custom input + progress bar 3-state color).
    5. CopyButton + ClearButton (toast confirm).
    6. CounterIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD via lib/seo.ts.
    7. i18n messages (ko/en): textarea placeholder, metric labels, presets, toasts.
    8. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>Unit (Vitest): counter functions (including emoji grapheme tests, CRLF line count, UTF-8 byte encoding); segmenter fallback; preset logic. Hook: localStorage read/write, debounce, state sync. Component: textarea change → metrics update, limit color states, copy/clear. E2E (Playwright): scenarios 1–5 (type, paste, emoji, persistence, limits, keyboard, reduced-motion); visual regression 320/768/1024.</testing_strategy>
</key_implementation_notes>

</project_specification>
```
