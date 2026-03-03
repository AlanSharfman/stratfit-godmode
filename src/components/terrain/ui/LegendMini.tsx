// src/components/terrain/ui/LegendMini.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Mini Legend (God Mode)
//
// Always-visible compact legend in the terrain viewport.
// Shows terrain layer key: path, signals, elevation, timeline.
// Unconditionally mounted — never removed by mode switches.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react"

const ITEMS: { color: string; label: string }[] = [
  { color: "#00E0FF", label: "P50 Path" },
  { color: "#22d3ee", label: "Signals" },
  { color: "#3b82f6", label: "Elevation" },
  { color: "#67e8f9", label: "Timeline" },
]

export default function LegendMini() {
  return (
    <div style={S.root}>
      {ITEMS.map((item) => (
        <div key={item.label} style={S.item}>
          <span
            style={{
              ...S.dot,
              background: item.color,
              boxShadow: `0 0 4px ${item.color}55`,
            }}
          />
          <span style={S.label}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    position: "absolute",
    bottom: 48,
    left: 12,
    zIndex: 4,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "6px 10px",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 5,
    backdropFilter: "blur(4px)",
    pointerEvents: "none",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },
  label: {
    fontSize: 8.5,
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "rgba(255,255,255,0.45)",
    fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
  },
}
