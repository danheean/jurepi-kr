/**
 * Barcode Generator — Validation Tests
 * RED→GREEN: 형식별 입력 검증
 */

import { describe, it, expect } from 'vitest';
import { validateInput } from './validation';

describe('validateInput', () => {
  describe('EAN13', () => {
    it('should accept 12 digits (base)', () => {
      const result = validateInput({
        data: '978014300723',
        format: 'EAN13',
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept 13 digits (with checksum)', () => {
      const result = validateInput({
        data: '9780143007234',
        format: 'EAN13',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject 11 digits', () => {
      const result = validateInput({
        data: '97801430072',
        format: 'EAN13',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });

    it('should reject 14 digits', () => {
      const result = validateInput({
        data: '97801430072345',
        format: 'EAN13',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });

    it('should reject non-digits', () => {
      const result = validateInput({
        data: '97801430072A',
        format: 'EAN13',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });
  });

  describe('UPC', () => {
    it('should accept 11 digits (base)', () => {
      const result = validateInput({
        data: '12345678901',
        format: 'UPC',
      });
      expect(result.valid).toBe(true);
    });

    it('should accept 12 digits (with checksum)', () => {
      const result = validateInput({
        data: '123456789012',
        format: 'UPC',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject 10 digits', () => {
      const result = validateInput({
        data: '1234567890',
        format: 'UPC',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });

    it('should reject 13 digits', () => {
      const result = validateInput({
        data: '1234567890123',
        format: 'UPC',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });

    it('should reject non-digits', () => {
      const result = validateInput({
        data: '1234567890A',
        format: 'UPC',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });
  });

  describe('CODE39', () => {
    it('should accept alphanumeric + special chars', () => {
      const result = validateInput({
        data: 'HELLO-WORLD',
        format: 'CODE39',
      });
      expect(result.valid).toBe(true);
    });

    it('should accept all allowed special chars', () => {
      const result = validateInput({
        data: 'ABC 123-./+$%',
        format: 'CODE39',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed chars', () => {
      const result = validateInput({
        data: 'HELLO@WORLD',
        format: 'CODE39',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('invalidCharacter');
    });

    it('should accept lowercase (will be normalized)', () => {
      const result = validateInput({
        data: 'hello-world',
        format: 'CODE39',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('CODE128', () => {
    it('should accept ASCII text', () => {
      const result = validateInput({
        data: 'Hello, World! 123',
        format: 'CODE128',
      });
      expect(result.valid).toBe(true);
    });

    it('should accept punctuation', () => {
      const result = validateInput({
        data: 'Test@123!',
        format: 'CODE128',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject empty string', () => {
      const result = validateInput({
        data: '',
        format: 'CODE128',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });

    it('should reject whitespace-only string', () => {
      const result = validateInput({
        data: '   ',
        format: 'CODE128',
      });
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('lengthError');
    });
  });

  describe('Edge cases', () => {
    it('should reject empty data for all formats', () => {
      const formats: Array<'EAN13' | 'UPC' | 'CODE39' | 'CODE128'> = [
        'EAN13',
        'UPC',
        'CODE39',
        'CODE128',
      ];
      formats.forEach((format) => {
        const result = validateInput({ data: '', format });
        expect(result.valid).toBe(false);
        expect(result.error?.code).toBe('lengthError');
      });
    });
  });
});
