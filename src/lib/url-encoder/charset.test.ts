import { describe, it, expect } from 'vitest';
import {
  parsePercentBytes,
  bytesToText,
  textToBytes,
  UnencodableCharError,
} from './charset';
import { UTF8_ROUND_TRIP_VECTORS, EUCKR_ROUND_TRIP_VECTORS, EUCKR_UNREPRESENTABLE } from './unicode';

describe('charset.ts', () => {
  describe('parsePercentBytes', () => {
    it('parses percent-encoded bytes', () => {
      const result = parsePercentBytes('%20%21%22');
      expect(Array.from(result)).toEqual([0x20, 0x21, 0x22]);
    });

    it('parses plain ASCII as byte values', () => {
      const result = parsePercentBytes('hello');
      expect(Array.from(result)).toEqual([0x68, 0x65, 0x6C, 0x6C, 0x6F]);
    });

    it('parses mixed percent and ASCII', () => {
      const result = parsePercentBytes('hello%20world');
      const expected = [
        0x68, 0x65, 0x6C, 0x6C, 0x6F, // 'hello'
        0x20, // ' '
        0x77, 0x6F, 0x72, 0x6C, 0x64, // 'world'
      ];
      expect(Array.from(result)).toEqual(expected);
    });

    it('throws on incomplete hex (missing second digit)', () => {
      expect(() => parsePercentBytes('hello%2')).toThrow();
    });

    it('throws on incomplete hex (no digits)', () => {
      expect(() => parsePercentBytes('hello%')).toThrow();
    });

    it('throws on invalid hex characters', () => {
      expect(() => parsePercentBytes('%ZZ')).toThrow();
    });

    it('handles uppercase and lowercase hex', () => {
      const upper = parsePercentBytes('%2F%3A');
      const lower = parsePercentBytes('%2f%3a');
      expect(Array.from(upper)).toEqual(Array.from(lower));
    });
  });

  describe('bytesToText', () => {
    it('decodes UTF-8 bytes', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // 'Hello'
      expect(bytesToText(bytes, 'utf-8')).toBe('Hello');
    });

    it('decodes UTF-8 multi-byte sequences', () => {
      const bytes = new Uint8Array([0xC3, 0xA9]); // 'é'
      expect(bytesToText(bytes, 'utf-8')).toBe('é');
    });

    it('decodes UTF-8 emoji', () => {
      const bytes = new Uint8Array([0xF0, 0x9F, 0x98, 0x8A]); // '😊'
      expect(bytesToText(bytes, 'utf-8')).toBe('😊');
    });

    it('decodes EUC-KR bytes (한글)', () => {
      const bytes = new Uint8Array([0xC7, 0xD1]); // '한'
      expect(bytesToText(bytes, 'euc-kr')).toBe('한');
    });

    it('decodes EUC-KR multi-char sequence', () => {
      const bytes = new Uint8Array([0xC7, 0xD1, 0xB1, 0xDB]); // '한글'
      expect(bytesToText(bytes, 'euc-kr')).toBe('한글');
    });

    it('decodes ASCII identically in both charsets', () => {
      const bytes = new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F]); // 'hello'
      const utf8 = bytesToText(bytes, 'utf-8');
      const euckr = bytesToText(bytes, 'euc-kr');
      expect(utf8).toBe(euckr);
      expect(utf8).toBe('hello');
    });
  });

  describe('textToBytes', () => {
    it('encodes UTF-8 text synchronously (resolved promise)', async () => {
      const bytes = await textToBytes('hello', 'utf-8');
      expect(Array.from(bytes)).toEqual([0x68, 0x65, 0x6C, 0x6C, 0x6F]);
    });

    it('encodes UTF-8 multi-byte char', async () => {
      const bytes = await textToBytes('café', 'utf-8');
      // 'café' = 'caf' (0x63, 0x61, 0x66) + 'é' (0xC3, 0xA9)
      expect(Array.from(bytes)).toEqual([0x63, 0x61, 0x66, 0xC3, 0xA9]);
    });

    it('encodes UTF-8 emoji', async () => {
      const bytes = await textToBytes('😊', 'utf-8');
      expect(Array.from(bytes)).toEqual([0xF0, 0x9F, 0x98, 0x8A]);
    });

    it('encodes EUC-KR text', async () => {
      const bytes = await textToBytes('한글', 'euc-kr');
      expect(Array.from(bytes)).toEqual([0xC7, 0xD1, 0xB1, 0xDB]);
    });

    it('encodes ASCII identically in both charsets', async () => {
      const utf8Bytes = await textToBytes('hello', 'utf-8');
      const euckrBytes = await textToBytes('hello', 'euc-kr');
      expect(Array.from(utf8Bytes)).toEqual(Array.from(euckrBytes));
    });

    it('throws UnencodableCharError for emoji in EUC-KR', async () => {
      await expect(textToBytes('😊', 'euc-kr')).rejects.toThrow(UnencodableCharError);
    });

    it('throws UnencodableCharError with correct details', async () => {
      try {
        await textToBytes('😊', 'euc-kr');
        throw new Error('Expected UnencodableCharError');
      } catch (e) {
        expect(e).toBeInstanceOf(UnencodableCharError);
        const err = e as UnencodableCharError;
        expect(err.char).toBe('😊');
        expect(err.charset).toBe('euc-kr');
      }
    });

    it('throws on unsupported charset', async () => {
      await expect(
        textToBytes('hello', 'unsupported' as 'utf-8' | 'euc-kr'),
      ).rejects.toThrow('Unsupported charset');
    });
  });

  describe('UnencodableCharError', () => {
    it('creates error with correct properties', () => {
      const err = new UnencodableCharError('😊', 0x1F60A, 'euc-kr');
      expect(err.char).toBe('😊');
      expect(err.charCode).toBe(0x1F60A);
      expect(err.charset).toBe('euc-kr');
      expect(err.name).toBe('UnencodableCharError');
    });

    it('creates readable error message', () => {
      const err = new UnencodableCharError('😊', 0x1F60A, 'euc-kr');
      expect(err.message).toContain('😊');
      expect(err.message).toContain('1F60A');
      expect(err.message).toContain('EUC-KR/CP949');
    });

    it('handles UTF-8 in error message', () => {
      const err = new UnencodableCharError('🚀', 0x1F680, 'utf-8');
      expect(err.message).toContain('UTF-8');
    });
  });

  describe('round-trip tests', () => {
    describe('UTF-8', () => {
      for (const vector of UTF8_ROUND_TRIP_VECTORS) {
        it(`round-trips: ${vector.description || vector.text}`, async () => {
          // Encode text to bytes
          const bytes = await textToBytes(vector.text, 'utf-8');

          // Decode bytes back to text
          const decoded = bytesToText(bytes, 'utf-8');
          expect(decoded).toBe(vector.text);
        });
      }
    });

    describe('EUC-KR', () => {
      for (const vector of EUCKR_ROUND_TRIP_VECTORS) {
        it(`round-trips: ${vector.description || vector.text}`, async () => {
          // Encode text to bytes
          const bytes = await textToBytes(vector.text, 'euc-kr');

          // Decode bytes back to text
          const decoded = bytesToText(bytes, 'euc-kr');
          expect(decoded).toBe(vector.text);
        });
      }
    });
  });

  describe('unrepresentable character tests', () => {
    for (const test of EUCKR_UNREPRESENTABLE) {
      it(`throws on ${test.description}`, async () => {
        await expect(textToBytes(test.text, 'euc-kr')).rejects.toThrow(UnencodableCharError);
      });
    }
  });
});
