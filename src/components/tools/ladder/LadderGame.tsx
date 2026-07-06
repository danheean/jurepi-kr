'use client';

import { useEffect, useRef } from 'react';
import { useLadder } from './useLadder';
import { LadderIntro } from './LadderIntro';
import { LadderSetup } from './LadderSetup';
import { PlayerHeader } from './PlayerHeader';
import { LadderBoard } from './LadderBoard';
import { PrizeCards } from './PrizeCards';
import { ResultPanel } from './ResultPanel';
import { LadderUseCases } from './LadderUseCases';
import { LadderHowTo } from './LadderHowTo';
import { LadderFaq } from './LadderFaq';
import { WinnerConfetti } from './WinnerConfetti';
import { MIN_COL, BOARD_MAX, traceDurationMs } from './ladderLayout';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';
import { playPop } from '@/lib/sound';
import { useTranslations, useLocale } from 'next-intl';

export function LadderGame() {
  const ladder = useLadder(5);
  const t = useTranslations('tools.ladder');
  const prevRevealedLengthRef = useRef(0);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (ladder.state.phase === 'setup') {
        if (e.key === 'Enter') {
          ladder.build();
        }
        return;
      }

      if (ladder.state.phase === 'ready' || ladder.state.phase === 'revealing') {
        // Number keys 1-9, 0 for column selection
        const num = parseInt(e.key);
        if (!isNaN(num) && num > 0 && num <= ladder.state.playerCount) {
          const playerIdx = num - 1;
          const player = ladder.state.players[playerIdx];
          if (player && !ladder.isRevealed(player.id) && ladder.canStartTrace()) {
            ladder.startTrace(player.id);
          }
        }

        // 'a' for reveal all
        if (e.key.toLowerCase() === 'a') {
          ladder.revealAll();
        }

        // 'r' for reshuffle
        if (e.key.toLowerCase() === 'r') {
          ladder.reshuffle();
        }

        // Esc to reset
        if (e.key === 'Escape') {
          ladder.reset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ladder]);

  // Play sound when a new player is revealed
  useEffect(() => {
    const currentLength = ladder.state.revealed.length;
    if (currentLength > prevRevealedLengthRef.current) {
      playPop(ladder.state.soundOn);
      prevRevealedLengthRef.current = currentLength;
    }
  }, [ladder.state.revealed.length, ladder.state.soundOn]);

  // Handle trace animation completion
  useEffect(() => {
    if (ladder.state.activeTrace) {
      const delayMs = ladder.prefers_reduced_motion
        ? 0
        : traceDurationMs(ladder.state.rungs.length, false);
      const timer = setTimeout(() => {
        ladder.completeReveal(ladder.state.activeTrace!);
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [ladder.state.activeTrace, ladder]);

  const locale = useLocale();
  const jsonLd = softwareApplicationJsonLd({
    name: t('title'),
    description: t('lead'),
    url: absoluteToolUrl(locale, 'ladder'),
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <LadderIntro />

      {/* Game board */}
      <div className="space-y-6 mb-12">
        {ladder.state.phase === 'setup' ? (
          <LadderSetup ladder={ladder} />
        ) : (
          <div className="relative">
            {/* Column-aligned track: chips sit above each rail's start,
                cards below each rail's end. Scrolls horizontally when narrow. */}
            <div className="overflow-x-auto">
              <div
                className="relative mx-auto"
                style={{
                  width: '100%',
                  minWidth: ladder.state.playerCount * MIN_COL,
                  maxWidth: BOARD_MAX,
                }}
              >
                <PlayerHeader ladder={ladder} />
                <LadderBoard ladder={ladder} />
                <PrizeCards ladder={ladder} />
              </div>
            </div>
            <ResultPanel ladder={ladder} />
            <WinnerConfetti
              active={ladder.state.phase === 'done'}
              reducedMotion={ladder.prefers_reduced_motion}
            />
          </div>
        )}
      </div>

      {/* SEO content */}
      <LadderUseCases />
      <LadderHowTo />
      <LadderFaq />

      {/* JSON-LD for software application */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
