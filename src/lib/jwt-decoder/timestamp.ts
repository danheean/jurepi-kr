/**
 * Parse Unix seconds to JavaScript Date
 */
export function parseUnixSeconds(ts: number): Date {
  return new Date(ts * 1000);
}

/**
 * Format a Date into ISO and local human-readable time
 * locale: BCP 47 language tag (e.g., 'en-US', 'ko-KR')
 */
export function formatTimestamp(
  date: Date,
  locale: string
): {
  iso: string;
  local: string;
} {
  const iso = date.toISOString();

  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    hour12: locale.toLowerCase().startsWith('en'),
  });

  const local = formatter.format(date) + ' UTC';

  return { iso, local };
}

/**
 * Duration in days, hours, minutes, seconds
 */
export interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Convert seconds to a structured duration
 * Handle both positive and negative seconds
 */
export function formatDuration(seconds: number): Duration {
  const sign = seconds < 0 ? -1 : 1;
  const absSeconds = Math.abs(seconds);

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  return {
    hours: hours * sign,
    minutes,
    seconds: secs,
  };
}

/**
 * Determine validity status based on iat/exp/nbf claims
 * nowMs: current time in milliseconds (injected for testability)
 */
export function getValidityStatus(
  claims: {
    iat?: number;
    exp?: number;
    nbf?: number;
  },
  nowMs: number
): {
  status: 'valid' | 'expired' | 'not_yet_valid' | 'unknown';
  secondsRemaining?: number;
  exp?: number;
  iat?: number;
  nbf?: number;
} {
  const nowSeconds = Math.floor(nowMs / 1000);
  const { iat, exp, nbf } = claims;

  // Check if we have any time claims
  if (!iat && !exp && !nbf) {
    return { status: 'unknown' };
  }

  // Check nbf (not before)
  if (nbf && nowSeconds < nbf) {
    return {
      status: 'not_yet_valid',
      secondsRemaining: nbf - nowSeconds,
      nbf,
    };
  }

  // Check iat (issued at)
  if (iat && nowSeconds < iat) {
    return {
      status: 'not_yet_valid',
      secondsRemaining: iat - nowSeconds,
      iat,
    };
  }

  // Check exp (expiration)
  if (exp) {
    const secondsRemaining = exp - nowSeconds;
    if (secondsRemaining < 0) {
      return {
        status: 'expired',
        secondsRemaining,
        exp,
      };
    }
    return {
      status: 'valid',
      secondsRemaining,
      exp,
    };
  }

  // Default to valid if exp not present and no earlier checks failed
  return { status: 'valid' };
}
