import React from "react"
import TerrainSurface from "./TerrainSurface"
import P50Path from "@/paths/P50Path"
import TimelineAxis from "@/terrain/TimelineAxis"
import StructuralPillars from "@/terrain/StructuralPillars"

export default function SceneStack() {
  return (
    <group>
      <TerrainSurface />
      <P50Path />
      <TimelineAxis />
      <StructuralPillars />
    </group>
  )
}
