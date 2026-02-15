import * as THREE from "three";
import { sampleHeight } from "@/paths/sampleTerrain";

export interface TerrainGridMeta {
    resolution: number;
    worldWidth: number;
    worldHeight: number;
}

/**
 * Build deterministic corridor topology by snapping path points to terrain grid.
 * Ensures reproducible geometry locked to terrain spatial grid.
 * 
 * @param curve - Path curve to sample
 * @param gridMeta - Terrain grid metadata
 * @param seed - Terrain seed for height sampling
 * @param segments - Number of segments to sample along curve
 * @param radiusSegments - Radial segments for tube
 * @param widthFn - Function to determine width at parameter t [0,1]
 */
export function buildGridSnappedCorridorGeometry(
    curve: THREE.CatmullRomCurve3,
    gridMeta: TerrainGridMeta,
    seed: number,
    segments = 140,
    radiusSegments = 8,
    widthFn: (t: number) => number = () => 1.0
): THREE.BufferGeometry {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Sample curve and snap to terrain grid
    const gridSnappedPoints: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = curve.getPoint(t);

        // Snap to terrain grid indices
        const normalizedX = (point.x + gridMeta.worldWidth / 2) / gridMeta.worldWidth;
        const normalizedZ = (point.z + gridMeta.worldHeight / 2) / gridMeta.worldHeight;

        const gridX = Math.round(normalizedX * (gridMeta.resolution - 1));
        const gridZ = Math.round(normalizedZ * (gridMeta.resolution - 1));

        // Convert back to world coordinates (grid-snapped)
        const snappedNormalizedX = gridX / (gridMeta.resolution - 1);
        const snappedNormalizedZ = gridZ / (gridMeta.resolution - 1);

        const snappedWorldX = snappedNormalizedX * gridMeta.worldWidth - gridMeta.worldWidth / 2;
        const snappedWorldZ = snappedNormalizedZ * gridMeta.worldHeight - gridMeta.worldHeight / 2;

        // Sample terrain height at snapped coordinates
        const h = sampleHeight(snappedNormalizedX, snappedNormalizedZ, seed);

        // Slight embedding offset to avoid z-fighting
        const embedOffset = -0.015;

        gridSnappedPoints.push(new THREE.Vector3(snappedWorldX, h + embedOffset, snappedWorldZ));
    }

    // Build tube geometry from grid-snapped points
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const center = gridSnappedPoints[i];
        const width = widthFn(t);

        // Calculate tangent for orientation
        let tangent: THREE.Vector3;
        if (i === 0) {
            tangent = gridSnappedPoints[1].clone().sub(center).normalize();
        } else if (i === segments) {
            tangent = center.clone().sub(gridSnappedPoints[segments - 1]).normalize();
        } else {
            tangent = gridSnappedPoints[i + 1].clone().sub(gridSnappedPoints[i - 1]).normalize();
        }

        // Calculate binormal and normal for tube cross-section
        const up = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

        // Generate radial vertices
        for (let j = 0; j <= radiusSegments; j++) {
            const angle = (j / radiusSegments) * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const offset = new THREE.Vector3(
                normal.x * cos + binormal.x * sin,
                normal.y * cos + binormal.y * sin,
                normal.z * cos + binormal.z * sin
            ).multiplyScalar(width);

            const vertex = center.clone().add(offset);
            vertices.push(vertex.x, vertex.y, vertex.z);

            // UVs
            uvs.push(j / radiusSegments, t);
        }
    }

    // Generate indices for tube faces
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < radiusSegments; j++) {
            const a = i * (radiusSegments + 1) + j;
            const b = a + 1;
            const c = (i + 1) * (radiusSegments + 1) + j;
            const d = c + 1;

            indices.push(a, b, d);
            indices.push(a, d, c);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * Compute checksum of curve for cache invalidation.
 * Only recomputes geometry when curve actually changes.
 */
export function checksumCurve(curve: THREE.CatmullRomCurve3, segments = 140): number {
    let hash = 0;
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = curve.getPoint(t);
        hash ^= Math.floor(p.x * 10000) >>> 0;
        hash ^= Math.floor(p.y * 10000) >>> 0;
        hash ^= Math.floor(p.z * 10000) >>> 0;
        hash = (hash >>> 1) | (hash << 31); // Rotate bits for better distribution
    }
    return hash >>> 0; // Ensure unsigned
}

/**
 * Geometry cache for deterministic corridor topology.
 * Prevents unnecessary rebuilds when percentile data hasn't changed.
 */
export class CorridorGeometryCache {
    private cache = new Map<number, THREE.BufferGeometry>();

    get(checksum: number): THREE.BufferGeometry | undefined {
        return this.cache.get(checksum);
    }

    set(checksum: number, geometry: THREE.BufferGeometry): void {
        this.cache.set(checksum, geometry);
    }

    clear(): void {
        // Dispose all cached geometries
        this.cache.forEach(geo => geo.dispose());
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}
