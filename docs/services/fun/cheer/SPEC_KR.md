# 모두의 응원 — 대형 응원 문구 디스플레이 — 서비스 SPEC

> 이 문서는 영문 정본 [`SPEC.md`](SPEC.md)의 **국문 번역**이다. 둘 중 하나가 바뀌면 함께 갱신한다. AI 코딩 에이전트는 영문 `SPEC.md`를 정본으로 소비한다.
>
> **모두의 응원**(codename `cheer`) — 입력한 문구를 화면 가득 큰 글씨로 띄워 콘서트·스포츠 경기·이벤트에서 눈에 띄게 응원하는 도구. 사용자는 문구를 입력(또는 프리셋 선택)하고 색상·효과·크기를 고른 뒤, 스크롤(마퀴)·점멸·네온으로 크게 표시한다. 가로모드 회전과 전체화면으로 폰을 LED 전광판처럼 흔들 수 있다. 전 과정 클라이언트 사이드 — 라우팅·리로드·백엔드 없음. 저장은 localStorage(최근 문구 + 마지막 설정). 모션은 compositor 친화(`transform`/`opacity`), `prefers-reduced-motion`이면 정적 배너.
>
> 내부 코드명 `cheer` · 레지스트리 id `cheer` · 공개 슬러그 `/[locale]/tools/cheer`.
>
> 이 SPEC은 도구 자체를 다룬다. 플랫폼 셸·레지스트리·SEO/광고 인프라·디자인 토큰은 제공된다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인: [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참조 형제 SPEC: [`docs/services/random/roulette/SPEC.md`](../../random/roulette/SPEC.md)

## 개요

모두의 응원은 짧은 메시지를 콘서트·경기장·이벤트에서 흔들 수 있는 대형 디스플레이로 바꾼다. 문구를 입력(또는 "앵콜!"·"화이팅!" 같은 큐레이션 프리셋 탭)하고, 글자색+배경색을 고르고, 효과(정적/스크롤/점멸/네온)를 선택하고, 글자 크기를 조절한 뒤 표시한다. 문구가 대형 패널을 가득 채우고, 한 번 탭하면 진짜 전체화면으로 진입하며, 가로모드 회전을 켜면 옆으로 든 폰이 넓은 LED 배너가 된다. 화면 꺼짐 방지(Wake Lock)로 응원 중 화면이 꺼지지 않는다. 전 과정이 **단일 페이지 SPA** — 라우트 변경·전체 리로드 없음.

**핵심(클라이언트 전용, SSG):** 100% 클라이언트. 백엔드·DB·API·네트워크 호출 없음. 저장은 localStorage(최근 문구 + 마지막 설정)뿐. 효과는 compositor 친화 CSS(마퀴=`transform: translateX`, 점멸=`opacity`, 네온=`text-shadow`, 가로모드=`transform: rotate(90deg)`). `prefers-reduced-motion`이면 애니 끄고 정적 배너. 전체화면(Fullscreen API)·화면 꺼짐 방지(Screen Wake Lock API)는 기능 감지 후 미지원 시 우아하게 폴백.

**핵심(SPA, 사용성 최우선):** 모든 Jurepi 도구는 클라이언트 SPA. 입력·색상/효과 선택·표시·전체화면이 전부 React 상태에서 일어나고 라우트 이동·리로드 없음. 라우트는 SEO용 SSG, 상호작용은 단일 클라이언트 컴포넌트 섬. **모바일 사용성이 최우선** — 이 도구는 현장에서 주로 폰으로 쓰인다.

## 플랫폼 통합

- 라우트: `/[locale]/tools/cheer` (SSG; 슬러그·id "cheer", 승인 후 status "live", accent "coral", 카테고리 "fun").
- 플랫폼 제공: 앱 셸(Header/Footer/로케일·테마), ConsentBanner, AdSlot, Toast, 디자인 토큰, i18n 런타임, Error Boundary, `lib/seo.ts`, breadcrumb·in_content 광고 래퍼, ShareButtons(라우트 템플릿).
- 소비: i18n 네임스페이스 `tools.cheer.*` (UI 크롬 문자열·프리셋 라벨 — 사용자가 직접 입력한 메시지는 제외).
- 플랫폼 의존(새 카테고리 불필요): `'fun'` 기존. 플랫폼 변경은 `ToolMeta` 1개·`TOOL_ICONS` 아이콘 1개(`Megaphone`)·라우트 slug 분기·`generateMetadata` 분기뿐.

## 범위 경계

**in_scope**
- 메시지 입력: 자유 텍스트(1..80자), plain text, 입력 즉시 미리보기
- 프리셋 문구 라이브러리: 상황별(콘서트/스포츠/생일/이벤트) 큐레이션 응원 문구, 원탭 입력, ko/en 라벨
- 효과: 정적 | 스크롤(가로 마퀴, 속도 조절) | 점멸 | 네온 — 한 번에 하나
- 스크롤/점멸 속도(느림/보통/빠름)
- 색상: 글자색+배경색(DESIGN 토큰 팔레트) + 저대비 경고(차단 아님)
- 글자 크기(S/M/L/XL)
- 가로모드 회전(90°) 토글
- 전체화면(Fullscreen API, 기능 감지, 미지원 시 인페이지 최대화 폴백)
- 화면 꺼짐 방지(Screen Wake Lock, 기능 감지, visibilitychange 재획득, 미지원 시 토글 숨김)
- 최근 문구(localStorage 최대 N개, 원탭 복원)
- 반응형(320/375/768/1024/1440), 한 손 조작
- 도구별 SEO 롱폼 + FAQ(FAQPage JSON-LD), SoftwareApplication JSON-LD, ko/en
- 접근성 WCAG 2.1 AA, focus-visible, ARIA, 대비, reduced-motion 정적 폴백

**out_of_scope**
- 앱 셸·헤더/푸터·로케일·테마·동의·광고·sitemap/robots·레지스트리(전부 플랫폼)
- 다중 사용자/실시간 동기화(단일 기기 디스플레이 — 서버가 필요한 #25 온라인 빙고와 대조)
- 이미지/로고 배경 업로드
- 명명된 "응원 세트" 저장·계정(가벼운 최근 문구 이력만)
- 배너 이미지/영상 내보내기(Phase 2 후보)
- 소리 효과(응원 배너는 무음이 기본)
- URL 파라미터로 사전 채운 배너 공유(Phase 2 후보)

**future_considerations**
- 쿼리 파라미터 배너 공유(?text=&color=) — Phase 2
- PNG/GIF 내보내기 — Phase 2
- 커스텀 배경 이미지 — Phase 3
- 여러 줄/스택 메시지 — Phase 3
- 무지개 그라데이션 효과 — Phase 3

## 기술 스택

- **상속:** Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN 토큰, next-intl(ko/en).
- **디스플레이:** 대형 텍스트 DOM. 마퀴=`transform: translateX(100%→-100%)` 키프레임(속도→duration). 점멸=`opacity` 키프레임. 네온=`text-shadow` 다층 글로우(무모션, reduced-motion에서도 동작). 가로모드=`transform: rotate(90deg)` + 너비/높이 스왑. 모든 모션 `prefers-reduced-motion` 게이트(정적 배너).
- **전체화면:** Fullscreen API(`requestFullscreen`/`exitFullscreen`), `document.fullscreenEnabled` 감지. 미지원(구형 iOS Safari) 시 fixed 오버레이 최대화 폴백. `fullscreenchange`로 UI 동기화.
- **Wake Lock:** `'wakeLock' in navigator` → `navigator.wakeLock.request('screen')`. 화면 비가시 시 자동 해제되므로 디스플레이 활성 중 `visibilitychange`에 재획득. 미지원 시 토글 숨김. 코어 동작 절대 차단 안 함.
- **저장:** localStorage `jurepi-cheer`: { version, recents: string[], lastSettings }. 마운트 시 zod 파스→prune→상태; 실패 시 fresh(throw 없음). recents는 표시 시, 설정은 변경 즉시 쓰기.
- **입력 안전:** 메시지는 controlled input, 텍스트 노드 렌더(dangerouslySetInnerHTML 금지), 길이 제한.
- **라이브러리:** zod v3(기존). **신규 의존성 0** — 전체화면·Wake Lock·효과 모두 네이티브 웹 API·CSS.

## 파일 구조

```
src/
├── lib/cheer/                     # 순수 도메인(react/next 미import)
│   ├── schema.ts                  # zod: CheerSettings, StoreSchema
│   ├── presets.ts                 # 상황별 프리셋 문구 상수(id+situation; 라벨은 i18n)
│   ├── recents.ts                 # 불변 ops: addRecent(MRU·dedup·cap), pruneRecents
│   ├── sanitize.ts                # normalizeMessage, isValidMessage
│   └── contrast.ts                # 대비비 계산 → 저대비 가드
├── components/tools/cheer/
│   ├── Cheer.tsx                  # 오케스트레이터('use client'); useCheer() 소유; localStorage부 mounted 게이트
│   ├── useCheer.ts                # 훅: 설정·recents·프리셋·persist
│   ├── CheerInput.tsx             # 메시지 필드 + 최근 칩
│   ├── CheerPresets.tsx           # 상황 탭 + 프리셋 칩
│   ├── CheerControls.tsx          # 효과·속도·색상·크기·가로모드·전체화면·화면유지
│   ├── CheerDisplay.tsx           # 대형 배너(마퀴/점멸/네온/정적, 가로모드, 전체화면 타깃)
│   ├── useFullscreen.ts           # Fullscreen + Wake Lock 기능감지 래퍼(재획득 포함)
│   ├── CheerHowTo.tsx             # SEO 롱폼(게이트 밖 SSR)
│   ├── CheerFaq.tsx               # FAQPage JSON-LD 단일 소유
│   └── CheerStructuredData.tsx    # SoftwareApplication JSON-LD(url==canonical)
└── i18n/messages/{ko,en}.json     # tools.cheer.*
```
Intro는 공유 `ToolIntro`(i18n intro.*) 재사용.

## 핵심 데이터

- **CheerSettings:** text(1..80), textColor(스와치 id), bgColor, effect('static'|'scroll'|'flash'|'neon', 기본 scroll), speed('slow'|'medium'|'fast', 기본 medium), size('S'|'M'|'L'|'XL', 기본 L), landscape(bool, 기본 false). 불변 업데이트.
- **CheerStore:** version(STORE_VERSION=1), recents(최대 MAX_RECENTS, MRU·dedup), lastSettings. key `jurepi-cheer`. 읽기 zod 파스, 실패 시 fresh, 미지 필드 prune.
- **PresetPhrase:** id(예 "sports.one-more-goal"), situation('concert'|'sports'|'birthday'|'event'). 라벨은 i18n `tools.cheer.presets.<situation>.<id>`(상수엔 id+situation만 — canonical 값이 로케일 정확).
- **상수:** MIN_LEN=1, MAX_LEN=80, MAX_RECENTS=10; SCROLL_MS={slow:12000,medium:8000,fast:4000}; FLASH_MS={slow:1200,medium:700,fast:350}; SIZE_SCALE={S:'clamp(2rem,10vw,4rem)',M:'clamp(3rem,14vw,6rem)',L:'clamp(4rem,20vw,9rem)',XL:'clamp(5rem,28vw,14rem)'}; MIN_CONTRAST=3.0(경고).

## 라우트

- `/:locale/tools/cheer` 단일 라우트. locale ∈ {ko,en}. 플랫폼 generateStaticParams가 레지스트리(status "live") 순회 SSG. 동적 파라미터·메시지별 라우트 없음.

## 컴포넌트 계층

```
<cheer>  ('use client'; 설정+recents 소유; useCheer())
  <ToolIntro/>          (eyebrow+H1+lead, SSR, i18n intro.*)
  <layout>
    <cheer_display/>    (현재 설정 반영 라이브 배너; 전체화면/가로모드 타깃)
    <control_column>
      <cheer_input/>    (메시지 필드 + 최근 칩)
      <cheer_presets/>  (상황 탭 + 프리셋 칩)
      <cheer_controls/> (효과·속도·색상·크기·가로모드·전체화면·화면유지)
  <cheer_how_to/>       (SEO 롱폼, 게이트 밖 SSR)
  <cheer_faq/>          (FAQPage JSON-LD, 게이트 밖 SSR)
```

## 화면·인터페이스 (요약)

- **ToolIntro:** Eyebrow "재미 도구"/"FUN TOOL"; H1 "모두의 응원"/"Everyone's Cheer"; Lead "응원 문구를 크게 띄워 콘서트·경기장에서 눈에 띄게 응원하세요."/"Show your cheer message big — wave it like an LED banner at concerts and games."
- **CheerDisplay:** 대형 패널, 배경=bgColor 스와치, 글자=textColor 스와치. `settings.text`를 SIZE_SCALE[size]로 텍스트 노드 렌더, 비었으면 힌트. 효과별 애니(정적/스크롤/점멸/네온), 가로모드 rotate(90°), 전체화면 버튼이 이 패널 타깃(미지원 폴백 오버레이). reduced-motion 시 스크롤/점멸 정적. a11y: `aria-label`로 메시지 announce.
- **CheerInput:** 라벨 "응원 문구"/"Cheer message", 필드(max 80, placeholder "예: 우리 팀 우승!"). **draft 바인딩**(타이핑 유실 없음). 최근 칩 행(원탭 복원, 빈 상태 숨김). "지우기"/"Clear".
- **CheerPresets:** 상황 탭(roving tabindex) 콘서트/스포츠/생일/이벤트. 활성 탭 아래 프리셋 칩(i18n), 탭 시 입력 세팅. 키보드 포커스·focus-visible.
- **CheerControls:** 효과 세그먼트(활성=`bg-brand text-on-brand`, 비활성=`bg-surface-muted`); 속도 세그먼트(정적/네온일 때 비활성); 글자색·배경색 스와치(저대비 경고 칩); 크기 S/M/L/XL; 가로모드 토글(aria-pressed); 전체화면 버튼(미지원 시 폴백); 화면유지 토글(미지원 시 완전 숨김, 활성 상태 표시).
- **키보드:** Tab 이동(focus-visible), Enter(메시지 커밋→recent), 세그먼트/탭 방향키 roving, Esc 전체화면 종료.

## 핵심 기능

- **디스플레이:** 배너는 항상 현재 설정 라이브 반영(별도 apply 불필요; 전체화면이 "크게 보기" 액션). 마퀴 duration=SCROLL_MS[speed], 점멸=FLASH_MS[speed], 크기=SIZE_SCALE[size]. 가로모드 rotate(90°)+치수 스왑.
- **전체화면+WakeLock:** 진입 시 화면유지 켜져있고 지원되면 락 획득. `visibilitychange`로 복귀 시 재획득(브라우저 자동 해제). 종료 시 해제. 전부 기능 감지, 미지원 시 버튼 숨김/폴백, 배너는 정상.
- **프리셋:** 상수는 {id, situation}, 라벨은 렌더 시 i18n 해석. 탭 시 settings.text 세팅(표시/커밋 전엔 recents 미추가).
- **persist:** 마운트 시 복원, 설정 변경 즉시 쓰기, 커밋 시 addRecent(MRU·dedup·cap).
- **i18n:** UI 크롬·프리셋 라벨 전부 `tools.cheer.*`(ko/en). 사용자 메시지는 로케일 무관 입력. 표시되는 계산 문자열(예 "지원 안 함")도 t() — 하드코딩 금지.

## 에러 처리

- 빈 메시지 → 힌트 표시(전체화면 허용). MAX_LEN 초과 → maxLength 하드캡 + 카운터. plain text만(텍스트 노드).
- Fullscreen 미지원 → 네이티브 버튼 숨김, fixed 오버레이 최대화 폴백, throw 없음.
- Wake Lock 미지원 → 화면유지 토글 완전 숨김.
- 저장 불가(프라이빗/쿼터) → 조용히 실패, recents 메모리만. 손상 blob → fresh(throw 없음).
- Error Boundary가 도구 래핑, 렌더 실패 시 셸 크래시 없이 재시도.

## 미학 지침

- DESIGN 토큰만, 팬텀 토큰 금지. accent=coral(이 도구의 fun 정체성); 브랜드 바이올렛은 단일 액션/CTA 전용; accent≠CTA.
- 디스플레이 패널은 대담·고대비 캔버스 — 채도 높은 색이 요점인 유일한 곳(사용자 선택). 주변 컨트롤은 차분한 토큰 시스템.
- 모션은 compositor 친화만(transform/opacity/text-shadow), reduced-motion 정적. 레이아웃 애니 속성 금지.
- hover/focus/press 디자인, **focus-visible**(맨 focus 금지) `--focus-ring` 토큰.
- 모바일 우선: 한 손 도달, 타깃 ≥44px, 320px 오버플로 없음.

## 보안

- 입력 안전: 텍스트 노드 렌더, dangerouslySetInnerHTML 금지, 길이 제한.
- 프라이버시: 기기 밖으로 아무것도 안 나감 — 네트워크·콘텐츠 분석 없음, recents는 이 브라우저 localStorage에만.
- 시크릿·외부 스크립트·서드파티 호출 없음.

## 최종 통합 테스트

1. "우리 팀 우승!" 입력 → 배너 대형 라이브; 스크롤 효과 좌우 애니.
2. 스포츠 프리셋 탭 → 입력+배너가 프리셋 문구로.
3. 효과 네온 + 검정 배경 코랄 글자 → 글로우 배너; 저대비 쌍(흰 배경 sun 글자) 경고 칩.
4. 가로모드 토글 → 90° 회전; 전체화면 진입 → 패널 화면 가득; Esc 종료.
5. 리로드 → lastSettings + recents 복원; 최근 칩이 메시지 복원.
6. reduced-motion → 스크롤/점멸 정적; en 로케일 → 한글 누수 0; 320px → 오버플로 0; 콘솔 0.

## 성공 기준

- **기능:** 라이브 표시; 4효과 동작; 속도/크기/색/가로모드 적용; 프리셋 로드; 전체화면+WakeLock 기능감지·폴백; recents 지속.
- **UX:** 한 손 모바일; 즉시 미리보기; 큰 타깃; 명확한 활성 상태.
- **기술:** tsc 0; 도메인 ≥90%; 전체 비악화; ko/en 정적 export; 신규 의존성 0.
- **시각:** DESIGN 토큰; coral accent; 팬텀 토큰 0; 대담 캔버스 vs 차분 컨트롤.
- **a11y:** WCAG 2.1 AA; focus-visible; ARIA; reduced-motion 정적; 메시지 announce.
- **성능:** compositor-only 모션; CLS 0; 광고 슬롯 높이 예약(플랫폼).
- **발견성:** 고유 메타 + SoftwareApplication + FAQPage JSON-LD(url==canonical) 프리렌더; answer-first HowTo/FAQ ko/en; 프리셋 라이브러리 콘텐츠; llms.txt 등재; sitemap 자동.

## 구현 노트

- 권장 순서: schema/sanitize/recents/contrast(도메인 TDD) → presets 상수 → useCheer+useFullscreen → CheerDisplay(효과/reduced-motion) → controls/input/presets → SEO 섹션(게이트 밖) → 배선(registry/icon/i18n/route/llms.txt).
- **발견성 비타협:** 메타·JSON-LD·Intro/HowTo/FAQ는 mounted 게이트 **밖** SSR(AI 크롤러 JS 미실행). localStorage/Date 의존부만 게이트.
- **i18n 비타협:** 최상위 `tools.cheer.title`+`description` 필수(홈카드/푸터/검색 소비). 프리셋 라벨·표시 계산 문자열 t().
- **모션 비타협:** transform/opacity/text-shadow만; reduced-motion 정적. width/height/top/left 애니 금지.
- Fullscreen+Wake Lock 기능 감지; visibilitychange 재획득; 미지원 컨트롤 숨김.
- 테스트: 도메인 순수함수 TDD; 컴포넌트는 실 메시지 카탈로그(NextIntlClientProvider, ko AND en)로 렌더해 한글 하드코딩 누수 적발; E2E `cheer.spec`가 표시/효과/프리셋/전체화면토글/지속성/en 커버, pageerror 하드게이트.
