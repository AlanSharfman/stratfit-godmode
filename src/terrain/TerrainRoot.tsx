// src/terrain/TerrainRoot.tsx
// STRATFIT — Root Terrain Canvas Host
// Phase 9 Cinematic Camera Lock

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import TerrainScene from "./TerrainScene";
import TerrainOverlayHost from "./TerrainOverlayHost";
import CinematicCameraRig from "./camera/CinematicCameraRig";

export default function TerrainRoot() {
    return (
        <div className="terrainRoot">
            <Canvas
                shadows
                camera={{ position: [0, 35, 85], fov: 45 }}
                gl={{ antialias: true, alpha: false }}
            >
                <Suspense fallback={null}>
                    <CinematicCameraRig />
                    <TerrainScene />
                    <TerrainOverlayHost />
                </Suspense>
            </Canvas>
        </div>
    );
}
