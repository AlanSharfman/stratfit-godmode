import React from "react";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";
import LavaDivergenceLayer from "@/components/terrain/LavaDivergenceLayer";
import { useLavaIntensity } from "@/logic/lava/useLavaIntensity";

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
};

export default function SceneStack({ terrainRef }: Props) {
  const lava = useLavaIntensity();

  // SAFE MODE: Only the procedural terrain is allowed.
  // Everything else (path, markers, timeline, HUD, background patches) is disabled.
  return (
    <group>
      <TerrainSurface ref={terrainRef} />
      <LavaDivergenceLayer intensity={lava?.overall ?? 0} />
    </group>
  );
}
