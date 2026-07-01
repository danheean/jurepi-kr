# New Word — 신조어·트렌드 용어사전 (마크다운 폴더로 관리하는 한/영 용어 목록) — 서비스 SPEC (한국어판)

> 이 문서는 [`SPEC.md`](SPEC.md)의 한국어 번역본입니다. 원본(영문)이 AI 코딩 에이전트가 소비하는 정본이며, 스펙주도 프로그래밍(Spec-Driven Development)의 단일 소스입니다. 내용 변경 시 두 문서를 함께 갱신하세요.
>
> **New Word** (신조어 / 트렌드 용어사전) — MZ 유행어와 최신 기술 용어(바이브 코딩, 루프 엔지니어링 등)를 담은 한/영 대역 용어사전. 용어는 특정 폴더에 마크다운 쌍(`<용어>.md` + `<용어>_en.md`)으로 저장하면, **빌드 시** 도구가 그 폴더를 읽어 목록·검색·상세를 자동 구성합니다.
> 내부 서비스 코드네임: `new-word`. 레지스트리 id: `new-word`. 공개 URL 슬러그: `/[locale]/tools/new-word`.
>
> 이 SPEC은 **도구 자체**에 집중합니다. 공통 쉘(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공합니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 기준, 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 SPEC(같은 패턴): [`docs/services/text/special-symbol/SPEC.md`](../special-symbol/SPEC.md)

```xml
<project_specification>

<project_name>New Word — 신조어·트렌드 용어사전 (Jurepi 도구, 코드네임 new-word, 레지스트리 id new-word)</project_name>

<overview>
New Word는 빠르게 생겨나고 사라지는 요즘 말을 한곳에 정리합니다. MZ 유행어(갓생, 억까, 알잘딱깔센 …)와 최신 기술 용어(바이브 코딩, 루프 엔지니어링 …)를 **뜻·예문·유래와 함께 한국어/영어 대역**으로 보여줍니다. 사용자는 검색창에 한 단어를 치거나 주제(MZ/기술) 탭을 눌러 원하는 용어를 즉시 찾고, 카드를 열면 한국어 정의와 영어 정의를 나란히 읽습니다. "이 말이 무슨 뜻이지?"와 "이걸 영어로는 뭐라고 하지?"를 한 번에 해결하는 작은 사전입니다.

이 도구의 콘텐츠 모델이 핵심입니다: 용어는 코드가 아니라 **마크다운 파일**로 관리됩니다. 콘텐츠 폴더에 `<용어>.md`(한국어)와 `<용어>_en.md`(영어) 한 쌍을 만들면, **빌드 시 생성기**가 폴더 전체를 훑어 프론트매터를 파싱하고 검증한 뒤, 코드 분할되는 정적 카탈로그(terms.generated.json)로 굽습니다. 도구는 그 카탈로그를 동적 import 해 목록·검색·상세를 렌더합니다. 즉 "폴더에 파일을 두면 목록에 뜬다"가 진짜로 성립하되, 백엔드/DB 없이 SSG로 동작합니다.

CRITICAL (클라이언트 전용·SSG): 100% 클라이언트 사이드. 백엔드 없음, DB 없음, 런타임 파일시스템 접근 없음. 용어 카탈로그는 빌드 타임에 마크다운 → JSON으로 구워지는 정적·코드 분할 데이터 모듈입니다. 유일한 1st-party 영속화는 `localStorage`(즐겨찾기 + 최근 조회 + 마지막 주제 탭)이며, 어떤 것도 네트워크로 전송하지 않습니다.

CRITICAL (콘텐츠 모델·불변식): 모든 용어는 한국어 파일과 영어 파일이 **쌍**으로 존재해야 합니다(하나만 있으면 빌드 경고 후 그 용어는 제외). 각 파일은 비어 있지 않은 `term`·`definition`과 최소 1개의 `examples`를 가져야 합니다. `topic`/`tags`/`related`/`slug` 같은 구조 메타데이터는 **한국어 파일이 정본**이고, 영어 파일은 없으면 상속합니다. 빌드 생성기는 (1) 쌍 무결성 (2) 로케일 필수 필드 (3) slug 유일성 (4) `related`가 실제 존재하는 slug를 가리키는지 를 검증하며, 하나라도 어기면 명확한 메시지로 **빌드를 실패**시킵니다(조용한 누락 금지).

CRITICAL (SPA·사용성 우선): 플랫폼 원칙에 따라 모든 Jurepi 도구는 SSG 셸 위에 마운트되는 클라이언트 사이드 단일 페이지 애플리케이션(SPA)입니다. 모든 상호작용 — 주제 전환, 검색, 카드 열기, 언어 토글, 즐겨찾기 — 은 라우트 이동이나 전체 페이지 리로드 없이 로컬 React 상태로 일어납니다. 라우트는 SEO/인덱싱을 위해 정적 생성(SSG)되고, 인터랙티브 도구는 그 정적 셸 위의 단일 클라이언트 컴포넌트 아일랜드입니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/new-word (SSG; 레지스트리 slug "new-word", id "new-word", status "live", accent "mint", category "text").
  - 플랫폼이 제공(재구현 금지): 앱 쉘(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈을 감싸는 Error Boundary, lib/seo.ts의 SEO 메타데이터 빌더, breadcrumb + in_content 광고를 포함한 도구 페이지 쉘.
  - 소비(consume): i18n 네임스페이스 `tools.new-word.*`(UI 크롬 문자열·주제 라벨·how-to·FAQ — **용어의 뜻/예문은 아님**, 그것은 마크다운에서 옴); 도구 하단의 in_content AdSlot.
  - 플랫폼 의존성(작음 — 새 카테고리 불필요): `'text'` 카테고리는 이미 `ToolCategory`에 `mint` 액센트와 "텍스트"/"Text" 라벨로 존재합니다. 유일한 플랫폼 변경은 `ToolMeta` 레지스트리 항목 1개 추가, 도구 라우트의 slug→컴포넌트 분기, `generateMetadata` 분기, 그리고 콘텐츠 생성 스크립트를 `prebuild`/`predev`에 배선하는 것뿐입니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - 마크다운 쌍(`<용어>.md` + `<용어>_en.md`)으로 관리되는 용어 카탈로그. 콘텐츠 폴더: `content/new-word/terms/`.
    - 빌드 타임 생성기: 폴더 스캔 → 프론트매터 파싱 → 검증 → 코드 분할 정적 카탈로그(terms.generated.json) 생성. `prebuild`/`predev`에 배선.
    - 두 개의 시드 주제(topic)와 초기 용어: **MZ**(갓생, 억까, 알잘딱깔센, 스불재, 완내스, 킹받다 …)와 **기술(tech)**(바이브 코딩, 루프 엔지니어링, 프롬프트 엔지니어링, 에이전트 …). 최소 각 주제 6개 이상 시드.
    - **용어 사전 템플릿**: 새 용어를 쉽게 추가할 수 있는 주석 달린 마크다운 템플릿(`content/new-word/_TEMPLATE.md`, `content/new-word/_TEMPLATE_en.md`)과 authoring README.
    - 한/영 대역 표시: 목록 카드의 1차 라벨은 현재 로케일을 따르고 다른 언어를 부제로; 상세 뷰는 한국어·영어 정의를 **함께** 보여줌(+ 언어 토글).
    - 검색: 용어명·별칭·정의·태그를 두 로케일 모두에서 실시간 필터(디바운스). 대소문자·발음부호 무시.
    - 주제 탭/필: "전체"/"All", "MZ", "기술"/"Tech"(+ "즐겨찾기"/"Favorites", 있을 때 "최근"/"Recent").
    - 상세: 큰 용어명, 읽는 법(선택), 별칭, 한/영 정의, 예문(로케일별), 유래/등장 시기(선택), 관련 용어 칩(클릭 시 이동), 태그, "용어 복사"·"뜻 복사".
    - 즐겨찾기(핀 고정) + 최근 조회 — localStorage 영속화, 알 수 없는 slug 정리.
    - 완전한 키보드 지원: "/" 검색 포커스, 목록 방향키 탐색, Enter로 열기, Esc 지우기/닫기.
    - 도구 전용 SEO 롱폼("신조어란?" / "MZ 용어·기술 용어") + FAQ + **DefinedTermSet/DefinedTerm JSON-LD**(용어사전에 딱 맞는 schema.org 타입), ko/en 로케일화.
    - 모션 감소 대체; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - 앱 쉘, 헤더/푸터, 로케일 스위처, 테마 토글, 동의 배너, 광고 로딩, sitemap/robots, 도구 레지스트리 메커니즘 (모두 플랫폼 담당).
    - 사용자 브라우저에서의 용어 추가/편집 UI(런타임 CMS). 편집은 오직 리포지토리의 마크다운 파일을 통해서만 — 백엔드/DB 없음. 출시 시점에 인앱 편집 없음.
    - 로그인/계정/기기 간 동기화.
    - 용어별 딥링크 URL(예: /tools/new-word/vibe-coding) — MVP는 단일 라우트 + 클라이언트 상태. (Phase 2 후보.)
    - 자동 번역·AI 정의 생성(콘텐츠는 사람이 작성한 마크다운).
    - 마크다운 본문의 임의 리치 HTML/스크립트. 정의는 구조화 필드(플레인 텍스트/제한 인라인 강조)로 렌더.
  </out_of_scope>
  <future_considerations>
    - 용어별 정적 딥링크 라우트 + 개별 DefinedTerm 페이지(SEO) — Phase 2.
    - 한글 초성 검색("ㄱㅅ" → "갓생") — Phase 2.
    - 주제 확장: internet, business, game, finance 등 — Phase 2(카탈로그만 추가, 스키마 불변).
    - "오늘의 신조어" 랜덤 카드 / 공유 이미지 — Phase 3.
    - 사용자 제안(용어 제보) 폼 → 리포지토리 이슈/PR로 연결 — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl(ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <content_source>용어는 `content/new-word/terms/`의 마크다운 쌍. 빌드 타임에만 파일시스템 접근(생성 스크립트). 런타임은 파일시스템에 접근하지 않음.</content_source>
    <frontmatter_parsing>gray-matter v4.x로 YAML 프론트매터 파싱(생성 스크립트 전용 devDependency). 별도 마크다운 렌더러 불필요 — 정의/예문은 프론트매터의 구조화 필드이며 플레인 텍스트로 렌더.</frontmatter_parsing>
    <validation>zod v3.x(리포지토리 기존 사용)로 (1) 각 파일 프론트매터 스키마 (2) 병합된 용어 레코드 불변식을 검증. 생성 스크립트와 런타임 로더 모두에서 재사용 가능한 순수 스키마.</validation>
    <catalog>생성 산출물은 코드 분할 데이터 모듈(src/components/tools/new-word/data/terms.generated.json)로, 이 도구 페이지에서만 동적 import 되어 ko+en 콘텐츠가 전역 i18n 메시지 번들에 절대 들어가지 않음(플랫폼 JS 예산 보호 — special-symbol/qna-a-day와 동일 패턴).</catalog>
    <clipboard>"용어 복사"/"뜻 복사"는 navigator.clipboard.writeText → hidden-textarea execCommand 폴백 → 실패 시 조용한 무시(사전 도구이므로 복사는 부가 기능, 거짓 성공 토스트 금지). 플랫폼 클립보드 교훈 준수.</clipboard>
    <animation>네이티브 CSS 트랜지션만(카드 호버 리프트, 상세 크로스페이드, 모바일 시트 슬라이드). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, 생성 스크립트에서 프론트매터 파싱.</gray-matter>
    <zod>zod v3.x — 이미 리포지토리에 존재; 프론트매터/카탈로그 검증에 재사용.</zod>
  </libraries>
</technology_stack>

<content_authoring_model>
  <directory>
    content/new-word/
    ├── _TEMPLATE.md            # 새 용어 한국어 템플릿(주석 포함, 생성기에서 제외: "_" 접두 무시)
    ├── _TEMPLATE_en.md         # 새 용어 영어 템플릿
    ├── README.md               # 작성 가이드(파일 명명, 필수 필드, topic 목록)
    └── terms/
        ├── vibe-coding.md          # 한국어 정본(구조 메타 canonical)
        ├── vibe-coding_en.md       # 영어
        ├── loop-engineering.md
        ├── loop-engineering_en.md
        ├── god-saeng.md            # 갓생
        ├── god-saeng_en.md
        └── …
  </directory>
  <pairing note="쌍 규칙">
    - 파일명에서 `_en` 을 뗀 base 가 **쌍 키**. `vibe-coding.md`(ko) ↔ `vibe-coding_en.md`(en).
    - `_` 로 시작하는 파일(_TEMPLATE 등)은 생성기가 무시.
    - 한국어 파일만 있고 영어 파일이 없으면(또는 반대) → 빌드 경고 + 그 용어 제외(정본 정책은 CRITICAL). 파일명은 ASCII 권장(URL/slug 안정성). 한글 파일명도 허용하되 프론트매터 `slug`(ASCII) 필수 권장.
  </pairing>
  <slug note="식별자">
    - `slug` = 한국어 파일 프론트매터의 `slug`(있으면) 아니면 base 파일명을 slugify 한 값. `related`·즐겨찾기·최근은 slug 로 참조. 카탈로그 내 유일해야 함(테스트/생성기 검증).
  </slug>
  <shared_metadata note="정본 규칙">
    - 구조 메타(`topic`, `tags`, `related`, `slug`, `coinedYear`)는 **한국어 파일이 정본**. 영어 파일에 있으면 검증 시 일치해야 하고, 없으면 한국어 값 상속.
    - 로케일별 콘텐츠(`term`, `reading`, `aliases`, `definition`, `examples`, `origin`)는 각 파일에서 독립적으로 옴.
  </shared_metadata>
  <template_ko>
    ```markdown
    ---
    # ── 필수 ──
    term: 바이브 코딩            # 화면에 보이는 용어명(한국어)
    slug: vibe-coding           # ASCII 안정 식별자(한국어 파일이 정본). 관련어/즐겨찾기가 참조
    topic: tech                 # 주제: mz | tech (Phase 2: internet | business | culture …)
    definition: |               # 1~3문장, 플레인 텍스트
      AI에게 자연어로 원하는 바를 설명하고, 코드를 한 줄씩 읽기보다
      '느낌(vibe)'대로 받아들이며 소프트웨어를 만드는 방식.
    examples:                   # 최소 1개
      - "요즘은 바이브 코딩으로 주말 프로젝트를 하루 만에 만든다."
      - "바이브 코딩은 빠르지만, 프로덕션에선 검증이 필요하다."
    # ── 선택 ──
    reading: 바이브 코딩         # 읽는 법/표기 도움(선택)
    aliases: [바이브코딩, 바코]  # 검색 별칭(선택)
    tags: [AI, 개발, 트렌드]     # 필터/표시 태그(선택)
    origin: 2025년 개발자 커뮤니티에서 확산된 표현.  # 유래(선택)
    coinedYear: 2025            # 등장 시기(선택)
    related: [loop-engineering, prompt-engineering]  # 관련 용어 slug(선택)
    ---

    <!-- (선택) 확장 설명. 프론트매터 definition 으로 부족할 때만.
         MVP 렌더는 문단 단위 플레인 텍스트. 리치 HTML/스크립트 금지. -->
    ```
  </template_ko>
  <template_en>
    ```markdown
    ---
    # ── required ──
    term: Vibe Coding
    definition: |
      Building software by describing intent to an AI in natural language and
      accepting the output by "vibe" instead of reading every line.
    examples:
      - "I vibe-coded the whole weekend project in a day."
      - "Vibe coding is fast, but production still needs review."
    # ── optional (structural meta inherits from the Korean file if omitted) ──
    reading: /vaɪb ˈkoʊdɪŋ/
    aliases: [vibe-coding]
    origin: Popularized in developer communities in 2025.
    ---
    ```
  </template_en>
</content_authoring_model>

<file_structure>
scripts/
└── generate-glossary.mjs                 # 빌드 타임: content/new-word/terms/* 스캔 → 파싱 → 검증 → terms.generated.json 방출. prebuild/predev 배선.
content/new-word/                          # 사람이 작성하는 콘텐츠(리포지토리)
├── _TEMPLATE.md  _TEMPLATE_en.md          # 템플릿(생성기 제외)
├── README.md                              # 작성 가이드
└── terms/*.md  *_en.md                    # 용어 쌍
src/
├── lib/new-word/                          # 순수 도메인 계층 — React/Next import 없음, 완전 단위 테스트
│   ├── schema.ts                          # zod: TermFileFront(ko/en), MergedTerm, StoreSchema + STORE_VERSION; safeParse 헬퍼
│   ├── merge.ts                           # mergePair(koFront, enFront): 정본 규칙 적용 → MergedTerm; validatePair(경고/에러 수집)
│   ├── slug.ts                            # slugify(name), resolveSlug(front, filename)
│   ├── catalog.ts                         # 타입드 접근: allTerms, byId, byTopic, topics(); related 참조 무결성 체크
│   ├── search.ts                          # filterTerms(terms, query, locale): term+aliases+definition+tags, 두 로케일; 정규화(대소문자/발음부호)
│   └── favorites.ts                       # 불변 ops: toggleFavorite, pushRecent(max), pruneUnknown(slugs, catalog)
├── components/tools/new-word/
│   ├── NewWord.tsx                        # 오케스트레이터(Client Component) — topic/query/selected/lang 상태 + useGlossary() 소유
│   ├── useGlossary.ts                     # 훅: 카탈로그 동적 import + localStorage 즐겨찾기/최근 + 파생 필터/선택
│   ├── TopicTabs.tsx                      # 전체 / MZ / 기술 / (즐겨찾기) / (최근) 필 (tablist)
│   ├── TermSearch.tsx                     # 검색 입력("/" 포커스, 지우기, 결과 수, aria)
│   ├── TermList.tsx                       # 반응형 카드 리스트/그리드; 로빙 tabindex 키보드 탐색
│   ├── TermCard.tsx                       # 한 용어 카드: 용어명(로케일 1차 + 타 언어 부제), 짧은 정의, topic 액센트, 태그, 별
│   ├── TermDetail.tsx                     # 선택된 용어: 큰 용어명, 읽는 법, 한/영 정의(+언어 토글), 예문, 유래, 관련어 칩, 복사
│   ├── RelatedChips.tsx                   # related slug → 클릭 시 해당 용어 선택
│   ├── NewWordIntro.tsx                   # H1 + 리드(SEO; 가능한 한 서버 렌더)
│   ├── NewWordHowTo.tsx                   # "신조어란?" / "MZ·기술 용어" (SEO 롱폼)
│   ├── NewWordFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── data/
│       └── terms.generated.json          # 생성 산출물(gitignore 또는 커밋; 아래 build_output 참조) — [MergedTerm...]
└── i18n/messages/{ko,en}.json             # tools.new-word.* UI 크롬(탭, 검색, 토스트, 언어 토글, how-to, FAQ) — 용어 콘텐츠 아님
</file_structure>

<core_data_entities>
  <term_file_front note="개별 마크다운 파일의 프론트매터(파싱 단위)">
    - term: string (필수, 비어있지 않음) — 표시 용어명(해당 로케일)
    - definition: string (필수, 비어있지 않음, 플레인 텍스트, 권장 ≤ 400자)
    - examples: string[] (필수, ≥ 1, 각 비어있지 않음)
    - slug?: string — ASCII 안정 식별자(한국어 파일에서 정본; 없으면 파일명 유도)
    - topic?: enum (mz, tech) — 한국어 파일 정본; Phase 2 확장 가능
    - reading?: string
    - aliases?: string[]
    - tags?: string[]
    - origin?: string
    - coinedYear?: number
    - related?: string[] — 다른 용어 slug
    INVARIANT: term·definition 비어있지 않음, examples ≥ 1. zod 파싱 실패 시 그 파일은 에러로 수집(빌드 실패 대상).
  </term_file_front>
  <merged_term note="ko+en 병합 결과; 카탈로그 레코드; terms.generated.json 항목">
    - slug: string — 유일 식별자(카탈로그 내 unique; 즐겨찾기/최근/related 참조)
    - topic: enum (mz, tech) — 한국어 파일 정본
    - tags: string[] — 한국어 파일 정본(없으면 [])
    - coinedYear?: number
    - related: string[] — 정본; 카탈로그 내 실재 slug 만 남김(빌드에서 검증, 미존재 참조는 에러)
    - ko: { term, definition, examples, reading?, aliases?, origin? }
    - en: { term, definition, examples, reading?, aliases?, origin? }
    INVARIANT — 쌍/필드/유일성/참조: 모든 레코드는 ko·en 둘 다 존재하고 각 로케일의 term/definition/≥1 example 이 채워져야 함; slug 유일; related 는 실재 slug. 하나라도 위반 시 생성기가 빌드 실패(누락 제외가 아니라 명시적 에러 + 어떤 파일/필드인지 보고).
  </merged_term>
  <topic note="주제 그룹핑; 로케일 라벨은 i18n">
    - id: enum (mz, tech). 표시 순서: mz → tech (Phase 2 뒤에 추가).
    - 라벨: tools.new-word.topics.<id> (ko: "MZ 용어"/"기술 용어", en: "MZ Slang"/"Tech Terms").
    - 가상 탭(실제 topic 아님): "all"(전체), "favorites"(핀), "recent"(MRU) — 해당될 때 탭 줄 앞/뒤에 표시.
  </topic>
  <glossary_store note="단일 localStorage blob">
    - version: number (STORE_VERSION, 1부터)
    - favorites: string[] — 용어 slug, 삽입 순서
    - recents: string[] — 용어 slug, 최근순, RECENTS_MAX = 20, 중복 제거
    - meta: { lastTopic?: string; lastLang?: 'ko' | 'en' | 'both'; createdAt: number }
    localStorage 키: `jurepi-new-word`
    INVARIANT: 읽기는 zod 파싱; 실패 시 새로 시작(throw 금지). 현재 카탈로그에 없는 slug 는 로드 시 제거(pruneUnknown).
  </glossary_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; CARD_DEF_CLAMP = 2줄; TOAST_MS = 1600ms.
  </constants>
  <defaults>
    - 신규 사용자: favorites/recents 비어 있음; 활성 탭 "all"; 선택 용어 없음(상세는 빈 힌트); 언어 표시 = 현재 로케일 1차 + 타 언어 부제, 상세는 'both'.
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/new-word" page="NewWord (플랫폼 도구 라우트가 slug→컴포넌트 분기로 렌더)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams 가 레지스트리(status "live")를 순회하며 SSG. 용어별 딥링크 라우트는 out_of_scope(Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <new_word>                    <!-- "use client"; topic + query + selectedSlug + lang 상태 + useGlossary() 소유 -->
    <new_word_intro />          <!-- H1 + 리드(가능한 한 서버 렌더) -->
    <glossary_layout>           <!-- 데스크톱 2분할(리스트 | 상세), 모바일 적층 + 바텀시트 -->
      <glossary_main>           <!-- 좌측/상단 컬럼 -->
        <term_search />         <!-- "/" 포커스, 지우기, 결과 수 -->
        <topic_tabs />          <!-- 전체 / MZ / 기술 / 즐겨찾기 / 최근 -->
        <term_list>             <!-- 로빙 tabindex 카드 -->
          <term_card />         <!-- × N: 클릭 = 선택(상세 열기); 별 = 즐겨찾기 -->
          <empty_state />       <!-- 검색 결과 없음 / 빈 즐겨찾기 / 빈 최근 -->
        </term_list>
      </glossary_main>
      <term_detail>             <!-- 데스크톱: sticky 우측; 모바일: 바텀시트 -->
        <related_chips />       <!-- related slug → 선택 이동 -->
      </term_detail>
    </glossary_layout>
    <new_word_how_to />         <!-- SEO 롱폼 -->
    <new_word_faq />            <!-- FAQPage JSON-LD -->
  </new_word>
  <note>도구 내 SPA: 탭/검색/선택/언어 토글은 로컬 상태 전환, 라우트 이동 아님. 상세는 도킹(데스크톱)이든 바텀시트(모바일)든 동일 컴포넌트.</note>
</component_hierarchy>

<pages_and_interfaces>
  <new_word_intro>
    - 아이브로: "텍스트 도구" / "TEXT TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "신조어 용어사전" / "New Word Glossary" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - 리드: 1–2문장, body-lg 18px var(--text-secondary): "요즘 유행하는 MZ 용어와 최신 기술 용어를 뜻·예문과 함께 한국어·영어로 찾아보세요." / 영어 동등 문구.
  </new_word_intro>

  <term_search>
    - DESIGN text-input 스타일, 메인 컬럼 전폭, 선두 Search 아이콘(lucide, 20px var(--text-muted)), 플레이스홀더 "용어·뜻·태그로 검색 (예: 갓생, 바이브 코딩, AI)".
    - 다른 필드 입력 중이 아닐 때 "/" 로 포커스. 비어있지 않으면 후미 지우기(×).
    - 실시간 필터, 디바운스 120ms. 결과 수 "결과 N개" caption var(--text-muted), aria-live="polite".
    - aria: role="searchbox", aria-controls = 리스트.
  </term_search>

  <topic_tabs>
    - 가로 필 줄(category-pill / category-pill-active). 순서: "전체"(all) → "MZ" → "기술" → "즐겨찾기"(favorites, 있을 때) → "최근"(recent, 있을 때).
    - 활성 = 브랜드 허니골드 채움 / on-brand 텍스트; 비활성 = surface-muted / text-secondary; 호버 bg 리프트.
    - role="tablist"; ArrowLeft/Right 이동; 활성 aria-selected. 좁은 화면 가로 스크롤 + 스냅.
    - 검색과 결합: topic 이 집합을 좁히고, 검색이 그 안에서 필터. "전체" + 빈 검색 = 전체 카탈로그.
  </topic_tabs>

  <term_list>
    - 반응형 그리드: ≥1024px 상세와 2분할 시 1열 카드 리스트(넓은 카드) 또는 2열; 768–1023px 2열; &lt;768px 1열.
    - 각 카드(term_card):
      - 상단: 용어명 1차(현재 로케일, headline 18–20px var(--text)/700) + 타 언어 부제(14px var(--text-muted)). 예: ko 로케일 → "갓생" / "god life (productive life)".
      - 우상단: topic 배지(작은 필, topic 색 틴트) + 별 버튼(즐겨찾기 토글, aria-pressed).
      - 본문: 정의 2줄 클램프(var(--text-secondary) 14–15px).
      - 하단: 태그 칩 최대 3개(surface-muted).
      - 카드: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px.
    - 상태:
      - 호버(마우스): translateY(-2px) + var(--shadow-card-hover); 커서 pointer.
      - 포커스(키보드): 2px var(--focus-ring) 링 offset 2px.
      - 선택됨: 2px var(--accent-mint) 링 + var(--accent-mint-soft) 좌측 강조 바.
    - 로빙 tabindex: 활성 카드만 tabbable; ArrowUp/Down(그리고 그리드면 Left/Right)로 이동; Home/End 첫/끝; Enter/Space 로 상세 열기(모바일은 바텀시트); "f" 로 즐겨찾기 토글.
    - aria: 리스트는 role="list"(또는 grid); 각 카드는 aria-label = "{term} — {topic}"; 별은 상태 있는 실제 버튼.
    - empty_state: 검색 결과 없음 → "‘{query}’에 해당하는 용어가 없어요" + 검색 지우기; 빈 즐겨찾기 → "별을 눌러 자주 보는 용어를 저장하세요"; 빈 최근 → "최근 본 용어가 여기에 모여요".
  </term_list>

  <term_detail>
    - 데스크톱(≥1024px): sticky 우측 컬럼, 폭 360px, var(--surface), radius var(--radius-xxl) 28px, padding 24px, shadow --shadow-card. breadcrumb 아래 고정.
    - 태블릿(768–1023px): 리스트 아래 전폭 카드 또는 ~320px 도킹.
    - 모바일(&lt;768px): 카드 선택 시 슬라이드업 바텀시트; 그랩 핸들 + 닫기; 백드롭 dim rgba(30,27,58,0.4).
    - 콘텐츠(위→아래):
      1. 용어명: 큰 headline 28px var(--text)(현재 언어 토글 기준). 옆에 읽는 법(reading, caption var(--text-muted)). 별칭(aliases) 작은 회색 칩.
      2. 메타 줄: topic 배지 + coinedYear(있으면 "2025~") + 태그 칩. + "용어 복사"/"뜻 복사" 작은 버튼(성공 시 짧은 토스트; 실패는 조용히).
      3. 언어 토글: [한국어] [English] [둘 다] 세그먼트(기본 '둘 다' 또는 마지막 선택). 'both' 는 ko·en 정의를 위아래로.
      4. 정의: body 16px/1.55 var(--text-secondary). 'both' 일 때 각 블록에 언어 라벨 eyebrow("한국어"/"English").
      5. 예문: 적층 목록(로케일별), 각 var(--surface-muted) 칩(radius --radius-md); 예문 안 용어는 강조(var(--accent-mint)/600). 라벨 "예문"/"Examples" eyebrow.
      6. 유래(origin, 있으면): caption var(--text-muted) 작은 노트, "유래"/"Origin" 라벨.
      7. 관련 용어(related, 있으면): related_chips — 클릭 시 그 용어를 선택(리스트/상세 갱신), 없는 slug 는 표시 안 함.
    - 빈/초기 상태(미선택): 힌트 카드 — "용어를 선택하면 뜻과 예문이 여기에 표시됩니다." + 최근 있으면 다시 보기 넛지.
  </term_detail>

  <keyboard_shortcuts_reference>
    - "/" → 검색 입력 포커스(필드 입력 중이 아닐 때).
    - 방향키 → 리스트 카드 포커스 이동(로빙 tabindex); Home/End → 첫/끝.
    - Enter / Space → 포커스 카드 상세 열기.
    - "f"(카드 포커스 중) → 즐겨찾기 토글(aria-pressed 전환 + 토스트).
    - "l" (상세 열림) → 언어 토글 순환(ko → en → both).
    - Esc → 검색 비어있지 않으면 지우기; 아니면 모바일 상세 시트 닫기.
    - 터치에선 비활성; 모든 동작은 탭으로 닿음.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="빌드 타임, scripts/generate-glossary.mjs">
    - content/new-word/terms/ 스캔, `_` 접두 파일 무시. base 파일명으로 ko/en 쌍 그룹핑.
    - gray-matter 로 각 파일 프론트매터 파싱 → zod TermFileFront 검증.
    - mergePair: 정본 규칙 적용(구조 메타 = ko 정본, en 없으면 상속; 로케일 콘텐츠 독립). resolveSlug.
    - 검증(하나라도 실패 → process.exit(1), 어떤 파일/필드/이유 명시): 쌍 무결성, 로케일 필수 필드, slug 유일성, related 참조 실재.
    - 통과 시 정렬(topic 순 → coinedYear desc → term 로케일 정렬)해 terms.generated.json 방출. 결정적 출력(동일 입력 → 동일 파일; Date/random 미사용).
    - package.json 배선: "predev": "node scripts/generate-glossary.mjs", "prebuild": "node scripts/generate-glossary.mjs".
  </generation>
  <catalog_access note="런타임 순수 계층">
    - allTerms(): MergedTerm[] (생성 순서 유지). byId(slug), byTopic(topic). topics(): 카탈로그에 실존하는 topic id.
    - 테스트가 카탈로그(terms.generated.json)의 유일성·related 무결성·로케일 완전성을 검증.
  </catalog_access>
  <search>
    - filterTerms(terms, query, locale): query 비면 그대로. 아니면 정규화(trim, NFC, 소문자, 발음부호 제거). 다음 중 하나라도 부분 포함 시 매칭: ko.term, en.term, aliases(양쪽), ko.definition, en.definition, tags. 안정 순서 유지.
    - topic 탭과 결합: 리스트 = filterTerms(활성 탭 부분집합, query). Favorites/Recent 탭은 자신의 순서 부분집합을 필터.
  </search>
  <favorites_and_recents note="불변 — 새 배열/스토어 반환">
    - toggleFavorite(list, slug): 없으면 추가, 있으면 제거(순서 유지).
    - pushRecent(list, slug, max=20): 맨 앞 이동/삽입, 중복 제거, max 컷.
    - pruneUnknown(slugs, catalog): 카탈로그에 없는 slug 제거(로드 시).
    - 최근에 push 하는 시점: 상세를 열 때(선택). 검색/호버는 아님.
  </favorites_and_recents>
  <persistence_adapter useGlossary>
    - 마운트 시: 카탈로그 동적 import; `jurepi-new-word` 읽기 → zod → pruneUnknown → 상태; 실패 시 새로 시작. localStorage 부재 시 인메모리로 동작(도구 완전 사용 가능, 비영속).
    - 변경 시: 디바운스 JSON.stringify → setItem; quota/security catch → 인메모리 유지.
    - 노출: 활성 탭+query 필터 목록, selectedSlug + select(slug), toggleFavorite, favorites, recents, lastTopic, lang + setLang, copy(text).
  </persistence_adapter>
  <i18n>모든 UI 크롬은 tools.new-word.*(ko/en): 탭·주제 라벨, 검색 플레이스홀더/결과 수, 언어 토글 라벨, 복사 토스트, 빈 상태, how-to, FAQ. **용어의 term/definition/examples/origin 은 마크다운(terms.generated.json)에서** 오며 i18n 메시지가 아님.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: 잘못된 콘텐츠는 조용히 넘어가지 않음. 생성기는 위반(쌍 누락, 빈 필수 필드, 중복 slug, dangling related)마다 파일 경로 + 필드 + 이유를 stderr 에 출력하고 non-zero 종료 → CI/빌드 실패. 개발 편의를 위해 "고아 파일(짝 없음)"은 경고로 나열하되, 정본 정책상 최소 1건이면 실패(설정 가능하지만 기본 strict).
  </build_time>
  <search_no_results>질의를 되울리는 친절한 빈 상태 + "검색 지우기"; 상세는 마지막 선택/빈 힌트 유지.</search_no_results>
  <copy_failure>복사는 부가 기능. clipboard → execCommand 실패 시 조용히 무시(거짓 "복사됨" 토스트 금지). 성공 시에만 토스트.</copy_failure>
  <storage>
    <unavailable>시크릿 모드/비활성 → 즐겨찾기·최근은 세션 인메모리; 무서운 오류 없음. 목록/검색/상세 정상.</unavailable>
    <corrupt_blob>JSON/zod 실패 → 빈 스토어로 시작(throw 금지).</corrupt_blob>
    <quota>setItem throw → 인메모리 유지; 사용자 대면 오류 없음.</quota>
  </storage>
  <error_boundary>플랫폼이 도구를 Error Boundary 로 감쌈; 렌더 실패 시 셸 유지 + 재시도.</error_boundary>
  <note>런타임 1st-party 네트워크 요청 없음; API 오류 표면 없음.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md 가 모든 토큰의 단일 소스. 아래는 도구별 적용.</source>
  <accent_usage>
    - 카테고리 액센트는 MINT(var(--accent-mint) / var(--accent-mint-soft)) — DESIGN "text" 카테고리 정체성. 인트로 아이콘 타일, 카드 선택 강조 바, 상세 예문 강조, 즐겨찾기 별(채움)에 사용.
    - CTA/1차 동작 색은 브랜드 허니골드 var(--brand)(탭 활성, 주요 버튼). 액센트는 정체성, 동작색 아님(DESIGN do/don't).
    - topic 배지 색: mz 와 tech 를 시각적으로 구분하되 mint 정체성 안에서(예: mz = var(--accent-mint) 틴트, tech = var(--accent-sky) 틴트 배지 — 카드 배지 한정, 도구 전체 액센트는 mint 유지). 대비는 AA.
  </accent_usage>
  <surfaces>카드/상세 = var(--surface) + 1px var(--hairline); 상세 radius --radius-xxl, 카드 radius --radius-lg; 예문/태그 칩 var(--surface-muted). 부드러운 브랜드 틴트 그림자, 하드 보더를 엘리베이션으로 쓰지 않음.</surfaces>
  <typography>H1 Gmarket Sans(clamp 28–40px); 용어명 headline(카드 18–20px / 상세 28px)/700; 정의 Pretendard 15–16px/1.55; 읽는 법·유래·태그는 caption/eyebrow. 예문 안 용어 강조 600.</typography>
  <motion>transform/opacity 만: 카드 호버 translateY(-2px) 150ms, 상세 크로스페이드 150ms, 모바일 시트 슬라이드업(translateY) 250ms, 별 토글 팝(scale 1→1.15→1) 200ms. --ease-out cubic-bezier(0.16,1,0.3,1). 모두 prefers-reduced-motion 게이팅(즉시 페이드, 스케일 없음).</motion>
  <accessibility>카드/별/토글은 라벨 있는 실제 버튼; 방향키 로빙 tabindex 리스트; 복사·즐겨찾기 상태 aria-live="polite"; ≥44px 탭 타깃; 가시 focus-visible 링 var(--focus-ring); 언어 토글은 segmented radio(aria). AA 대비: 정의 텍스트는 밝은 표면 위 var(--text-secondary), 흰 위 저대비 mint 금지.</accessibility>
  <responsive>
    - ≥1024px: 2분할 — 메인(검색+탭+리스트) flex:1, 상세 sticky 360px 우측.
    - 768–1023px: 리스트 2열; 상세는 아래 전폭 카드 또는 ~320px 도킹.
    - &lt;768px: 단일 컬럼; 상세는 선택 시 바텀시트. 탭 필 가로 스크롤 + 스냅. 브레이크포인트 DESIGN(480/768/1024) 준수. 가로 overflow 금지(320px 검증).
  </responsive>
  <atmosphere>밝고 친근한 "요즘 말 사전": 넉넉한 간격의 카드, 우측에 큰 용어 하나가 스포트라이트. 빽빽한 표가 아니라 읽고 싶어지는 카드. 트렌디하되 Jurepi 톤(따뜻·명료) 유지.</atmosphere>
  <icons>lucide-react: Search(검색), Star/StarOff(즐겨찾기), Copy(복사), X(지우기/닫기), Languages(언어 토글), ArrowUpRight(관련어). 기본 20px, stroke 1.75, currentColor. 레지스트리 카드 아이콘은 `BookA`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="콘텐츠는 1st-party 리포지토리 파일이지만 방어적으로">
    - 용어 term/definition/examples/origin/tags 는 텍스트 노드로 렌더(React 이스케이프). dangerouslySetInnerHTML 금지. 마크다운 본문(선택 확장 설명)도 MVP 는 문단 플레인 텍스트로만 렌더 — 리치 HTML/스크립트 주입 없음.
    - 생성기는 프론트매터를 zod 로 검증(타입/필수/길이). 예상 밖 필드는 무시.
  </input>
  <clipboard>사용자 시작 문자열(용어/뜻)만 씀; 클립보드 읽지 않음; 사용자 제스처 핸들러 안에서만.</clipboard>
  <privacy>즐겨찾기/최근은 오직 localStorage; 절대 전송 안 함. 복사 콘텐츠 담는 분석 이벤트 없음. how-to/FAQ 에 명시.</privacy>
  <content_integrity>카탈로그는 빌드 정적 자산(원격 fetch 없음); 생성기/단위 테스트가 유일성·참조·로케일 완전성을 검증해 잘못된 항목이 출하되지 않음.</content_integrity>
  <note>비밀값 없음, 런타임 네트워크 호출 없음, 3rd-party 저장소 없음.</note>
</security_considerations>

<advanced_functionality>
  <bilingual_toggle>상세의 한국어/영어/둘 다 세그먼트 — 한 용어의 한/영 정의를 나란히. "l" 단축키로 순환. 마지막 선택 localStorage 기억.</bilingual_toggle>
  <favorites_recents>핀 고정 + 최근 조회(localStorage) — 반복 조회 마찰 제거. 알 수 없는 slug 자동 정리.</favorites_recents>
  <related_navigation>related 칩으로 용어 간 이동 — 사전을 탐험하게. dangling 참조는 빌드에서 걸러짐.</related_navigation>
  <keyboard_first>"/" 검색, 방향키 리스트, Enter 열기, "f" 즐겨찾기, "l" 언어 — 마우스 없이 사용.</keyboard_first>
  <structured_data>DefinedTermSet + 각 용어 DefinedTerm JSON-LD(name, description, inDefinedTermSet) 방출 — 검색엔진이 용어사전으로 인식(발견성=성장, DESIGN 원칙 ③).</structured_data>
  <initial_consonant_search optional="true">Phase 2: 한글 초성 검색을 filterTerms 시그니처 변경 없이 레이어링.</initial_consonant_search>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>마크다운 폴더 → 목록 자동 구성</description>
    <steps>
      1. content/new-word/terms/ 에 vibe-coding.md + vibe-coding_en.md 존재.
      2. pnpm dev(또는 build) → predev 생성기 실행 → terms.generated.json 에 vibe-coding 병합 레코드 포함(ko/en term·definition·examples).
      3. /ko/tools/new-word 방문 → 리스트에 "바이브 코딩" 카드(부제 "Vibe Coding") 렌더.
      4. 새 쌍 loop-engineering(.md/_en.md) 추가 후 재빌드 → 리스트에 자동 등장(코드 수정 없이).
      5. 영어 파일만 있고 한국어 파일이 없는 용어를 하나 두고 재빌드 → 생성기가 그 파일 경로 + 이유를 보고하고 non-zero 종료(빌드 실패).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>검색·주제 필터·빈 상태</description>
    <steps>
      1. 검색에 "갓생" 입력 → 리스트가 갓생으로 좁혀짐; 결과 수 갱신; aria-live 안내.
      2. 검색 지우고 "기술"(tech) 탭 클릭 → 기술 용어만(바이브 코딩, 루프 엔지니어링 …).
      3. "AI" 입력 → 태그/정의에 AI 가 있는 용어들 표시(두 로케일 매칭).
      4. "asdfqwer" 입력 → 빈 상태 "‘asdfqwer’에 해당하는 용어가 없어요" + 지우기; 지우면 복원.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>상세·한/영 대역·관련어</description>
    <steps>
      1. "바이브 코딩" 카드 클릭 → 상세 열림: 용어명, 한국어 정의, 예문; 최근에 push.
      2. 언어 토글 [둘 다] → 한국어·English 정의가 라벨과 함께 위아래로.
      3. related 칩 "루프 엔지니어링" 클릭 → 상세가 그 용어로 전환(리스트 선택도 동기화).
      4. "뜻 복사" → 클립보드에 정의 텍스트; 성공 토스트. (클립보드 미지원 시뮬 → 조용히 무시, 거짓 토스트 없음.)
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>즐겨찾기·최근 영속화 + 키보드/a11y</description>
    <steps>
      1. 서로 다른 용어 2개 상세 열기 → "최근" 탭에 최근순 목록.
      2. 카드 별 클릭(또는 카드 포커스 후 "f") → "즐겨찾기" 탭에 등장; 별 채워짐(aria-pressed=true).
      3. 페이지 리로드 → 즐겨찾기·최근 유지(localStorage), 알 수 없는 slug 정리.
      4. "/" → 검색 포커스; 방향키로 카드 이동; Enter 로 상세 열기; axe 실행 → 위반 없음, 카드/별/토글 라벨·포커스 링 확인.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n + SEO(JSON-LD)</description>
    <steps>
      1. /en 전환 → 크롬(탭/검색/토글/how-to/FAQ) 영어; 카드 1차 라벨은 English term, 부제 한국어.
      2. 프로덕션 빌드 → /ko/tools/new-word 와 /en/tools/new-word 가 고유 title·description·canonical·hreflang·OG 로 정적 생성.
      3. 페이지 HTML 에 SoftwareApplication + FAQPage + DefinedTermSet(각 용어 DefinedTerm) JSON-LD 존재; how-to/FAQ 로케일화; 용어 데이터셋은 전역 i18n 번들이 아닌 코드 분할 청크로 출하.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: 콘텐츠 폴더에 `<용어>.md` + `<용어>_en.md` 쌍을 두고 빌드하면 코드 수정 없이 목록·검색·상세에 자동 반영; 생성기가 쌍/필드/유일성/참조 불변식을 검증하고 위반 시 명확한 메시지로 빌드 실패.</content_model>
  <functionality>검색·주제 필터 가능한 한/영 대역 카드 리스트; 상세의 언어 토글(ko/en/both); related 이동; localStorage 즐겨찾기·최근(알 수 없는 slug 정리, 부재 시에도 동작); 시드 MZ ≥6 + 기술 ≥6 용어.</functionality>
  <user_experience>검색/필터 즉각 반응; 카드가 읽고 싶게; ≥44px 타깃; 가시 포커스; SPA — 어떤 상호작용도 라우트 리로드 없음.</user_experience>
  <technical_quality>lib/new-word/* 순수 함수 단위 커버리지 ≥ 80%(schema/merge/slug/search/favorites); 생성기 검증 로직 테스트(쌍 누락·중복 slug·dangling related·빈 필드 → 실패); TS 오류 0; 800줄 초과 파일 없음; 카탈로그 코드 분할로 전역 i18n 번들 미부풀림.</technical_quality>
  <visual_design>DESIGN.md 준수; mint 정체성 + 브랜드 허니골드 CTA; 밝고 친근한 카드 사전; HTML 미주입(텍스트 노드 렌더).</visual_design>
  <accessibility>완전한 키보드 동작(로빙 리스트, "/", Enter, "f", "l", Esc); aria-live 상태; 라벨 버튼; 모션 감소 존중; WCAG 2.1 AA 대비.</accessibility>
  <performance>도구 라우트 플랫폼 예산 내; 카탈로그 동적 import; CLS 영향 없음(광고 높이 플랫폼 예약); LCP &lt; 2.5s.</performance>
</success_criteria>

<build_output>
  <note>플랫폼의 일부로 빌드(pnpm build). 빌드 전 `prebuild` 훅이 generate-glossary.mjs 를 실행해 terms.generated.json 을 최신화. /[locale]/tools/new-word 는 플랫폼 generateStaticParams 가 레지스트리(status "live")를 순회하며 사전 렌더. 용어 카탈로그는 이 라우트에서만 로드되는 코드 분할 청크로 출하.</note>
  <generated_artifact>terms.generated.json 은 (a) .gitignore 하고 predev/prebuild 로 항상 재생성 하거나 (b) 재현성·리뷰 편의를 위해 커밋. 권장: 생성기가 결정적이므로 **커밋**(diff 로 콘텐츠 변경 리뷰 가능) + CI 에서 "생성물이 최신인지" 체크(재생성 후 git diff 없음).</generated_artifact>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — 항목 1개 추가. 'text' 카테고리 + 'mint' 액센트는 이미 존재하므로 ToolCategory 변경 불필요.
    {
      id: 'new-word',
      slug: 'new-word',
      category: 'text',
      icon: 'BookA',            // lucide-react
      accent: 'mint',
      status: 'live',           // 모듈/시드 완성 전까지 'coming_soon'
      isNew: true,
      order: 10,                // special-symbol 다음 등 원하는 대로
      keywords: ['신조어','유행어','MZ','밈','용어','용어사전','트렌드','바이브코딩','바이브 코딩','루프엔지니어링','갓생','억까','새로운 말','new word','slang','glossary','terms','vibe coding','trend','buzzword'],
    },
    ```
    또한 도구 라우트에 slug→컴포넌트 분기(&lt;NewWord/&gt;)와 generateMetadata 분기(title/description/JSON-LD)를 기존 ladder/qna-a-day 분기와 함께 추가. 새 카테고리 라벨 불필요("텍스트"/"Text" 필 이미 존재).
  </platform_registry_change>
  <critical_paths>
    1. 콘텐츠 파이프라인: 마크다운 스캔 → gray-matter → zod → mergePair → 검증 → terms.generated.json. 도구 전체가 여기 의존. 검증 실패는 조용한 누락이 아니라 빌드 실패.
    2. 쌍/정본 병합 규칙(ko canonical, en 상속) + slug 유일성 + related 참조 무결성.
    3. 검색(두 로케일, 발음부호/대소문자 무시) + topic 결합.
    4. 상세 언어 토글(ko/en/both) — 한/영 대역이 도구의 핵심 가치.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/new-word/{schema,slug,merge,search,favorites}.ts 를 Vitest 로(RED→GREEN): 프론트매터 스키마, slug 유도/유일성, 정본 병합, 검색 매칭, MRU/즐겨찾기 불변 ops, pruneUnknown.
    2. scripts/generate-glossary.mjs + content/new-word/{_TEMPLATE,_TEMPLATE_en,README} + terms/ 시드(바이브 코딩, 루프 엔지니어링, 갓생, 억까, 알잘딱깔센, 스불재 …). 생성기 검증 테스트(쌍 누락·중복 slug·dangling related·빈 필드 → 실패). predev/prebuild 배선.
    3. tools.new-word.* 메시지(ko/en): 탭·주제 라벨, 검색, 언어 토글, 토스트, 빈 상태, how-to, FAQ.
    4. useGlossary 훅(카탈로그 동적 import + localStorage 즐겨찾기/최근/인메모리 폴백 + 파생 필터/선택 + copy 어댑터).
    5. TermSearch + TopicTabs + TermList/TermCard(로빙 tabindex, 상태) + 빈 상태.
    6. TermDetail(용어명/읽는 법/별칭/언어 토글/정의/예문/유래/related_chips/복사) — 데스크톱 도킹, 모바일 바텀시트.
    7. 키보드 단축키; 모션 감소; a11y 패스(axe, aria-live, 로빙 포커스).
    8. NewWordIntro/HowTo/Faq + SoftwareApplication + FAQPage + DefinedTermSet/DefinedTerm JSON-LD 를 플랫폼 lib/seo.ts 로.
    9. 레지스트리 status → live; slug→컴포넌트 + generateMetadata 분기; E2E 시나리오 1–5; 비주얼 회귀 320/768/1024 양 테마.
  </recommended_implementation_order>
  <seed_terms note="초기 콘텐츠 — 정의는 작성자가 다듬되 이 슬러그/주제로 시작">
    - tech: vibe-coding(바이브 코딩), loop-engineering(루프 엔지니어링), prompt-engineering(프롬프트 엔지니어링), ai-agent(AI 에이전트), context-window(컨텍스트 윈도우), rag(검색 증강 생성).
    - mz: god-saeng(갓생), eok-kka(억까), aljaldakkkalsen(알잘딱깔센), sbuljae(스불재), wannaes(완내스), king-batda(킹받다).
    - 예: loop-engineering — "AI 에이전트가 스스로 반복 루프를 돌며 작업을 계획·실행·검증하도록 설계·운영하는 기법." / en "Designing and operating AI agents so they iterate in autonomous loops to plan, act, and verify."
  </seed_terms>
  <generator_sketch>
    ```javascript
    // scripts/generate-glossary.mjs (요지) — 결정적, Date/random 미사용
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) terms/ 스캔, '_' 접두 제외, base 로 ko/en 쌍 그룹핑
    // 2) matter(file).data → zod TermFileFront.parse (실패 수집)
    // 3) mergePair(ko, en): 구조 메타 ko 정본, en 상속; resolveSlug
    // 4) 검증: 쌍 무결성 / 필수 필드 / slug 유일 / related 실재 → errors[]
    // 5) errors.length ? (콘솔 출력 + process.exit(1)) : writeFileSync(terms.generated.json, JSON.stringify(sorted, null, 2))
    ```
  </generator_sketch>
  <testing_strategy>순수 계층 Vitest ≥80%; 생성기 검증은 픽스처 폴더로 실패/성공 케이스; 컴포넌트는 카탈로그 목 주입; E2E 는 시나리오 1–5(특히 #1 폴더→목록, #3 언어 토글/related, #5 JSON-LD). 클립보드/ localStorage 는 jsdom 격리.</testing_strategy>
  <tool_usage>리더 시각 검증 게이트: 320/768/1024 스크린샷, 카드 오버플로 없음, 상세 바텀시트, JSON-LD 프리렌더 HTML 확인, 생성기 실패 케이스 실제 실행.</tool_usage>
</key_implementation_notes>

</project_specification>
```
