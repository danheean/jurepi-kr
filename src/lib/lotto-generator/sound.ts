/**
 * Pure tone specification for ball pop sound.
 */
export interface ToneSpec {
  frequency: number; // Hz
  durationMs: number; // Milliseconds
}

/**
 * Play a pop/beep sound using Web Audio API.
 * Gracefully degrades if AudioContext is unavailable.
 *
 * @param spec - Tone specification
 * @param audioContext - Optional AudioContext (default: window.AudioContext if available)
 */
export function playPopSound(
  spec: ToneSpec,
  audioContext?: AudioContext
): void {
  if (!audioContext) {
    // Gracefully degrade if no AudioContext available
    if (typeof window === 'undefined' || !window.AudioContext) {
      return;
    }
    try {
      audioContext = new window.AudioContext();
    } catch {
      return;
    }
  }

  try {
    const now = audioContext.currentTime;
    const durationSec = spec.durationMs / 1000;

    // Create oscillator (generates sine wave)
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(spec.frequency, now);

    // Create gain (volume envelope: fade out)
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(1, now);
    // Exponential ramp down to near-zero over duration
    gain.gain.exponentialRampToValueAtTime(0.01, now + durationSec);

    // Connect: osc → gain → speakers
    osc.connect(gain);
    gain.connect(audioContext.destination);

    // Play
    osc.start(now);
    osc.stop(now + durationSec);
  } catch {
    // Silently ignore Web Audio errors
  }
}
