import { useTranslations } from 'next-intl';
import { toQuestionKey, type DateKey } from '@/lib/qna-a-day/date';
import { type Entry } from '@/lib/qna-a-day/journal';

interface PastYearsProps {
  todayKey: DateKey;
  entries: Entry[];
  testId?: string;
}

export function PastYears({ todayKey, entries, testId }: PastYearsProps) {
  const t = useTranslations('tools.qna-a-day');

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-8" data-testid={testId ? `${testId}-past-years` : undefined}>
      <h3 className="text-body-sm font-semibold text-text-secondary">
        {t('today.pastYearsHeading')}
      </h3>

      <div className="space-y-3">
        {entries.map((entry) => {
          const year = parseInt(entry.date.slice(0, 4), 10);
          const excerpt =
            entry.text.length > 150
              ? `${entry.text.slice(0, 150)}…`
              : entry.text;

          return (
            <div
              key={entry.date}
              className="p-4 rounded-lg bg-surface-muted border border-hairline"
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xs font-medium text-text-secondary">
                  {year}년 {entry.date.slice(5, 7)}월 {entry.date.slice(8, 10)}일
                </span>
              </div>
              <p className="text-body text-text leading-relaxed">{excerpt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
