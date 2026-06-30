import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { type DateKey } from '@/lib/qna-a-day/date';

const MAX_CHARS = 4000;
const SOFT_WARNING_THRESHOLD = 3500;

interface AnswerComposerProps {
  date: DateKey;
  initialText: string;
  onSave: (date: DateKey, text: string) => void;
  testId?: string;
}

export function AnswerComposer({
  date,
  initialText,
  onSave,
  testId,
}: AnswerComposerProps) {
  const t = useTranslations('tools.qna-a-day');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [undoData, setUndoData] = useState<string | null>(null);

  const charCount = text.length;
  const isWarning = charCount >= SOFT_WARNING_THRESHOLD;
  const isMaxed = charCount >= MAX_CHARS;

  // Auto-grow textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(140, el.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [text, resizeTextarea]);

  // Debounced autosave. Takes the value explicitly so the timer never reads a
  // stale `text` closure (the previous bug saved the pre-keystroke value — and
  // an empty value via fill() — which deleted the entry).
  const scheduleAutosave = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      setSaving(true);

      debounceRef.current = setTimeout(() => {
        onSave(date, value.trim());
        setSaving(false);
        setSaved(true);

        const resetTimer = setTimeout(() => setSaved(false), 2000);
        return () => clearTimeout(resetTimer);
      }, 700);
    },
    [date, onSave]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newText = e.target.value;

    // Hard cap at MAX_CHARS
    if (newText.length > MAX_CHARS) {
      newText = newText.slice(0, MAX_CHARS);
    }

    setText(newText);
    scheduleAutosave(newText);
  };

  const handleBlur = () => {
    // Flush debounce immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;

      const trimmed = text.trim();
      onSave(date, trimmed);
      setSaving(false);
      setSaved(true);

      const resetTimer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(resetTimer);
    }
  };

  const handleClear = () => {
    if (text.length > 0) {
      setUndoData(text);
      setText('');
      onSave(date, '');
    }
  };

  const handleUndo = () => {
    if (undoData) {
      setText(undoData);
      onSave(date, undoData);
      setUndoData(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+S for immediate save (case-insensitive: handles Shift/CapsLock too)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const trimmed = text.trim();
      onSave(date, trimmed);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // When the composer is pointed at a different date (neighbor peek / calendar
  // day selection), load that date's saved answer and drop any pending state
  // for the previous date. Keyed on `date` only — re-syncing on every
  // initialText change would clobber an in-progress edit on the same day.
  useEffect(() => {
    setText(initialText);
    setUndoData(null);
    setSaving(false);
    setSaved(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div
      className="space-y-2"
      data-testid={testId ? `${testId}-composer` : undefined}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={t('composer.placeholder')}
        maxLength={MAX_CHARS}
        className={`w-full min-h-[140px] p-4 rounded-lg border border-hairline focus:border-brand focus:ring-3 focus:ring-brand-soft resize-none font-body text-base leading-relaxed transition-colors ${
          isWarning ? 'border-semantic-warning' : ''
        }`}
        aria-label={t('composer.placeholder')}
      />

      {/* Auto-save indicator */}
      <div
        className="flex items-center justify-between text-sm"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="h-5">
          {saving && (
            <div className="flex items-center gap-1.5 text-text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-pulse" />
              {t('composer.saving')}
            </div>
          )}
          {saved && !saving && (
            <div className="flex items-center gap-1.5 text-text-secondary">
              <svg
                className="w-4 h-4 text-accent-grape"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {t('composer.saved')}
            </div>
          )}
        </div>

        {/* Char counter */}
        <div
          className={`text-sm ${
            isWarning ? 'text-semantic-warning font-medium' : 'text-text-secondary'
          }`}
        >
          {charCount} / {MAX_CHARS}
        </div>
      </div>

      {/* Undo for cleared text */}
      {undoData && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted border border-hairline">
          <span className="text-sm text-text-secondary">
            {t('composer.deleted')}
          </span>
          <button
            onClick={handleUndo}
            className="text-sm font-medium text-accent-grape hover:text-accent-grape-dark transition-colors"
          >
            {t('composer.undo')}
          </button>
        </div>
      )}

      {/* Clear button */}
      {text.length > 0 && !undoData && (
        <button
          onClick={handleClear}
          className="text-sm text-text-secondary hover:text-semantic-error transition-colors"
        >
          {t('composer.delete')}
        </button>
      )}
    </div>
  );
}
