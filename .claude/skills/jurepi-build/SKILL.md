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

## 실행 후 (하네스 진화)

기능 완료 후 사용자에게 개선점을 묻는다. 피드백은 유형별로 반영하고 `CLAUDE.md` 변경 이력에 기록한다(결과 품질→스킬, 역할→에이전트 정의, 순서→이 오케스트레이터, 트리거 누락→description). 같은 피드백이 2회 반복되면 진화를 먼저 제안한다.
