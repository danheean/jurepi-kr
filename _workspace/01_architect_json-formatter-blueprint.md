# JSON Formatter & Validator — Architecture Blueprint

**Status**: Ready for implementation  
**Target**: `src/` parallel workflow (domain → UI ∥ platform → QA)  
**Registry**: `id: 'json-formatter'`, `category: 'dev'`, `accent: 'sky'`, `status: 'live'`, `order: 25`

---

## 1. Domain Layer Contract

**Path**: `src/lib/json-formatter/`  
**Ownership**: Pure TS modules, zero React/Next imports. All functions unit-tested ≥80%.

### 1.1 Core Modules

```typescript
// schema.ts — zod + type definitions
export const formatOptionsSchema = z.object({
  indent: z.enum(['2', '4', 'tab']).default('2'),
  sortKeys: z.boolean().default(false),
  theme: z.enum(['light', 'dark', 'system']), // inherited
});
export type FormatOptions = z.infer<typeof formatOptionsSchema>;

export interface ParseResult {
  success: boolean;
  json?: any;
  output?: string; // Formatted if success
  error?: {
    line: number; // 1-indexed, human-friendly
    column: number;
    token: string;
    context: string; // ~20 chars around error
  };
}

export const storageSchema = z.object({
  version: z.number().default(1),
  indent: z.enum(['2', '4', 'tab']).default('2'),
  sortKeys: z.boolean().default(false),
  lastInput: z.string().optional(), // opt-in, disabled by default
});
export type StorageState = z.infer<typeof storageSchema>;

export const DEBOUNCE_MS = 200;
export const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB
export const STORAGE_KEY = 'jurepi-json-formatter';
```

```typescript
// tokenizer.ts — error position mapping
export interface TokenizeError {
  line: number;
  column: number;
  token: string;
  context: string;
}

/**
 * Extract line/column from JSON parse error.
 * Scans input char-by-char, tracking line (LF) and column (reset on LF).
 */
export function lineColFromParseError(
  jsonStr: string,
  error: Error
): TokenizeError;
```

```typescript
// format.ts — prettify
export function formatJson(
  jsonStr: string,
  options: { indent: '2' | '4' | 'tab' }
): ParseResult;

/**
 * Validate + format in one pass.
 * On parse error, return { success: false, error: {...} }
 * On success, return { success: true, json, output: formatted }
 */
```

```typescript
// minify.ts — compact
export function minifyJson(jsonStr: string): ParseResult;
```

```typescript
// sort-keys.ts — recursive alphabetical sort
export function sortKeysRecursive(json: any): any;
/**
 * Immutable: returns new object/array with all keys sorted recursively.
 * Arrays maintain order; objects' keys are alphabetized.
 */
```

```typescript
// tree-nodes.ts — tree structure for UI
export interface TreeNode {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  key?: string; // for object properties
  value?: any;
  children?: TreeNode[];
  depth: number;
}

export function jsonToTreeNodes(
  json: any,
  depth?: number,
  key?: string
): TreeNode;
```

```typescript
// stats.ts — size + depth analysis
export interface JsonStats {
  byteSize: number; // formatted JSON byte length
  elementCount: number; // leaf values only
  depth: number; // max nesting
}

export function getStats(json: any): JsonStats;
```

```typescript
// fetch-url.ts — load from URL (user-initiated only)
export interface JsonUrlError {
  code: 'invalid_url' | 'cors_or_network' | 'http_error' | 'too_large' | 'empty_body';
  message: string; // i18n key prefix: errors.urlLoad.<code>
  httpStatus?: number;
}

export function validateJsonUrl(rawUrl: string): { ok: true; url: string } | { ok: false; error: 'invalid_url' };

/**
 * fetchImpl: injected for unit tests (no jsdom fetch dependency).
 * Direct browser fetch; no proxy. Typed error codes, never raw exceptions.
 */
export function fetchJsonFromUrl(
  url: string,
  { maxBytes, fetchImpl }: { maxBytes?: number; fetchImpl?: typeof fetch }
): Promise<{ text: string } | { error: JsonUrlError }>;
```

### 1.2 Invariants

- **Immutability**: All transformations return new objects; never mutate input.
- **Error codes, not exceptions**: domain functions return `{ success, error: {code, message, ...} }`, never throw on user input.
- **Precise line/col**: tokenizer maps every parse error to exact 1-indexed position + context.
- **Max input guard**: 10MB cap; reject silently (return parse error) if exceeded.
- **XSS-safe values**: domain layer returns plain data; no HTML generation.

---

