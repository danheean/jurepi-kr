'use client';

import { useTranslations } from 'next-intl';

interface ParseErrorInfo {
  field: string;
  message: string;
}

interface ErrorMessageProps {
  error: ParseErrorInfo;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const t = useTranslations('tools.cron-parser');

  return (
    <div
      role="alert"
      className="rounded-lg border border-danger bg-danger/10 p-4 text-danger"
    >
      <h3 className="font-semibold mb-1">
        {t('parseError', { defaultValue: 'Parse Error' })}
      </h3>
      <p className="text-sm">
        {t('errors.invalidField', {
          field: error.field,
          message: error.message,
        })}
      </p>
    </div>
  );
}
