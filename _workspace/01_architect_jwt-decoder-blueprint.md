# JWT Decoder — Clean Architecture Blueprint

**Codename:** `jwt-decoder`  
**Registry ID:** `jwt-decoder` (category: `dev`, accent: `sun`)  
**Status:** `coming_soon` → `live` (step 10)  
**Implementation order:** domain → ui ∥ platform ∥ seo → qa  

---

## 1. LAYER DECOMPOSITION

### DOMAIN LAYER (`src/lib/jwt-decoder/*`)
**Responsibility:** Pure, side-effect-free token parsing, claims extraction, timestamp math, WebCrypto-backed signature verification, PEM parsing, and error tracking. NO React/Next imports. WebCrypto (`crypto.subtle`), `TextEncoder`, `atob` are browser Web APIs (platform-neutral, allowed).

**Invariant:** All functions are **pure** (except signature verification, which is async but deterministic given the same inputs). All **time-dependent logic** (`getValidityStatus`) receives `now` as an injected parameter for testability.

| Module | Public API | Owned Data | Test Coverage Target |
|--------|-----------|-----------|----------------------|
| `schema.ts` | `JwtParts`, `Claims`, `VerificationOptions`, `VerificationResult` (zod + TS types) | UI prefs shape only | 100% (types) |
| `errors.ts` | Typed error codes enum + error message builder | Error taxonomy | 100% |
| `parse.ts` | `splitJwt(tokenStr)` → `{parts: [h,p,s], error?}` | JWT structure | ≥95% |
| | `decodeBase64Url(b64str)` → `string` | base64url decode logic | ≥95% |
| | `parseJwt(tokenStr)` → `{success:true, header, payload, sig} \| {success:false, error:{part,code,reason}}` | Discriminated union | ≥95% |
| `claims.ts` | `extractClaims(payload)` → `{standard:{iss?,sub?,aud?,...}, custom:{[key]:any}}` | Standard vs custom claim split | ≥90% |
| | `renderClaimValue(key, value, locale?)` → formatted string | Claim value display | ≥90% |
| `timestamp.ts` | `parseUnixSeconds(ts)` → `Date` | Unix→Date | 100% |
| | `formatTimestamp(date, locale)` → `{iso:string, local:string}` | Intl formatting (injected locale) | ≥90% |
| | `getValidityStatus(iat, exp, nbf, now)` → `{status, expiryCountdown?, exp?, iat?, nbf?}` | Validity state machine (now injected) | ≥95% |
| `verify.ts` | `verifySignature(alg, header, payload, sig, secret\|key, keyFormat, cryptoSubtle)` → `Promise<{verified, error?, code?}>` | WebCrypto routing | ≥85% |
| | Route HMAC (HS256/384/512) and RSA (RS256) and ECDSA (ES256) | Alg dispatch | ≥85% |
| `pem.ts` | `parsePemPublicKey(pemStr)` → `{keyData:Uint8Array, error?}` | PEM structure parsing | ≥90% |

**No localStorage, no Date.now(), no clock reads in domain.** Time is injected; tests are deterministic.

---

### USE-CASE LAYER (Hook)

**File:** `src/components/tools/jwt-decoder/useJwtDecoder.ts`  
**Responsibility:** Manage token input state, parse on change (debounced 200ms), manage verification mode + secret/key input, manage tab choice, **persist UI prefs only** to localStorage under key `'jurepi-jwt-decoder'` (zod-validated).

**Public interface:**

```typescript
export function useJwtDecoder() {
  return {
    // Input state
    token: string;
    setToken: (t: string) => void;

    // Parsed result
    decoded?: { header: any; payload: any; signature: string };
    parseError?: { part: 'header' | 'payload' | 'signature'; reason: string };

    // UI state (persisted)
    tab: 'claims' | 'raw';
    setTab: (t: 'claims' | 'raw') => void;
    verificationMode: 'off' | 'hmac' | 'rsa';
    setVerificationMode: (m: 'off' | 'hmac' | 'rsa') => void;

    // Verification secret/key (in-memory only, NOT persisted)
    secret: string;
    setSecret: (s: string) => void;
    publicKey: string;
    setPublicKey: (k: string) => void;

    // Verification result
    verificationResult?: { verified: boolean; error?: string };
    verifySignature: () => Promise<void>; // Async, runs WebCrypto verify
    isVerifying: boolean;

    // Validity (1s refresh via useEffect)
    validity: { status: 'valid' | 'expired' | 'not_yet_valid' | 'unknown'; expiryCountdown?: string };
  };
}
```

