import { useEffect, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { sampleHeight } from "./sampleTerrain";
import { buildSpline } from "./buildSpline";
import { buildPathMesh } from "./buildPathMesh";
import { createGlowMesh } from "./pathGlow";
import { createSeed } from "@/terrain/seed";
import { generateCorridorMask } from "@/terrain/corridorContactPass";

// Divergence scaffold constants (deterministic)
const DIVERGENCE_T = 0.62; // fixed, deterministic (no randomness)
const DIVERGENCE_SPREAD = 10; // world units lateral branch hint

// Terrain grid metadata for deterministic topology
const TERRAIN_GRID_META = {
    resolution: 120,
    worldWidth: 560,
    worldHeight: 360
};

export default function P50Path({
    scene,
    scenarioId = "baseline",
    onMaskReady
}: {
    scene: THREE.Scene;
    scenarioId?: string;
    onMaskReady?: (mask: THREE.DataTexture) => void;
}) {
    const p50Ref = useRef<THREE.Mesh | null>(null);
    const p10Ref = useRef<THREE.Mesh | null>(null);
    const p90Ref = useRef<THREE.Mesh | null>(null);
    const glowRef = useRef<THREE.Mesh | null>(null);
    const branchLeftRef = useRef<THREE.Mesh | null>(null);
    const branchRightRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!scene) return;

        const seed = createSeed(scenarioId);

        const nodes = generateP50Nodes();

        // Derive P10 and P90 node sets by offsetting y coordinate
        const p10Nodes = nodes.map(n => ({
            ...n,
            coord: {
                x: n.coord.x,
                y: Math.max(-1, n.coord.y - 0.18),
                z: n.coord.z
            }
        }));

        const p90Nodes = nodes.map(n => ({
            ...n,
            coord: {
                x: n.coord.x,
                y: Math.min(1, n.coord.y + 0.18),
                z: n.coord.z
            }
        }));

        // Reusable function to convert nodes to curve with terrain height sampling
        function nodesToCurve(nodeList: typeof nodes, epsilon: number) {
            const pts = nodeList.map((n) => {
                const world = normToWorld(n.coord);
                const X = world.x;
                const Z = world.y; // projector's "y" becomes ground Z
                const h = sampleHeight(n.coord.x, n.coord.y, seed);
                return new THREE.Vector3(X, h + epsilon, Z);
            });
            return buildSpline(pts);
        }

        // Build 3 curves with terrain-following
        const p50Curve = nodesToCurve(nodes, 0.65);
        const p10Curve = nodesToCurve(p10Nodes, 0.55);
        const p90Curve = nodesToCurve(p90Nodes, 0.55);

        // Create divergence scaffold (branch hints)
        function offsetCurve(curve: THREE.CatmullRomCurve3, side: -1 | 1) {
            const pts = curve.getPoints(120);

            const out = pts.map((p, idx) => {
                const t = idx / (pts.length - 1);

                // only push laterally after divergence point
                const k = t < DIVERGENCE_T ? 0 : (t - DIVERGENCE_T) / (1 - DIVERGENCE_T);
                const push = k * k * DIVERGENCE_SPREAD * side;

                // lateral push in X (world)
                return new THREE.Vector3(p.x + push, p.y + 0.15, p.z);
            });

            return new THREE.CatmullRomCurve3(out);
        }

        const branchLeft = offsetCurve(p50Curve, -1);
        const branchRight = offsetCurve(p50Curve, 1);

        // Create terrain height sampler for world coordinates
        const createHeightSampler = (seed: number) => (worldX: number, worldZ: number) => {
            // Convert world coordinates to normalized [0,1]
            const normX = (worldX + TERRAIN_GRID_META.worldWidth / 2) / TERRAIN_GRID_META.worldWidth;
            const normZ = (worldZ + TERRAIN_GRID_META.worldHeight / 2) / TERRAIN_GRID_META.worldHeight;
            return sampleHeight(normX, normZ, seed);
        };

        const heightSampler = createHeightSampler(seed);

        // Build meshes with deterministic grid-snapped topology
        const p50Mesh = buildPathMesh({
            curve: p50Curve,
            sampleHeight: heightSampler,
            resolution: TERRAIN_GRID_META.resolution,
            width: 5.4
        });
        const p10Mesh = buildPathMesh({
            curve: p10Curve,
            sampleHeight: heightSampler,
            resolution: TERRAIN_GRID_META.resolution,
            width: 3.2
        });
        const p90Mesh = buildPathMesh({
            curve: p90Curve,
            sampleHeight: heightSampler,
            resolution: TERRAIN_GRID_META.resolution,
            width: 3.2
        });
        const branchMeshL = buildPathMesh({
            curve: branchLeft,
            sampleHeight: heightSampler,
            resolution: TERRAIN_GRID_META.resolution,
            width: 2.0
        });
        const branchMeshR = buildPathMesh({
            curve: branchRight,
            sampleHeight: heightSampler,
            resolution: TERRAIN_GRID_META.resolution,
            width: 2.0
        });
        const glow = createGlowMesh(p50Curve);

        // Generate corridor contact mask for terrain grounding
        if (onMaskReady) {
            const corridorMask = generateCorridorMask(
                [p10Curve, p50Curve, p90Curve, branchLeft, branchRight],
                { width: 560, height: 360 },
                256, // texture resolution
                [3.2, 5.4, 3.2, 2.0, 2.0], // max widths for each curve
                3.0 // falloff distance
            );
            onMaskReady(corridorMask);
        }

        // Add all paths to scene (branches first so p50 stays dominant)
        scene.add(branchMeshL);
        scene.add(branchMeshR);
        scene.add(p10Mesh);
        scene.add(p50Mesh);
        scene.add(p90Mesh);
        scene.add(glow);

        p10Ref.current = p10Mesh;
        p50Ref.current = p50Mesh;
        p90Ref.current = p90Mesh;
        glowRef.current = glow;
        branchLeftRef.current = branchMeshL;
        branchRightRef.current = branchMeshR;

        return () => {
            if (p10Ref.current) {
                scene.remove(p10Ref.current);
                p10Ref.current.geometry.dispose();
            }
            if (p50Ref.current) {
                scene.remove(p50Ref.current);
                p50Ref.current.geometry.dispose();
            }
            if (p90Ref.current) {
                scene.remove(p90Ref.current);
                p90Ref.current.geometry.dispose();
            }
            if (glowRef.current) {
                scene.remove(glowRef.current);
                glowRef.current.geometry.dispose();
            }
            if (branchLeftRef.current) {
                scene.remove(branchLeftRef.current);
                branchLeftRef.current.geometry.dispose();
            }
            if (branchRightRef.current) {
                scene.remove(branchRightRef.current);
                branchRightRef.current.geometry.dispose();
            }
        };
    }, [scene, scenarioId, onMaskReady]);

    return null;
}
