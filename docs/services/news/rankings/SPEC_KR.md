# 별별 랭킹 (Various Rankings) — 여러 분야의 큐레이션 Top N 목록 — 서비스 SPEC

> 이 문서는 정본(영문) [`SPEC.md`](SPEC.md)의 **국문 번역본**입니다. AI 코딩 에이전트가 소비하는 정본은 영문 `SPEC.md`이며, 둘 중 하나가 바뀌면 반드시 동기화하세요. 상충 시 영문 `SPEC.md`가 우선합니다.
>
> **별별 랭킹 / Various Rankings** 빌드 명세 (국문 표시명: **별별 랭킹**, 영문 표시명: *Various Rankings*) — 영화·책·음식점·여행·게임·음악·도구·앱 등 여러 분야에 걸쳐 에디터가 큐레이션한 "Top N" 순위 목록을 모아, 마크다운 파일로 관리하고 빌드 타임에 자동 컴파일하여 검색 가능한 **순위 표(table)** 인터페이스로 제공합니다. 콘텐츠는 마크다운 쌍(`<ranking>.md` + `<ranking>_en.md`)으로 관리되며, 빌드 타임에 생성기가 폴더를 읽어 검증하고 정적 카탈로그를 산출합니다. 도구는 클라이언트 SPA로 마운트되어 분야 탭·검색·즐겨찾기/최근본을 제공하고, 순위별 상세 뷰는 항목을 **표**(순위 + 메달 🥇🥈🥉, 이름, 설명, 링크, 이미지)로 렌더링하며 **출처·기준일 프로버넌스 배너를 크게 강조**합니다.
>
> 내부 서비스 코드네임: `rankings`. 레지스트리 id: `rankings`. 공개 URL slug: `/[locale]/tools/rankings`.
>
> 이 SPEC은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공합니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 동일 패턴 형제 도구 SPEC(참고): [`docs/services/text/new-word/SPEC.md`](../new-word/SPEC.md)

