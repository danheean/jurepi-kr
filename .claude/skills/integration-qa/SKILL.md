---
name: integration-qa
description: Jurepi의 통합 정합성을 경계면 교차 비교로 검증하는 방법. 계층 계약 일치(도메인 출력↔UI 소비, 레지스트리↔라우트↔메시지 키, SVG trace↔엔진 path), 공정성 회귀, Vitest 커버리지, Playwright E2E, axe 접근성, Lighthouse CWV, 시각 회귀. 모듈 완성 직후·통합 시점에 품질을 점진 검증할 때 반드시 사용.
---

# Integration QA — 경계면 교차 비교 검증

대부분의 버그는 한 계층 *안*이 아니라 계층 *사이*에 산다. 각 모듈은 단독으로 그린이어도, 계약이 어긋나면 제품은 깨진다. 이 스킬은 그 틈을 *실행으로* 찾는다.

## 두 가지 핵심 습관

1. **존재 확인 ❌ → 경계면 교차 비교 ✅.** "파일/함수가 있다"가 아니라 "A가 내보내는 shape과 B가 소비하는 shape이 같은가"를 **양쪽을 동시에 읽어** 비교한다.
2. **점진적 QA.** 전체 완성 후 한 번이 아니라, **각 모듈/계층 완성 직후** 검증한다. 틈을 일찍 닫는다.

## Jurepi 경계면 매트릭스 (교차 비교 대상)

| 경계 | A 쪽 | B 쪽 | 무엇을 비교 |
|------|------|------|-------------|
| 도메인↔UI | `_workspace/*_domain_*-contract.md` 시그니처 | 컴포넌트/훅 실제 호출 | 인자·반환 타입·널 가능성 일치 |
| 엔진↔보드 | `resolveAll(rungs)` / `tracePath` 출력 | `LadderBoard` SVG가 그리는 경로 끝점 | 화면 경로가 공정 결과와 정확히 일치 |
| 레지스트리↔라우트 | `tools.filter(live)` | `generateStaticParams` 생성 경로 | 모든 live slug에 페이지, coming_soon은 라우트 없음 |
| 레지스트리↔i18n | ToolMeta `id` 집합 | `tools.<id>.*` 메시지 키 | 모든 live 도구에 ko/en 카피 존재 |
| i18n ko↔en | `messages/ko.json` 키 | `messages/en.json` 키 | 키 집합 동일(누락/오타 없음), 코드 참조 키 양쪽 존재 |
| 동의↔광고 | `shouldLoadAds(consent)` 판정 | AdSlot/AdSense 실제 로딩 | 거부 시 스크립트 없음 + 높이 예약 유지 |
| 메타↔프리렌더 | 도구 SPEC의 SEO 요구(고유 title/description/JSON-LD 타입) | `out/<locale>/tools/<slug>.html` 실제 DOM | 도구별 고유 메타·유효 JSON-LD가 정적 HTML에 존재(게이트 밖 SSR) |
| JSON-LD↔canonical | JSON-LD `url` / `absoluteToolUrl` | `<link rel=canonical>` + sitemap 항목 | 세 값이 동일 소스(하드코딩 drift 없음) |

> 상세 점검 절차와 재현 명령은 `references/boundary-checks.md`를 읽어라.

## 검증 차원과 도구

```
1. 계약 정합성   — 위 매트릭스, 정적 grep + 타입체크(tsc --noEmit)
2. 공정성 회귀   — domain 테스트 재실행(chi-square, 전 컬럼 도달, resolveAll===perm)
3. 단위/커버리지 — vitest run --coverage  (전체 ≥80%, 도메인 ≥90%)
4. E2E          — playwright test  (SPEC final_integration_test 시나리오)
5. 접근성        — axe + 키보드 + reduced-motion + 색대비
6. 성능(CWV)     — Lighthouse: LCP/CLS/INP/FCP/TBT 목표 이내, 광고 슬롯 CLS<0.1
7. 시각 회귀     — Playwright 스크린샷 320/375/768/1024/1440, 라이트(+다크)
8. 발견성(SEO/GEO)— 프리렌더 HTML의 고유 메타·유효 JSON-LD(url==canonical)·SSR 롱폼·llms.txt/robots/sitemap
```

## 커버리지·테스트 하드 게이트 (절대 놓치지 말 것)

