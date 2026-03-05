import React from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel, getHealthColor, type HealthColor } from "@/domain/intelligence/kpiZoneMapping"

function colorToCss(c: HealthColor): string {
  return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`
}
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface Props {
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
}

export default function TerrainHealthBar({ kpis, revealedKpis }: Props) {
  if (!kpis || revealedKpis.size === 0) return null

  const zones = KPI_KEYS.filter((k) => revealedKpis.has(k)).map((kpi) => {
    const health = getHealthLevel(kpi, kpis)
    const color = colorToCss(getHealthColor(health))
    return { kpi, label: KPI_ZONE_MAP[kpi].label, health, color }
  })

  return (
    <div style={{
      position: "absolute",
      top: 10, left: "50%", transform: "translateX(-50%)",
      zIndex: 15, display: "flex", gap: 2,
      background: "rgba(4,8,16,0.75)",
      borderRadius: 6, padding: "6px 10px",
      border: "1px solid rgba(34,211,238,0.06)",
    }}>
      {zones.map(({ kpi, label, color, health }) => (
        <div key={kpi} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 28 }} title={`${label}: ${health}`}>
          <div style={{
            width: 20, height: 4, borderRadius: 2,
            background: color,
            opacity: 0.8,
          }} />
          <span style={{
            fontSize: 6, fontWeight: 700,
            color: "rgba(200,220,240,0.3)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "'Inter', system-ui, sans-serif",
            whiteSpace: "nowrap",
            maxWidth: 32, overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {label.split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  )
}
