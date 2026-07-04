---
name: seo-geo-optimization
description: >-
  Jurepi 도구를 검색엔진(SEO)과 생성엔진(GEO)에 동시에 노출시키는 도구별 발견성 플레이북.
  사람 방문자는 구글/네이버 검색으로, AI(ChatGPT·Perplexity·Gemini·Claude·AI Overviews)는 답변 인용으로 도구를 찾게 만든다.
  도구별 고유 메타(title/description/canonical/hreflang/OG), 구조화 데이터(schema.org JSON-LD: SoftwareApplication·FAQPage·HowTo·DefinedTermSet·BreadcrumbList),
  답변 우선(answer-first) 콘텐츠, `llms.txt`, AI 크롤러 robots 정책, 프리렌더 HTML 노출, CWV, 인용가능성(citability)을 다룬다.
  "SEO", "GEO", "검색 노출", "AI 노출/인용", "구조화 데이터/JSON-LD/스키마", "메타태그/OG", "llms.txt", "sitemap/robots",
  "도구가 검색에 안 뜬다", "AI가 이 도구를 모른다", "발견성/discoverability" 같은 표현에 반드시 사용하라.
  후속: "SEO 다시/보완", "GEO 개선", "이 도구 노출만", "구조화 데이터 추가" 에도 트리거하라.
  "토픽/용어/항목별 페이지 분리", "엔티티 페이지", "허브+스포크", "페이지를 나눠야 하나" 같은 색인 단위(architecture) 질문에도 트리거하라.
---

# SEO · GEO 최적화 — 도구별 발견성 플레이북

Jurepi의 성장 엔진은 **발견성**이다(제품 원칙 ③: 도구별 인덱싱 URL·SEO·CWV). 각 도구는 **두 관객**에게 닿아야 한다:

- **검색엔진(SEO):** 크롤러 → 색인 → SERP → 사람 방문. 목표는 랭킹과 클릭.
- **생성엔진(GEO, Generative Engine Optimization):** AI 답변 엔진(ChatGPT/GPT Search·Perplexity·Google AI Overviews/Gemini·Claude·Bing Copilot)이 우리 콘텐츠를 **읽고, 이해하고, 답변에 인용**. 목표는 "이런 도구가 있다"고 AI가 사용자에게 말하게 만드는 것.

둘은 경쟁이 아니라 **같은 자산(서버 렌더 HTML + 구조화 데이터)을 공유**한다. 잘 만든 SEO 페이지는 GEO의 8할이다. 나머지 2할이 이 스킬의 새 영역(인용가능성·구조화 데이터 풍부화·llms.txt·AI 크롤러 정책)이다.

## 비타협 제1원칙 — 콘텐츠는 프리렌더 HTML에 있어야 한다

**대부분의 크롤러(특히 AI 크롤러 GPTBot·ClaudeBot·PerplexityBot 등)는 JS를 실행하지 않는다.** `mounted` 게이트나 CSR 뒤에 숨은 콘텐츠·JSON-LD는 그들에게 **존재하지 않는다.** Jurepi 도구는 SSG 셸 위 클라이언트 SPA이므로 이 함정이 상시 존재한다(실제 발생: Q&A a Day가 오케스트레이터 전체를 `mounted` 게이트로 감싸 JSON-LD·howTo가 정적 HTML에 0개, 빌드·테스트는 그린).

- **인덱싱·인용 대상(Intro/H1/HowTo/FAQ/정의/JSON-LD/메타)은 `mounted` 게이트 *밖*에서 항상 SSR한다.** localStorage/`new Date()`에 의존하는 인터랙티브 영역만 게이트로 감싼다.
- 검증은 프리렌더 HTML(`out/<locale>/tools/<slug>.html` 또는 `curl`)에서 `application/ld+json`·`<title>`·`hrefLang`(카멜케이스!)·howTo 텍스트를 grep. "화면에 보인다"가 아니라 "정적 HTML에 있다"가 게이트다(integration-qa 시각/SSR 게이트와 연동).

