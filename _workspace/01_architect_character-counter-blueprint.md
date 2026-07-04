# Character Counter (글자·단어 카운터) — Architecture Blueprint

**Tool Slug:** `character-counter` | **Category:** `text` | **Accent:** `mint` | **Status:** `live`

**Summary:** A live-counting utility for analyzing text metrics (character/word/sentence/paragraph/line/byte/reading-time/speaking-time). 100% client-side SPA on SSG shell. Single textarea input, real-time metrics card, optional limit preset with color-coded progress bar, copy text/stats/clear buttons, localStorage persistence.

---

## 1. Layer Decomposition

### Dependency Direction

All imports flow **inward only**:

```
UI Components (React)
    ↓ imports
Hook (useCharacterCounter)
    ↓ imports
Domain (lib/character-counter/*)
    ↓ imports
TypeScript / Web APIs only (NO React/Next)
```

### File Structure & Layer Ownership

#### Domain Layer (Pure Functions)
**Path:** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/src/lib/character-counter/`

| File | Responsibility | No React Imports |
|------|-----------------|-----------------|
| `counter.ts` | countCharacters, countWords, countSentences, countParagraphs, countLines, getByteSize, estimateReadingTime | ✓ |
| `segmenter.ts` | Intl.Segmenter wrapper + fallback for grapheme-aware counting | ✓ |
| `preset-limits.ts` | TWITTER_LIMIT=280, META_DESCRIPTION_LIMIT=160, etc.; PresetLimit type & factory | ✓ |
| `types.ts` | CharacterCounterMetrics, PresetLimit, CounterStore, CounterState interfaces | ✓ |

#### Hook Layer (React State Management)
**Path:** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/src/components/tools/character-counter/`

| File | Responsibility |
|------|-----------------|
| `useCharacterCounter.ts` | useState (textarea, limit, preferences); useEffect (localStorage read/write debounced 300ms); copy adapters |

#### Component Layer (UI)
**Path:** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/src/components/tools/character-counter/`

| File | Responsibility | Client/Server |
|------|-----------------|----------------|
| `CharacterCounter.tsx` | "use client"; orchestrator (textarea + sidebar layout) | Client |
| `CounterMetrics.tsx` | 9-row metric grid card (characters/words/sentences/paragraphs/lines/bytes/reading-time/speaking-time) | Client |
| `LimitIndicator.tsx` | Preset buttons (Twitter/Meta/Custom/None) + custom number input + 3-state progress bar (green/yellow/red) | Client |
| `CopyButton.tsx` | Icon + label; copies textarea.value via clipboard API → success toast | Client |
| `ClearButton.tsx` | Icon + label; clears textarea + toast "초기화되었습니다!" | Client |
| `CounterIntro.tsx` | H1 + eyebrow + lead; server-render (no "use client") for SEO | Server |
| `CounterHowTo.tsx` | "How to count characters and words" long-form; server-render for SEO | Server |
| `CounterFaq.tsx` | Q&A grid + FAQPage JSON-LD emission (owned ONLY by this component) | Client |
| `CounterStructuredData.tsx` | SoftwareApplication + BreadcrumbList JSON-LD (server component, route ownership) | Server |

#### Platform Integration
**Path:** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/src/app/[locale]/tools/[slug]/page.tsx`

- Already has slug → component branching
- Will add `character-counter` branch in `ToolContent` conditional
- Will add `character-counter` branch in `generateMetadata` conditional

---

## 2. Domain Public API Contract

### counter.ts — Core Metrics Functions

