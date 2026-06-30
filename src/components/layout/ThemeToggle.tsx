'use client';

import { Sun, Moon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/providers/ThemeProvider';
import { IconButton } from '@/components/ui/IconButton';

export function ThemeToggle(): React.ReactNode {
  const t = useTranslations();
  const { pref, resolved, setPref } = useTheme();

  const handleToggle = () => {
    // Cycle: light → dark → system → light
    const nextPref = pref === 'light' ? 'dark' : pref === 'dark' ? 'system' : 'light';
    setPref(nextPref);
  };

  // Show icon based on RESOLVED theme (what the user sees now), not preference
  const Icon = resolved === 'dark' ? Sun : Moon;

  return (
    <IconButton
      icon={<Icon className="w-5 h-5" strokeWidth={1.75} />}
      ariaLabel={t('header.themeToggleAria')}
      onClick={handleToggle}
      size="md"
      variant="ghost"
      testId="theme-toggle"
    />
  );
}
