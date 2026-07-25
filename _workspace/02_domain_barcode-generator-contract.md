# Barcode Generator — Domain Layer Contract

**작성일**: 2026-07-22  
**도메인 엔지니어**: domain-engineer  
**상태**: 구현 완료, TDD GREEN 단계 통과

---

## 공개 API 시그니처

### 1. 타입 정의

#### `BarcodeFormat`
```typescript
type BarcodeFormat = 'EAN13' | 'UPC' | 'CODE39' | 'CODE128';
```

#### `BarcodeInput`
```typescript
interface BarcodeInput {
  data: string;        // 사용자 입력 텍스트
  format: BarcodeFormat;
}
```

#### `BarcodeOptions`
```typescript
interface BarcodeOptions {
  width: number;       // 100–300px, 바코드 너비
  textVisible: boolean; // 사람이 읽을 수 있는 텍스트 표시 여부
}
```

#### `EncodedBarcode` (출력 모델)
```typescript
interface EncodedBarcode {
  bars: string;         // 정규화된 단일 이진 bar/space 패턴 (예: "1010110...")
                        // svg-export.ts와 BarcodePreview 캔버스의 단일 소스
  svgString: string;    // svg-export.ts가 bars로부터 생성한 SVG XML (hand-rolled)
  textContent: string;  // 사람이 읽을 수 있는 값 또는 빈 문자열
  encodedValue: string; // 실제 인코딩된 값 (체크섬 포함)
  format: BarcodeFormat;
}
```

#### `BarcodeErrorCode`
```typescript
type BarcodeErrorCode =
  | 'lengthError'       // 형식별 자리수 오류
  | 'invalidCharacter'  // 허용되지 않는 문자
  | 'checksumError'     // 체크섬 검증 실패
  | 'encodingFailed';   // jsbarcode 내부 실패
```

#### `BarcodeValidationResult`
```typescript
interface BarcodeValidationResult {
  valid: boolean;
  error?: { code: BarcodeErrorCode; message?: string };
}
```

### 2. 함수 API

#### `validateInput(input: BarcodeInput): BarcodeValidationResult`
**목적**: 형식별 입력 사전 검증 (정규식 기반)

**불변식**:
- EAN13: 12자리(베이스) 또는 13자리(체크섬 포함) 숫자만
- UPC: 11자리(베이스) 또는 12자리(체크섬 포함) 숫자만
- CODE39: 영숫자 + 공백, 대시, 점, $, /, +, %
- CODE128: 전체 ASCII (빈 문자열 제외)

**예시**:
```typescript
validateInput({ data: '978014300723', format: 'EAN13' })
// → { valid: true }

validateInput({ data: 'HELLO@WORLD', format: 'CODE39' })
// → { valid: false, error: { code: 'invalidCharacter' } }
```

#### `loadBarcodeEncoder(format: BarcodeFormat): Promise<BarcodeClass>`
**목적**: jsbarcode 클래스를 동적으로 로드 (bin/ CJS 경로)

**구현 세부**:
- EAN13: `jsbarcode/bin/barcodes/EAN_UPC/EAN13.js` (named export `.default`)
- UPC: `jsbarcode/bin/barcodes/EAN_UPC/UPC.js` (named export `.default`)
- CODE39: `jsbarcode/bin/barcodes/CODE39/index.js` (named export `CODE39`)
- CODE128: `jsbarcode/bin/barcodes/CODE128/index.js` (named export `CODE128`)

**예시**:
```typescript
const EAN13Class = await loadBarcodeEncoder('EAN13');
const encoder = new EAN13Class('978014300723', {});
encoder.encode(); // → segment array
encoder.data;     // → '9780143007234' (체크섬 포함)
```

#### `encodeBarcode(input: BarcodeInput, options: BarcodeOptions, BarcodeEncoderClass: BarcodeClass): EncodedBarcode`
**목적**: 입력 데이터를 인코딩하고 정규화 (EAN/UPC 세그먼트 배열 → flat bars)

**불변식**:
- `bars`: segment array의 `.data` 필드들을 순서대로 연결한 이진 문자열 (또는 CODE39/CODE128의 `.data`)
- `textContent`: `options.textVisible`이 false면 빈 문자열, true면 인코더의 `.text` (체크섬 포함)
- `encodedValue`: 항상 인코더의 `.data` (체크섬 포함)
- `svgString`: `normalizeBarcodeSVG(bars, width, textContent)` 결과

**에러 처리**:
- jsbarcode 예외 → 타입드 에러코드로 변환 (원시 메시지 노출 금지)
- 체크섬 실패: `'checksumError'`
- 기타 실패: `'encodingFailed'`

