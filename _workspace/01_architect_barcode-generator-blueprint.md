# 바코드 생성기 청사진 — 클린 아키텍처 분해 + 계약 + 작업 분배

**작성일:** 2026-07-22  
**담당:** Architect  
**상태:** 완료, domain-engineer 시작 대기

---

## 핵심 요약

**Barcode Generator**는 텍스트를 EAN-13/UPC-A/Code 39/Code 128 형식의 바코드로 변환하는 클라이언트 측 SPA 도구입니다. 
- **4가지 형식 지원**: EAN-13(12자리+체크섬), UPC-A(11자리+체크섬), Code 39(영숫자), Code 128(ASCII 자동모드)
- **네트워크 없음**: jsbarcode npm(MIT, bin/ CJS path) 로컬 번들, 100% 클라이언트 측
- **축약 범위**: 색상 커스터마이즈 없음(흑백 고정 for scan reliability), 배치/로고/UPC-E 등은 Phase 2
- **SSG + SPA 조합**: 라우트는 플랫폼에서 정적 생성, 도구 자체는 클라이언트 제어 상태

---

## 클린 아키텍처 4계층 분해

### 계층 1: 도메인 (Domain Layer)
**책임**: 순수 비즈니스 로직. React/Next/DOM import 절대 금지. 100% 테스트 가능.

**파일 목록 & API 계약**:

#### 1.1 `src/lib/barcode-generator/types.ts`
```typescript
// 열거형 및 기본 타입만. 복잡한 검증은 schema.ts로.
export type BarcodeFormat = 'EAN13' | 'UPC' | 'CODE39' | 'CODE128';

export interface BarcodeInput {
  data: string; // 사용자 입력 (미정규화)
  format: BarcodeFormat;
}

export interface BarcodeOptions {
  width: number; // 100–300px
  textVisible: boolean; // 사람이 읽을 수 있는 텍스트 표시 여부
}

export interface EncodedBarcode {
  bars: string;            // 정규화된 단일 이진 bar/space 패턴 (예: "1010110...") — svg-export.ts와 BarcodePreview 캔버스 드로잉 양쪽의 단일 소스. EAN13/UPC는 세그먼트 배열을 이어붙여, CODE39/CODE128은 이미 단일이라 그대로 이 필드에 채운다.
  svgString: string;       // bars로부터 svg-export.ts가 파생한 SVG XML (hand-rolled <rect>, jsbarcode 렌더러 미사용)
  textContent: string;     // 사람이 읽을 수 있는 값 또는 빈 문자열
  encodedValue: string;    // 실제 인코딩된 값(체크섬 포함)
  format: BarcodeFormat;
}

export type BarcodeErrorCode = 
  | 'lengthError'        // 형식별 자리수 초과
  | 'invalidCharacter'   // 형식에 허용되지 않는 문자
  | 'checksumError'      // 체크섬 검증 실패
  | 'encodingFailed';    // jsbarcode 내부 실패

export interface BarcodeValidationResult {
  valid: boolean;
  error?: { code: BarcodeErrorCode; message?: string };
}
```

#### 1.2 `src/lib/barcode-generator/schema.ts`
```typescript
import { z } from 'zod';

// zod 스키마: 파싱, 변환, 에러 메시지
export const BarcodeFormatSchema = z.enum(['EAN13', 'UPC', 'CODE39', 'CODE128']);

export const BarcodeInputSchema = z.object({
  data: z.string().min(1, 'data_required').max(256, 'data_too_long'),
  format: BarcodeFormatSchema,
});

export const BarcodeOptionsSchema = z.object({
  width: z.number().min(100).max(300).default(200),
  textVisible: z.boolean().default(true),
});

// 내보내기
export type BarcodeInput = z.infer<typeof BarcodeInputSchema>;
export type BarcodeOptions = z.infer<typeof BarcodeOptionsSchema>;
```

