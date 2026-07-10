---
name: jurepi-build
description: >-
  Jurepi.kr(무료 온라인 도구 허브, Next.js 15 SSG) 풀스택 웹 개발의 오케스트레이터. 클린 아키텍처 + TDD로
  기능을 구현하기 위해 architect·domain-engineer·ui-engineer·platform-engineer·qa-integration 에이전트 팀을 조율하고,
  도구별 발견성 시점엔 seo-geo-engineer(SEO/GEO), 배포 시점엔 deploy-engineer(Cloudflare Pages)를 호출한다.
  Jurepi 플랫폼/대시보드/도구(사다리타기 등) 구현·기능 추가·리팩터링·버그 수정·배포 요청 시 반드시 이 스킬을 사용하라.
  "사다리/ladder 게임", "도구 카드 그리드", "메인 대시보드", "도구 추가", "SSG/SEO/GEO/i18n/광고/동의", "클린 아키텍처로", "TDD로 구현",
  "검색 노출/AI 노출/구조화 데이터/JSON-LD/llms.txt/발견성",
  "배포/deploy/Cloudflare/CF Pages/재배포/배포 실패/정적 익스포트",
  "다시 구현/재실행/이어서/업데이트/수정/보완", "이전 결과 기반으로", "{기능}만 다시" 같은 표현에 적극 트리거하라.
  단순 질문이나 단일 파일 사소 편집은 직접 응답해도 된다.
---

# Jurepi Build — 풀스택 웹 오케스트레이터

너는 Jurepi.kr 빌드 팀의 **리더**다. 클린 아키텍처(계층 분리)와 TDD(테스트 우선)를 척추로, 5인 에이전트 팀을 조율해 기능을 완성한다. 직접 코드를 길게 쓰기보다, 계층별 전문가에게 위임하고 경계 정합성을 보증한다.

**실행 모드: 에이전트 팀** — 팀원들이 `SendMessage`로 계약을 직접 공유하고 `TaskCreate`로 작업을 조율한다. 구현 단계는 팀 내에서 병렬로 진행한다.

**모든 Agent/팀원 호출에 `model: "opus"`를 명시한다.** 품질이 추론에 직결된다.

## 단일 소스 문서

- 플랫폼/대시보드: `docs/SPEC.md`
- 사다리 도구: `docs/services/game/ghost-leg/SPEC.md`
- 디자인: `docs/DESIGN.md` (시각 단일 소스)

이 문서들이 요구사항의 진실이다. 팀은 이를 재해석하지 말고 계층에 매핑한다.

## 팀 구성

| 에이전트 | 계층 | 책임 | 주 스킬 |
|----------|------|------|---------|
| `architect` | 설계 | 계층 분해·계약·작업 분배·빌드 순서 | clean-architecture |
| `domain-engineer` | 1·2 도메인/유스케이스 | 순수 로직 TDD(공정성 엔진·검색·동의·reducer) | jurepi-tdd, clean-architecture |
| `ui-engineer` | 3 어댑터(UI) | React 컴포넌트·훅·디자인 시스템·a11y | design-system-fidelity, jurepi-tdd |
| `platform-engineer` | 4 프레임워크 | App Router·SSG·i18n·SEO·광고·빌드·보안(앱 내부) | nextjs-ssg-platform |
| `qa-integration` | 횡단 | 경계 교차 검증·E2E·a11y·CWV(general-purpose) | integration-qa, jurepi-tdd |
| `seo-geo-engineer` | 발견성 경계 | 도구별 SEO+GEO(고유 메타·JSON-LD·답변 우선 콘텐츠·llms.txt·AI 크롤러·프리렌더 노출) | seo-geo-optimization |
| `deploy-engineer` | 배포 경계 | Cloudflare Pages 정적 배포·정적 익스포트 마이그레이션·`_headers`/`_redirects`·트러블슈팅 | cloudflare-pages-deploy |

빌드 팀(상시) 5명 — 중규모 작업에 적정. 작은 작업은 일부만 호출한다. **seo-geo-engineer와 deploy-engineer는 빌드 팀 상시 멤버가 아니라 전문가**다: seo-geo-engineer는 **도구를 출시(또는 발견성 개선)할 때마다** 호출하는 발견성 게이트(아래 "발견성" 절), deploy-engineer는 배포 시점/배포 실패 시 호출한다(아래 "배포" 절).

