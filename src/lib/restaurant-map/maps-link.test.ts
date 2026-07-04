import { describe, it, expect } from 'vitest';
import { placeMapUrl } from './maps-link';

describe('placeMapUrl', () => {
  const base = { name: '장충동 왕족발집', address: '서울 중구 장충단로 174' };

  it('uses a real authored link as-is', () => {
    const url = placeMapUrl({ ...base, link: 'https://map.naver.com/p/entry/place/11592234' });
    expect(url).toBe('https://map.naver.com/p/entry/place/11592234');
  });

  it('falls back to a NAVER search URL for placeholder links', () => {
    const url = placeMapUrl({ ...base, link: 'https://map.naver.com/p/entry/place/example1' });
    expect(url).toContain('https://map.naver.com/p/search/');
    expect(url).toContain(encodeURIComponent('장충동 왕족발집 서울 중구 장충단로 174'));
  });

  it('falls back to a NAVER search URL when link is absent', () => {
    const url = placeMapUrl(base);
    expect(url).toBe(
      `https://map.naver.com/p/search/${encodeURIComponent('장충동 왕족발집 서울 중구 장충단로 174')}`
    );
  });

  it('falls back for non-http links', () => {
    const url = placeMapUrl({ ...base, link: 'javascript:alert(1)' });
    expect(url).toContain('https://map.naver.com/p/search/');
  });

  it('encodes English names + addresses', () => {
    const url = placeMapUrl({ name: 'Jangchung Jokbal', address: '174 Jangchungdan-ro' });
    expect(url).toBe(
      `https://map.naver.com/p/search/${encodeURIComponent('Jangchung Jokbal 174 Jangchungdan-ro')}`
    );
  });
});
