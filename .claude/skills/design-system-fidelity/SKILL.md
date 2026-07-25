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
- **토큰의 색을 *보여주는* UI(스와치 픽커·색 미리보기·범례·팔레트)는 그 토큰을 읽어라 — hex를 재하드코딩하면 tokens.css와 조용히 드리프트한다.** color-tokens 가드는 팬텀 *Tailwind 클래스*를 잡지만, `style={{backgroundColor:'#a78bfa'}}`처럼 **토큰 값을 복제한 인라인 hex**는 못 잡는다(가드 사각). 실제: cheer 색 픽커가 grape를 `#a78bfa`(보라)로 하드코딩했는데 배너는 `text-accent-grape`(`--accent-grape` #e0912b 허니)로 렌더 → **"고른 색 ≠ 뜨는 색"**(tsc·유닛·빌드·color-tokens 전부 그린, 리더 라이브 스와치≠렌더 비교로만 적발). 규칙: 픽커 스와치 배경은 **렌더가 쓰는 것과 동일한 토큰**(CSS `var(--accent-*)` 또는 도메인에서 export한 단일 hex 맵)에서 파생 — 픽커·대비계산·렌더가 한 소스를 공유. JS 순수 계산(대비 등)이 hex를 필요로 하면 그 맵을 **tokens.css를 읽어 대조하는 회귀 테스트**로 못박아 드리프트 차단(정규식으로 `--accent-<id>: #hex` 파싱해 맵과 일치 단언). 검증 게이트: 라이브에서 스와치 `backgroundColor` == 그 색 선택 시 렌더 텍스트/배경 색.

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

## 포커스·활성·선택 색 — 도구 유형별 규칙 (impeccable 22-도구 폴리시 캠페인)

전 도구를 훑으니 색 드리프트가 유형별로 갈렸다. 정합 규칙:

- **포커스 링은 항상 `focus-visible:`, 절대 맨 `focus:` 아님.** bare `focus:ring-*`은 마우스 클릭에도 링이 떠 노이즈다 — 키보드 사용자만 봐야 한다(22개 중 ~12개가 이 드리프트: character-counter·lunar·roulette·url-encoder·json-formatter·new-word·rankings·bookmarks·qna 등). 표준: `focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2`. **포커스 링 색은 `ring-focus-ring`(=`--focus-ring` #9a6400·비텍스트 대비 ~5:1), 절대 `ring-brand` 아님** — `ring-brand`는 허니 **필 색**(#f5a623)이라 흰 배경 위 링 대비가 ~2:1로 WCAG 2.4.11(비텍스트 3:1) 미달, 링이 거의 안 보인다(cron-parser가 68곳에서 `ring-brand` 사용 중이던 드리프트; 시스템 표준은 `ring-focus-ring` 84곳). 검출: `grep 'focus-visible:ring-brand\b'`→`ring-focus-ring` 정렬. **`<summary>`도 키보드 포커스 대상이므로 focus-visible 링 필수**(디자인된 포커스 링이 있는 시스템에서 `<details>`의 summary만 링 누락이 흔함 — cron-parser 치트시트·최근·FAQ 3곳이 그랬다). **텍스트 입력(textarea/input)도 `focus-visible:`** — 브라우저 휴리스틱상 텍스트 입력은 포커스 시 항상 `:focus-visible`를 만족하므로 클릭해도 링이 보인다(동작 동일, 관례만 정합). tsc·유닛·빌드 모두 그린이라 **grep으로만** 잡힌다: 변경 파일에 `focus:ring`/`focus:border`(앞에 `-visible` 없이)가 있거나 `ring-brand`가 포커스 링이면 드리프트. 검증: 키보드 Tab 후 `getComputedStyle(el).boxShadow`에 링, `getComputedStyle(el).getPropertyValue('--tw-ring-color')`가 `#9a6400`, `el.matches(':focus-visible')===true` 실측. **재발 경고: 이 규칙이 기존 도구 22개 폴리시 이후에도 완전히 새로 만든 도구(charades, 2026-07-21)에서 4곳(검색 입력·카테고리 pill·덱 카드·FAQ summary) 재발했다** — 즉 audit/polish 단계의 grep은 있어도 **생성(빌드) 단계에서 새로 작성되는 컴포넌트는 이 규칙을 안 거친다.** 새 도구를 만들 때 `focus-visible:ring-*` 클래스를 쓰는 매 파일마다 `ring-focus-ring`인지 그 자리에서 확인하고, 병합 전 반드시 `grep -rn 'ring-brand' src/components/tools/<새 도구>/`를 돌려라 — "이미 아는 규칙"이라고 건너뛰지 말 것.
- **활성/선택 색은 도구 유형으로 갈린다** — "액센트≠CTA"의 정밀판:
  - **상호작용 유틸 도구**(사다리·룰렛·변환기·카운터·인코더…): 활성 탭/pill/토글·주 액션 = **브랜드**(`bg-brand text-on-brand`). 액센트를 활성색으로 쓰면 위반 → 브랜드로(unit-converter 활성 탭 `bg-accent-sky`, url-encoder 활성 탭/버튼 `bg-accent-grape`를 교정).
  - **콘텐츠 컬렉션 허브**(new-word·rankings·bookmarks·dev-people): **카드 선택 상태 = 도구 액센트**(`border-accent-* bg-accent-*-soft` 또는 `ring-accent-*`)가 **의도된 공통 관례** — 위반 아님, **유지한다**. 이 허브 4종이 전부 이 패턴이라 정합(교차 확인 후 유지 결정). 카드 별/즐겨찾기 focus 링도 액센트 계열 유지 가능하되 트리거는 `focus-visible:`.
  - **조절 슬라이더**(range): thumb/track에 도구 액센트 = 정체성 게이지로 OK(unit-converter 소수점·roulette 볼륨·transparent-background tolerance/feather — 전부 유지).
  - **네이티브 라디오/체크박스**: `accent-brand`. 브라우저 기본 파랑(speed-quiz — 허니골드 팔레트와 충돌)도, `accent-accent-<tool>`(url-encoder — 액센트 남용)도 아니다. json-formatter가 레퍼런스: `<input className="… accent-brand">`.
- **액센트-충돌 심각도로 판단한다**: 쿨/명도차 큰 액센트(sky·grape)를 활성색으로 = 브랜드 골드와 시각적으로 **튀는** 명백한 위반 → 브랜드. 하지만 **웜-골드 계열 액센트(sun ≈ brand)**를 서브틀한 지표(탭 밑줄 등)에, 그것도 **의도적으로 테스트에 못박은** 경우는 조화로운 정체성이라 **존중**(knitting-gauge 탭 밑줄 `bg-accent-sun`, ModeTabs.test가 codify). 기준: 액센트가 브랜드와 **튀는가(쿨/명도차)** vs **조화로운가(웜 골드)** + **의도가 테스트로 codify됐는가**.
- **폴리시의 정직한 결과에 "변경 없음"이 포함된다.** 이미 규칙을 지키는 도구(my-ip·ladder·restaurant-map·knitting-gauge)는 억지 변경을 만들지 말고 "검증 완료·변경 없음"으로 보고한다 — 장식은 폴리시가 아니다. 단, 그 판정은 grep(포커스/토큰/액센트) + 라이브 시각(ko/en·320/1440) + 콘솔 0을 실제로 돌린 뒤에만.

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
- **형제 액션 버튼 + 카드 hover의 분리 배선(home-favorites FavoriteButton 확립 패턴).** ① 카드 hover 리프트는 **래퍼의 named group**(`group/card` 래퍼 + 카드에 `group-hover/card:*`)에 배선 — 커서가 버튼 위에 있어도 카드가 함께 반응해 "카드 위인데 리프트가 꺼지는" 경계 인지가 없다 ② **포커스 링·press scale은 앵커의 무명 `group`에 유지** — 래퍼 group에 옮기면 버튼 포커스가 카드 링을 오발화하고 버튼 클릭이 카드를 스케일한다 ③ 카드 모서리에 기존 배지가 있으면 배지 컨테이너에 **상수 오프셋**(`pr-9` 등 — 조건이 SSR=클라 동일해야 CLS 0)으로 겹침 회피 ④ 버튼 상태색은 soft+ink 페어링(`bg-accent-<c>-soft text-accent-<c>-ink`)으로 비텍스트 대비 3:1 확보(밝은 원색 아이콘 단독은 2.x:1로 미달).
- 완료 전 **렌더된 카드를 실제로 띄워(스크린샷/a11y 트리) 본문이 보이는지** 확인 — DOM 존재(`getByText`)는 `display:none`을 통과시킨다(`jurepi-tdd` 참조).

## 다크모드 라이브 토글 — "프레시 로드는 맞는데 토글하면 굳는다"

**다크모드 검증은 반드시 라이브 토글(버튼 클릭)로 재현해야 한다 — `localStorage`에 테마를 미리 심고 새로고침한 "프레시 로드"만으로는 이 클래스의 버그를 못 잡는다.** 로또 생성기 실측: 헤더 테마 토글 버튼을 클릭해 라이트↔다크를 전환하면, `transition-colors`(또는 `color`를 포함하는 임의 `transition`)가 걸린 요소 중 **호버로 그 속성이 바뀌는 트리거가 없는 요소**(예: 배경만 hover로 바뀌고 텍스트색은 안 바뀌는 링크/버튼)의 `color`가 **토글 이전 값에 영구히 고정**됐다 — `data-theme`는 정확히 바뀌었는데(`html[data-theme="dark"]`) 그 요소의 `getComputedStyle().color`는 라이트 값 그대로, 12초 넘게 방치해도 안 풀렸다. `link.style.transition='none'`으로 강제하면 **즉시** 올바른 색으로 스냅됐다 — 트랜지션이 걸린 `color`가 조상의 CSS 커스텀 프로퍼티 변경(먼 조상의 `data-theme` 속성 변경)에 반응해 값은 바뀌지만 **트랜지션 자체가 완료되지 않고 이전 프레임에서 멈추는** 브라우저 렌더링 특성이다. 반면 새로고침으로 처음부터 그 테마로 렌더하면(트랜지션이 걸릴 "이전 값"이 없으므로) 항상 정확했다 — **"새로고침해서 맞다"는 "토글해도 맞다"를 증명하지 않는다.**

- **재현 신호:** `getComputedStyle(el).color`가 `document.documentElement.dataset.theme`와 불일치(다크인데 라이트 값, 혹은 그 반대) + 1초 이상 기다려도 안 바뀜(트랜지션 지연이 아니라 고착).
- **근본 처방(제안, 리더 승인 필요 — `ThemeProvider.tsx`는 전 사이트 공유 인프라):** 테마 스왑 시 `<html>`에 `transition:none !important`를 강제하는 클래스를 잠깐 걸었다 다음 프레임에 뗀다(`classList.add` → `dataset.theme=` → `requestAnimationFrame(() => classList.remove(...))`). 이는 다크모드 토글을 추가하는 사이트들이 흔히 겪는, 잘 알려진 클래스의 버그이며 표준 처방이 "스왑 순간 전 사이트 트랜지션을 잠깐 끈다"이다. 개별 요소에서 `transition-colors`를 빼는 식의 두더지잡기로 대응하지 말 것 — 같은 패턴(테마 반응 색 + 호버 트리거 없는 트랜지션)을 가진 요소가 사이트 전체에 잠재한다.
- **검증 게이트(재발 방지):** 신규/변경 요소를 다크모드에서 검증할 땐 ① 프레시 로드(제거 시 문제 없어 보임의 함정 확인) **뿐 아니라** ② **라이브 토글 버튼 클릭 후** 같은 요소의 `getComputedStyle().color`가 `data-theme`와 일치하는지 **반드시** 추가 확인한다. 둘 중 하나만 확인하면 놓친다.

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
- **수평 스크롤 pill/필터 행 끝에 새 컨트롤을 덧붙이지 말 것 — 모바일에서 발견 불가가 된다.** 행 끝 컨트롤은 320px 초기 뷰포트 완전 밖(home-favorites 실측: 즐겨찾기 토글 x=746 vs 뷰포트 320 — 주 관객인 모바일에서 신기능이 안 보였고, 유닛·E2E·빌드 전부 그린이라 감사 boundingBox로만 적발). 신규 컨트롤은 **스크롤 컨테이너 밖 고정 슬롯**으로: 외곽 flex `[flex-1 min-w-0 overflow-x-auto 스크롤영역][shrink-0 컨트롤]`. 게이트 = 320px에서 `getBoundingClientRect().right <= 320` 확인.
- **`overflow-hidden` 컨테이너 안의 nowrap/대형 콘텐츠(마퀴·모노스페이스 IP·긴 한 줄 텍스트)는 flex/grid item에 `min-w-0`가 없으면 조상을 강제로 넓혀 320 오버플로를 만든다 — flex/grid item의 `min-width` 기본값이 `auto`(콘텐츠 최소폭)라 `overflow-hidden`이 클립을 못 한다.** cheer 실측: `.cheer-scroll`(마퀴, `white-space:nowrap`+`padding-right:100%`) 스팬이 2681px가 되어 배너·그리드 컬럼을 1340px로 밀어 문서 scrollWidth 1364(뷰포트 320). tsc·유닛·E2E·빌드 전부 그린, 320 boundingBox로만 적발. **규칙:** ① 마퀴/nowrap을 감싸는 `overflow-hidden` div와 그리드 컬럼(`grid md:grid-cols-2`의 각 자식)에 `min-w-0` ② 세그먼트 버튼 행(효과·속도·크기 pill)은 `flex gap-2 flex-wrap`(nowrap 3~4버튼도 320에서 넘칠 수 있다) ③ 게이트 = 320px에서 `document.documentElement.scrollWidth <= innerWidth` + `right>321` 오프렌더 스캔.

## 체크리스트 (컴포넌트 완료 전)

- [ ] 기본 Tailwind/shadcn 템플릿처럼 보이지 않는가
- [ ] hover/press/focus-visible가 의도적으로 설계됐는가
- [ ] 균일 강조가 아니라 위계가 있는가
- [ ] 토큰을 하드코딩하지 않고 CSS 변수로 소비하는가
- [ ] 새로 쓴 토큰/유틸이 실제로 존재하는가(미존재 토큰은 투명 렌더), 선택/활성 상태가 aria뿐 아니라 시각적으로 뚜렷한가 — **반환 전 grep 하드 게이트**: 변경 파일의 `(bg|text|border|ring|from|to|fill)-<name>` 클래스를 `tailwind.config.ts`의 color/토큰 키와 대조하라. 미존재=팬텀=투명(typecheck·유닛·빌드 모두 그린이라 못 잡음). 실제 재발: `bg-surface-hover`/`hover:bg-surface-hover`는 **존재하지 않는다**(3회째 팬텀). muted 표면 hover는 실재 토큰 `hover:bg-surface-sunken`을 쓴다. **시맨틱 색은 `danger`/`warning`/`success`(+`-ink` 고대비 변형)이지 `semantic-*`가 아니다** — `bg-semantic-warning`/`text-semantic-danger`/`bg-semantic-success`는 전부 팬텀(url-encoder에서 14곳 재발). 텍스트는 `text-danger-ink`/`text-warning-ink`, 배경/보더는 `bg-danger`/`bg-warning`/`bg-success`. `color-tokens.test`(scripts/validate-color-tokens.mjs)가 이를 잡으니 반환 전 반드시 실행. **팬텀 신변형(4회째 재발군): 커스텀 시맨틱 토큰에 Tailwind 팔레트 접미사를 붙인 `danger-50`/`danger-200`/`danger-900`도 전부 팬텀이다**(transparent-background에서 에러 배너가 투명 렌더 위험) — 실토큰은 `danger`/`danger-ink`뿐이고 농도는 **슬래시 opacity**로 만든다(에러 배너 관례: `bg-danger/10 border border-danger/30 text-danger-ink`, lunar-converter ErrorMessage 미러). 역방향 함정: **Tailwind 기본 팔레트(`gray-200`·`sky-500`·`red-50`·`text-white`)는 가드가 유효 토큰으로 허용해 통과하지만 디자인 시스템 위반이다**(렌더는 되나 시스템 밖 색) — 시스템 토큰(`surface-muted`·`accent-sky-soft`·`text-on-brand` 등)으로만 쓰고, 기본 팔레트 사용은 grep(`gray-\d|sky-\d|red-\d|blue-\d|text-white`)으로 반환 전 자체 검출한다. **팬텀 신변형(5회째 재발군): 브랜드 CTA의 hover/active를 `bg-brand-dark`/`bg-brand-darker`로 쓰면 전부 팬텀이다**(jwt-decoder Verify 버튼) — 실토큰은 `bg-brand`와 그 강조 `hover:bg-brand-strong`뿐이다(active도 `active:bg-brand-strong` 재사용). **실행 규율: 가드는 돌려야 잡는다** — 도구 디렉토리만 스코프한 `vitest run src/components/tools/<slug>`는 전역 가드(`src/__test__/color-tokens.test.ts`)를 **우회**하므로, 색/토큰 클래스를 만진 뒤에는 `npx vitest run src/__test__`(전역 가드 스위트)를 반드시 함께 실행한다(실제: transparent-background 팬텀 4종이 스코프 실행만으로 그린처럼 보였고 가드는 잡을 수 있었다 — 안 돌렸을 뿐). **리더의 수동 grep 패턴은 새 팬텀 변형을 놓친다**(jwt-decoder: 리더가 `focus:ring|--semantic-|surface-hover|max-w-(sm|md|lg)`만 grep해 `brand-dark`를 통과시켰고, `color-tokens.test`가 잡았다) — 수동 grep은 보조일 뿐, **판정 게이트는 항상 전역 가드 스위트 실행**이다. **팬텀은 색 토큰만이 아니다 — 폰트 패밀리 유틸리티도 가드 대상이다**(cheer: 대형 배너에 `font-gmarket-sans`를 썼는데 실토큰은 `font-display`[= `var(--font-display)` = Gmarket Sans], `font-gmarket-sans`는 팬텀=폴백 폰트 렌더). 또 **`bg-danger-soft`처럼 시맨틱 토큰에 `-soft` 접미사(6회째 팬텀군)** → 실제는 `bg-danger/10`. `color-tokens.test`가 `font-<name>`·`bg-danger-soft` 둘 다 잡았으니 전역 가드 실행이 곧 판정.
- [ ] **새 다중-상태 표시(예: 정답/패스/시간초과, 성공/경고/위험 3분류 이상)를 만들 때 `-ink` 토큰셋이 그 상태 전부를 커버하는지 확인했는가 — 커버하지 않으면 raw fill을 텍스트색으로 재사용하게 된다.** charades 실측: 게임 요약 화면이 correct(초록)/pass(빨강)/timeout(호박) 3색 텍스트가 필요했는데, 그때까지 토큰셋엔 `--danger-ink`·`--warning-ink`는 있었지만 **`--success-ink`가 아예 없었다** — 결과 `text-success`(raw fill, 대비 ~2.3:1)를 텍스트에 직접 써서 WCAG AA 미달(tsc·유닛·빌드 전부 그린, `color-tokens.test`는 존재하는 토큰만 검증하므로 못 잡음). 예방: 새 시맨틱 색을 텍스트/아이콘으로 쓰기 전에 `tokens.css`에서 `--<색>-ink`가 라이트/다크/`prefers-color-scheme: dark` 매체쿼리 3곳 모두 정의돼 있는지 확인하고, 없으면 만들어 넣는다(대비 계산 후 주석에 실측값 기록 — 기존 `--danger-ink`/`--warning-ink` 패턴 미러).
- [ ] **타이머·점수·버튼처럼 동시에 화면에 떠 있는 "코너 클러스터"(HUD/툴바)를 여러 개의 독립 `absolute` 위치(매직 픽셀 오프셋)로 배치하지 않았는가 — 그리드 트랙은 절대 겹치지 않지만 독립 absolute는 좁은 뷰포트에서 겹친다.** charades GameBoard 실측: undo(좌상단 `absolute top-8 left-8`)·타이머(중앙 `absolute top-8 left-1/2 -translate-x-1/2`)·점수+종료(우상단 `absolute top-8 right-8`/`top-32 right-8`)가 desktop에선 안 겹쳤지만 ~344px 이하에서 타이머와 undo가 충돌 — 전부 그린이었고 320px boundingBox 감사로만 적발. 예방: 같은 행에 동시 존재하는 코너 요소 2개 이상은 `grid grid-cols-[auto_1fr_auto]`(또는 유사 명시적 트랙)로 배치하고, 텍스트 크기도 `clamp()`로 좁은 폭에 반응하게 한다 — magic offset(`top-32` 같은)은 트랙 경계가 아니라 추측이라 신뢰할 수 없다.
- [ ] **같은 데이터를 다른 프레이밍으로 두 섹션에 걸쳐 중복 렌더하지 않았는가** — 각 섹션이 독립적으로 렌더에 성공하면 컴포넌트 단위 테스트는 중복을 못 잡는다(둘 다 그린). charades GameSummary가 "결과별 단어 목록"(아이콘+결과)과 "전체 단어 목록"(같은 단어를 아이콘 없이 재나열)을 순차 배치해 정보량 증가 없이 화면만 길어졌었다 — audit 시 화면을 눈으로 보며 "이 섹션, 위에서 이미 보여준 정보 아닌가?"를 점검한다.
- [ ] **인라인 스타일/서드파티 SDK 주입 HTML의 `var(--토큰)` 문자열도 팬텀 검사를 했는가** — Tailwind 클래스 가드(`color-tokens.test`)는 인라인 `style="background-color: var(--accent)"` 같은 CSS 변수 참조를 **스캔하지 않는다**. 미존재 변수는 조용히 빈 값=투명 렌더(restaurant-map: NAVER 지도 마커 배경이 팬텀 `var(--accent)`로 투명 → 마커가 사실상 안 보여 사용자가 "지도 무응답"으로 인식; tsc·유닛·빌드·E2E 전부 그린). 액센트 변수의 실명은 `--accent-{coral,mint,sky,sun,grape,rose}`(카테고리별)이지 `--accent`가 아니다. 반환 전 변경 파일의 `var(--` 를 grep해 `globals.css` 정의와 대조하고, 지도/캔버스/SDK 주입 표면은 렌더된 화면에서 색이 실제 보이는지 확인한다(`getComputedStyle(...).backgroundColor`가 `rgba(0,0,0,0)`이면 팬텀).
- [ ] **빈 상태(empty state)는 컨텍스트별로 분기했고, 필터/검색 무결과에는 탈출 액션이 있는가** — 무결과 상황에 엉뚱한 온보딩 문구(즐겨찾기 안내 등)가 뜨면 사용자는 **오류로 인식**한다(restaurant-map '기타' 클릭 → "별을 눌러 즐겨찾기를 저장하세요"+내 위치 버튼 → 오류 신고로 이어짐). 규칙: ① 필터/검색 무결과 = "조건에 맞는 결과 없음" + **필터 초기화** 버튼 ② 탭 고유 빈 상태(즐겨찾기/최근)는 그 탭의 온보딩 문구 ③ 애초에 결과가 0일 수밖에 없는 필터(데이터에 없는 카테고리)는 **렌더하지 않는다**(카탈로그 파생, RegionTabs 패턴). ④ **빈 상태 플레이스홀더는 콘텐츠용 효과(스크롤·점멸·대형 크기)를 상속하지 말 것** — cheer 실측: 기본 효과 '스크롤'+크기 L에서 빈 배너가 플레이스홀더 문구를 거대하게 마퀴로 흘려 화면에 파편("?")만 보여 깨진 것처럼 인식. 빈 상태는 효과·대형 크기를 우회하고 **정적·muted·축소**(`opacity-50 text-lg sm:text-2xl`)로 렌더한다(`isEmpty` 분기를 효과 분기보다 먼저).
- [ ] 액센트를 CTA에 쓰지 않았는가(브랜드 바이올렛 유지)
- [ ] **포커스 링이 전부 `focus-visible:`인가**(맨 `focus:ring`/`focus:border` 금지 — `grep 'focus:ring\|focus:border' | grep -v focus-visible`), 활성/선택 색이 도구 유형 규칙(유틸=브랜드, 콘텐츠 허브 카드=액센트, 슬라이더=액센트, 네이티브 라디오/체크박스=`accent-brand`)에 맞는가
- [ ] reduced-motion 폴백이 있는가
- [ ] 떠 있는 레이어(드롭다운/콤보박스/패널)는 명시적 너비 + 엣지 앵커이고, 열어서 너비를 눈으로 확인했는가
- [ ] 실제 제품 스크린샷처럼 믿을 만한가
