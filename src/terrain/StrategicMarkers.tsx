// src/terrain/StrategicMarkers.tsx
// WHY: Mounts the 5 strategic terrain markers (Runway Horizon, Funding Pressure,
// Demand Volatility, Competitive Density, Operational Friction) inside the Canvas.
// Uses StrategicMarkerBeacon (no PositionNarrativeProvider needed).
import React from "react"
import StrategicMarkerBeacon from "./StrategicMarkerBeacon"
import { STRATEGIC_MARKERS } from "./strategicMarkerDefs"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"

type Props = {
  terrainRef?: React.RefObject<TerrainSurfaceHandle>
}

export default function StrategicMarkers({ terrainRef }: Props) {
  return (
    <>
      {STRATEGIC_MARKERS.map((m) => (
        <StrategicMarkerBeacon key={m.id} marker={m} terrainRef={terrainRef} />
      ))}
    </>
  )
}

