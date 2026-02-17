import React from "react"
import TerrainSurface from "./TerrainSurface"
import P50Path from "@/paths/P50Path"
import TimelineAxis from "./TimelineAxis"
import PathNodes from "./PathNodes"
import StructuralPillars from "./StructuralPillars"

export default function SceneStack() {
  return (
    <group>
      {/* Physical world */}
      <TerrainSurface />

      {/* Simulation trajectory */}
      <P50Path />

      {/* Spatial references */}
      <TimelineAxis />
      <PathNodes />

      {/* Structural layer */}
      <StructuralPillars />
    </group>
  )
}
