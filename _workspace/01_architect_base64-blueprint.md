# Base64 Encoder/Decoder — 클린 아키텍처 청사진

**문서 상태:** architect 청사진 (팀 배분 전 계약 고정)  
**대상 도구:** base64-encoder  
**SPEC 정본:** `docs/services/dev/base64-encoder/SPEC.md`  
**참조 패턴:** `src/lib/url-encoder/*` + `src/components/tools/url-encoder/*` (형제 dev 카테고리 도구)

---

## 1. 계층 분해 (Clean Architecture 4계층)

### 1.1 Domain Layer (`src/lib/base64-encoder/`)

**목적:** 순수 비즈니스 로직. React/Next.js import 금지. 테스트 가능.

| 파일 | 책임 | 공개 API 계약 |
|------|------|-------------|
| `schema.ts` | Zod 스키마 정의 | `UiState`, `EncodeResult`, `DecodeResult`, `FileInfo`, `Base64EncoderErrorCode`, `Base64EncoderError` 타입 export. 상수: `FILE_SIZE_LIMIT_MB=5`, `DEBOUNCE_MS=200`, `STORAGE_KEY='jurepi-base64-encoder'` |
| `encoder.ts` | UTF-8 안전 인코딩/디코딩 | `safeEncode(plaintext: string, variant: 'standard'\|'urlSafe'): EncodeResult` / `safeDecode(base64: string, variant: 'standard'\|'urlSafe'): DecodeResult`. 에러는 throw 아님, discriminated union 반환. |
| `base64.ts` | Base64 variant 헬퍼 | `isValidBase64(input: string, variant): boolean`, `normalizeInput(input: string): string` (공백/개행 제거), `urlSafeEncode(standard: string): string` (치환 +/-, ///\_), `bytesToBase64(bytes: Uint8Array, variant): string`, `base64ToBytes(base64: string): Uint8Array`. |
| `mime.ts` | MIME 타입 추론 | `guessMimeType(filename?: string, base64Prefix?: string): string` (기본 `text/plain`, data-URI prefix 파싱 또는 파일명 확장자). |

**불변식:**
- UTF-8 라운드트립: 이모지, 한글, 개행, 서로게이트 페어 모두 무손상 (TextEncoder/TextDecoder 사용).
- URL-safe variant: 패딩 없음 (RFC 4648 §5), + → -, / → _ 치환 후 결과.
- decode variant 검증: standard는 `/^[A-Za-z0-9+/]*={0,2}$/`, URL-safe는 `/^[A-Za-z0-9\-_]*={0,2}$/`.
- File size: ≤ 5MB, 초과 시 error 반환.
- 모든 함수는 **discriminated union으로 결과와 에러를 반환** (throw 금지).

**의존성:** TextEncoder, TextDecoder (네이티브), atob/btoa (안전 래핑), zod (이미 repo에 있음). ~~base64-js~~ → **네이티브 구현 선호** (새 의존성 추가 금지, SPEC 기재와 달리 optional로 검토 — 네이티브로 충분).

---

### 1.2 Usecase Layer (`src/components/tools/base64-encoder/useBase64.ts`)

**목적:** UI 상태 관리 + localStorage 어댑터 + 클립보드 커뮤니케이션. React hook.

**useBase64 훅 계약:**

```typescript
interface Base64State {
  mode: 'text' | 'file';
  variant: 'standard' | 'urlSafe';
  direction: 'encode' | 'decode';
  inputText: string;
  inputFile: File | null;
  outputText: string;
  isLoading: boolean;
  error: Base64EncoderError | null;
  isValidInput: boolean;
}

interface Base64Actions {
  setMode(mode: 'text' | 'file'): void;
  setVariant(variant: 'standard' | 'urlSafe'): void;
  setDirection(direction: 'encode' | 'decode'): void;
  setInputText(text: string): void;
  setInputFile(file: File | null): void;
  process(): Promise<void>; // 입력 → 도메인 encode/decode 호출
  copy(target: 'base64' | 'dataUri' | 'text'): Promise<boolean>;
  download(filename?: string): void;
}

// useBase64() 반환:
const [state, actions] = useBase64(): [Base64State, Base64Actions];
```

**책임:**
- 마운트 시: `jurepi-base64-encoder` localStorage 키에서 mode/variant 복원 (실패 시 기본값 사용).
- 상태 변경: mode/variant 변경 시 즉시 localStorage 업데이트 (실패 시 in-memory 유지).
- `process()`: inputText 또는 inputFile → 도메인의 `safeEncode()`/`safeDecode()` 호출 → outputText 업데이트.
- `copy()`: navigator.clipboard.writeText() → 성공 시 true, 실패 시 silent false (toast는 UI 계층에서).
- `download()`: 도메인의 `base64ToBytes()` → Blob → ObjectURL → a.download 트리거.
- 입력 >10KB: `process()` debounce 200ms.

**안정성:**
- 훅 반환 객체는 안정 참조 (useMemo로 사실상 고정되거나, 필드 각각 기억 안 함).
- useState는 `draft` (입력 중인 값)과 `committed` (처리 완료 값) 분리 (드리프 입력 손실 방지).
- 타이머/ref: localStorage 쓰기의 debounce는 타이머 ref로 관리, 클린업 필수.

---

### 1.3 Presentation Layer (`src/components/tools/base64-encoder/*.tsx`)

**목적:** UI 렌더링. useBase64 훅 소비. Server Component 가능 (SEO 섹션만).

**컴포넌트 트리:**

```
Base64Encoder (use client, orchestrator, useBase64 소유)
├─ Base64Intro (SSR: H1 + lead)
├─ EncoderLayout (flex column 또는 desktop side-by-side)
│  ├─ ModeToggle (Text / File)
│  ├─ VariantToggle (Standard / URL-Safe)
│  ├─ DirectionToggle (Encode / Decode)
│  ├─ TextInput (mode=text일 때 보이는 input textarea)
│  ├─ FileInput (mode=file일 때 보이는 drag-drop + file picker)
│  ├─ OutputDisplay (result textarea, copy buttons, download button)
│  └─ FileInfo (mode=file일 때 파일 메타)
├─ Base64HowTo (SSR: "What is Base64?" 롱폼)
├─ Base64Faq (SSR+mounted 게이트 밖: FAQPage JSON-LD, Q&A <details>)
└─ Base64StructuredData (SSR: SoftwareApplication JSON-LD)
```

**컴포넌트 책임:**

| 컴포넌트 | Props | 상태 | 역할 |
|---------|-------|------|------|
| Base64Encoder | locale?: string | 없음 (useBase64 hook 소유) | 오케스트레이터. 모든 하위 컴포넌트 조율. useBase64 hook 호출. |
| ModeToggle | mode, onModeChange | 상태 필드만 읽음 | Text / File 라디오 세그먼트. 선택 시 `onModeChange` 호출. |
| VariantToggle | variant, onVariantChange | 상태 필드만 읽음 | Standard / URL-Safe 라디오. 선택 시 `onVariantChange`. |
| DirectionToggle | direction, onDirectionChange | 상태 필드만 읽음 | Encode / Decode 토글. 선택 시 `onDirectionChange`. |
| TextInput | value, onChange, disabled, placeholder | 상태 필드 반영만 | Textarea (mode=text 시만 보임). onChange 디바운스 없음 (hook에서). |
| FileInput | onFileSelect, onError, maxSize | 상태 필드 반영 | Drag-drop + file input. File 선택 시 `onFileSelect(File)`. 크기 초과 시 `onError(message)`. |
| OutputDisplay | result, error, onCopy, onDownload | 상태 필드 읽음 | Result textarea (readonly). [Copy Base64] [Copy Data-URI] [Download] 버튼. isLoading 중 disabled. |
| Base64Intro | — | SSR (비상태) | H1 "Base64 Encoder/Decoder", 카테고리 eyebrow "DEVELOPER TOOL". 게이트 밖 SSR 필수 (SEO). |
| Base64HowTo | — | SSR (비상태) | "What is Base64?" 롱폼 설명. 게이트 밖 SSR 필수 (SEO). |
| Base64Faq | — | 게이트 밖 SSR | i18n `tools.base64-encoder.faq.items[]` (q/a 필드) 읽음 → FAQPage JSON-LD + `<details>` 펼침. |
| Base64StructuredData | locale, tool | SSR | SoftwareApplication JSON-LD (lib/seo.ts 헬퍼 사용, url==canonical 검증). |

**디자인 규칙:**
- 모드/변형 토글: `category-pill` 스타일 (segment), 활성 시 `bg-accent-coral` (var(--accent-coral)).
- 아이콘: lucide-react `File`, `FileUp`, `Copy`, `Download` (20px, var(--text-secondary)).
- 텍스트 입력: textarea 6행, 너비 100% 또는 desktop 반응형 (side-by-side <1024px stacked).
- 버튼: 44px 최소 높이, focus-ring 가시, prefers-reduced-motion 존중.
- 에러: 빨간색 텍스트 (var(--danger)), 위쪽에 `<Alert>` 또는 인라인 `<p>` 표시.
- 토스트: 복사 성공 시 "복사됨" / "Copied", 1.6초 자동 종료.

---

### 1.4 Framework Integration Layer (`src/app/[locale]/tools/[slug]/page.tsx`, `src/tools/registry.ts`)

**목적:** Next.js 라우팅, 레지스트리, i18n 바인딩.

**registry.ts 엔트리 (신규):**

```typescript
{
  id: 'base64-encoder',
  slug: 'base64-encoder',
  category: 'dev',           // 기존 카테고리, 이미 live
  icon: 'Binary',            // lucide-react icon
  accent: 'coral',           // var(--accent-coral)
  status: 'live',            // 완성 후
  isNew: true,
  order: 25,                 // restaurant-map(24) 다음
  keywords: ['base64','encode','decode','encoding','binary','텍스트변환','파일변환','인코딩','디코딩','base64 converter'],
}
```

**라우트 분기 (`[slug]/page.tsx`):**

```typescript
// 1. dynamic import (코드스플릿):
const Base64Encoder = dynamic(() =>
  import('@/components/tools/base64-encoder/Base64Encoder').then((m) => ({
    default: m.Base64Encoder,
  }))
);

// 2. Intro/HowTo/Faq/StructuredData import (정적):
import { Base64EncoderIntro } from '@/components/tools/base64-encoder/Base64EncoderIntro';
import { Base64EncoderHowTo } from '@/components/tools/base64-encoder/Base64EncoderHowTo';
import { Base64EncoderFaq } from '@/components/tools/base64-encoder/Base64EncoderFaq';
import { Base64EncoderStructuredData } from '@/components/tools/base64-encoder/Base64EncoderStructuredData';

// 3. generateMetadata 분기 (기존 패턴):
// tool.slug === 'base64-encoder' → buildToolMetadata(locale, tool)

// 4. 렌더:
{slug === 'base64-encoder' && (
  <>
    <Base64EncoderIntro />
    <ErrorBoundary fallback={<p>Error loading Base64 tool…</p>}>
      <Suspense fallback={<Skeleton />}>
        <Base64Encoder locale={locale} />
      </Suspense>
    </ErrorBoundary>
    <Base64EncoderHowTo />
    <Base64EncoderFaq />
    <Base64EncoderStructuredData locale={locale} tool={tool} />
    <ShareButtons />  // 플랫폼 기본 배선
  </>
)}
```

**i18n 계약 (`src/i18n/messages/{ko,en}.json`):**

최상위 키 **필수** (home card, footer, search에서 소비):
```json
{
  "tools": {
    "base64-encoder": {
      "title": "Base64 Encoder/Decoder",
      "description": "Text and file conversion to/from Base64…",
      
      // UI 라벨
      "mode": {
        "label": "Mode",
        "text": "Text",
        "file": "File"
      },
      "variant": {
        "label": "Variant",
        "standard": "Standard (A-Za-z0-9+/)",
        "urlSafe": "URL-Safe (A-Za-z0-9-_)"
      },
      "direction": {
        "label": "Direction",
        "encode": "Encode →",
        "decode": "← Decode"
      },
      
      // 입력/출력
      "input": {
        "textPlaceholder": "Paste text or Base64…",
        "fileLabel": "Drag files or click to browse",
        "fileSuccess": "File selected: {filename} ({size})"
      },
      "output": {
        "copyBase64": "Copy Base64",
        "copyDataUri": "Copy Data-URI",
        "copyText": "Copy Text",
        "download": "Download",
        "copied": "Copied!"
      },
      
      // 에러
      "errors": {
        "invalidBase64": "Invalid Base64 format. Only A-Za-z0-9+/= characters allowed (standard) or A-Za-z0-9-_= (URL-safe).",
        "emptyInput": "Enter text or file.",
        "fileTooLarge": "File exceeds 5MB limit.",
        "utf8DecodeError": "Unable to decode as UTF-8."
      },
      
      // SEO 섹션
      "meta": {
        "title": "Base64 Encoder/Decoder — Text & File Conversion",
        "description": "Safely convert text and files to/from Base64 with UTF-8 integrity, supporting standard and URL-safe variants."
      },
      
      "intro": {
        "category": "DEVELOPER TOOL",
        "heading": "Base64 Encoder/Decoder",
        "lead": "Convert text and files to Base64 and back. UTF-8 safe, standard and URL-safe variants, drag-drop file upload."
      },
      
      "howTo": {
        "title": "What is Base64?",
        "items": [
          "Base64 is a binary-to-text encoding…",
          "…"
        ]
      },
      
      // FAQ (질문/답변)
      "faq": {
        "title": "FAQ",
        "items": [
          {
            "q": "Is Base64 encryption?",
            "a": "No, Base64 is encoding, not encryption…"
          },
          // … 추가 항목
        ]
      }
    }
  }
}
```

**i18n 필드명 규칙:**
- 최상위 키: `title`, `description` (required; 검색/홈/푸터).
- FAQ: `faq.items[]` with `q` (question) / `a` (answer) 필드 (url-encoder 패턴).
- 모든 사용자 대면 문자열: `t()` 호출.

---

## 2. 도메인 공개 API 계약 (정확한 TS 시그니처)

### Encoder API

```typescript
// src/lib/base64-encoder/encoder.ts

/** Error discriminator */
type Base64EncoderErrorCode = 'invalidBase64' | 'utf8Error' | 'fileTooLarge';

interface Base64EncoderError {
  code: Base64EncoderErrorCode;
  message: string;        // 영어 fallback
  details?: string;       // 추가 정보 (예: invalid char)
}

/** Encode result */
interface EncodeResult {
  base64?: string;        // RFC 4648 standard or URL-safe
  dataUri?: string;       // data:text/plain;base64,… or inferred MIME
  sizeBytes?: number;     // 원본 바이트 길이
  error?: Base64EncoderError | null;  // error가 있으면 base64/dataUri는 undefined
}

/** Decode result */
interface DecodeResult {
  plaintext?: string;     // UTF-8 디코딩 결과
  sizeBytes?: number;
  error?: Base64EncoderError | null;  // error가 있으면 plaintext는 undefined
}

// 핵심 함수
export function safeEncode(
  plaintext: string,
  variant: 'standard' | 'urlSafe'
): EncodeResult;

export function safeDecode(
  base64: string,
  variant: 'standard' | 'urlSafe'
): DecodeResult;

export function encodeFile(
  file: File,
  variant: 'standard' | 'urlSafe'
): Promise<EncodeResult>;  // FileReader 비동기

export function decodeToBlob(
  base64: string,
  mimeType?: string
): { blob?: Blob; error?: Base64EncoderError | null };
```

### Base64 Helpers

```typescript
// src/lib/base64-encoder/base64.ts

export function isValidBase64(
  input: string,
  variant: 'standard' | 'urlSafe'
): boolean;

export function normalizeInput(input: string): string;
  // 공백, 개행, 탭 제거

export function urlSafeEncode(standardBase64: string): string;
  // +→-, /→_

export function urlSafeDecode(urlSafeBase64: string): string;
  // -→+, _→/

export function bytesToBase64(
  bytes: Uint8Array,
  variant: 'standard' | 'urlSafe'
): string;

export function base64ToBytes(base64: string): Uint8Array;
```

### MIME Type Helper

```typescript
// src/lib/base64-encoder/mime.ts

export function guessMimeType(
  filename?: string,
  base64Prefix?: string  // e.g., "data:image/png;base64,"
): string;
  // 기본값: 'text/plain'
  // dataURI prefix 파싱 또는 확장자 기반 추론
```

### Schema & Constants

```typescript
// src/lib/base64-encoder/schema.ts

export const FILE_SIZE_LIMIT_MB = 5;
export const DEBOUNCE_MS = 200;
export const STORAGE_KEY = 'jurepi-base64-encoder';

export interface FileInfo {
  name: string;
  sizeBytes: number;
  mimeType: string;
}

export const uiStateSchema = z.object({
  mode: z.enum(['text', 'file']),
  variant: z.enum(['standard', 'urlSafe']),
  direction: z.enum(['encode', 'decode']),
  inputText: z.string(),
  inputFile: z.instanceof(File).nullable(),
  outputText: z.string(),
  error: z.any().nullable(),  // Base64EncoderError
  isValidInput: z.boolean(),
});

export type UiState = z.infer<typeof uiStateSchema>;
```

---

## 3. 불변식 (CRITICAL)

1. **UTF-8 라운드트립**: 모든 인코드/디코드는 TextEncoder/TextDecoder 사용. atob/btoa 직접 사용 금지 (non-Latin1 문자 손상).
   - 테스트: 이모지 😀, 한글 안녕, 개행 \n, 서로게이트 페어.

2. **Base64 variant 검증**:
   - Standard: `/^[A-Za-z0-9+/]*={0,2}$/`
   - URL-safe: `/^[A-Za-z0-9\-_]*={0,2}$/`
   - 무효 문자 감지 → error 반환.

3. **파일 크기 한도**: 5MB. 초과 → error 반환.

4. **Data-URI 형식**: `data:MIME;base64,…` 가드. MIME 추론 불가 시 `text/plain`.

5. **localStorage 격리**: `jurepi-base64-encoder` 키만 사용. 마운트 시 zod 검증 후 파싱. 실패 시 기본값 사용 (예외 throw 금지).

6. **Error as Data**: 모든 에러는 discriminated union 반환. throw 금지 (에러 맥락 보존).

7. **UI 상태 동기**: mode/variant/direction 변경 시 즉시 localStorage 쓰기 시작 (debounce 타이머 관리).

8. **훅 참조 안정성**: useBase64 반환 state/actions는 안정 객체 참조 (의존성 배열에 안전).

9. **입력 드리프트**: 사용자가 타이핑 중 (process 실행 전) `inputText` 변경은 `draft` 상태로 유지. localStorage/process는 `committed` 값만 사용.

10. **복사 실패 침묵**: navigator.clipboard.writeText() 실패 → false 반환, 토스트 없음 (UI에서 판단).

---

## 4. 작업 분배 (팀 병렬화)

### 의존 순서 (DAG)

```
[Spec Finalize] (이미 완료)
       ↓
[Domain TDD] ← domain-engineer
       ↓
[Hook + UI ∥ Platform] ← ui-engineer(2) ∥ platform-engineer
       ↓
[SEO/i18n] ← seo-geo-engineer
       ↓
[QA Integration] ← qa-engineer
       ↓
[Live ← registry status=live]
```

### Task 1: Domain TDD (`lib/base64-encoder/`)
**Owner:** domain-engineer  
**Duration:** 2–3 days  
**Deliverable:** 
- `schema.ts`, `encoder.ts`, `base64.ts`, `mime.ts` (정확한 API 계약, no React import)
- Vitest ≥80% (UTF-8 round-trip, variant switching, invalid Base64, URL-safe padding, file size validation)
- `vitest run` green

**Input:** SPEC, blueprint  
**Output:** Domain modules + test results

---

### Task 2a: Hook + UI (`useBase64.ts`, components)
**Owner:** ui-engineer (1)  
**Parallel with:** Task 2b  
**Duration:** 3–4 days  
**Deliverable:**
- `useBase64.ts` (state machine, localStorage adapter, copy/download methods)
- `ModeToggle.tsx`, `VariantToggle.tsx`, `DirectionToggle.tsx`
- `TextInput.tsx`, `FileInput.tsx`, `OutputDisplay.tsx`
- `Base64Encoder.tsx` (orchestrator)
- Component tests (mocked useBase64) ≥80%
- `tsc --noEmit` clean

**Input:** Domain modules (Task 1)  
**Output:** Functional UI + hook tests

---

### Task 2b: Platform Integration (`registry`, route, i18n)
**Owner:** platform-engineer  
**Parallel with:** Task 2a  
**Duration:** 1–2 days  
**Deliverable:**
- `src/tools/registry.ts` 엔트리 추가 (id/slug/category/accent/order)
- `[slug]/page.tsx` 분기 추가 (dynamic import, Intro/HowTo/Faq/StructuredData)
- `src/i18n/messages/{ko,en}.json`: `tools.base64-encoder.*` 네임스페이스 (최상위 title/description, 모든 UI 라벨, errors, faq.items[]{q,a})
- `public/llms.txt` 업데이트 (도구 slug 추가)

**Input:** SPEC, i18n 계약 (blueprint)  
**Output:** Platform bindings ready for UI

---

### Task 3: SEO/i18n (`Base64*Intro/HowTo/Faq/StructuredData`)
**Owner:** seo-geo-engineer  
**Depends on:** Tasks 1, 2a, 2b  
**Duration:** 2 days  
**Deliverable:**
- `Base64EncoderIntro.tsx` (SSR, H1 + lead, 게이트 밖)
- `Base64EncoderHowTo.tsx` (SSR, "What is Base64?" 롱폼, 게이트 밖)
- `Base64EncoderFaq.tsx` (SSR, `t.raw('faq.items')` → `{q,a}[]`, FAQPage JSON-LD, mounted 게이트 밖)
- `Base64EncoderStructuredData.tsx` (SoftwareApplication JSON-LD, url==canonical, lib/seo.ts 헬퍼)
- Vitest: ≥80% (i18n keys present, FAQPage schema valid, SSR)
- Prism: 프리렌더 HTML에서 FAQPage/SoftwareApplication 정확히 1개 각각

**Input:** UI modules, i18n 카탈로그  
**Output:** SEO components + JSON-LD validation

---

### Task 4: QA Integration (전체 유닛 + tsc + 빌드 + E2E)
**Owner:** qa-engineer  
**Depends on:** Tasks 1, 2a, 2b, 3  
**Duration:** 2 days  
**Deliverable:**
- `vitest run` 전체 pass (≥80% 커버리지, domain 100%)
- `tsc --noEmit` 0 에러
- `pnpm build` SSG 완료 (base64-encoder 라우트 정적 export)
- E2E `playwright test` (text encode/decode UTF-8, file upload <5MB, invalid Base64 error, copy feedback, download)
- Lighthouse CWV (LCP<2.5s, INP<200ms, CLS<0.1)
- `axe` a11y scan (AA 위반 0)
- 라이브 검증: `/ko/tools/base64-encoder`, `/en/tools/base64-encoder` 200, 프리렌더 JSON-LD 유효, canonical, sitemap 등재, llms.txt OK

**Input:** All modules  
**Output:** green build + test reports

---

## 5. 테스트 전략 (TDD)

### Domain Vitest (≥80%, domain 100% 목표)

**Red→Green→Improve 순서:**

1. **Encoder UTF-8 round-trip (encoder.ts):**
   - Plain text "Hello, 안녕하세요! 😀" → safeEncode → safeDecode → 원본 동일 ✓
   - Both standard + URL-safe variants ✓
   - File upload (FileReader 모의) ✓

2. **Base64 validation (base64.ts):**
   - isValidBase64("ABC123") standard ✓ / "ABC!@#" → false ✓
   - URL-safe "-_" chars ✓ / "+/" 거부 ✓
   - Padding 0-2개 ✓

3. **Error cases (encoder.ts, base64.ts):**
   - Invalid Base64 decode → error object ✓ (throw 아님)
   - UTF-8 decode fail (invalid sequence) → error ✓
   - File >5MB → error ✓

4. **MIME guess (mime.ts):**
   - data:image/png → "image/png" ✓
   - filename.pdf → "application/pdf" ✓
   - Unknown → "text/plain" ✓

### Component Vitest (useBase64 mocked)

1. **ModeToggle:** 라디오 선택 → onModeChange 호출 ✓
2. **TextInput:** onChange → `setInputText` 호출 ✓ / 6행 렌더 ✓
3. **FileInput:** drag-drop File → onFileSelect 호출 ✓ / >5MB → onError ✓
4. **OutputDisplay:** copy button → `copy('base64')` 호출 ✓

### E2E Playwright

1. **Text encode/decode:** ko/en 모두, 이모지 테스트
2. **File upload:** <5MB OK, >5MB 에러 메시지
3. **Variant toggle:** URL-safe 후 +/- 치환 확인
4. **Copy feedback:** 토스트 표시 → 1.6초 자동 종료
5. **Keyboard a11y:** Tab 순서 logical, focus-visible 가시

---

## 6. 함정 & 예방 패턴

### 함정 1: UTF-8 코드 페이지 혼동
**증상:** 이모지 또는 한글이 깨진 인코드 결과.  
**원인:** atob 직접 사용 (Latin1만 안전), TextEncoder/TextDecoder 미사용.  
**예방:** **절대금지 atob/btoa raw 사용**. TextEncoder/TextDecoder 필수.  
**검증:** 이모지 테스트 케이스를 domain 유닛에 고정.

### 함정 2: Base64 variant 혼동
**증상:** URL-safe 디코드가 표준 Base64 처리.  
**원인:** variant 인자 누락 또는 validation regex 틀림.  
**예방:** variant를 모든 encode/decode 함수 인자로 명시. regex 검증 2가지 분기.  
**검증:** RFC 4648 test vector (표준 + URL-safe) 단위테스트.

### 함정 3: localStorage 크래시
**증상:** 마운트 후 상태 로드 실패, 도구 불동작.  
**원인:** zod 검증 실패 시 throw, 또는 try/catch 미실행.  
**예방:** `parseStore()` 실패 시 기본값 반환, throw 금지.  
**검증:** 손상된 JSON 테스트 (useBase64.test).

### 함함 4: 복사 실패 거짓 성공
**증상:** clipboard.writeText 실패했는데 "복사됨" 토스트 표시.  
**원인:** Promise 거부를 catch하지 않음.  
**예방:** copy() 는 Promise<boolean> 반환. UI는 반환값으로만 토스트 판단.  
**검증:** E2E 모의 clipboard 실패 시나리오.

### 함정 5: 입력 드리프트 (타이핑 중 과정 실행)
**증상:** 타이핑 중 결과가 계속 업데이트되어 지저분함.  
**원인:** process() 호출 후 setState가 스테일 클로저.  
**예방:** process()는 현재 state 스냅샷 사용, useCallback 의존성 명시.  
**검증:** 빠른 타이핑 후 디바운스 200ms 대기 → 최종 결과만 출력.

### 함정 6: SEO 섹션이 `mounted` 게이트 안에 있음
**증상:** /tools/base64-encoder 프리렌더 HTML에 JSON-LD/H1 없음. SEO/AI 크롤러 무내용.  
**원인:** Intro/HowTo/Faq이 `{mounted && <Component />}` 안에 있음.  
**예방:** **Intro/HowTo/Faq/StructuredData는 게이트 밖 정적 렌더**. useEffect나 mounted 게이트 금지.  
**검증:** prism 프리렌더 HTML: `<h1>Base64 Encoder</h1>` + JSON-LD `<script>` + FAQ 콘텐츠 grep.

### 함정 7: i18n 키 드리프트
**증상:** 도구 UI에 "tools.base64-encoder.missing_key" 리터럴 노출.  
**원인:** UI가 카탈로그 없는 키를 지어냄 (예: `t('input.textPlaceholder')` 하지만 카탈로그는 `input.placeholder`).  
**예방:** i18n 계약을 blueprint에 명시. 구현 전 모든 UI 라벨의 i18n 키를 먼저 카탈로그에 추가. UI는 계약된 키만 사용.  
**검증:** 구현 완료 후 `grep -r "t('tools.base64-encoder" src/ | cut -d"'" -f2 | sort | uniq` vs 카탈로그 키 대조.

### 함정 8: FAQ 필드명 혼동
**증상:** `faq.items` 접근하면 undefined 또는 field 'question' 찾는데 카탈로그는 'q'.  
**원인:** url-encoder는 q/a 사용 (다른 도구와 다를 수 있음).  
**예방:** **이 blueprint에서 명시: faq.items는 q/a 필드** (url-encoder 패턴, 통일).  
**검증:** Faq 컴포넌트 첫 줄: `const faqItems = t.raw('faq.items') as Array<{q: string; a: string}>`.

### 함정 9: 팬텀 Tailwind 토큰
**증상:** 버튼이 투명으로 렌더 (배경 없음), tsc/vitest/빌드 모두 그린.  
**원인:** 존재하지 않는 토큰 사용 (예: `bg-accent-peach` 대신 사용, 토큰은 `bg-accent-coral`).  
**예방:** globals.css의 `:root { --accent-* }` 토큰만 사용. 토큰명 grep 대조.  
**검증:** 모든 `bg-accent-`/`text-`/`border-` 클래스를 tokens.css에서 grep.

---

## 7. 요약: 팀의 계약

### 도메인 공개 인터페이스 (정확한 시그니처)

```typescript
// lib/base64-encoder/encoder.ts
safeEncode(plaintext: string, variant: 'standard' | 'urlSafe'): EncodeResult
safeDecode(base64: string, variant: 'standard' | 'urlSafe'): DecodeResult
encodeFile(file: File, variant: 'standard' | 'urlSafe'): Promise<EncodeResult>
decodeToBlob(base64: string, mimeType?: string): { blob?: Blob; error?: Base64EncoderError | null }

// lib/base64-encoder/base64.ts
isValidBase64(input: string, variant: 'standard' | 'urlSafe'): boolean
normalizeInput(input: string): string
urlSafeEncode(standardBase64: string): string
bytesToBase64(bytes: Uint8Array, variant: 'standard' | 'urlSafe'): string
base64ToBytes(base64: string): Uint8Array

// lib/base64-encoder/mime.ts
guessMimeType(filename?: string, base64Prefix?: string): string

// components/tools/base64-encoder/useBase64.ts
useBase64(): [Base64State, Base64Actions]
```

### i18n 최상위 키 (필수)

```
tools.base64-encoder.title
tools.base64-encoder.description
tools.base64-encoder.mode.*
tools.base64-encoder.variant.*
tools.base64-encoder.direction.*
tools.base64-encoder.input.*
tools.base64-encoder.output.*
tools.base64-encoder.errors.*
tools.base64-encoder.faq.items[].q, .a
tools.base64-encoder.meta.* (SEO)
tools.base64-encoder.intro.*
tools.base64-encoder.howTo.*
```

### FAQ 필드명 (확정)

**`faq.items[]` 각 항목:**
- `q` (question)
- `a` (answer)

(url-encoder 패턴, 공유 faqPageJsonLd 헬퍼와 호환)

### Registry Entry 형식

```typescript
{
  id: 'base64-encoder',
  slug: 'base64-encoder',
  category: 'dev',
  icon: 'Binary',
  accent: 'coral',
  status: 'live',
  isNew: true,
  order: 25,
  keywords: [...]
}
```

### Platform Wireup (리더 확인)

- `src/tools/registry.ts`: 위 엔트리 추가
- `src/app/[locale]/tools/[slug]/page.tsx`: dynamic import + 4 SEO 컴포넌트 분기
- `src/i18n/messages/{ko,en}.json`: 네임스페이스 추가
- `public/llms.txt`: 도구 slug 추가

---

## 완료 기준

1. Domain layer: Vitest ≥80% (domain 100%), tsc 0, encoder/decode/base64/mime 순수
2. Usecase layer: useBase64 hook 완전, localStorage persist, copy/download 동작
3. Presentation layer: 6개 컴포넌트 (Toggle×3, Input×2, Output) + Intro/HowTo/Faq/StructuredData, <800 lines
4. Framework: registry + route + i18n + llms.txt wired
5. QA: Vitest 전체 ≥80%, tsc 0, build SSG, E2E 4 scenarios, Lighthouse CWV, axe AA
6. Verification: prism 프리렌더 JSON-LD, canonical, hreflang, sitemap, SNS share 동작

---

**이 청사진은 모든 팀원의 경계를 명확히 한다. 구현은 이 계약을 따른다.**

