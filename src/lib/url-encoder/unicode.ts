/**
 * Round-trip test vectors for encoding/decoding validation.
 */

export interface RoundTripVector {
  text: string;
  encoded: string;
  description?: string;
}

/**
 * UTF-8 round-trip test vectors.
 * Cover: ASCII, CJK (한글/Hangul), emoji, accented chars.
 */
export const UTF8_ROUND_TRIP_VECTORS: RoundTripVector[] = [
  // ASCII
  { text: 'hello world', encoded: 'hello%20world', description: 'ASCII with space' },
  { text: 'abc123', encoded: 'abc123', description: 'ASCII alphanumeric' },

  // CJK / Hangul
  { text: '안녕', encoded: '%EC%95%88%EB%85%95', description: 'Korean Hangul (안녕)' },
  { text: '한글', encoded: '%ED%95%9C%EA%B8%80', description: 'Korean (한글)' },

  // Emoji
  { text: '😊', encoded: '%F0%9F%98%8A', description: 'Emoji (smiling face)' },
  { text: '🚀', encoded: '%F0%9F%9A%80', description: 'Emoji (rocket)' },

  // Accented chars
  { text: 'café', encoded: 'caf%C3%A9', description: 'Accented (café)' },
  { text: 'naïve', encoded: 'na%C3%AFve', description: 'Accented (naïve)' },

  // Special chars
  { text: 'hello & goodbye', encoded: 'hello%20%26%20goodbye', description: 'Ampersand' },
  { text: 'a/b', encoded: 'a%2Fb', description: 'Forward slash' },
];

/**
 * EUC-KR / CP949 round-trip test vectors.
 * Cover: Hangul, ASCII (charset-agnostic), CP949-specific CJK.
 */
export const EUCKR_ROUND_TRIP_VECTORS: RoundTripVector[] = [
  // ASCII (charset-agnostic)
  { text: 'hello', encoded: 'hello', description: 'ASCII (EUC-KR)' },
  { text: 'test123', encoded: 'test123', description: 'ASCII alphanumeric (EUC-KR)' },

  // Hangul (Korean)
  { text: '한글', encoded: '%C7%D1%B1%DB', description: 'Hangul (한글) in EUC-KR' },
  { text: '안녕', encoded: '%BE%C8%B3%E7', description: 'Hangul (안녕) in EUC-KR' },
];

/**
 * Unrepresentable char tests for EUC-KR encoding.
 * These characters cannot be encoded in CP949 and should raise UnencodableCharError.
 */
export const EUCKR_UNREPRESENTABLE = [
  { text: '😊', charCode: 0x1F60A, description: 'Emoji (smiling face) unrepresentable in EUC-KR' },
  { text: '🚀', charCode: 0x1F680, description: 'Emoji (rocket) unrepresentable in EUC-KR' },
];
