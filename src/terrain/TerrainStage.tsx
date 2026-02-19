import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import SceneStack from "@/terrain/SceneStack";

export default function TerrainStage() {
  const terrainRef = useRef<TerrainSurfaceHandle>(null!);

  return (
    <Canvas
      camera={{ position: [0, 9, 18], fov: 38, near: 0.1, far: 1500 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#02060B"]} />
      <fog attach="fog" args={["#02060B", 80, 650]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[6, 12, 4]}
        intensity={0.9}
        color={"#CFEFFF"}
      />

      <Suspense fallback={null}>
        <SceneStack terrainRef={terrainRef} />
      </Suspense>
    </Canvas>
  );
}
