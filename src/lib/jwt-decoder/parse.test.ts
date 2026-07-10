import { describe, it, expect } from 'vitest';
import { splitJwt, decodeBase64Url, parseJwt } from './parse';

describe('parse.ts', () => {
  const validJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  describe('splitJwt', () => {
    it('should split valid JWT into 3 parts', () => {
      const result = splitJwt(validJwt);
      expect('parts' in result).toBe(true);
      if ('parts' in result) {
        expect(result.parts).toHaveLength(3);
      }
    });

    it('should return error for not-3-parts', () => {
      const result = splitJwt('two.parts');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.code).toBe('malformed_structure');
      }
    });

    it('should return error for empty parts', () => {
      const result = splitJwt('...');
      expect('error' in result).toBe(true);
    });

    it('should return error for 4 parts', () => {
      const result = splitJwt('one.two.three.four');
      expect('error' in result).toBe(true);
    });
  });

  describe('decodeBase64Url', () => {
    it('should decode valid base64url', () => {
      const result = decodeBase64Url('aGVsbG8gd29ybGQ');
      expect('text' in result).toBe(true);
      if ('text' in result) {
        expect(result.text).toBe('hello world');
      }
    });

    it('should handle URL-safe characters (- and _)', () => {
      // "hello-world_test" encoded in base64url
      const result = decodeBase64Url('aGVsbG8td29ybGRfdGVzdA');
      expect('text' in result).toBe(true);
      if ('text' in result) {
        expect(result.text).toContain('hello');
      }
    });

    it('should decode the header part of sample JWT', () => {
      const headerB64u = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = decodeBase64Url(headerB64u);
      expect('text' in result).toBe(true);
      if ('text' in result) {
        expect(result.text).toContain('HS256');
      }
    });

    it('should return error for invalid base64url characters', () => {
      const result = decodeBase64Url('invalid!!!');
      expect('error' in result).toBe(true);
    });

    it('should handle UTF-8 encoded text (한글)', () => {
      // "한글" in UTF-8 base64url — "한글" = UTF-8 bytes
      const result = decodeBase64Url(
        Buffer.from('한글', 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      );
      expect('text' in result).toBe(true);
      if ('text' in result) {
        expect(result.text).toBe('한글');
      }
    });

    it('should handle emoji', () => {
      // "😀" in UTF-8 base64url
      const result = decodeBase64Url(
        Buffer.from('😀', 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      );
      expect('text' in result).toBe(true);
      if ('text' in result) {
        expect(result.text).toContain('😀');
      }
    });
  });

  describe('parseJwt', () => {
    it('should parse valid JWT', () => {
      const result = parseJwt(validJwt);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.header.alg).toBe('HS256');
        expect(result.header.typ).toBe('JWT');
        expect(result.payload.sub).toBe('1234567890');
        expect(result.payload.name).toBe('John Doe');
        expect(result.signature).toBe(
          'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        );
      }
    });

    it('should return error for malformed JWT (not 3 parts)', () => {
      const result = parseJwt('not.valid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('malformed_structure');
      }
    });

    it('should return error for invalid base64url in header', () => {
      const result = parseJwt('invalid!!!.eyJhdWQiOiJ0ZXN0In0.sig');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.part).toBe('header');
        expect(result.error.code).toBe('invalid_base64');
      }
    });

    it('should return error for invalid JSON in payload', () => {
      // base64url-encoded "{not valid json}"
      const result = parseJwt(
        'eyJhbGciOiJIUzI1NiJ9.e25vdCB2YWxpZCBqc29ufQ.sig'
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.part).toBe('payload');
        expect(result.error.code).toBe('invalid_json');
      }
    });

    it('should handle empty payload', () => {
      const result = parseJwt(
        'eyJhbGciOiJIUzI1NiJ9.e30.sig'
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload).toEqual({});
      }
    });

    it('should preserve custom claims', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiJ9.eyJjdXN0b20iOiAidmFsdWUiLCAibmFtZSI6ICJKb2huIn0.sig';
      const result = parseJwt(jwt);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.payload.custom).toBe('value');
        expect(result.payload.name).toBe('John');
      }
    });

    it('should handle exp/iat/nbf as numbers', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MjAzNzY0MDAsImlhdCI6MTcyMDM3MjgwMH0.sig';
      const result = parseJwt(jwt);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.payload.exp).toBe('number');
        expect(typeof result.payload.iat).toBe('number');
      }
    });
  });
});
