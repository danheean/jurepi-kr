/**
 * Web Audio API tone synthesis (no side effects in pure functions).
 * Called from hook/component with real AudioContext instance.
 */

export const SOUND_TICK_HZ = 800;
export const SOUND_CHIME_HZ = 1200;

export interface ToneSpec {
  freqHz: number;
  durationMs: number;
  type: string;
}

/**
 * Build a tone spec without instantiating Web Audio.
 * Pure function, safe to test.
 */
export function toneSpec(kind: 'tick' | 'chime'): ToneSpec {
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
  }
}

/**
 * Play a single tone via Web Audio API.
 * Called from hook; receives a real or mocked AudioContext.
 * Gracefully degrades if AudioContext is unavailable.
 *
 * @param audioContext real or mocked Web Audio AudioContext
 * @param spec tone specification (freq, duration, type)
 */
export async function playTone(
  audioContext: AudioContext,
  spec: ToneSpec,
  volume: number = 1
): Promise<void> {
  try {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (clampedVolume === 0) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.frequency.value = spec.freqHz;
    osc.type = spec.type as OscillatorType;

    // Peak at 0.2 × volume, ramp to 0.01 over duration
    const now = audioContext.currentTime;
    const durationSec = spec.durationMs / 1000;

    gain.gain.setValueAtTime(0.2 * clampedVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + durationSec);

    // Wire oscillator → gain → speakers
    osc.connect(gain);
    gain.connect(audioContext.destination);

    // Play and stop
    osc.start(now);
    osc.stop(now + durationSec);
  } catch {
    // Silent fallback: if AudioContext unavailable, do nothing
  }
}
