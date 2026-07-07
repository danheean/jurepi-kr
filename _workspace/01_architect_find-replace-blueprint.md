# 文句 바꾸기 (find-replace / Text Replacer) — 구현 청사진

**도구명**: 문장 바꾸기 (Text Replacer)  
**Registry ID**: `find-replace`  
**Category**: `text` (accent: `grape`)  
**Scope**: 클라이언트 SPA, 100% 순수 도메인 계층 (React/Next.js import 금지)  
**Status**: `coming_soon` (리더 승인 후 live 전환)  
**Date**: 2026-07-07

---

## 1. 계층 분해 (Clean Architecture 4계층)

### 1.1 의존성 방향 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│ 프레임워크 계층 (Framework / Platform)                        │
│ - App Router: [locale]/tools/find-replace/page.tsx          │
│ - Registry entry (ToolMeta)                                  │
│ - generateMetadata / generateStaticParams                    │
│ - i18n messages (ko/en) → tools.find-replace.*              │
│ - SharedShell: Header/Footer/ConsentBanner/AdSlot/          │
│   ErrorBoundary/ShareButtons (platform 제공)                 │
└────────────────────┬──────────────────────────────────────┘
                     │ depends on
┌────────────────────▼──────────────────────────────────────┐
│ 어댑터 계층 (Presenters / UI Components)                    │
│ src/components/tools/find-replace/                         │
│ - FindReplace.tsx (Client Component orchestrator)          │
│ - SourceTextInput.tsx                                      │
│ - RuleList.tsx / RuleRow.tsx                              │
│ - ResultOutput.tsx                                         │
│ - PresetLibrary.tsx / SavedRuleSets.tsx                   │
│ - RegexCheatsheet.tsx                                      │
│ - FindReplaceError.tsx                                     │
│ - FindReplaceIntro.tsx / FindReplaceHowTo.tsx /            │
│   FindReplaceFaq.tsx (SEO sections, gate-free SSR)         │
│ - useFindReplace.ts (Custom hook)                          │
│ - helpers: highlights-from-spans, ui-error-display        │
└────────────────────┬──────────────────────────────────────┘
                     │ depends on
┌────────────────────▼──────────────────────────────────────┐
│ 유스케이스 계층 (Application)                               │
│ - useFindReplace() hook (state + debounced apply)          │
│   • localStorage read/write (saved sets, recents)          │
│   • worker lifecycle management (if used)                  │
│   • 상태 도출: applyRules() 호출, 결과 계산               │
│   • in-memory fallback (localStorage 미사용)               │
└────────────────────┬──────────────────────────────────────┘
                     │ depends on
┌────────────────────▼──────────────────────────────────────┐
│ 도메인 계층 (Domain / Business Rules) ★ PURE                 │
│ src/lib/find-replace/                                      │
│ - schema.ts (zod: Rule, Store)                            │
│ - escape.ts (escapeRegExp, escapeReplacement)             │
│ - rule.ts (applyRule: 단일 규칙 적용)                     │
│ - apply.ts (applyRules: 순차 fold)                        │
│ - compile.ts (compile: regex → Result<RegExp, Error>)    │
│ - presets.ts (PRESETS: 큐레이션된 규칙 세트)             │
│ - transforms.ts (toJsString, fromJsString, etc.)          │
│ - cheatsheet.ts (CHEATSHEET: regex 문법 참조)             │
│ - recents.ts (불변 ops: saved sets, recent texts)        │
│                                                             │
│ ★ NO React, NO Next.js, NO DOM APIs                       │
│ ★ Pure functions, immutable data, zod validation          │
│ ★ ≥90% branch coverage, TDD (Vitest)                      │
└──────────────────────────────────────────────────────────┘
```

### 1.2 계층별 책임 + 허용 import

| 계층 | 책임 | 허용 import | 금지 import |
|------|------|-----------|-----------|
| **도메인** | 규칙 컴파일/적용, 이스케이프, 프리셋 로직 | `zod`, `node:*` | `react`, `next`, `@lucide-react`, DOM |
| **유스케이스** | 상태 관리, localStorage 적응, worker 생애주기, 훅 | `react`, `find-replace` lib | `next/router` 등 라우팅 |
| **어댑터** | 컴포넌트 렌더링, UI 이벤트, i18n 소비, 단위 테스트 | `react`, `next-intl`, `find-replace` lib+hook | 프레임워크 세부사항 |
| **프레임워크** | 라우트 정의, registry, metadata, SSR | `next`, `react`, `next-intl`, `lib/seo` | 도구 특화 로직 |

---

## 2. 도메인 공개 API 계약 (정확한 타입/시그니처)

### 2.1 Core Types

```typescript
// === src/lib/find-replace/types.ts ===

/**
 * 단일 규칙 (React state + localStorage persisted)
 * 불변: find 빈 문자열은 skip, isRegex 시 pattern compile 필수
 */
export interface Rule {
  id: string; // stable UUID or sequential ID (for React keys)
  find: string;
  replace: string;
  isRegex: boolean; // 기본 false (literal mode)
  caseSensitive: boolean; // 기본 false
  wholeWord: boolean; // 기본 false (literal/regex 양쪽; regex는 사용자가 패턴에 명시)
  firstOnly: boolean; // 기본 false (replace all)
  flags?: string; // regex-mode only; 부분집합 "imsuy" (g는 암묵적)
  enabled: boolean; // 기본 true
}

/**
 * 규칙 컴파일 결과 (regex-mode only)
 * 불변: 컴파일 성공 또는 명시 에러
 */
export type CompileResult = 
  | { ok: true; regex: RegExp }
  | { ok: false; error: InvalidPatternError };

export interface InvalidPatternError {
  code: 'invalid_pattern';
  message: string; // 사용자-대면, engine 메시지 포함 (V8/JSC fallback)
  pattern: string;
  flags: string;
}

/**
 * 단일 규칙 적용 결과
 */
export interface RuleApplyResult {
  text: string; // 규칙 적용 후 텍스트
  count: number; // 치환 개수
  spans?: Array<{ index: number; length: number }>; // 이 규칙이 만든 범위 (마지막 출력용 위치)
  error?: InvalidPatternError; // null이면 성공
}

/**
 * 다중 규칙 순차 적용 결과
 */
export interface ApplyRulesResult {
  output: string; // 최종 텍스트 (모든 규칙 적용 후)
  perRuleCounts: Array<{ ruleId: string; count: number; error?: InvalidPatternError }>;
  spans: Array<{ index: number; length: number }>; // 최종 출력 위에서의 범위 (highlight 용)
  totalCount: number;
  timedOut?: boolean; // 정규식 규칙이 deadline 초과
}