```typescript
/**
 * Count graphemes (emoji/ZWJ = 1 character).
 * Uses Intl.Segmenter if available; fallback to String.length.
 * Empty string → 0.
 */
export function countCharacters(text: string): number;

/**
 * Count graphemes, excluding whitespace (space/tab/newline/etc).
 * Empty string → 0.
 */
export function countCharactersNoSpaces(text: string): number;

/**
 * Count words (split on /\s+/, trim).
 * Empty string → 0.
 */
export function countWords(text: string): number;

/**
 * Count sentences (split on /[.!?…]+/, trim).
 * Non-empty text with no sentence-ending punctuation = 1 sentence.
 * Empty string → 0.
 */
export function countSentences(text: string): number;

/**
 * Count paragraphs (split on /\n\s*\n/i.e. blank-line separated).
 * Empty string → 0.
 */
export function countParagraphs(text: string): number;

/**
 * Count lines (split on /\r\n|\r|\n/).
 * Empty string → 0; otherwise segments.length.
 */
export function countLines(text: string): number;

/**
 * UTF-8 byte size via TextEncoder.
 */
export function getByteSize(text: string): number;

/**
 * Estimate reading time in minutes (words / readWPM; default 200).
 * Rounds to 1 decimal place; 0 for empty.
 */
export function estimateReadingTime(words: number, readWPM?: number): number;

/**
 * Estimate speaking time in minutes (words / speakWPM; default 130).
 * Rounds to 1 decimal place; 0 for empty.
 */
export function estimateSpeakingTime(words: number, speakWPM?: number): number;

/**
 * Compute all metrics in one call (convenience wrapper).
 */
export function computeMetrics(
  text: string,
  options?: { readWPM?: number; speakWPM?: number }
): CharacterCounterMetrics;
```

### types.ts — Data Models

```typescript
export interface CharacterCounterMetrics {
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  byteSize: number; // UTF-8
  readingTimeMinutes: number; // words / readWPM
  speakingTimeMinutes: number; // words / speakWPM
}

export interface PresetLimit {
  id: 'twitter' | 'meta_description' | 'custom' | 'none';
  label: string; // Localized: "Twitter (280)", "Meta Description (160)", etc.
  limit: number | null; // null if "none"
  description?: string;
}

export interface CounterStore {
  version: number; // STORE_VERSION = 1
  lastText: string;
  lastLimit: { id: string; limit: number | null } | null;
  readWPM: number; // Default 200
  speakWPM: number; // Default 130
}

/**
 * Hook state shape.
 */
export interface CounterState {
  text: string;
  metrics: CharacterCounterMetrics;
  limit: PresetLimit | null;
  customLimitInput: string; // Raw user input for custom field
  isLoading: boolean; // true during mount localStorage read
}
```

### preset-limits.ts — Limit Presets

```typescript
export const TWITTER_LIMIT = 280;
export const META_DESCRIPTION_LIMIT = 160;
export const STORAGE_MAX_LENGTH = 100000;
export const DEBOUNCE_MS = 300;
export const DEFAULT_READ_WPM = 200;
export const DEFAULT_SPEAK_WPM = 130;
export const STORE_VERSION = 1;

/**
 * Get preset limit by id.
 */
export function getPresetLimit(id: 'twitter' | 'meta_description' | 'none'): PresetLimit;

/**
 * Create custom limit object.
 */
export function createCustomLimit(limitNumber: number | null): PresetLimit;
```

### segmenter.ts — Grapheme Counting

```typescript
/**
 * Count grapheme segments using Intl.Segmenter (granularity: 'grapheme').
 * Fallback to String.length if unavailable (logs console warn).
 * Handles emoji, ZWJ sequences, combining marks correctly.
 */
export function countGraphemes(text: string): number;
```

---

## 3. Hook Contract

### useCharacterCounter

**Path:** `src/components/tools/character-counter/useCharacterCounter.ts`

```typescript
import { CharacterCounterMetrics, PresetLimit } from '@/lib/character-counter';

export interface UseCharacterCounterReturn {
  // State
  text: string;
  metrics: CharacterCounterMetrics;
  limit: PresetLimit | null; // Currently selected preset or custom
  customLimitInput: string; // Raw string in custom number field
  isLoading: boolean; // true if loading from localStorage on mount

  // Actions
  setText: (text: string) => void; // Update textarea; debounced compute metrics; debounced localStorage write
  setLimit: (limit: PresetLimit | null) => void; // Set preset or custom
  setCustomLimitInput: (input: string) => void; // Update custom number field (unvalidated string)
  clearText: () => void; // Clear textarea; update localStorage
  copyText: () => Promise<void>; // Copy textarea.value to clipboard; catch silently
  copyMetrics: () => Promise<void>; // Copy metrics as formatted string; catch silently
}

export function useCharacterCounter(): UseCharacterCounterReturn;
```

