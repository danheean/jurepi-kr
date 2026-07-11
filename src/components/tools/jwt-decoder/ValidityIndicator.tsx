import { useTranslations } from 'next-intl';

interface ValidityIndicatorProps {
  status: 'valid' | 'expired' | 'not_yet_valid' | 'unknown';
  expiryCountdown?: string;
}

export function ValidityIndicator({ status, expiryCountdown }: ValidityIndicatorProps) {
  const t = useTranslations('tools.jwt-decoder');

  const getStatusBadge = () => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-success/10 text-success">
            <span>{t('validity.valid')}</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-danger/10 text-danger-ink">
            <span>{t('validity.expired')}</span>
          </span>
        );
      case 'not_yet_valid':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-warning/10 text-warning-ink">
            <span>{t('validity.notYetValid')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-surface text-text-muted">
            <span>{t('validity.unknown')}</span>
          </span>
        );
    }
  };

  const getCountdownText = () => {
    if (!expiryCountdown) return null;

    switch (status) {
      case 'valid':
        return t('validity.expiresIn', { countdown: expiryCountdown });
      case 'expired':
        return t('validity.expiredAgo', { countdown: expiryCountdown });
      case 'not_yet_valid':
        return t('validity.validatesIn', { countdown: expiryCountdown });
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div>{getStatusBadge()}</div>
      {getCountdownText() && (
        <p className="text-sm text-text-muted">{getCountdownText()}</p>
      )}
    </div>
  );
}