**Persistence contract:** Only `{tab, verificationMode}` to localStorage. Token + secret = never stored. On mount, try load prefs; fail → start fresh (no scary error).

---

### ADAPTER LAYER (Components)

**Directory:** `src/components/tools/jwt-decoder/`  
**Responsibility:** Presentation only. Receive data + callbacks from hook; render via Tailwind/design tokens; forward user input to hook. No parsing, no WebCrypto, no side effects (except user interactions).

| Component | Dependency | Props | Render Logic |
|-----------|-----------|-------|--------------|
| `TokenInput.tsx` | `useJwtDecoder` | `{token, setToken, error}` | Textarea placeholder="Paste JWT…", monospace font, onChange live parse |
| `ColorizedToken.tsx` | none | `{header, payload, sig, error}` | 3-part display: `header.payload.signature` with sun/mint/sky colored sections, truncate long parts, per-part copy button |
| `ClaimsTable.tsx` | none | `{payload, locale}` | Standard claims (iss/sub/aud/exp/iat/nbf/jti/typ/kid) + custom tail, i18n labels via `useTranslations('tools.jwt-decoder.claims')` |
| `TimestampDisplay.tsx` | none | `{exp?, iat?, nbf?, locale}` | Render each timestamp: Unix seconds + human-readable local + UTC, via `formatTimestamp(domain)` |
| `ValidityIndicator.tsx` | none | `{validity, expanded}` | Status badge (✓/⚠/⛔) + countdown text, updates every 1s via hook |
| `VerificationSection.tsx` | none | `{mode, secret, publicKey, result, onModeChange, onSecretChange, onKeyChange, onVerify, isVerifying}` | Collapsible: mode radio buttons, secret/key textarea (no persist), verify button, result badge |
| `ErrorMessage.tsx` | none | `{parseError, unsecuredWarning}` | Precise error text + context, or red banner if alg="none" |
| `JwtDecoder.tsx` (Client) | `useJwtDecoder` + all above | none | **Orchestrator:** owns hook, composes layout (stacked/2-split), wires state → components, handles copy/download, keyboard shortcuts (Ctrl+A/C), 1s validity timer effect |
| `JwtDecoderIntro.tsx` | none | none | SEO H1 + lead, eyebrow "DEVELOPER TOOL" |
| `JwtDecoderHowTo.tsx` | none | none | SEO long-form: "What is JWT, why decode it?" (sync isomorphic useTranslations for SSR) |
| `JwtDecoderFaq.tsx` | none | none | **SINGLE owner of FAQPage JSON-LD**: renders visible `faq.items[]` as `<dl>`, builds FAQPage schema from `useTranslations('tools.jwt-decoder.faq.items')` |
| `JwtDecoderStructuredData.tsx` | none | none | SoftwareApplication JSON-LD ONLY (url==canonical); does NOT emit FAQPage |

**Key rules:**
- `use client` on orchestrator only; SEO components are server-composable (Intro/HowTo/Faq/StructuredData).
- No `useState` for parsed data; hook owns all state.
- Copy/download = async navigator.clipboard (fallback modal).
- Focus ring: `focus-visible:ring-2 ring-offset-2` (NO `focus:` — must be `focus-visible:`).
- Colorized parts = `text-accent-sun-ink` / `text-accent-mint-ink` / `text-accent-sky-ink` (REAL tokens, never phantom `--semantic-*`).
- Validity statuses = REAL tokens: `success` (✓), `warning-ink` (⚠), `danger-ink` (⛔).

---

### FRAMEWORK LAYER

**Route:** `src/app/[locale]/tools/jwt-decoder/page.tsx`  
**Registry:** `src/tools/registry.ts` (1 entry: id/slug/category/icon/accent/status/addedAt/order/keywords)  
**SEO:** Renders `JwtDecoderIntro` + `JwtDecoder` (client island) + `JwtDecoderHowTo` + `JwtDecoderFaq` + `JwtDecoderStructuredData`, ALL OUTSIDE any `mounted` gate.  
**i18n:** `src/i18n/messages/{ko,en}.json` namespace `tools.jwt-decoder.*`

---

## 2. i18n CONTRACT

**Namespace:** `tools.jwt-decoder.*`  
**Required ko/en separation:** Each key has SEPARATE ko and en values (NOT pipe-joined `"ko | en"`).