#### 1.3 `src/lib/barcode-generator/validation.ts`
```typescript
import type { BarcodeInput, BarcodeValidationResult } from './types';

/**
 * 형식별 입력 검증 (기본 규칙만)
 * - EAN13: 12자리(베이스) 또는 13자리(체크섬 포함)
 * - UPC: 11자리(베이스) 또는 12자리(체크섬 포함)
 * - CODE39: 영숫자 + 특수문자(공백, 대시, 점, $, /, +, %)
 * - CODE128: 전체 ASCII (제한 없음, 단 빈 문자열 예외)
 * 
 * 체크섬 검증은 encoder.ts에서 jsbarcode.valid() 사용
 */
export function validateInput(input: BarcodeInput): BarcodeValidationResult {
  const { data, format } = input;

  if (!data.trim()) {
    return { valid: false, error: { code: 'lengthError' } };
  }

  switch (format) {
    case 'EAN13':
      if (!/^\d{12,13}$/.test(data)) {
        return { valid: false, error: { code: 'lengthError' } };
      }
      break;
    case 'UPC':
      if (!/^\d{11,12}$/.test(data)) {
        return { valid: false, error: { code: 'lengthError' } };
      }
      break;
    case 'CODE39':
      if (!/^[A-Z0-9 \-.*$+/%]+$/.test(data.toUpperCase())) {
        return { valid: false, error: { code: 'invalidCharacter' } };
      }
      break;
    case 'CODE128':
      // 모든 ASCII 허용 (jsbarcode가 자동으로 처리)
      break;
  }

  return { valid: true };
}
```

#### 1.4 `src/lib/barcode-generator/encoder.ts`
```typescript
import type { BarcodeInput, BarcodeOptions, EncodedBarcode } from './types';

/**
 * jsbarcode 래핑 + 정규화
 * 
 * EAN13/UPC: encode() → segment array
 * CODE39/CODE128: encode() → single { data, text } object
 * 
 * 이 함수가 양쪽 shape를 EncodedBarcode로 통일
 */
export function encodeBarcode(
  input: BarcodeInput,
  options: BarcodeOptions
): EncodedBarcode {
  const { data, format } = input;
  const { textVisible } = options;

  // jsbarcode 동적 import 안 함 (훅에서 담당)
  // 여기선 이미 로드된 클래스 가정
  
  // 1. 형식별 인코더 호출 (pseudo-code; 실제는 import 필요)
  // const Barcode = await getBarcode(format);
  // const encoded = new Barcode(data, {}).encode();
  
  // 2. Shape 정규화
  // EAN/UPC는 segment array → bars + text 추출
  // CODE39/CODE128은 단일 object → 그대로 사용
  
  // 3. bars 정규화 (segment array면 각 segment.data를 순서대로 concat, 단일 object면 그대로)
  // const bars = Array.isArray(encoded) ? encoded.map(seg => seg.data).join('') : encoded.data;

  // 4. SVG는 bars로부터 파생 (svg-export.ts, hand-rolled — jsbarcode 렌더러 미사용)
  // const svgString = normalizeBarcodeSVG(bars, options.width, textVisible ? textContent : undefined);

  // 5. Text 적용
  // const textContent = Array.isArray(encoded) ? encoded.map(seg => seg.text ?? '').join('') : encoded.text;

  return {
    bars: '', // 정규화된 이진 bar 패턴 — svg-export.ts와 BarcodePreview 캔버스가 공유하는 단일 소스
    svgString: '', // svg-export.ts(bars 인자로 hand-roll) 결과
    textContent: textVisible ? data : '', // 간단 예제
    encodedValue: data, // 실제 encode 결과 (체크섬 포함)
    format,
  };
}

/**
 * jsbarcode 클래스들의 동적 로더
 * bin/ 경로 (CJS) 사용, src/ ESM 금지
 */
export async function loadBarcodeEncoder(format: BarcodeFormat) {
  switch (format) {
    case 'EAN13':
      return (await import('jsbarcode/bin/barcodes/EAN_UPC/EAN13.js')).default;
    case 'UPC':
      return (await import('jsbarcode/bin/barcodes/EAN_UPC/UPC.js')).default;
    case 'CODE39':
      return (await import('jsbarcode/bin/barcodes/CODE39/index.js')).CODE39;
    case 'CODE128':
      return (await import('jsbarcode/bin/barcodes/CODE128/index.js')).CODE128;
  }
}
```

