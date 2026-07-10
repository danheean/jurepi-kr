# JWT Decoder — Decode and Verify JSON Web Tokens — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **JWT Decoder** — a browser-based tool that pastes a JSON Web Token and instantly decodes its header, payload, and signature with precise error messages. All three parts are colorized (header, payload, signature); standard claims (iss, sub, aud, exp, iat, nbf, jti) are highlighted in a claims table with expiry status (valid / expired / not yet valid) and human-readable timestamps (local + UTC, live-ticking countdown). Optional signature verification via WebCrypto (HMAC HS256/384/512 with user-pasted secret; RSA RS256 or ECDSA ES256 with PEM public key). Privacy invariant: tokens and secrets never leave the browser (zero network), never persisted to localStorage.
> Internal service codename: `jwt-decoder`. Registry id: `jwt-decoder`. Public URL slug: `/[locale]/tools/jwt-decoder`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/dev/json-formatter/SPEC.md`](./json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>JWT Decoder — Decode and Verify JSON Web Tokens (Jurepi tool, codename jwt-decoder, registry id jwt-decoder)</project_name>

<overview>
JWT Decoder is an essential security and debugging utility for developers: paste a JSON Web Token (JWt, three base64url-encoded parts separated by dots) and instantly decode the header and payload into human-readable JSON with precise error detection (malformed structure, invalid base64url, invalid JSON). The tool colorizes all three parts (header.payload.signature) and renders a **claims table** extracting standard claims (iss, sub, aud, exp, iat, nbf, jti) with well-known labels and explanations; expiry dates (exp, iat, nbf) are rendered as both ISO UTC and local human-readable time (e.g., "Tuesday, Jul 8, 2026 at 2:34 PM UTC") with a **live validity indicator** (green checkmark if valid and not expired, yellow warning if not-yet-valid, red alert if expired, refreshing every second to show countdown).

Optional **signature verification** (secondary, in-scope but clearly marked as best-effort) allows users to paste a signing secret (for HMAC HS256/384/512 via WebCrypto `crypto.subtle.sign`) or a PEM-formatted public key (RSA RS256 or ECDSA ES256); if the token verifies, a ✓ badge appears; if it fails or the algorithm is not supported, an honest "verification not possible" message appears (never a fake ✓). Alg "none" (unsecured) triggers an explicit security warning banner.

CRITICAL (client-only, zero network): 100% client-side, no backend. Tokens and secrets are NEVER sent anywhere; they remain in the browser and are NEVER persisted to localStorage (this is a deliberate exception to the usual persistence pattern — cryptographic material must never be stored). The only state persisted is UI preferences (tab choice: claims vs. raw, theme). All parsing happens via base64url decoding (via `atob` + polyfill for URL-safe chars, or native Uint8Array.from) and JSON.parse; verification runs entirely via WebCrypto.

CRITICAL (SPA, usability-first): per the platform rule, every Jurepi tool is a client-side SPA. All interaction — token paste, tab switch, secret/key paste, copy, download — happens via local React state with no route navigation. The tool shell is statically generated (SSG) for SEO; the interactive decoder is a single client component.

CRITICAL (security/privacy): tokens and secrets are NEVER persisted, logged, or sent to any server. If the user pastes a token, the tool decodes it locally only. If the user pastes a secret or key for verification, both the token and secret are held in React state in-memory and discarded on unmount / unload. No background syncing, no service workers with caching of sensitive data.

CRITICAL (honest error reporting): malformed tokens (not 3 parts, invalid base64url, invalid JSON, unsupported alg) must show precise, developer-friendly error messages with the exact part that failed and the offending character/context.
</overview>

<platform_integration>
  - Route: /[locale]/tools/jwt-decoder (SSG; registry slug "jwt-decoder", id "jwt-decoder", status "coming_soon", accent "sun", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.jwt-decoder.*` (UI chrome strings: input placeholder, tab labels, claim explanations, error messages, copy toast, signature verification UI, how-to, FAQ — NOT token data; that comes from user input).
  - NOTE (updated 2026-07-04): the `'dev'` category is ALREADY live in the platform (url-encoder, base64-encoder, json-formatter, dev-people ship under it — i18n label, `CATEGORY_ORDER`, `FOOTER_CATEGORIES` all wired). No platform prerequisite remains; this tool only adds its own registry entry.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - JWT input (raw string: three base64url-encoded parts separated by dots) via a large textarea or paste area.
    - Live decoding: split into 3 parts, base64url-decode each, JSON.parse each → header + payload + signature (raw).
    - Colorized 3-part display: header.payload.signature with distinct colors (sun accent for header/footer distinction, mint for payload).
    - Claims table: extract well-known claims from payload (iss, sub, aud, exp, iat, nbf, jti, typ, kid, custom claims tail). Provide explanatory tooltips or labels (e.g., "iss: Issuer identifier", "exp: Token expiry time").
    - Timestamp rendering: for exp/iat/nbf, convert Unix epoch (seconds) to both ISO 8601 UTC and human-readable local time (using Intl.DateTimeFormat per user locale).
    - Validity indicator: live refresh (every 1s) comparing current time to exp/iat/nbf; show status badge (valid ✓ / expired ⚠ / not-yet-valid ⌛) with countdown to expiry or start time.
    - Optional signature verification: secondary UI (togglable advanced section). HS256/384/512: user pastes hex or base64 secret → verify with WebCrypto. RS256/ES256: user pastes PEM public key → verify. Display result (✓ valid / ✗ invalid / ⊘ unsupported alg or error).
    - Alg="none" warning: explicit banner if the token's alg header is "none" — "This token is unsecured (alg: none). Do not use in production."
    - Copy buttons: copy header/payload as JSON, copy entire token, copy verification result.
    - Download button: download token as .txt or JSON object with parsed fields.
    - Keyboard support: Ctrl+A select all, Ctrl+C copy selected part.
    - localStorage persistence: remember user's last tab choice (claims vs. raw), verification mode (off / HMAC / RSA) — NOT token/secret.
    - Tool-specific SEO long-form ("What is JWT?") + FAQ + SoftwareApplication JSON-LD, ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - Token generation (creating JWTs) — decode-only tool.
    - Custom claim interpretation (tool explains standard claims only; custom claims appear in the table but no special logic).
    - Asymmetric key generation or storage.
    - Batch JWT validation (one token at a time).
    - OAuth/OIDC validation (tool does not validate OIDC discovery, userinfo, or issuer endpoints).
    - Backend API calls for verification (all verification is client-side WebCrypto only).
    - Certificate chain validation for RS256 (user provides raw public key PEM; tool verifies signature only).
  </out_of_scope>
  <future_considerations>
    - Ed25519 / EdDSA support (Phase 2, if WebCrypto support becomes widespread).
    - JWT refresh token helper (timing, rotate strategy) — Phase 2.
    - OpenID Connect / OAuth 2.0 discovery validation — Phase 3.
    - Batch token validation (multiple tokens) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <parsing>base64url decode (atob + swap +/→-_, or Uint8Array.from + TextDecoder). JSON.parse on each part. Error tracking: line/col on invalid JSON, specific error on base64url decode failure (invalid char, wrong padding).</parsing>
    <claims_extraction>Payload is a JSON object; extract keys iss, sub, aud, exp, iat, nbf, jti, typ, kid; render as table rows with i18n labels + values. Render exp/iat/nbf as both Unix epoch (for reference) and human-readable local time.</claims_extraction>
    <timestamp_rendering>Intl.DateTimeFormat per user's locale (via useLocale() from platform i18n), convert Unix seconds to JavaScript Date, render in local timezone + UTC offset.</timestamp_rendering>
    <validity_indicator>Live timer (setInterval 1s) comparing Date.now() to exp*1000 (convert Unix seconds to ms). Show status: within (iat, exp) → valid ✓; before iat → ⌛ coming; after exp → ⚠ expired. Calculate countdown string.</validity_indicator>
    <signature_verification>WebCrypto crypto.subtle: detectAlg from header.alg; if HS256/384/512, derive key from user-pasted secret (TextEncoder + crypto.subtle.importKey); if RS256/ES256, parse PEM public key + importKey; call crypto.subtle.verify with message = `header.payload` (without signature). Render result or error. Graceful fail (unsupported alg) with honest message.</signature_verification>
    <pem_parsing>Simple PEM parser: extract base64 between "-----BEGIN PUBLIC KEY-----" / "-----END PUBLIC KEY-----" markers; decode to raw X.509 SubjectPublicKeyInfo; supply to importKey with format: "spki".</pem_parsing>
    <copy>navigator.clipboard.writeText() with textarea fallback; silent fail on error (copy is secondary).</copy>
    <download>Blob → URL → a[href] trick, synthetic click.</download>
  </module_specific>
  <libraries>
    <base64url>Native browser atob/btoa with polyfill for URL-safe (-_) character swap, or use Uint8Array + TextDecoder for robustness.</base64url>
    <webcrypto>Crypto.subtle (HMAC, RSA, ECDSA); no external crypto library.</webcrypto>
    <zod>zod v3.x for UI state schema (tab choice, verification mode, etc.).</zod>
  </libraries>
  <note>CRITICAL: NO backend, NO first-party API, NO DB, NO token/secret logging or persistence.</note>
