import React, { useMemo } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP, KPI_CATEGORY_COLORS, PRIMARY_KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface Props {
  kpis: PositionKpis | null
  revealedKpis: Set<KpiKey>
}

export default React.memo(function TerrainHealthBar({ kpis, revealedKpis }: Props) {
  const zones = useMemo(() => {
    if (!kpis || revealedKpis.size === 0) return []
    return PRIMARY_KPI_KEYS.filter((k) => revealedKpis.has(k)).map((kpi) => {
      const color = KPI_CATEGORY_COLORS[kpi].hex
      return { kpi, label: KPI_ZONE_MAP[kpi].label, color }
    })
  }, [kpis, revealedKpis])

  if (zones.length === 0) return null

  return (
    <div style={{
      position: "absolute",
      top: 12, left: "50%", transform: "translateX(-50%)",
      zIndex: 15, display: "flex", gap: 6,
      background: "rgba(12,20,34,0.82)",
      borderRadius: 14, padding: "12px 22px",
      border: "1px solid rgba(34,211,238,0.12)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      backdropFilter: "blur(10px)",
    }}>
      {zones.map(({ kpi, label, color }) => (
        <div key={kpi} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 52 }} title={label}>
          <div style={{
            width: 40, height: 8, borderRadius: 4,
            background: color,
            opacity: 0.85,
            boxShadow: `0 0 8px ${color}55`,
          }} />
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: "rgba(200,220,240,0.7)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily: "'Inter', system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}>
            {label.split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  )
})
