# i18n · SEO · 동의/광고 · CWV 상세

> `nextjs-ssg-platform` 스킬의 부속 참조. 라우팅·SEO·광고·성능을 실제 배선할 때 읽는다. 모든 토큰/값은 `docs/SPEC.md`를 단일 소스로 따른다.

## 목차
1. 라우트 표
2. generateStaticParams 규칙
3. i18n 메시지 네임스페이스 규약
4. SEO 인프라(메타데이터·JSON-LD·hreflang)
5. 동의 + AdSlot 게이팅
6. CSP · 보안 헤더
7. Core Web Vitals 체크리스트

---

## 1. 라우트 표

| 경로 | 페이지 | 비고 |
|------|--------|------|
| `/` | — | `→ /ko` 307 redirect |
| `/:locale` | HomePage(대시보드) | 히어로+검색+필터+ToolGrid |
| `/:locale/tools/:slug` | ToolPage | live 도구 모듈 마운트 + Error Boundary + in_content AdSlot |
| `/:locale/about` `/privacy` `/terms` `/contact` | 정적 법무/정보 | prose, max-width 720px |
| `/sitemap.xml` | `app/sitemap.ts` | live 도구 × 로케일 + 정적 페이지, 절대 URL |
| `/robots.txt` | `app/robots.ts` | allow + sitemap 참조 |
| `/manifest.webmanifest` | `app/manifest.ts` | maskable 아이콘, theme-color |

규칙: coming_soon 도구는 라우트 없음(카드 비클릭). 미지 slug → 지역화 404(서버 에러 아님). 사다리 공개 slug=`ladder`(내부 코드네임 ghost-leg).

## 2. generateStaticParams 규칙

```typescript
// app/[locale]/tools/[slug]/page.tsx
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    tools.filter((t) => t.status === 'live').map((t) => ({ locale, slug: t.slug }))
  );
}
```
- live 도구 × 로케일만 프리렌더. coming_soon 제외.
- 홈(`[locale]/page.tsx`)도 로케일별 static.
- 빌드 후 검증: `/ko`, `/en`, 그리고 모든 live 도구 페이지가 정적 생성됐는가(qa).

## 3. i18n 메시지 네임스페이스 규약

- 파일: `src/i18n/messages/{ko,en}.json`. **ko/en 키 집합은 항상 동일**해야 한다(qa가 교차 검증).
- 플랫폼 키 + 도구별 네임스페이스 `tools.<id>.*`. 예: `tools.ladder.title`, `tools.ladder.howTo`, `tools.ladder.faq[]`.
- 도구 카드의 name/description은 렌더 시 `messages[`tools.${id}.*`]`에서 해석(레지스트리엔 카피 없음).
- 기본 라벨("참가자 N"/"Player N", "당첨"/"Win")도 카탈로그에. 도메인은 "blank면 채운다"는 규칙만 알고 문자열은 모른다.
- 로케일 전환: path + query 보존, `<html lang>` 갱신.

## 4. SEO 인프라

`lib/seo.ts`:
- `buildMetadata({locale, title, description, path, ...})` → Next `Metadata`. canonical = `NEXT_PUBLIC_SITE_URL` 기준 절대. `alternates.languages`로 ko/en hreflang.
- `websiteJsonLd()` — 홈에 WebSite JSON-LD + OG 기본값.
- 도구 페이지는 자체 SPEC가 요구하는 JSON-LD를 추가: 사다리는 **SoftwareApplication + FAQPage**.
- 각 도구/로케일 페이지: 고유 title·description·canonical·hreflang·OG.

체크: 홈 WebSite JSON-LD, 도구 SoftwareApplication+FAQPage, sitemap에 live 도구×로케일+정적 페이지(절대 URL), robots allow+sitemap, 미지 slug→지역화 404.

**GEO(생성엔진)·도구별 발견성 전략은 여기가 아니라 `seo-geo-optimization` 스킬(seo-geo-engineer 소유).** 이 인프라가 제공해야 하는 것: 요청 시 추가 JSON-LD 헬퍼(HowTo/DefinedTermSet/BreadcrumbList), hreflang `x-default`, `robots`가 AI 크롤러(GPTBot·PerplexityBot·ClaudeBot·Google-Extended·CCBot 등) 미차단, `public/llms.txt` 정적 서빙. **비타협: 메타·JSON-LD·SEO 롱폼은 `mounted` 게이트 밖 SSR** — 게이트 안이면 정적 HTML(크롤러/AI가 읽는 것)에서 사라진다(Q&A a Day 실제 회귀). JSON-LD `url`·canonical·sitemap은 `absoluteToolUrl` 단일 소스.

## 5. 동의 + AdSlot 게이팅

- 첫 방문 → ConsentBanner("수락"/"거부"/"설정"). 선택 → localStorage `jurepi-consent`. 푸터에서 재오픈.
- **consent 게이팅 판정은 순수 도메인**(`lib/consent.ts`): `shouldLoadAds(consent)`, `shouldLoadAnalytics(consent)`.
- AdSlot: 동의 전/거부 시 `<ins>`를 렌더하지 않되 **고정 높이 예약**(leaderboard 90px 모바일/≤250px 데스크톱, footer 90px, in_content ≥250px). 프로덕션 미충전 시 collapse, 절대 레이아웃 시프트 금지.
- AdSense: `next/script strategy="lazyOnload"`, **consent.ads===true 이후에만**. H1 위 광고 금지.
- GA4(옵션): `consent.analytics` 게이트. 이벤트 tool_open/locale_switch/search_query(PII 없음).

## 6. CSP · 보안 헤더

`next.config.ts` headers() 또는 호스트 설정:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM}' https://pagead2.googlesyndication.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  frame-src https://googleads.g.doubleclick.net;
  connect-src 'self' https://www.google-analytics.com;
  object-src 'none'; base-uri 'self';
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
> 카고컬트 금지 — AdSense/GA 도메인은 실제 사용분만. 사용자 입력은 React 이스케이프, `dangerouslySetInnerHTML` 금지.

## 7. Core Web Vitals 체크리스트

| 지표 | 목표 |
|------|------|
| LCP | < 2.5s | FCP | < 1.5s | INP | < 200ms | CLS | < 0.1 | TBT | < 200ms |

- [ ] 모든 이미지 width/height 명시; 히어로만 `loading=eager`+`fetchpriority=high`, 그 외 lazy
- [ ] 광고/동적 콘텐츠 높이 예약(CLS)
- [ ] 폰트 self-host+subset+`font-display:swap`, 주요 weight만 preload, 최대 2패밀리
- [ ] AdSense/GA async/lazyOnload, 동의 후에만
- [ ] 모션은 transform/opacity/clip-path/stroke-dashoffset만
- [ ] 랜딩 JS <150kb gz, CSS <30kb gz
- [ ] 도구 서브트리만 `"use client"`