</technology_stack>

<file_structure>
src/
├── lib/jwt-decoder/                       # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: JwtParts, Claims, VerificationOptions, VerificationResult
│   ├── parse.ts                           # splitJwt(tokenStr), decodeBase64Url(b64str), parseJwt(tokenStr): {header, payload, signature, error?}
│   ├── claims.ts                          # extractClaims(payload), renderClaimValue(key, value): string
│   ├── timestamp.ts                       # parseUnixSeconds(ts): Date; formatTimestamp(date, locale): {iso, local}; getValidityStatus(iat, exp, nbf): {status, expiryCountdown}
│   ├── verify.ts                          # verifySignature(header, payload, signature, secret/key, keyFormat): {verified, error?}
│   ├── pem.ts                             # parsePemPublicKey(pemStr): {keyData, error?}
│   └── errors.ts                          # Typed error codes: malformed_structure / invalid_base64 / invalid_json / unsupported_alg / verification_failed
├── components/tools/jwt-decoder/
│   ├── JwtDecoder.tsx                     # Orchestrator (Client Component) — state owner
│   ├── useJwtDecoder.ts                   # Hook: token state, verification state, localStorage
│   ├── TokenInput.tsx                     # Large textarea, live onChange → parse
│   ├── ColorizedToken.tsx                 # 3-part display: header.payload.signature (color-coded)
│   ├── ClaimsTable.tsx                    # Tabular display of standard claims with explanations
│   ├── TimestampDisplay.tsx               # Render exp/iat/nbf as local + UTC times
│   ├── ValidityIndicator.tsx              # Live badge (✓ valid / ⚠ expired / ⌛ not-yet-valid) + countdown
│   ├── VerificationSection.tsx            # Toggle + HS/RS mode selector + secret/key input + result badge
│   ├── ErrorMessage.tsx                   # Precise error: "Part: <header|payload|signature>, Error: <specific reason>"
│   ├── JwtDecoderIntro.tsx                # H1 + lead (SEO long-form)
│   ├── JwtDecoderHowTo.tsx               # "What is JWT and why decode it?" (SEO)
│   ├── JwtDecoderFaq.tsx                 # FAQ + FAQPage JSON-LD
│   └── JwtDecoderStructuredData.tsx      # SoftwareApplication JSON-LD (route renders; Faq does not emit FAQPage)
└── i18n/messages/{ko,en}.json             # tools.jwt-decoder.* UI chrome
</file_structure>

