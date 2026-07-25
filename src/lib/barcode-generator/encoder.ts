/**
 * Barcode Generator — Encoder
 * jsbarcode 래핑 + 정규화 (segment array → flat bars string)
 */

import type { BarcodeInput, BarcodeOptions, EncodedBarcode } from './types';
import { normalizeBarcodeSVG } from './svg-export';

/**
 * jsbarcode 클래스 타입 (TypeScript에서 동적 import의 타입 힌트용)
 * jsbarcode는 타입 선언이 없으므로 any 사용
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BarcodeClass = any;

/**
 * jsbarcode 세그먼트 (EAN13/UPC)
 */
interface BarcodeSegment {
  data: string; // 이진 bar/space 패턴
  text?: string; // 사람이 읽을 수 있는 텍스트 (일부 세그먼트에만 있음)
  [key: string]: unknown;
}

/**
 * jsbarcode encoder 인스턴스 인터페이스
 */
interface BarcodeEncoderInstance {
  data: string; // 실제 인코딩된 데이터 (체크섬 포함)
  text: string; // 실제 인코딩된 텍스트 (체크섬 포함)
  encode(): unknown; // 세그먼트 배열 또는 단일 객체
  valid(): boolean;
}

/**
 * 정규화된 인코딩 결과 (내부용)
 */
interface NormalizedEncoding {
  bars: string; // 정규화된 단일 이진 패턴
  text: string; // 정규화된 텍스트 (체크섬 포함)
  encodedValue: string; // 실제 인코딩된 값 (체크섬 포함)
}

/**
 * jsbarcode 클래스를 동적으로 로드
 * bin/ 경로만 사용 (CJS, 안전한 번들링)
 *
 * @param format 바코드 형식
 * @returns 로드된 클래스
 * @throws 형식이 유효하지 않은 경우
 */
export async function loadBarcodeEncoder(
  format: 'EAN13' | 'UPC' | 'CODE39' | 'CODE128'
): Promise<BarcodeClass> {
  // jsbarcode ships no .d.ts for its bin/ subpaths. With `allowJs`, a real .js file
  // that resolves at that specifier is compiled in place of any ambient `declare
  // module` augmentation for the same path, so module augmentation can't suppress
  // this — `@ts-expect-error` on the import expression is the standard escape hatch.
  switch (format) {
    case 'EAN13': {
      // @ts-expect-error jsbarcode has no type declarations for its bin/ subpaths
      const module = (await import('jsbarcode/bin/barcodes/EAN_UPC/EAN13.js')) as { default: BarcodeClass };
      return module.default;
    }
    case 'UPC': {
      // @ts-expect-error jsbarcode has no type declarations for its bin/ subpaths
      const module = (await import('jsbarcode/bin/barcodes/EAN_UPC/UPC.js')) as { default: BarcodeClass };
      return module.default;
    }
    case 'CODE39': {
      // @ts-expect-error jsbarcode has no type declarations for its bin/ subpaths
      const module = (await import('jsbarcode/bin/barcodes/CODE39/index.js')) as { CODE39: BarcodeClass };
      return module.CODE39;
    }
    case 'CODE128': {
      // @ts-expect-error jsbarcode has no type declarations for its bin/ subpaths
      const module = (await import('jsbarcode/bin/barcodes/CODE128/index.js')) as { CODE128: BarcodeClass };
      return module.CODE128;
    }
  }
}

/**
 * jsbarcode encode() 결과를 정규화
 * EAN/UPC는 세그먼트 배열, CODE39/CODE128은 단일 객체를 통일
 * encoder 인스턴스의 .data/.text를 사용해 체크섬 포함 값 확보
 *
 * @param encoded jsbarcode encode() 결과
 * @param encoder jsbarcode encoder 인스턴스 (체크섬 포함 data/text용)
 * @returns 정규화된 인코딩 결과
 */
function normalizeEncoding(
  encoded: unknown,
  encoder: BarcodeEncoderInstance
): NormalizedEncoding {
  if (Array.isArray(encoded)) {
    // EAN13/UPC: 세그먼트 배열 → flat bars
    const segments = encoded as BarcodeSegment[];
    const bars = segments.map((seg) => seg.data).join('');
    return {
      bars,
      text: encoder.text, // encoder 인스턴스에서 체크섬 포함 텍스트 가져오기
      encodedValue: encoder.data, // encoder 인스턴스에서 체크섬 포함 데이터 가져오기
    };
  } else if (typeof encoded === 'object' && encoded !== null) {
    // CODE39/CODE128: 단일 객체
    const obj = encoded as BarcodeSegment;
    return {
      bars: obj.data || '',
      text: encoder.text, // encoder 인스턴스에서 텍스트 가져오기
      encodedValue: encoder.data, // encoder 인스턴스에서 데이터 가져오기
    };
  }

  throw new Error('Invalid encoding result');
}

/**
 * 순수 인코딩 함수 (클래스 주입식)
 * 테스트에서도 진짜 jsbarcode 클래스를 주입해 통합 테스트 가능
 *
 * @param input 사용자 입력
 * @param options 렌더링 옵션
 * @param BarcodeEncoderClass 로드된 jsbarcode 클래스
 * @returns 인코딩된 바코드
 * @throws 인코딩 실패 시
 */
export function encodeBarcode(
  input: BarcodeInput,
  options: BarcodeOptions,
  BarcodeEncoderClass: BarcodeClass
): EncodedBarcode {
  const { data, format } = input;
  const { textVisible } = options;

  try {
    // jsbarcode 인스턴스 생성 및 인코드
    const encoder = new BarcodeEncoderClass(data, {}) as BarcodeEncoderInstance;
    const encoded = encoder.encode();

    // 정규화 (encoder 인스턴스 전달로 체크섬 포함 data/text 확보)
    const normalized = normalizeEncoding(encoded, encoder);

    // SVG 생성 (bars로부터 hand-roll)
    const svgString = normalizeBarcodeSVG(
      normalized.bars,
      options.width,
      textVisible ? normalized.text : ''
    );

    return {
      bars: normalized.bars,
      svgString,
      textContent: textVisible ? normalized.text : '',
      encodedValue: normalized.encodedValue,
      format,
    };
  } catch (error) {
    // 원시 라이브러리 메시지를 노출하지 말고, 타입드 에러로 변환
    const message =
      error instanceof Error ? error.message : 'Unknown encoding error';

    // 체크섬 검증 실패 감지
    if (message.includes('checksum') || message.includes('invalid')) {
      throw new Error('checksumError');
    }

    // 그 외 인코딩 실패
    throw new Error('encodingFailed');
  }
}

/**
 * 체크섬 검증 (jsbarcode .valid() 메서드 사용)
 * @param input 사용자 입력
 * @param BarcodeEncoderClass 로드된 jsbarcode 클래스
 * @returns 검증 결과 (true면 유효, false면 체크섬 오류)
 */
export function validateChecksum(
  input: BarcodeInput,
  BarcodeEncoderClass: BarcodeClass
): boolean {
  try {
    const encoder = new BarcodeEncoderClass(input.data, {});
    return encoder.valid();
  } catch {
    return false;
  }
}