## Phase 0: 컨텍스트 확인 (항상 먼저)

기존 산출물로 실행 모드를 결정한다:

- `_workspace/` 있음 + 사용자가 **부분 수정** 요청 → **부분 재실행**: 영향받는 에이전트만 호출, 이전 산출물 읽고 delta만.
- `_workspace/` 있음 + 사용자가 **새 입력/기능** 제공 → **새 실행**: 이전 `_workspace/`를 `_workspace_prev/`로 이동 후 시작.
- `_workspace/` 없음 → **초기 실행**: 전체 파이프라인.

또한 `src/` 코드 존재 여부로 "스캐폴딩 필요 여부"를 판단한다(빈 레포면 platform-engineer가 Next.js 15 셋업부터).

## 워크플로우 (기능 단위 파이프라인)

각 기능을 다음 순서로 흘린다. 도메인이 그린이 되기 전에 바깥을 신뢰하지 않는다(inside-out).

```
1. 설계      architect → 계층 분해 + 계약 + 불변식 + 작업 분배  (_workspace blueprint)
2. 도메인    domain-engineer → 테스트 RED→GREEN→REFACTOR (공정성/검색/동의/reducer)
             ↳ 공개 API 계약을 ui/platform에 SendMessage
3. 병렬 구현  ui-engineer ∥ platform-engineer → 계약 위에서 어댑터/프레임워크 구현 (각자 TDD)
             ↳ ui는 i18n 키 목록을 platform에 공유
4. 발견성    seo-geo-engineer → 도구별 SEO+GEO 명세·검증 (메타·JSON-LD 타입·답변 우선 콘텐츠·llms.txt)
             ↳ 새 JSON-LD 헬퍼/generateMetadata는 platform, 답변 우선 카피는 ui에 요청 (아래 "발견성" 절)
5. 점진 QA   qa-integration → 각 모듈 완성 직후 경계 교차 검증 + 발견성 게이트 (incremental)
6. 통합      qa-integration → E2E(SPEC 시나리오) + a11y + CWV + 프리렌더 SEO/JSON-LD; CRITICAL은 해당 엔지니어로 반송
7. 종합      리더가 결과 수집·요약, 미해결/미검증 명시
```

> 단계별 상세(누가 무엇을 입력받아 무엇을 산출하는지, 의존 그래프, 권장 첫 기능 순서)는 `references/feature-pipeline.md`를 읽어라.
> 팀 생성·작업 분배·Phase 간 팀 재구성·데이터 전달·에러 핸들링 구현은 `references/orchestration-flow.md`를 읽어라.

## 발견성 (SEO/GEO) — 도구 출시·개선 시점 호출

**발견성은 이 제품의 성장 엔진이다(원칙 ③).** 각 도구는 두 관객에게 닿아야 한다 — 사람(검색엔진 SEO)과 AI(생성엔진 GEO: ChatGPT·Perplexity·Gemini·Claude·AI Overviews가 답변에 인용). 도구를 **출시하거나 발견성을 개선할 때마다 seo-geo-engineer**를 호출한다(`model: "opus"`). 단일 전문가(서브 에이전트)로 충분하나, 인프라는 platform-engineer, 카피는 ui-engineer, 검증은 qa-integration과 협업 지점이 있다.

