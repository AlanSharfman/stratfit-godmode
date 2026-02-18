import React from "react";
import { Canvas } from "@react-three/fiber";
import { useTerrainContrast } from "./TerrainContrast";
import TerrainPathSystem from "@/paths/TerrainPathSystem";

export default function TerrainStage({
  children,
}: {
  children?: React.ReactNode;
}) {
  const contrast = useTerrainContrast();

  return (
    <Canvas
      camera={{ position: [0, 35, 85], fov: 42 }}
      gl={{ antialias: true }}
    >
      <fog
        attach="fog"
        args={[contrast.fog.color, contrast.fog.near, contrast.fog.far]}
      />

      <ambientLight intensity={0.45} />
      <directionalLight position={[25, 40, 20]} intensity={1.1} />

      <TerrainPathSystem />
      {children}
    </Canvas>
  );
}
