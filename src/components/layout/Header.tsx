'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import type { SearchableTool } from '@/lib/tool-search';
import { HeaderSearch } from './HeaderSearch';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  tools: SearchableTool[];
}

export function Header({ tools }: HeaderProps): React.ReactNode {
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
        className="w-full h-full flex items-center justify-between px-4 sm:px-6 max-w-container mx-auto"
      >
        {/* Left: Wordmark */}
        <Link
          href="/"
          className="font-display text-xl font-bold text-brand hover:text-brand-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-lg"
        >
          Jurepi
        </Link>

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