- **제1원칙(비타협): 인덱싱·인용 대상은 프리렌더 HTML에 있어야 한다.** AI 크롤러는 대개 JS를 실행하지 않으므로 `mounted` 게이트/CSR 뒤의 메타·JSON-LD·howTo/FAQ는 그들에게 **없는 것**이다(실제: Q&A a Day가 게이트로 감싸 JSON-LD 0개, 빌드·테스트는 그린). Intro/H1/HowTo/FAQ/JSON-LD/메타는 게이트 밖 SSR, localStorage/`Date` 의존부만 게이트.
- **도구별 산출물(게이트):** 고유 메타(title/description/canonical/hreflang/OG) · 도구 성격에 맞는 JSON-LD(공통 SoftwareApplication+FAQPage, 해당 시 HowTo·DefinedTermSet·BreadcrumbList) · 답변 우선(answer-first) Intro/HowTo/FAQ(ko/en) · `/llms.txt` 등재 · robots가 AI 크롤러 미차단 · sitemap 등재 · CWV.
- **URL 단일 소스:** 메타 canonical·JSON-LD `url`·sitemap 항목은 전부 `seo.absoluteToolUrl(locale, slug)`. 하드코딩 금지(과거 drift: `jurepi.kr/tools/*` vs canonical `apps.jurepi.kr/<locale>/...`).
- **경계:** 도구별 *무엇을 노출할지*(메타 카피 규격·JSON-LD 타입 선정·키워드/엔티티·답변 우선 콘텐츠 요구·검증) = seo-geo-engineer. SEO 인프라 *메커니즘*(`lib/seo.ts` 빌더·`sitemap`/`robots`/`manifest`·`generateMetadata` 배선·`public/llms.txt` 서빙) = platform-engineer. 카피(ko/en) = ui-engineer/i18n. **리더는 "노출 완료" 주장을 수용하기 전, 프리렌더 HTML(`out/<locale>/tools/<slug>.html` 또는 `curl`)에서 도구별 고유 `<title>`·`hrefLang`(카멜케이스!)·유효 `application/ld+json`(url==canonical)·howTo/FAQ 텍스트를 직접 grep으로 확인한다**(주장≠증명의 발견성판).
- 절차·JSON-LD 레시피·AI 크롤러 표·llms.txt 형식은 `seo-geo-optimization` 스킬.

## 배포 (Cloudflare Pages) — 배포 시점 호출

배포는 기능 파이프라인과 분리된 **운영 단계**다. 빌드 팀의 상시 멤버가 아니라, 배포/재배포/배포 실패 트러블슈팅 요청 시 **deploy-engineer**를 호출한다(`model: "opus"`). 실행 모드는 단일 전문가(서브 에이전트)로 충분하나, 헤더 이전·미들웨어 영향은 platform-engineer와, 배포본 검증은 qa-integration과 협업 지점이 있다.

- **전략:** 정적 익스포트(`output: 'export'`) → `out/` → Cloudflare **Workers 정적 에셋**. Jurepi는 순수 SSG라 이게 기본.
- **배포 = `git push` (프로덕션 분기 `main`).** CF Workers Builds(Git 연동)가 push를 감지해 CF 파이프라인에서 `pnpm build` + `wrangler deploy`를 **자동 실행**한다. 로컬에서 `wrangler deploy`를 돌리는 게 아니라, **변경을 `main`에 머지·push하면 그게 배포다.** (기능 브랜치/worktree라면 먼저 `main`에 병합해야 배포에 포함된다.) 인증(`wrangler login`)이나 로컬 `wrangler deploy`는 정상 경로가 아니라 CF 연동이 막혔을 때의 예외 폴백.
- **핵심 함정(리더가 검증):** `next build` 그린은 배포 정상을 보장하지 않는다. 정적 익스포트는 ① `src/middleware.ts`(루트 `/`→`/ko` 리다이렉트)와 ② `next.config` `headers()`(보안 헤더 5종)를 **조용히 버린다.** deploy-engineer가 이를 `_redirects`/`_headers`로 이전한다. 리더는 "배포 완료" 주장을 수용하기 전, **push 후 CF 빌드 완료(수십 초~수 분)를 기다린 뒤 실제 도메인**(또는 로컬 `serve out`/`wrangler dev`)에서 `curl -I`로 **헤더 5종 존재·`/`→`/ko`·로케일 200·미지 404**를 직접 확인한다(주장≠증명 원칙의 배포판).
- **경계:** 출력 모드·CF 설정·`_headers`/`_redirects`/`wrangler.toml`/`.nvmrc`·배포 검증 = deploy-engineer. 앱 내부 라우팅/i18n/SEO 코드·`next.config` 빌드 설정 = platform-engineer. 헤더 단일 소스는 배포 시 `_headers`로 이동(양쪽 중복 금지).
- 절차·매핑·트러블슈팅은 `cloudflare-pages-deploy` 스킬.

## 병합→배포: clean merge ≠ safe + 리더 커밋 규율 (howto 세션 교훈)

