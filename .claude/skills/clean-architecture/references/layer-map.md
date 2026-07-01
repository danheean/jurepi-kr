# Jurepi 계층 매핑 상세

> `clean-architecture` 스킬의 부속 참조. 파일을 어느 계층에 두고 무엇을 import해도 되는지 판단할 때 읽는다.

## 목차
1. 파일별 계층 배정표
2. import 합법성 판정표
3. 사다리 도구의 계층 분해(워크된 예시)
4. 자주 틀리는 경계 사례

---

## 1. 파일별 계층 배정표

SPEC `file_structure`를 클린 아키텍처 계층으로 라벨링한 것. 파일 위치는 SPEC를 따르되, **라벨이 import 규칙을 결정한다.**

| 파일/디렉토리 | 계층 | 메모 |
|---------------|------|------|
| `src/lib/ladder.ts` | 1 도메인 | 순수 엔진. RNG 주입. react/next 금지. |
| `src/tools/types.ts` | 1 도메인 | ToolMeta 타입 + 불변식(정렬/유일성). |
| `src/lib/utils.ts` (검색 매처, clamp) | 1 도메인 | 순수. `cn()`은 어댑터성이지만 무해 — 순수 유지. |
| `src/lib/consent.ts` (게이팅 판정) | 1→2 | 순수 판정 함수는 도메인, 저장 흐름은 유스케이스. |
| `useLadder`의 reducer 부분 | 2 유스케이스 | phase 전이를 순수 reducer로 추출. |
| 검색/필터/정렬 흐름 | 2 유스케이스 | 도메인 매처 + 레지스트리 조합. |
| `src/tools/registry.ts` | 2/3 경계 | 데이터(컴파일타임). 도메인 타입에 의존, 어댑터가 소비. |
| `src/components/**` | 3 어댑터 | React 프레젠테이션. 유스케이스/도메인 호출만. |
| `src/hooks/useLadder.ts` | 3 어댑터 | 순수 reducer를 React 상태에 바인딩하는 얇은 층. |
| `src/hooks/useLocalStorage.ts` | 3 어댑터 | localStorage 포트의 구현. |
| `src/hooks/useConsent.ts` | 3 어댑터 | consent 도메인 판정 + 저장 어댑터 연결. |
| `src/lib/seo.ts` | 3 어댑터 | Next Metadata 타입에 의존 → 어댑터. 레지스트리에서 파생. |
| `src/lib/analytics.ts` | 3 어댑터 | gtag 래퍼. |
| `src/i18n/{routing,request}.ts` | 4 프레임워크 | next-intl 런타임 배선. |
| `src/app/**` | 4 프레임워크 | App Router. SSG, 레이아웃, 라우트. |
| `tokens.css` / Tailwind 설정 | 4 프레임워크 | 스타일 드라이버. |

## 2. import 합법성 판정표

| ~에서 | ~를 import | 합법? | 이유 |
|-------|-----------|-------|------|
| 도메인 | `react` | ❌ | 도메인은 프레임워크 무지. |
| 도메인 | `crypto`/`localStorage` 직접 | ❌ | 포트로 주입. |
| 유스케이스(reducer) | 도메인 | ✅ | 안쪽 의존 OK. |
| 유스케이스 | `react` (useState 등) | ❌ | reducer는 순수. 훅은 어댑터(3계층)에서. |
| 어댑터(컴포넌트) | 유스케이스/도메인 | ✅ | 바깥→안 OK. |
| 어댑터 | 다른 컴포넌트 | ✅(props/공개 API) | 내부 강결합은 지양. |
| 프레임워크(app/) | 어댑터/유스케이스/도메인 | ✅ | 가장 바깥. |
| 도메인 | 유스케이스/어댑터/프레임워크 | ❌ | 절대. 바깥을 모른다. |

**빠른 판정:** "이 파일을 백엔드(Node, 브라우저 없음)에서 import해도 깨지지 않는가?" → 그렇다면 도메인/유스케이스로 둘 자격이 있다.

## 3. 사다리 도구 계층 분해 (워크된 예시)

```
[1 도메인]  src/lib/ladder.ts
  uniformPermutation(n, rng)        // 공정성 원천 — 균등 순열 먼저
  ladderFromPermutation(perm, rng)  // 순열을 실현하는 rung 생성(인접 전치)
  tracePath(rungs, startCol)        // 결정적 경로
  resolveAll(rungs, cols)           // 전체 매핑; dev에서 === perm
  불변식: 구조(인접 rung 금지) + 공정성(각 1/N)

[2 유스케이스]  ladderReducer (useLadder에서 추출)
  state: {phase, players, prizes, rungs, permutation, revealed, ...}
  actions: SETUP_CHANGE / BUILD / REVEAL_ONE / REVEAL_ALL / RESHUFFLE / RESET
  순수: (state, action, rng?) => state'  // rng는 BUILD/RESHUFFLE에만 주입

[3 어댑터]  components/tools/ladder/* + hooks/useLadder.ts
  useLadder(): React 상태 + dispatch + 애니메이션 타이밍 (reducer를 감쌈)
  LadderBoard: SVG가 tracePath/resolveAll 결과를 그림(로직 재구현 금지)
  PrizeCards/PlayerHeader/ResultPanel: 표시 + 이벤트 → dispatch

[4 프레임워크]  app/[locale]/tools/[slug]/page.tsx
  slug==='ladder' → <LadderGame/> 마운트, Error Boundary, in_content AdSlot
  generateStaticParams가 registry에서 이 라우트를 생성
```

핵심: **SVG는 엔진을 신뢰만 한다.** `LadderBoard`가 자체적으로 경로를 계산하면 안 된다 — `tracePath` 출력을 좌표로 변환만 한다. QA가 `resolveAll === 화면 경로`를 교차 검증한다.

## 4. 자주 틀리는 경계 사례

- **`cn()` / clamp:** 순수 유틸 → 도메인 OK. 단 Tailwind 클래스 병합 정도는 어댑터 성격이어도 무해하니 `lib/utils.ts` 유지.
- **i18n 기본 라벨("참가자 N"):** 카피는 메시지 카탈로그(프레임워크/어댑터)에 있고, 도메인은 "blank면 인덱스로 채운다"는 *규칙*만 안다 — 도메인에 한국어 문자열 하드코딩 금지.
- **검색 디바운스(120ms):** 디바운스는 어댑터(훅) 책임. 매칭 알고리즘만 도메인.
- **consent 게이팅:** "consent.ads===true면 광고 허용"은 순수 판정(도메인). 스크립트 실제 로딩은 프레임워크(next/script).
- **SEO JSON-LD:** 데이터 모양은 도메인/레지스트리에서 오지만 Next `Metadata`로의 변환은 어댑터(`lib/seo.ts`).
