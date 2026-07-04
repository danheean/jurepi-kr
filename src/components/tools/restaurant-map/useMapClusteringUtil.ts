'use client';

import { useMemo } from 'react';
import { clusterizeMarkers, MarkerCoord, Cluster } from './mapClustering';

/**
 * Hook that wraps the pure clustering algorithm.
 * Given markers, zoom level, and bounds, computes clusters.
 * Memoized to avoid recalculation on every render.
 */
export function useMapClusteringUtil(
  markers: MarkerCoord[],
  zoom: number,
  bounds: { n: number; s: number; e: number; w: number } | null
): Cluster[] {
  return useMemo(() => {
    if (!bounds || zoom < 0) return markers.map((m) => ({ ...m, count: 1, markerIds: [m.id] }));
    return clusterizeMarkers(markers, zoom, bounds);
  }, [markers, zoom, bounds]);
}
