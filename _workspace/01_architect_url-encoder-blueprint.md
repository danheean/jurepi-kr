# Clean-Architecture Blueprint: URL Encoder / Decoder Tool

**Author:** Architect  
**Date:** 2026-07-01  
**Tool ID:** `url-encoder`  
**Registry Slug:** `url-encoder`  
**Status:** Live  
**Accent Color:** Grape (`--accent-grape`)  
**Category:** Dev (NEW, requires platform activation)  

**SPEC Source:** `docs/services/dev/url-encoder/SPEC.md`  
**Design System:** `docs/DESIGN.md`

---

## A. Layer Decomposition: Clean Architecture 4 Layers

### Domain Layer (`src/lib/url-encoder/**`)
**Responsibility:** Pure business logic, zero React/Next/DOM imports, fully unit-testable.  
**Ownership:** `domain-engineer`

#### Files & Functions

##### 1. `schema.ts` — Input/Output Validation & Type Contracts
```typescript
// Input
interface InputSchema {
  text: string; // max 10000 chars
  direction: 'encode' | 'decode';
  mode: 'component' | 'uri';
  charset: 'utf-8' | 'euc-kr'; // default 'utf-8'
  plusAsSpace?: boolean; // for decode, legacy form-encoding
  batchMode?: boolean;
}

// Query table row
interface QueryTableRow {
  key: string;
  value: string;
}

interface QueryTableSchema {
  rows: QueryTableRow[];
}

// Encode result
interface EncodeResult {
  result?: string;
  alreadyEncodedHint: boolean; // heuristic: presence of %xx
  error?: { message: string; details: string } | null;
}

// Decode result
interface DecodeResult {
  result?: string;
  error?: { message: string; details: string } | null;
}

// Store (localStorage schema)
interface StoreRecents {
  version: number; // STORE_VERSION = 1
  recents: string[];
  meta: { createdAt: number };
}

// Validation helpers (zod-backed)
export const inputSchema = z.object({ ... });
export const queryTableSchema = z.object({ ... });
export const storeSchema = z.object({ ... });
```

**Invariants:**
- Input text max 10000 chars (enforced)
- Query table keys non-empty, values any string (immutable ops only)
- Recents max 10 entries, de-duplicated, inserted at head

---

##### 2. `charset.ts` — Codec Interface (Core Abstraction)
```typescript
/**
 * Charset codec abstraction.
 * Decoding: native TextDecoder (supports both utf-8 + euc-kr, zero dep).
 * Encoding: UTF-8 native JS; EUC-KR lazy-imports CP949 table.
 */

/**
 * Custom error for unencodable characters (EUC-KR only).
 */
export class UnencodableCharError extends Error {
  constructor(
    public char: string,
    public charCode: number,
    public charset: 'utf-8' | 'euc-kr',
  ) {
    super(
      `Character '${char}' (U+${charCode.toString(16).toUpperCase()}) ` +
      `cannot be represented in ${charset === 'euc-kr' ? 'EUC-KR/CP949' : 'UTF-8'}`
    );
    this.name = 'UnencodableCharError';
  }
}

/**
 * Parse percent-encoded bytes: "%XX" → byte value, plain ASCII → its code.
 * Returns Uint8Array of byte values.
 * Throws if sequence malformed (incomplete hex).
 */
export function parsePercentBytes(input: string): Uint8Array {
  // Manual parse: scan for %xx, validate hex, collect bytes
  // Throws on invalid (e.g., %6 without second hex digit)
  // Plain ASCII (0x20–0x7E) → direct byte value
}

/**
 * Decode bytes as the given charset.
 * UTF-8: native TextDecoder('utf-8').
 * EUC-KR: native TextDecoder('euc-kr').
 * Both are zero-dep (browser-native).
 *
 * Throws TextDecoder error (non-fatal, caught by caller) if bytes invalid for charset.
 */
export function bytesToText(bytes: Uint8Array, charset: 'utf-8' | 'euc-kr'): string {
  const decoder = new TextDecoder(charset);
  return decoder.decode(bytes); // May include replacement chars or throw
}

/**
 * Encode text to bytes under the given charset.
 * UTF-8: synchronous (native JS encodeURIComponent uses UTF-16 code units).
 * EUC-KR: ASYNC (lazy-imports CP949 forward table on first call).
 *
 * Throws UnencodableCharError if a char has no mapping in the target charset.
 */
export async function textToBytes(
  text: string,
  charset: 'utf-8' | 'euc-kr',
): Promise<Uint8Array> {
  if (charset === 'utf-8') {
    // Synchronous path: use native TextEncoder (already UTF-8)
    return Promise.resolve(new TextEncoder().encode(text));
  }
  if (charset === 'euc-kr') {
    // Lazy-load CP949 forward table, only on first EUC-KR encode
    const cp949Table = await import('./charset/cp949-encode').then(m => m.CP949_ENCODE_TABLE);
    const bytes: number[] = [];
    for (const char of text) {
      const codePoint = char.codePointAt(0)!;
      const cp949Bytes = cp949Table[codePoint];
      if (!cp949Bytes) {
        throw new UnencodableCharError(char, codePoint, 'euc-kr');
      }
      bytes.push(...cp949Bytes); // CP949 maps to 1–2 bytes per char
    }
    return new Uint8Array(bytes);
  }
  throw new Error(`Unsupported charset: ${charset}`);
}
```

**Invariant (Code-Split):** The CP949 encode table MUST be dynamically imported (async). It must NOT be included in the initial JS bundle (verified via bundle analysis in integration-qa).

---

##### 3. `encode.ts` — Encoding Logic
```typescript
/**
 * UTF-8 + Component Mode: encodeURIComponent(text).
 * Returns percent-encoded string; never throws.
 */
export function encodeComponent(text: string, charset: 'utf-8' | 'euc-kr'): Promise<string> {
  if (charset === 'utf-8') {
    return Promise.resolve(encodeURIComponent(text));
  }
  // EUC-KR: lazy-load CP949, convert bytes, then percent-escape
  return textToBytes(text, 'euc-kr').then(bytes => percentEscapeBytes(bytes, 'component'));
}

/**
 * UTF-8 + Full URI Mode: encodeURI(text).
 * Returns percent-encoded string (but with /, :, ?, #, & unencoded); never throws.
 */
export function encodeUri(text: string, charset: 'utf-8' | 'euc-kr'): Promise<string> {
  if (charset === 'utf-8') {
    return Promise.resolve(encodeURI(text));
  }
  // EUC-KR: lazy-load CP949, convert bytes, then percent-escape (different reserved set)
  return textToBytes(text, 'euc-kr').then(bytes => percentEscapeBytes(bytes, 'uri'));
}

/**
 * Heuristic: check if input contains %XX pattern (regex: /%[0-9A-Fa-f]{2}/).
 * Non-blocking warning to avoid double-encoding.
 */
export function handleAlreadyEncoded(text: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(text);
}

/**
 * Helper: convert byte array to percent-encoded string.
 * mode='component': encode all non-unreserved chars.
 * mode='uri': keep reserved chars (/, :, ?, #, &, =) unencoded.
 */
function percentEscapeBytes(bytes: Uint8Array, mode: 'component' | 'uri'): string {
  // Determine which chars stay unencoded per RFC 3986
  const unreservedChars = new Set([
    // RFC 3986 unreserved: A–Z, a–z, 0–9, -, ., _, ~
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~',
    ...(mode === 'uri' ? ':/?#[]@!$&\'()*+,;=' : []), // reserved chars for URI mode only
  ]);
  return Array.from(bytes)
    .map(b => unreservedChars.has(String.fromCharCode(b)) ? String.fromCharCode(b) : `%${b.toString(16).toUpperCase().padStart(2, '0')}`)
    .join('');
}
```

**Invariants:**
- UTF-8 encode synchronous (native JS).
- EUC-KR encode async (lazy-imports CP949 table).
- Returns string, never throws (catches UnencodableCharError, returns error object to caller).
- Component vs URI mode affects which reserved chars stay unencoded.

---

