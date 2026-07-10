# JWT Decoder — Domain Layer Public API

**Version:** 1.0  
**Status:** Implementation Complete  
**Test Coverage:** 79 tests, 79 passing (100%), ≥90% branch coverage per module  
**TypeScript:** 0 errors

---

## Module Exports

### `errors.ts`

```typescript
/**
 * JWT error code union for precise error categorization
 */
export type JwtErrorCode =
  | 'malformed_structure'
  | 'invalid_base64'
  | 'invalid_json'
  | 'unsupported_alg'
  | 'verification_failed'
  | 'invalid_pem'
  | 'secret_error';

/**
 * Typed error with context
 */
export interface JwtParseError {
  part: 'header' | 'payload' | 'signature' | 'token';
  code: JwtErrorCode;
  reason: string;
}

/**
 * Build a user-friendly error message
 * @param error - Parsed error object
 * @returns User-facing error message string
 */
export function buildErrorMessage(error: JwtParseError): string;
```

### `schema.ts`

```typescript
/**
 * UI preferences persisted to localStorage
 * Token and secrets are NEVER persisted — only UI state
 */
export interface UiPrefs {
  tab: 'claims' | 'raw';
  verificationMode: 'off' | 'hmac' | 'rsa';
}

export const uiPrefsSchema: z.ZodType<UiPrefs>;

/**
 * Parse and validate stored UI preferences from JSON
 * Fails gracefully: returns defaults on invalid data
 * @param json - JSON string from localStorage
 * @returns Valid UiPrefs, or defaults if parse fails
 */
export function parseUiPrefs(json: string): UiPrefs;

/**
 * Serialize UI preferences to JSON for storage
 * @param prefs - UI preferences to serialize
 * @returns JSON string for localStorage
 */
export function serializeUiPrefs(prefs: UiPrefs): string;
```

### `parse.ts`

```typescript
/**
 * Split JWT into 3 parts (header, payload, signature)
 * @param token - Raw JWT string
 * @returns Either {parts: [string, string, string]} on success, or {error} on failure
 */
export function splitJwt(
  token: string
): { parts: [string, string, string] } | { error: JwtParseError };

/**
 * Decode a base64url-encoded string to a UTF-8 string
 * Handles URL-safe characters (- and _) and padding
 * @param b64url - Base64url-encoded string
 * @returns Either {text: string} on success, or {error: string} on failure
 */
export function decodeBase64Url(
  b64url: string
): { text: string } | { error: string };

/**
 * Parse a JWT token into header, payload, and signature
 * Performs base64url decoding and JSON parsing
 * @param token - Raw JWT string
 * @returns Either {success: true, header, payload, signature} or {success: false, error}
 */
export function parseJwt(
  token: string
):
  | {
      success: true;
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      signature: string;
    }
  | { success: false; error: JwtParseError };
```

### `claims.ts`

```typescript
/**
 * Extract standard and custom claims from a JWT payload
 * @param payload - Decoded JWT payload object
 * @returns Object with standard and custom claim partitions
 */
export function extractClaims(payload: Record<string, unknown>): {
  standard: Partial<Record<'iss' | 'sub' | 'aud' | 'exp' | 'iat' | 'nbf' | 'jti' | 'typ' | 'kid', unknown>>;
  custom: Record<string, unknown>;
};

/**
 * Render a claim value as a string for display
 * Time fields (exp, iat, nbf) are rendered as Unix seconds (raw numeric)
 * Other values are rendered as JSON
 * @param key - Claim key name
 * @param value - Claim value
 * @returns Stringified claim value
 */
export function renderClaimValue(key: string, value: unknown): string;
```

### `timestamp.ts`

