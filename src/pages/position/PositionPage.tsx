import React from "react"
import TerrainStage from "@/terrain/TerrainStage"

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
      <TerrainStage />
    </div>
  )
}
