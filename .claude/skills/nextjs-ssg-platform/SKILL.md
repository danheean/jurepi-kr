---
name: nextjs-ssg-platform
description: Jurepi의 Next.js 15 App Router 정적 사이트(SSG) 플랫폼을 구축하는 방법. generateStaticParams, Server/Client 경계, next-intl 로케일 라우팅(ko/en), 레지스트리 기반 동적 도구 라우트, SEO 인프라(sitemap/robots/manifest/JSON-LD/hreflang), AdSense+동의 게이팅, CSP/보안 헤더, Core Web Vitals. 라우팅·SSG·i18n·SEO·광고·빌드·배포 작업 시 반드시 사용.
---

# Next.js SSG Platform — Jurepi 프레임워크 계층

이 스킬은 클린 아키텍처의 **가장 바깥 계층**을 다룬다. 원칙: 프레임워크는 *세부사항*이다. App Router·next-intl·AdSense를 안쪽 계층(도메인/유스케이스) 뒤에서 배선하되, 비즈니스 로직을 페이지/핸들러에 인라인하지 않는다.

## 비타협 제약 (PRD)

- **SSG only. 백엔드/DB/first-party API 없음.** 모든 페이지는 빌드타임 생성. 레지스트리는 컴파일타임 TS 모듈, 선호/동의는 localStorage.
- **검색 트래픽이 성장 엔진** — 모든 도구는 별도 인덱싱 URL. 메인+쉘은 CWV를 회귀시키면 안 된다(CLS<0.1, 광고 슬롯 높이 예약).
- **NEXT_PUBLIC_* 외 비밀 없음.** 모든 env는 client-safe.

## 골격 빌드 순서

1. **Scaffold:** Next.js 15 + React 19 + TS strict + Tailwind v4(`@tailwindcss/postcss`) + `tokens.css` 브리지 + path alias `@/*`. ESLint(next/core-web-vitals)+Prettier.
   - **테스트 스크립트는 `vitest run`으로 (워치 아님).** `"test": "vitest"`는 비-TTY/CI 셸에서 종료하지 않아 hang처럼 보인다. `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, 워치는 별도 `"test:watch": "vitest"`로 둔다.
   - **coverage 스코프를 `src/**`로 고정.** `include` 없이 두면 `.next/` 빌드 산출물·vendor·config까지 계측돼 수치가 무의미해진다. `vitest.config.ts`: `coverage: { all: true, include: ['src/**/*.{ts,tsx}'], exclude: ['.next/**','**/*.config.*','**/*.d.ts','src/app/**','src/middleware.ts','src/i18n/{routing,request}.ts','**/*.test.*'] }`. 프레임워크 엔트리포인트(app/·middleware·i18n 배선)는 `next build`+E2E가 검증하므로 단위 커버리지 임계에서 제외하고, 제외 사실을 문서화한다.
   - **Vitest와 Playwright의 스펙을 분리한다.** Vitest 기본 include는 `**/*.{test,spec}.*`라 Playwright의 `tests/**/*.spec.ts`까지 수집해 `@playwright/test` import 에러로 `pnpm test`가 exit 1이 된다. `vitest.config.ts`에 `test: { include: ['src/**/*.{test,spec}.{ts,tsx}'], exclude: ['node_modules/**','.next/**','tests/**','e2e/**'] }`로 한정하고, Playwright는 `pnpm exec playwright test`로만 실행한다. Playwright 산출물(`playwright-report/`,`test-results/`)은 `.gitignore`에 넣는다.
2. **i18n 라우팅 먼저 배선** (페이지 짓기 전): `i18n/routing.ts` (locales `["ko","en"]`, defaultLocale `"ko"`, localePrefix `"always"`), `request.ts`, `next.config.ts`에 next-intl 플러그인. `/` → `/ko` 307.
3. **레이아웃 쉘:** root `layout.tsx`(html lang, next/font/local 폰트 변수, flash-free 테마 부트스트랩) → `[locale]/layout.tsx`(Provider 순서 고정).
4. **레지스트리 기반 라우트:** `generateStaticParams`가 `registry.filter(s=>s.status==='live') × locales`. coming_soon은 라우트 없음. 미지 slug → 지역화 `not-found`.
5. **SEO 인프라:** `lib/seo.ts`, `app/sitemap.ts`, `robots.ts`, `manifest.ts`.
6. **동의 + 광고:** ConsentBanner → AdSlot(고정 높이) → AdSense lazy.
7. **보안 헤더/CSP** + 법무 페이지.

## Server / Client 경계

- **Server Components 기본.** 상호작용 UI 서브트리만 `"use client"`.
- 도구 페이지는 Server Component가 SEO/레이아웃을 렌더하고, 인터랙티브 도구(예: `<LadderGame/>`)만 클라이언트. → JS 번들 최소화(랜딩 <150kb gz).
- `"use client"`는 가능한 한 잎(leaf)에 가깝게. 큰 Server 트리 위에 client 잎.

## Provider 순서 (고정)

```
NextIntlClientProvider → ThemeProvider → ConsentProvider → ToastProvider
```

테마는 **flash-free**여야 한다: 페인트 전 인라인 스크립트로 localStorage 테마를 읽어 `<html>`에 적용(SSR 깜빡임 방지).

## 레지스트리가 backbone

허브 UI·sitemap·static params·검색이 모두 `src/tools/registry.ts`에서 파생된다. **새 도구 추가 = ToolMeta 엔트리 + `messages.tools.<id>.*` + (live면) 모듈 + slug→컴포넌트 분기 + 자체 PRD.** 메인 화면을 재설계하지 않는다. coming_soon은 ToolMeta만 있으면 된다.

## SEO·i18n·동의·광고·CWV 상세

라우팅 표, `generateStaticParams` 정확한 형태, 메시지 네임스페이스 규약, JSON-LD 종류(WebSite/SoftwareApplication/FAQPage), hreflang/canonical, AdSlot 높이·동의 게이팅, CSP 블록, CWV 체크리스트는 분량이 크다 → **`references/i18n-seo-cwv.md`를 읽어라.**

## 검증 (TDD 연계)

- 순수하게 떼어낼 수 있는 것은 도메인/유스케이스로: 검색 매처, 동의 게이팅 판정, 레지스트리 정렬·필터. 이들은 `jurepi-tdd`로 단위 테스트.
- 프레임워크 고유(라우팅 파라미터 생성, SEO 빌더 출력 형태)는 단위 테스트 가능한 만큼 테스트.
- 최종 SSG 산출물(페이지 생성, sitemap 내용, CLS)은 qa-integration이 빌드+E2E+Lighthouse로 검증.

## 흔한 실수

- `"use client"`를 레이아웃 상단에 붙여 트리 전체를 클라이언트화 → 번들 폭증. 잎에 붙여라.
- 광고/동적 콘텐츠에 높이 미예약 → CLS 폭발. 항상 예약.
- 비즈니스 로직을 `page.tsx`에 인라인 → 계층 위반. 도메인 호출.
- 로케일 전환이 query를 버림 → path+query 보존해야 함.
- 폰트를 CDN에서 로드 → self-host+subset+swap, 주요 weight만 preload.
