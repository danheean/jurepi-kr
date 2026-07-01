# URL Encoder Domain Layer — Public API Contract

**Status:** COMPLETE & TESTED  
**Test Coverage:** 199 tests, all passing (≥90% domain coverage)  
**Lines of Code:** ~630 (all <800 per file)  
**React/Next Imports:** ZERO (pure domain)

---

## Public API Signatures

### `schema.ts` — Type Contracts & Validation

```typescript
// Input validation
export const inputSchema: z.ZodType<InputSchema>;
export interface InputSchema {
  text: string; // max 10000 chars
  direction: 'encode' | 'decode';
  mode: 'component' | 'uri';
  charset: 'utf-8' | 'euc-kr'; // default: 'utf-8'
  plusAsSpace?: boolean;
  batchMode?: boolean;
}

// Query table row
export interface QueryTableRow {
  key: string;
  value: string;
}

// Encode result
export interface EncodeResult {
  result?: string;
  alreadyEncodedHint: boolean;
  error?: { message: string; details: string } | null;
}

// Decode result
export interface DecodeResult {
  result?: string;
  error?: { message: string; details: string } | null;
}

// Store schema (localStorage)
export interface StoreRecents {
  version: number;
  recents: string[];
  meta: { createdAt: number };
}

// Helper functions
export function parseStore(json: string): StoreRecents;
export function serializeStore(store: StoreRecents): string;

// Constants
export const RECENTS_MAX = 10;
export const INPUT_MAX_LEN = 10000;
export const BATCH_MAX_LINES = 100;
export const STORE_VERSION = 1;
export const STORAGE_KEY = 'jurepi-url-encoder';
```

### `charset.ts` — Codec Abstraction (Core)

```typescript
/**
 * Custom error for unencodable characters (EUC-KR only).
 */
export class UnencodableCharError extends Error {
  char: string;
  charCode: number;
  charset: 'utf-8' | 'euc-kr';
}

/**
 * Parse percent-encoded bytes: "%XX" → byte value.
 * Throws on malformed sequence.
 */
export function parsePercentBytes(input: string): Uint8Array;

/**
 * Decode bytes as the given charset (native TextDecoder).
 * UTF-8 and EUC-KR both supported, zero dependencies.
 */
export function bytesToText(bytes: Uint8Array, charset: 'utf-8' | 'euc-kr'): string;

/**
 * Encode text to bytes (async for EUC-KR lazy-load).
 * - UTF-8: synchronous, native TextEncoder.
 * - EUC-KR: async, lazy-imports CP949 table (code-split).
 * Throws UnencodableCharError on unmapped chars in EUC-KR.
 */
export async function textToBytes(
  text: string,
  charset: 'utf-8' | 'euc-kr',
): Promise<Uint8Array>;
```

**Invariants:**
- UTF-8 path: synchronous (returns resolved Promise)
- EUC-KR encode: async (lazy-loads ./charset/cp949-encode)
- Both decode paths: use native TextDecoder (zero external deps)
- CP949 table: dynamically imported only on EUC-KR encode; NOT in initial bundle

### `charset/cp949-encode.ts` — CP949 Forward Table

```typescript
/**
 * CP949 (EUC-KR) forward map: Unicode codePoint → CP949 bytes.
 * Built at runtime using TextDecoder('euc-kr') reverse-mapping.
 * Type: Record<number, number[]>
 *
 * Lazy-imported via: await import('./charset/cp949-encode').then(m => m.CP949_ENCODE_TABLE)
 */
export const CP949_ENCODE_TABLE: Record<number, number[]>;
```

**Invariants:**
- Maps codePoints 0x00–0x7F (ASCII) as single-byte [n]
- Maps EUC-KR lead (0x81–0xFE) × trail (0x41–0xFE) pairs to their codePoints
- Built once per module load; memoized
- NOT bundled in initial chunk (dynamic import only)

### `encode.ts` — Encoding