## 2. Hook & Component Contract

**Path**: `src/components/tools/json-formatter/`

### 2.1 useJsonFormatter Hook

```typescript
export interface UseJsonFormatterState {
  input: string;
  indent: '2' | '4' | 'tab';
  sortKeys: boolean;
  parseResult: ParseResult;
  stats: JsonStats | null;
  isLoading: boolean;
  error: JsonUrlError | null;
}

export interface UseJsonFormatterActions {
  setInput: (text: string) => void;
  setIndent: (indent: '2' | '4' | 'tab') => void;
  toggleSortKeys: () => void;
  format: () => void; // with current options
  minify: () => void;
  clear: () => void;
  loadFromUrl: (url: string) => Promise<void>; // user-initiated
  copyFormatted: () => Promise<boolean>; // navigator.clipboard
  downloadJson: (filename?: string) => void; // Blob → click trick
}

/**
 * Manages: input, options (indent/sort), live parse (debounced 200ms),
 * localStorage persist, error states, async URL load.
 * 
 * Returns stable, memoized callbacks (no inline function re-creation).
 * Parses on input change via debounce (ref to latest); setters use functional setState.
 */
export function useJsonFormatter(): [
  UseJsonFormatterState,
  UseJsonFormatterActions
];
```

### 2.2 Component Tree

```
JsonFormatter (Client Component — orchestrator + keyboard shortcuts)
  ├─ JsonFormatterIntro (server-rendered section)
  ├─ UrlLoader
  │   ├─ Input (URL placeholder)
  │   ├─ Button (Load)
  │   └─ ErrorMessage (if applicable)
  ├─ JsonInput
  │   └─ textarea (live onChange → debounce)
  ├─ FormatOptions
  │   ├─ IndentSelect (2/4/Tab)
  │   ├─ SortKeysToggle (checkbox)
  │   ├─ ActionButtons (Format/Minify/Clear)
  │   └─ StatusIcon (checkmark/warning)
  ├─ OutputPane (tab: Formatted | Tree)
  │   ├─ SyntaxHighlight (token-colored output)
  │   ├─ JsonTreeView (recursive, collapsible)
  │   ├─ CopyButton (with toast feedback)
  │   ├─ DownloadButton (filename prompt)
  │   └─ ErrorMessage (precise error display)
  ├─ JsonFormatterStats
  │   └─ "크기: X KB · 요소: Y개 · 깊이: Z"
  ├─ JsonFormatterHowTo (server-rendered SEO)
  └─ JsonFormatterFaq (server-rendered SEO + FAQPage JSON-LD)
```

### 2.3 Props & Boundaries

- **Global listeners** (keyboard shortcuts Ctrl+Enter, Ctrl+Shift+M, Ctrl+C): owned by JsonFormatter orchestrator.
- **Leaf components** (Input, OutputPane, ErrorMessage): receive props only; no global side effects.
- **UrlLoader**: debounce + error state isolated; never clears textarea on failure.

---

## 3. i18n Contract

**Namespace**: `tools.json-formatter.*`  
**Files**: `src/i18n/messages/{ko,en}.json`

### 3.1 Complete Key Tree (required for UI + platform wiring)