이 두 가지는 "주장 vs 증명"이 갈라지는 지점이라 **명시적 차단 체크**로 다룬다. 도메인 커버리지만 보고 "통과"라고 말하지 마라 — 게이트는 **전체(All files)** 기준이다.

1. **전체 커버리지를 직접 측정해 수치를 붙여라.** `pnpm test:coverage`의 **All files 행**(statements)이 ≥80%인지 확인하고 그 수치를 리포트에 텍스트로 인용한다. 도메인 한 줄만 인용하는 것은 false PASS다.
2. **UI 테스트 존재 확인.** `find src/components -name '*.test.tsx' | wc -l`이 0이면 → **HIGH(차단)**. 컴포넌트가 있는데 컴포넌트 테스트가 0이면 커버리지 게이트는 거의 항상 미달이다.
3. **테스트 스크립트가 watch가 아닌지.** `pnpm test`가 `vitest run`인지 확인(`vitest`만이면 비-TTY에서 hang). 전체 suite가 2분 내 exit 0인지 직접 실행으로 확인.
4. **커버리지 스코프 오염 점검.** All files에 `.next/`·config·vendor가 섞이면 수치가 무의미하게 낮아진다 → `vitest.config.ts` coverage `include: ['src/**']` + 프레임워크 엔트리포인트 제외인지 확인.
5. **타입체크를 리더가 직접 재실행 — `vitest run` 그린 ≠ `tsc` 그린.** Vitest는 esbuild로 트랜스파일만 해서 타입 에러가 있어도 통과시킨다. **테스트 파일의 타입 에러**(예: `let x = getByRole(...)` 후 `x = queryByRole(...)` → `HTMLElement | null` 미할당)는 유닛은 그린이지만 `tsc --noEmit`·`next build`는 실패한다. 에이전트의 "TypeScript strict mode: pass"/"build succeeds" **주장은 리더가 `npm run typecheck`를 직접 재실행해 0-error를 본 뒤에만** 인정. (이번 빌드 재발: ui-engineer가 build pass 주장 → tsc 2-error.)

6. **동작/계약을 바꾸면 *기존* 테스트가 조용히 깨진다 — 새 스펙 추가는 회귀 커버가 아니다.** 사다리 개선에서 `data-testid` 변경(`hide-results-toggle`→`shuffle-results-toggle`)·기본값 변경(인원 4→7)·의미 변경(가리기 토글→섞기 토글로 '가시성' 의미 제거) 후, 엔지니어가 **새 E2E 스펙만 추가**하고 기존 4개 스펙(옛 testid·`toHaveCount(4)`·사라진 '가시성 모드' 단언)을 갱신하지 않아 전부 실패했다(리더가 전체 suite 실행으로 적발 — 단위 679·신규 스펙은 그린이라 가려졌다). **예방:** 공유 셀렉터/기본값/의미를 바꾸면 ① 옛 식별자를 전 스펙에서 grep(`grep -rn '<old-testid>\|<old-key>\|toHaveCount(<old>)' tests/`)해 갱신 ② 새 스펙만이 아니라 **해당 기능의 *전체* 기존 E2E suite를 직접 재실행**해 그린 확인. 또한 같은 셀렉터가 *다른 작업*으로 다중 매칭되면 strict-mode 위반(홈 `a[href*="/tools/ladder"]`가 툴카드+푸터로 2개 → 깨짐) → 단일 매칭 보장 또는 `.first()`/구체 셀렉터.

이 중 하나라도 측정 없이 "통과" 선언하면 그것이 곧 거짓 통과다.

## 시각/SSR 렌더 하드 게이트 (이번 빌드의 핵심 교훈)

**`pnpm build` 그린 + 357 유닛 그린 + axe PASS가 모두 통과해도 화면이 깨져 있을 수 있다.** 한 빌드에서 Tailwind v4가 v3 `tailwind.config.ts`를 로드하지 않아(@config 브리지 누락) 디자인 토큰 유틸이 전부 미생성 → 거의 무스타일 페이지였는데도 빌드·테스트·axe 모두 그린이었다. 또 그리드가 `useSearchParams`+Suspense로 CSR-only 렌더되어 정적 HTML에 도구 링크가 없었고(SSG/SEO 회귀), 라이브 카드 링크는 로케일 프리픽스가 빠져 404였다. **리더는 "스크린샷을 찍었다"가 아니라 렌더된 화면과 SSR HTML을 직접 본 뒤에만 통과로 인정한다.**

