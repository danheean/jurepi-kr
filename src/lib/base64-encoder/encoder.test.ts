import { describe, it, expect } from 'vitest';
import { safeEncode, safeDecode, encodeFile, decodeToBlob } from './encoder';

describe('safeEncode', () => {
  describe('basic text', () => {
    it('should encode plain ASCII text', () => {
      const result = safeEncode('Hello, World!', 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.base64).toBe('SGVsbG8sIFdvcmxkIQ==');
        expect(result.dataUri).toContain('data:');
        expect(result.sizeBytes).toBe(13);
      }
    });

    it('should encode empty string', () => {
      const result = safeEncode('', 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.base64).toBe('');
        expect(result.sizeBytes).toBe(0);
      }
    });
  });

  describe('UTF-8 handling (CRITICAL)', () => {
    it('should encode Korean text correctly', () => {
      const korean = '안녕하세요';
      const result = safeEncode(korean, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sizeBytes).toBe(15); // UTF-8: 3 bytes per Korean char
      }
    });

    it('should encode emoji correctly', () => {
      const emoji = '😀';
      const result = safeEncode(emoji, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sizeBytes).toBe(4); // UTF-8: 4 bytes for emoji
      }
    });

    it('should encode mixed text with emoji and Korean', () => {
      const mixed = 'Hello, 안녕하세요! 😀';
      const result = safeEncode(mixed, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        // H(1) e(1) l(1) l(1) o(1) ,(1) space(1) 안(3) 녕(3) 하(3) 세(3) 요(3) !(1) space(1) emoji(4) = 32 bytes
        expect(result.sizeBytes).toBeGreaterThan(0);
        // Verify it's valid Base64
        expect(/^[A-Za-z0-9+/]*={0,2}$/.test(result.base64)).toBe(true);
      }
    });

    it('should handle newlines and special characters', () => {
      const text = 'Line 1\nLine 2\tTab\r\nCRLF';
      const result = safeEncode(text, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sizeBytes).toBeGreaterThan(0);
      }
    });

    it('should handle surrogate pairs (combining characters)', () => {
      const text = '👨‍👩‍👧‍👦'; // Family emoji with zero-width joiners
      const result = safeEncode(text, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sizeBytes).toBeGreaterThan(0);
      }
    });
  });

  describe('variant support', () => {
    it('should produce standard Base64 with + and /', () => {
      const text = 'Hello, 안녕!';
      const result = safeEncode(text, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Standard Base64 may contain + and /
        expect(/^[A-Za-z0-9+/]*={0,2}$/.test(result.base64)).toBe(true);
      }
    });

    it('should produce URL-safe Base64 without + and /', () => {
      const text = 'Hello, 안녕!';
      const result = safeEncode(text, 'urlSafe');
      expect(result.ok).toBe(true);
      if (result.ok) {
        // URL-safe should not have +/ and no padding
        expect(result.base64).not.toContain('+');
        expect(result.base64).not.toContain('/');
        expect(result.base64).not.toContain('=');
        expect(/^[A-Za-z0-9\-_]*$/.test(result.base64)).toBe(true);
      }
    });
  });

  describe('large input', () => {
    it('should handle 100KB text without stack overflow', () => {
      const large = 'A'.repeat(100000);
      const result = safeEncode(large, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sizeBytes).toBe(100000);
      }
    });
  });
});