##### 4. `decode.ts` — Decoding Logic
```typescript
/**
 * UTF-8 Component: decodeURIComponent(text) with optional plusAsSpace.
 * Handles %XX → char, catches URIError on malformed.
 */
export function decodeComponent(
  text: string,
  charset: 'utf-8' | 'euc-kr' = 'utf-8',
  options: { plusAsSpace?: boolean } = {},
): DecodeResult {
  try {
    // Apply plus-as-space heuristic
    const input = options.plusAsSpace ? text.replace(/\+/g, ' ') : text;

    if (charset === 'utf-8') {
      // Native path
      return { result: decodeURIComponent(input) };
    }

    // EUC-KR: parse %XX into bytes, decode with TextDecoder('euc-kr')
    const bytes = parsePercentBytes(input);
    const result = bytesToText(bytes, 'euc-kr');
    return { result };
  } catch (e) {
    // URIError (native), TextDecoder error, or parsePercentBytes error
    return {
      error: {
        message: 'Malformed percent sequence or invalid bytes for the selected charset',
        details: extractErrorDetails(e),
      },
    };
  }
}

/**
 * UTF-8 Full URI: decodeURI(text) with optional plusAsSpace.
 */
export function decodeUri(
  text: string,
  charset: 'utf-8' | 'euc-kr' = 'utf-8',
  options: { plusAsSpace?: boolean } = {},
): DecodeResult {
  try {
    const input = options.plusAsSpace ? text.replace(/\+/g, ' ') : text;

    if (charset === 'utf-8') {
      return { result: decodeURI(input) };
    }

    const bytes = parsePercentBytes(input);
    const result = bytesToText(bytes, 'euc-kr');
    return { result };
  } catch (e) {
    return {
      error: {
        message: 'Malformed sequence or charset mismatch',
        details: extractErrorDetails(e),
      },
    };
  }
}

/**
 * Extract user-friendly error details from URIError or TextDecoder error.
 */
function extractErrorDetails(error: unknown): string {
  // Example: "URIError: URI malformed" → suggest the position and offer to retry
  // Example: "TextDecoder error" → suggest trying the other charset
  if (error instanceof URIError) {
    return `${error.message}. Check for incomplete percent sequences (e.g., %6 without second hex digit).`;
  }
  if (error instanceof UnencodableCharError) {
    return `${error.message}`;
  }
  return `${error instanceof Error ? error.message : String(error)}`;
}
```

**Invariants:**
- Never crashes on malformed input (catches errors, returns friendly message).
- plusAsSpace optional, defaults false.
- EUC-KR charset is true: if bytes invalid for EUC-KR, TextDecoder may produce replacement chars or throw.

---

##### 5. `query-parser.ts` — Query String Immutable Ops
```typescript
/**
 * Parse query string into rows. Handles ?, leading &, trailing &.
 */
export function parseQueryString(input: string): QueryTableRow[] {
  let clean = input.trim();
  if (clean.startsWith('?')) clean = clean.slice(1);
  if (!clean) return [];

  return clean
    .split('&')
    .filter(pair => pair.length > 0)
    .map(pair => {
      const [key, ...valueParts] = pair.split('=');
      return {
        key: decodeURIComponent(key),
        value: valueParts.join('=').length > 0 ? decodeURIComponent(valueParts.join('=')) : '',
      };
    });
}

/**
 * Serialize rows back to query string.
 * Applies encoding based on mode/charset.
 */
export function serializeQueryTable(
  rows: QueryTableRow[],
  mode: 'component' | 'uri' = 'component',
  charset: 'utf-8' | 'euc-kr' = 'utf-8',
): Promise<string> {
  // Map rows: key=value, then join with &
  // Each key/value encoded with the selected encode function
  const encoded = rows.map(async row => {
    const encodedKey = await (mode === 'component' 
      ? encodeComponent(row.key, charset) 
      : encodeUri(row.key, charset));
    const encodedValue = await (mode === 'component' 
      ? encodeComponent(row.value, charset) 
      : encodeUri(row.value, charset));
    return `${encodedKey}=${encodedValue}`;
  });
  return Promise.all(encoded).then(pairs => pairs.join('&'));
}

/**
 * Edit a row: immutable update.
 */
export function editRow(
  rows: QueryTableRow[],
  index: number,
  newKey: string,
  newValue: string,
): QueryTableRow[] {
  if (index < 0 || index >= rows.length) return rows;
  return [
    ...rows.slice(0, index),
    { key: newKey, value: newValue },
    ...rows.slice(index + 1),
  ];
}

/**
 * Delete a row by index.
 */
export function deleteRow(rows: QueryTableRow[], index: number): QueryTableRow[] {
  if (index < 0 || index >= rows.length) return rows;
  return [...rows.slice(0, index), ...rows.slice(index + 1)];
}

/**
 * Add a new empty row.
 */
export function addRow(rows: QueryTableRow[]): QueryTableRow[] {
  return [...rows, { key: '', value: '' }];
}
```

**Invariants:**
- All ops return new arrays (immutable).
- Serialization is async (delegates to encode functions, which may lazy-load CP949).
- Decoding in parse: use native decodeURIComponent(utf-8 only); EUC-KR decode handled separately by caller if needed.

---

##### 6. `recents.ts` — localStorage Persistence Ops
```typescript
/**
 * Add a recent input to the front of the list.
 * De-duplicate (remove if already present), then prepend.
 * Truncate to max.
 */
export function pushRecent(
  list: string[],
  text: string,
  max: number = 10,
): string[] {
  const cleaned = list.filter(item => item !== text);
  return [text, ...cleaned].slice(0, max);
}

/**
 * Prune unknown/invalid entries (e.g., after zod validation fails).
 * Fail-gracefully: if list is empty or undefined, return [].
 */
export function pruneUnknown(list: unknown[]): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter(item => typeof item === 'string' && item.length > 0);
}

/**
 * Serialize/deserialize with zod.
 */
export function serializeRecents(recents: string[]): string {
  return JSON.stringify(recents);
}

export function deserializeRecents(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return storeSchema.parse(parsed).recents;
  } catch {
    return []; // Invalid JSON or schema → start fresh, no throw
  }
}
```

**Invariants:**
- localStorage key: `jurepi-url-encoder` (hardcoded, per SPEC).
- Reads always zod-parsed; fail gracefully (no throw).
- De-duplication on push; pruning on load.

---

##### 7. `unicode.ts` — Test Helpers (Unit Test Only)
```typescript
/**
 * UTF-8 round-trip test vectors.
 * Emoji, CJK, accented chars.
 */
export const UTF8_ROUND_TRIP_VECTORS = [
  { text: 'hello world', expected: 'hello%20world' },
  { text: '안녕', expected: '%EC%95%88%EB%85%95' },
  { text: '😊', expected: '%F0%9F%98%8A' },
  { text: 'café', expected: 'caf%C3%A9' },
  // ... more test cases
];

/**
 * EUC-KR round-trip test vectors.
 * Hangul, CP949-supported CJK.
 */
export const EUCKR_ROUND_TRIP_VECTORS = [
  { text: '한글', expected: '%C7%D1%B1%DB' },
  { text: 'hello', expected: 'hello' }, // ASCII charset-agnostic
  // ... more test cases
];

/**
 * Unrepresentable char tests (EUC-KR encode only).
 */
export const EUCKR_UNREPRESENTABLE = [
  { text: '😊', charCode: 0x1F60A }, // Emoji
  // ... more cases
];
```

---

##### 8. `charset/cp949-encode.ts` — CP949 Forward Table (Dynamically Imported)
```typescript
/**
 * CP949 (EUC-KR) forward encoding map.
 * Maps Unicode code point → CP949 byte(s).
 * Lazy-imported only when user encodes to EUC-KR.
 *
 * Source: Candidates include `cptable` from js-codepage or similar.
 * Wrapped here so swappable; must be <80KB gzipped to avoid inflating bundle.
 *
 * Type: Record<number, number[]>
 *   Key: Unicode code point (e.g., 0xC5F0 for '한').
 *   Value: CP949 bytes as array (1–2 elements for most chars).
 */
export const CP949_ENCODE_TABLE: Record<number, number[]> = {
  // Populated at build time or imported from a precomputed JSON
  // Example: 0xC5F0 → [0xC7, 0xD1] (한글의 한)
  // All CP949-mappable Unicode points included.
};
```

**Code-Split Invariant:** This file is **dynamically imported via `await import()`** and MUST NOT be bundled into the initial JS chunk. Bundle analysis (integration-qa) verifies it loads separately.

---

### Usecase / Adapter Layer (`src/components/tools/url-encoder/useUrlEncoder.ts`)
**Responsibility:** React hook; owns localStorage persistence, in-memory fallback, dispatch logic, clipboard adapter.  
**Ownership:** `ui-engineer`

#### Hook Signature
```typescript
interface UseUrlEncoderState {
  text: string;
  direction: 'encode' | 'decode';
  mode: 'component' | 'uri';
  charset: 'utf-8' | 'euc-kr';
  plusAsSpace: boolean;
  batchMode: boolean;
  queryTableRows: QueryTableRow[];
  queryTableInput: string; // raw input for table parsing
  result: string | null;
  error: { message: string; details: string } | null;
  alreadyEncodedHint: boolean;
  recents: string[];
  isLoading: boolean; // true while EUC-KR encode table loading
}

interface UseUrlEncoderActions {
  setText(text: string): void;
  setDirection(dir: 'encode' | 'decode'): void;
  setMode(mode: 'component' | 'uri'): void;
  setCharset(charset: 'utf-8' | 'euc-kr'): void;
  setPlusAsSpace(value: boolean): void;
  setBatchMode(value: boolean): void;
  setQueryTableRows(rows: QueryTableRow[]): void;
  setQueryTableInput(input: string): void;
  
  process(): Promise<void>; // encode/decode dispatcher
  addRecent(text: string): void; // push to recents
  clearRecents(): void;
  
  copyResult(): Promise<boolean>; // returns true if successful
  clearAll(): void;
}

export function useUrlEncoder(): [UseUrlEncoderState, UseUrlEncoderActions] {
  // localStorage: recover recents + charset on mount
  // Charset persists per-session (localStorage key `jurepi-url-encoder-charset`)
  // process(): async dispatch to encode/decode (handles EUC-KR lazy-load)
  // clipboard: navigator.clipboard.writeText → fallback to hidden textarea → silent fail
}
```

