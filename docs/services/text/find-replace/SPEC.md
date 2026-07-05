# 문장 바꾸기 (Text Replacer — Multi-rule find & replace, regex optional) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **문장 바꾸기 / Text Replacer** (Korean display name: **문장 바꾸기**; English display name: *Text Replacer*) — a client-side tool that takes a block of text and applies **one or many find → replace rules at once**, replacing every occurrence across the whole text, with a live highlighted preview and per-rule replacement counts. Plain-text literal replacement is the **default**; each rule can optionally opt into **regex mode** (capture groups, `$1`/`$<name>` in the replacement), plus per-rule options (case-sensitive, whole-word). Curated **preset rule-sets and transforms** (e.g., "여러 줄 → JavaScript 문자열") are one click away. Saved rule-sets and recents live in localStorage. 100% client-side, fully unit-tested domain logic. The tool mounts as a client-side SPA on the platform shell.
>
> Internal service codename: `find-replace`. Registry id: `find-replace`. Public URL slug: `/[locale]/tools/find-replace`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same interactive-utility pattern): [`docs/services/dev/url-encoder/SPEC.md`](../../dev/url-encoder/SPEC.md)

```xml
<project_specification>

<project_name>문장 바꾸기 (Text Replacer) — Multi-rule find & replace over a block of text, plain-text by default with optional per-rule regex (Jurepi tool, codename find-replace, registry id find-replace)</project_name>

<overview>
문장 바꾸기 (Text Replacer) makes bulk text substitution effortless. A user pastes a block of text and defines **one or more find → replace rules**; the tool applies every enabled rule across the entire text at once, shows the result with each changed span highlighted, and reports how many replacements each rule made. This solves the everyday need: "이 글에서 이 단어들을 전부 다른 단어로 바꿔줘" — swapping a name throughout a document, normalizing terminology, cleaning up a pasted log, converting a word list, and so on.

The core is **plain-text (literal) replacement by default** — no regex knowledge required. Each rule matches the literal text you type and replaces every occurrence. But power users can flip a per-rule **정규식(regex) 스위치** to treat the "find" field as a JavaScript regular expression, unlocking capture groups and `$1`/`$<name>` substitution in the "replace" field. Per-rule options — **대소문자 구분(case-sensitive)** and **전체 단어만(whole word)** — cover the common precision needs without regex.

Rules are applied **in order, top to bottom**, and the tool makes that explicit: rule 2 sees the output of rule 1, so ordering is a feature (chain transforms) that the UI surfaces clearly so results are never surprising.

A **preset library** provides ready-made rule-sets and one-click transforms (e.g., "여러 줄 → JavaScript 문자열", "빈 줄 제거", "연속 공백 1칸", "따옴표 정리(스마트→일반)", "전각→반각") — the reasons people reach for a replace tool in the first place. Saved rule-sets and recent inputs live in localStorage for reuse.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database, no runtime API calls. The only first-party persistence is localStorage (saved rule-sets + recents). Nothing — text or rules — is ever sent to the network. Literal replacement and regex both use the native JavaScript engine.

CRITICAL (safety — regex mode never freezes the tab): a per-rule regex can be a catastrophic-backtracking pattern (e.g., `(a+)+$`) against a long text and freeze the tab. Regex-mode rules MUST run inside a guard (see technology_stack). Global-flag replacement loops MUST guard zero-length matches (advance `lastIndex`) to avoid infinite loops. Literal (default) mode is inherently safe.

CRITICAL (error handling, robustness): an invalid regex (`SyntaxError`) in a regex-mode rule never crashes the app — that rule shows a friendly, localized error and is skipped; other rules still apply. Empty "find" fields are skipped (no-op, never an error). Empty text is a valid no-op. Unicode (emoji, CJK, combining marks) is replaced correctly. All edge cases are unit-tested ≥90% domain coverage.

CRITICAL (usability-first, SPA): per the platform rule, every Jurepi tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. ALL interaction — editing text, adding/removing/reordering rules, toggling options, applying presets, copying — happens via local React state with NO route navigation and NO full page reload. Usability is paramount: paste text, add rules, see the result highlight live, copy, done.
</overview>

<platform_integration>
  - Route: /[locale]/tools/find-replace (SSG; registry slug "find-replace", id "find-replace", status "coming_soon", accent "grape", category "text").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons.
  - Consumes: i18n namespace `tools.find-replace.*` (UI chrome strings: rule field labels, option labels/descriptions, preset names, error messages, regex cheatsheet copy, how-to, FAQ — NOT the user's text/rules). MUST include top-level `tools.find-replace.title` and `tools.find-replace.description` (consumed by dashboard card, footer, searchable-tools index).
  - Platform dependency (category note): this tool lives in the `'text'` category (텍스트), already active (character-counter/new-word present). The only platform change is adding ONE ToolMeta registry entry, a slug→component branch in the tool route, and a generateMetadata branch. Single-page interactive utility → NO spoke routes (no entity collection to index; same as character-counter/url-encoder).
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **Source text input**: a large multi-line textarea (paste target) that the rules operate on.
    - **Multiple find → replace rules (the core)**: an ordered list of rules; each rule = find field + replace field + per-rule toggles. Add / remove / reorder (drag or up/down) / enable-disable / duplicate. All enabled rules apply together (sequentially, top→bottom) to produce the result.
    - **Literal (plain-text) replacement by default**: the "find" field matches literal text; every occurrence is replaced. No regex needed. This is the default mode for every new rule.
    - **Per-rule options**: 대소문자 구분(case-sensitive, default OFF), 전체 단어만(whole word — match only at word boundaries, default OFF), 정규식(regex mode — treat "find" as a JS RegExp, default OFF).
    - **Regex mode (optional, per rule)**: when ON, "find" compiles as `new RegExp(find, flags)`; "replace" supports `$1`/`$<name>`/`$&`/`$$`; a small flags affordance (i, m, s, u — g is implicit "replace all"). Invalid pattern → per-rule friendly error, rule skipped, others continue. Guarded execution (ReDoS).
    - **Replace-all semantics**: every rule replaces ALL occurrences by default (the whole point). An optional per-rule "첫 번째만(first only)" toggle for the occasional single-replace need.
    - **Live highlighted preview + counts**: the result text renders with each replaced span highlighted (built from indices, never innerHTML); a per-rule badge shows replacement count ("N곳 변경"); a total summary. Updates on every edit (debounced, guarded).
    - **Order transparency**: UI states rules apply top→bottom and rule N sees rule N-1's output; reordering re-computes.
    - **Preset library (rule-sets + transforms)**: one-click presets that populate rules or run a built-in transform — e.g. "여러 줄 → JavaScript 문자열"(escape + `\n` + wrap), "JavaScript 문자열 → 원문", "빈 줄 제거", "앞뒤 공백 제거", "연속 공백 1칸", "따옴표 정리(스마트 → 일반)", "전각 → 반각", "줄 앞 번호 제거", "각 줄을 배열 항목으로". Template presets populate visible/editable rules; multi-step ones (JS-string escaping) run as named built-in transforms.
    - **Saved rule-sets + recents**: save the current rule list under a name; recent source texts — localStorage, auto-prune invalid on load.
    - **Copy / download result**: copy replaced text to clipboard (with fallback); download as .txt.
    - **Regex cheatsheet**: a collapsible syntax reference (anchors, quantifiers, classes, groups, lookaround, flags), shown/emphasized when any rule uses regex mode. Documentation only.
    - **Localized UI chrome + errors** (ko/en via tools.find-replace.*).
    - **Full keyboard support**: Tab through fields, add-rule shortcut, Esc, copy shortcut.
    - **Tool-specific SEO long-form** ("여러 단어를 한 번에 바꾸는 법" / "찾아 바꾸기 vs 정규식" / "대소문자·전체 단어 옵션" / "규칙 적용 순서") + FAQ (FAQPage JSON-LD), localized ko/en.
    - **Reduced-motion fallbacks**; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - AI paraphrase / rewrite / summarization ("문장 바꾸기"는 단어·구절 치환 도구이지, 의역·재작성 AI가 아님 — intro/how-to에 명시). No LLM, no network.
    - Non-JavaScript regex dialects (PCRE, Python `re`, POSIX) in regex mode — engine is native JS `RegExp`; how-to notes dialect differences.
    - Multi-file / document-format editing (docx, pdf). Plain text only.
    - Backend API (all replacement is client-side, 0-latency, private).
    - Step-by-step regex backtracking visualizer — Phase 2 candidate.
    - Deep-link URLs with pre-filled text/rules — Phase 2 (privacy trade-off; opt-in only).
  </out_of_scope>
  <future_considerations>
    - Shareable rule-set deep-link (`?rules=…`, text excluded for privacy) — Phase 2.
    - Import/export rule-sets as JSON file — Phase 2.
    - Column/CSV-aware replace (replace only in a chosen column) — Phase 3.
    - Regex backtracking visualizer — Phase 3.
    - Additional locale-specific preset packs — data only, no schema change.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <literal_replace>Default mode. Build a `RegExp` from the escaped literal find (`escapeRegExp(find)`) with flags derived from options: global always (replace-all) unless "first only"; `i` when NOT case-sensitive; word-boundary wrap `\b…\b` (or Unicode-aware boundary) when "whole word". Replacement is a literal string ('$' escaped so `$1` is not interpreted in literal mode). Pure, synchronous, inherently ReDoS-safe (fixed literal).</literal_replace>
    <regex_replace note="opt-in per rule">Compile via `new RegExp(find, normalizedFlags)` in try/catch (SyntaxError → typed InvalidPatternError). Replacement passes through native `String.replace` with `$1`/`$<name>`/`$&`/`$$` semantics. Guarded execution (see redos_guard).</regex_replace>
    <apply_pipeline>applyRules(text, rules, {deadlineMs}): fold enabled rules left→right; each step = applyRule(prevText, rule) returning { text, count, spans }. Aggregate perRuleCounts and the final output; collect highlight spans from the LAST computed positions on the output. Deterministic; pure.</apply_pipeline>
    <redos_guard note="hard requirement — applies to regex-mode rules only (literal is safe)">
      - Preferred: run regex-mode application inside a **Web Worker** with `Worker.terminate()` after a timeout (e.g., 500ms), so a hostile pattern cannot freeze the UI thread.
      - Fallback (if worker infra is heavy for MVP): synchronous deadline-checked replace loop with a conservative input-length cap and a wall-clock check every K iterations.
      - CRITICAL LIMITATION (be honest about the guarantee): JavaScript is single-threaded, so a wall-clock check **between** iterations CANNOT interrupt a **single** atomic `regex.exec`/`replace` call that is itself backtracking catastrophically. The deadline-loop fallback is therefore **best-effort**, not a hard guarantee; the ONLY true "never freezes" guarantee is the Web Worker (`terminate()`). If the fallback ships, the how-to MUST say the tab may briefly hang on an extreme regex, and input-length + pattern-length caps become the primary mitigation. Literal mode is unaffected (always safe).
      - ENVIRONMENT RISK (verify before committing to worker): this project builds with `output: 'export'` (static export, no server) and has **no existing Web Worker precedent in the codebase**. A worker must be emitted as a static asset via `new Worker(new URL('./replace.worker.ts', import.meta.url))`; Next 15 supports this but it is **unverified in this repo**. RECOMMENDED: run a one-off worker spike against `pnpm build` + `serve out` first. If it works → ship the worker (hard guarantee). If problematic → ship the best-effort deadline+caps fallback as MVP and defer the worker to Phase 2. Either path is buildable; only the ReDoS-guarantee strength differs. (Since literal is the DEFAULT and safe, the guard only matters when a user opts a rule into regex.)
    </redos_guard>
    <presets note="curated rule-sets + transforms (small static data, not a markdown pipeline)">PRESETS live in a typed constant module (`lib/find-replace/presets.ts`): kind 'ruleset' (a list of literal/regex rules to populate) or kind 'builtin' (a named transform in transforms.ts). Localized display strings via i18n; rule data is code.</presets>
    <validation>zod v3.x (repo has zod) for the localStorage store schema (rules, saved sets, recents) and rule/flags validation (flags subset of imsuy, no dup).</validation>
    <localStorage>jurepi-find-replace key, zod-validated schema, auto-prune invalid on load, fail gracefully if unavailable (in-memory session fallback).</localStorage>
    <clipboard>navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail (secondary feature).</clipboard>
    <highlight>Result highlight spans built from match indices into React text nodes — NEVER dangerouslySetInnerHTML.</highlight>
    <animation>Native CSS transitions only (row add/remove, highlight fade, cheatsheet expand). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; reused for store/rule schema validation.</zod>
    <no_external_regex_lib>NO third-party regex/replace engine. Native `RegExp` + `String.replace` only.</no_external_regex_lib>
    <reorder note="rule reordering">Prefer up/down buttons + keyboard (zero-dependency, a11y-friendly). Drag-and-drop optional; if added, use native HTML5 DnD (no library) or defer to Phase 2.</reorder>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/find-replace/                          # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                              # zod: RuleSchema (find/replace/isRegex/caseSensitive/wholeWord/firstOnly/enabled/flags), StoreSchema + STORE_VERSION
│   ├── escape.ts                              # escapeRegExp(literal), escapeReplacement(literal) — so literal mode never interprets $ or metachars
│   ├── rule.ts                                # applyRule(text, rule, {deadlineMs}): { text, count, spans } — literal (escaped) or regex (guarded); case/whole-word/first-only
│   ├── apply.ts                               # applyRules(text, rules, {deadlineMs}): sequential fold → { output, perRuleCounts, spans } (highlight positions on output)
│   ├── compile.ts                             # compile(pattern, flags): Result<RegExp, InvalidPatternError> (never throws) — regex-mode only
│   ├── presets.ts                             # PRESETS: typed array. kind:'ruleset' (rules[]) or kind:'builtin' (transform id). js-string / blank-line / collapse-spaces / smart-quotes / fullwidth / …
│   ├── transforms.ts                          # Named pure built-in transforms: toJsString/fromJsString/normalizeQuotes/fullwidthToHalfwidth — for presets a rule list can't express
│   ├── cheatsheet.ts                          # CHEATSHEET: typed groups (anchors/quantifiers/classes/groups/lookaround) — token + descriptionKey (docs only, regex mode)
│   └── recents.ts                             # Immutable ops: saved rule-sets + recent texts; pushRecent(max), saveSet/removeSet, pruneInvalid, serialize/deserialize
├── components/tools/find-replace/
│   ├── FindReplace.tsx                         # Orchestrator (Client Component) — text/rules state + useFindReplace() owner; owns keyboard/worker lifecycle
│   ├── useFindReplace.ts                       # Hook: localStorage sets/recents + derived apply pipeline (debounced, guarded); worker lifecycle
│   ├── SourceTextInput.tsx                     # Large source textarea (paste target)
│   ├── RuleList.tsx                            # Ordered list of rules; add/reorder; roving focus
│   ├── RuleRow.tsx                             # One rule: find, replace, toggles (정규식/대소문자/전체단어/첫번째만), enable, dup, delete, count badge, per-rule error
│   ├── ResultOutput.tsx                        # Highlighted result (spans from indices) + total count + copy + download
│   ├── PresetLibrary.tsx                       # Curated rule-sets + transforms (incl. "여러 줄 → JS 문자열")
│   ├── SavedRuleSets.tsx                       # localStorage saved rule lists (apply/delete)
│   ├── RegexCheatsheet.tsx                     # Collapsible syntax reference (native <details>) — shown when a rule uses regex
│   ├── FindReplaceError.tsx                    # Friendly invalid-regex / timeout surface (per rule + global)
│   ├── FindReplaceIntro.tsx                    # H1 + lead (SEO; gate-free SSR)
│   ├── FindReplaceHowTo.tsx                    # "여러 단어 한 번에 바꾸기" / "찾아 바꾸기 vs 정규식" / "적용 순서" (SEO long-form, gate-free SSR)
│   └── FindReplaceFaq.tsx                      # Q&A + FAQPage JSON-LD (visible faq.items, Faq single owner)
├── workers/replace.worker.ts                  # (if worker approach) time-boxed regex apply; posts result/timeout
└── i18n/messages/{ko,en}.json                 # tools.find-replace.* UI chrome (top-level title/description, rule labels, option labels+descriptions, preset names, errors, cheatsheet, how-to, FAQ)
</file_structure>

<core_data_entities>
  <rule note="one find → replace rule (React state + localStorage)">
    - id: string (stable, for React keys + reorder)
    - find: string — literal text (default) or regex source (when isRegex)
    - replace: string — literal replacement (default) or template with $1/$<name> (when isRegex)
    - isRegex: boolean (default false) — opt into regex mode
    - caseSensitive: boolean (default false)
    - wholeWord: boolean (default false) — literal mode: wrap with word boundaries; regex mode: user controls in pattern (option hidden/ignored)
    - firstOnly: boolean (default false) — replace first occurrence only (else replace all)
    - flags?: string — regex-mode only, subset of "imsuy" (g is implicit via firstOnly)
    - enabled: boolean (default true)
    INVARIANT: empty `find` → rule is a no-op (skipped, not an error). isRegex + invalid pattern → per-rule error, skipped, others continue. flags ⊆ {i,m,s,u,y} no dup.
  </rule>
  <apply_result note="derived, not persisted">
    - output: string — text after all enabled rules applied in order
    - perRuleCounts: Array<{ id: string; count: number; error?: string }> — replacements per rule (or a localized error)
    - spans: Array<{ index: number; length: number }> — highlight ranges on the OUTPUT (last-applied positions)
    - totalCount: number
    - timedOut?: boolean — a regex rule hit the guard deadline
  </apply_result>
  <preset note="curated rule-set or transform (code data)">
    - id: string (stable) — e.g. "to-js-string", "strip-blank-lines", "collapse-spaces", "smart-quotes", "fullwidth-to-halfwidth", "strip-line-numbers"
    - labelKey: string — i18n key for name/description
    - kind: "ruleset" | "builtin"
    - ruleset presets: rules: Rule[] — populate the rule list (visible, editable)
    - builtin presets: transform: TransformId — a named pure function in transforms.ts (multi-step, e.g., to-js-string)
    - sampleKey?: string — i18n key for a demonstrating sample text
    INVARIANT (tested): every ruleset preset applies without error and produces the documented change on its sample; every builtin transform round-trips where a paired inverse exists (toJsString ∘ fromJsString == identity for representable input).
  </preset>
  <find_replace_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - savedSets: Array<{ name: string; rules: Rule[] }> — named rule lists
    - recents: string[] — recent source texts (truncated), most-recent-first, RECENTS_MAX = 10, de-duplicated
    - meta: { createdAt: number }
    localStorage key: `jurepi-find-replace`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Invalid entries pruned on load.
  </find_replace_store>
  <constants>
    - RECENTS_MAX = 10; SAVED_SETS_MAX = 50; APPLY_DEBOUNCE = 150ms; DEADLINE_MS = 500 (ReDoS guard, regex mode); MAX_TEXT_LENGTH = 200_000 (chars, safety cap); RULES_MAX = 100; FLAG_SET = "imsuy".
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/find-replace" page="FindReplace (SPA, single page)" />
  </public_routes>
  <note>Single interactive utility — NO spoke routes (no entity collection to index). locale ∈ {ko, en}. Platform generateStaticParams iterates the registry to SSG the route for both locales. Consistent with character-counter / url-encoder (single-page utilities).</note>
</route_definitions>

<component_hierarchy>
  <find_replace>                   <!-- "use client"; owns text + rules + useFindReplace() state, keyboard + worker lifecycle -->
    <find_replace_intro />         <!-- H1 + lead (SEO; gate-free SSR) -->
    <find_replace_workspace>
      <source_text_input />        <!-- paste target -->
      <rule_list>                  <!-- ordered rules -->
        <rule_row />               <!-- × N: find, replace, toggles, count badge, per-rule error, reorder, delete -->
        <add_rule_button />
      </rule_list>
      <result_output />            <!-- highlighted result + total count + copy + download -->
      <aside>
        <preset_library />         <!-- curated rule-sets + transforms (to-js-string, etc.) -->
        <saved_rule_sets />        <!-- localStorage saved lists -->
        <regex_cheatsheet />       <!-- collapsible; shown when a rule uses regex -->
      </aside>
    </find_replace_workspace>
    <find_replace_how_to />        <!-- SEO long-form (gate-free SSR) -->
    <find_replace_faq />           <!-- FAQPage JSON-LD (single owner) -->
    <structured_data />            <!-- SoftwareApplication (tool meta), gate-free -->
  </find_replace>
  <note>Single SPA — all interaction is local state (edit text, add/reorder rules, toggle options, apply preset, copy). Regex-mode rules run guarded (worker/deadline); literal rules are synchronous and safe. SEO sections (Intro/HowTo/Faq/StructuredData) render OUTSIDE any `mounted` gate so prerendered HTML carries them for crawlers/AI.</note>
</component_hierarchy>

<pages_and_interfaces>
  <find_replace_intro>
    - Eyebrow: "텍스트 도구" / "TEXT TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "문장 바꾸기" / "Text Replacer" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences: "글에서 여러 단어를 한 번에 찾아 바꿔 보세요. 규칙을 여러 개 넣을 수 있고, 필요하면 정규식도 켤 수 있어요." / English equivalent. Clarify it is find-and-replace, not AI rewriting.
  </find_replace_intro>

  <source_text_input>
    - Large multi-line textarea (monospace optional), placeholder "바꿀 텍스트를 붙여넣으세요…" / "Paste the text to transform…".
    - Char count caption. Grows/scrolls; never overflows page at 320px.
    - aria-label; associated <label>.
  </source_text_input>

  <rule_row>
    - A row with: **find** input (placeholder "찾을 내용"), an arrow "→", **replace** input (placeholder "바꿀 내용"), and a compact toggle cluster: **Aa**(대소문자 구분), **|W|**(전체 단어만), **.\***(정규식), plus overflow menu for **첫 번째만** and per-rule **flags** (regex mode only).
    - Trailing: replacement count badge ("N곳" / "N"), enable checkbox, duplicate, delete, reorder handle (↑/↓ buttons min).
    - When 정규식 ON: find field switches to monospace, validity ring; invalid → FindReplaceError inline under the row (localized + engine message), rule skipped.
    - When 정규식 OFF: 전체 단어만/대소문자 are literal options; replace is inserted verbatim ($ not special).
    - States: hover surface-muted; focus 2px var(--focus-ring); disabled rule dimmed. ≥44px targets. Real tokens only.
    - Toggle affordances use aria-pressed + descriptive aria-label.
  </rule_row>

  <rule_list>
    - Ordered; explicit note "규칙은 위에서 아래 순서로 적용됩니다 (아래 규칙은 위 규칙의 결과에 적용)".
    - Add-rule button (+ 규칙 추가). Reorder via ↑/↓ (and optional drag). Roving focus; keyboard reorder.
    - Empty state: one blank rule row shown by default.
  </rule_list>

  <result_output>
    - Read-only rendered output with each replaced span highlighted (var(--accent-grape-soft); adjacent alternating tint). Built from spans indices, NOT innerHTML.
    - Total summary: "총 N곳 변경 · 규칙 M개 적용" / "N replacements across M rules". Per-rule counts shown on each row.
    - Copy button (result) + Download .txt. Timeout → warning banner (regex rule too slow), literal results still shown.
    - Scrolls within its own overflow container; no page horizontal overflow at 320px.
  </result_output>

  <preset_library>
    - Grid/list of preset chips grouped by intent ("JS 변환", "공백·줄 정리", "따옴표·기호"). Examples: **여러 줄 → JS 문자열**, **JS 문자열 → 원문**, **빈 줄 제거**, **앞뒤 공백 제거**, **연속 공백 1칸**, **따옴표 정리(스마트→일반)**, **전각 → 반각**, **줄 앞 번호 제거**, **각 줄을 배열 항목으로**.
    - Click a **ruleset** preset → populate the rule list (visible/editable; prior rules pushed aside/confirmed). Click a **builtin** preset → run the named transform on the source text and show the result (+ copy). Localized names + short descriptions; ≥44px targets.
  </preset_library>

  <saved_rule_sets>
    - Save current rules under a name; list saved sets (apply / rename / delete). localStorage; pruned invalid on load.
  </saved_rule_sets>

  <regex_cheatsheet>
    - Native collapsible `<details>` (default collapsed; auto-hinted when a rule turns on regex). Sections: anchors, quantifiers (greedy/lazy), character classes, groups (capturing/non-capturing/named), lookaround, flags. Token (monospace) + localized description. Documentation only; NOT executed.
  </regex_cheatsheet>

  <keyboard_shortcuts_reference>
    - Add-rule shortcut (e.g., Cmd/Ctrl+Enter in a rule field) → new rule row.
    - Esc → blur / clear focused field.
    - Copy shortcut → copy result.
    - Tab order: source text → rule rows (find → replace → toggles) → presets → saved sets.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <literal_replace>applyRule literal path: build `new RegExp(escapeRegExp(find), flags)` where flags = "g" (or "" if firstOnly) + (caseSensitive ? "" : "i"); if wholeWord, wrap source as `(?<!\w)escaped(?!\w)` (Unicode-aware boundary, since `\b` is ASCII-only). Replace with escapeReplacement(replace) so `$` is literal. Count via match count. Pure, synchronous, ReDoS-safe.</literal_replace>
  <regex_replace note="opt-in, guarded">compile(find, flags(+g unless firstOnly)) → Result; on ok, native `String.replace` with the user's replacement template ($1/$<name>/$&/$$). On SyntaxError → per-rule InvalidPatternError (skip rule, others continue). Guarded (worker/deadline). Zero-length global match advances lastIndex.</regex_replace>
  <apply_pipeline>applyRules(text, rules, {deadlineMs}): fold enabled, non-empty-find rules left→right. Each: applyRule(prev, rule) → {text, count, spans?}. Accumulate perRuleCounts (+ error), carry text forward; final output + spans on output. Deterministic. A regex rule timeout → mark timedOut, keep prior rules' output, surface warning.</apply_pipeline>
  <presets>PRESETS constant (code) + i18n label/sample keys. ruleset → set rules; builtin → run transform. Built-in transforms (pure, unit-tested): toJsString(text) [escape `\`→`\\`, `"`→`\"`, newline→`\n`, tab→`\t`, wrap in quotes], fromJsString(text) [inverse], normalizeQuotes(text) [smart → straight], fullwidthToHalfwidth(text). Tested: ruleset presets' sample yields documented output; builtins round-trip where inverse exists; toJsString handles empty/CJK/quotes/newlines.</presets>
  <cheatsheet>CHEATSHEET constant (code) + i18n description keys. Documentation only.</cheatsheet>
  <recents_and_sets note="immutable">pushRecent(list, text, max=10): front, de-dupe, truncate. saveSet(sets, {name, rules}) / removeSet. pruneInvalid: drop entries failing schema. Pushed when applied / preset used.</recents_and_sets>
  <persistence_adapter useFindReplace>
    - Mount: read `jurepi-find-replace` → zod → pruneInvalid → state; fail → fresh (no throw). Absent localStorage → in-memory session (fully usable).
    - Change: debounced JSON.stringify → setItem; catch quota/security → in-memory. Persist timer SEPARATE from apply-debounce timer.
    - Derived: latest text+rules passed via arguments (no stale closures); worker lifecycle owned here (spawn once, terminate on unmount/re-run).
    - Expose: applyResult (output/perRuleCounts/spans/totalCount/timedOut), rules + mutators (add/update/remove/reorder/toggle), presets/select, savedSets + save/remove, recents, copy/download.
  </persistence_adapter>
  <i18n>All UI chrome from tools.find-replace.* (ko/en): top-level title/description, rule field labels, option labels+descriptions, preset names+samples, cheatsheet, error/timeout messages, how-to, FAQ. The user's text/rules are NOT i18n (user data). Every human-facing string via t(); no hardcoded Korean/English in components; assert no Korean leakage in EN render.</i18n>
