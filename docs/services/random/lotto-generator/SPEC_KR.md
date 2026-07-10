# 로또 번호 생성기 — 한국 로또(6/45) 공정한 추첨 서비스 SPEC

> 이 문서는 AI 코딩 에이전트가 소비하는 **정본 영문 SPEC**([`SPEC.md`](SPEC.md))의 **국문 번역본**입니다. 어느 한쪽이 변경되면 양쪽을 동기화하세요.
>
> **로또 번호 생성기**(로또 번호 생성기) 빌드 명세 — 클라이언트 사이드 도구로, 공정하고 편향 없는 한국 로또(6/45) 추첨을 생성한다. 사용자가 생성할 게임 수를 지정하고(1–10), 선택적으로 럭키 번호(최대 5개, 항상 포함)를 고정하고, 선택적으로 제외 번호(최대 39개, 절대 미포함)를 지정한 뒤, 각 게임당 1–45 범위에서 6개의 고유 번호를 오름차순 정렬로 뽑는다. 공식 한국 로또 볼 색상대(밴드)별로 색칠하고, 복사하고, localStorage 히스토리에 저장하고, 히스토리를 지운다. 전체 상호작용은 클라이언트 사이드: 라우팅 없음, 리로드 없음, 백엔드 없음.
> 내부 서비스 코드네임: `lotto-generator`. 레지스트리 id: `lotto-generator`. 공개 URL 슬러그: `/[locale]/tools/lotto-generator`.
>
> 이 SPEC은 도구 자체를 다룬다. 플랫폼 셸, 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공한다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템: [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고용 형제 도구 SPEC: [`docs/services/random/roulette/SPEC_KR.md`](./roulette/SPEC_KR.md)

## 개요

로또 번호 생성기는 한국 로또 플레이어에게 공정하고 증명 가능하게 무작위로 뽑은 번호를 제공한다. 사용자가 생성할 게임 수(1–10)를 지정하고, 선택적으로 "럭키 번호" 최대 5개를 고정(모든 추첨에 보장 포함)하고, 선택적으로 최대 39개 번호를 제외(절대 미포함)한 뒤, "번호 생성하기"를 눌러 1–45 범위에서 6개의 고유 번호를 게임당 오름차순 정렬로 본다. 각 번호는 공식 한국 로또 볼 밴드(1–10 노랑, 11–20 파랑, 21–30 빨강, 31–40 회색, 41–45 초록)와 일치하는 색상의 공으로 표시된다. 면책 문구는 명시한다: 무작위 생성은 당첨 확률을 높이지 않고, 당첨을 예측하지 않으며, 도박은 위험을 수반한다. 전체 상호작용은 **단일 페이지 SPA**: 라우트 변경 없음, 전체 리로드 없음. 사용자는 모든 게임을 텍스트로 복사하고, localStorage 히스토리(타임스탬프 포함)에 저장하고, 히스토리를 지울 수 있다.

**CRITICAL (공정성, 암호학적)**: 무작위 추첨은 `crypto.getRandomValues` + 거부 샘플링으로 모듈로 편향 없이 생성(Fisher–Yates 부분 셔플 또는 Floyd 알고리즘). 단위 테스트의 카이제곱 균일성 검사는 많은 독립 추첨에서 1–45의 각 번호가 동등하게 가능함을 단언한다. 알고리즘과 공정성 불변식은 양보할 수 없다.

**CRITICAL (클라이언트 전용, SSG)**: 100% 클라이언트 사이드. 백엔드·데이터베이스·API 없음. 유일한 지속성은 localStorage(추첨 히스토리 + 최신 설정). 생성 시 라우팅 또는 전체 페이지 리로드 없음.

**CRITICAL (SPA, 사용성 최우선)**: 모든 Jurepi 도구는 클라이언트 사이드 SPA다. 생성·복사·저장·히스토리 지우기 등 상호작용은 전부 React 상태에서 일어나며 라우트 이동과 전체 페이지 리로드가 없다. 라우트는 SEO를 위해 정적 생성(SSG)되고, 인터랙티브 도구는 단일 클라이언트 컴포넌트 섬이다.

## 플랫폼 통합

- 라우트: `/[locale]/tools/lotto-generator` (SSG; 레지스트리 slug `lotto-generator`, id `lotto-generator`, status `coming_soon`, accent `sun`, category `random`).
- 플랫폼 제공: 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈을 감싸는 Error Boundary, lib/seo.ts 메타데이터 빌더, 브레드크럼 + in_content 광고 래퍼.
- 소비: i18n 네임스페이스 `tools.lotto-generator.*` (UI 크롬 문자열: 라벨·버튼·도움말·에러 메시지·면책).
- 플랫폼 의존(새 카테고리 불필요): `'random'` 카테고리는 이미 `sun` 액센트와 "랜덤·추첨"/"Random" 라벨로 존재한다. 플랫폼 변경은 `ToolMeta` 레지스트리 항목 1개, 도구 라우트의 slug→컴포넌트 분기, `generateMetadata` 분기 추가뿐이다.

## 범위 경계

### 범위 내
- N개 게임 생성(1–10 입력, 스피너 또는 텍스트; 기본값 1)
- 고정 번호(최대 5개): 선택적; 항상 모든 추첨에 포함
- 제외 번호(최대 39개): 선택적; 절대 미포함; 검증: 45 − 제외 ≥ 6 − 고정 ≥ 0(가능성 검사; 불가능 시 충돌 에러 표시)
- 게임당: 1–45 범위에서 6개 고유 번호, 오름차순 정렬, 공식 볼 색상 표시(1–10 노랑, 11–20 파랑, 21–30 빨강, 31–40 회색, 41–45 초록)
- 공정성 불변식: crypto.getRandomValues + 거부 샘플링(모듈로 편향 없음), 단위 테스트의 카이제곱 균일성 검사(단언: 각 번호 동등 확률)
- 공 애니메이션 표시(하나씩 팝 음향으로 공개; reduced-motion = 즉시)
- 모든 게임을 평문으로 복사(예: "Game 1: 2, 7, 18, 34, 41, 44")
- localStorage에 저장: 지난 추첨 히스토리(타임스탐프, 게임 수, 고정/제외), 최대 20개 항목
- 히스토리 지우기 버튼
- 키보드 탐색: Tab으로 입력/버튼 이동, Enter로 생성
- 반응형(320/375/768/1024/1440): 그리드 적응; 컨트롤 스택 전환
- 도구별 SEO 롱폼 + FAQ(FAQPage JSON-LD), SoftwareApplication JSON-LD, ko/en 로컬라이즈
- 책임감 있는 면책(보이는 UI 섹션 + FAQ): 도박 위험, 무작위 생성이 당첨 확률을 높이거나 당첨을 예측하지 않음
- 접근성: WCAG 2.1 AA, 가시적 포커스, ARIA 라벨, 색 대비(공이 흰 배경에서 4.5:1 충족)

### 범위 외
- 앱 셸, 헤더/푸터, 로케일 스위처, 테마 토글, 동의 배너, 광고 로딩, sitemap/robots, 도구 레지스트리(전부 플랫폼)
- 기존 로또 추첨 데이터 조회(외부 데이터 통합)
- 당첨 확률 계산기 또는 당첨 예측
- 사용자 취향별 커스텀 공 색상
- 특정 추첨 설정 공유(Phase 2 후보, 라우트당 고유 링크)
- 백엔드 동기화 / 기기 간 지속성

### 향후 고려
- 기존 한국 로또 추첨 데이터 통합(Phase 2, 외부 API 필요)
- 고정/제외 번호 편집 undo/redo 스택(Phase 2)
- 통계 대시보드(모든 추첨에서 번호 빈도)(Phase 3)
- 공유 가능한 추첨 링크(Phase 2)

## 기술 스택

- **상속**: Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl(ko/en) — 전부 플랫폼에서 상속.
- **무작위 생성**: crypto.getRandomValues → 균일 float [0, 1) × 범위 → 거부 샘플링(유효 범위 밖이면 재샘플, 모듈로 편향 없음). Fisher–Yates 부분 셔플 또는 Floyd 알고리즘으로 제외 제거, 고정 사전 선택된 유효 집합에서 6개 고유 번호를 편향 없이 선택. 많은 독립 추첨에서 1–45의 각 번호가 동등하게 표본화됨을 vitest로 단언하는 카이제곱 적합도 검사.
- **공 색상**: 공식 한국 로또 볼 밴드: 1–10 노랑(var(--accent-sun)), 11–20 파랑(var(--accent-sky)), 21–30 빨강(var(--accent-coral)), 31–40 회색(var(--surface-sunken), 텍스트 var(--text)), 41–45 초록(var(--accent-mint)). 모두 44px 원, 600 폰트 가중치, var(--text) 또는 var(--on-brand) 명도 안전 텍스트 중앙.
- **애니메이션**: 공 공개: 계단식 팝인(scale 0→1 + fade 0→1) 150ms당 공, 100ms 계단(총 6개 공 ~900ms). 사운드: Web Audio API 비프 팝음. reduced-motion: 모든 공 즉시 나타남, 음향 없음.
- **지속성**: localStorage 키 `jurepi-lotto-generator`: `{ version, history: [{timestamp, gameCount, fixedNumbers, excludedNumbers, games}, ...], lastSettings: {gameCount, fixedNumbers, excludedNumbers} }`. 마운트 시 읽기 → zod 파싱 → pruneUnknown(history, 여전히 가능한지 검증). 생성과 설정 변경마다 쓰기(디바운스 없음 — 즉시 동기화).
- **입력 안전**: 게임은 평문으로만 렌더(HTML 없음). "복사" 버튼은 navigator.clipboard.writeText 또는 폴백(dangerouslySetInnerHTML 없음).
- **라이브러리**: zod v3.x(레포 기존)로 번호·추첨·히스토리 스키마 및 localStorage 검증; 사운드는 네이티브 Web Audio API(라이브러리 없음).

## 파일 구조

```text
src/
├── lib/lotto-generator/                # 순수 도메인 계층 (React/Next 없음)
│   ├── schema.ts                       # zod: Draw, Settings, HistoryEntry, Store (version, history, lastSettings)
│   ├── random.ts                       # fairDraw(고정, 제외, rng) → crypto 거부 샘플링 기반 6번 추첨; 카이제곱 테스트 헬퍼
│   ├── colors.ts                       # ballColor(번호) → (bg CSS 클래스, text CSS 클래스) 1–45 밴드
│   ├── validate.ts                     # isDrawFeasible(고정카운트, 제외카운트) → boolean; conflicts(고정, 제외) → 에러 메시지 또는 null
│   └── history.ts                      # 불변 연산: addHistory, pruneUnknown, clearHistory
├── components/tools/lotto-generator/
│   ├── LottoGenerator.tsx              # 클라이언트 컴포넌트; gameCount·fixedNumbers·excludedNumbers·games·history 상태 소유
│   ├── useLottoGenerator.ts            # 훅: 추첨 생성, localStorage 지속성, 히스토리
│   ├── BallDisplay.tsx                 # 단일 44px 공: 색, 번호, 팝 애니메이션, ARIA 라벨
│   ├── GameList.tsx                    # 생성된 모든 게임 렌더(게임당 공), 전체 복사 버튼
│   ├── HistoryPanel.tsx                # 지난 추첨 표시(타임스탐프, 상세), 지우기 버튼; 빈 상태
│   ├── SettingsPanel.tsx               # 게임 수(1–10), 고정 번호(0–5), 제외 번호(0–39), 가능성 경고
│   ├── LottoIntro.tsx                  # H1 + 리드 (SEO; 가능한 한 서버 렌더)
│   ├── LottoHowTo.tsx                  # "사용 방법" / "공정성 보장" (SEO 롱폼)
│   ├── LottoFaq.tsx                    # Q&A 포함 "당첨될 수 있나?" + 책임감 면책 + FAQPage JSON-LD
│   └── ResponsibilityDisclaimer.tsx    # 저명한 면책: 무작위 생성이 당첨을 예측하지 않음, 도박 위험 수반
└── i18n/messages/{ko,en}.json          # tools.lotto-generator.* UI 크롬, 면책, 에러 메시지
```

## 핵심 데이터 엔티티

- **Draw**: `fixedNumbers`(0–5 고유 번호 1–45, 선택적; 항상 모든 게임에 포함), `excludedNumbers`(0–39 고유 번호 1–45, 선택적; 절대 미포함), `games`(게임당 6개 고유 정렬 번호 1–45, 고정/제외 존중). 불변: 업데이트는 새 객체/배열 반환, 절대 in-place 변경 금지.
- **Settings**: `gameCount`(1–10, 필수), `fixedNumbers: number[]`, `excludedNumbers: number[]`.
- **HistoryEntry**: `timestamp`(ISO 문자열), `gameCount`, `fixedNumbers`, `excludedNumbers`, `games`.
- **LottoStore**: `version`(STORE_VERSION = 1), `history`(HistoryEntry[], 최대 20; 오래된 항목부터), `lastSettings`(가장 최근 사용자 입력, 마운트 시 복원). localStorage 키: `jurepi-lotto-generator`. 불변식: 읽기는 zod 파싱; 실패 → fresh 시작(throw 없음). pruneUnknown 로드 후(미사용/유효하지 않은 항목 버림).
- **상수**: GAME_COUNT_MIN = 1, GAME_COUNT_MAX = 10; FIXED_MAX = 5, EXCLUDED_MAX = 39; LOTTO_MIN = 1, LOTTO_MAX = 45, NUMBERS_PER_GAME = 6; HISTORY_MAX = 20; BALL_POP_DURATION_MS = 150, BALL_STAGGER_MS = 100; BEEP_FREQ_HZ = 900.

## 라우트 정의

- 공개 라우트: `/:locale/tools/lotto-generator` (플랫폼 도구 라우트가 slug→컴포넌트 분기). 단일 라우트, locale ∈ {ko, en}. 플랫폼 generateStaticParams가 레지스트리(status "live")를 순회해 SSG. 이 도구는 status "coming_soon"이므로 사전 SSG 안 됨; status 변경 후 live가 됨.

## 컴포넌트 계층

```text
<LottoGenerator>                  ← "use client"; gameCount·fixedNumbers·excludedNumbers·games·history 상태 + useLottoGenerator() 소유
  <LottoIntro />                  ← H1 + 리드 (가능한 한 서버 렌더)
  <ResponsibilityDisclaimer/>     ← 저명한 경고: 무작위, 당첨 예측 미포함, 도박 위험
  <레이아웃 그리드>                ← 데스크톱 2분할(결과 | 설정), 모바일 스택
    <결과 컬럼>
      <GameList />                ← 모든 게임 표시, 행당 1게임, 공 색칠됨; 전체 복사 버튼
      <HistoryPanel />            ← 지난 추첨 타임스탐프, 지우기 버튼; 빈 상태
    <설정 컬럼>
      <SettingsPanel />           ← 게임 수(1–10), 고정 번호(0–5), 제외 번호(0–39); 가능성 체크; 생성 버튼
  <LottoHowTo />                  ← SEO 롱폼
  <LottoFaq />                    ← FAQPage JSON-LD
```

## 페이지·인터페이스

**LottoIntro**: 아이브로 "랜덤·추첨" / "RANDOM" (12px/700/0.6px, var(--brand-ink)); H1 "로또 번호 생성기" / "Lotto Number Generator" (Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)); 리드 "공정하게 로또 번호를 만들어드립니다. 당첨을 보장하지는 않습니다." / "Generate fair lottery numbers with cryptographic randomness. No odds guarantee — for entertainment only."

