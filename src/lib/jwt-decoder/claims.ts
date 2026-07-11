/**
 * Standard JWT claim names
 */
const STANDARD_CLAIM_NAMES = new Set([
  'iss',
  'sub',
  'aud',
  'exp',
  'iat',
  'nbf',
  'jti',
  'typ',
  'kid',
]);

/**
 * Extract standard and custom claims from a JWT payload
 */
export function extractClaims(payload: Record<string, unknown>): {
  standard: Partial<Record<'iss' | 'sub' | 'aud' | 'exp' | 'iat' | 'nbf' | 'jti' | 'typ' | 'kid', unknown>>;
  custom: Record<string, unknown>;
} {
  const standard: Record<string, unknown> = {};
  const custom: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (STANDARD_CLAIM_NAMES.has(key)) {
      standard[key] = value;
    } else {
      custom[key] = value;
    }
  }

  return { standard, custom };
}

/**
 * Render a claim value as a string for display
 * Time fields (exp, iat, nbf) are rendered as Unix seconds (raw numeric)
 * Other values are rendered as JSON
 */
export function renderClaimValue(key: string, value: unknown): string {
  // For timestamp fields, return just the numeric value as string
  if ((key === 'exp' || key === 'iat' || key === 'nbf') && typeof value === 'number') {
    return String(value);
  }

  // For all other values, use JSON.stringify
  return JSON.stringify(value);
}