1. **렌더 화면을 직접 본다(eyeball).** 320/768/1024/1440 + 다크 + 빈상태/404 스크린샷을 **Read로 실제로 열어** 레이아웃·디자인 토큰·마스코트가 의도대로인지 본다. "11개 캡처됨"은 증명이 아니다.
2. **SSR HTML에 콘텐츠가 있는지 curl로 확인.** `curl -s localhost:PORT/ko`에 그리드 카드·`<a href="/ko/tools/SLUG">`(로케일 프리픽스 포함)가 **실제 DOM으로** 존재하는지 grep. 제목 텍스트가 RSC 페이로드 script에만 있고 `<a>`가 0이면 → CSR-only 회귀(CRITICAL).
3. **CSS에 커스텀 토큰 유틸이 생성됐는지 확인.** `.next/static/css/*.css`에 `.bg-surface`·`.shadow-card`·`.max-w-container`가 있는지 grep. 없으면 Tailwind 설정 미적용(CRITICAL) — v4는 v3 config를 `@config`로 명시 로드해야 한다.
4. **토큰명 충돌 주의.** spacing 토큰을 t-shirt명(`sm/md/lg`)으로 쓰면 v4에서 `max-w-md`가 spacing.md(16px)로 해석될 수 있다 → 임의값(`max-w-[540px]`)으로 회피.
5. **신규 오버레이/팝오버/드롭다운/확장 입력은 boundingBox 치수를 측정.** role/presence 존재 검사(유닛·axe·스냅샷)는 **너비 붕괴를 못 잡는다**. 이번 빌드: 헤더 검색 입력이 `absolute left-0 right-0`를 컨텐츠 폭(아이콘 ~40px, 열림 시 0-width) `relative` 래퍼 안에 둬서 **26px로 붕괴**됐는데 19개 유닛·타입·axe 모두 그린이었다. → 열린 위젯을 Playwright로 띄워 `boundingBox().width`가 사용가능 임계값(예: >140px) 이상이고 뷰포트 밖으로 넘치지 않는지 **E2E로 단언** + 열린 상태 스크린샷을 Read로 직접 본다. 정렬 검증도 마찬가지로 `boundingBox().x` 비교로 단언(검색창·필터·카드 좌측 엣지 ±2px).
6. **`aria-pressed`/role이 통과해도 컨트롤이 시각적으로 안 보일 수 있다 — 선택/활성 상태의 대비를 눈으로 확인.** 긴장도 세그먼트가 미존재 토큰(`bg-surface-secondary`·컬러 접미사 빠진 `bg-accent`)으로 **활성 버튼이 투명배경+흰글자=비가시**였는데 유닛·E2E(`aria-pressed=true`만 검사)·빌드 모두 그린이었다(리더 스크린샷으로 적발). 새 세그먼트/토글/탭은 ① className 토큰을 `tokens.css`/`globals.css` 실재 여부로 grep 대조(미존재 토큰은 `transparent`) ② 선택 상태 스크린샷을 Read로 열어 활성 항목이 실제로 도드라지는지 확인.

빌드/테스트 그린은 "코드가 컴파일·통과"를 증명할 뿐, "화면이 의도대로 렌더"를 증명하지 않는다. 이 둘은 별개의 게이트다.

### 서버 띄우기 전 환경 위생 (검증이 가짜 500에 막히지 않게)

화면 검증을 하려고 `next start`를 띄웠는데 `/ko`가 **500**이면, 코드가 아니라 **검증 환경**이 오염된 경우가 많다(이번 세션 실제 발생, 시간 낭비).

- **포트 점유:** 이전 세션의 죽은 서버가 :3000을 잡고 500을 반환 + 새 start는 `EADDRINUSE`. → `lsof -ti tcp:3000 | xargs kill -9` 후 재기동.
- **stale `.next`:** `Cannot find module './vendor-chunks/...'` 또는 App Router 전용인데 `pages/_document.js` 참조가 보이면 `next dev` 잔재로 `.next`가 섞인 상태. → `rm -rf .next && (npm run build)` 후 start. 내 `next build` 자체는 그린이었어도 서빙은 깨질 수 있다.
- 500을 "내 변경이 깨뜨렸다"로 단정하기 전에 **서버 로그를 먼저 읽어** 모듈 누락/포트 에러인지 구분한다.

### E2E 검증 서버는 Playwright `webServer`에 맡긴다 (수동 `pnpm start` 의존 금지)

