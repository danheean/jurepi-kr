/**
 * Codec interface for charset encoding/decoding.
 * - Decoding: native TextDecoder (both UTF-8 + EUC-KR)
 * - Encoding: UTF-8 native; EUC-KR via lazy-imported CP949 forward table
 */

/**
 * Custom error for unencodable characters (EUC-KR only).
 */
export class UnencodableCharError extends Error {
  constructor(
    public char: string,
    public charCode: number,
    public charset: 'utf-8' | 'euc-kr',
  ) {
    super(
      `Character '${char}' (U+${charCode.toString(16).toUpperCase()}) ` +
      `cannot be represented in ${charset === 'euc-kr' ? 'EUC-KR/CP949' : 'UTF-8'}`,
    );
    this.name = 'UnencodableCharError';
  }
}

/**
 * Parse percent-encoded bytes: "%XX" → byte value, plain ASCII → its code.
 * Returns Uint8Array of byte values.
 * Throws if sequence malformed (incomplete hex).
 */
export function parsePercentBytes(input: string): Uint8Array {
  const bytes: number[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === '%') {
      // Must be followed by exactly 2 hex digits
      if (i + 2 >= input.length) {
        throw new Error(`Malformed percent sequence: incomplete hex at position ${i}`);
      }

      const hex = input.slice(i + 1, i + 3);
      const num = parseInt(hex, 16);

      if (isNaN(num)) {
        throw new Error(`Malformed percent sequence: '${input.slice(i, i + 3)}' is not valid hex`);
      }

      bytes.push(num);
      i += 3;
    } else {
      // Plain ASCII character
      bytes.push(char.charCodeAt(0));
      i += 1;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Decode bytes as the given charset.
 * UTF-8: native TextDecoder('utf-8').
 * EUC-KR: native TextDecoder('euc-kr').
 * Both are zero-dep (browser-native).
 *
 * May throw TextDecoder error if bytes invalid for charset.
 */
export function bytesToText(bytes: Uint8Array, charset: 'utf-8' | 'euc-kr'): string {
  const decoder = new TextDecoder(charset);
  return decoder.decode(bytes);
}

/**
 * Encode text to bytes under the given charset.
 * UTF-8: synchronous (native JS TextEncoder).
 * EUC-KR: ASYNC (lazy-imports CP949 forward table on first call).
 *
 * Throws UnencodableCharError if a char has no mapping in the target charset.
 */
export async function textToBytes(
  text: string,
  charset: 'utf-8' | 'euc-kr',
): Promise<Uint8Array> {
  if (charset === 'utf-8') {
    // Synchronous path: use native TextEncoder (already UTF-8)
    return Promise.resolve(new TextEncoder().encode(text));
  }

  if (charset === 'euc-kr') {
    // Lazy-load CP949 forward table, only on first EUC-KR encode
    const { CP949_ENCODE_TABLE } = await import('./charset/cp949-encode');
    const bytes: number[] = [];

    for (const char of text) {
      const codePoint = char.codePointAt(0)!;
      const cp949Bytes = CP949_ENCODE_TABLE[codePoint];

      if (!cp949Bytes) {
        throw new UnencodableCharError(char, codePoint, 'euc-kr');
      }

      bytes.push(...cp949Bytes);
    }

    return new Uint8Array(bytes);
  }

  throw new Error(`Unsupported charset: ${charset}`);
}
