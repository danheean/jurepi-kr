import { textToBytes, UnencodableCharError } from './charset';
import type { EncodeResult } from './schema';

/**
 * UTF-8 + Component Mode: encodeURIComponent(text).
 * Returns percent-encoded string; never throws.
 */
export function encodeComponent(text: string, charset: 'utf-8' | 'euc-kr'): Promise<string> {
  if (charset === 'utf-8') {
    return Promise.resolve(encodeURIComponent(text));
  }

  // EUC-KR: lazy-load CP949, convert bytes, then percent-escape
  return textToBytes(text, 'euc-kr').then((bytes) => percentEscapeBytes(bytes, 'component'));
}

/**
 * UTF-8 + Full URI Mode: encodeURI(text).
 * Returns percent-encoded string (but with /, :, ?, #, & unencoded); never throws.
 */
export function encodeUri(text: string, charset: 'utf-8' | 'euc-kr'): Promise<string> {
  if (charset === 'utf-8') {
    return Promise.resolve(encodeURI(text));
  }

  // EUC-KR: lazy-load CP949, convert bytes, then percent-escape (different reserved set)
  return textToBytes(text, 'euc-kr').then((bytes) => percentEscapeBytes(bytes, 'uri'));
}

/**
 * Heuristic: check if input contains %XX pattern (regex: /%[0-9A-Fa-f]{2}/).
 * Non-blocking warning to avoid double-encoding.
 */
export function handleAlreadyEncoded(text: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(text);
}

/**
 * Encode text in the given direction (encode) and mode.
 * Wraps encodeComponent/encodeUri and catches UnencodableCharError.
 * Returns EncodeResult with result or error.
 */
export async function encode(
  text: string,
  mode: 'component' | 'uri',
  charset: 'utf-8' | 'euc-kr',
): Promise<EncodeResult> {
  try {
    const encodeFn = mode === 'component' ? encodeComponent : encodeUri;
    const result = await encodeFn(text, charset);

    return {
      result,
      alreadyEncodedHint: handleAlreadyEncoded(text),
      error: null,
    };
  } catch (e) {
    if (e instanceof UnencodableCharError) {
      return {
        alreadyEncodedHint: false,
        error: {
          message: `Character '${e.char}' cannot be encoded in ${charset}`,
          details: `${e.message}. Switch to UTF-8 or remove this character.`,
        },
      };
    }

    return {
      alreadyEncodedHint: false,
      error: {
        message: 'Encoding failed',
        details: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

/**
 * Helper: convert byte array to percent-encoded string.
 * mode='component': encode all non-unreserved chars.
 * mode='uri': keep reserved chars (/, :, ?, #, &, =) unencoded.
 */
export function percentEscapeBytes(bytes: Uint8Array, mode: 'component' | 'uri'): string {
  // RFC 3986 unreserved: A–Z, a–z, 0–9, -, ., _, ~
  const unreservedSet = new Set([
    ...'-._~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  ]);

  // Reserved chars (mode='uri' only)
  if (mode === 'uri') {
    ':/?#[]@!$&\'()*+,;='.split('').forEach((c) => unreservedSet.add(c));
  }

  return Array.from(bytes)
    .map((b) => {
      const char = String.fromCharCode(b);
      return unreservedSet.has(char) ? char : `%${b.toString(16).toUpperCase().padStart(2, '0')}`;
    })
    .join('');
}
