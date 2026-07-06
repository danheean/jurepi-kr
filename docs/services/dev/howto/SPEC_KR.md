# 하우투 가이드 — 마크다운 가이드 컬렉션 렌더러 — 서비스 SPEC

> 이 문서는 **국문 번역본**입니다. **정본(AI 소비 기준)은 영문 [`SPEC.md`](SPEC.md)** 이며, 어느 쪽이든 바뀌면 둘을 동기화해야 합니다.
>
> **하우투 가이드**(How-To Guides) 빌드 명세 — "클로드 코드 설치하는 법", "API 토큰 발급하는 법" 같은 단계별 실전 가이드를 **마크다운 파일**로 작성하고, **이미지·머메이드(Mermaid) 다이어그램·구문 강조 코드 블록**을 완전하게 렌더링해 보여주는 큐레이션 컬렉션 도구. 콘텐츠는 마크다운 쌍(`<slug>.md` + `<slug>_en.md`)으로 관리하며, 빌드 타임 생성기가 폴더를 스캔·검증해 정적 카탈로그로 굽는다. 도구는 **허브 + 스포크(hub + spoke)** 구조로 마운트된다 — 탐색/검색용 클라이언트 SPA 허브(`/tools/howto`) + 가이드 1개당 정적 스포크 페이지(`/tools/howto/<slug>`)가 본문 전체를 렌더링.
> 내부 코드명: `howto`. 레지스트리 id: `howto`. 공개 URL slug: `/[locale]/tools/howto`.
>
> **핵심 원칙 — 재사용, 중복 금지.** 이 도구는 사실상 새로운 아키텍처를 거의 도입하지 않는다. (a) 기존 마크다운 컬렉션 파이프라인(생성기 + gray-matter + zod, `generate-glossary.mjs`/`generate-dev-people.mjs` 미러), (b) 기존 허브+스포크 SEO 헬퍼(`src/lib/seo.ts`), (c) 기존 공유 `<Markdown>` 컴포넌트(`src/components/markdown/Markdown.tsx`) — **하위 호환으로 확장**하며 교체하지 않음, (d) 기존 즐겨찾기/최근·검색·`ShareButtons`·i18n 패턴을 재사용한다. 유일한 순수 신규 코드는 **공유 Markdown 모듈 안에** 추가되는 세 가지 렌더링 능력(코드 강조·머메이드·리치 이미지)뿐이며, 이로써 전 도구가 혜택을 본다. 나머지는 통상적인 1도구 배선(레지스트리 1항목, 라우트 분기, sitemap 블록)뿐.
>
> 이 SPEC은 **도구 자체**를 다룬다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참조 형제 SPEC(동일 컬렉션 + 허브/스포크 패턴): [`docs/services/text/new-word/SPEC.md`](../../text/new-word/SPEC.md), [`docs/services/dev/dev-people/SPEC.md`](../dev-people/SPEC.md)
> - 확장 대상 공유 렌더러: [`src/components/markdown/Markdown.tsx`](../../../../src/components/markdown/Markdown.tsx)

## 개요

하우투 가이드는 실전 단계별 가이드의 큐레이션 라이브러리다 — "클로드 코드 설치하는 법", "API 토큰 발급하는 법", "git worktree 사용하는 법" 등. 각 가이드는 **마크다운 문서**다: 운영자가 글을 쓰고, 스크린샷을 넣고, 머메이드 흐름도를 그리고, 코드 블록을 넣으면, 도구가 깔끔하고 읽기 좋으며 색인 가능한 페이지로 렌더링한다. 사용자는 허브를 열어 검색/훑기 후 가이드를 탭하면, 복사 가능한 코드와 렌더링된 다이어그램이 있는 완전한 안내를 읽는다.

콘텐츠 모델은 플랫폼의 다른 컬렉션 도구와 동일하다: 가이드는 코드가 아니라 **마크다운 파일**이다. 콘텐츠 폴더에 쌍(`<slug>.md` 국문 + `<slug>_en.md` 영문)을 만들면, **빌드 타임**에 생성기가 폴더를 스캔·프론트매터 파싱·검증해 모든 것(프론트매터 + 원본 마크다운 본문)을 정적·코드 분할 카탈로그(guides.generated.json)로 굽는다. "폴더에 파일을 넣으면 나타난다"가 실제로 성립 — 백엔드·DB·CMS 없이.

