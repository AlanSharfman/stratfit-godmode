import React from "react"
import TerrainStage from "@/terrain/TerrainStage"
import BaselineTimelineTicks from "@/components/terrain/core/BaselineTimelineTicks"
import TerrainOverlayHost from "@/terrain/TerrainOverlayHost"

export default function PositionPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0b0f14",
        overflow: "hidden",
      }}
    >
      <TerrainStage>
        {/* Timeline ticks along P50 path */}
        <BaselineTimelineTicks />
        {/* God-mode overlay layers */}
        <TerrainOverlayHost />
      </TerrainStage>
    </div>
  )
}
