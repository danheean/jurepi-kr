# 바코드 생성기 — 텍스트를 스캔 가능한 바코드로 변환 (EAN-13, UPC-A, Code 39, Code 128) — 서비스 스펙

> 이 문서는 **정본 영어 버전** [`SPEC.md`](SPEC.md)의 번역입니다. 둘 다 동기화 상태를 유지하세요.
>
> **바코드 생성기**(barcode-generator) 구현 스펙 — 순수 클라이언트 바코드 인코더로 EAN-13, UPC-A, Code 39, Code 128 형식을 지원하며 자동 체크섬 계산과 이미지 다운로드(PNG/SVG) 기능 제공. 서버/네트워크 없음. 콘텐츠는 생성되며 저장되지 않음.
> 내부 서비스 코드명: `barcode-generator`. 레지스트리 id: `barcode-generator`. 공개 URL 슬러그: `/[locale]/tools/barcode-generator`.
>
> 이 스펙은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO 및 광고 인프라, 디자인 토큰은 플랫폼에서 제공합니다:
> - 플랫폼 스펙: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각적 진실의 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 스펙(유사 도메인): [`docs/services/converter/qr-code/SPEC_KR.md`](../qr-code/SPEC_KR.md)

```xml
<project_specification>

<project_name>바코드 생성기 — 클라이언트 측 바코드 인코더 (Jurepi 도구, 코드명 barcode-generator, 레지스트리 id barcode-generator)</project_name>

<overview>
바코드 생성기는 텍스트-바코드 변환 도구입니다: 사용자가 4가지 형식 탭 중 하나에 데이터를 입력(EAN-13, UPC-A, Code 39, Code 128)하면 도구는 즉시 라이브 바코드 미리보기를 렌더링하고 체크섬을 자동으로 계산합니다. 사용자는 바코드 크기를 조정하거나, 사람이 읽을 수 있는 텍스트의 표시/숨김을 토글하고, PNG 또는 SVG로 다운로드할 수 있습니다. 모든 생성은 클라이언트 측에서 발생하며 결정적이고 정확합니다 — 네트워크 없음, 백엔드 없음, localStorage 외 지속성 없음.

중요(클라이언트 전용, SSG): 100% 클라이언트 측. 백엔드, 데이터베이스, 바코드 생성 서비스 호출 없음. `jsbarcode` npm 라이브러리(로컬 번들, CDN 없음)가 데이터를 SVG로 인코딩합니다. 유일한 자체 지속성은 `localStorage`(최근 입력, 마지막 형식, 마지막 크기)이며 네트워크를 통해 아무것도 전송되지 않습니다.

중요(사용성 우선, SPA): 플랫폼 규칙에 따라 도구는 SSG 셸에 탑재된 클라이언트 측 단일 페이지 애플리케이션(SPA)입니다. 형식 선택(EAN-13/UPC-A/CODE39/CODE128), 크기 조정, 사람이 읽을 수 있는 텍스트 토글, 다운로드는 NO 라우트 네비게이션, NO 전체 페이지 새로고침으로 로컬 React 상태를 통해 발생합니다. 라이브 바코드 미리보기는 모든 키 입력에 반응합니다(디바운스됨). 라우트는 SEO를 위해 정적으로 생성(SSG)되며, 대화형 인코더는 단일 클라이언트 컴포넌트 아일랜드입니다.

중요(안전성, 접근성): XSS 안전 사용자 입력 렌더링(바코드 데이터 → SVG 바이너리, innerHTML 없음). 자동 체크섬 계산 및 입력 검증(타입 기반 에러 코드; 원시 라이브러리 예외 노출 안 함). 키보드 조작 가능한 컨트롤, 접근 가능한 입력 라벨, 감소된 모션 존중(즉시 토글).
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/barcode-generator (SSG; 레지스트리 슬러그 "barcode-generator", id "barcode-generator", 상태 "live", 액센트 "mint", 카테고리 "converter").
  - 플랫폼 제공(재구현 금지): 앱 셸(헤더/푸터/로케일스위처/테마토글), 동의배너, 광고슬롯, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주변 ErrorBoundary, lib/seo.ts 메타데이터 빌더.
  - 소비: i18n 네임스페이스 `tools.barcode-generator.*` (UI 크롬: 형식 라벨, 크기 라벨, 토글 라벨, 버튼, 에러 메시지, 사용법, FAQ).
  - 플랫폼 의존성(소): `'converter'` 카테고리는 이미 `ToolCategory`에 `mint` 액센트와 "변환 도구"/"Converter" 라벨로 존재합니다. 유일한 플랫폼 변경은 하나의 `ToolMeta` 레지스트리 항목 추가, 도구 라우트의 슬러그→컴포넌트 분기, `generateMetadata` 분기 추가입니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - 형식 탭: EAN-13 (12자리 + 자동 체크섬), UPC-A (11자리 + 자동 체크섬), Code 39 (영숫자), Code 128 (전체 ASCII, 자동 모드 A/B/C).
    - 입력 검증: 형식별 숫자/문자 검사; 체크섬 검증.
    - 자동 체크섬 계산: EAN-13과 UPC-A는 13/12번째 자리 자동 계산; 사용자는 베이스 자리만 입력.
    - 라이브 바코드 미리보기: SVG 렌더(모든 입력 변경 시, 디바운스 100ms).
    - 크기 컨트롤: 너비 슬라이더(100–300px, 기본 200px); 높이는 자동으로 스케일되어 가로세로 비율 유지.
    - 사람이 읽을 수 있는 텍스트 토글: on/off, 기본 ON (바코드 아래 인코딩된 값 표시).
    - 다운로드: PNG (SVG에서 캔버스로) + SVG (jsbarcode 출력에서 손으로 작성).
    - 클립보드에 복사: PNG 이미지로서의 바코드 SVG(navigator.clipboard.write).
    - 도구별 SEO 긴 형식 + FAQ + SoftwareApplication/FAQPage JSON-LD, Ko/En 현지화.
    - 감소된 모션 폴백: 즉시 토글(페이드 없음).
  </in_scope>
  <out_of_scope>
    - 앱 셸, 헤더/푸터, 로케일 스위처, 테마 토글, 동의 배너(모두 플랫폼).
    - 바코드 스캔/디코딩(카메라 입력). 이 도구는 생성만 수행.
    - 동적/추적 가능한 바코드(백엔드, 분석). 정적 바코드 데이터만.
    - 대량 배치 내보내기(다중 바코드 zip). 세션당 단일 바코드.
    - 색상 커스터마이즈. 스캔 안정성을 위해 흑백(검정/흰색) 고정.
    - 고급 형식별 옵션(예: UPC-E, GS1-128). Phase 2.
  </out_of_scope>
  <future_considerations>
    - 배치 생성기(CSV 입력 → 다중 바코드 다운로드). Phase 2.
    - 형식 히스토리(최근 바코드, localStorage 갤러리). Phase 2.
    - 인쇄 레이아웃(열감지 프린터 템플릿, 라벨 크기 프리셋). Phase 2.
    - UPC-E, GS1-128, ITF-14, Data Matrix. Phase 2.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <barcode_library>jsbarcode ^3.12.3 npm (순수 JS 인코더, MIT, 런타임 의존성 0). **오직 bin/ 경로만** import(babel 컴파일 CJS — bin/barcodes/EAN_UPC/EAN13.js, bin/barcodes/EAN_UPC/UPC.js, bin/barcodes/CODE39/index.js, bin/barcodes/CODE128/index.js). src/(raw ESM, 번들링 위험)와 jsbarcode의 renderers/(DOM canvas/svg 엘리먼트 필요, 도메인 순수성 위반)는 **절대 사용 금지**. 클래스: EAN13, UPC, CODE39, CODE128. 모두 DOM 무관; encode()는 CODE39/CODE128의 경우 { data: string (바이너리 bar/space 패턴), text: string (사람이 읽을 수 있는) }, EAN13/UPC의 경우 이런 세그먼트의 배열(가드바+숫자그룹) 반환 — encoder.ts가 두 shape를 하나의 평평한 `bars` 이진 문자열 + `text`로 정규화.</barcode_library>
    <svg_render>손으로 작성한 SVG만 사용(qr-code 도구의 svg-export.ts 패턴 미러) — 도메인 `svg-export.ts`가 정규화된 `bars` 이진 문자열을 파싱해 `<rect>` 엘리먼트를 바 하나당 직접 생성하고, 가독형 텍스트는 선택적 `<text>` 엘리먼트로. jsbarcode 렌더러는 어디서도 사용하지 않는다(DOM 결합, 범위 밖). html2canvas나 신규 의존성 없음.</svg_render>
    <checksum>jsbarcode가 자동으로 처리. 입력 검증: 타입 기반 에러 코드(lengthError, invalidCharacter 등), UI i18n으로 매핑.</checksum>
    <clipboard>navigator.clipboard.write (PNG blob) → execCommand 폴백(거짓 성공 절대 표시 안 함).</clipboard>
    <canvas_render>PNG 미리보기/내보내기는 동일한 정규화된 `bars` 이진 문자열을 읽어 HTML5 canvas에 바를 하나씩 `ctx.fillRect`로 직접 그린다 — qr-code의 QRPreview.tsx(QR 모듈을 자신의 SVG를 래스터화하지 않고 fillRect로 직접 그림)와 동일 패턴. 캔버스 렌더링은 SVG 문자열과 독립적이며, 둘 다 같은 도메인 `bars` 데이터에서 파생되므로 서로 어긋날 수 없다.</canvas_render>
    <file_input>FileReader를 통한 클라이언트 측 이미지 읽기(기본 바코드에는 불필요하지만 향후 로고 오버레이용 존재).</file_input>
    <download>SVG → Blob(xml) → URL.createObjectURL → 숨겨진 <a href> 클릭. PNG → 이미 그려진 canvas(canvas_render 참고)에서 canvas.toBlob() → 동일한 다운로드 패턴. SVG를 캔버스로 래스터화하지 않음, html2canvas 없음.</download>
  </module_specific>
  <libraries>
    <jsbarcode>jsbarcode ^3.12.3 — 의존성, npm. 안전한 CJS 번들링을 위해 bin/ 경로만 import.</jsbarcode>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/barcode-generator/
│   ├── types.ts                           # BarcodeFormat, BarcodeInput, BarcodeOptions, EncodedBarcode
│   ├── schema.ts                          # zod: BarcodeInputSchema, BarcodeOptionsSchema; 에러 코드
│   ├── validation.ts                      # validateInput(format, input): { valid: bool, error?: TypedError }
│   ├── encoder.ts                         # encodeBarcode(input, format, options): EncodedBarcode — 순수 함수, React/DOM 없음
│   ├── svg-export.ts                      # normalizeBarcodeSVG(raw): 최적화 SVG 문자열
│   └── index.ts                           # 공개 내보내기
├── components/tools/barcode-generator/
│   ├── BarcodeGenerator.tsx               # 오케스트레이터 (Client Component) — 형식/입력/크기/textVisible 상태 소유
│   ├── useBarcodeGenerator.ts             # 훅: 동적 jsbarcode import, 인코딩(디바운스됨), localStorage 최근/형식/크기
│   ├── FormatSelector.tsx                 # EAN-13 / UPC-A / Code 39 / Code 128 탭 (segment)
│   ├── InputArea.tsx                      # 형식별 입력 필드, 자리수 세기, 검증 메시지
│   ├── BarcodePreview.tsx                 # 실시간 canvas 렌더(fillRect로 바 하나씩 직접 그림, qr-code QRPreview.tsx 미러) + 로딩 스피너
│   ├── SizeControl.tsx                    # 너비 슬라이더(100–300px) + 자동 높이 표시
│   ├── TextToggle.tsx                     # "사람이 읽을 수 있는 텍스트 표시" 토글 (on/off)
│   ├── DownloadButtons.tsx                # PNG 다운로드, SVG 다운로드, 클립보드 복사 버튼
│   ├── BarcodeIntro.tsx                   # H1 + 리드(SEO; 서버 렌더 가능한 곳)
│   ├── BarcodeHowTo.tsx                   # "바코드 생성 방법" (SEO 긴 형식, mounted 게이트 밖 SSR)
│   ├── BarcodeFaq.tsx                     # Q&A + FAQPage JSON-LD(단일 소유 — StructuredData는 SoftwareApplication만 소유)
│   ├── BarcodeStructuredData.tsx          # SoftwareApplication JSON-LD만(FAQPage 없음 — 중복 JSON-LD 방지)
│   └── data/
│       └── (생성 아티팩트 없음; 런타임만)
└── i18n/messages/{ko,en}.json             # tools.barcode-generator.* UI 크롬
</file_structure>

<core_data_entities>
  <barcode_input>
    - data: string (필수, 비어있지 않음)
    - format: enum (EAN13, UPC, CODE39, CODE128) — 인코딩 규칙 결정
    - 불변식:
      * EAN13: 12 또는 13자리(12 베이스 → 자동 체크섬; 13 전체 → 체크섬 검증)
      * UPC: 11 또는 12자리(11 베이스 → 자동 체크섬; 12 전체 → 체크섬 검증)
      * CODE39: 영숫자 + 공백 + 대시 + 점 + $ + / + + + %
      * CODE128: 전체 ASCII(모드 A/B/C 자동 선택)
  </barcode_input>
  <barcode_options>
    - width: number (px, 100–300, 기본 200)
    - height: auto(표준 가로세로 비율 유지하도록 자동 스케일)
    - textVisible: bool (기본 true; 바코드 아래 인코딩된 값 표시)
  </barcode_options>
  <encoded_barcode>
    - bars: string — 정규화된 평평한 이진 bar/space 패턴(예: "1010110..."), svg-export.ts와 BarcodePreview의 canvas 드로잉 양쪽이 공유하는 단일 소스(SVG와 PNG가 서로 어긋날 수 없게 함)
    - svgString: string — svg-export.ts가 `bars`로부터 파생한 SVG XML 문자열
    - textContent: string — 사람이 읽을 수 있는(또는 render 시 textVisible=false일 경우 비어있음)
    - encodedValue: string — 실제로 인코딩된 것(베이스 + 체크섬 해당 시)
    - format: enum — 참고용
  </encoded_barcode>
  <barcode_store note="localStorage blob">
    - version: number (STORE_VERSION = 1)
    - recentInputs: string[] — 마지막 5개 입력, 자름(각 최대 100자)
    - lastFormat: enum (EAN13|UPC|CODE39|CODE128)
    - lastWidth: number (px)
    localStorage key: `jurepi-barcode-generator`
    불변식: 읽기는 zod 파싱; 실패 → 신규 시작(throw 없음).
  </barcode_store>
  <constants>
    - MAX_INPUT_LENGTH = 256 (모든 형식에 충분히 큼)
    - DEBOUNCE_MS = 100
    - WIDTH_MIN = 100, WIDTH_MAX = 300, WIDTH_DEFAULT = 200
    - ASPECT_RATIO_STANDARD = 1:0.5 (바코드 높이 일반적으로 너비의 절반 가독성 위해)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/barcode-generator" page="BarcodeGenerator (플랫폼 도구 라우트 슬러그→컴포넌트 분기)" />
  </public_routes>
  <note>단일 라우트. locale ∈ {ko, en}. 플랫폼 generateStaticParams는 레지스트리를 반복하여 SSG. 바코드당 라우트 없음.</note>
</route_definitions>

<component_hierarchy>
  <barcode_generator>                         <!-- "use client"; 형식 + 입력 + 크기 + textVisible 상태 + useBarcodeGenerator() 소유 -->
    <barcode_intro />                       <!-- H1 + 리드(서버 렌더 가능한 곳) -->
    <generator_layout>                       <!-- 데스크톱 2열(형식 | 미리보기), 모바일 스택 -->
      <form_panel>
        <format_selector />                 <!-- EAN-13 / UPC-A / Code 39 / Code 128 탭 -->
        <input_area />                      <!-- 입력 필드 + 형식별 검증 + 자리수 세기 -->
        <size_control />                    <!-- 너비 슬라이더(100–300px) + 현재값 표시 -->
        <text_toggle />                     <!-- "텍스트 표시" 토글(on/off) -->
        <download_buttons />                <!-- PNG / SVG / 복사 -->
      </form_panel>
      <preview_panel>                        <!-- 모바일 모바일 아래 또는 우측 sticky -->
        <barcode_preview />                 <!-- SVG 라이브 렌더 -->
      </preview_panel>
    </generator_layout>
    <barcode_how_to />                      <!-- SEO 긴 형식 -->
    <barcode_faq />                         <!-- FAQPage JSON-LD -->
  </barcode_generator>
  <note>도구 내 SPA: 형식/크기/텍스트 = 로컬 상태 전환, 라우트 네비게이션 아님. 미리보기는 라이브 업데이트(디바운스됨).</note>
</component_hierarchy>

<pages_and_interfaces>
  <barcode_preview>
    - SVG 렌더(기본 200px 너비, 크기 슬라이더에 반응). 모든 입력 변경 시 라이브 바코드(디바운스 100ms).
    - 선택사항 사람이 읽을 수 있는 텍스트 아래(토글 컨트롤).
    - 상태: 비어있음(플레이스홀더 "바코드가 여기 나타날 것입니다" 회색 텍스트), 로딩(스피너), 렌더됨(SVG), 에러(Toast + 폴백).
    - 크기: ≥1024px 300px 우측 고정; 768–1023px 형식 아래, 전체 너비; <768px 아래, 전체 너비, 높이 자동.
  </barcode_preview>

  <format_selector>
    - 수평 pill 탭(segment): "EAN-13", "UPC-A", "Code 39", "Code 128".
    - 활성 = brand mint 배경 / on-brand 텍스트; 비활성 = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right 네비게이션; aria-selected 활성.
  </format_selector>

  <input_area>
    - 단일 텍스트 입력(형식별 플레이스홀더, 예: "EAN-13 베이스 12자리" / "UPC-A 베이스 11자리").
    - 자리수 세기 표시(현재 / MAX_INPUT_LENGTH); max에서 에러 상태.
    - 아래 검증 메시지(형식별 규칙, 해당 시 체크섬 에러).
    - var(--surface) border var(--hairline), radius var(--radius-md), padding 12px.
  </input_area>

  <size_control>
    - 슬라이더: 100–300px, step 10. "너비: 200px" 표시(높이는 자동 스케일).
  </size_control>

  <text_toggle>
    - 체크박스 또는 pill 토글: "사람이 읽을 수 있는 텍스트 표시"(on/off, 기본 on).
    - on일 때, 바코드는 인코딩된 값 표시(예: EAN-13 "9780143007234").
  </text_toggle>

  <download_buttons>
    - 3개 버튼: "PNG 다운로드", "SVG 다운로드", "클립보드에 복사"(PNG 이미지).
    - 성공 toast: "바코드 다운로드됨" / "클립보드에 복사됨".
    - 실패(클립보드 불가): 무음(거짓 성공 없음).
  </download_buttons>

  <keyboard_shortcuts>
    - Ctrl+S / Cmd+S → PNG 다운로드.
    - Ctrl+C / Cmd+C → 클립보드에 복사.
    - Tab → 필드 네비게이션; focus-visible ring var(--focus-ring).
  </keyboard_shortcuts>
</pages_and_interfaces>

<core_functionality>
  <format_detection>
    - EAN-13: 12 또는 13자리. 12 → 체크섬 자동 추가(mod 10). 13 → 체크섬 검증.
    - UPC-A: 11 또는 12자리. 11 → 체크섬 자동 추가. 12 → 체크섬 검증.
    - Code 39: 영숫자 + 공백, 대시, 점, $, /, +, %. 자동으로 *별표* 구분자 추가(jsbarcode 처리).
    - Code 128: 전체 ASCII; 최적 인코딩을 위해 모드 A/B/C 자동 감지(jsbarcode 처리).
  </format_detection>
  <barcode_encoding>
    - jsbarcode 라이브러리: new EAN13(data, opts).encode() / new UPC(data, opts).encode() / new CODE39(data, opts).encode() / new CODE128(data, opts).encode().
    - EAN/UPC는 세그먼트 배열 반환; CODE39/CODE128은 단일 객체 반환. 정규화 계층이 두 shape를 통일.
    - SVG 내보내기: 정규화된 `bars` 이진 문자열로부터 svg-export.ts가 손으로 작성(jsbarcode 렌더러 미사용).
    - 모두 결정적(랜덤 없음, 안정적 출력).
  </barcode_encoding>
  <checksum_validation>
    - jsbarcode .valid() 메서드는 true/false 반환. UI용 타입 에러 코드 노출(예: checksumError).
  </checksum_validation>
  <persistence_adapter useBarcodeGenerator>
    - 마운트: `jurepi-barcode-generator` 읽기 → zod → 실패 시 신규 시작(throw 없음).
    - 변경: 디바운스 JSON.stringify → setItem; quota 잡음 → 메모리에만 유지.
    - 노출: 입력/형식/너비 + setInput/setFormat/setWidth, textVisible + setTextVisible, 인코딩(디바운스됨).
  </persistence_adapter>
  <i18n>모든 UI 크롬은 tools.barcode-generator.*(ko/en): 형식 라벨, 입력 플레이스홀더, 검증 메시지, 버튼, toast, 사용법, FAQ. 바코드 데이터는 형식 의존, 로케일 무관.</i18n>
</core_functionality>

<error_handling>
  <input_too_long>자리수 세기는 MAX_INPUT_LENGTH에서 빨강; 에러 메시지 "최대 256자입니다" / "Max 256 characters". 사용자는 단축해야 함.</input_too_long>
  <invalid_format>형식별 검증(예: "EAN-13은 12개 또는 13개의 숫자여야 합니다" / "EAN-13 requires 12 or 13 digits"). Toast 에러 + 필드 내 힌트.</invalid_format>
  <checksum_error>13자리 입력이 체크섬 실패 시, Toast "유효하지 않은 체크섬입니다" / "Invalid checksum". 사용자는 다시 입력하거나 12자리 베이스 사용.</checksum_error>
  <jsbarcode_exception>드묾. 라이브러리 에러 코드를 타입 에러로 매핑(lengthError, invalidCharacter 등). Toast: "바코드 생성 실패" / "Barcode generation failed". 폴백: 플레이스홀더 SVG.</jsbarcode_exception>
  <canvas_unavailable>PNG 내보내기 실패 → SVG만 폴백(사용자는 SVG 전용 다운로드 제공, PNG 불가능 언급).</canvas_unavailable>
  <storage>불가능(비공개 모드) → 메모리 내, 완전히 사용 가능. 실패 → 사용자에게 에러 없음.</storage>
  <error_boundary>플랫폼이 도구를 래핑; 렌더 실패 → 충돌 없이 재시도.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>중요: DESIGN.md는 모든 토큰의 단일 소스. 아래는 도구별 응용.</source>
  <accent>카테고리 액센트는 MINT(var(--accent-mint) / var(--accent-mint-soft)) — DESIGN에 따라 "converter" 카테고리 정체성. 형식 선택기 활성 상태, 크기 슬라이더 트랙, 다운로드 CTA(1차 brand coral, 2차 mint).</accent>
  <surfaces>형식 패널 = var(--surface) + 1px var(--hairline); 미리보기 = var(--surface) + border mint. 입력 필드 var(--surface) + var(--hairline), radius var(--radius-md). 부드러운 mint 그림자.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); 라벨 Pretendard 14–16px/600; 값 16px/500. 입력 플레이스홀더 500 weight.</typography>
  <motion>SVG 라이브 업데이트는 즉시(디바운스 100ms, 페이드 없음). 토글 전환 150ms ease-out(prefers-reduced-motion로 게이팅: 즉시).</motion>
  <accessibility>모든 입력 라벨됨; 검증 메시지 지속; 전체 키보드 네비게이션; focus-visible ring var(--focus-ring). 에러 상태는 색상 + 아이콘 + 텍스트 사용(색상 단독 아님).</accessibility>
  <responsive>≥1024px: 2분할(형식 좌 | 미리보기 우측 sticky). 768–1023px: 형식 위, 미리보기 아래(전체 너비). <768px: 수직 스택. 미리보기는 크기 슬라이더에 반응(320에서 오버플로 없음).</responsive>
</aesthetic_guidelines>

<security_considerations>
  <input>사용자 데이터 → SVG/바코드 인코딩(안전). innerHTML 없음. 스크립트 실행 없음. 형식 문자열은 리터럴(eval 없음).</input>
  <clipboard>사용자 시작 복사만; 클립보드 절대 읽음 없음; blob(PNG 이미지), 절대 텍스트 토큰 없음.</clipboard>
  <privacy>네트워크를 통해 입력 전송 없음. localStorage 전용 히스토리(최대 5개 입력, 자름 100자). 분석 없음. 바코드 데이터는 사용자 생성(도구 설계상 민감하지 않음).</privacy>
  <third_party>jsbarcode 라이브러리는 순수 JS, 다시 호출 없음. DESIGN 토큰은 읽기 전용. CDN 없음. bin/ 경로는 babel 컴파일 CJS(안전 번들링).</third_party>
  <note>비밀 없음, 3자 없음, 네트워크 없음.</note>
</security_considerations>

<final_integration_test>
  <test_1>EAN-13 베이스 입력 "978014300723"(12자리) → 체크섬 자동 계산 "9780143007234" → 바코드 렌더 → PNG 다운로드 → PNG가 뷰어에서 열림.</test_1>
  <test_2>UPC-A 입력 "12345678901"(11자리) → 체크섬 자동 계산 → 바코드 렌더, 사람이 읽을 수 있는 텍스트 표시 → 텍스트 토글 끔 → 텍스트 사라짐.</test_2>
  <test_3>Code 39 입력 "HELLO-WORLD" → 바코드 렌더 → 크기 슬라이더 너비 조정(100–300px) → SVG 다운로드 → SVG 유효 XML.</test_3>
  <test_4>Code 128 입력 "Hello, World! 123" → 전체 ASCII 인코딩 → 바코드 렌더 → 클립보드에 복사 → PNG가 이미지 뷰어에 붙여넣어짐.</test_4>
  <test_5>키보드 단축키(Cmd+S, Cmd+C) → 다운로드 + 복사 작동. Tab 네비게이션 필드. 검증 에러 잘못된 입력. 명시적 버튼 또는 Enter 다운로드.</test_5>
  <test_6>로케일 전환 ko/en → 모든 라벨, 플레이스홀더, 에러 현지화. 바코드 데이터(숫자/알파 콘텐츠) 변경 없음. localStorage는 로케일 전환 중 지속.</test_6>
  <test_7>감소된 모션 on → 전환 없음(즉시). 모바일 320px → 오버플로 없음, 전체 너비 형식+미리보기. JSON-LD SoftwareApplication + FAQPage in prerendered HTML.</test_7>
</final_integration_test>

<success_criteria>
  <functionality>EAN-13, UPC-A, Code 39, Code 128 형식. 라이브 바코드 미리보기. 크기 슬라이더(100–300px). 사람이 읽을 수 있는 텍스트 토글. 자동 체크섬(EAN/UPC). PNG+SVG 다운로드. 클립보드에 복사. 키보드 조작 가능. 감소된 모션 존중. 형식별 검증.</functionality>
  <ux>라이브 미리보기 즉시(디바운스 100ms). 형식이 반응적 느낌. 검증 메시지 도움이 됨(교설적이지 않음). 다운로드 버튼 항상 도달 가능. 형식별 플레이스홀더가 입력 가이드. ≥44px 터치 타깃.</ux>
  <technical>lib/barcode-generator/* 순수 ≥80% 유닛 커버리지(인코더/검증/svg); React/Next deps 없음. TS 0 에러. 파일당 <800줄. jsbarcode 라이브러리 ^3.12.3 로컬 번들(bin/ CJS 순수 인코더만, 렌더러 미사용). localStorage만, 네트워크 없음. 결정적 출력(같은 입력 → 매번 같은 바코드).</technical>
  <visual>DESIGN.md 준수; mint 정체성 + brand coral CTA. 명확하고 접근 가능한 입력 힌트. SVG/PNG 렌더 일치. 바코드에서 텍스트 가독성.</visual>
  <performance>도구 라우트는 플랫폼 예산 내. 라이브 디바운스가 스래싱 방지. SVG 렌더 <100ms 현대 브라우저. CLS 영향 없음. LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>플랫폼 일부로 빌드(pnpm build). 빌드 전 훅 불필요(순수 런타임). /[locale]/tools/barcode-generator은 플랫폼 generateStaticParams가 레지스트리를 반복하여 사전 렌더(상태 "live"). 바코드 도구 자체는 SPA, 정적 아티팩트 없음.</note>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. 형식별 입력 검증 + 자동 체크섬(EAN/UPC).
    2. jsbarcode 라이브러리 통합: new Format(data, opts).encode() → 세그먼트/객체 정규화.
    3. 라이브러리 출력에서 SVG 렌더.
    4. PNG 내보내기(SVG → 캔버스 → blob).
    5. 다운로드(blob → URL.createObjectURL → 숨겨진 <a href>).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/barcode-generator/{types,schema,validation,encoder,svg-export}.ts Vitest (RED→GREEN): 형식 검증, jsbarcode 통합, 체크섬, SVG 정규화, PNG 내보내기.
    2. useBarcodeGenerator 훅(jsbarcode 동적 import, 인코딩 디바운스됨, localStorage).
    3. FormatSelector + InputArea(EAN/UPC/CODE39/CODE128).
    4. BarcodePreview(SVG 렌더).
    5. SizeControl + TextToggle + DownloadButtons.
    6. 키보드 단축키, motion-reduce, a11y(axe).
    7. BarcodeIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD.
    8. 레지스트리 상태→live; 슬러그→컴포넌트 + generateMetadata; E2E 1–7; 시각 회귀 320/768/1024 양 테마.
  </recommended_implementation_order>
  <testing_strategy>순수 Vitest ≥80%(인코더/검증/svg); 컴포넌트 카탈로그 주입 jsbarcode mock; SVG mock(jsdom); E2E 시나리오 1–7(모든 형식, 크기, 텍스트 토글, 다운로드, 키보드, 로케일, 모션); 시각 바코드 콘텐츠 검증(선택 디코더).</testing_strategy>
</key_implementation_notes>

</project_specification>
```

작성된 바코드 생성기 SPEC_KR.md | 410줄.
