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
