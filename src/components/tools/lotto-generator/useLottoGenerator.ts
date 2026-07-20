import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BALL_POP_DURATION_MS,
  BALL_STAGGER_MS,
  EXCLUDED_MAX,
  FIXED_MAX,
  GAME_COUNT_MAX,
  GAME_COUNT_MIN,
  HISTORY_MAX,
  LOTTO_MAX,
  LOTTO_MIN,
  NUMBERS_PER_GAME,
  STORAGE_KEY,
  parseStore,
} from '@/lib/lotto-generator/schema';
import {
  addHistory,
  clearHistory,
  pruneUnknown,
} from '@/lib/lotto-generator/history';
import { fairDrawGames } from '@/lib/lotto-generator/random';
import type {
  Draw,
  DrawResult,
  HistoryEntry,
  Settings,
} from '@/lib/lotto-generator/schema';

const ROLL_DURATION_MS = 500;
const LOCK_DURATION_MS = 150;

export type AnimationPhase = 'idle' | 'rolling' | 'locking' | 'done';

export interface AnimationState {
  phase: AnimationPhase;
  activeBallIndex: number;
}

export interface UseLottoGeneratorResult {
  gameCount: number;
  setGameCount: (count: number) => void;
  fixedNumbers: number[];
  addFixedNumber: (n: number) => void;
  removeFixedNumber: (n: number) => void;
  excludedNumbers: number[];
  addExcludedNumber: (n: number) => void;
  removeExcludedNumber: (n: number) => void;
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
  games: Draw[];
  history: HistoryEntry[];
  clearHistoryLocal: () => void;
  generate: () => void;
  restoreFromHistory: (entry: HistoryEntry) => void;
  animationState: AnimationState;
  mounted: boolean;
}

