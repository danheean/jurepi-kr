# Regex Tester — Live JavaScript Regular Expression Testing & Learning Tool — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Regex Tester** (정규식 테스트) — a browser-based interactive tool for composing, testing, and learning JavaScript regular expressions with live match highlighting, field-by-field capture-group analysis, replace preview, and a collapsible regex cheatsheet. 100% client-side: enter a pattern, test string, and flags; see matches highlighted in real time, with a detailed breakdown table showing capture groups, positions, and a replace preview using `$1`/`$<name>` syntax. Perfect for developers learning regex or debugging complex patterns.
> Internal service codename: `regex-tester`. Registry id: `regex-tester`. Public URL slug: `/[locale]/tools/regex-tester`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/json-formatter/SPEC.md`](../json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>Regex Tester — Live JavaScript Regular Expression Testing Tool (Jurepi tool, codename regex-tester, registry id regex-tester)</project_name>

<overview>
Regex Tester is an interactive sandbox for building and validating JavaScript regular expressions on the fly. A developer enters a regex pattern (with optional flags: g, i, m, s, u, y), a test string, and instantly sees every match highlighted in the test string, with a detailed breakdown table showing: match index, full match text, match position (start–end), and per-match capture groups (both numbered $1/$2/… and named groups $<name>). A separate replace-preview section shows what the test string becomes when applying a user-supplied replacement template (supporting `$1`, `$<name>`, `$&`, `$$`), helping developers understand lookahead/lookbehind and group semantics without trial-and-error in production code.

The tool surfaces JavaScript RegExp limitations and common pitfalls (catastrophic backtracking, zero-width-match infinite loops, flag semantics) in a friendly intro/FAQ, never crashes on an invalid pattern, and provides a collapsible cheatsheet for quick syntax reference (anchors, quantifiers, classes, groups, lookaround, Unicode, flags).

CRITICAL (client-only, SSG): 100% client-side, no backend, no database. The only first-party persistence is localStorage for user preferences (last pattern/flags/test string) and saved pattern library (named patterns). Pasted/tested patterns never leave the device.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. All interaction — entering pattern, test string, flags, replace preview — happens via local React state with NO route navigation and NO full page reload. Parsing and highlighting happen live (debounced 150ms) as the user types.

CRITICAL (error handling): an invalid regex pattern must not crash the app or throw uncaught errors. Catch `SyntaxError` from `new RegExp(pattern, flags)` and display a friendly, inline error message (e.g., "Invalid regular expression: unterminated character class"). Empty pattern or test string are valid no-ops (no error, no matches). Unicode (emoji, combining marks) in test strings is handled correctly.

CRITICAL (safety, catastrophic backtracking risk — be honest): JavaScript RegExp on the main thread can hang indefinitely if a pattern exhibits catastrophic backtracking (e.g., `(a+)+$` against a long non-matching string). Mitigations include: per-pattern and per-test-string length caps (pattern max 1000 chars, test string max 100KB) and a wall-clock execution guard with a timeout (e.g., 500ms); if exceeded, show "Pattern execution timed out — consider simplifying or adding anchors." CRITICAL LIMITATION (document in FAQ): this fallback guard is best-effort; a **single atomic `regex.exec()` call that is itself backtracking cannot be interrupted mid-call**. A Web Worker with `terminate()` would be a hard guarantee but is unverified in this codebase; if infra is heavy, the sync guards + caps are shipped as MVP with an honest how-to section noting the risk and workarounds.

CRITICAL (XSS-safe rendering): match highlights and replace previews render user-supplied pattern output. NEVER use `dangerouslySetInnerHTML`. Highlights are applied via CSS classes + text nodes. Copy button copies plain text only.
</overview>

<platform_integration>
  - Route: /[locale]/tools/regex-tester (SSG; registry slug "regex-tester", id "regex-tester", status "coming_soon", accent "sun", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons.
  - Consumes: i18n namespace `tools.regex-tester.*` (UI chrome strings: flag labels, error messages, copy toast, replace preview label, cheatsheet sections, how-to, FAQ — NOT user pattern/test-string data; that comes from user input).
  - NOTE (updated 2026-07-10): the `'dev'` category is ALREADY live in the platform (json-formatter, base64-encoder, url-encoder, dev-people, my-ip all ship under it). No platform prerequisite remains; this tool only adds its own registry entry.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Regex pattern input (text field with monospace font).
    - Flag toggles (5 pills: g, i, m, s, u, y) for controlling `new RegExp(pattern, flags)` behavior.
    - Test string input (large textarea) to match against.
    - Live match highlighting: every occurrence of the pattern in the test string is wrapped in a highlight span (mark element or accent-colored span). Updates on keystroke (debounced 150ms).
    - Match list table: each match row shows index (0, 1, 2…), full matched text, match position (start–end character indices), length, and a "show groups" expand toggle.
    - Capture groups breakdown (per match): table or detail panel showing capture group index/name → captured value for each match. Unnamed groups display as $1, $2, etc.; named groups display as $<name>. Empty/non-participating groups show as "(not captured)".
    - Replace preview section: user enters a replacement template (supporting `$1`, `$2`, `$<name>`, `$&`, `$$`). The tool shows the result of applying that template to each match, and displays the final text (all replacements applied, assuming global flag). Before/after side-by-side view.
    - Invalid pattern error: catch `SyntaxError`, display friendly message (e.g., "Invalid regular expression: incomplete quantifier"). Do NOT show the full stack trace.
    - Execution timeout guard: if pattern matching takes >500ms, display "Pattern execution timed out" and allow user to cancel or simplify. Length caps (pattern 1KB, test string 100KB) with user-friendly overflow messages.
    - Regex cheatsheet: collapsible accordion sections covering anchors (^, $, \b), quantifiers (*, +, ?, {n,m}), character classes ([abc], \d, \s, \w, negation), groups & alternation ((…), |), lookahead/lookbehind ((?=…), (?!…), (?<=…), (?<!…)), flags (g, i, m, s, u, y), Unicode escapes (\uXXXX, \p{…}), and common gotchas (zero-width matches, greedy vs lazy).
    - Preset patterns: curated regex library (email, URL, phone, date, IPv4/v6, UUID, Korean phone number, etc.) — one click loads into pattern field.
    - Saved pattern library (localStorage): save current pattern + flags + test string under a name; load, delete, edit.
    - Copy buttons: copy full match, capture group value, or entire result text; uses navigator.clipboard with textarea fallback; silent fail if unavailable.
    - localStorage persistence: last pattern/flags/test-string, saved patterns (max 50), preferences.
    - Tool-specific SEO long-form ("JavaScript RegExp basics", "capture groups explained", "common pitfalls") + FAQ (FAQPage JSON-LD), localized ko/en.
    - Keyboard support: Tab through fields, Ctrl+Enter run/update matches, copy shortcut.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - RegExp from non-JavaScript engines (PCRE, Python re, Perl) — tool is JS-only; how-to notes dialect differences if relevant.
    - Real-time backtracking visualizer or step-through debugger — Phase 2 candidate.
    - Regex-to-English explanation generator (AI-powered) — out of scope (no LLM).
    - Deep-link shareable URLs with pre-filled pattern/test string — Phase 2 (privacy trade-off).
    - Complex test case file upload (single textarea input only).
    - Performance benchmark or RegExp.exec loop timing — Phase 2.
  </out_of_scope>
  <future_considerations>
    - Shareable regex deep-link (`?pattern=…&flags=…&test=…`, URL-encoded) — Phase 2.
    - Import/export pattern library as JSON file — Phase 2.
    - Real-time backtracking visualization or lookahead/lookbehind step-through — Phase 3.
    - RegExp object serializer (generate code snippet: `const re = /…/…`) — Phase 2.
    - Regex tournament mode (interactive challenges: write a pattern to match X but not Y) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <pattern_compilation>Compile via `new RegExp(pattern, flags)` in try/catch (SyntaxError → friendly typed InvalidPatternError). Flags are joined from user toggles (e.g., 'gi' from g + i toggles).</pattern_compilation>
    <matching>Use `regex.exec()` in a loop (if g flag) or single call (no g flag) to find all matches. Track match positions via `match.index` and `match[0…N]` for capture groups. Guard with iteration counter + wall-clock timeout (500ms).</matching>
    <highlight_spans>Build match indices into an array of { start, end, type: 'match' | 'group' }. Render test-string slices as React text nodes with span elements for highlights — NEVER dangerouslySetInnerHTML.</highlight_spans>
    <replace_preview>Apply user-supplied replacement template to the pattern using `String.prototype.replace(regex, replacementTemplate)` with `$1`, `$<name>`, `$&`, `$$` semantics. Show before/after in a two-column view. Guard with same timeout as matching.</replace_preview>
    <presets>Curated regex constant module (`lib/regex-tester/presets.ts`) with named patterns (email, URL, phone, date, IPv4, UUID, Korean patterns). Localized display names via i18n.</presets>
    <validation>zod v3.x (repo has zod) for localStorage store schema (pattern library, preferences, last-used state).</validation>
    <localStorage>jurepi-regex-tester key; zod-validated; auto-prune invalid on load; fail gracefully if unavailable.</localStorage>
    <clipboard>navigator.clipboard.writeText() → textarea fallback → silent fail (copy is secondary).</clipboard>
    <timeout_guard note="hard requirement">Synchronous timeout check: set a deadline at the start of matching/replace operations; check wall-clock time every N iterations. If exceeded, abort and show friendly "Pattern execution timed out." Input-length caps (pattern 1KB, test string 100KB) are the primary mitigation; the timeout is a secondary safety net. If this ships, document in FAQ that extreme regexes **may briefly hang the tab** and recommend splitting patterns or using anchors to avoid backtracking.</timeout_guard>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; reused for store/pattern schema validation.</zod>
  </libraries>
  <note>CRITICAL: NO backend, NO third-party API, NO network calls.</note>
</technology_stack>

<file_structure>
src/
├── lib/regex-tester/                      # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: PresetPattern, SavedPattern, Settings, PatternResult
│   ├── compiler.ts                        # compilePattern(pattern, flags): RegExp | { error: InvalidPatternError }
│   ├── matcher.ts                         # findMatches(text, regex, {timeoutMs, capsCap}): {matches: Match[], timedOut}
│   ├── capture-groups.ts                  # extractGroups(match, regex): {named: Record<string, string>, indexed: string[]}
│   ├── replace-preview.ts                 # applyReplaceTemplate(text, regex, template, {timeoutMs}): {result, timedOut}
│   ├── highlight-ranges.ts                # textToHighlightRanges(text, matches): HighlightRange[] (for rendering)
│   ├── presets.ts                         # PRESET_PATTERNS: typed constant with name, pattern, flags, example
│   └── constants.ts                       # PATTERN_MAX_CHARS, TEST_STRING_MAX_CHARS, TIMEOUT_MS
├── components/tools/regex-tester/
│   ├── RegexTester.tsx                    # Orchestrator (Client Component) — state owner
│   ├── useRegexTester.ts                  # Hook: pattern/flags/test-string state, localStorage, localStorage persist
│   ├── PatternInput.tsx                   # Pattern text field + inline error message
│   ├── FlagToggles.tsx                    # 5 pill buttons: g, i, m, s, u, y
│   ├── TestStringInput.tsx                # Large textarea for test string
│   ├── MatchList.tsx                      # Table: index, full match, position, actions
│   ├── MatchDetails.tsx                   # Expand/collapse: capture groups breakdown per match
│   ├── ReplacePreview.tsx                 # Template input + before/after two-column view
│   ├── TestStringHighlighted.tsx          # Test string with highlights; uses highlight-ranges to render spans
│   ├── RegexCheatsheet.tsx                # Collapsible accordion: sections (anchors, quantifiers, classes, groups, lookaround, flags, Unicode, gotchas)
│   ├── PresetPatterns.tsx                 # Dropdown or button grid: load preset into pattern field
│   ├── SavedPatternLibrary.tsx            # List of saved patterns; load/delete/edit buttons
│   ├── ErrorMessage.tsx                   # Friendly error display for SyntaxError, timeout, etc.
│   ├── RegexTesterIntro.tsx               # H1 + lead (SEO long-form)
│   ├── RegexTesterHowTo.tsx               # "How to use regex", "capture groups", "flags explained" (SEO)
│   ├── RegexTesterFaq.tsx                 # FAQ + FAQPage JSON-LD
│   └── CopyButton.tsx                     # Copy to clipboard (with toast feedback)
└── i18n/messages/{ko,en}.json             # tools.regex-tester.* UI chrome
</file_structure>

<core_data_entities>
  <pattern_state>
    - pattern: string — the regex pattern entered by user.
    - flags: string — concatenated flags (e.g., 'gi').
    - isValid: boolean — whether pattern compiles without error.
    - error?: string — SyntaxError message if invalid.
    PERSISTENT: localStorage key `jurepi-regex-tester` stores { pattern, flags, testString, savedPatterns, presets }.
  </pattern_state>
  <match>
    - index: number — 0-indexed match ordinal.
    - fullMatch: string — the substring matched by pattern.
    - position: { start: number; end: number } — character indices in test string (0-indexed).
    - captureGroups: { numbered: string[]; named: Record<string, string> } — $1/$2/… and $<name> values.
  </match>
  <highlight_range>
    - start: number — character index in test string.
    - end: number — character index in test string.
    - type: 'match' | 'capture-group' — for styling (accent color for match, lighter for nested group).
  </highlight_range>
  <preset_pattern>
    - id: string — unique identifier (e.g., 'email', 'url', 'korean-phone').
    - name: string — display name (i18n key path).
    - pattern: string — the regex.
    - flags: string — default flags.
    - example: string — sample test string.
    - description: string — brief explanation (i18n key path).
  </preset_pattern>
  <saved_pattern>
    - id: string — UUID or timestamp.
    - name: string — user-given label.
    - pattern: string — the regex.
    - flags: string — flags.
    - testString: string — last test string used with this pattern.
    - createdAt: number — timestamp.
  </saved_pattern>
  <constants>
    - DEBOUNCE_MS = 150ms (match computation on keystroke delay).
    - PATTERN_MAX_CHARS = 1000.
    - TEST_STRING_MAX_CHARS = 100_000 (100KB).
    - TIMEOUT_MS = 500ms (pattern execution guard).
    - SAVED_PATTERNS_MAX = 50.
  </constants>
</core_data_entities>

<route_definitions>
/[locale]/tools/regex-tester
  - SSG page.
  - Breadcrumb: Home > Tools > Regex Tester.
  - Metadata: from `generateMetadata(locale)` using `seo.absoluteToolUrl('regex-tester', locale)` as canonical.
  - Error Boundary wraps the RegexTester component.
  - Intro/HowTo/Faq sections rendered outside `mounted` gate (SSR).
  - ShareButtons auto-wired by route template.
</route_definitions>

<component_hierarchy>
RegexTester (Client Component, root)
├── PatternInput + FlagToggles (controlled inputs)
├── TestStringInput (large textarea)
├── MatchList (table, update on regex/text change)
├── MatchDetails (expand per-match capture groups)
├── ReplacePreview (template input + before/after)
├── TestStringHighlighted (highlights from matches)
├── PresetPatterns (button grid or dropdown)
├── SavedPatternLibrary (list + CRUD buttons)
├── RegexCheatsheet (collapsible sections)
├── ErrorMessage (conditional inline error)
└── CopyButton (copy to clipboard)

Server Components (SEO):
├── RegexTesterIntro (H1 + lead paragraph)
├── RegexTesterHowTo (multi-section guide, game-like)
├── RegexTesterFaq (questions + answers, FAQPage JSON-LD emitted by Faq component)
└── StructuredData (SoftwareApplication JSON-LD, url == canonical)
</component_hierarchy>

<pages_and_interfaces>
Interactive Tool (Client SPA):
  - PatternInput: One-line text field, monospace font, aria-label "Regular expression pattern", shows inline error below if invalid, onChange → debounce → recompile + re-highlight.
  - FlagToggles: Five toggle pills (g, i, m, s, u, y), each aria-pressed, onChange → rebuild flags string + recompile.
  - TestStringInput: Large multi-line textarea, aria-label "Test string", onChange → debounce → re-highlight.
  - MatchList: Table-like view (div grid or actual table) with columns: index #, matched text (monospace), position (start–end), length, actions (copy, expand details). If no matches, show "No matches found."
  - MatchDetails: Expandable row per match; shows capture group table (index/name → value). Unnamed groups labeled $1, $2, etc. Named groups labeled $<name>. Empty capture → "(not captured)".
  - ReplacePreview: Two-column section: left = replacement template input (text field, docstring "e.g., $1-$2, $<month>-$<day>"), right = result (monospace, read-only). Shows final text if applied to all matches.
  - TestStringHighlighted: The test string with matches highlighted. Rendered as text nodes + span elements (accent color for match, subtle background for groups). Click a match → scroll to MatchDetails? (optional interaction).
  - PresetPatterns: Button grid or dropdown ("Load preset…") listing email, URL, phone, date, UUID, Korean patterns. Click → populate pattern field + load example test string.
  - SavedPatternLibrary: Collapsible section listing saved patterns (name, partial pattern preview, created date). Per-pattern: Load / Delete / Rename buttons. Max 50 stored.
  - RegexCheatsheet: Collapsible accordion with sections: Anchors, Quantifiers, Character Classes, Groups & Alternation, Lookahead/Lookbehind, Flags, Unicode, Common Gotchas. Each section has subsections with syntax + example (e.g., "\d → any digit, same as [0-9]").
  - ErrorMessage: Inline callout (role=alert) if pattern is invalid or execution timed out. Shows friendly message + suggestion.
  - CopyButton: Per copyable item (matched text, group value, result). Uses navigator.clipboard; shows toast "Copied!" on success; silent fail otherwise.

SEO/Long-form (SSR):
  - RegexTesterIntro: H1 "정규식 테스트" + brief lead explaining the tool.
  - RegexTesterHowTo: Sections (multi-paragraph each): "Getting Started", "Understanding Flags", "Capture Groups Explained", "Replace Preview & Templates", "Common Mistakes & How to Fix Them".
  - RegexTesterFaq: 5–8 Q/A pairs (localized i18n, e.g., "What's the difference between g and m flags?", "Can I use lookahead in JavaScript?", "Why does my pattern hang?", "How do I match Unicode characters?"). FAQPage JSON-LD emitted by Faq component.
</pages_and_interfaces>

<core_functionality>
1. **Pattern Compilation & Validation**: User types pattern and/or toggles flags. Debounced (150ms) `new RegExp(pattern, flags)` in try/catch. If SyntaxError, show friendly error inline; otherwise, clear error state.

2. **Live Matching**: Once pattern is valid, scan test string for all matches (via `regex.exec()` in loop if g flag, or single call). Guard with iteration counter + 500ms timeout. Build Match objects with index, fullMatch, position, and capture groups (both named and numbered).

3. **Highlight Rendering**: Convert Match array into HighlightRange array (start/end indices). Render test string as React text nodes + span elements (accent color for matches, lighter for participating groups). Interleave highlights correctly (no overlaps in rendering).

4. **Capture Group Extraction**: Per match, extract `match[0…N]` (numbered) and `match.groups` (named, if regex has named groups). Display in MatchDetails table or panel.

5. **Replace Preview**: User enters replacement template (supporting `$1`, `$<name>`, `$&`, `$$`). Apply via `String.replace(regex, template)` and show result in before/after view. Explain what each `$X` expands to.

6. **Preset Loading**: User clicks a preset → pattern field is populated, flags are set, example test string is loaded into test-string textarea.

7. **Save/Load Patterns**: User saves current state under a name → localStorage. Load, delete, or edit saved patterns from the library panel.

8. **Copy Operations**: User copies matched text, group value, or entire result → navigator.clipboard (with textarea fallback). Toast feedback on success.

9. **Cheatsheet & Help**: Collapsible cheatsheet with syntax reference. FAQ and HowTo sections for learning.
</core_functionality>

<error_handling>
- **SyntaxError (invalid pattern)**: Catch, extract message, display friendly inline error (e.g., "Invalid regular expression: unterminated group"). Do NOT crash or throw uncaught error.
- **Timeout on matching/replace**: If wall-clock time exceeds 500ms, abort operation, show "Pattern execution timed out — the pattern may be too complex for this test string. Try adding anchors or simplifying." User can edit pattern or test string.
- **Empty pattern or test string**: Treated as valid no-op. Pattern = "" matches "" (or empty string in test), test string = "" has no matches. No error state.
- **localStorage unavailable**: In-memory fallback (saved patterns lost on page reload). User is NOT shown an error; tool still functions.
- **Clipboard API unavailable**: Silent fail (copy button becomes no-op or shows "Copy not supported"). Tool still functions.
- **Large input**: If test string > 100KB or pattern > 1KB, show friendly "Input too large. Max 100KB test string, 1KB pattern." User can shorten.
- **Unicode edge cases**: Emoji, combining marks, surrogates — test with `[Symbol.iterator]` or `.codePointAt()` to count correctly. Flag `u` enables Unicode-aware behavior.
</error_handling>

<aesthetic_guidelines>
- Accent color (sun — `#fbbf24` / var(--accent-sun)) used for: match highlights in test string, active flag pills, button hover states.
- Monospace font (Monaco, Courier New) for: pattern input, test string, matched text, replace template, cheatsheet code examples.
- Flags styled as pill buttons (small rounded, toggled via aria-pressed). Active state uses accent background + text-on-accent.
- Match list as a clean table (or grid of cards on mobile) with subtle row separators. Hover state lifts the row slightly (shadow).
- Cheatsheet in collapsible accordion; section headers use headline typography, code examples use monospace.
- Dark theme colors: accent-sun in dark mode shifts to brighter yellow (via --dark-accent-sun or equivalent).
- Reduced motion: disable highlight fade-in; cheatsheet accordion opens instantly, no slide animation.
- Focus visible: all buttons and interactive elements have `focus-visible` ring.
</aesthetic_guidelines>