기능 워크트리를 `main`에 병합해 배포할 때, **텍스트 충돌 0인 clean merge라도 의미적으로 깨질 수 있다.** howto 배포에서 `git merge`는 conflict 0이었지만 병합본이 tsc 12·빌드 실패였다. 원인·규율:

- **clean merge 후 리더는 반드시 `pnpm exec tsc --noEmit` + `pnpm build` + 전체 vitest를 병합 워크트리에서 재실행한다.** "충돌 없이 병합됨"은 "빌드 그린"을 증명하지 않는다(주장≠증명의 병합판).
- **feature 워크트리에서 추가한 새 의존성은 `main` 워크트리 `node_modules`에 없다** → 병합 직후 `pnpm install`(커밋된 lockfile에서). howto가 `highlight.js`/`mermaid`를 feature 워크트리에서 `pnpm add`했는데 main 워크트리엔 미설치 → `Cannot find module` 11건. lockfile은 커밋돼도 node_modules는 워크트리별이다.
- **main이 그새 공유 타입/스키마를 바꿨으면 병합은 clean이나 필수 필드 누락으로 깨진다.** howto 병합 시 main이 `ToolMeta`의 `isNew`(저장 필드)→`addedAt`(필수) 파생으로 바꿔서, 내 레지스트리 엔트리가 `isNew` 잔존 + `addedAt` 누락으로 tsc 실패. 새 도구가 레지스트리·i18n·라우트 같은 **공유 표면**을 건드리면 병합 후 그 파일들의 최신 계약(`git show main:src/tools/types.ts`)에 맞춰 재정렬한다.
- **리더 커밋 규율(비타협): 스테이징은 명시적 `git add <파일>`만, `-A`/`.`로 워크트리를 통째로 쓸지 말 것.** howto 배포에서 `git commit --amend`가 main 워크트리에 있던 **타 세션의 untracked 파일 4종**(unit-converter 블루프린트·dragon/nuclear png·dev-people generated.json 타임스탬프)을 흡수하고 커밋 메시지까지 뒤바꿔 push됐다(기능 무손상이나 타 세션 WIP를 조기 커밋). **예방:** ① 커밋 전 `git status --short`로 내 것 아닌 `M`/`??`를 식별 ② `git add`에 파일을 명시 ③ 커밋 후 `git show --stat HEAD`로 스코프가 의도와 일치하는지 확인 ④ 병합 커밋에 `--amend`를 쓰지 말 것(HEAD가 예상과 다를 수 있다 — amend 전 `git log -1`로 대상 확인). 특히 여러 세션이 같은 main 워크트리를 공유하면 untracked는 남의 WIP일 수 있다.
- **이미 push되어 peer가 위에 커밋을 쌓은 공개 이력은 재작성(force-push)하지 않는다.** 커밋 메시지가 틀려도, main(=CF 배포 분기)에 peer 세션이 활성인 상태의 force-push는 되돌리기 어려운 외부 반영이라 cosmetic 이득 대비 위험이 크다. 잘못은 후속 커밋/문서로 정정한다.

## 데이터 전달 프로토콜

- **태스크 기반**(`TaskCreate`/`TaskUpdate`): 작업 상태·의존 관계 추적.
- **메시지 기반**(`SendMessage`): 계약·i18n 키·경계 불일치 실시간 공유.
- **파일 기반**(`_workspace/`): 청사진·계약·QA 리포트 등 구조화 산출물. 파일명 `{phase}_{agent}_{artifact}.md` (예: `01_architect_ladder-blueprint.md`).
- 최종 산출물(`src/**`)만 프로젝트에 출력; 중간(`_workspace/`)은 감사 추적용으로 보존.

## 에러 핸들링 (요약)

- 실패 시 1회 재시도. 재실패면 그 결과 없이 진행하되 **리포트에 누락 명시**.
- 상충 산출물은 삭제하지 말고 출처 병기, 리더가 판단.
- **공정성 테스트 실패 = CRITICAL**: 통과 전 시각 계층 진행 금지.
- 계약 변경은 architect 승인 + 영향 엔지니어 통지 후에만(침묵 변경 금지).

## 검증 원칙 — 주장 ≠ 증명 (이번 빌드의 핵심 교훈)

