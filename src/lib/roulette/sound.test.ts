import { describe, it, expect, vi } from 'vitest';
import {
  SOUND_TICK_HZ,
  SOUND_CHIME_HZ,
  toneSpec,
  playTone,
  type ToneSpec,
} from './sound';

describe('sound.ts', () => {
  describe('toneSpec', () => {
    it('returns tick spec with correct values', () => {
      const spec = toneSpec('tick');
      expect(spec.freqHz).toBe(SOUND_TICK_HZ);
      expect(spec.durationMs).toBe(100);
      expect(spec.type).toBe('sine');
    });

    it('returns chime spec with correct values', () => {
      const spec = toneSpec('chime');
      expect(spec.freqHz).toBe(SOUND_CHIME_HZ);
      expect(spec.durationMs).toBe(200);
      expect(spec.type).toBe('sine');
    });

    it('defines expected frequency constants', () => {
      expect(SOUND_TICK_HZ).toBe(800);
      expect(SOUND_CHIME_HZ).toBe(1200);
    });
  });

  describe('playTone', () => {
    /**
     * Create a mock AudioContext with real Web Audio API surface methods.
     * This tests that playTone calls the correct API methods without error.
     */
    function createMockAudioContext() {
      const mockOscillator = {
        frequency: { value: 0 },
        type: '',
        connect: vi.fn().mockReturnThis(),
        start: vi.fn(),
        stop: vi.fn(),
      };

      const mockGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn().mockReturnThis(),
      };

      const mockDestination = {};

      const mockAudioContext = {
        createOscillator: vi.fn().mockReturnValue(mockOscillator),
        createGain: vi.fn().mockReturnValue(mockGain),
        currentTime: 0,
        destination: mockDestination,
      } as unknown as AudioContext;

      return {
        audioContext: mockAudioContext,
        mockOscillator,
        mockGain,
      };
    }

    it('plays a tone without error', async () => {
      const { audioContext } = createMockAudioContext();
      const spec: ToneSpec = {
        freqHz: 800,
        durationMs: 100,
        type: 'sine',
      };

      await expect(playTone(audioContext, spec)).resolves.not.toThrow();
    });

    it('calls Web Audio API methods in correct order', async () => {
      const { audioContext, mockOscillator, mockGain } = createMockAudioContext();
      const spec: ToneSpec = {
        freqHz: 800,
        durationMs: 100,
        type: 'sine',
      };

      await playTone(audioContext, spec);

      // Verify createOscillator and createGain were called
      expect(audioContext.createOscillator).toHaveBeenCalled();
      expect(audioContext.createGain).toHaveBeenCalled();

      // Verify oscillator configuration
      expect(mockOscillator.frequency.value).toBe(800);
      expect(mockOscillator.type).toBe('sine');

      // Verify gain configuration
      expect(mockGain.gain.setValueAtTime).toHaveBeenCalled();
      expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalled();

      // Verify oscillator start/stop were called
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('sets gain value to 0.2', async () => {
      const { audioContext, mockGain } = createMockAudioContext();
      const spec: ToneSpec = {
        freqHz: 1000,
        durationMs: 200,
        type: 'sine',
      };

      await playTone(audioContext, spec);

      const setValueCall = mockGain.gain.setValueAtTime.mock.calls[0];
      expect(setValueCall[0]).toBe(0.2); // volume
      expect(setValueCall[1]).toBe(0); // currentTime
    });

    it('exponentially ramps to silent at duration', async () => {
      const { audioContext, mockGain } = createMockAudioContext();
      const durationMs = 150;
      const spec: ToneSpec = {
        freqHz: 1000,
        durationMs,
        type: 'sine',
      };

      await playTone(audioContext, spec);

      const rampCall = mockGain.gain.exponentialRampToValueAtTime.mock.calls[0];
      expect(rampCall[0]).toBe(0.01); // target volume
      expect(rampCall[1]).toBeCloseTo(durationMs / 1000, 5); // end time
    });

    it('connects oscillator to gain to destination', async () => {
      const { audioContext, mockOscillator, mockGain } = createMockAudioContext();
      const spec: ToneSpec = {
        freqHz: 800,
        durationMs: 100,
        type: 'sine',
      };

      await playTone(audioContext, spec);

      // Verify oscillator -> gain connection
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);

      // Verify gain -> destination connection
      expect(mockGain.connect).toHaveBeenCalledWith(audioContext.destination);
    });

    it('respects different durations', async () => {
      const { audioContext, mockOscillator } = createMockAudioContext();

      for (const durationMs of [50, 100, 200, 500]) {
        const spec: ToneSpec = {
          freqHz: 800,
          durationMs,
          type: 'sine',
        };

        mockOscillator.stop.mockClear();
        await playTone(audioContext, spec);

        const stopCall = mockOscillator.stop.mock.calls[0];
        expect(stopCall[0]).toBeCloseTo(durationMs / 1000, 5);
      }
    });

    it('respects different frequencies', async () => {
      const { audioContext, mockOscillator } = createMockAudioContext();

      for (const freqHz of [440, 800, 1200, 2000]) {
        mockOscillator.frequency.value = 0;
        const spec: ToneSpec = {
          freqHz,
          durationMs: 100,
          type: 'sine',
        };

        await playTone(audioContext, spec);

        expect(mockOscillator.frequency.value).toBe(freqHz);
      }
    });

    it('supports different waveform types', async () => {
      const { audioContext, mockOscillator } = createMockAudioContext();

      for (const type of ['sine', 'square', 'sawtooth', 'triangle']) {
        mockOscillator.type = '';
        const spec: ToneSpec = {
          freqHz: 800,
          durationMs: 100,
          type,
        };

        await playTone(audioContext, spec);

        expect(mockOscillator.type).toBe(type);
      }
    });

    it('handles AudioContext errors gracefully (fallback)', async () => {
      const mockAudioContext = {
        createOscillator: vi.fn().mockImplementation(() => {
          throw new Error('AudioContext unavailable');
        }),
      } as unknown as AudioContext;

      const spec: ToneSpec = {
        freqHz: 800,
        durationMs: 100,
        type: 'sine',
      };

      // playTone should catch the error and resolve (silent fallback)
      await expect(playTone(mockAudioContext, spec)).resolves.not.toThrow();
    });
  });
});
