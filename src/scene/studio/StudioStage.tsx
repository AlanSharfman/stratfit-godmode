import React from "react";
import StudioOverlays from "./StudioOverlays";

type StudioStageProps = {
  /**
   * Reactive scene subtree (e.g. StudioSceneRoot → ScenarioMountain).
   * ScenarioMountain brings its own <Canvas>, so StudioStage is DOM-only.
   */
  scene: React.ReactNode;

  /**
   * Optional: mount a DOM overlay layer (StudioOverlays by default).
   */
  overlays?: React.ReactNode;
};

/**
 * StudioStage — DOM-only authority wrapper for /studio.
 *
 * Does NOT create a <Canvas>. The injected `scene` (ScenarioMountain)
 * owns its own Canvas, camera, lights, and OrbitControls internally.
 * StudioStage provides:
 *   1. Stable layout container (position:relative, 100% sizing)
 *   2. DOM overlay layer (StudioOverlays — lever pulse, delta emphasis)
 */
export default function StudioStage({
  scene,
  overlays,
}: StudioStageProps) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* CONTENT — ScenarioMountain renders its own Canvas here */}
      {scene}

      {/* DOM overlay layer — guaranteed visible on page */}
      {overlays ?? <StudioOverlays />}
    </div>
  );
}
