import { describe, it, expect } from 'vitest';
import {
  googleImageUrl,
  otanjoubiUrl,
  converterUrl,
} from './external-links';

describe('birthday-secret/external-links', () => {
  describe('googleImageUrl', () => {
    it('builds Google Images search URL', () => {
      const url = googleImageUrl('garnet birthstone');
      expect(url).toContain('https://www.google.com/search');
      expect(url).toContain('tbm=isch');
      expect(url).toContain('q=');
    });

    it('encodes query properly', () => {
      const url = googleImageUrl('석류석 탄생석');
      expect(url).toContain(encodeURIComponent('석류석 탄생석'));
      expect(url).not.toContain('석류석 탄생석'); // Raw Korean shouldn't appear
    });

    it('encodes spaces correctly', () => {
      const url = googleImageUrl('june birthstone');
      expect(url).toContain('%20'); // Encoded space
    });
  });

  describe('otanjoubiUrl', () => {
    it('builds otanjoubi.jp URL with month and day', () => {
      const url = otanjoubiUrl(6, 21);
      expect(url).toContain('https://otanjoubi.jp/ko/select.php');
      expect(url).toContain('month=6');
      expect(url).toContain('day=21');
    });

    it('handles single-digit months and days', () => {
      const url = otanjoubiUrl(1, 5);
      expect(url).toContain('month=1');
      expect(url).toContain('day=5');
    });

    it('handles double-digit months and days', () => {
      const url = otanjoubiUrl(12, 25);
      expect(url).toContain('month=12');
      expect(url).toContain('day=25');
    });
  });

  describe('converterUrl', () => {
    it('builds converter URL for ko locale', () => {
      const url = converterUrl('ko');
      expect(url).toContain('/ko/tools/lunar-converter');
    });

    it('builds converter URL for en locale', () => {
      const url = converterUrl('en');
      expect(url).toContain('/en/tools/lunar-converter');
    });

    it('returns relative URL', () => {
      const url = converterUrl('ko');
      expect(url).toMatch(/^\/[a-z]{2}\/tools\/lunar-converter$/);
    });
  });
});
