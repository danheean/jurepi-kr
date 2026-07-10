'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  parseJwt,
  getValidityStatus,
  parseUiPrefs,
  serializeUiPrefs,
  verifySignature,
  type JwtParseError,
} from '@/lib/jwt-decoder';

const STORAGE_KEY = 'jurepi-jwt-decoder';
const DEBOUNCE_MS = 200;

export interface UseJwtDecoderReturn {
  // Input state
  token: string;
  setToken: (t: string) => void;

  // Parsed result
  decoded?: {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
  };
  parseError?: JwtParseError;

  // UI state (persisted)
  tab: 'claims' | 'raw';
  setTab: (t: 'claims' | 'raw') => void;
  verificationMode: 'off' | 'hmac' | 'rsa';
  setVerificationMode: (m: 'off' | 'hmac' | 'rsa') => void;

  // Verification secret/key (in-memory only, NOT persisted)
  secret: string;
  setSecret: (s: string) => void;
  publicKey: string;
  setPublicKey: (k: string) => void;

  // Verification result
  verificationResult?: { verified: boolean; error?: string };
  verifySignature: () => Promise<void>;
  isVerifying: boolean;

  // Validity (1s refresh via useEffect)
  validity: {
    status: 'valid' | 'expired' | 'not_yet_valid' | 'unknown';
    expiryCountdown?: string;
    secondsRemaining?: number;
  };
}

/**
 * Hook for JWT decoder state management
 * - Owns token input + UI state (tab, verificationMode)
 * - Debounces parsing (200ms)
 * - Persists UI prefs to localStorage (NOT token/secret)
 * - Manages verification state
 * - Updates validity every 1s
 */
export function useJwtDecoder(): UseJwtDecoderReturn {
  // Input state
  const [token, setTokenRaw] = useState('');
  const [decoded, setDecoded] = useState<UseJwtDecoderReturn['decoded']>();
  const [parseError, setParseError] = useState<JwtParseError>();

  // UI state (persisted)
  const [tab, setTab] = useState<'claims' | 'raw'>('claims');
  const [verificationMode, setVerificationMode] = useState<'off' | 'hmac' | 'rsa'>('off');

  // Verification secret/key (NOT persisted)
  const [secret, setSecret] = useState('');
  const [publicKey, setPublicKey] = useState('');

  // Verification result
  const [verificationResult, setVerificationResult] = useState<
    { verified: boolean; error?: string } | undefined
  >();
  const [isVerifying, setIsVerifying] = useState(false);

  // Validity
  const [validity, setValidity] = useState<UseJwtDecoderReturn['validity']>({
    status: 'unknown',
  });

  // Refs for debouncing and cleanup
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const verifyAbortRef = useRef<AbortController | undefined>(undefined);

  // Load persisted UI prefs on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prefs = parseUiPrefs(stored);
        setTab(prefs.tab);
        setVerificationMode(prefs.verificationMode);
      }
    } catch (err) {
      // Silently fail on invalid data; use defaults
      console.error('[useJwtDecoder] Failed to load prefs:', err);
    }
  }, []);

  // Persist UI prefs when they change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        serializeUiPrefs({ tab, verificationMode })
      );
    } catch (err) {
      console.error('[useJwtDecoder] Failed to persist prefs:', err);
    }
  }, [tab, verificationMode]);

  // Debounced parsing
  const setToken = useCallback((t: string) => {
    setTokenRaw(t);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const result = parseJwt(t);
      if (result.success) {
        setDecoded(result);
        setParseError(undefined);
      } else {
        setDecoded(undefined);
        setParseError(result.error);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Update validity every 1s
  useEffect(() => {
    if (!decoded) {
      setValidity({ status: 'unknown' });
      return;
    }

    const updateValidity = () => {
      const payload = decoded.payload as any;
      const statusResult = getValidityStatus(
        {
          iat: payload?.iat,
          exp: payload?.exp,
          nbf: payload?.nbf,
        },
        Date.now()
      );

      const status = statusResult.status;
      let expiryCountdown: string | undefined;

      if (statusResult.secondsRemaining !== undefined) {
        const hours = Math.floor(Math.abs(statusResult.secondsRemaining) / 3600);
        const minutes = Math.floor((Math.abs(statusResult.secondsRemaining) % 3600) / 60);

        if (hours > 0) {
          expiryCountdown = `${hours}h ${minutes}m`;
        } else {
          expiryCountdown = `${minutes}m`;
        }
      }

      setValidity({
        status,
        expiryCountdown,
        secondsRemaining: statusResult.secondsRemaining,
      });
    };

    updateValidity();
    const interval = setInterval(updateValidity, 1000);
    return () => clearInterval(interval);
  }, [decoded]);

  // Verify signature
  const doVerifySignature = useCallback(async () => {
    if (!decoded || verificationMode === 'off') {
      setVerificationResult(undefined);
      return;
    }

    setIsVerifying(true);
    verifyAbortRef.current = new AbortController();

    try {
      const result = await verifySignature(
        {
          alg: (decoded.header.alg as string) || 'unknown',
          signingInput: `${token.split('.')[0]}.${token.split('.')[1]}`,
          signatureB64Url: decoded.signature,
          secret: verificationMode === 'hmac' ? secret : undefined,
          publicKeyPem: verificationMode === 'rsa' ? publicKey : undefined,
        },
        // Inject crypto.subtle (default to globalThis.crypto.subtle)
        {
          subtle: globalThis.crypto?.subtle,
        }
      );

      if (!verifyAbortRef.current.signal.aborted) {
        setVerificationResult(result);
      }
    } catch (err) {
      if (!verifyAbortRef.current.signal.aborted) {
        setVerificationResult({
          verified: false,
          error: err instanceof Error ? err.message : 'Verification error',
        });
      }
    } finally {
      setIsVerifying(false);
    }
  }, [decoded, token, verificationMode, secret, publicKey]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (verifyAbortRef.current) {
        verifyAbortRef.current.abort();
      }
    };
  }, []);

  return {
    token,
    setToken,
    decoded,
    parseError,
    tab,
    setTab,
    verificationMode,
    setVerificationMode,
    secret,
    setSecret,
    publicKey,
    setPublicKey,
    verificationResult,
    verifySignature: doVerifySignature,
    isVerifying,
    validity,
  };
}
