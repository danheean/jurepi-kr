/**
 * Barcode Generator — Core Types
 * 열거형 및 기본 인터페이스만. 복잡한 검증은 schema.ts로.
 */

/**
 * 지원되는 바코드 형식
 */
export type BarcodeFormat = 'EAN13' | 'UPC' | 'CODE39' | 'CODE128';

/**
 * 사용자 입력 데이터 (미정규화)
 */
export interface BarcodeInput {
  data: string; // 사용자 입력 텍스트
  format: BarcodeFormat;
}

/**
 * 바코드 렌더링 옵션
 */
export interface BarcodeOptions {
  width: number; // 100–300px, 바코드 너비
  textVisible: boolean; // 사람이 읽을 수 있는 텍스트 표시 여부
}

/**
 * 인코딩된 바코드 출력
 *
 * 불변식:
 * - bars: 정규화된 단일 이진 bar/space 패턴 (예: "1010110...")
 *   EAN13/UPC는 세그먼트 배열을 이어붙여, CODE39/CODE128은 이미 단일이라 그대로 사용.
 *   svg-export.ts와 BarcodePreview 캔버스 드로잉 양쪽의 단일 소스.
 * - svgString: bars로부터 svg-export.ts가 파생한 SVG XML (hand-rolled, jsbarcode 렌더러 미사용)
 * - textContent: 사람이 읽을 수 있는 값 (또는 빈 문자열)
 * - encodedValue: 실제 인코딩된 값 (체크섬 포함)
 * - format: 참고용 형식 정보
 */
export interface EncodedBarcode {
  bars: string;
  svgString: string;
  textContent: string;
  encodedValue: string;
  format: BarcodeFormat;
}

/**
 * 타입드 에러 코드 (원시 라이브러리 메시지 노출 금지)
 */
export type BarcodeErrorCode =
  | 'lengthError' // 형식별 자리수 초과
  | 'invalidCharacter' // 형식에 허용되지 않는 문자
  | 'checksumError' // 체크섬 검증 실패
  | 'encodingFailed'; // jsbarcode 내부 실패

/**
 * 입력 검증 결과
 */
export interface BarcodeValidationResult {
  valid: boolean;
  error?: { code: BarcodeErrorCode; message?: string };
}
