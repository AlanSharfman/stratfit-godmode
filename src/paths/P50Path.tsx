import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { createSeed } from "@/terrain/seed";
import { buildRibbonGeometry, type HeightSampler } from "@/terrain/corridorTopology";
import { terrainHeight } from "@/terrain/heightModel";
import { terrainHeightMode } from "@/config/featureFlags";
import { getStmEnabled, sampleStmDisplacement } from "@/render/stm/stmRuntime";

// ── Path material config ──
const PATH_COLOR = new THREE.Color(0xb8e7ff);
const PATH_EMISSIVE = new THREE.Color(0x7fdcff);

// ── Terrain geometry constants (must match buildTerrain + TerrainStage) ──
const TERRAIN_WIDTH = 560;
const TERRAIN_DEPTH = 360;
const HEIGHT_RAW_SCALE = 60;
const HEIGHT_SCALE = 0.35;
const TERRAIN_Y_OFFSET = -6;

/**
 * Shared helper: generate world-space XZ control points from path nodes.
 * Returns { points, heightSampler } for use with buildRibbonGeometry.
 *
 * COORDINATE SYSTEM:
 * - Terrain PlaneGeometry(560, 360) rotated -π/2 around X, shifted Y by -6
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
        return { x: world.x, z: world.y }; // projector "y" → ground Z
    });

    const getHeightAt: HeightSampler = (worldX, worldZ) => {
        const nx = (worldX + TERRAIN_WIDTH / 2) / TERRAIN_WIDTH;
        const nz = (worldZ + TERRAIN_DEPTH / 2) / TERRAIN_DEPTH;

        const base =
            terrainHeightMode === "neutral"
                ? 0
                : terrainHeight(nx, nz, seed) * HEIGHT_RAW_SCALE * HEIGHT_SCALE;

        const stm = getStmEnabled() ? sampleStmDisplacement(worldX, worldZ) : 0;

        return base + stm + TERRAIN_Y_OFFSET;
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
    const meshRef = useRef<THREE.Mesh | null>(null);

    const seed = useMemo(() => createSeed(scenarioId), [scenarioId]);
    const nodes = useMemo(() => generateP50Nodes(), []);
    const { points, getHeightAt } = useMemo(() => nodesToWorldXZ(nodes, seed), [nodes, seed]);

    // Create mesh once
    if (!meshRef.current) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshStandardMaterial({
            color: PATH_COLOR,
            emissive: PATH_EMISSIVE,
            emissiveIntensity: 1.25,
            metalness: 0.35,
            roughness: 0.22,
            transparent: true,
            opacity: 0.92,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = "p50-median-path";
        mesh.userData.pathMesh = true;
        mesh.renderOrder = 10;
        mesh.frustumCulled = false;
        meshRef.current = mesh;
    }

    useEffect(() => {
        if (points.length < 2) return;

        const result = buildRibbonGeometry(points, getHeightAt, {
            samples: 200,
            halfWidth: 4.5,
            widthSegments: 8,
            lift: terrainHeightMode === "neutral" ? 0.12 : 0.22,
            tension: 0.5,
        });

        const mesh = meshRef.current!;
        mesh.geometry.dispose();
        mesh.geometry = result.geometry;
    }, [points, getHeightAt]);

    useEffect(() => {
        return () => {
            const mesh = meshRef.current;
            if (!mesh) return;
            mesh.geometry?.dispose();
            const m = mesh.material;
            if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
            else (m as THREE.Material)?.dispose?.();
        };
    }, []);

    if (!visible) return null;

    return <primitive object={meshRef.current} />;
}
