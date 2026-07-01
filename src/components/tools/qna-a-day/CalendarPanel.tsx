'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  toDateKey,
  toQuestionKey,
  type DateKey,
  addDays,
  today as getTodayKey,
} from '@/lib/qna-a-day/date';
import { AnswerComposer } from './AnswerComposer';
import { type DailyJournalState, type DailyJournalActions } from './useDailyJournal';

interface CalendarPanelProps extends DailyJournalState, DailyJournalActions {
  testId?: string;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 1 && isLeapYear(year)) return 29;
  return MONTH_DAYS[month];
}

export function CalendarPanel({
  today,
  entries,
  yearCompletion,
  upsertEntry,
  getEntry,
  getQuestionText,
  mounted,
  testId,
}: CalendarPanelProps) {
  const t = useTranslations('tools.qna-a-day');
  const locale = useLocale();
  const bcp47 = locale === 'en' ? 'en-US' : 'ko-KR';
  const [selectedYear, setSelectedYear] = useState<number>(
    parseInt(today.slice(0, 4), 10)
  );
  const [displayMonth, setDisplayMonth] = useState<number>(
    parseInt(today.slice(5, 7), 10) - 1
  );
  // Pre-select today so the calendar lands with today's question + composer
  // already open (the tool's entry view). Users can close it (X) or pick another day.
  const [selectedDate, setSelectedDate] = useState<DateKey | null>(today);

  const todayYear = parseInt(today.slice(0, 4), 10);
  const minYear = todayYear - 10;
  const maxYear = todayYear;

  // Calculate answered count for the selected year
  const yearAnsweredCount = useMemo(() => {
    let count = 0;
    for (const dateKey in entries) {
      if (dateKey.startsWith(`${selectedYear}-`)) {
        count++;
      }
    }
    return count;
  }, [selectedYear, entries]);

  // Generate calendar grid for current display month
  const calendarDays = useMemo(() => {
    const daysCount = daysInMonth(selectedYear, displayMonth);
    const firstDay = new Date(selectedYear, displayMonth, 1);
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = Array(startingDayOfWeek).fill(null);
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }
    return days;
  }, [selectedYear, displayMonth]);

  // Month paging
  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      if (selectedYear > minYear) {
        setSelectedYear(selectedYear - 1);
        setDisplayMonth(11);
      }
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      if (selectedYear < maxYear) {
        setSelectedYear(selectedYear + 1);
        setDisplayMonth(0);
      }
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  // Handle day click
  const handleDayClick = (day: number) => {
    const dateStr = `${selectedYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr as DateKey);
  };

  const handleSaveAnswer = (date: DateKey, text: string) => {
    upsertEntry(date, text);
  };

  const selectedDateEntry = selectedDate ? getEntry(selectedDate) : undefined;
  const selectedDateQuestion = selectedDate ? getQuestionText(selectedDate) : '';
  const currentDate = today;

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="space-y-6"
      data-testid={testId ? `${testId}-calendar-panel` : undefined}
    >
      {/* Year switcher */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedYear(Math.max(minYear, selectedYear - 1))}
          disabled={selectedYear <= minYear}
          className="px-3 py-2 text-sm font-medium text-accent-grape-ink hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          aria-label={t('calendar.prevYear')}
        >
          ‹
        </button>
        <div className="text-center">
          <div className="font-display text-headline font-bold text-text">{selectedYear}</div>
          <div className="text-caption text-text-secondary">
            {t('calendar.answeredCountThisYear', { count: yearAnsweredCount })}
          </div>
        </div>
        <button
          onClick={() => setSelectedYear(Math.min(maxYear, selectedYear + 1))}
          disabled={selectedYear >= maxYear}
          className="px-3 py-2 text-sm font-medium text-accent-grape-ink hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          aria-label={t('calendar.nextYear')}
        >
          ›
        </button>
      </div>

      {/* Month navigation and grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            disabled={selectedYear === minYear && displayMonth === 0}
            className="px-2 py-1 text-sm font-medium text-accent-grape-ink hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label={t('calendar.prevMonth')}
          >
            ‹
          </button>
          <div className="text-body-lg font-medium text-text">
            {new Date(selectedYear, displayMonth).toLocaleDateString(bcp47, {
              month: 'long',
            })}
          </div>
          <button
            onClick={handleNextMonth}
            disabled={selectedYear === maxYear && displayMonth === 11}
            className="px-2 py-1 text-sm font-medium text-accent-grape-ink hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label={t('calendar.nextMonth')}
          >
            ›
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-caption font-medium text-text-secondary"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const dateStr = `${selectedYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` as DateKey;
            const hasEntry = dateStr in entries;
            const isFuture = dateStr > currentDate;
            const isToday = dateStr === currentDate;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                aria-label={`${dateStr}, ${hasEntry ? t('calendar.answered') : t('calendar.unanswered')}`}
                className={`h-10 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${
                  isToday
                    ? 'ring-2 ring-focus-ring text-brand-ink font-bold'
                    : isFuture
                      ? 'bg-surface-muted text-text-secondary'
                      : hasEntry
                        ? 'bg-accent-grape-soft text-accent-grape-ink'
                        : 'border border-hairline text-text-secondary hover:border-accent-grape'
                } ${isSelected ? 'ring-2 ring-accent-grape' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Composer for selected date */}
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
            testId={testId}
          />
        </div>
      )}
    </div>
  );
}
