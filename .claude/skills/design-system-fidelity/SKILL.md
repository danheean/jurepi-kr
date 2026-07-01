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
- **spacing 토큰을 t-shirt명(`sm/md/lg/xl`)으로 정의하면 v4에서 `max-w-md`가 spacing(16px)로 해석돼 레이아웃이 깨진다**(실제 발생: 히어로 부제목이 1글자 폭). 너비/최대너비는 충돌을 피해 임의값(`max-w-[540px]`)이나 전용 토큰(`max-w-container`)을 쓴다.
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
- 완료 전 **열린 상태를 실제로 띄워 너비를 눈으로 확인**한다(존재 검사로는 붕괴를 못 본다 — `integration-qa`의 boundingBox 게이트와 짝).

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
- [ ] 새로 쓴 토큰/유틸이 실제로 존재하는가(미존재 토큰은 투명 렌더), 선택/활성 상태가 aria뿐 아니라 시각적으로 뚜렷한가 — **반환 전 grep 하드 게이트**: 변경 파일의 `(bg|text|border|ring|from|to|fill)-<name>` 클래스를 `tailwind.config.ts`의 color/토큰 키와 대조하라. 미존재=팬텀=투명(typecheck·유닛·빌드 모두 그린이라 못 잡음). 실제 재발: `bg-surface-hover`/`hover:bg-surface-hover`는 **존재하지 않는다**(3회째 팬텀). muted 표면 hover는 실재 토큰 `hover:bg-surface-sunken`을 쓴다.
- [ ] 액센트를 CTA에 쓰지 않았는가(브랜드 바이올렛 유지)
- [ ] reduced-motion 폴백이 있는가
- [ ] 떠 있는 레이어(드롭다운/콤보박스/패널)는 명시적 너비 + 엣지 앵커이고, 열어서 너비를 눈으로 확인했는가
- [ ] 실제 제품 스크린샷처럼 믿을 만한가