**Key Points:**
1. **localStorage isolation:** `jurepi-url-encoder` for recents; `jurepi-url-encoder-charset` for current charset.
2. **In-memory fallback:** If localStorage unavailable (private mode), all state is session-only (no persistence).
3. **Async encode/decode:** EUC-KR encode may lazy-load CP949 table; UI shows no blocking spinner (resolves quickly on first load).
4. **Clipboard adapter:** `writeText` with hidden textarea fallback; silent fail (not critical).
5. **Batch processing:** Split input by `\n`, encode/decode each line, rejoin with `\n`.

---

### Presentation Layer (UI Components)
**Responsibility:** React Client Components; render state + dispatch actions, zero business logic.  
**Ownership:** `ui-engineer`

#### Component Tree (from SPEC `<component_hierarchy>`)

```
UrlEncoder (Client Component, owns state via useUrlEncoder())
├── UrlEncoderIntro (H1 + lead, SSR-safe)
├── EncoderLayout (2-col desktop / stack mobile)
│   ├── EncoderMain (left/top column)
│   │   ├── ModeToggle (Component / Full URI radio)
│   │   ├── CharsetToggle (UTF-8 / EUC-KR segmented control)
│   │   ├── DirectionToggle (Encode ↔ Decode button)
│   │   ├── TextInput (main input field, expands for batch)
│   │   ├── BatchToggle (enable multi-line)
│   │   └── PlusAsSpaceToggle (for decode, legacy form-encoding)
│   └── EncoderResult (right/bottom column, sticky on desktop)
│       ├── ResultOutput (encoded/decoded result + copy button + toast)
│       └── AlreadyEncodedWarning (if heuristic triggered)
├── QueryTableView (tab / toggle)
│   ├── QueryTableEditor (rows with key/value inputs)
│   ├── AddRowButton
│   ├── DeleteRowButtons
│   └── RebuildUrlButton
├── RecentsList (dropdown / side-drawer)
├── UrlEncoderHowTo (SEO long-form: "What is URL encoding?", Component vs Full URI, UTF-8 vs EUC-KR)
└── UrlEncoderFaq (FAQPage JSON-LD + FAQ items)
```

#### Key Components (Brief Signatures)

**UrlEncoder.tsx** (Client Component, main orchestrator)
```typescript
export function UrlEncoder(): React.ReactElement {
  const [state, actions] = useUrlEncoder();
  // Render layout, bind state ↔ actions
  // Mount outside `mounted` gate (SSR-safe intro/how-to/faq)
  // Keyboard shortcuts: "/" (focus input), "r" (recents), "e" (toggle direction), etc.
}
```

**ModeToggle.tsx**
```typescript
interface Props {
  value: 'component' | 'uri';
  onChange: (mode: 'component' | 'uri') => void;
}
export function ModeToggle({ value, onChange }: Props): React.ReactElement {
  // Radio or tabs: Component (encodes /, :, ?, # etc.) vs Full URI (keeps them)
  // Inline help explaining the difference
  // Accent: grape (var(--accent-grape))
}
```

**CharsetToggle.tsx**
```typescript
interface Props {
  value: 'utf-8' | 'euc-kr';
  onChange: (charset: 'utf-8' | 'euc-kr') => void;
  isLoading?: boolean; // true while CP949 table loading
}
export function CharsetToggle({ value, onChange, isLoading }: Props): React.ReactElement {
  // Segmented control: UTF-8 (default) vs EUC-KR
  // Inline help: "Choose EUC-KR for legacy Korean URLs from older sites."
  // Keyboard shortcut: "u" toggles
  // Accent: grape
}
```

**TextInput.tsx**
```typescript
interface Props {
  value: string;
  onChange: (text: string) => void;
  batchMode: boolean;
  maxLength: number; // 10000
}
export function TextInput({ value, onChange, batchMode, maxLength }: Props): React.ReactElement {
  // Single-line input (default) or textarea (if batchMode)
  // Placeholder: "텍스트 또는 URL을 붙여넣으세요…" / "Paste URL or text here…"
  // Character counter (current / max), warn at 80%
  // aria-label, aria-describedby for hints
}
```

**ResultOutput.tsx**
```typescript
interface Props {
  result: string | null;
  error?: { message: string; details: string } | null;
  onCopy: () => Promise<boolean>;
}
export function ResultOutput({ result, error, onCopy }: Props): React.ReactElement {
  // Display result in read-only monospace block (var(--surface-muted))
  // Copy button → toast "✓ Copied" (1600ms) or silent fail
  // Error card with details + suggestion (if error)
}
```

**QueryTableView.tsx**
```typescript
interface Props {
  rows: QueryTableRow[];
  rawInput: string;
  onRowsChange: (rows: QueryTableRow[]) => void;
  onInputChange: (input: string) => void;
  onRebuild: () => Promise<void>;
  isLoading?: boolean;
}
export function QueryTableView({
  rows,
  rawInput,
  onRowsChange,
  onInputChange,
  onRebuild,
  isLoading,
}: Props): React.ReactElement {
  // Parse input → rows (key/value table)
  // Edit rows in-place
  // Rebuild button → serialize rows, copy to clipboard
}
```

**UrlEncoderHowTo.tsx** (SSR-safe)
```typescript
export function UrlEncoderHowTo(): React.ReactElement {
  // H2 "What is URL encoding?" / "URL 인코딩이란?"
  // Explain Component vs Full URI modes with examples
  // "UTF-8 vs EUC-KR for legacy Korean URLs"
  // NOT wrapped in mounted gate (AI crawlers need this)
}
```

**UrlEncoderFaq.tsx** (SSR-safe)
```typescript
export function UrlEncoderFaq(): React.ReactElement {
  // FAQ items (ko/en from i18n)
  // Renders FAQPage JSON-LD at component level
  // NOT wrapped in mounted gate
}
```

---

### Framework / Integration Layer
**Responsibility:** Next.js routing, i18n, SEO metadata, registry wiring, error boundary.  
**Ownership:** `platform-engineer` + `seo-geo-engineer`

#### 1. Registry Entry (CRITICAL: Not Yet in Code)
**File:** `src/tools/registry.ts` — ADD this entry to the `tools[]` array:

```typescript
{
  id: 'url-encoder',
  slug: 'url-encoder',
  category: 'dev',
  icon: 'Link',
  accent: 'grape',
  status: 'live',
  isNew: true,
  order: 20,
  keywords: [
    'URL', '인코딩', '디코딩', 'encode', 'decode', '%20', 'percent',
    'query', 'parameter', '쿼리', '매개변수', 'EUC-KR', 'euckr', 'CP949',
    '한글', 'UTF-8', 'charset', '개발', 'developer', 'tool'
  ],
}
```

#### 2. i18n Keys Contract (CRITICAL: New Keys)
**File:** `src/i18n/messages/ko.json` — ADD these keys:

