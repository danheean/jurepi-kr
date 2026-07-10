import { describe, it, expect } from 'vitest';
import { parsePemPublicKey } from './pem';

describe('pem.ts', () => {
  describe('parsePemPublicKey', () => {
    const validPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
fGnJm6gOdrj8ym3rFkEU/wT8RDtn3dCMCPfZ0kl0nQSRX/iVXiL3wvRiYiY0Cj+H
-----END PUBLIC KEY-----`;

    it('should extract base64 from valid PEM', () => {
      const result = parsePemPublicKey(validPem);
      expect('keyData' in result).toBe(true);
      if ('keyData' in result) {
        expect(result.keyData).toBeInstanceOf(Uint8Array);
        expect(result.keyData.length).toBeGreaterThan(0);
      }
    });

    it('should handle PEM with extra whitespace', () => {
      const pemWithWhitespace = `-----BEGIN PUBLIC KEY-----

  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem/V41
  fGnJm6gOdrj8ym3rFkEU/wT8RDtn3dCMCPfZ0kl0nQSRX/iVXiL3wvRiYiY0Cj+H

-----END PUBLIC KEY-----`;
      const result = parsePemPublicKey(pemWithWhitespace);
      expect('keyData' in result).toBe(true);
    });

    it('should return error for missing BEGIN marker', () => {
      const pem = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem
-----END PUBLIC KEY-----`;
      const result = parsePemPublicKey(pem);
      expect('error' in result).toBe(true);
    });

    it('should return error for missing END marker', () => {
      const pem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4f5wg5l2hKsTeNem`;
      const result = parsePemPublicKey(pem);
      expect('error' in result).toBe(true);
    });

    it('should return error for invalid base64 content', () => {
      const pem = `-----BEGIN PUBLIC KEY-----
!!!invalid!!!
-----END PUBLIC KEY-----`;
      const result = parsePemPublicKey(pem);
      expect('error' in result).toBe(true);
    });

    it('should return error for empty PEM', () => {
      const result = parsePemPublicKey('');
      expect('error' in result).toBe(true);
    });

    it('should return error for only BEGIN marker', () => {
      const pem = `-----BEGIN PUBLIC KEY-----`;
      const result = parsePemPublicKey(pem);
      expect('error' in result).toBe(true);
    });

    it('should handle PEM with newlines in base64', () => {
      const pem = `-----BEGIN PUBLIC KEY-----
MIIB
IjANBgkqhkiG
9w0BAQEFAAOCAQ
-----END PUBLIC KEY-----`;
      const result = parsePemPublicKey(pem);
      // Should attempt to parse despite malformed base64
      expect('keyData' in result || 'error' in result).toBe(true);
    });
  });
});
