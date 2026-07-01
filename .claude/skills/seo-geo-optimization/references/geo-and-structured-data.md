# GEO · 구조화 데이터 상세 레퍼런스

> `seo-geo-optimization` 스킬의 부속 참조. 구조화 데이터 코드·AI 크롤러 정책·llms.txt를 실제 배선할 때 읽는다. 값/토큰은 `docs/SPEC.md`·`lib/seo.ts` 실제 구현을 단일 소스로 따른다.

## 목차
1. AI 크롤러 UA 표 + robots 정책
2. llms.txt 형식
3. JSON-LD 레시피 (schema.org 타입별)
4. 도구별 title/description 규격
5. 답변 우선(answer-first) 콘텐츠 템플릿

---

## 1. AI 크롤러 UA 표 + robots 정책

Jurepi는 **노출을 원한다** → 평판 있는 AI 크롤러를 막지 않는다. 현재 `app/robots.ts`는 `userAgent: '*'` allow라 이미 전부 허용된다. 아래는 **의도를 명시**하고 실수로 차단하지 않기 위한 참조(명시 규칙을 추가할 수도, allow-all을 유지할 수도 있다 — 결정은 리더).

| UA 토큰 | 엔진/용도 | 정책 |
|---------|-----------|------|
| `GPTBot` | OpenAI 학습 크롤러 | allow |
| `OAI-SearchBot` | ChatGPT Search 색인 | allow |
| `ChatGPT-User` | ChatGPT 사용자 브라우징(실시간 fetch) | allow |
| `PerplexityBot` | Perplexity 색인 | allow |
| `Perplexity-User` | Perplexity 사용자 fetch | allow |
| `ClaudeBot` | Anthropic 크롤러 | allow |
| `anthropic-ai` / `Claude-SearchBot` | Anthropic 검색/색인 | allow |
| `Google-Extended` | Gemini/Vertex 그라운딩·학습(SERP와 별개 토큰) | allow (노출 원함) |
| `Applebot-Extended` | Apple AI | allow |
| `CCBot` | Common Crawl(다수 LLM 학습 소스) | allow |
| `Bingbot` | Bing/Copilot | allow |

주의:
- `Google-Extended`를 disallow하면 SERP엔 뜨지만 **Gemini/AI Overviews 그라운딩에서 빠질 수 있다** → 노출 목표와 상충. 막지 않는다.
- allow-all(`*`)로 충분하나, 명시 블록을 둘 거면 각 UA를 개별 rule로. `disallow`는 `/admin`·비공개만.
- `robots.ts`는 정적 익스포트에서 `export const dynamic='force-static'` 필요(이미 적용). 실제 프로덕션 헤더/robots가 살아있는지는 배포본 `curl`로 확인(deploy-engineer 게이트).

robots 확장 예(명시 정책을 원할 때):
```typescript
// app/robots.ts — allow-all 유지가 기본. 명시하려면 rules 배열로.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/.well-known/security.txt'] },
      // AI 크롤러를 명시적으로 환영(선택 — allow-all에 이미 포함됨)
      { userAgent: ['GPTBot','OAI-SearchBot','PerplexityBot','ClaudeBot','anthropic-ai','Google-Extended','CCBot'], allow: '/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

## 2. llms.txt 형식

`/llms.txt`(사이트 루트)는 LLM에게 사이트 지도를 주는 신흥 표준. `public/llms.txt`로 정적 서빙(정적 익스포트가 `public/`을 그대로 복사). 마크다운, 답변 우선.

```markdown
# Jurepi

> 무료 온라인 도구 허브. 설치·회원가입 없이 브라우저에서 바로 쓰는 작은 도구들(사다리타기, 신조어 사전, 1일1질문 등).