**BallDisplay**: 크기 44px 원; 폰트 600 흰색/어두운 텍스트 중앙. 색 매핑: 1–10 bg-accent-sun / 11–20 bg-accent-sky / 21–30 bg-accent-coral / 31–40 bg-surface-sunken text-text / 41–45 bg-accent-mint. 애니메이션: 팝(scale 0→1 + fade 0→1) 150ms 입장; 100ms 계단식; reduced-motion = 즉시. 접근성: role="img", aria-label="공 {번호}" (예: "공 23").

**GameList**: 제목 "생성된 번호" / "Generated Numbers" (18px var(--text) 700); 게임당 행: "게임 {N}:" 뒤 6개 색칠된 공 행, 공 좌측정렬. 복사 버튼(게임당 또는 전체): outline rose, clamp(16px,2vw,18px), "복사" / "COPY"; 복사 시 토스트. 빈 상태(게임 미생성): "번호를 생성해보세요." / "Generate numbers to get started."

**SettingsPanel**: 섹션: 게임 수, 고정 번호, 제외 번호; 가능성 표시기. **게임 수**: 라벨 "생성할 게임 수" / "Number of Games"; 스피너 또는 number 입력, 1–10, 기본값 1; 표시 "1게임"–"10게임" / "1 game"–"10 games". **고정 번호**(선택적, 0–5): 라벨 "매번 포함할 번호 (최대 5개)" / "Always Include (up to 5)"; 입력 5개 텍스트 필드 또는 chip-추가 UI; 번호당 제거 버튼. 가능성: (고정 수 + 제외 수 > 39) → 충돌 경고. 도움말: "선택한 번호는 모든 게임에 포함됩니다." / "These numbers will appear in every game." **제외 번호**(선택적, 0–39): 라벨 "제외할 번호 (최대 39개)" / "Never Include (up to 39)"; 입력 chip-추가 UI; 번호당 제거 버튼. 가능성 검사: 45 − 제외 수 ≥ 6 − 고정 수 ? 유효 : 에러 "충분한 번호를 선택할 수 없습니다." / "Not enough numbers available to generate games." **생성 버튼**: 주 CTA, var(--brand) bg, var(--on-brand) 텍스트, 56px 높이, 둥근 lg. 라벨 "번호 생성하기" / "GENERATE". 불가능하거나 gameCount < 1 또는 gameCount > 10이면 비활성.

