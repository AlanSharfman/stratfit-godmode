import React from "react"
import TerrainSurface from "./TerrainSurface"
import P50Path from "@/paths/P50Path"
import TimelineAxis from "./TimelineAxis"
import TimelineTicks from "./TimelineTicks"
import BaselineTimelineTicks from "@/components/terrain/core/BaselineTimelineTicks"
import StructuralPillars from "./StructuralPillars"
import AnnotationAnchors from "./AnnotationAnchors"
import PathNodes from "./PathNodes"

export default function SceneStack() {
  return (
    <group>
      {/* Physical terrain */}
      <TerrainSurface />

      {/* Simulation trajectory */}
      <P50Path />

      {/* Timeline system */}
      <TimelineAxis />
      <TimelineTicks />
      <BaselineTimelineTicks />

      {/* Interaction + semantic anchors */}
      <PathNodes />
      <StructuralPillars />
      <AnnotationAnchors />
    </group>
  )
}
