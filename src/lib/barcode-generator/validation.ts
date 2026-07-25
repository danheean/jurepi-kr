/**
 * Barcode Generator — Input Validation
 * 형식별 기본 규칙만 (체크섬 검증은 encoder.ts에서 jsbarcode.valid() 사용)
 */

import type { BarcodeInput, BarcodeValidationResult } from './types';

/**
 * 형식별 입력 검증
 *
 * - EAN13: 12자리(베이스) 또는 13자리(체크섬 포함)
 * - UPC: 11자리(베이스) 또는 12자리(체크섬 포함)
 * - CODE39: 영숫자 + 특수문자(공백, 대시, 점, $, /, +, %)
 * - CODE128: 전체 ASCII (제한 없음, 단 빈 문자열 제외)
 *
 * @param input 사용자 입력
 * @returns 검증 결과
 */
export function validateInput(input: BarcodeInput): BarcodeValidationResult {
  const { data, format } = input;

  // 빈 문자열 확인
  if (!data || !data.trim()) {
    return { valid: false, error: { code: 'lengthError' } };
  }

  switch (format) {
    case 'EAN13':
      // 12자리(베이스) 또는 13자리(체크섬 포함) 숫자만
      if (!/^\d{12,13}$/.test(data)) {
        return { valid: false, error: { code: 'lengthError' } };
      }
      break;

    case 'UPC':
      // 11자리(베이스) 또는 12자리(체크섬 포함) 숫자만
      if (!/^\d{11,12}$/.test(data)) {
        return { valid: false, error: { code: 'lengthError' } };
      }
      break;

    case 'CODE39':
      // 영숫자 + 특수문자 (공백, 대시, 점, $, /, +, %)
      // 소문자는 대문자로 정규화
      if (!/^[A-Za-z0-9 \-.*/+$%]+$/.test(data)) {
        return { valid: false, error: { code: 'invalidCharacter' } };
      }
      break;

    case 'CODE128':
      // 전체 ASCII (제한 없음)
      break;
  }

  return { valid: true };
}
