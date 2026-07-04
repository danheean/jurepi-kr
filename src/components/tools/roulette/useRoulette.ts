'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  Option,
  OptionSet,
  RouletteStore,
  MAX_OPTIONS,
  MIN_WEIGHT,
  MAX_WEIGHT,
  SPIN_DURATION_MS,
  parseStore,
} from '@/lib/roulette/schema';
import {
  buildSliceGeometry,
  finalSpinAngle,
  type SliceInfo,
} from '@/lib/roulette/geometry';
import { fairWeightedPick } from '@/lib/roulette/random';
import {
  addSet,
  deleteSet,
  isDuplicateLabel,
  serializeStore,
  loadLastSet,
} from '@/lib/roulette/sets';

const STORAGE_KEY = 'jurepi-roulette';

export interface UseRouletteReturn {
  // State
  options: Option[];
  savedSets: OptionSet[];
  lastSetName: string | null;
  spinning: boolean;
  selectedIndex: number | null;
  soundOn: boolean;
  removingWinner: boolean;
  prefersReducedMotion: boolean;
  volume: number;

  // Derived geometry
  sliceGeometry: SliceInfo[];
  finalAngle: number | null;

  // Callbacks (stable)
  addOption: (label: string, weight?: number) => void;
  updateOption: (index: number, label: string, weight: number) => void;
  removeOption: (index: number) => void;
  reorderUp: (index: number) => void;
  reorderDown: (index: number) => void;

  spin: () => void;
  removeWinnerAndSpin: () => void;

  saveSet: (setName: string) => void;
  loadSet: (setName: string) => void;
  deleteSet: (setName: string) => void;

  toggleSound: () => void;
  toggleRemoveWinner: () => void;
  setVolume: (volume: number) => void;

  reset: () => void;
}

function clampWeight(weight: number): number {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.floor(weight) || MIN_WEIGHT));
}

/**
 * Roulette 상태 소유 훅.
 *
 * 콜백 간 최신값 전달은 동기 ref(단일 진실)로 하고, setState는 렌더 반영용으로만
 * 쓴다 — 같은 이벤트/act 배치 안에서 addOption→saveSet처럼 상태를 교차 참조해도
 * 스테일을 읽지 않게 하기 위함이다.
 */
