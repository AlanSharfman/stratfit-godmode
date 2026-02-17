import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { createSeed } from "@/terrain/seed";
import { sampleTerrainHeight } from "@/terrain/buildTerrain";
import { getStmEnabled, sampleStmDisplacement } from "@/render/stm/stmRuntime";
import type { HeightSampler } from "@/terrain/corridorTopology";

/**
 * Shared helper: generate world-space XZ control points from path nodes.
 * Returns { points, getHeightAt } for use with ribbon builders.
 *
 * COORDINATE SYSTEM:
 * - Terrain PlaneGeometry(560, 360) rotated -π/2 around X, shifted Y by -6
 * - World X = planeX
 * - World Z = planeY (depth axis)
 * - World Y = height (planeZ after rotation) + offset
 */
export function nodesToWorldXZ(
    nodes: ReturnType<typeof generateP50Nodes>,
    seed: number
): { points: { x: number; z: number }[]; getHeightAt: HeightSampler } {
    const points = nodes.map((n) => {
        const world = normToWorld(n.coord);
        return { x: world.x, z: world.y }; // projector "y" → ground Z
    });

    const getHeightAt: HeightSampler = (worldX, worldZ) => {
        const base = sampleTerrainHeight(worldX, worldZ, seed);
        const stm = getStmEnabled() ? sampleStmDisplacement(worldX, worldZ) : 0;
        return base + stm;
    };

    return { points, getHeightAt };
}

export default function P50Path({
    scenarioId = "baseline",
    visible = true,
}: {
    scenarioId?: string;
    visible?: boolean;
}) {
    const seed = useMemo(() => createSeed(scenarioId), [scenarioId]);
    const nodes = useMemo(() => generateP50Nodes(), []);
    const { points, getHeightAt } = useMemo(
        () => nodesToWorldXZ(nodes, seed),
        [nodes, seed]
    );

    const curve = useMemo(() => {
        const pts = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
        return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    }, [points]);

    const geom = useMemo(() => {
        if (points.length < 2) return null;
        return makeTerrainTrailRibbon(curve, getHeightAt, {
            samples: 520, // denser = smoother curvature + better ground adherence
            halfWidth: 1.2, // width/2 (total ~2.4)
            clearanceY: 0.08, // keeps it above terrain (no z-fighting)
            normalEps: 0.6, // finite-diff step in world units
            smoothWindow: 5, // odd number recommended (Y-only smoothing)
            maxSlopePerM: 0.55, // clamp vertical change (units per meter)
        });
    }, [curve, getHeightAt, points.length]);

    useEffect(() => {
        return () => {
            geom?.dispose?.();
        };
    }, [geom]);

    if (!visible) return null;
    if (!geom) return null;

    return (
        <group name={`path-${scenarioId}`} frustumCulled={false}>
            {/* Outer glow */}
            <mesh
                geometry={geom}
                renderOrder={50}
                userData={{ pathMesh: true, id: "p50-ribbon-glow" }}
                frustumCulled={false}
            >
                <meshBasicMaterial
                    color={0x38bdf8} // Cyan/Ice
                    transparent
                    opacity={0.22}
                    depthTest={false}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Core line */}
            <mesh
                geometry={geom}
                renderOrder={51}
                userData={{ pathMesh: true, id: "p50-ribbon-core" }}
                frustumCulled={false}
            >
                <meshBasicMaterial
                    color={0xe2e8f0}
                    transparent
                    opacity={0.85}
                    depthTest={false}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <Markers curve={curve} getHeightAt={getHeightAt} />
        </group>
    );
}

