'use client';

import { useMemo } from 'react';
import { ballColor } from '@/lib/lotto-generator/colors';
import type { AnimationPhase } from './useLottoGenerator';

interface BallDisplayProps {
  number: number;
  index: number;
  isAnimating: boolean;
  animationPhase: AnimationPhase;
}

const CANDIDATE_FLIP_MS = 50;
const ROLL_DURATION_MS = 500;
const BALL_POP_DURATION_MS = 150;
const STAGGER_MS = 100;

export function BallDisplay({
  number,
  index,
  isAnimating,
  animationPhase,
}: BallDisplayProps) {
  const color = ballColor(number);
  const ariaLabel = `Ball ${number}`;

  // During rolling phase: cycle through candidate numbers
  const displayNumber = useMemo(() => {
    if (animationPhase !== 'rolling' || !isAnimating) {
      return number;
    }
    // Cycle candidates during roll
    const rollStartMs = index * STAGGER_MS;
    const now = Date.now();
    const elapsed = now % (ROLL_DURATION_MS + rollStartMs);
    if (elapsed < rollStartMs) {
      return number;
    }
    const rollElapsed = elapsed - rollStartMs;
    const totalCandidates = 45; // Could be optimized with cached candidates
    const cycleIndex = Math.floor(rollElapsed / CANDIDATE_FLIP_MS) % totalCandidates;
    return ((cycleIndex % 45) + 1);
  }, [number, index, animationPhase, isAnimating]);

  // Pop animation: scale 0→1, opacity 0→1
  const lockStartMs = (6 - 1) * STAGGER_MS + ROLL_DURATION_MS + index * (BALL_POP_DURATION_MS + STAGGER_MS);
  const isPoppingRight = animationPhase === 'locking';

  const popScale = useMemo(() => {
    if (!isPoppingRight) return 1;
    const now = Date.now();
    const elapsed = (now - lockStartMs) % (BALL_POP_DURATION_MS + STAGGER_MS);
    if (elapsed < 0 || elapsed > BALL_POP_DURATION_MS) return 1;
    return elapsed / BALL_POP_DURATION_MS;
  }, [isPoppingRight, lockStartMs]);

  const popOpacity = popScale;

  // Prefer reduced motion: skip animations
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animStyle = prefersReducedMotion
    ? {}
    : {
        transform: `scale(${popOpacity})`,
        opacity: popOpacity,
        transition: animationPhase === 'locking' ? `all ${BALL_POP_DURATION_MS}ms ease-out` : 'none',
      };

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`
        flex items-center justify-center
        w-11 h-11 rounded-full
        font-bold text-sm
        ${color.bgClass} ${color.textClass}
        transition-none
      `}
      style={animStyle}
    >
      {displayNumber}
    </div>
  );
}
