import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import StudioOverlays from "./StudioOverlays";

type StudioStageProps = {
  /**
   * Reactive R3F scene subtree.
   * This must be the existing lever-aware scene (e.g. StudioSceneRoot / ScenarioMountain tree).
   * StudioStage is only the authority wrapper (camera/fog/lights).
   */
  scene: React.ReactNode;

  /**
   * Optional: mount a DOM overlay layer (already provided by StudioOverlays by default).
   * If you later want to pass custom overlays, keep it here.
   */
  overlays?: React.ReactNode;

  /**
   * Optional: increase render quality on stronger GPUs.
   * Keep conservative by default.
   */
  dpr?: [number, number];
};

export default function StudioStage({
  scene,
  overlays,
  dpr = [1, 1.75],
}: StudioStageProps) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
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

        {/* DEPTH DISCIPLINE (studio-grade) */}
        <fog attach="fog" args={["#020617", 18, 65]} />

        {/* LIGHT BALANCE (calm, premium, non-dramatic) */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[8, 12, 6]} intensity={0.55} />

        {/* CONTENT (reactive scene is injected here) */}
        <Suspense fallback={null}>{scene}</Suspense>
      </Canvas>

      {/* DOM overlay layer — guaranteed visible on page */}
      {overlays ?? <StudioOverlays />}
    </div>
  );
}
