// src/terrain/TerrainScene.tsx
// STRATFIT — Base Terrain Geometry
// Phase 3 Terrain Lock

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";

export default function TerrainScene() {
    const material = useMemo(
        () =>
            new MeshStandardMaterial({
                color: "#0e1726",
                roughness: 0.9,
                metalness: 0.05,
            }),
        []
    );

    return (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[400, 400, 256, 256]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}
