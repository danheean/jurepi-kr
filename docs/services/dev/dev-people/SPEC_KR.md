# 개발 인물 사전 — 소프트웨어 역사의 주요 인물들 — 서비스 스펙

> 이 문서는 **정본(English) 소스**이며 AI 코딩 에이전트가 이용합니다. 한국어 번역은 [`SPEC_KR.md`](SPEC_KR.md)에서 유지하며, 둘 중 하나가 변경될 때는 항상 동기화해야 합니다.
>
> **개발 인물 사전 / Developer People Dictionary** — 소프트웨어 역사에 영향을 미친 주요 소프트웨어 엔지니어, 컴퓨터 과학자, 기술 개척자들의 엄선된 인물 사전. 마크다운 쌍(`<인물>.md` + `<인물>_en.md`)으로 관리되며, 빌드 타임에 생성기가 폴더를 읽어 유효성 검사 후 정적 카탈로그로 컴파일합니다. 클라이언트 SPA로 탑재되어 이름/태그/업적으로 검색하고 태그/시대 탭, 즐겨찾기/최근 본 목록, **개인 프로필 정적 페이지** (`/[locale]/tools/dev-people/<인물>`)를 제공합니다.
>
> 내부 서비스 코드명: `dev-people`. 레지스트리 id: `dev-people`. 공개 URL 슬러그: `/[locale]/tools/dev-people` (허브) 및 `/[locale]/tools/dev-people/<인물>` (스포크 페이지).
>
> 이 스펙은 **도구 자체**만 다룹니다. 공유 셀(헤더/푸터/로케일/테마/동의 배너), 도구 레지스트리, SEO 및 광고 인프라, 디자인 토큰은 플랫폼에서 제공합니다:
> - 플랫폼 스펙: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템 (시각 진실의 유일한 출처): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 스펙 (동일한 콘텐츠 패턴): [`docs/services/dev/bookmarks/SPEC.md`](../bookmarks/SPEC.md)
> - 참고 형제 도구 스펙 (허브+스포크 아키텍처): [`docs/services/text/new-word/SPEC.md`](../../text/new-word/SPEC.md)

