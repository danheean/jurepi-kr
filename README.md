# Jurepi · 무료 온라인 도구 허브

<sub>한국어 · **[English](README.en.md)**</sub>

> **필요한 도구, 전부 무료로.** — [apps.jurepi.kr](https://apps.jurepi.kr)

Jurepi는 유용한 웹 도구를 카드 그리드 대시보드에서 골라 쓰는 무료 온라인 도구 모음입니다.
**Next.js 15 App Router 기반의 정적 사이트(SSG)** 로, 백엔드·데이터베이스 없이 동작하며
모든 도구는 개별 인덱싱 가능한 URL을 가집니다.

현재 라이브 도구는 두 가지입니다.

- **사다리타기 (Ghost Leg)** — 통계적으로 *공정성이 증명된* 추첨 (시작 위치와 무관하게 확률 정확히 `1/N`)
- **1일 1질문 (Q&A a Day)** — 매일 하나의 질문에 답하는, 브라우저에만 저장되는 로컬 저널

---

## 🧭 이 서비스는

> **만든 이유** — AI 기술의 혜택 격차가 점점 더 벌어지는 시대에, 그 기술로 방문자 누구에게나
> 실질적으로 도움이 되는 도구를 **무료로** 만들어 제공하고 싶었습니다.
> 필요한 도구·기능을 요청해 주시면 개발해서 하나씩 더해 갑니다.

Jurepi는 **로그인·설치 없이 바로 쓰는 무료 온라인 도구 모음**입니다. 대부분의 방문자는
검색이나 모바일로 들어와 "특정 작업 하나"를 빠르게 끝내고 떠납니다 — 예: 사다리타기로
공정하게 순서·당첨 정하기, 1일 1질문으로 짧은 자기 기록 남기기.

홈은 도구를 발견·탐색하는 **카드 그리드 대시보드**이고, 각 도구는 개별 인덱싱 가능한 URL을 가진
**정적(SSG) 페이지 위에 마운트되는 인터랙티브 앱**입니다. 백엔드·데이터베이스·계정이 없으며,
사용자 데이터(일기·테마 등)는 **브라우저(localStorage)에만** 남습니다.

- **마찰 제로** — 진입 즉시 사용, 결과를 URL로 공유
- **발견성** — 도구마다 독립 URL·메타데이터·JSON-LD (검색 유입 전제)
- **사용성 최우선** — 키보드 완전 조작·스크린리더·`prefers-reduced-motion` 존중 (WCAG 2.1 AA 지향)
- **확장 구조** — 새 도구 = 레지스트리 1항목 + 모듈 (메인 화면 재설계 불필요)

한국어(기본) · 영어를 지원하며, 각 로케일은 `/ko`, `/en` 프리픽스로 라우팅됩니다.

---

## ✨ 주요 기능

- **도구 대시보드** — 레지스트리 기반 카드 그리드, 카테고리 필터·전역 검색
- **사다리타기 게임** — 균등 순열을 먼저 뽑고 그 결과를 실현하는 사다리 생성으로,
  시작 위치와 무관하게 각 참가자의 당첨 확률이 정확히 `1/N` (중앙 편향 "추악한 진실" 배제)
- **1일 1질문** — 로컬 날짜 엔진 기반 365일 질문 은행, 브라우저에만 저장되는 불변 저널·통계·달력
- **다국어** — 한국어(기본) / 영어, 로케일 프리픽스 라우팅 (`/ko`, `/en`)
- **접근성** — 키보드 완전 조작, `aria-live` 결과 발표, `prefers-reduced-motion` 폴백, WCAG 2.1 AA 지향
- **성능** — 정적 셸 + 광고 슬롯 높이 예약으로 CWV 목표(LCP < 2.5s · CLS < 0.1) 유지
- **확장성** — 새 도구 = 레지스트리 항목 + 메시지 + 모듈 (메인 화면 재설계 불필요)

## 🧱 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프레임워크 | Next.js 15 (App Router, React 19), TypeScript 5 (strict) |
| 렌더링 | SSG (`generateStaticParams`) · 정적 익스포트 (`output: 'export'`), 기본 Server Components |
| 스타일 | Tailwind CSS v4 + CSS 커스텀 프로퍼티 토큰 (`src/styles/tokens.css` ↔ `docs/DESIGN.md`) |
| 국제화 | next-intl v3 (`ko`/`en`, `localePrefix: "always"`) |
| 아이콘 | lucide-react |
| 테스트 | Vitest + Testing Library (단위/컴포넌트), Playwright (E2E) |
| 수익화 | Google AdSense · GA4 + Google Consent Mode *(선택)* |

데이터 계층은 컴파일타임 TypeScript 모듈(`src/tools/registry.ts`)이며, **서버·DB·first-party API가 없습니다.**
사용자 설정(테마/동의)은 `localStorage`에만 저장됩니다.

## 🏛 아키텍처 — Clean Architecture

의존성은 항상 **안쪽으로만** 향합니다. 비즈니스 규칙은 프레임워크로부터 보호됩니다.

```
Frameworks & Drivers   app/, next-intl 런타임, Tailwind, AdSense, localStorage
  └ Interface Adapters  React 컴포넌트·훅, lib/seo, storage 어댑터
      └ Use Cases       순수 reducer(상태머신), 셀렉터, 검색/동의 흐름
          └ Domain      사다리 공정성 엔진, 레지스트리 타입·불변식 (react/next 무의존)
```

- **도메인**(`src/lib/ladder.ts`, `src/lib/ladder-reducer.ts`)은 `react`/`next`/DOM을 import하지 않는 순수 함수이며,
  난수(RNG)는 주입받아 테스트에서 결정적으로 재현됩니다.
- 자세한 계층 매핑은 `.claude/skills/clean-architecture/` 참고.

## 🚀 시작하기

### 요구 사항
- Node.js **22** (`.nvmrc` 고정)
- pnpm 9+ *(또는 npm/yarn)*

### 설치 & 실행

```bash
pnpm install
cp .env.example .env.local   # 값 채우기 (모두 선택 / 클라이언트 안전)
pnpm dev                     # 개발 서버 → http://localhost:3000/ko
```

> 루트 `/` → `/ko` 리다이렉트는 프로덕션 전용(`public/_redirects`)입니다. 개발 중엔 `/ko`로 접속하세요.

### 환경 변수

모든 변수는 `NEXT_PUBLIC_*`(클라이언트 안전)이며 **비밀 값이 아닙니다.**

| 변수 | 필수 | 설명 |
|------|:---:|------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | canonical/sitemap/OG의 절대 기준 URL |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⬜ | AdSense 퍼블리셔 ID (설정 시 로더 로드; GDPR은 Google Consent Mode/CMP가 처리) |
| `NEXT_PUBLIC_GA_ID` | ⬜ | GA4 측정 ID (설정 시 로드; `analytics_storage`는 Consent Mode로 관리) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | ⬜ | `/` 진입 시 기본 로케일 (기본 `ko`) |

## 📜 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 정적 빌드 → `out/` (`output: 'export'`) |
| `npx serve out` | 정적 빌드 로컬 미리보기 (`next start`는 `output: 'export'`와 비호환) |
| `pnpm lint` | ESLint (next/core-web-vitals) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | 단위·컴포넌트 테스트 (Vitest, 1회 실행) |
| `pnpm test:watch` | Vitest 워치 모드 |
| `pnpm test:coverage` | 커버리지 측정 |
| `pnpm exec playwright test` | E2E (자동으로 빌드+서버 기동) |

## ✅ 테스트 & 품질

테스트 우선(TDD)으로 개발합니다. 도메인 계층은 `react`/`next` 무의존 순수 함수이며,
난수(RNG)를 주입받아 테스트에서 결정적으로 재현됩니다.

- **단위/컴포넌트** — 751 테스트 통과 (Vitest), 도메인 100% / 애플리케이션 계층 ≥80% 목표
- **공정성** — `N∈{2..10}`에서 chi-square 적합도 검정, 대규모 시뮬레이션으로 전 컬럼 균등 도달 검증
- **디자인 토큰 게이트** — 모든 색 유틸 클래스가 실재 토큰으로 해석되는지 자동 검사 (미존재 토큰=투명 렌더 방지)
- **E2E** — Playwright (사다리 풀게임·표시모드·엣지카운트, Q&A 지속성, i18n·키보드·reduced-motion)
- **성능** — CWV 목표(LCP < 2.5s · CLS < 0.1); 광고 슬롯 높이 예약으로 레이아웃 시프트 차단

> 크로스브라우저(Firefox/WebKit)와 axe 상세 a11y 스캔은 CI 단계에서 확장 예정.

## 📂 프로젝트 구조

```
src/
├── app/                 # App Router (layout, [locale], tools/[slug], sitemap/robots/manifest)
├── components/
│   ├── ui/              # 프리미티브 (Button, TextInput, Toggle, Stepper, Modal, Toast, Badge)
│   ├── layout/          # Header·Footer·테마 토글·로케일 스위처·전역 검색
│   ├── home/            # 대시보드 (Hero·검색·카테고리 필터·툴 카드 그리드)
│   ├── consent/         # 광고/분석 동의 (Google Consent Mode)
│   ├── legal/           # 개인정보·약관·문의 프로즈 페이지
│   ├── analytics/       # GA4·AdSense 로더 (Google Consent Mode)
│   └── tools/
│       ├── ladder/      # 사다리 게임 (Setup·Board(SVG)·PlayerHeader·PrizeCards ...) + useLadder
│       └── qna-a-day/   # 1일 1질문 (Today·Calendar·Journal·Settings 탭) + useDailyJournal
├── lib/                 # 도메인: ladder 엔진·reducer · qna-a-day 날짜/저널 엔진 · consent · seo · 검색
├── hooks/               # 전역 훅 (useReducedMotion · useToolSearch) — 도구 훅은 각 모듈에 co-located
├── tools/               # 도구 레지스트리 + 타입 (단일 소스)
├── i18n/                # next-intl 라우팅 + ko/en 메시지
└── styles/              # tokens.css (DESIGN.md 미러)

docs/                    # SPEC · DESIGN 시스템 (요구사항 단일 소스)
```

## ➕ 새 도구 추가하기

1. `src/tools/registry.ts` 에 `ToolMeta` 항목 추가
2. `src/i18n/messages/{ko,en}.json` 에 `tools.<id>.*` 카피 추가
3. `live`라면 `src/components/tools/<id>/` 모듈 + `tools/[slug]/page.tsx` 분기 추가

> `coming_soon` 도구는 레지스트리 항목만으로 "준비중" 카드가 노출됩니다.

### 콘텐츠 도구에 항목 추가하기 (코드 변경 0)

마크다운 컬렉션 기반 도구(신조어 사전·별별 랭킹·즐겨찾기·**개발 인물 사전**)는
마크다운 쌍(`<slug>.md` + `<slug>_en.md`)만 넣고 빌드하면 허브 카드·상세(스포크) 페이지·sitemap이
자동으로 따라옵니다. 각 도구는 Claude Code **스킬**로 절차가 캡슐화되어 있어 자연어로 요청하면 됩니다.

```text
# Claude Code에서 — dev-people-author 스킬이 자동 트리거되어
# 사실 검증 → 사진 라이선스(Commons PD/CC) → 마크다운 쌍 → 검증 → 배포까지 수행
앨런 튜링을 인물 사전에 추가해줘
```

## 📚 도구별 문서

각 도구의 요구사항·아키텍처·콘텐츠 저작 방법은 `docs/services/<category>/<tool>/README.md`에 있습니다.

| 도구 | 문서 |
|------|------|
| 개발 인물 사전 (Developer People Dictionary) | [`docs/services/dev/dev-people/README.md`](docs/services/dev/dev-people/README.md) — 스킬 사용 예시·콘텐츠 파이프라인·작성 가이드 |
| 맛집 리스트 (Restaurant List) | [`docs/services/fun/restaurant-map/README.md`](docs/services/fun/restaurant-map/README.md) |

## 🤖 개발 하네스

본 저장소는 `.claude/` 에 **클린 아키텍처 + TDD**를 강제하는 에이전트 팀(7종)과 스킬(8종)을 포함합니다.
빌드 팀(`architect` · `domain-engineer` · `ui-engineer` · `platform-engineer` · `qa-integration`)과
전문가(`seo-geo-engineer` · `deploy-engineer`)를 오케스트레이터 스킬 `jurepi-build` 가 조율합니다.

📖 자세한 구성·워크플로·비타협 게이트는 **[개발 하네스 문서 → `docs/HARNESS.md`](docs/HARNESS.md)** 를 참고하세요.

## 🌐 배포

**배포 = `git push` (프로덕션 분기 `main`).** Cloudflare Workers Builds(Git 연동)가 push를 감지해
CF 파이프라인에서 `pnpm build` + `wrangler deploy`를 **자동 실행**합니다 — 로컬에서 `wrangler deploy`를
직접 돌리는 게 아닙니다. 기능 브랜치/worktree의 변경은 `main`에 병합해야 배포에 포함됩니다.

정적 익스포트(`output: 'export'`)라 `next.config`의 `headers()`·`src/middleware`가 실행되지 않으므로,
동등 기능을 아래 파일로 이전합니다 (빌드 시 `out/`으로 복사).

- `public/_headers` — 보안 헤더(HSTS·X-Content-Type-Options·Referrer-Policy 등)
- `public/_redirects` — 루트 `/` → 기본 로케일 `/ko`

> **배포본 검증:** push 후 CF 빌드 완료(수십 초~수 분)를 기다린 뒤 `curl -I https://apps.jurepi.kr`로
> 보안 헤더·`/`→`/ko`·로케일 200·미지 경로 404를 확인하세요. 로컬 사전검증은 `serve out` / `wrangler dev`.
> `NEXT_PUBLIC_*`는 공개·비밀 아님이며 `.env.production`에 커밋돼 빌드에 인라인됩니다. 상세: [개발 하네스 문서](docs/HARNESS.md).

## 📄 라이선스

[MIT](LICENSE) © 2026 Jurepi
