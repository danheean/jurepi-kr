import React from 'react';

interface IconButtonProps {
  /** lucide-react icon component or element. */
  icon: React.ReactNode;
  /** Aria-label for accessibility. */
  ariaLabel: string;
  /** Click handler. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Tailwind size: 'sm' (32px), 'md' (40px), 'lg' (48px); default 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Variant: 'ghost' (transparent), 'secondary' (surface-muted); default 'ghost'. */
  variant?: 'ghost' | 'secondary';
  /** Optional CSS class override. */
  className?: string;
  /** Optional test ID for E2E. */
  testId?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const variantClasses = {
  ghost: 'bg-transparent hover:bg-surface-muted/50',
  secondary: 'bg-surface-muted hover:bg-surface-sunken',
};

export function IconButton({
  icon,
  ariaLabel,
  onClick,
  size = 'md',
  variant = 'ghost',
  className,
  testId,
}: IconButtonProps): React.ReactNode {
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      data-testid={testId}
      className={`
        inline-flex items-center justify-center
        ${sizeClass}
        ${variantClass}
        rounded-lg
        transition-all duration-150
        hover:-translate-y-0.5 hover:shadow-card
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
        motion-safe:hover:-translate-y-0.5
        motion-safe:active:scale-95
        ${className || ''}
      `}
    >
      {icon}
    </button>
  );
}