#### 1.5 `src/lib/barcode-generator/svg-export.ts`
```typescript
/**
 * jsbarcode encode() 결과의 바이너리 data 문자열을 SVG로 변환
 * 
 * 입력: binary string (e.g., "101010101")
 * 출력: SVG XML (손으로 작성)
 */
export function normalizeBarcodeSVG(
  barPattern: string,
  width: number,
  textContent?: string
): string {
  // 1. bar pattern을 svg rect grid로 변환
  // 2. textContent가 있으면 <text> 요소 추가
  // 3. viewBox, xmlns, 기타 SVG 표준 적용
  return `<svg xmlns="http://www.w3.org/2000/svg"><!-- SVG body --></svg>`;
}
```

#### 1.6 `src/lib/barcode-generator/index.ts`
```typescript
// 공개 API 내보내기
export * from './types';
export * from './schema';
export { validateInput } from './validation';
export { encodeBarcode, loadBarcodeEncoder } from './encoder';
export { normalizeBarcodeSVG } from './svg-export';
```

**도메인 불변식 (INVARIANTS)**:
- ✅ 모든 함수는 순수(pure) — side effect 없음, 결정적 출력
- ✅ React/Next/DOM import 금지 (절대)
- ✅ 체크섬 계산은 jsbarcode `.valid()` 위임 (재구현 금지)
- ✅ EAN/UPC segment array, CODE39/CODE128 single object 모두 정규화
- ✅ 타입 에러 코드는 UI i18n으로 매핑 (원시 라이브러리 메시지 노출 금지)

**테스트 전략 (TDD RED→GREEN)**:
- `validation.ts`: 형식별 패턴 10개 시나리오 (EAN13 12/13자리, UPC 11/12, CODE39 유효/무효, CODE128)
- `encoder.ts`: jsbarcode 모의 + segment/object shape 정규화 검증
- `svg-export.ts`: bar pattern → SVG XML (정확도 검증, width 스케일링)
- `index.ts`: 공개 export 확인
- **목표**: ≥90% 라인 커버리지, 모든 에러 코드 경로 커버

---

### 계층 2: 어댑터 (Adapter Layer — Hooks + Components)
**책임**: 도메인과 React/UI 사이의 다리. 상태 관리, localStorage, UI 바인딩.

#### 2.1 `src/components/tools/barcode-generator/useBarcodeGenerator.ts`
```typescript
/**
 * 훅: 동적 jsbarcode import, 인코딩(디바운스), localStorage 지속
 * 
 * 반환:
 * - input, setInput
 * - format, setFormat
 * - width, setWidth
 * - textVisible, setTextVisible
 * - encoded (EncodedBarcode | null)
 * - error (BarcodeErrorCode | null)
 * - isLoading
 */
export function useBarcodeGenerator() {
  // 1. state: input, format, width, textVisible
  // 2. useEffect: input/format 변경 시 → 디바운스 100ms → encode()
  // 3. useEffect: mount → localStorage 읽기 (zod 파싱, 실패 시 fresh start)
  // 4. useEffect: state 변경 → 디바운스 100ms → localStorage 쓰기
  // 5. 핵심: localStorage 쓰기는 상태 변경과 **분리** (사용자 상호작용 vs 자동 저장)
}
```

**localStorage 계약**:
```typescript
const STORE_VERSION = 1;
const STORE_KEY = 'jurepi-barcode-generator';

interface BarcodStore {
  version: number;
  recentInputs: string[]; // 최대 5개, 각 ≤100자
  lastFormat: BarcodeFormat;
  lastWidth: number;
}
```

---

### 계층 3: 사용자 인터페이스 (UI Layer — Components)
**책임**: 순수 프레젠테이션. 상태는 훅/부모에서 주입.

