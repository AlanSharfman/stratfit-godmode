import React from "react";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";

import StructuralPressureHeatmap from "@/terrain/layers/StructuralPressureHeatmap";
import LavaDivergenceLayer from "@/components/terrain/LavaDivergenceLayer";
import FlowlineBand from "@/components/terrain/FlowlineBand";

import { useLavaIntensity } from "@/logic/lava/useLavaIntensity";
import { useFlowlineIntensity } from "@/logic/flowline/useFlowlineIntensity";

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
};

export default function SceneStack({ terrainRef }: Props) {
  const lava = useLavaIntensity();
  const flow = useFlowlineIntensity();

  const axisStart: [number, number, number] = [-60, 0.02, 0];
  const axisEnd: [number, number, number] = [60, 0.02, 0];

  return (
    <group>
      <TerrainSurface ref={terrainRef} />
      <StructuralPressureHeatmap />
      <LavaDivergenceLayer intensity={lava?.overall ?? 0} />

      <FlowlineBand
        terrainRef={terrainRef}
        start={axisStart}
        end={axisEnd}
        intensity01={flow}
      />
    </group>
  );
}
