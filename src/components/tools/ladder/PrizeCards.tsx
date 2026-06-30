'use client';

import { useTranslations } from 'next-intl';
import { selectInversePermutation } from '@/lib/ladder-reducer';
import type { UseLadderReturn } from './useLadder';
import { colCenterPct } from './ladderLayout';

const ACCENT_COLORS = ['coral', 'mint', 'sky', 'sun', 'grape', 'rose'];

interface PrizeCardsProps {
  ladder: UseLadderReturn;
}

export function PrizeCards({ ladder }: PrizeCardsProps) {
  const t = useTranslations('tools.ladder');

  if (ladder.state.phase === 'setup') return null;

  const n = ladder.state.playerCount;
  // For each END column, which player's trace lands there — that player reveals
  // and colors this card, so chip → trace → card share one accent.
  const inverse = selectInversePermutation(ladder.state);

  return (
    <div
      className="relative w-full h-16 mt-1"
      role="region"
      aria-label="Prize cards"
    >
      {ladder.state.prizes.map((prize, col) => {
        const landingPlayerIdx = inverse[col] ?? col;
        const landingPlayer = ladder.state.players[landingPlayerIdx];
        const isRevealed = landingPlayer
          ? ladder.isRevealed(landingPlayer.id)
          : false;
        const accentColor =
          ACCENT_COLORS[landingPlayerIdx % ACCENT_COLORS.length];
        const hidden = ladder.state.hideResults && !isRevealed;

        // Cards stay visible as '?' placeholders below each rail end, then pop to the
        // result on reveal. (Reduced motion: no scale animation.)
        const scale = ladder.prefers_reduced_motion || !hidden ? 1 : 0.92;

        return (
          <div
            key={prize.id}
            data-testid="prize-card"
            className={`
              absolute top-1/2
              w-14 h-14 rounded-md font-button text-center
              flex items-center justify-center
              ${
                hidden
                  ? 'bg-surface-muted text-text-muted'
                  : `bg-accent-${accentColor}-soft text-text`
              }
            `}
            style={{
              left: `${colCenterPct(col, n)}%`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transition: ladder.prefers_reduced_motion
                ? 'none'
                : 'transform 300ms ease-out, background-color 300ms ease-out',
            }}
          >
            {hidden ? '?' : prize.label || t('defaults.prizeOther')}
          </div>
        );
      })}
    </div>
  );
}