#### 3.1 컴포넌트 목록
- `BarcodeGenerator.tsx` (Orchestrator, "use client") — format/input/width/textVisible state 소유, 자식에 prop 주입
- `FormatSelector.tsx` — format 탭 (EAN-13/UPC-A/CODE39/CODE128)
- `InputArea.tsx` — 입력 필드, 형식별 placeholder, 자리수 표시, 검증 메시지
- `BarcodePreview.tsx` — SVG 렌더 또는 placeholder, 로딩 스피너
- `SizeControl.tsx` — 너비 슬라이더 (100–300px)
- `TextToggle.tsx` — "사람이 읽을 수 있는 텍스트 표시" 토글
- `DownloadButtons.tsx` — PNG/SVG/Copy 버튼 (download 로직 호출)
- `BarcodeIntro.tsx` — H1 + lead (SEO)
- `BarcodeHowTo.tsx` — 4섹션 긴 형식 (이 도구란?/사용법/언제 쓰나?/팁)
- `BarcodeFaq.tsx` — Q&A 6–8문항 + FAQPage JSON-LD

**컴포넌트 계약 예**:
```typescript
interface BarcodePreviewProps {
  svgString: string | null;
  isLoading: boolean;
  error: BarcodeErrorCode | null;
}

interface FormatSelectorProps {
  selectedFormat: BarcodeFormat;
  onChange: (format: BarcodeFormat) => void;
}
```

---

### 계층 4: 플랫폼 (Platform Layer)
**책임**: Next.js routing, i18n, SEO, 광고. 도구 code 작성 금지.

- `src/app/[locale]/tools/barcode-generator/page.tsx` — 라우트 (platform generateStaticParams 제공)
- `src/app/[locale]/tools/barcode-generator/layout.tsx` — 선택사항 (공유 layout 재사용 가능)
- `src/i18n/messages/{ko,en}.json` — i18n 키 `tools.barcode-generator.*`
- `src/tools/registry.ts` — barcode-generator entry (status "live", accent "mint", order 210 — 리더 확정, 신규/니치 도구는 큐레이션 순서 말미에 배치)
- 설정: robots.txt, sitemap.ts, metadata 필드들은 플랫폼

---

## 의존성 규칙 (Dependency Rule)

```
Platform (Next.js, i18n, routing)
  ↑
UI Components (React, props)
  ↑
Hooks (React, state, localStorage)
  ↑
Domain (Pure functions, types)
```

✅ **모든 의존성은 안쪽(위)으로만 향한다**
- UI는 도메인 타입/함수 import ✓
- Hook은 도메인 import ✓
- 도메인은 React/Next import ✗

---

## 상태 흐름 (State Flow, SPA)

```
BarcodeGenerator (orchestrator)
  ├─ useBarcodeGenerator() hook
  │   ├─ state: input, format, width, textVisible
  │   ├─ effect: encode(input, format) → debounce 100ms
  │   └─ effect: localStorage sync
  │
  ├─ FormatSelector → setFormat(format)
  ├─ InputArea → setInput(data)
  ├─ SizeControl → setWidth(px)
  ├─ TextToggle → setTextVisible(bool)
  │
  ├─ BarcodePreview → canvas 실시간 렌더: encoded.bars를 ctx.fillRect로 바 하나씩 직접 그림
  │                    (qr-code QRPreview.tsx가 QR 모듈을 fillRect로 직접 그리는 것과 동일 패턴 —
  │                     SVG를 래스터화하지 않는다. canvasRef를 DownloadButtons와 공유)
  │
  └─ DownloadButtons
      ├─ Download PNG: canvasRef.current.toBlob() (이미 그려진 canvas 그대로 사용, SVG 경유 없음)
      ├─ Download SVG: encoded.svgString(=svg-export.ts가 encoded.bars로부터 hand-roll) → blob → download
      └─ Copy: PNG blob → clipboard.write()
```

**주의**: PNG와 SVG는 둘 다 `encoded.bars`(단일 이진 문자열)에서 **독립적으로** 파생된다 — PNG는 canvas에 직접 fillRect, SVG는 svg-export.ts가 직접 `<rect>` 생성. 어느 쪽도 다른 쪽을 경유(SVG→canvas 래스터화 등)하지 않는다. html2canvas 등 신규 의존성 불필요.

---

## i18n 계약 (Korean/English, ko/en 분리)

**네임스페이스**: `tools.barcode-generator.*`

