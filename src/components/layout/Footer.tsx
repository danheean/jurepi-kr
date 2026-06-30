import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function Footer(): Promise<React.ReactNode> {
  const t = await getTranslations();

  const links = [
    { label: t('footer.about'), href: '/about' },
    { label: t('footer.privacy'), href: '/privacy' },
    { label: t('footer.terms'), href: '/terms' },
    { label: t('footer.contact'), href: '/contact' },
  ];

  return (
    <footer className="bg-surface-muted">
      <div className="max-w-container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Top section: wordmark + tagline */}
        <div className="mb-8 sm:mb-12">
          <h2 className="font-display text-lg font-bold text-brand mb-2">Jurepi</h2>
          <p className="text-body-sm text-text-secondary">{t('footer.tagline')}</p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm text-text-secondary hover:text-brand transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <div className="border-t border-hairline pt-6 text-caption text-text-muted text-center">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