```xml
<project_specification>

<project_name>별별 랭킹 (Various Rankings) — 표로 렌더링되는 큐레이션 Top N 순위 목록 (Jurepi 도구, 코드네임 rankings, 레지스트리 id rankings)</project_name>

<overview>
별별 랭킹(Rankings)은 사용자가 관심 있는 여러 분야에서 에디터가 큐레이션한 신뢰할 수 있는 "Top N" 목록을 한곳에 모읍니다. 올해 최고의 영화, 도시별·요리별 맛집, 가장 많이 쓰는 개발 도구 등 무엇을 찾든, 방문자는 분야("음식점", "영화", "게임")를 검색해 그 분야의 순위 목록을 둘러보고, 하나를 열어 1~N위 항목을 **깔끔하고 훑어보기 쉬운 표**(메달이 붙은 순위 칸 + 이름 + 설명 + 링크/이미지)로 읽습니다. 외부 링크(Rotten Tomatoes, Michelin 가이드, YouTube)와 대표 이미지도 선택적으로 포함됩니다. 각 순위는 **에디터가 작성한 마크다운**이며 — 사용자 투표·AI 생성·실시간 갱신이 아닙니다 — 명시적인 "기준일"과 출처/프로버넌스 노트를 함께 담습니다. "정말로 최고의 X는 무엇인가?"를 해결합니다.

CRITICAL (신뢰 표면 — 최우선): 순위는 독자가 **누가, 언제 매긴 것인지**를 즉시 판단할 수 있어야만 유용합니다. 따라서 **출처 노트(`sourceNote`)와 기준일(`asOfDate`)이 가장 중요한 UI 요소**이며, 모든 상세 뷰 상단에 눈에 띄는 고대비 프로버넌스 배너로 렌더링해야 합니다(흐릿한 캡션 금지) — 아울러 모든 리스트 카드에도 압축된 출처+날짜 한 줄을 표시합니다. 두 필드는 스키마에서 `required`이며, 이를 결여한 순위는 빌드가 실패합니다. 강조 > 장식: 이 배너는 메달·이미지·링크보다 시각적 우선순위가 높습니다.

CRITICAL (표현 — 표 형태): 항목 목록은 느슨한 카드/행 스택이 아니라 **시맨틱 HTML `<table>`**(`<thead>` 컬럼 헤더, `<tbody>` 행, 접근성용 `<caption>`)로 렌더링합니다. 컬럼: 순위(상위 3위 메달 🥇🥈🥉), 선택적 썸네일, 이름, 설명, 링크. 표는 반응형(320px에서 가로 스크롤 또는 컬럼 축소, 절대 오버플로 없음)이며 키보드·스크린리더 완전 접근 가능해야 합니다.

도구의 콘텐츠 모델이 근본입니다: 순위는 코드가 아니라 **마크다운 파일**입니다. 콘텐츠 폴더에 쌍(국문 `<ranking>.md` + 영문 `<ranking>_en.md`)을 만들면, **빌드 타임**에 생성기가 폴더를 스캔하고 frontmatter를 파싱·검증한 뒤 정적 카탈로그(rankings.generated.json)로 굽습니다. 도구는 그 카탈로그를 동적 import하여 목록·검색·상세 뷰를 렌더링합니다. 즉 "폴더에 파일을 넣으면 나타난다"가 실제이며 — 백엔드·DB 없이 정적 생성으로 이뤄집니다.

CRITICAL (클라이언트 전용, SSG): 100% 클라이언트 사이드. 백엔드·DB·런타임 파일시스템 접근 없음. 순위 카탈로그는 마크다운을 소스로 빌드 타임에 정적 JSON으로 구워집니다. 유일한 1차 저장소는 `localStorage`(즐겨찾기 + 최근본)이며, 네트워크로 전송되는 것은 아무것도 없습니다. 사용자 투표 없음, 제출 없음, 실시간 갱신 없음.

CRITICAL (콘텐츠 모델, 불변식): 모든 순위는 국문 파일과 영문 파일을 짝으로 반드시 가져야 합니다. 각 파일은 비어 있지 않은 `title`, `field`, `asOfDate`, `items`(순위당 ≥3개)를 담습니다. 각 항목은 `rank`(숫자), `name`, `description`, `link`(선택, rel=noopener), `imageUrl`(선택, 명시적 크기)을 가집니다. 빌드 생성기는 쌍 무결성·필수 필드·로케일별 field 유일성을 검증하고, 한 규칙이라도 어기면 **빌드를 실패**시킵니다.

CRITICAL (SPA, 사용성 최우선): 모든 Jurepi 도구는 SSG 셸 위에 마운트되는 클라이언트 SPA입니다. 모든 상호작용 — 분야 전환, 검색, 순위 선택, 항목 열기 — 은 라우트 이동·전체 페이지 리로드 없이 로컬 React 상태로 이뤄집니다. 사용성이 먼저입니다: 목록이 즉시 보이고, 검색은 한 키("/") 거리에 있으며, 모든 순위에 1초 이내로 도달할 수 있습니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/rankings (SSG; 레지스트리 slug "rankings", id "rankings", status "live", accent "rose", category "news").
  - 플랫폼 제공(재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈을 감싸는 Error Boundary, lib/seo.ts 메타데이터 빌더, breadcrumb + in_content 광고 래퍼.
  - 소비: i18n 네임스페이스 `tools.rankings.*`(UI 크롬 문자열: 분야, 검색, how-to, FAQ, 메달 라벨, 링크 라벨 — 순위 콘텐츠 아님; 그것은 rankings.generated.json의 마크다운에서 옴), 도구 하단 in_content AdSlot.
  - 플랫폼 의존: 이 도구는 `'news'` 카테고리(뉴스)에 속하며 monthly-news 도구들과 함께 있습니다. NOTE: `'news'`는 7번째 카테고리로 `ToolCategory`/i18n/`FOOTER_CATEGORIES`/`CATEGORY_ORDER`/accent에 아직 미배선 — 활성화는 (monthly-news 도구와 공유되는) 일회성 플랫폼 선행 작업입니다. 도구는 `rose`를 자신의 도구별 정체성 액센트로 유지합니다(도구별 액센트 허용). 여기에 표준 `ToolMeta` 레지스트리 항목 1개, 도구 라우트의 slug→component 분기, `generateMetadata` 분기를 더합니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - `content/rankings/`의 마크다운 관리 순위 카탈로그(쌍: `<ranking>.md` + `<ranking>_en.md`).
    - 빌드 타임 생성기: 폴더 스캔 → frontmatter 파싱 → 검증 → 코드 스플릿 정적 카탈로그(rankings.generated.json). `prebuild`/`predev`에 배선.
    - 시드 4개 분야, 각 2~3개 순위(순위당 최소 8개 항목): **movies**(올해 최고 영화, 저평가 명작), **restaurants**(도시별 초밥, 원조별 피자), **travel**(필수 여행지, 숨은 명소), **games**(최고 인디게임, 클래식 보드게임). 분야 확장 가능.
    - **순위 마크다운 템플릿**: 주석이 달린 마크다운 템플릿(`content/rankings/_TEMPLATE.md`, `content/rankings/_TEMPLATE_en.md`)과 작성 README로 새 순위 추가를 쉽게.
    - 분야 탭: 카탈로그의 고유 field에서 파생(전체 / 영화 / 음식점 / 여행 / 게임 등). 가상 탭: 즐겨찾기(핀 시), 최근(조회 시).
    - 검색: 순위 제목·항목 이름·설명·분야명을 두 로케일에 걸쳐 실시간 필터(디바운스). 대소문자·발음부호 무시.
    - 상세 뷰: 순위 제목, 분야 배지, **크게 강조된 프로버넌스 배너(출처 노트 + 기준일 — 고대비, 아이콘, 뷰 최상단)**, 이어서 **항목 표**(`<table>`: 상위 3위 메달 🥇🥈🥉이 붙은 1~N위, 선택적 썸네일, 이름, 설명, 있으면 외부 링크, 명시적 크기 + lazy의 선택적 이미지).
    - 즐겨찾기(핀) + 최근 조회 — localStorage 지속, 알 수 없는 순위 ID 자동 정리.
    - 완전 키보드 지원: "/" 검색 포커스, 화살표로 항목/순위 이동, Enter로 열기, Esc로 초기화/닫기.
    - 도구별 SEO 롱폼(순위 소개, "최고의 음식점/게임/영화는?") + FAQ + **ItemList / ListItem JSON-LD**(순위형 schema.org 타입 — GEO/AI 답변 인용에 이상적), ko/en 현지화.
    - reduced-motion 폴백; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - 앱 셸, 헤더/푸터, 로케일 스위처, 테마 토글, 동의 배너, 광고 로딩, sitemap/robots, 도구 레지스트리 메커니즘(모두 플랫폼).
    - 브라우저 기반 순위 추가/편집 UI(런타임 CMS). 편집은 저장소 마크다운 파일로만 — 백엔드/DB 없음. 출시 시 인앱 편집 없음.
    - 로그인 / 계정 / 기기 간 동기화.
    - 사용자 투표·평점·순위 제출(크라우드소싱 / 소셜 기능 없음).
    - 실시간 순위 갱신. 콘텐츠는 정적이며 git으로 작성·리뷰·버전 관리.
    - 순위별 딥링크 URL(예: /tools/rankings/best-pizza) — MVP는 단일 라우트 + 클라이언트 상태. (Phase 2 후보.)
    - 마크다운 본문의 리치 HTML/스크립트. 설명은 구조화 필드(플레인 텍스트 / 제한적 인라인 강조)로 안전하게 렌더링.
  </out_of_scope>
  <future_considerations>
    - 순위별 정적 딥링크 라우트 + 개별 ListItem 페이지(SEO) — Phase 2.
    - 분야 확장: 스포츠, 음악, 책, 스타트업, 팟캐스트 등(카탈로그만, 스키마 불변) — .
    - 오늘의 순위 랜덤 카드 / 공유 이미지 — Phase 3.
    - 항목에 대한 에디터 코멘트/주석 — Phase 3.
    - 사용자 제안 폼 → 저장소 issue/PR 링크 — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼 상속.</inherited>
  <module_specific>
    <content_source>순위는 `content/rankings/`의 마크다운 쌍으로 존재. 파일시스템 접근은 빌드 타임만(생성기 스크립트). 런타임은 파일시스템 접근 없음.</content_source>
    <frontmatter_parsing>gray-matter v4.x로 YAML frontmatter 파싱(생성기 스크립트 전용, devDependency). 설명/링크는 구조화 frontmatter 필드로 플레인 텍스트 렌더링.</frontmatter_parsing>
    <validation>zod v3.x(이미 사용 중)로 (1) 개별 파일 frontmatter 스키마 (2) 병합된 순위 레코드 불변식. 스키마는 순수하며 생성기·런타임 로더 양쪽에서 재사용.</validation>
    <catalog>생성 산출물은 코드 스플릿 데이터 모듈(src/components/tools/rankings/data/rankings.generated.json)로, 이 도구 라우트에서만 동적 import되어 순위 콘텐츠가 전역 i18n 메시지 번들에 절대 들어가지 않음(플랫폼 JS 예산 보호 — new-word/qna-a-day와 동일 패턴).</catalog>
    <animation>네이티브 CSS 트랜지션만(카드 hover lift, 항목 행 포커스, 상세 fade-in). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, 생성기 스크립트의 frontmatter 파싱.</gray-matter>
    <zod>zod v3.x — 저장소에 이미 존재; frontmatter/카탈로그 검증에 재사용.</zod>
  </libraries>
</technology_stack>

<file_structure>
scripts/
└── generate-rankings.mjs                 # 빌드 타임: content/rankings/* 스캔 → 파싱 → 검증 → rankings.generated.json 산출. prebuild/predev에 배선.
content/rankings/                          # 사람이 작성하는 콘텐츠(저장소)
├── _TEMPLATE.md  _TEMPLATE_en.md          # 템플릿(생성기 제외)
├── README.md                              # 작성 가이드(분야 목록, 항목 형식, 기준일 규칙)
└── rankings/*.md  *_en.md                 # 순위 쌍
src/
├── lib/rankings/                          # 순수 도메인 계층 — React/Next 없음, 완전 단위 테스트
│   ├── schema.ts                          # zod: RankingFileFront(ko/en), MergedRanking, StoreSchema + STORE_VERSION
│   ├── merge.ts                           # mergePair(koFront, enFront): canonical 규칙 적용 → MergedRanking; validatePair
│   ├── slug.ts                            # slugify(title), resolveSlug(front, filename)
│   ├── catalog.ts                         # 타입 접근: allRankings, byId, byField, fields(); field enum
│   ├── search.ts                          # filterRankings(rankings, query, locale): 제목+분야+항목, 두 로케일; normalize
│   └── favorites.ts                       # 불변 연산: toggleFavorite, pushRecent(max), pruneUnknown(ids, catalog)
├── components/tools/rankings/
│   ├── Rankings.tsx                       # 오케스트레이터(Client Component) — field/query/selectedId 상태 + useRankingsCatalog() 소유
│   ├── useRankingsCatalog.ts              # 훅: 동적 카탈로그 import + localStorage 즐겨찾기/최근본 + 파생 필터/선택
│   ├── FieldTabs.tsx                      # 전체 / 영화 / 음식점 / 여행 / 게임 / (즐겨찾기) / (최근) 필
│   ├── RankingSearch.tsx                  # 검색 입력("/" 포커스, clear, 결과 개수, aria)
│   ├── RankingsList.tsx                   # 반응형 카드 목록; roving tabindex 키보드 탐색
│   ├── RankingCard.tsx                    # 순위 1개 카드: 제목, 분야 배지, 항목 수, 별 + 압축 출처+날짜 한 줄(상시 표시)
│   ├── RankingDetail.tsx                  # 선택된 순위: 제목, 분야, ProvenanceBanner, 이어서 RankingTable
│   ├── ProvenanceBanner.tsx               # CRITICAL — 고대비 출처 노트 + 기준일 콜아웃(아이콘 + 강조); 상세 최상단
│   ├── RankingTable.tsx                   # 시맨틱 <table>: thead(순위/이름/설명/링크 컬럼) + tbody 행 + caption; 반응형 + a11y
│   ├── RankingRow.tsx                     # <tr> 1개: 순위 칸(+ 상위 3위 메달), 선택적 썸네일, 이름, 설명, 선택적 링크
│   ├── RankingsIntro.tsx                  # H1 + 리드(SEO; 가능한 한 서버 렌더)
│   ├── RankingsHowTo.tsx                  # "순위란?" / "큐레이션 Top 목록"(SEO 롱폼)
│   ├── RankingsFaq.tsx                    # Q&A + FAQPage + ItemList JSON-LD
│   └── data/
│       └── rankings.generated.json        # 생성 산출물 — [MergedRanking...]
└── i18n/messages/{ko,en}.json             # tools.rankings.* UI 크롬(탭, 검색, 분야 라벨, 토스트, how-to, FAQ, 메달 라벨, 표 컬럼 헤더[순위/이름/설명/링크], 프로버넌스 라벨[출처/기준일])
</file_structure>

<core_data_entities>
  <ranking_file_front note="개별 마크다운 파일 frontmatter(파싱 단위)">
    - title: string (필수, 비어있지 않음) — 순위 제목(해당 로케일)
    - slug?: string — ASCII 안정 식별자(국문 파일이 canonical; 없으면 파일명에서 파생)
    - field: enum (movies, restaurants, travel, games, music, books, apps, startups, sports) — 국문 파일 canonical; Phase 2 확장 가능
    - asOfDate: string ISO 날짜 (필수) — 발행일 "2025-12", "2025-01-15" 등
    - sourceNote: string (필수, 최대 200자) — 출처, 로케일별(KO 파일=한글 노트, EN 파일=영문 노트; EN 없으면 KO 상속): "Editor's personal picks, Jan 2025" / "Based on Michelin Guide 2024" 등
    - sourceUrl?: string (선택, 유효 http(s) URL) — 클릭 가능한 출처 링크(KO canonical; rel=noopener target=_blank), 프로버넌스 배너에 렌더링.
    - items: array (필수, ≥3)
      - rank: number (1–N)
      - name: string (필수)
      - description: string (필수, 플레인 텍스트, ≤200자)
      - link?: string (외부 URL, rel=noopener target=_blank)
      - imageUrl?: string (외부 또는 로컬 에셋 경로)
      - imageWidth?: number (px, imageUrl 설정 시 필수)
      - imageHeight?: number (px, imageUrl 설정 시 필수)
    INVARIANT: title/field/asOfDate/sourceNote/items 비어있지 않음, items ≥3. zod 파싱 실패 → 에러로 수집(빌드 실패 후보).
  </ranking_file_front>
  <merged_ranking note="ko+en 병합 결과; 카탈로그 레코드; rankings.generated.json 항목">
    - slug: string — 유일 식별자(field+locale별 유일; 즐겨찾기/최근본 참조)
    - field: enum — 국문 파일 canonical
    - asOfDate: string ISO
    - sourceUrl?: string — 선택적 클릭 가능한 출처 링크(canonical; rel=noopener). 있으면 프로버넌스 배너에 링크로 렌더.
    - ko: { title, sourceNote, items: [{ rank, name, description, link?, imageUrl?, imageWidth?, imageHeight? }, ...] }
    - en: { title, sourceNote, items: [...] } — title/sourceNote/items는 로케일별(앱의 나머지 콘텐츠처럼 지역화); EN이 sourceNote 생략 시 KO 상속. items가 다를 수 있음(예: "Best Pizza Worldwide" vs "Best Pizza in Tokyo").
    INVARIANT — 쌍/필드/유일성: 모든 레코드는 ko+en 둘 다 보유; 각각 title + ≥3 항목; slug는 field 내 유일; rank 1–N 연속. 위반 → 생성기 빌드 실패.
  </merged_ranking>
  <field note="분야별 그룹핑; i18n에서 현지화 라벨">
    - id: enum (movies, restaurants, travel, games, music, books, apps, startups, sports). 표시 순서: FIELD_ORDER 기준. 라벨: tools.rankings.fields.<id>.
    - 가상 탭(실제 field 아님): "all"(모든 순위), "favorites"(핀), "recent"(MRU).
  </field>
  <rankings_store note="단일 localStorage blob">
    - version: number (STORE_VERSION, 1부터 시작)
    - favorites: string[] — 순위 slug, 삽입 순서
    - recents: string[] — 순위 slug, 최근순, RECENTS_MAX = 20, 중복 제거
    - meta: { lastField?: string; createdAt: number }
    localStorage 키: `jurepi-rankings`
    INVARIANT: 읽기는 zod 파싱; 실패 → 새로 시작(throw 없음). 로드 시 알 수 없는 id 정리.
  </rankings_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; FIELD_ORDER = ['all', 'movies', 'restaurants', 'travel', 'games', 'music', 'books', 'apps', 'startups', 'sports']; MEDAL_EMOJI = ['🥇', '🥈', '🥉'].
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/rankings" page="Rankings (플랫폼 도구 라우트가 slug→component 분기)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams가 레지스트리(status "live")를 순회해 SSG. 순위별 딥링크 라우트는 범위 밖(Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <rankings>                      <!-- "use client"; field + query + selectedId + useRankingsCatalog() 상태 소유 -->
    <rankings_intro />            <!-- H1 + 리드(가능한 한 서버 렌더) -->
    <rankings_layout>             <!-- 선택기(목록) 상단, 선택 시 전체폭 상세 하단 — 데스크톱·모바일 동일 -->
      <rankings_main>             <!-- 좌/상단 컬럼 -->
        <ranking_search />        <!-- "/" 포커스, clear, 결과 개수 -->
        <field_tabs />            <!-- 전체 / 영화 / 음식점 / … / 즐겨찾기 / 최근 -->
        <rankings_list>           <!-- Roving tabindex 카드 -->
          <ranking_card />        <!-- × N: 클릭 = 선택; 별 = 즐겨찾기 -->
          <empty_state />         <!-- 결과 없음 / 즐겨찾기 없음 -->
        </rankings_list>
      </rankings_main>
      <ranking_detail>            <!-- 목록 아래 전체폭 패널; 순위 선택 시에만 표시 -->
        <provenance_banner />     <!-- CRITICAL: 강조된 출처 노트 + 기준일(상단, 고대비) -->
        <ranking_table>           <!-- 시맨틱 <table>; thead + caption -->
          <ranking_row />         <!-- × N <tr>: 순위(메달), 썸네일?, 이름, 설명, 링크? -->
        </ranking_table>
      </ranking_detail>
    </rankings_layout>
    <rankings_how_to />           <!-- SEO 롱폼 -->
    <rankings_faq />              <!-- FAQPage + ItemList JSON-LD -->
  </rankings>
  <note>도구 내 SPA: 분야/검색/선택 = 로컬 상태 전환, 라우트 이동 아님. 상세는 선택기 아래에 렌더되는 전체폭 패널(데스크톱·모바일 동일 컴포넌트) — 사이드바나 바텀시트 아님.</note>
</component_hierarchy>

<pages_and_interfaces>
  <rankings_intro>
    - Eyebrow: "순위 도구" / "RANKINGS TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "별별 랭킹" / "Various Rankings" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - 리드: 1~2문장, body-lg: "영화·음식·여행·게임 등 다양한 분야의 신뢰할 수 있는 순위 목록을 찾아보세요." / 영문 대응.
  </rankings_intro>

  <ranking_search>
    - DESIGN 텍스트 입력 스타일, 메인 컬럼 전체 너비, 선행 Search 아이콘(20px), 플레이스홀더 "순위·영화·레스토랑으로 검색…" / "Search rankings…".
    - "/" 키 입력 시 포커스. 비어있지 않으면 후행 clear(×).
    - 라이브 필터, 120ms 디바운스. 결과 개수 "결과 N개" 캡션.
    - aria: role="searchbox", aria-controls로 목록 연결.
  </ranking_search>

  <field_tabs>
    - 가로 필 행. 순서: "전체"(all) → FIELD_ORDER 순 field(들) → "즐겨찾기"(favorites, 핀 시) → "최근"(recent, 조회 시).
    - 활성 = 브랜드 허니골드 채움 / on-brand 텍스트; 비활성 = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right 이동; 활성에 aria-selected.
  </field_tabs>

  <rankings_list>
    - 반응형 그리드: <768px 1컬럼; ≥768px 2컬럼. 전체 컨테이너 폭 사용(상세는 옆이 아니라 아래에 위치).
    - 각 카드: 제목(headline 18–20px var(--text)/700), 분야 배지(rose 틴트 필), 항목 수("N개 항목"), 별(즐겨찾기 토글), 그리고 압축 출처+날짜 한 줄(상시 표시, hover에서 숨기지 않음): Calendar 아이콘 + 기준일과 잘린 출처 노트 — 예 "📅 2024-12 · 출처: Michelin Guide 2024". 카드의 신뢰 단서이므로 읽히게 유지(var(--text-secondary), 거의 안 보이는 muted 금지).
    - 카드: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, shadow --shadow-card.
    - 상태: hover translateY(-2px) + --shadow-card-hover; focus 2px var(--focus-ring); 선택 2px var(--accent-rose) ring.
    - Roving tabindex; ArrowUp/Down 이동; Enter/Space 상세 열기; "f" 즐겨찾기 토글.
    - empty_state: "'{query}'에 해당하는 순위가 없어요" / "No rankings found"; 또는 "별을 눌러 즐겨찾기를 저장하세요".
  </rankings_list>

  <ranking_detail>
    - 배치: 선택기(검색 + 탭 + 카드 목록) 아래에 렌더되는 **전체폭 패널**, 순위 선택 시에만 표시. 근거: 순위는 넓고 긴 표(10행 이상 × 순위/이름/설명)라 좁은 sticky 사이드바에 넣으면 설명 열이 글자 단위로 줄바꿈되고 화면 절반이 빈다 — 전체폭이라야 표가 숨쉰다. 데스크톱·모바일 동일(단일 컬럼 스택). (폐기된 설계: 이전 360px sticky 우측 사이드바 — 재도입 금지.)
    - 패널 표면: var(--surface), radius var(--radius-xxl), padding 24px(모바일 16px), 1px var(--hairline), shadow --shadow-card.
    - 선택 해제: X 버튼(lg:hidden — 모바일)으로 선택 해제; Esc로도 해제.
    - 콘텐츠(위 → 아래):
      1. 제목: 큰 headline 28px var(--text) + 분야 배지.
      2. 프로버넌스 배너 — CRITICAL, 제목 다음으로 가장 눈에 띄는 요소. 뚜렷한 rose 틴트 콜아웃 표면(var(--accent-rose-soft) bg, 1px var(--accent-rose) 또는 hairline, radius --radius-lg, padding 12–16px), 흐릿한 캡션 금지:
         - 기준일: Calendar 아이콘(16–18px) + 라벨 "기준일" / "As of" + 값("2024-12" / "January 2025") — 값은 var(--text)/600 고대비.
         - 출처 노트: BookMarked/Info 아이콘 + 라벨 "출처" / "Source" + `sourceNote` 값 var(--text)/500(예: "Editor's picks, Jan 2025" / "Based on Michelin Guide 2024").
         - 두 줄 모두 한눈에 읽힘; 배너는 aria-label 그룹핑("출처 및 기준일"). 대비는 WCAG AA 충족. 이 배너가 신뢰 앵커 — 표에 시각적으로 종속되어선 안 됨.
      3. 항목 표(시맨틱 `<table>`, 순위순 정렬):
         - `<caption class="sr-only">` = "{순위 제목} — {N}개 항목 순위표"(스크린리더용).
         - `<thead>`: 컬럼 헤더(scope="col") — 순위/Rank, (썸네일/·), 이름/Name, 설명/Description, 링크/Link. 헤더 행 var(--surface-muted).
         - `<tbody>` 행(`<tr>`), var(--surface-muted)로 zebra/hover:
           · 순위 칸: 메달 이모지(상위 3위 🥇🥈🥉, 나머지 "4."), 상위 3위 rose 액센트 텍스트, tabular-nums.
           · 썸네일 칸(imageUrl 있으면): 작은 고정 크기 img(명시적 width/height, lazy, 둥근 모서리).
           · 이름 칸: bold 15–16px var(--text).
           · 설명 칸: 14px var(--text-secondary), 플레인 텍스트.
           · 링크 칸(있으면): 작은 rose 틴트 "View on Rotten Tomatoes" + 외부 아이콘(rel=noopener target=_blank).
         - 반응형: ≥768px 전체 표; <768px 가로 스크롤 래퍼(overflow-x:auto, 포커스 가능 region role="region" aria-label) 또는 스택 행 폴백 — 320px에서 절대 오버플로 없음.
    - 빈/초기(미선택): 힌트 "순위를 선택하면 순위표가 여기에 표시됩니다."
  </ranking_detail>

  <keyboard_shortcuts_reference>
    - "/" → 검색 입력 포커스(타이핑 중 아닐 때).
    - 화살표 → 순위 카드/항목 포커스 이동.
    - Enter / Space → 포커스된 순위 상세 열기.
    - "f"(카드 포커스 시) → 즐겨찾기 토글(aria-pressed 반전 + 토스트).
    - Esc → 검색 초기화 또는 열린 순위 상세 선택 해제.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="빌드 타임, scripts/generate-rankings.mjs">
    - content/rankings/ 스캔, `_` 접두 제외. 기본 파일명으로 ko/en 쌍 그룹핑.
    - 각 파일 gray-matter 파싱 → zod RankingFileFront 검증.
    - mergePair: canonical 규칙 적용(ko field/asOfDate/sourceUrl canonical + 없으면 en 상속; sourceNote/title/items는 로케일별 — EN sourceNote 없으면 KO 상속, 있으면 독립). resolveSlug.
    - 검증(실패 → file/field/reason과 함께 process.exit(1)): 쌍 무결성, 로케일 필수 필드, field별 slug 유일성, 항목 수 ≥3, 연속 rank.
    - 정렬(field 순서 → asOfDate 내림차순 → title 로케일 순서), rankings.generated.json 산출. 결정적.
    - package.json 배선: "predev": "node scripts/generate-rankings.mjs", "prebuild": "node scripts/generate-rankings.mjs".
  </generation>
  <catalog_access note="런타임 순수 계층">
    - allRankings(): MergedRanking[](생성 순서). byId(slug), byField(field). fields(): 카탈로그의 라이브 field id.
    - 테스트로 카탈로그 유일성·field 유효성·로케일 완전성 단언.
  </catalog_access>
  <search>
    - filterRankings(rankings, query, locale): 빈 쿼리 → 그대로. 아니면 normalize(trim, NFC, 소문자, 발음부호 제거). 다음 중 하나라도 매치: ko.title, en.title, ko.field, en.field, ko.items[].name, en.items[].name. 안정 순서.
    - 분야 탭과 조합: list = filterRankings(활성 field 부분집합, query). 즐겨찾기/최근 탭은 자기 부분집합을 필터.
  </search>
  <favorites_and_recents note="불변 — 새 배열/store 반환">
    - toggleFavorite(list, slug): 없으면 추가, 있으면 제거(순서 보존).
    - pushRecent(list, slug, max=20): 앞으로 이동/삽입, 중복 제거, 절단.
    - pruneUnknown(ids, catalog): 현재 카탈로그에 없는 id 제거(로드 시 실행).
    - Recent push: 상세 열림(선택) 시. 검색/hover는 트리거 안 함.
  </favorites_and_recents>
  <persistence_adapter useRankingsCatalog>
    - 마운트: 동적 카탈로그 import; `jurepi-rankings` 읽기 → zod → pruneUnknown → 상태; 실패 → 새로 시작(throw 없음). localStorage 부재 → 세션 동안 인메모리(완전 사용 가능, 비지속).
    - 변경: 디바운스 JSON.stringify → setItem; quota/security 예외 → 인메모리 유지.
    - 노출: 필터된 목록, selectedId + select(id), toggleFavorite, favorites, recents, lastField, copy(text).
  </persistence_adapter>
  <i18n>모든 UI 크롬은 tools.rankings.*(ko/en)에서: 탭, 분야 라벨, 검색, 토스트, 빈 상태, how-to, FAQ, 메달 라벨. 순위 제목/항목은 마크다운(rankings.generated.json)에서 오며 i18n 메시지 아님.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: 잘못된 콘텐츠가 조용히 통과하지 않음. 생성기는 각 위반(파일 경로 + 필드 + 사유)을 stderr로 보고하고 non-zero 종료 → CI/빌드 실패. 고아 파일은 경고; 최소 1건 위반이 strict 실패를 유발.
  </build_time>
  <search_no_results>쿼리를 되비추는 친절한 빈 상태 + "검색 지우기" 버튼; 상세는 마지막 선택 유지 또는 빈 힌트.</search_no_results>
  <storage>
    <unavailable>프라이빗 모드/비활성 → 최근본/즐겨찾기 인메모리, 무서운 에러 없음. 목록/검색/상세 완전 동작.</unavailable>
    <corrupt_blob>JSON/zod 실패 → 새로 시작(즐겨찾기/최근본은 귀중하지 않음, throw 없음).</corrupt_blob>
  </storage>
  <error_boundary>플랫폼이 도구를 감쌈; 렌더 실패 → 셸 크래시 없이 재시도.</error_boundary>
  <note>1차 네트워크 호출 없음; API 에러 표면 없음.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md가 모든 토큰의 단일 소스. 아래는 도구별 적용.</source>
  <accent_usage>
    - 도구별 정체성 액센트는 ROSE(var(--accent-rose) / var(--accent-rose-soft)). Intro 아이콘 타일, 카드 선택 바, 상위 3위 메달 텍스트, 즐겨찾기 별(채움), 그리고 프로버넌스 배너 배경/테두리. (카테고리는 `news`; 이 도구는 rose를 자신의 도구별 정체성 액센트로 사용.)
    - CTA(주요 버튼)는 브랜드 허니골드 var(--brand) 유지.
    - 분야 배지 색: 순위 분야별 rose 틴트 필.
  </accent_usage>
  <provenance_banner note="CRITICAL — 신뢰 앵커; 출처 노트 + 기준일은 반드시 강조, 절대 muted 금지">
    - 표면: var(--accent-rose-soft) 배경, 1px var(--accent-rose)/hairline 테두리, radius --radius-lg, padding 12–16px, 상세 제목 바로 아래.
    - 아이콘: Calendar(기준일), BookMarked/Info(출처). 라벨("기준일"/"출처")은 eyebrow 굵기; 값은 var(--text) 600 고대비(핵심 — 독자가 누가·언제 매겼는지 즉시 파악해야 함).
    - 대비: rose-soft 대비 WCAG AA; 제목 다음으로(표보다 위) 두 번째로 두드러진 요소여야 함.
  </provenance_banner>
  <surfaces>카드/상세 = var(--surface) + 1px var(--hairline); 상세 radius --radius-xxl; 항목 행은 hover 시 var(--surface-muted) 칩. 부드러운 브랜드 틴트 그림자.</surfaces>
  <typography>H1 Gmarket Sans(clamp 28–40px); 순위 제목(카드 18–20px / 상세 28px)/700; 항목 이름 16px/bold; 설명/노트 caption/eyebrow. 상위 3위 메달 이모지.</typography>
  <motion>transform/opacity만: 카드 hover translateY(-2px) 150ms, 선택 시 상세 fade-in 150ms. 모두 prefers-reduced-motion으로 게이팅.</motion>
  <accessibility>카드/별/링크 = 라벨된 실제 버튼; roving-tabindex 목록; copy/favorite 상태 aria-live="polite"; ≥44px 탭 타깃; 보이는 focus-visible ring var(--focus-ring); 링크 rel=noopener; 이미지 lazy+명시적 크기. 표: 실제 `<table>`/`<thead>`/`<tbody>`/`<th scope="col">` + sr-only `<caption>`; 가로 스크롤 래퍼는 aria-label 있는 포커스 가능 role="region"; 프로버넌스 배너는 aria-label("출처 및 기준일")로 그룹핑. `<div>` 그리드로 표 흉내 금지.</accessibility>
  <responsive>
    - 모든 브레이크포인트: 단일 컬럼 — 선택기(검색 + 탭 + 카드 그리드) 상단, 선택 시 전체폭 상세 섹션 하단. 카드 그리드: <768px 1컬럼, ≥768px 2컬럼.
    - 상세의 `<table>`이 반응형 단위: ≥768px 전체 표; <768px 가로 스크롤 래퍼(overflow-x:auto, 포커스 가능 region). 320px에서 페이지 오버플로 없음.
  </responsive>
  <atmosphere>밝고 신뢰감 있는 "큐레이션 순위": 넉넉한 카드 간격, 메달 이모지, 명확한 기준일. 브라우즈 계층은 발견 가능하고 탭 가능한 카드(빽빽한 목록 아님); 상세 계층은 강조된 출처+날짜 배너에 앵커된 깔끔하고 훑어보기 쉬운 표로 항목을 렌더링. 신뢰 우선, 에디토리얼, 스프레드시트가 아님.</atmosphere>
  <icons>lucide-react: Search, Star/StarOff(즐겨찾기), ExternalLink(링크), Trophy(도구 카드 아이콘), Calendar(기준일), BookMarked/Info(출처 노트). 기본 20px(프로버넌스 배너 내부 16–18px), stroke 1.75, currentColor. 레지스트리 카드 아이콘: `Trophy`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="콘텐츠는 1차 마크다운이지만 방어적으로">
    - 제목/설명/sourceNote는 텍스트 노드로 렌더(React 이스케이프). dangerouslySetInnerHTML 금지.
    - 링크는 `<a href={link} rel="noopener target="_blank" />`(외부, 안전)로 렌더.
    - 이미지: 명시적 width/height, lazy 로드, src에 <script> 없음.
    - 생성기가 zod로 frontmatter 검증(타입/필수/길이).
  </input>
  <privacy>즐겨찾기/최근본은 localStorage 전용, 절대 전송 안 함. 분석 이벤트에 순위 데이터 미포함.</privacy>
  <content_integrity>카탈로그는 빌드 타임 정적 에셋(원격 fetch 없음); 단위 테스트로 파생·유일성·로케일 완전성 검증.</content_integrity>
  <note>비밀값 없음, 네트워크 없음, 3rd-party 저장소 없음.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>별 핀 + 최근 조회(localStorage) — 반복 검색 마찰 감소. 알 수 없는 id 자동 정리.</favorites_recents>
  <keyboard_first>"/" 검색, 화살표 탐색, Enter 열기, "f" 즐겨찾기 — 마우스 없는 파워 유저.</keyboard_first>
  <structured_data>ItemList + 각 항목 ListItem JSON-LD(position, name, description, url) — 검색엔진이 순위를 인식(발견성 = DESIGN 원칙 ③).</structured_data>
  <external_links>링크는 보안상 rel=noopener 표시; 신뢰 출처(IMDb, Michelin, Rotten Tomatoes, TripAdvisor 등)는 마크다운에 인코딩.</external_links>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>마크다운 폴더 → 목록 자동 구성</description>
    <steps>
      1. content/rankings/에 best-sushi.md + best-sushi_en.md 존재, field: restaurants, ≥3 항목.
      2. pnpm dev → predev 생성기 실행 → rankings.generated.json에 병합 레코드(ko/en 제목, 항목).
      3. /ko/tools/rankings 방문 → 목록에 "최고의 초밥" 카드(restaurant 분야 배지) 렌더.
      4. 새 쌍 top-movies-2025(.md/_en.md) 추가, 재빌드 → 목록 자동 갱신(코드 편집 없음).
      5. 쌍 누락 또는 항목 <3 → 생성기가 파일 경로/사유 보고, non-zero 종료(빌드 실패).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>검색, 분야 필터, 빈 상태</description>
    <steps>
      1. 검색에 "영화" 입력 → 영화 순위로 좁혀짐; 결과 개수 갱신; aria-live 안내.
      2. 지우고 "음식점"(restaurants) 분야 클릭 → 음식점 순위만.
      3. "asdfqwer" 입력 → 빈 "'asdfqwer'에 해당하는" + 지우기; 지우면 복원.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>상세 — 강조된 프로버넌스 배너 + 항목 표(메달, 링크, 이미지)</description>
    <steps>
      1. "최고의 초밥" 카드 클릭 → 상세 열림: 제목 + 분야 배지, 이어서 프로버넌스 배너가 "기준일 2024-12"와 "출처: Based on Michelin Guide 2024"를 크게 표시(rose-soft 콜아웃, 고대비 — 흐릿한 캡션 아님). 배너가 표보다 시각적으로 위/앞인지 확인.
      2. 그 아래 시맨틱 `<table>`이 `<thead>` 컬럼 헤더(순위/이름/설명/링크)와 행으로 렌더: 🥇 Jiro Ono, 🥈 Mizutani, 🥉 Saito, "4." Sukiyabashi Jiro. 각 행에 설명 칸.
      3. 1행에 IMDb 링크 칸(텍스트 "View on IMDb", rel=noopener, 새 탭) + 썸네일(lazy, 명시적 크기).
      4. 320px에서 표가 페이지 오버플로 없이 가로 스크롤(포커스 가능 region); 스크롤 시 이미지 로드; 링크 새 탭.
      5. 스크린리더가 caption + 컬럼 헤더 안내; 프로버넌스 배너가 라벨된 그룹으로 안내됨.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>즐겨찾기, 최근, 지속성, 키보드, a11y</description>
    <steps>
      1. 서로 다른 순위 2개 열기 → "최근" 탭에 MRU로 나열.
      2. 카드에 별 → "즐겨찾기" 탭에 표시; 별 채워짐(aria-pressed=true).
      3. 리로드 → 즐겨찾기/최근본 지속(localStorage); 알 수 없는 id 정리.
      4. "/" → 검색 포커스; 화살표로 카드 탐색; Enter로 상세 열기; axe 통과 → 위반 없음.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO(JSON-LD), 로케일 전환</description>
    <steps>
      1. /en 전환 → 크롬(탭/검색/how-to) 영어; 카드 제목 영어.
      2. 프로덕션 빌드 → /ko/tools/rankings와 /en/tools/rankings가 고유 title/canonical/hreflang.
      3. HTML에 SoftwareApplication + FAQPage + ItemList JSON-LD(각 순위의 항목을 ListItem으로); 순위 데이터셋은 코드 스플릿 청크(전역 i18n 아님).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: 콘텐츠 폴더에 `<ranking>.md` + `<ranking>_en.md` 쌍을 넣고 재빌드하면 코드 변경 0으로 목록/검색/상세에 자동 반영; 생성기가 쌍/필드/항목/유일성 검증, 위반 시 명확한 메시지로 빌드 실패.</content_model>
  <functionality>검색·분야 필터 가능한 카드 목록(두 로케일); 상세는 항목을 시맨틱 `<table>`로 렌더(메달, 링크, 이미지); localStorage 즐겨찾기 + 최근; 시드 4개+ 분야 × 2개+ 순위(순위당 8개+ 항목).</functionality>
  <trust_surface>CRITICAL: 모든 상세 뷰는 출처 노트 + 기준일을 보이는 강조 고대비 프로버넌스 배너로 시작(흐릿한 캡션 아님); 모든 리스트 카드는 압축 출처+날짜 한 줄 표시. 두 필드는 스키마 필수 — 없으면 빌드 실패.</trust_surface>
  <user_experience>검색/필터 즉시; 카드 가독; ≥44px 타깃; 보이는 포커스; 320px에서 표 오버플로 없음; SPA — 어떤 상호작용에서도 라우트 리로드 없음.</user_experience>
  <technical_quality>lib/rankings/* 순수 ≥80% 단위 커버리지(schema/merge/slug/search/favorites); 생성기 검증 테스트(pair-missing, dupe-slug, <3-items, bad-links → 실패); TS 0 에러; 파일당 <800줄; 카탈로그 코드 스플릿, i18n 번들 비대화 없음.</technical_quality>
  <visual_design>DESIGN.md 준수; rose 정체성 + 브랜드 허니골드 CTA; 상위 3위 메달 이모지; 강조된 rose-soft 프로버넌스 배너; 깔끔한 에디토리얼 표(스타일된 헤더, zebra/hover, tabular-nums — 의도적, 날것 스프레드시트 아님); 텍스트 노드 렌더만.</visual_design>
  <accessibility>완전 키보드(roving 목록, "/", Enter, "f", Esc); aria-live 상태; 라벨된 버튼; 모션 존중; WCAG 2.1 AA.</accessibility>
  <performance>도구 라우트 플랫폼 예산 내; 카탈로그 동적 import; CLS 영향 없음; LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>플랫폼 일부로 빌드(pnpm build). `prebuild` 훅이 generate-rankings.mjs를 실행해 rankings.generated.json을 갱신. /[locale]/tools/rankings는 플랫폼 generateStaticParams가 레지스트리(status "live")를 순회해 사전 렌더.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — 항목 1개 추가. 'news' 카테고리를 ToolCategory(7번째)에 추가해야 함; 'rose'는 이 도구의 도구별 accent.
    {
      id: 'rankings',
      slug: 'rankings',
      category: 'news',
      icon: 'Trophy',
      accent: 'rose',
      status: 'live',
      isNew: true,
      order: 15,
      keywords: ['별별랭킹','별별','랭킹','순위','영화','음식','여행','게임','음악','책','앱','추천','best','top','rankings','curator','ratings'],
    },
    ```
    도구 라우트에 slug→component 분기(<Rankings/>)와 generateMetadata 분기도 추가. 새 카테고리 라벨 필요 없음.
  </platform_registry_change>
  <critical_paths>
    1. 콘텐츠 파이프라인: 마크다운 스캔 → gray-matter → zod → mergePair → 검증 → rankings.generated.json. 도구 전체가 이에 의존.
    2. 쌍/canonical 병합 규칙(ko field/asOfDate/sourceNote canonical, en 상속) + slug 유일성 + field enum 검증.
    3. 검색(두 로케일, 발음부호/대소문자 무시) + 분야 조합 + 항목 렌더(메달, 링크, 이미지).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/rankings/{schema,slug,merge,search,favorites}.ts Vitest(RED→GREEN).
    2. scripts/generate-rankings.mjs + content/rankings/{_TEMPLATE,_TEMPLATE_en,README} + 시드(best-sushi, top-movies, famous-travel, indie-games). 검증 테스트(pair-missing, <3-items, dupe-slug → 실패). predev/prebuild 배선.
    3. tools.rankings.* 메시지(ko/en): 분야 라벨, 탭, 검색, 토스트, 빈 상태, how-to, FAQ, 메달 라벨.
    4. useRankingsCatalog 훅(동적 import + localStorage + 인메모리 폴백).
    5. RankingSearch + FieldTabs + RankingsList/RankingCard(roving tabindex, 상태) + 빈 상태.
    6. RankingDetail: ProvenanceBanner(강조된 출처 노트 + 기준일 — 신뢰 앵커로 먼저 빌드/검증) → RankingTable/RankingRow(시맨틱 표, 메달/링크/썸네일, 반응형 스크롤).
    7. 키보드 단축키, motion-reduce, a11y(axe, aria-live).
    8. RankingsIntro/HowTo/Faq + SoftwareApplication + FAQPage + ItemList JSON-LD(플랫폼 lib/seo.ts 경유).
    9. 레지스트리 status→live; slug→component + generateMetadata 분기; E2E 1–5; 시각 회귀 320/768/1024 두 테마.
  </recommended_implementation_order>
  <seed_rankings note="초기 콘텐츠 — 작성자가 다듬되 이것부터 시작">
    - movies: top-2024-films (2024년 최고 영화, 8+ 항목), underrated-gems (저평가된 명작, 6+ 항목).
    - restaurants: best-sushi-worldwide (최고의 초밥, 8+), ramen-by-region (지역별 라면, 6+).
    - travel: must-see-asia (아시아 필수 여행지, 10+), hidden-europe (숨은 유럽 보석, 6+).
    - games: best-indie-games-2024 (2024 인디게임, 8+), classic-board-games (클래식 보드게임, 6+).
  </seed_rankings>
  <generator_sketch>
    ```javascript
    // scripts/generate-rankings.mjs (개요)
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) rankings/ 스캔, '_' 접두 제외, 기본 파일명으로 그룹핑(ko/en 쌍)
    // 2) matter(file).data → zod RankingFileFront.parse (에러 수집)
    // 3) mergePair(ko, en): canonical 규칙(ko field/asOfDate/sourceNote), resolveSlug
    // 4) 검증: 쌍 무결성 / 필수 필드 / field 유효 / items ≥3 / rank 연속 / field별 slug 유일 → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : 정렬 후 rankings.generated.json 쓰기
    ```
  </generator_sketch>
  <testing_strategy>순수 Vitest ≥80%(schema/merge/slug/search/favorites); 생성기 검증 픽스처(pair-missing/<3-items/dupe 케이스); 컴포넌트 카탈로그 주입 목; E2E 시나리오 1–5; localStorage jsdom 격리.</testing_strategy>
</key_implementation_notes>

</project_specification>
```

466줄 정본(SPEC.md)의 국문 번역, 최종.