<security_considerations>
- **XSS Prevention**: Match highlights and replace previews render user pattern output. Use React text nodes + CSS classes, never `dangerouslySetInnerHTML`. Copy button copies plain text only.
- **Input Validation**: Pattern and test string come from user input (textarea, normal DOM, not eval). Regex is compiled via `new RegExp()` constructor (standard, safe). No user code execution.
- **Clipboard Safety**: `navigator.clipboard.writeText()` is safe (no executing code). Fallback textarea trick is standard.
- **localStorage Injection**: Validate loaded data with zod before using. Fail gracefully if schema is invalid (discard saved patterns, fresh start).
</security_considerations>

<advanced_functionality>
- **Flag Semantics**: Each flag (g, i, m, s, u, y) changes matching behavior. Explain in cheatsheet + FAQ. E.g., `m` makes ^ and $ match line boundaries, not just string start/end; `u` enables Unicode property escapes (\p{…}); `y` makes exec() sticky (starts from lastIndex).
- **Named Capture Groups**: Regex like `(?<month>\d{1,2})-(?<day>\d{1,2})` populates `match.groups`. Display both numbered and named in MatchDetails.
- **Lookahead/Lookbehind**: `(?=…)`, `(?!…)`, `(?<=…)`, `(?<!…)` supported (ES2018+). Cheatsheet explains non-capturing syntax and edge cases.
- **Unicode Property Escapes**: `\p{Letter}`, `\p{Number}`, etc. (with `u` flag). Cheatsheet covers common properties.
- **Zero-Width Matches**: Patterns like `(?=)` match empty string → infinite loop risk in exec(). Guard against by checking if match.index advanced; if not, skip to next position.
</advanced_functionality>

