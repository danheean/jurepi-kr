---
name: jurepi-tdd
description: Jurepi에서 테스트 우선(TDD) 개발을 클린 아키텍처와 결합해 inside-out으로 진행하는 방법. RED→GREEN→REFACTOR 루프, 시드 RNG로 결정적 도메인 테스트, 사다리 공정성 chi-square 검정 우선, Vitest 단위/컴포넌트 + Playwright E2E + axe 접근성, 커버리지 ≥80%(도메인 ≥90%). Jurepi 기능·버그·리팩터링에서 코드보다 테스트를 먼저 쓸 때 반드시 사용.
---

# TDD Workflow — 클린 아키텍처용 inside-out TDD

이 스킬은 Jurepi의 작업 규율이다. **테스트를 먼저 쓴다.** 이유는 두 가지: (1) 사다리 공정성처럼 *증명이 필요한* 규칙은 테스트가 명세다, (2) 클린 아키텍처의 안쪽 계층은 순수·결정적이라 테스트가 빠르고 신뢰할 수 있어 TDD의 마찰이 거의 없다.

## 황금 루프 (rigid — 약화 금지)

```
1. RED      실패하는 테스트를 쓴다. 실행해서 실패를 눈으로 확인한다.
2. GREEN    테스트를 통과시키는 최소 구현을 쓴다. 실행해서 통과를 확인한다.
3. REFACTOR 중복 제거·명확화. 테스트는 계속 GREEN.
4. COVERAGE 커버리지 확인(전체 ≥80%, 도메인 ≥90%).
```

RED을 건너뛰지 마라 — 실패를 본 적 없는 테스트는 통과를 증명하지 못한다(거짓 GREEN). 구현이 안 통과하면 **구현을 고친다**. 테스트를 약화시키는 것은 테스트가 명백히 틀렸다는 근거가 있을 때만.

## inside-out 순서 (계층을 따라 안→밖)

클린 아키텍처 계층 순서대로 테스트를 쌓는다. 안쪽이 그린이 되기 전에 바깥을 신뢰하지 않는다.

1. **도메인 (가장 먼저, 가장 두껍게)** — 순수 함수. 시드 RNG 주입으로 결정적. 불변식·엣지·대량 통계.
2. **유스케이스** — 순수 reducer/셀렉터. (state, action) → state' 전이표.
3. **컴포넌트 (어댑터)** — Testing Library로 *동작*(클릭→상태 변화→aria-live)을 검증. 마크업 스냅샷에 과의존하지 않는다.
4. **E2E (프레임워크 전체)** — Playwright로 PRD 시나리오. 결정적 대기(타임아웃 기반 금지).
5. **횡단** — axe 접근성, reduced-motion, 시각 회귀.

> 시각 비중이 큰 컴포넌트는 깨지기 쉬운 마크업 단언보다 **시각 회귀 스크린샷**이 신호가 강하다. 단, 시각 회귀는 커버리지 목표를 *보완*할 뿐 대체하지 않는다.

## 결정적 도메인 테스트 (Jurepi 핵심)

런타임은 `crypto.getRandomValues`지만 **테스트는 시드 PRNG를 주입**한다. 같은 시드 → 같은 결과 → 재현 가능.

```typescript
// AAA 패턴 + 시드 RNG
test('uniformPermutation은 각 시작 컬럼을 각 상품에 1/N로 매핑한다 (N=5)', () => {
  // Arrange
  const N = 5, RUNS = 100_000, rng = mulberry32(20260629);
  const counts = Array.from({ length: N }, () => new Array(N).fill(0));
  // Act
  for (let i = 0; i < RUNS; i++) {
    const p = uniformPermutation(N, rng);
    p.forEach((prize, start) => { counts[start][prize]++; });
  }
  // Assert — 균등성(중앙 편향 아님): 각 셀 ≈ RUNS/N ±1%, chi-square p>0.01, 전 셀 도달
  for (const row of counts) for (const c of row) {
    expect(c).toBeGreaterThan(RUNS / N * 0.99);
    expect(c).toBeLessThan(RUNS / N * 1.01);
  }
  expect(chiSquarePValue(counts, RUNS / N)).toBeGreaterThan(0.01);
});
```

공정성 테스트는 **이 프로젝트에서 가장 먼저 쓰는 RED**다. 알고리즘을 한 줄도 쓰기 전에 이 테스트가 빨갛게 떠야 한다. 이것이 PRD의 "추악한 진실" 가드다.

## 테스트 명명 (행동을 설명)

```
✅ '검색어가 어떤 도구와도 매칭되지 않으면 빈 배열을 반환한다'
✅ 'consent.ads가 false면 광고 스크립트를 게이팅한다'
✅ 'BUILD 액션 후 phase는 ready이고 rungs가 perm을 실현한다'
❌ 'test ladder works'
```

## 도구별 권장

- **Vitest** — 도메인/유스케이스/컴포넌트 단위. `--coverage`로 게이트.
- **@testing-library/react** — 컴포넌트 동작.
- **Playwright** — E2E + 시각 회귀 스크린샷(320/375/768/1024/1440, 양 테마).
- **axe-core / @axe-core/playwright** — 자동 접근성.

## 커버리지 게이트

| 영역 | 최소 | 비고 |
|------|------|------|
| 도메인(`lib/ladder`, 매처, 불변식) | 90% | 공정성·구조 불변식·trace·재현성 포함 |
| 유스케이스(reducer) | 85% | 전이·엣지 |
| 전체 | 80% | common/testing.md 기준 |

## 흔한 실수

- 구현부터 쓰고 테스트를 끼워맞춤 → 거짓 GREEN. 항상 RED 먼저.
- 도메인 테스트에서 실제 `crypto`/`Date.now()` 사용 → 비결정적. 주입하라.
- 컴포넌트 마크업 스냅샷 과의존 → 리팩터에 깨짐. 동작을 단언하라.
- Playwright `waitForTimeout(ms)` → 플레이크. 요소/상태 기반 결정적 대기.
- 공정성 테스트를 "느리다"고 약화 → CRITICAL 위반. RUNS를 줄이더라도 통계적 검정은 유지.
- **검정 헬퍼를 정의만 하고 단언에 쓰지 않음(죽은 검정 코드)** → 이름은 "chi-square"인데 실제론 느슨한 ±15% 비교만 하던 실제 사례. 헬퍼를 *실제로 호출*하고 정확한 임계값(예: df9 p=0.01 = 21.666)을 단언에 쓴다.
- **E2E를 하드코딩 영어/로케일 문자열로 쿼리** → 기본 로케일(ko) 렌더와 불일치로 전멸. `getByRole`/`data-testid`/실제 메시지 값으로 쿼리한다.
- **clipboard·timer가 헤드리스에서 다르게 동작** → `grantPermissions(['clipboard-write'])`, Toast 등 타이머는 `vi.useFakeTimers()`+`act`로.
