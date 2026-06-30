'use client';

import { HeroMascot } from '@/components/home/HeroMascot';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  heading: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  showMascot?: boolean;
  testId?: string;
}

/**
 * EmptyState: centered layout with mascot, heading, body, and action button.
 * Reused by tool grid, 404, and other empty screens.
 */
export function EmptyState({
  heading,
  body,
  actionLabel,
  onAction,
  showMascot = true,
  testId,
}: EmptyStateProps): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      {showMascot && (
        <div className="mb-8">
          <HeroMascot size={120} priority={false} />
        </div>
      )}

      <h2 className="font-display text-2xl font-bold text-text mb-4 text-center">
        {heading}
      </h2>

      <p className="text-center text-text-secondary mb-8 max-w-[24rem]">
        {body}
      </p>

      <Button
        onClick={onAction}
        variant="primary"
        data-testid={testId ? `${testId}-action` : undefined}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