```xml
<project_specification>

<project_name>개발 인물 사전 — 소프트웨어 및 기술을 형성한 영향력 있는 인물들의 엄선된 전기 (Jurepi 도구, 코드명 dev-people, 레지스트리 id dev-people)</project_name>

<overview>
개발 인물 사전은 소프트웨어와 컴퓨팅을 형성한 영향력 있는 인물들의 이야기를 모아옵니다. 방문자는 인물을 검색하거나("그레이스 호퍼", "귀도 반 로섬", "컴퓨터 과학 여성") 태그(ai, deep-learning, clean-code, architecture, tdd, 자유소프트웨어 등)와 시대(1940–1990, 1990–2000, 2000–현재)로 탐색하여 주요 인물을 발견하고, 개인 프로필을 열어 전기, 업적, 핵심 저작/도서, 시대 배경, 관련 인물을 읽을 수 있습니다. 각 인물은 **편집자가 작성한 마크다운** — 자동 수집이 아니라, 사용자 생성도 아니라 — 투명한 출처 명시와 학술적 의도가 담겨 있습니다. 이는 "누가 X를 개척했는가?"와 "Y는 어느 시대에 활동했는가?"에 답합니다.

도구의 콘텐츠 모델은 근본적입니다: 인물은 코드가 아니라 **마크다운 파일**입니다. 콘텐츠 폴더에서 쌍을 만들고(`<인물>.md` 한국어 + `<인물>_en.md` 영문) 구조화된 머리말(name, tags, knownFor, birthYear, deathYear, nationality, era, achievements, books, related, links, photo)과 마크다운 본문(소개 / 일화 섹션)을 작성하면, **빌드 타임**에 생성기가 폴더를 스캔하고 머리말을 파싱하고 유효성을 검사한 후 정적 카탈로그(`dev-people.generated.json`)로 구워냅니다. 도구는 그 카탈로그를 동적으로 임포트하여 허브(검색, 필터, 목록, 즐겨찾기/최근)와 **개별 정적 인물 페이지** 를 `/[locale]/tools/dev-people/<인물>`에 방출합니다. 즉, "파일을 폴더에 떨어뜨리면 허브에 나타나고 고유한 정적 페이지를 얻는다"는 것이 **진짜** — 백엔드도 데이터베이스도 없이 정적 생성만으로 가능합니다.

**극중요** (클라이언트 전용 허브, SSG 스포크 페이지): 허브는 100% 클라이언트 SPA입니다. 스포크 페이지는 빌드 타임 정적 생성(SSG)되며, 마운팅 게이트 바깥의 SSR 콘텐츠(전기, 업적)를 포함하므로 검색 엔진과 AI 크롤러가 JavaScript 없이 풍부한 인물 프로필을 색인합니다. 백엔드 없음, 데이터베이스 없음, 런타임 파일 시스템 접근 없음. 유일한 자사 지속성은 `localStorage`(허브 즐겨찾기 + 최근 본 목록)이며, 네트워크를 통해 전송되는 것은 절대 없습니다.

**극중요** (콘텐츠 모델, 불변식): 모든 인물은 **반드시** 한국어 파일과 영문 파일의 일치하는 쌍이어야 하며(대응 파일이 없으면 빌드 **실패** — 형제 컬렉션과 동일한 규칙; 경고 후 제외 없음). 각 파일은 비어있지 않은 이름(`name`), 핵심 업적을 설명하는 문자열 `knownFor`(≥ 50자)을 포함해야 하며, 적어도 한국어 파일은 tags, nationality, era를 가져야 합니다. 인물의 tags, era, nationality, achievements, books, 관련 인물 참조, links는 **한국어 파일에서 정본**이며, 영문 파일은 없을 경우 이를 상속합니다. 생성기는 다음을 유효성 검사합니다: (1) 쌍 무결성 (2) 로케일별 필수 필드 (3) slug 유니크성 (4) 관련 참조가 실제 slug를 가리킴 (5) 출생/사망 연도 건전성 (6) 태그가 제어된 어휘 범위 내 (7) 업적/책의 개수와 연도가 한⟷영 일치, 그리고 규칙이 **깨지면 명확한 메시지와 함께 빌드를 실패**(무음의 생략 없음).

**극중요** (허브 SPA + 스포크 SSG, 사용성 최우선): 허브는 플랫폼 SSG 셸 위의 클라이언트 SPA(Single-Page Application)로 탑재됩니다. **모든 상호작용** — 태그 필터링, 검색, 즐겨찾기, 상세 열기 — 는 로컬 React 상태로 일어나며, 허브 내 라우트 탐색도, 전체 페이지 새로고침도 **없습니다**. 사용성이 최우선입니다: 인물 목록은 한눈에 보이고, 검색은 한 글자로 접근("/")할 수 있으며, 모든 인물은 1초 이내에 도달합니다. 스포크 페이지(개별 인물 프로필)는 SEO/색인용 정적으로 생성되며, 각 스포크는 고유한 메타데이터, hreflang, 빵부스러미, Person JSON-LD를 갖춘 독립 SSG 라우트입니다.

**극중요** (허브 사용성 vs. 스포크 SEO 발견성): 허브는 탐색/고급 사용자 니즈(빠른 검색, 태그 필터, 최근 탭)를 돕습니다. 스포크 페이지는 SEO/GEO 발견성(AI 답변용 Person 스키마, `hreflang` 양로케일 대체, 인물별 개별 정본 URL, 색인용 풍부한 전기 텍스트)을 돕습니다. 허브 카드는 스포크 페이지로의 앵커입니다; 허브 검색/필터는 순수 클라이언트 사이드입니다. 스포크 페이지는 허브로의 빵부스러미 네비게이션과 관련 인물 링크(도구 내 및 스포크로 돌아가기)를 포함합니다. 모든 스포크 페이지에는 고지사항이 표시됩니다: "이 정보는 편집자가 정리한 것으로 부정확할 수 있습니다. 정확한 정보는 원문 링크를 확인해 주세요." / "This information has been compiled by editors and may be inaccurate. Please verify with original sources."
</overview>

<platform_integration>
  - 라우트: 
    - `/[locale]/tools/dev-people` — 허브 (SPA를 담은 SSG 셸; 레지스트리 slug "dev-people", id "dev-people", 런칭 시 status "live", accent "sky", category "dev").
    - `/[locale]/tools/dev-people/<인물>` — 개별 인물 스포크 페이지 (generateStaticParams를 통한 SSG, 인물별 고유 메타데이터).
  - 플랫폼이 제공함 (재구현 금지): 앱 셸(헤더/푸터/로케일 전환기/테마 토글), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md 토큰), i18n 런타임, 도구 모듈 주변 Error Boundary, lib/seo.ts 메타데이터 빌더, 빵부스러미 + 인콘텐츠 광고 래퍼, ShareButtons (도구 라우트에 자동 포함).
  - 소비: i18n 네임스페이스 `tools.dev-people.*` (UI 크롬 문자열: tags, eras, search, how-to, FAQ, disclaimer — 인물 콘텐츠 **아님**; 이는 `dev-people.generated.json`의 마크다운에서 옴).
  - 플랫폼 의존성 (카테고리 노트): 이 도구는 기존 `'dev'` 카테고리("개발", accent sky)에 속합니다 — bookmarks와 동일합니다. 유일한 플랫폼 변경은 ONE `ToolMeta` 레지스트리 항목 추가, 도구 라우트에서 slug→component 분기(허브 + 스포크), generateMetadata 분기(허브 + 스포크, 스포크는 Person + BreadcrumbList JSON-LD 사용)입니다. 신규 카테고리 불필요.
  - **Sitemap 개선**: `app/sitemap.ts`는 `dev-people.generated.json`을 임포트하고 스포크 인물을 순회하여 개별 인물 URL(로케일 대체)을 사이트맵에 추가해야 합니다. 이는 **GEO/봇 발견성을 위해 극중요**합니다. scope_boundaries "in_scope"과 key_implementation_notes "sitemap"을 참조하세요. 스포크는 13명 × 한⟷영 = **26개 스포크 URL** + 1 허브 = 27개 dev-people URL입니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - 마크다운 관리 인물 카탈로그 (`content/dev-people/people/`의 쌍: `<인물>.md` + `<인물>_en.md`).
    - 빌드타임 생성기: 폴더 스캔 → 머리말 파싱 → 유효성 검사 → 코드 스플릿 정적 카탈로그(`dev-people.generated.json`). `prebuild`/`predev`에 배선됨.
    - **스포크 페이지 생성**: 플랫폼 라우트 `/[locale]/tools/dev-people/<인물>`은 generateStaticParams(dev-people.generated.json 유도)를 사용하여 인물별 SSG 페이지(13명 × 한⟷영 = 26 페이지)를 생성합니다. 각 스포크 페이지: 고품질 전기 SSR 텍스트(마크다운 본문 "소개" 섹션, 업적 목록, 일화), Person JSON-LD(schema.org Person: name/description/birthDate/deathDate/nationality/knowsAbout/sameAs), BreadcrumbList, 허브로의 빵부스러미, 관련 인물 링크, 고지사항 푸터, 퍼머링크 + 정본/hreflang.
    - 13명의 시드 인물(한⟷영 쌍)을 상당한 전기 포함(최소 2–4단락).
    - **인물 마크다운 템플릿**: 주석 있는 마크다운 템플릿(`content/dev-people/_TEMPLATE.md`, `content/dev-people/_TEMPLATE_en.md`) 및 전기 작성 및 머리말 유효성 검사를 안내하는 저자용 README.
    - 허브 UI: 이름/별명/태그로 검색, 태그 탭(제어된 어휘: java, python, javascript, c, cpp, linux, git, ai, deep-learning, clean-code, architecture, tdd, agile, refactoring, design-patterns, free-software, web, game, education, youtube), 시대 탭(1940–1960, 1960–1980, 1980–2000, 2000–현재), 즐겨찾기/최근 본(localStorage). 허브 카드: 인물명(헤드라인), 간단한 knownFor, 태그+시대 배지, 사진/아바타(선택사항, photoCredit 포함; 없으면 머리글자+카테고리 accent 폴백), 별 즐겨찾기. 허브 목록은 검색/필터 상태를 존중하고 카드 또는 그리드로 렌더합니다.
    - 검색: 인물명, 별명, knownFor, 태그로 **양쪽 로케일** 통해 실시간 필터(디바운스). 대소문자와 분음 부호 구분 없음.
    - 스포크 페이지: 인물명(H1), 사진(있으면, photoCredit 제시; 없으면 머리글자 아바타), 출생/사망 연도 + nationality, 태그+시대 배지, **전기/knownFor 텍스트(마운팅 게이트 바깥 SSR)**, 업적 타임라인(있으면), 책 목록(있으면), 관련 인물 칩(클릭 가능한 도구 내 또는 관련 스포크 링크). 완전한 전기는 최소 2–4단락(얇은 콘텐츠 가드: 실질 전기 텍스트, 단편 아님). 빵부스러미: Home > 도구 > 개발 인물 사전 허브 > 인물명. 소셜 공유 버튼 자동 포함(플랫폼 템플릿).
    - 즐겨찾기(고정된 인물) + 최근 본 목록 — localStorage 지속성, 알 수 없는 slug 자동 제거.
    - 전체 키보드 지원: "/" 검색 포커스, 화살표 키 허브 목록 탐색, Enter로 인물 상세 열기, Esc로 지우기/닫기.
    - 도구별 SEO 긴 문장("누가 소프트웨어를 형성했는가?" FAQ) + **인물 JSON-LD(schema.org Person: name, description, birthDate, deathDate, nationality, jobTitle/knowsAbout, sameAs=[Wikipedia, GitHub 해당 시])** 스포크별, **BreadcrumbList** 스포크별, 로케일화된 한⟷영.
    - 모션 감소 폴백; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - 앱 셸, 헤더/푸터, 로케일 전환기, 테마 토글, 동의 배너, 광고 로딩, sitemap/robots, 도구 레지스트리 메커니즘 (모두 플랫폼).
    - 사용자 브라우저 기반 인물 추가/편집 UI (런타임 CMS). 편집은 **오직** 저장소 마크다운 파일을 통해서만 — 백엔드/데이터베이스 없음. 런칭 시 인앱 편집 없음.
    - 로그인 / 계정 / 크로스 디바이스 동기화.
    - 사용자 인물 또는 전기 제출(인크라우드 소싱 / 소셜 기능 **없음**).
    - Wikipedia 또는 기타 출처의 자동 전기 수집. 콘텐츠는 저자 엄선 마크다운만.
    - 마크다운 본문의 풍부한 HTML/스크립트. 전기는 안전 마크다운(순 텍스트, 제한된 인라인 강조)이며 공유 `<Markdown>` 컴포넌트를 통해 렌더됩니다.
    - 사진 업로드 UI. 사진은 `public/images/dev-people/`의 로컬 파일(attribution용 photoCredit 필수). 빌드타임 유효성 검사로 파일 존재 보장.
  </out_of_scope>
  <future_considerations>
    - 여러 인물의 시대별 "타임라인" 시각화 (Phase 2).
    - 관련 태그 클러스터링("X 태그가 만든 언어") — Phase 2.
    - 인물별 큐레이션된 비디오/팟캐스트 링크 — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (한⟷영) — 모두 플랫폼에서 상속됨.</inherited>
  <module_specific>
    <content_source>인물들은 `content/dev-people/people/`의 마크다운 쌍으로 존재합니다. 파일 시스템 접근은 빌드타임만(생성기 스크립트). 런타임은 파일 시스템 접근 **없음**. 스포크 페이지는 Next.js generateStaticParams를 사용하여 인물별 라우트 SSG.</content_source>
    <photo_storage>로컬 사진은 `public/images/dev-people/`에 저장(형식: `<slug>.jpg`). 빌드타임 생성기는 파일 존재 유효성 검사. 머리말 `photo: <slug>.jpg` + 필수 `photoCredit`(문자열, 어트리뷰션/라이선스). 사진 없음 → 머리글자 아바타 폴백(이름의 머리글자 + 카테고리 accent 색).</photo_storage>
    <biography_source>전기 텍스트는 마크다운 파일 **본문**(머리말 아래)에 위치하며, 머리말 필드 **아님**. 섹션: `## 소개`(2–4단락) + `## 일화`(1–3단락). 공유 `src/components/markdown/`(markdown-to-jsx, SSR 안전, HTML/스크립트 필터링)을 통해 렌더됨.</biography_source>
    <frontmatter_parsing>gray-matter v4.x를 사용한 YAML 머리말 파싱(생성기 스크립트만, devDependency). 구조화된 머리말: name, slug, knownFor, tags, era, nationality, birthYear, deathYear, achievements, books, aliases, related, links, photo, photoCredit.</frontmatter_parsing>
    <validation>zod v3.x(리포에서 이미 사용 중)로 (1) 개별 파일 머리말 스키마 (2) 병합된 인물 레코드 불변식 (3) 태그 제어된 어휘를 유효성 검사합니다. URL 유효성 검사(links용 유효한 http(s), 악형식 참조 없음). 스키마는 순수하며 생성기와 런타임 로더 양쪽에서 재사용 가능.</validation>
    <catalog>생성 산출물은 코드 스플릿 데이터 모듈(`src/components/tools/dev-people/data/dev-people.generated.json`)이며 이 도구의 허브 라우트에서만 동적으로 임포트됩니다. 스포크 페이지는 동일한 카탈로그를 사용하여 빌드 타임에 인물 메타데이터를 조회합니다(generateStaticParams + getStaticProps 패턴).</catalog>
    <spoke_generation>스포크 페이지는 Next.js `generateStaticParams`로 `dev-people.generated.json` slug를 순회하여 생성되며(양로케일). 각 스포크 라우트 페이지 파일(`src/app/[locale]/tools/dev-people/[person]/page.tsx`)은 `locale` + `person` 파라미터를 수락하고 lib/seo.ts 헬퍼(buildToolEntityMetadata, personJsonLd, breadcrumbListJsonLd)를 사용하여 인물별 메타데이터, 정본/hreflang, JSON-LD를 구성합니다. 전기/업적 텍스트는 마운팅 게이트 **바깥**에서 SSR되므로 정적 HTML이 크롤러용으로 포함됩니다.</spoke_generation>
    <animation>네이티브 CSS 트랜지션만(카드 호버 들어올리기, 스포크 페이드인). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, 생성기 스크립트의 머리말 파싱.</gray-matter>
    <zod>zod v3.x — 리포에서 이미 사용; 머리말/카탈로그 유효성 검사용 재사용.</zod>
    <markdown-to-jsx>마크다운 전기 본문을 XSS 보호와 함께 렌더링하기 위해(bookmarks/new-word와 공유된 컴포넌트).</markdown-to-jsx>
  </libraries>
