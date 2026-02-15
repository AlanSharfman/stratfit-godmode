import { useEffect, useRef } from "react";
import * as THREE from "three";
import { generateP50Nodes } from "./generatePath";
import { normToWorld } from "@/spatial/SpatialProjector";
import { sampleHeight } from "./sampleTerrain";
import { buildSpline } from "./buildSpline";
import { buildPathMesh } from "./buildPathMesh";
import { createSeed } from "@/terrain/seed";

export default function P50Path({ scene, scenarioId = "baseline" }: { scene: THREE.Scene; scenarioId?: string }) {
    const meshRef = useRef<THREE.Mesh | null>(null);

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

        meshRef.current = mesh;
        scene.add(mesh);

        return () => {
            if (meshRef.current) {
                scene.remove(meshRef.current);
                meshRef.current.geometry.dispose();
            }
        };
    }, [scene, scenarioId]);

    return null;
}
