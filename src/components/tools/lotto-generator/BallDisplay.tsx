'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ballColor } from '@/lib/lotto-generator/colors';
import { LOTTO_MAX } from '@/lib/lotto-generator/schema';
import type { AnimationPhase } from './useLottoGenerator';

interface BallDisplayProps {
  number: number;
  index: number;
  isAnimating: boolean;
  animationPhase: AnimationPhase;
  /**
   * Accessible label (e.g. "번호 25" / "보너스 번호 25"). Required — a
   * previous English-only fallback here meant every ball on the ko page
   * announced "Ball N" to screen readers; callers must supply a localized
   * label instead of relying on a default.
   */
  label: string;
}

const CANDIDATE_FLIP_MS = 50;
const STAGGER_MS = 100;
const BALL_POP_DURATION_MS = 150;

export function BallDisplay({
  number,
  index,
  isAnimating,
  animationPhase,
  label,
}: BallDisplayProps) {
  const color = ballColor(number);

  // Mount-safe reduced-motion read. Reading `matchMedia` directly in render
  // (previous approach) made the inline `style` attribute diverge between the
  // SSR pass (window undefined → false) and the client (real OS preference),
  // triggering a React #418 hydration mismatch for reduced-motion users. The
  // shared hook returns `false` on the server and first client render, then
  // syncs in an effect, so hydration always matches.
  const prefersReducedMotion = useReducedMotion();

  const isRolling = animationPhase === 'rolling' && isAnimating && !prefersReducedMotion;
  const isLocking = animationPhase === 'locking' && !prefersReducedMotion;

  // Cycle through candidate numbers during the rolling phase. Driven by a
  // real interval tied to component state — not wall-clock modulo math,
  // which froze the display for the whole window (nothing re-rendered the
  // component between phase changes, so the "cycling" number was computed
  // once and never updated).
  const [rollTicks, setRollTicks] = useState(0);
  useEffect(() => {
    if (!isRolling) {
      setRollTicks(0);
      return;
    }
    const id = setInterval(() => setRollTicks((t) => t + 1), CANDIDATE_FLIP_MS);
    return () => clearInterval(id);
  }, [isRolling]);

  let displayNumber = number;
  if (isRolling) {
    const rollStartTicks = Math.round((index * STAGGER_MS) / CANDIDATE_FLIP_MS);
    if (rollTicks >= rollStartTicks) {
      displayNumber = ((rollTicks - rollStartTicks) % LOTTO_MAX) + 1;
    }
  }

  // Pop reveal during the locking phase: each ball flips from hidden to
  // visible after its own staggered delay, then the CSS transition below
  // handles the smooth 0→1 interpolation — no manual JS easing needed
  // (the previous version tried to compute a continuous progress value
  // from an unanchored elapsed-time calculation, which produced a random
  // frozen fraction instead of an actual pop).
  const [hasPopped, setHasPopped] = useState(false);
  useEffect(() => {
    if (!isLocking) {
      setHasPopped(false);
      return;
    }
    const ballLockStartMs = index * (BALL_POP_DURATION_MS + STAGGER_MS);
    const timeoutId = setTimeout(() => setHasPopped(true), ballLockStartMs);
    return () => clearTimeout(timeoutId);
  }, [isLocking, index]);

  const popValue = isLocking ? (hasPopped ? 1 : 0) : 1;

  const animStyle = prefersReducedMotion
    ? {}
    : {
        transform: `scale(${popValue})`,
        opacity: popValue,
        transition: isLocking ? `all ${BALL_POP_DURATION_MS}ms ease-out` : 'none',
      };

  return (
    <div
      role="img"
      aria-label={label}
      className="flex items-center justify-center w-11 h-11 rounded-full font-bold text-sm transition-none"
      style={{ backgroundColor: color.background, color: color.color, ...animStyle }}
    >
      {displayNumber}
    </div>
  );
}
