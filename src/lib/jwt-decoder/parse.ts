import { JwtParseError } from './errors';

/**
 * Split JWT into 3 parts (header, payload, signature)
 */
export function splitJwt(token: string): { parts: [string, string, string] } | { error: JwtParseError } {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return {
      error: {
        part: 'token',
        code: 'malformed_structure',
        reason: 'Invalid JWT format. Expected three base64url-encoded parts separated by \'.\'.',
      },
    };
  }

  if (parts.some(p => p.length === 0)) {
    return {
      error: {
        part: 'token',
        code: 'malformed_structure',
        reason: 'Invalid JWT format. All three parts must be non-empty.',
      },
    };
  }

  return { parts: [parts[0], parts[1], parts[2]] };
}

/**
 * Decode a base64url-encoded string to a UTF-8 string
 * Handles URL-safe characters (- and _) and padding
 */
export function decodeBase64Url(b64url: string): { text: string } | { error: string } {
  try {
    // Replace URL-safe chars with standard base64
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if necessary
    const padding = b64.length % 4;
    if (padding) {
      b64 += '='.repeat(4 - padding);
    }

    // Detect invalid characters early
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) {
      // Find the offending character
      const match = b64.match(/[^A-Za-z0-9+/=]/);
      const char = match ? match[0] : 'unknown';
      return {
        error: `Invalid base64url encoding (unexpected character '${char}').`,
      };
    }

    // Decode base64 to bytes
    const binaryStr = atob(b64);

    // Convert bytes to UTF-8 string
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const text = new TextDecoder('utf-8').decode(bytes);
    return { text };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: message };
  }
}

/**
 * Parse a JWT token into header, payload, and signature
 * Performs base64url decoding and JSON parsing
 */
export function parseJwt(
  token: string
):
  | { success: true; header: Record<string, unknown>; payload: Record<string, unknown>; signature: string }
  | { success: false; error: JwtParseError } {

  // Split first
  const splitResult = splitJwt(token);
  if ('error' in splitResult) {
    return { success: false, error: splitResult.error };
  }

  const [headerB64u, payloadB64u, signatureB64u] = splitResult.parts;

  // Decode header
  const headerDecoded = decodeBase64Url(headerB64u);
  if ('error' in headerDecoded) {
    return {
      success: false,
      error: {
        part: 'header',
        code: 'invalid_base64',
        reason: `Invalid base64url encoding: ${headerDecoded.error}`,
      },
    };
  }

  // Parse header JSON
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(headerDecoded.text);
  } catch (error) {
    const message = error instanceof SyntaxError ? error.message : 'Unknown JSON error';
    return {
      success: false,
      error: {
        part: 'header',
        code: 'invalid_json',
        reason: `Invalid JSON: ${message}`,
      },
    };
  }

  // Decode payload
  const payloadDecoded = decodeBase64Url(payloadB64u);
  if ('error' in payloadDecoded) {
    return {
      success: false,
      error: {
        part: 'payload',
        code: 'invalid_base64',
        reason: `Invalid base64url encoding: ${payloadDecoded.error}`,
      },
    };
  }

  // Parse payload JSON
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(payloadDecoded.text);
  } catch (error) {
    const message = error instanceof SyntaxError ? error.message : 'Unknown JSON error';
    return {
      success: false,
      error: {
        part: 'payload',
        code: 'invalid_json',
        reason: `Invalid JSON: ${message}`,
      },
    };
  }

  return {
    success: true,
    header,
    payload,
    signature: signatureB64u,
  };
}
