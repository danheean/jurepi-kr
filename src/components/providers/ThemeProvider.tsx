'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import {
  ThemePref,
  resolveTheme,
  isThemePref,
  DEFAULT_THEME_PREF,
} from '@/lib/theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  pref: ThemePref;
  resolved: Theme;
  setPref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider: manages theme preference and resolved theme state.
 * On mount, reads localStorage and sets document.documentElement.dataset.theme.
 * On pref change, persists to localStorage and updates DOM.
 */
export function ThemeProvider({ children }: { children: ReactNode }): React.ReactNode {
  const [pref, setPref] = useState<ThemePref>(DEFAULT_THEME_PREF);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    try {
      const stored = localStorage.getItem('jurepi-theme');
      if (stored && isThemePref(stored)) {
        setPref(stored);
      }
    } catch (e) {
      // localStorage unavailable (privacy mode, etc.) — use default
    }
    setIsMounted(true);
  }, []);

  // Resolve theme based on pref and system preference
  const systemPrefersDark =
    isMounted && typeof window !== 'undefined'
      ? matchMedia('(prefers-color-scheme:dark)').matches
      : false;
  const resolved = resolveTheme(pref, systemPrefersDark);

  const handleSetPref = (newPref: ThemePref) => {
    try {
      localStorage.setItem('jurepi-theme', newPref);
    } catch (e) {
      // localStorage unavailable — silently fail
    }
    // Update DOM immediately to prevent flash
    const newResolved = resolveTheme(
      newPref,
      systemPrefersDark
    );
    document.documentElement.dataset.theme = newResolved;
    setPref(newPref);
  };

  return (
    <ThemeContext.Provider value={{ pref, resolved, setPref: handleSetPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme: access theme context.
 * Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
