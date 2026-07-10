'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchIp } from '@/lib/my-ip/fetch';
import type { IpResult, FetchErrorCode } from '@/lib/my-ip/schema';
import { IpFetchError } from '@/lib/my-ip/schema';

export interface UseIpFetchState {
  data: IpResult | null;
  error: FetchErrorCode | null;
  loading: boolean;
  isOnline: boolean;
  refresh: () => void;
}

export function useIpFetch(): UseIpFetchState {
  const [data, setData] = useState<IpResult | null>(null);
  const [error, setError] = useState<FetchErrorCode | null>(null);
  // Start in the loading state so the first paint shows the skeleton, not a
  // blank frame before the mount effect kicks off the fetch. SSR-consistent:
  // the skeleton renders identically on server and initial client render.
  const [loading, setLoading] = useState(true);
  // SSR renders with `true`; reading navigator.onLine here would branch
  // server vs client and break hydration. The real value syncs in the effect.
  const [isOnline, setIsOnline] = useState(true);

  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);
  // Effect-scoped listeners would capture stale `error` state; mirror it in a
  // ref so the 'online' handler always reads the current value.
  const errorRef = useRef<FetchErrorCode | null>(null);

  const performFetch = async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    errorRef.current = null;

    try {
      const result = await fetchIp();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        errorRef.current = null;
      }
    } catch (err) {
      if (isMountedRef.current) {
        const code =
          err instanceof IpFetchError ? err.code : 'ALL_PROVIDERS_FAILED';
        setError(code);
        errorRef.current = code;
        setData(null);
      }
    } finally {
      fetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refresh = () => {
    performFetch();
  };

  useEffect(() => {
    // Strict Mode re-runs this effect after cleanup; restore the mounted flag.
    isMountedRef.current = true;

    // Sync the real online state now that we are in the browser.
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Mount: fetch IP once
    performFetch();

    // Online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-retry if we had an error (read via ref — state here is stale)
      if (isMountedRef.current && errorRef.current && !fetchingRef.current) {
        performFetch();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      isMountedRef.current = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return {
    data,
    error,
    loading,
    isOnline,
    refresh,
  };
}
