import * as THREE from "three";
import { sampleHeight } from "@/paths/sampleTerrain";
import { terrainHeightMode } from "@/config/featureFlags";

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

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

function safeHypot(x: number, z: number) {
    const h = Math.hypot(x, z);
    return Math.max(1e-6, h);
}

function smoothWindowed(values: number[], windowSize: number) {
    const win = Math.max(1, Math.floor(windowSize));
    const half = Math.floor(win / 2);
    const out = new Array(values.length).fill(0);

    for (let i = 0; i < values.length; i++) {
        let sum = 0;
        let wsum = 0;
        for (let k = -half; k <= half; k++) {
            const j = Math.min(Math.max(i + k, 0), values.length - 1);
            // triangular weights
            const w = 1 + half - Math.abs(k);
            sum += values[j] * w;
            wsum += w;
        }
        out[i] = wsum > 0 ? sum / wsum : values[i];
    }
    return out;
}

function clampSlopeY(points: { x: number; z: number }[], y: number[], maxSlopePerM: number) {
    const out = [...y];
    // forward pass
    for (let i = 1; i < out.length; i++) {
        const dxz = safeHypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
        const maxDy = maxSlopePerM * dxz;
        const dy = out[i] - out[i - 1];
        if (dy > maxDy) out[i] = out[i - 1] + maxDy;
        if (dy < -maxDy) out[i] = out[i - 1] - maxDy;
    }
    // backward pass
    for (let i = out.length - 2; i >= 0; i--) {
        const dxz = safeHypot(points[i + 1].x - points[i].x, points[i + 1].z - points[i].z);
        const maxDy = maxSlopePerM * dxz;
        const dy = out[i] - out[i + 1];
        if (dy > maxDy) out[i] = out[i + 1] + maxDy;
        if (dy < -maxDy) out[i] = out[i + 1] - maxDy;
    }
    return out;
}

function buildArcLengthSamplerXZ(controlPoints: { x: number; z: number }[], tension: number, dense: number) {
    const pts = controlPoints.map((p) => new THREE.Vector3(p.x, 0, p.z));
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", tension);

    const densePts: THREE.Vector3[] = [];
    for (let i = 0; i <= dense; i++) densePts.push(curve.getPoint(i / dense));

    const cum: number[] = new Array(densePts.length).fill(0);
    let total = 0;
    for (let i = 1; i < densePts.length; i++) {
        total += densePts[i].distanceTo(densePts[i - 1]);
        cum[i] = total;
    }
    total = Math.max(total, 1e-6);

    function tAtDistance(d: number) {
        const target = Math.min(Math.max(d, 0), total);
        let lo = 0;
        let hi = cum.length - 1;
        while (lo + 1 < hi) {
            const mid = (lo + hi) >> 1;
            if (cum[mid] < target) lo = mid;
            else hi = mid;
        }
        const d0 = cum[lo];
        const d1 = cum[hi];
        const tt = d1 > d0 ? (target - d0) / (d1 - d0) : 0;
        const t0 = lo / dense;
        const t1 = hi / dense;
        return t0 + (t1 - t0) * tt;
    }

    function pointAt(t: number) {
        return curve.getPoint(t);
    }

    return { curve, total, tAtDistance, pointAt };
}

