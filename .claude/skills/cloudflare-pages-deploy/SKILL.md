---
name: cloudflare-pages-deploy
description: >-
  Jurepi(Next.js 15 SSG)를 Cloudflare Pages에 정적 익스포트(output:'export')로 배포하는 방법.
  정적 익스포트 마이그레이션(미들웨어 제거·헤더를 _headers로 이전·루트 리다이렉트를 _redirects로),
  CF Pages 빌드 설정(빌드 커맨드/출력 디렉토리/Node 버전/env), wrangler 로컬 프리뷰, 배포본 검증,
  배포/빌드 실패 트러블슈팅을 다룬다. "Cloudflare/CF Pages 배포", "deploy", "wrangler", "재배포",
  "정적 익스포트", "_headers/_redirects", "배포 실패/빌드 실패", "프로덕션에 헤더가 안 먹는다",
  "/ 가 404", "next-intl 정적 익스포트" 같은 표현에 반드시 사용하라. 앱 기능 구현·UI 변경은 이 스킬이 아니다.
---

# Cloudflare Pages Deploy — Jurepi 정적 배포

이 스킬은 Jurepi를 **정적 익스포트(`output: 'export'`)** 산출물(`out/`)로 만들어 Cloudflare Pages에 올리는 절차다. Jurepi는 순수 SSG(백엔드/DB/서버 API 없음)라 정적 익스포트가 가장 단순·빠르고 무료 한도가 넉넉하다.

**가장 중요한 원리: `next build` 그린 ≠ 배포 정상.** 정적 익스포트는 미들웨어·`next.config` 헤더 같은 "동적/노드 런타임" 기능을 **조용히 버린다.** 빌드는 통과하지만 프로덕션에서 보안 헤더가 사라지고 루트 리다이렉트가 죽는다. 그래서 이 스킬의 절반은 "정적 호스팅에서 깨지는 것들을 Cloudflare 네이티브로 옮기기"이고, 끝은 항상 **배포본 직접 검증**이다.

## ✅ 채택된 실제 배포 경로 (2026-06-30) — Cloudflare **Workers 정적 에셋** (Pages 아님)

이 프로젝트는 Cloudflare **Workers Builds**(Git 연동)에 **정적 에셋(assets-only Worker)**으로 배포한다. 라이브: `https://apps.jurepi.kr`. 아래 절들의 원리(`_headers`·`_redirects`·force-static·검증 게이트)는 그대로 유효하고 **CF 측 배선만 다르다**(Pages의 `pages_build_output_dir`/`wrangler pages …` 대신 assets-only `wrangler.jsonc` + `wrangler deploy`/`wrangler dev`).

> ### 🚀 배포 트리거 = `git push` (프로덕션 분기 `main`)
> **배포는 `main`에 push하면 끝난다.** CF Workers Builds가 Git push를 감지해 **CF 파이프라인 안에서** `pnpm run build` + `wrangler deploy`를 자동 실행한다. **로컬에서 `wrangler deploy`를 직접 돌리는 워크플로가 아니다** — 아래 "핵심 함정"들의 `wrangler deploy`는 전부 **CF 빌드가 대신 실행**하는 것이고, 함정 예방은 *커밋되는 설정*(`wrangler.jsonc`·force-static·`.env.production`)으로 한다. 개발자/에이전트가 할 일: ① 변경을 `main`에 머지 → ② push → ③ CF 빌드 완료(수십 초~수 분) 대기 → ④ 실제 도메인 `curl -I` 검증. 로컬 사전검증은 `serve out` 또는 `wrangler dev`. (로컬 `wrangler deploy` 수동 실행은 CF 대시보드가 막혔을 때의 **예외 폴백**일 뿐, 정상 경로 아님.)

