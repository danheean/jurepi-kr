# URL 인코더 / 디코더 — 양방향 퍼센트 인코딩과 쿼리 문자열 검사 — 서비스 SPEC

> 이 문서는 **정본(한국어 번역)**입니다. AI 코딩 에이전트가 소비하는 정본은 [`SPEC.md`](SPEC.md)(영문)입니다. 양쪽을 동기 상태로 유지하세요.
>
> **URL 인코더**(URL 인코딩·디코딩) 빌드 명세 — 클라이언트 측 텍스트 변환기로, URL 텍스트를 두 가지 모드(`encodeURIComponent` vs `encodeURI`)에서 인코드하고 디코드하며, 두 가지 문자셋(**UTF-8** 기본값 및 레거시 한국어 URL을 위한 **EUC-KR/CP949**)을 지원하고, 쿼리 문자열을 테이블로 파싱·편집하고, 여러 줄을 일괄 처리하며, 엣지 케이스(잘못된 시퀀스, 유니코드, 이미 인코딩된 입력, 표현 불가능한 문자, 빈 입력)를 친화적 에러로 처리합니다. 콘텐츠는 순수 도메인 로직(단위 테스트)이며, localStorage 지속성 최근 항목, 그리고 완전 클라이언트 측입니다. 이 도구는 클라이언트 측 SPA로 플랫폼 셸에 마운트됩니다.
> 내부 서비스 코드명: `url-encoder`. 레지스트리 id: `url-encoder`. 공개 URL 슬러그: `/[locale]/tools/url-encoder`.
>
> 이 SPEC은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO & 광고 인프라, 디자인 토큰은 플랫폼에서 제공됩니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 SPEC(같은 패턴): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>URL 인코더 / 디코더 — 퍼센트 인코딩과 쿼리 문자열 검사 (Jurepi 도구, 코드명 url-encoder, 레지스트리 id url-encoder)</project_name>

<overview>
URL 인코더는 URL 텍스트 인코딩과 디코딩을 명확성과 정확성으로 한 곳에 모읍니다. 사용자가 문자열을 붙여넣고 두 방향 중 하나를 선택합니다: 인코드(텍스트 → 퍼센트 인코딩 URL 텍스트) 또는 디코드(퍼센트 인코딩 → 읽을 수 있는 텍스트). 두 가지 모드가 존재해 다양한 필요를 충족합니다: **컴포넌트 모드**(`encodeURIComponent` / `decodeURIComponent`)는 URL 쿼리 매개변수와 조각 식별자용이고, **전체 URI 모드**(`encodeURI` / `decodeURI`)는 슬래시, 콜론, 해시가 인코딩되지 않아야 하는 완전 URL 문자열용입니다. 각 모드는 차이를 미리 설명해 사용자가 어느 것을 쓸지 이해하도록 합니다. 특수 기능 — **쿼리 문자열 테이블 뷰** — URL 쿼리 매개변수(`?a=1&b=2`)를 편집 가능한 키/값 행으로 파싱하고, 편집 시 전체 쿼리를 다시 빌드합니다. 일괄 모드는 여러 줄을 한 번에 처리하고, 모든 결과는 성공 피드백과 함께 복사 가능합니다. 최근 항목(마지막 10개 입력)은 빠른 재사용을 위해 localStorage에 있습니다.

이 도구는 "내 텍스트가 올바르게 인코딩됐나?" 및 "`%20`은 뭔가?"라는 마찰을 순시적·명확한 결과와 네트워크 호출 없음으로 해결합니다.

**문자셋 선택기**(UTF-8 기본값 / EUC-KR)는 레거시 한국어 URL로 작업하는 반복되는 현실적 필요를 처리합니다. 많은 구형 한국 사이트와 시스템은 비ASCII 문자를 UTF-8이 아니라 EUC-KR(CP949) 바이트로 퍼센트 인코딩하므로, `%C7%D1%B1%DB`은 `한글`로 디코드되어야 하며, 잘못된 시퀀스 에러가 아닙니다. UTF-8이 기본값이고 네이티브 빠른 경로입니다; EUC-KR은 옵트인이고, 인코딩의 경우 온디맨드 로드(기술 스택 참조)되므로 기본 번들에 세금을 부과하지 않습니다.

CRITICAL(클라이언트 전용, SSG): 100% 클라이언트 측입니다. 백엔드 없음, 데이터베이스 없음, 런타임 API 호출 없음. 유일한 자사 지속성은 localStorage(최근 항목)이고, 네트워크로 전송되는 것은 없습니다. UTF-8 인코딩/디코딩은 동기식입니다(네이티브 JS `encodeURIComponent`/`decodeURIComponent`/`encodeURI`/`decodeURI` 및 수동 퍼센트 시퀀스 파싱). EUC-KR **디코딩**은 브라우저 네이티브 `TextDecoder('euc-kr')`을 사용합니다(의존성 없음); EUC-KR **인코딩**은 동적으로 임포트되는 CP949 정방향 테이블을 사용합니다(코드 분할, 사용자가 실제로 EUC-KR로 인코딩할 때만 로드).

CRITICAL(에러 처리, 견고성): 디코드 시 잘못된 퍼센트 시퀀스(`decodeURIComponent`에서의 `URIError`)는 앱을 절대 충돌시키지 않습니다 — 친화적 에러 메시지가 무엇이 잘못됐는지 설명합니다. 인코드 시 이미 인코딩된 입력은 선택적 경고를 트리거합니다(사용자는 계속하거나 먼저 검사할 수 있습니다). 유니코드(이모지, CJK, 악센트)는 깔끔하게 왕복합니다. 빈 입력은 유효한 noop 경우입니다. 모든 엣지 케이스는 단위 테스트로 ≥90% 도메인 커버리지됩니다.

