import { describe, it, expect } from 'vitest';
import { SHARE_TARGETS, buildShareUrl, type ShareTargetId } from './share-targets';

const URL_INPUT = 'https://apps.jurepi.kr/ko/tools/lunar-converter';
const TITLE_INPUT = '음력·양력 변환기 - 간지·띠 조회';

describe('SHARE_TARGETS', () => {
  it('lists the six external targets in display order', () => {
    expect(SHARE_TARGETS.map((t) => t.id)).toEqual([
      'naver',
      'x',
      'facebook',
      'threads',
      'telegram',
      'whatsapp',
    ]);
  });

  it('every target has an i18n label key', () => {
    for (const target of SHARE_TARGETS) {
      expect(target.labelKey).toMatch(/^targets\./);
    }
  });
});

describe('buildShareUrl', () => {
  const built: Record<ShareTargetId, string> = {
    naver: buildShareUrl('naver', { url: URL_INPUT, title: TITLE_INPUT }),
    x: buildShareUrl('x', { url: URL_INPUT, title: TITLE_INPUT }),
    facebook: buildShareUrl('facebook', { url: URL_INPUT, title: TITLE_INPUT }),
    threads: buildShareUrl('threads', { url: URL_INPUT, title: TITLE_INPUT }),
    telegram: buildShareUrl('telegram', { url: URL_INPUT, title: TITLE_INPUT }),
    whatsapp: buildShareUrl('whatsapp', { url: URL_INPUT, title: TITLE_INPUT }),
  };

  it('builds the Naver share view URL with url and title', () => {
    expect(built.naver.startsWith('https://share.naver.com/web/shareView?')).toBe(true);
    const parsed = new URL(built.naver);
    expect(parsed.searchParams.get('url')).toBe(URL_INPUT);
    expect(parsed.searchParams.get('title')).toBe(TITLE_INPUT);
  });

  it('builds the X intent URL with url and text', () => {
    const parsed = new URL(built.x);
    expect(parsed.origin + parsed.pathname).toBe('https://twitter.com/intent/tweet');
    expect(parsed.searchParams.get('url')).toBe(URL_INPUT);
    expect(parsed.searchParams.get('text')).toBe(TITLE_INPUT);
  });

  it('builds the Facebook sharer URL with u', () => {
    const parsed = new URL(built.facebook);
    expect(parsed.origin + parsed.pathname).toBe('https://www.facebook.com/sharer/sharer.php');
    expect(parsed.searchParams.get('u')).toBe(URL_INPUT);
  });

  it('builds the Threads intent URL with title and url in text', () => {
    const parsed = new URL(built.threads);
    expect(parsed.origin + parsed.pathname).toBe('https://www.threads.net/intent/post');
    const text = parsed.searchParams.get('text');
    expect(text).toContain(TITLE_INPUT);
    expect(text).toContain(URL_INPUT);
  });

  it('builds the Telegram share URL with url and text', () => {
    const parsed = new URL(built.telegram);
    expect(parsed.origin + parsed.pathname).toBe('https://t.me/share/url');
    expect(parsed.searchParams.get('url')).toBe(URL_INPUT);
    expect(parsed.searchParams.get('text')).toBe(TITLE_INPUT);
  });

  it('builds the WhatsApp share URL with title and url in text', () => {
    const parsed = new URL(built.whatsapp);
    expect(parsed.origin + parsed.pathname).toBe('https://wa.me/');
    const text = parsed.searchParams.get('text');
    expect(text).toContain(TITLE_INPUT);
    expect(text).toContain(URL_INPUT);
  });

  it('percent-encodes reserved characters in url and title', () => {
    const tricky = buildShareUrl('x', {
      url: 'https://apps.jurepi.kr/ko/tools/a?b=1&c=2',
      title: 'A & B ? #tag',
    });
    const parsed = new URL(tricky);
    expect(parsed.searchParams.get('url')).toBe('https://apps.jurepi.kr/ko/tools/a?b=1&c=2');
    expect(parsed.searchParams.get('text')).toBe('A & B ? #tag');
  });

  it('is a pure function: same input → same output', () => {
    expect(buildShareUrl('facebook', { url: URL_INPUT, title: TITLE_INPUT })).toBe(built.facebook);
  });
});