## 도구별 발견성 산출물 (매 도구 필수)

각 live 도구는 아래를 **모두** 갖춰야 한다. 하나라도 빠지면 발견성 미달(HIGH).

1. **고유 메타** — `generateMetadata`로 로케일별 고유 `title`(~15–60자), `description`(~70–160자), `canonical`, `hreflang`(ko/en + x-default), OG/Twitter. 도구 간 중복 금지. `lib/seo.ts`의 `buildToolMetadata` 사용. (함정: `generateMetadata` 미export면 title/OG 전부 없음 — 과거 drift.)
2. **의미론적 본문** — H1 하나(도구명), 논리적 heading 위계, 시맨틱 태그. Intro 리드 1–2문장은 **핵심 질문에 대한 직답**(아래 answer-first).
3. **SSR 롱폼** — "…란?"/"어떻게 쓰나요?"(HowTo)/FAQ를 ko/en 셸에 렌더. 접을 땐 네이티브 `<details>`로 DOM 유지(제거 금지).
4. **구조화 데이터** — 도구에 맞는 schema.org 타입을 **골라** JSON-LD 방출(아래 매핑). `url`은 반드시 `seo.absoluteToolUrl(locale, slug)` — canonical/sitemap과 동일 소스(하드코딩 금지, drift 유발).
5. **sitemap 등재** — `app/sitemap.ts`가 live 도구×로케일을 절대 URL로 포함(레지스트리 파생, 자동). 봇 최적화 규칙은 아래 "sitemap 봇 최적화" 절.
6. **내부 링크** — 관련 도구·카테고리로 연결(크롤 경로 + 문맥 신호). new-word의 `related` 칩처럼.
7. **키워드·엔티티 매핑** — 도구의 **실제 검색 의도**(ko와 en 둘 다)를 title/intro/howTo/FAQ heading에 자연스럽게 반영. 예: 사다리 → "사다리타기·제비뽑기·추첨", vibe coding → "바이브 코딩·AI 코딩". 억지 키워드 스터핑 금지 — 사람이 읽을 문장 안에.
8. **CWV 통과** — LCP<2.5s, CLS<0.1(광고 슬롯 높이 예약), INP<200ms. 랭킹 신호이자 크롤 친화.

## 구조화 데이터 타입 매핑 (도구 성격 → schema.org)

| 도구 성격 | JSON-LD 타입 | 예 |
|-----------|-------------|-----|
| 모든 도구(공통) | `SoftwareApplication` 또는 `WebApplication` (무료=Offer price 0) | 전 도구 |
| FAQ가 있으면 | `FAQPage` | 전 도구(FAQ 필수 권장). **소유=`<Faq>` 컴포넌트 단일 소유**: 가시 `faq.items`(i18n)로 `faqPageJsonLd` 방출, StructuredData/route는 FAQPage를 내지 않는다(중복=SEO 감점). 프리렌더 HTML에 각 도구 FAQPage 정확히 1개(`grep -c '"@type":"FAQPage"'`). 하드코딩 단일 Q 금지 — 가시 FAQ와 항목 일치. |
| 단계형 사용법 | `HowTo` | 사다리(참가자 입력→선 그림→결과) |
| 용어/사전형 | `DefinedTermSet` + 항목별 `DefinedTerm` | new-word(신조어 사전) |
| 인물형 | `Person` (name/description/birthDate[연도 정밀도 가능]/deathDate/nationality/knowsAbout=tags/sameAs=Wikipedia·GitHub/image) | dev-people(개발 인물 사전) 스포크 |
| 모든 도구(경로) | `BreadcrumbList` | 홈 → 도구 |

