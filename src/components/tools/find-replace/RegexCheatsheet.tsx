'use client';

import { useTranslations } from 'next-intl';
import { CHEATSHEET } from '@/lib/find-replace';

/**
 * Collapsible regex cheatsheet. Shows sections with token descriptions.
 * Pure reference/documentation; no interaction beyond expand/collapse.
 */
export function RegexCheatsheet() {
  const t = useTranslations('tools.find-replace');

  return (
    <details className="group">
      <summary className="cursor-pointer px-3 py-2 rounded-lg bg-surface-muted hover:bg-surface-sunken font-medium text-sm text-text select-none">
        {t('cheatsheet.title')}
      </summary>

      <div className="mt-2 p-3 rounded-lg bg-surface border border-hairline space-y-4">
        <p className="text-xs text-text-secondary">{t('cheatsheet.hint')}</p>

        {CHEATSHEET.map((section) => (
          <div key={section.section} className="space-y-2">
            <h4 className="text-xs font-semibold text-text uppercase tracking-wide">
              {t(`cheatsheet.sections.${section.section}`)}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.token} className="flex gap-2 text-xs">
                  <code className="font-mono bg-surface-muted rounded px-2 py-1 text-brand min-w-fit">
                    {item.token}
                  </code>
                  <span className="text-text-secondary">
                    {t(item.descriptionKey)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
