import { describe, it, expect } from 'vitest';
import { buildMarkdownDocument } from './buildMarkdownDocument';

describe('buildMarkdownDocument', () => {
  it('assembles title heading, source blockquote, and body in order', () => {
    const result = buildMarkdownDocument({
      title: '클로드 코드 설치하는 법',
      sourceUrl: 'https://apps.jurepi.kr/ko/tools/howto/install-claude-code',
      sourceLabel: '출처',
      markdown: '## 준비물\n- Node.js 20 이상',
    });

    expect(result).toBe(
      '# 클로드 코드 설치하는 법\n\n' +
        '> 출처: https://apps.jurepi.kr/ko/tools/howto/install-claude-code\n\n' +
        '## 준비물\n- Node.js 20 이상'
    );
  });

  it('omits the source blockquote when no sourceUrl is given', () => {
    const result = buildMarkdownDocument({
      title: 'Vibe Coding',
      markdown: 'A modern way to build software.',
    });

    expect(result).toBe('# Vibe Coding\n\nA modern way to build software.');
    expect(result).not.toContain('>');
  });

  it('uses the localized source label (English)', () => {
    const result = buildMarkdownDocument({
      title: 'Andrej Karpathy',
      sourceUrl: 'https://apps.jurepi.kr/en/tools/dev-people/andrej-karpathy',
      sourceLabel: 'Source',
      markdown: 'A researcher and educator.',
    });

    expect(result).toContain('> Source: https://apps.jurepi.kr/en/tools/dev-people/andrej-karpathy');
  });

  it('trims surrounding whitespace on title and body so the document is clean', () => {
    const result = buildMarkdownDocument({
      title: '  Spacing Test  ',
      markdown: '\n\n  body with padding  \n\n',
    });

    expect(result).toBe('# Spacing Test\n\nbody with padding');
  });

  it('falls back to a default label when sourceUrl is present but no label given', () => {
    const result = buildMarkdownDocument({
      title: 'T',
      sourceUrl: 'https://example.com',
      markdown: 'body',
    });

    expect(result).toBe('# T\n\n> Source: https://example.com\n\nbody');
  });
});
