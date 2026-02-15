import { useEffect, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { sampleHeight } from "./sampleTerrain";
import { buildSpline } from "./buildSpline";
import { buildPathMesh } from "./buildPathMesh";
import { createGlowMesh } from "./pathGlow";
import { createSeed } from "@/terrain/seed";

export default function P50Path({ scene, scenarioId = "baseline" }: { scene: THREE.Scene; scenarioId?: string }) {
    const meshRef = useRef<THREE.Mesh | null>(null);
    const glowRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!scene) return;

        const seed = createSeed(scenarioId);

        const nodes = generateP50Nodes();

        const points: THREE.Vector3[] = nodes.map((n) => {
            const world = normToWorld(n.coord);
            const height = sampleHeight(n.coord.x, n.coord.y, seed);
            return new THREE.Vector3(world.x, world.y, height + 2);
        });

        const spline = buildSpline(points);
        const mesh = buildPathMesh(spline);
        const glow = createGlowMesh(spline);

        scene.add(mesh);
        scene.add(glow);

        meshRef.current = mesh;
        glowRef.current = glow;

        return () => {
            if (meshRef.current) {
                scene.remove(meshRef.current);
                meshRef.current.geometry.dispose();
            }
            if (glowRef.current) {
                scene.remove(glowRef.current);
                glowRef.current.geometry.dispose();
            }
        };
    }, [scene, scenarioId]);

    return null;
}