| Key | ko | en | Context |
|-----|----|----|---------|
| `tools.jwt-decoder.title` | JWT 디코더 | JWT Decoder | Registry title |
| `tools.jwt-decoder.description` | 복잡한 JWT를 한눈에 분석하고 서명을 검증하세요 | Decode JWT tokens, extract claims, verify signatures | Registry description (home card) |
| `meta.title` | JWT 디코더 — 토큰 분석기 | JWT Decoder — Token Analyzer | SEO page title |
| `meta.description` | JWT를 디코드하고 표준 클레임을 추출하며 HMAC/RSA 서명을 검증하세요. 토큰은 브라우저에만 존재합니다. | Decode JWT tokens, extract standard claims, verify HMAC/RSA signatures. Tokens stay in your browser. | SEO description |
| `input.placeholder` | JWT를 붙여넣으세요… | Paste your JWT here… | Textarea placeholder |
| `tabs.claims` | 클레임 | Claims | Tab label (standard claims table) |
| `tabs.raw` | 원본 JSON | Raw JSON | Tab label (full payload) |
| `tabs.header` | 헤더 | Header | Colorized part label |
| `tabs.payload` | 페이로드 | Payload | Colorized part label |
| `tabs.signature` | 서명 | Signature | Colorized part label |
| `claims.title` | 클레임 | Claims | Table heading |
| `claims.standard` | 표준 클레임 | Standard Claims | Table section |
| `claims.custom` | 커스텀 클레임 | Custom Claims | Table section |
| `claims.iss` | 발급자 (Issuer) | Issuer | Claim label |
| `claims.sub` | 주체 (Subject) | Subject | Claim label |
| `claims.aud` | 대상 (Audience) | Audience | Claim label |
| `claims.exp` | 만료 시간 (Expiration) | Expiration Time | Claim label |
| `claims.iat` | 발급 시간 (Issued At) | Issued At | Claim label |
| `claims.nbf` | 이전 사용 불가 (Not Before) | Not Before | Claim label |
| `claims.jti` | JWT ID | JWT ID | Claim label |
| `claims.typ` | 타입 (Type) | Type | Claim label |
| `claims.kid` | 키 ID (Key ID) | Key ID | Claim label |
| `validity.valid` | ✓ 유효 | ✓ Valid | Status badge |
| `validity.expired` | ⛔ 만료됨 | ⛔ Expired | Status badge |
| `validity.notYetValid` | ⌛ 아직 유효하지 않음 | ⌛ Not Yet Valid | Status badge |
| `validity.expiresIn` | {countdown} 후 만료 | Expires in {countdown} | Countdown template (e.g., "2h 34m") |
| `validity.expiredAgo` | {countdown} 전 만료됨 | Expired {countdown} ago | Expired countdown template |
| `validity.validatesIn` | {countdown} 후 유효 | Becomes valid in {countdown} | Not-yet-valid countdown template |
| `unsecured.banner` | 이 JWT는 보안되지 않은 'none' 알고리즘을 사용합니다. 프로덕션에서 사용하지 마세요. | This JWT uses the unsecured 'none' algorithm. Do not use in production. | Unsecured alg warning banner |
| `verification.title` | 서명 검증 (고급) | Signature Verification (Advanced) | Verification section heading |
| `verification.mode.off` | 검증 안 함 | Off | Radio button label |
| `verification.mode.hmac` | HMAC (HS256/384/512) | HMAC (HS256/384/512) | Radio button label |
| `verification.mode.rsa` | RSA/ECDSA (RS256/ES256) | RSA/ECDSA (RS256/ES256) | Radio button label |
| `verification.secret.label` | 서명 키 (hex 또는 base64): | Signing Secret (hex or base64): | HMAC input label |
| `verification.secret.placeholder` | 예: my-secret-key 또는 base64-encoded | e.g., my-secret-key or base64-encoded | HMAC input placeholder |
| `verification.key.label` | 공개 키 (PEM 형식): | Public Key (PEM format): | RSA input label |
| `verification.key.placeholder` | -----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY----- | -----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY----- | RSA input placeholder |
| `verification.button` | 검증 | Verify | Verify button |
| `verification.verified` | ✓ 검증됨 | ✓ Verified | Success badge |
| `verification.failed` | ✗ 검증 실패 | ✗ Verification Failed | Failure badge |
| `verification.unsupported` | ⊘ 지원하지 않는 알고리즘 | ⊘ Unsupported Algorithm | Unsupported alg badge |
| `errors.malformed` | 유효하지 않은 JWT 형식. 세 개의 base64url-인코딩된 부분이 필요합니다. | Invalid JWT format. Expected three base64url-encoded parts separated by '.'. | Malformed structure error |
| `errors.base64` | 유효하지 않은 JWT. 부분: {part}, 오류: 유효하지 않은 base64url 인코딩 | Invalid JWT. Part: {part}, Error: Invalid base64url encoding | Base64 decode error |
| `errors.json` | 유효하지 않은 JWT. 부분: {part}, 오류: 유효하지 않은 JSON | Invalid JWT. Part: {part}, Error: Invalid JSON | JSON parse error |
| `errors.unsupportedAlg` | 검증할 수 없습니다. 알고리즘 '{alg}'은 이 도구에서 지원하지 않습니다. | Verification not available. Algorithm '{alg}' is not supported by this tool. | Unsupported alg error |
| `errors.verificationFailed` | 서명 검증 실패. 이 토큰이 변조되었거나 다른 키로 서명되었을 수 있습니다. | Signature verification failed. This token was either tampered with or signed with a different key. | Verification failure error |
| `errors.pemParsing` | 유효하지 않은 공개 키. PEM 형식을 파싱할 수 없습니다. | Invalid public key. Could not parse PEM format. Ensure the key starts with '-----BEGIN PUBLIC KEY-----'. | PEM parsing error |
| `errors.secretError` | 서명 키를 처리할 수 없습니다. 형식을 확인하고 다시 시도하세요. | Could not process secret. Verify the format and try again. | Secret processing error |
| `copy.success` | 복사됨! | Copied! | Copy toast (success) |
| `copy.error` | 복사 실패 | Copy failed | Copy toast (error) |
| `download.button` | 다운로드 | Download | Download button |
| `download.success` | 다운로드 시작됨 | Download started | Download toast |
| `howTo.title` | JWT란 무엇이고 왜 디코드해야 할까요? | What is JWT and Why Decode It? | HowTo section heading |
| `howTo.items` | `[{q: "...", a: "..."}]` refined paragraphs (NOT raw markdown) | — | HowTo items (array of {q,a}) |
| `faq.title` | 자주 묻는 질문 | Frequently Asked Questions | FAQ section heading |
| `faq.items` | `[{q: "...", a: "..."}]` refined paragraphs (NOT raw markdown) | — | FAQ items array (fed into FAQPage JSON-LD) |