```json
{
  "tools": {
    "json-formatter": {
      "title": "JSON 정렬 및 검증",
      "description": "JSON을 정리하고 검증하는 개발자 도구",
      "meta": {
        "title": "JSON 정렬 및 검증 — Jurepi",
        "description": "복잡한 JSON을 한눈에…"
      },
      "urlLoader": {
        "label": "URL에서 불러오기",
        "placeholder": "https://api.example.com/data.json",
        "loadButton": "불러오기",
        "loading": "로딩 중…",
        "errors": {
          "invalid_url": "올바른 http(s) 주소를 입력하세요",
          "cors_or_network": "해당 서버가 브라우저에서의 접근(CORS)을 허용하지 않거나 네트워크 오류입니다. 파일을 내려받아 붙여넣어 주세요.",
          "http_error": "서버 응답 {{status}}",
          "too_large": "파일이 너무 커서 처리할 수 없습니다 (최대 10MB)",
          "empty_body": "응답이 비어 있습니다"
        }
      },
      "input": {
        "placeholder": "JSON을 붙여넣으세요…",
        "label": "JSON 입력"
      },
      "options": {
        "indent": "들여쓰기",
        "spaces2": "2칸",
        "spaces4": "4칸",
        "tab": "탭",
        "sortKeys": "키 정렬",
        "statusValid": "유효함",
        "statusInvalid": "오류"
      },
      "output": {
        "label": "출력",
        "formatTab": "정렬",
        "treeTab": "트리",
        "copy": "복사",
        "copySuccess": "복사됨!",
        "download": "다운로드",
        "downloadFilename": "data.json"
      },
      "actions": {
        "format": "정렬",
        "minify": "축약",
        "clear": "초기화"
      },
      "errors": {
        "title": "오류",
        "line": "줄",
        "column": "칸",
        "parseError": "{{line}}줄 {{column}}칸: 예상하지 못한 토큰 '{{token}}'"
      },
      "stats": {
        "size": "크기",
        "elements": "요소",
        "depth": "깊이",
        "display": "{{size}} · {{elements}}개 · 깊이 {{depth}}"
      },
      "shortcuts": {
        "format": "Ctrl+Enter",
        "minify": "Ctrl+Shift+M",
        "copy": "Ctrl+C"
      },
      "intro": {
        "eyebrow": "개발자 도구",
        "title": "JSON 정렬 및 검증",
        "lead": "복잡한 JSON을 한눈에 정리하고, 무효한 JSON의 정확한 오류 위치를 확인하세요."
      },
      "howTo": {
        "title": "사용 방법",
        "items": [
          { "title": "1단계: 붙여넣기", "description": "JSON을 입력 영역에 붙여넣으세요…" },
          { "title": "2단계: 옵션 선택", "description": "들여쓰기 스타일과 키 정렬 여부를 선택하세요…" },
          { "title": "3단계: 다운로드", "description": "정렬된 JSON을 복사하거나 다운로드하세요…" }
        ]
      },
      "faq": {
        "items": [
          { "q": "What is JSON?", "a": "JavaScript Object Notation…" },
          { "q": "Why format JSON?", "a": "Formatted JSON is readable…" },
          { "q": "Is my data private?", "a": "Yes, all processing happens in your browser…" },
          { "q": "Can I load from URL?", "a": "Yes, click Load and paste the URL…" }
        ]
      }
    }
  }
}
```

**Critical**: `tools.json-formatter.title` + `description` are consumed by `searchable-tools` (header search, home grid card).

---

## 4. Platform Wiring

### 4.1 Registry Entry

```typescript
// src/tools/registry.ts
{
  id: 'json-formatter',
  slug: 'json-formatter',
  category: 'dev',
  icon: 'Braces', // lucide-react
  accent: 'sky',
  status: 'live',
  isNew: true,
  order: 25,
  keywords: ['JSON', '포맷', '검증', '정렬', '개발', '도구', 'formatter', 'validator', 'minify', 'prettify'],
}
```

### 4.2 Route & Metadata

```typescript
// src/app/[locale]/tools/[slug]/page.tsx — existing route handles json-formatter
// 1. Import JsonFormatterPage (or branch via slug).
// 2. Platform-owned: Header, Footer, ThemeToggle, LocaleSwitcher, AdSlot, ConsentBanner, ErrorBoundary.
// 3. generateMetadata uses seo.buildToolMetadata(locale, 'json-formatter', ...)

// generateStaticParams iterates registry.filter(status === 'live')
// No manual params needed for json-formatter; registry-driven.
```

### 4.3 SEO & Structured Data

```typescript
// In JsonFormatterPage or layout:
// 1. Intro/HowTo/Faq render OUTSIDE mounted gate (SSR, game-gate not applied).
// 2. useTranslations is synchronous (not getTranslations — vitest must render).
// 3. FAQPage JSON-LD is Faq component's single owner (not duplicated in StructuredData).
// 4. StructuredData renders SoftwareApplication only (url==canonical via seo.absoluteToolUrl).
// 5. Sitemap: auto-included (registry status live); no manual entry needed.
// 6. llms.txt: single entry per tool (see /public/llms.txt).
```

### 4.4 Keyboard Shortcuts & Global Listeners

```typescript
// JsonFormatter orchestrator (use client):
// - Ctrl+Enter: trigger format() with current options.
// - Ctrl+Shift+M: trigger minify().
// - Ctrl+C (when output is valid): trigger copy().
// - Listeners: global on document; only active when JsonFormatter mounts.
// - All prevent default and show toast feedback.
```

---

## 5. SEO/GEO Ownership