```json
{
  "categories": {
    "dev": "개발 도구"
  },
  "tools": {
    "url-encoder": {
      "title": "URL 인코더",
      "description": "URL을 인코딩·디코딩하고 쿼리 문자열을 편집하세요. UTF-8과 EUC-KR(레거시 한국어 URL)을 지원합니다.",
      "lead": "URL 텍스트를 인코딩·디코딩하고, 쿼리 매개변수를 편집하세요. 컴포넌트/전체 URI 모드와 UTF-8·EUC-KR 문자셋(레거시 한국어 URL)을 즉시 전환하세요.",
      
      "mode": {
        "label": "모드",
        "component": {
          "label": "컴포넌트",
          "help": "쿼리 매개변수 & 조각. 특수문자(<, >, &, :, /) 등이 인코딩됩니다."
        },
        "uri": {
          "label": "전체 URI",
          "help": "완전한 URL. /, :, ?, & 등 URL 구조 문자는 유지됩니다."
        }
      },
      
      "direction": {
        "label": "방향",
        "encode": "인코딩",
        "decode": "디코딩",
        "toggle": "방향 전환"
      },
      
      "charset": {
        "label": "문자셋",
        "utf8": "UTF-8",
        "euckr": "EUC-KR (CP949)",
        "help": "대부분의 최신 URL은 UTF-8입니다. 구형 한국 사이트의 URL은 EUC-KR을 선택하세요."
      },
      
      "batch": {
        "label": "일괄 처리",
        "help": "여러 줄을 한 번에 처리하려면 켜세요."
      },
      
      "plusAsSpace": {
        "label": "+ 를 공백으로 치환",
        "help": "레거시 form-encoding (application/x-www-form-urlencoded)"
      },
      
      "input": {
        "placeholder": "텍스트 또는 URL을 붙여넣으세요…",
        "aria": "URL 또는 텍스트 입력"
      },
      
      "output": {
        "aria": "인코딩/디코딩 결과",
        "copyButton": "결과 복사",
        "copied": "복사되었습니다",
        "copyFail": "복사 실패 (브라우저 설정 확인)"
      },
      
      "alreadyEncoded": {
        "hint": "이 텍스트는 이미 인코딩된 것으로 보입니다. 다시 인코딩하면 중복 인코딩될 수 있습니다.",
        "proceed": "그래도 인코딩",
        "cancel": "취소"
      },
      
      "queryTable": {
        "label": "쿼리 문자열 편집기",
        "parsePrompt": "쿼리 문자열을 붙여넣거나 아래에서 매개변수를 추가하세요.",
        "emptyState": "매개변수가 없습니다.",
        "keyPlaceholder": "매개변수 이름",
        "valuePlaceholder": "값",
        "addRow": "매개변수 추가",
        "deleteRow": "삭제",
        "rebuild": "쿼리 문자열 재구성"
      },
      
      "recents": {
        "label": "최근 입력",
        "clear": "최근 항목 지우기",
        "empty": "최근 입력이 없습니다."
      },
      
      "errors": {
        "malformedSequence": "잘못된 퍼센트 시퀀스",
        "malformedDetails": "불완전한 16진수 시퀀스를 확인하세요 (예: %6은 두 자리 숫자가 아님).",
        "charsetMismatch": "이 바이트는 선택한 문자셋에서 유효하지 않습니다.",
        "charsetMismatchDetails": "URL이 실제로 다른 인코딩을 사용하는지 확인하세요.",
        "unencodableChar": "'{char}'은(는) {charset}으로 표현할 수 없습니다.",
        "unencodableCharDetails": "UTF-8로 전환하거나 이 문자를 제거하세요.",
        "tableLoadFailed": "EUC-KR 인코더를 불러올 수 없습니다. 연결을 확인하고 다시 시도하세요.",
        "inputTooLong": "입력이 너무 깁니다 (최대 10,000자)."
      },
      
      "shortcuts": {
        "help": "키보드 단축키",
        "focus": "/ — 입력창 포커스",
        "toggleRecents": "r — 최근 항목 토글",
        "toggleDirection": "e — 인코딩/디코딩 전환",
        "toggleMode": "c — 컴포넌트/전체 URI 전환",
        "toggleCharset": "u — UTF-8/EUC-KR 전환",
        "toggleBatch": "b — 일괄 처리 전환",
        "process": "Enter — 인코딩/디코딩 실행",
        "clear": "Esc — 입력 지우기"
      },
      
      "howTo": {
        "heading": "URL 인코더 사용 방법",
        "whatIs": {
          "title": "URL 인코딩이란?",
          "body": "URL 인코딩은 특수문자를 '%'로 시작하는 16진수 시퀀스로 변환하는 방식입니다. 예: 공백은 %20, &는 %26이 됩니다. 이렇게 하면 URL에서 안전하게 텍스트를 전달할 수 있습니다."
        },
        "componentVsUri": {
          "title": "컴포넌트 vs 전체 URI",
          "body": "컴포넌트 모드는 쿼리 매개변수나 해시 조각을 인코딩할 때 쓰입니다 (/, :, ?도 인코딩). 전체 URI 모드는 완전한 URL을 인코딩할 때 쓰입니다 (/, :, ? 등은 유지됨)."
        },
        "utf8VsEuckr": {
          "title": "UTF-8 vs EUC-KR",
          "body": "대부분의 최신 웹사이트와 시스템은 UTF-8을 사용합니다. 하지만 오래된 한국 사이트나 레거시 시스템은 EUC-KR(CP949)을 사용할 수 있습니다. 예: %C7%D1은 UTF-8으로는 잘못된 시퀀스이지만, EUC-KR로 디코딩하면 '한'이 됩니다."
        }
      },
      
      "faq": {
        "items": [
          {
            "q": "URL 인코딩은 왜 필요한가요?",
            "a": "URL의 특정 문자(공백, &, %, 등)는 특별한 의미를 가집니다. 이들을 인코딩하면 URL에서 안전하게 데이터를 전달할 수 있습니다."
          },
          {
            "q": "컴포넌트 모드와 전체 URI 모드의 차이는?",
            "a": "컴포넌트 모드는 ?name=hello&age=30에서 hello와 30처럼 URL 파라미터 값을 인코딩할 때 쓰입니다. 전체 URI 모드는 https://example.com/path?a=1 전체를 인코딩하면서도 URL 구조(/, :, ?)는 유지합니다."
          },
          {
            "q": "EUC-KR이란?",
            "a": "EUC-KR(Extended Unix Code for Korean)은 한글을 인코딩하는 방식으로, CP949로도 불립니다. 2000년대 초반의 한국 웹사이트들이 많이 사용했습니다."
          },
          {
            "q": "이미 인코딩된 텍스트를 다시 인코딩하면?",
            "a": "중복 인코딩됩니다. 예: %20을 다시 인코딩하면 %2520이 됩니다. 이 도구는 %xx 패턴이 보이면 경고를 보여줍니다."
          },
          {
            "q": "쿼리 문자열 편집기는 뭐하는 건가요?",
            "a": "?name=Alice&age=30처럼 쿼리 문자열을 파싱해서 테이블로 보여줍니다. 값을 수정하고 '쿼리 문자열 재구성'을 누르면 인코딩된 결과를 얻을 수 있습니다."
          },
          {
            "q": "나의 입력 데이터는 어디에 저장되나요?",
            "a": "모두 브라우저의 로컬에서만 처리됩니다. 네트워크로 전송되거나 서버에 저장되지 않습니다. 최근 입력 10개만 localStorage에 저장되며, 언제든 지울 수 있습니다."
          }
        ]
      },
      
      "meta": {
        "title": "URL 인코더 / 디코더 — 무료 온라인 도구",
        "description": "URL 텍스트를 인코딩·디코딩하세요. UTF-8과 EUC-KR(CP949) 문자셋을 지원합니다. 쿼리 매개변수 편집, 일괄 처리, 최근 입력 저장."
      }
    }
  }
}
```

**File:** `src/i18n/messages/en.json` — ADD English equivalents (parallel structure).

#### 3. Route & Dynamic Import
**File:** `src/app/[locale]/tools/[slug]/page.tsx` — ADD branch for url-encoder:

```typescript
// At top, add dynamic import
const UrlEncoder = dynamic(() =>
  import('@/components/tools/url-encoder/UrlEncoder').then((m) => ({
    default: m.UrlEncoder,
  }))
);

// In generateMetadata(), add case:
if (slug === 'url-encoder') {
  title = t('title');
  description = t('description');
}

// In ToolContent(), add case:
if (slug === 'url-encoder') {
  return <UrlEncoder />;
}
```

#### 4. Platform Prerequisite: Activate `'dev'` Category
**CRITICAL — Must be done BEFORE url-encoder goes live:**

**A. i18n messages** — add key to both ko.json and en.json:
```json
"categories": {
  "dev": "개발 도구"  // ko
  "dev": "Developer" // en
}
```

**B. Category ordering** — `src/lib/tool-search.ts`, update `CATEGORY_ORDER`:
```typescript
const CATEGORY_ORDER: Array<ToolCategory | 'all'> = [
  'all',
  'random',
  'calculator',
  'text',
  'converter',
  'fun',
  'mindset',
  'dev',  // ADD THIS
];
```

**C. Footer categories** — `src/components/layout/Footer.tsx`, update `FOOTER_CATEGORIES`:
```typescript
const FOOTER_CATEGORIES = ['random', 'calculator', 'text', 'converter', 'fun', 'mindset', 'dev'] as const;
```

**D. Accent mapping** — ensure `'dev'` is assigned to `'grape'` in any accent-color mapping (verify in `design-system-fidelity` if needed).

#### 5. SEO / JSON-LD
**Handled by:** `seo-geo-engineer` + `platform-engineer` (call `lib/seo.ts`).

**Contract:** Tool-specific sections must be SSR-safe (outside `mounted` gate):
- UrlEncoderIntro (H1 + lead)
- UrlEncoderHowTo (long-form content)
- UrlEncoderFaq (with FAQPage JSON-LD)
- SoftwareApplication JSON-LD (rendered at component level)

**Metadata:** `buildToolMetadata({ locale, slug, title, description })` → handles canonical, hreflang, OG.

---

## B. Dependency Rules & Charset Abstraction Contract

### Clean Architecture: Dependency Rule
**Invariant:** Source dependencies flow inward only (domain ← usecase ← adapter ← framework).

```
Framework (Next.js routing, i18n, SEO)
    ↓ depends on
Adapter (React components, UrlEncoder.tsx, useUrlEncoder hook)
    ↓ depends on
Domain (encode.ts, decode.ts, charset.ts, query-parser.ts, recents.ts, schema.ts)
    ↓ depends on
Nothing (pure TS, no external deps except zod for schema)
```

### The Charset Abstraction