</core_functionality>

<error_handling>
  <invalid_regex>SyntaxError in a regex-mode rule → per-rule FindReplaceError (localized summary + engine message); that rule skipped, others still apply; app never crashes.</invalid_regex>
  <catastrophic_backtracking>Guarded execution (worker terminate / deadline) → timedOut → friendly "이 정규식이 너무 오래 걸립니다 (백트래킹 가능성)" warning; literal results preserved; UI thread never freezes (worker) / best-effort (fallback, per redos_guard).</catastrophic_backtracking>
  <empty>Empty find → rule skipped (no-op). Empty text → no output, neutral. Both valid.</empty>
  <zero_length_match>Regex global replace advances lastIndex on empty match to avoid infinite loop; highlighter marks position with a caret.</zero_length_match>
  <storage>
    <unavailable>Private mode/disabled → saved sets/recents in-memory, no scary error. Tool fully works.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (not precious, no throw).</corrupt_blob>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; no API surface. Text/rules never leave the browser.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Per-tool identity accent is GRAPE (var(--accent-grape) / var(--accent-grape-soft)). Intro icon tile, active toggles share brand honey-gold; replaced-span highlights use grape-soft (+ a second soft tint for adjacent spans).
    - Errors use var(--danger)/var(--danger-ink) (+ `/10` opacity backgrounds) — same ErrorMessage convention as lunar-converter.
    - CTAs (primary buttons, active toggles) stay brand honey-gold var(--brand).
  </accent_usage>
  <surfaces>Workspace panels = var(--surface) + 1px var(--hairline), radius --radius-xxl. Text/find/replace inputs on var(--surface-muted). Rule rows on surface-muted hover.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px). Source text + regex find fields MONOSPACE. Rule labels/descriptions 14px var(--text-secondary). Count badges 12px/600. Section eyebrow 12px/700.</typography>
  <motion>transform/opacity only: rule add/remove 150ms, highlight fade-in 120ms, cheatsheet expand (native details). All gated by prefers-reduced-motion.</motion>
  <accessibility>Inputs labeled (getByLabelText passes); toggles = real buttons aria-pressed + descriptive aria-label; total count aria-live="polite"; per-rule error aria-live + role="alert"; reorder buttons labeled; ≥44px targets; visible focus-visible ring; highlight color-contrast AA; cheatsheet semantic table/list.</accessibility>
  <responsive>
    - ≥1024px: workspace (text + rules + result) left, aside (presets/saved/cheatsheet) right. <1024px: single column, aside stacks below.
    - Rule row collapses gracefully at 320px (find/replace stack, toggles wrap). Result/text scroll within their own overflow container; NO page horizontal overflow at 320px.
  </responsive>
  <atmosphere>Practical "text workbench": paste, stack a few rules, watch replacements highlight live. Calm surfaces, one grape accent for changes, clear danger for a bad regex. Instant, private, no clutter.</atmosphere>
  <icons>lucide-react: Replace or TextCursorInput (registry card icon), Plus (add rule), ArrowRight (find→replace), CaseSensitive (Aa), WholeWord, Regex (.\*), Copy, Check, Download, ChevronDown (cheatsheet), GripVertical/ArrowUp/ArrowDown (reorder), AlertTriangle (error/timeout). Default 20px, stroke 1.75, currentColor. Registry card icon: `Replace` (fallback `TextCursorInput`).</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="user text/rules are untrusted-for-DoS but never HTML-injected">
    - Result highlighting builds React spans from indices — NEVER dangerouslySetInnerHTML. Text/find/replace render as text nodes (React escape).
    - Literal replace escapes both the find (escapeRegExp) and the replacement (escapeReplacement, so `$1` stays literal in literal mode).
    - ReDoS is the real threat and ONLY in regex mode → guarded execution (worker terminate / deadline) + input-length + rules caps. Literal mode is safe.
    - Regex flags validated (subset imsuy). compile in try/catch.
  </input>
  <privacy>Text/rules NEVER sent to network. Saved sets/recents localStorage-only. No analytics event includes text/rule content.</privacy>
  <no_eval>NO `eval`, NO `Function`, NO dynamic code beyond native `RegExp` + `String.replace` (no function replacer from user input).</no_eval>
  <note>No secrets, no network access, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <multi_rule>Stack many find→replace rules and apply them together, in order — swap a whole glossary or clean a log in one pass. The differentiator over a single find/replace box.</multi_rule>
  <literal_first>Plain-text by default — no regex knowledge needed. Case-sensitive + whole-word options cover precision without regex.</literal_first>
  <optional_regex>Per-rule regex switch unlocks capture groups + `$1`/`$<name>` for power users; guarded so it never freezes the tab.</optional_regex>
  <presets>Curated rule-sets + transforms (incl. "여러 줄 → JS 문자열", 따옴표 정리, 전각→반각) — instant common jobs.</presets>
  <order_transparency>Sequential rule application is explicit — chain transforms predictably.</order_transparency>
  <structured_data>SoftwareApplication + FAQPage JSON-LD (gate-free prerender) — search + AI citation for "여러 단어 한 번에 바꾸기" / "찾아 바꾸기" / "find and replace online" (discoverability = DESIGN principle ③).</structured_data>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Multiple literal rules applied at once</description>
    <steps>
      1. Text "고양이가 강아지를 보았다. 고양이는 컸다."; rule1 find "고양이"→replace "호랑이"; rule2 find "강아지"→replace "여우".
      2. Result: "호랑이가 여우를 보았다. 호랑이는 컸다."; rule1 badge "2곳", rule2 "1곳"; total "3곳 변경 · 규칙 2개".
      3. Replaced spans highlighted; aria-live announces total.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Options: case-sensitive, whole-word, first-only</description>
    <steps>
      1. Text "Cat cat CAT catalog"; rule find "cat"→"dog". Default (case-insensitive) → "dog dog dog dogalog" (4).
      2. Turn ON 대소문자 구분 → only "cat" matches → "Cat dog CAT catalog"? (matches the lowercase 'cat' occurrences, count 2 incl. 'catalog' prefix) — then turn ON 전체 단어만 → "catalog" excluded → count 1.
      3. Turn ON 첫 번째만 → only first occurrence replaced.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Regex mode (optional) + capture groups</description>
    <steps>
      1. Rule: turn ON 정규식; find `(\d{4})-(\d{2})-(\d{2})`; replace `$3/$2/$1`; text "2026-07-05".
      2. Result "05/07/2026"; count 1. Invalid pattern `(` → per-rule error, rule skipped, other rules still apply.
      3. Named group `(?<y>\d{4})` + replace `$<y>` works.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Presets — to-JS-string + ReDoS guard</description>
    <steps>
      1. Paste 3-line log; click "여러 줄 → JS 문자열" preset → result is a single quoted literal with `\n`, escaped quotes; copy works; "JS 문자열 → 원문" round-trips.
      2. Add a regex rule `(a+)+$` against a long "aaaa…!" → guarded → friendly timeout warning, tab stays responsive; literal rules' results preserved.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Saved sets, recents, persistence, i18n, a11y</description>
    <steps>
      1. Build 3 rules → save as "이름 치환"; reload → saved set persists, apply repopulates rules; invalid pruned.
      2. Switch /en → all chrome (option labels, preset names, cheatsheet, errors, how-to, FAQ) English; NO Korean leakage; prerendered HTML has SoftwareApplication + exactly one FAQPage.
      3. Add-rule shortcut works; Tab order correct; reorder via ↑/↓ keyboard; axe pass → no violations; 320px no horizontal overflow.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Multi-rule find→replace applied together in order; literal default + per-rule 대소문자/전체단어/첫번째만; optional per-rule regex with $1/$<name>; live highlighted result + per-rule counts; preset rule-sets + transforms (incl. "여러 줄 → JS 문자열", round-trip tested); regex cheatsheet; localStorage saved sets + recents (invalid pruned); copy + download.</functionality>
  <safety>CRITICAL: literal mode always safe; regex-mode catastrophic-backtracking NEVER hard-freezes the tab (guarded worker → guarantee; fallback → best-effort + caps, honestly documented); zero-length global matches never infinite-loop; invalid regex never crashes (per-rule error, others continue).</safety>
  <user_experience>Instant feedback on every edit (debounced); rule order explicit; results readable at 320px (scroll within container); SPA — no route reload; paste → stack rules → copy in seconds; clearly a find-and-replace tool (not AI rewrite).</user_experience>
  <technical_quality>lib/find-replace/* pure ≥90% coverage (escape/rule/apply/compile/presets/transforms/recents, edge fixtures: CJK, whole-word Unicode boundary, first-only, zero-length, regex timeout, invalid regex, multi-rule ordering); TS 0 errors; <800 lines per file; no eval/Function/innerHTML.</technical_quality>
  <visual_design>DESIGN.md compliant; grape identity + brand honey-gold CTA/active toggles; danger for invalid regex; replaced highlights legible (AA contrast); real tokens only (no phantom tokens).</visual_design>
  <accessibility>Full keyboard (add-rule, Tab order, reorder ↑/↓, Esc); labeled inputs (getByLabelText); aria-pressed toggles; aria-live total count + role="alert" errors; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Within text-tool JS budget; worker (if used) lazy; CLS unaffected; LCP < 2.5s; guarded matcher keeps INP < 200ms even on hostile regex; literal apply is O(n) fast.</performance>
  <seo_geo>Unique canonical/hreflang; JSON-LD (SoftwareApplication + FAQPage, single Faq owner) in gate-free prerendered HTML; SSR long-form (bulk replace explainer, options, regex-vs-literal, apply order) for AI citation; llms.txt registered; sitemap auto-includes hub (registry-derived, single page — no spokes).</seo_geo>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/find-replace pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" initially, "live" on launch). Single-page interactive utility — no generated content pipeline, no spoke routes. Worker (if used) bundled as a separate chunk, lazy-loaded.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'text' category already active; 'grape' per-tool accent.
    {
      id: 'find-replace',
      slug: 'find-replace',
      category: 'text',
      icon: 'Replace',
      accent: 'grape',
      status: 'coming_soon',    // 'live' when complete
      isNew: true,
      order: 31,
      keywords: ['찾아바꾸기','문장바꾸기','단어바꾸기','일괄치환','치환','바꾸기','정규식','대소문자','전체단어','find and replace','replace all','bulk replace','text replace','regex','substitute'],
    },
    ```
    Also add slug→component branch (<FindReplace/>) and generateMetadata branch in tool route. NO spoke route.
  </platform_registry_change>
  <sitemap_integration note="automatic (registry-derived, single page)">
    Single-page tool — hub URL is added automatically from the registry (getLiveTools) with ko/en hreflang alternates. NO explicit collection block, NO spoke loop (unlike dev-books/dev-tools/rankings). Confirm sitemap.test.ts hub count includes it once live.
  </sitemap_integration>
  <critical_paths>
    1. Literal replace correctness: escapeRegExp(find) + option flags (global/case/whole-word Unicode boundary) + escapeReplacement(replace) so `$` stays literal. This is the DEFAULT path most users hit — must be exact.
    2. Multi-rule sequential apply (fold, per-rule counts, output spans) + order transparency. The core differentiator.
    3. Optional regex mode: compile Result + guarded replace + $1/$<name> + ReDoS guard (worker/deadline) + zero-length advance. Prove with `(a+)+$` and `a*` fixtures.
    4. i18n completeness (option/preset/cheatsheet/error) both locales, no Korean leakage in EN; top-level title/description present.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/find-replace/{schema,escape,rule,apply,compile,presets,transforms,recents}.ts Vitest (RED→GREEN): escapeRegExp/escapeReplacement, literal applyRule (case/whole-word/first-only, count), regex applyRule (guarded, $n/$<name>, zero-length), applyRules fold + per-rule counts + ordering, presets apply + transforms round-trip, recents/saved-sets immutable ops, edge fixtures (CJK, Unicode word boundary, invalid regex, timeout).
    2. (If worker) workers/replace.worker.ts + terminate-on-timeout; else deadline-checked loop. Prove no-freeze; literal path bypasses guard.
    3. tools.find-replace.* messages (ko/en): top-level title/description, rule labels, option labels+descriptions, preset names+samples, cheatsheet, errors/timeout, how-to, FAQ.
    4. useFindReplace hook (debounced apply, worker lifecycle, localStorage saved-sets/recents, in-memory fallback; state via args no stale closures).
    5. SourceTextInput + RuleList/RuleRow (find/replace/toggles, add/reorder/delete, per-rule error, "/" not needed; add-rule shortcut).
    6. ResultOutput (spans → highlight, counts, copy, download) + order-note.
    7. PresetLibrary + SavedRuleSets + RegexCheatsheet (native details, shown when regex used).
    8. Keyboard (add-rule, reorder ↑/↓, Esc), motion-reduce, a11y (axe, aria-live count, role=alert error, labeled inputs).
    9. FindReplaceIntro/HowTo/Faq + SoftwareApplication + FAQPage(Faq owner) JSON-LD (gate-free SSR) via platform lib/seo.ts.
    10. Registry status→coming_soon (→live on launch); route + generateMetadata branch; E2E 1–5; visual regression 320/768/1024 both themes + both locales.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥90% (escape/rule/apply/compile/presets/transforms/recents); literal-mode fixtures (case/whole-word Unicode boundary/first-only/count) + multi-rule ordering (rule2 sees rule1 output) + regex-mode guard fixtures (backtracking timeout resolves fast, zero-length bounded) + invalid-regex skip-and-continue; component tests with real message catalog + getByLabelText (no mocks); E2E scenarios 1–5 including pageerror/ErrorBoundary hard-gate (a bad regex must not escape); localStorage jsdom-isolated; both locales ko/en (assert `/[가-힣]/` absent in EN chrome).</testing_strategy>
</key_implementation_notes>

</project_specification>
```
