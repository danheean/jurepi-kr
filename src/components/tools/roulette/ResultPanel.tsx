'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { Option } from '@/lib/roulette/schema';
import { spawnConfetti } from './confetti';

export interface ResultPanelProps {
  selectedIndex: number | null;
  options: Option[];
  spinning: boolean;
  showRemoveOption: boolean;
  onSpin: () => void;
  onRemoveAndSpin: () => void;
  prefersReducedMotion: boolean;
}

export function ResultPanel({
  selectedIndex,
  options,
  spinning,
  showRemoveOption,
  onSpin,
  onRemoveAndSpin,
  prefersReducedMotion,
}: ResultPanelProps) {
  const t = useTranslations('tools.roulette');
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger confetti when winner is revealed
  useEffect(() => {
    if (selectedIndex !== null && !spinning && containerRef.current) {
      spawnConfetti(containerRef.current, {
        count: 50,
        duration: 1500,
      });
    }
  }, [selectedIndex, spinning]);

  const winner = selectedIndex !== null ? options[selectedIndex] : null;

  if (!winner) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-testid="roulette-result-panel"
      className="relative mt-8 p-6 bg-surface-muted border border-hairline rounded-lg space-y-4"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        {t('announce.result', { name: winner.label })}
      </div>

      {/* Eyebrow */}
      <div className="text-sm font-semibold text-brand uppercase tracking-wide">
        {t('result.eyebrow')}
      </div>

      {/* Winner name */}
      <h3 className="text-3xl font-bold text-text" data-testid="roulette-result-name">
        {winner.label}
      </h3>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onSpin}
          data-testid="roulette-spin-again-btn"
          disabled={spinning}
          className="flex-1 px-4 py-2 bg-brand text-on-brand rounded-lg font-semibold disabled:opacity-50 hover:enabled:scale-105 transition-transform"
        >
          {t('result.spinAgain')}
        </button>

        {showRemoveOption && (
          <button
            onClick={onRemoveAndSpin}
            data-testid="roulette-remove-and-spin-btn"
            disabled={spinning || options.length <= 1}
            className="flex-1 px-4 py-2 border border-brand text-brand rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-brand hover:enabled:text-on-brand transition-colors"
          >
            {t('result.removeAndSpin')}
          </button>
        )}
      </div>
    </div>
  );
}
