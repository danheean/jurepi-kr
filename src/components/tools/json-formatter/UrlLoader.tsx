'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { ErrorMessage as ErrorMessageComponent } from './ErrorMessage';
import type { JsonUrlError } from '@/lib/json-formatter';

interface UrlLoaderProps {
  isLoading: boolean;
  error: JsonUrlError | null;
  onLoad: (url: string) => void;
  onClearError?: () => void;
}

export function UrlLoader({
  isLoading,
  error,
  onLoad,
  onClearError,
}: UrlLoaderProps) {
  const t = useTranslations('tools.json-formatter');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onLoad(url);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (onClearError && error) {
      onClearError();
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="url-input" className="sr-only">
            {t('urlLoader.label')}
          </label>
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={handleInputChange}
            placeholder={t('urlLoader.placeholder')}
            disabled={isLoading}
            className={`
              w-full px-4 py-2 rounded-lg border font-mono text-sm
              bg-surface border-surface-muted
              focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          variant="secondary"
          className="px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="sr-only">{t('urlLoader.loading')}</span>
            </>
          ) : (
            t('urlLoader.loadButton')
          )}
        </Button>
      </form>

      {error && (
        <div className="text-danger-ink text-sm p-3 bg-danger/10 rounded-lg border border-danger/20">
          <p className="font-medium">{t('errors.title')}</p>
          <p className="mt-1">
            {t(`urlLoader.errors.${error.code}`, {
              status: error.httpStatus,
            })}
          </p>
        </div>
      )}
    </div>
  );
}
