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
  code?: string;
  params?: Record<string, string | number>;
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

    // Localize the field name (분 / minute …); fall back to the raw key.
    const field = t.has(`fieldLabels.${error.field}`)
      ? t(`fieldLabels.${error.field}`)
      : error.field;

    // Localize the detail: Quartz errors carry a code as the message; Unix
    // errors carry an explicit `code` + `params`. Anything not yet coded falls
    // back to the English message.
    let message = error.message;
    if (mode === 'quartz' && QUARTZ_ERROR_KEYS.includes(error.message)) {
      message = t(`quartzErrors.${error.message}`);
    } else if (error.code && t.has(`errors.${error.code}`)) {
      message = t(`errors.${error.code}`, error.params);
    }

    return <ErrorMessage error={{ field, message }} />;
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
