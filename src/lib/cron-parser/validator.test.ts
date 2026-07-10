import { describe, it, expect } from 'vitest';
import { validateFields } from './validator';

describe('validateFields', () => {
  it('should return valid for all-wildcard expression', () => {
    const fields = {
      minute: Array.from({ length: 60 }, (_, i) => i),
      hour: Array.from({ length: 24 }, (_, i) => i),
      dom: Array.from({ length: 31 }, (_, i) => i + 1),
      month: Array.from({ length: 12 }, (_, i) => i + 1),
      dow: Array.from({ length: 7 }, (_, i) => i),
      isValid: true,
    };
    const result = validateFields(fields);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid for dom-only constraint', () => {
    const fields = {
      minute: [0],
      hour: [9],
      dom: [15],
      month: Array.from({ length: 12 }, (_, i) => i + 1),
      dow: Array.from({ length: 7 }, (_, i) => i),
      isValid: true,
    };
    const result = validateFields(fields);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid for dow-only constraint', () => {
    const fields = {
      minute: [0],
      hour: [9],
      dom: Array.from({ length: 31 }, (_, i) => i + 1),
      month: Array.from({ length: 12 }, (_, i) => i + 1),
      dow: [1, 2, 3, 4, 5],
      isValid: true,
    };
    const result = validateFields(fields);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid for both dom and dow specified (OR semantics)', () => {
    const fields = {
      minute: [0],
      hour: [9],
      dom: [15],
      month: Array.from({ length: 12 }, (_, i) => i + 1),
      dow: [1],
      isValid: true,
    };
    const result = validateFields(fields);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
