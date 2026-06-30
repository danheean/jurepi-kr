'use client';

import { useTranslations } from 'next-intl';
import { tracePath } from '@/lib/ladder';
import type { UseLadderReturn } from './useLadder';
import { COLUMN_WIDTH, LEVEL_HEIGHT, PADDING } from './ladderLayout';

const ACCENT_COLORS = [
  'coral',
  'mint',
  'sky',
  'sun',
  'grape',
  'rose',
];

interface LadderBoardProps {
  ladder: UseLadderReturn;
  onTraceComplete?: (playerId: string) => void;
}

export function LadderBoard({ ladder, onTraceComplete }: LadderBoardProps) {
  const t = useTranslations('tools.ladder');

  if (ladder.state.phase === 'setup') return null;

  const { playerCount, rungs, permutation } = ladder.state;
  const numLevels = rungs.length || 5;
  const columnWidth = COLUMN_WIDTH;
  const levelHeight = LEVEL_HEIGHT;
  const padding = PADDING;

  // SVG dimensions (add extra levelHeight for the floor)
  const svgWidth = padding * 2 + columnWidth * (playerCount - 1);
  const svgHeight = padding * 2 + levelHeight * (numLevels + 1);

  // Build an orthogonal (Manhattan) path that overlays the rails and rungs:
  // go straight down a rail, then horizontally across a rung, then down again —
  // never diagonally. Each column change emits a vertical drop to the rung's Y
  // followed by a horizontal segment along that rung.
  const buildPathString = (pathPoints: Array<{ col: number; level: number }>) => {
    if (pathPoints.length === 0) return '';

    const xOf = (col: number) => padding + col * columnWidth;
    const yOf = (level: number) => padding + level * levelHeight;
    const floorY = padding + levelHeight * (numLevels + 1);

    let d = `M ${xOf(pathPoints[0].col)} ${yOf(pathPoints[0].level)}`;
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1];
      const cur = pathPoints[i];
      if (prev.col !== cur.col) {
        // Down the current rail to the rung's Y, then across the rung.
        d += ` L ${xOf(prev.col)} ${yOf(cur.level)}`;
        d += ` L ${xOf(cur.col)} ${yOf(cur.level)}`;
      } else {
        // Straight down.
        d += ` L ${xOf(cur.col)} ${yOf(cur.level)}`;
      }
    }

    // Extend straight down to the floor.
    const last = pathPoints[pathPoints.length - 1];
    return `${d} L ${xOf(last.col)} ${floorY}`;
  };

  // Get active trace path
  const activePlayerPath = ladder.state.activeTrace
    ? tracePath(rungs, ladder.state.players.findIndex(
        (p) => p.id === ladder.state.activeTrace
      ))
    : [];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={t('board.aria')}
        data-testid="ladder-board"
        className="border border-hairline rounded-lg bg-surface"
      >
        {/* Vertical lines (players) */}
        {Array.from({ length: playerCount }).map((_, col) => (
          <line
            key={`col-${col}`}
            x1={padding + col * columnWidth}
            y1={padding}
            x2={padding + col * columnWidth}
            y2={padding + levelHeight * (numLevels + 1)}
            stroke="var(--hairline-strong)"
            strokeWidth="3"
            strokeLinecap="round"
            aria-hidden="true"
          />
        ))}

        {/* Horizontal rungs */}
        {rungs.map((level, levelIdx) =>
          level.map((hasRung, col) => {
            if (!hasRung) return null;
            return (
              <line
                key={`rung-${levelIdx}-${col}`}
                x1={padding + col * columnWidth}
                y1={padding + (levelIdx + 1) * levelHeight}
                x2={padding + (col + 1) * columnWidth}
                y2={padding + (levelIdx + 1) * levelHeight}
                stroke="var(--hairline-strong)"
                strokeWidth="3"
                strokeLinecap="round"
                aria-hidden="true"
              />
            );
          })
        )}

        {/* Persistent trace paths for revealed players */}
        {ladder.state.revealed.map((playerId) => {
          // Skip if this is the active trace (render separately below)
          if (playerId === ladder.state.activeTrace) return null;

          const playerIdx = ladder.state.players.findIndex(
            (p) => p.id === playerId
          );
          const revealedPath = tracePath(rungs, playerIdx);

          return (
            <path
              key={`path-revealed-${playerId}`}
              d={buildPathString(revealedPath)}
              stroke={`var(--accent-${
                ACCENT_COLORS[playerIdx % ACCENT_COLORS.length]
              })`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0"
              aria-hidden="true"
            />
          );
        })}

        {/* Animated trace path for active trace */}
        {ladder.state.activeTrace &&
          activePlayerPath.length > 0 && (
            <path
              d={buildPathString(activePlayerPath)}
              stroke={`var(--accent-${
                ACCENT_COLORS[
                  ladder.state.players.findIndex(
                    (p) => p.id === ladder.state.activeTrace
                  ) % ACCENT_COLORS.length
                ]
              })`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: ladder.prefers_reduced_motion ? 0 : 1,
                animation: ladder.prefers_reduced_motion
                  ? 'none'
                  : 'strokeDraw 280ms ease-out forwards',
              }}
            />
          )}

        {/* Define animation */}
        <defs>
          <style>{`
            @keyframes strokeDraw {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        </defs>
      </svg>
    </div>
  );
}
