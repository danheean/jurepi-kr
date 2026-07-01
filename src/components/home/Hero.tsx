import { getTranslations } from 'next-intl/server';
import { HeroMascot } from './HeroMascot';

/**
 * Hero: static server component — eyebrow, headline, subhead, and the mascot
 * companion. No interactive search (that lives in ToolExplorer below it).
 * Decorative low-opacity accent blobs sit behind, pointer-events none, static
 * (no motion) so they never distract or shift layout.
 */
export async function Hero(): Promise<React.ReactNode> {
  const t = await getTranslations('home');

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-surface px-6 pt-20 pb-16 md:px-8 md:pt-24 md:pb-20 lg:px-12"
    >
      {/* Decorative accent blobs (static, identity-only, never CTA) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-12 -z-10 h-64 w-64 rounded-full bg-accent-coral opacity-[0.10] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 right-0 -z-10 h-80 w-80 rounded-full bg-accent-mint opacity-[0.08] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-1/4 -z-10 h-72 w-72 rounded-full bg-accent-grape opacity-[0.07] blur-2xl"
      />

      <div className="mx-auto max-w-container">
        <div className="flex flex-col-reverse items-center justify-between gap-12 md:flex-row md:gap-20">
          <div className="flex-1 text-center md:text-left">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-brand-ink">
              {t('eyebrow')}
            </p>
            <h1
              id="hero-heading"
              className="mb-6 font-display text-[clamp(2rem,6vw,3.5rem)] font-bold leading-[1.1] text-text"
            >
              {t('headline')}
            </h1>
            <p className="mx-auto max-w-[540px] text-lg leading-relaxed text-text-secondary md:mx-0">
              {t('subhead')}
            </p>
          </div>

          <div className="flex-shrink-0">
            <HeroMascot
              greeting={t('mascotGreeting')}
              size={156}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