/**
 * 프리셋 (curated rule-set 또는 built-in transform)
 */
export type PresetKind = 'ruleset' | 'builtin';

export interface Preset {
  id: string; // e.g., "to-js-string", "strip-blank-lines"
  labelKey: string; // i18n key: "presets.toJsString.label"
  kind: PresetKind;
  rules?: Rule[]; // kind='ruleset'일 때만
  transform?: TransformId; // kind='builtin'일 때만
  sampleKey?: string; // i18n key: "presets.toJsString.sample"
}

export type TransformId = 
  | 'to-js-string'
  | 'from-js-string'
  | 'normalize-quotes'
  | 'fullwidth-to-halfwidth'
  | 'strip-blank-lines'
  | 'collapse-spaces'
  | 'strip-line-numbers'
  | 'lines-to-array-items';

/**
 * 저장된 규칙 세트
 */
export interface SavedRuleSet {
  name: string;
  rules: Rule[];
}

/**
 * localStorage 저장 스키마
 */
export interface FindReplaceStore {
  version: number; // STORE_VERSION = 1
  savedSets: SavedRuleSet[];
  recents: string[]; // 최근 입력 텍스트 (truncated)
  meta: { createdAt: number };
}

// 상수
export const STORE_VERSION = 1;
export const STORAGE_KEY = 'jurepi-find-replace';
export const RECENTS_MAX = 10;
export const SAVED_SETS_MAX = 50;
export const APPLY_DEBOUNCE = 150; // ms
export const DEADLINE_MS = 500; // ReDoS 가드 deadline
export const MAX_TEXT_LENGTH = 200_000; // 보안 cap
export const RULES_MAX = 100;
export const FLAG_SET = 'imsuy';
```

### 2.2 핵심 도메인 함수

```typescript
// === src/lib/find-replace/escape.ts ===

/**
 * 리터럴 문자열을 RegExp 생성자에 안전하게 전달하도록 이스케이프
 * 예: "." → "\\.", "$1" → "\\$1"
 * 순수, 동기, 항상 성공
 */
export function escapeRegExp(literal: string): string;

/**
 * 리터럴 치환 문자열을 String.replace에 안전하게 전달하도록 이스케이프
 * 리터럴 모드에서 "$1"이 특수문자가 아니라 그 문자 그대로 유지되도록
 * 예: "$1" → "$$1"
 * 순수, 동기, 항상 성공
 */
export function escapeReplacement(literal: string): string;

// --- src/lib/find-replace/compile.ts ---

/**
 * 정규식 패턴과 플래그로부터 RegExp 객체 생성
 * 유효하지 않은 패턴은 에러 반환 (never throws)
 * 플래그: "imsuy" 부분집합 + 암묵적 "g" (firstOnly가 아닐 때)
 * 
 * @param pattern 사용자 정규식 패턴 (예: "(\\d{4})-(\\d{2})-(\\d{2})")
 * @param flags 플래그 문자열 (예: "i" 또는 "im")
 * @return CompileResult
 */
export function compile(pattern: string, flags: string): CompileResult;

// --- src/lib/find-replace/rule.ts ---

/**
 * 단일 규칙을 텍스트에 적용
 * 리터럴 또는 정규식 모드, 옵션(대소문자/전체단어/첫번째만) 존중
 * 리터럴 모드: O(n), 항상 안전
 * 정규식 모드: guarded (deadline 체크 또는 zero-length 전진)
 * 
 * @param text 원본 텍스트
 * @param rule 적용할 규칙
 * @param opts { deadlineMs?: number } ReDoS 가드 deadline (선택)
 * @return RuleApplyResult
 * 
 * INVARIANT:
 * - find 빈 문자열 → count=0, text 변경 없음, error 없음 (no-op)
 * - isRegex이고 invalid pattern → error 설정, text 변경 없음, count=0
 * - enabled=false → text 변경 없음, count=0
 * - wholeWord: 유니코드 경계 (\\b는 ASCII만) → (?<!\\w)…(?!\\w) 또는 비슷 로직
 * - 정규식 global replace에서 zero-length match → lastIndex++로 무한루프 방지
 */
export function applyRule(
  text: string,
  rule: Rule,
  opts?: { deadlineMs?: number }
): RuleApplyResult;

// --- src/lib/find-replace/apply.ts ---

/**
 * 다중 규칙을 순차 적용 (fold)
 * rule[0]을 text에 적용 → rule[1]을 그 결과에 적용 → ...
 * 순차성 명시: rule[i]는 rule[0..i-1]의 출력을 본다
 * 
 * @param text 원본 텍스트
 * @param rules 적용할 규칙 배열 (순서 중요)
 * @param opts { deadlineMs?: number }
 * @return ApplyRulesResult
 * 
 * INVARIANT:
 * - 규칙이 비활성화 또는 find 빈 문자열 → 스킵 (perRuleCounts에 count=0)
 * - 규칙이 에러 → 그 규칙 스킵, 다음 규칙은 이전 유효 출력으로 계속
 * - spans는 최종 output 기준 위치 (highlight용)
 * - timedOut: 어느 규칙이 deadline 초과하면 true (이전 규칙 결과는 유지)
 */
export function applyRules(
  text: string,
  rules: Rule[],
  opts?: { deadlineMs?: number }
): ApplyRulesResult;

// --- src/lib/find-replace/presets.ts ---

/**
 * 모든 프리셋 상수 배열
 * 각 프리셋은 kind='ruleset' (규칙 세트)이거나 kind='builtin' (built-in 변환)
 * 
 * INVARIANT (tested):
 * - 각 ruleset 프리셋은 sample text에서 오류 없이 적용되고, 문서화된 변경을 만듦
 * - 각 builtin 변환의 역함수가 있으면 (toJsString ⟷ fromJsString) round-trip 검증
 */
export const PRESETS: Preset[];

// --- src/lib/find-replace/transforms.ts ---

/**
 * toJsString(text: string): string
 * 여러 줄을 JavaScript 문자열 리터럴로 변환
 * - 백슬래시 → \\\\
 * - 큰따옴표 → \\"
 * - 줄바꿈 → \\n
 * - 탭 → \\t
 * - 결과를 큰따옴표로 감싸기
 * 예: 'hello\nworld' → '"hello\\nworld"'
 * 순수, 동기
 */
export function toJsString(text: string): string;

/**
 * fromJsString(text: string): string
 * toJsString의 역변환
 * 순수, 동기, 조건부 안전 (유효한 JS 문자열 리터럴이 입력이라고 가정)
 */