**ResponsibilityDisclaimer**: 저명한 콜아웃(var(--surface-sunken) bg, rose-soft 테두리, rose 텍스트), ~16px 본문. 텍스트(i18n): "⚠️ 이 도구가 만든 번호는 완전히 무작위로 생성되며, 당첨 확률을 높이지 않습니다. 로또는 도박이며 도박에는 위험이 따릅니다." / "⚠️ These numbers are randomly generated and do NOT improve your odds. Lottery play carries financial risk."

**HistoryPanel**: 제목 "지난 생성 기록" / "Generation History" (18px var(--text) 700). 빈 상태: "생성 기록이 없습니다." / "No history yet." 항목당: 타임스탐프(상대, "2시간 전" 또는 "2 hours ago"), 게임 수("5게임" / "5 games"), 고정 번호(있으면 chip 목록), 제외 번호(있으면 chip 목록), 펼침/접힘으로 모든 게임 표시. 지우기 버튼: outline rose, "기록 지우기" / "Clear History".

## 핵심 기능

### 추첨 생성 (useLottoGenerator 훅)
1. 사용자가 gameCount, fixedNumbers, excludedNumbers 설정
2. "생성" 클릭
3. 가능성 검증: 45 − 제외 수 ≥ 6 − 고정 수 ?
4. 무효 시 에러 토스트 표시 후 반환
5. 게임마다: fairDraw(고정번호, 제외번호, crypto.getRandomValues) 호출 → 6번 배열(오름차순 정렬됨) 수신 → games 배열에 저장(새 컴포넌트 상태)
6. localStorage에 즉시 저장(디바운스 없음)
7. 히스토리에 추가(타임스탐프, 설정, 게임)
8. 공 팝 애니메이션 트리거

