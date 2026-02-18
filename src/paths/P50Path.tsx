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
 * Returns { points, heightSampler } for use with buildRibbonGeometry.
 *
 * COORDINATE SYSTEM:
 * - Terrain PlaneGeometry(560, 360) rotated -╧Ç/2 around X, shifted Y by -6
 * - World X = planeX
 * - World Z = planeY (depth axis)
 * - World Y = height (planeZ after rotation) + offset
 */
export function nodesToWorldXZ(
    nodes: ReturnType<typeof generateP50Nodes>,
    seed: number,
): { points: { x: number; z: number }[]; getHeightAt: HeightSampler } {
    const points = nodes.map((n) => {
        const world = normToWorld(n.coord);
        return { x: world.x, z: world.y }; // projector "y" ΓåÆ ground Z
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
    const { points, getHeightAt } = useMemo(() => nodesToWorldXZ(nodes, seed), [nodes, seed]);

    const curve = useMemo(() => {
        const pts = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
        return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    }, [points]);

    const geom = useMemo(() => {
        if (points.length < 2) return null;
        return makeRibbon(curve, 420, 2.4, getHeightAt);
    }, [curve, getHeightAt, points.length]);

    const groundGeom = useMemo(() => {
        if (points.length < 2) return null;
        return makeRibbon(curve, 420, 3.2, getHeightAt, -0.08);
    }, [curve, getHeightAt, points.length]);

    useEffect(() => {
        return () => {
            geom?.dispose?.();
            groundGeom?.dispose?.();
        };
    }, [geom, groundGeom]);

    if (!visible) return null;

    if (!geom) return null;

    return (
        <group name={`path-${scenarioId}`} frustumCulled={false}>
            {/* Ground-anchoring shadow band ΓÇö cuts into terrain */}
            {groundGeom && (
                <mesh
                    geometry={groundGeom}
                    renderOrder={49}
                    userData={{ pathMesh: true, id: "p50-ribbon-ground" }}
                    frustumCulled={false}
                >
                    <meshBasicMaterial
                        color={0x061218}
                        transparent
                        opacity={0.35}
                        depthTest={true}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                        blending={THREE.NormalBlending}
                    />
                </mesh>
            )}

            {/* Outer glow */}
            <mesh
                geometry={geom}
                renderOrder={50}
                userData={{ pathMesh: true, id: "p50-ribbon-glow" }}
                frustumCulled={false}
            >
                <meshBasicMaterial
                    color={0x38bdf8}
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

/**
 * Ribbon: terrain-follow feel comes from banking + subtle vertical undulation.
 */
function makeRibbon(
    curve: THREE.CatmullRomCurve3,
    segments: number,
    width: number,
    getHeightAt: HeightSampler,
    liftOffset = 0,
) {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const up = new THREE.Vector3(0, 1, 0);
    const prevNormal = new THREE.Vector3(1, 0, 0);

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = curve.getPoint(t);

        // subtle undulation so it isn't a sterile strip
        const lift = Math.sin(t * Math.PI * 2.0) * 0.35 + Math.sin(t * Math.PI * 6.0) * 0.18;
        p.y = getHeightAt(p.x, p.z) + 0.25 + lift + liftOffset;

        const tangent = curve.getTangent(t).normalize();

        // Banking: rotate binormal around tangent slightly
        const bank = Math.sin(t * Math.PI * 2.0) * 0.20;
        const normal = prevNormal.clone().cross(tangent).cross(tangent).normalize();
        if (normal.lengthSq() < 1e-6) normal.copy(prevNormal);
        prevNormal.copy(normal);

        const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
        const banked = binormal.clone().applyAxisAngle(tangent, bank).normalize();

        const left = p.clone().addScaledVector(banked, -width * 0.5);
        const right = p.clone().addScaledVector(banked, width * 0.5);

        positions.push(left.x, left.y, left.z);
        positions.push(right.x, right.y, right.z);

        uvs.push(0, t);
        uvs.push(1, t);
    }

    for (let i = 0; i < segments; i++) {
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
