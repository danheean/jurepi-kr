import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { tools } from '@/tools/registry';
import { toSearchableTools } from '@/lib/searchable-tools';
import { ConsentReopenButton } from '@/components/consent/ConsentReopenButton';

const FOOTER_CATEGORIES = ['random', 'calculator', 'text', 'converter', 'fun', 'mindset'] as const;

export async function Footer(): Promise<React.ReactNode> {
  const t = await getTranslations();

  // Get live tools grouped by category
  const liveTools = toSearchableTools(tools, t).filter((x) => x.status === 'live');
  const toolsByCategory = new Map<string, typeof liveTools>();

  for (const category of FOOTER_CATEGORIES) {
    toolsByCategory.set(
      category,
      liveTools.filter((tool) => tool.category === category)
    );
  }

  const legalLinks = [
    { label: t('footer.about'), href: '/about' },
    { label: t('footer.privacy'), href: '/privacy' },
    { label: t('footer.terms'), href: '/terms' },
    { label: t('footer.contact'), href: '/contact' },
  ];

  return (
    <footer className="bg-surface-muted">
      <div className="max-w-container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Top section: wordmark only (no tagline) */}
        <div className="mb-12">
          <h2 className="font-display text-lg font-bold text-brand-ink">Jurepi</h2>
        </div>

        {/* Category grid with live tools */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {FOOTER_CATEGORIES.map((category) => {
            const categoryTools = toolsByCategory.get(category) || [];
            return (
              <div key={category}>
                <h3 className="text-caption font-bold text-text uppercase tracking-wider mb-4">
                  {t(`categories.${category}`)}
                </h3>
                {categoryTools.length > 0 ? (
                  <ul className="space-y-2">
                    {categoryTools.map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="text-body-sm text-text-secondary hover:text-brand-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded"
                        >
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legal links + consent — one row, divided from the tool grid above */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline pt-8 mb-8">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm text-text-secondary hover:text-brand-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded"
            >
              {link.label}
            </Link>
          ))}
          <div className="w-full sm:w-auto sm:ml-auto">
            <ConsentReopenButton />
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-hairline pt-6 text-caption text-text-muted text-center">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