<final_integration_test>
Scenario 1: **Email validation pattern** — User loads email preset; pattern = `/^[\w.-]+@[\w.-]+\.\w+$/gi`. Test string contains "john@example.com alice@test.co.uk invalid@@email". Matches highlighted; 2 matches shown in MatchList; no capture groups (none in pattern). Cheatsheet open, accessible.

Scenario 2: **Named groups & replace** — User enters pattern `/(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})/g` and test string "2024-7-15 2024-12-25". Matches 2 occurrences. MatchDetails show year/month/day capture groups. Replace template = `$<month>/$<day>/$<year>` → result shows "7/15/2024 12/25/2024". All parts work together.

Scenario 3: **Invalid pattern error recovery** — User enters pattern `(unclosed`. SyntaxError caught; friendly error "Invalid regular expression: unterminated group" displayed inline. User fixes to `(unclosed)`, error clears, matches re-compute. No crash.

Scenario 4: **Timeout on catastrophic backtracking** — User enters pattern `(a+)+b$` (backtracking bomb) and test string 100KB of 'a' characters (no 'b' at end). Matching starts, timeout timer runs, wall-clock 500ms exceeded → operation aborts, "Pattern execution timed out" shown. Tab stays responsive. User can simplify pattern or shorten test string.

Scenario 5: **Saved & shared patterns** — User saves current email pattern as "email-strict". Later, in a new session, loads the saved pattern from SavedPatternLibrary. Preset and saved pattern interact clearly (one-click load vs manual name entry). localStorage persisted across page reloads.

