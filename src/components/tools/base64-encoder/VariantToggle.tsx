'use client';

import { useTranslations } from 'next-intl';
import { OptionGroup } from './OptionGroup';

interface Props {
  value: 'standard' | 'urlSafe';
  onChange: (variant: 'standard' | 'urlSafe') => void;
}

export function VariantToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.base64-encoder');

  return (
    <OptionGroup
      legend={t('variant.label')}
      name="variant"
      value={value}
      onChange={onChange}
      layout="stack"
      options={[
        { value: 'standard', label: t('variant.standard'), hint: t('variant.standardHint') },
        { value: 'urlSafe', label: t('variant.urlSafe'), hint: t('variant.urlSafeHint') },
      ]}
    />
  );
}