리더가 시각 검증용으로 띄운 장수명 `pnpm start`가 **E2E 도중 죽으면** 모든 스펙이 `Test timeout`·`element(s) not found`로 전멸한다 — 그런데 같은 스펙을 **단독 실행하면 통과**라서 *코드 결함*처럼 보이는 가짜 실패다(이번 세션 실제: 병렬 19 fail·직렬도 전멸, 단독은 10/10 그린).

- **신호 판별:** 단독 그린인데 전체(병렬·직렬 무관) 대량 실패 → 거의 항상 **죽은 서버**. 코드를 의심하기 전에 `curl -s -o /dev/null -w '%{http_code}' localhost:3000/...`로 **서버 생존부터 확인**(`000` = 다운).
- **근본 처방:** 검증용 수동 서버를 따로 띄우지 말고 **포트 3000을 비워** Playwright가 `playwright.config`의 `webServer`(`reuseExistingServer:true`)로 서버 생애주기를 직접 관리하게 한다(필요 시 `build+start`까지 수행·종료). 그래야 한 번에 그린(이번: 35 passed).
- 리더의 인터랙티브 MCP 브라우저 세션이 같은 단일 서버에 부하를 더해 병렬 워커와 경합할 수 있다 → E2E 돌리기 전 **MCP 브라우저를 닫는다**.
- 수동 서버를 꼭 써야 하면 각 검증 직전 `curl` **헬스체크 게이트**를 둔다.
- **`reuseExistingServer:true`는 :3000에 떠 있는 서버가 *어느 빌드*든 그대로 재사용한다 — 직전 세션/이전 QArun의 stale 서버면 수정 전 코드를 검증한다(가짜 결과).** 검증 전 :3000 점유 프로세스를 확인하고, 내 수정이 반영된 빌드인지 의심되면 **kill 후 fresh `build`** 하거나 Playwright가 새로 `build+start`하게 비운다. 잠긴 MCP 브라우저 프로파일(`ms-playwright-mcp/mcp-chrome-*`의 `SingletonLock`)이 navigate를 막으면 해당 프로파일을 쓰는 chrome만 골라 kill + 락 파일 제거(사용자 본체 Chrome은 건드리지 말 것).

### 인터랙티브 E2E '타임아웃'은 대개 런타임 크래시다 — 콘솔부터 본다 (이번 빌드의 핵심 교훈)

도구가 `mounted` 게이트 뒤에 있는데 E2E가 composer/탭을 못 찾고 `Test timeout`이 나면 **"하이드레이션이 안 풀렸다"고 추측하지 말고** 먼저 **브라우저 콘솔 에러를 수집**한다. Q&A a Day에서 QA 에이전트는 "mount timeout"으로 오진하고 콘솔을 안 봤는데, 실제론 `RangeError: Invalid language tag`(i18n 키를 `Intl`에 넘김)가 **ErrorBoundary에 잡혀 도구 전체가 폴백으로 대체**된 것이었다(빌드·유닛 그린). 진단 순서:

1. **콘솔 에러 먼저:** Playwright/`browser_console_messages`로 `error` 레벨을 수집 — `ErrorBoundary`/`RangeError`/`MISSING_MESSAGE`/`Maximum update depth`가 있으면 그게 근인. (`MISSING_MESSAGE: tools.x.key`는 컴포넌트가 카탈로그에 없는 `t()` 키를 쓴다는 신호.)
2. **무엇이 렌더됐는지 스냅샷:** ErrorBoundary 폴백/스켈레톤이 떠 있는지 accessibility snapshot으로 확인 — "타임아웃"의 실체를 본다.
3. **'발견'을 프리렌더 HTML로 교차검증:** JSON-LD/메타/SEO 본문은 클라이언트 런타임이 아니라 **`.next/server/app/**/<slug>.html`**(또는 `curl`)에서 `application/ld+json`·`<title>`·`hrefLang`(카멜케이스!)을 grep해 확인한다. "JSON-LD 없음" 같은 보고는 정적 HTML을 보기 전엔 내지 말 것(이번에 QA가 stale/오판 보고).
4. **지속성(reload) 검증:** 답 입력 후 `localStorage` 키를 직접 읽어 엔트리가 실제로 쓰였는지 확인하고 `page.reload()` 후 값이 남는지 단언 — "저장됨" 표시만으로는 부족(디바운스가 표시 후 늦게 쓰면 reload에서 유실, 실제 발생).

