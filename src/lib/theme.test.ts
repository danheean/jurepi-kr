import { describe, it, expect } from 'vitest';
import {
  resolveTheme,
  isThemePref,
  DEFAULT_THEME_PREF,
  ThemePref,
} from './theme';

describe('resolveTheme', () => {
  it('returns "light" when preference is "light"', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('returns "dark" when preference is "dark"', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('returns "light" when preference is "system" and system prefers light', () => {
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('returns "dark" when preference is "system" and system prefers dark', () => {
    expect(resolveTheme('system', true)).toBe('dark');
  });
});

describe('isThemePref', () => {
  it('returns true for "light"', () => {
    expect(isThemePref('light')).toBe(true);
  });

  it('returns true for "dark"', () => {
    expect(isThemePref('dark')).toBe(true);
  });

  it('returns true for "system"', () => {
    expect(isThemePref('system')).toBe(true);
  });

  it('returns false for null', () => {
    expect(isThemePref(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isThemePref(undefined)).toBe(false);
  });

  it('returns false for "auto"', () => {
    expect(isThemePref('auto')).toBe(false);
  });

  it('returns false for 42 (number)', () => {
    expect(isThemePref(42)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isThemePref('')).toBe(false);
  });

  it('returns false for object', () => {
    expect(isThemePref({})).toBe(false);
  });
});

describe('DEFAULT_THEME_PREF', () => {
  it('is "light"', () => {
    expect(DEFAULT_THEME_PREF).toBe('light');
  });

  it('is a valid ThemePref', () => {
    expect(isThemePref(DEFAULT_THEME_PREF)).toBe(true);
  });
});
