import React from "react";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import TerrainSurface from "@/terrain/TerrainSurface";

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
};

export default function SceneStack({ terrainRef }: Props) {
  // SAFE MODE: Only the procedural terrain is allowed.
  // Everything else (path, markers, timeline, HUD, background patches) is disabled.
  return (
    <group>
      <TerrainSurface ref={terrainRef} />
    </group>
  );
}
