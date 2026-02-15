import * as THREE from "three";
import { sampleHeight } from "@/paths/sampleTerrain";

export interface TerrainGridMeta {
    resolution: number;
    worldWidth: number;
    worldHeight: number;
}

// Default terrain grid metadata for shared use
export const TERRAIN_GRID_META: TerrainGridMeta = {
    resolution: 120,
    worldWidth: 560,
    worldHeight: 360,
};

/** Height sampler function type */
export type HeightSampler = (worldX: number, worldZ: number) => number;

/**
 * Build ribbon geometry from control points using a height sampler.
 * Terrain-conforming flat ribbon (surface-following).
 */
export function buildRibbonGeometry(
    controlPoints: { x: number; z: number }[],
    getHeightAt: HeightSampler,
    options: {
        samples?: number;
        halfWidth?: number;
        widthSegments?: number;
        lift?: number;
        tension?: number;
    } = {}
): { geometry: THREE.BufferGeometry; leftEdge: THREE.Vector3[]; rightEdge: THREE.Vector3[]; centerline: THREE.Vector3[] } {
    const {
        samples = 220,
        halfWidth = 0.55,
        widthSegments = 10,
        lift = 0.06,
        tension = 0.55,
    } = options;

    // 1) Build smoothed curve sampling terrain heights
    const basePts = controlPoints.map((p) => {
        const y = getHeightAt(p.x, p.z);
        return new THREE.Vector3(p.x, y, p.z);
    });

    const curve = new THREE.CatmullRomCurve3(basePts, false, "catmullrom", tension);
    const centerline = curve.getPoints(samples);

    // 2) Tangents
    const tangents: THREE.Vector3[] = [];
    for (let i = 0; i < centerline.length; i++) {
        const prev = centerline[Math.max(0, i - 1)];
        const next = centerline[Math.min(centerline.length - 1, i + 1)];
        tangents.push(next.clone().sub(prev).normalize());
    }

    // 3) Build ribbon vertices
    const verts: number[] = [];
    const norms: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const leftEdgePts: THREE.Vector3[] = [];
    const rightEdgePts: THREE.Vector3[] = [];
    const wSeg = Math.max(2, widthSegments);
    const wCount = wSeg + 1;

    for (let i = 0; i < centerline.length; i++) {
        const c = centerline[i];
        const tan = tangents[i];

        // Side vector perpendicular to tangent on XZ plane
        let side = new THREE.Vector3().crossVectors(up, tan).normalize();
        if (side.lengthSq() < 1e-6) side = new THREE.Vector3(1, 0, 0);

        // Cross-section vertices
        for (let j = 0; j < wCount; j++) {
            const u = j / wSeg;
            const s = u * 2 - 1; // -1..1

            const px = c.x + side.x * (s * halfWidth);
            const pz = c.z + side.z * (s * halfWidth);

            // Sample terrain at actual vertex position — guarantees surface conformance
            const terrainY = getHeightAt(px, pz);
            const py = terrainY + lift;

            verts.push(px, py, pz);

            // Normal: mostly up
            const n = new THREE.Vector3(0, 1, 0)
                .add(side.clone().multiplyScalar(s * 0.12))
                .normalize();
            norms.push(n.x, n.y, n.z);

            uvs.push(i / (centerline.length - 1), u);

            if (j === 0) leftEdgePts.push(new THREE.Vector3(px, py + 0.01, pz));
            if (j === wSeg) rightEdgePts.push(new THREE.Vector3(px, py + 0.01, pz));
        }
    }

    // 4) Triangle indices
    const rowCount = centerline.length;
    for (let i = 0; i < rowCount - 1; i++) {
        for (let j = 0; j < wSeg; j++) {
            const a = i * wCount + j;
            const b = a + 1;
            const c2 = (i + 1) * wCount + j;
            const d = c2 + 1;
            idx.push(a, c2, b);
            idx.push(b, c2, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(norms, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(idx);
    geometry.computeBoundingSphere();

    return { geometry, leftEdge: leftEdgePts, rightEdge: rightEdgePts, centerline };
}

/**
 * Build edge line geometry from a list of 3D points.
 */
export function buildEdgeLineGeometry(pts: THREE.Vector3[]): THREE.BufferGeometry {
    const arr = new Float32Array(pts.length * 3);
    for (let i = 0; i < pts.length; i++) {
        arr[i * 3] = pts[i].x;
        arr[i * 3 + 1] = pts[i].y;
        arr[i * 3 + 2] = pts[i].z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    return g;
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