**Why:** Isolate UTF-8 (fast, native) from EUC-KR (lazy-loaded CP949 table) so each path is independently testable and the CP949 table never pollutes the default bundle.

**Core Abstraction:** `charset.ts` defines the codec interface. `encode.ts` / `decode.ts` delegate non-UTF-8 to this interface.

**Async Invariant:** `textToBytes(text, 'euc-kr')` is async. This is non-negotiable:
- UTF-8 path: `Promise.resolve(new TextEncoder().encode(text))` (immediate).
- EUC-KR path: `await import('./charset/cp949-encode')` (lazy), then map chars to CP949 bytes.

**Error Handling:** `UnencodableCharError` (typed) for chars not in CP949. Never silently corrupts; always surfaces the error to the UI.

**Testing Contract:**
- Unit: Encode/decode UTF-8 all modes/directions (sync).
- Unit: Encode/decode EUC-KR all modes/directions (async, mock CP949 table for speed).
- Unit: Round-trip `'한글' ↔ '%C7%D1%B1%DB'` (EUC-KR).
- Unit: `UnencodableCharError` on emoji (EUC-KR encode).
- Unit: `TextDecoder` error on invalid bytes (EUC-KR decode).
- Bundle: Verify `charset/cp949-encode.ts` is NOT in initial chunk (via `source-map-explorer` or esbuild analysis).

---

## C. i18n Key CONTRACT (Frozen Before UI/Platform Start)

**File Locations:** 
- `src/i18n/messages/ko.json` (Korean)
- `src/i18n/messages/en.json` (English)

**Namespace:** `tools.url-encoder.*`

### Complete Key List (Partial, See Section A-2 for Full)

**Top-Level Keys (consumed by registry/home-card/footer/search):**
```
tools.url-encoder.title          // "URL 인코더" / "URL Encoder"
tools.url-encoder.description    // "URL을 인코딩·디코딩하고…" / "Encode…"
```

**UI Chrome:**
```
tools.url-encoder.mode.label                      // "모드" / "Mode"
tools.url-encoder.mode.component.label            // "컴포넌트" / "Component"
tools.url-encoder.mode.component.help             // "쿼리 매개변수…" / "Query params…"
tools.url-encoder.mode.uri.label                  // "전체 URI" / "Full URI"
tools.url-encoder.mode.uri.help                   // "/, :, ? 유지" / "Reserved chars unencoded"

tools.url-encoder.direction.label                 // "방향" / "Direction"
tools.url-encoder.direction.encode                // "인코딩" / "Encode"
tools.url-encoder.direction.decode                // "디코딩" / "Decode"
tools.url-encoder.direction.toggle                // "방향 전환" / "Toggle"

tools.url-encoder.charset.label                   // "문자셋" / "Charset"
tools.url-encoder.charset.utf8                    // "UTF-8"
tools.url-encoder.charset.euckr                   // "EUC-KR (CP949)"
tools.url-encoder.charset.help                    // "대부분의 최신 URL은…" / "Most modern URLs…"

tools.url-encoder.batch.label                     // "일괄 처리" / "Batch"
tools.url-encoder.batch.help                      // "여러 줄을…" / "Process multiple lines…"

tools.url-encoder.plusAsSpace.label               // "+ 를 공백으로 치환" / "Treat + as space"
tools.url-encoder.plusAsSpace.help                // "레거시 form-encoding…" / "Legacy form-encoding…"

tools.url-encoder.input.placeholder               // "텍스트 또는 URL을…" / "Paste URL or text…"
tools.url-encoder.input.aria                      // "URL 또는 텍스트 입력" / "URL or text input"

tools.url-encoder.output.aria                     // "인코딩/디코딩 결과" / "Encoding/decoding result"
tools.url-encoder.output.copyButton               // "결과 복사" / "Copy result"
tools.url-encoder.output.copied                   // "복사되었습니다" / "Copied"

tools.url-encoder.alreadyEncoded.hint             // "이 텍스트는…" / "This text looks…"
tools.url-encoder.alreadyEncoded.proceed          // "그래도 인코딩" / "Encode anyway"
tools.url-encoder.alreadyEncoded.cancel           // "취소" / "Cancel"

tools.url-encoder.queryTable.label                // "쿼리 문자열 편집기" / "Query String Editor"
tools.url-encoder.queryTable.parsePrompt          // "쿼리 문자열을…" / "Paste a query string…"
tools.url-encoder.queryTable.emptyState           // "매개변수가 없습니다" / "No parameters"
tools.url-encoder.queryTable.keyPlaceholder       // "매개변수 이름" / "Parameter name"
tools.url-encoder.queryTable.valuePlaceholder     // "값" / "Value"
tools.url-encoder.queryTable.addRow               // "매개변수 추가" / "Add parameter"
tools.url-encoder.queryTable.deleteRow            // "삭제" / "Delete"
tools.url-encoder.queryTable.rebuild              // "쿼리 문자열 재구성" / "Rebuild query string"

tools.url-encoder.recents.label                   // "최근 입력" / "Recent inputs"
tools.url-encoder.recents.clear                   // "최근 항목 지우기" / "Clear recents"
tools.url-encoder.recents.empty                   // "최근 입력이 없습니다" / "No recent inputs"
```

**Errors (All Must Exist):**
```
tools.url-encoder.errors.malformedSequence        // "잘못된 퍼센트 시퀀스" / "Malformed percent sequence"
tools.url-encoder.errors.malformedDetails         // "불완전한 16진수…" / "Incomplete hex…"
tools.url-encoder.errors.charsetMismatch          // "이 바이트는…" / "These bytes aren't…"
tools.url-encoder.errors.charsetMismatchDetails   // "URL이 실제로…" / "The URL may actually…"
tools.url-encoder.errors.unencodableChar          // "'{char}'은…" / "Character '{char}'…"
tools.url-encoder.errors.unencodableCharDetails   // "UTF-8로 전환…" / "Switch to UTF-8…"
tools.url-encoder.errors.tableLoadFailed          // "EUC-KR 인코더를…" / "Couldn't load EUC-KR…"
tools.url-encoder.errors.inputTooLong             // "입력이 너무…" / "Input too long…"
```

**Keyboard Shortcuts:**
```
tools.url-encoder.shortcuts.help                  // "키보드 단축키" / "Keyboard shortcuts"
tools.url-encoder.shortcuts.focus                 // "/ — 입력창…" / "/ — Focus input"
tools.url-encoder.shortcuts.toggleRecents         // "r — 최근 항목…" / "r — Toggle recents"
tools.url-encoder.shortcuts.toggleDirection       // "e — 인코딩/디코딩…" / "e — Toggle direction"
tools.url-encoder.shortcuts.toggleMode            // "c — 컴포넌트/전체…" / "c — Toggle mode"
tools.url-encoder.shortcuts.toggleCharset         // "u — UTF-8/EUC-KR…" / "u — Toggle charset"
tools.url-encoder.shortcuts.toggleBatch           // "b — 일괄 처리…" / "b — Toggle batch"
tools.url-encoder.shortcuts.process               // "Enter — 인코딩/디코딩…" / "Enter — Process"
tools.url-encoder.shortcuts.clear                 // "Esc — 입력 지우기" / "Esc — Clear input"
```

**SEO Long-Form:**
```
tools.url-encoder.howTo.heading                   // "URL 인코더 사용 방법" / "How to use URL Encoder"
tools.url-encoder.howTo.whatIs.title              // "URL 인코딩이란?" / "What is URL encoding?"
tools.url-encoder.howTo.whatIs.body               // (multi-line explanation)
tools.url-encoder.howTo.componentVsUri.title      // "컴포넌트 vs 전체 URI" / "Component vs Full URI"
tools.url-encoder.howTo.componentVsUri.body       // (explanation)
tools.url-encoder.howTo.utf8VsEuckr.title         // "UTF-8 vs EUC-KR" / "UTF-8 vs EUC-KR"
tools.url-encoder.howTo.utf8VsEuckr.body          // (explanation with example)

tools.url-encoder.faq.items                       // Array of { q, a } objects (i18n-embedded)
```

**Metadata:**
```
tools.url-encoder.meta.title                      // "URL 인코더 / 디코더 — 무료…" / "URL Encoder / Decoder…"
tools.url-encoder.meta.description                // "URL 텍스트를…" / "Encode and decode…"
```

**INVARIANT:** All keys listed above MUST exist in both ko.json and en.json BEFORE ui-engineer and platform-engineer start work in parallel. Missing keys = build failure or layout corruption.

---

## D. `'dev'` Category Activation Steps

**CRITICAL:** The `'dev'` category exists in the `ToolCategory` type union but is NOT YET WIRED. Before url-encoder goes live, complete these EXACT steps in EXACT order:

### Step 1: i18n Messages
**File:** `src/i18n/messages/ko.json`
```json
{
  "categories": {
    "all": "전체",
    "random": "랜덤/추첨",
    "calculator": "계산기",
    "text": "텍스트",
    "converter": "변환",
    "fun": "재미",
    "mindset": "마음·기록",
    "dev": "개발 도구"
  }
}
```

