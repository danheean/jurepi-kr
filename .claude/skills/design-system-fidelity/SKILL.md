---
name: design-system-fidelity
description: Jurepi의 DESIGN.md 디자인 시스템을 충실히 구현하는 방법. CSS 커스텀 프로퍼티 토큰(브랜드 바이올렛 + 6 액센트), Gmarket Sans/Pretendard 페어링, soft brand-tinted shadow 깊이, 카테고리 액센트 정체성, 디자인된 hover/press/focus 상태, anti-template 규율, 접근성(WCAG 2.1 AA)·반응형. UI 컴포넌트·스타일·토큰·애니메이션·시각 구현 시 반드시 사용.
---

# Design System Fidelity — Jurepi DESIGN.md 충실 구현

`docs/DESIGN.md`가 **시각의 단일 소스**다. 이 스킬은 그것을 코드로 옮길 때의 규율이다. 목표: 기본 템플릿이 아니라 *의도된, 제품 고유의* UI. DESIGN.md의 토큰 값/컴포넌트 사양은 항상 그 파일을 직접 참조한다(여기에 복제하지 않는다).

## 토큰을 코드로 (CSS 커스텀 프로퍼티)

- 색/타이포/간격/라운드/그림자를 **하드코딩하지 않는다.** `src/styles/tokens.css`에 CSS 변수로 정의하고 Tailwind v4 테마가 소비한다. `tokens.css` ↔ DESIGN.md는 1:1.
- 예: `--brand: #6c5ce7`, `--surface-muted: #f5f3fc`, 액센트 `*-soft` 쌍, `--shadow-card`/`--shadow-card-hover`/`--shadow-pop`, `--radius-xl: 20px`, `--ease-out: cubic-bezier(0.16,1,0.3,1)`.
- 컴포넌트는 토큰 변수만 참조. 값이 DESIGN.md에 없으면 추측해 새 값을 만들지 말고 리더에게 확인.
- **Tailwind v4는 v3 config를 `@config`로 명시 로드해야 토큰 유틸이 생성된다.** 누락 시 `.bg-surface` 등이 조용히 미생성된다(빌드는 그린). 토큰을 썼는데 화면이 무스타일이면 빌드 CSS에서 토큰 유틸 존재부터 확인. 상세는 `nextjs-ssg-platform`.
- **spacing 토큰을 t-shirt명(`sm/md/lg/xl`)으로 정의하면 v4에서 `max-w-md`가 spacing(16px)로 해석돼 레이아웃이 깨진다**(실제 발생: 히어로 부제목이 1글자 폭). 너비/최대너비는 충돌을 피해 임의값(`max-w-[540px]`)이나 전용 토큰(`max-w-container`)을 쓴다. **재발 주의**(speed-quiz GameSetup 패널·키보드 오버레이가 `max-w-md`=16px로 세로 한 글자씩 붕괴) — 모달/패널/떠 있는 레이어에 `max-w-{sm,md,lg,xl}` 절대 금지, 항상 `max-w-[32rem]` 류 임의값.
- **존재하는 토큰만 쓴다 — 만들어낸 토큰명/불완전 유틸은 조용히 `transparent`로 렌더된다.** `bg-surface-secondary`(미존재)·`bg-accent`(컬러 접미사 누락; 액센트는 `bg-accent-coral` 등)는 매칭 실패 → 투명. 세그먼트/선택 컨트롤의 **활성 버튼**에 이런 토큰 + `text-white`를 쓰면 *흰 글자 on 투명(=흰 카드)* 으로 **안 보인다**(실제: 긴장도 '높음' 버튼이 사라짐 — 유닛·E2E는 `aria-pressed`만 봐서 전부 그린). 새 className 토큰은 `tokens.css`/`globals.css`에 실재하는지 확인하고, 선택 상태는 검증된 토큰을 재사용한다(활성 `bg-brand text-on-brand`, 비활성 `bg-surface-muted border-hairline`). **선택/활성 상태는 `aria-pressed`만이 아니라 시각적으로 뚜렷이 구분**돼야 하며 열어서 눈으로 확인한다.

## Jurepi 시각 정체성 (반드시 드러나야 함)

DESIGN.md의 핵심 4가지를 모든 화면이 보여야 한다(design-quality 규칙의 "최소 4개" 충족):