**Invariants:**
- `setText` is debounced 300ms before computing metrics and writing localStorage.
- localStorage keys: `jurepi-char-counter-text`, `jurepi-char-counter-limit`, `jurepi-char-counter-prefs`.
- Read on mount via zod parse; fail → start fresh (no throw, fully functional in-memory).
- Write debounced per key separately to avoid blocking input.
- `customLimitInput` is unvalidated string; on change, hook parses to number and updates `limit` object.
- Copy methods catch errors silently (optional UX).
- No effect infinite loops; stable refs only in dependencies.

---

## 4. i18n KEY CONTRACT (Authoritative)

### Top-Level Required Keys (Shared Surfaces)

These keys are consumed by `searchable-tools`, footer, home card, header search, and `generateMetadata`:

```json
{
  "tools.character-counter.title": "글자·단어 카운터 | Character & Word Counter",
  "tools.character-counter.description": "텍스트의 글자·단어·문장을 실시간으로 세어 보세요. | Count characters, words, sentences in real-time.",
  "tools.character-counter.meta.title": "글자·단어 카운터 - 실시간 텍스트 분석 | Character & Word Counter",
  "tools.character-counter.meta.description": "소셜미디어, 폼, 에세이 제출 시 글자 수를 세세히 확인하세요. 공백 포함/제외, 단어, 문장, 단락, 줄, 바이트 크기, 읽는 시간을 실시간으로 계산합니다. | Verify character limits for social media, forms, and essays. Real-time metrics: with/without spaces, words, sentences, paragraphs, lines, UTF-8 bytes, reading time."
}
```

### Tool-Specific Keys (UI Components)

**Intro / HowTo (Server-Render):**
```json
{
  "tools.character-counter.intro.eyebrow": "텍스트 도구 | TEXT TOOL",
  "tools.character-counter.intro.heading": "글자·단어 카운터 | Character & Word Counter",
  "tools.character-counter.intro.lead": "텍스트의 글자·단어·문장을 실시간으로 세어 보세요. | Count characters, words, sentences in real-time."
}
```

**Textarea & Metrics (Client):**
```json
{
  "tools.character-counter.textarea.placeholder": "여기에 텍스트를 붙여 넣으세요 · Paste or type text here…",
  "tools.character-counter.textarea.ariaLabel": "텍스트 입력 | Text input",
  "tools.character-counter.hint": "{chars} 글자 ({noSpace} 공백 제외) | {chars} characters ({noSpace} without spaces)",
  
  "tools.character-counter.metrics.label.charactersWithSpaces": "글자 (공백 포함) | Characters (with spaces)",
  "tools.character-counter.metrics.label.charactersWithoutSpaces": "글자 (공백 제외) | Characters (no spaces)",
  "tools.character-counter.metrics.label.words": "단어 | Words",
  "tools.character-counter.metrics.label.sentences": "문장 | Sentences",
  "tools.character-counter.metrics.label.paragraphs": "단락 | Paragraphs",
  "tools.character-counter.metrics.label.lines": "줄 | Lines",
  "tools.character-counter.metrics.label.byteSize": "바이트 (UTF-8) | Bytes (UTF-8)",
  "tools.character-counter.metrics.label.readingTime": "읽는 시간 | Reading time",
  "tools.character-counter.metrics.label.speakingTime": "말하는 시간 | Speaking time",
  "tools.character-counter.metrics.unit.minutes": "분 | min"
}
```

**Limit Presets (Client):**
```json
{
  "tools.character-counter.limit.label": "글자 제한 | Character Limit",
  "tools.character-counter.limit.preset.twitter": "Twitter (X) — 280",
  "tools.character-counter.limit.preset.meta": "Meta 설명 — 160 | Meta Description — 160",
  "tools.character-counter.limit.preset.custom": "사용자 정의 | Custom",
  "tools.character-counter.limit.preset.none": "제한 없음 | None",
  "tools.character-counter.limit.customInput.ariaLabel": "사용자 정의 글자 제한 입력 | Custom character limit input",
  "tools.character-counter.limit.progress.status.under": "{current} / {limit} (적정) | {current} / {limit} (OK)",
  "tools.character-counter.limit.progress.status.near": "{current} / {limit} (80%) | {current} / {limit} (80%)",
  "tools.character-counter.limit.progress.status.over": "{current} / {limit} (초과) | {current} / {limit} (OVER)"
}
```

