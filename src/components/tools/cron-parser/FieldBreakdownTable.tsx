'use client';

import { useTranslations } from 'next-intl';
import { ParsedFields, FIELD_NAMES, FIELD_RANGES } from '@/lib/cron-parser';

interface FieldBreakdownTableProps {
  fields: ParsedFields;
}

export function FieldBreakdownTable({ fields }: FieldBreakdownTableProps) {
  const t = useTranslations('tools.cron-parser');

  const isAllValues = (fieldName: keyof ParsedFields): boolean => {
    if (fieldName === 'isValid' || fieldName === 'error') return false;
    const field = fields[fieldName] as number[];
    const range = FIELD_RANGES[fieldName as Exclude<keyof ParsedFields, 'isValid' | 'error'>];
    return (
      field.length ===
      range.max - range.min + 1 &&
      field[0] === range.min
    );
  };

  const formatFieldValues = (fieldName: keyof ParsedFields): string => {
    if (fieldName === 'isValid' || fieldName === 'error') return '';
    const field = fields[fieldName] as number[];
    if (isAllValues(fieldName)) {
      return t('allValues', { defaultValue: 'All' });
    }
    return field.slice(0, 10).join(', ') + (field.length > 10 ? '…' : '');
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-hairline">
            {FIELD_NAMES.map((field) => (
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
            {FIELD_NAMES.map((field) => (
              <td
                key={field}
                className="p-3 font-mono text-xs text-text-secondary"
              >
                {formatFieldValues(field)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
