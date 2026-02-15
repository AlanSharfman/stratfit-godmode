import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry, type HeightSampler } from "@/terrain/corridorTopology";
import { terrainHeight } from "@/terrain/heightModel";

// ── Path material config ──
const PATH_COLOR = new THREE.Color(0xb8e7ff);
const PATH_EMISSIVE = new THREE.Color(0x7fdcff);

// ── Terrain geometry constants (must match buildTerrain + TerrainStage) ──
const TERRAIN_WIDTH = 560;   // PlaneGeometry width
const TERRAIN_DEPTH = 360;   // PlaneGeometry height
const HEIGHT_RAW_SCALE = 60;
const HEIGHT_SCALE = 0.35;   // buildTerrain applies this
const TERRAIN_Y_OFFSET = -6; // TerrainStage position.y

/**
 * Shared helper: generate world-space XZ control points from path nodes.
 * Returns { points, heightSampler } for use with buildRibbonGeometry.
 *
 * COORDINATE SYSTEM:
 * - Terrain PlaneGeometry(560, 360) rotated -π/2 around X, shifted Y by -6
 * - World X = planeX = nx * 560 - 280
 * - World Z = ny * 360 - 180 (after rotation)
 * - World Y = terrainHeight(nx,ny) * 60 * 0.35 - 6
 */
export function nodesToWorldXZ(
    nodes: ReturnType<typeof generateP50Nodes>,
    seed: number
): { points: { x: number; z: number }[]; getHeightAt: HeightSampler } {
    const points = nodes.map((n) => {
        const world = normToWorld(n.coord);
        return { x: world.x, z: world.y }; // projector "y" → ground Z
    });

    // World-space height sampler matching actual terrain mesh transforms
    const getHeightAt: HeightSampler = (worldX, worldZ) => {
        // Convert world coords to terrain normalized [0..1]
        const nx = (worldX + TERRAIN_WIDTH / 2) / TERRAIN_WIDTH;
        const nz = (worldZ + TERRAIN_DEPTH / 2) / TERRAIN_DEPTH;
        // Match exact scale from buildTerrain + TerrainStage offset
        return terrainHeight(nx, nz, seed) * HEIGHT_RAW_SCALE * HEIGHT_SCALE + TERRAIN_Y_OFFSET;
    };

    return { points, getHeightAt };
}

// ─────────────────────────────────────────────
// P50Path — median corridor (primary, flat ribbon)
// ─────────────────────────────────────────────
export default function P50Path({
    scenarioId = "baseline",
    visible = true,
}: {
    scenarioId?: string;
    visible?: boolean;
}) {
    const meshRef = useRef<THREE.Mesh | null>(null);

    const seed = useMemo(() => createSeed(scenarioId), [scenarioId]);
    const nodes = useMemo(() => generateP50Nodes(), []);
    const { points, getHeightAt } = useMemo(() => nodesToWorldXZ(nodes, seed), [nodes, seed]);

    // CREATE MESH ONCE (stable ref survives HMR)
    if (!meshRef.current) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshStandardMaterial({
            color: PATH_COLOR,
            emissive: PATH_EMISSIVE,
            emissiveIntensity: 0.6,
            metalness: 0.2,
            roughness: 0.35,
            transparent: true,
            opacity: 0.85,
            depthWrite: true,
            depthTest: true,
            side: THREE.DoubleSide,
        });
        meshRef.current = new THREE.Mesh(geometry, material);
        meshRef.current.name = "p50-median-path";
        meshRef.current.userData.pathMesh = true;
        meshRef.current.renderOrder = 10;
        meshRef.current.frustumCulled = false;
    }

    // UPDATE GEOMETRY ONLY (no mesh recreation)
    useEffect(() => {
        if (points.length < 2) return;
        console.log("[P50Path] Updating ribbon geometry (flat surface-following)");

        const result = buildRibbonGeometry(points, getHeightAt, {
            samples: 200,
            halfWidth: 3.0,
            widthSegments: 6,
            lift: 0.15,
            tension: 0.5,
        });

        const mesh = meshRef.current!;
        mesh.geometry.dispose();
        mesh.geometry = result.geometry;
    }, [points, getHeightAt]);

    if (!visible) return null;

    return <primitive object={meshRef.current} />;
}
