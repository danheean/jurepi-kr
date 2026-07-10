# UUID 생성기 — UUID 생성 및 검증 — 서비스 SPEC

> 이 문서는 **정본(한국어 번역)**입니다. AI 코딩 에이전트가 소비하는 정본은 [`SPEC.md`](SPEC.md)(영문)입니다. 양쪽을 동기 상태로 유지하세요.
>
> **UUID 생성기** 빌드 명세 — 의존성 없이 UUID(v4 임의, v7 시간 정렬, NIL)를 생성하고 RFC 9562 벡터 검사를 통한 선택적 서명 검증이 있는 브라우저 기반 도구입니다. 대량 생성(1–1000), 형식 옵션(대문자, 하이픈 없음, 중괄호, 따옴표 + 쉼표 for code paste), 행별 한 번 클릭 복사, 모두 복사, 다운로드(.txt/.csv). UUID 검사기: UUID를 붙여넣으면 → 버전/변형 감지, v7/v1의 내장 타임스탐프 추출. 순수 도메인 계층은 결정론적 암호화 RNG, 외부 암호화 라이브러리 없음(필요한 경우만 WebCrypto).
> 내부 서비스 코드명: `uuid-generator`. 레지스트리 id: `uuid-generator`. 공개 URL 슬러그: `/[locale]/tools/uuid-generator`.
>
> 이 SPEC은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO 인프라, 디자인 토큰은 플랫폼에서 제공됩니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 SPEC(같은 패턴): [`docs/services/dev/json-formatter/SPEC.md`](./json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>UUID 생성기 — UUID 생성 및 검증 (Jurepi 도구, 코드명 uuid-generator, 레지스트리 id uuid-generator)</project_name>

<overview>
UUID 생성기는 개발자를 위한 유틸리티로서 보편적으로 고유한 식별자(UUID)를 순시에, 로컬에서, 백엔드 없이 생성하고 검증합니다. 도구는 세 가지 핵심 UUID 유형을 지원합니다: **v4**(임의, RFC 4122 호환, crypto.getRandomValues 소스), **v7**(시간 정렬, 단조성 정렬 가능, 데이터베이스 및 분산 시스템에 적합 — RFC 9562 v7 명세를 정확한 version/variant 비트 필드와 순수 JavaScript 구현으로, 외부 deps 없음), 그리고 **NIL**(all-zeros, 00000000-0000-0000-0000-000000000000). 사용자는 단일 또는 대량 UUID를 생성할 수 있고(1–1000), 출력 형식을 커스터마이징할 수 있으며(대문자 / 소문자, hyphenated / no-hyphens, 중괄호 포함/제외, code paste용 쉼표 따옴표), 개별 행 또는 전체 배치를 한 번 클릭으로 복사하고, 일반 텍스트(.txt) 또는 CSV로 다운로드할 수 있습니다. 선택적 **UUID 검사기** 섹션은 사용자가 UUID를 붙여넣어 버전/변형을 감지하고 (v7의 경우) 내장 타임스탐프를 인간 친화적 현지 시간으로 추출할 수 있습니다.

CRITICAL(클라이언트 전용, 제로 네트워크): 100% 클라이언트 측, 백엔드 없음, 데이터베이스 없음, 외부 RNG 없음. UUID 생성은 v4 임의성을 위해 `crypto.getRandomValues`(WebCrypto, 브라우저 native)만 사용하고 v7 시간 정렬 및 변형 비트 수학을 위해 순수 JavaScript 산술만 사용합니다. 외부 암호화 라이브러리 없음. 모든 출력은 브라우저에 머물며, 로깅, analytics, 사용자 시작 다운로드를 제외한 네트워크 호출은 없음(direct Blob).

CRITICAL(SPA, 사용성 우선): 플랫폼 규칙에 따라 도구는 클라이언트 측 SPA입니다. 모든 상호작용 — format toggle, bulk count, 복사, 다운로드, UUID 검사 — 는 로컬 React 상태로 발생하며 라우트 네비게이션 없음. 도구 셸은 SEO를 위해 정적으로 생성되며, 상호작용 가능한 생성기는 단일 클라이언트 컴포넌트입니다.

CRITICAL(결정론성 & 공정성): v4 임의성은 crypto.getRandomValues만 (절대 Math.random 아님). v7 구현은 순수하고 결정론적이며 정확한 RFC 9562 version/variant 비트를 unit tests로 검증(RFC 9562 Appendix A 및 공개 available implementations로부터 황금 벡터가 정확성을 확인).

CRITICAL(UUID 로직용 외부 deps 없음): Uuid v4, v7, nil은 hand-written 순수 함수이며 uuid lib, crypto lib는 WebCrypto를 넘어서 없음. 정당화: uuid npm pkg는 무겁고, 이 도구는 v7에 대해 RFC 9562 호환만 필요하며, 이는 배우기 쉽고 결정론적으로 테스트 가능합니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/uuid-generator (SSG; 레지스트리 슬러그 "uuid-generator", id "uuid-generator", 상태 "coming_soon", 악센트 "mint", 카테고리 "dev").
  - 플랫폼이 제공(재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주변 Error Boundary, lib/seo.ts 메타데이터 빌더, breadcrumb + in_content ad wrapper.
  - 소비: i18n 네임스페이스 `tools.uuid-generator.*` (UI 크롬: format 라벨, 생성기 옵션, 복사 토스트, 다운로드 프롬프트, how-to, FAQ — UUID 데이터는 도구 자체에서).
  - 플랫폼 의존성(만족함): `'dev'` 카테고리는 이미 완전히 배선되고 live 상태입니다. 카테고리 설정 작업은 남아있지 않음 — 이 도구의 레지스트리 항목만 필요.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - UUID v4 생성(임의, RFC 4122, crypto.getRandomValues 소스).
    - UUID v7 생성(시간 정렬, RFC 9562, 데이터베이스용 정렬 가능, 정확한 version 7 및 variant 비트 포함).
    - NIL UUID 생성(all-zeros, 00000000-0000-0000-0000-000000000000).
    - 단일 또는 대량 생성(배치당 1–1000 UUID).
    - Format 옵션: 대문자(Y/N), hyphenated(Y/N), 중괄호(Y/N), code paste용 쉼표 따옴표(Y/N).
    - 복사 버튼: 단일 행 복사, 모두 복사, 한 번 클릭 클립보드 복사 + toast.
    - 다운로드: .txt(newline-delimited) 또는 .csv로 저장.
    - UUID 검사기: UUID를 붙여넣음 → format 검증 → version/variant 감지 → v7 또는 v1인 경우 타임스탐프 추출 및 현지 datetime으로 렌더.
    - inspect 시 입력 검증: malformed UUID 거부(잘못된 길이, 유효하지 않은 hex 문자, 예상되는 하이픈 누락).
    - localStorage 지속성: 사용자의 마지막 format 선택 기억(대문자, hyphenated, 중괄호, 따옴표).
    - 도구별 SEO 장문형("UUID란?") + FAQ + SoftwareApplication JSON-LD, ko/en.
    - Reduced-motion 폴백; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - UUID v1 또는 v5 또는 v6(포커스: v4 + v7만; v1 micro/clock는 시스템 clock 필요, scope 외).
    - UUID namespace 생성(v5 HMAC-SHA1, complex; 향후 Phase 2).
    - 커스텀 entropy 소스(도구는 crypto.getRandomValues만 사용).
    - 다수 UUID의 parsing / 일괄 검사.
    - UUID collision 테스트 또는 통계 분석.
  </out_of_scope>
  <future_considerations>
    - UUID v1/v5/v6 생성 — Phase 2.
    - 일괄 검사기(다수 UUID 붙여넣기, 각각의 version/variant 획득) — Phase 2.
    - UUID namespace/domain configurator for v5 — Phase 3.
    - Sortable UUID 성능 비교 chart — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl(ko/en) — 모두 플랫폼에서 상속.
  <module_specific>
    <uuid_v4>crypto.getRandomValues(Uint8Array) → version 4 및 variant 비트 설정(RFC 4122) → UUID 문자열로 포매팅(xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y ∈ {8,9,a,b}).
    <uuid_v7>현재 타임스탐프(Date.now() in ms, 48비트 Unix 타임스탐프 + 12비트 subsec 정밀도로 패드) + crypto.getRandomValues for random bits(74비트) + version 7 및 variant 비트(6비트 reserved). 정렬 가능: 시간 우선 정렬(같은 ms 내에서는 임의). 순수 산술, 외부 lib 없음.
    <uuid_nil>모두 영: 00000000-0000-0000-0000-000000000000.
    <format_options>문자열 변환: 대문자(.toUpperCase()), no-hyphens(remove -), 중괄호(wrap in {}), 쉼표 따옴표(wrap in quotes, 선택적으로 쉼표 추가).
    <parsing_and_validation>Regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i(hyphenated 36 chars). Also accept no-hyphens variant(32 hex chars). 버전 추출(byte 7 hi 4 bits), variant(byte 9 hi 2-3 bits per RFC 4122).
    <uuid_inspect>detectVersion(uuidStr): 1-7 또는 unknown 반환. v7의 경우: 첫 48비트에서 타임스탐프 추출 → 인간 친화적 local datetime 렌더.
    <copy>navigator.clipboard.writeText() with textarea 폴백; 에러 시 조용히 실패(복사는 보조).
    <download>Blob(.txt newline-delimited 또는 .csv) → URL → a[href] 트릭, 합성 클릭.
    <zod>zod v3.x for UI 상태 스키마(format 옵션, bulk count 등).
  </module_specific>
  <libraries>
    <no_external_uuid_lib>Hand-written v4/v7/nil; RFC 9562 호환성은 unit tests로 검증(황금 벡터).
    <webcrypto>v4/v7 임의성을 위한 Crypto.getRandomValues; WebCrypto 외 external crypto deps 없음.
    <zod>zod v3.x for state 검증.
  </libraries>
  <note>CRITICAL: 외부 uuid npm pkg 없음, WebCrypto를 넘어선 crypto libs 없음.
</technology_stack>

<file_structure>
src/
├── lib/uuid-generator/                    # 순수 도메인 계층 — React/Next 없음, 완전히 단위 테스트됨
│   ├── schema.ts                          # zod: FormatOptions, UuidVersion, InspectResult
│   ├── v4.ts                              # generateV4(rng?): string — RFC 4122 v4(테스트용 주입 RNG)
│   ├── v7.ts                              # generateV7(rng?, timestamp?): string — RFC 9562 v7(주입 RNG + 테스트용 선택적 타임스탐프)
│   ├── nil.ts                             # generateNil(): string — all-zeros UUID
│   ├── format.ts                          # formatUuid(uuid, options): string — uppercase/hyphens/braces/quotes 적용
│   ├── parse.ts                           # parseUuid(uuidStr): {version, variant, error?} — version/variant 감지
│   ├── inspect.ts                         # inspectUuid(uuidStr): {version, variant, timestamp?: Date, error?} — 전체 분석
│   ├── constants.ts                       # UUID 구조: 비트 위치, variant 필드 값(RFC 4122/9562)
│   └── errors.ts                          # Typed error codes: malformed_uuid / invalid_version / invalid_variant
├── components/tools/uuid-generator/
│   ├── UuidGenerator.tsx                  # 오케스트레이터(Client Component) — state 소유자
│   ├── useUuidGenerator.ts                # 훅: format 옵션, bulk count, localStorage
│   ├── GeneratorOptions.tsx               # Format 체크박스(대문자, 하이픈, 중괄호, 따옴표) + bulk count input
│   ├── UuidVersionSelector.tsx            # v4 / v7 / nil 라디오 버튼(기본 v4)
│   ├── GeneratorButton.tsx                # [Generate] CTA 버튼
│   ├── UuidList.tsx                       # 렌더 UUID 행, 각 행별 복사 버튼
│   ├── BulkActions.tsx                    # [Copy All], [Download .txt], [Download .csv] 버튼
│   ├── UuidInspector.tsx                  # Input textarea + parse + version/variant + 타임스탐프 표시
│   ├── UuidGeneratorIntro.tsx             # H1 + lead(SEO 장문형)
│   ├── UuidGeneratorHowTo.tsx             # "UUID란 무엇이고 왜 v7을 사용하는가?"(SEO)
│   ├── UuidGeneratorFaq.tsx               # FAQ + FAQPage JSON-LD
│   └── UuidGeneratorStructuredData.tsx    # SoftwareApplication JSON-LD(라우트가 렌더; Faq는 FAQPage 방출 안 함)
└── i18n/messages/{ko,en}.json             # tools.uuid-generator.* UI 크롬
</file_structure>

<core_data_entities>
  <format_options>
    - uppercase: boolean — 기본값 false(소문자)
    - hyphenated: boolean — 기본값 true(하이픈 있음)
    - braces: boolean — 기본값 false(중괄호 없음)
    - quoted: boolean — 기본값 false(따옴표 없음)
    PERSISTENT: localStorage key `jurepi-uuid-generator` stores { uppercase, hyphenated, braces, quoted }.
  </format_options>
  <uuid_generation>
    - version: enum(v4, v7, nil) — 기본값 v4
    - count: number 1–1000 — 기본값 1
    - output: string[] — 포매팅된 UUID 문자열 배열
  </uuid_generation>
  <uuid_structure_v4>
    - 128 bits 전체
    - time_low(32비트) 임의
    - time_mid(16비트) 임의
    - time_hi_and_version(16비트): high 4 bits = version(v4의 경우 0100), low 12 bits 임의
    - clock_seq_hi_and_reserved(8비트): high 2 bits = variant(RFC 4122의 경우 10), low 6 bits 임의
    - clock_seq_low(8비트) 임의
    - node(48비트) 임의
  </uuid_structure_v4>
  <uuid_structure_v7>
    - 128 bits 전체
    - unix_ts_ms(48비트): Unix 타임스탐프(ms)(정렬 가능)
    - subsec_a(4비트): subsecond(high 부분)
    - version(4비트): 0111(v7)
    - subsec_b(8비트): subsecond(low 부분)
    - variant(2비트): 10(RFC 4122 변형)
    - random(62비트): 임의
    RFC 9562 호환, 시간으로 정렬 가능(같은 ms 내에서는 임의로).
  </uuid_structure_v7>
  <inspect_result>
    - version: enum(1–7) 또는 unknown
    - variant: enum(RFC4122, Reserved, Microsoft, Future) 또는 unknown
    - timestamp?: Date — 추출 Unix 시간(v1/v7의 경우)
    - error?: string — malformed 또는 unsupported
  </inspect_result>
  <constants>
    - BULK_MAX = 1000(runaway 생성 방지)
    - NIL_UUID = "00000000-0000-0000-0000-000000000000"
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/uuid-generator" page="UuidGenerator(platform 도구 라우트 분기 slug→component)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams iterates registry(status "live")를 SSG.</note>
</route_definitions>

<component_hierarchy>
  <uuid_generator>                          <!-- "use client"; format 옵션 + version + count state 소유 + useUuidGenerator() -->
    <uuid_generator_intro />                <!-- H1 + lead(서버 렌더 가능한 경우) -->
    <generator_container>                   <!-- Stacked 또는 2-split 레이아웃 -->
      <generator_options />                 <!-- Format 체크박스 + bulk count 슬라이더/input -->
      <uuid_version_selector />             <!-- v4 / v7 / nil 라디오(기본 v4) -->
      <generator_button />                  <!-- [Generate] 버튼 -->
      <uuid_list />                         <!-- 렌더 행(개별 복사 버튼) -->
      <bulk_actions />                      <!-- [Copy All], [Download] 버튼 -->
      <uuid_inspector />                    <!-- 선택: 붙여넣기 + inspect 섹션(토글 가능) -->
    </generator_container>
    <uuid_generator_how_to />               <!-- SEO 장문형 -->
    <uuid_generator_faq />                  <!-- FAQPage JSON-LD -->
  </uuid_generator>
</component_hierarchy>

<pages_and_interfaces>
  <uuid_generator_intro>
    - Eyebrow: "개발자 도구" / "DEVELOPER TOOL" — 12px/700, var(--brand).
    - H1: "UUID 생성기" / "UUID Generator" — Gmarket Sans clamp(28px,5vw,40px)/700.
    - Lead: "데이터베이스부터 분산 시스템까지, UUID를 즉시 생성하고 검증하세요." / 영문 동등.
  </uuid_generator_intro>

  <generator_options>
    - Format 체크박스(4 toggles): 대문자, 하이픈(기본 on), 중괄호, 따옴표 쉼표.
    - Bulk count: 슬라이더 또는 number input, 1–1000(live preview "5개 UUID 생성").
    - Version 선택: v4(기본) / v7 / nil 라디오 버튼.
  </generator_options>

  <generator_button>
    - [Generate] 버튼(brand var(--brand), mint accent for mint 카테고리 정체성).
    - 클릭 시: count UUID를 version/format당 생성, 즉시 렌더.
  </generator_button>

  <uuid_list>
    - 모노스페이스 행, 각 UUID별 [Copy] 버튼(icon + text).
    - 복사 시: success toast "복사됨!" / "Copied!"; 클립보드는 포매팅 UUID 수신.
    - 행은 truncate/overflow:auto 필요한 경우, 320px guard는 overflow 없음 보장.
  </uuid_list>

  <bulk_actions>
    - [Copy All] 버튼: 모든 UUID를 newline-delimited로 복사.
    - [Download .txt] 버튼: plaintext로 저장(newline-delimited).
    - [Download .csv] 버튼: CSV로 저장(헤더 없음, 행당 하나 UUID).
  </bulk_actions>

  <uuid_inspector>
    - 토글 가능 advanced 섹션: [+] Inspector.
    - Textarea: UUID(또는 UUID-like 문자열) 붙여넣기.
    - [Analyze] 버튼 또는 붙여넣기 시 auto-parse.
    - Output: version(1–7 또는 unknown), variant(RFC4122/Microsoft/etc), 타임스탐프(v7/v1인 경우), 인간 친화적 datetime.
    - Error 상태: "Malformed UUID. Expected 36 hex chars with hyphens(8-4-4-4-12)."
  </uuid_inspector>

  <keyboard_shortcuts>
    - Ctrl+G → focus 생성기 옵션, bulk count 변경 준비.
    - Ctrl+C → 선택 UUID 또는 전체 복사(컨텍스트 종속).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <uuid_v4 note="임의, RFC 4122">
    - generateV4(rng): rng(Uint8Array) → WebCrypto crypto.getRandomValues 또는 주입 RNG(테스트).
    - Version 4 비트 설정(byte 7 hi nibble = 4).
    - Variant 비트 설정(byte 9 hi 2 bits = 10 binary).
    - 문자열로 포매팅: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx(y ∈ {8,9,a,b}).
    - 결정론성: 황금 테스트는 고정 RNG seed를 사용하는 경우 알려진 벡터와의 정확한 출력 확인.
  </uuid_v4>

  <uuid_v7 note="시간 정렬, RFC 9562">
    - generateV7(rng, timestamp?): 현재 Date.now() 또는 테스트용 override 사용.
    - Unix ms를 48비트 타임스탐프(첫 6 bytes)로 인코드.
    - Subsecond(12비트) + version 7(4비트 0111)을 bytes 7-8에 추가.
    - Variant 비트 설정(byte 9 hi 2 bits = 10 binary).
    - 62비트 임의 추가(bytes 10-16, rng 생성).
    - 결과: 생성 시간으로 정렬 가능, 같은 ms 내 단조(임의가 증가 시).
    - 결정론성: 고정 타임스탐프 + 고정 RNG → 동일 출력(unit tests는 RFC 9562 Appendix A 벡터와 검증).
  </uuid_v7>

  <uuid_nil>
    - 상수 반환: "00000000-0000-0000-0000-000000000000".
  </uuid_nil>

  <formatting>
    - formatUuid(uuid, {uppercase, hyphenated, braces, quoted}): 순서대로 변환 적용.
    - uppercase: .toUpperCase().
    - hyphenated: false → 하이픈 제거(uuid.replace(/-/g, '')).
    - braces: true → {}로 래핑.
    - quoted: true → 따옴표로 래핑, 선택적으로 쉼표 추가(code paste: "uuid", 또는 just "uuid").
  </formatting>

  <parsing_and_detection>
    - parseUuid(uuidStr): normalize(trim, lowercase), 36 문자 hyphenated OR 32 문자 no-hyphens에 대해 regex 테스트.
    - Version 추출(byte 7, hi nibble = bits 4–7).
    - Variant 추출(byte 9, hi 2–3 bits): 10 → RFC 4122; 110 → Microsoft; 111 → Future.
    - {version: 1–7 | unknown, variant: RFC4122|Microsoft|Future|unknown, error?: string} 반환.
  </parsing_and_detection>

  <inspect>
    - inspectUuid(uuidStr): parseUuid + v1 또는 v7인 경우 타임스탐프 추출.
    - v7: 첫 48 비트 = Unix ms → new Date(ms) → ISO + 현지로 렌더.
    - v1: bytes 1–7(1582-10-15 이후 100-nanosecond intervals) → 추출 및 Unix로 변환(참고: complex이지만 교육적).
    - {version, variant, timestamp?: Date, error?: string} 반환.
  </inspect>

  <persistence>
    - Mount: `jurepi-uuid-generator` localStorage에서 읽기 → zod parse → format 옵션 로드; 실패 → defaults로 시작.
    - Change: 모든 옵션 변경(uppercase, hyphenated, braces, quoted) 후 debounced setItem.
  </persistence>

  <i18n>모든 UI 크롬 tools.uuid-generator.*(ko/en): 라벨, format option 이름, 버튼 텍스트, 에러 메시지, how-to, FAQ. UUID 데이터는 로케일 무관.
</i18n>
</core_functionality>

<error_handling>
  <malformed_uuid>
    - Input이 36 문자(hyphenated) 또는 32 문자(no-hyphens)가 아님 → "Malformed UUID. Expected 36 hex characters with hyphens(8-4-4-4-12)."
    - 유효하지 않은 hex 문자 → "Invalid UUID. Contains non-hexadecimal characters."
  </malformed_uuid>
  <unsupported_version>
    - v1/v5/v6는 언급되지만 생성되지 않음; inspector에서 감지된 경우 정직한 메시지: "UUID version 1 detected. This tool generates v4 and v7 only."
  </unsupported_version>
  <input_validation>
    - Bulk count > 1000 → 1000으로 clamp, warning toast 표시 "Max 1000 UUIDs per batch."
    - Count < 1 → [Generate] 버튼 비활성화 또는 validation 에러 표시.
  </input_validation>
  <copy_failure>
    - 복사는 보조. clipboard API 실패 → 조용히(best-effort). 다운로드는 항상 available.
  </copy_failure>
  <storage>
    - localStorage unavailable(private mode) → prefs 인메모리, 무서운 에러 없음. 도구 완전 기능.
  </storage>
  <note>네트워크 호출 없음; 모든 에러는 클라 측(malformed input, 검증).
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md는 모든 토큰의 단일 정본. 다음은 도구별 애플리케이션.
  <accent_usage>
    - 카테고리 악센트는 MINT(var(--accent-mint) / var(--accent-mint-soft)) — DESIGN per "dev" 카테고리 정체성. Intro 아이콘 타일, [Generate] 버튼, version 선택 라디오 active 상태.
    - CTA(버튼)은 brand honey-gold var(--brand) 유지(Copy/Download) [Generate]를 제외하고 mint를 카테고리 정체성으로 사용할 수 있음.
    - UUID 리스트 항목 배경: surface-muted(light) with mint 강조 복사 버튼.
  </accent_usage>
  <layout>Options 패널(상단), 생성 버튼, UUID 리스트(주요), inspector(선택 접힘 섹션). Desktop ≥1024px: 2-col(옵션 좌측, 리스트 우측). Mobile <768px: stacked, 리스트 scrollable.
  <typography>H1 Gmarket Sans; UUID 모노스페이스(Menlo/Monaco/Courier New); UI 라벨/버튼 Pretendard.
  <motion>transform/opacity만: inspector expand 200ms, 복사 토스트 slide-up 250ms, [Generate] 버튼 glow on hover(var(--brand) shadow, no scale). 모두 prefers-reduced-motion으로 gated.
  <responsive>≥1024px: 2-col; 768–1023px: 2-col narrower; <768px: stacked. UUID 행은 필요한 경우 x scrollable, 320px에서 overflow 없음(모노스페이스는 gracefully scales down).
  <atmosphere>기술적이고 친화적: 모노스페이스 UUID, clear format 토글, 즉시 복사 피드백. No jargon; "v4 = 임의, v7 = 정렬 가능".
</aesthetic_guidelines>

<security_considerations>
  <rng note="암호화적 강력">
    - v4 및 v7 임의성은 ONLY crypto.getRandomValues(브라우저 native, CSPRNG).
    - 절대 Math.random(약함).
    - Unit tests는 결정론적 RNG를 주입해 재현 가능; production은 crypto.getRandomValues 사용.
  </rng>
  <privacy>UUID, format 옵션, 타임스탐프는 서버에 지속, analytics로 전송, 또는 원격 로그되지 않음. UI prefs(format 선택)만 localStorage.
  <no_network>사용자 시작 다운로드(direct Blob)를 제외한 API 호출 없음. 원격 측정 없음.
  <performance>UUID 생성 및 포매팅은 O(1); 복사/다운로드는 Blob(fetch 없음) 사용. 대량 1000 UUID는 순시 렌더(리스트 가상화 필요 없음).
  <note>시크릿 없음, 네트워크 없음, WebCrypto를 넘어선 외부 deps 없음.
</security_considerations>

<advanced_functionality>
  <uuid_v7_sorting>v7 UUID는 생성 시간으로 정렬 가능, 효율적 데이터베이스 인덱싱 및 조정 없는 분산 ID 생성 가능.
  <bulk_generation>배치당 1–1000 UUID 생성; format 옵션은 전체 배치에 적용.
  <format_customization>5 독립 토글은 모든 조합 허용(예: 대문자, no-hyphens, 중괄호, 따옴표 = {UUID}, code paste에 완벽).
  <uuid_inspection>모든 UUID 붙여넣기로 version/variant 감지 및 v1/v7의 타임스탐프 추출.
  <rfc_compliance>v4 및 v7 구현은 RFC 4122 및 RFC 9562 황금 벡터에 대해 검증.
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>v4 UUID 생성, 복사 및 다운로드</description>
    <steps>
      1. 기본값: v4, 소문자, 하이픈, no 중괄호, not 따옴표. [Generate] 클릭 → 1 v4 UUID 렌더(예: "a1b2c3d4-e5f6-4a1b-c2d3-e4f5a6b7c8d9").
      2. 복사 버튼 → 클립보드는 UUID 수신, toast "복사됨!" / "Copied!"
      3. bulk count를 5로 변경, [Generate] 클릭 → 5 v4 UUID 렌더.
      4. [Copy All] → 클립보드에 5 UUID newline-delimited.
      5. [Download .txt] → 브라우저가 "uuids.txt" 저장(5 UUID).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>v7 UUID 생성, 정렬 가능성 검증</description>
    <steps>
      1. v7 선택, 3 UUID 생성 → 렌더(예: "0186...xxxx", "0186...yyyy", "0186...zzzz" 모두 같은 high 48비트 if within same ms).
      2. 1-2초 지연 후 3 UUID 추가 → 더 높은 타임스탐프 비트 관찰(정렬 가능 속성).
      3. 대문자 토글 → UUID는 대문자 shift.
      4. no-hyphens 토글 → UUID는 하이픈 없이 렌더(32 문자).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>NIL UUID 생성, format 옵션</description>
    <steps>
      1. nil 선택, 1 생성 → "00000000-0000-0000-0000-000000000000" 렌더.
      2. 중괄호 토글 → "{00000000-0000-0000-0000-000000000000}".
      3. 따옴표 쉼표 토글 → "{\"00000000-0000-0000-0000-000000000000\",}".
      4. 모든 변환 올바르게 적용.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>UUID 검사기, version/variant 감지</description>
    <steps>
      1. [Inspector] 펼침.
      2. 알려진 v4 UUID 붙여넣기 → [Analyze] → 감지 "Version 4(random)" + "Variant: RFC 4122".
      3. v7 UUID 붙여넣기 → 감지 "Version 7(time-ordered)" + 타임스탐프 추출 및 렌더(예: "2026-07-06T14:30:45Z" + "월요일, 2026년 7월 6일, 오후 2:30 UTC").
      4. malformed 문자열 붙여넣기 → 에러 "Malformed UUID..."
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>접근성, reduced-motion, i18n</description>
    <steps>
      1. [Generate]로 Tab 네비게이트, Space/Enter 트리거.
      2. 복사 버튼은 aria-label, focus-visible ring.
      3. prefers-reduced-motion ON → inspector 펼침 순간(no slide), 복사 토스트 fade-only.
      4. /en으로 로케일 전환 → UI 라벨 전환(UUID / UUIDs, Version, Variant 등).
      5. axe 스캔 → violations 없음.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>v4, v7, nil 생성; 단일 또는 대량(1–1000); format 옵션(대문자, 하이픈, 중괄호, 따옴표); 행별 또는 모두 복사; .txt/.csv 다운로드; 검사(version/variant 감지, v7 타임스탐프 추출); localStorage prefs.
  <user_experience>순시 생성(지연 없음); 복사 토스트; 즉시 다운로드; ≥44px 타겟; 가시 포커스; SPA — 라우트 reload 없음; v7 정렬 가능성은 how-to에서 설명.
  <technical_quality>lib/uuid-generator/* pure ≥80% unit coverage(v4, v7, nil, format, parse, inspect); TS 0 errors; <800 lines per file; 황금 벡터 테스트(RFC 9562 Appendix A, 외부 참고).
  <visual_design>DESIGN.md compliant; mint accent 정체성; 모노스페이스 UUID(readable); clear format 토글; no jargon.
  <accessibility>전체 키보드(Tab, Space); roving focus; aria-라벨; reduce-motion: no slide/glow; WCAG 2.1 AA contrast; 프리렌더 SEO/FAQ.
  <performance>도구 라우트는 플랫폼 예산 내; 순시 UUID 생성(<1ms for 1000); 복사/다운로드 fetch 없음; LCP < 2.5s.
  <security>임의성은 crypto.getRandomValues만(CSPRNG). 네트워크 없음. 로깅 없음. Format 옵션 및 UUID는 절대 서버에 지속.
</success_criteria>

<build_output>
  <note>플랫폼(pnpm build)의 일부로 구축. /[locale]/tools/uuid-generator는 플랫폼 generateStaticParams iterates registry(status "live")로 사전 렌더.
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — ONE 항목 추가
    {
      id: 'uuid-generator',
      slug: 'uuid-generator',
      category: 'dev',
      icon: 'Shuffle',            // 또는 'Dices' / 'Hash' — lucide-react(mint 테마)
      accent: 'mint',
      status: 'coming_soon',
      addedAt: '2026-07-10',
      order: 35,                  // demand-based, jwt-decoder(30) 후
      keywords: ['UUID','생성','v4','v7','생성기','identifiers','generator','random','sortable','database','unique','distributed'],
    },
    // 플랫폼 의존성 없음: 'dev' 카테고리는 이미 완전히 배선됨.
    ```
  </platform_registry_change>
  <critical_paths>
    1. UUID v4 생성(crypto.getRandomValues, version/variant 비트 수학).
    2. UUID v7 생성(타임스탐프 인코딩, subsecond 정밀도, version/variant 비트, RFC 9562 호환).
    3. Format 변환(대문자, 하이픈, 중괄호, 따옴표).
    4. UUID 파싱 및 version 감지(regex, 비트 추출).
    5. v7/v1 타임스탐프 추출 및 렌더(Intl.DateTimeFormat for 인간 친화적 시간).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/uuid-generator/{v4, v7, nil, format, parse, inspect, schema, constants, errors}.ts(Vitest ≥80%, 황금 벡터 테스트).
    2. tools.uuid-generator.* 메시지(ko/en): 라벨, format option 이름, 버튼 텍스트, 에러 메시지, how-to, FAQ.
    3. GeneratorOptions + UuidVersionSelector(체크박스/라디오, localStorage load/save).
    4. GeneratorButton + UuidList(UUID 렌더, 복사 버튼).
    5. BulkActions([Copy All], [Download .txt/.csv]).
    6. UuidInspector(붙여넣기, parse, version/variant/타임스탐프 렌더).
    7. useUuidGenerator 훅(상태 관리, localStorage).
    8. UuidGenerator 오케스트레이터 + 키보드 단축키.
    9. Intro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    10. 레지스트리 status→live; slug→component + generateMetadata 분기.
    11. 키보드/reduce-motion/a11y pass; axe 스캔.
    12. E2E 1–5 scenarios; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>
    - Unit(Vitest ≥80%): v4/v7/nil 생성(주입 RNG for 결정론성, 황금 벡터), format(대문자/하이픈/중괄호/따옴표 combo), parse(valid/malformed UUID, version 감지), inspect(v7 타임스탐프 추출), 복사 폴백, 다운로드 blob.
    - Component: GeneratorOptions state, UuidVersionSelector toggle, UuidList render + 복사, BulkActions, UuidInspector parse + 표시.
    - E2E(Playwright): scenarios 1–5(생성, format, 다운로드, 검사, 키보드/reduce-motion/i18n).
    - Visual regression: 320/768/1024 both themes, bulk 100 UUID(scrollable), inspector 펼침/접힘.
    - A11y: axe + 키보드(Tab, Space) + reduce-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
