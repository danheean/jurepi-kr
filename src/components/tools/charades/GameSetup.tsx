'use client';

import { useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X } from 'lucide-react';
import type { MergedDeck } from '@/lib/charades/schema';

const DIALOG_TITLE_ID = 'charades-setup-title';

interface GameSetupProps {
  deck: MergedDeck | null;
  settings: {
    difficulty?: 'easy' | 'normal' | 'hard';
    roundTimeSeconds: number | null;
    shuffle: boolean;
    showHints: boolean;
  };
  onSetting: <K extends keyof GameSetupProps['settings']>(
    key: K,
    value: GameSetupProps['settings'][K]
  ) => void;
  onStart: () => void;
  onCancel: () => void;
}

/**
 * Game setup panel: difficulty (preset if deck single), time presets, shuffle, hints toggles.
 */
export function GameSetup({ deck, settings, onSetting, onStart, onCancel }: GameSetupProps) {
  const t = useTranslations('tools.charades');
  const locale = useLocale() as 'ko' | 'en';
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the dialog once on open (mount only — don't steal focus on re-render).
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Modal a11y: trap Tab within the dialog, close on Escape.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  if (!deck) return null;

  const deckTitle = deck[locale === 'en' ? 'en' : 'ko'].title;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        tabIndex={-1}
        className="bg-surface rounded-lg border border-hairline shadow-pop max-w-[32rem] w-full mx-4 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-hairline">
          <h2 id={DIALOG_TITLE_ID} className="text-2xl font-bold text-text">
            {t('setup.title')}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-surface-muted rounded-lg" aria-label={t('setup.cancel')}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Deck title display */}
          <div>
            <p className="text-text-secondary text-sm mb-1">{t('setup.selectedDeck')}</p>
            <p className="text-lg font-semibold text-text">{deckTitle}</p>
          </div>

          {/* Difficulty */}
          <fieldset>
            <legend className="font-semibold text-text mb-3">{t('setup.difficulty')}</legend>
            <div className="space-y-2">
              {['easy', 'normal', 'hard'].map((diff) => (
                <label key={diff} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value={diff}
                    checked={settings.difficulty === diff}
                    onChange={(e) => onSetting('difficulty', e.target.value as any)}
                    className="w-4 h-4 accent-brand"
                    data-testid={`setup-difficulty-${diff}`}
                  />
                  <span className="text-text">{t(`difficulty.${diff}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Round time */}
          <fieldset>
            <legend className="font-semibold text-text mb-3">{t('setup.roundTime')}</legend>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, null].map((seconds) => (
                <button
                  key={seconds || 'unlimited'}
                  onClick={() => onSetting('roundTimeSeconds', seconds)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    settings.roundTimeSeconds === seconds
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface-muted text-text hover:bg-hairline'
                  }`}
                  data-testid={`setup-time-${seconds || 'unlimited'}`}
                >
                  {seconds ? t(`setup.time${seconds}`) : t('setup.unlimited')}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Shuffle toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.shuffle}
              onChange={(e) => onSetting('shuffle', e.target.checked)}
              className="w-5 h-5 accent-brand"
              data-testid="setup-shuffle"
            />
            <span className="text-text font-medium">{t('setup.shuffle')}</span>
          </label>

          {/* Hints toggle — performer-only cue, never shown to guessers */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showHints}
              onChange={(e) => onSetting('showHints', e.target.checked)}
              className="w-5 h-5 accent-brand"
              data-testid="setup-hints"
            />
            <span className="text-text font-medium">{t('setup.hints')}</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t border-hairline">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-surface-muted text-text rounded-lg font-semibold hover:bg-hairline transition-colors"
            data-testid="setup-cancel"
          >
            {t('setup.cancel')}
          </button>
          <button
            onClick={onStart}
            className="flex-1 px-4 py-3 bg-brand text-on-brand rounded-lg font-semibold hover:bg-brand-strong transition-colors min-h-12"
            data-testid="setup-start"
          >
            {t('setup.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
