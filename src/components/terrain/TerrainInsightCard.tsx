// src/components/terrain/TerrainInsightCard.tsx
// Floating insight card displayed near the terrain marker when a lens is active.
// Shows KPI label, health level, and AI commentary for the focused KPI.

import React, { useMemo } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import { getLensConfig } from "@/components/terrain/TerrainLensConfig"
import { getKpiCommentary } from "@/domain/intelligence/kpiCommentary"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface Props {
  kpi: KpiKey
  kpis: PositionKpis
  markerPos: { x: number; y: number }
}

const HEALTH_LABEL: Record<string, string> = {
  critical: "CRITICAL",
  watch: "WATCH",
  healthy: "HEALTHY",
  strong: "STRONG",
}

const HEALTH_COLOR: Record<string, string> = {
  critical: "#f87171",
  watch: "#fbbf24",
  healthy: "#22d3ee",
  strong: "#34d399",
}

export default React.memo(function TerrainInsightCard({ kpi, kpis, markerPos }: Props) {
  const lens = getLensConfig(kpi)
  const color = lens?.color ?? "#22D3EE"
  const zone = KPI_ZONE_MAP[kpi]
  const health = getHealthLevel(kpi, kpis)
  const commentary = useMemo(() => getKpiCommentary(kpi, kpis), [kpi, kpis])

  // Position the card to the right of the marker, offset by 20px
  const left = markerPos.x + 20
  const top = markerPos.y - 40

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        zIndex: 25,
        pointerEvents: "none",
        maxWidth: 260,
        animation: "sf-laser-fade-in 0.2s ease-out both",
      }}
    >
      <div
        style={{
          background: "rgba(8, 18, 34, 0.92)",
          border: `1px solid ${color}44`,
          borderRadius: 12,
          padding: "14px 16px",
          backdropFilter: "blur(12px)",
          boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 12px ${color}22`,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header: zone label + health badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color,
            }}
          >
            {zone.label}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: HEALTH_COLOR[health],
              background: `${HEALTH_COLOR[health]}18`,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {HEALTH_LABEL[health]}
          </span>
        </div>

        {/* Station name */}
        <div
          style={{
            fontSize: 9,
            color: "rgba(200,220,240,0.4)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {zone.stationName}
        </div>

        {/* AI commentary */}
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            color: "rgba(200,220,240,0.78)",
          }}
        >
          {commentary}
        </div>
      </div>
    </div>
  )
})