### 게임 복사
- 전체 복사: 모든 게임을 평문으로 평탄화("Game 1: 2, 7, 18, 34, 41, 44\nGame 2: ...") → navigator.clipboard.writeText
- 폴백: Clipboard API 미사용 시 TextArea 선택/복사
- 토스트: "복사되었습니다." / "Copied!"

### 히스토리 관리
- 마운트 시: localStorage에서 로드, 미지 항목 제거(가능성 검증)
- 추가: 새 항목을 맨 앞에 삽입(타임스탐프, 설정, 게임), 최신 20개만 보존
- 지우기: localStorage.removeItem() + 상태 리셋

## 에러 처리
- 유효하지 않은 고정/제외 수: 인라인 검증 에러 표시
- 가능성 충돌(충분한 번호 미확보): 에러 토스트 표시, 생성 비활성화
- Clipboard API 미사용: textarea 선택 폴백
- 손상된 localStorage: zod 파싱 에러 → 항목 무시 + fresh 시작(throw 없음, 침묵 fail-safe)
- 과도한 히스토리 항목: HISTORY_MAX(20)로 트림
- 모든 에러 메시지는 i18n'd (errors.* 네임스페이스)

## 미학 지침
- 공 색상: 공식 한국 로또 밴드(1–10/11–20/21–30/31–40/41–45 범위별 노랑/파랑/빨강/회색/초록)
- 액센트 색: sun(주 CTA, 브랜드 정렬, 카테고리 정체성)
- 타이포: H1/제목엔 Gmarket Sans 700, 본문/입력엔 Pretendard 500/600
- 간격: 넉넉한 둥근모(16–28px), 흰 카드, 부드러운 그림자, 크림 앱 지면(--surface-muted)
- 모션: 계단식 공-팝 애니메이션(각 150ms, 100ms 계단), reduced-motion = 즉시
- 포커스: 가시적 포커스 링(2px var(--focus-ring))
- 명도: 모든 텍스트 배경에 ≥4.5:1; 색칠된 공 위 흰 숫자는 WCAG AA 충족