export function useLottoGenerator(
  timingOverrides?: {
    rollMs?: number;
    lockMs?: number;
    staggerMs?: number;
  }
): UseLottoGeneratorResult {
  const rollMs = timingOverrides?.rollMs ?? ROLL_DURATION_MS;
  const lockMs = timingOverrides?.lockMs ?? LOCK_DURATION_MS;
  const staggerMs = timingOverrides?.staggerMs ?? BALL_STAGGER_MS;

  const [mounted, setMounted] = useState(false);
  const [gameCount, setGameCountState] = useState(1);
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [games, setGames] = useState<Draw[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [animationState, setAnimationState] = useState<AnimationState>({
    phase: 'idle',
    activeBallIndex: -1,
  });

  // Stable refs for callbacks to read latest state without closure staleness
  const settingsRef = useRef<{
    gameCount: number;
    fixedNumbers: number[];
    excludedNumbers: number[];
  }>({
    gameCount: 1,
    fixedNumbers: [],
    excludedNumbers: [],
  });
  const soundRefSoundOn = useRef(soundOn);
  const animationRefPhase = useRef<AnimationPhase>('idle');

  // Mount: Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const store = parseStore(raw);
    const pruned = pruneUnknown(store.history);

    if (store.lastSettings) {
      setGameCountState(store.lastSettings.gameCount);
      setFixedNumbers([...store.lastSettings.fixedNumbers]);
      setExcludedNumbers([...store.lastSettings.excludedNumbers]);
    }
    setHistory(pruned);
    setMounted(true);
  }, []);

  // Sync refs when state changes (after render)
  useEffect(() => {
    settingsRef.current = { gameCount, fixedNumbers, excludedNumbers };
  }, [gameCount, fixedNumbers, excludedNumbers]);

  useEffect(() => {
    soundRefSoundOn.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    animationRefPhase.current = animationState.phase;
  }, [animationState.phase]);

  // Persist settings on change (immediate, NO debounce)
  useEffect(() => {
    if (!mounted) return;
    const store = { version: 1, history, lastSettings: { gameCount, fixedNumbers, excludedNumbers } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [gameCount, fixedNumbers, excludedNumbers, history, mounted]);

  // Persist history on change (immediate)
  useEffect(() => {
    if (!mounted) return;
    const store = { version: 1, history, lastSettings: { gameCount, fixedNumbers, excludedNumbers } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [history, gameCount, fixedNumbers, excludedNumbers, mounted]);

  const setGameCount = useCallback((count: number) => {
    const clamped = Math.max(GAME_COUNT_MIN, Math.min(count, GAME_COUNT_MAX));
    setGameCountState(clamped);
  }, []);

  const addFixedNumber = useCallback((n: number) => {
    if (n < LOTTO_MIN || n > LOTTO_MAX) return;
    setFixedNumbers((prev) => {
      if (prev.includes(n) || prev.length >= FIXED_MAX) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
  }, []);

  const removeFixedNumber = useCallback((n: number) => {
    setFixedNumbers((prev) => prev.filter((x) => x !== n));
  }, []);

  const addExcludedNumber = useCallback((n: number) => {
    if (n < LOTTO_MIN || n > LOTTO_MAX) return;
    setExcludedNumbers((prev) => {
      if (prev.includes(n) || prev.length >= EXCLUDED_MAX) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
  }, []);

  const removeExcludedNumber = useCallback((n: number) => {
    setExcludedNumbers((prev) => prev.filter((x) => x !== n));
  }, []);

  const generate = useCallback(() => {
    // Capture stable ref values at START of generate
    const current = settingsRef.current;

    // Draw games
    const result: DrawResult = fairDrawGames(
      current.gameCount,
      current.fixedNumbers,
      current.excludedNumbers
    );

    // Set games immediately (trigger rolling phase)
    setGames(result.games);

    // Start animation sequence
    setAnimationState({
      phase: 'rolling',
      activeBallIndex: -1,
    });

    // Schedule locking phase
    const lockStartMs = (NUMBERS_PER_GAME - 1) * staggerMs + rollMs;
    const lockHandle = setTimeout(() => {
      setAnimationState((prev) => ({
        ...prev,
        phase: 'locking',
        activeBallIndex: 0,
      }));

      // Schedule pop sounds and ball lock progression
      let ballHandle: NodeJS.Timeout;
      const scheduleNextBall = (ballIdx: number) => {
        if (ballIdx >= NUMBERS_PER_GAME) {
          // All balls locked
          setAnimationState({
            phase: 'done',
            activeBallIndex: -1,
          });
          // Add to history (use stable ref for settings)
          const entry: HistoryEntry = {
            timestamp: new Date().toISOString(),
            gameCount: result.settings.gameCount,
            fixedNumbers: [...result.settings.fixedNumbers],
            excludedNumbers: [...result.settings.excludedNumbers],
            games: result.games,
          };
          setHistory((prev) => addHistory(prev, entry));
          return;
        }

        setAnimationState((prev) => ({
          ...prev,
          activeBallIndex: ballIdx,
        }));

        ballHandle = setTimeout(() => {
          scheduleNextBall(ballIdx + 1);
        }, lockMs + staggerMs);
      };

      scheduleNextBall(0);
    }, lockStartMs);

    return () => {
      clearTimeout(lockHandle);
    };
  }, [rollMs, lockMs, staggerMs]);

  const clearHistoryLocal = useCallback(() => {
    setHistory(clearHistory([]));
  }, []);

  const restoreFromHistory = useCallback((entry: HistoryEntry) => {
    setGameCountState(entry.gameCount);
    setFixedNumbers([...entry.fixedNumbers]);
    setExcludedNumbers([...entry.excludedNumbers]);
    setGames([...entry.games]);
    setAnimationState({ phase: 'done', activeBallIndex: -1 });
  }, []);

  return {
    gameCount,
    setGameCount,
    fixedNumbers,
    addFixedNumber,
    removeFixedNumber,
    excludedNumbers,
    addExcludedNumber,
    removeExcludedNumber,
    soundOn,
    setSoundOn,
    games,
    history,
    clearHistoryLocal,
    generate,
    restoreFromHistory,
    animationState,
    mounted,
  };
}
