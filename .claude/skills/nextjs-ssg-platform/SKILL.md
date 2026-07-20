---
name: nextjs-ssg-platform
description: Jurepi의 Next.js 15 App Router 정적 사이트(SSG) 플랫폼을 구축하는 방법. generateStaticParams, Server/Client 경계, next-intl 로케일 라우팅(ko/en), 레지스트리 기반 동적 도구 라우트, SEO 인프라(sitemap/robots/manifest/JSON-LD/hreflang), AdSense+동의 게이팅, CSP/보안 헤더(앱 내부 next.config), Core Web Vitals. 라우팅·SSG·i18n·SEO·광고·빌드 작업 시 반드시 사용. (Cloudflare Pages 배포·정적 익스포트·_headers/_redirects는 cloudflare-pages-deploy 스킬.)
---

# Next.js SSG Platform — Jurepi 프레임워크 계층

이 스킬은 클린 아키텍처의 **가장 바깥 계층**을 다룬다. 원칙: 프레임워크는 *세부사항*이다. App Router·next-intl·AdSense를 안쪽 계층(도메인/유스케이스) 뒤에서 배선하되, 비즈니스 로직을 페이지/핸들러에 인라인하지 않는다.

## 비타협 제약 (SPEC)

- **SSG only. 백엔드/DB/first-party API 없음.** 모든 페이지는 빌드타임 생성. 레지스트리는 컴파일타임 TS 모듈, 선호/동의는 localStorage.
- **검색 트래픽이 성장 엔진** — 모든 도구는 별도 인덱싱 URL. 메인+쉘은 CWV를 회귀시키면 안 된다(CLS<0.1, 광고 슬롯 높이 예약).
- **NEXT_PUBLIC_* 외 비밀 없음.** 모든 env는 client-safe.

## 골격 빌드 순서

1. **Scaffold:** Next.js 15 + React 19 + TS strict + Tailwind v4(`@tailwindcss/postcss`) + `tokens.css` 브리지 + path alias `@/*`. ESLint(next/core-web-vitals)+Prettier.
   - **Tailwind v4는 v3 `tailwind.config.ts`를 자동 로드하지 않는다.** CSS 엔트리(globals.css)에 `@import "tailwindcss";` + `@config "../../tailwind.config.ts";`를 명시해야 `theme.extend`(색/라운드/그림자/maxWidth)와 content 글롭이 적용된다. 누락 시 **빌드는 그린이지만** `.bg-surface`·`.shadow-card`·`.max-w-container` 등 토큰 유틸이 전부 미생성돼 화면이 무스타일이 된다(실제 발생). 스캐폴드 직후 `.next/static/css/*.css`에 토큰 유틸이 grep으로 존재하는지 확인한다.
   - **테스트 스크립트는 `vitest run`으로 (워치 아님).** `"test": "vitest"`는 비-TTY/CI 셸에서 종료하지 않아 hang처럼 보인다. `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, 워치는 별도 `"test:watch": "vitest"`로 둔다.
   - **coverage 스코프를 `src/**`로 고정.** `include` 없이 두면 `.next/` 빌드 산출물·vendor·config까지 계측돼 수치가 무의미해진다. `vitest.config.ts`: `coverage: { all: true, include: ['src/**/*.{ts,tsx}'], exclude: ['.next/**','**/*.config.*','**/*.d.ts','src/app/**','src/middleware.ts','src/i18n/{routing,request}.ts','**/*.test.*'] }`. 프레임워크 엔트리포인트(app/·middleware·i18n 배선)는 `next build`+E2E가 검증하므로 단위 커버리지 임계에서 제외하고, 제외 사실을 문서화한다.
   - **Vitest와 Playwright의 스펙을 분리한다.** Vitest 기본 include는 `**/*.{test,spec}.*`라 Playwright의 `tests/**/*.spec.ts`까지 수집해 `@playwright/test` import 에러로 `pnpm test`가 exit 1이 된다. `vitest.config.ts`에 `test: { include: ['src/**/*.{test,spec}.{ts,tsx}'], exclude: ['node_modules/**','.next/**','tests/**','e2e/**'] }`로 한정하고, Playwright는 `pnpm exec playwright test`로만 실행한다. Playwright 산출물(`playwright-report/`,`test-results/`)은 `.gitignore`에 넣는다.
