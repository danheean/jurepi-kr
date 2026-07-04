# 룰렛 — 공정한 랜덤 선택을 위한 결정의 휠 — 서비스 SPEC

> 이 문서는 AI 코딩 에이전트가 소비하는 **정본 영문 SPEC**([`SPEC.md`](SPEC.md))의 **국문 번역본**입니다. 어느 한쪽이 변경되면 양쪽을 동기화하세요.
>
> **룰렛**(결정의 룰렛) 빌드 명세 — 사용자가 휠에 선택지를 추가하고, 선택적으로 옵션별 가중치를 부여하고, 스핀해서 공정한 랜덤 당첨자를 뽑고, 결과가 강조 표시되는 것을 보고, 원하면 당첨자를 제거한 뒤 다시 돌리는 스핀 결정 도구. 전체 상호작용은 클라이언트 사이드: 라우팅 없음, 리로드 없음, 백엔드 없음. 지속성은 localStorage(이름 붙인 옵션 세트 저장/불러오기). 표시는 순수 SVG + CSS `transform: rotate()` 애니메이션이며, reduced-motion에서는 당첨자를 즉시 공개한다.
> 내부 서비스 코드네임: `roulette`. 레지스트리 id: `roulette`. 공개 URL 슬러그: `/[locale]/tools/roulette`.
>
> 이 SPEC은 도구 자체를 다룬다. 플랫폼 셸, 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공한다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템: [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고용 형제 도구 SPEC: [`docs/services/game/ladder/SPEC.md`](../../game/ladder/SPEC.md)

## 개요

룰렛은 결정에 스핀의 짜릿함을 더한다. 사용자는 선택지 이름을 목록에 입력하거나 붙여넣고, 선택적으로 가중치를 부여하고(가중치가 높을수록 슬라이스가 커짐), 스핀 버튼을 눌러 휠이 회전하며 당첨자를 공개하는 것을 지켜본다. 당첨자는 화면에서 컨페티와 함께 강조된다(선택적, 의존성 0, reduced-motion 존중). 전체 상호작용은 **단일 페이지 SPA**: 라우트 변경 없음, 전체 리로드 없음. "당첨자 제거" 모드로 같은 휠에서 여러 번 연속 추첨할 수 있다. 자주 쓰는 옵션 조합은 이름을 붙여 localStorage에 저장하고 즉시 다시 불러올 수 있다.

**CRITICAL (클라이언트 전용, SSG)**: 100% 클라이언트 사이드. 백엔드·데이터베이스·API 없음. 유일한 지속성은 localStorage(옵션 세트 + 마지막 활성 세트 이름). 랜덤 추첨은 `crypto.getRandomValues`로 암호학적 균일성을 보장한다(시각적 각도와 무관한 무편향 선택). 휠 레이아웃은 순수 SVG, 스핀은 CSS `transform: rotate()` ease-out이며 `prefers-reduced-motion`에서는 즉시 공개한다.

**CRITICAL (SPA, 사용성 최우선)**: 모든 Jurepi 도구는 클라이언트 사이드 SPA다. 옵션 추가·가중치 변경·스핀·저장/불러오기 등 상호작용은 전부 React 상태에서 일어나며 라우트 이동과 전체 페이지 리로드가 없다. 라우트는 SEO를 위해 정적 생성(SSG)되고, 인터랙티브 도구는 단일 클라이언트 컴포넌트 섬이다.

## 플랫폼 통합

- 라우트: `/[locale]/tools/roulette` (SSG; 레지스트리 slug `roulette`, id `roulette`, status `live`, accent `rose`, category `random`).
- 플랫폼 제공: 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈을 감싸는 Error Boundary, lib/seo.ts 메타데이터 빌더, 브레드크럼 + in_content 광고 래퍼.
- 소비: i18n 네임스페이스 `tools.roulette.*` (UI 크롬 문자열: 라벨·버튼·도움말 — 옵션 이름은 제외; 옵션 이름은 localStorage/사용자 입력에서 옴).
- 플랫폼 의존(새 카테고리 불필요): `'random'` 카테고리는 이미 `rose` 액센트와 "랜덤·추첨"/"Random" 라벨로 존재한다. 플랫폼 변경은 `ToolMeta` 레지스트리 항목 1개, 도구 라우트의 slug→컴포넌트 분기, `generateMetadata` 분기 추가뿐이다.

## 범위 경계

### 범위 내
- 옵션 목록 관리: 추가(2~30개), 라벨 편집, 삭제, 순서 변경(드래그 또는 화살표 버튼)
- 옵션별 가중치: 선택적 숫자 가중치(기본 1, 최소 1); SVG 슬라이스 크기로 표시
- 스핀: CSS 회전 애니메이션(transform: rotate) ~4초 ease-out; reduced-motion은 즉시 공개
- 당첨 공개: 슬라이스 강조 + 옵션 이름 크게 표시 + 선택적 사운드(Web Audio API, 설정에서 토글)
- "당첨자 제거" 연속 추첨 모드: 직전 당첨자를 제외하고 재스핀
- 당첨 컨페티(순수 CSS/JS, 의존성 0, reduced-motion 존중)
- 이름 붙인 옵션 세트 저장/불러오기(localStorage): 세트 이름으로 목록 상태 지속, 마운트 시 기본 세트 로드
- 키보드 탐색: Tab으로 입력/버튼 이동, Enter로 추가, 이름 필드에서 Backspace로 삭제
- 반응형(320/375/768/1024/1440): SVG 스케일링; 컨트롤 그리드/스택 전환
- 사운드 토글 + 음량 슬라이더(Web Audio 컨텍스트, 틱 비프 / 당첨 차임)
- 도구별 SEO 롱폼 + FAQ(FAQPage JSON-LD), SoftwareApplication JSON-LD, ko/en 로컬라이즈
- 접근성: WCAG 2.1 AA, 가시적 포커스, ARIA 라벨, 색 대비

### 범위 외
- 앱 셸, 헤더/푸터, 로케일 스위처, 테마 토글, 동의 배너, 광고 로딩, sitemap/robots, 도구 레지스트리(전부 플랫폼)
- 커스텀 배경용 인앱 이미지/사진 업로드
- 백엔드 동기화 / 기기 간 지속성
- 옵션별 이모지·리치 스타일링(단순 텍스트 라벨만)
- 휠 링크 공유(휠별 라우트를 갖는 Phase 2 후보)

### 향후 고려
- 휠별 딥링크 + 공유 가능한 고유 URL — Phase 2
- 옵션 편집 undo/redo 스택 — Phase 2
- 가중 랜덤 분포 분석(차트) — Phase 3
- 사용자 취향별 커스텀 휠 색상 — Phase 3

## 기술 스택

- **상속**: Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl(ko/en) — 전부 플랫폼에서 상속.
- **휠 SVG**: 순수 SVG로 렌더: 원 + 슬라이스(path 요소), 틱 마크, 중앙 라벨 영역. CSS `transform: rotate()`가 스핀을 애니메이트. 슬라이스 각도 = (weight / 전체 weight) × 360°. 라벨은 **방사형**(슬라이스 중앙각으로 회전, 반지름을 따라 안→밖으로 읽힘)으로 렌더해 얇은 조각에도 텍스트가 들어가고, 폰트 크기는 옵션 수에 따라 자동 축소(clamp)되며 긴 라벨은 `…`로 잘린다(전체 이름은 `<title>`/aria-label에 보존). LEGEND_THRESHOLD 초과 시 슬라이스는 이름 대신 **번호**를 표시하고 번호→전체 이름 범례 목록이 휠 옆/아래에 렌더된다.
- **랜덤 선택**: crypto.getRandomValues → 균일 float [0, 1) × 전체 weight → 이진 탐색으로 슬라이스 도착. 시각적 각도와 무관(공정, 무편향).
- **애니메이션**: CSS 트랜지션(rotate 4s ease-out); Web Audio API 비프(oscillator + gain); CSS 키프레임 컨페티(scale, fade); 전부 `prefers-reduced-motion` 게이트(즉시 공개, 모션 없음).
- **지속성**: localStorage 키 `jurepi-roulette`: `{ version, sets: { [name]: { options: [{label, weight}...] } }, lastSetName }`. 마운트 시 읽기 → zod 파싱 → 미지 필드 제거. 변경마다 쓰기(디바운스 없음 — 즉시 동기화).
- **입력 안전**: 옵션 라벨은 순수 텍스트(dangerouslySetInnerHTML 없음). 텍스트 입력은 검증(비어있지 않음, 적정 길이).
- **라이브러리**: zod v3.x(레포 기존)로 옵션/세트 스키마 및 localStorage 검증; 사운드는 네이티브 Web Audio API(라이브러리 없음).

## 파일 구조

```text
src/
├── lib/roulette/                       # 순수 도메인 계층 (React/Next 없음)
│   ├── schema.ts                       # zod: Option, OptionSet, StoreSchema (STORE_VERSION, sets, lastSetName)
│   ├── random.ts                       # fairWeightedPick(options) → crypto.getRandomValues 기반 인덱스
│   ├── geometry.ts                     # sliceAngle(weight, total), labelPosition(angle, radius)
│   ├── sound.ts                        # Web Audio API 기반 playTick/playWin 톤 합성
│   └── sets.ts                         # 불변 연산: addSet, renameSet, deleteSet, updateOptions, loadLastSet
├── components/tools/roulette/
│   ├── Roulette.tsx                    # 클라이언트 컴포넌트; 상태 소유 (options, weights, spinning, selectedIndex, savedSets)
│   ├── useRoulette.ts                  # 훅: 휠 기하, 랜덤 추첨, localStorage 지속성(세트)
│   ├── WheelSVG.tsx                    # 순수 SVG 휠 렌더 (슬라이스·틱·중앙 라벨·당첨 강조); 적응형 방사 라벨, LEGEND_THRESHOLD 초과 시 번호 모드 + 번호 범례
│   ├── OptionList.tsx                  # 추가 입력 + 옵션 행(라벨, 가중치, 삭제 버튼)
│   ├── SpinButton.tsx                  # 메인 CTA; 옵션 <2개면 비활성
│   ├── ResultPanel.tsx                 # 당첨 공개 (이름, "다시 돌리기" 프롬프트, 컨페티)
│   ├── SaveLoadPanel.tsx               # 저장 → 이름 입력 + 저장 버튼; 불러오기 → 저장된 세트 버튼 그리드
│   ├── SettingsPanel.tsx               # 사운드 토글 + 음량 슬라이더; 당첨자 제거 체크박스
│   ├── RouletteIntro.tsx               # H1 + 리드 (SEO; 가능한 한 서버 렌더)
│   ├── RouletteHowTo.tsx               # "돌리는 방법" / "공정한 결정 팁" (SEO 롱폼)
│   ├── RouletteFaq.tsx                 # Q&A + FAQPage JSON-LD
│   └── confetti.ts                     # 의존성 0 컨페티: 당첨 시 CSS 키프레임 + 요소 생성 (prefers-reduced-motion 존중)
└── i18n/messages/{ko,en}.json          # tools.roulette.* UI 크롬 (추가·스핀·저장·불러오기·사운드 등)
```

## 핵심 데이터 엔티티

- **Option**: `label`(필수, 비어있지 않음, 최대 50자 — 슬라이스의 사용자 표시 이름), `weight`(≥1, 기본 1, 최대 1000 — 슬라이스 상대 크기). 불변: 업데이트는 새 배열 반환, 절대 in-place 변경 금지.
- **OptionSet**: `name`(sets 내 유일; "무제 1", "점심 추천" 등), `options: Option[]`, `createdAt`(정렬/표시용 타임스탬프).
- **RouletteStore**: `version`(STORE_VERSION=1), `sets: { [name]: OptionSet }`(저장된 모든 세트), `lastSetName: string | null`(마운트 시 로드할 세트). localStorage 키: `jurepi-roulette`. 불변식: 읽기는 zod 파싱; 실패 → fresh 시작(throw 없음).
- **상수**: MIN_OPTIONS = 2, MAX_OPTIONS = 30; MIN_WEIGHT = 1, MAX_WEIGHT = 1000; LEGEND_THRESHOLD = 16(이하: 슬라이스에 전체 이름; 초과: 슬라이스 번호 + 번호 범례); SPIN_DURATION_MS = 4000; TICK_FREQ_HZ = 800; WIN_FREQ_HZ = 1200; CONFETTI_COUNT = 50.

## 라우트 정의

- 공개 라우트: `/:locale/tools/roulette` (플랫폼 도구 라우트가 slug→컴포넌트 분기). 단일 라우트, locale ∈ {ko, en}. 플랫폼 generateStaticParams가 레지스트리(status "live")를 순회해 SSG.

## 컴포넌트 계층

```text
<Roulette>                    ← "use client"; options·spinning·selectedIndex·savedSets·lastSetName 상태 + useRoulette() 소유
  <RouletteIntro />           ← H1 + 리드 (가능한 한 서버 렌더)
  <레이아웃 그리드>            ← 데스크톱 2분할(SVG | 컨트롤), 모바일 스택
    <휠 컬럼>
      <WheelSVG />            ← SVG 휠, 당첨 강조, 스핀 애니메이션
      <ResultPanel />         ← 당첨 이름 + "다시 돌리기" + 컨페티
    <컨트롤 컬럼>
      <OptionList />          ← 추가 입력, 옵션 행(라벨·가중치·삭제), 최소 2 최대 30
      <SpinButton />          ← 대형 CTA, 옵션 <2 또는 스핀 중이면 비활성
      <SaveLoadPanel />       ← 저장 → 이름 입력+버튼; 불러오기 → 저장 세트 그리드
      <SettingsPanel />       ← 사운드 토글+음량 슬라이더; 당첨자 제거 체크박스
  <RouletteHowTo />           ← SEO 롱폼
  <RouletteFaq />             ← FAQPage JSON-LD
```

## 페이지·인터페이스

### RouletteIntro
- 아이브로: "랜덤·추첨 도구" / "RANDOM TOOL" — 12px/700/0.6px, var(--brand-ink)
- H1: "결정의 룰렛" / "Decision Roulette" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)
- 리드: "선택지를 적어서 돌리면 공정하게 결정해줍니다." / "Spin to decide fairly from your options."

