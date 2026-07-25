'use client';

import { useTranslations } from 'next-intl';

interface TextToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function TextToggle({ checked, onChange }: TextToggleProps) {
  const t = useTranslations('tools.barcode-generator');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        id="human-readable-toggle"
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="w-4 h-4 rounded border-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring accent-brand"
        data-testid="human-readable-toggle"
      />
      <label
        htmlFor="human-readable-toggle"
        className="text-sm font-medium text-brand-ink cursor-pointer select-none"
      >
        {t('humanReadable.label')}
      </label>
    </div>
  );
}