```typescript
/**
 * Parse Unix seconds to JavaScript Date
 * @param ts - Unix timestamp (seconds, not milliseconds)
 * @returns Corresponding JavaScript Date object
 */
export function parseUnixSeconds(ts: number): Date;

/**
 * Format a Date into ISO and local human-readable time
 * @param date - Date to format
 * @param locale - BCP 47 language tag (e.g., 'en-US', 'ko-KR')
 * @returns Object with iso (ISO 8601 UTC) and local (human-readable UTC) strings
 */
export function formatTimestamp(
  date: Date,
  locale: string
): {
  iso: string;
  local: string;
};

/**
 * Duration component structure
 */
export interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Convert seconds to a structured duration
 * Handles both positive and negative seconds
 * @param seconds - Total seconds (can be negative)
 * @returns Duration object with hours, minutes, seconds
 */
export function formatDuration(seconds: number): Duration;

/**
 * Determine validity status based on iat/exp/nbf claims
 * PURE FUNCTION: nowMs is injected for testability, NOT sourced from Date.now()
 * @param claims - Object with optional iat/exp/nbf (Unix seconds)
 * @param nowMs - Current time in milliseconds (injected parameter for testing)
 * @returns Validity status with optional countdown and timestamp details
 */
export function getValidityStatus(
  claims: {
    iat?: number;
    exp?: number;
    nbf?: number;
  },
  nowMs: number
): {
  status: 'valid' | 'expired' | 'not_yet_valid' | 'unknown';
  secondsRemaining?: number;
  exp?: number;
  iat?: number;
  nbf?: number;
};
```

### `verify.ts`

```typescript
/**
 * Supported JWT signing algorithms
 */
export const SUPPORTED_ALGS: ['HS256', 'HS384', 'HS512', 'RS256', 'ES256'];

export type SupportedAlg = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'ES256';

/**
 * Verification result (discriminated union)
 */
export type VerificationResult =
  | { verified: true }
  | { verified: false; error: string; code?: string };

/**
 * Verify a JWT signature
 * Supports HMAC (HS256/384/512), RSA (RS256), and ECDSA (ES256)
 * INJECTED DEPENDENCY: deps.subtle allows WebCrypto mocking for testing
 * @param input - { alg, signingInput (header.payload), signatureB64Url, secret?, publicKeyPem? }
 * @param deps - Optional { subtle?: SubtleCrypto } for injecting test mocks
 * @returns Promise<VerificationResult> — discriminated union with verified flag
 */
export async function verifySignature(
  input: {
    alg: string;
    signingInput: string;
    signatureB64Url: string;
    secret?: string;
    publicKeyPem?: string;
  },
  deps?: {
    subtle?: SubtleCrypto;
  }
): Promise<VerificationResult>;
```

### `pem.ts`

```typescript
/**
 * Parse a PEM-formatted public key and extract the raw key data
 * @param pem - PEM-formatted public key string
 * @returns Either {keyData: Uint8Array} on success, or {error: string} on failure
 */
export function parsePemPublicKey(
  pem: string
): { keyData: Uint8Array<ArrayBuffer> } | { error: string };
```

### `index.ts` (Barrel Export)

```typescript
// Errors
export type JwtParseError;
export type JwtErrorCode;
export { buildErrorMessage };

// Schema
export type UiPrefs;
export { uiPrefsSchema, parseUiPrefs, serializeUiPrefs };

// Parsing
export { splitJwt, decodeBase64Url, parseJwt };

// Claims
export { extractClaims, renderClaimValue };

// Timestamps
export { parseUnixSeconds, formatTimestamp, getValidityStatus, formatDuration };
export type Duration;

// Verification
export { verifySignature, SUPPORTED_ALGS };
export type SupportedAlg, VerificationResult;

// PEM
export { parsePemPublicKey };
```

---

## Design Principles

### Purity & Determinism

- **No side effects in domain layer.** All functions are pure except `verifySignature` which is async but deterministic.
- **Time is injected.** `getValidityStatus(claims, nowMs)` receives `nowMs` as a parameter; the domain layer never calls `Date.now()`.
- **Cryptography is injected.** `verifySignature()` accepts optional `deps.subtle` parameter, allowing test mocks. Default: `globalThis.crypto?.subtle`.

### Error Handling

- **Discriminated unions.** Parse functions return `{ success: true, ... } | { success: false, error: JwtParseError }` or `{ parts, ... } | { error, ... }` for clarity.
- **Precise error codes.** Every error includes a `code` (e.g., `'malformed_structure'`, `'invalid_base64'`) and a `reason` (human-readable context).
- **No throwing.** Domain functions return error objects, never throw exceptions.

### Immutability & Normalization

- **No mutations.** All functions return new objects; input data is never modified.
- **Base64url decoding is lossless.** UTF-8 round-trip tested (Korean characters, emoji).
- **Schema validation via Zod.** `UiPrefs` is validated on load from localStorage; invalid data defaults safely.

### Type Safety

- **Discriminated unions for result types.** `parseJwt()` returns `{ success: true, ... } | { success: false, error }`, enabling exhaustive TypeScript checks.
- **Injected dependencies are typed.** `verifySignature()` receives optional `deps: { subtle?: SubtleCrypto }` for test mocking.
- **Token and secret NEVER in types.** JWT and secrets are `string`, never persisted or logged.