**핵심 함정 ①: `npx wrangler deploy`의 OpenNext 자동 전환.** repo에 wrangler 설정이 **없으면** wrangler가 Next.js를 감지해 `@opennextjs/cloudflare migrate`를 자동 실행 → 앱을 **풀 SSR Worker**(951 패키지)로 배포하고, 첫 배포에서 `Service binding 'WORKER_SELF_REFERENCE' references Worker '<package.json name>' which was not found [10143]`로 실패한다(self-ref 이름 = package.json `name` ≠ CF 워커명). **예방 = repo에 `wrangler.jsonc`를 커밋**해 정적 에셋 경로로 못박는다(설정이 있으면 wrangler가 그걸 읽고 OpenNext를 건너뜀). 순수 SSG에 OpenNext SSR은 불필요.

`wrangler.jsonc` (repo 루트, `main` 없음 = assets-only):
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "jurep-kr",                          // CF 워커 이름과 반드시 일치
  "compatibility_date": "2025-06-01",
  "assets": { "directory": "./out", "not_found_handling": "404-page" }
}
```

**핵심 함정 ②: `output:'export'`는 metadata 라우트에 `force-static` 요구.** `src/app/{manifest,sitemap,robots}.ts`(route handler)는 `export const dynamic = 'force-static'`가 없으면 export 빌드가 `export const dynamic = "force-static"… not configured … with "output: export"`로 실패. 세 파일 모두 추가.

**핵심 함정 ③: `NEXT_PUBLIC_*`는 `.env.local`(gitignored)로 프로덕션에 못 들어간다.** 정적 빌드는 CF에서 돌아 로컬 `.env.local`을 못 봄 → sitemap/canonical/OG가 코드 기본값으로, 마스코트 등 링크가 빈 값으로 나간다. **예방 = 비밀 아닌 `NEXT_PUBLIC_*`를 `.env.production`(커밋)에** 둔다(`next build`가 로드). 또는 CF 대시보드 빌드 env. 현 값: `NEXT_PUBLIC_SITE_URL=https://apps.jurepi.kr`, `NEXT_PUBLIC_BLOG_URL=https://blog.naver.com/dhan0213`.

**CF Workers Builds 설정(대시보드):** 빌드 명령 `pnpm run build`, 배포 명령 `npx wrangler deploy`(커밋된 `wrangler.jsonc` 사용), 프로덕션 분기 `main`. `_headers`/`_redirects`는 Workers 정적 에셋도 **네이티브 지원**(assets-only면 Worker 코드 응답이 없어 모든 응답에 적용). 클린 URL은 `html_handling: auto-trailing-slash` 기본이 `ko.html`→`/ko`, `ko/tools/x.html`→`/ko/tools/x`로 해석 → `trailingSlash` 불필요.

**로컬 게이트:** `wrangler dev`(wrangler.jsonc 읽어 workerd로 `out/` 서빙 — `wrangler pages dev out` 아님). 그 위에서 아래 curl 게이트 실행 후, 배포 후 실제 도메인에 동일 curl을 1:1 재실행해 닫는다.

## 사전 점검 (현 상태)

배포 작업 전 현재 레포 상태를 확인한다:

- `next.config.ts`: `images: { unoptimized: true }` 있음(✓ 정적 익스포트 호환). `output: 'export'` **없음** → 추가 필요.
- `next.config.ts` `headers()`에 보안 헤더 5종(HSTS·X-Content-Type-Options·X-Frame-Options·Referrer-Policy·Permissions-Policy) → 정적 익스포트에서 **무시됨**, `_headers`로 이전 필요.
- `src/middleware.ts`(next-intl `createMiddleware`) 존재 → 정적 익스포트에서 **실행 안 됨**. 루트/로케일 리다이렉트 정적 대체 필요.
- `src/i18n/routing.ts`: locales `["ko","en"]`, defaultLocale `"ko"`, localePrefix `"always"`.
- 배포 파일(`wrangler.toml`/`_headers`/`_redirects`/`.nvmrc`) **없음** → 신설.

> 항상 실제 파일을 다시 읽어 위 가정이 유효한지 확인한 뒤 진행한다. 가정이 바뀌었으면(예: CSP가 추가됨) 매핑을 갱신한다.