New Word(본문 무시, 구조화 프론트매터만 사용)와 달리, **여기서는 마크다운 본문이 곧 제품**이다. 본문은 플랫폼이 여태 렌더링한 적 없는 세 가지를 렌더해야 한다: (1) **이미지**(스크린샷, 지연 로드 + 캡션), (2) **머메이드 다이어그램**(```mermaid 코드펜스 → SVG 흐름도/시퀀스도), (3) **구문 강조 코드 블록**(```bash, ```ts, … → 색상화 + 복사 버튼). 이 세 능력은 **공유 `<Markdown>` 컴포넌트**에 추가되어 플랫폼 전체가 얻는다.

- **핵심(클라이언트 + SSG, 허브+스포크):** 100% 클라이언트/정적. 백엔드·DB·런타임 파일시스템 접근 없음. 카탈로그는 빌드 타임에 마크다운에서 정적 JSON으로 구움. 허브(`/tools/howto`)는 SSG 셸 위 클라이언트 SPA(탐색/검색/즐겨찾기). 가이드마다 `generateStaticParams`로 정적 스포크(`/tools/howto/<slug>`)를 추가 생성하며, 본문 전체는 `mounted` 게이트 밖에서 서버 렌더 → 검색엔진·AI 답변엔진이 색인·인용 가능. 1차 지속성은 localStorage(즐겨찾기 + 최근)뿐, 네트워크 전송 0.
- **핵심(콘텐츠 불변식):** 모든 가이드는 국문·영문 파일 쌍 필수(한쪽만 = 빌드 실패). 각 파일은 비어있지 않은 `title`·`summary`·본문 필수. 구조 메타(`slug`·`topic`·`tags`·`order`·`related`·`updated`·`difficulty`)는 **국문 파일이 정본**, 영문은 없으면 상속. 생성기가 쌍 무결성·로케일별 필수 필드·slug 유일성·`related` 참조 무결성·내부 자산 참조를 검증하고, 하나라도 위반 시 **명확한 메시지로 빌드 실패**(조용한 누락 금지).
- **핵심(SPA 허브, 사용성 최우선):** 허브는 SSG 셸 위 클라이언트 SPA. 탐색·검색·주제 필터·즐겨찾기는 로컬 React 상태로, 라우트 이동 없음. 가이드 열기는 그 **스포크** 페이지(공유·SEO용 실 URL)로 이동해 읽는다. 허브·스포크 모두 색인용 정적 생성.

## 플랫폼 통합

- 허브 라우트: /[locale]/tools/howto (SSG; slug "howto", id "howto", status "live", accent "sky", category "dev").
- 스포크 라우트: /[locale]/tools/howto/[guide] (SSG; guides.generated.json 순회 generateStaticParams로 가이드×로케일당 1페이지 — new-word/[term], dev-people/[person], bookmarks/[topic] 미러).
- 플랫폼 제공(재구현 금지): 앱 셸, ConsentBanner, AdSlot, Toast, 디자인 토큰, i18n 런타임, Error Boundary, lib/seo.ts(메타·JSON-LD 빌더: buildToolMetadata, buildToolEntityMetadata, absoluteEntityUrl, breadcrumbListJsonLd, itemListJsonLd, softwareApplicationJsonLd, faqPageJsonLd), 브레드크럼 + in_content 광고 래퍼, ShareButtons.
- 소비: i18n 네임스페이스 `tools.howto.*`(UI 크롬 문자열 — 가이드 콘텐츠 아님). 플랫폼 i18n 키 계약대로 최상위 `tools.howto.title`/`tools.howto.description`(searchable-tools·푸터·홈카드 소비) 필수.
- 플랫폼 의존(작음 — 새 카테고리 불필요): `'dev'` 카테고리·`'sky'` accent 이미 존재. 변경은 (1) `ToolMeta` 레지스트리 1항목 추가, (2) 허브 라우트에 slug→컴포넌트 분기 + generateMetadata 분기, (3) 스포크 라우트 폴더 `tools/howto/[guide]/` 추가, (4) `src/app/sitemap.ts`에 `content/howto/**` import + 순회 블록 추가(새 스포크 컬렉션은 sitemap 자동 등재 아님 — 명시 배선 필수).
- 공유 컴포넌트 변경(전 도구 혜택): `src/components/markdown/Markdown.tsx`(+ 신규 형제 `CodeBlock.tsx`·`MermaidDiagram.tsx`·`MarkdownImage.tsx`)를 opt-in 코드 강조/머메이드/리치 이미지로 확장. 기본 동작 불변 → new-word·bookmarks·dev-people·restaurant-map 렌더 완전 무영향.

## 범위 경계

**포함(in scope)**
- 마크다운 관리 가이드 카탈로그(쌍: `<slug>.md` + `<slug>_en.md`) `content/howto/guides/`.
- 빌드 타임 생성기(scripts/generate-howto.mjs): 스캔 → gray-matter 파싱 → zod 검증 → 병합(정본 규칙) → 코드 분할 정적 카탈로그(guides.generated.json, **프론트매터 + 원본 본문** 모두 캡처). predev/prebuild 배선.
- **공유 `<Markdown>` 렌더러 확장**(opt-in, 하위 호환):
    (a) 구문 강조 코드 블록(highlight.js, 코드 분할) + 언어 라벨 + 복사 버튼.
    (b) 머메이드 다이어그램(```mermaid → SVG, 동적 import, 테마 대응, reduced-motion; JS 꺼짐/실패 시 소스 펜스 폴백).
    (c) 리치 이미지(지연 로드, max-width:100%, 캡션=alt, 라운드 + hairline 테두리).
- 허브 SPA: 가이드 목록/그리드(카드: 제목·요약·주제 배지·난이도·업데이트일·태그·별표), 검색, 주제 탭, 즐겨찾기/최근, 빈 상태, 키보드 탐색.
- 가이드별 스포크: 브레드크럼, 제목/요약 헤더, 업데이트일 + 난이도 + 읽는 시간, 커버 이미지(선택), 본문 완전 렌더(이미지/머메이드/코드), 관련 가이드 칩, ShareButtons(엔티티 절대 URL), 허브 복귀 링크, in_content 광고.
- 시드 가이드(≥6, 이중언어): install-claude-code, issue-api-token, git-worktree, mcp-server-setup 등 — **최소 1개는 이미지, 최소 1개는 머메이드, 모든 가이드는 코드 블록**을 사용해 세 렌더러를 증명.
- **가이드 작성 템플릿**: 주석 마크다운 템플릿(`_TEMPLATE.md`/`_TEMPLATE_en.md`) + 작성 README(프론트매터, 이미지/머메이드/코드 삽입법, 자산 배치).
- 검색: 제목·요약·태그·주제(양 로케일), 실시간 필터(디바운스), 대소문자/발음구별기호 무시.
- 즐겨찾기 + 최근(localStorage, 미지 slug 자동 prune).
- 허브 키보드 지원("/" 검색, 화살표, Enter, Esc).
- SEO/GEO: 허브 SoftwareApplication + FAQPage + ItemList; 스포크마다 TechArticle(schema.org Article 하위형) + BreadcrumbList; 가이드/로케일별 고유 메타; 도구별 롱폼 intro + FAQ(ko/en). 본문은 mounted 게이트 밖 서버 렌더.
- reduced-motion 폴백; WCAG 2.1 AA.

**제외(out of scope)**
- 앱 셸·헤더/푸터·로케일·테마·동의·광고·sitemap/robots 메커니즘·레지스트리 메커니즘(전부 플랫폼).
- **라이브 붙여넣기 미리보기 플레이그라운드**(사용자가 마크다운 입력 → 미리보기). 이 도구는 큐레이션된 운영자 작성 컬렉션을 렌더하며 임의 사용자 입력 아님. (명시적으로 컬렉션 모델 채택.) 라이브 샌드박스는 별도 미래 도구.
- 브라우저 내 가이드 추가/편집 UI(런타임 CMS). 편집은 저장소 마크다운 파일로만.
- 로그인/계정/기기 간 동기화/댓글/조회수.
- 마크다운 본문 내 임의 raw HTML/`<script>`(주입 금지, markdown-to-jsx `disableParsingRawHTML: true` 유지).
- 가이드 **본문** 전문 검색(MVP 검색은 제목/요약/태그/주제만; 본문 색인은 Phase 2).
- 단일 `updated` 날짜를 넘는 가이드별 버전/변경이력.

**향후 고려**
- 본문 전문 검색 + 페이지 내 헤딩 점프/TOC — Phase 2.
- "가이드 전체 마크다운 복사"/인쇄용 뷰 — Phase 2.
- 카탈로그 성장 시 가이드 섹션 그룹화 허브 — Phase 2(스키마 불변).
- 라이브 마크다운 미리보기 샌드박스(별도 도구) — Phase 3.
- 안전한 embed 오버라이드로 동영상(YouTube) — Phase 3.

## 기술 스택

- **상속:** Next.js 15 App Router(정적 export), React 19, TS strict, Tailwind v4 + DESIGN 토큰, next-intl(ko/en).
- **콘텐츠 소스:** `content/howto/guides/` 마크다운 쌍. 파일시스템 접근은 빌드 타임(생성기)만. 이미지는 `public/images/howto/` 정적 서빙, 마크다운에서 절대 사이트 경로(`/images/howto/install-claude-code/step-1.png`)로 참조.
- **프론트매터 파싱:** gray-matter v4.x(기존 devDependency). **원본 본문 문자열을 그대로** 카탈로그에 보존.
- **검증:** zod(기존). 파일 프론트매터 스키마 + 병합 레코드 불변식.
- **마크다운 렌더:** 공유 `<Markdown>`(markdown-to-jsx v9.8.2, 기존) 재사용. markdown-to-jsx는 실 JSX로 렌더 → 본문이 정적 프리렌더 HTML에 나타남(색인 가능). 상호작용(코드 복사, 머메이드 SVG)은 요소 오버라이드로 클라이언트 섬 계층, 산문을 `mounted` 게이트로 막지 않음.
- **코드 강조:** highlight.js v11.11.x(**신규**). 확장 Markdown `code`/`pre` 오버라이드 내부에서만. 언어는 큐레이션 서브셋(bash, shell, ts, tsx, js, json, python, yaml, diff, plaintext, http, sql)으로 번들 제한. 코어 + 명시 언어 등록, **동적 import(코드 분할)** → howto 라우트만 비용 부담. 강조는 렌더 타임(서버) 정적 토큰 스팬, 복사 버튼만 클라이언트 섬.
- **머메이드:** mermaid v11.x(**신규**). 클라이언트 전용, **동적 import**(`await import('mermaid')`), ```mermaid 펜스가 있을 때만. 무겁기(~500KB) 때문에 전역 번들·타 라우트 진입 금지 — 스포크의 다이어그램 섬 마운트 시 지연 import. 테마는 `data-theme`(light/dark)에서 초기화, `startOnLoad:false`, 수동 `render()`, `securityLevel:'strict'`, reduced-motion 존중. 렌더 실패/JS 꺼짐 시 원본 소스 펜스 유지(정직한 폴백, 소스는 GEO용 프리렌더 HTML에 존재).
- **클립보드:** 코드 "복사"는 navigator.clipboard.writeText → 히든 textarea execCommand 폴백 → 둘 다 실패 시 조용히 실패. 성공 표시는 실제 성공 시에만(거짓 성공 금지).
- **애니메이션:** 네이티브 CSS 트랜지션만(카드 hover, 스포크 페이드). 머메이드 정적 출력 외 애니 라이브러리 없음.
- **번들 예산(핵심):** highlight.js·mermaid는 반드시 코드 분할 → 전역 JS 예산·비-howto 라우트 무영향(빌드 출력 검증: 공유 청크 미증가; 머메이드 청크는 다이어그램 있는 스포크에서만 로드). new-word 카탈로그 코드 분할과 동일 규율.

## 콘텐츠 작성 모델

```
content/howto/
├── _TEMPLATE.md            # 신규 가이드 국문 템플릿(주석; 생성기가 "_" 접두 제외)
├── _TEMPLATE_en.md         # 신규 가이드 영문 템플릿
├── README.md               # 작성 가이드(프론트매터·이미지·머메이드·코드·자산 배치)
└── guides/
    ├── install-claude-code.md        # 국문 정본(구조 메타 정본)
    ├── install-claude-code_en.md      # 영문
    ├── issue-api-token.md
    ├── issue-api-token_en.md
    └── …
public/images/howto/
    ├── install-claude-code/step-1.png …   # 가이드 스크린샷(/images/howto/... 경로로 참조)
    └── …
```

- **쌍 규칙:** 파일명 베이스(`_en` 제외)가 쌍 키. `_` 접두는 무시. 한쪽만(영문/국문 단독) → 생성기 **에러 + 빌드 실패**(정본-쌍 정책, 조용한 제외 금지). ASCII 파일명 베이스 필수(URL/slug 안정성).
- **공유 메타 규칙:** 구조 메타(`slug`·`topic`·`tags`·`order`·`related`·`updated`·`difficulty`·`coverImage`)는 국문 파일 정본, 영문은 없으면 상속·있으면 일치(검증). 로케일 콘텐츠(`title`·`summary`·본문)는 파일별 독립.

**국문 템플릿 프론트매터(예):**
```yaml
title: 클로드 코드 설치하는 법
slug: install-claude-code
summary: |
  macOS·Windows·Linux에서 Claude Code CLI를 설치하고 첫 실행까지 마치는 단계별 안내.
topic: setup                 # setup | ai-tools | git | api | cli | deploy
tags: [claude-code, cli, 설치]
order: 1
updated: 2026-07-06          # ISO. sitemap lastmod + "업데이트" 라벨 구동.
difficulty: beginner         # beginner | intermediate | advanced
coverImage: /images/howto/install-claude-code/cover.png
related: [issue-api-token, mcp-server-setup]
```
본문은 `## 준비물`, ```mermaid 흐름도, ```bash 코드, `![alt](/images/howto/…/step-1.png)` 등 실제 마크다운.

## 파일 구조

```
scripts/generate-howto.mjs                    # 빌드: 스캔 → gray-matter → zod → 병합 → guides.generated.json(프론트매터 + 원본 본문). predev/prebuild. generate-glossary/dev-people 미러.
content/howto/{_TEMPLATE(_en).md, README.md, guides/*.md, *_en.md}
public/images/howto/**                         # 가이드 스크린샷/커버(정적)
src/lib/howto/                                  # 순수 도메인 — React/Next 무의존, 완전 단위테스트
├── schema.ts   # zod GuideFileFront(ko/en), MergedGuide, StoreSchema + STORE_VERSION
├── merge.ts    # mergePair(ko{front,body}, en{front,body}): 정본 규칙 → MergedGuide; validatePair
├── slug.ts     # slugify, resolveSlug
├── catalog.ts  # 무상태 접근: allGuides(catalog), byId(catalog, slug), byTopic, topics; related 무결성; readingTime(body)
├── search.ts   # filterGuides(guides, query, locale): 제목+요약+태그+주제(양 로케일); 정규화
└── favorites.ts# 불변 ops: toggleFavorite, pushRecent(max), pruneUnknown
src/components/markdown/                        # 공유 렌더러 — 확장(전 도구 혜택)
├── Markdown.tsx        # 기존; opt-in props 추가: enableCodeHighlight?/enableMermaid?/enableRichImages? (기본 false → 기존 호출부 불변)
├── CodeBlock.tsx       # 신규: 펜스 코드 → highlight.js 토큰 + 언어 라벨 + 복사 버튼(복사는 클라 섬)
├── MermaidDiagram.tsx  # 신규: ```mermaid → 동적 import mermaid → SVG; 테마 대응; reduced-motion; 소스 펜스 폴백
├── MarkdownImage.tsx   # 신규: <img> 오버라이드 → 지연·max-w-full·캡션(alt)·라운드·hairline
└── (기존 + 신규 테스트)
src/components/tools/howto/
├── Howto.tsx           # 허브 오케스트레이터(Client) — 주제/쿼리/선택 상태 + useHowto() 소유
├── useHowto.ts         # 훅: 동적 카탈로그 import + localStorage 즐겨찾기/최근 + 파생 필터
├── GuideSearch.tsx / TopicTabs.tsx / GuideList.tsx / GuideCard.tsx  # 허브 UI(카드 루트 = 스포크로의 가시 <a>)
├── HowtoSpoke.tsx      # 스포크 본문(Server): 브레드크럼·헤더·커버·<Markdown enableCodeHighlight enableMermaid enableRichImages>{body}</Markdown>·관련·ShareButtons·복귀
├── HowtoIntro/HowTo/Faq/StructuredData.tsx  # 허브 SEO 섹션(FAQPage 단일 소유=Faq)
└── data/guides.generated.json               # 생성 산출물 [MergedGuide...](프론트매터 + 원본 본문). 재현성 위해 커밋.
src/app/[locale]/tools/howto/[guide]/page.tsx  # 스포크 라우트: generateStaticParams(전 slug×로케일) + generateMetadata(buildToolEntityMetadata) + TechArticle/BreadcrumbList JSON-LD + <HowtoSpoke>. ShareButtons=absoluteEntityUrl.
src/app/sitemap.ts                             # 추가: guides.generated.json import·순회 → absoluteEntityUrl 항목(hreflang + updated lastmod).
src/lib/seo.ts                                 # 추가: techArticleJsonLd(guide, locale)(breadcrumbListJsonLd/itemListJsonLd/absoluteEntityUrl 재사용).
src/i18n/messages/{ko,en}.json                 # tools.howto.*(최상위 title/description + 검색/탭/빈상태/howto/faq/share/breadcrumb) — 가이드 콘텐츠 아님
```

## 핵심 데이터 엔티티

- **GuideFileFront(파일 프론트매터 파스 단위):** title(필수·비어있지않음), summary(필수·평문·≤200자 권장), slug?(ASCII·국문 정본), topic?(setup/ai-tools/git/api/cli/deploy·국문 정본), tags?, order?(기본 999), updated?(ISO), difficulty?(beginner/intermediate/advanced), coverImage?(/images/howto/…), related?(다른 slug). 불변식: title/summary/본문 비어있지 않음. zod 실패 → 에러 수집(빌드 실패 후보).
- **MergedGuide(ko+en 병합; 카탈로그 레코드; generated.json 항목):** slug(유일), topic, tags[], order, updated?, difficulty?, coverImage?, related[](카탈로그 내 실 slug만·누락 시 에러), ko{title,summary,body}, en{title,summary,body}(body=원본 마크다운 문자열). 불변식 — 쌍/필드/유일성/참조/자산: ko+en 모두 존재; 로케일별 title/summary/본문 비어있지 않음; slug 유일; related 실 slug; 참조된 로컬 이미지(coverImage + 본문 `/images/howto/…`) 디스크 존재. 위반 → 생성기 빌드 실패(명시 에러 + 파일/필드 보고).
- **Topic:** id(setup/ai-tools/git/api/cli/deploy·고정 순서), 라벨=tools.howto.topics.<id>. 가상 탭: all/favorites/recent.
- **HowtoStore(localStorage 단일):** version(STORE_VERSION=1), favorites[](삽입순), recents[](MRU·RECENTS_MAX=20·중복제거), meta{lastTopic?, createdAt}. 키 `jurepi-howto`. 불변식: 읽기 zod 파스·실패 시 fresh(throw 금지); 미지 slug 로드 시 prune.
- **상수:** RECENTS_MAX=20; SEARCH_DEBOUNCE=120ms; CARD_SUMMARY_CLAMP=2줄; TOAST_MS=1600ms; READING_WPM=200.
- **기본값:** 신규 사용자 즐겨찾기/최근 없음; 활성 탭 "all"; 허브 정렬 주제 순서 → order asc → updated desc.

## 라우트

- `/:locale/tools/howto` — 허브(플랫폼 라우트 slug→컴포넌트 분기).
- `/:locale/tools/howto/:guide` — 스포크(전용 라우트 + generateStaticParams).
- 로케일 ∈ {ko, en}. 허브 SSG=플랫폼 generateStaticParams(레지스트리 "live"). 스포크 SSG=스포크 라우트 자체 generateStaticParams(guides.generated.json 전 slug × 양 로케일). 허브에서 가이드 열기 = 스포크 URL로 이동(공유·색인). 허브 카드는 실 크롤 가능 `<a>`, 클릭은 progressive enhancement.

## 페이지·인터페이스 요지

- **HowtoIntro:** eyebrow "개발 도구"/"DEV TOOL"; H1 "하우투 가이드"/"How-To Guides"(Gmarket Sans clamp 28–40px); 리드 "클로드 코드 설치, 토큰 발급 같은 실전 가이드를 이미지·다이어그램·코드와 함께 단계별로 읽어보세요."
- **GuideSearch:** 풀폭 입력, 선두 Search 아이콘, placeholder "제목·주제·태그로 검색 (예: 클로드 코드, 토큰, git)"; "/" 포커스; 디바운스 120ms; 결과수 aria-live.
- **TopicTabs:** "전체" → 주제 라벨(고정순) → "즐겨찾기" → "최근"; 활성=브랜드 채움; role="tablist"; 좁은 화면 스크롤+스냅; 검색과 합성.
- **GuideList/GuideCard:** 반응형 1/2/3열(320–767/768–1023/≥1024). **카드 루트 = 가시 `<a href="/{locale}/tools/howto/{slug}">`**(display:none 금지; 카드 전체가 링크; 기본 내비게이션). 별표는 앵커 **밖** 형제 `<button>`(button-in-anchor 무효), 우상단. 제목·주제 배지·난이도·업데이트일·요약 2줄 클램프·태그 ≤3. hover translateY(-2px)·focus-visible 링·별표 팝. 로빙 탭인덱스; Enter/Space=카드 링크 따라감; "f"=즐겨찾기. 빈 상태 3종.
- **스포크 페이지:** 단일 읽기 컬럼 max-width ~760px 중앙. 브레드크럼(Home ▸ How-To Guides ▸ {title}, BreadcrumbList JSON-LD). 헤더(H1 clamp 26–36px, 요약 body-lg, 메타=업데이트일 + 난이도 + "{n}분 읽기"[READING_WPM], ShareButtons=엔티티 절대 URL + 제목). 커버(coverImage 시 풀폭·라운드·hairline·above-the-fold라 eager+fetchpriority·aspect 박스로 CLS 방지). **본문**=공유 `<Markdown enableCodeHighlight enableMermaid enableRichImages>`, 무조건 렌더(SSR·프리렌더 HTML — GEO/SEO 핵심)·mounted 게이트 밖. 헤딩 h2/h3/h4(앵커 id), 문단/목록/인용/인라인 코드(기존 오버라이드). 관련 칩(스포크 링크·미지 slug 숨김). 복귀 링크. in_content 광고.
- **CodeBlock(신규 공유):** 펜스 언어(```bash 등, `lang-xxx`). highlight.js 렌더 타임 토큰(프리렌더 HTML). 컨테이너 surface-sunken·radius-md·hairline·overflow-x·mono. 헤더 스트립: 언어 라벨(좌) + "복사" 버튼(우, 클라 섬) → clipboard → 체크 + "복사됨"/"Copied" 1.6s·실패 조용. 미지 언어=plaintext(무크래시). 긴 줄 블록 내 가로 스크롤(페이지 본문 가로 스크롤 없음).
- **MermaidDiagram(신규 공유):** ```mermaid 펜스. SSR이 원본 소스를 `<pre><code>`로 방출(가시 폴백 + 색인 텍스트). 클라 섬이 마운트 시 동적 import(다이어그램 있을 때만) → 테마(light 'default'/dark 'dark') 초기화·`startOnLoad:false`·`securityLevel:'strict'`·`render()` → SVG 교체. 성공=중앙 SVG·max-w-full·넓으면 가로 스크롤·테마 변경 시 재렌더. 실패/JS 꺼짐/reduced-motion=소스 펜스 유지("다이어그램 소스"/"Diagram source" 라벨)·무크래시(에러 catch, Error Boundary로 안 던짐). **핵심: 머메이드 코드 분할 — 다이어그램 있는 스포크에서만 청크 로드, 허브·타 도구 로드 금지.**
- **MarkdownImage(신규 공유):** `<img>` 오버라이드 max-w-full·h-auto·라운드·hairline·loading="lazy"·decoding="async". alt 있으면 `<figure>`+`<figcaption>`(캡션 var(--text-muted) 중앙). 소스는 동일 출처 `/images/howto/…`·https만 허용(방어). 알려진 내재 크기 시 aspect 박스, 아니면 min-height 예약(CLS 방지).
- **키보드:** 허브 "/" 검색, 화살표 카드 이동(Home/End), Enter/Space 스포크 열기, "f" 즐겨찾기, Esc 검색 클리어. 스포크는 브라우저 기본 스크롤/앵커, 코드 "복사"는 버튼. 터치 비활성, 전부 탭 가능.

## 핵심 기능

- **생성(빌드, generate-howto.mjs — generate-glossary/dev-people 미러):** guides/ 스캔(`_` 제외)·베이스명 ko/en 그룹 → gray-matter `{data, content}` · zod GuideFileFront.validate + content 비어있지 않음 → mergePair(정본 규칙·resolveSlug) → 검증(쌍/필수+본문/slug유일/related/자산존재 → 실패 시 process.exit(1) 파일·필드·사유) → 정렬(주제→order asc→updated desc→제목) → guides.generated.json(프론트매터 + 원본 ko/en 본문). 결정론(Date/random 없음). predev/prebuild 배선.
- **카탈로그 접근(무상태 — init-catalog 버그류 회피):** allGuides(catalog), byId(catalog, slug), byTopic, topics, readingTime(body). 스포크 라우트는 카탈로그 직접 사용(import → find). **상태보관 모듈 init 금지**(bookmarks 교훈: 라우트가 init 잊으면 byId null). 테스트: 유일성·related 무결성·로케일 완전성.
- **검색:** filterGuides(guides, query, locale): 공백=원본; 아니면 정규화(trim·NFC·소문자·발음구별기호 제거) 후 ko/en title·summary·tags·topic 중 매칭. 안정 순서. (본문 미검색 MVP.) 주제 탭과 합성.
- **즐겨찾기/최근(불변):** toggleFavorite·pushRecent(max=20, 앞으로 이동·중복제거·절단)·pruneUnknown. 최근 push=스포크 마운트 시(가이드 열림). 허브 검색/hover 미유발.(허브는 스포크가 쓴 store에서 최근 읽음)
- **지속 어댑터 useHowto:** 마운트=동적 카탈로그 import·`jurepi-howto` 읽기 zod·prune·실패 fresh·localStorage 없으면 인메모리 세션. 변경=디바운스 setItem·quota/security catch 인메모리 유지. **discrete 즐겨찾기 토글은 즉시 persist**(연속 타이핑만 디바운스 — 플랫폼 교훈). 노출: 필터 목록·favorites·recents·toggleFavorite·lastTopic.
- **i18n:** UI 크롬은 tools.howto.*(ko/en): 최상위 title/description + 검색/주제/빈상태/난이도/읽는시간템플릿/share/breadcrumb/howto/faq/코드복사/머메이드폴백. 가이드 title/summary/body는 마크다운(generated.json)·i18n 아님. 읽는 시간은 `useLocale()`→Intl 수치 포맷; **i18n 키를 Intl에 넘기지 말 것.**

## 오류 처리

- **빌드:** 나쁜 콘텐츠는 조용히 통과 못 함. 위반마다 파일·필드·사유 stderr + 비정상 종료 → CI/빌드 실패. 쌍 누락·빈 본문·중복 slug·dangling related·참조 이미지 파일 부재 → 하드 실패.
- **검색 무결과:** 쿼리 반향 + "검색 지우기"; 클리어 시 복원.
- **머메이드 렌더 실패:** MermaidDiagram 내부 catch·원본 소스 펜스 유지·Error Boundary로 안 던짐·프로덕션 console.error 억제.
- **코드 복사 실패:** 조용(거짓 성공 금지). 성공 표시는 실제 성공 시만.
- **이미지 부재:** 빌드 검증이 깨진 참조 배포 차단. 런타임 `<img>` onError로 figure 은닉(깨진 아이콘 없음).
- **저장소:** 사설모드/비활성 → 즐겨찾기/최근 인메모리(허브/스포크 완전 동작). 손상 blob → fresh. quota → 인메모리.
- **Error Boundary:** 플랫폼 래핑·렌더 결함 셸 무크래시 재시도.
- 1차 네트워크 호출 없음; 이미지는 동일 출처 정적 자산.

## 미학 가이드(요지)

- **DESIGN.md가 토큰 단일 소스.** accent=SKY(var(--accent-sky)/soft) — dev 내 이 도구 정체성(intro 타일·카드 focus/선택 바·주제 배지 기본 틴트·별표·관련 칩·스포크 헤딩 앵커). CTA(탭 활성·"복사")는 브랜드 honey-gold. accent=정체성, 액션 아님. 주제 배지 per-topic 틴트(sky 정체성 내·AA 대비).
- **표면:** 카드/스포크 surface + hairline; 코드 surface-sunken; radii DESIGN(카드 radius-lg·코드 radius-md); 소프트 브랜드 틴트 섀도.
- **타이포:** H1 Gmarket Sans(28–40px); 스포크 산문 Pretendard 16px/1.7(읽기 편안·기존 Markdown h2/h3/h4/p 토큰 재사용); 코드 mono; 산문 measure ≤~72ch.
- **코드·다이어그램:** 코드=surface-sunken + highlight.js 토큰 색을 DESIGN 안전 색조로 매핑(양 테마 AA). 머메이드=테마 default/dark·surface 카드 내·넓으면 가로 스크롤.
- **모션:** transform/opacity만; 카드 hover 150ms·스포크 페이드 150ms·별표 팝 200ms; reduced-motion 존중; 머메이드 정적.
- **접근성:** 카드 링크+별표=라벨 실 요소; 로빙 탭인덱스; 복사/즐겨찾기 aria-live; ≥44px; focus-visible 링; 코드 블록 언어 announce·복사 버튼 라벨; 이미지 유의미 alt(캡션)·장식은 빈 alt; 머메이드 SVG title/desc·소스 펜스=텍스트 대체; 양 테마 코드 토큰 AA.
- **반응형:** 허브 1/2/3열(320–767/768–1023/≥1024)·탭 스크롤+스냅·320 무overflow. 스포크 단일 중앙 컬럼; 코드/머메이드/표는 자체 overflow-x 컨테이너 내 스크롤; 320px 본문 가로 스크롤 없음.
- **분위기:** 깔끔한 기술 문서 느낌(차분한 읽기 컬럼·선명한 코드·명료한 다이어그램). 허브 매력 카드 + 스포크 집중 읽기. 따뜻·명료한 Jurepi 톤.
- **아이콘:** lucide-react — BookOpen(레지스트리 카드 + intro), Search, Star/StarOff, Copy/Check, ArrowLeft, ArrowUpRight, Hash. 기본 20px, stroke 1.75, currentColor.

## 보안

- markdown-to-jsx `disableParsingRawHTML: true` 유지 — 본문 raw HTML/script 미렌더. 텍스트 노드 React 이스케이프. 이미지 소스 동일 출처 `/images/howto/…`·https만(그 외 스킴 drop). 외부 링크 target=_blank rel="noopener noreferrer"(기존). 생성기 zod 검증(타입/필수/길이) + 자산 존재; 미지 필드 무시. highlight.js는 평문 토큰만(HTML eval 없음). 머메이드 `securityLevel:'strict'`(클릭/raw HTML 금지).
- **클립보드:** 코드 복사=블록 자체 텍스트 writeText·읽기 안 함·사용자 제스처만.
- **프라이버시:** 즐겨찾기/최근 localStorage만·전송 없음. 애널리틱스에 본문 미포함. highlight.js/mermaid는 1차 번들(원격 스크립트 아님) → **CSP 변경 불필요.**
- **콘텐츠 무결성:** 카탈로그 빌드 타임 정적 자산(원격 fetch 없음). 단위테스트가 파생·유일성·로케일 완전성·자산 존재 검증 → 불량 가이드 미배포.
- 시크릿·네트워크·3rd-party 저장소 없음.

## 고급 기능

- **공유 렌더러 확장:** 세 신규 능력(코드 강조·머메이드·리치 이미지)은 공유 markdown 모듈에 opt-in props로 존재. `<Markdown>` 쓰는 기존 도구는 현재 출력 그대로 유지, howto만 opt-in. "재사용·중복 금지"의 구체 실현 — 하나의 렌더러를 더 풍부하게, 전 플랫폼용.
- **허브-스포크 발견성:** 가이드마다 정적·개별 색인 URL + TechArticle/BreadcrumbList JSON-LD + 프리렌더 HTML 본문 전체 → "클로드 코드 설치하는 법"이 검색엔진·AI 답변엔진(GEO)에 인용 가능. 머메이드 소스·코드 텍스트가 하이드레이션 전에도 프리렌더에 존재.
- **읽는 시간:** 본문 단어수/READING_WPM=200 추정·Intl 로케일 수치. 순수 파생·저장 없음.
- **즐겨찾기/최근:** 별표 + 최근(localStorage)·미지 slug prune → 재방문 반복검색 마찰 감소.
- **키보드 우선:** 허브 "/" 검색·화살표·Enter·"f".

## 통합 테스트 시나리오

1. **마크다운 폴더 → 허브+스포크 자동 구성:** 쌍 존재 → 생성기 → generated.json 병합 레코드 → /ko/tools/howto 카드(스포크로 크롤 가능 `<a>`) → 스포크 본문 렌더 → 새 쌍 추가·리빌드 → 허브+새 스포크(코드 편집 0·sitemap 포함) → 한쪽만/빈 본문/중복 slug/dangling/이미지 부재 → 생성기 비정상 종료(빌드 실패).
2. **세 렌더러(이미지·머메이드·코드):** `![alt](…)` → 캡션 있는 테두리 figure·지연 로드; ```mermaid → SVG·테마 토글 재렌더·JS 끄면 소스가 프리렌더 HTML에 보임(view-source); ```bash/```ts → 구문 강조 + 언어 라벨·"복사"가 정확 텍스트 복사·미지 언어 plaintext 무크래시; **머메이드/highlight.js 코드 분할 검증**(머메이드 청크는 이 스포크만·허브/타 도구 없음·공유 JS 불변).
3. **허브 검색·주제·즐겨찾기·최근·키보드:** "토큰" → 좁혀짐·aria-live; 주제 탭 합성; 별표 → "즐겨찾기" 탭·리로드 지속·미지 prune; 두 가이드 열기 → "최근" MRU; "/" 검색·화살표·Enter 스포크·axe 통과·라벨·focus 링.
4. **i18n·share·SEO/GEO(프리렌더 + JSON-LD):** /en 허브+스포크 영어; 프로덕션 빌드 → 허브·스포크 고유 메타/canonical/hreflang/OG 정적; 스포크 프리렌더 HTML=H1·산문·코드 텍스트·머메이드 소스·**TechArticle 1개 + BreadcrumbList 1개(url==canonical)**; 허브=**SoftwareApplication 1 + FAQPage 1 + ItemList 1**; 스포크 ShareButtons 복사=스포크 절대 URL(허브 아님)·X는 제목 포함; /en 스포크 한글 누수 0·읽는시간 로케일화.
5. **강건성:** reduced-motion → 카드 리프트/팝 없음·머메이드 정적; localStorage 비활성 → 인메모리·완전 사용; **기존 `<Markdown>` 도구(new-word·bookmarks·dev-people·restaurant-map) 렌더 동일**(시각 회귀 + 그들 단위/E2E 불변 = 하위호환 증명); 320px 허브 무overflow·스포크 코드/머메이드/표 자체 컨테이너 스크롤·본문 가로 스크롤 없음.

## 성공 기준

- **콘텐츠 모델(핵심):** 쌍(+참조 이미지) 넣고 리빌드 → 코드 편집 0으로 허브 카드 + 정적 스포크 반영; 생성기가 쌍/필드/본문/유일성/참조/자산 검증·위반 시 명확 메시지로 빌드 실패.
- **렌더러(핵심):** 본문이 이미지(지연·캡션)·머메이드(SVG·테마·소스 폴백)·구문 강조 복사 가능 코드 블록 렌더 — **공유 `<Markdown>` 하위 호환 확장**으로 구현·highlight.js+mermaid 코드 분할(전역/타 라우트 번들 미증가).
- **허브-스포크:** 크롤 가능 카드 허브 + 가이드×로케일당 정적·개별 색인 스포크(generateStaticParams)·본문 mounted 게이트 밖 서버 렌더·sitemap 전 스포크(hreflang + updated lastmod).
- **재사용:** 렌더러/컬렉션 파이프라인 중복 0 — generate-* 생성기 패턴·lib/seo 허브/스포크 헬퍼·즐겨찾기/최근·ShareButtons·i18n 계약 재사용; 순수 신규는 세 마크다운 능력 + 1도구 배선뿐.
- **기능:** 시드 ≥6 이중언어(install-claude-code + issue-api-token 포함); localStorage 즐겨찾기/최근(미지 prune·없어도 동작).
- **UX:** 허브 검색/필터 즉시·읽기 편한 스포크 컬럼·≥44px·가시 focus·SPA 허브(탐색 무리로드)·스포크=공유 URL.
- **기술 품질:** lib/howto/* 순수 ≥80%(schema/merge/slug/catalog/search/favorites); 생성기 검증 테스트(쌍누락·중복·dangling·빈본문·이미지부재 → 실패); 신규 markdown 컴포넌트 테스트(코드 강조·머메이드 폴백·이미지 캡션); TS 0·<800줄/파일; 카탈로그+highlight.js+mermaid 코드 분할.
- **시각:** DESIGN 준수·sky 정체성 + honey-gold CTA·실 토큰만(팬텀 금지)·텍스트 노드 렌더(raw HTML 비활성).
- **접근성:** 전 키보드 허브·aria-live·라벨 요소·코드/다이어그램 접근명·모션 존중·WCAG 2.1 AA.
- **성능:** 허브 플랫폼 JS 예산 내(highlight.js/mermaid 허브·공유 청크 부재)·스포크 머메이드 청크 지연·CLS 불변(커버 aspect 예약·광고 높이 예약)·LCP<2.5s.

## 빌드 산출·구현 노트

- **빌드:** 플랫폼 `pnpm build`. prebuild/predev가 generate-howto.mjs로 guides.generated.json 신선화. 허브=플랫폼 generateStaticParams(레지스트리 "live"); 스포크=스포크 라우트 자체 generateStaticParams. highlight.js+mermaid=코드 분할 청크(필요처만 로드).
- **생성 산출물:** guides.generated.json 커밋(결정론·diff 리뷰). 원본 본문 포함(new-word 구조 카탈로그보다 큼) → 이 도구 라우트로 코드 분할 유지(전역 i18n/JS 번들 진입 금지).
- **레지스트리 변경(1항목):** id/slug `howto`·category `dev`·icon `BookOpen`·accent `sky`·status `live`(모듈 완성 전 `coming_soon`)·isNew·order 30(dev 순서 조정)·keywords(하우투·가이드·설치·설정·how to·guide·tutorial·클로드 코드·claude code·토큰 발급·api token·mermaid·다이어그램·코드블록·markdown·문서·매뉴얼·setup). + 허브 라우트 slug→`<Howto/>` 분기 + generateMetadata; 스포크 라우트 tools/howto/[guide]/page.tsx(generateStaticParams + generateMetadata via buildToolEntityMetadata + TechArticle/BreadcrumbList JSON-LD); sitemap content/howto 순회 블록; i18n 최상위 tools.howto.title/description.
- **공유 Markdown 확장(핵심):** `<Markdown>`에 opt-in props enableCodeHighlight/enableMermaid/enableRichImages(기본 false). false(기존 호출부)=현행 오버라이드 맵 그대로(현행 테스트 그린 + new-word/bookmarks/dev-people 시각 회귀 diff로 증명). true=code/pre 오버라이드를 `<CodeBlock>`(```mermaid 감지 시 `<MermaidDiagram>`)로, img를 `<MarkdownImage>`로 스왑. highlight.js·mermaid는 그 자식 컴포넌트 안에서 동적 import → 트리셰이킹/코드 분할로 타 라우트에서 제외.
- **크리티컬 경로:** ① 콘텐츠 파이프라인(스캔→gray-matter[프론트매터+원본 본문]→zod→mergePair→검증[자산 존재 포함]→generated.json·위반 시 빌드 실패) ② 공유 렌더러 확장(opt-in·하위호환·코드 분할·기존 도구 무회귀·타 라우트 무번들증가 증명) ③ 스포크 SSR(본문 mounted 게이트 밖=GEO; TechArticle+BreadcrumbList 단일 소유; sitemap 배선) ④ 허브 크롤 카드(가시 `<a>`·display:none 금지) + 스포크 이동 + 즐겨찾기/최근 공유 store.
- **권장 구현 순서:** 1) lib/howto/* Vitest(RED→GREEN). 2) generate-howto.mjs + 템플릿/README + 시드(install-claude-code·issue-api-token·git-worktree·mcp-server-setup·+2) + public/images/howto/ · 생성기 검증 테스트 · predev/prebuild. 3) 공유 markdown 확장(CodeBlock+MermaidDiagram+MarkdownImage+opt-in props·컴포넌트 테스트·기존 테스트 그린·코드 분할 단언). 4) tools.howto.* 메시지(ko/en). 5) useHowto 훅. 6) 허브(Search+Tabs+List/Card 크롤 앵커·로빙·빈상태 + Intro/HowTo/Faq/StructuredData). 7) 스포크 라우트 + HowtoSpoke(브레드크럼·헤더·커버·세 능력 켠 Markdown·관련·ShareButtons·복귀) + lib/seo techArticleJsonLd + sitemap. 8) 레지스트리 live·허브 slug→컴포넌트+generateMetadata·스포크 generateStaticParams/generateMetadata·E2E 1–5·시각 회귀 320/768/1024 양테마·기존 Markdown 소비자 하위호환 확인.
- **시드 가이드:** setup=install-claude-code(코드+머메이드+스크린샷)·mcp-server-setup; api=issue-api-token(단계+스크린샷); git=git-worktree(코드+머메이드); cli/deploy=운영자 선택 2개. **각 가이드는 코드 블록 필수·≥1은 이미지·≥1은 머메이드.**
- **테스트 전략:** 순수 Vitest ≥80%; 생성기 검증 픽스처(쌍누락/중복/dangling/빈본문/이미지부재→실패); 신규 markdown 컴포넌트 테스트; 기존 Markdown 테스트 불변; 컴포넌트 카탈로그 주입 모의; E2E 1–5(특히 #1 폴더→허브+스포크·#2 세 렌더러+코드분할·#4 프리렌더 JSON-LD 단일소유); 클립보드/localStorage jsdom 격리.
- **리더 시각 게이트:** 320/768/1024 양테마; 허브 무overflow; 스포크 코드/머메이드 렌더 + 가로 스크롤 격리; 머메이드 dark/light 재렌더; 프리렌더 JSON-LD(스포크 TechArticle/BreadcrumbList·허브 SoftwareApplication/FAQPage/ItemList·url==canonical); 코드 분할 검증(머메이드/highlight.js 청크 허브·타 라우트 부재); new-word/bookmarks/dev-people 하위호환 시각 diff.
