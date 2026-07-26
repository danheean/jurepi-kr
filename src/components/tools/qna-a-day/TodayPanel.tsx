import { useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { addDays, today, type DateKey, type QuestionKey } from '@/lib/qna-a-day/date';
import { type Entry } from '@/lib/qna-a-day/journal';
import { AnswerComposer } from './AnswerComposer';
import { PastYears } from './PastYears';

interface TodayPanelProps {
  todayKey: DateKey;
  todayEntry: Entry | undefined;
  todayQuestion: { key: QuestionKey; text: string };
  onSave: (date: DateKey, text: string) => void;
  entriesForMonthDay: (mmdd: QuestionKey) => Entry[];
  onNavigateDate?: (date: DateKey) => void;
  testId?: string;
}

export function TodayPanel({
  todayKey,
  todayEntry,
  todayQuestion,
  onSave,
  entriesForMonthDay,
  onNavigateDate,
  testId,
}: TodayPanelProps) {
  const t = useTranslations('tools.qna-a-day');
  const locale = useLocale();
  const bcp47 = locale === 'en' ? 'en-US' : 'ko-KR';

  // Compare against the engine's local-time "today", not UTC. The prior
  // `new Date().toISOString().split('T')[0]` produced a UTC date string, which
  // disagreed with `todayKey` (derived from the local-time date engine) for up
  // to 9 hours a day in KST — the "today" badge and back-to-today control were
  // wrong near midnight. This panel is client-only (behind the mounted gate),
  // so there is no SSR of it; the fix is purely correctness.
  const realTodayKey = today();

  // Format date for display
  const dateObj = new Date(
    parseInt(todayKey.slice(0, 4), 10),
    parseInt(todayKey.slice(5, 7), 10) - 1,
    parseInt(todayKey.slice(8, 10), 10)
  );

  const weekday = new Intl.DateTimeFormat(bcp47, {
    weekday: 'long',
  }).format(dateObj);

  const dateStr = new Intl.DateTimeFormat(bcp47, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);

  const pastYearEntries = entriesForMonthDay(todayQuestion.key).filter(
    (e) => parseInt(e.date.slice(0, 4), 10) !== parseInt(todayKey.slice(0, 4), 10)
  );

  const handlePrevDay = useCallback(() => {
    const prev = addDays(todayKey, -1);
    onNavigateDate?.(prev);
  }, [todayKey, onNavigateDate]);

  const handleNextDay = useCallback(() => {
    const next = addDays(todayKey, 1);
    onNavigateDate?.(next);
  }, [todayKey, onNavigateDate]);

  return (
    <div
      className="space-y-6"
      data-testid={testId ? `${testId}-today-panel` : undefined}
    >
      {/* Date header */}
      <div className="flex items-baseline gap-3">
        <div className="flex-1">
          <h2 className="text-body-lg font-medium text-text">
            {weekday}, {dateStr}
          </h2>
        </div>
        {todayKey === realTodayKey && (
          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-accent-grape-soft text-accent-grape-ink">
            {t('today.badge')}
          </span>
        )}
      </div>

      {/* Question with quotation styling */}
      <div className="rounded-lg bg-accent-grape-soft/50 px-5 py-4">
        <p className="text-body-lg text-text leading-relaxed font-medium">
          {todayQuestion.text || ''}
        </p>
      </div>

      {/* Composer */}
      <AnswerComposer
        date={todayKey}
        initialText={todayEntry?.text || ''}
        onSave={onSave}
        testId={testId}
      />

      {/* Neighbor navigation */}
      {onNavigateDate && (
        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <button
            onClick={handlePrevDay}
            className="flex items-center gap-1 text-body text-text-secondary hover:text-text transition-colors"
            aria-label={t('today.neighborPrev')}
          >
            <span>&larr;</span>
            <span className="text-xs">{t('today.neighborPrev')}</span>
          </button>

          {todayKey !== realTodayKey && (
            <button
              onClick={() => onNavigateDate(realTodayKey)}
              className="text-xs font-medium text-accent-grape-ink hover:opacity-80 transition-opacity"
            >
              {t('today.backToToday')}
            </button>
          )}

          <button
            onClick={handleNextDay}
            className="flex items-center gap-1 text-body text-text-secondary hover:text-text transition-colors"
            aria-label={t('today.neighborNext')}
          >
            <span className="text-xs">{t('today.neighborNext')}</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Past years */}
      <PastYears
        todayKey={todayKey}
        entries={pastYearEntries}
        testId={testId}
      />
    </div>
  );
}
