import { describe, it, expect } from 'vitest';
import { JwtErrorCode, JwtParseError, buildErrorMessage } from './errors';

describe('errors.ts', () => {
  describe('JwtErrorCode type', () => {
    it('should have valid error codes', () => {
      const codes: JwtErrorCode[] = [
        'malformed_structure',
        'invalid_base64',
        'invalid_json',
        'unsupported_alg',
        'verification_failed',
        'invalid_pem',
        'secret_error',
      ];
      expect(codes).toHaveLength(7);
    });
  });

  describe('buildErrorMessage', () => {
    it('should format header error', () => {
      const error: JwtParseError = {
        part: 'header',
        code: 'invalid_base64',
        reason: 'unexpected character !',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('Invalid JWT');
      expect(msg).toContain('header');
      expect(msg).toContain('unexpected character');
    });

    it('should format payload error', () => {
      const error: JwtParseError = {
        part: 'payload',
        code: 'invalid_json',
        reason: 'Unexpected token }',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('Invalid JWT');
      expect(msg).toContain('payload');
      expect(msg).toContain('Unexpected token');
    });

    it('should format signature error', () => {
      const error: JwtParseError = {
        part: 'signature',
        code: 'invalid_base64',
        reason: 'invalid base64url',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('Invalid JWT');
      expect(msg).toContain('signature');
    });

    it('should format token-level error', () => {
      const error: JwtParseError = {
        part: 'token',
        code: 'malformed_structure',
        reason: 'Expected three base64url-encoded parts separated by "."',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('Expected three');
      expect(msg).not.toContain('Part:');
    });

    it('should handle verification_failed code', () => {
      const error: JwtParseError = {
        part: 'signature',
        code: 'verification_failed',
        reason: 'Signature does not match',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('Signature does not match');
    });

    it('should handle unsupported_alg code', () => {
      const error: JwtParseError = {
        part: 'header',
        code: 'unsupported_alg',
        reason: 'Algorithm RS512 is not supported',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('RS512');
    });

    it('should handle invalid_pem code', () => {
      const error: JwtParseError = {
        part: 'signature',
        code: 'invalid_pem',
        reason: 'PEM markers not found',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('PEM markers');
    });

    it('should handle secret_error code', () => {
      const error: JwtParseError = {
        part: 'signature',
        code: 'secret_error',
        reason: 'Secret processing failed',
      };
      const msg = buildErrorMessage(error);
      expect(msg).toContain('Secret processing');
    });
  });
});