## 마이그레이션 절차 (순서 중요 — 한 번에 하나씩, 매 단계 `next build`)

정적 대체를 **먼저** 세우고 동적 기능을 **나중에** 제거한다. 반대로 하면 중간 상태에서 사이트가 깨진다.

### 1. next-intl 정적 익스포트 대비 (미들웨어 제거 전)

미들웨어를 지우기 전에 next-intl이 미들웨어 없이 동작하게 만든다. next-intl v3의 정적 익스포트 패턴:

- 로케일 레이아웃/페이지에서 `setRequestLocale(locale)`를 호출한다(렌더 전에 로케일 고정).
- 로케일 `generateStaticParams`가 `routing.locales`를 반환한다.
- 동적 API(`headers()`, 미들웨어 기반 로케일 감지)에 의존하지 않는다.

> next-intl 버전마다 API가 다르다. **Context7로 next-intl "static export / static rendering" 문서를 확인**하고 현재 버전에 맞는 정확한 호출을 적용한다. 앱 코드(`[locale]/layout.tsx` 등) 변경이 필요하면 platform-engineer에게 요청한다 — 이 경계는 앱 라우팅 코드라 platform 소유다.

### 2. 출력 모드 전환

`next.config.ts`에 정적 익스포트를 켠다:

```ts
const nextConfig: NextConfig = {
  output: 'export',          // 추가: out/ 정적 산출물
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: { unoptimized: true },   // 이미 있음 (정적 익스포트 필수)
  // headers()는 정적 익스포트에서 무시됨 → 4단계에서 _headers로 이전 후 제거
};
```

- `trailingSlash`는 CF Pages 라우팅 취향에 따라 선택. 기본(false) 유지로 시작하고, 404가 나면 트러블슈팅에서 조정.

### 3. 루트/로케일 리다이렉트를 `_redirects`로

미들웨어가 하던 `/` → `/ko`를 정적으로 옮긴다. `public/_redirects` 생성(빌드 시 `out/`로 복사됨):

```
/        /ko        302
```

- localePrefix `"always"`이므로 콘텐츠 URL은 전부 `/ko/*`·`/en/*`. 루트만 기본 로케일로 보낸다.
- (선택) `Accept-Language` 기반 분기는 정적에선 불가 — 기본 로케일 고정 리다이렉트가 정답. 동적 언어 감지가 꼭 필요하면 그건 정적 익스포트 가정을 벗어나니 리더와 재논의.

### 4. 보안 헤더를 `_headers`로 1:1 이전

현재 `next.config` `headers()`의 5종을 `public/_headers`로 옮긴다. **있는 것만 정확히 옮긴다 — CSP는 현재 없으므로 지어내지 않는다.**

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

- 이전이 끝나면 `next.config.ts`의 `headers()`를 **제거**한다(혼란 방지: 헤더 단일 소스 = `_headers`). 제거 사실을 platform-engineer와 공유.
- CSP 추가가 바람직하지만(현재 결손), 정적 사이트 + AdSense/GA는 CSP가 까다롭다. 도입은 platform-engineer/리더와 별도 합의 — 이 스킬은 **기존 헤더 보존**만 책임진다.

### 5. Node 버전 고정

CF Pages 빌드 환경을 로컬과 맞춘다. `.nvmrc`(예: `20`) 생성 + CF Pages 프로젝트 env에 `NODE_VERSION=20`.

### 6. 빌드 & 산출물 확인

```bash
pnpm build           # next build → output:'export'면 out/ 생성
ls out/              # ko/ en/ index 등 존재 확인
ls out/ko/tools/     # 라이브 도구 slug HTML 존재 확인
```

빌드 로그에 `Route (app)` 표와 함께 정적 export가 되는지, "couldn't be statically exported" 경고가 없는지 본다.

## Cloudflare Pages 설정

### 빌드 설정 (CF Pages 대시보드 또는 Git 연동)

