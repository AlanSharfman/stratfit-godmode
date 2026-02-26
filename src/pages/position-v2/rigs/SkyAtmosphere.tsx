import React from "react";
import { Sky } from "@react-three/drei";

/**
 * SAFE SKY LAYER
 * - Renders inside TerrainStage Canvas (valid R3F context)
 * - Does NOT touch fog
 * - Distance <= camera.far (TerrainStage far=5000)
 */
export default function SkyAtmosphere() {
  return (
    <Sky
      distance={4500}
      sunPosition={[0.35, 0.12, -0.65]}
      turbidity={8.5}
      rayleigh={1.05}
      mieCoefficient={0.012}
      mieDirectionalG={0.92}
      inclination={0.62}
      azimuth={0.26}
    />
  );
}
