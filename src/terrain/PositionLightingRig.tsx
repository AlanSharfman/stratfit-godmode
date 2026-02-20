import React from "react";

/**
 * Cinematic, stable lighting (no postprocessing).
 * Designed to reveal ridges/valleys and stop the “flat mesh” feel.
 */
export default function PositionLightingRig() {
  return (
    <>
      <ambientLight intensity={0.16} />
      <hemisphereLight intensity={0.20} />

      {/* KEY light — creates relief */}
      <directionalLight position={[18, 14, 12]} intensity={1.05} />

      {/* FILL light — prevents crushed blacks */}
      <directionalLight position={[-14, 8, -10]} intensity={0.28} />

      {/* RIM — separation from background */}
      <directionalLight position={[0, 10, -22]} intensity={0.16} />
    </>
  );
}