function Markers({
    curve,
    getHeightAt,
}: {
    curve: THREE.Curve<THREE.Vector3>;
    getHeightAt: HeightSampler;
}) {
    const tVals = [0.15, 0.38, 0.62, 0.86];
    const pts = tVals.map((t) => curve.getPoint(t));
    return (
        <>
            {pts.map((p, idx) => (
                <mesh
                    key={idx}
                    position={[p.x, getHeightAt(p.x, p.z) + 0.35, p.z]}
                    renderOrder={60}
                    userData={{ pathMesh: true, id: `p50-marker-${idx}` }}
                    frustumCulled={false}
                >
                    <sphereGeometry args={[0.55, 18, 18]} />
                    <meshBasicMaterial
                        color={0x7dd3fc}
                        transparent
                        opacity={0.85}
                        depthTest={false}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </>
    );
}

type TrailOptions = {
    samples: number;
    halfWidth: number;
    clearanceY: number;
    normalEps: number;
    smoothWindow: number;
    maxSlopePerM: number;
};

/**
 * Terrain-realistic ribbon:
 * - samples curve in world XZ
 * - projects Y using getHeightAt (terrain + STM)
 * - clamps slope + smooths Y to remove spikes
 * - computes banking from terrain normal (finite differences) and tangent
 */
function makeTerrainTrailRibbon(
    curve: THREE.CatmullRomCurve3,
    getHeightAt: HeightSampler,
    opts: TrailOptions
) {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const samples = Math.max(64, Math.floor(opts.samples));
    const halfWidth = opts.halfWidth;
    const clearanceY = opts.clearanceY;
    const eps = Math.max(0.15, opts.normalEps);

    // 1) Build arc-length-ish samples (deterministic, stable)
    // We approximate equal distance using a dense pre-sample then remap to cumulative length.
    const dense = Math.max(samples * 3, 600);
    const densePts: THREE.Vector3[] = [];
    for (let i = 0; i <= dense; i++) {
        const t = i / dense;
        densePts.push(curve.getPoint(t));
    }

    const cum: number[] = new Array(densePts.length).fill(0);
    let total = 0;
    for (let i = 1; i < densePts.length; i++) {
        total += densePts[i].distanceTo(densePts[i - 1]);
        cum[i] = total;
    }
    total = Math.max(total, 1e-6);

    function tAtDistance(d: number) {
        const target = Math.min(Math.max(d, 0), total);
        // binary search in cum
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

    const center: THREE.Vector3[] = [];
    const yRaw: number[] = [];
    for (let i = 0; i <= samples; i++) {
        const d = (i / samples) * total;
        const t = tAtDistance(d);
        const p = curve.getPoint(t);
        // project to ground
        const y = getHeightAt(p.x, p.z) + clearanceY;
        center.push(new THREE.Vector3(p.x, y, p.z));
        yRaw.push(y);
    }

    // 2) Clamp slope (prevents sharp steps on steep terrain or noisy displacement)
    const yClamped: number[] = [...yRaw];
    for (let i = 1; i < yClamped.length; i++) {
        const dxz = Math.max(
            1e-6,
            Math.hypot(center[i].x - center[i - 1].x, center[i].z - center[i - 1].z)
        );
        const maxDy = opts.maxSlopePerM * dxz;
        const dy = yClamped[i] - yClamped[i - 1];
        if (dy > maxDy) yClamped[i] = yClamped[i - 1] + maxDy;
        if (dy < -maxDy) yClamped[i] = yClamped[i - 1] - maxDy;
    }
    for (let i = yClamped.length - 2; i >= 0; i--) {
        const dxz = Math.max(
            1e-6,
            Math.hypot(center[i + 1].x - center[i].x, center[i + 1].z - center[i].z)
        );
        const maxDy = opts.maxSlopePerM * dxz;
        const dy = yClamped[i] - yClamped[i + 1];
        if (dy > maxDy) yClamped[i] = yClamped[i + 1] + maxDy;
        if (dy < -maxDy) yClamped[i] = yClamped[i + 1] - maxDy;
    }

    // 3) Smooth Y only (small window, deterministic)
    const win = Math.max(1, Math.floor(opts.smoothWindow));
    const halfWin = Math.floor(win / 2);
    const ySmooth: number[] = new Array(yClamped.length).fill(0);
    for (let i = 0; i < yClamped.length; i++) {
        let sum = 0;
        let wsum = 0;
        for (let k = -halfWin; k <= halfWin; k++) {
            const j = Math.min(Math.max(i + k, 0), yClamped.length - 1);
            // triangular weights
            const w = 1 + halfWin - Math.abs(k);
            sum += yClamped[j] * w;
            wsum += w;
        }
        ySmooth[i] = wsum > 0 ? sum / wsum : yClamped[i];
    }

    for (let i = 0; i < center.length; i++) {
        center[i].y = ySmooth[i];
    }

    // 4) Build ribbon using terrain normal + tangent
    const tmpTangent = new THREE.Vector3();
    const tmpNormal = new THREE.Vector3();
    const tmpRight = new THREE.Vector3();

    for (let i = 0; i <= samples; i++) {
        const p = center[i];

        // tangent from neighbors (stable)
        const pPrev = center[Math.max(i - 1, 0)];
        const pNext = center[Math.min(i + 1, center.length - 1)];
        tmpTangent.copy(pNext).sub(pPrev);
        tmpTangent.y = 0; // tangent in XZ plane for trail direction
        if (tmpTangent.lengthSq() < 1e-10) tmpTangent.set(1, 0, 0);
        tmpTangent.normalize();

        // terrain normal via finite differences of height field
        const hL = getHeightAt(p.x - eps, p.z);
        const hR = getHeightAt(p.x + eps, p.z);
        const hD = getHeightAt(p.x, p.z - eps);
        const hU = getHeightAt(p.x, p.z + eps);

        // dY/dX and dY/dZ
        const dYdX = (hR - hL) / (2 * eps);
        const dYdZ = (hU - hD) / (2 * eps);

        // normal ~ (-dY/dX, 1, -dY/dZ)
        tmpNormal.set(-dYdX, 1, -dYdZ).normalize();

        // right = tangent x normal  (ensures ribbon "banks" with slope)
        tmpRight.crossVectors(tmpTangent, tmpNormal).normalize();
        if (tmpRight.lengthSq() < 1e-10) tmpRight.set(0, 0, 1);

        const left = new THREE.Vector3().copy(p).addScaledVector(tmpRight, -halfWidth);
        const right = new THREE.Vector3().copy(p).addScaledVector(tmpRight, halfWidth);

        positions.push(left.x, left.y, left.z);
        positions.push(right.x, right.y, right.z);

        const t = i / samples;
        uvs.push(0, t);
        uvs.push(1, t);
    }

    for (let i = 0; i < samples; i++) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;

        indices.push(a, c, b);
        indices.push(b, c, d);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
}