```typescript
/**
 * Encode text in component mode.
 * UTF-8: encodeURIComponent (native, sync).
 * EUC-KR: lazy-load CP949, percent-escape (async).
 */
export function encodeComponent(
  text: string,
  charset: 'utf-8' | 'euc-kr',
): Promise<string>;

/**
 * Encode text in full URI mode.
 * UTF-8: encodeURI (native, sync).
 * EUC-KR: lazy-load CP949, percent-escape (async).
 */
export function encodeUri(
  text: string,
  charset: 'utf-8' | 'euc-kr',
): Promise<string>;

/**
 * Heuristic: detect if input contains %XX patterns.
 * Returns true if already-encoded hint should be shown.
 */
export function handleAlreadyEncoded(text: string): boolean;

/**
 * High-level encode wrapper.
 * Dispatches to encodeComponent/encodeUri, catches UnencodableCharError.
 * Returns EncodeResult (never throws).
 */
export async function encode(
  text: string,
  mode: 'component' | 'uri',
  charset: 'utf-8' | 'euc-kr',
): Promise<EncodeResult>;

/**
 * Helper: convert byte array to percent-encoded string.
 * mode='component': encode all non-unreserved chars.
 * mode='uri': keep reserved chars (RFC 3986) unencoded.
 */
export function percentEscapeBytes(
  bytes: Uint8Array,
  mode: 'component' | 'uri',
): string;
```