### WheelSVG
- 컨테이너: 320px 정사각(모바일 스케일); 중심 (160, 160). 밀집 휠(옵션 다수)은 호 길이 보존을 위해 viewBox 확대 가능(예: 최대 400px), 반응형 스케일 유지.
- 반지름: 140px(외곽), 40px(중앙 라벨 영역)
- 각 슬라이스: angle[i]→angle[i+1] 호 + 중심 웨지 path
- 슬라이스 색: 전 슬라이스 rose 액센트 `var(--accent-rose)`, 인덱스별 미세한 틴트 변화(rose-soft ↔ 채도 rose)
- 슬라이스 라벨(적응형): 방사형 렌더(중앙각 회전, 안→밖 읽기). 폰트 크기는 옵션 수 증가에 따라 자동 축소(clamp, 바닥 ~9px); 넘치면 `…` 절단, 전체 라벨은 `<title>`/aria-label. LEGEND_THRESHOLD(16) 이하: 슬라이스에 전체 이름. 초과: 슬라이스에 번호 + 번호 범례(1→이름, 2→이름…)를 휠 옆/아래 렌더해 스핀 전 전체 옵션 스캔 가능.
- 중앙 라벨: 당첨자 이름(비회전 텍스트, 회전하는 슬라이스 위에 항상 표시) — 슬라이스 밀도와 무관하게 항상 전체 이름이라 결과가 가려지지 않음
- 틱 마크: 외곽 24개 소형 방사선(장식; 슬라이스 수와 분리)
- 당첨 슬라이스 강조: 결과 시 2px var(--accent-rose) 외곽선 + 글로
- 애니메이션: `transform: rotate(0deg → finalAngle)` 4s ease-out, reduced-motion에서 0s

