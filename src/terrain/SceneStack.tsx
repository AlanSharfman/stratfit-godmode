import React from "react";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import StructuralPressureHeatmap from "@/terrain/layers/StructuralPressureHeatmap";
import LavaDivergenceLayer from "@/components/terrain/LavaDivergenceLayer";
import { useLavaIntensity } from "@/logic/lava/useLavaIntensity";

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
};

export default function SceneStack({ terrainRef }: Props) {
  const lava = useLavaIntensity();

  return (
    <group>
      <TerrainSurface ref={terrainRef} />
      <StructuralPressureHeatmap />
      <LavaDivergenceLayer intensity={lava?.overall ?? 0} />
    </group>
  );
}
