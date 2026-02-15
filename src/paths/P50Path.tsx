import { useEffect, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { sampleHeight } from "./sampleTerrain";
import { buildSpline } from "./buildSpline";
import { buildPathMesh } from "./buildPathMesh";
import { createGlowMesh } from "./pathGlow";
import { createSeed } from "@/terrain/seed";

// Divergence scaffold constants (deterministic)
const DIVERGENCE_T = 0.62; // fixed, deterministic (no randomness)
const DIVERGENCE_SPREAD = 10; // world units lateral branch hint

export default function P50Path({ scene, scenarioId = "baseline" }: { scene: THREE.Scene; scenarioId?: string }) {
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

        // Build meshes with different visual properties
        const p50Mesh = buildPathMesh(p50Curve, { opacity: 0.75, widthMin: 2.6, widthMax: 5.4 });
        const p10Mesh = buildPathMesh(p10Curve, { opacity: 0.35, widthMin: 1.8, widthMax: 3.2 });
        const p90Mesh = buildPathMesh(p90Curve, { opacity: 0.35, widthMin: 1.8, widthMax: 3.2 });
        const branchMeshL = buildPathMesh(branchLeft, { opacity: 0.12, widthMin: 1.2, widthMax: 2.0 });
        const branchMeshR = buildPathMesh(branchRight, { opacity: 0.12, widthMin: 1.2, widthMax: 2.0 });
        const glow = createGlowMesh(p50Curve);

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
    }, [scene, scenarioId]);

    return null;
}