Scenario 6: **Keyboard accessibility** — User tabs through PatternInput → FlagToggles (each pill) → TestStringInput → CopyButton. All focusable, aria-labels clear. Cheatsheet expand/collapse via Space/Enter (if using button semantic). No visual focus lost.

Scenario 7: **Reduced motion compliance** — User has OS reduced-motion preference enabled. Highlights appear/disappear instantly (no fade), cheatsheet accordion opens instantly (no slide), no animation library used. Tool is fully functional, instant feedback.

Scenario 8: **Copy fallback** — On a browser with clipboard API disabled (old or privacy mode), user clicks "Copy" on a matched text. Fallback textarea is used; if successful, "Copied!" toast shown; if not, silent fail. No error message; tool remains usable.

Scenario 9: **en/ko language switching** — User switches locale via header theme toggle. All UI strings (labels, button text, error messages, cheatsheet sections) update via next-intl. Pattern and test string preserve (not localized). FAQ/HowTo sections also re-render with ko or en text.

Scenario 10: **Mobile responsive** — On 320px width, MatchList becomes a single-column card layout (not a table grid). Preset buttons stack. Test string textarea is full width. Cheatsheet is still collapsible, readable. No overflow, no horizontal scroll. Touch targets ≥44×44px.
</final_integration_test>

