'use client';

/**
 * Inline script to bootstrap theme before first paint.
 * Prevents flash of unstyled content (FOUC) on page load.
 * Reads localStorage and sets document.documentElement.dataset.theme synchronously.
 */
export function ThemeBootstrap(): React.ReactNode {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            const pref = localStorage.getItem('jurepi-theme') || 'light';
            const isDark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
            document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
          } catch (e) {}
        `,
      }}
    />
  );
}