### OptionList
- 제목 "옵션 추가" / "Add Option" — 16px var(--text)
- 입력 행: 텍스트 필드(최대 50자, placeholder "예: 점심 추천") + 가중치 스피너(1–1000) + 삭제 버튼
- 옵션 행: 라벨 + 가중치 입력 + 삭제 버튼; 순서 변경 핸들
- 스핀 활성화 최소 2개; 최대 30개. 고밀도 가독성은 적응형 라벨(방사형+자동축소+`…`)과 LEGEND_THRESHOLD(16) 초과 시 번호 범례로 처리 — 낮은 하드 캡이 아님
- 최소 가중치 1; 0 입력 시 → 1로 기본
- 상태: 포커스 입력 2px var(--accent-rose) 링; 옵션 행 hover 리프트

### SpinButton
- 높이 56px, rounded var(--radius-lg), 배경 var(--brand), 텍스트 var(--on-brand), "지금 돌리기!" / "SPIN!"
- 비활성(옵션 <2 또는 스핀 중): opacity 0.5, cursor not-allowed
- Hover(활성): scale(1.05) 150ms; press scale(0.98)
- 클릭 시: 비활성화 → 랜덤 최종 각도 생성 → 4s 회전 애니메이션 → 틱 사운드 → 결과 공개 → 재활성화

