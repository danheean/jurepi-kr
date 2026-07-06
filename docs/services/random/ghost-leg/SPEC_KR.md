# 사다리타기 (Ghost Leg) — 서비스 SPEC (한국어판)

> 이 문서는 [`SPEC.md`](SPEC.md)의 한국어 번역본입니다. 원본(영문)이 AI 코딩 에이전트가 소비하는 정본이며, 내용 변경 시 두 문서를 함께 갱신하세요.
>
> Jurepi 플랫폼의 첫 번째 도구인 **사다리타기 게임**의 빌드 사양입니다.
> 내부 서비스 코드네임: `ghost-leg` (사다리타기의 표준 영문명). 공개 URL 슬러그: `/[locale]/tools/ladder`.
>
> 이 SPEC는 **게임 자체**에 집중합니다. 공통 쉘(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공합니다:
> - 플랫폼 SPEC: [`docs/SPEC_KR.md`](../../../SPEC_KR.md) (영문 정본: [`SPEC.md`](../../../SPEC.md))
> - 디자인 시스템(시각 기준, 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>사다리타기 (Ladder Game / Ghost Leg / Amidakuji) - Jurepi 도구, 코드네임 ghost-leg</project_name>

<overview>
사다리타기는 Jurepi 허브의 출시 도구입니다. 결과를 공정하고 재미있게 배정하는 한국의 전통 사다리 추첨 — 누가 커피를 살지, 팀 나누기, 선물 순서, 집안일 분담 등에 사용합니다. 참가자는 상단에, 결과(상품/벌칙)는 하단에 배치되며, 무작위로 생성된 세로줄과 가로줄의 사다리가 각 참가자를 정확히 하나의 결과에 연결합니다. 사용자가 사다리를 만들고, 참가자의 경로를 추적(개별 공개)하거나 한 번에 전체를 공개해 결과를 확인합니다.

이 모듈은 Jurepi 플랫폼 쉘 안의 도구 모듈로 `/[locale]/tools/ladder`에 마운트됩니다. 플랫폼의 헤더/푸터, 로케일(ko/en), 테마, 동의 게이팅된 광고 슬롯, DESIGN.md 토큰 시스템을 사용합니다. 본 SPEC는 게임만 명세합니다: 상태 모델, 화면, 사다리 엔진, 인터랙션/애니메이션, 게임 전용 SEO 콘텐츠, 게임 테스트.

CRITICAL: 100% 클라이언트 사이드. 사다리 엔진은 순수 함수 집합(shuffle/build/trace/resolve)이며, 주입 가능한 RNG를 사용해 단위 테스트가 가능하고 (Phase 2) 공유 시드로 재현할 수 있습니다. 백엔드 없음, 선택적 URL 인코딩 공유 상태를 제외한 영속화 없음.

CRITICAL (공정성): 게임은 증명 가능한 수준으로 공정해야 합니다 — 모든 참가자는 시작 칸과 무관하게 어떤 결과든 정확히 1/N 확률로 받습니다. 유효한 일대일 대응(bijection, 각 결과가 한 번씩 사용됨)만으로는 충분하지 않습니다: 단순한 "레벨마다 랜덤 가로줄" 방식은 가까운 결과 쪽으로 편향되고 먼 칸에는 도달조차 못 할 수 있습니다 — 이것이 잘 알려진 사다리타기의 "추악한 진실(ugly truth)"입니다. 따라서 공정성을 시각적 사다리로부터 분리합니다: 먼저 균등(uniform) 무작위 순열을 뽑고(Fisher–Yates), 그 순열을 실현하는 사다리를 그 다음에 구성합니다. 기본 RNG = crypto.getRandomValues(편향 없음); 시드 PRNG는 Phase 2 공유 링크에만 사용합니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/ladder (SSG; 레지스트리 slug "ladder", status "live", accent "coral", category "random")
  - 플랫폼이 제공(재구현 금지): 앱 쉘(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임
  - 소비(consume): messages/{ko,en}.json의 i18n 네임스페이스 `tools.ladder.*`; 게임 하단의 in_content AdSlot; lib/seo.ts의 SEO 메타데이터 빌더
  - 페이지 쉘(breadcrumb + in_content 광고)은 플랫폼 도구 라우트가 렌더링하고, 이 모듈은 breadcrumb과 광고 사이의 모든 것을 렌더링합니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - CRITICAL 공정성: 균등 순열 우선(uniform-permutation-first) 생성(각 참가자→결과 = 1/N), 단순 랜덤 가로줄 방식 아님; 통계적으로 검증
    - 설정(Setup): 참가자 수 선택(2–10), 참가자 라벨(상단)·결과 라벨(하단) 편집
    - "결과 가리기" 모드(공개 전까지 결과를 "?"로 숨김) vs 보이기 모드
    - 유효한 사다리 무작위 생성(인접 가로줄 금지 불변식) 및 SVG 렌더링
    - 단일 참가자 공개(경로 추적 애니메이션); 전체 공개(stagger)
    - 다시 섞기(가로줄 재생성, 라벨 유지), 초기화(설정으로 복귀), 결과 복사
    - 결과 요약(참가자 → 결과 매핑) 및 aria-live 안내
    - 게임 전용 SEO 롱폼 콘텐츠("사다리 타기란?" / "사용 방법") + FAQ(FAQPage JSON-LD)
    - 키보드 단축키; 모션 감소(reduced-motion) 대체; 사운드 토글(기본 꺼짐)
  </in_scope>
  <out_of_scope>
    - 앱 쉘, 헤더/푸터, 로케일 스위처, 테마 토글 (플랫폼 담당)
    - 도구 레지스트리, sitemap/robots, 동의 배너, 광고 로딩 메커니즘 (플랫폼 담당)
    - 계정, 서버 영속화, 게임 기록 저장
  </out_of_scope>
  <future_considerations>
    - 공유 가능한 URL: {players, prizes, seed} 인코딩 → 링크가 동일한 사다리 + 결과를 재현 (Phase 2)
    - 공유 결과용 OG 이미지 생성 (Phase 2)
    - 결과별 리액션 / "당첨" 시 컨페티 (Phase 2)
    - 가로줄 밀도 가변 / "어려운" 사다리 옵션 (Phase 3)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl — 모두 플랫폼에서 상속</inherited>
  <module_specific>
    <randomness>공정성 셔플(Fisher–Yates)용 crypto.getRandomValues 기반 균등 RNG; 시드 PRNG(예: mulberry32)는 Phase 2 재현 가능 공유 링크에만 사용</randomness>
    <rendering>사다리 보드는 SVG(선명하고 stroke-dashoffset으로 애니메이션 가능)</rendering>
    <ids>일회성 참가자/결과 행 ID에 nanoid v5.1</ids>
    <validation>경계에서 URL 인코딩 공유 상태 검증에 zod v3.x (Phase 2)</validation>
    <animation>네이티브 CSS 트랜지션 + SVG stroke 애니메이션; 애니메이션 라이브러리 없음</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/
├── lib/
│   └── ladder.ts                  # 순수 엔진: uniformPermutation, ladderFromPermutation, tracePath, resolveAll (+ 공유 encode/decode, Phase 2)
├── components/tools/ladder/
│   ├── LadderGame.tsx             # 오케스트레이터 (Client Component) — 페이즈 머신
│   ├── LadderSetup.tsx            # 참가자 수 스테퍼 + 이름/결과 입력 + 결과 가리기 토글 + 빌드 CTA
│   ├── LadderBoard.tsx            # SVG 사다리 + 경로 추적 애니메이션
│   ├── PlayerHeader.tsx           # 클릭 가능한 참가자 칩(상단)
│   ├── PrizeCards.tsx             # 뒤집히는 결과 카드(하단)
│   ├── ResultPanel.tsx            # 전체 공개 / 다시 섞기 / 초기화 / 복사 / 요약
│   ├── LadderIntro.tsx            # H1 + 리드 (SEO)
│   ├── LadderHowTo.tsx            # 사다리 타기란? / 사용 방법 (SEO 롱폼)
│   ├── LadderFaq.tsx              # Q&A + FAQPage JSON-LD
│   └── useLadder.ts               # 순수 엔진 + 애니메이션/공개 상태를 감싸는 훅
└── i18n/messages/{ko,en}.json     # tools.ladder.* 키 (이 서비스가 추가)
</file_structure>

<core_data_entities>
  <ladder_game_state note="클라이언트 React 상태만; 서버에 영속화하지 않음">
    - playerCount: number (2–10, 기본 5)
    - players: { id: string; name: string }[] (길이 = playerCount; name 최대 12자; 공백 → "참가자 N")
    - prizes: { id: string; label: string }[] (길이 = playerCount; label 최대 12자; 공백 → 기본값 예: "꽝"/"당첨" 패턴)
    - rows: number (사다리 가로줄 레벨 수 = ladderFromPermutation이 생성한 레벨 수; 순열의 역위(inversion) 개수와 동일, 보기 좋은 최소 높이를 위해 상쇄용 미끼(decoy) 레벨을 선택적으로 추가; 보드는 맞춰 스케일/스크롤 — 고정 공식 아님)
    - rungs: boolean[][] (rungs[level][c] = 컬럼 c와 c+1 사이의 가로줄; c ∈ 0..playerCount-2)
    - permutation: number[] (공정성의 source of truth — perm[startCol] = prizeIndex, uniformPermutation에서 생성; 어떤 가로줄이 존재하기 전에 먼저 결정됨)
    - mapping: Record&lt;playerId, prizeId&gt; (`permutation`에서 파생; resolveAll(rungs)는 반드시 `permutation`과 일치 — 일관성 검사)
    - phase: enum (setup, ready, revealing, done)
    - revealedPlayers: Set&lt;playerId&gt;
    - hideResults: boolean (기본 true — 공개 전까지 결과를 "?"로 표시)
    - activeTrace: playerId | null (현재 애니메이션 중인 참가자)
    - soundOn: boolean (기본 false)
    INVARIANT 1 — 구조(STRUCTURAL): 어떤 가로줄 레벨에서도 인접한 두 컬럼이 동시에 가로줄을 갖지 않음(rungs[l][c] && rungs[l][c+1]는 금지) → 모든 노드는 가로 간선이 ≤ 1개 → 사다리는 유효한 일대일 대응(각 결과가 정확히 한 번씩 도달).
    INVARIANT 2 — 공정성(FAIRNESS) (CRITICAL): 참가자→결과 매핑은 균등(uniform) 무작위 순열(각 참가자→결과 확률 = 정확히 1/N; N!개 순열이 모두 동일 확률). 먼저 Fisher–Yates로 순열을 뽑고, 그 순열을 실현하도록 가로줄을 구성함으로써 보장 — 랜덤 가로줄이 "공정하길 기대"하는 방식 금지(그 방식은 가까운 칸으로 편향됨). 일관성: resolveAll(rungs)는 반드시 `permutation`과 일치.
  </ladder_game_state>
  <defaults>
    - 기본 참가자: "참가자 1..N" / "Player 1..N"
    - 기본 결과: 로케일별 패턴, 예: ["당첨", "꽝", "꽝", "꽝", ...]를 playerCount만큼 자름 (en: ["Win","Lose",...]) — 빌드 시점에 필드가 비어 있을 때만 사용
  </defaults>
</core_data_entities>

<component_hierarchy>
  <ladder_game>          <!-- "use client"; 페이즈 머신 + useLadder() 소유 -->
    <ladder_intro />     <!-- H1 + 리드 (가능하면 서버 사이드 렌더링) -->
    <ladder_setup>       <!-- phase: setup -->
      <stepper />        <!-- 참가자 수 2–10 -->
      <player_inputs />  <!-- 상단 라벨 -->
      <prize_inputs />   <!-- 하단 라벨 -->
      <toggle />         <!-- 결과 가리기 -->
      <build_button />   <!-- "사다리 만들기" -->
    </ladder_setup>
    <player_header />    <!-- phase: ready/revealing/done — 클릭 가능한 칩 -->
    <ladder_board />     <!-- SVG 사다리 + 추적 애니메이션 -->
    <prize_cards />      <!-- 뒤집히는 "?" → 결과 -->
    <result_panel />     <!-- 전체 공개 / 다시 섞기 / 초기화 / 복사 / 요약 -->
    <ladder_how_to />    <!-- SEO 롱폼 -->
    <ladder_faq />       <!-- FAQPage JSON-LD -->
  </ladder_game>
</component_hierarchy>

<pages_and_interfaces>
  <ladder_intro>
    - H1: "사다리 타기" / "Ladder Game" — Gmarket Sans clamp(28px,5vw,40px)/700
    - 리드: 1–2문장, 16px var(--text-secondary)
  </ladder_intro>

  <ladder_setup phase="setup">
    - 카드: var(--surface), radius var(--radius-xl), padding 24px, shadow --shadow-card
    - 참가자 수: 스테퍼 "참가자 수" — 값 2–10 기본 5; − / + 40px 버튼; 값 24px/700; 경계에서 버튼 비활성화
    - 2열(768px 미만에서 세로 스택): "참가자" 입력(상단)과 "결과" 입력(하단)
      - 각 행: TextInput 44px, rounded var(--radius-md), placeholder "참가자 1"/"결과 1", 최대 12자(한도 근처에서 카운터 표시)
      - 행별 색상 점(color-dot) 접두가 액센트 팔레트(coral→mint→sky→sun→grape→rose)를 순환하여 시각적 페어링
    - "결과 가리기" 토글 (기본 ON)
    - 주요 CTA: "사다리 만들기" / "Build ladder" — var(--brand), 48px, radius var(--radius-lg), hover --brand-strong + 리프트; 모바일에서 전체 폭
    - 카운트 동기화: 참가자 수 변경 시 기존 값을 유지하면서 행을 추가/제거
  </ladder_setup>

  <player_header phase="ready|revealing|done">
    - 사다리 컬럼에 정렬된 참가자 칩 행; 칩 = 액센트 틴트 알약형, 14px/600, 이름은 말줄임
    - 클릭 → 해당 참가자의 추적 시작(다른 추적 애니메이션 중에는 비활성화)
    - 공개된 칩은 체크 표시 + 액센트 테두리
    - a11y: 각 칩은 &lt;button&gt;, aria-label "{name} 결과 보기"
  </player_header>

  <ladder_board>
    - SVG, 반응형 viewBox, preserveAspectRatio; 세로줄 = playerCount, 균등 간격; 가로줄은 rungs[][]에서
    - 구조 stroke: var(--hairline-strong) 3px round cap; 추적 stroke: 참가자 액센트 4px
    - 추적 그리기: stroke-dasharray/offset로 280ms × 세그먼트 수 애니메이션, --ease-out; 도착 시 끝점 펄스(scale 1→1.3→1, 200ms)를 매칭된 결과 위에 표시
    - prefers-reduced-motion: 경로 즉시 렌더링, 펄스 없음
    - 최소 높이 320px; 모바일에서 컬럼 간격 ≥44px 유지(매우 좁은 화면에서 참가자 >7명이면 가로 스크롤)
    - role="img" + 서술형 aria-label; 장식 세그먼트는 aria-hidden
  </ladder_board>

  <prize_cards phase="ready|revealing|done">
    - 사다리 하단에 정렬된 행; 각 카드는 높이 56px 플립 카드, rounded var(--radius-md)
    - hideResults ON + 미공개: var(--surface-muted) 위에 "?" 가운데 정렬
    - 공개 시: rotateY 300ms 플립으로 도착한 참가자의 액센트로 틴트된 면을 표시, 라벨은 var(--text)
    - hideResults OFF: 라벨 처음부터 표시
  </prize_cards>

  <result_panel>
    - 첫 공개 후 나타남
    - "전체 결과 보기" / "Reveal all" — 보조 버튼; 남은 추적을 150ms 간격으로 stagger
    - "다시 섞기" / "Reshuffle" — 가로줄 재생성, 라벨 동일, 공개 초기화
    - "처음으로" / "Reset" — 설정으로 복귀(라벨 유지)
    - "결과 복사" / "Copy results" — 클립보드 텍스트 "참가자1 → 결과3 …" + 성공 토스트(error_handling의 클립보드 폴백 적용)
    - phase=done: 각 참가자 → 결과 매핑 요약 목록, 쌍마다 액센트 점
    - aria-live="polite": 각 공개를 안내 "{player}님의 결과는 {prize}입니다"
    - soundOn 토글: 공개 시 은은한 팝 사운드(기본 꺼짐)
  </result_panel>

  <ladder_how_to>
    - SEO 롱폼(로케일별): 헤딩 아래 "사다리 타기란?", "사용 방법"; 600–900자
  </ladder_how_to>
  <ladder_faq>
    - 3–5개 Q&A; 렌더링 + FAQPage JSON-LD로 방출. 반드시 "사다리타기는 공정한가요?" 포함 → 정직한 답변: 이 디지털 버전은 증명 가능하게 공정함(균등 셔플 → 시작 칸과 무관하게 각 참가자 정확히 1/N), 그리고 손으로 그린/가로줄이 적은 사다리는 가까운 결과로 편향됨("추악한 진실")을 설명; 추가로 "최대 몇 명까지 가능한가요?" (2–10), "시작 위치가 유리한가요?" (아니오 — 결과는 시작과 무관; "결과 가리기" + 사다리 숨김도 꼼수 차단)
  </ladder_faq>

  <keyboard_shortcuts_reference>
    - 설정: 마지막 입력에서 Enter → "사다리 만들기"
    - 준비(ready): 숫자키 1–9/0 → 해당 컬럼 참가자 공개; "a" → 전체 공개; "r" → 다시 섞기; Esc → 설정으로 복귀
    - 터치에서는 비활성(물리 키보드 없음)
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <ladder_engine>
    - uniformPermutation(n, rng): number[] — Fisher–Yates 균등 셔플; perm[startCol] = prizeIndex. 이것이 공정성을 보장(각 참가자→결과 = 정확히 1/N), 시각적 사다리와 무관.
    - ladderFromPermutation(perm, rng): boolean[][] — `perm`을 인접 transposition(버블 정렬 네트워크)으로 분해해 그것을 실현하는 가로줄을 구성, 레벨당 가로줄 1개; 결과를 바꾸지 않으면서 구조를 가리기 위해 상쇄되는 미끼 가로줄 쌍을 선택적으로 섞어 넣음. 인접 금지 구조 불변식 준수.
    - tracePath(rungs, startCol): { col, level }[] — 애니메이션용 전체 세그먼트 경로를 만드는 결정적(deterministic) 워크
    - resolveAll(rungs, cols): number[] — startCol별 endCol; dev에서 반드시 `perm`과 일치(일관성)하고 순열이어야 함
    - rng 주입 가능: 기본은 crypto 기반 균등; 테스트 + Phase 2 공유용 시드 PRNG
  </ladder_engine>
  <reveal_flow>
    - 단일: 칩/숫자 클릭 → 추적 애니메이션 → 매칭 결과 카드 플립 → 공개 표시 → 안내
    - 전체: 남은 것 stagger; 애니메이션 중 입력 비활성화; 모두 공개되면 phase → done
    - 다시 섞기는 라벨 + 인원 유지; 초기화는 설정으로 복귀
  </reveal_flow>
  <sharing>
    - "결과 복사"는 평문 매핑을 복사
    - Phase 2: lib/ladder.ts가 {players, prizes, seed}를 URL로 encode/decode(zod 검증 decode)하여 정확한 사다리를 재현
  </sharing>
  <i18n>모든 문자열은 tools.ladder.*(ko/en)에서; 기본 라벨 로케일화; 하드코딩 카피 없음</i18n>
</core_functionality>

<error_handling>
  <form_validation>
    - 라벨 최대 12자(하드 캡), 한도에서 "12/12" 카운터
    - 공백 라벨 허용 → 빌드 시점에 기본값으로 자동 채움(사용자를 절대 막지 않음)
    - 참가자 수는 스테퍼에서 2–10으로 클램프
  </form_validation>
  <runtime>
    <clipboard>navigator.clipboard 사용 불가(비보안 컨텍스트)일 수 있음 → 숨김 textarea + execCommand 폴백 → 둘 다 실패하면 모달에 텍스트를 띄워 수동 복사</clipboard>
    <share_decode>잘못된 공유 파라미터는 zod 검증 실패 → 무시하고 새 설정으로 시작, 크래시 없음 (Phase 2)</share_decode>
    <error_boundary>플랫폼이 도구 모듈을 Error Boundary로 감쌈; 렌더 실패 시 쉘을 크래시하지 않고 재시도 표시</error_boundary>
  </runtime>
  <note>이 모듈에는 1st-party 네트워크 요청이 없음.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md가 모든 토큰의 단일 소스. 아래는 게임 전용 적용 사항.</source>
  <accent_usage>
    - 카테고리 액센트는 coral이지만, 각 참가자에게 coral→mint→sky→sun→grape→rose를 순환해 액센트를 배정
    - 참가자의 칩 틴트, 추적 선 색, 도착한 결과 카드의 면이 모두 그 참가자의 액센트를 공유 — 색이 참가자 → 경로 → 결과를 묶음
    - CTA("사다리 만들기", "전체 결과 보기")는 브랜드 허니골드 유지; 액센트는 정체성 표시용일 뿐
  </accent_usage>
  <board>SVG 구조는 var(--hairline-strong) 3px; 추적 4px 참가자 액센트; 결과 카드는 rotateY 300ms 플립; "?"는 var(--surface-muted)</board>
  <motion>transform / opacity / stroke-dashoffset만 사용; --ease-out cubic-bezier(0.16,1,0.3,1); 지속시간 150/250/350ms; 모두 prefers-reduced-motion으로 게이팅(즉시 경로, 크로스페이드 플립)</motion>
  <accessibility>SVG role/aria-label; 공개는 aria-live="polite"; 완전한 키보드 조작; ≥44px 탭 타깃; 가시적 focus-visible 링</accessibility>
  <responsive>설정 열은 768px 미만에서 세로 스택; 보드 컬럼은 ≥44px 간격 유지, 좁은 화면에서 참가자 >7명이면 가로 스크롤</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>참가자/결과 라벨은 텍스트로 렌더링(React가 이스케이프); dangerouslySetInnerHTML 절대 금지</input>
  <share_validation>CRITICAL (Phase 2): URL 인코딩 공유 상태는 경계를 가진 엄격한 zod 스키마로 파싱(playerCount 2–10, 라벨 길이 ≤12, 배열 길이 일치); 실패 시 거부 + 무시</share_validation>
  <note>비밀값 없음; 네트워크 호출 없음; 사용자가 명시적으로 복사/공유하지 않는 한 입력값은 브라우저를 벗어나지 않음</note>
</security_considerations>

<advanced_functionality>
  <shareable_ladder optional="true">Phase 2: 시드 PRNG가 동일한 uniformPermutation에 공급됨(여전히 균등/공정 — 시드는 재현성만 부여하며 편향을 만들지 않음) + URL encode/decode가 열 때 동일한 사다리 + 결과를 재현</shareable_ladder>
  <sound>공개 시 은은한 팝 사운드 옵션; ResultPanel에서 토글; 기본 꺼짐; reduced-motion 존중(사운드 결합 불필요)</sound>
  <reduced_motion>추적 그리기, 끝점 펄스, 결과 플립 전반에 적용</reduced_motion>
  <fairness_transparency>How-To/FAQ에서 디지털 게임이 균등/공정함(각 참가자 1/N, 시작과 무관)을 정직하게 설명하고 편향된 손그림 사다리와 대비 — 잘 알려진 "사다리타기는 불공정하다 / 추악한 진실" 비판에 직접 답하고 사용자 신뢰를 형성</fairness_transparency>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>결과 가린 상태로 전체 게임 진행</description>
    <steps>
      1. /ko/tools/ladder에서 설정 카드 확인: 참가자 수 기본 5, "결과 가리기" ON
      2. + 두 번 클릭 → 참가자 6행, 결과 6행; 기존 값 유지
      3. 이름 "민수,영희,철수,지은,현우,수빈", 결과 "꽝,커피,꽝,당첨,꽝,청소" 입력
      4. "사다리 만들기" 클릭 → SVG가 세로줄 6개 + 유효한 가로줄 렌더(어느 레벨에도 인접한 두 가로줄 없음)
      5. 모든 결과 카드가 "?"로 표시되는지 확인(가린 모드)
      6. 칩 "영희" 클릭 → 색상 경로가 영희 컬럼 → 결과로 애니메이션; 해당 카드 플립; aria-live가 결과 안내
      7. 애니메이션 중 다른 칩 클릭은 현재 추적이 끝날 때까지 차단
      8. "전체 결과 보기" 클릭 → 남은 경로가 stagger로 공개; phase → done
      9. 각 결과가 정확히 한 번씩 도달(bijection)되고 요약 매핑이 표시되는지 확인
      10. "결과 복사" 클릭 → 클립보드에 참가자→결과 텍스트; 성공 토스트
      11. "다시 섞기" 클릭 → 새 사다리, 동일 라벨, 공개 초기화
      12. "처음으로" 클릭 → 라벨 유지한 채 설정으로 복귀
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>결과 보이기 모드 + 경계 인원</description>
    <steps>
      1. 설정에서 "결과 가리기" OFF → 빌드 → 결과 라벨이 즉시 표시("?" 없음)
      2. 초기화; 참가자 수를 최소 2로 → 2에서 − 비활성 확인; 빌드 → 2컬럼, 유효한 단일/0 가로줄
      3. 초기화; 최대 10으로 → 10에서 + 비활성 확인; 빌드 → 10컬럼 렌더; 360px 뷰포트에서 가로 스크롤이 컬럼 간격 ≥44px 유지하는지 확인
      4. 일부 라벨을 비운 채 → 빌드 → 빈칸이 로케일 기본값으로 자동 채움
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>i18n, 키보드, reduced-motion</description>
    <steps>
      1. 로케일을 /en으로 전환 → 모든 게임 UI + 기본 라벨이 영어로
      2. 사다리 빌드; 숫자키 "2" → 2번 컬럼 참가자를 추적과 함께 공개
      3. "a" → 전체 공개; "r" → 다시 섞기
      4. OS reduced-motion 활성화 → 새로고침 → 공개: 경로 즉시 렌더, 결과는 크로스페이드(rotateY/펄스 없음)
      5. aria-live가 각 공개를 안내하는지 확인
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>도구 페이지 SEO</description>
    <steps>
      1. 프로덕션 빌드 → /ko/tools/ladder, /en/tools/ladder 정적 생성
      2. 각 페이지에 고유 title, meta description, canonical, hreflang alternate, OG, SoftwareApplication + FAQPage JSON-LD
      3. How-to + FAQ 콘텐츠 존재 및 로케일화
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>공정성 — 균등 분포 ("추악한 진실" 가드)</description>
    <steps>
      1. 단위: N 2..10 각각에 대해 시드 RNG로 uniformPermutation을 10만 회 실행 → start→prize 카운트를 N×N 행렬로 집계
      2. 모든 셀이 totalRuns/N의 ±1% 이내이고 카이제곱 적합도 p > 0.01인지 단언(분포가 균등, 중앙 편향 아님)
      3. 모든 시작 컬럼이 가장 먼 반대편 컬럼을 포함해 모든 결과에 최소 1회 도달하는지 단언(도달 불가 끝점 없음)
      4. 샘플링한 각 perm에 대해 ladderFromPermutation(perm) 빌드 → resolveAll(rungs) === perm 단언(시각 사다리가 공정한 결과를 정확히 실현)
      5. UI: "결과 가리기" ON에서 빌드 전 결과·사다리가 위치 힌트를 전혀 드러내지 않는지 확인 → 시작 컬럼 선택으로 꼼수 불가
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <fairness>CRITICAL: N∈{2..10}마다 ≥10만 회 시행에서, 경험적 P(start i → prize j)가 1/N의 ±1% 이내; 카이제곱 적합도 p &gt; 0.01; 모든 시작이 가장 먼 컬럼을 포함해 모든 결과에 도달(full support, 중앙 편향 아님). 공정성은 시작 컬럼 및 가리기/보이기 모드와 무관.</fairness>
  <functionality>균등 순열 우선 생성; resolveAll(rungs)가 선택된 순열과 일치하며 bijection; 구조적 인접 금지 불변식; tracePath가 렌더 경로와 정확히 일치; 단일 + 전체 공개 플로우; 가리기/보이기 모드; 다시 섞기/초기화/복사; 키보드 단축키</functionality>
  <user_experience>빌드 클릭 → 보드 표시 &lt; 100ms; 추적 애니메이션 60fps 부드러움; 공개 지연 체감 불가; ≥44px 타깃; 가시적 포커스</user_experience>
  <technical_quality>lib/ladder.ts 순수 함수 단위 커버리지 ≥ 80%(불변식, bijection, 추적 정확성, 시드 재현성); TS 에러 0; 800줄 초과 파일 없음</technical_quality>
  <visual_design>DESIGN.md 준수; 참가자별 액센트가 칩↔추적↔결과를 묶음; CTA는 브랜드 허니골드 유지</visual_design>
  <accessibility>키보드 완전 조작; aria-live 공개; reduced-motion 존중; SVG 라벨링; WCAG 2.1 AA 대비</accessibility>
</success_criteria>

<build_output>
  <note>플랫폼의 일부로 빌드(pnpm build). 도구 페이지 /[locale]/tools/ladder는 플랫폼의 generateStaticParams가 레지스트리를 순회해 사전 렌더링.</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. 공정성 엔진 — uniformPermutation 먼저, 그다음 ladderFromPermutation; 어떤 시각 작업보다 먼저 카이제곱 테스트로 균등성을 증명. 공정성을 랜덤 가로줄에 의존하지 말 것.
    2. lib/ladder.ts 순수 엔진 전반 — 모든 시각 요소가 이에 의존
    3. SVG 보드 + tracePath 정합 — 렌더 경로가 엔진 경로와 반드시 일치(resolveAll === perm)
    4. LadderGame의 페이즈 머신(setup → ready → revealing → done) + 애니메이션 잠금
  </critical_paths>
  <recommended_implementation_order>
    1. lib/ladder.ts — uniformPermutation(Fisher–Yates, crypto rng) + ladderFromPermutation + trace/resolve + 카이제곱 공정성 테스트 포함한 Vitest(RED→GREEN); 재현성을 위한 시드 가능 rng
    2. tools.ladder.* 메시지(ko/en) — 기본 라벨, how-to, FAQ 포함
    3. LadderSetup(스테퍼 + 입력 + 토글 + 카운트 동기화 + 빌드)
    4. LadderBoard SVG(rungs로부터 정적 렌더) + 컬럼/행 지오메트리
    5. 추적 애니메이션(stroke-dashoffset) + PlayerHeader 칩 + PrizeCards 플립
    6. ResultPanel(전체 공개/다시 섞기/초기화/복사/요약) + aria-live
    7. 키보드 단축키; reduced-motion 폴백; 사운드 토글
    8. LadderIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD(플랫폼 lib/seo.ts 사용)
    9. Phase 2: 공유 가능 URL(encode/decode + zod)
  </recommended_implementation_order>
  <ladder_algorithm>
    ```typescript
    // src/lib/ladder.ts — 공정성 우선(FAIRNESS-FIRST), 순수 함수, 주입 가능한 rng.
    type Rng = () => number; // [0,1) 균등

    // 기본 비편향(UNBIASED) rng. (시드 PRNG는 Phase 2 공유 링크에만 사용.)
    export const cryptoRng: Rng = () => {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] / 2 ** 32;
    };

    // 1) 공정성: 균등 순열을 먼저 선택. perm[startCol] = prizeIndex.
    //    각 참가자→결과 확률은 시작 컬럼과 무관하게 정확히 1/N.
    export function uniformPermutation(n: number, rng: Rng = cryptoRng): number[] {
      const p = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1)); // Fisher–Yates
        [p[i], p[j]] = [p[j], p[i]];
      }
      return p;
    }

    // 2) 시각: 인접 transposition으로 `perm`을 실현하는 가로줄을 구성.
    //    perm 복사본을 항등(identity)으로 버블 정렬하며 각 인접 교환 (c,c+1)을
    //    가로줄 레벨 하나로 기록. 결과 사다리는 tracePath(s) === perm[s]를 만족.
    //    (검증됨: 예 perm=[2,0,1] → rungs=[[t,f],[f,t]] → trace = [2,0,1].)
    export function ladderFromPermutation(perm: number[], rng: Rng = cryptoRng): boolean[][] {
      const n = perm.length;
      const arr = perm.slice();          // arr[col] = 이 컬럼이 도달해야 할 prizeIndex
      const rungs: boolean[][] = [];
      for (let pass = 0; pass < n; pass++) {
        for (let c = 0; c < n - 1; c++) {
          if (arr[c] > arr[c + 1]) {
            [arr[c], arr[c + 1]] = [arr[c + 1], arr[c]];
            const level = new Array(n - 1).fill(false);
            level[c] = true;             // 레벨당 가로줄 1개 → 인접 금지 불변식 자동 충족
            rungs.push(level);
          }
        }
      }
      // (선택) 시각적 풍성함을 위해 상쇄되는 미끼 가로줄 쌍을 섞어 넣기 — 결과는 바뀌지 않음.
      return rungs;
    }

    export function tracePath(rungs: boolean[][], startCol: number) {
      const path = [{ col: startCol, level: 0 }];
      let c = startCol;
      for (let l = 0; l < rungs.length; l++) {
        if (c < rungs[l].length && rungs[l][c]) c += 1;       // 오른쪽 가로줄
        else if (c > 0 && rungs[l][c - 1]) c -= 1;            // 왼쪽 가로줄
        path.push({ col: c, level: l + 1 });
      }
      return path; // 마지막 항목의 col = 결과 인덱스
    }

    export function resolveAll(rungs: boolean[][], cols: number): number[] {
      const out: number[] = [];
      for (let s = 0; s < cols; s++) out.push(tracePath(rungs, s).at(-1)!.col);
      // dev: out은 ladderFromPermutation에 전달한 perm과 반드시 일치하며 0..cols-1의 순열이어야 함
      return out;
    }
    ```
  </ladder_algorithm>
  <testing_strategy>
    - 단위(Vitest): 공정성 — uniformPermutation이 cols 2..10에 대해 ≥10만 회 시행에서 카이제곱 균등성(1/N의 ±1% 이내, p &gt; 0.01) 통과, full support(가장 먼 컬럼 도달); ladderFromPermutation이 perm을 정확히 실현(resolveAll === perm); 구조적 인접 금지 불변식; tracePath 끝점 == resolveAll; 시드 재현성
    - 컴포넌트: 스테퍼 경계, 카운트 동기화 시 값 유지, 가리기/보이기 모드, 클립보드 폴백
    - E2E(Playwright): 시나리오 1–3; 보드 시각 회귀 320/768/1024, 양 테마
    - A11y: axe + 키보드 공개 + aria-live + reduced-motion
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