CRITICAL(사용성 우선, SPA): 플랫폼 규칙에 따라, 모든 Jurepi 도구는 SSG 셸에 마운트된 클라이언트 측 SPA(Single-Page Application)입니다. 모든 상호작용 — 모드 전환, 방향 토글, 테이블 편집, 일괄 온/오프, 복사 — 로컬 React 상태로 발생하며 라우트 네비게이션 없음, 전체 페이지 새로고침 없음입니다. 사용성이 최우선입니다: 텍스트 붙여넣기, 모드/방향 선택, 순시 결과 표시, 복사, 완료.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/url-encoder (SSG; 레지스트리 슬러그 "url-encoder", id "url-encoder", 상태 "live", 악센트 "grape", 카테고리 "dev").
  - 플랫폼이 제공(재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주변 Error Boundary, lib/seo.ts 메타데이터 빌더, 빵조각 + 콘텐츠 내 광고 래퍼.
  - 소비: i18n 네임스페이스 `tools.url-encoder.*`(UI 크롬 문자열: 모드/방향/문자셋 라벨, 일괄 토글, 에러 메시지, 어떻게-하는지, FAQ — 인코딩된 콘텐츠 아님; 그것은 사용자 제공).
  - 플랫폼 전제 조건(CRITICAL): `'dev'` 카테고리는 `ToolCategory` 타입 유니온에 존재하지만 아직 배선되지 않았습니다(메시지에 `categories.dev` i18n 라벨 없음, `CATEGORY_ORDER`에 없음, `FOOTER_CATEGORIES`에 없음). 이 도구를 live 상태로 추가하기 전에, `dev` 카테고리를 활성화하세요: (1) 두 로케일 메시지 파일에 i18n 항목 `categories.dev: { ko: "개발", en: "Developer" }`를 추가합니다. (2) `CATEGORY_ORDER` 배열에 `'dev'`를 추가합니다. (3) `FOOTER_CATEGORIES` 필터 리스트에 `'dev'`를 추가합니다. (4) `'dev'`에 카테고리 악센트 색상을 할당합니다(제안: `'grape'` = `var(--accent-grape)` per 이 도구의 악센트). 이것은 일회성 플랫폼 설정이며, 모든 향후 dev 도구가 공유합니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **두 인코딩 방향**: 인코드(텍스트 → 퍼센트 인코딩) 및 디코드(퍼센트 인코딩 → 텍스트) 토글 버튼.
    - **명확한 설명을 갖춘 두 모드**: (1) 컴포넌트 모드(`encodeURIComponent` / `decodeURIComponent`) 쿼리 매개변수/조각용, (2) 전체 URI 모드(`encodeURI` / `decodeURI`) 완전 URL용 — 플랫폼이 차이를 설명(각각에서 인코딩되지 않은 상태로 남아있는 것).
    - **문자셋 선택기(UTF-8 / EUC-KR)**: UTF-8(기본값)은 네이티브 JS 함수를 사용; EUC-KR(CP949)은 레거시 한국어 URL을 처리합니다. 디코드는 네이티브 `TextDecoder('euc-kr')`를 사용; 인코드는 동적으로 임포트되는 CP949 정방향 테이블을 사용(코드 분할). ASCII 전용 입력은 문자셋 무관(동일 바이트). 선택된 문자셋은 세션별로 지속되고 인코드와 디코드 모두에 적용됩니다. CP949에 없는 비ASCII 문자(예: 이모지)는 인코드 시 친화적 "EUC-KR에서 표현할 수 없음" 에러를 나타냅니다.
    - **텍스트 입력(단일 또는 일괄)**: 단일 라인 입력 필드(URL 또는 텍스트 붙여넣기); 선택적 일괄 모드 토글로 여러 줄(줄바꿈 구분) 처리, 각각 독립적으로 인코드/디코드되며 결과는 스택됩니다.
    - **쿼리 문자열 테이블 뷰**: `?key1=val1&key2=val2`를 대화식 행(키/값 입력)으로 파싱; 제자리 값 편집; "URL 다시 빌드" 버튼이 테이블을 쿼리 문자열로 다시 직렬화합니다. `+`을 공백 옵션으로 처리합니다.
    - **더하기-공백 토글**: 체크박스 옵션 "더하기를 공백으로 취급" 레거시 폼 인코딩 입력(application/x-www-form-urlencoded 스펙).
    - **이미 인코딩된 검출**: 휴리스틱 검사(`%xx` 시퀀스 존재) 사용자가 이중 인코딩할 수 있음을 시사; 논블로킹 경고 UI는 사용자가 계속하도록 합니다.
    - **클립보드로 복사**: "결과 복사" 버튼(키보드 단축키) → navigator.clipboard.writeText → 숨겨진 textarea 폴백 → 사용 불가 시 조용히 실패(중요 기능 아님).
    - **최근 입력**: 마지막 10개 입력 문자열이 localStorage에 저장; 빠른 재사용을 위한 "최근" 드롭다운 / 리스트(로드 시 알려지지 않은/오래된 항목 자동 제거).
    - **지역화된 에러 메시지 및 UI 크롬**(ko/en via tools.url-encoder.*).
    - **전체 키보드 지원**: Tab으로 모든 입력 네비게이션, Enter로 인코드/디코드, "/" + "r" 단축키, Esc로 지우기.
    - **도구별 SEO 장문형**("URL 인코딩이란?" / "컴포넌트 vs 전체 URI 사용 시기" / "한국어 URL을 위한 UTF-8 vs EUC-KR" / 가이드) + FAQ(FAQPage JSON-LD), 지역화 ko/en.
    - **Reduced-motion 폴백**; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - 전체 URL 파싱 / 검증 스위트(도메인 파싱, 경로, 프로토콜 검증은 범위 밖; 이 도구는 인코딩에 집중).
    - 백엔드 API(모든 인코딩/디코딩은 클라이언트 측, 0 지연).
    - 파일명 / MIME 타입 인코딩(도구는 URL 특화).
    - 사전 입력된 입력을 갖춘 도구별 딥링크 URL(MVP는 단일 라우트 + 클라이언트 상태).
  </out_of_scope>
  <future_considerations>
    - 입력별 딥링크 상태(예: `/tools/url-encoder?input=hello&mode=component&dir=encode`) — Phase 2.
    - 퍼센트 시퀀스 바이트 수준 검사를 위한 헥스 뷰어 — Phase 2.
    - 다중 URL 비교(입력 전반 인코딩 비교) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <encoding_decoding>UTF-8: 네이티브 JS `encodeURIComponent`, `decodeURIComponent`, `encodeURI`, `decodeURI` + 수동 퍼센트 시퀀스 검증/에러 처리.</encoding_decoding>
    <charset note="UTF-8 기본값 + EUC-KR/CP949 레거시 지원, 도메인 레이어 코덱 인터페이스 뒤에 격리되어 구체적 코덱이 교체 가능">
      - **디코드(모든 문자셋, 네이티브)**: 수동으로 입력을 원본 바이트 배열로 파싱(`%XX` → 바이트; 평문 ASCII → 그 코드), 그 다음 `new TextDecoder(charset).decode(bytes)`. `TextDecoder`는 모든 에버그린 브라우저에서 `'utf-8'`과 `'euc-kr'`(CP949) 모두를 지원합니다 — EUC-KR 디코드를 위한 의존성 없음. 잘못된 바이트 시퀀스 → 친화적 에러(TextDecoder 치명 모드 또는 사후 검증).
      - **인코드 UTF-8**: 네이티브 `encodeURIComponent`/`encodeURI`(변경 없는 빠른 경로).
      - **인코드 EUC-KR**: `TextEncoder`는 UTF-8 전용이므로, CP949 바이트로의 각 문자를 매핑하는 **동적으로 임포트된** 정방향 테이블(`await import('./charset/cp949-encode')`)을 통해, 그 다음 선택된 모드와 동일한 "어느 문자가 인코딩되지 않은 상태로 남아있는가" 규칙 세트를 사용해 바이트를 퍼센트 이스케이프합니다(ASCII unreserved/reserved 문자는 UTF-8과 동일하게 동작; 비ASCII 바이트만 다름). CP949에 없는 문자 → 타입 `UnencodableCharError` 발생 UI에서 캐치됨.
      - **코드 분할**: CP949 테이블(수십 KB)은 사용자가 실제로 EUC-KR로 인코딩할 때만 온디맨드로 임포트되어, 기본 UTF-8 경로를 마이크로사이트 JS 예산(<80KB) 내에 유지합니다. 디코드 경로는 테이블이 필요 없습니다(네이티브 TextDecoder).
      - **도메인 인터페이스**: `lib/url-encoder/charset.ts`는 `bytesToText(bytes, charset)`와 `textToBytes(text, charset): Promise<Uint8Array>`를 노출(비동기 EUC-KR 인코드 지연 로드 때문); UTF-8은 동기/즉시 해결.
    </charset>
    <validation>zod v3.x 입력 스키마(최대 길이, 쿼리 테이블 구조). 도메인 레이어의 단일 소스 검증(생성기와 UI 모두에서 재사용 가능).
    </validation>
    <query_parser>수동 문자열 분할/조인(`?key=val&key2=val2` → Array<{key, val}> → 뒤로 문자열). 외부 파서 라이브러리 없음; 도움이 되면 내장 URL API(URLSearchParams) 활용하되 파싱 로직을 투명하게 유지해 테스트 가능하게.</query_parser>
    <localStorage>jurepi-url-encoder 키, zod 검증 스키마, 로드 시 알려지지 않은 항목 자동 제거, 사용 불가 시 정상 실패(인메모리 세션 폴백).
    </localStorage>
    <clipboard>navigator.clipboard.writeText → 숨겨진 textarea execCommand 폴백 → 조용히 실패(보조 기능; 복사 항상 선택적).
    </clipboard>
    <animation>네이티브 CSS 전환만(입력 포커스, 버튼 누르기, 결과 페이드). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — 이미 리포에 있음; 입력/쿼리 테이블 스키마 검증을 위해 재사용.</zod>
    <cp949_encode note="EUC-KR/CP949 정방향(텍스트→바이트) 테이블 인코드만; 동적 임포트">후보: 자체 포함 CP949 정방향 맵(예: js-codepage의 `cptable`, 또는 벤더된 최소 CP949 코덱). 가장 작은 gzip 풋프린트를 선택; `charset.ts` 뒤에 래핑하면 교체 가능합니다. 디코드에는 필요 없음(네이티브 `TextDecoder('euc-kr')`). 동적 임포트로 지연 로드되어야 하며, 도구의 초기 청크에 절대 있으면 안 됩니다.</cp949_encode>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/url-encoder/                          # 순수 도메인 계층 — React/Next 없음, 완전히 단위 테스트됨
│   ├── schema.ts                             # zod: InputSchema(문자셋 포함), QueryTableSchema, StoreSchema + 검증 도우미
│   ├── encode.ts                             # encodeComponent(text, charset), encodeUri(text, charset) (euc-kr 비동기), handleAlreadyEncoded(text) 휴리스틱
│   ├── decode.ts                             # decodeComponent(text, {plusAsSpace?, charset}), decodeUri(...), 바이트 배열 %xx 파싱 → TextDecoder, 에러 처리(잘못된/유효하지 않은 바이트 → 친화적 메시지)
│   ├── charset.ts                            # 코덱 인터페이스: bytesToText(bytes, charset) [네이티브 TextDecoder], textToBytes(text, charset): Promise<Uint8Array> [utf-8 동기; euc-kr 지연 임포트 cp949 테이블], UnencodableCharError
│   ├── charset/
│   │   └── cp949-encode.ts                   # CP949 정방향 맵(텍스트→바이트) EUC-KR 인코드용; 동적 임포트만(초기 청크에 절대 없음)
│   ├── query-parser.ts                       # parseQueryString(str), serializeQueryTable(rows), edit(rows, idx, key/val) 불변식 ops
│   ├── recents.ts                            # 불변식 ops: pushRecent(list, text, max=10), pruneUnknown(list, validate), 직렬화/역직렬화
│   └── unicode.ts                            # 왕복 테스트 도우미(이모지, CJK, 악센트; UTF-8 + EUC-KR CJK) — 단위 테스트가 사용
├── components/tools/url-encoder/
│   ├── UrlEncoder.tsx                        # 오케스트레이터(Client Component) — 모드/방향/일괄/테이블 상태 + useUrlEncoder() 소유자
│   ├── useUrlEncoder.ts                      # 훅: localStorage 최근 항목 + 파생 모드/방향 로직; 인코드/디코드 디스패처
│   ├── ModeToggle.tsx                        # 컴포넌트 / 전체 URI 라디오 또는 탭
│   ├── CharsetToggle.tsx                     # UTF-8 / EUC-KR 선택기(기본 UTF-8) + 인라인 "레거시 한국어 URL" 도움말
│   ├── DirectionToggle.tsx                   # 인코드 ⇄ 디코드 토글 버튼
│   ├── TextInput.tsx                         # 주 입력 필드(붙여넣기 영역, 일괄 모드에서 다중 라인 가능)
│   ├── ResultOutput.tsx                      # 인코딩/디코딩 결과 표시 + 복사 버튼 + 성공 토스트
│   ├── QueryTableView.tsx                    # 쿼리 문자열 파서 UI(키/값 행, 편집 가능, 다시 빌드 버튼)
│   ├── BatchToggle.tsx                       # 다중 라인 일괄 처리 활성화/비활성화
│   ├── AlreadyEncodedWarning.tsx             # 입력이 이미 인코딩된 것처럼 보일 시 친화적 힌트(휴리스틱 검사)
│   ├── RecentsList.tsx                       # 최근 입력의 드롭다운 / 사이드 패널(클릭으로 입력 채우기)
│   ├── PlusAsSpaceToggle.tsx                 # 레거시 폼 인코딩을 위한 체크박스
│   ├── UrlEncoderIntro.tsx                   # H1 + lead(SEO 장문형 소개)
│   ├── UrlEncoderHowTo.tsx                   # "URL 인코딩이란?" / "컴포넌트 vs 전체 URI" / "UTF-8 vs EUC-KR(레거시 한국어 URL)"(SEO 장문형)
│   ├── UrlEncoderFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── error/
│       └── MalformedSequenceError.tsx        # URIError 시 친화적 에러 렌더(잘못된 %xx)
└── i18n/messages/{ko,en}.json                # tools.url-encoder.* UI 크롬(모드/방향 라벨, 일괄, 복사 피드백, 어떻게-하는지, FAQ)
</file_structure>

<core_data_entities>
  <input_state note="단일 문자열 또는 다중 라인 텍스트">
    - text: string(원본 사용자 입력 — URL 텍스트 또는 평문)
    - batchMode: boolean(true면, 줄바꿈으로 분할, 각 라인 인코드/디코드, 결과 스택)
    - direction: 'encode' | 'decode'
    - mode: 'component' | 'uri'
    - charset: 'utf-8' | 'euc-kr'(기본값 'utf-8'; 인코드와 디코드 모두에 적용)
    - plusAsSpace: boolean(레거시 폼 인코딩 시 디코드)
  </input_state>
  <query_table_row note="쿼리 문자열의 한 매개변수">
    - key: string(매개변수 명)
    - value: string(매개변수 값, 빈 값일 수 있음)
    INVARIANT: 키 비어있지 않음(또는 생략), 값 모든 문자열(빈 값 포함). null 없음.
  </query_table_row>
  <encode_result note="인코드 작업의 출력">
    - result?: string(퍼센트 인코딩 텍스트)
    - alreadyEncodedHint: boolean(휴리스틱: %xx 존재는 입력이 이미 인코딩됐을 수 있음을 시사)
    - error?: { message: string; details: string } | null(UTF-8 인코드는 절대 throw하지 않음; EUC-KR 인코드는 UnencodableCharError 발생 가능 — 문자에 CP949 매핑이 없을 때(예: 이모지) — 여기서 보고되며 미안 문자 포함)
  </encode_result>
  <decode_result note="디코드 작업의 출력">
    - result?: string(디코드 텍스트, 성공 시)
    - error?: { message: string; details: string }(잘못된 %xx 시퀀스 또는 선택된 문자셋에 유효하지 않은 바이트 시 친화적 에러; URIError / TextDecoder에서)
  </decode_result>
  <store_recents note="localStorage 지속성">
    - version: number(STORE_VERSION, 1부터 시작)
    - recents: string[](마지막 10개 인코드/디코드 입력, 삽입 순서, 중복 제거, 로드 시 제거)
    - meta: { createdAt: number }
    localStorage 키: `jurepi-url-encoder`
    INVARIANT: 읽기는 zod 파싱; 실패 → 신규 시작(throw 아님). 알려지지 않은/유효하지 않은 항목 제거.
  </store_recents>
  <constants>
    - RECENTS_MAX = 10; INPUT_MAX_LEN = 10000 문자(도메인 검증); BATCH_MAX_LINES = 100.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/url-encoder" page="UrlEncoder(플랫폼 도구 라우트 분기 슬러그→컴포넌트)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams는 레지스트리(상태 "live")를 반복해 SSG.</note>
</route_definitions>

<component_hierarchy>
  <url_encoder>                    <!-- "use client"; 방향/모드/일괄/테이블 상태 소유 + useUrlEncoder() -->
    <url_encoder_intro />          <!-- H1 + lead(가능하면 서버 렌더) -->
    <encoder_layout>               <!-- 주 2열 또는 스택 모바일 레이아웃 -->
      <encoder_main>               <!-- 좌측/상단 열 -->
        <mode_toggle />            <!-- 컴포넌트 / 전체 URI 라디오 -->
        <charset_toggle />         <!-- UTF-8 / EUC-KR 선택기(기본 UTF-8) -->
        <direction_toggle />       <!-- 인코드 / 디코드 토글 -->
        <text_input />             <!-- 붙여넣기 영역; 일괄 활성화 시 다중 라인 가능 -->
        <batch_toggle />           <!-- 다중 라인 모드 활성화 -->
        <plus_as_space_toggle />   <!-- 레거시 폼 인코딩 옵션(디코드만) -->
      </encoder_main>
      <encoder_result>             <!-- 우측/하단 열, 데스크톱에서 sticky -->
        <result_output />          <!-- 인코딩/디코딩 결과 + 복사 버튼 -->
        <already_encoded_warning/> <!-- 입력이 이중 인코딩처럼 보일 시 -->
      </encoder_result>
    </encoder_layout>
    <query_table_view />           <!-- 선택적 탭: 파싱 & 편집 쿼리 문자열(토글될 때까지 숨김) -->
    <recents_list />               <!-- 최근 입력 패널(사이드 드로어 또는 드롭다운 가능) -->
    <url_encoder_how_to />         <!-- SEO 장문형 설명 -->
    <url_encoder_faq />            <!-- FAQPage JSON-LD -->
  </url_encoder>
  <note>도구 내 SPA: 모든 상태 변경(모드/방향/일괄/테이블 편집)은 로컬 React 상태, 라우트 네비게이션 없음. 결과 패널과 쿼리 테이블은 같은 뷰에 있습니다.</note>
</component_hierarchy>

<pages_and_interfaces>
  <url_encoder_intro>
    - 눈썹: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "URL 인코더" / "URL Encoder" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 문장, body-lg 18px var(--text-secondary): "URL 텍스트를 인코딩·디코딩하고, 쿼리 매개변수를 편집하세요. 컴포넌트/전체 URI 모드와 UTF-8·EUC-KR 문자셋(레거시 한국어 URL)을 즉시 전환하세요." / 영문 상응("…switch between component/full-URI modes and UTF-8/EUC-KR charsets for legacy Korean URLs.").
  </url_encoder_intro>

  <text_input>
    - DESIGN 텍스트 입력 스타일, 주 열 전체 폭, 플레이스홀더 "텍스트 또는 URL을 붙여넣으세요…" / "Paste URL or text here…".
    - 기본값은 단일 라인. 일괄 토글은 textarea로 확장(≥ 120px 높이, 래핑).
    - 문자 카운터(현재 / 최대 10000), 80%에서 경고.
    - aria: role="textbox", aria-label, 힌트를 위한 aria-describedby.
  </text_input>

  <mode_toggle>
    - 두 옵션(라디오 또는 탭): **컴포넌트**(encodeURIComponent / decodeURIComponent) — "쿼리 매개변수 &amp; 조각" / "Query params &amp; fragments" + 도움말 텍스트("&lt;, &gt;, &amp;, : / 인코딩됨" / 인코딩). **전체 URI**(encodeURI / decodeURI) — "전체 URL" / "Full URL" + 도움말 텍스트("/, :, ? 유지" / reserved 문자는 인코딩되지 않은 상태로 유지).
    - 인라인 도움말 각 옵션 아래 차이 설명.
    - 악센트 색상 grape(var(--accent-grape) / var(--accent-grape-soft)).
  </mode_toggle>

  <charset_toggle>
    - 두 옵션(분할 제어 또는 선택): **UTF-8**(기본값) 및 **EUC-KR** — 라벨 "UTF-8" / "EUC-KR(CP949)".
    - 인라인 도움말: "레거시 한국어 URL(구형 사이트)은 EUC-KR을 선택하세요. 대부분의 최신 URL은 UTF-8입니다." / "Choose EUC-KR for legacy Korean URLs from older sites. Most modern URLs are UTF-8."
    - 인코드와 디코드 모두에 적용. EUC-KR 인코드 선택은 CP949 테이블을 지연 로드할 수 있음(간단, 일회성); 전형적 짧은 입력에 대해 블로킹 스피너를 표시하지 않음.
    - 악센트 색상 grape; 키보드 단축키 "u"는 UTF-8 ⇄ EUC-KR 토글.
  </charset_toggle>

  <direction_toggle>
    - 단일 토글 버튼: 상태 인코드 ⇄ 디코드; 라벨은 방향 변경.
    - 아이콘: arrow-right-left(lucide).
    - 텍스트 입력 후 Enter 누르기 = 토글 활성화(즉시 인코드/디코드).
  </direction_toggle>

  <result_output>
    - Sticky 또는 독 우측 열(데스크톱 ≥1024px: 폭 360px, 반경 var(--radius-xxl), var(--surface) + 그림자). 모바일: 입력 아래.
    - 읽기 전용 모노스페이스 출력 블록에서 결과 표시(var(--surface-muted), 반경 var(--radius-lg), 패딩 16px, 긴 문자열을 위한 line-break: break-all).
    - "결과 복사" 버튼(기본 또는 보조) → 클립보드 → 성공 토스트 "✓ 복사됨"(1600ms) 또는 조용히 실패.
    - 키보드 단축키 힌트: "Ctrl+C / Cmd+C로 복사".
  </result_output>

  <query_table_view>
    - 선택적 탭 "쿼리 문자열 편집기" / "Query String Editor" — 기본값 숨김, 탭 또는 링크로 토글.
    - 입력 파싱(? 시작 또는 쿼리 문자열이면) 행으로: [{ key: "foo", value: "bar" }, …].
    - 각 행: 키 입력 + "=" + 값 입력, 테이블 행에 나란히(또는 모바일에서 스택).
    - 더하기-공백 토글은 행 표시와 직렬화 모두에 영향.
    - "행 추가" 버튼 + 행별 삭제 버튼(휴지통 아이콘).
    - "URL 다시 빌드" 버튼 → 행을 `?key1=val1&key2=val2`로 직렬화 + 클립보드로 복사.
    - 빈 쿼리 테이블 → "위 매개변수를 입력하거나 쿼리 문자열을 붙여넣어 파싱하세요" 힌트.
  </query_table_view>

  <already_encoded_warning>
    - 휴리스틱: 입력에 `%` 후 2 16진 숫자가 포함되면, 선택적 경고 카드 표시(정보 아이콘 + 텍스트). "이 텍스트는 이미 인코딩된 것처럼 보입니다. 다시 인코딩하면 이중 인코딩될 수 있습니다. 계속할까요?" [예, 어쨌든 인코드] [취소].
    - 논블로킹; 사용자는 해제하거나 계속할 수 있습니다. 일시적 UI 상태에 저장(localStorage 아님).
  </already_encoded_warning>

  <keyboard_shortcuts>
    - "/"(타이핑 중 아닐 때) → 텍스트 입력 포커스.
    - "r" → 최근 목록 토글(사이드 드로어 / 드롭다운).
    - "e" → 인코드/디코드 토글.
    - "c" → 컴포넌트/전체 URI 모드 토글.
    - "u" → UTF-8/EUC-KR 문자셋 토글.
    - "b" → 일괄 모드 토글.
    - Enter(입력 내) → 인코드/디코드(입력이 비어있지 않을 경우만).
    - Escape → 입력 지우기(비어있지 않으면), 그렇지 않으면 최근 드로어 닫기.
    - Tab → 모든 버튼/입력을 통한 표준 키보드 네비게이션.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <encode note="텍스트 → 퍼센트 인코딩">
    - UTF-8 컴포넌트: `encodeURIComponent(text)` — unreserved 문자를 제외한 모든 것 + reserved 문자(/, :, ?, #, 등)은 인코딩됨.
    - UTF-8 전체 URI: `encodeURI(text)` — 인코딩된 문자 더 적음; 슬래시, 콜론, 해시 유지, 쿼리/조각 문자 인코딩.
    - EUC-KR(모든 모드): CP949 정방향 테이블 지연 로드 → 각 문자를 CP949 바이트로 변환 → 선택된 모드와 동일한 "어느 문자가 인코딩되지 않은 상태로 남아있는가" 규칙 세트로 바이트를 퍼센트 이스케이프. ASCII 문자는 UTF-8에 바이트 동일; 비ASCII만 다름. CP949 매핑이 없는 문자(이모지, 드문 CJK) → `UnencodableCharError` → 친화적 에러 문자 명명(충돌 없음).
    - 이미 인코딩된 휴리스틱: 입력에 %xx 패턴 포함 여부 확인; 이중 인코딩 회피 경고 제안.
    - UTF-8은 절대 throw하지 않음; EUC-KR은 캐치된 UnencodableCharError만 throw. 검증은 미리 발생.
  </encode>
  <decode note="퍼센트 인코딩 → 텍스트">
    - UTF-8 컴포넌트: `decodeURIComponent(text, plusAsSpace?)` — %xx → 문자; plusAsSpace 활성화 시 + → 공백.
    - UTF-8 전체 URI: `decodeURI(text, plusAsSpace?)` — %xx → 문자(이 계층에서 컴포넌트와 대부분 문자 동일; 차이 최소).
    - EUC-KR(모든 모드): `%xx` 파싱(plusAsSpace 시 `+`→공백) 원본 바이트 배열로, 그 다음 `new TextDecoder('euc-kr').decode(bytes)`(네이티브, 의존성 없음) → 읽을 수 있는 텍스트. 예: `%C7%D1%B1%DB` → `한글`.
    - 잘못된 %xx(불완전한 16진수) 또는 선택된 문자셋에 유효하지 않은 바이트 → URIError / TextDecoder 실패 캐치 → 친화적 에러 카드 제안 포함(예: "위치 15 근처 잘못된 %xx; 확인: %6" + "의도: %60?", 또는 "이 바이트는 유효한 EUC-KR이 아님 — URL이 실제로 UTF-8인가?").
    - 유니코드 / 이모지 왕복 테스트 ≥90%(테스트 스위트는 UTF-8을 위한 CJK, 악센트, 이모지, 그리고 EUC-KR에서 인코드/디코드 사이클의 한글 왕복 포함).
  </decode>
  <query_parser note="불변식 ops">
    - parseQueryString(str): ? 접두사 스캔, & 분할, 키=값 쌍 추출, 빈 키/값 처리.
    - serializeQueryTable(rows, plusAsSpace?): 행을 key1=val1&key2=val2로 조인, 방향에 따라 인코딩 적용.
    - editRow(rows, idx, newKey, newValue): 새 배열 반환(불변식), 제자리 변경 없음.
  </query_parser>
  <recents note="localStorage 지속성">
    - pushRecent(list, text, max=10): 앞으로 추가, 중복 제거(이미 존재하면 제거), 최대값으로 자르기.
    - pruneUnknown(list): 유효/비어있지 않은 항목만 필터(로드 시, 손상된 항목 버리기).
    - 직렬화: JSON.stringify 로드 시 zod 검증; 정상 실패(throw 아님).
  </recents>
  <i18n>모든 UI 크롬은 tools.url-encoder.*(ko/en)에서: 모드/방향 라벨, 버튼 텍스트, 에러 메시지, 어떻게-하는지, FAQ. 인코딩된 텍스트는 사용자 데이터, i18n 아님.</i18n>
</core_functionality>

<error_handling>
  <malformed_percent_sequences>디코드 시 URIError 캐치 → 에러 메시지 + 위치 힌트 추출 → MalformedSequenceError 카드 렌더 제안 포함(예: "위치 N의 유효하지 않은 퍼센트 시퀀스 %6"). 사용자는 입력 편집 또는 지우기 허용.</malformed_percent_sequences>
  <euckr_encode_unrepresentable>CP949에 없는 문자를 EUC-KR로 인코딩(이모지, 드문 CJK, 비한국 스크립트) → 타입 UnencodableCharError → 미안 문자 명명 및 UTF-8 제안 친화적 카드. 절대 충돌하지 않음; 결과는 빈 상태 유지.</euckr_encode_unrepresentable>
  <euckr_decode_invalid_bytes>유효하지 않은 EUC-KR 바이트(예: UTF-8 바이트가 실수로 EUC-KR로 디코드) → TextDecoder는 대체 문자 또는 치명 에러 생성 → 친화적 힌트: "이 바이트는 유효한 EUC-KR이 아님 — URL이 실제로 UTF-8일 수 있습니다." 사용자는 문자셋 전환하고 재시도 가능.
  </euckr_decode_invalid_bytes>
  <charset_table_load_failure>CP949 인코드 테이블의 동적 임포트 실패(그 청크의 오프라인 초로드, 블로킹) → 친화적 에러 "EUC-KR 인코더를 로드할 수 없음 — 연결을 확인하고 재시도하세요"; UTF-8 경로 및 모든 디코드 경로는 완전히 기능(테이블 필요 없음).
  </charset_table_load_failure>
  <empty_or_whitespace_input>유효(noop): 빈 문자열 인코드/디코드 → 빈 결과, 에러 없음.
  </empty_or_whitespace_input>
  <input_too_long>10000 문자로 한정; 80%에서 경고; 최대 초과 시 제출 방지(폼 검증을 통해).
  </input_too_long>
  <already_encoded_heuristic>경고하지만 블로킹 아님; 사용자는 계속하거나 먼저 검사 가능.
  </already_encoded_heuristic>
  <storage_unavailable>개인 모드/비활성화 → 최근 항목 인메모리(세션만), 에러 메시지 없음(정상 열화).
  </storage_unavailable>
  <copy_failure>clipboard.writeText 실패 → 조용함(보조 기능; 거짓 성공 토스트 절대 표시).
  </copy_failure>
  <error_boundary>플랫폼이 도구를 래핑; 렌더 실패 → 셸 충돌 없이 재시도.
  </error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md는 모든 토큰의 단일 소스. 아래는 도구별 적용.</source>
  <accent_usage>
    - 카테고리 악센트는 GRAPE(var(--accent-grape) / var(--accent-grape-soft)) — 이 SPEC의 악센트 제안에 따라 "dev" 카테고리 정체성. 모드 토글 활성 상태, "다시 빌드" CTA, 복사 버튼 성공 상태.
    - 주 버튼(인코드/디코드 토글)은 명확 CTA를 위해 브랜드 허니골드 var(--brand) 사용.
  </accent_usage>
  <surfaces>입력/출력 필드 = var(--surface) + 1px var(--hairline); 출력 블록 var(--surface-muted); 결과 카드 반경 var(--radius-lg); 레이아웃 카드 반경 var(--radius-xl). 소프트 브랜드 톤 그림자(--shadow-sm / --shadow-card), 하드 테두리 회피.</surfaces>
  <typography>H1 Gmarket Sans clamp(28–40px)/700; 모드/방향 라벨 Pretendard 16px/600; 입력/출력 모노스페이스(Fira Mono 또는 시스템 모노스페이스) 14px/1.5; 힌트/에러 body-sm 14px var(--text-secondary).</typography>
  <motion>transform/opacity: 입력 포커스 lift(translateY -2px) 150ms, 복사 성공 펄스(scale 1→1.08→1) 200ms, 에러 카드 페이드인(opacity 0→1) 150ms. 모두 prefers-reduced-motion으로 게이트(순시, 스케일 없음).</motion>
  <accessibility>모든 입력에 aria-label; 버튼 라벨(아이콘 + 툴팁); 에러 메시지 aria-live="assertive"; 포커스 링 표시 var(--focus-ring) 2px; ≥44px 탭 대상; 모노스페이스 출력은 스크린 리더 사용자가 개별 문자를 명확히 들을 수 있도록 함.</accessibility>
  <responsive>
    - ≥1024px: 2열 레이아웃(입력 좌측, 결과 sticky 우측 360px).
    - 768–1023px: 입력 전체 폭 상단, 결과 아래.
    - <768px: 단일 열, textarea 높이 ≥120px 일괄 모드, 최근 사이드 드로어.
  </responsive>
  <atmosphere>기술적, 명확, 정확 — 모든 도구는 개발자 유틸리티처럼 느껴집니다. 여기서 장난기 없음; 모노스페이스 출력, 명확한 설명, 플랫 디자인. 악센트(grape)는 브랜드 온기 유지.</atmosphere>
  <icons>lucide-react: Link(레지스트리 아이콘), ArrowRightLeft(방향 토글), Copy(결과 복사), Trash(쿼리 행 삭제), Plus(쿼리 행 추가), AlertCircle(에러), Info(힌트). 기본값 20px, 스트로크 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>사용자 붙여넣기 URL/텍스트는 로컬에서 인코드/디코드; 파싱 또는 HTML 렌더링 없음. 모든 출력은 텍스트(dangerouslySetInnerHTML 없음). 모노스페이스 표시는 시각/포매팅 기법을 통한 XSS 방지.
  </input>
  <clipboard>사용자 시작 복사만(버튼 또는 Ctrl+C); 클립보드 읽기 절대; 데이터는 네트워크로 전송 안 함.
  </clipboard>
  <localStorage>최근 항목은 평문 문자열만(입력에 민감 데이터 없음, 도구는 사용자 입력이 데이터임을 가정 — 비밀번호 아님). localStorage는 로컬 기기만, 브라우저/프로필별 격리.
  </localStorage>
  <network>네트워크 호출 없음(모든 인코딩/디코딩은 JS 네이티브 함수, 동기).
  </network>
  <note>비밀 없음, 인증 없음, API 호출 없음, 서버 측 처리 없음.
  </note>
</security_considerations>

<advanced_functionality>
  <charset_euckr>UTF-8(기본값) + EUC-KR/CP949 레거시 한국어 URL. 디코드는 네이티브(`TextDecoder('euc-kr')`, 의존성 없음); 인코드는 CP949 정방향 테이블 지연 로드(코드 분할, 기본 번들 밖). ASCII는 문자셋 무관; 비ASCII 바이트만 다름. EUC-KR 인코드에서 표현 불가능한 문자 → 친화적 에러. 단일, 일괄, 쿼리 테이블 직렬화에 적용.
  </charset_euckr>
  <batch_mode>한 번에 여러 줄 처리: 입력을 줄바꿈으로 분할, 각각 인코드/디코드, 결과를 수직으로 스택(입력 순서와 매칭하는 라인당 한 결과).
  </batch_mode>
  <query_string_table>`?a=1&b=2`를 행으로 파싱, 제자리 편집, 다시 빌드. 엣지 케이스 처리(빈 키/값, 값의 특수 문자, %-이스케이프 포함된 이미 인코딩된 쿼리 문자열).
  </query_string_table>
  <plus_as_space>레거시 application/x-www-form-urlencoded 스펙은 디코드 시 `+`을 공백으로 취급. 체크박스 토글은 세션별 이를 제어.
  </plus_as_space>
  <recents_persistence>localStorage의 마지막 10개 사용 입력; 클릭으로 재채우기(다시 타이핑 없이 빠른 재사용).
  </recents_persistence>
  <unicode_round_trip>이모지, CJK, 악센트 문자는 UTF-8에 대해 엔드투엔드 테스트(인코드 → 디코드 → 원본, ≥90% 도메인 커버리지). EUC-KR: 한글 + CP949 커버 CJK 왕복(`한글` ⇄ `%C7%D1%B1%DB`), 그리고 표현 불가능한 문자(이모지 → 에러) 및 교차 문자셋 불일치 경우.
  </unicode_round_trip>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>특수 문자와 유니코드로 컴포넌트 모드 인코드</description>
    <steps>
      1. 입력: `hello world &amp; 안녕 😊`
      2. 모드: 컴포넌트, 방향: 인코드
      3. 출력 검증: `hello%20world%20%26%20%EC%95%88%EB%85%95%20%F0%9F%98%8A`(각 공백/특수/이모지 → %xx).
      4. 결과 복사 → 토스트 "✓ 복사됨" 1600ms 나타남.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>잘못된 %xx 시퀀스 에러로 디코드</description>
    <steps>
      1. 입력: `hello%2Fworld%6`(끝의 불완전 16진수)
      2. 방향: 디코드, 모드: 컴포넌트
      3. 에러 카드 검증: "위치 X의 잘못된 퍼센트 시퀀스 %6. 의도: %60?"
      4. 사용자는 입력 편집하고 재시도, 또는 지우기 가능.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>쿼리 문자열 테이블 파싱과 다시 빌드</description>
    <steps>
      1. 입력: `?name=Alice&amp;age=30&amp;city=Seoul`(또는 `?...`을 갖춘 전체 URL 붙여넣기)
      2. "쿼리 문자열 편집기" 탭 클릭.
      3. 테이블 렌더 3행: [name=Alice], [age=30], [city=Seoul].
      4. 이름 값을 "Bob"으로 편집.
      5. "URL 다시 빌드" 클릭 → 결과: `?name=Bob&amp;age=30&amp;city=Seoul`.
      6. 복사 → 클립보드는 `?name=Bob&amp;age=30&amp;city=Seoul`.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>일괄 모드, 다중 라인 처리</description>
    <steps>
      1. 일괄 토글 활성화.
      2. 입력: `hello world\nanother line\nthird`(3줄).
      3. 모드: 컴포넌트, 방향: 인코드.
      4. 결과(스택) 검증: `hello%20world\nanother%20line\nthird`(각 라인 인코드, 줄바꿈 유지).
      5. 복사 → 결과는 모든 3개 인코드 라인 포함.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>최근, localStorage 지속성, 이미 인코딩된 경고</description>
    <steps>
      1. `test%20string` 인코드 → 경고 "이 텍스트는 이미 인코딩된 것처럼 보입니다…" 나타남.
      2. [예, 어쨌든 인코드] 클릭 → 결과: `test%2520string`(참고 이중 %25).
      3. 닫고 재열기(페이지 새로고침) → 최근 목록은 `test%20string`을 가장 최근으로 표시.
      4. 최근 클릭 → 입력 재채우기; 이번 [아니요] 클릭 경고에서.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>전체 URI 모드 vs 컴포넌트 모드 차이</description>
    <steps>
      1. 입력: `https://example.com/path?a=1&amp;b=2#section`
      2. 모드: 전체 URI, 방향: 인코드 → 출력: 입력 변경 없음(/, :, ?, &amp;, # 인코드 안 됨).
      3. 모드: 컴포넌트, 방향: 인코드 → 출력: 많이 인코드(/, :, ?, &amp;, # → %xx).
      4. 양쪽 모드를 UI 설명에서 나란히 검증(도움말 카드는 각각의 사용 케이스 설명).
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>국제화, 반응형, a11y, 320px에서 오버플로우 없음</description>
    <steps>
      1. 로케일 ko ↔ en 전환 → 크롬(모드/방향 라벨, 버튼 텍스트, 도움말) 언어 전환.
      2. 320px(모바일)에서 보기 → 단일 열, textarea 표시, 최근 아래 드로어.
      3. axe 스캔 → 0 위반; 버튼 aria 라벨; 모노스페이스 출력 읽을 수 있음; 포커스 링 표시.
      4. 키보드 네비게이션: 모든 입력/버튼 Tab, Enter로 인코드, Esc로 지우기; "/"는 입력 포커스, "c"는 모드 토글.
    </steps>
  </test_scenario_7>
  <test_scenario_8>
    <description>EUC-KR(CP949) 레거시 한국어 URL: 디코드, 인코드 왕복, 표현 불가능한 문자 에러</description>
    <steps>
      1. 문자셋: EUC-KR, 방향: 디코드, 모드: 컴포넌트. 입력: `%C7%D1%B1%DB` → 출력 `한글`(네이티브 TextDecoder, 잘못된 에러 아님).
      2. 건전성: 문자셋 UTF-8로 같은 입력 → 친화적 "유효한 UTF-8 아님 / EUC-KR 시도" 힌트(문자셋이 실제로 동작 변경 증명).
      3. 문자셋: EUC-KR, 방향: 인코드. 입력 `한글` → 출력 `%C7%D1%B1%DB`(초회 사용 시 CP949 테이블 지연 로드; 간단, 블로킹 스피너 없음). 왕복이 스텝 1과 일치.
      4. 문자셋: EUC-KR, 방향: 인코드. 입력 `😊` → 친화적 UnencodableCharError 카드 이모지 명명 + "UTF-8으로 전환" 제안; 결과 빈 상태, 충돌 없음.
      5. ASCII 전용 입력(`hello`) → 동일 결과 UTF-8과 EUC-KR(ASCII 문자셋 무관).
      6. CP949 인코드 청크가 도구의 초기 JS 번들에 있지 않음 검증(동적 임포트; 스텝 3에서만 페치).
    </steps>
  </test_scenario_8>
</final_integration_test>

<success_criteria>
  <functionality>인코드 + 디코드 양방향; 컴포넌트 + 전체 URI 모드 명확 설명; UTF-8 + EUC-KR 문자셋(네이티브 디코드, 코드 분할 인코드); 쿼리 문자열 테이블(파싱/편집/다시 빌드); 일괄 모드(다중 라인); 더하기-공백 토글; 토스트 복사; 최근(localStorage).</functionality>
  <error_handling>잘못된 %xx → 친화적 에러 카드(충돌 없음); EUC-KR 표현 불가능한 문자 → 타입 에러 문자 명명; EUC-KR 유효하지 않은 바이트 → "UTF-8일 수도?" 힌트; 이미 인코딩된 휴리스틱 경고(논블로킹); 빈 입력 유효(noop); 유니코드 왕복 ≥90% 테스트(UTF-8 + EUC-KR 한글).
  </error_handling>
  <user_experience>텍스트 붙여넣기, 모드/방향 선택, 순시 결과, 복사 피드백 명확, 최근은 재타이핑 마찰 감소. 라우트 새로고침 없음, SPA 느낌(모든 상호작용 로컬 상태).
  </user_experience>
  <technical_quality>lib/url-encoder/* 순수 ≥90% 단위 커버리지(인코드/디코드 모든 모드/방향/문자셋, 잘못된 %xx → URIError 캐치, EUC-KR 왕복 `한글` ⇄ `%C7%D1%B1%DB`, EUC-KR 표현 불가능한 문자 + 유효하지 않은 바이트 케이스, 쿼리 문자열 파싱/직렬화 엣지 케이스, 최근 왕복); TS 0 에러; 파일당 <800 라인; UTF-8용 외부 라이브러리 없음(네이티브 JS); EUC-KR 디코드 네이티브(TextDecoder); EUC-KR 인코드는 한 동적 임포트 CP949 테이블로, 초기 청크 밖.
  </technical_quality>
  <visual_design>DESIGN.md 준수; grape 악센트(dev 카테고리 정체성); 모노스페이스 출력 명확성; 반응형 320/768/1024; reduced-motion 존중; ≥44px 터치 대상.
  </visual_design>
  <accessibility>전체 키보드(Tab, Enter, Esc, "/", "c", "u", "e", "b"); aria-live 에러; 라벨 입력/버튼; 표시 포커스 링; 모노스페이스 스크린 리더 읽을 수 있음; WCAG 2.1 AA.
  </accessibility>
  <performance>도구 라우트는 플랫폼 예산 내; <2.5s LCP; CLS <0.1(광고 슬롯 높이 예약); UTF-8 네트워크 지연 없음(모든 JS 네이티브); EUC-KR 디코드 역시 영시간 지연 네이티브; EUC-KR 인코드는 초회 사용 시 CP949 청크 페치(마이크로사이트 JS 예산 보호를 위해 초기 번들 밖).
  </performance>
</success_criteria>

<build_output>
  <note>플랫폼의 일부로 빌드됨(pnpm build). 기존 생성 훅 필요 없음(new-word의 마크다운 생성기와 달리). /[locale]/tools/url-encoder는 플랫폼 generateStaticParams가 레지스트리(상태 "live")를 반복해 사전 렌더.
  </note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — 하나 항목 추가.
    {
      id: 'url-encoder',
      slug: 'url-encoder',
      category: 'dev',            // 새로운 카테고리 — 플랫폼에서 활성화되어야 함(platform_integration 참조)
      icon: 'Link',               // lucide-react
      accent: 'grape',
      status: 'live',             // 모듈 완성까지 'coming_soon'
      isNew: true,
      order: 20,                  // 텍스트/게임 도구 후, 필요에 따라 조정
      keywords: ['URL','인코딩','디코딩','encode','decode','%20','percent','query','parameter','쿼리','매개변수','EUC-KR','euckr','CP949','한글','UTF-8','charset','개발','developer','tool'],
    },
    ```
    또한 도구 라우트의 ladder/qna-a-day 옆 슬러그→컴포넌트 분기(&lt;UrlEncoder/&gt;) 및 generateMetadata 분기(title/description/JSON-LD) 추가. **Live 가기 전에, `'dev'` 카테고리 활성화**: i18n 항목 추가, CATEGORY_ORDER, FOOTER_CATEGORIES, 악센트 매핑(platform_integration 참조).
  </platform_registry_change>
  <critical_paths>
    1. 정확 네이티브 JS `encodeURIComponent`/`decodeURIComponent`/`encodeURI`/`decodeURI`로 인코딩/디코딩 — 전체 도구는 이것에 의존. 근사 없음.
    2. 문자셋 추상화(`charset.ts`): 바이트 배열 → `TextDecoder(charset)`로 디코드(네이티브, UTF-8 + EUC-KR); UTF-8 인코드 네이티브, EUC-KR은 지연 임포트 CP949 테이블. EUC-KR 비동기 `textToBytes`; 테이블은 초기 청크 밖(동적 임포트 검증 번들 분석).
    3. 잘못된 %xx + 문자셋 에러 처리(URIError / TextDecoder / UnencodableCharError → 친화적 메시지) — 사용자 대면 견고성.
    4. 쿼리 문자열 파싱(& 분할, 키=값 추출) 및 직렬화 — 손실 없이 왕복(양 문자셋).
    5. localStorage 최근(pruneUnknown, zod 검증, 정상 실패) — 충돌 없이 지속성.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/url-encoder/{schema,encode,decode,query-parser,recents}.ts Vitest ≥90%: encodeComponent, encodeUri, decodeComponent(에러 캐치), decodeUri, 잘못된 %xx → 친화적 에러, 쿼리 문자열 파싱/직렬화(엣지 케이스: 빈 키/값, 특수 문자), 최근 ops(push/prune/왕복). (UTF-8 먼저, 문자셋 매개변수 스레딩되지만 utf-8 기본값.)
    1b. lib/url-encoder/charset.ts + charset/cp949-encode.ts Vitest ≥90%: bytesToText(네이티브 TextDecoder, utf-8 + euc-kr), textToBytes(utf-8 동기; euc-kr 지연 임포트 테이블), `%C7%D1%B1%DB` ⇄ `한글` 왕복, 이모지 UnencodableCharError, 유효하지 않은 EUC-KR 바이트 처리. decode.ts/encode.ts를 비UTF-8 라우팅으로 charset.ts에 연결.
    2. useUrlEncoder 훅: localStorage 최근/최애 + 인메모리 폴백 + 인코드/디코드 디스패처(EUC-KR 인코드 비동기 인식) + 복사 어댑터.
    3. TextInput + ModeToggle + CharsetToggle + DirectionToggle + ResultOutput(기본 플로우: 붙여넣기, 토글, 결과 보기, 복사).
    4. QueryTableView(입력 파싱 → 행; 행 편집; 다시 빌드). PlusAsSpaceToggle.
    5. BatchToggle + textarea 확장. AlreadyEncodedWarning 휴리스틱 + MalformedSequenceError 카드.
    6. RecentsList(드롭다운 / 사이드 드로어). 키보드 단축키("/", "c", "u", "e", "b", "r").
    7. UrlEncoderIntro/HowTo/Faq + SoftwareApplication JSON-LD via 플랫폼 lib/seo.ts.
    8. 레지스트리 항목 상태→live; 슬러그→컴포넌트 + generateMetadata 분기. E2E 시나리오 1–7; 시각 회귀 320/768/1024 양 테마.
    9. 플랫폼 활성화(i18n categories.dev, CATEGORY_ORDER, FOOTER_CATEGORIES).
  </recommended_implementation_order>
  <generator_sketch note="없음 — new-word처럼 빌드 타임 생성 없음">
    생성기 필요 없음. 도구는 순수 클라이언트 측 React. 모든 로직은 동기(네이티브 JS 인코드/디코드).
  </generator_sketch>
  <testing_strategy>순수 Vitest ≥90%(모든 모드/방향/문자셋 인코드/디코드, 잘못된 %xx → URIError 캐치, EUC-KR 왕복 `한글` ⇄ `%C7%D1%B1%DB`, EUC-KR 표현 불가능한 문자 + 유효하지 않은 바이트 케이스, 쿼리 문자열 파싱/직렬화 엣지 케이스, 최근 왕복); 컴포넌트 테스트(모드/문자셋/방향 토글, 쿼리 테이블 편집, 복사); E2E 시나리오 1–8(특히 #1 인코드/디코드, #2 에러, #3 쿼리 테이블, #4 일괄, #5 최근+경고, #6 모드 차이, #7 i18n/반응형/a11y, #8 EUC-KR); CP949 인코드 청크가 동적 임포트됨 검증(번들 분석); 클립보드/localStorage jsdom 격리.
  </testing_strategy>
  <tool_usage>리더 시각 게이트: 320/768/1024 스크린샷, 오버플로우 없음, 문자셋 토글 + 쿼리 테이블 행 정렬, EUC-KR 디코드(`%C7%D1%B1%DB`→`한글`) 및 표현 불가능한 문자 에러 라이브 검증, 에러 카드 두드러짐, 모노스페이스 읽을 수 있음, 사전 렌더 HTML에 JSON-LD 존재.
  </tool_usage>
</key_implementation_notes>

</project_specification>
```

SPEC은 `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-url-encoder/docs/services/dev/url-encoder/SPEC_KR.md`에 작성됨 — 478 라인.
