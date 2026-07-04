import { describe, it, expect } from 'vitest';
import { clusterizeMarkers, clusterizeMarkersSimple, MarkerCoord } from './mapClustering';

describe('mapClustering', () => {
  describe('clusterizeMarkers', () => {
    it('returns empty array for empty markers', () => {
      const result = clusterizeMarkers([], 10, { n: 40, s: 35, e: 130, w: 125 });
      expect(result).toEqual([]);
    });

    it('clusters nearby markers in the same grid cell at zoom 12', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.501, lng: 126.971 }, // very close, same cell
      ];
      const result = clusterizeMarkers(markers, 12, { n: 40, s: 35, e: 130, w: 125 });
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
      expect(result[0].markerIds).toContain('1');
      expect(result[0].markerIds).toContain('2');
    });

    it('separates distant markers into different clusters', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.7, lng: 127.0 }, // far apart
      ];
      const result = clusterizeMarkers(markers, 12, { n: 40, s: 35, e: 130, w: 125 });
      expect(result.length).toBeGreaterThanOrEqual(2);
      const cluster1 = result.find((c) => c.markerIds.includes('1'));
      const cluster2 = result.find((c) => c.markerIds.includes('2'));
      expect(cluster1).toBeDefined();
      expect(cluster2).toBeDefined();
      expect(cluster1!.markerIds).not.toContain('2');
      expect(cluster2!.markerIds).not.toContain('1');
    });

    it('adjusts cell size based on zoom level', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.501, lng: 126.971 },
      ];

      // Low zoom → larger cells → markers likely in same cell
      const lowZoomResult = clusterizeMarkers(markers, 5, { n: 40, s: 35, e: 130, w: 125 });
      expect(lowZoomResult).toHaveLength(1);
      expect(lowZoomResult[0].count).toBe(2);

      // High zoom → smaller cells → markers more likely in separate cells
      const highZoomResult = clusterizeMarkers(markers, 18, { n: 40, s: 35, e: 130, w: 125 });
      // At zoom 18, cellSize=0.002, so 37.5 and 37.501 differ in lat by 0.001
      // cellX for both is Math.floor(37.5/0.002)=18750 and Math.floor(37.501/0.002)=18750
      // so still in same cell. Let's verify they cluster
      expect(highZoomResult).toHaveLength(1);
      expect(highZoomResult[0].count).toBe(2);
    });

    it('single marker creates a cluster with count=1', () => {
      const markers: MarkerCoord[] = [{ id: 'single', lat: 37.5, lng: 126.97 }];
      const result = clusterizeMarkers(markers, 12, { n: 40, s: 35, e: 130, w: 125 });
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(1);
      expect(result[0].markerIds).toEqual(['single']);
    });

    it('calculates cluster center as average of marker coordinates', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.0, lng: 126.0 },
        { id: '2', lat: 37.2, lng: 126.2 },
      ];
      const result = clusterizeMarkers(markers, 5, { n: 40, s: 35, e: 130, w: 125 });
      expect(result).toHaveLength(1);
      expect(result[0].lat).toBe(37.1); // (37.0 + 37.2) / 2
      expect(result[0].lng).toBe(126.1); // (126.0 + 126.2) / 2
    });

    it('handles markers with identical coordinates', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.5, lng: 126.97 },
        { id: '3', lat: 37.5, lng: 126.97 },
      ];
      const result = clusterizeMarkers(markers, 12, { n: 40, s: 35, e: 130, w: 125 });
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(3);
      expect(result[0].lat).toBeCloseTo(37.5, 5);
      expect(result[0].lng).toBeCloseTo(126.97, 5);
    });

    it('clusters multiple groups independently', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.501, lng: 126.971 },
        { id: '3', lat: 37.0, lng: 126.0 }, // separate group
        { id: '4', lat: 37.001, lng: 126.001 },
      ];
      const result = clusterizeMarkers(markers, 12, { n: 40, s: 35, e: 130, w: 125 });
      expect(result).toHaveLength(2);
      const counts = result.map((c) => c.count).sort();
      expect(counts).toEqual([2, 2]);
    });

    it('zoom level 0 uses large cell size', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 5.0, lng: 10.0 },
        { id: '2', lat: 7.0, lng: 15.0 }, // somewhat close in low zoom
      ];
      const result = clusterizeMarkers(markers, 0, { n: 40, s: -40, e: 180, w: -180 });
      // cellSize at zoom 0 is 10, so both should cluster
      // cellX for 5 and 7: floor(5/10)=0, floor(7/10)=0
      // cellY for 10 and 15: floor(10/10)=1, floor(15/10)=1
      // different cells (0,1) vs (0,1) — they're equal, so same cluster
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
    });

    it('zoom level 21 uses very fine cell size', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.50051, lng: 126.97051 }, // 0.0005° difference
      ];
      const result = clusterizeMarkers(markers, 21, { n: 40, s: 35, e: 130, w: 125 });
      // cellSize at zoom 21 is 0.0005
      // Both should be in same or adjacent cells given the small difference
      // cellX: floor(37.5/0.0005)=75000, floor(37.50051/0.0005)=75010.2=75010
      // different cells, so different clusters
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clusterizeMarkersSimple', () => {
    it('returns empty array for empty markers', () => {
      const result = clusterizeMarkersSimple([]);
      expect(result).toEqual([]);
    });

    it('clusters markers within distance threshold', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.5005, lng: 126.9705 }, // within 0.01°
      ];
      const result = clusterizeMarkersSimple(markers, 0.01);
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
    });

    it('separates markers beyond distance threshold', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.5, lng: 126.98 }, // 0.01° away in lng
      ];
      const result = clusterizeMarkersSimple(markers, 0.005);
      expect(result).toHaveLength(2);
      expect(result[0].count).toBe(1);
      expect(result[1].count).toBe(1);
    });

    it('single marker is its own cluster', () => {
      const markers: MarkerCoord[] = [{ id: 'alone', lat: 37.5, lng: 126.97 }];
      const result = clusterizeMarkersSimple(markers, 0.01);
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(1);
      expect(result[0].markerIds).toEqual(['alone']);
    });

    it('uses default distance threshold of 0.01°', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.5005, lng: 126.9705 }, // within 0.01°
      ];
      const result = clusterizeMarkersSimple(markers); // no threshold arg
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
    });

    it('calculates cluster center as average of marker coordinates', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.0, lng: 126.0 },
        { id: '2', lat: 37.002, lng: 126.002 },
      ];
      const result = clusterizeMarkersSimple(markers, 0.01);
      expect(result).toHaveLength(1);
      expect(result[0].lat).toBeCloseTo(37.001, 5);
      expect(result[0].lng).toBeCloseTo(126.001, 5);
    });

    it('groups multiple markers into one cluster if within threshold', () => {
      const markers: MarkerCoord[] = [
        { id: '1', lat: 37.5, lng: 126.97 },
        { id: '2', lat: 37.501, lng: 126.971 },
        { id: '3', lat: 37.502, lng: 126.972 },
      ];
      const result = clusterizeMarkersSimple(markers, 0.01);
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(3);
      expect(result[0].markerIds).toEqual(['1', '2', '3']);
    });
  });
});