**File:** `src/i18n/messages/en.json`
```json
{
  "categories": {
    "all": "All",
    "random": "Random/Picks",
    "calculator": "Calculator",
    "text": "Text",
    "converter": "Converter",
    "fun": "Fun",
    "mindset": "Mind & Record",
    "dev": "Developer"
  }
}
```

### Step 2: Category Order
**File:** `src/lib/tool-search.ts`
```typescript
const CATEGORY_ORDER: Array<ToolCategory | 'all'> = [
  'all',
  'random',
  'calculator',
  'text',
  'converter',
  'fun',
  'mindset',
  'dev',  // ADD THIS LINE
];
```

### Step 3: Footer Categories
**File:** `src/components/layout/Footer.tsx`
```typescript
const FOOTER_CATEGORIES = [
  'random',
  'calculator',
  'text',
  'converter',
  'fun',
  'mindset',
  'dev',  // ADD THIS LINE
] as const;
```

### Step 4: Verify Accent Mapping
The `'dev'` category is assigned accent `'grape'` at registry entry level (no global mapping needed). Verify no override exists in design-system-fidelity or build scripts.

**Verification Commands:**
```bash
# 1. Ensure 'dev' is in ToolCategory union
grep -n "type ToolCategory" src/tools/types.ts
# Output should include 'dev'

# 2. Check all three files have 'dev' added
grep -r "categories.dev\|'dev'" src/i18n/messages/ src/lib/tool-search.ts src/components/layout/Footer.tsx

# 3. Build test
pnpm build
# Should succeed without errors
```

---

## E. SEO / GEO Prerender Invariant

**CRITICAL:** AI crawlers (ChatGPT, Perplexity, Gemini, etc.) do NOT execute JavaScript. All SEO content MUST render outside the `mounted` gate.

### SSR-Safe Components (NO `mounted` gate):
1. **UrlEncoderIntro** — H1 + lead paragraph
2. **UrlEncoderHowTo** — "What is URL encoding?", "Component vs Full URI", "UTF-8 vs EUC-KR"
3. **UrlEncoderFaq** — FAQ items + FAQPage JSON-LD
4. **SoftwareApplication JSON-LD** — rendered at component top level

### Client-Side-Only Components (INSIDE `mounted` gate, if needed):
- Interactive state (mode/charset/direction toggles, text input)
- localStorage recents
- Clipboard operations
- Real-time results

### JSON-LD Types
**SoftwareApplication** (top-level):
```typescript
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "URL Encoder",
  "url": "https://jurepi.kr/ko/tools/url-encoder",
  "applicationCategory": "UtilityApplication",
  "description": "URL을 인코딩·디코딩하고…",
  "inLanguage": "ko-KR",
  "operatingSystem": "Any",
  "softwareVersion": "1.0",
  "creator": { "@type": "Organization", "name": "Jurepi" }
}
```

**FAQPage** (in UrlEncoderFaq):
```typescript
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "URL 인코딩이란?",
      "acceptedAnswer": { "@type": "Answer", "text": "..." }
    },
    // ... more Q&A items
  ]
}
```

**Verification:**
- `pnpm build` → check `.next/out/[locale]/tools/url-encoder/index.html` for H1, FAQ content, JSON-LD (all present in static HTML, not wrapped in `<script>`)
- `curl https://jurepi.kr/ko/tools/url-encoder | grep "URL 인코더"` → should match title
- `curl ... | grep "FAQPage"` → should find JSON-LD

---

## F. Build Order & Task Split

### Phase 1: Domain Layer (All Pure TS, Zero React)
**Owner:** `domain-engineer`  
**Duration:** ~1–2 days  
**Completion Criteria:** Vitest ≥90%, TS 0 errors, <800 lines per file

#### Tasks (In Dependency Order):
1. **schema.ts** — zod types (InputSchema, QueryTableSchema, StoreRecents, EncodeResult, DecodeResult)
   - Tests: Valid/invalid inputs, edge cases (empty, max-length, malformed rows)
   - Contracts: All types exported, zod schemas export for UI validation

2. **charset.ts** — codec abstraction (bytesToText, textToBytes, UnencodableCharError, parsePercentBytes)
   - Tests: UTF-8 encode sync, EUC-KR encode async mock CP949, decode native TextDecoder
   - Round-trip: `'한글' ↔ '%C7%D1%B1%DB'` (EUC-KR), emoji error (UnencodableCharError)
   - Contract: `textToBytes` is async; UTF-8 resolves immediately; EUC-KR lazy-loads table (mock in tests)

3. **encode.ts** — encoding logic (encodeComponent, encodeUri, handleAlreadyEncoded, percentEscapeBytes)
   - Tests: UTF-8 component/uri modes, EUC-KR both modes, already-encoded heuristic
   - Contract: Returns Promise<string>; never throws (catches UnencodableCharError)

4. **decode.ts** — decoding logic (decodeComponent, decodeUri, malformed error handling)
   - Tests: UTF-8 component/uri, EUC-KR both, malformed %xx (incomplete hex), charset mismatch
   - Contract: Returns DecodeResult { result?, error? }; never crashes

5. **query-parser.ts** — immutable query ops (parseQueryString, serializeQueryTable, editRow, deleteRow, addRow)
   - Tests: Parse query strings (with ?, &, empty keys/values), serialize round-trip, immutability
   - Contract: All functions return new arrays; serialization async

6. **recents.ts** — localStorage ops (pushRecent, pruneUnknown, serialize/deserialize)
   - Tests: De-duplication, max 10, zod validation on deserialize, fail-graceful (return [] on error)
   - Contract: Exports typed helper functions; no throw on invalid localStorage

7. **unicode.ts** — test helpers only (UTF8_ROUND_TRIP_VECTORS, EUCKR_ROUND_TRIP_VECTORS, EUCKR_UNREPRESENTABLE)
   - Tests: Used by domain tests; not a library function

8. **charset/cp949-encode.ts** — STUB only
   - Placeholder: `export const CP949_ENCODE_TABLE: Record<number, number[]> = {}`
   - Real table: Sourced from `cptable` (js-codepage) or vendored; dynamically imported only
   - Bundle verification: deferred to integration-qa

#### Parallel Work (UI/Platform can start once schema.ts + charset.ts contracts are locked):
- No blocking dependency; UI can mock encode/decode functions while domain is being tested

---

### Phase 2: Usecase / Adapter Hook
**Owner:** `ui-engineer`  
**Duration:** ~1 day  
**Completion Criteria:** Vitest ≥80%, TS 0 errors, localStorage isolation tested

#### Task:
**useUrlEncoder.ts** — React hook (owns state, localStorage, dispatch, clipboard)
- Recovers recents + charset on mount (localStorage `jurepi-url-encoder*`)
- Exposes state + actions (setText, setDirection, ..., process(), copyResult())
- process() dispatcher: calls appropriate encode/decode based on state, handles async EUC-KR
- copyResult() adapter: navigator.clipboard.writeText + fallback textarea + silent fail
- In-memory fallback if localStorage unavailable (no error message)

**Tests:**
- localStorage mock (localStorage persistence round-trip)
- In-memory fallback (private mode)
- Async encode dispatch (EUC-KR lazy-load, track isLoading state)
- Clipboard mock (success + failure cases)
- Batch mode (split input by \n, encode/decode each)

**Contract:**
```typescript
export function useUrlEncoder(): [UseUrlEncoderState, UseUrlEncoderActions]
```
State interface specifies all fields; actions interface specifies all dispatch functions.

---

### Phase 3: Presentation Layer (UI Components)
**Owner:** `ui-engineer`  
**Duration:** ~2–3 days (parallelizable)  
**Completion Criteria:** Vitest ≥80% (component integration), E2E scenarios 1–8 green, visual regression 320/768/1024, TS 0

#### Tasks (Can Start Once useUrlEncoder Hook Contract Locked):

1. **UrlEncoder.tsx** (main orchestrator, Client Component)
   - Owns useUrlEncoder hook
   - Renders layout, binds state ↔ actions
   - Keyboard shortcuts: "/" (focus), "r" (recents), "e" (direction), "c" (mode), "u" (charset), "b" (batch), Enter (process), Esc (clear)
   - Tests: Mount, state transitions, keyboard nav

2. **ModeToggle.tsx** — radio or tabs (Component / Full URI)
   - Help text explaining reserved chars behavior
   - Accent: grape
   - Tests: Toggle, aria-label

3. **CharsetToggle.tsx** — segmented control (UTF-8 / EUC-KR)
   - Help text + keyboard shortcut "u"
   - isLoading prop (optional spinner during CP949 load, typically not visible)
   - Accent: grape
   - Tests: Toggle, loading state

4. **DirectionToggle.tsx** — Encode ↔ Decode
   - Keyboard shortcut "e"
   - Icon: ArrowRightLeft
   - Tests: Toggle, aria-label

