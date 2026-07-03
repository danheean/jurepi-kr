'use client';

import { useTranslations } from 'next-intl';
import { InputMode } from '@/lib/qr-code/types';

interface InputModeSelectorProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const MODES: InputMode[] = ['text', 'url', 'wifi', 'vcard', 'email', 'sms'];

export function InputModeSelector({ mode, onModeChange }: InputModeSelectorProps) {
  const t = useTranslations('tools.qr-code');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = MODES.indexOf(mode);

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : MODES.length - 1;
      onModeChange(MODES[nextIndex]);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = currentIndex < MODES.length - 1 ? currentIndex + 1 : 0;
      onModeChange(MODES[nextIndex]);
    }
  };

  return (
    <div
      role="tablist"
      className="flex gap-2 overflow-x-auto pb-2"
      onKeyDown={handleKeyDown}
      aria-label={t('modes.label') || 'Input mode'}
    >
      {MODES.map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          onClick={() => onModeChange(m)}
          className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors min-h-[44px] flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
            mode === m
              ? 'bg-brand text-on-brand'
              : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
          }`}
        >
          {t(`modes.${m}`)}
        </button>
      ))}
    </div>
  );
}
