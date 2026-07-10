import { describe, it, expect } from 'vitest';
import { extractClaims, renderClaimValue } from './claims';

describe('claims.ts', () => {
  describe('extractClaims', () => {
    it('should extract standard claims', () => {
      const payload = {
        iss: 'https://example.com',
        sub: 'user123',
        aud: 'app.example.com',
        exp: 1720376400,
        iat: 1720372800,
        nbf: 1720372800,
        jti: 'jwt-id-123',
        typ: 'JWT',
        kid: 'key-1',
      };

      const result = extractClaims(payload);
      expect(result.standard.iss).toBe('https://example.com');
      expect(result.standard.sub).toBe('user123');
      expect(result.standard.aud).toBe('app.example.com');
      expect(result.standard.exp).toBe(1720376400);
      expect(result.standard.iat).toBe(1720372800);
      expect(result.standard.nbf).toBe(1720372800);
      expect(result.standard.jti).toBe('jwt-id-123');
      expect(result.standard.typ).toBe('JWT');
      expect(result.standard.kid).toBe('key-1');
    });

    it('should extract custom claims', () => {
      const payload = {
        sub: 'user123',
        custom: 'value',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = extractClaims(payload);
      expect(result.standard.sub).toBe('user123');
      expect(result.custom.custom).toBe('value');
      expect(result.custom.name).toBe('John Doe');
      expect(result.custom.email).toBe('john@example.com');
    });

    it('should handle partial standard claims', () => {
      const payload = {
        sub: 'user123',
        exp: 1720376400,
        custom: 'value',
      };

      const result = extractClaims(payload);
      expect(result.standard.sub).toBe('user123');
      expect(result.standard.exp).toBe(1720376400);
      expect(result.standard.iss).toBeUndefined();
      expect(result.custom.custom).toBe('value');
    });

    it('should handle empty payload', () => {
      const result = extractClaims({});
      expect(Object.keys(result.standard).length).toBe(0);
      expect(Object.keys(result.custom).length).toBe(0);
    });

    it('should separate standard from custom claims correctly', () => {
      const payload = {
        iss: 'issuer',
        sub: 'subject',
        custom1: 'val1',
        custom2: 'val2',
        exp: 123456,
        myField: 'myValue',
      };

      const result = extractClaims(payload);
      expect(Object.keys(result.standard)).toEqual(
        expect.arrayContaining(['iss', 'sub', 'exp'])
      );
      expect(Object.keys(result.custom)).toEqual(
        expect.arrayContaining(['custom1', 'custom2', 'myField'])
      );
    });
  });

  describe('renderClaimValue', () => {
    it('should render timestamp fields as unix seconds', () => {
      const result = renderClaimValue('exp', 1720376400);
      expect(result).toBe('1720376400');
    });

    it('should render iat as unix seconds', () => {
      const result = renderClaimValue('iat', 1720372800);
      expect(result).toBe('1720372800');
    });

    it('should render nbf as unix seconds', () => {
      const result = renderClaimValue('nbf', 1720372800);
      expect(result).toBe('1720372800');
    });

    it('should render strings as-is', () => {
      const result = renderClaimValue('sub', 'user123');
      expect(result).toBe('"user123"');
    });

    it('should render objects as JSON', () => {
      const result = renderClaimValue('custom', { name: 'John', age: 30 });
      expect(result).toContain('name');
      expect(result).toContain('John');
    });

    it('should render arrays as JSON', () => {
      const result = renderClaimValue('aud', ['app1', 'app2']);
      expect(result).toContain('app1');
      expect(result).toContain('app2');
    });

    it('should render null values', () => {
      const result = renderClaimValue('custom', null);
      expect(result).toBe('null');
    });

    it('should render boolean values', () => {
      const result = renderClaimValue('active', true);
      expect(result).toBe('true');
    });
  });
});