**Action Buttons (Client):**
```json
{
  "tools.character-counter.button.copyText": "텍스트 복사 | Copy text",
  "tools.character-counter.button.copyStats": "통계 복사 | Copy stats",
  "tools.character-counter.button.clear": "지우기 | Clear",
  "tools.character-counter.toast.copiedText": "복사됨! | Copied!",
  "tools.character-counter.toast.copiedStats": "통계가 복사됐습니다! | Stats copied!",
  "tools.character-counter.toast.cleared": "초기화되었습니다! | Cleared!"
}
```

**FAQ (Faq Component owns FAQPage JSON-LD):**
```json
{
  "tools.character-counter.faq.title": "자주 묻는 질문 | FAQ",
  "tools.character-counter.faq.items": [
    {
      "q": "공백을 포함한 글자 수와 제외한 글자 수가 다른 이유는? | Why do character counts with and without spaces differ?",
      "a": "공백은 스페이스, 탭, 줄바꿈 등입니다. 많은 앱(소셜미디어, 폼)이 공백 포함 기준으로 제한을 설정합니다. | Spaces include tabs, line breaks, etc. Most apps (social media, forms) set limits by character count including spaces."
    },
    {
      "q": "이모지는 글자 수에 어떻게 계산되나요? | How are emoji counted?",
      "a": "이모지와 합자(ZWJ) 시퀀스는 1개 글자로 계산됩니다 (Intl.Segmenter 기반). | Emoji and ZWJ sequences count as 1 character each (via Intl.Segmenter)."
    },
    {
      "q": "읽는 시간은 어떻게 계산되나요? | How is reading time calculated?",
      "a": "단어 수를 분당 읽는 속도(기본 200 WPM)로 나눕니다. | We divide word count by your reading speed (default 200 WPM)."
    },
    {
      "q": "말하는 시간은 어떻게 계산되나요? | How is speaking time calculated?",
      "a": "단어 수를 분당 말하는 속도(기본 130 WPM)로 나눕니다. | We divide word count by your speaking speed (default 130 WPM)."
    },
    {
      "q": "바이트 크기가 글자 수와 다른 이유는? | Why do bytes differ from character count?",
      "a": "UTF-8 인코딩에서 한글, 이모지 등은 여러 바이트를 차지합니다. 프로그래밍에서는 바이트 제한이 흔합니다. | In UTF-8, Korean characters and emoji take multiple bytes. Byte limits are common in programming."
    }
  ],
  "tools.character-counter.howTo.title": "사용 방법 | How to Use",
  "tools.character-counter.howTo.steps": [
    { "step": 1, "text": "텍스트 입력: 텍스트를 붙여 넣거나 입력하세요. | Paste or type text into the input field." },
    { "step": 2, "text": "실시간 계산: 모든 메트릭이 즉시 업데이트됩니다. | All metrics update in real-time as you type." },
    { "step": 3, "text": "제한 설정 (선택): Twitter, Meta, 사용자 정의 등 제한을 선택하세요. | Optionally select a character limit (Twitter, Meta, custom)." },
    { "step": 4, "text": "복사 및 공유: 텍스트 또는 통계를 복사하세요. | Copy the text or metrics for use elsewhere." }
  ]
}
```

---

## 5. JSON-LD Ownership & SEO Structure

### SingletonPattern: JSON-LD Ownership

**FAQPage** → Owned ONLY by `CounterFaq` component
- Renders `<script type="application/ld+json">` with FAQPage schema
- Feeds from `faq.items[]` from messages (k + v both localized)
- URL field = canonical (via `absoluteToolUrl(locale, 'character-counter')`)

**SoftwareApplication + BreadcrumbList** → Owned by `CounterStructuredData` (server component, route-level)
- Both rendered in the route page, NOT in orchestrator
- SoftwareApplication url = canonical

### Rendering Gates

- **All SEO sections (Intro/HowTo/Faq/StructuredData) MUST render OUTSIDE any `mounted` gate**
  - They appear in prerendered HTML for AI crawlers, not just after hydration
