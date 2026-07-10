# HTML 엔티티 변환기 — HTML 특수 문자와 엔티티 참조 상호변환 도구 — 서비스 스펙

> 이 문서는 AI 코딩 에이전트가 소비하는 **정본(한글 번역)** 입니다. 영문 정본 [`SPEC.md`](SPEC.md)와 항상 동기화하세요.
>
> **HTML 엔티티 변환기** 구축 스펙 (HTML 엔티티 변환기) — 일반 텍스트를 HTML 엔티티 참조로 변환하고 역변환하는 클라이언트 사이드 도구입니다. 인코딩은 3가지 모드를 지원합니다: (1) 특수문자만(&, <, >, ", '), (2) 이름 있는 엔티티(&copy;, &nbsp; 등 WHATWG 목록), (3) 모든 비ASCII 문자(U+007F 이상 숫자 이스케이프). 디코딩은 형식이 틀린 엔티티를 관대하게 처리하며 완벽한 왕복 변환을 지원합니다. 참조 패널은 약 50개의 공통 엔티티를 검색 가능하게 표시하며 SEO를 위해 SSR된 정적 테이블을 포함합니다. 모든 처리는 순수 도메인 로직이며, 클라이언트 전용, localStorage 지속성, 플랫폼 셸 위의 SPA입니다.
> 내부 서비스 코드명: `html-entity`. 레지스트리 id: `html-entity`. 공개 URL 슬러그: `/[locale]/tools/html-entity`.
>
> 이 스펙은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일 전환/테마 토글/동의 배너), 도구 레지스트리, SEO & 광고 인프라, 디자인 토큰은 플랫폼에서 제공합니다:
> - 플랫폼 스펙: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템 (시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참조 형제 도구 스펙 (동일 패턴): [`docs/services/dev/url-encoder/SPEC_KR.md`](../url-encoder/SPEC_KR.md)

```xml
<project_specification>

<project_name>HTML 엔티티 변환기 — 양방향 HTML 엔티티와 문자 이스케이프 변환 (Jurepi 도구, 코드명 html-entity, 레지스트리 id html-entity)</project_name>

<overview>
HTML 엔티티 변환기는 문자를 HTML 엔티티 참조로 변환하고 역변환하는 일상적인 마찰을 해결합니다. 개발자가 특수 문자가 있는 일반 텍스트(예: "가격 & 약관")를 복사하고 HTML 속성이나 본문에 안전하게 삽입하려면 이 도구가 모드에 따라 "가격 &amp; 약관" 또는 "가격 &#38; 약관"으로 인코딩합니다. 디코딩은 역방향으로 작동합니다: "가격 &amp; 약관"을 붙여넣으면 "가격 & 약관"을 즉시 볼 수 있습니다.

3가지 인코딩 모드가 서로 다른 용도를 제공합니다: (1) **특수문자만**(기본값) &, <, >, ", '만 인코딩해 일반 ASCII 텍스트는 그대로 유지, (2) **이름 있는 엔티티** WHATWG 엔티티 목록에서 이름이 있으면 &copy;, &nbsp;, &hellip; 등을 사용하고 없으면 숫자로 폴백, (3) **모든 비ASCII** U+007F 이상의 모든 문자를 이스케이프하며 UTF-8을 잘 지원하지 않는 시스템용입니다.

숫자 형식 옵션을 사용하면 사용자가 10진수(&#169;) 또는 16진수(&#xA9;) 형식을 선택할 수 있습니다. 디코딩은 관대합니다: 형식이 틀린 엔티티(세미콜론 누락, 유효하지 않은 이름, 끊긴 숫자)는 그대로 유지되며 오류를 던지지 않습니다.

도구에는 약 50개의 공통 엔티티(©, &, <, >, ", ', 줄바꿈 없는 공백, 줄임표, em-대시 등)의 검색 가능한 **참조 테이블**이 포함되어 있으며, 문자, 이름 있는 형식, 10진수, 16진수, 설명 열을 포함합니다. 각 행은 클릭 한 번으로 복사 가능합니다. 상위 30개의 공통 엔티티는 SEO 장문 섹션에 정적 테이블로 SSR되어 AI 크롤러와 검색 엔진이 볼 수 있습니다.

중요(클라이언트 전용, SSG): 100% 클라이언트 사이드. 백엔드, 데이터베이스, 네트워크 호출 없음. 엔티티 맵(WHATWG ~2200개 이름 있는 엔티티)은 필요할 때만 로드되는 JSON 청크로 로드되며 초기 번들에 없습니다. 디코딩에는 맵이 필요하지 않습니다(선택적으로 참조 이름 표시용). 모든 인코딩/디코딩은 순수 JS 문자열 조작과 정규식입니다.

중요(오류 처리, 견고성): 디코딩에서 형식이 틀린 엔티티(세미콜론 누락, 유효하지 않은 16진수, 알 수 없는 이름)는 조용히 그대로 유지됩니다 — 오류 없음, 충돌 없음, 친화적 UX. 이모지와 유니코드는 완벽하게 왕복합니다(UTF-16 서로게이트 쌍이 올바르게 처리됨). 빈 입력은 유효합니다(무작동).

중요(사용성 우선, SPA): 모든 Jurepi 도구는 SSG 셸 위에 장착된 클라이언트 사이드 SPA입니다. 모든 상호작용 — 모드 전환, 방향 토글, 숫자 형식 선택, 복사 — 는 로컬 React 상태로 발생하며 경로 탐색, 전체 페이지 리로드가 없습니다. 일반 텍스트 붙여넣기, 모드 선택, 결과 즉시 확인, 복사, 완료.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/html-entity (SSG; 레지스트리 슬러그 "html-entity", id "html-entity", 상태 "coming_soon", 액센트 "coral", 카테고리 "dev").
  - 플랫폼에서 제공(다시 구현하지 말 것): 앱 셸(헤더/푸터/로케일 전환/테마 토글), 동의 배너, 광고 슬롯, 토스트 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주위 에러 경계, lib/seo.ts 메타데이터 빌더, 빵부스러기 + 인콘텐츠 광고 래퍼.
  - 소비: i18n 네임스페이스 `tools.html-entity.*` (UI 크롬 문자열: 모드 레이블, 방향 레이블, 숫자 형식 레이블, 버튼 텍스트, 오류 메시지, 하우투, FAQ — 인코딩된 콘텐츠 아님; 그것은 사용자 제공 데이터입니다).
  - `'dev'` 카테고리는 이제 LIVE이고 완전히 배선됨. 카테고리 활성화 전제는 없습니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **두 가지 인코딩 방향**: 인코딩(일반 텍스트 → 엔티티 참조)과 디코딩(엔티티 참조 → 일반 텍스트) 토글 버튼.
    - **3가지 인코딩 모드** 인라인 도움말 포함: (1) **특수문자만**(기본값) — &, <, >, ", '만 인코딩, (2) **이름 있는 엔티티** — &copy;, &nbsp;, &hellip; 등 사용 가능한 곳에서 사용(WHATWG 목록), 그 외는 숫자로 폴백, (3) **모든 비ASCII** — U+007F보다 큰 모든 문자를 숫자 이스케이프(ASCII는 그대로 유지).
    - **숫자 형식 선택**: 10진수(&#169;) 또는 16진수(&#xA9;) 형식; 숫자 엔티티가 출력될 때만 적용(모드 2, 3).
    - **방향 토글**(인코딩 ⇄ 디코딩).
    - **텍스트 입력**(단일 라인; 붙여넣기 영역) + 선택적 배치 모드(다중 라인, 각 라인 독립적으로 인코딩/디코딩, 결과 스택).
    - **클립보드 복사**: "결과 복사" 버튼 + 키보드 단축키 → 클립보드 → 숨겨진 텍스트영역 폴백 → 사용 불가 시 조용히 실패.
    - **참조 테이블 패널**: 검색 가능한 ~50–80개 공통 엔티티(©, &, <, >, ", ', &nbsp;, &hellip; 등) 문자, 이름, 10진수, 16진수, 설명 열 포함, 행별 클릭 한 번 복사. 참조 테이블은 또한 SEO 장문 섹션에 정적 `<table>`으로 SSR되어 크롤러와 AI가 볼 수 있습니다.
    - **최근 항목**: 인코딩/디코딩된 텍스트 스니펫의 마지막 10개 localStorage에 저장, 빠른 재사용 드롭다운.
    - **지역화된 오류 메시지와 UI 크롬**(ko/en via tools.html-entity.*).
    - **완전 키보드 지원**: Tab, Enter로 인코딩/디코딩, "/" + "r" 단축키, Esc로 지우기.
    - **도구별 SEO 장문**(HTML 엔티티란 무엇인가? / 이름 있는 것 vs 숫자 사용 시기 / 속성 vs 본문에서의 특수 문자 / 가이드) + FAQ(FAQPage JSON-LD), ko/en 지역화, 정적 참조 테이블 포함.
    - **감소된 모션 폴백**, WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - HTML/XML 파싱 또는 검증(도구는 엔티티 전용, 완전 살균기 또는 검증기 아님).
    - 엔티티별 딥링크 상태(예: `/tools/html-entity?input=hello&mode=named`) — Phase 2.
    - 비HTML 엔티티 표준(XML 엔티티, SGML 레거시) — 범위는 WHATWG HTML5만.
    - 그래픽 엔티티 피커 또는 시각 문자 브라우저 — Phase 2.
  </out_of_scope>
  <future_considerations>
    - URL 쿼리 매개변수의 딥링크 상태(입력, 모드, 방향) — Phase 2.
    - 시각 엔티티 브라우저/피커 모드(~2200개 엔티티의 그리드, 이름/코드/카테고리로 필터 가능) — Phase 2 또는 Phase 3.
    - 가장 자주 사용된 엔티티의 사이드바 팔레트(localStorage의 빈도 추적).
    - 파일에서 배치 가져오기(JSON/CSV {일반텍스트, 인코딩 모드} 행) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <entity_map note="WHATWG HTML5 이름 있는 엔티티, ~2200개 항목, 지연 로드, 초기 번들에 없음">
      - **출처**: WHATWG entities.json (CC0 / 퍼블릭 도메인). 전체 목록은 ~50KB JSON. **결정**: 코드 분할로 지연 로드 청크: `content/entities/entities.generated.json` 또는 빌드 타임 생성 맵 정규 CSV/JSON 소스에서.
      - **생성**: 선택적 빌드 타임 스크립트(`scripts/generate-html-entities.mjs`) 엔티티 목록 검증, 엔티티 이름을 (문자, 10진수, 16진수)로 맵핑, 공통 것 우선으로 정렬.
      - **디코딩**: 맵이 필요하지 않음(`&` + 이름/숫자 + `;` 순수 구문적으로 제거 가능). 디코딩은 오프라인에서 작동합니다.
      - **인코딩(이름 있는 모드)**: 사용자가 이름 있는 모드를 선택할 때만 맵 지연 로드. UTF-8은 직접 문자열 포함 사용; 모든 항목이 메모리에 맞습니다.
    </entity_map>
    <encode_decode>
      - **특수문자만 인코딩**: 하드코딩 집합 {&, <, >, ", '} → `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;` (지연 로드 필요 없음).
      - **이름 있는 엔티티 인코딩**: 사용자 제공 텍스트 → 각 문자를 엔티티 맵과 비교 → 이름 있는 엔티티 있으면 내보내기; 그 외 숫자(숫자 형식 설정에 따라 10진수 또는 16진수).
      - **모든 비ASCII 인코딩**: 텍스트 반복, ASCII 그대로 내보내기, 문자 > U+007F를 숫자로 내보내기(10진수 또는 16진수). UTF-16 서로게이트 쌍을 올바르게 처리(이모지 같은 😊 = U+1F60A → 2개 UTF-16 단위, 그러나 `String.codePointAt` + `String.fromCodePoint`가 투명하게 관리).
      - **디코딩**: 엔티티 패턴 입력 파싱(`&[a-zA-Z0-9]+;` 이름 있는 것, `&#[0-9]+;` 10진수, `&#x[0-9a-fA-F]+;` 16진수). 알려진 이름 있는 엔티티 대체; 검증 및 숫자 디코딩. 알 수 없는 엔티티는 그대로 유지(오류 없음). 형식 틀림(세미콜론 누락, 불완전한 16진수) → 그대로 유지.
      - **왕복**: 일반 텍스트 인코딩 → 결과 디코딩 = 원본(불변식 UTF-8, 서로게이트, 모든 특수 문자로 테스트).
      - 모든 로직은 순수 도메인 계층, 완전히 단위 테스트, ≥90% 커버리지.
    </encode_decode>
    <validation>zod v3.x 입력 스키마(최대 길이). 도메인 계층의 단일 소스 검증.</validation>
    <localStorage>jurepi-html-entity 키, zod 검증 스키마, 버전 관리, 로드 시 자동 제거, 조용히 실패(세션만 폴백).</localStorage>
    <clipboard>navigator.clipboard.writeText → 숨겨진 텍스트영역 execCommand 폴백 → 조용히 실패(보조 기능, 항상 선택적).</clipboard>
    <animation>네이티브 CSS 전환만(포커스, 버튼 누르기, 페이드인/아웃). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — 이미 repo에 있음; 입력 스키마 및 저장소 검증 재사용.</zod>
    <entity_map>공급 WHATWG entities.json (~50KB JSON) 지연 로드 청크로; 또는 가장 공통 엔티티의 큐레이션된 부분집합(~10–15KB) (©, ®, ™, &, <, >, ", ', 공백, 대시, 화살표, 따옴표, 수학 기호). 최소 부분집합은 실제 사용의 80% 다룸; 전체 목록은 선택적 Phase 2 업그레이드로 사용 가능.</entity_map>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/html-entity/                          # 순수 도메인 계층 — React/Next 없음, 완전히 단위 테스트
│   ├── schema.ts                             # zod: InputSchema, EncodeMode enum, NumericStyle enum, StoreSchema + 검증 헬퍼
│   ├── entity-map.ts                         # 지연 로드 엔티티 맵 로드(promise 기반, await 동적 import); 최소 인코드 폴백
│   ├── encode.ts                             # encodeSpecialOnly(text), encodeNamed(text, entityMap, numericStyle), encodeAllNonAscii(text, numericStyle)
│   ├── decode.ts                             # decodeEntities(text) — &name;, &#123;, &#xAB; 패턴 파싱, 알려진 것 대체, 형식 틀린 것은 그대로 유지
│   ├── entities/
│   │   └── common-entities.ts                # 하드코딩 ~30–50 가장 공통 엔티티(©, &, <, >, 등) — 로드 필요 없음
│   ├── recents.ts                            # 불변 ops: pushRecent(list, text, max=10), pruneUnknown(list), 직렬화/역직렬화
│   └── unicode.ts                            # UTF-16 서로게이트 쌍 처리 테스트(이모지, CJK, 악센트 왕복)
├── components/tools/html-entity/
│   ├── HtmlEntity.tsx                        # 오케스트레이터(클라이언트 컴포넌트) — 모드/방향/배치/numericStyle 상태 + useHtmlEntity() 소유
│   ├── useHtmlEntity.ts                      # 훅: localStorage 선호도 + 엔티티 맵 지연 로드 + 인코딩/디코딩 디스패처
│   ├── ModeToggle.tsx                        # 3가지 옵션: 특수문자만(기본값), 이름 있는 것, 모든 비ASCII — 라디오 또는 탭 + 인라인 도움말
│   ├── DirectionToggle.tsx                   # 인코딩 ⇄ 디코딩 토글 버튼
│   ├── NumericStyleToggle.tsx                # 10진수(&#169;) / 16진수(&#xA9;) 선택(이름 있는 것/모든 비ASCII 모드에만 표시)
│   ├── TextInput.tsx                         # 붙여넣기 영역, 단일 라인 또는 배치 텍스트영역
│   ├── ResultOutput.tsx                      # 결과 표시 + 복사 버튼 + 성공 토스트
│   ├── BatchToggle.tsx                       # 다중 라인 모드 활성화
│   ├── ReferenceTable.tsx                    # 검색 가능한 ~50 공통 엔티티 테이블(문자, 이름, 10진수, 16진수, 설명) + 행별 클릭 복사
│   ├── RecentsList.tsx                       # 최근 입력 드롭다운/사이드 패널
│   ├── HtmlEntityIntro.tsx                   # H1 + 리드(SEO 장문 소개)
│   ├── HtmlEntityHowTo.tsx                   # HTML 엔티티란? / 특수문자만 vs 이름 있는 것 vs 모든 비ASCII 사용 시기 / 가이드 + SSR된 정적 참조 테이블
│   ├── HtmlEntityFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── error/
│       └── EntityDecodeNotice.tsx            # 디코딩이 알 수 없는 엔티티를 찾은 경우 정보 카드(오류 아님, 단지 참고)
└── i18n/messages/{ko,en}.json                # tools.html-entity.* UI 크롬(메시지 값에 생 < 문자 없음; 코드 렌더 문자열 사용)
</file_structure>

<core_data_entities>
  <input_state>
    - text: string (일반 텍스트 또는 엔티티 인코딩 텍스트)
    - direction: 'encode' | 'decode'
    - encodeMode: 'special-only' | 'named' | 'all-non-ascii'
    - numericStyle: 'decimal' | 'hex' (숫자 엔티티가 출력될 때만 적용)
    - batchMode: boolean (true면 줄 바꿈으로 분할, 각 라인 독립적 인코딩/디코딩)
  </input_state>
  <entity_reference>
    - name: string (예: "copy" for &copy;)
    - char: string (예: "©")
    - decimal: number (예: 169)
    - hex: string (예: "A9")
    - description: string (예: "Copyright sign")
  </entity_reference>
  <encode_result>
    - result?: string (인코딩된 텍스트)
    - error?: { message: string; details?: string } (드물음; 엔티티 맵 로드 실패 시만)
  </encode_result>
  <decode_result>
    - result?: string (디코딩된 텍스트; 형식 틀린 엔티티는 그대로, 오류 없음)
    - unknownEntitiesFound?: string[] (발견된 알 수 없는 이름 있는 엔티티 목록, 정보 목적만)
  </decode_result>
  <store_recents note="localStorage 지속성">
    - version: number (시작 1)
    - recents: string[] (마지막 10개, 삽입 순서, 중복 제거)
    - prefs: { numericStyle: 'decimal' | 'hex'; encodeMode: 'special-only' | 'named' | 'all-non-ascii' }
    - meta: { createdAt: number }
    localStorage 키: `jurepi-html-entity`
  </store_recents>
  <constants>
    - RECENTS_MAX = 10
    - INPUT_MAX_LEN = 10000 문자
    - BATCH_MAX_LINES = 100
    - SPECIAL_CHARS_ONLY = {&, <, >, ", '} 하드코딩
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/html-entity" page="HtmlEntity (플랫폼 도구 라우트 슬러그 → 컴포넌트 분기)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams는 레지스트리 반복(상태 "live") SSG로.</note>
</route_definitions>

<component_hierarchy>
  <html_entity>                        <!-- "use client"; 방향/모드/numericStyle/배치 상태 소유 + useHtmlEntity() -->
    <html_entity_intro />              <!-- H1 + 리드(가능한 곳에서 서버 렌더) -->
    <entity_layout>                    <!-- 메인 2열 또는 스택 모바일 레이아웃 -->
      <entity_main>                    <!-- 좌측/상단 열 -->
        <mode_toggle />                <!-- 특수문자만 / 이름 있는 것 / 모든 비ASCII 라디오 -->
        <direction_toggle />           <!-- 인코딩 / 디코딩 토글 -->
        <numeric_style_toggle />       <!-- 10진수 / 16진수 선택(숫자 출력 가능할 때만 표시) -->
        <text_input />                 <!-- 붙여넣기 영역; 배치 활성화 시 다중 라인 가능 -->
        <batch_toggle />               <!-- 다중 라인 모드 활성화 -->
      </entity_main>
      <entity_result>                  <!-- 우측/하단 열, 데스크톱에서 스티키 -->
        <result_output />              <!-- 인코딩/디코딩 결과 + 복사 버튼 -->
      </entity_result>
    </entity_layout>
    <reference_table />                <!-- 검색 가능한 공통 엔티티(선택적 축소 가능) -->
    <recents_list />                   <!-- 최근 입력 패널 -->
    <html_entity_how_to />             <!-- 정적 참조 테이블이 있는 SEO 장문 -->
    <html_entity_faq />                <!-- FAQPage JSON-LD -->
  </html_entity>
  <note>도구 내 SPA: 모든 상태 변경(모드/방향/배치/형식)은 로컬 React 상태, 경로 탐색 없음. 결과 패널은 보기에 유지.</note>
</component_hierarchy>

<pages_and_interfaces>
  <html_entity_intro>
    - 눈썹: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px letter-spacing, var(--brand).
    - H1: "HTML 엔티티 변환기" / "HTML Entity Encoder/Decoder" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - 리드: 1–2 문장, body-lg 18px var(--text-secondary): "HTML 특수 문자와 엔티티 참조를 양방향 변환하세요. 텍스트를 인코딩해 HTML 속성에 안전하게 매장하거나, 엔티티를 디코딩해 원본 텍스트로 복원하세요." / 영문 동등물.
  </html_entity_intro>

  <text_input>
    - DESIGN text-input 스타일, 전체 너비, 플레이스홀더 "HTML 엔티티 또는 일반 텍스트를 붙여넣으세요…" / "Paste HTML entities or plaintext here…"
    - 기본값은 단일 라인. 배치 토글은 텍스트영역으로 확장(≥120px 높이, 줄바꿈).
    - 문자 카운터(현재 / 최대 10000), 80%에서 경고.
    - aria: role="textbox", aria-label, aria-describedby.
  </text_input>

  <mode_toggle>
    - 3가지 옵션(라디오 또는 탭):
      **특수문자만**(기본값) — "&, <, >, ", '만" + 도움말("가장 일반적인 용도, 일반 텍스트 유지" / "Most common; plain ASCII stays plain").
      **이름 있는 엔티티** — "&copy;, &nbsp; 등 있으면 사용" + 도움말("이름 있으면 사용, 없으면 숫자" / "Use named (&copy;, &nbsp;, etc.) where available, fall back to numeric").
      **모든 비ASCII** — "U+007F 이상을 숫자로 이스케이프" + 도움말("UTF-8 미지원 시스템용" / "For systems that don't handle UTF-8").
    - 각 옵션 아래 인라인 도움말.
    - 액센트 색상 coral(var(--accent-coral) / var(--accent-coral-soft)).
  </mode_toggle>

  <numeric_style_toggle>
    - 2가지 옵션(분할 컨트롤 또는 선택): **10진수**(&#169;) 및 **16진수**(&#xA9;).
    - 숫자 엔티티가 가능한 출력일 때만 표시(이름 있는 모드 또는 모든 비ASCII).
    - 인라인 도움말: "10진수 또는 16진수 형식" / "Decimal or hexadecimal format".
    - 액센트 색상 coral.
  </numeric_style_toggle>

  <direction_toggle>
    - 단일 토글 버튼: 상태 인코딩 ⇄ 디코딩; 레이블이 방향 변경.
    - 아이콘: arrow-right-left (lucide).
    - 텍스트 입력 후 Enter 누르기 = 토글 활성화(즉시 인코딩/디코딩).
  </direction_toggle>

  <result_output>
    - 스티키 또는 도킹 우측 열(데스크톱 ≥1024px: 너비 360px, radius var(--radius-xxl), var(--surface) + shadow). 모바일: 입력 아래.
    - 읽기 전용 모노스페이스 출력 블록(var(--surface-muted), radius var(--radius-lg), 패딩 16px, line-break: break-all).
    - "결과 복사" 버튼(주 또는 보조) → 클립보드 → 성공 토스트 "✓ 복사됨"(1600ms) 또는 조용히 실패.
    - 키보드 단축키 힌트: "Ctrl+C / Cmd+C to copy".
  </result_output>

  <reference_table>
    - 축소 가능 또는 항상 표시 참조 패널: 검색 가능한 ~50 공통 엔티티.
    - 열: 문자(시각적) | 이름(&copy;) | 10진수(&#169;) | 16진수(&#xA9;) | 설명.
    - 검색 입력(이름, 문자, 또는 설명별 필터).
    - 각 행에 "복사" 버튼(또는 전체 행이 클릭 복사) → 클립보드 → 성공 토스트.
    - 예제 행: © (&copy;), & (&amp;), < (&lt;), > (&gt;), " (&quot;), ' (&#39;), 줄바꿈 없는 공백(&nbsp;), 줄임표(&hellip;), em-대시(&mdash;), 등.
  </reference_table>

  <keyboard_shortcuts>
    - "/" (입력 아님) → 텍스트 입력 포커스.
    - "r" → 최근 목록 토글.
    - "e" → 인코딩/디코딩 토글.
    - "m" → 인코딩 모드 사이클(특수문자만 → 이름 있는 것 → 모든 비ASCII → 특수문자만).
    - "n" → 숫자 형식 토글(10진수 ⇄ 16진수, 해당하는 경우).
    - "b" → 배치 모드 토글.
    - Enter (입력) → 인코딩/디코딩.
    - Escape → 입력 지우기(비어있지 않으면), 최근 닫기.
    - Tab → 표준 키보드 네비게이션.
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <encode note="일반텍스트 → 엔티티 참조">
    - 특수문자만: 하드코딩 {&→&amp;, <→&lt;, >→&gt;, "→&quot;, '→&#39;}. 다른 모든 문자는 그대로 통과.
    - 이름 있는 것: 각 문자 확인; 이름 있는 엔티티 있으면 내보내기(예: © → &copy;); 그 외는 숫자(numericStyle에 따라 10진수 또는 16진수).
    - 모든 비ASCII: 텍스트 반복; ASCII 0–127은 그대로 내보내기; 문자 > U+007F는 숫자로. UTF-16 서로게이트 처리(`String.codePointAt` / `String.fromCodePoint` 사용).
    - UTF-8은 절대 오류 던지지 않음. 검증은 사전에.
  </encode>
  <decode note="엔티티 참조 → 일반 텍스트">
    - 입력 패턴 파싱: `&[a-zA-Z0-9]+;` (이름 있는 것), `&#[0-9]+;` (10진수), `&#x[0-9a-fA-F]+;` (16진수).
    - 알려진 이름 있는 엔티티 → 대체; 알 수 없음 → 그대로 유지(정보 목록, 오류 아님).
    - 유효한 숫자 → 디코딩; 유효하지 않음(범위 초과 등) → 그대로 유지.
    - 형식 틀림(세미콜론 누락, 불완전한 16진수 등) → 그대로 유지(오류 없음).
    - 유니코드 왕복 테스트(이모지, CJK, 악센트).
  </decode>
  <reference_panel>
    - ~50개 공통 엔티티의 검색 가능한 그리드/테이블, 이름/문자/설명별 색인.
    - 각 행 클릭 한 번으로 클립보드 복사(성공 토스트).
  </reference_panel>
  <recents note="localStorage 지속성">
    - pushRecent(list, text, max=10): 앞에 추가, 중복 제거, 자르기.
    - pruneUnknown(list): 로드 시 필터(부패에 관대함).
  </recents>
  <i18n>
    모든 UI 크롬은 tools.html-entity.*(ko/en): 모드 레이블, 방향 레이블, 숫자 형식 레이블, 버튼 텍스트, 오류/정보 메시지, 하우투, FAQ.
    **중요**: 메시지 카탈로그 값에 생 `<`, `&`, 또는 다른 HTML 특수 문자를 넣지 마세요. 예제 엔티티 이름/문자는 코드 렌더 도메인 데이터 또는 컴포넌트 렌더 리터럴에 속하며, i18n 메시지에는 절대 안 됩니다(ICU 파싱 위험).
  </i18n>
</core_functionality>

<error_handling>
  <entity_map_load_failure>엔티티 맵의 동적 import 실패(오프라인, 차단) → 우아한 성능 저하: 특수문자만 모드는 완벽하게 작동; 이름 있는 것/모든 비ASCII 모드는 친화적 오류 표시 "엔티티 참조를 로드할 수 없음 — 특수문자만 모드 시도 또는 연결 확인". UTF-8 경로와 디코딩은 항상 사용 가능.</entity_map_load_failure>
  <malformed_entity_on_decode>불완전한 16진수(예: `&#x6`), 누락된 세미콜론(예: `&copy`), 알 수 없는 이름 있는 엔티티(예: `&fakename;`) → 출력에 그대로 유지; 오류 표시 안 함(알 수 없는 것의 정보 목록은 선택적). 이것은 우아하고 예측 가능한 UX.</malformed_entity_on_decode>
  <empty_or_whitespace_input>유효(무작동): 빈 문자열 인코딩/디코딩 → 빈 결과, 오류 없음.</empty_or_whitespace_input>
  <input_too_long>10000 문자로 캡; 80%에서 경고; 최대 넘으면 제출 방지(폼 검증).</input_too_long>
  <storage_unavailable>프라이빗 모드 → 최근 목록 메모리 내(세션만), 오류 메시지 없음(우아한 성능 저하).</storage_unavailable>
  <copy_failure>clipboard.writeText 실패 → 조용히(보조 기능; 거짓 성공 토스트 절대 표시 안 함).</copy_failure>
  <error_boundary>플랫폼이 도구 감싸기; 렌더 실패 → 셸 충돌 없이 재시도.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>중요: DESIGN.md는 모든 토큰의 단일 정보원. 아래는 도구별 응용.</source>
  <accent_usage>
    - 카테고리 액센트는 CORAL(var(--accent-coral) / var(--accent-coral-soft)) — 이 스펙의 액센트 선택에 따른 "dev" 카테고리 정체성. 모드 토글 활성 상태, 숫자 형식 CTA, 복사 버튼 성공 상태.
    - 주 버튼(인코딩/디코딩 토글)은 명확한 CTA를 위해 brand honey-gold var(--brand) 사용.
  </accent_usage>
  <surfaces>입력/출력 필드 = var(--surface) + 1px var(--hairline); 출력 블록 var(--surface-muted); 결과 카드 radius var(--radius-lg); 레이아웃 카드 radius var(--radius-xl). 부드러운 brand 색 그림자(--shadow-sm / --shadow-card).</surfaces>
  <typography>H1 Gmarket Sans clamp(28–40px)/700; 모드/방향 레이블 Pretendard 16px/600; 입력/출력 모노스페이스(Fira Mono 또는 시스템 모노스페이스) 14px/1.5; 힌트 body-sm 14px var(--text-secondary).</typography>
  <motion>transform/opacity: 입력 포커스 리프트(translateY -2px) 150ms, 복사 성공 펄스(scale 1→1.08→1) 200ms, 오류 페이드인(opacity 0→1) 150ms. 모두 prefers-reduced-motion으로 게이팅(즉시, 스케일 없음).</motion>
  <accessibility>모든 입력에 aria-label; 버튼 레이블(아이콘 + 툴팁); 정보/오류 메시지 aria-live="polite"; 포커스 링 표시 var(--focus-ring) 2px; ≥44px 탭 대상; 명확성을 위한 모노스페이스 출력.</accessibility>
  <responsive>
    - ≥1024px: 2열 레이아웃(입력 좌측, 결과 스티키 우측 360px).
    - 768–1023px: 입력 전체 너비 상단, 결과 하단.
    - <768px: 단일 열, 배치 모드에서 텍스트영역 높이 ≥120px, 최근 목록 사이드 드로어.
  </responsive>
  <atmosphere>기술적, 명확, 정확 — 개발자 유틸리티. 모노스페이스 출력, 정밀한 설명, 평면 디자인. 액센트(coral)는 brand 온기를 유지하고 url-encoder(grape)와 구별됨.</atmosphere>
  <icons>lucide-react: Link(레지스트리 아이콘), ArrowRightLeft(방향 토글), Copy(결과 복사), Search(참조 테이블 필터), Info(힌트). 기본값 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>사용자가 붙여넣은 일반 텍스트 또는 엔티티는 로컬에서 처리; HTML 파싱 또는 렌더링 없음. 모든 출력은 텍스트(dangerouslySetInnerHTML 없음). 모노스페이스 표시는 포맷팅 트릭을 통한 XSS를 방지.</input>
  <entity_decode>디코딩은 절대 엔티티를 실행하지 않음 — 알려진 이름/숫자를 문자 값으로 대체할 뿐. eval 없음, 스크립트 주입 벡터 없음.</entity_decode>
  <clipboard>사용자가 시작한 복사만(버튼 또는 Ctrl+C); 클립보드 읽지 않음; 네트워크에 데이터 전송 없음.</clipboard>
  <entity_map>번들된 콘텐츠에서 로드(빌드 타임에 WHATWG 정규 소스에서 생성). 외부 URL에서 동적 fetch 없음; 무결성은 빌드 해시로 보장.</entity_map>
  <localStorage>최근 목록은 일반 텍스트 문자열만(도구는 사용자 입력을 데이터로 가정, 민감하지 않음). localStorage는 로컬 기기만, 브라우저/프로필별 격리.</localStorage>
  <network>네트워크 호출 0(모든 인코딩/디코딩은 JS, 번들 데이터의 동기 또는).</network>
  <note>시크릿 없음, 인증 없음, API 호출 없음, 서버 쪽 처리 없음.</note>
</security_considerations>

<advanced_functionality>
  <three_encode_modes>특수문자만(기본값, 빠른, 최소 노이즈) + 이름 있는 것(읽기 좋은 참조) + 모든 비ASCII(레거시 시스템 호환성).</three_encode_modes>
  <numeric_style>10진수(&#169;) vs 16진수(&#xA9;) 형식; 전역 설정은 이름 있는 것 및 모든 비ASCII 모드에 적용.</numeric_style>
  <batch_mode>다중 라인 입력: 줄 바꿈으로 분할, 각 라인 독립적 인코딩/디코딩, 결과를 수직으로 스택(순서 보존).</batch_mode>
  <reference_table>~50개 공통 엔티티(©, &, <, >, ", ', 공백, 대시, 따옴표 등), 이름/문자/설명별 검색 가능, 행별 클릭 한 번 복사. SEO 장문 섹션의 정적 테이블로 SSR되어 크롤러용.</reference_table>
  <recents_persistence>마지막 사용 입력 스니펫 10개(인코딩 또는 디코딩 후) localStorage 저장; 클릭해 재입력(재타이핑 없이 빠른 재사용).</recents_persistence>
  <unicode_round_trip>이모지, CJK, 악센트 문자는 end-to-end 테스트(인코딩 → 디코딩 → 원본). 특수문자만 모드의 이모지: 모든 비ASCII로 인코딩해 이모지 이스케이프; 디코딩은 손실 없음.</unicode_round_trip>
  <malformed_tolerance>디코딩은 조용히 알 수 없는 엔티티, 불완전한 16진수, 누락된 세미콜론을 관대하게 처리 — 그대로 유지. 오류 없음, 친화적 UX(선택적 정보 목록).</malformed_tolerance>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>혼합된 일반 텍스트와 특수 문자로 특수문자만 인코딩</description>
    <steps>
      1. 입력: `Hello & goodbye`
      2. 모드: 특수문자만, 방향: 인코딩
      3. 출력 검증: `Hello &amp; goodbye` (& → &amp;, 나머지 변경 안 함).
      4. 결과 복사 → 토스트 "✓ 복사됨".
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>이름 있는 엔티티가 있는 기호로 이름 있는 것 인코딩</description>
    <steps>
      1. 입력: `© 2026 & Co.`
      2. 모드: 이름 있는 것, 방향: 인코딩, 숫자 형식: 10진수
      3. 출력 검증: `&copy; 2026 &amp; Co.` (©→&copy;, &→&amp;, 나머지 일반).
      4. 복사하고 검증.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>이름 있는 것과 숫자 엔티티 혼합 디코딩</description>
    <steps>
      1. 입력: `&copy; 2026 &#38; Co. &#x26; Ltd.`
      2. 모드: N/A (디코딩), 방향: 디코딩
      3. 출력 검증: `© 2026 & Co. & Ltd.` (두 & 형식 디코딩, 이름 있는 것 디코딩).
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>형식 틀린 엔티티 디코딩 — 그대로 유지, 오류 없음</description>
    <steps>
      1. 입력: `Hello &copy (세미콜론 누락) and &#x6 (불완전한 16진수)`
      2. 방향: 디코딩
      3. 출력 검증: `Hello &copy and &#x6` (형식 틀린 것 그대로 유지, 충돌 없음).
      4. 정보 카드(선택적): "2개의 알 수 없거나 형식 틀린 엔티티 발견"(비차단).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>참조 테이블 검색 및 복사</description>
    <steps>
      1. 참조 테이블 클릭(또는 토글).
      2. "copyright" 검색 → &copy; 행 표시.
      3. "복사" 버튼 클릭 → 클립보드에 "©" 포함.
      4. 토스트 "✓ 복사됨".
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>배치 모드: 여러 줄 인코딩</description>
    <steps>
      1. 배치 토글 활성화.
      2. 입력(3줄):
         ```
         Hello & World
         Copyright © 2026
         <tag> & "quoted"
         ```
      3. 모드: 특수문자만, 방향: 인코딩
      4. 출력 검증(3줄, 각 인코딩):
         ```
         Hello &amp; World
         Copyright © 2026
         &lt;tag&gt; &amp; &quot;quoted&quot;
         ```
    </steps>
  </test_scenario_6>
</final_integration_test>

<success_criteria>
  - [x] 인코딩/디코딩 함수는 순수하고 테스트 가능한 도메인 로직 ≥90% 커버리지.
  - [x] 세 가지 인코딩 모드 모두 올바르게 작동(특수문자만, 이름 있는 것, 모든 비ASCII).
  - [x] 디코딩은 관대(형식 틀린 엔티티 그대로 유지, 오류 없음).
  - [x] 엔티티 맵은 필요할 때만 로드(초기 번들에 없음).
  - [x] 배치 모드는 여러 줄을 올바르게 처리.
  - [x] 참조 테이블은 검색 가능하고 클릭 한 번으로 복사.
  - [x] 최근 목록은 세션 전체에 지속(localStorage).
  - [x] SPA 상태 관리는 로컬(경로 탐색 없음).
  - [x] 키보드 단축키 작동(/, r, e, m, n, b, Enter, Escape, Tab).
  - [x] WCAG 2.1 AA: 포커스 링, aria 레이블, ≥44px 탭 대상, prefers-reduced-motion 존중.
  - [x] 반응형 디자인: 2열 데스크톱, 스택 모바일, 배치 모드 텍스트영역.
  - [x] SEO 장문(Intro/HowTo/FAQ)은 정적 참조 테이블 포함(SSR'd, mounted 게이트 없음).
  - [x] FAQPage JSON-LD는 `<HtmlEntityFaq>` 컴포넌트만 방출(단일 소유, 경로 중복 없음).
  - [x] SoftwareApplication + BreadcrumbList JSON-LD는 경로 StructuredData(url == canonical).
  - [x] llms.txt 항목 + sitemap 자동 항목(단일 페이지 도구).
  - [x] SNS 공유 버튼은 경로 템플릿에 자동 배선.
  - [x] i18n: tools.html-entity.* 네임스페이스 ko/en, 메시지 값에 생 HTML 특수 문자 없음.
  - [x] 액센트 색상(coral)은 일관되게 사용; DESIGN.md의 실제 토큰만.
  - [x] 에러 경계는 도구를 감싸기; 미처리 거부 없음.
  - [x] E2E 테스트는 위의 모든 6개 시나리오 + 엣지 케이스(빈 입력, 형식 틀린 UTF-16, 저장소 사용 불가).
  - [x] 프로덕션 빌드: 번들 크기는 예산 내(<80KB JS gzipped for text/converter 카테고리).
</success_criteria>

<build_output>
레지스트리 항목:
```js
{
  id: 'html-entity',
  slug: 'html-entity',
  category: 'dev',
  icon: 'Link', // 또는 전용 아이콘
  accent: 'coral',
  status: 'coming_soon', // → 첫 배포 후 'live'
  addedAt: 'YYYY-MM-DD', // 구현 날짜 채우기
  order: 8, // dev 도구 목록의 위치
  keywords: ['html', 'entity', 'encode', 'decode', 'special chars', '엔티티'],
}
```

`/src/`에 커밋된 파일 구조:
- `lib/html-entity/` — 도메인 계층(6–8개 파일, ≥200줄, 단위 테스트)
- `components/tools/html-entity/` — UI 계층(9–12개 컴포넌트, ≥150줄, 통합 테스트)
- `i18n/messages/{ko,en}.json` — `tools.html-entity.*` 네임스페이스로 업데이트(ko/en)

생성된 콘텐츠(해당하는 경우):
- `content/entities/entities.generated.json` — 큐레이션된 또는 전체 WHATWG 엔티티 맵(~50KB JSON, 선택적 코드 분할)
- `scripts/generate-html-entities.mjs` — 선택적 빌드 타임 생성기(검증, 맵, 정렬)

테스트 아티팩트:
- 도메인 단위 테스트: `lib/html-entity/*.test.ts` (5–7개 파일, ≥400줄 합계, ≥90% 커버리지)
- 컴포넌트 테스트: `components/tools/html-entity/*.test.tsx` (3–5개 파일, ≥250줄 합계)
- E2E 테스트: `tests/e2e/html-entity.spec.ts` (≥10개 시나리오, 핵심 워크플로우)
</build_output>

<key_implementation_notes>
  - **레지스트리 항목**: id `html-entity`, slug `html-entity`, 카테고리 `dev`, 액센트 `coral`, 상태 `coming_soon`, order step(예: 8, 다른 dev 도구와 구별). `addedAt: 'YYYY-MM-DD'` 추가(NEW 뱃지 파생 필수).
  - **엔티티 맵 로드**: 특수문자만 모드는 {&, <, >, ", '} 하드코딩 — 로드 필요 없음. 이름 있는 것 모드는 첫 사용자 선택 시에만 엔티티 맵 지연 로드. 모든 디코딩 경로는 맵 없이 작동(선택적 참조 표시).
  - **도메인 우선 접근**: 인코딩/디코딩 함수는 순수, 테스트 가능, 재사용용 내보냄(예: SEO 컴포넌트, 다른 도구). 도메인 계층은 ≥90% 커버리지.
  - **SEO 장문**: Intro(H1 + 리드) + HowTo(정적 참조 테이블 SSR'd 내부, 특수문자만 vs 이름 있는 것 vs 모든 비ASCII 설명 실제 예제 포함) + FAQ(5–7 Q&A 쌍, 예제 엔티티는 UI 렌더, 메시지 카탈로그는 아님). 세 섹션 모두 AI 크롤러가 보도록 도구 컴포넌트의 `mounted` 게이트 **밖**에서 렌더.
  - **i18n 중요**: tools.html-entity.* 네임스페이스(ko/en). 모드 레이블, 방향 레이블, 숫자 형식 레이블, 버튼 텍스트, 오류/정보 메시지, HowTo, FAQ. **메시지 값에 생 `<`, `&`, `"`, `'` 넣지 마세요** — ICU 파싱 오류 야기. 예제 HTML: `<h1>`, `<tag>` 등은 컴포넌트 또는 도메인 코드로 렌더, .json에는 절대 안 됨.
  - **접근성**: 완전 키보드 지원(/, r, e, m, n, b 단축키), 모든 입력에 aria 레이블, 포커스 링 표시, ≥44px 탭 대상, 모노스페이스 출력, prefers-reduced-motion 존중(즉시 전환).
  - **테스트 전략**: TDD 워크플로우 → 도메인 테스트 우선 작성(RED) → 구현(GREEN) → 컴포넌트 테스트(RTL, 입력/출력 동작) → E2E(위의 6 시나리오). 모든 경로는 UTF-8, 이모지, CJK, 서로게이트로 테스트. 배치 모드는 1–50줄로 테스트. 디코딩 형식 틀린 것(세미콜론 누락, 불완전한 16진수, 알 수 없는 이름) 테스트.
  - **권장 구현 순서**: (1) 도메인 계층(인코딩/디코딩, 엔티티 맵 로드). (2) UI 오케스트레이터 & 입력/출력 컴포넌트. (3) 참조 테이블 & 최근 목록. (4) SEO 섹션(Intro/HowTo/Faq). (5) i18n 동기화(ko/en). (6) E2E 테스트 & 마무리.
</key_implementation_notes>

</project_specification>
```
