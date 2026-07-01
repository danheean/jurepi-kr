import { describe, it, expect } from 'vitest';
import {
  encodeComponent,
  encodeUri,
  handleAlreadyEncoded,
  encode,
  percentEscapeBytes,
} from './encode';
import { UTF8_ROUND_TRIP_VECTORS, EUCKR_ROUND_TRIP_VECTORS } from './unicode';

describe('encode.ts', () => {
  describe('encodeComponent', () => {
    it('encodes UTF-8 text with encodeURIComponent', async () => {
      const result = await encodeComponent('hello world', 'utf-8');
      expect(result).toBe('hello%20world');
    });

    it('encodes UTF-8 special chars', async () => {
      const result = await encodeComponent('hello&goodbye', 'utf-8');
      expect(result).toBe('hello%26goodbye');
    });

    it('encodes UTF-8 emoji', async () => {
      const result = await encodeComponent('😊', 'utf-8');
      expect(result).toBe('%F0%9F%98%8A');
    });

    it('encodes EUC-KR text', async () => {
      const result = await encodeComponent('한글', 'euc-kr');
      expect(result).toBe('%C7%D1%B1%DB');
    });

    it('throws on EUC-KR unencodable character', async () => {
      await expect(encodeComponent('😊', 'euc-kr')).rejects.toThrow();
    });

    it('handles already-encoded check independently', async () => {
      const result = await encodeComponent('hello%20world', 'utf-8');
      // Input '%20' gets double-encoded
      expect(result).toContain('%2520');
    });
  });

  describe('encodeUri', () => {
    it('encodes UTF-8 with encodeURI (preserves reserved chars)', async () => {
      const result = await encodeUri('https://example.com/path?a=1', 'utf-8');
      // /, :, ?, = should remain unencoded
      expect(result).toContain('https://example.com/path?a=1');
    });

    it('encodes UTF-8 unreserved special chars', async () => {
      const result = await encodeUri('hello world & test', 'utf-8');
      // encodeURI keeps & unencoded, but encodes space
      expect(result).toContain('%20');
      expect(result).toContain('&');
    });

    it('encodes EUC-KR with URI mode', async () => {
      const result = await encodeUri('한글', 'euc-kr');
      expect(result).toBe('%C7%D1%B1%DB');
    });
  });

  describe('handleAlreadyEncoded', () => {
    it('returns true for valid %xx patterns', () => {
      expect(handleAlreadyEncoded('hello%20world')).toBe(true);
    });

    it('returns true for multiple %xx', () => {
      expect(handleAlreadyEncoded('%20%21%22')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(handleAlreadyEncoded('hello world')).toBe(false);
    });

    it('returns false for invalid %xx (odd hex)', () => {
      expect(handleAlreadyEncoded('hello%2')).toBe(false);
    });

    it('returns false for single %', () => {
      expect(handleAlreadyEncoded('hello%')).toBe(false);
    });

    it('is case-insensitive for hex', () => {
      expect(handleAlreadyEncoded('%2F')).toBe(true);
      expect(handleAlreadyEncoded('%2f')).toBe(true);
    });
  });

  describe('encode wrapper', () => {
    it('returns result on successful encode', async () => {
      const result = await encode('hello world', 'component', 'utf-8');
      expect(result.result).toBe('hello%20world');
      expect(result.error).toBeNull();
    });

    it('sets alreadyEncodedHint when input looks encoded', async () => {
      const result = await encode('hello%20world', 'component', 'utf-8');
      expect(result.alreadyEncodedHint).toBe(true);
    });

    it('returns error on EUC-KR unencodable char', async () => {
      const result = await encode('😊', 'component', 'euc-kr');
      expect(result.result).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('cannot be encoded');
    });

    it('dispatches to encodeComponent for component mode', async () => {
      const result = await encode('hello&goodbye', 'component', 'utf-8');
      expect(result.result).toBe('hello%26goodbye');
    });

    it('dispatches to encodeUri for uri mode', async () => {
      const result = await encode('https://example.com', 'uri', 'utf-8');
      expect(result.result).toContain('https://example.com');
    });
  });

  describe('percentEscapeBytes', () => {
    it('escapes all bytes to percent encoding in component mode', () => {
      const bytes = new Uint8Array([0x20, 0x26, 0x2F]);
      const result = percentEscapeBytes(bytes, 'component');
      expect(result).toBe('%20%26%2F');
    });

    it('keeps unreserved chars unencoded in component mode', () => {
      const bytes = new Uint8Array([0x41, 0x2D, 0x2E]); // 'A', '-', '.'
      const result = percentEscapeBytes(bytes, 'component');
      expect(result).toBe('A-.');
    });

    it('keeps reserved chars unencoded in URI mode', () => {
      const bytes = new Uint8Array([0x2F, 0x3A, 0x3F, 0x23]); // '/', ':', '?', '#'
      const result = percentEscapeBytes(bytes, 'uri');
      // In URI mode, reserved chars stay unencoded
      expect(result).toBe('/:?#');
    });

    it('encodes non-reserved chars and keeps reserved chars in URI mode', () => {
      const bytes = new Uint8Array([0x20, 0x26]); // ' ' (unreserved), '&' (reserved)
      const result = percentEscapeBytes(bytes, 'uri');
      // Space is encoded, & (reserved) is kept unencoded in URI mode
      expect(result).toBe('%20&');
    });

    it('uppercase hex codes', () => {
      const bytes = new Uint8Array([0x2F, 0xAB, 0xCD]); // '/', non-ASCII
      const result = percentEscapeBytes(bytes, 'component');
      expect(result).toContain('%2F');
      expect(result).toContain('%AB');
      expect(result).toContain('%CD');
    });
  });

  describe('UTF-8 round-trip encode/decode', () => {
    for (const vector of UTF8_ROUND_TRIP_VECTORS) {
      it(`encodes ${vector.description || vector.text}`, async () => {
        const encoded = await encodeComponent(vector.text, 'utf-8');
        expect(encoded).toBe(vector.encoded);
      });
    }
  });

  describe('EUC-KR round-trip encode', () => {
    for (const vector of EUCKR_ROUND_TRIP_VECTORS) {
      it(`encodes ${vector.description || vector.text}`, async () => {
        const encoded = await encodeComponent(vector.text, 'euc-kr');
        expect(encoded).toBe(vector.encoded);
      });
    }
  });

  describe('ASCII is charset-agnostic', () => {
    it('produces identical output for ASCII in both charsets', async () => {
      const text = 'hello world';
      const utf8 = await encodeComponent(text, 'utf-8');
      const euckr = await encodeComponent(text, 'euc-kr');
      // Both should encode spaces the same way
      expect(utf8).toBe(euckr);
      expect(utf8).toBe('hello%20world');
    });
  });
});
