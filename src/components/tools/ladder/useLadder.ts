'use client';

import { useReducer, useCallback, useEffect, useState } from 'react';
import {
  initLadderState,
  ladderReducer,
  type LadderState,
  type LadderAction,
  type LadderTension,
} from '@/lib/ladder-reducer';

export interface UseLadderReturn {
  state: LadderState;
  dispatch: (action: LadderAction) => void;
  // Convenient dispatchers
  setCount: (count: number) => void;
  setPlayerName: (index: number, name: string) => void;
  setPrizeLable: (index: number, label: string) => void;
  setAllPlayerNames: (names: string[]) => void;
  setAllPrizeLabels: (labels: string[]) => void;
  toggleShuffle: () => void;
  toggleSound: () => void;
  setTension: (tension: LadderTension) => void;
  build: () => void;
  startTrace: (playerId: string) => void;
  completeReveal: (playerId: string) => void;
  revealAll: () => void;
  reshuffle: () => void;
  reset: () => void;
  // Derived state
  isRevealed: (playerId: string) => boolean;
  canStartTrace: () => boolean;
  isAnimating: boolean;
  prefers_reduced_motion: boolean;
}

export function useLadder(initialCount: number = 5): UseLadderReturn {
  const [state, dispatch] = useReducer(
    ladderReducer,
    initialCount,
    initLadderState
  );

  // Detect prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Convenient dispatchers
  const setCount = useCallback(
    (count: number) => dispatch({ type: 'SET_COUNT', count }),
    []
  );

  const setPlayerName = useCallback(
    (index: number, name: string) =>
      dispatch({ type: 'SET_PLAYER_NAME', index, name }),
    []
  );

  const setPrizeLable = useCallback(
    (index: number, label: string) =>
      dispatch({ type: 'SET_PRIZE_LABEL', index, label }),
    []
  );

  const setAllPlayerNames = useCallback(
    (names: string[]) =>
      dispatch({ type: 'SET_ALL_PLAYER_NAMES', names }),
    []
  );

  const setAllPrizeLabels = useCallback(
    (labels: string[]) =>
      dispatch({ type: 'SET_ALL_PRIZE_LABELS', labels }),
    []
  );

  const toggleShuffle = useCallback(
    () => dispatch({ type: 'TOGGLE_SHUFFLE' }),
    []
  );

  const toggleSound = useCallback(
    () => dispatch({ type: 'TOGGLE_SOUND' }),
    []
  );

  const setTension = useCallback(
    (tension: LadderTension) => dispatch({ type: 'SET_TENSION', tension }),
    []
  );

  const build = useCallback(() => dispatch({ type: 'BUILD' }), []);

  const startTrace = useCallback(
    (playerId: string) => dispatch({ type: 'START_TRACE', playerId }),
    []
  );

  const completeReveal = useCallback(
    (playerId: string) => dispatch({ type: 'COMPLETE_REVEAL', playerId }),
    []
  );

  const revealAll = useCallback(
    () => dispatch({ type: 'REVEAL_ALL' }),
    []
  );

  const reshuffle = useCallback(
    () => dispatch({ type: 'RESHUFFLE' }),
    []
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Derived helpers
  const isRevealed = useCallback(
    (playerId: string) => state.revealed.includes(playerId),
    [state.revealed]
  );

  const canStartTrace = useCallback(
    () => state.activeTrace === null && state.phase !== 'setup',
    [state.activeTrace, state.phase]
  );

  return {
    state,
    dispatch,
    setCount,
    setPlayerName,
    setPrizeLable,
    setAllPlayerNames,
    setAllPrizeLabels,
    toggleShuffle,
    toggleSound,
    setTension,
    build,
    startTrace,
    completeReveal,
    revealAll,
    reshuffle,
    reset,
    isRevealed,
    canStartTrace,
    isAnimating: state.activeTrace !== null,
    prefers_reduced_motion: prefersReducedMotion,
  };
}