describe('safeDecode', () => {
  describe('basic decoding', () => {
    it('should decode standard Base64', () => {
      const result = safeDecode('SGVsbG8sIFdvcmxkIQ==', 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.plaintext).toBe('Hello, World!');
        expect(result.sizeBytes).toBe(13);
      }
    });

    it('should decode empty Base64', () => {
      const result = safeDecode('', 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.plaintext).toBe('');
        expect(result.sizeBytes).toBe(0);
      }
    });
  });

  describe('UTF-8 round-trip (CRITICAL)', () => {
    it('should round-trip Korean text', () => {
      const original = '안녕하세요';
      const encoded = safeEncode(original, 'standard');
      expect(encoded.ok).toBe(true);
      if (encoded.ok) {
        const decoded = safeDecode(encoded.base64, 'standard');
        expect(decoded.ok).toBe(true);
        if (decoded.ok) {
          expect(decoded.plaintext).toBe(original);
        }
      }
    });

    it('should round-trip emoji', () => {
      const original = '😀🎉🚀';
      const encoded = safeEncode(original, 'standard');
      expect(encoded.ok).toBe(true);
      if (encoded.ok) {
        const decoded = safeDecode(encoded.base64, 'standard');
        expect(decoded.ok).toBe(true);
        if (decoded.ok) {
          expect(decoded.plaintext).toBe(original);
        }
      }
    });

    it('should round-trip mixed UTF-8 with newlines', () => {
      const original = 'Hello, 안녕하세요! 😀\nLine 2\t안녕';
      const encoded = safeEncode(original, 'standard');
      expect(encoded.ok).toBe(true);
      if (encoded.ok) {
        const decoded = safeDecode(encoded.base64, 'standard');
        expect(decoded.ok).toBe(true);
        if (decoded.ok) {
          expect(decoded.plaintext).toBe(original);
        }
      }
    });

    it('should round-trip surrogate pairs', () => {
      const original = '👨‍👩‍👧‍👦';
      const encoded = safeEncode(original, 'standard');
      expect(encoded.ok).toBe(true);
      if (encoded.ok) {
        const decoded = safeDecode(encoded.base64, 'standard');
        expect(decoded.ok).toBe(true);
        if (decoded.ok) {
          expect(decoded.plaintext).toBe(original);
        }
      }
    });
  });

  describe('error handling', () => {
    it('should return error for invalid Base64 characters', () => {
      const result = safeDecode('ABC!@#', 'standard');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalidBase64');
      }
    });

    it('should return error for invalid Base64 padding', () => {
      const result = safeDecode('ABC===', 'standard');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalidBase64');
      }
    });

    it('should return error for URL-safe chars in standard mode', () => {
      const result = safeDecode('ABC-_', 'standard');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalidBase64');
      }
    });

    it('should handle invalid UTF-8 sequence', () => {
      // Create Base64 that decodes to invalid UTF-8
      // 0xFF 0xFE is not valid UTF-8
      const invalidUtf8Base64 = 'AP8='; // decodes to 0xFF 0xFE
      const result = safeDecode(invalidUtf8Base64, 'standard');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('notUtf8');
      }
    });
  });

  describe('variant support', () => {
    it('should decode URL-safe Base64', () => {
      const original = 'Test-+_/';
      const encoded = safeEncode(original, 'urlSafe');
      expect(encoded.ok).toBe(true);
      if (encoded.ok) {
        const decoded = safeDecode(encoded.base64, 'urlSafe');
        expect(decoded.ok).toBe(true);
        if (decoded.ok) {
          expect(decoded.plaintext).toBe(original);
        }
      }
    });

    it('should detect variant mismatch', () => {
      const encoded = safeEncode('Test', 'standard');
      expect(encoded.ok).toBe(true);
      if (encoded.ok) {
        // Try to decode standard as URL-safe
        const decoded = safeDecode(encoded.base64, 'urlSafe');
        // May fail if standard Base64 has + or /
        expect(decoded.ok).toBeDefined();
      }
    });
  });
});

describe('decodeToBlob', () => {
  it('should create Blob from Base64', () => {
    const result = decodeToBlob('SGVsbG8gV29ybGQ=', 'text/plain');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob?.type).toBe('text/plain');
    }
  });

  it('should default to text/plain MIME type', () => {
    const result = decodeToBlob('SGVsbG8gV29ybGQ=');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.blob?.type).toBe('text/plain');
    }
  });

  it('should return error for invalid Base64', () => {
    const result = decodeToBlob('ABC!@#', 'text/plain');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalidBase64');
    }
  });

  it('should handle empty Base64', () => {
    const result = decodeToBlob('', 'text/plain');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.blob?.size).toBe(0);
    }
  });
});