<core_data_entities>
  <jwt_parts>
    - header: {alg, typ?, kid?, ...custom} — decoded JSON from header part
    - payload: {iss?, sub?, aud?, exp?, iat?, nbf?, jti?, ...custom} — decoded JSON from payload
    - signature: string — raw base64url-encoded signature (not decoded)
  </jwt_parts>
  <claims>
    - iss (Issuer): issuing party identifier (string, usually a URL)
    - sub (Subject): the principal (user ID, etc.)
    - aud (Audience): intended recipient(s) (string or array)
    - exp (Expiration Time): Unix seconds; token invalid after
    - iat (Issued At): Unix seconds; when token was created
    - nbf (Not Before): Unix seconds; token invalid before
    - jti (JWT ID): unique token ID
    - typ: token type (usually "JWT")
    - kid: key ID (which signing key was used)
    - custom claims: any additional payload fields
  </claims>
  <ui_state>
    - token: string — raw JWT input
    - decoded?: {header, payload, signature} — parsed result or null if error
    - error?: string — friendly error message
    - tab: enum (claims, raw) — active view (claims table vs. full JSON)
    - verificationMode: enum (off, hmac, rsa) — signature verification mode
    - secret?: string — user-pasted HMAC secret (held in-memory only, never persisted)
    - publicKey?: string — user-pasted PEM public key (in-memory only)
    - verificationResult?: {verified: boolean, error?: string}
    INVARIANT: token and secrets are NEVER stored to localStorage. Only UI prefs (tab, verificationMode) persist.
  </ui_state>
  <validity_status>
    - status: enum (valid, expired, not_yet_valid, unknown)
    - expiryCountdown?: string — human-readable "expires in 2h 34m" or "expired 1h ago"
    - exp?: number — Unix seconds (exp claim)
    - iat?: number — Unix seconds (iat claim)
    - nbf?: number — Unix seconds (nbf claim)
  </validity_status>
  <constants>
    - CLAIM_DESCRIPTIONS: map {claim_key: i18n_key} for rendering labels
    - SUPPORTED_ALGS: ["HS256", "HS384", "HS512", "RS256", "ES256"] — WebCrypto supported
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/jwt-decoder" page="JwtDecoder (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <jwt_decoder>                             <!-- "use client"; owns token + verification state + useJwtDecoder() -->
    <jwt_decoder_intro />                   <!-- H1 + lead (server-render where possible) -->
    <decoder_container>                     <!-- Stacked or 2-split layout -->
      <token_input />                       <!-- Textarea: live onChange → debounced parse -->
      <colorized_token />                   <!-- 3-part display if valid -->
      <error_message />                     <!-- Precise error if malformed -->
      <unsecured_warning />                 <!-- If alg="none" -->
      <validity_indicator />                <!-- Live status badge + countdown -->
      <output_tabs>                         <!-- Claims / Raw JSON tabs -->
        <claims_table />                    <!-- Standard claims + explanations if tab="claims" -->
        <timestamp_display />               <!-- exp/iat/nbf rendered as local + UTC -->
        <raw_json />                        <!-- Pretty-printed full payload if tab="raw" -->
      </output_tabs>
      <verification_section />              <!-- Advanced: mode selector, secret/key input, result -->
      <copy_download_buttons />            <!-- Copy parts, copy result, download -->
    </decoder_container>
    <jwt_decoder_how_to />                  <!-- SEO long-form -->
    <jwt_decoder_faq />                     <!-- FAQPage JSON-LD -->
  </jwt_decoder>
</component_hierarchy>

<pages_and_interfaces>
  <jwt_decoder_intro>
    - Eyebrow: "개발자 도구" / "DEVELOPER TOOL" — 12px/700, var(--brand).
    - H1: "JWT 디코더" / "JWT Decoder" — Gmarket Sans clamp(28px,5vw,40px)/700.
    - Lead: "복잡한 JWT를 한눈에 분석하고 서명을 검증하세요. 토큰은 절대 저장되지 않습니다." / equivalent EN.
  </jwt_decoder_intro>

  <token_input>
    - Large textarea, full width (desktop) or mobile stacked, placeholder "JWT를 붙여넣으세요…" / "Paste your JWT here…", monospace font (Menlo/Monaco/Courier New fallback).
    - Live onChange debounced 200ms → parse (no debounce visual lag).
  </token_input>

  <colorized_token>
    - If valid: display `header.payload.signature` with three distinct colored sections (sun accent for structural parts, mint for distinction). Each part truncated if very long (e.g., "eyJhbGc…IkpXVCJ9.eyJzdWI…WQpSjJUbkJ1V0xoSXlCVEY2V2c.TJVA95U…" with tooltip showing full).
    - Copy button per part.
  </colorized_token>

  <unsecured_warning>
    - If decoded header.alg === "none": red banner (danger color, var(--semantic-danger)) with 🔓 icon: "This JWT uses the unsecured 'none' algorithm. Do not use in production."
  </unsecured_warning>

  <validity_indicator>
    - Status badge: ✓ (green, var(--semantic-success)) if valid; ⚠ (orange, var(--semantic-warning)) if not-yet-valid; ⛔ (red, var(--semantic-danger)) if expired.
    - Countdown text: "Expires in 2 hours, 34 minutes" / "Expired 1 hour ago" / "Becomes valid in 5 minutes" — updates every 1 second.
    - Tap to see full exp/iat/nbf timestamps.
  </validity_indicator>

  <claims_table>
    - Two-column table: Claim (iss, sub, aud, etc.) and Value.
    - Standard claims (iss, sub, aud, exp, iat, nbf, jti, typ, kid) appear first with i18n labels and descriptions (tooltip or sidebar).
    - Custom claims appear below ("Custom claims" header).
    - exp/iat/nbf: show both Unix seconds and human-readable local time (e.g., "1720376400 (Tuesday, Jul 9, 2026, 2:00 PM UTC)").
  </claims_table>

  <verification_section>
    - Collapsed by default (advanced section); [+] expands.
    - Mode selector: radio buttons or tabs (Off / HMAC / RSA).
    - If HMAC: input field for secret (placeholder "Paste secret (hex or base64)"); label "Secret:".
    - If RSA: textarea for PEM public key (placeholder "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----").
    - [Verify] button: triggers signature check via WebCrypto.
    - Result badge: ✓ verified (green) / ✗ verification failed (red) / ⊘ unsupported alg or error (gray, tooltip with reason).
  </verification_section>

  <error_message>
    - If parse fails: "Invalid JWT. Part: <header|payload|signature>, Error: <specific reason>" (e.g., "Invalid JWT. Part: payload, Error: invalid JSON (line 1, col 8: unexpected token '}'). Context: …").
    - Also shown if malformed structure (not 3 parts).
  </error_message>

  <keyboard_shortcuts>
    - Ctrl+A (or Cmd+A) → select all input
    - Ctrl+C (Cmd+C) → copy selected part or full token (if focus on colorized display)
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <parsing note="live, debounced 200ms">
    - splitJwt(tokenStr): split by '.', validate 3 parts, return {header, payload, signature, error?}.
    - decodeBase64Url(b64str): replace -→+, _→/, pad if needed, atob, catch → error.
    - parseJwt(tokenStr): for each part, base64url-decode + JSON.parse; if any fails, return { success: false, error: {part, reason} }; else { success: true, header, payload, signature }.
  </parsing>

  <claims_extraction>
    - extractClaims(payloadObj): return subset { iss, sub, aud, exp, iat, nbf, jti, typ, kid } if present, plus all other keys as customClaims.
    - renderClaimValue(key, value): if key ∈ {exp, iat, nbf} and value is number, return "{Unix seconds} ({localDatetime} UTC)"; else JSON.stringify(value, null, 2).
  </claims_extraction>

  <timestamp_rendering>
    - parseUnixSeconds(ts): new Date(ts * 1000).
    - formatTimestamp(date, locale): use Intl.DateTimeFormat(locale, {weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'UTC'}) → "Tuesday, Jul 8, 2026 at 2:34:56 PM UTC" and also show local timezone.
  </timestamp_rendering>

  <validity_status>
    - getValidityStatus(iat, exp, nbf): compare Date.now()/1000 to iat/exp/nbf; return { status: 'valid'|'expired'|'not_yet_valid'|'unknown', expiryCountdown?: string }.
    - Live update every 1s: re-run check, update countdown text.
  </validity_status>

  <signature_verification>
    - verifySignature(tokenStr, secret|publicKey, keyFormat): decode header.alg; route to crypto.subtle.sign/verify based on alg.
    - HMAC HS256/384/512: TextEncoder(secret) → derive key via crypto.subtle.importKey({format:'raw', algorithm:{name:'HMAC', hash:'SHA-256'|'SHA-384'|'SHA-512'}, extractable:false, usages:['sign']}) → crypto.subtle.verify(algo, key, signature_bytes, message_bytes).
    - RSA RS256: parse PEM public key → importKey({format:'spki', algorithm:{name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, extractable:false, usages:['verify']}) → verify.
    - ECDSA ES256: parse PEM → importKey({format:'spki', algorithm:{name:'ECDSA', hash:'SHA-256'}, extractable:false, usages:['verify']}) → verify.
    - On success: return {verified: true}. On failure: return {verified: false, error: 'Signature verification failed.'} or {verified: false, error: 'Unsupported algorithm: …'}.
  </signature_verification>

  <pem_parsing>
    - parsePemPublicKey(pemStr): extract substring between "-----BEGIN PUBLIC KEY-----" and "-----END PUBLIC KEY-----", base64-decode, return Uint8Array. Error if markers missing or invalid base64.
  </pem_parsing>

  <persistence>
    - Mount: read `jurepi-jwt-decoder` from localStorage → zod parse → load tab choice + verificationMode; fail → start fresh.
    - Change: debounced setItem after every option change. CRITICAL: token and secrets NEVER stored.
  </persistence>

  <i18n>All UI chrome from tools.jwt-decoder.* (ko/en): labels, claim descriptions, error messages, toasts, how-to, FAQ. JWT data is locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <malformed_jwt>
    - Not 3 parts → "Invalid JWT format. Expected three base64url-encoded parts separated by '.'."
    - Invalid base64url → "Invalid JWT. Part: <header|payload|signature>, Error: Invalid base64url encoding (unexpected character '<char>')."
    - Invalid JSON in header or payload → "Invalid JWT. Part: <payload>, Error: Invalid JSON (line X, col Y: unexpected token '<token>'). Context: …"
  </malformed_jwt>
  <unsupported_alg>
    - Alg not in [HS256, HS384, HS512, RS256, ES256] → "Verification not available. Algorithm '<alg>' is not supported by this tool."
  </unsupported_alg>
  <verification_failure>
    - Signature does not match → "Signature verification failed. This token was either tampered with or signed with a different key."
    - PEM parsing error → "Invalid public key. Could not parse PEM format. Ensure the key starts with '-----BEGIN PUBLIC KEY-----'."
    - Secret derivation error → "Could not process secret. Verify the format and try again."
  </verification_failure>
  <storage_error>
    - localStorage unavailable (private mode) → prefs in-memory, no scary error. Tool fully functional.
  </storage_error>
  <note>Tokens and secrets are never logged or reported to any external service.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SUN (var(--accent-sun) / var(--accent-sun-soft)) — "dev" category identity per DESIGN. Intro icon tile, colorized token header/footer distinction, validity indicator (success state).
    - CTAs (buttons) stay brand honey-gold var(--brand) (Verify/Copy/Download). Accent = identity for structure.
    - Colorized token: header var(--accent-sun), payload var(--accent-mint), signature var(--accent-sky), separators var(--text-muted).
    - Validity statuses: ✓ var(--semantic-success), ⚠ var(--semantic-warning), ⛔ var(--semantic-danger).
    - Unsecured warning: var(--semantic-danger) background, danger-soft.
  </accent_usage>
  <layout>Textarea (input), output (colorized + claims/raw tabs) stacked or 2-split. Desktop ≥1024px: 2-split (50/50). Mobile <768px: stacked.</layout>
  <typography>H1 Gmarket Sans; textarea/output monospace (Menlo/Monaco/Courier New); UI labels/buttons Pretendard.</typography>
  <motion>transform/opacity only: tab switch 150ms cross-fade, validity countdown smooth text update, advanced section expand 200ms. All gated by prefers-reduced-motion.</motion>
  <responsive>≥1024px: 2-col split; 768–1023px: 2-col narrower; <768px: stacked. No overflow (320 guard).</responsive>
  <atmosphere>Technical and secure: monospace I/O, precise error messages, explicit security warnings (unsecured alg), honest "cannot verify" states. Not decorative or playful.</atmosphere>
</aesthetic_guidelines>

<security_considerations>
  <tokens note="never persist, never send">
    - Tokens are user-supplied data (credentials), not code. But they may contain sensitive info (user ID, email, claims). Display as text nodes (React escapes); never inject into HTML.
    - Tokens are NEVER persisted to localStorage, cookies, IndexedDB, or any browser storage.
    - Tokens are NEVER sent to any server, proxy, logging service, or analytics.
    - On page unload, token state is discarded (React unmount).
  </tokens>
  <secrets note="zero persistence">
    - HMAC secrets and RSA/ECDSA private/public keys are held in React state in-memory only. They are NEVER persisted.
    - On unload, secret state is discarded.
    - The tool never attempts to store keys (even encrypted) — this is a cryptography safety boundary.
  </secrets>
  <webcrypto note="browser native">
    - All signature verification uses WebCrypto (crypto.subtle), which is a browser native API with no external dependencies.
    - Keys are never exposed; crypto.subtle operations are constant-time (secure against timing attacks, hardware-dependent).
    - Browser vendor is responsible for WebCrypto security.
  </webcrypto>
  <privacy>Input (JWT) never sent except to the user's own device. No remote analytics, logging, or third-party APIs. Verification secrets never leave the browser.</privacy>
  <performance>Parsing debounced 200ms; verification is WebCrypto (native, hardware-accelerated where available). No memory leaks.</performance>
  <pem_parsing note="no external libraries">
    - PEM is parsed with string methods (split, substring, indexOf) — no regex or XML parsing. Simple and robust.
  </pem_parsing>
  <note>No secrets, no network, no external logging. This tool does not require credentials or keys to be entered; verification is optional and the tool is fully functional in "decode-only" mode.</note>
</security_considerations>

<advanced_functionality>
  <colorized_token_display>Three distinct colored sections (header.payload.signature) make JWT structure clear at a glance.</colorized_token_display>
  <claims_table>Standard claims extracted and labeled with explanations; exp/iat/nbf shown in both Unix and human time.</claims_table>
  <live_validity_indicator>Real-time validity status (valid / expired / not-yet-valid) with countdown to expiry; refreshes every 1 second.</live_validity_indicator>
  <optional_signature_verification>WebCrypto support for HMAC and RSA/ECDSA; graceful fallback for unsupported algorithms.</optional_signature_verification>
  <unsecured_jwt_warning>Explicit warning if alg="none" (unsecured token) — production security risk.</unsecured_jwt_warning>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Decode valid JWT, see claims and validity</description>
    <steps>
      1. Paste a valid JWT (e.g., from jwt.io example): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
      2. Parse succeeds → colorized token displays header.payload.signature; claims tab shows iss, sub, name (custom), iat rendered as "Tuesday, Jan 1, 2018, 10:20:02 PM UTC".
      3. Validity indicator shows ✓ valid (no expiry set in example).
      4. Copy button works (copies payload JSON).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Decode malformed JWT, see precise error</description>
    <steps>
      1. Paste invalid JWT: "not.two.parts.four"
      2. Parse fails → error "Invalid JWT format. Expected three base64url-encoded parts separated by '.'."
      3. Paste another: "eyJhbGciOiJIUzI1NiJ9.invalid!!!.signature"
      4. Error "Invalid JWT. Part: payload, Error: Invalid base64url encoding (unexpected character '!')."
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Unsecured JWT warning, expiry countdown</description>
    <steps>
      1. Craft a JWT with alg="none" and exp field set to 5 minutes from now.
      2. Decode → red warning banner "This JWT uses the unsecured 'none' algorithm."
      3. Validity indicator shows ⌛ "Becomes valid in X seconds" (if nbf is set) or ✓ valid (if not).
      4. Wait or re-render; countdown updates every 1 second.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Signature verification (HMAC)</description>
    <steps>
      1. Paste a JWT signed with HS256.
      2. Expand [Advanced] → select Mode: HMAC.
      3. Paste the signing secret (e.g., "my-secret").
      4. Click [Verify] → ✓ verified badge appears (or ✗ failed if secret is wrong).
      5. Copy verification result.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Keyboard shortcuts, reduced-motion, i18n</description>
    <steps>
      1. Paste JWT, Ctrl+A → select all input.
      2. Focus colorized token, Ctrl+C → copy to clipboard (success toast).
      3. prefers-reduced-motion ON → tab switch instant (no fade anim), validity countdown updates without animation.
      4. Switch locale to /en → UI labels switch (Claims / Raw, Verify, etc.).
      5. axe scan → no violations.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Paste JWT → split and decode header/payload/signature; parse errors precise (part + reason); claims table with standard claims labeled and exp/iat/nbf in human time; validity indicator live-updating every 1s; optional signature verification via WebCrypto (HMAC, RSA, ECDSA) with honest success/failure; unsecured alg warning; copy + download.</functionality>
  <user_experience>Keystroke → parse in ≤200ms visible (no lag); colorized token instantly clear; copy toast; download immediate; ≥44px targets; visible focus; SPA — no route reload; tokens and secrets never persisted.</user_experience>
  <technical_quality>lib/jwt-decoder/* pure ≥80% unit coverage (parse, claims, timestamp, verify); TS 0 errors; <800 lines per file; error message test fixtures (malformed JWTs).</technical_quality>
  <visual_design>DESIGN.md compliant; sun accent identity; monospace I/O (readable); precise error messages; security warnings bold.</visual_design>
  <accessibility>Full keyboard (Ctrl+shortcuts); roving focus; aria-labels; reduce-motion: no fade/countdown anim; WCAG 2.1 AA contrast; prerendered SEO/FAQ.</accessibility>
  <performance>Tool route within platform budget; debounced parse; WebCrypto verification (hardware-accelerated); copy/download no fetch; LCP < 2.5s.</performance>
  <security>No XSS: text-node render only. Tokens and secrets NEVER persisted or sent. WebCrypto verification native. Honest "cannot verify" for unsupported algs. Explicit unsecured JWT warning.</security>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/jwt-decoder pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry
    {
      id: 'jwt-decoder',
      slug: 'jwt-decoder',
      category: 'dev',
      icon: 'KeyRound',           // or 'Lock' / 'Shield' — lucide-react
      accent: 'sun',
      status: 'coming_soon',
      addedAt: '2026-07-10',
      order: 30,                  // demand-based, after json-formatter (25)
      keywords: ['JWT','디코더','토큰','분석','검증','서명','개발','decoder','verify','token','payload','claims','security'],
    },
    // No platform prerequisite: 'dev' category is already fully wired.
    ```
  </platform_registry_change>
  <critical_paths>
    1. Base64url decode + JSON parse (foundation).
    2. Claims extraction and standard-claim labeling.
    3. Unix timestamp → local datetime formatting (via Intl.DateTimeFormat).
    4. Live validity indicator (1s refresh, exp/iat/nbf comparison).
    5. WebCrypto signature verification (HMAC, RSA, ECDSA routes).
    6. PEM public key parsing.
    7. Precise error reporting (part + reason).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/jwt-decoder/{parse, claims, timestamp, verify, pem, schema, errors}.ts (Vitest ≥80%).
    2. tools.jwt-decoder.* messages (ko/en): labels, claim descriptions, error messages, button text, how-to, FAQ.
    3. TokenInput + ColorizedToken + ErrorMessage (controlled input, live parse).
    4. ClaimsTable + TimestampDisplay (formatting, Intl usage).
    5. ValidityIndicator (live 1s timer).
    6. VerificationSection (WebCrypto integration, mode selector).
    7. useJwtDecoder hook (state management, localStorage for UI prefs only).
    8. JwtDecoder orchestrator + keyboard shortcuts.
    9. Intro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    10. Registry status→live; slug→component + generateMetadata branches.
    11. Keyboard/reduce-motion/a11y pass; axe scan.
    12. E2E 1–5 scenarios; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>
    - Unit (Vitest ≥80%): parse (valid/malformed/edge cases), base64url decode (valid/invalid chars), claims extraction, timestamp formatting (Unix→local), verify (HMAC/RSA/ECDSA success/fail, unsupported alg), pem parsing (valid/invalid).
    - Component: TokenInput state, ColorizedToken rendering, ClaimsTable + TimestampDisplay, ValidityIndicator live timer, VerificationSection mode/result.
    - E2E (Playwright): scenarios 1–5 (decode, error, unsecured warning, verify HMAC, keyboard/reduce-motion).
    - Visual regression: 320/768/1024 both themes, long token, error state, expanded verification section.
    - A11y: axe + keyboard (Ctrl shortcuts) + reduce-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