| 항목 | 값 |
|------|-----|
| Framework preset | None (또는 Next.js Static Export) |
| Build command | `pnpm build` |
| Build output directory | `out` |
| Node version | `.nvmrc` / `NODE_VERSION` env |
| 환경변수 | 모든 `NEXT_PUBLIC_*` (빌드타임 인라인되므로 빌드 env에 필수) |

### env 동기화

`NEXT_PUBLIC_*`(site URL, AdSense client, GA ID, `NEXT_PUBLIC_BLOG_URL` 등)를 CF Pages 빌드 환경변수에 등록한다. **빌드타임에 인라인**되므로 런타임이 아니라 빌드 환경에 있어야 한다. 비밀(server-only secret)은 없다 — 있으면 정적 가정 위반.

### wrangler.toml (선택 — wrangler CLI/CI 사용 시)

```toml
name = "jurepi"
pages_build_output_dir = "out"
compatibility_date = "2025-01-01"
```

### 배포 방법

- **정상 경로 = Git push (유일 워크플로):** `main`에 push하면 CF Workers Builds(Git 연동)가 커밋된 `wrangler.jsonc`로 자동 빌드(`pnpm run build`)·배포한다. 개발자/에이전트는 push만 하면 된다. (위 "🚀 배포 트리거" 참조.)
- **CLI 수동 업로드(예외 폴백만):** CF 대시보드/Git 연동이 막혔을 때만 로컬에서 `pnpm build && npx wrangler deploy`(커밋된 `wrangler.jsonc` 사용, Pages식 `wrangler pages deploy` 아님). 인증 필요(`wrangler login`). 정상 상황에선 쓰지 않는다.

## 로컬 프리뷰 (배포 전 검증)

```bash
pnpm build
wrangler pages dev out      # _headers/_redirects 포함 CF 런타임 에뮬레이션
```

`next start`가 아니라 `wrangler pages dev out`으로 봐야 `_headers`/`_redirects`가 실제 적용된 상태를 확인할 수 있다.

## 배포본 검증 게이트 (비타협 — 추정 금지, 실제 응답으로)

배포(또는 로컬 프리뷰) 후 **실제 HTTP 응답**으로 확인한다:

```bash
BASE=http://localhost:8788   # wrangler pages dev 포트 (또는 배포 URL)
curl -sI "$BASE/" | grep -i location               # / → /ko (302)
curl -sI "$BASE/ko" | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy"  # 헤더 5종
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/ko"   # 200
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/en"   # 200
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/ko/nonexistent-xyz"  # 404
```

- [ ] `/` → `/ko` 리다이렉트 (미들웨어 없이 `_redirects`로)
- [ ] 보안 헤더 5종이 응답에 존재 (`next.config`에만 있던 헤더가 프로덕션에서 사라지지 않음)
- [ ] `/ko`·`/en` 200, 도구 slug 200
- [ ] 미지 경로 404
- [ ] 도구 페이지 SPA가 브라우저에서 정상 마운트 (정적 셸 + 클라이언트 도구), CLS<0.1

체크가 하나라도 실패하면 "배포 완료"가 아니다. `references/troubleshooting.md`로 간다.

### 배포 직후 브라우저 검증은 엣지 캐시를 우회하라 — `curl`(fresh)로 렌더 body를 먼저 본다

배포 완료 판정의 **1차 진실은 `curl`**, 브라우저는 캐시에 오염된다. cron-parser Quartz 배포 실측: push→CF 빌드 후 **`curl`은 새 HTML(ModeToggle 렌더 마크업 `aria-pressed=…>Quartz` 포함)을 정상 반환**했는데, **MCP 브라우저 navigate는 같은 시각 ModeToggle이 통째로 없는 버전**을 보여줬다(CF 엣지 PoP 간 전파 시차 + 브라우저/엣지 캐시). "배포가 UI를 빠뜨렸나?"로 오진할 뻔했으나 fresh curl이 배포본 정상을 증명.

