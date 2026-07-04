'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to dynamically load NAVER Maps JS SDK.
 * Checks if SDK is already loaded globally, if not injects <script> tag.
 * Returns { mapSDKReady, mapError } state.
 */
export function useMapsSDKLoader() {
  const [mapSDKReady, setMapSDKReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Check if SDK is already loaded
    if (typeof window !== 'undefined' && (window as any).naver?.maps) {
      setMapSDKReady(true);
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      setMapError('NAVER_MAP_CLIENT_ID is not configured');
      return;
    }

    // Inject SDK script
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;

    const timeout = setTimeout(() => {
      if (!mapSDKReady) {
        setMapError('NAVER Maps SDK load timeout (>5s)');
      }
    }, 5000);

    script.onload = () => {
      clearTimeout(timeout);
      setMapSDKReady(true);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      setMapError('Failed to load NAVER Maps SDK');
    };

    document.head.appendChild(script);

    return () => {
      clearTimeout(timeout);
    };
  }, [mapSDKReady]);

  return { mapSDKReady, mapError };
}