## 보안 고려사항
- 사용자 생성 콘텐츠 렌더링 없음(모든 UI는 i18n 키에서)
- 외부 데이터 페치 없음; 모든 데이터는 사용자 입력 + crypto에서 결정론적
- localStorage는 사용자 제어(클라 기기만); zod 스키마 검증으로 손상 데이터가 앱을 크래시하지 못함
- 쿠키/추적 없음; 분석은 플랫폼 수준(GTM/GA)
- CSRF/XSS: 해당 없음(100% 클라 SPA, 백엔드 폼 제출 없음)

## 최종 통합 테스트

시나리오 1(정상): 3개 게임 생성, 고정/제외 없음 → 3행에 18개 고유 유효 번호, 각 행 오름차순 정렬, 각 공 범위별 색칠

시나리오 2(고정+제외): [1, 7] 고정, [10–20, 30–40] 제외 → 1개 게임 생성 → 6개 번호, 1과 7 포함, 제외 범위 미포함, 정렬됨

시나리오 3(불가능): [1, 2, 3, 4, 5] 고정, [6–45] 제외(39개) → 생성 클릭 → 에러 "충분한 번호를 선택할 수 없습니다." → 버튼 비활성

시나리오 4(지속성): 2개 게임 생성 → 페이지 리로드 → 히스토리에 1개 항목 표시(2게임), 설정 복원

