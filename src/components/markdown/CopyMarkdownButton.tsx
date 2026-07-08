'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Check } from 'lucide-react';
import { buildMarkdownDocument } from '@/lib/markdown/buildMarkdownDocument';

interface CopyMarkdownButtonProps {
  /** Raw markdown body of the entity. */
  markdown: string;
  /** Entity title — becomes the H1 of the copied document. */
  title: string;
  /** Absolute source URL — added as a source blockquote (GEO attribution). */
  sourceUrl?: string;
  /** Optional CSS class. */
  className?: string;
}

/**
 * CopyMarkdownButton — copies a content entity as a self-contained Markdown
 * document (title + source + body) to the clipboard, for pasting into an LLM
 * or notes. Mirrors CodeBlock's clipboard + execCommand fallback and token set.
 */
export function CopyMarkdownButton({
  markdown,
  title,
  sourceUrl,
  className = '',
}: CopyMarkdownButtonProps): React.ReactNode {
  const t = useTranslations('markdownCopy');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const document_ = buildMarkdownDocument({
      title,
      markdown,
      sourceUrl,
      sourceLabel: t('sourceLabel'),
    });

    try {
      await navigator.clipboard.writeText(document_);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: execCommand for clipboard-restricted contexts
      try {
        const textarea = document.createElement('textarea');
        textarea.value = document_;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        // Silent fail: button simply does not show the success state
      }
    }
  };

  const label = copied ? t('copied') : t('copy');

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={label}
      aria-live="polite"
      // min-h 44px meets the project's WCAG 2.5.5 touch-target floor; tokens
      // mirror CodeBlock's copy button so the affordance reads consistently.
      className={`inline-flex items-center gap-2 min-h-[44px] px-3 rounded-lg border border-hairline-strong bg-surface text-sm font-medium text-text-secondary hover:text-brand-ink hover:border-brand-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 ${className}`}
      data-testid="copy-markdown-button"
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <FileText className="h-4 w-4" aria-hidden />
      )}
      {label}
    </button>
  );
}