2. **i18n 라우팅 먼저 배선** (페이지 짓기 전): `i18n/routing.ts` (locales `["ko","en"]`, defaultLocale `"ko"`, localePrefix `"always"`), `request.ts`, `next.config.ts`에 next-intl 플러그인. `/` → `/ko` 307.
3. **레이아웃 쉘:** root `layout.tsx`(html lang, next/font/local 폰트 변수, flash-free 테마 부트스트랩) → `[locale]/layout.tsx`(Provider 순서 고정).
4. **레지스트리 기반 라우트:** `generateStaticParams`가 `registry.filter(s=>s.status==='live') × locales`. coming_soon은 라우트 없음. 미지 slug → 지역화 `not-found`. **SNS 공유는 도구 페이지 템플릿의 기본 요소** — `[slug]/page.tsx` 브레드크럼 행이 `<ShareButtons />`(`@/components/share`)를 렌더하므로 레지스트리로 추가되는 새 도구는 자동 포함(도구별 재구현·재배선 금지). 단, `[slug]` 밖에 **새 라우트 파일**(엔티티 스포크 등)을 만들면 그 페이지에도 `<ShareButtons />`를 직접 배선해야 한다(기존: new-word/[term]·rankings/[ranking]·bookmarks/[topic] 스포크 배선됨). 채널 구성=네이버·X·페이스북·쓰레드·텔레그램·왓츠앱+링크복사+모바일 네이티브 공유(인스타·카톡 커버, `navigator.share` 지원 시만 노출); URL·제목은 기본적으로 클릭 시점 `location.href`/`document.title`이라 모든 로케일·스포크에서 무설정 동작. **`ShareButtons`는 선택적 `url`/`title` prop 지원** — 지정하면 SNS·링크복사·네이티브 3경로 모두 그 값을 공유(생략 시 기존 클릭 시점 동작). **콘텐츠 컬렉션 도구(허브+스포크)의 허브 상세 패널은 `<ShareButtons url={absoluteEntityUrl(locale, tool, slug)} title={엔티티 제목} />`을 기본 포함한다** — 패널이 보여주는 엔티티는 고유 스포크 URL이 있으므로, prop 없이 두면 허브 URL이 공유되는 오배선이 된다(기존: bookmarks `TopicDetail`·rankings `RankingDetail`·new-word `TermDetail`). 새 컬렉션 도구의 상세 패널도 동일 배선.
5. **SEO/GEO 인프라(메커니즘):** `lib/seo.ts`, `app/sitemap.ts`, `robots.ts`(AI 크롤러 미차단), `manifest.ts`, `public/llms.txt`. JSON-LD 헬퍼는 WebSite/SoftwareApplication/FAQPage 외에 요청 시 HowTo/DefinedTermSet/BreadcrumbList. **sitemap 메커니즘:** 로케일별 entry마다 `alternates.languages`(ko/en 전체 맵)를 실어 `xhtml:link` hreflang을 방출하고, `lastModified`는 실제 콘텐츠 날짜가 있을 때만(빌드 시각 `new Date()` 금지 — Google이 lastmod 불신), 항목은 레지스트리·`*.generated.json`에서 유도. 규칙 상세·GSC 제출은 seo-geo-optimization "sitemap 봇 최적화" 절. **도구별로 무엇을 노출할지(메타 카피·JSON-LD 타입·GEO 답변 우선 콘텐츠)는 seo-geo-engineer가 명세** → `seo-geo-optimization` 스킬. 여긴 그 메커니즘만 만든다.
6. **동의 + 광고:** ConsentBanner → AdSlot(고정 높이) → AdSense lazy.
7. **보안 헤더/CSP** + 법무 페이지.

## Server / Client 경계

