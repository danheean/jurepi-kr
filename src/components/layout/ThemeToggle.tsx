'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/providers/ThemeProvider';
import { IconButton } from '@/components/ui/IconButton';

export function ThemeToggle(): React.ReactNode {
  const t = useTranslations();
  const { pref, setPref } = useTheme();

  const handleToggle = () => {
    // Cycle: light → dark → system → light
    const nextPref = pref === 'light' ? 'dark' : pref === 'dark' ? 'system' : 'light';
    setPref(nextPref);
  };

  // Show icon based on PREFERENCE (what the user selected), not resolved theme
  const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor;

  // Compose dynamic aria-label from existing keys
  const stateLabel = pref === 'light' ? t('header.themeLight') : pref === 'dark' ? t('header.themeDark') : t('header.themeSystem');
  const ariaLabel = `${t('header.themeToggleAria')} (${stateLabel})`;

  return (
    <IconButton
      icon={<Icon className="w-5 h-5" strokeWidth={1.75} />}
      ariaLabel={ariaLabel}
      onClick={handleToggle}
      size="md"
      variant="ghost"
      testId="theme-toggle"
    />
  );
}
