'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useDailyJournal } from './useDailyJournal';
import { QnaBenefits } from './QnaBenefits';
import { QnaExamples } from './QnaExamples';
import { ProgressChip } from './ProgressChip';
import { TodayPanel } from './TodayPanel';
import { CalendarPanel } from './CalendarPanel';
import { JournalPanel } from './JournalPanel';
import { SettingsPanel } from './SettingsPanel';
import { QnaHowTo } from './QnaHowTo';
import { QnaFaq } from './QnaFaq';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';
import { type DateKey } from '@/lib/qna-a-day/date';

type TabKey = 'today' | 'calendar' | 'journal' | 'settings';

const TAB_KEYS: Record<number, TabKey> = {
  1: 'today',
  2: 'calendar',
  3: 'journal',
  4: 'settings',
};

const TAB_KEY_REVERSE: Record<TabKey, number> = {
  today: 1,
  calendar: 2,
  journal: 3,
  settings: 4,
};

export function DailyQuestion() {
  const t = useTranslations('tools.qna-a-day');
  const daily = useDailyJournal();
  // Calendar is the landing view: users enter (from the dashboard or a direct
  // link) onto the calendar with today pre-selected and its answer composer open.
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [currentDate, setCurrentDate] = useState<DateKey>(daily.today);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-4 for tabs
      if (e.key >= '1' && e.key <= '4') {
        const tabKey = TAB_KEYS[parseInt(e.key)];
        if (tabKey) {
          setActiveTab(tabKey);
        }
      }

      // 't' for today
      if (e.key === 't' || e.key === 'T') {
        setActiveTab('today');
        setCurrentDate(daily.today);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [daily.today]);

  const handleNavigateDate = useCallback((date: DateKey) => {
    setCurrentDate(date);
  }, []);

  // SoftwareApplication JSON-LD depends only on i18n strings — emit it during
  // SSR (not behind the `mounted` gate) so crawlers see it in the static HTML.
  const locale = useLocale();
  const jsonLd = softwareApplicationJsonLd({
    name: t('meta.title'),
    description: t('meta.description'),
    url: absoluteToolUrl(locale, 'qna-a-day'),
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Intro — i18n only, server-rendered for SEO */}

      {/* Interactive region depends on localStorage + local date, so it must
          hydrate after mount. Render a stable skeleton during SSR / first paint
          to avoid hydration mismatch; the SEO content around it stays static. */}
      {!daily.mounted ? (
        <div className="animate-pulse space-y-4 mb-12" aria-hidden="true">
          <div className="h-12 bg-surface-muted rounded-lg" />
          <div className="h-32 bg-surface-muted rounded-lg" />
        </div>
      ) : (
        <>
          <ProgressChip
            currentStreak={daily.currentStreak}
            totalAnswered={daily.totalAnswered}
            yearCompletion={daily.yearCompletion}
          />

          {/* Tab bar */}
          <div
            className="flex gap-2 mb-8 overflow-x-auto"
            role="tablist"
            aria-label="Navigation tabs"
          >
            {(['today', 'calendar', 'journal', 'settings'] as TabKey[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`${tab}-panel`}
                  className={`px-4 py-2 rounded-full text-body font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-brand text-on-brand'
                      : 'bg-surface-muted text-text-secondary hover:text-text'
                  }`}
                >
                  {t(`tabBar.${tab}`)}
                </button>
              )
            )}
          </div>

          {/* Tab panels */}
          <div className="space-y-8 mb-12">
            {activeTab === 'today' && (
              <div id="today-panel" role="tabpanel">
                <TodayPanel
                  todayKey={currentDate}
                  todayEntry={daily.getEntry(currentDate)}
                  todayQuestion={daily.todayQuestion}
                  onSave={daily.upsertEntry}
                  entriesForMonthDay={daily.entriesForMonthDay}
                  onNavigateDate={handleNavigateDate}
                  testId="daily-question"
                />
              </div>
            )}

            {activeTab === 'calendar' && (
              <div id="calendar-panel" role="tabpanel">
                <CalendarPanel {...daily} testId="daily-question" />
              </div>
            )}

            {activeTab === 'journal' && (
              <div id="journal-panel" role="tabpanel">
                <JournalPanel {...daily} testId="daily-question" />
              </div>
            )}

            {activeTab === 'settings' && (
              <div id="settings-panel" role="tabpanel">
                <SettingsPanel {...daily} testId="daily-question" />
              </div>
            )}
          </div>
        </>
      )}

      {/* SEO long-form + FAQ (with FAQPage JSON-LD) — i18n only, server-rendered */}
      <QnaBenefits />
      <QnaExamples />
      <QnaHowTo />
      <QnaFaq />

      {/* SoftwareApplication JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
