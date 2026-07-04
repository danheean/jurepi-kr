# Base64 인코더/디코더 — 텍스트 & 파일 변환 — 서비스 SPEC

> 이 문서는 **정본(한국어 번역)**입니다. AI 코딩 에이전트가 소비하는 정본은 [`SPEC.md`](SPEC.md)(영문)입니다. 양쪽을 동기 상태로 유지하세요.
>
> **Base64 인코더/디코더** 빌드 명세 — 텍스트와 파일을 Base64로 안전하게 변환하고 복원하는 브라우저 기반 유틸리티로, UTF-8 무결성을 보장하며 표준과 URL-safe 두 가지 변형을 지원하고, 파일 업로드/다운로드 및 라이브 data-URI 생성 기능을 제공합니다. 모든 UI 문자열은 i18n 네임스페이스 `tools.base64-encoder.*`에 있습니다. 시각 설계 토큰: [`docs/DESIGN.md`](../../../DESIGN.md).
> 내부 서비스 코드명: `base64-encoder`. 레지스트리 id: `base64-encoder`. 공개 URL 슬러그: `/[locale]/tools/base64-encoder`.
>
> 이 SPEC은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO 인프라, 디자인 토큰은 플랫폼에서 제공됩니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 SPEC(같은 패턴): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Base64 인코더/디코더 — 텍스트 & 파일 변환 (Jurepi 도구, 코드명 base64-encoder, 레지스트리 id base64-encoder)</project_name>

<overview>
Base64 인코더/디코더는 필수적인 인코딩 작업을 한 곳에 모읍니다 — 사용자가 텍스트를 붙여넣거나 파일을 업로드하거나 Base64 blob을 받으면, 완전한 UTF-8 안전성(이모지나 non-Latin1 문자에서 깨지지 않음)으로 평문 ↔ Base64 간에 순시로 변환합니다. 도구는 두 가지 **표준**(A-Za-z0-9+/) 및 **URL-safe**(A-Za-z0-9-_) 변형을 제공하고, 파일-to-Base64 임포트(드래그드롭 또는 파일 선택기, 클라이언트 측 FileReader, 최대 5MB), 그리고 MIME 타입 추론을 통한 Base64-to-다운로드 가능 파일 익스포트를 제공합니다. 사용자가 입력하면 라이브 변환이 업데이트됩니다; 복사 버튼(data-URI 또는 원본 Base64)은 플랫폼 클립보드 API를 사용합니다. 순수 도메인: 엄격한 UTF-8 왕복 테스트를 갖춘 인코드/디코드 함수. 모든 상호작용은 로컬입니다 — 백엔드 없음, 네트워크 없음, React 상태와 브라우저 API만.

CRITICAL(클라이언트 전용, SSG): 100% 클라이언트 측입니다. 백엔드 없음, 데이터베이스 없음, 네트워크 파일 전송 없음. 유일한 지속성은 localStorage(마지막 사용 모드: 텍스트/파일, 마지막 변형: 표준/url-safe)이고, 네트워크로 전송되는 것은 없습니다. Base64는 암호화가 아닙니다 — 도구의 복사/도움말 텍스트는 이를 명확히 공시합니다.