export function fromJsString(text: string): string;

/**
 * normalizeQuotes(text: string): string
 * 스마트 따옴표("", '', —, …)를 직선 따옴표("", ', -, ...)로 정규화
 * 순수, 동기
 */
export function normalizeQuotes(text: string): string;

/**
 * fullwidthToHalfwidth(text: string): string
 * 전각 문자(！？，。)를 반각 문자(!, ?, ,, .)로 변환
 * 순수, 동기
 */
export function fullwidthToHalfwidth(text: string): string;

// --- src/lib/find-replace/cheatsheet.ts ---

/**
 * 정규식 치트시트 데이터 (문서용, 실행되지 않음)
 * 섹션: anchors, quantifiers, character-classes, groups, lookaround, flags
 * 각 항목: {token: "...", descriptionKey: "cheatsheet.anchors.caret"}
 */
export const CHEATSHEET: Array<{ section: string; items: Array<{ token: string; descriptionKey: string }> }>;

// --- src/lib/find-replace/recents.ts ---

/**
 * 불변 연산: saved rule-sets + recent texts
 * 모두 저장/로드 후 zod로 검증, 유효하지 않은 항목 제거
 */

export function pushRecent(list: string[], text: string, max?: number): string[];
export function saveSet(sets: SavedRuleSet[], name: string, rules: Rule[]): SavedRuleSet[];
export function removeSet(sets: SavedRuleSet[], name: string): SavedRuleSet[];
export function pruneInvalid(store: FindReplaceStore): FindReplaceStore;
```

### 2.3 Zod Schema (validation)

```typescript
// === src/lib/find-replace/schema.ts ===