</technology_stack>

<content_authoring_model>
  <directory>
    content/dev-people/
    ├── _TEMPLATE.md            # 신규 인물용 한국어 템플릿 (주석 있음; 생성기는 "_" 접두사 제외)
    ├── _TEMPLATE_en.md         # 신규 인물용 영문 템플릿
    ├── README.md               # 저작 가이드 (명명, 태그, 시대/nationality 목록, 전기 작성법, 사진 가이드라인)
    └── people/
        ├── andrej-karpathy.md          # 한국어 정본 (구조화 메타데이터 + 본문)
        ├── andrej-karpathy_en.md       # 영문 (본문 + 선택적 머리말 오버라이드)
        ├── grace-hopper.md
        ├── grace-hopper_en.md
        ├── …[13 쌍 총]
        └── …
  </directory>
  <pairing note="쌍 규칙">
    - 파일명 기반(minus `_en` 접미사)이 **쌍 키**입니다. `grace-hopper.md`(한) ↔ `grace-hopper_en.md`(영).
    - `_`로 시작하는 파일들은 생성기에서 무시됩니다(_TEMPLATE 등).
    - 한쪽만 있는 쌍(영문만 또는 한국어만) → **빌드 실패**(경고 후 제외 없음). ASCII 파일명 필수(URL/slug 안정성); slug는 ASCII 안전 유효성 검사.
  </pairing>
  <slug note="식별자">
    - `slug` = 한국어 파일 머리말의 `slug` 값(있으면), 아니면 기본 파일명(ASCII, URL 안전 필수). related, favorites, recents, 스포크 URL에서 참조됨. 카탈로그 내 유니크성(테스트/생성기 유효성 검사).
  </slug>
  <shared_metadata note="정본 규칙">
    - 구조화 메타데이터(`tags`, `era`, `nationality`, `related`, `links`, `photo`, `photoCredit`, `achievements`, `books`)는 **한국어 파일에서 정본**. 영문 파일은 없으면 상속하고, 있으면 일치해야 합니다(유효성 검사 강제).
    - 로케일 특정 콘텐츠(`name`, `aliases`, `knownFor`, 전기 마크다운 본문)는 파일별 독립적. Name은 로케일화(한식 표기 vs. 영문 성명순). knownFor은 로케일별 큐레이션 업적 요약(표현/강조가 약간 다를 수 있음).
  </shared_metadata>
  <template_ko>
    ```markdown
    ---
    # ── 필수 ──
    name: 그레이스 호퍼
    slug: grace-hopper          # ASCII 안정 식별자 (한국어 파일 정본). Related/favorites/recents/URL에서 이를 참조.
    knownFor: |                 # 50자 이상, 핵심 업적/기여
      COBOL 프로그래밍 언어 발명, 컴파일러 개념 선구자,
      미 해군 최초의 여성 제독 중 한 명.
    tags:                       # 제어된 어휘 (한국어 정본; 영문이 없으면 상속)
      - c
      - architecture
      - education
    era: 1960-1980              # 시대 태그 (1940-1960 | 1960-1980 | 1980-2000 | 2000-present)
    nationality: US             # ISO 국가 코드 또는 친화적 명칭
    # ── 선택사항이나 권장 ──
    birthYear: 1906
    deathYear: 1992
    photo: grace-hopper.jpg     # 로컬 파일 in public/images/dev-people/ (생성기 존재 확인)
    photoCredit: "Wikimedia Commons, 퍼블릭 도메인"   # 사진 있음 → photoCredit 필수
    # ── 선택사항 ──
    achievements:               # 핵심 업적 타임라인 (한국어 정본)
      - year: 1952
        title: 최초의 컴파일러 A-0 시스템 개발
      - year: 1959
        title: COBOL 언어 설계 주도
    books:                      # 발행 저작 (한국어 정본; 제목 로케일화, url/year 공유)
      - title: "컴퓨터 이해"
        year: 1984
        url: "https://…"
    aliases:                    # 검색 별명 (선택사항)
      - Grace Murray Hopper
      - "호퍼 제독"
    related:                    # 관련 인물 slug (선택사항, 카탈로그에 존재해야 함)
      - alan-turing
      - ada-lovelace
    links:                      # 외부 참조 (선택사항), 유효한 http(s)
      - label: "Wikipedia"
        url: "https://ko.wikipedia.org/wiki/그레이스_호퍼"
      - label: "IEEE 컴퓨터 협회"
        url: "https://www.computer.org/…"
    ---

    ## 소개

    그레이스 호퍼에 관한 전기 2–4단락. 마크다운 본문(머리말 아님). 
    공통 `<Markdown>` 렌더러로 SSR, HTML/스크립트는 차단됨.

    ## 일화

    재미있는 일화 1–3단락 또는 목록.
    ```
  </template_ko>
  <template_en>
    ```markdown
    ---
    # ── 필수 ──
    name: Grace Hopper
    knownFor: |
      COBOL 프로그래밍 언어 발명자, 컴파일러 개념의 선구자,
      미 해군에서 프로그래밍 시스템을 확립한 획기적인 여성 컴퓨터 과학자.
    # ── 선택사항 (구조화 메타는 한국어 파일에서 상속됨) ──
    birthYear: 1906
    deathYear: 1992
    achievements:               # 한국어 정본; 제목을 영어로 번역 (연도, 개수는 한국어와 일치해야 함)
      - year: 1952
        title: 최초의 컴파일러 시스템 A-0 개발
      - year: 1959
        title: COBOL 언어 설계 주도
    books:
      - title: "컴퓨터 이해"
        year: 1984
    aliases:
      - Grace Murray Hopper
      - Admiral Hopper
    ---

    ## About

    그레이스 호퍼 전기 영문판, 2–4단락.

    ## Anecdotes

    영문 일화 1–3단락.
    ```
  </template_en>
  <tag_controlled_vocabulary>
    허용된 태그(반드시 `tools.dev-people.tags.<id>` i18n 키로 등록):
    java, python, javascript, c, cpp, linux, git, ai, deep-learning, clean-code, architecture,
    tdd, agile, refactoring, design-patterns, free-software, web, game, education, youtube.
    
    생성기는 이 목록에 없는 태그를 발견하면 빌드 실패(엄격한 유효성 검사).
  </tag_controlled_vocabulary>
</content_authoring_model>