**JSON-LD 방출 위치 (비타협)**: JSON-LD는 반드시 **본문에 `<script type="application/ld+json">`으로 렌더**한다. Next `generateMetadata`의 `other: {'application/ld+json': ...}`에 넣으면 `<meta name="application/ld+json" content=...>`로 렌더되어 **크롤러가 파싱하지 못한다**(dev-people 실제 결함 — 빌드·tsc 전부 그린인데 스포크 JSON-LD 0개, 리더 프리렌더 grep으로만 적발). 검증: `grep -c '"@type":"Person"' out/<locale>/tools/<t>/<e>.html` ≥1. 또한 **SEO 섹션(Intro/HowTo/Faq/StructuredData)의 소유는 라우트 1곳** — 클라이언트 오케스트레이터 컴포넌트 안에서 또 렌더하면 JSON-LD 이중 방출된다(dev-people에서 FAQPage×2 실측).
| 사이트 수준 | `WebSite`(+SearchAction), `Organization` | 홈/레이아웃 |

- 여러 타입은 `@graph` 배열 또는 다중 `<script type="application/ld+json">`로 함께 방출 가능.
- 신선도: 콘텐츠가 갱신되면 `dateModified`를 넣어 최신성 신호를 준다.
- 구체 레시피(코드)·UA 표·llms.txt 형식은 **`references/geo-and-structured-data.md`를 읽어라.**

## 허브 + 스포크 — 콘텐츠 컬렉션 도구는 엔티티 단위 정적 페이지를 기본 생성

발견성의 단위는 "도구"가 아니라 **"사람이 검색하거나 AI가 인용하는 엔티티"**다. 도구를 두 부류로 나눠 색인 단위를 정한다.

- **인터랙티브 유틸 도구(사다리·url-encoder·speed-quiz 등):** 색인할 "아이템"이 없다 → **단일 페이지**. URL을 쪼개지 마라(얇은 페이지 양산·중복). 이 도구는 도구명 자체가 유일한 검색 엔티티다.
- **콘텐츠 컬렉션 도구(new-word=용어·rankings=랭킹·bookmarks=토픽 등):** 각 아이템이 독립된 검색/인용 엔티티다 → **허브 + 엔티티별 정적 스포크 페이지**(hub-and-spoke). 단일 URL + `mounted` 게이트 뒤 클라이언트 렌더만 두면, 크롤러/AI는 엔티티별 콘텐츠를 못 보고 도구는 제네릭 검색어로만 겨냥된다(전 컬렉션 도구의 상시 병목).

**허브 vs 스포크는 배타가 아니라 병행이다.** 허브(`/tools/<tool>`)는 SPA 탐색·검색을 유지(사용자 브라우징). 스포크(`/tools/<tool>/<entity-slug>`)는 딥링크·검색 표적·AI 인용 대상.

### 스포크 페이지 요건 (엔티티마다 필수)

1. **고유 URL** — `/tools/<tool>/<entity-slug>`, `generateStaticParams`로 빌드타임 정적 생성(로케일×엔티티). *중첩 라우트·정적 생성 메커니즘은 platform-engineer/nextjs-ssg-platform 소유.*
2. **고유 메타** — 엔티티 기반 `title`/`description`/`canonical`/`hreflang`(ko/en/x-default)/OG. 도구 전역 메타 재사용 금지. URL은 `seo.absoluteToolUrl` 계열 단일 소스(엔티티 slug 포함).
3. **게이트 밖 SSR 본문** — 그 엔티티의 **실제 콘텐츠(정의·예문·표·링크·설명)를 `mounted` 게이트 *밖*에서 SSR**. URL만 쪼개고 콘텐츠를 게이트 안에 두면 효과 0(비타협 제1원칙과 동일).
4. **엔티티별 JSON-LD** — 엔티티 타입(`DefinedTerm`/`ItemList`/`Article` 등) + **`BreadcrumbList`(홈 → 도구 허브 → 엔티티)**. `url`==canonical 단일 소스.
5. **허브→스포크 내부 링크** — 허브의 카드/탭이 각 스포크로 링크(크롤 경로 + 링크 에쿼티 전달). 스포크는 관련 엔티티로 상호 링크.
6. **thin-content 가드(분리를 막는 유일한 실질 리스크)** — 각 스포크에 **그 엔티티만의 고유 산문 최소 1문단**(왜 이 항목인지·무엇인지). 링크 몇 개·수치 한 줄짜리 얇은 엔티티는 스포크를 만들지 말고 **허브에만 유지**한다(얇은 페이지는 SEO 감점). new-word(뜻+예문)·rankings(표+출처)는 충족, bookmarks의 얇은 토픽은 선별.

