'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  line: number;
  column: number;
  token: string;
  context: string;
  className?: string;
}

export function ErrorMessage({
  line,
  column,
  token,
  context,
  className = '',
}: ErrorMessageProps) {
  const t = useTranslations('tools.json-formatter');

  return (
    <div
      className={`
        p-4 rounded-lg border border-danger/20 bg-danger/10
        text-danger-ink
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 flex-shrink-0 w-5 h-5" />
        <div>
          <p className="font-medium">
            {t('errors.title')}
          </p>
          <p className="text-sm mt-2">
            {t('errors.parseError', {
              line,
              column,
              token,
            })}
          </p>
          {context && (
            <p className="text-xs mt-2 font-mono text-danger-ink/70">
              {context}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
