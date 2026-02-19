import React from "react"
import { usePositionNarrative } from "./PositionNarrativeContext"

export default function AnchorStrip() {
  const {
    anchors,
    lockedAnchor,
    hoveredAnchor,
    setHoveredAnchor,
    lockToAnchor,
  } = usePositionNarrative()

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 8,
        padding: 8,
        borderRadius: 999,
        background: "rgba(8,12,16,0.55)",
        border: "1px solid rgba(0, 224, 255, 0.18)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      {anchors.map((a) => {
        const active = lockedAnchor === a.key || (!lockedAnchor && hoveredAnchor === a.key)
        return (
          <button
            key={a.key}
            onMouseEnter={() => setHoveredAnchor(a.key)}
            onMouseLeave={() => setHoveredAnchor(null)}
            onClick={() => lockToAnchor(a.key)}
            style={{
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.14)",
              background: active ? "rgba(0,224,255,0.14)" : "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 11,
              letterSpacing: 0.6,
            }}
          >
            {a.label}
          </button>
        )
      })}
    </div>
  )
}