<success_criteria>
- **Correctness**: Pattern matching, capture groups, replace preview all match native JavaScript RegExp behavior.
- **Safety**: No uncaught errors; timeout guard prevents tab freeze (best-effort for sync, hard guarantee with Worker if implemented); XSS-safe rendering.
- **Usability**: All user interactions (pattern input, flag toggles, matching, copying, saving) complete within 150–300ms (debounced, instant for toggle clicks). Error messages are friendly and actionable.
- **Accessibility**: WCAG 2.1 AA; keyboard navigation; prefers-reduced-motion respected; screen reader announces errors and results.
- **Performance**: Full matching/highlighting on 100KB test string completes in <500ms (guard timeout).
- **SEO**: Title, description, Intro/HowTo/FAQ sections indexed; SoftwareApplication + FAQPage JSON-LD emitted; canonical URL correct.
- **Localization**: All user-facing strings in i18n namespace `tools.regex-tester.*` (ko/en); no hardcoded English.
- **Mobile**: Responsive layout (320px+); touch interactions work; no horizontal scroll.
- **Platform Integration**: Registry entry added (id, slug, accent, category, status, addedAt); route with proper generateMetadata and Error Boundary; shareButtons auto-wired.
</success_criteria>

<build_output>
File structure under src/:
- lib/regex-tester/ (7 modules, ~400 lines total, 95%+ unit test coverage)
- components/tools/regex-tester/ (14 component files, ~800 lines total, 85%+ coverage)
- i18n/messages/{ko,en}.json (tools.regex-tester.* keys added; ~80 strings)