### ResultPanel
- 결과 시 휠 아래/옆에 표시
- 당첨 옵션 이름 크게(28px var(--text) Gmarket Sans/700)
- "축하합니다!" / "You landed on…" 아이브로
- 컨페티 애니메이션 1.5s(scale + fade, prefers-reduced-motion 존중)
- 버튼: "다시 돌리기" / "Spin Again"(주), "결과 제거 후 돌리기" / "Remove & Re-spin"(부, 토글 ON일 때)

### SaveLoadPanel
- 저장: "이 조합 저장" / "Save Set" 입력(최대 50자, 기본 "무제 1") + 저장 버튼
- 불러오기: 저장 세트 버튼 그리드; 이름 + 옵션 수 + 삭제 아이콘(×)
- 불러오기 클릭 시 현재 옵션 교체 + lastSetName으로 지정
- 빈 상태: 저장 세트 없음 → "조합을 저장하면 여기에 보여요"

### SettingsPanel
- 사운드 토글: "소리" / "Sound" 스위치(기본 ON); 아래 "음량" / "Volume" 슬라이더 0–100%
- "결과 제거 후 재시작" / "Remove Winner Mode" 토글(기본 OFF); ON이면 "다시 돌리기"가 당첨자를 휠에서 제거
- 키보드: Tab 이동, Space 토글

