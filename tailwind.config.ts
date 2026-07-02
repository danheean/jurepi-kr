import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        'brand-strong': 'var(--brand-strong)',
        'brand-soft': 'var(--brand-soft)',
        'on-brand': 'var(--on-brand)',
        'brand-ink': 'var(--brand-ink)',
        'brand-ink-strong': 'var(--brand-ink-strong)',
        'focus-ring': 'var(--focus-ring)',
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        'surface-sunken': 'var(--surface-sunken)',
        hairline: 'var(--hairline)',
        'hairline-strong': 'var(--hairline-strong)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-coral': 'var(--accent-coral)',
        'accent-coral-soft': 'var(--accent-coral-soft)',
        'accent-mint': 'var(--accent-mint)',
        'accent-mint-soft': 'var(--accent-mint-soft)',
        'accent-sky': 'var(--accent-sky)',
        'accent-sky-soft': 'var(--accent-sky-soft)',
        'accent-sun': 'var(--accent-sun)',
        'accent-sun-soft': 'var(--accent-sun-soft)',
        'accent-grape': 'var(--accent-grape)',
        'accent-grape-soft': 'var(--accent-grape-soft)',
        'accent-rose': 'var(--accent-rose)',
        'accent-rose-soft': 'var(--accent-rose-soft)',
        'accent-mint-ink': 'var(--accent-mint-ink)',
        'accent-sun-ink': 'var(--accent-sun-ink)',
        'accent-grape-ink': 'var(--accent-grape-ink)',
        'accent-rose-ink': 'var(--accent-rose-ink)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        'danger-ink': 'var(--danger-ink)',
        'warning-ink': 'var(--warning-ink)',
        info: 'var(--info)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        pop: 'var(--shadow-pop)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        xxl: 'var(--radius-xxl)',
        pill: 'var(--radius-pill)',
        full: 'var(--radius-full)',
      },
      spacing: {
        hair: 'var(--space-hair)',
        xxs: 'var(--space-xxs)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        ml: 'var(--space-ml)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        xxl: 'var(--space-xxl)',
        section: 'var(--space-section)',
      },
      transitionTimingFunction: {
        'ease-out': 'var(--ease-out)',
      },
      maxWidth: {
        container: '1120px',
      },
      fontFamily: {
        // Reference the CSS-var source of truth (tokens.css) so the utilities
        // track the actually-loaded faces — body resolves to 'Pretendard Variable'
        // via the @supports override, display to Gmarket Sans.
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      // Type scale from docs/DESIGN.md. Display sizes clamp for responsive headings
      // (max = the DESIGN px value); the rest are fixed rem per the product register.
      fontSize: {
        'display-xl': ['clamp(2rem, 6vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(1.75rem, 5vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        headline: ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.4px' }],
        'card-title': ['1.0625rem', { lineHeight: '1.3', letterSpacing: '-0.2px' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.55' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.8125rem', { lineHeight: '1.4' }],
        button: ['0.9375rem', { lineHeight: '1.2' }],
        eyebrow: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.6px' }],
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
