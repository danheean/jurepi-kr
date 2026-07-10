'use client';

import { useTranslations } from 'next-intl';
import { OptionGroup } from './OptionGroup';

interface Props {
  value: 'encode' | 'decode';
  onChange: (direction: 'encode' | 'decode') => void;
}

export function DirectionToggle({ value, onChange }: Props) {
  const t = useTranslations('tools.base64-encoder');

  return (
    <OptionGroup
      legend={t('direction.label')}
      name="direction"
      value={value}
      onChange={onChange}
      options={[
        { value: 'encode', label: t('direction.encode') },
        { value: 'decode', label: t('direction.decode') },
      ]}
    />
  );
}