Registry entry (tools/registry.ts):
```ts
{
  id: 'regex-tester',
  slug: 'regex-tester',
  category: 'dev',
  icon: 'RegEx', // or similar lucide icon
  accent: 'sun',
  status: 'coming_soon',
  order: 21,
  addedAt: '2026-07-10',
  keywords: ['regex', 'regexp', 'test', 'pattern', 'capture', 'javascript']
}
```

i18n keys (tools.regex-tester.*):
- title, description (top-level, dashboard card)
- patternLabel, flagLabel, testStringLabel, replaceLabel
- noMatches, timeoutError, invalidPattern
- matchCount, captureGroups, replace, copy, save, load
- cheatsheet.title, cheatsheet.{anchors,quantifiers,classes,groups,lookaround,flags,unicode,gotchas}
- howTo.title, howTo.sections[…]
- faq.items[{q, a}]

Sitemap: single /[locale]/tools/regex-tester entry (no spoke routes; single-page interactive tool like character-counter).

SEO metadata:
- canonical: seo.absoluteToolUrl('regex-tester', locale)
- og:title, og:description from i18n title/description
- JSON-LD: SoftwareApplication (url == canonical), FAQPage emitted by Faq component

Build time: ~8–12 seconds (vitest + tsc + next build with minor tool module overhead).
</build_output>

