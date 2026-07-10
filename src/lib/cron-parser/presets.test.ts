import { describe, it, expect } from 'vitest';
import { PRESET_EXPRESSIONS } from './presets';
import { parseCron } from './parser';

describe('PRESET_EXPRESSIONS smoke tests', () => {
  it('should have non-empty preset list', () => {
    expect(PRESET_EXPRESSIONS).toBeDefined();
    expect(Array.isArray(PRESET_EXPRESSIONS)).toBe(true);
    expect(PRESET_EXPRESSIONS.length).toBeGreaterThan(0);
  });

  it('should have all required fields on each preset', () => {
    for (const preset of PRESET_EXPRESSIONS) {
      expect(preset.id).toBeDefined();
      expect(typeof preset.id).toBe('string');
      expect(preset.expression).toBeDefined();
      expect(typeof preset.expression).toBe('string');
      expect(preset.descriptionKey).toBeDefined();
      expect(typeof preset.descriptionKey).toBe('string');
    }
  });

  it('should have all preset expressions parse without error', () => {
    for (const preset of PRESET_EXPRESSIONS) {
      const result = parseCron(preset.expression);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it('should have unique preset IDs', () => {
    const ids = PRESET_EXPRESSIONS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have reasonable preset expressions', () => {
    for (const preset of PRESET_EXPRESSIONS) {
      // Each expression should have 5 fields OR be a macro (@...)
      const trimmed = preset.expression.trim();
      if (trimmed.startsWith('@')) {
        // Macro format is allowed
        expect(trimmed).toMatch(/^@\w+$/);
      } else {
        // Standard format should have 5 fields
        const fields = trimmed.split(/\s+/);
        expect(fields.length).toBe(5);
      }
    }
  });
});
