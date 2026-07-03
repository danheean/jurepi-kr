'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Copy, UserPlus } from 'lucide-react';
import type { DateKey } from '@/lib/age-calculator/date';
import { useAgeLookup } from './useAgeLookup';
import { BirthdateInput } from './BirthdateInput';
import { AgeCalculatorEmptyState } from './AgeCalculatorEmptyState';
import { AgeSummary } from './AgeSummary';
import { DateFacts } from './DateFacts';
import { RecentLookups } from './RecentLookups';
import { PeopleList } from './PeopleList';
import type { CalendarDateValue } from './CalendarDateInput';

export function AgeCalculator() {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();
  const {
    birthdate,
    calendarType,
    isLeapMonth,
    age,
    error,
    people,
    recents,
    asOfDate,
    useAsOf,
    setBirthdate,
    setAsOfDate,
    setUseAsOf,
    addPerson,
    removePerson,
    selectRecent,
    clearRecents,
    clearError,
    copyResultToClipboard,
  } = useAgeLookup();

  const [mounted, setMounted] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'fail'>('idle');
  const [prefill, setPrefill] = useState<CalendarDateValue | null>(null);
  const [prefillNonce, setPrefillNonce] = useState(0);
  const peopleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    const success = await copyResultToClipboard();
    setCopyState(success ? 'success' : 'fail');
    setTimeout(() => setCopyState('idle'), success ? 1600 : 2000);
  };

  const handleSaveAsPerson = () => {
    if (!birthdate) return;
    setPrefill({ date: birthdate as DateKey, calendarType, isLeapMonth });
    setPrefillNonce((n) => n + 1);
    peopleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-12">
      {/* Main: 2-split desktop, stacked mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <BirthdateInput
            value={birthdate}
            calendarType={calendarType}
            isLeapMonth={isLeapMonth}
            asOfDate={asOfDate}
            useAsOf={useAsOf}
            error={error}
            onBirthdateChange={(v) => setBirthdate(v.date, v.calendarType, v.isLeapMonth)}
            onAsOfDateChange={setAsOfDate}
            onUseAsOfChange={setUseAsOf}
            onClearError={clearError}
          />
        </div>

        <div className="lg:sticky lg:top-8 h-fit space-y-6">
          {age ? (
            <>
              <AgeSummary age={age} />

              {/* Actions: copy + save as person */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                    copyState === 'success'
                      ? 'bg-success text-on-success'
                      : 'bg-brand text-on-brand hover:bg-brand-strong'
                  }`}
                  aria-label={t('actions.copy')}
                >
                  <Copy className="w-4 h-4" strokeWidth={1.75} />
                  {copyState === 'success' ? t('actions.copied') : t('actions.copy')}
                </button>
                <button
                  onClick={handleSaveAsPerson}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm border border-hairline text-text hover:bg-surface-muted transition-colors"
                >
                  <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                  {t('actions.saveAsPerson')}
                </button>
              </div>

              <DateFacts age={age} locale={locale} />
            </>
          ) : (
            <AgeCalculatorEmptyState />
          )}
        </div>
      </div>

      {/* Recents */}
      {recents.length > 0 && (
        <RecentLookups recents={recents} onSelectRecent={selectRecent} onClear={clearRecents} />
      )}

      {/* People favorites */}
      <div ref={peopleRef} className="scroll-mt-8">
        <PeopleList
          people={people}
          onAdd={addPerson}
          onRemove={removePerson}
          onSelect={(p) => setBirthdate(p.birthdate as DateKey, p.calendarType, p.isLeapMonth)}
          prefill={prefill}
          prefillNonce={prefillNonce}
        />
      </div>
    </div>
  );
}
