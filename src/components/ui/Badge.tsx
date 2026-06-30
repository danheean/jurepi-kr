'use client';

import { ReactNode, HTMLAttributes } from 'react';

type BadgeVariant = 'new' | 'popular' | 'soon';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  new: 'bg-accent-mint-soft text-accent-mint',
  popular: 'bg-accent-sun-soft text-semantic-warning',
  soon: 'bg-surface-muted text-text-muted',
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