export function useRoulette(): UseRouletteReturn {
  const [store, setStore] = useState<RouletteStore | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [removingWinner, setRemovingWinner] = useState(false);
  const [volume, setVolume] = useState(100);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotionRef = useRef(false);
  reducedMotionRef.current = prefersReducedMotion;

  // 동기 소스-오브-트루스 refs (콜백 호출 시점에 즉시 갱신)
  const optionsRef = useRef<Option[]>([]);
  const storeRef = useRef<RouletteStore | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const removingWinnerRef = useRef(false);
  const spinningRef = useRef(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitOptions = useCallback((next: Option[]) => {
    optionsRef.current = next;
    setOptions(next);
  }, []);

  const commitStore = useCallback((next: RouletteStore) => {
    storeRef.current = next;
    setStore(next);
  }, []);

  const commitSelectedIndex = useCallback((next: number | null) => {
    selectedIndexRef.current = next;
    setSelectedIndex(next);
  }, []);

  // Mount: localStorage 읽기 (실패 → fresh, SPEC: 빈 옵션으로 시작)
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      // private mode 등 — in-memory로 계속
    }
    const parsed = parseStore(raw);
    storeRef.current = parsed;
    setStore(parsed);

    const lastSetOptions = loadLastSet(parsed);
    if (lastSetOptions) {
      optionsRef.current = lastSetOptions;
      setOptions(lastSetOptions);
    }
  }, []);

  // 스핀 타이머 unmount 정리
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  // store 변경마다 즉시 persist (디바운스 금지)
  useEffect(() => {
    if (!store) return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeStore(store));
    } catch {
      // quota/private mode — 조용히 계속 (in-memory 동작 유지)
    }
  }, [store]);

  const sliceGeometry = useMemo(() => buildSliceGeometry(options), [options]);

  const finalAngle = useMemo(() => {
    if (selectedIndex === null || sliceGeometry.length === 0) return null;
    return finalSpinAngle(selectedIndex, sliceGeometry);
  }, [selectedIndex, sliceGeometry]);

  const addOption = useCallback(
    (label: string, weight: number = 1) => {
      const prev = optionsRef.current;
      const trimmed = label.trim();
      if (prev.length >= MAX_OPTIONS) return;
      if (!trimmed) return;
      if (isDuplicateLabel(prev, trimmed)) return;
      commitOptions([...prev, { label: trimmed, weight: clampWeight(weight) }]);
    },
    [commitOptions]
  );

  const updateOption = useCallback(
    (index: number, label: string, weight: number) => {
      const prev = optionsRef.current;
      const trimmed = label.trim();
      if (index < 0 || index >= prev.length) return;
      if (!trimmed) return;
      const others = prev.filter((_, i) => i !== index);
      if (isDuplicateLabel(others, trimmed)) return;
      commitOptions(
        prev.map((opt, i) =>
          i === index ? { label: trimmed, weight: clampWeight(weight) } : opt
        )
      );
    },
    [commitOptions]
  );

  const removeOption = useCallback(
    (index: number) => {
      const prev = optionsRef.current;
      if (index < 0 || index >= prev.length) return;
      commitOptions(prev.filter((_, i) => i !== index));

      const sel = selectedIndexRef.current;
      if (sel === index) commitSelectedIndex(null);
      else if (sel !== null && sel > index) commitSelectedIndex(sel - 1);
    },
    [commitOptions, commitSelectedIndex]
  );

  const reorder = useCallback(
    (index: number, direction: -1 | 1) => {
      const prev = optionsRef.current;
      const target = index + direction;
      if (index < 0 || index >= prev.length) return;
      if (target < 0 || target >= prev.length) return;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      commitOptions(next);

      const sel = selectedIndexRef.current;
      if (sel === index) commitSelectedIndex(target);
      else if (sel === target) commitSelectedIndex(index);
    },
    [commitOptions, commitSelectedIndex]
  );

  const reorderUp = useCallback((index: number) => reorder(index, -1), [reorder]);
  const reorderDown = useCallback((index: number) => reorder(index, 1), [reorder]);

  const spin = useCallback(() => {
    if (spinningRef.current) return;
    const opts = optionsRef.current;
    if (opts.length < 2) return;

    // remove-winner 모드: 직전 승자를 제외하고 추첨
    let pickFrom = opts;
    const lastWinner = selectedIndexRef.current;
    if (removingWinnerRef.current && lastWinner !== null && opts.length > 1) {
      pickFrom = opts.filter((_, i) => i !== lastWinner);
    }

    const winnerInPick = fairWeightedPick(pickFrom);
    const actualIndex = opts.indexOf(pickFrom[winnerInPick]);

    commitSelectedIndex(actualIndex);
    spinningRef.current = true;
    setSpinning(true);

    // reduced-motion: 회전 없이 즉시 공개 (SPEC)
    const duration = reducedMotionRef.current ? 0 : SPIN_DURATION_MS;
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      spinningRef.current = false;
      setSpinning(false);
    }, duration);
  }, [commitSelectedIndex]);

  const removeWinnerAndSpin = useCallback(() => {
    const winner = selectedIndexRef.current;
    if (winner === null || spinningRef.current) return;

    const prev = optionsRef.current;
    const remaining = prev.filter((_, i) => i !== winner);
    commitOptions(remaining);
    commitSelectedIndex(null);

    if (remaining.length >= 2) spin();
  }, [commitOptions, commitSelectedIndex, spin]);

  const saveSet = useCallback(
    (setName: string) => {
      const currentStore = storeRef.current;
      const trimmed = setName.trim();
      if (!currentStore || !trimmed) return;

      const newSet: OptionSet = {
        name: trimmed,
        options: optionsRef.current,
        createdAt: Date.now(),
      };
      commitStore(addSet(currentStore, newSet));
    },
    [commitStore]
  );

  const loadSet = useCallback(
    (setName: string) => {
      const currentStore = storeRef.current;
      if (!currentStore || !currentStore.sets[setName]) return;

      commitOptions([...currentStore.sets[setName].options]);
      commitSelectedIndex(null);
      commitStore({ ...currentStore, lastSetName: setName });
    },
    [commitOptions, commitSelectedIndex, commitStore]
  );

  const deleteSetFn = useCallback(
    (setName: string) => {
      const currentStore = storeRef.current;
      if (!currentStore) return;
      commitStore(deleteSet(currentStore, setName));
    },
    [commitStore]
  );

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => !prev);
  }, []);

  const toggleRemoveWinner = useCallback(() => {
    removingWinnerRef.current = !removingWinnerRef.current;
    setRemovingWinner(removingWinnerRef.current);
  }, []);

  const setVolumeValue = useCallback((vol: number) => {
    setVolume(Math.max(0, Math.min(100, vol)));
  }, []);

  const reset = useCallback(() => {
    commitOptions([]);
    commitSelectedIndex(null);
    spinningRef.current = false;
    setSpinning(false);
    removingWinnerRef.current = false;
    setRemovingWinner(false);
  }, [commitOptions, commitSelectedIndex]);

  return useMemo(
    () => ({
      options,
      savedSets: store?.sets ? Object.values(store.sets) : [],
      lastSetName: store?.lastSetName ?? null,
      spinning,
      selectedIndex,
      soundOn,
      removingWinner,
      prefersReducedMotion,
      volume,

      sliceGeometry,
      finalAngle,

      addOption,
      updateOption,
      removeOption,
      reorderUp,
      reorderDown,

      spin,
      removeWinnerAndSpin,

      saveSet,
      loadSet,
      deleteSet: deleteSetFn,

      toggleSound,
      toggleRemoveWinner,
      setVolume: setVolumeValue,

      reset,
    }),
    [
      options,
      store,
      spinning,
      selectedIndex,
      soundOn,
      removingWinner,
      prefersReducedMotion,
      volume,
      sliceGeometry,
      finalAngle,
      addOption,
      updateOption,
      removeOption,
      reorderUp,
      reorderDown,
      spin,
      removeWinnerAndSpin,
      saveSet,
      loadSet,
      deleteSetFn,
      toggleSound,
      toggleRemoveWinner,
      setVolumeValue,
      reset,
    ]
  );
}
