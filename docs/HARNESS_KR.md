# Jurepi 개발 하네스

> 국문 · **[English](./HARNESS.md)**

Jurepi는 **에이전트 팀 + 스킬**로 구성된 개발 하네스로 만들어집니다. **클린 아키텍처(계층 분리)** 와 **TDD(테스트 우선)** 를 척추로, 오케스트레이터가 계층별 전문 에이전트를 조율해 기능을 완성합니다. 하네스 정의는 저장소의 `.claude/`(에이전트·스킬)와 `CLAUDE.md`(트리거·변경 이력)에 있습니다.

## 단일 소스 문서

하네스는 아래 문서를 요구사항의 **진실**로 삼고, 재해석하지 않고 계층에 매핑합니다.

| 문서 | 역할 |
|------|------|
| `docs/SPEC.md`, `docs/services/**/SPEC.md` | 플랫폼·도구 요구사항 (영문=AI 소비 정본, `SPEC_KR.md`=국문 번역) |
| `docs/DESIGN.md` | 시각 단일 소스 (디자인 토큰·컴포넌트) — `src/styles/tokens.css`가 미러 |
| `PRODUCT.md` | 전략 단일 소스 (사용자·목적·브랜드·원칙) |

## 팀 구성

**빌드 팀(상시 5인)** + **전문가(2인, 시점 호출)**. 모든 에이전트는 `opus` 모델로 실행합니다.

| 에이전트 | 계층 | 책임 | 주 스킬 |
|----------|------|------|---------|
| `architect` | 설계 | 계층 분해·계약·작업 분배·빌드 순서 | clean-architecture |
| `domain-engineer` | 도메인·유스케이스 | 순수 로직 TDD (공정성 엔진·검색·동의·reducer) | jurepi-tdd, clean-architecture |
| `ui-engineer` | 어댑터(UI) | React 컴포넌트·훅·디자인 시스템·접근성 | design-system-fidelity, jurepi-tdd |
| `platform-engineer` | 프레임워크 | App Router·SSG·i18n·SEO 인프라·광고·빌드 | nextjs-ssg-platform |
| `qa-integration` | 횡단 | 경계 교차 검증·E2E·a11y·CWV | integration-qa, jurepi-tdd |
| `seo-geo-engineer` | 발견성 경계 *(전문가)* | 도구별 SEO+GEO (고유 메타·JSON-LD·답변 우선 콘텐츠·llms.txt·AI 크롤러·프리렌더 노출) | seo-geo-optimization |
| `deploy-engineer` | 배포 경계 *(전문가)* | Cloudflare 정적 배포·정적 익스포트 마이그레이션·`_headers`/`_redirects`·트러블슈팅 | cloudflare-pages-deploy |

> seo-geo-engineer는 **도구 출시·발견성 개선 시점**, deploy-engineer는 **배포·배포 실패 시점**에 호출하는 전문가입니다(상시 멤버 아님).

## 스킬

| 스킬 | 용도 |
|------|------|
| `jurepi-build` | **오케스트레이터** — 팀 조율·워크플로·검증 원칙 (모든 기능 작업의 진입점) |
| `clean-architecture` | 계층 배치·의존성 규칙·포트/어댑터 경계 |
| `jurepi-tdd` | RED→GREEN→REFACTOR, 시드 RNG 결정적 도메인 테스트, 공정성 chi-square |
| `nextjs-ssg-platform` | App Router·SSG·next-intl·SEO 인프라·Server/Client 경계 |
| `design-system-fidelity` | DESIGN.md 토큰 충실·anti-template·접근성·상태 디자인 |
| `integration-qa` | 경계 교차 검증·커버리지·E2E·axe·CWV·시각/SSR 하드 게이트 |
| `seo-geo-optimization` | 도구별 검색엔진(SEO)+생성엔진(GEO) 발견성 플레이북 |
| `cloudflare-pages-deploy` | 정적 익스포트 → Cloudflare 배포 절차·트러블슈팅 |

## 워크플로우 (기능 단위, inside-out)

도메인이 그린이 되기 전에는 바깥 계층을 신뢰하지 않습니다.

```
1. 설계       architect       → 계층 분해 + 계약 + 불변식 + 작업 분배
2. 도메인     domain-engineer → 테스트 RED→GREEN→REFACTOR (공정성/검색/동의/reducer)
3. 병렬 구현  ui ∥ platform   → 계약 위에서 어댑터/프레임워크 구현 (각자 TDD)
4. 발견성     seo-geo-engineer→ 도구별 SEO+GEO 명세·검증 (메타·JSON-LD·답변 우선·llms.txt)
5. 점진 QA    qa-integration  → 각 모듈 완성 직후 경계 교차 검증
6. 통합       qa-integration  → E2E(SPEC 시나리오) + a11y + CWV + 프리렌더 SEO/JSON-LD
7. 종합       리더            → 결과 수집·요약, 미해결/미검증 명시
```

## 비타협 게이트

- **클린 아키텍처 의존성 규칙** — 도메인은 `react`/`next`/DOM을 import하지 않는 순수 함수.
- **TDD 커버리지** — 도메인 ≥90% / 전체 ≥80%, 코드보다 테스트 먼저.
- **공정성** — 균등 순열 먼저 → 사다리 실현, chi-square 적합도 검정 통과 (실패 = CRITICAL).
- **Core Web Vitals** — CLS < 0.1(광고 슬롯 높이 예약), LCP < 2.5s.
- **접근성** — WCAG 2.1 AA, 키보드 완전 조작, `prefers-reduced-motion` 존중.
- **디자인** — DESIGN.md 토큰 충실, 액센트 ≠ CTA(액센트=정체성, 브랜드=액션).
- **발견성** — 인덱싱·인용 대상은 `mounted` 게이트 밖 **프리렌더 HTML**에 존재.

## 검증 원칙 — 주장 ≠ 증명

에이전트의 "완료/PASS" 주장은 자주 사실과 다릅니다. **리더는 게이트 통과를 인정하기 전에 핵심 검증을 직접 재실행**합니다: `tsc`·전체 `pnpm test`·빌드·E2E를 다시 돌려 수치를 확인하고, UI는 렌더된 스크린샷과 프리렌더 HTML(`curl`)을 직접 봅니다. "빌드·테스트 그린 ≠ 화면 정상."

## 배포

**배포 = `git push` (프로덕션 분기 `main`).** Cloudflare Workers Builds(Git 연동)가 push를 감지해 CF 파이프라인에서 `pnpm build` + `wrangler deploy`를 **자동 실행**합니다. 로컬에서 `wrangler deploy`를 돌리는 것이 아니며(그건 CF 빌드 내부 단계), 기능 브랜치/worktree의 변경은 `main`에 병합해야 배포에 포함됩니다. 상세는 `cloudflare-pages-deploy` 스킬.

## 하네스 진화

하네스는 스스로 진화합니다. 기능 완료 후 드러난 결함·교훈을 유형별로 반영합니다 — 결과 품질→스킬, 역할→에이전트 정의, 순서→오케스트레이터, 트리거 누락→description. 모든 진화는 `CLAUDE.md`의 **변경 이력** 표에 기록됩니다.

## 파일 위치

```
CLAUDE.md                 # 하네스 트리거·구성·변경 이력 (진화 로그)
.claude/agents/*.md       # 에이전트 정의 7종
.claude/skills/*/SKILL.md # 스킬 8종 (jurepi-build = 오케스트레이터)
docs/SPEC.md, DESIGN.md   # 요구사항·시각 단일 소스
PRODUCT.md                # 전략 단일 소스
```
