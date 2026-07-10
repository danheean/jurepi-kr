'use client';

import { useTranslations } from 'next-intl';
import { ParsedFields, DescriptionModel, NextRun } from '@/lib/cron-parser';
import { ErrorMessage } from './ErrorMessage';
import { FieldBreakdownTable } from './FieldBreakdownTable';
import { DescriptionText } from './DescriptionText';
import { NextRunsList } from './NextRunsList';

interface ParseErrorInfo {
  field: string;
  message: string;
}

interface ParseResultDisplayProps {
  fields: ParsedFields | null;
  description: DescriptionModel | null;
  nextRuns: NextRun[] | null;
  error: ParseErrorInfo | null;
  timezone: string;
}

export function ParseResultDisplay({
  fields,
  description,
  nextRuns,
  error,
  timezone,
}: ParseResultDisplayProps) {
  const t = useTranslations('tools.cron-parser');

  if (error) {
    return <ErrorMessage error={error} />;
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