export const ruleSchema = z.object({
  id: z.string().min(1),
  find: z.string(),
  replace: z.string(),
  isRegex: z.boolean().default(false),
  caseSensitive: z.boolean().default(false),
  wholeWord: z.boolean().default(false),
  firstOnly: z.boolean().default(false),
  flags: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type Rule = z.infer<typeof ruleSchema>;

export const storeSchema = z.object({
  version: z.number().default(STORE_VERSION),
  savedSets: z.array(
    z.object({
      name: z.string().min(1).max(100),
      rules: z.array(ruleSchema),
    })
  ).max(SAVED_SETS_MAX),
  recents: z.array(z.string()).max(RECENTS_MAX),
  meta: z.object({ createdAt: z.number() }),
});

export type FindReplaceStore = z.infer<typeof storeSchema>;

export function parseStore(json: string): FindReplaceStore;
export function serializeStore(store: FindReplaceStore): string;
```

---

## 3. 불변식 (테스트로 반드시 검증)

| 불변식 | 테스트 경계 | 근거 |
|-------|-----------|------|
| **빈 find**: `applyRule(text, {find: ""})` → no-op (count=0, text unchanged) | escape.ts / rule.ts | SPEC: "empty find → skipped" |
| **유효하지 않은 정규식**: `applyRule(text, {find: "(", isRegex: true})` → `error.code = 'invalid_pattern'`, 규칙 스킵, 다음 규칙 계속 | rule.ts (try/catch) | ReDoS 안전성: invalid regex never crashes app |
| **플래그 검증**: `flags ⊆ {i,m,s,u,y}`, no duplicate | compile.ts (zod) | SPEC: subset only |
| **리터럴 모드 $ 비특화**: `applyRule(text, {find: "1", replace: "$1", isRegex: false})` → "$1" literal 렌더 (not capture group) | escape.ts + rule.ts | Literal mode never interprets `$` |
| **전체 단어 유니코드**: `applyRule("한글test", {find: "글", wholeWord: true})` → "글" matches (word boundary at CJK-ASCII edge) | rule.ts fixture | `\b` is ASCII-only; need proper boundary |
| **Zero-length match 무한루프 방지**: `applyRule("aaa", {find: "a*", isRegex: true})` → finite loop, lastIndex advances on empty | rule.ts (lastIndex++) | Prevent infinite global replace |
| **다중 규칙 순차성**: `applyRules(text, [rule1, rule2])` → rule2는 rule1의 **출력**을 봄 (input text를 재보지 않음) | apply.ts (fold order) | Core differentiator |
| **프리셋 라운드트립**: `fromJsString(toJsString(text)) === text` (대부분의 text) | transforms.test.ts | Paired inverse transforms |
| **setTimeout 없는 동기**: 모든 도메인 함수는 동기, return value 또는 에러 (Promise 없음) | domain/*.ts 타입 | Synchronous replace-all guarantees |
| **결과 span은 최종 output 기준**: 여러 규칙을 적용한 후의 span 위치는 최종 텍스트 기준 (중간 규칙의 span 아님) | apply.ts | Highlight must align with visible result |

---

## 4. i18n 키 계약 (ko/en)

### 🚨 **중요: `{key, ko, en}` 분리 3컬럼 표** (파이프 `|` 절대 금지!)

| key | ko | en |
|-----|----|----|
| `tools.find-replace.title` | 문장 바꾸기 | Text Replacer |
| `tools.find-replace.description` | 여러 단어를 한 번에 찾아 바꿔 보세요. 규칙을 여러 개 넣을 수 있고, 필요하면 정규식도 켤 수 있어요. | Replace multiple words at once across your text. Stack any number of rules and optionally use regex with capture groups. |
| `find-replace.sourceText.label` | 바꿀 텍스트 | Text to transform |
| `find-replace.sourceText.placeholder` | 바꿀 텍스트를 붙여넣으세요… | Paste the text to transform… |
| `find-replace.sourceText.charCount` | {count}자 | {count} characters |
| `find-replace.ruleList.title` | 규칙 | Rules |
| `find-replace.ruleList.description` | 규칙은 위에서 아래 순서로 적용됩니다 (아래 규칙은 위 규칙의 결과에 적용) | Rules apply top-to-bottom; each rule sees the output of the previous one. |
| `find-replace.ruleList.empty` | 규칙을 추가하면 시작됩니다 | Add a rule to get started |
| `find-replace.rule.find.label` | 찾을 내용 | Find |
| `find-replace.rule.find.placeholder` | 찾을 내용 | Find… |
| `find-replace.rule.replace.label` | 바꿀 내용 | Replace with |
| `find-replace.rule.replace.placeholder` | 바꿀 내용 | Replace with… |
| `find-replace.rule.count` | {count}곳 | {count} replacements |
| `find-replace.option.caseSensitive.label` | 대소문자 구분 | Case-sensitive |
| `find-replace.option.caseSensitive.description` | 대소문자를 구분하여 찾기 | Match uppercase/lowercase exactly |
| `find-replace.option.wholeWord.label` | 전체 단어만 | Whole word |
| `find-replace.option.wholeWord.description` | 단어 경계에서만 일치 | Match only at word boundaries |
| `find-replace.option.regex.label` | 정규식 | Regex |
| `find-replace.option.regex.description` | 정규식 모드 (캡처 그룹, $1/$<name> 지원) | Use JavaScript regular expression with capture groups |
| `find-replace.option.firstOnly.label` | 첫 번째만 | First only |
| `find-replace.option.firstOnly.description` | 첫 번째 일치만 치환 | Replace only the first match |
| `find-replace.result.title` | 결과 | Result |
| `find-replace.result.totalCount` | 총 {count}곳 변경 · 규칙 {ruleCount}개 적용 | {count} replacements across {ruleCount} rules |
| `find-replace.result.copy` | 복사 | Copy |
| `find-replace.result.copied` | 복사됨! | Copied! |
| `find-replace.result.download` | 다운로드 | Download |
| `find-replace.result.empty` | (결과 없음) | (empty result) |
| `find-replace.preset.title` | 프리셋 | Presets |
| `find-replace.preset.toJsString` | 여러 줄 → JavaScript 문자열 | Multi-line → JS String |
| `find-replace.preset.toJsString.sample` | 한\n줄\n둘 | line\none\ntwo |
| `find-replace.preset.fromJsString` | JavaScript 문자열 → 원문 | JS String → Plain text |
| `find-replace.preset.stripBlankLines` | 빈 줄 제거 | Remove blank lines |
| `find-replace.preset.collapseSpaces` | 연속 공백 1칸 | Collapse consecutive spaces |
| `find-replace.preset.normalizeQuotes` | 따옴표 정리 (스마트 → 일반) | Normalize quotes (smart → straight) |
| `find-replace.preset.fullwidthToHalfwidth` | 전각 → 반각 | Fullwidth → Halfwidth |
| `find-replace.preset.stripLineNumbers` | 줄 앞 번호 제거 | Strip line numbers |
| `find-replace.preset.linesToArrayItems` | 각 줄을 배열 항목으로 | Lines → Array items |
| `find-replace.error.invalidRegex` | 유효하지 않은 정규식 | Invalid regex |
| `find-replace.error.invalidRegexDetail` | {detail} | {detail} |
| `find-replace.error.timeout` | 이 정규식이 너무 오래 걸립니다 (백트래킹 가능성) | This regex is too slow (possible catastrophic backtracking) |
| `find-replace.keyboard.addRule` | Ctrl+Enter (또는 Cmd+Enter) | Ctrl+Enter |
| `find-replace.keyboard.copy` | Ctrl+Shift+C | Cmd+Shift+C |
| `find-replace.keyboard.escape` | Esc | Esc |
| `find-replace.cheatsheet.title` | 정규식 치트시트 | Regex Cheatsheet |
| `find-replace.cheatsheet.anchors` | 앵커 | Anchors |
| `find-replace.cheatsheet.caret` | 줄의 시작 (multiline: 각 줄 시작) | Start of line (multiline: each line) |
| `find-replace.cheatsheet.dollar` | 줄의 끝 (multiline: 각 줄 끝) | End of line (multiline: each line) |
| ... (기타 cheatsheet 항목들) | ... | ... |
| `find-replace.intro.lead` | 글의 여러 단어를 한 번에 찾아 바꿔 보세요. 규칙을 여러 개 넣을 수 있고, 필요하면 정규식도 켤 수 있어요. 이것은 문장을 다시 쓰는 AI가 아니라 단어·구절을 치환하는 도구입니다. | Replace multiple words throughout your text at once. Build any number of rules—combine literal text search with optional regex and capture groups. This is a word-substitution tool, not an AI rewriter. |
| `find-replace.howto.title` | 여러 단어를 한 번에 바꾸기 | How to Use Find & Replace |
| `find-replace.howto.pasteText` | 1. 텍스트를 붙여넣으세요 | 1. Paste your text above |
| `find-replace.howto.addRules` | 2. 규칙을 추가하세요 (찾을 내용 → 바꿀 내용) | 2. Add one or more find-replace rules |
| `find-replace.howto.livePreview` | 3. 결과가 실시간으로 표시됩니다 | 3. See the result update live |
| `find-replace.howto.copyDownload` | 4. 복사하거나 .txt로 다운로드하세요 | 4. Copy or download the result |
| `find-replace.howto.multipleRules` | **여러 규칙을 한 번에**: 규칙들은 위에서 아래로 순서대로 적용됩니다. 아래 규칙은 위 규칙의 결과에 적용되므로, 순서를 생각하며 규칙을 쌓으세요. 예: "고양이"→"호랑이", 다음 "호랑이"→"사자"로 쌓으면, 최종 "고양이"는 "사자"가 됩니다. | **Stack multiple rules**: Each rule is applied in order; rule 2 sees rule 1's output. Use this to chain transforms (e.g., normalize quotes, then strip lines). |
| `find-replace.howto.regexVsLiteral` | **정규식 vs 일반 텍스트**: 기본은 일반 텍스트 (정규식 문법 필요 없음). 각 규칙마다 "정규식" 토글로 opt-in. 정규식은 `(2026)-(07)` 같은 그룹과 `$1-$2` 같은 백레퍼런스를 지원합니다. | **Regex is optional**: By default, "find" matches literal text (no regex knowledge needed). Toggle "Regex" per rule to use capture groups `(…)` and `$1`/`$<name>` references. |
| `find-replace.howto.caseWholeWord` | **대소문자·전체단어 옵션**: "대소문자 구분"을 켜면 "Hello"와 "hello"를 다르게 봅니다. "전체 단어만"을 켜면 "test"가 "testing" 안에서는 매칭되지 않습니다. | **Precision options**: Toggle "Case-sensitive" to distinguish Hello/hello. Toggle "Whole word" to skip partial matches (e.g., "test" inside "testing"). |
| `find-replace.faq.q1` | 정규식이 tab을 멎게 하지 않나요? | Does a bad regex freeze my tab? |
| `find-replace.faq.a1` | MVP에서는 best-effort deadline 가드를 사용합니다 (500ms 초과 시 타임아웃 경고). 가장 악의적인 정규식이라도 tab을 영구적으로 얼리지는 않지만, 매우 복잡한 정규식에선 잠깐 느려질 수 있습니다. Phase 2에서는 Web Worker로 hard guarantee를 제공할 예정입니다. | The MVP uses a best-effort deadline guard (500ms timeout). Even a catastrophic-backtracking regex won't freeze your tab permanently, but you may see a brief delay. Phase 2 will upgrade to a Web Worker for a hard guarantee. |
| `find-replace.faq.q2` | 저장된 규칙은 어디에 저장되나요? | Where are my saved rule-sets stored? |
| `find-replace.faq.a2` | 브라우저의 localStorage에 저장됩니다. 사용자 단말에만 저장되며, 서버에 업로드되지 않습니다. 브라우저 캐시를 지우면 저장된 규칙도 삭제됩니다. | Your rule-sets are stored in your browser's localStorage. Nothing is sent to a server. Clearing your browser cache will delete them. |
| `find-replace.faq.q3` | 첫 번째만 옵션으로 한 번에 하나씩 바꿀 수 있나요? | Can I replace one at a time using "First only"? |
| `find-replace.faq.a3` | 네. "첫 번째만" 토글을 켜면 규칙이 한 번에 첫 번째 일치만 바꿉니다. 반복해서 버튼을 누르려면 매번 "바꾸기" 규칙을 실행해야 합니다. 이 도구는 한 번에 모든 일치를 바꾸는 데 최적화되어 있습니다. | Yes, toggle "First only" to replace only the first match. For step-by-step replacement, you'd need to reload and repeat—this tool is optimized for replace-all. |

---

## 5. 작업 분배 + 계약 (팀 병렬 작업)

### 5.1 타임라인 + 의존 순서

```
Phase 1: 도메인 계약 + i18n 키 (architecture 정의)
  └─ Architect 생산: 위 청사진 최종
     - lib/find-replace 모든 public API 시그니처 확정
     - i18n 키 최종 목록 (ko/en 동시 작성)
     - 모든 프리셋/변환 나열 + 샘플 텍스트

Phase 2: 병렬 (선행 없음 — 모두 domain-engineer 주도)
  ├─ domain-engineer: lib/find-replace/* Vitest RED→GREEN (≥90%)
  │  - schema.ts (zod validation)
  │  - escape.ts (escapeRegExp/escapeReplacement)
  │  - rule.ts (applyRule literal + regex paths)
  │  - apply.ts (fold, sequential ordering)
  │  - compile.ts (Result<RegExp, Error>)
  │  - presets.ts + transforms.ts (+ fixtures)
  │  - cheatsheet.ts (data only)
  │  - recents.ts (immutable ops)
  │  Output: ≥90% domain coverage, all edge fixtures
  │
  ├─ platform-engineer: i18n messages (ko/en) 최종화
  │  - 위 계약 키 모두를 ko.json / en.json에 채우기
  │  - tools.find-replace.* 최상위 키 포함(대시보드·푸터·검색)
  │  Output: 완전한 i18n 카탈로그, missing-key 0개
  │
  └─ platform-engineer: registry + route + generateMetadata 배선
     - src/tools/registry.ts: find-replace entry (status: coming_soon, order: 15, accent: grape)
     - src/app/[locale]/tools/[slug]/page.tsx: slug 브랜치
     - generateStaticParams + generateMetadata
     Output: 라우트 구조 준비, slug 진입점 확정

Phase 3: UI 개발 (domain-engineer 완료 후, platform-engineer와 병렬 가능)
  ├─ ui-engineer: useFindReplace hook + helpers
  │  - useFindReplace (상태, debounced apply, localStorage, worker lifecycle)
  │  - 컴포넌트 단위 테스트 (실 i18n 카탈로그, getByLabelText 검증)
  │  - Output: hook 시그니처 안정, 모든 소비 컴포넌트 명시
  │
  ├─ ui-engineer: 컴포넌트 구현
  │  - SourceTextInput, RuleList/RuleRow, ResultOutput
  │  - PresetLibrary, SavedRuleSets, RegexCheatsheet
  │  - FindReplaceError, keyboard handlers
  │  - Output: 모든 컴포넌트 ≥80% branch coverage
  │
  ├─ ui-engineer: SEO 섹션 (gate-free SSR)
  │  - FindReplaceIntro, FindReplaceHowTo, FindReplaceFaq
  │  - JSON-LD: SoftwareApplication (seo.ts) + FAQPage (Faq owner)
  │  - Output: 프리렌더 HTML에 본문 + JSON-LD 포함
  │
  └─ qa-engineer: E2E + a11y
     - Playwright scenarios 1–5 (다중 규칙, 옵션, regex, preset, localStorage)
     - axe a11y (ko/en)
     - visual regression (320/768/1024, light/dark[Phase 2])
     - Output: E2E 5+ scenarios, a11y pass

Phase 4: 통합 + 배포 (리더 final gate)
  └─ 리더: vitest full domain ≥90%, E2E 그린, tsc 0, 프리렌더 HTML 검증
     - 모든 도메인 edge case fixture 재확인
     - i18n 키 ko/en 완성 (한글 누수 0)
     - 라이브 curl gate (canonical/JSON-LD/sitemap/보안헤더)
     - 리더 visual: 320px, ko/en, light/dark 스크린샷
     Output: status 승인 시 coming_soon→live 전환, push→CF 배포
```

### 5.2 계약 체크포인트

| 역할 | 책임 | 산출물 | 검증 | 다음 진행 조건 |
|------|------|--------|------|---------|
| **Architect** | 계층 분해, API 시그니처, i18n 키 | 청사진 (이 문서) | 리더 리뷰 | 모든 함수·타입 가독성·completeness |
| **domain-engineer** | lib/* TDD ≥90%, edge fixtures (CJK, unicode boundary, invalid regex, timeout) | Vitest 그린, 커버리지 리포트 | `pnpm test src/lib/find-replace` | 도메인이 어댑터 진입점 정의 |
| **platform-engineer** | i18n 최상위 키 포함, registry entry, route 배선 | ko.json/en.json 완성, registry.ts 추가, [slug] 브랜치 | tsc 0, grep ko/en consistency | UI가 import 시점에 compile error 0 |
| **ui-engineer** | hook + 컴포넌트 ≥80%, 실 i18n 소비, accessibility | 모든 컴포넌트 테스트 통과, axe pass (ko/en) | `pnpm test src/components/tools/find-replace` + `pnpm axe-scan` | E2E가 interactive scenario를 검증 |
| **qa-engineer** | E2E 5 scenario + visual regression | scenarios 그린, 스크린샷 no regression | `pnpm test:e2e`, 시각 비교 (320/768/1024) | 리더 final gate로 진행 가능 |
| **리더** | vitest full ≥90%, tsc 0, E2E 그린, 프리렌더/canonical, 시각 | 전체 통합 검증 | `pnpm test`, `pnpm tsc`, `pnpm build`, curl | 배포 승인, registry status→live |

---

## 6. 빌드 순서 + 병렬성

```
1. SERIAL: Architect 청사진 ← 리더 리뷰 승인
2. PARALLEL:
   ├─ domain-engineer: lib/* TDD (domain-engineer 1인)
   ├─ platform-engineer: i18n + registry + route (platform-engineer 1인)
   └─ (domain 미완료 시 ui-engineer 대기)
3. PARALLEL (domain 완료 후):
   ├─ ui-engineer: useFindReplace + 모든 컴포넌트 (ui-engineer 2인, 병렬)
   ├─ platform-engineer: SEO 섹션 검토 (또는 ui-engineer 지원)
   └─ qa-engineer: E2E 프레임워크 준비
4. SERIAL: qa-engineer: E2E 5 scenarios (모든 컴포넌트 준비 후)
5. SERIAL: 리더 final integration gate (전체 완료)

병렬성 요점:
- 도메인과 i18n은 독립 (도메인이 i18n을 몰라도 됨, 헬퍼로 진입)
- UI는 도메인 완료 기다림 (import 시점의 compile 필요)
- E2E는 모든 UI 완료 기다림 (interactive scenario)
```

---

## 7. Registry Entry (최종값)

```typescript
// src/tools/registry.ts에 추가:
{
  id: 'find-replace',
  slug: 'find-replace',
  category: 'text',
  icon: 'Replace',  // lucide-react icon
  accent: 'grape',
  status: 'coming_soon',  // 리더 승인 후 'live'로 전환
  addedAt: '2026-07-07',
  order: 15,  // 수요 기반 정렬: character-counter(10) 다음, qr-code(20) 이전
  keywords: [
    '찾아바꾸기', '문장바꾸기', '단어바꾸기', '일괄치환', '치환', '바꾸기',
    '정규식', '대소문자', '전체단어', '규칙', '규칙스택',
    'find and replace', 'replace all', 'bulk replace', 'text replace',
    'regex', 'substitute', 'multi-rule', 'literal', 'capture group'
  ],
}
```

**Order 근거**: 
- CLAUDE.md 이력에서 "수요 기반 큐레이션" 도입 (10단위 간격)
- character-counter (order 10) = 텍스트 도구 중 최고 수요 (글자수 세기)
- find-replace = character-counter 다음 수요 (일반적인 텍스트 도구)
- order 15 = 10과 20 사이 (character-counter와 qr-code 사이)
- 같은 text 카테고리의 new-word (order 140)보다 훨씬 높은 수요

---

## 8. 테스트 전략 (inside-out TDD)

### 8.1 도메인 계층 (Vitest, ≥90% branch)

```typescript
// src/lib/find-replace/*.test.ts

describe('escape.ts', () => {
  describe('escapeRegExp', () => {
    it('escapes regex metacharacters', () => {
      expect(escapeRegExp('.')).toBe('\\.');
      expect(escapeRegExp('(')).toBe('\\(');
      expect(escapeRegExp('$1')).toBe('\\$1');
    });
    it('handles empty string', () => {
      expect(escapeRegExp('')).toBe('');
    });
    it('handles CJK', () => {
      expect(escapeRegExp('한글')).toBe('한글'); // No escape
    });
  });
});

describe('rule.ts', () => {
  describe('applyRule literal mode', () => {
    it('replaces all matches (find="고양이", replace="호랑이")', () => {
      const rule: Rule = { id: '1', find: '고양이', replace: '호랑이', isRegex: false, ... };
      const result = applyRule('고양이가 고양이를', rule);
      expect(result.text).toBe('호랑이가 호랑이를');
      expect(result.count).toBe(2);
    });
    it('respects caseSensitive option', () => {
      const rule = { ..., find: 'Test', caseSensitive: false, ... };
      const result = applyRule('Test test TEST', rule);
      expect(result.count).toBe(3); // All match
    });
    it('respects wholeWord option (unicode boundary)', () => {
      const rule = { ..., find: '글', wholeWord: true, ... };
      const result = applyRule('한글한 글자', rule);
      expect(result.count).toBe(2); // Only standalone '글', not in '한글'
    });
    it('respects firstOnly option', () => {
      const rule = { ..., find: 'a', firstOnly: true, ... };
      const result = applyRule('aaa', rule);
      expect(result.count).toBe(1);
    });
    it('skips empty find (no-op)', () => {
      const rule = { ..., find: '', ... };
      const result = applyRule('text', rule);
      expect(result.text).toBe('text');
      expect(result.count).toBe(0);
    });
  });

  describe('applyRule regex mode', () => {
    it('supports capture groups and $1', () => {
      const rule = { ..., find: '(\\d{4})-(\\d{2})-(\\d{2})', replace: '$3/$2/$1', isRegex: true, ... };
      const result = applyRule('2026-07-07', rule);
      expect(result.text).toBe('07/07/2026');
      expect(result.count).toBe(1);
    });
    it('handles invalid regex pattern', () => {
      const rule = { ..., find: '(', isRegex: true, ... };
      const result = applyRule('text', rule);
      expect(result.error?.code).toBe('invalid_pattern');
      expect(result.text).toBe('text'); // Unchanged
      expect(result.count).toBe(0);
    });
    it('prevents infinite loop on zero-length match', () => {
      const rule = { ..., find: 'a*', isRegex: true, ... };
      const result = applyRule('aaa', rule);
      expect(result.count).toBeGreaterThan(0);
      expect(result.count).toBeLessThan(1000); // Sanity: finite
    });
  });
});

describe('apply.ts', () => {
  it('applies rules sequentially (rule2 sees rule1 output)', () => {
    const rule1: Rule = { ..., id: '1', find: '고양이', replace: '호랑이', ... };
    const rule2: Rule = { ..., id: '2', find: '호랑이', replace: '사자', ... };
    const result = applyRules('고양이', [rule1, rule2]);
    expect(result.output).toBe('사자'); // rule1: 고양이→호랑이, rule2: 호랑이→사자
    expect(result.perRuleCounts[0].count).toBe(1);
    expect(result.perRuleCounts[1].count).toBe(1);
  });
  it('skips disabled rules', () => {
    const rule1 = { ..., id: '1', enabled: false, find: 'a', replace: 'b', ... };
    const rule2 = { ..., id: '2', enabled: true, find: 'b', replace: 'c', ... };
    const result = applyRules('ab', [rule1, rule2]);
    expect(result.output).toBe('ac'); // rule1 skipped
  });
  it('returns spans on final output (for highlight)', () => {
    const rule = { ..., find: 'a', replace: 'bb', ... };
    const result = applyRules('aaa', [rule]);
    expect(result.output).toBe('bbbbbb'); // 'a'→'bb' three times
    expect(result.spans.length).toBeGreaterThan(0); // Highlight ranges
  });
});

describe('transforms.ts', () => {
  describe('toJsString / fromJsString round-trip', () => {
    it('round-trips typical text', () => {
      const original = 'hello\nworld\t"quote"';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });
    it('handles CJK', () => {
      const original = '한글\n줄\n바뀜';
      expect(fromJsString(toJsString(original))).toBe(original);
    });
  });
  describe('normalizeQuotes', () => {
    it('converts smart quotes to straight', () => {
      expect(normalizeQuotes('"hello"')).toBe('"hello"');
      expect(normalizeQuotes(''hello'')).toBe("'hello'");
    });
  });
  describe('fullwidthToHalfwidth', () => {
    it('converts fullwidth punctuation', () => {
      expect(fullwidthToHalfwidth('！')).toBe('!');
      expect(fullwidthToHalfwidth('，')).toBe(',');
    });
  });
});

describe('presets.ts', () => {
  it('every ruleset preset applies without error on its sample', () => {
    PRESETS.filter(p => p.kind === 'ruleset').forEach(preset => {
      const sampleText = /* fetch sample from i18n */ '...';
      const result = applyRules(sampleText, preset.rules!);
      expect(result.output).not.toBe(sampleText); // Changed
      expect(result.perRuleCounts.every(c => !c.error)).toBe(true); // No errors
    });
  });
});

