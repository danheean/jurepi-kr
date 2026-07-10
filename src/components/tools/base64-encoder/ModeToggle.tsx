'use client';

import { useTranslations } from 'next-intl';
import { OptionGroup } from './OptionGroup';

interface Props {
  value: 'text' | 'file';
  onChange: (mode: 'text' | 'file') => void;
}

export function ModeToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.base64-encoder');

  return (
    <OptionGroup
      legend={t('mode.label')}
      name="mode"
      value={value}
      onChange={onChange}
      options={[
        { value: 'text', label: t('mode.text') },
        { value: 'file', label: t('mode.file') },
      ]}
    />
  );
}