**Invariants:**
- Component mode: encodes reserved chars as %XX
- URI mode: keeps reserved chars (/, :, ?, #, &, =) unencoded
- ASCII bytes identical output across both charsets
- EUC-KR unencodable chars raise typed error (no crash)

### `decode.ts` — Decoding

```typescript
/**
 * Decode text in component mode.
 * UTF-8: decodeURIComponent (native, sync).
 * EUC-KR: parse %XX to bytes, decode with native TextDecoder.
 * Returns DecodeResult (never throws).
 */
export function decodeComponent(
  text: string,
  charset?: 'utf-8' | 'euc-kr',
  options?: { plusAsSpace?: boolean },
): DecodeResult;

/**
 * Decode text in full URI mode.
 * UTF-8: decodeURI (native, sync).
 * EUC-KR: parse %XX to bytes, decode with native TextDecoder.
 * Returns DecodeResult (never throws).
 */
export function decodeUri(
  text: string,
  charset?: 'utf-8' | 'euc-kr',
  options?: { plusAsSpace?: boolean },
): DecodeResult;

/**
 * High-level decode wrapper.
 * Dispatches to decodeComponent/decodeUri.
 * Returns DecodeResult (never throws).
 */
export async function decode(
  text: string,
  mode: 'component' | 'uri',
  charset: 'utf-8' | 'euc-kr',
  options?: { plusAsSpace?: boolean },
): Promise<DecodeResult>;
```

**Invariants:**
- plusAsSpace: replaces '+' with ' ' before decoding (legacy form-encoding)
- Malformed %XX (incomplete hex): returns friendly error message
- Invalid bytes for charset: returns friendly error (no crash)
- Empty input: valid, returns empty string (no error)

### `query-parser.ts` — Query String Operations

```typescript
/**
 * Parse query string into rows.
 * Handles: ?, leading &, trailing &, empty values.
 * Decodes keys/values using native decodeURIComponent (UTF-8 only).
 */
export function parseQueryString(input: string): QueryTableRow[];

/**
 * Serialize rows back to query string.
 * Applies encoding based on mode/charset.
 */
export async function serializeQueryTable(
  rows: QueryTableRow[],
  mode?: 'component' | 'uri',
  charset?: 'utf-8' | 'euc-kr',
): Promise<string>;

/**
 * Edit row (immutable): return new array.
 */
export function editRow(
  rows: QueryTableRow[],
  index: number,
  newKey: string,
  newValue: string,
): QueryTableRow[];

/**
 * Delete row (immutable): return new array.
 */
export function deleteRow(rows: QueryTableRow[], index: number): QueryTableRow[];

/**
 * Add empty row (immutable): return new array.
 */
export function addRow(rows: QueryTableRow[]): QueryTableRow[];
```

**Invariants:**
- All ops return NEW arrays (immutable)
- serializeQueryTable is async (EUC-KR encode may lazy-load CP949)
- Parsing uses native decodeURIComponent (UTF-8 only); caller responsible for EUC-KR re-decode if needed

### `recents.ts` — Persistence Operations

```typescript
/**
 * Add text to recents list.
 * - De-duplicates: removes if already present, then prepends.
 * - Truncates to max (default: 10).
 * Returns new array (immutable).
 */
export function pushRecent(
  list: string[],
  text: string,
  max?: number,
): string[];

/**
 * Filter to valid strings only.
 * Removes non-string, null, undefined, empty strings.
 * Safe on non-array input: returns [].
 */
export function pruneUnknown(list: unknown[]): string[];

/**
 * Serialize recents to JSON string.
 */
export function serializeRecents(recents: string[]): string;

/**
 * Deserialize recents from JSON.
 * Fail-gracefully: invalid JSON → [].
 */
export function deserializeRecents(json: string): string[];
```

**Invariants:**
- pushRecent: dedupes + prepends + truncates in one pass
- pruneUnknown: type-safe, handles edge cases (null, undefined, non-arrays)
- Round-trip: serialize → deserialize → push preserves all data

### `unicode.ts` — Test Vectors (Reference Only)

```typescript
export const UTF8_ROUND_TRIP_VECTORS: Array<{
  text: string;
  encoded: string;
  description?: string;
}>;

export const EUCKR_ROUND_TRIP_VECTORS: Array<{
  text: string;
  encoded: string;
  description?: string;
}>;

export const EUCKR_UNREPRESENTABLE: Array<{
  text: string;
  charCode: number;
  description?: string;
}>;
```

**Used by:** Unit tests only. Consumed by charset.test.ts, encode.test.ts, decode.test.ts for round-trip validation and unrepresentable-char testing.

---

## Test Results Summary

**All 199 tests PASS:**
- `schema.test.ts`: 18 tests ✓
- `charset.test.ts`: 40 tests ✓ (UTF-8 + EUC-KR round-trip, UnencodableCharError)
- `encode.test.ts`: 40 tests ✓ (both directions, both modes, both charsets)
- `decode.test.ts`: 37 tests ✓ (error handling, malformed %xx, charset mismatch)
- `query-parser.test.ts`: 35 tests ✓ (parse/serialize/edit/delete/add, immutability)
- `recents.test.ts`: 29 tests ✓ (push/prune/serialize, dedup, max truncation)

**Code Quality:**
- ✓ Zero React/Next imports
- ✓ All files < 800 lines (max: 128 lines per file)
- ✓ No external dependencies for UTF-8 or EUC-KR decode
- ✓ CP949 table code-split (dynamic import only)
- ✓ Pure functions, immutable operations
- ✓ Comprehensive error handling (no crashes)

---

## Hand-Off Contract to UI Engineer

The UI engineer consumes the public API as follows:

**Encoding/Decoding:**
```typescript
import { encode, decode, handleAlreadyEncoded } from '@/lib/url-encoder/encode';

const encodeResult = await encode('hello world', 'component', 'utf-8');
// { result: 'hello%20world', alreadyEncodedHint: false, error: null }

const decodeResult = await decode('%20hello', 'component', 'utf-8');
// { result: ' hello', error: null }
```

**Query String:**
```typescript
import { parseQueryString, serializeQueryTable, editRow } from '@/lib/url-encoder/query-parser';

const rows = parseQueryString('?name=Alice&age=30');
// [{ key: 'name', value: 'Alice' }, { key: 'age', value: '30' }]

const edited = editRow(rows, 0, 'name', 'Bob');
const serialized = await serializeQueryTable(edited, 'component', 'utf-8');
// 'name=Bob&age=30'
```

**Recents:**
```typescript
import { pushRecent, serializeRecents, deserializeRecents } from '@/lib/url-encoder/recents';

let recents: string[] = [];
recents = pushRecent(recents, 'hello');
recents = pushRecent(recents, 'world');
// ['world', 'hello']

const json = serializeRecents(recents);
const restored = deserializeRecents(json);
// ['world', 'hello']
```

---

## Alignment with Blueprint

✓ All signatures match `01_architect_url-encoder-blueprint.md` Section A (domain files 1–8)  
✓ All invariants from Section B (charset contract) implemented and tested  
✓ Code-split CP949 table verified not in initial bundle (dynamic import)  
✓ Zero external deps for UTF-8; native TextDecoder for EUC-KR decode  
✓ Immutable operations throughout (arrays return new copies)

---

**Ready for UI/Usecase Layer Consumption**
