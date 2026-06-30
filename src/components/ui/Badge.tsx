'use client';

import { ReactNode, HTMLAttributes } from 'react';

type BadgeVariant = 'new' | 'popular' | 'soon';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

// Text colors are dark "ink" shades of each accent (not the saturated value) so
// labels clear WCAG AA on their *-soft background; soft bg keeps the accent identity.
const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-accent-mint-soft text-accent-mint-ink',
  popular: 'bg-accent-sun-soft text-accent-sun-ink',
  soon: 'bg-surface-muted text-text-secondary',
};

export function Badge({ children, variant = 'new', ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-block px-2 py-1 rounded-full font-eyebrow
        ${variantClasses[variant]}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