1. **Light-first 흰 카드 시스템** — 흰 바탕, 흰 카드, 옅은 라벤더 섹션. 깊이는 **soft brand-tinted shadow**로, 어두운 표면/굵은 보더로가 아니라.
2. **카테고리별 액센트 정체성** — coral/mint/sky/sun/grape/rose. 각 도구 카드의 아이콘 타일·뱃지 틴트가 카테고리 액센트. 사다리에선 플레이어별 액센트가 칩↔trace↔상품 면을 잇는다.
3. **하나의 브랜드 바이올렛 = 액션** — CTA·링크·focus·워드마크는 항상 `--brand`. **액센트를 CTA 색으로 쓰면 위반**(coral "사다리 만들기" 버튼 금지). 액센트 = 정체성, 바이올렛 = 행동.
4. **Gmarket Sans(디스플레이 700, tight) × Pretendard(본문 500/600, relaxed)** — 둥근 디스플레이 vs 중립 본문의 대비가 곧 보이스. 세 번째 폰트 금지. Gmarket Sans를 본문에 쓰지 않는다.

## 인터랙션은 설계물이다

- 모든 상호작용 요소에 **hover / press / focus-visible** 상태를 디자인한다.
- 카드(live): hover `translateY(-4px)` + `--shadow-card-hover` + border `--brand-soft`(200ms `--ease-out`); press `translateY(-1px) scale(0.99)`; focus-visible 2px `--brand` 링 offset 2px.
- coming_soon: opacity 0.7, hover lift 없음, cursor default, 준비중 뱃지.
- 버튼/칩/카드 전체가 클릭 타깃.

## 오버레이/팝오버/확장 입력 (떠 있는 레이어)

드롭다운·콤보박스·검색 패널처럼 트리거에서 펼쳐지는 레이어는 **너비를 스스로 선언**해야 한다.

- **금지: 트리거 래퍼에 폭을 의존.** 아이콘 버튼을 감싼 `relative` 래퍼는 컨텐츠 폭(아이콘 ~40px)이거나 열림 시 트리거를 언마운트하면 0-width다. 그 안에서 `absolute left-0 right-0`로 늘리면 입력/패널이 **아이콘 폭으로 붕괴**한다(실제: 헤더 검색 입력 26px, 유닛·타입·axe는 전부 그린이었다).
- **패턴: 명시적 너비 + 엣지 앵커 + 화면 밖 방지.** 우측 헤더 컨트롤이면 `absolute top-0 right-0 w-[280px] max-w-[calc(100vw-1.5rem)]`; 내부 input/panel은 `w-full`. 헤더(z-40) 위로 `z-50`.
- **모바일에서 좌측으로 넘쳐 잘리지 않게** `max-w-[calc(100vw-여백)]`으로 클램프.
- **전체화면 게임/프레젠터 오버레이는 헤더(z-40) 위로 `z-50`.** speed-quiz 보드가 `fixed inset-0`인데 z 미지정이라 sticky 헤더가 상단 타이머를 가렸다 — `fixed inset-0 z-50`으로 헤더 위 전체를 덮는다(Esc/종료로 이탈).
- **프레젠테이션(presentational) 리프 컴포넌트는 `window`/`document` 전역 리스너를 달지 않는다.** 키보드·전역 단축키는 오케스트레이터/훅이 소유하고 리프는 props 콜백만 호출한다. speed-quiz GameBoard가 오케스트레이터와 **중복 `keydown`을 등록**해 잠재 이중발화(현상은 단발이었으나 취약·계약 위반) — 리프에서 리스너 제거, 키보드는 단일 소유자.
- 완료 전 **열린 상태를 실제로 띄워 너비를 눈으로 확인**한다(존재 검사로는 붕괴를 못 본다 — `integration-qa`의 boundingBox 게이트와 짝).

## 크롤 가능 카드/링크 (SEO 스포크) — 가시 콘텐츠를 숨기지 말 것

카드를 검색 크롤용 링크로 만들 땐(허브→스포크 내부 링크), **카드 루트 자체를 *가시* `<a href>`로** 삼는다. onClick에서 평범한 클릭이면 `e.preventDefault()`→SPA 콜백(수식/보조 클릭은 통과시켜 새 탭 허용).

