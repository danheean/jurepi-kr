'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

type CopyTarget = 'base64' | 'dataUri' | 'text';

interface Props {
  outputText: string;
  direction: 'encode' | 'decode';
  onCopy: (target: CopyTarget) => Promise<boolean>;
  onDownload: () => void;
  showDownload?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

const COPIED_FEEDBACK_MS = 1600;

export function OutputDisplay({
  outputText,
  direction,
  onCopy,
  onDownload,
  showDownload = false,
  isLoading = false,
  disabled = false,
}: Props) {
  const t = useTranslations('tools.base64-encoder');
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (target: CopyTarget) => {
    const success = await onCopy(target);
    if (success) {
      setCopiedTarget(target);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setCopiedTarget(null);
      }, COPIED_FEEDBACK_MS);
    }
  };

  const hasOutput = outputText.length > 0;
  const isButtonDisabled = !hasOutput || isLoading || disabled;

  const copyButtonClass = (target: CopyTarget) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      copiedTarget === target
        ? 'bg-success text-on-success'
        : 'bg-brand text-on-brand hover:bg-brand-strong'
    }`;

  const copyButtonLabel = (target: CopyTarget, labelKey: string) =>
    copiedTarget === target ? t('output.copied') : t(labelKey);

  return (
    <div className="space-y-3">
      <textarea
        readOnly
        value={outputText}
        placeholder={t('output.placeholder')}
        aria-label={t('output.label')}
        className="w-full min-h-32 p-4 border border-hairline rounded-lg bg-surface-muted text-text placeholder-text-secondary focus:outline-none resize-vertical font-mono text-sm"
      />

      <div aria-live="polite" className="sr-only">
        {copiedTarget ? t('output.copied') : ''}
      </div>

      <div className="flex flex-wrap gap-2">
        {direction === 'encode' && (
          <>
            <button
              onClick={() => handleCopy('base64')}
              disabled={isButtonDisabled}
              className={copyButtonClass('base64')}
            >
              {copyButtonLabel('base64', 'output.copyBase64')}
            </button>
            <button
              onClick={() => handleCopy('dataUri')}
              disabled={isButtonDisabled}
              className={copyButtonClass('dataUri')}
            >
              {copyButtonLabel('dataUri', 'output.copyDataUri')}
            </button>
          </>
        )}

        {direction === 'decode' && (
          <button
            onClick={() => handleCopy('text')}
            disabled={isButtonDisabled}
            className={copyButtonClass('text')}
          >
            {copyButtonLabel('text', 'output.copyText')}
          </button>
        )}

        {showDownload && (
          <button
            onClick={() => onDownload()}
            disabled={isButtonDisabled}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-muted border border-hairline text-text hover:bg-surface-sunken transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('output.download')}
          </button>
        )}
      </div>
    </div>
  );
}
