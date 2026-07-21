'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheerSettings,
  CheerStore,
  DEFAULT_SETTINGS,
  STORE_VERSION,
  cheerStoreSchema,
  PRESET_PHRASES,
  addRecent,
  pruneRecents,
  resolveEffectiveSize,
} from '@/lib/cheer';
import { useFullscreen } from './useFullscreen';

const STORAGE_KEY = 'jurepi-cheer';

export interface UseCheerReturn {
  // Settings state
  settings: CheerSettings;
  updateSettings: (updates: Partial<CheerSettings>) => void;
  // settings with `size` resolved to the auto-computed bucket when sizeMode='auto'
  // (falls through to settings.size unchanged when sizeMode='manual'). Feed this,
  // not `settings`, to the display components.
  effectiveSettings: CheerSettings;

  // Recents state
  recents: string[];
  clearMessage: () => void;
  loadRecent: (msg: string) => void;

  // Preset apply — receives the resolved (localized) phrase text
  applyPreset: (text: string) => void;

  // Immersive presentation overlay (works even where Fullscreen API is absent, e.g. iOS)
  presenting: boolean;
  startPresenting: () => void;
  stopPresenting: () => Promise<void>;

  // Fullscreen + Wake Lock wiring
  isFullscreenSupported: boolean;
  isFullscreenActive: boolean;
  enterFullscreen: (element: HTMLElement) => Promise<void>;
  exitFullscreen: () => Promise<void>;
  isWakeLockSupported: boolean;
  isWakeLocked: boolean;
  toggleWakeLock: () => Promise<void>;

  // Commit a message to recents (pass the text explicitly — no stale ref)
  commitMessage: (text: string) => void;
}

/**
 * Manage CheerSettings + Recents state. Read/write localStorage.
 * Feature-detect fullscreen/wake-lock.
 */
export function useCheer(): UseCheerReturn {
  const [settings, setSettings] = useState<CheerSettings>(DEFAULT_SETTINGS);
  const [recents, setRecents] = useState<string[]>([]);

  // Sync refs for callbacks (avoid stale closures)
  const settingsRef = useRef<CheerSettings>(DEFAULT_SETTINGS);
  const recentsRef = useRef<string[]>([]);

  settingsRef.current = settings;
  recentsRef.current = recents;

  // Derived purely from render-time state — no effect needed (and no risk of the
  // "hook return object in an effect dependency" infinite-render pitfall).
  const effectiveSettings = useMemo<CheerSettings>(
    () => ({ ...settings, size: resolveEffectiveSize(settings) }),
    [settings]
  );

  // Fullscreen + wake-lock wiring
  const fullscreen = useFullscreen();
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  // Immersive presentation overlay state
  const [presenting, setPresenting] = useState(false);

  // Mount: read localStorage jurepi-cheer → zod parse → restore settings + recents
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = cheerStoreSchema.parse(parsed);
        setSettings(validated.lastSettings);
        setRecents(pruneRecents(validated.recents));
      }
    } catch {
      // Corrupt blob or parse fail → start fresh (no throw)
      setSettings(DEFAULT_SETTINGS);
      setRecents([]);
    }
  }, []);

  // Persist settings immediately on change
  const updateSettings = useCallback((updates: Partial<CheerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      // Immediately persist using current refs
      try {
        const store: CheerStore = {
          version: STORE_VERSION,
          recents: recentsRef.current,
          lastSettings: next,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      } catch {
        // localStorage unavailable (private mode, quota full) — silent fail
      }
      return next;
    });
  }, []);

  // Commit a message to recents and persist. Take the text as an argument
  // (never a settingsRef snapshot) so a same-tick updateSettings+commit is correct.
  const commitMessage = useCallback((text: string) => {
    const next = addRecent(recentsRef.current, text);
    setRecents(next);
    // Persist immediately
    try {
      const store: CheerStore = {
        version: STORE_VERSION,
        recents: next,
        lastSettings: { ...settingsRef.current, text },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // localStorage unavailable — silent fail
    }
  }, []);

  // Load a recent message into the input
  const loadRecent = useCallback((msg: string) => {
    updateSettings({ text: msg });
  }, [updateSettings]);

  // Clear the input
  const clearMessage = useCallback(() => {
    updateSettings({ text: '' });
  }, [updateSettings]);

  // Apply a preset: the component resolves the localized phrase (via i18n) and
  // passes it here as plain text, so the banner shows the real phrase (not the id).
  const applyPreset = useCallback((text: string) => {
    updateSettings({ text });
  }, [updateSettings]);

  // Fullscreen enter/exit
  const enterFullscreen = useCallback(
    async (element: HTMLElement) => {
      await fullscreen.enter(element);
    },
    [fullscreen]
  );

  const exitFullscreen = useCallback(async () => {
    await fullscreen.exit();
  }, [fullscreen]);

  // Immersive overlay open/close. Native fullscreen is attempted by the overlay
  // itself (once its element is mounted); here we just own the mount state and
  // ensure we exit any native fullscreen on close.
  const startPresenting = useCallback(() => {
    setPresenting(true);
  }, []);

  const stopPresenting = useCallback(async () => {
    setPresenting(false);
    await fullscreen.exit();
  }, [fullscreen]);

  // Toggle wake lock
  const toggleWakeLock = useCallback(async () => {
    if (isWakeLockActive) {
      await fullscreen.release();
      setIsWakeLockActive(false);
    } else {
      await fullscreen.acquire();
      setIsWakeLockActive(fullscreen.isWakeLocked);
    }
  }, [isWakeLockActive, fullscreen]);

  return {
    settings,
    effectiveSettings,
    updateSettings,
    recents,
    clearMessage,
    loadRecent,
    applyPreset,
    presenting,
    startPresenting,
    stopPresenting,
    isFullscreenSupported: fullscreen.isSupported,
    isFullscreenActive: fullscreen.isActive,
    enterFullscreen,
    exitFullscreen,
    isWakeLockSupported: fullscreen.isWakeLockSupported,
    isWakeLocked: fullscreen.isWakeLocked,
    toggleWakeLock,
    commitMessage,
  };
}