## SEO/GEO 발견성 하드 게이트 (프리렌더 HTML로만 통과)

발견성은 이 제품의 성장 엔진이다(원칙 ③) — 도구가 검색(사람)과 생성엔진(AI: ChatGPT·Perplexity·Gemini·Claude)에 노출돼야 한다. **AI 크롤러는 대개 JS를 실행하지 않으므로 `mounted` 게이트/CSR 뒤의 메타·JSON-LD·콘텐츠는 그들에게 없는 것이다.** 따라서 발견성은 "컴포넌트가 렌더된다"가 아니라 **프리렌더 정적 HTML에 실재하는가**로만 통과시킨다(seo-geo-engineer의 게이트와 연동, `seo-geo-optimization` 스킬).

빌드 후 `out/<locale>/tools/<slug>.html`(정적 익스포트) 또는 `curl -s localhost:PORT/<locale>/tools/<slug>`로 확인:

1. **도구별 고유 메타.** `<title>`·`<meta name="description">`·`<link rel="canonical">`·`hrefLang`(주의: Next는 **카멜케이스** `hrefLang` — 소문자 grep은 헛침)이 존재하고 **도구마다 다른지**. 두 도구가 같은 title/description이면 → HIGH(중복). `generateMetadata` 누락 시 전부 없음(과거 drift).
2. **JSON-LD 존재 + 유효 + url 일치.** `application/ld+json` 블록을 꺼내 `JSON.parse`가 성공(유효)하고, 그 `url`이 `<link rel=canonical>` == sitemap 항목과 **동일**한지(전부 `seo.absoluteToolUrl(locale,slug)` 단일 소스). 하드코딩 drift(`jurepi.kr/tools/*` vs `apps.jurepi.kr/<locale>/...`)는 과거 실제 발생.
3. **JSON-LD가 셸(SSR)에서 나오는지.** 도구 성격에 맞는 타입(공통 SoftwareApplication+FAQPage, 해당 시 HowTo·DefinedTermSet·BreadcrumbList)이 정적 HTML에 있는가. **0개면 거의 항상 클라이언트 섬/`mounted` 게이트 안에서 렌더한 것**(Q&A a Day 실제: 게이트로 감싸 JSON-LD·howTo 0개, 빌드·유닛 그린). → CRITICAL, seo-geo/platform으로 반송(게이트 밖 SSR로).
4. **SSR 롱폼.** Intro/HowTo/FAQ 텍스트가 정적 HTML에 존재(인덱싱·인용 대상). `<details>`로 접혀도 DOM엔 있어야 한다.
5. **사이트 수준.** `/robots.txt`가 AI 크롤러(GPTBot·PerplexityBot·ClaudeBot·Google-Extended·CCBot 등)를 **막지 않고**, `/sitemap.xml`에 도구×로케일이 절대 URL로 있고, `/llms.txt`가 200 + 해당 도구를 등재하는지.

재현 스니펫:
```bash
f=out/ko/tools/<slug>.html
grep -o '<title>[^<]*' "$f"; grep -o 'rel="canonical" href="[^"]*"' "$f"; grep -c 'hrefLang' "$f"
# JSON-LD 유효성 + url 대조
node -e "const h=require('fs').readFileSync('$f','utf8');[...h.matchAll(/<script type=\"application\/ld\+json\">(.*?)<\/script>/gs)].forEach(m=>{const j=JSON.parse(m[1]);console.log(j['@type'], j.url)})"
grep -c 'application/ld+json' "$f"   # 0 이면 CSR-only 회귀(CRITICAL)
```

## 심각도 분류

| 등급 | 의미 | 행동 |
|------|------|------|
| CRITICAL | 공정성 깨짐, 계약/데이터 불일치, CLS 초과, 빌드 실패 | **차단** — 진행 전 수정 |
| HIGH | 기능 버그, 접근성 위반, CWV 초과 | 합류 전 수정 권고 |
| MEDIUM | 유지보수성/일관성 | 가능하면 수정 |
| LOW | 스타일/사소 | 선택 |

## 보고 규율

- 발견은 **재현 명령 + 기대 vs 실제**를 항상 함께. 엔지니어가 바로 고칠 수 있게.
- 검증 못 한 항목은 "미검증"으로 명시 — 침묵 누락 금지(거짓 통과 만들지 말 것).
- 경계 불일치는 **양쪽 당사자 모두**에게 통지(누가 고칠지 분명히).
- CRITICAL/HIGH는 즉시 해당 엔지니어 + 리더에게.