- **배포 완료 감지·검증은 `curl`로** — 새 도구는 배포 전 라이브에서 404였다가 200이 되는 것을 폴링(`until curl … | grep -q "<새 기능 마커>"`)해 전파를 확인한다. 이때 마커는 **렌더 body**에 있는 것으로 고른다(RSC 데이터 스트림 `__next_f`의 이스케이프 사본 `\"@type\":\"SoftwareApplication\"`은 실제 `<script type=application/ld+json>` 블록과 별개 — `"@type":"SoftwareApplication"` 실값 개수로 세라. curl의 단순 substring grep은 이 사본 때문에 2배로 부풀 수 있다).
- **브라우저에서 재확인할 땐 캐시버스터 쿼리**(`?cb=<고유값>`)로 navigate — 정적 HTML도 브라우저/중간 캐시를 우회한다. cron-parser: `?cb=quartz1`로 재접속하니 ModeToggle과 Quartz 파싱이 정상 표시.
- **"브라우저에 안 보임"과 "배포 미완/코드 결함"을 혼동하지 말 것** — fresh `curl`의 렌더 body가 정상이면 배포는 정상이고 브라우저 쪽 캐시 문제다. 반대로 curl body에도 없으면 그때가 진짜 배포/빌드 문제다.
- **공유 청크 지문(`_next/static/chunks/[hash]-[hash].js`)을 배포 완료 신호로 쓰지 말 것 — 라우트·i18n에 국한된 국소 변경은 공유 청크를 안 바꾼다.** base64-encoder 실측: 파일 다운로드 기능(base64 라우트+i18n에만)을 push하고 공유 청크 지문을 10분 폴링했으나 지문이 그대로여서 "미배포"로 오판, 실제론 이미 라이브였다(16분 헛대기 — 변경분은 그 **라우트 청크 + 페이지 RSC 페이로드**에만 반영). 폴링 마커는 항상 위처럼 **렌더 body의 그 변경 고유 문자열**로 고른다.
- **JS 청크에서 한글을 grep하지 말 것 — 유니코드 이스케이프(`\uXXXX`)라 raw 한글은 0으로 나온다.** 같은 실측에서 로컬 `out/_next/static/chunks/`를 raw 한글로 grep하면 실제 존재해도 미검출인데, next-intl이 카탈로그를 **페이지 HTML(RSC 페이로드)에 원문 그대로** 임베드하므로 `out/<locale>/tools/<slug>.html`(또는 `curl`)을 grep하면 검출된다(154 파일). i18n 문자열 확인은 **HTML을 grep**한다(청크 아님).
- **새 문자열이 없는 순수 클라 동작(버튼·상태 전이) 변경은 grep으로 배포 판정 불가 → 브라우저로 실제 기능을 실행**(예: 디코드→다운로드 이벤트 발화)해 확인한다.

## 트러블슈팅

증상별 원인·해결은 분리된 런북에 있다. **배포/빌드 실패 시 반드시 읽어라:** `references/troubleshooting.md`
(헤더 사라짐, `/` 404, `out/` 미생성, next-intl 빌드 에러, Node 버전, 캐시/stale, env 미인라인, 트레일링 슬래시·대소문자 라우팅 등.)

## 비타협 원칙

- **빌드 그린 ≠ 배포 정상** — 끝은 항상 배포본 직접 검증.
- **헤더 단일 소스 = `_headers`** — `next.config` 헤더 제거, 양쪽 중복 금지.
- **있는 것만 이전** — CSP 등 없는 헤더를 지어내지 않는다.
- **앱 코드 경계 존중** — 라우팅/i18n/SEO 코드 변경은 platform-engineer에 요청. 이 스킬은 출력 모드·정적 호스팅 어댑터·CF 설정·검증만.
- **모르면 문서로** — next-intl/Cloudflare 동작은 버전마다 다르다. Context7/공식 문서로 확인하고 추측하지 않는다.
