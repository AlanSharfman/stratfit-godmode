import React from "react"
import TerrainSurface from "./TerrainSurface"
import P50Path from "@/paths/P50Path"
import TimelineAxis from "./TimelineAxis"
import TimelineTicks from "./TimelineTicks"
import StructuralPillars from "./StructuralPillars"
import AnnotationAnchors from "./AnnotationAnchors"
import PathNodes from "./PathNodes"
import HorizonBand from "./HorizonBand"

export default function SceneStack() {
  return (
    <group>
      <TerrainSurface />
      <HorizonBand />

      <P50Path />

      <TimelineAxis />
      <TimelineTicks />

      <PathNodes />
      <StructuralPillars />
      <AnnotationAnchors />
    </group>
  )
}
