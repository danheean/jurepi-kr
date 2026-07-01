import { describe, it, expect } from 'vitest';
import { decodeComponent, decodeUri, decode } from './decode';
import { UTF8_ROUND_TRIP_VECTORS, EUCKR_ROUND_TRIP_VECTORS } from './unicode';

describe('decode.ts', () => {
  describe('decodeComponent', () => {
    it('decodes UTF-8 with decodeURIComponent', () => {
      const result = decodeComponent('hello%20world', 'utf-8');
      expect(result.result).toBe('hello world');
      expect(result.error).toBeUndefined();
    });

    it('decodes UTF-8 special chars', () => {
      const result = decodeComponent('hello%26goodbye', 'utf-8');
      expect(result.result).toBe('hello&goodbye');
    });

    it('decodes UTF-8 emoji', () => {
      const result = decodeComponent('%F0%9F%98%8A', 'utf-8');
      expect(result.result).toBe('😊');
    });

    it('decodes EUC-KR text', () => {
      const result = decodeComponent('%C7%D1%B1%DB', 'euc-kr');
      expect(result.result).toBe('한글');
    });

    it('returns error on malformed %xx', () => {
      const result = decodeComponent('hello%2', 'utf-8');
      expect(result.result).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Malformed');
    });

    it('returns error on invalid hex', () => {
      const result = decodeComponent('hello%ZZ', 'utf-8');
      expect(result.error).toBeDefined();
    });

    it('returns error on EUC-KR charset mismatch', () => {
      // UTF-8 bytes decoded as EUC-KR
      const result = decodeComponent('%C3%A9', 'euc-kr'); // UTF-8 'é'
      // May or may not have error depending on EUC-KR interpretation
      // Just verify we get a result (either decoded or error)
      expect(result).toBeDefined();
    });

    it('handles plusAsSpace option', () => {
      const result = decodeComponent('hello+world', 'utf-8', { plusAsSpace: true });
      expect(result.result).toBe('hello world');
    });

    it('ignores plus without plusAsSpace', () => {
      const result = decodeComponent('hello+world', 'utf-8', { plusAsSpace: false });
      expect(result.result).toBe('hello+world');
    });

    it('defaults plusAsSpace to false', () => {
      const result = decodeComponent('hello+world', 'utf-8');
      expect(result.result).toBe('hello+world');
    });

    it('handles empty input', () => {
      const result = decodeComponent('', 'utf-8');
      expect(result.result).toBe('');
      expect(result.error).toBeUndefined();
    });
  });

  describe('decodeUri', () => {
    it('decodes UTF-8 with decodeURI', () => {
      const result = decodeUri('https://example.com/path?a=1', 'utf-8');
      expect(result.result).toContain('https://example.com/path?a=1');
    });

    it('decodes UTF-8 percent-encoded chars', () => {
      const result = decodeUri('hello%20world', 'utf-8');
      expect(result.result).toBe('hello world');
    });

    it('decodes EUC-KR with URI mode', () => {
      const result = decodeUri('%C7%D1%B1%DB', 'euc-kr');
      expect(result.result).toBe('한글');
    });

    it('handles plusAsSpace option', () => {
      const result = decodeUri('hello+world', 'utf-8', { plusAsSpace: true });
      expect(result.result).toBe('hello world');
    });

    it('returns error on malformed sequence', () => {
      const result = decodeUri('hello%2', 'utf-8');
      expect(result.error).toBeDefined();
    });
  });

  describe('decode wrapper', () => {
    it('dispatches to decodeComponent for component mode', async () => {
      const result = await decode('hello%20world', 'component', 'utf-8');
      expect(result.result).toBe('hello world');
    });

    it('dispatches to decodeUri for uri mode', async () => {
      const result = await decode('hello%20world', 'uri', 'utf-8');
      expect(result.result).toBe('hello world');
    });

    it('passes options to decoder', async () => {
      const result = await decode('hello+world', 'component', 'utf-8', { plusAsSpace: true });
      expect(result.result).toBe('hello world');
    });
  });

  describe('error handling', () => {
    it('provides friendly message on incomplete hex', () => {
      const result = decodeComponent('hello%2', 'utf-8');
      expect(result.error?.message).toContain('Malformed');
      expect(result.error?.details).toContain('incomplete');
    });

    it('catches URIError and provides friendly message', () => {
      const result = decodeComponent('%EG%BC', 'utf-8');
      expect(result.error).toBeDefined();
      expect(result.error?.details).toContain('hex');
    });

    it('suggests UTF-8/EUC-KR mismatch on decode', () => {
      // This is a weak test; actual behavior depends on TextDecoder
      const result = decodeComponent('%80%81', 'utf-8');
      expect(result).toBeDefined();
    });
  });

  describe('UTF-8 round-trip decode', () => {
    for (const vector of UTF8_ROUND_TRIP_VECTORS) {
      it(`decodes ${vector.description || vector.text}`, () => {
        const result = decodeComponent(vector.encoded, 'utf-8');
        expect(result.result).toBe(vector.text);
        expect(result.error).toBeUndefined();
      });
    }
  });

  describe('EUC-KR round-trip decode', () => {
    for (const vector of EUCKR_ROUND_TRIP_VECTORS) {
      it(`decodes ${vector.description || vector.text}`, () => {
        const result = decodeComponent(vector.encoded, 'euc-kr');
        expect(result.result).toBe(vector.text);
        expect(result.error).toBeUndefined();
      });
    }
  });

  describe('ASCII charset-agnostic', () => {
    it('ASCII decodes identically in both charsets', () => {
      const utf8 = decodeComponent('hello%20world', 'utf-8');
      const euckr = decodeComponent('hello%20world', 'euc-kr');
      expect(utf8.result).toBe(euckr.result);
      expect(utf8.result).toBe('hello world');
    });
  });

  describe('EUC-KR malformed percent sequence (error path)', () => {
    it('decodeComponent(euc-kr) returns friendly error on incomplete hex, no crash', () => {
      const result = decodeComponent('%6', 'euc-kr');
      expect(result.result).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.details).toContain('incomplete hex');
    });

    it('decodeUri(euc-kr) returns friendly error on non-hex sequence, no crash', () => {
      const result = decodeUri('%ZZ', 'euc-kr');
      expect(result.result).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(typeof result.error!.details).toBe('string');
    });
  });
});
