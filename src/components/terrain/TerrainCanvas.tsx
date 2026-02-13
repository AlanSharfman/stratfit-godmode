import React from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import TerrainStage from "./TerrainStage";

type Props = {
  terrainGeometry: THREE.BufferGeometry;
  stress?: Float32Array;
  delta?: Float32Array;
  showStrategicOverlay?: boolean;
};

export default function TerrainCanvas({
  terrainGeometry,
  stress,
  delta,
  showStrategicOverlay = false,
}: Props) {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      dpr={[1, 2]}
      camera={{ position: [7.5, 3.8, 9.5], fov: 42, near: 0.1, far: 400 }}
    >
      <TerrainStage
        terrainGeometry={terrainGeometry}
        stress={stress}
        delta={delta}
        showStrategicOverlay={showStrategicOverlay}
      />
    </Canvas>
  );
}
