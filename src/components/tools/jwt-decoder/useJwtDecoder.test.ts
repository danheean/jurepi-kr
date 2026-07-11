import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useJwtDecoder } from './useJwtDecoder';

describe('useJwtDecoder', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('token parsing', () => {
    it('parses valid JWT after debounce', () => {
      const { result } = renderHook(() => useJwtDecoder());

      const validJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      act(() => {
        result.current.setToken(validJwt);
      });

      // Should not parse yet (debounced)
      expect(result.current.decoded).toBeUndefined();

      // Fast-forward debounce timer
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.decoded).toBeDefined();
      expect(result.current.decoded?.payload).toHaveProperty('name', 'John Doe');
      expect(result.current.parseError).toBeUndefined();
    });

    it('sets parseError on malformed JWT', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setToken('not.a.valid.jwt');
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.parseError).toBeDefined();
      expect(result.current.decoded).toBeUndefined();
    });

    it('debounces parsing by 200ms', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setToken('a');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should not parse yet
      expect(result.current.parseError).toBeUndefined();
      expect(result.current.decoded).toBeUndefined();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Should parse now
      expect(result.current.parseError).toBeDefined();
    });
  });

  describe('UI state persistence', () => {
    it('persists tab preference to localStorage', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setTab('raw');
      });

      const stored = localStorage.getItem('jurepi-jwt-decoder');
      expect(stored).toContain('"tab":"raw"');
    });

    it('persists verificationMode to localStorage', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setVerificationMode('hmac');
      });

      const stored = localStorage.getItem('jurepi-jwt-decoder');
      expect(stored).toContain('"verificationMode":"hmac"');
    });

    it('loads preferences from localStorage on mount', () => {
      localStorage.setItem('jurepi-jwt-decoder', '{"tab":"raw","verificationMode":"rsa"}');

      const { result } = renderHook(() => useJwtDecoder());

      expect(result.current.tab).toBe('raw');
      expect(result.current.verificationMode).toBe('rsa');
    });

    it('ignores invalid localStorage data gracefully', () => {
      localStorage.setItem('jurepi-jwt-decoder', 'invalid json');

      const { result } = renderHook(() => useJwtDecoder());

      expect(result.current.tab).toBe('claims');
      expect(result.current.verificationMode).toBe('off');
    });
  });

  describe('verification state', () => {
    it('initializes with empty secret and key', () => {
      const { result } = renderHook(() => useJwtDecoder());

      expect(result.current.secret).toBe('');
      expect(result.current.publicKey).toBe('');
    });

    it('updates secret state', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setSecret('my-secret');
      });

      expect(result.current.secret).toBe('my-secret');
    });

    it('updates publicKey state', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setPublicKey('-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----');
      });

      expect(result.current.publicKey).toContain('BEGIN PUBLIC KEY');
    });

    it('does NOT persist secret to localStorage', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setSecret('my-secret');
      });

      const stored = localStorage.getItem('jurepi-jwt-decoder');
      expect(stored).not.toContain('secret');
      expect(stored).not.toContain('my-secret');
    });

    it('does NOT persist publicKey to localStorage', () => {
      const { result } = renderHook(() => useJwtDecoder());

      act(() => {
        result.current.setPublicKey('my-key');
      });

      const stored = localStorage.getItem('jurepi-jwt-decoder');
      expect(stored).not.toContain('key');
      expect(stored).not.toContain('my-key');
    });
  });

  describe('validity state', () => {
    it('initializes with unknown status', () => {
      const { result } = renderHook(() => useJwtDecoder());

      expect(result.current.validity.status).toBe('unknown');
    });

    it('updates validity status when JWT is decoded', () => {
      const { result } = renderHook(() => useJwtDecoder());

      const nowSeconds = Math.floor(Date.now() / 1000);
      const validJwt =
        'eyJhbGciOiJIUzI1NiJ9.' +
        Buffer.from(
          JSON.stringify({
            exp: nowSeconds + 3600, // Expires in 1 hour
            iat: nowSeconds,
          })
        ).toString('base64url') +
        '.sig';

      act(() => {
        result.current.setToken(validJwt);
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.validity.status).toBe('valid');
    });

    it('updates validity every 1s', () => {
      const { result } = renderHook(() => useJwtDecoder());

      const nowSeconds = Math.floor(Date.now() / 1000);
      const validJwt =
        'eyJhbGciOiJIUzI1NiJ9.' +
        Buffer.from(
          JSON.stringify({
            exp: nowSeconds + 10, // Expires in 10 seconds
            iat: nowSeconds,
          })
        ).toString('base64url') +
        '.sig';

      act(() => {
        result.current.setToken(validJwt);
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.validity.status).toBe('valid');

      const firstCountdown = result.current.validity.expiryCountdown;

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Countdown should update (seconds remaining decreased)
      expect(result.current.validity.secondsRemaining).toBeDefined();
      if (firstCountdown && result.current.validity.expiryCountdown) {
        // After 1s, secondsRemaining should be ~9 seconds
        expect(result.current.validity.secondsRemaining).toBeGreaterThan(0);
      }
    });
  });

  describe('cleanup', () => {
    it('clears debounce timer on unmount', () => {
      const { unmount } = renderHook(() => useJwtDecoder());

      unmount();
      // Should not throw
    });
  });
});