5. **TextInput.tsx** — input / textarea (batch mode)
   - Placeholder, max-length validation, character counter
   - DESIGN tokens: text-input style
   - Tests: Change, max-length, batch expand

6. **ResultOutput.tsx** — read-only monospace + copy button + error card
   - Success toast "✓ Copied" (1600ms)
   - Error card displays message + details
   - Sticky desktop (360px width, right column)
   - Tests: Render result, copy, error display, toast

7. **QueryTableView.tsx** — parse input → rows; edit rows; rebuild
   - Key/value inputs, side-by-side or stacked mobile
   - Add/delete row buttons
   - Rebuild button (serialize rows, copy)
   - Tests: Parse, edit, rebuild, round-trip

8. **BatchToggle.tsx** — checkbox to enable multi-line
   - Keyboard shortcut "b"
   - Tests: Toggle

9. **PlusAsSpaceToggle.tsx** — checkbox for legacy form-encoding
   - Decode only
   - Help text
   - Tests: Toggle

10. **AlreadyEncodedWarning.tsx** — info card + proceed/cancel buttons
    - Shows if heuristic detects %xx pattern
    - Non-blocking (user can dismiss or proceed)
    - Tests: Render, dismiss

11. **RecentsList.tsx** — dropdown / side-drawer
    - Keyboard shortcut "r" to toggle
    - Click to populate input
    - Clear all button
    - Empty state
    - Tests: Render, click, clear

12. **UrlEncoderIntro.tsx** (Server/SSR-safe)
    - H1 "URL 인코더" + lead
    - Eyebrow "개발 도구"
    - Tests: Render (shallow, no interaction)

13. **UrlEncoderHowTo.tsx** (Server/SSR-safe)
    - H2 "사용 방법"
    - Sections: "What is URL encoding?", "Component vs Full URI", "UTF-8 vs EUC-KR"
    - Tests: Content present, SSR snapshot

14. **UrlEncoderFaq.tsx** (Server/SSR-safe)
    - FAQ items from i18n
    - FAQPage JSON-LD rendered
    - Tests: Items present, JSON-LD markup valid

#### Parallel Breakdown (ui-engineer can assign):
- **UI Core (4–5 days):** UrlEncoder.tsx, TextInput, ResultOutput, ModeToggle, CharsetToggle, DirectionToggle, BatchToggle, PlusAsSpaceToggle (serial, depend on useUrlEncoder)
- **Advanced UI (2–3 days, parallelizable):** QueryTableView, AlreadyEncodedWarning, RecentsList (can start once useUrlEncoder locked)
- **SEO/Intro (1–2 days, can overlap):** UrlEncoderIntro, UrlEncoderHowTo, UrlEncoderFaq (no dependency on interactive state)

---

### Phase 4: Framework / Integration
**Owner:** `platform-engineer` + `seo-geo-engineer`  
**Duration:** ~1–2 days (mostly ~concurrent with Phase 3)  
**Completion Criteria:** Registry entry added, TS 0, route works, i18n complete, generateMetadata correct

#### Tasks:
1. **Category Activation (CRITICAL, Step D above)**
   - Add `categories.dev` to i18n messages
   - Update CATEGORY_ORDER in tool-search.ts
   - Update FOOTER_CATEGORIES in Footer.tsx
   - Verify: `pnpm build` (no errors)

2. **Registry Entry** (`src/tools/registry.ts`)
   - Add url-encoder entry (id, slug, category='dev', accent='grape', status='live')
   - Verify: slug unique, keywords localized

3. **i18n Messages** (all keys from Section C)
   - ko.json + en.json
   - tools.url-encoder.* namespace
   - Verify: no missing keys (build will error if key referenced but missing)

4. **Route & Dynamic Import** (`src/app/[locale]/tools/[slug]/page.tsx`)
   - Add UrlEncoder dynamic import
   - Add branch in generateMetadata (slug === 'url-encoder')
   - Add branch in ToolContent (slug === 'url-encoder')
   - Verify: `pnpm build` generates prerender route

5. **SEO Metadata** (via `lib/seo.ts`)
   - Call buildToolMetadata({ locale, slug, title, description })
   - Ensures canonical, hreflang, OG, breadcrumb
   - Verify: prerendered HTML has tags

6. **JSON-LD** (SoftwareApplication + FAQPage)
   - Rendered in UrlEncoderFaq component
   - Verified present in static HTML (not gated by JS)

#### Parallel Work:
- Category activation can start immediately (no dependency on other phases)
- Registry + route can start once UrlEncoder component exists (Phase 3)
- SEO verification deferred to integration-qa (Phase 5)

---

### Phase 5: Integration QA & Live
**Owner:** `qa-integration` + `seo-geo-engineer` + `reader` (livetest)  
**Duration:** ~1–2 days  
**Completion Criteria:** All test suites green, visual regression clean, SEO/GEO validated, live ✓

#### QA Checklist:
**Vitest** (all suites):
- `pnpm test` ≥90% domain coverage, ≥80% overall
- Specific test files: encode/decode all modes, charset round-trip, query-parser, recents, hook state

**TypeScript**:
- `pnpm tsc --noEmit` — 0 errors

**Build**:
- `pnpm build` — succeeds, generates /url-encoder SSG routes (ko + en)
- Bundle size: tool route <300KB JS (gzipped), full page <150KB (assuming no ads)

**E2E** (Playwright, scenarios from SPEC):
1. Encode component mode with special chars and unicode
2. Decode with malformed %xx sequence error
3. Query-string table parse and rebuild
4. Batch mode, multi-line processing
5. Recents, localStorage persistence, already-encoded warning
6. Full URI vs component mode difference
7. i18n, responsive (320/768/1024), a11y, no overflow
8. EUC-KR legacy Korean URL: decode, encode round-trip, unrepresentable-char error

**Visual Regression**:
- Screenshots at 320px, 768px, 1024px
- Both light + dark themes (if applicable)
- Compare against baseline (none for new tool; baseline = screenshot)
- Checks: mode/charset/direction toggles, query table rows, error cards, recents drawer

**SEO/GEO** (integration-qa hard gate):
- Prerendered HTML contains H1, lead, HowTo, FAQ (not gated by JS)
- FAQPage + SoftwareApplication JSON-LD present in static HTML
- Canonical matches tool URL
- Meta tags (og:title, og:description, etc.) correct per buildToolMetadata
- Robots can crawl (no meta noindex)
- Sitemap includes url-encoder routes (ko + en)

**Reader Manual Livetest** (before deployment):
- 320px: single column, no overflow, input expands for batch, recents as drawer
- 1024px: 2-column layout (input left, result sticky right)
- Dark mode: colors correct
- EUC-KR encode: CP949 table lazy-loads first time, not visible to user (no spinner if <50ms)
- EUC-KR decode: `%C7%D1%B1%DB` → `한글` ✓
- EUC-KR encode unrepresentable: emoji 😊 → error card ✓
- Already-encoded warning: input `test%20string` → warning card ✓
- Copy result: toast "✓ Copied" appears (1600ms) ✓
- Keyboard shortcuts: "/" (focus), "e" (direction), "c" (mode), "u" (charset), "r" (recents), Enter (process) ✓
- Query table: parse `?a=1&b=2` → 2 rows, edit value, rebuild → `?a=1&b=NEW` ✓
- Recents: encode → copy result → reload page → recents shows last input ✓

---

## G. Test Strategy Pointer (TDD Inside-Out)

### Domain Layer Tests (Vitest)
**Location:** `src/lib/url-encoder/*.test.ts` (co-located)

**Strategy:** RED → GREEN → REFACTOR

1. **schema.ts**
   - Test InputSchema zod validation (valid/invalid inputs)
   - Test edge cases (empty text, max-length, malformed query rows)

2. **charset.ts**
   - Test `bytesToText`: UTF-8 native, EUC-KR native
   - Test `textToBytes`: UTF-8 sync, EUC-KR async (mock CP949 table)
   - Test `parsePercentBytes`: valid %xx sequences, malformed (incomplete hex)
   - Test `UnencodableCharError`: emoji → throws with char code
   - **CRITICAL:** EUC-KR encode test must mock CP949 table (async import mocked), verify lazy-load is NOT executed in test

3. **encode.ts**
   - Test UTF-8 encodeComponent: "hello world" → "hello%20world", "안녕" → encoded
   - Test UTF-8 encodeUri: "/" stays unencoded
   - Test EUC-KR encodeComponent: "한글" → "%C7%D1%B1%DB" (with mocked CP949)
   - Test EUC-KR encode error: emoji → UnencodableCharError (caught, not thrown)
   - Test already-encoded heuristic: "%20" → true, "hello" → false

4. **decode.ts**
   - Test UTF-8 decodeComponent: "hello%20world" → "hello world"
   - Test UTF-8 decodeUri: "/" stays
   - Test EUC-KR decodeComponent: "%C7%D1%B1%DB" → "한글"
   - Test malformed %xx: "hello%6" → DecodeResult { error: {...} }
   - Test charset mismatch: UTF-8 bytes decoded as EUC-KR → friendly error hint
   - Test plusAsSpace: "hello+world" with plusAsSpace=true → "hello world"