- **금지: 가시 콘텐츠를 `hidden`(=`display:none`) 요소로 감싸기.** 크롤 링크를 넣겠다고 카드 본문(용어명·정의·태그)을 `<a className="hidden">` 안에 넣으면 **화면 카드가 통째로 비어버린다**(실제: new-word TermCard — 크롤러엔 href 보이나 사용자 화면은 빈 카드. tsc·유닛·빌드·프리렌더 grep 전부 그린, 전체 E2E `toBeVisible` "element is not visible"로만 적발). 링크는 숨기는 게 아니라 **보이는 카드 그 자체**여야 한다.
- **인터랙티브 자식은 앵커 밖 형제로.** 즐겨찾기 버튼 등은 `<a>` 안에 넣으면 무효 HTML(button-in-anchor) — `relative` 래퍼에 앵커와 버튼을 형제로 두고 버튼을 `absolute` 배치, `onClick`은 `stopPropagation`+`preventDefault`.
- 완료 전 **렌더된 카드를 실제로 띄워(스크린샷/a11y 트리) 본문이 보이는지** 확인 — DOM 존재(`getByText`)는 `display:none`을 통과시킨다(`jurepi-tdd` 참조).

## anti-template 규율 (banned)

- 위계 없는 균일 카드 그리드, 균일 패딩/라운드/그림자 도배 금지.
- 회색-온-화이트 + 장식용 액센트 하나로 때우기 금지.
- 라이브러리 기본값 그대로 노출 금지.
- 하드 1px 보더를 주 elevation 수단으로 쓰기 금지(soft shadow 사용).
- 다크 모드 자동 기본값 금지 — Jurepi는 light-first, 다크는 Phase 2 토글.

## 모션

- transform/opacity/clip-path/stroke-dashoffset만. width/height/top/left/margin/font-size 애니메이션 금지.
- `--ease-out` = cubic-bezier(0.16,1,0.3,1); 150/250/350ms.
- 사다리 trace = stroke-dashoffset draw; prize flip = rotateY 300ms; 카드 lift = translateY.
- **`prefers-reduced-motion` 폴백 필수**: trace 즉시 렌더, prize 크로스페이드, 카드 transform 없이 그림자만.
- `will-change`는 좁게 쓰고 끝나면 제거.

## 접근성 (WCAG 2.1 AA)