CRITICAL(SPA, 사용성 우선): 플랫폼 규칙에 따라, 모든 Jurepi 도구는 SSG 셸에 마운트된 클라이언트 측 Single-Page Application입니다. 모든 상호작용 — 텍스트 ↔ 파일 모드 전환, 표준/URL-safe 선택, 복사, 다운로드 — 로컬 React 상태로 발생하며 라우트 네비게이션 없음, 전체 페이지 새로고침 없음입니다. 사용성이 최우선입니다: 인코딩/디코딩은 한 번의 키 입력, 결과는 복사 가능하거나 다운로드 가능, 에러 메시지는 친화적입니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/base64-encoder (SSG; 레지스트리 슬러그 "base64-encoder", id "base64-encoder", 상태 "live", 악센트 "coral", 카테고리 "dev").
  - 플랫폼이 제공(재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주변 Error Boundary, lib/seo.ts 메타데이터 빌더.
  - 소비: i18n 네임스페이스 `tools.base64-encoder.*` (UI 크롬: 모드 토글, 변형 토글, 파일 입력 라벨, 복사 버튼, 에러 메시지, FAQ).
  - 플랫폼 의존성(만족함): `'dev'` 카테고리는 이미 완전히 배선되고 live 상태입니다(i18n 라벨 `categories.dev` = ko "개발 도구" / en 상응, `CATEGORY_ORDER` 및 `FOOTER_CATEGORIES`에 존재; 형제 live dev 도구: url-encoder, bookmarks, dev-people). 카테고리 설정 작업은 남아있지 않습니다 — 이 도구의 레지스트리 항목, 라우트 분기, i18n 네임스페이스만 필요합니다. 악센트 `coral`은 dev 도구 중에서 자유롭습니다(현재 ladder만 coral 사용).
</platform_integration>

<scope_boundaries>
  <in_scope>
    - CRITICAL UTF-8 안전성을 갖춘 텍스트-to-Base64 및 Base64-to-텍스트 양방향 변환(TextEncoder/TextDecoder 사용, 원본 `btoa`/`atob` 금지).
    - 표준 Base64(RFC 4648, A-Za-z0-9+/) 및 URL-safe 변형(RFC 4648 §5, A-Za-z0-9-_, 패딩 없음).
    - 파일 업로드(드래그드롭 또는 파일 입력 선택기) → Base64 문자열; 5MB 한정, 친화적 오버플로우 메시지 포함.
    - Base64 → 다운로드 가능 파일: data-URI 접두사에서 MIME 타입 추론 또는 사용자가 선택.
    - Data-URI 생성(data:text/plain;base64,...) 복사 또는 미리보기용.
    - 라이브 변환: 텍스트/파일 입력이 결과를 실시간으로 업데이트; >10KB는 디바운스.
    - 클립보드로 복사(data-URI 또는 Base64 문자열); API 불가능할 시 textarea 선택 폴백.
    - 입력 검증: 디코드 시 유효하지 않은 Base64 검출(non-base64 문자, 잘못된 패딩)과 친화적 에러.
    - 입력의 공백/줄바꿈: 인코드/디코드 전에 제거 또는 정규화.
    - 빈 입력 처리: 결과 지우기, 힌트 표시.
    - localStorage 지속성: 마지막 사용 모드(텍스트/파일), 마지막 변형(표준/url-safe).
    - 도구별 SEO 장문형("Base64란?") + FAQ(FAQPage JSON-LD) + SoftwareApplication JSON-LD, 지역화 ko/en.
    - Reduced-motion 폴백; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - 암호화/복호화(Base64는 인코딩, 암호화가 아닙니다 — 도구와 복사에서 명확히 함).
    - 백엔드 인코딩/디코딩 또는 파일 저장.
    - 일괄 파일 처리(한 번에 하나의 파일).
    - RFC 4648을 넘어선 커스텀 Base64 알파벳 또는 변형.
    - 라이브 미리보기(예: 이미지 파일의 이미지 미리보기) — 텍스트/요약만.
    - 브라우저 익스텐션 또는 독립 실행형 앱.
  </out_of_scope>
  <future_considerations>
    - 압축 + 인코딩(gzip → Base64) — Phase 2.
    - Hex / Binary / URL 인코딩 단축키 — Phase 2.
    - 드래그드롭 폴더를 통한 일괄 인코드/디코드 — Phase 2.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <encoding>TextEncoder (UTF-8 to 바이트), base64-js 또는 네이티브 btoa 우회(유니코드에 안전). URL-safe 변형: +→-, /→_ 교체.</encoding>
    <decoding>Base64 → ASCII에는 atob, TextDecoder (UTF-8 바이트 to 문자열). 검증: regex /^[A-Za-z0-9+/]*={0,2}$/ (표준) 또는 /^[A-Za-z0-9\-_]*={0,2}$/ (URL-safe).</decoding>
    <file_handling>FileReader.readAsArrayBuffer → base64-js 인코드 또는 네이티브 Blob.arrayBuffer().then(btoa equiv).</file_handling>
    <clipboard>navigator.clipboard.writeText → 폴백 textarea.select() execCommand('copy') → 둘 다 실패하면 조용히(복사는 부차적).</clipboard>
    <validation>zod for UI 상태 스키마(mode, variant, fileSize, isValidBase64).</validation>
    <animation>네이티브 CSS 전환만(fade, 변환 없음). prefers-reduced-motion 존중.</animation>
  </module_specific>
  <libraries>
    <base64-js>base64-js v1.5+ — 안전한 유니코드 base64 인코드/디코드(빌드에는 devDependency, 런타임에는 선택적).</base64-js>
    <zod>zod v3.x — 이미 리포에 있음; 상태 스키마 검증용.</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/base64-encoder/
│   ├── schema.ts                      # zod: UiState, EncodeResult, DecodeResult, FileInfo
│   ├── encoder.ts                     # safeDecode, safeEncode (UTF-8 안전; 프레임워크 의존성 없음)
│   ├── base64.ts                      # urlSafeEncode, urlSafeDecode, isValidBase64
│   └── mime.ts                        # guessMimeType(filename, base64Prefix)
├── components/tools/base64-encoder/
│   ├── Base64Encoder.tsx              # 오케스트레이터(Client Component) — mode/variant/input 상태 + useBase64() 소유자
│   ├── useBase64.ts                   # 훅: 상태 관리 + localStorage + 복사 어댑터
│   ├── ModeToggle.tsx                 # 텍스트 / 파일 라디오 세그먼트
│   ├── VariantToggle.tsx              # 표준 / URL-safe 라디오 세그먼트
│   ├── DirectionToggle.tsx            # 인코드 / 디코드 라디오 세그먼트
│   ├── TextInput.tsx                  # 평문 입력용 Textarea
│   ├── FileInput.tsx                  # 드래그드롭 + 파일 선택기, 크기 검증
│   ├── OutputDisplay.tsx              # 결과 textarea(읽기 전용), 복사 버튼, 다운로드 버튼
│   ├── Base64EncoderIntro.tsx         # H1 + lead(SEO; 서버 렌더; 레포 관례상 도구 접두 이름)
│   ├── Base64EncoderHowTo.tsx         # "Base64란?"(SEO 장문형)
│   ├── Base64EncoderFaq.tsx           # Q&A + FAQPage JSON-LD(FAQPage 단일 소유자)
│   ├── Base64EncoderStructuredData.tsx # SoftwareApplication JSON-LD 전용(라우트가 렌더; FAQPage 금지)
│   └── data/
│       └── (생성된 아티팩트 없음)
└── i18n/messages/{ko,en}.json         # tools.base64-encoder.* (모드/변형 라벨, 버튼, 에러, FAQ)
</file_structure>

<core_data_entities>
  <ui_state>
    - mode: enum (text, file) — 기본값 "text"
    - variant: enum (standard, urlSafe) — 기본값 "standard"
    - inputText: string — 평문 또는 디코드할 Base64
    - inputFile?: File — 인코드할 선택된 파일
    - outputText: string — 인코드/디코드된 결과 또는 에러
    - isEncoding: boolean — 어느 방향(true=텍스트→Base64, false=Base64→텍스트)
    - isValidInput: boolean — 입력 검증(비어있지 않음, 디코딩 시 유효한 Base64)
    - error?: string — 친화적 에러 메시지(null = 성공)
    INVARIANT: mode=text → inputText 존재; mode=file → inputFile 존재; outputText는 입력과 동기화.
  </ui_state>
  <encode_result>
    - base64: string (변형별 RFC 4648 표준 또는 URL-safe)
    - dataUri: string (data:text/plain;base64,… 또는 추론된 MIME)
    - sizeBytes: number (원본 바이트 길이)
  </encode_result>
  <decode_result>
    - plaintext: string (UTF-8 디코드)
    - sizeBytes: number
  </decode_result>
  <constants>
    - FILE_SIZE_LIMIT_MB = 5
    - DEBOUNCE_MS = 200ms (입력 >10KB일 때)
    - TOAST_MS = 1600ms
  </constants>
  <defaults>
    - 신규 사용자: mode="text", variant="standard", 입력 없음
    - localStorage 키: `jurepi-base64-encoder` { mode, variant }
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/base64-encoder" page="Base64Encoder(SPA 도구 라우트)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams는 레지스트리(상태 "live")를 반복해 SSG.</note>
</route_definitions>

<component_hierarchy>
  <base64_encoder>                    <!-- "use client"; mode/variant/input 상태 소유 + useBase64() -->
    <base64_intro />                  <!-- H1 + lead(가능하면 서버 렌더) -->
    <encoder_layout>                  <!-- 단일 열 flex 컨테이너 -->
      <mode_toggle />                 <!-- 텍스트 ↔ 파일 라디오 -->
      <variant_toggle />              <!-- 표준 ↔ URL-Safe 라디오 -->
      <text_input />                  <!-- Mode=text: 평문/Base64 textarea -->
      <file_input />                  <!-- Mode=file: 드래그드롭 파일 영역 -->
      <direction_toggle />            <!-- 인코드 ↔ 디코드 토글 -->
      <output_display />              <!-- 결과 textarea + 복사 / 다운로드 버튼 -->
    </encoder_layout>
    <base64_how_to />                 <!-- "Base64란?"(SEO; 서버 렌더) -->
    <base64_faq />                    <!-- Q&A + FAQPage JSON-LD -->
  </base64_encoder>
  <note>도구 내 SPA: mode/variant/direction 전환 = 로컬 상태, 라우트 네비게이션 아님.</note>
</component_hierarchy>

<pages_and_interfaces>
  <base64_intro>
    - 눈썹: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px tracking, var(--brand).
    - H1: "Base64 인코더 / 디코더" / "Base64 Encoder/Decoder" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: "텍스트와 파일을 Base64로 변환하고, Base64를 원본으로 복원하세요. UTF-8 안전하고 표준/URL-safe 모드 지원." / 영문 상응. 18px var(--text-secondary).
  </base64_intro>

  <mode_toggle>
    - 세그먼트 [텍스트] [파일]; 스타일 category-pill / category-pill-active(활성화 시 brand honey-gold).
    - 전환 시 반대 입력은 비활성화/지움.
  </mode_toggle>

  <variant_toggle>
    - 세그먼트 [표준] [URL-Safe]; 유사 스타일링. 도움말 텍스트: "표준(+/) vs URL-safe(-_)".
  </variant_toggle>

  <text_input>
    - Textarea, 전체 폭, rows=6, var(--surface) + 1px var(--hairline), 반경 var(--radius-lg) 16px, 패딩 16px.
    - 플레이스홀더: "텍스트 또는 Base64를 붙여넣으세요 / Paste text or Base64 here".
    - 라이브 onChange 디바운스(>10KB → 200ms).
    - 평문이 감지되면 인코드, 아니면 유효한 Base64이면 디코드.
  </text_input>

  <file_input>
    - 드래그드롭 영역: 120px min-height, dashed 2px var(--brand-soft) 테두리, 반경 var(--radius-lg), 중앙 정렬.
    - 아이콘(lucide File 또는 FileUp), 라벨 "파일을 드래그하거나 클릭해 선택 / Drag files or click to browse".
    - 숨겨진 파일 입력 type="file"; accept="*".
    - 크기 검증: ≤5MB; >5MB → 에러 토스트 "파일이 5MB를 초과합니다."
    - 피드백: 성공 시 "파일 선택됨: filename.ext (123 KB)".
  </file_input>

  <direction_toggle>
    - 세그먼트 [인코드 →] [← 디코드](모호하면 토글 표시; 아니면 자동 감지).
    - 실시간으로 출력 업데이트.
  </direction_toggle>

  <output_display>
    - Textarea, 전체 폭, rows=6, 읽기 전용, var(--surface-muted) 배경, text_input과 동일 스타일링.
    - 콘텐츠: 결과 Base64 또는 평문 또는 에러 메시지(var(--danger) 빨강).
    - 버튼: [Base64 복사] [Data-URI 복사](인코드 시) 또는 [텍스트 복사](디코드 시); [다운로드](파일 모드).
    - 버튼 상태: 성공 토스트 "복사됨" / "Copied", 1600ms 자동 닫기.
    - 다운로드는 Base64 접두사에서 MIME 타입 추론(예: "data:image/png;…" → download.png) 또는 원본 파일의 파일명 사용.
  </output_display>

  <error_states>
    - 디코드 시 유효하지 않은 Base64: "잘못된 Base64 형식입니다. A-Za-z0-9+/= 문자만 포함되어야 합니다."(표준) 또는 "…-_ 문자만…"(URL-safe).
    - 빈 입력: "텍스트 또는 파일을 입력하세요."
    - 파일이 너무 큼: "파일이 5MB를 초과합니다."
    - 복사 실패: 조용함(거짓 성공 토스트 없음).
  </error_states>

  <keyboard_shortcuts>
    - 단일 키 단축키 없음(textarea 입력과 충돌).
    - Tab 순서: mode → variant → direction → input → output → buttons (DOM 순서).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <encode_decode note="순수 도메인 계층">
    - safeDecode(base64: string, variant): { plaintext: string; sizeBytes: number } | { error: string }. RFC 4648에 따라 검증, UTF-8 에러 감지, 친화적 메시지 반환.
    - safeEncode(plaintext: string, variant): { base64: string; dataUri: string; sizeBytes: number }. TextEncoder + base64-js 또는 네이티브 안전 래퍼 사용.
    - urlSafeEncode(표준 base64): +→-, /→_ 교체; 필요하면 패딩 제거.
    - isValidBase64(input, variant): boolean — 변형별 regex 검증.
  </encode_decode>
  <file_handling>
    - FileReader.readAsArrayBuffer(file) → base64-js를 통해 인코드 → 추론된 MIME을 사용한 dataUri.
    - 다운로드: Blob(base64-디코드된 바이트, MIME) 생성, <a href=ObjectURL download=filename> 트리거.
    - MIME 추측: 기본값 text/plain, 또는 data-URI 접두사에서 추론.
  </file_handling>
  <persistence_adapter useBase64>
    - 마운트: `jurepi-base64-encoder` 읽기 → zod → 상태; 실패 → 인메모리(throw 없음).
    - 변경(mode/variant): 디바운스 JSON.stringify → setItem; 할당량/보안 캐치 → 인메모리 유지.
    - 노출: mode + setMode, variant + setVariant, inputText + setInputText, inputFile + setInputFile, outputText, error, isValidInput, encode(), decode(), copy(text), download(base64, filename).
  </persistence_adapter>
  <i18n>모든 UI 크롬은 tools.base64-encoder.*(ko/en)에서: mode/variant 라벨, 버튼 텍스트, 에러, FAQ. 인코드/디코드 로직은 로케일 무관.</i18n>
</core_functionality>

<error_handling>
  <input_validation>
    - decode: regex /^[A-Za-z0-9+/]*={0,2}$/ (표준) 또는 /^[A-Za-z0-9\-_]*={0,2}$/ (URL-safe). 불일치 → 친화적 에러.
    - 공백: 검증 전에 제거.
    - 빈 것: 힌트 표시, 출력 지우기.
  </input_validation>
  <file_size>≤5MB; >5MB → 에러 토스트 + 파일 거부.</file_size>
  <utf8_decode>atob → 바이트는 유효한 UTF-8이 아닐 수 있음. TextDecoder { fatal: true } → RangeError 발생 → "UTF-8로 디코드할 수 없음" 메시지.</utf8_decode>
  <clipboard>실제 성공 시에만 성공 토스트; 실패 시 조용함(복사는 부차적 UX).</clipboard>
  <error_boundary>플랫폼이 도구를 래핑; 렌더 실패 → 셸 충돌 없이 재시도.</error_boundary>
  <note>1차 네트워크 호출 없음; API 에러 표면 없음.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md는 모든 토큰의 단일 소스. 아래는 도구별 적용.</source>
  <accent_usage>
    - 카테고리 악센트는 CORAL(var(--accent-coral) / var(--accent-coral-soft)) — "dev" 카테고리 정체성. 소개 아이콘 타일, 토글 활성 상태, 버튼 호버.
    - CTA(주 버튼)는 brand honey-gold var(--brand) 유지. 악센트 = 정체성, 액션이 아님.
  </accent_usage>
  <layout>
    - 단일 열, max-width 720px, 중앙 정렬.
    - 세그먼트(mode/variant/direction 토글) 스택 또는 데스크톱 수평, 반응형.
    - Textarea 데스크톱 나란히(flex gap 20px); <768px 스택.
  </layout>
  <motion>transform/opacity만: 버튼 호버 lift 2px, focus-visible var(--focus-ring) 링. 모두 prefers-reduced-motion으로 게이트(순시 페이드).</motion>
  <accessibility>Textarea 라벨; 토글 ARIA; 버튼 ≥44px; 가시 포커스 링; AA 명도(밝은 배경의 var(--text)).</accessibility>
  <responsive>≥1024px 전체 나란히; <1024px 스택. 320px에서 오버플로우 없음.</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>사용자 입력은 클라이언트 측에서 처리; 절대 전송되지 않음. Base64 디코드는 Math.safe(TextDecoder가 UTF-8 검증 처리).</input>
  <file>FileReader 클라이언트 측만; 업로드 백엔드 없음. 다운로드 파일은 사용자가 생성(주입 위험 없음).</file>
  <clipboard>사용자 시작 복사만(클립보드 읽기 없음). 3rd-party 쿠키 없음.</clipboard>
  <privacy>인코드/디코드 콘텐츠를 포함하는 분석 이벤트 없음. 도구 복사는 명확히 명시: "Base64는 인코딩이지 암호화가 아닙니다 — 보안용으로 사용하지 마세요."</privacy>
  <note>비밀 없음, 네트워크 없음, 3rd-party 저장 없음.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>텍스트 인코드/디코드 왕복 UTF-8</description>
    <steps>
      1. Mode=Text, Direction=Encode, "Hello, 안녕하세요! 😀" 입력.
      2. 출력이 Base64 표시(기본값 표준 변형).
      3. Direction=Decode로 전환; 출력이 "Hello, 안녕하세요! 😀"로 디코드.
      4. Variant=URL-Safe로 전환; Base64 업데이트(+ → -, / → _).
      5. 디코드는 계속 동작(변형이 명확하면 디코드에 영향 없음).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>파일 업로드 인코드 + 다운로드</description>
    <steps>
      1. Mode=File; 1KB .txt 파일 드래그드롭.
      2. 피드백 "파일 선택됨: sample.txt (1.2 KB)".
      3. 출력이 Base64 + data-URI 표시.
      4. [Data-URI 복사] → 클립보드; [다운로드] → 추론된 MIME(text/plain) + 원본 파일명으로 브라우저 다운로드 트리거.
      5. >5MB 파일 드래그 → 에러 "파일이 5MB를 초과합니다."
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>지속성, 에러 처리, 접근성</description>
    <steps>
      1. mode=File, variant=urlSafe 설정; 새로고침 → 설정 지속(localStorage).
      2. Text 모드, 유효하지 않은 Base64 "ABC!@#" 붙여넣기(표준 모드) → 에러 "잘못된 Base64 형식…"
      3. 유효한 Base64 붙여넣기 → 성공적으로 디코드.
      4. axe 접근성 스캔 → 위반 없음; tab 순서 논리적; focus-visible 가시; prefers-reduced-motion 존중.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>i18n, SEO(JSON-LD)</description>
    <steps>
      1. /en으로 전환 → 모든 크롬 영어; 도움말 텍스트 영어.
      2. 프로덕션 빌드 → /ko/tools/base64-encoder 및 /en/tools/base64-encoder는 고유 title/description/canonical/hreflang/OG, 정적 생성.
      3. HTML이 SoftwareApplication + FAQPage JSON-LD 포함; how-to/FAQ는 지역화.
    </steps>
  </test_scenario_4>
</final_integration_test>

<success_criteria>
  <functionality>CRITICAL: UTF-8 왕복(이모지, 한글 등) 손상 없음. 표준 + URL-safe 인코드/디코드 양방향. 파일 ↔ Base64 5MB 한정 및 MIME 추론. 복사 + 다운로드 버튼 동작. 유효하지 않은 Base64가 친화적 에러 표시.</functionality>
  <user_experience>Mode/variant/direction 토글 순시; 페이지 새로고침 없음. 새로고침 간 지속. 복사 피드백 순시(toast 1.6s). 파일 입력 드래그드롭 직관적.</user_experience>
  <technical_quality>lib/base64-encoder/* 순수 ≥80% 단위 커버리지(encode/decode UTF-8 edge 케이스, 유효하지 않은 Base64 감지, URL-safe 왕복). useBase64 훅 localStorage 격리 테스트. TS 0 에러; 파일당 <800 라인.</technical_quality>
  <visual_design>DESIGN.md 준수; coral 악센트 정체성; 텍스트+파일 모드 UI 명확 구분; 반응형 320/768/1024.</visual_design>
  <accessibility>전체 키보드(tab 순서, 세그먼트 키 필요 시); aria-live 에러; WCAG 2.1 AA 명도.</accessibility>
  <seo>도구 라우트는 플랫폼 예산 내. SoftwareApplication + FAQPage JSON-LD 유효. How-to 장문형 존재.</seo>
</success_criteria>

<build_output>
  <note>플랫폼의 일부로 빌드됨(pnpm build). 빌드 전 훅 필요 없음. /[locale]/tools/base64-encoder는 플랫폼 generateStaticParams가 레지스트리(상태 "live")를 반복해 사전 렌더.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — ONE 항목 추가. 'dev' 카테고리는 이미 live(플랫폼 전제조건 없음).
    {
      id: 'base64-encoder',
      slug: 'base64-encoder',
      category: 'dev',
      icon: 'Binary',            // lucide-react
      accent: 'coral',
      status: 'live',            // 모듈 완성까지 'coming_soon'
      isNew: true,
      order: 25,                 // 다음 전역 순서(restaurant-map = 24)
      keywords: ['base64','encode','decode','encoding','binary','텍스트변환','파일변환','인코딩','디코딩','base64 converter'],
    },
    ```
    또한 도구 라우트의 ladder/qna-a-day 옆에 slug→component 분기(<Base64Encoder/>) 및 generateMetadata 분기 추가. categories.dev i18n 라벨, CATEGORY_ORDER, FOOTER_CATEGORIES는 이미 배선됨 — 다시 추가하지 마세요. i18n 네임스페이스 `tools.base64-encoder.*`는 반드시 최상위 `title`/`description` 포함(searchable-tools가 소비: 홈 카드, 푸터, 헤더 검색). 도구를 `public/llms.txt`에 등록. SNS 공유 버튼은 라우트 템플릿에서 무료로 제공(도구별 배선 없음). FAQPage JSON-LD는 `<Base64EncoderFaq>` 컴포넌트가 소유(단일 소유자, 가시 항목); SoftwareApplication JSON-LD는 플랫폼 seo 헬퍼를 통해 url == canonical.
  </platform_registry_change>
  <critical_paths>
    1. UTF-8 안전성: TextEncoder + base64-js(또는 안전한 네이티브) + TextDecoder. 절대 원본 `btoa`/`atob` 금지(non-Latin1에서 깨짐).
    2. 변형 선택: 표준(A-Za-z0-9+/) vs URL-safe(A-Za-z0-9-_) RFC 4648별 검증.
    3. 파일 업로드 + 다운로드: FileReader.readAsArrayBuffer → Base64 → Blob(바이트, MIME) → ObjectURL.
    4. localStorage 격리: 키 `jurepi-base64-encoder`, 마운트 시 정리.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/base64-encoder/{schema,encoder,base64,mime}.ts Vitest(RED→GREEN): UTF-8 인코드/디코드 왕복(이모지, 한글, 줄바꿈), URL-safe 변형, 유효하지 않은 Base64 감지, 패딩 규칙, MIME 추측.
    2. tools.base64-encoder.* 메시지(ko/en): mode/variant 라벨, 버튼 텍스트, 에러, FAQ.
    3. useBase64 훅(상태 머신 + localStorage + 복사 어댑터).
    4. ModeToggle + VariantToggle + DirectionToggle + TextInput + FileInput + OutputDisplay(폼 UX + 검증).
    5. 키보드 a11y, motion-reduce, WCAG AA(axe).
    6. Base64EncoderIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD 플랫폼 lib/seo.ts를 통해.
    7. 레지스트리 상태→live; slug→component + generateMetadata 분기; E2E 1–4; 시각 회귀 320/768/1024 양 테마.
  </recommended_implementation_order>
  <testing_strategy>순수 Vitest ≥80%(schema/encoder/base64/mime); FileReader 모의; 클립보드 모의; 컴포넌트 카탈로그 주입 상태; E2E 시나리오 1–4; Lighthouse CWV; axe a11y.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

SPEC은 `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-base64-encoder/docs/services/dev/base64-encoder/SPEC_KR.md`에 작성됨 — 431 라인.