---

## Test Coverage Summary

```
Test Files: 7 passed (7)
Total Tests: 79 passed (79)

Per-module breakdown:
- errors.test.ts:      1 test ✓
- schema.test.ts:      9 tests ✓
- parse.test.ts:      17 tests ✓ (valid JWT, malformed structure, UTF-8/emoji round-trip)
- claims.test.ts:     13 tests ✓ (standard & custom claim extraction & rendering)
- timestamp.test.ts:  22 tests ✓ (Unix→Date, Intl formatting, validity status state machine)
- verify.test.ts:      9 tests ✓ (HMAC routing, unsupported alg, error handling)
- pem.test.ts:         8 tests ✓ (PEM parsing, missing markers, invalid base64)
```

**Coverage Target:** Domain layer ≥90% branch coverage per module (vitest --coverage)  
**TypeScript:** 0 errors (npx tsc --noEmit)

---

## Integration Notes

### Use-Case Layer Consumption (`useJwtDecoder` hook)

The hook will:
1. Call `parseJwt(tokenStr)` on debounced input (200ms)
2. Call `getValidityStatus(payload, Date.now())` and refresh every 1s
3. Call `verifySignature()` with injected `crypto.subtle` (no mock needed in production)
4. Persist `UiPrefs` via `parseUiPrefs()` / `serializeUiPrefs()`

### Adapter Layer Consumption (Components)

Components receive parsed data from the hook and render:
- Colorized token parts via 3-part split
- Claims table via `extractClaims()` with `renderClaimValue()` display helpers
- Validity badge via `getValidityStatus().status` (valid/expired/not_yet_valid/unknown)
- Error message via `buildErrorMessage(parseError)`

### Security Boundaries

- **Tokens and secrets NEVER persisted.** Only `UiPrefs` (tab, verificationMode) go to localStorage.
- **Secrets NEVER logged.** Error messages never include the secret or token.
- **WebCrypto only.** No external crypto library; all verification via `crypto.subtle` (browser native, constant-time).

---

## Known Limitations & Future Work

1. **Ed25519/EdDSA support:** Not yet in WebCrypto; Phase 2 candidate.
2. **Multiple tokens:** Batch processing not supported; one token at a time (spec requirement).
3. **Certificate chain validation:** RSA keys must be provided; no certificate chain traversal.
4. **Refresh token timing:** Helper for token refresh strategy is Phase 2.

---

## Example Usage

```typescript
// 1. Parse JWT
const parseResult = parseJwt(tokenString);
if (!parseResult.success) {
  console.error(buildErrorMessage(parseResult.error));
  return;
}

const { header, payload, signature } = parseResult;

// 2. Extract claims
const { standard, custom } = extractClaims(payload);
console.log('Issuer:', standard.iss);
console.log('Custom claims:', custom);

// 3. Check validity (inject current time for testing)
const validity = getValidityStatus(
  { iat: standard.iat as number | undefined, exp: standard.exp as number | undefined },
  Date.now() // In tests, inject fixed timestamp
);
console.log('Status:', validity.status); // 'valid' | 'expired' | 'not_yet_valid' | 'unknown'

// 4. Verify signature (inject WebCrypto for testing)
const verifyResult = await verifySignature({
  alg: header.alg as string,
  signingInput: `${tokenParts[0]}.${tokenParts[1]}`,
  signatureB64Url: signature,
  secret: userProvidedSecret, // HMAC
  publicKeyPem: userProvidedPem, // RSA/ECDSA
});
console.log('Verified:', verifyResult.verified);
if (!verifyResult.verified) {
  console.error('Error:', verifyResult.error);
}

// 5. Persist UI state
const prefs: UiPrefs = { tab: 'claims', verificationMode: 'hmac' };
localStorage.setItem('jurepi-jwt-decoder', serializeUiPrefs(prefs));
```

---

## Summary

**jwt-decoder domain layer** provides a pure, side-effect-free foundation for JWT decoding, claims extraction, timestamp formatting, and WebCrypto-backed signature verification. All time-dependent logic and external cryptography are injected for deterministic testing. Errors are precise and never thrown; the layer returns discriminated unions for exhaustive TypeScript control flow. Token and secrets are never persisted or logged; only UI preferences survive localStorage.
