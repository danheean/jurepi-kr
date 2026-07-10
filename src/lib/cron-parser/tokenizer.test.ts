import { describe, it, expect } from 'vitest';
import { tokenizeCron } from './tokenizer';

describe('tokenizeCron', () => {
  it('should tokenize valid 5-field cron expression', () => {
    const result = tokenizeCron('0 9 * * MON-FRI');
    expect(result.success).toBe(true);
    expect(result.tokens).toHaveLength(5);
    expect(result.tokens?.[0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'literal', value: '0' }),
    ]));
  });

  it('should handle simple wildcards', () => {
    const result = tokenizeCron('* * * * *');
    expect(result.success).toBe(true);
    expect(result.tokens).toHaveLength(5);
  });

  it('should handle ranges like 1-5', () => {
    const result = tokenizeCron('0 9 * * 1-5');
    expect(result.success).toBe(true);
    expect(result.tokens?.[4]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'range' })])
    );
  });

  it('should handle steps like */15', () => {
    const result = tokenizeCron('*/15 * * * *');
    expect(result.success).toBe(true);
    expect(result.tokens?.[0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'step' })])
    );
  });

  it('should handle stepped ranges like 1-30/5', () => {
    const result = tokenizeCron('0 0 1-31/5 * *');
    expect(result.success).toBe(true);
  });

  it('should handle lists like 1,3,5', () => {
    const result = tokenizeCron('0 9 * * 1,3,5');
    expect(result.success).toBe(true);
    expect(result.tokens?.[4]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'list' })])
    );
  });

  it('should handle month names JAN-DEC', () => {
    const result = tokenizeCron('0 0 1 JAN-DEC *');
    expect(result.success).toBe(true);
    expect(result.tokens?.[3]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'range' })])
    );
  });

  it('should handle day names SUN-SAT', () => {
    const result = tokenizeCron('0 0 * * SUN-SAT');
    expect(result.success).toBe(true);
  });

  it('should fail on wrong number of fields', () => {
    const result = tokenizeCron('0 9 * *');
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('syntax');
  });

  it('should fail on unsupported Quartz syntax L', () => {
    const result = tokenizeCron('0 0 L * *');
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Quartz');
  });

  it('should fail on unsupported Quartz syntax W', () => {
    const result = tokenizeCron('0 0 1W * *');
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Quartz');
  });

  it('should fail on unsupported Quartz syntax #', () => {
    const result = tokenizeCron('0 0 * * MON#1');
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Quartz');
  });

  it('should fail on unsupported Quartz syntax ?', () => {
    const result = tokenizeCron('0 0 ? * *');
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Quartz');
  });

  it('should trim whitespace', () => {
    const result = tokenizeCron('  0  9  *  *  *  ');
    expect(result.success).toBe(true);
  });

  it('should handle macros starting with @', () => {
    const result = tokenizeCron('@daily');
    expect(result.success).toBe(true);
  });

  it('should handle mixed case names', () => {
    const result = tokenizeCron('0 0 * jan *');
    expect(result.success).toBe(true);
  });

  it('should handle tab separators', () => {
    const result = tokenizeCron('0\t9\t*\t*\t*');
    expect(result.success).toBe(true);
  });
});