| 키 | 타입 | ko | en |
|-----|------|-----|-----|
| `format.ean13` | label | "EAN-13" | "EAN-13" |
| `format.upc` | label | "UPC-A" | "UPC-A" |
| `format.code39` | label | "Code 39" | "Code 39" |
| `format.code128` | label | "Code 128" | "Code 128" |
| `input.placeholder.ean13` | placeholder | "12개 자리 입력(체크섬 자동계산)" | "Enter 12 digits (checksum auto-calculated)" |
| `input.placeholder.upc` | placeholder | "11개 자리 입력(체크섬 자동계산)" | "Enter 11 digits (checksum auto-calculated)" |
| `input.placeholder.code39` | placeholder | "영숫자 + 공백, 대시, 점, $, /, +, %" | "Alphanumeric + space, dash, dot, $, /, +, %" |
| `input.placeholder.code128` | placeholder | "모든 문자 입력 가능" | "Enter any ASCII text" |
| `input.charCount` | text | "{current}/{max} 자" | "{current}/{max} chars" |
| `error.lengthError.ean13` | error | "EAN-13은 12개 또는 13개의 숫자여야 합니다" | "EAN-13 requires 12 or 13 digits" |
| `error.lengthError.upc` | error | "UPC-A는 11개 또는 12개의 숫자여야 합니다" | "UPC-A requires 11 or 12 digits" |
| `error.invalidCharacter` | error | "허용되지 않는 문자가 있습니다" | "Contains invalid characters" |
| `error.checksumError` | error | "유효하지 않은 체크섬입니다" | "Invalid checksum" |
| `size.label` | label | "너비" | "Width" |
| `size.value` | text | "{width}px" | "{width}px" |
| `text.label` | label | "사람이 읽을 수 있는 텍스트 표시" | "Show human-readable text" |
| `download.png` | button | "PNG 다운로드" | "Download PNG" |
| `download.svg` | button | "SVG 다운로드" | "Download SVG" |
| `copy` | button | "클립보드에 복사" | "Copy to Clipboard" |
| `copy.success` | toast | "클립보드에 복사되었습니다" | "Copied to clipboard" |
| `download.success` | toast | "바코드가 다운로드되었습니다" | "Barcode downloaded" |
| `howTo.title` | heading | "바코드 생성 방법" | "How to Generate a Barcode" |
| `howTo.section1.title` | heading | "이 도구란?" | "What is This Tool?" |
| `howTo.section1.body` | text | "이 도구는..." | "This tool generates..." |
| `howTo.section2.title` | heading | "사용 방법" | "How to Use" |
| `howTo.section2.body` | text | "1단계:..." | "Step 1:..." |
| ... | ... | ... | ... |
| `faq.items[0].q` | question | "바코드란 무엇인가요?" | "What is a barcode?" |
| `faq.items[0].a` | answer | "바코드는..." | "A barcode is..." |

---

## 레지스트리 엔트리

```typescript
{
  id: 'barcode-generator',
  slug: 'barcode-generator',
  name_ko: '바코드 생성기',
  name_en: 'Barcode Generator',
  description_ko: 'EAN-13, UPC-A, Code 39, Code 128 바코드 생성',
  description_en: 'Generate EAN-13, UPC-A, Code 39, Code 128 barcodes',
  category: 'converter',
  icon: 'Barcode',
  accent: 'mint',
  status: 'live',
  addedAt: '2026-07-22',
  order: 210, // 리더 확정(계획서 기준) — 기존 최대값 200 다음, 신규 도구는 큐레이션 순서 말미에 배치
  keywords: ['바코드', '생성', 'EAN', 'UPC', 'Code39', 'Code128', 'encode'],
}
```

---

## 작업 분배 (Task Breakdown)