- Faq & Intro are server components (no "use client")
- CounterFaq uses `useTranslations()` (isomorphic hook, works in server context)

---

## 6. Platform Change Checklist

### Registry Entry
**File:** `src/tools/registry.ts`

Add entry (order = 25, first available after restaurant-map=24):

```typescript
{
  id: 'character-counter',
  slug: 'character-counter',
  category: 'text',
  icon: 'Type', // or 'AlignLeft' or 'FileText' (lucide-react icon)
  accent: 'mint',
  status: 'live',
  isNew: true,
  order: 25,
  keywords: [
    '글자', '글자수', '글자세기', '단어', '단어수', '문장', '문단', '바이트', 
    'character counter', 'word count', 'text metrics', 'character limit', 
    'twitter limit', 'meta description', 'readability', 'reading time'
  ],
}
```

### Route Branch
**File:** `src/app/[locale]/tools/[slug]/page.tsx`

1. **Import** dynamic components:
```typescript
const CharacterCounter = dynamic(() =>
  import('@/components/tools/character-counter/CharacterCounter').then((m) => ({
    default: m.CharacterCounter,
  }))
);
```

2. **generateMetadata branch** (add new conditional):
```typescript
} else if (slug === 'character-counter') {
  title = t('meta.title');
  description = t('meta.description');
```

3. **ToolContent branch** (add new conditional):
```typescript
if (slug === 'character-counter') {
  return (
    <>
      <CharacterCounterStructuredData />
      <CharacterCounterIntro />
      <CharacterCounter />
      <CharacterCounterHowTo />
      <CharacterCounterFaq />
    </>
  );
}
```

4. **Import SEO components** at top:
```typescript
import { CharacterCounterIntro } from '@/components/tools/character-counter/CounterIntro';
import { CharacterCounterHowTo } from '@/components/tools/character-counter/CounterHowTo';
import { CharacterCounterFaq } from '@/components/tools/character-counter/CounterFaq';
import { CharacterCounterStructuredData } from '@/components/tools/character-counter/CounterStructuredData';
```

### Sitemap (Auto)
**File:** `src/app/sitemap.ts`

- No manual entry needed: `getLiveTools().filter(t => t.status === 'live').map(...)` auto-includes character-counter

### llms.txt Entry
**File:** `public/llms.txt`

Add line:
```
https://apps.jurepi.kr/[locale]/tools/character-counter — Text metrics: character/word/sentence/paragraph/line/byte count, reading time, character limits
```

### i18n Messages
**Files:** `src/i18n/messages/ko.json` + `en.json`

Add entire `tools.character-counter` namespace with all keys from Section 4 above.

---

## 7. Build Order & Agent Assignments

### Phase 1: Domain (Pure Functions) — **domain-engineer**

**Files to implement:**
- `src/lib/character-counter/types.ts` (interfaces only)
- `src/lib/character-counter/segmenter.ts` (grapheme counting)
- `src/lib/character-counter/preset-limits.ts` (preset constants)
- `src/lib/character-counter/counter.ts` (all metric functions)

**Testing:**
- Vitest ≥80% coverage
- RED: grapheme tests (emoji "👋" = 1, "a" = 1)
- RED: word/sentence split tests (edge: no punctuation, CRLF line endings)
- RED: byte size tests (Korean char = 3 bytes, emoji = 4)
- RED: reading/speaking time tests
- GREEN: implementations

**Acceptance:** All 80 unit tests pass, TS strict 0 errors, no React imports anywhere.

---

### Phase 2: Hook (State + localStorage) — **domain-engineer**

**Files to implement:**
- `src/components/tools/character-counter/useCharacterCounter.ts`

**Testing:**
- Vitest: useState/useEffect simulation
- RED: localStorage persist on mount
- RED: debounce 300ms compute
- RED: copy text/metrics adapters
- GREEN: implementations

**Acceptance:** Hook tests pass, no infinite render loops, localStorage strategy matches Phase 1 domain APIs.

---

### Phase 3: Components (UI) — **ui-engineer** (2 parallel)

**3a: Core Layout & Metrics**

