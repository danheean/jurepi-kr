import { describe, it, expect } from 'vitest';
import { expandMacro } from './macros';

describe('expandMacro', () => {
  it('should expand @yearly to 0 0 1 1 *', () => {
    const result = expandMacro('@yearly');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
    expect(result.hour).toEqual([0]);
    expect(result.dom).toEqual([1]);
    expect(result.month).toEqual([1]);
    expect(result.dow.length).toBe(7); // wildcard
  });

  it('should expand @annually to 0 0 1 1 *', () => {
    const result = expandMacro('@annually');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
    expect(result.hour).toEqual([0]);
    expect(result.dom).toEqual([1]);
    expect(result.month).toEqual([1]);
  });

  it('should expand @monthly to 0 0 1 * *', () => {
    const result = expandMacro('@monthly');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
    expect(result.hour).toEqual([0]);
    expect(result.dom).toEqual([1]);
    expect(result.month.length).toBe(12); // wildcard
    expect(result.dow.length).toBe(7); // wildcard
  });

  it('should expand @weekly to 0 0 * * 0', () => {
    const result = expandMacro('@weekly');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
    expect(result.hour).toEqual([0]);
    expect(result.dom.length).toBe(31); // wildcard
    expect(result.month.length).toBe(12); // wildcard
    expect(result.dow).toEqual([0]);
  });

  it('should expand @daily to 0 0 * * *', () => {
    const result = expandMacro('@daily');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
    expect(result.hour).toEqual([0]);
    expect(result.dom.length).toBe(31); // wildcard
    expect(result.month.length).toBe(12); // wildcard
    expect(result.dow.length).toBe(7); // wildcard
  });

  it('should expand @midnight to 0 0 * * *', () => {
    const result = expandMacro('@midnight');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
    expect(result.hour).toEqual([0]);
  });

  it('should expand @hourly to 0 * * * *', () => {
    const result = expandMacro('@hourly');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
    expect(result.hour.length).toBe(24); // wildcard
    expect(result.dom.length).toBe(31); // wildcard
    expect(result.month.length).toBe(12); // wildcard
    expect(result.dow.length).toBe(7); // wildcard
  });

  it('should handle uppercase @YEARLY', () => {
    const result = expandMacro('@YEARLY');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
  });

  it('should handle lowercase @yearly with whitespace', () => {
    const result = expandMacro('  @yearly  ');
    expect(result.isValid).toBe(true);
    expect(result.minute).toEqual([0]);
  });

  it('should fail on unknown macro @hourlyy', () => {
    const result = expandMacro('@hourlyy');
    expect(result.isValid).toBe(false);
    expect(result.error?.field).toBe('macro');
    expect(result.error?.message).toContain('Unknown macro');
  });

  it('should fail on unknown macro @daily2', () => {
    const result = expandMacro('@daily2');
    expect(result.isValid).toBe(false);
    expect(result.error?.field).toBe('macro');
  });

  it('should fail on non-existent macro @invalid', () => {
    const result = expandMacro('@invalid');
    expect(result.isValid).toBe(false);
    expect(result.error?.message).toContain('Unknown macro');
    expect(result.error?.message).toContain('Valid macros');
  });
});
