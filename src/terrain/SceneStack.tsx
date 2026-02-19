import React from "react"
import BackgroundTerrainLayers from "./BackgroundTerrainLayers"
import TerrainSurface from "./TerrainSurface"
import ProbabilityEnvelope from "@/paths/ProbabilityEnvelope"
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
      <BackgroundTerrainLayers />
      <TerrainSurface />
      <HorizonBand />

      <ProbabilityEnvelope />
      <P50Path />

      <TimelineAxis />
      <TimelineTicks />

      <PathNodes />
      <StructuralPillars />
      <AnnotationAnchors />
    </group>
  )
}