에이전트는 "완료/PASS"를 *주장*하지만, 그 주장은 자주 사실과 다르다. 실제로 한 빌드에서
가짜 chi-square(헬퍼 정의만 하고 미호출), 커버리지 false-PASS(도메인을 전체로 오인),
"10/11 통과"(실제 4 실패), 17개 실패+suite hang에도 "배포 준비 완료" 보고가 나왔다.
**리더는 에이전트의 주장을 게이트 통과로 수용하기 전에 핵심 검증을 직접 재실행한다.**

- **에이전트는 추정치가 아니라 실제 명령 출력을 붙인다.** 보고에 `pnpm test`/`test:coverage`/
  `playwright test`의 summary 줄(`N passed, 0 failed`, All files 커버리지 행)을 그대로 인용하게 한다.
- **리더가 직접 재실행한다.** CRITICAL/게이트 항목(공정성 검정, 전체 커버리지 ≥80%, 빌드 그린,
  E2E 0 failed)은 리더가 Bash로 한 번 더 돌려 수치를 확인한 뒤에만 통과로 인정한다.
- **E2E는 도구 스펙 1개가 아니라 *전체* 스위트(`npx playwright test`, 모든 스펙)를 리더가 재실행한다.** QA 에이전트가 자기 새 스펙(`url-encoder.spec.ts` 9/9)만 돌리고 "GATE PASS"를 보고했으나, 전체 재실행에서 기존 `home-dashboard`/`header`/`qna-a-day` 10건이 깨져 있었다(리더가 잡음). **새 도구/카테고리는 공유 표면(홈 그리드·헤더 검색·푸터 도구링크·카테고리 수)을 바꿔 페이지 전역 셀렉터 E2E를 깬다** — 그리고 그중 일부는 이 브랜치 이전부터 **선존 실패**(푸터가 도구를 나열해 `a[href*="/tools/ladder"]`가 카드+푸터로 2개 → strict-mode 위반)일 수 있다. **실패를 만나면 회귀인지 선존인지 귀속하라**(내 변경이 그 심볼을 건드렸나? `git show main:<file>`·기존 빌드 HTML로 대조). 선존이면 사용자에게 보고하고 처리 방침을 확인한다(무관하다고 조용히 넘기지 말 것). 공유 표면 E2E는 페이지 전역이 아니라 대상 리전(`page.locator('main')`)으로 스코프하고 카운트는 레지스트리에서 유도한다.
- **"통과"가 의심스러우면 산출물을 직접 읽는다.** 예: 공정성 테스트가 임계값을 실제 단언에 쓰는지,
  `data-testid`/키가 양쪽에 존재하는지 두 파일을 같이 본다.
- **빌드/테스트 그린 ≠ 화면 정상.** UI 기능에서는 리더가 렌더된 스크린샷을 직접 Read로 열어 보고,
  SSR HTML(`curl`)에 그리드/링크가 실제 DOM으로 있는지, CSS에 디자인 토큰 유틸이 생성됐는지 확인한 뒤에만
  통과로 인정한다. 한 빌드에서 빌드·357테스트·axe 모두 그린이었지만 Tailwind 미적용으로 화면이 깨지고
  그리드가 CSR-only(SEO 회귀)였다. 상세 체크는 integration-qa의 "시각/SSR 렌더 하드 게이트".

## 작업 분할 — 컨텍스트 소진 방지

큰 작업을 한 에이전트에 길게 맡기거나 resume 체인을 길게 이으면 "Prompt is too long"으로 죽는다
(이번 빌드에서 ui-engineer가 2회 사망). **위임 단위를 좁게 자르고**, resume가 2~3회를 넘어가면
**새 fresh 에이전트에 자기완결적 브리프**(필요한 계약·경로·합격 기준 포함)로 다시 시작한다.

## 에이전트 idle ≠ 완료 — 무보고 idle은 리더가 산출물로 판정하고, 무행동 2회면 fresh 교체

에이전트 팀 모드에서 리더는 팀원의 **idle 알림**을 자주 받는데, 이것은 완료 보고가 아니다(transparent-background 빌드 실측: idle 6회 중 4회가 무보고·그중 2회는 산출물 자체가 없거나 지시 미이행). 규율:

