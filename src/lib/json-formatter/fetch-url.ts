/**
 * Error code for URL fetch failures
 * Maps to i18n messages: errors.urlLoad.<code>
 */
export type JsonUrlErrorCode =
  | 'invalid_url'
  | 'cors_or_network'
  | 'http_error'
  | 'too_large'
  | 'empty_body';

/**
 * Typed error result for URL fetch
 */
export interface JsonUrlError {
  code: JsonUrlErrorCode;
  message: string; // i18n key prefix: errors.urlLoad.<code>
  httpStatus?: number; // Only for http_error
}

/**
 * Validate URL string before fetching
 * Rejects non-HTTP(S) schemes: javascript:, data:, file:, ftp:, etc.
 */
export function validateJsonUrl(rawUrl: string):
  | { ok: true; url: string }
  | { ok: false; error: JsonUrlError } {
  try {
    const trimmed = rawUrl.trim();

    if (!trimmed) {
      return {
        ok: false,
        error: {
          code: 'invalid_url',
          message: 'errors.urlLoad.invalid_url',
        },
      };
    }

    // Create URL object to validate
    const url = new URL(trimmed);

    // Only allow http and https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        ok: false,
        error: {
          code: 'invalid_url',
          message: 'errors.urlLoad.invalid_url',
        },
      };
    }

    return {
      ok: true,
      url: url.toString(),
    };
  } catch (_err) {
    return {
      ok: false,
      error: {
        code: 'invalid_url',
        message: 'errors.urlLoad.invalid_url',
      },
    };
  }
}

/**
 * Fetch JSON from URL
 * fetchImpl: injected for unit tests (no jsdom fetch dependency)
 * Direct browser fetch; no proxy. Typed error codes, never raw exceptions.
 */
export async function fetchJsonFromUrl(
  url: string,
  options: { maxBytes?: number; fetchImpl?: typeof fetch } = {}
): Promise<{ text: string } | { error: JsonUrlError }> {
  const maxBytes = options.maxBytes || 10 * 1024 * 1024; // 10MB default
  const fetchFn = options.fetchImpl || globalThis.fetch;

  try {
    const response = await fetchFn(url);

    // Handle HTTP errors
    if (!response.ok) {
      return {
        error: {
          code: 'http_error',
          message: 'errors.urlLoad.http_error',
          httpStatus: response.status,
        },
      };
    }

    // Check Content-Length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxBytes) {
        return {
          error: {
            code: 'too_large',
            message: 'errors.urlLoad.too_large',
          },
        };
      }
    }

    // Read response body
    const text = await response.text();

    // Check actual size
    if (new TextEncoder().encode(text).length > maxBytes) {
      return {
        error: {
          code: 'too_large',
          message: 'errors.urlLoad.too_large',
        },
      };
    }

    // Check for empty body
    if (!text || text.trim() === '') {
      return {
        error: {
          code: 'empty_body',
          message: 'errors.urlLoad.empty_body',
        },
      };
    }

    return { text };
  } catch (err) {
    // TypeError includes CORS errors and network errors
    // We don't distinguish between them as the UI handling is the same
    return {
      error: {
        code: 'cors_or_network',
        message: 'errors.urlLoad.cors_or_network',
      },
    };
  }
}
