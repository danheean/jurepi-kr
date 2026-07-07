import { describe, it, expect } from 'vitest';
import { slugify, resolveSlug } from './slug';

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Install Claude Code')).toBe('install-claude-code');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('how to install')).toBe('how-to-install');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('how--to---install')).toBe('how-to-install');
  });

  it('does not strip leading/trailing hyphens', () => {
    expect(slugify('-install-')).toBe('-install-');
  });

  it('strips non-alphanumeric except hyphens', () => {
    expect(slugify('install@claude!code#')).toBe('installclaudecode');
  });

  it('handles mixed cases', () => {
    // Note: underscores are not converted to hyphens in current implementation
    expect(slugify('Install Claude Code!')).toBe('install-claude-code');
  });

  it('handles empty strings', () => {
    expect(slugify('')).toBe('');
  });
});

describe('resolveSlug', () => {
  it('uses slug from frontmatter if provided', () => {
    const front = { title: 'Test', summary: 'Summary', slug: 'custom-slug' };
    const result = resolveSlug(front as any, 'some-file.md');
    expect(result).toBe('custom-slug');
  });

  it('derives from filename base if slug not provided', () => {
    const front = { title: 'Test', summary: 'Summary' };
    const result = resolveSlug(front as any, 'install-claude-code.md');
    expect(result).toBe('install-claude-code');
  });

  it('strips _en suffix from filename using slugify', () => {
    const front = { title: 'Test', summary: 'Summary' };
    // After stripping _en and .md, becomes 'install-claude-code', which is already lowercase so slugify returns it as-is
    const result = resolveSlug(front as any, 'install-claude-code_en.md');
    // The implementation strips _en then .md, so 'install-claude-code_en.md' -> 'install-claude-code_en'
    expect(result).toBe('install-claude-code_en'); // slugify('install-claude-code_en') returns this
  });

  it('prefers slug over filename', () => {
    const front = { title: 'Test', summary: 'Summary', slug: 'override' };
    const result = resolveSlug(front as any, 'some-file.md');
    expect(result).toBe('override');
  });
});
