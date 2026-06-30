# Jurepi.kr

무료 온라인 도구 허브 (Next.js 15 App Router · SSG · TS strict · Tailwind v4 · next-intl ko/en · 백엔드/DB 없음).
요구사항 단일 소스: `docs/PRD.md`, `docs/services/**/PRD.md`, `docs/DESIGN.md`.

## 하네스: Jurepi 풀스택 웹 빌드 (클린 아키텍처 + TDD)

**목표:** 클린 아키텍처(도메인→유스케이스→어댑터→프레임워크 계층 분리)와 TDD(테스트 우선)로 Jurepi 플랫폼·대시보드·도구를 구현한다.

**트리거:** Jurepi 플랫폼/대시보드/도구(사다리타기 등) 구현·기능 추가·리팩터링·버그 수정·재실행 요청 시 `jurepi-build` 스킬을 사용하라. 단순 질문이나 단일 파일 사소 편집은 직접 응답 가능.

**구성:** 에이전트 팀(`.claude/agents/`: architect·domain-engineer·ui-engineer·platform-engineer·qa-integration) + 스킬(`.claude/skills/`: jurepi-build 오케스트레이터, clean-architecture, jurepi-tdd, nextjs-ssg-platform, design-system-fidelity, integration-qa). 모든 에이전트는 opus. 상세는 오케스트레이터 스킬과 각 디렉토리에서 관리한다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-29 | 초기 구성 (5인 팀 + 6 스킬 + 오케스트레이터) | 전체 | 풀스택 웹 하네스 신규 구축, 클린 아키텍처+TDD 요구 반영 |
| 2026-06-29 | 사다리타기(ghost-leg) 구현 — 엔진(공정성 chi-square)·reducer·게임 UI·SSG 라우트, 243 테스트/96% 커버리지/빌드 그린 | src/** (제품) | 첫 도구 빌드. 팀 파이프라인 정상 동작 검증 |
| 2026-06-29 | integration-qa 스킬에 "커버리지·테스트 하드 게이트" 추가 | skills/integration-qa | QA가 도메인 커버리지를 전체로 오인해 false PASS 2회 → 전체 커버리지·UI 테스트 존재를 명시적 차단 체크로 |
| 2026-06-29 | 스캐폴드 기본값 강화 (test=`vitest run`, coverage 스코프 `src/**`) | skills/nextjs-ssg-platform | 워치 모드 스크립트 hang + 커버리지 스코프 오염 결함 재발 방지 |
| 2026-06-29 | 오케스트레이터에 "주장≠증명" 검증 원칙 + 작업 분할 지침 추가 | skills/jurepi-build | 에이전트 거짓 PASS 4회(가짜 chi-square·커버리지 false-PASS·"10/11"실제4실패·행에도 "배포완료") + ui 컨텍스트 소진 2회 |
| 2026-06-29 | Vitest/Playwright 스펙 분리, ui E2E `data-testid` 앵커, 죽은검정·로케일매처·clipboard 교훈 | nextjs-ssg-platform · ui-engineer · jurepi-tdd | E2E 그린화 세션에서 드러난 경계·환경 결함 재발 방지 |
| 2026-06-29 | 메인 대시보드 + 공유 셸 구현 — Hero(마스코트 동반)·검색·카테고리 필터·툴카드 그리드(라이브1+준비중6)·빈상태·404, Header/Footer/테마토글/로케일 스위처, 도메인(검색/정렬/테마) TDD. 357 유닛 / 20 E2E / typecheck / 빌드 10페이지 SSG 그린 | src/** (제품) | 플랫폼 메인화면 빌드 |
| 2026-06-29 | "녹색 빌드가 숨긴" 시각/SSR 결함 4건을 리더 직접 검증으로 적발: ① Tailwind v4가 v3 `tailwind.config.ts` 미로드(@config 브리지 누락)→디자인 토큰 유틸 전부 미생성 ② 그리드 CSR-only(useSearchParams+Suspense)→SSG/SEO 회귀 ③ 라이브 카드 링크 로케일 프리픽스 누락→404 ④ spacing 토큰명(md/sm) 충돌로 `max-w-md`=16px | src/app/globals.css · ToolExplorer · ToolCard · Hero/Modal/EmptyState | 빌드·테스트·axe 모두 그린이어도 렌더 화면/SSR HTML을 직접 봐야 함(시각 검증 게이트) |
| 2026-06-30 | 위 4건의 **예방** 패턴을 생성 시점 스킬로 라우팅: @config·CSR그리드·next-intl Link → nextjs-ssg-platform, 토큰명 충돌·@config → design-system-fidelity, test-utils 동기화·useRef 초기값·vitest 전역 import·jsdom URL 격리 → jurepi-tdd | skills/{nextjs-ssg-platform,design-system-fidelity,jurepi-tdd} | 탐지(integration-qa)만으론 재발 방지 부족 — 빌드/생성 단계에서 막도록 인코딩 |
| 2026-06-30 | 헤더/레이아웃 개선 5건 — 전역 검색 콤보박스(HeaderSearch: 모든 페이지 동작·키보드 탐색·ARIA combobox·검색어 하이라이트, matchTool/filterTools/sortTools·Link 재사용), 로케일 활성 표시(useLocale+aria-current), 테마 3상태 아이콘(라이트=해/다크=달/시스템=모니터)+동적 aria-label, 카테고리 좌측정렬(mx-auto max-w-container). 396 유닛 / 5 E2E / typecheck / 빌드 10p SSG 그린 + 시각·SSR 검증 통과 | src/** (제품) | 실사용 헤더 결함 수정. 도구 상세 페이지에서 돋보기 무반응(#tool-search가 홈에만 존재) 등 |
| 2026-06-30 | "주장≠증명" 재발: ui-engineer가 "build/tsc pass·no visual regression" 주장했으나 ① 테스트 파일 tsc 2-error(vitest는 통과) ② 오픈 검색 입력 26px 붕괴(유닛은 role/presence만 검사, width 미검증) → 리더가 직접 `tsc`·E2E boundingBox·스크린샷 Read로 적발·수정 | (검증 프로세스) | 신규 오버레이/입력은 width·boundingBox 시각 게이트 필수, 에이전트 "빌드 통과" 주장은 리더 tsc 재실행 전엔 불신 — integration-qa 강화 후보 |
