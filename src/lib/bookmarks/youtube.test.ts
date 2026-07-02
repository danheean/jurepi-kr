import { describe, it, expect } from 'vitest';
import { extractYoutubeId, youtubeThumbUrl, youtubeEmbedUrl } from './youtube';

describe('extractYoutubeId', () => {
  describe('valid video URLs', () => {
    it('extracts ID from youtube.com/watch?v=ID', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=hoY1Z08VhH0');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('extracts ID from youtube.com/watch?v=ID with trailing params', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=hoY1Z08VhH0&t=120');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('extracts ID from youtube.com/watch?v=ID&list=PLAYLIST', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=hoY1Z08VhH0&list=PLxxx');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('extracts ID from youtu.be/ID', () => {
      const id = extractYoutubeId('https://youtu.be/hoY1Z08VhH0');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('extracts ID from youtu.be/ID with query params', () => {
      const id = extractYoutubeId('https://youtu.be/hoY1Z08VhH0?t=30');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('extracts ID from youtube.com/embed/ID', () => {
      const id = extractYoutubeId('https://www.youtube.com/embed/hoY1Z08VhH0');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('extracts ID from youtube.com/shorts/ID', () => {
      const id = extractYoutubeId('https://www.youtube.com/shorts/hoY1Z08VhH0');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('handles 11-character IDs correctly', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('works with http (non-HTTPS)', () => {
      const id = extractYoutubeId('http://www.youtube.com/watch?v=hoY1Z08VhH0');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('works without www subdomain', () => {
      const id = extractYoutubeId('https://youtube.com/watch?v=hoY1Z08VhH0');
      expect(id).toBe('hoY1Z08VhH0');
    });
  });

  describe('invalid/non-embeddable URLs', () => {
    it('returns null for YouTube channel URLs', () => {
      const id = extractYoutubeId('https://www.youtube.com/channel/UCFA9XVr5KlHZ7yW4H93udAA');
      expect(id).toBeNull();
    });

    it('returns null for YouTube @handle URLs', () => {
      const id = extractYoutubeId('https://www.youtube.com/@somehandle');
      expect(id).toBeNull();
    });

    it('returns null for YouTube /c/ URLs', () => {
      const id = extractYoutubeId('https://www.youtube.com/c/channelname');
      expect(id).toBeNull();
    });

    it('returns null for YouTube /user/ URLs', () => {
      const id = extractYoutubeId('https://www.youtube.com/user/username');
      expect(id).toBeNull();
    });

    it('returns null for playlist without video (list= only)', () => {
      const id = extractYoutubeId('https://www.youtube.com/playlist?list=PLxxx');
      expect(id).toBeNull();
    });

    it('returns null for YouTube search', () => {
      const id = extractYoutubeId('https://www.youtube.com/results?search_query=tutorial');
      expect(id).toBeNull();
    });

    it('returns null for non-YouTube URLs', () => {
      const id = extractYoutubeId('https://www.github.com/user/repo');
      expect(id).toBeNull();
    });

    it('returns null for empty string', () => {
      const id = extractYoutubeId('');
      expect(id).toBeNull();
    });

    it('returns null for malformed URLs', () => {
      const id = extractYoutubeId('not a url at all');
      expect(id).toBeNull();
    });

    it('returns null for URL without video ID', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=');
      expect(id).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('extracts ID when URL has multiple query params with & delimiters', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=hoY1Z08VhH0&t=10&list=PLxxx&index=5');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('handles youtu.be with multiple params', () => {
      const id = extractYoutubeId('https://youtu.be/hoY1Z08VhH0?t=10&list=PLxxx');
      expect(id).toBe('hoY1Z08VhH0');
    });

    it('rejects IDs shorter than 11 chars', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=short');
      expect(id).toBeNull();
    });

    it('rejects IDs longer than 11 chars', () => {
      const id = extractYoutubeId('https://www.youtube.com/watch?v=thisistoolongforid');
      expect(id).toBeNull();
    });
  });
});

describe('youtubeThumbUrl', () => {
  it('generates correct thumbnail URL', () => {
    const url = youtubeThumbUrl('hoY1Z08VhH0');
    expect(url).toBe('https://i.ytimg.com/vi/hoY1Z08VhH0/hqdefault.jpg');
  });

  it('works with any valid 11-char ID', () => {
    const url = youtubeThumbUrl('dQw4w9WgXcQ');
    expect(url).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });
});

describe('youtubeEmbedUrl', () => {
  it('generates correct embed URL', () => {
    const url = youtubeEmbedUrl('hoY1Z08VhH0');
    expect(url).toBe('https://www.youtube-nocookie.com/embed/hoY1Z08VhH0?autoplay=1&rel=0');
  });

  it('works with any valid 11-char ID', () => {
    const url = youtubeEmbedUrl('dQw4w9WgXcQ');
    expect(url).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
  });
});