- **Server Components 기본.** 상호작용 UI 서브트리만 `"use client"`.
- 도구 페이지는 Server Component가 SEO/레이아웃을 렌더하고, 인터랙티브 도구(예: `<LadderGame/>`)만 클라이언트. → JS 번들 최소화(랜딩 <150kb gz).
- `"use client"`는 가능한 한 잎(leaf)에 가깝게. 큰 Server 트리 위에 client 잎.

### 모든 도구 = SPA, 사용성 최우선 (제품 원칙)

**모든 도구는 단일 페이지 앱(SPA)으로 구현한다 — 쉬운 UX와 사용성이 무엇보다 중요하다.** 사용자는 한 화면 안에서 페이지 이동·새로고침 없이 도구를 끝까지 사용할 수 있어야 한다.

- **패턴:** SSG/SEO 셸(Server Component: 메타·breadcrumb·howTo/FAQ·JSON-LD·광고 슬롯) 위에 도구 본체를 하나의 클라이언트 컴포넌트(SPA)로 마운트한다. 상태·상호작용·결과는 전부 클라이언트에서(useReducer/훅) 처리하고 네비게이션을 강요하지 않는다. (사다리 = `[locale]/tools/[slug]/page.tsx` SSG 셸 + `<LadderGame/>` 클라이언트 SPA가 레퍼런스.)
- **SEO와 SPA를 동시에:** SPA여도 howTo·FAQ 같은 장문 콘텐츠는 셸(SSR HTML)에 남겨 인덱싱되게 한다. 접을 때는 네이티브 `<details>`로 DOM에 유지(콘텐츠 제거 금지).
- **사용성 기본기:** 합리적 기본값·자동 추천(예: 이름/결과 자동 채움)으로 입력 마찰을 줄이고, 도움말은 기본 접힘(필요 시 펼침), 결과는 한 번에 보고/복사보다 **다운로드(이미지)** 같이 바로 쓰는 산출물 제공, ≥44px 탭 타깃·focus-visible·reduced-motion 존중. "한 화면에서 쉽게 끝낸다"가 판단 기준.

## Provider 순서 (고정)

```
NextIntlClientProvider → ThemeProvider → ConsentProvider → ToastProvider
```

테마는 **flash-free**여야 한다: 페인트 전 인라인 스크립트로 localStorage 테마를 읽어 `<html>`에 적용(SSR 깜빡임 방지).

## 레지스트리가 backbone

허브 UI·sitemap·static params·검색이 모두 `src/tools/registry.ts`에서 파생된다. **새 도구 추가 = ToolMeta 엔트리 + `messages.tools.<id>.*` + (live면) 모듈 + slug→컴포넌트 분기 + 자체 SPEC.** 메인 화면을 재설계하지 않는다. coming_soon은 ToolMeta만 있으면 된다.

**아이콘은 registry `icon` 문자열 + `src/components/home/toolStyle.tsx`의 `TOOL_ICONS` 맵 두 곳에 등록해야 한다 — 한쪽만 하면 조용히 Wrench로 폴백한다.** jwt-decoder 실측: registry에 `icon:'KeyRound'`를 넣었으나 `TOOL_ICONS`(lucide import + 맵 객체)에 `KeyRound`를 안 넣어 홈 카드가 Wrench fallback으로 렌더됨. 도구별 유닛·tsc·빌드·프리렌더 전부 그린이고, **`toolStyle.test.tsx`("maps every icon referenced by the tool registry (no Wrench fallback)")=전체 유닛에서만 적발**. 예방=새 아이콘은 `toolStyle.tsx`의 import 블록과 `TOOL_ICONS` 객체 양쪽에 알파벳순 추가 + 리더는 **전체 유닛(도구 스코프가 아니라 `vitest run` 전체)**을 병합/통합 게이트에서 재실행(레지스트리 파생 회귀는 도구 스코프 밖에서 터진다).

