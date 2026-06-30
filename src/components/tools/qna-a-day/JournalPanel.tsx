'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { type DateKey } from '@/lib/qna-a-day/date';
import { AnswerComposer } from './AnswerComposer';
import { type DailyJournalState, type DailyJournalActions } from './useDailyJournal';

interface JournalPanelProps extends DailyJournalState, DailyJournalActions {
  testId?: string;
}

export function JournalPanel({
  entries,
  store,
  mounted,
  upsertEntry,
  getEntry,
  searchEntries,
  getQuestionText,
  testId,
}: JournalPanelProps) {
  const t = useTranslations('tools.qna-a-day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateKey | null>(null);

  // Get all unique years from entries
  const yearsInEntries = useMemo(() => {
    const years = new Set<number>();
    for (const dateKey in entries) {
      const year = parseInt(dateKey.slice(0, 4), 10);
      years.add(year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [entries]);

  // Filter entries by search and year
  const filteredEntries = useMemo(() => {
    let result = searchQuery ? searchEntries(searchQuery) : Object.values(entries);

    if (selectedYear !== null) {
      result = result.filter(
        (entry) => parseInt(entry.date.slice(0, 4), 10) === selectedYear
      );
    }

    // Sort reverse chronologically
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [searchQuery, selectedYear, entries, searchEntries]);

  const handleSaveAnswer = (date: DateKey, text: string) => {
    upsertEntry(date, text);
  };

  const selectedDateEntry = selectedDate ? getEntry(selectedDate) : undefined;
  const selectedDateQuestion = selectedDate ? getQuestionText(selectedDate) : '';

  if (!mounted) {
    return null;
  }

  const isEmpty = Object.keys(entries).length === 0;
  const noResults = !isEmpty && filteredEntries.length === 0;

  return (
    <div
      className="space-y-4"
      data-testid={testId ? `${testId}-journal-panel` : undefined}
    >
      {/* Search input */}
      <input
        type="text"
        placeholder={t('journal.searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-hairline focus:border-brand focus:ring-3 focus:ring-brand-soft text-body transition-colors"
      />

      {/* Year filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedYear(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedYear === null
              ? 'bg-brand text-white'
              : 'bg-surface-muted text-text-secondary hover:bg-surface-muted-hover'
          }`}
        >
          {t('journal.yearAll')}
        </button>
        {yearsInEntries.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedYear === year
                ? 'bg-brand text-white'
                : 'bg-surface-muted text-text-secondary hover:bg-surface-muted-hover'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Empty state: no entries */}
      {isEmpty && (
        <div className="py-12 text-center space-y-3">
          <p className="text-body text-text-secondary">
            {t('journal.noEntries')}
          </p>
        </div>
      )}

      {/* No search results */}
      {noResults && (
        <div className="py-12 text-center space-y-3">
          <p className="text-body text-text-secondary">
            {t('journal.noResults')}
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm font-medium text-accent-grape hover:text-accent-grape-dark transition-colors"
          >
            {t('journal.clearSearch')}
          </button>
        </div>
      )}

      {/* Entries list */}
      {!isEmpty && filteredEntries.length > 0 && (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <button
              key={entry.date}
              onClick={() => setSelectedDate(entry.date as DateKey)}
              className="w-full text-left p-4 rounded-lg border border-hairline hover:border-accent-grape hover:bg-accent-grape-soft/20 transition-all group"
              aria-label={t('journal.editAria', { date: entry.date })}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-caption font-medium text-text-secondary mb-1">
                    {entry.date}
                  </div>
                  <h4 className="text-body font-medium text-text truncate">
                    {getQuestionText(entry.date as DateKey)}
                  </h4>
                  <p className="text-body-sm text-text-secondary mt-1 line-clamp-2">
                    {entry.text.substring(0, 150)}
                    {entry.text.length > 150 ? '…' : ''}
                  </p>
                </div>
                <div className="text-text-secondary group-hover:text-accent-grape transition-colors flex-shrink-0">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Composer for selected entry */}
      {selectedDate && (
        <div className="border-t border-hairline pt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-body-lg font-medium text-text">{selectedDate}</h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-sm text-text-secondary hover:text-text transition-colors"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <p className="text-body text-text-secondary rounded-md bg-accent-grape-soft/40 px-3 py-2">
              {selectedDateQuestion}
            </p>
          </div>
          <AnswerComposer
            date={selectedDate}
            initialText={selectedDateEntry?.text || ''}
            onSave={handleSaveAnswer}
          />
        </div>
      )}
    </div>
  );
}