- **Intro/HowTo/Faq**: Rendered by server component wrapper (no `'use client'` gate), consumed by isomorphic useTranslations.
- **FAQPage JSON-LD**: Single owner = `<Faq>` component. No duplication in StructuredData.
- **StructuredData (SoftwareApplication)**: Rendered once; url field = `seo.absoluteToolUrl(locale, 'json-formatter')` (must match canonical meta).
- **Breadcrumb**: Platform auto-injects via root layout; no duplication.
- **Prism HTML**: Gate is NOT applied to SEO sections; they remain visible in prism (out of /_next/data/*).

---

## 6. Build Order & Team Distribution

### Phase 1: Domain (Pure)
- **Owner**: domain-engineer  
- **Goal**: All modules ≥80% unit coverage, tsc 0, no React imports.
- **Merge gate**: `pnpm vitest run src/lib/json-formatter/**` all green, coverage ≥80%.

### Phase 2: UI + Platform (Parallel)
- **UI owner**: ui-engineer  
- **Platform owner**: platform-engineer  
- **UI goal**: Components, hooks, i18n keys (complete ko/en list), Intro/HowTo/Faq, tests.
- **Platform goal**: Registry entry, route generator, metadata builder, llms.txt.
- **Merge gate**: Both `tsc --noEmit` and `pnpm test` pass; i18n keys ⊇ UI consumption.

### Phase 3: QA (Integration)
- **Owner**: qa-engineer  
- **Goal**: E2E 6 scenarios, visual regression 320/768/1024, a11y axe + keyboard shortcuts.
- **Merge gate**: All E2E green, no a11y violations, LCP < 2.5s, CLS < 0.1.

### Final: Deployment
- **Trigger**: `git push origin dev/json-formatter:main` (CF auto-builds + deploys).
- **Verification**: `curl https://apps.jurepi.kr/{ko,en}/tools/json-formatter` returns 200, HTML has FAQPage + canonical, sitemap.xml lists it.

---

## 7. Known Hazards & Checklist

### Phantom Tokens
- **Allowed**: `accent-sky`, `accent-sky-soft`, `brand`, `on-brand`, `surface-muted`, `danger`, `danger-ink`.
- **Forbidden**: `surface-hover`, `max-w-{sm,md,lg}` (scale conflict), any semantic variant not in DESIGN.md.
- **Gate**: `color-tokens.test.ts` grep + linter on commit.

### Debounce Input Binding
- Draft state must be **immediately reflected** in controlled input (no lag).
- Debounce applies only to async compute (tokenizer, EUC-KR import, etc.).
- `setInput` updates state instantly; parse effect debounces the side-effect.

### Async Value Capture
- Never pass `stateRef.current` or props snapshots into debounced callbacks.
- Localize the value: `const text = inputRef.current.value; debounce(() => parse(text), ...)`.
- Functional setState where needed: `setResult(prev => ({ ...prev, ... }))` if chaining updates.

### Component Tests with Real i18n
- Wrap `<NextIntlClientProvider messages={mockMessages}>` around tested component.
- Use actual messages catalog (not mocked), so missing keys throw MISSING_MESSAGE.
- Both ko and en locales must render (no hard-coded Korean text).

### Rules of Hooks
- All hook calls ABOVE early return statements.
- No conditional hooks (e.g., `if (error) useEffect(...)`).
- Stable dependencies for callbacks; use `useCallback` for memoization.

### XSS Safety
- Tree view & error messages render via React (text nodes, auto-escaped).
- Syntax highlighting: CSS classes only, never `dangerouslySetInnerHTML`.
- Copy button: `navigator.clipboard.writeText(plainText)`, no rich HTML.

### 10MB Input Guard
- Check input length early (sync, no debounce).
- Reject with parse error `{ success: false, error: { ... } }`, not exception.
- UI shows user-friendly message: "파일이 너무 커서 처리할 수 없습니다".

### URL Fetch — Typed Errors
- Never return raw `Error.message` from failed fetch.
- Map to one of: `invalid_url`, `cors_or_network`, `http_error`, `too_large`, `empty_body`.
- UI renders i18n message for each code; CORS message explicitly suggests paste as fallback.

---

## Summary

**Blueprint Path**: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-json-formatter/_workspace/01_architect_json-formatter-blueprint.md`

**Key Decisions**:
1. **Clean 4-layer split**: Domain (lib/) → Hook (useJsonFormatter) → Components → Route + SEO.
2. **Tokenizer for precision**: Line/col mapping, not token count — exact error position.
3. **Debounce parse, instant input**: 200ms compute debounce, real-time UI feedback.
4. **No backend, no proxy**: Direct browser fetch for Load-from-URL; typed error codes; honest CORS message.
5. **SEO always-on**: Intro/HowTo/Faq outside game-gate; FAQPage single-owned by Faq; canonical url in StructuredData.
