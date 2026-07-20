'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLottoGenerator } from './useLottoGenerator';
import { SettingsPanel } from './SettingsPanel';
import { GameList } from './GameList';
import { HistoryPanel } from './HistoryPanel';
import { ResponsibilityDisclaimer } from './ResponsibilityDisclaimer';
import { spawnConfetti } from './confetti';
import { playPopSound } from '@/lib/lotto-generator/sound';
import { BEEP_FREQ_HZ } from '@/lib/lotto-generator/schema';

/**
 * Lotto Generator orchestrator component.
 * "use client" — owns state, animation, lifecycle.
 * Mounted gate: only render interactive UI after hydration.
 * Global keyboard handler for Enter key.
 */
export function LottoGenerator() {
  const t = useTranslations('tools.lotto-generator');
  const {
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
  } = useLottoGenerator();

  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isGeneratingRef = useRef(false);
  const generateDisabledRef = useRef(false);

  // Initialize AudioContext on first interaction
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      } catch {
        // AudioContext not available
      }
    }
  }, []);

  // Global keyboard handler (Enter to generate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !generateDisabledRef.current && !isGeneratingRef.current) {
        e.preventDefault();
        generate();
      }
    };

    if (mounted) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mounted, generate]);

  // Pop sound during animation (locking phase)
  useEffect(() => {
    if (animationState.phase === 'locking' && soundOn && audioContextRef.current) {
      playPopSound({ frequency: BEEP_FREQ_HZ, durationMs: 100 }, audioContextRef.current);
    }
  }, [animationState.phase, animationState.activeBallIndex, soundOn]);

  // Confetti on done
  useEffect(() => {
    if (animationState.phase === 'done' && containerRef.current && games.length > 0) {
      spawnConfetti(containerRef.current, { count: 50, duration: 1500 });
    }
  }, [animationState.phase, games.length]);

  if (!mounted) {
    return null; // Hydration guard: don't render interactive UI until client-ready
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Responsibility Disclaimer — ALWAYS visible */}
      <ResponsibilityDisclaimer />

      {/* Settings Panel */}
      <SettingsPanel
        gameCount={gameCount}
        onGameCountChange={setGameCount}
        fixedNumbers={fixedNumbers}
        onAddFixed={addFixedNumber}
        onRemoveFixed={removeFixedNumber}
        excludedNumbers={excludedNumbers}
        onAddExcluded={addExcludedNumber}
        onRemoveExcluded={removeExcludedNumber}
        onGenerateDisabledChange={(disabled) => {
          generateDisabledRef.current = disabled;
        }}
      />

      {/* Generate Button */}
      <button
        onClick={() => {
          isGeneratingRef.current = true;
          generate();
          setTimeout(() => {
            isGeneratingRef.current = false;
          }, 2000);
        }}
        disabled={generateDisabledRef.current}
        aria-live="polite"
        className="w-full py-3 px-4 rounded-lg bg-brand text-on-brand font-semibold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
      >
        {t('buttons.generate')}
      </button>

      {/* Sound Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={soundOn}
          onChange={(e) => setSoundOn(e.target.checked)}
          className="w-4 h-4 rounded accent-brand focus-visible:ring-2 focus-visible:ring-focus-ring"
        />
        <span className="text-sm">{t('settings.sound')}</span>
      </label>

      {/* Game Results */}
      {games.length > 0 && (
        <GameList games={games} animationPhase={animationState.phase} />
      )}

      {/* History Panel */}
      <HistoryPanel
        history={history}
        onRestore={restoreFromHistory}
        onClear={clearHistoryLocal}
      />
    </div>
  );
}
