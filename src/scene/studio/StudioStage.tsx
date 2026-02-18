import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import TerrainSurface from "@/terrain/TerrainSurface";
import StudioOverlays from "./StudioOverlays";

export default function StudioStage() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
    >
      {/* CAMERA AUTHORITY */}
      <PerspectiveCamera
        makeDefault
        position={[0, 6.5, 11]}
        fov={34}
        near={0.1}
        far={200}
      />

      {/* DEPTH DISCIPLINE */}
      <fog attach="fog" args={["#020617", 18, 65]} />

      {/* LIGHT BALANCE (soft, neutral, non-dramatic) */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[8, 12, 6]} intensity={0.55} />

      <Suspense fallback={null}>
        <TerrainSurface />
        <StudioOverlays />
      </Suspense>
    </Canvas>
  );
}