<file_structure>
scripts/
└── generate-dev-people.mjs               # 빌드 타임: content/dev-people/people/* 스캔 → 파싱 → 유효성 검사 → dev-people.generated.json 방출. prebuild/predev에 배선.
content/dev-people/                        # 사람이 작성한 콘텐츠 (저장소)
├── _TEMPLATE.md  _TEMPLATE_en.md          # 템플릿 (생성기가 제외)
├── README.md                              # 저작 가이드
└── people/*.md  *_en.md                   # 인물 쌍 (13 시드 쌍)
public/
└── images/dev-people/
    └── *.jpg                              # 로컬 인물 사진 (생성기 존재 확인)
src/
├── lib/dev-people/                        # 순수 도메인 계층 — React/Next 없음, 전체 단위 테스트
│   ├── schema.ts                          # zod: PersonFileFront(한⟷영), MergedPerson, StoreSchema + STORE_VERSION; safeparse 헬퍼
│   ├── merge.ts                           # mergePair(koFront, enFront): 정본 규칙 적용 → MergedPerson; validatePair(경고/에러 수집)
│   ├── slug.ts                            # slugify(name), resolveSlug(front, filename)
│   ├── catalog.ts                         # 타입화된 접근: allPeople, byId, byTag, byEra, peoples(); 관련 참조 무결성 확인
│   ├── search.ts                          # filterPeople(people, query, locale): name+aliases+knownFor+tags, 양로케일; 정규화(대소문자/분음부호)
│   ├── favorites.ts                       # 불변 ops: toggleFavorite, pushRecent(max), pruneUnknown(slugs, catalog)
│   └── birthdate.ts                       # 나이/연도 표시: calculateAge(birthYear, deathYear) → "만 N세" | "향년 N세" | undefined
├── components/tools/dev-people/
│   ├── DevPeople.tsx                      # 오케스트레이터 (Client Component) — tag/era/query/selected 상태 + useDevPeopleCatalog() 소유; 허브 SPA만
│   ├── useDevPeopleCatalog.ts             # 훅: 동적 카탈로그 임포트 + localStorage favorites/recents + 파생 filter/select
│   ├── TagTabs.tsx                        # 제어된 어휘 태그 in pill row (e.g., java/python/c/ai/tdd/등)
│   ├── EraTabs.tsx                        # 1940–1960 / 1960–1980 / 1980–2000 / 2000–현재 (tablist)
│   ├── PeopleSearch.tsx                   # 검색 입력 ("/" 포커스, 지우기, aria)
│   ├── PeopleList.tsx                     # 반응형 카드 목록/그리드; roving tabindex 키보드 탐색
│   ├── PersonCard.tsx                     # 한 명의 카드: 이름(헤드라인), knownFor, 태그+시대 배지, 사진/아바타, 별 즐겨찾기, 스포크로의 링크
│   ├── DevPeopleIntro.tsx                 # H1 + lead (SEO; 가능하면 서버 렌더)
│   ├── DevPeopleHowTo.tsx                 # "누가 소프트웨어 역사를 형성했는가?" / 긴 문장(SEO)
│   ├── DevPeopleFaq.tsx                   # Q&A + FAQPage JSON-LD (허브만)
│   ├── Disclaimer.tsx                     # 고지사항 푸터(허브 + 스포크 재사용 가능)
│   ├── data/
│   │   └── dev-people.generated.json      # 생성 산출물 — [MergedPerson...]
│   └── (스포크 컴포넌트는 라우트 핸들러에 위치; key_implementation_notes 참조)
└── i18n/messages/{ko,en}.json             # tools.dev-people.* UI 크롬(tags, eras, search, toasts, how-to, FAQ, disclaimer) — 인물 콘텐츠 **아님**
└── app/[locale]/tools/dev-people/
    ├── page.tsx                           # 허브 라우트 (DevPeople SPA를 감싸기)
    └── [person]/page.tsx                  # 스포크 라우트 (generateStaticParams + SSG 인물 페이지, 전기, JSON-LD, 빵부스러미, 관련 칩)
</file_structure>

<core_data_entities>
  <person_file_front note="개별 마크다운 파일 머리말 (파싱 단위)">
    - name: string (필수, 비어있지 않음) — 표시 인물명 (로케일별)
    - knownFor: string (필수, ≥ 50자, 순 텍스트) — 핵심 업적/기여 요약
    - tags?: string[] (영문은 선택, 한국어는 필수) — 제어된 어휘 태그 (e.g., [ai, deep-learning, education]); 한국어 정본, 영문 상속
    - era?: string (영문은 선택, 한국어는 필수) — 시대 태그(한국어 정본); 예: 1940-1960, 1960-1980, 1980-2000, 2000-present
    - nationality?: string (영문은 선택, 한국어는 필수) — 국가(한국어 정본); ISO 코드 또는 친화적 명칭
    - birthYear?: number (선택, 필수 아님; ≥ 1800, ≤ 현재 연도) — 출생 연도(없으면 나이 미표시)
    - deathYear?: number (선택, > birthYear if present, ≤ 현재 연도)
    - slug?: string — ASCII 안정 식별자(한국어 파일 정본; 없으면 파일명에서 파생)
    - photo?: string — 로컬 파일명 (e.g., "grace-hopper.jpg"), public/images/dev-people/에 존재해야 함
    - photoCredit?: string — 사진 있으면 필수; 어트리뷰션/라이선스 텍스트
    - achievements?: array of { year: number, title: string } (한국어 정본; 영문 제목 번역)
    - books?: array of { title: string, year?: number, url?: string } (한국어 정본; 제목 로케일화, url 공유)
    - aliases?: string[] (검색 별명)
    - related?: string[] — 다른 인물 slug
    - links?: array of { label, url } — 외부 참조 (http(s) 유효성 검사)
    불변식: name/knownFor 비어있지 않음, tags는 제어된 어휘, knownFor ≥ 50자. zod 파싱 실패 → 에러로 수집(빌드 실패 후보).
  </person_file_front>
  <merged_person note="한⟷영 병합 결과; 카탈로그 레코드; dev-people.generated.json 항목">
    - slug: string — 카탈로그 내 고유 식별자(유니크; favorites/recents/related/스포크 URL 참조)
    - tags: string[] — 한국어 파일 정본(제어된 어휘; 한⟷영 일치 필수)
    - era: string — 시대 태그, 한국어 파일 정본
    - nationality: string — 국가, 한국어 파일 정본
    - achievements: array of { year, title } — 한국어 정본(개수 + 연도가 한⟷영 일치); 제목 로케일별
    - books: array of { title, year?, url? } — 한국어 정본(개수 + 연도가 한⟷영 일치); 제목 로케일화, url 공유
    - related: string[] — 정본; 카탈로그의 실제 slug만(빌드 유효성 검사, 누락 → 에러)
    - links: array of { label, url } — 정본; URL 유효성 검사 http(s)
    - photo?: string — 로컬 파일명; 정본; 생성기 파일 존재 검사
    - photoCredit?: string — 정본; 사진 있으면 필수
    - ko: { name, knownFor, aliases?, biography_body }
    - en: { name, knownFor, aliases?, biography_body }
    - birthYear?, deathYear? — 루트(로케일별 아님)
    불변식 — 쌍/필드/유니크성/참조: 모든 레코드는 한⟷영 포함; 로케일별 name/knownFor 채워짐; tags 있음(한국어 정본); slug 유니크; related/links 실제 대상 가리킴; 사진/links/tags 유효성 검사됨; 업적/책 개수+연도 한⟷영 일치. 위반 → 생성기 빌드 실패(무음 생략 아님, 명시적 에러 + 파일/필드 보고).
  </merged_person>
  <tag note="도메인/주제별 그룹화; 제어된 어휘; i18n에서 로케일화 라벨">
    - id: string (java, python, javascript, c, cpp, linux, git, ai, deep-learning, clean-code, architecture, tdd, agile, refactoring, design-patterns, free-software, web, game, education, youtube). 라벨: tools.dev-people.tags.<id> (한⟷영 i18n).
  </tag>
  <era note="역사적 시기별 그룹화; i18n에서 로케일화 라벨">
    - id: string (1940-1960, 1960-1980, 1980-2000, 2000-present). 라벨: tools.dev-people.eras.<id> (한⟷영 i18n).
  </era>
  <dev_people_store note="단일 localStorage blob">
    - version: number (STORE_VERSION, 시작값 1)
    - favorites: string[] — 인물 slug, 삽입 순서
    - recents: string[] — 인물 slug, 가장 최근 먼저, RECENTS_MAX = 20, 중복 제거
    - meta: { lastQuery?: string; lastTag?: string; lastEra?: string; createdAt: number }
    localStorage 키: `jurepi-dev-people`
    불변식: 읽기는 zod 파싱; 실패 → 새로 시작(throw 없음). 알 수 없는 slug는 로드 시 제거.
  </dev_people_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; BIO_MIN_LENGTH = 50 (knownFor); BIRTH_YEAR_MIN = 1800.
    - TAG_VOCABULARY = [java, python, javascript, c, cpp, linux, git, ai, deep-learning, clean-code, architecture, tdd, agile, refactoring, design-patterns, free-software, web, game, education, youtube].
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/dev-people" page="개발 인물 사전 허브 (플랫폼 도구 라우트, slug→component 분기)" />
    <route path="/:locale/tools/dev-people/:person" page="개인 스포크 (generateStaticParams + SSG)" />
  </public_routes>
  <note>허브 라우트는 단일이며 SPA 기반. 스포크 라우트는 `dev-people.generated.json` slug를 순회하는 generateStaticParams로 생성(13명 × 한⟷영 = 26 라우트). locale ∈ {ko, en}. 플랫폼 generateStaticParams(허브) + 도구별 generateStaticParams(스포크)가 SSG를 위해 레지스트리 + 카탈로그를 순회합니다.</note>
</route_definitions>

<component_hierarchy>
  <!-- 허브 SPA -->
  <dev_people>                      <!-- "use client"; tag + era + query + selectedSlug 상태 소유 + useDevPeopleCatalog() 소유 -->
    <dev_people_intro />            <!-- H1 + lead (가능하면 SSR) -->
    <people_hub_layout>             <!-- 선택기(목록) + 선택사항 상세(미래 단계 허브 내; 지금은 카드가 스포크 링크). 향후 허브 상세 패널을 추가할 경우, <ShareButtons url={absoluteEntityUrl(locale,'dev-people',slug)} title={인물명}/> 배선 필수(하네스 관례: 허브 패널은 허브 URL이 아니라 엔티티 스포크 URL 공유) -->
      <people_main>                 <!-- 좌측/상단 열 -->
        <people_search />           <!-- "/" 포커스, 지우기, 결과 개수 -->
        <tag_tabs />                <!-- java / python / … / 즐겨찾기 / 최근 (가상 탭) -->
        <era_tabs />                <!-- 1940–1960 / 1960–1980 / … (선택사항 계층 필터 또는 통합 뷰) -->
        <people_list>               <!-- Roving tabindex 카드 -->
          <person_card />           <!-- × N: 이름, knownFor, 배지, 사진/아바타, 별, 스포크로의 링크 -->
          <empty_state />           <!-- 결과 없음 / 즐겨찾기 비어있음 -->
        </people_list>
      </people_main>
    </people_hub_layout>
    <dev_people_how_to />           <!-- SEO 긴 문장 -->
    <dev_people_faq />              <!-- FAQPage JSON-LD -->
  </dev_people>

  <!-- 스포크 SSG 페이지 (별도 라우트 컴포넌트) -->
  <person_spoke>                    <!-- /[locale]/tools/dev-people/[person]의 서버 컴포넌트 -->
    <breadcrumb />                  <!-- Home > 도구 > 개발 인물 사전 > 인물명 -->
    <person_header>                 <!-- 이름, 출생/사망(나이 표시), nationality, 태그/시대 배지, 사진/아바타 -->
    </person_header>
    <person_biography />            <!-- SSR'd 전기 텍스트(마운팅 게이트 바깥 for 크롤러), 마크다운 본문 -->
    <person_achievements />         <!-- 업적 타임라인 + 책 목록(있으면) -->
    <related_people_section />      <!-- 관련 인물 링크(클릭 가능 또는 허브 캐러셀) -->
    <share_buttons />               <!-- SNS 공유 버튼 (플랫폼 라우트 템플릿에서 자동 포함) -->
    <disclaimer />                  <!-- 푸터 고지사항 (i18n: "이 정보는 편집자가 정리한 것으로…") -->
  </person_spoke>

  <note>허브: 도구 내 SPA(검색/필터 = 로컬 상태 전환, 라우트 탐색 **아님**; 카드는 스포크로의 앵커). 스포크: 서버 컴포넌트 있는 정적 페이지, 정본 메타데이터, JSON-LD 크롤러 준비됨.</note>
</component_hierarchy>

<pages_and_interfaces>
  <!-- 허브 UI -->
  <dev_people_intro>
    - 아이브로우: "개발 도구" / "DEV TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "개발 인물 사전" / "Developer People Dictionary" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - 리드: 1–2문장, body-lg: "소프트웨어를 만든 위대한 인물들의 이야기를 찾아보세요. Dennis Ritchie부터 Geoffrey Hinton까지, 각 분야의 선구자들을 알아보세요." / 영문 동등.
  </dev_people_intro>

  <people_search>
    - DESIGN text-input 스타일, 주 열 전체 폭, 앞쪽 검색 아이콘(20px), 플레이스홀더 "인물 이름·태그·기간으로 검색…" / "Search by name, tag, era…".
    - "/" 키프레스에서 포커스. 비어있지 않을 때 뒤따르는 지우기(×).
    - 실시간 필터, 디바운스 120ms. 결과 개수 "결과 N명" 캡션.
    - aria: role="searchbox", aria-controls 목록.
  </people_search>

  <tag_tabs>
    - 수평 pill row. 순서: "전체"(모두) → 제어된 어휘 태그(java, python, javascript, c, cpp, linux, git, ai, deep-learning, clean-code, architecture, tdd, agile, refactoring, design-patterns, free-software, web, game, education, youtube) → "즐겨찾기"(고정 시) → "최근"(본 시).
    - 활성 = brand honey-gold 채움 / on-brand 텍스트; 비활성 = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right 이동; aria-selected 활성. 좁은 화면 수평 스크롤.
  </tag_tabs>

  <era_tabs>
    - 2차 필터 row(또는 공간에 따라 태그 탭과 통합). 순서: "전체"(모두) → "1940–1960" → "1960–1980" → "1980–2000" → "2000–현재".
    - 태그 탭과 동일 스타일. 태그와 구성: `filterPeople(allPeople, query, tag, era)`.
  </era_tabs>

  <people_list>
    - 반응형 그리드: 1열 <768px; 2열 768–1023px; 3열 ≥1024px(디자인이 요구하면 튜닝). 전체 컨테이너 폭.
    - 각 카드(person_card):
      - 상단: 인물명(헤드라인 18–20px var(--text)/700) + 출생/사망 연도 또는 "만 N세" / "향년 N세"(캡션 var(--text-secondary)).
      - 상단우측: 태그 배지 + 시대 배지(작은 pill, 중성 틴트).
      - 본문: knownFor clamp-2-lines(var(--text-secondary) 14–15px).
      - 하단: 사진 또는 머리글자 아바타(선택사항; 사진 있으면 종횡비 4:5, lazy load).
      - 카드: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, shadow --shadow-card. 카드는 `<a href={spokeUrl}>` 앵커(스포크 페이지로의 점진적 강화).
      - 상단우측 코너: 별 버튼(즐겨찾기 토글, aria-pressed).
    - 상태:
      - hover(포인터): translateY(-2px) + var(--shadow-card-hover); cursor pointer.
      - focus(키보드): 2px var(--focus-ring) ring offset 2px.
      - selected(향후 허브 상세 단계): 2px var(--accent-sky) ring.
    - Roving tabindex: 활성 카드 tabable; ArrowUp/Down/Left/Right 이동; Home/End 첫/마지막; Enter/Space 스포크 열기(네비게이트 또는 카드 href 트리거); "f" 즐겨찾기 토글.
    - aria: list role="list"(또는 grid); 카드 aria-label = "{이름} ({나이 표시})"; 별은 진정한 상태 버튼.
    - empty_state: 결과 없음 → "'{query}'에 해당하는 인물이 없어요" + 지우기; 즐겨찾기 비어있음 → "별을 눌러 자주 보는 인물을 저장하세요"; 최근 비어있음 → "최근 본 인물이 여기에 모여요".
  </people_list>

  <!-- 스포크 페이지 UI -->
  <person_spoke_header>
    - 빵부스러미 네비게이션(플랫폼 컴포넌트).
    - 큰 인물명(H1, 32–36px var(--text)/700).
    - 출생/사망 연도 + 나이 표시("만 N세" / "향년 N세") + nationality(24px var(--text-secondary)). 나이 계산: birthYear 있고 생존 → "만 {현재 연도 - birthYear}세"; deathYear 있음 → "향년 {deathYear - birthYear}세"; birthYear 없음 → 나이 생략.
    - 태그 배지 + 시대 배지(작은 pill, 태그 틴트).
    - 사진(있으면, 종횡비 3:4 또는 1:1, ~300–400px, lazy-load, a11y 대체 텍스트) 또는 머리글자 아바타(폴백).
    - photoCredit(작은 캡션, e.g., "Wikimedia Commons, 퍼블릭 도메인").
  </person_spoke_header>

  <person_biography>
    - "소개" / "About" 섹션(헤드라인, 아이브로우 12px/700 var(--brand-ink)).
    - 전기 텍스트: 공유 `<Markdown>` 컴포넌트로 렌더된 마크다운 본문(마운팅 게이트 **바깥** SSR'd so 정적 HTML 포함).
    - knownFor 요약(강조 또는 별도 콜아웃).
  </person_biography>

  <person_achievements>
    - "업적" / "Achievements" 섹션(achievements 배열 있으면).
    - 타임라인 레이아웃: 연도 → 업적별 제목. 개수 + 연도는 한⟷영 유효성 검사로 일치해야 함.
    - "저서" / "Books" 섹션(books 배열 있으면).
    - 목록: 제목 → 연도(선택사항) → url(있으면, 링크됨).
  </person_achievements>

  <related_people_section>
    - "관련 인물" / "Related Figures" 섹션(관련 slug 있으면).
    - 관련 인물 칩 또는 링크 목록: 각 인물 이름 → 클릭해서 스포크 페이지 열기.
    - 매달린 참조(누락 slug)는 빌드 타임에 필터링.
  </related_people_section>

  <disclaimer_footer>
    - 스포크 페이지의 고정 푸터 섹션(i18n `tools.dev-people.disclaimer`):
      - 한: "이 정보는 편집자가 정리한 것으로 부정확할 수 있습니다. 정확한 정보는 원문 링크를 확인해 주세요."
      - 영: "This information has been compiled by editors and may be inaccurate. Please verify with original sources."
    - 스타일: 작은 캡션, muted 색, 밝은 배경, 중앙 또는 좌측 정렬.
  </disclaimer_footer>

  <keyboard_shortcuts_reference>
    - (허브)
      - "/" → 검색 입력 포커스(타이핑 중 아닐 때).
      - 화살표 키 → tag/era/인물 카드 포커스 이동.
      - Enter / Space → 포커스된 인물 스포크 열기(href 네비게이트).
      - "f"(카드 포커스) → 즐겨찾기 토글(aria-pressed 플립 + toast).
      - Esc → 검색 지우기 또는 탭 필터 선택 취소.
    - (스포크) — 표준 웹 탐색(뒤로 가기 버튼, 관련 링크).
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="빌드 타임, scripts/generate-dev-people.mjs">
    - content/dev-people/people/ 스캔, `_` 접두사 제외. 기본 파일명으로 그룹화 into 한⟷영 쌍.
    - gray-matter 각 파일 파싱 → zod PersonFileFront 유효성 검사.
    - mergePair: 정본 규칙 적용(한국어 tags/era/nationality/achievements/books 정본 + 영문 없으면 상속; name/knownFor/biography_body 로케일별). resolveSlug.
    - 유효성 검사(실패 → process.exit(1) with 파일 경로 + 필드 + 사유): 쌍 무결성, 로케일 필수 필드(name/knownFor; 한국어도 tags/era/nationality), slug 유니크성, tags 제어된 어휘 범위, 관련 참조 존재, 연도 건전성(출생 ≤ 사망), 사진 파일 존재(있으면) + photoCredit, 업적/책 개수+연도 한⟷영 일치, links/books/photo URL 유효성 검사(http(s)).
    - 정렬(era → tag → birthYear, 안정), dev-people.generated.json 방출. 결정적.
    - package.json 배선: "predev": "node scripts/generate-dev-people.mjs", "prebuild": "node scripts/generate-dev-people.mjs".
  </generation>
  <spoke_generation note="빌드 타임, 플랫폼 라우트 + 도구별 generateStaticParams">
    - 플랫폼 허브 라우트(`/[locale]/tools/dev-people`)는 레지스트리를 사용해 SSG 셸.
    - 도구별 라우트 핸들러(`/[locale]/tools/dev-people/[person]`)는 `generateStaticParams()` 내보내기로 `dev-people.generated.json`을 순회하여 인물별 라우트 SSG(locale × slug 카르테시안 곱 = 13명 × 2 로케일 = 26 스포크).
    - 각 스포크 라우트: 동적 `[person]` 파라미터 → 카탈로그의 인물 조회 → 전기 SSR(마운팅 게이트 바깥) + Person JSON-LD + BreadcrumbList + 정본/hreflang + 고지사항 렌더.
    - 스포크 라우트는 반드시 lib/seo.ts 헬퍼 임포트 및 사용: `buildToolEntityMetadata(locale, person)`, `personJsonLd(person, locale)`, `breadcrumbListJsonLd([Home, 도구, 개발 인물 사전, 인물명])`.
  </spoke_generation>
  <catalog_access note="런타임 순수 계층">
    - allPeople(): MergedPerson[] (생성 순서). byId(slug), byTag(tag), byEra(era). peoples(): 카탈로그의 라이브 인물 slug.
    - 테스트는 카탈로그 유니크성, 관련 무결성, 로케일 완성도, 태그 어휘 준수 단언.
  </catalog_access>
  <search>
    - filterPeople(people, query, tag?, era?, locale?): 빈 query → 그대로. 아니면 정규화(trim, NFC, 소문자, 분음부호 제거). 일치하면 ANY: 한.name, 영.name, aliases(양쪽), 한.knownFor, 영.knownFor, tags, era. 안정 순서.
    - 탭과 구성: list = filterPeople(all, query, tag, era) 또는 filterPeople(즐겨찾기 부분집합, query, tag, era) 등.
  </search>
  <favorites_and_recents note="불변 — 새 배열/스토어 반환">
    - toggleFavorite(list, slug): 없으면 추가, 있으면 제거(순서 보존).
    - pushRecent(list, slug, max=20): 앞으로 이동/삽입, 중복 제거, 자르기.
    - pruneUnknown(slugs, catalog): 현재 카탈로그에 없는 slug 제거(로드 시 실행).
    - 최근 푸시: 인물 카드 클릭(스포크 탐색) 또는 스포크 "허브로 돌아가기" 동작. 검색/호버는 트리거 **아님**.
  </favorites_and_recents>
  <persistence_adapter useDevPeopleCatalog>
    - 마운트: 동적 카탈로그 임포트; `jurepi-dev-people` 읽기 → zod → pruneUnknown → 상태; 실패 → 새로 시작(throw 없음). localStorage 없음 → 세션 내메모리(완전히 사용 가능, 비지속).
    - 변경: 디바운스 JSON.stringify → setItem; 할당량/보안 잡기 → 메모리 유지.
    - 노출: 필터링 목록, 즐겨찾기, 최근, lastTag, lastEra, lastQuery.
  </persistence_adapter>
  <i18n>모든 UI 크롬은 tools.dev-people.*(한⟷영)에서: tags, eras, search, toasts, empty 상태, how-to, FAQ, disclaimer, 빵부스러미. 인물 이름/knownFor/전기는 마크다운(`dev-people.generated.json`)에서 오며, i18n 메시지 **아님**.</i18n>
  <photo_and_avatar>
    - 사진: `photo` 필드가 카탈로그에 있으면, `public/images/dev-people/{photo}`를 `photoCredit` 어트리뷰션과 렌더. 아니면 폴백: 머리글자 아바타(이름의 첫 2자 또는 성명 머리글자) + 배경색 = 카테고리 accent(sky/파랑).
    - Lazy-load 이미지; alt-text = 인물명.
  </photo_and_avatar>
  <age_display>
    - birthYear/deathYear로 계산: 생존하고 birthYear 있음 → "만 {현재연도 - birthYear}세"; deathYear 있음 → "향년 {deathYear - birthYear}세"; birthYear 없음 → 나이 생략. 허브 카드(캡션) 및 스포크 헤더(nationality와 함께)에 표시.
  </age_display>
  <sitemap_integration note="극중요: 플랫폼 app/sitemap.ts 업데이트 필수">
    - `app/sitemap.ts`는 dev-people.generated.json 임포트(getDevPeopleCatalog 유틸 또는 직접 require)해야 합니다.
    - allPeople + 로케일 순회로 인물 스포크 URL 추가:
      ```typescript
      const peopleUrls = allPeople.flatMap(person =>
        LOCALES.map(locale => ({
          url: `${siteUrl}/${locale}/tools/dev-people/${person.slug}`,
          alternates: {
            languages: {
              ko: `${siteUrl}/ko/tools/dev-people/${person.slug}`,
              en: `${siteUrl}/en/tools/dev-people/${person.slug}`,
            },
          },
        }))
      );
      ```
    - peopleUrls를 메인 sitemap 배열에 추가(허브 라우트 중복 **아님**).
    - **테스트**: `out/sitemap.xml`은 1 허브 + 13×2=26 인물 URL = 27개 총 dev-people URL 포함해야 함.
    - `xmllint out/sitemap.xml`을 통해 XML 유효성 + urlset 개수 검증.
  </sitemap_integration>
</core_functionality>

<error_handling>
  <build_time>
    - 극중요: 나쁜 콘텐츠는 무음 통과하지 않음. 생성기는 각 위반(파일 경로 + 필드 + 사유)을 stderr에 보고하고 0이 아닌 코드로 종료 → CI/빌드 실패. 고아 파일은 경고; 최소 1 위반이 엄격한 실패 트리거.
  </build_time>
  <search_no_results>쿼리를 따라하는 친화적 empty 상태 + "검색 지우기" 버튼; 목록은 마지막 필터 보존 또는 빈 힌트 표시.</search_no_results>
  <missing_person_on_spoke>스포크에서 카탈로그에 인물 없음(URL 직접 입력 또는 카탈로그 변경) → 404 (Next.js 기본). 스포크 라우트 generateStaticParams는 최신 카탈로그의 ALL slug를 포함해야 하므로 카탈로그 변경 후에도 낡은 스포크 URL 유효(slug 변경 안 됨, 콘텐츠만 업데이트).</missing_person_on_spoke>
  <storage>
    <unavailable>비공개 모드/비활성 → recents/즐겨찾기 메모리 내, scary 에러 없음. 허브/검색/목록 완전히 작동.</unavailable>
    <corrupt_blob>JSON/zod 실패 → 새로 시작(favorites/recents 귀중 아님, throw 없음).</corrupt_blob>
  </storage>
  <error_boundary>플랫폼이 도구를 감싸기; 렌더 실패 → 셸 크래시 없이 재시도.</error_boundary>
  <note>자사 네트워크 호출 없음; 스포크 페이지는 순수 SSG; API 에러 표면 없음.</note>
</error_handling>

<aesthetic_guidelines>
  <source>극중요: DESIGN.md는 모든 토큰의 유일한 출처. 이하는 도구별 적용.</source>
  <accent_usage>
    - 도구별 identity accent는 SKY(var(--accent-sky) / var(--accent-sky-soft)), bookmarks와 동일(둘 다 dev 카테고리). Intro 아이콘 타일, 즐겨찾기 별(채움), 스포크 헤더 accent.
    - CTA(주 버튼, 활성 탭)는 brand honey-gold var(--brand) 유지.
    - 태그 배지: 미묘 틴트(accent-sky soft) to 태그 차별화. 시대 배지: 모노크롬(text-muted) to 정리 피하기.
  </accent_usage>
  <surfaces>카드/스포크 = var(--surface) + 1px var(--hairline); 스포크 헤더 radius --radius-xxl; 카드 radius --radius-lg; 태그/시대 배지 pill var(--surface-muted). 소프트 brand 틴트 섀도우.</surfaces>
  <typography>H1 Gmarket Sans(clamp 28–40px); 인물명 헤드라인(카드 18–20px / 스포크 32–36px)/700; knownFor 15–16px var(--text-secondary); 전기 16px/1.6; 시대/출생 연도 캡션 13px var(--text-muted).</typography>
  <motion>transform/opacity만: 카드 호버 translateY(-2px) 150ms, 스포크 페이드인 150ms on 로드. 모두 prefers-reduced-motion으로 게이팅.</motion>
  <accessibility>카드/별 = 라벨된 진정한 버튼; roving-tabindex 목록; 즐겨찾기 상태 aria-live="polite"; ≥44px 탭 대상; visible focus-visible ring var(--focus-ring); 사진 alt-text; 사진+링크 rel=noopener if 적용. 스포크 빵부스러미 + 관련 인물 링크 semantic.</accessibility>
  <responsive>
    - 허브: 단일 열 — 검색 + 탭 + 카드 그리드(1열 <768px, 2열 768–1023px, 3열 ≥1024px). 카드는 320px에서 절대 오버플로우 안 함.
    - 스포크: 단일 열 — 빵부스러미, 헤더(이름, 사진, 배지), 전기, 업적, 관련, 공유, 고지사항. 사진 반응형 스케일(clamp 폭). 320px에서 수평 스크롤 없음.
  </responsive>
  <atmosphere>학술적, 영감 주는 "컴퓨팅을 형성한 인물들": 넉넉한 카드 간격, 업적 축하하는 명확한 전기. 스포크 페이지는 박물관 전시처럼 — 풍부한 전기, 명확한 날짜, 관련 맥락. 밀집한 표가 아님; 각 인물이 존중받음.</atmosphere>
  <icons>lucide-react: 검색, 별/별 없음(즐겨찾기), 달력/시계(시대/연도), 지도핀(nationality), 사용자(관련), 외부링크(links), X(지우기). 기본 20px(스포크에서 16–18px), stroke 1.75, currentColor. 레지스트리 카드 아이콘: `Users`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="콘텐츠는 자사 마크다운이지만 방어적">
    - Name/knownFor/전기는 텍스트 노드 또는 안전 마크다운으로 렌더됨(React 이스케이프 via <Markdown> 컴포넌트). dangerouslySetInnerHTML 금지.
    - 링크는 `<a href={url} rel="noopener target="_blank" />`로 렌더됨(외부, 안전). 생성기는 사진 + 링크 유효성 검사(http(s)만, javascript: 또는 data: 없음).
    - 생성기는 zod로 머리말 유효성 검사(타입/필수/길이/URL 포맷/태그 어휘).
  </input>
  <privacy>즐겨찾기/최근 로컬스토리지만, 절대 전송 안 함. 분석 이벤트는 인물/태그 데이터를 조회 개수 넘어 포함하지 않음.</privacy>
  <content_integrity>카탈로그는 빌드타임 정적 산출물(원격 페치 없음); 단위 테스트는 파생 유효성 검사, 유니크성, 로케일 완성도.</content_integrity>
  <note>시크릿 없음, 네트워크 접근 없음, 3rd-party 스토리지 없음.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>별 고정 + 최근 본(로컬스토리지) — 반복 검색 마찰 감소. 알 수 없는 slug 자동 제거.</favorites_recents>
  <keyboard_first>"/" 검색, 화살표 탐색, Enter 열기, "f" 즐겨찾기 — 마우스 프리 파워(허브).</keyboard_first>
  <structured_data>Person + BreadcrumbList JSON-LD 스포크별(schema.org Person: name, description, birthDate, deathDate, jobTitle, knowsAbout, sameAs=[Wikipedia, GitHub if applicable]; BreadcrumbList for SEO 빵부스러미) — AI 크롤러는 인물 프로필 인식(GEO 발견성 = DESIGN 원칙 ③).</structured_data>
  <hub_and_spoke_seo>허브(SPA)는 SEO 셸(정적 Intro/HowTo/FAQ + FAQPage JSON-LD). 스포크는 인물별 발견성 페이지(Person 스키마, 풍부한 전기, BreadcrumbList, 정본/hreflang) — 인물 프로필에 거쳐 집단 SEO 가치. Sitemap 및 llms.txt는 허브와 스포크 라우트 모두 나열.</hub_and_spoke_seo>
</advanced_functionality>

<seed_people_13>
  1. Andrej Karpathy (1986–, US/SK, tags: ai/deep-learning/education) — Tesla AI 감독, OpenAI 공동창립자, CS231n.
  2. Robert C. Martin (1952–, US, tags: clean-code/architecture/agile) — Clean Code 저자, SOLID, Agile 선언서 서명자.
  3. Richard Stallman (1953–, US, tags: free-software/c/linux) — GNU/FSF 창립자, GPL 저자, Emacs 작성자.
  4. James Gosling (1955–, CA, tags: java) — Java 발명가.
  5. Erich Gamma (1961–, CH, tags: design-patterns/java) — GoF Design Patterns, Eclipse JDT, VS Code.
  6. Kent Beck (1961–, US, tags: tdd/agile/design-patterns) — TDD 선구자, XP 창립자, JUnit 작성자.
  7. Martin Fowler (1963–, UK, tags: refactoring/architecture/agile) — Refactoring 저자, Agile 선언서 서명자.
  8. Linus Torvalds (1969–, FI, tags: linux/git/c) — Linux 발명가, Git 작성자.
  9. Yann LeCun (1960–, FR, tags: ai/deep-learning) — CNN 선구자, Meta AI 최고, 튜링상.
  10. Geoffrey Hinton (1947–, UK/CA, tags: ai/deep-learning) — 역전파 선구자, Deep Learning 아버지, 튜링상 + 노벨 물리학.
  11. Brendan Eich (1961–, US, tags: javascript/web) — JavaScript 발명가, Mozilla/Brave 창립자.
  12. Guido van Rossum (1956–, NL, tags: python) — Python 발명가.
  13. 조코딩 (Jo Dong-geun, birthYear 공개 안 함, KR, tags: education/youtube/ai) — 코딩 교육자, YouTube 채널 "조코딩".

  (각 인물 2–4단락 전기 마크다운 본문 + 영문 번역; achievements/books 구조화; links 한⟷영 쌍 포함; 13명 × 2 = 26 스포크 페이지 SSG 기대값)
</seed_people_13>

<final_integration_test>
  <test_scenario_1>
    <description>마크다운 폴더 → 허브 목록 + 스포크 페이지 자동 생성</description>
    <steps>
      1. grace-hopper.md + grace-hopper_en.md가 content/dev-people/people/에 존재하며 name, knownFor(≥50자), birthYear(선택), tags, era, nationality, achievements, books 가짐.
      2. pnpm dev → predev 생성기 실행 → dev-people.generated.json이 grace-hopper 병합 레코드 보유(한⟷영 name, knownFor, biography_body, achievements, books, tags).
      3. /ko/tools/dev-people 방문 → 허브 목록이 "그레이스 호퍼" 카드 렌더(시대 배지 "1960–1980", 태그 배지 like "c", "architecture").
      4. 카드 클릭 또는 /ko/tools/dev-people/grace-hopper 방문 → 스포크 SSG 페이지 로드: H1 "그레이스 호퍼", 출생(1906), 사망(1992), 나이 "향년 86세", 사진/아바타, 전기 SSR'd, 업적 타임라인, Person+BreadcrumbList JSON-LD in `<head>`, 고지사항 푸터.
      5. 신규 쌍 추가(e.g., ada-lovelace), 다시 빌드 → 허브 자동 업데이트, 신규 스포크 페이지 자동 생성.
      6. 쌍 누락 또는 knownFor <50자 또는 invalid 연도 또는 unknown 태그 → 생성기가 파일 경로/사유 보고, 0이 아닌 코드로 종료(빌드 실패).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>허브 검색, 태그/시대 필터, empty 상태</description>
    <steps>
      1. 검색 입력에 "Hopper" 입력 → 일치 인물로 좁혀짐; 결과 개수 업데이트; aria-live 공시.
      2. "c" 태그 탭 클릭 → c-tag 인물만(Hopper, Ritchie 등).
      3. "1960–1980" 시대 탭 클릭 → 복합 필터(c AND 1960–1980).
      4. "asdfqwer" 입력 → empty "'asdfqwer'에 해당하는 인물이 없어요" + 지우기; 지우기로 전체 목록 복구.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>스포크 페이지 — 전기, 업적, JSON-LD, 관련 탐색, 고지사항</description>
    <steps>
      1. /ko/tools/dev-people/grace-hopper 방문 → 페이지 로드: 이름, 출생(1906) / 사망(1992), 나이 "향년 86세", "US", 배지(c, architecture, 1960–1980).
      2. 전기 섹션: 마크다운 본문(소개, 일화) SSR'd via <Markdown>.
      3. 업적 섹션: 1952/1959 등의 타임라인 제목.
      4. 저서 섹션: 제목/연도/url 목록.
      5. 관련 섹션: alan-turing, ada-lovelace 링크(관련 slug) → 클릭해서 스포크 페이지 탐색.
      6. 푸터: 고지사항 "이 정보는 편집자가 정리한 것으로…"
      7. 브라우저 DevTools: `<meta name="description" … />` + `<link rel="canonical" href="…/grace-hopper" />` + `<link rel="alternate" hreflang="en" href="…/en/tools/dev-people/grace-hopper" />` 존재.
      8. JSON-LD in `<script type="application/ld+json">`: Person(name, description, birthDate "1906-12-09", deathDate "1992-01-01", nationality "US", jobTitle/knowsAbout, sameAs URL) + BreadcrumbList.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>즐겨찾기, 최근 본, 허브 지속성, 키보드, a11y</description>
    <steps>
      1. 허브에서 2개 인물 카드 클릭 → "최근" 탭 MRU로 나열.
      2. 카드 별 클릭 → "즐겨찾기" 탭이 표시; 별 채워짐(aria-pressed=true).
      3. 허브 새로고침 → 즐겨찾기/최근 지속(로컬스토리지); 알 수 없는 slug 제거(카탈로그 변경됨).
      4. "/" → 검색 포커스; 화살표 카드 탐색; Enter 스포크 열기(네비게이트); axe 통과 → a11y 위반 없음.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, 사진/아바타, 나이 표시, SEO(JSON-LD, sitemap, GEO), 로케일 전환</description>
    <steps>
      1. /en 전환 → 허브 크롬(탭/검색/how-to/FAQ) 영문; 카드명 영문; 업적/책 제목 영문; 나이 표시 "age 86" 포맷(영문 로케일).
      2. build prod → /ko/tools/dev-people과 /en/tools/dev-people 유니크 title/description/정본/hreflang; 스포크 페이지 미러(로케일당 26 스포크 URL).
      3. HTML `out/sitemap.xml`이 허브 라우트 + 13명 스포크 × 2 로케일 포함(27 dev-people URL: 1 허브 + 26 스포크).
      4. 각 스포크 HTML이 SoftwareApplication + FAQPage(허브) + Person JSON-LD(스포크) 있으며 url==정본; FAQ 항목이 가시 콘텐츠와 정렬.
      5. 사진 있음 → `public/images/dev-people/grace-hopper.jpg` + "Wikimedia Commons, 퍼블릭 도메인" 크레딧 렌더. 없음 → 머리글자 아바타(GH, 파랑/sky 배경).
      6. 나이 표시: birthYear만 → "만 86세"; deathYear → "향년 86세"; birthYear 없음 → (나이 생략).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>극중요: content 폴더에 `<인물>.md` + `<인물>_en.md` 쌍을 떨어뜨리면, 다시 빌드할 때 허브 목록 + 신규 스포크 페이지에 자동 반영; 코드 변경 0. 생성기가 쌍/구조/참조 유효성 검사(tags 어휘, achievements/books 개수+연도 일치, 사진 파일 존재, photoCredit 있음 if 사진, birthYear 선택적이지만 나이 파생 정확), 위반 시 명확한 메시지로 빌드 실패.</content_model>
  <hub_functionality>검색 가능 인물 목록(양로케일, 검색 우선, name+aliases+knownFor+tags); 태그/시대 탭 필터(구성 가능, 제어된 어휘 tags); localStorage 즐겨찾기 + 최근; 시드 13명 × 한⟷영 쌍. 허브는 순수 SPA(라우트 탐색 없음).</hub_functionality>
  <spoke_functionality>개별 인물 스포크 페이지 SSG'd via generateStaticParams(26 페이지). 전기 SSR'd 마운팅 게이트 바깥(크롤러가 풍부 텍스트 봄). Person JSON-LD + BreadcrumbList + 정본/hreflang 스포크별. 관련 인물 탐색(도구 내 링크). 고지사항 푸터 존재. 나이 표시(만/향년) birthYear/deathYear로 정확.</spoke_functionality>
  <user_experience>허브에서 검색/필터 즉시; 카드 320px 읽을 수 있음; ≥44px 대상; visible 포커스; 스포크 페이지 빠른 로드(SSG, JS 하이드레이션 지연 없음); 스포크 빵부스러미 + 관련 링크 명확. 사진/아바타 표시 일관(로컬 파일 또는 머리글자 폴백). 고지사항 명확 및 눈에 띄지 않음.</user_experience>
  <technical_quality>lib/dev-people/* 순수 ≥ 80% 단위 커버리지(schema/merge/slug/search/favorites/birthdate); 생성기 유효성 검사 테스트(pair-missing, dupe-slug, dangling-related, year-sanity, tag-vocab, achievements-count-mismatch, photo-missing, photoCredit-missing → 실패); TS 0 에러; <800줄/파일; 카탈로그 코드 스플릿, i18n 번들 bloat 없음. 스포크 라우트 generateStaticParams 테스트(26 파라미터 생성).</technical_quality>
  <visual_design>DESIGN.md 준수; sky identity + brand honey-gold CTA; 깔끔한 인물 카드(읽을 수 있음, 포커스 상태, 사진/아바타), 학술적 스포크 페이지(넉넉한 전기 공백, 명확한 날짜, 관련 맥락). 마크다운 렌더링 안전(HTML injection 없음).</visual_design>
  <accessibility>허브: 전체 키보드(roving 목록, "/", Enter, "f", Esc); aria-live 상태; 라벨된 버튼; 모션 존중; WCAG 2.1 AA. 스포크: semantic HTML(빵부스러미, 헤드라인, 목록), 사진 alt-text, 링크 affordances, 고지사항 visible.</accessibility>
  <performance>허브 라우트 플랫폼 예산 내; 스포크 페이지 예산 내(정적 HTML + Person JSON-LD, minimal CSS); CLS 영향 없음; LCP < 2.5s; 카탈로그 동적 임포트(코드 스플릿).</performance>
  <seo_geo>허브 + 26 스포크 라우트 모두 sitemap(27개 총) with hreflang 대체. Person JSON-LD + BreadcrumbList 스포크별. FAQ/Intro 허브. 모든 전기 텍스트 정적 HTML(마운팅 게이트 없음). llms.txt는 dev-people 컬렉션 포함. Sitemap 테스트는 27 URL 확인.</seo_geo>
</success_criteria>

<build_output>
  <note>플랫폼(pnpm build)의 일부로 빌드됨. `prebuild` 훅이 generate-dev-people.mjs를 실행해 dev-people.generated.json 새로고침. 허브 `/[locale]/tools/dev-people`은 플랫폼 generateStaticParams로 레지스트리 순회하여 사전 렌더. 스포크 라우트 `/[locale]/tools/dev-people/[person]`은 도구별 generateStaticParams로 dev-people.generated.json 순회하여 사전 렌더(13명 × 2 로케일 = 26 스포크).</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — ONE 항목 추가. 'dev' 카테고리는 이미 'sky' accent로 존재; 카테고리 변경 불필요.
    {
      id: 'dev-people',
      slug: 'dev-people',
      category: 'dev',
      icon: 'Users',
      accent: 'sky',
      status: 'live',
      isNew: true,
      order: 19,  # bookmarks(18) 후, 필요시 튜닝
      keywords: ['개발자','인물사전','소프트웨어','역사','프로그래머','여성과학자','Dennis Ritchie','Grace Hopper','Ada Lovelace','개발 역사','선구자','developer','biography','history','computer','pioneers','figures'],
    },
    ```
    또한 라우트에서 slug→component 분기(허브: `<DevPeople/>`, 스포크: `/[person]` 서버 컴포넌트) 및 generateMetadata 분기(허브 + 스포크, 스포크는 Person JSON-LD + BreadcrumbList 포함) 추가.
  </platform_registry_change>
  <route_structure>
    ```typescript
    // src/app/[locale]/tools/dev-people/
    ├── page.tsx                 # 허브 라우트; DevPeople 클라이언트 컴포넌트 임포트
    ├── [person]/
    │   └── page.tsx             # 스포크 라우트; 서버 컴포넌트
    │                             #   - exports generateStaticParams() → { person, locale }[] (26 파라미터)
    │                             #   - exports generateMetadata(props) → Person JSON-LD와 함께 Metadata
    │                             #   - dev-people.generated.json에서 직접 페치
    │                             #   - <PersonSpoke person={person} locale={locale} /> 렌더
    │                             #   - 전기는 마운팅 게이트 바깥 SSR'd
    ```
  </route_structure>
  <critical_paths>
    1. 콘텐츠 파이프라인: 마크다운 스캔 → gray-matter → zod → mergePair → 유효성 검사(tags/achievements/books/photo/photoCredit/year-sanity/count-match) → dev-people.generated.json.
    2. 쌍/정본 병합 규칙(한국어 tags/era/nationality/achievements/books 정본, 영문 상속) + slug 유니크성 + 관련 참조 무결성 + 연도 건전성 + 태그 어휘 + 사진 파일 존재.
    3. 검색(양로케일, 분음부호/대소문자 무시, aliases+tags 포함) + 태그+시대 필터 구성.
    4. 허브 즐겨찾기/최근 → 스포크 탐색(카드 클릭이 최근 업데이트, slug 저장).
    5. 나이 표시 로직: birthYear+생존 → "만 N세"; birthYear+사망 → "향년 N세"; birthYear 없음 → 생략.
    6. **Sitemap 통합**: app/sitemap.ts는 dev-people 카탈로그 임포트 및 26 스포크 URL 추가(플랫폼 관심사이지만 도구가 allPeople 내보냄).
  </critical_paths>
  <testing_strategy>순수 Vitest ≥80%(schema/merge/slug/search/favorites/birthdate); 생성기 유효성 검사 픽스처(pair-missing/tag-invalid/<50-chars/year-invalid/photo-missing/photoCredit-missing/count-mismatch 케이스); 컴포넌트 카탈로그 주입 모의; E2E 시나리오 1–5(특히 #1 폴더→허브→스포크, #3 전기/JSON-LD/고지사항, #5 sitemap); localStorage jsdom 격리. 스포크 라우트 테스트: generateStaticParams가 26 파라미터 반환(13명 × 2 로케일); Person JSON-LD 렌더 HTML에 존재; 고지사항 푸터 존재.</testing_strategy>
  <lms_txt_update>`public/llms.txt` 컬렉션 섹션에 `dev-people` 도구 slug 추가(AI 크롤러용 도구 발견).</lms_txt_update>
</key_implementation_notes>

</project_specification>
```
