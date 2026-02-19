import React, { useState } from "react"
import TerrainStage from "@/terrain/TerrainStage"
import type { TimeGranularity } from "@/position/TimelineTicks"

const GRANULARITY_OPTIONS: { value: TimeGranularity; label: string }[] = [
  { value: "month",   label: "Mo" },
  { value: "quarter", label: "Qtr" },
  { value: "year",    label: "Yr" },
]

export default function PositionPage() {
  const [granularity, setGranularity] = useState<TimeGranularity>("quarter")

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "#0b0f14",
        overflow: "hidden",
      }}
    >
      <TerrainStage granularity={granularity} />

      {/* ── Time scale control — top-right, below nav bar ─────────────── */}
      <div
        style={{
          position:       "absolute",
          top:            "56px",
          right:          "18px",
          display:        "flex",
          alignItems:     "center",
          gap:            "1px",
          background:     "rgba(4, 9, 15, 0.82)",
          border:         "1px solid rgba(182, 228, 255, 0.18)",
          borderRadius:   "5px",
          padding:        "4px 5px",
          backdropFilter: "blur(8px)",
          pointerEvents:  "auto",
          zIndex:         200,
        }}
      >
        <span
          style={{
            fontFamily:    "ui-monospace, 'JetBrains Mono', monospace",
            fontSize:      "10px",
            letterSpacing: "0.1em",
            color:         "rgba(182, 228, 255, 0.50)",
            textTransform: "uppercase",
            paddingRight:  "8px",
            paddingLeft:   "2px",
            whiteSpace:    "nowrap",
          }}
        >
          Time Scale
        </span>
        <div style={{ width: 1, height: 14, background: "rgba(182, 228, 255, 0.12)", marginRight: "3px" }} />
        {GRANULARITY_OPTIONS.map((opt) => {
          const active = granularity === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setGranularity(opt.value)}
              style={{
                fontFamily:    "ui-monospace, 'JetBrains Mono', monospace",
                fontSize:      "11px",
                fontWeight:    active ? 600 : 400,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding:       "4px 10px",
                border:        active
                  ? "1px solid rgba(182, 228, 255, 0.55)"
                  : "1px solid transparent",
                borderRadius:  "3px",
                cursor:        "pointer",
                transition:    "background 0.12s, color 0.12s, border-color 0.12s",
                background:    active ? "rgba(182, 228, 255, 0.14)" : "transparent",
                color:         active ? "#D6F6FF" : "rgba(182, 228, 255, 0.40)",
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
