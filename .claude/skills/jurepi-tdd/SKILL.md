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
4. **E2E (프레임워크 전체)** — Playwright로 SPEC 시나리오. 결정적 대기(타임아웃 기반 금지).
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

공정성 테스트는 **이 프로젝트에서 가장 먼저 쓰는 RED**다. 알고리즘을 한 줄도 쓰기 전에 이 테스트가 빨갛게 떠야 한다. 이것이 SPEC의 "추악한 진실" 가드다.

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
- **공유 `test-utils`의 i18n 메시지가 실제 키와 어긋남 → `MISSING_MESSAGE`/거짓 단언.** i18n 키를 추가하면 `src/__test__/test-utils.tsx`의 메시지도 갱신한다(또는 실제 `messages/en.json`을 import). 키 누락은 테스트가 통과해도 콘솔 경고로 샌다.
- **React 19 `useRef`는 초기값 인자 필수** — `useRef<T>()`는 tsc 에러(TS2554). `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)`처럼 명시한다.
- **vitest 전역(`describe/it/expect/vi`)을 import하지 않으면 `tsc`/`next build`가 테스트 파일에서 실패한다**(이 레포는 명시 import 컨벤션, `globals:true`라도 tsconfig types엔 없음). 새 테스트 파일 상단에 `import { describe, it, expect, vi } from 'vitest';`.
- **jsdom은 파일 내 테스트가 `window`를 공유** — 컴포넌트가 `window.location`/`history`/`localStorage`를 읽으면 이전 테스트 상태가 샌다(실제: URL이 남아 다음 테스트 초기 상태 오염). `beforeEach`에서 `window.history.replaceState(null,'','/')`/`localStorage.clear()`로 격리한다.
- **훅이 매 렌더 새로 만드는 객체(예: `useLadder()` 반환값)를 `useEffect` 의존성에 넣으면 실앱에서 무한 루프** — 고정 `prop`(`result.current`)으로 렌더하는 단위 테스트는 그 참조가 안 변해 통과하지만, 실앱은 부모가 `<Comp ladder={useLadder()} />`처럼 **매 렌더 새 객체**를 내려보내 effect가 매 렌더 재실행 → `setState` 루프(React "Maximum update depth")·값 재추첨(이름 깜빡임). 실제 발생: 이름 자동추천 effect가 `[..., ladder]` 의존으로 무한 재추첨, 고정-prop 테스트는 GREEN. **예방:** ① 구현은 전체 훅 객체가 아니라 *안정 참조*만 의존(`const { setAllPlayerNames } = ladder; const playerCount = ladder.state.playerCount;` → `[autoNames, playerCount, setAllPlayerNames]`)하고 필요시 ref-시그니처로 1회만 적용. ② 테스트는 **훅을 내부에서 호출하는 실제 부모 Harness**(`function Harness(){ const l = useLadder(4); return <Comp ladder={l}/> }`)로 렌더해 매 렌더 새 객체 조건을 재현하고, 무관한 재렌더 후 값이 안 바뀜을 단언한다. 고정 `result.current` prop만으로 effect를 테스트하면 거짓 GREEN.
- **UI를 논리 위치(컬럼)에 정렬하면 상호작용 커플링이 인덱스인지 실매핑인지 드러난다 — 단위 테스트는 실매핑으로 못박는다.** 사다리 결과 카드를 *끝 컬럼*에 정렬하자, 기존 "같은 인덱스 카드 뒤집기"가 트레이스가 닿는 칸과 불일치함이 드러났다(미정렬일 땐 안 보였던 잠복 결함). 공개/색/클릭이 배열 인덱스가 아니라 실제 매핑(순열·역순열 `selectInversePermutation`)을 따르는지 **비항등 시드**로 단언한다(인덱스≠끝컬럼인 케이스를 골라 "끝컬럼 카드가 공개·같은인덱스 카드는 숨김"). N=2 + 랜덤 `build()`처럼 항등이 절반인 픽스처는 항등일 때만 통과하는 **플레이크**다 → 시드 RNG로 결정화. 정렬 자체는 E2E `boundingBox` 중심 x ±px로 게이트(integration-qa).
- **숨김 상태가 레이아웃에서 두드러지면 '안 보이게'가 아니라 '보이는 플레이스홀더'여야 한다.** 결과 카드 숨김을 `rotateY(90°)` 엣지온으로 처리해 정렬 후 '?'가 투명해 빈자리로 보였다(리더 스크린샷으로 적발, 유닛은 텍스트 존재만 검사해 통과). 숨김도 가시 상태(예: 살짝 축소된 '?')로 두고 공개 시 전환 — 단위 테스트는 텍스트만이 아니라 **가시성/치수**(혹은 E2E `boundingBox`)도 확인.
- **지속성(localStorage autosave)은 모의 `onSave`가 아니라 실제 store + reload로 검증한다.** Q&A a Day에서 컴포저 단위 테스트(모의 `onSave` 호출만 단언)는 GREEN인데 실앱은 답이 저장 안 됐다. 원인: ① 디바운스 `setTimeout` 콜백이 **스테일 `text` 클로저**를 읽어 입력 직전 값(또는 `fill()` 시 `''`)을 저장→엔트리 삭제 ② 컴포저 700ms + 훅 700ms **이중 디바운스**로 "저장됨"이 실제 쓰기보다 700ms 먼저 떠 거짓 안전. **예방:** 디바운스 콜백은 상태 클로저 대신 **값을 인자로** 받는다(`scheduleAutosave(newText)`); 입력을 throttle하는 계층이 이미 있으면 영속화는 그 호출 시점에 **즉시** 1회(중복 디바운스 금지); "저장됨" 표시는 실제 `setItem` 후에만. **테스트는 jsdom `localStorage`에 실제로 쓰고 재마운트해 값을 단언**(reload 지속성 = SPEC #1 게이트는 E2E `page.reload()`로). 모의 onSave는 "호출됨"만 증명할 뿐 "저장됨"을 증명하지 못한다.
- **prop이 바뀌어도 `useState(initialProp)`는 갱신되지 않는다 — 재사용 컴포넌트는 식별자 변경 시 동기화 effect 필요.** 같은 `AnswerComposer`를 날짜만 바꿔 재사용(이웃 탐색·달력)했더니 이전 날짜의 텍스트가 남고 blur 시 엉뚱한 날짜에 저장됐다. `useEffect(() => setText(initialText), [date])`로 식별자(날짜) 변경 시에만 재동기화(매 prop 변경마다 하면 진행 중 편집을 덮어씀). 테스트는 prop을 바꿔 리렌더 후 값/저장 대상이 새 식별자를 따르는지 단언.
- **모든 `t('key')` 호출을 메시지 카탈로그와 대조한다(누락은 통과해도 콘솔로 샌다).** Q&A a Day는 `composer.delete`(카탈로그는 `composer.deleted`)와 `t('_locale')`(존재하지 않음) 누락이 있었다. 특히 `t('_locale')`을 `new Intl.DateTimeFormat(...)`/`toLocaleDateString(...)`에 넘기면 next-intl이 키 문자열을 반환→`RangeError: Invalid language tag`→ErrorBoundary가 **도구 전체를 삼킴**(빌드·유닛 그린). 로케일은 항상 `useLocale()`→BCP-47(`ko`→`ko-KR`)로 만들고, 컴포넌트의 정적 키 집합을 ko/en 카탈로그 leaf 키와 스크립트로 diff한다.
- **'기본값'이 두 곳(라이브러리 기본 인자 + 호출부 인자)에 살면, 인자 없이 훅을 부르는 단위 테스트는 '실제 앱 값'이 아니라 '기본 인자'를 검증한다(거짓 GREEN).** 사다리 기본 인원을 `useLadder(initialCount = 7)`로 바꿨지만 마운트하는 `LadderGame`이 `useLadder(4)`로 인자를 넘겨 화면은 4였다 — `useLadder()`(무인자) 단위 테스트는 기본 7을 보고 통과해 결함을 숨겼다(리더 라이브 스크린샷으로 적발). **예방:** 기본값/초기상태는 *실제 마운트 지점*으로 검증한다(엔트리 컴포넌트를 렌더해 단언하거나 호출부 인자를 직접 단언). 기본값을 바꾸면 호출부(`useLadder(N)`·`initLadderState(N)`)를 전부 grep해 함께 갱신 — '훅 기본값 그린'은 '앱이 그 값을 쓴다'를 증명하지 못한다.
- **새 전역 React Context Provider를 도입하면 그 Provider를 `src/__test__/test-utils.tsx`의 `AllTheProviders` 래퍼에 추가하고 *전체* `pnpm test`를 돌린다 — 안 그러면 공용 호스트를 렌더하던 *기존* 테스트가 일제히 throw로 깨진다.** 실제: GA 동의 배너에서 `ConsentReopenButton`(`useConsent`)을 `Footer`에 끼우자 `useConsent`가 ConsentProvider 밖에서 throw → `Footer.test` 7건 실패. 그런데 ui-engineer는 자기 `src/lib/consent`·`src/components/consent` 테스트(10/10)만 `vitest run <dir>`로 돌려 회귀를 놓쳤다(리더가 전체 `pnpm test`로 적발). **예방:** ① 전역 Provider는 test-utils `AllTheProviders`에 추가(NextIntlClientProvider 옆에 중첩) ② 컨텍스트 소비 컴포넌트를 공용 호스트(Footer/Header/layout)에 끼우면 그 호스트를 렌더하는 *기존* 테스트를 grep해 같이 통과 확인 ③ 신규 파일만 부분 실행한 "N passed"는 회귀 증명이 아니다 — 항상 전체 스위트.
- **디바운스 검색: controlled 입력은 *draft* 값에 바인딩하고, 필터링만 debounced/committed 값을 쓴다.** 입력 `value={committedQuery}` + `onChange={setDraft}`(draft만 갱신, committed는 120ms 뒤)로 두면 매 키 입력마다 입력이 committed(옛 값)로 되돌아가 **글자가 지연되거나 사라진다**(실제 new-word: `query: state.query`를 노출→타이핑 깨짐, `state.queryDraft` 노출로 수정). 훅은 draft(즉시)와 committed(디바운스) 둘을 구분해 노출: 입력·빈상태 에코·clear는 draft, `filterTerms`·결과수는 committed. 이 결함은 `.fill()` 기반 E2E가 우연히 통과할 수 있으니 라이브 타이핑 또는 키 단위 입력으로 확인.
- **작고 드문 사용자 상태(즐겨찾기·최근·마지막 탭)의 localStorage 영속화는 디바운스하지 말고 즉시 쓴다.** 500ms 디바운스면 별표를 누르고 곧바로 이동/새로고침 시 저장 전이라 **유실**된다(실제 new-word: 100ms 후 reload E2E가 즐겨찾기 탭 소실로 실패 → 실제 데이터 유실 위험). 디바운스는 큰/빈번한 쓰기(예: 텍스트 타이핑 자동저장)에만. 페이로드가 작고 액션이 이산적이면 변경 시 즉시 `setItem`(값은 인자로 전달해 스테일 클로저 회피). 테스트: 액션 직후(디바운스 대기 없이) `localStorage`에 실제 쓰였는지 + reload 지속을 단언.
