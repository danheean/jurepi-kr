'use client';

import { useTranslations } from 'next-intl';
import type { UseLadderReturn } from './useLadder';
import { colCenterPct } from './ladderLayout';

const ACCENT_COLORS = ['coral', 'mint', 'sky', 'sun', 'grape', 'rose'];

interface PlayerHeaderProps {
  ladder: UseLadderReturn;
}

export function PlayerHeader({ ladder }: PlayerHeaderProps) {
  const t = useTranslations('tools.ladder');

  if (ladder.state.phase === 'setup') return null;

  const n = ladder.state.playerCount;

  return (
    <div
      className="relative w-full h-12 mb-1"
      role="region"
      aria-label="Player selection"
    >
      {ladder.state.players.map((player, idx) => {
        const isRevealed = ladder.isRevealed(player.id);
        const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
        const canClick =
          ladder.canStartTrace() && ladder.state.phase !== 'done';
        const label = player.name || `${t('defaults.player', { n: idx + 1 })}`;

        return (
          <button
            key={player.id}
            data-testid="player-chip"
            onClick={() => {
              if (canClick && !isRevealed) {
                ladder.startTrace(player.id);
              }
            }}
            disabled={!canClick || isRevealed}
            title={label}
            aria-label={t('header.revealAria', { name: label })}
            style={{
              left: `${colCenterPct(idx, n)}%`,
              maxWidth: `calc(${100 / n}% - 6px)`,
            }}
            className={`
              absolute top-1/2 -translate-x-1/2 -translate-y-1/2
              min-h-[44px] px-2 py-2 rounded-full font-button text-sm
              truncate text-center
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring
              ${
                isRevealed
                  ? `bg-accent-${accentColor}-soft border-2 border-accent-${accentColor} text-text`
                  : `bg-accent-${accentColor}-soft text-text hover:shadow-card disabled:opacity-50`
              }
              ${canClick && !isRevealed ? 'cursor-pointer active:scale-95' : ''}
            `}
          >
            {label}
            {isRevealed && ' ✓'}
          </button>
        );
      })}
    </div>
  );
}