describe('recents.ts', () => {
  it('pushRecent maintains MRU order', () => {
    let list: string[] = [];
    list = pushRecent(list, 'a');
    list = pushRecent(list, 'b');
    list = pushRecent(list, 'a'); // Duplicate → move to front
    expect(list[0]).toBe('a');
    expect(list.length).toBe(2);
  });
  it('respects max length', () => {
    let list: string[] = [];
    for (let i = 0; i < 15; i++) {
      list = pushRecent(list, `text${i}`, 10);
    }
    expect(list.length).toBe(10);
  });
});
```

### 8.2 컴포넌트 계층 (Vitest, ≥80%)

```typescript
// src/components/tools/find-replace/*.test.tsx

describe('useFindReplace', () => {
  it('debounced applyRules on text/rules change', () => {
    const { result } = renderHook(() => useFindReplace());
    act(() => {
      result.current.setText('hello');
      result.current.addRule();
    });
    expect(result.current.applyResult.output).toBe('hello');
  });
  it('persists to localStorage', () => {
    const { result } = renderHook(() => useFindReplace());
    act(() => {
      result.current.setText('test');
      result.current.addRule();
    });
    // localStorage should reflect state (debounced)
    // ...
  });
  it('falls back to in-memory if localStorage unavailable', () => {
    // Mock localStorage.setItem to throw
    // Expect tool to stay functional
  });
});

