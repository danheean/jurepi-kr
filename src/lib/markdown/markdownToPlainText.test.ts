import { describe, it, expect } from 'vitest';
import { markdownToPlainText, truncateToLength } from './markdownToPlainText';

describe('markdownToPlainText', () => {
  it('should strip markdown bold markers', () => {
    expect(markdownToPlainText('**hello** world')).toBe('hello world');
  });

  it('should strip markdown italic markers', () => {
    expect(markdownToPlainText('*hello* world')).toBe('hello world');
  });

  it('should strip markdown code markers', () => {
    expect(markdownToPlainText('`code` and `more`')).toBe('code and more');
  });

  it('should strip code blocks', () => {
    expect(markdownToPlainText('before\n```\ncode block\n```\nafter')).toBe('before after');
  });

  it('should convert links to text only', () => {
    expect(markdownToPlainText('[Google](https://google.com)')).toBe('Google');
  });

  it('should strip headings', () => {
    expect(markdownToPlainText('# Heading 1\nSome text')).toBe('Heading 1 Some text');
  });

  it('should strip heading level 2', () => {
    expect(markdownToPlainText('## Heading 2')).toBe('Heading 2');
  });

  it('should strip heading level 3', () => {
    expect(markdownToPlainText('### Heading 3')).toBe('Heading 3');
  });

  it('should strip list markers', () => {
    expect(markdownToPlainText('- item 1\n- item 2\n* item 3')).toBe('item 1 item 2 item 3');
  });

  it('should strip numbered list markers', () => {
    expect(markdownToPlainText('1. item 1\n2. item 2')).toBe('item 1 item 2');
  });

  it('should strip blockquote markers', () => {
    expect(markdownToPlainText('> quote\n> more')).toBe('quote more');
  });

  it('should collapse multiple spaces to single space', () => {
    expect(markdownToPlainText('hello    world')).toBe('hello world');
  });

  it('should collapse newlines to single space', () => {
    expect(markdownToPlainText('line 1\nline 2\n\nline 3')).toBe('line 1 line 2 line 3');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(markdownToPlainText('  hello world  ')).toBe('hello world');
  });

  it('should handle plain text passthrough', () => {
    expect(markdownToPlainText('plain text with no markdown')).toBe('plain text with no markdown');
  });

  it('should handle empty string', () => {
    expect(markdownToPlainText('')).toBe('');
  });

  it('should handle complex markdown', () => {
    const md = '# Title\n\nSome **bold** and *italic* text. [Link](http://example.com)\n\n- item 1\n- item 2\n\n```\ncode\n```';
    const result = markdownToPlainText(md);
    expect(result).toContain('Title');
    expect(result).toContain('bold');
    expect(result).toContain('italic');
    expect(result).toContain('Link');
    expect(result).toContain('item 1');
    expect(result).toContain('item 2');
  });

  it('should strip image syntax', () => {
    expect(markdownToPlainText('![alt](image.jpg)')).toBe('');
  });

  it('should handle reference-style links', () => {
    const md = '[link][ref]\n\n[ref]: https://example.com';
    const result = markdownToPlainText(md);
    expect(result).toContain('link');
  });
});

describe('truncateToLength', () => {
  it('should return string unchanged if under max chars', () => {
    expect(truncateToLength('hello', 10)).toBe('hello');
  });

  it('should truncate at max chars with ellipsis', () => {
    const result = truncateToLength('hello world', 8);
    expect(result.length).toBeGreaterThan(8);
    expect(result).toMatch(/…$/);
  });

  it('should break at word boundary', () => {
    const result = truncateToLength('hello world foo', 12);
    expect(result).toContain('hello');
    expect(result).not.toContain('foo');
  });

  it('should use default max of 160 chars', () => {
    const long = 'a'.repeat(200);
    const result = truncateToLength(long);
    expect(result.length).toBeLessThanOrEqual(164); // 160 + "…"
  });

  it('should handle single word longer than max', () => {
    const result = truncateToLength('verylongword', 5);
    expect(result).toMatch(/…$/);
  });

  it('should handle empty string', () => {
    expect(truncateToLength('', 100)).toBe('');
  });
});