### 키보드 단축키
- Tab: 입력/버튼 탐색(DOM 순서)
- Enter(추가 입력): 옵션 추가; (저장 입력): 세트 저장; (불러오기 버튼): 세트 로드
- Space(토글): 설정 전환
- 스핀 애니메이션 중 비활성

## 핵심 기능

- **휠 기하**: sliceAngle(weight, total) = (weight / total) × 360°; labelPosition(angle): x = 140×cos(angle), y = 140×sin(angle) — 텍스트 배치용 호 중점; finalAngle(스핀 결과): 당첨 슬라이스가 상단에 오도록 0–360 스케일.
- **랜덤 선택**: fairWeightedPick(options) → index: crypto.getRandomValues → float [0, 전체 weight) → 이진 탐색으로 슬라이스 인덱스. 반복 스핀에서 균일 선택 보장(시각 레이아웃과 무관, 순수 수학).
- **애니메이션**: 스핀 `transform: rotate(0deg → finalAngle)` 4000ms cubic-bezier(0.16,1,0.3,1); 사운드는 스핀 중 틱 비프 10–12회(주파수 상승) + 공개 시 차임 1회; 컨페티는 div 50개 생성, 각각 scale 1→0.2·opacity 1→0 1.5s·랜덤 회전·50ms 스태거; 전부 `prefers-reduced-motion` 게이트(즉시 공개, fade만).
- **지속성**: 마운트 시 localStorage `jurepi-roulette` 읽기 → zod 파싱 → 상태 설정; 실패 → 빈 옵션. 모든 변경(추가/편집/삭제/가중치/저장/불러오기)마다 불변 업데이트 → setItem(디바운스 없음). 세트 저장: { name, options }를 sets에 추가, lastSetName = name. 세트 로드: 옵션 교체, lastSetName = name, 휠 재렌더.
- **i18n**: 모든 UI 크롬은 tools.roulette.*(ko/en): 라벨·버튼·도움말·placeholder. 옵션 이름은 사용자 입력(로케일 무관).

## 에러 처리

- **옵션 검증**: 빈 라벨 → 토스트 "옵션 이름을 입력하세요" + 입력 포커스; 중복 라벨(대소문자 무시) → 토스트 "이미 있는 옵션입니다" + 포커스; 옵션 <2 → 스핀 버튼 비활성 + 툴팁 "옵션이 2개 이상 필요해요"; 옵션 >30 → 토스트 "최대 30개까지 추가 가능합니다" + 추가 차단.
- **스토리지**: 프라이빗 모드/쿼터 → localStorage 조용히 실패, 인메모리로 계속(완전 사용 가능, 비지속); 손상 blob → JSON/zod 실패 시 fresh 시작(throw 없음).
- **사운드 폴백**: Web Audio 컨텍스트 실패 → 무음 폴백(애니메이션 계속).
- **에러 바운더리**: 플랫폼이 도구를 감쌈; 렌더 실패 → 셸 크래시 없이 재시도.

