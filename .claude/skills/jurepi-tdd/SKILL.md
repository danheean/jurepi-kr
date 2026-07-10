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
- **기존 테스트 파일에 스펙을 추가할 땐 append — 파일을 새로 써서 대체(사실상 삭제) 금지.** 실제: 공유 버튼 통합 테스트를 추가하며 `TermDetail.test.tsx` 기존 497줄(빈 상태·헤딩·토글·정의·마크다운·복사 등)을 통째로 지우고 자기 3개 테스트만 남김 — 전체 스위트 "N passed"는 **삭제로 얻은 그린**이라 커버리지 회귀를 숨긴다. 기존 describe는 건드리지 말고 새 describe를 뒤에 추가하고, 완료 보고에 해당 테스트 파일의 테스트 **개수 증감**(전 N → 후 N+k)을 명시한다.
- 도메인 테스트에서 실제 `crypto`/`Date.now()` 사용 → 비결정적. 주입하라.
- 컴포넌트 마크업 스냅샷 과의존 → 리팩터에 깨짐. 동작을 단언하라.
- Playwright `waitForTimeout(ms)` → 플레이크. 요소/상태 기반 결정적 대기.
- 공정성 테스트를 "느리다"고 약화 → CRITICAL 위반. RUNS를 줄이더라도 통계적 검정은 유지.
- **검정 헬퍼를 정의만 하고 단언에 쓰지 않음(죽은 검정 코드)** → 이름은 "chi-square"인데 실제론 느슨한 ±15% 비교만 하던 실제 사례. 헬퍼를 *실제로 호출*하고 정확한 임계값(예: df9 p=0.01 = 21.666)을 단언에 쓴다.
- **E2E를 하드코딩 영어/로케일 문자열로 쿼리** → 기본 로케일(ko) 렌더와 불일치로 전멸. `getByRole`/`data-testid`/실제 메시지 값으로 쿼리한다.
- **clipboard·timer가 헤드리스에서 다르게 동작** → `grantPermissions(['clipboard-write'])`, Toast 등 타이머는 `vi.useFakeTimers()`+`act`로.
- **`vi.useFakeTimers()` 아래서 실제 비동기 파일 읽기(`file.arrayBuffer()`/`FileReader`)는 영영 resolve 안 돼 테스트가 타임아웃으로 행 — 게다가 `try/finally` 앞에서 걸린 `vi.stubGlobal('navigator', …)`가 정리되지 않아 *무관한 후속 테스트*로 전이한다.** base64-encoder 실측: 파일 인코딩(encodeFile) 훅 테스트를 `beforeEach`의 fake timers 아래 돌렸더니 그 테스트 하나가 행 + navigator 스텁 누수로 같은 파일 9개가 연쇄 실패(`object null is not iterable`, `Cannot read properties of null (reading '1')`). **예방:** 실제 File I/O를 포함하는 테스트는 그 테스트 안에서 `vi.useRealTimers()`로 전환하고, 전역 스텁은 반드시 `try { … } finally { vi.unstubAllGlobals(); }`로 감싸 행이 나도 정리되게 한다. 한 파일에서 첫 실패 후 줄줄이 깨지면 근인이 "직전 테스트의 미정리 스텁/타이머"일 수 있으니 **격리(단독 실행)로 진짜 근인부터 분리**한다.
- **도메인 함수가 이미 올바른 값을 계산해 반환하면 소비처(훅)는 그 값을 *운반*하라 — 재구성하면 가정이 하드코딩된다.** base64-encoder 실측: `encodeFile`/`safeEncode`가 실제 MIME이 담긴 올바른 `dataUri`(`data:image/png;base64,…`)를 이미 반환하는데, 훅의 `process()`가 그걸 버리고 `base64`만 저장 → "Data-URI 복사"가 `` `data:text/plain;base64,${outputText}` ``로 **MIME을 하드코딩 재구성**해 이미지·PDF를 인코딩해도 항상 `text/plain` data URI가 나왔다(`<img src>`에서 렌더 불가). 유닛은 텍스트 케이스만 봐 GREEN. **예방:** ① 도메인이 파생값(dataUri·확장자·정규화 문자열)을 이미 내면 훅은 상태로 **보관해 그대로 쓴다**, 문자열 템플릿으로 다시 만들지 않는다. ② 회귀 테스트는 텍스트가 아닌 케이스(이미지/PDF)로 파생값이 콘텐츠와 일치하는지 단언(`copied.startsWith('data:image/png;base64,')` + `not.startsWith('data:text/plain')`).
- **공유 `test-utils`의 i18n 메시지가 실제 키와 어긋남 → `MISSING_MESSAGE`/거짓 단언.** i18n 키를 추가하면 `src/__test__/test-utils.tsx`의 메시지도 갱신한다(또는 실제 `messages/en.json`을 import). 키 누락은 테스트가 통과해도 콘솔 경고로 샌다.
- **React 19 `useRef`는 초기값 인자 필수** — `useRef<T>()`는 tsc 에러(TS2554). `useRef<ReturnType<typeof setTimeout> | undefined>(undefined)`처럼 명시한다.
- **`Array.find()` 결과의 부재 단언에 `.not.toBeInTheDocument()`를 쓰지 마라 — `undefined`는 element/null이 아니라서 jest-dom이 throw한다(제품이 정상이어도 테스트가 터짐).** home-favorites 실측: `buttons.find(...)`가 버튼 없음(정상)으로 `undefined`를 반환했는데 `.not.toBeInTheDocument()`가 "received value must be an HTMLElement" 에러. 부재 단언은 `expect(x).toBeUndefined()` 또는 처음부터 `queryByRole(...)`(null 반환)로 쿼리한다. 같은 세션 변형 2건: 클래스 단언이 실제 클래스와 접두사 불일치(`ring-offset-2` 단언 vs 실클래스 `focus-visible:ring-offset-2` — 단언은 렌더된 className 문자열 그대로), 죽은 잔해 코드(`const { rerender } = vi.fn(...)`)가 tsc를 깨뜨림 — 테스트 파일도 tsc 대상이다.
- **vitest 전역(`describe/it/expect/vi`)을 import하지 않으면 `tsc`/`next build`가 테스트 파일에서 실패한다**(이 레포는 명시 import 컨벤션, `globals:true`라도 tsconfig types엔 없음). 새 테스트 파일 상단에 `import { describe, it, expect, vi } from 'vitest';`.
- **jsdom은 파일 내 테스트가 `window`를 공유** — 컴포넌트가 `window.location`/`history`/`localStorage`를 읽으면 이전 테스트 상태가 샌다(실제: URL이 남아 다음 테스트 초기 상태 오염). `beforeEach`에서 `window.history.replaceState(null,'','/')`/`localStorage.clear()`로 격리한다.
- **훅이 매 렌더 새로 만드는 객체(예: `useLadder()` 반환값)를 `useEffect` 의존성에 넣으면 실앱에서 무한 루프** — 고정 `prop`(`result.current`)으로 렌더하는 단위 테스트는 그 참조가 안 변해 통과하지만, 실앱은 부모가 `<Comp ladder={useLadder()} />`처럼 **매 렌더 새 객체**를 내려보내 effect가 매 렌더 재실행 → `setState` 루프(React "Maximum update depth")·값 재추첨(이름 깜빡임). 실제 발생: 이름 자동추천 effect가 `[..., ladder]` 의존으로 무한 재추첨, 고정-prop 테스트는 GREEN. **예방:** ① 구현은 전체 훅 객체가 아니라 *안정 참조*만 의존(`const { setAllPlayerNames } = ladder; const playerCount = ladder.state.playerCount;` → `[autoNames, playerCount, setAllPlayerNames]`)하고 필요시 ref-시그니처로 1회만 적용. ② 테스트는 **훅을 내부에서 호출하는 실제 부모 Harness**(`function Harness(){ const l = useLadder(4); return <Comp ladder={l}/> }`)로 렌더해 매 렌더 새 객체 조건을 재현하고, 무관한 재렌더 후 값이 안 바뀜을 단언한다. 고정 `result.current` prop만으로 effect를 테스트하면 거짓 GREEN.
- **UI를 논리 위치(컬럼)에 정렬하면 상호작용 커플링이 인덱스인지 실매핑인지 드러난다 — 단위 테스트는 실매핑으로 못박는다.** 사다리 결과 카드를 *끝 컬럼*에 정렬하자, 기존 "같은 인덱스 카드 뒤집기"가 트레이스가 닿는 칸과 불일치함이 드러났다(미정렬일 땐 안 보였던 잠복 결함). 공개/색/클릭이 배열 인덱스가 아니라 실제 매핑(순열·역순열 `selectInversePermutation`)을 따르는지 **비항등 시드**로 단언한다(인덱스≠끝컬럼인 케이스를 골라 "끝컬럼 카드가 공개·같은인덱스 카드는 숨김"). N=2 + 랜덤 `build()`처럼 항등이 절반인 픽스처는 항등일 때만 통과하는 **플레이크**다 → 시드 RNG로 결정화. 정렬 자체는 E2E `boundingBox` 중심 x ±px로 게이트(integration-qa).
- **숨김 상태가 레이아웃에서 두드러지면 '안 보이게'가 아니라 '보이는 플레이스홀더'여야 한다.** 결과 카드 숨김을 `rotateY(90°)` 엣지온으로 처리해 정렬 후 '?'가 투명해 빈자리로 보였다(리더 스크린샷으로 적발, 유닛은 텍스트 존재만 검사해 통과). 숨김도 가시 상태(예: 살짝 축소된 '?')로 두고 공개 시 전환 — 단위 테스트는 텍스트만이 아니라 **가시성/치수**(혹은 E2E `boundingBox`)도 확인.
- **`getByTestId`/`getByText`는 jsdom에서 `display:none` 요소도 찾는다 → 유닛은 '가시성 회귀'를 못 잡는다.** new-word TermCard가 카드 본문 전체를 크롤용 `<a className="hidden">` 안에 넣어 화면 카드가 비었는데도 `getByText('용어명')`은 통과(tsc·유닛·빌드·프리렌더 grep 전부 그린), 전체 E2E `toBeVisible`가 "element is not visible"로만 적발. **가시성 계약은 유닛으로 증명 불가 — E2E `toBeVisible()`/a11y 트리 스냅샷으로만 게이트**(리더 시각 게이트 필수). 그리고 **잘못된 설계를 유닛으로 못박지 말 것**: `expect(el).toHaveClass('hidden')` 같은 테스트는 "가시 콘텐츠가 숨겨진" 버그를 *계약으로 고정*한다 — 회귀 가드는 `not.toHaveClass('hidden')`+`toBeVisible` 방향이어야 한다. 크롤 링크는 숨김 앵커가 아니라 **가시 카드 루트=앵커**(design-system-fidelity의 "크롤 가능 카드" 절).
- **지속성(localStorage autosave)은 모의 `onSave`가 아니라 실제 store + reload로 검증한다.** Q&A a Day에서 컴포저 단위 테스트(모의 `onSave` 호출만 단언)는 GREEN인데 실앱은 답이 저장 안 됐다. 원인: ① 디바운스 `setTimeout` 콜백이 **스테일 `text` 클로저**를 읽어 입력 직전 값(또는 `fill()` 시 `''`)을 저장→엔트리 삭제 ② 컴포저 700ms + 훅 700ms **이중 디바운스**로 "저장됨"이 실제 쓰기보다 700ms 먼저 떠 거짓 안전. **예방:** 디바운스 콜백은 상태 클로저 대신 **값을 인자로** 받는다(`scheduleAutosave(newText)`); 입력을 throttle하는 계층이 이미 있으면 영속화는 그 호출 시점에 **즉시** 1회(중복 디바운스 금지); "저장됨" 표시는 실제 `setItem` 후에만. **테스트는 jsdom `localStorage`에 실제로 쓰고 재마운트해 값을 단언**(reload 지속성 = SPEC #1 게이트는 E2E `page.reload()`로). 모의 onSave는 "호출됨"만 증명할 뿐 "저장됨"을 증명하지 못한다.
- **prop이 바뀌어도 `useState(initialProp)`는 갱신되지 않는다 — 재사용 컴포넌트는 식별자 변경 시 동기화 effect 필요.** 같은 `AnswerComposer`를 날짜만 바꿔 재사용(이웃 탐색·달력)했더니 이전 날짜의 텍스트가 남고 blur 시 엉뚱한 날짜에 저장됐다. `useEffect(() => setText(initialText), [date])`로 식별자(날짜) 변경 시에만 재동기화(매 prop 변경마다 하면 진행 중 편집을 덮어씀). 테스트는 prop을 바꿔 리렌더 후 값/저장 대상이 새 식별자를 따르는지 단언.
- **모든 `t('key')` 호출을 메시지 카탈로그와 대조한다(누락은 통과해도 콘솔로 샌다).** Q&A a Day는 `composer.delete`(카탈로그는 `composer.deleted`)와 `t('_locale')`(존재하지 않음) 누락이 있었다. 특히 `t('_locale')`을 `new Intl.DateTimeFormat(...)`/`toLocaleDateString(...)`에 넘기면 next-intl이 키 문자열을 반환→`RangeError: Invalid language tag`→ErrorBoundary가 **도구 전체를 삼킴**(빌드·유닛 그린). 로케일은 항상 `useLocale()`→BCP-47(`ko`→`ko-KR`)로 만들고, 컴포넌트의 정적 키 집합을 ko/en 카탈로그 leaf 키와 스크립트로 diff한다.
- **'기본값'이 두 곳(라이브러리 기본 인자 + 호출부 인자)에 살면, 인자 없이 훅을 부르는 단위 테스트는 '실제 앱 값'이 아니라 '기본 인자'를 검증한다(거짓 GREEN).** 사다리 기본 인원을 `useLadder(initialCount = 7)`로 바꿨지만 마운트하는 `LadderGame`이 `useLadder(4)`로 인자를 넘겨 화면은 4였다 — `useLadder()`(무인자) 단위 테스트는 기본 7을 보고 통과해 결함을 숨겼다(리더 라이브 스크린샷으로 적발). **예방:** 기본값/초기상태는 *실제 마운트 지점*으로 검증한다(엔트리 컴포넌트를 렌더해 단언하거나 호출부 인자를 직접 단언). 기본값을 바꾸면 호출부(`useLadder(N)`·`initLadderState(N)`)를 전부 grep해 함께 갱신 — '훅 기본값 그린'은 '앱이 그 값을 쓴다'를 증명하지 못한다.
- **새 전역 React Context Provider를 도입하면 그 Provider를 `src/__test__/test-utils.tsx`의 `AllTheProviders` 래퍼에 추가하고 *전체* `pnpm test`를 돌린다 — 안 그러면 공용 호스트를 렌더하던 *기존* 테스트가 일제히 throw로 깨진다.** 실제: GA 동의 배너에서 `ConsentReopenButton`(`useConsent`)을 `Footer`에 끼우자 `useConsent`가 ConsentProvider 밖에서 throw → `Footer.test` 7건 실패. 그런데 ui-engineer는 자기 `src/lib/consent`·`src/components/consent` 테스트(10/10)만 `vitest run <dir>`로 돌려 회귀를 놓쳤다(리더가 전체 `pnpm test`로 적발). **예방:** ① 전역 Provider는 test-utils `AllTheProviders`에 추가(NextIntlClientProvider 옆에 중첩) ② 컨텍스트 소비 컴포넌트를 공용 호스트(Footer/Header/layout)에 끼우면 그 호스트를 렌더하는 *기존* 테스트를 grep해 같이 통과 확인 ③ 신규 파일만 부분 실행한 "N passed"는 회귀 증명이 아니다 — 항상 전체 스위트.
- **디바운스 검색: controlled 입력은 *draft* 값에 바인딩하고, 필터링만 debounced/committed 값을 쓴다.** 입력 `value={committedQuery}` + `onChange={setDraft}`(draft만 갱신, committed는 120ms 뒤)로 두면 매 키 입력마다 입력이 committed(옛 값)로 되돌아가 **글자가 지연되거나 사라진다**(실제 new-word: `query: state.query`를 노출→타이핑 깨짐, `state.queryDraft` 노출로 수정). 훅은 draft(즉시)와 committed(디바운스) 둘을 구분해 노출: 입력·빈상태 에코·clear는 draft, `filterTerms`·결과수는 committed. 이 결함은 `.fill()` 기반 E2E가 우연히 통과할 수 있으니 라이브 타이핑 또는 키 단위 입력으로 확인.
- **작고 드문 사용자 상태(즐겨찾기·최근·마지막 탭)의 localStorage 영속화는 디바운스하지 말고 즉시 쓴다.** 500ms 디바운스면 별표를 누르고 곧바로 이동/새로고침 시 저장 전이라 **유실**된다(실제 new-word: 100ms 후 reload E2E가 즐겨찾기 탭 소실로 실패 → 실제 데이터 유실 위험). 디바운스는 큰/빈번한 쓰기(예: 텍스트 타이핑 자동저장)에만. 페이로드가 작고 액션이 이산적이면 변경 시 즉시 `setItem`(값은 인자로 전달해 스테일 클로저 회피). 테스트: 액션 직후(디바운스 대기 없이) `localStorage`에 실제 쓰였는지 + reload 지속을 단언.
- **컴포넌트가 런타임 유니온 값을 `t()`에 보간하면 카탈로그 키 철자와 어긋나 *원시 키가 화면에 노출*된다(MISSING_MESSAGE·유닛은 구조만 봐 GREEN).** url-encoder: charset 값 `'utf-8'|'euc-kr'`를 `t(\`charset.${v}\`)`로 조회했으나 키는 `utf8`/`euckr` → 토글에 `tools.url-encoder.charset.utf-8`이 그대로 렌더(리더 시각 게이트로 적발, 콘솔 MISSING_MESSAGE 8건). **예방:** 값→키 **명시 맵**(`{'utf-8':'charset.utf8','euc-kr':'charset.euckr'}[v]`), raw 값 보간 금지. 렌더 UI/HTML에 `t()` 키 문자열(`tools.…`)이 보이면 = 불일치. **SSR SEO 섹션 테스트는 `NextIntlClientProvider`에 *전체 중첩* `messages`(통째 `ko.json`)를 넘긴다** — 플랫 키 `{'tools.x': …}`는 `useTranslations('tools.x')` 네임스페이스가 안 풀려 실텍스트가 안 나오는데도 *구조만*(h2 존재·section class) 단언하는 테스트는 거짓 GREEN(new-word 패턴 답습 시 함정). 실제 번역 텍스트·`t.raw('faq.items')` 길이를 단언해 키 해석을 못박는다.
- **비동기 디스패처(`process`)·누적 업데이트(`addRecent`)가 클로저의 `state.*`를 읽으면 스테일된다 — 안정 참조 + 함수형 setState로 근본 해결.** url-encoder(위 useLadder 무한루프와 다른 *stale-read* 변형): ① `addRecent`가 `pushRecent(state.recents,…)`로 stale `recents`를 읽어 한 배치의 두 호출이 첫 항목을 유실(`['test2']`만) → `setState(prev => ({...prev, recents: pushRecent(prev.recents,…)}))` 함수형 업데이트로 누적. ② `process`가 클로저 `state.text`를 읽어, 테스트가 초기 렌더의 `actions.process`(stale ref)를 호출하면 `text=''`→no-op(result=null). 매 렌더 `stateRef.current = state`로 갱신하고 `process`는 거기서 최신값을 읽는 **빈-deps 안정 콜백**으로. persist는 값을 읽는 별도 effect(`if(!mounted)return`)로 분리해 로드 전 빈 배열 덮어쓰기 방지. 테스트가 `actions`를 1회 구조분해해 재사용하는 패턴이 이 stale를 드러낸다.
- **상태보관 카탈로그 모듈(`initCatalog`+모듈 `_catalog`)을 훅이 초기화하지 않으면 `byId()`가 항상 null → 상세/최근이 조용히 안 뜬다.** bookmarks: 훅이 `initCatalog(CATALOG)`를 안 불러 `byId(selectedSlug)`=null → 카드 선택 링(문자열 비교)은 정상인데 **상세 패널이 전혀 렌더 안 됨**. 도메인 `catalog.test`는 initCatalog를 직접 호출해 GREEN, tsc·전체 유닛도 GREEN(리더 클릭→상세 스크린샷으로 적발). **예방:** 런타임 조회는 **무상태**(rankings처럼 `byId(catalog, slug)`/in-state `state.catalog.find`) 선호. 상태보관 모듈이면 마운트 시 `initCatalog` 강제 + 컴포넌트/E2E는 선택 링만이 아니라 **선택→상세 콘텐츠 렌더**를 단언.
- **병렬 ui/platform i18n 키 드리프트는 컴포넌트 테스트를 *실제 메시지 카탈로그*로 렌더해야 잡힌다.** bookmarks ui가 `search.label`·`tabs.filterLabel`·`list.itemCount`·`list.toggleFavorite`·`empty.noFavorites`를 소비했으나 카탈로그엔 없어 런타임 MISSING_MESSAGE(tsc·전체 유닛 GREEN — 인터랙티브 컴포넌트가 실카탈로그로 렌더 안 돼 은닉, 리더 콘솔 게이트로 적발). **예방:** 인터랙티브 컴포넌트도 `NextIntlClientProvider`에 통째 `ko.json`을 넘겨 렌더하는 최소 테스트 1개(모의 `t` 금지) + 리더 병합 후 컴포넌트의 `t('…')` 키(스코프 포함)를 ko/en leaf와 diff. SSR 섹션뿐 아니라 **인터랙티브 island도** 이 규율 적용.
- **런타임 보간 i18n(`{current}/{total}`)을 프레젠테이션 컴포넌트 경계로 넘길 땐 `t.raw()`(또는 값과 함께 해석) — `t()`로 미리 포맷 금지.** speed-quiz: 오케스트레이터가 `t('board.of')`(=`"{current} / {total}"`)를 값 없이 호출해 리프에 넘겼는데, 리프는 원본 템플릿을 `.replace('{current}',…)`로 치환하는 설계 → next-intl이 즉시 ICU 포맷을 시도하다 **FORMATTING_ERROR**를 매 렌더 콘솔에 폭주시키고 표시가 깨졌다(고정-문자열 유닛은 통과, 리프를 라이브 `t`로 렌더 안 해 은닉). 원본 템플릿이 필요하면 `t.raw(key)`, 값이 있으면 `t(key,{current,total})`. **검증:** 보드를 실제 `t`로 렌더하는 컴포넌트/E2E + 콘솔 에러 0.
- **리듀서가 `status` 필드를 반환하면 소비 훅은 자신의 `phase`(뷰 상태)를 그 status에서 파생/동기화하라.** speed-quiz reducer는 마지막 단어 마킹 시 `status:'summary'`를 냈지만 훅의 `MARK_CORRECT` 케이스가 `phase`를 안 바꿔, 게임 보드가 요약으로 못 넘어가고 `11/10`(인덱스 오버슈트)로 멈췄다 — 고정-액션 단위테스트는 단말 전이를 안 밟아 GREEN. **예방=상태머신 단말 전이 테스트**: 게임을 **끝까지 플레이**(전 단어 마킹)해 `phase==='summary'`·카운트 오버슈트 없음·`endGame`은 즉시 summary를 단언.
- **주(主) 액션 버튼의 `disabled`(활성상태)를 비반응 ref(`canvasRef.current`)에 게이팅하면 버튼이 *영구 비활성*이다 — ref 변경은 리렌더를 트리거하지 않으므로, 캔버스가 마운트돼 `.current`가 채워져도 그 값을 읽은 렌더는 다시 실행되지 않는다.** qr-code: `const canDownload = !!canvasRef.current && !!svg` → QR이 화면에 그려졌는데도 PNG/SVG/복사 버튼 3개가 전부 `disabled`(도구의 **핵심기능=다운로드가 화면에서 불능**). DownloadButtons 단위테스트는 `canvasRef`에 *이미 채워진* 가짜 ref를 넘겨 GREEN(tsc·유닛·빌드 전부 그린), 리더 라이브 DOM 조회(`button.disabled===true`)로만 적발. **예방:** ① 활성상태는 **반응 상태**(훅이 내는 `result`/`svg`)로 게이팅하고, ref는 *클릭 핸들러 안*에서만 가드(`if(!canvasRef.current) return`) — 캔버스는 result가 있으면 항상 마운트돼 클릭 시점엔 채워져 있다. ② ref/DOM 준비상태를 정말 렌더에 반영해야 하면 `useState`로 승격(콜백 ref로 `setReady(true)`). ③ **테스트는 채워진 ref를 모의하지 말고**, 훅이 result를 낸 뒤 버튼이 `enabled`가 되는지 + 실제 액션(다운로드 이벤트) 발화를 라이브 E2E로 단언(`waitForEvent('download')`). "버튼이 존재/렌더된다"만 보는 유닛은 "버튼이 눌린다"를 증명하지 못한다.
- **데이터 변환/달력 도구의 SPEC 예시 값은 정본 라이브러리/오라클로 먼저 검증한 뒤 테스트 기대값으로 못박는다 — SPEC이 틀릴 수 있다.** lunar-converter SPEC의 `test_scenario_1`은 "solar 2024-03-15 → 음력 윤2월 6일"이라 했으나, `korean-lunar-calendar`(KASI 정본)로 확인하니 실제는 **평달 2월 6일**(2024년엔 윤달 자체가 없음)이었다. 도메인 엔지니어가 SPEC 예시를 그대로 하드코딩했으면 테스트가 틀린 값을 못박거나("SPEC대로 통과") 엔진을 잘못 의심했을 것이다. **예방:** ① 착수 전 SPEC의 구체 예시(변환 쌍·경계·간지)를 라이브러리로 스모크 검증해 정오표를 만든다(리더가 `_workspace/*verified-anchors.md`로 공유). ② 순수 파생값(간지·띠)은 정본 라이브러리 출력과의 **골든 크로스체크**(다년도 루프: `computeSexagenary(lunarYear).name+'년' === lib.getKoreanGapja().year`)로 KASI 일치를 자동 증명 — 프로즈에 적힌 mod 산술은 슬립이 잦으니 하드코딩 금지. ③ 무상태 lib가 stateful이면(`setSolarDate→boolean`) false 시 절대 `get*()`를 읽지 않고 매 변환 새 인스턴스.
- **컴포넌트/도구는 ko 카탈로그뿐 아니라 en 로케일도 렌더·검사해야 '한글 하드코딩·로케일 종속 포맷' 누수를 잡는다.** lunar-converter는 결과 카드 라벨을 `"양력"/"음력"` **문자열 하드코딩**, 음력 날짜를 `${y}년 ${m}월 ${d}일` **한글 포맷 하드코딩**, 드롭다운 placeholder를 `선택/월/일`로 두어 **영어 페이지에 한글이 그대로 노출**됐다 — ko로만 렌더하는 유닛은 전부 GREEN(값이 우연히 맞음), 리더의 en 라이브 스크린샷으로만 적발. **예방:** ① 프레젠테이션의 모든 사람 대상 문자열은 `t()`(하드코딩 금지) + 로케일 종속 포맷(날짜·숫자)은 `useLocale()`→`Intl`로 분기(음력처럼 Intl이 없으면 로케일별 포맷 명시). ② 최소 1개 컴포넌트 테스트는 **`locale="en"` + 실제 `en.json`**으로도 렌더해 한글(정규식 `/[가-힣]/`)이 안 새는지 단언, 혹은 리더가 en 페이지를 반드시 시각 검증. "ko에서 맞다"는 "i18n이 됐다"를 증명하지 못한다. **단, 명시적으로 언어 라벨된 참조/용어 병기는 누수가 아니라 의도된 콘텐츠다** — en 페이지의 `(만 나이)`(한국 법정 나이 개념 병기)·`Wikipedia (한국어)`(언어 라벨된 참조 링크)·EUC-KR 디코딩 예시 `'한'`, 그리고 신조어 사전처럼 한국어 용어 자체가 콘텐츠인 도구의 term명. 누수로 잡을 것은 **크롬(탭·검색 placeholder·버튼·섹션 제목·결과 라벨)의 미라벨 외국문자**이지, 명시적으로 라벨됐거나 도구 주제 자체인 콘텐츠가 아니다. 반대로 **미라벨 파생값은 실제 누수다** — age-calculator 간지가 en에서도 한글 `경오년`으로 노출된 것은, 공유 lunar-converter 엔진이 이미 제공하던 `english` 로마자(`Metal Horse`)를 resolve가 버렸기 때문 → 파생 도메인이 다국어 필드를 제공하면 소비처가 로케일로 분기(버리지 말 것).
- **비동기 파이프라인의 "다음 단계"가 setState 직후의 상태 스냅샷(stateRef/prop)을 읽으면 stale이거나 데드락이다 — 파이프라인 값은 로컬 변수/반환값으로 직접 전달한다.** transparent-background 실제 2건: ① 훅 `uploadImage`가 canvas를 setState하고 `phase:'detecting'`으로 끝났는데, 후속 감지는 `stateRef.current.sourceImage`를 읽는 별도 콜백이라 **아무도 호출하지 못하는 데드락**(자동 감지 버튼은 detecting 중 disabled — 도구 전체 불능인데 유닛·tsc·빌드 전부 그린, E2E "element is not enabled"로만 적발). setState 직후 stateRef는 아직 이전 렌더 값이므로 즉시 호출도 불가 → 감지·제거를 `runDetectAndRemove(canvas)`로 추출해 **로컬 canvas 인자**로 업로드 완료 지점에서 직접 호출. ② `ExportButton.handleDownload`가 `await onDownload()`(내부에서 setResultBlob) 후 **이전 렌더의 `resultBlob` prop**으로 a.download → 첫 클릭은 파일 저장 없이 "다운로드됨!" 거짓 성공(prop은 그 렌더의 스냅샷 — await로 시간이 지나도 안 변한다) → `const blob = await onDownload(); if (!blob) return;`으로 **반환값 사용**. **규칙:** async 액션이 만든 값을 다음 단계가 쓰면 반환값/인자로 넘긴다. state·ref·prop 스냅샷 경유는 "다음 렌더 이후 사용자 이벤트"에서만 안전. 테스트는 업로드→결과까지 한 흐름으로(중간 단계 모의 금지) + 다운로드는 E2E `waitForEvent('download')` 실발화로 단언.
- **디바운스/지연 타이머 ref는 용도별로 분리한다 — 하나의 `debounceTimerRef`를 두 effect/콜백이 공유하면 서로의 타이머를 clearTimeout으로 상호 취소한다.** transparent-background 훅에서 localStorage persist(500ms)와 옵션 변경 제거 재실행(100ms)이 같은 ref를 써서, 슬라이더 조작 시 저장이 유실되거나 제거 실행이 취소될 수 있었다(어느 쪽이 이기는지는 타이밍 의존 — 플레이키 잠복 결함). `persistTimerRef`/`removalTimerRef`처럼 용도당 ref 1개 + cleanup도 자기 것만 지운다.
- **외부 SDK 모의는 '실측한 실제 API 표면'만 인코딩한다 — 지어낸 메서드를 모의에 넣으면 유닛은 영원히 GREEN이고 운영에서만 크래시한다.** restaurant-map 실제: NAVER 지도 `LatLngBounds`에 존재하지 않는 `maxLat()/minLat()/maxLng()/minLng()`를 컴포넌트가 호출했는데, **테스트 모의가 같은 가짜 메서드를 제공**해 유닛·tsc·빌드 전부 그린 → 운영에서 `TypeError: e.maxLat is not a function`으로 ErrorBoundary가 도구 전체를 삼킴(실제 API는 `north()/south()/east()/west()`). 같은 파일에서 `new naver.PointingIcon({content})`도 모의가 생성자로 꾸며 통과했지만 실제 SDK의 `PointingIcon`은 폴리라인용 **enum 객체**(마커 아이콘은 `{content, anchor}` HtmlIcon 리터럴). **예방:** ① 모의 작성 전 실제 SDK 표면을 확인한다 — 공식 문서 + 가능하면 라이브 페이지에서 `Object.getOwnPropertyNames(SDK.Class.prototype)` 실측(운영/데모 페이지에 SDK가 이미 로드돼 있으면 브라우저 evaluate 한 번이면 된다). ② 모의에 실측 근거를 주석으로 남기고, 잘못 쓰면 *던지도록* 구성(enum을 생성자로 모의하지 말고 실제처럼 plain object로 → `new` 시 테스트가 크래시). ③ 외부 SDK 통합 컴포넌트는 유닛만으론 증명 불가 — E2E에 `page.on('pageerror')` 수집 + ErrorBoundary 문구 부재를 하드게이트로 넣어 실 SDK와의 계약을 라이브에서 단언한다.
- **공유 테스트 하네스(`test-utils.tsx`)의 전역 계약 — Provider `locale`·기존 메시지 블록 — 을 자기 테스트에 맞추려 바꾸지 마라.** json-formatter 실제: 에이전트가 한국어 단언 테스트를 통과시키려 `AllTheProviders`의 `locale="en"`을 `"ko"`로 뒤집음 → 자기 스위트는 그린, en 렌더를 전제한 *기존* 테스트 6건(LocaleSwitcher aria-current, NewWord 빈 힌트, RankingDetail 헤딩)이 일제히 깨짐(전체 스위트에서만 발각). 레포 관례는 **test-utils=EN 카탈로그·locale="en"** — 새 도구 블록도 EN 값으로 추가하고, 단언도 EN 문자열로 쓴다(ko 검증은 리더 시각 게이트·E2E ko 경로 몫). 전역 하네스 변경이 정말 필요하면 리더 승인 + 전체 `pnpm test` 그린을 함께 제시해야 한다. 또한 **ICU 함정 2종**: next-intl 보간은 홑중괄호(`{status}` — `{{status}}`는 리터럴 노출), 메시지 안 어포스트로피는 이스케이프 문자라 `'{token}'`은 리터럴 `{token}`으로 렌더된다(따옴표로 감싼 보간은 `''{token}''`).
- **브라우저 전용 값(`navigator.onLine`·`matchMedia`·뷰포트 크기)을 `useState` 초기값에서 읽으면 하이드레이션 #418이다 — 초기값은 SSR 일치 상수, 실값은 마운트 effect에서 동기화.** my-ip 실제: `useState(typeof navigator !== 'undefined' ? navigator.onLine : true)`가 서버(true)와 클라 첫 렌더(headless는 false 가능)를 갈라 서버는 null, 클라는 OfflineNotice를 렌더 → React #418(프로덕션 압축 메시지). 유닛·tsc·빌드 전부 그린이었고 E2E 하드게이트만 적발. **예방:** ① 초기값은 항상 SSR과 같은 상수(`useState(true)`), 브라우저 실값은 마운트 effect에서 `setState`로 동기화 ② 근인 특정은 dev 서버(비압축 에러가 서버/클라 diff 트리를 그대로 보여줌 — my-ip에서 `+ <section>` vs `- <div OfflineNotice>`로 즉시 특정) ③ 회귀 테스트: `navigator` getter를 spy로 뒤집고(`vi.spyOn(window.navigator,'onLine','get').mockReturnValue(false)`) 초기 렌더≠실값, effect 후 동기화를 단언 + `<StrictMode>` 래퍼 렌더로 effect 재실행 생존도 함께 못박는다.
- **마운트 1회 effect(`[]` deps) 안에서 등록한 이벤트 리스너가 컴포넌트 state를 직접 읽으면 초기값으로 영원히 굳는다 — 리스너는 ref로 현재값을 읽어라.** my-ip 실제: `'online'` 리스너가 클로저의 `error`(초기 null)를 검사해 "에러 상태면 자동 재시도"가 **절대 발화하지 않음**(SPEC 요구 위반). 고정-모의 유닛은 이 경로를 안 밟아 GREEN. **예방:** state와 나란히 `errorRef`를 두고 모든 set 지점에서 동기 갱신, 리스너는 `errorRef.current`로 판정(기존 'stale-read' 교훈의 이벤트 리스너 변형). **테스트:** 에러 상태를 만든 뒤 `window.dispatchEvent(new Event('online'))`로 실제 이벤트를 쏴 재시도 발화를 단언하고, 에러가 없을 때는 발화하지 않음을 함께 단언한다.
- **표시 컴포넌트가 오케스트레이터에서 파생 prop을 받을 때, 고정값 하나로만 테스트하면 오케스트레이터가 *틀린 소스*를 배선해도 GREEN이다 — built≠wired의 '값' 변형.** unit-converter 실제: `ConversionTable`이 ① 소스 단위로 선택 `fromUnit`이 아니라 `canonicalPair.from`(항상 meter)을, ② 값으로 입력값이 아니라 오케스트레이터가 넘긴 결과값 `toValue`(0.1km)를 써서 → "100m 입력"에 표가 "0.1m 기준"으로 **전 카테고리 오값**. 컴포넌트 테스트는 `<ConversionTable fromValue={1} precision={2}/>`처럼 *기본/고정 prop만* 검증해 통과(tsc·유닛·E2E·빌드 전부 그린), 리더가 라이브 입력→표 대조로만 적발. **예방:** ① 파생 prop은 *비기본 선택 상태*로도 못박는다(`fromUnit="foot"` → 1ft=0.3048m=12in 회귀 테스트). ② 훅은 파생에 필요한 원값(선택 fromUnit·파싱된 입력값)을 노출하고, 오케스트레이터는 *의미상 올바른* 소스를 넘긴다(결과값·기본 단위 아님). ③ 리더 라이브 게이트: 입력/단위를 **바꿔** 결과·표·최근이 기본이 아니라 *변경*을 반영하는지 스크린샷 — 고정 prop 유닛은 '올바른 소스가 배선됐다'를 증명하지 못한다.
- **JS로 계산되는 표시 문자열(상대시간)과 컴포넌트 섹션 제목을 하드코딩하면 /ko에 영어가 샌다 — 카탈로그 grep은 못 잡는다.** unit-converter 실제: `RecentsPanel.formatTime`이 `'Just now'`/`'{n}m ago'`를 **JS 리터럴**로, `HowTo`/`Faq`가 `<h2>How do unit conversions work?</h2>`·`Frequently Asked Questions`를 **하드코딩** → /ko 페이지에 영어 노출. i18n 카탈로그 누수 grep(ko값 `/[A-Za-z]{4,}/`)은 값이 *카탈로그가 아니라 컴포넌트*에 박혀 있어 통과, 리더 /ko 라이브로만 적발. **예방:** 사람 대상 문자열은 카탈로그값이든 JS 계산값이든 전부 `t()`(상대시간=`recents.minutesAgo`+`{count}`, 날짜 폴백=`toLocaleDateString(useLocale())`; 섹션 제목=`howTo.title`/`faq.title` 키). 컴포넌트 하드코딩은 카탈로그 diff로 못 잡으니 **렌더된 /ko `main.innerText`의 영어(`/[A-Za-z]{4,}/`) 스캔**(en 한글 누수의 대칭)으로 보완한다.
- **라이브러리가 만든 DOM(mermaid SVG 등)을 React가 관리하는 노드에 `el.innerHTML=` 로 주입하고 그 뒤 `setState`하면, 다음 리렌더에서 React가 그 노드의 자식을 재조정하며 주입물을 지운다 — 클라이언트 렌더는 `dangerouslySetInnerHTML`로 React가 소유하게 하라.** howto 실제: `MermaidDiagram`이 `container.innerHTML = svg` 후 `setRendered(true)`를 호출했는데, ① 리렌더 시 React가 그 `<div>`의 조건부 자식(fallback `<pre>`)을 재조정하며 주입한 SVG를 **삭제**하고 ② `mermaid.render(id, src)`에 **컨테이너와 같은 id**를 넘겨 mermaid의 임시 측정 노드와 충돌 → 다이어그램이 안 그려지고 소스로 폴백. tsc·유닛·빌드 전부 그린, mermaid는 `try/catch`로 조용히 폴백해 콘솔 에러도 없음 → **리더 라이브 렌더(SVG 실제 그려짐) 스크린샷으로만 적발**. **예방:** ① 결과 SVG를 `useState`에 담아 `dangerouslySetInnerHTML={{__html: svg}}`로 렌더(React가 노드 소유 → 리렌더에도 유지), 명령형 `innerHTML=`+setState 금지. ② `render()`의 id는 컨테이너 id와 **다른** 유니크값(`mmd-${rand}`). ③ 정적 출력(다이어그램)은 `prefers-reduced-motion`으로 렌더를 **건너뛰지 말 것**(모션이 없으므로 스킵하면 그냥 안 보임). ④ 무거운 클라 전용 라이브러리(mermaid ~500KB·highlight.js)는 컴포넌트 안에서 `await import()` **동적 로드로 코드 분할** — 허브/타 라우트 번들에 안 들어가는지 빌드 산출물(청크가 그 스포크에만)로 확인. ⑤ SSR/초기 렌더는 **원본 소스를 가시 fallback**으로 두어 프리렌더 HTML(GEO)·JS-off·파스 실패를 동시에 커버. **테스트:** jsdom에선 실제 render가 실패하므로 "throw 없이 소스가 `<figure>`에 남는다"를 단언(구현 세부 id div가 아니라 **가시 fallback**을 단언 — 렌더 성공은 라이브 게이트 몫).
- **토글/옵션 버튼의 표시·i18n 키가 상태 필드명과 다르면, 클릭 핸들러가 *실제 필드*를 갱신하는지 단언하라 — `aria-pressed`가 phantom 키를 읽으면 "눌린 것처럼 보이나 무동작"이고 유닛은 통과한다.** find-replace 실제: 정규식 토글이 `onUpdate({ [opt.key]: !rule[opt.key] })`에서 `opt.key='regex'`(i18n 네임스페이스 `option.regex.*`와 공용)로 갱신했는데 Rule 필드는 **`isRegex`** → phantom `regex` 프로퍼티만 켜지고 `isRegex`는 계속 false → 규칙이 **리터럴 모드**로 돌아 정규식이 전혀 안 먹었다. `aria-pressed`도 phantom `regex`를 읽어 true가 되고, "aria-pressed가 뒤집힌다"만 보는 단위 테스트는 GREEN, tsc·빌드도 그린 → E2E(실제 치환 결과 단언)와 리더 라이브로만 적발. **예방:** ① 옵션 config를 `{ field:'isRegex', i18n:'regex' }`처럼 **필드 키와 i18n 키를 분리**하고 상태는 `field`로 갱신 ② 토글 테스트는 `onUpdate({ isRegex: true })`(실 필드)를 단언하고 `onUpdate({ regex: true })`가 **아님**을 단언 ③ 값이 아니라 *동작*을 E2E로(정규식 토글→패턴이 실제 적용). aria-pressed 시각 상태는 '동작한다'를 증명하지 못한다.
- **SPEC이 요구한 파생 표시(치환 하이라이트)를 도메인이 계산하지 않아도, 텍스트만 검사하면 전부 GREEN이다 — 파생 표시는 출력을 실제로 슬라이스해 검증하라.** find-replace 실제: `applyRule`이 리터럴 경로에서 `spans`를 아예 안 만들고 정규식 경로에선 *입력 좌표* span을 반환 → `<mark>` 0개(하이라이트 없음)인데 출력 텍스트는 정확 → 유닛·빌드·E2E(텍스트 `toContainText`)까지 통과, mark 개수 단언 + 리더 시각으로만 적발. 게다가 다중 규칙 하이라이트는 **출력 좌표 span + 폴드 리맵**이 필요하다(앞 규칙 span은 뒤 규칙이 텍스트를 바꾸면 stale). **예방:** 파생 표시는 `spans.map(s => output.slice(s.index, s.index+s.length))`가 실제 치환 문자열과 deep-equal인지 단언하고, **다중 규칙 케이스**(고양이→호랑이 뒤 강아지→여우)로 stale 좌표가 드러나게 못박는다(`['호랑이','여우']`). 리더 라이브 게이트: 결과에 `<mark>`가 실제로 그려진 스크린샷 1장.
- **i18n 값에 ICU 예약문자(`<` `>` `{` `}` `'`)를 리터럴로 넣지 말 것 — next-intl이 파싱해 렌더 시 throw하고, 한 로케일에만 있으면 그 로케일 라이브에서만 크래시한다.** find-replace 실제: ko `option.regex.description`에 `$1/$<name>`(JS 이름 있는 그룹 문법)을 넣자 ICU 파서가 `<name>`을 닫히지 않은 리치텍스트 태그로 읽어 `INVALID_MESSAGE: UNCLOSED_TAG`를 렌더 중 throw → ErrorBoundary가 도구를 삼킬 위험. en엔 `<`가 없어 정상이고 **유닛 스위트는 en 카탈로그를 렌더**하므로 GREEN, ko 라이브 콘솔로만 적발. **예방:** 번역 산문에 정규식/JSX 문법 예시를 리터럴로 넣지 말고(이름 있는 그룹은 말로 설명), 양 카탈로그 값에서 리터럴 `<`/`>`를 grep + **ko·en 둘 다 라이브 렌더 후 콘솔 확인**('ko/en 둘 다 렌더'의 ICU판).
- **새 도구의 `test-utils` 메시지는 손으로 쓴 인라인 mock이 아니라 실 카탈로그(en.json)를 소비해야 한다 — 인라인 mock은 실 카탈로그와 드리프트해 '가짜 라벨'로 테스트를 통과시킨다.** find-replace 실제: test-utils에 인라인 `tools['find-replace']` 블록이 있었는데 `sourceText.label='Source text'`(실제 'Text to transform'), `howTo`도 구(舊) 평면 구조 → 컴포넌트 테스트가 `getByLabelText('Source text')`로 요소를 찾아 통과하는데 배송 문자열은 달랐다. 수정=`'find-replace': (enMessages as any).tools['find-replace']`(실 en.json import). **예방:** 새 도구 네임스페이스는 실 카탈로그에 배선 → 소비되나 없는 키가 테스트에서 MISSING_MESSAGE로 드러나 드리프트를 막는다(기존 "실제 카탈로그로 렌더, 모의 금지"의 신규-도구 적용판).
