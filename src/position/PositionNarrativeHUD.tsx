import React from "react"
import { Html } from "@react-three/drei"
import RealityStackPanel from "./RealityStackPanel"
import InsightPanel from "./InsightPanel"
import AnchorStrip from "./AnchorStrip"

// Html fullscreen renders into DOM over canvas.
// Wrapper is pointer-events: none; panels re-enable individually.
export default function PositionNarrativeHUD() {
  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: 16,
          gap: 16,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <RealityStackPanel />
        </div>

        {/* Top-center anchor strip */}
        <div
          style={{
            position: "fixed",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "auto",
          }}
        >
          <AnchorStrip />
        </div>

        <div style={{ pointerEvents: "auto" }}>
          <InsightPanel />
        </div>
      </div>
    </Html>
  )
}