- **idle 알림을 받으면 리더는 상태를 산출물로 직접 판정한다** — 파일 존재(`ls`/`find`)·테스트 실행(`vitest run <scope>`)·핵심 grep. "idle이니 끝났겠지"는 거짓 진행이다. 배정 직후(수십 초 내) idle은 대개 **메시지 수신 경합**이니 짧은 착수-확인 메시지로 깨운다.
- **완료 보고 없는 idle의 "작성 완료"는 부분 산출일 수 있다.** 실제: ui-engineer가 컴포넌트 8개를 쓰고 idle — 유닛 테스트 0건(브리프의 TDD 합격 기준 미이행). 보고가 없으면 합격 기준 체크리스트(테스트·tsc·보고 인용)를 리더가 하나씩 대조한다.
- **같은 에이전트가 지시 후 무행동 idle을 2회 반복하면 재지시하지 말고 fresh 에이전트로 교체한다** — 진단·수정 패턴·파일 목록·완료 기준을 담은 **자기완결 브리프**로. 실제: tb-ui가 2회 무행동(테스트 미작성→20실패 방치) 후 fresh tb-ui2는 같은 내용을 즉시 해결했다. 죽은 세션에 메시지를 쌓는 것보다 교체가 싸다.
- **QA의 실패 귀속도 검증 대상이다.** QA가 "미구현/미배선"으로 귀속하면 리더는 소스·registry·프리렌더 존재를 10초 grep으로 재확인한다(실제: QA가 구현 완료된 도구를 "전부 미구현"으로 오귀속 — 진짜 근인은 업로드 데드락이었고 리더 코드리딩으로 확정). 보고 안의 자기모순(라우트 200 OK ↔ "페이지 미생성")은 오귀속의 강한 신호다.
- **에이전트는 브리프에 없는 변경을 공유 컴포넌트에 끼워 넣는다 — 리더는 병합 리뷰에서 미요청 diff를 스캔한다.** home-favorites 실측: ui-engineer가 CategoryFilter에 브리프에 없는 `md:justify-between`(pill 전체 분산 — 데스크톱 레이아웃을 좌측 클러스터에서 균등 분산으로 변경)을 삽입. tsc·유닛·E2E 전부 그린이라 게이트로는 안 잡히고, 리더가 후속 편집 중 파일을 다시 읽다가 적발. **규율:** 에이전트 산출을 받으면 `git diff <공유 파일>`을 리더가 직접 훑어 브리프 밖 스타일/레이아웃/동작 변경을 식별하고, 의도 불명이면 제거를 기본값으로 한다(공유 표면의 무단 변경은 다른 화면까지 바꾼다).
- **`Prompt is too long`으로 죽은 에이전트 ≠ 산출물 0 — 사망 전 산출을 파일 실물로 확인하고 리더가 인수한다.** cron-parser Quartz 빌드 실측: domain·ui-engineer가 둘 다 컨텍스트 소진으로 사망했는데, ui-engineer는 **사망 직전 컴포넌트 8개+테스트(ModeToggle·QuartzDescriptionText·QuartzFieldBreakdownTable·quartz-format)를 이미 디스크에 써 놓고** 마무리 배선 중 죽었다. 사망 알림을 "아무것도 안 됐다"로 단정했으면 전부 재작업했을 것. **규율:** ① 에이전트 사망/중단 시 `git status --short`로 무엇이 생겼는지부터 본다(idle=부분산출과 동형) ② 남은 것을 `tsc`+대상 vitest로 실제 상태 판정 — 대개 "built ≠ wired"(cron-parser: 컴포넌트는 다 있는데 CronParser.tsx 미배선으로 mode 프롭 누락 tsc 3에러 + 포매터 `'All'` 하드코딩 en 누수 + 파서 에러 식별자 `bothSpecified` 원시 노출) ③ **좁은 잔여 배선은 fresh 에이전트를 다시 띄우기보다 리더가 직접 마무리가 싸다**(이 세션 컨텍스트가 커서 서브에이전트 재-스폰도 `Prompt is too long`로 즉사 → 리더 직접 인수가 유일한 진행 경로였다). ④ 인수 시 폴리시 게이트(팬텀 토큰·`focus-visible:`·en 누수 `t('allValues')`·에러 로컬라이즈)를 리더가 재적용한다.

## 형제 워크트리 작업 — 모든 서브에이전트 브리프에 절대경로 고정

