import { describe, it, expect } from 'vitest';
import {
  ParsedFieldsSchema,
  SettingsSchema,
  type ParsedFields,
  type Settings,
} from './schema';

describe('Zod schemas smoke tests', () => {
  describe('ParsedFieldsSchema', () => {
    it('should accept valid ParsedFields object', () => {
      const validFields: ParsedFields = {
        minute: [0, 15, 30, 45],
        hour: [9],
        dom: Array.from({ length: 31 }, (_, i) => i + 1),
        month: Array.from({ length: 12 }, (_, i) => i + 1),
        dow: Array.from({ length: 7 }, (_, i) => i),
        isValid: true,
      };

      expect(() => ParsedFieldsSchema.parse(validFields)).not.toThrow();
    });

    it('should accept ParsedFields with optional error field', () => {
      const fieldsWithError: ParsedFields = {
        minute: [],
        hour: [],
        dom: [],
        month: [],
        dow: [],
        isValid: false,
        error: {
          field: 'minute',
          message: 'Invalid minute value',
        },
      };

      expect(() => ParsedFieldsSchema.parse(fieldsWithError)).not.toThrow();
    });

    it('should reject ParsedFields with out-of-range minute', () => {
      const invalidFields = {
        minute: [61], // Out of range
        hour: [9],
        dom: [1],
        month: [1],
        dow: [1],
        isValid: true,
      };

      expect(() => ParsedFieldsSchema.parse(invalidFields)).toThrow();
    });

    it('should reject ParsedFields with out-of-range hour', () => {
      const invalidFields = {
        minute: [0],
        hour: [25], // Out of range
        dom: [1],
        month: [1],
        dow: [1],
        isValid: true,
      };

      expect(() => ParsedFieldsSchema.parse(invalidFields)).toThrow();
    });

    it('should reject ParsedFields with out-of-range dom', () => {
      const invalidFields = {
        minute: [0],
        hour: [9],
        dom: [32], // Out of range
        month: [1],
        dow: [1],
        isValid: true,
      };

      expect(() => ParsedFieldsSchema.parse(invalidFields)).toThrow();
    });

    it('should reject ParsedFields with out-of-range month', () => {
      const invalidFields = {
        minute: [0],
        hour: [9],
        dom: [1],
        month: [13], // Out of range
        dow: [1],
        isValid: true,
      };

      expect(() => ParsedFieldsSchema.parse(invalidFields)).toThrow();
    });

    it('should reject ParsedFields with out-of-range dow', () => {
      const invalidFields = {
        minute: [0],
        hour: [9],
        dom: [1],
        month: [1],
        dow: [7], // Out of range (0-6)
        isValid: true,
      };

      expect(() => ParsedFieldsSchema.parse(invalidFields)).toThrow();
    });
  });

  describe('SettingsSchema', () => {
    it('should accept valid Settings object', () => {
      const validSettings: Settings = {
        timezone: 'UTC',
        lastExpression: '0 9 * * MON-FRI',
        recents: ['0 9 * * *', '*/5 * * * *'],
      };

      expect(() => SettingsSchema.parse(validSettings)).not.toThrow();
    });

    it('should provide default values for optional fields', () => {
      const minimalSettings = {
        timezone: 'America/New_York',
      };

      const result = SettingsSchema.parse(minimalSettings);
      expect(result.timezone).toBe('America/New_York');
      expect(result.recents).toEqual([]); // Default empty array
    });

    it('should reject Settings with too many recents', () => {
      const tooManyRecents: Settings = {
        timezone: 'UTC',
        recents: Array.from({ length: 21 }, (_, i) => `expr${i}`),
      };

      expect(() => SettingsSchema.parse(tooManyRecents)).toThrow();
    });

    it('should accept Settings with exactly 20 recents', () => {
      const maxRecents: Settings = {
        timezone: 'UTC',
        recents: Array.from({ length: 20 }, (_, i) => `expr${i}`),
      };

      expect(() => SettingsSchema.parse(maxRecents)).not.toThrow();
    });

    it('should accept Settings with missing optional fields', () => {
      const partialSettings = {
        timezone: 'Local',
      };

      expect(() => SettingsSchema.parse(partialSettings)).not.toThrow();
    });
  });
});