**Constraint:** howTo.items and faq.items are REFINED paragraph arrays, NOT raw markdown blobs. Each `a` is polished prose without `##`/`**` literals.

---

## 3. DESIGN TOKENS & STYLING

**Category accent:** `sun` (var(--accent-sun) / var(--accent-sun-soft))  
**CTA buttons:** Brand honey-gold `bg-brand text-on-brand` (NOT accent)  
**Validity statuses:** REAL tokens ONLY:
- ✓ Valid → `text-success` / `bg-success/10` + `text-on-success`
- ⚠ Not-yet-valid → `text-warning-ink` / `bg-warning/10`
- ⛔ Expired → `text-danger-ink` / `bg-danger/10`

**Colorized token parts:**
- Header: `text-accent-sun-ink` (sun for dev/calculator identity)
- Payload: `text-accent-mint-ink` (mint for text tool distinction)
- Signature: `text-accent-sky-ink` (sky for converter distinction)

**Floating/overlay layers:** explicit `max-w-[Nrem]` NOT `max-w-{sm,md,lg}` (those are 16px in this project and break narrow viewports).

**Focus rings:** ALWAYS `focus-visible:ring-2 ring-offset-2` (NEVER bare `focus:`).

**Error banner (unsecured alg):** `bg-danger/10 border-danger/30 text-danger-ink` (NOT phantom `--semantic-danger`).

**Responsive:** 
- Desktop ≥1024px: 2-col split input/output
- Tablet 768–1023px: 2-col narrower
- Mobile <768px: stacked
- All 320px guard (no overflow)

---

## 4. INVARIANTS

1. **Token & Secret NEVER persisted.** Only `{tab, verificationMode}` to localStorage.
2. **Time is injected.** `getValidityStatus(iat, exp, nbf, now)` receives `now` parameter; no `Date.now()` calls in domain.
3. **Parse debounced 200ms.** Input onChange → no lag.
4. **Validity updates 1s.** `useEffect` with `setInterval` in orchestrator.
5. **Text-node render only.** Token/secret never in `dangerouslySetInnerHTML` (React escapes text automatically).
6. **SEO sections outside `mounted` gate.** Intro/HowTo/Faq/StructuredData render at route level (prerendered), not inside client component.
7. **FAQPage JSON-LD = Faq component only.** Single owner, built from `useTranslations('tools.jwt-decoder.faq.items')`.
8. **WebCrypto injected.** Signature verify receives `crypto.subtle` as parameter for test mockability.

