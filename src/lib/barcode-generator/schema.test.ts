/**
 * Barcode Generator — zod Schema Tests
 */

import { describe, it, expect } from 'vitest';
import {
  BarcodeFormatSchema,
  BarcodeInputSchema,
  BarcodeOptionsSchema,
  BarcodeStoreSchema,
} from './schema';

describe('BarcodeFormatSchema', () => {
  it('accepts all four supported formats', () => {
    for (const format of ['EAN13', 'UPC', 'CODE39', 'CODE128']) {
      expect(BarcodeFormatSchema.safeParse(format).success).toBe(true);
    }
  });

  it('rejects an unsupported format', () => {
    expect(BarcodeFormatSchema.safeParse('QR').success).toBe(false);
  });
});

describe('BarcodeInputSchema', () => {
  it('accepts a valid input', () => {
    const result = BarcodeInputSchema.safeParse({ data: '978014300723', format: 'EAN13' });
    expect(result.success).toBe(true);
  });

  it('rejects empty data', () => {
    const result = BarcodeInputSchema.safeParse({ data: '', format: 'EAN13' });
    expect(result.success).toBe(false);
  });

  it('rejects data longer than 256 characters', () => {
    const result = BarcodeInputSchema.safeParse({ data: 'a'.repeat(257), format: 'CODE128' });
    expect(result.success).toBe(false);
  });

  it('accepts data at exactly the 256 character boundary', () => {
    const result = BarcodeInputSchema.safeParse({ data: 'a'.repeat(256), format: 'CODE128' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid format', () => {
    const result = BarcodeInputSchema.safeParse({ data: '123', format: 'INVALID' });
    expect(result.success).toBe(false);
  });
});

describe('BarcodeOptionsSchema', () => {
  it('accepts explicit valid options', () => {
    const result = BarcodeOptionsSchema.safeParse({ width: 250, textVisible: false });
    expect(result.success).toBe(true);
  });

  it('applies defaults when fields are omitted', () => {
    const result = BarcodeOptionsSchema.parse({});
    expect(result.width).toBe(200);
    expect(result.textVisible).toBe(true);
  });

  it('rejects width below the 100px minimum', () => {
    const result = BarcodeOptionsSchema.safeParse({ width: 99 });
    expect(result.success).toBe(false);
  });

  it('rejects width above the 300px maximum', () => {
    const result = BarcodeOptionsSchema.safeParse({ width: 301 });
    expect(result.success).toBe(false);
  });
});

describe('BarcodeStoreSchema', () => {
  const validStore = {
    version: 1 as const,
    recentInputs: ['978014300723', 'Hello, World!'],
    lastFormat: 'EAN13' as const,
    lastWidth: 200,
  };

  it('accepts a valid store payload', () => {
    expect(BarcodeStoreSchema.safeParse(validStore).success).toBe(true);
  });

  it('accepts an empty recentInputs array', () => {
    const result = BarcodeStoreSchema.safeParse({ ...validStore, recentInputs: [] });
    expect(result.success).toBe(true);
  });

  it('rejects a version other than 1 (future/foreign store shape)', () => {
    const result = BarcodeStoreSchema.safeParse({ ...validStore, version: 2 });
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 recent inputs', () => {
    const result = BarcodeStoreSchema.safeParse({
      ...validStore,
      recentInputs: Array.from({ length: 6 }, (_, i) => `input-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a recent input longer than 100 characters', () => {
    const result = BarcodeStoreSchema.safeParse({
      ...validStore,
      recentInputs: ['a'.repeat(101)],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid lastFormat', () => {
    const result = BarcodeStoreSchema.safeParse({ ...validStore, lastFormat: 'QR' });
    expect(result.success).toBe(false);
  });

  it('rejects lastWidth outside the 100–300 range', () => {
    const result = BarcodeStoreSchema.safeParse({ ...validStore, lastWidth: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects malformed/corrupted JSON shapes without throwing', () => {
    const result = BarcodeStoreSchema.safeParse({ garbage: true });
    expect(result.success).toBe(false);
  });
});