## 미학 가이드라인

- **원천**: CRITICAL — DESIGN.md가 토큰 단일 진실. 아래는 도구별 적용.
- **액센트**: 카테고리 액센트는 ROSE(var(--accent-rose) / var(--accent-rose-soft)) — DESIGN상 "random" 카테고리 정체성. 슬라이스는 채도 rose + 미세 틴트 변화; 당첨 강조 2px rose 외곽선 + 글로. CTA(스핀 버튼 등 주 액션)는 DESIGN 원칙대로 브랜드 honey-gold var(--brand) 유지(액센트=정체성, 액션 아님).
- **휠 디자인**: 슬라이스는 rose 액센트로 회전·강조; 중앙 라벨 비회전; 틱 마크로 시각 리듬. 그라데이션·3D 효과 금지 — 깔끔한 2D SVG.
- **타이포그래피**: H1 Gmarket Sans(clamp 28–40px); UI Pretendard 15–16px/500; 버튼 라벨 Pretendard 15px/600.
- **모션**: transform: rotate(휠 스핀), scale/opacity(컨페티), opacity(결과 페이드). 전부 ease-out. prefers-reduced-motion 존중(transform 없음 → 즉시 공개 + fade만).
- **반응형**: 데스크톱 ≥1024px: 2분할(휠 50% | 컨트롤 50%); 태블릿 768–1023px: 스택, 휠 위; 모바일 <768px: 단일 컬럼, 전폭 휠(컨테이너 스케일), 컨트롤 아래. SVG viewBox 반응형. 터치 타깃 ≥44px.
- **접근성**: 옵션 입력 라벨(aria-label), 스핀 버튼 라벨; 결과 패널 제목(aria-live="polite" 공지). 가시적 focus-visible 2px rose 링. 색상 단독 구분 금지. WCAG 2.1 AA 대비.

## 보안 고려사항

- **입력**: 옵션 라벨은 텍스트 입력, React 렌더 이스케이프(dangerouslySetInnerHTML 없음); 세트 이름은 순수 텍스트; 가중치는 zod 범위 검증(1–1000) 후 상태 반영.
- **프라이버시**: 네트워크 호출 없음; localStorage만, 서버 전송 없음; 어떤 분석 이벤트에도 옵션 내용 미포함.
- **콘텐츠 무결성**: 랜덤 선택은 crypto API(시드 없음, 예측 불가); 다수 스핀에 걸쳐 공정.

## 고급 기능

- **당첨자 제거 모드**: 활성 시 "다시 돌리기"가 직전 당첨자를 제외하고 재스핀 — 같은 휠에서 순차 추첨 가능.
- **사운드 컨트롤**: 스핀/당첨 오디오 피드백 토글 + 음량 슬라이더.
- **세트 지속성**: 이름 붙인 옵션 세트 무제한 저장; 원탭 로드; 로컬 저장으로 리로드에도 유지.
- **밀집 휠 가독성**: 최대 30개 옵션 지원. 슬라이스 라벨은 밀도에 적응: 방사형 + 자동 축소 폰트 + `…` 절단(전체 이름은 aria/`<title>`). LEGEND_THRESHOLD(16) 초과 시 슬라이스는 번호를 달고 번호→전체 이름 범례가 휠 옆에 렌더. 당첨자는 항상 ResultPanel + 중앙 라벨에 전체 크기로 표시 — 밀도가 결과를 가리지 않음.

## 최종 통합 테스트

