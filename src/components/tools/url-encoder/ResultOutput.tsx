'use client';

import { useTranslations } from 'next-intl';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface Props {
  result: string | null;
  error?: { message: string; details: string } | null;
  onCopy: () => Promise<boolean>;
  isLoading?: boolean;
}

export function ResultOutput({ result, error, onCopy, isLoading }: Props) {
  const t = useTranslations('tools.url-encoder');
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'fail'>('idle');

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 1600);
    } else {
      setCopyState('fail');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg bg-danger/10 border border-danger/30 p-4 space-y-2">
        <p className="font-semibold text-danger-ink text-sm">{error.message}</p>
        <p className="text-xs text-text-secondary">{error.details}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {result ? (
        <>
          <div
            className="bg-surface-muted border border-hairline rounded-lg p-4 min-h-24 overflow-auto font-mono text-sm text-text break-all"
            aria-label={t('output.aria')}
            role="region"
          >
            {result}
          </div>
          <button
            onClick={handleCopy}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              copyState === 'success'
                ? 'bg-success text-white'
                : 'bg-brand text-on-brand hover:bg-brand-strong'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={t('output.copyButton')}
          >
            <Copy className="w-4 h-4" strokeWidth={1.75} />
            {copyState === 'success' ? t('output.copied') : t('output.copyButton')}
          </button>
        </>
      ) : (
        <div className="bg-surface-muted border border-hairline rounded-lg p-8 text-center text-text-secondary text-sm">
          {isLoading ? 'Processing...' : 'Result will appear here'}
        </div>
      )}
    </div>
  );
}