/**
 * Build ribbon geometry from control points using a height sampler.
 * Terrain-conforming ribbon with:
 * - arc-length-ish sampling
 * - slope clamp + Y smoothing (deterministic)
 * - banking derived from terrain normal (finite differences)
 * - vertex heights sampled at vertex XZ (true surface conformance)
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

        // realism controls (all optional, deterministic defaults)
        normalEps?: number;
        smoothWindow?: number;
        maxSlopePerM?: number;
        arcDense?: number;
    } = {}
): {
    geometry: THREE.BufferGeometry;
    leftEdge: THREE.Vector3[];
    rightEdge: THREE.Vector3[];
    centerline: THREE.Vector3[];
} {
    const {
        samples = 260,
        halfWidth = 0.55,
        widthSegments = 10,
        lift = terrainHeightMode === "neutral" ? 0.02 : 0.06,
        tension = 0.55,

        normalEps = 0.6,
        smoothWindow = 5,
        maxSlopePerM = 0.55,
        arcDense = Math.max(600, Math.floor(samples * 3)),
    } = options;

    const safeSamples = Math.max(32, Math.floor(samples));
    const wSeg = Math.max(2, Math.floor(widthSegments));
    const wCount = wSeg + 1;

    // 1) Arc-length-ish sampler over XZ only
    const { total, tAtDistance, pointAt } = buildArcLengthSamplerXZ(controlPoints, tension, arcDense);

    // 2) Build centerline XZ and raw Y (terrain height + lift)
    const centerXZ: { x: number; z: number }[] = [];
    const yRaw: number[] = [];
    for (let i = 0; i <= safeSamples; i++) {
        const d = (i / safeSamples) * total;
        const t = tAtDistance(d);
        const p = pointAt(t);
        centerXZ.push({ x: p.x, z: p.z });
        yRaw.push(getHeightAt(p.x, p.z) + lift);
    }

    // 3) Clamp slope, then smooth Y (deterministic, small window)
    const yClamped = clampSlopeY(centerXZ, yRaw, maxSlopePerM);
    const ySmooth = smoothWindowed(yClamped, smoothWindow);

    // 4) Centerline vectors (for callers like ticks/markers)
    const centerline: THREE.Vector3[] = centerXZ.map((p, i) => new THREE.Vector3(p.x, ySmooth[i], p.z));

    // 5) Build ribbon vertices (true surface conformance + macro smoothing offset)
    // We sample terrain at vertex XZ, then apply a small offset equal to the macro-smoothed delta at the center.
    const verts: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    const leftEdgePts: THREE.Vector3[] = [];
    const rightEdgePts: THREE.Vector3[] = [];

    const eps = Math.max(0.15, normalEps);

    const tmpTangent = new THREE.Vector3();
    const tmpNormal = new THREE.Vector3();
    const tmpRight = new THREE.Vector3();

    for (let i = 0; i < centerline.length; i++) {
        const c = centerline[i];

        // Tangent from neighbors in XZ
        const prev = centerline[Math.max(0, i - 1)];
        const next = centerline[Math.min(centerline.length - 1, i + 1)];
        tmpTangent.copy(next).sub(prev);
        tmpTangent.y = 0;
        if (tmpTangent.lengthSq() < 1e-10) tmpTangent.set(1, 0, 0);
        tmpTangent.normalize();

        // Terrain normal from finite differences
        const hL = getHeightAt(c.x - eps, c.z);
        const hR = getHeightAt(c.x + eps, c.z);
        const hD = getHeightAt(c.x, c.z - eps);
        const hU = getHeightAt(c.x, c.z + eps);

        const dYdX = (hR - hL) / (2 * eps);
        const dYdZ = (hU - hD) / (2 * eps);
        tmpNormal.set(-dYdX, 1, -dYdZ).normalize();

        // Right vector = tangent x normal (banks with slope)
        tmpRight.crossVectors(tmpTangent, tmpNormal).normalize();
        if (tmpRight.lengthSq() < 1e-10) tmpRight.set(0, 0, 1);

        // Macro smoothing delta at center
        const centerRaw = yRaw[i];
        const centerSm = ySmooth[i];
        const macroDelta = centerSm - centerRaw;

        // Cross-section vertices
        for (let j = 0; j < wCount; j++) {
            const u = j / wSeg;
            const s = u * 2 - 1; // -1..1

            const px = c.x + tmpRight.x * (s * halfWidth);
            const pz = c.z + tmpRight.z * (s * halfWidth);

            const terrainY = getHeightAt(px, pz);
            const py = terrainY + lift + macroDelta;

            verts.push(px, py, pz);
            uvs.push(i / (centerline.length - 1), u);

            if (j === 0) leftEdgePts.push(new THREE.Vector3(px, py + 0.01, pz));
            if (j === wSeg) rightEdgePts.push(new THREE.Vector3(px, py + 0.01, pz));
        }
    }

    // 6) Indices
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
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvvsSafe(uvs), 2));
    geometry.setIndex(idx);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    return { geometry, leftEdge: leftEdgePts, rightEdge: rightEdgePts, centerline };
}

/**
 * Small safety to ensure UV array length is correct and typed as numbers.
 * (Avoids rare TS/JS engine edge cases when arrays get mutated externally.)
 */
function uvvsSafe(uvs: number[]) {
    // Return the same array but ensures it's a plain number[] with finite values.
    // Deterministic: no randomness, no time dependence.
    for (let i = 0; i < uvs.length; i++) {
        const v = uvs[i];
        if (!Number.isFinite(v)) uvs[i] = 0;
    }
    return uvs;
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
        this.cache.forEach((geo) => geo.dispose());
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}
