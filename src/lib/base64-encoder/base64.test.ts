import { describe, it, expect } from 'vitest';
import {
  isValidBase64,
  normalizeInput,
  isDecodableInput,
  urlSafeEncode,
  urlSafeDecode,
  bytesToBase64,
  base64ToBytes,
} from './base64';

describe('isValidBase64', () => {
  describe('standard variant', () => {
    it('should accept valid standard Base64', () => {
      expect(isValidBase64('SGVsbG8gV29ybGQ=', 'standard')).toBe(true);
      expect(isValidBase64('ABC123+/ABC123+/==', 'standard')).toBe(true);
      expect(isValidBase64('ABC123+/ABC', 'standard')).toBe(true);
    });

    it('should reject invalid characters for standard', () => {
      expect(isValidBase64('ABC!@#', 'standard')).toBe(false);
      expect(isValidBase64('ABC-_==', 'standard')).toBe(false); // URL-safe chars
    });

    it('should allow 0-2 padding characters', () => {
      expect(isValidBase64('ABC=', 'standard')).toBe(true);
      expect(isValidBase64('ABC==', 'standard')).toBe(true);
      expect(isValidBase64('ABC===', 'standard')).toBe(false); // 3 padding not allowed
    });

    it('should accept empty string', () => {
      expect(isValidBase64('', 'standard')).toBe(true);
    });
  });

  describe('urlSafe variant', () => {
    it('should accept valid URL-safe Base64', () => {
      expect(isValidBase64('SGVsbG8gV29ybGQ', 'urlSafe')).toBe(true);
      expect(isValidBase64('ABC123-_ABC123-_', 'urlSafe')).toBe(true);
    });

    it('should reject standard chars (+/) for URL-safe', () => {
      expect(isValidBase64('ABC+/==', 'urlSafe')).toBe(false);
    });

    it('should NOT require padding in URL-safe', () => {
      expect(isValidBase64('SGVsbG8gV29ybGQ', 'urlSafe')).toBe(true);
      expect(isValidBase64('SGVsbG8gV29ybGQ=', 'urlSafe')).toBe(true);
    });
  });
});

describe('normalizeInput', () => {
  it('should strip leading and trailing whitespace', () => {
    expect(normalizeInput('  SGVsbG8gV29ybGQ=  ')).toBe('SGVsbG8gV29ybGQ=');
  });

  it('should remove newlines', () => {
    expect(normalizeInput('SGVs\nbG8g\nV29y\nbGQ=')).toBe('SGVsbG8gV29ybGQ=');
  });

  it('should remove tabs', () => {
    expect(normalizeInput('SGVs\tbG8g\tV29ybGQ=')).toBe('SGVsbG8gV29ybGQ=');
  });

  it('should handle multiline input (pasted from email)', () => {
    const multiline = 'SGVsbG8g\nV29y\nbGQ=';
    expect(normalizeInput(multiline)).toBe('SGVsbG8gV29ybGQ=');
  });

  it('should preserve spaces within the base64 for error detection', () => {
    // Spaces within (not leading/trailing) might be part of actual content
    // but Base64 itself shouldn't have internal spaces
    expect(normalizeInput('SGVs bG8g').trim()).not.toContain(' ');
  });
});

describe('isDecodableInput', () => {
  // 1x1 PNG, both as raw standard Base64 and as a data URL.
  const PNG_RAW =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const PNG_DATA_URL = `data:image/png;base64,${PNG_RAW}`;

  it('accepts raw Base64 in the selected variant', () => {
    expect(isDecodableInput('aGVsbG8gd29ybGQ=', 'standard')).toBe(true);
  });

  it('accepts a data: URL prefix (what "Copy Data-URI" produces)', () => {
    // Regression: the gate previously rejected data URLs, so image round-trips
    // (encode → Copy Data-URI → decode) silently produced no output.
    expect(isDecodableInput(PNG_DATA_URL, 'standard')).toBe(true);
    expect(isDecodableInput(PNG_DATA_URL, 'urlSafe')).toBe(true);
  });

  it('accepts the other variant when the selected one does not match', () => {
    // URL-safe payload (has - / _) while the UI is set to standard.
    expect(isDecodableInput('SGVsbG8gV29ybGQ', 'urlSafe')).toBe(true);
    expect(isDecodableInput('a-b_c', 'standard')).toBe(true);
    // Standard payload (has + /) while the UI is set to url-safe.
    expect(isDecodableInput('a+b/c', 'urlSafe')).toBe(true);
  });

  it('ignores surrounding whitespace and newlines', () => {
    expect(isDecodableInput('  aGVs\nbG8=  ', 'standard')).toBe(true);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(isDecodableInput('', 'standard')).toBe(false);
    expect(isDecodableInput('   \n\t ', 'standard')).toBe(false);
    // A data URL with no payload is not decodable.
    expect(isDecodableInput('data:image/png;base64,', 'standard')).toBe(false);
  });

  it('rejects invalid Base64 characters', () => {
    expect(isDecodableInput('ABC!@#', 'standard')).toBe(false);
    expect(isDecodableInput('한글텍스트', 'standard')).toBe(false);
  });
});

