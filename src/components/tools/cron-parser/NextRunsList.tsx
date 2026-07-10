'use client';

import { useTranslations, useLocale } from 'next-intl';
import { NextRun } from '@/lib/cron-parser';

interface NextRunsListProps {
  runs: NextRun[];
  timezone: string;
}

export function NextRunsList({ runs, timezone }: NextRunsListProps) {
  const t = useTranslations('tools.cron-parser');
  const locale = useLocale();

  if (!runs || runs.length === 0) {
    return (
      <div className="rounded-lg bg-surface-sunken border border-hairline p-4 text-center text-text-secondary">
        {t('errors.noUpcomingRuns', {
          defaultValue: 'No upcoming runs found within 4 years.',
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-text">
        {t('nextRunsLabel', { defaultValue: 'Next Runs' })}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left p-3 font-semibold text-text bg-surface-sunken">
                {t('datetime', { defaultValue: 'Date & Time' })}
              </th>
              {timezone !== 'Local' && (
                <th className="text-left p-3 font-semibold text-text bg-surface-sunken">
                  {t('utc', { defaultValue: 'UTC' })}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {runs.map((run, index) => (
              <tr
                key={index}
                className="border-b border-hairline hover:bg-surface-muted transition-colors"
              >
                <td className="p-3 font-mono text-xs text-text-secondary">
                  {run.formatted}
                </td>
                {timezone !== 'Local' && (
                  <td className="p-3 font-mono text-xs text-text-secondary">
                    {run.utc}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
