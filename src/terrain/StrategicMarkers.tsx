// src/terrain/StrategicMarkers.tsx
import React from "react"
import MarkerBeacon from "./MarkerBeacon"
import { STRATEGIC_MARKERS } from "./strategicMarkerDefs"

export default function StrategicMarkers() {
  return (
    <>
      {STRATEGIC_MARKERS.map((m) => (
        <MarkerBeacon key={m.id} marker={m} />
      ))}
    </>
  )
}

