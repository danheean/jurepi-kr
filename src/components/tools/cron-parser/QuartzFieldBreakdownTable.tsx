'use client';

import { useTranslations } from 'next-intl';
import { QuartzFields, QUARTZ_FIELD_NAMES } from '@/lib/cron-parser';
import { formatDomSpec, formatDowSpec, formatNumberField } from './quartz-format';

interface QuartzFieldBreakdownTableProps {
  fields: QuartzFields;
}

export function QuartzFieldBreakdownTable({ fields }: QuartzFieldBreakdownTableProps) {
  const t = useTranslations('tools.cron-parser');

  // Determine which fields to display based on hasYear
  const fieldsToDisplay = fields.hasYear
    ? (QUARTZ_FIELD_NAMES as readonly string[])
    : (QUARTZ_FIELD_NAMES.filter((f) => f !== 'year') as string[]);

  // A `null` from a formatter means "full range" — render the localized "All".
  const withAll = (value: string | null): string =>
    value === null ? t('allValues') : value;

  const formatFieldValue = (fieldName: string): string => {
    switch (fieldName) {
      case 'second':
        return withAll(formatNumberField(fields.second, 60));
      case 'minute':
        return withAll(formatNumberField(fields.minute, 60));
      case 'hour':
        return withAll(formatNumberField(fields.hour, 24));
      case 'dom':
        return withAll(formatDomSpec(fields.dom));
      case 'month':
        return withAll(formatNumberField(fields.month, 12));
      case 'dow':
        return withAll(formatDowSpec(fields.dow));
      case 'year':
        return fields.year ? withAll(formatNumberField(fields.year, 130)) : '';
      default:
        return '';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-hairline">
            {fieldsToDisplay.map((field) => (
              <th
                key={field}
                className="text-left p-3 font-semibold text-text bg-surface-sunken"
              >
                {t(`fields.${field}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-hairline hover:bg-surface-muted transition-colors">
            {fieldsToDisplay.map((field) => (
              <td
                key={field}
                className="p-3 font-mono text-xs text-text-secondary"
              >
                {formatFieldValue(field)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