<key_implementation_notes>
1. **Registry Entry**: id/slug `regex-tester`, category `dev` (already live), accent `sun` (free), status `coming_soon`, `addedAt: '2026-07-10'` (REQUIRED). Order = 21 (to avoid conflicts; adjust if needed).

2. **i18n Namespace**: All user-facing strings in `tools.regex-tester.*`. Top-level `title` and `description` required (dashboard card consumption). No hardcoded English in domain layer (error messages, help text all in i18n).

3. **Critical Paths**:
   - Pattern input → compile (try/catch) → if valid, do matching + highlights.
   - Matching → timeout guard (500ms), iteration counter cap → if exceeded, abort + show friendly error.
   - Replace preview → apply template (guard timeout too).
   - All timings use wall-clock (Date.now()) — no setTimeout.

4. **Test Strategy (TDD)**:
   - Domain (`lib/regex-tester/`): Unit tests for compiler, matcher, capture-groups, replace-preview, presets. Coverage ≥95%.
   - Components: Snapshot tests + RTL rendered tests for PatternInput, FlagToggles, ErrorMessage. MockRegExp for integration.
   - E2E (Playwright): Pattern input → matches displayed → copy works → replace preview updates. Test both valid and invalid patterns, timeout guard, flag toggles, ko/en UI strings.