**모든 도구는 마스코트 아바타 `public/characters/<slug>.webp`가 있어야 한다 — `ToolCharacter`는 폴백이 없어 없으면 라이브에서 404 + 깨진 이미지다.** cheer 실측: 도구 배선(registry·i18n·route)은 다 됐는데 마스코트 파일이 없어 라이브 콘솔에 `GET /characters/cheer.webp 404`(빌드·유닛·프리렌더 전부 그린 — 정적 에셋은 빌드가 검사 안 함, **리더 라이브 콘솔 게이트로만 적발**). 새 도구 배선 체크리스트에 마스코트 자산 추가: 정식 아트(캐릭터 시트→`scripts/slice-characters.mjs`, 300×300 webp ~12–18KB)가 있으면 그것을, 없으면 사용자에게 요청하거나 임시 플레이스홀더(형제 카테고리 도구 복사)를 넣고 **배포 전 교체 필요를 명시**한다. 소스 PNG는 `docs/resources/jurepi_characters/<slug>.png`에 함께 커밋(추적됨).

## SEO·i18n·동의·광고·CWV 상세

라우팅 표, `generateStaticParams` 정확한 형태, 메시지 네임스페이스 규약, JSON-LD 종류(WebSite/SoftwareApplication/FAQPage), hreflang/canonical, AdSlot 높이·동의 게이팅, CSP 블록, CWV 체크리스트는 분량이 크다 → **`references/i18n-seo-cwv.md`를 읽어라.**

> **SEO는 인프라, GEO는 전략.** 이 스킬/레퍼런스는 SEO *메커니즘*(메타 빌더·sitemap·robots·JSON-LD 헬퍼)을 다룬다. **도구별 발견성 전략과 생성엔진(GEO) 최적화**(어떤 메타·JSON-LD 타입·답변 우선 콘텐츠·llms.txt·AI 크롤러 정책이 필요한가, 프리렌더 HTML 노출 검증)는 **`seo-geo-optimization` 스킬 + seo-geo-engineer**가 소유한다. 핵심 접점: 도구의 메타·JSON-LD·SEO 롱폼은 반드시 `mounted` 게이트 *밖*에서 SSR해야 크롤러/AI에 보인다.

## 검증 (TDD 연계)

- 순수하게 떼어낼 수 있는 것은 도메인/유스케이스로: 검색 매처, 동의 게이팅 판정, 레지스트리 정렬·필터. 이들은 `jurepi-tdd`로 단위 테스트.
- 프레임워크 고유(라우팅 파라미터 생성, SEO 빌더 출력 형태)는 단위 테스트 가능한 만큼 테스트.
- 최종 SSG 산출물(페이지 생성, sitemap 내용, CLS)은 qa-integration이 빌드+E2E+Lighthouse로 검증.

## 흔한 실수

