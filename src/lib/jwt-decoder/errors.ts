/**
 * JWT error codes for precise error categorization
 */
export type JwtErrorCode =
  | 'malformed_structure'
  | 'invalid_base64'
  | 'invalid_json'
  | 'unsupported_alg'
  | 'verification_failed'
  | 'invalid_pem'
  | 'secret_error';

/**
 * Typed error with context
 */
export interface JwtParseError {
  part: 'header' | 'payload' | 'signature' | 'token';
  code: JwtErrorCode;
  reason: string;
}

/**
 * Build a user-friendly error message
 */
export function buildErrorMessage(error: JwtParseError): string {
  if (error.part === 'token') {
    return error.reason;
  }
  return `Invalid JWT. Part: ${error.part}, Error: ${error.reason}`;
}
