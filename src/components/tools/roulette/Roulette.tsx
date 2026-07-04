'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRoulette } from './useRoulette';
import { WheelSVG } from './WheelSVG';
import { OptionList } from './OptionList';
import { SpinButton } from './SpinButton';
import { ResultPanel } from './ResultPanel';
import { SaveLoadPanel } from './SaveLoadPanel';
import { SettingsPanel } from './SettingsPanel';
import { Toast } from '@/components/ui/Toast';
import { MIN_OPTIONS, MAX_OPTIONS, SPIN_DURATION_MS } from '@/lib/roulette/schema';
import { isDuplicateLabel } from '@/lib/roulette/sets';
import { playTone, toneSpec } from '@/lib/roulette/sound';

const TICK_COUNT = 12;

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * 인터랙티브 아일랜드 오케스트레이터.
 * SEO 섹션(Intro/HowTo/Faq/StructuredData)은 라우트가 소유한다 — 여기서 렌더 금지.
 */
export function Roulette() {
  const t = useTranslations('tools.roulette');
  const roulette = useRoulette();
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevSpinningRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (!audioCtxRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return null;
        audioCtxRef.current = new Ctor();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // 스핀 중 틱 사운드 (ease-out 감속에 맞춰 초반 촘촘 → 후반 성김, 주파수 상승)
  useEffect(() => {
    if (!roulette.spinning || !roulette.soundOn) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const volume = roulette.volume / 100;
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (!roulette.prefersReducedMotion) {
      for (let i = 0; i < TICK_COUNT; i += 1) {
        const progress = i / TICK_COUNT;
        // 회전량 균등 간격을 ease-out 시간축으로 역변환
        const atMs = SPIN_DURATION_MS * (1 - Math.cbrt(1 - progress));
        timers.push(
          setTimeout(() => {
            const spec = toneSpec('tick');
            void playTone(ctx, { ...spec, freqHz: spec.freqHz + i * 25 }, volume);
          }, atMs)
        );
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [
    roulette.spinning,
    roulette.soundOn,
    roulette.volume,
    roulette.prefersReducedMotion,
    getAudioContext,
  ]);

  // 스핀 종료(공개) 시 당첨 차임
  useEffect(() => {
    const justEnded = prevSpinningRef.current && !roulette.spinning;
    prevSpinningRef.current = roulette.spinning;
    if (!justEnded || roulette.selectedIndex === null || !roulette.soundOn) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    void playTone(ctx, toneSpec('chime'), roulette.volume / 100);
  }, [
    roulette.spinning,
    roulette.selectedIndex,
    roulette.soundOn,
    roulette.volume,
    getAudioContext,
  ]);

  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ message, type });
  }, []);

  // 검증 → 토스트 → 도메인 op (SPEC error_handling)
  const handleAdd = useCallback(
    (label: string, weight?: number) => {
      const trimmed = label.trim();
      if (!trimmed) {
        showToast(t('toasts.emptyLabel'), 'error');
        return;
      }
      if (isDuplicateLabel(roulette.options, trimmed)) {
        showToast(t('toasts.duplicateLabel'), 'error');
        return;
      }
      if (roulette.options.length >= MAX_OPTIONS) {
        showToast(t('toasts.maxOptions'), 'error');
        return;
      }
      roulette.addOption(trimmed, weight);
    },
    [roulette, showToast, t]
  );

  const handleSave = useCallback(
    (name: string) => {
      if (!name.trim()) return;
      roulette.saveSet(name);
      showToast(t('toasts.saved'), 'success');
    },
    [roulette, showToast, t]
  );

  const handleLoad = useCallback(
    (name: string) => {
      roulette.loadSet(name);
      showToast(t('toasts.loaded'), 'success');
    },
    [roulette, showToast, t]
  );

  const handleDeleteSet = useCallback(
    (name: string) => {
      roulette.deleteSet(name);
      showToast(t('toasts.deleted'), 'info');
    },
    [roulette, showToast, t]
  );

  const canSpin = roulette.options.length >= MIN_OPTIONS && !roulette.spinning;
  const maxReached = roulette.options.length >= MAX_OPTIONS;

  // 게임 UI만 mounted 게이트 (localStorage 의존). SEO는 라우트 소유.
  if (!mounted) {
    return <div className="min-h-[24rem]" aria-hidden="true" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Wheel + Result column */}
        <div className="flex flex-col items-center justify-start space-y-4">
          <WheelSVG
            options={roulette.options}
            sliceGeometry={roulette.sliceGeometry}
            selectedIndex={roulette.selectedIndex}
            spinning={roulette.spinning}
            finalAngle={roulette.finalAngle}
            prefersReducedMotion={roulette.prefersReducedMotion}
          />

          {roulette.selectedIndex !== null && (
            <ResultPanel
              selectedIndex={roulette.selectedIndex}
              options={roulette.options}
              spinning={roulette.spinning}
              showRemoveOption={roulette.removingWinner}
              onSpin={roulette.spin}
              onRemoveAndSpin={roulette.removeWinnerAndSpin}
              prefersReducedMotion={roulette.prefersReducedMotion}
            />
          )}
        </div>

        {/* Controls column */}
        <div className="flex flex-col space-y-6">
          <OptionList
            options={roulette.options}
            onAdd={handleAdd}
            onUpdate={roulette.updateOption}
            onRemove={roulette.removeOption}
            onReorderUp={roulette.reorderUp}
            onReorderDown={roulette.reorderDown}
            maxReached={maxReached}
          />

          <SpinButton
            disabled={!canSpin}
            spinning={roulette.spinning}
            onClick={roulette.spin}
          />

          <SaveLoadPanel
            options={roulette.options}
            savedSets={roulette.savedSets}
            onSave={handleSave}
            onLoad={handleLoad}
            onDelete={handleDeleteSet}
          />

          <SettingsPanel
            soundOn={roulette.soundOn}
            removingWinner={roulette.removingWinner}
            volume={roulette.volume}
            onToggleSound={roulette.toggleSound}
            onToggleRemoveWinner={roulette.toggleRemoveWinner}
            onVolumeChange={roulette.setVolume}
          />
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
