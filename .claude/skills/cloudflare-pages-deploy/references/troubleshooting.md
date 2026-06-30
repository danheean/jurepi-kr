# Cloudflare Pages 배포 트러블슈팅 런북

Jurepi(Next.js 15 정적 익스포트 → CF Pages) 배포/빌드 실패의 증상별 진단·해결. 위에서 아래로 자주 발생하는 순.

## 진단 우선순위 (현상 먼저 수집)

추측 전에 현상을 재현·수집한다:

1. **빌드 로그** — CF Pages 빌드 로그 또는 로컬 `pnpm build` 전체 출력. "couldn't be statically exported", "Module not found", env undefined 경고를 찾는다.
2. **산출물** — `ls -R out/ | head -50`. 기대 라우트 HTML이 실재하는가.
3. **응답 헤더** — `curl -sI <url>`. 헤더·리다이렉트·상태코드.
4. **로컬 프리뷰** — `wrangler pages dev out`으로 `_headers`/`_redirects` 적용 상태 재현.

`next start`로 본 결과는 CF Pages와 다르다(헤더/리다이렉트 파일 미적용). 반드시 `wrangler pages dev out` 또는 실제 배포로 본다.

---

## 1. 보안 헤더가 프로덕션에서 사라짐

**증상:** `curl -sI`에 HSTS/X-Frame-Options 등이 없음. 로컬 `next dev`에선 있었음.

**원인:** `next.config.ts`의 `headers()`는 **정적 익스포트(`output:'export'`)에서 완전히 무시**된다. 정적 호스팅에는 Node 서버가 없어 응답 헤더를 동적으로 못 붙인다.

**해결:**
- `public/_headers`에 헤더를 정의(빌드 시 `out/_headers`로 복사). 경로 매칭은 `/*`.
- `out/_headers`가 실제 생성됐는지 확인(`cat out/_headers`). `public/`에 안 두면 복사 안 됨.
- `wrangler pages dev out`으로 재현 후 `curl -sI`로 헤더 확인.
- 들여쓰기 주의: `_headers`는 경로 줄(들여쓰기 없음) 다음에 헤더 줄(2칸 들여쓰기) 형식.

---

## 2. `/`가 404 또는 빈 페이지

**증상:** 루트 `/` 접근 시 404 또는 빈 화면. `/ko`는 정상.

**원인:** `localePrefix: 'always'`라 `/`에는 페이지가 없고, 미들웨어가 하던 `/` → `/ko` 리다이렉트가 정적 익스포트에서 사라짐.

**해결:**
- `public/_redirects`에 `/    /ko    302` 추가.
- `out/_redirects` 생성 확인.
- `wrangler pages dev out`에서 `curl -sI / | grep -i location` 으로 리다이렉트 확인.
- CF Pages는 `_redirects`를 정적 자산보다 먼저 평가하지만, 존재하는 정적 파일이 우선될 수 있으니 루트에 `index.html`이 생기지 않게 한다.

---

## 3. 빌드는 성공하는데 `out/`가 없음

**증상:** `pnpm build` exit 0인데 `out/` 디렉토리 없음(또는 `.next/`만 있음).

**원인:** `output: 'export'`가 `next.config.ts`에 없음, 또는 동적 기능이 정적 export를 막아 Next가 일반 빌드로 폴백.

**해결:**
- `next.config.ts`에 `output: 'export'` 확인.
- 빌드 로그에서 정적 export를 막는 기능 추적: 미들웨어 잔재, `export const dynamic = 'force-dynamic'`, 서버 액션, `cookies()`/`headers()` 런타임 사용, ISR(`revalidate`).
- `images: { unoptimized: true }` 필수(없으면 export 실패).

---

## 4. next-intl 빌드/런타임 에러

**증상:** 빌드 중 "Unable to find `next-intl` locale" 또는 정적 페이지에서 메시지 미로딩.

**원인:** 정적 익스포트는 미들웨어 기반 로케일 감지를 못 쓴다. 로케일을 빌드타임에 고정해야 한다.