---

## 5. BUILD ORDER (SERIAL → PARALLEL)

**Serial (domain first — domain-engineer):**
1. `src/lib/jwt-decoder/errors.ts` (error types, codes)
2. `src/lib/jwt-decoder/schema.ts` (zod types)
3. `src/lib/jwt-decoder/parse.ts` (splitJwt, decodeBase64Url, parseJwt + tests ≥95%)
4. `src/lib/jwt-decoder/claims.ts` (extractClaims, renderClaimValue + tests ≥90%)
5. `src/lib/jwt-decoder/timestamp.ts` (parseUnixSeconds, formatTimestamp, getValidityStatus with injected `now` + tests ≥95%)
6. `src/lib/jwt-decoder/verify.ts` (verifySignature with injected `crypto.subtle` + tests ≥85%)
7. `src/lib/jwt-decoder/pem.ts` (parsePemPublicKey + tests ≥90%)

**Parallel (once domain API is locked):**
- **UI Engineer:** Components (TokenInput → ColorizedToken → ClaimsTable/TimestampDisplay → ValidityIndicator → VerificationSection → JwtDecoder orchestrator)
- **Platform Engineer:** useJwtDecoder hook, route wiring, registry entry, i18n messages (ko/en)
- **SEO Engineer:** JwtDecoderIntro/HowTo/Faq/StructuredData, meta tags via seo.ts helpers

**Serial (integration):**
8. Route integration: `src/app/[locale]/tools/jwt-decoder/page.tsx` renders all layers (route-owned SEO + client island JwtDecoder)
9. Registry status: `coming_soon` → `live` (once E2E passes)

---

## 6. TEST STRATEGY

**Domain (RED→GREEN, vitest ≥80% branch):**
- `parse.ts`: valid JWT, malformed (not 3 parts, invalid base64url, invalid JSON), edge cases (empty payload)
- `claims.ts`: extract standard, extract custom, renderClaimValue timestamp formatting
- `timestamp.ts`: Unix→Date, formatTimestamp (mock locale), getValidityStatus (inject fixed `now`, test valid/expired/not-yet-valid transitions)
- `verify.ts`: HMAC success/fail (inject mock `crypto.subtle`), RSA/ECDSA success/fail, unsupported alg, PEM errors
- `pem.ts`: valid PEM, missing markers, invalid base64

**Component (RTL + real i18n via NextIntlClientProvider):**
- TokenInput: onChange debounce, error render
- ColorizedToken: 3-part display, truncation, copy buttons
- ClaimsTable: standard claims render, custom claims appear
- TimestampDisplay: Unix + human-readable render per timestamp
- ValidityIndicator: status badge, countdown text, 1s refresh (mock timer)
- VerificationSection: mode selector, secret/key input, verify button, result badge
- JwtDecoder: state flow, keyboard shortcuts, copy/download

**E2E (Playwright scenarios 1–5):**
1. Decode valid JWT → colorized token, claims table, no error
2. Malformed JWT → precise error message per part
3. Unsecured JWT (alg="none") → red warning banner
4. Signature verification HMAC HS256 → ✓ or ✗ result badge
5. Keyboard (Ctrl+A select, Ctrl+C copy), reduce-motion, en locale, 320px viewport

**Visual regression:** 320 / 768 / 1024, both themes, long token, error state, expanded verification section.

**Accessibility:** axe scan, keyboard roving, reduce-motion compliance.

---

## 7. FILE PATHS (Clean Layer Ownership)

**Domain (no imports from react/next):**
```
src/lib/jwt-decoder/
├── schema.ts          # Zod types only
├── errors.ts          # Error codes + builder
├── parse.ts           # Parsing logic
├── claims.ts          # Claims extraction
├── timestamp.ts       # Time formatting (locale injected)
├── verify.ts          # WebCrypto routing (crypto.subtle injected)
└── pem.ts             # PEM parsing
```

**Use-Case (hook):**
```
src/components/tools/jwt-decoder/
├── useJwtDecoder.ts   # State management + localStorage prefs
```