describe('RuleRow', () => {
  it('renders find/replace inputs with labels (getByLabelText)', () => {
    render(
      <FindReplaceProvider>
        <RuleRow ruleId="1" />
      </FindReplaceProvider>
    );
    expect(screen.getByLabelText('찾을 내용')).toBeInTheDocument();
    expect(screen.getByLabelText('바꿀 내용')).toBeInTheDocument();
  });
  it('toggle aria-pressed states', () => {
    const { rerender } = render(
      <FindReplaceProvider>
        <RuleRow ruleId="1" initialRule={{...}} />
      </FindReplaceProvider>
    );
    const regexToggle = screen.getByRole('button', { name: /regex/i });
    expect(regexToggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(regexToggle);
    expect(regexToggle).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ResultOutput', () => {
  it('renders highlighted spans from indices', () => {
    const spans = [{ index: 0, length: 2 }, { index: 5, length: 3 }];
    render(
      <ResultOutput
        text="hello world"
        spans={spans}
        perRuleCounts={[{ ruleId: '1', count: 2 }]}
        totalCount={2}
      />
    );
    // Verify highlights are rendered (no dangerouslySetInnerHTML)
  });
  it('copy button works (clipboard API)', async () => {
    render(<ResultOutput text="test" ... />);
    const copyBtn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyBtn);
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });
  it('download triggers file download', () => {
    // Mock URL.createObjectURL
    render(<ResultOutput text="test" ... />);
    const dlBtn = screen.getByRole('button', { name: /download/i });
    fireEvent.click(dlBtn);
    // Verify download event fired
  });
});

describe('FindReplaceIntro / HowTo / Faq (SEO gate-free SSR)', () => {
  it('renders H1 outside any mounted gate', () => {
    render(<FindReplaceIntro />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('문장 바꾸기');
  });
  it('FindReplaceFaq renders visible faq.items', () => {
    render(<FindReplaceFaq />);
    // Verify each faq.items[i] renders as visible question/answer
  });
  it('FAQPage JSON-LD is present in prototypeScope (from Faq single owner)', () => {
    const { container } = render(<FindReplaceFaq />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toContain('FAQPage');
  });
});
```

### 8.3 E2E (Playwright, 5 scenarios)

```typescript
// tests/e2e/find-replace.spec.ts

test.describe('find-replace tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ko/tools/find-replace');
  });

  test('scenario 1: multiple literal rules applied together', async ({ page }) => {
    // Arrange: Paste text "고양이가 강아지를", add rule1 "고양이"→"호랑이", add rule2 "강아지"→"여우"
    // Act: Both rules apply
    // Assert: Result "호랑이가 여우를", rule1 count=1, rule2 count=1, total=2
    await page.fill('[aria-label="Text to transform"]', '고양이가 강아지를');
    // (add rules, fill inputs, check result output)
  });

  test('scenario 2: options case-sensitive, whole-word, first-only', async ({ page }) => {
    // Test case-sensitive toggle
    // Test whole-word boundary (unicode)
    // Test first-only replacement
  });

  test('scenario 3: regex mode with capture groups', async ({ page }) => {
    // Pattern: (\\d{4})-(\\d{2})-(\\d{2})
    // Replace: $3/$2/$1
    // Input: 2026-07-07
    // Output: 07/07/2026
    await page.fill('[aria-label*="find"]', '(\\d{4})-(\\d{2})-(\\d{2})');
    await page.fill('[aria-label*="replace"]', '$3/$2/$1');
    await page.click('button[aria-label*="regex"]'); // Toggle ON
    await page.fill('[aria-label="Text to transform"]', '2026-07-07');
    // Verify output
  });

  test('scenario 4: presets (to-js-string round-trip)', async ({ page }) => {
    // Paste multi-line text, click "여러 줄 → JS 문자열" preset
    // Result: escaped + quoted
    // Click inverse "JS 문자열 → 원문" preset
    // Result: original text restored
  });

  test('scenario 5: saved rule-sets, recents, localStorage persistence, both locales', async ({ page, context }) => {
    // Build 3 rules, save as "이름 치환"
    // Reload page → saved set persists, apply repopulates
    // Switch to EN → all chrome in English, no Korean leakage
    // Check ko/en both render promatically (no 한글 in en version)
  });

  test('pageerror hard gate (invalid regex never crashes app)', async ({ page }) => {
    // Add regex rule with invalid pattern
    // Expect no console errors, per-rule error shown, other rules continue
    page.on('pageerror', (err) => {
      throw err; // Fail test if JS error
    });
  });
});
```

---

## 9. 크리티컬 경로 + 리더 검증 게이트

### 9.1 의존성 검증

```bash
# 1. Domain ≥90% coverage (모든 edge case 포함)
pnpm test src/lib/find-replace --coverage
# Expected: ≥90% branch, all edge fixtures (CJK, zero-length, invalid regex, timeout)