도구별 전용 워크트리(`Jurepi.kr-<tool>`, `git worktree add -b <cat>/<tool> <sibling-path> main`)에서 빌드할 때, **서브에이전트는 세션 기본 워크트리(다른 도구)로 cwd를 상속하므로** 상대경로로 파일을 쓰면 *엉뚱한 워크트리*에 떨어진다. 모든 브리프 첫머리에 **작업 워크트리 절대경로를 못박고**("Operate ONLY inside `/…/Jurepi.kr-<tool>`; 다른 경로 금지; bash는 `cd <abs> && …`"), 파일 도구도 절대경로를 쓴다. 리더의 bash도 매 호출 `cd <abs>`(cwd가 호출 간 초기화됨). `EnterWorktree` 도구는 `.claude/worktrees/` 하위만 관리하므로 형제 워크트리엔 못 쓴다 — `git worktree add`로 만들고 절대경로로 구동한다. SPEC 편집이 메인 체크아웃 워킹트리에 미커밋 상태로 있으면, 새 워크트리로 복사 후 메인을 `git restore`해 깨끗이 유지한다.

## 간결한 시각/위치 피드백 — 최소 변경 + 스크린샷 루프

UI 위치·정렬 같은 짧은 피드백("좌측 상단으로", "돋보기 왼쪽에서 시작")에는 **가장 작은 literal 변경**을
하고 **스크린샷을 보여주며 반복**한다. 레이아웃을 통째로 재설계하거나 추상적 다지선다 질문을 던지지 마라
— 사용자는 화면으로 반복 조정한다(이번 세션: 검색을 좌측 클러스터로 옮기려 과설계 + 거절당한 질문 1회,
실제 정답은 `right-full` 한 줄짜리 방향 변경이었다). 요구가 모호하면 *질문보다 빠른* 구현→스크린샷이 낫다.
단, **관습을 뒤집는 요청**(로고를 외부로, 기본 동작 제거 등)은 오해 가능성이 있으니 한 번 확인한다.

## 비타협 원칙 (게이트)

- 클린 아키텍처 의존성 규칙: 도메인은 react/next/DOM import 금지.
- TDD: 코드보다 테스트 먼저, 도메인 ≥90% / 전체 ≥80% 커버리지.
- 공정성: 균등 순열 먼저 → 사다리 실현. chi-square 검증 통과.
- CWV: CLS<0.1(광고 슬롯 높이 예약), LCP<2.5s. a11y WCAG 2.1 AA.
- 디자인: DESIGN.md 토큰 충실, anti-template, 액센트≠CTA.
- `.claude/commands/`에 아무것도 만들지 않는다.

## 테스트 시나리오

**정상 흐름:** "사다리 게임을 클린 아키텍처+TDD로 구현해줘"
→ Phase 0 초기 실행 판정 → architect가 계층 분해(엔진=도메인, useLadder=유스케이스, SVG/칩=어댑터, 라우트=프레임워크) → domain-engineer가 공정성 chi-square 테스트 RED→GREEN → ui/platform 병렬 구현 → qa가 엔진path↔SVG·레지스트리↔라우트↔i18n 교차 검증 + E2E + a11y + CWV → 리더 종합. 결과: 공정성 증명된, 계층 분리된, 그린 빌드.

**에러 흐름:** domain-engineer의 공정성 테스트가 중앙 편향으로 실패(naive 랜덤 rung)
→ CRITICAL로 분류 → architect 청사진의 "균등 순열 먼저" 불변식으로 알고리즘 교정 → 재실행하여 GREEN 확인한 뒤에만 ui/platform 진행. 시각 계층은 깨진 엔진 위에 세우지 않는다.

## 공유/횡단 능력이 과업의 초점일 때 (built ≠ wired)

사용자가 특정 능력(예: "마크다운 렌더링을 공통으로")을 **초점**으로 지정하면, 그 능력을 독립 모듈로 만들고 테스트하는 것만으론 부족하다 — 리더는 그것이 **① 실제 소비처(뷰)에 배선됐는가 ② 시드/샘플 콘텐츠로 시연되는가**를 라이브로 확인한다. 실제 new-word: 공통 `<Markdown>`을 만들고 51테스트 그린이었지만 `TermDetail`이 term 본문을 렌더하지 않았고(핵심 요구 미배선), 시드 12용어 본문에 마크다운 문법이 하나도 없어(bold/코드/리스트/링크) 기능이 화면에 안 보였다 — 리더가 상세뷰에 `<Markdown>` 배선 + 본문 콘텐츠 보강 후에야 시연됐다. 게이트: 초점 능력이 렌더된 화면에 실제로 나타나는 스크린샷 1장.

