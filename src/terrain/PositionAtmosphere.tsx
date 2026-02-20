import React from "react";
import { GOD } from "./godModeColors";

/**
 * Atmosphere = scale + depth.
 * Keep subtle (institutional, not “game fog”).
 */
export default function PositionAtmosphere() {
  return (
    <>
      {/* Subtle fog for depth cue */}
      <fog attach="fog" args={[GOD.bg, 26, 140]} />

      {/* Ground/horizon catcher to avoid “floating in void” */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial
          color={GOD.horizon}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </>
  );
}
