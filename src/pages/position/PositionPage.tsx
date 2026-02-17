import React from "react"
import TerrainStage from "@/terrain/TerrainStage"
import TerrainPathSystem from "@/paths/TerrainPathSystem"

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
        {/* Path + timeline system */}
        <TerrainPathSystem />
      </TerrainStage>
    </div>
  )
}
