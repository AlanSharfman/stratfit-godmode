import React from "react";
import { Canvas } from "@react-three/fiber";
import { GOD } from "./godModeColors";
import PositionLightingRig from "./PositionLightingRig";
import PositionAtmosphere from "./PositionAtmosphere";
import PositionCameraRig from "./PositionCameraRig";

type Props = {
  children: React.ReactNode;
};

export default function TerrainStage({ children }: Props) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        stencil: false,
        depth: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [32, 20, 34], fov: 42, near: 0.1, far: 1200 }}
      onCreated={({ gl }) => {
        gl.setClearColor(GOD.bg, 1);
      }}
    >
      <PositionCameraRig />
      <PositionLightingRig />
      <PositionAtmosphere />

      {children}
    </Canvas>
  );
}
