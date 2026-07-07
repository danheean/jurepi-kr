'use client';

import { useTranslations } from 'next-intl';

interface SourceTextInputProps {
  text: string;
  onChange: (text: string) => void;
}

/**
 * Main textarea for source text input.
 * getByLabelText(sourceText.label) works because of htmlFor/id pair.
 */
export function SourceTextInput({ text, onChange }: SourceTextInputProps) {
  const t = useTranslations('tools.find-replace');

  const charCount = text.length;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="source-text" className="text-sm font-medium text-text">
        {t('sourceText.label')}
      </label>
      <textarea
        id="source-text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('sourceText.placeholder')}
        className="flex-1 min-h-80 p-4 rounded-lg border border-hairline bg-surface text-text placeholder-text-secondary resize-y focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand font-mono text-sm"
      />
      <div className="text-xs text-text-secondary">
        {t('sourceText.charCount', { count: charCount })}
      </div>
    </div>
  );
}