- `"use client"`를 레이아웃 상단에 붙여 트리 전체를 클라이언트화 → 번들 폭증. 잎에 붙여라.
- 광고/동적 콘텐츠에 높이 미예약 → CLS 폭발. 항상 예약.
- 비즈니스 로직을 `page.tsx`에 인라인 → 계층 위반. 도메인 호출.
- 로케일 전환이 query를 버림 → path+query 보존해야 함.
- 폰트를 CDN에서 로드 → self-host+subset+swap, 주요 weight만 preload. (자원 부재 시 CDN+swap은 한시적 허용이되, 목표는 self-host.)
- **`useSearchParams`(+Suspense)로 그리드를 클라이언트 전용 렌더 → SSG/SEO 회귀.** 정적 HTML에서 카드·도구 링크가 사라진다(RSC 페이로드에만 존재, 실제 발생). 초기 상태는 서버에서 기본값으로 렌더하고 그리드를 정적 HTML에 남긴 뒤, URL 동기화는 마운트 후 `window.location.search` 읽기 + `history.replaceState`로 한다(또는 page의 server `searchParams`를 prop으로). `useSearchParams`를 쓰면 정적 페이지가 CSR로 bail-out된다.
- **도구 카드·내비 링크에 `next/link` 사용 → 로케일 프리픽스 누락(→404).** 로케일 프리픽스가 필요한 링크는 `@/i18n/routing`의 next-intl `Link`를 쓴다(`/tools/x` → `/ko/tools/x`). `next/link`의 `locale` prop은 무시된다.
- **선택적 외부 링크/설정을 하드코딩 → `NEXT_PUBLIC_*` 환경변수로.** 패턴: 컴포넌트 *렌더 본문*에서 `const v = process.env.NEXT_PUBLIC_X?.trim()`을 읽고 `v ? <a href={v}>…</a> : <기존>`. 값이 없으면(미설정·빈값·공백) **기존 동작 유지**. `.env.example`에 변수를 문서화(커밋), 실제 값은 gitignored `.env.local`(또는 배포 호스팅 env)에 둔다. 주의: ① **모듈 최상단에서 읽지 마라** — Next는 빌드타임 인라인하지만 vitest에서 `vi.stubEnv`가 렌더 시점 읽기에만 적용된다(테스트로 양 분기 단언하려면 본문에서 읽어야 함). ② `NEXT_PUBLIC_*`는 **빌드타임 인라인**이라 값 변경 시 재빌드 필요. ③ 클릭으로 외부 이동하는 요소(로고/마스코트 등)에는 hover/focus 상태 + reduced-motion 폴백을 디자인한다(`design-system-fidelity`). ④ 로고처럼 관습적 목적지(홈)가 분명한 요소를 외부로 바꾸는 요청은 오해일 수 있으니 한 번 확인한다(이번 세션: 로고 대신 마스코트가 정답이었다).
- **클라이언트 도구 섬을 `if (!mounted) return <skeleton>` 최상위 게이트로 통째 감싸면 SEO 본문·JSON-LD가 프리렌더에서 빠진다.** Q&A a Day에서 hydration mismatch를 피하려 오케스트레이터 전체를 `mounted` 게이트로 감쌌더니 SSG HTML이 스켈레톤뿐 — `SoftwareApplication`/`FAQPage` JSON-LD·howTo·FAQ가 정적 HTML에 0개였다(빌드·테스트 그린). **i18n만 쓰는 정적 콘텐츠(Intro/HowTo/FAQ/JSON-LD/메타)는 `mounted` 게이트 밖에서 항상 렌더**(클라이언트 컴포넌트도 SSR된다)하고, **localStorage/`new Date()`에 의존하는 인터랙티브 영역만** 게이트로 감싸 스켈레톤→하이드레이트한다. 검증: 프리렌더 `.next/server/app/**/<slug>.html`에서 `application/ld+json`·howTo 텍스트 grep(integration-qa 시각/SSR 게이트).
- **SSR SEO 섹션(Intro/HowTo/FAQ)은 동기 isomorphic `useTranslations`로 쓴다 — `async … getTranslations` 서버 컴포넌트가 아니다.** next-intl v3의 `useTranslations`는 서버 컴포넌트에서도 동작하고 SSR HTML에 그대로 굽히며, 기존 도구(new-word) 패턴과 일치해 **단위 테스트 가능**하다(비동기 서버 컴포넌트는 `render(await Comp())`+서버 요청 컨텍스트가 필요해 vitest에서 깨진다 — url-encoder에서 `getTranslations` 채택 시 SEO 섹션 테스트 10개 실패). 라우트가 이들을 인터랙티브 클라이언트 섬 *바깥*(형제)에서 렌더하면 완전 SSR·게이트 무관이라 GEO에도 최적. (테스트 패턴은 jurepi-tdd.)
- **`generateMetadata`가 없으면 도구 페이지에 title/description/canonical/hreflang/OG가 없다(`buildToolMetadata`만 있고 미사용이던 drift).** 도구 라우트는 `generateMetadata`를 export해 slug별로 `buildToolMetadata({locale,slug,title,description})`를 호출한다(메시지 키는 도구마다 다를 수 있음 — qna는 `meta.title`, ladder는 `title`/`lead`). next-intl `getTranslations({locale, namespace})`로 로케일별 카피를 읽는다. 검증은 프리렌더 HTML의 `<title>`·`<link rel="canonical">`·`hrefLang`(주의: Next는 **`hrefLang` 카멜케이스**로 렌더 — 소문자 grep은 헛친다).
- **i18n 키를 `Intl`/`toLocale*`에 넘기지 마라(앱 전체 크래시 위험).** `new Intl.DateTimeFormat(t('_locale'))`처럼 메시지 키를 로케일로 쓰면 키 누락 시 키 문자열이 들어가 `RangeError`→ErrorBoundary가 도구를 삼킨다. 로케일은 항상 `useLocale()`→BCP-47(`ko`→`ko-KR`, `en`→`en-US`). 날짜/숫자 포맷은 이 BCP-47 태그로.
- **i18n 키 계약에 최상위 `tools.<slug>.title`/`description`을 반드시 넣어라(재발).** 푸터·홈 카드·헤더 검색이 `searchable-tools`로 이 두 키를 읽는다. `meta.title`/`intro.title`만 두고 최상위 `title`을 빠뜨리면 그 자리에 **리터럴 키(`tools.<slug>.title`)가 그대로 노출**된다(speed-quiz에서 재발; tsc·유닛·빌드 GREEN이라 은닉). 도구 추가 시 `meta`(SEO)와 **별도로** 최상위 title/description(짧은 표시명)을 ko/en 둘 다. 라이브 게이트: 배포 화면 푸터/카드에 리터럴 키가 안 보이는지 확인.
- **SEO 롱폼(HowTo)은 `howTo.title`(i18n 제목) + `howTo.items[]`(정제 문단 배열, base64 미러)로 쓴다 — 원시 마크다운 문자열을 `<p>`에 렌더하지 마라.** unit-converter 실제: `howTo.answer`가 `## 제목\n\n**굵게**…` 마크다운 blob 한 덩어리라 `<p>{t('howTo.answer')}</p>`가 `##`/`**`를 **리터럴로 화면에 노출**(마크다운 미렌더). 게다가 섹션 제목이 `<h2>How do unit conversions work?</h2>`·`Frequently Asked Questions`로 하드코딩돼 /ko에 영어가 샜다(tsc·유닛·빌드·프리렌더 JSON-LD 전부 그린, 리더 /ko 라이브로만 적발). **관례(base64EncoderHowTo 패턴):** ① 섹션 제목은 `t('howTo.title')`/`t('faq.title')` 키(하드코딩 금지) ② 본문은 `t.raw('howTo.items') as string[]`를 `.map(p => <p>)`로 — 마크다운 문법 없는 정제 문단. 진짜 마크다운 렌더가 필요하면 공용 `<Markdown>`(`src/components/markdown`)을 쓰되 SEO 섹션은 프리렌더 게이트 밖. 게이트: 프리렌더 HTML 가시 텍스트(script 제외)에 `##`/`**`가 없고 섹션 제목이 로케일별로 다른지.
- **표시 텍스트의 i18n 라벨 해석은 컴포넌트 경계에서(`t()`), 훅/도메인에는 식별자만 넘긴다 — 훅이 id를 텍스트로 반환하면 원시 id가 화면에 노출된다.** cheer 실측: `useCheer.applyPreset(presetId)`가 `updateSettings({text: presetId})`로 프리셋 **id**(`'encore'`)를 배너 텍스트에 넣어 사용자가 "앵콜!" 대신 `encore`를 봤다(훅은 `useTranslations`를 못 부르니 라벨을 모른다; 고정-prop 단위테스트는 id 왕복만 검증해 GREEN). **규칙:** 훅/도메인은 로케일 무관 id/유니온만 다루고, 컴포넌트가 `t('presets.phrases.<sit>.<id>')`로 **해석한 텍스트**를 훅에 전달(`onApply(t(...))`). 이것은 "런타임 유니온→i18n 보간"(jurepi-tdd)·"i18n 키를 Intl에 넘기지 마라"의 프리셋판. 게이트: 프리셋/옵션 클릭 후 배너·입력에 **로케일 라벨**이 뜨는지 라이브 확인(id 문자열 부재).
