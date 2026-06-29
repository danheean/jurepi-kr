# Jurepi · 무료 온라인 도구 허브

> **필요한 도구, 전부 무료로.** — [jurepi.kr](https://jurepi.kr)

Jurepi는 유용한 웹 도구를 카드 그리드 대시보드에서 골라 쓰는 무료 온라인 도구 모음입니다.
**Next.js 15 App Router 기반의 정적 사이트(SSG)** 로, 백엔드·데이터베이스 없이 동작하며
모든 도구는 개별 인덱싱 가능한 URL을 가집니다.

첫 번째 도구는 **사다리타기(Ghost Leg)** — 통계적으로 *공정성이 증명된* 사다리 추첨입니다.

---

## ✨ 주요 기능

- **도구 대시보드** — 레지스트리 기반 카드 그리드, 카테고리 필터·검색
- **사다리타기 게임** — 균등 순열을 먼저 뽑고 그 결과를 실현하는 사다리 생성으로,
  시작 위치와 무관하게 각 참가자의 당첨 확률이 정확히 `1/N` (중앙 편향 "추악한 진실" 배제)
- **다국어** — 한국어(기본) / 영어, 로케일 프리픽스 라우팅 (`/ko`, `/en`)
- **접근성** — 키보드 완전 조작, `aria-live` 결과 발표, `prefers-reduced-motion` 폴백, WCAG 2.1 AA 지향
- **성능** — Lighthouse Performance 100, CLS 0 (광고 슬롯 높이 예약), LCP ~1.3s
- **확장성** — 새 도구 = 레지스트리 항목 + 메시지 + 모듈 (메인 화면 재설계 불필요)

## 🧱 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프레임워크 | Next.js 15 (App Router, React 19), TypeScript 5 (strict) |
| 렌더링 | SSG (`generateStaticParams`), 기본 Server Components |
| 스타일 | Tailwind CSS v4 + CSS 커스텀 프로퍼티 토큰 (`src/styles/tokens.css` ↔ `docs/DESIGN.md`) |
| 국제화 | next-intl v3 (`ko`/`en`, `localePrefix: "always"`) |
| 아이콘 | lucide-react |
| 테스트 | Vitest + Testing Library (단위/컴포넌트), Playwright (E2E) |
| 수익화 | Google AdSense + 동의(consent) 게이팅 *(선택)*, GA4 *(선택)* |

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
- Node.js **20+** (권장 22)
- pnpm 9+ *(또는 npm/yarn)*

### 설치 & 실행

```bash
pnpm install
cp .env.example .env.local   # 값 채우기 (모두 선택 / 클라이언트 안전)
pnpm dev                     # http://localhost:3000 → /ko 로 리다이렉트
```

### 환경 변수

모든 변수는 `NEXT_PUBLIC_*`(클라이언트 안전)이며 **비밀 값이 아닙니다.**

| 변수 | 필수 | 설명 |
|------|:---:|------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | canonical/sitemap/OG의 절대 기준 URL |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⬜ | AdSense 퍼블리셔 ID (동의 후에만 광고 로드) |
| `NEXT_PUBLIC_GA_ID` | ⬜ | GA4 측정 ID (동의 후에만 로드) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | ⬜ | `/` 진입 시 기본 로케일 (기본 `ko`) |

## 📜 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 정적 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | ESLint (next/core-web-vitals) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | 단위·컴포넌트 테스트 (Vitest, 1회 실행) |
| `pnpm test:watch` | Vitest 워치 모드 |
| `pnpm test:coverage` | 커버리지 측정 |
| `pnpm exec playwright test` | E2E (자동으로 빌드+서버 기동) |

## ✅ 테스트 & 품질

테스트 우선(TDD)으로 개발합니다.

- **단위/컴포넌트** — 243 테스트 통과, 애플리케이션 계층 커버리지 ~96% (도메인 ~99%)
- **공정성** — `N∈{2..10}`에서 chi-square 적합도 검정 `p > 0.01`, 100,000회 시뮬레이션, 전 컬럼 도달
- **E2E** — Playwright 15 시나리오(풀게임·표시모드·엣지카운트·i18n·키보드·reduced-motion) 통과
- **성능** — Lighthouse Performance 100 / CLS 0 / LCP ~1.3–1.4s (`/ko`, `/ko/tools/ladder`)

> 크로스브라우저(Firefox/WebKit)와 axe 상세 a11y 스캔은 CI 단계에서 추가 예정.

## 📂 프로젝트 구조

```
src/
├── app/                 # App Router (layout, [locale], tools/[slug], sitemap/robots/manifest)
├── components/
│   ├── ui/              # 프리미티브 (Button, TextInput, Toggle, Stepper, Modal, Toast, Badge)
│   └── tools/ladder/    # 사다리 게임 (Setup, Board(SVG), PlayerHeader, PrizeCards, ResultPanel ...)
├── lib/                 # 도메인: ladder 엔진 · reducer · seo 빌더
├── tools/               # 도구 레지스트리 + 타입 (단일 소스)
├── i18n/                # next-intl 라우팅 + ko/en 메시지
└── styles/              # tokens.css (DESIGN.md 미러)

docs/                    # PRD · DESIGN 시스템 (요구사항 단일 소스)
```

## ➕ 새 도구 추가하기

1. `src/tools/registry.ts` 에 `ToolMeta` 항목 추가
2. `src/i18n/messages/{ko,en}.json` 에 `tools.<id>.*` 카피 추가
3. `live`라면 `src/components/tools/<id>/` 모듈 + `tools/[slug]/page.tsx` 분기 추가

> `coming_soon` 도구는 레지스트리 항목만으로 "준비중" 카드가 노출됩니다.

## 🤖 개발 하네스

본 저장소는 `.claude/` 에 클린 아키텍처 + TDD를 강제하는 에이전트 팀과 스킬을 포함합니다
(`architect` · `domain-engineer` · `ui-engineer` · `platform-engineer` · `qa-integration`).
도구 빌드·기능 추가는 오케스트레이터 스킬 `jurepi-build` 로 조율됩니다.

## 🌐 배포

정적/엣지 호스트(Vercel, Netlify, Cloudflare 등) 어디든 배포 가능합니다.
`NEXT_PUBLIC_*` 환경 변수를 설정하고, 호스트 또는 `next.config.ts`에서 CSP·보안 헤더를 구성하세요.

## 📄 라이선스

[MIT](LICENSE) © 2026 Jurepi
