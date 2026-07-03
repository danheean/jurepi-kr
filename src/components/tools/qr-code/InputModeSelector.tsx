'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { InputMode } from '@/lib/qr-code/types';

interface InputModeSelectorProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const MODES: InputMode[] = ['text', 'url', 'wifi', 'vcard', 'email', 'sms'];

export function InputModeSelector({ mode, onModeChange }: InputModeSelectorProps) {
  const t = useTranslations('tools.qr-code');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving-tabindex tab pattern: arrow keys move both selection AND focus.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = MODES.indexOf(mode);
    let nextIndex: number | null = null;

    if (e.key === 'ArrowLeft') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : MODES.length - 1;
    } else if (e.key === 'ArrowRight') {
      nextIndex = currentIndex < MODES.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = MODES.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      onModeChange(MODES[nextIndex]);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      className="flex gap-2 overflow-x-auto pb-2"
      onKeyDown={handleKeyDown}
      aria-label={t('modes.label')}
    >
      {MODES.map((m, i) => (
        <button
          key={m}
          ref={(el) => { tabRefs.current[i] = el; }}
          role="tab"
          aria-selected={mode === m}
          tabIndex={mode === m ? 0 : -1}
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