## Tools
- [사다리타기 (Ghost Leg)](https://apps.jurepi.kr/ko/tools/ladder): 참가자와 결과를 넣고 공정한 사다리로 무작위 배정. 추첨·제비뽑기.
- [신조어 용어사전 (New Word)](https://apps.jurepi.kr/ko/tools/new-word): MZ 유행어·최신 기술 용어를 뜻·예문과 함께 한/영으로.
- [1일1질문 (Q&A a Day)](https://apps.jurepi.kr/ko/tools/qna-a-day): 매일 하나의 질문에 답하며 쌓는 질문 일기.

## About
- 운영: 주레피(개인). 무료·광고 기반. 백엔드/DB 없는 정적 사이트.
```

- 도구가 추가되면 이 파일도 갱신(레지스트리 파생 생성 스크립트로 자동화 가능 — platform-engineer). 수기 유지 시 새 도구 체크리스트에 포함.
- 영문 방문자를 위해 `en` URL도 병기하거나 별도 섹션 고려.

## 3. JSON-LD 레시피 (schema.org 타입별)

`lib/seo.ts`에 이미 `softwareApplicationJsonLd`·`faqPageJsonLd`가 있다. 아래는 추가로 필요한 타입. 모두 `url`은 `absoluteToolUrl(locale, slug)`를 받아 canonical과 일치시킨다. 클라이언트 섬이 아니라 **셸(SSR)에서** `<script type="application/ld+json">`로 렌더.

**WebApplication(대화형 도구에 SoftwareApplication보다 적합할 때):**
```typescript
{ '@context':'https://schema.org', '@type':'WebApplication', name, description, url,
  applicationCategory:'UtilityApplication', operatingSystem:'Any', browserRequirements:'Requires JavaScript',
  offers:{ '@type':'Offer', price:'0', priceCurrency:'USD' }, inLanguage: locale }
```

**HowTo(단계형 도구 — 사다리 등):**
```typescript
{ '@context':'https://schema.org', '@type':'HowTo', name, description,
  step: steps.map((s,i)=>({ '@type':'HowToStep', position:i+1, name:s.name, text:s.text })) }
```

**DefinedTermSet + DefinedTerm(용어/사전형 — new-word):**
```typescript
{ '@context':'https://schema.org', '@type':'DefinedTermSet', name, url,
  hasDefinedTerm: terms.map(t=>({ '@type':'DefinedTerm', name:t.term, description:t.definition,
    inDefinedTermSet:url, /* termCode:t.slug */ })) }
```
> new-word는 이 타입이 핵심 GEO 자산 — AI가 "이 신조어의 뜻"을 우리 페이지에서 인용하게 만든다. 용어가 많으면 상위 N개만 넣거나 대표 항목을 선별(HTML 비대화 방지).

**BreadcrumbList(홈 → 도구):**
```typescript
{ '@context':'https://schema.org', '@type':'BreadcrumbList',
  itemListElement:[
    { '@type':'ListItem', position:1, name:'Jurepi', item:`${siteUrl}/${locale}` },
    { '@type':'ListItem', position:2, name: toolName, item:url },
  ] }
```

**WebSite(+SearchAction) / Organization(사이트 수준 — 홈/레이아웃):**
```typescript
{ '@context':'https://schema.org', '@type':'WebSite', name:'Jurepi', url:`${siteUrl}/${locale}`,
  potentialAction:{ '@type':'SearchAction', target:`${siteUrl}/${locale}?q={query}`, 'query-input':'required name=query' } }
{ '@context':'https://schema.org', '@type':'Organization', name:'Jurepi', url:siteUrl, logo:`${siteUrl}/icon-512.png` }
```

검증: 빌드 후 `out/<locale>/tools/<slug>.html`에서 `application/ld+json` 블록을 꺼내 `JSON.parse` 가능(유효)한지 + `url`이 canonical과 동일한지 확인. Google Rich Results Test/Schema validator로 타입 유효성 교차 확인(선택).

## 4. 도구별 title/description 규격

- **title:** 로케일별 고유. 패턴 `{도구명} — {핵심 효용} | Jurepi`. 길이 ~15–60자(SERP 잘림 방지). 예: "사다리타기 — 공정한 무작위 추첨 | Jurepi".
- **description:** ~70–160자, 답변 우선(무엇을·어떻게·무료). 액션 동사로 시작. 도구 간 중복 금지.
- **OG/Twitter:** `summary_large_image`. 현재 전 도구가 `/og-default.png` 공유 → 가능하면 도구별 OG 이미지(1200×630)로 차별화(선택, 클릭률·공유 노출 개선).
- hreflang: `ko`·`en` + `x-default`(기본 로케일 ko로). `buildToolMetadata`의 `alternates.languages`에 `x-default` 추가 검토.

## 5. 답변 우선(answer-first) 콘텐츠 템플릿

각 도구 Intro/HowTo/FAQ를 LLM이 인용하기 쉽게:

- **Intro 리드:** "{도구명}은(는) {한 문장 정의/효용}이다. {무료·즉시·브라우저}." — 첫 문장이 곧 인용문.
- **HowTo 도입:** "{도구}로 {목표}하려면: 1) … 2) … 3) …" — 단계는 HowTo JSON-LD와 1:1.
- **FAQ:** 질문은 사용자가 실제로 검색/질문하는 자연어("사다리타기는 공정한가요?"), 답변 첫 문장에 직답 후 부연. FAQPage JSON-LD와 텍스트 일치.
- ko/en 동등: 영어 방문자·영어권 AI에도 같은 품질의 직답을 제공(번역투 금지, 자연스러운 영어).
