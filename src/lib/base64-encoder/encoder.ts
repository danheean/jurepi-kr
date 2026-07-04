import { EncodeResult, DecodeResult, Base64EncoderError, Variant } from './schema';
import { isValidBase64, normalizeInput, bytesToBase64, base64ToBytes } from './base64';
import { guessMimeType } from './mime';

/**
 * Safely encode plaintext to Base64 with UTF-8 safety.
 * Returns discriminated union: success or error (never throws).
 */
export function safeEncode(plaintext: string, variant: Variant): EncodeResult {
  try {
    // Use TextEncoder to convert string to UTF-8 bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(plaintext);

    // Convert bytes to Base64
    const base64 = bytesToBase64(bytes, variant);

    // Generate data-URI
    const dataUri = `data:text/plain;base64,${base64}`;

    return {
      ok: true,
      base64,
      dataUri,
      sizeBytes: bytes.length,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'invalidBase64',
        message: 'Failed to encode text',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Safely decode Base64 to plaintext with UTF-8 validation.
 * Returns discriminated union: success or error (never throws).
 */
export function safeDecode(base64: string, variant: Variant): DecodeResult {
  try {
    // Normalize input (strip whitespace)
    const normalized = normalizeInput(base64);

    // Validate Base64 format
    if (!isValidBase64(normalized, variant)) {
      return {
        ok: false,
        error: {
          code: 'invalidBase64',
          message: `Invalid Base64 format for ${variant} variant`,
          details: `Expected ${variant === 'standard' ? 'A-Za-z0-9+/=' : 'A-Za-z0-9-_'} characters only`,
        },
      };
    }

    // Decode Base64 to bytes
    const bytes = base64ToBytes(normalized);

    // Use TextDecoder with strict UTF-8 validation
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let plaintext: string;

    try {
      plaintext = decoder.decode(bytes);
    } catch (decodingError) {
      return {
        ok: false,
        error: {
          code: 'notUtf8',
          message: 'Invalid UTF-8 sequence in decoded data',
          details: 'The decoded bytes do not form valid UTF-8 text',
        },
      };
    }

    return {
      ok: true,
      plaintext,
      sizeBytes: bytes.length,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'invalidBase64',
        message: 'Failed to decode Base64',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Encode a File to Base64.
 * Async due to file reading.
 */
export async function encodeFile(
  file: File,
  variant: Variant,
): Promise<EncodeResult> {
  try {
    // Check file size (5MB limit)
    const FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;
    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      return {
        ok: false,
        error: {
          code: 'fileTooLarge',
          message: `File exceeds 5MB limit`,
          details: `File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
      };
    }

    // Read file as ArrayBuffer using either arrayBuffer() or FileReader fallback
    let arrayBuffer: ArrayBuffer;
    if (typeof file.arrayBuffer === 'function') {
      arrayBuffer = await file.arrayBuffer();
    } else {
      // Fallback for environments without arrayBuffer() support
      arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    }

    const bytes = new Uint8Array(arrayBuffer);

    // Convert to Base64
    const base64 = bytesToBase64(bytes, variant);

    // Infer MIME type from file extension
    const mimeType = guessMimeType(file.name);

    // Generate data-URI
    const dataUri = `data:${mimeType};base64,${base64}`;

    return {
      ok: true,
      base64,
      dataUri,
      sizeBytes: bytes.length,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'fileReadError',
        message: 'Failed to read or encode file',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Decode Base64 to Blob for download.
 * Returns discriminated union: success or error.
 */
export function decodeToBlob(
  base64: string,
  mimeType?: string,
): { ok: true; blob: Blob } | { ok: false; error: Base64EncoderError } {
  try {
    // Normalize and validate
    const normalized = normalizeInput(base64);

    if (!isValidBase64(normalized, 'standard') && !isValidBase64(normalized, 'urlSafe')) {
      return {
        ok: false,
        error: {
          code: 'invalidBase64',
          message: 'Invalid Base64 format',
          details: 'Check for invalid characters',
        },
      };
    }

    // Decode to bytes
    const bytes = base64ToBytes(normalized);

    // Use provided MIME type or default
    const type = mimeType || 'text/plain';

    // Create Blob from bytes (use buffer to ensure ArrayBuffer type)
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type });

    return {
      ok: true,
      blob,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'invalidBase64',
        message: 'Failed to decode Base64',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
