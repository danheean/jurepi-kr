import { parsePercentBytes, bytesToText, UnencodableCharError } from './charset';
import type { DecodeResult } from './schema';

/**
 * Extract user-friendly error details from URIError or other errors.
 */
function extractErrorDetails(error: unknown): string {
  if (error instanceof URIError) {
    return `${error.message}. Check for incomplete percent sequences (e.g., %6 without second hex digit).`;
  }

  if (error instanceof UnencodableCharError) {
    return `${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * UTF-8 Component: decodeURIComponent(text) with optional plusAsSpace.
 * Handles %XX → char, catches URIError on malformed.
 */
export function decodeComponent(
  text: string,
  charset: 'utf-8' | 'euc-kr' = 'utf-8',
  options: { plusAsSpace?: boolean } = {},
): DecodeResult {
  try {
    // Apply plus-as-space heuristic
    const input = options.plusAsSpace ? text.replace(/\+/g, ' ') : text;

    if (charset === 'utf-8') {
      // Native path
      return { result: decodeURIComponent(input) };
    }

    // EUC-KR: parse %XX into bytes, decode with TextDecoder('euc-kr')
    const bytes = parsePercentBytes(input);
    const result = bytesToText(bytes, 'euc-kr');
    return { result };
  } catch (e) {
    // URIError (native), TextDecoder error, or parsePercentBytes error
    return {
      error: {
        message: 'Malformed percent sequence or invalid bytes for the selected charset',
        details: extractErrorDetails(e),
      },
    };
  }
}

/**
 * UTF-8 Full URI: decodeURI(text) with optional plusAsSpace.
 */
export function decodeUri(
  text: string,
  charset: 'utf-8' | 'euc-kr' = 'utf-8',
  options: { plusAsSpace?: boolean } = {},
): DecodeResult {
  try {
    const input = options.plusAsSpace ? text.replace(/\+/g, ' ') : text;

    if (charset === 'utf-8') {
      return { result: decodeURI(input) };
    }

    const bytes = parsePercentBytes(input);
    const result = bytesToText(bytes, 'euc-kr');
    return { result };
  } catch (e) {
    return {
      error: {
        message: 'Malformed sequence or charset mismatch',
        details: extractErrorDetails(e),
      },
    };
  }
}

/**
 * Decode text in the given direction (decode) and mode.
 * Wraps decodeComponent/decodeUri.
 * Returns DecodeResult with result or error.
 */
export async function decode(
  text: string,
  mode: 'component' | 'uri',
  charset: 'utf-8' | 'euc-kr',
  options: { plusAsSpace?: boolean } = {},
): Promise<DecodeResult> {
  const decodeFn = mode === 'component' ? decodeComponent : decodeUri;
  return decodeFn(text, charset, options);
}