### 우선순위 판단 (검색 수요 × 콘텐츠 두께)

엔티티가 **독립 검색 수요**를 갖고 **thin-content 바를 넘을 때** 분리한다. 예: 신조어 사전=용어(사전은 용어별 URL이 본질, 최우선) > 랭킹(표째 인용, 강함) > 즐겨찾기 토픽(조건부, 얇은 토픽 선별). 서빙 비용은 정적 익스포트라 런타임 0(빌드 산출물만 증가; CF 정적 에셋 2만 파일 한도 전까지 무관).

### 스포크 구현 함정 (실측 — new-word·rankings·bookmarks에서 반복)

리팩터링으로 스포크를 붙일 때 아래 4개가 반복해서 물었다. 매번 리더가 프리렌더 grep·전체 유닛/E2E 재실행으로만 적발함.

1. **허브의 `mounted` 게이트가 스포크 크롤 링크를 프리렌더에서 지운다.** 허브 카드를 스포크 앵커로 만들어도, 허브 인터랙티브 섬이 `{mounted && (...)}` 뒤면 카드(=앵커)가 정적 HTML에 0개 → 허브→스포크 크롤 경로 소실(rankings·bookmarks 실측). **카드 그리드는 게이트 밖에서 SSR한다.** catalog/favorites 훅이 빈 초기값+`useEffect` 로드면 게이트 제거해도 하이드레이션 안전(new-word 패턴). 검증: `out/<locale>/tools/<hub>.html`에 `href="…/<tool>/<slug>"` 앵커 N개 grep.
2. **스포크(SSR SEO 섹션) 컴포넌트는 동기 `useTranslations`, 비동기 `getTranslations` 금지.** 비동기 서버 컴포넌트는 vitest에서 렌더 불가 → 컴포넌트 테스트가 전멸하고 에이전트가 테스트를 삭제해 커버리지 구멍(rankings 실측). setRequestLocale된 서버 컴포넌트는 동기 `useTranslations`로 SSR+테스트 양립(jurepi-tdd와 연동).
3. **상태보관 catalog 모듈은 스포크 라우트에서 무상태 `CATALOG.find`로 조회.** `initCatalog`+모듈 `_catalog`+`byId` 패턴은 라우트가 init을 안 부르면 항상 null → 스포크 404/notFound. 라우트는 import한 배열에 직접 `.find(t=>t.slug===slug)`(bookmarks 실측·CLAUDE.md 기존 결함과 동일 계열).
4. **카드의 `role`/태그를 바꾸면 그 셀렉터로 카드를 찾던 다른 컴포넌트가 조용히 깨진다.** 카드를 `<div role="button">`→`<a>`로 바꾸자 허브 리스트의 키보드 로빙(`querySelectorAll('[role="button"]')`)이 라이브에서 고장(new-word 실측). 카드 구조 변경 후 **전체 유닛 재실행 + 옛 셀렉터(`role="button"`/`querySelector`) grep**(integration-qa 연동). 크롤 앵커화 시 카드=가시 `<a>`, 별표 등 인터랙티브는 앵커 밖 형제(design-system-fidelity "크롤 가능 카드" 절).

## GEO 고유 전술 (SEO 위에 얹는 2할)