1. **옵션 추가·스핀·공정 결과**: 옵션 4개("점심"·"카페"·"산책"·"쉬기", 가중치 전부 1) 추가 → 휠이 90° 슬라이스 4개 렌더 → "돌리기" 클릭 → 4s 회전·틱 사운드·결과 공개 → 결과 이름=도착 슬라이스(±1px) → 20스핀 공정 분포(chi-square 통과).
2. **가중치·기하**: A(1)·B(2)·C(3), 합 6 → 슬라이스 각 A=60°, B=120°, C=180° → 60스핀에서 B·C가 A의 ~2배·~3배 당첨(chi-square) → B 가중치 1로 수정 → 슬라이스 각 즉시 재계산.
3. **저장/불러오기·지속성**: 세트 A(4옵션) "점심 추천" 저장 → 카드 표시 → 세트 B(6옵션) "게임" 저장 → "점심 추천" 로드 → 휠 4슬라이스, lastSetName 반영 → 리로드 시 세트 A 자동 로드 → 세트 A 삭제 → localStorage에서 제거.
4. **사운드·설정**: 사운드 ON 스핀 → 틱 10회 + 차임 1회; OFF → 무음; 음량 슬라이더 0–100 → 재생 음량 스케일; "결과 제거" ON → "제거 후 돌리기" 버튼 노출; A 당첨 후 제거 → A가 휠에서 빠지고 잔여로 재스핀.
5. **접근성·reduced-motion**: 키보드 전체 흐름(Tab/Enter/Space); OS reduced-motion ON → 회전 없이 즉시 공개, 컨페티 fade만; axe 위반 0, 버튼 전부 라벨, 포커스 링 가시, 대비 본문 ≥4.5:1 / 대형 ≥3:1.
6. **i18n·SEO·엣지**: /en 전환 → 크롬 영어, 상호작용 동일; HTML에 SoftwareApplication + FAQPage JSON-LD, howTo/FAQ 로컬라이즈, JS 게이트 SEO 콘텐츠 없음; 30개(최대) 추가 → 추가 버튼 비활성, 1개 삭제 → 재활성, 16개 초과 시 번호+범례, 결과 패널은 전체 이름; 빈 라벨 → 토스트 + 미추가; localStorage 쿼터 → 조용한 실패 + 인메모리 계속.

## 성공 기준

- **기능**: ≥2 옵션 공정 스핀; 가중치가 슬라이스 비례 스케일; 100스핀 chi-square p > 0.05; 저장/불러오기 리로드 지속; 당첨자 제거 모드 동작; 사운드 토글+음량 동작.
- **UX**: 스핀 ≤5s 애니메이션 + 즉시 결과; 완전한 키보드 탐색; ≥44px 탭 타깃; 가시 포커스; <320px 무 overflow; 사운드 선택적.
- **기술 품질**: lib/roulette/* 순수 ≥80% 유닛 커버리지(geometry·random·sets); TS 0 에러; 파일당 <800줄; 컨페티 순수 JS(의존성 0); Web Audio 우아한 폴백.
- **시각 디자인**: DESIGN.md 준수; 슬라이스+당첨 강조에 rose 정체성; 타이포 전 크기 가독.
- **접근성**: 완전 키보드(Tab/Space/Enter); aria-live 결과 공지; 가시 포커스 2px rose 링; WCAG 2.1 AA; prefers-reduced-motion fade 전용.
- **성능**: 플랫폼 예산 내; 스핀 60fps CSS 애니메이션; <50ms 추가/편집 지연; localStorage 읽기 <10ms; LCP < 2.5s.

## 빌드 산출물

플랫폼의 일부로 빌드(pnpm build). `/[locale]/tools/roulette`는 레지스트리(status "live")를 순회하는 플랫폼 generateStaticParams가 프리렌더.

## 핵심 구현 노트

- **크리티컬 패스**: ① 공정 랜덤 선택(crypto.getRandomValues, 휠 각도 독립) ② SVG 슬라이스/라벨 기하 ③ CSS rotate 애니메이션(4s ease-out) + reduced-motion 즉시 ④ Web Audio 컨텍스트 생애주기 + 폴백 ⑤ localStorage 불변 지속(변경마다, 디바운스 없음).
- **권장 구현 순서**: ① lib/roulette 도메인 TDD(기하 각도·공정 추첨 chi-square·불변 연산) ② useRoulette 훅 ③ WheelSVG ④ OptionList + SpinButton ⑤ ResultPanel + 컨페티 ⑥ SaveLoadPanel·SettingsPanel ⑦ 키보드·모션·a11y ⑧ Intro/HowTo/Faq + JSON-LD ⑨ 레지스트리 live·라우트 분기·E2E 1–6·시각 회귀.
- **테스트 전략**: Vitest ≥80%: 기하(슬라이스 각·라벨 위치), 랜덤(100스핀 chi-square 공정성), 불변 세트 연산; 컴포넌트 테스트로 휠 SVG 렌더+강조; E2E 시나리오 1–6(특히 공정 분포 #2 + 지속성 #3); axe 접근성; reduced-motion 시각 검증.
