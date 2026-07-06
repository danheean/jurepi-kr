'use client';

import { useEffect, useRef, useState } from 'react';
import { useMapsSDKLoader } from './useMapsSDKLoader';
import { useMapClusteringUtil } from './useMapClusteringUtil';
import { MapFailover } from './MapFailover';
import type { Place } from '@/lib/restaurant-map/schema';

/**
 * NAVER Maps JS API wrapper component.
 * Renders interactive map with markers, clustering, and info windows.
 * Syncs with place selection (click marker → parent callback → highlight list card).
 * Gracefully falls back to MapFailover if SDK fails to load.
 */
export interface MapContainerProps {
  places: Place[];
  selectedPlaceId?: string;
  userGeo?: { lat: number; lng: number } | null;
  onMarkerClick: (placeId: string) => void;
  /** Clicking an empty area of the map deselects the current place. */
  onBackgroundClick?: () => void;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
// Zoom level used when centering on the user's location (city-wide 11 → district)
const USER_FOCUS_ZOOM = 13;

export function MapContainer({
  places,
  selectedPlaceId,
  userGeo,
  onMarkerClick,
  onBackgroundClick,
}: MapContainerProps) {
  const { mapSDKReady, mapError } = useMapsSDKLoader();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userGeoMarkerRef = useRef<any>(null);
  const onBackgroundClickRef = useRef(onBackgroundClick);
  onBackgroundClickRef.current = onBackgroundClick;

  const [zoom, setZoom] = useState(11);
  const [bounds, setBounds] = useState<{
    n: number;
    s: number;
    e: number;
    w: number;
  } | null>(null);

  const clusters = useMapClusteringUtil(
    places.map((p) => ({ id: p.id || '', lat: p.lat, lng: p.lng })),
    zoom,
    bounds
  );

  // Initialize map
  useEffect(() => {
    if (!mapSDKReady || !mapRef.current) {
      return;
    }

    const naver = (window as any).naver?.maps;
    if (!naver) return;

    if (mapInstanceRef.current) {
      return;
    }

    const map = new naver.Map(mapRef.current, {
      center: new naver.LatLng(userGeo?.lat ?? DEFAULT_CENTER.lat, userGeo?.lng ?? DEFAULT_CENTER.lng),
      zoom,
      mapTypeControl: true,
      zoomControl: true,
      logoControl: false,
    });

    mapInstanceRef.current = map;

    // Update zoom and bounds on map change
    map.addListener('zoom_changed', () => {
      setZoom(map.getZoom());
      updateBounds();
    });

    map.addListener('bounds_changed', () => {
      updateBounds();
    });

    const updateBounds = () => {
      const bounds = map.getBounds();
      if (bounds) {
        setBounds({
          n: bounds.north(),
          s: bounds.south(),
          e: bounds.east(),
          w: bounds.west(),
        });
      }
    };

    updateBounds();

    // Clicking an empty area of the map deselects the current place
    map.addListener('click', () => {
      onBackgroundClickRef.current?.();
    });
  }, [mapSDKReady, userGeo?.lat, userGeo?.lng]);

  // Render the user geolocation marker and bring the map to the user.
  // The init effect early-returns once the map exists, so a location obtained
  // later (via the "내 위치" button) must recenter here, not there.
  useEffect(() => {
    if (!mapInstanceRef.current || !userGeo) {
      if (userGeoMarkerRef.current) {
        userGeoMarkerRef.current.setMap(null);
        userGeoMarkerRef.current = null;
      }
      return;
    }

    const naver = (window as any).naver?.maps;
    if (!naver) return;

    const position = new naver.LatLng(userGeo.lat, userGeo.lng);

    if (!userGeoMarkerRef.current) {
      userGeoMarkerRef.current = new naver.Marker({
        position,
        map: mapInstanceRef.current,
        title: 'Your Location',
        // NAVER Maps marker icons are HtmlIcon object literals, not constructors
        icon: {
          content: `<div style="width: 16px; height: 16px; border-radius: 50%; background-color: var(--brand); border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
          anchor: new naver.Point(8, 8),
        },
      });
    } else {
      userGeoMarkerRef.current.setPosition(position);
    }

    mapInstanceRef.current.panTo(position);
    if (mapInstanceRef.current.getZoom() < USER_FOCUS_ZOOM) {
      mapInstanceRef.current.setZoom(USER_FOCUS_ZOOM);
    }
  }, [userGeo, mapSDKReady]);

  // Render place markers and clusters
  useEffect(() => {
    if (!mapInstanceRef.current || places.length === 0) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      return;
    }

    const naver = (window as any).naver?.maps;
    if (!naver) return;
    const currentMarkerIds = new Set(markersRef.current.keys());
    const newMarkerIds = new Set(places.map((p) => p.id));

    // Remove markers no longer in filtered list
    for (const id of currentMarkerIds) {
      if (!newMarkerIds.has(id)) {
        const marker = markersRef.current.get(id);
        if (marker) {
          marker.setMap(null);
          markersRef.current.delete(id);
        }
      }
    }

    // Add or update markers
    for (const place of places) {
      if (!place.id) continue;
      if (!markersRef.current.has(place.id)) {
        const marker = new naver.Marker({
          position: new naver.LatLng(place.lat, place.lng),
          map: mapInstanceRef.current,
          title: place.name,
          icon: {
            content: `<div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: var(--accent-rose); border-radius: 50%; color: white; font-weight: bold; font-size: 12px;">📍</div>`,
            anchor: new naver.Point(12, 12),
          },
        });

        marker.addListener('click', () => {
          if (place.id) onMarkerClick(place.id);
        });

        if (place.id) markersRef.current.set(place.id, marker);
      }

      // Highlight selected marker
      if (!place.id) continue;
      const marker = markersRef.current.get(place.id);
      if (marker && place.id === selectedPlaceId) {
        marker.setIcon({
          content: `<div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: var(--brand); border-radius: 50%; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 0 8px rgba(0,0,0,0.3);">📍</div>`,
          anchor: new naver.Point(16, 16),
        });
      } else if (marker) {
        marker.setIcon({
          content: `<div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: var(--accent-rose); border-radius: 50%; color: white; font-weight: bold; font-size: 12px;">📍</div>`,
          anchor: new naver.Point(12, 12),
        });
      }
    }
  }, [places, selectedPlaceId, mapSDKReady]);

  // Pan to the selected place. The clicked place's details render in the panel
  // below the map (no on-map info popup — it covered the map and never closed).
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlaceId) {
      return;
    }

    const place = places.find((p) => p.id === selectedPlaceId);
    if (!place) return;

    const naver = (window as any).naver?.maps;
    if (!naver) return;

    mapInstanceRef.current.panTo(new naver.LatLng(place.lat, place.lng));
  }, [selectedPlaceId, places]);

  if (mapError) {
    return <MapFailover />;
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[420px] lg:h-[600px] rounded-lg border border-hairline overflow-hidden"
      aria-label="Map"
    />
  );
}