1. **답변 우선(answer-first / 역피라미드).** 각 도구 Intro와 각 FAQ 답변은 **첫 문장에서 핵심을 직답**한다. LLM은 자기완결적이고 앞에 놓인 문장을 인용한다. "바이브 코딩은 AI에게 자연어로 지시해 코드를 '느낌'대로 만드는 방식이다." 처럼.
2. **인용가능성(citability).** 명확한 정의, 질문→답 쌍, 구체 숫자/사실, 한 문장 한 아이디어. 모호한 마케팅 문구는 인용되지 않는다.
3. **구조화 데이터 = 기계 가독 엔티티.** 리치 JSON-LD가 있을수록 AI가 "무엇을 하는 도구인지" 확실히 파악해 인용 확률이 오른다(특히 DefinedTermSet 같은 명시적 엔티티).
4. **`llms.txt`.** 사이트 루트 `/llms.txt`에 도구 목록·설명·URL을 마크다운으로 큐레이션해 LLM에게 사이트 지도를 제공(신흥 표준). `public/llms.txt`로 정적 서빙.
5. **AI 크롤러 허용.** Jurepi는 노출을 원하므로 평판 있는 AI 크롤러(GPTBot·OAI-SearchBot·PerplexityBot·ClaudeBot·anthropic-ai·Google-Extended·CCBot 등)를 **막지 않는다.** `robots.ts`의 `*` allow가 이미 허용하지만, **의도를 명시**하고 실수로 차단하지 않는다(표는 reference).
6. **엔티티 일관성·E-E-A-T.** 운영 주체(Jurepi — 개인 운영)와 도구명을 사이트 전반에서 일관되게. About 페이지가 엔티티 신뢰를 준다. ko/en 양쪽 동등 품질.

## sitemap 봇 최적화 (Google Search Console)

`app/sitemap.ts`는 GSC에 제출되는 크롤러용 단일 소스다. 봇이 **신뢰하는** sitemap의 규칙:

1. **전 항목 hreflang alternates** — 모든 `<url>`이 ko/en 전체 대안 세트(`xhtml:link`)를 갖는다. Next.js `MetadataRoute.Sitemap`의 `alternates.languages`로 방출(로케일별 1 entry, 각 entry가 전체 languages 맵 공유). Google은 나열된 URL마다 자기 자신 포함 전 변형 선언을 요구한다.
2. **정직한 lastmod만** — `lastModified: new Date()` 금지. 매 배포마다 전체가 "오늘 수정"으로 찍히면 Google이 lastmod 신호를 **불신·무시**한다(공식 가이드). 실제 콘텐츠 날짜(예: rankings `asOfDate`)가 있을 때만 넣고, 없으면 생략(빈 것이 거짓보다 낫다).
3. **레지스트리·카탈로그 파생** — 항목 수를 하드코딩하지 않는다. live 도구는 `getLiveTools()`, 스포크는 `*.generated.json`에서 유도 → 도구 추가·기존 컬렉션의 엔티티 추가는 자동 등재. **단, 새 스포크 컬렉션 도구는 자동이 아니다**: `app/sitemap.ts`에 그 컬렉션의 `*.generated.json` import + 스포크 순회 블록(`absoluteEntityUrl`)을 직접 추가해야 한다(기존 new-word/rankings/bookmarks 블록 미러). 단위 테스트(`src/app/sitemap.test.ts`)도 같은 소스에서 기대값을 유도한다(새 컬렉션 블록 추가 시 테스트 기대값도 같은 카탈로그에서 유도해 추가).
4. **URL 단일 소스** — 스포크는 `absoluteEntityUrl`, origin은 `NEXT_PUBLIC_SITE_URL`. canonical·JSON-LD와 동일 소스(drift 금지).
5. **검증 게이트** — 빌드 후 `out/sitemap.xml`을 직접 확인: `xmllint --noout`(유효 XML), `grep -c '<url>'`(기대 수), `grep -c 'xhtml:link'`(= URL 수 × 로케일 수), lastmod가 콘텐츠 날짜 항목에만 존재.
6. **GSC 제출** — 배포 후 Search Console → Sitemaps에 `https://apps.jurepi.kr/sitemap.xml` 제출(robots.txt의 `Sitemap:` 라인과 동일 URL). 50,000 URL/50MB 한도 전까지 단일 파일 유지, 초과 시 sitemap index로 분할.

## 검증 (integration-qa와 연동)

