import { describe, it, expect } from 'vitest';
import { uiPrefsSchema, parseUiPrefs, serializeUiPrefs } from './schema';

describe('schema.ts', () => {
  describe('uiPrefsSchema', () => {
    it('should validate valid UI preferences', () => {
      const valid = { tab: 'claims' as const, verificationMode: 'off' as const };
      const result = uiPrefsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should have defaults', () => {
      const result = uiPrefsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tab).toBe('claims');
        expect(result.data.verificationMode).toBe('off');
      }
    });

    it('should accept raw tab value', () => {
      const result = uiPrefsSchema.safeParse({ tab: 'raw' });
      expect(result.success).toBe(true);
    });

    it('should accept hmac and rsa verification modes', () => {
      const hmacResult = uiPrefsSchema.safeParse({ verificationMode: 'hmac' });
      const rsaResult = uiPrefsSchema.safeParse({ verificationMode: 'rsa' });
      expect(hmacResult.success).toBe(true);
      expect(rsaResult.success).toBe(true);
    });

    it('should fail on invalid enum value', () => {
      const result = uiPrefsSchema.safeParse({ tab: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('parseUiPrefs', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify({ tab: 'raw', verificationMode: 'hmac' });
      const result = parseUiPrefs(json);
      expect(result.tab).toBe('raw');
      expect(result.verificationMode).toBe('hmac');
    });

    it('should return defaults on invalid JSON', () => {
      const result = parseUiPrefs('not valid json');
      expect(result.tab).toBe('claims');
      expect(result.verificationMode).toBe('off');
    });

    it('should return defaults on invalid schema', () => {
      const result = parseUiPrefs(JSON.stringify({ tab: 'bad' }));
      expect(result.tab).toBe('claims');
    });
  });

  describe('serializeUiPrefs', () => {
    it('should serialize to JSON string', () => {
      const prefs = { tab: 'raw' as const, verificationMode: 'rsa' as const };
      const json = serializeUiPrefs(prefs);
      const parsed = JSON.parse(json);
      expect(parsed.tab).toBe('raw');
      expect(parsed.verificationMode).toBe('rsa');
    });
  });
});
