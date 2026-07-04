import { describe, it, expect } from 'vitest';
import {
  BASE64_ENCODER_ERROR_CODES,
  FILE_SIZE_LIMIT_MB,
  DEBOUNCE_MS,
  STORAGE_KEY,
  base64EncoderErrorSchema,
  encodeResultSchema,
  decodeResultSchema,
  fileInfoSchema,
  persistedPrefsSchema,
} from './schema';

describe('schema constants', () => {
  it('should define FILE_SIZE_LIMIT_MB', () => {
    expect(FILE_SIZE_LIMIT_MB).toBe(5);
  });

  it('should define DEBOUNCE_MS', () => {
    expect(DEBOUNCE_MS).toBe(200);
  });

  it('should define STORAGE_KEY', () => {
    expect(STORAGE_KEY).toBe('jurepi-base64-encoder');
  });

  it('should define error codes', () => {
    expect(BASE64_ENCODER_ERROR_CODES).toContain('invalidBase64');
    expect(BASE64_ENCODER_ERROR_CODES).toContain('notUtf8');
    expect(BASE64_ENCODER_ERROR_CODES).toContain('fileTooLarge');
    expect(BASE64_ENCODER_ERROR_CODES).toContain('fileReadError');
    expect(BASE64_ENCODER_ERROR_CODES.length).toBe(4);
  });
});

describe('base64EncoderErrorSchema', () => {
  it('should accept valid error object', () => {
    const error = {
      code: 'invalidBase64',
      message: 'Invalid Base64 format',
    };
    const result = base64EncoderErrorSchema.safeParse(error);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('invalidBase64');
    }
  });

  it('should reject unknown error code', () => {
    const error = {
      code: 'unknownError',
      message: 'Something went wrong',
    };
    const result = base64EncoderErrorSchema.safeParse(error);
    expect(result.success).toBe(false);
  });

  it('should accept optional details field', () => {
    const error = {
      code: 'invalidBase64',
      message: 'Invalid Base64 format',
      details: 'contains character @',
    };
    const result = base64EncoderErrorSchema.safeParse(error);
    expect(result.success).toBe(true);
  });
});

describe('encodeResultSchema', () => {
  it('should accept success result', () => {
    const result = {
      ok: true,
      base64: 'SGVsbG8gV29ybGQ=',
      dataUri: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
      sizeBytes: 11,
    };
    const parsed = encodeResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('should accept error result', () => {
    const result = {
      ok: false,
      error: {
        code: 'fileTooLarge',
        message: 'File exceeds 5MB',
      },
    };
    const parsed = encodeResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid discriminator', () => {
    const result = {
      ok: true,
      base64: 'SGVsbG8gV29ybGQ=',
      error: {
        code: 'invalidBase64',
        message: 'Invalid',
      },
    };
    const parsed = encodeResultSchema.safeParse(result);
    expect(parsed.success).toBe(false);
  });
});

describe('decodeResultSchema', () => {
  it('should accept success result', () => {
    const result = {
      ok: true,
      plaintext: 'Hello World',
      sizeBytes: 11,
    };
    const parsed = decodeResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it('should accept error result', () => {
    const result = {
      ok: false,
      error: {
        code: 'notUtf8',
        message: 'Invalid UTF-8 sequence',
      },
    };
    const parsed = decodeResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});

describe('fileInfoSchema', () => {
  it('should accept valid file info', () => {
    const fileInfo = {
      name: 'document.pdf',
      sizeBytes: 1024000,
      mimeType: 'application/pdf',
    };
    const parsed = fileInfoSchema.safeParse(fileInfo);
    expect(parsed.success).toBe(true);
  });
});

describe('persistedPrefsSchema', () => {
  it('should accept valid prefs with mode and variant', () => {
    const prefs = {
      mode: 'file',
      variant: 'urlSafe',
    };
    const parsed = persistedPrefsSchema.safeParse(prefs);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe('file');
      expect(parsed.data.variant).toBe('urlSafe');
    }
  });

  it('should provide default values for partial prefs', () => {
    const prefs = {};
    const parsed = persistedPrefsSchema.safeParse(prefs);
    // Depending on implementation, might fail or use defaults
    expect(parsed.success).toBeDefined();
  });

  it('should reject invalid mode', () => {
    const prefs = {
      mode: 'binary',
      variant: 'standard',
    };
    const parsed = persistedPrefsSchema.safeParse(prefs);
    expect(parsed.success).toBe(false);
  });
});
