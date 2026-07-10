import {
  EncodeResult,
  DecodeResult,
  DecodeSmartResult,
  Base64EncoderError,
  Variant,
} from './schema';
import {
  isValidBase64,
  normalizeInput,
  bytesToBase64,
  base64ToBytes,
  parseDataUrl,
} from './base64';
import { guessMimeType, isTextualMime } from './mime';
import { sniffImageMime } from './sniff';

/**
 * Strictly decode UTF-8 bytes to a string.
 * @returns the decoded string, or `null` when the bytes are not valid UTF-8.
 */
function decodeUtf8Strict(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

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

    // Strict UTF-8 validation
    const plaintext = decodeUtf8Strict(bytes);
    if (plaintext === null) {
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
 * Smart-decode a Base64 (or `data:` URL) string.
 *
 * Order of resolution:
 *  1. Strip a `data:` URL prefix if present (keeping its declared MIME as a hint).
 *  2. Validate + decode to bytes (accepts standard or URL-safe input).
 *  3. If the bytes are a known image (by magic bytes, or an image data-URL hint),
 *     return an `image` payload with a ready-to-render standard data URI.
 *  4. Otherwise decode as strict UTF-8 text.
 *  5. Non-image, non-UTF-8 bytes yield a `notUtf8` error (unchanged behaviour).
 *
 * Never throws — returns a discriminated union.
 */
export function decodeSmart(input: string, variant: Variant): DecodeSmartResult {
  try {
    const { mime: declaredMime, data } = parseDataUrl(input);
    const normalized = normalizeInput(data);

    if (normalized.length === 0) {
      return {
        ok: false,
        error: {
          code: 'invalidBase64',
          message: 'Empty Base64 input',
          details: 'No Base64 data was provided',
        },
      };
    }

    // Accept whichever variant the payload actually uses (a data URL may be
    // standard even when the UI is set to URL-safe).
    const otherVariant: Variant = variant === 'standard' ? 'urlSafe' : 'standard';
    if (!isValidBase64(normalized, variant) && !isValidBase64(normalized, otherVariant)) {
      return {
        ok: false,
        error: {
          code: 'invalidBase64',
          message: 'Invalid Base64 format',
          details: 'Check for invalid characters',
        },
      };
    }

    const bytes = base64ToBytes(normalized);

    const sniffed = sniffImageMime(bytes);
    const imageMime =
      sniffed ?? (declaredMime && declaredMime.startsWith('image/') ? declaredMime : null);

    if (imageMime) {
      // Re-encode as standard Base64 so the data URI is always browser-valid.
      const standardBase64 = bytesToBase64(bytes, 'standard');
      return {
        ok: true,
        kind: 'image',
        mimeType: imageMime,
        base64: standardBase64,
        dataUri: `data:${imageMime};base64,${standardBase64}`,
        sizeBytes: bytes.length,
      };
    }

    // A declared non-textual MIME (e.g. `data:application/pdf;base64,…`) tells
    // us the payload is a binary file — offer it for download instead of trying
    // to render binary bytes as text.
    if (declaredMime && !isTextualMime(declaredMime)) {
      return {
        ok: true,
        kind: 'file',
        mimeType: declaredMime,
        base64: bytesToBase64(bytes, 'standard'),
        sizeBytes: bytes.length,
      };
    }

    const plaintext = decodeUtf8Strict(bytes);
    if (plaintext !== null) {
      return { ok: true, kind: 'text', plaintext, sizeBytes: bytes.length };
    }

    // Not an image and not valid UTF-8 text: it is some binary payload. Offer it
    // as a generic downloadable file rather than erroring — anything that isn't
    // an image or text becomes a file. (A declared binary MIME was already
    // handled above; here we only have an unknown/text-declared payload.)
    return {
      ok: true,
      kind: 'file',
      mimeType: 'application/octet-stream',
      base64: bytesToBase64(bytes, 'standard'),
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