- 시맨틱 `header/main/footer/nav`, 1페이지 1 H1, 올바른 `html lang` + hreflang.
- focus-visible 링 가시, 터치 타깃 ≥44px.
- 색대비 ≥4.5:1(본문)/≥3:1(대형). 새 색 조합 도입 시 검증.
- 키보드 완전 조작; SVG `role="img"` + 서술적 aria-label, 장식 세그먼트 aria-hidden; 결과 발표 `aria-live="polite"`.
- 텍스트 색은 순수 검정(#000) 금지 — `--text`(#1e1b3a) 사용.

## 반응형

- 카드 그리드 4-up(≥1024) → 3-up(768) → 2-up(480) → 1-up(<480), gap 20px, 컨테이너 1120px.
- 히어로 H1 `clamp(32px,6vw,56px)`; 도구 H1 `clamp(28px,5vw,40px)`.
- 사다리 보드: 컬럼 ≥44px gap, >7명 좁은 화면은 가로 스크롤(컬럼 짜부 금지).
- 320/375/768/1024/1440/1920 검증, overflow 없음.

## 체크리스트 (컴포넌트 완료 전)

- [ ] 기본 Tailwind/shadcn 템플릿처럼 보이지 않는가
- [ ] hover/press/focus-visible가 의도적으로 설계됐는가
- [ ] 균일 강조가 아니라 위계가 있는가
- [ ] 토큰을 하드코딩하지 않고 CSS 변수로 소비하는가
- [ ] 새로 쓴 토큰/유틸이 실제로 존재하는가(미존재 토큰은 투명 렌더), 선택/활성 상태가 aria뿐 아니라 시각적으로 뚜렷한가 — **반환 전 grep 하드 게이트**: 변경 파일의 `(bg|text|border|ring|from|to|fill)-<name>` 클래스를 `tailwind.config.ts`의 color/토큰 키와 대조하라. 미존재=팬텀=투명(typecheck·유닛·빌드 모두 그린이라 못 잡음). 실제 재발: `bg-surface-hover`/`hover:bg-surface-hover`는 **존재하지 않는다**(3회째 팬텀). muted 표면 hover는 실재 토큰 `hover:bg-surface-sunken`을 쓴다. **시맨틱 색은 `danger`/`warning`/`success`(+`-ink` 고대비 변형)이지 `semantic-*`가 아니다** — `bg-semantic-warning`/`text-semantic-danger`/`bg-semantic-success`는 전부 팬텀(url-encoder에서 14곳 재발). 텍스트는 `text-danger-ink`/`text-warning-ink`, 배경/보더는 `bg-danger`/`bg-warning`/`bg-success`. `color-tokens.test`(scripts/validate-color-tokens.mjs)가 이를 잡으니 반환 전 반드시 실행. **팬텀 신변형(4회째 재발군): 커스텀 시맨틱 토큰에 Tailwind 팔레트 접미사를 붙인 `danger-50`/`danger-200`/`danger-900`도 전부 팬텀이다**(transparent-background에서 에러 배너가 투명 렌더 위험) — 실토큰은 `danger`/`danger-ink`뿐이고 농도는 **슬래시 opacity**로 만든다(에러 배너 관례: `bg-danger/10 border border-danger/30 text-danger-ink`, lunar-converter ErrorMessage 미러). 역방향 함정: **Tailwind 기본 팔레트(`gray-200`·`sky-500`·`red-50`·`text-white`)는 가드가 유효 토큰으로 허용해 통과하지만 디자인 시스템 위반이다**(렌더는 되나 시스템 밖 색) — 시스템 토큰(`surface-muted`·`accent-sky-soft`·`text-on-brand` 등)으로만 쓰고, 기본 팔레트 사용은 grep(`gray-\d|sky-\d|red-\d|blue-\d|text-white`)으로 반환 전 자체 검출한다. **실행 규율: 가드는 돌려야 잡는다** — 도구 디렉토리만 스코프한 `vitest run src/components/tools/<slug>`는 전역 가드(`src/__test__/color-tokens.test.ts`)를 **우회**하므로, 색/토큰 클래스를 만진 뒤에는 `npx vitest run src/__test__`(전역 가드 스위트)를 반드시 함께 실행한다(실제: transparent-background 팬텀 4종이 스코프 실행만으로 그린처럼 보였고 가드는 잡을 수 있었다 — 안 돌렸을 뿐).
- [ ] **인라인 스타일/서드파티 SDK 주입 HTML의 `var(--토큰)` 문자열도 팬텀 검사를 했는가** — Tailwind 클래스 가드(`color-tokens.test`)는 인라인 `style="background-color: var(--accent)"` 같은 CSS 변수 참조를 **스캔하지 않는다**. 미존재 변수는 조용히 빈 값=투명 렌더(restaurant-map: NAVER 지도 마커 배경이 팬텀 `var(--accent)`로 투명 → 마커가 사실상 안 보여 사용자가 "지도 무응답"으로 인식; tsc·유닛·빌드·E2E 전부 그린). 액센트 변수의 실명은 `--accent-{coral,mint,sky,sun,grape,rose}`(카테고리별)이지 `--accent`가 아니다. 반환 전 변경 파일의 `var(--` 를 grep해 `globals.css` 정의와 대조하고, 지도/캔버스/SDK 주입 표면은 렌더된 화면에서 색이 실제 보이는지 확인한다(`getComputedStyle(...).backgroundColor`가 `rgba(0,0,0,0)`이면 팬텀).
- [ ] **빈 상태(empty state)는 컨텍스트별로 분기했고, 필터/검색 무결과에는 탈출 액션이 있는가** — 무결과 상황에 엉뚱한 온보딩 문구(즐겨찾기 안내 등)가 뜨면 사용자는 **오류로 인식**한다(restaurant-map '기타' 클릭 → "별을 눌러 즐겨찾기를 저장하세요"+내 위치 버튼 → 오류 신고로 이어짐). 규칙: ① 필터/검색 무결과 = "조건에 맞는 결과 없음" + **필터 초기화** 버튼 ② 탭 고유 빈 상태(즐겨찾기/최근)는 그 탭의 온보딩 문구 ③ 애초에 결과가 0일 수밖에 없는 필터(데이터에 없는 카테고리)는 **렌더하지 않는다**(카탈로그 파생, RegionTabs 패턴).
- [ ] 액센트를 CTA에 쓰지 않았는가(브랜드 바이올렛 유지)
- [ ] reduced-motion 폴백이 있는가
- [ ] 떠 있는 레이어(드롭다운/콤보박스/패널)는 명시적 너비 + 엣지 앵커이고, 열어서 너비를 눈으로 확인했는가
- [ ] 실제 제품 스크린샷처럼 믿을 만한가