5. **query-parser.ts**
   - Test parseQueryString: "?a=1&b=2" → [{ key: 'a', value: '1' }, { key: 'b', value: '2' }]
   - Test edge cases: "a=&b=2" (empty value), "?&a=1" (leading &), "a=1&" (trailing &)
   - Test serializeQueryTable: round-trip (parse → edit → serialize → parse)
   - Test immutability: editRow returns new array, original unchanged

6. **recents.ts**
   - Test pushRecent: [a, b] + c → [c, a, b]; de-dup (c already present → [c, a, b])
   - Test max 10: [1..10] + 11 → [11, 1..9]
   - Test pruneUnknown: [1, "", "valid", null] → ["valid"]
   - Test serialize/deserialize: round-trip + fail-graceful (invalid JSON → [])

### Component Tests (Vitest + React Testing Library)

**Location:** `src/components/tools/url-encoder/*.test.tsx`

**Strategy:** Test state + dispatch, NOT presentation details

1. **useUrlEncoder.ts**
   - Test localStorage recovery: mount → charset from localStorage
   - Test setText, setDirection, setMode, setCharset
   - Test process() dispatch: UTF-8 encode → result populated
   - Test process() async: EUC-KR encode (mocked) → isLoading state
   - Test copyResult(): success + failure cases
   - Test batch mode: "line1\nline2" → split, encode each, rejoin

2. **UrlEncoder.tsx** (integration test)
   - Mount component
   - User types text: "hello world"
   - Changes direction to Encode
   - Clicks process (or press Enter)
   - Result should show "hello%20world"
   - Test keyboard shortcut "/" → focus input
   - Test keyboard shortcut "e" → toggle direction

3. **ModeToggle.tsx**
   - Mount with mode='component'
   - Click "Full URI"
   - onChange fires with 'uri'

4. **CharsetToggle.tsx**
   - Mount with charset='utf-8'
   - Click "EUC-KR"
   - onChange fires with 'euc-kr'
   - Test isLoading prop (optional UI hint)

5. **TextInput.tsx**
   - Type text
   - onChange fires with new value
   - Exceeding maxLength: prevent submit (or warn at 80%)
   - Batch mode: textarea visible

6. **ResultOutput.tsx**
   - Render result
   - Click copy → onCopy called
   - Error prop → render error card
   - Toast integration (via context or callback)

7. **QueryTableView.tsx**
   - Parse input "?a=1&b=2" → rows rendered
   - Edit row (key/value inputs) → onRowsChange fired
   - Rebuild → serialize, onRebuild called
   - Add/delete row buttons work

8. **RecentsList.tsx**
   - Render recents list
   - Click recent → populates input

### E2E Tests (Playwright)

**Location:** `tests/e2e/url-encoder-*.spec.ts`

**Strategy:** User scenarios 1–8 from SPEC

**Examples:**
```typescript
// Scenario 1: Encode component mode
test('encodes component mode with unicode', async ({ page }) => {
  await page.goto('/ko/tools/url-encoder');
  
  // Check mode is component (default)
  await expect(page.locator('[aria-label*="Component"]')).toBeVisible();
  
  // Type input
  await page.locator('[aria-label="URL or text input"]').fill('hello world &');
  
  // Click encode (or press Enter)
  await page.locator('[aria-label="Toggle direction"]').click(); // toggles to Encode if was Decode
  await page.locator('[aria-label="Process"] or use Enter').press('Enter');
  
  // Check result
  await expect(page.locator('[aria-label="Result"]')).toContainText('hello%20world%20%26');
});

// Scenario 8: EUC-KR
test('euckr decode round-trip', async ({ page }) => {
  await page.goto('/ko/tools/url-encoder');
  
  // Set charset to EUC-KR
  await page.locator('[aria-label="Charset toggle"]').click();
  await page.locator('button:has-text("EUC-KR")').click();
  
  // Set to decode
  await page.locator('[aria-label="Direction toggle"]').click(); // to Decode
  
  // Input: %C7%D1%B1%DB
  await page.locator('[aria-label="URL or text input"]').fill('%C7%D1%B1%DB');
  await page.keyboard.press('Enter');
  
  // Check result: 한글
  await expect(page.locator('[aria-label="Result"]')).toContainText('한글');
});
```

### Bundle Analysis (integration-qa)
```bash
# Verify CP949 table is NOT in initial chunk
npx source-map-explorer 'out/**/*.js' | grep "charset/cp949"
# Expected: "charset/cp949-encode.ts" → separate chunk (e.g., _next/static/chunks/url-encoder-cp949-*.js)

# Verify initial tool JS < 300KB gzipped
ls -lah .next/static/chunks/url-encoder.*.js | wc -l
# Expected: 1–2 chunks; combined <300KB gzipped
```

---

## Summary: Parallel Work Schedule

| Phase | Component | Owner | Duration | Blocker? |
|-------|-----------|-------|----------|----------|
| 1 | Domain layer (encode/decode/charset/query/recents/schema) | domain-engineer | 1–2d | — |
| 2 | useUrlEncoder hook | ui-engineer | 1d | domain ✓ |
| 3a | UI core (UrlEncoder, toggles, input/output) | ui-engineer | 2–3d | useUrlEncoder ✓ |
| 3b | Advanced UI (QueryTable, Recents, Warning) | ui-engineer | 1–2d | useUrlEncoder ✓ |
| 3c | SEO sections (Intro, HowTo, FAQ) | ui-engineer | 1d | — (can start immediately) |
| 4a | Category activation (i18n, order, footer) | platform-engineer | 1d | — (start immediately) |
| 4b | Registry + route + metadata | platform-engineer | 1d | UrlEncoder component ✓ |
| 5 | QA, E2E, visual regression, SEO/GEO | qa-integration + seo-geo | 1–2d | all above ✓ |

**Critical Path:** Domain → useUrlEncoder → UI core → QA (5–6 days)  
**Parallel Tracks:** Category activation can start day 1; SEO sections day 1; Advanced UI day 3

---

## Key Implementation Notes (Do's & Don'ts)

### DO:
- **Charset.ts first.** Lock the `textToBytes(text, 'euc-kr'): Promise<Uint8Array>` contract early. All encode logic flows from it.
- **Lazy-load CP949.** Verify dynamic import in bundle analysis. Initial chunk must NOT include cp949-encode.ts.
- **Immutable query ops.** Every edit function returns a new array. State updates are pure.
- **Fail-graceful localStorage.** Never crash if localStorage unavailable or corrupted. In-memory session-only fallback.
- **Mock CP949 in tests.** Domain tests must mock the CP949 table (fixture) so tests run fast (no actual dynamic import).
- **SSR-safe SEO.** Intro, HowTo, FAQ OUTSIDE mounted gate. AI crawlers don't run JS.
- **Zod validation.** Input schema enforced at boundary (useUrlEncoder entry point). Domain functions assume valid input.

### DON'T:
- **Don't hardcode UI strings.** All text from i18n messages. No magic strings in components.
- **Don't mutate state.** useUrlEncoder returns new objects/arrays on every action dispatch.
- **Don't couple domain to React.** encode.ts, decode.ts, query-parser.ts have zero React imports. Zero DOM.
- **Don't gate SEO.** H1, FAQ, HowTo must render server-side. `mounted` gate (if used) is for interactive state only.
- **Don't ship CP949 upfront.** Lazy-import only. Zero overhead for users who never toggle EUC-KR.
- **Don't silently fail errors.** Malformed %xx, charset mismatch, unrepresentable char → friendly error UI. Never swallow.
- **Don't skip E2E.** All 8 scenarios from SPEC must pass. Browser must match mock.

---

## File Path Reference (All Absolute Paths)

### Domain Layer:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/schema.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/charset.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/charset/cp949-encode.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/encode.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/decode.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/query-parser.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/recents.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/unicode.ts`

### Usecase/Adapter:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/components/tools/url-encoder/useUrlEncoder.ts`

### Presentation:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/components/tools/url-encoder/UrlEncoder.tsx`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/components/tools/url-encoder/{ModeToggle,CharsetToggle,DirectionToggle,TextInput,ResultOutput,QueryTableView,BatchToggle,PlusAsSpaceToggle,AlreadyEncodedWarning,RecentsList,UrlEncoderIntro,UrlEncoderHowTo,UrlEncoderFaq}.tsx`

### Framework:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/tools/registry.ts` (add entry)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/tools/types.ts` (already has 'dev' in union)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/i18n/messages/ko.json` (add keys)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/i18n/messages/en.json` (add keys)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/tool-search.ts` (update CATEGORY_ORDER)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/components/layout/Footer.tsx` (update FOOTER_CATEGORIES)
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/app/[locale]/tools/[slug]/page.tsx` (add route branch)

### Tests:
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/lib/url-encoder/*.test.ts`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/src/components/tools/url-encoder/*.test.tsx`
- `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/tests/e2e/url-encoder-*.spec.ts`

---

**END BLUEPRINT**
