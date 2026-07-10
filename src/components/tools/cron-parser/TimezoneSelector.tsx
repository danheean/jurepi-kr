'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TIMEZONE_NAMES } from '@/lib/cron-parser';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const t = useTranslations('tools.cron-parser');

  // The "Local" option already resolves to the visitor's browser timezone
  // (Intl with an undefined zone). Surface the detected IANA zone name in the
  // label so users can confirm their region was picked up — detected on the
  // client after mount to stay hydration-safe (the server can't know the zone).
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setDetectedZone(tz);
    } catch {
      // Leave the plain "Local" label if detection is unavailable.
    }
  }, []);

  const localLabel = detectedZone
    ? `${t('localTimezone')} (${detectedZone})`
    : t('localTimezone');

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t('timezoneLabel')}
      className="w-full px-4 py-2 rounded-lg border border-hairline bg-surface text-text font-sans text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
    >
      <option value="Local">{localLabel}</option>
      {TIMEZONE_NAMES.filter((tz) => tz !== 'Local').map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  );
}