시나리오 5(책임): 면책이 페이지 로드 시 보이고, FAQ가 "당첨 확률을 높이나? 아니오."를 포함

## 성공 기준
- 게임당 모든 6개 번호는 고유이고 범위 [1, 45] 내
- 번호는 게임당 오름차순 정렬
- 고정 번호는 항상 모든 게임에 나타남(설정된 경우)
- 제외 번호는 절대 미포함
- 카이제곱 검사 통과(추첨 균일성, 편향 없음)
- 공 애니메이션은 reduced-motion 존중
- 복사 기능 작동; 토스트 표시
- 히스토리 리로드 횟수 지속, 최대 20개 항목
- 가능성 검증이 불가능한 설정 방지
- 모든 UI 텍스트 로컬라이즈(ko/en)
- 접근성: WCAG 2.1 AA(포커스, 명도, ARIA 라벨)
- 상호작용 시 레이아웃 변경 없음(CLS <0.1)
- 하이드레이션 안전: useState 초기값에 브라우저 전용 값 미포함

## 빌드 산출물
- app/[locale]/tools/lotto-generator/page.tsx (플랫폼 라우트, LottoGenerator 컴포넌트 호출)
- src/lib/lotto-generator/ (순수 도메인: random.ts, schema.ts, colors.ts, validate.ts, history.ts)
- src/components/tools/lotto-generator/ (React: LottoGenerator.tsx, useLottoGenerator.ts, BallDisplay.tsx, GameList.tsx, SettingsPanel.tsx, HistoryPanel.tsx, LottoIntro.tsx, LottoHowTo.tsx, LottoFaq.tsx, ResponsibilityDisclaimer.tsx)
- src/i18n/messages/ko.json + en.json: tools.lotto-generator.* 네임스페이스
- 단위 테스트: src/lib/lotto-generator/*.test.ts (공정성 카이제곱, 스키마 검증, 히스토리 연산)
- 컴포넌트 테스트: src/components/tools/lotto-generator/*.test.tsx (렌더, 상호작용, localStorage 지속)
- E2E 테스트: tests/e2e/lotto-generator.spec.ts (5 시나리오: 생성, 고정, 제외, 히스토리, 책임 면책)

## 핵심 구현 노트
1. 레지스트리 항목: `{ id: "lotto-generator", slug: "lotto-generator", category: "random", icon: "Dices", accent: "sun", status: "coming_soon", addedAt: "YYYY-MM-DD", order: 150, keywords: [...] }`. Status는 반드시 "coming_soon"(출시 결정까지 "live" 아님).
2. 공정성은 양보할 수 없음: crypto.getRandomValues + 거부 샘플링, vitest의 카이제곱 검사 RED→GREEN.
3. 공 색상은 공식 한국 로또 범위와 정확히 매핑; 흰 배경에서 명도 안전.
4. useLottoGenerator 훅이 모든 상태(gameCount, fixedNumbers, excludedNumbers, games, history)를 소유; 컴포넌트는 프레젠테이션.
5. localStorage 키 `jurepi-lotto-generator`, zod 스키마; 손상 데이터는 침묵 무시(fresh 시작).
6. 로드 시 히스토리 프루닝: 유효하지 않은/불가능한 설정의 항목 제거.
7. TDD 순서: 도메인(random.ts 카이제곱 FIRST), 스키마 검증, 히스토리 연산, 그 다음 컴포넌트 상호작용.
8. ResponsibilityDisclaimer는 항상 그리드 위에 보이고(아코디언 뒤 아님); 설계 의도상 선택적 아님.
9. 외부 데이터 없음; 모든 추첨은 사용자 입력 + 보안 RNG에서 결정론적.
