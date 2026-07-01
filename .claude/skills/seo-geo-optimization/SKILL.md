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
5. **sitemap 등재** — `app/sitemap.ts`가 live 도구×로케일을 절대 URL + `lastModified`로 포함(레지스트리 파생, 자동).
6. **내부 링크** — 관련 도구·카테고리로 연결(크롤 경로 + 문맥 신호). new-word의 `related` 칩처럼.
7. **키워드·엔티티 매핑** — 도구의 **실제 검색 의도**(ko와 en 둘 다)를 title/intro/howTo/FAQ heading에 자연스럽게 반영. 예: 사다리 → "사다리타기·제비뽑기·추첨", vibe coding → "바이브 코딩·AI 코딩". 억지 키워드 스터핑 금지 — 사람이 읽을 문장 안에.
8. **CWV 통과** — LCP<2.5s, CLS<0.1(광고 슬롯 높이 예약), INP<200ms. 랭킹 신호이자 크롤 친화.

## 구조화 데이터 타입 매핑 (도구 성격 → schema.org)

| 도구 성격 | JSON-LD 타입 | 예 |
|-----------|-------------|-----|
| 모든 도구(공통) | `SoftwareApplication` 또는 `WebApplication` (무료=Offer price 0) | 전 도구 |
| FAQ가 있으면 | `FAQPage` | 전 도구(FAQ 필수 권장) |
| 단계형 사용법 | `HowTo` | 사다리(참가자 입력→선 그림→결과) |
| 용어/사전형 | `DefinedTermSet` + 항목별 `DefinedTerm` | new-word(신조어 사전) |
| 모든 도구(경로) | `BreadcrumbList` | 홈 → 도구 |
| 사이트 수준 | `WebSite`(+SearchAction), `Organization` | 홈/레이아웃 |

- 여러 타입은 `@graph` 배열 또는 다중 `<script type="application/ld+json">`로 함께 방출 가능.
- 신선도: 콘텐츠가 갱신되면 `dateModified`를 넣어 최신성 신호를 준다.
- 구체 레시피(코드)·UA 표·llms.txt 형식은 **`references/geo-and-structured-data.md`를 읽어라.**

## GEO 고유 전술 (SEO 위에 얹는 2할)

1. **답변 우선(answer-first / 역피라미드).** 각 도구 Intro와 각 FAQ 답변은 **첫 문장에서 핵심을 직답**한다. LLM은 자기완결적이고 앞에 놓인 문장을 인용한다. "바이브 코딩은 AI에게 자연어로 지시해 코드를 '느낌'대로 만드는 방식이다." 처럼.
2. **인용가능성(citability).** 명확한 정의, 질문→답 쌍, 구체 숫자/사실, 한 문장 한 아이디어. 모호한 마케팅 문구는 인용되지 않는다.
3. **구조화 데이터 = 기계 가독 엔티티.** 리치 JSON-LD가 있을수록 AI가 "무엇을 하는 도구인지" 확실히 파악해 인용 확률이 오른다(특히 DefinedTermSet 같은 명시적 엔티티).
4. **`llms.txt`.** 사이트 루트 `/llms.txt`에 도구 목록·설명·URL을 마크다운으로 큐레이션해 LLM에게 사이트 지도를 제공(신흥 표준). `public/llms.txt`로 정적 서빙.
5. **AI 크롤러 허용.** Jurepi는 노출을 원하므로 평판 있는 AI 크롤러(GPTBot·OAI-SearchBot·PerplexityBot·ClaudeBot·anthropic-ai·Google-Extended·CCBot 등)를 **막지 않는다.** `robots.ts`의 `*` allow가 이미 허용하지만, **의도를 명시**하고 실수로 차단하지 않는다(표는 reference).
6. **엔티티 일관성·E-E-A-T.** 운영 주체(Jurepi — 개인 운영)와 도구명을 사이트 전반에서 일관되게. About 페이지가 엔티티 신뢰를 준다. ko/en 양쪽 동등 품질.

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
[ ] sitemap 등재(자동) + 관련 도구 내부 링크
[ ] 키워드·엔티티를 ko/en 검색 의도에 맞춰 카피에 반영(스터핑 금지)
[ ] /llms.txt에 도구 등재, robots가 AI 크롤러 미차단
[ ] CWV: CLS<0.1, LCP<2.5s / 프리렌더 HTML에 콘텐츠·JSON-LD 실재(curl grep 증거)
```

## 이전 산출물이 있을 때

- 기존 도구의 메타/JSON-LD가 있으면 회귀 없이 증분 보강(타입 추가·답변 우선 리라이트).
- "이 도구 노출만" 요청이면 해당 도구의 체크리스트만 돌리고 프리렌더 HTML로 증거를 남긴다.
- 같은 결함(예: mounted 게이트로 JSON-LD 누락)이 반복되면 nextjs-ssg-platform/integration-qa에 예방 규칙을 추가하도록 리더에게 제안.