**Files to implement:**
- `src/components/tools/character-counter/CharacterCounter.tsx` (orchestrator, "use client")
- `src/components/tools/character-counter/CounterMetrics.tsx`
- `src/components/tools/character-counter/LimitIndicator.tsx`
- `src/components/tools/character-counter/CopyButton.tsx`
- `src/components/tools/character-counter/ClearButton.tsx`

**Testing:**
- Vitest: component render, textarea change → metrics update, limit color states
- E2E (Playwright): type text → metrics appear, paste emoji, limit color change

**Acceptance:** Responsive 320/768/1024, focus-visible rings, ≥44px tap targets, WCAG 2.1 AA, no visual regression.

**3b: SEO Sections**

**Files to implement:**
- `src/components/tools/character-counter/CounterIntro.tsx` (server)
- `src/components/tools/character-counter/CounterHowTo.tsx` (server)
- `src/components/tools/character-counter/CounterFaq.tsx` (client, owns FAQPage JSON-LD)
- `src/components/tools/character-counter/CounterStructuredData.tsx` (server, owns SoftwareApplication+Breadcrumb)

**Testing:**
- Vitest: Intro/HowTo/Faq render with i18n keys (ko/en)
- E2E: prune build output HTML → grep FAQPage/SoftwareApplication schema valid JSON, url==canonical

**Acceptance:** Both themes, ko/en, no `mounted` gate, JSON-LD valid + single-owner.

---

### Phase 4: Platform Integration — **platform-engineer**

**Files to modify:**
- `src/tools/registry.ts` (add entry)
- `src/app/[locale]/tools/[slug]/page.tsx` (add slug branches × 3)
- `src/i18n/messages/ko.json` + `en.json` (add namespace)
- `public/llms.txt` (add line)
- `.env.production` (no new secrets)

**Testing:**
- Vitest: registry import no errors
- E2E: `/[locale]/tools/character-counter` → 200, title/description from i18n, JSON-LD in HTML

**Acceptance:** All links resolve, sitemap entry auto-generated, buildToolMetadata works.

---

### Phase 5: Integration QA — **qa-integration**

**Files to verify:**
- Full `src/` tree (no dead code, all imports resolved)
- `src/app/sitemap.ts` (auto-include character-counter)
- Full E2E suite (`tests/e2e/character-counter.spec.ts` + shared surfaces)

**Acceptance Criteria:**
1. **Coverage:** Domain ≥80% (counter.ts, segmenter.ts, preset-limits.ts all covered).
2. **Visual:** 320/768/1024, light/dark themes, no CLS.
3. **Accessibility:** a11y axe scan 0 violations (textarea labeled, buttons labeled, focus visible, WCAG 2.1 AA).
4. **Persistence:** localStorage auto-restores last text + limit on reload.
5. **Keyboard:** Tab through textarea → limit presets → copy/clear buttons.
6. **i18n:** All `t()` keys exist in ko/en catalogs; zero MISSING_MESSAGE in console.
7. **SEO:** Prerendered HTML has title/description meta, hreflang, canonical, FAQPage (1 only), SoftwareApplication (1 only), all valid JSON.
8. **Performance:** Route within platform JS budget, 0 external API calls.

**Failure Gates (Hard Stop):**
- Any TS error
- Any unit test failure
- Any E2E failure (including shared surface regression)
- Missing i18n key
- Duplicate JSON-LD schema (FAQPage ×2 or SoftwareApplication ×2)
- Prerendered HTML missing SEO sections

---

## Invariants & Critical Rules

### Domain Rules (counter.ts, segmenter.ts)
1. **Grapheme counting is DETERMINISTIC:** Same text always = same count (test with emoji, combining marks, ZWJ).
2. **Fallback tested:** If Intl.Segmenter unavailable, behavior is documented + fallback graceful (console warn only).
3. **Empty text handling:** All functions return 0 on empty string; no errors.
4. **CRLF handling:** Line counting respects all line-ending types (`\r\n`, `\r`, `\n`).

### Hook Rules (useCharacterCounter.ts)
1. **Debounce is stable:** `setText` debounced 300ms; no effect infinite loops.
2. **localStorage is async-safe:** read on mount via zod; write debounced; catch quota/security errors silently.
3. **Custom limit input:** Hook parses string to number; update `limit` object only if valid; invalid → no change.

