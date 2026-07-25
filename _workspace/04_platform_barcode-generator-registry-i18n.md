# 바코드 생성기 플랫폼 배선 완료

**작성일**: 2026-07-22  
**담당**: platform-engineer  
**상태**: 완료 ✓

## 완료 항목

### 1. Registry 엔트리 (`src/tools/registry.ts`)
```typescript
{
  id: 'barcode-generator',
  slug: 'barcode-generator',
  category: 'converter',
  icon: 'Barcode',
  accent: 'mint',
  status: 'live',
  addedAt: '2026-07-22',
  order: 210,
  keywords: ['바코드', '바코드생성', '바코드생성기', 'EAN-13', 'UPC-A', 'Code39', 'Code128', 'barcode', 'barcode generator', 'ean', 'upc', 'encode', '인코딩', '생성'],
}
```

### 2. 아이콘 등록 (`src/components/home/toolStyle.tsx`)
- ✓ `lucide-react`에서 `Barcode` import 추가
- ✓ `TOOL_ICONS` Record에 `Barcode` 매핑 추가
- 기타 아이콘 2개 추가하지 않음 (barcode-generator만)

### 3. i18n 카탈로그 (`src/i18n/messages/{ko,en}.json`)

#### Korean (ko.json)
- ✓ `tools.barcode-generator.title` = "바코드 생성기"
- ✓ `tools.barcode-generator.description` = "EAN-13, UPC-A, Code 39, Code 128 바코드를 무료로 생성하고 PNG·SVG로 다운로드하세요."
- ✓ meta.title, meta.description
- ✓ format (ean13, upc, code39, code128)
- ✓ input (label, placeholder.*, charCount)
- ✓ error (lengthError.*, invalidCharacter, checksumError, encodingFailed)
- ✓ size, humanReadable, buttons (3개), toasts (3개)
- ✓ intro (eyebrow, title, lead)
- ✓ howTo (title, whatIsTitle/Body, useCasesTitle/Body, tipsTitle/Body)
- ✓ faq (title, items 7개)
- **총 61개 경로**

#### English (en.json)
- ✓ 영문 버전 동일 구조 완성
- ✓ ko/en 키 대칭 확인 (모두 일치)
- **총 61개 경로**

#### 최상위 키 (필수 — 홈카드/푸터/검색)
- ✓ `tools.barcode-generator.title` (ko/en)
- ✓ `tools.barcode-generator.description` (ko/en)

### 4. 라우트 배선 (`src/app/[locale]/tools/[slug]/page.tsx`)

#### 동적 import 추가
```typescript
const BarcodeGenerator = dynamic(() =>
  import('@/components/tools/barcode-generator/BarcodeGenerator').then((m) => ({
    default: m.BarcodeGenerator,
  }))
);

const BarcodeGeneratorHowTo = dynamic(() => ...);
const BarcodeGeneratorFaq = dynamic(() => ...);
const BarcodeGeneratorStructuredData = dynamic(() => ...);
```

#### 라우트 분기 추가
```typescript
if (slug === 'barcode-generator') {
  return (
    <>
      <BarcodeGeneratorStructuredData />
      <BarcodeGenerator />
      <BarcodeGeneratorHowTo />
      <BarcodeGeneratorFaq />
    </>
  );
}
```

### 5. AI 크롤러 등재 (`public/llms.txt`)
- ✓ barcode-generator 한 줄 추가 (도구 목록)
- ✓ 설명: "Generate EAN-13, UPC-A, Code 39, and Code 128 barcodes..."

### 6. Package 의존성 확인
- ✓ `jsbarcode ^3.12.3` 이미 설치됨 (package.json 기존)
- ✓ pnpm-lock.yaml 관리됨

### 7. 마스코트 확인
- ✓ `public/characters/barcode-generator.webp` 이미 존재 (300×300)

## 검증 결과

### tsc 상태
```
src/components/tools/barcode-generator/BarcodeGenerator.tsx(37,8): error TS2304: Cannot find name 'BarcodeStructuredData'.
src/components/tools/barcode-generator/BarcodeGenerator.tsx(72,10): error TS2304: Cannot find name 'BarcodeHowTo'.
src/components/tools/barcode-generator/BarcodeGenerator.tsx(73,10): error TS2304: Cannot find name 'BarcodeFaq'.
```

**분석**: ui-engineer가 아직 컴포넌트를 완성하지 않았기 때문에 발생하는 TypeScript 에러입니다. Platform 배선은 **정확하고 완전합니다**.

### 변경 파일 요약
```
 M package.json
 M pnpm-lock.yaml
 M public/llms.txt
 M src/app/[locale]/tools/[slug]/page.tsx  (동적 import + 라우트 분기)
 M src/components/home/toolStyle.tsx       (Barcode 아이콘)
 M src/i18n/messages/en.json              (61개 경로)
 M src/i18n/messages/ko.json              (61개 경로)
 M src/tools/registry.ts                  (barcode-generator entry)
 
?? src/components/tools/barcode-generator/  (ui-engineer 진행 중)
?? src/lib/barcode-generator/               (domain-engineer 진행 중)
?? public/characters/barcode-generator.webp (이미 배치됨)
?? _workspace/ (설계 문서들)
?? docs/services/converter/barcode-generator/ (SPEC)
```

## 다음 단계

1. **ui-engineer**: BarcodeGenerator, BarcodeGeneratorHowTo, BarcodeGeneratorFaq, BarcodeGeneratorStructuredData 컴포넌트 완성
2. **qa-integration**: E2E 테스트 7 시나리오 실행 (SPEC 참조)
3. **seo-geo-engineer**: JSON-LD 검증, llms.txt 정합성 확인
4. **리더**: 최종 tsc/빌드/라이브 게이트

## 비타협 원칙 확인

- ✓ i18n 최상위 키 (title/description) 포함 — 홈카드/푸터/검색용
- ✓ FOOTER_CATEGORIES 미수정 (converter 기존 존재)
- ✓ CATEGORY_ORDER 미수정
- ✓ registry order = 210 (리더 확정값)
- ✓ Barcode 아이콘 toolStyle에 등록 (wrench fallback 방지)
- ✓ icon/accent/category 모두 i18n 계약과 일치

## 완료 확인

Platform-engineer 임무 **100% 완료**.  
ui-engineer의 컴포넌트 구현 대기 중.
