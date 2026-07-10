'use client';

import { useTranslations } from 'next-intl';
import { useCronParser } from './useCronParser';
import { ModeToggle } from './ModeToggle';
import { ExpressionInput } from './ExpressionInput';
import { TimezoneSelector } from './TimezoneSelector';
import { ParseResultDisplay } from './ParseResultDisplay';
import { PresetExpressions } from './PresetExpressions';
import { RecentsList } from './RecentsList';
import { CronCheatsheet } from './CronCheatsheet';
import { CopyButton } from './CopyButton';

/**
 * Root orchestrator for the cron parser tool.
 * Manages state via useCronParser hook and coordinates all sub-components.
 */
export function CronParser() {
  const t = useTranslations('tools.cron-parser');

  const {
    expression,
    setExpression,
    timezone,
    setTimezone,
    recents,
    removeRecent,
    mode,
    setMode,
    parsedFields,
    parseError,
    description,
    quartzFields,
    quartzDescription,
    nextRuns,
  } = useCronParser();

  const handlePresetSelect = (expr: string) => {
    setExpression(expr);
  };

  const handleLoadRecent = (expr: string) => {
    setExpression(expr);
  };

  return (
    <div className="space-y-8">
      {/* Format mode toggle: Unix crontab | Quartz */}
      <ModeToggle mode={mode} onChange={setMode} />

      {/* Top controls: input, timezone, presets */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Expression input */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-text">
              {t('expressionLabel')}
            </label>
            <ExpressionInput
              value={expression}
              onChange={setExpression}
            />
            <p className="text-xs text-text-secondary">
              {t(mode === 'quartz' ? 'mode.quartzHint' : 'mode.unixHint')}
            </p>
          </div>

          {/* Timezone selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">
              {t('timezoneLabel')}
            </label>
            <TimezoneSelector
              value={timezone}
              onChange={setTimezone}
            />
          </div>
        </div>

        {/* Presets and copy button */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <PresetExpressions mode={mode} onSelect={handlePresetSelect} />
          </div>
          {expression && (
            <CopyButton expression={expression} />
          )}
        </div>
      </div>

      {/* Parse results or error */}
      {expression && (
        <ParseResultDisplay
          mode={mode}
          fields={parsedFields}
          description={description}
          quartzFields={quartzFields}
          quartzDescription={quartzDescription}
          nextRuns={nextRuns}
          error={parseError}
          timezone={timezone}
        />
      )}

      {/* Recents and cheatsheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recents (takes 1 column on large screens) */}
        {recents.length > 0 && (
          <div className="lg:col-span-1">
            <RecentsList
              recents={recents}
              onLoad={handleLoadRecent}
              onDelete={removeRecent}
            />
          </div>
        )}

        {/* Cheatsheet (takes 2 columns, or full width if no recents) */}
        <div className={recents.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CronCheatsheet />
        </div>
      </div>
    </div>
  );
}
