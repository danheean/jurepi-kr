import { useTranslations } from 'next-intl';

export function Disclaimer() {
  const t = useTranslations('tools.dev-people.spoke');

  return (
    <footer className="mt-12 pt-8 border-t border-hairline">
      <p className="text-sm text-text-secondary text-center">
        {t('disclaimer')}
      </p>
    </footer>
  );
}
