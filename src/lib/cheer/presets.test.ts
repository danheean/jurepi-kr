import { describe, it, expect } from 'vitest';
import { PRESET_PHRASES, getPresetsByCategory } from './presets';

describe('presets.ts', () => {
  describe('PRESET_PHRASES', () => {
    it('is an array', () => {
      expect(Array.isArray(PRESET_PHRASES)).toBe(true);
    });

    it('contains presets', () => {
      expect(PRESET_PHRASES.length).toBeGreaterThan(0);
    });

    it('each preset has id and situation', () => {
      PRESET_PHRASES.forEach((preset) => {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('situation');
        expect(typeof preset.id).toBe('string');
        expect(preset.id.length).toBeGreaterThan(0);
      });
    });

    it('all presets have valid situations', () => {
      const validSituations = ['concert', 'sports', 'birthday', 'event'];
      PRESET_PHRASES.forEach((preset) => {
        expect(validSituations).toContain(preset.situation);
      });
    });

    it('has roughly 6 presets per situation', () => {
      const concert = PRESET_PHRASES.filter((p) => p.situation === 'concert');
      const sports = PRESET_PHRASES.filter((p) => p.situation === 'sports');
      const birthday = PRESET_PHRASES.filter((p) => p.situation === 'birthday');
      const event = PRESET_PHRASES.filter((p) => p.situation === 'event');

      // Expect approximately 6 per situation (allow ±2 for flexibility)
      expect(concert.length).toBeGreaterThanOrEqual(4);
      expect(concert.length).toBeLessThanOrEqual(8);
      expect(sports.length).toBeGreaterThanOrEqual(4);
      expect(sports.length).toBeLessThanOrEqual(8);
      expect(birthday.length).toBeGreaterThanOrEqual(4);
      expect(birthday.length).toBeLessThanOrEqual(8);
      expect(event.length).toBeGreaterThanOrEqual(4);
      expect(event.length).toBeLessThanOrEqual(8);
    });

    it('has unique ids within each situation', () => {
      ['concert', 'sports', 'birthday', 'event'].forEach((situation) => {
        const presets = PRESET_PHRASES.filter((p) => p.situation === situation);
        const ids = presets.map((p) => p.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });

  describe('getPresetsByCategory', () => {
    it('returns concert presets', () => {
      const concert = getPresetsByCategory('concert');
      expect(concert.length).toBeGreaterThan(0);
      concert.forEach((p) => {
        expect(p.situation).toBe('concert');
      });
    });

    it('returns sports presets', () => {
      const sports = getPresetsByCategory('sports');
      expect(sports.length).toBeGreaterThan(0);
      sports.forEach((p) => {
        expect(p.situation).toBe('sports');
      });
    });

    it('returns birthday presets', () => {
      const birthday = getPresetsByCategory('birthday');
      expect(birthday.length).toBeGreaterThan(0);
      birthday.forEach((p) => {
        expect(p.situation).toBe('birthday');
      });
    });

    it('returns event presets', () => {
      const event = getPresetsByCategory('event');
      expect(event.length).toBeGreaterThan(0);
      event.forEach((p) => {
        expect(p.situation).toBe('event');
      });
    });

    it('returns empty array for unknown situation', () => {
      const unknown = getPresetsByCategory('unknown' as any);
      expect(unknown).toEqual([]);
    });
  });
});
