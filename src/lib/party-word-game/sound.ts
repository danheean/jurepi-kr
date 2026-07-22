export const SOUND_TICK_HZ = 800;
export const SOUND_CHIME_HZ = 1200;
export const SOUND_BUZZ_HZ = 200;

export interface ToneSpec {
  freqHz: number;
  durationMs: number;
  type: string;
}

/**
 * Pure tone spec builder (no side effects)
 * Returns spec for Web Audio synthesis
 */
export function toneSpec(kind: 'tick' | 'chime' | 'buzz'): ToneSpec {
  switch (kind) {
    case 'tick':
      return {
        freqHz: SOUND_TICK_HZ,
        durationMs: 100,
        type: 'sine',
      };
    case 'chime':
      return {
        freqHz: SOUND_CHIME_HZ,
        durationMs: 200,
        type: 'sine',
      };
    case 'buzz':
      return {
        freqHz: SOUND_BUZZ_HZ,
        durationMs: 150,
        type: 'sine',
      };
  }
}

/**
 * Play a ToneSpec via the Web Audio API. Mirrors src/lib/sound.ts's playPop:
 * SSR-safe (no-ops without window), never throws to the caller, and takes an
 * injectable AudioContext factory for testing.
 */
export function playTone(
  spec: ToneSpec,
  enabled: boolean,
  ctxFactory?: () => AudioContext | null
): void {
  if (!enabled) return;

  const factory =
    ctxFactory ||
    (() => {
      if (typeof window === 'undefined') return null;
      try {
        return new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    });

  try {
    const ctx = factory();
    if (!ctx) return;

    if (ctx.resume) {
      ctx.resume().catch(() => {
        // Resume may fail; ignore
      });
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = spec.freqHz;
    osc.type = spec.type as OscillatorType;

    const now = ctx.currentTime;
    const sustainTime = spec.durationMs / 1000;
    const endTime = now + sustainTime;

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, endTime);

    osc.start(now);
    osc.stop(endTime);
  } catch {
    // Silently ignore any errors
  }
}