5. **Recommended Build Order**:
   - Phase 1a: Domain (compiler, matcher, capture-groups, replace-preview). TDD red→green.
   - Phase 1b: Constants, presets, localStorage schema (zod).
   - Phase 2a: Hook (useRegexTester) + root RegexTester orchestrator.
   - Phase 2b: Input components (PatternInput, FlagToggles, TestStringInput, MatchList).
   - Phase 2c: Display components (MatchDetails, ReplacePreview, TestStringHighlighted, RegexCheatsheet).
   - Phase 3: Preset/SavedPatternLibrary, CopyButton.
   - Phase 4: SEO (Intro, HowTo, Faq), registry entry, i18n keys.
   - Phase 5: E2E tests, design polish, accessibility audit.

6. **Timeout Guard MVP**: Synchronous deadline check (best-effort). If heavy, defer Web Worker to Phase 2 and clearly document in FAQ that extreme regexes may briefly hang.

7. **Flag Semantics in How-To**: Each flag (g, i, m, s, u, y) must have a plain-English explanation + example. Gotchas (m changes `^`/`$` meaning, u enables Unicode escapes, y is sticky) prominently featured.

8. **Copy Button UX**: Per-match "copy" button copies the matched text. Replace result section has a "copy result" button copying the entire final text. Visual feedback: toast "Copied!" (or similar, from platform Toast system).

9. **Responsive Design**: On mobile (320px), match list becomes single-column cards. Textarea full width. Cheatsheet collapsible. No horizontal scroll. Test with Playwright `page.setViewportSize({ width: 320, height: 800 })`.

10. **Zero-Width Match Risk**: If a pattern like `(?=)` matches empty string, `regex.exec()` can loop forever (lastIndex doesn't advance). Guard: after each match, check if `match.index === prevMatch.index`; if true, advance lastIndex manually to avoid infinite loop.
</key_implementation_notes>

</project_specification>
```
