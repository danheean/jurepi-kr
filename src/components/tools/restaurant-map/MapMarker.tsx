'use client';

/**
 * Helper component for rendering a single marker on NAVER Maps.
 * This is mostly a wrapper for naver.maps.Marker instantiation.
 * Parent (MapContainer) handles marker click callbacks and selection state.
 *
 * In practice, markers are rendered directly in MapContainer's useEffect
 * so this file may remain unused or used only for isolated marker logic.
 */

export interface MapMarkerProps {
  lat: number;
  lng: number;
  title: string;
  onClick?: () => void;
}

/**
 * Note: Actual marker rendering happens in MapContainer via naver.maps.Marker.
 * This file is a placeholder for potential marker abstraction or styling logic.
 */
export function MapMarker(props: MapMarkerProps) {
  return null;
}