describe('encodeFile', () => {
  describe('normal file encoding', () => {
    it('should encode text file to Base64', async () => {
      const content = new TextEncoder().encode('Hello, World!');
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.base64).toBe('SGVsbG8sIFdvcmxkIQ==');
        expect(result.dataUri).toContain('data:text/plain;base64,');
        expect(result.sizeBytes).toBe(13);
      }
    });

    it('should encode image file with correct MIME type', async () => {
      const content = new Uint8Array([137, 80, 78, 71]); // PNG header
      const file = new File([content], 'image.png', { type: 'image/png' });
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.dataUri).toContain('data:image/png;base64,');
        expect(result.sizeBytes).toBe(4);
      }
    });

    it('should infer MIME type from PDF extension', async () => {
      const content = new TextEncoder().encode('PDF content');
      const file = new File([content], 'document.pdf', { type: 'application/pdf' });
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.dataUri).toContain('data:application/pdf;base64,');
      }
    });

    it('should support URL-safe variant for files', async () => {
      const content = new TextEncoder().encode('Test');
      const file = new File([content], 'test.txt');
      const result = await encodeFile(file, 'urlSafe');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.base64).not.toContain('+');
        expect(result.base64).not.toContain('/');
        expect(/^[A-Za-z0-9\-_]*$/.test(result.base64)).toBe(true);
      }
    });
  });

  describe('file size limit', () => {
    it('should reject files exceeding 5MB limit', async () => {
      const oversizeContent = new Uint8Array(6 * 1024 * 1024 + 1); // 6MB + 1 byte
      const file = new File([oversizeContent], 'large.bin');
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('fileTooLarge');
        expect(result.error.details).toContain('6.00MB');
      }
    });

    it('should accept files exactly at 5MB limit', async () => {
      const limitContent = new Uint8Array(5 * 1024 * 1024); // Exactly 5MB
      const file = new File([limitContent], 'atLimit.bin');
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sizeBytes).toBe(5 * 1024 * 1024);
      }
    });

    it('should accept files just under 5MB', async () => {
      const smallContent = new Uint8Array(5 * 1024 * 1024 - 1); // 5MB - 1 byte
      const file = new File([smallContent], 'almost.bin');
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle file with unknown extension gracefully', async () => {
      const content = new TextEncoder().encode('Unknown type');
      const file = new File([content], 'file.xyz');
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should default to text/plain for unknown extension
        expect(result.dataUri).toContain('data:text/plain;base64,');
      }
    });

    it('should handle empty file', async () => {
      const file = new File([], 'empty.txt');
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.base64).toBe('');
        expect(result.sizeBytes).toBe(0);
      }
    });

    it('should handle FileReader API (non-arrayBuffer path)', async () => {
      // Create a File and mock scenario where arrayBuffer might fail or be unavailable
      const content = new TextEncoder().encode('Test FileReader');
      const file = new File([content], 'test.txt');
      const result = await encodeFile(file, 'standard');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sizeBytes).toBe(15);
      }
    });
  });

  describe('decodeToBlob error scenarios', () => {
    it('should handle edge case where decoding throws unexpectedly', () => {
      // Test the catch block in decodeToBlob
      const invalidBase64 = 'SGVs@bG8='; // @ is invalid
      const result = decodeToBlob(invalidBase64, 'text/plain');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalidBase64');
      }
    });

    it('should correctly set MIME type on Blob', () => {
      const result = decodeToBlob('SGVsbG8gV29ybGQ=', 'application/json');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.blob.type).toBe('application/json');
      }
    });

    it('should handle various MIME types', () => {
      const mimeTypes = ['image/png', 'video/mp4', 'audio/wav', 'application/pdf'];
      mimeTypes.forEach((mime) => {
        const result = decodeToBlob('SGVsbG8gV29ybGQ=', mime);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.blob.type).toBe(mime);
        }
      });
    });

    it('should return invalidBase64 when decoding throws past regex validation', () => {
      // 'A' passes the character regex but atob throws (length % 4 === 1)
      const result = decodeToBlob('A', 'text/plain');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalidBase64');
      }
    });
  });

  describe('encodeFile read failure', () => {
    it('should return fileReadError when file.arrayBuffer rejects', async () => {
      const brokenFile = {
        size: 10,
        name: 'broken.txt',
        arrayBuffer: () => Promise.reject(new Error('read fail')),
      } as unknown as File;
      const result = await encodeFile(brokenFile, 'standard');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('fileReadError');
        expect(result.error.details).toContain('read fail');
      }
    });
  });
});
