/**
 * CP949 (EUC-KR) forward encoding map.
 * Maps Unicode code point → CP949 byte(s).
 * Lazy-imported only when user encodes to EUC-KR.
 *
 * Built at runtime using TextDecoder('euc-kr') to create a reverse mapping
 * from Unicode codePoints to CP949 bytes. This avoids an external dependency
 * and keeps the table out of the initial bundle (dynamic import).
 */

/**
 * Build CP949 forward map by reverse-mapping TextDecoder('euc-kr').
 * Iterates all 2-byte EUC-KR sequences and maps their Unicode output back to the bytes.
 */
function buildCp949EncodeTable(): Record<number, number[]> {
  const table: Record<number, number[]> = {};
  const decoder = new TextDecoder('euc-kr');

  // Map ASCII (0x00–0x7F) as single bytes
  for (let i = 0; i <= 0x7F; i++) {
    const text = String.fromCharCode(i);
    table[i] = [i];
  }

  // Map 2-byte EUC-KR sequences (lead: 0x81–0xFE, trail: 0x41–0xFE)
  for (let lead = 0x81; lead <= 0xFE; lead++) {
    for (let trail = 0x41; trail <= 0xFE; trail++) {
      // Skip some invalid sequences (0x7F is not a valid trail byte)
      if (trail === 0x7F) continue;

      try {
        const bytes = new Uint8Array([lead, trail]);
        const text = decoder.decode(bytes);

        // Only record if it decoded to exactly one character (not replacement)
        if (text.length === 1 && text.charCodeAt(0) !== 0xFFFD) {
          const codePoint = text.codePointAt(0)!;
          table[codePoint] = [lead, trail];
        }
      } catch {
        // Ignore sequences that fail to decode
      }
    }
  }

  return table;
}

/**
 * Memoized CP949 forward map.
 * Built once on first import; subsequent imports return the cached map.
 */
export const CP949_ENCODE_TABLE: Record<number, number[]> = buildCp949EncodeTable();
