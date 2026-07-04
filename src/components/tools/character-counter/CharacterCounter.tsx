'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCharacterCounter } from './useCharacterCounter';
import { CounterMetrics } from './CounterMetrics';
import { LimitIndicator } from './LimitIndicator';
import { CopyButton } from './CopyButton';
import { ClearButton } from './ClearButton';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Main character counter orchestrator (Client Component).
 * Manages textarea input, metrics display, limit presets, copy/clear actions.
 * All localStorage-dependent interactive parts are here (not gated on mounted).
 * SEO sections (Intro/HowTo/Faq) are rendered separately in the route (outside mounted gate).
 */
export function CharacterCounter() {
  const t = useTranslations('tools.character-counter');
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  const { text, metrics, limit, customLimitInput, isLoading, setText, setLimit, setCustomLimitInput, clearText, copyText, copyMetrics } = useCharacterCounter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return null;
  }

  const hintText = t('hint', {
    chars: metrics.charactersWithSpaces,
    noSpace: metrics.charactersWithoutSpaces,
  });

  return (
    <div className="space-y-8">
      {/* Textarea Section */}
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('textarea.placeholder')}
          aria-label={t('textarea.ariaLabel')}
          className="w-full min-h-72 max-h-96 p-4 rounded-lg border border-hairline bg-surface text-text placeholder-text-secondary resize-vertical focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand font-mono"
        />
        <div className="text-sm text-text-secondary">{hintText}</div>
      </div>

      {/* Main Layout: Textarea left, Metrics sidebar right (desktop) / Stacked (mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Empty space on desktop for visual balance (textarea above) */}
        <div className="lg:col-span-1" />

        {/* Right: Metrics & Controls Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Limit Indicator */}
          <LimitIndicator
            limit={limit}
            currentCount={metrics.charactersWithSpaces}
            customInput={customLimitInput}
            onLimitChange={setLimit}
            onCustomInputChange={setCustomLimitInput}
          />

          {/* Metrics Card */}
          <CounterMetrics metrics={metrics} />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <CopyButton
              onClick={copyText}
              labelKey="button.copyText"
            />
            <CopyButton
              onClick={copyMetrics}
              labelKey="button.copyStats"
            />
            <ClearButton onClick={clearText} />
          </div>
        </div>
      </div>
    </div>
  );
}
