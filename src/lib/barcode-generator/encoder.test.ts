/**
 * Barcode Generator — Encoder Tests
 * RED→GREEN: 진짜 jsbarcode 클래스로 통합 테스트
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { encodeBarcode, loadBarcodeEncoder, validateChecksum } from './encoder';
import type { BarcodeInput, BarcodeOptions } from './types';

describe('encoder', () => {
  let EAN13Class: any;
  let UPCClass: any;
  let CODE39Class: any;
  let CODE128Class: any;

  beforeAll(async () => {
    // 진짜 jsbarcode 클래스 로드
    EAN13Class = await loadBarcodeEncoder('EAN13');
    UPCClass = await loadBarcodeEncoder('UPC');
    CODE39Class = await loadBarcodeEncoder('CODE39');
    CODE128Class = await loadBarcodeEncoder('CODE128');
  });

  describe('encodeBarcode', () => {
    describe('EAN13', () => {
      it('should encode 12-digit EAN13 (auto checksum)', () => {
        const input: BarcodeInput = {
          data: '978014300723',
          format: 'EAN13',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, EAN13Class);

        expect(result.bars).toBeTruthy();
        expect(result.bars.length).toBeGreaterThan(0);
        expect(/^[01]+$/.test(result.bars)).toBe(true); // 이진 패턴
        expect(result.textContent).toBe('9780143007234'); // 체크섬 포함
        expect(result.encodedValue).toBe('9780143007234');
        expect(result.format).toBe('EAN13');
        expect(result.svgString).toContain('<svg');
      });

      it('should encode 13-digit EAN13 (full with checksum)', () => {
        const input: BarcodeInput = {
          data: '9780143007234',
          format: 'EAN13',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, EAN13Class);

        expect(result.bars).toBeTruthy();
        expect(result.textContent).toBe('9780143007234');
      });

      it('should hide text when textVisible is false', () => {
        const input: BarcodeInput = {
          data: '978014300723',
          format: 'EAN13',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: false,
        };

        const result = encodeBarcode(input, options, EAN13Class);

        expect(result.bars).toBeTruthy();
        expect(result.textContent).toBe('');
      });

      it('should scale width properly', () => {
        const input: BarcodeInput = {
          data: '978014300723',
          format: 'EAN13',
        };

        const svg100 = encodeBarcode(input, { width: 100, textVisible: true }, EAN13Class).svgString;
        const svg200 = encodeBarcode(input, { width: 200, textVisible: true }, EAN13Class).svgString;
        const svg300 = encodeBarcode(input, { width: 300, textVisible: true }, EAN13Class).svgString;

        expect(svg100).toContain('width="100"');
        expect(svg200).toContain('width="200"');
        expect(svg300).toContain('width="300"');
      });
    });

    describe('UPC', () => {
      it('should encode 11-digit UPC (auto checksum)', () => {
        const input: BarcodeInput = {
          data: '12345678901',
          format: 'UPC',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, UPCClass);

        expect(result.bars).toBeTruthy();
        expect(/^[01]+$/.test(result.bars)).toBe(true);
        expect(result.textContent.length).toBe(12); // 체크섬 포함
        expect(result.format).toBe('UPC');
      });

      it('should encode 12-digit UPC (full with checksum)', () => {
        const input: BarcodeInput = {
          data: '123456789012',
          format: 'UPC',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, UPCClass);

        expect(result.bars).toBeTruthy();
        expect(result.textContent.length).toBe(12);
      });
    });

    describe('CODE39', () => {
      it('should encode alphanumeric string', () => {
        const input: BarcodeInput = {
          data: 'HELLO-WORLD',
          format: 'CODE39',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, CODE39Class);

        expect(result.bars).toBeTruthy();
        expect(/^[01]+$/.test(result.bars)).toBe(true);
        expect(result.textContent).toBeTruthy();
        expect(result.format).toBe('CODE39');
      });

      it('should accept special characters for CODE39', () => {
        const input: BarcodeInput = {
          data: 'ABC 123-./+$%',
          format: 'CODE39',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, CODE39Class);

        expect(result.bars).toBeTruthy();
      });
    });

    describe('CODE128', () => {
      it('should encode full ASCII text', () => {
        const input: BarcodeInput = {
          data: 'Hello, World! 123',
          format: 'CODE128',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, CODE128Class);

        expect(result.bars).toBeTruthy();
        expect(/^[01]+$/.test(result.bars)).toBe(true);
        expect(result.textContent).toBe('Hello, World! 123');
        expect(result.format).toBe('CODE128');
      });

      it('should encode punctuation', () => {
        const input: BarcodeInput = {
          data: 'Test@123!',
          format: 'CODE128',
        };
        const options: BarcodeOptions = {
          width: 200,
          textVisible: true,
        };

        const result = encodeBarcode(input, options, CODE128Class);

        expect(result.bars).toBeTruthy();
      });
    });
  });

  describe('validateChecksum', () => {
    it('should validate correct EAN13 checksum', () => {
      const input: BarcodeInput = {
        data: '9780143007234',
        format: 'EAN13',
      };

      const isValid = validateChecksum(input, EAN13Class);

      expect(isValid).toBe(true);
    });

    it('should reject invalid EAN13 checksum', () => {
      const input: BarcodeInput = {
        data: '9780143007233', // 마지막 자리가 틀림
        format: 'EAN13',
      };

      const isValid = validateChecksum(input, EAN13Class);

      expect(isValid).toBe(false);
    });

    it('should validate UPC checksum', () => {
      const input: BarcodeInput = {
        data: '123456789012',
        format: 'UPC',
      };

      const isValid = validateChecksum(input, UPCClass);

      expect(isValid).toBe(true);
    });
  });

  describe('loadBarcodeEncoder', () => {
    it('should load all barcode classes', async () => {
      const ean13 = await loadBarcodeEncoder('EAN13');
      const upc = await loadBarcodeEncoder('UPC');
      const code39 = await loadBarcodeEncoder('CODE39');
      const code128 = await loadBarcodeEncoder('CODE128');

      expect(typeof ean13).toBe('function');
      expect(typeof upc).toBe('function');
      expect(typeof code39).toBe('function');
      expect(typeof code128).toBe('function');
    });
  });
});