# 2. i18n completeness (키 드리프트 0)
grep -r "t('find-replace\." src/components/tools/find-replace/ | cut -d"'" -f2 | sort -u > /tmp/used.txt
grep '"find-replace\.' src/i18n/messages/ko.json | cut -d'"' -f2 | sort -u > /tmp/defined.txt
diff /tmp/used.txt /tmp/defined.txt  # Must be empty

# 3. tsc strict mode
pnpm tsc --noEmit --strict
# Expected: 0 errors

# 4. Build SSG
pnpm build
# Expected: 그린, ko/en 모두 정적 생성, [locale]/tools/find-replace.html 존재

# 5. 프리렌더 HTML 검증 (SSR 본문 + JSON-LD)
curl -s https://apps.jurepi.kr/ko/tools/find-replace | grep -o 'FAQPage' | wc -l
# Expected: 정확히 1개 (Faq 단일 소유)
curl -s https://apps.jurepi.kr/ko/tools/find-replace | grep -o 'SoftwareApplication' | wc -l
# Expected: 정확히 1개
curl -s https://apps.jurepi.kr/ko/tools/find-replace | grep 'H1' | head -1
# Expected: "문장 바꾸기"

# 6. E2E 전체 스위트
pnpm test:e2e find-replace.spec.ts
# Expected: 모든 시나리오 통과, pageerror 0개

