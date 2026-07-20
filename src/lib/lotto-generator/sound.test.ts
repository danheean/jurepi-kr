import { describe, it, expect, beforeEach, vi } from 'vitest';
import { playPopSound, type ToneSpec } from './sound';

describe('src/lib/lotto-generator/sound', () => {
  describe('playPopSound', () => {
    it('calls createOscillator and connect methods', () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { setValueAtTime: vi.fn() },
        type: 'sine',
      };

      const mockGain = {
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };

      const mockAudioContext = {
        createOscillator: vi.fn().mockReturnValue(mockOscillator),
        createGain: vi.fn().mockReturnValue(mockGain),
        destination: {},
        currentTime: 0,
      };

      const spec: ToneSpec = { frequency: 900, durationMs: 100 };

      playPopSound(spec, mockAudioContext as any);

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillator.connect).toHaveBeenCalled();
      expect(mockGain.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockOscillator.start).toHaveBeenCalled();
    });

    it('sets frequency correctly', () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { setValueAtTime: vi.fn() },
        type: 'sine',
      };

      const mockGain = {
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };

      const mockAudioContext = {
        createOscillator: vi.fn().mockReturnValue(mockOscillator),
        createGain: vi.fn().mockReturnValue(mockGain),
        destination: {},
        currentTime: 0,
      };

      const spec: ToneSpec = { frequency: 800, durationMs: 150 };
      playPopSound(spec, mockAudioContext as any);

      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        800,
        mockAudioContext.currentTime
      );
    });

    it('uses exponential ramp for fadeout', () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { setValueAtTime: vi.fn() },
        type: 'sine',
      };

      const mockGain = {
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      };

      const mockAudioContext = {
        createOscillator: vi.fn().mockReturnValue(mockOscillator),
        createGain: vi.fn().mockReturnValue(mockGain),
        destination: {},
        currentTime: 0,
      };

      const spec: ToneSpec = { frequency: 900, durationMs: 100 };
      playPopSound(spec, mockAudioContext as any);

      expect(mockGain.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    });

    it('does not throw if AudioContext is undefined (graceful degradation)', () => {
      const spec: ToneSpec = { frequency: 900, durationMs: 100 };
      expect(() => playPopSound(spec, undefined as any)).not.toThrow();
    });
  });
});
