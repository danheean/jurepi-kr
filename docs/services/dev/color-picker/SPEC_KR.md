# 컬러 피커 & 명도 대비 — 양방향 색상 변환 및 WCAG 접근성 테스트 — 서비스 스펙

> 이 문서는 AI 코딩 에이전트가 소비하는 **정본(한글 번역)** 입니다. 영문 정본 [`SPEC.md`](SPEC.md)와 항상 동기화하세요.
>
> **컬러 피커 & 명도 대비 검사기** 구축 스펙 (컬러 피커·명도 대비) — 색상 작업용 클라이언트 사이드 듀얼 패널 도구: (1) **피커/변환기** — 네이티브 색상 입력, 선택적 EyeDropper API(우아한 폴백), 형식 변환(HEX ↔ RGB(A) ↔ HSL ↔ OKLCH), 클릭 한 번 복사, 명암/티 스케일 생성, 저장된 팔레트(localStorage), (2) **WCAG 명도 대비 검사기** — 전경색 + 배경색 쌍 입력, 상대 명도(WCAG 2.1 공식) 계산, 통과/실패 뱃지 렌더(AA/AAA × 일반/큰 텍스트), 실시간 텍스트 미리보기, 색상 교환, 제안 헬퍼(명도축을 따라 가장 가까운 통과 색 찾기). 모든 처리는 순수 도메인 로직, 클라이언트 사이드, 네트워크 0, localStorage 지속성, 플랫폼 셸 위의 SPA입니다.
> 내부 서비스 코드명: `color-picker`. 레지스트리 id: `color-picker`. 공개 URL 슬러그: `/[locale]/tools/color-picker`.
>
> 이 스펙은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일 전환/테마 토글/동의 배너), 도구 레지스트리, SEO & 광고 인프라, 디자인 토큰은 플랫폼에서 제공합니다:
> - 플랫폼 스펙: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템 (시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참조 형제 도구 스펙 (동일 패턴): [`docs/services/dev/html-entity/SPEC_KR.md`](../html-entity/SPEC_KR.md)

```xml
<project_specification>

<project_name>컬러 피커 & 명도 대비 — 양방향 색상 변환 및 WCAG 접근성 테스트 (Jurepi 도구, 코드명 color-picker, 레지스트리 id color-picker)</project_name>

<overview>
컬러 피커 & 명도 대비 검사기는 디자이너와 개발자를 위한 투-인-원 유틸리티입니다. 도구는 두 가지 일상적 필요를 해결합니다: (1) **색상 형식 변환 및 시각적 탐색** — HEX, RGB, HSL 또는 OKLCH로 색상을 붙여넣기 또는 입력; 도구는 표시하고 즉시 양방향 변환, 형식별 클릭 한 번 복사, 명암/티 스케일(10 단계), 나중 재사용용 빠른 팔레트 저장을 제공합니다. (2) **WCAG 명도 대비 준수 확인** — 전경색 및 배경색 쌍을 선택하거나 입력하면, 도구는 대비율을 계산하고 즉시 AA/AAA 표준을 일반 텍스트(≥4.5:1 AA, ≥7:1 AAA)와 큰 텍스트(≥3:1 AA, ≥4.5:1 AAA)에 대해 뱃지로 표시합니다. 라이브 미리보기 패널은 두 크기 모두에 샘플 텍스트를 보여줍니다. 제안 헬퍼는 명도축을 따라 가장 가까운 통과 색을 찾아 사용자가 빠르게 준수를 위해 조정할 수 있습니다.

중요(클라이언트 전용, SSG): 100% 클라이언트 사이드. 백엔드, 데이터베이스, 네트워크 호출 없음. 모든 색상 수학 — 공간 변환(HEX ↔ RGB ↔ HSL ↔ OKLCH), 대비율 계산(WCAG 2.1 상대 명도 + Delta E), 명암/티 생성 — 은 순수 JS, golden 테스트됨. OKLCH 변환은 표준 색상 공간 행렬을 사용; 외부 색상 라이브러리 필요 없음(번들 오버헤드가 수용 불가능하면 polished 또는 chroma.js 같은 잘 테스트된 라이브러리는 비용 편익 분석 후 수용 가능).

중요(EyeDropper API, 우아한 폴백): 브라우저가 EyeDropper API를 지원하면(Chromium 95+), 시스템 색상 선택기를 여는 전용 스포이드 버튼을 표시합니다. 사용 불가능하면(Safari, Firefox, 구 Chrome), 버튼을 우아하게 숨김 — 네이티브 `<input type="color">` 및 수동 입력은 완전히 작동합니다. 기능 감지 없음 또는 폴리필; 그냥 감지하고 숨김.

중요(오류 처리, 견고성): 입력에서 잘못된 색상(잘못된 16진수 형식, 범위 벗어난 RGB 등)은 친화적 오류를 렌더하고 사용자 수정을 위해 입력에 남아있습니다. 대비 검사기는 유효한 색상 쌍과 작동; 잘못된 입력은 사전에 포착됩니다. 접근 가능한 색상 이름 조회(예: "blue" → 해석된 색)는 범위 외(MVP는 형식 기반).

중요(사용성 우선, SPA): 모든 Jurepi 도구는 SSG 셸 위에 장착된 클라이언트 사이드 SPA입니다. 모든 상호작용 — 색상 입력, 형식 선택, 팔레트 저장/로드, 대비 쌍 선택, 텍스트 크기 토글 — 은 로컬 React 상태로 발생하며 경로 탐색, 전체 페이지 리로드가 없습니다. 색상 보기, 변환 보기, 대비 보기, 완료.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/color-picker (SSG; 레지스트리 슬러그 "color-picker", id "color-picker", 상태 "coming_soon", 액센트 "sky", 카테고리 "dev").
  - 플랫폼에서 제공(다시 구현하지 말 것): 앱 셸(헤더/푸터/로케일 전환/테마 토글), 동의 배너, 광고 슬롯, 토스트 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주위 에러 경계, lib/seo.ts 메타데이터 빌더, 빵부스러기 + 인콘텐츠 광고 래퍼.
  - 소비: i18n 네임스페이스 `tools.color-picker.*` (UI 크롬 문자열: 패널 레이블, 버튼 텍스트, 형식 레이블, 대비 통과/실패 메시지, 하우투, FAQ).
  - `'dev'` 카테고리는 이제 LIVE이고 완전히 배선됨. 카테고리 활성화 전제는 없습니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **양방향 색상 형식 변환**: HEX(3/6 자리, 기본값 소문자), RGB(정수 0–255), RGBA(알파 0–1 포함), HSL(색상 0–360, 채도/명도 0–100), OKLCH(지각적, CSS Color Module 4 per).
    - **네이티브 색상 입력**: 포인트 앤 클릭용 `<input type="color">`; 각 형식용 수동 입력 필드(단일 입력 또는 개별 R/G/B/A 필드, 사용자 선호도).
    - **EyeDropper API**(선택적, 우아한 폴백): 지원되면(Chromium 95+), 스포이드 버튼 표시; 클릭 시, 시스템 색상 선택기 열기, 픽셀 색 읽기, 선택 형식으로 변환, 주 색상 피커 채우기. 지원 안 되면, 버튼 숨김(오류 없음, 폴리필 없음).
    - **명암/티 스케일**: 기본 색상에서 10단계 선형 스케일 생성(예: HSL 또는 OKLCH에서 명도축을 따라 어둡게/밝게); 견본으로 표시, 견본별 클릭 한 번 복사 16진수.
    - **저장된 팔레트**: localStorage 백업 사용자 저장 색상 목록(~20개 최대). 클릭해서 피커에 로드; 색상별 삭제. 세션 전체 지속성.
    - **WCAG 2.1 명도 대비 검사기**:
      - 전경색 + 배경색 입력(주 색상 피커 사용 또는 듀얼 입력).
      - 대비율 계산: WCAG 공식에 따라 상대 명도 `(L1 + 0.05) / (L2 + 0.05)`, L = 상대 명도.
      - 비율 표시(예: "7.2:1").
      - 통과/실패 뱃지(일반 텍스트 AA: ≥4.5, AAA: ≥7, 큰 텍스트 AA: ≥3, AAA: ≥4.5).
      - 아이콘 + 텍스트(색상만 절대 아님).
      - 라이브 텍스트 미리보기: 일반(본문 크기) 및 큰(18px+) 텍스트 크기의 샘플 단락, fg/bg 쌍으로 렌더, 색상 변경 시 실시간 업데이트.
    - **대비 제안 헬퍼**: 현 쌍이 목표 레벨(예: 일반/AA)을 실패하면, "색 제안" 버튼 제공 → 명도축을 따라 목표를 통과하는 가장 가까운 색 계산 → 새 비율이 있는 제안 표시; 사용자는 수락(피커에 로드) 또는 해제 가능.
    - **교환 버튼**: 빠른 전경 ⇄ 배경 토글(양방향 탐색에 유용).
    - **지역화된 UI 및 장문**(ko/en via tools.color-picker.*).
    - **완전 키보드 지원**: 모든 입력을 Tab, Enter로 입력 확인, "c"로 활성 16진수 복사, "/"로 입력 포커스.
    - **도구별 SEO 장문**("색상 공간 및 OKLCH를 사용하는 이유?" / "WCAG 대비 준수" / "접근 가능한 색상을 선택하는 방법" / 가이드) + FAQ(FAQPage JSON-LD), ko/en 지역화.
    - **감소된 모션 폴백**, WCAG 2.1 AA 접근성(색맹 안전 대비 메시지 포함).
  </in_scope>
  <out_of_scope>
    - 영어 이름으로 된 명명된 색상 조회("blue", "red" 등) — 너무 개방적, 범위는 형식 기반만.
    - 색상 조화 규칙(보완, 삼원색 등) — Phase 2.
    - APCA(WCAG 3 초안) 대비 모델 — 범위는 WCAG 2.1만; APCA는 future_considerations.
    - 색맹 시뮬레이터 또는 달토니제이션 도구 — Phase 2.
    - 색상별 딥링크 상태(예: `/tools/color-picker?color=ff0000`) — Phase 2.
  </out_of_scope>
  <future_considerations>
    - URL 쿼리 매개변수의 딥링크 상태(색상, 대비 쌍) — Phase 2.
    - APCA(WCAG 3 초안) 대비 모델 옵션 — Phase 2 또는 3.
    - 색상 조화 생성기(보완, 삼원색 등) — Phase 2.
    - 색맹 시뮬레이터 시각 테스트용 — Phase 2 또는 3.
    - 명명된 색상 동의어 조회(예: "navy" → #000080) — 미래, 이름 데이터베이스 필요.
    - 접근 가능한 색상 팔레트 생성기(N개 색상 선택, 명도로 자동 간격) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <color_math note="순수 JS, MVP용 외부 라이브 없음(또는 정당화되면 전투 테스트된 라이브 1개)">
      - **HEX 파싱 & 형식화**: 네이티브 `parseInt(hex, 16)` → RGB; RGB → `#RRGGBB`(영 패드, 소문자).
      - **RGB ↔ HSL 변환**: 표준 공식(문서화됨, golden 테스트 벡터). 이모지 16진수 왕복 테스트(예: #ff0000 → rgb(255,0,0) → #ff0000).
      - **RGB ↔ OKLCH 변환**: CSS Color Module 4 행렬(Oklab 중간 공간). Golden 테스트 정규 벡터(Color.js 등에서, 예: #ff0000 → oklch(63% 0.25 29) — 정확한 값 검증).
      - **상대 명도(WCAG)**: L = (R/255)^2.2 또는 (R/255)/12.92(분할; G, B도 마찬가지), WCAG 공식에 따라 합계. Golden 테스트: #000000 → 0, #ffffff → 1, #ffff00 → 특정 값 검증.
      - **대비율**: (L_더 밝은 + 0.05) / (L_더 어두운 + 0.05).
      - **명암/티 생성**: 명도축(HSL L 또는 OKLCH L)을 10% 단계로(0–100 또는 동등치) 따라; 16진수 배열 반환.
      - **가장 가까운 통과 색 검색**: 명도축을 따라 이진 검색 또는 언덕 오르기로 가장 가까운 색(같은 색상/채도)을 찾아 목표 대비율 충족.
      - 모든 함수는 순수, 단위 테스트, ≥90% 커버리지, 재사용용 내보냄.
    </color_math>
    <eyedropper_api note="네이티브 브라우저 API, 사용 불가능하면 우아한 숨김">
      - 마운트 시간에 `window.EyeDropper` 감지.
      - 있으면, 스포이드 버튼 표시(20px lucide 아이콘).
      - 클릭: `new EyeDropper().open()` → Promise 해석 `{ sRGBHex: "#RRGGBB" }`.
      - 선택 형식으로 변환(RGB, HSL, OKLCH 등) 및 피커 채우기.
      - 지원 안 되거나 사용자 취소(AbortError)면, 우아하게 처리(오류 토스트 없음, 그냥 조용히).
    </eyedropper_api>
    <validation>zod v3.x 색상 입력 스키마(HEX 형식, RGB 범위 0–255, 알파 0–1 등). 도메인 계층의 단일 소스 검증.</validation>
    <localStorage>jurepi-color-picker 키, zod 검증 스키마, 팔레트 배열 + 선호도(활성 형식, 마지막 색). 조용히 실패(세션만 폴백).</localStorage>
    <clipboard>navigator.clipboard.writeText → 숨겨진 텍스트영역 execCommand 폴백 → 조용히 실패(보조 기능, 항상 선택적).</clipboard>
    <animation>네이티브 CSS 전환만(색상 견본 페이드, 텍스트 미리보기 업데이트, 통과/실패 뱃지 animate-in). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — 이미 repo에 있음; 색상 입력 스키마 및 저장소 검증 재사용.</zod>
    <color_library_optional>순수 색상 수학 함수 번들이 번들 크기를 초과하면, 전투 테스트된 단일 함수 라이브러리 평가: polished(MIT, 작은 색상 유틸), chroma.js(Apache 2, 색상 조작 + 스케일), 또는 color.js(스펙 정렬 OKLCH, 더 큼). MVP는 순수 함수 가정; 라이브러리는 수학 크기가 팽창하면 Phase 1.5 비용 편익 결정.</color_library_optional>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/color-picker/                         # 순수 도메인 계층 — React/Next 없음, 완전히 단위 테스트
│   ├── schema.ts                             # zod: ColorInput, ContrastInput, PaletteSchema, StoreSchema + 검증 헬퍼
│   ├── color-space.ts                        # 변환기: hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToOklch, oklchToRgb 등(왕복 테스트)
│   ├── luminance.ts                          # WCAG 2.1 상대 명도(색상) → L ∈ [0,1]
│   ├── contrast.ts                           # 대비율(fg, bg), wcag 수준 확인(AA/AAA × 일반/큰 텍스트), nearestPassingColor(fg, bg, 목표) 제안
│   ├── scales.ts                             # generateShade(기본색, 단계=10), generateTint(…), linearScale(…)
│   ├── palette.ts                            # 불변 ops: addColor(팔레트, 16진수, 최대=20), removeColor(…), reorder(…)
│   └── vectors.ts                            # 테스트 golden 벡터(예: 알려진 HEX → RGB → HSL → OKLCH → 역, 참조 색)
├── components/tools/color-picker/
│   ├── ColorPicker.tsx                       # 오케스트레이터(클라이언트 컴포넌트) — 피커/검사기 상태 + useColorPicker() 소유
│   ├── useColorPicker.ts                     # 훅: localStorage 팔레트/선호도, 색상 변환 디스패처
│   ├── ColorInput.tsx                        # 네이티브 색상 입력 + 수동 입력 필드(탭: HEX / RGB / HSL / OKLCH)
│   ├── EyedropperButton.tsx                  # EyeDropper API 사용 가능하면 표시; 없으면 우아하게 숨김
│   ├── FormatTabs.tsx                        # 형식 선택(HEX / RGB / HSL / OKLCH) + 형식별 복사 버튼
│   ├── ColorSwatch.tsx                       # 시각 견본(정사각형 div bg-color), 16진수/rgb가 있는 aria-label
│   ├── ShadeScale.tsx                        # 10단계 명암/티 스케일 표시(견본) + 단계별 클릭 한 번 복사 16진수
│   ├── PalettePanel.tsx                      # 저장된 팔레트 목록(클릭해 로드, 색상별 삭제)
│   ├── ContrastChecker.tsx                   # Fg/Bg 입력, 비율 표시, 통과/실패 뱃지(AA/AAA × 일반/큰), 교환 버튼
│   ├── ContrastBadge.tsx                     # 단일 뱃지 컴포넌트(아이콘 + 텍스트, 수준 + 크기, 통과/실패 스타일)
│   ├── TextPreview.tsx                       # 라이브 미리보기 단락: 일반 텍스트(16px) + 큰 텍스트(18px+), fg/bg로 렌더
│   ├── ContrastSuggestion.tsx                # "제안" 버튼 + 제안 카드(가장 가까운 통과 색, 새 비율, 수락/해제)
│   ├── ColorPickerIntro.tsx                  # H1 + 리드(SEO 장문 소개)
│   ├── ColorPickerHowTo.tsx                  # "색상 공간 및 OKLCH 사용 이유?" / "WCAG 대비" / "색상 선택 방법"(SEO 장문)
│   ├── ColorPickerFaq.tsx                    # Q&A + FAQPage JSON-LD
│   └── error/
│       └── InvalidColorError.tsx             # 나쁜 입력(잘못된 16진수, 범위 벗어난 RGB 등)에서 친화적 오류 렌더
└── i18n/messages/{ko,en}.json                # tools.color-picker.* UI 크롬(형식 이름, 대비 수준, 하우투, FAQ)
</file_structure>

<core_data_entities>
  <color_input_state>
    - color: string (16진수 #RRGGBB, 정규화 소문자)
    - format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'oklch' (활성 표시 형식)
    - alpha?: number (0–1, RGBA 또는 알파가 있는 OKLCH일 때만)
  </color_input_state>
  <contrast_input_state>
    - foregroundColor: string (16진수 #RRGGBB)
    - backgroundColor: string (16진수 #RRGGBB)
  </contrast_input_state>
  <contrast_result note="전경색 + 배경색에서 파생">
    - ratio: number (예: 7.2)
    - wcagAA_normal: boolean (비율 ≥ 4.5)
    - wcagAA_large: boolean (비율 ≥ 3)
    - wcagAAA_normal: boolean (비율 ≥ 7)
    - wcagAAA_large: boolean (비율 ≥ 4.5)
  </contrast_result>
  <suggestion_result note="대비가 목표 수준 실패하면">
    - suggestedColor: string (16진수 #RRGGBB, 명도축에서 가장 가까운 통과 색)
    - newRatio: number
    - targetLevel: 'AA_normal' | 'AA_large' | 'AAA_normal' | 'AAA_large'
  </suggestion_result>
  <palette_item>
    - id: string (uuid 또는 타임스탬프 키)
    - hex: string (#RRGGBB)
    - label?: string (선택적 사용자 할당 이름)
    - createdAt: number (유닉스 타임스탬프)
  </palette_item>
  <store note="localStorage 지속성">
    - version: number (시작 1)
    - palette: PaletteItem[] (최대 20)
    - prefs: { activeFormat: 'hex' | 'rgb' | … }
    - meta: { createdAt: number }
    localStorage 키: `jurepi-color-picker`
  </store>
  <constants>
    - PALETTE_MAX = 20
    - SHADE_SCALE_STEPS = 10
    - WCAG_AA_NORMAL = 4.5
    - WCAG_AA_LARGE = 3
    - WCAG_AAA_NORMAL = 7
    - WCAG_AAA_LARGE = 4.5
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/color-picker" page="ColorPicker (플랫폼 도구 라우트 슬러그 → 컴포넌트 분기)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams는 레지스트리 반복(상태 "live") SSG로.</note>
</route_definitions>

<component_hierarchy>
  <color_picker>                     <!-- "use client"; 색상/대비 상태 소유 + useColorPicker() -->
    <color_picker_intro />           <!-- H1 + 리드(가능한 곳에서 서버 렌더) -->
    <picker_layout>                  <!-- 메인 2패널 또는 탭 레이아웃 -->
      <picker_panel>                 <!-- 패널 1: 색상 피커/변환기 -->
        <color_input />              <!-- 네이티브 입력 + 수동 필드(탭 HEX/RGB/HSL/OKLCH) -->
        <eyedropper_button />        <!-- EyeDropper API 사용 가능하면(없으면 우아하게 숨김) -->
        <format_tabs />              <!-- 형식 선택 + 복사 버튼 -->
        <color_swatch />             <!-- 현 색상 시각 표시 -->
        <shade_scale />              <!-- 10단계 스케일(어둡게→밝게), 클릭 한 번 복사 -->
        <palette_panel />            <!-- 저장된 색, 클릭해 로드, 항목별 삭제 -->
      </picker_panel>
      <contrast_panel>               <!-- 패널 2: WCAG 대비 검사기 -->
        <contrast_input_section>     <!-- Fg/Bg 색상 피커 -->
          <contrast_color_input fg_or_bg="fg" />
          <swap_button />            <!-- 빠른 토글 fg ⇄ bg -->
          <contrast_color_input fg_or_bg="bg" />
        </contrast_input_section>
        <contrast_result_section>
          <ratio_display />          <!-- "7.2:1" -->
          <contrast_badges />        <!-- AA_normal, AA_large, AAA_normal, AAA_large(통과/실패) -->
          <text_preview />           <!-- 일반 + 큰 크기에서 라이브 미리보기 -->
          <contrast_suggestion />    <!-- "제안" 버튼 → 가장 가까운 통과 색 + 새 비율 -->
        </contrast_result_section>
      </contrast_panel>
    </picker_layout>
    <color_picker_how_to />          <!-- SEO 장문 가이드 -->
    <color_picker_faq />             <!-- FAQPage JSON-LD -->
  </color_picker>
  <note>도구 내 SPA: 모든 상태 변경(색상 입력, 형식 선택, 대비 쌍, 팔레트 ops)은 로컬 React 상태, 경로 탐색 없음. 두 패널 모두 보기에 유지(모바일에서는 탭됨).</note>
</component_hierarchy>

<pages_and_interfaces>
  <color_picker_intro>
    - 눈썹: "개발 도구" / "DEVELOPER TOOL" — 12px/700/0.6px letter-spacing, var(--brand).
    - H1: "컬러 피커·명도 대비" / "Color Picker & Contrast Checker" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - 리드: 1–2 문장, body-lg 18px var(--text-secondary): "색상을 입력하고 다양한 형식으로 변환하세요. WCAG 명도 대비를 실시간으로 확인해 접근 가능한 색상 쌍을 선택하세요." / 영문 동등물.
  </color_picker_intro>

  <color_input>
    - DESIGN text-input 스타일 + 네이티브 `<input type="color">`(나란히 또는 스택). 플레이스홀더 "Enter hex, RGB, HSL, or OKLCH…".
    - 형식 탭(라디오 또는 분할): HEX / RGB / HSL / OKLCH.
    - 형식 선택 시, 그 형식의 입력 필드 표시(HEX: 단일 입력; RGB: R/G/B/A 슬라이더 또는 숫자 입력; HSL: H/S/L 입력; OKLCH: O/K/L/C/H 입력).
    - 블러에서 검증; 형식 틀리면 오류 카드(16진수 아님, RGB 범위 초과 등).
    - aria: role="group", aria-label "Color format selector", 각 형식 입력 aria-label.
  </color_input>

  <eyedropper_button>
    - 아이콘 버튼(스포이드 lucide 아이콘, 20px).
    - `window.EyeDropper` 있으면만 렌더(우아한 기능 감지, 폴리필 없음).
    - 클릭: `new EyeDropper().open()` → sRGBHex 해석 → 선택 형식으로 변환 → 색상 입력 업데이트.
    - 지원 안 되거나 사용자 취소 시, 조용히 무작동(오류 토스트 없음).
    - 툴팁: "화면에서 색상 선택" / "Pick a color from the screen".
  </eyedropper_button>

  <format_tabs>
    - 4개 탭(또는 버튼) 표시: HEX / RGB / HSL / OKLCH.
    - 활성 탭은 정규 16진수에서 즉시 계산된 그 형식의 현 색상 표시.
    - 각 탭은 "복사" 버튼(클립보드 → 성공 토스트 "✓ 복사됨" 1600ms, 또는 조용히 실패).
    - 예제 출력:
      - HEX: `#ff0000`
      - RGB: `rgb(255, 0, 0)` 또는 `rgba(255, 0, 0, 1)`
      - HSL: `hsl(0, 100%, 50%)`
      - OKLCH: `oklch(63% 0.25 29)`
    - 액센트 색상 sky(var(--accent-sky) / var(--accent-sky-soft)).
  </format_tabs>

  <shade_scale>
    - 10개 견본 생성: 명암-9(가장 어두움) → 명암-0(원본) → 명암+9(가장 밝음), 또는 동등치.
    - 각 견본은 40px × 40px 정사각형 bg-색, 인라인 또는 그리드 레이아웃.
    - 호버: 16진수 값 + 복사 버튼 표시(또는 견본 클릭해 16진수 복사).
    - 키보드: 견본 통해 Tab, Enter/Space로 복사.
    - 예제: 기본 #ff0000 → 거의 검은색(어둡게)에서 거의 흰색(밝게)까지 견본.
  </shade_scale>

  <palette_panel>
    - 축소 가능 또는 항상 표시 패널: "저장된 색상" / "Saved Colors".
    - 저장된 색 목록(최대 20): 견본 + 선택적 레이블 + 삭제 버튼.
    - "현재 저장" 버튼 → 팔레트에 추가(토스트 "✓ 저장됨", 또는 최대 도달 시 오류).
    - 견본 클릭해 주 피커에 로드.
    - 색상별 삭제 버튼(휴지통 아이콘).
    - localStorage 자동 동기화.
  </palette_panel>

  <contrast_input_section>
    - 두 색상 피커(라벨 "전경색" / "배경색", ko: "글자색" / "배경색").
    - 각 피커: 네이티브 색상 입력 + 스포이드(사용 가능하면) + 형식 탭(라이브 표시).
    - 교환 버튼(양방향 화살표 아이콘, 라벨 "색상 교환" / "Swap colors"): 클릭해 fg ↔ bg 교환(대비 즉시 재계산).
  </contrast_input_section>

  <ratio_display>
    - 큰 텍스트, 모노스페이스: "7.2:1"(또는 "3:1" 등).
    - 두드러지게 배치; 색상 변경 시 실시간 업데이트.
    - aria-live="polite" 스크린 리더용(비율 변경 알려짐).
  </ratio_display>

  <contrast_badges>
    - 2×2 그리드 또는 행의 4개 뱃지:
      - "일반 텍스트 AA" / "Normal text AA"(4.5:1 임계값)
      - "일반 텍스트 AAA" / "Normal text AAA"(7:1 임계값)
      - "큰 텍스트 AA" / "Large text AA"(3:1 임계값)
      - "큰 텍스트 AAA" / "Large text AAA"(4.5:1 임계값)
    - 각 뱃지: 아이콘(통과는 ✓, 실패는 ✗, 경계는 ✓/— 또는) + 텍스트 레이블.
    - 색상: 녹색(semantic-success 또는 accent-mint) 통과, 회색/빨강 실패(절대 색상만 — 아이콘 + 텍스트 항상).
    - aria-label: "일반 텍스트에 대해 WCAG AA 통과" 또는 "실패…"(수준별 정확한 표현).
  </contrast_badges>

  <text_preview>
    - 두 샘플 텍스트 블록: 일반 크기(16px, 본문), 큰 크기(18px 또는 24px).
    - 둘 다 같은 텍스트: "The quick brown fox jumps over the lazy dog. 0123456789 !@#$%^&*()" 또는 지역화 동등물.
    - 현 fg/bg 쌍으로 렌더: {color: 전경색, backgroundColor: 배경색}.
    - 색상 변경 시 실시간 업데이트.
    - aria: role="region", aria-label "Contrast preview at normal and large text sizes".
  </text_preview>

  <contrast_suggestion>
    - 현 비율이 목표 수준 실패(사용자가 목표 선택 또는 자동 확인 첫 실패 수준)면, "제안" 버튼 표시.
    - 클릭: (명도축, 같은 색상/채도)을 따라 목표 통과하는 가장 가까운 색 계산 → 표시:
      - 제안된 색(견본 + 16진수).
      - 새 비율(예: "4.5:1" 이제 통과).
      - 승인/해제 버튼: 승인 → 제안된 색을 전경색 피커에 로드(자동 비율 업데이트).
    - 비차단; 사용자는 무시하고 수동 편집 시도 가능.
  </contrast_suggestion>

  <keyboard_shortcuts>
    - "/" (입력 아님) → 첫 색상 입력 포커스.
    - "c" → 활성 16진수 클립보드 복사.
    - "s" → 전경 ⇄ 배경 교환(대비 검사기).
    - Tab → 모든 입력/버튼 통해 표준 키보드 네비게이션.
    - Enter → 색상 입력 확인(블러 이벤트).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <color_conversion note="모두 양방향, 왕복 테스트">
    - HEX ↔ RGB: `parseInt(hex.slice(1), 16)` → [R, G, B]; 역: 영 패드, 소문자.
    - RGB ↔ HSL: 표준 알고리즘(RGB to HSL 공식 검색); 색상 ∈ [0, 360), 채도/명도 ∈ [0, 100].
    - RGB ↔ OKLCH: CSS Color Module 4 스펙(Oklab 중간); golden 테스트 벡터.
    - OKLCH ↔ RGB: 위의 역.
    - 모든 변환은 알파 보존(있으면, 0–1 범위).
    - 왕복: 색상 → 형식 → 역 = 픽셀 완벽 원본(단위 테스트 검증).
  </color_conversion>
  <wcag_contrast note="WCAG 2.1 상대 명도 + 비율">
    - 상대 명도 L = 가중치 sRGB 값 합(분할 함수, 감마-선형 + 감마-압축 채널).
    - 대비율 = (L_밝음 + 0.05) / (L_어두움 + 0.05).
    - 수준별 통과/실패 확인(AA_normal 4.5, AAA_normal 7 등).
    - Golden 테스트: 알려진 색상 쌍 예상 비율 스펙 예제와 검증.
  </wcag_contrast>
  <shade_scale note="불변">
    - generateShade(기본색, 단계=10) → 16진수 색상 배열.
    - 명도축(HSL L 또는 OKLCH L)을 0에서 100까지 동등 단계로 따라.
    - 배열 반환(어둡게 우선 또는 밝게 우선, 사용자 선호도).
    - 예제: 기본 #ff0000(HSL L=50) → [#000000(L=0), #330000(L=10), …, #ff0000(L=50), …, #ffcccc(L=90), #ffffff(L=100)].
  </shade_scale>
  <palette_ops note="불변">
    - addColor(팔레트, 16진수, 레이블?) → 새 배열(앞에 삽입, 중복 제거, 최대=20으로 자르기).
    - removeColor(팔레트, id) → 새 배열(id로 필터).
    - localStorage에 저장/로드(zod 검증, 조용히 실패).
  </palette_ops>
  <contrast_suggestion note="가장 가까운 통과 색">
    - nearestPassingColor(fg색, bg색, 목표수준) → 제안색.
    - 알고리즘: 명도축(명도 유지하고 색상/채도 일정, L 변형) 따라 이진 검색 또는 선형 보행.
    - 목표수준 달성 첫 색 반환; 존재 안 하면(엣지 케이스: bg 거의 흰색/검은색), 최선 노력 색 반환.
  </contrast_suggestion>
  <i18n>모든 UI 크롬은 tools.color-picker.*(ko/en): 형식 레이블, 대비 수준 레이블, 버튼 텍스트, 오류/정보 메시지, 하우투, FAQ.</i18n>
</core_functionality>

<error_handling>
  <invalid_color_input>나쁜 16진수(길이 틀림, 16진수 아닌 문자), RGB 범위 벗어남(>255 또는 <0), HSL 무효(H>360, S>100 등) → 친화적 오류 카드 렌더("Invalid color format: expected HEX #RRGGBB or RGB 0–255"). 사용자가 입력 수정 가능; 충돌 없음.</invalid_color_input>
  <eyedropper_unavailable>EyeDropper API 사용 불가능(Safari, Firefox, 구 Chrome) → 우아하게 버튼 숨김. 사용자는 여전히 네이티브 색상 입력 또는 수동 입력 사용 가능. 오류 메시지 또는 폴리필 폴백 없음.</eyedropper_unavailable>
  <eyedropper_user_cancel>사용자가 EyeDropper를 열지만 취소(또는 시스템 선택기 닫음) → AbortError 포착, 조용히 무작동. 오류 토스트 없음.</eyedropper_user_cancel>
  <empty_input>빈 색상 입력은 무효; 최소한 16진수 또는 단일 RGB 값 필요. 검증 실패, 오류 카드 표시.</empty_input>
  <storage_unavailable>프라이빗 모드 → 팔레트 메모리 내(세션만), 오류 메시지 없음(우아한 성능 저하).</storage_unavailable>
  <copy_failure>clipboard.writeText 실패 → 조용히(보조 기능; 거짓 성공 토스트 절대 표시 안 함).</copy_failure>
  <error_boundary>플랫폼이 도구 감싸기; 렌더 실패 → 셸 충돌 없이 재시도.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>중요: DESIGN.md는 모든 토큰의 단일 정보원. 아래는 도구별 응용.</source>
  <accent_usage>
    - 카테고리 액센트는 SKY(var(--accent-sky) / var(--accent-sky-soft)) — 이 스펙의 액센트 선택에 따른 "dev" 카테고리 정체성. 형식 탭 활성 상태, 대비 통과 뱃지(녹색 액센트 오버라이드), 복사 버튼 성공 상태.
    - 주 버튼(교환, 제안, 저장)은 명확한 CTA를 위해 brand honey-gold var(--brand) 사용.
  </accent_usage>
  <surfaces>색상 입력 = var(--surface) + 1px var(--hairline); 견본 표시 = 빈 경우 var(--surface-muted), 그 외 실제 색상. 결과/제안 카드 radius var(--radius-lg); 레이아웃 카드 radius var(--radius-xl). 부드러운 그림자(--shadow-sm / --shadow-card).</surfaces>
  <typography>H1 Gmarket Sans clamp(28–40px)/700; 형식 레이블 Pretendard 14px/600; 비율 표시 모노스페이스 24px/1.4; 대비 뱃지 body-sm 14px var(--text-secondary).</typography>
  <motion>transform/opacity: 견본 페이드인(opacity 0→1) 150ms, 뱃지 펄스(scale 1→1.02→1) 200ms 통과/실패 변경 시, 텍스트 미리보기 부드러운 업데이트(애니메이션 없음, 그냥 라이브). 모두 prefers-reduced-motion으로 게이팅(즉시).</motion>
  <accessibility>모든 입력에 aria-label; 버튼 레이블(아이콘 + 툴팁); 대비 뱃지는 아이콘 + 텍스트 사용(절대 색상만 아님). 포커스 링 표시 var(--focus-ring) 2px. 텍스트 미리보기는 aria-label 및 aria-live="polite". ≥44px 탭 대상. WCAG AA 대비 뱃지 색상 자체는 표면과 대비 검증.</accessibility>
  <responsive>
    - ≥1024px: 2패널 나란히(피커 좌, 검사기 우).
    - 768–1023px: 패널 수직 스택.
    - <768px: 단일 열, 축소 가능 패널(탭 또는 아코디언).
  </responsive>
  <atmosphere>기술적, 정확, 명확 집중. 비율과 16진수 값은 모노스페이스, 시각 신뢰를 위한 큰 견본. 액센트(sky)는 다른 dev 도구와 구별(html-entity=coral, url-encoder=grape).</atmosphere>
  <icons>lucide-react: Pipette(스포이드), Copy(16진수 복사), Trash(팔레트에서 삭제), ArrowLeftRight(fg/bg 교환), Plus(팔레트에 추가). 기본값 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>사용자 입력 색상 값은 16진수/RGB/HSL/OKLCH 문자열 및 숫자; 로컬에서 파싱, HTML 렌더 없음. 모든 출력은 CSS 색상 값(dangerouslySetInnerHTML 절대 아님). 사용자 제공 색상은 실행 또는 eval 절대 아님.</input>
  <clipboard>사용자 시작한 복사만(버튼 또는 Ctrl+C 단축키); 클립보드 읽지 않음. 네트워크에 데이터 전송 없음.</clipboard>
  <eyedropper>EyeDropper API는 표준 브라우저 기능; 해석된 색은 OS 시스템 선택기(신뢰)에서. 외부 서비스 포함 안 됨.</eyedropper>
  <localStorage>팔레트는 일반 텍스트 16진수 문자열만(민감 데이터 없음, 도구는 사용자 입력을 색상 데이터로 가정). localStorage는 로컬 기기만, 브라우저/프로필별 격리.</localStorage>
  <network>네트워크 호출 0(모든 색상 수학은 JS, 동기).</network>
  <note>시크릿 없음, 인증 없음, API 호출 없음, 서버 쪽 처리 없음.</note>
</security_considerations>

<advanced_functionality>
  <format_conversion>6방향 변환(HEX ↔ RGB ↔ HSL ↔ OKLCH, 모두 양방향, 알파 지원). 왕복 테스트; 픽셀 완벽 정확도.</format_conversion>
  <eyedropper_api>우아한 기능 감지(폴리필 없음, 지원 안 되면 그냥 숨김). Chromium 95+는 작동; 구형 브라우저와 Safari/Firefox는 수동 입력으로만 저하.</eyedropper_api>
  <shade_scale>10단계 선형 스케일(어둡게/밝게); 사용자가 기본 선택하고 즉석에서 팔레트 생성 가능. 디자인 시스템용 유용.</shade_scale>
  <wcag_contrast>이중 수준 확인(AA + AAA) × 2 크기(일반 + 큼). 샘플 텍스트가 있는 라이브 미리보기. 제안 헬퍼는 한 작업에서 가장 가까운 통과 색 찾기.</wcag_contrast>
  <palette_persistence>최대 20개 색 로컬 저장; 클릭해 재사용. 반복 색상 선택(시도 + 저장 후보, 나중 비교)용 유용.</palette_persistence>
  <color_blind_safe_ui>대비 뱃지는 절대 색상만으로 통과/실패 신호 — 항상 아이콘(✓/✗) + 텍스트. 비율 텍스트는 모노스페이스 및 명확성을 위한 충분한 크기.</color_blind_safe_ui>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>HEX 색상을 모든 형식으로 변환하고 각각 복사</description>
    <steps>
      1. 입력 색상: `#ff0000` (빨강).
      2. 형식 탭이 올바르게 표시되는지 검증:
         - HEX: `#ff0000`
         - RGB: `rgb(255, 0, 0)`
         - HSL: `hsl(0, 100%, 50%)`
         - OKLCH: `oklch(63% 0.25 29)`
      3. 각 형식의 복사 버튼 클릭 → 클립보드 검증.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>EyeDropper 버튼 표시 및 작동 가능(사용 가능하면)</description>
    <steps>
      1. 플랫폼 감지(Chromium 95+?).
      2. 맞으면: 스포이드 버튼 표시; 클릭 → 시스템 선택기 열림.
      3. 색상 선택(또는 취소) → 선택했으면, 색상이 피커에 로드.
      4. 아니면(Safari/Firefox): 스포이드 버튼 숨김; 오류 없음.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>명암 스케일 생성 및 복사</description>
    <steps>
      1. 기본 색상: `#0088ff` (하늘 파랑).
      2. 명암 스케일 생성 → 10개 견본(어두움 → 기본 → 밝음).
      3. 견본 5 클릭 → 16진수 복사.
      4. 클립보드의 16진수 값이 견본 색과 일치하는지 검증.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>대비 검사기: 통과 및 실패 시나리오</description>
    <steps>
      1. Fg: `#000000` (검정), Bg: `#ffffff` (흰색) → 비율 `21:1` (모든 수준 통과).
      2. 4개 뱃지가 모두 체크마크(통과) 표시 검증.
      3. Fg 변경: `#999999` (중간 회색) → 비율 ~2.4:1(모두 실패)로 하강.
      4. 4개 뱃지가 모두 크로스(실패) 표시 검증.
      5. 텍스트 미리보기 두 경우 모두 표시, 케이스 1 읽기 쉬움, 케이스 2 낮은 대비.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>대비 제안: 가장 가까운 통과 색 찾기</description>
    <steps>
      1. Fg: `#cc0000` (어두운 빨강), Bg: `#ffffff` (흰색) → 비율 ~3.9 (AA_normal 4.5 실패).
      2. "AA Normal을 위해 제안" 클릭 → 새 fg 계산(예: 더 어두운 빨강 4.5+ 도달).
      3. 제안 표시: 새 fg 16진수 + 새 비율(예: "4.5:1 이제 AA Normal 통과").
      4. "수락" 클릭 → 새 fg를 피커에 로드; 비율 뱃지 업데이트.
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>팔레트에서 저장 및 로드</description>
    <steps>
      1. 색상 선택 `#ffaa00` (주황).
      2. "팔레트에 저장" 클릭 → 토스트 "✓ 저장됨".
      3. 다른 색상으로 변경 `#0088ff`.
      4. 팔레트 패널은 저장된 주황 견본 표시.
      5. 저장된 견본 클릭 → 피커에 로드(색상이 `#ffaa00`으로 변경).
      6. 페이지 새로 고침 → 팔레트 지속(localStorage).
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>잘못된 색상 입력 처리</description>
    <steps>
      1. 잘못된 16진수 입력: `#gg0000` (유효하지 않은 16진수 문자).
      2. 블러 입력 → 오류 카드: "Invalid color format…".
      3. 지우고 유효한 16진수 입력 `#ff0000` → 오류 지워짐, 색상 로드.
    </steps>
  </test_scenario_7>
  <test_scenario_8>
    <description>전경과 배경 교환</description>
    <steps>
      1. Fg: `#ff0000`, Bg: `#0000ff` → 비율(계산).
      2. 교환 버튼 클릭.
      3. Fg: `#0000ff`, Bg: `#ff0000` → 비율 재계산(같은 값, 역순 역할).
      4. 뱃지가 업데이트되는지 검증(비칭 비율이면, 순서가 "통과" 여부에 중요).
    </steps>
  </test_scenario_8>
</final_integration_test>

<success_criteria>
  - [x] 모든 색상 변환 함수는 순수, 테스트 가능, ≥90% 커버리지, 왕복 테스트.
  - [x] HEX ↔ RGB ↔ HSL ↔ OKLCH 변환은 정확하고 양방향.
  - [x] WCAG 2.1 상대 명도 및 대비율이 올바르게 계산됨(golden 테스트).
  - [x] 대비 검사기는 AA/AAA × 일반/큼(4 수준)에 대해 통과/실패 표시.
  - [x] EyeDropper API가 우아하게 감지되고 사용 불가능하면 숨겨짐(폴리필 없음).
  - [x] 명암/티 스케일이 10 단계를 올바르게 생성; 클릭 한 번 복사 작동.
  - [x] 팔레트가 localStorage에서 저장/로드; 세션 전체 지속(최대 20).
  - [x] 대비 제안이 가장 가까운 통과 색을 찾음(유효한 모든 쌍용).
  - [x] 텍스트 미리보기가 색상 변경 시 실시간 업데이트; 일반 및 큰 크기 모두 표시.
  - [x] SPA 상태 관리가 로컬(경로 탐색 없음).
  - [x] 키보드 단축키 작동(/, c, s, Tab, Enter).
  - [x] WCAG 2.1 AA: 포커스 링, aria 레이블, ≥44px 탭 대상, prefers-reduced-motion 존중, 대비 뱃지 절대 색상만 아님.
  - [x] 반응형 디자인: 2패널 데스크톱, 스택 모바일, 작은 화면에서 축소 가능.
  - [x] SEO 장문(Intro/HowTo/FAQ)이 대비 가이드 포함(SSR'd, mounted 게이트 없음).
  - [x] FAQPage JSON-LD는 `<ColorPickerFaq>` 컴포넌트만 방출(단일 소유, 경로 중복 없음).
  - [x] SoftwareApplication + BreadcrumbList JSON-LD는 경로 StructuredData(url == canonical).
  - [x] llms.txt 항목 + sitemap 자동 항목(단일 페이지 도구).
  - [x] SNS 공유 버튼은 경로 템플릿에 자동 배선.
  - [x] i18n: tools.color-picker.* 네임스페이스 ko/en.
  - [x] 액센트 색상(sky)이 일관되게 사용; DESIGN.md의 실제 토큰만.
  - [x] 에러 경계가 도구를 감싸기; 미처리 거부 없음.
  - [x] E2E 테스트가 위의 모든 8개 시나리오 + 잘못된 입력·저장소 사용 불가·EyeDropper 폴백 다룸.
  - [x] 프로덕션 빌드: 번들 크기는 예산 내(<80KB JS gzipped for dev/converter 카테고리).
</success_criteria>

<build_output>
레지스트리 항목:
```js
{
  id: 'color-picker',
  slug: 'color-picker',
  category: 'dev',
  icon: 'Pipette', // 또는 전용 아이콘
  accent: 'sky',
  status: 'coming_soon', // → 첫 배포 후 'live'
  addedAt: 'YYYY-MM-DD', // 구현 날짜 채우기
  order: 10, // dev 도구 목록의 위치
  keywords: ['color', 'contrast', 'wcag', 'hex', 'rgb', 'hsl', 'oklch', '컬러', '명도'],
}
```

`/src/`에 커밋된 파일 구조:
- `lib/color-picker/` — 도메인 계층(7–8개 파일, ≥250줄, 단위 테스트)
- `components/tools/color-picker/` — UI 계층(10–14개 컴포넌트, ≥200줄, 통합 테스트)
- `i18n/messages/{ko,en}.json` — `tools.color-picker.*` 네임스페이스로 업데이트(ko/en)

테스트 아티팩트:
- 도메인 단위 테스트: `lib/color-picker/*.test.ts` (6–8개 파일, ≥500줄 합계, ≥90% 커버리지)
- 컴포넌트 테스트: `components/tools/color-picker/*.test.tsx` (4–6개 파일, ≥300줄 합계)
- E2E 테스트: `tests/e2e/color-picker.spec.ts` (≥12개 시나리오, 핵심 워크플로우 + EyeDropper 폴백)
</build_output>

<key_implementation_notes>
  - **레지스트리 항목**: id `color-picker`, slug `color-picker`, 카테고리 `dev`, 액센트 `sky`, 상태 `coming_soon`, order step(예: 10, 다른 dev 도구와 구별). `addedAt: 'YYYY-MM-DD'` 추가(NEW 뱃지 파생 필수).
  - **색상 수학**: 모든 변환(HEX↔RGB↔HSL↔OKLCH)에 순수 JS 함수 구현. 번들 크기 팽창하면, polished 또는 chroma.js 같은 전투 테스트된 라이브러리 MVP 후 평가. WCAG 명도 및 대비율은 알려진 참조 값에 대해 golden 테스트 필수.
  - **EyeDropper 우아한 폴백**: 컴포넌트 마운트에서 `window.EyeDropper` 감지; 사용 가능하면만 버튼 표시. 폴리필 또는 폴백 UI 없음. AbortError(사용자 취소) 조용히 포착.
  - **도메인 우선 접근**: 모든 색상 변환 및 WCAG 수학은 순수, 내보냄 도메인 로직, 완전 테스트, 재사용 가능. 도메인 계층 ≥90% 커버리지.
  - **SEO 장문**: Intro(H1 + 리드) + HowTo(색상 공간 설명, OKLCH vs HSL, WCAG 수준, 실용 팁) + FAQ. 모두 AI 크롤러가 보도록 도구 컴포넌트의 `mounted` 게이트 **밖**에서 렌더.
  - **i18n 중요**: tools.color-picker.* 네임스페이스(ko/en). 형식 레이블(HEX, RGB, HSL, OKLCH), 대비 수준 레이블(AA, AAA, 일반, 큼), 버튼 텍스트, 오류/정보 메시지, HowTo, FAQ. 모든 사용자 마주 문자열 지역화.
  - **접근성 비협상**: 대비 뱃지는 절대 색상만으로 신호 — 항상 아이콘(✓/✗) + 텍스트 레이블. 텍스트 미리보기는 크고 읽기 쉬움. 모든 입력은 aria-label 있음. ≥44px 탭 대상.
  - **테스트 전략**: TDD → 도메인 테스트 우선(RED) → 색상 변환 왕복, 대비율 golden 벡터 → 컴포넌트 테스트(입력/출력 동작, EyeDropper 우아한 숨김) → E2E(8 시나리오 + 잘못된 입력 + EyeDropper 사용 불가). 모든 경로는 엣지 케이스 색상(#000000, #ffffff, 회색, 포화 색상)로 테스트.
  - **권장 구현 순서**: (1) 도메인 계층(색상 변환, WCAG 수학, 스케일). (2) 색상 피커 입력 + 형식 탭. (3) 대비 검사기(비율, 뱃지, 텍스트 미리보기). (4) 명암 스케일 & 팔레트. (5) EyeDropper 버튼(사용 불가능하면 우아하게 숨김). (6) 제안 헬퍼. (7) SEO 섹션(Intro/HowTo/Faq). (8) i18n 동기화(ko/en). (9) E2E 테스트 & 마무리.
</key_implementation_notes>

</project_specification>
```