## 병렬 UI/platform 분할 시 계약 선행 (i18n 키 드리프트)

UI와 platform을 병렬로 돌리면 에이전트가 키 이름을 **지어내 드리프트**한다(실제 new-word: UI가 `t('lang.*')`·`t('emptyStates.*')`·`t('detail.definition')`을 썼는데 platform은 `langToggle.*`·`empty.*`로 만들고 `detail.definition`은 없음 → 런타임 MISSING_MESSAGE, 유닛·빌드는 그린). **예방:** ① platform이 `tools.<slug>.*` **키 계약**(최상위 `title`/`description` 포함 — 레지스트리/푸터/홈카드/검색이 `searchable-tools`로 소비)을 UI 착수 전에 확정·공유하거나 ② 리더가 병렬 병합 후 `t()` 키(템플릿 리터럴 포함)를 ko/en 카탈로그와 diff해 재조정한다. 또한 **새 공유 모듈은 배럴(`index.ts`) 필요** — `@/components/markdown`에 index가 없어 통합 시 import가 typecheck 실패했다.

**청사진 i18n 키 계약은 ko/en을 분리 컬럼으로 제시하라 — `"KO | EN"` 한 줄 표기는 ko.json에 그대로 복붙돼 이중언어 오염을 낳는다.** (character-counter 실측: architect 청사진이 편의상 각 값을 `"글자·단어 카운터 | Character & Word Counter"`처럼 `KO | EN` 파이프로 문서화했더니, platform 에이전트가 이를 **ko.json에 통째로 복사**해 49개 문자열이 이중언어가 됨 → /ko 홈카드·푸터·인트로·메트릭 라벨에 영어가 함께 노출. en.json은 영어만 정상. tsc·유닛·빌드 전부 그린, 리더 라이브 스크린샷/카탈로그 grep으로만 적발.) **예방:** ① architect는 키 계약을 `{ key, ko, en }` **분리 컬럼/필드**로 제시(파이프 조인 금지) ② 리더는 병렬 병합 후 각 로케일 카탈로그의 도구 네임스페이스에서 **반대 언어 누수**를 grep(`ko.json`은 `/[A-Za-z]{4,}/`가 라벨 값에, `en.json`은 `/[가-힣]/`가 값에 있으면 오염 — 단 SPEC이 의도한 이중언어 placeholder는 예외) — 이것은 "en 로케일도 렌더·검사"(jurepi-tdd)의 카탈로그 정적판.

## 콘텐츠 컬렉션의 사실성 — 작성자와 분리된 fact-check 패스 (비타협)

실존 인물·실제 데이터 콘텐츠(dev-people 전기 등)는 **작성 에이전트와 분리된 fact-check 에이전트**가 전수 검증한 뒤에만 통과시킨다. dev-people 실측 결함: ① **컨텍스트 누출 조작** — 운영자 개인 모토("배워서 남주자")가 인물의 신념으로 둔갑 ② **생존 인물 허위 직접 인용** — 하지 않은 발언을 따옴표로 창작 ③ 필러성 업적("활동 지속") ④ 작성자가 "전 항목 웹 검증 완료"라 보고했으나 YAML 파스 에러 12곳·연도 오류 잔존(주장≠증명의 콘텐츠판). 게이트: 직접 인용은 실존 인용만, 미확증 최신 주장은 리더가 웹 재검증(사실이면 유지 — 카파시 Anthropic 합류처럼 모델 지식보다 최신일 수 있음), 생존 한국인은 공개 확인 가능 사실만.

## 실행 후 (하네스 진화)

기능 완료 후 사용자에게 개선점을 묻는다. 피드백은 유형별로 반영하고 `CLAUDE.md` 변경 이력에 기록한다(결과 품질→스킬, 역할→에이전트 정의, 순서→이 오케스트레이터, 트리거 누락→description). 같은 피드백이 2회 반복되면 진화를 먼저 제안한다.