**예시**:
```typescript
const EAN13Class = await loadBarcodeEncoder('EAN13');
const result = encodeBarcode(
  { data: '978014300723', format: 'EAN13' },
  { width: 200, textVisible: true },
  EAN13Class
);
// → {
//     bars: '101011101000110010011001100101011...',
//     svgString: '<svg ...>...</svg>',
//     textContent: '9780143007234',
//     encodedValue: '9780143007234',
//     format: 'EAN13'
//   }
```

#### `validateChecksum(input: BarcodeInput, BarcodeEncoderClass: BarcodeClass): boolean`
**목적**: 체크섬 검증 (jsbarcode `.valid()` 메서드 사용)

**예시**:
```typescript
const EAN13Class = await loadBarcodeEncoder('EAN13');
validateChecksum({ data: '9780143007234', format: 'EAN13' }, EAN13Class)
// → true

validateChecksum({ data: '9780143007233', format: 'EAN13' }, EAN13Class)
// → false
```

#### `normalizeBarcodeSVG(barPattern: string, width: number, textContent?: string): string`
**목적**: 이진 bar 패턴을 SVG XML로 변환 (hand-rolled, jsbarcode 렌더러 미사용)

**SVG 생성 규칙**:
- `<svg xmlns="...">` 래퍼
- 흰색 배경 `<rect>`
- bar pattern의 각 `'1'` → 검은색 `<rect>`
- `textContent`가 있으면 하단에 `<text>` 엘리먼트
- `viewBox` = bar count × height (높이는 너비의 0.5배 표준 비율)
- XML 특수 문자 이스케이프 (XSS 방지)

**예시**:
```typescript
normalizeBarcodeSVG('101010101010', 200, '9780143007234')
// → '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 100" width="200" height="120">
//     <rect width="12" height="100" fill="white"/>
//     <rect x="0" y="0" width="1" height="100" fill="black"/>
//     <rect x="2" y="0" width="1" height="100" fill="black"/>
//     ...
//     <text x="6" y="112" text-anchor="middle" font-size="12" font-family="monospace" fill="black">9780143007234</text>
//   </svg>'
```

### 3. 스키마 (zod)

#### `BarcodeFormatSchema`
```typescript
const BarcodeFormatSchema = z.enum(['EAN13', 'UPC', 'CODE39', 'CODE128']);
```

#### `BarcodeInputSchema`
```typescript
const BarcodeInputSchema = z.object({
  data: z.string().min(1, 'data_required').max(256, 'data_too_long'),
  format: BarcodeFormatSchema,
});
```

#### `BarcodeOptionsSchema`
```typescript
const BarcodeOptionsSchema = z.object({
  width: z.number().min(100).max(300).default(200),
  textVisible: z.boolean().default(true),
});
```

---

## 도메인 불변식

### 정규화 원칙
- **EAN13/UPC**: encode()는 세그먼트 배열 반환 → 각 segment의 `.data`를 순서대로 연결해 `bars` 필드 생성
- **CODE39/CODE128**: encode()는 단일 객체 반환 → `.data`를 직접 `bars` 필드에 할당
- **양쪽 모두**: encoder 인스턴스의 `.data` 필드가 실제 인코딩된 값(체크섬 포함)이므로 `encodedValue` 로 사용

### 에러 처리
- jsbarcode 원시 예외/메시지를 상위로 노출하지 않음 (BarcodeErrorCode로 변환)
- 체크섬은 jsbarcode `.valid()` 메서드에 위임 (자체 구현 금지)

### 순수성
- 모든 함수는 부수효과 없음 (결정적, 재시드 가능)
- React/Next/DOM import 절대 금지

---

## 테스트 커버리지

**최종 결과**: 44개 테스트, 모두 통과

### 테스트 분류

#### 1. Validation Tests (19개)
- EAN13: 12/13자리, 11/14자리 거부, 숫자 외 거부
- UPC: 11/12자리, 10/13자리 거부, 숫자 외 거부
- CODE39: 특수문자 허용, 미허가 문자 거부, 소문자 수락
- CODE128: 전체 ASCII, 빈 문자열 거부, whitespace 거부
- Edge: 모든 형식의 빈/공백 거부

#### 2. Encoder Tests (14개)
- EAN13: 12자리 auto-checksum, 13자리 full, text toggle, width scaling
- UPC: 11자리 auto-checksum, 12자리 full, checksum validation
- CODE39: alphanumeric + special, 미허가 문자 거부
- CODE128: full ASCII, punctuation
- loadBarcodeEncoder: 4개 형식 로드 성공

#### 3. SVG Export Tests (11개)
- 유효한 SVG XML, xmlns/viewBox/width 속성
- Text 포함/미포함, XML 특수 문자 이스케이프
- 빈 bar pattern, 흰색 배경, 검은색 bar
- 다양한 너비(100-300px), 긴 패턴

---

## 청사진과의 변경사항

