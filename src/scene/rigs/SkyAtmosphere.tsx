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
      sunPosition={[0, -0.08, -1]}
      turbidity={12}
      rayleigh={0.25}
      mieCoefficient={0.005}
      mieDirectionalG={0.7}
      inclination={0}
      azimuth={0.25}
    />
  );
}