### Phase 1: 도메인 (domain-engineer)
**Goal**: lib/barcode-generator/* 모두 ≥90% 커버리지, 0 tsc 에러

1. **types.ts 작성** (1h)
   - BarcodeFormat, BarcodeInput, BarcodeOptions, EncodedBarcode, error codes
   - 테스트: 타입 시그니처만 검증

2. **schema.ts 작성** (1h)
   - zod 스키마 3개 (Format, Input, Options)
   - 테스트: schema validation 10 시나리오

3. **validation.ts 작성** (1.5h)
   - validateInput() 구현
   - 테스트: 형식별 regex 10 케이스 (EAN/UPC/CODE39/CODE128 valid/invalid)

4. **encoder.ts 작성** (2h)
   - loadBarcodeEncoder() 동적 import (bin/ paths)
   - encodeBarcode() jsbarcode 래핑 + segment/object 정규화
   - 테스트: jsbarcode 모의 + segment array/object 정규화 검증, checksum 자동계산

5. **svg-export.ts 작성** (1.5h)
   - normalizeBarcodeSVG() bar pattern → SVG
   - 테스트: SVG XML 유효성, width 스케일링, text placement

6. **index.ts 작성** (0.5h)
   - 공개 export 정의

**예상 시간**: 7.5h
**완료 기준**: `pnpm test src/lib/barcode-generator --run` ≥90%, `tsc --noEmit` 0 errors

---

### Phase 2: UI (ui-engineer ×2, 병렬)

**UI 엔지니어 1 (구조화 컴포넌트)**:
- FormatSelector.tsx
- InputArea.tsx
- SizeControl.tsx
- TextToggle.tsx

**UI 엔지니어 2 (다운로드 + SEO)**:
- BarcodePreview.tsx (SVG 렌더)
- DownloadButtons.tsx (PNG/SVG/Copy)
- BarcodeIntro.tsx
- BarcodeHowTo.tsx
- BarcodeFaq.tsx

**공유**: useBarcodeGenerator.ts (platform-engineer와 함께 또는 두 ui가 병렬로 작성 후 조율)

**예상 시간**: 각 엔지니어 5h (병렬, 총 프로젝트 5h)

---

### Phase 3: 플랫폼 (platform-engineer)
**Goal**: 라우트, i18n, registry, metadata ✓

1. `src/app/[locale]/tools/barcode-generator/page.tsx` (1h)
   - 라우트 파일, generateMetadata, 컴포넌트 import
   
2. `src/tools/registry.ts` barcode-generator entry 추가 (0.5h)

3. `src/i18n/messages/{ko,en}.json` 키 모두 추가 (1h, 사용자 초안 기반)

4. i18n 최상위 키 확인 (title, description) (0.5h)

5. sitemap.ts 자동 갱신 확인 (레지스트리 파생, 별도 작업 불필요) (0.5h)

**예상 시간**: 3.5h

---

### Phase 4: SEO + QA (seo-geo-engineer + qa-integration, 병렬)

**SEO**:
- JSON-LD (SoftwareApplication, FAQPage) 검증
- llms.txt 등재 확인
- canonical, hreflang 검증

**QA**:
- E2E 7 시나리오 (test_1~7 from SPEC)
- 시각 회귀 (ko/en, 320/768/1024 데스크톱/다크)
- accessibility (axe-core)
- 라이브 검증 (라이브 도메인)

**예상 시간**: 각 2.5h (병렬)

---

### Phase 5: 통합 & 배포 (리더)

- main 병합 (clean FF 또는 squash?)
- CF push → 라이브 배포
- 최종 라이브 게이트

---

## 외부 의존성 & 라이브러리

| 라이브러리 | 버전 | 용도 | 비고 |
|----------|------|------|------|
| `jsbarcode` | ^3.12.3 | 바코드 인코딩 | npm, bin/barcodes/** 순수 인코더 클래스만(CJS) 사용 — src/ ESM과 renderers/(DOM결합) 둘 다 금지 |
| React | 19 | UI | 플랫폼 제공 |
| Next.js | 15 | 라우팅, SSG | 플랫폼 제공 |
| next-intl | latest | i18n ko/en | 플랫폼 제공 |
| zod | latest | 스키마 검증 | 플랫폼 제공 |
| Tailwind v4 | latest | 스타일링 | 플랫폼 제공 |

**신규 의존성 추가 없음** (jsbarcode는 이미 package.json?)

---

## 테스트 전략

### 도메인 (lib/barcode-generator)
- **Vitest** + **jsdom** + **zod 모의**
- **RED→GREEN TDD**
- 목표: ≥90% 라인 + ≥100% 분기 커버리지
- 시나리오:
  1. `validation.ts`: EAN13 12/13자리, UPC 11/12, CODE39 유효/무효, CODE128 all-ascii, CODE39 특수문자 제한
  2. `encoder.ts`: jsbarcode.encode() 모의 segment/object shape, 정규화 검증, 체크섬 자동계산 확인
  3. `svg-export.ts`: bar pattern → SVG 유효성, width 100/200/300 스케일링, text placement
  4. `schema.ts`: zod 파싱 성공/실패, coercion

### UI Components
- **Vitest component** (RTL, jsdom)
- 모의: useBarcodeGenerator hook → encoded 고정 fixture
- 예제:
  - FormatSelector: 4개 탭, 활성 상태, aria-selected, 클릭 → onChange 호출
  - InputArea: placeholder 형식별, 입력 → onChange, 자리수 표시
  - BarcodePreview: SVG 렌더 (고정 fixture svg string), loading 상태, error 상태
  - DownloadButtons: PNG/SVG/Copy 클릭 → 다운로드 핸들러 호출 검증

### E2E (Playwright)
- `test_1`: EAN-13 12자리 입력 → 체크섬 자동, barcode 렌더, PNG 다운로드
- `test_2`: UPC-A 11자리 → 체크섬 자동, 텍스트 토글 on/off
- `test_3`: Code 39 alphanumeric → barcode 렌더, SVG 다운로드
- `test_4`: Code 128 ASCII full → barcode 렌더, clipboard copy
- `test_5`: 키보드 단축키 (Cmd+S, Cmd+C)
- `test_6`: 로케일 전환 ko/en → 라벨 현지화
- `test_7`: 감소된 모션 on, 모바일 320px, JSON-LD 프리렌더

### 시각 회귀
- ko/en, 라이트/다크 모드
- 320px, 768px, 1024px 뷰포트
- BarcodePreview SVG 스크린샷 (형식별)
- 그리드 정렬, 오버플로 확인

---

## 안전장치 & 검증

### 프리렌더 (SSG)
- ✓ JSON-LD SoftwareApplication (1개만, StructuredData에서 소유)
- ✓ FAQPage JSON-LD (1개만, BarcodeFaq에서 소유, 실제 faq.items 기반)
- ✓ SEO 섹션 (Intro/HowTo/Faq) 모두 `mounted` 게이트 **밖** SSR
- ✓ canonical URL == JSON-LD url
- ✓ hreflang 자동 (platform)
- ✓ sitemap.xml 자동 등재 (레지스트리 live)

### 라이브 검증
- ✓ 라이브 도메인에서 실제 바코드 생성 테스트
- ✓ 실제 jsbarcode 동작 (모의 아님)
- ✓ localStorage 지속 (reload 후 복구)
- ✓ 다운로드 파일 실제 생성 + 콘텐츠 검증 (PNG 헤더, SVG XML)
- ✓ 클립보드 복사 실제 동작 (브라우저 환경만)

### 에러 처리
- ✓ 잘못된 입력 → 타입 에러 코드 → UI i18n toast
- ✓ jsbarcode 내부 실패 → try-catch → typed error
- ✓ localStorage unavailable → 메모리 in-memory, 에러 없음
- ✓ Canvas unavailable (PNG export 실패) → SVG 폴백

---

## 완료 체크리스트

- [ ] SPEC.md + SPEC_KR.md 작성 완료
- [ ] 청사진(이 문서) 작성 완료
- [ ] domain-engineer에게 전달 (`pnpm test` ≥90% 목표 명시)
- [ ] domain-engineer TDD 완료 후 ui-engineer 착수
- [ ] ui-engineer + platform-engineer 병렬 작업
- [ ] seo-geo-engineer + qa-integration 병렬 작업
- [ ] 최종 E2E + 시각 회귀 검증
- [ ] 라이브 배포 + 최종 게이트

---

**작성자**: Architect  
**완료일**: 2026-07-22  
**다음 담당**: domain-engineer (lib/barcode-generator TDD)
