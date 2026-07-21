import { describe, it, expect } from 'vitest';
import {
  cheerSettingsSchema,
  cheerStoreSchema,
  DEFAULT_SETTINGS,
  MIN_LEN,
  MAX_LEN,
  MAX_RECENTS,
  STORE_VERSION,
  MIN_CONTRAST,
  SCROLL_MS,
  FLASH_MS,
  SIZE_SCALE,
} from './schema';

describe('schema.ts', () => {
  describe('Constants', () => {
    it('defines MIN_LEN = 1', () => {
      expect(MIN_LEN).toBe(1);
    });

    it('defines MAX_LEN = 80', () => {
      expect(MAX_LEN).toBe(80);
    });

    it('defines MAX_RECENTS = 10', () => {
      expect(MAX_RECENTS).toBe(10);
    });

    it('defines STORE_VERSION = 2 (bumped for sizeMode/deviceType fields)', () => {
      expect(STORE_VERSION).toBe(2);
    });

    it('defines MIN_CONTRAST = 3.0', () => {
      expect(MIN_CONTRAST).toBe(3.0);
    });

    it('defines SCROLL_MS with slow/medium/fast', () => {
      expect(SCROLL_MS).toHaveProperty('slow');
      expect(SCROLL_MS).toHaveProperty('medium');
      expect(SCROLL_MS).toHaveProperty('fast');
      expect(SCROLL_MS.slow).toBeGreaterThan(0);
      expect(SCROLL_MS.fast).toBeLessThan(SCROLL_MS.slow);
    });

    it('defines FLASH_MS with slow/medium/fast', () => {
      expect(FLASH_MS).toHaveProperty('slow');
      expect(FLASH_MS).toHaveProperty('medium');
      expect(FLASH_MS).toHaveProperty('fast');
      expect(FLASH_MS.slow).toBeGreaterThan(0);
      expect(FLASH_MS.fast).toBeLessThan(FLASH_MS.slow);
    });

    it('defines SIZE_SCALE with S/M/L/XL', () => {
      expect(SIZE_SCALE).toHaveProperty('S');
      expect(SIZE_SCALE).toHaveProperty('M');
      expect(SIZE_SCALE).toHaveProperty('L');
      expect(SIZE_SCALE).toHaveProperty('XL');
    });
  });

  describe('CheerSettings schema', () => {
    it('validates valid settings', () => {
      const settings = {
        text: '우리 팀 우승!',
        textColor: 'white' as const,
        bgColor: 'coral' as const,
        effect: 'scroll' as const,
        speed: 'medium' as const,
        size: 'L' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('우리 팀 우승!');
      }
    });

    it('rejects empty text', () => {
      const settings = {
        text: '',
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('rejects text > MAX_LEN (80 chars)', () => {
      const settings = {
        text: 'a'.repeat(81),
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('accepts text of exactly MAX_LEN', () => {
      const settings = {
        text: 'a'.repeat(80),
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });

    it('rejects invalid textColor', () => {
      const settings = {
        text: 'Hello',
        textColor: 'invalid' as any,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('accepts all valid textColor swatches', () => {
      const colors = ['white', 'black', 'coral', 'sun', 'sky', 'grape', 'rose'] as const;
      colors.forEach((color) => {
        const settings = {
          text: 'test',
          textColor: color,
          bgColor: 'white' as const,
        };
        const result = cheerSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('accepts all valid bgColor swatches', () => {
      const colors = ['white', 'black', 'coral', 'sun', 'sky', 'grape', 'rose'] as const;
      colors.forEach((color) => {
        const settings = {
          text: 'test',
          textColor: 'white' as const,
          bgColor: color,
        };
        const result = cheerSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid effect', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
        effect: 'invalid' as any,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('defaults effect to "scroll"', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.effect).toBe('scroll');
      }
    });

    it('defaults speed to "medium"', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.speed).toBe('medium');
      }
    });

    it('defaults size to "L"', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.size).toBe('L');
      }
    });

    it('defaults sizeMode to "manual"', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sizeMode).toBe('manual');
      }
    });

    it('defaults deviceType to "mobile"', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deviceType).toBe('mobile');
      }
    });

    it('accepts sizeMode "auto" and deviceType "tablet"', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
        sizeMode: 'auto' as const,
        deviceType: 'tablet' as const,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sizeMode).toBe('auto');
        expect(result.data.deviceType).toBe('tablet');
      }
    });

    it('rejects invalid sizeMode', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
        sizeMode: 'invalid' as any,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('rejects invalid deviceType', () => {
      const settings = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
        deviceType: 'desktop' as any,
      };
      const result = cheerSettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });

    it('strips a legacy landscape field from stored settings (migration)', () => {
      // Old blobs persisted a `landscape` boolean; the schema should ignore it.
      const legacy = {
        text: 'Hello',
        textColor: 'white' as const,
        bgColor: 'black' as const,
        landscape: true,
      };
      const result = cheerSettingsSchema.safeParse(legacy);
      expect(result.success).toBe(true);
      if (result.success) {
        expect('landscape' in result.data).toBe(false);
      }
    });
  });

  describe('CheerStore schema', () => {
    it('validates valid store', () => {
      const store = {
        version: 1,
        recents: ['응원!', '화이팅!'],
        lastSettings: {
          text: '우리 팀 우승!',
          textColor: 'white' as const,
          bgColor: 'coral' as const,
          effect: 'scroll' as const,
          speed: 'medium' as const,
          size: 'L' as const,
        },
      };
      const result = cheerStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });

    it('rejects invalid version', () => {
      const store = {
        version: 0,
        recents: [],
        lastSettings: {
          text: 'test',
          textColor: 'white' as const,
          bgColor: 'black' as const,
        },
      };
      const result = cheerStoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer version', () => {
      const store = {
        version: 1.5,
        recents: [],
        lastSettings: {
          text: 'test',
          textColor: 'white' as const,
          bgColor: 'black' as const,
        },
      };
      const result = cheerStoreSchema.safeParse(store);
      expect(result.success).toBe(false);
    });

    it('defaults recents to empty array', () => {
      const store = {
        version: 1,
        lastSettings: {
          text: 'test',
          textColor: 'white' as const,
          bgColor: 'black' as const,
        },
      };
      const result = cheerStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recents).toEqual([]);
      }
    });

    it('accepts array of recent strings', () => {
      const store = {
        version: 1,
        recents: ['응원!', '화이팅!', 'Go team!'],
        lastSettings: {
          text: 'test',
          textColor: 'white' as const,
          bgColor: 'black' as const,
        },
      };
      const result = cheerStoreSchema.safeParse(store);
      expect(result.success).toBe(true);
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('has text = ""', () => {
      expect(DEFAULT_SETTINGS.text).toBe('');
    });

    it('has textColor = "white"', () => {
      expect(DEFAULT_SETTINGS.textColor).toBe('white');
    });

    it('has bgColor = "black"', () => {
      expect(DEFAULT_SETTINGS.bgColor).toBe('black');
    });

    it('has effect = "scroll"', () => {
      expect(DEFAULT_SETTINGS.effect).toBe('scroll');
    });

    it('has speed = "medium"', () => {
      expect(DEFAULT_SETTINGS.speed).toBe('medium');
    });

    it('has size = "L"', () => {
      expect(DEFAULT_SETTINGS.size).toBe('L');
    });

    it('has sizeMode = "manual"', () => {
      expect(DEFAULT_SETTINGS.sizeMode).toBe('manual');
    });

    it('has deviceType = "mobile"', () => {
      expect(DEFAULT_SETTINGS.deviceType).toBe('mobile');
    });

    it('does not include a landscape field', () => {
      expect('landscape' in DEFAULT_SETTINGS).toBe(false);
    });
  });
});