describe('urlSafeEncode', () => {
  it('should replace + with -', () => {
    const input = 'ABC+DEF+GHI';
    const output = urlSafeEncode(input);
    expect(output).not.toContain('+');
    expect(output).toContain('-');
  });

  it('should replace / with _', () => {
    const input = 'ABC/DEF/GHI';
    const output = urlSafeEncode(input);
    expect(output).not.toContain('/');
    expect(output).toContain('_');
  });

  it('should handle standard Base64 with both + and /', () => {
    const input = 'AB+/CD+/';
    const output = urlSafeEncode(input);
    expect(output).toBe('AB-_CD-_');
  });

  it('should pass through characters without + or /', () => {
    const input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=';
    const output = urlSafeEncode(input);
    expect(output).toBe(input);
  });
});

describe('urlSafeDecode', () => {
  it('should replace - with +', () => {
    const input = 'ABC-DEF-GHI';
    const output = urlSafeDecode(input);
    expect(output).toContain('+');
    expect(output).not.toContain('-');
  });

  it('should replace _ with /', () => {
    const input = 'ABC_DEF_GHI';
    const output = urlSafeDecode(input);
    expect(output).toContain('/');
    expect(output).not.toContain('_');
  });

  it('should reverse urlSafeEncode transformation', () => {
    const original = 'AB+/CD+/';
    const encoded = urlSafeEncode(original);
    const decoded = urlSafeDecode(encoded);
    expect(decoded).toBe(original);
  });
});

describe('bytesToBase64', () => {
  it('should encode bytes to standard Base64', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const result = bytesToBase64(bytes, 'standard');
    expect(result).toBe('SGVsbG8=');
  });

  it('should encode bytes to URL-safe Base64', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const result = bytesToBase64(bytes, 'urlSafe');
    expect(result).toBe('SGVsbG8'); // no padding in URL-safe
  });

  it('should handle empty bytes', () => {
    const bytes = new Uint8Array([]);
    const result = bytesToBase64(bytes, 'standard');
    expect(result).toBe('');
  });

  it('should handle large byte arrays without stack overflow', () => {
    const bytes = new Uint8Array(10000).fill(65); // 10KB of 'A' (65)
    expect(() => {
      bytesToBase64(bytes, 'standard');
    }).not.toThrow();
  });

  it('should match TextEncoder output for ASCII', () => {
    const text = 'Hello, World!';
    const bytes = new TextEncoder().encode(text);
    const base64 = bytesToBase64(bytes, 'standard');
    // Verify it's valid Base64 that can be decoded
    expect(isValidBase64(base64, 'standard')).toBe(true);
  });
});

describe('base64ToBytes', () => {
  it('should decode standard Base64 to bytes', () => {
    const base64 = 'SGVsbG8gV29ybGQ=';
    const bytes = base64ToBytes(base64);
    expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]));
  });

  it('should handle Base64 without padding', () => {
    const base64 = 'SGVsbG8'; // no padding
    expect(() => {
      base64ToBytes(base64);
    }).not.toThrow();
  });

  it('should handle URL-safe variant', () => {
    // First encode to URL-safe
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const urlSafe = bytesToBase64(bytes, 'urlSafe');
    // Then decode: decode function should handle both
    const decoded = base64ToBytes(urlSafe);
    expect(decoded).toEqual(bytes);
  });

  it('should round-trip with bytesToBase64', () => {
    const original = new Uint8Array([1, 2, 3, 255, 254, 253]);
    const encoded = bytesToBase64(original, 'standard');
    const decoded = base64ToBytes(encoded);
    expect(decoded).toEqual(original);
  });
});
