import { Variant } from './schema';

/**
 * Base64 variant helpers.
 * Pure functions for Base64 encoding/decoding with variant support.
 */

/**
 * Validates Base64 string against variant rules.
 * - standard: /^[A-Za-z0-9+/]*={0,2}$/
 * - urlSafe: /^[A-Za-z0-9\-_]*={0,2}$/
 */
export function isValidBase64(input: string, variant: Variant): boolean {
  if (variant === 'standard') {
    return /^[A-Za-z0-9+/]*={0,2}$/.test(input);
  } else {
    // urlSafe: allow -, _ and optional padding
    return /^[A-Za-z0-9\-_]*={0,2}$/.test(input);
  }
}

/**
 * Normalize Base64 input by removing whitespace and newlines.
 * This allows users to paste multiline Base64 from emails, etc.
 */
export function normalizeInput(input: string): string {
  // Remove leading/trailing whitespace
  let normalized = input.trim();
  // Remove internal newlines, tabs, spaces
  normalized = normalized.replace(/[\n\r\t ]/g, '');
  return normalized;
}

/**
 * Split an optional `data:` URL prefix from a Base64 payload.
 * Accepts `data:<mime>;base64,<data>` (and the rare `data:<mime>,<data>`).
 * When the input is not a data URL, returns it unchanged with `mime: null`.
 */
export function parseDataUrl(input: string): { mime: string | null; data: string } {
  const match = input.trim().match(/^data:([^;,]*)(?:;[^,]*)?,([\s\S]*)$/i);
  if (!match) {
    return { mime: null, data: input };
  }
  const mime = match[1] ? match[1].toLowerCase() : null;
  return { mime, data: match[2] };
}

/**
 * True when `input` can be decoded by `decodeSmart` — mirrors its acceptance
 * rules so the UI's validity gate never rejects something the decoder handles:
 *  1. Strip an optional `data:…;base64,` prefix (a `data:` URL is decodable).
 *  2. Ignore whitespace/newlines.
 *  3. Accept EITHER variant (a data URL may be standard even when the UI is
 *     set to URL-safe, and vice versa).
 * Empty (after stripping/normalizing) is not decodable.
 */
export function isDecodableInput(input: string, variant: Variant): boolean {
  const { data } = parseDataUrl(input);
  const normalized = normalizeInput(data);
  if (normalized.length === 0) {
    return false;
  }
  const otherVariant: Variant = variant === 'standard' ? 'urlSafe' : 'standard';
  return isValidBase64(normalized, variant) || isValidBase64(normalized, otherVariant);
}

/**
 * Convert standard Base64 to URL-safe variant.
 * + → -, / → _
 * Does not remove padding (caller decides).
 */
export function urlSafeEncode(standardBase64: string): string {
  return standardBase64.replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Convert URL-safe Base64 back to standard variant.
 * - → +, _ → /
 */
export function urlSafeDecode(urlSafeBase64: string): string {
  return urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * Encode raw bytes to Base64 string (standard or URL-safe).
 * Handles large arrays by chunking to avoid stack overflow.
 */
export function bytesToBase64(bytes: Uint8Array, variant: Variant): string {
  if (bytes.length === 0) {
    return '';
  }

  // Chunk size to avoid stack overflow (btoa limit is typically 65536)
  const CHUNK_SIZE = 65536;
  let result = '';

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    // Convert chunk to binary string (Latin-1)
    const binaryString = Array.from(chunk, (b) => String.fromCharCode(b)).join('');
    result += btoa(binaryString);
  }

  if (variant === 'urlSafe') {
    // Convert to URL-safe
    result = urlSafeEncode(result);
    // Remove padding for URL-safe variant
    result = result.replace(/=/g, '');
  }

  return result;
}

/**
 * Decode Base64 string to raw bytes.
 * Handles both standard and URL-safe variants.
 */
export function base64ToBytes(base64: string): Uint8Array {
  // Handle URL-safe variant by converting back to standard
  let standardBase64 = base64;
  if (base64.includes('-') || base64.includes('_')) {
    standardBase64 = urlSafeDecode(base64);
  }

  // Add padding if missing
  const padding = (4 - (standardBase64.length % 4)) % 4;
  standardBase64 += '='.repeat(padding);

  // Decode to binary string
  const binaryString = atob(standardBase64);

  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
