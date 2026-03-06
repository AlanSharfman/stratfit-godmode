import React from "react"

interface Props {
  value: number
  compact?: boolean
}

function getBandLabel(value: number): string {
  if (value < 20) return "Very unlikely"
  if (value < 40) return "Low probability"
  if (value < 60) return "Uncertain"
  if (value < 80) return "Likely"
  return "Very likely"
}

function getBandColor(value: number): string {
  if (value < 20) return "#f87171"
  if (value < 40) return "#fb923c"
  if (value < 60) return "#fbbf24"
  if (value < 80) return "#34d399"
  return "#22d3ee"
}

export default function ProbabilityBandPill({ value, compact = false }: Props) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)))
  const label = getBandLabel(safeValue)
  const color = getBandColor(safeValue)

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        padding: compact ? "4px 10px" : "6px 12px",
        borderRadius: 999,
        border: "1px solid rgba(54, 226, 255, 0.20)",
        background: "rgba(8, 20, 38, 0.75)",
        color: "#dff8ff",
        fontSize: compact ? 11 : 12,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <strong style={{ color }}>{safeValue}%</strong>
      <span style={{ color: "rgba(220,240,255,0.7)" }}>{label}</span>
    </div>
  )
}