# 7. Axe a11y (ko/en 모두)
pnpm axe-scan /ko/tools/find-replace
pnpm axe-scan /en/tools/find-replace
# Expected: 모든 violations 해결

# 8. Visual regression (320/768/1024, light/dark)
pnpm test:visual find-replace
# Expected: baseline 대비 회귀 0개
```

### 9.2 리더 최종 체크리스트

- [ ] 도메인 ≥90% coverage (edge: CJK, unicode boundary, invalid regex, timeout, zero-length, multi-rule ordering)
- [ ] i18n ko/en 키 드리프트 0 (최상위 `tools.find-replace.title/description` 포함)
- [ ] tsc strict 0 errors
- [ ] 빌드 SSG 그린, [locale]/tools/find-replace 2개 정적 페이지
- [ ] 프리렌더 HTML: H1/Intro 가시, FAQPage/SoftwareApplication 각 1개, canonical==seo.absoluteToolUrl
- [ ] E2E 5 scenario + pageerror hard gate 모두 통과
- [ ] axe a11y ko/en 패스, WCAG AA
- [ ] Visual 320/768/1024 회귀 0개
- [ ] 라이브 curl -I: 302, 보안헤더 5종(CSP/HSTS/X-Frame/X-Content-Type/Referrer-Policy), sitemap 등재
- [ ] registry status coming_soon 확정 (라이브 전환 대기)

---

## 10. 미결정 사항 (리더 확인 필요)

### 10.1 ReDoS Guard 구현 방식

**선택지:**
1. **Web Worker** (Phase 2 후보): `new Worker(new URL('./replace.worker.ts', import.meta.url))`
   - 장: hard guarantee (tab 영구 동결 불가)
   - 단: 빌드 환경 검증 필요 (`output: 'export'` + 정적 에셋), 복잡도 ↑
   
2. **Deadline loop + input cap** (MVP, 현재 결정):
   - 장: 간단, 의존성 0, 문서화 (best-effort)
   - 단: 매우 악의적 regex 시 잠깐 느려질 수 있음 (millisecond 수준, 영구 동결 아님)

**현 설정**: 옵션 2 (Deadline loop)
- SPEC에서 이미 선택됨 ("fallback: deadline+caps")
- how-to에 정직 명시: "극단적 정규식에선 탭이 잠깐 멎을 수 있음"

**리더 결정 필요**: Worker 스파이크를 MVP에 포함할지, Phase 2로 미룰지?

### 10.2 드래그 앤 드롭 (DnD) 규칙 재정렬

**선택지:**
1. 버튼만 (↑/↓): 간단, 접근성 우선, 의존성 0
2. 네이티브 HTML5 DnD: 브라우저 표준, 별도 라이브러리 불필요
3. react-beautiful-dnd 같은 라이브러리: 풍부하지만 무거움

**현 설정**: 버튼만 추천 (SPEC: "Drag-and-drop optional; if added, defer to Phase 2")

**리더 결정**: MVP에 DnD 포함할지? (선택사항, 버튼이 MVP)

---

## 결론

이 청사진은 **클린 아키텍처 + TDD** 원칙으로 다음을 보장합니다:
1. **도메인 순수성**: 도메인 계층이 React/Next.js/DOM을 전혀 몰라도 완전 동작
2. **병렬 개발**: 도메인 완료 전에 i18n/registry 병렬 진행 가능
3. **안전성**: ReDoS 가드 (deadline), invalid regex error handling, zero-length safeguard
4. **발견성**: SSR 본문 + JSON-LD (gate-free) → 검색엔진/AI 크롤러 색인
5. **유지보수성**: ≥90% 도메인 커버리지, 명확한 계약, i18n 키 드리프트 0

**다음 단계:** 리더 승인 후 domain-engineer 착수.