**해결:**
- 로케일 레이아웃/페이지에 `setRequestLocale(locale)` 호출(렌더 전).
- 로케일 `generateStaticParams`가 `routing.locales` 반환.
- `getRequestConfig`(`request.ts`)가 locale을 받아 메시지를 정적으로 로드.
- **버전별 API 차이가 크다 — Context7로 현재 next-intl 버전의 "static export"/"static rendering" 문서를 확인.** 앱 코드 변경은 platform-engineer에 요청(경계).

---

## 5. env(`NEXT_PUBLIC_*`)가 프로덕션에서 undefined

**증상:** AdSense/GA/site URL이 배포본에서 비어 있음. 로컬에선 정상.

**원인:** `NEXT_PUBLIC_*`는 **빌드타임에 코드로 인라인**된다. CF Pages 빌드 환경에 변수가 없으면 빈 문자열로 인라인됨. 런타임 주입 불가.

**해결:**
- CF Pages 프로젝트 → Settings → Environment variables(Production·Preview 각각)에 모든 `NEXT_PUBLIC_*` 등록.
- 등록 후 **재빌드**해야 반영(기존 배포는 이미 인라인된 값 고정).
- 빌드 로그에 변수가 보이는지, 또는 빌드 후 `grep -r "NEXT_PUBLIC_SITE_URL 값" out/` 으로 인라인 확인.

---

## 6. Node 버전 불일치 빌드 실패

**증상:** 로컬은 빌드되는데 CF에선 실패(문법/엔진 에러).

**원인:** CF Pages 기본 Node 버전이 로컬과 다름.

**해결:**
- `.nvmrc`(예: `20`) 추가 + CF Pages env `NODE_VERSION=20`.
- 로컬 `node -v`와 일치시킨다.

---

## 7. 라우트 404 — 트레일링 슬래시 / 대소문자

**증상:** 일부 도구 페이지가 404. 인덱스는 정상.

**원인:** 정적 익스포트 파일 구조(`out/ko/tools/foo.html` vs `out/ko/tools/foo/index.html`)와 CF Pages 라우팅·트레일링 슬래시 정책 불일치. 또는 slug 대소문자.

**해결:**
- `next.config.ts`의 `trailingSlash`를 토글해 빌드 → `out/` 구조 변화 확인 → CF에서 어느 쪽이 맞는지 테스트.
- 레지스트리 slug와 실제 export 파일명이 일치하는지 확인(qa-integration의 레지스트리↔라우트 교차 검증과 연계).

---

## 8. 캐시/stale 산출물로 인한 가짜 실패

**증상:** 고친 게 반영 안 됨, 옛날 화면/에러가 계속.

**원인:** stale `.next/`·`out/`, CF 엣지 캐시, 브라우저 캐시.

**해결:**
- 로컬: `rm -rf .next out && pnpm build`.
- CF: 새 배포는 자동 캐시 무효화. 의심되면 CF 대시보드에서 재배포(Retry deployment) 또는 캐시 purge.
- `curl`로 확인(브라우저 캐시 회피) + `Cache-Control` 헤더 점검.

---

## 9. AdSense/GA가 정적 사이트에서 안 뜸

**증상:** 광고/분석 미로딩.

**원인(정상 동작 포함):** 동의(consent) 게이트 이전이거나 광고 차단, 또는 env 미인라인(5번).

**해결:**
- env 인라인 먼저 확인(5번).
- consent 이후 `next/script lazyOnload` 로드 흐름은 platform-engineer 소유 — 광고 미표시 자체는 AdSlot이 collapse하므로 콘텐츠를 막지 않는 게 정상. 콘텐츠가 막히면 그건 버그 → platform-engineer.

---

## 에스컬레이션

- 1회 재시도 후에도 안 되면 원인 가설 + 수집한 로그/`curl` 출력을 리더에게 보고하고 진행하지 않는다.
- **깨진 배포를 "완료"로 보고하지 않는다.** 배포본 검증 게이트(SKILL.md)를 통과해야 완료다.
- 앱 코드(라우팅/i18n/SEO/광고) 수정이 필요하면 platform-engineer에 요청 — 경계를 침범하지 않는다.
