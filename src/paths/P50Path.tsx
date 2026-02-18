import React, { useEffect, useMemo, useState, useCallback } from "react";
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
            {/* Cut shadow band */}
            {groundGeom && (
                <mesh
                    geometry={groundGeom}
                    renderOrder={48}
                    frustumCulled={false}
                >
                    <meshBasicMaterial
                        color={0x02060a}
                        transparent
                        opacity={0.45}
                        depthTest
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {/* Titanium rail body */}
            <mesh geometry={geom} renderOrder={49} frustumCulled={false}>
                <meshStandardMaterial
                    color={new THREE.Color("#0b1220")}
                    metalness={0.85}
                    roughness={0.32}
                    emissive={new THREE.Color("#020617")}
                    emissiveIntensity={0.15}
                />
            </mesh>

            {/* Cyan filament */}
            <mesh geometry={geom} renderOrder={50} frustumCulled={false}>
                <meshBasicMaterial
                    color={0x38bdf8}
                    transparent
                    opacity={0.55}
                    depthTest={false}
                    depthWrite={false}
                />
            </mesh>

            {/* Soft outer bloom */}
            <mesh geometry={geom} renderOrder={51} frustumCulled={false}>
                <meshBasicMaterial
                    color={0x38bdf8}
                    transparent
                    opacity={0.18}
                    depthTest={false}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            <Milestones curve={curve} getHeightAt={getHeightAt} />
        </group>
    );
}

/**
 * Milestones: path-anchored product primitives.
 * - Disc body (titanium)
 * - Rim ring (ice-blue)
 * - Subtle hover pulse (no gameplay sparkle)
 * - Event-ready for Command Centre / right-panel binding later
 */
function Milestones({
    curve,
    getHeightAt,
}: {
    curve: THREE.Curve<THREE.Vector3>;
    getHeightAt: HeightSampler;
}) {
    const milestones = useMemo(
        () => [
            { id: "m1", t: 0.15, label: "M1" },
            { id: "m2", t: 0.38, label: "M2" },
            { id: "m3", t: 0.62, label: "M3" },
            { id: "m4", t: 0.86, label: "M4" },
        ],
        []
    );

    const [hoverId, setHoverId] = useState<string | null>(null);
    const onOver = useCallback((id: string) => setHoverId(id), []);
    const onOut = useCallback(() => setHoverId(null), []);

    return (
        <>
            {milestones.map((m, idx) => {
                const p = curve.getPoint(m.t);
                const y = getHeightAt(p.x, p.z) + 0.32;
                const hovered = hoverId === m.id;
                return (
                    <MilestoneDisc
                        key={m.id}
                        id={m.id}
                        index={idx}
                        position={[p.x, y, p.z]}
                        hovered={hovered}
                        onOver={onOver}
                        onOut={onOut}
                    />
                );
            })}
        </>
    );
}

function MilestoneDisc({
    id,
    index,
    position,
    hovered,
    onOver,
    onOut,
}: {
    id: string;
    index: number;
    position: [number, number, number];
    hovered: boolean;
    onOver: (id: string) => void;
    onOut: () => void;
}) {
    const bodyMat = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color("#0b1220"),
            metalness: 0.85,
            roughness: 0.35,
            emissive: new THREE.Color("#000000"),
            emissiveIntensity: 0.0,
        });
    }, []);

    const rimMat = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            color: 0x7dd3fc,
            transparent: true,
            opacity: 0.55,
            depthTest: false,
            depthWrite: false,
        });
    }, []);

    useEffect(() => {
        return () => {
            bodyMat.dispose();
            rimMat.dispose();
        };
    }, [bodyMat, rimMat]);

    const scale = hovered ? 1.12 : 1.0;
    const rimOpacity = hovered ? 0.78 : 0.55;

    return (
        <group
            position={position}
            renderOrder={60}
            userData={{ pathMesh: true, id: `p50-milestone-${id}`, milestone: id, index }}
            frustumCulled={false}
            scale={[scale, scale, scale]}
            onPointerOver={(e) => {
                e.stopPropagation();
                onOver(id);
                document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                onOut();
                document.body.style.cursor = "default";
            }}
        >
            {/* Disc body */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
                <cylinderGeometry args={[0.62, 0.62, 0.14, 28]} />
                <primitive object={bodyMat} attach="material" />
            </mesh>

            {/* Rim ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.085, 0]} frustumCulled={false}>
                <ringGeometry args={[0.66, 0.86, 48]} />
                <meshBasicMaterial
                    color={0x7dd3fc}
                    transparent
                    opacity={rimOpacity}
                    depthTest={false}
                    depthWrite={false}
                />
            </mesh>

            {/* Inner dot (micro highlight) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]} frustumCulled={false}>
                <circleGeometry args={[0.10, 24]} />
                <primitive object={rimMat} attach="material" />
            </mesh>
        </group>
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
