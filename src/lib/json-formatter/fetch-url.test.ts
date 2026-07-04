import { describe, it, expect, vi } from 'vitest';
import { validateJsonUrl, fetchJsonFromUrl } from './fetch-url';

describe('fetch-url.ts', () => {
  describe('validateJsonUrl', () => {
    it('accepts valid http URL', () => {
      const result = validateJsonUrl('http://example.com/data.json');
      expect(result.ok).toBe(true);
      expect((result as any).url).toBeDefined();
    });

    it('accepts valid https URL', () => {
      const result = validateJsonUrl('https://api.example.com/v1/data');
      expect(result.ok).toBe(true);
      expect((result as any).url).toBeDefined();
    });

    it('rejects javascript: URL', () => {
      const result = validateJsonUrl('javascript:alert("xss")');
      expect(result.ok).toBe(false);
      expect((result as any).error.code).toBe('invalid_url');
    });

    it('rejects data: URL', () => {
      const result = validateJsonUrl('data:text/json,{}');
      expect(result.ok).toBe(false);
      expect((result as any).error.code).toBe('invalid_url');
    });

    it('rejects file: URL', () => {
      const result = validateJsonUrl('file:///etc/passwd');
      expect(result.ok).toBe(false);
      expect((result as any).error.code).toBe('invalid_url');
    });

    it('rejects ftp: URL', () => {
      const result = validateJsonUrl('ftp://ftp.example.com/file.txt');
      expect(result.ok).toBe(false);
      expect((result as any).error.code).toBe('invalid_url');
    });

    it('rejects empty string', () => {
      const result = validateJsonUrl('');
      expect(result.ok).toBe(false);
      expect((result as any).error.code).toBe('invalid_url');
    });

    it('rejects whitespace-only string', () => {
      const result = validateJsonUrl('   ');
      expect(result.ok).toBe(false);
      expect((result as any).error.code).toBe('invalid_url');
    });

    it('rejects invalid URLs', () => {
      const result = validateJsonUrl('not a url');
      expect(result.ok).toBe(false);
      expect((result as any).error.code).toBe('invalid_url');
    });

    it('trims whitespace from URLs', () => {
      const result = validateJsonUrl('  https://example.com/data.json  ');
      expect(result.ok).toBe(true);
    });

    it('normalizes URLs', () => {
      const result = validateJsonUrl('https://example.com/path?a=1&b=2');
      expect(result.ok).toBe(true);
    });
  });

  describe('fetchJsonFromUrl', () => {
    it('fetches and returns text on success', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '10' }),
        text: vi.fn().mockResolvedValue('{"test": 1}'),
      });

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        fetchImpl: mockFetch,
      });

      expect('text' in result).toBe(true);
      expect((result as any).text).toBe('{"test": 1}');
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/data.json');
    });

    it('returns http_error for non-200 responses', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('Not Found'),
      });

      const result = await fetchJsonFromUrl('https://example.com/not-found', {
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('http_error');
      expect((result as any).error.httpStatus).toBe(404);
    });

    it('returns too_large when Content-Length exceeds maxBytes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '11000000' }), // 11MB
        text: vi.fn(),
      });

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        maxBytes: 10 * 1024 * 1024,
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('too_large');
    });

    it('returns too_large when actual body exceeds maxBytes', async () => {
      const largeBody = 'x'.repeat(11 * 1024 * 1024);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue(largeBody),
      });

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        maxBytes: 10 * 1024 * 1024,
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('too_large');
    });

    it('returns cors_or_network for TypeError', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('NetworkError'));

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('cors_or_network');
    });

    it('returns empty_body for empty response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('empty_body');
    });

    it('returns empty_body for whitespace-only response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('   \n\t  '),
      });

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('empty_body');
    });

    it('uses default maxBytes of 10MB', async () => {
      const largeBody = 'x'.repeat(11 * 1024 * 1024);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue(largeBody),
      });

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('too_large');
    });

    it('handles different HTTP error codes', async () => {
      const testCodes = [400, 403, 500, 502, 503];

      for (const status of testCodes) {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          headers: new Headers(),
          text: vi.fn().mockResolvedValue('Error'),
        });

        const result = await fetchJsonFromUrl('https://example.com/data', {
          fetchImpl: mockFetch,
        });

        expect('error' in result).toBe(true);
        expect((result as any).error.code).toBe('http_error');
        expect((result as any).error.httpStatus).toBe(status);
      }
    });

    it('handles custom maxBytes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '1100' }),
        text: vi.fn(),
      });

      const result = await fetchJsonFromUrl('https://example.com/data.json', {
        maxBytes: 1000,
        fetchImpl: mockFetch,
      });

      expect('error' in result).toBe(true);
      expect((result as any).error.code).toBe('too_large');
    });

    it('does not throw on error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      expect(async () => {
        await fetchJsonFromUrl('https://example.com/data.json', {
          fetchImpl: mockFetch,
        });
      }).not.toThrow();
    });
  });
});
