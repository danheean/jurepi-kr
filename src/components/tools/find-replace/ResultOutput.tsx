'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Download } from 'lucide-react';

interface ResultOutputProps {
  output: string;
  spans: Array<{ index: number; length: number }>;
  totalCount: number;
  ruleCount: number;
  timedOut?: boolean;
  onCopy: () => Promise<void>;
  onDownload: (filename?: string) => void;
}

const COPIED_FEEDBACK_MS = 1600;

/**
 * Render the result output with highlighted spans from <mark> elements (never innerHTML).
 * Shows totalCount/ruleCount, copy button with feedback, download button, and error states.
 */
export function ResultOutput({
  output,
  spans,
  totalCount,
  ruleCount,
  timedOut,
  onCopy,
  onDownload,
}: ResultOutputProps) {
  const t = useTranslations('tools.find-replace');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = useCallback(async () => {
    await onCopy();
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, [onCopy]);

  // Build highlighted output by slicing text into plain + highlighted segments
  const segments: Array<{ type: 'plain' | 'highlighted'; text: string }> = [];
  let lastEnd = 0;

  // Sort spans by index to process in order
  const sortedSpans = [...spans].sort((a, b) => a.index - b.index);

  for (const span of sortedSpans) {
    if (span.index > lastEnd) {
      segments.push({
        type: 'plain',
        text: output.substring(lastEnd, span.index),
      });
    }
    segments.push({
      type: 'highlighted',
      text: output.substring(span.index, span.index + span.length),
    });
    lastEnd = span.index + span.length;
  }

  if (lastEnd < output.length) {
    segments.push({
      type: 'plain',
      text: output.substring(lastEnd),
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{t('result.title')}</h3>
        {timedOut && (
          <div className="text-xs text-danger-ink bg-danger/10 px-2 py-1 rounded">
            {t('error.timeout')}
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="text-xs text-text-secondary" aria-live="polite">
          {t('result.totalCount', { count: totalCount, ruleCount })}
        </div>
      )}

      {output.length === 0 ? (
        <div className="bg-surface rounded-lg border border-hairline p-4 text-center text-sm text-text-secondary min-h-20 flex items-center justify-center">
          {t('result.empty')}
        </div>
      ) : (
        <div
          data-testid="result-output"
          className="bg-surface rounded-lg border border-hairline p-4 min-h-20 text-sm text-text font-mono overflow-auto whitespace-pre-wrap break-words"
        >
          {segments.map((seg, idx) =>
            seg.type === 'highlighted' ? (
              <mark
                key={idx}
                className="bg-accent-grape/20 text-inherit no-underline font-semibold"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={idx}>{seg.text}</span>
            )
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          disabled={output.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 bg-brand text-on-brand rounded-lg font-medium hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
          data-testid="copy-result-button"
        >
          {copied ? (
            <>
              <Check size={16} aria-hidden />
              <span aria-live="polite">{t('result.copied')}</span>
            </>
          ) : (
            <>
              <Copy size={16} aria-hidden />
              <span>{t('result.copy')}</span>
            </>
          )}
        </button>
        <button
          onClick={() => onDownload('result.txt')}
          disabled={output.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 bg-surface-muted text-text rounded-lg font-medium hover:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
          data-testid="download-result-button"
        >
          <Download size={16} aria-hidden />
          <span>{t('result.download')}</span>
        </button>
      </div>
    </div>
  );
}