발견성은 "주장"이 아니라 **프리렌더 HTML 증거**로 통과시킨다. integration-qa의 "SEO/GEO 발견성 게이트"를 돌려:

- 프리렌더 HTML에 도구별 고유 `<title>`·`<meta name=description>`·`<link rel=canonical>`·`hrefLang`(카멜케이스) 존재
- `application/ld+json`이 존재하고 **유효**(파싱됨) + `url`==canonical==sitemap 항목(동일 소스)
- Intro/HowTo/FAQ 텍스트가 정적 HTML에 존재(= `mounted` 게이트 밖 SSR)
- `/llms.txt` 200 + 해당 도구 등재, `/robots.txt`가 AI 크롤러를 막지 않음, `/sitemap.xml`에 도구×로케일
- CWV(CLS<0.1 등) 회귀 없음

## 경계 (누가 무엇을)

- **플랫폼 인프라(메커니즘) = platform-engineer:** `lib/seo.ts` 빌더, `app/{sitemap,robots,manifest}.ts`, `public/llms.txt` 서빙, `generateMetadata` 배선, JSON-LD 헬퍼 구현. "어떻게 방출하는가."
- **도구별 전략·GEO(내용) = seo-geo-engineer(이 스킬 소유자):** 도구마다 **어떤** 메타 카피·키워드·구조화 데이터 타입·답변 우선 콘텐츠가 필요한지 명세하고, 발견성 게이트로 검증. "무엇을 노출하는가."
- **콘텐츠 카피(ko/en) = ui-engineer/i18n** 이 작성하되, seo-geo-engineer가 요구사항(길이·답변 우선·키워드)을 준다.
- 중복 소스 금지: 메타/구조화 데이터의 URL은 항상 `seo.absoluteToolUrl` 단일 소스.

## 신규 도구 발견성 체크리스트 (복붙 게이트)

```
[ ] generateMetadata: 로케일별 고유 title/description/canonical/hreflang(ko/en/x-default)/OG
[ ] H1 하나 + 의미론적 heading + Intro 답변 우선 리드(ko/en)
[ ] HowTo + FAQ를 SSR 셸에(mounted 게이트 밖), 네이티브 <details> 접힘
[ ] JSON-LD: 공통 SoftwareApplication + FAQPage + (해당 시 HowTo/DefinedTermSet/BreadcrumbList)
[ ]   → url = seo.absoluteToolUrl(locale, slug) (canonical/sitemap과 동일)
[ ] sitemap 등재 — 도구 페이지=자동(getLiveTools 파생)·기존 컬렉션의 엔티티=자동(*.generated.json 파생). **새 스포크 컬렉션 도구는 자동 아님**: `app/sitemap.ts`에 그 컬렉션의 `*.generated.json` import + 스포크 순회 블록(absoluteEntityUrl) 직접 추가 + `sitemap.test.ts` 기대값도 같은 소스에서 유도(기존 new-word/rankings/bookmarks 블록 미러) + 관련 도구 내부 링크
[ ] 키워드·엔티티를 ko/en 검색 의도에 맞춰 카피에 반영(스터핑 금지)
[ ] /llms.txt에 도구 등재, robots가 AI 크롤러 미차단
[ ] CWV: CLS<0.1, LCP<2.5s / 프리렌더 HTML에 콘텐츠·JSON-LD 실재(curl grep 증거)
[ ] 컬렉션 도구? → 엔티티별 스포크 페이지(고유 URL/메타/게이트밖 SSR/BreadcrumbList/허브 내부링크) + thin-content 가드 통과
```

## 이전 산출물이 있을 때

- 기존 도구의 메타/JSON-LD가 있으면 회귀 없이 증분 보강(타입 추가·답변 우선 리라이트).
- "이 도구 노출만" 요청이면 해당 도구의 체크리스트만 돌리고 프리렌더 HTML로 증거를 남긴다.
- 같은 결함(예: mounted 게이트로 JSON-LD 누락)이 반복되면 nextjs-ssg-platform/integration-qa에 예방 규칙을 추가하도록 리더에게 제안.
