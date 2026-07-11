import { useTranslations } from 'next-intl';
import { parseUnixSeconds, formatTimestamp } from '@/lib/jwt-decoder';

interface TimestampDisplayProps {
  exp?: number;
  iat?: number;
  nbf?: number;
  locale: string;
}

export function TimestampDisplay({ exp, iat, nbf, locale }: TimestampDisplayProps) {
  const t = useTranslations('tools.jwt-decoder');

  const renderTimestamp = (key: string, value: number) => {
    const date = parseUnixSeconds(value);
    const formatted = formatTimestamp(date, locale);

    return (
      <div key={key} className="p-3 bg-surface rounded-lg border border-hairline">
        <div className="text-xs font-medium text-text-muted mb-2">{t(`claims.${key}`)}</div>
        <div className="text-sm font-mono text-text mb-2">{value}</div>
        <div className="text-xs text-text-muted">{formatted.local}</div>
        <div className="text-xs text-text-muted">{formatted.iso}</div>
      </div>
    );
  };

  const hasAnyTimestamp = exp !== undefined || iat !== undefined || nbf !== undefined;

  if (!hasAnyTimestamp) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {iat !== undefined && renderTimestamp('iat', iat)}
      {nbf !== undefined && renderTimestamp('nbf', nbf)}
      {exp !== undefined && renderTimestamp('exp', exp)}
    </div>
  );
}