### 1. `normalizeBarcodeSVG` SVG 렌더링 개선
**변경 전**: bar count를 viewBox width로, 고정 height
**변경 후**: 표준 비율 (2:1)을 적용해 viewBox 계산, text offset 추가

**근거**: jsbarcode 세그먼트 배열의 실제 개수만으로는 SVG 정확성 부족 → 너비와 높이의 표준 비율 확보

### 2. `encodeBarcode` encoder 인스턴스 사용
**변경 전**: segment array만 처리
**변경 후**: encoder 인스턴스의 `.data`/`.text` 속성 활용해 체크섬 포함 값 정확히 추출

**근거**: jsbarcode의 segment array는 partial text를 가짐 (특히 EAN/UPC) → encoder 인스턴스의 속성이 실제 인코딩된 전체 값

### 3. jsbarcode 타입 미비 대응 (리더 수정)
**시도했다 실패한 방법**: `jsbarcode.d.ts`(ambient `declare module`)로 bin/ 경로에 타입 부여 시도 — 하지만 `allowJs:true`에서 ambient 선언과 동일 specifier가 실제 .js 파일로 리졸브되면 TS가 ambient 선언을 무시하고 실제 파일을 써서(암묵적 any) tsc 에러가 그대로 남았다.

**최종 방법**: `jsbarcode.d.ts` 삭제, 대신 `encoder.ts`의 4개 동적 import 각각에 `// @ts-expect-error`(import 표현식 바로 윗줄, 한 줄로 합친 import)를 붙이고 결과를 `as {default: BarcodeClass}` 등으로 캐스팅. `pnpm exec tsc --noEmit` 0 에러 확인됨.

### 4. `BarcodeStoreSchema` 추가 (리더 보완)
**파일**: `schema.ts`

**근거**: SPEC의 `<barcode_store>`(localStorage 불변식)에 대응하는 zod 스키마가 원래 누락돼 있었다 — `schema.ts`가 0% 커버리지로 미사용 상태였음. `BarcodeStoreSchema = z.object({ version: z.literal(1), recentInputs: z.array(z.string().max(100)).max(5), lastFormat: BarcodeFormatSchema, lastWidth: z.number().min(100).max(300) })` 추가 + `schema.test.ts`(19 테스트) 신설. `useBarcodeGenerator.ts`는 localStorage 읽기 시 `BarcodeStoreSchema.safeParse()`로 검증하고 실패하면 fresh 시작(throw 금지).

---

## 파일 구조 최종

```
src/lib/barcode-generator/
├── types.ts                   # BarcodeFormat, BarcodeInput, BarcodeOptions, EncodedBarcode
├── schema.ts                  # zod schemas (BarcodeFormatSchema, BarcodeInputSchema, BarcodeOptionsSchema, BarcodeStoreSchema)
├── schema.test.ts             # 19개 스키마 테스트 (Input/Options/Store 유효·무효 케이스)
├── validation.ts              # validateInput() 순수 함수
├── validation.test.ts         # 19개 validation 테스트
├── encoder.ts                 # loadBarcodeEncoder(), encodeBarcode(), validateChecksum() — jsbarcode 타입 없음은 @ts-expect-error로 처리
├── encoder.test.ts            # 14개 encoder 통합 테스트 (진짜 jsbarcode)
├── svg-export.ts              # normalizeBarcodeSVG() hand-rolled SVG 생성
├── svg-export.test.ts         # 11개 SVG XML 검증 테스트
└── index.ts                   # 공개 API 배럴
```

**최종 게이트**: 63/63 테스트 통과, `tsc --noEmit` 0 에러, 도메인 커버리지 93.06%(목표 ≥90% 충족).

---

## 다음 담당자를 위한 메모

### UI 엔지니어 (useBarcodeGenerator 훅 + 컴포넌트)
- `encodeBarcode()`는 **동기 함수**이지만, `loadBarcodeEncoder()`는 **비동기**
- 따라서 훅에서 mount 시 한 번 로드하고, 인코더 클래스를 state에 보관한 뒤 인코딩 시 주입
- 디바운스 필요 (SPEC: 100ms)
- localStorage: recentInputs[], lastFormat, lastWidth

### Platform 엔지니어
- registry entry: id="barcode-generator", slug="barcode-generator", accent="mint", status="live"
- i18n namespace: `tools.barcode-generator.*`
- SEO: Intro/HowTo/Faq (게이트 밖 SSR), SoftwareApplication + FAQPage JSON-LD

### QA 엔지니어
- E2E 테스트 시나리오는 SPEC의 final_integration_test 참고 (test_1~7)
- 도메인은 이미 44개 테스트로 커버되므로 UI/접근성/시각 회귀만 확인

---

**완료일**: 2026-07-22  
**테스트 결과**: 44/44 통과, tsc 0 에러  
**다음 담당**: ui-engineer (어댑터 계층)
