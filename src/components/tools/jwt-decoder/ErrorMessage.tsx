import { useTranslations } from 'next-intl';
import { buildErrorMessage, type JwtParseError } from '@/lib/jwt-decoder';

interface ErrorMessageProps {
  parseError?: JwtParseError;
  unsecuredWarning?: boolean;
}

export function ErrorMessage({ parseError, unsecuredWarning }: ErrorMessageProps) {
  const t = useTranslations('tools.jwt-decoder');

  if (unsecuredWarning) {
    return (
      <div
        className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger-ink"
        role="alert"
      >
        <p className="text-sm font-medium">{t('unsecured.banner')}</p>
      </div>
    );
  }

  if (!parseError) {
    return null;
  }

  const errorMessage = buildErrorMessage(parseError);

  return (
    <div
      className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger-ink"
      role="alert"
    >
      <p className="text-sm font-medium">{t('errors.title')}</p>
      <p className="text-sm mt-2">{errorMessage}</p>
    </div>
  );
}
