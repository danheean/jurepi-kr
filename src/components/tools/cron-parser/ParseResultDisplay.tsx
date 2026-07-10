'use client';

import { useTranslations } from 'next-intl';
import { ParsedFields, DescriptionModel, QuartzFields, QuartzDescriptionModel, NextRun } from '@/lib/cron-parser';
import { ErrorMessage } from './ErrorMessage';
import { FieldBreakdownTable } from './FieldBreakdownTable';
import { DescriptionText } from './DescriptionText';
import { QuartzFieldBreakdownTable } from './QuartzFieldBreakdownTable';
import { QuartzDescriptionText } from './QuartzDescriptionText';
import { NextRunsList } from './NextRunsList';

interface ParseErrorInfo {
  field: string;
  message: string;
}

interface ParseResultDisplayProps {
  mode: 'unix' | 'quartz';
  fields?: ParsedFields | null;
  description?: DescriptionModel | null;
  quartzFields?: QuartzFields | null;
  quartzDescription?: QuartzDescriptionModel | null;
  nextRuns: NextRun[] | null;
  error: ParseErrorInfo | null;
  timezone: string;
}

export function ParseResultDisplay({
  mode,
  fields,
  description,
  quartzFields,
  quartzDescription,
  nextRuns,
  error,
  timezone,
}: ParseResultDisplayProps) {
  const t = useTranslations('tools.cron-parser');

  if (error) {
    // Quartz parser errors carry an identifier (e.g. 'bothSpecified') as the
    // message — localize it so the raw token never reaches the user.
    const QUARTZ_ERROR_KEYS = [
      'needsQuestion',
      'bothSpecified',
      'fieldCount',
      'outOfRange',
      'invalidStep',
      'invalidPattern',
      'invalidValue',
    ];
    const displayError =
      mode === 'quartz' && QUARTZ_ERROR_KEYS.includes(error.message)
        ? { field: error.field, message: t(`quartzErrors.${error.message}`) }
        : error;
    return <ErrorMessage error={displayError} />;
  }

  if (mode === 'quartz') {
    if (!quartzFields || !quartzDescription || !nextRuns) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Human-readable description */}
        <QuartzDescriptionText model={quartzDescription} />

        {/* Field breakdown */}
        <div className="space-y-2">
          <h3 className="font-semibold text-text">
            {t('fieldsHeading')}
          </h3>
          <QuartzFieldBreakdownTable fields={quartzFields} />
        </div>

        {/* Next runs */}
        <NextRunsList runs={nextRuns} timezone={timezone} />
      </div>
    );
  }

  if (!fields || !description || !nextRuns) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Human-readable description */}
      <DescriptionText model={description} />

      {/* Field breakdown */}
      <div className="space-y-2">
        <h3 className="font-semibold text-text">
          {t('fieldsHeading')}
        </h3>
        <FieldBreakdownTable fields={fields} />
      </div>

      {/* Next runs */}
      <NextRunsList runs={nextRuns} timezone={timezone} />
    </div>
  );
}
