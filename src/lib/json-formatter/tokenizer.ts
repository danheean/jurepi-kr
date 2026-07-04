/**
 * Tokenizer for JSON error position tracking
 * Maps JSON.parse errors to exact line/column position
 */

export interface TokenizeError {
  line: number; // 1-indexed
  column: number; // 1-indexed
  token: string; // the offending character/token
  context: string; // ~20 chars around error
}

/**
 * Extract line/column from JSON parse error
 * Scans input character-by-character, tracking line (LF) and column (reset on LF)
 * Returns human-friendly 1-indexed line and column numbers
 */
export function lineColFromParseError(jsonStr: string, error: Error): TokenizeError {
  const errorMsg = error.message;

  // Try to extract position from V8/JSC error message
  // Typical patterns:
  // - "Unexpected token } in JSON at position 42"
  // - "Unexpected token '}', "}}" is not valid JSON"
  // - "JSON.parse: unexpected character at line X column Y"
  const positionMatch = errorMsg.match(/position (\d+)/);
  const lineColMatch = errorMsg.match(/line (\d+) column (\d+)/);

  let errorPosition = -1;

  if (positionMatch) {
    errorPosition = parseInt(positionMatch[1], 10);
  } else if (lineColMatch) {
    // If we already have line/col, use it
    const line = parseInt(lineColMatch[1], 10);
    const column = parseInt(lineColMatch[2], 10);
    return {
      line,
      column,
      token: extractToken(jsonStr, errorPosition),
      context: extractContext(jsonStr, errorPosition),
    };
  } else {
    // Fallback: scan from end backwards to find likely error position
    errorPosition = jsonStr.length - 1;
  }

  // Scan the string to find line and column at errorPosition
  const { line, column } = scanToPosition(jsonStr, errorPosition);

  const token = extractToken(jsonStr, errorPosition);
  const context = extractContext(jsonStr, errorPosition);

  return {
    line,
    column,
    token,
    context,
  };
}

/**
 * Scan through JSON string and find line/column at given position
 */
function scanToPosition(jsonStr: string, targetPos: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const clampedPos = Math.max(0, Math.min(targetPos, jsonStr.length - 1));

  for (let i = 0; i <= clampedPos && i < jsonStr.length; i++) {
    if (jsonStr[i] === '\n') {
      line++;
      column = 1;
    } else if (jsonStr[i] === '\r') {
      // Handle \r or \r\n
      line++;
      column = 1;
      // Skip next \n if it exists
      if (i + 1 < jsonStr.length && jsonStr[i + 1] === '\n') {
        i++;
      }
    } else {
      column++;
    }
  }

  return { line, column };
}

/**
 * Extract the token at error position
 */
function extractToken(jsonStr: string, pos: number): string {
  const clampedPos = Math.max(0, Math.min(pos, jsonStr.length - 1));
  const char = jsonStr[clampedPos];

  // If it's a quote, try to extract the full string
  if (char === '"' || char === "'") {
    let end = clampedPos + 1;
    while (end < jsonStr.length && jsonStr[end] !== char) {
      if (jsonStr[end] === '\\') end++; // Skip escaped chars
      end++;
    }
    return jsonStr.substring(clampedPos, Math.min(end + 1, jsonStr.length));
  }

  // For other chars, return just the char
  return char;
}

/**
 * Extract context around error position (~20 chars)
 */
function extractContext(jsonStr: string, pos: number): string {
  const clampedPos = Math.max(0, Math.min(pos, jsonStr.length - 1));
  const contextRadius = 10;
  const start = Math.max(0, clampedPos - contextRadius);
  const end = Math.min(jsonStr.length, clampedPos + contextRadius + 1);

  let context = jsonStr.substring(start, end);
  // Remove newlines for display
  context = context.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();
  return context;
}
