'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { SearchableTool } from '@/lib/tool-search';
import { HeaderSearch } from './HeaderSearch';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  tools: SearchableTool[];
}

// Sibling Jurepi property — AI tools live on their own subdomain, mirroring the
// same locale routing (ko/en), so link to the current locale.
const AI_TOOLS_BASE = 'https://ai.jurepi.kr';

const WORDMARK_CLASS =
  'font-display text-xl font-bold text-brand-ink hover:text-brand-ink-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 rounded-lg';

// The AI-tools link intentionally uses Pinterest's brand red (#e60023) to
// signal it leads to a distinct sibling product, set apart from Jurepi's honey
// brand color.
const AI_LINK_CLASS =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#e60023] hover:text-[#ad081b] hover:bg-[#e60023]/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 whitespace-nowrap';

// Full label ("AI 무료도구") crowds the 320px header alongside search + locale +
// theme controls, so a compact "AI" chip stands in below the `sm` breakpoint.
const AI_LINK_SHORT = 'AI';

export function Header({ tools }: HeaderProps): React.ReactNode {
  const t = useTranslations('header');
  const locale = useLocale();
  const aiToolsUrl = `${AI_TOOLS_BASE}/${locale}`;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-40
        h-16 flex items-center
        bg-surface border-b border-hairline
        transition-all duration-200
        ${isScrolled ? 'bg-surface/80 backdrop-blur-md' : ''}
      `}
    >
      <nav
        aria-label="Main navigation"
        className="w-full h-full flex items-center justify-between px-3 sm:px-6 max-w-container mx-auto"
      >
        {/* Left: Wordmark (home) + sibling "AI tools" property link */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/" className={WORDMARK_CLASS}>
            Jurepi
          </Link>
          <a
            href={aiToolsUrl}
            className={AI_LINK_CLASS}
            aria-label={t('aiToolsAria')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Sparkles className="hidden h-3.5 w-3.5 sm:inline-block" aria-hidden="true" />
            <span className="sm:hidden">{AI_LINK_SHORT}</span>
            <span className="hidden sm:inline">{t('aiTools')}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Global search combobox */}
          <HeaderSearch tools={tools} />

          {/* Locale switcher */}
          <LocaleSwitcher />

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