## 흔한 함정

- 한 계층만 보고 "통과" 선언 → 경계는 *두 쪽을 같이* 봐야 보인다.
- `waitForTimeout` 기반 E2E → 플레이크. 결정적 대기.
- 공정성 테스트를 느리다고 건너뜀 → CRITICAL 회귀 놓침. 항상 재확인.
- ko/en 키를 눈으로만 대조 → 스크립트로 집합 차이를 뽑아라.
- 반복 검증 코드를 매번 재작성 → `references/boundary-checks.md`의 스니펫을 재사용하고, 반복되면 scripts/로 번들 제안.
- **에이전트의 "N passed"가 파일/디렉토리 부분 실행(`vitest run <dir>`) 결과면 회귀 증명이 아니다 — 리더/QA가 전체 `pnpm test`를 재실행해 수치를 확인한 뒤에만 통과로 인정한다.** 실제: ui-engineer가 "consent 10/10"만 보고했으나 전체 스위트엔 `Footer.test` 7 실패(새 ConsentProvider 미래핑)가 있었다. **새 전역 Provider 도입·공용 호스트(Footer/Header/layout) 변경 후엔 특히 전체 재실행.**
- **클라이언트 측 JSON-LD(`softwareApplicationJsonLd` 등)의 `url`은 메타데이터 canonical과 같은 소스(`NEXT_PUBLIC_SITE_URL`+로케일)를 써야 한다 — 하드코딩하면 canonical과 drift한다.** 실제: 도구 JSON-LD가 `https://jurepi.kr/tools/<slug>`(도메인 틀림+로케일 누락)로 하드코딩돼 `<link rel="canonical">`(`apps.jurepi.kr/<locale>/...`)·sitemap과 불일치. 교차 체크: 빌드 `out/<locale>/tools/<slug>.html`에서 JSON-LD `url` == canonical href == sitemap 항목인지 grep 대조(`seo.absoluteToolUrl(locale, slug)` 재사용).
- **i18n 키 대조는 *도구 내부 chrome*(`tools.<slug>.search`/`detail`/…)뿐 아니라 *레지스트리가 소비하는 최상위* `tools.<slug>.title`·`tools.<slug>.description`도 포함해야 한다.** `lib/searchable-tools.ts`가 `t('tools.<id>.title')`·`t('tools.<id>.description')`로 홈 툴카드·푸터·전역 검색 이름/설명을 만든다 — 이 두 키가 없으면 **대시보드·푸터에 `tools.new-word.title` 리터럴이 그대로 노출**되는데 typecheck·유닛·빌드는 모두 그린(실제 new-word 발생, 리더 홈 HTML grep으로 적발). 게이트: `out/<locale>.html`(홈)에서 각 라이브 도구의 이름/설명이 리터럴 키가 아닌 실제 텍스트인지 + `tools.<slug>.title`/`.description`이 ko/en 양쪽에 있는지 확인.
- **E2E는 "작성됨 ≠ 통과"다 — 리더/QA가 실제로 실행해 0 failed를 눈으로 봐야 한다.** `webServer`가 `pnpm build && serve out`이면 빌드가 180s 타임아웃을 넘겨 스펙이 아예 안 돌고 "스크립트 준비됨"으로 보고되기 쉽다(실제 new-word 발생). **예방:** 검증 전 `out/`을 빌드한 뒤 `serve out -l 3000`을 미리 띄우고 `reuseExistingServer:true`로 `pnpm exec playwright test <spec>`를 돌려 빌드 재실행을 건너뛴다 — 실제 pass/fail 수치를 붙인다. 컴파일만 된 스펙은 통과가 아니다.
- **E2E 스펙 작성 결함(그린 아닌 레드로 드러남)**: schema.org 속성명을 지어내지 말 것(`hasDefinedTerm`이 표준, `hasTerms` 아님) · 상호작용으로만 나타나는 UI(예: 언어 토글은 term 선택 후에만 렌더)는 단언 전에 상태를 먼저 만든다 · 디바운스/즉시쓰기 타이밍에 맞춰 대기(예: 즐겨찾기 즉시 persist면 reload 전 대기 불필요, 디바운스면 flush 대기).
