/**
 * Pure grid-based clustering utility for NAVER Maps markers.
 * No DOM/SDK dependency — fully unit-testable.
 * Groups nearby markers into clusters based on zoom level and viewport bounds.
 */

export interface MarkerCoord {
  id: string;
  lat: number;
  lng: number;
}

export interface Cluster {
  lat: number;
  lng: number;
  count: number;
  markerIds: string[];
}

/**
 * Grid-bucketing cluster algorithm.
 * Given a set of markers, zoom level, and viewport bounds,
 * groups nearby markers into clusters if they fall within the same grid cell.
 *
 * @param markers array of { id, lat, lng }
 * @param zoom NAVER Maps zoom level (0–21, typical 10–16)
 * @param bounds viewport bounds { n, s, e, w } (north, south, east, west in degrees)
 * @returns array of clusters; single-marker "clusters" are included (count=1)
 */
export function clusterizeMarkers(
  markers: MarkerCoord[],
  zoom: number,
  bounds: { n: number; s: number; e: number; w: number }
): Cluster[] {
  if (markers.length === 0) return [];

  // Grid cell size: determined by zoom level.
  // Higher zoom → smaller cells → more detailed clustering
  // cellSize in degrees at equator. Adjust CLUSTER_RADIUS (80px) to appropriate degree span.
  // At zoom 15 (city level), ~80px ≈ 0.004–0.006 degrees
  const zoomToGridSize: Record<number, number> = {
    0: 10,
    5: 2,
    10: 0.1,
    12: 0.04,
    14: 0.01,
    16: 0.006,
    18: 0.002,
    21: 0.0005,
  };

  let cellSize = 0.01;
  for (const [z, size] of Object.entries(zoomToGridSize)) {
    if (zoom <= Number(z)) {
      cellSize = size;
      break;
    }
  }

  const grid = new Map<string, MarkerCoord[]>();

  // Bucket each marker into a grid cell
  for (const marker of markers) {
    const cellX = Math.floor(marker.lat / cellSize);
    const cellY = Math.floor(marker.lng / cellSize);
    const cellKey = `${cellX},${cellY}`;

    if (!grid.has(cellKey)) {
      grid.set(cellKey, []);
    }
    grid.get(cellKey)!.push(marker);
  }

  // Convert grid buckets to clusters
  const clusters: Cluster[] = [];
  for (const markerGroup of grid.values()) {
    if (markerGroup.length === 0) continue;

    const avgLat = markerGroup.reduce((sum, m) => sum + m.lat, 0) / markerGroup.length;
    const avgLng = markerGroup.reduce((sum, m) => sum + m.lng, 0) / markerGroup.length;

    clusters.push({
      lat: avgLat,
      lng: avgLng,
      count: markerGroup.length,
      markerIds: markerGroup.map((m) => m.id),
    });
  }

  return clusters;
}

/**
 * Simple threshold-based clustering for mobile or low-zoom.
 * Clusters markers within a fixed distance (in degrees) of each other.
 * Used as fallback for simpler logic on low-end devices.
 *
 * @param markers array of { id, lat, lng }
 * @param distanceDegrees threshold for grouping (e.g., 0.01° ≈ 1km at equator)
 * @returns array of clusters
 */
export function clusterizeMarkersSimple(
  markers: MarkerCoord[],
  distanceDegrees: number = 0.01
): Cluster[] {
  if (markers.length === 0) return [];

  const visited = new Set<string>();
  const clusters: Cluster[] = [];

  for (const marker of markers) {
    if (visited.has(marker.id)) continue;

    const cluster: MarkerCoord[] = [marker];
    visited.add(marker.id);

    // Find all nearby markers
    for (const other of markers) {
      if (visited.has(other.id)) continue;

      const latDiff = Math.abs(marker.lat - other.lat);
      const lngDiff = Math.abs(marker.lng - other.lng);

      if (latDiff <= distanceDegrees && lngDiff <= distanceDegrees) {
        cluster.push(other);
        visited.add(other.id);
      }
    }

    const avgLat = cluster.reduce((sum, m) => sum + m.lat, 0) / cluster.length;
    const avgLng = cluster.reduce((sum, m) => sum + m.lng, 0) / cluster.length;

    clusters.push({
      lat: avgLat,
      lng: avgLng,
      count: cluster.length,
      markerIds: cluster.map((m) => m.id),
    });
  }

  return clusters;
}
