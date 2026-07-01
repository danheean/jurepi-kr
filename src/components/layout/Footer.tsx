import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { tools } from '@/tools/registry';
import { toSearchableTools } from '@/lib/searchable-tools';
import { ConsentReopenButton } from '@/components/consent/ConsentReopenButton';

const FOOTER_CATEGORIES = ['random', 'calculator', 'text', 'converter', 'fun', 'mindset'] as const;

/** Public source repository — fixed, non-secret project fact. */
const REPO_URL = 'https://github.com/danheean/Jurepi-kr';

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
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('footer.sourceAria')}
            className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-brand-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            {t('footer.source')}
          </a>
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