**Adapters (components):**
```
src/components/tools/jwt-decoder/
├── TokenInput.tsx
├── ColorizedToken.tsx
├── ClaimsTable.tsx
├── TimestampDisplay.tsx
├── ValidityIndicator.tsx
├── VerificationSection.tsx
├── ErrorMessage.tsx
├── JwtDecoder.tsx     # Orchestrator (use client)
├── JwtDecoderIntro.tsx
├── JwtDecoderHowTo.tsx
├── JwtDecoderFaq.tsx
└── JwtDecoderStructuredData.tsx
```

**Framework:**
```
src/app/[locale]/tools/jwt-decoder/page.tsx    # Route (RSC, composes all layers)
src/tools/registry.ts                           # 1 entry: jwt-decoder
src/i18n/messages/ko.json                       # tools.jwt-decoder.* ko keys
src/i18n/messages/en.json                       # tools.jwt-decoder.* en keys
```

---

## 8. DEPENDENCY FLOW (Inversion of Control)

**Domain** → **Use-Case** → **Adapters** → **Framework**

- Domain exports pure functions; use-case injects dependencies (now, crypto.subtle).
- Use-case hook provides state + methods; adapters consume.
- Adapters call hook methods on user interaction; compose layout.
- Framework wires hook + adapters + SEO + route.
- NO imports flow outward from domain. Adapters NEVER import from framework layer directly (only via passed props/callbacks).

---

## 9. REGISTRY & SEO METADATA

**Registry entry** (`src/tools/registry.ts`):
```typescript
{
  id: 'jwt-decoder',
  slug: 'jwt-decoder',
  category: 'dev',
  icon: 'KeyRound',                    // or 'Lock'/'Shield' (lucide-react)
  accent: 'sun',
  status: 'coming_soon',                // → 'live' step 10
  addedAt: '2026-07-11',
  order: 105,                           // dev slot, json-formatter=100
  keywords: ['JWT','디코더','토큰','분석','검증','서명','개발','decoder','verify','token','payload','claims','security'],
}
```

**`generateMetadata` function** (route level):
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'tools.jwt-decoder' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      languages: {
        'ko': `/ko/tools/jwt-decoder`,
        'en': `/en/tools/jwt-decoder`,
      },
    },
    // canonical, og, etc. handled by platform shell
  };
}
```

---

## 10. PLATFORM WIREUPS (EXISTING, NO NEW PREREQS)

- **Category `dev`:** Already live (url-encoder, base64-encoder, json-formatter, dev-people).
- **Consent/AdSense:** Inherited from platform shell; tool renders within shared layout.
- **Locale/Theme:** Inherited from platform (next-intl, ConsentProvider, ThemeContext).
- **Error Boundary:** Wrapped at route level by platform.
- **Toast system:** Use platform's Toast hook (if available) or build simple in-component feedback.
- **SEO helpers:** `lib/seo.ts` functions (buildToolEntityMetadata, etc.) — reuse for JSON-LD.

---

## 11. CRITICAL DECISIONS

1. **Verify async but deterministic:** `verifySignature()` is `async` (WebCrypto is async) but deterministic for testing (crypto.subtle injected).
2. **Countdown is localized text:** E.g., "2시간 34분 후 만료" (ko) vs "Expires in 2h 34m" (en) — built from domain countdown duration + i18n template.
3. **Unsecured alg = warning, NOT error:** Token with alg="none" parses fine; red banner marks it unsafe.
4. **Copy fallback:** navigator.clipboard → fallback modal with textarea (silent fail OK for UX).
5. **No token history:** Unlike some tools, jwt-decoder does NOT offer a "recent tokens" list (security/privacy).

---

## Summary

**jwt-decoder** is a developer utility following Jurepi's clean architecture: pure domain layer (parsing, claims, timestamp, WebCrypto-backed verification), injectable use-case layer (hook with 200ms debounce + localStorage UI prefs), presentational adapters (components), and framework integration (route, registry, i18n, SEO).

**Key invariant:** tokens and secrets never persisted, never sent, never logged. Time-dependent logic receives `now` injected; cryptographic verification receives `crypto.subtle` injected. All parsing/claims/timestamp logic ≥80% unit-tested before UI code touches it.

**Build sequence:** domain TDD first (domain-engineer), then parallel UI/platform/SEO (ui/platform/seo engineers), then integration (route/registry/E2E).

**Estimated lines:** domain ~350–400 (7 files), adapters ~600–700 (11 components), hook ~200, route ~100. Total ~1200–1400 TS, ~300 i18n keys.
