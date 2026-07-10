# JWT 디코더 — JSON Web Token 디코딩 및 검증 — 서비스 SPEC

> 이 문서는 **정본(한국어 번역)**입니다. AI 코딩 에이전트가 소비하는 정본은 [`SPEC.md`](SPEC.md)(영문)입니다. 양쪽을 동기 상태로 유지하세요.
>
> **JWT 디코더** 빌드 명세 — JSON Web Token을 붙여넣으면 헤더, 페이로드, 서명을 순시에 디코딩하고 정밀한 에러 메시지를 표시하는 브라우저 기반 도구입니다. 세 부분(header.payload.signature)이 모두 컬러화되고, 표준 클레임(iss, sub, aud, exp, iat, nbf, jti)이 클레임 테이블에서 강조됩니다. 만료 상태(유효 / 만료됨 / 아직 유효하지 않음)를 보여주고 인간 친화적 타임스탬프(현지 시간 + UTC, 실시간 만료 타이머)를 표시합니다. 선택적 서명 검증은 WebCrypto를 통해 (HMAC HS256/384/512 with 사용자 입력 시크릿; RSA RS256 또는 ECDSA ES256 with PEM 공개키). 프라이버시 불변식: 토큰과 시크릿은 절대 브라우저 밖으로 나가지 않음(제로 네트워크), localStorage에 절대 저장되지 않음.
> 내부 서비스 코드명: `jwt-decoder`. 레지스트리 id: `jwt-decoder`. 공개 URL 슬러그: `/[locale]/tools/jwt-decoder`.
>
> 이 SPEC은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO 인프라, 디자인 토큰은 플랫폼에서 제공됩니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 SPEC(같은 패턴): [`docs/services/dev/json-formatter/SPEC.md`](./json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>JWT 디코더 — JSON Web Token 디코딩 및 검증 (Jurepi 도구, 코드명 jwt-decoder, 레지스트리 id jwt-decoder)</project_name>

<overview>
JWT 디코더는 개발자를 위한 필수 보안 및 디버깅 유틸리티입니다: JSON Web Token(JWT, 점으로 구분된 세 개의 base64url 인코딩 부분)을 붙여넣으면 헤더와 페이로드를 순시에 인간 친화적 JSON으로 디코딩하고 정밀한 에러 감지(잘못된 구조, 유효하지 않은 base64url, 유효하지 않은 JSON)를 수행합니다. 도구는 세 부분을 모두 컬러화(header.payload.signature)하고 **클레임 테이블**을 렌더하며 표준 클레임(iss, sub, aud, exp, iat, nbf, jti)을 추출하고 잘 알려진 라벨과 설명을 표시합니다. 만료 날짜(exp, iat, nbf)는 ISO UTC와 현지 인간 친화적 시간 모두로 렌더되며(예: "화요일, 2026년 7월 8일, 오후 2:34 UTC") **실시간 유효성 표시기**(유효하지 않으면 초록 체크, 아직 유효하지 않으면 노란 경고, 만료되면 빨간 알람, 매초 새로고침되며 만료까지의 카운트다운 표시)가 있습니다.

선택적 **서명 검증**(보조, 범위 내이지만 명확히 표시, best-effort)은 사용자가 서명 시크릿(HMAC HS256/384/512용 WebCrypto `crypto.subtle.sign`)이나 PEM 형식 공개키(RSA RS256 또는 ECDSA ES256용)를 붙여넣을 수 있게 합니다. 토큰을 검증하면 ✓ 배지가 나타나고, 실패하거나 알고리즘이 지원되지 않으면 정직한 "검증 불가능" 메시지가 나타납니다(거짓 ✓ 절대 아님). 알고리즘 "none"(보안되지 않은)은 명시적 보안 경고 배너를 트리거합니다.

CRITICAL(클라이언트 전용, 제로 네트워크): 100% 클라이언트 측입니다. 토큰과 시크릿은 어디로도 보내지지 않으며, 브라우저 내에만 있고 localStorage에 절대 저장되지 않습니다(이는 일반적인 지속성 패턴의 의도적 예외 — 암호화 자료는 절대 저장되면 안 됨). 유일한 지속된 상태는 UI 선호도(탭 선택: 클레임 vs. 원본, 테마)입니다. 모든 파싱은 base64url 디코딩(atob + URL-safe 문자 변환, 또는 native Uint8Array.from)과 JSON.parse를 통해 발생하고, 검증은 전적으로 WebCrypto를 통해 실행됩니다.

CRITICAL(SPA, 사용성 우선): 플랫폼 규칙에 따라 모든 Jurepi 도구는 클라이언트 측 SPA입니다. 모든 상호작용 — 토큰 붙여넣기, 탭 전환, 시크릿/키 붙여넣기, 복사, 다운로드 — 는 로컬 React 상태로 발생하며 라우트 네비게이션 없음. 도구 셸은 SEO를 위해 정적으로 생성되며, 상호작용 가능한 디코더는 단일 클라이언트 컴포넌트입니다.

CRITICAL(보안/프라이버시): 토큰과 시크릿은 절대 지속되지, 로깅되지, 어떤 서버로도 전송되지 않습니다. 사용자가 토큰을 붙여넣으면 도구는 로컬에서만 디코딩합니다. 검증을 위해 시크릿이나 키를 붙여넣으면 토큰과 시크릿 모두 React 상태에 인메모리로 보관되고 언마운트/언로드 시 폐기됩니다. 배경 동기화, 민감한 데이터 캐싱이 있는 서비스 워커 없음.

CRITICAL(정직한 에러 보고): 잘못된 토큰(3부가 아님, 유효하지 않은 base64url, 유효하지 않은 JSON, 지원되지 않는 알고리즘)은 정확하고 개발자 친화적인 에러 메시지를 표시하며 정확한 파트와 오류 문자/컨텍스트를 표시합니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/jwt-decoder (SSG; 레지스트리 슬러그 "jwt-decoder", id "jwt-decoder", 상태 "coming_soon", 악센트 "sun", 카테고리 "dev").
  - 플랫폼이 제공(재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주변 Error Boundary, lib/seo.ts 메타데이터 빌더.
  - 소비: i18n 네임스페이스 `tools.jwt-decoder.*` (UI 크롬: 입력 플레이스홀더, 탭 라벨, 클레임 설명, 에러 메시지, 복사 토스트, 서명 검증 UI, how-to, FAQ).
  - 플랫폼 의존성(만족함): `'dev'` 카테고리는 이미 완전히 배선되고 live 상태입니다. 카테고리 설정 작업은 남아있지 않습니다 — 이 도구의 레지스트리 항목, 라우트 분기, i18n 네임스페이스만 필요합니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - JWT 입력(원본 문자열: 점으로 구분된 세 개의 base64url 인코딩 부분) via 큰 textarea 또는 붙여넣기 영역.
    - 실시간 디코딩: 3부로 분할, 각 부분 base64url-디코드, 각 부분 JSON.parse → 헤더 + 페이로드 + 서명(원본).
    - 컬러화된 3부 표시: header.payload.signature with 서로 다른 색상(구조적 부분 구별).
    - 클레임 테이블: 페이로드에서 잘 알려진 클레임(iss, sub, aud, exp, iat, nbf, jti, typ, kid) 추출. 설명 라벨 제공(예: "iss: Issuer identifier", "exp: Token expiry time").
    - 타임스탐프 렌더링: exp/iat/nbf의 경우 Unix epoch(초)를 ISO 8601 UTC와 인간 친화적 현지 시간으로 변환.
    - 유효성 표시기: 실시간 새로고침(매초) 현재 시간을 exp/iat/nbf와 비교; 상태 배지 표시(유효 ✓ / 만료됨 ⚠ / 아직 유효하지 않음 ⌛) with 만료 또는 시작까지의 카운트다운.
    - 선택적 서명 검증: 보조 UI(토글 가능 고급 섹션). HS256/384/512: 사용자가 16진 또는 base64 시크릿을 붙여넣음 → WebCrypto로 검증. RS256/ES256: 사용자가 PEM 공개키를 붙여넣음 → 검증. 결과 표시(✓ 유효 / ✗ 유효하지 않음 / ⊘ 지원되지 않는 알고리즘).
    - 알고리즘="none" 경고: 토큰의 alg 헤더가 "none"인 경우 명시적 배너 — "This token is unsecured (alg: none). Do not use in production."
    - 복사 버튼: 헤더/페이로드를 JSON으로 복사, 전체 토큰 복사, 검증 결과 복사.
    - 다운로드 버튼: 토큰을 .txt 또는 JSON 객체(파싱된 필드)로 다운로드.
    - 키보드 지원: Ctrl+A select all, Ctrl+C 복사 선택 부분.
    - localStorage 지속성: 사용자의 마지막 탭 선택(클레임 vs. 원본), 검증 모드(off / HMAC / RSA) 기억 — 토큰/시크릿은 절대 아님.
    - 도구별 SEO 장문형("JWT란?") + FAQ + SoftwareApplication JSON-LD, ko/en.
    - Reduced-motion 폴백; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - 토큰 생성(JWT 생성) — 디코딩 전용 도구.
    - 커스텀 클레임 해석(도구는 표준 클레임만 설명; 커스텀 클레임은 테이블에 나타나지만 특별한 로직 없음).
    - 비대칭 키 생성 또는 저장.
    - 배치 JWT 검증(한 번에 하나의 토큰).
    - OAuth/OIDC 검증(도구는 OIDC discovery, userinfo, 또는 issuer 엔드포인트를 검증하지 않음).
    - 검증을 위한 백엔드 API 호출(모든 검증은 클라이언트 측 WebCrypto만).
    - RS256용 인증서 체인 검증(사용자가 원본 공개키 PEM을 제공하고, 도구는 서명만 검증).
  </out_of_scope>
  <future_considerations>
    - Ed25519 / EdDSA 지원(Phase 2, WebCrypto 지원이 광범위해지면).
    - JWT refresh 토큰 헬퍼(타이밍, rotate 전략) — Phase 2.
    - OpenID Connect / OAuth 2.0 discovery 검증 — Phase 3.
    - 배치 토큰 검증(여러 토큰) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <parsing>base64url 디코드(atob + -/→+/ 변환, 또는 Uint8Array.from + TextDecoder). 각 부분 JSON.parse. 에러 추적: 유효하지 않은 JSON에 line/col, base64url 디코드 실패 시 특정 에러(유효하지 않은 문자, 잘못된 패딩).</parsing>
    <claims_extraction>페이로드는 JSON 객체이며, iss, sub, aud, exp, iat, nbf, jti, typ, kid 키를 추출, 테이블 행으로 i18n 라벨 + 값으로 렌더. exp/iat/nbf를 Unix epoch(참고용)과 인간 친화적 현지 시간으로 렌더.</claims_extraction>
    <timestamp_rendering>사용자 로케일(platform i18n의 useLocale()을 통해)별 Intl.DateTimeFormat, Unix 초를 JavaScript Date로 변환, 로컬 타임존 + UTC 오프셋으로 렌더.</timestamp_rendering>
    <validity_indicator>실시간 타이머(setInterval 1s) Date.now()를 exp*1000(Unix 초를 ms로 변환)과 비교. 상태 표시: (iat, exp) 범위 내 → 유효 ✓; iat 전 → ⌛ coming; exp 후 → ⚠ 만료됨. 카운트다운 문자열 계산.</validity_indicator>
    <signature_verification>WebCrypto crypto.subtle: 헤더.alg에서 알고리즘 감지; HS256/384/512인 경우 사용자 붙여넣기 시크릿에서 키 파생(TextEncoder + crypto.subtle.importKey); RS256/ES256인 경우 PEM 공개키 파싱 + importKey; 메시지 = `header.payload`(서명 없음)로 crypto.subtle.verify 호출. 결과 또는 에러 렌더. 정상 실패(지원되지 않는 알고리즘) with 정직한 메시지.</signature_verification>
    <pem_parsing>간단한 PEM 파서: "-----BEGIN PUBLIC KEY-----" / "-----END PUBLIC KEY-----" 마커 사이 base64 추출, 원본 X.509 SubjectPublicKeyInfo로 디코드, format: "spki"로 importKey에 공급.</pem_parsing>
    <copy>navigator.clipboard.writeText() with textarea 폴백; 에러 시 조용히 실패(복사는 보조).
    <download>Blob → URL → a[href] 트릭, 합성 클릭.
  </module_specific>
  <libraries>
    <base64url>Native browser atob/btoa with URL-safe(-_) 문자 변환 폴백, 또는 Uint8Array + TextDecoder 견고성을 위해.
    <webcrypto>Crypto.subtle (HMAC, RSA, ECDSA); 외부 crypto 라이브러리 없음.
    <zod>zod v3.x for UI 상태 스키마(탭 선택, 검증 모드 등).
  </libraries>
  <note>CRITICAL: 백엔드 없음, 첫 번째 API 없음, DB 없음, 토큰/시크릿 로깅 또는 지속성 없음.
</technology_stack>

<file_structure>
src/
├── lib/jwt-decoder/                       # 순수 도메인 계층 — React/Next 없음, 완전히 단위 테스트됨
│   ├── schema.ts                          # zod: JwtParts, Claims, VerificationOptions, VerificationResult
│   ├── parse.ts                           # splitJwt(tokenStr), decodeBase64Url(b64str), parseJwt(tokenStr): {header, payload, signature, error?}
│   ├── claims.ts                          # extractClaims(payload), renderClaimValue(key, value): string
│   ├── timestamp.ts                       # parseUnixSeconds(ts): Date; formatTimestamp(date, locale): {iso, local}; getValidityStatus(iat, exp, nbf): {status, expiryCountdown}
│   ├── verify.ts                          # verifySignature(header, payload, signature, secret/key, keyFormat): {verified, error?}
│   ├── pem.ts                             # parsePemPublicKey(pemStr): {keyData, error?}
│   └── errors.ts                          # Typed error codes: malformed_structure / invalid_base64 / invalid_json / unsupported_alg / verification_failed
├── components/tools/jwt-decoder/
│   ├── JwtDecoder.tsx                     # 오케스트레이터(Client Component) — state 소유자
│   ├── useJwtDecoder.ts                   # 훅: 토큰 상태, 검증 상태, localStorage
│   ├── TokenInput.tsx                     # 큰 textarea, live onChange → parse
│   ├── ColorizedToken.tsx                 # 3부 표시: header.payload.signature(컬러 코딩)
│   ├── ClaimsTable.tsx                    # 표준 클레임의 표형 표시, 설명 포함
│   ├── TimestampDisplay.tsx               # exp/iat/nbf를 현지 + UTC 시간으로 렌더
│   ├── ValidityIndicator.tsx              # 실시간 배지(✓ 유효 / ⚠ 만료됨 / ⌛ 아직 유효하지 않음) + 카운트다운
│   ├── VerificationSection.tsx            # 토글 + HS/RS 모드 선택기 + 시크릿/키 입력 + 결과 배지
│   ├── ErrorMessage.tsx                   # 정확한 에러: "Part: <header|payload|signature>, Error: <specific reason>"
│   ├── JwtDecoderIntro.tsx                # H1 + lead(SEO 장문형)
│   ├── JwtDecoderHowTo.tsx                # "JWT란 무엇이고 왜 디코딩하는가?"(SEO)
│   ├── JwtDecoderFaq.tsx                  # FAQ + FAQPage JSON-LD
│   └── JwtDecoderStructuredData.tsx       # SoftwareApplication JSON-LD(라우트가 렌더; Faq는 FAQPage 방출 안 함)
└── i18n/messages/{ko,en}.json             # tools.jwt-decoder.* UI 크롬
</file_structure>

<core_data_entities>
  <jwt_parts>
    - header: {alg, typ?, kid?, ...custom} — 헤더 부분에서 디코딩된 JSON
    - payload: {iss?, sub?, aud?, exp?, iat?, nbf?, jti?, ...custom} — 페이로드 부분에서 디코딩된 JSON
    - signature: string — 원본 base64url 인코딩된 서명(디코딩되지 않음)
  </jwt_parts>
  <claims>
    - iss(Issuer): issuing party identifier(문자열, 보통 URL)
    - sub(Subject): the principal(사용자 ID 등)
    - aud(Audience): intended recipient(s)(문자열 또는 배열)
    - exp(Expiration Time): Unix 초; 이후 토큰 유효하지 않음
    - iat(Issued At): Unix 초; 토큰 생성 시점
    - nbf(Not Before): Unix 초; 이전 토큰 유효하지 않음
    - jti(JWT ID): unique token ID
    - typ: token type(보통 "JWT")
    - kid: key ID(어느 서명 키를 사용했는지)
    - custom claims: 추가 페이로드 필드
  </claims>
  <ui_state>
    - token: string — 원본 JWT 입력
    - decoded?: {header, payload, signature} — 파싱 결과 또는 에러시 null
    - error?: string — 친화적 에러 메시지
    - tab: enum(claims, raw) — 활성 뷰(클레임 테이블 vs. 전체 JSON)
    - verificationMode: enum(off, hmac, rsa) — 서명 검증 모드
    - secret?: string — 사용자 붙여넣기 HMAC 시크릿(인메모리만, 절대 지속성 없음)
    - publicKey?: string — 사용자 붙여넣기 PEM 공개키(인메모리만)
    - verificationResult?: {verified: boolean, error?: string}
    INVARIANT: 토큰과 시크릿은 절대 localStorage에 저장되지 않음. UI prefs(탭, verificationMode)만 지속.
  </ui_state>
  <validity_status>
    - status: enum(valid, expired, not_yet_valid, unknown)
    - expiryCountdown?: string — 인간 친화적 "expires in 2h 34m" 또는 "expired 1h ago"
    - exp?: number — Unix 초(exp 클레임)
    - iat?: number — Unix 초(iat 클레임)
    - nbf?: number — Unix 초(nbf 클레임)
  </validity_status>
  <constants>
    - CLAIM_DESCRIPTIONS: map {claim_key: i18n_key} for rendering labels
    - SUPPORTED_ALGS: ["HS256", "HS384", "HS512", "RS256", "ES256"] — WebCrypto 지원
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/jwt-decoder" page="JwtDecoder(platform 도구 라우트 분기 slug→component)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams iterates registry(status "live")를 SSG.</note>
</route_definitions>

<component_hierarchy>
  <jwt_decoder>                             <!-- "use client"; 토큰 + 검증 상태 소유 + useJwtDecoder() -->
    <jwt_decoder_intro />                   <!-- H1 + lead(서버 렌더 가능한 경우) -->
    <decoder_container>                     <!-- Stacked 또는 2-split 레이아웃 -->
      <token_input />                       <!-- Textarea: live onChange → debounced parse -->
      <colorized_token />                   <!-- 유효하면 3부 표시 -->
      <error_message />                     <!-- 잘못된 형식이면 정확한 에러 -->
      <unsecured_warning />                 <!-- alg="none"인 경우 -->
      <validity_indicator />                <!-- 실시간 상태 배지 + 카운트다운 -->
      <output_tabs>                         <!-- Claims / Raw JSON tabs -->
        <claims_table />                    <!-- tab="claims"인 경우 표준 클레임 + 설명 -->
        <timestamp_display />               <!-- exp/iat/nbf를 현지 + UTC로 렌더 -->
        <raw_json />                        <!-- tab="raw"인 경우 pretty-printed 전체 페이로드 -->
      </output_tabs>
      <verification_section />              <!-- 고급: 모드 선택기, 시크릿/키 입력, 결과 -->
      <copy_download_buttons />            <!-- 부분 복사, 결과 복사, 다운로드 -->
    </decoder_container>
    <jwt_decoder_how_to />                  <!-- SEO 장문형 -->
    <jwt_decoder_faq />                     <!-- FAQPage JSON-LD -->
  </jwt_decoder>
</component_hierarchy>

<pages_and_interfaces>
  <jwt_decoder_intro>
    - Eyebrow: "개발자 도구" / "DEVELOPER TOOL" — 12px/700, var(--brand).
    - H1: "JWT 디코더" / "JWT Decoder" — Gmarket Sans clamp(28px,5vw,40px)/700.
    - Lead: "복잡한 JWT를 한눈에 분석하고 서명을 검증하세요. 토큰은 절대 저장되지 않습니다." / 영문 동등.
  </jwt_decoder_intro>

  <token_input>
    - 큰 textarea, 전체 폭(desktop) 또는 mobile stacked, 플레이스홀더 "JWT를 붙여넣으세요…" / "Paste your JWT here…", 모노스페이스 폰트(Menlo/Monaco/Courier New fallback).
    - live onChange debounced 200ms → parse(지연 없음).
  </token_input>

  <colorized_token>
    - 유효하면: `header.payload.signature`를 세 개의 서로 다른 컬러 섹션으로 표시(구조적 부분 구별). 매우 긴 경우 각 부분 잘림(예: "eyJhbGc…IkpXVCJ9.eyJzdWI…WQpSjJUbkJ1V0xoSXlCVEY2V2c.TJVA95U…" with 전체 보기 tooltip).
    - 부분별 복사 버튼.
  </colorized_token>

  <unsecured_warning>
    - 디코딩된 헤더.alg === "none"인 경우: red banner(danger color, var(--semantic-danger)) with 🔓 icon: "This JWT uses the unsecured 'none' algorithm. Do not use in production."
  </unsecured_warning>

  <validity_indicator>
    - 상태 배지: ✓(초록, var(--semantic-success)) 유효하면; ⚠(주황, var(--semantic-warning)) 아직 유효하지 않으면; ⛔(빨강, var(--semantic-danger)) 만료되면.
    - 카운트다운 텍스트: "Expires in 2 hours, 34 minutes" / "Expired 1 hour ago" / "Becomes valid in 5 minutes" — 매초 업데이트.
    - 탭 해서 전체 exp/iat/nbf 타임스탐프 보기.
  </validity_indicator>

  <claims_table>
    - 2열 테이블: Claim(iss, sub, aud 등) 및 Value.
    - 표준 클레임(iss, sub, aud, exp, iat, nbf, jti, typ, kid)이 먼저 나타나고 i18n 라벨 및 설명(tooltip 또는 sidebar).
    - 커스텀 클레임이 아래 나타남("Custom claims" 헤더).
    - exp/iat/nbf: Unix 초와 인간 친화적 현지 시간 모두 표시(예: "1720376400(화요일, 2026년 7월 9일, 오후 2:00 UTC)").
  </claims_table>

  <verification_section>
    - 기본값으로 접힘(고급 섹션); [+] 펼침.
    - 모드 선택기: 라디오 버튼 또는 탭(Off / HMAC / RSA).
    - HMAC인 경우: 시크릿 입력 필드(플레이스홀더 "시크릿 붙여넣기(16진 또는 base64)"); 라벨 "Secret:".
    - RSA인 경우: PEM 공개키용 textarea(플레이스홀더 "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----").
    - [Verify] 버튼: WebCrypto를 통해 서명 검사 트리거.
    - 결과 배지: ✓ 검증됨(초록) / ✗ 검증 실패(빨강) / ⊘ 지원되지 않는 알고리즘 또는 에러(회색, 이유 포함 tooltip).
  </verification_section>

  <error_message>
    - 파싱 실패 시: "Invalid JWT. Part: <header|payload|signature>, Error: <specific reason>"(예: "Invalid JWT. Part: payload, Error: invalid JSON (line 1, col 8: unexpected token '}'). Context: …").
    - 잘못된 구조(3부 아님)인 경우도 표시.
  </error_message>

  <keyboard_shortcuts>
    - Ctrl+A(또는 Cmd+A) → select all input
    - Ctrl+C(Cmd+C) → 선택 부분 또는 전체 토큰 복사(colorized display에 포커스 있으면)
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <parsing note="실시간, debounced 200ms">
    - splitJwt(tokenStr): '.'로 분할, 3부 검증, {header, payload, signature, error?} 반환.
    - decodeBase64Url(b64str): -→+, _→/ 교체, 필요시 패드, atob, catch → error.
    - parseJwt(tokenStr): 각 부분 base64url-디코드 + JSON.parse; 실패 시 { success: false, error: {part, reason} } 반환; 성공 시 { success: true, header, payload, signature }.
  </parsing>

  <claims_extraction>
    - extractClaims(payloadObj): subset { iss, sub, aud, exp, iat, nbf, jti, typ, kid } 반환(있으면), plus 모든 다른 키를 customClaims로.
    - renderClaimValue(key, value): key ∈ {exp, iat, nbf}이고 value가 number이면 "{Unix seconds}({localDatetime} UTC)" 반환; else JSON.stringify(value, null, 2).
  </claims_extraction>

  <timestamp_rendering>
    - parseUnixSeconds(ts): new Date(ts * 1000).
    - formatTimestamp(date, locale): Intl.DateTimeFormat(locale, {weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', timeZone:'UTC'}) 사용 → "화요일, 2026년 7월 8일 오후 2:34:56 UTC" 및 로컬 타임존도 표시.
  </timestamp_rendering>

  <validity_status>
    - getValidityStatus(iat, exp, nbf): Date.now()/1000를 iat/exp/nbf와 비교; { status: 'valid'|'expired'|'not_yet_valid'|'unknown', expiryCountdown?: string } 반환.
    - 실시간 업데이트 매초: 검사 재실행, 카운트다운 텍스트 업데이트.
  </validity_status>

  <signature_verification>
    - verifySignature(tokenStr, secret|publicKey, keyFormat): 헤더.alg 디코딩; 알고리즘을 기반으로 crypto.subtle.sign/verify로 라우팅.
    - HMAC HS256/384/512: TextEncoder(secret) → crypto.subtle.importKey({format:'raw', algorithm:{name:'HMAC', hash:'SHA-256'|'SHA-384'|'SHA-512'}, extractable:false, usages:['sign']})를 통해 키 파생 → crypto.subtle.verify(algo, key, signature_bytes, message_bytes).
    - RSA RS256: PEM 공개키 파싱 → importKey({format:'spki', algorithm:{name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, extractable:false, usages:['verify']}) → verify.
    - ECDSA ES256: PEM 파싱 → importKey({format:'spki', algorithm:{name:'ECDSA', hash:'SHA-256'}, extractable:false, usages:['verify']}) → verify.
    - 성공 시: {verified: true} 반환. 실패 시: {verified: false, error: 'Signature verification failed.'} 또는 {verified: false, error: 'Unsupported algorithm: …'}.
  </signature_verification>

  <pem_parsing>
    - parsePemPublicKey(pemStr): "-----BEGIN PUBLIC KEY-----"와 "-----END PUBLIC KEY-----" 사이 부분문자열 추출, base64-디코드, Uint8Array 반환. 마커 누락 또는 유효하지 않은 base64인 경우 에러.
  </pem_parsing>

  <persistence>
    - Mount: `jurepi-jwt-decoder` localStorage에서 읽기 → zod parse → 탭 선택 + verificationMode 로드; 실패 → fresh 시작.
    - Change: 모든 옵션 변경(탭, verificationMode) 후 debounced setItem. CRITICAL: 토큰과 시크릿은 절대 저장되지 않음.
  </persistence>

  <i18n>모든 UI 크롬 tools.jwt-decoder.*(ko/en): 라벨, 클레임 설명, 에러 메시지, 토스트, how-to, FAQ. JWT 데이터는 로케일 무관.</i18n>
</core_functionality>

<error_handling>
  <malformed_jwt>
    - 3부가 아님 → "Invalid JWT format. Expected three base64url-encoded parts separated by '.'."
    - 유효하지 않은 base64url → "Invalid JWT. Part: <header|payload|signature>, Error: Invalid base64url encoding(unexpected character '<char>')."
    - 헤더 또는 페이로드에서 유효하지 않은 JSON → "Invalid JWT. Part: <payload>, Error: Invalid JSON(line X, col Y: unexpected token '<token>'). Context: …"
  </malformed_jwt>
  <unsupported_alg>
    - [HS256, HS384, HS512, RS256, ES256]에 없는 알고리즘 → "Verification not available. Algorithm '<alg>' is not supported by this tool."
  </unsupported_alg>
  <verification_failure>
    - 서명이 일치하지 않음 → "Signature verification failed. This token was either tampered with or signed with a different key."
    - PEM 파싱 에러 → "Invalid public key. Could not parse PEM format. Ensure the key starts with '-----BEGIN PUBLIC KEY-----'."
    - 시크릿 파생 에러 → "Could not process secret. Verify the format and try again."
  </verification_failure>
  <storage_error>
    - localStorage unavailable(private mode) → prefs 인메모리, 무서운 에러 없음. 도구 완전 기능.
  </storage_error>
  <note>토큰과 시크릿은 절대 로깅되거나 외부 서비스에 보고되지 않음.
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md는 모든 토큰의 단일 정본. 다음은 도구별 애플리케이션.
  <accent_usage>
    - 카테고리 악센트는 SUN(var(--accent-sun) / var(--accent-sun-soft)) — DESIGN per "dev" 카테고리 정체성. Intro 아이콘 타일, colorized token header/footer 구별, validity indicator(success 상태).
    - CTA(버튼)는 brand honey-gold var(--brand) 유지(Verify/Copy/Download). Accent = 구조 정체성.
    - Colorized token: header var(--accent-sun), payload var(--accent-mint), signature var(--accent-sky), separators var(--text-muted).
    - Validity 상태: ✓ var(--semantic-success), ⚠ var(--semantic-warning), ⛔ var(--semantic-danger).
    - Unsecured warning: var(--semantic-danger) 배경, danger-soft.
  </accent_usage>
  <layout>Textarea(입력), output(colorized + claims/raw tabs) stacked 또는 2-split. Desktop ≥1024px: 2-split(50/50). Mobile <768px: stacked.
  <typography>H1 Gmarket Sans; textarea/output 모노스페이스(Menlo/Monaco/Courier New); UI 라벨/버튼 Pretendard.
  <motion>transform/opacity만: 탭 전환 150ms cross-fade, validity 카운트다운 smooth 텍스트 업데이트, 고급 섹션 expand 200ms. 모두 prefers-reduced-motion으로 gated.
  <responsive>≥1024px: 2-col split; 768–1023px: 2-col narrower; <768px: stacked. No overflow(320 guard).
  <atmosphere>기술적이고 안전함: 모노스페이스 I/O, 정확한 에러 메시지, 명시적 보안 경고(unsecured alg), 정직한 "cannot verify" 상태. 장식적이지 않거나 장난스럽지 않음.
</aesthetic_guidelines>

<security_considerations>
  <tokens note="절대 지속, 절대 전송">
    - 토큰은 사용자 공급 데이터(자격증명)이며 코드가 아님. 그러나 민감한 정보(사용자 ID, 이메일, 클레임)를 포함할 수 있음. 텍스트 노드로 표시(React escapes); HTML에 주입 절대 금지.
    - 토큰은 절대 localStorage, cookies, IndexedDB, 또는 어떤 브라우저 저장소에도 지속되지 않음.
    - 토큰은 절대 어떤 서버, proxy, logging 서비스, 또는 analytics로 전송되지 않음.
    - 페이지 언로드 시 토큰 상태가 폐기됨(React unmount).
  </tokens>
  <secrets note="제로 지속성">
    - HMAC 시크릿과 RSA/ECDSA 개인/공개 키는 React 상태 인메모리에만 보관됨. 절대 지속되지 않음.
    - 언로드 시 시크릿 상태 폐기.
    - 도구는 키를 저장하려고 시도하지 않음(암호화되어도) — 이는 암호화 안전 경계.
  </secrets>
  <webcrypto note="브라우저 native">
    - 모든 서명 검증은 WebCrypto(crypto.subtle)를 사용하며, 이는 외부 의존성이 없는 브라우저 native API.
    - 키는 노출되지 않으며, crypto.subtle 연산은 constant-time(timing 공격에 안전, 하드웨어 종속).
    - 브라우저 vendor는 WebCrypto 보안 책임.
  </webcrypto>
  <privacy>입력(JWT)은 사용자 자신의 디바이스를 제외하고는 전송되지 않음. 원격 analytics, logging, 또는 third-party API 없음. 검증 시크릿은 브라우저를 떠나지 않음.
  <performance>Parsing debounced 200ms; 검증은 WebCrypto(native, 하드웨어 가속 가능). 메모리 누수 없음.
  <pem_parsing note="외부 라이브러리 없음">
    - PEM은 string 메서드(split, substring, indexOf)로 파싱 — regex 또는 XML 파싱 없음. 간단하고 견고.
  </pem_parsing>
  <note>시크릿 없음, 네트워크 없음, 외부 logging 없음. 이 도구는 자격증명 또는 키를 입력해야 하지 않음; 검증은 선택적이고 도구는 "decode-only" 모드에서 완전히 기능.
</security_considerations>

<advanced_functionality>
  <colorized_token_display>세 개의 서로 다른 컬러 섹션(header.payload.signature)은 JWT 구조를 한눈에 명확하게 함.
  <claims_table>표준 클레임을 추출하고 설명으로 라벨링; exp/iat/nbf는 Unix와 인간 시간 모두 표시.
  <live_validity_indicator>실시간 유효성 상태(valid / expired / not-yet-valid) with 만료까지 카운트다운; 매초 새로고침.
  <optional_signature_verification>HMAC 및 RSA/ECDSA용 WebCrypto 지원; 지원되지 않는 알고리즘에 graceful fallback.
  <unsecured_jwt_warning>alg="none"(unsecured token)인 경우 명시적 경고 — production 보안 위험.
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>유효한 JWT 디코딩, 클레임 및 유효성 보기</description>
    <steps>
      1. 유효한 JWT(예: jwt.io 예제)를 붙여넣음: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
      2. 파싱 성공 → colorized token은 header.payload.signature 표시; claims 탭은 iss, sub, name(커스텀), iat를 "화요일, 2018년 1월 1일, 오후 10:20:02 UTC"로 렌더.
      3. 유효성 표시기는 ✓ 유효(만료 설정 없음 예제).
      4. 복사 버튼 작동(payload JSON 복사).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>잘못된 JWT 디코딩, 정확한 에러 보기</description>
    <steps>
      1. 유효하지 않은 JWT 붙여넣음: "not.two.parts.four"
      2. 파싱 실패 → 에러 "Invalid JWT format. Expected three base64url-encoded parts separated by '.'."
      3. 다른 JWT 붙여넣음: "eyJhbGciOiJIUzI1NiJ9.invalid!!!.signature"
      4. 에러 "Invalid JWT. Part: payload, Error: Invalid base64url encoding(unexpected character '!')."
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Unsecured JWT 경고, 만료 카운트다운</description>
    <steps>
      1. alg="none"와 현재로부터 5분 후 exp 필드를 갖는 JWT 작성.
      2. 디코드 → red 경고 배너 "This JWT uses the unsecured 'none' algorithm."
      3. 유효성 표시기는 ⌛ "Becomes valid in X seconds"(nbf가 설정되면) 또는 ✓ 유효(아니면).
      4. 대기 또는 다시 렌더; 카운트다운은 매초 업데이트.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>서명 검증(HMAC)</description>
    <steps>
      1. HS256으로 서명된 JWT를 붙여넣음.
      2. [Advanced] 펼침 → Mode 선택: HMAC.
      3. 서명 시크릿 붙여넣음(예: "my-secret").
      4. [Verify] 클릭 → ✓ 검증됨 배지 나타남(또는 시크릿이 틀리면 ✗ 실패).
      5. 검증 결과 복사.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>키보드 단축키, reduced-motion, i18n</description>
    <steps>
      1. JWT 붙여넣음, Ctrl+A → select all 입력.
      2. colorized token에 포커스, Ctrl+C → 클립보드로 복사(success toast).
      3. prefers-reduced-motion ON → 탭 전환 순간(fade anim 없음), validity 카운트다운은 animation 없이 업데이트.
      4. /en 로케일 전환 → UI 라벨 전환(Claims / Raw, Verify 등).
      5. axe 스캔 → violations 없음.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>JWT 붙여넣기 → header/payload/signature 분할 및 디코딩; 파싱 에러 정확(부분 + 이유); 클레임 테이블은 표준 클레임 라벨 및 exp/iat/nbf를 인간 시간으로; 유효성 표시기는 매초 실시간 업데이트; 선택적 서명 검증 via WebCrypto(HMAC, RSA, ECDSA) with 정직한 success/failure; unsecured alg 경고; 복사 + 다운로드.
  <user_experience>Keystroke → ≤200ms로 파싱 가시적(지연 없음); colorized token 순시 명확; 복사 토스트; 다운로드 즉시; ≥44px 타겟; 가시 포커스; SPA — 라우트 reload 없음; 토큰과 시크릿은 절대 지속.
  <technical_quality>lib/jwt-decoder/* pure ≥80% unit coverage(파싱, 클레임, 타임스탐프, 검증); TS 0 errors; <800 lines per file; 에러 메시지 test fixtures(malformed JWT).
  <visual_design>DESIGN.md compliant; sun accent 정체성; 모노스페이스 I/O(readable); 정확한 에러 메시지; 보안 경고 bold.
  <accessibility>전체 키보드(Ctrl+단축키); roving focus; aria-라벨; reduce-motion: no fade/countdown anim; WCAG 2.1 AA contrast; 프리렌더 SEO/FAQ.
  <performance>도구 라우트는 플랫폼 예산 내; debounced 파싱; WebCrypto 검증(하드웨어 가속). 복사/다운로드 fetch 없음; LCP < 2.5s.
  <security>No XSS: text-node 렌더만. 토큰과 시크릿 절대 지속 또는 전송. WebCrypto 검증 native. 지원되지 않는 알고리즘에 정직한 "cannot verify". 명시적 unsecured JWT 경고.
</success_criteria>

<build_output>
  <note>플랫폼(pnpm build)의 일부로 구축. /[locale]/tools/jwt-decoder는 플랫폼 generateStaticParams iterates registry(status "live")로 사전 렌더.
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — ONE 항목 추가
    {
      id: 'jwt-decoder',
      slug: 'jwt-decoder',
      category: 'dev',
      icon: 'KeyRound',           // 또는 'Lock' / 'Shield' — lucide-react
      accent: 'sun',
      status: 'coming_soon',
      addedAt: '2026-07-10',
      order: 30,                  // demand-based, json-formatter(25) 후
      keywords: ['JWT','디코더','토큰','분석','검증','서명','개발','decoder','verify','token','payload','claims','security'],
    },
    // 플랫폼 의존성 없음: 'dev' 카테고리는 이미 완전히 배선됨.
    ```
  </platform_registry_change>
  <critical_paths>
    1. Base64url 디코드 + JSON 파싱(기초).
    2. 클레임 추출 및 표준 클레임 라벨링.
    3. Unix 타임스탐프 → 현지 datetime 포매팅(via Intl.DateTimeFormat).
    4. 실시간 유효성 표시기(1s 새로고침, exp/iat/nbf 비교).
    5. WebCrypto 서명 검증(HMAC, RSA, ECDSA 라우트).
    6. PEM 공개키 파싱.
    7. 정확한 에러 보고(부분 + 이유).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/jwt-decoder/{parse, claims, timestamp, verify, pem, schema, errors}.ts(Vitest ≥80%).
    2. tools.jwt-decoder.* 메시지(ko/en): 라벨, 클레임 설명, 에러 메시지, 버튼 텍스트, how-to, FAQ.
    3. TokenInput + ColorizedToken + ErrorMessage(controlled input, live parse).
    4. ClaimsTable + TimestampDisplay(포매팅, Intl 사용).
    5. ValidityIndicator(실시간 1s 타이머).
    6. VerificationSection(WebCrypto 통합, 모드 선택기).
    7. useJwtDecoder 훅(상태 관리, UI prefs만 localStorage).
    8. JwtDecoder 오케스트레이터 + 키보드 단축키.
    9. Intro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    10. 레지스트리 status→live; slug→component + generateMetadata 분기.
    11. 키보드/reduce-motion/a11y pass; axe 스캔.
    12. E2E 1–5 scenarios; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>
    - Unit(Vitest ≥80%): parse(valid/malformed/edge cases), base64url 디코드(valid/invalid chars), claims 추출, 타임스탐프 포매팅(Unix→로컬), verify(HMAC/RSA/ECDSA success/fail, unsupported alg), pem 파싱(valid/invalid).
    - Component: TokenInput state, ColorizedToken 렌더, ClaimsTable + TimestampDisplay, ValidityIndicator 실시간 타이머, VerificationSection 모드/결과.
    - E2E(Playwright): scenarios 1–5(디코드, 에러, unsecured 경고, verify HMAC, 키보드/reduce-motion).
    - Visual regression: 320/768/1024 both themes, long token, error 상태, expanded verification section.
    - A11y: axe + 키보드(Ctrl 단축키) + reduce-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
