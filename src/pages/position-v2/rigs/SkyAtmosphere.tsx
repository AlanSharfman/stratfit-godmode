import React from "react";
import { Sky } from "@react-three/drei";

/**
 * SkyAtmosphere
 * True in-canvas sky dome.
 * Works with alpha Canvas (gl alpha true) and adds depth/scale instantly.
 */
export default function SkyAtmosphere() {
  return (
    <Sky
      distance={4500}
      sunPosition={[0.35, 0.12, -0.65]}
      inclination={0.62}
      azimuth={0.26}
      turbidity={9.5}
      rayleigh={1.2}
      mieCoefficient={0.012}
      mieDirectionalG={0.92}
    />
  );
}