### Component Rules (*.tsx)
1. **"use client" only on CharacterCounter + CounterFaq.**
2. **Intro/HowTo/StructuredData are server components (no "use client").**
3. **SEO sections OUTSIDE mounted gate: no `if (mounted) return null` in Intro/HowTo/Faq.**
4. **JSON-LD ownership:** FAQPage only from CounterFaq; SoftwareApplication+Breadcrumb only from StructuredData.
5. **No hardcoded UI text:** All strings via `useTranslations('tools.character-counter')` (client) or `getTranslations` (server).
6. **Clipboard errors silent:** Copy handlers catch errors; no user-facing "copy failed" (optional UX).

### Platform Rules
1. **Registry entry required before route branch.**
2. **i18n keys MUST exist before component renders:** test-utils AllTheProviders includes NextIntlClientProvider with full messages.
3. **All i18n keys declared in Section 4 MUST appear in both ko.json + en.json.**
4. **Sitemap auto-includes via `getLiveTools()`; no manual entry needed.**

---

## Testing Strategy Summary

### Unit (Vitest)
- Domain: counter functions (100 tests, emoji/CRLF/byte edge cases)
- Hook: localStorage read/write/debounce (20 tests)
- Components: textarea render, metrics update, limit color states (30 tests)
- **Target:** ≥80% coverage overall, domain 100%

### E2E (Playwright)
- **Scenario 1:** Type "안녕하세요" → metrics = 5 chars, 1 word, 1 sentence
- **Scenario 2:** Paste 300 chars → set Twitter 280 → progress bar red, text "300 / 280 (OVER)"
- **Scenario 3:** Type "Hello 👋 world" → emoji = 1 grapheme; reload → text persists
- **Scenario 4:** Tab → limit buttons → copy/clear buttons (keyboard only)
- **Scenario 5:** /ko vs /en → UI text switches; localStorage shared

### Visual Regression
- 320px, 768px, 1024px breakpoints
- Light & dark themes
- Test: textarea, limit indicator, metrics card, buttons all match DESIGN.md

---

## Key Implementation Notes

### Critical Paths (MUST NOT Deviate)
1. **Grapheme counting:** ONLY via Intl.Segmenter (or fallback), never hardcoded logic.
2. **Persistence:** localStorage keys are `jurepi-char-counter-*`; consistent across deploys.
3. **Debounce:** 300ms for compute + write; no faster (perf) or slower (UX lag).
4. **Limits:** Twitter 280, Meta 160 are FIXED; no future adjustment needed at Phase 1.
5. **Copy:** Via navigator.clipboard → fallback execCommand → silent fail; never throw.

### Recommended Implementation Order
1. Domain counter functions (fastest RED/GREEN).
2. Hook (logic-heavy, pure state management).
3. Components layout + metrics card (visual, immediate feedback).
4. Limit indicator (color logic, slightest design).
5. Copy/Clear buttons (event handlers + toast).
6. SEO sections + StructuredData (server, JSON-LD).
7. Platform integration (registry, route, i18n).
8. Integration QA (full suite, visual, accessibility).

---

## Summary for Parallel Teams

| Agent | Task | Files | Blockers | Acceptance |
|-------|------|-------|----------|-----------|
| **domain-engineer** | Domain + Hook | counter.ts, segmenter.ts, preset-limits.ts, types.ts, useCharacterCounter.ts | None | TS 0, Vitest ≥80%, 0 React imports |
| **ui-engineer (2)** | Components | CharacterCounter.tsx, CounterMetrics.tsx, LimitIndicator.tsx, CopyButton.tsx, ClearButton.tsx, Intro/HowTo/Faq/StructuredData.tsx | Domain ✓ | Visual regression 320/768/1024, a11y 0 violations, i18n keys exist |
| **platform-engineer** | Registry + Route + i18n | registry.ts, [slug]/page.tsx, messages/ko/en.json, sitemap.ts, llms.txt | Domain ✓, Components ✓ | Route 200, sitemap auto-entry, buildToolMetadata works |
| **qa-integration** | Full suite | tests/e2e/, color-tokens, coverage baseline | All above ✓ | Coverage ≥80%, E2E 5 scenarios ✓, prune HTML SEO valid |

All phases parallel after Phase 1 ✓.

